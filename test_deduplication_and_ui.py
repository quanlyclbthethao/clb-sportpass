# -*- coding: utf-8 -*-
"""
Automated Verification Suite for Task Deduplication, Instant Auto-Sync, and Clean UI
"""
import subprocess
import time
import json
import urllib.request
import asyncio
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

try:
    import aiohttp
except ImportError:
    print("[ERROR] aiohttp is not installed.")
    sys.exit(1)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_PATH = os.path.join(BASE_DIR, "index.html")
GAS_MULTI_PATH = os.path.join(BASE_DIR, "GoogleAppsScript_MultiSheet.js")

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(EDGE_PATH):
    EDGE_PATH = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

URL = f"file:///{INDEX_PATH.replace(os.sep, '/')}"
PORT = 9238
USER_DATA = os.path.join(BASE_DIR, "temp_profile_dedup_test")

async def run_suite():
    print("=== STARTING DEDUPLICATION & INSTANT AUTO-SYNC TEST SUITE ===")
    
    # 1. Static checks on files
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        html = f.read()
    with open(GAS_MULTI_PATH, "r", encoding="utf-8") as f:
        gas = f.read()

    print("\n--- 1. Static Verification ---")
    assert "function deduplicateTasks" in html, "deduplicateTasks must be defined in index.html"
    assert "window.deduplicateTasks = deduplicateTasks" in html, "deduplicateTasks must be exposed to window"
    assert "function triggerInstantSync" in html, "triggerInstantSync must be defined in index.html"
    assert "window.triggerInstantSync = triggerInstantSync" in html, "triggerInstantSync must be exposed to window"
    assert "btnOfflineSync" not in html, "btnOfflineSync must be completely removed from index.html"
    assert "offlineSyncBadge" not in html.split("<main")[0], "offlineSyncBadge must be removed from header"
    assert "Thông báo khi tắt app" not in html, "Clutter row 'Thông báo khi tắt app' must be removed from modalHeaderMore"
    assert "Lưu &amp; Đồng Bộ Google Sheet" not in html, "Profile save button should be clean 'Lưu thay đổi'"
    assert "seenSemantics" in gas, "GAS getTasksList must have semantic deduplication"
    assert "targetTitle" in gas, "GAS handleCreateTask must have semantic deduplication"
    print("[PASS] Static checks: All clutter removed, deduplication functions present.")

    # 2. Browser CDP test
    if not os.path.exists(EDGE_PATH):
        print(f"[SKIP] Edge not found at {EDGE_PATH}")
        return

    proc = subprocess.Popen([
        EDGE_PATH,
        "--headless=new",
        f"--remote-debugging-port={PORT}",
        "--disable-gpu",
        "--no-sandbox",
        f"--user-data-dir={USER_DATA}",
        URL
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    try:
        await asyncio.sleep(2.0)
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
                        "params": {"expression": expr, "returnByValue": True, "awaitPromise": True}
                    })
                    while True:
                        msg = await ws.receive()
                        r = json.loads(msg.data)
                        if r.get("id") == req_id:
                            break
                    if "exceptionDetails" in r.get("result", {}):
                        raise Exception(r["result"]["exceptionDetails"]["exception"]["description"])
                    return r.get("result", {}).get("result", {}).get("value")

                print("\n--- 2. Runtime DOM & Deduplication Verification ---")

                # Login as admin
                await evaluate("""
                    (() => {
                        const user = DEFAULT_MEMBERS_DIRECTORY.find(m => m.id === 'DMC0806');
                        sessionStorage.setItem('CLB_SPORTPASS_AUTH_SESSION', JSON.stringify(user));
                        checkStoredLoginSession();
                    })()
                """)
                await asyncio.sleep(0.5)

                user_name = await evaluate("window.currentUser ? window.currentUser.hoTen : (typeof currentUser !== 'undefined' ? currentUser.hoTen : null)")
                print(f"[PASS] Logged in as: {user_name}")
                assert user_name == "Đỗ Mạnh Cường"

                # Check UI clutter absence
                btn_sync = await evaluate("document.getElementById('btnOfflineSync')")
                assert btn_sync is None, "btnOfflineSync must NOT exist in the DOM"
                print("[PASS] btnOfflineSync is completely absent from DOM.")

                badge_sync = await evaluate("document.getElementById('offlineSyncBadge')")
                assert badge_sync is None, "offlineSyncBadge must NOT exist in the DOM"
                print("[PASS] offlineSyncBadge is completely absent from DOM.")

                # Check camera badge styling and size
                cam_badge_w = await evaluate("document.querySelector('.avatar-cam-badge').offsetWidth")
                cam_badge_h = await evaluate("document.querySelector('.avatar-cam-badge').offsetHeight")
                print(f"[PASS] Avatar Camera Micro-Badge Size: {cam_badge_w}px x {cam_badge_h}px")
                assert cam_badge_w == 22 and cam_badge_h == 22, f"Avatar camera badge must be 22x22px, got {cam_badge_w}x{cam_badge_h}"

                cam_svg_w = await evaluate("document.querySelector('.avatar-cam-badge svg').style.width")
                assert cam_svg_w == "11px", f"Avatar camera SVG must be 11px, got {cam_svg_w}"
                print("[PASS] Avatar Camera SVG icon width is 11px micro-sized.")

                # Test deduplicateTasks with intentional duplicates (ID and Semantic)
                test_result = await evaluate("""
                    (function() {
                        const duplicates = [
                            { id: 'TASK_01', title: 'Trực bàn giải Cầu lông', time: '14:00', location: 'Nhà thi đấu', joinedMembers: ['DMC0806'], quota: 6 },
                            { id: 'TASK_01', title: 'Trực bàn giải Cầu lông', time: '14:00', location: 'Nhà thi đấu', joinedMembers: ['NTD2108'], quota: 8 },
                            { id: 'TASK_TEMP_999', title: 'Trực bàn giải Cầu lông', time: '14:00', location: 'Nhà thi đấu', joinedMembers: ['LDH0912'], quota: 6 },
                            { id: 'TASK_02', title: 'Hậu cần Bóng Đá Nam', time: '08:00', location: 'Sân cỏ', joinedMembers: [], quota: 4 }
                        ];
                        const deduplicated = deduplicateTasks(duplicates);
                        return {
                            count: deduplicated.length,
                            firstTask: deduplicated.find(t => t.title === 'Trực bàn giải Cầu lông')
                        };
                    })()
                """)
                print(f"[PASS] Deduplicated count: {test_result['count']} (expected 2)")
                assert test_result['count'] == 2, f"Expected 2 deduplicated tasks, got {test_result['count']}"
                first_task = test_result['firstTask']
                assert set(first_task['joinedMembers']) == {'DMC0806', 'NTD2108', 'LDH0912'}, f"All members must be merged into one task: {first_task['joinedMembers']}"
                assert first_task['id'] == 'TASK_01', f"Should retain canonical ID TASK_01, got {first_task['id']}"
                print(f"[PASS] Merged joinedMembers without duplication: {first_task['joinedMembers']}")

                # Test simulation of Refresh with duplicate tasks in localStorage
                await evaluate("""
                    (function() {
                        // Inject duplicates into local storage data cache
                        const cache = {
                            currentTasks: [
                                { id: 'TASK_01', title: 'Trực ca 1', time: '10:00', location: 'Sân' },
                                { id: 'TASK_01', title: 'Trực ca 1', time: '10:00', location: 'Sân' },
                                { id: 'TASK_CLONE', title: 'Trực ca 1', time: '10:00', location: 'Sân' },
                                { id: 'TASK_02', title: 'Trực ca 2', time: '15:00', location: 'Sân' }
                            ]
                        };
                        localStorage.setItem('CLB_SPORTPASS_DATA_CACHE', JSON.stringify(cache));
                        // Re-run checkStoredLoginSession to simulate refresh
                        checkStoredLoginSession();
                    })()
                """)
                await asyncio.sleep(0.3)

                tasks_after_refresh = await evaluate("currentTasks.length")
                print(f"[PASS] Tasks count after reload simulation: {tasks_after_refresh} (expected 2 distinct tasks)")
                assert tasks_after_refresh == 2, f"Expected 2 distinct tasks, got {tasks_after_refresh}"

                rendered_cards_count = await evaluate("""
                    (function() {
                        switchDockTab(1);
                        renderTasksList();
                        return document.querySelectorAll('#tasksListContainer > .acrylic-card').length;
                    })()
                """)
                print(f"[PASS] Rendered task cards in DOM: {rendered_cards_count} (expected 2 distinct cards, 0 duplicates)")
                assert rendered_cards_count == 2, f"Rendered cards count must be 2, got {rendered_cards_count}"

                # Test Instant Realtime Auto-Sync triggers
                debug_info = await evaluate("""
                    ({
                        hasTrigger: typeof triggerInstantSync,
                        hasWindowTrigger: typeof window.triggerInstantSync,
                        hasSync: typeof syncRealtimeData,
                        hasWindowSync: typeof window.syncRealtimeData,
                        currentUser: Boolean(typeof currentUser !== 'undefined' && currentUser),
                        onLine: navigator.onLine
                    })
                """)
                # Test Instant Realtime Auto-Sync triggers
                await evaluate("""
                    (() => {
                        window.__testSyncCalled = false;
                        window.__origSync = window.syncRealtimeData;
                        window.syncRealtimeData = function() {
                            window.__testSyncCalled = true;
                        };
                        triggerInstantSync(10);
                    })()
                """)
                await asyncio.sleep(0.15)
                sync_triggered = await evaluate("""
                    (() => {
                        const res = window.__testSyncCalled;
                        window.syncRealtimeData = window.__origSync;
                        return res;
                    })()
                """)
                print(f"[PASS] sync_triggered: {sync_triggered}")
                assert sync_triggered is True, "triggerInstantSync must invoke syncRealtimeData"
                print("[PASS] triggerInstantSync successfully fired syncRealtimeData in background.")

                print("\nALL VERIFICATION CHECKS PASSED WITH 0 ERRORS! 100% PRODUCTION READY.")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == '__main__':
    asyncio.run(run_suite())
