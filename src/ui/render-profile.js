// SportPass V8.8 — Profile Hero, RBAC, ID/MSSV Separation, Members Directory (Stats + Add + Delete) & Registration

let expandedAdminMemberId = null;
let pendingDeleteMemberId = null;
let isAddMemberIdManual = false;

function populateSelectOptions(selectId, optionsList, selectedValue) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const list = Array.isArray(optionsList) ? optionsList.slice() : [];
  if (selectedValue && !list.includes(selectedValue)) {
    list.unshift(selectedValue);
  }
  mount(sel, list.map(opt => el('option', { value: opt, selected: opt === selectedValue }, opt)));
  if (selectedValue) sel.value = selectedValue;
}

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

  const addMemberBtn = document.getElementById('admin-add-member-btn');
  if (addMemberBtn) addMemberBtn.classList.toggle('hidden', !isAdmin);
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
  const studentDisplay = studentCode || 'Chưa cập nhật';
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
  safeSetText('card-member-id', currentUser.id || 'SP0000');
  safeSetText('card-mssv', studentDisplay);

  safeSetText('stat-shifts', String(stats.shiftsCount));
  safeSetText('stat-activities', String(stats.activitiesCount));

  safeSetText('display-fullname', currentUser.hoTen || '');
  safeSetText('display-memberId', currentUser.id || '');
  const mssvEl = document.getElementById('display-studentId');
  if (mssvEl) {
    mssvEl.textContent = studentDisplay;
    mssvEl.dataset.needsEdit = studentCode ? '0' : '1';
  }
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

  const settingsAvatar = document.getElementById('settings-avatar');
  if (settingsAvatar) {
    settingsAvatar.src = avatarSrc;
    settingsAvatar.alt = currentUser.hoTen || 'Avatar';
  }
  safeSetText('settings-role-kicker', isAdmin ? 'ĐIỀU PHỐI VIÊN' : String(currentUser.boMon || 'HỘI VIÊN CLB').toUpperCase());
  safeSetText('settings-name', currentUser.hoTen || 'Thành viên CLB');
  safeSetText('settings-submeta', `ID: ${currentUser.id} • MSSV: ${studentDisplay} • ${currentUser.lop || 'UHD'}`);
  safeSetText('settings-grade-badge', `${stats.shiftsCount} ca · ${stats.activitiesCount} SH`);

  safeSetText('password-status-desc', hasCustomMemberPassword(currentUser) ? 'Đã thiết lập mật khẩu riêng' : 'Đang dùng mật khẩu mặc định (123456)');

  applyStatusBadgeStyle();
  applyAccountRoleUI();
  if (document.getElementById('qr-modal')?.open) {
    updateQrPassDisplay();
  }
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
  const inputEl = event && event.target ? event.target : null;
  const file = inputEl && inputEl.files ? inputEl.files[0] : null;
  if (!file || !currentUser) {
    if (inputEl) inputEl.value = '';
    return;
  }
  const compressed = await compressImage(file, 320, 320, 0.8);
  if (inputEl) inputEl.value = '';
  if (!compressed) {
    showToast('Không thể đọc ảnh đại diện đã chọn.');
    return;
  }
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
    const inDept = currentDirDeptFilter === 'ALL' || m.boMon === currentDirDeptFilter || (Array.isArray(m.cacBan) && m.cacBan.includes(currentDirDeptFilter));
    if (!inDept) return false;
    if (!q) return true;
    return (
      String(m.hoTen || '').toLowerCase().includes(q) ||
      String(m.id || '').toLowerCase().includes(q) ||
      getDisplayStudentCode(m).toLowerCase().includes(q) ||
      String(m.lop || '').toLowerCase().includes(q) ||
      String(m.boMon || '').toLowerCase().includes(q) ||
      (Array.isArray(m.cacBan) && m.cacBan.join(' ').toLowerCase().includes(q))
    );
  });

  safeSetText('membersCountBadge', `${visible.length} / ${uniqueList.length}`);

  if (visible.length === 0) {
    mount(container, el('div', { className: 'empty-card' }, 'Không tìm thấy thành viên phù hợp.'));
    return;
  }

  const isAdmin = Boolean(currentUser && currentUser.isAdmin);
  const cards = visible.map((m) => {
    const isMe = currentUser && m.id === currentUser.id;
    const isRoot = m.id === 'DMC0806';
    const mStats = computeMemberStats(m);
    const mCode = getDisplayStudentCode(m);
    const idLine = mCode ? `ID: ${m.id} · MSSV: ${mCode}` : `ID: ${m.id}`;
    const isExpanded = isAdmin && expandedAdminMemberId === m.id;

    const adminDrawer = isExpanded
      ? el('div', { className: 'mini-action-grid', style: { width: '100%', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' } },
          !isMe
            ? el('button', {
                type: 'button',
                className: `btn-mini ${m.isAdmin ? 'btn-mini-sky' : 'btn-mini-soft'}`,
                disabled: isRoot,
                onClick: () => toggleMemberRole(m.id, 'admin')
              }, m.isAdmin ? 'Admin ✓' : 'Cấp Admin')
            : null,
          !isMe
            ? el('button', {
                type: 'button',
                className: `btn-mini ${m.isShiftLeader ? 'btn-mini-emerald' : 'btn-mini-soft'}`,
                disabled: isRoot,
                onClick: () => toggleMemberRole(m.id, 'leader')
              }, m.isShiftLeader ? 'Trưởng ca ✓' : 'Trưởng ca')
            : null,
          el('button', {
            type: 'button',
            className: 'btn-mini btn-mini-soft',
            onClick: () => adjustMemberShiftCount(m.id, 1, 'shift')
          }, '+1 Trực'),
          el('button', {
            type: 'button',
            className: 'btn-mini btn-mini-rose',
            onClick: () => adjustMemberShiftCount(m.id, -1, 'shift')
          }, '-1 Trực'),
          el('button', {
            type: 'button',
            className: 'btn-mini btn-mini-soft',
            onClick: () => adjustMemberShiftCount(m.id, 1, 'activity')
          }, '+1 SH'),
          el('button', {
            type: 'button',
            className: 'btn-mini btn-mini-rose',
            onClick: () => adjustMemberShiftCount(m.id, -1, 'activity')
          }, '-1 SH'),
          (!isMe && !isRoot)
            ? el('button', {
                type: 'button',
                className: 'btn-mini btn-mini-rose',
                onClick: () => openConfirmDeleteMemberModal(m.id)
              }, 'Xóa thành viên')
            : null
        )
      : null;

    return el('div', { className: 'member-pill-row', dataset: { memberId: m.id } },
      el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '10px' } },
        el('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', minWidth: '0', flex: '1' } },
          el('div', { className: `avatar-initials-circle${isMe ? ' solid' : ''}` }, getSportPassInitials(m.hoTen)),
          el('div', { style: { minWidth: '0', flex: '1' } },
            el('div', { style: { fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' }, className: 'truncate' }, `${m.hoTen}${isMe ? ' (Bạn)' : ''}`),
            el('div', { className: 'font-mono truncate', style: { fontSize: '11px', color: '#0369a1' } }, idLine),
            el('div', { style: { fontSize: '11px', color: 'var(--text-muted)' }, className: 'truncate' }, `${m.chucVu} • ${m.lop || 'UHD'} • ${m.boMon || 'CLB'}`)
          )
        ),
        el('span', { className: 'ready-badge-pill' }, m.status || 'Sẵn sàng')
      ),
      el('div', { className: 'member-stats-strip' },
        el('div', { className: 'member-stat-badges' },
          el('span', { className: 'member-stat-pill sky' }, `${mStats.shiftsCount} ca trực`),
          el('span', { className: 'member-stat-pill teal' }, `${mStats.activitiesCount} ca sinh hoạt`)
        ),
        isAdmin
          ? el('button', {
              type: 'button',
              className: 'btn-mini btn-mini-soft',
              ariaExpanded: String(isExpanded),
              onClick: () => {
                expandedAdminMemberId = isExpanded ? null : m.id;
                renderMembersModalList();
              }
            }, isExpanded ? 'Thu gọn ▲' : 'Quản lý ▾')
          : null
      ),
      adminDrawer
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
  safeSetValue('input-memberId', currentUser.id || '');
  safeSetValue('input-studentId', getDisplayStudentCode(currentUser));
  safeSetValue('input-faculty', currentUser.lop || '');
  safeSetValue('input-dob', formatMemberDob(currentUser));
  populateSelectOptions('input-dutyArea', ALL_DEPARTMENTS, currentUser.boMon || 'Ban Nhân Sự');
  populateSelectOptions('input-role', STANDARD_ROLES, normalizeRoleValue(currentUser.chucVu));
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
  const newStudentCode = (document.getElementById('input-studentId')?.value || '').trim();
  const newFaculty = (document.getElementById('input-faculty')?.value || '').trim();
  let newDob = (document.getElementById('input-dob')?.value || '').trim();
  const newArea = (document.getElementById('input-dutyArea')?.value || '').trim();
  const newRole = (document.getElementById('input-role')?.value || '').trim();
  const newPhone = (document.getElementById('input-phone')?.value || '').trim();
  const newIce = (document.getElementById('input-ice')?.value || '').trim();

  if (!newName) {
    showToast('Vui lòng nhập họ và tên.');
    document.getElementById('input-fullname')?.focus();
    return;
  }

  if (newStudentCode) {
    if (/[:·]/.test(newStudentCode)) {
      showToast('Mã số sinh viên không được chứa ký tự ":" hoặc "·".');
      document.getElementById('input-studentId')?.focus();
      return;
    }
    const codeUpper = newStudentCode.toUpperCase();
    const conflict = (membersDirectory || []).find(m =>
      m && m.id !== currentUser.id && (
        String(m.id || '').toUpperCase() === codeUpper ||
        getDisplayStudentCode(m).toUpperCase() === codeUpper
      )
    );
    if (conflict) {
      showToast(`Mã số sinh viên ${newStudentCode} đã được dùng bởi ${conflict.hoTen}.`);
      document.getElementById('input-studentId')?.focus();
      return;
    }
  }

  const normPhone = normalizePhoneVN(newPhone);
  if (newPhone) {
    if (normPhone.length < 9) {
      showToast('Số điện thoại cần tối thiểu 9 chữ số hợp lệ.');
      document.getElementById('input-phone')?.focus();
      return;
    }
    const phoneConflict = (membersDirectory || []).find(m =>
      m && m.id !== currentUser.id && normalizePhoneVN(m.sdt) === normPhone
    );
    if (phoneConflict) {
      showToast(`Số điện thoại này đã được dùng bởi ${phoneConflict.hoTen}.`);
      document.getElementById('input-phone')?.focus();
      return;
    }
  }

  if (newDob) {
    const dobParts = newDob.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dobParts) {
      newDob = `${dobParts[1].padStart(2, '0')}/${dobParts[2].padStart(2, '0')}/${dobParts[3]}`;
    }
    if (!DOB_REGEX.test(newDob)) {
      showToast('Ngày sinh cần đúng định dạng DD/MM/YYYY (ví dụ: 08/06/2003).');
      document.getElementById('input-dob')?.focus();
      return;
    }
  }

  currentUser.hoTen = newName;
  currentUser.studentCode = newStudentCode;
  currentUser.mssv = newStudentCode;
  if (newFaculty) currentUser.lop = newFaculty;
  if (newDob) currentUser.ngaySinh = newDob;
  if (newArea) {
    currentUser.boMon = newArea;
    if (!Array.isArray(currentUser.cacBan) || currentUser.cacBan.length <= 1) {
      currentUser.cacBan = [newArea];
    } else if (!currentUser.cacBan.includes(newArea)) {
      currentUser.cacBan.push(newArea);
    }
  }
  if (newRole) currentUser.chucVu = newRole;
  currentUser.sdt = normPhone || newPhone;
  currentUser.ice = newIce;

  const patch = {
    hoTen: currentUser.hoTen,
    studentCode: newStudentCode,
    mssv: newStudentCode,
    lop: currentUser.lop,
    ngaySinh: currentUser.ngaySinh,
    boMon: currentUser.boMon,
    cacBan: Array.isArray(currentUser.cacBan) ? currentUser.cacBan.slice() : [currentUser.boMon],
    chucVu: currentUser.chucVu,
    sdt: currentUser.sdt,
    ice: currentUser.ice
  };

  for (const m of (membersDirectory || [])) {
    if (m.id === currentUser.id) {
      Object.assign(m, patch);
    }
  }

  saveMemberOverride(currentUser.id, patch);
  persistUserSession(currentUser);
  saveLocalState();
  renderProfileData();
  if (document.getElementById('members-modal')?.open) renderMembersModalList();
  if (document.getElementById('approve-shift-modal')?.open || document.getElementById('task-mission-modal')?.open) {
    renderDispatchHub();
  }
  dispatchBackendMutation('UPDATE_PROFILE', {
    memberId: currentUser.id,
    hoTen: currentUser.hoTen || '',
    studentCode: newStudentCode,
    lop: currentUser.lop || '',
    boMon: currentUser.boMon || '',
    chucVu: currentUser.chucVu || '',
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

  const curHash = await sha256Hex(curPass);
  if (!(await verifyMemberPasswordHash(currentUser.id, curHash))) {
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

  const newHash = await sha256Hex(newPass);
  setStoredPasswordHash(currentUser.id, newHash);
  currentUser.hasCustomPassword = (newHash !== DEFAULT_PASS_HASH);
  persistUserSession(currentUser);
  renderProfileData();
  dispatchBackendMutation('UPDATE_PASSWORD', {
    memberId: currentUser.id,
    oldPasswordHash: curHash,
    newPasswordHash: newHash
  });
  await closeChangePasswordModal();
  openSuccessCelebration({
    kicker: '• SPORTPASS PRO SECURITY',
    title: 'Đổi mật khẩu thành công!',
    descNodes: ['Mật khẩu tài khoản ', el('strong', {}, currentUser.id), ' đã được cập nhật và đồng bộ an toàn.']
  });
}

// ==================== SELF-REGISTRATION MODAL ====================
function updateRegisterPreviewId() {
  const name = document.getElementById('reg-fullname')?.value || '';
  const dob = document.getElementById('reg-dob')?.value || '';
  safeSetText('reg-preview-id', generateClientMemberId(name, dob));
}

function openRegisterModal() {
  safeSetValue('reg-fullname', '');
  safeSetValue('reg-dob', '');
  safeSetValue('reg-studentId', '');
  safeSetValue('reg-phone', '');
  safeSetValue('reg-faculty', '');
  safeSetValue('reg-password', '');
  safeSetValue('reg-confirm-password', '');
  populateSelectOptions('reg-department', ALL_DEPARTMENTS, 'Ban Bóng Chuyền');
  safeSetText('reg-preview-id', 'SP0101');
  openSheetDialog('register-modal');
}

function closeRegisterModal() {
  return closeSheetDialog('register-modal');
}

function normalizeInputDob(rawDob) {
  const trimmed = String(rawDob || '').trim();
  const m = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (!m) return '';
  return `${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}/${m[3]}`;
}

function checkStudentCodeAndPhoneConflict(studentCode, normPhone, excludeId = '') {
  if (studentCode) {
    if (/[:·]/.test(studentCode)) return 'Mã số sinh viên không được chứa ký tự ":" hoặc "·".';
    const upper = studentCode.toUpperCase();
    const hit = (membersDirectory || []).find(m =>
      m && m.id !== excludeId && (String(m.id || '').toUpperCase() === upper || getDisplayStudentCode(m).toUpperCase() === upper)
    );
    if (hit) return `MSSV ${studentCode} đã được dùng bởi ${hit.hoTen}.`;
  }
  if (normPhone) {
    if (normPhone.length < 9) return 'Số điện thoại cần tối thiểu 9 chữ số hợp lệ.';
    const hitPhone = (membersDirectory || []).find(m => m && m.id !== excludeId && normalizePhoneVN(m.sdt) === normPhone);
    if (hitPhone) return `Số điện thoại này đã được dùng bởi ${hitPhone.hoTen}.`;
  }
  return '';
}

async function submitSelfRegisterAction(ev) {
  if (ev && ev.preventDefault) ev.preventDefault();
  const hoTen = (document.getElementById('reg-fullname')?.value || '').trim();
  const dob = normalizeInputDob(document.getElementById('reg-dob')?.value || '');
  const studentCode = (document.getElementById('reg-studentId')?.value || '').trim();
  const rawPhone = (document.getElementById('reg-phone')?.value || '').trim();
  const normPhone = normalizePhoneVN(rawPhone);
  const lop = (document.getElementById('reg-faculty')?.value || '').trim();
  const boMon = (document.getElementById('reg-department')?.value || '').trim() || 'Ban Bóng Chuyền';
  const pass = (document.getElementById('reg-password')?.value || '').trim();
  const confirmPass = (document.getElementById('reg-confirm-password')?.value || '').trim();

  if (hoTen.length < 2) { showToast('Vui lòng nhập đầy đủ họ và tên.'); document.getElementById('reg-fullname')?.focus(); return; }
  if (!DOB_REGEX.test(dob)) { showToast('Ngày sinh cần đúng định dạng DD/MM/YYYY.'); document.getElementById('reg-dob')?.focus(); return; }
  if (!rawPhone || normPhone.length < 9) { showToast('Vui lòng nhập số điện thoại hợp lệ (>= 9 số).'); document.getElementById('reg-phone')?.focus(); return; }
  if (!lop) { showToast('Vui lòng nhập Khoa / Lớp.'); document.getElementById('reg-faculty')?.focus(); return; }
  if (pass.length < 6) { showToast('Mật khẩu cần tối thiểu 6 ký tự.'); document.getElementById('reg-password')?.focus(); return; }
  if (pass !== confirmPass) { showToast('Xác nhận mật khẩu chưa khớp.'); document.getElementById('reg-confirm-password')?.focus(); return; }

  const dupErr = checkStudentCodeAndPhoneConflict(studentCode, normPhone);
  if (dupErr) { showToast(dupErr); return; }

  const memberId = generateClientMemberId(hoTen, dob);
  const passHash = await sha256Hex(pass);
  const newMember = normalizeMember({
    id: memberId,
    hoTen,
    ngaySinh: dob,
    studentCode,
    mssv: studentCode,
    lop,
    boMon,
    chucVu: 'Thành viên',
    sdt: normPhone,
    ice: normPhone,
    yTe: 'Bình thường',
    soCaHoanThanh: 0,
    soCaSinhHoat: 0,
    isAdmin: false,
    isShiftLeader: false,
    hasCustomPassword: passHash !== DEFAULT_PASS_HASH
  });

  setStoredPasswordHash(memberId, passHash);
  upsertCustomMember(newMember);
  rebuildMembersDirectory();
  dispatchBackendMutation('REGISTER_MEMBER', {
    id: memberId,
    hoTen,
    ngaySinh: dob,
    studentCode,
    lop,
    boMon,
    chucVu: 'Thành viên',
    sdt: normPhone,
    ice: normPhone,
    passwordHash: passHash
  });

  await closeRegisterModal();
  completeUserLogin(newMember, true, passHash);
  openSuccessCelebration({
    kicker: '• THẺ MỚI ĐÃ KÍCH HOẠT',
    title: 'Đăng ký thành công!',
    descNodes: [
      'Chào mừng ', el('strong', {}, hoTen), '. Mã ID CLB của bạn là ',
      el('strong', {}, memberId), '. Bạn có thể đăng nhập bằng Mã ID, MSSV hoặc SĐT.'
    ]
  });
}

// ==================== ADMIN ADD / DELETE MEMBER MODALS ====================
function updateAddMemberAutoId() {
  if (isAddMemberIdManual) return;
  const name = document.getElementById('add-fullname')?.value || '';
  const dob = document.getElementById('add-dob')?.value || '';
  safeSetValue('add-memberId', generateClientMemberId(name, dob));
}

function openAddMemberModal() {
  if (!currentUser || !currentUser.isAdmin) {
    showToast('Chỉ Quản trị viên mới có quyền thêm thành viên.');
    return;
  }
  isAddMemberIdManual = false;
  safeSetValue('add-fullname', '');
  safeSetValue('add-dob', '');
  safeSetValue('add-memberId', '');
  safeSetValue('add-studentId', '');
  safeSetValue('add-phone', '');
  safeSetValue('add-faculty', '');
  safeSetValue('add-password', '123456');
  populateSelectOptions('add-department', ALL_DEPARTMENTS, 'Ban Nhân Sự');
  populateSelectOptions('add-role', STANDARD_ROLES, 'Thành viên');
  openSheetDialog('add-member-modal');
}

function closeAddMemberModal() {
  return closeSheetDialog('add-member-modal');
}

async function submitAddMemberAction(ev) {
  if (ev && ev.preventDefault) ev.preventDefault();
  if (!currentUser || !currentUser.isAdmin) return;

  const hoTen = (document.getElementById('add-fullname')?.value || '').trim();
  const dob = normalizeInputDob(document.getElementById('add-dob')?.value || '');
  const manualId = (document.getElementById('add-memberId')?.value || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  const studentCode = (document.getElementById('add-studentId')?.value || '').trim();
  const rawPhone = (document.getElementById('add-phone')?.value || '').trim();
  const normPhone = normalizePhoneVN(rawPhone);
  const lop = (document.getElementById('add-faculty')?.value || '').trim() || 'K16-GDTC';
  const boMon = (document.getElementById('add-department')?.value || '').trim() || 'Ban Nhân Sự';
  const chucVu = (document.getElementById('add-role')?.value || '').trim() || 'Thành viên';
  const initPass = (document.getElementById('add-password')?.value || '').trim() || '123456';

  if (hoTen.length < 2) { showToast('Vui lòng nhập họ và tên thành viên.'); document.getElementById('add-fullname')?.focus(); return; }
  if (!DOB_REGEX.test(dob)) { showToast('Ngày sinh cần đúng định dạng DD/MM/YYYY.'); document.getElementById('add-dob')?.focus(); return; }
  if (initPass.length < 6) { showToast('Mật khẩu khởi tạo cần tối thiểu 6 ký tự.'); return; }

  const dupErr = checkStudentCodeAndPhoneConflict(studentCode, rawPhone ? normPhone : '');
  if (dupErr) { showToast(dupErr); return; }

  const memberId = manualId || generateClientMemberId(hoTen, dob);
  const idTaken = (membersDirectory || []).some(m => String(m?.id || '').toUpperCase() === memberId) ||
    getDeletedMemberIds().includes(memberId);
  if (idTaken) {
    showToast(`Mã ID ${memberId} đã tồn tại hoặc nằm trong danh sách đã xóa.`);
    document.getElementById('add-memberId')?.focus();
    return;
  }

  const passHash = await sha256Hex(initPass);
  const newMember = normalizeMember({
    id: memberId,
    hoTen,
    ngaySinh: dob,
    studentCode,
    mssv: studentCode,
    lop,
    boMon,
    chucVu,
    sdt: normPhone || rawPhone,
    ice: normPhone || rawPhone,
    yTe: 'Bình thường',
    soCaHoanThanh: 0,
    soCaSinhHoat: 0,
    isAdmin: false,
    isShiftLeader: false,
    hasCustomPassword: passHash !== DEFAULT_PASS_HASH
  });

  setStoredPasswordHash(memberId, passHash);
  upsertCustomMember(newMember);
  rebuildMembersDirectory();
  saveLocalState();

  dispatchBackendMutation('ADD_MEMBER', {
    id: memberId,
    hoTen,
    ngaySinh: dob,
    studentCode,
    lop,
    boMon,
    chucVu,
    sdt: newMember.sdt,
    ice: newMember.ice,
    passwordHash: passHash,
    adminActorId: currentUser.id
  });

  await closeAddMemberModal();
  if (document.getElementById('members-modal')?.open) renderMembersModalList();
  showToast(`Đã thêm ${hoTen} (${memberId}) vào ${boMon}.`);
}

function openConfirmDeleteMemberModal(memberId) {
  if (!currentUser || !currentUser.isAdmin) {
    showToast('Chỉ Quản trị viên mới có quyền xóa thành viên.');
    return;
  }
  const cleanId = String(memberId || '').trim();
  if (!cleanId || cleanId === 'DMC0806' || cleanId === currentUser.id) {
    showToast('Không thể xóa Quản trị gốc DMC0806 hoặc tài khoản đang đăng nhập.');
    return;
  }
  const target = (membersDirectory || []).find(m => m && m.id === cleanId);
  if (!target) return;

  pendingDeleteMemberId = cleanId;
  const descEl = document.getElementById('confirm-delete-desc');
  if (descEl) {
    const code = getDisplayStudentCode(target);
    mount(descEl, [
      'Xác nhận xóa ', el('strong', {}, target.hoTen),
      ` (ID: ${target.id}${code ? ' · MSSV: ' + code : ''}) khỏi `,
      el('strong', {}, (target.cacBan || [target.boMon]).join(', ')),
      '? Dữ liệu sẽ được lưu dự phòng vào ArchivedMembers.'
    ]);
  }
  openSheetDialog('confirm-delete-modal');
}

function closeConfirmDeleteMemberModal() {
  pendingDeleteMemberId = null;
  return closeSheetDialog('confirm-delete-modal');
}

async function confirmDeleteMemberAction() {
  if (!currentUser || !currentUser.isAdmin || !pendingDeleteMemberId) return;
  const targetId = pendingDeleteMemberId;
  if (targetId === 'DMC0806' || targetId === currentUser.id) return;

  saveDeletedMemberId(targetId);
  removeCustomMember(targetId);
  const customRoles = getCustomAdminRoles();
  if (customRoles[targetId]) {
    delete customRoles[targetId];
    saveCustomAdminRoles(customRoles);
  }
  try {
    const overrides = getMemberOverrides();
    if (overrides[targetId]) {
      delete overrides[targetId];
      localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
    }
    localStorage.removeItem('CLB_USER_PASS_HASH_' + targetId);
    localStorage.removeItem('CLB_USER_PASS_' + targetId);
  } catch (e) {}

  for (const t of (currentTasks || [])) {
    if (!t) continue;
    t.joinedMembers = (t.joinedMembers || []).filter(x => x !== targetId);
    t.assignedMembers = (t.assignedMembers || []).filter(x => x !== targetId);
    t.waitlist = (t.waitlist || []).filter(x => x !== targetId);
  }

  if (expandedAdminMemberId === targetId) expandedAdminMemberId = null;
  rebuildMembersDirectory();
  saveLocalState();

  dispatchBackendMutation('DELETE_MEMBER', {
    memberId: targetId,
    adminActorId: currentUser.id
  });

  await closeConfirmDeleteMemberModal();
  if (document.getElementById('members-modal')?.open) renderMembersModalList();
  updatePendingBadges();
  showToast(`Đã xóa thành viên ${targetId} và đồng bộ Google Sheet.`);
}
