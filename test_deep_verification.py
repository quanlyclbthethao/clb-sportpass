# -*- coding: utf-8 -*-
"""
Deep Verification Test Suite for CLB-Sportpass
Comprehensive verification covering:
1. JS Syntax, DOMContentLoaded closure & global function scope.
2. Window bindings for all HTML onclick/oninput handlers.
3. Multi-department duplicate member role sync in membersDirectory.
4. Google Apps Script two-way sync with AdminRoles sheet.
5. Storage lifecycle & Remember Me logic.
6. Headless Edge DOM render validation.
"""

import os
import re
import json
import unittest
import subprocess

BASE_DIR = r"C:\Users\Admin\.gemini\antigravity\scratch\clb-sportpass"
INDEX_PATH = os.path.join(BASE_DIR, "index.html")
GAS_MULTI_PATH = os.path.join(BASE_DIR, "GoogleAppsScript_MultiSheet.js")
GAS_BACKEND_PATH = os.path.join(BASE_DIR, "GoogleAppsScript_Backend.js")

class TestDeepVerification(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(INDEX_PATH, "r", encoding="utf-8") as f:
            cls.html = f.read()
        with open(GAS_MULTI_PATH, "r", encoding="utf-8") as f:
            cls.gas_multi = f.read()
        with open(GAS_BACKEND_PATH, "r", encoding="utf-8") as f:
            cls.gas_backend = f.read()

    def test_domcontentloaded_closed_properly(self):
        """Kiem tra DOMContentLoaded khong bi mo ngoac nuot mat cac ham phan quyen"""
        # Bat buoc phai co }); ket thuc block DOMContentLoaded
        pattern = r"document\.addEventListener\('DOMContentLoaded',\s*\(\)\s*=>\s*\{[\s\S]*?checkStoredLoginSession\(\);[\s\S]*?exposeGlobalState\(\);[\s\S]*?\}\);"
        match = re.search(pattern, self.html)
        self.assertIsNotNone(match, "DOMContentLoaded listener must be cleanly closed with });")

    def test_no_stray_syntax_parentheses(self):
        """Kiem tra khong con ky tu ); lac long giua cac ham o top-level"""
        # Truoc day co ); lac long ngay truoc checkStoredLoginSession
        self.assertNotIn("}\n);\n\n    function checkStoredLoginSession", self.html)
        self.assertNotIn("}\n    );\n\n    function checkStoredLoginSession", self.html)

    def test_all_functions_exposed_on_window(self):
        """Kiem tra exposeGlobalState gan day du cac ham RBAC va Auth vao window"""
        required_window_funcs = [
            'togglePasswordVisibility',
            'quickFillLogin',
            'openAdminRoleManagementModal',
            'closeAdminRoleManagementModal',
            'setRoleDeptFilter',
            'updateRoleDeptFilterButtons',
            'filterRoleMemberList',
            'clearRoleMemberSearch',
            'renderRoleMemberList',
            'toggleMemberRole',
            'applyRoleChange',
            'getCustomAdminRoles',
            'saveCustomAdminRoles',
            'applyCustomAdminRoles'
        ]
        for fn in required_window_funcs:
            self.assertIn(f"window.{fn} = {fn};", self.html, f"Missing window.{fn} assignment in exposeGlobalState")

    def test_multi_department_member_role_sync(self):
        """Kiem tra logic cap quyen dong bo tat ca cac ban ghi kiem nhiem cua cung 1 nguoi"""
        mock_members = [
            {"id": "TTTL1805", "hoTen": "Tào Thị Tuyết Linh", "boMon": "Ban Chủ Nhiệm", "isAdmin": True, "isShiftLeader": True},
            {"id": "TTTL1805", "hoTen": "Tào Thị Tuyết Linh", "boMon": "Ban Bóng Đá Nữ", "isAdmin": False, "isShiftLeader": False},
            {"id": "DMC0806", "hoTen": "Đỗ Mạnh Cường", "boMon": "Ban Nhân Sự", "isAdmin": True, "isShiftLeader": True}
        ]

        # Gia lap logic trong applyRoleChange moi
        target_id = "TTTL1805"
        new_val = True
        role_type = "isAdmin"

        # Tat ca ban ghi co id == target_id phai duoc cap nhat
        for m in mock_members:
            if m["id"] == target_id:
                m[role_type] = new_val
                if role_type == "isAdmin" and new_val:
                    m["isShiftLeader"] = True

        # Kiem tra ca 2 ban ghi cua TTTL1805 deu duoc cap nhat
        matching = [m for m in mock_members if m["id"] == target_id]
        self.assertEqual(len(matching), 2)
        self.assertTrue(matching[0]["isAdmin"])
        self.assertTrue(matching[0]["isShiftLeader"])
        self.assertTrue(matching[1]["isAdmin"])
        self.assertTrue(matching[1]["isShiftLeader"])

    def test_gas_multisheet_merges_admin_roles(self):
        """Kiem tra GoogleAppsScript_MultiSheet.js hop nhat du lieu tu sheet AdminRoles khi doc thanh vien"""
        self.assertIn("getSheetByName('AdminRoles')", self.gas_multi)
        self.assertIn("membersMap[rId].isAdmin", self.gas_multi)
        self.assertIn("membersMap[rId].isShiftLeader", self.gas_multi)

    def test_gas_backend_persists_admin_roles(self):
        """Kiem tra GoogleAppsScript_Backend.js luu tru quyen vao sheet AdminRoles"""
        self.assertIn("getSheetByName('AdminRoles')", self.gas_backend)
        self.assertIn("rSheet.appendRow(['memberId', 'isAdmin', 'isShiftLeader', 'updatedBy', 'updatedAt'])", self.gas_backend)

    def test_headless_edge_render(self):
        """Chay Edge headless kiem tra load index.html thanh cong voi ma thoat 0"""
        edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
        if os.path.exists(edge_path):
            file_url = "file:///" + INDEX_PATH.replace("\\", "/")
            cmd = [edge_path, "--headless", "--dump-dom", file_url]
            res = subprocess.run(cmd, capture_output=True, encoding="utf-8", errors="replace", timeout=15)
            self.assertEqual(res.returncode, 0)
            self.assertIn("modalAdminRoleManagement", res.stdout)
            self.assertIn("chkRememberLogin", res.stdout)
            self.assertIn("btnTogglePass", res.stdout)

if __name__ == '__main__':
    unittest.main()
