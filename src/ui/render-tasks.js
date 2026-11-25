// SportPass V8.6 — Create Shift, Approve Dispatch, Member Shifts/Swaps, QR Check-in & Strict Admin RBAC

const AREA_PRESETS = [
  { id: 'svd', label: 'SVĐ Trung Tâm' },
  { id: 'ntd', label: 'Nhà Thi Đấu B' },
  { id: 'sanuhd', label: 'Sân Thể Thao UHD' }
];

const DEPT_DOT_COLORS = ['#0284c7', '#10b981', '#e11d48', '#6366f1', '#f59e0b', '#0d9488', '#06b6d4'];

let currentDeptQuotaDraft = [
  { dept: 'Ban Nhân Sự', color: '#0284c7', count: 2 },
  { dept: 'Ban Bóng Chuyền', color: '#10b981', count: 1 },
  { dept: 'Ban Truyền Thông', color: '#e11d48', count: 1 }
];

function replayTabEntrance(elNode) {
  if (!elNode) return;
  elNode.classList.remove('tab-pane-anim');
  requestAnimationFrame(() => elNode.classList.add('tab-pane-anim'));
}

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

// ==================== CREATE SHIFT MODAL ====================
function syncPresetTimeButtons(timeStr) {
  const norm = String(timeStr || '').trim();
  document.querySelectorAll('#preset-time-container .preset-time-btn').forEach((btn) => {
    btn.classList.toggle('active', String(btn.dataset.time || '').trim() === norm);
  });
}

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
        el('select', {
          className: 'dept-inline-select',
          'aria-label': 'Chọn ban chuyên môn',
          value: row.dept,
          onChange: (ev) => {
            currentDeptQuotaDraft[idx].dept = ev.target.value;
          }
        }, ALL_DEPARTMENTS.map(d => el('option', { value: d, selected: d === row.dept }, d)))
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

function populateTaskLeaderSelector(preferredId) {
  const sel = document.getElementById('selTaskLeader');
  const candidates = (membersDirectory || []).filter(m => m && (m.isAdmin || m.isShiftLeader));
  if (candidates.length === 0) return;
  const fallbackId = currentUser ? currentUser.id : candidates[0].id;
  selectedShiftLeaderId = candidates.some(m => m.id === preferredId) ? preferredId : fallbackId;
  if (sel) {
    mount(sel, candidates.map(m => el('option', { value: m.id, selected: m.id === selectedShiftLeaderId }, `${m.hoTen} (${m.id})`)));
    sel.value = selectedShiftLeaderId;
  }
  updateSelectedLeaderCard();
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
  safeSetText('leaderPickRole', `${leader.chucVu || 'Trưởng ca'} • ${leader.boMon || 'Ban Điều Hành'}`);
}

function setTaskCategoryUI(category) {
  const cat = category === 'activity' ? 'activity' : 'shift';
  safeSetValue('iptTaskCategory', cat);
  const bShift = document.getElementById('task-cat-shift');
  const bAct = document.getElementById('task-cat-activity');
  if (bShift) bShift.classList.toggle('active', cat === 'shift');
  if (bAct) bAct.classList.toggle('active', cat === 'activity');
}

function openCreateShiftModal(taskId = null) {
  if (!currentUser || !currentUser.isAdmin) {
    showToast('Chỉ Admin mới có quyền tạo hoặc chỉnh sửa ca trực.');
    return;
  }
  editingTaskId = taskId;
  const existing = taskId ? (currentTasks || []).find(t => t.id === taskId) : null;
  safeSetText('create-shift-title', existing ? 'Chỉnh sửa ca trực' : 'Tạo ca trực mới');
  safeSetText('btnSubmitTask', existing ? '✓ Lưu cập nhật' : '✓ Tạo ca trực');
  safeSetValue('iptTaskTitle', existing ? existing.title : '');
  setTaskCategoryUI(existing && existing.category === 'activity' ? 'activity' : 'shift');

  const loc = existing ? existing.location : 'SVĐ Trung Tâm';
  safeSetValue('iptTaskLocation', loc);
  renderAreaPresetCards(loc);

  const dateVal = existing && existing.date ? existing.date : formatTodayVN(1);
  safeSetValue('iptTaskDate', dateVal);

  const rawTime = existing
    ? (existing.timeRange || String(existing.time || '13:30 - 17:30').replace(/\s*\([^)]*\)\s*$/, '').trim())
    : '13:30 - 17:30';
  safeSetValue('iptTaskTime', rawTime);
  syncPresetTimeButtons(rawTime);

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

  const preferredLeader = (existing && existing.leaderId) ? existing.leaderId : (currentUser ? currentUser.id : 'DMC0806');
  populateTaskLeaderSelector(preferredLeader);
  openSheetDialog('create-shift-modal');
}

function closeCreateShiftModal() {
  editingTaskId = null;
  return closeSheetDialog('create-shift-modal');
}

async function submitCreateShiftAction() {
  if (!currentUser || !currentUser.isAdmin) return;
  const title = (document.getElementById('iptTaskTitle')?.value || '').trim();
  const category = (document.getElementById('iptTaskCategory')?.value === 'activity') ? 'activity' : 'shift';
  const location = (document.getElementById('iptTaskLocation')?.value || '').trim() || 'SVĐ Trung Tâm';
  const dateStr = (document.getElementById('iptTaskDate')?.value || '').trim();
  const timeRange = (document.getElementById('iptTaskTime')?.value || '').trim().replace(/\s*\([^)]*\)\s*$/, '') || '13:30 - 17:30';
  const timeFull = dateStr ? `${timeRange} (${dateStr})` : timeRange;
  const quota = Math.max(1, Number(document.getElementById('iptTaskQuota')?.value) || 4);
  const notes = (document.getElementById('iptTaskNotes')?.value || '').trim();
  const wasEditing = Boolean(editingTaskId);

  if (!title) {
    showToast('Vui lòng nhập tên ca trực.');
    document.getElementById('iptTaskTitle')?.focus();
    return;
  }

  const departmentQuotas = {};
  for (const row of currentDeptQuotaDraft) {
    if (row.dept && Number(row.count) > 0) {
      departmentQuotas[row.dept] = (departmentQuotas[row.dept] || 0) + Number(row.count);
    }
  }

  let savedTask = null;
  if (editingTaskId) {
    const existingTask = (currentTasks || []).find(t => t.id === editingTaskId);
    if (existingTask) {
      existingTask.title = title;
      existingTask.category = category;
      existingTask.location = location;
      existingTask.timeRange = timeRange;
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
    savedTask = normalizeTask({
      id: 'TASK_' + Date.now(),
      title,
      category,
      location,
      timeRange,
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
    });
    currentTasks.unshift(savedTask);
  }
  currentScanTargetTaskId = savedTask.id;

  saveLocalState();
  syncTaskToBackend(savedTask);
  renderDispatchHub();
  renderNotificationsModalList();
  await closeCreateShiftModal();

  openSuccessCelebration({
    kicker: '• SPORTPASS PRO SCHEDULE',
    title: wasEditing ? 'Cập nhật ca trực thành công!' : 'Tạo ca trực mới thành công!',
    descNodes: [
      'Ca trực ',
      el('strong', {}, title),
      ' đã được lên lịch tại ',
      el('strong', {}, location),
      ' và phân bổ cho ',
      el('strong', {}, `${quota} thành viên`),
      '.'
    ]
  });
}

// ==================== APPROVE DISPATCH MODAL (ADMIN ONLY) ====================
function openApproveShiftModal(tabName = 'swap') {
  if (!currentUser || !currentUser.isAdmin) {
    openTaskMissionModal('shifts');
    return;
  }
  switchApproveTab(tabName);
  openSheetDialog('approve-shift-modal');
}

function closeApproveShiftModal() {
  return closeSheetDialog('approve-shift-modal');
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

  if (!isScanner) {
    stopQrCameraStream();
    replayTabEntrance(cardsEl);
  } else {
    populateScanTaskSelector();
    renderScannerCheckedInList();
    replayTabEntrance(scanEl);
  }

  renderDispatchHub();
}

function renderDispatchHub() {
  updatePendingBadges();
  populateScanTaskSelector();
  renderMissionSheetPanels();
  updateQrPassDisplay();

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
    const { occupied, quota, isMine, isChecked } = getTaskOccupancy(t, uid);
    const progress = Math.min(1, occupied.length / quota);
    const catLabel = t.category === 'activity' ? 'Ca sinh hoạt' : 'Ca trực';

    const actions = [];
    if (isChecked) actions.push(el('button', { type: 'button', className: 'btn-mini btn-mini-emerald', disabled: true }, 'Đã điểm danh'));
    else if (isMine) actions.push(el('button', { type: 'button', className: 'btn-mini btn-mini-sky', onClick: () => switchSheetDialog('approve-shift-modal', 'qr-modal', () => { activeQrTaskId = t.id; startQrCountdown(); }) }, 'Mã QR vào ca'));
    else if (occupied.length < quota) actions.push(el('button', { type: 'button', className: 'btn-mini btn-mini-sky', onClick: () => handleClaimTask(t.id, false) }, 'Nhận ca trực'));

    if (isAdmin) {
      actions.push(
        el('button', { type: 'button', className: 'btn-mini btn-mini-soft', onClick: () => runSmartRotationForTask(t.id) }, 'Xoay tua'),
        el('button', { type: 'button', className: 'btn-mini btn-mini-soft', onClick: () => switchSheetDialog('approve-shift-modal', 'create-shift-modal', () => openCreateShiftModal(t.id)) }, 'Sửa'),
        el('button', { type: 'button', className: 'btn-mini btn-mini-rose', onClick: () => deleteShiftDirect(t.id) }, 'Xóa')
      );
    }

    return el('article', { className: 'dispatch-card' },
      el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' } },
        el('span', { className: 'font-mono', style: { fontSize: '10.5px', color: '#0369a1', fontWeight: '600' } }, `${t.id} · ${occupied.length}/${quota} nhân sự`),
        el('span', { className: t.category === 'activity' ? 'ready-badge-pill' : 'role-pill-badge' }, catLabel)
      ),
      el('div', { style: { fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' } }, t.title),
      el('div', { className: 'shift-progress-track' }, el('div', { className: 'shift-progress-fill', style: { '--progress': String(progress) } })),
      el('div', { style: { fontSize: '12px', color: 'var(--text-secondary)' } }, `${t.location} · ${t.time}`),
      el('div', { className: 'mini-action-grid' }, actions)
    );
  });
  mount(container, shiftCards);
}

function applySwapApproval(swap) {
  if (!swap) return;
  swap.status = 'approved';
  const task = (currentTasks || []).find(t => t.id === swap.taskId);
  if (task) {
    task.joinedMembers = (task.joinedMembers || []).filter(id => id !== swap.fromId);
    task.assignedMembers = (task.assignedMembers || []).filter(id => id !== swap.fromId);
    task.waitlist = Array.isArray(task.waitlist) ? task.waitlist : [];
    if (swap.toId && !swap.toId.startsWith('CA_')) {
      const targetExists = (membersDirectory || []).some(m => m && m.id === swap.toId);
      if (targetExists && !task.joinedMembers.includes(swap.toId) && !task.assignedMembers.includes(swap.toId)) {
        task.joinedMembers.push(swap.toId);
        task.waitlist = task.waitlist.filter(id => id !== swap.toId);
      }
    } else {
      const { occupied, quota } = getTaskOccupancy(task);
      if (task.waitlist.length > 0 && occupied.length < quota) {
        const promoted = task.waitlist.shift();
        if (promoted && !task.joinedMembers.includes(promoted)) task.joinedMembers.push(promoted);
      }
    }
    syncTaskToBackend(task);
  }
}

function applyLeaveApproval(leave) {
  if (!leave) return;
  leave.status = 'approved';
  const task = (currentTasks || []).find(t => t.id === leave.taskId);
  if (task) {
    task.joinedMembers = (task.joinedMembers || []).filter(id => id !== leave.memberId);
    task.assignedMembers = (task.assignedMembers || []).filter(id => id !== leave.memberId);
    task.waitlist = (task.waitlist || []).filter(id => id !== leave.memberId);

    if (Array.isArray(task.checkedInMembers) && task.checkedInMembers.includes(leave.memberId)) {
      task.checkedInMembers = task.checkedInMembers.filter(id => id !== leave.memberId);
      adjustMemberCounter(leave.memberId, task.category === 'activity' ? 'activity' : 'shift', -1);
    }

    const { occupied, quota } = getTaskOccupancy(task);
    if (task.waitlist.length > 0 && occupied.length < quota) {
      const promoted = task.waitlist.shift();
      if (promoted && !task.joinedMembers.includes(promoted)) {
        task.joinedMembers.push(promoted);
      }
    }
    syncTaskToBackend(task);
  }

  dispatchBackendMutation('WITHDRAW_TASK', {
    taskId: leave.taskId,
    memberId: leave.memberId,
    reason: leave.reason || ''
  });
}

function animateAndResolveSwap(ev, swapId, isApproved) {
  if (!currentUser || !currentUser.isAdmin) return;
  const card = ev && ev.currentTarget ? ev.currentTarget.closest('.dispatch-card') : null;
  if (card) card.classList.add('dismissing');
  setTimeout(() => resolveSwapAction(swapId, isApproved), card ? 200 : 0);
}

function animateAndResolveLeave(ev, leaveId, isApproved) {
  if (!currentUser || !currentUser.isAdmin) return;
  const card = ev && ev.currentTarget ? ev.currentTarget.closest('.dispatch-card') : null;
  if (card) card.classList.add('dismissing');
  setTimeout(() => resolveLeaveAction(leaveId, isApproved), card ? 200 : 0);
}

function resolveSwapAction(swapId, isApproved) {
  if (!currentUser || !currentUser.isAdmin) return;
  const swap = (currentSwaps || []).find(s => s.id === swapId);
  if (!swap) return;
  if (isApproved) applySwapApproval(swap);
  else swap.status = 'rejected';
  saveLocalState();
  renderProfileData();
  renderDispatchHub();
  renderNotificationsModalList();
  showToast(isApproved ? `Đã phê duyệt đổi ca cho ${swap.fromName}.` : `Đã từ chối đơn của ${swap.fromName}.`);
}

function resolveLeaveAction(leaveId, isApproved) {
  if (!currentUser || !currentUser.isAdmin) return;
  const leave = (currentLeaves || []).find(l => l.id === leaveId);
  if (!leave) return;
  if (isApproved) applyLeaveApproval(leave);
  else leave.status = 'rejected';
  saveLocalState();
  renderProfileData();
  renderDispatchHub();
  renderNotificationsModalList();
  showToast(isApproved ? `Đã phê duyệt yêu cầu của ${leave.memberName}.` : 'Đã từ chối yêu cầu.');
}

async function approveAllPendingRequests() {
  if (!currentUser || !currentUser.isAdmin) return;
  const pendingSwaps = (currentSwaps || []).filter(s => s.status === 'pending');
  const pendingLeaves = (currentLeaves || []).filter(l => l.status === 'pending');
  const count = pendingSwaps.length + pendingLeaves.length;
  if (count === 0) return;

  pendingSwaps.forEach(s => applySwapApproval(s));
  pendingLeaves.forEach(l => applyLeaveApproval(l));

  saveLocalState();
  renderProfileData();
  renderDispatchHub();
  renderNotificationsModalList();
  await closeApproveShiftModal();

  openSuccessCelebration({
    kicker: '• SPORTPASS PRO DISPATCH',
    title: `Đã phê duyệt ${count} yêu cầu điều động!`,
    descNodes: ['Các ca trực đã được cập nhật lịch trình và đồng bộ tự động tới các thành viên liên quan.']
  });
}

function handleClaimTask(taskId, asWaitlist = false) {
  if (!currentUser) return;
  const task = (currentTasks || []).find(t => t.id === taskId);
  if (!task) return;
  const uid = currentUser.id;
  task.joinedMembers = Array.isArray(task.joinedMembers) ? task.joinedMembers : [];
  task.assignedMembers = Array.isArray(task.assignedMembers) ? task.assignedMembers : [];
  task.waitlist = Array.isArray(task.waitlist) ? task.waitlist : [];

  if (task.joinedMembers.includes(uid) || task.assignedMembers.includes(uid)) {
    showToast('Bạn đã tham gia ca trực này rồi.');
    return;
  }

  const occupiedCount = new Set([...task.joinedMembers, ...task.assignedMembers]).size;
  const quota = Number(task.quota) || 4;
  const needsWaitlist = Boolean(asWaitlist) || occupiedCount >= quota;

  if (needsWaitlist) {
    if (task.waitlist.includes(uid)) {
      showToast('Bạn đang ở hàng chờ dự bị của ca này.');
      return;
    }
    task.waitlist.push(uid);
    saveLocalState();
    renderDispatchHub();
    renderNotificationsModalList();
    dispatchBackendMutation('CLAIM_TASK', { taskId, memberId: uid, waitlist: true });
    showToast(`Đã đăng ký dự bị ca: ${task.title}`);
    return;
  }

  if (typeof hasShiftTimeConflict === 'function' && hasShiftTimeConflict(uid, task)) {
    showToast('Cảnh báo: Khung giờ ca này bị trùng với một ca bạn đã đăng ký.');
    return;
  }

  task.waitlist = task.waitlist.filter(id => id !== uid);
  task.joinedMembers.push(uid);
  saveLocalState();
  renderProfileData();
  renderDispatchHub();
  renderNotificationsModalList();
  dispatchBackendMutation('CLAIM_TASK', { taskId, memberId: uid, waitlist: false });
  showToast(`Đã đăng ký ca: ${task.title}`);
}

function withdrawFromWaitlist(taskId) {
  if (!currentUser) return;
  const task = (currentTasks || []).find(t => t.id === taskId);
  if (!task) return;
  task.waitlist = (task.waitlist || []).filter(id => id !== currentUser.id);
  saveLocalState();
  renderDispatchHub();
  dispatchBackendMutation('WITHDRAW_TASK', { taskId, memberId: currentUser.id, reason: 'Rút khỏi danh sách dự bị' });
  showToast('Đã rút khỏi danh sách dự bị.');
}

function deleteShiftDirect(taskId) {
  if (!currentUser || !currentUser.isAdmin) return;
  saveDeletedTaskId(taskId);
  currentTasks = (currentTasks || []).filter(t => t.id !== taskId);
  saveLocalState();
  renderProfileData();
  renderDispatchHub();
  renderNotificationsModalList();
  dispatchBackendMutation('DELETE_TASK', { taskId });
  showToast('Đã xóa ca trực thành công.');
}

function populateScanTaskSelector() {
  const sel = document.getElementById('selScanTaskId');
  if (!sel) return;
  const preferred = currentScanTargetTaskId || sel.value;
  const activeTasks = deduplicateTasks(currentTasks || []);
  const opts = activeTasks.map(t => el('option', { value: t.id }, `${t.id} — ${t.title}`));
  mount(sel, opts);
  if (preferred && activeTasks.some(t => t.id === preferred)) {
    sel.value = preferred;
  } else if (sel.options.length > 0) {
    currentScanTargetTaskId = sel.options[0].value;
  }
}

// ==================== MEMBER TASK MISSION MODAL ====================
function openTaskMissionModal(tabName = 'shifts', preselectTaskId = null) {
  switchMissionTab(tabName);
  renderMissionSheetPanels(preselectTaskId);
  openSheetDialog('task-mission-modal');
}

function closeTaskMissionModal() {
  return closeSheetDialog('task-mission-modal');
}

function switchMissionTab(tabName) {
  currentMissionTab = tabName === 'swap' ? 'swap' : 'shifts';
  const b0 = document.getElementById('mission-tab-shifts');
  const b1 = document.getElementById('mission-tab-swap');
  const p0 = document.getElementById('mission-panel-shifts');
  const p1 = document.getElementById('mission-panel-swap');
  if (b0) b0.classList.toggle('active', currentMissionTab === 'shifts');
  if (b1) b1.classList.toggle('active', currentMissionTab === 'swap');
  if (p0) {
    p0.classList.toggle('hidden', currentMissionTab !== 'shifts');
    if (currentMissionTab === 'shifts') replayTabEntrance(p0);
  }
  if (p1) {
    p1.classList.toggle('hidden', currentMissionTab !== 'swap');
    if (currentMissionTab === 'swap') replayTabEntrance(p1);
  }
}

function cancelMemberRequest(kind, reqId) {
  if (!currentUser) return;
  if (kind === 'swap') {
    currentSwaps = (currentSwaps || []).filter(s => !(s.id === reqId && s.fromId === currentUser.id && s.status === 'pending'));
  } else {
    currentLeaves = (currentLeaves || []).filter(l => !(l.id === reqId && l.memberId === currentUser.id && l.status === 'pending'));
  }
  saveLocalState();
  renderDispatchHub();
  renderNotificationsModalList();
  showToast('Đã hủy yêu cầu chờ duyệt.');
}

function renderMissionSheetPanels(preselectTaskId = null) {
  const uid = currentUser ? currentUser.id : '';
  const activeTasks = deduplicateTasks(currentTasks || []);
  const listBox = document.getElementById('mission-panel-shifts');
  if (listBox) {
    const cards = activeTasks.map((t) => {
      const { occupied, quota, isFull, isMine, isChecked, isWaitlisted } = getTaskOccupancy(t, uid);
      const catLabel = t.category === 'activity' ? 'Ca sinh hoạt' : 'Ca trực';

      let footerNode = null;
      if (isChecked) {
        footerNode = el('span', { className: 'ready-badge-pill', style: { alignSelf: 'flex-start' } }, 'Đã điểm danh ✓');
      } else if (isMine) {
        footerNode = el('div', { className: 'mini-action-grid' },
          el('span', { className: 'ready-badge-pill' }, 'Đã đăng ký'),
          el('button', {
            type: 'button',
            className: 'btn-mini btn-mini-sky',
            onClick: () => switchSheetDialog('task-mission-modal', 'qr-modal', () => {
              activeQrTaskId = t.id;
              startQrCountdown();
            })
          }, 'Mã QR điểm danh'),
          el('button', {
            type: 'button',
            className: 'btn-mini btn-mini-soft',
            onClick: () => {
              switchMissionTab('swap');
              renderMissionSheetPanels(t.id);
            }
          }, 'Đổi / Rút ca')
        );
      } else if (isWaitlisted) {
        footerNode = el('div', { className: 'mini-action-grid' },
          el('span', { className: 'role-pill-badge' }, 'Đang ở hàng chờ dự bị'),
          el('button', { type: 'button', className: 'btn-mini btn-mini-rose', onClick: () => withdrawFromWaitlist(t.id) }, 'Rút dự bị')
        );
      } else if (isFull) {
        footerNode = el('button', { type: 'button', className: 'btn-mini btn-mini-amber', onClick: () => handleClaimTask(t.id, true) }, `Đăng ký dự bị (${occupied.length}/${quota})`);
      } else {
        footerNode = el('button', { type: 'button', className: 'btn-card-approve', onClick: () => handleClaimTask(t.id, false) }, 'Đăng ký nhận ca này');
      }

      return el('div', { className: 'dispatch-card' },
        el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' } },
          el('div', { style: { fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' } }, t.title),
          el('span', { className: t.category === 'activity' ? 'ready-badge-pill' : 'role-pill-badge' }, catLabel)
        ),
        el('div', { style: { fontSize: '12px', color: 'var(--text-secondary)' } }, `${t.location} · ${t.time} (${occupied.length}/${quota})`),
        footerNode
      );
    });
    mount(listBox, cards.length ? cards : el('div', { className: 'empty-card' }, 'Chưa có ca trực khả dụng.'));
  }

  const myTasks = activeTasks.filter(t => getTaskOccupancy(t, uid).isMine);

  const selTask = document.getElementById('selMissionTaskId');
  const btnSwap = document.getElementById('btnSubmitMemberSwap');
  const btnLeave = document.getElementById('btnSubmitMemberLeave');

  if (selTask) {
    if (myTasks.length > 0) {
      mount(selTask, myTasks.map(t => el('option', { value: t.id }, `${t.title} (${t.time})`)));
      if (preselectTaskId && myTasks.some(t => t.id === preselectTaskId)) {
        selTask.value = preselectTaskId;
      }
      if (btnSwap) btnSwap.disabled = false;
      if (btnLeave) btnLeave.disabled = false;
    } else {
      mount(selTask, el('option', { value: '' }, '-- Bạn chưa đăng ký ca trực nào --'));
      if (btnSwap) btnSwap.disabled = true;
      if (btnLeave) btnLeave.disabled = true;
    }
  }

  const selMem = document.getElementById('selMissionTargetMember');
  if (selMem) {
    const others = (membersDirectory || []).filter(m => m && m.id && m.id !== uid);
    mount(selMem, [
      el('option', { value: '' }, '-- Để Ban Điều Phối sắp xếp --'),
      ...others.map(m => el('option', { value: m.id }, `${m.hoTen} (${m.id})`))
    ]);
  }

  const reqBox = document.getElementById('memberMyRequestsList');
  if (reqBox && uid) {
    const mine = [
      ...(currentSwaps || []).filter(s => s.fromId === uid).map(s => ({ kind: 'swap', id: s.id, title: `Đổi ca: ${s.currentShift || s.taskId}`, sub: `${s.toName || 'Chờ điều phối'} · ${s.reason}`, status: s.status })),
      ...(currentLeaves || []).filter(l => l.memberId === uid).map(l => ({ kind: 'leave', id: l.id, title: `Xin rút ca: ${l.taskId}`, sub: l.reason, status: l.status }))
    ];
    if (mine.length === 0) {
      mount(reqBox, el('div', { className: 'empty-card', style: { padding: '12px' } }, 'Bạn chưa gửi yêu cầu đổi hoặc rút ca nào.'));
    } else {
      mount(reqBox, [
        el('div', { className: 'field-label-mono', style: { marginTop: '4px' } }, 'Yêu cầu bạn đã gửi'),
        ...mine.map(r => {
          const stText = r.status === 'approved' ? 'Đã duyệt' : (r.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt');
          const stClass = r.status === 'approved' ? 'ready-badge-pill' : (r.status === 'rejected' ? 'btn-mini btn-mini-rose' : 'role-pill-badge');
          return el('div', { className: 'dispatch-card', style: { padding: '10px 12px', gap: '6px' } },
            el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' } },
              el('span', { style: { fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' } }, r.title),
              el('span', { className: stClass }, stText)
            ),
            el('div', { style: { fontSize: '11.5px', color: 'var(--text-secondary)' } }, r.sub),
            r.status === 'pending'
              ? el('button', { type: 'button', className: 'btn-mini btn-mini-rose', style: { alignSelf: 'flex-start' }, onClick: () => cancelMemberRequest(r.kind, r.id) }, 'Hủy đơn')
              : null
          );
        })
      ]);
    }
  }
}

async function submitMemberSwapRequest() {
  if (!currentUser) return;
  const taskId = document.getElementById('selMissionTaskId')?.value || '';
  if (!taskId) {
    showToast('Vui lòng đăng ký nhận ca trước khi gửi đơn đổi ca.');
    return;
  }
  const toId = document.getElementById('selMissionTargetMember')?.value || '';
  const target = toId ? (membersDirectory || []).find(m => m.id === toId) : null;
  const task = (currentTasks || []).find(t => t.id === taskId);
  const reason = (document.getElementById('iptMissionReason')?.value || '').trim() || 'Đổi lịch cá nhân';

  currentSwaps.unshift({
    id: 'SWAP_' + Date.now(),
    taskId,
    fromId: currentUser.id,
    fromName: currentUser.hoTen,
    fromClass: currentUser.lop,
    toId: toId || 'CA_DIEU_PHOI',
    toName: target ? target.hoTen : 'Ban Điều Phối sắp xếp',
    currentShift: task ? `${task.location} (${task.time})` : taskId,
    reason,
    type: target ? 'swap' : 'transfer',
    status: 'pending'
  });

  safeSetValue('iptMissionReason', '');
  saveLocalState();
  renderDispatchHub();
  renderNotificationsModalList();
  await closeTaskMissionModal();
  showToast('Đã gửi yêu cầu đổi ca tới Ban Điều Phối!');
}

async function submitMemberLeaveRequest() {
  if (!currentUser) return;
  const taskId = document.getElementById('selMissionTaskId')?.value || '';
  if (!taskId) {
    showToast('Vui lòng đăng ký nhận ca trước khi xin rút ca.');
    return;
  }
  const task = (currentTasks || []).find(t => t.id === taskId);
  const reason = (document.getElementById('iptMissionReason')?.value || '').trim() || 'Xin vắng có lý do';

  currentLeaves.unshift({
    id: 'LEAVE_' + Date.now(),
    taskId,
    memberId: currentUser.id,
    memberName: currentUser.hoTen,
    timeLabel: task ? `${task.location} · ${task.time}` : `Ca ${taskId}`,
    reason,
    urgent: false,
    status: 'pending'
  });

  safeSetValue('iptMissionReason', '');
  saveLocalState();
  renderDispatchHub();
  renderNotificationsModalList();
  await closeTaskMissionModal();
  showToast('Đã gửi đơn xin rút ca chờ duyệt!');
}

function toggleMemberRole(memberId, roleType) {
  if (!currentUser || !currentUser.isAdmin) {
    showToast('Chỉ Quản trị viên mới được phân quyền.');
    return;
  }
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

  dispatchBackendMutation('UPDATE_ROLE', {
    memberId,
    isAdmin: nextAdmin,
    isShiftLeader: nextLeader,
    adminActorId: currentUser.id
  });

  renderMembersModalList();
  showToast(`Đã cập nhật quyền cho ${target.hoTen}.`);
}

function adjustMemberShiftCount(memberId, delta, metric = 'shift') {
  if (!currentUser || !currentUser.isAdmin) {
    showToast('Chỉ Quản trị viên mới được điều chỉnh số ca.');
    return;
  }
  const kind = metric === 'activity' ? 'activity' : 'shift';
  adjustMemberCounter(memberId, kind, delta);
  if (currentUser && currentUser.id === memberId) {
    renderProfileData();
  }
  dispatchBackendMutation('SHIFT_ADJUST', {
    memberId,
    delta,
    metric: kind,
    reason: kind === 'activity' ? 'Điều chỉnh số ca sinh hoạt' : 'Điều chỉnh số ca trực',
    adminActorId: currentUser.id
  });
  saveLocalState();
  renderMembersModalList();
  const label = kind === 'activity' ? 'ca sinh hoạt' : 'ca trực';
  showToast(`Đã điều chỉnh ${delta > 0 ? '+1' : '-1'} ${label} cho ${memberId}.`);
}
