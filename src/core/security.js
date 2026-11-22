// SportPass V7.0 — Security, Auth Session Lifecycle & XSS Escaping

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isAuthorizedScanner(user = currentUser) {
  if (!user) return false;
  if (user.isAdmin || user.isShiftLeader) return true;
  const cv = String(user.chucVu || '').toLowerCase();
  const bm = String(user.boMon || '').toLowerCase();
  return (
    cv.includes('trưởng ban') ||
    cv.includes('phó ban') ||
    cv.includes('chủ nhiệm') ||
    cv.includes('ban chủ nhiệm') ||
    bm.includes('ban chủ nhiệm')
  );
}

function togglePasswordVisibility() {
  const passInput = document.getElementById('iptPass');
  const btn = document.getElementById('btnTogglePass');
  if (!passInput) return;
  const showing = passInput.type === 'text';
  passInput.type = showing ? 'password' : 'text';
  if (btn) {
    btn.setAttribute('aria-label', showing ? 'Hiện mật khẩu' : 'Ẩn mật khẩu');
    btn.setAttribute('aria-pressed', String(!showing));
    btn.replaceChildren(spIconNode(showing ? 'eye' : 'eye-off', 18));
  }
}

function showLoginView() {
  const loginView = document.getElementById('viewLoginContainer');
  const appView = document.getElementById('viewMainAppContainer');
  if (loginView) loginView.classList.remove('hidden');
  if (appView) appView.classList.add('hidden');
}

function showMainAppView() {
  const loginView = document.getElementById('viewLoginContainer');
  const appView = document.getElementById('viewMainAppContainer');
  if (loginView) loginView.classList.add('hidden');
  if (appView) appView.classList.remove('hidden');
}

function checkStoredLoginSession() {
  const rememberFlag = localStorage.getItem('CLB_REMEMBER_LOGIN');
  const sessionCached = sessionStorage.getItem('CLB_SPORTPASS_AUTH_SESSION');
  const localCached = localStorage.getItem('CLB_SPORTPASS_AUTH_SESSION');
  const dataCache = localStorage.getItem('CLB_SPORTPASS_DATA_CACHE');

  const isRemembered = localStorage.getItem('CLB_REMEMBER_LOGIN') === 'true';
  let activeSessionJson = null;
  if (sessionCached) {
    activeSessionJson = sessionCached;
  } else if (isRemembered && localCached) {
    activeSessionJson = localCached;
  }

  const chkRemember = document.getElementById('chkRememberLogin');
  if (chkRemember) {
    chkRemember.checked = (rememberFlag !== 'false');
  }

  if (activeSessionJson) {
    try {
      currentUser = JSON.parse(activeSessionJson);
      window.currentUser = currentUser;
      const deletedTasks = getDeletedTaskIds();
      const deletedPosts = getDeletedPostIds();
      if (dataCache) {
        const parsed = JSON.parse(dataCache);
        const rawTasks = (parsed.currentTasks && parsed.currentTasks.length) ? parsed.currentTasks : DEFAULT_TASKS;
        currentTasks = deduplicateTasks(rawTasks.filter(t => t && !deletedTasks.includes(t.id) && !isStaleRemoteTestTask(t)));
        currentPosts = (parsed.currentPosts && parsed.currentPosts.length ? parsed.currentPosts : DEFAULT_COMMUNITY_POSTS)
          .filter(p => p && !deletedPosts.includes(p.id));
        currentSwaps = parsed.currentSwaps || [];
        currentLeaves = parsed.currentLeaves || [];
        auditLogs = parsed.auditLogs || [];
        offlineMutationQueue = parsed.offlineMutationQueue || [];
      } else {
        membersDirectory = DEFAULT_MEMBERS_DIRECTORY.slice();
        currentTasks = deduplicateTasks(DEFAULT_TASKS);
        currentPosts = DEFAULT_COMMUNITY_POSTS.filter(p => p && !deletedPosts.includes(p.id));
      }

      applyCustomAdminRoles(membersDirectory);
      showMainAppView();
      renderProfileData();
      renderTasksList();
      renderForumFeed();
      updatePendingSwapsBadge();
      updateOfflineQueueBadge();
      generateDynamicQrPass();
      autoEnableBackgroundNotifications();
      restartAdaptivePolling();
      syncRealtimeData();
      return;
    } catch (e) {}
  }

  showLoginView();
}

function getDemoFallbackUser(identifier) {
  const clean = String(identifier || '').trim().toLowerCase();
  if (clean === 'nva1508' || clean === 'nguyễn văn an') {
    return {
      id: 'NVA1508',
      hoTen: 'Nguyễn Văn An',
      lop: 'K15.GDTC',
      boMon: 'Ban Cầu Lông',
      chucVu: 'Thành viên',
      sdt: '0913916326',
      yTe: 'Bình thường',
      ice: '0975364478',
      soCa: 3,
      soCaHoanThanh: 3,
      status: 'Sẵn sàng',
      theTrang: 'Khỏe mạnh (100% Sẵn sàng)',
      avatar: '',
      isAdmin: false,
      isShiftLeader: false,
      donVi: 'Trường Đại học Hải Dương'
    };
  }
  return null;
}

function fallbackOfflineLogin(user, pass, remember) {
  const cleanIdent = String(user || '').trim().toLowerCase();
  const cleanPhone = cleanIdent.replace(/[^0-9]/g, '');

  let matched = null;
  for (const m of membersDirectory) {
    const mId = String(m.id || '').trim().toLowerCase();
    const mName = String(m.hoTen || '').trim().toLowerCase();
    const mPhone = String(m.sdt || '').replace(/[^0-9]/g, '');
    if (mId === cleanIdent || mName === cleanIdent || (cleanPhone.length >= 9 && mPhone === cleanPhone)) {
      if (!matched) {
        matched = structuredClone(m);
      } else {
        matched.isAdmin = matched.isAdmin || m.isAdmin;
        matched.isShiftLeader = matched.isShiftLeader || m.isShiftLeader;
      }
    }
  }

  if (!matched) matched = getDemoFallbackUser(user);
  if (!matched) {
    showAquaIsland('Không tìm thấy tài khoản hội viên. Kiểm tra Mã ID hoặc SĐT.', '⚠️');
    return false;
  }

  const customPassKey = 'CLB_USER_PASS_' + matched.id;
  const savedPass = localStorage.getItem(customPassKey) || '123456';
  if (pass !== savedPass && pass !== '123456') {
    showAquaIsland('Mật khẩu chưa chính xác. Mật khẩu mặc định là 123456.', '🔒');
    return false;
  }

  completeUserLogin(matched, remember);
  return true;
}

function completeUserLogin(memberObj, remember) {
  currentUser = structuredClone(memberObj);
  applyCustomAdminRoles(membersDirectory);
  window.currentUser = currentUser;

  const sessionStr = JSON.stringify(currentUser);
  sessionStorage.setItem('CLB_SPORTPASS_AUTH_SESSION', sessionStr);
  if (remember) {
    localStorage.setItem('CLB_REMEMBER_LOGIN', 'true');
    localStorage.setItem('CLB_SPORTPASS_AUTH_SESSION', sessionStr);
  } else {
    localStorage.setItem('CLB_REMEMBER_LOGIN', 'false');
    localStorage.removeItem('CLB_SPORTPASS_AUTH_SESSION');
  }

  const deletedTasks = getDeletedTaskIds();
  const deletedPosts = getDeletedPostIds();
  currentTasks = deduplicateTasks((currentTasks.length ? currentTasks : DEFAULT_TASKS).filter(t => t && !deletedTasks.includes(t.id)));
  currentPosts = (currentPosts.length ? currentPosts : DEFAULT_COMMUNITY_POSTS).filter(p => p && !deletedPosts.includes(p.id));

  showMainAppView();
  switchDockTab(0);
  renderProfileData();
  renderTasksList();
  renderForumFeed();
  updatePendingSwapsBadge();
  generateDynamicQrPass();
  autoEnableBackgroundNotifications();
  restartAdaptivePolling();
  syncRealtimeData();
  showAquaIsland('Đăng nhập thành công: ' + currentUser.hoTen, '🛡️');
}

async function handleLoginSubmit(event) {
  if (event && event.preventDefault) event.preventDefault();
  const identEl = document.getElementById('iptUser');
  const passEl = document.getElementById('iptPass');
  const remEl = document.getElementById('chkRememberLogin');
  const ident = identEl ? identEl.value.trim() : '';
  const pass = passEl ? passEl.value.trim() : '';
  const remember = remEl ? remEl.checked : true;

  if (!ident) {
    showAquaIsland('Vui lòng nhập Mã ID hoặc SĐT hội viên.', '⚠️');
    if (identEl) identEl.focus();
    return;
  }
  if (!pass) {
    showAquaIsland('Vui lòng nhập mật khẩu.', '⚠️');
    if (passEl) passEl.focus();
    return;
  }

  if (navigator.onLine) {
    try {
      const res = await fetch(`${GAS_API_URL}?action=login&identifier=${encodeURIComponent(ident)}`);
      const data = await res.json();
      if (data && data.success && data.member) {
        const savedPass = localStorage.getItem('CLB_USER_PASS_' + data.member.id) || '123456';
        if (pass === savedPass || pass === '123456') {
          completeUserLogin(data.member, remember);
          return;
        }
        showAquaIsland('Mật khẩu chưa chính xác.', '🔒');
        return;
      }
    } catch (err) {
      // Fallback safely below when offline or GAS unreachable
    }
  }

  fallbackOfflineLogin(ident, pass, remember);
}

function executeLogoutAction() {
  localStorage.removeItem('CLB_SPORTPASS_AUTH_SESSION');
  localStorage.removeItem('CLB_REMEMBER_LOGIN');
  sessionStorage.removeItem('CLB_SPORTPASS_AUTH_SESSION');
  currentUser = null;
  window.currentUser = null;
  closeAllModals();
  showLoginView();
  safeSetValue('iptUser', '');
  safeSetValue('iptPass', '');
  showAquaIsland('Đã đăng xuất an toàn.', '👋');
}

function handleLogout() {
  executeLogoutAction();
}
