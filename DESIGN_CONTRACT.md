# DESIGN_CONTRACT.md — SportPass V8.6 (Aquamorphic Varsity Pass & Functional Modal Suite)
> Hợp đồng thẩm mỹ & kỹ thuật chuẩn `omni-app-studio` V2.0 — Giữ nguyên thẩm mỹ Frosted Sky & Ocean Card, tinh gọn Cài đặt (Sáng/Tối/Đổi mật khẩu), phân quyền thật theo tài khoản và chuyển động Top-Layer 60fps.

## 1. Visual Thesis & Architecture
- **Sản phẩm / Đề bài:** SportPass V8.6 (`Varsity Pass`) — Hệ sinh thái Thẻ Định Danh Số, Cổng Đăng Nhập Đại Dương, Phê Duyệt Điều Động, Tạo Ca Trực, Thành Viên CLB, Hồ Sơ & Cài Đặt (`CLB Thể Thao • Trường Đại học Hải Dương`).
- **Lĩnh vực (Domain):** `sports-club-operations`
- **Trường phái thẩm mỹ:** **Aquamorphic Frosted Sky** (`#F4F6FB` canvas với 3 quầng sáng lam/ngọc, bề mặt kính mờ `backdrop-blur-2xl`, thẻ đại dương `#072A4D -> #0284C7`, gợn sóng `.water-ripple`, nghiêng 3D rAF, popup trung tâm nảy lò xo).
- **Chuyển động 60fps:** Chỉ animate `transform`, `opacity`, `background-color` (kết hợp `stroke-dashoffset` cho dấu tích SVG). Đóng/mở `<dialog class="sp-sheet-dialog" closedby="any">` dùng `@starting-style` + `transition-behavior: allow-discrete` + `overlay` và fallback `[data-closing]` chờ `getAnimations()`.

## 2. Hệ Màu Chuẩn W3C DTCG & Perceptual OKLCH Tokens
- **Nền & Trung tính:** `#f4f6fb` `#ffffff` `#f8fafc` `#f1f5f9` `#e2e8f0` `#cbd5e1` `#94a3b8` `#64748b` `#475569` `#334155` `#1e293b` `#18181b` `#0f172a` `#0b1120` `#131c2e` `#022340`
- **Đại dương / Sky / Cyan / Blue:** `#072a4d` `#0a457a` `#09335a` `#0c4a6e` `#075985` `#0369a1` `#0284c7` `#0ea5e9` `#38bdf8` `#7dd3fc` `#bae6fd` `#e0f2fe` `#f0f9ff` `#0891b2` `#06b6d4` `#22d3ee` `#67e8f9` `#a5f3fc` `#cffafe` `#ecfeff` `#1d4ed8` `#2563eb` `#3b82f6` `#60a5fa` `#dbeafe` `#eff6ff`
- **Teal / Aqua:** `#0f766e` `#0d9488` `#14b8a6` `#2dd4bf` `#5eead4` `#99f6e4` `#ccfbf1` `#f0fdfa`
- **Indigo:** `#4338ca` `#4f46e5` `#6366f1` `#818cf8` `#c7d2fe` `#e0e7ff` `#eef2ff`
- **Emerald:** `#047857` `#059669` `#10b981` `#34d399` `#6ee7b7` `#a7f3d0` `#d1fae5` `#ecfdf5`
- **Amber:** `#78350f` `#92400e` `#b45309` `#d97706` `#f59e0b` `#fbbf24` `#fde68a` `#fef3c7` `#fffbeb`
- **Rose:** `#9f1239` `#be123c` `#e11d48` `#f43f5e` `#fecdd3` `#ffe4e6` `#fff1f2`

## 3. Bằng Chứng Tương Phản WCAG 2.2
- `--sp-text-light` (`#0f172a`) trên `--sp-canvas-light` (`#f4f6fb`): **16.51:1** (`AAA`)
- `#475569` trên `#ffffff`: **7.58:1** (`AAA`)
- `#0369a1` trên `#ffffff` (`#display-phone`): **5.93:1** (`AA`)
- `#ffffff` trên `#09335a` (Hero & Login Ocean Card): **12.56:1** (`AAA`)
- `#072a4d` trên `#ffffff` (Nút `Đăng nhập ngay`): **14.37:1** (`AAA`)
- `--sp-text-dark` (`#f8fafc`) trên `--sp-canvas-dark` (`#0b1120`): **18.02:1** (`AAA`)

## 4. Lằn Ranh Đỏ Bảo Mật & Modern Web
- Không dùng `cdn.tailwindcss.com`, không `transition-all`, không `::-webkit-scrollbar`, không `.innerHTML =`, toàn trang đúng 1 thẻ `<h1>` (`#card-heading`), SRI SHA-384 cho mọi script ngoài.
