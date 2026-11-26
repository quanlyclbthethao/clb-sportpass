# -*- coding: utf-8 -*-
"""
SportPass V8.8 (ID/MSSV Separation, Fast Auth, Registration, Member Add/Delete & Zero Duplicate Close Buttons) — Static & Domain Integrity Suite
"""

import json
import os
import re
import sys
import unittest

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_PATH = os.path.join(BASE_DIR, 'index.html')
MEMBERS_JS_PATH = os.path.join(BASE_DIR, 'src', 'data', 'members.js')
MANIFEST_PATH = os.path.join(BASE_DIR, 'manifest.json')
ICON_SVG_PATH = os.path.join(BASE_DIR, 'icon.svg')
GAS_MULTI_PATH = os.path.join(BASE_DIR, 'GoogleAppsScript_MultiSheet.js')


class TestSportPassV88Architecture(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(INDEX_PATH, 'r', encoding='utf-8') as f:
            cls.html = f.read()
        with open(MEMBERS_JS_PATH, 'r', encoding='utf-8') as f:
            cls.members_raw = f.read()
        with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
            cls.manifest_raw = f.read()
        with open(GAS_MULTI_PATH, 'r', encoding='utf-8') as f:
            cls.gas_multi = f.read()

    def test_bloat_and_duplicate_modal_buttons_removed(self):
        removed_tokens = (
            'DEFAULT_COMMUNITY_POSTS', 'renderForumFeed', 'tabContentForum',
            'role-preview-dock', 'role-switch-member', 'role-switch-admin', 'setRolePreviewMode',
            'switchFaceId', 'switchRemoteLock', 'switchTilt3d', 'switchUrgentNotifs', 'switchHaptics',
            'lang-btn-vn', 'lang-btn-en', 'terms-privacy-row', 'qr-locked-notice',
            'stat-shifts-btn', 'stat-efficiency-btn', 'stat-rating-btn',
            '>+ Tạo ca trực<',
            'btnFaceIdLogin', 'btnTouchIdLogin', 'btnForgotPass', 'login-pro-tag', 'login-club-chip', 'login-footer-ssl',
            'members-modal-close"', 'edit-modal-cancel', 'create-shift-cancel', 'password-modal-cancel',
            'notification-dismiss-btn', 'task-mission-close"', 'celebration-close-x'
        )
        for token in removed_tokens:
            self.assertNotIn(token, self.html, f'Removed/duplicate token still present: {token}')

    def test_v88_canonical_and_separated_id_mssv_present(self):
        required_ids = [
            'viewLoginContainer', 'btnLoginSubmit', 'btnOpenRegisterModal', 'reg-preview-id',
            'role-badge', 'notification-trigger', 'notification-dot', 'members-trigger', 'settings-trigger',
            'hero-card-wrap', 'hero-interactive-card', 'card-pattern',
            'hero-status-pill', 'hero-avatar-btn', 'card-heading', 'card-member-id', 'card-mssv', 'qr-modal-trigger',
            'selQrPassTask', 'qr-checkin-status-pill',
            'stat-shifts', 'stat-activities',
            'admin-create-shift-btn', 'admin-approve-btn', 'member-register-btn', 'member-swap-btn',
            'admin-add-member-btn', 'display-memberId', 'display-studentId', 'input-memberId', 'input-studentId',
            'input-dutyArea', 'input-role', 'reg-department', 'add-department', 'add-role',
            'edit-profile-trigger', 'btnAvatarThumbTrigger', 'display-fullname',
            'display-faculty', 'display-dob', 'display-dutyArea', 'display-role', 'display-phone', 'display-ice',
            'theme-btn-light', 'theme-btn-dark', 'theme-btn-system', 'security-password-row', 'password-status-desc',
            'task-cat-shift', 'task-cat-activity', 'iptTaskCategory',
            'selTaskLeader', 'scannerCheckedInList', 'memberMyRequestsList', 'password-form',
            'qr-modal', 'notification-modal', 'members-modal', 'settings-modal',
            'edit-profile-modal', 'create-shift-modal', 'approve-shift-modal', 'task-mission-modal',
            'password-modal', 'success-celebration-modal', 'register-modal', 'add-member-modal', 'confirm-delete-modal',
            'btnSubmitRegister', 'btnSubmitAddMember', 'btnConfirmDeleteMember', 'logout-btn'
        ]
        for eid in required_ids:
            self.assertIn(f'id="{eid}"', self.html, f'Missing element #{eid}')

        member_id_input = re.search(r'<input[^>]*id="input-memberId"[^>]*>', self.html)
        student_input = re.search(r'<input[^>]*id="input-studentId"[^>]*>', self.html)
        self.assertIsNotNone(member_id_input)
        self.assertIsNotNone(student_input)
        self.assertIn('readonly', member_id_input.group(0).lower())
        self.assertNotIn('readonly', student_input.group(0).lower())
        self.assertIsNotNone(re.search(r'<select[^>]*id="input-dutyArea"', self.html))
        self.assertIsNotNone(re.search(r'<select[^>]*id="input-role"', self.html))

    def test_single_h1_and_13_native_dialogs(self):
        markup = re.sub(r'<(script|style)\b[^>]*>[\s\S]*?</\1>', '', self.html, flags=re.I)
        h1_matches = re.findall(r'<h1\b', markup, re.I)
        self.assertEqual(len(h1_matches), 1, f'Expected exactly 1 <h1>, found {len(h1_matches)}')
        dialogs = re.findall(r'<dialog\b[^>]*>', markup, re.I)
        self.assertEqual(len(dialogs), 13)
        for d in dialogs:
            self.assertIn('closedby="any"', d)
            self.assertNotIn('role="dialog"', d)
            self.assertNotIn('aria-modal', d)

    def test_manifest_uses_local_icon_svg(self):
        self.assertTrue(os.path.isfile(ICON_SVG_PATH))
        self.assertNotIn('api.iconify.design', self.manifest_raw)
        self.assertIn('./icon.svg', self.manifest_raw)

    def test_production_security_and_sri(self):
        for banned in ('cdn.tailwindcss.com', 'transition-all', '::-webkit-scrollbar', '.innerHTML =', 'quickFillLogin'):
            self.assertNotIn(banned, self.html, f'Forbidden pattern detected: {banned}')
        ext_scripts = re.findall(r'<script\b[^>]*src="https://[^"]+"[^>]*>', self.html, re.I)
        self.assertEqual(len(ext_scripts), 2)
        for tag in ext_scripts:
            self.assertIn('integrity="sha384-', tag)

    def test_125_uhd_members_and_sole_root_admin(self):
        m = re.search(r'const DEFAULT_MEMBERS_DIRECTORY = (\[[\s\S]*?\]);', self.members_raw)
        self.assertIsNotNone(m)
        members = json.loads(m.group(1))
        self.assertEqual(len(members), 125)
        self.assertEqual([x['id'] for x in members if x.get('isAdmin')], ['DMC0806'])
        self.assertEqual(len({x.get('boMon') for x in members}), 7)

    def test_gas_backend_sync_actions_present(self):
        for action in (
            'login', 'syncAll', 'updateProfile', 'createTask', 'claimTask', 'withdrawTask',
            'checkinMember', 'updateMemberRole', 'adjustMemberShifts',
            'registerMember', 'addMember', 'deleteMember', 'updatePassword'
        ):
            self.assertIn(action, self.html)
            self.assertIn(action, self.gas_multi)


if __name__ == '__main__':
    unittest.main(verbosity=2)
