// SportPass V6.0 — Fair Shift Rotation Algorithm & Schedule Conflict Detector

function parseShiftTimeRange(timeStr) {
  if (!timeStr) return null;
  const m = String(timeStr).match(/(\d{1,2})[:h](\d{2})\s*[-–]\s*(\d{1,2})[:h](\d{2})(.*)$/i);
  if (!m) return null;
  const start = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  const end = parseInt(m[3], 10) * 60 + parseInt(m[4], 10);
  const day = String(m[5] || '').trim().toLowerCase();
  return { start, end, day };
}

function checkShiftTimeConflict(taskA, taskB) {
  if (!taskA || !taskB || taskA.id === taskB.id) return false;
  const rA = parseShiftTimeRange(taskA.time);
  const rB = parseShiftTimeRange(taskB.time);
  if (!rA || !rB) return false;
  if (rA.day && rB.day && rA.day !== rB.day) return false;
  return rA.start < rB.end && rB.start < rA.end;
}

function hasShiftTimeConflict(memberId, targetTask) {
  if (!memberId || !targetTask) return false;
  for (const t of (currentTasks || [])) {
    if (!t || t.id === targetTask.id) continue;
    const involved =
      (Array.isArray(t.joinedMembers) && t.joinedMembers.includes(memberId)) ||
      (Array.isArray(t.assignedMembers) && t.assignedMembers.includes(memberId));
    if (involved && checkShiftTimeConflict(t, targetTask)) {
      return true;
    }
  }
  return false;
}

function calculateSmartRotation(task) {
  if (!task) return [];
  const totalQuota = Number(task.quota) || 4;
  const existing = new Set([...(task.joinedMembers || []), ...(task.assignedMembers || [])]);
  const usedIds = new Set(existing);
  const picked = [];

  const deptQuotas = (task.departmentQuotas && typeof task.departmentQuotas === 'object')
    ? Object.entries(task.departmentQuotas).filter(([, q]) => Number(q) > 0)
    : [];

  // Deduplicate multi-department records per member ID for fair comparison
  const uniqueMembers = [];
  const seenMemIds = new Set();
  for (const m of (membersDirectory || [])) {
    if (!m || !m.id || seenMemIds.has(m.id)) continue;
    seenMemIds.add(m.id);
    uniqueMembers.push(m);
  }

  const pickForBucket = (deptFilter, neededCount) => {
    const candidates = (membersDirectory || []).filter(m => {
      if (!m || !m.id || usedIds.has(m.id)) return false;
      if (deptFilter && m.boMon !== deptFilter) return false;
      const theme = getTheTrangTheme(m.theTrang);
      if (theme.exempt) return false;
      const hasTimeConflict = hasShiftTimeConflict(m.id, task);
      if (hasTimeConflict) return false;
      return true;
    });

    const uniqueById = [];
    const bucketSeen = new Set();
    for (const c of candidates) {
      if (!bucketSeen.has(c.id)) {
        bucketSeen.add(c.id);
        uniqueById.push(c);
      }
    }

    uniqueById.sort((a, b) => {
      const doneA = Number(a.soCaHoanThanh ?? a.soCa ?? 0);
      const doneB = Number(b.soCaHoanThanh ?? b.soCa ?? 0);
      return doneA - doneB;
    });

    for (const m of uniqueById) {
      if (picked.length + existing.size >= totalQuota) break;
      if (neededCount <= 0) break;
      usedIds.add(m.id);
      picked.push({ member: m, dept: deptFilter || m.boMon || 'CLB Thể Thao' });
      neededCount--;
    }
  };

  if (deptQuotas.length > 0) {
    for (const [deptName, q] of deptQuotas) {
      pickForBucket(deptName, Number(q));
    }
  } else {
    pickForBucket(null, Math.max(0, totalQuota - existing.size));
  }

  return picked;
}

function openSmartRotationModal(taskId) {
  const task = (currentTasks || []).find(t => t.id === taskId);
  if (!task) return;
  pendingSmartRotationTaskId = taskId;
  pendingSmartRotationCandidates = calculateSmartRotation(task);

  const box = document.getElementById('smartRotationResultsContainer');
  if (box) {
    if (pendingSmartRotationCandidates.length === 0) {
      box.innerHTML = '<div class="sp-empty">Không còn thành viên phù hợp (đã đủ quân số, đang miễn trực y tế hoặc trùng lịch ca khác).</div>';
    } else {
      box.innerHTML = pendingSmartRotationCandidates.map((item, idx) => `
        <div class="member-item-card sp-card stagger-item">
          <div>
            <div style="font-weight:700;font-size:14px;">${idx + 1}. ${escapeHtml(item.member.hoTen)}</div>
            <div style="font-size:12px;color:var(--sp-text2);">${escapeHtml(item.dept)} • <span class="mono-num">${escapeHtml(item.member.id)}</span></div>
          </div>
          <span class="sp-badge sp-badge-accent mono-num">${Number(item.member.soCaHoanThanh || item.member.soCa || 0)} ca</span>
        </div>
      `).join('');
    }
  }

  openGenericModal('modalSmartRotation');
}

async function applySmartRotationCandidates() {
  const task = (currentTasks || []).find(t => t.id === pendingSmartRotationTaskId);
  if (!task || !Array.isArray(pendingSmartRotationCandidates) || pendingSmartRotationCandidates.length === 0) {
    closeSmartRotationModal();
    return;
  }
  task.assignedMembers = Array.isArray(task.assignedMembers) ? task.assignedMembers : [];
  for (const item of pendingSmartRotationCandidates) {
    if (item && item.member && !task.assignedMembers.includes(item.member.id)) {
      task.assignedMembers.push(item.member.id);
    }
  }
  saveLocalState();
  syncTaskToBackend(task);
  renderTasksList();
  closeSmartRotationModal();
  showAquaIsland(`Đã phân bổ xoay tua ${pendingSmartRotationCandidates.length} thành viên.`, '⚡');
}

function closeSmartRotationModal() {
  closeGenericModal('modalSmartRotation');
}
