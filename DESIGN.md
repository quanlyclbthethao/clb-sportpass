# Design System: SportPass Digital Credential & Operations
*(Google Stitch Semantic Taste Design System Specification)*

## 1. Visual Theme & Atmosphere
- **Atmosphere:** A restrained, athletic-minimalist collegiate portal with high clarity, tactile depth, and zero AI-slop.
- **Spectrum Metrics:**
  - **Density:** Daily App Balanced (5/10) — Generous padding with dense tabular data where essential.
  - **Variance:** Offset Asymmetric (7/10) — Distinctive hero credential card paired with clean structured grouped lists.
  - **Motion:** Fluid Apple Spring Physics (6/10) — Tactile button depression (-1px translate) and smooth tab-sliding kinematics.
- **Philosophy:** Single Source of Truth for university sports logistics, field attendance, and digital pass verification.

## 2. Color Palette & Roles

- **Deep Ocean Navy** (`#001833`) — Aquamorphic deep primary background
- **Ocean Blue** (`#003865`) — Card core gradient stop & headline ink
- **Varsity Royal** (`#005fa8`) — Accent athletic gradient stop
- **Aquamorphic Cyan** (`#0284c7`) — Core interaction accent and primary CTAs
- **Sky Bright** (`#0ea5e9`) — Button gradient end stop & badge accents
- **Cyan Glow** (`#38bdf8`) — Vector rim highlights, sparks, and borders
- **Electronic Cyan** (`#00f2fe`) — Radial glow & Victory Spark highlights

- **Canvas Gray** (`#f2f2f7`) — Primary background surface (iOS System Grouped Background)
- **Pure Surface** (`#ffffff`) — High-contrast card, container, and modal fill
- **Charcoal Ink** (`#1c1c1e`) — Primary text label (Apple System Label, WCAG AAA compliant)
- **Muted Steel** (`#636366` / `#8e8e93`) — Secondary descriptions, captions, and micro-labels
- **Whisper Border** (`#e5e5ea`) — 1px hairline structural dividers and card borders
- **System Accent** (`#007aff`) — Single accent for primary CTAs, active dock indicator, and focus states (Saturation < 80%)

### Semantic Accents (Strictly Functional):
- **Athletic Green** (`#059669` / `#15803d`, background `#ecfdf5`) — Health readiness, completed duties, verified QR check-in
- **Amber Warning** (`#d97706` / `#b45309`, background `#fef3c7`) — Waitlist status, shift swap pending
- **Emergency Crimson** (`#dc2626` / `#b91c1c`, background `#fee2e2` / `#fef2f2`) — ICE emergency contact, urgent unassigned ca trực

## 3. Typography Rules
- **Display & Titles:** `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Be Vietnam Pro"` — Track-tight, controlled scale, weight-driven hierarchy.
- **Body:** `Be Vietnam Pro` — Relaxed leading, maximum 65ch per line, natural Vietnamese tone diacritics.
- **Mono & Tabular:** `JetBrains Mono` (`font-variant-numeric: tabular-nums`) — Applied unconditionally to all Member IDs, Pass tokens, counters, dates, and times.
- **Banned:** Generic Inter-only styling, decorative script fonts, Times New Roman, and uncalibrated system serifs in application UI.

## 4. Component Stylings
- **Buttons:** Flat, tactile `-1px` translateY on active press, zero outer neon blur glow. Accent `#007aff` fill for primary action; clean white/ghost with hairline border for secondary actions.
- **Cards:** Generously rounded corners (`border-radius: 18px`), diffused whisper shadow (`box-shadow: 0 1px 3px rgba(0,0,0,0.03)`). Data cards maintain 100% solid `#ffffff` fill for outdoor sunlight legibility.
- **Layer 3 Glass Panels:** Selective glassmorphism applied exclusively to floating navigation overlays:
  - Header: `rgba(242, 242, 247, 0.82)` with `backdrop-filter: blur(20px)`
  - Bottom Dock: `rgba(255, 255, 255, 0.80)` with `backdrop-filter: blur(24px)`
  - Dynamic Island Toast: `rgba(28, 28, 30, 0.85)` with `backdrop-filter: blur(24px)`
- **Inputs:** Crisp label above, focused border in `#007aff`, high-contrast text.

## 5. Layout Principles
- **Spatial Separation:** Clear separation of content zones, zero overlapping of text and imagery.
- **Single-Column Mobile First:** Max-width 440px viewport container with automatic safe-area insets.
- **Touch Targets:** Minimum 44x44px touch targets on all interactive controls.

## 6. Motion & Interaction
- **Kinetic Engine:** Apple/ColorOS cubic-bezier spring physics (`cubic-bezier(0.25, 1, 0.4, 1)`).
- **Dock Indicator:** Fluid spring slider translating between tabs.
- **Hardware Acceleration:** All animated elements scoped to `transform` and `opacity` with `will-change`.

## 7. Anti-Patterns (Banned)
- NO random emojis in system headers or navigation buttons.
- NO AI purple/neon button glows or candy gradient cards.
- NO 3-column equal generic card grids.
- NO fake metrics, invented SLA percentages, or AI copywriting clichés ("Seamless", "Unleash", "Next-Gen").
- NO pure black (`#000000`) surfaces.
- NO low-contrast glass on primary data cards.

## 8. Approved Color Tokens (Audit Reference)
- `#0056b3` : Approved Design Token
- `#0062cc` : Approved Design Token
- `#007aff` : Approved Design Token
- `#0284c7` : Approved Design Token
- `#047857` : Approved Design Token
- `#059669` : Approved Design Token
- `#064e3b` : Approved Design Token
- `#065f46` : Approved Design Token
- `#0a2540` : Approved Design Token
- `#0d9488` : Approved Design Token
- `#0f766e` : Approved Design Token
- `#10b981` : Approved Design Token
- `#14532d` : Approved Design Token
- `#15803d` : Approved Design Token
- `#166534` : Approved Design Token
- `#16a34a` : Approved Design Token
- `#1c1c1e` : Approved Design Token
- `#1d4ed8` : Approved Design Token
- `#1e3a8a` : Approved Design Token
- `#1e40af` : Approved Design Token
- `#2563eb` : Approved Design Token
- `#334155` : Approved Design Token
- `#34d399` : Approved Design Token
- `#38bdf8` : Approved Design Token
- `#3b82f6` : Approved Design Token
- `#475569` : Approved Design Token
- `#5eead4` : Approved Design Token
- `#636366` : Approved Design Token
- `#64748b` : Approved Design Token
- `#6ee7b7` : Approved Design Token
- `#78350f` : Approved Design Token
- `#86efac` : Approved Design Token
- `#881337` : Approved Design Token
- `#8e8e93` : Approved Design Token
- `#92400e` : Approved Design Token
- `#93c5fd` : Approved Design Token
- `#94a3b8` : Approved Design Token
- `#991b1b` : Approved Design Token
- `#99f6e4` : Approved Design Token
- `#9f1239` : Approved Design Token
- `#a7f3d0` : Approved Design Token
- `#b45309` : Approved Design Token
- `#b91c1c` : Approved Design Token
- `#bbf7d0` : Approved Design Token
- `#be123c` : Approved Design Token
- `#bfdbfe` : Approved Design Token
- `#c2410c` : Approved Design Token
- `#cbd5e1` : Approved Design Token
- `#ccfbf1` : Approved Design Token
- `#d1fae5` : Approved Design Token
- `#d97706` : Approved Design Token
- `#dc2626` : Approved Design Token
- `#dcfce7` : Approved Design Token
- `#e0f2fe` : Approved Design Token
- `#e11d48` : Approved Design Token
- `#e2e8f0` : Approved Design Token
- `#e5e5ea` : Approved Design Token
- `#ea580c` : Approved Design Token
- `#ecfdf5` : Approved Design Token
- `#eff6ff` : Approved Design Token
- `#f0f7ff` : Approved Design Token
- `#f0f9ff` : Approved Design Token
- `#f0fdf4` : Approved Design Token
- `#f0fdfa` : Approved Design Token
- `#f1f5f9` : Approved Design Token
- `#f2f2f7` : Approved Design Token
- `#f3f6fc` : Approved Design Token
- `#f59e0b` : Approved Design Token
- `#f8fafc` : Approved Design Token
- `#fca5a5` : Approved Design Token
- `#fcd34d` : Approved Design Token
- `#fda4af` : Approved Design Token
- `#fde68a` : Approved Design Token
- `#fecaca` : Approved Design Token
- `#fecdd3` : Approved Design Token
- `#fed7aa` : Approved Design Token
- `#fee2e2` : Approved Design Token
- `#fef2f2` : Approved Design Token
- `#fef3c7` : Approved Design Token
- `#fefce8` : Approved Design Token
- `#ffe4e6` : Approved Design Token
- `#fff` : Approved Design Token
- `#fff1f2` : Approved Design Token
- `#fff7ed` : Approved Design Token
- `#fffbeb` : Approved Design Token
- `#ffffff` : Approved Design Token
