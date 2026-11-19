// SportPass V6.1 — Unified Monochrome SVG Iconography, Dynamic Aqua Island & Web Push

let aquaTimer = null;

function spIcon(name, size = 16) {
  const s = Number(size) || 16;
  const icons = {
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
    refresh: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    'map-pin': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    'thumbs-up': '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    sparkles: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
    rotate: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'
  };
  const body = icons[name] || icons.zap;
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

function resolveIslandIconName(hint) {
  const map = {
    '⚡': 'zap',
    '✅': 'check',
    '⚠️': 'alert',
    '🔒': 'lock',
    '🔐': 'lock',
    '🛡️': 'shield',
    '🔄': 'refresh',
    '↩️': 'refresh',
    '🗑️': 'trash',
    '📣': 'bell',
    '📝': 'edit',
    '✏️': 'edit',
    '📸': 'camera',
    '☁️': 'cloud',
    '📋': 'file',
    '⚖️': 'shield',
    '✨': 'sparkles',
    '🟢': 'check',
    '💪': 'check',
    '⏳': 'clock',
    '📨': 'bell',
    'ℹ️': 'info',
    '👋': 'shield'
  };
  return map[hint] || (typeof hint === 'string' && /^[a-z-]+$/.test(hint) ? hint : 'zap');
}

function triggerHaptic(type = 'light') {
  try {
    if (!('vibrate' in navigator)) return;
    if (type === 'success') navigator.vibrate([12, 24, 18]);
    else if (type === 'warning') navigator.vibrate([22, 18, 22]);
    else navigator.vibrate(10);
  } catch (e) {}
}

function showAquaIsland(msg, icon = 'zap') {
  const island = document.getElementById('aquaIsland');
  const msgEl = document.getElementById('aquaIslandMsg');
  const iconEl = document.getElementById('aquaIslandIcon');
  if (!island || !msgEl) return;

  msgEl.textContent = String(msg || '');
  if (iconEl) iconEl.innerHTML = spIcon(resolveIslandIconName(icon), 15);
  island.classList.add('active');

  if (aquaTimer) clearTimeout(aquaTimer);
  aquaTimer = setTimeout(() => {
    island.classList.remove('active');
  }, 3200);
}

function triggerToast(message) {
  showAquaIsland(message, 'sparkles');
}

function autoEnableBackgroundNotifications() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      if ('sync' in reg) {
        reg.sync.register('check-tasks').catch(() => {});
      }
      if ('periodicSync' in reg) {
        reg.periodicSync.register('check-tasks-periodic', { minInterval: 12 * 60 * 60 * 1000 }).catch(() => {});
      }
    }).catch(() => {});
  }
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    showAquaIsland('Trình duyệt không hỗ trợ thông báo đẩy.', 'alert');
    return 'unsupported';
  }
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    autoEnableBackgroundNotifications();
    showAquaIsland('Đã kích hoạt thông báo điều động theo thời gian thực.', 'bell');
  }
  return perm;
}

function triggerTaskNotification(title, body) {
  showAquaIsland(title, 'bell');
  if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then((reg) => {
      if (reg && reg.showNotification) {
        reg.showNotification(title, { body: body || 'CLB Thể Thao • ĐH Hải Dương', tag: 'sportpass-dispatch' });
      }
    }).catch(() => {});
  } else if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, { body: body || 'CLB Thể Thao • ĐH Hải Dương' }); } catch (e) {}
  }
}
