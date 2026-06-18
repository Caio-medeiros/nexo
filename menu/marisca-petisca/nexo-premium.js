/* ═══════════════════════════════════════════════════════════════
   NEXO PREMIUM — Menu add-ons
   Phase 1 · Take-away mode      Phase 2 · Comanda (full table order)
   Phase 3 · Promotional banners
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
  // (aceita a chave legada "takeaway" do config — já SEM qualquer modo take-away.)
  const HAS_COMANDA = !!((F.comanda && F.comanda.enabled) || (F.takeaway && F.takeaway.enabled));
  const HAS_BANNERS = !!(F.banners && F.banners.enabled);
  if (!HAS_COMANDA && !HAS_BANNERS) return; // nothing to do

  const SLUG = (typeof ESPACO_SLUG !== 'undefined' && ESPACO_SLUG) ||
               (typeof CONFIG !== 'undefined' && CONFIG.slug) || null;
  const lang = () => (typeof currentLang !== 'undefined' ? currentLang : 'pt');

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
    const { data, error } = await client.from('comandas').insert({
      espaco_slug: SLUG,
      table_label: tableLabel || 'Mesa',
      guest_count: guestCount || 1,
      mode: 'dine_in',
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
      item_name: i.name, item_category: i.category, item_price: i.price,
      quantity: i.qty, notes: i.note || null, added_by: 'customer',
      round_number: window.nexoComandaRound || 1,
    }));
    const { error } = await client.from('comanda_items').insert(rows);
    if (error) throw error;
  }

  async function submitComanda(comandaId) {
    const client = await sb();
    const { data, error } = await client.from('comandas').update({
      status: 'submitted', submitted_at: new Date().toISOString(),
    }).eq('id', comandaId).select('total, table_label, mode, pickup_time, session_code').single();
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

  // Comanda bar (fixed). Pass null to remove.
  let _comandaCh = null;
  function renderComandaBar(comanda) {
    let bar = document.getElementById('comanda-bar');
    if (!comanda) { if (bar) bar.remove(); if (_comandaCh) { try { _sb.removeChannel(_comandaCh); } catch (_) {} _comandaCh = null; } return; }
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'comanda-bar';
      bar.className = 'comanda-bar';
      document.body.appendChild(bar);
    }
    bar.innerHTML = `
      <div class="comanda-bar-left">
        <span class="comanda-code">${comanda.session_code || ''}</span>
        <span class="comanda-table">${comanda.table_label || 'Mesa'}</span>
      </div>
      <div class="comanda-bar-center">
        <span class="comanda-total" id="comanda-total">${fmtEUR(comanda.total || 0)}</span>
        <span class="comanda-items" id="comanda-items">—</span>
      </div>
      <button class="comanda-submit-btn" type="button">Enviar →</button>`;
    bar.querySelector('.comanda-submit-btn').addEventListener('click', async () => {
      try { await submitComanda(comanda.id); sessionStorage.removeItem(COMANDA_KEY); renderComandaBar(null); toast('Comanda enviada ✓'); }
      catch (e) { toast('Erro ao enviar'); console.error(e); }
    });
    subscribeComanda(comanda.id);
  }

  async function subscribeComanda(comandaId) {
    const client = await sb();
    if (_comandaCh) { try { client.removeChannel(_comandaCh); } catch (_) {} }
    _comandaCh = client.channel(`comanda_${comandaId}`)
      .on('postgres_changes', { event: '*', schema: 'public',
        table: 'comanda_items', filter: `comanda_id=eq.${comandaId}` },
        () => refreshComandaBar(comandaId))
      .subscribe();
  }
  async function refreshComandaBar(comandaId) {
    const client = await sb();
    const { data } = await client.from('comandas')
      .select('total, table_label, session_code').eq('id', comandaId).maybeSingle();
    if (data) {
      const t = document.getElementById('comanda-total');
      if (t) t.textContent = fmtEUR(data.total);
    }
    const { count } = await client.from('comanda_items')
      .select('*', { count: 'exact', head: true })
      .eq('comanda_id', comandaId).neq('status', 'cancelled');
    const it = document.getElementById('comanda-items');
    if (it) it.textContent = `${count || 0} ${count === 1 ? 'item' : 'itens'}`;
  }

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
    cont.innerHTML = banners.map((b, i) => `
      <div class="menu-banner" ${b.link_item_id ? `data-link="${b.link_item_id}"` : ''}
        style="background:${b.bg_color};color:${b.text_color};animation-delay:${i * 80}ms">
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

  // Create + fill + submit a comanda from the cart. No WhatsApp here —
  // the menu's existing confirm handler keeps owning that channel.
  async function pushOrder(tableLabel, items) {
    if (!items || !items.length) return null;
    // guest_count = nº de pessoas a partilhar a mesa pelo menu (carrinho
    // partilhado). Sem partilha = 1. Nunca inferido do nº de itens.
    const comanda = await createComanda(tableLabel, sharedGuestCount());
    await addItemsToComanda(comanda.id, items);
    sessionStorage.removeItem(COMANDA_KEY); // single-shot order, not a running tab
    return submitComanda(comanda.id);
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
      const cfg = F.comanda || F.takeaway || {};
      const mins = cfg.dedupeMinutes || 3;
      const since = new Date(Date.now() - mins * 60000).toISOString();
      const { data, error } = await client.from('comandas')
        .select('id, comanda_items(item_name, quantity)')
        .eq('espaco_slug', SLUG)
        .eq('table_label', tableLabel)
        .in('status', ['submitted', 'preparing', 'ready'])
        .gte('created_at', since)
        .limit(8);
      if (error || !data || !data.length) return false;
      const sig = cartSignature(items);
      return data.some(c => cartSignature(c.comanda_items) === sig);
    } catch (_) { return false; }
  }

  // Called by the menu right after an order is confirmed (WhatsApp or
  // "Mostrar ao Staff"). Routes the order into the kitchen/caixa.
  let _confirmLock = 0;
  async function onOrderConfirmed() {
    if (!HAS_COMANDA || !SLUG) return null;          // gated by the comanda toggle
    if (Date.now() < _confirmLock) return null;     // anti double-submit (same session)
    _confirmLock = Date.now() + 6000;
    try {
      const items = readMenuCart();
      if (!items.length) return null;
      const tableLabel = currentTableLabel();
      // Anti-duplicado: mesmo pedido, mesma mesa, dentro da janela → não reenvia.
      if (await isDuplicateRecentOrder(tableLabel, items)) {
        toast('Pedido igual já enviado para esta mesa.');
        return null;
      }
      const res = await pushOrder(tableLabel, items);
      toast('Pedido enviado para a cozinha ✓');
      return res;
    } catch (e) { console.warn('[NEXO Premium] onOrderConfirmed', e); return null; }
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
      // Resume an open comanda if present in this session
      const c = getStoredComanda();
      if (c && c.status === 'open') { renderComandaBar(c); refreshComandaBar(c.id); }
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
