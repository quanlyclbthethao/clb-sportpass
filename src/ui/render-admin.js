// SportPass V7.0 — Admin RBAC Permissions Center, Dispatch Approvals & Leave Decrement (Zero innerHTML)

function openAdminRoleManagementModal() {
  if (!currentUser || !currentUser.isAdmin) {
    showAquaIsland('Chỉ Quản trị viên mới được truy cập trung tâm phân quyền.', '🔒');
    return;
  }
  currentRoleDeptFilter = 'ALL';
  safeSetValue('iptRoleMemberSearch', '');
  updateRoleDeptFilterButtons();
  renderRoleMemberList();
  openGenericModal('modalAdminRoleManagement');
}

function closeAdminRoleManagementModal() {
  closeGenericModal('modalAdminRoleManagement');
}

function setRoleDeptFilter(dept) {
  currentRoleDeptFilter = dept || 'ALL';
  updateRoleDeptFilterButtons();
  renderRoleMemberList();
}

function updateRoleDeptFilterButtons() {
  const bar = document.getElementById('roleDeptFilterBar');
  if (!bar) return;
  mount(bar, buildDeptFilterChips(currentRoleDeptFilter, setRoleDeptFilter));
}

function filterRoleMemberList() {
  renderRoleMemberList();
}

function clearRoleMemberSearch() {
  safeSetValue('iptRoleMemberSearch', '');
  renderRoleMemberList();
}

function renderRoleMemberList() {
  const container = document.getElementById('roleMemberListContainer');
  if (!container) return;

  const uniqueMap = new Map();
  for (const m of (membersDirectory || [])) {
    if (!m || !m.id) continue;
    if (!uniqueMap.has(m.id)) uniqueMap.set(m.id, m);
  }
  const allUnique = Array.from(uniqueMap.values());
  const adminCount = allUnique.filter(m => m.isAdmin).length;
  const leaderCount = allUnique.filter(m => m.isShiftLeader).length;

  safeSetText('roleCountTotal', String(allUnique.length));
  safeSetText('roleCountAdmin', String(adminCount));
  safeSetText('roleCountShiftLeader', String(leaderCount));

  const q = (document.getElementById('iptRoleMemberSearch')?.value || '').trim().toLowerCase();
  const visible = allUnique.filter(m => {
    if (currentRoleDeptFilter !== 'ALL' && m.boMon !== currentRoleDeptFilter) return false;
    if (!q) return true;
    return String(m.hoTen || '').toLowerCase().includes(q) || String(m.id || '').toLowerCase().includes(q);
  });

  if (visible.length === 0) {
    mount(container, el('div', { className: 'sp-empty' }, 'Không tìm thấy thành viên phù hợp.'));
    return;
  }

  const cards = visible.map(m => {
    const isRoot = m.id === 'DMC0806';
    return el('div', { className: 'acrylic-card member-item-card' },
      el('div', { style: { minWidth: '0' } },
        el('div', { style: { fontWeight: '600', fontSize: '13.5px' } },
          `${m.hoTen} `,
          el('span', { className: 'mono-num', style: { color: 'var(--sp-brand)', fontSize: '12px' } }, `(${m.id})`)
        ),
        el('div', { style: { fontSize: '12px', color: 'var(--sp-text2)' } }, `${m.boMon} • ${m.chucVu}`)
      ),
      el('div', { style: { display: 'flex', gap: '6px', flexShrink: '0' } },
        el('button', {
          type: 'button',
          className: `focus-ring spring-touch sp-btn sp-btn-sm ${m.isAdmin ? 'sp-btn-primary' : 'sp-btn-secondary'}`,
          disabled: isRoot,
          onClick: () => toggleMemberRole(m.id, 'admin')
        }, 'Admin'),
        el('button', {
          type: 'button',
          className: `focus-ring spring-touch sp-btn sp-btn-sm ${m.isShiftLeader ? 'sp-btn-success-solid' : 'sp-btn-secondary'}`,
          disabled: isRoot,
          onClick: () => toggleMemberRole(m.id, 'leader')
        }, 'Trưởng ca')
      )
    );
  });
  mount(container, cards);
}

function toggleMemberRole(memberId, roleType) {
  if (memberId === 'DMC0806') {
    showAquaIsland('Quyền Quản trị gốc DMC0806 được bảo vệ vĩnh viễn.', '🛡️');
    return;
  }
  const target = (membersDirectory || []).find(m => m.id === memberId);
  if (!target) return;
  const newVal = roleType === 'admin' ? !target.isAdmin : !target.isShiftLeader;
  applyRoleChange(target, roleType, newVal);
  renderRoleMemberList();
}

function applyRoleChange(member, roleType, newVal) {
  if (!member || !member.id) return;
  const nextAdmin = roleType === 'admin' ? Boolean(newVal) : Boolean(member.isAdmin);
  const nextLeader = roleType === 'admin'
    ? (nextAdmin ? true : Boolean(member.isShiftLeader))
    : Boolean(newVal);

  for (const m of (membersDirectory || [])) {
    if (m.id === member.id) {
      m.isAdmin = nextAdmin;
      m.isShiftLeader = nextLeader;
    }
  }

  const custom = getCustomAdminRoles();
  custom[member.id] = { isAdmin: nextAdmin, isShiftLeader: nextLeader };
  saveCustomAdminRoles(custom);

  if (currentUser && currentUser.id === member.id) {
    currentUser.isAdmin = nextAdmin;
    currentUser.isShiftLeader = nextLeader;
    renderProfileData();
  }

  const adminActorId = currentUser ? currentUser.id : 'DMC0806';
  const url = `${GAS_API_URL}?action=updateMemberRole&memberId=${encodeURIComponent(member.id)}&isAdmin=${nextAdmin}&isShiftLeader=${nextLeader}&adminActorId=${encodeURIComponent(adminActorId)}`;
  if (navigator.onLine) {
    fetch(url).catch(() => enqueueOfflineMutation('UPDATE_ROLE', { memberId: member.id, isAdmin: nextAdmin, isShiftLeader: nextLeader, adminActorId }));
  } else {
    enqueueOfflineMutation('UPDATE_ROLE', { memberId: member.id, isAdmin: nextAdmin, isShiftLeader: nextLeader, adminActorId });
  }
  showAquaIsland(`Đã cập nhật quyền cho ${member.hoTen}.`, '🔐');
}

// ==================== ADMIN DISPATCH APPROVALS (SWAPS & LEAVES) ====================
function updatePendingSwapsBadge() {
  const pendingSwaps = (currentSwaps || []).filter(s => s.status === 'pending').length;
  const pendingLeaves = (currentLeaves || []).filter(l => l.status === 'pending').length;
  const total = pendingSwaps + pendingLeaves;
  safeSetText('pendingDispatchBadgeCount', String(total));
  safeSetText('txtApproveBtnCount', `Duyệt (${total})`);
}

function openAdminDispatchModal(initialTab = 0) {
  switchAdminDispatchTab(initialTab);
  openGenericModal('modalAdminDispatch');
}

function closeAdminDispatchModal() {
  closeGenericModal('modalAdminDispatch');
}

function openAdminDispatchHubModal() {
  openAdminDispatchModal(0);
}

function closeAdminDispatchHubModal() {
  closeAdminDispatchModal();
}

function switchAdminDispatchTab(tabIdx) {
  const swapPanel = document.getElementById('adminSwapsPanel');
  const leavePanel = document.getElementById('adminLeavesPanel');
  const b0 = document.getElementById('btnDispatchTab0');
  const b1 = document.getElementById('btnDispatchTab1');
  if (swapPanel) swapPanel.classList.toggle('hidden', tabIdx !== 0);
  if (leavePanel) leavePanel.classList.toggle('hidden', tabIdx !== 1);
  if (b0) b0.classList.toggle('active', tabIdx === 0);
  if (b1) b1.classList.toggle('active', tabIdx === 1);
  renderAdminSwapsList();
  renderAdminLeavesList();
}

function renderAdminSwapsList() {
  const box = document.getElementById('adminSwapsListContainer');
  if (!box) return;
  const pending = (currentSwaps || []).filter(s => s.status === 'pending');
  if (pending.length === 0) {
    mount(box, el('div', { className: 'sp-empty' }, 'Không có yêu cầu đổi ca nào đang chờ duyệt.'));
    return;
  }
  const nodes = pending.map(s =>
    el('div', { className: 'acrylic-card task-card' },
      el('div', { style: { fontWeight: '600', fontSize: '13.5px' } }, `${s.fromName} -> ${s.toName}`),
      el('div', { style: { fontSize: '12px', color: 'var(--sp-text2)' } },
        'Ca: ',
        el('span', { className: 'mono-num' }, s.taskId),
        ` • Lý do: ${s.reason}`
      ),
      el('div', { style: { display: 'flex', gap: '8px' } },
        el('button', { type: 'button', className: 'focus-ring spring-touch sp-btn sp-btn-sm sp-btn-success-solid', onClick: () => resolveSwapAction(s.id, true) }, 'Duyệt đổi'),
        el('button', { type: 'button', className: 'focus-ring spring-touch sp-btn sp-btn-sm sp-btn-danger', onClick: () => resolveSwapAction(s.id, false) }, 'Từ chối')
      )
    )
  );
  mount(box, nodes);
}

function renderAdminLeavesList() {
  const box = document.getElementById('adminLeavesListContainer');
  if (!box) return;
  const pending = (currentLeaves || []).filter(l => l.status === 'pending');
  if (pending.length === 0) {
    mount(box, el('div', { className: 'sp-empty' }, 'Không có đơn xin rút ca nào đang chờ duyệt.'));
    return;
  }
  const nodes = pending.map(l =>
    el('div', { className: 'acrylic-card task-card' },
      el('div', { style: { fontWeight: '600', fontSize: '13.5px' } },
        `${l.memberName} (`,
        el('span', { className: 'mono-num' }, l.memberId),
        ')'
      ),
      el('div', { style: { fontSize: '12px', color: 'var(--sp-text2)' } },
        'Ca: ',
        el('span', { className: 'mono-num' }, l.taskId),
        ` • Lý do: ${l.reason}`
      ),
      el('div', { style: { display: 'flex', gap: '8px' } },
        el('button', { type: 'button', className: 'focus-ring spring-touch sp-btn sp-btn-sm sp-btn-primary', onClick: () => resolveLeaveAction(l.id, 'approve_exempt', '') }, 'Duyệt rút ca'),
        el('button', { type: 'button', className: 'focus-ring spring-touch sp-btn sp-btn-sm sp-btn-danger', onClick: () => resolveLeaveAction(l.id, 'reject', '') }, 'Từ chối')
      )
    )
  );
  mount(box, nodes);
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
  renderAdminSwapsList();
  renderTasksList();
  updatePendingSwapsBadge();
  showAquaIsland(isApproved ? 'Đã duyệt đổi ca.' : 'Đã từ chối đổi ca.', '✅');
}

function resolveLeaveAction(leaveId, decisionType, promoteWaitlistId) {
  const leave = (currentLeaves || []).find(l => l.id === leaveId);
  if (!leave) return;

  const isApproved = decisionType && decisionType.startsWith('approve');
  leave.status = isApproved ? 'approved' : 'rejected';

  if (isApproved) {
    const task = (currentTasks || []).find(t => t.id === leave.taskId);
    if (task) {
      if (Array.isArray(task.checkedInMembers) && task.checkedInMembers.includes(leave.memberId)) {
        task.checkedInMembers = task.checkedInMembers.filter(id => id !== leave.memberId);
        for (const targetMem of (membersDirectory || [])) {
          if (targetMem.id === leave.memberId) {
            targetMem.soCaHoanThanh = Math.max(0, (Number(targetMem.soCaHoanThanh) || 0) - 1);
            targetMem.soCa = targetMem.soCaHoanThanh;
          }
        }
        if (currentUser && currentUser.id === leave.memberId) {
          currentUser.soCaHoanThanh = Math.max(0, (Number(currentUser.soCaHoanThanh) || 0) - 1);
          currentUser.soCa = currentUser.soCaHoanThanh;
          renderProfileData();
        }
      }
      task.joinedMembers = (task.joinedMembers || []).filter(id => id !== leave.memberId);
      task.assignedMembers = (task.assignedMembers || []).filter(id => id !== leave.memberId);
      if (promoteWaitlistId && !task.joinedMembers.includes(promoteWaitlistId)) {
        task.joinedMembers.push(promoteWaitlistId);
        task.waitlist = (task.waitlist || []).filter(id => id !== promoteWaitlistId);
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
  renderAdminLeavesList();
  renderTasksList();
  updatePendingSwapsBadge();
  showAquaIsland(isApproved ? 'Đã duyệt rút ca an toàn.' : 'Đã từ chối đơn rút ca.', '📋');
}
