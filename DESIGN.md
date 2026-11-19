# Design System: SportPass Digital Credential & Field Operations (V6.0)
*(Collegiate Athletic Precision Light + Stadium Night Adaptive System)*

## 1. Visual Theme & Atmosphere
- **Subject Grounding:** University of Hai Duong (UHD) Sports Club Digital Credentialing, Shift Rotation Dispatch, Field QR Check-in, and ICE Emergency Readiness.
- **Atmosphere:** Outdoor-legible **Collegiate Athletic Precision** (Light default) seamlessly paired with **Stadium Night** (Dark mode) via CSS `color-scheme: light dark`, `light-dark()`, and View Transition cross-dissolve.
- **Hierarchy & Rhythm:** Asymmetric telemetry layout anchored by a 3D holographic Varsity SportPass card, single horizontal action rail, 8-column iOS grouped profile list, and a single-tier spring-sliding bottom navigation dock.
- **Philosophy:** Authentic UHD data, tabular monospace alignment for all IDs/counters/times, zero AI-slop templates.

## 2. Color Palette & Dual-Mode Semantic Tokens

### Light Mode (Collegiate Athletic Precision — Default)
- **Canvas:** `#f2f2f7` (`--sp-canvas-light`)
- **Pure Surface:** `#ffffff` (`--sp-surface-light`)
- **Surface Elevated:** `#f8fafc` (`--sp-elevated-light`)
- **Surface Subtle:** `#eef2f7` (`--sp-subtle-light`)
- **Border Hairline:** `#e5e5ea` (`--sp-border-light`)
- **Border Strong:** `#cbd5e1` (`--sp-border-strong-light`)
- **Text Primary:** `#1c1c1e` (`--sp-text-light`)
- **Text Secondary:** `#475569` (`--sp-text2-light`)
- **Text Muted:** `#636366` (`--sp-muted-light`)
- **Brand Cobalt:** `#0058bc` (`--sp-brand-light`)
- **Primary Accent:** `#007aff` (`--sp-accent-light`)
- **Accent Container:** `#e8f2ff` (`--sp-accent-soft-light`)
- **Accent Hover:** `#004494` (`--sp-accent-hover-light`)
- **Hero Pass Gradient Stops:** `#022340`, `#003865`, `#00529e`, `#0070eb`

### Dark Mode (Stadium Night Athletic)
- **Canvas:** `#0b0f17` (`--sp-canvas-dark`, never `#000000`)
- **Surface:** `#131a26` (`--sp-surface-dark`)
- **Surface Elevated:** `#1b2435` (`--sp-elevated-dark`)
- **Surface Subtle:** `#1e293b` (`--sp-subtle-dark`)
- **Border Hairline:** `#253247` (`--sp-border-dark`)
- **Border Strong:** `#334155` (`--sp-border-strong-dark`)
- **Text Primary:** `#f1f5f9` (`--sp-text-dark`)
- **Text Secondary:** `#cbd5e1` (`--sp-text2-dark`)
- **Text Muted:** `#94a3b8` (`--sp-muted-dark`)
- **Brand Electric Sky:** `#38bdf8` (`--sp-brand-dark`)
- **Primary Accent:** `#0ea5e9` (`--sp-accent-dark`)
- **Accent Container:** `#0c2944` (`--sp-accent-soft-dark`)
- **Accent Hover:** `#7dd3fc` (`--sp-accent-hover-dark`)
- **Hero Pass Gradient Stops (Dark):** `#051326`, `#0a2540`, `#004c97`, `#0284c7`

### Semantic Status Accents
- **Success (Athletic Emerald):** `#059669` / `#34d399`, Bg `#ecfdf5` / `#064e3b`, Text `#065f46` / `#a7f3d0`
- **Warning (Amber Shift):** `#d97706` / `#fbbf24`, Bg `#fef3c7` / `#451a03`, Text `#92400e` / `#fde68a`
- **Danger (Emergency ICE Crimson):** `#dc2626` / `#f87171`, Bg `#fef2f2` / `#450a0a`, Text `#b91c1c` / `#fecaca`

## 3. Typography Rules
- **Display & UI Sans:** `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Be Vietnam Pro", system-ui, sans-serif`
- **Tabular Monospace:** `"JetBrains Mono", ui-monospace, SFMono-Regular, monospace` (`font-variant-numeric: tabular-nums`) for all Member IDs, shift counters, QR countdowns, deadlines, and timestamps.
- **Weight Discipline:** `400`–`700` maximum (zero `800`/`900` weights), hierarchy driven by scale, spacing, and contrast.

## 4. Motion & Architectural Invariants (10D Kinetic)
- **Native `<dialog>` Top-Layer:** Every modal uses semantic `<dialog class="sp-dialog" closedby="any">` centered inside top-layer grid/flex with `overscroll-behavior: contain` on `:modal` and `::backdrop` (`overflow: hidden` on `::backdrop` only).
- **Entry & Exit:** `@starting-style` + `overlay` + separate `transition-behavior: allow-discrete` with `data-closing` + `getAnimations()` fallback for Firefox/Safari.
- **Physics `linear()` Springs:** Fallback `cubic-bezier` followed by inline `linear(...)` curve on dock indicator slide, buttons, and toast notifications.
- **Directional View Transitions:** `document.startViewTransition({ update, types: [direction] })` for trusted interactive tab navigation (`tab-stage`) and theme switches (`theme`).
- **Staggered Reveals:** `sibling-index()` CSS function gated with `@supports (animation-delay: calc(sibling-index() * 0.1s))` + JS `--sibling-index` fallback only when unsupported.
- **Accessibility:** Explicit `.focus-ring` / `:focus-visible` WCAG contrast outlines on every button/control, `prefers-reduced-motion` safeguards (without global `0.01ms` hacks), and zero `transition-all`.

## 5. Approved Color Tokens (Audit Reference)
- `#003865` : Approved Design Token
- `#004494` : Approved Design Token
- `#004c97` : Approved Design Token
- `#00529e` : Approved Design Token
- `#0058bc` : Approved Design Token
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
- `#0c2944` : Approved Design Token
- `#0ea5e9` : Approved Design Token
- `#131a26` : Approved Design Token
- `#1b2435` : Approved Design Token
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
- `#7dd3fc` : Approved Design Token
- `#92400e` : Approved Design Token
- `#94a3b8` : Approved Design Token
- `#a7f3d0` : Approved Design Token
- `#b91c1c` : Approved Design Token
- `#cbd5e1` : Approved Design Token
- `#d97706` : Approved Design Token
- `#dc2626` : Approved Design Token
- `#e5e5ea` : Approved Design Token
- `#e8f2ff` : Approved Design Token
- `#ecfdf5` : Approved Design Token
- `#eef2f7` : Approved Design Token
- `#f1f5f9` : Approved Design Token
- `#f2f2f7` : Approved Design Token
- `#f87171` : Approved Design Token
- `#f8fafc` : Approved Design Token
- `#fbbf24` : Approved Design Token
- `#fde68a` : Approved Design Token
- `#fecaca` : Approved Design Token
- `#fef2f2` : Approved Design Token
- `#fef3c7` : Approved Design Token
- `#ffffff` : Approved Design Token
