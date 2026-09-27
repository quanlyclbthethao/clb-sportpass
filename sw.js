// Service Worker cho PWA CLB SportPass
const CACHE_NAME = 'clb-sportpass-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  '[https://cdn.tailwindcss.com](https://cdn.tailwindcss.com)',
  '[https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js](https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js)'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Cho phép ứng dụng hoạt động mượt mà cả khi mất mạng
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
