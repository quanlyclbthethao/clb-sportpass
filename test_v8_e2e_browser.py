# -*- coding: utf-8 -*-
"""
SportPass V8.0 — Full Browser E2E, 3-Viewport Logged-In Live DOM Audit & Screenshot Suite
"""

import json
import os
import sys
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = Path(__file__).resolve().parent
INDEX_URL = (BASE_DIR / 'index.html').as_uri()
AUDITOR_DIR = Path(r'C:\Users\Admin\.gemini\config\skills\omni-app-studio\scripts')
SHOTS_DIR = Path(r'C:\Users\Admin\.gemini\antigravity\brain\f504c5bf-4fbe-4426-a4f4-b601c663d25d\shots_v8')

sys.path.insert(0, str(AUDITOR_DIR))
from live_dom_auditor import DOM_PROBE_JS, VIEWPORTS  # noqa: E402


class TestSportPassV8BrowserE2E(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        SHOTS_DIR.mkdir(parents=True, exist_ok=True)
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch(headless=True, channel='chrome')

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def test_logged_in_three_viewports_strict_dom_audit(self):
        for vp_name, width, height in VIEWPORTS:
            ctx = self.browser.new_context(viewport={'width': width, 'height': height})
            mock_gas = lambda route: route.fulfill(status=200, content_type='application/json', body='{"success":false,"mocked":true}')
            ctx.route('**/*script.google.com/**', mock_gas)
            ctx.route('**/*script.googleusercontent.com/**', mock_gas)
            page = ctx.new_page()
            console_errors = []
            page_errors = []
            page.on('console', lambda m: console_errors.append(m.text) if m.type == 'error' else None)
            page.on('pageerror', lambda e: page_errors.append(str(e)))

            page.goto(INDEX_URL, wait_until='domcontentloaded')
            page.wait_for_timeout(200)

            if vp_name == 'mobile':
                page.screenshot(path=str(SHOTS_DIR / '00_login_mobile.png'))

            page.fill('#iptUser', 'DMC0806')
            page.fill('#iptPass', '123456')
            page.click('#btnLoginSubmit')
            page.wait_for_selector('#viewMainAppContainer:not(.hidden)')
            # Wait for toast auto-dismiss (3s) + reveal stagger before measuring and screenshotting
            page.wait_for_timeout(3250)

            metrics = page.evaluate(DOM_PROBE_JS)
            page.screenshot(path=str(SHOTS_DIR / f'01_main_{vp_name}_{width}x{height}.png'))

            self.assertEqual(len(console_errors), 0, f'{vp_name} console errors: {console_errors}')
            self.assertEqual(len(page_errors), 0, f'{vp_name} page errors: {page_errors}')
            self.assertEqual(metrics['overflowPx'], 0, f'{vp_name} horizontal overflow: {metrics["overflowPx"]}')
            self.assertEqual(metrics['brokenImages'], [], f'{vp_name} broken images: {metrics["brokenImages"]}')
            self.assertEqual(metrics['sub24Targets'], [], f'{vp_name} sub-24px targets: {metrics["sub24Targets"]}')
            self.assertEqual(metrics['contrastFailures'], [], f'{vp_name} contrast failures: {metrics["contrastFailures"]}')
            ctx.close()

    def test_interactive_flows_qr_notif_settings_edit_shift_directory(self):
        ctx = self.browser.new_context(viewport={'width': 375, 'height': 812})
        mock_gas = lambda route: route.fulfill(status=200, content_type='application/json', body='{"success":false,"mocked":true}')
        ctx.route('**/*script.google.com/**', mock_gas)
        ctx.route('**/*script.googleusercontent.com/**', mock_gas)
        page = ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)

        page.goto(INDEX_URL, wait_until='domcontentloaded')
        page.fill('#iptUser', 'DMC0806')
        page.fill('#iptPass', '123456')
        page.click('#btnLoginSubmit')
        page.wait_for_selector('#viewMainAppContainer:not(.hidden)')
        page.wait_for_timeout(450)

        # Verify UHD admin loaded & exact profile values
        self.assertEqual(page.text_content('#role-badge').strip(), 'ADMIN')
        self.assertIn('ĐỖ MẠNH CƯỜNG', page.text_content('#card-heading'))
        self.assertEqual(page.text_content('#card-mssv').strip(), 'DMC0806')
        self.assertEqual(page.text_content('#display-dob').strip(), '08/06/2003')

        # 1. QR Modal + 45s countdown
        page.click('#qr-modal-trigger')
        page.wait_for_timeout(250)
        self.assertTrue(page.eval_on_selector('#qr-modal', 'el => el.open'))
        self.assertEqual(page.text_content('#qr-token-code').strip(), '#DMC0806-VN')
        self.assertEqual(page.text_content('#qr-timer').strip(), '45s')
        page.screenshot(path=str(SHOTS_DIR / '02_qr_modal.png'))
        page.click('#qr-modal-close')

        # 2. Notification Modal
        page.click('#notification-trigger')
        page.wait_for_timeout(250)
        self.assertTrue(page.eval_on_selector('#notification-modal', 'el => el.open'))
        page.screenshot(path=str(SHOTS_DIR / '03_notification_modal.png'))
        page.click('#notification-dismiss-btn')

        # 3. Edit Profile (including XSS payload escaping test!)
        page.click('#edit-profile-trigger')
        page.wait_for_timeout(250)
        self.assertTrue(page.eval_on_selector('#edit-profile-modal', 'el => el.open'))
        page.fill('#input-phone', '0987654321')
        page.fill('#input-ice', '0911222333 <img src=x onerror=alert(1)>')
        page.screenshot(path=str(SHOTS_DIR / '04_edit_profile_modal.png'))
        page.click('#edit-modal-save')
        page.wait_for_timeout(250)
        self.assertEqual(page.text_content('#display-phone').strip(), '0987654321')
        self.assertIn('<img src=x', page.text_content('#display-ice'))

        # 4. Create Shift Modal ("Tạo ca")
        page.click('#admin-create-shift-btn')
        page.wait_for_timeout(250)
        self.assertTrue(page.eval_on_selector('#create-shift-modal', 'el => el.open'))
        page.fill('#iptTaskTitle', 'Ca trực Giải Vô Địch Sinh Viên UHD')
        page.screenshot(path=str(SHOTS_DIR / '05_create_shift_modal.png'))
        page.click('#btnSubmitTask')
        page.wait_for_timeout(200)

        # 5. Approve / Dispatch / Scanner / Directory Modal ("Duyệt ca")
        page.click('#admin-approve-btn')
        page.wait_for_timeout(250)
        self.assertTrue(page.eval_on_selector('#approve-shift-modal', 'el => el.open'))
        page.click('#approve-tab-btn-shifts')
        page.wait_for_timeout(150)
        self.assertIn('Ca trực Giải Vô Địch Sinh Viên UHD', page.text_content('#shiftsListContainer'))
        page.screenshot(path=str(SHOTS_DIR / '06_dispatch_shifts_modal.png'))

        # Manual QR Check-in for DMC0806 increments #stat-shifts
        before_shifts = int(page.text_content('#stat-shifts').strip())
        page.click('#approve-tab-btn-scanner')
        page.wait_for_timeout(150)
        page.fill('#iptManualCheckinId', 'DMC0806')
        page.click('#btnManualCheckin')
        page.wait_for_timeout(150)
        after_shifts = int(page.text_content('#stat-shifts').strip())
        self.assertEqual(after_shifts, before_shifts + 1)

        # Directory shows 125 members
        page.click('#approve-tab-btn-directory')
        page.wait_for_timeout(150)
        self.assertIn('/ 125 hồ sơ', page.text_content('#directoryCountLabel'))
        page.click('#approve-shift-close')

        # 6. Settings Modal -> Toggle Dark Mode + Logout
        page.click('#settings-trigger')
        page.wait_for_timeout(250)
        self.assertTrue(page.eval_on_selector('#settings-modal', 'el => el.open'))
        page.click('#theme-toggle-row')
        page.wait_for_timeout(450)
        self.assertEqual(page.evaluate('document.documentElement.dataset.theme'), 'dark')
        page.screenshot(path=str(SHOTS_DIR / '07_settings_dark_modal.png'))
        page.click('#settings-modal-close')
        page.wait_for_timeout(150)
        page.screenshot(path=str(SHOTS_DIR / '08_main_mobile_dark.png'))

        # Toggle back to Light + Logout
        page.click('#settings-trigger')
        page.click('#theme-toggle-row')
        page.click('#theme-toggle-row')
        page.click('#logout-btn')
        page.wait_for_selector('#viewLoginContainer:not(.hidden)')

        self.assertEqual(errors, [], f'Browser runtime errors: {errors}')
        ctx.close()


if __name__ == '__main__':
    unittest.main(verbosity=2)
