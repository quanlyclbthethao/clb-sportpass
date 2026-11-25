# -*- coding: utf-8 -*-
"""
SportPass V8.6 (Real Account RBAC, Slim Settings & Top-Layer Motion) — Static & Domain Integrity Suite
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
GAS_MULTI_PATH = os.path.join(BASE_DIR, 'GoogleAppsScript_MultiSheet.js')


class TestSportPassV86Architecture(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(INDEX_PATH, 'r', encoding='utf-8') as f:
            cls.html = f.read()
        with open(MEMBERS_JS_PATH, 'r', encoding='utf-8') as f:
            cls.members_raw = f.read()
        with open(GAS_MULTI_PATH, 'r', encoding='utf-8') as f:
            cls.gas_multi = f.read()

    def test_bloat_and_mock_role_switcher_removed(self):
        removed_tokens = (
            'DEFAULT_COMMUNITY_POSTS', 'renderForumFeed', 'tabContentForum',
            'role-preview-dock', 'role-switch-member', 'role-switch-admin', 'setRolePreviewMode',
            'switchFaceId', 'switchRemoteLock', 'switchTilt3d', 'switchUrgentNotifs', 'switchHaptics',
            'lang-btn-vn', 'lang-btn-en', 'terms-privacy-row', 'qr-locked-notice'
        )
        for token in removed_tokens:
            self.assertNotIn(token, self.html, f'Removed/bloated token still present: {token}')

    def test_v86_canonical_and_slim_ids_present(self):
        required_ids = [
            'viewLoginContainer', 'btnLoginSubmit', 'btnFaceIdLogin', 'btnTouchIdLogin', 'btnForgotPass',
            'role-badge', 'notification-trigger', 'notification-dot', 'members-trigger', 'settings-trigger',
            'hero-card-wrap', 'hero-interactive-card', 'card-pattern',
            'hero-status-pill', 'hero-avatar-btn', 'card-heading', 'card-mssv', 'qr-modal-trigger',
            'selQrPassTask', 'qr-checkin-status-pill',
            'stat-shifts', 'stat-efficiency', 'stat-rating',
            'admin-create-shift-btn', 'admin-approve-btn', 'member-register-btn', 'member-swap-btn',
            'edit-profile-trigger', 'btnAvatarThumbTrigger', 'display-fullname', 'display-studentId',
            'display-faculty', 'display-dob', 'display-dutyArea', 'display-role', 'display-phone', 'display-ice',
            'theme-btn-light', 'theme-btn-dark', 'theme-btn-system', 'security-password-row', 'password-status-desc',
            'selTaskLeader', 'scannerCheckedInList', 'memberMyRequestsList', 'password-form',
            'qr-modal', 'notification-modal', 'members-modal', 'settings-modal',
            'edit-profile-modal', 'create-shift-modal', 'approve-shift-modal', 'task-mission-modal',
            'password-modal', 'success-celebration-modal', 'logout-btn'
        ]
        for eid in required_ids:
            self.assertIn(f'id="{eid}"', self.html, f'Missing element #{eid}')

    def test_single_h1_and_native_dialog_light_dismiss(self):
        markup = re.sub(r'<(script|style)\b[^>]*>[\s\S]*?</\1>', '', self.html, flags=re.I)
        h1_matches = re.findall(r'<h1\b', markup, re.I)
        self.assertEqual(len(h1_matches), 1, f'Expected exactly 1 <h1>, found {len(h1_matches)}')
        dialogs = re.findall(r'<dialog\b[^>]*>', markup, re.I)
        self.assertEqual(len(dialogs), 10)
        for d in dialogs:
            self.assertIn('closedby="any"', d)
            self.assertNotIn('role="dialog"', d)
            self.assertNotIn('aria-modal', d)

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
        for action in ('login', 'syncAll', 'updateProfile', 'createTask', 'claimTask', 'withdrawTask', 'checkinMember', 'updateMemberRole', 'adjustMemberShifts'):
            self.assertIn(action, self.html)
            self.assertIn(action, self.gas_multi)


if __name__ == '__main__':
    unittest.main(verbosity=2)
