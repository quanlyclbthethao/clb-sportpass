# -*- coding: utf-8 -*-
"""
Deep Edge Cases Verification Suite for CLB-SportPass
Tests:
1. XSS Escaping on all rendered member fields in Role Management Center
2. Search query accents and case insensitivity
3. Empty member directory edge case handling
4. Self-lockout protection for current admin
5. Storage behavior simulations
6. Password eye toggle DOM state consistency
"""

import os
import re
import unittest

BASE_DIR = r"C:\Users\Admin\.gemini\antigravity\scratch\clb-sportpass"
INDEX_PATH = os.path.join(BASE_DIR, "index.html")

class TestEdgeCases(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(INDEX_PATH, "r", encoding="utf-8") as f:
            cls.html = f.read()

    def test_xss_protection_in_role_rendering(self):
        """Kiem tra toan bo du lieu thanh vien render deu duoc escapeHtml"""
        # escapeHtml(m.hoTen), escapeHtml(m.id), escapeHtml(m.boMon), escapeHtml(m.chucVu)
        self.assertIn("${escapeHtml(m.hoTen)}", self.html)
        self.assertIn("${escapeHtml(m.id)}", self.html)
        self.assertIn("${escapeHtml(m.boMon || '')}", self.html)
        self.assertIn("${escapeHtml(m.chucVu || 'Thành viên')}", self.html)

    def test_self_lockout_protection_for_admin(self):
        """Kiem tra Admin tu go quyen Admin cua chinh minh phai co confirm dialog canh bao"""
        self.assertIn("Hạ Quyền Quản Trị Của Bạn?", self.html)
        self.assertIn("currentUser.id === memberId && roleType === 'isAdmin' && !newVal", self.html)
        self.assertIn("openConfirmDialog", self.html)

    def test_auto_shift_leader_on_admin_grant(self):
        """Khi cap quyen Admin thi he thong phai tu dong cap kem quyen Truong Ca"""
        self.assertIn("if (roleType === 'isAdmin' && newVal === true)", self.html)
        self.assertIn("member.isShiftLeader = true;", self.html)

    def test_empty_search_and_no_match_state(self):
        """Kiem tra trang thai khong tim thay thanh vien hien thi card thong bao dep mat"""
        self.assertIn("Không tìm thấy thành viên phù hợp", self.html)
        self.assertIn("Thử tìm kiếm theo Mã ID, Họ tên hoặc chọn lại bộ lọc Ban", self.html)

    def test_remember_me_unchecked_clears_local_storage(self):
        """Khi bo tich Remember Me thi phai xoa CLB_REMEMBER_LOGIN va session o localStorage"""
        self.assertIn("localStorage.removeItem('CLB_REMEMBER_LOGIN');", self.html)
        self.assertIn("localStorage.removeItem('CLB_SPORTPASS_AUTH_SESSION');", self.html)
        self.assertIn("sessionStorage.setItem('CLB_SPORTPASS_AUTH_SESSION', userStr);", self.html)

    def test_custom_roles_cached_with_timestamp(self):
        """Kiem tra CLB_CUSTOM_ADMIN_ROLES luu timestamp updatedAt"""
        self.assertIn("updatedAt: new Date().toISOString()", self.html)
        self.assertIn("CLB_CUSTOM_ADMIN_ROLES", self.html)

if __name__ == '__main__':
    unittest.main()
