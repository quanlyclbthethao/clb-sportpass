// SportPass V8.0 — Aquamorphic Floating Pill Toast & Notification Center Sheet Renderer

let toastHideTimer = null;

function showToast(message) {
  const toast = document.getElementById('toast-notification');
  const toastText = document.getElementById('toast-text');
  if (!toast) return;
  if (message && toastText) toastText.textContent = String(message);
  toast.classList.add('active');
  if (toastHideTimer) clearTimeout(toastHideTimer);
  toastHideTimer = setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}

function triggerHaptic(type = 'light') {
  try {
    if (!('vibrate' in navigator)) return;
    if (type === 'success') navigator.vibrate([12, 24, 18]);
    else if (type === 'warning') navigator.vibrate([22, 18, 22]);
    else navigator.vibrate(10);
  } catch (e) {}
}

function autoEnableBackgroundNotifications() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      if ('sync' in reg) reg.sync.register('check-tasks').catch(() => {});
    }).catch(() => {});
  }
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    showToast('Trình duyệt không hỗ trợ thông báo đẩy.');
    return 'unsupported';
  }
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    autoEnableBackgroundNotifications();
    showToast('Đã bật thông báo ca trực CLB!');
  }
  return perm;
}

function renderNotificationsModalList() {
  const listEl = document.getElementById('notification-list');
  if (!listEl) return;

  const items = [];
  const nextShift = (currentTasks || [])[0];
  if (nextShift) {
    items.push({
      highlight: true,
      iconBg: 'bg-icon-sky',
      icon: 'clock',
      title: 'Nhắc nhở ca trực sắp tới',
      time: 'Hiện tại',
      desc: `${nextShift.title} tại ${nextShift.location || 'Nhà Thi Đấu ĐH Hải Dương'} (${nextShift.time || '14:00'}). Vui lòng chuẩn bị thẻ QR để check-in.`
    });
  }

  const pendingSwaps = (currentSwaps || []).filter(s => s.status === 'pending').length;
  const pendingLeaves = (currentLeaves || []).filter(l => l.status === 'pending').length;
  if (pendingSwaps + pendingLeaves > 0) {
    items.push({
      highlight: false,
      iconBg: 'bg-icon-amber',
      icon: 'alert',
      title: `Có ${pendingSwaps + pendingLeaves} đơn đổi / rút ca chờ duyệt`,
      time: 'Cần xử lý',
      desc: 'Mở mục Duyệt ca để xem chi tiết danh sách đổi ca và rút ca của thành viên.'
    });
  }

  items.push({
    highlight: false,
    iconBg: 'bg-icon-emerald',
    icon: 'check',
    title: 'Hệ thống điểm danh QR đã sẵn sàng',
    time: 'CLB UHD',
    desc: 'Dữ liệu 125 thành viên thuộc 7 ban chuyên môn đã đồng bộ đầy đủ với thẻ Varsity Pass.'
  });

  const nodes = items.map(it =>
    el('div', { className: `notif-item-card${it.highlight ? ' highlight' : ''}` },
      el('div', { className: `notif-item-icon ${it.iconBg}` }, spIconNode(it.icon, 16)),
      el('div', { style: { flex: '1', minWidth: '0' } },
        el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' } },
          el('span', { style: { fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' } }, it.title),
          el('span', { className: 'font-mono', style: { fontSize: '10px', color: '#0369a1', fontWeight: '600', flexShrink: '0' } }, it.time)
        ),
        el('p', { style: { margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' } }, it.desc)
      )
    )
  );

  mount(listEl, nodes);
}
