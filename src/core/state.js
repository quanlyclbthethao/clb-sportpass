// SportPass V8.7 — Canonical Normalized Models, Multi-Role Merge, Overrides, Tombstones & RBAC

const DOB_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;
const DATA_CACHE_KEY = 'CLB_SPORTPASS_DATA_CACHE';
const OVERRIDES_KEY = 'CLB_MEMBER_OVERRIDES';
const DELETED_TASKS_KEY = 'CLB_DELETED_TASK_IDS';
const CUSTOM_ROLES_KEY = 'CLB_CUSTOM_ADMIN_ROLES';

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
  if (member.ngaySinh && DOB_REGEX.test(String(member.ngaySinh).trim())) return String(member.ngaySinh).trim();
  if (member.mssv && DOB_REGEX.test(String(member.mssv).trim())) return String(member.mssv).trim();
  const canonical = (typeof DEFAULT_MEMBERS_DIRECTORY !== 'undefined')
    ? DEFAULT_MEMBERS_DIRECTORY.find(x => x && x.id === member.id && DOB_REGEX.test(String(x.mssv || '').trim()))
    : null;
  if (canonical) return String(canonical.mssv).trim();
  const m = String(member.id || '').match(/(\d{2})(\d{2})$/);
  return m ? `${m[1]}/${m[2]}/2004` : '08/06/2003';
}

function getDisplayStudentCode(member) {
  if (!member) return 'DMC0806';
  if (member.studentCode && String(member.studentCode).trim()) return String(member.studentCode).trim();
  const rawMssv = String(member.mssv || '').trim();
  if (rawMssv && !DOB_REGEX.test(rawMssv)) return rawMssv;
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

function normalizeMember(raw) {
  if (!raw) return null;
  const copy = structuredClone(raw);
  const id = String(copy.id || '').trim();
  if (!id) return null;

  const shiftsDone = Math.max(0, Number(copy.soCaHoanThanh ?? copy.soCa ?? 0) || 0);
  const activitiesDone = Math.max(0, Number(copy.soCaSinhHoat ?? 0) || 0);
  const sdt = String(copy.sdt || '').trim();
  const ice = String(copy.ice || '').trim() || sdt;
  const boMon = String(copy.boMon || 'Ban Nhân Sự').trim();
  const cacBan = Array.isArray(copy.cacBan) && copy.cacBan.length > 0
    ? Array.from(new Set(copy.cacBan.map(x => String(x || '').trim()).filter(Boolean)))
    : (boMon ? [boMon] : []);

  copy.id = id;
  copy.hoTen = String(copy.hoTen || '').trim();
  copy.lop = String(copy.lop || '').trim();
  copy.boMon = boMon;
  copy.cacBan = cacBan;
  copy.chucVu = String(copy.chucVu || 'Thành viên').trim();
  copy.sdt = sdt;
  copy.ice = ice;
  copy.yTe = String(copy.yTe || 'Bình thường').trim();
  copy.theTrang = String(copy.theTrang || 'Khỏe mạnh (100% Sẵn sàng)').trim();
  copy.status = String(copy.status || 'Sẵn sàng').trim();
  copy.ngaySinh = formatMemberDob(copy);
  copy.studentCode = getDisplayStudentCode(copy);
  copy.soCaHoanThanh = shiftsDone;
  copy.soCa = shiftsDone;
  copy.soCaSinhHoat = activitiesDone;
  copy.isAdmin = id === 'DMC0806' ? true : Boolean(copy.isAdmin);
  copy.isShiftLeader = copy.isAdmin ? true : Boolean(copy.isShiftLeader);
  copy.donVi = copy.donVi || 'Trường Đại học Hải Dương';
  return copy;
}

function normalizeMembersDirectory(rawList) {
  const byId = new Map();
  for (const raw of (Array.isArray(rawList) ? rawList : [])) {
    const m = normalizeMember(raw);
    if (!m) continue;
    const prev = byId.get(m.id);
    if (!prev) {
      byId.set(m.id, m);
      continue;
    }
    for (const dept of m.cacBan) {
      if (!prev.cacBan.includes(dept)) prev.cacBan.push(dept);
    }
    const prevIsMemberOnly = prev.chucVu.toLowerCase().startsWith('thành viên');
    const nextIsMemberOnly = m.chucVu.toLowerCase().startsWith('thành viên');
    if ((m.isAdmin && !prev.isAdmin) || (m.isShiftLeader && !prev.isShiftLeader) || (prevIsMemberOnly && !nextIsMemberOnly)) {
      prev.chucVu = m.chucVu;
      prev.boMon = m.boMon;
    }
    prev.isAdmin = prev.isAdmin || m.isAdmin;
    prev.isShiftLeader = prev.isAdmin || prev.isShiftLeader || m.isShiftLeader;
    if (!prev.sdt && m.sdt) prev.sdt = m.sdt;
    if ((!prev.ice || prev.ice === prev.sdt) && m.ice) prev.ice = m.ice;
    if (prev.yTe === 'Bình thường' && m.yTe && m.yTe !== 'Bình thường') prev.yTe = m.yTe;
    if (prev.studentCode === prev.id && m.studentCode !== m.id) prev.studentCode = m.studentCode;
    prev.soCaHoanThanh = Math.max(prev.soCaHoanThanh, m.soCaHoanThanh);
    prev.soCa = prev.soCaHoanThanh;
    prev.soCaSinhHoat = Math.max(prev.soCaSinhHoat, m.soCaSinhHoat);
  }
  return Array.from(byId.values());
}

function normalizeTask(raw) {
  if (!raw || !raw.title) return null;
  const copy = structuredClone(raw);
  const uniq = (arr) => Array.from(new Set((Array.isArray(arr) ? arr : []).map(x => String(x || '').trim()).filter(Boolean)));
  copy.id = String(copy.id || ('TASK_' + Date.now())).trim();
  copy.title = String(copy.title).trim();
  copy.location = String(copy.location || 'SVĐ Trung Tâm').trim();
  copy.time = String(copy.time || '').trim();
  copy.date = String(copy.date || '').trim();
  copy.timeRange = String(copy.timeRange || copy.time.replace(/\s*\([^)]*\)\s*$/, '')).trim();
  copy.quota = Math.max(1, Number(copy.quota) || 4);
  copy.category = copy.category === 'activity' ? 'activity' : 'shift';
  copy.joinedMembers = uniq(copy.joinedMembers);
  copy.assignedMembers = uniq(copy.assignedMembers);
  copy.waitlist = uniq(copy.waitlist);
  copy.checkedInMembers = uniq(copy.checkedInMembers);
  copy.checkinLogs = Array.isArray(copy.checkinLogs) ? copy.checkinLogs : [];
  copy.departmentQuotas = (copy.departmentQuotas && typeof copy.departmentQuotas === 'object') ? copy.departmentQuotas : {};
  copy.status = copy.status || 'active';
  return copy;
}

function normalizeSwap(raw) {
  if (!raw) return null;
  const copy = structuredClone(raw);
  copy.id = String(copy.id || ('SWAP_' + Date.now()));
  copy.taskId = String(copy.taskId || '');
  copy.fromId = String(copy.fromId || copy.fromMemberId || '');
  copy.fromName = String(copy.fromName || copy.fromMemberName || copy.fromId);
  copy.fromClass = String(copy.fromClass || '');
  copy.toId = String(copy.toId || copy.toMemberId || 'CA_DIEU_PHOI');
  copy.toName = String(copy.toName || (copy.toId && !copy.toId.startsWith('CA_') ? copy.toId : 'Ban Điều Phối sắp xếp'));
  copy.currentShift = String(copy.currentShift || copy.taskTitle || copy.taskId);
  copy.reason = String(copy.reason || '');
  copy.type = copy.type || (copy.toId && !copy.toId.startsWith('CA_') ? 'swap' : 'transfer');
  copy.status = copy.status || 'pending';
  return copy;
}

function normalizeLeave(raw) {
  if (!raw) return null;
  const copy = structuredClone(raw);
  copy.id = String(copy.id || ('LEAVE_' + Date.now()));
  copy.taskId = String(copy.taskId || '');
  copy.memberId = String(copy.memberId || '');
  copy.memberName = String(copy.memberName || copy.memberId);
  copy.timeLabel = String(copy.timeLabel || `Ca ${copy.taskId}`);
  copy.reason = String(copy.reason || '');
  copy.urgent = Boolean(copy.urgent);
  copy.status = copy.status || 'pending';
  return copy;
}

function getTaskOccupancy(task, uid = '') {
  const occupied = Array.from(new Set([...(task?.joinedMembers || []), ...(task?.assignedMembers || [])]));
  const quota = Math.max(1, Number(task?.quota) || 4);
  return {
    occupied,
    quota,
    isFull: occupied.length >= quota,
    isMine: Boolean(uid && occupied.includes(uid)),
    isChecked: Boolean(uid && Array.isArray(task?.checkedInMembers) && task.checkedInMembers.includes(uid)),
    isWaitlisted: Boolean(uid && Array.isArray(task?.waitlist) && task.waitlist.includes(uid))
  };
}

function computeMemberStats(member) {
  if (!member) return { shiftsCount: 0, activitiesCount: 0 };
  const uid = String(member.id || '').trim();
  let shiftsCheckedIn = 0;
  let activitiesCheckedIn = 0;

  for (const t of deduplicateTasks(currentTasks || [])) {
    if (!t) continue;
    if (Array.isArray(t.checkedInMembers) && t.checkedInMembers.includes(uid)) {
      if (t.category === 'activity') activitiesCheckedIn++;
      else shiftsCheckedIn++;
    }
  }

  return {
    shiftsCount: Math.max(Number(member.soCaHoanThanh ?? member.soCa ?? 0) || 0, shiftsCheckedIn),
    activitiesCount: Math.max(Number(member.soCaSinhHoat ?? 0) || 0, activitiesCheckedIn)
  };
}

function adjustMemberCounter(memberId, metric, delta) {
  const targetId = String(memberId || '').trim();
  if (!targetId) return 0;
  const isActivity = metric === 'activity';
  const d = Number(delta) || 0;
  let nextVal = 0;
  let found = false;

  for (const m of (membersDirectory || [])) {
    if (m && m.id === targetId) {
      const cur = isActivity ? (Number(m.soCaSinhHoat) || 0) : (Number(m.soCaHoanThanh ?? m.soCa ?? 0) || 0);
      nextVal = Math.max(0, cur + d);
      if (isActivity) {
        m.soCaSinhHoat = nextVal;
        saveMemberOverride(targetId, { soCaSinhHoat: nextVal });
      } else {
        m.soCaHoanThanh = nextVal;
        m.soCa = nextVal;
        saveMemberOverride(targetId, { soCaHoanThanh: nextVal, soCa: nextVal });
      }
      found = true;
    }
  }

  if (currentUser && currentUser.id === targetId) {
    const curSelf = isActivity ? (Number(currentUser.soCaSinhHoat) || 0) : (Number(currentUser.soCaHoanThanh ?? currentUser.soCa ?? 0) || 0);
    if (!found) nextVal = Math.max(0, curSelf + d);
    if (isActivity) {
      currentUser.soCaSinhHoat = nextVal;
      saveMemberOverride(targetId, { soCaSinhHoat: nextVal });
    } else {
      currentUser.soCaHoanThanh = nextVal;
      currentUser.soCa = nextVal;
      saveMemberOverride(targetId, { soCaHoanThanh: nextVal, soCa: nextVal });
    }
    if (typeof persistUserSession === 'function') persistUserSession(currentUser);
  }
  return nextVal;
}

// ==================== PERSISTENT MEMBER OVERRIDES ====================
function getMemberOverrides() {
  try {
    return JSON.parse(localStorage.getItem(OVERRIDES_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function saveMemberOverride(memberId, patch) {
  if (!memberId || !patch || typeof patch !== 'object') return;
  const all = getMemberOverrides();
  all[memberId] = Object.assign({}, all[memberId] || {}, patch);
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all));
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
    return JSON.parse(localStorage.getItem(DELETED_TASKS_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveDeletedTaskId(id) {
  if (!id) return;
  const list = getDeletedTaskIds();
  if (!list.includes(id)) {
    list.push(id);
    try { localStorage.setItem(DELETED_TASKS_KEY, JSON.stringify(list)); } catch (e) {}
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
    const copy = normalizeTask(raw);
    if (!copy) continue;
    if (deleted.includes(copy.id)) continue;

    const semKey = `${copy.title.toLowerCase()}||${copy.time.toLowerCase()}||${copy.location.toLowerCase()}`;
    if (!map.has(semKey)) {
      map.set(semKey, copy);
    } else {
      const existing = map.get(semKey);
      if (/^TASK_\d+$/i.test(copy.id) && !/^TASK_\d+$/i.test(existing.id)) {
        existing.id = copy.id;
      }
      existing.joinedMembers = Array.from(new Set([...existing.joinedMembers, ...copy.joinedMembers]));
      existing.assignedMembers = Array.from(new Set([...existing.assignedMembers, ...copy.assignedMembers]));
      existing.waitlist = Array.from(new Set([...existing.waitlist, ...copy.waitlist]));
      existing.checkedInMembers = Array.from(new Set([...existing.checkedInMembers, ...copy.checkedInMembers]));
      if (copy.checkinLogs.length > existing.checkinLogs.length) existing.checkinLogs = copy.checkinLogs;
      existing.quota = Math.max(existing.quota, copy.quota);
      if (copy.category === 'activity') existing.category = 'activity';
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
    return JSON.parse(localStorage.getItem(CUSTOM_ROLES_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function saveCustomAdminRoles(roles) {
  try {
    localStorage.setItem(CUSTOM_ROLES_KEY, JSON.stringify(roles || {}));
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

function hydrateLocalStateFromCache() {
  const deletedTasks = getDeletedTaskIds();
  let loadedFromCache = false;
  try {
    const raw = localStorage.getItem(DATA_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const rawTasks = (Array.isArray(parsed.currentTasks) && parsed.currentTasks.length) ? parsed.currentTasks : DEFAULT_TASKS;
      currentTasks = deduplicateTasks(rawTasks.filter(t => t && !deletedTasks.includes(t.id) && !isStaleRemoteTestTask(t)));
      currentSwaps = (Array.isArray(parsed.currentSwaps) && parsed.currentSwaps.length)
        ? parsed.currentSwaps.map(normalizeSwap).filter(Boolean)
        : DEFAULT_SWAPS_SEED.map(normalizeSwap);
      currentLeaves = (Array.isArray(parsed.currentLeaves) && parsed.currentLeaves.length)
        ? parsed.currentLeaves.map(normalizeLeave).filter(Boolean)
        : DEFAULT_LEAVES_SEED.map(normalizeLeave);
      offlineMutationQueue = Array.isArray(parsed.offlineMutationQueue) ? parsed.offlineMutationQueue : [];
      loadedFromCache = true;
    }
  } catch (e) {}

  if (!loadedFromCache) {
    currentTasks = deduplicateTasks(DEFAULT_TASKS.filter(t => t && !deletedTasks.includes(t.id)));
    currentSwaps = DEFAULT_SWAPS_SEED.map(normalizeSwap);
    currentLeaves = DEFAULT_LEAVES_SEED.map(normalizeLeave);
    offlineMutationQueue = [];
  }
}

function saveLocalState() {
  try {
    const deletedTasks = getDeletedTaskIds();
    const cleanTasks = (currentTasks || []).filter(t => t && !deletedTasks.includes(t.id));
    localStorage.setItem(DATA_CACHE_KEY, JSON.stringify({
      currentTasks: cleanTasks,
      currentSwaps: currentSwaps || [],
      currentLeaves: currentLeaves || [],
      offlineMutationQueue: offlineMutationQueue || []
    }));
  } catch (e) {}
}

let currentUser = null;
let membersDirectory = normalizeMembersDirectory(typeof DEFAULT_MEMBERS_DIRECTORY !== 'undefined' ? DEFAULT_MEMBERS_DIRECTORY : []);
let currentTasks = deduplicateTasks(DEFAULT_TASKS);
let currentSwaps = DEFAULT_SWAPS_SEED.map(normalizeSwap);
let currentLeaves = DEFAULT_LEAVES_SEED.map(normalizeLeave);
let offlineMutationQueue = [];

let activeQrTaskId = null;
let unreadNotifSignature = '';
let currentApproveSubTab = 'swap'; // 'swap' | 'leave' | 'shifts' | 'scanner'
let currentMissionTab = 'shifts'; // 'shifts' | 'swap'
let currentDirDeptFilter = 'ALL';
let editingTaskId = null;
let selectedShiftLeaderId = 'DMC0806';
let currentSyncPollTimer = null;
