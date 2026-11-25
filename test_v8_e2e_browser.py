# -*- coding: utf-8 -*-
"""
SportPass V8.5 — Full Browser E2E, 3-Viewport Logged-In Audit & V8.5 Modal Screenshots
"""

import sys
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = Path(__file__).resolve().parent
INDEX_URL = (BASE_DIR / 'index.html').as_uri()
AUDITOR_DIR = Path(r'C:\Users\Admin\.gemini\config\skills\omni-app-studio\scripts')
SHOTS_DIR = Path(r'C:\Users\Admin\.gemini\antigravity\brain\f504c5bf-4fbe-4426-a4f4-b601c663d25d\shots_v85')

sys.path.insert(0, str(AUDITOR_DIR))
from live_dom_auditor import DOM_PROBE_JS, VIEWPORTS  # noqa: E402


class TestSportPassV85BrowserE2E(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        SHOTS_DIR.mkdir(parents=True, exist_ok=True)
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch(headless=True, channel='chrome')

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def _attach_gas_mock(self, ctx):
        mock_gas = lambda route: route.fulfill(
            status=200,
            content_type='application/json',
            body='{"success":false,"mocked":true}'
        )
        ctx.route('**/*script.google.com/**', mock_gas)
        ctx.route('**/*script.googleusercontent.com/**', mock_gas)

    def test_logged_in_three_viewports_strict_dom_audit(self):
        for vp_name, width, height in VIEWPORTS:
            ctx = self.browser.new_context(viewport={'width': width, 'height': height})
            self._attach_gas_mock(ctx)
            page = ctx.new_page()
            console_errors = []
            page_errors = []
            page.on('console', lambda m: console_errors.append(m.text) if m.type == 'error' else None)
            page.on('pageerror', lambda e: page_errors.append(str(e)))

            page.goto(INDEX_URL, wait_until='domcontentloaded')
            page.wait_for_timeout(200)
            if vp_name == 'mobile':
                page.screenshot(path=str(SHOTS_DIR / '00_login_ocean_mobile.png'))

            page.fill('#iptUser', 'DMC0806')
            page.fill('#iptPass', '123456')
            page.click('#btnLoginSubmit')
            page.wait_for_selector('#viewMainAppContainer:not(.hidden)')
            page.wait_for_timeout(3250)

            metrics = page.evaluate(DOM_PROBE_JS)
            page.screenshot(path=str(SHOTS_DIR / f'01_main_{vp_name}_{width}x{height}.png'))

            self.assertEqual(len(console_errors), 0, f'{vp_name} console errors: {console_errors}')
            self.assertEqual(len(page_errors), 0, f'{vp_name} page errors: {page_errors}')
            self.assertEqual(metrics['overflowPx'], 0, f'{vp_name} overflow: {metrics["overflowPx"]}')
            self.assertEqual(metrics['brokenImages'], [], f'{vp_name} broken imgs: {metrics["brokenImages"]}')
            self.assertEqual(metrics['sub24Targets'], [], f'{vp_name} sub-24px targets: {metrics["sub24Targets"]}')
            self.assertEqual(metrics['contrastFailures'], [], f'{vp_name} contrast failures: {metrics["contrastFailures"]}')
            ctx.close()

    def test_all_v85_modals_role_switch_and_celebration_popups(self):
        ctx = self.browser.new_context(viewport={'width': 375, 'height': 812})
        self._attach_gas_mock(ctx)
        page = ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)

        page.goto(INDEX_URL, wait_until='domcontentloaded')
        page.fill('#iptUser', 'DMC0806')
        page.fill('#iptPass', '123456')
        page.click('#btnLoginSubmit')
        page.wait_for_selector('#viewMainAppContainer:not(.hidden)')
        page.wait_for_timeout(500)

        # Verify Admin mode badges and Members Modal (Screenshot 1)
        self.assertEqual(page.text_content('#role-badge').strip(), 'ADMIN')
        self.assertEqual(page.text_content('#approve-btn-label').strip(), 'Duyệt ca (3)')
        page.click('#members-trigger')
        page.wait_for_timeout(360)
        self.assertTrue(page.eval_on_selector('#members-modal', 'el => el.open'))
        self.assertIn('Đỗ Mạnh Cường (Bạn)', page.text_content('#membersModalList'))
        self.assertIn('/ 125', page.text_content('#membersCountBadge'))
        page.screenshot(path=str(SHOTS_DIR / '02_members_modal.png'))
        page.click('#members-modal-close')
        page.wait_for_timeout(280)

        # Toggle Member View Preview (Screenshot 10) & open Task Mission Modal (Screenshot 2)
        page.click('#role-switch-member')
        page.wait_for_timeout(250)
        self.assertFalse(page.is_visible('#quick-actions-admin'))
        self.assertTrue(page.is_visible('#quick-actions-member'))
        page.screenshot(path=str(SHOTS_DIR / '03_member_mode_main.png'))
        page.click('#member-register-btn')
        page.wait_for_timeout(360)
        self.assertTrue(page.eval_on_selector('#task-mission-modal', 'el => el.open'))
        page.screenshot(path=str(SHOTS_DIR / '04_member_task_mission_modal.png'))
        page.click('#task-mission-close')
        page.wait_for_timeout(280)
        page.click('#role-switch-admin')
        page.wait_for_timeout(200)

        # Edit Profile Modal (Screenshot 5) -> ReadOnly studentId + 8 numbered fields -> Celebration Popup (Screenshot 13)
        page.click('#edit-profile-trigger')
        page.wait_for_timeout(360)
        self.assertTrue(page.eval_on_selector('#edit-profile-modal', 'el => el.open'))
        self.assertTrue(page.eval_on_selector('#input-studentId', 'el => el.readOnly'))
        page.fill('#input-phone', '0987654321')
        page.fill('#input-ice', '0911222333 <img src=x onerror=alert(1)>')
        page.screenshot(path=str(SHOTS_DIR / '05_edit_profile_modal.png'))
        page.click('#edit-modal-save')
        page.wait_for_timeout(560)
        self.assertTrue(page.eval_on_selector('#success-celebration-modal', 'el => el.open'))
        self.assertEqual(page.text_content('#celebration-title').strip(), 'Cập nhật hồ sơ thành công!')
        self.assertIn('<img src=x', page.text_content('#display-ice'))
        page.screenshot(path=str(SHOTS_DIR / '06_celebration_profile_popup.png'))
        page.click('#celebration-confirm-btn')
        page.wait_for_timeout(280)

        # Create Shift Modal (Screenshot 8) -> Submit -> Celebration Popup (Screenshot 3)
        page.click('#admin-create-shift-btn')
        page.wait_for_timeout(360)
        self.assertTrue(page.eval_on_selector('#create-shift-modal', 'el => el.open'))
        page.fill('#iptTaskTitle', 'Giải Bóng Đá Tứ Hùng Sinh Viên UHD')
        page.screenshot(path=str(SHOTS_DIR / '07_create_shift_modal.png'))
        page.click('#btnSubmitTask')
        page.wait_for_timeout(560)
        self.assertTrue(page.eval_on_selector('#success-celebration-modal', 'el => el.open'))
        self.assertEqual(page.text_content('#celebration-title').strip(), 'Tạo ca trực mới thành công!')
        page.screenshot(path=str(SHOTS_DIR / '08_celebration_create_shift_popup.png'))
        page.click('#celebration-confirm-btn')
        page.wait_for_timeout(280)

        # Approve Dispatch Modal (Screenshot 14) -> Approve All -> Celebration Popup (Screenshot 4)
        page.click('#admin-approve-btn')
        page.wait_for_timeout(360)
        self.assertTrue(page.eval_on_selector('#approve-shift-modal', 'el => el.open'))
        self.assertEqual(page.text_content('#approve-header-count').strip(), '3 đơn mới')
        page.screenshot(path=str(SHOTS_DIR / '09_approve_dispatch_modal.png'))
        page.click('#btnApproveAllRequests')
        page.wait_for_timeout(560)
        self.assertTrue(page.eval_on_selector('#success-celebration-modal', 'el => el.open'))
        self.assertEqual(page.text_content('#celebration-title').strip(), 'Đã phê duyệt 3 yêu cầu điều động!')
        self.assertEqual(page.text_content('#approve-btn-label').strip(), 'Duyệt ca (0)')
        page.screenshot(path=str(SHOTS_DIR / '10_celebration_dispatch_popup.png'))
        page.click('#celebration-confirm-btn')
        page.wait_for_timeout(280)

        # Settings & Account Modal (Screenshot 9) + 3D Tilt switch + Dark Login screenshot
        page.click('#settings-trigger')
        page.wait_for_timeout(360)
        self.assertTrue(page.eval_on_selector('#settings-modal', 'el => el.open'))
        page.screenshot(path=str(SHOTS_DIR / '11_settings_account_modal.png'))
        page.click('#theme-toggle-row')
        page.wait_for_timeout(420)
        self.assertEqual(page.evaluate('document.documentElement.dataset.theme'), 'dark')
        page.click('#logout-btn')
        page.wait_for_selector('#viewLoginContainer:not(.hidden)')
        page.wait_for_timeout(250)
        page.screenshot(path=str(SHOTS_DIR / '12_login_ocean_dark.png'))

        self.assertEqual(errors, [], f'Browser runtime errors: {errors}')
        ctx.close()


if __name__ == '__main__':
    unittest.main(verbosity=2)
