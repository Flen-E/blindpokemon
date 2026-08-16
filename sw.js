// Simple cache-first service worker so the installed PWA runs offline.
// Bump this whenever JS/CSS behavior changes so cache-first clients do not
// keep running an older battle implementation.
const CACHE = 'firered-v15';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim())
));

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(e.request);
      const networkFirst = e.request.mode === 'navigate' ||
        ['script', 'style'].includes(e.request.destination);
      const net = fetch(e.request)
        .then((res) => {
          if (res && res.ok) cache.put(e.request, res.clone());
          return res;
        })
        .catch(() => hit);
      // Code and HTML must update immediately after a deployment; large image
      // and audio assets retain the fast cache-first/offline behavior.
      return networkFirst ? net : (hit || net);
    })
  );
});
