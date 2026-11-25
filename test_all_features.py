# -*- coding: utf-8 -*-
"""
SportPass V8.0 (Aquamorphic Varsity Pass) — Comprehensive Static & Domain Integrity Suite
Verifies:
1. Complete removal of Forum (zero DEFAULT_COMMUNITY_POSTS, zero renderForumFeed, zero forum DOM)
2. Canonical 5-block UI fidelity (Header, 3D Hero Card w/ SVG waves, 3 Stats, Quick Actions, 8 Profile Rows)
3. 125 official UHD SportPass members & 7 official departments preserved
4. Sole root Admin invariant (DMC0806 only by default; role promotion/revocation + protection)
5. Production hygiene (Zero cdn.tailwindcss.com, zero .innerHTML=, SHA-384 SRI, native <dialog closedby="any">)
6. Google Apps Script MultiSheet backend intact
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


class TestSportPassV8Architecture(unittest.TestCase):
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

    def test_canonical_ui_elements_present_without_bottom_dock(self):
        required_ids = [
            'role-badge', 'notification-trigger', 'settings-trigger',
            'hero-card-wrap', 'hero-interactive-card', 'card-pattern',
            'hero-status-pill', 'hero-avatar-img', 'card-heading', 'card-mssv',
            'qr-modal-trigger', 'stat-shifts', 'stat-efficiency', 'stat-rating',
            'admin-create-shift-btn', 'admin-approve-btn', 'edit-profile-trigger',
            'display-fullname', 'display-studentId', 'display-faculty', 'display-dob',
            'display-dutyArea', 'display-role', 'display-phone', 'display-ice',
            'qr-modal', 'notification-modal', 'settings-modal', 'edit-profile-modal',
            'create-shift-modal', 'approve-shift-modal', 'logout-btn'
        ]
        for eid in required_ids:
            self.assertIn(f'id="{eid}"', self.html, f'Missing canonical element #{eid}')

        # Verify no extra bottom dock navigation or VietQR/FAQ blocks leaked onto main view
        self.assertNotIn('dock-indicator', self.html)
        self.assertNotIn('modalVietQr', self.html)
        self.assertNotIn('modalHelpCenter', self.html)

    def test_single_h1_and_native_dialog_light_dismiss(self):
        h1_matches = re.findall(r'<h1\b', self.html, re.I)
        self.assertEqual(len(h1_matches), 1, f'Expected exactly 1 <h1>, found {len(h1_matches)}')
        dialogs = re.findall(r'<dialog\b[^>]*>', self.html, re.I)
        self.assertGreaterEqual(len(dialogs), 7)
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
        admins = [x['id'] for x in members if x.get('isAdmin')]
        self.assertEqual(admins, ['DMC0806'])
        depts = {x.get('boMon') for x in members}
        self.assertEqual(len(depts), 7)

    def test_gas_backend_sync_actions_present(self):
        for action in ('login', 'syncAll', 'updateProfile', 'createTask', 'claimTask', 'withdrawTask', 'checkinMember', 'adjustMemberShifts', 'updateMemberRole'):
            self.assertIn(action, self.html)
            self.assertIn(action, self.gas_multi)


if __name__ == '__main__':
    unittest.main(verbosity=2)
