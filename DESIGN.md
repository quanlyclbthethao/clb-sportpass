# Design System: SportPass V8.5 — Aquamorphic Varsity Pass
*(Frosted Sky Mobile-First `max-w-[420px]` · Zero Forum · 60fps Animated `<dialog closedby="any">` Sheets)*

Hợp đồng thẩm mỹ, mã màu OKLCH và chứng minh tương phản WCAG 2.2 nằm tại [DESIGN_CONTRACT.md](file:///C:/Projects/03_SportPass/clb-sportpass/DESIGN_CONTRACT.md) và bộ token DTCG tại [design-tokens.json](file:///C:/Projects/03_SportPass/clb-sportpass/src/tokens/design-tokens.json).

## Highlights V8.5
- **Fidelity-First Canonical Shell & Ocean Login Portal:** Giữ nguyên bố cục chuẩn 5 khối (Header kính mờ, Thẻ 3D `#hero-interactive-card` kèm họa tiết sóng nước SVG `#card-pattern`, 3 ô chỉ số, nút thao tác nhanh, 8 dòng `THÔNG TIN HỒ SƠ`), bổ sung Cổng đăng nhập Ocean Glass (`#viewLoginContainer`), nút chuyển chế độ xem `Thành viên | Admin` (`#role-preview-dock`) và loại bỏ hoàn toàn phần Diễn đàn.
- **10 Modern Top-Layer Modals (`<dialog closedby="any">`):** QR Pass (`45s` đếm ngược), Thông báo, Thành viên CLB (`125` thành viên, badge `(Bạn)`), Cài đặt & Tài khoản (mini hero card, 3D Tilt toggle, VN|EN, Haptics, `v2.4.5`), Chỉnh sửa hồ sơ (upload avatar, các trường đánh số `1..8`, MSSV chỉ đọc), Tạo ca trực mới (chọn khu vực, bộ đếm ban trực, trưởng ca), Duyệt ca & Quét QR (thẻ thu gọn mượt khi duyệt), Nhiệm vụ ca trực, Đổi mật khẩu và Pop-up xác nhận trung tâm (`#success-celebration-modal`) với checkmark vẽ nét tự động đóng sau `3s`.
- **Zero-Runtime-Tailwind, XSS Guard & 60fps Motion:** Không dùng `cdn.tailwindcss.com`, dựng DOM an toàn qua `textContent` / `src/core/dom.js`, `requestAnimationFrame` cho hiệu ứng xoay thẻ 3D, đóng mở sheet GPU-only (`transform`, `opacity`, `stroke-dashoffset`).
