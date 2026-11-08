# Project Vision & Constitution: CLB Thể Thao SportPass

> **AGENT INSTRUCTION:** Read this file before every iteration. It serves as the project's "Long-Term Memory" and constitution for the Stitch Build Loop.

## 1. Core Identity
* **Project Name:** CLB Thể Thao - SportPass UHD & Digital Operations Portal
* **Stitch Project ID:** `clb-sportpass-uhd-2026`
* **Mission:** Nền tảng thẻ căn cước số và trung tâm điều phối thông minh các ca trực thực địa cho Câu lạc bộ Thể thao Trường Đại học Hải Dương.
* **Target Audience:** Sinh viên, ban điều hành, đội trưởng bộ môn và cán bộ quản lý thể thao đại học.
* **Voice:** Uy tín, dứt khoát, thể thao, tinh gọn (Zero Slop), phản hồi tức thì.

## 2. Visual Language
* **The "Vibe" (Adjectives):**
  * *Primary:* Collegiate Varsity Athletics (Đĩnh đạc, thể thao chuẩn đại học)
  * *Secondary:* Apple Human Interface Clean (Kính mờ phân tầng, đường viền siêu mảnh)
  * *Tertiary:* High-Density Tabular Monospace (Số liệu căn hàng chuẩn xác tuyệt đối)

## 3. Architecture & File Structure
* **Root:** `clb-sportpass/`
* **Core Application File:** `index.html` (Standalone PWA with offline Service Worker)
* **Design Constitution:** `.stitch/DESIGN.md` & `DESIGN.md`
* **Stitch Relay Baton:** `.stitch/next-prompt.md`
* **Project Metadata:** `.stitch/metadata.json`

## 4. Live Sitemap (Current State)
* [x] `index.html#profile` - Thẻ SportPass Hero Card, Chỉ số sẵn sàng nhiệm vụ & Hồ sơ chi tiết
* [x] `index.html#tasks` - Trung tâm điều phối ca trực, chỉ tiêu quân số theo ban & xoay tua thông minh
* [x] `index.html#forum` - Bảng thông báo điều hành & thảo luận nội bộ
* [x] `modalDirectory` - Danh bạ toàn thể hội viên & gọi cấp cứu khẩn cấp ICE
* [x] `modalDigitalSportPassCard` - Thẻ căn cước số toàn màn hình với mã QR động 60s

## 5. The Roadmap (Backlog)
### High Priority
- [x] Áp dụng chuẩn Stitch Taste-Design (Tabular Mono, Whisper Depth, Tactile Press)
- [x] Tích hợp phân tầng Selective Glassmorphism 3 lớp (Header, Floating Dock, Dynamic Island)
- [ ] Mở rộng bảng xếp hạng điểm rèn luyện thể thao tự động (Sports Leaderboard)

### Medium Priority
- [ ] Tích hợp biểu đồ trực quan hóa thời gian trực ban theo tháng

## 6. Creative Freedom Guidelines
1. **Bảo tồn chuẩn WCAG 2.1 AA:** Thẻ dữ liệu luôn dùng nền trắng `#ffffff` đặc để đọc rõ ngoài trời nắng.
2. **Kính mờ phân tầng:** Chỉ dùng `backdrop-filter: blur()` cho Header, Dock và Modal/Toast.
3. **Monospace cho số liệu:** Tất cả ID, số ca, giờ trực và số điện thoại dùng `JetBrains Mono`.
