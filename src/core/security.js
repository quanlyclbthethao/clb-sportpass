// SportPass V8.8 — Fast Optimistic Auth, Cross-Context SHA-256, ID/MSSV/Phone Lookup & Scanner RBAC

const DEFAULT_PASS_HASH = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'; // sha256('123456')
let isLoginSubmitting = false;

function isAuthorizedScanner(user = currentUser) {
  return Boolean(user && (user.isAdmin || user.isShiftLeader));
}

function sha256PureJsHex(str) {
  const utf8 = unescape(encodeURIComponent(String(str || '')));
  const bytes = [];
  for (let i = 0; i < utf8.length; i++) bytes.push(utf8.charCodeAt(i));

  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) bytes.push(0);
  const hiLen = Math.floor(bitLen / 0x100000000);
  const loLen = bitLen >>> 0;
  bytes.push((hiLen >>> 24) & 0xff, (hiLen >>> 16) & 0xff, (hiLen >>> 8) & 0xff, hiLen & 0xff);
  bytes.push((loLen >>> 24) & 0xff, (loLen >>> 16) & 0xff, (loLen >>> 8) & 0xff, loLen & 0xff);

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const rotr = (v, n) => (v >>> n) | (v << (32 - n));
  const w = new Array(64);

  for (let off = 0; off < bytes.length; off += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = ((bytes[off + i * 4] << 24) | (bytes[off + i * 4 + 1] << 16) | (bytes[off + i * 4 + 2] << 8) | bytes[off + i * 4 + 3]) >>> 0;
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ ((~e) & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }
  return H.map(v => v.toString(16).padStart(8, '0')).join('');
}

async function sha256Hex(plain) {
  const str = String(plain || '');
  if (window.crypto && window.crypto.subtle && typeof TextEncoder === 'function') {
    try {
      const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {}
  }
  return sha256PureJsHex(str);
}

function hasCustomMemberPassword(member) {
  if (!member || !member.id) return false;
  if (localStorage.getItem('CLB_USER_PASS_HASH_' + member.id) !== null) return true;
  if (localStorage.getItem('CLB_USER_PASS_' + member.id) !== null) return true;
  return Boolean(member.hasCustomPassword);
}

function setStoredPasswordHash(memberId, passHash) {
  if (!memberId || !passHash) return;
  try {
    localStorage.setItem('CLB_USER_PASS_HASH_' + memberId, String(passHash));
    localStorage.removeItem('CLB_USER_PASS_' + memberId);
  } catch (e) {}
}

async function getStoredPasswordHash(memberId) {
  const h = localStorage.getItem('CLB_USER_PASS_HASH_' + memberId);
  if (h) return h;
  const legacy = localStorage.getItem('CLB_USER_PASS_' + memberId);
  if (legacy !== null) {
    const migrated = await sha256Hex(legacy);
    setStoredPasswordHash(memberId, migrated);
    return migrated;
  }
  return DEFAULT_PASS_HASH;
}

async function verifyMemberPasswordHash(memberId, inputHash) {
  const expected = await getStoredPasswordHash(memberId);
  return String(inputHash || '') === expected;
}

function findLocalMemberByIdentifier(identifier) {
  const rawIdent = String(identifier || '').trim();
  const cleanIdent = rawIdent.toLowerCase();
  if (!cleanIdent) return null;

  const deletedSet = new Set(getDeletedMemberIds());
  const list = (Array.isArray(membersDirectory) ? membersDirectory : [])
    .filter(m => m && m.id && !deletedSet.has(String(m.id).trim().toUpperCase()));

  const exactId = list.find(m => String(m.id || '').trim().toLowerCase() === cleanIdent);
  if (exactId) return structuredClone(exactId);

  const exactStudentCode = list.find((m) => {
    const code = getDisplayStudentCode(m).toLowerCase();
    return code && code === cleanIdent;
  });
  if (exactStudentCode) return structuredClone(exactStudentCode);

  const hasLetters = /[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]/.test(rawIdent);
  const normPhone = !hasLetters ? normalizePhoneVN(rawIdent) : '';
  if (normPhone.length >= 9) {
    const exactPhone = list.find(m => normalizePhoneVN(m.sdt) === normPhone);
    if (exactPhone) return structuredClone(exactPhone);
  }

  const exactName = list.find(m => String(m.hoTen || '').trim().toLowerCase() === cleanIdent);
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

function setLoginButtonLoading(loading) {
  const btn = document.getElementById('btnLoginSubmit');
  if (!btn) return;
  btn.disabled = Boolean(loading);
  btn.classList.toggle('is-loading', Boolean(loading));
  const label = btn.querySelector('span');
  if (label) label.textContent = loading ? 'Đang xác thực...' : 'Đăng nhập ngay';
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
  updatePendingBadges();
  updateNotificationDotOnly();
  autoEnableBackgroundNotifications();
  restartAdaptivePolling();
  setTimeout(() => {
    if (currentUser && navigator.onLine) syncRealtimeData();
  }, 450);
}

function checkStoredLoginSession() {
  hydrateLocalStateFromCache();
  rebuildMembersDirectory();

  const deletedSet = new Set(getDeletedMemberIds());
  const rememberFlag = localStorage.getItem('CLB_REMEMBER_LOGIN');
  const sessionCached = sessionStorage.getItem('CLB_SPORTPASS_AUTH_SESSION');
  const localCached = localStorage.getItem('CLB_SPORTPASS_AUTH_SESSION');
  const activeSessionJson = sessionCached || (rememberFlag === 'true' ? localCached : null);

  const chkRemember = document.getElementById('chkRememberLogin');
  if (chkRemember) chkRemember.checked = (rememberFlag !== 'false');

  if (activeSessionJson) {
    try {
      const parsed = normalizeMember(JSON.parse(activeSessionJson));
      if (parsed && !deletedSet.has(parsed.id.toUpperCase())) {
        currentUser = parsed;
        window.currentUser = currentUser;
        applyMemberOverrides(membersDirectory);
        activateAuthenticatedSession();
        return;
      }
    } catch (e) {}
  }

  showLoginView();
}

function completeUserLogin(memberObj, remember, verifiedHash = null) {
  currentUser = normalizeMember(memberObj);
  if (verifiedHash && verifiedHash !== DEFAULT_PASS_HASH) {
    currentUser.hasCustomPassword = true;
  }
  hydrateLocalStateFromCache();
  rebuildMembersDirectory();
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

async function fallbackOfflineLogin(user, pass, remember) {
  const inputHash = await sha256Hex(pass);
  const matched = findLocalMemberByIdentifier(user);
  if (!matched) {
    showToast('Không tìm thấy tài khoản theo Mã ID, MSSV hoặc SĐT.');
    return false;
  }
  if (!(await verifyMemberPasswordHash(matched.id, inputHash))) {
    showToast(hasCustomMemberPassword(matched) ? 'Mật khẩu chưa chính xác.' : 'Mật khẩu chưa chính xác. Mặc định là 123456.');
    return false;
  }
  completeUserLogin(matched, remember, inputHash);
  return true;
}

async function handleLoginSubmit(event) {
  if (event && event.preventDefault) event.preventDefault();
  if (isLoginSubmitting) return;

  const identEl = document.getElementById('iptUser');
  const passEl = document.getElementById('iptPass');
  const remEl = document.getElementById('chkRememberLogin');
  const ident = identEl ? identEl.value.trim() : '';
  const pass = passEl ? passEl.value.trim() : '';
  const remember = remEl ? remEl.checked : true;

  if (!ident) {
    showToast('Vui lòng nhập Mã ID, MSSV hoặc Số điện thoại.');
    identEl?.focus();
    return;
  }
  if (!pass) {
    showToast('Vui lòng nhập mật khẩu.');
    passEl?.focus();
    return;
  }

  isLoginSubmitting = true;
  try {
    const inputHash = await sha256Hex(pass);
    const localMatch = findLocalMemberByIdentifier(ident);
    const localHashMissingForServerPass = Boolean(
      localMatch &&
      localMatch.hasCustomPassword &&
      localStorage.getItem('CLB_USER_PASS_HASH_' + localMatch.id) === null &&
      localStorage.getItem('CLB_USER_PASS_' + localMatch.id) === null
    );

    if (localMatch && !localHashMissingForServerPass && (await verifyMemberPasswordHash(localMatch.id, inputHash))) {
      completeUserLogin(localMatch, remember, inputHash);
      return;
    }

    if (navigator.onLine) {
      setLoginButtonLoading(true);
      const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), 8000) : null;
      const remoteIdent = (/^(?:\+?84[\d\s.\-]{8,}|0[\d\s.\-]{8,})$/.test(ident)) ? normalizePhoneVN(ident) : ident;
      try {
        const res = await fetch(
          `${GAS_API_URL}?action=login&identifier=${encodeURIComponent(remoteIdent)}&passwordHash=${encodeURIComponent(inputHash)}`,
          ctrl ? { signal: ctrl.signal } : undefined
        );
        const data = res && res.ok ? await res.json().catch(() => null) : null;
        if (data && data.success && data.member) {
          if (getDeletedMemberIds().includes(String(data.member.id || '').toUpperCase())) {
            showToast('Tài khoản này đã bị xóa khỏi CLB.');
            return;
          }
          setStoredPasswordHash(data.member.id, inputHash);
          upsertCustomMember(data.member);
          rebuildMembersDirectory();
          completeUserLogin(data.member, remember, inputHash);
          return;
        }
        if (data && data.code === 'WRONG_PASSWORD') {
          showToast('Mật khẩu chưa chính xác.');
          passEl?.focus();
          return;
        }
      } catch (err) {
        // Offline / timeout fallback below
      } finally {
        if (timer) clearTimeout(timer);
        setLoginButtonLoading(false);
      }
    }

    if (localMatch) {
      showToast(hasCustomMemberPassword(localMatch) ? 'Mật khẩu chưa chính xác.' : 'Mật khẩu chưa chính xác. Mặc định là 123456.');
      passEl?.focus();
    } else {
      showToast('Không tìm thấy tài khoản theo Mã ID, MSSV hoặc SĐT.');
      identEl?.focus();
    }
  } finally {
    isLoginSubmitting = false;
    setLoginButtonLoading(false);
  }
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
