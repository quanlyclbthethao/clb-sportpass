# Design System: SportPass V8.6 — Real Account RBAC, Slim Settings & Top-Layer Motion
*(Frosted Sky Mobile-First `max-w-[420px]` · Zero Role-Switch Bloat · 60fps `@starting-style` `<dialog closedby="any">`)*

Hợp đồng thẩm mỹ, mã màu OKLCH và chứng minh tương phản WCAG 2.2 nằm tại [DESIGN_CONTRACT.md](file:///C:/Projects/03_SportPass/clb-sportpass/DESIGN_CONTRACT.md) và bộ token DTCG tại [design-tokens.json](file:///C:/Projects/03_SportPass/clb-sportpass/src/tokens/design-tokens.json).

## Highlights V8.6
- **Real Account RBAC (Zero Mock Switcher):** Tài khoản quản trị (`DMC0806` hoặc thành viên được cấp quyền Admin) tự động hiển thị giao diện điều hành (`ADMIN`, `+ Tạo ca trực`, `Duyệt ca`, phân quyền & sửa quân số). Tài khoản thành viên chỉ hiển thị luồng hội viên (`THÀNH VIÊN`, `Đăng ký ca trực`, `Xin đổi ca`, hủy đơn chờ duyệt), loại bỏ hoàn toàn thanh chuyển đổi `#role-preview-dock`.
- **Slim Settings & Real Logic:** `#settings-modal` tinh gọn chỉ giữ **Chuyển giao diện Sáng / Tối / Tự động**, **Đổi mật khẩu** (vô hiệu hóa hoàn toàn mật khẩu cũ `'123456'` sau khi đổi) và **Đăng xuất**. Khôi phục dữ liệu sửa hồ sơ/ảnh/trạng thái qua `CLB_MEMBER_OVERRIDES`, thay thế đăng nhập sinh trắc học giả lập bằng chuẩn **WebAuthn** (`navigator.credentials`), tính chỉ số hiệu suất trực tiếp từ lịch sử điểm danh QR và chuẩn hóa toàn bộ điểm kích hoạt modal.
- **Top-Layer 60fps Motion (`animate-to-from-top-layer`):** Mở/đóng `<dialog closedby="any">` bằng `@starting-style`, `transition-behavior: allow-discrete`, `overlay` và cơ chế fallback `[data-closing]` chờ `getAnimations()`, tự động tạm dừng các animation nền khi mở modal.
