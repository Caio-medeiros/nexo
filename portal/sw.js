/**
 * NEXO Portal — Service Worker.
 * Strategy:
 *   • HTML pages / navigations → NETWORK-FIRST (never shadow a deploy with
 *     stale HTML; fall back to cache only when offline → offline.html)
 *   • Supabase / analytics      → network-first (never serve stale data)
 *   • Fonts (Google)            → cache-first
 *   • Same-origin static assets → stale-while-revalidate (one cache)
 *
 * IMPORTANT: HTML must be network-first. A previous version precached the
 * portal pages and served them stale-while-revalidate from a versioned cache
 * that was never purged — so a deployed fix (e.g. self-hosting Supabase)
 * never reached users; the SW kept serving the old HTML that loaded a
 * third-party CDN, which failed on some networks → "Sem ligação".
 *
 * Bump VERSION on every deploy that changes caching behaviour to purge old
 * caches on activate.
 */
const VERSION = 'v4';
const CACHE_NAME = 'nexo-portal-' + VERSION;
const STATIC_CACHE = 'nexo-static-' + VERSION;

// Precache ONLY true static assets — never the HTML pages (those are
// network-first so they always reflect the latest deploy).
const STATIC_ASSETS = [
  '/portal/_assets/portal.css',
  '/portal/_assets/portal.js',
  '/portal/_assets/icons.js',
  '/portal/_assets/supabase.min.js',
  '/portal/onboarding/onboarding.css',
  '/portal/onboarding/onboarding-steps.js',
  '/portal/onboarding/onboarding.js',
  '/js/nexo-security.js',
  '/js/comanda.js',
  '/portal/sala/sala.css',
  '/portal/sala/sala.js',
  '/portal/manifest.json',
  '/portal/icons/icon-192.png',
  '/portal/icons/icon-512.png',
  '/portal/offline.html',
];

const NETWORK_FIRST_PATTERNS = [
  /supabase\.co/,
  /google-analytics/,
  /googletagmanager/,
];

const CACHE_FIRST_PATTERNS = [
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/,
];

function isHtmlRequest(req) {
  if (req.mode === 'navigate') return true;
  const accept = req.headers.get('accept') || '';
  return accept.includes('text/html');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      // Cache each asset independently so a single 404 doesn't abort install.
      Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) =>
            console.warn('[SW] skip cache', url, err && err.message)
          )
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Permite forçar a actualização imediata a partir da página, se necessário.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET — never cache POST/PUT (orders, comandas, auth).
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1) HTML pages / navigations — NETWORK-FIRST.
  //    Garante que um deploy novo aparece sempre; cache só como rede de
  //    segurança offline.
  if (isHtmlRequest(req) && url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return response;
        })
        .catch(() =>
          caches.match(req).then((cached) =>
            cached || caches.match('/portal/offline.html')
          )
        )
    );
    return;
  }

  // 2) Supabase / analytics — always network, offline fallback for navigations.
  if (NETWORK_FIRST_PATTERNS.some((p) => p.test(req.url))) {
    event.respondWith(
      fetch(req).catch(() => {
        if (req.mode === 'navigate') return caches.match('/portal/offline.html');
        return new Response('', { status: 503, statusText: 'Offline' });
      })
    );
    return;
  }

  // 3) Google fonts — cache-first.
  if (CACHE_FIRST_PATTERNS.some((p) => p.test(req.url))) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return response;
        });
      })
    );
    return;
  }

  // 4) Same-origin static assets (css/js/img) — stale-while-revalidate.
  //    Lê e escreve no MESMO cache (CACHE_NAME) para não ficar preso a uma
  //    cópia antiga noutro cache.
  if (url.origin === self.location.origin && url.pathname.startsWith('/portal/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(req).then((cached) => {
          const fetchPromise = fetch(req)
            .then((response) => {
              cache.put(req, response.clone());
              return response;
            })
            .catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // 5) Default — network with cache fallback.
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
