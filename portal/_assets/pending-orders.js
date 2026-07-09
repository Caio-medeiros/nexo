/* ═══════════════════════════════════════════════════════════════
   NEXO PORTAL — Mesas a Confirmar (Pedido Assistido)
   ───────────────────────────────────────────────────────────────
   Activo apenas quando o config do menu do cliente tem
   VENUE_TYPE === 'assisted'. Para todos os outros clientes este
   módulo é um no-op total.

   FAB global + toasts + drawer "Mesas a confirmar" + drawer de
   detalhe onde o staff edita/confirma/cancela pedidos que o menu
   deixou em comanda_items.status='awaiting_staff' (sem ronda).
   Confirmar = criar a ronda (fired_by 'staff') → itens 'sent' →
   comanda 'submitted' → aparece no Modo Cozinha como hoje.

   Oculto na página Modo Cozinha (não inicializa lá).
   Carregado por portal.js em todas as páginas; captura o clientData
   embrulhando renderLayout — zero alterações às páginas.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Modo Cozinha: sem FAB, sem toasts — a cozinha só vê rondas confirmadas.
  if (/\/portal\/cozinha\//.test(location.pathname)) return;

  let SLUG = null;
  let pending = [];          // [{ comandaId, mesa, items:[], oldest }]
  let channel = null;
  let tickTimer = null;
  const toastedComandas = new Set(); // anti-spam: 1 toast por comanda pendente

  // ── captura do clientData via renderLayout (portal.js) ─────────
  const origRenderLayout = window.renderLayout;
  window.renderLayout = function (activeNav, clientData) {
    if (typeof origRenderLayout === 'function') origRenderLayout(activeNav, clientData);
    try { boot(clientData); } catch (e) { console.warn('[pending-orders] boot', e); }
  };
  // renderLayout já pode ter corrido antes de este módulo carregar.
  if (window._nexoClientData) {
    try { boot(window._nexoClientData); } catch (e) { console.warn('[pending-orders] boot', e); }
  }

  let booted = false;
  async function boot(clientData) {
    if (booted || !clientData) return;
    const slug = (typeof getMenuSlug === 'function') ? getMenuSlug(clientData) : null;
    if (!slug) return;
    // Gate: só venues 'assisted' (mesma fonte de verdade do menu — config.js).
    const cfg = await fetchMenuConfig(slug);
    if (!cfg || cfg.VENUE_TYPE !== 'assisted') return;
    booted = true;
    SLUG = slug;
    injectStyles();
    mountFab();
    await refetchPending();
    subscribe();
    if (window.NexoLiveSync) NexoLiveSync.register(() => refetchPending());
    if (!tickTimer) tickTimer = setInterval(renderTimers, 1000);
  }

  async function fetchMenuConfig(slug) {
    try {
      const res = await fetch(`/menu/${slug}/config.js`, { cache: 'no-store' });
      if (!res.ok) return null;
      const text = await res.text();
      return new Function(text + '\n;return (typeof CONFIG !== "undefined") ? CONFIG : null;')();
    } catch (_) { return null; }
  }

  // ── dados ───────────────────────────────────────────────────────
  async function refetchPending() {
    if (!SLUG || !window.db) return;
    const { data, error } = await db.from('comanda_items')
      .select('id, comanda_id, item_id, item_name, item_price, quantity, notes, course, created_at, comandas!inner(id, table_label, status)')
      .eq('espaco_slug', SLUG)
      .eq('status', 'awaiting_staff')
      .order('created_at', { ascending: true });
    if (error) { console.warn('[pending-orders] refetch', error); return; }

    const byComanda = {};
    (data || []).forEach(i => {
      const c = byComanda[i.comanda_id] || (byComanda[i.comanda_id] = {
        comandaId: i.comanda_id,
        mesa: (i.comandas && i.comandas.table_label) || 'Mesa',
        items: [], oldest: i.created_at,
      });
      c.items.push(i);
      if (i.created_at < c.oldest) c.oldest = i.created_at;
    });
    // mais antigo primeiro (mais urgente no topo)
    pending = Object.values(byComanda).sort((a, b) => a.oldest.localeCompare(b.oldest));

    // limpa o anti-spam de toasts para comandas já resolvidas
    const ids = new Set(pending.map(p => p.comandaId));
    [...toastedComandas].forEach(id => { if (!ids.has(id)) toastedComandas.delete(id); });

    updateFab();
    renderList();
  }

  function subscribe() {
    if (channel) { try { db.removeChannel(channel); } catch (_) {} }
    channel = db.channel('nm-staff-pending')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'comanda_items',
        filter: `espaco_slug=eq.${SLUG}`,
      }, (payload) => {
        refetchPending().then(() => {
          if (payload.eventType === 'INSERT' && payload.new &&
              payload.new.status === 'awaiting_staff' &&
              !toastedComandas.has(payload.new.comanda_id)) {
            toastedComandas.add(payload.new.comanda_id);
            const grp = pending.find(p => p.comandaId === payload.new.comanda_id);
            showPendingToast('confirmar', {
              mesa: grp ? grp.mesa : 'Mesa',
              count: grp ? grp.items.length : 1,
              comandaId: payload.new.comanda_id,
            });
          }
        });
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'staff_calls',
        filter: `espaco_slug=eq.${SLUG}`,
      }, (payload) => {
        showPendingToast('atendimento', {
          mesa: (payload.new && payload.new.table_label) || 'Mesa',
        });
      })
      .subscribe();
    if (typeof trackChannel === 'function') trackChannel(channel);
  }

  // ── FAB ─────────────────────────────────────────────────────────
  function mountFab() {
    if (document.getElementById('nm-fab')) return;
    const btn = document.createElement('button');
    btn.id = 'nm-fab';
    btn.setAttribute('aria-label', 'Mesas a confirmar');
    btn.innerHTML = '🔔<span id="nm-fab-badge">0</span>';
    btn.addEventListener('click', openListDrawer);
    document.body.appendChild(btn);
  }
  function updateFab() {
    const fab = document.getElementById('nm-fab');
    const badge = document.getElementById('nm-fab-badge');
    if (!fab || !badge) return;
    const n = pending.length;
    badge.textContent = String(n);
    badge.style.display = n > 0 ? 'flex' : 'none';
    fab.classList.toggle('has-pending', n > 0);
  }

  // ── toasts (com acção "Ver mesa") ───────────────────────────────
  function toastContainer() {
    let el = document.getElementById('nm-toast-stack');
    if (!el) {
      el = document.createElement('div');
      el.id = 'nm-toast-stack';
      document.body.appendChild(el);
    }
    return el;
  }
  function showPendingToast(type, info) {
    const cont = toastContainer();
    while (cont.children.length >= 3) cont.firstChild.remove();
    const t = document.createElement('div');
    t.className = 'nm-toast';
    const title = type === 'confirmar'
      ? `🍽️ CONFIRMAR PEDIDO: ${esc(info.mesa)}`
      : `🔔 ATENDIMENTO: ${esc(info.mesa)}`;
    const sub = type === 'confirmar'
      ? `${info.count || 1} ${(info.count || 1) === 1 ? 'item aguarda' : 'itens aguardam'}`
      : 'Cliente precisa de ajuda';
    t.innerHTML = `
      <div class="nm-toast-txt">
        <strong>${title}</strong>
        <span>${sub}</span>
      </div>
      <button type="button" class="nm-toast-btn">Ver mesa</button>`;
    t.querySelector('.nm-toast-btn').addEventListener('click', () => {
      t.remove();
      if (type === 'confirmar' && info.comandaId) openDetailDrawer(info.comandaId);
      else openListDrawer();
    });
    cont.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 8000);
    if (typeof playNotificationSound === 'function') { try { playNotificationSound(); } catch (_) {} }
  }

  // ── drawer: lista de mesas ──────────────────────────────────────
  function drawerEl() {
    let el = document.getElementById('nm-drawer');
    if (!el) {
      el = document.createElement('div');
      el.id = 'nm-drawer';
      document.body.appendChild(el);
      el.addEventListener('click', (e) => { if (e.target === el) closeDrawer(); });
    }
    return el;
  }
  function closeDrawer() {
    const el = document.getElementById('nm-drawer');
    if (el) { el.classList.remove('open'); setTimeout(() => { el.innerHTML = ''; }, 300); }
    detailComandaId = null;
  }

  function openListDrawer() {
    detailComandaId = null;
    const el = drawerEl();
    el.innerHTML = `
      <div class="nm-panel">
        <div class="nm-panel-head">
          <button type="button" class="nm-back" id="nm-close-list">← Fechar</button>
          <span class="nm-panel-title">MESAS A CONFIRMAR (<span id="nm-list-count">${pending.length}</span>)</span>
        </div>
        <div class="nm-panel-body" id="nm-list-body"></div>
      </div>`;
    el.querySelector('#nm-close-list').addEventListener('click', closeDrawer);
    requestAnimationFrame(() => el.classList.add('open'));
    renderList();
  }

  function renderList() {
    const body = document.getElementById('nm-list-body');
    const count = document.getElementById('nm-list-count');
    if (count) count.textContent = String(pending.length);
    if (!body || detailComandaId) return;
    if (!pending.length) {
      body.innerHTML = `<div class="nm-empty">✅<p>Tudo em ordem! Sem mesas pendentes.</p></div>`;
      return;
    }
    body.innerHTML = pending.map(p => `
      <div class="nm-card" data-cid="${p.comandaId}">
        <div class="nm-card-top">
          <span class="nm-card-mesa">🍽️ ${esc(p.mesa)}</span>
          <span class="nm-timer" data-since="${p.oldest}">⏱ 0:00</span>
          <button type="button" class="nm-open-btn">Abrir →</button>
        </div>
        <div class="nm-card-items">${esc(p.items.map(i => i.item_name).join(', '))}</div>
      </div>`).join('');
    body.querySelectorAll('.nm-card .nm-open-btn').forEach(btn => {
      btn.addEventListener('click', () => openDetailDrawer(btn.closest('.nm-card').dataset.cid));
    });
    renderTimers();
  }

  function renderTimers() {
    document.querySelectorAll('.nm-timer[data-since]').forEach(el => {
      const secs = Math.max(0, Math.floor((Date.now() - new Date(el.dataset.since)) / 1000));
      const m = Math.floor(secs / 60), s = secs % 60;
      const warn = secs >= 240 ? ' ⚠️' : '';
      el.textContent = `⏱ ${m}:${String(s).padStart(2, '0')}${warn}`;
      el.classList.toggle('t-green', secs < 120);
      el.classList.toggle('t-amber', secs >= 120 && secs < 240);
      el.classList.toggle('t-red', secs >= 240);
    });
  }

  // ── drawer: detalhe da mesa ─────────────────────────────────────
  let detailComandaId = null;
  let detailState = null; // { kept:[{row, removed, note}], added:[{item_id,name,price,qty,note}] }

  async function openDetailDrawer(comandaId) {
    const grp = pending.find(p => p.comandaId === comandaId);
    if (!grp) { openListDrawer(); return; }
    detailComandaId = comandaId;
    detailState = {
      mesa: grp.mesa,
      oldest: grp.oldest,
      kept: grp.items.map(row => ({ row, removed: false, note: row.notes || '' })),
      added: [],
    };
    const el = drawerEl();
    el.innerHTML = `
      <div class="nm-panel nm-panel-detail">
        <div class="nm-panel-head">
          <button type="button" class="nm-back" id="nm-back-list">←</button>
          <span class="nm-panel-title">${esc(grp.mesa)} — Confirmar pedido</span>
          <span class="nm-timer" data-since="${grp.oldest}">⏱ 0:00</span>
        </div>
        <div class="nm-panel-body" id="nm-detail-body"></div>
        <div class="nm-panel-foot">
          <div class="nm-total">Total: <strong id="nm-detail-total">€0,00</strong></div>
          <button type="button" class="nm-confirm-btn" id="nm-confirm-send">✓ Confirmar e enviar para cozinha</button>
          <button type="button" class="nm-cancel-btn" id="nm-cancel-order">Cancelar pedido</button>
        </div>
      </div>`;
    el.querySelector('#nm-back-list').addEventListener('click', openListDrawer);
    el.querySelector('#nm-confirm-send').addEventListener('click', confirmOrder);
    el.querySelector('#nm-cancel-order').addEventListener('click', cancelOrder);
    requestAnimationFrame(() => el.classList.add('open'));
    renderDetail();
    renderTimers();
    loadAddItemOptions();
  }

  function liveLines() {
    const kept = detailState.kept.filter(k => !k.removed)
      .map(k => ({ name: k.row.item_name, price: k.row.item_price, qty: k.row.quantity }));
    const added = detailState.added
      .map(a => ({ name: a.name, price: a.price, qty: a.qty }));
    return kept.concat(added);
  }

  function renderDetail() {
    const body = document.getElementById('nm-detail-body');
    if (!body || !detailState) return;
    const keptHtml = detailState.kept.map((k, idx) => `
      <div class="nm-line ${k.removed ? 'removed' : ''}" data-kidx="${idx}">
        <div class="nm-line-main">
          <span class="nm-line-name">${k.row.quantity}× ${esc(k.row.item_name)}</span>
          <span class="nm-line-price">${fmtEUR2(k.row.item_price * k.row.quantity)}</span>
          <button type="button" class="nm-line-x" aria-label="Remover item">×</button>
        </div>
        <div class="nm-line-note">
          <input type="text" maxlength="80" placeholder="+ Nota à cozinha..." value="${escAttr(k.note)}">
        </div>
      </div>`).join('');
    const addedHtml = detailState.added.map((a, idx) => `
      <div class="nm-line nm-line-added" data-aidx="${idx}">
        <div class="nm-line-main">
          <span class="nm-line-name">${a.qty}× ${esc(a.name)} <em>novo</em></span>
          <span class="nm-line-price">${fmtEUR2(a.price * a.qty)}</span>
          <button type="button" class="nm-line-x" aria-label="Remover item">×</button>
        </div>
      </div>`).join('');
    body.innerHTML = `
      ${keptHtml}${addedHtml}
      <div class="nm-add-wrap">
        <input type="text" id="nm-add-search" placeholder="+ Adicionar item (pesquisar menu...)">
        <div id="nm-add-results"></div>
      </div>`;

    body.querySelectorAll('.nm-line[data-kidx]').forEach(line => {
      const idx = parseInt(line.dataset.kidx, 10);
      line.querySelector('.nm-line-x').addEventListener('click', () => removeLine(line, () => {
        detailState.kept[idx].removed = true;
        refreshTotal();
        warnIfEmpty();
      }));
      line.querySelector('.nm-line-note input').addEventListener('input', (e) => {
        detailState.kept[idx].note = e.target.value;
      });
    });
    body.querySelectorAll('.nm-line[data-aidx]').forEach(line => {
      const idx = parseInt(line.dataset.aidx, 10);
      line.querySelector('.nm-line-x').addEventListener('click', () => removeLine(line, () => {
        detailState.added.splice(idx, 1);
        renderDetail();
      }));
    });
    wireAddSearch();
    refreshTotal();
  }

  // strikethrough 0.5s → collapse → callback
  function removeLine(line, cb) {
    line.classList.add('striking');
    setTimeout(() => {
      line.classList.add('collapsing');
      setTimeout(cb, 260);
    }, 500);
  }

  function warnIfEmpty() {
    if (!liveLines().length && typeof showToast === 'function') {
      showToast('Pedido ficará vazio.', 'warning');
    }
  }

  function refreshTotal() {
    const el = document.getElementById('nm-detail-total');
    if (!el) return;
    const total = liveLines().reduce((s, l) => s + (Number(l.price) || 0) * l.qty, 0);
    el.textContent = fmtEUR2(total);
  }

  // ── adicionar item (pesquisa no menu do venue) ──────────────────
  let menuOptions = null; // [{id, name, price}]
  async function loadAddItemOptions() {
    if (menuOptions || typeof loadMenuItems !== 'function') return;
    const sections = await loadMenuItems(SLUG);
    if (!sections) return;
    menuOptions = [];
    sections.forEach(sec => sec.items.forEach(it =>
      menuOptions.push({ id: it.id, name: it.name, price: parsePriceNum(it.price), section: sec.name, sectionId: sec.id })));
  }
  function wireAddSearch() {
    const input = document.getElementById('nm-add-search');
    const results = document.getElementById('nm-add-results');
    if (!input || !results) return;
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q || !menuOptions) { results.innerHTML = ''; return; }
      const hits = menuOptions.filter(o => o.name.toLowerCase().includes(q)).slice(0, 6);
      results.innerHTML = hits.map((h, i) =>
        `<button type="button" class="nm-add-hit" data-i="${i}">${esc(h.name)} <span>${fmtEUR2(h.price)}</span></button>`).join('');
      results.querySelectorAll('.nm-add-hit').forEach(btn => {
        btn.addEventListener('click', () => {
          const h = hits[parseInt(btn.dataset.i, 10)];
          detailState.added.push({ item_id: h.id, name: h.name, price: h.price, qty: 1, section: h.section });
          input.value = ''; results.innerHTML = '';
          renderDetail();
        });
      });
    });
  }
  function parsePriceNum(p) {
    if (typeof p === 'number') return p;
    const n = String(p || '').replace(/[^\d.,]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.');
    const v = parseFloat(n);
    return isNaN(v) ? 0 : v;
  }

  // Course a partir da secção do menu — a cozinha agrupa por isto.
  function courseFor(sectionName) {
    const c = String(sectionName || '').toLowerCase();
    if (/bebid|drink|vinho|cerveja|sumo|água|agua|refrig|caf[eé]|bar\b/.test(c)) return 'bebida';
    if (/sobremes|dessert|doce|gelad/.test(c)) return 'sobremesa';
    if (/entrada|starter|petisc|couvert|antojito|totopo/.test(c)) return 'entrada';
    return 'principal';
  }

  // ── confirmar / cancelar ────────────────────────────────────────
  async function confirmOrder() {
    if (!detailState || !detailComandaId) return;
    const cid = detailComandaId;
    const mesa = detailState.mesa;
    if (!liveLines().length) { if (typeof showToast === 'function') showToast('O pedido está vazio.', 'warning'); return; }

    const run = window.SubmitGuard ? (fn) => SubmitGuard.run('nm-confirm-' + cid, fn) : (fn) => fn();
    await run(async () => {
      try {
        // 1) próxima ronda da comanda
        const { data: last } = await db.from('comanda_rounds')
          .select('round_number').eq('comanda_id', cid)
          .order('round_number', { ascending: false }).limit(1).maybeSingle();
        const roundNumber = ((last && last.round_number) || 0) + 1;

        const kept = detailState.kept.filter(k => !k.removed);
        const removed = detailState.kept.filter(k => k.removed);

        // 2) cria a ronda (fired_by staff)
        const { data: round, error: rErr } = await db.from('comanda_rounds').insert({
          comanda_id: cid, espaco_slug: SLUG, round_number: roundNumber,
          fired_by: 'staff', item_count: kept.length + detailState.added.length,
        }).select('id').single();
        if (rErr) throw rErr;

        // 3) itens mantidos → sent + notas do staff
        for (const k of kept) {
          const { error } = await db.from('comanda_items').update({
            status: 'sent', round_id: round.id, round_number: roundNumber,
            notes: (k.note || '').trim().slice(0, 80) || null,
          }).eq('id', k.row.id).eq('status', 'awaiting_staff');
          if (error) throw error;
        }
        // 4) itens removidos pelo staff → fora do pedido (nunca chegaram à cozinha)
        for (const k of removed) {
          await db.from('comanda_items').delete()
            .eq('id', k.row.id).eq('status', 'awaiting_staff');
        }
        // 5) itens adicionados pelo staff → directos na ronda
        if (detailState.added.length) {
          const rows = detailState.added.map(a => ({
            comanda_id: cid, espaco_slug: SLUG, item_id: a.item_id,
            item_name: a.name, item_price: a.price, quantity: a.qty,
            added_by: 'staff', course: courseFor(a.section),
            status: 'sent', round_id: round.id, round_number: roundNumber,
          }));
          const { error } = await db.from('comanda_items').insert(rows);
          if (error) throw error;
        }
        // 6) comanda segue para a cozinha
        await db.from('comandas').update({
          status: 'submitted', submitted_at: new Date().toISOString(),
        }).eq('id', cid);

        if (typeof showToast === 'function') showToast(`${mesa} enviada ✓`, 'success');
        closeDrawer();
        await refetchPending();
      } catch (e) {
        console.warn('[pending-orders] confirm', e);
        if (typeof showToast === 'function') showToast('Erro ao confirmar. Tente novamente.', 'error');
      }
    });
  }

  async function cancelOrder() {
    if (!detailState || !detailComandaId) return;
    const cid = detailComandaId;
    const mesa = detailState.mesa;
    const sure = (typeof confirmModal === 'function')
      ? await confirmModal({
          title: 'Cancelar pedido',
          body: 'Tens a certeza? O cliente será avisado.',
          confirmLabel: 'Cancelar pedido', danger: true,
        })
      : window.confirm('Tens a certeza? O cliente será avisado.');
    if (!sure) return;
    try {
      const { error } = await db.from('comanda_items').update({
        status: 'cancelled', void_by: 'staff', void_reason: 'outro',
        void_at: new Date().toISOString(),
      }).eq('comanda_id', cid).eq('status', 'awaiting_staff');
      if (error) throw error;
      if (typeof showToast === 'function') showToast(`Pedido ${mesa} cancelado.`, 'info');
      closeDrawer();
      await refetchPending();
    } catch (e) {
      console.warn('[pending-orders] cancel', e);
      if (typeof showToast === 'function') showToast('Erro ao cancelar. Tente novamente.', 'error');
    }
  }

  // ── helpers ─────────────────────────────────────────────────────
  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escAttr(s) { return esc(s).replace(/"/g, '&quot;'); }
  function fmtEUR2(v) { return '€' + (Number(v) || 0).toFixed(2).replace('.', ','); }

  // ── CSS ─────────────────────────────────────────────────────────
  function injectStyles() {
    const css = `
#nm-fab{position:fixed;bottom:24px;right:24px;width:64px;height:64px;border-radius:50%;background:var(--brand,#C8952A);color:#fff;font-size:28px;border:none;cursor:pointer;z-index:1000;box-shadow:0 4px 20px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center}
#nm-fab-badge{position:absolute;top:-4px;right:-4px;background:#EF4444;color:#fff;border-radius:50%;width:22px;height:22px;font-size:12px;font-weight:bold;display:none;align-items:center;justify-content:center}
#nm-fab.has-pending{animation:nm-fab-pulse 1.5s ease-in-out infinite}
@keyframes nm-fab-pulse{0%,100%{box-shadow:0 4px 20px rgba(0,0,0,.25)}50%{box-shadow:0 4px 32px rgba(239,68,68,.6),0 0 0 8px rgba(239,68,68,.15)}}
.page-cozinha #nm-fab,.page-cozinha #nm-toast-stack{display:none}
#nm-toast-stack{position:fixed;top:16px;right:16px;z-index:1200;display:flex;flex-direction:column;gap:10px;max-width:min(360px,92vw)}
.nm-toast{display:flex;align-items:center;gap:12px;background:var(--bg-elevated,#222);color:var(--text-primary,#fff);border:1px solid var(--border-md,rgba(255,255,255,.15));border-radius:14px;padding:12px 14px;box-shadow:0 8px 32px rgba(0,0,0,.4);transform:translateX(120%);transition:transform .4s cubic-bezier(.4,0,.2,1)}
.nm-toast.show{transform:translateX(0)}
.nm-toast-txt{display:flex;flex-direction:column;gap:2px;font-size:13px}
.nm-toast-txt strong{font-size:13.5px}
.nm-toast-txt span{opacity:.75;font-size:12.5px}
.nm-toast-btn{margin-left:auto;background:var(--brand,#C8952A);color:#fff;border:none;border-radius:9px;padding:8px 12px;font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap;min-height:36px}
#nm-drawer{position:fixed;inset:0;z-index:1100;background:rgba(0,0,0,.45);opacity:0;pointer-events:none;transition:opacity .3s ease}
#nm-drawer.open{opacity:1;pointer-events:auto}
.nm-panel{position:absolute;top:0;right:0;bottom:0;width:min(480px,90vw);background:var(--bg-base,#161616);color:var(--text-primary,#fff);display:flex;flex-direction:column;transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);box-shadow:-12px 0 40px rgba(0,0,0,.4)}
#nm-drawer.open .nm-panel{transform:translateX(0)}
.nm-panel-head{display:flex;align-items:center;gap:12px;padding:16px;border-bottom:1px solid var(--border-md,rgba(255,255,255,.12))}
.nm-panel-title{font-weight:800;font-size:14px;letter-spacing:.4px;flex:1}
.nm-back{background:none;border:none;color:inherit;font-size:15px;cursor:pointer;padding:6px;min-height:48px}
.nm-panel-body{flex:1;overflow-y:auto;padding:14px 16px}
.nm-empty{text-align:center;padding:48px 12px;font-size:32px}
.nm-empty p{font-size:14.5px;margin-top:10px;opacity:.75}
.nm-card{border:1px solid var(--border-md,rgba(255,255,255,.12));border-radius:14px;padding:14px;margin-bottom:12px;animation:nm-card-in .3s ease}
@keyframes nm-card-in{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
.nm-card-top{display:flex;align-items:center;gap:10px}
.nm-card-mesa{font-weight:800;font-size:15px;flex:1}
.nm-open-btn{background:var(--brand,#C8952A);color:#fff;border:none;border-radius:10px;padding:10px 14px;font-size:13px;font-weight:700;cursor:pointer;min-height:48px}
.nm-card-items{font-size:12.5px;opacity:.7;margin-top:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nm-timer{font-size:12.5px;font-variant-numeric:tabular-nums}
.nm-timer.t-green{color:#34D399}.nm-timer.t-amber{color:#FBBF24}.nm-timer.t-red{color:#EF4444;font-weight:700}
.nm-line{border-bottom:1px solid var(--border-md,rgba(255,255,255,.08));padding:10px 0;transition:opacity .25s,max-height .25s;max-height:120px;overflow:hidden}
.nm-line.striking .nm-line-name{text-decoration:line-through;opacity:.5;transition:opacity .5s}
.nm-line.collapsing{max-height:0;opacity:0;padding:0}
.nm-line.removed{display:none}
.nm-line-main{display:flex;align-items:center;gap:10px;min-height:48px}
.nm-line-name{flex:1;font-size:14px}
.nm-line-name em{font-size:11px;color:#34D399;font-style:normal;margin-left:6px}
.nm-line-price{font-size:13.5px;font-variant-numeric:tabular-nums}
.nm-line-x{background:none;border:1px solid var(--border-md,rgba(255,255,255,.2));color:inherit;border-radius:9px;width:34px;height:34px;font-size:16px;cursor:pointer}
.nm-line-note input{width:100%;background:transparent;border:none;border-bottom:1px dashed var(--border-md,rgba(255,255,255,.2));color:inherit;font-size:12.5px;padding:6px 2px;outline:none}
.nm-add-wrap{margin-top:14px}
#nm-add-search{width:100%;background:var(--bg-hover,rgba(255,255,255,.06));border:1px solid var(--border-md,rgba(255,255,255,.15));color:inherit;border-radius:11px;padding:12px;font-size:13.5px;outline:none;min-height:48px}
.nm-add-hit{display:flex;justify-content:space-between;width:100%;background:none;border:none;border-bottom:1px solid var(--border-md,rgba(255,255,255,.08));color:inherit;padding:12px 6px;font-size:13.5px;cursor:pointer;min-height:48px}
.nm-add-hit:hover{background:var(--bg-hover,rgba(255,255,255,.06))}
.nm-panel-foot{padding:14px 16px calc(14px + env(safe-area-inset-bottom));border-top:1px solid var(--border-md,rgba(255,255,255,.12))}
.nm-total{font-size:14.5px;margin-bottom:12px}
.nm-confirm-btn{width:100%;background:#16A34A;color:#fff;border:none;border-radius:13px;padding:14px;font-size:15px;font-weight:800;cursor:pointer;min-height:52px}
.nm-cancel-btn{width:100%;background:none;border:none;color:#EF4444;font-size:13.5px;margin-top:10px;cursor:pointer;padding:10px;min-height:48px}
@media (max-width:480px){.nm-panel{top:auto;left:0;width:100%;height:92vh;border-radius:18px 18px 0 0;transform:translateY(100%)}#nm-drawer.open .nm-panel{transform:translateY(0)}}
`;
    const s = document.createElement('style');
    s.textContent = css;
    // Venues sem € no portal: o drawer confirma itens sem mostrar preços —
    // faturamento vive apenas na área financeira dedicada.
    if (typeof moneyHiddenFor === 'function' && moneyHiddenFor(SLUG)) {
      s.textContent += '\n.nm-line-price,.nm-add-hit span,.nm-total{display:none !important}';
    }
    document.head.appendChild(s);
  }
})();
