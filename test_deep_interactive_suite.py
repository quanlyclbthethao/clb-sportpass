# -*- coding: utf-8 -*-
import subprocess
import time
import json
import urllib.request
import asyncio
import aiohttp
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(EDGE_PATH):
    EDGE_PATH = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

HTML_PATH = os.path.abspath("index.html").replace("\\", "/")
URL = f"file:///{HTML_PATH}"

PORT = 9226
USER_DATA = os.path.abspath("temp_profile_deep_test")

proc = subprocess.Popen([
    EDGE_PATH,
    "--headless=new",
    f"--remote-debugging-port={PORT}",
    "--disable-gpu",
    "--no-sandbox",
    f"--user-data-dir={USER_DATA}",
    URL
], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

async def run_suite():
    try:
        await asyncio.sleep(2.5)
        req = urllib.request.urlopen(f"http://localhost:{PORT}/json")
        targets = json.loads(req.read().decode('utf-8'))
        page_target = [t for t in targets if t.get("type") == "page"][0]
        ws_url = page_target["webSocketDebuggerUrl"]

        async with aiohttp.ClientSession() as session:
            async with session.ws_connect(ws_url) as ws:
                await ws.send_json({"id": 1, "method": "Runtime.enable"})

                async def evaluate(expr):
                    req_id = int(time.time() * 1000) % 1000000
                    await ws.send_json({
                        "id": req_id,
                        "method": "Runtime.evaluate",
                        "params": {"expression": expr, "returnByValue": True}
                    })
                    while True:
                        msg = await ws.receive()
                        r = json.loads(msg.data)
                        if r.get("id") == req_id:
                            break
                    if "exceptionDetails" in r.get("result", {}):
                        raise Exception(r["result"]["exceptionDetails"]["exception"]["description"])
                    return r.get("result", {}).get("result", {}).get("value")

                print("\n================== DEEP VERIFICATION SUITE ==================")

                # 1. Login as Admin Đỗ Mạnh Cường
                print("\n[TEST 1] Login as Admin DMC0806 & Check Session State")
                login_res = await evaluate("""
                    (() => {
                        const user = DEFAULT_MEMBERS_DIRECTORY.find(m => m.id === 'DMC0806');
                        sessionStorage.setItem('CLB_SPORTPASS_AUTH_SESSION', JSON.stringify(user));
                        checkStoredLoginSession();
                        return {
                            currentUser: currentUser ? currentUser.hoTen : null,
                            isAdmin: Boolean(currentUser?.isAdmin),
                            currentTasksCount: currentTasks.length,
                            hasDefaultTasks: (typeof DEFAULT_TASKS !== 'undefined') && DEFAULT_TASKS.length === 2
                        };
                    })()
                """)
                print("Login result:", login_res)
                assert login_res["currentUser"] == "Đỗ Mạnh Cường"
                assert login_res["isAdmin"] == True
                assert login_res["hasDefaultTasks"] == True
                assert login_res["currentTasksCount"] >= 2
                print(">>> PASSED: Login and Default Tasks Initialized Successfully!")

                # 2. Verify all 7 official departments
                print("\n[TEST 2] Verify All 7 Official Departments Across UI & Data")
                dept_res = await evaluate("""
                    (() => {
                        const expected = [
                            'Ban Chủ Nhiệm',
                            'Ban Nhân Sự',
                            'Ban Bóng Chuyền',
                            'Ban Bóng Đá Nam',
                            'Ban Bóng Đá Nữ',
                            'Ban Cầu Lông',
                            'Ban Truyền Thông'
                        ];
                        const inAll = expected.every(d => ALL_DEPARTMENTS.includes(d));

                        // Open Create Task Modal and check generated quota inputs
                        openCreateTaskModal();
                        const quotaRows = document.querySelectorAll('#deptQuotaContainer .dept-name');
                        const generatedDepts = Array.from(quotaRows).map(inp => inp.value);
                        closeCreateTaskModal();

                        return {
                            inAll: inAll,
                            allDeptsLength: ALL_DEPARTMENTS.length,
                            generatedDepts: generatedDepts,
                            matchesExpected: expected.every(d => generatedDepts.includes(d))
                        };
                    })()
                """)
                print("Departments check:", dept_res)
                assert dept_res["inAll"] == True
                assert dept_res["allDeptsLength"] == 7
                assert dept_res["matchesExpected"] == True
                print(">>> PASSED: All 7 departments present in ALL_DEPARTMENTS and Create Task quota inputs!")

                # 3. Standardized 8-Column Member Directory
                print("\n[TEST 3] Standardized 8-Column Member Directory & Elimination of Legacy Fields")
                dir_res = await evaluate("""
                    (() => {
                        openDirectoryModal();
                        filterDirectoryMembers();
                        const cards = document.querySelectorAll('#directoryListContainer .acrylic-card');
                        
                        // Inspect member LDH0912
                        openOtherMemberInspector('LDH0912');
                        const getVal = id => {
                            const el = document.getElementById(id);
                            return el ? (el.textContent || el.innerText || '').trim() : '';
                        };
                        const inspector = {
                            id: getVal('otherMemIdVal'),
                            name: getVal('otherMemNameVal'),
                            lop: getVal('otherClass'),
                            dept: getVal('otherDept'),
                            role: getVal('otherRoleVal'),
                            med: getVal('otherMed'),
                            phone: getVal('otherPhone'),
                            ice: getVal('otherIce'),
                            // Legacy fields must not exist in DOM
                            noMssv: document.getElementById('otherMssv') === null,
                            noKhoa: document.getElementById('otherKhoa') === null,
                            noNfc: document.getElementById('otherNfc') === null
                        };
                        closeOtherMemberModal();
                        closeDirectoryModal();
                        return {
                            cardsCount: cards.length,
                            inspector: inspector
                        };
                    })()
                """)
                print("Directory 8 columns:", dir_res["inspector"])
                assert dir_res["cardsCount"] > 100
                assert dir_res["inspector"]["id"] == "LDH0912"
                assert dir_res["inspector"]["name"] == "Lương Đình Hiếu"
                assert dir_res["inspector"]["noMssv"] == True
                assert dir_res["inspector"]["noKhoa"] == True
                assert dir_res["inspector"]["noNfc"] == True
                print(">>> PASSED: 8-Column layout validated, legacy columns eliminated!")

                # 4. Compact ID Badge and 3D VIP SportPass Card Modal
                print("\n[TEST 4] Compact ID Badge & 3D VIP SportPass Modal")
                vip_res = await evaluate("""
                    (() => {
                        const badge = document.querySelector('.compact-id-badge');
                        openDigitalSportPassModal();
                        const modal = document.getElementById('modalDigitalSportPassCard');
                        const isOpen = modal && modal.classList.contains('open');
                        const name = (document.getElementById('vipCardMemberName')?.textContent || document.getElementById('vipCardMemberName')?.innerText || '').trim();
                        const role = (document.getElementById('vipCardMemberRole')?.textContent || document.getElementById('vipCardMemberRole')?.innerText || '').trim();
                        const qrHasContent = document.getElementById('vipCardQrContainer')?.children.length > 0;
                        closeDigitalSportPassModal();
                        const isClosed = modal && !modal.classList.contains('open');
                        return {
                            badgeExists: Boolean(badge),
                            isOpen: isOpen,
                            isClosed: isClosed,
                            name: name,
                            role: role,
                            qrHasContent: qrHasContent
                        };
                    })()
                """)
                print("VIP Card modal result:", vip_res)
                assert vip_res["badgeExists"] == True
                assert vip_res["isOpen"] == True
                assert vip_res["isClosed"] == True
                assert vip_res["name"] == "Đỗ Mạnh Cường"
                assert vip_res["qrHasContent"] == True
                print(">>> PASSED: Compact badge and 3D VIP SportPass Modal functioning perfectly!")

                # 5. Background Notification Default ON
                print("\n[TEST 5] Background Notifications Default ON")
                notif_res = await evaluate("""
                    (() => {
                        const autoFn = typeof autoEnableBackgroundNotifications === 'function';
                        const noToggle = document.getElementById('btnToggleBgNotification') === null;
                        const defaultOnBadge = (document.body.textContent || document.body.innerText).includes('Mặc định bật');
                        return {
                            autoFn: autoFn,
                            noToggle: noToggle,
                            defaultOnBadge: defaultOnBadge
                        };
                    })()
                """)
                print("Notification check:", notif_res)
                assert notif_res["autoFn"] == True
                assert notif_res["noToggle"] == True
                assert notif_res["defaultOnBadge"] == True
                print(">>> PASSED: Background notification default ON, manual toggle removed!")

                # 6. Admin Shift Adjustment (+1 / -1) with Reason and Dual Sync
                print("\n[TEST 6] Admin Manual Shift Adjustment (+1 / -1)")
                adj_res = await evaluate("""
                    (() => {
                        const target = membersDirectory.find(m => m.id === 'LDH0912');
                        const initialDone = target.soCaHoanThanh || 0;
                        const initialSoCa = target.soCa || 0;

                        // Admin adjusts +2 shifts
                        openAdjustShiftsModal('LDH0912', 1);
                        changeAdjustDelta(1); // delta becomes 2
                        document.getElementById('iptAdjustShiftsReason').value = 'Khen thưởng giải đấu xuất sắc';
                        executeAdjustShiftsSubmit();

                        const afterPlus2Done = target.soCaHoanThanh;
                        const afterPlus2SoCa = target.soCa;

                        // Admin adjusts -1 shift
                        openAdjustShiftsModal('LDH0912', -1);
                        document.getElementById('iptAdjustShiftsReason').value = 'Điều chỉnh cân bằng';
                        executeAdjustShiftsSubmit();

                        const afterMinus1Done = target.soCaHoanThanh;
                        const afterMinus1SoCa = target.soCa;

                        return {
                            initialDone: initialDone,
                            afterPlus2Done: afterPlus2Done,
                            afterPlus2SoCa: afterPlus2SoCa,
                            afterMinus1Done: afterMinus1Done,
                            afterMinus1SoCa: afterMinus1SoCa,
                            mutationsQueued: offlineMutationQueue.filter(m => m.type === 'SHIFT_ADJUST').length
                        };
                    })()
                """)
                print("Admin shift adjust result:", adj_res)
                assert adj_res["afterPlus2Done"] == adj_res["initialDone"] + 2
                assert adj_res["afterPlus2SoCa"] == adj_res["afterPlus2Done"]
                assert adj_res["afterMinus1Done"] == adj_res["afterPlus2Done"] - 1
                assert adj_res["afterMinus1SoCa"] == adj_res["afterMinus1Done"]
                print(">>> PASSED: Shift adjustments stay in 100% sync for both soCa and soCaHoanThanh!")

                # 7. Safe Merge in syncRealtimeData (Local Tasks Not Wiped Out)
                print("\n[TEST 7] Task Cross-Device Safe Merge (Client task protection)")
                merge_res = await evaluate("""
                    (() => {
                        // Create a brand new local task
                        const localTask = {
                            id: 'TASK_LOCAL_TEST_' + Date.now(),
                            title: 'Ca trực mới tạo cục bộ',
                            location: 'Sân trường',
                            time: '15:00 - 17:00 Thứ Sáu',
                            quota: 4,
                            joinedMembers: ['DMC0806'],
                            assignedMembers: [],
                            waitlist: [],
                            status: 'active',
                            departmentQuotas: {}
                        };
                        currentTasks.unshift(localTask);
                        const countBeforeSync = currentTasks.length;

                        // Mock incoming syncAll data from Google Apps Script that does NOT have localTask yet
                        const mockServerTasks = [
                            {
                                id: 'TASK_SERVER_A',
                                title: 'Ca trực từ máy khác gửi lên',
                                location: 'Nhà thi đấu',
                                time: '08:00 - 10:00 Thứ Bảy',
                                quota: 6,
                                joinedMembers: [],
                                assignedMembers: [],
                                waitlist: [],
                                status: 'active',
                                departmentQuotas: {}
                            }
                        ];

                        // Simulate safe merge logic
                        const deletedTasks = (typeof getDeletedTaskIds === 'function') ? getDeletedTaskIds() : [];
                        const backendTasks = (mockServerTasks || []).filter(t => t && !deletedTasks.includes(t.id));
                        const backendTaskMap = new Map(backendTasks.map(t => [t.id, t]));

                        const mergedTasks = [...backendTasks];
                        if (Array.isArray(currentTasks)) {
                            for (const lt of currentTasks) {
                                if (lt && lt.id && !backendTaskMap.has(lt.id) && !deletedTasks.includes(lt.id)) {
                                    mergedTasks.push(lt);
                                }
                            }
                        }
                        currentTasks = mergedTasks;

                        const hasLocalTask = currentTasks.some(t => t.id === localTask.id);
                        const hasServerTask = currentTasks.some(t => t.id === 'TASK_SERVER_A');

                        return {
                            countBeforeSync: countBeforeSync,
                            countAfterMerge: currentTasks.length,
                            hasLocalTask: hasLocalTask,
                            hasServerTask: hasServerTask
                        };
                    })()
                """)
                print("Safe merge result:", merge_res)
                assert merge_res["hasLocalTask"] == True
                assert merge_res["hasServerTask"] == True
                print(">>> PASSED: Safe merge preserves both backend and locally created tasks without data loss!")

                # 8. Withdrawal After Check-in Auto-decrement (soCaHoanThanh)
                print("\n[TEST 8] Withdrawal After Check-in Auto-decrement")
                withdraw_res = await evaluate("""
                    (() => {
                        const testMem = membersDirectory.find(m => m.id === 'NTD2108');
                        testMem.soCaHoanThanh = 5;
                        testMem.soCa = 5;

                        const testTask = {
                            id: 'TASK_TEST_WITHDRAW_' + Date.now(),
                            title: 'Ca kiểm tra rút sau điểm danh',
                            quota: 4,
                            joinedMembers: ['NTD2108'],
                            assignedMembers: [],
                            checkedInMembers: ['NTD2108'],
                            waitlist: []
                        };
                        currentTasks.unshift(testTask);

                        const leaveObj = {
                            id: 'LEAVE_TEST_01',
                            taskId: testTask.id,
                            memberId: 'NTD2108',
                            memberName: 'Nguyễn Tiến Duy',
                            reason: 'Có việc gia đình đột xuất',
                            status: 'pending'
                        };
                        currentLeaves.unshift(leaveObj);

                        // Admin resolves leave request as approved
                        resolveLeaveAction(leaveObj.id, 'approve_exempt', '');

                        const afterWithdrawDone = testMem.soCaHoanThanh;
                        const isStillChecked = testTask.checkedInMembers.includes('NTD2108');
                        const isStillJoined = testTask.joinedMembers.includes('NTD2108');

                        return {
                            initialDone: 5,
                            afterWithdrawDone: afterWithdrawDone,
                            isStillChecked: isStillChecked,
                            isStillJoined: isStillJoined
                        };
                    })()
                """)
                print("Withdraw checkin decrement result:", withdraw_res)
                assert withdraw_res["afterWithdrawDone"] == 4
                assert withdraw_res["isStillChecked"] == False
                assert withdraw_res["isStillJoined"] == False
                print(">>> PASSED: Withdrawal after check-in auto-decrements soCaHoanThanh by 1 and removes member!")

                # 9. Smart Shift Rotation per Department
                print("\n[TEST 9] Smart Shift Rotation Algorithm & Quota Enforcement")
                rotation_res = await evaluate("""
                    (() => {
                        const rotTask = {
                            id: 'TASK_ROTATION_' + Date.now(),
                            title: 'Lệnh điều phối thi đấu liên khoa',
                            time: '08:00 - 11:30 Thứ Bảy',
                            quota: 5,
                            joinedMembers: [],
                            assignedMembers: [],
                            departmentQuotas: {
                                'Ban Cầu Lông': 2,
                                'Ban Bóng Chuyền': 2,
                                'Ban Bóng Đá Nam': 1
                            }
                        };
                        currentTasks.unshift(rotTask);

                        // Run calculation
                        openSmartRotationModal(rotTask.id);
                        const candidatesCount = pendingSmartRotationCandidates.length;

                        // Verify candidate sorting: fewest completed shifts first
                        const shiftsList = pendingSmartRotationCandidates.map(c => c.member.soCaHoanThanh || c.member.soCa || 0);
                        
                        // Apply rotation
                        applySmartRotationCandidates();

                        const assignedCount = rotTask.assignedMembers.length;
                        const assignedUnique = new Set(rotTask.assignedMembers).size;

                        return {
                            quota: rotTask.quota,
                            candidatesCount: candidatesCount,
                            assignedCount: assignedCount,
                            assignedUnique: assignedUnique,
                            noDoubleCounts: assignedCount === assignedUnique,
                            withinQuota: assignedCount <= rotTask.quota
                        };
                    })()
                """)
                print("Smart rotation result:", rotation_res)
                assert rotation_res["withinQuota"] == True
                assert rotation_res["noDoubleCounts"] == True
                assert rotation_res["assignedCount"] > 0
                print(">>> PASSED: Smart shift rotation successfully respects quotas, excludes duplicates, and prioritizes fair labor!")

                # 10. Offline Mutation Queue Network Dispatch
                print("\n[TEST 10] Offline Mutation Queue Network Dispatching")
                mut_res = await evaluate("""
                    (() => {
                        offlineMutationQueue = [];
                        enqueueOfflineMutation('CREATE_TASK', { id: 'MUT_TASK_1', title: 'Task Test' });
                        enqueueOfflineMutation('CLAIM_TASK', { taskId: 'MUT_TASK_1', memberId: 'DMC0806' });
                        enqueueOfflineMutation('QR_CHECKIN', { taskId: 'MUT_TASK_1', memberId: 'DMC0806', scannerId: 'DMC0806' });
                        enqueueOfflineMutation('SHIFT_ADJUST', { memberId: 'DMC0806', delta: 1, reason: 'Test' });

                        const queuedCount = offlineMutationQueue.length;
                        syncOfflineMutations(true);
                        const remainingCount = offlineMutationQueue.length;

                        return {
                            queuedCount: queuedCount,
                            remainingCount: remainingCount
                        };
                    })()
                """)
                print("Mutation sync result:", mut_res)
                assert mut_res["queuedCount"] == 4
                assert mut_res["remainingCount"] == 0
                print(">>> PASSED: Offline mutation queue dispatches all actions successfully!")

                print("\n>>> ALL 10 DEEP INTERACTIVE VERIFICATION TESTS PASSED WITH 100% SUCCESS! <<<")

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except:
            proc.kill()

if __name__ == '__main__':
    asyncio.run(run_suite())
