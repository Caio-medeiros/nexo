/* ═══════════════════════════════════════════════════════════════
   NEXO — DASHBOARD FINANCEIRO (No Manches)
   ───────────────────────────────────────────────────────────────
   Página standalone: auth local por senha (SHA-256, sessão 4h em
   sessionStorage) — sem conta Supabase. Apenas SELECTs como anon.

   Fonte: comanda_items (JOIN comandas p/ mesa). O prompt original
   referia uma tabela "orders"; neste schema um "pedido" = uma ronda
   (round_id) de comanda_items. Faturável = status em
   sent/preparing/ready/served (+ 'delivered', legado = servido),
   comanda não arquivada. pending/awaiting_staff/cancelled ficam fora.

   Regra do produto: valores € do No Manches SÓ nesta página.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── Constantes ───────────────────────────────────────────────
  const SLUG = 'rest-no-manches-lisboa';
  // SHA-256 de "nomanchesnexo123" (calculado em build time — nunca plaintext)
  const SENHA_HASH = '7485be8c8e455605bbc078a9f2f4b1914a4c2565910e16e4c114af8a01655790';
  const SESSION_MS = 4 * 60 * 60 * 1000; // 4h
  const BILLABLE = ['sent', 'preparing', 'ready', 'served', 'delivered'];
  const SUPABASE_URL = 'https://kgbrtbpeekhkroibsgqq.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYnJ0YnBlZWtoa3JvaWJzZ3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDAwMTMsImV4cCI6MjA5NjYxNjAxM30.vFvSLysnS3456WWKa2a659YuIVuOceYHG4NMd79Jerc';
  const COLOR_PRIMARY = '#C8952A';
  const COLOR_ACCENT = '#D64C2B';

  let db = null;
  let channel = null;
  let chart = null;
  let wasConnected = false;
  let isLive = false;
  let liveWatchdog = null;
  let currentView = 'faturamento'; // faturamento | estatisticas
  let statsRange = 7;              // dias (0 = tudo)
  let chartHours = null;

  const state = {
    period: 'hoje',            // hoje | semana | mes | custom
    customStart: null,
    customEnd: null,
    rows: [],                  // comanda_items faturáveis do período
    orders: [],                // agrupados por ronda
    avgDaily7: null,           // média diária dos últimos 7 dias (€)
    knownItems: new Map(),     // id → mesa (p/ detectar cancelamentos)
    sort: { col: 'hora', dir: -1 },
    page: 1,
    expandedPrato: null,
    retries: 0,
  };

  // ══════════════════════════════════════════════════════════════
  // GATE DE SENHA
  // ══════════════════════════════════════════════════════════════
  const gate = document.getElementById('fin-gate');
  const app = document.getElementById('fin-app');
  const gateForm = document.getElementById('gate-form');
  const gateInput = document.getElementById('gate-pw');
  const gateError = document.getElementById('gate-error');
  const gateBtn = document.getElementById('gate-btn');
  const gateLock = document.getElementById('gate-lock');

  async function sha256Hex(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function sessionValid() {
    try {
      return sessionStorage.getItem('nm_fin_auth') === 'true' &&
             Date.now() < Number(sessionStorage.getItem('nm_fin_exp') || 0);
    } catch (_) { return false; }
  }
  function clearSession() {
    try {
      sessionStorage.removeItem('nm_fin_auth');
      sessionStorage.removeItem('nm_fin_exp');
    } catch (_) {}
  }

  // Rate-limit local: 5 falhas seguidas → 60s de bloqueio (sobrevive a reload)
  function fails() { try { return Number(sessionStorage.getItem('nm_fin_fails') || 0); } catch (_) { return 0; } }
  function setFails(n) { try { sessionStorage.setItem('nm_fin_fails', String(n)); } catch (_) {} }
  function lockUntil() { try { return Number(sessionStorage.getItem('nm_fin_lock') || 0); } catch (_) { return 0; } }
  function setLock(ts) { try { sessionStorage.setItem('nm_fin_lock', String(ts)); } catch (_) {} }

  let lockTimer = null;
  function startLockCountdown() {
    clearInterval(lockTimer);
    gateInput.disabled = true; gateBtn.disabled = true;
    lockTimer = setInterval(() => {
      const left = Math.ceil((lockUntil() - Date.now()) / 1000);
      if (left <= 0) {
        clearInterval(lockTimer);
        gateInput.disabled = false; gateBtn.disabled = false;
        gateError.hidden = true;
        setFails(0);
        return;
      }
      gateError.hidden = false;
      gateError.textContent = `Tente novamente em ${left}s`;
    }, 250);
  }

  gateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (Date.now() < lockUntil()) return;
    const hash = await sha256Hex(gateInput.value);
    if (hash === SENHA_HASH) {
      setFails(0);
      try {
        sessionStorage.setItem('nm_fin_auth', 'true');
        sessionStorage.setItem('nm_fin_exp', String(Date.now() + SESSION_MS));
      } catch (_) {}
      unlockAnimation();
    } else {
      const n = fails() + 1;
      setFails(n);
      gateInput.value = '';
      gateInput.classList.remove('shake');
      void gateInput.offsetWidth; // reinicia a animação
      gateInput.classList.add('shake');
      gateError.hidden = false;
      gateError.textContent = 'Senha incorrecta';
      if (n >= 5) {
        setLock(Date.now() + 60 * 1000);
        startLockCountdown();
      }
    }
  });

  function unlockAnimation() {
    gateLock.textContent = '🔓';
    gateLock.classList.add('unlocked');
    setTimeout(() => {
      gate.classList.add('fade-out');
      setTimeout(() => {
        gate.remove();
        app.hidden = false;
        app.classList.add('fade-in');
        initDashboard();
      }, 500);
    }, 350);
  }

  function showGate() {
    if (Date.now() < lockUntil()) startLockCountdown();
    gateInput.focus();
  }

  // Arranque: sessão válida → directo ao dashboard
  if (sessionValid()) {
    gate.remove();
    app.hidden = false;
    initDashboard();
  } else {
    clearSession();
    showGate();
  }

  // ══════════════════════════════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════════════════════════════
  function initDashboard() {
    db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    document.getElementById('nm-logout').addEventListener('click', () => {
      if (channel) { try { channel.unsubscribe(); } catch (_) {} channel = null; }
      clearSession();
      location.reload();
    });
    window.addEventListener('beforeunload', () => {
      if (channel) { try { channel.unsubscribe(); } catch (_) {} }
    });

    // Sessão expira a meio da utilização → volta ao gate
    setInterval(() => { if (!sessionValid()) { clearSession(); location.reload(); } }, 60 * 1000);

    document.querySelectorAll('#fin-periods button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#fin-periods button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.period = btn.dataset.period;
        const custom = document.getElementById('fin-custom-range');
        custom.hidden = state.period !== 'custom';
        if (state.period !== 'custom') { state.page = 1; loadData(); }
      });
    });
    document.getElementById('fin-date-apply').addEventListener('click', () => {
      const s = document.getElementById('fin-date-start').value;
      const e = document.getElementById('fin-date-end').value;
      if (!s || !e) return;
      state.customStart = s; state.customEnd = e;
      state.page = 1;
      loadData();
    });
    document.getElementById('fin-refresh').addEventListener('click', () => {
      loadData();
      if (!isLive) subscribe(); // reconexão manual do realtime
      if (currentView === 'estatisticas') loadStats();
    });

    // ── Troca de vista: Faturamento ⇄ Estatísticas ────────────────
    document.querySelectorAll('#fin-views button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#fin-views button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentView = btn.dataset.view;
        const stats = currentView === 'estatisticas';
        document.getElementById('fin-stats').hidden = !stats;
        document.querySelector('.fin-main:not(#fin-stats)').hidden = stats;
        document.getElementById('fin-periods').hidden = stats;
        document.getElementById('fin-custom-range').hidden = stats || state.period !== 'custom';
        if (stats) loadStats();
      });
    });
    document.getElementById('stats-ranges').addEventListener('click', (e) => {
      const b = e.target.closest('[data-range]');
      if (!b) return;
      statsRange = parseInt(b.dataset.range, 10);
      document.querySelectorAll('#stats-ranges button').forEach(x => x.classList.toggle('active', x === b));
      loadStats();
    });
    document.getElementById('pg-prev').addEventListener('click', () => { state.page--; renderOrders(); });
    document.getElementById('pg-next').addEventListener('click', () => { state.page++; renderOrders(); });

    renderSkeletons();
    loadData();
    subscribe();
  }

  // ── Período → [start, end) em Date locais ────────────────────
  function periodRange() {
    const now = new Date();
    const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
    if (state.period === 'hoje') {
      const s = startOfDay(now);
      return [s, new Date(s.getTime() + 86400000)];
    }
    if (state.period === 'semana') {
      const s = startOfDay(now);
      const dow = (s.getDay() + 6) % 7; // 0 = segunda
      s.setDate(s.getDate() - dow);
      return [s, new Date(s.getTime() + 7 * 86400000)];
    }
    if (state.period === 'mes') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return [s, new Date(now.getFullYear(), now.getMonth() + 1, 1)];
    }
    // custom
    const s = startOfDay(new Date(state.customStart + 'T00:00:00'));
    const e = startOfDay(new Date(state.customEnd + 'T00:00:00'));
    return [s, new Date(e.getTime() + 86400000)]; // fim inclusivo
  }

  // ── Query principal ───────────────────────────────────────────
  async function loadData() {
    const spinner = document.getElementById('fin-spinner');
    spinner.hidden = false;
    const [start, end] = periodRange();
    try {
      const query = db.from('comanda_items')
        .select('id, comanda_id, round_id, round_number, item_id, item_name, item_price, quantity, notes, status, created_at, updated_at, comandas!inner(table_label, archived_at)')
        .eq('espaco_slug', SLUG)
        .in('status', BILLABLE)
        .is('comandas.archived_at', null)
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString())
        .order('created_at', { ascending: false })
        .limit(5000);

      // Média diária dos últimos 7 dias completos (cor do KPI 1)
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const sevenAgo = new Date(todayStart.getTime() - 7 * 86400000);
      const avgQuery = db.from('comanda_items')
        .select('item_price, quantity, comandas!inner(archived_at)')
        .eq('espaco_slug', SLUG)
        .in('status', BILLABLE)
        .is('comandas.archived_at', null)
        .gte('created_at', sevenAgo.toISOString())
        .lt('created_at', todayStart.toISOString())
        .limit(10000);

      const [res, avgRes] = await Promise.all([query, avgQuery]);
      if (res.error) throw res.error;

      state.rows = res.data || [];
      state.knownItems = new Map(state.rows.map(r =>
        [r.id, (r.comandas && r.comandas.table_label) || 'Mesa']));
      state.avgDaily7 = avgRes.error ? null
        : (avgRes.data || []).reduce((s, r) => s + (Number(r.item_price) || 0) * (r.quantity || 1), 0) / 7;
      state.retries = 0;

      groupOrders();
      renderAll();
    } catch (err) {
      console.warn('[financeiro] load', err);
      if (state.retries < 3) {
        state.retries++;
        showToast('Erro ao carregar dados. A tentar novamente…', 'error');
        setTimeout(loadData, 5000);
      } else {
        showToast('Não foi possível carregar os dados.', 'error');
        document.getElementById('fin-refresh').hidden = false;
      }
    } finally {
      spinner.hidden = true;
    }
  }

  // Um "pedido" = uma ronda de itens (round_id); itens sem ronda
  // (não deveria acontecer em estado faturável) agrupam por comanda.
  function groupOrders() {
    const map = new Map();
    for (const r of state.rows) {
      const key = r.round_id || `c:${r.comanda_id}:r${r.round_number || 0}`;
      let o = map.get(key);
      if (!o) {
        o = {
          key,
          mesa: (r.comandas && r.comandas.table_label) || 'Mesa',
          items: [], total: 0,
          first: r.created_at,
        };
        map.set(key, o);
      }
      o.items.push(r);
      o.total += (Number(r.item_price) || 0) * (r.quantity || 1);
      if (r.created_at < o.first) o.first = r.created_at;
    }
    for (const o of map.values()) o.status = aggregateStatus(o.items);
    state.orders = [...map.values()];
  }

  function aggregateStatus(items) {
    const st = items.map(i => i.status === 'delivered' ? 'served' : i.status);
    if (st.every(s => s === 'served')) return 'served';
    if (st.every(s => s === 'ready' || s === 'served')) return 'ready';
    if (st.some(s => s === 'preparing')) return 'preparing';
    return 'sent';
  }

  // ── Realtime ──────────────────────────────────────────────────
  let refetchTimer = null;
  function debouncedRefetch() {
    clearTimeout(refetchTimer);
    refetchTimer = setTimeout(loadData, 500);
  }

  function markOffline() {
    const live = document.getElementById('fin-live');
    live.classList.remove('on'); live.classList.add('off');
    document.getElementById('fin-live-txt').textContent = '○ Offline';
    document.getElementById('fin-refresh').hidden = false;
  }

  function subscribe() {
    isLive = false;
    if (channel) { try { db.removeChannel(channel); } catch (_) {} channel = null; }
    // Watchdog: se o handshake do realtime nunca completar (rede móvel,
    // websocket bloqueado…), não ficar preso em "A ligar" — marca offline
    // e mostra o botão ↻. Os dados continuam a carregar por query normal.
    clearTimeout(liveWatchdog);
    liveWatchdog = setTimeout(() => { if (!isLive) markOffline(); }, 12000);
    channel = db.channel('nm-financeiro')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'comanda_items',
        filter: `espaco_slug=eq.${SLUG}`,
      }, (payload) => {
        const row = payload.new || {};
        // Pedido que estava faturável passou a cancelado → toast + sai dos números
        if (payload.eventType === 'UPDATE' && row.status === 'cancelled' &&
            state.knownItems.has(row.id)) {
          const mesa = state.knownItems.get(row.id);
          showToast(`Pedido ${mesa} cancelado — removido do faturamento.`, 'warning');
        }
        // Qualquer mudança relevante → refetch completo (fonte de verdade única)
        if (payload.eventType === 'INSERT' && !BILLABLE.includes(row.status)) return;
        debouncedRefetch();
      })
      .subscribe((status) => {
        const live = document.getElementById('fin-live');
        const txt = document.getElementById('fin-live-txt');
        if (status === 'SUBSCRIBED') {
          isLive = true;
          clearTimeout(liveWatchdog);
          live.classList.add('on'); live.classList.remove('off');
          txt.textContent = 'Ao vivo';
          document.getElementById('fin-refresh').hidden = true;
          // Reconexão: refaz a query para apanhar eventos perdidos
          if (wasConnected) debouncedRefetch();
          wasConnected = true;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          isLive = false;
          live.classList.remove('on'); live.classList.add('off');
          txt.textContent = 'A reconectar…';
          document.getElementById('fin-refresh').hidden = false;
        }
      });
  }

  // Auto-retry: enquanto não estiver "Ao vivo", tenta re-subscrever a cada 45s.
  setInterval(() => { if (db && !isLive) subscribe(); }, 45000);

  // ══════════════════════════════════════════════════════════════
  // VISTA ESTATÍSTICAS — métricas do menu (ex-/portal/estatisticas/,
  // agora exclusivas do dono nesta área)
  // ══════════════════════════════════════════════════════════════
  const LANG_PT = { pt: 'Português', en: 'Inglês', es: 'Espanhol', fr: 'Francês', de: 'Alemão', it: 'Italiano' };

  async function loadStats() {
    const kpis = document.getElementById('stats-kpis');
    kpis.innerHTML = Array(4).fill('<div class="kpi-card"><div class="sk sk-num"></div><div class="sk sk-label"></div></div>').join('');
    document.getElementById('stats-top-items').innerHTML = Array(4).fill('<div class="sk sk-row"></div>').join('');
    document.getElementById('stats-langs').innerHTML = '<div class="sk sk-row"></div>';

    // RLS: como anon, menu_events/orders_log/staff_calls não são legíveis
    // linha-a-linha — a RPC nm_financeiro_stats (036, SECURITY DEFINER)
    // devolve apenas agregados e apenas deste venue.
    const { data, error } = await db.rpc('nm_financeiro_stats', { p_days: statsRange });
    if (error || !data) {
      console.warn('[financeiro] stats', error);
      const missing = error && /nm_financeiro_stats|function|404/i.test(error.message || '');
      kpis.innerHTML = `<div class="fin-empty" style="grid-column:1/-1">📊<p>${missing
        ? 'Estatísticas indisponíveis — falta correr a migração 036 no Supabase.'
        : 'Erro ao carregar estatísticas. Tenta actualizar.'}</p></div>`;
      document.getElementById('stats-top-items').innerHTML = '';
      document.getElementById('stats-langs').innerHTML = '';
      return;
    }

    const views = Number(data.views) || 0;
    const sessions = Number(data.sessions) || 0;
    const itemsViewed = Number(data.items_viewed) || 0;
    const googleClicks = Number(data.google_clicks) || 0;
    const nCalls = Number(data.staff_calls) || 0;
    const nOrders = Number(data.orders_count) || 0;
    const revenue = Number(data.revenue) || 0;

    kpis.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-value" id="st-views"></div>
        <div class="kpi-label">Visitas ao menu</div>
        <div class="kpi-sub">${sessions} ${sessions === 1 ? 'cliente único' : 'clientes únicos'}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value" id="st-items"></div>
        <div class="kpi-label">Itens vistos</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value" id="st-google"></div>
        <div class="kpi-label">Cliques Google</div>
        <div class="kpi-sub">${nCalls} ${nCalls === 1 ? 'chamada de staff' : 'chamadas de staff'}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value" id="st-orders"></div>
        <div class="kpi-label">Pedidos registados</div>
        <div class="kpi-sub">${nOrders ? fmtEUR(revenue) + ' no período' : ''}</div>
      </div>`;
    countUp(document.getElementById('st-views'), views, v => String(Math.round(v)));
    countUp(document.getElementById('st-items'), itemsViewed, v => String(Math.round(v)));
    countUp(document.getElementById('st-google'), googleClicks, v => String(Math.round(v)));
    countUp(document.getElementById('st-orders'), nOrders, v => String(Math.round(v)));

    // Actividade por hora (histograma já vem agregado da RPC, hora de Lisboa)
    const hours = Array.isArray(data.hours) && data.hours.length === 24
      ? data.hours.map(n => Number(n) || 0) : Array(24).fill(0);
    if (chartHours) { chartHours.destroy(); chartHours = null; }
    chartHours = new Chart(document.getElementById('stats-chart-hours').getContext('2d'), {
      type: 'bar',
      data: {
        labels: Array.from({ length: 24 }, (_, h) => `${h}h`),
        datasets: [{ data: hours, backgroundColor: 'rgba(200,149,42,0.7)', borderColor: COLOR_PRIMARY, borderWidth: 1, borderRadius: 4 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#E8E0D0' }, ticks: { maxRotation: 0, autoSkip: true } },
          y: { grid: { color: '#E8E0D0' }, beginAtZero: true, ticks: { precision: 0 } },
        },
      },
    });

    // Top 5 itens mais vistos
    const top = (Array.isArray(data.top_items) ? data.top_items : [])
      .map(x => [x.name, Number(x.n) || 0]);
    const maxV = top[0] ? top[0][1] : 1;
    document.getElementById('stats-top-items').innerHTML = top.length ? top.map(([name, n], i) => `
      <div class="prato" style="--delay:${Math.min(i * 40, 280)}ms; cursor:default">
        <div class="prato-head">
          <span class="prato-rank">#${i + 1}</span>
          <span class="prato-name">${esc(name)}</span>
          <span class="prato-meta">${n} ${n === 1 ? 'visualização' : 'visualizações'}</span>
        </div>
        <div class="prato-bar"><div class="prato-fill" style="width:${Math.round(n / maxV * 100)}%"></div></div>
      </div>`).join('')
      : '<div class="fin-empty">👀<p>Sem visualizações neste período.</p></div>';

    // Idiomas
    const langs = (Array.isArray(data.langs) ? data.langs : [])
      .map(x => [x.lang, Number(x.n) || 0]);
    const totalLang = langs.reduce((s, [, n]) => s + n, 0) || 1;
    document.getElementById('stats-langs').innerHTML = langs.length ? langs.map(([l, n]) => `
      <div class="prato" style="cursor:default">
        <div class="prato-head">
          <span class="prato-name">${esc(LANG_PT[l] || l)}</span>
          <span class="prato-meta">${Math.round(n / totalLang * 100)}%</span>
        </div>
        <div class="prato-bar"><div class="prato-fill" style="width:${Math.round(n / totalLang * 100)}%"></div></div>
      </div>`).join('')
      : '<div class="fin-empty">🌐<p>Sem dados de idioma neste período.</p></div>';
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  function renderAll() {
    renderKPIs();
    renderChart();
    renderTopPratos();
    renderOrders();
  }

  function renderSkeletons() {
    document.getElementById('kpi-grid').innerHTML =
      Array(4).fill('<div class="kpi-card"><div class="sk sk-num"></div><div class="sk sk-label"></div></div>').join('');
    document.getElementById('top-pratos').innerHTML =
      Array(4).fill('<div class="sk sk-row"></div>').join('');
    document.getElementById('orders-list').innerHTML =
      Array(5).fill('<div class="sk sk-row"></div>').join('');
    document.getElementById('chart-wrap').classList.add('loading');
  }

  // ── KPIs ──────────────────────────────────────────────────────
  function renderKPIs() {
    const grid = document.getElementById('kpi-grid');
    const empty = state.orders.length === 0;

    const total = state.orders.reduce((s, o) => s + o.total, 0);
    const nOrders = state.orders.length;
    const ticket = nOrders ? total / nOrders : 0;
    const nItems = state.rows.reduce((s, r) => s + (r.quantity || 1), 0);
    const distinct = new Set(state.rows.map(r => r.item_id || r.item_name)).size;

    const byMesa = new Map();
    for (const o of state.orders) {
      const m = byMesa.get(o.mesa) || { n: 0, total: 0 };
      m.n++; m.total += o.total;
      byMesa.set(o.mesa, m);
    }
    let topMesa = null;
    for (const [mesa, m] of byMesa) {
      if (!topMesa || m.n > topMesa.n) topMesa = { mesa, ...m };
    }

    // Cor do faturamento vs média diária dos últimos 7 dias
    const [start, end] = periodRange();
    const nDays = Math.max(1, Math.round((Math.min(end.getTime(), Date.now() + 1) - start.getTime()) / 86400000));
    const perDay = total / nDays;
    let trendCls = 'neutral';
    if (!empty && state.avgDaily7 != null && state.avgDaily7 > 0) {
      if (perDay > state.avgDaily7 * 1.01) trendCls = 'up';
      else if (perDay < state.avgDaily7 * 0.99) trendCls = 'down';
    }

    grid.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-value ${trendCls}" id="kpi-total">${empty ? '—' : ''}</div>
        <div class="kpi-label">Faturamento</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value" id="kpi-orders">${empty ? '—' : ''}</div>
        <div class="kpi-label">Pedidos</div>
        <div class="kpi-sub">${empty ? '' : `ticket médio ${fmtEUR(ticket)}`}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value" id="kpi-items">${empty ? '—' : ''}</div>
        <div class="kpi-label">Itens vendidos</div>
        <div class="kpi-sub">${empty ? '' : `${distinct} ${distinct === 1 ? 'prato diferente' : 'pratos diferentes'}`}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value" id="kpi-mesa">${empty || !topMesa ? '—' : ''}</div>
        <div class="kpi-label">Mesa mais activa</div>
        <div class="kpi-sub">${empty || !topMesa ? '' : `${topMesa.n} ${topMesa.n === 1 ? 'pedido' : 'pedidos'} · ${fmtEUR(topMesa.total)}`}</div>
      </div>`;

    if (!empty) {
      countUp(document.getElementById('kpi-total'), total, v => fmtEUR(v));
      countUp(document.getElementById('kpi-orders'), nOrders, v => String(Math.round(v)));
      countUp(document.getElementById('kpi-items'), nItems, v => String(Math.round(v)));
      if (topMesa) document.getElementById('kpi-mesa').textContent = topMesa.mesa;
    }
  }

  function countUp(el, target, fmt) {
    const dur = 800; const t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    function frame(t) {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = fmt(target * ease(p));
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = fmt(target);
    }
    requestAnimationFrame(frame);
  }

  // ── Gráfico ───────────────────────────────────────────────────
  function renderChart() {
    const wrap = document.getElementById('chart-wrap');
    wrap.classList.remove('loading');
    const [start, end] = periodRange();
    let labels = [], revenue = [], counts = [], type = 'bar', title = 'Faturamento';

    if (state.period === 'hoje') {
      title = 'Faturamento por hora';
      labels = Array.from({ length: 24 }, (_, h) => `${h}h`);
      revenue = Array(24).fill(0); counts = Array(24).fill(0);
      bucketOrders(o => new Date(o.first).getHours(), revenue, counts);
    } else if (state.period === 'semana') {
      title = 'Faturamento por dia (Seg–Dom)';
      labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
      revenue = Array(7).fill(0); counts = Array(7).fill(0);
      bucketOrders(o => (new Date(o.first).getDay() + 6) % 7, revenue, counts);
    } else if (state.period === 'mes') {
      title = 'Faturamento por dia do mês';
      type = 'line';
      const days = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      labels = Array.from({ length: days }, (_, i) => String(i + 1));
      revenue = Array(days).fill(0); counts = Array(days).fill(0);
      bucketOrders(o => new Date(o.first).getDate() - 1, revenue, counts);
    } else {
      title = 'Faturamento por dia';
      const days = Math.max(1, Math.round((end - start) / 86400000));
      labels = Array.from({ length: days }, (_, i) => {
        const d = new Date(start.getTime() + i * 86400000);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      });
      revenue = Array(days).fill(0); counts = Array(days).fill(0);
      bucketOrders(o => Math.floor((new Date(o.first) - start) / 86400000), revenue, counts);
    }
    document.getElementById('chart-title').textContent = title;

    if (chart) { chart.destroy(); chart = null; }
    const ctx = document.getElementById('fin-chart').getContext('2d');
    chart = new Chart(ctx, {
      type,
      data: {
        labels,
        datasets: [{
          data: revenue,
          backgroundColor: 'rgba(200,149,42,0.7)',
          borderColor: COLOR_PRIMARY,
          borderWidth: type === 'line' ? 2 : 1,
          borderRadius: 4,
          fill: type === 'line' ? { target: 'origin', above: 'rgba(200,149,42,0.12)' } : undefined,
          tension: 0.3,
          pointBackgroundColor: COLOR_PRIMARY,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600, easing: 'easeOutCubic' },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => `${fmtEUR(c.parsed.y)} · ${counts[c.dataIndex]} ${counts[c.dataIndex] === 1 ? 'pedido' : 'pedidos'}`,
            },
          },
        },
        scales: {
          x: { grid: { color: '#E8E0D0' }, ticks: { maxRotation: 0, autoSkip: true } },
          y: { grid: { color: '#E8E0D0' }, beginAtZero: true,
               ticks: { callback: v => fmtEUR(v) } },
        },
      },
    });
  }

  function bucketOrders(fnIdx, revenue, counts) {
    for (const o of state.orders) {
      const i = fnIdx(o);
      if (i >= 0 && i < revenue.length) { revenue[i] += o.total; counts[i]++; }
    }
  }

  // ── Top pratos ────────────────────────────────────────────────
  function renderTopPratos() {
    const cont = document.getElementById('top-pratos');
    if (!state.rows.length) {
      cont.innerHTML = `<div class="fin-empty">🌮<p>Sem pedidos neste período.</p></div>`;
      return;
    }
    const byItem = new Map();
    for (const r of state.rows) {
      const key = r.item_id || r.item_name;
      let it = byItem.get(key);
      if (!it) { it = { name: r.item_name, qty: 0, revenue: 0, orders: new Set(), rows: [] }; byItem.set(key, it); }
      it.qty += r.quantity || 1;
      it.revenue += (Number(r.item_price) || 0) * (r.quantity || 1);
      it.orders.add(r.round_id || r.comanda_id);
      it.rows.push(r);
    }
    const top = [...byItem.entries()]
      .map(([key, it]) => ({ key, ...it }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
    const max = top[0] ? top[0].qty : 1;
    const totalRevenue = state.orders.reduce((s, o) => s + o.total, 0);

    cont.innerHTML = top.map((it, i) => `
      <div class="prato ${state.expandedPrato === it.key ? 'open' : ''}" data-key="${escAttr(it.key)}" style="--delay:${Math.min(i * 40, 280)}ms">
        <div class="prato-head">
          <span class="prato-rank">#${i + 1}</span>
          <span class="prato-name">${esc(it.name)}</span>
          <span class="prato-meta">${it.qty} un · ${fmtEUR(it.revenue)}</span>
        </div>
        <div class="prato-bar"><div class="prato-fill" style="width:${Math.round(it.qty / max * 100)}%"></div></div>
        <div class="prato-detail">${state.expandedPrato === it.key ? pratoDetail(it, totalRevenue) : ''}</div>
      </div>`).join('');

    cont.querySelectorAll('.prato').forEach(el => {
      el.addEventListener('click', () => {
        state.expandedPrato = state.expandedPrato === el.dataset.key ? null : el.dataset.key;
        renderTopPratos();
      });
    });
  }

  function pratoDetail(it, totalRevenue) {
    // Slot (hora ou dia) em que mais foi pedido
    const bySlot = new Map();
    const byDay = state.period !== 'hoje';
    for (const r of it.rows) {
      const d = new Date(r.created_at);
      const slot = byDay ? fmtDayShort(d) : `${d.getHours()}h`;
      bySlot.set(slot, (bySlot.get(slot) || 0) + (r.quantity || 1));
    }
    const topSlot = [...bySlot.entries()].sort((a, b) => b[1] - a[1])[0];

    const byMesa = new Map();
    for (const r of it.rows) {
      const mesa = (r.comandas && r.comandas.table_label) || 'Mesa';
      byMesa.set(mesa, (byMesa.get(mesa) || 0) + (r.quantity || 1));
    }
    const topMesas = [...byMesa.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    const pct = totalRevenue > 0 ? (it.revenue / totalRevenue * 100) : 0;

    return `
      <div class="prato-detail-grid">
        <div><strong>Pico:</strong> ${topSlot ? `${esc(topSlot[0])} (${topSlot[1]} un)` : '—'}</div>
        <div><strong>Mesas:</strong> ${topMesas.map(([m, q]) => `${esc(m)} ×${q}`).join(' · ') || '—'}</div>
        <div><strong>Peso no faturamento:</strong> ${pct.toFixed(1).replace('.', ',')}%</div>
      </div>`;
  }

  // ── Lista de pedidos ──────────────────────────────────────────
  const STATUS_BADGE = {
    sent:      ['badge-gray',   'Enviado'],
    preparing: ['badge-yellow', 'A preparar'],
    ready:     ['badge-blue',   'Pronto'],
    served:    ['badge-green',  'Servido'],
  };
  const PAGE_SIZE = 20;

  function sortedOrders() {
    const { col, dir } = state.sort;
    const cmp = {
      hora:   (a, b) => a.first.localeCompare(b.first),
      mesa:   (a, b) => a.mesa.localeCompare(b.mesa, 'pt', { numeric: true }),
      total:  (a, b) => a.total - b.total,
      status: (a, b) => a.status.localeCompare(b.status),
    }[col] || ((a, b) => a.first.localeCompare(b.first));
    return [...state.orders].sort((a, b) => dir * cmp(a, b));
  }

  function renderOrders() {
    const cont = document.getElementById('orders-list');
    const pag = document.getElementById('fin-pagination');
    if (!state.orders.length) {
      cont.innerHTML = `<div class="fin-empty">🧾<p>Sem pedidos neste período.</p></div>`;
      pag.hidden = true;
      return;
    }
    const all = sortedOrders();
    const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    state.page = Math.min(Math.max(1, state.page), pages);
    const slice = all.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

    const arrow = (c) => state.sort.col === c ? (state.sort.dir === 1 ? ' ↑' : ' ↓') : '';
    cont.innerHTML = `
      <div class="orders-head">
        <button type="button" data-col="hora">Hora${arrow('hora')}</button>
        <button type="button" data-col="mesa">Mesa${arrow('mesa')}</button>
        <span>Itens</span>
        <button type="button" data-col="total">Total${arrow('total')}</button>
        <button type="button" data-col="status" class="col-status">Status${arrow('status')}</button>
        <span></span>
      </div>
      ${slice.map(o => {
        const [cls, label] = STATUS_BADGE[o.status] || STATUS_BADGE.sent;
        const resumo = o.items.map(i => `${esc(i.item_name)}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join(', ');
        return `
        <div class="order-row" data-key="${escAttr(o.key)}">
          <span class="o-hora">${fmtHora(o.first)}</span>
          <span class="o-mesa">${esc(o.mesa)}</span>
          <span class="o-itens" title="${escAttr(resumo)}">${resumo}</span>
          <span class="o-total">${fmtEUR(o.total)}</span>
          <span class="badge ${cls} col-status">${label}</span>
          <button type="button" class="o-ver">Ver</button>
        </div>`;
      }).join('')}`;

    cont.querySelectorAll('.orders-head button').forEach(btn => {
      btn.addEventListener('click', () => {
        const col = btn.dataset.col;
        if (state.sort.col === col) state.sort.dir *= -1;
        else state.sort = { col, dir: col === 'hora' ? -1 : 1 };
        renderOrders();
      });
    });
    cont.querySelectorAll('.order-row').forEach(row => {
      const open = () => openOrderModal(row.dataset.key);
      row.querySelector('.o-ver').addEventListener('click', (e) => { e.stopPropagation(); open(); });
      row.addEventListener('click', open); // mobile: tap na linha
    });

    pag.hidden = pages <= 1;
    document.getElementById('pg-info').textContent = `${state.page} / ${pages}`;
    document.getElementById('pg-prev').disabled = state.page <= 1;
    document.getElementById('pg-next').disabled = state.page >= pages;
  }

  function openOrderModal(key) {
    const o = state.orders.find(x => x.key === key);
    if (!o) return;
    const modal = document.getElementById('fin-modal');
    const [cls, label] = STATUS_BADGE[o.status] || STATUS_BADGE.sent;
    const created = o.items.reduce((m, i) => i.created_at < m ? i.created_at : m, o.items[0].created_at);
    const updated = o.items.reduce((m, i) => (i.updated_at || '') > m ? i.updated_at : m, '');
    modal.hidden = false;
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-head">
          <strong>${esc(o.mesa)}</strong>
          <span class="badge ${cls}">${label}</span>
        </div>
        <div class="modal-body">
          ${o.items.map(i => `
            <div class="modal-line">
              <span>${i.quantity}× ${esc(i.item_name)}</span>
              <span>${fmtEUR(Number(i.item_price) || 0)} un · ${fmtEUR((Number(i.item_price) || 0) * (i.quantity || 1))}</span>
            </div>
            ${i.notes ? `<div class="modal-note">📝 ${esc(i.notes)}</div>` : ''}`).join('')}
          <div class="modal-meta">
            <div>Criado: ${fmtDate(created)}</div>
            ${updated ? `<div>Última actualização: ${fmtDate(updated)}</div>` : ''}
          </div>
          <div class="modal-total"><span>Total</span><strong>${fmtEUR(o.total)}</strong></div>
        </div>
        <button type="button" class="modal-close">Fechar</button>
      </div>`;
    const close = () => { modal.hidden = true; modal.innerHTML = ''; };
    modal.querySelector('.modal-close').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); }, { once: true });
  }

  // ── Toasts ────────────────────────────────────────────────────
  function showToast(msg, type) {
    const cont = document.getElementById('fin-toasts');
    while (cont.children.length >= 3) cont.firstChild.remove();
    const t = document.createElement('div');
    t.className = `fin-toast ${type || 'info'}`;
    t.textContent = msg;
    cont.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 4000);
  }

  // ── Formatação ────────────────────────────────────────────────
  function fmtEUR(v) {
    const n = Number(v) || 0;
    const [int, dec] = n.toFixed(2).split('.');
    return '€ ' + int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + dec;
  }
  function fmtHora(iso) {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  function fmtDayShort(d) { return `${d.getDate()} ${MESES[d.getMonth()]}`; }
  function fmtDate(iso) {
    const d = new Date(iso), now = new Date();
    const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const yest = new Date(now); yest.setDate(now.getDate() - 1);
    if (sameDay(d, now)) return `Hoje, ${fmtHora(iso)}`;
    if (sameDay(d, yest)) return `Ontem, ${fmtHora(iso)}`;
    return `${fmtDayShort(d)}, ${fmtHora(iso)}`;
  }
  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escAttr(s) { return esc(s).replace(/"/g, '&quot;'); }
})();
