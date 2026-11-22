// SportPass V7.0 — Dispatch Tasks List, Filters, Claim/Leave/Swap & Create Modal (Zero innerHTML)

let currentDeptQuotaDraft = {};

function setTaskDeptFilter(dept) {
  currentTaskDeptFilter = dept || 'ALL';
  renderTasksList();
}

function calculateShiftUrgency(task) {
  const totalJoined = (task.joinedMembers || []).length + (task.assignedMembers || []).length;
  const quota = Number(task.quota) || 1;
  return {
    isUrgent: totalJoined === 0,
    fillRatio: Math.min(1, totalJoined / quota),
    remaining: Math.max(0, quota - totalJoined)
  };
}

function buildDeptFilterChips(activeDept, onSelectFn) {
  const chips = [
    el('button', {
      type: 'button',
      className: `focus-ring spring-touch filter-chip${activeDept === 'ALL' ? ' active' : ''}`,
      onClick: () => onSelectFn('ALL')
    }, 'Tất cả')
  ];
  for (const d of ALL_DEPARTMENTS) {
    const shortName = d.replace(/^Ban\s+/i, '');
    chips.push(
      el('button', {
        type: 'button',
        className: `focus-ring spring-touch filter-chip${activeDept === d ? ' active' : ''}`,
        onClick: () => onSelectFn(d)
      }, shortName)
    );
  }
  return chips;
}

function renderTasksList() {
  const container = document.getElementById('tasksListContainer');
  const filterBar = document.getElementById('tasksDeptFilterBar');
  const dockBadge = document.getElementById('dockTasksBadge');
  const list = deduplicateTasks(currentTasks || []);
  currentTasks = list;

  const uid = currentUser ? currentUser.id : '';
  const isAdmin = Boolean(currentUser && currentUser.isAdmin);
  const canScan = isAuthorizedScanner();

  const urgentCount = list.filter(t => ((t.joinedMembers || []).length + (t.assignedMembers || []).length) === 0).length;
  const myCount = uid ? list.filter(t => (t.joinedMembers || []).includes(uid) || (t.assignedMembers || []).includes(uid)).length : 0;

  safeSetText('statTotalTasks', String(list.length));
  safeSetText('statUrgentTasks', String(urgentCount));
  safeSetText('statMyTasks', String(myCount));

  if (dockBadge) {
    dockBadge.textContent = String(list.length);
    dockBadge.classList.toggle('hidden', list.length === 0);
  }

  if (filterBar) {
    mount(filterBar, buildDeptFilterChips(currentTaskDeptFilter, setTaskDeptFilter));
  }

  if (!container) return;

  const filtered = list.filter(t => {
    if (currentTaskDeptFilter === 'ALL') return true;
    const dq = t.departmentQuotas || {};
    return Object.prototype.hasOwnProperty.call(dq, currentTaskDeptFilter) && Number(dq[currentTaskDeptFilter]) > 0;
  });

  if (filtered.length === 0) {
    mount(container, el('div', { className: 'sp-empty' }, 'Không có ca trực nào thuộc bộ lọc hiện tại.'));
    return;
  }

  const cards = filtered.map((t) => {
    const joined = Array.isArray(t.joinedMembers) ? t.joinedMembers : [];
    const assigned = Array.isArray(t.assignedMembers) ? t.assignedMembers : [];
    const waitlist = Array.isArray(t.waitlist) ? t.waitlist : [];
    const checkedIn = Array.isArray(t.checkedInMembers) ? t.checkedInMembers : [];
    const occupied = Array.from(new Set([...joined, ...assigned]));
    const quota = Number(t.quota) || 4;
    const urgency = calculateShiftUrgency(t);
    const isMine = uid && occupied.includes(uid);
    const isChecked = uid && checkedIn.includes(uid);
    const onWaitlist = uid && waitlist.includes(uid);

    const quotaListText = Object.entries(t.departmentQuotas || {})
      .filter(([, q]) => Number(q) > 0)
      .map(([dept, q]) => `${dept} 0/${Number(q)}`)
      .join(' · ');

    const progressRatio = Math.min(1, Math.max(0, occupied.length / quota));

    const toolsNode = el('div', { className: 'task-tools' });
    if (isAdmin) {
      toolsNode.append(
        el('button', {
          type: 'button',
          className: 'focus-ring spring-touch mini-icon-btn',
          title: 'Điều phối xoay tua',
          'aria-label': 'Điều phối xoay tua',
          onClick: () => openSmartRotationModal(t.id)
        }, spIconNode('rotate', 14)),
        el('button', {
          type: 'button',
          className: 'focus-ring spring-touch mini-icon-btn',
          title: 'Sửa ca',
          'aria-label': 'Sửa ca',
          onClick: () => openEditTaskModal(t.id)
        }, spIconNode('edit', 14)),
        el('button', {
          type: 'button',
          className: 'focus-ring spring-touch mini-icon-btn danger',
          title: 'Xóa ca',
          'aria-label': 'Xóa ca',
          onClick: () => confirmDeleteTask(t.id)
        }, spIconNode('trash', 14))
      );
    }

    const actions = [];
    if (isChecked) {
      actions.push(el('button', { type: 'button', className: 'focus-ring spring-touch sp-btn sp-btn-sm sp-btn-success', disabled: true }, 'Đã điểm danh'));
    } else if (isMine) {
      actions.push(
        el('button', { type: 'button', className: 'focus-ring spring-touch sp-btn sp-btn-sm sp-btn-primary', onClick: () => openFieldCheckinQrModal(t.id) }, 'QR nhận ca'),
        el('button', { type: 'button', className: 'focus-ring spring-touch sp-btn sp-btn-sm sp-btn-warning', onClick: () => openSwapRequestModal(t.id) }, 'Xin đổi ca'),
        el('button', { type: 'button', className: 'focus-ring spring-touch sp-btn sp-btn-sm sp-btn-danger', onClick: () => openLeaveTaskModal(t.id) }, 'Xin rút ca')
      );
    } else if (occupied.length < quota) {
      actions.push(el('button', { type: 'button', className: 'focus-ring spring-touch sp-btn sp-btn-sm sp-btn-primary', onClick: () => handleClaimTask(t.id) }, 'Nhận ca trực'));
    } else if (onWaitlist) {
      actions.push(el('button', { type: 'button', className: 'focus-ring spring-touch sp-btn sp-btn-sm sp-btn-secondary', onClick: () => leaveTaskWaitlist(t.id) }, 'Rời hàng chờ'));
    } else {
      actions.push(el('button', { type: 'button', className: 'focus-ring spring-touch sp-btn sp-btn-sm sp-btn-soft', onClick: () => handleJoinWaitlist(t.id) }, 'Đăng ký dự bị'));
    }

    if (canScan) {
      actions.push(el('button', { type: 'button', className: 'focus-ring spring-touch sp-btn sp-btn-sm sp-btn-success', onClick: () => openQrScannerModal(t.id) }, 'Quét ca này'));
    }

    let notesNode = null;
    if (t.notes) {
      notesNode = el('div', { className: 'task-notes-box' },
        el('strong', {}, 'Ghi chú nhiệm vụ: '),
        String(t.notes)
      );
      notesNode.dataset.escapedNote = `${escapeHtml(t.notes)}`;
    }

    const timeText = `${t.time || '07:30 - 11:30'}${t.lockDeadline ? ` · Chốt ${String(t.lockDeadline).replace('T', ' ')}` : ''}`;

    return el('article', { className: 'acrylic-card task-card stagger-item' },
      el('div', { className: 'task-head' },
        el('div', { style: { minWidth: '0', flex: '1' } },
          el('div', { className: 'task-code-line' },
            el('span', {}, t.id),
            el('span', {}, '·'),
            el('span', { style: { color: 'var(--sp-brand)', fontWeight: '600' } }, `${occupied.length}/${quota} người`)
          ),
          el('h3', { className: 'task-title' }, t.title)
        ),
        toolsNode
      ),
      el('div', { className: 'task-progress-track', 'aria-hidden': 'true' },
        el('div', { className: 'task-progress-fill', style: { '--progress': String(progressRatio) } })
      ),
      el('div', { className: 'task-meta-list' },
        el('div', { className: 'task-meta-item' }, spIconNode('map-pin', 14), el('span', {}, t.location || 'Nhà Thi Đấu ĐH Hải Dương')),
        el('div', { className: 'task-meta-item' }, spIconNode('clock', 14), el('span', { className: 'mono-num' }, timeText))
      ),
      urgency.isUrgent
        ? el('div', { className: 'task-urgent-line' },
            el('span', { className: 'task-urgent-dot', 'aria-hidden': 'true' }),
            el('span', {}, 'Cần huy động · Chưa có thành viên nhận ca')
          )
        : null,
      notesNode,
      quotaListText ? el('div', { className: 'task-dept-summary' }, quotaListText) : null,
      el('div', { className: 'task-actions-grid' }, actions)
    );
  });

  mount(container, cards);
  applyStaggerFallback(container);
}

function handleClaimTask(taskId) {
  if (!currentUser) return;
  const task = (currentTasks || []).find(t => t.id === taskId);
  if (!task) return;
  task.joinedMembers = Array.isArray(task.joinedMembers) ? task.joinedMembers : [];
  if (!task.joinedMembers.includes(currentUser.id)) {
    task.joinedMembers.push(currentUser.id);
    saveLocalState();
    renderTasksList();
    if (navigator.onLine) {
      fetch(`${GAS_API_URL}?action=claimTask&taskId=${encodeURIComponent(taskId)}&memberId=${encodeURIComponent(currentUser.id)}&waitlist=false`)
        .catch(() => enqueueOfflineMutation('CLAIM_TASK', { taskId, memberId: currentUser.id, waitlist: false }));
    } else {
      enqueueOfflineMutation('CLAIM_TASK', { taskId, memberId: currentUser.id, waitlist: false });
    }
    showAquaIsland(`Đã nhận ca ${task.title}`, '✅');
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
    renderTasksList();
    showAquaIsland('Đã vào danh sách dự bị.', '⏳');
  }
}

function leaveTaskWaitlist(taskId) {
  if (!currentUser) return;
  const task = (currentTasks || []).find(t => t.id === taskId);
  if (!task || !Array.isArray(task.waitlist)) return;
  task.waitlist = task.waitlist.filter(id => id !== currentUser.id);
  saveLocalState();
  renderTasksList();
  showAquaIsland('Đã rời hàng chờ dự bị.', '↩️');
}

function openSwapRequestModal(taskId) {
  safeSetValue('iptSwapTaskId', taskId);
  safeSetValue('iptSwapReason', '');
  const sel = document.getElementById('selSwapTargetMember');
  if (sel) {
    const uid = currentUser ? currentUser.id : '';
    const opts = (membersDirectory || [])
      .filter(m => m.id !== uid)
      .slice(0, 60)
      .map(m => el('option', { value: m.id }, `${m.hoTen} (${m.id} - ${m.boMon})`));
    mount(sel, opts);
  }
  openGenericModal('modalSwapRequest');
}

function closeSwapRequestModal() {
  closeGenericModal('modalSwapRequest');
}

function submitSwapRequestAction() {
  if (!currentUser) return;
  const taskId = document.getElementById('iptSwapTaskId')?.value || '';
  const targetId = document.getElementById('selSwapTargetMember')?.value || '';
  const reason = (document.getElementById('iptSwapReason')?.value || '').trim() || 'Đổi lịch cá nhân';
  const target = (membersDirectory || []).find(m => m.id === targetId);
  currentSwaps.unshift({
    id: 'SWAP_' + Date.now(),
    taskId,
    fromId: currentUser.id,
    fromName: currentUser.hoTen,
    toId: targetId,
    toName: target ? target.hoTen : targetId,
    reason,
    status: 'pending'
  });
  saveLocalState();
  updatePendingSwapsBadge();
  closeSwapRequestModal();
  showAquaIsland('Đã gửi yêu cầu đổi ca tới Ban Điều Phối.', '🔄');
}

function cancelPendingSwap(taskId) {
  if (!currentUser) return;
  currentSwaps = (currentSwaps || []).filter(s => !(s.taskId === taskId && s.fromId === currentUser.id && s.status === 'pending'));
  saveLocalState();
  updatePendingSwapsBadge();
}

function openLeaveTaskModal(taskId) {
  safeSetValue('iptLeaveTaskId', taskId);
  safeSetValue('iptLeaveReason', '');
  currentLeaveProofDataUrl = '';
  const prev = document.getElementById('leaveProofPreview');
  if (prev) prev.classList.add('hidden');
  openGenericModal('modalLeaveTask');
}

function closeLeaveTaskModal() {
  closeGenericModal('modalLeaveTask');
}

async function handleLeaveProofSelect(event) {
  const file = event && event.target && event.target.files ? event.target.files[0] : null;
  if (!file) return;
  currentLeaveProofDataUrl = await compressImage(file, 700, 700, 0.72);
  const prev = document.getElementById('leaveProofPreview');
  if (prev && currentLeaveProofDataUrl) {
    prev.src = currentLeaveProofDataUrl;
    prev.classList.remove('hidden');
  }
}

function clearLeaveProof() {
  currentLeaveProofDataUrl = '';
  const prev = document.getElementById('leaveProofPreview');
  if (prev) prev.classList.add('hidden');
}

function submitLeaveRequestAction() {
  if (!currentUser) return;
  const taskId = document.getElementById('iptLeaveTaskId')?.value || '';
  const reason = (document.getElementById('iptLeaveReason')?.value || '').trim();
  if (!reason) {
    showAquaIsland('Vui lòng nhập lý do xin rút ca.', '⚠️');
    return;
  }
  currentLeaves.unshift({
    id: 'LEAVE_' + Date.now(),
    taskId,
    memberId: currentUser.id,
    memberName: currentUser.hoTen,
    reason,
    proofUrl: currentLeaveProofDataUrl || '',
    status: 'pending'
  });
  saveLocalState();
  updatePendingSwapsBadge();
  closeLeaveTaskModal();
  showAquaIsland('Đã gửi đơn xin rút ca chờ duyệt.', '📨');
}

function cancelPendingLeave(taskId) {
  if (!currentUser) return;
  currentLeaves = (currentLeaves || []).filter(l => !(l.taskId === taskId && l.memberId === currentUser.id && l.status === 'pending'));
  saveLocalState();
  updatePendingSwapsBadge();
}

function confirmDeleteTask(taskId) {
  openConfirmDialog('Xóa lệnh điều động', 'Lệnh trực này sẽ bị xóa khỏi toàn bộ thiết bị. Tiếp tục?', 'Xóa lệnh', () => {
    saveDeletedTaskId(taskId);
    currentTasks = (currentTasks || []).filter(t => t.id !== taskId);
    saveLocalState();
    renderTasksList();
    if (navigator.onLine) {
      fetch(`${GAS_API_URL}?action=deleteTask&taskId=${encodeURIComponent(taskId)}`)
        .catch(() => enqueueOfflineMutation('DELETE_TASK', { taskId }));
    } else {
      enqueueOfflineMutation('DELETE_TASK', { taskId });
    }
    showAquaIsland('Đã xóa lệnh điều động.', '🗑️');
  });
}

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
      el('input', {
        type: 'text',
        className: 'dept-name sp-input',
        style: { minHeight: '34px', padding: '4px 10px', border: '0', background: 'transparent', fontWeight: '600', fontSize: '13px' },
        value: dept,
        readOnly: true,
        'aria-label': 'Tên ban'
      }),
      el('div', { className: 'stepper-group' },
        el('button', {
          type: 'button',
          className: 'focus-ring spring-touch stepper-btn',
          'aria-label': `Giảm quân số ${dept}`,
          onClick: () => adjustDeptQuotaAtIndex(idx, -1)
        }, '-'),
        el('span', { className: 'mono-num', style: { minWidth: '24px', textAlign: 'center', fontWeight: '700' } }, String(val)),
        el('button', {
          type: 'button',
          className: 'focus-ring spring-touch stepper-btn',
          'aria-label': `Tăng quân số ${dept}`,
          onClick: () => adjustDeptQuotaAtIndex(idx, 1)
        }, '+')
      )
    );
  });
  mount(container, rows);
  calculateTotalQuota();
}

function adjustDeptQuotaAtIndex(index, delta) {
  const dept = ALL_DEPARTMENTS[index];
  if (!dept) return;
  currentDeptQuotaDraft[dept] = Math.max(0, (Number(currentDeptQuotaDraft[dept]) || 0) + Number(delta));
  renderDeptQuotaRows();
}

function calculateTotalQuota() {
  const total = Object.values(currentDeptQuotaDraft).reduce((sum, n) => sum + (Number(n) || 0), 0);
  safeSetValue('iptTaskQuota', String(Math.max(1, total)));
}

function openCreateTaskModal(taskId = null) {
  editingTaskId = taskId;
  const existing = taskId ? (currentTasks || []).find(t => t.id === taskId) : null;
  safeSetText('modalCreateTaskTitle', existing ? 'Chỉnh Sửa Lệnh Điều Động' : 'Tạo Lệnh Điều Động Mới');
  safeSetValue('iptTaskTitle', existing ? existing.title : '');
  safeSetValue('iptTaskLocation', existing ? existing.location : 'Nhà Thi Đấu ĐH Hải Dương');
  safeSetValue('iptTaskTime', existing ? existing.time : '14:00 - 17:30 Thứ Bảy');
  safeSetValue('iptTaskDeadline', existing ? (existing.lockDeadline || '') : '');
  safeSetValue('iptTaskNotes', existing ? (existing.notes || '') : '');
  initQuotaDraft(existing ? existing.departmentQuotas : null);
  renderDeptQuotaRows();
  if (existing && existing.quota) safeSetValue('iptTaskQuota', String(existing.quota));
  openGenericModal('modalCreateTask');
}

function openEditTaskModal(taskId) {
  openCreateTaskModal(taskId);
}

function closeCreateTaskModal() {
  editingTaskId = null;
  closeGenericModal('modalCreateTask');
}

function submitCreateTaskAction() {
  const title = (document.getElementById('iptTaskTitle')?.value || '').trim();
  const location = (document.getElementById('iptTaskLocation')?.value || '').trim() || 'Nhà Thi Đấu ĐH Hải Dương';
  const time = (document.getElementById('iptTaskTime')?.value || '').trim() || '07:30 - 11:30';
  const quota = Math.max(1, Number(document.getElementById('iptTaskQuota')?.value) || 4);
  const lockDeadline = (document.getElementById('iptTaskDeadline')?.value || '').trim();
  const notes = (document.getElementById('iptTaskNotes')?.value || '').trim();

  if (!title) {
    showAquaIsland('Vui lòng nhập tiêu đề ca trực.', '⚠️');
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
      existingTask.lockDeadline = lockDeadline;
      existingTask.notes = notes;
      existingTask.departmentQuotas = departmentQuotas;
      saveLocalState();
      renderTasksList();
      syncTaskToBackend(existingTask);
      closeCreateTaskModal();
      showAquaIsland('Đã cập nhật lệnh điều động.', '✅');
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
    lockDeadline,
    departmentQuotas,
    notes: notes,
    status: 'active',
    localCreatedAt: Date.now()
  };

  currentTasks.unshift(newTask);
  saveLocalState();
  renderTasksList();
  syncTaskToBackend(newTask);
  closeCreateTaskModal();
  showAquaIsland('Đã phát hành lệnh điều động mới.', '⚡');
}
