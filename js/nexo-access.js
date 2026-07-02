/**
 * NEXO Access Control — Table Access Token (TAT) layer.
 * Validates physical presence via per-table tokens encoded in the NFC/QR URL.
 * Determines FULL mode (ordering allowed) vs BROWSE mode (menu visible,
 * ordering blocked). Browsing from outside is intentionally fine.
 *
 * Loads AFTER nexo-security.js. Auto-initialises on DOMContentLoaded using the
 * menu's loadSupabase() + CONFIG.slug; guards can then be called arg-less.
 *
 * NOTE (adapted to the real schema): opening-hours enforcement is DISABLED —
 * reservations/opening_hours were removed (migration 011) and
 * venue_settings.is_open defaults to false with no portal toggle, so enforcing
 * it would block legitimate orders. The token is the presence control.
 */
(function () {
  'use strict';

  const FOUR_HOURS = 4 * 60 * 60 * 1000;

  const NexoAccess = {
    mode: 'loading',        // 'full' | 'browse' | 'loading'
    tableNumber: null,
    tableLabel: null,
    tokenValidated: false,
    orderSource: 'direct',
    _db: null,
    _slug: null,

    // ── INIT ──────────────────────────────────────────────
    async init(db, espacoSlug) {
      this._db = db;
      this._slug = espacoSlug;

      const params = new URLSearchParams(window.location.search);
      const mesa = params.get('mesa') || params.get('table');
      const tok = params.get('tok') || params.get('token');
      const src = params.get('src'); // 'nfc' | 'qr'

      if (!mesa || !tok) return this.setMode('browse');

      const tableNum = parseInt(mesa, 10);
      if (isNaN(tableNum) || tableNum < 1) return this.setMode('browse');

      try {
        const { data } = await db
          .from('venue_settings')
          .select('table_tokens, table_count')
          .eq('espaco_slug', espacoSlug)
          .maybeSingle();

        if (!data) return this.setMode('browse');

        // Table number out of range → flag + browse
        if (data.table_count && tableNum > data.table_count) {
          this.flagActivity({
            flag_type: 'impossible_table',
            table_label: `Mesa ${tableNum}`,
            details: { attempted: tableNum, max: data.table_count },
          });
          return this.setMode('browse');
        }

        const expected = data.table_tokens?.[String(tableNum)];
        if (!expected || expected !== tok) {
          this.flagActivity({
            flag_type: 'invalid_token',
            table_label: `Mesa ${tableNum}`,
            details: { attempted_tok: String(tok).slice(0, 32) },
          });
          return this.setMode('browse');
        }

        // Valid ✓
        this.tableNumber = tableNum;
        this.tableLabel = `Mesa ${tableNum}`;
        this.tokenValidated = true;
        this.orderSource = src === 'nfc' ? 'nfc' : src === 'qr' ? 'qr' : 'direct';

        try {
          sessionStorage.setItem(`nexo_access_${espacoSlug}`, JSON.stringify({
            tableNumber: tableNum,
            tableLabel: this.tableLabel,
            token: tok,
            source: this.orderSource,
            validatedAt: Date.now(),
          }));
        } catch (_) {}

        return this.setMode('full');
      } catch (e) {
        // Network error → fall back to a recent validated session.
        return this.loadFromCache(espacoSlug);
      }
    },

    // ── CACHE (valid 4h = a meal) ─────────────────────────
    loadFromCache(espacoSlug) {
      try {
        const cached = sessionStorage.getItem(`nexo_access_${espacoSlug}`);
        if (!cached) return this.setMode('browse');
        const data = JSON.parse(cached);
        if (Date.now() - data.validatedAt > FOUR_HOURS) {
          sessionStorage.removeItem(`nexo_access_${espacoSlug}`);
          return this.setMode('browse');
        }
        this.tableNumber = data.tableNumber;
        this.tableLabel = data.tableLabel;
        this.tokenValidated = true;
        this.orderSource = data.source;
        return this.setMode('full');
      } catch (_) {
        return this.setMode('browse');
      }
    },

    // ── APPLY MODE ────────────────────────────────────────
    setMode(mode) {
      this.mode = mode;
      document.body.dataset.accessMode = mode;

      if (mode === 'full') {
        document.getElementById('nexo-browse-banner')?.remove();
        document.querySelectorAll('.table-number-input, [data-table-input]').forEach((input) => {
          if (this.tableNumber) {
            input.value = this.tableNumber;
            input.readOnly = true;
            input.style.opacity = '0.6';
          }
        });
        document.querySelectorAll('[data-current-table]').forEach((el) => {
          el.textContent = this.tableLabel || '';
        });
      }
      return mode;
    },

    // ── GUARDS ────────────────────────────────────────────
    async guardOrder() {
      if (this.mode === 'full' && this.tokenValidated) {
        return await this.checkOpeningHours();
      }
      this.showOrderBlockedMessage('order');
      this.flagActivity({
        flag_type: 'no_token',
        table_label: null,
        details: { attempted_action: 'order', session: this._sid() },
      });
      return false;
    },

    async guardStaffCall() {
      // Chamar empregado é permitido em ambos os modos (full e browse).
      // Sem token de mesa: a chamada entra sem número de mesa — o empregado
      // dirige-se à sala e verifica. Logging de flags apenas para auditoria.
      if (!this.tokenValidated) {
        this.flagActivity({
          flag_type: 'browse_staff_call',
          table_label: null,
          details: { attempted_action: 'staff_call', session: this._sid() },
        });
      }
      return true;
    },

    // ── OPENING HOURS (disabled — see file header) ────────
    async checkOpeningHours() {
      // Enforcement intentionally disabled: is_open defaults false with no
      // portal toggle, and opening_hours no longer exists. Always allow.
      // To re-enable, wire an is_open toggle in the portal then restore:
      //   const { data } = await this._db.from('venue_settings')
      //     .select('is_open').eq('espaco_slug', this._slug).maybeSingle();
      //   if (data && data.is_open === false) { this.showClosedMessage(); return false; }
      return true;
    },

    // ── METADATA ──────────────────────────────────────────
    getOrderMetadata() {
      return { order_source: this.orderSource, had_valid_token: this.tokenValidated };
    },

    // ── FLAGGING (silent; never shown to customer) ────────
    async flagActivity(data) {
      if (!this._db || !this._slug) return;
      try {
        await this._db.from('order_flags').insert({
          espaco_slug: this._slug,
          flag_type: data.flag_type,
          session_id: this._sid(),
          table_label: data.table_label,
          details: data.details || {},
        });
      } catch (_) { /* non-critical */ }
    },

    _sid() {
      try { return window.NexoSecurity ? NexoSecurity.getSessionId() : null; } catch (_) { return null; }
    },

    // ── UI ────────────────────────────────────────────────
    showBrowseBanner() {
      if (document.getElementById('nexo-browse-banner')) return;
      const b = document.createElement('div');
      b.id = 'nexo-browse-banner';
      b.style.cssText =
        'position:fixed;bottom:72px;left:50%;transform:translateX(-50%);background:rgba(10,10,10,.95);' +
        'border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:12px 18px;display:flex;align-items:center;' +
        'gap:12px;font-size:13px;color:#888;z-index:200;max-width:320px;width:calc(100% - 40px);' +
        'backdrop-filter:blur(12px);box-shadow:0 8px 32px rgba(0,0,0,.5)';
      b.innerHTML =
        '<span style="font-size:20px;flex-shrink:0">📋</span>' +
        '<span style="line-height:1.4">A ver o menu. Para pedir, utilize o ' +
        '<strong style="color:#F0F0F0">QR Code da mesa</strong>.</span>';
      document.body.appendChild(b);
    },

    showOrderBlockedMessage(type) {
      const messages = {
        order: { icon: '📱', title: 'Para fazer pedidos', body: 'Utilize o QR Code ou aproxime o telemóvel do display NFC da mesa.' },
        call: { icon: '🙋', title: 'Para chamar o empregado', body: 'Utilize o QR Code da mesa para activar esta função.' },
      };
      const msg = messages[type] || messages.order;
      this._modal(msg.icon, msg.title, msg.body, 'Continuar a ver o menu', true);
    },

    showClosedMessage(openTime, closeTime) {
      const safe = (v) => String(v ?? '').replace(/[<>&"]/g, '').substring(0, 8);
      const timeMsg = openTime && closeTime
        ? `Estamos abertos das ${safe(openTime)} às ${safe(closeTime)}. `
        : 'Verifique os nossos horários. ';
      this._modal('🕐', 'Fora do horário de pedidos', timeMsg + 'Pode continuar a ver o menu.', 'OK', false);
    },

    _modal(icon, title, body, btnLabel, autoDismiss) {
      document.getElementById('nexo-access-modal')?.remove();
      const modal = document.createElement('div');
      modal.id = 'nexo-access-modal';
      modal.style.cssText =
        'position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:flex-end;justify-content:center;z-index:500;padding:20px';
      modal.innerHTML =
        '<div style="background:#141414;border:1px solid rgba(255,255,255,.12);border-radius:20px 20px 16px 16px;padding:24px;max-width:360px;width:100%;text-align:center">' +
        `<div style="font-size:40px;margin-bottom:12px">${icon}</div>` +
        `<h3 style="font-size:17px;font-weight:700;color:#F0F0F0;margin:0 0 8px">${title}</h3>` +
        `<p style="font-size:14px;color:#888;line-height:1.5;margin:0 0 20px">${body}</p>` +
        `<button id="nexo-access-modal-ok" style="width:100%;height:44px;background:#F0F0F0;color:#0A0A0A;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">${btnLabel}</button>` +
        '</div>';
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
      document.body.appendChild(modal);
      document.getElementById('nexo-access-modal-ok').addEventListener('click', () => modal.remove());
      if (autoDismiss) setTimeout(() => modal.remove(), 6000);
    },
  };

  window.NexoAccess = NexoAccess;

  // Auto-init once the menu's Supabase loader is available.
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const slug = (typeof CONFIG !== 'undefined' && CONFIG.slug) ||
        (typeof ESPACO_SLUG !== 'undefined' && ESPACO_SLUG) || null;
      if (!slug) { NexoAccess.setMode('browse'); return; }
      let db = null;
      if (typeof loadSupabase === 'function') {
        try { db = await loadSupabase(); } catch (_) {}
      }
      if (!db) { NexoAccess.loadFromCache(slug); return; }
      await NexoAccess.init(db, slug);
    } catch (_) {
      NexoAccess.setMode('browse');
    }
  });
})();
