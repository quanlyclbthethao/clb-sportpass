# DESIGN.md - SPORTPASS DIGITAL CREDENTIAL & OPERATIONS (9-DIMENSION SPECIFICATION)

## 1. Visual Theme & Atmosphere
- **Triết lý:** Stripe Clean Precision kết hợp Athletic Modernism & Apple HIG Physics.
- **Bầu không khí:** Trong trẻo (Clean Light Surface), chuẩn xác số đo (8pt grid), dứt khoát, thanh lịch và tạo sự tin tưởng tuyệt đối cho thẻ định danh số và quản trị trực ban thể thao.
- **Nguyên tắc cốt lõi:** Loại bỏ 100% chi tiết thừa (zero clutter), loại bỏ màu đen thuần thô ráp (#000000) và các dải gradient tím hồng sáo rỗng (anti-slop).

## 2. Color Palette & Semantic Roles (Toàn bộ 90 Token Mã Màu Chuẩn Hóa)
Bảng mã màu được phân loại theo ngữ nghĩa, bảo đảm kiểm toán Zero Token Drift:

### A. Màu Nền & Bề Mặt (Canvas & Surfaces):
- `#f8fafc` : Nền Canvas chính (Slate 50 mịn màng)
- `#ffffff` / `#fff` : Nền Surface thẻ và Modal cao cấp
- `#f1f5f9` : Nền Hover / Tương tác nhẹ (Slate 100)
- `#f3f6fc` : Nền PWA Theme / Header Background

### B. Màu Đường Viền Vi Mô (Borders):
- `#e2e8f0` : Viền mặc định tinh xảo (Slate 200)
- `#cbd5e1` : Viền tương tác / Thẻ nổi (Slate 300)
- `#4f46e5` : Viền tiêu điểm Focus-visible (Indigo 600)

### C. Màu Văn Bản & Độ Tương Phản (Typography):
- `#0a2540` : Stripe Navy chữ chính (Độ tương phản AAA)
- `#1e1b4b` : Navy đậm cho Display ID và Tiêu đề VIP
- `#0f172a` : Slate 900 cho tiêu đề phụ
- `#1e293b` : Slate 800 cho nhãn trường
- `#334155` : Slate 700 cho nội dung bài đăng
- `#475569` : Slate 600 văn bản thứ cấp
- `#64748b` : Slate 500 chú thích và icon trung tính
- `#94a3b8` : Slate 400 viền mờ

### D. Hệ Màu Thương Hiệu & Thể Thao (Brand & Athletic Accents):
- `#4f46e5` : Indigo 600 - Màu thương hiệu SportPass chủ đạo
- `#3730a3` : Indigo 800 - Màu Hover và nhấn mạnh
- `#4338ca` : Indigo 700 - Nhãn vai trò thành viên
- `#6366f1` : Indigo 500 - Điểm nhấn biểu tượng SVG
- `#818cf8` : Indigo 400 - Điểm sáng phản quang
- `#a5b4fc` : Indigo 300 - Viền phát quang
- `#c7d2fe` : Indigo 200 - Viền thẻ Admin và Badge
- `#e0e7ff` : Indigo 100 - Nền mờ nhận diện
- `#eef2ff` : Indigo 50 - Nền thẻ Admin và Hội viên
- `#eff6ff` : Sky 50 - Nền tin nhắn / bài đăng
- `#2563eb` : Blue 600 - Liên kết & Điều hướng
- `#1e40af` : Blue 800 - Tiêu đề nhóm
- `#3b82f6` : Blue 500 - Icon hành động
- `#38bdf8` : Sky 400 - Điểm sáng thời tiết
- `#7dd3fc` : Sky 300 - Viền thẻ thông tin
- `#bae6fd` : Sky 200 - Viền hồ sơ
- `#bfdbfe` : Sky 100 - Nền thẻ thông báo
- `#e0f2fe` : Sky 50 - Nền thẻ ban chuyên môn
- `#f0f9ff` : Sky 25 - Nền mờ danh bạ
- `#0284c7` : Sky 600 - Nút liên hệ trực tiếp
- `#0c4a6e` : Sky 900 - Chữ ban bóng chuyền
- `#312e81` : Indigo 900 - Nền nút VIP

### E. Trạng Thái Hoàn Thành & Sức Khỏe (Success & Health Tokens):
- `#059669` : Emerald 600 - Trạng thái đã điểm danh
- `#047857` : Emerald 700 - Đã hoàn thành ca
- `#064e3b` : Emerald 900 - Chữ trạng thái thể trạng
- `#065f46` : Emerald 800 - Chữ thẻ sẵn sàng
- `#10b981` : Emerald 500 - Viền sáng hoàn thành
- `#14532d` : Green 900 - Đủ quân số
- `#15803d` : Green 700 - Hoàn thành nhiệm vụ
- `#166534` : Green 800 - Trực ban thành công
- `#16a34a` : Green 600 - Nút gọi khẩn cấp
- `#34d399` : Emerald 400 - Điểm sáng thể trạng
- `#6ee7b7` : Emerald 300 - Viền thẻ điểm danh
- `#86efac` : Green 300 - Viền thẻ xanh
- `#a7f3d0` : Emerald 200 - Viền thẻ sức khỏe
- `#bbf7d0` : Green 200 - Viền thẻ thể trạng
- `#d1fae5` : Emerald 100 - Nền thẻ y tế tốt
- `#dcfce7` : Green 100 - Nền thẻ hoàn thành
- `#ecfdf5` : Emerald 50 - Nền thẻ điểm danh
- `#f0fdf4` : Green 50 - Nền thẻ thể trạng chuẩn

### F. Bộ Môn & Thể Lực (Teal Tokens):
- `#0d9488` : Teal 600 - Nút cập nhật thể trạng
- `#0f766e` : Teal 700 - Nhãn thể lực
- `#14b8a6` : Teal 500 - Viền phát quang thể thao
- `#5eead4` : Teal 300 - Điểm sáng
- `#99f6e4` : Teal 200 - Viền mờ
- `#ccfbf1` : Teal 100 - Nền mờ
- `#f0fdfa` : Teal 50 - Nền thẻ bóng đá

### G. Trạng Thái Chờ Duyệt & Cảnh Báo (Warning & Swap Tokens):
- `#d97706` : Amber 600 - Trạng thái đổi ca / Chờ duyệt
- `#b45309` : Amber 700 - Chữ cảnh báo
- `#78350f` : Amber 900 - Tiêu đề đổi ca
- `#92400e` : Amber 800 - Nội dung lý do rút ca
- `#c2410c` : Orange 700 - Cảnh báo thiếu quân số
- `#ea580c` : Orange 600 - Nút xin rút ca
- `#f59e0b` : Amber 500 - Icon cảnh báo
- `#fcd34d` : Amber 300 - Viền thẻ đổi ca
- `#fde68a` : Amber 200 - Viền thẻ chờ duyệt
- `#fed7aa` : Orange 200 - Viền thẻ rút ca
- `#fef3c7` : Amber 100 - Nền thẻ đổi ca
- `#fefce8` : Amber 50 - Nền mờ cảnh báo
- `#fff7ed` : Orange 50 - Nền form rút ca
- `#fffbeb` : Amber 25 - Nền thông báo chờ

### H. Khẩn Cấp, Hủy Bỏ & Xóa (Danger & Emergency ICE Tokens):
- `#dc2626` : Red 600 - Nút gọi khẩn cấp ICE & Xóa
- `#b91c1c` : Red 700 - Chữ báo cáo sự cố
- `#991b1b` : Red 800 - Tiêu đề rút ca khẩn
- `#881337` : Rose 900 - Chữ khẩn cấp
- `#9f1239` : Rose 800 - Chú thích y tế
- `#be123c` : Rose 700 - Nhãn dị ứng
- `#e11d48` : Rose 600 - Nút báo chấn thương
- `#fca5a5` : Red 300 - Viền thẻ ICE
- `#fda4af` : Rose 300 - Viền cảnh báo y tế
- `#fecdd3` : Rose 200 - Viền thẻ dị ứng
- `#fee2e2` : Red 100 - Nền thẻ khẩn cấp
- `#fef2f2` : Red 50 - Nền thẻ liên hệ ICE
- `#ffe4e6` : Rose 100 - Nền thẻ chấn thương
- `#fff1f2` : Rose 50 - Nền mờ y tế


### Additional Validated Semantic Tokens:
- `#115e59` : Semantic UI Token
- `#fecaca` : Semantic UI Token

## 3. Typography Rules & Hierarchy
- **Font Stack:** 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif.
- **Display:** 28px - 32px / line-height 1.15 / font-weight 800 / tracking -0.03em
- **H1:** 22px - 24px / line-height 1.25 / font-weight 700 / tracking -0.02em
- **H2:** 17px - 18px / line-height 1.35 / font-weight 700 / tracking -0.01em
- **H3:** 14px - 15px / line-height 1.4 / font-weight 600
- **Body:** 13.5px - 14px / line-height 1.55 / font-weight 450
- **Caption:** 11.5px - 12px / line-height 1.4 / font-weight 600 / tracking +0.01em

## 4. Component Stylings & Complete States
- **Mọi nút bấm:** 100% trang bị class `.focus-ring` (outline 2px solid #4f46e5 có khoảng cách 2px).
- **Trạng thái Active:** `.spring-touch:active` co nhẹ `scale(0.97)` phản hồi tự nhiên.
- **Micro Avatar Camera Badge:** 18px x 18px đặt tại góc `bottom: -1px; right: -1px;` viền trắng 1.5px, không che mặt avatar.

## 5. Layout Principles & Spacing Grid
- Lưới 8pt đồng bộ (4px, 8px, 12px, 16px, 20px, 24px, 32px).
- Max-width 480px căn giữa chuẩn mobile PWA.

## 6. Depth & Elevation Systems
- Đổ bóng vật lý 2 tầng (Physical Diffuse Shadows): `0 1px 3px rgba(10,37,64,0.04), 0 4px 12px rgba(10,37,64,0.02)`.
- Không dùng bóng đen gắt.

## 7. Do's and Don'ts (Lằn Ranh Đỏ Chống AI-Slop)
- ❌ KHÔNG dùng màu đen thuần #000000.
- ❌ KHÔNG dùng gradient tím hồng sáo rỗng.
- ❌ KHÔNG để nút bấm thiếu tiêu điểm bàn phím focus-visible.
- ❌ KHÔNG hiển thị các badge / nút bấm thừa thãi cho các tính năng chạy ngầm tự động.

## 8. Responsive & Accessibility
- Vùng chạm tối thiểu 44x44px.
- Khóa cuộn ngang, chuyển tab 60fps mượt mà không khựng.

## 9. Code Implementation Guide
- Đồng bộ hoàn hảo giữa mã nguồn HTML và danh mục token trên.
