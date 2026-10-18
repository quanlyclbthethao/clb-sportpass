/**
 * CLB Thể Thao PWA Service Worker (v5.0.0-aquamorphic-push-production)
 * Trường Đại học Hải Dương (UHD) - SportPass PWA
 * Hỗ trợ: Push Notifications, Offline Caching, Background Sync, Auto Cache Cleanup
 */

const CACHE_VERSION = 'clb-sportpass-v5.0.0-production';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js',
  'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js'
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
  // Xóa sạch toàn bộ các phiên bản cache cũ
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

  // Cache-First cho font và thư viện jsQR / qrcodejs tĩnh
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

// ==================== HỆ THỐNG THÔNG BÁO PWA (WEB PUSH KHI TẮT APP) ====================
self.addEventListener('push', (event) => {
  let title = 'CLB Thể Thao • Trường Đại học Hải Dương';
  let options = {
    body: 'Bạn có nhiệm vụ / ca trực mới cần điều động hoặc phê duyệt!',
    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"%3E%3Crect width="512" height="512" rx="128" fill="%234338ca"/%3E%3Cpath d="M256 120 L360 160 L360 260 C360 330 256 390 256 390 C256 390 152 330 152 260 L152 160 Z" fill="%23ffffff"/%3E%3C/svg%3E',
    badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Ccircle cx="48" cy="48" r="48" fill="%234338ca"/%3E%3C/svg%3E',
    vibrate: [120, 60, 120, 60, 240],
    data: {
      dateOfArrival: Date.now(),
      url: './'
    },
    actions: [
      { action: 'open_app', title: 'Xem Chi Tiết' },
      { action: 'dismiss', title: 'Để Sau' }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) title = data.title;
      if (data.body) options.body = data.body;
      if (data.url) options.data.url = data.url;
    } catch(e) {
      options.body = event.data.text();
    }
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ==================== BACKGROUND SYNC & PERIODIC SYNC KHI TẮT APP ====================
async function checkNewTasksBackground() {
  try {
    const res = await fetch('https://script.google.com/macros/s/AKfycbzOzxjkLP684tGXQn7HFptjiYyMoyEFMkTackb8K56f1gJvqMlvV5mFc0JBTm9gbO7U/exec?action=syncAll');
    const data = await res.json();
    if (data && data.success && Array.isArray(data.tasks) && data.tasks.length > 0) {
      const latest = data.tasks[0];
      await self.registration.showNotification('Nhiệm vụ mới: ' + (latest.title || 'CLB Thể Thao UHD'), {
        body: `Thời gian: ${latest.time || 'Xem chi tiết'} • Địa điểm: ${latest.location || 'Tại trường'}${latest.notes ? ' • Ghi chú: ' + latest.notes : ''}`,
        icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"%3E%3Crect width="512" height="512" rx="128" fill="%234338ca"/%3E%3Cpath d="M256 120 L360 160 L360 260 C360 330 256 390 256 390 C256 390 152 330 152 260 L152 160 Z" fill="%23ffffff"/%3E%3C/svg%3E',
        badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Ccircle cx="48" cy="48" r="48" fill="%234338ca"/%3E%3C/svg%3E',
        vibrate: [150, 80, 150],
        data: { url: './' }
      });
    }
  } catch(e) {}
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'check-tasks') {
    event.waitUntil(checkNewTasksBackground());
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-tasks-periodic') {
    event.waitUntil(checkNewTasksBackground());
  }
});

