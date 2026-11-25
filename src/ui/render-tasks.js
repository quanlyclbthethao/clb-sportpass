// SportPass V8.0 — Create Shift Sheet & Multi-Tab Dispatch / Approval / QR-Scan / 125-Member Directory Hub

let currentDeptQuotaDraft = {};
let promptContextState = null;

function buildDeptFilterChips(activeDept, onSelectFn) {
  const chips = [
    el('button', {
      type: 'button',
      className: `filter-chip${activeDept === 'ALL' ? ' active' : ''}`,
      onClick: () => onSelectFn('ALL')
    }, 'Tất cả')
  ];
  for (const d of ALL_DEPARTMENTS) {
    const shortName = d.replace(/^Ban\s+/i, '');
    chips.push(
      el('button', {
        type: 'button',
        className: `filter-chip${activeDept === d ? ' active' : ''}`,
        onClick: () => onSelectFn(d)
      }, shortName)
    );
  }
  return chips;
}

// ==================== CREATE / EDIT SHIFT SHEET (Nút "Tạo ca") ====================
function initQuotaDraft(existingQuotas = null) {
  currentDeptQuotaDraft = {};
  for (const d of ALL_DEPARTMENTS) {
    currentDeptQuotaDraft[d] = (existingQuotas && existingQuotas[d] !== undefined) ? Number(existingQuotas[d]) : 0;
  }
  if (!existingQuotas) {
    currentDeptQuotaDraft['Ban Bóng Chuyền'] = 2;
    currentDeptQuotaDraft['Ban Cầu Lông'] = 2;
  }
}

function renderDeptQuotaRows() {
  const container = document.getElementById('deptQuotaContainer');
  if (!container) return;
  const rows = ALL_DEPARTMENTS.map((dept, idx) => {
    const val = Number(currentDeptQuotaDraft[dept] || 0);
    return el('div', { className: 'quota-row' },
      el('span', { style: { fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)' } }, dept),
      el('div', { className: 'stepper-group' },
        el('button', {
          type: 'button',
          className: 'stepper-btn',
          'aria-label': `Giảm quân số ${dept}`,
          onClick: () => adjustDeptQuotaAtIndex(idx, -1)
        }, '-'),
        el('span', { className: 'font-mono', style: { minWidth: '22px', textAlign: 'center', fontWeight: '700', fontSize: '13px' } }, String(val)),
        el('button', {
          type: 'button',
          className: 'stepper-btn',
          'aria-label': `Tăng quân số ${dept}`,
          onClick: () => adjustDeptQuotaAtIndex(idx, 1)
        }, '+')
      )
    );
  });
  mount(container, rows);
  const total = Object.values(currentDeptQuotaDraft).reduce((s, n) => s + (Number(n) || 0), 0);
  safeSetValue('iptTaskQuota', String(Math.max(1, total)));
}

function adjustDeptQuotaAtIndex(index, delta) {
  const dept = ALL_DEPARTMENTS[index];
  if (!dept) return;
  currentDeptQuotaDraft[dept] = Math.max(0, (Number(currentDeptQuotaDraft[dept]) || 0) + Number(delta));
  renderDeptQuotaRows();
}

function openCreateShiftModal(taskId = null) {
  if (!currentUser || (!currentUser.isAdmin && !currentUser.isShiftLeader)) {
    openApproveShiftModal('shifts');
    showToast('Đã mở danh sách ca trực để bạn đăng ký.');
    return;
  }
  editingTaskId = taskId;
  const existing = taskId ? (currentTasks || []).find(t => t.id === taskId) : null;
  safeSetText('create-shift-title', existing ? 'Chỉnh Sửa Ca Trực' : 'Tạo Ca Trực Mới');
  safeSetValue('iptTaskTitle', existing ? existing.title : '');
  safeSetValue('iptTaskLocation', existing ? existing.location : 'Nhà Thi Đấu ĐH Hải Dương');
  safeSetValue('iptTaskTime', existing ? existing.time : '14:00 - 17:30 Thứ Bảy');
  safeSetValue('iptTaskNotes', existing ? (existing.notes || '') : '');
  initQuotaDraft(existing ? existing.departmentQuotas : null);
  renderDeptQuotaRows();
  if (existing && existing.quota) safeSetValue('iptTaskQuota', String(existing.quota));
  openSheetDialog('create-shift-modal');
}

function closeCreateShiftModal() {
  editingTaskId = null;
  closeSheetDialog('create-shift-modal');
}

function submitCreateShiftAction() {
  const title = (document.getElementById('iptTaskTitle')?.value || '').trim();
  const location = (document.getElementById('iptTaskLocation')?.value || '').trim() || 'Nhà Thi Đấu ĐH Hải Dương';
  const time = (document.getElementById('iptTaskTime')?.value || '').trim() || '14:00 - 17:30 Thứ Bảy';
  const quota = Math.max(1, Number(document.getElementById('iptTaskQuota')?.value) || 4);
  const notes = (document.getElementById('iptTaskNotes')?.value || '').trim();

  if (!title) {
    showToast('Vui lòng nhập tên ca trực.');
    return;
  }

  const departmentQuotas = {};
  for (const [k, v] of Object.entries(currentDeptQuotaDraft)) {
    if (Number(v) > 0) departmentQuotas[k] = Number(v);
  }

  if (editingTaskId) {
    const existingTask = (currentTasks || []).find(t => t.id === editingTaskId);
    if (existingTask) {
      existingTask.title = title;
      existingTask.location = location;
      existingTask.time = time;
      existingTask.quota = quota;
      existingTask.notes = notes;
      existingTask.departmentQuotas = departmentQuotas;
      saveLocalState();
      syncTaskToBackend(existingTask);
      renderDispatchHub();
      renderNotificationsModalList();
      closeCreateShiftModal();
      showToast('Đã cập nhật ca trực thành công!');
      return;
    }
  }

  const newTask = {
    id: 'TASK_' + Date.now(),
    title,
    location,
    time,
    quota,
    joinedMembers: [],
    assignedMembers: [],
    waitlist: [],
    checkedInMembers: [],
    checkinLogs: [],
    lockDeadline: '',
    departmentQuotas,
    notes,
    status: 'active',
    localCreatedAt: Date.now()
  };

  currentTasks.unshift(newTask);
  saveLocalState();
  syncTaskToBackend(newTask);
  renderDispatchHub();
  renderNotificationsModalList();
  closeCreateShiftModal();
  showToast('Đã tạo và phát hành ca trực mới!');
}

// ==================== APPROVE / DISPATCH / SCANNER / DIRECTORY SHEET ====================
function openApproveShiftModal(tabName = 'shifts') {
  switchApproveTab(tabName);
  openSheetDialog('approve-shift-modal');
}

function closeApproveShiftModal() {
  stopQrCameraStream();
  closeSheetDialog('approve-shift-modal');
}

function switchApproveTab(tabName) {
  activeApproveTab = tabName || 'shifts';
  const tabs = ['shifts', 'approvals', 'scanner', 'directory'];
  tabs.forEach((t) => {
    const btn = document.getElementById(`approve-tab-btn-${t}`);
    const panel = document.getElementById(`approve-panel-${t}`);
    if (btn) btn.classList.toggle('active', t === activeApproveTab);
    if (panel) panel.classList.toggle('hidden', t !== activeApproveTab);
  });

  if (activeApproveTab !== 'scanner') {
    stopQrCameraStream();
  } else {
    populateScanTaskSelector();
  }
  renderDispatchHub();
}

function renderDispatchHub() {
  renderShiftsTabList();
  renderApprovalsTabList();
  renderDirectoryTabList();
  populateScanTaskSelector();
}

function renderShiftsTabList() {
  const filterBar = document.getElementById('shiftsDeptFilterBar');
  const container = document.getElementById('shiftsListContainer');
  const list = deduplicateTasks(currentTasks || []);
  currentTasks = list;

  if (filterBar) {
    mount(filterBar, buildDeptFilterChips(currentTaskDeptFilter, (d) => {
      currentTaskDeptFilter = d;
      renderShiftsTabList();
    }));
  }
  if (!container) return;

  const uid = currentUser ? currentUser.id : '';
  const isAdmin = Boolean(currentUser && currentUser.isAdmin);

  const filtered = list.filter((t) => {
    if (currentTaskDeptFilter === 'ALL') return true;
    const dq = t.departmentQuotas || {};
    return Object.prototype.hasOwnProperty.call(dq, currentTaskDeptFilter) && Number(dq[currentTaskDeptFilter]) > 0;
  });

  if (filtered.length === 0) {
    mount(container, el('div', { className: 'empty-card' }, 'Chưa có ca trực nào trong bộ lọc này.'));
    return;
  }

  const cards = filtered.map((t) => {
    const joined = Array.isArray(t.joinedMembers) ? t.joinedMembers : [];
    const assigned = Array.isArray(t.assignedMembers) ? t.assignedMembers : [];
    const waitlist = Array.isArray(t.waitlist) ? t.waitlist : [];
    const checkedIn = Array.isArray(t.checkedInMembers) ? t.checkedInMembers : [];
    const occupied = Array.from(new Set([...joined, ...assigned]));
    const quota = Number(t.quota) || 4;
    const progress = Math.min(1, occupied.length / quota);
    const isMine = uid && occupied.includes(uid);
    const isChecked = uid && checkedIn.includes(uid);
    const onWaitlist = uid && waitlist.includes(uid);

    const actions = [];
    if (isChecked) {
      actions.push(el('button', { type: 'button', className: 'btn-mini btn-mini-emerald', disabled: true }, 'Đã điểm danh'));
    } else if (isMine) {
      actions.push(
        el('button', { type: 'button', className: 'btn-mini btn-mini-sky', onClick: () => { closeApproveShiftModal(); openQrModal(); } }, 'Mã QR vào ca'),
        el('button', { type: 'button', className: 'btn-mini btn-mini-amber', onClick: () => openPromptSheet('swap', t.id) }, 'Xin đổi ca'),
        el('button', { type: 'button', className: 'btn-mini btn-mini-rose', onClick: () => openPromptSheet('leave', t.id) }, 'Xin rút ca')
      );
    } else if (occupied.length < quota) {
      actions.push(el('button', { type: 'button', className: 'btn-mini btn-mini-sky', onClick: () => handleClaimTask(t.id) }, 'Nhận ca trực'));
    } else if (onWaitlist) {
      actions.push(el('button', { type: 'button', className: 'btn-mini btn-mini-soft', onClick: () => leaveTaskWaitlist(t.id) }, 'Rời dự bị'));
    } else {
      actions.push(el('button', { type: 'button', className: 'btn-mini btn-mini-soft', onClick: () => handleJoinWaitlist(t.id) }, 'Đăng ký dự bị'));
    }

    if (isAdmin) {
      actions.push(
        el('button', { type: 'button', className: 'btn-mini btn-mini-soft', onClick: () => runSmartRotationForTask(t.id) }, 'Xoay tua'),
        el('button', { type: 'button', className: 'btn-mini btn-mini-soft', onClick: () => { closeApproveShiftModal(); openCreateShiftModal(t.id); } }, 'Sửa'),
        el('button', { type: 'button', className: 'btn-mini btn-mini-rose', onClick: () => openPromptSheet('delete', t.id) }, 'Xóa')
      );
    }

    return el('article', { className: 'shift-item-card' },
      el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' } },
        el('div', { style: { minWidth: '0', flex: '1' } },
          el('div', { className: 'font-mono', style: { fontSize: '10.5px', color: '#0369a1', fontWeight: '600' } }, `${t.id} · ${occupied.length}/${quota} người`),
          el('h4', { style: { margin: '2px 0 0', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' } }, t.title)
        )
      ),
      el('div', { className: 'shift-progress-track', 'aria-hidden': 'true' },
        el('div', { className: 'shift-progress-fill', style: { '--progress': String(progress) } })
      ),
      el('div', { style: { fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' } },
        el('span', {}, `Địa điểm: ${t.location || 'Nhà Thi Đấu ĐH Hải Dương'}`),
        el('span', { className: 'font-mono' }, `Thời gian: ${t.time || '14:00 - 17:30'}`),
        t.notes ? el('span', {}, `Ghi chú: ${t.notes}`) : null
      ),
      el('div', { className: 'mini-action-grid' }, actions)
    );
  });

  mount(container, cards);
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
    showToast(`Đã nhận ca: ${task.title}`);
  }
}

function handleJoinWaitlist(taskId) {
  if (!currentUser) return;
  const task = (currentTasks || []).find(t => t.id === taskId);
  if (!task) return;
  task.waitlist = Array.isArray(task.waitlist) ? task.waitlist : [];
  if (!task.waitlist.includes(currentUser.id)) {
    task.waitlist.push(currentUser.id);
    saveLocalState();
    renderDispatchHub();
    showToast('Đã đăng ký danh sách dự bị.');
  }
}

function leaveTaskWaitlist(taskId) {
  if (!currentUser) return;
  const task = (currentTasks || []).find(t => t.id === taskId);
  if (!task || !Array.isArray(task.waitlist)) return;
  task.waitlist = task.waitlist.filter(id => id !== currentUser.id);
  saveLocalState();
  renderDispatchHub();
  showToast('Đã rời hàng chờ dự bị.');
}

function renderApprovalsTabList() {
  const container = document.getElementById('approvalsListContainer');
  if (!container) return;
  const swaps = (currentSwaps || []).filter(s => s.status === 'pending');
  const leaves = (currentLeaves || []).filter(l => l.status === 'pending');
  const total = swaps.length + leaves.length;

  const badge = document.getElementById('approvals-count-pill');
  if (badge) badge.textContent = String(total);

  if (total === 0) {
    mount(container, el('div', { className: 'empty-card' }, 'Hiện chưa có yêu cầu đổi ca hoặc xin rút ca nào đang chờ duyệt.'));
    return;
  }

  const canApprove = Boolean(currentUser && (currentUser.isAdmin || currentUser.isShiftLeader));
  const items = [];

  for (const s of swaps) {
    items.push(
      el('div', { className: 'shift-item-card' },
        el('div', { style: { fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' } }, `Đổi ca: ${s.fromName} -> ${s.toName}`),
        el('div', { style: { fontSize: '12px', color: 'var(--text-secondary)' } }, `Ca ${s.taskId} • Lý do: ${s.reason}`),
        canApprove
          ? el('div', { className: 'mini-action-grid' },
              el('button', { type: 'button', className: 'btn-mini btn-mini-emerald', onClick: () => resolveSwapAction(s.id, true) }, 'Duyệt đổi'),
              el('button', { type: 'button', className: 'btn-mini btn-mini-rose', onClick: () => resolveSwapAction(s.id, false) }, 'Từ chối')
            )
          : el('span', { className: 'font-mono', style: { fontSize: '11px', color: '#0369a1' } }, 'Đang chờ Ban Điều Phối duyệt')
      )
    );
  }

  for (const l of leaves) {
    items.push(
      el('div', { className: 'shift-item-card' },
        el('div', { style: { fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' } }, `Xin rút ca: ${l.memberName} (${l.memberId})`),
        el('div', { style: { fontSize: '12px', color: 'var(--text-secondary)' } }, `Ca ${l.taskId} • Lý do: ${l.reason}`),
        canApprove
          ? el('div', { className: 'mini-action-grid' },
              el('button', { type: 'button', className: 'btn-mini btn-mini-sky', onClick: () => resolveLeaveAction(l.id, true) }, 'Duyệt rút ca'),
              el('button', { type: 'button', className: 'btn-mini btn-mini-rose', onClick: () => resolveLeaveAction(l.id, false) }, 'Từ chối')
            )
          : el('span', { className: 'font-mono', style: { fontSize: '11px', color: '#0369a1' } }, 'Đang chờ Ban Điều Phối duyệt')
      )
    );
  }

  mount(container, items);
}

function resolveSwapAction(swapId, isApproved) {
  const swap = (currentSwaps || []).find(s => s.id === swapId);
  if (!swap) return;
  swap.status = isApproved ? 'approved' : 'rejected';

  if (isApproved) {
    const task = (currentTasks || []).find(t => t.id === swap.taskId);
    if (task) {
      task.joinedMembers = (task.joinedMembers || []).filter(id => id !== swap.fromId);
      if (swap.toId && !task.joinedMembers.includes(swap.toId)) {
        task.joinedMembers.push(swap.toId);
      }
    }
  }
  saveLocalState();
  renderDispatchHub();
  renderNotificationsModalList();
  showToast(isApproved ? 'Đã phê duyệt yêu cầu đổi ca.' : 'Đã từ chối yêu cầu đổi ca.');
}

function resolveLeaveAction(leaveId, isApproved) {
  const leave = (currentLeaves || []).find(l => l.id === leaveId);
  if (!leave) return;
  leave.status = isApproved ? 'approved' : 'rejected';

  if (isApproved) {
    const task = (currentTasks || []).find(t => t.id === leave.taskId);
    if (task) {
      if (Array.isArray(task.checkedInMembers) && task.checkedInMembers.includes(leave.memberId)) {
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
      task.joinedMembers = (task.joinedMembers || []).filter(id => id !== leave.memberId);
      task.assignedMembers = (task.assignedMembers || []).filter(id => id !== leave.memberId);
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
  showToast(isApproved ? 'Đã duyệt rút ca an toàn.' : 'Đã từ chối đơn rút ca.');
}

function populateScanTaskSelector() {
  const sel = document.getElementById('selScanTaskId');
  if (!sel) return;
  const opts = (currentTasks || []).map(t => el('option', { value: t.id }, `${t.id} — ${t.title}`));
  mount(sel, opts);
}

// ==================== 125-MEMBER DIRECTORY & ADMIN RBAC TAB ====================
function renderDirectoryTabList() {
  const filterBar = document.getElementById('directoryDeptFilterBar');
  const container = document.getElementById('directoryListContainer');
  if (filterBar) {
    mount(filterBar, buildDeptFilterChips(currentDirDeptFilter, (d) => {
      currentDirDeptFilter = d;
      renderDirectoryTabList();
    }));
  }
  if (!container) return;

  const uniqueMap = new Map();
  for (const m of (membersDirectory || [])) {
    if (m && m.id && !uniqueMap.has(m.id)) uniqueMap.set(m.id, m);
  }
  const uniqueList = Array.from(uniqueMap.values());
  const q = (document.getElementById('iptSearchDirectory')?.value || '').trim().toLowerCase();

  const visible = uniqueList.filter((m) => {
    if (currentDirDeptFilter !== 'ALL' && m.boMon !== currentDirDeptFilter) return false;
    if (!q) return true;
    return (
      String(m.hoTen || '').toLowerCase().includes(q) ||
      String(m.id || '').toLowerCase().includes(q) ||
      String(m.lop || '').toLowerCase().includes(q) ||
      String(m.boMon || '').toLowerCase().includes(q)
    );
  });

  safeSetText('directoryCountLabel', `${visible.length} / ${(membersDirectory || []).length} hồ sơ`);

  if (visible.length === 0) {
    mount(container, el('div', { className: 'empty-card' }, 'Không tìm thấy thành viên phù hợp.'));
    return;
  }

  const isAdmin = Boolean(currentUser && currentUser.isAdmin);
  const cards = visible.map((m) => {
    const isRoot = m.id === 'DMC0806';
    const shifts = Number(m.soCaHoanThanh ?? m.soCa ?? 0);
    return el('div', { className: 'shift-item-card' },
      el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' } },
        el('div', { style: { minWidth: '0', flex: '1' } },
          el('div', { style: { fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' } },
            `${m.hoTen} `,
            el('span', { className: 'font-mono', style: { color: '#0369a1', fontSize: '12px' } }, `(${m.id})`)
          ),
          el('div', { style: { fontSize: '11.5px', color: 'var(--text-secondary)' } }, `${m.boMon} • ${m.chucVu} • ${m.lop}`)
        ),
        el('span', { className: 'role-pill-badge' }, `${shifts} ca`)
      ),
      isAdmin
        ? el('div', { className: 'mini-action-grid' },
            el('button', {
              type: 'button',
              className: `btn-mini ${m.isAdmin ? 'btn-mini-sky' : 'btn-mini-soft'}`,
              disabled: isRoot,
              onClick: () => toggleMemberRole(m.id, 'admin')
            }, isRoot ? 'Admin gốc' : (m.isAdmin ? 'Admin ✓' : 'Cấp Admin')),
            el('button', {
              type: 'button',
              className: `btn-mini ${m.isShiftLeader ? 'btn-mini-emerald' : 'btn-mini-soft'}`,
              disabled: isRoot,
              onClick: () => toggleMemberRole(m.id, 'leader')
            }, m.isShiftLeader ? 'Trưởng ca ✓' : 'Trưởng ca'),
            el('button', {
              type: 'button',
              className: 'btn-mini btn-mini-soft',
              onClick: () => adjustMemberShiftCount(m.id, 1)
            }, '+1 ca'),
            el('button', {
              type: 'button',
              className: 'btn-mini btn-mini-rose',
              onClick: () => adjustMemberShiftCount(m.id, -1)
            }, '-1 ca')
          )
        : null
    );
  });

  mount(container, cards);
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

  if (currentUser && currentUser.id === memberId) {
    currentUser.isAdmin = nextAdmin;
    currentUser.isShiftLeader = nextLeader;
    persistUserSession(currentUser);
    renderProfileData();
  }

  const adminActorId = currentUser ? currentUser.id : 'DMC0806';
  const url = `${GAS_API_URL}?action=updateMemberRole&memberId=${encodeURIComponent(memberId)}&isAdmin=${nextAdmin}&isShiftLeader=${nextLeader}&adminActorId=${encodeURIComponent(adminActorId)}`;
  if (navigator.onLine) {
    fetch(url).catch(() => enqueueOfflineMutation('UPDATE_ROLE', { memberId, isAdmin: nextAdmin, isShiftLeader: nextLeader, adminActorId }));
  } else {
    enqueueOfflineMutation('UPDATE_ROLE', { memberId, isAdmin: nextAdmin, isShiftLeader: nextLeader, adminActorId });
  }

  renderDirectoryTabList();
  showToast(`Đã cập nhật quyền cho ${target.hoTen}.`);
}

function adjustMemberShiftCount(memberId, delta) {
  let nextVal = 0;
  for (const m of (membersDirectory || [])) {
    if (m.id === memberId) {
      nextVal = Math.max(0, (Number(m.soCaHoanThanh ?? m.soCa ?? 0)) + delta);
      m.soCaHoanThanh = nextVal;
      m.soCa = nextVal;
    }
  }
  if (currentUser && currentUser.id === memberId) {
    currentUser.soCaHoanThanh = nextVal;
    currentUser.soCa = nextVal;
    persistUserSession(currentUser);
    renderProfileData();
  }
  const adminActorId = currentUser ? currentUser.id : 'DMC0806';
  const reason = 'Điều chỉnh từ Ban Điều Phối';
  if (navigator.onLine) {
    fetch(`${GAS_API_URL}?action=adjustMemberShifts&memberId=${encodeURIComponent(memberId)}&delta=${encodeURIComponent(delta)}&reason=${encodeURIComponent(reason)}&adminActorId=${encodeURIComponent(adminActorId)}`)
      .catch(() => enqueueOfflineMutation('SHIFT_ADJUST', { memberId, delta, reason, adminActorId }));
  } else {
    enqueueOfflineMutation('SHIFT_ADJUST', { memberId, delta, reason, adminActorId });
  }
  saveLocalState();
  renderDirectoryTabList();
  showToast(`Đã cập nhật ${delta > 0 ? '+1' : '-1'} ca cho ${memberId}.`);
}

// ==================== AQUAMORPHIC PROMPT SHEET (SWAP / LEAVE / DELETE CONFIRM) ====================
function openPromptSheet(mode, taskId) {
  promptContextState = { mode, taskId };
  const swapWrap = document.getElementById('prompt-swap-target-wrap');
  const reasonWrap = document.getElementById('prompt-reason-wrap');
  const confirmBtn = document.getElementById('prompt-confirm-btn');

  if (mode === 'swap') {
    safeSetText('prompt-sheet-title', 'Xin Đổi Ca Trực');
    safeSetText('prompt-sheet-desc', `Chọn thành viên nhận thay ca ${taskId} và nêu ngắn lý do.`);
    if (swapWrap) swapWrap.classList.remove('hidden');
    if (reasonWrap) reasonWrap.classList.remove('hidden');
    if (confirmBtn) confirmBtn.textContent = 'Gửi đơn đổi ca';
    const sel = document.getElementById('selSwapTargetMember');
    if (sel) {
      const uid = currentUser ? currentUser.id : '';
      const opts = (membersDirectory || [])
        .filter(m => m.id !== uid)
        .slice(0, 60)
        .map(m => el('option', { value: m.id }, `${m.hoTen} (${m.id})`));
      mount(sel, opts);
    }
    safeSetValue('iptPromptReason', '');
  } else if (mode === 'leave') {
    safeSetText('prompt-sheet-title', 'Xin Rút Ca Trực');
    safeSetText('prompt-sheet-desc', `Gửi đơn xin rút khỏi ca ${taskId} để Ban Điều Phối duyệt.`);
    if (swapWrap) swapWrap.classList.add('hidden');
    if (reasonWrap) reasonWrap.classList.remove('hidden');
    if (confirmBtn) confirmBtn.textContent = 'Gửi đơn rút ca';
    safeSetValue('iptPromptReason', '');
  } else {
    safeSetText('prompt-sheet-title', 'Xóa Ca Trực');
    safeSetText('prompt-sheet-desc', `Ca ${taskId} sẽ bị xóa khỏi toàn bộ thiết bị. Bạn chắc chắn chứ?`);
    if (swapWrap) swapWrap.classList.add('hidden');
    if (reasonWrap) reasonWrap.classList.add('hidden');
    if (confirmBtn) confirmBtn.textContent = 'Xác nhận xóa';
  }
  openSheetDialog('action-prompt-modal');
}

function submitPromptSheetAction() {
  if (!promptContextState || !currentUser) return;
  const { mode, taskId } = promptContextState;
  const reason = (document.getElementById('iptPromptReason')?.value || '').trim();

  if (mode === 'swap') {
    const targetId = document.getElementById('selSwapTargetMember')?.value || '';
    const target = (membersDirectory || []).find(m => m.id === targetId);
    currentSwaps.unshift({
      id: 'SWAP_' + Date.now(),
      taskId,
      fromId: currentUser.id,
      fromName: currentUser.hoTen,
      toId: targetId,
      toName: target ? target.hoTen : targetId,
      reason: reason || 'Đổi lịch cá nhân',
      status: 'pending'
    });
    saveLocalState();
    renderDispatchHub();
    renderNotificationsModalList();
    closeSheetDialog('action-prompt-modal');
    showToast('Đã gửi yêu cầu đổi ca trực đến trưởng bộ phận!');
  } else if (mode === 'leave') {
    if (!reason) {
      showToast('Vui lòng nhập lý do xin rút ca.');
      return;
    }
    currentLeaves.unshift({
      id: 'LEAVE_' + Date.now(),
      taskId,
      memberId: currentUser.id,
      memberName: currentUser.hoTen,
      reason,
      status: 'pending'
    });
    saveLocalState();
    renderDispatchHub();
    renderNotificationsModalList();
    closeSheetDialog('action-prompt-modal');
    showToast('Đã gửi đơn xin rút ca chờ duyệt.');
  } else if (mode === 'delete') {
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
    closeSheetDialog('action-prompt-modal');
    showToast('Đã xóa ca trực thành công.');
  }
}
