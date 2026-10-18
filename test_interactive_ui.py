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

proc = subprocess.Popen([
    EDGE_PATH,
    "--headless=new",
    "--remote-debugging-port=9225",
    "--disable-gpu",
    "--no-sandbox",
    "--user-data-dir=" + os.path.abspath("temp_profile_interactive"),
    URL
], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

async def test_ui_interactions():
    await asyncio.sleep(2)
    req = urllib.request.urlopen("http://localhost:9225/json")
    targets = json.loads(req.read().decode('utf-8'))
    page_target = [t for t in targets if t.get("type") == "page"][0]
    ws_url = page_target["webSocketDebuggerUrl"]
    
    async with aiohttp.ClientSession() as session:
        async with session.ws_connect(ws_url) as ws:
            await ws.send_json({"id": 1, "method": "Runtime.enable"})
            
            # Helper to evaluate expression and assert success
            async def evaluate(expr):
                await ws.send_json({
                    "id": 100,
                    "method": "Runtime.evaluate",
                    "params": {"expression": expr, "returnByValue": True}
                })
                while True:
                    r = json.loads((await ws.receive()).data)
                    if r.get("id") == 100:
                        break
                if "exceptionDetails" in r.get("result", {}):
                    raise Exception(r["result"]["exceptionDetails"]["exception"]["description"])
                return r.get("result", {}).get("result", {}).get("value")

            print("\n--- 1. Testing Default Members and Session Initialization ---")
            init_res = await evaluate("""
                (() => {
                    return {
                        hasDefaultMembers: (typeof DEFAULT_MEMBERS_DIRECTORY !== 'undefined') && DEFAULT_MEMBERS_DIRECTORY.length > 0,
                        membersCount: DEFAULT_MEMBERS_DIRECTORY ? DEFAULT_MEMBERS_DIRECTORY.length : 0,
                        loginViewExists: Boolean(document.getElementById('viewLoginContainer')),
                        appViewVisible: !document.getElementById('viewMainAppContainer')?.classList.contains('hidden')
                    };
                })()
            """)
            print("Init State:", json.dumps(init_res, indent=2))
            assert init_res["hasDefaultMembers"] == True
            assert init_res["membersCount"] == 125

            print("\n--- 2. Testing Login Simulation ---")
            login_res = await evaluate("""
                (() => {
                    // Simulate logging in as sole admin Đỗ Mạnh Cường (DMC0806)
                    const user = DEFAULT_MEMBERS_DIRECTORY.find(m => m.id === 'DMC0806');
                    sessionStorage.setItem('CLB_SPORTPASS_AUTH_SESSION', JSON.stringify(user));
                    checkStoredLoginSession();
                    return {
                        currentUser: window.currentUser ? window.currentUser.hoTen : null,
                        isAdmin: Boolean(window.currentUser?.isAdmin),
                        loginHidden: document.getElementById('viewLoginContainer')?.classList.contains('hidden'),
                        appVisible: !document.getElementById('viewMainAppContainer')?.classList.contains('hidden')
                    };
                })()
            """)
            print("Login State:", json.dumps(login_res, indent=2, ensure_ascii=False))
            assert login_res["loginHidden"] == True
            assert login_res["appVisible"] == True

            print("\n--- 3. Testing Dock Tab Navigation & Transitions ---")
            for tab_idx in [0, 1, 2]:
                tab_res = await evaluate(f"""
                    (() => {{
                        switchDockTab({tab_idx});
                        const panels = ['tabPanelTasks', 'tabPanelCommunity', 'tabPanelProfile'];
                        const activePanel = panels[{tab_idx}];
                        const el = document.getElementById(activePanel);
                        const isVisible = el && !el.classList.contains('hidden') && el.style.display !== 'none';
                        return {{
                            tabIdx: {tab_idx},
                            panel: activePanel,
                            activeTabVar: typeof currentActiveTabIdx !== 'undefined' ? currentActiveTabIdx : -1,
                            isVisible: isVisible
                        }};
                    }})()
                """)
                print(f"Tab {tab_idx}:", json.dumps(tab_res))
                assert tab_res["activeTabVar"] == tab_idx

            print("\n--- 4. Testing Modals Open & Close ---")
            modal_tests = [
                ("CreateTask", "openCreateTaskModal()", "closeCreateTaskModal()", "modalCreateTask"),
                ("TheTrang", "openTheTrangModal()", "closeTheTrangModal()", "modalTheTrang"),
                ("ChangePassword", "openChangePasswordModal()", "closeChangePasswordModal()", "modalChangePassword"),
                ("Directory", "openDirectoryModal()", "closeDirectoryModal()", "modalDirectory"),
                ("AdminRoles", "openAdminRoleManagementModal()", "closeAdminRoleManagementModal()", "modalAdminRoleManagement")
            ]
            for name, open_call, close_call, modal_id in modal_tests:
                res = await evaluate(f"""
                    (() => {{
                        {open_call};
                        const m = document.getElementById('{modal_id}');
                        const opened = m && m.classList.contains('open');
                        {close_call};
                        const closed = m && !m.classList.contains('open');
                        return {{ name: '{name}', modalId: '{modal_id}', opened: opened, closed: closed }};
                    }})()
                """)
                print(f"Modal {name}:", json.dumps(res))
                assert res["opened"] == True
                assert res["closed"] == True

            print("\n--- 5. Testing Dynamic Aqua Island Notification ---")
            island_res = await evaluate("""
                (() => {
                    showAquaIsland('Kiểm tra phản hồi tức thì 100%!', '⚡');
                    const island = document.getElementById('aquaIsland');
                    const isActive = island && island.classList.contains('active');
                    const text = document.getElementById('aquaIslandMsg')?.textContent;
                    return { isActive: isActive, text: text };
                })()
            """)
            print("Aqua Island State:", json.dumps(island_res, indent=2, ensure_ascii=False))
            assert island_res["isActive"] == True
            assert "Kiểm tra phản hồi tức thì 100%!" in island_res["text"]

            print("\n--- 6. Testing Touch Swipe Handlers & Debounce ---")
            swipe_res = await evaluate("""
                (() => {
                    return {
                        hasTouchListeners: typeof initTouchSwipeNavigation === 'function',
                        hasDebounce: typeof runWithDebounce === 'function'
                    };
                })()
            """)
            print("Swipe & Debounce State:", json.dumps(swipe_res, indent=2))
            assert swipe_res["hasTouchListeners"] == True
            assert swipe_res["hasDebounce"] == True

            print("\n>>> ALL INTERACTIVE UI TESTS PASSED WITH 100% FLYING COLORS! <<<")

try:
    asyncio.run(test_ui_interactions())
finally:
    proc.terminate()
    try:
        proc.wait(timeout=3)
    except:
        proc.kill()
