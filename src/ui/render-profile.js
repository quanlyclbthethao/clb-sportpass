// SportPass V8.0 — Profile Hero Card, 8-Row Profile Card, Edit Profile, Settings & Password Renderer

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

  const roleBadge = document.getElementById('role-badge');
  if (roleBadge) {
    roleBadge.textContent = isAdmin ? 'ADMIN' : (currentUser.isShiftLeader ? 'TRƯỞNG CA' : 'HỘI VIÊN');
  }

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

  // Sync Settings Sheet card
  const settingsAvatar = document.getElementById('settings-avatar');
  if (settingsAvatar) {
    settingsAvatar.src = avatarSrc;
    settingsAvatar.alt = currentUser.hoTen || 'Avatar';
  }
  safeSetText('settings-name', currentUser.hoTen || 'Thành viên CLB');
  safeSetText('settings-email', getMemberEmail(currentUser));
  safeSetText('settings-status-badge', currentUser.status || 'Sẵn sàng');

  applyStatusBadgeStyle();
  updateQrPassDisplay();
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
  safeSetText('settings-status-badge', next);
  showToast(`Trạng thái hoạt động: ${next}`);
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
  showToast(`Thể trạng hiện tại: ${nextOpt.short}`);
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
  showToast('Đã cập nhật ảnh đại diện thành viên!');
}

function openEditProfileModal() {
  if (!currentUser) return;
  safeSetValue('input-fullname', currentUser.hoTen || '');
  safeSetValue('input-studentId', getDisplayStudentCode(currentUser));
  safeSetValue('input-faculty', currentUser.lop || '');
  safeSetValue('input-dob', formatMemberDob(currentUser));
  safeSetValue('input-dutyArea', currentUser.boMon || '');
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
  const newStudentId = (document.getElementById('input-studentId')?.value || '').trim();
  const newFaculty = (document.getElementById('input-faculty')?.value || '').trim();
  const newDob = (document.getElementById('input-dob')?.value || '').trim();
  const newArea = (document.getElementById('input-dutyArea')?.value || '').trim();
  const newPhone = (document.getElementById('input-phone')?.value || '').trim();
  const newIce = (document.getElementById('input-ice')?.value || '').trim();

  if (newName) currentUser.hoTen = newName;
  if (newStudentId) currentUser.studentCode = newStudentId;
  if (newFaculty) currentUser.lop = newFaculty;
  if (newDob) currentUser.ngaySinh = newDob;
  if (newArea) currentUser.boMon = newArea;
  if (newPhone) currentUser.sdt = newPhone;
  if (newIce) currentUser.ice = newIce;

  for (const m of (membersDirectory || [])) {
    if (m.id === currentUser.id) {
      m.hoTen = currentUser.hoTen;
      m.studentCode = currentUser.studentCode;
      m.lop = currentUser.lop;
      m.ngaySinh = currentUser.ngaySinh;
      m.boMon = currentUser.boMon;
      m.sdt = currentUser.sdt;
      m.ice = currentUser.ice;
    }
  }

  persistUserSession(currentUser);
  saveLocalState();
  renderProfileData();
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

  setTimeout(() => showToast('Đã cập nhật hồ sơ thành công!'), 200);
}

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
  openSheetDialog('password-modal');
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
  showToast('Đã cập nhật mật khẩu mới thành công!');
}
