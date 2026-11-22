# DESIGN_CONTRACT.md — SportPass UHD (CLB Thể Thao ĐH Hải Dương)
> Hợp đồng thẩm mỹ & kỹ thuật chuẩn `omni-app-studio` V2.0 (Collegiate Athletic Precision Light + Stadium Night Dark)

## 1. Visual Thesis & Surface Mode
- **Sản phẩm / Đề bài:** SportPass V7.0 — Hệ sinh thái Thẻ Hội Viên Số, Điểm Danh QR, Điều Phối Xoay Tua, Quỹ CLB VietQR & Trợ Lý FAQ (CLB Thể Thao • Trường Đại học Hải Dương).
- **Lĩnh vực (Domain):** `sports-club-operations`
- **Trường phái thẩm mỹ:** **Collegiate Athletic Precision** (`athletic-precision`)
- **Surface Mode (`impeccable`):** `Operate` (tốc độ quét thị giác, trạng thái tức thì, tabular-nums, không trang trí vô nghĩa).
- **Tuyên ngôn thị giác:** Ngôn ngữ bảng điểm và thẻ thành tích thể thao hiện đại; thích ứng toàn diện 3 kích thước màn hình (`375px` Mobile Dock PWA, `768px` Tablet Split Grid, `1440px` Desktop Left-Rail Workbench) trên hai chế độ **Sân Tập (Light)** và **Đêm Sân Đấu (Dark)**.

## 2. Hệ Màu 60-30-10 & Perceptual OKLCH Tokens (W3C DTCG Ready)

### 2A. Light Mode — Collegiate Athletic Precision (60% Canvas/Surface · 30% Structure · 10% Cobalt)
| Token Role | CSS Variable | Hex | Perceptual OKLCH |
| :--- | :--- | :--- | :--- |
| `color.light.canvas` (60%) | `--sp-canvas-light` | `#f4f6f9` | `oklch(0.972 0.0045 258.3)` |
| `color.light.surface` (60%) | `--sp-surface-light` | `#ffffff` | `oklch(1.000 0 0)` |
| `color.light.elevated` (30%) | `--sp-elevated-light` | `#eef2f7` | `oklch(0.960 0.0080 253.9)` |
| `color.light.subtle` (30%) | `--sp-subtle-light` | `#e5ebf3` | `oklch(0.938 0.0126 255.5)` |
| `color.light.border` (30%) | `--sp-border-light` | `#d6dfe9` | `oklch(0.900 0.0168 250.9)` |
| `color.light.borderStrong` (30%) | `--sp-border-strong-light` | `#7c8da3` | `oklch(0.638 0.0385 255.0)` |
| `color.light.textPrimary` | `--sp-text-light` | `#0b1220` | `oklch(0.183 0.0309 263.4)` |
| `color.light.textSecondary` | `--sp-text2-light` | `#334155` | `oklch(0.372 0.0392 257.3)` |
| `color.light.textMuted` | `--sp-muted-light` | `#475569` | `oklch(0.446 0.0374 257.3)` |
| `color.light.brandInk` (10%) | `--sp-brand-light` | `#004ea8` | `oklch(0.441 0.1593 257.4)` |
| `color.light.accent` (10%) | `--sp-accent-light` | `#0058bc` | `oklch(0.479 0.1733 257.5)` |
| `color.light.accentSoft` | `--sp-accent-soft-light` | `#e6f0fc` | `oklch(0.951 0.0194 252.9)` |
| `color.light.accentHover` | `--sp-accent-hover-light` | `#003e85` | `oklch(0.376 0.1321 256.8)` |

### 2B. Dark Mode — Stadium Night (60% Obsidian · 30% Slate · 10% Sky Cobalt)
| Token Role | CSS Variable | Hex | Perceptual OKLCH |
| :--- | :--- | :--- | :--- |
| `color.dark.canvas` (60%) | `--sp-canvas-dark` | `#0b0f17` | `oklch(0.168 0.0181 263.9)` |
| `color.dark.surface` (60%) | `--sp-surface-dark` | `#121926` | `oklch(0.213 0.0279 262.4)` |
| `color.dark.elevated` (30%) | `--sp-elevated-dark` | `#1a2334` | `oklch(0.256 0.0348 262.7)` |
| `color.dark.subtle` (30%) | `--sp-subtle-dark` | `#222e42` | `oklch(0.300 0.0401 260.4)` |
| `color.dark.border` (30%) | `--sp-border-dark` | `#28364e` | `oklch(0.332 0.0467 260.9)` |
| `color.dark.borderStrong` (30%) | `--sp-border-strong-dark` | `#586c89` | `oklch(0.526 0.0519 257.6)` |
| `color.dark.textPrimary` | `--sp-text-dark` | `#f1f5f9` | `oklch(0.968 0.0069 247.9)` |
| `color.dark.textSecondary` | `--sp-text2-dark` | `#cbd5e1` | `oklch(0.869 0.0198 252.9)` |
| `color.dark.textMuted` | `--sp-muted-dark` | `#9fb0c7` | `oklch(0.752 0.0382 256.0)` |
| `color.dark.brandInk` (10%) | `--sp-brand-dark` | `#38bdf8` | `oklch(0.754 0.1390 232.7)` |
| `color.dark.accent` (10%) | `--sp-accent-dark` | `#0369a1` | `oklch(0.500 0.1193 242.7)` |
| `color.dark.accentSoft` | `--sp-accent-soft-dark` | `#0d2b47` | `oklch(0.283 0.0627 249.7)` |
| `color.dark.accentHover` | `--sp-accent-hover-dark` | `#7dd3fc` | `oklch(0.828 0.1013 230.3)` |

### 2C. Passbook Hero Gradient Stops & Semantic Status Palette
| Token Role | Hex | Perceptual OKLCH |
| :--- | :--- | :--- |
| `hero.deep` | `#022340` | `oklch(0.251 0.0665 249.3)` |
| `hero.navy` | `#003865` | `oklch(0.335 0.0948 249.9)` |
| `hero.royal` | `#004c97` | `oklch(0.423 0.1390 254.9)` |
| `hero.mid` | `#00529e` | `oklch(0.442 0.1410 254.0)` |
| `hero.bright` | `#0066dc` | `oklch(0.534 0.1975 258.0)` |
| `hero.nightDeep` | `#051326` | `oklch(0.186 0.0441 255.5)` |
| `hero.nightNavy` | `#0a2540` | `oklch(0.260 0.0604 251.3)` |
| `hero.nightSky` | `#0284c7` | `oklch(0.588 0.1389 242.0)` |
| `status.success.solid` | `#047857` | `oklch(0.508 0.1049 165.6)` |
| `status.success.light` | `#059669` | `oklch(0.596 0.1274 163.2)` |
| `status.success.dark` | `#34d399` | `oklch(0.773 0.1535 163.2)` |
| `status.success.bgLight` | `#ecfdf5` | `oklch(0.979 0.0207 166.1)` |
| `status.success.bgDark` | `#064e3b` | `oklch(0.378 0.0730 168.9)` |
| `status.success.inkLight` | `#065f46` | `oklch(0.432 0.0865 166.9)` |
| `status.success.inkDark` | `#a7f3d0` | `oklch(0.905 0.0895 164.2)` |
| `status.warning.solid` | `#b45309` | `oklch(0.555 0.1455 49.0)` |
| `status.warning.light` | `#d97706` | `oklch(0.666 0.1578 58.3)` |
| `status.warning.dark` | `#fbbf24` | `oklch(0.837 0.1644 84.4)` |
| `status.warning.bgLight` | `#fef3c7` | `oklch(0.962 0.0580 95.6)` |
| `status.warning.bgDark` | `#451a03` | `oklch(0.279 0.0742 45.6)` |
| `status.warning.inkLight` | `#92400e` | `oklch(0.473 0.1247 46.2)` |
| `status.warning.inkDark` | `#fde68a` | `oklch(0.924 0.1151 95.7)` |
| `status.danger.solid` | `#dc2626` | `oklch(0.577 0.2152 27.3)` |
| `status.danger.dark` | `#f87171` | `oklch(0.711 0.1661 22.2)` |
| `status.danger.bgLight` | `#fef2f2` | `oklch(0.971 0.0129 17.4)` |
| `status.danger.bgDark` | `#450a0a` | `oklch(0.258 0.0886 26.0)` |
| `status.danger.inkLight` | `#b91c1c` | `oklch(0.505 0.1905 27.5)` |
| `status.danger.inkDark` | `#fecaca` | `oklch(0.885 0.0593 18.3)` |

### Bằng Chứng Tương Phản WCAG 2.2 (Tính trực tiếp bằng `design_director.py`)
- `light.text` (`#0b1220`) trên `light.canvas` (`#f4f6f9`): **17.29:1** (`AAA PASS`)
- `light.text2` (`#334155`) trên `light.surface` (`#ffffff`): **10.35:1** (`AAA PASS`)
- `light.muted` (`#475569`) trên `light.canvas` (`#f4f6f9`): **7.00:1** (`AAA PASS`, khắc phục hoàn toàn `4.4:1` cũ)
- `light.muted` (`#475569`) trên `light.elevated` (`#eef2f7`): **6.74:1** (`AA PASS`)
- `white` (`#ffffff`) trên `light.accent` (`#0058bc`): **6.73:1** (`AA PASS`)
- `dark.text` (`#f1f5f9`) trên `dark.canvas` (`#0b0f17`): **17.51:1** (`AAA PASS`)
- `dark.muted` (`#9fb0c7`) trên `dark.canvas` (`#0b0f17`): **8.68:1** (`AAA PASS`)
- `white` (`#ffffff`) trên `dark.accent` (`#0369a1`): **5.93:1** (`AA PASS`)
- `white` (`#ffffff`) trên `status.success.solid` (`#047857`): **5.48:1** (`AA PASS`)
- `white` (`#ffffff`) trên `status.danger.solid` (`#dc2626`): **4.83:1** (`AA PASS`)

## 3. Typography & Optical Hierarchy
- **Display Font:** `"Plus Jakarta Sans", "Be Vietnam Pro", system-ui, sans-serif`
- **Body Font:** `"Be Vietnam Pro", -apple-system, BlinkMacSystemFont, system-ui, sans-serif`
- **Mono / Tabular Font:** `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`
- **Modular Type Scale:** `1.250 (Major Third)` (`clamp()` responsive scaling, body measure `65–75ch`, `tabular-nums` cho mọi mã định danh `DMC0806` & số ca, restraint weight `400–700`).

## 4. Layout & 10D Motion Physics (3-Viewport Responsive)
- **Desktop (`>= 1024px`, audited at `1440×900`):** Persistent Left Navigation Rail (`256px`) + Main Bento Workspace (`minmax(0, 1fr)`, `@container tab-stage`), asymmetric 2-pane Passbook/Credential Dossier, 2-column Task Dispatch Grid, 65ch Forum Stream + Sticky Composer/Bulletin rail.
- **Tablet (`768px – 1023px`, audited at `768×1024`):** Studio Container (`max-width: 760px`), 2-column Profile/Dispatch responsive grid, centered floating spring dock.
- **Mobile (`< 768px`, audited at `375×812`):** Full-bleed native PWA edge-to-edge stack, `>= 44×44px` touch targets everywhere, single-tier floating bottom spring dock with safe-area padding.
- **Động lực học:** `cubic-bezier(0.2, 0, 0, 1)` + CSS `linear()` springs (`150ms–320ms`), `@starting-style` `<dialog>` top-layer entry/exit, directional `ViewTransitions` (`forward`/`backward`/`theme`), `@media (prefers-reduced-motion: reduce)`, zero `transition-all`.

## 5. Lằn Ranh Đỏ Bảo Mật, Modern Web & `H2-002`
- **Zero `.innerHTML =` (Strict DOM Safety):** 100% node creation qua `document.createElement` / `createElementNS` + `textContent` + `replaceChildren()`.
- **Subresource Integrity (SRI):** Mọi script CDN (`qrcodejs@1.0.0`, `jsqr@1.4.0`) gắn mã SHA-384 `integrity` và `crossorigin="anonymous"`.
- **Standard Scrollbars & Forced Colors:** Dùng `scrollbar-width` + `scrollbar-color` (không dùng `::-webkit-scrollbar`) và `@media (forced-colors: active)`.
- **Single `<h1>` Invariant:** Toàn trang chỉ giữ 1 thẻ `<h1>` chính; các tiêu đề module dùng `<h2>` / `<h3>`.
