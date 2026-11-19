// SportPass V6.0 — Dispatch Tasks List, Filters, Claim/Leave/Swap & Create Modal

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
    const chips = [
      `<button type="button" class="focus-ring spring-touch filter-chip ${currentTaskDeptFilter === 'ALL' ? 'active' : ''}" onclick="setTaskDeptFilter('ALL')">Tất cả</button>`
    ];
    for (const d of ALL_DEPARTMENTS) {
      const shortName = d.replace(/^Ban\s+/i, '');
      chips.push(`<button type="button" class="focus-ring spring-touch filter-chip ${currentTaskDeptFilter === d ? 'active' : ''}" onclick="setTaskDeptFilter('${escapeHtml(d)}')">${escapeHtml(shortName)}</button>`);
    }
    filterBar.innerHTML = chips.join('');
  }

  if (!container) return;

  const filtered = list.filter(t => {
    if (currentTaskDeptFilter === 'ALL') return true;
    const dq = t.departmentQuotas || {};
    return Object.prototype.hasOwnProperty.call(dq, currentTaskDeptFilter) && Number(dq[currentTaskDeptFilter]) > 0;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="sp-empty">Không có ca trực nào thuộc bộ lọc hiện tại.</div>';
    return;
  }

  container.innerHTML = filtered.map((t) => {
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

    const quotaBadges = Object.entries(t.departmentQuotas || {})
      .filter(([, q]) => Number(q) > 0)
      .map(([dept, q]) => `<span class="sp-badge sp-badge-muted">${escapeHtml(dept)}: 0/${Number(q)}</span>`)
      .join('');

    const adminBtns = isAdmin ? `
      <button type="button" class="focus-ring spring-touch mini-icon-btn" title="Điều phối xoay tua" aria-label="Điều phối xoay tua" onclick="openSmartRotationModal('${escapeHtml(t.id)}')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
      </button>
      <button type="button" class="focus-ring spring-touch mini-icon-btn" title="Sửa ca" aria-label="Sửa ca" onclick="openEditTaskModal('${escapeHtml(t.id)}')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
      </button>
      <button type="button" class="focus-ring spring-touch mini-icon-btn danger" title="Xóa ca" aria-label="Xóa ca" onclick="confirmDeleteTask('${escapeHtml(t.id)}')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    ` : '';

    let primaryBtn = '';
    if (isChecked) {
      primaryBtn = `<button type="button" class="focus-ring spring-touch sp-btn sp-btn-sm sp-btn-success" disabled>Đã điểm danh</button>`;
    } else if (isMine) {
      primaryBtn = `
        <button type="button" class="focus-ring spring-touch sp-btn sp-btn-sm sp-btn-primary" onclick="openFieldCheckinQrModal('${escapeHtml(t.id)}')">QR Nhận Ca</button>
        <button type="button" class="focus-ring spring-touch sp-btn sp-btn-sm sp-btn-warning" onclick="openSwapRequestModal('${escapeHtml(t.id)}')">Xin đổi ca</button>
        <button type="button" class="focus-ring spring-touch sp-btn sp-btn-sm sp-btn-danger" onclick="openLeaveTaskModal('${escapeHtml(t.id)}')">Xin rút ca</button>
      `;
    } else if (occupied.length < quota) {
      primaryBtn = `<button type="button" class="focus-ring spring-touch sp-btn sp-btn-sm sp-btn-primary" onclick="handleClaimTask('${escapeHtml(t.id)}')">Nhận Ca Trực</button>`;
    } else if (onWaitlist) {
      primaryBtn = `<button type="button" class="focus-ring spring-touch sp-btn sp-btn-sm sp-btn-secondary" onclick="leaveTaskWaitlist('${escapeHtml(t.id)}')">Rời hàng chờ</button>`;
    } else {
      primaryBtn = `<button type="button" class="focus-ring spring-touch sp-btn sp-btn-sm sp-btn-soft" onclick="handleJoinWaitlist('${escapeHtml(t.id)}')">Đăng ký dự bị</button>`;
    }

    const scanAction = canScan
      ? `<button type="button" class="focus-ring spring-touch sp-btn sp-btn-sm sp-btn-success-solid" onclick="openQrScannerModal('${escapeHtml(t.id)}')">Quét Ca Này</button>`
      : '';

    return `
      <article class="acrylic-card task-card stagger-item ${urgency.isUrgent ? 'is-urgent' : ''}">
        <div class="task-head">
          <div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span class="sp-badge sp-badge-muted mono-num">${escapeHtml(t.id)}</span>
              <span class="sp-badge ${occupied.length >= quota ? 'sp-badge-success' : 'sp-badge-accent'} mono-num">${occupied.length} / ${quota} bạn</span>
            </div>
            <h3 class="task-title">${escapeHtml(t.title)}</h3>
          </div>
          <div class="task-tools">${adminBtns}</div>
        </div>

        <div class="task-meta-chips">
          <span class="meta-chip">${escapeHtml(t.location || 'Nhà Thi Đấu ĐH Hải Dương')}</span>
          <span class="meta-chip mono-num">${escapeHtml(t.time || '07:30 - 11:30')}</span>
          ${t.lockDeadline ? `<span class="meta-chip mono-num">Chốt: ${escapeHtml(String(t.lockDeadline).replace('T', ' '))}</span>` : ''}
        </div>

        ${urgency.isUrgent ? '<div class="sp-badge sp-badge-danger" style="align-self:flex-start;">Cần huy động khẩn cấp • Chưa có thành viên nhận ca</div>' : ''}

        ${t.notes ? `<div class="task-notes-box"><strong>Ghi chú nhiệm vụ:</strong> ${escapeHtml(t.notes)}</div>` : ''}

        ${quotaBadges ? `<div style="display:flex;flex-wrap:wrap;gap:6px;">${quotaBadges}</div>` : ''}

        <div class="task-actions-grid">
          ${primaryBtn}
          ${scanAction}
        </div>
      </article>
    `;
  }).join('');

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
      .map(m => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.hoTen)} (${escapeHtml(m.id)} - ${escapeHtml(m.boMon)})</option>`);
    sel.innerHTML = opts.join('');
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
  container.innerHTML = ALL_DEPARTMENTS.map((dept, idx) => {
    const val = Number(currentDeptQuotaDraft[dept] || 0);
    return `
      <div class="quota-row">
        <input type="text" class="dept-name sp-input" style="min-height:34px;padding:4px 10px;border:0;background:transparent;font-weight:600;font-size:13px;" value="${escapeHtml(dept)}" readonly aria-label="Tên ban">
        <div class="stepper-group">
          <button type="button" class="focus-ring spring-touch stepper-btn" aria-label="Giảm quân số ${escapeHtml(dept)}" onclick="adjustDeptQuotaAtIndex(${idx}, -1)">-</button>
          <span class="mono-num" style="min-width:24px;text-align:center;font-weight:700;">${val}</span>
          <button type="button" class="focus-ring spring-touch stepper-btn" aria-label="Tăng quân số ${escapeHtml(dept)}" onclick="adjustDeptQuotaAtIndex(${idx}, 1)">+</button>
        </div>
      </div>
    `;
  }).join('');
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
