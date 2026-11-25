// SportPass V8.5 — Global Event Binding, Public Bridge & App Bootstrapper

function bindUiListeners() {
  const on = (id, ev, fn) => {
    const node = document.getElementById(id);
    if (node) node.addEventListener(ev, fn);
  };

  // Login Gateway
  on('login-form', 'submit', handleLoginSubmit);
  on('btnTogglePass', 'click', togglePasswordVisibility);
  on('btnForgotPass', 'click', () => showToast('Mật khẩu mặc định là 123456. Liên hệ DMC0806 nếu quên mật khẩu mới.'));
  on('btnFaceIdLogin', 'click', () => handleBiometricLogin('Face ID'));
  on('btnTouchIdLogin', 'click', () => handleBiometricLogin('Touch ID'));

  // Header Controls
  on('notification-trigger', 'click', openNotificationModal);
  on('members-trigger', 'click', openMembersModal);
  on('settings-trigger', 'click', openSettingsModal);

  // Hero Card & QR
  on('hero-status-pill', 'click', cycleStatus);
  on('hero-avatar-btn', 'click', (e) => {
    e.stopPropagation();
    document.getElementById('hero-avatar-input')?.click();
  });
  on('hero-avatar-input', 'change', handleAvatarFileSelect);
  on('btnTriggerEditAvatar', 'click', () => document.getElementById('edit-avatar-input')?.click());
  on('edit-avatar-input', 'change', handleAvatarFileSelect);
  on('qr-modal-trigger', 'click', openQrModal);
  on('qr-modal-close', 'click', closeQrModal);

  // Performance Stats interactive triggers
  on('stat-shifts-btn', 'click', () => openApproveShiftModal('shifts'));
  on('stat-efficiency-btn', 'click', () => {
    openApproveShiftModal('shifts');
    showToast('Tỷ lệ đúng giờ được tính từ lịch sử check-in QR.');
  });
  on('stat-rating-btn', 'click', cycleReadinessRating);

  // Role Preview Switcher ("Thành viên | Admin") & Quick Actions
  on('role-switch-member', 'click', () => setRolePreviewMode('member'));
  on('role-switch-admin', 'click', () => setRolePreviewMode('admin'));
  on('admin-create-shift-btn', 'click', () => openCreateShiftModal(null));
  on('admin-approve-btn', 'click', () => openApproveShiftModal('swap'));
  on('member-register-btn', 'click', () => openTaskMissionModal('shifts'));
  on('member-swap-btn', 'click', () => openTaskMissionModal('swap'));

  // Members Modal
  on('members-modal-close', 'click', closeMembersModal);
  on('members-modal-close-x', 'click', closeMembersModal);
  on('iptSearchMembers', 'input', renderMembersModalList);

  // Edit Profile Modal
  on('edit-profile-trigger', 'click', openEditProfileModal);
  on('edit-modal-close', 'click', closeEditProfileModal);
  on('edit-modal-cancel', 'click', closeEditProfileModal);
  on('edit-modal-save', 'click', saveEditProfileAction);

  // Notifications & Settings Modals
  on('notification-modal-close', 'click', closeNotificationModal);
  on('notification-dismiss-btn', 'click', closeNotificationModal);
  on('settings-modal-close', 'click', closeSettingsModal);
  on('theme-toggle-row', 'click', cycleThemeMode);
  on('security-password-row', 'click', openChangePasswordModal);
  on('terms-privacy-row', 'click', () => showToast('Dữ liệu hội viên được bảo mật nội bộ CLB Thể Thao ĐH Hải Dương.'));
  on('logout-btn', 'click', executeLogoutAction);

  // Settings Toggles & Language
  on('switchFaceId', 'change', (e) => {
    appPreferences.faceId = Boolean(e.target.checked);
    saveAppPreferences();
    showToast(appPreferences.faceId ? 'Đã bật xác thực Face ID / Touch ID' : 'Đã tắt đăng nhập sinh trắc học');
  });
  on('switchRemoteLock', 'change', (e) => {
    appPreferences.remoteLock = Boolean(e.target.checked);
    saveAppPreferences();
    updateQrPassDisplay();
    showToast(appPreferences.remoteLock ? 'Đã kích hoạt khóa thẻ QR từ xa' : 'Đã mở khóa thẻ QR');
  });
  on('switchTilt3d', 'change', (e) => {
    appPreferences.tilt3d = Boolean(e.target.checked);
    saveAppPreferences();
    showToast(appPreferences.tilt3d ? 'Đã bật hiệu ứng 3D Tilt & Gợn sóng' : 'Đã tắt hiệu ứng 3D Tilt');
  });
  on('switchUrgentNotifs', 'change', (e) => {
    appPreferences.urgentNotifs = Boolean(e.target.checked);
    saveAppPreferences();
    showToast(appPreferences.urgentNotifs ? 'Đã bật chuông cảnh báo ca khẩn cấp' : 'Đã tắt cảnh báo ca khẩn cấp');
  });
  on('switchHaptics', 'change', (e) => {
    appPreferences.haptics = Boolean(e.target.checked);
    saveAppPreferences();
  });
  on('lang-btn-vn', 'click', () => {
    appPreferences.lang = 'VI';
    saveAppPreferences();
    syncSettingsSwitchesUI();
    showToast('Ngôn ngữ: Tiếng Việt');
  });
  on('lang-btn-en', 'click', () => {
    appPreferences.lang = 'EN';
    saveAppPreferences();
    syncSettingsSwitchesUI();
    showToast('Language: English labels prioritized');
  });

  // Change Password Modal
  on('password-modal-close', 'click', closeChangePasswordModal);
  on('password-modal-cancel', 'click', closeChangePasswordModal);
  on('btnSavePassword', 'click', submitChangePassword);

  // Create Shift Modal
  on('create-shift-close', 'click', closeCreateShiftModal);
  on('create-shift-cancel', 'click', closeCreateShiftModal);
  on('btnAddDeptQuotaRow', 'click', addDeptQuotaRow);
  on('btnCycleLeader', 'click', cycleShiftLeader);
  on('btnSubmitTask', 'click', submitCreateShiftAction);
  document.querySelectorAll('#preset-time-container .preset-time-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#preset-time-container .preset-time-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      safeSetValue('iptTaskTime', btn.dataset.time || '14:00 - 18:00');
    });
  });

  // Approve Dispatch Modal
  on('approve-shift-close', 'click', closeApproveShiftModal);
  on('approve-tab-swap', 'click', () => switchApproveTab('swap'));
  on('approve-tab-leave', 'click', () => switchApproveTab('leave'));
  on('approve-tab-shifts', 'click', () => switchApproveTab('shifts'));
  on('approve-tab-scanner', 'click', () => switchApproveTab('scanner'));
  on('btnApproveAllRequests', 'click', approveAllPendingRequests);
  on('btnStartCameraScan', 'click', () => startQrScanner());
  on('btnSwitchCameraScan', 'click', toggleCameraFacing);
  on('btnTorchCameraScan', 'click', toggleTorchFlash);
  on('iptQrFileUpload', 'change', handleQrFileSelected);
  on('btnManualCheckin', 'click', () => handleScanQrPayload(document.getElementById('iptManualCheckinId')?.value || ''));

  // Member Task Mission Modal
  on('task-mission-close', 'click', closeTaskMissionModal);
  on('task-mission-close-x', 'click', closeTaskMissionModal);
  on('mission-tab-shifts', 'click', () => switchMissionTab('shifts'));
  on('mission-tab-swap', 'click', () => switchMissionTab('swap'));
  on('btnSubmitMemberSwap', 'click', submitMemberSwapRequest);
  on('btnSubmitMemberLeave', 'click', submitMemberLeaveRequest);

  // Success Celebration Center Modal
  on('celebration-close-x', 'click', () => closeSheetDialog('success-celebration-modal'));
  on('celebration-confirm-btn', 'click', () => closeSheetDialog('success-celebration-modal'));
}

function exposeGlobalBridge() {
  window.DEFAULT_MEMBERS_DIRECTORY = DEFAULT_MEMBERS_DIRECTORY;
  window.ALL_DEPARTMENTS = ALL_DEPARTMENTS;
  window.DEFAULT_TASKS = DEFAULT_TASKS;
  window.currentUser = currentUser;
  window.membersDirectory = membersDirectory;
  window.currentTasks = currentTasks;
  window.currentSwaps = currentSwaps;
  window.currentLeaves = currentLeaves;

  window.handleLoginSubmit = handleLoginSubmit;
  window.fallbackOfflineLogin = fallbackOfflineLogin;
  window.executeLogoutAction = executeLogoutAction;
  window.setRolePreviewMode = setRolePreviewMode;
  window.renderProfileData = renderProfileData;
  window.openMembersModal = openMembersModal;
  window.openEditProfileModal = openEditProfileModal;
  window.saveEditProfileAction = saveEditProfileAction;
  window.openQrModal = openQrModal;
  window.closeQrModal = closeQrModal;
  window.openCreateShiftModal = openCreateShiftModal;
  window.submitCreateShiftAction = submitCreateShiftAction;
  window.openApproveShiftModal = openApproveShiftModal;
  window.approveAllPendingRequests = approveAllPendingRequests;
  window.openTaskMissionModal = openTaskMissionModal;
  window.calculateSmartRotation = calculateSmartRotation;
  window.runSmartRotationForTask = runSmartRotationForTask;
  window.handleScanQrPayload = handleScanQrPayload;
  window.deduplicateTasks = deduplicateTasks;
  window.setColorScheme = setColorScheme;
  window.openSuccessCelebration = openSuccessCelebration;
  window.showToast = showToast;
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeController();
  initModalLifecycle();
  bindUiListeners();
  initHeroCardParallax();
  bindWaterRipples();
  checkStoredLoginSession();
  exposeGlobalBridge();
});
