# Design System: SportPass V6.1 Boutique Studio Specification
*(Collegiate Athletic Precision Light + Stadium Night Dark — 9-Pass Unslop Redline)*

## 1. Visual Theme & Atmosphere
- **Product:** Single-source digital pass, field QR check-in, ICE readiness, and rotation dispatch mobile PWA for University of Hai Duong Sports Club.
- **Character:** Disciplined, sunlit-legible, tactile, zero noise.
- **Scale & Weight:** Strict 4px/8px spacing grid, nested radii (`inner = outer - padding >= 8px`), restrained `400`–`600` type weights, Sentence Case section labels, and crisp 1.75px-stroke monochrome SVG icons (zero raw UI emojis).
- **World:** Outdoor athletic track & hardwood court (warm-neutral `#f5f6f8` canvas, solid `#ffffff` elevated surfaces) + Stadium Night floodlit obsidian (`#0b0f17` canvas, `#131a26` surfaces).

## 2. Color Palette & Dual-Mode Tokens

### Light Mode (Collegiate Athletic Precision — Default)
- **Canvas:** `#f5f6f8` (`--sp-canvas-light`)
- **Surface:** `#ffffff` (`--sp-surface-light`)
- **Elevated:** `#f8fafc` (`--sp-elevated-light`)
- **Subtle:** `#f1f5f9` (`--sp-subtle-light`)
- **Border Hairline:** `#e2e8f0` (`--sp-border-light`)
- **Border Strong:** `#cbd5e1` (`--sp-border-strong-light`)
- **Text Primary:** `#0b1220` (`--sp-text-light`)
- **Text Secondary:** `#475569` (`--sp-text2-light`)
- **Text Muted:** `#64748b` (`--sp-muted-light`)
- **Brand Cobalt:** `#0058bc` (`--sp-brand-light`)
- **Primary Accent:** `#0066dc` (`--sp-accent-light`)
- **Accent Container:** `#e8f2ff` (`--sp-accent-soft-light`)
- **Accent Hover:** `#004494` (`--sp-accent-hover-light`)

### Dark Mode (Stadium Night)
- **Canvas:** `#0b0f17` (`--sp-canvas-dark`, never `#000000`)
- **Surface:** `#131a26` (`--sp-surface-dark`)
- **Elevated:** `#1a2333` (`--sp-elevated-dark`)
- **Subtle:** `#1e293b` (`--sp-subtle-dark`)
- **Border Hairline:** `#253247` (`--sp-border-dark`)
- **Border Strong:** `#334155` (`--sp-border-strong-dark`)
- **Text Primary:** `#f1f5f9` (`--sp-text-dark`)
- **Text Secondary:** `#cbd5e1` (`--sp-text2-dark`)
- **Text Muted:** `#94a3b8` (`--sp-muted-dark`)
- **Brand Electric Sky:** `#38bdf8` (`--sp-brand-dark`)
- **Primary Accent:** `#0ea5e9` (`--sp-accent-dark`)
- **Accent Container:** `#0c2944` (`--sp-accent-soft-dark`)
- **Accent Hover:** `#7dd3fc` (`--sp-accent-hover-dark`)

### Semantic Accents
- **Success:** `#059669` / `#34d399` | Track `#10b981` | Bg `#ecfdf5` / `#064e3b` | Ink `#065f46` / `#a7f3d0`
- **Warning:** `#d97706` / `#fbbf24` | Bg `#fef3c7` / `#451a03` | Ink `#92400e` / `#fde68a`
- **Danger (ICE):** `#dc2626` / `#f87171` | Bg `#fef2f2` / `#450a0a` | Ink `#b91c1c` / `#fecaca`

## 3. Approved Color Tokens (Audit Reference)
- `#003865` : Approved Design Token
- `#004494` : Approved Design Token
- `#004c97` : Approved Design Token
- `#00529e` : Approved Design Token
- `#0058bc` : Approved Design Token
- `#0066dc` : Approved Design Token
- `#0070eb` : Approved Design Token
- `#007aff` : Approved Design Token
- `#022340` : Approved Design Token
- `#0284c7` : Approved Design Token
- `#051326` : Approved Design Token
- `#059669` : Approved Design Token
- `#064e3b` : Approved Design Token
- `#065f46` : Approved Design Token
- `#0a2540` : Approved Design Token
- `#0b0f17` : Approved Design Token
- `#0b1220` : Approved Design Token
- `#0c2944` : Approved Design Token
- `#0ea5e9` : Approved Design Token
- `#10b981` : Approved Design Token
- `#131a26` : Approved Design Token
- `#1a2333` : Approved Design Token
- `#1c1c1e` : Approved Design Token
- `#1e293b` : Approved Design Token
- `#253247` : Approved Design Token
- `#334155` : Approved Design Token
- `#34d399` : Approved Design Token
- `#38bdf8` : Approved Design Token
- `#450a0a` : Approved Design Token
- `#451a03` : Approved Design Token
- `#475569` : Approved Design Token
- `#636366` : Approved Design Token
- `#64748b` : Approved Design Token
- `#7dd3fc` : Approved Design Token
- `#92400e` : Approved Design Token
- `#94a3b8` : Approved Design Token
- `#a7f3d0` : Approved Design Token
- `#b91c1c` : Approved Design Token
- `#cbd5e1` : Approved Design Token
- `#d97706` : Approved Design Token
- `#dc2626` : Approved Design Token
- `#e2e8f0` : Approved Design Token
- `#e5e5ea` : Approved Design Token
- `#e8f2ff` : Approved Design Token
- `#ecfdf5` : Approved Design Token
- `#eef2f7` : Approved Design Token
- `#f1f5f9` : Approved Design Token
- `#f5f6f8` : Approved Design Token
- `#f87171` : Approved Design Token
- `#f8fafc` : Approved Design Token
- `#fbbf24` : Approved Design Token
- `#fde68a` : Approved Design Token
- `#fecaca` : Approved Design Token
- `#fef2f2` : Approved Design Token
- `#fef3c7` : Approved Design Token
- `#ffffff` : Approved Design Token
