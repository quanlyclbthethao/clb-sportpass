// SportPass V8.5 — Create Shift, Approve Dispatch (Swaps/Urgent), Member Task Mission, QR Scanner & RBAC

const AREA_PRESETS = [
  { id: 'svd', label: 'SVĐ Trung Tâm' },
  { id: 'ntd', label: 'Nhà Thi Đấu B' },
  { id: 'sanuhd', label: 'Sân Thể Thao UHD' }
];

const DEPT_DOT_COLORS = ['#0284c7', '#10b981', '#e11d48', '#6366f1', '#f59e0b', '#0d9488', '#06b6d4'];

let currentDeptQuotaDraft = [
  { dept: 'Ban Điều hành / Nhân Sự', color: '#0284c7', count: 2 },
  { dept: 'Ban Bóng Chuyền', color: '#10b981', count: 1 },
  { dept: 'Ban Truyền Thông', color: '#e11d48', count: 1 }
];

function buildDeptFilterChips(activeDept, onSelectFn) {
  const chips = [
    el('button', {
      type: 'button',
      className: `filter-chip${activeDept === 'ALL' ? ' active' : ''}`,
      onClick: () => onSelectFn('ALL')
    }, 'Tất cả')
  ];
  for (const d of ALL_DEPARTMENTS) {
    chips.push(
      el('button', {
        type: 'button',
        className: `filter-chip${activeDept === d ? ' active' : ''}`,
        onClick: () => onSelectFn(d)
      }, d.replace(/^Ban\s+/i, ''))
    );
  }
  return chips;
}

function updatePendingBadges() {
  const swapsCount = (currentSwaps || []).filter(s => s.status === 'pending').length;
  const leavesCount = (currentLeaves || []).filter(l => l.status === 'pending').length;
  const total = swapsCount + leavesCount;

  safeSetText('approve-btn-label', `Duyệt ca (${total})`);
  safeSetText('approve-header-count', `${total} đơn mới`);
  safeSetText('tab-count-swap', String(swapsCount));
  safeSetText('tab-count-leave', String(leavesCount));
  safeSetText('btnApproveAllRequests', total > 0 ? `✓ Duyệt tất cả (${total} yêu cầu)` : 'Không có đơn chờ duyệt');

  const dot = document.getElementById('approve-corner-dot');
  if (dot) dot.classList.toggle('hidden', total === 0);

  const btnAll = document.getElementById('btnApproveAllRequests');
  if (btnAll) btnAll.disabled = total === 0;
}

// ==================== CREATE SHIFT MODAL (SCREENSHOT 8) ====================
function renderAreaPresetCards(selectedLocation) {
  const box = document.getElementById('area-cards-container');
  if (!box) return;
  const buttons = AREA_PRESETS.map((a) => {
    const active = String(selectedLocation || '').trim() === a.label;
    return el('button', {
      type: 'button',
      className: `area-pill-btn${active ? ' active' : ''}`,
      onClick: () => {
        safeSetValue('iptTaskLocation', a.label);
        renderAreaPresetCards(a.label);
      }
    }, spIconNode('map-pin', 14), el('span', {}, a.label));
  });
  mount(box, buttons);
}

function renderDeptQuotaRows() {
  const box = document.getElementById('deptQuotaContainer');
  if (!box) return;

  const rows = currentDeptQuotaDraft.map((row, idx) =>
    el('div', { className: 'quota-row' },
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: '0', flex: '1' } },
        el('span', { className: 'dept-dot', style: { backgroundColor: row.color || '#0284c7' } }),
        el('span', { style: { fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)' }, className: 'truncate' }, row.dept)
      ),
      el('div', { className: 'stepper-group' },
        el('button', {
          type: 'button',
          className: 'stepper-btn',
          'aria-label': `Giảm quân số ${row.dept}`,
          onClick: () => adjustDeptRowCount(idx, -1)
        }, '-'),
        el('span', { className: 'font-mono', style: { minWidth: '20px', textAlign: 'center', fontWeight: '700', fontSize: '13px' } }, String(row.count)),
        el('button', {
          type: 'button',
          className: 'stepper-btn plus',
          'aria-label': `Tăng quân số ${row.dept}`,
          onClick: () => adjustDeptRowCount(idx, 1)
        }, '+'),
        currentDeptQuotaDraft.length > 1
          ? el('button', {
              type: 'button',
              className: 'stepper-btn',
              'aria-label': `Xóa ${row.dept}`,
              onClick: () => removeDeptRow(idx)
            }, spIconNode('trash', 12))
          : null
      )
    )
  );
  mount(box, rows);

  const total = currentDeptQuotaDraft.reduce((s, r) => s + (Number(r.count) || 0), 0);
  safeSetText('create-shift-total-pill', `${Math.max(1, total)} nhân sự`);
  safeSetValue('iptTaskQuota', String(Math.max(1, total)));
}

function adjustDeptRowCount(index, delta) {
  const item = currentDeptQuotaDraft[index];
  if (!item) return;
  item.count = Math.max(0, (Number(item.count) || 0) + Number(delta));
  renderDeptQuotaRows();
}

function removeDeptRow(index) {
  if (currentDeptQuotaDraft.length <= 1) return;
  currentDeptQuotaDraft.splice(index, 1);
  renderDeptQuotaRows();
}

function addDeptQuotaRow() {
  const used = new Set(currentDeptQuotaDraft.map(r => r.dept));
  const nextDept = ALL_DEPARTMENTS.find(d => !used.has(d)) || ALL_DEPARTMENTS[currentDeptQuotaDraft.length % ALL_DEPARTMENTS.length];
  const color = DEPT_DOT_COLORS[currentDeptQuotaDraft.length % DEPT_DOT_COLORS.length];
  currentDeptQuotaDraft.push({ dept: nextDept, color, count: 1 });
  renderDeptQuotaRows();
}

function updateSelectedLeaderCard() {
  const leader = (membersDirectory || []).find(m => m && m.id === selectedShiftLeaderId) || currentUser || DEFAULT_MEMBERS_DIRECTORY[0];
  if (!leader) return;
  selectedShiftLeaderId = leader.id;
  const img = document.getElementById('leaderPickAvatar');
  if (img) {
    img.src = resolveAvatarUrl(leader);
    img.alt = leader.hoTen || 'Trưởng ca';
  }
  safeSetText('leaderPickName', leader.hoTen || 'Đỗ Mạnh Cường');
  safeSetText('leaderPickRole', `${leader.chucVu || 'Trưởng ca'} (${leader.id})`);
}

function cycleShiftLeader() {
  const candidates = (membersDirectory || []).filter(m => m && (m.isAdmin || m.isShiftLeader));
  if (candidates.length === 0) return;
  const idx = candidates.findIndex(m => m.id === selectedShiftLeaderId);
  selectedShiftLeaderId = candidates[(idx + 1) % candidates.length].id;
  updateSelectedLeaderCard();
}

function openCreateShiftModal(taskId = null) {
  if (!currentUser || (!currentUser.isAdmin && !currentUser.isShiftLeader)) {
    openTaskMissionModal('shifts');
    return;
  }
  editingTaskId = taskId;
  const existing = taskId ? (currentTasks || []).find(t => t.id === taskId) : null;
  safeSetText('create-shift-title', existing ? 'Chỉnh sửa ca trực' : 'Tạo ca trực mới');
  safeSetValue('iptTaskTitle', existing ? existing.title : '');
  const loc = existing ? existing.location : 'Sân Vận Động Trung Tâm';
  safeSetValue('iptTaskLocation', loc);
  renderAreaPresetCards(loc);
  safeSetValue('iptTaskDate', existing && existing.date ? existing.date : '18/03/2025');
  safeSetValue('iptTaskTime', existing ? existing.time : '14:00 - 18:00');
  safeSetValue('iptTaskNotes', existing ? (existing.notes || '') : '');

  if (existing && existing.departmentQuotas && Object.keys(existing.departmentQuotas).length > 0) {
    currentDeptQuotaDraft = Object.entries(existing.departmentQuotas).map(([dept, count], i) => ({
      dept,
      color: DEPT_DOT_COLORS[i % DEPT_DOT_COLORS.length],
      count: Number(count) || 1
    }));
  } else {
    currentDeptQuotaDraft = [
      { dept: 'Ban Nhân Sự', color: '#0284c7', count: 2 },
      { dept: 'Ban Bóng Chuyền', color: '#10b981', count: 1 },
      { dept: 'Ban Truyền Thông', color: '#e11d48', count: 1 }
    ];
  }
  renderDeptQuotaRows();

  selectedShiftLeaderId = (existing && existing.leaderId) ? existing.leaderId : (currentUser ? currentUser.id : 'DMC0806');
  updateSelectedLeaderCard();
  openSheetDialog('create-shift-modal');
}

function closeCreateShiftModal() {
  editingTaskId = null;
  closeSheetDialog('create-shift-modal');
}

function submitCreateShiftAction() {
  const title = (document.getElementById('iptTaskTitle')?.value || '').trim();
  const location = (document.getElementById('iptTaskLocation')?.value || '').trim() || 'Sân Vận Động Trung Tâm';
  const dateStr = (document.getElementById('iptTaskDate')?.value || '').trim();
  const timeOnly = (document.getElementById('iptTaskTime')?.value || '').trim() || '14:00 - 18:00';
  const timeFull = dateStr ? `${timeOnly} (${dateStr})` : timeOnly;
  const quota = Math.max(1, Number(document.getElementById('iptTaskQuota')?.value) || 4);
  const notes = (document.getElementById('iptTaskNotes')?.value || '').trim();

  if (!title) {
    showToast('Vui lòng nhập tên ca trực.');
    return;
  }

  const departmentQuotas = {};
  for (const row of currentDeptQuotaDraft) {
    if (row.dept && Number(row.count) > 0) departmentQuotas[row.dept] = Number(row.count);
  }

  let savedTask = null;
  if (editingTaskId) {
    const existingTask = (currentTasks || []).find(t => t.id === editingTaskId);
    if (existingTask) {
      existingTask.title = title;
      existingTask.location = location;
      existingTask.time = timeFull;
      existingTask.date = dateStr;
      existingTask.quota = quota;
      existingTask.notes = notes;
      existingTask.leaderId = selectedShiftLeaderId;
      existingTask.departmentQuotas = departmentQuotas;
      savedTask = existingTask;
    }
  }

  if (!savedTask) {
    savedTask = {
      id: 'TASK_' + Date.now(),
      title,
      location,
      time: timeFull,
      date: dateStr,
      quota,
      joinedMembers: [],
      assignedMembers: [],
      waitlist: [],
      checkedInMembers: [],
      checkinLogs: [],
      leaderId: selectedShiftLeaderId,
      departmentQuotas,
      notes,
      status: 'active',
      localCreatedAt: Date.now()
    };
    currentTasks.unshift(savedTask);
  }

  saveLocalState();
  syncTaskToBackend(savedTask);
  renderDispatchHub();
  renderNotificationsModalList();
  closeCreateShiftModal();

  setTimeout(() => {
    openSuccessCelebration({
      kicker: '• SPORTPASS PRO SCHEDULE',
      title: editingTaskId ? 'Cập nhật ca trực thành công!' : 'Tạo ca trực mới thành công!',
      descNodes: [
        'Ca trực ',
        el('strong', {}, title),
        ' đã được lên lịch tại ',
        el('strong', {}, location),
        ` và phân bổ cho `,
        el('strong', {}, `${quota} thành viên`),
        '.'
      ]
    });
  }, 240);
}

// ==================== APPROVE DISPATCH MODAL (SCREENSHOT 14) ====================
function openApproveShiftModal(tabName = 'swap') {
  switchApproveTab(tabName);
  openSheetDialog('approve-shift-modal');
}

function closeApproveShiftModal() {
  stopQrCameraStream();
  closeSheetDialog('approve-shift-modal');
}

function switchApproveTab(tabName) {
  currentApproveSubTab = tabName || 'swap';
  const tabs = ['swap', 'leave', 'shifts', 'scanner'];
  tabs.forEach((t) => {
    const btn = document.getElementById(`approve-tab-${t}`);
    if (btn) btn.classList.toggle('active', t === currentApproveSubTab);
  });

  const isScanner = currentApproveSubTab === 'scanner';
  const cardsEl = document.getElementById('approve-cards-container');
  const scanEl = document.getElementById('approve-scanner-panel');
  const footerEl = document.getElementById('approve-sheet-footer');

  if (cardsEl) cardsEl.classList.toggle('hidden', isScanner);
  if (scanEl) scanEl.classList.toggle('hidden', !isScanner);
  if (footerEl) footerEl.classList.toggle('hidden', currentApproveSubTab !== 'swap' && currentApproveSubTab !== 'leave');

  if (!isScanner) stopQrCameraStream();
  else populateScanTaskSelector();

  renderDispatchHub();
}

function renderDispatchHub() {
  updatePendingBadges();
  populateScanTaskSelector();
  renderMissionSheetPanels();

  const container = document.getElementById('approve-cards-container');
  if (!container) return;

  if (currentApproveSubTab === 'swap') {
    const pendingSwaps = (currentSwaps || []).filter(s => s.status === 'pending');
    if (pendingSwaps.length === 0) {
      mount(container, el('div', { className: 'empty-card' }, 'Hiện chưa có đơn đổi ca nào đang chờ duyệt.'));
      return;
    }
    const cards = pendingSwaps.map((s) =>
      el('article', { className: 'dispatch-card', dataset: { reqId: s.id } },
        el('div', { className: 'dispatch-head' },
          el('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', minWidth: '0', flex: '1' } },
            el('div', { className: 'avatar-initials-circle' }, getSportPassInitials(s.fromName)),
            el('div', { style: { minWidth: '0', flex: '1' } },
              el('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
                el('span', { style: { fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' } }, s.fromName),
                s.fromClass ? el('span', { style: { fontSize: '10.5px', background: 'var(--surface-chip)', color: 'var(--text-secondary)', padding: '1px 6px', borderRadius: '5px', fontWeight: '600' } }, s.fromClass) : null
              ),
              el('div', { className: 'font-mono', style: { fontSize: '11px', color: 'var(--text-muted)' } }, `MSSV: ${s.fromId}`)
            )
          ),
          el('span', { className: 'role-pill-badge' }, 'Đổi ca')
        ),
        el('div', { className: 'dispatch-info-box' },
          el('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '8px' } },
            el('span', { style: { color: 'var(--text-muted)' } }, 'Ca hiện tại:'),
            el('strong', { style: { color: 'var(--text-primary)', textAlign: 'right' } }, s.currentShift || s.taskId)
          ),
          el('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '8px' } },
            el('span', { style: { color: 'var(--text-muted)' } }, s.type === 'transfer' ? 'Đề xuất chuyển:' : 'Hoán đổi với:'),
            el('strong', { style: { color: s.type === 'transfer' ? '#0369a1' : '#047857', textAlign: 'right' } }, s.type === 'transfer' ? s.toName : `${s.toName} ✓`)
          ),
          el('div', { style: { borderTop: '1px solid var(--border-subtle)', paddingTop: '5px', marginTop: '3px', color: 'var(--text-secondary)' } },
            el('strong', {}, 'Lý do: '),
            s.reason
          )
        ),
        el('div', { className: 'dispatch-btn-pair' },
          el('button', { type: 'button', className: 'btn-card-reject', onClick: (ev) => animateAndResolveSwap(ev, s.id, false) }, 'Từ chối'),
          el('button', { type: 'button', className: 'btn-card-approve water-ripple-target', onClick: (ev) => animateAndResolveSwap(ev, s.id, true) }, '✓ Phê duyệt')
        )
      )
    );
    mount(container, cards);
    return;
  }

  if (currentApproveSubTab === 'leave') {
    const pendingLeaves = (currentLeaves || []).filter(l => l.status === 'pending');
    if (pendingLeaves.length === 0) {
      mount(container, el('div', { className: 'empty-card' }, 'Hiện chưa có yêu cầu xin vắng hoặc chi viện khẩn nào.'));
      return;
    }
    const cards = pendingLeaves.map((l) =>
      el('article', { className: `dispatch-card${l.urgent ? ' urgent' : ''}`, dataset: { reqId: l.id } },
        el('div', { className: 'dispatch-head' },
          el('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', minWidth: '0', flex: '1' } },
            el('div', { className: 'avatar-initials-circle amber' }, getSportPassInitials(l.memberName)),
            el('div', { style: { minWidth: '0', flex: '1' } },
              el('div', { style: { fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' } }, `${l.memberName}`),
              el('div', { style: { fontSize: '11px', color: 'var(--text-muted)' } }, l.timeLabel || `Ca ${l.taskId} • ${l.memberId}`)
            )
          ),
          el('span', { style: { fontSize: '10.5px', fontWeight: '700', color: '#92400e', background: '#fef3c7', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: '9999px', whiteSpace: 'nowrap' } }, l.urgent ? '• Chi viện khẩn' : 'Xin vắng')
        ),
        el('div', { className: 'dispatch-info-box' },
          el('span', { style: { color: 'var(--text-primary)', lineHeight: '1.45' } }, l.reason)
        ),
        el('div', { className: 'dispatch-btn-pair' },
          el('button', { type: 'button', className: 'btn-card-reject', onClick: (ev) => animateAndResolveLeave(ev, l.id, false) }, 'Từ chối'),
          el('button', { type: 'button', className: 'btn-card-approve water-ripple-target', onClick: (ev) => animateAndResolveLeave(ev, l.id, true) }, '✓ Phê duyệt')
        )
      )
    );
    mount(container, cards);
    return;
  }

  // Subtab: Ca trực quản trị
  const list = deduplicateTasks(currentTasks || []);
  currentTasks = list;
  if (list.length === 0) {
    mount(container, el('div', { className: 'empty-card' }, 'Chưa có ca trực nào.'));
    return;
  }

  const uid = currentUser ? currentUser.id : '';
  const isAdmin = Boolean(currentUser && currentUser.isAdmin);
  const shiftCards = list.map((t) => {
    const occupied = Array.from(new Set([...(t.joinedMembers || []), ...(t.assignedMembers || [])]));
    const quota = Number(t.quota) || 4;
    const progress = Math.min(1, occupied.length / quota);
    const isMine = uid && occupied.includes(uid);
    const isChecked = uid && (t.checkedInMembers || []).includes(uid);

    const actions = [];
    if (isChecked) actions.push(el('button', { type: 'button', className: 'btn-mini btn-mini-emerald', disabled: true }, 'Đã điểm danh'));
    else if (isMine) actions.push(el('button', { type: 'button', className: 'btn-mini btn-mini-sky', onClick: () => { closeApproveShiftModal(); setTimeout(openQrModal, 240); } }, 'Mã QR vào ca'));
    else if (occupied.length < quota) actions.push(el('button', { type: 'button', className: 'btn-mini btn-mini-sky', onClick: () => handleClaimTask(t.id) }, 'Nhận ca trực'));

    if (isAdmin) {
      actions.push(
        el('button', { type: 'button', className: 'btn-mini btn-mini-soft', onClick: () => runSmartRotationForTask(t.id) }, 'Xoay tua'),
        el('button', { type: 'button', className: 'btn-mini btn-mini-soft', onClick: () => { closeApproveShiftModal(); setTimeout(() => openCreateShiftModal(t.id), 240); } }, 'Sửa'),
        el('button', { type: 'button', className: 'btn-mini btn-mini-rose', onClick: () => deleteShiftDirect(t.id) }, 'Xóa')
      );
    }

    return el('article', { className: 'dispatch-card' },
      el('div', { className: 'font-mono', style: { fontSize: '10.5px', color: '#0369a1', fontWeight: '600' } }, `${t.id} · ${occupied.length}/${quota} nhân sự`),
      el('div', { style: { fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' } }, t.title),
      el('div', { className: 'shift-progress-track' }, el('div', { className: 'shift-progress-fill', style: { '--progress': String(progress) } })),
      el('div', { style: { fontSize: '12px', color: 'var(--text-secondary)' } }, `${t.location} · ${t.time}`),
      el('div', { className: 'mini-action-grid' }, actions)
    );
  });
  mount(container, shiftCards);
}

function animateAndResolveSwap(ev, swapId, isApproved) {
  const card = ev && ev.currentTarget ? ev.currentTarget.closest('.dispatch-card') : null;
  if (card) card.classList.add('dismissing');
  setTimeout(() => resolveSwapAction(swapId, isApproved), card ? 200 : 0);
}

function animateAndResolveLeave(ev, leaveId, isApproved) {
  const card = ev && ev.currentTarget ? ev.currentTarget.closest('.dispatch-card') : null;
  if (card) card.classList.add('dismissing');
  setTimeout(() => resolveLeaveAction(leaveId, isApproved), card ? 200 : 0);
}

function resolveSwapAction(swapId, isApproved) {
  const swap = (currentSwaps || []).find(s => s.id === swapId);
  if (!swap) return;
  swap.status = isApproved ? 'approved' : 'rejected';
  if (isApproved) {
    const task = (currentTasks || []).find(t => t.id === swap.taskId);
    if (task) {
      task.joinedMembers = (task.joinedMembers || []).filter(id => id !== swap.fromId);
      if (swap.toId && !swap.toId.startsWith('CA_') && !task.joinedMembers.includes(swap.toId)) {
        task.joinedMembers.push(swap.toId);
      }
    }
  }
  saveLocalState();
  renderDispatchHub();
  renderNotificationsModalList();
  showToast(isApproved ? `Đã phê duyệt đổi ca cho ${swap.fromName}.` : `Đã từ chối đơn của ${swap.fromName}.`);
}

function resolveLeaveAction(leaveId, isApproved) {
  const leave = (currentLeaves || []).find(l => l.id === leaveId);
  if (!leave) return;
  leave.status = isApproved ? 'approved' : 'rejected';

  if (isApproved) {
    const task = (currentTasks || []).find(t => t.id === leave.taskId);
    if (task && Array.isArray(task.checkedInMembers) && task.checkedInMembers.includes(leave.memberId)) {
      task.checkedInMembers = task.checkedInMembers.filter(id => id !== leave.memberId);
      for (const m of (membersDirectory || [])) {
        if (m.id === leave.memberId) {
          m.soCaHoanThanh = Math.max(0, (Number(m.soCaHoanThanh) || 0) - 1);
          m.soCa = m.soCaHoanThanh;
        }
      }
      if (currentUser && currentUser.id === leave.memberId) {
        currentUser.soCaHoanThanh = Math.max(0, (Number(currentUser.soCaHoanThanh) || 0) - 1);
        currentUser.soCa = currentUser.soCaHoanThanh;
        persistUserSession(currentUser);
        renderProfileData();
      }
    }
    if (navigator.onLine) {
      fetch(`${GAS_API_URL}?action=withdrawTask&taskId=${encodeURIComponent(leave.taskId)}&memberId=${encodeURIComponent(leave.memberId)}&reason=${encodeURIComponent(leave.reason || '')}`)
        .catch(() => enqueueOfflineMutation('WITHDRAW_TASK', { taskId: leave.taskId, memberId: leave.memberId, reason: leave.reason }));
    } else {
      enqueueOfflineMutation('WITHDRAW_TASK', { taskId: leave.taskId, memberId: leave.memberId, reason: leave.reason });
    }
  }

  saveLocalState();
  renderDispatchHub();
  renderNotificationsModalList();
  showToast(isApproved ? `Đã phê duyệt yêu cầu của ${leave.memberName}.` : 'Đã từ chối yêu cầu.');
}

function approveAllPendingRequests() {
  const pendingSwaps = (currentSwaps || []).filter(s => s.status === 'pending');
  const pendingLeaves = (currentLeaves || []).filter(l => l.status === 'pending');
  const count = pendingSwaps.length + pendingLeaves.length;
  if (count === 0) return;

  pendingSwaps.forEach(s => { s.status = 'approved'; });
  pendingLeaves.forEach(l => { l.status = 'approved'; });

  saveLocalState();
  renderDispatchHub();
  renderNotificationsModalList();
  closeApproveShiftModal();

  setTimeout(() => {
    openSuccessCelebration({
      kicker: '• SPORTPASS PRO DISPATCH',
      title: `Đã phê duyệt ${count} yêu cầu điều động!`,
      descNodes: ['Các ca trực đã được cập nhật lịch trình và gửi thông báo tự động đến các thành viên liên quan.']
    });
  }, 240);
}

function handleClaimTask(taskId) {
  if (!currentUser) return;
  const task = (currentTasks || []).find(t => t.id === taskId);
  if (!task) return;
  task.joinedMembers = Array.isArray(task.joinedMembers) ? task.joinedMembers : [];
  if (!task.joinedMembers.includes(currentUser.id)) {
    task.joinedMembers.push(currentUser.id);
    saveLocalState();
    renderDispatchHub();
    if (navigator.onLine) {
      fetch(`${GAS_API_URL}?action=claimTask&taskId=${encodeURIComponent(taskId)}&memberId=${encodeURIComponent(currentUser.id)}&waitlist=false`)
        .catch(() => enqueueOfflineMutation('CLAIM_TASK', { taskId, memberId: currentUser.id, waitlist: false }));
    } else {
      enqueueOfflineMutation('CLAIM_TASK', { taskId, memberId: currentUser.id, waitlist: false });
    }
    showToast(`Đã đăng ký ca: ${task.title}`);
  }
}

function deleteShiftDirect(taskId) {
  saveDeletedTaskId(taskId);
  currentTasks = (currentTasks || []).filter(t => t.id !== taskId);
  saveLocalState();
  renderDispatchHub();
  renderNotificationsModalList();
  if (navigator.onLine) {
    fetch(`${GAS_API_URL}?action=deleteTask&taskId=${encodeURIComponent(taskId)}`)
      .catch(() => enqueueOfflineMutation('DELETE_TASK', { taskId }));
  } else {
    enqueueOfflineMutation('DELETE_TASK', { taskId });
  }
  showToast('Đã xóa ca trực thành công.');
}

function populateScanTaskSelector() {
  const sel = document.getElementById('selScanTaskId');
  if (!sel) return;
  const opts = (currentTasks || []).map(t => el('option', { value: t.id }, `${t.id} — ${t.title}`));
  mount(sel, opts);
}

// ==================== MEMBER TASK MISSION MODAL ("ĐĂNG KÝ CA" & "XIN ĐỔI CA") ====================
function openTaskMissionModal(tabName = 'shifts') {
  switchMissionTab(tabName);
  renderMissionSheetPanels();
  openSheetDialog('task-mission-modal');
}

function closeTaskMissionModal() {
  closeSheetDialog('task-mission-modal');
}

function switchMissionTab(tabName) {
  currentMissionTab = tabName === 'swap' ? 'swap' : 'shifts';
  const b0 = document.getElementById('mission-tab-shifts');
  const b1 = document.getElementById('mission-tab-swap');
  const p0 = document.getElementById('mission-panel-shifts');
  const p1 = document.getElementById('mission-panel-swap');
  if (b0) b0.classList.toggle('active', currentMissionTab === 'shifts');
  if (b1) b1.classList.toggle('active', currentMissionTab === 'swap');
  if (p0) p0.classList.toggle('hidden', currentMissionTab !== 'shifts');
  if (p1) p1.classList.toggle('hidden', currentMissionTab !== 'swap');
}

function renderMissionSheetPanels() {
  const listBox = document.getElementById('mission-panel-shifts');
  if (listBox) {
    const uid = currentUser ? currentUser.id : '';
    const cards = (currentTasks || []).map((t) => {
      const occupied = Array.from(new Set([...(t.joinedMembers || []), ...(t.assignedMembers || [])]));
      const isMine = uid && occupied.includes(uid);
      return el('div', { className: 'dispatch-card' },
        el('div', { style: { fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' } }, t.title),
        el('div', { style: { fontSize: '12px', color: 'var(--text-secondary)' } }, `${t.location} · ${t.time} (${occupied.length}/${t.quota || 4})`),
        isMine
          ? el('span', { className: 'ready-badge-pill', style: { alignSelf: 'flex-start' } }, 'Bạn đã đăng ký')
          : el('button', { type: 'button', className: 'btn-card-approve', onClick: () => handleClaimTask(t.id) }, 'Đăng ký nhận ca này')
      );
    });
    mount(listBox, cards.length ? cards : el('div', { className: 'empty-card' }, 'Chưa có ca trực khả dụng.'));
  }

  const selTask = document.getElementById('selMissionTaskId');
  if (selTask) {
    mount(selTask, (currentTasks || []).map(t => el('option', { value: t.id }, `${t.title} (${t.time})`)));
  }

  const selMem = document.getElementById('selMissionTargetMember');
  if (selMem) {
    const uid = currentUser ? currentUser.id : '';
    mount(selMem, (membersDirectory || []).filter(m => m.id !== uid).slice(0, 60).map(m => el('option', { value: m.id }, `${m.hoTen} (${m.id})`)));
  }
}

function submitMemberSwapRequest() {
  if (!currentUser) return;
  const taskId = document.getElementById('selMissionTaskId')?.value || 'TASK_01';
  const toId = document.getElementById('selMissionTargetMember')?.value || '';
  const target = (membersDirectory || []).find(m => m.id === toId);
  const task = (currentTasks || []).find(t => t.id === taskId);
  const reason = (document.getElementById('iptMissionReason')?.value || '').trim() || 'Đổi lịch cá nhân';

  currentSwaps.unshift({
    id: 'SWAP_' + Date.now(),
    taskId,
    fromId: currentUser.id,
    fromName: currentUser.hoTen,
    fromClass: currentUser.lop,
    toId,
    toName: target ? target.hoTen : toId,
    currentShift: task ? `${task.location} (${task.time})` : taskId,
    reason,
    type: 'swap',
    status: 'pending'
  });

  saveLocalState();
  renderDispatchHub();
  closeTaskMissionModal();
  showToast('Đã gửi yêu cầu đổi ca tới Ban Điều Phối!');
}

function submitMemberLeaveRequest() {
  if (!currentUser) return;
  const taskId = document.getElementById('selMissionTaskId')?.value || 'TASK_01';
  const reason = (document.getElementById('iptMissionReason')?.value || '').trim() || 'Xin vắng có lý do';

  currentLeaves.unshift({
    id: 'LEAVE_' + Date.now(),
    taskId,
    memberId: currentUser.id,
    memberName: currentUser.hoTen,
    timeLabel: `Ca ${taskId}`,
    reason,
    urgent: false,
    status: 'pending'
  });

  saveLocalState();
  renderDispatchHub();
  closeTaskMissionModal();
  showToast('Đã gửi đơn xin rút ca chờ duyệt!');
}

function toggleMemberRole(memberId, roleType) {
  if (memberId === 'DMC0806') {
    showToast('Quyền Quản trị gốc DMC0806 được bảo vệ vĩnh viễn.');
    return;
  }
  const target = (membersDirectory || []).find(m => m.id === memberId);
  if (!target) return;
  const nextAdmin = roleType === 'admin' ? !target.isAdmin : Boolean(target.isAdmin);
  const nextLeader = roleType === 'admin' ? (nextAdmin ? true : Boolean(target.isShiftLeader)) : !target.isShiftLeader;

  for (const m of (membersDirectory || [])) {
    if (m.id === memberId) {
      m.isAdmin = nextAdmin;
      m.isShiftLeader = nextLeader;
    }
  }
  const custom = getCustomAdminRoles();
  custom[memberId] = { isAdmin: nextAdmin, isShiftLeader: nextLeader };
  saveCustomAdminRoles(custom);

  const adminActorId = currentUser ? currentUser.id : 'DMC0806';
  const url = `${GAS_API_URL}?action=updateMemberRole&memberId=${encodeURIComponent(memberId)}&isAdmin=${nextAdmin}&isShiftLeader=${nextLeader}&adminActorId=${encodeURIComponent(adminActorId)}`;
  if (navigator.onLine) {
    fetch(url).catch(() => enqueueOfflineMutation('UPDATE_ROLE', { memberId, isAdmin: nextAdmin, isShiftLeader: nextLeader, adminActorId }));
  } else {
    enqueueOfflineMutation('UPDATE_ROLE', { memberId, isAdmin: nextAdmin, isShiftLeader: nextLeader, adminActorId });
  }

  renderMembersModalList();
  showToast(`Đã cập nhật quyền cho ${target.hoTen}.`);
}

function adjustMemberShiftCount(memberId, delta) {
  for (const m of (membersDirectory || [])) {
    if (m.id === memberId) {
      const next = Math.max(0, (Number(m.soCaHoanThanh ?? m.soCa ?? 0)) + delta);
      m.soCaHoanThanh = next;
      m.soCa = next;
    }
  }
  if (currentUser && currentUser.id === memberId) {
    currentUser.soCaHoanThanh = Math.max(0, (Number(currentUser.soCaHoanThanh ?? currentUser.soCa ?? 0)) + delta);
    currentUser.soCa = currentUser.soCaHoanThanh;
    persistUserSession(currentUser);
    renderProfileData();
  }
  saveLocalState();
  renderMembersModalList();
  showToast(`Đã điều chỉnh ${delta > 0 ? '+1' : '-1'} ca cho ${memberId}.`);
}
