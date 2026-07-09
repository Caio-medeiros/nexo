/* ═══════════════════════════════════════════════════════════════
   NEXO ASSISTED — Pedido Assistido (VENUE_TYPE: 'assisted')
   ───────────────────────────────────────────────────────────────
   Carregado DEPOIS de script.js + nexo-premium.js. Em venues com
   CONFIG.VENUE_TYPE === 'assisted', o "enviar para a cozinha" passa
   a criar itens 'awaiting_staff' (sem ronda): a cozinha não vê nada
   até um membro do staff confirmar o pedido no portal.

   VENUE_TYPE undefined ou 'direct' → este ficheiro é um no-op total;
   o fluxo clássico (nexo-premium.js) fica 100% intacto.

   Pontos de intercepção (sem tocar no script.js partilhado):
     • NEXOPremium.onOrderConfirmed  → insere itens awaiting_staff
     • showKitchenSentNotification   → mostra o ecrã de espera
     • #confirm-kitchen-label        → CONFIG.ASSISTED_CTA
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (typeof CONFIG === 'undefined' || CONFIG.VENUE_TYPE !== 'assisted') return;
  if (!window.NEXOPremium || !NEXOPremium.comandaRouting) return; // precisa do routing de comandas

  const SLUG = CONFIG.slug;
  const PENDING_KEY = `nexo_assisted_${SLUG}`;
  const NS = window.NexoSecurity || null;
  const clean = (s, n) => (NS ? NS.sanitise(s, n) : s);

  // ── estado ───────────────────────────────────────────────────
  let _channel = null;
  let _sbClient = null;
  let _msgTimer = null;      // rotação de mensagens
  let _pollTimer = null;     // rede de segurança (realtime pode falhar)
  let _timeoutId = null;     // 15 min — desiste de esperar
  let _inFlight = false;

  async function sb() {
    if (_sbClient) return _sbClient;
    if (typeof loadSupabase === 'function') { _sbClient = await loadSupabase(); return _sbClient; }
    if (window.supabase && CONFIG.supabaseUrl) {
      _sbClient = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
      return _sbClient;
    }
    throw new Error('Supabase indisponível');
  }

  function getPending() {
    try { return JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null'); }
    catch (_) { return null; }
  }
  function setPending(p) {
    try {
      if (p) sessionStorage.setItem(PENDING_KEY, JSON.stringify(p));
      else sessionStorage.removeItem(PENDING_KEY);
    } catch (_) {}
  }

  function parsePriceNum(p) {
    if (typeof p === 'number') return p;
    const n = String(p || '').replace(/[^\d.,]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.');
    const v = parseFloat(n);
    return isNaN(v) ? 0 : v;
  }

  // Mesma classificação de course do nexo-premium.js — a cozinha agrupa por isto.
  function courseFor(item) {
    const c = String((item && item.category) || '').toLowerCase();
    if (/bebid|drink|vinho|cerveja|sumo|água|agua|refrig|caf[eé]|bar\b/.test(c)) return 'bebida';
    if (/sobremes|dessert|doce|gelad/.test(c)) return 'sobremesa';
    if (/entrada|starter|petisc|couvert/.test(c)) return 'entrada';
    if (/prato|main|principal|carne|peixe|massa|risot/.test(c)) return 'principal';
    return 'principal';
  }

  // ── ntfy (best-effort, nunca bloqueia nem lança) ─────────────
  function fireNtfy(mesa, totalItens) {
    try {
      const TOPIC = CONFIG.NTFY_TOPIC;
      if (!TOPIC) return;
      // Headers HTTP têm de ser ASCII — título sem acentos.
      fetch('https://ntfy.sh/' + TOPIC, {
        method: 'POST',
        headers: {
          'Title': 'CONFIRMAR PEDIDO: ' + String(mesa || 'Mesa').replace(/[^\x20-\x7E]/g, ''),
          'Priority': 'high',
          'Tags': 'fork_and_knife',
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: `${totalItens} itens aguardam confirmação no portal.`,
        keepalive: true,
      }).catch(() => {});
    } catch (_) {}
  }

  // ── comanda (mesma semântica do premium: reutiliza a conta da mesa) ──
  async function openOrGetComanda(tableLabel) {
    const client = await sb();
    const { data: existing } = await client.from('comandas')
      .select('id, session_code, table_label, status')
      .eq('espaco_slug', SLUG).eq('table_label', tableLabel)
      .in('status', ['open', 'submitted', 'preparing', 'ready'])
      .is('archived_at', null)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (existing) return existing;
    const meta = window.NexoAccess ? NexoAccess.getOrderMetadata() : {};
    const { data, error } = await client.from('comandas').insert({
      espaco_slug: SLUG,
      table_label: clean(tableLabel, 50) || 'Mesa',
      guest_count: 1,
      mode: 'dine_in',
      ...meta,
    }).select('id, session_code, table_label, status').single();
    if (error) throw error;
    return data;
  }

  // ── submissão assistida (substitui NEXOPremium.onOrderConfirmed) ──
  async function assistedOrderConfirmed() {
    if (_inFlight) return { ok: false, reason: 'locked' };

    // Já existe um pedido em espera? Não duplica — volta a mostrar o ecrã.
    const prev = getPending();
    if (prev && prev.itemIds && prev.itemIds.length) {
      const st = await pendingState(prev);
      if (st === 'awaiting') return { ok: true, resumed: true };
      setPending(null); // resolvido entretanto — segue pedido novo
    }

    _inFlight = true;
    try {
      const items = NEXOPremium.readMenuCart();
      if (!items.length) return { ok: false, reason: 'empty' };
      if (window.NexoAccess && !(await NexoAccess.guardOrder())) return { ok: false, reason: 'blocked' };
      if (NS) {
        const rl = NS.checkRateLimit('order_submit', NS.getSessionId());
        if (!rl.allowed) return { ok: false, reason: 'ratelimit' };
        const v = NS.validateOrderItems(items);
        if (!v.valid) return { ok: false, reason: 'invalid' };
      }
      const tableLabel = NEXOPremium.currentTableLabel();
      const comanda = await openOrGetComanda(tableLabel);
      const client = await sb();
      const rows = items.map(i => ({
        comanda_id: comanda.id, espaco_slug: SLUG, item_id: i.id,
        item_name: clean(i.name, 200), item_category: i.category,
        item_price: Math.min(Math.max(parsePriceNum(i.price), 0), 999.99),
        quantity: Math.min(Math.max(parseInt(i.qty, 10) || 1, 1), 50),
        notes: i.note || null, added_by: 'customer',
        course: courseFor(i), status: 'awaiting_staff',
      }));
      const { data: inserted, error } = await client.from('comanda_items')
        .insert(rows).select('id');
      if (error) throw error;

      const totalItens = items.reduce((s, i) => s + (i.qty || 1), 0);
      setPending({
        comandaId: comanda.id,
        itemIds: (inserted || []).map(r => r.id),
        mesa: tableLabel,
        count: totalItens,
        ts: Date.now(),
      });
      fireNtfy(tableLabel, totalItens);
      if (typeof track === 'function') {
        try { track('assisted_order_awaiting', { espaco_slug: SLUG, item_count: items.length }); } catch (_) {}
      }
      return { ok: true };
    } catch (e) {
      console.warn('[NEXO Assisted] submit', e);
      return { ok: false, reason: 'error' };
    } finally {
      _inFlight = false;
    }
  }

  // Estado do lote em espera: 'awaiting' | 'confirmed' | 'cancelled' | 'gone'
  async function pendingState(p) {
    try {
      const client = await sb();
      const { data } = await client.from('comanda_items')
        .select('id, status').in('id', p.itemIds);
      if (!data || !data.length) return 'gone';
      if (data.some(i => i.status === 'awaiting_staff')) return 'awaiting';
      if (data.some(i => i.status !== 'cancelled')) return 'confirmed';
      return 'cancelled';
    } catch (_) { return 'awaiting'; } // fail-safe: continua à espera
  }

  // ── realtime + rede de segurança ─────────────────────────────
  async function subscribePending(p) {
    const client = await sb();
    unsubscribe();
    _channel = client.channel(`assisted_${p.comandaId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'comanda_items',
        filter: `comanda_id=eq.${p.comandaId}`,
      }, () => resolvePending())
      .subscribe((status) => { if (status === 'SUBSCRIBED') resolvePending(); });
    if (!_pollTimer) {
      _pollTimer = setInterval(() => {
        if (document.visibilityState === 'visible' && navigator.onLine) resolvePending();
      }, 20000);
    }
    clearTimeout(_timeoutId);
    _timeoutId = setTimeout(() => { cleanup(); hideSheet(); }, 15 * 60 * 1000);
  }

  let _resolving = false;
  async function resolvePending() {
    if (_resolving) return;
    const p = getPending();
    if (!p) { cleanup(); return; }
    _resolving = true;
    try {
      const st = await pendingState(p);
      if (st === 'awaiting') return;
      cleanup();
      setPending(null);
      if (st === 'confirmed') showConfirmedScreen(p);
      else if (st === 'cancelled') showCancelledScreen();
      else hideSheet(); // 'gone' — resolvido fora do fluxo
    } finally { _resolving = false; }
  }

  function unsubscribe() {
    if (_channel && _sbClient) { try { _sbClient.removeChannel(_channel); } catch (_) {} }
    _channel = null;
  }
  function cleanup() {
    unsubscribe();
    clearInterval(_msgTimer); _msgTimer = null;
    clearInterval(_pollTimer); _pollTimer = null;
    clearTimeout(_timeoutId); _timeoutId = null;
    hideReopenChip();
  }

  // ── UI: chip flutuante para retomar o ecrã de espera fechado ─────
  function chipEl() {
    let el = document.getElementById('nm-reopen-chip');
    if (el) return el;
    el = document.createElement('button');
    el.id = 'nm-reopen-chip';
    el.type = 'button';
    document.body.appendChild(el);
    return el;
  }
  function showReopenChip(p) {
    const el = chipEl();
    el.innerHTML = `<span class="nm-chip-dot"></span><span>${escHtml(p.mesa)} · a confirmar…</span>`;
    el.onclick = () => { hideReopenChip(); showWaitingScreen(p); subscribePending(p); };
    requestAnimationFrame(() => el.classList.add('show'));
  }
  function hideReopenChip() {
    const el = document.getElementById('nm-reopen-chip');
    if (!el) return;
    el.classList.remove('show');
    el.onclick = null;
  }

  // ── UI: ecrã de espera (bottom sheet) ────────────────────────
  const ROTATING = [
    CONFIG.ASSISTED_MSG_WAITING || 'O staff está a caminho 🙌',
    CONFIG.ASSISTED_MSG_REVIEWING || 'A verificar o seu pedido 📋',
    CONFIG.ASSISTED_MSG_ALMOST || 'Quase pronto! 🌮',
  ];

  function sheetEl() {
    let el = document.getElementById('nm-assisted-sheet');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'nm-assisted-sheet';
    document.body.appendChild(el);
    return el;
  }
  function hideSheet() {
    const el = document.getElementById('nm-assisted-sheet');
    if (!el) return;
    el.classList.remove('show');
    setTimeout(() => { el.innerHTML = ''; }, 350);
  }

  function showWaitingScreen(p) {
    hideReopenChip();
    const el = sheetEl();
    el.innerHTML = `
      <div id="nm-waiting-screen">
        <button id="nm-close-btn" type="button" aria-label="Fechar">✕</button>
        <div class="nm-icon-wrap"><span class="nm-icon">🙌</span></div>
        <p class="nm-title" id="nm-rotating-msg">${ROTATING[0]}</p>
        <p class="nm-sub">${escHtml(p.mesa)} · ${p.count} ${p.count === 1 ? 'item' : 'itens'}</p>
        <div class="nm-progress-bar"><div class="nm-progress-fill"></div></div>
        <p class="nm-hint">A aguardar confirmação</p>
        <button id="nm-edit-btn" type="button">Editar pedido</button>
      </div>`;
    requestAnimationFrame(() => el.classList.add('show'));

    // Fechar: sai do ecrã de espera sem tocar no pedido. A confirmação/
    // subscrição continuam em fundo — se o staff resolver entretanto, o
    // resultado aparece de qualquer forma (ver resolvePending). Fica um
    // chip flutuante para voltar ao ecrã de espera a qualquer momento.
    const closeBtn = document.getElementById('nm-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        hideSheet();
        showReopenChip(p);
      });
    }

    // Mensagens rotativas: crossfade a cada 8s (pára na confirmação/cancelamento).
    let idx = 0;
    const msgEl = () => document.getElementById('nm-rotating-msg');
    clearInterval(_msgTimer);
    _msgTimer = setInterval(() => {
      const m = msgEl();
      if (!m) { clearInterval(_msgTimer); return; }
      m.style.opacity = '0';
      setTimeout(() => {
        idx = (idx + 1) % ROTATING.length;
        m.textContent = ROTATING[idx];
        m.style.opacity = '1';
      }, 400);
    }, 8000);

    // "Editar pedido": disponível de imediato — showWaitingScreen só é chamado
    // quando já sabemos que o pedido está 'awaiting' (ver chamadores). O
    // handler abaixo revalida o estado no momento do clique como rede de
    // segurança (o staff pode ter pegado no pedido entretanto).
    const editBtn = document.getElementById('nm-edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', async () => {
        editBtn.disabled = true;
        const st = await pendingState(p);
        if (st !== 'awaiting') { editBtn.style.display = 'none'; resolvePending(); return; }
        try {
          const client = await sb();
          await client.from('comanda_items').delete()
            .in('id', p.itemIds).eq('status', 'awaiting_staff');
        } catch (_) {}
        cleanup();
        setPending(null);
        hideSheet();
        // O carrinho local nunca foi esvaziado — reabre com os itens intactos.
        try { openModal('cart-sheet'); } catch (_) {}
      });
    }
  }

  function showConfirmedScreen(p) {
    const el = sheetEl();
    el.innerHTML = `
      <div id="nm-confirmed-screen">
        <div class="nm-confirmed-icon">🍽️</div>
        <p class="nm-confirmed-title">Pedido confirmado!</p>
        <p class="nm-confirmed-sub">A preparar o seu pedido.<br>Enjoy! 🌮</p>
        <button id="nm-back-menu" type="button">Ver o menu</button>
      </div>`;
    el.classList.add('show');
    if (navigator.vibrate) { try { navigator.vibrate([200, 100, 200]); } catch (_) {} }

    // O pedido passou a ronda: esvazia o carrinho e liga a conta a correr.
    try {
      const isShared = (typeof sharedCart !== 'undefined' && sharedCart);
      if (isShared && typeof notifySharedOrderFired === 'function') {
        notifySharedOrderFired(p.comandaId, p.mesa);
      } else if (typeof clearCart === 'function') {
        clearCart();
      }
    } catch (_) {}
    try { NEXOPremium.renderComandaBar({ id: p.comandaId }); } catch (_) {}

    const dismiss = () => hideSheet();
    const btn = document.getElementById('nm-back-menu');
    if (btn) btn.addEventListener('click', dismiss);
    setTimeout(dismiss, 8000);
  }

  function showCancelledScreen() {
    const el = sheetEl();
    el.innerHTML = `
      <div id="nm-cancelled-screen">
        <div class="nm-cancelled-icon">😔</div>
        <p class="nm-cancelled-title">Pedido cancelado</p>
        <p class="nm-cancelled-sub">Chama um membro do staff<br>se precisares de ajuda.</p>
        <button id="nm-back-menu-cancel" type="button">Ver o menu</button>
      </div>`;
    el.classList.add('show');
    const dismiss = () => hideSheet();
    const btn = document.getElementById('nm-back-menu-cancel');
    if (btn) btn.addEventListener('click', dismiss);
    setTimeout(dismiss, 6000);
  }

  function escHtml(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── CSS ──────────────────────────────────────────────────────
  function injectStyles() {
    const css = `
#nm-assisted-sheet{position:fixed;left:0;right:0;bottom:0;z-index:2600;transform:translateY(110%);transition:transform .35s cubic-bezier(.32,.72,.28,1);pointer-events:none}
#nm-assisted-sheet.show{transform:translateY(0);pointer-events:auto}
#nm-waiting-screen,#nm-confirmed-screen,#nm-cancelled-screen{position:relative;background:#1A1A1A;color:#fff;border-radius:22px 22px 0 0;padding:26px 22px calc(24px + env(safe-area-inset-bottom));text-align:center;box-shadow:0 -12px 40px rgba(0,0,0,.45)}
#nm-close-btn{position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.75);font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .15s ease,background .15s ease,border-color .15s ease,color .15s ease}
#nm-close-btn:active{transform:scale(.88);background:rgba(214,76,43,.35);border-color:rgba(214,76,43,.55);color:#fff}
.nm-icon-wrap{margin-bottom:6px}
.nm-icon{display:inline-block;font-size:44px;animation:nm-pulse 2s ease-in-out infinite}
@keyframes nm-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:.75}}
.nm-title{font-size:19px;font-weight:700;margin:8px 0 4px;transition:opacity .4s ease}
.nm-sub{font-size:13.5px;opacity:.75;margin:0 0 16px}
.nm-progress-bar{height:5px;border-radius:99px;background:rgba(255,255,255,.14);overflow:hidden;margin:0 12px}
.nm-progress-fill{height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,var(--mx-red,#D64C2B) 0%,var(--accent,#C8952A) 50%,#3F7A47 100%);animation:nm-progress-loop 24s linear infinite}
@keyframes nm-progress-loop{0%{width:0}100%{width:100%}}
.nm-hint{font-size:11.5px;letter-spacing:.4px;text-transform:uppercase;opacity:.5;margin:12px 0 14px}
#nm-edit-btn{background:transparent;border:1px solid rgba(255,255,255,.28);color:#fff;border-radius:10px;padding:9px 18px;font-size:13.5px;cursor:pointer;transition:transform .15s ease,border-color .15s ease}
#nm-edit-btn:active{transform:scale(.96);border-color:var(--accent,#C8952A)}
#nm-edit-btn:disabled{opacity:.5}
.nm-confirmed-icon,.nm-cancelled-icon{font-size:52px;margin-bottom:4px}
.nm-confirmed-icon{animation:nm-pop .5s cubic-bezier(.34,1.56,.64,1)}
@keyframes nm-pop{0%{transform:scale(0)}70%{transform:scale(1.2)}100%{transform:scale(1)}}
.nm-confirmed-title,.nm-cancelled-title{font-size:20px;font-weight:800;margin:8px 0 4px}
.nm-confirmed-sub,.nm-cancelled-sub{font-size:14px;opacity:.75;line-height:1.5;margin:0 0 18px}
#nm-back-menu,#nm-back-menu-cancel{background:var(--accent,#C8952A);border:none;color:#fff;border-radius:12px;padding:12px 26px;font-size:14.5px;font-weight:700;cursor:pointer;min-height:48px}

/* Chip flutuante: retomar o ecrã de espera depois de o fechar */
#nm-reopen-chip{position:fixed;left:50%;bottom:calc(88px + env(safe-area-inset-bottom));transform:translate(-50%,10px);z-index:165;display:flex;align-items:center;gap:8px;max-width:calc(100% - 32px);padding:10px 16px;border-radius:100px;background:#1A1A1A;border:1px solid rgba(200,149,42,.45);box-shadow:0 8px 26px rgba(0,0,0,.35);color:#fff;font-family:var(--font-ui);font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:0;pointer-events:none;cursor:pointer;transition:opacity .25s ease,transform .25s cubic-bezier(.34,1.56,.64,1)}
#nm-reopen-chip.show{opacity:1;transform:translate(-50%,0);pointer-events:auto}
#nm-reopen-chip:active{transform:translate(-50%,0) scale(.95)}
.nm-chip-dot{width:8px;height:8px;border-radius:50%;background:var(--mx-red,#D64C2B);flex-shrink:0;animation:nm-pulse 1.6s ease-in-out infinite}
`;
    const s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ── intercepções ─────────────────────────────────────────────
  function patch() {
    // 1) Submissão: awaiting_staff em vez de disparar ronda.
    NEXOPremium.onOrderConfirmed = assistedOrderConfirmed;

    // 2) Notificação "enviado para a cozinha" → ecrã de espera assistido.
    const origSent = window.showKitchenSentNotification;
    window.showKitchenSentNotification = function () {
      const p = getPending();
      if (p) {
        showWaitingScreen(p);
        subscribePending(p);
        return;
      }
      if (typeof origSent === 'function') origSent();
    };

    // 3) CTA principal do ecrã de confirmação. O render do ecrã reescreve
    // o label (t().confirmKitchen) a cada abertura/mudança de idioma — um
    // observer garante que o CTA assistido ganha sempre.
    const label = document.getElementById('confirm-kitchen-label');
    if (label && CONFIG.ASSISTED_CTA) {
      const enforce = () => {
        if (label.textContent !== CONFIG.ASSISTED_CTA) label.textContent = CONFIG.ASSISTED_CTA;
      };
      enforce();
      new MutationObserver(enforce).observe(label, { childList: true, characterData: true, subtree: true });
    }
  }

  // ── init ─────────────────────────────────────────────────────
  function init() {
    injectStyles();
    patch();
    // Retoma um pedido em espera desta sessão (reload / regresso à página).
    const p = getPending();
    if (p && p.itemIds && p.itemIds.length) {
      pendingState(p).then(st => {
        if (st === 'awaiting') { showWaitingScreen(p); subscribePending(p); }
        else if (st === 'confirmed') { setPending(null); showConfirmedScreen(p); }
        else setPending(null);
      });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
