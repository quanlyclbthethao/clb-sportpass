# Design System: SportPass V8.7 — Canonical Varsity Stats, Editable MSSV, Real RBAC & Top-Layer Motion
*(Frosted Sky Mobile-First `max-w-[420px]` · 2 Non-Clickable Stats · Editable MSSV · Full Vietnamese Diacritics · `@starting-style` `<dialog closedby="any">`)*

Hợp đồng thẩm mỹ, mã màu OKLCH và chứng minh tương phản WCAG 2.2 nằm tại [DESIGN_CONTRACT.md](file:///C:/Projects/03_SportPass/clb-sportpass/DESIGN_CONTRACT.md) và bộ token DTCG tại [design-tokens.json](file:///C:/Projects/03_SportPass/clb-sportpass/src/tokens/design-tokens.json).

## Highlights V8.7
- **Canonical Stats & Single-Plus Primary CTA:** Khối thống kê `.stats-glass-card` giữ đúng 2 chỉ số phi tương tác (`Số ca hoàn thành` & `Số ca sinh hoạt`, không link/click), và nút `#admin-create-shift-btn` dùng duy nhất icon `+` trong `.btn-aqua-badge` kèm nhãn `Tạo ca trực` trên gradient đại dương đơn điệu (`#0369a1 -> #0284c7 48% -> #0ea5e9`).
- **Full Vietnamese Diacritic Hero & Editable MSSV:** `.hero-name-h1` dùng `padding: 5px 0 3px; line-height: 1.4; overflow-wrap: break-word;` đảm bảo họ tên tiếng Việt đầy đủ dấu không bao giờ bị cắt nét trên mobile 375px; trường `Mã số sinh viên` (`#input-studentId`) cho phép chỉnh sửa kèm kiểm tra trùng lặp và đồng bộ đa sheet Google Apps Script (`studentCode`).
- **Real Account RBAC & Slim Settings:** Tài khoản quản trị (`DMC0806` hoặc thành viên được cấp quyền Admin) tự động hiển thị luồng điều hành; tài khoản thành viên hiển thị luồng hội viên (`Đăng ký ca trực`, `Xin đổi ca`). `#settings-modal` tối ưu bố cục mobile 375px (hiển thị trọn vẹn `MSSV • Lớp`, nút `Giao diện` 1 dòng, và badge `white-space: nowrap`).
- **Top-Layer 60fps Motion (`animate-to-from-top-layer`):** Mở/đóng `<dialog closedby="any">` bằng `@starting-style`, `transition-behavior: allow-discrete`, `overlay`, dọn tài nguyên qua `cleanupDialogState(id)` trên cả `closeSheetDialog` lẫn sự kiện `'close'` khi light-dismiss, và fallback `[data-closing]` chờ `getAnimations()`.
