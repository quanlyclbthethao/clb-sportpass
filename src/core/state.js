// SportPass V8.8 — Canonical Normalized Models, Multi-Role Merge, Overrides, Tombstones & RBAC

const DOB_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;
const DATA_CACHE_KEY = 'CLB_SPORTPASS_DATA_CACHE';
const OVERRIDES_KEY = 'CLB_MEMBER_OVERRIDES';
const DELETED_TASKS_KEY = 'CLB_DELETED_TASK_IDS';
const DELETED_MEMBERS_KEY = 'CLB_DELETED_MEMBER_IDS';
const CUSTOM_MEMBERS_KEY = 'CLB_CUSTOM_MEMBERS';
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

function normalizePhoneVN(val) {
  if (val === undefined || val === null) return '';
  let digits = String(val).trim().replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('84') && digits.length >= 11) {
    digits = '0' + digits.slice(2);
  } else if (!digits.startsWith('0') && digits.length === 9) {
    digits = '0' + digits;
  }
  return digits;
}

function normalizeRoleValue(rawRole) {
  const r = String(rawRole || '').trim().toLowerCase();
  if (!r) return 'Thành viên';
  if (r.includes('phó chủ nhiệm')) return 'Phó chủ nhiệm';
  if (r.includes('chủ nhiệm')) return 'Chủ nhiệm';
  if (r.includes('trưởng ban')) return 'Trưởng ban';
  if (r.includes('phó ban')) return 'Phó ban';
  if (r.includes('thư ký')) return 'Thư ký';
  if (r.includes('thủ quỹ')) return 'Thủ quỹ';
  return 'Thành viên';
}

function generateClientMemberId(hoTen, dob, extraReserved = []) {
  let clean = String(hoTen || '').trim().replace(/Đ/g, 'D').replace(/đ/g, 'd');
  try {
    clean = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch (e) {}
  const words = clean.split(/\s+/).filter(Boolean);
  let initials = words.map(w => w.charAt(0).toUpperCase()).join('');
  if (!initials) initials = 'SP';

  let ddmm = '0101';
  const m = String(dob || '').match(/(\d{1,2})[\/\-](\d{1,2})/);
  if (m) {
    ddmm = String(parseInt(m[1], 10)).padStart(2, '0') + String(parseInt(m[2], 10)).padStart(2, '0');
  }
  const baseId = `${initials}${ddmm}`.toUpperCase();
  const used = new Set([
    ...(Array.isArray(membersDirectory) ? membersDirectory : []).map(x => String(x?.id || '').toUpperCase()),
    ...getDeletedMemberIds().map(x => String(x).toUpperCase()),
    ...(Array.isArray(extraReserved) ? extraReserved : []).map(x => String(x || '').toUpperCase())
  ]);
  if (!used.has(baseId)) return baseId;
  let suffix = 2;
  while (used.has(`${baseId}${suffix}`)) suffix++;
  return `${baseId}${suffix}`;
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
  if (!member) return '';
  const idUpper = String(member.id || '').trim().toUpperCase();
  const candidates = [member.studentCode, member.mssv];
  for (const raw of candidates) {
    const clean = String(raw || '').trim();
    if (!clean) continue;
    if (DOB_REGEX.test(clean)) continue;
    if (idUpper && clean.toUpperCase() === idUpper) continue;
    return clean;
  }
  return '';
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
  copy.mssv = copy.studentCode;
  copy.soCaHoanThanh = shiftsDone;
  copy.soCa = shiftsDone;
  copy.soCaSinhHoat = activitiesDone;
  copy.shiftOffset = Number(copy.shiftOffset) || 0;
  copy.activityOffset = Number(copy.activityOffset) || 0;
  copy.isAdmin = id === 'DMC0806' ? true : Boolean(copy.isAdmin);
  copy.isShiftLeader = copy.isAdmin ? true : Boolean(copy.isShiftLeader);
  copy.hasCustomPassword = Boolean(copy.hasCustomPassword);
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
    prev.hasCustomPassword = prev.hasCustomPassword || m.hasCustomPassword;
    if (!prev.sdt && m.sdt) prev.sdt = m.sdt;
    if ((!prev.ice || prev.ice === prev.sdt) && m.ice) prev.ice = m.ice;
    if (prev.yTe === 'Bình thường' && m.yTe && m.yTe !== 'Bình thường') prev.yTe = m.yTe;
    if (!prev.studentCode && m.studentCode) {
      prev.studentCode = m.studentCode;
      prev.mssv = m.studentCode;
    }
    prev.soCaHoanThanh = Math.max(prev.soCaHoanThanh, m.soCaHoanThanh);
    prev.soCa = prev.soCaHoanThanh;
    prev.soCaSinhHoat = Math.max(prev.soCaSinhHoat, m.soCaSinhHoat);
    if (!prev.shiftOffset && m.shiftOffset) prev.shiftOffset = m.shiftOffset;
    if (!prev.activityOffset && m.activityOffset) prev.activityOffset = m.activityOffset;
  }
  return Array.from(byId.values());
}

function normalizeTask(raw) {
  if (!raw || !raw.title) return null;
  const copy = structuredClone(raw);
  const uniq = (arr) => Array.from(new Set((Array.isArray(arr) ? arr : []).map(x => String(x || '').trim()).filter(Boolean)));
  const rawTime = String(copy.time || '').trim();
  const dateMatch = rawTime.match(/\((\d{1,2}\/\d{1,2}\/\d{4})\)\s*$/);
  copy.id = String(copy.id || ('TASK_' + Date.now())).trim();
  copy.title = String(copy.title).trim();
  copy.location = String(copy.location || 'SVĐ Trung Tâm').trim();
  copy.time = rawTime;
  copy.date = String(copy.date || (dateMatch ? dateMatch[1] : '')).trim();
  copy.timeRange = String(copy.timeRange || rawTime.replace(/\s*\([^)]*\)\s*$/, '')).trim();
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

function getMemberTaskCheckinCounts(uid) {
  let shiftsCheckedIn = 0;
  let activitiesCheckedIn = 0;
  if (!uid) return { shiftsCheckedIn, activitiesCheckedIn };

  for (const t of deduplicateTasks(currentTasks || [])) {
    if (!t) continue;
    if (Array.isArray(t.checkedInMembers) && t.checkedInMembers.includes(uid)) {
      if (t.category === 'activity') activitiesCheckedIn++;
      else shiftsCheckedIn++;
    }
  }
  return { shiftsCheckedIn, activitiesCheckedIn };
}

function computeMemberStats(member) {
  if (!member) return { shiftsCount: 0, activitiesCount: 0 };
  const uid = String(member.id || '').trim();
  const { shiftsCheckedIn, activitiesCheckedIn } = getMemberTaskCheckinCounts(uid);
  const baseShifts = Math.max(Number(member.soCaHoanThanh ?? member.soCa ?? 0) || 0, shiftsCheckedIn);
  const baseActivities = Math.max(Number(member.soCaSinhHoat ?? 0) || 0, activitiesCheckedIn);

  return {
    shiftsCount: Math.max(0, baseShifts + (Number(member.shiftOffset) || 0)),
    activitiesCount: Math.max(0, baseActivities + (Number(member.activityOffset) || 0))
  };
}

function adjustMemberCounter(memberId, metric, delta, source = 'manual') {
  const targetId = String(memberId || '').trim();
  if (!targetId) return 0;
  const isActivity = metric === 'activity';
  const d = Number(delta) || 0;
  const counts = getMemberTaskCheckinCounts(targetId);
  const taskCount = isActivity ? counts.activitiesCheckedIn : counts.shiftsCheckedIn;

  const applyToMember = (m) => {
    if (source === 'task') {
      const curRaw = isActivity ? (Number(m.soCaSinhHoat) || 0) : (Number(m.soCaHoanThanh ?? m.soCa ?? 0) || 0);
      const nextRaw = Math.max(0, curRaw + d);
      if (isActivity) {
        m.soCaSinhHoat = nextRaw;
        const nextBase = Math.max(nextRaw, taskCount);
        m.activityOffset = Math.max(-nextBase, Number(m.activityOffset) || 0);
        return {
          nextDisplayed: Math.max(0, nextBase + m.activityOffset),
          inMemPatch: { soCaSinhHoat: nextRaw, activityOffset: m.activityOffset },
          overridePatch: { activityOffset: m.activityOffset }
        };
      }
      m.soCaHoanThanh = nextRaw;
      m.soCa = nextRaw;
      const nextBase = Math.max(nextRaw, taskCount);
      m.shiftOffset = Math.max(-nextBase, Number(m.shiftOffset) || 0);
      return {
        nextDisplayed: Math.max(0, nextBase + m.shiftOffset),
        inMemPatch: { soCaHoanThanh: nextRaw, soCa: nextRaw, shiftOffset: m.shiftOffset },
        overridePatch: { shiftOffset: m.shiftOffset }
      };
    }

    const stats = computeMemberStats(m);
    const curDisplayed = isActivity ? stats.activitiesCount : stats.shiftsCount;
    const nextDisplayed = Math.max(0, curDisplayed + d);
    const curRaw = isActivity ? (Number(m.soCaSinhHoat) || 0) : (Number(m.soCaHoanThanh ?? m.soCa ?? 0) || 0);
    const baseVal = Math.max(curRaw, taskCount);
    const nextOffset = nextDisplayed - baseVal;
    if (isActivity) {
      m.activityOffset = nextOffset;
      return { nextDisplayed, inMemPatch: { activityOffset: nextOffset }, overridePatch: { activityOffset: nextOffset } };
    }
    m.shiftOffset = nextOffset;
    return { nextDisplayed, inMemPatch: { shiftOffset: nextOffset }, overridePatch: { shiftOffset: nextOffset } };
  };

  let nextVal = 0;
  let found = false;
  let savedMemPatch = null;
  let savedOverridePatch = null;

  for (const m of (membersDirectory || [])) {
    if (m && m.id === targetId) {
      const res = applyToMember(m);
      nextVal = res.nextDisplayed;
      savedMemPatch = res.inMemPatch;
      savedOverridePatch = res.overridePatch;
      found = true;
    }
  }

  if (currentUser && currentUser.id === targetId) {
    if (found && savedMemPatch) {
      Object.assign(currentUser, savedMemPatch);
    } else {
      const res = applyToMember(currentUser);
      nextVal = res.nextDisplayed;
      savedOverridePatch = res.overridePatch;
    }
    if (typeof persistUserSession === 'function') persistUserSession(currentUser);
  }

  if (savedOverridePatch) saveMemberOverride(targetId, savedOverridePatch);
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

function clearMemberOverrideKeys(memberId, keys) {
  if (!memberId || !Array.isArray(keys) || keys.length === 0) return;
  const all = getMemberOverrides();
  if (!all[memberId]) return;
  for (const k of keys) delete all[memberId][k];
  if (Object.keys(all[memberId]).length === 0) delete all[memberId];
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
        if (m.boMon && Array.isArray(m.cacBan) && !m.cacBan.includes(m.boMon)) {
          m.cacBan.push(m.boMon);
        }
      }
    }
  }
  if (currentUser && currentUser.id && all[currentUser.id]) {
    Object.assign(currentUser, all[currentUser.id]);
    if (currentUser.boMon && Array.isArray(currentUser.cacBan) && !currentUser.cacBan.includes(currentUser.boMon)) {
      currentUser.cacBan.push(currentUser.boMon);
    }
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

function getDeletedMemberIds() {
  try {
    const list = JSON.parse(localStorage.getItem(DELETED_MEMBERS_KEY) || '[]');
    return Array.isArray(list) ? list.map(x => String(x || '').trim().toUpperCase()).filter(Boolean) : [];
  } catch (e) {
    return [];
  }
}

function saveDeletedMemberId(id) {
  const clean = String(id || '').trim().toUpperCase();
  if (!clean || clean === 'DMC0806') return;
  const list = getDeletedMemberIds();
  if (!list.includes(clean)) {
    list.push(clean);
    try { localStorage.setItem(DELETED_MEMBERS_KEY, JSON.stringify(list)); } catch (e) {}
  }
}

function removeDeletedMemberId(id) {
  const clean = String(id || '').trim().toUpperCase();
  if (!clean) return;
  const next = getDeletedMemberIds().filter(x => x !== clean);
  try { localStorage.setItem(DELETED_MEMBERS_KEY, JSON.stringify(next)); } catch (e) {}
}

function getCustomMembers() {
  try {
    const raw = JSON.parse(localStorage.getItem(CUSTOM_MEMBERS_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter(m => m && m.id) : [];
  } catch (e) {
    return [];
  }
}

function upsertCustomMember(memberObj) {
  const norm = normalizeMember(memberObj);
  if (!norm) return;
  norm.localCreatedAt = memberObj.localCreatedAt || Date.now();
  removeDeletedMemberId(norm.id);
  const list = getCustomMembers().filter(m => String(m.id || '').toUpperCase() !== norm.id.toUpperCase());
  list.unshift(norm);
  try { localStorage.setItem(CUSTOM_MEMBERS_KEY, JSON.stringify(list)); } catch (e) {}
}

function removeCustomMember(memberId) {
  const clean = String(memberId || '').trim().toUpperCase();
  if (!clean) return;
  const next = getCustomMembers().filter(m => String(m.id || '').toUpperCase() !== clean);
  try { localStorage.setItem(CUSTOM_MEMBERS_KEY, JSON.stringify(next)); } catch (e) {}
}

function rebuildMembersDirectory(remoteList = null) {
  const deletedSet = new Set(getDeletedMemberIds());
  const baseList = Array.isArray(remoteList) && remoteList.length > 0
    ? remoteList
    : (typeof DEFAULT_MEMBERS_DIRECTORY !== 'undefined' ? DEFAULT_MEMBERS_DIRECTORY : []);
  const seenRemote = new Set(baseList.map(m => String(m && m.id ? m.id : '').trim().toUpperCase()).filter(Boolean));

  const customList = getCustomMembers().filter((m) => {
    const uid = String(m.id || '').trim().toUpperCase();
    if (!uid || deletedSet.has(uid)) return false;
    if (Array.isArray(remoteList) && remoteList.length > 0) {
      if (seenRemote.has(uid)) return false;
      return Boolean(m.localCreatedAt && (Date.now() - m.localCreatedAt < 90000));
    }
    return true;
  });

  const combined = [...baseList, ...customList].filter(m => m && m.id && !deletedSet.has(String(m.id).trim().toUpperCase()));
  membersDirectory = normalizeMembersDirectory(combined);
  applyServerMemberCounters(membersDirectory);
  applyMemberOverrides(membersDirectory);
  if (typeof window !== 'undefined' && Array.isArray(membersDirectory)) {
    window.membersDirectory = membersDirectory;
  }
  return membersDirectory;
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
    }
  }

  if (currentUser) {
    if (currentUser.id === 'DMC0806') {
      currentUser.isAdmin = true;
      currentUser.isShiftLeader = true;
    } else if (custom[currentUser.id]) {
      currentUser.isAdmin = Boolean(custom[currentUser.id].isAdmin);
      currentUser.isShiftLeader = currentUser.isAdmin ? true : Boolean(custom[currentUser.id].isShiftLeader);
    }
  }
}

function applyServerMemberCounters(members) {
  const map = serverMemberCounters || {};
  const applyOne = (m) => {
    if (!m || !m.id || !map[m.id]) return;
    const c = map[m.id];
    if (typeof c.soCaHoanThanh === 'number') {
      m.soCaHoanThanh = Math.max(0, c.soCaHoanThanh);
      m.soCa = m.soCaHoanThanh;
    }
    if (typeof c.soCaSinhHoat === 'number') {
      m.soCaSinhHoat = Math.max(0, c.soCaSinhHoat);
    }
  };
  if (Array.isArray(members)) members.forEach(applyOne);
  if (currentUser) applyOne(currentUser);
}

function hydrateLocalStateFromCache() {
  const deletedTasks = getDeletedTaskIds();
  let loadedFromCache = false;
  try {
    const raw = localStorage.getItem(DATA_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const rawTasks = Array.isArray(parsed.currentTasks) ? parsed.currentTasks : DEFAULT_TASKS;
      currentTasks = deduplicateTasks(rawTasks.filter(t => t && !deletedTasks.includes(t.id) && !isStaleRemoteTestTask(t)));
      currentSwaps = Array.isArray(parsed.currentSwaps)
        ? parsed.currentSwaps.map(normalizeSwap).filter(Boolean)
        : DEFAULT_SWAPS_SEED.map(normalizeSwap);
      currentLeaves = Array.isArray(parsed.currentLeaves)
        ? parsed.currentLeaves.map(normalizeLeave).filter(Boolean)
        : DEFAULT_LEAVES_SEED.map(normalizeLeave);
      offlineMutationQueue = Array.isArray(parsed.offlineMutationQueue) ? parsed.offlineMutationQueue : [];
      serverMemberCounters = (parsed.serverMemberCounters && typeof parsed.serverMemberCounters === 'object')
        ? parsed.serverMemberCounters
        : {};
      loadedFromCache = true;
    }
  } catch (e) {}

  if (!loadedFromCache) {
    currentTasks = deduplicateTasks(DEFAULT_TASKS.filter(t => t && !deletedTasks.includes(t.id)));
    currentSwaps = DEFAULT_SWAPS_SEED.map(normalizeSwap);
    currentLeaves = DEFAULT_LEAVES_SEED.map(normalizeLeave);
    offlineMutationQueue = [];
    serverMemberCounters = {};
  }
  applyServerMemberCounters(membersDirectory);
}

function saveLocalState() {
  try {
    const deletedTasks = getDeletedTaskIds();
    const cleanTasks = (currentTasks || []).filter(t => t && !deletedTasks.includes(t.id));
    localStorage.setItem(DATA_CACHE_KEY, JSON.stringify({
      currentTasks: cleanTasks,
      currentSwaps: currentSwaps || [],
      currentLeaves: currentLeaves || [],
      offlineMutationQueue: offlineMutationQueue || [],
      serverMemberCounters: serverMemberCounters || {}
    }));
  } catch (e) {}
}

let currentUser = null;
let membersDirectory = normalizeMembersDirectory(typeof DEFAULT_MEMBERS_DIRECTORY !== 'undefined' ? DEFAULT_MEMBERS_DIRECTORY : []);
let currentTasks = deduplicateTasks(DEFAULT_TASKS);
let currentSwaps = DEFAULT_SWAPS_SEED.map(normalizeSwap);
let currentLeaves = DEFAULT_LEAVES_SEED.map(normalizeLeave);
let offlineMutationQueue = [];
let serverMemberCounters = {};

let activeQrTaskId = null;
let unreadNotifSignature = '';
let currentApproveSubTab = 'swap'; // 'swap' | 'leave' | 'shifts' | 'scanner'
let currentMissionTab = 'shifts'; // 'shifts' | 'swap'
let currentDirDeptFilter = 'ALL';
let editingTaskId = null;
let selectedShiftLeaderId = 'DMC0806';
let currentSyncPollTimer = null;
