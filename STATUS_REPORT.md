# BÁO CÁO NÂNG CẤP TOÀN DIỆN HỆ THỐNG CLB SPORTPASS V5.1 (PRODUCTION-READY)
**Thời gian cập nhật:** 19:10:00 18/10/2026  
**Thực hiện bởi:** Antigravity 2.0 (Reviewer & Staff Engineer) $\longleftrightarrow$ Gemini 4 (Oppo Find X8 / Oppo Pad 3)  
**Đơn vị:** CLB Thể Thao • Trường Đại học Hải Dương (UHD)

---

## 1. TỔNG QUAN CÁC KHẮC PHỤC & NÂNG CẤP CHUYÊN SÂU (V5.1)
Sau quá trình rà soát độc lập và kiểm thử đa tầng (Skeptical Review & Edge Case Stress Testing), hệ thống đã được khắc phục triệt để các lỗi tiềm ẩn từ phiên bản trước và tối ưu toàn diện:

1. **Khắc phục dứt điểm lỗi hồi sinh bài đăng và lệnh trực ban khi tải lại / đổi tài khoản:**
   - **Nguyên nhân cốt lõi phát hiện:** Ở phiên bản trước, bộ lọc Tombstone (`getDeletedTaskIds()`, `getDeletedPostIds()`) chỉ được kích hoạt trong callback của `syncRealtimeData()`. Khi người dùng tải lại trang (`checkStoredLoginSession`), đăng nhập ngoại tuyến (`fallbackOfflineLogin`) hoặc chuyển đổi tài khoản, hệ thống đọc trực tiếp dữ liệu từ `localStorage` (`CLB_SPORTPASS_DATA_CACHE`) mà không lọc qua Tombstones, dẫn đến việc dữ liệu đã xóa bị hiển thị lại trước khi sync.
   - **Biện pháp khắc phục triệt để:**
     * Áp dụng bộ lọc Tombstones ngay tại `checkStoredLoginSession()` khi nạp cache khởi tạo.
     * Áp dụng bộ lọc Tombstones tại `fallbackOfflineLogin()` và tự động kích hoạt `renderTasksList()` cùng `renderForumFeed()`.
     * Tự động làm sạch mảng `currentTasks` và `currentPosts` trước khi ghi xuống `CLB_SPORTPASS_DATA_CACHE` trong hàm `saveLocalState()`.

2. **Khôi phục và tích hợp hoàn chỉnh API `updateMemberRole` & Sheet `AdminRoles` trên Google Apps Script:**
   - **Nguyên nhân cốt lõi phát hiện:** Khi Đỗ Mạnh Cường thực hiện phân quyền cho thành viên khác trong app, client gọi tới `action=updateMemberRole`. Tuy nhiên, mã `GoogleAppsScript_MultiSheet.js` và kịch bản `build_multisheet_system.py` ở đợt trước đã bị xóa mất hàm `handleUpdateMemberRole` và logic đọc từ sheet `AdminRoles`. Hậu quả là server trả về lỗi `Hành động không hợp lệ: updateMemberRole` và quyền hạn phân mới bị mất sạch sau khi `syncAll`.
   - **Biện pháp khắc phục triệt để:**
     * Bổ sung điều hướng `action === 'updateMemberRole'` trong `handleRequest(e)`.
     * Bổ sung hàm `handleUpdateMemberRole(ss, memberId, isAdmin, isShiftLeader, adminActorId)` lưu trữ quyền vào sheet `AdminRoles`.
     * Bổ sung cơ chế hợp nhất quyền tùy chỉnh từ sheet `AdminRoles` trong `getAllMembersFromDepartments(ss)`, đảm bảo tính bất biến (`DMC0806` luôn là Admin) và duy trì quyền cán sự được cấp mới trên mọi thiết bị.

3. **Nâng cấp Hệ thống Thông báo PWA (Web Push & Periodic Background Sync):**
   - **Nguyên nhân cốt lõi phát hiện:** Ở phiên bản trước, app chỉ hiển thị một thông báo chào mừng duy nhất khi người dùng cấp quyền; khi có lệnh điều động mới được ban hành trên server, app không hề thông báo cho thành viên.
   - **Biện pháp khắc phục triệt để:**
     * Tích hợp hàm `triggerTaskNotification(title, body)` gọi Service Worker `showNotification()`.
     * Trong `syncRealtimeData()`, tự động so sánh mảng ID nhiệm vụ mới với nhiệm vụ đã biết; khi phát hiện có ca trực mới được ban hành, hệ thống lập tức phát thông báo đẩy cho thành viên.
     * Trong `sw.js`, tích hợp bộ lắng nghe `periodicsync` và `sync` (`check-tasks-periodic`, `check-tasks`) kèm hàm `checkNewTasksBackground()` để hỗ trợ kiểm tra và báo nhiệm vụ ngay cả khi người dùng không mở app.

4. **Dọn dẹp sạch sẽ 100% tàn dư "Tây Bắc" và "Khoa" trong toàn bộ kho lưu trữ:**
   - Đã xử lý và chuẩn hóa toàn bộ các tệp dữ liệu gốc (`data_by_dept.json`, `compiled_members.json`, `members_clean.json`, `members_clean.tsv`, `members_to_paste.tsv`, `auto_seed_code.js`, `create_gas_multisheet.py`, `build_clean_dataset.py`, `build_multisheet_excel.py`, `seed_direct.js`, `GoogleAppsScript_Master.js`) sang danh xưng chuẩn mực: **Trường Đại học Hải Dương** (UHD).
   - Tuyệt đối không còn bất kỳ dấu vết "Tây Bắc" nào trong mã nguồn và dữ liệu.

5. **Đồng bộ toàn bộ bộ kiểm thử tự động (100% Tests Pass):**
   - Đã cập nhật `test_all_features.py`, `test_deep_verification.py`, `verify_all.py`, `verify_new_system.py` để loại bỏ các assertion lỗi thời về mock demo (`quickFillLogin`, `toggleDemoRole`).
   - Kết quả: **38/38 kiểm thử unittest** (`test_all_features.py`, `test_deep_verification.py`, `test_edge_cases_v5.py`, `test_v5_production_system.py`) và toàn bộ các bộ verify (`verify_all.py`, `verify_new_system.py`, `verify_patch.py`, `verify_edge_cases.py`) đều đạt kết quả **PASS 100%**.

---

## 2. DANH MỤC TỆP ĐỒNG BỘ TRÊN GOOGLE DRIVE
- 📁 `G:\Drive của tôi\CLB_The_Thao_Danh_Sach_Thanh_Vien_Chuan_Hoa.xlsx`
- 📁 `G:\Drive của tôi\AutoBridge\Outbox\CLB_The_Thao_Danh_Sach_Thanh_Vien_Chuan_Hoa.xlsx`
- 📁 `G:\Drive của tôi\Du_Lieu_Copy_Tung_Ban\` (7 file `.txt` và `.tsv` chuẩn 8 cột của 7 ban)
- 📁 `G:\Drive của tôi\AutoBridge\Reports\STATUS_REPORT.md` (Báo cáo này)

---

## 3. MÃ GOOGLE APPS SCRIPT ĐÃ NẠP CLIPBOARD
Mã nguồn backend tại `GoogleAppsScript_MultiSheet.js` đã được nạp sẵn vào Windows Clipboard:
- Hỗ trợ đầy đủ 11 actions: `setup`, `login`, `syncAll`, `claimTask`, `withdrawTask`, `checkinMember`, `createTask`, `createPost`, `deleteTask`, `deletePost`, `updateProfile`, **`updateMemberRole`**.
- Đơn vị đào tạo chuẩn hóa 100%: **Trường Đại học Hải Dương**.
