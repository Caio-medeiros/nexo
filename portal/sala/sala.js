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
  configCount: 10,
  tables: {},
  activeFilter: 'all',
  selectedTable: null,
  feedOpen: false,
  feedUnread: 0,
  todayStats: { revenue: 0, orders: 0, calls: 0 },
};

function fmtEUR(v) {
  // Venues sem € no portal (ex.: No Manches): faturamento só na área financeira.
  if (typeof moneyHiddenFor === 'function' && moneyHiddenFor(window.ESPACO_SLUG)) return '—';
  // Mesmo formato do resto do portal: "€ 1.240,50".
  const n = Number(v) || 0;
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return (n < 0 ? '−€ ' : '€ ') + int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + dec;
}
function escapeHtml(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }

// Items of the currently-open table (for the payment log) + gift card state.
let selectedItems = [];
let giftDiscount = 0, giftCodeUsed = null;

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
async function initSala() {
  const slug = window.ESPACO_SLUG;
  document.getElementById('sala-venue-name').textContent = window.ESPACO_NAME || slug;

  try {
    const { data: venue } = await db.from('venue_settings')
      .select('*').eq('espaco_slug', slug).maybeSingle();
    // A configuração (Definições) é a base DIÁRIA. Ajustes feitos aqui no Salão
    // (dividir/juntar mesas durante o serviço) valem só para hoje e repõem-se no
    // dia seguinte — nunca alteram a configuração base.
    if (venue && venue.table_count >= 1) state.configCount = venue.table_count;
  } catch (e) { console.warn('[Sala] venue_settings inacessível:', e); }
  state.tableCount = readDailyTableCount(slug, state.configCount);

  for (let i = 1; i <= state.tableCount; i++) {
    state.tables[i] = { status: 'empty', comanda: null, calls: [] };
  }

  renderFloorPlan(state.tableCount, false);
  updateTableCountLabel();
  await loadActiveComandas();
  await loadPendingCalls();
  await loadAwaitingConfirm();
  await loadTodayStats();
  subscribeToRealtime();
  subscribeToVenueChanges();
  startStaleSweep();

  // Deep-link from the menu's "Mostrar ao staff" QR
  const pre = new URLSearchParams(location.search).get('comanda');
  if (pre) openTableByCode(pre);
}
window.initSala = initSala;

// ─────────────────────────────────────────
// FLOOR PLAN
// ─────────────────────────────────────────
function getGridConfig(count) {
  // Todas as mesas têm de caber no ecrã (100vh, sem scroll). Escolhemos um nº
  // de colunas que aproxime o grid de um tablet em paisagem (mais largo que
  // alto) e calculamos as linhas necessárias para que rows×cols ≥ count.
  let cols = Math.ceil(Math.sqrt(count * 1.7));
  cols = Math.max(2, Math.min(cols, 8));
  let rows = Math.ceil(count / cols);
  // reduz colunas se sobrar uma linha quase vazia (mantém o grid equilibrado)
  while (cols > 2 && Math.ceil(count / (cols - 1)) === rows) cols--;
  rows = Math.ceil(count / cols);
  const size = count <= 6 ? 'lg' : count <= 12 ? 'md' : count <= 20 ? 'sm' : 'xs';
  return { cols, rows, size };
}

function renderFloorPlan(count, animate = true) {
  const grid = document.getElementById('table-grid');
  const config = getGridConfig(count);
  grid.style.setProperty('--grid-cols', config.cols);
  grid.style.setProperty('--grid-rows', config.rows);
  grid.dataset.size = config.size;

  const existing = new Set([...grid.querySelectorAll('.table-card')].map(el => parseInt(el.dataset.tableNum)));

  for (let i = 1; i <= count; i++) {
    if (!existing.has(i)) {
      const card = createTableCard(i);
      card.classList.add('new');
      grid.appendChild(card);
    }
  }

  // Remove mesas a mais — sem animação que possa deixar a célula "presa".
  grid.querySelectorAll('.table-card').forEach(card => {
    if (parseInt(card.dataset.tableNum) > count) card.remove();
  });

  // Anima SÓ os cartões novos, com fromTo + clearProps + overwrite — assim
  // cliques rápidos no "+" nunca deixam mesas invisíveis/meio-criadas.
  const newCards = grid.querySelectorAll('.table-card.new');
  newCards.forEach(c => c.classList.remove('new'));
  if (MOTION && newCards.length) {
    gsap.killTweensOf(newCards);
    gsap.fromTo(newCards,
      { scale: 0.85, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.32, ease: 'back.out(1.4)', overwrite: 'auto', clearProps: 'transform,opacity',
        stagger: { amount: Math.min(0.3, newCards.length * 0.03), from: 'start' } });
  }
  if (state.activeFilter !== 'all') applyCurrentFilter();
}

// Estados visuais → rótulo legível (intuitivo para o empregado).
const STATE_LABELS = {
  empty: 'Livre', open: 'Aberta', active: 'Ocupada',
  order_new: 'Novo pedido', ready: 'Pronto', calling: 'A chamar',
};

function createTableCard(num) {
  const card = document.createElement('div');
  card.className = 'table-card';
  card.dataset.tableNum = num;
  card.dataset.status = 'empty';
  card.onclick = () => openTableDetail(num);
  card.innerHTML = `
    <span class="chair chair-top"></span><span class="chair chair-bottom"></span>
    <span class="chair chair-left"></span><span class="chair chair-right"></span>
    <div class="card-top">
      <div class="table-number">${num}</div>
      <div class="card-top-right">
        <span class="confirm-chip" aria-label="Confirmar pedido">📋</span>
        <span class="call-chip" aria-label="A chamar">🙋</span>
        <div class="table-status-dot"></div>
      </div>
    </div>
    <div class="card-summary">
      <p class="card-state-label" id="state-${num}">Livre</p>
      <div class="card-order-summary" id="summary-${num}">
        <div class="summary-total" id="total-${num}">€0,00</div>
        <div class="summary-meta" id="meta-${num}"></div>
      </div>
    </div>`;
  return card;
}

// Mesa "Aberta" (comanda sem consumo) vs "Ocupada" (já tem itens/total) — uma
// mesa a €0 e 0 itens não deve parecer ocupada (evita o "azul" confuso).
function visualStatus(raw, comanda) {
  if (raw === 'calling' || raw === 'order_new' || raw === 'ready') return raw;
  if (raw === 'active' || raw === 'open') {
    const total = Number(comanda?.total) || 0;
    const items = Number(comanda?.itemCount) || 0;
    return (total > 0 || items > 0) ? 'active' : 'open';
  }
  return raw;
}

// ─────────────────────────────────────────
// TABLE STATE
// ─────────────────────────────────────────
function updateTableStatus(tableNum, status, data = {}) {
  const card = document.querySelector(`[data-table-num="${tableNum}"]`);
  if (!card) return;
  // Resolve "aberta" vs "ocupada" a partir do consumo real.
  const vstatus = visualStatus(status, data.comanda);
  card.dataset.status = vstatus;
  state.tables[tableNum] = { ...state.tables[tableNum], status: vstatus, ...data };

  const stateEl = document.getElementById(`state-${tableNum}`);
  if (stateEl) stateEl.textContent = STATE_LABELS[vstatus] || STATE_LABELS.active;

  if (MOTION) gsap.fromTo(card, { scale: 0.97 }, { scale: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });

  if (data.comanda) {
    const total = data.comanda.total || 0;
    const items = data.comanda.itemCount || 0;
    // 👥 só quando a mesa é partilhada por várias pessoas via o menu (>1).
    const guests = data.comanda.guestCount || 0;
    const totalEl = document.getElementById(`total-${tableNum}`);
    const metaEl = document.getElementById(`meta-${tableNum}`);
    if (totalEl) {
      // Inverso do fmtEUR "€ 1.240,50": tira símbolo/espaços/pontos de milhar.
      const current = parseFloat(totalEl.textContent.replace(/[€\s.−]/g, '').replace(',', '.')) || 0;
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
// ALERTAS DA MESA
// Sem "pills" flutuantes (transbordavam para as mesas vizinhas quando havia
// pedido + chamada ao mesmo tempo). O estado da mesa é sempre legível DENTRO
// do cartão: borda + rótulo (Novo pedido) + anel/chip vermelho (A chamar).
// Aqui só fica o sinal sonoro.
function alertSound(type) { playSoundForEvent(type); }

// ─────────────────────────────────────────
// REALTIME
// ─────────────────────────────────────────
function subscribeToRealtime() {
  const slug = window.ESPACO_SLUG;
  const ch = db.channel('sala-live-' + slug)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comandas', filter: `espaco_slug=eq.${slug}` }, p => handleNewComanda(p.new))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'comandas', filter: `espaco_slug=eq.${slug}` }, p => handleComandaUpdate(p.new))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'staff_calls', filter: `espaco_slug=eq.${slug}` }, p => handleStaffCall(p.new))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'staff_calls', filter: `espaco_slug=eq.${slug}` }, () => loadPendingCalls())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comanda_items', filter: `espaco_slug=eq.${slug}` }, p => handleAwaitingItemChange(p))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders_log', filter: `espaco_slug=eq.${slug}` }, p => handleNewOrder(p.new))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'portal_notifications', filter: `espaco_slug=eq.${slug}` }, p => addToActivityFeed(p.new))
    .subscribe(s => {
      if (typeof setLiveState === 'function') setLiveState(s === 'SUBSCRIBED' ? 'connected' : 'reconnecting');
      // Ao (re)ligar, ressincroniza já — apanha mesas/pedidos perdidos enquanto
      // o realtime esteve em baixo.
      if (s === 'SUBSCRIBED') reloadSalaLive();
    });
  if (typeof trackChannel === 'function') trackChannel(ch);

  // Rede de segurança: recarrega ao voltar online / ficar visível / poll
  // periódico, mesmo que o realtime morra em silêncio.
  if (window.NexoLiveSync) NexoLiveSync.register(() => reloadSalaLive(), { pollMs: 18000 });
}

// Ressincronização completa e idempotente do estado da sala.
let _salaReloadBusy = false;
async function reloadSalaLive() {
  if (_salaReloadBusy) return;
  _salaReloadBusy = true;
  try {
    await loadActiveComandas();
    await loadPendingCalls();
    await loadAwaitingConfirm();
    await loadTodayStats();
  } catch (e) { console.warn('[Sala] reload', e); }
  _salaReloadBusy = false;
}

function handleNewComanda(comanda) {
  const tableNum = tableNumberOf(comanda);
  if (!tableNum || !state.tables[tableNum]) return;
  updateTableStatus(tableNum, 'active', { comanda: {
    id: comanda.id, total: comanda.total, itemCount: 0,
    guestCount: comanda.guest_count, code: comanda.session_code, mode: comanda.mode } });
  alertSound('cart');
  addToActivityFeed({ type: 'order_new', title: `🛒 Comanda — ${comanda.table_label}`, created_at: new Date().toISOString() });
}

function handleComandaUpdate(comanda) {
  // #4/#5: usa a coluna table_number — assim FECHAR liberta a mesa CERTA (o
  // regex sobre o label podia libertar a errada e deixar a real "presa").
  const tableNum = tableNumberOf(comanda);
  if (!tableNum || !state.tables[tableNum]) return;
  const statusMap = { submitted: 'order_new', preparing: 'active', ready: 'ready', open: 'active', closed: 'empty', cancelled: 'empty' };
  const uiStatus = statusMap[comanda.status] || 'active';

  if (comanda.status === 'closed' || comanda.status === 'cancelled') {
    setCalling(tableNum, false);
    setAwaitingConfirm(tableNum, false);
    state.tables[tableNum] = { status: 'empty', comanda: null, calls: [] };
    const card = document.querySelector(`[data-table-num="${tableNum}"]`);
    if (card) { card.dataset.status = 'empty';
      const tEl = document.getElementById(`total-${tableNum}`); if (tEl) tEl.textContent = '€0,00';
      const mEl = document.getElementById(`meta-${tableNum}`); if (mEl) mEl.textContent = '';
      const sEl = document.getElementById(`state-${tableNum}`); if (sEl) sEl.textContent = STATE_LABELS.empty; }
    updateStats();
    return;
  }

  // O nº de itens não vem na linha da comanda — contamos para não mostrar
  // "0 itens" numa mesa com consumo (ex.: €242). Mantém o último valor enquanto
  // carrega.
  const prevItems = state.tables[tableNum]?.comanda?.itemCount || 0;
  updateTableStatus(tableNum, uiStatus, { comanda: {
    id: comanda.id, total: comanda.total, itemCount: prevItems, guestCount: comanda.guest_count,
    code: comanda.session_code, mode: comanda.mode } });
  fetchItemCount(comanda.id).then(n => {
    if (state.selectedTable !== tableNum && state.tables[tableNum]?.comanda?.id === comanda.id) {
      updateTableStatus(tableNum, uiStatus, { comanda: { ...state.tables[tableNum].comanda, itemCount: n } });
    }
  });

  if (comanda.status === 'submitted') {
    alertSound('order');
    state.todayStats.orders++; state.todayStats.revenue += Number(comanda.total) || 0; updateStats();
  }
  if (comanda.status === 'ready') alertSound('ready');
}

function handleStaffCall(call) {
  const tableNum = extractTableNumber(call.table_label);
  if (!tableNum || !state.tables[tableNum]) return;
  // "A chamar" é uma camada SEPARADA do estado da mesa — assim uma mesa pode
  // mostrar o pedido (Novo pedido / Ocupada) E a chamada ao mesmo tempo.
  setCalling(tableNum, true);

  if (MOTION) {
    const sel = `[data-table-num="${tableNum}"]`;
    gsap.timeline()
      .to(sel, { x: -4, duration: 0.06, ease: 'power2.out' })
      .to(sel, { x: 4, duration: 0.06, ease: 'power2.inOut' })
      .to(sel, { x: -3, duration: 0.05 })
      .to(sel, { x: 0, duration: 0.05 });
  }
  alertSound('call');
  state.todayStats.calls++; updateStats();
  addToActivityFeed({ type: 'staff_call', title: `🙋 Chamada — ${call.table_label}`, created_at: new Date().toISOString() });
}

// Liga/desliga a camada "A chamar" sem tocar no estado base (pedido/ocupada).
// O chip 🙋 e o anel vermelho são CSS, accionados por data-calling — sempre
// dentro do cartão, nunca transbordam para as mesas vizinhas.
function setCalling(tableNum, on) {
  if (!state.tables[tableNum]) return;
  state.tables[tableNum].calling = on;
  const card = document.querySelector(`[data-table-num="${tableNum}"]`);
  if (card) { if (on) card.dataset.calling = 'true'; else card.removeAttribute('data-calling'); }
}

// Reconcilia a camada "A chamar" com a base de dados — silenciosa (sem som).
// Garante que NENHUMA chamada de empregado se perde: mostra chamadas feitas
// antes da página abrir, recupera chamadas perdidas se o realtime caiu, e
// limpa as que já foram atendidas noutro dispositivo. Corre no arranque e em
// cada ressincronização (reconexão / visível / poll).
async function loadPendingCalls() {
  const since = new Date(Date.now() - 30 * 60000).toISOString(); // últimos 30 min
  const { data } = await db.from('staff_calls')
    .select('table_label, delivered_count, created_at')
    .eq('espaco_slug', window.ESPACO_SLUG)
    .gte('created_at', since);
  const callingNums = new Set();
  (data || []).forEach((c) => {
    if (c.delivered_count) return; // já atendida
    const n = extractTableNumber(c.table_label);
    if (n && state.tables[n]) callingNums.add(n);
  });
  Object.keys(state.tables).forEach((numStr) => {
    const num = +numStr;
    const should = callingNums.has(num);
    if (should && !state.tables[num].calling) setCalling(num, true);
    else if (!should && state.tables[num].calling) setCalling(num, false);
  });
}

// ─────────────────────────────────────────
// "CONFIRMAR PEDIDO" (pedido assistido) — camada DISTINTA da chamada
// Fonte: comanda_items.status='awaiting_staff' (o menu deixa-os sem ronda).
// NÃO é um staff_call (chamada de empregado): é uma comanda à espera de o
// staff a confirmar. O sinal sonoro + a acção de confirmar vivem no drawer
// global (pending-orders.js); aqui marcamos a MESA no plano da sala com um
// anel/chip DOURADO para o empregado distinguir no relance de uma chamada.
// ─────────────────────────────────────────
function setAwaitingConfirm(tableNum, on) {
  if (!state.tables[tableNum]) return;
  state.tables[tableNum].awaiting = on;
  const card = document.querySelector(`[data-table-num="${tableNum}"]`);
  if (card) { if (on) card.dataset.awaiting = 'true'; else card.removeAttribute('data-awaiting'); }
}

const _awaitingFeeded = new Set(); // 1 entrada no feed por comanda a aguardar
async function loadAwaitingConfirm() {
  // Só venues assistidos têm itens 'awaiting_staff'; nos restantes é no-op.
  const { data } = await db.from('comanda_items')
    .select('comanda_id, comandas!inner(table_label, table_number, status)')
    .eq('espaco_slug', window.ESPACO_SLUG)
    .eq('status', 'awaiting_staff');
  const awaitingNums = new Set();
  const liveComandas = new Set();
  (data || []).forEach((r) => {
    const c = r.comandas;
    if (!c || c.status === 'closed' || c.status === 'cancelled') return;
    const n = tableNumberOf(c);
    if (n && state.tables[n]) { awaitingNums.add(n); liveComandas.add(r.comanda_id); }
  });
  Object.keys(state.tables).forEach((numStr) => {
    const num = +numStr;
    const should = awaitingNums.has(num);
    if (should && !state.tables[num].awaiting) setAwaitingConfirm(num, true);
    else if (!should && state.tables[num].awaiting) setAwaitingConfirm(num, false);
  });
  [..._awaitingFeeded].forEach(id => { if (!liveComandas.has(id)) _awaitingFeeded.delete(id); });
}

let _awaitingDebounce = null;
function handleAwaitingItemChange(payload) {
  // Nova entrada 'awaiting_staff' → uma linha DISTINTA no feed (📋 Confirmar
  // pedido), separada da chamada (🙋). Sem som — o toast global já soa.
  const row = payload && payload.new;
  if (payload.eventType === 'INSERT' && row && row.status === 'awaiting_staff' &&
      row.comanda_id && !_awaitingFeeded.has(row.comanda_id)) {
    _awaitingFeeded.add(row.comanda_id);
    db.from('comandas').select('table_label').eq('id', row.comanda_id).maybeSingle()
      .then(({ data }) => {
        const label = (data && data.table_label) || 'Mesa';
        addToActivityFeed({ type: 'order_new', title: `📋 Confirmar pedido — ${label}`, created_at: new Date().toISOString() });
      });
  }
  clearTimeout(_awaitingDebounce);
  _awaitingDebounce = setTimeout(loadAwaitingConfirm, 400);
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
  alertSound('order');
}

// ─────────────────────────────────────────
// VENUE SETTINGS SUBSCRIPTION
// ─────────────────────────────────────────
function subscribeToVenueChanges() {
  const slug = window.ESPACO_SLUG;
  const ch = db.channel('sala-venue-' + slug)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'venue_settings', filter: `espaco_slug=eq.${slug}` }, p => {
      const newCount = p.new.table_count;
      state.configCount = newCount;
      if (newCount !== state.tableCount) {
        state.tableCount = newCount;
        for (let i = 1; i <= newCount; i++) if (!state.tables[i]) state.tables[i] = { status: 'empty', comanda: null, calls: [] };
        renderFloorPlan(newCount, true);
        updateTableCountLabel();
        writeDailyTableCount(slug, newCount);
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
  const tableData = state.tables[tableNum];
  // Mesa a chamar: tocar marca a chamada como atendida (volta ao estado normal).
  if (tableData?.calling) {
    acknowledgeCall(tableNum);
    if (!tableData?.comanda?.id) return; // era só uma chamada — atendida, nada a abrir
  }
  // Só se entra numa mesa com código gerado (comanda criada pelo cliente via
  // menu, ou ao dividir). Mesa livre não abre — o pedido começa no menu.
  if (!tableData?.comanda?.id) {
    salaToast('Mesa livre — abre quando o cliente faz o pedido pelo menu.');
    return;
  }
  state.selectedTable = tableNum;
  document.getElementById('tdp-title').textContent = `Mesa ${tableNum}`;
  document.getElementById('tdp-code').textContent = tableData?.comanda?.code || '';

  const body = document.getElementById('tdp-body');
  body.innerHTML = '<div class="tdp-loading">A carregar...</div>';

  const { data: items } = await db.from('comanda_items').select('*')
    .eq('comanda_id', tableData.comanda.id).neq('status', 'cancelled').order('created_at');
  selectedItems = items || [];
  renderTableDetailItems(selectedItems, tableData.comanda);

  document.getElementById('table-detail-overlay').classList.add('visible');
  document.getElementById('table-detail-panel').classList.add('visible');
}

// Marca a chamada da mesa como atendida — limpa a camada "A chamar" e repõe o
// estado normal. Funciona com ou sem comanda.
async function acknowledgeCall(tableNum) {
  setCalling(tableNum, false);
  salaToast(`Mesa ${tableNum} — chamada atendida`);
  try {
    await db.from('staff_calls').update({ delivered_count: 1 })
      .eq('espaco_slug', window.ESPACO_SLUG).eq('table_label', `Mesa ${tableNum}`).eq('delivered_count', 0);
  } catch (_) {}
}

function closeTableDetail(event) {
  // Clique no painel (não no fundo) não fecha; o ✕ e o fundo fecham sempre.
  if (event && event.target !== document.getElementById('table-detail-overlay')) return;
  forceCloseTableDetail();
}
// Sair da mesa quando quiser — fecha sempre (✕, fundo ou tecla Esc).
function forceCloseTableDetail() {
  document.getElementById('table-detail-overlay').classList.remove('visible');
  document.getElementById('table-detail-panel').classList.remove('visible');
  state.selectedTable = null;
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.selectedTable != null) forceCloseTableDetail();
});

const TDP_STATUS_ICON = { sent: '⏳', preparing: '🔥', ready: '✅', served: '✓', delivered: '✓', pending: '📋' };
function renderTableDetailItems(items, comanda) {
  const body = document.getElementById('tdp-body');
  if (!items.length) { body.innerHTML = '<div class="tdp-empty"><p>Sem itens ainda</p>' +
    `<button class="tdp-full-btn" onclick="addItemToActiveTable()">+ Adicionar item</button></div>`; return; }

  // Itens por enviar (adicionados pelo staff, ainda sem ronda) vs. já enviados.
  const pending = items.filter(i => i.status === 'pending' && !i.round_id);
  const sent = items.filter(i => !(i.status === 'pending' && !i.round_id));

  let html = '';

  // ── POR ENVIAR (destaque) ──
  if (pending.length) {
    html += `<div class="tdp-pending-block">
      <div class="tdp-section-head pending">📋 Por enviar à cozinha <span class="tdp-pending-count">${pending.length}</span></div>`;
    pending.forEach(it => {
      html += `<div class="tdp-item pending" data-item-id="${it.id}">
        <div class="tdp-item-info">
          <span class="tdp-item-name">${escapeHtml(it.item_name)}</span>
          ${it.notes ? `<span class="tdp-item-note">${escapeHtml(it.notes)}</span>` : ''}
        </div>
        <div class="tdp-qty-ctl">
          <button class="tdp-qty-btn" onclick="changePendingQty('${it.id}',-1)" aria-label="Menos um">−</button>
          <span class="tdp-qty-val">${it.quantity}</span>
          <button class="tdp-qty-btn" onclick="changePendingQty('${it.id}',1)" aria-label="Mais um">+</button>
        </div>
        <span class="tdp-item-price">${fmtEUR((it.item_price || 0) * it.quantity)}</span>
        <button class="tdp-void-btn" onclick="editItemSala('${it.id}')" title="Editar quantidade/nota/preço">✎</button>
        <button class="tdp-remove-btn" onclick="removePendingItemSala('${it.id}')" title="Remover">×</button>
      </div>`;
    });
    html += `<button class="tdp-fire-btn" onclick="sendToKitchenFromPanel()">🍳 Enviar para a cozinha</button></div>`;
  }

  // ── JÁ ENVIADO (por ronda) ──
  const rounds = {};
  sent.forEach(it => { const r = it.round_number || 1; (rounds[r] = rounds[r] || []).push(it); });
  const roundKeys = Object.keys(rounds).sort((a, b) => a - b);
  roundKeys.forEach(round => {
    if (roundKeys.length > 1 || pending.length) html += `<div class="tdp-round-label">${parseInt(round) === 1 ? '1ª Ronda' : `${round}ª Ronda`}</div>`;
    rounds[round].forEach(it => {
      const isReady = it.status === 'ready', isDone = it.status === 'served' || it.status === 'delivered';
      const voidable = !['served', 'delivered', 'cancelled'].includes(it.status);
      html += `<div class="tdp-item ${isReady ? 'ready' : ''} ${isDone ? 'done' : ''}" data-item-id="${it.id}">
        <div class="tdp-item-info">
          <span class="tdp-item-name">${escapeHtml(it.item_name)}</span>
          ${it.notes ? `<span class="tdp-item-note">${escapeHtml(it.notes)}</span>` : ''}
        </div>
        <span class="tdp-item-qty">×${it.quantity}</span>
        <span class="tdp-item-price">${fmtEUR((it.item_price || 0) * it.quantity)}</span>
        <span class="tdp-item-status">${TDP_STATUS_ICON[it.status] || '⏳'}</span>
        ${voidable ? `<button class="tdp-void-btn" onclick="editItemSala('${it.id}')" title="Editar quantidade/nota/preço">✎</button>` : ''}
        ${voidable ? `<button class="tdp-void-btn" onclick="showVoidModal('${it.id}')" title="Anular item">✕</button>` : ''}
      </div>`;
    });
  });

  // Total cobrável: exclui anulados (a comanda.total já é mantida assim no servidor).
  const total = comanda.total || items.reduce((s, i) => s + (i.item_price || 0) * i.quantity, 0);
  html += `<div class="tdp-total-row"><span>Total da conta</span><span class="tdp-total-amount">${fmtEUR(total)}</span></div>
    <div class="tdp-actions-row">
      <button class="tdp-full-btn" onclick="addItemToActiveTable()">+ Adicionar item</button>
      <button class="tdp-full-btn" onclick="moveTableComanda()">⇄ Mover / fundir mesa</button>
    </div>`;
  body.innerHTML = html;
  if (MOTION) gsap.from('.tdp-item', { opacity: 0, x: -8, duration: 0.25, stagger: 0.04, ease: 'power2.out' });
}

// ── Anulação de item enviado (gera notificação p/ a Cozinha via trigger) ──
const VOID_REASONS_SALA = [
  ['erro_pedido', 'Erro no pedido'], ['cliente_desistiu', 'Cliente mudou de ideia'],
  ['produto_esgotado', 'Produto esgotado'], ['duplicado', 'Pedido duplicado'],
];
function showVoidModal(itemId) {
  const it = (selectedItems || []).find(x => x.id === itemId);
  const name = it ? it.item_name : 'Item';
  closeVoidModal();
  const modal = document.createElement('div');
  modal.className = 'void-modal-overlay';
  modal.id = 'void-modal-overlay';
  modal.addEventListener('click', (e) => { if (e.target === modal) closeVoidModal(); });
  modal.innerHTML = `
    <div class="void-modal">
      <h3 class="void-modal-title">Anular item</h3>
      <p class="void-modal-item-name">“${escapeHtml(name)}”</p>
      <p class="void-modal-sub">Este item já foi enviado à cozinha. Indique o motivo:</p>
      <div class="void-reasons">
        ${VOID_REASONS_SALA.map(([r, label]) => `<button class="void-reason-btn" onclick="confirmVoid('${itemId}','${r}')">${label}</button>`).join('')}
      </div>
      <button class="void-cancel-btn" onclick="closeVoidModal()">Cancelar</button>
    </div>`;
  document.body.appendChild(modal);
  if (MOTION) gsap.from(modal.querySelector('.void-modal'), { scale: 0.95, opacity: 0, duration: 0.2, ease: 'power2.out' });
}
function closeVoidModal() { const m = document.getElementById('void-modal-overlay'); if (m) m.remove(); }
async function confirmVoid(itemId, reason) {
  closeVoidModal();
  try {
    await db.from('comanda_items').update({
      status: 'cancelled', void_reason: reason,
      void_at: new Date().toISOString(), void_by: 'staff',
    }).eq('id', itemId);
    salaToast('Item anulado. Cozinha notificada.');
    if (state.selectedTable) await openTableDetail(state.selectedTable);
  } catch (e) { console.error(e); salaToast('Erro ao anular'); }
}

// Remove um item ainda por enviar (pendente) — só funciona antes de ir à cozinha.
async function removePendingItemSala(itemId) {
  try {
    await db.from('comanda_items').delete().eq('id', itemId).eq('status', 'pending').is('round_id', null);
    if (state.selectedTable) await openTableDetail(state.selectedTable);
  } catch (e) { console.error(e); salaToast('Erro ao remover'); }
}
// Ajusta a quantidade de um item pendente (≤0 remove). Só itens por enviar.
async function changePendingQty(itemId, delta) {
  const it = (selectedItems || []).find(x => x.id === itemId);
  if (!it) return;
  const next = (it.quantity || 1) + delta;
  if (next < 1) return removePendingItemSala(itemId);
  try {
    await db.from('comanda_items').update({ quantity: next })
      .eq('id', itemId).eq('status', 'pending').is('round_id', null);
    if (state.selectedTable) await openTableDetail(state.selectedTable);
  } catch (e) { console.error(e); }
}
// #3 — poder TOTAL do staff sobre a conta: editar quantidade/nota/preço de
// QUALQUER item (incluindo já enviados — corrige enganos sem SQL nem apagar e
// recomeçar). O trigger do servidor (016) recalcula o total da comanda.
async function editItemSala(itemId) {
  const it = (selectedItems || []).find(x => x.id === itemId);
  if (!it) return;
  const qRaw = prompt('Quantidade:', it.quantity); if (qRaw == null) return;
  const qty = Math.max(1, parseInt(qRaw, 10) || it.quantity);
  const pRaw = prompt('Preço unitário (€):', String(it.item_price ?? 0)); if (pRaw == null) return;
  const price = parseFloat(String(pRaw).replace(',', '.'));
  const nRaw = prompt('Nota (deixe vazio para remover):', it.notes || '');
  const note = nRaw == null ? it.notes : (String(nRaw).trim() || null);
  try {
    await db.from('comanda_items').update({
      quantity: qty,
      item_price: isNaN(price) ? it.item_price : Math.max(0, price),
      notes: note,
    }).eq('id', itemId);
    salaToast('Item atualizado.');
    if (state.selectedTable) await openTableDetail(state.selectedTable);
  } catch (e) { console.error(e); salaToast('Erro ao editar item'); }
}

window.showVoidModal = showVoidModal; window.confirmVoid = confirmVoid;
window.closeVoidModal = closeVoidModal; window.removePendingItemSala = removePendingItemSala;
window.changePendingQty = changePendingQty; window.editItemSala = editItemSala;

async function addItemToActiveTable() {
  const tableNum = state.selectedTable;
  // Sem passo "Abrir comanda": a comanda é criada na 1ª adição de item.
  let tableData = state.tables[tableNum];
  if (!tableData?.comanda?.id) {
    const created = await ensureComanda(tableNum);
    if (!created) return;
    tableData = state.tables[tableNum];
  }
  const name = prompt('Nome do item:'); if (!name) return;
  const price = parseFloat((prompt('Preço (€):') || '').replace(',', '.')); if (isNaN(price)) return;
  const qty = parseInt(prompt('Quantidade:') || '1') || 1;
  // Entra como PENDENTE (por enviar). O botão "Enviar para a cozinha" cria a ronda.
  await db.from('comanda_items').insert({
    comanda_id: tableData.comanda.id, espaco_slug: window.ESPACO_SLUG,
    item_name: name, item_price: price, quantity: qty, added_by: 'staff',
    status: 'pending', course: 'principal' });
  await openTableDetail(tableNum);
}

// ── FASE 4 (043): MOVER a conta para outra mesa (corrigir engano) ─────────
// Respeita o índice único: se a mesa destino já tem conta aberta, a BD
// devolve unique_violation (23505) e oferecemos FUNDIR as duas contas.
async function moveTableComanda() {
  const tableNum = state.selectedTable;
  const td = state.tables[tableNum];
  if (!td?.comanda?.id) { salaToast('Mesa sem conta para mover.'); return; }
  const raw = prompt(`Mover a conta da Mesa ${tableNum} para que mesa?`);
  if (raw == null) return;
  const dest = parseInt(String(raw).replace(/\D/g, ''), 10);
  if (!dest || dest < 1 || dest > state.tableCount) { salaToast('Nº de mesa inválido.'); return; }
  if (dest === tableNum) { salaToast('A conta já está nessa mesa.'); return; }
  try {
    const { error } = await db.from('comandas')
      .update({ table_number: dest, table_label: `Mesa ${dest}` })
      .eq('id', td.comanda.id);
    if (error) {
      if (error.code === '23505') return offerMergeTables(tableNum, dest, td.comanda.id);
      throw error;
    }
    salaToast(`Conta movida para a Mesa ${dest}.`);
    forceCloseTableDetail();
    await reloadSalaLive();
  } catch (e) { console.error(e); salaToast('Erro ao mover a mesa.'); }
}

// Fundir: mesa destino já tem conta aberta → move os itens não anulados da
// origem para o destino e fecha a comanda de origem (respeita o invariante:
// no fim continua a haver UMA comanda aberta por mesa).
async function offerMergeTables(srcNum, destNum, srcComandaId) {
  const ok = confirm(`A Mesa ${destNum} já tem uma conta aberta.\n\nFUNDIR a conta da Mesa ${srcNum} com a da Mesa ${destNum}?`);
  if (!ok) return;
  try {
    const { data: destC } = await db.from('comandas')
      .select('id').eq('espaco_slug', window.ESPACO_SLUG).eq('table_number', destNum)
      .not('status', 'in', '(closed,cancelled)').is('archived_at', null)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!destC) { salaToast('Conta de destino não encontrada.'); return; }
    const { error: mErr } = await db.from('comanda_items')
      .update({ comanda_id: destC.id })
      .eq('comanda_id', srcComandaId).neq('status', 'cancelled');
    if (mErr) throw mErr;
    await db.from('comandas').update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', srcComandaId);
    salaToast(`Contas fundidas na Mesa ${destNum}.`);
    forceCloseTableDetail();
    await reloadSalaLive();
  } catch (e) { console.error(e); salaToast('Erro ao fundir as contas.'); }
}
window.moveTableComanda = moveTableComanda;

// Garante uma comanda aberta na mesa (auto-criada, sem passo manual).
// UMA comanda por mesa: antes de criar, reaproveita uma comanda activa já
// existente (aberta pelo cliente via QR, ou na Caixa) — conta unificada,
// nunca duplica mesas entre modos.
// SELECT resiliente: se uma coluna referida ainda não existir (migração por
// aplicar → Postgres 42703), repete a query sem ela em vez de devolver vazio
// (que deixaria a Sala em branco). build(fallback): fallback=false = query
// completa; fallback=true = versão sem a coluna em falta.
async function selectResilient(build) {
  let res = await build(false);
  const e = res.error;
  if (e && (e.code === '42703' || /does not exist/i.test(e.message || ''))) {
    console.warn('[sala] coluna em falta (migração por aplicar) — a usar fallback');
    res = await build(true);
  }
  return res;
}

async function ensureComanda(tableNum) {
  if (state.tables[tableNum]?.comanda?.id) return state.tables[tableNum].comanda;
  const label = `Mesa ${tableNum}`;
  const { data: existing } = await selectResilient((fallback) => {
    let q = db.from('comandas')
      .select('id, session_code, total')
      .eq('espaco_slug', window.ESPACO_SLUG).eq('table_label', label)
      .in('status', ['open', 'submitted', 'preparing', 'ready']);
    if (!fallback) q = q.is('archived_at', null);
    return q.order('created_at', { ascending: false }).limit(1);
  });
  if (existing && existing.length) {
    const c = existing[0];
    state.tables[tableNum] = { status: 'active', comanda: { id: c.id, code: c.session_code, total: c.total || 0 } };
    updateTableStatus(tableNum, 'active', { comanda: state.tables[tableNum].comanda });
    return state.tables[tableNum].comanda;
  }
  const { data, error } = await db.from('comandas').insert({
    espaco_slug: window.ESPACO_SLUG, table_label: label,
    status: 'open', mode: 'dine_in', guest_count: 1 }).select('id, session_code').single();
  if (error) { salaToast('Erro ao abrir comanda'); return null; }
  state.tables[tableNum] = { status: 'active', comanda: { id: data.id, code: data.session_code, total: 0 } };
  updateTableStatus(tableNum, 'active', { comanda: state.tables[tableNum].comanda });
  return state.tables[tableNum].comanda;
}

// Dispara uma RONDA com os itens pendentes (adicionados pelo staff). Os itens
// do menu já chegam enviados — aqui só se enviam os novos por enviar.
async function sendToKitchenFromPanel() {
  const tableNum = state.selectedTable;
  const c = state.tables[tableNum]?.comanda;
  if (!c?.id) { salaToast('Mesa sem comanda'); return; }
  const { data: pending } = await db.from('comanda_items').select('id')
    .eq('comanda_id', c.id).eq('status', 'pending').is('round_id', null);
  if (!pending || !pending.length) { salaToast('Sem itens novos para enviar'); return; }
  const { data: last } = await db.from('comanda_rounds').select('round_number')
    .eq('comanda_id', c.id).order('round_number', { ascending: false }).limit(1).maybeSingle();
  const rn = (last && last.round_number || 0) + 1;
  const { data: round, error } = await db.from('comanda_rounds').insert({
    comanda_id: c.id, espaco_slug: window.ESPACO_SLUG, round_number: rn,
    fired_by: 'staff', item_count: pending.length }).select('id').single();
  if (error) { console.error(error); salaToast('Erro ao enviar'); return; }
  await db.from('comanda_items').update({ status: 'sent', round_id: round.id, round_number: rn })
    .in('id', pending.map(p => p.id));
  await db.from('comandas').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', c.id);
  salaToast('Enviado para a cozinha ✓');
  closeTableDetail();
}

// ── Novo pedido rápido ────────────────────────────────────────
// O empregado regista um pedido para uma mesa (ex.: o cliente mostrou o
// pedido no telemóvel) e envia-o directamente para a cozinha — sem ter de
// abrir a mesa no plano de sala primeiro.
// Catálogo de itens do menu (fonte: config.js do espaço — a carta canónica).
// Cache em memória: { id, name, price (number), category }.
let _menuItems = null;
let _menuItemsLoading = null;

function parseMenuPrice(p) {
  if (typeof p === 'number') return p;
  if (!p) return 0;
  const n = String(p).replace(/[^\d.,]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.');
  const v = parseFloat(n);
  return isNaN(v) ? 0 : v;
}

// Carrega os itens da carta a partir de /menu/{slug}/config.js (mesmo método
// CSP-safe que o Editar Menu usa). Sem tabela de itens em Supabase, o config.js
// do menu é a fonte de verdade.
async function loadMenuItems() {
  if (_menuItems) return _menuItems;
  if (_menuItemsLoading) return _menuItemsLoading;
  const slug = window.ESPACO_SLUG;
  _menuItemsLoading = (async () => {
    try {
      const res = await fetch(`/menu/${slug}/config.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const CONFIG = await res.json();
      const out = [];
      if (CONFIG && Array.isArray(CONFIG.menu)) {
        CONFIG.menu.forEach(sec => {
          const cat = (sec.section && (sec.section.pt || sec.section.en)) || sec.id || '';
          (sec.items || []).forEach((it, idx) => {
            const name = (it.name && (it.name.pt || it.name.en)) || '';
            if (!name) return;
            out.push({ id: `${sec.id}:${idx}`, name, price: parseMenuPrice(it.price), category: cat });
          });
        });
      }
      _menuItems = out;
      return out;
    } catch (err) {
      console.error('[Sala] carregar itens do menu', err);
      _menuItems = [];
      return _menuItems;
    } finally {
      _menuItemsLoading = null;
    }
  })();
  return _menuItemsLoading;
}

// ── Novo pedido rápido ────────────────────────────────────────
// O empregado regista um pedido para uma mesa (touch-first): escolhe a mesa
// num grid de mesas livres e os itens por pesquisa da carta — sem texto livre
// nem preços manuais (o preço vem sempre do menu).
async function openNewOrder(prefillTable) {
  const ov = document.getElementById('new-order-overlay');
  const panel = document.getElementById('new-order-panel');
  if (!ov || !panel) return;
  const tableEl = document.getElementById('no-table');
  tableEl.value = (prefillTable != null ? String(prefillTable) : (state.selectedTable ? String(state.selectedTable) : ''));
  document.getElementById('no-items').innerHTML = '';
  ov.classList.add('show');
  panel.classList.add('show');

  renderTablePicker();
  const items = await loadMenuItems();
  const warn = document.getElementById('no-menu-warning');
  if (warn) warn.style.display = items.length ? 'none' : 'block';
  addNewOrderRow();
  updateNewOrderSubmit();
  if (!tableEl.value) tableEl.focus();
}

function closeNewOrder(e) {
  if (e && e.currentTarget && e.target !== e.currentTarget) return; // só fecha no backdrop
  document.getElementById('new-order-overlay')?.classList.remove('show');
  document.getElementById('new-order-panel')?.classList.remove('show');
}

// Grid de mesas: livres clicáveis, ocupadas a cinzento/disabled ("ocupada").
function renderTablePicker() {
  const grid = document.getElementById('no-table-grid');
  if (!grid) return;
  const n = state.tableCount || state.configCount || 0;
  let html = '';
  for (let i = 1; i <= n; i++) {
    const occupied = state.tables[i] && state.tables[i].status && state.tables[i].status !== 'empty';
    html += `<button type="button" class="no-table-btn${occupied ? ' occupied' : ''}"
      data-table="${i}" ${occupied ? 'disabled' : ''}>
      <span class="no-table-num">${i}</span>
      ${occupied ? '<span class="no-table-tag">ocupada</span>' : ''}
    </button>`;
  }
  grid.innerHTML = html;
}

// O input da mesa aceita só dígitos; selecionar um botão preenche-o.
const _noTableInput = () => document.getElementById('no-table');
document.addEventListener('input', (e) => {
  if (e.target && e.target.id === 'no-table') {
    e.target.value = e.target.value.replace(/\D/g, '');
    syncTablePickerSelection();
    updateNewOrderSubmit();
  }
});
document.addEventListener('click', (e) => {
  const btn = e.target.closest && e.target.closest('.no-table-btn');
  if (!btn || btn.disabled) return;
  const el = _noTableInput();
  if (el) { el.value = btn.dataset.table; }
  syncTablePickerSelection();
  updateNewOrderSubmit();
});
function syncTablePickerSelection() {
  const val = (_noTableInput()?.value || '').trim();
  document.querySelectorAll('#no-table-grid .no-table-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.table === val && !b.disabled);
  });
}

// Linha de item: SearchableSelect (pesquisa → seleção bloqueada) + stepper qty.
function addNewOrderRow() {
  const list = document.getElementById('no-items');
  if (!list) return;
  const row = document.createElement('div');
  row.className = 'no-row';
  row.dataset.itemId = '';
  row.dataset.itemName = '';
  row.dataset.itemPrice = '0';
  row.dataset.qty = '1';
  row.innerHTML = `
    <div class="no-pick">
      <input class="no-search" placeholder="Pesquisar item..." autocomplete="off" aria-label="Pesquisar item">
      <div class="no-dropdown" hidden></div>
      <div class="no-selected" hidden>
        <span class="no-sel-name"></span>
        <span class="no-sel-price"></span>
        <button type="button" class="no-sel-clear" aria-label="Mudar item">✕</button>
      </div>
    </div>
    <div class="no-qty-stepper" role="group" aria-label="Quantidade">
      <button type="button" class="no-qty-btn" data-qd aria-label="Menos">−</button>
      <span class="no-qty-val">1</span>
      <button type="button" class="no-qty-btn" data-qi aria-label="Mais">+</button>
    </div>
    <button type="button" class="no-row-del" aria-label="Remover linha">✕</button>`;
  list.appendChild(row);
  wireOrderRow(row);
  row.querySelector('.no-search').focus();
}

function wireOrderRow(row) {
  const search = row.querySelector('.no-search');
  const dropdown = row.querySelector('.no-dropdown');
  const selected = row.querySelector('.no-selected');
  const qtyVal = row.querySelector('.no-qty-val');

  function renderResults(q) {
    const items = _menuItems || [];
    const query = q.trim().toLowerCase();
    const matches = (query
      ? items.filter(it => it.name.toLowerCase().includes(query) || (it.category || '').toLowerCase().includes(query))
      : items
    ).slice(0, 40);
    if (!matches.length) {
      dropdown.innerHTML = `<div class="no-dd-empty">${items.length ? 'Sem resultados' : 'Menu não sincronizado'}</div>`;
    } else {
      dropdown.innerHTML = matches.map(it =>
        `<button type="button" class="no-dd-item" data-id="${it.id}" data-name="${escAttr(it.name)}" data-price="${it.price}">
          <span class="no-dd-name">${escapeHtml(it.name)}</span>
          <span class="no-dd-price">${fmtEUR(it.price)}</span>
        </button>`).join('');
    }
    dropdown.hidden = false;
  }
  search.addEventListener('focus', () => renderResults(search.value));
  search.addEventListener('input', () => renderResults(search.value));
  search.addEventListener('blur', () => { setTimeout(() => { dropdown.hidden = true; }, 150); });

  dropdown.addEventListener('click', (e) => {
    const opt = e.target.closest('.no-dd-item');
    if (!opt) return;
    row.dataset.itemId = opt.dataset.id;
    row.dataset.itemName = opt.dataset.name;
    row.dataset.itemPrice = opt.dataset.price;
    row.querySelector('.no-sel-name').textContent = opt.dataset.name;
    row.querySelector('.no-sel-price').textContent = fmtEUR(parseFloat(opt.dataset.price) || 0);
    selected.hidden = false;
    search.hidden = true;
    dropdown.hidden = true;
    updateNewOrderSubmit();
  });

  row.querySelector('.no-sel-clear').addEventListener('click', () => {
    row.dataset.itemId = ''; row.dataset.itemName = ''; row.dataset.itemPrice = '0';
    selected.hidden = true;
    search.hidden = false;
    search.value = '';
    search.focus();
    updateNewOrderSubmit();
  });

  row.querySelector('[data-qd]').addEventListener('click', () => {
    let q = Math.max(1, (parseInt(row.dataset.qty, 10) || 1) - 1);
    row.dataset.qty = String(q); qtyVal.textContent = q;
  });
  row.querySelector('[data-qi]').addEventListener('click', () => {
    let q = Math.min(20, (parseInt(row.dataset.qty, 10) || 1) + 1);
    row.dataset.qty = String(q); qtyVal.textContent = q;
  });
  row.querySelector('.no-row-del').addEventListener('click', () => {
    row.remove();
    updateNewOrderSubmit();
  });
}

// Lê as linhas com item escolhido (id/nome/preço do menu + qty).
function collectNewOrderRows() {
  return [...document.querySelectorAll('#no-items .no-row')]
    .filter(r => r.dataset.itemId)
    .map(r => ({
      id: r.dataset.itemId,
      name: r.dataset.itemName,
      price: parseFloat(r.dataset.itemPrice) || 0,
      qty: Math.max(1, Math.min(20, parseInt(r.dataset.qty, 10) || 1)),
    }));
}

// Submit só fica activo com mesa + pelo menos 1 item selecionado.
function updateNewOrderSubmit() {
  const btn = document.getElementById('no-submit');
  if (!btn) return;
  const hasTable = !!((_noTableInput()?.value || '').trim());
  const hasItems = collectNewOrderRows().length > 0;
  btn.disabled = !(hasTable && hasItems);
}

async function submitNewOrder() {
  const tableNum = parseInt((document.getElementById('no-table').value || '').trim(), 10);
  if (!tableNum) { salaToast('Indique o número da mesa'); return; }
  const rows = collectNewOrderRows();
  if (!rows.length) { salaToast('Selecione pelo menos um item'); return; }

  const btn = document.getElementById('no-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'A enviar…'; }
  try {
    const comanda = await ensureComanda(tableNum);
    if (!comanda) throw new Error('comanda');
    const { data: last } = await db.from('comanda_rounds').select('round_number')
      .eq('comanda_id', comanda.id).order('round_number', { ascending: false }).limit(1).maybeSingle();
    const rn = ((last && last.round_number) || 0) + 1;
    const { data: round, error: rErr } = await db.from('comanda_rounds').insert({
      comanda_id: comanda.id, espaco_slug: window.ESPACO_SLUG, round_number: rn,
      fired_by: 'staff', item_count: rows.length }).select('id').single();
    if (rErr) throw rErr;
    const { error: iErr } = await db.from('comanda_items').insert(rows.map(r => ({
      comanda_id: comanda.id, espaco_slug: window.ESPACO_SLUG, item_id: r.id, item_name: r.name,
      item_price: r.price, quantity: r.qty, added_by: 'staff', status: 'sent',
      course: 'principal', round_id: round.id, round_number: rn })));
    if (iErr) throw iErr;
    await db.from('comandas').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', comanda.id);
    salaToast(`Pedido enviado para a cozinha — Mesa ${tableNum} ✓`);
    closeNewOrder();
  } catch (err) {
    console.error('[Sala] novo pedido', err);
    salaToast('Erro ao enviar. Tente novamente.');
  }
  if (btn) { btn.disabled = false; btn.textContent = 'Enviar para a cozinha'; }
}

// ── Inline payment (Caixa, merged into Sala) ──────────────────
function processPaymentFromPanel() {
  const c = state.tables[state.selectedTable]?.comanda;
  if (!c?.id) { salaToast('Mesa sem comanda para cobrar'); return; }
  renderPaymentPanel(c);
}

function renderPaymentPanel(c) {
  giftDiscount = 0; giftCodeUsed = null;
  const body = document.getElementById('tdp-body');
  body.innerHTML = `
    <button class="tdp-full-btn" id="pay-back" style="margin-bottom:14px">← Voltar à comanda</button>
    <div class="tdp-total-row"><span>Total a pagar</span><span class="tdp-total-amount" id="pay-due">${fmtEUR(c.total)}</span></div>
    <p class="pay-title">Forma de pagamento</p>
    <div class="pay-methods">
      <button class="pay-btn" data-pay="cash">💵 Numerário</button>
      <button class="pay-btn" data-pay="card">💳 Cartão</button>
      <button class="pay-btn" data-pay="mbway">📱 MB Way</button>
    </div>
    <div class="gift-row">
      <input id="gift-code" placeholder="Código de oferta..." autocomplete="off">
      <button class="tdp-action-btn" id="gift-apply">Aplicar</button>
    </div>
    <div class="gift-applied" id="gift-applied" style="display:none"></div>`;
  body.querySelector('#pay-back').addEventListener('click', () => openTableDetail(state.selectedTable));
  body.querySelectorAll('[data-pay]').forEach(b => b.addEventListener('click', () => salaProcessPayment(b.dataset.pay, c)));
  body.querySelector('#gift-apply').addEventListener('click', () => salaApplyGiftCard(c));
}

async function salaApplyGiftCard(c) {
  const code = (document.getElementById('gift-code').value || '').trim().toUpperCase();
  if (!code) return;
  const { data: gift } = await db.from('gift_cards').select('*')
    .eq('code', code).eq('espaco_slug', window.ESPACO_SLUG).in('status', ['active', 'partially_used']).maybeSingle();
  if (!gift) { salaToast('Código de oferta inválido'); return; }
  giftDiscount = Math.min(Number(gift.remaining_value), Number(c.total));
  giftCodeUsed = code;
  const due = document.getElementById('pay-due');
  if (due) due.textContent = fmtEUR(Math.max(0, Number(c.total) - giftDiscount));
  const el = document.getElementById('gift-applied');
  el.style.display = 'block';
  el.textContent = `✓ ${fmtEUR(giftDiscount)} de desconto (resta ${fmtEUR(gift.remaining_value - giftDiscount)})`;
}

async function salaProcessPayment(method, c) {
  const due = Math.max(0, Number(c.total) - giftDiscount);
  const ML = { cash: 'Numerário', card: 'Cartão', mbway: 'MB Way' };
  const ok = await confirmModal({
    title: `Fechar Mesa ${state.selectedTable}`,
    body: `Total ${fmtEUR(c.total)}${giftDiscount ? ` · Oferta −${fmtEUR(giftDiscount)}` : ''} · A pagar ${fmtEUR(due)} via ${ML[method]}.`,
    confirmLabel: 'Confirmar pagamento',
  });
  if (!ok) return;
  try {
    await db.from('comandas').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', c.id);
    await db.from('orders_log').insert({
      espaco_slug: window.ESPACO_SLUG, table_label: c.table_label || `Mesa ${state.selectedTable}`,
      total: c.total, channel: 'staff', comanda_id: c.id,
      items: selectedItems.map(i => ({ name: i.item_name, qty: i.quantity, price: i.item_price })),
    });
    if (giftCodeUsed && giftDiscount > 0) {
      const { data: g } = await db.from('gift_cards').select('remaining_value').eq('code', giftCodeUsed).maybeSingle();
      if (g) {
        const rem = Math.max(0, Number(g.remaining_value) - giftDiscount);
        await db.from('gift_cards').update({ remaining_value: rem, status: rem > 0 ? 'partially_used' : 'fully_used', used_at: new Date().toISOString() }).eq('code', giftCodeUsed);
      }
    }
    salaToast(`Mesa ${state.selectedTable} fechada — ${fmtEUR(due)}`);
    giftDiscount = 0; giftCodeUsed = null;
    closeTableDetail();
    // realtime comanda(closed) clears the table; the local fallback below is instant
    handleComandaUpdate({ id: c.id, table_label: c.table_label || `Mesa ${state.selectedTable}`, status: 'closed' });
  } catch (e) { console.error(e); salaToast('Erro ao processar pagamento'); }
}

// ── Dynamic table management (owner sets/updates the floor) ────
// Ajuste DIÁRIO das mesas — só vale para hoje (localStorage), repõe-se amanhã a
// partir da configuração (Definições). Não escreve em venue_settings.
function dailyKey(slug) { return `nexo_sala_tables_${slug}_${new Date().toISOString().slice(0, 10)}`; }
function readDailyTableCount(slug, fallback) {
  try {
    const v = parseInt(localStorage.getItem(dailyKey(slug)) || '');
    if (!isNaN(v) && v >= 1) return v;
  } catch (_) {}
  return fallback || 10;
}
function writeDailyTableCount(slug, n) { try { localStorage.setItem(dailyKey(slug), String(n)); } catch (_) {} }

async function setTableCount(n) {
  n = Math.max(1, Math.min(60, n));
  if (n === state.tableCount) return n;
  state.tableCount = n;
  for (let i = 1; i <= n; i++) if (!state.tables[i]) state.tables[i] = { status: 'empty', comanda: null, calls: [] };
  renderFloorPlan(n, true);
  updateTableCountLabel();
  writeDailyTableCount(window.ESPACO_SLUG, n);
  return n;
}
function addTable() { setTableCount(state.tableCount + 1).then(() => salaToast('Mesa adicionada')); }
function removeTable() {
  const last = state.tableCount;
  if (last <= 1) { salaToast('Tem de existir pelo menos 1 mesa'); return; }
  if (state.tables[last] && state.tables[last].status !== 'empty') { salaToast(`Mesa ${last} está ocupada — liberte-a primeiro`); return; }
  setTableCount(last - 1);
}
// Split: a 4-top becomes two tables → add one and open a comanda on it.
async function splitTableFromPanel() {
  const newNum = state.tableCount + 1;
  if (newNum > 60) { salaToast('Máximo de 60 mesas'); return; }
  await setTableCount(newNum);
  try {
    await db.from('comandas').insert({ espaco_slug: window.ESPACO_SLUG, table_label: `Mesa ${newNum}`, status: 'open', mode: 'dine_in', guest_count: 1 });
  } catch (_) {}
  salaToast(`Mesa ${newNum} criada — divida os clientes/itens`);
  closeTableDetail();
}
function updateTableCountLabel() {
  const el = document.getElementById('mesas-total');
  if (el) el.textContent = state.tableCount;
}

// Open a specific table from the menu's "Mostrar ao staff" QR (?comanda=CODE).
async function openTableByCode(code) {
  try {
    const { data } = await db.from('comandas').select('table_label, table_number')
      .eq('session_code', String(code).toUpperCase()).eq('espaco_slug', window.ESPACO_SLUG).maybeSingle();
    const num = data && tableNumberOf(data);
    if (num && state.tables[num]) openTableDetail(num);
  } catch (_) {}
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function extractTableNumber(label) {
  if (!label) return null;
  // Prefere o padrão "Mesa N" (ignora texto/parênteses à volta) e tira zeros à
  // esquerda; só depois cai para o 1.º número que aparecer. Evita apanhar um
  // número errado quando o rótulo tem texto extra (ex.: "Sala 2 · Mesa 5").
  const m = String(label).match(/mesa\s*0*(\d+)/i) || String(label).match(/0*(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

// #5 — nº da mesa CANÓNICO (043): a coluna comandas.table_number é a fonte de
// verdade; o table_label é só apresentação. Só cai para o regex em linhas
// legadas sem a coluna, ou em tabelas que não a têm (staff_calls, orders_log).
function tableNumberOf(row) {
  if (row && Number.isInteger(row.table_number)) return row.table_number;
  return extractTableNumber(row && row.table_label);
}

// Conta os itens (não cancelados) de uma comanda — para o resumo da mesa.
async function fetchItemCount(comandaId) {
  try {
    const { count } = await db.from('comanda_items')
      .select('id', { count: 'exact', head: true })
      .eq('comanda_id', comandaId).neq('status', 'cancelled');
    return count || 0;
  } catch (_) { return 0; }
}

function updateStats() {
  const activeTables = Object.values(state.tables).filter(t => t.status !== 'empty').length;
  document.getElementById('stat-open').textContent = activeTables;
  document.getElementById('stat-orders').textContent = state.todayStats.orders;
  document.getElementById('stat-calls').textContent = state.todayStats.calls;
  // "faturado hoje" foi removido do Modo Restaurante (é ecrã de staff, não CEO).
  // Filtro só re-aplica quando há filtro activo (evita varrer todas as mesas a
  // cada evento — essencial em salas grandes com muito tráfego).
  if (state.activeFilter !== 'all') applyCurrentFilter();
}

function applyCurrentFilter() {
  document.querySelectorAll('.table-card').forEach(card => {
    const status = card.dataset.status;
    let visible = true;
    if (state.activeFilter === 'active') visible = status !== 'empty';
    else if (state.activeFilter === 'calling') visible = card.dataset.calling === 'true';
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

const STALE_MS = 3 * 60 * 60 * 1000; // 3h — mesa "esquecida" fecha sozinha

async function loadActiveComandas() {
  const { data } = await selectResilient((fallback) => {
    let q = db.from('comandas')
      .select('*, comanda_items(id, status)')
      .eq('espaco_slug', window.ESPACO_SLUG).in('status', ['open', 'submitted', 'preparing', 'ready']);
    if (!fallback) q = q.is('archived_at', null); // comandas arquivadas (presas > 18h) saem da Sala
    return q;
  });
  const statusMap = { open: 'active', submitted: 'order_new', preparing: 'active', ready: 'ready' };
  const now = Date.now();
  const activeNums = new Set();
  (data || []).forEach(c => {
    const num = tableNumberOf(c); // #5: coluna table_number (select '*' já a traz)
    if (!num || !state.tables[num]) return;
    // Rotação de mesas: uma comanda activa há mais de 3h fecha-se sozinha.
    if (c.created_at && (now - new Date(c.created_at).getTime() > STALE_MS)) {
      autoCloseComanda(c);
      return;
    }
    activeNums.add(num);
    const itemCount = (c.comanda_items || []).filter(i => i.status !== 'cancelled').length;
    updateTableStatus(num, statusMap[c.status] || 'active', { comanda: {
      id: c.id, total: c.total, itemCount, guestCount: c.guest_count, code: c.session_code, mode: c.mode } });
  });
  // Idempotência (importante p/ poll/reconexão): mesas que JÁ NÃO têm comanda
  // activa (pagas/fechadas enquanto offline) voltam a "livre". Preserva-se o
  // estado "a chamar" (chamada sem comanda é válida).
  const COMANDA_STATES = ['active', 'order_new', 'ready', 'preparing'];
  Object.keys(state.tables).forEach((numStr) => {
    const num = +numStr;
    const st = state.tables[num];
    if (!st || activeNums.has(num)) return;
    if (COMANDA_STATES.includes(st.status) && !(st.calls && st.calls.length)) {
      updateTableStatus(num, 'empty', { comanda: null });
    }
  });
}

// Fecha automaticamente uma comanda demasiado antiga (mesa esquecida).
// Recebe a linha da comanda (com table_number, 043) para libertar a mesa CERTA.
async function autoCloseComanda(comanda) {
  try {
    await db.from('comandas').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', comanda.id);
    handleComandaUpdate({ id: comanda.id, table_label: comanda.table_label,
      table_number: comanda.table_number, status: 'closed' });
  } catch (_) {}
}

// Verifica periodicamente mesas esquecidas (>3h) e fecha-as.
function startStaleSweep() {
  setInterval(async () => {
    const since = new Date(Date.now() - STALE_MS).toISOString();
    const { data } = await db.from('comandas').select('id, table_label, table_number')
      .eq('espaco_slug', window.ESPACO_SLUG)
      .in('status', ['open', 'submitted', 'preparing', 'ready'])
      .is('archived_at', null)
      .lt('created_at', since);
    (data || []).forEach(c => autoCloseComanda(c));
  }, 5 * 60 * 1000);
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

// ═══════════════════════════════════════════════════════════════
// CSP: liga os [data-action] (substituem os onclick inline removidos do
// HTML para o script-src largar 'unsafe-inline'). Listener DIRETO em cada
// elemento — preserva e.currentTarget, por isso o guarda de "clicar no
// fundo" (closeNewOrder/closeTableDetail com data-pass-event) mantém-se.
// A chamada replica exatamente a original: fn(arg) | fn(event) | fn().
// ═══════════════════════════════════════════════════════════════
(function wireSalaActions() {
  const wire = () => document.querySelectorAll('[data-action]').forEach((el) => {
    if (el._nexoWired) return;
    el._nexoWired = true;
    el.addEventListener('click', (e) => {
      const fn = window[el.dataset.action];
      if (typeof fn !== 'function') return;
      if (el.dataset.arg !== undefined) fn(el.dataset.arg);
      else if (el.hasAttribute('data-pass-event')) fn(e);
      else fn();
    });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
