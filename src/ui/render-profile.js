// SportPass V6.0 — Profile Hero, Digital VIP Pass, Readiness & ICE Renderer

function renderProfileData() {
  if (!currentUser) return;
  applyCustomAdminRoles(membersDirectory);

  const isAdmin = Boolean(currentUser.isAdmin);
  const shiftsCount = Number(currentUser.soCaHoanThanh ?? currentUser.soCa ?? 0);

  safeSetText('card-name', currentUser.hoTen || 'Thành viên CLB');
  safeSetText('card-role-title', currentUser.chucVu || 'Thành viên');
  safeSetText('card-dept-badge', currentUser.boMon || 'Ban Nhân Sự');
  safeSetText('card-mssv', currentUser.id || 'SP0000');

  safeSetText('dFullName', currentUser.hoTen || '');
  safeSetText('dMemberId', currentUser.id || '');
  safeSetText('dClass', currentUser.lop || 'K15.GDTC');
  safeSetText('dDept', currentUser.boMon || 'CLB Thể Thao');
  safeSetText('dRole', currentUser.chucVu || 'Thành viên');
  safeSetText('dPhone', currentUser.sdt || 'Chưa cập nhật');
  safeSetText('dIce', currentUser.ice || currentUser.sdt || 'Trực Y tế CLB');
  safeSetText('dMed', currentUser.yTe || 'Bình thường');

  safeSetText('heroShiftsCount', String(shiftsCount));
  safeSetText('profileFitnessShort', formatShortTheTrang(currentUser.theTrang));

  const roleBadge = document.getElementById('role-badge');
  if (roleBadge) {
    roleBadge.textContent = isAdmin ? 'ADMIN' : (currentUser.isShiftLeader ? 'TRƯỞNG CA' : 'HỘI VIÊN');
  }

  const avatarBox = document.getElementById('profileAvatarBox');
  const avatarInit = document.getElementById('profileAvatarInitials');
  applyAvatarElement(avatarBox, avatarInit, currentUser.hoTen, currentUser.avatar);

  const hdrBtn = document.getElementById('btnHeaderAvatar');
  const hdrInit = document.getElementById('headerAvatarInitials');
  applyAvatarElement(hdrBtn, hdrInit, currentUser.hoTen, currentUser.avatar);

  applyStatusBadgeStyle();
  applyTheTrangBadgeStyle(currentUser.theTrang);
  updateQuickActionsUI(isAdmin);
}

function updateQuickActionsUI(isAdmin) {
  const toolbar = document.getElementById('adminTaskToolbar');
  const adminCard = document.getElementById('adminQuickActionsCard');
  const menuRoleBtn = document.getElementById('btnMenuRoleManagement');
  const adjRow = document.getElementById('adminShiftAdjustRow');

  if (toolbar) toolbar.classList.toggle('hidden', !isAdmin);
  if (adminCard) adminCard.classList.toggle('hidden', !isAdmin);
  if (menuRoleBtn) menuRoleBtn.classList.toggle('hidden', !isAdmin);
  if (adjRow) adjRow.classList.toggle('hidden', !isAdmin);

  const scanBtnProfile = document.getElementById('btnHeroQrScanner');
  if (scanBtnProfile) {
    scanBtnProfile.classList.toggle('hidden', !isAuthorizedScanner());
  }
}

function applyStatusBadgeStyle() {
  if (!currentUser) return;
  const st = currentUser.status || currentCardStatus || 'Sẵn sàng';
  const pill = document.getElementById('hero-status-pill');
  const txt = document.getElementById('hero-status-text');
  if (txt) txt.textContent = st;
  if (pill) {
    const low = st.toLowerCase();
    pill.dataset.tone = low.includes('bận') ? 'busy' : (low.includes('nghỉ') ? 'off' : 'ready');
  }
}

function applyTheTrangBadgeStyle(theTrang) {
  const theme = getTheTrangTheme(theTrang);
  const pill = document.getElementById('profileFitnessToneBadge');
  if (pill) {
    pill.className = `sp-badge sp-badge-${theme.tone}`;
    pill.textContent = theme.exempt ? 'Miễn trực' : 'Sẵn sàng';
  }
}

function toggleStatusDropdown(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const dd = document.getElementById('status-dropdown');
  if (!dd) return;
  dd.classList.toggle('hidden');
}

function selectCardStatus(code, e) {
  if (e && e.stopPropagation) e.stopPropagation();
  currentCardStatus = code;
  if (currentUser) {
    currentUser.status = code;
    sessionStorage.setItem('CLB_SPORTPASS_AUTH_SESSION', JSON.stringify(currentUser));
    if (localStorage.getItem('CLB_REMEMBER_LOGIN') === 'true') {
      localStorage.setItem('CLB_SPORTPASS_AUTH_SESSION', JSON.stringify(currentUser));
    }
  }
  applyStatusBadgeStyle();
  const dd = document.getElementById('status-dropdown');
  if (dd) dd.classList.add('hidden');
  showAquaIsland(`Trạng thái thẻ: ${code}`, '🟢');
}

function cycleStatus() {
  const states = ['Sẵn sàng', 'Đang bận', 'Tạm nghỉ'];
  const cur = (currentUser && currentUser.status) ? currentUser.status : 'Sẵn sàng';
  const next = states[(states.indexOf(cur) + 1) % states.length];
  selectCardStatus(next);
}

function openDigitalSportPassModal() {
  if (!currentUser) return;
  safeSetText('vipCardMemberName', currentUser.hoTen || '');
  safeSetText('vipCardMemberRole', currentUser.chucVu || 'Thành viên');
  safeSetText('vipCardMemberId', currentUser.id || '');
  safeSetText('vipCardMemberClass', currentUser.lop || '');
  safeSetText('vipCardMemberDept', currentUser.boMon || '');
  safeSetText('vipCardMemberShifts', String(currentUser.soCaHoanThanh ?? currentUser.soCa ?? 0));
  generateDynamicQrPass();
  openGenericModal('modalDigitalSportPassCard');
}

function closeDigitalSportPassModal() {
  closeGenericModal('modalDigitalSportPassCard');
}

function openTheTrangModal() {
  const cur = currentUser ? (currentUser.theTrang || 'Khỏe mạnh (100% Sẵn sàng)') : 'Khỏe mạnh (100% Sẵn sàng)';
  const sel = document.getElementById('selTheTrangLevel');
  if (sel) sel.value = cur;
  openGenericModal('modalTheTrang');
}

function closeTheTrangModal() {
  closeGenericModal('modalTheTrang');
}

function selectTheTrang(theTrangValue) {
  if (!currentUser) return;
  currentUser.theTrang = theTrangValue;
  for (const m of (membersDirectory || [])) {
    if (m.id === currentUser.id) m.theTrang = theTrangValue;
  }
  sessionStorage.setItem('CLB_SPORTPASS_AUTH_SESSION', JSON.stringify(currentUser));
  saveLocalState();
  renderProfileData();
  closeTheTrangModal();
  showAquaIsland(`Đã cập nhật thể trạng: ${formatShortTheTrang(theTrangValue)}`, '💪');
}

function openAvatarModal() {
  const preview = document.getElementById('avatarPreviewImg');
  if (preview && currentUser) {
    preview.src = currentUser.avatar || '';
    preview.classList.toggle('hidden', !currentUser.avatar);
  }
  openGenericModal('modalAvatar');
}

function closeAvatarModal() {
  closeGenericModal('modalAvatar');
}

async function handleAvatarFileSelect(event) {
  const file = event && event.target && event.target.files ? event.target.files[0] : null;
  if (!file || !currentUser) return;
  const compressed = await compressImage(file, 420, 420, 0.78);
  if (!compressed) return;
  currentUser.avatar = compressed;
  for (const m of (membersDirectory || [])) {
    if (m.id === currentUser.id) m.avatar = compressed;
  }
  sessionStorage.setItem('CLB_SPORTPASS_AUTH_SESSION', JSON.stringify(currentUser));
  if (localStorage.getItem('CLB_REMEMBER_LOGIN') === 'true') {
    localStorage.setItem('CLB_SPORTPASS_AUTH_SESSION', JSON.stringify(currentUser));
  }
  saveLocalState();
  renderProfileData();
  closeAvatarModal();
  showAquaIsland('Đã cập nhật ảnh đại diện SportPass.', '📸');
}

function openEditProfileModal() {
  if (!currentUser) return;
  safeSetValue('editProfileClass', currentUser.lop || '');
  safeSetValue('editProfilePhone', currentUser.sdt || '');
  safeSetValue('editProfileIce', currentUser.ice || currentUser.sdt || '');
  safeSetValue('editProfileMed', currentUser.yTe || 'Bình thường');
  openGenericModal('modalEditProfile');
}

function closeEditProfileModal() {
  closeGenericModal('modalEditProfile');
}

async function saveMemberProfileEdit() {
  if (!currentUser) return;
  const lop = (document.getElementById('editProfileClass')?.value || '').trim();
  const sdt = (document.getElementById('editProfilePhone')?.value || '').trim();
  const ice = (document.getElementById('editProfileIce')?.value || '').trim();
  const yTe = (document.getElementById('editProfileMed')?.value || '').trim() || 'Bình thường';

  currentUser.lop = lop || currentUser.lop;
  currentUser.sdt = sdt || currentUser.sdt;
  currentUser.ice = ice || currentUser.ice;
  currentUser.yTe = yTe;

  for (const m of (membersDirectory || [])) {
    if (m.id === currentUser.id) {
      m.lop = currentUser.lop;
      m.sdt = currentUser.sdt;
      m.ice = currentUser.ice;
      m.yTe = currentUser.yTe;
    }
  }

  sessionStorage.setItem('CLB_SPORTPASS_AUTH_SESSION', JSON.stringify(currentUser));
  if (localStorage.getItem('CLB_REMEMBER_LOGIN') === 'true') {
    localStorage.setItem('CLB_SPORTPASS_AUTH_SESSION', JSON.stringify(currentUser));
  }
  saveLocalState();
  renderProfileData();
  closeEditProfileModal();

  const url = `${GAS_API_URL}?action=updateProfile&memberId=${encodeURIComponent(currentUser.id)}&lop=${encodeURIComponent(currentUser.lop)}&sdt=${encodeURIComponent(currentUser.sdt)}&ice=${encodeURIComponent(currentUser.ice)}&yTe=${encodeURIComponent(currentUser.yTe)}`;
  if (navigator.onLine) {
    fetch(url).catch(() => enqueueOfflineMutation('UPDATE_PROFILE', { memberId: currentUser.id, lop: currentUser.lop, sdt: currentUser.sdt, ice: currentUser.ice, yTe: currentUser.yTe }));
  } else {
    enqueueOfflineMutation('UPDATE_PROFILE', { memberId: currentUser.id, lop: currentUser.lop, sdt: currentUser.sdt, ice: currentUser.ice, yTe: currentUser.yTe });
  }
  showAquaIsland('Đã lưu thay đổi hồ sơ thành viên.', '✅');
}

function openChangePasswordModal() {
  safeSetValue('iptCurrentPassword', '');
  safeSetValue('iptNewPassword', '');
  safeSetValue('iptConfirmPassword', '');
  openGenericModal('modalChangePassword');
}

function closeChangePasswordModal() {
  closeGenericModal('modalChangePassword');
}

function submitChangePassword() {
  if (!currentUser) return;
  const curPass = (document.getElementById('iptCurrentPassword')?.value || '').trim();
  const newPass = (document.getElementById('iptNewPassword')?.value || '').trim();
  const confirmPass = (document.getElementById('iptConfirmPassword')?.value || '').trim();
  const savedPass = localStorage.getItem('CLB_USER_PASS_' + currentUser.id) || '123456';

  if (curPass !== savedPass) {
    showAquaIsland('Mật khẩu hiện tại chưa chính xác.', '🔒');
    return;
  }
  if (newPass.length < 6) {
    showAquaIsland('Mật khẩu mới cần tối thiểu 6 ký tự.', '⚠️');
    return;
  }
  if (newPass !== confirmPass) {
    showAquaIsland('Xác nhận mật khẩu chưa khớp.', '⚠️');
    return;
  }

  localStorage.setItem('CLB_USER_PASS_' + currentUser.id, newPass);
  closeChangePasswordModal();
  showAquaIsland('Đã cập nhật mật khẩu thành công.', '🔐');
}

function handleSaveNewPassword() {
  submitChangePassword();
}

function openEmergencyIceModal() {
  if (currentUser) {
    safeSetText('iceContactNumber', currentUser.ice || currentUser.sdt || '0975364478');
    safeSetText('iceMemberMedNote', currentUser.yTe || 'Bình thường');
  }
  openGenericModal('modalEmergencyIce');
}

function closeEmergencyIceModal() {
  closeGenericModal('modalEmergencyIce');
}

function makePhoneCall(number) {
  const clean = String(number || '').replace(/[^0-9+]/g, '');
  if (!clean) {
    showAquaIsland('Số điện thoại chưa được cập nhật.', '⚠️');
    return;
  }
  window.location.href = `tel:${clean}`;
}

function callContactDirect() {
  makePhoneCall(currentUser ? currentUser.sdt : '');
}

function callEmergencyDirect() {
  openEmergencyIceModal();
}

function executeIceDirectCall() {
  const num = (currentUser && (currentUser.ice || currentUser.sdt)) ? (currentUser.ice || currentUser.sdt) : '115';
  makePhoneCall(num);
}

function shareSosLocationSms() {
  const ice = currentUser ? (currentUser.ice || currentUser.sdt || '') : '';
  const body = `KHẨN CẤP CLB THỂ THAO UHD: Thành viên ${currentUser ? currentUser.hoTen : ''} (${currentUser ? currentUser.id : ''}) cần hỗ trợ y tế.`;
  window.location.href = `sms:${encodeURIComponent(ice)}?body=${encodeURIComponent(body)}`;
}

function openNearestHospitalsMap() {
  window.open('https://www.google.com/maps/search/bệnh+viện+gần+Đại+học+Hải+Dương/', '_blank', 'noopener');
}

function openHelpCenterModal() {
  openGenericModal('modalHelpCenter');
}

function closeHelpCenterModal() {
  closeGenericModal('modalHelpCenter');
}
