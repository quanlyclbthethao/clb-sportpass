// SportPass V7.0 — Dynamic Aqua Island Notifications, Haptics & Web Push

let aquaTimer = null;

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
    '👋': 'shield',
    '💳': 'wallet'
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
  if (iconEl) {
    iconEl.replaceChildren(spIconNode(resolveIslandIconName(icon), 15));
  }
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
