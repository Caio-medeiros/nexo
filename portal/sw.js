/**
 * NEXO Portal — Service Worker.
 * Strategy:
 *   • Supabase / analytics  → network-first (never serve stale data)
 *   • CDN fonts & libraries  → cache-first
 *   • Portal pages & assets  → stale-while-revalidate
 *   • Navigation offline     → /portal/offline.html
 *
 * Bump CACHE_NAME / STATIC_CACHE to invalidate old caches on deploy.
 */
const CACHE_NAME = 'nexo-portal-v1';
const STATIC_CACHE = 'nexo-static-v1';

// Real asset paths in this repo (assets live under /portal/_assets/, and the
// shared libs under /js/). Missing files are tolerated (cached individually).
const STATIC_ASSETS = [
  '/portal/',
  '/portal/dashboard/',
  '/portal/sala/',
  '/portal/cozinha/',
  '/portal/restaurante/',
  '/portal/_assets/portal.css',
  '/portal/_assets/portal.js',
  '/portal/_assets/icons.js',
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
  /cdnjs\.cloudflare\.com/,
  /cdn\.jsdelivr\.net/,
];

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

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET — never cache POST/PUT (orders, comandas, auth).
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1) Supabase / analytics — always network, offline fallback for navigations.
  if (NETWORK_FIRST_PATTERNS.some((p) => p.test(req.url))) {
    event.respondWith(
      fetch(req).catch(() => {
        if (req.mode === 'navigate') return caches.match('/portal/offline.html');
        return new Response('', { status: 503, statusText: 'Offline' });
      })
    );
    return;
  }

  // 2) CDN fonts / libraries — cache-first.
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

  // 3) Portal pages & assets (same-origin) — stale-while-revalidate.
  if (url.origin === self.location.origin && url.pathname.startsWith('/portal/')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            return response;
          })
          .catch(() => {
            if (req.mode === 'navigate') return caches.match('/portal/offline.html');
          });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 4) Default — network with cache fallback.
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
