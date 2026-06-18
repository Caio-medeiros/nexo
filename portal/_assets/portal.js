// NEXO Portal — shared utils + auth + layout
// Requires: @supabase/supabase-js CDN + icons.js loaded before this file.
// ─────────────────────────────────────────────────────────

// ─── TEMA (light/dark) ───────────────────
// Aplicado o mais cedo possível para evitar "flash" do tema errado.
(function initThemeEarly() {
  try {
    var saved = localStorage.getItem('nexo-theme');
    var sys = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', saved || sys);
  } catch (_) {}
})();
function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('nexo-theme', t); } catch (_) {}
  const btn = document.getElementById('theme-toggle');
  if (btn && typeof getIcon === 'function') {
    btn.innerHTML = getIcon(t === 'light' ? 'moon' : 'sun', 18);
    btn.setAttribute('aria-label', t === 'light' ? 'Mudar para modo escuro' : 'Mudar para modo claro');
    btn.setAttribute('title', t === 'light' ? 'Modo escuro' : 'Modo claro');
  }
}
function toggleTheme() { applyTheme(getTheme() === 'light' ? 'dark' : 'light'); }

// ─── SUPABASE ────────────────────────────
const SUPABASE_URL = 'https://kgbrtbpeekhkroibsgqq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYnJ0YnBlZWtoa3JvaWJzZ3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDAwMTMsImV4cCI6MjA5NjYxNjAxM30.vFvSLysnS3456WWKa2a659YuIVuOceYHG4NMd79Jerc';

let db = null;
if (typeof supabase === 'undefined') {
  console.error('NEXO Portal: Supabase CDN não carregou.');
} else {
  db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ─── AUTH ─────────────────────────────────
async function requireAuth() {
  if (!db) {
    showToast('Sem ligação. Verifique a internet e recarregue.', 'error');
    return null;
  }
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = '/portal/?redirect=' +
      encodeURIComponent(window.location.pathname);
    return null;
  }
  return session;
}

async function getClientData() {
  const session = await requireAuth();
  if (!session) return null;

  // Garante que o Realtime tem o token de auth depois de um reload —
  // sem isto, o RLS bloqueia a entrega de eventos (a Sala não atualiza ao vivo).
  try { db.realtime.setAuth(session.access_token); } catch (_) {}

  // 1) Cliente — query simples, sem embeds (robusta a cache/duplicados)
  const { data: clients, error } = await db
    .from('clients')
    .select('*')
    .eq('auth_user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    renderFatalError('Erro ao carregar dados. Tente novamente.', error);
    return null;
  }
  if (!clients || clients.length === 0) {
    renderFatalError('A sua conta ainda não está configurada. Contacte a NEXO para activar o portal.');
    return null;
  }

  const client = clients[0];

  // 2) Menus + onboarding em paralelo — falhas aqui NÃO derrubam o portal
  const [menusRes, obRes] = await Promise.all([
    db.from('menus').select('*').eq('client_id', client.id),
    db.from('onboarding').select('*').eq('client_id', client.id).maybeSingle(),
  ]);
  if (menusRes.error) console.warn('portal: menus indisponíveis', menusRes.error);
  if (obRes.error) console.warn('portal: onboarding indisponível', obRes.error);

  client.menus = menusRes.data || [];
  client.onboarding = obRes.error ? null : obRes.data;
  client._session = session;

  // 3) Personalização: marca do cliente aplicada ao portal
  applyClientBrand(client);

  // 4) Kill-switch: contrato expirado/suspenso → bloqueia o portal
  if (!contractActive(client)) {
    renderContractLock(client);
    return null;
  }

  return client;
}

// ─── CONTRATO / RENOVAÇÃO ────────────────────
// Ativo se não estiver churned/suspenso e a renovação não estiver vencida.
function contractActive(client) {
  if (!client) return true;
  if (client.status === 'churned' || client.status === 'suspended') return false;
  if (client.plan_renewal_date) {
    const d = new Date(client.plan_renewal_date + 'T23:59:59');
    if (!isNaN(d) && d < new Date()) return false;
  }
  return true;
}

// Dias até à renovação (negativo = em atraso; null = sem data)
function daysToRenewal(client) {
  if (!client || !client.plan_renewal_date) return null;
  const d = new Date(client.plan_renewal_date + 'T00:00:00');
  if (isNaN(d)) return null;
  return Math.ceil((d - new Date()) / 86400000);
}

// Banner de lembrete (≤ 30 dias) — para o dashboard e outras páginas
function renewalBannerHtml(client) {
  const days = daysToRenewal(client);
  if (days == null || days > 30) return '';
  const WA = '351918104266';
  const msg = encodeURIComponent(`Olá NEXO! Quero renovar o meu plano (${client.name || ''}).`);
  const urgent = days <= 7;
  const label = days < 0
    ? 'A sua renovação está em atraso.'
    : days === 0 ? 'A sua renovação é hoje.'
    : `Faltam ${days} ${days === 1 ? 'dia' : 'dias'} para a renovação do seu plano.`;
  return `
    <div class="sla-notice mb-4" style="${urgent ? 'border-color:var(--warning);background:color-mix(in srgb, var(--warning) 10%, transparent)' : ''}">
      <div class="flex-between" style="gap:12px;flex-wrap:wrap">
        <span>🔁 <strong>${label}</strong> Renove para manter o menu e o portal sempre activos.</span>
        <span style="display:flex;gap:8px">
          <a class="btn btn-whatsapp btn-sm" href="https://wa.me/${WA}?text=${msg}" target="_blank" rel="noopener">Renovar →</a>
          <a class="btn btn-secondary btn-sm" href="/portal/renovacao/">Ver valor & plano</a>
        </span>
      </div>
    </div>`;
}

// Ecrã de bloqueio quando o contrato expira
function renderContractLock(client) {
  const main = document.querySelector('.portal-main');
  const WA = '351918104266';
  const msg = encodeURIComponent(`Olá NEXO! Quero reactivar/renovar o contrato de ${client?.name || ''}.`);
  if (!main) { showToast('Contrato expirado. Contacte a NEXO para renovar.', 'warning'); return; }
  main.innerHTML = `
    <div class="empty-state card" style="margin-top:48px;max-width:520px;margin-left:auto;margin-right:auto;text-align:center">
      ${getIcon('clock', 34)}
      <p class="empty-title" style="font-size:18px;margin-top:8px">Contrato NEXO expirado</p>
      <p class="empty-sub" style="line-height:1.6">
        O acesso ao portal e o menu digital de <strong>${escapeHtml(client?.name || 'o seu espaço')}</strong>
        estão pausados até renovar. Os seus dados, reviews e configuração ficam guardados — renove e fica tudo activo na hora.
      </p>
      <div class="flex gap-2" style="margin-top:18px;justify-content:center;flex-wrap:wrap">
        <a class="btn btn-whatsapp" href="https://wa.me/${WA}?text=${msg}" target="_blank" rel="noopener">Renovar agora →</a>
        <button class="btn btn-secondary" onclick="signOut()">Sair</button>
      </div>
    </div>`;
}

// Aplica a identidade do cliente (cor da marca do config do menu)
async function applyClientBrand(client) {
  try {
    const slug = client?.menus?.[0]?.slug;
    if (!slug) return;
    const res = await fetch(`/menu/${slug}/config.js`, { cache: 'force-cache' });
    if (!res.ok) return;
    const text = await res.text();
    const CONFIG = new Function(text + '\n;return (typeof CONFIG !== "undefined") ? CONFIG : null;')();
    if (CONFIG && CONFIG.brandColor) {
      document.documentElement.style.setProperty('--brand', CONFIG.brandColor);
      document.body.classList.add('has-brand');
    }
  } catch (_) { /* personalização é opcional */ }
}

function renderFatalError(message, error) {
  const main = document.querySelector('.portal-main');
  const detail = error
    ? `<p class="empty-sub mono" style="margin-top:10px;word-break:break-word">${escapeHtml(
        (error.code ? error.code + ' — ' : '') + (error.message || '') +
        (error.details ? ' · ' + error.details : '') +
        (error.hint ? ' · ' + error.hint : ''))}</p>`
    : '';
  if (!main) { showToast(message, 'error'); return; }
  main.innerHTML = `
    <div class="empty-state card" style="margin-top:40px">
      ${getIcon('alert-triangle')}
      <p class="empty-title">${message}</p>
      <p class="empty-sub">Se o problema persistir, saia e volte a entrar.</p>
      ${detail}
      <div class="flex gap-2" style="margin-top:14px">
        <button class="btn btn-secondary btn-sm" onclick="window.location.reload()">Tentar novamente</button>
        <button class="btn btn-secondary btn-sm" onclick="signOut()">Sair</button>
      </div>
    </div>`;
}

async function signOut() {
  if (db) await db.auth.signOut();
  window.location.href = '/portal/';
}

// ─── TOAST ────────────────────────────────
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container') || createToastContainer();

  // max 3 stacked
  while (container.children.length >= 3) container.firstChild.remove();

  const toast = document.createElement('div');
  toast.className = `nexo-toast nexo-toast--${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] ?? 'ℹ'}</span>
    <span class="toast-message">${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function createToastContainer() {
  const el = document.createElement('div');
  el.id = 'toast-container';
  el.className = 'nexo-toast-container';
  document.body.appendChild(el);
  return el;
}

// ─── SKELETON ────────────────────────────
function skeleton(width = '100%', height = '16px') {
  return `<div class="nexo-skeleton" style="width:${width};height:${height}"></div>`;
}

// ─── COPY ────────────────────────────────
async function copyToClipboard(text, button) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    showToast('Não foi possível copiar.', 'error');
    return;
  }
  if (button) {
    const original = button.innerHTML;
    button.innerHTML = '✓ Copiado';
    button.disabled = true;
    setTimeout(() => {
      button.innerHTML = original;
      button.disabled = false;
    }, 2000);
  } else {
    showToast('Copiado para a área de transferência.', 'success');
  }
}

// ─── RELATIVE TIME ───────────────────────
function timeAgo(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'agora mesmo';
  if (seconds < 3600) return `há ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `há ${Math.floor(seconds / 3600)}h`;
  return new Date(dateStr).toLocaleDateString('pt-PT');
}

// ─── FORMAT ──────────────────────────────
function formatEUR(value) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' })
    .format(Number(value) || 0);
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ─── BUTTON LOADING ──────────────────────
function setLoading(btn, loading, label) {
  if (!btn) return;
  if (loading) {
    btn.dataset.origLabel = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>${label || 'A carregar...'}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.origLabel || label || '';
  }
}

// ─── CONFIRM MODAL ───────────────────────
function confirmModal({ title, body, confirmLabel = 'Confirmar', danger = false }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
        <div class="modal-title">${escapeHtml(title)}</div>
        <div class="modal-body">${escapeHtml(body)}</div>
        <div class="modal-actions">
          <button class="btn btn-secondary" data-cancel>Cancelar</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm>${escapeHtml(confirmLabel)}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));

    const close = (result) => {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 200);
      resolve(result);
    };
    overlay.querySelector('[data-cancel]').addEventListener('click', () => close(false));
    overlay.querySelector('[data-confirm]').addEventListener('click', () => close(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(false); document.removeEventListener('keydown', esc); }
    });
  });
}

// ─── MENU URL ────────────────────────────
function getMenuUrl(clientData) {
  const menu = clientData?.menus?.[0];
  if (!menu) return '#';
  return menu.url || `/menu/${menu.slug}/`;
}

function getMenuSlug(clientData) {
  return clientData?.menus?.[0]?.slug || null;
}

// ─── LAYOUT ──────────────────────────────
function renderLayout(activeNav, clientData) {
  const nav = document.getElementById('portal-nav');
  const sidebar = document.getElementById('portal-sidebar');
  if (!nav || !sidebar || !clientData) return;

  const menuUrl = getMenuUrl(clientData);
  const ownerName = (clientData.owner_name || '').split(' ')[0] || 'Cliente';
  const initials = ownerName.slice(0, 2).toUpperCase();

  nav.innerHTML = `
    <a href="/portal/dashboard/" class="portal-logo">NEXO.</a>
    <span class="portal-client-name">${escapeHtml(clientData.name)}</span>
    <div class="portal-nav-right">
      <a href="${menuUrl}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
        Ver Menu →
      </a>
      <button class="portal-icon-btn" id="theme-toggle" type="button" aria-label="Mudar tema"></button>
      <div class="portal-notifications-btn" id="notif-toggle" role="button" tabindex="0"
           aria-haspopup="true" aria-label="Notificações">
        ${getIcon('bell', 18)}
        <span class="notif-badge" id="notif-badge" style="display:none">0</span>
        <div class="portal-notif-dropdown" id="notif-dropdown">
          <div class="notif-dropdown-header">
            <span>Notificações</span>
            <button id="mark-all-read" class="notif-mark-all">Marcar tudo como lido</button>
          </div>
          <div id="notif-list">
            <div class="notif-empty">Sem notificações</div>
          </div>
        </div>
      </div>
      <div class="portal-avatar" id="avatar-toggle" role="button" tabindex="0" aria-haspopup="true">${initials}
        <div class="portal-dropdown" id="avatar-dropdown">
          <div class="dropdown-email">${escapeHtml(clientData.owner_name || clientData.name)}</div>
          <button onclick="signOut()" class="dropdown-item dropdown-item--danger">Sair</button>
        </div>
      </div>
    </div>`;

  // Navegação agrupada por uso. Operação primeiro (o portal vive aberto no
  // restaurante). "Alterações" foi integrada no Editar Menu — deixou de ser um
  // item à parte (era redundante com Editar Menu + Disponibilidade).
  const navGroups = [
    { label: '', items: [
      { href: '/portal/dashboard/', icon: 'grid', label: 'Dashboard' },
    ]},
    { label: 'Operação', items: [
      { href: '/portal/sala/', icon: 'monitor', label: 'Sala em Directo' },
      { href: '/portal/cozinha/', icon: 'chef', label: 'Modo Cozinha' },
      { href: '/portal/restaurante/', icon: 'cashier', label: 'Modo Restaurante' },
      { href: '/portal/fila/', icon: 'users', label: 'Fila de Espera' },
      { href: '/portal/disponibilidade/', icon: 'toggle', label: 'Disponibilidade' },
    ]},
    { label: 'Menu', items: [
      { href: '/portal/menu/', icon: 'edit', label: 'Editar Menu' },
    ]},
    { label: 'Negócio', items: [
      { href: '/portal/estatisticas/', icon: 'bar-chart', label: 'Estatísticas' },
      { href: '/portal/clientes/', icon: 'users', label: 'Clientes' },
      { href: '/portal/renovacao/', icon: 'star', label: 'Renovação' },
      { href: '/portal/referencias/', icon: 'gift', label: 'Referências' },
    ]},
    { label: '', items: [
      { href: '/portal/configuracoes/', icon: 'settings', label: 'Configurações' },
      { href: '/portal/guia/', icon: 'help', label: 'Guia' },
    ]},
  ];

  sidebar.innerHTML = navGroups.map(group => `
    ${group.label ? `<div class="sidebar-group-label">${group.label}</div>` : ''}
    ${group.items.map(item => `
      <a href="${item.href}"
         class="sidebar-item ${activeNav === item.href ? 'active' : ''}"
         ${activeNav === item.href ? 'aria-current="page"' : ''}>
        ${getIcon(item.icon)}
        <span>${item.label}</span>
      </a>`).join('')}`).join('');

  // Theme toggle (light/dark)
  applyTheme(getTheme());
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

  // Avatar dropdown toggle
  const toggle = document.getElementById('avatar-toggle');
  const dropdown = document.getElementById('avatar-dropdown');
  if (toggle && dropdown) {
    const open = (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('visible');
    };
    toggle.addEventListener('click', open);
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); }
    });
    document.addEventListener('click', () => dropdown.classList.remove('visible'));
  }

  // Notification bell dropdown
  const notifToggle = document.getElementById('notif-toggle');
  const notifDropdown = document.getElementById('notif-dropdown');
  if (notifToggle && notifDropdown) {
    const openNotif = (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('visible');
    };
    notifToggle.addEventListener('click', openNotif);
    notifToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openNotif(e); }
    });
    // keep dropdown open when clicking inside it
    notifDropdown.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', () => notifDropdown.classList.remove('visible'));
    const markAll = document.getElementById('mark-all-read');
    if (markAll) markAll.addEventListener('click', (e) => {
      e.stopPropagation();
      const slug = getMenuSlug(clientData);
      if (slug) markAllRead(slug);
    });
  }
}

// ─── MENU CONFIG PARSER ──────────────────
// Fetches /menu/{slug}/config.js (same origin) and extracts the
// items list. Item id = "{sectionId}:{index}" — same refId the
// menu uses internally.
async function loadMenuItems(slug) {
  if (!slug) return null;
  try {
    const res = await fetch(`/menu/${slug}/config.js`, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    // config.js defines `const CONFIG = {...}` (+ helper `P`).
    // Evaluate in an isolated function scope and return CONFIG.
    const CONFIG = new Function(text + '\n;return (typeof CONFIG !== "undefined") ? CONFIG : null;')();
    if (!CONFIG || !Array.isArray(CONFIG.menu)) return null;

    return CONFIG.menu.map(section => ({
      id: section.id,
      name: (section.section && (section.section.pt || section.section.en)) || section.id,
      items: (section.items || []).map((item, idx) => ({
        id: `${section.id}:${idx}`,
        name: (item.name && (item.name.pt || item.name.en)) || `Item ${idx + 1}`,
        price: item.price || '',
      })),
    }));
  } catch (err) {
    console.error('loadMenuItems', err);
    return null;
  }
}

// ─── REALTIME HELPERS ────────────────────
// Tracks channels for cleanup + shows reconnecting state on the
// element with id "live-indicator" (if present).
const _nexoChannels = [];

function trackChannel(channel) {
  _nexoChannels.push(channel);
  return channel;
}

function setLiveState(state) {
  const el = document.getElementById('live-indicator');
  if (!el) return;
  if (state === 'connected') {
    el.classList.remove('reconnecting');
    el.querySelector('.live-text').textContent = 'Em directo';
  } else {
    el.classList.add('reconnecting');
    el.querySelector('.live-text').textContent = 'A religar...';
  }
}

window.addEventListener('beforeunload', () => {
  _nexoChannels.forEach(ch => { try { db.removeChannel(ch); } catch (_) {} });
});

// ─── NOTIFICATIONS ───────────────────────
const NOTIF_ICONS = {
  order_new: '🍽️', staff_call: '🙋', waitlist_new: '⏳',
  review_positive: '⭐', review_negative: '💬', update_done: '✅', menu_viewed: '👁️',
  menu_change: '✏️',
};

let notifSubscription = null;

async function initNotifications(espacoSlug) {
  if (!espacoSlug || !db) return;
  await loadNotifications(espacoSlug);

  if (notifSubscription) { try { db.removeChannel(notifSubscription); } catch (_) {} }
  notifSubscription = db
    .channel('portal_notifications_' + espacoSlug)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'portal_notifications',
      filter: `espaco_slug=eq.${espacoSlug}`,
    }, (payload) => {
      addNotificationToUI(payload.new);
      updateBadgeCount();
      playNotificationSound();
    })
    .subscribe();
  trackChannel(notifSubscription);
}

async function loadNotifications(espacoSlug) {
  try {
    const { data } = await db
      .from('portal_notifications')
      .select('*')
      .eq('espaco_slug', espacoSlug)
      .order('created_at', { ascending: false })
      .limit(30);
    renderNotifications(data ?? []);
    updateBadgeCount(data?.filter(n => !n.read).length ?? 0);
  } catch (err) {
    console.warn('loadNotifications', err);
  }
}

function renderNotifications(notifications) {
  const list = document.getElementById('notif-list');
  if (!list) return;
  if (!notifications.length) {
    list.innerHTML = '<div class="notif-empty">Sem notificações recentes</div>';
    return;
  }
  list.innerHTML = notifications.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
      <span class="notif-icon">${NOTIF_ICONS[n.type] ?? '🔔'}</span>
      <div class="notif-content">
        <div class="notif-title">${escapeHtml(n.title.replace(/^[^\p{L}\p{N}]+/u, ''))}</div>
        ${n.body ? `<div class="notif-body">${escapeHtml(n.body)}</div>` : ''}
      </div>
      <span class="notif-time">${timeAgo(n.created_at)}</span>
    </div>`).join('');
  list.querySelectorAll('.notif-item').forEach(el => {
    el.addEventListener('click', () => markNotificationRead(el.dataset.id));
  });
}

function updateBadgeCount(count) {
  const badge = document.getElementById('notif-badge');
  if (!badge) return;
  const unread = (count != null)
    ? count
    : document.querySelectorAll('.notif-item.unread').length;
  badge.textContent = unread > 9 ? '9+' : String(unread);
  badge.style.display = unread > 0 ? 'flex' : 'none';
}

async function markNotificationRead(id) {
  const item = document.querySelector(`.notif-item[data-id="${id}"]`);
  if (!item || !item.classList.contains('unread')) return;
  item.classList.remove('unread');
  updateBadgeCount();
  try {
    await db.from('portal_notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', id);
  } catch (_) {}
}

async function markAllRead(espacoSlug) {
  document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
  updateBadgeCount(0);
  try {
    await db.from('portal_notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('espaco_slug', espacoSlug)
      .eq('read', false);
  } catch (_) {}
}

function addNotificationToUI(notification) {
  const list = document.getElementById('notif-list');
  if (!list) return;
  const emptyEl = list.querySelector('.notif-empty');
  if (emptyEl) emptyEl.remove();

  const el = document.createElement('div');
  el.className = 'notif-item unread';
  el.dataset.id = notification.id;
  el.innerHTML = `
    <span class="notif-icon">${NOTIF_ICONS[notification.type] ?? '🔔'}</span>
    <div class="notif-content">
      <div class="notif-title">${escapeHtml(notification.title.replace(/^[^\p{L}\p{N}]+/u, ''))}</div>
      ${notification.body ? `<div class="notif-body">${escapeHtml(notification.body)}</div>` : ''}
    </div>
    <span class="notif-time">agora mesmo</span>`;
  el.addEventListener('click', () => markNotificationRead(notification.id));
  list.insertBefore(el, list.firstChild);

  // also notify any page-level listener (e.g. live activity strip)
  if (typeof window.onNexoNotification === 'function') {
    try { window.onNexoNotification(notification); } catch (_) {}
  }
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 660; osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(); osc.stop(ctx.currentTime + 0.4);
  } catch (_) {}
}

// ─── MICRO-INTERAÇÕES (GSAP, opcional e seguro) ──────────────────────────────
// Anima entradas de cartões e da sidebar. Carrega o GSAP via CDN; se falhar,
// nada acontece e tudo continua 100% funcional. Respeita prefers-reduced-motion.
// Sem three.js de propósito: o portal vive sempre aberto num tablet do
// restaurante — prioridade é fluidez, fiabilidade e bateria.
function _nexoLoadGsap(cb) {
  if (window.gsap) return cb();
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js';
  s.async = true;
  s.onload = () => cb();
  s.onerror = () => {}; // sem animação — mas tudo visível e funcional
  document.head.appendChild(s);
}

function initPortalMotion() {
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    _nexoLoadGsap(() => {
      const g = window.gsap;
      if (!g) return;
      const items = document.querySelectorAll('.sidebar-item');
      if (items.length) {
        g.from(items, { opacity: 0, x: -8, duration: 0.4, ease: 'power2.out', stagger: 0.035, clearProps: 'all' });
      }
      const animateCards = () => {
        const cards = document.querySelectorAll('#main .card:not([data-anim])');
        if (!cards.length) return;
        cards.forEach((c) => c.setAttribute('data-anim', '1'));
        g.from(cards, { opacity: 0, y: 14, duration: 0.5, ease: 'power2.out', stagger: 0.06, clearProps: 'opacity,transform' });
      };
      // conteúdo do portal carrega assíncrono — apanhar em alguns momentos,
      // sem observer permanente (evita re-animar em interações do utilizador).
      animateCards();
      setTimeout(animateCards, 350);
      setTimeout(animateCards, 800);
    });
  } catch (_) {}
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPortalMotion);
} else {
  initPortalMotion();
}
