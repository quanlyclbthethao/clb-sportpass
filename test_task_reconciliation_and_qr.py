# -*- coding: utf-8 -*-
"""
Verification Suite for Task Reconciliation, Two-Way Tombstone Sync, and QR Scanner
"""
import os
import re
import unittest

BASE_DIR = r"C:\Users\Admin\.gemini\antigravity\scratch\clb-sportpass"
INDEX_PATH = os.path.join(BASE_DIR, "index.html")
GAS_MULTI_PATH = os.path.join(BASE_DIR, "GoogleAppsScript_MultiSheet.js")

class TestTaskReconciliationAndQr(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(INDEX_PATH, "r", encoding="utf-8") as f:
            cls.html = f.read()
        with open(GAS_MULTI_PATH, "r", encoding="utf-8") as f:
            cls.gas_multi = f.read()

    # --- ITEM 1: RAPID DISPATCH & ADAPTIVE POLLING ---
    def test_immediate_sync_on_tasks_tab(self):
        """When switching to Tab 1 (Tasks), syncRealtimeData must be invoked immediately"""
        self.assertIn("if (normalized === 1 && currentUser && navigator.onLine)", self.html)
        self.assertIn("syncRealtimeData();", self.html)
        self.assertIn("restartAdaptivePolling();", self.html)

    def test_adaptive_polling_logic(self):
        """Polling cycle must be 10s on Tasks tab and 22s on other tabs"""
        self.assertIn("const intervalMs = (typeof currentActiveTabIdx !== 'undefined' && currentActiveTabIdx === 1) ? 10000 : 22000;", self.html)
        self.assertIn("function restartAdaptivePolling()", self.html)
        self.assertIn("window.restartAdaptivePolling = restartAdaptivePolling;", self.html)

    def test_sync_on_visibility_change(self):
        """Sync must trigger on document visibility change to visible"""
        self.assertIn("document.addEventListener('visibilitychange'", self.html)
        self.assertIn("document.visibilityState === 'visible'", self.html)

    # --- ITEM 2: TWO-WAY DELETION & TOMBSTONES ---
    def test_gas_tombstone_sheet_recording(self):
        """GAS must record deleted task and post IDs into DeletedTombstones sheet"""
        self.assertIn("function recordDeletedTombstone(ss, id, type)", self.gas_multi)
        self.assertIn("function getDeletedTombstones(ss)", self.gas_multi)
        self.assertIn("recordDeletedTombstone(ss, taskId, 'task');", self.gas_multi)
        self.assertIn("recordDeletedTombstone(ss, postId, 'post');", self.gas_multi)
        self.assertIn("deletedTaskIds: tombstones.taskIds", self.gas_multi)
        self.assertIn("deletedPostIds: tombstones.postIds", self.gas_multi)

    def test_client_tombstone_reconciliation(self):
        """Client must absorb server tombstones and not resurrect deleted tasks older than 30s"""
        self.assertIn("data.deletedTaskIds.forEach(id => {", self.html)
        self.assertIn("data.deletedPostIds.forEach(id => {", self.html)
        self.assertIn("localTask.localCreatedAt && (Date.now() - localTask.localCreatedAt < 30000)", self.html)
        self.assertIn("saveDeletedTaskId(localTask.id);", self.html)
        self.assertIn("localPost.localCreatedAt && (Date.now() - localPost.localCreatedAt < 30000)", self.html)
        self.assertIn("saveDeletedPostId(localPost.id);", self.html)

    # --- ITEM 3: QR SCANNER CAMERA & MULTI-FORMAT PARSING ---
    def test_camera_playsinline_and_metadata(self):
        """Camera video element must have playsinline attribute and wait for loadedmetadata/dimensions"""
        self.assertIn("video.setAttribute('playsinline', 'true')", self.html)
        self.assertIn("video.setAttribute('webkit-playsinline', 'true')", self.html)
        self.assertIn("video.removeEventListener('loadedmetadata', onLoaded)", self.html)
        self.assertIn("video.videoWidth === 0 || video.videoHeight === 0", self.html)

    def test_qr_functions_exposed(self):
        """startQrScanner, tickQrScan, handleScanQrPayload must be implemented and exposed on window"""
        self.assertIn("async function startQrScanner", self.html)
        self.assertIn("function tickQrScan", self.html)
        self.assertIn("function handleScanQrPayload", self.html)
        self.assertIn("window.startQrScanner = startQrScanner;", self.html)
        self.assertIn("window.tickQrScan = tickQrScan;", self.html)
        self.assertIn("window.handleScanQrPayload = handleScanQrPayload;", self.html)

    def test_qr_payload_formats(self):
        """Decoder must handle JSON format and SPORTPASS prefixes"""
        self.assertIn("trimmed.startsWith('SPORTPASS:CHECKIN:')", self.html)
        self.assertIn("trimmed.startsWith('SPORTPASS:MEMBER:')", self.html)
        self.assertIn("parsedPayload = JSON.parse(rawCode)", self.html)

    # --- ITEM 4 & 5: TEST REMOVAL & FICTIONAL LOGIN EXAMPLE ---
    def test_no_simulation_or_mock_in_user_ui(self):
        """UI must have no 'mô phỏng' or 'giả lập' elements or buttons"""
        self.assertNotIn("Mô phỏng quét", self.html)
        self.assertNotIn("giả lập", self.html)
        self.assertNotIn("selSimulateScanMember", self.html)

    def test_fictional_login_guidance_example(self):
        """Login guide must use fictional example NVA1508 instead of real members"""
        self.assertIn("NVA1508", self.html)
        self.assertIn("Nguyễn Văn An", self.html)
        self.assertNotIn("DMC0806, LDH0912", self.html)

    # --- ITEM 6: GPU-ACCELERATED ANIMATIONS ---
    def test_gpu_accelerated_laser_animation(self):
        """Laser beam animation must use transform: translateY instead of top to guarantee 60fps"""
        self.assertIn("@keyframes qrLaserSweep", self.html)
        self.assertIn("transform: translateY(", self.html)
        self.assertIn(".qr-scan-reticle", self.html)

if __name__ == "__main__":
    unittest.main()
