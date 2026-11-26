# -*- coding: utf-8 -*-
"""
SportPass V8.8 — Fast Login, ID/MSSV Separation, Phone/MSSV Login, Register, Admin Add/Delete Member, Dropdowns & E2E Suite
"""

import json
import sys
import time
import unittest
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from playwright.sync_api import sync_playwright

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = Path(__file__).resolve().parent
INDEX_URL = (BASE_DIR / 'index.html').as_uri()
AUDITOR_DIR = Path(r'C:\Users\Admin\.gemini\config\skills\omni-app-studio\scripts')
SHOTS_DIR = Path(r'C:\Users\Admin\.gemini\antigravity\brain\f504c5bf-4fbe-4426-a4f4-b601c663d25d\shots_v88')

sys.path.insert(0, str(AUDITOR_DIR))
from live_dom_auditor import DOM_PROBE_JS, VIEWPORTS  # noqa: E402


class TestSportPassV88BrowserE2E(unittest.TestCase):
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

    def test_01_three_viewports_strict_dom_audit_and_single_close_modals(self):
        for vp_name, width, height in VIEWPORTS:
            ctx = self.browser.new_context(viewport={'width': width, 'height': height})
            self._attach_gas_mock(ctx)
            page = ctx.new_page()
            console_errors = []
            page_errors = []
            page.on('console', lambda m: console_errors.append(m.text) if m.type == 'error' else None)
            page.on('pageerror', lambda e: page_errors.append(str(e)))

            page.goto(INDEX_URL, wait_until='domcontentloaded')
            page.wait_for_timeout(180)
            if vp_name == 'mobile':
                page.screenshot(path=str(SHOTS_DIR / '00_login_streamlined_mobile.png'))
                # Verify streamlined login UI & zero redundant buttons per modal
                modal_close_counts = page.evaluate('''() => {
                    return Array.from(document.querySelectorAll('dialog.sp-sheet-dialog')).map(d => ({
                        id: d.id,
                        closes: Array.from(d.querySelectorAll('button')).filter(b => {
                            const txt = (b.textContent || '').trim().toLowerCase();
                            const aria = (b.getAttribute('aria-label') || '').toLowerCase();
                            return aria === 'đóng' || txt === 'đóng' || txt === 'hủy' || txt.startsWith('đóng ');
                        }).length
                    }));
                }''')
                for mc in modal_close_counts:
                    expected = 0 if mc['id'] == 'success-celebration-modal' else 1
                    self.assertEqual(mc['closes'], expected, f"Modal {mc['id']} has duplicate close buttons: {mc}")

            page.fill('#iptUser', 'DMC0806')
            page.fill('#iptPass', '123456')
            t0 = time.perf_counter()
            page.click('#btnLoginSubmit')
            page.wait_for_selector('#viewMainAppContainer:not(.hidden)')
            elapsed_ms = (time.perf_counter() - t0) * 1000
            self.assertLess(elapsed_ms, 850, f'Login transition on {vp_name} took too long: {elapsed_ms:.1f}ms')
            page.wait_for_timeout(650)

            metrics = page.evaluate(DOM_PROBE_JS)
            page.screenshot(path=str(SHOTS_DIR / f'01_main_admin_{vp_name}_{width}x{height}.png'))

            self.assertEqual(len(console_errors), 0, f'{vp_name} console errors: {console_errors}')
            self.assertEqual(len(page_errors), 0, f'{vp_name} page errors: {page_errors}')
            self.assertEqual(metrics['overflowPx'], 0, f'{vp_name} overflow: {metrics["overflowPx"]}')
            self.assertEqual(metrics['brokenImages'], [], f'{vp_name} broken imgs: {metrics["brokenImages"]}')
            self.assertEqual(metrics['sub24Targets'], [], f'{vp_name} sub-24px targets: {metrics["sub24Targets"]}')
            self.assertEqual(metrics['contrastFailures'], [], f'{vp_name} contrast failures: {metrics["contrastFailures"]}')

            ctx.close()

    def test_02_fast_login_phone_mssv_id_separation_and_profile_dropdowns(self):
        ctx = self.browser.new_context(viewport={'width': 375, 'height': 812})

        def delayed_gas_route(route):
            if 'action=login' in route.request.url:
                time.sleep(1.8)
            route.fulfill(status=200, content_type='application/json', body='{"success":true}')

        ctx.route('**/*script.google.com/**', delayed_gas_route)
        ctx.route('**/*script.googleusercontent.com/**', delayed_gas_route)
        page = ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)

        page.goto(INDEX_URL, wait_until='domcontentloaded')

        # 1. Verify Phone login works across +84 / 84 / spaces / missing leading zero formats and stays < 400ms despite slow GAS
        for phone_ident in ('+84862020080', '84 862 020 080', '862020080', '0862020080'):
            page.fill('#iptUser', phone_ident)
            page.fill('#iptPass', '123456')
            t0 = time.perf_counter()
            page.click('#btnLoginSubmit')
            page.wait_for_selector('#viewMainAppContainer:not(.hidden)')
            elapsed = (time.perf_counter() - t0) * 1000
            self.assertLess(elapsed, 450, f'Phone login ({phone_ident}) blocked UI: {elapsed:.1f}ms')
            self.assertEqual(page.text_content('#card-member-id').strip(), 'NDA0407')
            self.assertEqual(page.text_content('#card-mssv').strip(), 'Chưa cập nhật')
            self.assertEqual(page.text_content('#display-memberId').strip(), 'NDA0407')
            self.assertEqual(page.text_content('#display-studentId').strip(), 'Chưa cập nhật')

            page.click('#settings-trigger')
            page.wait_for_timeout(240)
            page.click('#logout-btn')
            page.wait_for_selector('#viewLoginContainer:not(.hidden)')

        # 2. Verify regular member selecting "Trưởng ban" does NOT elevate QR scanner or Admin rights
        page.fill('#iptUser', 'NDA0407')
        page.fill('#iptPass', '123456')
        page.click('#btnLoginSubmit')
        page.wait_for_selector('#viewMainAppContainer:not(.hidden)')
        page.click('#edit-profile-trigger')
        page.wait_for_timeout(260)
        self.assertTrue(page.eval_on_selector('#input-memberId', 'el => el.readOnly'))
        self.assertEqual(page.input_value('#input-studentId'), '')
        role_opts = page.eval_on_selector_all('#input-role option', 'opts => opts.map(o => o.value)')
        for required_role in ('Trưởng ban', 'Phó ban', 'Thành viên', 'Thư ký', 'Thủ quỹ'):
            self.assertIn(required_role, role_opts)
        dept_opts = page.eval_on_selector_all('#input-dutyArea option', 'opts => opts.length')
        self.assertEqual(dept_opts, 7)

        page.select_option('#input-dutyArea', 'Ban Nhân Sự')
        page.select_option('#input-role', 'Trưởng ban')
        page.fill('#input-studentId', '2210990407')
        page.screenshot(path=str(SHOTS_DIR / '03_edit_profile_dropdowns.png'))
        page.click('#edit-modal-save')
        page.wait_for_timeout(360)
        page.click('#celebration-confirm-btn')
        page.wait_for_timeout(220)
        self.assertFalse(page.evaluate('isAuthorizedScanner(currentUser)'), 'Editing chucVu illegally elevated scanner privilege!')
        self.assertEqual(page.text_content('#card-member-id').strip(), 'NDA0407')
        self.assertEqual(page.text_content('#card-mssv').strip(), '2210990407')

        # 3. Verify member CAN see shift & activity counts in #members-modal (without Admin Manage toggle)
        page.click('#members-trigger')
        page.wait_for_timeout(320)
        members_text = page.text_content('#membersModalList')
        self.assertIn('0 ca trực', members_text)
        self.assertIn('0 ca sinh hoạt', members_text)
        self.assertEqual(page.locator('#membersModalList button:has-text("Quản lý")').count(), 0)
        self.assertFalse(page.is_visible('#admin-add-member-btn'))
        page.screenshot(path=str(SHOTS_DIR / '10_member_view_members_stats.png'))
        page.click('#members-modal-close-x')
        page.wait_for_timeout(240)

        # Logout and log in using edited MSSV
        page.click('#settings-trigger')
        page.wait_for_timeout(220)
        page.click('#logout-btn')
        page.wait_for_selector('#viewLoginContainer:not(.hidden)')
        page.fill('#iptUser', '2210990407')
        page.fill('#iptPass', '123456')
        page.click('#btnLoginSubmit')
        page.wait_for_selector('#viewMainAppContainer:not(.hidden)')
        self.assertEqual(page.text_content('#card-member-id').strip(), 'NDA0407')

        self.assertEqual(errors, [], f'Browser runtime errors: {errors}')
        ctx.close()

    def test_03_self_register_admin_add_delete_member_and_remote_sync(self):
        ctx = self.browser.new_context(viewport={'width': 375, 'height': 812}, reduced_motion='reduce')
        recorded_actions = []
        remote_deleted_ids = []

        def full_gas_route(route):
            req_url = route.request.url
            parsed = urlparse(req_url)
            qs = parse_qs(parsed.query)
            act = qs.get('action', [''])[0]
            recorded_actions.append((act, qs))

            if act == 'registerMember':
                mem = json.loads(qs['member'][0])
                route.fulfill(status=200, content_type='application/json', body=json.dumps({'success': True, 'member': mem}))
            elif act == 'addMember':
                mem = json.loads(qs['member'][0])
                route.fulfill(status=200, content_type='application/json', body=json.dumps({'success': True, 'member': mem}))
            elif act == 'deleteMember':
                mid = qs['memberId'][0]
                if mid not in remote_deleted_ids:
                    remote_deleted_ids.append(mid)
                route.fulfill(status=200, content_type='application/json', body=json.dumps({'success': True, 'memberId': mid}))
            elif act == 'login':
                route.fulfill(
                    status=200,
                    content_type='application/json',
                    body='{"success":true,"member":{"id":"LDH0912","hoTen":"Lương Đình Hiếu","lop":"K13.GDTC","boMon":"Ban Chủ Nhiệm","chucVu":"Trưởng ban cầu lông","sdt":"0787246014","ice":"0787246014","soCa":1,"soCaHoanThanh":1,"soCaSinhHoat":0,"isAdmin":true,"isShiftLeader":true,"studentCode":""}}'
                )
            elif act == 'syncAll':
                req_mid = qs.get('memberId', [''])[0]
                members_payload = [
                    {
                        'id': 'LDH0912', 'hoTen': 'Lương Đình Hiếu', 'lop': 'K13.GDTC', 'boMon': 'Ban Chủ Nhiệm',
                        'chucVu': 'Trưởng ban cầu lông', 'sdt': '0787246014', 'ice': '0787246014',
                        'soCa': 1, 'soCaHoanThanh': 1, 'soCaSinhHoat': 0, 'isAdmin': True, 'isShiftLeader': True, 'studentCode': ''
                    }
                ]
                mem_self = members_payload[0] if req_mid == 'LDH0912' else None
                route.fulfill(
                    status=200,
                    content_type='application/json',
                    body=json.dumps({
                        'success': True,
                        'member': mem_self,
                        'membersList': members_payload,
                        'tasks': [],
                        'swaps': [],
                        'leaves': [],
                        'deletedTaskIds': [],
                        'deletedMemberIds': remote_deleted_ids
                    })
                )
            else:
                route.fulfill(status=200, content_type='application/json', body='{"success":true}')

        ctx.route('**/*script.google.com/**', full_gas_route)
        ctx.route('**/*script.googleusercontent.com/**', full_gas_route)
        page = ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)

        page.goto(INDEX_URL, wait_until='domcontentloaded')

        # 1. Self-registration flow
        page.click('#btnOpenRegisterModal')
        page.wait_for_timeout(150)
        self.assertTrue(page.eval_on_selector('#register-modal', 'el => el.open'))
        page.fill('#reg-fullname', 'Phạm Minh Khang')
        page.fill('#reg-dob', '15/08/2006')
        self.assertEqual(page.text_content('#reg-preview-id').strip(), 'PMK1508')
        page.fill('#reg-studentId', '2410990001')
        page.fill('#reg-phone', '0912345678')
        page.fill('#reg-faculty', 'K17-CNTT')
        page.select_option('#reg-department', 'Ban Truyền Thông')
        page.fill('#reg-password', 'pass999')
        page.fill('#reg-confirm-password', 'pass999')
        page.screenshot(path=str(SHOTS_DIR / '14_register_modal.png'))
        page.click('#btnSubmitRegister')
        page.wait_for_timeout(200)
        self.assertTrue(page.eval_on_selector('#success-celebration-modal', 'el => el.open'))
        page.click('#celebration-confirm-btn')
        page.wait_for_timeout(120)

        self.assertEqual(page.text_content('#card-member-id').strip(), 'PMK1508')
        self.assertEqual(page.text_content('#card-mssv').strip(), '2410990001')
        self.assertTrue(any(a[0] == 'registerMember' for a in recorded_actions))

        # Logout & re-login using normalized registered phone + custom password
        page.click('#settings-trigger')
        page.wait_for_timeout(120)
        page.click('#logout-btn')
        page.wait_for_selector('#viewLoginContainer:not(.hidden)')
        page.fill('#iptUser', '+84912345678')
        page.fill('#iptPass', 'pass999')
        page.click('#btnLoginSubmit')
        page.wait_for_selector('#viewMainAppContainer:not(.hidden)')
        self.assertEqual(page.text_content('#card-member-id').strip(), 'PMK1508')
        page.click('#settings-trigger')
        page.wait_for_timeout(120)
        page.click('#logout-btn')
        page.wait_for_selector('#viewLoginContainer:not(.hidden)')

        # 2. Admin login -> Add member -> Expand Manage drawer -> Delete newly registered member
        page.fill('#iptUser', 'DMC0806')
        page.fill('#iptPass', '123456')
        page.click('#btnLoginSubmit')
        page.wait_for_selector('#viewMainAppContainer:not(.hidden)')

        page.click('#members-trigger')
        page.wait_for_timeout(180)
        self.assertTrue(page.is_visible('#admin-add-member-btn'))
        page.click('#admin-add-member-btn')
        page.wait_for_timeout(150)
        self.assertTrue(page.eval_on_selector('#add-member-modal', 'el => el.open'))
        page.fill('#add-fullname', 'Trần Quốc Bảo')
        page.fill('#add-dob', '19/09/2006')
        self.assertEqual(page.input_value('#add-memberId'), 'TQB1909')
        page.fill('#add-phone', '0988777666')
        page.fill('#add-faculty', 'K17-GDTC')
        page.select_option('#add-department', 'Ban Nhân Sự')
        page.select_option('#add-role', 'Thư ký')
        page.screenshot(path=str(SHOTS_DIR / '15_admin_add_member_modal.png'))
        page.click('#btnSubmitAddMember')
        page.wait_for_timeout(180)
        self.assertTrue(any(a[0] == 'addMember' for a in recorded_actions))

        # Expand Manage drawer on PMK1508 & delete
        page.fill('#iptSearchMembers', 'PMK1508')
        page.wait_for_timeout(120)
        page.locator('#membersModalList button:has-text("Quản lý")').first.click()
        page.wait_for_timeout(120)
        page.screenshot(path=str(SHOTS_DIR / '16_admin_members_manage_drawer.png'))
        page.locator('#membersModalList button:has-text("Xóa thành viên")').first.click()
        page.wait_for_timeout(140)
        self.assertTrue(page.eval_on_selector('#confirm-delete-modal', 'el => el.open'))
        page.screenshot(path=str(SHOTS_DIR / '17_confirm_delete_member.png'))
        page.click('#btnConfirmDeleteMember')
        page.wait_for_timeout(180)

        self.assertTrue(any(a[0] == 'deleteMember' and a[1].get('memberId', [''])[0] == 'PMK1508' for a in recorded_actions))
        self.assertNotIn('PMK1508', page.text_content('#membersModalList'))
        # Self DMC0806 must NOT show delete button
        page.fill('#iptSearchMembers', 'DMC0806')
        page.wait_for_timeout(120)
        page.locator('#membersModalList button:has-text("Quản lý")').first.click()
        page.wait_for_timeout(120)
        self.assertEqual(page.locator('#membersModalList button:has-text("Xóa thành viên")').count(), 0)
        page.click('#members-modal-close-x')
        page.wait_for_timeout(140)

        # 3. Remote-promoted Admin & deletedMemberIds auto-kick verification
        page.click('#settings-trigger')
        page.wait_for_timeout(100)
        page.click('#logout-btn')
        page.wait_for_selector('#viewLoginContainer:not(.hidden)')
        page.fill('#iptUser', 'LDH0912')
        page.fill('#iptPass', '123456')
        page.click('#btnLoginSubmit')
        page.wait_for_selector('#viewMainAppContainer:not(.hidden)')
        page.wait_for_timeout(600)
        self.assertTrue(page.evaluate('currentUser.isAdmin'))
        self.assertTrue(page.is_visible('#role-badge'))

        # Simulate remote Admin deleting LDH0912 -> syncRealtimeData forces logout
        remote_deleted_ids.append('LDH0912')
        page.evaluate('syncRealtimeData()')
        page.wait_for_timeout(200)
        self.assertTrue(page.is_visible('#viewLoginContainer'))

        self.assertEqual(errors, [], f'Browser runtime errors: {errors}')
        ctx.close()


if __name__ == '__main__':
    unittest.main(verbosity=2)
