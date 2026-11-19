// SportPass V6.0 — Canonical Reactive State, Tombstones, Deduplication & RBAC

let currentUser = null;
let membersDirectory = (typeof DEFAULT_MEMBERS_DIRECTORY !== 'undefined') ? DEFAULT_MEMBERS_DIRECTORY.slice() : [];
let currentTasks = DEFAULT_TASKS.map(t => JSON.parse(JSON.stringify(t)));
let currentPosts = DEFAULT_COMMUNITY_POSTS.map(p => JSON.parse(JSON.stringify(p)));
let currentSwaps = [];
let currentLeaves = [];
let auditLogs = [];
let offlineMutationQueue = [];

let currentActiveTabIdx = 0;
let currentTaskDeptFilter = 'ALL';
let currentDirDeptFilter = 'ALL';
let currentRoleDeptFilter = 'ALL';
let editingTaskId = null;
let selectedOtherMember = null;
let pendingConfirmCallback = null;
let pendingSmartRotationCandidates = [];
let pendingSmartRotationTaskId = null;
let adjustShiftsTargetId = null;
let adjustShiftsDelta = 1;
let activeReplyState = {};
let currentComposerMedia = [];
let currentLeaveProofDataUrl = '';
let currentLightboxImages = [];
let currentLightboxIdx = 0;
let currentCardStatus = 'Sẵn sàng';
let currentSyncPollTimer = null;

function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = (text === undefined || text === null) ? '' : String(text);
}

function safeSetValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = (val === undefined || val === null) ? '' : String(val);
}

function getSportPassInitials(name) {
  if (!name) return 'SP';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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
  if (lower.includes('hồi phục')) return 'Hồi phục';
  return 'Khỏe mạnh';
}

function applyAvatarElement(boxEl, initEl, nameStr, avatarUrl) {
  if (!boxEl) return;
  const oldImg = boxEl.querySelector('img');
  if (oldImg) oldImg.remove();
  if (avatarUrl && String(avatarUrl).trim()) {
    const img = document.createElement('img');
    img.src = avatarUrl;
    img.alt = nameStr || 'Ảnh đại diện';
    boxEl.appendChild(img);
    if (initEl) initEl.classList.add('hidden');
  } else if (initEl) {
    initEl.textContent = getSportPassInitials(nameStr);
    initEl.classList.remove('hidden');
  }
}

async function compressImage(fileOrDataUrl, maxWidth = 800, maxHeight = 800, quality = 0.72) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      const ratio = Math.min(maxWidth / w, maxHeight / h, 1);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (e) {
        resolve(fileOrDataUrl);
      }
    };
    img.onerror = () => resolve('');
    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => { img.src = ev.target.result; };
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

function logAuditEvent(actor, action, target, detail, result = 'SUCCESS') {
  auditLogs.unshift({
    id: 'LOG_' + Date.now(),
    actor: actor || (currentUser ? currentUser.id : 'SYSTEM'),
    action,
    target,
    detail,
    result,
    at: new Date().toLocaleTimeString('vi-VN')
  });
  if (auditLogs.length > 60) auditLogs.length = 60;
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

function getDeletedPostIds() {
  try {
    return JSON.parse(localStorage.getItem('CLB_DELETED_POST_IDS') || '[]');
  } catch (e) {
    return [];
  }
}

function saveDeletedPostId(id) {
  if (!id) return;
  const list = getDeletedPostIds();
  if (!list.includes(id)) {
    list.push(id);
    try { localStorage.setItem('CLB_DELETED_POST_IDS', JSON.stringify(list)); } catch (e) {}
  }
}

// ==================== SEMANTIC TASK DEDUPLICATION ====================
function isStaleRemoteTestTask(t) {
  if (!t) return true;
  const id = String(t.id || '');
  const title = String(t.title || '');
  return id.startsWith('MUT_TASK_') || id.startsWith('TASK_TEST_WITHDRAW_') || title === 'Task Test';
}

function deduplicateTasks(tasks) {
  if (!Array.isArray(tasks)) return [];
  const deleted = getDeletedTaskIds();
  const map = new Map();

  for (const raw of tasks) {
    if (!raw || !raw.title) continue;
    if (deleted.includes(raw.id)) continue;

    const copy = JSON.parse(JSON.stringify(raw));
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
      // Prefer canonical short ID (e.g. TASK_01 over TASK_DUP_...)
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
    const deletedPosts = getDeletedPostIds();
    const cleanTasks = (currentTasks || []).filter(t => t && !deletedTasks.includes(t.id));
    const cleanPosts = (currentPosts || []).filter(p => p && !deletedPosts.includes(p.id));
    localStorage.setItem('CLB_SPORTPASS_DATA_CACHE', JSON.stringify({
      currentTasks: cleanTasks,
      currentPosts: cleanPosts,
      currentSwaps: currentSwaps || [],
      currentLeaves: currentLeaves || [],
      auditLogs: auditLogs || [],
      offlineMutationQueue: offlineMutationQueue || []
    }));
  } catch (e) {}
}
