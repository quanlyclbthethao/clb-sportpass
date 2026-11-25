# -*- coding: utf-8 -*-
"""
SportPass V8.5 (Aquamorphic Varsity Pass & Modal Suite) — Static & Domain Integrity Suite
Verifies:
1. Complete removal of Forum
2. Ocean Login portal, 5-block main UI + Admin/Member switcher + 10 native <dialog closedby="any"> modals
3. 125 official UHD SportPass members & sole root Admin DMC0806
4. Production hygiene (zero cdn.tailwindcss.com, zero .innerHTML=, SHA-384 SRI, single <h1>)
5. Google Apps Script MultiSheet backend integration preserved
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


class TestSportPassV85Architecture(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(INDEX_PATH, 'r', encoding='utf-8') as f:
            cls.html = f.read()
        with open(MEMBERS_JS_PATH, 'r', encoding='utf-8') as f:
            cls.members_raw = f.read()
        with open(GAS_MULTI_PATH, 'r', encoding='utf-8') as f:
            cls.gas_multi = f.read()

    def test_forum_completely_removed(self):
        for forbidden in ('DEFAULT_COMMUNITY_POSTS', 'renderForumFeed', 'tabContentForum', 'deletePost', 'createPost'):
            self.assertNotIn(forbidden, self.html, f'Forum artifact still present: {forbidden}')

    def test_v85_modals_and_canonical_ids_present(self):
        required_ids = [
            'viewLoginContainer', 'btnLoginSubmit', 'btnFaceIdLogin', 'btnTouchIdLogin', 'btnForgotPass',
            'role-badge', 'notification-trigger', 'members-trigger', 'settings-trigger',
            'hero-card-wrap', 'hero-interactive-card', 'card-pattern',
            'hero-status-pill', 'hero-avatar-img', 'card-heading', 'card-mssv', 'qr-modal-trigger',
            'stat-shifts', 'stat-efficiency', 'stat-rating',
            'admin-create-shift-btn', 'admin-approve-btn', 'member-register-btn', 'member-swap-btn',
            'role-preview-dock', 'role-switch-member', 'role-switch-admin',
            'edit-profile-trigger', 'display-fullname', 'display-studentId', 'display-faculty',
            'display-dob', 'display-dutyArea', 'display-role', 'display-phone', 'display-ice',
            'qr-modal', 'notification-modal', 'members-modal', 'settings-modal',
            'edit-profile-modal', 'create-shift-modal', 'approve-shift-modal', 'task-mission-modal',
            'password-modal', 'success-celebration-modal', 'logout-btn'
        ]
        for eid in required_ids:
            self.assertIn(f'id="{eid}"', self.html, f'Missing element #{eid}')

    def test_single_h1_and_native_dialog_light_dismiss(self):
        markup = re.sub(r'<script\b[^>]*>[\s\S]*?</script>', '', self.html, flags=re.I)
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
        for action in ('login', 'syncAll', 'updateProfile', 'createTask', 'claimTask', 'withdrawTask', 'checkinMember', 'updateMemberRole'):
            self.assertIn(action, self.html)
            self.assertIn(action, self.gas_multi)


if __name__ == '__main__':
    unittest.main(verbosity=2)
