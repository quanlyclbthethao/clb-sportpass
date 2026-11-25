// SportPass V8.6 — Global Event Binding, Public Bridge & App Bootstrapper

function bindUiListeners() {
  const on = (id, ev, fn) => {
    const node = document.getElementById(id);
    if (node) node.addEventListener(ev, fn);
  };

  // Login Gateway
  on('login-form', 'submit', handleLoginSubmit);
  on('btnTogglePass', 'click', togglePasswordVisibility);
  on('btnForgotPass', 'click', () => showToast('Mật khẩu mặc định là 123456. Liên hệ Trưởng ban Nhân sự DMC0806 để cấp lại mật khẩu.'));
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
  on('btnAvatarThumbTrigger', 'click', () => document.getElementById('edit-avatar-input')?.click());
  on('btnTriggerEditAvatar', 'click', () => document.getElementById('edit-avatar-input')?.click());
  on('edit-avatar-input', 'change', handleAvatarFileSelect);
  on('qr-modal-trigger', 'click', () => openQrModal());
  on('qr-modal-close', 'click', closeQrModal);
  on('selQrPassTask', 'change', (e) => {
    activeQrTaskId = e.target.value;
    updateQrPassDisplay();
  });

  // Performance Stats -> Role-accurate Triggers
  const openShiftHubByRole = () => {
    if (currentUser && currentUser.isAdmin) openApproveShiftModal('shifts');
    else openTaskMissionModal('shifts');
  };
  on('stat-shifts-btn', 'click', openShiftHubByRole);
  on('stat-efficiency-btn', 'click', openShiftHubByRole);
  on('stat-rating-btn', 'click', () => openEditProfileModal());

  // Role-Locked Quick Actions
  on('admin-create-shift-btn', 'click', () => openCreateShiftModal(null));
  on('admin-approve-btn', 'click', () => openApproveShiftModal('swap'));
  on('member-register-btn', 'click', () => openTaskMissionModal('shifts'));
  on('member-swap-btn', 'click', () => openTaskMissionModal('swap'));

  // Profile Inline Quick Edit when Phone or ICE not yet set
  on('display-phone', 'click', (e) => {
    if (e.currentTarget && e.currentTarget.dataset.needsEdit === '1') {
      e.preventDefault();
      openEditProfileModal('input-phone');
    }
  });
  on('display-ice', 'click', (e) => {
    if (e.currentTarget && e.currentTarget.dataset.needsEdit === '1') {
      e.preventDefault();
      openEditProfileModal('input-ice');
    }
  });

  // Members Modal
  on('members-modal-close', 'click', closeMembersModal);
  on('members-modal-close-x', 'click', closeMembersModal);
  on('iptSearchMembers', 'input', renderMembersModalList);

  // Edit Profile Modal
  on('edit-profile-trigger', 'click', () => openEditProfileModal());
  on('edit-modal-close', 'click', closeEditProfileModal);
  on('edit-modal-cancel', 'click', closeEditProfileModal);
  on('edit-modal-save', 'click', saveEditProfileAction);

  // Notifications & Slim Settings Modals
  on('notification-modal-close', 'click', closeNotificationModal);
  on('notification-dismiss-btn', 'click', closeNotificationModal);
  on('settings-modal-close', 'click', closeSettingsModal);
  on('theme-btn-light', 'click', (e) => { e.stopPropagation(); setColorScheme('light', true); });
  on('theme-btn-dark', 'click', (e) => { e.stopPropagation(); setColorScheme('dark', true); });
  on('theme-btn-system', 'click', (e) => { e.stopPropagation(); setColorScheme('system', true); });
  on('theme-toggle-row', 'click', cycleThemeMode);
  on('security-password-row', 'click', openChangePasswordModal);
  on('logout-btn', 'click', executeLogoutAction);

  // Change Password Modal
  on('password-modal-close', 'click', closeChangePasswordModal);
  on('password-modal-cancel', 'click', closeChangePasswordModal);
  on('password-form', 'submit', submitChangePassword);
  on('btnSavePassword', 'click', submitChangePassword);

  // Create Shift Modal
  on('create-shift-close', 'click', closeCreateShiftModal);
  on('create-shift-cancel', 'click', closeCreateShiftModal);
  on('btnAddDeptQuotaRow', 'click', addDeptQuotaRow);
  on('selTaskLeader', 'change', (e) => {
    selectedShiftLeaderId = e.target.value;
    updateSelectedLeaderCard();
  });
  on('iptTaskLocation', 'input', (e) => renderAreaPresetCards(e.target.value));
  on('iptTaskTime', 'input', (e) => syncPresetTimeButtons(e.target.value));
  on('btnSubmitTask', 'click', submitCreateShiftAction);
  document.querySelectorAll('#preset-time-container .preset-time-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#preset-time-container .preset-time-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      safeSetValue('iptTaskTime', btn.dataset.time || '13:30 - 17:30');
    });
  });

  // Approve Dispatch Modal
  on('approve-shift-close', 'click', closeApproveShiftModal);
  on('approve-tab-swap', 'click', () => switchApproveTab('swap'));
  on('approve-tab-leave', 'click', () => switchApproveTab('leave'));
  on('approve-tab-shifts', 'click', () => switchApproveTab('shifts'));
  on('approve-tab-scanner', 'click', () => switchApproveTab('scanner'));
  on('btnApproveAllRequests', 'click', approveAllPendingRequests);
  on('selScanTaskId', 'change', renderScannerCheckedInList);
  on('btnStartCameraScan', 'click', () => startQrScanner());
  on('btnSwitchCameraScan', 'click', toggleCameraFacing);
  on('btnTorchCameraScan', 'click', toggleTorchFlash);
  on('iptQrFileUpload', 'change', handleQrFileSelected);
  on('btnManualCheckin', 'click', () => handleScanQrPayload(document.getElementById('iptManualCheckinId')?.value || ''));
  on('iptManualCheckinId', 'keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScanQrPayload(document.getElementById('iptManualCheckinId')?.value || '');
    }
  });

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
  Object.defineProperties(window, {
    currentUser: { configurable: true, get: () => currentUser, set: (v) => { currentUser = v; } },
    membersDirectory: { configurable: true, get: () => membersDirectory, set: (v) => { membersDirectory = v; } },
    currentTasks: { configurable: true, get: () => currentTasks, set: (v) => { currentTasks = v; } },
    currentSwaps: { configurable: true, get: () => currentSwaps, set: (v) => { currentSwaps = v; } },
    currentLeaves: { configurable: true, get: () => currentLeaves, set: (v) => { currentLeaves = v; } }
  });

  window.handleLoginSubmit = handleLoginSubmit;
  window.fallbackOfflineLogin = fallbackOfflineLogin;
  window.executeLogoutAction = executeLogoutAction;
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
