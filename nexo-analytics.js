// NEXO Analytics v2.0
// Dual tracking: GA4 + Supabase (menu_events / orders_log / staff_calls)
// Loaded before config.js — todas as leituras de config são lazy (em runtime).

const NEXO_GA4_ID = 'G-PG76WZVLNB';

// Config do menu pode estar em window.NEXO_CONFIG ou window.CONFIG (template).
function nexoCfg() {
  return window.NEXO_CONFIG || window.CONFIG || {};
}
function nexoSlug() {
  return window.ESPACO_SLUG || nexoCfg().slug || '';
}

function getSessionId() {
  let id = sessionStorage.getItem('nexo_sid');
  if (!id) {
    id = Math.random().toString(36).slice(2, 11);
    sessionStorage.setItem('nexo_sid', id);
  }
  return id;
}

async function nexoTrack(eventName, params = {}) {
  // GA4
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, { ...params, nexo_version: '2.0' });
  }

  // Supabase — fire and forget, nunca bloqueia a UI
  const cfg = nexoCfg();
  const url = cfg.supabaseUrl || '';
  const key = cfg.supabaseAnonKey || '';
  const slug = nexoSlug();
  if (!url || !key || !slug) return;

  const lang =
    document.documentElement.lang ||
    localStorage.getItem('nexo_lang_' + slug) ||
    'pt';

  fetch(`${url}/rest/v1/menu_events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      espaco_slug: slug,
      event_name: eventName,
      session_id: getSessionId(),
      language: lang,
      item_name: params.item_name ?? null,
      item_category: params.item_category ?? null,
      item_price: params.item_price ?? null,
      order_total: params.order_total ?? null,
      item_count: params.item_count ?? null,
      rating: params.rating ?? null,
      review_destination: params.review_destination ?? null,
      split_people: params.people_count ?? null,
      from_language: params.from_language ?? null,
      to_language: params.to_language ?? null,
      properties: params,
    }),
  }).catch(() => {});
}

// Regista um pedido em orders_log (WhatsApp / Staff / Grupo)
async function nexoLogOrder(orderData = {}) {
  const cfg = nexoCfg();
  const url = cfg.supabaseUrl || '';
  const key = cfg.supabaseAnonKey || '';
  const slug = nexoSlug();
  if (!url || !key || !slug) return;

  fetch(`${url}/rest/v1/orders_log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      espaco_slug: slug,
      table_label: orderData.table ?? null,
      items: orderData.items ?? [],
      total: orderData.total ?? 0,
      member_count: orderData.memberCount ?? 1,
      channel: orderData.channel ?? 'staff',
    }),
  }).catch(() => {});
}

// Regista uma chamada de staff
async function nexoLogStaffCall(tableLabel) {
  const cfg = nexoCfg();
  const url = cfg.supabaseUrl || '';
  const key = cfg.supabaseAnonKey || '';
  const slug = nexoSlug();
  if (!url || !key || !slug) return;

  fetch(`${url}/rest/v1/staff_calls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      espaco_slug: slug,
      table_label: tableLabel ?? null,
      delivered_count: 0,
    }),
  }).catch(() => {});
}

window.nexoTrack = nexoTrack;
window.nexoLogOrder = nexoLogOrder;
window.nexoLogStaffCall = nexoLogStaffCall;
window.NEXO_GA4_ID = NEXO_GA4_ID;
