// SportPass V8.0 — Global Event Binding, Public Bridge & App Bootstrapper

function bindUiListeners() {
  const on = (id, ev, fn) => {
    const node = document.getElementById(id);
    if (node) node.addEventListener(ev, fn);
  };

  on('login-form', 'submit', handleLoginSubmit);
  on('btnTogglePass', 'click', togglePasswordVisibility);

  // Header
  on('notification-trigger', 'click', openNotificationModal);
  on('settings-trigger', 'click', openSettingsModal);

  // Hero Card & QR Pass
  on('hero-status-pill', 'click', cycleStatus);
  on('hero-avatar-btn', 'click', (e) => {
    e.stopPropagation();
    const inp = document.getElementById('hero-avatar-input');
    if (inp) inp.click();
  });
  on('hero-avatar-input', 'change', handleAvatarFileSelect);
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

  // Quick Actions ("Tạo ca" & "Duyệt ca")
  on('admin-create-shift-btn', 'click', () => openCreateShiftModal(null));
  on('admin-approve-btn', 'click', () => openApproveShiftModal('approvals'));

  // Edit Profile Sheet
  on('edit-profile-trigger', 'click', openEditProfileModal);
  on('edit-modal-close', 'click', closeEditProfileModal);
  on('edit-modal-cancel', 'click', closeEditProfileModal);
  on('edit-modal-save', 'click', saveEditProfileAction);

  // Notifications & Settings Sheets
  on('notification-modal-close', 'click', closeNotificationModal);
  on('notification-dismiss-btn', 'click', closeNotificationModal);
  on('settings-modal-close', 'click', closeSettingsModal);
  on('theme-toggle-row', 'click', cycleThemeMode);
  on('security-password-row', 'click', openChangePasswordModal);
  on('logout-btn', 'click', executeLogoutAction);

  // Change Password Sheet
  on('password-modal-close', 'click', closeChangePasswordModal);
  on('password-modal-cancel', 'click', closeChangePasswordModal);
  on('btnSavePassword', 'click', submitChangePassword);

  // Create Shift Sheet
  on('create-shift-close', 'click', closeCreateShiftModal);
  on('create-shift-cancel', 'click', closeCreateShiftModal);
  on('btnSubmitTask', 'click', submitCreateShiftAction);

  // Approve / Dispatch / QR Scanner / Directory Sheet
  on('approve-shift-close', 'click', closeApproveShiftModal);
  on('approve-tab-btn-shifts', 'click', () => switchApproveTab('shifts'));
  on('approve-tab-btn-approvals', 'click', () => switchApproveTab('approvals'));
  on('approve-tab-btn-scanner', 'click', () => switchApproveTab('scanner'));
  on('approve-tab-btn-directory', 'click', () => switchApproveTab('directory'));
  on('btnStartCameraScan', 'click', () => startQrScanner());
  on('btnSwitchCameraScan', 'click', toggleCameraFacing);
  on('btnTorchCameraScan', 'click', toggleTorchFlash);
  on('iptQrFileUpload', 'change', handleQrFileSelected);
  on('btnManualCheckin', 'click', () => {
    const code = document.getElementById('iptManualCheckinId')?.value || '';
    handleScanQrPayload(code);
  });
  on('iptSearchDirectory', 'input', renderDirectoryTabList);

  // Prompt Sheet
  on('prompt-modal-close', 'click', () => closeSheetDialog('action-prompt-modal'));
  on('prompt-cancel-btn', 'click', () => closeSheetDialog('action-prompt-modal'));
  on('prompt-confirm-btn', 'click', submitPromptSheetAction);
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
  window.renderProfileData = renderProfileData;
  window.openEditProfileModal = openEditProfileModal;
  window.saveEditProfileAction = saveEditProfileAction;
  window.openQrModal = openQrModal;
  window.closeQrModal = closeQrModal;
  window.openCreateShiftModal = openCreateShiftModal;
  window.submitCreateShiftAction = submitCreateShiftAction;
  window.openApproveShiftModal = openApproveShiftModal;
  window.switchApproveTab = switchApproveTab;
  window.calculateSmartRotation = calculateSmartRotation;
  window.runSmartRotationForTask = runSmartRotationForTask;
  window.handleScanQrPayload = handleScanQrPayload;
  window.deduplicateTasks = deduplicateTasks;
  window.setColorScheme = setColorScheme;
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
