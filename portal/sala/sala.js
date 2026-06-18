// ═══════════════════════════════════════════════════════════════
// SALA — Interactive restaurant floor plan
// Expects globals from portal.js + bootstrap: db, ESPACO_SLUG,
// ESPACO_NAME, trackChannel, setLiveState, escapeHtml.
// Exposes window.initSala() (called after auth) + the onclick API.
// ═══════════════════════════════════════════════════════════════

const REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOTION = !REDUCE && !!window.gsap;

const state = {
  tableCount: 10,
  tables: {},
  activeFilter: 'all',
  selectedTable: null,
  feedOpen: false,
  feedUnread: 0,
  todayStats: { revenue: 0, orders: 0, calls: 0 },
};

function fmtEUR(v) { return '€' + (Number(v) || 0).toFixed(2).replace('.', ','); }

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
async function initSala() {
  const slug = window.ESPACO_SLUG;
  document.getElementById('sala-venue-name').textContent = window.ESPACO_NAME || slug;

  const { data: venue } = await db.from('venue_settings')
    .select('*').eq('espaco_slug', slug).maybeSingle();
  if (venue) state.tableCount = venue.table_count;

  for (let i = 1; i <= state.tableCount; i++) {
    state.tables[i] = { status: 'empty', comanda: null, calls: [] };
  }

  renderFloorPlan(state.tableCount, false);
  await loadActiveComandas();
  await loadTodayStats();
  subscribeToRealtime();
  subscribeToVenueChanges();
}
window.initSala = initSala;

// ─────────────────────────────────────────
// FLOOR PLAN
// ─────────────────────────────────────────
function getGridConfig(count) {
  if (count <= 4)  return { cols: 2, size: 'xl' };
  if (count <= 6)  return { cols: 3, size: 'lg' };
  if (count <= 9)  return { cols: 3, size: 'md' };
  if (count <= 12) return { cols: 4, size: 'md' };
  if (count <= 16) return { cols: 4, size: 'sm' };
  if (count <= 20) return { cols: 5, size: 'sm' };
  if (count <= 30) return { cols: 5, size: 'xs' };
  return { cols: 6, size: 'xs' };
}

function renderFloorPlan(count, animate = true) {
  const grid = document.getElementById('table-grid');
  const config = getGridConfig(count);
  grid.style.setProperty('--grid-cols', config.cols);
  grid.dataset.size = config.size;

  const existing = new Set([...grid.querySelectorAll('.table-card')].map(el => parseInt(el.dataset.tableNum)));

  for (let i = 1; i <= count; i++) {
    if (!existing.has(i)) {
      const card = createTableCard(i);
      card.classList.add('new');
      grid.appendChild(card);
    }
  }

  grid.querySelectorAll('.table-card').forEach(card => {
    const num = parseInt(card.dataset.tableNum);
    if (num > count) {
      if (MOTION && animate) gsap.to(card, { scale: 0, opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: () => card.remove() });
      else card.remove();
    }
  });

  const newCards = grid.querySelectorAll('.table-card.new');
  if (MOTION && animate) {
    gsap.from(newCards, { scale: 0, opacity: 0, duration: 0.4, stagger: { amount: 0.3, from: 'start' }, ease: 'back.out(1.4)',
      onComplete: () => newCards.forEach(c => c.classList.remove('new')) });
  } else if (MOTION && !animate) {
    gsap.from('.table-card', { scale: 0.85, opacity: 0, y: 16, duration: 0.5,
      stagger: { amount: 0.6, from: 'start', grid: [Math.ceil(count / config.cols), config.cols] }, ease: 'back.out(1.2)' });
    newCards.forEach(c => c.classList.remove('new'));
  } else {
    newCards.forEach(c => c.classList.remove('new'));
  }
}

function createTableCard(num) {
  const card = document.createElement('div');
  card.className = 'table-card';
  card.dataset.tableNum = num;
  card.dataset.status = 'empty';
  card.onclick = () => openTableDetail(num);
  card.innerHTML = `
    <div class="table-notifications" id="notifs-${num}"></div>
    <div class="card-top">
      <div class="table-number">${num}</div>
      <div class="table-status-dot"></div>
    </div>
    <div class="card-summary">
      <p class="card-empty-label">Livre</p>
      <div class="card-order-summary" id="summary-${num}">
        <div class="summary-total" id="total-${num}">€0,00</div>
        <div class="summary-meta" id="meta-${num}"></div>
      </div>
    </div>`;
  return card;
}

// ─────────────────────────────────────────
// TABLE STATE
// ─────────────────────────────────────────
function updateTableStatus(tableNum, status, data = {}) {
  const card = document.querySelector(`[data-table-num="${tableNum}"]`);
  if (!card) return;
  card.dataset.status = status;
  state.tables[tableNum] = { ...state.tables[tableNum], status, ...data };

  if (MOTION) gsap.fromTo(card, { scale: 0.97 }, { scale: 1, duration: 0.3, ease: 'power2.out' });

  if (data.comanda) {
    const total = data.comanda.total || 0;
    const items = data.comanda.itemCount || 0;
    const guests = data.comanda.guestCount || 0;
    const totalEl = document.getElementById(`total-${tableNum}`);
    const metaEl = document.getElementById(`meta-${tableNum}`);
    if (totalEl) {
      const current = parseFloat(totalEl.textContent.replace('€', '').replace(',', '.')) || 0;
      if (MOTION && total !== current) {
        gsap.to({ val: current }, { val: total, duration: 0.4, ease: 'power2.out',
          onUpdate: function () { totalEl.textContent = fmtEUR(this.targets()[0].val); } });
      } else { totalEl.textContent = fmtEUR(total); }
    }
    if (metaEl) {
      metaEl.textContent = `${items} ${items === 1 ? 'item' : 'itens'}` + (guests > 1 ? ` · 👥 ${guests}` : '');
    }
  }
  updateStats();
}

// ─────────────────────────────────────────
// NOTIFICATION BADGES
// ─────────────────────────────────────────
const notifTimers = {};
function showTableNotification(tableNum, type, text, autoDismiss = 8000) {
  const container = document.getElementById(`notifs-${tableNum}`);
  if (!container) return null;
  const id = `notif-${tableNum}-${Date.now()}`;
  const badge = document.createElement('div');
  badge.className = `notif-badge ${type}`;
  badge.id = id;
  badge.innerHTML = text;
  container.appendChild(badge);

  if (MOTION) gsap.fromTo(badge, { scale: 0, y: 8, opacity: 0, transformOrigin: 'bottom center' },
    { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: 'back.out(2)' });
  else { badge.style.opacity = '1'; badge.style.transform = 'none'; }

  playSoundForEvent(type);
  if (autoDismiss > 0) notifTimers[id] = setTimeout(() => dismissNotification(id, badge), autoDismiss);
  return id;
}
function dismissNotification(id, badge) {
  clearTimeout(notifTimers[id]);
  if (!badge) badge = document.getElementById(id);
  if (!badge) return;
  if (MOTION) gsap.to(badge, { scale: 0, opacity: 0, y: -4, duration: 0.2, ease: 'power2.in', onComplete: () => badge.remove() });
  else badge.remove();
}
function clearTableBadges(tableNum) {
  document.getElementById(`notifs-${tableNum}`)?.querySelectorAll('.notif-badge').forEach(b => {
    if (MOTION) gsap.to(b, { scale: 0, opacity: 0, duration: 0.2, ease: 'power2.in', onComplete: () => b.remove() });
    else b.remove();
  });
}

// ─────────────────────────────────────────
// REALTIME
// ─────────────────────────────────────────
function subscribeToRealtime() {
  const slug = window.ESPACO_SLUG;
  const ch = db.channel('sala-live-' + slug)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comandas', filter: `espaco_slug=eq.${slug}` }, p => handleNewComanda(p.new))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'comandas', filter: `espaco_slug=eq.${slug}` }, p => handleComandaUpdate(p.new))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'staff_calls', filter: `espaco_slug=eq.${slug}` }, p => handleStaffCall(p.new))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders_log', filter: `espaco_slug=eq.${slug}` }, p => handleNewOrder(p.new))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'portal_notifications', filter: `espaco_slug=eq.${slug}` }, p => addToActivityFeed(p.new))
    .subscribe(s => { if (typeof setLiveState === 'function') setLiveState(s === 'SUBSCRIBED' ? 'connected' : 'reconnecting'); });
  if (typeof trackChannel === 'function') trackChannel(ch);
}

function handleNewComanda(comanda) {
  const tableNum = extractTableNumber(comanda.table_label);
  if (!tableNum || !state.tables[tableNum]) return;
  updateTableStatus(tableNum, 'active', { comanda: {
    id: comanda.id, total: comanda.total, itemCount: 0,
    guestCount: comanda.guest_count, code: comanda.session_code, mode: comanda.mode } });
  showTableNotification(tableNum, 'cart', `${comanda.mode === 'take_away' ? '🥡' : '🛒'} Comanda aberta`);
  addToActivityFeed({ type: 'order_new', title: `🛒 Comanda — ${comanda.table_label}`, created_at: new Date().toISOString() });
}

function handleComandaUpdate(comanda) {
  const tableNum = extractTableNumber(comanda.table_label);
  if (!tableNum || !state.tables[tableNum]) return;
  const statusMap = { submitted: 'order_new', preparing: 'active', ready: 'ready', open: 'active', closed: 'empty', cancelled: 'empty' };
  const uiStatus = statusMap[comanda.status] || 'active';

  if (comanda.status === 'closed' || comanda.status === 'cancelled') {
    state.tables[tableNum] = { status: 'empty', comanda: null, calls: [] };
    const card = document.querySelector(`[data-table-num="${tableNum}"]`);
    if (card) { card.dataset.status = 'empty';
      const tEl = document.getElementById(`total-${tableNum}`); if (tEl) tEl.textContent = '€0,00';
      const mEl = document.getElementById(`meta-${tableNum}`); if (mEl) mEl.textContent = ''; }
    clearTableBadges(tableNum);
    updateStats();
    return;
  }

  updateTableStatus(tableNum, uiStatus, { comanda: {
    id: comanda.id, total: comanda.total, guestCount: comanda.guest_count,
    code: comanda.session_code, mode: comanda.mode } });

  if (comanda.status === 'submitted') {
    showTableNotification(tableNum, 'order', `🍽️ Novo pedido · ${fmtEUR(comanda.total)}`);
    state.todayStats.orders++; state.todayStats.revenue += Number(comanda.total) || 0; updateStats();
  }
  if (comanda.status === 'ready') showTableNotification(tableNum, 'ready', '✅ Pronto para servir', 15000);
}

function handleStaffCall(call) {
  const tableNum = extractTableNumber(call.table_label);
  if (!tableNum || !state.tables[tableNum]) return;
  const prev = state.tables[tableNum].comanda ? 'active' : 'empty';
  state.tables[tableNum]._prevStatus = prev;
  updateTableStatus(tableNum, 'calling', { comanda: state.tables[tableNum].comanda });

  if (MOTION) {
    const sel = `[data-table-num="${tableNum}"]`;
    gsap.timeline()
      .to(sel, { x: -4, duration: 0.06, ease: 'power2.out' })
      .to(sel, { x: 4, duration: 0.06, ease: 'power2.inOut' })
      .to(sel, { x: -3, duration: 0.05 })
      .to(sel, { x: 0, duration: 0.05 });
  }
  const notifId = showTableNotification(tableNum, 'call', '🙋 A chamar', 0);
  state.tables[tableNum].callNotifId = notifId;
  state.todayStats.calls++; updateStats();
  addToActivityFeed({ type: 'staff_call', title: `🙋 Chamada — ${call.table_label}`, created_at: new Date().toISOString() });
}

function handleNewOrder(order) {
  // Orders linked to a comanda are already represented by the comanda
  // (and only get logged at Caixa payment) — don't double-react.
  if (order.comanda_id) return;
  const tableNum = extractTableNumber(order.table_label);
  if (!tableNum || !state.tables[tableNum]) return;
  const card = document.querySelector(`[data-table-num="${tableNum}"]`);
  if (!card) return;
  if (card.dataset.status === 'empty') {
    updateTableStatus(tableNum, 'active', { comanda: {
      total: order.total, itemCount: (order.items || []).length, guestCount: order.member_count } });
  }
  showTableNotification(tableNum, 'order', `${order.is_takeaway ? '🥡' : '🍽️'} ${fmtEUR(order.total)}`);
}

// ─────────────────────────────────────────
// VENUE SETTINGS SUBSCRIPTION
// ─────────────────────────────────────────
function subscribeToVenueChanges() {
  const slug = window.ESPACO_SLUG;
  const ch = db.channel('sala-venue-' + slug)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'venue_settings', filter: `espaco_slug=eq.${slug}` }, p => {
      const newCount = p.new.table_count;
      if (newCount !== state.tableCount) {
        state.tableCount = newCount;
        for (let i = 1; i <= newCount; i++) if (!state.tables[i]) state.tables[i] = { status: 'empty', comanda: null, calls: [] };
        renderFloorPlan(newCount, true);
        salaToast(`Layout actualizado para ${newCount} mesas`);
      }
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'venue_settings', filter: `espaco_slug=eq.${slug}` }, p => {
      if (p.new.table_count !== state.tableCount) {
        state.tableCount = p.new.table_count;
        for (let i = 1; i <= state.tableCount; i++) if (!state.tables[i]) state.tables[i] = { status: 'empty', comanda: null, calls: [] };
        renderFloorPlan(state.tableCount, true);
      }
    })
    .subscribe();
  if (typeof trackChannel === 'function') trackChannel(ch);
}

// ─────────────────────────────────────────
// TABLE DETAIL PANEL
// ─────────────────────────────────────────
async function openTableDetail(tableNum) {
  state.selectedTable = tableNum;
  const tableData = state.tables[tableNum];
  document.getElementById('tdp-title').textContent = `Mesa ${tableNum}`;
  document.getElementById('tdp-code').textContent = tableData?.comanda?.code || '';

  const body = document.getElementById('tdp-body');
  body.innerHTML = '<div class="tdp-loading">A carregar...</div>';

  if (tableData?.comanda?.id) {
    const { data: items } = await db.from('comanda_items').select('*')
      .eq('comanda_id', tableData.comanda.id).neq('status', 'cancelled').order('created_at');
    renderTableDetailItems(items || [], tableData.comanda);
  } else {
    body.innerHTML = `<div class="tdp-empty"><p>Mesa livre</p>
      <button class="tdp-full-btn" onclick="createComandaForTable(${tableNum})">+ Abrir comanda</button></div>`;
  }

  document.getElementById('table-detail-overlay').classList.add('visible');
  document.getElementById('table-detail-panel').classList.add('visible');

  // Acknowledge an active staff call when the table is opened
  if (tableData?.status === 'calling') {
    if (tableData.callNotifId) dismissNotification(tableData.callNotifId);
    try {
      await db.from('staff_calls').update({ delivered_count: 1 })
        .eq('espaco_slug', window.ESPACO_SLUG).eq('table_label', `Mesa ${tableNum}`).eq('delivered_count', 0);
    } catch (_) {}
    updateTableStatus(tableNum, tableData._prevStatus || (tableData.comanda ? 'active' : 'empty'), { comanda: tableData.comanda });
  }
}

function closeTableDetail(event) {
  if (event && event.target !== document.getElementById('table-detail-overlay')) return;
  document.getElementById('table-detail-overlay').classList.remove('visible');
  document.getElementById('table-detail-panel').classList.remove('visible');
  state.selectedTable = null;
}

function renderTableDetailItems(items, comanda) {
  const body = document.getElementById('tdp-body');
  if (!items.length) { body.innerHTML = '<div class="tdp-empty"><p>Sem itens ainda</p>' +
    `<button class="tdp-full-btn" onclick="addItemToActiveTable()">+ Adicionar item</button></div>`; return; }

  const rounds = {};
  items.forEach(it => { const r = it.round_number || 1; (rounds[r] = rounds[r] || []).push(it); });
  const multiRound = Object.keys(rounds).length > 1;

  let html = '';
  Object.entries(rounds).forEach(([round, rItems]) => {
    if (multiRound) html += `<div class="tdp-round-label">${parseInt(round) === 1 ? '1ª Ordem' : `${round}ª Ordem`}</div>`;
    rItems.forEach(it => {
      const isReady = it.status === 'ready', isDone = it.status === 'delivered';
      html += `<div class="tdp-item ${isReady ? 'ready' : ''} ${isDone ? 'done' : ''}" data-item-id="${it.id}">
        <div class="tdp-item-info">
          <span class="tdp-item-name">${escapeHtml(it.item_name)}</span>
          ${it.notes ? `<span class="tdp-item-note">${escapeHtml(it.notes)}</span>` : ''}
        </div>
        <span class="tdp-item-qty">×${it.quantity}</span>
        <span class="tdp-item-price">${fmtEUR((it.item_price || 0) * it.quantity)}</span>
        <span class="tdp-item-status">${isReady ? '✅' : isDone ? '✓' : '⏳'}</span>
      </div>`;
    });
  });

  const total = comanda.total || items.reduce((s, i) => s + (i.item_price || 0) * i.quantity, 0);
  html += `<div class="tdp-total-row"><span>Total</span><span class="tdp-total-amount">${fmtEUR(total)}</span></div>
    <div class="tdp-actions-row"><button class="tdp-full-btn" onclick="addItemToActiveTable()">+ Adicionar item</button></div>`;
  body.innerHTML = html;
  if (MOTION) gsap.from('.tdp-item', { opacity: 0, x: -8, duration: 0.25, stagger: 0.04, ease: 'power2.out' });
}

async function addItemToActiveTable() {
  const tableNum = state.selectedTable;
  const tableData = state.tables[tableNum];
  if (!tableData?.comanda?.id) return;
  const name = prompt('Nome do item:'); if (!name) return;
  const price = parseFloat((prompt('Preço (€):') || '').replace(',', '.')); if (isNaN(price)) return;
  const qty = parseInt(prompt('Quantidade:') || '1') || 1;
  await db.from('comanda_items').insert({
    comanda_id: tableData.comanda.id, espaco_slug: window.ESPACO_SLUG,
    item_name: name, item_price: price, quantity: qty, added_by: 'staff', round_number: 2 });
  await openTableDetail(tableNum);
}

async function createComandaForTable(tableNum) {
  const { data, error } = await db.from('comandas').insert({
    espaco_slug: window.ESPACO_SLUG, table_label: `Mesa ${tableNum}`,
    status: 'open', mode: 'dine_in', guest_count: 1 }).select('id, session_code').single();
  if (error) { salaToast('Erro ao abrir comanda'); return; }
  state.tables[tableNum] = { status: 'active', comanda: { id: data.id, code: data.session_code, total: 0 } };
  updateTableStatus(tableNum, 'active', { comanda: state.tables[tableNum].comanda });
  openTableDetail(tableNum);
}

async function sendToKitchenFromPanel() {
  const tableNum = state.selectedTable;
  const c = state.tables[tableNum]?.comanda;
  if (!c?.id) { salaToast('Mesa sem comanda'); return; }
  await db.from('comandas').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', c.id);
  salaToast('Enviado para a cozinha ✓');
  closeTableDetail();
}

function processPaymentFromPanel() {
  const tableNum = state.selectedTable;
  const c = state.tables[tableNum]?.comanda;
  if (!c?.code) { window.location.href = '/portal/restaurante/'; return; }
  window.location.href = `/portal/restaurante/?comanda=${encodeURIComponent(c.code)}`;
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function extractTableNumber(label) {
  if (!label) return null;
  const m = String(label).match(/\d+/);
  return m ? parseInt(m[0]) : null;
}

function updateStats() {
  const activeTables = Object.values(state.tables).filter(t => t.status !== 'empty').length;
  document.getElementById('stat-open').textContent = activeTables;
  document.getElementById('stat-orders').textContent = state.todayStats.orders;
  document.getElementById('stat-calls').textContent = state.todayStats.calls;
  document.getElementById('stat-revenue').textContent = fmtEUR(state.todayStats.revenue);
  applyCurrentFilter();
}

function applyCurrentFilter() {
  document.querySelectorAll('.table-card').forEach(card => {
    const status = card.dataset.status;
    let visible = true;
    if (state.activeFilter === 'active') visible = status !== 'empty';
    else if (state.activeFilter === 'calling') visible = status === 'calling';
    else if (state.activeFilter === 'ready') visible = status === 'ready';
    if (MOTION) gsap.to(card, { opacity: visible ? 1 : 0.25, scale: visible ? 1 : 0.95, duration: 0.2, ease: 'power2.out' });
    else { card.style.opacity = visible ? '' : '0.25'; }
  });
}

function setFilter(filter) {
  state.activeFilter = filter;
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.toggle('active', p.dataset.filter === filter));
  applyCurrentFilter();
}

function addToActivityFeed(notification) {
  const feed = document.getElementById('feed-items');
  if (!feed) return;
  const icons = { order_new: '🍽️', staff_call: '🙋', waitlist_new: '⏳', review_positive: '⭐', menu_viewed: '👁️' };
  feed.querySelector('.feed-empty')?.remove();
  const item = document.createElement('div');
  item.className = 'feed-item';
  item.innerHTML = `<span class="feed-item-icon">${icons[notification.type] || '🔔'}</span>
    <span>${escapeHtml((notification.title || '').replace(/^[^\p{L}\p{N}]+/u, ''))}</span>
    <span class="feed-item-time">agora</span>`;
  feed.insertBefore(item, feed.firstChild);
  const items = feed.querySelectorAll('.feed-item');
  if (items.length > 20) items[items.length - 1].remove();
  if (!state.feedOpen) {
    state.feedUnread++;
    const badge = document.getElementById('feed-count-badge');
    badge.textContent = state.feedUnread;
    badge.style.display = 'inline-block';
    if (MOTION) gsap.from(badge, { scale: 0, duration: 0.2, ease: 'back.out(2)' });
  }
}

function toggleActivityFeed() {
  state.feedOpen = !state.feedOpen;
  document.getElementById('feed-content').classList.toggle('open', state.feedOpen);
  document.getElementById('feed-toggle-label').textContent = state.feedOpen ? '↓ Actividade recente' : '↑ Actividade recente';
  if (state.feedOpen) { state.feedUnread = 0; document.getElementById('feed-count-badge').style.display = 'none'; }
}

let _audioCtx = null;
function playSoundForEvent(type) {
  try {
    const ctx = _audioCtx || (_audioCtx = new (window.AudioContext || window.webkitAudioContext)());
    if (type === 'call') {
      [0, 0.2].forEach(off => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination); o.frequency.value = 880;
        const t = ctx.currentTime + off;
        g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        o.start(t); o.stop(t + 0.15);
      });
    } else {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = type === 'order' ? 660 : 440;
      g.gain.setValueAtTime(type === 'order' ? 0.1 : 0.07, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (type === 'order' ? 0.3 : 0.2));
      o.start(); o.stop(ctx.currentTime + 0.3);
    }
  } catch (_) {}
}

async function loadActiveComandas() {
  const { data } = await db.from('comandas').select('*')
    .eq('espaco_slug', window.ESPACO_SLUG).in('status', ['open', 'submitted', 'preparing', 'ready']);
  const statusMap = { open: 'active', submitted: 'order_new', preparing: 'active', ready: 'ready' };
  (data || []).forEach(c => {
    const num = extractTableNumber(c.table_label);
    if (!num || !state.tables[num]) return;
    updateTableStatus(num, statusMap[c.status] || 'active', { comanda: {
      id: c.id, total: c.total, guestCount: c.guest_count, code: c.session_code, mode: c.mode } });
  });
}

async function loadTodayStats() {
  const today = new Date().toISOString().split('T')[0];
  const [orders, calls] = await Promise.all([
    db.from('orders_log').select('total').eq('espaco_slug', window.ESPACO_SLUG).gte('created_at', today),
    db.from('staff_calls').select('id').eq('espaco_slug', window.ESPACO_SLUG).gte('created_at', today),
  ]);
  state.todayStats.orders = (orders.data || []).length;
  state.todayStats.calls = (calls.data || []).length;
  state.todayStats.revenue = (orders.data || []).reduce((s, o) => s + (Number(o.total) || 0), 0);
  updateStats();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  else document.exitFullscreen?.();
}

function salaToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'nexo-sala-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  if (MOTION) gsap.fromTo(toast, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' });
  setTimeout(() => {
    if (MOTION) gsap.to(toast, { opacity: 0, y: -8, duration: 0.2, ease: 'power2.in', onComplete: () => toast.remove() });
    else toast.remove();
  }, 3000);
}
