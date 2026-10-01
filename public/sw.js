const CACHE_NAME = 'naresh-moto-cache-v4';
const ASSETS_TO_PRECACHE = [
  '/',
  '/manifest.json?v=2',
  '/favicon-32x32.png?v=2',
  '/favicon-16x16.png?v=2',
  '/apple-touch-icon.png?v=2',
  '/pwa-512x512.png?v=2',
  '/robots.txt'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_PRECACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch (_) {
    return;
  }

  // API: always hit the network (live queue, announcements, availability must stay fresh)
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    return;
  }

  // HTML navigations: network-first so new deploys reach returning visitors;
  // fall back to cache only when offline.
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return networkResponse;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/'))
        )
    );
    return;
  }

  // Everything else (hashed assets, bike frames): cache-first + runtime cache.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok && url.origin === self.location.origin) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // Return cached root as offline fallback for HTML requests
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
        });
    })
  );
});
