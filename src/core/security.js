// SportPass V8.7 — Security, Auth Session Lifecycle, WebAuthn Passkey & Strict Password Enforcement

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

function verifyMemberPassword(memberId, inputPass) {
  const customPass = localStorage.getItem('CLB_USER_PASS_' + memberId);
  const expectedPass = customPass !== null ? customPass : '123456';
  return String(inputPass || '') === expectedPass;
}

function findLocalMemberByIdentifier(identifier) {
  const cleanIdent = String(identifier || '').trim().toLowerCase();
  if (!cleanIdent) return null;
  const cleanPhone = cleanIdent.replace(/[^0-9]/g, '');
  const list = Array.isArray(membersDirectory) ? membersDirectory : [];

  const exactId = list.find(m => m && String(m.id || '').trim().toLowerCase() === cleanIdent);
  if (exactId) return structuredClone(exactId);

  const exactStudentCode = list.find(m => m && String(m.studentCode || '').trim().toLowerCase() === cleanIdent);
  if (exactStudentCode) return structuredClone(exactStudentCode);

  if (cleanPhone.length >= 9) {
    const exactPhone = list.find(m => m && String(m.sdt || '').replace(/[^0-9]/g, '') === cleanPhone);
    if (exactPhone) return structuredClone(exactPhone);
  }

  const exactName = list.find(m => m && String(m.hoTen || '').trim().toLowerCase() === cleanIdent);
  return exactName ? structuredClone(exactName) : null;
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

function persistUserSession(userObj) {
  if (!userObj) return;
  const json = JSON.stringify(userObj);
  sessionStorage.setItem('CLB_SPORTPASS_AUTH_SESSION', json);
  if (localStorage.getItem('CLB_REMEMBER_LOGIN') === 'true') {
    localStorage.setItem('CLB_SPORTPASS_AUTH_SESSION', json);
  }
}

function activateAuthenticatedSession() {
  showMainAppView();
  renderProfileData();
  renderDispatchHub();
  renderMembersModalList();
  renderNotificationsModalList();
  updateQrPassDisplay();
  autoEnableBackgroundNotifications();
  restartAdaptivePolling();
  syncRealtimeData();
}

function checkStoredLoginSession() {
  membersDirectory = normalizeMembersDirectory(typeof DEFAULT_MEMBERS_DIRECTORY !== 'undefined' ? DEFAULT_MEMBERS_DIRECTORY : []);
  applyMemberOverrides(membersDirectory);

  const rememberFlag = localStorage.getItem('CLB_REMEMBER_LOGIN');
  const sessionCached = sessionStorage.getItem('CLB_SPORTPASS_AUTH_SESSION');
  const localCached = localStorage.getItem('CLB_SPORTPASS_AUTH_SESSION');
  const isRemembered = rememberFlag === 'true';
  const activeSessionJson = sessionCached || (isRemembered ? localCached : null);

  const chkRemember = document.getElementById('chkRememberLogin');
  if (chkRemember) chkRemember.checked = (rememberFlag !== 'false');

  if (activeSessionJson) {
    try {
      currentUser = normalizeMember(JSON.parse(activeSessionJson));
      if (currentUser) {
        window.currentUser = currentUser;
        hydrateLocalStateFromCache();
        applyMemberOverrides(membersDirectory);
        activateAuthenticatedSession();
        return;
      }
    } catch (e) {}
  }

  hydrateLocalStateFromCache();
  showLoginView();
}

function fallbackOfflineLogin(user, pass, remember) {
  const matched = findLocalMemberByIdentifier(user);
  if (!matched) {
    showToast('Không tìm thấy tài khoản hội viên. Kiểm tra Mã ID hoặc SĐT.');
    return false;
  }

  if (!verifyMemberPassword(matched.id, pass)) {
    const hasCustom = localStorage.getItem('CLB_USER_PASS_' + matched.id) !== null;
    showToast(hasCustom ? 'Mật khẩu chưa chính xác.' : 'Mật khẩu chưa chính xác. Mặc định là 123456.');
    return false;
  }

  completeUserLogin(matched, remember);
  return true;
}

function completeUserLogin(memberObj, remember) {
  currentUser = normalizeMember(memberObj);
  hydrateLocalStateFromCache();
  applyMemberOverrides(membersDirectory);
  window.currentUser = currentUser;

  const sessionStr = JSON.stringify(currentUser);
  sessionStorage.setItem('CLB_SPORTPASS_AUTH_SESSION', sessionStr);
  try { localStorage.setItem('CLB_LAST_MEMBER_ID', currentUser.id); } catch (e) {}
  if (remember) {
    localStorage.setItem('CLB_REMEMBER_LOGIN', 'true');
    localStorage.setItem('CLB_SPORTPASS_AUTH_SESSION', sessionStr);
  } else {
    localStorage.setItem('CLB_REMEMBER_LOGIN', 'false');
    localStorage.removeItem('CLB_SPORTPASS_AUTH_SESSION');
  }

  activateAuthenticatedSession();
  triggerHaptic('success');
  showToast('Đăng nhập thành công: ' + currentUser.hoTen);
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
    showToast('Vui lòng nhập Mã ID hoặc SĐT hội viên.');
    if (identEl) identEl.focus();
    return;
  }
  if (!pass) {
    showToast('Vui lòng nhập mật khẩu.');
    if (passEl) passEl.focus();
    return;
  }

  if (navigator.onLine) {
    try {
      const res = await fetch(`${GAS_API_URL}?action=login&identifier=${encodeURIComponent(ident)}`);
      const data = await res.json();
      if (data && data.success && data.member) {
        if (verifyMemberPassword(data.member.id, pass)) {
          completeUserLogin(data.member, remember);
          return;
        }
        showToast('Mật khẩu chưa chính xác.');
        return;
      }
    } catch (err) {
      // Offline fallback below
    }
  }

  fallbackOfflineLogin(ident, pass, remember);
}

function bufferToBase64Url(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUint8Array(b64u) {
  const b64 = String(b64u || '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function handleBiometricLogin(methodLabel) {
  if (!window.PublicKeyCredential || !window.isSecureContext || !navigator.credentials) {
    showToast('Trình duyệt hoặc kết nối chưa hỗ trợ sinh trắc học WebAuthn. Vui lòng đăng nhập bằng mật khẩu.');
    document.getElementById('iptUser')?.focus();
    return;
  }

  let binding = null;
  try {
    const raw = localStorage.getItem('CLB_PASSKEY_BINDING');
    if (raw) binding = JSON.parse(raw);
  } catch (e) {}

  if (binding && binding.memberId && binding.credIdB64) {
    const boundMember = findLocalMemberByIdentifier(binding.memberId);
    if (boundMember) {
      try {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge,
            allowCredentials: [{ id: base64UrlToUint8Array(binding.credIdB64), type: 'public-key' }],
            userVerification: 'required',
            timeout: 30000
          }
        });
        if (assertion) {
          completeUserLogin(boundMember, true);
          showToast(`Xác thực ${methodLabel} thành công: ${boundMember.hoTen}`);
          return;
        }
      } catch (err) {
        showToast(`Xác thực ${methodLabel} đã hủy hoặc không khớp trên thiết bị.`);
        return;
      }
    }
  }

  const ident = (document.getElementById('iptUser')?.value || '').trim();
  const pass = (document.getElementById('iptPass')?.value || '').trim();
  const candidate = ident ? findLocalMemberByIdentifier(ident) : null;

  if (candidate && pass && verifyMemberPassword(candidate.id, pass)) {
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = new TextEncoder().encode(candidate.id);
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'SportPass Pro UHD' },
          user: { id: userId, name: candidate.id, displayName: candidate.hoTen },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
          timeout: 30000
        }
      });
      if (cred && cred.rawId) {
        localStorage.setItem('CLB_PASSKEY_BINDING', JSON.stringify({
          memberId: candidate.id,
          credIdB64: bufferToBase64Url(cred.rawId)
        }));
        completeUserLogin(candidate, true);
        showToast(`Đã liên kết ${methodLabel} & đăng nhập: ${candidate.hoTen}`);
        return;
      }
    } catch (err) {
      showToast(`Thiết bị chưa hoàn tất tạo khóa ${methodLabel}. Vui lòng đăng nhập bằng mật khẩu.`);
      return;
    }
  }

  showToast(`Đăng nhập bằng MSSV & mật khẩu trước, sau đó nhấn ${methodLabel} để liên kết thiết bị.`);
  document.getElementById('iptUser')?.focus();
}

function executeLogoutAction() {
  if (currentSyncPollTimer) {
    clearInterval(currentSyncPollTimer);
    currentSyncPollTimer = null;
  }
  localStorage.removeItem('CLB_SPORTPASS_AUTH_SESSION');
  localStorage.removeItem('CLB_REMEMBER_LOGIN');
  sessionStorage.removeItem('CLB_SPORTPASS_AUTH_SESSION');
  currentUser = null;
  window.currentUser = null;
  closeAllModals();
  showLoginView();
  safeSetValue('iptUser', '');
  safeSetValue('iptPass', '');
  showToast('Đã đăng xuất khỏi tài khoản.');
}
