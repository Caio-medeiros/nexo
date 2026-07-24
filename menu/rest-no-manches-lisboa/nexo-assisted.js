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
      // Mesmo header x-comanda-token do loadSupabase (RLS 037) — sem ele
      // este fallback conseguiria escrever mas nunca ler o lote em espera.
      _sbClient = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
        global: { fetch: (u, o) => (typeof nexoTokenFetch === 'function' ? nexoTokenFetch(u, o) : fetch(u, o)) },
      });
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
  function fireNtfy(mesa, totalItens, isUpdate) {
    try {
      const TOPIC = CONFIG.NTFY_TOPIC;
      if (!TOPIC) return;
      // Headers HTTP têm de ser ASCII — título sem acentos.
      const prefix = isUpdate ? 'PEDIDO ATUALIZADO: ' : 'CONFIRMAR PEDIDO: ';
      fetch('https://ntfy.sh/' + TOPIC, {
        method: 'POST',
        headers: {
          'Title': prefix + String(mesa || 'Mesa').replace(/[^\x20-\x7E]/g, ''),
          'Priority': 'high',
          'Tags': 'fork_and_knife',
          'Content-Type': 'text/plain; charset=utf-8',
        },
        // fire-and-forget: nunca mais de 5s à espera do ntfy
        ...(typeof AbortSignal !== 'undefined' && AbortSignal.timeout
            ? { signal: AbortSignal.timeout(5000) } : {}),
        body: `${totalItens} itens aguardam confirmação no portal.`,
        keepalive: true,
      }).catch(() => {});
    } catch (_) {}
  }

  // ── comanda (mesma semântica do premium: reutiliza a conta da mesa) ──
  // RLS 037: a busca aberta por table_label já não existe para anon — a
  // comanda ativa da mesa vem da RPC nexo_table_access (token de mesa TAT
  // validado no servidor), que devolve também o client_token de leitura.
  async function openOrGetComanda(tableLabel) {
    const client = await sb();
    const acc = window.NexoAccess;
    // MODELO 043: a MESA é dona da comanda — RPC get-or-create (cria travando a
    // mesa OU junta-se à existente). Nunca cria uma 2.ª comanda para a mesma
    // mesa; o índice único garante-o no servidor.
    if (acc && acc.tokenValidated && acc.tableNumber != null &&
        typeof acc.getTableToken === 'function') {
      try {
        const { data: res } = await client.rpc('nexo_open_table_comanda', {
          p_slug: SLUG,
          p_table_num: acc.tableNumber,
          p_table_token: acc.getTableToken(),
        });
        const c = res && res.valid && res.comanda;
        if (c && c.client_token) {
          if (typeof nexoComandaToken === 'function') nexoComandaToken(c.client_token);
          return { id: c.id, session_code: c.session_code,
                   table_label: c.table_label, status: c.status };
        }
      } catch (_) { /* sem acesso → cria nova */ }
    }
    const meta = acc ? acc.getOrderMetadata() : {};
    // Token de leitura gerado antes do insert — o returning já vem filtrado
    // pela política de SELECT (header x-comanda-token).
    const token = (typeof nexoNewComandaToken === 'function') ? nexoNewComandaToken() : null;
    if (token && typeof nexoComandaToken === 'function') nexoComandaToken(token);
    const { data, error } = await client.from('comandas').insert({
      espaco_slug: SLUG,
      table_label: clean(tableLabel, 50) || 'Mesa',
      guest_count: 1,
      mode: 'dine_in',
      ...(token ? { client_token: token } : {}),
      ...meta,
    }).select('id, session_code, table_label, status').single();
    if (error) {
      // 043: índice único uq_open_comanda_per_table — a mesa já tem uma conta
      // aberta (outro telemóvel/corrida). Sem token de mesa não é possível
      // juntar-se automaticamente; sinaliza-se para pedir ajuda ao staff em vez
      // de criar uma 2.ª comanda (que o servidor bloqueia de qualquer forma).
      if (error.code === '23505') { const e = new Error('TABLE_BUSY'); e.code = 'TABLE_BUSY'; throw e; }
      throw error;
    }
    return data;
  }

  // ── submissão assistida (substitui NEXOPremium.onOrderConfirmed) ──
  // 1.º envio: cria o lote awaiting + esvazia o carrinho local (o snapshot
  // no pending permite repovoar no "Editar pedido"). Envios seguintes com o
  // lote ainda em espera fazem APPEND ao mesmo pedido — o drawer do portal
  // atualiza ao vivo via realtime.
  async function assistedOrderConfirmed() {
    if (_inFlight) return { ok: false, reason: 'locked' };
    // Fase 3 (043): mesa fechada pelo staff → sem novos envios até re-scan.
    if (window._nexoTableClosed) return { ok: false, reason: 'table_closed' };

    _inFlight = true;
    try {
      const isShared = (typeof sharedCart !== 'undefined' && sharedCart);
      const prev = getPending();
      let appendTo = null;
      if (prev && prev.itemIds && prev.itemIds.length) {
        const st = await pendingState(prev);
        if (st === 'awaiting') {
          const cartItems = NEXOPremium.readMenuCart();
          if (!cartItems.length || isShared) return { ok: true, resumed: true };
          appendTo = prev; // carrinho tem itens novos → juntar ao pedido em espera
        } else {
          setPending(null); // resolvido entretanto — segue pedido novo
        }
      }

      const items = NEXOPremium.readMenuCart();
      if (!items.length) return { ok: false, reason: 'empty' };
      // TAT: só bloqueia o envio sem token de mesa quando o venue exige presença
      // (features.comanda.requireTableToken). Por omissão (modo suave), o cliente
      // pode pedir indicando o número da mesa — mas com token válido a comanda é
      // sempre amarrada à mesa física via nexo_open_table_comanda (openOrGetComanda).
      // guardOrder() abre o modal de bloqueio, por isso NÃO o chamamos no modo suave.
      const requireToken = !!(CONFIG.features && CONFIG.features.comanda && CONFIG.features.comanda.requireTableToken);
      if (requireToken && window.NexoAccess && !(await NexoAccess.guardOrder())) return { ok: false, reason: 'blocked' };
      if (NS) {
        const rl = NS.checkRateLimit('order_submit', NS.getSessionId());
        if (!rl.allowed) return { ok: false, reason: 'ratelimit' };
        const v = NS.validateOrderItems(items);
        if (!v.valid) return { ok: false, reason: 'invalid' };
      }
      const tableLabel = appendTo ? appendTo.mesa : NEXOPremium.currentTableLabel();
      const comandaId = appendTo ? appendTo.comandaId
        : (await openOrGetComanda(tableLabel)).id;
      const client = await sb();
      const rows = items.map(i => ({
        comanda_id: comandaId, espaco_slug: SLUG, item_id: i.id,
        item_name: clean(i.name, 200), item_category: i.category,
        item_price: Math.min(Math.max(parsePriceNum(i.price), 0), 999.99),
        quantity: Math.min(Math.max(parseInt(i.qty, 10) || 1, 1), 50),
        notes: i.note || null, added_by: 'customer',
        course: courseFor(i), status: 'awaiting_staff',
      }));
      const { data: inserted, error } = await client.from('comanda_items')
        .insert(rows).select('id');
      if (error) throw error;

      const snapshot = items.map(i => ({ refId: i.id, qty: i.qty || 1, note: i.note || '' }));
      const totalNew = items.reduce((s, i) => s + (i.qty || 1), 0);
      const merged = appendTo ? {
        ...appendTo,
        itemIds: appendTo.itemIds.concat((inserted || []).map(r => r.id)),
        count: (appendTo.count || 0) + totalNew,
        snapshot: (appendTo.snapshot || []).concat(snapshot),
      } : {
        comandaId, itemIds: (inserted || []).map(r => r.id),
        mesa: tableLabel, count: totalNew, ts: Date.now(),
        snapshot,
        // token de leitura da comanda (RLS 037) — viaja no broadcast da mesa
        // para os outros membros conseguirem acompanhar o lote em espera.
        clientToken: (typeof nexoComandaToken === 'function' ? nexoComandaToken() : null),
      };
      setPending(merged);

      // Mesa partilhada: broadcast para TODOS adoptarem o mesmo estado de
      // espera (pill + realtime) e esvaziarem o carrinho da mesa — sem isto
      // só quem tocou sabia do envio e a mesa duplicava pedidos.
      if (isShared) {
        try {
          if (typeof _sharedCartChannel !== 'undefined' && _sharedCartChannel) {
            _sharedCartChannel.send({ type: 'broadcast', event: 'assisted_sent', payload: merged });
          }
          // o broadcast não ecoa para o próprio — aplica localmente também
          if (typeof _applySharedAssistedSent === 'function') _applySharedAssistedSent(merged);
        } catch (_) {}
      }

      // Carrinho local esvazia — o pedido vive agora no lote em espera; o
      // "Editar pedido" repovoa-o a partir do snapshot. (Partilhado: mantém
      // o fluxo clássico, limpo só na confirmação.)
      if (!isShared && typeof clearCart === 'function') { try { clearCart(); } catch (_) {} }

      fireNtfy(tableLabel, merged.count, !!appendTo);
      if (typeof track === 'function') {
        try { track('assisted_order_awaiting', { espaco_slug: SLUG, item_count: items.length, appended: !!appendTo }); } catch (_) {}
      }
      return { ok: true };
    } catch (e) {
      if (e && e.code === 'TABLE_BUSY') {
        try { sharedTableToast('Esta mesa já tem uma conta aberta. Chame o staff para juntar o seu pedido.'); } catch (_) {}
        return { ok: false, reason: 'table_busy' };
      }
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
    // RLS 037: postgres_changes já não chega ao cliente anónimo. O gatilho
    // é o broadcast público SEM dados comanda-ping-<id> (trigger na BD);
    // cada ping reconsulta o lote via REST com o x-comanda-token.
    _channel = client.channel('comanda-ping-' + p.comandaId)
      .on('broadcast', { event: 'change' }, () => resolvePending())
      .subscribe((status) => { if (status === 'SUBSCRIBED') resolvePending(); });
    if (!_pollTimer) {
      _pollTimer = setInterval(() => {
        if (document.visibilityState === 'visible' && navigator.onLine) resolvePending();
      }, 20000);
    }
    clearTimeout(_timeoutId);
    _timeoutId = setTimeout(() => { cleanup(); hideSheet(); removePill(); }, 15 * 60 * 1000);
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
      removePill();
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

  // Pill compacta quando o cliente minimiza o ecrã de espera — o menu fica
  // navegável e um toque reabre o ecrã. Removida quando o pedido resolve.
  function showPill(p) {
    removePill();
    const pill = document.createElement('button');
    pill.id = 'nm-waiting-pill';
    pill.type = 'button';
    pill.innerHTML = `<span class="nm-pill-dot"></span>${escHtml(p.mesa)} · A aguardar staff`;
    pill.addEventListener('click', () => {
      removePill();
      const cur = getPending();
      if (cur) showWaitingScreen(cur); else resolvePending();
    });
    document.body.appendChild(pill);
    requestAnimationFrame(() => pill.classList.add('show'));
  }
  function removePill() {
    const pill = document.getElementById('nm-waiting-pill');
    if (pill) pill.remove();
  }

  function showWaitingScreen(p) {
    removePill();
    const el = sheetEl();
    el.innerHTML = `
      <div id="nm-waiting-screen">
        <button id="nm-minimize-btn" type="button" aria-label="Continuar a ver o menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="nm-icon-wrap"><span class="nm-icon">🙌</span></div>
        <p class="nm-title" id="nm-rotating-msg">${ROTATING[0]}</p>
        <p class="nm-sub">${escHtml(p.mesa)} · ${p.count} ${p.count === 1 ? 'item' : 'itens'}</p>
        <div class="nm-progress-bar"><div class="nm-progress-fill"></div></div>
        <p class="nm-hint">A aguardar confirmação</p>
        <div class="nm-wait-actions">
          <button id="nm-edit-btn" type="button">Editar pedido</button>
          <button id="nm-browse-btn" type="button">Ver o menu</button>
        </div>
      </div>`;
    requestAnimationFrame(() => el.classList.add('show'));

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

    // Minimizar (chevron ou "Ver o menu") → pill; realtime continua vivo.
    const minimize = () => { hideSheet(); showPill(p); };
    const minBtn = document.getElementById('nm-minimize-btn');
    if (minBtn) minBtn.addEventListener('click', minimize);
    const browseBtn = document.getElementById('nm-browse-btn');
    if (browseBtn) browseBtn.addEventListener('click', minimize);

    // "Editar pedido": disponível de imediato; valida no toque se o staff
    // ainda não pegou no pedido (se pegou, resolve para confirmado/cancelado).
    const editBtn = document.getElementById('nm-edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', async () => {
        editBtn.disabled = true;
        const st = await pendingState(p);
        if (st !== 'awaiting') { resolvePending(); return; }
        try {
          const client = await sb();
          await client.from('comanda_items').delete()
            .in('id', p.itemIds).eq('status', 'awaiting_staff');
        } catch (_) {}
        cleanup();
        setPending(null);
        hideSheet();
        removePill();
        // Repovoa o carrinho local a partir do snapshot do pedido em espera
        // e reabre-o — edição imediata, sem itens duplicados.
        try {
          const isShared = (typeof sharedCart !== 'undefined' && sharedCart);
          if (!isShared && p.snapshot && p.snapshot.length && typeof cart !== 'undefined') {
            cart = p.snapshot.map(s => ({ refId: s.refId, qty: s.qty, note: s.note || '' }));
            if (typeof onCartChange === 'function') onCartChange();
          }
          openModal('cart-sheet');
        } catch (_) {}
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

  // ── CSS — identidade No Manches: dourado mostarda #C8952A + terracota
  // #D64C2B sobre fundo escuro #1A1A1A (mesma paleta do hero/menu físico).
  function injectStyles() {
    const GOLD = '#C8952A', GOLD_DARK = '#A67820', RED = '#D64C2B';
    const css = `
#nm-assisted-sheet{position:fixed;left:0;right:0;bottom:0;z-index:2600;transform:translateY(110%);transition:transform .35s cubic-bezier(.32,.72,.28,1);pointer-events:none}
#nm-assisted-sheet.show{transform:translateY(0);pointer-events:auto}
#nm-waiting-screen,#nm-confirmed-screen,#nm-cancelled-screen{position:relative;background:#1A1A1A;color:#fff;border-radius:22px 22px 0 0;padding:26px 22px calc(24px + env(safe-area-inset-bottom));text-align:center;box-shadow:0 -12px 40px rgba(0,0,0,.45);overflow:hidden}
#nm-waiting-screen::before,#nm-confirmed-screen::before,#nm-cancelled-screen::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,${GOLD},${RED})}
#nm-minimize-btn{position:absolute;top:10px;right:12px;background:rgba(255,255,255,.08);border:none;color:${GOLD};border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;cursor:pointer}
.nm-icon-wrap{margin-bottom:6px}
.nm-icon{display:inline-block;font-size:44px;animation:nm-pulse 2s ease-in-out infinite}
@keyframes nm-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:.75}}
.nm-title{font-size:19px;font-weight:700;margin:8px 0 4px;transition:opacity .4s ease}
.nm-sub{font-size:13.5px;color:${GOLD};font-weight:600;margin:0 0 16px}
.nm-progress-bar{height:5px;border-radius:99px;background:rgba(255,255,255,.14);overflow:hidden;margin:0 12px}
.nm-progress-fill{height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,${GOLD},${RED});animation:nm-progress-loop 24s linear infinite}
@keyframes nm-progress-loop{0%{width:0}100%{width:100%}}
.nm-hint{font-size:11.5px;letter-spacing:.4px;text-transform:uppercase;opacity:.5;margin:12px 0 14px}
.nm-wait-actions{display:flex;gap:10px;justify-content:center}
#nm-edit-btn{background:transparent;border:1.5px solid ${GOLD};color:${GOLD};border-radius:11px;padding:11px 20px;font-size:13.5px;font-weight:700;cursor:pointer;min-height:48px}
#nm-edit-btn:disabled{opacity:.5}
#nm-browse-btn{background:transparent;border:1px solid rgba(255,255,255,.22);color:rgba(255,255,255,.75);border-radius:11px;padding:11px 20px;font-size:13.5px;cursor:pointer;min-height:48px}
#nm-waiting-pill{position:fixed;left:50%;transform:translateX(-50%) translateY(-140px);top:calc(112px + env(safe-area-inset-top));z-index:820;display:flex;align-items:center;gap:8px;background:linear-gradient(90deg,${GOLD_DARK},${RED});color:#fff;border:none;border-radius:99px;padding:11px 18px;font-size:13.5px;font-weight:700;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.45);transition:transform .3s cubic-bezier(.32,.72,.28,1);min-height:44px;white-space:nowrap}
#nm-waiting-pill.show{transform:translateX(-50%) translateY(0)}
.nm-pill-dot{width:9px;height:9px;border-radius:50%;background:#fff;animation:nm-pulse 1.6s ease-in-out infinite}
.nm-confirmed-icon,.nm-cancelled-icon{font-size:52px;margin-bottom:4px}
.nm-confirmed-icon{animation:nm-pop .5s cubic-bezier(.34,1.56,.64,1)}
@keyframes nm-pop{0%{transform:scale(0)}70%{transform:scale(1.2)}100%{transform:scale(1)}}
.nm-confirmed-title{font-size:20px;font-weight:800;margin:8px 0 4px;color:${GOLD}}
.nm-cancelled-title{font-size:20px;font-weight:800;margin:8px 0 4px;color:${RED}}
.nm-confirmed-sub,.nm-cancelled-sub{font-size:14px;opacity:.75;line-height:1.5;margin:0 0 18px}
#nm-back-menu{background:linear-gradient(90deg,${GOLD},${GOLD_DARK});border:none;color:#fff;border-radius:12px;padding:12px 26px;font-size:14.5px;font-weight:700;cursor:pointer;min-height:48px}
#nm-back-menu-cancel{background:transparent;border:1.5px solid ${RED};color:${RED};border-radius:12px;padding:12px 26px;font-size:14.5px;font-weight:700;cursor:pointer;min-height:48px}
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
    // o label (t().confirmKitchen) e o estado de loading do botão substitui
    // o innerHTML inteiro (resetKitchenBtn) — por isso observa-se o BOTÃO
    // (que persiste), não o span, e o enforce reencontra o label actual.
    const btn = document.getElementById('confirm-btn-kitchen');
    if (btn && CONFIG.ASSISTED_CTA) {
      const enforce = () => {
        // Nunca tocar no botão em loading (spinner + "A enviar…").
        if (btn.classList.contains('is-loading')) return;
        const lbl = document.getElementById('confirm-kitchen-label');
        if (lbl && lbl.textContent !== CONFIG.ASSISTED_CTA) lbl.textContent = CONFIG.ASSISTED_CTA;
      };
      enforce();
      new MutationObserver(enforce).observe(btn, { childList: true, characterData: true, subtree: true });
    }
  }

  // ── estado adoptado de outro membro da mesa (broadcast 'assisted_sent') ──
  window.NexoAssisted = {
    adoptPending(p) {
      if (!p || !p.comandaId || !p.itemIds || !p.itemIds.length) return;
      // adopta também o token de leitura (RLS 037) — sem ele o pendingState
      // deste dispositivo via 0 linhas e o estado nunca resolvia.
      if (p.clientToken && typeof nexoComandaToken === 'function') nexoComandaToken(p.clientToken);
      const cur = getPending();
      // já temos um estado igual ou mais recente → só garante a subscrição
      if (cur && cur.comandaId === p.comandaId && (cur.ts || 0) >= (p.ts || 0)) {
        subscribePending(cur);
        return;
      }
      setPending(p);
      subscribePending(p);
      // pill discreta — não interrompe quem está a navegar o menu
      const sheetOpen = document.querySelector('#nm-assisted-sheet.show');
      if (!sheetOpen) showPill(p);
    },
  };

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
