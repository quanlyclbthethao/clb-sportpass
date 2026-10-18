import os
import re
import json
import unittest

BASE_DIR = r"C:\Users\Admin\.gemini\antigravity\scratch\clb-sportpass"
INDEX_PATH = os.path.join(BASE_DIR, "index.html")
GAS_MULTI_PATH = os.path.join(BASE_DIR, "GoogleAppsScript_MultiSheet.js")
SW_PATH = os.path.join(BASE_DIR, "sw.js")

class TestEdgeCasesV5(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(INDEX_PATH, "r", encoding="utf-8") as f:
            cls.html = f.read()
        with open(GAS_MULTI_PATH, "r", encoding="utf-8") as f:
            cls.gas = f.read()

    def test_xss_protection_in_task_notes(self):
        """Task notes must be escaped with escapeHtml to prevent XSS injection"""
        self.assertIn("${escapeHtml(t.notes)}", self.html)

    def test_tombstone_storage_keys(self):
        """Tombstone storage keys must be consistent across getter, setter, and syncer"""
        self.assertIn("'CLB_DELETED_TASK_IDS'", self.html)
        self.assertIn("'CLB_DELETED_POST_IDS'", self.html)
        # Check that both deleteTask and deletePost use their respective keys
        self.assertIn("saveDeletedTaskId(taskId)", self.html)
        self.assertIn("saveDeletedPostId(postId)", self.html)

    def test_gas_update_profile_edge_cases(self):
        """GAS handleUpdateProfile handles empty, partial, and full updates safely"""
        self.assertIn("if (!memberId) return", self.gas)
        self.assertIn("if (lop !== undefined && lop !== null", self.gas)
        self.assertIn("if (sdt !== undefined && sdt !== null", self.gas)
        self.assertIn("if (ice !== undefined && ice !== null", self.gas)
        self.assertIn("if (yTe !== undefined && yTe !== null", self.gas)

    def test_gas_delete_task_and_post_not_found_handling(self):
        """GAS handleDeleteTask and handleDeletePost return clean response even if row already deleted"""
        self.assertIn("Lệnh không tồn tại hoặc đã được xóa trước đó", self.gas)
        self.assertIn("Bài viết không tồn tại hoặc đã được xóa trước đó", self.gas)

    def test_sole_admin_invariance(self):
        """Verify that every department member in data_by_dept has isAdmin: false except DMC0806"""
        m_dir = re.search(r'const DEFAULT_MEMBERS_DIRECTORY = (\[.*?\]);', self.html)
        members = json.loads(m_dir.group(1))
        
        dmc = [m for m in members if m['id'] == 'DMC0806']
        self.assertEqual(len(dmc), 1)
        self.assertTrue(dmc[0]['isAdmin'])
        self.assertTrue(dmc[0]['isShiftLeader'])

        # Check all others
        others = [m for m in members if m['id'] != 'DMC0806']
        for m in others:
            self.assertFalse(m.get('isAdmin', False), f"Member {m['id']} ({m['hoTen']}) should not be admin!")

    def test_all_125_members_have_don_vi_uhd(self):
        """All 125 members have donVi set to Trường Đại học Hải Dương and no khoa"""
        m_dir = re.search(r'const DEFAULT_MEMBERS_DIRECTORY = (\[.*?\]);', self.html)
        members = json.loads(m_dir.group(1))
        for m in members:
            self.assertEqual(m.get('donVi'), 'Trường Đại học Hải Dương')
            self.assertNotIn('khoa', m)

if __name__ == "__main__":
    unittest.main()
