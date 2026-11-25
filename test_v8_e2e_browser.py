# -*- coding: utf-8 -*-
"""
SportPass V8.6 — Real Account RBAC, Slim Settings, Accurate Triggers & End-to-End Browser Verification
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
SHOTS_DIR = Path(r'C:\Users\Admin\.gemini\antigravity\brain\43faf2f5-110e-4b39-a9e0-3003b477edc9\shots_v87')

sys.path.insert(0, str(AUDITOR_DIR))
from live_dom_auditor import DOM_PROBE_JS, VIEWPORTS  # noqa: E402


class TestSportPassV86BrowserE2E(unittest.TestCase):
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
            page.wait_for_timeout(1200)

            metrics = page.evaluate(DOM_PROBE_JS)
            page.screenshot(path=str(SHOTS_DIR / f'01_main_admin_{vp_name}_{width}x{height}.png'))

            self.assertEqual(len(console_errors), 0, f'{vp_name} console errors: {console_errors}')
            self.assertEqual(len(page_errors), 0, f'{vp_name} page errors: {page_errors}')
            self.assertEqual(metrics['overflowPx'], 0, f'{vp_name} overflow: {metrics["overflowPx"]}')
            self.assertEqual(metrics['brokenImages'], [], f'{vp_name} broken imgs: {metrics["brokenImages"]}')
            self.assertEqual(metrics['sub24Targets'], [], f'{vp_name} sub-24px targets: {metrics["sub24Targets"]}')
            self.assertEqual(metrics['contrastFailures'], [], f'{vp_name} contrast failures: {metrics["contrastFailures"]}')

            if vp_name == 'mobile':
                page.click('#settings-trigger')
                page.wait_for_timeout(320)
                page.click('#logout-btn')
                page.wait_for_selector('#viewLoginContainer:not(.hidden)')
                page.fill('#iptUser', 'NDA0407')
                page.fill('#iptPass', '123456')
                page.click('#btnLoginSubmit')
                page.wait_for_selector('#viewMainAppContainer:not(.hidden)')
                page.wait_for_timeout(700)
                self.assertFalse(page.is_visible('#role-badge'))
                self.assertFalse(page.is_visible('#quick-actions-admin'))
                self.assertTrue(page.is_visible('#quick-actions-member'))
                m_metrics = page.evaluate(DOM_PROBE_JS)
                self.assertEqual(m_metrics['overflowPx'], 0)
                self.assertEqual(m_metrics['contrastFailures'], [])
                page.screenshot(path=str(SHOTS_DIR / '10_member_main_mobile.png'))

            ctx.close()

    def test_real_rbac_triggers_slim_settings_and_end_to_end_flows(self):
        ctx = self.browser.new_context(viewport={'width': 375, 'height': 812})
        self._attach_gas_mock(ctx)
        page = ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)

        page.goto(INDEX_URL, wait_until='domcontentloaded')

        # 1. Login as real Admin DMC0806
        page.fill('#iptUser', 'DMC0806')
        page.fill('#iptPass', '123456')
        page.click('#btnLoginSubmit')
        page.wait_for_selector('#viewMainAppContainer:not(.hidden)')
        page.wait_for_timeout(450)

        self.assertEqual(page.locator('#role-preview-dock').count(), 0)
        self.assertEqual(page.text_content('#role-badge').strip(), 'ADMIN')
        self.assertTrue(page.is_visible('#quick-actions-admin'))
        self.assertFalse(page.is_visible('#quick-actions-member'))

        # Verify stats card has 2 non-clickable metrics (no links) & no duplicate '+' on Tạo ca trực
        self.assertEqual(page.text_content('#admin-create-shift-btn').strip(), 'Tạo ca trực')
        self.assertEqual(page.locator('.stats-glass-card button, .stats-glass-card a').count(), 0)
        self.assertEqual(page.locator('.stats-glass-card .stat-lbl').all_text_contents(), ['Số ca hoàn thành', 'Số ca sinh hoạt'])
        page.click('#stat-shifts')
        page.click('#stat-activities')
        page.wait_for_timeout(150)
        self.assertEqual(page.locator('dialog[open]').count(), 0)

        # Verify hero card name has vertical padding so Vietnamese stacked diacritics are never clipped
        h1_metrics = page.evaluate('''() => {
            const h1 = document.getElementById('card-heading');
            const cs = getComputedStyle(h1);
            return {
                paddingTop: parseFloat(cs.paddingTop),
                lineHeightRatio: parseFloat(cs.lineHeight) / parseFloat(cs.fontSize)
            };
        }''')
        self.assertGreaterEqual(h1_metrics['paddingTop'], 3.0)
        self.assertGreaterEqual(h1_metrics['lineHeightRatio'], 1.38)

        # 2. Members directory modal (merged 118 unique members + multi-dept filter + boundary counter test)
        page.click('#members-trigger')
        page.wait_for_timeout(340)
        self.assertTrue(page.eval_on_selector('#members-modal', 'el => el.open'))
        self.assertIn('Đỗ Mạnh Cường (Bạn)', page.text_content('#membersModalList'))
        self.assertIn('/ 118', page.text_content('#membersCountBadge'))
        page.locator('#membersDeptFilterBar button:has-text("Truyền Thông")').click()
        page.wait_for_timeout(120)
        self.assertIn('Tào Thị Tuyết Linh', page.text_content('#membersModalList'))
        page.locator('#membersDeptFilterBar button:has-text("Tất cả")').click()
        page.wait_for_timeout(120)
        # Boundary test: decrementing at 0 never goes negative
        page.locator('#membersModalList button:has-text("-1 SH")').first.click()
        page.wait_for_timeout(120)
        self.assertEqual(page.text_content('#stat-activities').strip(), '0')
        page.screenshot(path=str(SHOTS_DIR / '02_members_modal.png'))
        page.click('#members-modal-close')
        page.wait_for_timeout(320)

        # 3. Edit profile (including editable MSSV) persists across full page reload & works for login/search
        page.click('#edit-profile-trigger')
        page.wait_for_timeout(340)
        self.assertTrue(page.eval_on_selector('#edit-profile-modal', 'el => el.open'))
        self.assertFalse(page.eval_on_selector('#input-studentId', 'el => el.readOnly'))
        page.fill('#input-studentId', '21103100806')
        page.fill('#input-faculty', 'K13.GDTC-PRO')
        page.fill('#input-phone', '0987654321')
        page.fill('#input-ice', '0911222333 <img src=x onerror=alert(1)>')
        page.screenshot(path=str(SHOTS_DIR / '03_edit_profile_modal.png'))
        page.click('#edit-modal-save')
        page.wait_for_timeout(520)
        self.assertTrue(page.eval_on_selector('#success-celebration-modal', 'el => el.open'))
        self.assertIn('<img src=x', page.text_content('#display-ice'))
        self.assertEqual(page.text_content('#card-mssv').strip(), '21103100806')
        self.assertEqual(page.text_content('#display-studentId').strip(), '21103100806')
        page.screenshot(path=str(SHOTS_DIR / '04_celebration_profile_popup.png'))
        page.click('#celebration-confirm-btn')
        page.wait_for_timeout(320)

        page.reload(wait_until='domcontentloaded')
        page.wait_for_selector('#viewMainAppContainer:not(.hidden)')
        page.wait_for_timeout(350)
        self.assertEqual(page.text_content('#display-studentId').strip(), '21103100806')
        self.assertEqual(page.text_content('#card-mssv').strip(), '21103100806')
        self.assertEqual(page.text_content('#display-phone').strip(), '0987654321')
        self.assertEqual(page.text_content('#display-faculty').strip(), 'K13.GDTC-PRO')
        page.locator('#hero-interactive-card').screenshot(path=str(SHOTS_DIR / '01b_hero_card_admin_accents.png'))

        # 4. Create shift modal (unique leader options + Ca sinh hoạt category + clean time on edit)
        page.click('#admin-create-shift-btn')
        page.wait_for_timeout(340)
        self.assertTrue(page.eval_on_selector('#create-shift-modal', 'el => el.open'))
        leader_vals = page.eval_on_selector_all('#selTaskLeader option', 'opts => opts.map(o => o.value)')
        self.assertEqual(len(leader_vals), len(set(leader_vals)), f'Duplicate leader options: {leader_vals}')
        self.assertEqual(page.input_value('#iptTaskLocation'), 'SVĐ Trung Tâm')
        self.assertEqual(page.input_value('#iptTaskTime'), '13:30 - 17:30')
        page.fill('#iptTaskTitle', 'Sinh hoạt Thể lực Thứ Năm CLB')
        page.click('#task-cat-activity')
        page.screenshot(path=str(SHOTS_DIR / '05_create_shift_modal.png'))
        page.click('#btnSubmitTask')
        page.wait_for_timeout(520)
        self.assertTrue(page.eval_on_selector('#success-celebration-modal', 'el => el.open'))
        page.click('#celebration-confirm-btn')
        page.wait_for_timeout(320)

        # Verify #admin-approve-btn opens #approve-shift-modal, Shifts tab shows new activity card & edits cleanly
        page.click('#admin-approve-btn')
        page.wait_for_timeout(340)
        self.assertTrue(page.eval_on_selector('#approve-shift-modal', 'el => el.open'))
        page.click('#approve-tab-shifts')
        page.wait_for_timeout(200)
        self.assertIn('Ca sinh hoạt', page.text_content('#approve-cards-container'))
        page.locator('#approve-cards-container button:has-text("Sửa")').first.click()
        page.wait_for_timeout(420)
        self.assertTrue(page.eval_on_selector('#create-shift-modal', 'el => el.open'))
        self.assertEqual(page.input_value('#iptTaskTime'), '13:30 - 17:30')
        self.assertEqual(page.input_value('#iptTaskCategory'), 'activity')
        page.click('#create-shift-cancel')
        page.wait_for_timeout(320)

        # 5. Approve dispatch modal: QR check-in validation + activity check-in + Approve All
        page.click('#admin-approve-btn')
        page.wait_for_timeout(340)
        self.assertEqual(page.text_content('#approve-header-count').strip(), '3 đơn mới')
        page.screenshot(path=str(SHOTS_DIR / '06_approve_dispatch_modal.png'))

        page.click('#approve-tab-scanner')
        page.wait_for_timeout(220)
        # Reject unknown bogus member ID
        page.fill('#iptManualCheckinId', 'BOGUS999')
        page.click('#btnManualCheckin')
        page.wait_for_timeout(150)
        self.assertNotIn('BOGUS999', page.text_content('#scannerCheckedInList'))
        # Check-in NDA0407 on newly created activity session (selected first in selScanTaskId)
        page.fill('#iptManualCheckinId', 'NDA0407')
        page.click('#btnManualCheckin')
        page.wait_for_timeout(200)
        self.assertIn('NDA0407', page.text_content('#scannerCheckedInList'))

        page.click('#approve-tab-swap')
        page.wait_for_timeout(200)
        page.click('#btnApproveAllRequests')
        page.wait_for_timeout(520)
        self.assertTrue(page.eval_on_selector('#success-celebration-modal', 'el => el.open'))
        self.assertEqual(page.text_content('#approve-btn-label').strip(), 'Duyệt ca (0)')
        swapped_ok = page.evaluate('window.currentTasks.find(t => t.id === "TASK_01")?.joinedMembers?.includes("DMC0806")')
        self.assertTrue(swapped_ok)
        page.screenshot(path=str(SHOTS_DIR / '07_celebration_dispatch_popup.png'))
        page.click('#celebration-confirm-btn')
        page.wait_for_timeout(320)

        # 6. Slim Settings Modal (Theme + Password + Logout only) & Real Password Rejection
        page.click('#settings-trigger')
        page.wait_for_timeout(340)
        self.assertTrue(page.eval_on_selector('#settings-modal', 'el => el.open'))
        self.assertEqual(page.locator('#switchFaceId').count(), 0)
        self.assertEqual(page.locator('#switchTilt3d').count(), 0)
        self.assertEqual(page.locator('#lang-btn-en').count(), 0)
        page.screenshot(path=str(SHOTS_DIR / '08_settings_slim_modal.png'))

        page.click('#theme-btn-dark')
        page.wait_for_timeout(250)
        self.assertEqual(page.evaluate('document.documentElement.dataset.theme'), 'dark')
        page.click('#theme-btn-light')
        page.wait_for_timeout(250)
        self.assertEqual(page.evaluate('document.documentElement.dataset.theme'), 'light')

        page.click('#security-password-row')
        page.wait_for_timeout(420)
        self.assertTrue(page.eval_on_selector('#password-modal', 'el => el.open'))
        page.screenshot(path=str(SHOTS_DIR / '09_password_modal.png'))
        page.fill('#iptCurrentPassword', '123456')
        page.fill('#iptNewPassword', '654321')
        page.fill('#iptConfirmPassword', '654321')
        page.click('#btnSavePassword')
        page.wait_for_timeout(520)
        self.assertTrue(page.eval_on_selector('#success-celebration-modal', 'el => el.open'))
        page.click('#celebration-confirm-btn')
        page.wait_for_timeout(320)

        page.click('#settings-trigger')
        page.wait_for_timeout(340)
        page.click('#logout-btn')
        page.wait_for_selector('#viewLoginContainer:not(.hidden)')

        # Verify old '123456' is rejected after changing password
        page.fill('#iptUser', 'DMC0806')
        page.fill('#iptPass', '123456')
        page.click('#btnLoginSubmit')
        page.wait_for_timeout(250)
        self.assertTrue(page.is_visible('#viewLoginContainer'))

        # Verify new '654321' + editable MSSV '21103100806' logs in cleanly, then log out for Member test
        page.fill('#iptUser', '21103100806')
        page.fill('#iptPass', '654321')
        page.click('#btnLoginSubmit')
        page.wait_for_selector('#viewMainAppContainer:not(.hidden)')
        self.assertEqual(page.text_content('#card-mssv').strip(), '21103100806')
        page.click('#settings-trigger')
        page.wait_for_timeout(340)
        page.click('#logout-btn')
        page.wait_for_selector('#viewLoginContainer:not(.hidden)')

        # 7. Real Member Account Login & Workflows (NDA0407 has 1 activity from QR check-in, 0 duty shifts)
        page.fill('#iptUser', 'NDA0407')
        page.fill('#iptPass', '123456')
        page.click('#btnLoginSubmit')
        page.wait_for_selector('#viewMainAppContainer:not(.hidden)')
        page.wait_for_timeout(450)
        self.assertFalse(page.is_visible('#role-badge'))
        self.assertFalse(page.is_visible('#quick-actions-admin'))
        self.assertTrue(page.is_visible('#quick-actions-member'))
        self.assertEqual(page.text_content('#stat-shifts').strip(), '0')
        self.assertEqual(page.text_content('#stat-activities').strip(), '1')
        page.locator('#hero-interactive-card').screenshot(path=str(SHOTS_DIR / '10b_hero_card_member_accents.png'))

        # Member register button opens Task Mission modal
        page.click('#member-register-btn')
        page.wait_for_timeout(340)
        self.assertTrue(page.eval_on_selector('#task-mission-modal', 'el => el.open'))
        target_vals = page.eval_on_selector_all('#selMissionTargetMember option', 'opts => opts.map(o => o.value).filter(Boolean)')
        self.assertEqual(len(target_vals), len(set(target_vals)), 'Duplicate target member options found')
        page.locator('#mission-panel-shifts button:has-text("Đăng ký nhận ca này")').first.click()
        page.wait_for_timeout(200)
        page.click('#mission-tab-swap')
        page.wait_for_timeout(200)
        page.fill('#iptMissionReason', 'Trung lich thi hoc ky')
        page.click('#btnSubmitMemberSwap')
        page.wait_for_timeout(340)

        page.click('#member-swap-btn')
        page.wait_for_timeout(340)
        self.assertIn('Chờ duyệt', page.text_content('#memberMyRequestsList'))
        page.screenshot(path=str(SHOTS_DIR / '11_member_mission_modal.png'))
        page.locator('#memberMyRequestsList button:has-text("Hủy đơn")').first.click()
        page.wait_for_timeout(180)
        page.click('#task-mission-close')
        page.wait_for_timeout(320)

        # Member shift-bound QR modal
        page.click('#qr-modal-trigger')
        page.wait_for_timeout(340)
        self.assertTrue(page.eval_on_selector('#qr-modal', 'el => el.open'))
        self.assertIn('#NDA0407', page.text_content('#qr-token-code'))
        page.screenshot(path=str(SHOTS_DIR / '12_qr_member_modal.png'))
        page.click('#qr-modal-close')
        page.wait_for_timeout(320)

        # Dark theme main & login screen audit
        page.click('#settings-trigger')
        page.wait_for_timeout(340)
        page.click('#theme-btn-dark')
        page.wait_for_timeout(240)
        page.click('#settings-modal-close')
        page.wait_for_timeout(320)
        dark_metrics = page.evaluate(DOM_PROBE_JS)
        self.assertEqual(dark_metrics['overflowPx'], 0)
        self.assertEqual(dark_metrics['sub24Targets'], [])
        self.assertEqual(dark_metrics['contrastFailures'], [], f'Dark mode contrast failures: {dark_metrics["contrastFailures"]}')
        page.screenshot(path=str(SHOTS_DIR / '13a_member_main_dark.png'))
        page.click('#settings-trigger')
        page.wait_for_timeout(340)
        page.click('#logout-btn')
        page.wait_for_selector('#viewLoginContainer:not(.hidden)')
        page.wait_for_timeout(220)
        page.screenshot(path=str(SHOTS_DIR / '13_login_ocean_dark.png'))

        self.assertEqual(errors, [], f'Browser runtime errors: {errors}')
        ctx.close()


if __name__ == '__main__':
    unittest.main(verbosity=2)
