# -*- coding: utf-8 -*-
"""
Automated unit test suite verifying all required features:
1. All 7 departments across UI and logic
2. Standard 8-column Member Directory format (elimination of MSSV/Khoa/NFC)
3. Compact ID badge + 3D VIP SportPass Card modal
4. Background notification default ON without manual toggle
5. Task cross-device sync (frontend syncTaskToBackend + backend handleCreateTask update)
6. Admin manual shift adjustment (+1/-1 with reason)
7. Withdrawal after check-in auto-decrement (soCaHoanThanh)
8. Smart Shift Rotation per department (fewest completed shifts first, exempt sick/conflict)
9. Service Worker synchronization URL
"""
import unittest

class TestNewFeaturesCLB(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open('index.html', 'r', encoding='utf-8') as f:
            cls.html = f.read()
        with open('GoogleAppsScript_MultiSheet.js', 'r', encoding='utf-8') as f:
            cls.gas = f.read()
        with open('sw.js', 'r', encoding='utf-8') as f:
            cls.sw = f.read()

    def test_01_all_7_departments(self):
        depts = [
            'Ban Chủ Nhiệm',
            'Ban Nhân Sự',
            'Ban Bóng Chuyền',
            'Ban Bóng Đá Nam',
            'Ban Bóng Đá Nữ',
            'Ban Cầu Lông',
            'Ban Truyền Thông'
        ]
        self.assertIn('const ALL_DEPARTMENTS = [', self.html)
        for d in depts:
            self.assertIn(f"'{d}'", self.html)
            self.assertIn(f"setTaskDeptFilter('{d}')", self.html)
            self.assertIn(f"setDirectoryDeptFilter('{d}')", self.html)

    def test_02_member_directory_8_columns(self):
        # 8 Standard Columns
        self.assertIn('id="otherMemIdVal"', self.html)
        self.assertIn('id="otherMemNameVal"', self.html)
        self.assertIn('id="otherClass"', self.html)
        self.assertIn('id="otherDept"', self.html)
        self.assertIn('id="otherRoleVal"', self.html)
        self.assertIn('id="otherMed"', self.html)
        self.assertIn('id="otherPhone"', self.html)
        self.assertIn('id="otherIce"', self.html)

        # Removed legacy columns
        self.assertNotIn('id="otherMssv"', self.html)
        self.assertNotIn('id="otherKhoa"', self.html)
        self.assertNotIn('id="otherNfc"', self.html)

        # Admin shift adjustment buttons
        self.assertIn('id="adminShiftAdjustRow"', self.html)
        self.assertIn('promptAdjustSelectedMemberShifts(-1)', self.html)
        self.assertIn('promptAdjustSelectedMemberShifts(1)', self.html)

    def test_03_compact_badge_and_vip_sportpass_modal(self):
        self.assertIn('compact-id-badge', self.html)
        self.assertIn('openDigitalSportPassModal()', self.html)

        self.assertIn('id="modalDigitalSportPassCard"', self.html)
        self.assertIn('id="vipCardMemberName"', self.html)
        self.assertIn('id="vipCardMemberRole"', self.html)
        self.assertIn('id="vipCardMemberId"', self.html)
        self.assertIn('id="vipCardMemberClass"', self.html)
        self.assertIn('id="vipCardMemberDept"', self.html)
        self.assertIn('id="vipCardMemberShifts"', self.html)
        self.assertIn('id="vipCardQrContainer"', self.html)
        self.assertIn('function openDigitalSportPassModal()', self.html)
        self.assertIn('function closeDigitalSportPassModal()', self.html)

    def test_04_background_notifications_default_on(self):
        self.assertIn('Thông báo khi tắt app', self.html)
        self.assertIn('Mặc định bật', self.html)
        self.assertNotIn('id="btnToggleBgNotification"', self.html)

        self.assertIn('function autoEnableBackgroundNotifications()', self.html)
        self.assertIn('autoEnableBackgroundNotifications();', self.html)

    def test_05_task_cross_device_sync(self):
        self.assertIn('async function syncTaskToBackend(task)', self.html)
        self.assertIn('syncTaskToBackend(existingTask);', self.html)
        self.assertIn('syncTaskToBackend(newTask);', self.html)

        self.assertIn('setInterval(() => {', self.html)
        self.assertIn('syncRealtimeData();', self.html)
        self.assertIn("document.addEventListener('visibilitychange'", self.html)

        self.assertIn('function handleCreateTask(ss, taskObj)', self.gas)
        self.assertIn('sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData])', self.gas)

    def test_06_admin_shift_adjustment(self):
        self.assertIn('id="modalAdjustShifts"', self.html)
        self.assertIn('function openAdjustShiftsModal', self.html)
        self.assertIn('function changeAdjustDelta', self.html)
        self.assertIn('function executeAdjustShiftsSubmit', self.html)
        self.assertIn('action=adjustMemberShifts', self.html)

        self.assertIn("action === 'adjustMemberShifts'", self.gas)
        self.assertIn('function handleAdjustMemberShifts(ss, memberId, delta, reason, adminActorId)', self.gas)
        self.assertIn('function decrementMemberCompletedShifts(ss, memberId)', self.gas)

    def test_07_withdraw_after_checkin_auto_decrement(self):
        self.assertIn('task.checkedInMembers.includes(leave.memberId)', self.html)
        self.assertIn('targetMem.soCaHoanThanh = Math.max(0,', self.html)
        self.assertIn('action=withdrawTask', self.html)

        self.assertIn('var cIdx = checked.indexOf(memberId);', self.gas)
        self.assertIn('decrementMemberCompletedShifts(ss, memberId);', self.gas)

    def test_08_smart_shift_rotation(self):
        self.assertIn('openSmartRotationModal', self.html)
        self.assertIn('id="modalSmartRotation"', self.html)
        self.assertIn('id="smartRotationResultsContainer"', self.html)

        self.assertIn('function openSmartRotationModal(taskId)', self.html)
        self.assertIn('function calculateSmartRotation(task)', self.html)
        self.assertIn('async function applySmartRotationCandidates()', self.html)

        self.assertIn('doneA - doneB', self.html)
        self.assertIn('theme.exempt', self.html)
        self.assertIn('hasTimeConflict', self.html)

    def test_09_service_worker_url(self):
        self.assertIn('AKfycbzOzxjkLP684tGXQn7HFptjiYyMoyEFMkTackb8K56f1gJvqMlvV5mFc0JBTm9gbO7U', self.sw)

if __name__ == '__main__':
    unittest.main()
