import os
import re
import json
import unittest

BASE_DIR = r"C:\Users\Admin\.gemini\antigravity\scratch\clb-sportpass"
INDEX_PATH = os.path.join(BASE_DIR, "index.html")
GAS_MULTI_PATH = os.path.join(BASE_DIR, "GoogleAppsScript_MultiSheet.js")
SW_PATH = os.path.join(BASE_DIR, "sw.js")
EXCEL_PATH = os.path.join(BASE_DIR, "CLB_The_Thao_Danh_Sach_Thanh_Vien_Chuan_Hoa.xlsx")
DRIVE_EXCEL_PATH = r"G:\Drive của tôi\CLB_The_Thao_Danh_Sach_Thanh_Vien_Chuan_Hoa.xlsx"
OUTBOX_EXCEL_PATH = r"G:\Drive của tôi\AutoBridge\Outbox\CLB_The_Thao_Danh_Sach_Thanh_Vien_Chuan_Hoa.xlsx"
STATUS_REPORT_PATH = r"G:\Drive của tôi\AutoBridge\Reports\STATUS_REPORT.md"

class TestV5ProductionSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(INDEX_PATH, "r", encoding="utf-8") as f:
            cls.html = f.read()
        with open(GAS_MULTI_PATH, "r", encoding="utf-8") as f:
            cls.gas = f.read()
        with open(SW_PATH, "r", encoding="utf-8") as f:
            cls.sw = f.read()

    # ==================== 1. SOLE ADMIN PRIVILEGES ====================
    def test_sole_admin_in_default_directory(self):
        """Only DMC0806 has isAdmin: true by default in DEFAULT_MEMBERS_DIRECTORY"""
        m = re.search(r'const DEFAULT_MEMBERS_DIRECTORY = (\[.*?\]);', self.html)
        self.assertIsNotNone(m, "DEFAULT_MEMBERS_DIRECTORY not found in index.html")
        members = json.loads(m.group(1))
        self.assertEqual(len(members), 125, "Must contain all 125 members")
        admins = [mem for mem in members if mem.get("isAdmin")]
        self.assertEqual(len(admins), 1, f"Expected exactly 1 admin, found {len(admins)}: {[x['id'] for x in admins]}")
        self.assertEqual(admins[0]["id"], "DMC0806", "Admin must be DMC0806 (Đỗ Mạnh Cường)")
        self.assertEqual(admins[0]["hoTen"], "Đỗ Mạnh Cường")

    def test_sole_admin_in_gas_backend(self):
        """GAS backend assigns default admin exclusively to DMC0806"""
        self.assertIn("effectiveId === 'DMC0806'", self.gas)
        self.assertNotIn("deptName === 'Ban Chủ Nhiệm'", self.gas, "Ban Chu Nhiem should not automatically get admin")

    def test_apply_custom_admin_roles_logic(self):
        """applyCustomAdminRoles ensures only DMC0806 has default admin and supports custom grants"""
        self.assertIn("m.id === 'DMC0806'", self.html)
        self.assertIn("function applyCustomAdminRoles", self.html)

    # ==================== 2. PRODUCTION INTEGRITY (NO DEMO ARTIFACTS) ====================
    def test_no_quick_experience_or_mock_login(self):
        """No quick experience button, no mock account fill, no demo switcher"""
        self.assertNotIn("Trải nghiệm nhanh (Khám phá toàn bộ app ngay)", self.html)
        self.assertNotIn("enterOfflineDemoMode(true)", self.html)
        self.assertNotIn("quickFillLogin", self.html)
        self.assertNotIn("toggleDemoRole()", self.html)
        self.assertNotIn("lblSwitchRole", self.html)

    def test_clean_login_inputs(self):
        """Login inputs should not be hardcoded to DMC0806 by default"""
        self.assertIn('<input type="text" id="iptUser" value=""', self.html)
        self.assertIn('<input type="password" id="iptPass" value=""', self.html)

    # ==================== 3. DELETION PERMANENCE & TOMBSTONES ====================
    def test_deletion_tombstones_and_api(self):
        """Deleting tasks and posts must persist tombstones and call GAS delete endpoints"""
        self.assertIn("saveDeletedTaskId(taskId)", self.html)
        self.assertIn("saveDeletedPostId(postId)", self.html)
        self.assertIn("action=deleteTask", self.html)
        self.assertIn("action=deletePost", self.html)
        self.assertIn("getDeletedTaskIds()", self.html)
        self.assertIn("getDeletedPostIds()", self.html)

    def test_gas_delete_handlers(self):
        """GAS has handleDeleteTask and handleDeletePost"""
        self.assertIn("function handleDeleteTask", self.gas)
        self.assertIn("function handleDeletePost", self.gas)
        self.assertIn("action === 'deleteTask'", self.gas)
        self.assertIn("action === 'deletePost'", self.gas)

    def test_sync_filters_deleted_items(self):
        """syncRealtimeData must filter out deleted tasks and posts so they never resurrect"""
        self.assertIn("!deletedTasks.includes(t.id)", self.html)
        self.assertIn("!deletedPosts.includes(p.id)", self.html)

    # ==================== 4. MEMBER PROFILE & EDIT PROFILE ====================
    def test_profile_attributes_and_no_khoa(self):
        """Profile has no Khoa, references UHD, and displays 8 attributes"""
        self.assertNotIn('id="dFaculty"', self.html)
        self.assertIn('id="dFullName"', self.html)
        self.assertIn('id="dMemberId"', self.html)
        self.assertIn('id="dClass"', self.html)
        self.assertIn('id="dDept"', self.html)
        self.assertIn('id="dRole"', self.html)
        self.assertIn('id="dPhone"', self.html)
        self.assertIn('id="dIce"', self.html)
        self.assertIn('id="dMed"', self.html)
        self.assertIn('Trường Đại học Hải Dương', self.html)
        self.assertNotIn('NFC Ready', self.html)

    def test_edit_profile_modal_and_sync(self):
        """modalEditProfile exists and syncs with GAS action=updateProfile"""
        self.assertIn('id="modalEditProfile"', self.html)
        self.assertIn('openEditProfileModal', self.html)
        self.assertIn('saveMemberProfileEdit', self.html)
        self.assertIn('action=updateProfile', self.html)
        self.assertIn('function handleUpdateProfile', self.gas)
        self.assertIn("action === 'updateProfile'", self.gas)

    # ==================== 5. DISPATCH & TASK CREATION WITH NOTES ====================
    def test_task_notes_field_and_display(self):
        """modalCreateTask has notes field, task objects store notes, and renderTasksList renders notes"""
        self.assertIn('id="iptTaskNotes"', self.html)
        self.assertIn('notes: notes', self.html)
        self.assertIn('Ghi chú nhiệm vụ:', self.html)
        self.assertIn('taskObj.notes', self.gas)

    # ==================== 6. ACCOUNT SEPARATION ====================
    def test_regular_account_isolation(self):
        """Regular account menu does not show audit log or admin toggles"""
        self.assertNotIn('openAuditTrailModal()', self.html, "Audit log button removed from account menu")
        self.assertIn('id="btnMenuRoleManagement" class="spring-touch hidden"', self.html)
        self.assertIn('id="adminTaskToolbar" class="acrylic-card hidden"', self.html)

    # ==================== 7. PWA WEB PUSH & BACKGROUND NOTIFICATIONS ====================
    def test_sw_push_and_notification_click(self):
        """sw.js handles push and notificationclick"""
        self.assertIn("self.addEventListener('push'", self.sw)
        self.assertIn("self.addEventListener('notificationclick'", self.sw)
        self.assertIn("requestNotificationPermission", self.html)

    # ==================== 8. DRIVE & EXCEL ASSETS ====================
    def test_excel_and_drive_assets(self):
        """Standardized Excel files exist on Drive and Outbox and locally"""
        self.assertTrue(os.path.exists(EXCEL_PATH), f"Missing {EXCEL_PATH}")
        self.assertTrue(os.path.exists(DRIVE_EXCEL_PATH), f"Missing {DRIVE_EXCEL_PATH}")
        self.assertTrue(os.path.exists(OUTBOX_EXCEL_PATH), f"Missing {OUTBOX_EXCEL_PATH}")

    def test_no_tay_bac_in_entire_system(self):
        """Ensure no 'Tây Bắc' references in index.html, gas, or sw"""
        self.assertNotIn("Tây Bắc", self.html, "index.html contains Tây Bắc")
        self.assertNotIn("Tây Bắc", self.gas, "GoogleAppsScript_MultiSheet.js contains Tây Bắc")
        self.assertNotIn("Tây Bắc", self.sw, "sw.js contains Tây Bắc")

if __name__ == "__main__":
    unittest.main()
