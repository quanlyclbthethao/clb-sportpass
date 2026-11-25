// SportPass V8.6 — Profile Hero, Real Account RBAC, 8-Row Interactive Profile, Members Directory & Slim Settings

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

function applyAccountRoleUI() {
  const isAdmin = Boolean(currentUser && currentUser.isAdmin);
  const adminActions = document.getElementById('quick-actions-admin');
  const memberActions = document.getElementById('quick-actions-member');
  if (adminActions) adminActions.classList.toggle('hidden', !isAdmin);
  if (memberActions) memberActions.classList.toggle('hidden', isAdmin);

  const roleBadge = document.getElementById('role-badge');
  if (roleBadge && currentUser) {
    roleBadge.textContent = isAdmin ? 'ADMIN' : 'THÀNH VIÊN';
    roleBadge.classList.toggle('hidden', !isAdmin);
  }
}

function extractPhoneDigits(text) {
  const match = String(text || '').match(/\+?\d[\d\s.-]{6,}\d/);
  return match ? match[0].replace(/[^0-9+]/g, '') : '';
}

function renderProfileData() {
  if (!currentUser) return;
  applyMemberOverrides(membersDirectory);

  const isAdmin = Boolean(currentUser.isAdmin);
  const stats = computeMemberStats(currentUser);
  const avatarSrc = resolveAvatarUrl(currentUser);
  const studentCode = getDisplayStudentCode(currentUser);
  const dobText = formatMemberDob(currentUser);
  const phoneText = currentUser.sdt && String(currentUser.sdt).trim() ? String(currentUser.sdt).trim() : 'Chưa cập nhật';
  const iceText = currentUser.ice && String(currentUser.ice).trim()
    ? String(currentUser.ice).trim()
    : (currentUser.sdt && String(currentUser.sdt).trim() ? String(currentUser.sdt).trim() : 'Chưa cập nhật');

  const hdrImg = document.getElementById('settings-trigger-avatar');
  if (hdrImg) {
    hdrImg.src = avatarSrc;
    hdrImg.alt = currentUser.hoTen || 'Cài đặt tài khoản';
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

  safeSetText('stat-shifts', String(stats.shiftsCount));
  safeSetText('stat-efficiency', stats.onTimeText);
  safeSetText('stat-rating', stats.gradeText);

  safeSetText('display-fullname', currentUser.hoTen || '');
  safeSetText('display-studentId', studentCode);
  safeSetText('display-faculty', currentUser.lop || 'K13.GDTC');
  safeSetText('display-dob', dobText);
  safeSetText('display-dutyArea', currentUser.boMon || 'Ban Nhân Sự');
  safeSetText('display-role', currentUser.chucVu || 'Thành viên');

  const phoneEl = document.getElementById('display-phone');
  if (phoneEl) {
    phoneEl.textContent = phoneText;
    const digits = extractPhoneDigits(phoneText);
    phoneEl.setAttribute('href', digits ? `tel:${digits}` : '#edit-profile-modal');
    phoneEl.dataset.needsEdit = digits ? '0' : '1';
  }

  const iceEl = document.getElementById('display-ice');
  if (iceEl) {
    iceEl.textContent = iceText;
    const iceDigits = extractPhoneDigits(iceText);
    iceEl.setAttribute('href', iceDigits ? `tel:${iceDigits}` : '#edit-profile-modal');
    iceEl.dataset.needsEdit = iceDigits ? '0' : '1';
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
  safeSetText('settings-grade-badge', stats.gradeText);

  const hasCustomPass = localStorage.getItem('CLB_USER_PASS_' + currentUser.id) !== null;
  safeSetText('password-status-desc', hasCustomPass ? 'Đã thiết lập mật khẩu riêng' : 'Đang dùng mật khẩu mặc định (123456)');

  applyStatusBadgeStyle();
  applyAccountRoleUI();
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
  if (!currentUser) return;
  const states = ['Sẵn sàng', 'Đang bận', 'Tạm nghỉ'];
  const cur = currentUser.status || 'Sẵn sàng';
  const next = states[(states.indexOf(cur) + 1) % states.length];
  currentUser.status = next;
  saveMemberOverride(currentUser.id, { status: next });
  persistUserSession(currentUser);
  applyStatusBadgeStyle();
  renderMembersModalList();
  showToast(`Trạng thái: ${next}`);
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
  saveMemberOverride(currentUser.id, { avatar: compressed });
  persistUserSession(currentUser);
  saveLocalState();
  renderProfileData();
  const editPrev = document.getElementById('edit-avatar-preview');
  if (editPrev) editPrev.src = compressed;
  showToast('Đã cập nhật ảnh đại diện thành viên!');
}

// ==================== MEMBERS MODAL ("THÀNH VIÊN CLB") ====================
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
  const uniqueList = Array.from(uniqueMap.values());
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

// ==================== EDIT PROFILE MODAL ====================
function openEditProfileModal(focusFieldId = null) {
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
  if (focusFieldId && typeof focusFieldId === 'string') {
    setTimeout(() => document.getElementById(focusFieldId)?.focus(), 100);
  }
}

function closeEditProfileModal() {
  return closeSheetDialog('edit-profile-modal');
}

async function saveEditProfileAction() {
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
  currentUser.sdt = newPhone;
  currentUser.ice = newIce;

  const patch = {
    hoTen: currentUser.hoTen,
    lop: currentUser.lop,
    ngaySinh: currentUser.ngaySinh,
    boMon: currentUser.boMon,
    chucVu: currentUser.chucVu,
    sdt: currentUser.sdt,
    ice: currentUser.ice
  };

  for (const m of (membersDirectory || [])) {
    if (m.id === currentUser.id) Object.assign(m, patch);
  }

  saveMemberOverride(currentUser.id, patch);
  persistUserSession(currentUser);
  saveLocalState();
  renderProfileData();
  renderMembersModalList();
  dispatchBackendMutation('UPDATE_PROFILE', {
    memberId: currentUser.id,
    lop: currentUser.lop || '',
    sdt: currentUser.sdt || '',
    ice: currentUser.ice || '',
    yTe: currentUser.yTe || 'Bình thường'
  });

  await closeEditProfileModal();
  openSuccessCelebration({
    kicker: '• SPORTPASS PRO CLOUD',
    title: 'Cập nhật hồ sơ thành công!',
    descNodes: [
      'Thông tin hồ sơ của ',
      el('strong', {}, currentUser.hoTen),
      ' đã được lưu và đồng bộ vào hệ thống SportPass.'
    ]
  });
}

// ==================== SETTINGS & PASSWORD MODAL CONTROLS ====================
function openSettingsModal() {
  renderProfileData();
  syncThemeControlUI();
  openSheetDialog('settings-modal');
}

function closeSettingsModal() {
  return closeSheetDialog('settings-modal');
}

function openNotificationModal() {
  renderNotificationsModalList();
  markNotificationsRead();
  openSheetDialog('notification-modal');
}

function closeNotificationModal() {
  return closeSheetDialog('notification-modal');
}

function openChangePasswordModal() {
  switchSheetDialog('settings-modal', 'password-modal', () => {
    safeSetValue('iptCurrentPassword', '');
    safeSetValue('iptNewPassword', '');
    safeSetValue('iptConfirmPassword', '');
  });
}

function closeChangePasswordModal() {
  return closeSheetDialog('password-modal');
}

async function submitChangePassword(ev) {
  if (ev && ev.preventDefault) ev.preventDefault();
  if (!currentUser) return;
  const curPass = (document.getElementById('iptCurrentPassword')?.value || '').trim();
  const newPass = (document.getElementById('iptNewPassword')?.value || '').trim();
  const confirmPass = (document.getElementById('iptConfirmPassword')?.value || '').trim();

  if (!verifyMemberPassword(currentUser.id, curPass)) {
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
  renderProfileData();
  await closeChangePasswordModal();
  openSuccessCelebration({
    kicker: '• SPORTPASS PRO SECURITY',
    title: 'Đổi mật khẩu thành công!',
    descNodes: ['Mật khẩu tài khoản ', el('strong', {}, currentUser.id), ' đã được cập nhật và kích hoạt ngay.']
  });
}
