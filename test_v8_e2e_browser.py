# -*- coding: utf-8 -*-
"""
SportPass V8.7 — Real Account RBAC, Slim Settings, Accurate Triggers & End-to-End Browser Verification
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
SHOTS_DIR = Path(r'C:\Users\Admin\.gemini\antigravity\brain\f504c5bf-4fbe-4426-a4f4-b601c663d25d\shots_v87')

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

        # Verify hero card name has vertical padding & never truncates Vietnamese names at 375px
        h1_metrics = page.evaluate('''() => {
            const h1 = document.getElementById('card-heading');
            const cs = getComputedStyle(h1);
            const orig = h1.textContent;
            h1.textContent = 'NGUYỄN TRẦN HUYỀN HẠNH';
            const longOverflow = h1.scrollWidth > h1.clientWidth + 1;
            h1.textContent = orig;
            return {
                paddingTop: parseFloat(cs.paddingTop),
                lineHeightRatio: parseFloat(cs.lineHeight) / parseFloat(cs.fontSize),
                longOverflow
            };
        }''')
        self.assertGreaterEqual(h1_metrics['paddingTop'], 3.0)
        self.assertGreaterEqual(h1_metrics['lineHeightRatio'], 1.38)
        self.assertFalse(h1_metrics['longOverflow'], 'Long Vietnamese hero name truncated horizontally!')

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

        # 3. Edit profile (drag-out must not dismiss; reject colliding MSSV; save editable MSSV across reload & login)
        page.click('#edit-profile-trigger')
        page.wait_for_timeout(340)
        self.assertTrue(page.eval_on_selector('#edit-profile-modal', 'el => el.open'))
        box = page.locator('#input-studentId').bounding_box()
        page.mouse.move(box['x'] + 20, box['y'] + 20)
        page.mouse.down()
        page.mouse.move(10, 10)
        page.mouse.up()
        page.wait_for_timeout(200)
        self.assertTrue(page.eval_on_selector('#edit-profile-modal', 'el => el.open'), 'Drag-out closed modal!')
        self.assertFalse(page.eval_on_selector('#input-studentId', 'el => el.readOnly'))
        page.fill('#input-studentId', 'NDA0407')
        page.click('#edit-modal-save')
        page.wait_for_timeout(200)
        self.assertTrue(page.eval_on_selector('#edit-profile-modal', 'el => el.open'))
        self.assertIn('đã được dùng', page.text_content('#toast-text'))
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
        self.assertIsNotNone(page.evaluate('editingTaskId'))
        # Native <dialog closedby="any"> light-dismiss / .close() fires 'close' directly and must clear editingTaskId
        page.evaluate("document.getElementById('create-shift-modal').close()")
        page.wait_for_timeout(120)
        self.assertFalse(page.eval_on_selector('#create-shift-modal', 'el => el.open'))
        self.assertIsNone(page.evaluate('editingTaskId'))

        # 5. Approve dispatch modal: QR check-in validation + activity check-in + Approve All
        page.click('#admin-approve-btn')
        page.wait_for_timeout(340)
        self.assertEqual(page.text_content('#approve-header-count').strip(), '3 đơn mới')
        pill_single_line = page.evaluate('''() => {
            const el = document.getElementById('approve-header-count');
            const r = document.createRange();
            r.selectNodeContents(el);
            return r.getClientRects().length === 1 && getComputedStyle(el).whiteSpace === 'nowrap';
        }''')
        self.assertTrue(pill_single_line, '#approve-header-count wrapped onto multiple lines!')
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

        # Verify Admin -1 SH -> +1 SH works even after QR check-in (1 -> 0 -> 1)
        page.click('#members-trigger')
        page.wait_for_timeout(340)
        page.fill('#iptSearchMembers', 'NDA0407')
        page.wait_for_timeout(150)
        self.assertIn('+1 SH (1)', page.text_content('#membersModalList'))
        page.locator('#membersModalList button:has-text("-1 SH")').first.click()
        page.wait_for_timeout(120)
        self.assertIn('+1 SH (0)', page.text_content('#membersModalList'))
        page.locator('#membersModalList button:has-text("+1 SH")').first.click()
        page.wait_for_timeout(120)
        self.assertIn('+1 SH (1)', page.text_content('#membersModalList'))
        page.fill('#iptSearchMembers', '')
        page.click('#members-modal-close')
        page.wait_for_timeout(320)

        # 6. Slim Settings Modal (Theme + Password + Logout only) & Real Password Rejection
        page.click('#settings-trigger')
        page.wait_for_timeout(340)
        self.assertTrue(page.eval_on_selector('#settings-modal', 'el => el.open'))
        self.assertEqual(page.locator('#switchFaceId').count(), 0)
        self.assertEqual(page.locator('#switchTilt3d').count(), 0)
        self.assertEqual(page.locator('#lang-btn-en').count(), 0)
        settings_layout = page.evaluate('''() => {
            const sub = document.getElementById('settings-submeta');
            const title = document.querySelector('#theme-toggle-row .settings-row-title');
            const r = document.createRange();
            r.selectNodeContents(title);
            return {
                subTextOverflow: getComputedStyle(sub).textOverflow,
                subScrollOverflow: sub.scrollWidth > sub.clientWidth + 1,
                themeTitleLines: r.getClientRects().length
            };
        }''')
        self.assertNotEqual(settings_layout['subTextOverflow'], 'ellipsis')
        self.assertFalse(settings_layout['subScrollOverflow'], 'Settings submeta clipped horizontally!')
        self.assertEqual(settings_layout['themeTitleLines'], 1, 'Theme row title wrapped onto multiple lines!')
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

        # Member shift-bound QR modal & native <dialog closedby="any"> backdrop light-dismiss cleanup
        page.click('#qr-modal-trigger')
        page.wait_for_timeout(340)
        self.assertTrue(page.eval_on_selector('#qr-modal', 'el => el.open'))
        self.assertIn('#NDA0407', page.text_content('#qr-token-code'))
        self.assertIsNotNone(page.evaluate('qrTimerInterval'))
        page.screenshot(path=str(SHOTS_DIR / '12_qr_member_modal.png'))
        # Real backdrop pointer click at (10, 10) triggers closedby="any" light-dismiss -> 'close' cleanup
        page.mouse.click(10, 10)
        page.wait_for_timeout(360)
        self.assertFalse(page.eval_on_selector('#qr-modal', 'el => el.open'))
        self.assertIsNone(page.evaluate('qrTimerInterval'))

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

    def test_remote_sync_admin_role_counter_reconciliation_and_reduced_motion_reopen(self):
        ctx = self.browser.new_context(viewport={'width': 375, 'height': 812}, reduced_motion='reduce')
        server_shifts = {'val': 1}

        def real_gas_route(route):
            req_url = route.request.url
            if 'action=login' in req_url:
                route.fulfill(
                    status=200,
                    content_type='application/json',
                    body='{"success":true,"member":{"id":"LDH0912","hoTen":"Lương Đình Hiếu","lop":"K13.GDTC","boMon":"Ban Chủ Nhiệm","chucVu":"Trưởng ban cầu lông","sdt":"0787246014","ice":"0787246014","soCa":1,"soCaHoanThanh":1,"soCaSinhHoat":0,"isAdmin":true,"isShiftLeader":true,"studentCode":"LDH0912"}}'
                )
            elif 'action=adjustMemberShifts' in req_url:
                server_shifts['val'] += 1
                route.fulfill(
                    status=200,
                    content_type='application/json',
                    body=f'{{"success":true,"memberId":"LDH0912","newShifts":{server_shifts["val"]},"metric":"shift"}}'
                )
            elif 'action=syncAll' in req_url:
                v = server_shifts['val']
                route.fulfill(
                    status=200,
                    content_type='application/json',
                    body=f'{{"success":true,"member":{{"id":"LDH0912","hoTen":"Lương Đình Hiếu","lop":"K13.GDTC","boMon":"Ban Chủ Nhiệm","chucVu":"Trưởng ban cầu lông","sdt":"0787246014","ice":"0787246014","soCa":{v},"soCaHoanThanh":{v},"soCaSinhHoat":0,"isAdmin":true,"isShiftLeader":true,"studentCode":"LDH0912"}},"membersList":[{{"id":"LDH0912","hoTen":"Lương Đình Hiếu","lop":"K13.GDTC","boMon":"Ban Chủ Nhiệm","chucVu":"Trưởng ban cầu lông","sdt":"0787246014","ice":"0787246014","soCa":{v},"soCaHoanThanh":{v},"soCaSinhHoat":0,"isAdmin":true,"isShiftLeader":true,"studentCode":"LDH0912"}}],"tasks":[{{"id":"TASK_01","title":"Ca kiểm thử","location":"SVĐ","time":"14:00 - 18:00","quota":4,"category":"shift","joinedMembers":[],"assignedMembers":[],"waitlist":[],"checkedInMembers":[],"checkinLogs":[]}}],"swaps":[{{"id":"ADJUST_1","taskId":"SHIFT_ADJUST","fromMemberId":"LDH0912","status":"Điều chỉnh"}}],"leaves":[],"deletedTaskIds":[]}}'
                )
            else:
                route.fulfill(status=200, content_type='application/json', body='{"success":true}')

        ctx.route('**/*script.google.com/**', real_gas_route)
        ctx.route('**/*script.googleusercontent.com/**', real_gas_route)
        page = ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)

        page.goto(INDEX_URL, wait_until='domcontentloaded')
        page.fill('#iptUser', 'LDH0912')
        page.fill('#iptPass', '123456')
        page.click('#btnLoginSubmit')
        page.wait_for_selector('#viewMainAppContainer:not(.hidden)')
        page.wait_for_timeout(300)

        # 1. Remote-promoted Admin retains isAdmin after syncAll & Swaps preserves pending seed requests
        self.assertTrue(page.evaluate('currentUser.isAdmin'))
        self.assertTrue(page.is_visible('#role-badge'))
        self.assertGreaterEqual(page.evaluate('currentSwaps.filter(s => s.status === "pending").length'), 2)

        # 2. Online +1 Truc does NOT double count after subsequent syncAll
        page.evaluate('adjustMemberShiftCount("LDH0912", 1, "shift")')
        page.wait_for_timeout(200)
        self.assertEqual(page.text_content('#stat-shifts').strip(), '2')
        page.evaluate('syncRealtimeData()')
        page.wait_for_timeout(250)
        self.assertEqual(page.text_content('#stat-shifts').strip(), '2')

        # 3. Reduced-motion close -> immediate reopen preserves editingTaskId & qrTimerInterval
        reopen_shift = page.evaluate('''async () => {
            openCreateShiftModal('TASK_01');
            await closeCreateShiftModal();
            openCreateShiftModal('TASK_01');
            await new Promise(r => setTimeout(r, 60));
            const out = { open: document.getElementById('create-shift-modal').open, editingTaskId };
            await closeCreateShiftModal();
            return out;
        }''')
        self.assertTrue(reopen_shift['open'])
        self.assertEqual(reopen_shift['editingTaskId'], 'TASK_01')

        reopen_qr = page.evaluate('''async () => {
            openQrModal('TASK_01');
            await closeSheetDialog('qr-modal');
            openQrModal('TASK_01');
            await new Promise(r => setTimeout(r, 60));
            const out = { open: document.getElementById('qr-modal').open, timerActive: qrTimerInterval !== null };
            await closeSheetDialog('qr-modal');
            return out;
        }''')
        self.assertTrue(reopen_qr['open'])
        self.assertTrue(reopen_qr['timerActive'])

        # 4. Space-containing editable MSSV in '#MSSV · TASK' QR payload parses cleanly
        page.evaluate('''() => {
            const m = membersDirectory.find(x => x.id === 'LDH0912');
            if (m) m.studentCode = 'SV 0912';
            handleScanQrPayload('#SV 0912 · TASK_01');
        }''')
        page.wait_for_timeout(150)
        self.assertTrue(page.evaluate('currentTasks.find(t => t.id === "TASK_01").checkedInMembers.includes("LDH0912")'))

        self.assertEqual(errors, [], f'Browser runtime errors: {errors}')
        ctx.close()


if __name__ == '__main__':
    unittest.main(verbosity=2)
