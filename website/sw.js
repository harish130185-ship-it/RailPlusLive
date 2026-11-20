const CACHE_NAME = 'railplus-static-v4';
self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  // Always fetch fresh from network
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
