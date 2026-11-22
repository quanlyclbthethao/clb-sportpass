# Design System: SportPass V7.0 — Omni-App Studio Specification
*(Collegiate Athletic Precision Light + Stadium Night Dark · 3-Viewport Responsive Workbench)*

Tham chiếu hợp đồng đầy đủ, mã màu OKLCH và chứng minh tương phản WCAG 2.2 tại [DESIGN_CONTRACT.md](file:///C:/Projects/03_SportPass/clb-sportpass/DESIGN_CONTRACT.md) và bảng token chuẩn W3C DTCG tại [design-tokens.json](file:///C:/Projects/03_SportPass/clb-sportpass/src/tokens/design-tokens.json).

## Highlights V7.0
- **Adaptive 3-Viewport Architecture:** Desktop Workbench (`>= 1024px`, 256px sticky left rail + asymmetric Bento workspace) ↔ Tablet Split (`768px`) ↔ Native Mobile Bottom-Dock PWA (`375px`, `>= 44×44px` touch targets).
- **Accessible Perceptual Contrast:** Upgraded `--sp-muted-light` to `#475569` (`7.00:1` on canvas, `6.74:1` on elevated), `--sp-accent-dark` to `#0369a1` (`5.93:1` with white), and `--sp-success-solid` to `#047857` (`5.48:1`).
- **Strict Safe DOM & SRI:** Zero `.innerHTML` assignments (`src/core/dom.js` `el()` + `replaceChildren()`), `structuredClone()`, standard `scrollbar-color`/`scrollbar-width`, GPU `scaleX()` progress tracks, and SHA-384 SRI on all third-party scripts.
- **Fullstack Club Modules:** Integrated NAPAS 247 VietQR Quỹ CLB (`src/ui/fund-cskh.js`) and CSKH FAQ Instant Responder directly inside the single-pane workspace.
