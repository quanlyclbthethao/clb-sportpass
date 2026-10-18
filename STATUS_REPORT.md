# BÁO CÁO NÂNG CẤP TOÀN DIỆN HỆ THỐNG CLB SPORTPASS V5.0 (PRODUCTION-READY)
**Thời gian cập nhật:** 18:45:00 18/10/2026  
**Thực hiện bởi:** Antigravity 2.0 (Dell Laptop) $\longleftrightarrow$ Gemini 4 (Oppo Find X8 / Oppo Pad 3)  
**Đơn vị:** CLB Thể Thao • Trường Đại học Hải Dương (UHD)

---

## 1. TỔNG QUAN NÂNG CẤP THEO YÊU CẦU MỚI NHẤT
Hệ thống SportPass đã được chuyển đổi từ bản thử nghiệm sang **Giao diện & Hệ thống Vận hành Sản phẩm Thực tế Hoàn Hảo (Production-Ready)**, xử lý dứt điểm các vấn đề then chốt:

1. **Phân quyền Quản Trị Viên (Admin) duy nhất mặc định:**
   - Xóa bỏ toàn bộ logic tự động cấp `isAdmin` cho Ban Chủ Nhiệm hoặc các chức danh khác.
   - **CHỈ CÓ DUY NHẤT Đỗ Mạnh Cường (`DMC0806`) có quyền Admin mặc định**.
   - Các Admin khác sau này sẽ do chính Đỗ Mạnh Cường tự phân quyền trong app qua modal "Phân Quyền Admin & Trưởng Ca".
2. **Loại bỏ triệt để tính năng thử nghiệm / Demo:**
   - Xóa hoàn toàn nút "Trải nghiệm nhanh (Khám phá toàn bộ app ngay)" và xóa hàm tự động nhảy vào mock demo mode khi chưa đăng nhập.
   - Xóa bỏ toàn bộ các nút gợi ý tài khoản mẫu 1 chạm (`quickFillLogin`). Ô đăng nhập mặc định để trống, yêu cầu nhập ID hoặc SĐT chính thức.
   - Xóa bỏ nút chuyển đổi góc nhìn vai trò (`toggleDemoRole`) trong header và menu.
   - Tách bạch hoàn toàn giao diện giữa Admin và Thành viên thường: thành viên thường không nhìn thấy thanh công cụ admin, nút tạo lệnh điều động, nút phân quyền, hay nút duyệt đổi ca.
3. **Sửa lỗi xóa bài diễn đàn & xóa lệnh trực ban bị "hồi sinh":**
   - Xây dựng API xóa trực tiếp lên Google Apps Script: `action=deleteTask` (xóa dòng trong sheet `Tasks`), `action=deletePost` (xóa dòng trong sheet `Posts`).
   - Tích hợp cơ chế Lưu vết xóa vĩnh viễn (Tombstones: `CLB_DELETED_TASK_IDS`, `CLB_DELETED_POST_IDS`) trên `localStorage`.
   - Hàm `syncRealtimeData` tự động lọc bỏ mọi ca trực và bài đăng đã xóa, đảm bảo **không bao giờ bị xuất hiện lại** dù reload trang, đăng nhập lại hay đổi tài khoản.
4. **Tái cấu trúc Thẻ Hồ Sơ Thành Viên:**
   - Bỏ hoàn toàn mục "Khoa" (vì danh sách chuẩn 8 cột không có cột Khoa và dữ liệu cũ thuộc Đại học Hải Dương).
   - Thiết lập chuẩn xác đơn vị: **Trường Đại học Hải Dương** (UHD).
   - Hiển thị đầy đủ, đẹp mắt 8 trường thông tin chuẩn: Mã ID, Họ và Tên, Lớp, Ban chuyên môn, Chức vụ, Số điện thoại, Liên hệ khẩn cấp (ICE), Tình trạng sức khỏe / Y tế.
   - Bỏ hoàn toàn phần NFC giả lập.
   - Bổ sung tính năng **"Chỉnh Sửa Hồ Sơ"**: cho phép từng thành viên tự cập nhật Lớp, Số điện thoại, Liên hệ khẩn ICE, Thể trạng/Y tế và bấm "Lưu & Đồng bộ". Dữ liệu được gửi ngay lên Google Apps Script (`action=updateProfile`) để cập nhật trực tiếp vào sheet Ban tương ứng trên Google Sheet!
5. **Tái thiết kế Tab Điều Động & Tạo Lệnh Trực Ban:**
   - Bổ sung trường **"Ghi chú nhiệm vụ / Yêu cầu đặc biệt"** (`notes`) trong modal Tạo lệnh và trong cấu trúc dữ liệu ca trực.
   - Hiển thị ghi chú rõ ràng, nổi bật dạng thẻ pastel với icon 📝 trên từng thẻ ca trực.
   - Tái thiết kế bố cục danh sách ca trực tinh gọn, thoáng đãng, sang trọng chuẩn AEE (Aesthetic Evolution Engine).
6. **Hệ thống Thông Báo PWA khi tắt app (Web Push Notification):**
   - Nâng cấp `sw.js` đăng ký sự kiện `push` và `notificationclick`.
   - Bổ sung nút đăng ký nhận thông báo trong menu tài khoản (`requestNotificationPermission`).
   - Hỗ trợ thông báo nhiệm vụ và điều động ngay cả khi người dùng đóng app hoặc tắt trình duyệt.
7. **Đồng bộ toàn diện Google Drive & Google Sheet:**
   - Cập nhật file Excel chuẩn hóa `CLB_The_Thao_Danh_Sach_Thanh_Vien_Chuan_Hoa.xlsx` tại `G:\Drive của tôi` và `G:\Drive của tôi\AutoBridge\Outbox`.
   - Cập nhật mã nguồn `GoogleAppsScript_MultiSheet.js` đầy đủ các hàm API mới (`deleteTask`, `deletePost`, `updateProfile`, `taskObj.notes`).
   - Toàn bộ 15 bài kiểm tra chuyên sâu (`test_v5_production_system.py`) và 6 bài kiểm tra trường hợp biên (`test_edge_cases_v5.py`) đều đạt điểm số tuyệt đối 100%.

---

## 2. DANH MỤC TỆP ĐỒNG BỘ TRÊN GOOGLE DRIVE
- 📁 `G:\Drive của tôi\CLB_The_Thao_Danh_Sach_Thanh_Vien_Chuan_Hoa.xlsx`
- 📁 `G:\Drive của tôi\AutoBridge\Outbox\CLB_The_Thao_Danh_Sach_Thanh_Vien_Chuan_Hoa.xlsx`
- 📁 `G:\Drive của tôi\Du_Lieu_Copy_Tung_Ban\` (7 file `.txt` và `.tsv` chuẩn 8 cột của 7 ban)
- 📁 `G:\Drive của tôi\AutoBridge\Reports\STATUS_REPORT.md` (Báo cáo này)

---

## 3. MÃ GOOGLE APPS SCRIPT ĐÃ CẬP NHẬT
Mã nguồn backend tại `GoogleAppsScript_MultiSheet.js` đã được nạp sẵn vào Windows Clipboard:
- Hỗ trợ đầy đủ: `setup`, `login`, `syncAll`, `claimTask`, `withdrawTask`, `checkinMember`, `createTask`, `createPost`, `updateMemberRole`, **`deleteTask`**, **`deletePost`**, **`updateProfile`**.
- Đơn vị đào tạo chuẩn hóa 100%: Trường Đại học Hải Dương.
