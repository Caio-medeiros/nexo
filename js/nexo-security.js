/**
 * NEXO Security Layer
 * Input sanitisation, client-side rate limiting, validation, safe error
 * handling and content-integrity checks. Zero external dependencies.
 *
 * Loaded by the menu template AND the portal (before any other app script),
 * so RLS-side hardening (migration 021) has a matching client-side line of
 * defence. Server-side RLS remains the real boundary — this layer is UX +
 * defence-in-depth.
 *
 * Exposed as window.NexoSecurity.
 */
(function () {
  'use strict';

  const NexoSecurity = {

    // ─────────────────────────────────────────
    // INPUT SANITISATION
    // ─────────────────────────────────────────
    sanitise(input, maxLength = 500) {
      if (input === null || input === undefined) return '';
      return String(input)
        .replace(/<[^>]*>/g, '')          // strip HTML tags
        .replace(/javascript:/gi, '')     // strip js: URIs
        .replace(/on\w+\s*=/gi, '')       // strip inline event handlers
        .replace(/data:text\/html/gi, '') // strip data-html payloads
        .replace(/\0/g, '')               // strip null bytes
        .replace(/\s+/g, ' ')             // normalise whitespace
        .trim()
        .substring(0, maxLength);
    },

    sanitiseNote(input) { return this.sanitise(input, 500); },
    sanitiseName(input) { return this.sanitise(input, 100); },

    sanitisePhone(input) {
      if (!input) return '';
      return String(input).replace(/[^0-9+\s\-]/g, '').trim().substring(0, 20);
    },

    sanitiseSlug(input) {
      if (!input) return '';
      return String(input).toLowerCase().replace(/[^a-z0-9\-]/g, '').substring(0, 100);
    },

    // Safe render: use instead of innerHTML for any user-supplied data.
    safeText(element, text) {
      if (!element) return;
      element.textContent = this.sanitise(text);
    },

    // ─────────────────────────────────────────
    // CLIENT-SIDE RATE LIMITER (localStorage + timestamps)
    // ─────────────────────────────────────────
    RATE_LIMITS: {
      staff_call:     { max: 1, windowMs: 60_000 },
      order_submit:   { max: 5, windowMs: 300_000 },
      waitlist_join:  { max: 2, windowMs: 600_000 },
      comanda_create: { max: 3, windowMs: 300_000 },
      review_click:   { max: 3, windowMs: 3_600_000 },
    },

    checkRateLimit(eventType, sessionId) {
      const limit = this.RATE_LIMITS[eventType];
      if (!limit) return { allowed: true };

      const key = `nexo_rl_${eventType}_${sessionId}`;
      try {
        const stored = localStorage.getItem(key);
        const events = stored ? JSON.parse(stored) : [];
        const now = Date.now();
        const windowStart = now - limit.windowMs;
        const recentEvents = events.filter(t => t > windowStart);

        if (recentEvents.length >= limit.max) {
          const oldestInWindow = Math.min(...recentEvents);
          const retryAfterMs = (oldestInWindow + limit.windowMs) - now;
          return {
            allowed: false,
            retryAfterMs,
            retryAfterSecs: Math.ceil(retryAfterMs / 1000),
            message: this.getRateLimitMessage(eventType, Math.ceil(retryAfterMs / 1000)),
          };
        }

        recentEvents.push(now);
        localStorage.setItem(key, JSON.stringify(recentEvents));
        return { allowed: true };
      } catch (e) {
        // localStorage unavailable (private mode) → never block real users.
        return { allowed: true };
      }
    },

    getRateLimitMessage(eventType, seconds) {
      const mins = Math.ceil(seconds / 60);
      const messages = {
        staff_call:
          `Empregado já foi chamado. Aguarde ${seconds}s antes de chamar de novo.`,
        order_submit:
          `Muitos pedidos em pouco tempo. Aguarde ${mins} minuto${mins !== 1 ? 's' : ''}.`,
        waitlist_join:
          `Já está na lista de espera. Aguarde antes de tentar novamente.`,
        comanda_create:
          `Comanda já aberta para esta mesa.`,
        review_click:
          `Obrigado pela avaliação! Já registámos o seu feedback.`,
      };
      return messages[eventType] || 'Aguarde antes de tentar novamente.';
    },

    clearRateLimit(eventType, sessionId) {
      try { localStorage.removeItem(`nexo_rl_${eventType}_${sessionId}`); } catch (_) {}
    },

    // ─────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────
    validateTableNumber(input, maxTables = 99) {
      const num = parseInt(String(input).trim(), 10);
      if (isNaN(num) || num < 1) {
        return { valid: false, error: 'Número de mesa inválido.' };
      }
      if (num > maxTables) {
        return {
          valid: false,
          error: `Este espaço tem ${maxTables} mesas. Escolha entre 1 e ${maxTables}.`,
        };
      }
      return { valid: true, value: num, label: `Mesa ${num}` };
    },

    validateOrderItems(items) {
      if (!Array.isArray(items) || items.length === 0) {
        return { valid: false, error: 'Sem itens no pedido.' };
      }
      if (items.length > 50) {
        return { valid: false, error: 'Muitos itens num só pedido.' };
      }
      for (const item of items) {
        const name = item && (item.name ?? item.item_name);
        const price = item && (item.price ?? item.item_price);
        const qty = item && (item.qty ?? item.quantity);
        if (!name || !String(name).trim()) {
          return { valid: false, error: 'Item sem nome detectado.' };
        }
        if (price < 0 || price > 1000) {
          return { valid: false, error: 'Preço de item inválido.' };
        }
        if (qty < 1 || qty > 50) {
          return { valid: false, error: 'Quantidade de item inválida.' };
        }
      }
      return { valid: true };
    },

    validatePhone(phone) {
      const cleaned = this.sanitisePhone(phone);
      const digits = cleaned.replace(/\D/g, '');
      if (digits.length < 9) return { valid: false, error: 'Telemóvel inválido.' };
      if (digits.length > 15) return { valid: false, error: 'Número demasiado longo.' };
      return { valid: true, value: cleaned };
    },

    validateGuestCount(count, max = 50) {
      const n = parseInt(count, 10);
      if (isNaN(n) || n < 1) return { valid: false, error: 'Número de pessoas inválido.' };
      if (n > max) return { valid: false, error: `Máximo ${max} pessoas.` };
      return { valid: true, value: n };
    },

    // ─────────────────────────────────────────
    // ERROR HANDLER — never leak schema / IDs / stack traces
    // ─────────────────────────────────────────
    ERROR_MAP: {
      'JWT':            'Sessão inválida. Recarregue a página.',
      'PGRST':          'Erro de dados. Tente novamente.',
      '42501':          'Sem permissão para esta acção.',
      '23503':          'Referência inválida.',
      '23505':          'Este registo já existe.',
      '23514':          'Dados inválidos.',
      'Failed to fetch':'Sem conexão. Verifique a internet.',
      'NetworkError':   'Sem conexão. Verifique a internet.',
      'Load failed':    'Sem conexão. Verifique a internet.',
    },

    getPublicErrorMessage(error) {
      if (!error) return 'Erro desconhecido.';
      const msg = String(error.message || error.code || error);

      for (const [pattern, safe] of Object.entries(this.ERROR_MAP)) {
        if (msg.includes(pattern)) return safe;
      }

      // Safe operational messages produced by NEXO itself.
      if (/Sem itens|mesa inválid|já foi enviado|já anulado|já servido|Número|Aguarde|Muitos/.test(msg)) {
        return msg;
      }

      console.error('[NEXO Error]', error);
      return 'Algo correu mal. Tente novamente.';
    },

    logError(context, error, extra = {}) {
      const entry = {
        timestamp: new Date().toISOString(),
        context,
        message: error?.message || String(error),
        code: error?.code,
        ...extra,
      };
      if (window.location.hostname === 'localhost') {
        console.error('[NEXO Security]', entry);
      } else {
        console.error(`[NEXO] ${context}: ${entry.message}`);
      }
    },

    // ─────────────────────────────────────────
    // SESSION ID (anonymous, per browser session — for rate limiting)
    // ─────────────────────────────────────────
    getSessionId() {
      const key = 'nexo_session_id';
      try {
        let id = sessionStorage.getItem(key);
        if (!id) {
          id = 'sess_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
          sessionStorage.setItem(key, id);
        }
        return id;
      } catch (_) {
        // sessionStorage unavailable → ephemeral id (still rate-limit-able in-page).
        return 'sess_' + Date.now().toString(36);
      }
    },

    // ─────────────────────────────────────────
    // CONTENT INTEGRITY — validate Supabase payloads before rendering
    // ─────────────────────────────────────────
    assertComanda(data) {
      if (!data || typeof data !== 'object') throw new Error('Comanda inválida');
      if (!data.id) throw new Error('Comanda sem ID');
      if (!data.espaco_slug) throw new Error('Comanda sem espaço');
      if (!data.table_label) throw new Error('Comanda sem mesa');
      return true;
    },

    assertComandaItem(item) {
      if (!item || !item.id) throw new Error('Item inválido');
      if (!item.item_name?.trim()) throw new Error('Item sem nome');
      if (item.item_price < 0) throw new Error('Preço negativo');
      if (item.quantity < 1) throw new Error('Quantidade inválida');
      return true;
    },
  };

  window.NexoSecurity = NexoSecurity;
})();
