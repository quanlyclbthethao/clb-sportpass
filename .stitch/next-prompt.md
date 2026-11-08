---
page: index
project: clb-sportpass-uhd-2026
deviceType: MOBILE
---
A high-agency, collegiate athletic mobile web application for university sports club credentialing and field task dispatch, built with Apple Human Interface Guidelines and Google Stitch Semantic Taste Design System.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Mobile Web / Standalone PWA (Viewport max-width 440px)
- Theme: Clean Athletic Light, Collegiate Varsity Precision
- Canvas Background: iOS System Grouped Background (#f2f2f7)
- Pure Surface: Solid Card Fill (#ffffff) with 18px rounded corners and subtle whisper shadow (0 1px 3px rgba(0,0,0,0.03))
- Primary Accent: Apple System Blue (#007aff) for CTAs, active dock indicator, and focus rings
- Text Primary: Apple System Label Charcoal (#1c1c1e)
- Text Secondary: Muted Steel (#636366 / #8e8e93)
- Border Divider: Whisper Line (#e5e5ea)
- Typography: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Be Vietnam Pro", sans-serif' for headlines and body
- Monospace Tabular: 'JetBrains Mono', tabular-nums for all member IDs, pass tokens, counters, dates, and times
- Layer 3 Selective Glassmorphism:
  * Top Header Bar: rgba(242, 242, 247, 0.82) with backdrop-filter: blur(20px)
  * Floating Bottom Dock: rgba(255, 255, 255, 0.80) with backdrop-filter: blur(24px)
  * Dynamic Island Toast: rgba(28, 28, 30, 0.85) with backdrop-filter: blur(24px)
- Button Kinetics: Flat tactile -1px translateY on active press, zero outer neon blur glow

**Page Structure:**
1. **Header Navigation:** Sticky frosted header with online status indicator, university sports club branding, and 4 circular action buttons (Barcode Scanner, Member Directory, Help Center, Admin Management).
2. **Dynamic Island Toast:** Floating top pill for real-time haptic feedback and operational alerts.
3. **Hero SportPass Credential Card:**
   - Shield crest emblem, unit affiliation, and role badge.
   - Profile avatar squircle with camera badge.
   - Member name, department title, Member ID, and verification hash.
   - Primary action: "Xuất Trình QR Nhận Ca" (Solid Blue button).
   - Secondary actions: "Xem Thẻ Hội Viên Số" and "Quét Điểm Danh" (Ghost white cards with blue outline).
4. **Readiness Hub (3 Metric Cards):**
   - Shifts Completed count in tabular mono, Fitness Level, Operational Availability.
   - Two emergency quick-action buttons: "Gọi Thành Viên" and "Cấp Cứu (ICE)".
5. **Detailed Member Profile (Grouped List):**
   - 8 structured metadata rows with clean icon backplates: Name, ID, Class, Department, Role, Phone, ICE Contact, Medical Status.
6. **Floating Bottom Navigation Dock:**
   - Pill container with fluid spring slider between 3 tabs: "Hồ Sơ", "Điều Động", "Diễn Đàn".
