# SportPass V6.0 — CLB Thể Thao Trường Đại học Hải Dương

Hệ thống thẻ định danh thành viên số, điểm danh QR hiện trường, kích hoạt y tế khẩn cấp (ICE) và điều phối ca trực xoay tua cho Câu lạc bộ Thể thao Trường Đại học Hải Dương (UHD).

## Cấu trúc mã nguồn V6.0

```text
clb-sportpass/
├── src/
│   ├── styles/
│   │   ├── 01-tokens.css        # Adaptive Light / Stadium Night Dark tokens (light-dark + color-scheme)
│   │   ├── 02-base.css          # Layout shell 440px, WCAG focus-visible rings & typography
│   │   ├── 03-components.css    # Hero 3D SportPass, grouped lists, spring dock & native <dialog>
│   │   └── 04-motion.css        # @starting-style top-layer, linear() springs, View Transitions & GPU laser
│   ├── data/
│   │   ├── members.js           # Danh bạ 125 thành viên UHD chuẩn 8 trường (Admin gốc: DMC0806)
│   │   └── defaults.js          # 7 ban chuyên môn, cấu hình GAS & dữ liệu mẫu khởi tạo
│   ├── core/
│   │   ├── state.js             # State trung tâm, bộ lọc Tombstone & khử trùng lặp ca trực
│   │   ├── security.js          # Đăng nhập/xuất, phân quyền scanner & XSS escaping
│   │   ├── sync.js              # Đồng bộ hai chiều Google Apps Script & hàng đợi offline
│   │   ├── rotation.js          # Thuật toán xoay tua công bằng & phát hiện trùng giờ
│   │   ├── qr.js                # Sinh mã QR động 60s & quét camera/ảnh hiện trường
│   │   └── notifications.js     # Dynamic Aqua Island, rung haptic & PWA Web Push
│   └── ui/
│       ├── shell.html           # Khung HTML5 chuẩn ngữ nghĩa & 17 modal <dialog> top-layer
│       ├── theme.js             # Chuyển chế độ Hệ thống / Sáng sân tập / Tối Stadium Night
│       ├── modals.js            # Quản lý vòng đời <dialog> & chặn cuộn nền overscroll-behavior
│       ├── navigation.js        # Chuyển tab có hướng View Transitions, vuốt cảm ứng & 3D tilt
│       ├── render-profile.js    # Giao diện thẻ Hero, Hồ sơ 8 trường, Thể trạng & Cấp cứu ICE
│       ├── render-tasks.js      # Điều động ca trực, nhận ca, đổi/rút ca & tạo ca admin
│       ├── render-directory.js  # Danh bạ 125 hội viên & điều chỉnh công trực
│       ├── render-admin.js      # Trung tâm phân quyền Admin/Trưởng ca & duyệt đơn
│       ├── render-forum.js      # Diễn đàn nội bộ CLB, cảm xúc & xem ảnh lightbox
│       └── app.js               # Khởi tạo ứng dụng & cầu nối global
├── scripts/
│   └── build.py                 # Biên dịch src/ -> index.html độc lập (kiểm tra JS AST, HTML & token)
├── index.html                   # Ứng dụng PWA độc lập sẵn sàng chạy (GitHub Pages / Offline)
├── manifest.json                # PWA Manifest & Shortcuts
├── sw.js                        # Service Worker v6.0 (Network-First cho index.html, Web Push & Sync)
├── DESIGN.md                    # Đặc tả Design Tokens Sáng / Tối & quy chuẩn 10D Kinetic
├── GoogleAppsScript_MultiSheet.js # Backend Google Sheets 7 ban + Tombstones + AdminRoles
└── GoogleAppsScript_Backend.js  # Script backend tham chiếu
```

## Biên dịch & Kiểm thử

```powershell
# Biên dịch lại index.html từ thư mục src/
python scripts/build.py

# Chạy toàn bộ bộ kiểm thử tự động
python -m unittest discover -s . -p "test_*.py" -v
python test_deduplication_and_ui.py
python test_interactive_ui.py
python test_deep_interactive_suite.py
```
