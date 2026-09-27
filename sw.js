/**
 * CLB Thể Thao PWA Service Worker
 * Chiến lược: Network-First cho HTML & API, Cache-First cho Assets, Tự hủy cache khi có phiên bản mới
 */

const CACHE_VERSION = 'clb-sportpass-v3.2.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js'
];

self.addEventListener('install', (event) => {
  // Bỏ qua thời gian chờ để cập nhật Service Worker ngay lập tức
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  // Xóa sạch toàn bộ các phiên bản cache cũ trên máy người dùng
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_VERSION) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Không cache các request POST và các request gửi tới Google Apps Script (luôn đi trực tiếp)
  if (req.method !== 'GET' || url.hostname.includes('script.google.com')) {
    return;
  }

  // Network-First cho tệp index.html để đảm bảo người dùng luôn nhận bản cập nhật mới nhất từ GitHub
  if (req.mode === 'navigate' || url.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(req).then((networkRes) => {
        return caches.open(CACHE_VERSION).then((cache) => {
          cache.put(req, networkRes.clone());
          return networkRes;
        });
      }).catch(() => {
        return caches.match(req) || caches.match('./index.html');
      })
    );
    return;
  }

  // Cache-First cho font và thư viện jsQR tĩnh
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      return cachedRes || fetch(req).then((networkRes) => {
        return caches.open(CACHE_VERSION).then((cache) => {
          cache.put(req, networkRes.clone());
          return networkRes;
        });
      });
    })
  );
});
