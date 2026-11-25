# Design System: SportPass V8.0 — Aquamorphic Varsity Pass
*(Frosted Sky Mobile-First `max-w-[420px]` · Zero Forum · Full 125-Member UHD Backend Integration)*

Hợp đồng thẩm mỹ, mã màu OKLCH và chứng minh tương phản WCAG 2.2 nằm tại [DESIGN_CONTRACT.md](file:///C:/Projects/03_SportPass/clb-sportpass/DESIGN_CONTRACT.md) và bộ token DTCG tại [design-tokens.json](file:///C:/Projects/03_SportPass/clb-sportpass/src/tokens/design-tokens.json).

## Highlights V8.0
- **Fidelity-First Canonical Shell:** Tuân thủ tuyệt đối giao diện mẫu của người dùng (Header kính mờ, Thẻ 3D `#hero-interactive-card` kèm họa tiết sóng nước SVG `#card-pattern`, 3 ô chỉ số nảy lò xo, 2 nút `Tạo ca` / `Duyệt ca`, 8 dòng `THÔNG TIN HỒ SƠ`), loại bỏ hoàn toàn phần Diễn đàn và mọi widget ngoài thiết kế.
- **Zero-Runtime-Tailwind & XSS Fixed:** Loại bỏ runtime `cdn.tailwindcss.com`, sửa lỗi gán `.innerHTML` bằng `textContent` / `src/core/dom.js`, và tăng độ tương phản link số điện thoại `#display-phone` lên `#0369a1` (`5.93:1` WCAG AA).
- **Modern Top-Layer Sheets (`<dialog closedby="any">`):** Toàn bộ QR Pass (`45s` đếm ngược), Thông báo, Cài đặt (Sáng/Tối/Đổi mật khẩu/Đăng xuất), Sửa hồ sơ, Tạo ca và Duyệt ca/Quét QR/Danh bạ 125 thành viên đều chạy trên thẻ `<dialog>` trượt đáy Aquamorphic đồng nhất.
