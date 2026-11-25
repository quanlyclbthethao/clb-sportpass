# DESIGN_CONTRACT.md — SportPass V8.0 (Aquamorphic Varsity Pass)
> Hợp đồng thẩm mỹ & kỹ thuật chuẩn `omni-app-studio` V2.0 — Trung thành tuyệt đối với giao diện chuẩn Aquamorphic / ColorOS Frosted Sky (`max-w-[420px]`) của người dùng.

## 1. Visual Thesis & Architecture
- **Sản phẩm / Đề bài:** SportPass V8.0 (`Varsity Pass`) — Hệ sinh thái Thẻ Định Danh Số, Điểm Danh QR, Điều Phối Ca Trực & Hồ Sơ Hội Viên (CLB Thể Thao • Trường Đại học Hải Dương).
- **Lĩnh vực (Domain):** `sports-club-operations`
- **Trường phái thẩm mỹ:** **Aquamorphic Frosted Sky** (`#F4F6FB` canvas với 3 quầng sáng lam/ngọc, bề mặt kính mờ `backdrop-blur-2xl`, thẻ định danh 3D cực quang `#09335A -> #0EA5E9`, phản hồi gợn sóng nước `.water-ripple` và nảy lò xo `.spring-press`).
- **Phạm vi màn hình chính (5 khối duy nhất — Không Diễn Đàn, Không Thêm Thành Phần Lạ):**
  1. Header kính mờ dính đỉnh (`Varsity Pass`, badge vai trò `#role-badge`, nút thông báo `#notification-trigger`, nút cài đặt avatar `#settings-trigger`).
  2. Thẻ định danh 3D Aquamorphic (`#hero-interactive-card`: SVG sóng nước `#card-pattern`, `CLB THỂ THAO`, `2024–25`, `#hero-status-pill`, avatar `68×68px`, `<h1>` `#card-heading`, chức vụ `#card-subtitle`, `#card-mssv`, nút `#qr-modal-trigger`).
  3. Khối Chỉ số hiệu suất 3 cột (`#stat-shifts` Ca hoàn thành, `#stat-efficiency` Đúng giờ, `#stat-rating` Tín nhiệm).
  4. Khối Thao tác nhanh 2 cột (`#admin-create-shift-btn` Tạo ca, `#admin-approve-btn` Duyệt ca).
  5. Khối `THÔNG TIN HỒ SƠ` + nút `Chỉnh sửa` (`#edit-profile-trigger`) + thẻ kính mờ 8 dòng (`Họ và tên`, `Mã số sinh viên`, `Khoa / Khóa`, `Ngày tháng năm sinh`, `Ban hoạt động`, `Chức vụ`, `Số điện thoại`, `Liên hệ khẩn (ICE)`).

## 2. Hệ Màu Chuẩn W3C DTCG & Perceptual OKLCH Tokens

### 2A. Light Mode (Frosted Sky — Mặc định) & Dark Mode (Midnight Aqua — Tùy chọn Cài đặt)
| Token Role | CSS Variable | Hex | Perceptual OKLCH |
| :--- | :--- | :--- | :--- |
| `color.light.canvas` | `--sp-canvas-light` | `#f4f6fb` | `oklch(0.972 0.0065 264.5)` |
| `color.light.surface` | `--sp-surface-light` | `#ffffff` | `oklch(1.000 0 0)` |
| `color.light.softSurface` | `--sp-surface-soft` | `#f8fafc` | `oklch(0.984 0.0035 247.9)` |
| `color.light.subtle` | `--sp-subtle-light` | `#f1f5f9` | `oklch(0.968 0.0069 247.9)` |
| `color.light.border` | `--sp-border-light` | `#e2e8f0` | `oklch(0.929 0.0126 255.5)` |
| `color.light.borderStrong` | `--sp-border-strong` | `#cbd5e1` | `oklch(0.869 0.0198 252.9)` |
| `color.light.textMutedLight` | `--sp-muted-soft` | `#94a3b8` | `oklch(0.711 0.0351 256.8)` |
| `color.light.textMuted` | `--sp-muted-light` | `#64748b` | `oklch(0.554 0.0407 257.4)` |
| `color.light.textSecondary` | `--sp-text2-light` | `#475569` | `oklch(0.446 0.0374 257.3)` |
| `color.light.textStrong` | `--sp-text-strong` | `#334155` | `oklch(0.372 0.0392 257.3)` |
| `color.light.textDark2` | `--sp-text-slate` | `#1e293b` | `oklch(0.279 0.0369 260.0)` |
| `color.light.graphite` | `--sp-graphite` | `#18181b` | `oklch(0.210 0.0059 285.9)` |
| `color.light.textPrimary` | `--sp-text-light` | `#0f172a` | `oklch(0.208 0.0399 265.8)` |
| `color.dark.canvas` | `--sp-canvas-dark` | `#0b1120` | `oklch(0.175 0.0310 264.0)` |
| `color.dark.surface` | `--sp-surface-dark` | `#131c2e` | `oklch(0.228 0.0365 262.0)` |
| `color.dark.elevated` | `--sp-elevated-dark` | `#1e293b` | `oklch(0.279 0.0369 260.0)` |
| `color.dark.textPrimary` | `--sp-text-dark` | `#f8fafc` | `oklch(0.984 0.0035 247.9)` |

### 2B. Hệ Sky / Cyan / Blue (Hero Pass & Tương tác Chính)
| Token | Hex | Vai trò |
| :--- | :--- | :--- |
| `hero.base` | `#09335a` | Nền đặc dự phòng + điểm đầu gradient thẻ 3D |
| `sky.900` | `#0c4a6e` | Chữ đậm trên nút QR & nền sáng |
| `sky.800` | `#075985` | Chữ tiêu đề / điểm nhấn tương phản cao |
| `sky.700` | `#0369a1` | Link SĐT (`5.93:1` AA), nhãn section, điểm giữa gradient `Tạo ca` |
| `sky.600` | `#0284c7` | Số liệu Ca hoàn thành (`26px` bold), icon & điểm sáng chính |
| `sky.500` | `#0ea5e9` | Điểm cuối gradient thẻ 3D & công tắc |
| `sky.400` | `#38bdf8` | Biểu tượng Varsity Pass & hào quang thẻ |
| `sky.300` | `#7dd3fc` | Viền phản quang thẻ & ring ảnh đại diện |
| `sky.200` | `#bae6fd` | Viền nút `Duyệt ca`, Kicker cyan nhạt |
| `sky.100` | `#e0f2fe` | Nền badge `ADMIN`, ô icon |
| `sky.50` | `#f0f9ff` | Nền hover & thẻ nhắc ca sắp tới |
| `cyan.600..50` | `#0891b2` `#06b6d4` `#22d3ee` `#67e8f9` `#a5f3fc` `#cffafe` `#ecfeff` | Dải cực quang, Ban hoạt động |
| `blue.700..50` | `#1d4ed8` `#2563eb` `#3b82f6` `#dbeafe` `#eff6ff` `#022340` | Điểm nhấn phụ, Mã QR |

### 2C. Hệ Ngữ Nghĩa (Teal / Indigo / Emerald / Amber / Rose)
- **Teal / Aqua (Đúng giờ / Ngày sinh / Duyệt ca / Dark Teal):** `#0f766e` `#0d9488` `#14b8a6` `#2dd4bf` `#5eead4` `#99f6e4` `#ccfbf1` `#f0fdfa`
- **Indigo / Blue Accent (Tín nhiệm / Khoa-Khóa / Chức vụ):** `#4338ca` `#4f46e5` `#6366f1` `#818cf8` `#60a5fa` `#c7d2fe` `#e0e7ff` `#eef2ff`
- **Emerald (Sẵn sàng / Điện thoại / Thành công):** `#047857` `#059669` `#10b981` `#34d399` `#6ee7b7` `#a7f3d0` `#d1fae5` `#ecfdf5`
- **Amber (Liên hệ khẩn ICE / Cảnh báo):** `#92400e` `#b45309` `#d97706` `#f59e0b` `#fbbf24` `#fde68a` `#fef3c7` `#fffbeb`
- **Rose (Đăng xuất / Hủy / Miễn trực):** `#be123c` `#e11d48` `#f43f5e` `#fecdd3` `#ffe4e6` `#fff1f2`

### Chứng Minh Tương Phản WCAG 2.2
- `#0f172a` trên `#f4f6fb`: **16.51:1** (`AAA`)
- `#475569` trên `#ffffff`: **7.58:1** (`AAA`)
- `#64748b` trên `#ffffff`: **4.76:1** (`AA`)
- `#0369a1` trên `#ffffff` (nút SĐT `#display-phone` & link): **5.93:1** (`AA`)
- `#ffffff` trên `#09335a` (Hero Card): **12.56:1** (`AAA`)
- `#ffffff` trên `#0369a1` (Nút `Tạo ca` fallback solid `#0369a1`): **5.93:1** (`AA`)
- `#0284c7` (`26px` bold `#stat-shifts`): **4.10:1** (`AA Large >= 3.0:1`)
- `#0d9488` (`26px` bold `#stat-efficiency`): **3.74:1** (`AA Large >= 3.0:1`)
- `#6366f1` (`26px` bold `#stat-rating`): **4.47:1** (`AA Large >= 3.0:1`)
- `#f8fafc` trên `#0b1120` (Dark Mode): **18.02:1** (`AAA`)

## 3. Lằn Ranh Đỏ Bảo Mật, Modern Web & `H2-002`
- Gỡ bỏ `cdn.tailwindcss.com` lúc chạy; biên dịch CSS chuẩn production trực tiếp vào `index.html`.
- Bảo toàn 100% 6 đường cong & 2 vòng tròn SVG `#card-pattern`, phản quang 3D, cực quang, gợn sóng nước và nảy lò xo.
- Mọi sheet sử dụng `<dialog class="sp-sheet-dialog" closedby="any">` chuẩn HTML/CSS top-layer (`dialog:modal { overscroll-behavior: contain; }`, `dialog::backdrop { overflow: hidden; overscroll-behavior: contain; }`).
- Zero `.innerHTML =`, toàn trang chỉ có 1 thẻ `<h1>` (`#card-heading`), mọi script CDN đều gắn SHA-384 `integrity`, dùng `scrollbar-width: none` thay hoàn toàn cú pháp cũ.
