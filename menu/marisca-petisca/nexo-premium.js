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
  const HAS_TAKEAWAY = !!(F.takeaway && F.takeaway.enabled);
  const HAS_BANNERS = !!(F.banners && F.banners.enabled);
  if (!HAS_TAKEAWAY && !HAS_BANNERS) return; // nothing to do

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
  // PHASE 1 — TAKE AWAY MODE
  // ════════════════════════════════════════════════════════════
  const modeSwitcher = {
    current: 'dine_in',
    mount() {
      if (!HAS_TAKEAWAY) return;
      const anchor = document.getElementById('quick-nav');
      if (!anchor || document.getElementById('mode-switcher')) return;
      const wrap = document.createElement('div');
      wrap.className = 'mode-switcher-wrap';
      wrap.innerHTML = `
        <div class="mode-switcher" id="mode-switcher">
          <button class="mode-btn active" data-mode="dine_in" type="button">
            <span class="mode-icon">🍽️</span> Na mesa
          </button>
          <button class="mode-btn" data-mode="take_away" type="button">
            <span class="mode-icon">🥡</span> Take away
          </button>
          <div class="mode-indicator" id="mode-indicator"></div>
        </div>`;
      anchor.insertAdjacentElement('afterend', wrap);
      wrap.querySelectorAll('.mode-btn').forEach(btn =>
        btn.addEventListener('click', () => this.setMode(btn.dataset.mode)));
      requestAnimationFrame(() => this.updateIndicator());
      window.addEventListener('resize', () => this.updateIndicator());
    },
    setMode(mode) {
      this.current = mode;
      document.querySelectorAll('.mode-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.mode === mode));
      this.updateIndicator();
      const pickup = document.getElementById('pickup-time-section');
      if (pickup) pickup.style.display = mode === 'take_away' ? 'block' : 'none';
      const label = document.getElementById('cart-confirm-label');
      if (label) label.textContent = mode === 'take_away'
        ? 'Pedir para levantar →' : (label.dataset.orig || label.textContent);
    },
    updateIndicator() {
      const active = document.querySelector('.mode-btn.active');
      const ind = document.getElementById('mode-indicator');
      if (!active || !ind) return;
      ind.style.width = active.offsetWidth + 'px';
      ind.style.transform = `translateX(${active.offsetLeft - 4}px)`;
    },
  };

  function renderPickupOptions() {
    if (!HAS_TAKEAWAY) return;
    const panel = document.getElementById('panel-order');
    const footer = panel && panel.querySelector('.cart-footer');
    if (!panel || !footer || document.getElementById('pickup-time-section')) return;
    const section = document.createElement('div');
    section.id = 'pickup-time-section';
    section.className = 'pickup-section';
    section.style.display = modeSwitcher.current === 'take_away' ? 'block' : 'none';
    section.innerHTML = `
      <div class="pickup-label"><span>⏱️</span><span>Hora de levantar</span></div>
      <div class="pickup-options" id="pickup-options"></div>`;
    panel.insertBefore(section, footer);

    const mins = (F.takeaway.pickupMinutes || [15, 20, 30, 45, 60]);
    const def = F.takeaway.defaultPickupMinutes || 30;
    const cont = section.querySelector('#pickup-options');
    cont.innerHTML = mins.map(m => {
      const time = new Date(Date.now() + m * 60000);
      const label = time.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
      const sel = m === def ? ' selected' : '';
      if (m === def) window.nexoSelectedPickup = time.toISOString();
      return `<button class="pickup-btn${sel}" type="button"
        data-mins="${m}" data-time="${time.toISOString()}">
        ${m} min<span class="pickup-time">${label}</span></button>`;
    }).join('');
    cont.querySelectorAll('.pickup-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        cont.querySelectorAll('.pickup-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        window.nexoSelectedPickup = btn.dataset.time;
      }));
  }

  // Take-away / dine-in WhatsApp message builder (PT).
  function buildWhatsAppMessage(items, mode, pickupTime, tableLabel) {
    const lines = items.map(i =>
      `• ${i.qty}× ${i.name}` + (i.note ? `\n  ↳ ${i.note}` : '') +
      ` — ${fmtEUR(i.price * i.qty)}`).join('\n');
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    if (mode === 'take_away') {
      const pk = pickupTime ? new Date(pickupTime).toLocaleTimeString('pt-PT',
        { hour: '2-digit', minute: '2-digit' }) : '—';
      return `🥡 *TAKE AWAY*\n⏱️ Levantar às: *${pk}*\n\n${lines}\n\n` +
        `*Total: ${fmtEUR(total)}*\n\n_via NEXO Menu_`;
    }
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
      mode: modeSwitcher.current,
      pickup_time: modeSwitcher.current === 'take_away'
        ? (window.nexoSelectedPickup || null) : null,
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
    const num = (CONFIG.features?.takeaway?.whatsappNumber) || CONFIG.whatsappNumber;
    if (num && num !== '{{WHATSAPP_NUMBER}}') {
      const msg = buildWhatsAppMessage(items, modeSwitcher.current,
        window.nexoSelectedPickup, tableLabel);
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
    const url = `https://nexosolutions.pt/portal/restaurante/?comanda=${comanda.session_code}&slug=${SLUG}`;
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

  // Table label from the confirm screen (e.g. "Mesa 4").
  function currentTableLabel() {
    const input = document.getElementById('confirm-table-input');
    const v = (input && input.value.trim()) ||
             (typeof confirmTableValue !== 'undefined' ? confirmTableValue : '') || '';
    if (v) return /mesa/i.test(v) ? v : `Mesa ${v}`;
    return modeSwitcher.current === 'take_away' ? 'Take Away' : 'Mesa';
  }

  // Create + fill + submit a comanda from the cart. No WhatsApp here —
  // the menu's existing confirm handler keeps owning that channel.
  async function pushOrder(tableLabel, items) {
    if (!items || !items.length) return null;
    const comanda = await createComanda(tableLabel, items.length);
    await addItemsToComanda(comanda.id, items);
    sessionStorage.removeItem(COMANDA_KEY); // single-shot order, not a running tab
    return submitComanda(comanda.id);
  }

  // Called by the menu right after an order is confirmed (WhatsApp or
  // "Mostrar ao Staff"). Routes the order into the kitchen/caixa.
  let _confirmLock = 0;
  async function onOrderConfirmed() {
    if (!HAS_TAKEAWAY || !SLUG) return null;        // gated by the premium toggle
    if (Date.now() < _confirmLock) return null;     // anti double-submit
    _confirmLock = Date.now() + 6000;
    try {
      const items = readMenuCart();
      if (!items.length) return null;
      const res = await pushOrder(currentTableLabel(), items);
      toast(modeSwitcher.current === 'take_away'
        ? 'Take away enviado para a cozinha ✓' : 'Pedido enviado para a cozinha ✓');
      return res;
    } catch (e) { console.warn('[NEXO Premium] onOrderConfirmed', e); return null; }
  }

  // Take-away prefix for the menu's WhatsApp message (called from script.js).
  function takeawayWhatsAppPrefix() {
    if (modeSwitcher.current !== 'take_away') return '';
    const pk = window.nexoSelectedPickup
      ? new Date(window.nexoSelectedPickup).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
      : '—';
    return `🥡 *TAKE AWAY*\n⏱️ Levantar às: *${pk}*\n\n`;
  }

  // ── Public API ───────────────────────────────────────────────
  window.NEXOPremium = {
    modeSwitcher, createComanda, joinComanda, addItemsToComanda,
    submitComanda, sendCartAsComanda, loadBanners, readLocalCart,
    readMenuCart, pushOrder, onOrderConfirmed, currentTableLabel,
    takeawayWhatsAppPrefix, buildWhatsAppMessage, renderComandaBar,
    getStoredComanda,
    // true when the menu routes orders into comandas (Cozinha/Caixa).
    // When on, the menu skips its own orders_log write — the comanda is
    // the source of truth and Caixa logs orders_log once at payment.
    comandaRouting: HAS_TAKEAWAY,
  };

  // ── init ─────────────────────────────────────────────────────
  function init() {
    try {
      const label = document.getElementById('cart-confirm-label');
      if (label && !label.dataset.orig) label.dataset.orig = label.textContent;
      modeSwitcher.mount();
      renderPickupOptions();
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
