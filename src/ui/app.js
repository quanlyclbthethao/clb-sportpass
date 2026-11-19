// SportPass V6.0 — Single Canonical Global Bridge & Bootstrapper

function exposeGlobalState() {
  window.DEFAULT_MEMBERS_DIRECTORY = DEFAULT_MEMBERS_DIRECTORY;
  window.ALL_DEPARTMENTS = ALL_DEPARTMENTS;
  window.DEFAULT_TASKS = DEFAULT_TASKS;
  window.currentUser = currentUser;
  window.membersDirectory = membersDirectory;
  window.currentTasks = currentTasks;
  window.currentPosts = currentPosts;
  window.currentSwaps = currentSwaps;
  window.currentLeaves = currentLeaves;
  window.offlineMutationQueue = offlineMutationQueue;
  window.currentActiveTabIdx = currentActiveTabIdx;

  // Navigation & Theme
  window.switchDockTab = switchDockTab;
  window.switchTab = switchTab;
  window.goToTab = goToTab;
  window.setColorScheme = setColorScheme;
  window.runWithDebounce = runWithDebounce;
  window.initTouchSwipeNavigation = initTouchSwipeNavigation;

  // Modals & Alerts
  window.openGenericModal = openGenericModal;
  window.closeGenericModal = closeGenericModal;
  window.closeAllModals = closeAllModals;
  window.openConfirmDialog = openConfirmDialog;
  window.closeConfirmDialog = closeConfirmDialog;
  window.executeConfirmedAction = executeConfirmedAction;
  window.openHeaderMoreModal = openHeaderMoreModal;
  window.closeHeaderMoreModal = closeHeaderMoreModal;
  window.showAquaIsland = showAquaIsland;
  window.triggerToast = triggerToast;

  // Auth & RBAC
  window.togglePasswordVisibility = togglePasswordVisibility;
  window.handleLoginSubmit = handleLoginSubmit;
  window.fallbackOfflineLogin = fallbackOfflineLogin;
  window.checkStoredLoginSession = checkStoredLoginSession;
  window.executeLogoutAction = executeLogoutAction;
  window.handleLogout = handleLogout;
  window.openAdminRoleManagementModal = openAdminRoleManagementModal;
  window.closeAdminRoleManagementModal = closeAdminRoleManagementModal;
  window.setRoleDeptFilter = setRoleDeptFilter;
  window.updateRoleDeptFilterButtons = updateRoleDeptFilterButtons;
  window.filterRoleMemberList = filterRoleMemberList;
  window.clearRoleMemberSearch = clearRoleMemberSearch;
  window.renderRoleMemberList = renderRoleMemberList;
  window.toggleMemberRole = toggleMemberRole;
  window.applyRoleChange = applyRoleChange;
  window.getCustomAdminRoles = getCustomAdminRoles;
  window.saveCustomAdminRoles = saveCustomAdminRoles;
  window.applyCustomAdminRoles = applyCustomAdminRoles;

  // Profile & Medical / ICE
  window.renderProfileData = renderProfileData;
  window.openDigitalSportPassModal = openDigitalSportPassModal;
  window.closeDigitalSportPassModal = closeDigitalSportPassModal;
  window.openEditProfileModal = openEditProfileModal;
  window.closeEditProfileModal = closeEditProfileModal;
  window.saveMemberProfileEdit = saveMemberProfileEdit;
  window.openTheTrangModal = openTheTrangModal;
  window.closeTheTrangModal = closeTheTrangModal;
  window.selectTheTrang = selectTheTrang;
  window.openAvatarModal = openAvatarModal;
  window.closeAvatarModal = closeAvatarModal;
  window.handleAvatarFileSelect = handleAvatarFileSelect;
  window.openChangePasswordModal = openChangePasswordModal;
  window.closeChangePasswordModal = closeChangePasswordModal;
  window.submitChangePassword = submitChangePassword;
  window.handleSaveNewPassword = handleSaveNewPassword;
  window.openEmergencyIceModal = openEmergencyIceModal;
  window.closeEmergencyIceModal = closeEmergencyIceModal;
  window.executeIceDirectCall = executeIceDirectCall;
  window.shareSosLocationSms = shareSosLocationSms;
  window.openNearestHospitalsMap = openNearestHospitalsMap;
  window.callContactDirect = callContactDirect;
  window.callEmergencyDirect = callEmergencyDirect;
  window.toggleStatusDropdown = toggleStatusDropdown;
  window.selectCardStatus = selectCardStatus;
  window.cycleStatus = cycleStatus;
  window.openHelpCenterModal = openHelpCenterModal;
  window.closeHelpCenterModal = closeHelpCenterModal;

  // Tasks, Rotation, Approvals & Sync
  window.deduplicateTasks = deduplicateTasks;
  window.saveDeletedTaskId = saveDeletedTaskId;
  window.getDeletedTaskIds = getDeletedTaskIds;
  window.saveDeletedPostId = saveDeletedPostId;
  window.getDeletedPostIds = getDeletedPostIds;
  window.triggerInstantSync = triggerInstantSync;
  window.syncRealtimeData = syncRealtimeData;
  window.syncTaskToBackend = syncTaskToBackend;
  window.restartAdaptivePolling = restartAdaptivePolling;
  window.enqueueOfflineMutation = enqueueOfflineMutation;
  window.syncOfflineMutations = syncOfflineMutations;
  window.renderTasksList = renderTasksList;
  window.setTaskDeptFilter = setTaskDeptFilter;
  window.handleClaimTask = handleClaimTask;
  window.handleJoinWaitlist = handleJoinWaitlist;
  window.leaveTaskWaitlist = leaveTaskWaitlist;
  window.openCreateTaskModal = openCreateTaskModal;
  window.openEditTaskModal = openEditTaskModal;
  window.closeCreateTaskModal = closeCreateTaskModal;
  window.adjustDeptQuotaAtIndex = adjustDeptQuotaAtIndex;
  window.submitCreateTaskAction = submitCreateTaskAction;
  window.confirmDeleteTask = confirmDeleteTask;
  window.openSwapRequestModal = openSwapRequestModal;
  window.closeSwapRequestModal = closeSwapRequestModal;
  window.submitSwapRequestAction = submitSwapRequestAction;
  window.openLeaveTaskModal = openLeaveTaskModal;
  window.closeLeaveTaskModal = closeLeaveTaskModal;
  window.submitLeaveRequestAction = submitLeaveRequestAction;
  window.openAdminDispatchModal = openAdminDispatchModal;
  window.closeAdminDispatchModal = closeAdminDispatchModal;
  window.openAdminDispatchHubModal = openAdminDispatchHubModal;
  window.closeAdminDispatchHubModal = closeAdminDispatchHubModal;
  window.switchAdminDispatchTab = switchAdminDispatchTab;
  window.resolveSwapAction = resolveSwapAction;
  window.resolveLeaveAction = resolveLeaveAction;
  window.openSmartRotationModal = openSmartRotationModal;
  window.closeSmartRotationModal = closeSmartRotationModal;
  window.calculateSmartRotation = calculateSmartRotation;
  window.applySmartRotationCandidates = applySmartRotationCandidates;

  // Directory & Shift Adjustments
  window.openDirectoryModal = openDirectoryModal;
  window.closeDirectoryModal = closeDirectoryModal;
  window.setDirectoryDeptFilter = setDirectoryDeptFilter;
  window.filterDirectoryMembers = filterDirectoryMembers;
  window.openOtherMemberInspector = openOtherMemberInspector;
  window.closeOtherMemberModal = closeOtherMemberModal;
  window.callTargetMemberPhone = callTargetMemberPhone;
  window.callTargetMemberIce = callTargetMemberIce;
  window.promptAdjustSelectedMemberShifts = promptAdjustSelectedMemberShifts;
  window.openAdjustShiftsModal = openAdjustShiftsModal;
  window.closeAdjustShiftsModal = closeAdjustShiftsModal;
  window.changeAdjustDelta = changeAdjustDelta;
  window.executeAdjustShiftsSubmit = executeAdjustShiftsSubmit;

  // QR Scanner & Generator
  window.startQrScanner = startQrScanner;
  window.tickQrScan = tickQrScan;
  window.handleScanQrPayload = handleScanQrPayload;
  window.handleQrFileSelected = handleQrFileSelected;
  window.openQrScannerModal = openQrScannerModal;
  window.closeQrScannerModal = closeQrScannerModal;
  window.openFieldCheckinQrModal = openFieldCheckinQrModal;
  window.closeFieldCheckinQrModal = closeFieldCheckinQrModal;
  window.onFieldQrShiftChange = onFieldQrShiftChange;
  window.refreshFieldCheckinQr = refreshFieldCheckinQr;
  window.generateDynamicQrPass = generateDynamicQrPass;
  window.refreshDynamicQrPass = refreshDynamicQrPass;
  window.toggleCameraFacing = toggleCameraFacing;
  window.toggleTorchFlash = toggleTorchFlash;

  // Forum & Push Notifications
  window.renderForumFeed = renderForumFeed;
  window.submitNewPostAction = submitNewPostAction;
  window.setReaction = setReaction;
  window.submitCommentAction = submitCommentAction;
  window.openEditPostModal = openEditPostModal;
  window.closeEditPostModal = closeEditPostModal;
  window.submitEditPostAction = submitEditPostAction;
  window.confirmDeletePost = confirmDeletePost;
  window.openLightboxByPost = openLightboxByPost;
  window.stepLightboxMedia = stepLightboxMedia;
  window.closeLightboxModal = closeLightboxModal;
  window.autoEnableBackgroundNotifications = autoEnableBackgroundNotifications;
  window.requestNotificationPermission = requestNotificationPermission;
}

document.addEventListener('click', (ev) => {
  if (!ev.target || !ev.target.closest || !ev.target.closest('#status-toggle-wrapper')) {
    const dd = document.getElementById('status-dropdown');
    if (dd && !dd.classList.contains('hidden')) {
      dd.classList.add('hidden');
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  initThemeController();
  initModalLifecycle();
  initTouchSwipeNavigation();
  init3DTilt();
  initAquamorphicWaterRipple();
  checkStoredLoginSession();
  exposeGlobalState();
});
