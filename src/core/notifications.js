// SportPass V8.6 — Interactive Role-Aware Notifications, Unread Indicator & Haptics

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
  if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      if ('sync' in reg) reg.sync.register('check-tasks').catch(() => {});
    }).catch(() => {});
  }
}

function markNotificationsRead() {
  const uid = currentUser ? currentUser.id : 'GUEST';
  try {
    localStorage.setItem('CLB_READ_NOTIF_SIG_' + uid, unreadNotifSignature || '');
  } catch (e) {}
  const dot = document.getElementById('notification-dot');
  if (dot) dot.classList.add('hidden');
}

function renderNotificationsModalList() {
  const listEl = document.getElementById('notification-list');
  const uid = currentUser ? currentUser.id : '';
  const isAdmin = Boolean(currentUser && currentUser.isAdmin);
  const items = [];

  const nextShift = deduplicateTasks(currentTasks || [])[0];
  if (nextShift) {
    const occupied = Array.from(new Set([...(nextShift.joinedMembers || []), ...(nextShift.assignedMembers || [])]));
    const isMine = Boolean(uid && occupied.includes(uid));
    items.push({
      highlight: true,
      iconBg: 'bg-icon-sky',
      icon: 'clock',
      title: 'Nhắc nhở ca trực sắp tới',
      time: nextShift.id,
      desc: `${nextShift.title} tại ${nextShift.location || 'SVĐ Trung Tâm'} (${nextShift.time || ''}). Nhấn để mở nhanh.`,
      onClick: () => {
        if (isMine) {
          switchSheetDialog('notification-modal', 'qr-modal', () => {
            activeQrTaskId = nextShift.id;
            startQrCountdown();
          });
        } else if (isAdmin) {
          switchSheetDialog('notification-modal', 'approve-shift-modal', () => switchApproveTab('shifts'));
        } else {
          switchSheetDialog('notification-modal', 'task-mission-modal', () => {
            switchMissionTab('shifts');
            renderMissionSheetPanels();
          });
        }
      }
    });
  }

  const pendingSwaps = (currentSwaps || []).filter(s => s.status === 'pending').length;
  const pendingLeaves = (currentLeaves || []).filter(l => l.status === 'pending').length;

  if (isAdmin && (pendingSwaps + pendingLeaves > 0)) {
    items.push({
      highlight: false,
      iconBg: 'bg-icon-amber',
      icon: 'alert',
      title: `Có ${pendingSwaps + pendingLeaves} yêu cầu điều động chờ duyệt`,
      time: 'Cần duyệt',
      desc: 'Nhấn để mở thẳng bảng phê duyệt đổi ca và chi viện nhân sự.',
      onClick: () => {
        switchSheetDialog('notification-modal', 'approve-shift-modal', () => {
          switchApproveTab(pendingSwaps > 0 ? 'swap' : 'leave');
        });
      }
    });
  } else if (!isAdmin && uid) {
    const mySwaps = (currentSwaps || []).filter(s => s.fromId === uid);
    const myLeaves = (currentLeaves || []).filter(l => l.memberId === uid);
    const myTotal = mySwaps.length + myLeaves.length;
    if (myTotal > 0) {
      const latest = mySwaps[0] || myLeaves[0];
      const stLabel = latest.status === 'approved' ? 'Đã duyệt' : (latest.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt');
      items.push({
        highlight: false,
        iconBg: 'bg-icon-amber',
        icon: 'refresh',
        title: `Đơn đổi / rút ca của bạn (${myTotal})`,
        time: stLabel,
        desc: 'Nhấn để xem trạng thái phản hồi hoặc hủy yêu cầu đang chờ duyệt.',
        onClick: () => {
          switchSheetDialog('notification-modal', 'task-mission-modal', () => {
            switchMissionTab('swap');
            renderMissionSheetPanels();
          });
        }
      });
    }
  }

  items.push({
    highlight: false,
    iconBg: 'bg-icon-emerald',
    icon: 'check',
    title: 'Thẻ điểm danh QR đang hoạt động',
    time: 'Mở QR',
    desc: `Nhấn để xuất trình mã QR cá nhân của ${currentUser ? currentUser.hoTen : 'hội viên'} (làm mới mỗi 45 giây).`,
    onClick: () => {
      switchSheetDialog('notification-modal', 'qr-modal', () => startQrCountdown());
    }
  });

  unreadNotifSignature = [
    nextShift ? nextShift.id : 'NONE',
    isAdmin ? `${pendingSwaps}-${pendingLeaves}` : uid,
    (currentSwaps || []).filter(s => s.fromId === uid).map(s => s.status).join(','),
    (currentLeaves || []).filter(l => l.memberId === uid).map(l => l.status).join(',')
  ].join('|');

  let readSig = '';
  try { readSig = localStorage.getItem('CLB_READ_NOTIF_SIG_' + (uid || 'GUEST')) || ''; } catch (e) {}
  const dot = document.getElementById('notification-dot');
  if (dot) dot.classList.toggle('hidden', !unreadNotifSignature || unreadNotifSignature === readSig);

  if (!listEl) return;
  const nodes = items.map(it =>
    el('button', {
      type: 'button',
      className: `notif-item-card interactive spring-press${it.highlight ? ' highlight' : ''}`,
      onClick: it.onClick
    },
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
