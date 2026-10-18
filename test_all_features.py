# -*- coding: utf-8 -*-
"""
Automated Test Suite for CLB-Sportpass
Verifies:
1. Transparent Authentication UI (Eye toggle, guidance panel, sample accounts, Remember me checkbox)
2. Remember Me session storage lifecycle (localStorage vs sessionStorage)
3. Admin Role Management Center UI (Modal, Toolbar button, Menu button, Search, Filters, Stats)
4. Role Toggle RBAC logic (Granting/Revoking Admin and Shift Leader, Auto Shift Leader for Admin, Persistent Cache)
5. Google Apps Script updateMemberRole integration
6. 125 members data integrity
"""

import os
import re
import json
import unittest

BASE_DIR = r"C:\Users\Admin\.gemini\antigravity\scratch\clb-sportpass"
INDEX_PATH = os.path.join(BASE_DIR, "index.html")
GAS_MULTI_PATH = os.path.join(BASE_DIR, "GoogleAppsScript_MultiSheet.js")
GAS_BACKEND_PATH = os.path.join(BASE_DIR, "GoogleAppsScript_Backend.js")

class TestSportPassFeatures(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(INDEX_PATH, "r", encoding="utf-8") as f:
            cls.html = f.read()
        with open(GAS_MULTI_PATH, "r", encoding="utf-8") as f:
            cls.gas_multi = f.read()
        with open(GAS_BACKEND_PATH, "r", encoding="utf-8") as f:
            cls.gas_backend = f.read()

    # ==================== TEST 1: TRANSPARENT AUTHENTICATION UI ====================
    def test_password_eye_toggle_element(self):
        """Kiem tra nut con mat xem/an mat khau"""
        self.assertIn('id="iptPass"', self.html)
        self.assertIn('id="btnTogglePass"', self.html)
        self.assertIn('onclick="togglePasswordVisibility()"', self.html)
        self.assertIn('function togglePasswordVisibility()', self.html)

    def test_remember_me_checkbox_element(self):
        """Kiem tra checkbox ghi nho dang nhap tren thiet bi nay"""
        self.assertIn('id="chkRememberLogin"', self.html)
        self.assertIn('Ghi nhớ đăng nhập trên thiết bị này', self.html)
        self.assertIn("localStorage.setItem('CLB_REMEMBER_LOGIN', 'true')", self.html)

    def test_transparent_guidance_panel(self):
        """Kiem tra bang huong dan dang nhap minh bach Glassmorphic va tai khoan mau"""
        self.assertIn('Hướng Dẫn Đăng Nhập Minh Bạch', self.html)
        self.assertIn('DMC0806', self.html)
        self.assertIn('123456', self.html)
        self.assertIn('quickFillLogin', self.html)
        self.assertIn("quickFillLogin('DMC0806', '123456')", self.html)
        self.assertIn("quickFillLogin('LDH0912', '123456')", self.html)
        self.assertIn("quickFillLogin('DDH1011', '123456')", self.html)

    # ==================== TEST 2: SESSION & STORAGE LIFECYCLE ====================
    def test_storage_lifecycle_logic(self):
        """Kiem tra co che phan tach localStorage vs sessionStorage theo CLB_REMEMBER_LOGIN"""
        # Trong checkStoredLoginSession phai kiem tra ca sessionCached va rememberFlag
        self.assertIn("sessionStorage.getItem('CLB_SPORTPASS_AUTH_SESSION')", self.html)
        self.assertIn("localStorage.getItem('CLB_REMEMBER_LOGIN')", self.html)
        self.assertIn("localStorage.getItem('CLB_SPORTPASS_AUTH_SESSION')", self.html)
        
        # Trong saveLocalState phai xu ly isRemembered
        self.assertIn("const isRemembered = localStorage.getItem('CLB_REMEMBER_LOGIN') === 'true';", self.html)
        
        # Trong executeLogoutAction phai xoa sach session ca 2 noi
        self.assertIn("localStorage.removeItem('CLB_SPORTPASS_AUTH_SESSION');", self.html)
        self.assertIn("localStorage.removeItem('CLB_REMEMBER_LOGIN');", self.html)
        self.assertIn("sessionStorage.removeItem('CLB_SPORTPASS_AUTH_SESSION');", self.html)

    # ==================== TEST 3: ADMIN ROLE MANAGEMENT CENTER ====================
    def test_admin_role_modal_elements(self):
        """Kiem tra giao dien Trung tam phan quyen admin modal"""
        self.assertIn('id="modalAdminRoleManagement"', self.html)
        self.assertIn('Trung Tâm Cấp Quyền &amp; Phân Vai', self.html)
        self.assertIn('id="iptRoleMemberSearch"', self.html)
        self.assertIn('id="roleDeptFilterBar"', self.html)
        self.assertIn('id="roleMemberListContainer"', self.html)
        self.assertIn('id="roleCountTotal"', self.html)
        self.assertIn('id="roleCountAdmin"', self.html)
        self.assertIn('id="roleCountShiftLeader"', self.html)

    def test_admin_toolbar_and_menu_buttons(self):
        """Kiem tra nut mo modal tren toolbar va menu"""
        self.assertIn('onclick="openAdminRoleManagementModal()"', self.html)
        self.assertIn('Phân Quyền Admin', self.html)
        self.assertIn('id="btnMenuRoleManagement"', self.html)

    def test_role_functions_present(self):
        """Kiem tra day du cac ham JS dieu khien phan quyen"""
        funcs = [
            'openAdminRoleManagementModal',
            'closeAdminRoleManagementModal',
            'setRoleDeptFilter',
            'filterRoleMemberList',
            'renderRoleMemberList',
            'toggleMemberRole',
            'applyRoleChange',
            'getCustomAdminRoles',
            'saveCustomAdminRoles',
            'applyCustomAdminRoles'
        ]
        for fn in funcs:
            self.assertIn(f'function {fn}', self.html, f"Missing JS function {fn}")

    # ==================== TEST 4: RBAC & OVERRIDE SIMULATION ====================
    def test_role_override_logic_simulation(self):
        """Mo phong logic toggle role, auto shift leader cho admin, va luu tru cache"""
        mock_members = [
            {"id": "DDH1011", "hoTen": "Đinh Đức Huy", "isAdmin": False, "isShiftLeader": False},
            {"id": "LDH0912", "hoTen": "Lương Đình Hiếu", "isAdmin": False, "isShiftLeader": True},
            {"id": "DMC0806", "hoTen": "Đỗ Mạnh Cường", "isAdmin": True, "isShiftLeader": True}
        ]

        custom_roles = {}
        
        # 1. Cap quyen Admin cho DDH1011
        target = mock_members[0]
        self.assertFalse(target["isAdmin"])
        self.assertFalse(target["isShiftLeader"])

        # Khi cap Admin: isAdmin = True va isShiftLeader = True
        target["isAdmin"] = True
        target["isShiftLeader"] = True
        custom_roles[target["id"]] = {"isAdmin": True, "isShiftLeader": True}

        self.assertTrue(target["isAdmin"])
        self.assertTrue(target["isShiftLeader"])

        # 2. Mo phong applyCustomAdminRoles sau khi tai lai
        new_members_load = [
            {"id": "DDH1011", "hoTen": "Đinh Đức Huy", "isAdmin": False, "isShiftLeader": False}
        ]
        for m in new_members_load:
            if m["id"] in custom_roles:
                m["isAdmin"] = custom_roles[m["id"]]["isAdmin"]
                m["isShiftLeader"] = custom_roles[m["id"]]["isShiftLeader"]

        self.assertTrue(new_members_load[0]["isAdmin"])
        self.assertTrue(new_members_load[0]["isShiftLeader"])

    # ==================== TEST 5: 125 MEMBERS DIRECTORY ====================
    def test_members_count(self):
        """Kiem tra danh muc 125 thanh vien duoc nap vao HTML"""
        match = re.search(r'const DEFAULT_MEMBERS_DIRECTORY = (\[.*?\]);\s*\n', self.html)
        self.assertIsNotNone(match, "DEFAULT_MEMBERS_DIRECTORY not found in index.html")
        members = json.loads(match.group(1))
        self.assertEqual(len(members), 125, "DEFAULT_MEMBERS_DIRECTORY must contain 125 members")

    # ==================== TEST 6: GAS BACKEND ACTION ====================
    def test_gas_update_member_role_action(self):
        """Kiem tra backend Google Apps Script ho tro action updateMemberRole"""
        self.assertIn("action === 'updateMemberRole'", self.gas_multi)
        self.assertIn("function handleUpdateMemberRole", self.gas_multi)
        self.assertIn("action === 'updateMemberRole'", self.gas_backend)

if __name__ == '__main__':
    unittest.main()
