// SportPass V8.7 — Bidirectional Google Apps Script Sync & Offline Mutation Queue

let syncInFlightPromise = null;

function enqueueOfflineMutation(type, payload) {
  offlineMutationQueue.push({
    id: 'MUT_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    type,
    payload: payload || {},
    createdAt: Date.now()
  });
  saveLocalState();
}

function reconcileMutationResponse(type, payload, data) {
  if (!data || data.success !== true) return;
  if (type === 'UPDATE_ROLE' && payload && payload.memberId) {
    const custom = getCustomAdminRoles();
    if (custom[payload.memberId]) {
      custom[payload.memberId].synced = true;
      saveCustomAdminRoles(custom);
    }
    return;
  }
  if (type === 'SHIFT_ADJUST' && payload && payload.memberId && typeof data.newShifts === 'number') {
    const mid = String(payload.memberId).trim();
    const isActivity = payload.metric === 'activity';
    const offsetKey = isActivity ? 'activityOffset' : 'shiftOffset';
    const serverTotal = Math.max(0, Number(data.newShifts) || 0);
    const delta = Number(payload.delta) || 0;
    const counts = getMemberTaskCheckinCounts(mid);
    const taskCount = isActivity ? counts.activitiesCheckedIn : counts.shiftsCheckedIn;

    serverMemberCounters[mid] = Object.assign(
      {},
      serverMemberCounters[mid] || {},
      isActivity ? { soCaSinhHoat: serverTotal } : { soCaHoanThanh: serverTotal }
    );

    let nextOffset = 0;
    const applyOne = (m) => {
      const curOffset = Number(m[offsetKey]) || 0;
      const targetDisplayed = Math.max(0, serverTotal + (curOffset - delta));
      const baseVal = Math.max(serverTotal, taskCount);
      nextOffset = targetDisplayed - baseVal;
      if (isActivity) {
        m.soCaSinhHoat = serverTotal;
      } else {
        m.soCaHoanThanh = serverTotal;
        m.soCa = serverTotal;
      }
      m[offsetKey] = nextOffset;
    };

    for (const m of (membersDirectory || [])) {
      if (m && m.id === mid) applyOne(m);
    }
    if (currentUser && currentUser.id === mid) {
      applyOne(currentUser);
      if (typeof persistUserSession === 'function') persistUserSession(currentUser);
    }

    if (nextOffset === 0) clearMemberOverrideKeys(mid, [offsetKey]);
    else saveMemberOverride(mid, { [offsetKey]: nextOffset });

    saveLocalState();
    if (currentUser && currentUser.id === mid && typeof renderProfileData === 'function') renderProfileData();
    if (typeof renderMembersModalList === 'function') renderMembersModalList();
  }
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
    fetch(url)
      .then((res) => (res && res.ok ? res.json().catch(() => null) : null))
      .then((data) => reconcileMutationResponse(type, payload, data))
      .catch(() => enqueueOfflineMutation(type, payload));
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
        const res = await fetch(url);
        const data = (res && res.ok) ? await res.json().catch(() => null) : null;
        reconcileMutationResponse(mut.type, mut.payload, data);
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
  if (syncInFlightPromise) return syncInFlightPromise;

  syncInFlightPromise = (async () => {
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
        const nextServerCounters = {};
        const customRoles = getCustomAdminRoles();
        let rolesChanged = false;
        for (const m of membersDirectory) {
          if (!m || !m.id) continue;
          nextServerCounters[m.id] = {
            soCaHoanThanh: Math.max(0, Number(m.soCaHoanThanh) || 0),
            soCaSinhHoat: Math.max(0, Number(m.soCaSinhHoat) || 0)
          };
          if (customRoles[m.id] && customRoles[m.id].synced) {
            delete customRoles[m.id];
            rolesChanged = true;
          }
        }
        serverMemberCounters = nextServerCounters;
        if (rolesChanged) saveCustomAdminRoles(customRoles);
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
        serverMemberCounters[currentUser.id] = {
          soCaHoanThanh: Math.max(0, Number(currentUser.soCaHoanThanh) || 0),
          soCaSinhHoat: Math.max(0, Number(currentUser.soCaSinhHoat) || 0)
        };
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
      if (Array.isArray(data.swaps) && data.swaps.length > 0) {
        const serverSwaps = data.swaps.map(normalizeSwap).filter(Boolean);
        const serverIds = new Set(serverSwaps.map(s => s.id));
        const preservedLocal = (currentSwaps || []).filter(s => s && s.id && !serverIds.has(s.id));
        currentSwaps = [...serverSwaps, ...preservedLocal];
      }
      if (Array.isArray(data.leaves) && data.leaves.length > 0) {
        const serverLeaves = data.leaves.map(normalizeLeave).filter(Boolean);
        const serverIds = new Set(serverLeaves.map(l => l.id));
        const preservedLocal = (currentLeaves || []).filter(l => l && l.id && !serverIds.has(l.id));
        currentLeaves = [...serverLeaves, ...preservedLocal];
      }

      saveLocalState();
      renderProfileData();
      renderDispatchHub();
      renderMembersModalList();
      renderNotificationsModalList();
    } catch (err) {
      // Stay resilient offline
    } finally {
      syncInFlightPromise = null;
    }
  })();

  return syncInFlightPromise;
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
