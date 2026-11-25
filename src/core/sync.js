// SportPass V8.0 — Bidirectional Google Apps Script Sync & Offline Mutation Queue (Forum Removed)

let syncDebounceTimer = null;

function enqueueOfflineMutation(type, payload) {
  offlineMutationQueue.push({
    id: 'MUT_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    type,
    payload: payload || {},
    createdAt: Date.now()
  });
  saveLocalState();
}

function buildMutationUrl(mut) {
  const p = mut.payload || {};
  if (mut.type === 'DELETE_TASK') {
    return `${GAS_API_URL}?action=deleteTask&taskId=${encodeURIComponent(p.taskId || '')}`;
  }
  if (mut.type === 'CREATE_TASK') {
    return `${GAS_API_URL}?action=createTask&task=${encodeURIComponent(JSON.stringify(p))}`;
  }
  if (mut.type === 'CLAIM_TASK') {
    return `${GAS_API_URL}?action=claimTask&taskId=${encodeURIComponent(p.taskId || '')}&memberId=${encodeURIComponent(p.memberId || '')}&waitlist=${Boolean(p.waitlist)}`;
  }
  if (mut.type === 'WITHDRAW_TASK') {
    return `${GAS_API_URL}?action=withdrawTask&taskId=${encodeURIComponent(p.taskId || '')}&memberId=${encodeURIComponent(p.memberId || '')}&reason=${encodeURIComponent(p.reason || '')}`;
  }
  if (mut.type === 'QR_CHECKIN') {
    return `${GAS_API_URL}?action=checkinMember&taskId=${encodeURIComponent(p.taskId || '')}&memberId=${encodeURIComponent(p.memberId || '')}&adminId=${encodeURIComponent(p.scannerId || p.adminId || '')}`;
  }
  if (mut.type === 'SHIFT_ADJUST') {
    return `${GAS_API_URL}?action=adjustMemberShifts&memberId=${encodeURIComponent(p.memberId || '')}&delta=${encodeURIComponent(p.delta || 0)}&reason=${encodeURIComponent(p.reason || '')}&adminActorId=${encodeURIComponent(p.adminActorId || '')}`;
  }
  if (mut.type === 'UPDATE_ROLE') {
    return `${GAS_API_URL}?action=updateMemberRole&memberId=${encodeURIComponent(p.memberId || '')}&isAdmin=${Boolean(p.isAdmin)}&isShiftLeader=${Boolean(p.isShiftLeader)}&adminActorId=${encodeURIComponent(p.adminActorId || '')}`;
  }
  if (mut.type === 'UPDATE_PROFILE') {
    return `${GAS_API_URL}?action=updateProfile&memberId=${encodeURIComponent(p.memberId || '')}&lop=${encodeURIComponent(p.lop || '')}&sdt=${encodeURIComponent(p.sdt || '')}&ice=${encodeURIComponent(p.ice || '')}&yTe=${encodeURIComponent(p.yTe || '')}`;
  }
  return null;
}

function syncOfflineMutations(isManual = false) {
  if (!navigator.onLine || offlineMutationQueue.length === 0) return;
  const batch = offlineMutationQueue.splice(0, offlineMutationQueue.length);
  saveLocalState();

  for (const mut of batch) {
    const url = buildMutationUrl(mut);
    if (!url) continue;
    fetch(url).catch(() => {
      offlineMutationQueue.push(mut);
      saveLocalState();
    });
  }

  if (isManual) {
    showToast(`Đã đẩy ${batch.length} thay đổi lên máy chủ.`);
  }
}

async function syncTaskToBackend(task) {
  if (!task) return;
  if (!navigator.onLine) {
    enqueueOfflineMutation('CREATE_TASK', task);
    return;
  }
  try {
    await fetch(`${GAS_API_URL}?action=createTask`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'createTask', task })
    });
  } catch (e) {
    enqueueOfflineMutation('CREATE_TASK', task);
  }
}

async function syncRealtimeData() {
  if (!currentUser || !navigator.onLine) return;
  try {
    const res = await fetch(`${GAS_API_URL}?action=syncAll&memberId=${encodeURIComponent(currentUser.id)}`);
    const data = await res.json();
    if (!data || !data.success) return;

    if (Array.isArray(data.deletedTaskIds)) {
      data.deletedTaskIds.forEach(id => saveDeletedTaskId(id));
    }

    if (Array.isArray(data.membersList) && data.membersList.length > 0) {
      membersDirectory = data.membersList;
      applyCustomAdminRoles(membersDirectory);
    }

    if (data.member) {
      const preservedAvatar = currentUser.avatar || '';
      const preservedStudentCode = currentUser.studentCode || '';
      const preservedDob = currentUser.ngaySinh || '';
      currentUser = Object.assign({}, currentUser, data.member);
      if (!currentUser.avatar && preservedAvatar) currentUser.avatar = preservedAvatar;
      if (!currentUser.studentCode && preservedStudentCode) currentUser.studentCode = preservedStudentCode;
      if (!currentUser.ngaySinh && preservedDob) currentUser.ngaySinh = preservedDob;
      applyCustomAdminRoles(membersDirectory);
      window.currentUser = currentUser;
    }

    const deletedTasks = getDeletedTaskIds();
    const prevTaskMap = new Map((currentTasks || []).map(t => [t.id, t]));
    const serverTasks = (data.tasks || []).filter(t => t && !deletedTasks.includes(t.id) && !isStaleRemoteTestTask(t));
    const serverTaskMap = new Map(serverTasks.map(t => [t.id, t]));

    const mergedTasks = [...serverTasks];
    if (Array.isArray(currentTasks)) {
      for (const localTask of currentTasks) {
        if (!localTask || !localTask.id || serverTaskMap.has(localTask.id) || deletedTasks.includes(localTask.id)) continue;
        if (localTask.localCreatedAt && (Date.now() - localTask.localCreatedAt < 30000)) {
          mergedTasks.push(localTask);
        } else if (!String(localTask.id).startsWith('TASK_0')) {
          saveDeletedTaskId(localTask.id);
        }
      }
    }

    const uid = currentUser.id;
    const newlyAssigned = mergedTasks.filter(t => {
      const assigned = Array.isArray(t.assignedMembers) && t.assignedMembers.includes(uid);
      const prev = prevTaskMap.get(t.id);
      const wasAssigned = prev && Array.isArray(prev.assignedMembers) && prev.assignedMembers.includes(uid);
      return assigned && !wasAssigned;
    });
    if (newlyAssigned.length > 0) {
      showToast('Lệnh điều động mới: ' + newlyAssigned[0].title);
    }

    currentTasks = deduplicateTasks(mergedTasks);
    if (Array.isArray(data.swaps)) currentSwaps = data.swaps;
    if (Array.isArray(data.leaves)) currentLeaves = data.leaves;

    saveLocalState();
    renderProfileData();
    renderDispatchHub();
    renderNotificationsModalList();
  } catch (err) {
    // Stay resilient offline
  }
}

function triggerInstantSync(delay = 80) {
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    syncRealtimeData();
  }, delay);
}

function restartAdaptivePolling() {
  if (currentSyncPollTimer) {
    clearInterval(currentSyncPollTimer);
    currentSyncPollTimer = null;
  }
  currentSyncPollTimer = setInterval(() => {
    if (currentUser && navigator.onLine && document.visibilityState === 'visible') {
      syncRealtimeData();
    }
  }, 20000);
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && currentUser && navigator.onLine) {
    syncRealtimeData();
  }
});
