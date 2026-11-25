// SportPass V8.7 — Bidirectional Google Apps Script Sync & Offline Mutation Queue

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
  if (mut.type === 'DELETE_TASK') return `${GAS_API_URL}?action=deleteTask&taskId=${encodeURIComponent(p.taskId || '')}`;
  if (mut.type === 'CREATE_TASK') return `${GAS_API_URL}?action=createTask&task=${encodeURIComponent(JSON.stringify(p))}`;
  if (mut.type === 'CLAIM_TASK') return `${GAS_API_URL}?action=claimTask&taskId=${encodeURIComponent(p.taskId || '')}&memberId=${encodeURIComponent(p.memberId || '')}&waitlist=${Boolean(p.waitlist)}`;
  if (mut.type === 'WITHDRAW_TASK') return `${GAS_API_URL}?action=withdrawTask&taskId=${encodeURIComponent(p.taskId || '')}&memberId=${encodeURIComponent(p.memberId || '')}&reason=${encodeURIComponent(p.reason || '')}`;
  if (mut.type === 'QR_CHECKIN') return `${GAS_API_URL}?action=checkinMember&taskId=${encodeURIComponent(p.taskId || '')}&memberId=${encodeURIComponent(p.memberId || '')}&adminId=${encodeURIComponent(p.scannerId || p.adminId || '')}`;
  if (mut.type === 'SHIFT_ADJUST') return `${GAS_API_URL}?action=adjustMemberShifts&memberId=${encodeURIComponent(p.memberId || '')}&delta=${encodeURIComponent(p.delta || 0)}&metric=${encodeURIComponent(p.metric || 'shift')}&reason=${encodeURIComponent(p.reason || '')}&adminActorId=${encodeURIComponent(p.adminActorId || '')}`;
  if (mut.type === 'UPDATE_ROLE') return `${GAS_API_URL}?action=updateMemberRole&memberId=${encodeURIComponent(p.memberId || '')}&isAdmin=${Boolean(p.isAdmin)}&isShiftLeader=${Boolean(p.isShiftLeader)}&adminActorId=${encodeURIComponent(p.adminActorId || '')}`;
  if (mut.type === 'UPDATE_PROFILE') return `${GAS_API_URL}?action=updateProfile&memberId=${encodeURIComponent(p.memberId || '')}&hoTen=${encodeURIComponent(p.hoTen || '')}&studentCode=${encodeURIComponent(p.studentCode || '')}&lop=${encodeURIComponent(p.lop || '')}&boMon=${encodeURIComponent(p.boMon || '')}&chucVu=${encodeURIComponent(p.chucVu || '')}&sdt=${encodeURIComponent(p.sdt || '')}&ice=${encodeURIComponent(p.ice || '')}&yTe=${encodeURIComponent(p.yTe || '')}`;
  return null;
}

function dispatchBackendMutation(type, payload) {
  const url = buildMutationUrl({ type, payload });
  if (navigator.onLine && url) {
    fetch(url).catch(() => enqueueOfflineMutation(type, payload));
  } else {
    enqueueOfflineMutation(type, payload);
  }
}

async function syncOfflineMutations(isManual = false) {
  if (!navigator.onLine || !Array.isArray(offlineMutationQueue) || offlineMutationQueue.length === 0) return;
  const batch = offlineMutationQueue.splice(0, offlineMutationQueue.length);
  saveLocalState();

  const failed = [];
  let pushedCount = 0;

  for (const mut of batch) {
    try {
      if (mut && mut.type === 'CREATE_TASK') {
        await fetch(`${GAS_API_URL}?action=createTask`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'createTask', task: mut.payload })
        });
        pushedCount++;
      } else {
        const url = buildMutationUrl(mut);
        if (!url) continue;
        await fetch(url);
        pushedCount++;
      }
    } catch (e) {
      failed.push(mut);
    }
  }

  if (failed.length > 0) {
    offlineMutationQueue.push(...failed);
    saveLocalState();
  }
  if (isManual && pushedCount > 0) showToast(`Đã đẩy ${pushedCount} thay đổi lên máy chủ.`);
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
    if (offlineMutationQueue.length > 0) {
      await syncOfflineMutations(false);
    }
    const res = await fetch(`${GAS_API_URL}?action=syncAll&memberId=${encodeURIComponent(currentUser.id)}`);
    const data = await res.json();
    if (!data || !data.success) return;

    if (Array.isArray(data.deletedTaskIds)) {
      data.deletedTaskIds.forEach(id => saveDeletedTaskId(id));
    }

    if (Array.isArray(data.membersList) && data.membersList.length > 0) {
      membersDirectory = normalizeMembersDirectory(data.membersList);
      applyMemberOverrides(membersDirectory);
    }

    if (data.member) {
      const preservedAvatar = currentUser.avatar || '';
      const preservedStudentCode = currentUser.studentCode || '';
      const preservedDob = currentUser.ngaySinh || '';
      const remoteStudentCode = String(data.member.studentCode || '').trim();
      currentUser = normalizeMember(Object.assign({}, currentUser, data.member));
      if (!currentUser.avatar && preservedAvatar) currentUser.avatar = preservedAvatar;
      if ((!remoteStudentCode || remoteStudentCode === currentUser.id) && preservedStudentCode && preservedStudentCode !== currentUser.id) {
        currentUser.studentCode = preservedStudentCode;
      }
      if ((!data.member.ngaySinh || !DOB_REGEX.test(String(data.member.ngaySinh).trim())) && preservedDob) {
        currentUser.ngaySinh = preservedDob;
      }
      applyMemberOverrides(membersDirectory);
      window.currentUser = currentUser;
    }

    const deletedTasks = getDeletedTaskIds();
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

    currentTasks = deduplicateTasks(mergedTasks);
    if (Array.isArray(data.swaps) && data.swaps.length > 0) currentSwaps = data.swaps.map(normalizeSwap).filter(Boolean);
    if (Array.isArray(data.leaves) && data.leaves.length > 0) currentLeaves = data.leaves.map(normalizeLeave).filter(Boolean);

    saveLocalState();
    renderProfileData();
    renderDispatchHub();
    renderMembersModalList();
    renderNotificationsModalList();
  } catch (err) {
    // Stay resilient offline
  }
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

window.addEventListener('online', () => {
  if (currentUser) syncRealtimeData();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && currentUser && navigator.onLine) {
    syncRealtimeData();
  }
});
