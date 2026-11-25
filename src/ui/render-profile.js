// SportPass V8.5 — Profile Hero, 8-Row Profile, Role Preview Switcher, Members Modal & Settings Modal

async function compressImage(fileOrDataUrl, maxWidth = 320, maxHeight = 320, quality = 0.8) {
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
      try { resolve(canvas.toDataURL('image/jpeg', quality)); } catch (e) { resolve(''); }
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

function applyRolePreviewMode() {
  const isRealAdmin = Boolean(currentUser && currentUser.isAdmin);
  const dock = document.getElementById('role-preview-dock');
  if (dock) dock.classList.toggle('hidden', !isRealAdmin);

  const effectiveAdmin = isRealAdmin && (currentRolePreviewMode === 'admin');
  const adminActions = document.getElementById('quick-actions-admin');
  const memberActions = document.getElementById('quick-actions-member');
  if (adminActions) adminActions.classList.toggle('hidden', !effectiveAdmin && !(currentUser && currentUser.isShiftLeader && currentRolePreviewMode !== 'member'));
  if (memberActions) memberActions.classList.toggle('hidden', effectiveAdmin || (currentUser && currentUser.isShiftLeader && currentRolePreviewMode !== 'member'));

  const swMember = document.getElementById('role-switch-member');
  const swAdmin = document.getElementById('role-switch-admin');
  if (swMember) swMember.classList.toggle('active', currentRolePreviewMode === 'member');
  if (swAdmin) swAdmin.classList.toggle('active', currentRolePreviewMode === 'admin');

  const roleBadge = document.getElementById('role-badge');
  if (roleBadge && currentUser) {
    if (currentRolePreviewMode === 'member') {
      roleBadge.textContent = 'THÀNH VIÊN';
    } else {
      roleBadge.textContent = currentUser.isAdmin ? 'ADMIN' : (currentUser.isShiftLeader ? 'TRƯỞNG CA' : 'HỘI VIÊN');
    }
  }
}

function setRolePreviewMode(mode) {
  if (!currentUser || !currentUser.isAdmin) return;
  currentRolePreviewMode = mode === 'member' ? 'member' : 'admin';
  applyRolePreviewMode();
  showToast(currentRolePreviewMode === 'member' ? 'Đang xem ở chế độ Thành viên' : 'Đang xem ở chế độ Admin');
}

function renderProfileData() {
  if (!currentUser) return;
  applyCustomAdminRoles(membersDirectory);

  const isAdmin = Boolean(currentUser.isAdmin);
  const shiftsCount = Number(currentUser.soCaHoanThanh ?? currentUser.soCa ?? 0);
  const avatarSrc = resolveAvatarUrl(currentUser);
  const studentCode = getDisplayStudentCode(currentUser);
  const dobText = formatMemberDob(currentUser);
  const phoneText = currentUser.sdt && String(currentUser.sdt).trim() ? String(currentUser.sdt).trim() : 'Chưa cập nhật';
  const iceText = currentUser.ice && String(currentUser.ice).trim()
    ? String(currentUser.ice).trim()
    : (currentUser.sdt ? `${currentUser.sdt} (Gia đình)` : '0988 123 456 (Trực CLB)');

  const hdrImg = document.getElementById('settings-trigger-avatar');
  if (hdrImg) {
    hdrImg.src = avatarSrc;
    hdrImg.alt = currentUser.hoTen || 'Cài đặt ứng dụng';
  }

  const heroImg = document.getElementById('hero-avatar-img');
  if (heroImg) {
    heroImg.src = avatarSrc;
    heroImg.alt = currentUser.hoTen || 'Thành viên CLB';
  }

  const kickerEl = document.getElementById('card-kicker');
  if (kickerEl) {
    kickerEl.textContent = isAdmin ? 'THÀNH VIÊN BAN ĐIỀU HÀNH' : String(currentUser.boMon || 'CLB THỂ THAO UHD').toUpperCase();
  }

  safeSetText('card-heading', String(currentUser.hoTen || 'THÀNH VIÊN CLB').toUpperCase());
  safeSetText('card-subtitle', currentUser.chucVu || 'Thành viên CLB Thể Thao');
  safeSetText('card-mssv', studentCode);

  safeSetText('stat-shifts', String(shiftsCount));
  safeSetText('stat-efficiency', currentUser.onTimeRate || '98%');
  safeSetText('stat-rating', formatShortTheTrang(currentUser.theTrang));

  safeSetText('display-fullname', currentUser.hoTen || '');
  safeSetText('display-studentId', studentCode);
  safeSetText('display-faculty', currentUser.lop || 'K13.GDTC');
  safeSetText('display-dob', dobText);
  safeSetText('display-dutyArea', currentUser.boMon || 'Ban Nhân Sự');
  safeSetText('display-role', currentUser.chucVu || 'Thành viên');
  safeSetText('display-ice', iceText);

  const phoneEl = document.getElementById('display-phone');
  if (phoneEl) {
    phoneEl.textContent = phoneText;
    const digits = phoneText.replace(/[^0-9+]/g, '');
    phoneEl.setAttribute('href', digits ? `tel:${digits}` : '#display-phone');
  }

  // Sync Settings Mini Hero Card
  const settingsAvatar = document.getElementById('settings-avatar');
  if (settingsAvatar) {
    settingsAvatar.src = avatarSrc;
    settingsAvatar.alt = currentUser.hoTen || 'Avatar';
  }
  safeSetText('settings-role-kicker', isAdmin ? 'ĐIỀU PHỐI VIÊN' : String(currentUser.boMon || 'HỘI VIÊN CLB').toUpperCase());
  safeSetText('settings-name', currentUser.hoTen || 'Thành viên CLB');
  safeSetText('settings-submeta', `MSSV: ${studentCode} • ${currentUser.lop || 'UHD'}`);
  safeSetText('settings-grade-badge', formatShortTheTrang(currentUser.theTrang));

  applyStatusBadgeStyle();
  applyRolePreviewMode();
  updateQrPassDisplay();
  syncSettingsSwitchesUI();
}

function syncSettingsSwitchesUI() {
  const swFace = document.getElementById('switchFaceId');
  const swLock = document.getElementById('switchRemoteLock');
  const swTilt = document.getElementById('switchTilt3d');
  const swNotif = document.getElementById('switchUrgentNotifs');
  const swHaptic = document.getElementById('switchHaptics');
  if (swFace) swFace.checked = Boolean(appPreferences.faceId);
  if (swLock) swLock.checked = Boolean(appPreferences.remoteLock);
  if (swTilt) swTilt.checked = Boolean(appPreferences.tilt3d);
  if (swNotif) swNotif.checked = Boolean(appPreferences.urgentNotifs);
  if (swHaptic) swHaptic.checked = Boolean(appPreferences.haptics);

  const btnVn = document.getElementById('lang-btn-vn');
  const btnEn = document.getElementById('lang-btn-en');
  if (btnVn) btnVn.classList.toggle('active', appPreferences.lang !== 'EN');
  if (btnEn) btnEn.classList.toggle('active', appPreferences.lang === 'EN');
}

function applyStatusBadgeStyle() {
  if (!currentUser) return;
  const st = currentUser.status || 'Sẵn sàng';
  const pill = document.getElementById('hero-status-pill');
  const txt = document.getElementById('hero-status-text');
  if (txt) txt.textContent = st;
  if (pill) {
    const low = st.toLowerCase();
    pill.dataset.tone = low.includes('bận') ? 'busy' : (low.includes('nghỉ') ? 'off' : 'ready');
  }
}

function cycleStatus(ev) {
  if (ev && ev.stopPropagation) ev.stopPropagation();
  const states = ['Sẵn sàng', 'Đang bận', 'Tạm nghỉ'];
  const cur = (currentUser && currentUser.status) ? currentUser.status : 'Sẵn sàng';
  const next = states[(states.indexOf(cur) + 1) % states.length];
  if (currentUser) {
    currentUser.status = next;
    persistUserSession(currentUser);
  }
  applyStatusBadgeStyle();
  renderMembersModalList();
  showToast(`Trạng thái: ${next}`);
}

function cycleReadinessRating() {
  if (!currentUser) return;
  const curIdx = THE_TRANG_OPTIONS.findIndex(o => o.label === currentUser.theTrang);
  const nextOpt = THE_TRANG_OPTIONS[(Math.max(0, curIdx) + 1) % THE_TRANG_OPTIONS.length];
  currentUser.theTrang = nextOpt.label;
  for (const m of (membersDirectory || [])) {
    if (m.id === currentUser.id) m.theTrang = nextOpt.label;
  }
  persistUserSession(currentUser);
  saveLocalState();
  renderProfileData();
  showToast(`Thể trạng: ${nextOpt.short}`);
}

async function handleAvatarFileSelect(event) {
  const file = event && event.target && event.target.files ? event.target.files[0] : null;
  if (!file || !currentUser) return;
  const compressed = await compressImage(file, 320, 320, 0.8);
  if (!compressed) return;
  currentUser.avatar = compressed;
  for (const m of (membersDirectory || [])) {
    if (m.id === currentUser.id) m.avatar = compressed;
  }
  persistUserSession(currentUser);
  saveLocalState();
  renderProfileData();
  const editPrev = document.getElementById('edit-avatar-preview');
  if (editPrev) editPrev.src = compressed;
  showToast('Đã cập nhật ảnh đại diện thành viên!');
}

// ==================== MEMBERS MODAL ("THÀNH VIÊN CLB" - SCREENSHOT 1) ====================
function openMembersModal() {
  renderMembersModalList();
  openSheetDialog('members-modal');
}

function closeMembersModal() {
  closeSheetDialog('members-modal');
}

function renderMembersModalList() {
  const filterBar = document.getElementById('membersDeptFilterBar');
  const container = document.getElementById('membersModalList');
  if (filterBar) {
    mount(filterBar, buildDeptFilterChips(currentDirDeptFilter, (d) => {
      currentDirDeptFilter = d;
      renderMembersModalList();
    }));
  }
  if (!container) return;

  const uniqueMap = new Map();
  for (const m of (membersDirectory || [])) {
    if (m && m.id && !uniqueMap.has(m.id)) uniqueMap.set(m.id, m);
  }
  let uniqueList = Array.from(uniqueMap.values());
  if (currentUser) {
    const idx = uniqueList.findIndex(m => m.id === currentUser.id);
    if (idx > 0) {
      const me = uniqueList.splice(idx, 1)[0];
      uniqueList.unshift(me);
    }
  }

  const q = (document.getElementById('iptSearchMembers')?.value || '').trim().toLowerCase();
  const visible = uniqueList.filter((m) => {
    if (currentDirDeptFilter !== 'ALL' && m.boMon !== currentDirDeptFilter) return false;
    if (!q) return true;
    return (
      String(m.hoTen || '').toLowerCase().includes(q) ||
      String(m.id || '').toLowerCase().includes(q) ||
      String(m.lop || '').toLowerCase().includes(q) ||
      String(m.boMon || '').toLowerCase().includes(q)
    );
  });

  safeSetText('membersCountBadge', `${visible.length} / ${(membersDirectory || []).length}`);

  if (visible.length === 0) {
    mount(container, el('div', { className: 'empty-card' }, 'Không tìm thấy thành viên phù hợp.'));
    return;
  }

  const isAdmin = Boolean(currentUser && currentUser.isAdmin);
  const cards = visible.map((m) => {
    const isMe = currentUser && m.id === currentUser.id;
    const isRoot = m.id === 'DMC0806';
    const shifts = Number(m.soCaHoanThanh ?? m.soCa ?? 0);
    return el('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' }, className: 'member-pill-row' },
      el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '10px' } },
        el('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', minWidth: '0', flex: '1' } },
          el('div', { className: `avatar-initials-circle${isMe ? ' solid' : ''}` }, getSportPassInitials(m.hoTen)),
          el('div', { style: { minWidth: '0', flex: '1' } },
            el('div', { style: { fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' }, className: 'truncate' }, `${m.hoTen}${isMe ? ' (Bạn)' : ''}`),
            el('div', { style: { fontSize: '11.5px', color: '#0369a1' }, className: 'truncate' }, `${m.chucVu} • ${m.lop}`)
          )
        ),
        el('span', { className: 'ready-badge-pill' }, m.status || 'Sẵn sàng')
      ),
      isAdmin && !isMe
        ? el('div', { className: 'mini-action-grid', style: { width: '100%', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' } },
            el('button', {
              type: 'button',
              className: `btn-mini ${m.isAdmin ? 'btn-mini-sky' : 'btn-mini-soft'}`,
              disabled: isRoot,
              onClick: () => toggleMemberRole(m.id, 'admin')
            }, m.isAdmin ? 'Admin ✓' : 'Cấp Admin'),
            el('button', {
              type: 'button',
              className: `btn-mini ${m.isShiftLeader ? 'btn-mini-emerald' : 'btn-mini-soft'}`,
              disabled: isRoot,
              onClick: () => toggleMemberRole(m.id, 'leader')
            }, m.isShiftLeader ? 'Trưởng ca ✓' : 'Trưởng ca'),
            el('button', {
              type: 'button',
              className: 'btn-mini btn-mini-soft',
              onClick: () => adjustMemberShiftCount(m.id, 1)
            }, `+1 (${shifts})`),
            el('button', {
              type: 'button',
              className: 'btn-mini btn-mini-rose',
              onClick: () => adjustMemberShiftCount(m.id, -1)
            }, '-1')
          )
        : null
    );
  });

  mount(container, cards);
}

// ==================== EDIT PROFILE MODAL ("CHỈNH SỬA THÔNG TIN HỒ SƠ" - SCREENSHOT 5) ====================
function openEditProfileModal() {
  if (!currentUser) return;
  const previewImg = document.getElementById('edit-avatar-preview');
  if (previewImg) {
    previewImg.src = resolveAvatarUrl(currentUser);
    previewImg.alt = currentUser.hoTen || 'Ảnh đại diện hồ sơ';
  }
  safeSetValue('input-fullname', currentUser.hoTen || '');
  safeSetValue('input-studentId', getDisplayStudentCode(currentUser));
  safeSetValue('input-faculty', currentUser.lop || '');
  safeSetValue('input-dob', formatMemberDob(currentUser));
  safeSetValue('input-dutyArea', currentUser.boMon || '');
  safeSetValue('input-role', currentUser.chucVu || 'Thành viên');
  safeSetValue('input-phone', currentUser.sdt || '');
  safeSetValue('input-ice', currentUser.ice || currentUser.sdt || '');
  openSheetDialog('edit-profile-modal');
}

function closeEditProfileModal() {
  closeSheetDialog('edit-profile-modal');
}

function saveEditProfileAction() {
  if (!currentUser) return;
  const newName = (document.getElementById('input-fullname')?.value || '').trim();
  const newFaculty = (document.getElementById('input-faculty')?.value || '').trim();
  const newDob = (document.getElementById('input-dob')?.value || '').trim();
  const newArea = (document.getElementById('input-dutyArea')?.value || '').trim();
  const newRole = (document.getElementById('input-role')?.value || '').trim();
  const newPhone = (document.getElementById('input-phone')?.value || '').trim();
  const newIce = (document.getElementById('input-ice')?.value || '').trim();

  if (newName) currentUser.hoTen = newName;
  if (newFaculty) currentUser.lop = newFaculty;
  if (newDob) currentUser.ngaySinh = newDob;
  if (newArea) currentUser.boMon = newArea;
  if (newRole) currentUser.chucVu = newRole;
  if (newPhone) currentUser.sdt = newPhone;
  if (newIce) currentUser.ice = newIce;

  for (const m of (membersDirectory || [])) {
    if (m.id === currentUser.id) {
      m.hoTen = currentUser.hoTen;
      m.lop = currentUser.lop;
      m.ngaySinh = currentUser.ngaySinh;
      m.boMon = currentUser.boMon;
      m.chucVu = currentUser.chucVu;
      m.sdt = currentUser.sdt;
      m.ice = currentUser.ice;
    }
  }

  persistUserSession(currentUser);
  saveLocalState();
  renderProfileData();
  renderMembersModalList();
  closeEditProfileModal();

  const url = `${GAS_API_URL}?action=updateProfile&memberId=${encodeURIComponent(currentUser.id)}&lop=${encodeURIComponent(currentUser.lop || '')}&sdt=${encodeURIComponent(currentUser.sdt || '')}&ice=${encodeURIComponent(currentUser.ice || '')}&yTe=${encodeURIComponent(currentUser.yTe || 'Bình thường')}`;
  if (navigator.onLine) {
    fetch(url).catch(() => enqueueOfflineMutation('UPDATE_PROFILE', {
      memberId: currentUser.id,
      lop: currentUser.lop || '',
      sdt: currentUser.sdt || '',
      ice: currentUser.ice || '',
      yTe: currentUser.yTe || 'Bình thường'
    }));
  } else {
    enqueueOfflineMutation('UPDATE_PROFILE', {
      memberId: currentUser.id,
      lop: currentUser.lop || '',
      sdt: currentUser.sdt || '',
      ice: currentUser.ice || '',
      yTe: currentUser.yTe || 'Bình thường'
    });
  }

  setTimeout(() => {
    openSuccessCelebration({
      kicker: '• SPORTPASS PRO CLOUD',
      title: 'Cập nhật hồ sơ thành công!',
      descNodes: [
        'Thông tin hồ sơ 8 trường của ',
        el('strong', {}, currentUser.hoTen),
        ' đã được lưu và đồng bộ an toàn vào hệ thống SportPass Pro.'
      ]
    });
  }, 240);
}

// ==================== SETTINGS MODAL CONTROLS ====================
function openSettingsModal() {
  renderProfileData();
  syncThemeControlUI();
  openSheetDialog('settings-modal');
}

function closeSettingsModal() {
  closeSheetDialog('settings-modal');
}

function openNotificationModal() {
  renderNotificationsModalList();
  openSheetDialog('notification-modal');
}

function closeNotificationModal() {
  closeSheetDialog('notification-modal');
}

function openChangePasswordModal() {
  closeSheetDialog('settings-modal');
  safeSetValue('iptCurrentPassword', '');
  safeSetValue('iptNewPassword', '');
  safeSetValue('iptConfirmPassword', '');
  setTimeout(() => openSheetDialog('password-modal'), 230);
}

function closeChangePasswordModal() {
  closeSheetDialog('password-modal');
}

function submitChangePassword() {
  if (!currentUser) return;
  const curPass = (document.getElementById('iptCurrentPassword')?.value || '').trim();
  const newPass = (document.getElementById('iptNewPassword')?.value || '').trim();
  const confirmPass = (document.getElementById('iptConfirmPassword')?.value || '').trim();
  const savedPass = localStorage.getItem('CLB_USER_PASS_' + currentUser.id) || '123456';

  if (curPass !== savedPass) {
    showToast('Mật khẩu hiện tại chưa chính xác.');
    return;
  }
  if (newPass.length < 6) {
    showToast('Mật khẩu mới cần tối thiểu 6 ký tự.');
    return;
  }
  if (newPass !== confirmPass) {
    showToast('Xác nhận mật khẩu chưa khớp.');
    return;
  }

  localStorage.setItem('CLB_USER_PASS_' + currentUser.id, newPass);
  closeChangePasswordModal();
  setTimeout(() => {
    openSuccessCelebration({
      kicker: '• SPORTPASS PRO SECURITY',
      title: 'Đổi mật khẩu thành công!',
      descNodes: ['Mật khẩu tài khoản ', el('strong', {}, currentUser.id), ' đã được cập nhật trên thiết bị này.']
    });
  }, 240);
}
