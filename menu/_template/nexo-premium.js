/* ═══════════════════════════════════════════════════════════════
   NEXO PREMIUM — Menu add-ons
   Comanda (full table order)  ·  Promotional banners
   ───────────────────────────────────────────────────────────────
   Additive, backward-compatible layer. Loaded AFTER script.js, so it
   shares the global scope (CONFIG, cart, currentLang, loadSupabase,
   ESPACO_SLUG). Everything is opt-in via CONFIG.features and degrades
   to a no-op when disabled or when Supabase is unavailable.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const F = (typeof CONFIG !== 'undefined' && CONFIG.features) || {};
  // "comanda" liga o encaminhamento de pedidos p/ Cozinha/Caixa/Salão.
  const HAS_COMANDA = !!(F.comanda && F.comanda.enabled);
  const HAS_BANNERS = !!(F.banners && F.banners.enabled);
  if (!HAS_COMANDA && !HAS_BANNERS) return; // nothing to do

  const SLUG = (typeof ESPACO_SLUG !== 'undefined' && ESPACO_SLUG) ||
               (typeof CONFIG !== 'undefined' && CONFIG.slug) || null;
  const lang = () => (typeof currentLang !== 'undefined' ? currentLang : 'pt');

  // Security layer (defence-in-depth; degrades gracefully if not loaded).
  const NS = window.NexoSecurity || null;
  const clean     = (s, n) => (NS ? NS.sanitise(s, n) : s);
  const cleanNote = (s)    => (s ? (NS ? NS.sanitiseNote(s) : s) : null);

  // ── helpers ──────────────────────────────────────────────────
  function parsePrice(p) {
    if (typeof p === 'number') return p;
    if (!p) return 0;
    const n = String(p).replace(/[^\d.,]/g, '').replace(/\.(?=\d{3})/g, '')
      .replace(',', '.');
    const v = parseFloat(n);
    return isNaN(v) ? 0 : v;
  }
  function fmtEUR(v) {
    return '€' + (Number(v) || 0).toFixed(2).replace('.', ',');
  }
  function resolveRef(refId) {
    if (!refId || typeof CONFIG === 'undefined') return null;
    const [sectionId, idx] = refId.split(':');
    // Bebidas do separador Drinks (wines[]) — categoria "Bebidas" faz o
    // courseFor() classificar como course 'bebida' para a cozinha.
    if (sectionId === 'bebidas') {
      const w = (CONFIG.wines || [])[parseInt(idx, 10)];
      if (!w) return null;
      return { id: refId, name: w.name, category: 'Bebidas', price: parsePrice(w.price) };
    }
    const section = (CONFIG.menu || []).find(s => s.id === sectionId);
    if (!section) return null;
    const item = section.items[parseInt(idx, 10)];
    if (!item) return null;
    const name = (item.name && (item.name[lang()] || item.name.pt)) || 'Item';
    const cat = (section.section && (section.section[lang()] || section.section.pt)) || sectionId;
    return { id: refId, name, category: cat, price: parsePrice(item.price) };
  }
  // Reads the menu's local cart (array of { refId, qty, note }).
  function readLocalCart() {
    const src = (typeof cart !== 'undefined' && Array.isArray(cart)) ? cart : [];
    return src.map(row => {
      const it = resolveRef(row.refId);
      if (!it) return null;
      return { id: it.id, name: it.name, category: it.category,
               price: it.price, qty: row.qty || 1, note: row.note || '' };
    }).filter(Boolean);
  }
  let _sb = null;
  async function sb() {
    if (_sb) return _sb;
    if (typeof loadSupabase === 'function') { _sb = await loadSupabase(); return _sb; }
    if (window.supabase && CONFIG.supabaseUrl) {
      _sb = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
      return _sb;
    }
    throw new Error('Supabase indisponível');
  }
  function toast(msg) {
    if (typeof showCartToast === 'function') return showCartToast(msg);
    console.log('[NEXO]', msg);
  }

  // ════════════════════════════════════════════════════════════
  // MODO — só "na mesa" (take-away removido; mantém-se simples)
  // ════════════════════════════════════════════════════════════
  const modeSwitcher = { current: 'dine_in' };

  // WhatsApp message builder (PT) — sempre pedido na mesa.
  function buildWhatsAppMessage(items, tableLabel) {
    const lines = items.map(i =>
      `• ${i.qty}× ${i.name}` + (i.note ? `\n  ↳ ${i.note}` : '') +
      ` — ${fmtEUR(i.price * i.qty)}`).join('\n');
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    return `🍽️ *Pedido* — ${tableLabel || 'Mesa'}\n\n${lines}\n\n` +
      `*Total: ${fmtEUR(total)}*\n\n_via NEXO Menu_`;
  }
  window.nexoBuildWhatsAppMessage = buildWhatsAppMessage;

  // ════════════════════════════════════════════════════════════
  // PHASE 2 — COMANDA
  // ════════════════════════════════════════════════════════════
  const COMANDA_KEY = `nexo_comanda_${SLUG}`;
  function getStoredComanda() {
    try { return JSON.parse(sessionStorage.getItem(COMANDA_KEY) || 'null'); }
    catch (_) { return null; }
  }
  function storeComanda(c) {
    try { sessionStorage.setItem(COMANDA_KEY, JSON.stringify(c)); } catch (_) {}
  }

  async function createComanda(tableLabel, guestCount) {
    const client = await sb();
    const meta = window.NexoAccess ? NexoAccess.getOrderMetadata() : {};
    const { data, error } = await client.from('comandas').insert({
      espaco_slug: SLUG,
      table_label: clean(tableLabel, 50) || 'Mesa',
      guest_count: Math.min(Math.max(parseInt(guestCount, 10) || 1, 1), 100),
      mode: 'dine_in',
      ...meta, // order_source + had_valid_token (TAT)
    }).select('id, session_code, table_label, status').single();
    if (error) throw error;
    storeComanda(data);
    return data;
  }

  async function joinComanda(code) {
    const client = await sb();
    const { data, error } = await client.from('comandas')
      .select('id, session_code, table_label, status, guest_count')
      .eq('session_code', String(code).toUpperCase())
      .eq('espaco_slug', SLUG).eq('status', 'open').maybeSingle();
    if (error || !data) throw new Error('Código inválido ou comanda fechada');
    storeComanda(data);
    return data;
  }

  async function addItemsToComanda(comandaId, items) {
    if (!items.length) return;
    const client = await sb();
    const rows = items.map(i => ({
      comanda_id: comandaId, espaco_slug: SLUG, item_id: i.id,
      item_name: clean(i.name, 200), item_category: i.category,
      item_price: Math.min(Math.max(Number(i.price) || 0, 0), 999.99),
      quantity: Math.min(Math.max(parseInt(i.qty, 10) || 1, 1), 50),
      notes: cleanNote(i.note), added_by: 'customer',
      round_number: window.nexoComandaRound || 1,
    }));
    const { error } = await client.from('comanda_items').insert(rows);
    if (error) throw error;
  }

  async function submitComanda(comandaId) {
    const client = await sb();
    const { data, error } = await client.from('comandas').update({
      status: 'submitted', submitted_at: new Date().toISOString(),
    }).eq('id', comandaId).select('total, table_label, mode, session_code').single();
    if (error) throw error;
    if (typeof track === 'function') {
      try { track('comanda_submitted', { espaco_slug: SLUG, total: data.total, mode: data.mode }); } catch (_) {}
    }
    return data;
  }

  // High-level: take the current local cart → create+fill+submit a comanda,
  // then also fire WhatsApp (backward-compatible confirmation channel).
  async function sendCartAsComanda(tableLabel) {
    const items = readLocalCart();
    if (!items.length) { toast('Carrinho vazio'); return null; }
    // TAT: bloqueia pedidos sem token de mesa válido (modo BROWSE).
    if (window.NexoAccess && !(await NexoAccess.guardOrder())) return null;
    // Anti-spam + integrity (defence-in-depth; RLS enforces server-side).
    if (NS) {
      const sid = NS.getSessionId();
      const rl = NS.checkRateLimit('order_submit', sid);
      if (!rl.allowed) { toast(rl.message); return null; }
      const v = NS.validateOrderItems(items);
      if (!v.valid) { toast(v.error); return null; }
    }
    let comanda = getStoredComanda();
    if (!comanda || comanda.status !== 'open') {
      comanda = await createComanda(tableLabel, 1);
    }
    await addItemsToComanda(comanda.id, items);
    const submitted = await submitComanda(comanda.id);
    sessionStorage.removeItem(COMANDA_KEY);
    renderComandaBar(null);
    // WhatsApp confirmation
    const num = CONFIG.whatsappNumber;
    if (num && num !== '{{WHATSAPP_NUMBER}}') {
      const msg = buildWhatsAppMessage(items, tableLabel);
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
    }
    toast('Comanda enviada para a cozinha ✓');
    return submitted;
  }
  window.nexoSendCartAsComanda = sendCartAsComanda;

  // ════════════════════════════════════════════════════════════
  // RUNNING TAB (comanda-bar) + sent-rounds view
  // Depois de disparar uma ronda, o cliente mantém um "separador":
  // uma barra fixa com mesa + total + estado da cozinha, e o detalhe
  // por ronda dentro do painel do carrinho ("Já enviado" + conta).
  // ════════════════════════════════════════════════════════════
  let _comandaCh = null;
  let _activeComandaId = null;
  let _barMiniTimer = null;

  const ITEM_ICON = { pending: '🛒', sent: '⏳', preparing: '🔥', ready: '✅', served: '✓', delivered: '✓', cancelled: '✗' };
  const ITEM_STATUS_PT = { pending: 'No carrinho', sent: 'Enviado', preparing: 'A preparar', ready: 'Pronto', served: 'Servido', delivered: 'Servido' };
  const TAB_STATUS = { open: '🛒 Em aberto', submitted: '⏳ Na cozinha', preparing: '🔥 Em preparação', ready: '✅ Pronto' };

  function renderTabBar(info) {
    clearTimeout(_barMiniTimer);
    // Remove any leftover floating bar from a previous session
    const old = document.getElementById('comanda-bar');
    if (old) old.remove();
    // Expose comanda state globally so renderCartPill() in script.js can read it
    window._nexoComandaInfo = info || null;
    // Refresh the central cart pill to reflect comanda state
    if (typeof renderCartPill === 'function') renderCartPill();
  }
  function openTabSheet() { try { openModal('cart-sheet'); } catch (_) {} }

  async function loadTab(comandaId) {
    const client = await sb();
    const [cRes, rRes, iRes] = await Promise.all([
      client.from('comandas').select('id, table_label, status, total').eq('id', comandaId).maybeSingle(),
      client.from('comanda_rounds').select('id, round_number, fired_at, status').eq('comanda_id', comandaId).order('round_number'),
      client.from('comanda_items').select('id, item_name, quantity, item_price, status, round_id').eq('comanda_id', comandaId).order('created_at'),
    ]);
    return { comanda: cRes.data, rounds: rRes.data || [], items: iRes.data || [] };
  }

  async function refreshTab() {
    if (!_activeComandaId) return;
    let data;
    try { data = await loadTab(_activeComandaId); } catch (_) { return; }
    if (!data.comanda || data.comanda.status === 'closed' || data.comanda.status === 'cancelled') { clearTab(); return; }
    const hasSent = (data.items || []).some(i => i.round_id && i.status !== 'cancelled');
    if (!hasSent) { renderTabBar(null); hideSentSection(); return; } // ainda sem nada enviado
    renderTabBar(data.comanda);
    renderSentSection(data);
  }

  function clearTab() {
    _activeComandaId = null;
    sessionStorage.removeItem(COMANDA_KEY);
    renderTabBar(null);
    hideSentSection();
    if (_comandaCh) { try { _sb.removeChannel(_comandaCh); } catch (_) {} _comandaCh = null; }
  }
  function hideSentSection() { const s = document.getElementById('nexo-sent-section'); if (s) { s.style.display = 'none'; s.innerHTML = ''; } }

  // Secção "Já enviado" injectada no topo do painel (abaixo das tabs, antes
  // dos novos itens) — sobrevive aos re-renders do menu (só tocam em #cart-list).
  function renderSentSection(data) {
    const panel = document.getElementById('panel-order');
    if (!panel) return;
    let sec = document.getElementById('nexo-sent-section');
    if (!sec) {
      sec = document.createElement('div');
      sec.id = 'nexo-sent-section';
      sec.className = 'nexo-sent-section';
      const cartList = panel.querySelector('.cart-list');
      if (cartList) cartList.insertAdjacentElement('beforebegin', sec);
      else panel.insertBefore(sec, panel.firstChild);
    }
    const sent = (data.items || []).filter(i => i.round_id && i.status !== 'cancelled');
    if (!sent.length) { sec.style.display = 'none'; sec.innerHTML = ''; return; }
    sec.style.display = 'block';

    const roundById = {};
    (data.rounds || []).forEach(r => { roundById[r.id] = r; });
    const byRound = {};
    sent.forEach(i => { (byRound[i.round_id] = byRound[i.round_id] || []).push(i); });
    const orderedRoundIds = Object.keys(byRound).sort((a, b) =>
      ((roundById[a] && roundById[a].round_number) || 0) - ((roundById[b] && roundById[b].round_number) || 0));

    const SVG_CHECK = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;
    const SVG_CLOCK = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    const SVG_DOTS  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>`;
    const SVG_BELL  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;

    const bill = (data.items || []).filter(i => i.status !== 'cancelled')
      .reduce((s, i) => s + (i.item_price || 0) * i.quantity, 0);

    let roundsHtml = '';
    orderedRoundIds.forEach(rid => {
      const r = roundById[rid] || {};
      const time = r.fired_at ? new Date(r.fired_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '';
      const rsvg = r.status === 'done' ? SVG_CHECK : r.status === 'acknowledged' ? SVG_DOTS : SVG_CLOCK;
      const rCls = r.status === 'done' ? 'ns-status--done' : 'ns-status--pending';
      const label = (r.round_number === 1) ? '1.ª Ronda' : `${r.round_number}.ª Ronda`;
      roundsHtml += `<div class="nexo-round-head">
        <span class="nexo-round-label">${label}</span>
        <span class="nexo-round-time">${time}</span>
        <span class="nexo-round-svg ${rCls}">${rsvg}</span>
      </div>`;
      byRound[rid].forEach(it => {
        const isvg = (it.status === 'done' || it.status === 'served') ? SVG_CHECK
                   : it.status === 'preparing' ? SVG_DOTS : SVG_CLOCK;
        const iCls = (it.status === 'done' || it.status === 'served') ? 'ns-status--done'
                   : it.status === 'preparing' ? 'ns-status--prep' : 'ns-status--pending';
        roundsHtml += `<div class="nexo-sent-item">
          <span class="nexo-sent-name">${escapeHTML(it.item_name)}</span>
          <span class="nexo-sent-qty">×${it.quantity}</span>
          <span class="nexo-sent-status ${iCls}" title="${ITEM_STATUS_PT[it.status] || ''}">${isvg}</span>
        </div>`;
      });
    });

    sec.innerHTML = `
      <div class="ns-header">
        <span class="ns-label">Já enviado</span>
        <span class="ns-total">${fmtEUR(bill)}</span>
      </div>
      <div class="ns-rounds">${roundsHtml}</div>
      <div class="ns-hint">${SVG_BELL}<span>Peça a conta ao empregado</span></div>
    `;
  }

  async function subscribeTab(comandaId) {
    const client = await sb();
    if (_comandaCh) { try { client.removeChannel(_comandaCh); } catch (_) {} }
    _comandaCh = client.channel(`tab_${comandaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comanda_items', filter: `comanda_id=eq.${comandaId}` }, () => refreshTab())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comanda_rounds', filter: `comanda_id=eq.${comandaId}` }, () => refreshTab())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comandas', filter: `id=eq.${comandaId}` }, () => refreshTab())
      .subscribe();
  }

  async function activateTab(comandaId) {
    if (!comandaId) return;
    _activeComandaId = comandaId;
    await subscribeTab(comandaId);
    await refreshTab();
  }
  // Compat: chamadas antigas usavam renderComandaBar(null) p/ encerrar.
  function renderComandaBar(c) { if (!c) clearTab(); else activateTab(c.id); }

  // Staff takeover QR inside the staff fullscreen view.
  function mountStaffTakeover() {
    const view = document.querySelector('#staff-view .staff-inner');
    if (!view || document.getElementById('staff-qr-canvas')) return;
    const comanda = getStoredComanda();
    if (!comanda) return;
    const section = document.createElement('div');
    section.className = 'staff-takeover-section';
    section.innerHTML = `
      <p class="staff-takeover-label">A equipa pode adicionar itens</p>
      <canvas id="staff-qr-canvas" width="120" height="120"></canvas>
      <p class="staff-qr-hint">Escanear para gerir esta comanda</p>`;
    view.appendChild(section);
    const url = `https://nexosolutions.pt/portal/sala/?comanda=${comanda.session_code}&slug=${SLUG}`;
    drawQR(url, document.getElementById('staff-qr-canvas'));
  }
  // Minimal QR: use existing global if present, else load a tiny lib lazily.
  function drawQR(text, canvas) {
    if (window.QRCode && window.QRCode.toCanvas) {
      window.QRCode.toCanvas(canvas, text, { width: 120, margin: 1 }, () => {});
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
    s.onload = () => { try { window.QRCode.toCanvas(canvas, text, { width: 120, margin: 1 }, () => {}); } catch (_) {} };
    document.head.appendChild(s);
  }

  // ════════════════════════════════════════════════════════════
  // PHASE 3 — PROMOTIONAL BANNERS
  // ════════════════════════════════════════════════════════════
  async function loadBanners() {
    if (!HAS_BANNERS || !SLUG) return;
    let client;
    try { client = await sb(); } catch (_) { return; }
    const now = new Date().toISOString();
    const { data } = await client.from('menu_banners').select('*')
      .eq('espaco_slug', SLUG).eq('is_active', true)
      .lte('starts_at', now)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('display_order');
    if (data && data.length) renderBanners(data);
  }
  function renderBanners(banners) {
    let cont = document.getElementById('menu-banners');
    if (!cont) {
      cont = document.createElement('div');
      cont.id = 'menu-banners';
      const tabs = document.getElementById('category-tabs');
      if (tabs && tabs.parentNode) tabs.parentNode.insertBefore(cont, tabs);
      else document.body.appendChild(cont);
    }
    // Valores vindos da BD só entram em atributos depois de saneados —
    // cores restringidas a caracteres CSS seguros, ids sem aspas.
    const cssColor = (c, fb) => (/^[#a-zA-Z0-9(),.%\s-]+$/.test(String(c ?? '')) ? c : fb);
    const safeAttr = (v) => String(v ?? '').replace(/["'<>&]/g, '');
    cont.innerHTML = banners.map((b, i) => `
      <div class="menu-banner" ${b.link_item_id ? `data-link="${safeAttr(b.link_item_id)}"` : ''}
        style="background:${cssColor(b.bg_color, '#333')};color:${cssColor(b.text_color, '#fff')};animation-delay:${i * 80}ms">
        <span class="banner-title">${escapeHTML(b.title)}</span>
        ${b.subtitle ? `<span class="banner-sub">${escapeHTML(b.subtitle)}</span>` : ''}
        ${b.link_item_id ? `<span class="banner-arrow">→</span>` : ''}
      </div>`).join('');
    cont.querySelectorAll('.menu-banner[data-link]').forEach(el =>
      el.addEventListener('click', () => scrollToItem(el.dataset.link)));
  }
  function scrollToItem(refId) {
    const el = document.querySelector(`[data-item="${refId}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function escapeHTML(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Confirm-flow integration ─────────────────────────────────
  // Reads whichever cart the menu is using (local `cart` or the
  // Broadcast `sharedCartItems`) and maps it to comanda items.
  function readMenuCart() {
    const isShared = (typeof sharedCart !== 'undefined' && sharedCart);
    if (isShared && typeof sharedCartItems !== 'undefined' && Array.isArray(sharedCartItems)) {
      return sharedCartItems.map(row => {
        const it = resolveRef(row.item_id);
        return { id: row.item_id, name: (it && it.name) || row.item_name || 'Item',
                 category: it ? it.category : null,
                 price: it ? it.price : (row.item_price || 0),
                 qty: row.quantity || 1, note: row.note || '' };
      }).filter(Boolean);
    }
    return readLocalCart();
  }

  // Nº de pessoas a partilhar a mesa via menu (carrinho partilhado). 1 se
  // não houver partilha. _memberStates vive no script.js (mesmo escopo global).
  function sharedGuestCount() {
    try {
      const isShared = (typeof sharedCart !== 'undefined' && sharedCart);
      if (isShared && typeof _memberStates !== 'undefined' && _memberStates) {
        const n = Object.keys(_memberStates).length;
        if (n > 1) return n;
      }
    } catch (_) {}
    return 1;
  }

  // Table label from the confirm screen (e.g. "Mesa 4").
  function currentTableLabel() {
    const input = document.getElementById('confirm-table-input');
    const v = (input && input.value.trim()) ||
             (typeof confirmTableValue !== 'undefined' ? confirmTableValue : '') || '';
    if (v) return /mesa/i.test(v) ? v : `Mesa ${v}`;
    return 'Mesa';
  }

  // Course (prato) a partir da categoria — a cozinha agrupa por isto.
  function courseFor(item) {
    const c = String((item && (item.category || item.item_category)) || '').toLowerCase();
    if (/bebid|drink|vinho|cerveja|sumo|água|agua|refrig|caf[eé]|bar\b/.test(c)) return 'bebida';
    if (/sobremes|dessert|doce|gelad/.test(c)) return 'sobremesa';
    if (/entrada|starter|petisc|couvert/.test(c)) return 'entrada';
    if (/prato|main|principal|carne|peixe|massa|risot/.test(c)) return 'principal';
    return 'principal';
  }

  // Reutiliza a comanda activa da mesa (open/submitted/preparing) ou cria
  // uma nova. Persistir a comanda é o que transforma cada confirmação numa
  // RONDA dentro da mesma conta — a base do modelo de rondas da cozinha.
  async function openOrGetComanda(tableLabel) {
    const client = await sb();
    // Inclui 'ready': se a cozinha já terminou a ronda anterior, a próxima
    // ronda entra na MESMA conta (e reabre p/ 'submitted'), não numa nova.
    const { data: existing } = await client.from('comandas')
      .select('id, session_code, table_label, status')
      .eq('espaco_slug', SLUG).eq('table_label', tableLabel)
      .in('status', ['open', 'submitted', 'preparing', 'ready'])
      .is('archived_at', null) // comanda arquivada não se reutiliza — abre nova
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (existing) { storeComanda(existing); return existing; }
    return createComanda(tableLabel, sharedGuestCount());
  }

  async function nextRoundNumber(client, comandaId) {
    const { data } = await client.from('comanda_rounds')
      .select('round_number').eq('comanda_id', comandaId)
      .order('round_number', { ascending: false }).limit(1).maybeSingle();
    return (data && data.round_number || 0) + 1;
  }

  // Cria uma RONDA (comanda_rounds) e dispara os itens já com round_id +
  // status 'sent'. A cozinha vê só os itens novos desta ronda — nunca o total.
  async function fireRound(comanda, items) {
    const client = await sb();
    const roundNumber = await nextRoundNumber(client, comanda.id);
    const { data: round, error: rErr } = await client.from('comanda_rounds').insert({
      comanda_id: comanda.id, espaco_slug: SLUG, round_number: roundNumber,
      fired_by: 'customer', item_count: items.length,
    }).select('id').single();
    if (rErr) throw rErr;
    const rows = items.map(i => ({
      comanda_id: comanda.id, espaco_slug: SLUG, item_id: i.id,
      item_name: i.name, item_category: i.category, item_price: i.price,
      quantity: i.qty, notes: i.note || null, added_by: 'customer',
      course: courseFor(i), status: 'sent', round_id: round.id,
      round_number: roundNumber,
    }));
    const { error: iErr } = await client.from('comanda_items').insert(rows);
    if (iErr) throw iErr;
    await client.from('comandas').update({
      status: 'submitted', submitted_at: new Date().toISOString(),
    }).eq('id', comanda.id);
    if (typeof track === 'function') {
      try { track('comanda_fired', { espaco_slug: SLUG, round: roundNumber, item_count: items.length }); } catch (_) {}
    }
    return { round, roundNumber };
  }

  // Confirmação do menu → dispara uma ronda na comanda persistente da mesa.
  // Mantém a conta aberta: a próxima confirmação cria a ronda seguinte.
  async function pushOrder(tableLabel, items) {
    if (!items || !items.length) return null;
    // guest_count = nº de pessoas a partilhar a mesa pelo menu (carrinho
    // partilhado). Sem partilha = 1. Nunca inferido do nº de itens.
    const comanda = await openOrGetComanda(tableLabel);
    const res = await fireRound(comanda, items);
    // separador (conta a correr) — total + estado + detalhe por ronda.
    try { storeComanda({ id: comanda.id, table_label: comanda.table_label, status: 'submitted' }); activateTab(comanda.id); } catch (_) {}
    return res;
  }

  // Signature of an order (item name × qty, order-independent). Notes are
  // ignored on purpose so "sem ovo" re-taps still count as the same order.
  function cartSignature(items) {
    return (items || []).map(i => {
      const name = (i.name || i.item_name || '').trim().toLowerCase();
      const qty = i.qty || i.quantity || 1;
      return name + '×' + qty;
    }).sort().join('|');
  }

  // True if the SAME table already has an identical order in the kitchen
  // within the dedupe window. Different tables never collide. Fail-open:
  // any error returns false so a real order is never wrongly blocked.
  async function isDuplicateRecentOrder(tableLabel, items) {
    try {
      const client = await sb();
      const mins = (F.comanda && F.comanda.dedupeMinutes) || 3;
      const since = new Date(Date.now() - mins * 60000).toISOString();
      // Comparar por RONDA (não pela comanda inteira): com a conta persistente
      // a comanda acumula várias rondas, por isso a assinatura tem de ser a
      // de cada ronda recente vs. o carrinho actual.
      const { data: comandas } = await client.from('comandas')
        .select('id')
        .eq('espaco_slug', SLUG).eq('table_label', tableLabel)
        .in('status', ['open', 'submitted', 'preparing', 'ready'])
        .is('archived_at', null)
        .limit(4);
      if (!comandas || !comandas.length) return false;
      const { data: rounds } = await client.from('comanda_rounds')
        .select('id, comanda_items(item_name, quantity)')
        .in('comanda_id', comandas.map(c => c.id))
        .gte('fired_at', since)
        .limit(12);
      if (!rounds || !rounds.length) return false;
      const sig = cartSignature(items);
      return rounds.some(r => cartSignature(r.comanda_items) === sig);
    } catch (_) { return false; }
  }

  // Called by the menu right after an order is confirmed (WhatsApp or
  // "Mostrar ao Staff"). Routes the order into the kitchen/caixa.
  let _confirmLock = 0;
  // Resultado estruturado p/ o menu decidir se precisa do canal de recurso:
  //   { ok:true }                → a comanda criou a ronda (sem WhatsApp)
  //   { ok:false, reason:'...' } → não criou (o menu cai p/ o recurso, excepto
  //                                'duplicate'/'locked', que são intencionais)
  async function onOrderConfirmed(opts) {
    if (!HAS_COMANDA || !SLUG) return { ok: false, reason: 'disabled' }; // routing desligado
    // force=true: usado pelo retry automático do menu após uma falha. Contorna o
    // lock anti-duplo-toque — a deduplicação por assinatura evita rondas duplicadas.
    const force = !!(opts && opts.force);
    if (!force && Date.now() < _confirmLock) return { ok: false, reason: 'locked' }; // anti double-submit
    _confirmLock = Date.now() + 6000;
    try {
      const items = readMenuCart();
      if (!items.length) return { ok: false, reason: 'empty' };
      const tableLabel = currentTableLabel();
      // Anti-duplicado: mesmo pedido, mesma mesa, dentro da janela → não reenvia.
      if (await isDuplicateRecentOrder(tableLabel, items)) {
        toast('Pedido igual já enviado para esta mesa.');
        return { ok: false, reason: 'duplicate' };
      }
      const res = await pushOrder(tableLabel, items);
      toast('Pedido enviado para a cozinha ✓');
      // Esvazia o carrinho pendente após disparar — os itens passam a viver na
      // secção "Já enviado". Atrasado para não apanhar a vista "Mostrar ao
      // Staff" (que renderiza a partir do carrinho a ~270ms).
      setTimeout(() => { try { if (typeof clearCart === 'function') clearCart(); } catch (_) {} }, 1200);
      return { ok: true, result: res };
    } catch (e) { console.warn('[NEXO Premium] onOrderConfirmed', e); return { ok: false, reason: 'error' }; }
  }

  // ── Public API ───────────────────────────────────────────────
  window.NEXOPremium = {
    modeSwitcher, createComanda, joinComanda, addItemsToComanda,
    submitComanda, sendCartAsComanda, loadBanners, readLocalCart,
    readMenuCart, pushOrder, onOrderConfirmed, currentTableLabel,
    buildWhatsAppMessage, renderComandaBar,
    getStoredComanda,
    // true when the menu routes orders into comandas (Cozinha/Caixa).
    // When on, the menu skips its own orders_log write — the comanda is
    // the source of truth and Caixa logs orders_log once at payment.
    comandaRouting: HAS_COMANDA,
  };

  // ── init ─────────────────────────────────────────────────────
  function init() {
    try {
      const label = document.getElementById('cart-confirm-label');
      if (label && !label.dataset.orig) label.dataset.orig = label.textContent;
      loadBanners();
      // Retoma o separador (conta a correr) desta sessão, se existir.
      const c = getStoredComanda();
      if (c && c.id) activateTab(c.id);
      // Refrescar o detalhe "Já enviado" sempre que o painel do carrinho abre.
      const cartSheet = document.getElementById('cart-sheet');
      if (cartSheet) {
        new MutationObserver(() => {
          if (cartSheet.classList.contains('show') && _activeComandaId) refreshTab();
        }).observe(cartSheet, { attributes: true, attributeFilter: ['class'] });
      }
      // Mount staff takeover QR whenever the staff view opens
      const staffView = document.getElementById('staff-view');
      if (staffView) {
        new MutationObserver(() => {
          if (staffView.classList.contains('show')) mountStaffTakeover();
        }).observe(staffView, { attributes: true, attributeFilter: ['class'] });
      }
    } catch (e) { console.warn('[NEXO Premium] init', e); }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
