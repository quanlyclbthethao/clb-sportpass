// SportPass V8.6 — Canonical Reactive State, Member Overrides, Tombstones, Deduplication & RBAC

let currentUser = null;
let membersDirectory = (typeof DEFAULT_MEMBERS_DIRECTORY !== 'undefined') ? DEFAULT_MEMBERS_DIRECTORY.slice() : [];
let currentTasks = DEFAULT_TASKS.map(t => structuredClone(t));
let currentSwaps = DEFAULT_SWAPS_SEED.map(s => structuredClone(s));
let currentLeaves = DEFAULT_LEAVES_SEED.map(l => structuredClone(l));
let offlineMutationQueue = [];

let activeQrTaskId = null;
let unreadNotifSignature = '';
let currentApproveSubTab = 'swap'; // 'swap' | 'leave' | 'shifts' | 'scanner'
let currentMissionTab = 'shifts'; // 'shifts' | 'swap'
let currentDirDeptFilter = 'ALL';
let editingTaskId = null;
let selectedShiftLeaderId = 'DMC0806';
let currentSyncPollTimer = null;

function safeSetText(id, text) {
  const node = document.getElementById(id);
  if (node) node.textContent = (text === undefined || text === null) ? '' : String(text);
}

function safeSetValue(id, val) {
  const node = document.getElementById(id);
  if (node) node.value = (val === undefined || val === null) ? '' : String(val);
}

function getSportPassInitials(name) {
  if (!name) return 'SP';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function resolveAvatarUrl(member) {
  if (member && member.avatar && String(member.avatar).trim()) {
    return member.avatar;
  }
  return DEFAULT_VARSITY_AVATAR;
}

function formatTodayVN(offsetDays = 1) {
  const d = new Date(Date.now() + Number(offsetDays || 0) * 86400000);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatMemberDob(member) {
  if (!member) return '08/06/2003';
  if (member.ngaySinh && /\d{2}\/\d{2}\/\d{4}/.test(String(member.ngaySinh))) return String(member.ngaySinh).trim();
  if (member.mssv && /\d{2}\/\d{2}\/\d{4}/.test(String(member.mssv))) {
    return String(member.mssv).trim();
  }
  const canonical = (typeof DEFAULT_MEMBERS_DIRECTORY !== 'undefined')
    ? DEFAULT_MEMBERS_DIRECTORY.find(x => x && x.id === member.id)
    : null;
  if (canonical && canonical.mssv && /\d{2}\/\d{2}\/\d{4}/.test(String(canonical.mssv))) {
    return String(canonical.mssv).trim();
  }
  const m = String(member.id || '').match(/(\d{2})(\d{2})$/);
  return m ? `${m[1]}/${m[2]}/2004` : '08/06/2003';
}

function getDisplayStudentCode(member) {
  if (!member) return 'DMC0806';
  if (member.studentCode && String(member.studentCode).trim()) return String(member.studentCode).trim();
  return member.id || 'SP0000';
}

function getTheTrangTheme(theTrang) {
  const raw = String(theTrang || '');
  const lower = raw.toLowerCase();
  if (lower.includes('chấn thương') || lower.includes('nghỉ') || lower.includes('miễn')) {
    return { label: raw || 'Chấn thương nhẹ (Tạm miễn trực)', tone: 'danger', exempt: true };
  }
  if (lower.includes('hồi phục') || lower.includes('nhẹ')) {
    return { label: raw || 'Hồi phục nhẹ (Hỗ trợ bàn)', tone: 'warning', exempt: false };
  }
  return { label: raw || 'Khỏe mạnh (100% Sẵn sàng)', tone: 'success', exempt: false };
}

function formatShortTheTrang(theTrang) {
  const raw = String(theTrang || 'Khỏe mạnh');
  const lower = raw.toLowerCase();
  if (lower.includes('chấn thương') || lower.includes('nghỉ')) return 'Miễn trực';
  if (lower.includes('hồi phục')) return 'B';
  return 'A+';
}

function computeMemberStats(member) {
  if (!member) return { shiftsCount: 0, onTimeText: '100%', gradeText: 'A+' };
  const uid = String(member.id || '').trim();
  let checkedInTotal = 0;
  const completedOrLocked = [];
  const now = Date.now();

  for (const t of (currentTasks || [])) {
    if (!t) continue;
    const isChecked = Array.isArray(t.checkedInMembers) && t.checkedInMembers.includes(uid);
    if (isChecked) checkedInTotal++;
    const isAssignedOrJoined =
      (Array.isArray(t.joinedMembers) && t.joinedMembers.includes(uid)) ||
      (Array.isArray(t.assignedMembers) && t.assignedMembers.includes(uid));
    if (isAssignedOrJoined) {
      const deadlineMs = t.lockDeadline ? Date.parse(t.lockDeadline) : NaN;
      const pastDeadline = Number.isFinite(deadlineMs) && deadlineMs < now;
      if (isChecked || pastDeadline) completedOrLocked.push(isChecked);
    }
  }

  const shiftsCount = Math.max(Number(member.soCaHoanThanh ?? member.soCa ?? 0), checkedInTotal);
  let onTimeText = '100%';
  if (completedOrLocked.length > 0) {
    const attended = completedOrLocked.filter(Boolean).length;
    onTimeText = `${Math.round((attended / completedOrLocked.length) * 100)}%`;
  } else if (shiftsCount === 0 && member.onTimeRate) {
    onTimeText = String(member.onTimeRate);
  }

  return {
    shiftsCount,
    onTimeText,
    gradeText: formatShortTheTrang(member.theTrang)
  };
}

// ==================== PERSISTENT MEMBER OVERRIDES ====================
function getMemberOverrides() {
  try {
    return JSON.parse(localStorage.getItem('CLB_MEMBER_OVERRIDES') || '{}');
  } catch (e) {
    return {};
  }
}

function saveMemberOverride(memberId, patch) {
  if (!memberId || !patch || typeof patch !== 'object') return;
  const all = getMemberOverrides();
  all[memberId] = Object.assign({}, all[memberId] || {}, patch);
  try {
    localStorage.setItem('CLB_MEMBER_OVERRIDES', JSON.stringify(all));
  } catch (e) {}
}

function applyMemberOverrides(members) {
  const all = getMemberOverrides();
  if (Array.isArray(members)) {
    for (const m of members) {
      if (m && m.id && all[m.id]) {
        Object.assign(m, all[m.id]);
      }
    }
  }
  if (currentUser && currentUser.id && all[currentUser.id]) {
    Object.assign(currentUser, all[currentUser.id]);
  }
  applyCustomAdminRoles(members);
}

// ==================== TOMBSTONES ANTI-RESURRECTION ====================
function getDeletedTaskIds() {
  try {
    return JSON.parse(localStorage.getItem('CLB_DELETED_TASK_IDS') || '[]');
  } catch (e) {
    return [];
  }
}

function saveDeletedTaskId(id) {
  if (!id) return;
  const list = getDeletedTaskIds();
  if (!list.includes(id)) {
    list.push(id);
    try { localStorage.setItem('CLB_DELETED_TASK_IDS', JSON.stringify(list)); } catch (e) {}
  }
}

// ==================== SEMANTIC TASK DEDUPLICATION ====================
function isStaleRemoteTestTask(t) {
  if (!t) return true;
  const id = String(t.id || '');
  const title = String(t.title || '');
  return id.startsWith('MUT_TASK_') || id.startsWith('TASK_TEST_WITHDRAW_') || id.startsWith('TASK_ROTATION_') || title === 'Task Test';
}

function deduplicateTasks(tasks) {
  if (!Array.isArray(tasks)) return [];
  const deleted = getDeletedTaskIds();
  const map = new Map();

  for (const raw of tasks) {
    if (!raw || !raw.title) continue;
    if (deleted.includes(raw.id)) continue;

    const copy = structuredClone(raw);
    copy.joinedMembers = Array.isArray(copy.joinedMembers) ? copy.joinedMembers : [];
    copy.assignedMembers = Array.isArray(copy.assignedMembers) ? copy.assignedMembers : [];
    copy.waitlist = Array.isArray(copy.waitlist) ? copy.waitlist : [];
    copy.checkedInMembers = Array.isArray(copy.checkedInMembers) ? copy.checkedInMembers : [];
    copy.checkinLogs = Array.isArray(copy.checkinLogs) ? copy.checkinLogs : [];
    copy.departmentQuotas = (copy.departmentQuotas && typeof copy.departmentQuotas === 'object') ? copy.departmentQuotas : {};

    const semKey = String(copy.title).trim().toLowerCase() + '||' + String(copy.time || '').trim().toLowerCase();
    if (!map.has(semKey)) {
      map.set(semKey, copy);
    } else {
      const existing = map.get(semKey);
      if (/^TASK_\d+$/i.test(String(copy.id)) && !/^TASK_\d+$/i.test(String(existing.id))) {
        existing.id = copy.id;
      }
      existing.joinedMembers = Array.from(new Set([...existing.joinedMembers, ...copy.joinedMembers]));
      existing.assignedMembers = Array.from(new Set([...existing.assignedMembers, ...copy.assignedMembers]));
      existing.waitlist = Array.from(new Set([...existing.waitlist, ...copy.waitlist]));
      existing.checkedInMembers = Array.from(new Set([...existing.checkedInMembers, ...copy.checkedInMembers]));
      existing.quota = Math.max(Number(existing.quota) || 0, Number(copy.quota) || 0);
      if (!existing.location && copy.location) existing.location = copy.location;
      if (!existing.notes && copy.notes) existing.notes = copy.notes;
      if (Object.keys(existing.departmentQuotas).length === 0 && Object.keys(copy.departmentQuotas).length > 0) {
        existing.departmentQuotas = copy.departmentQuotas;
      }
    }
  }
  return Array.from(map.values());
}

// ==================== CUSTOM RBAC & SOLE ADMIN INVARIANT ====================
function getCustomAdminRoles() {
  try {
    return JSON.parse(localStorage.getItem('CLB_CUSTOM_ADMIN_ROLES') || '{}');
  } catch (e) {
    return {};
  }
}

function saveCustomAdminRoles(roles) {
  try {
    localStorage.setItem('CLB_CUSTOM_ADMIN_ROLES', JSON.stringify(roles || {}));
  } catch (e) {}
}

function applyCustomAdminRoles(members) {
  if (!Array.isArray(members)) return;
  const custom = getCustomAdminRoles();

  for (const m of members) {
    if (!m) continue;
    if (m.id === 'DMC0806') {
      m.isAdmin = true;
      m.isShiftLeader = true;
      continue;
    }
    if (custom[m.id]) {
      m.isAdmin = Boolean(custom[m.id].isAdmin);
      m.isShiftLeader = m.isAdmin ? true : Boolean(custom[m.id].isShiftLeader);
    } else {
      m.isAdmin = false;
    }
  }

  if (currentUser) {
    if (currentUser.id === 'DMC0806') {
      currentUser.isAdmin = true;
      currentUser.isShiftLeader = true;
    } else if (custom[currentUser.id]) {
      currentUser.isAdmin = Boolean(custom[currentUser.id].isAdmin);
      currentUser.isShiftLeader = currentUser.isAdmin ? true : Boolean(custom[currentUser.id].isShiftLeader);
    } else {
      currentUser.isAdmin = false;
    }
  }
}

function saveLocalState() {
  try {
    const deletedTasks = getDeletedTaskIds();
    const cleanTasks = (currentTasks || []).filter(t => t && !deletedTasks.includes(t.id));
    localStorage.setItem('CLB_SPORTPASS_DATA_CACHE', JSON.stringify({
      currentTasks: cleanTasks,
      currentSwaps: currentSwaps || [],
      currentLeaves: currentLeaves || [],
      offlineMutationQueue: offlineMutationQueue || []
    }));
  } catch (e) {}
}
