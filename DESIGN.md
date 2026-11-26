# Design System: SportPass V8.8 — Separate ID/MSSV, Member Lifecycle Sync, Streamlined Modals & Fast Login
*(Frosted Sky Mobile-First `max-w-[420px]` · Zero Duplicate Modal Controls · Instant Optimistic Auth · 60fps `@starting-style` `<dialog closedby="any">`)*

Hợp đồng thẩm mỹ, mã màu OKLCH và chứng minh tương phản WCAG 2.2 nằm tại [DESIGN_CONTRACT.md](file:///C:/Projects/03_SportPass/clb-sportpass/DESIGN_CONTRACT.md) và bộ token DTCG tại [design-tokens.json](file:///C:/Projects/03_SportPass/clb-sportpass/src/tokens/design-tokens.json).

## Highlights V8.8
- **Instant Login & Lazy Modals (`5,080 ms` → `< 50 ms`):** Xác thực lạc quan cục bộ qua băm SHA-256 trước khi đồng bộ nền sau `450 ms`; bỏ dựng trước `1,768` nút DOM trong `#members-modal` lúc đăng nhập; chỉ re-render các `<dialog>` đang mở và thêm `content-visibility: auto`.
- **Tách bạch `Mã ID` CLB & `MSSV` + Đăng nhập SĐT/MSSV chuẩn hóa:** `id` (`[Initials][DDMM]`) cố định cho Google Sheet/QR; `studentCode` (`MSSV`) độc lập hoàn toàn (hiển thị `Chưa cập nhật` nếu trống). Chuẩn hóa SĐT Việt Nam (`+84`/`84`/`0`/dấu cách) đồng bộ cả frontend và `GoogleAppsScript_MultiSheet.js`.
- **Đăng ký mới, Admin Thêm/Xóa thành viên & Dropdown Hồ sơ:** Tự đăng ký (`#register-modal`) lưu mật khẩu băm SHA-256 vào `AuthCredentials`; Admin thêm (`#add-member-modal`) và xóa 2 bước (`#confirm-delete-modal` → sao lưu `ArchivedMembers` + tombstone `deletedMemberIds`); mọi thành viên xem được `X ca trực · Y ca sinh hoạt` trong `#members-modal`; `Ban hoạt động` & `Chức vụ` dạng `<select>` tách khỏi quyền quét QR.
- **Tinh gọn Đăng nhập & Bỏ nút trùng lặp trong 13 Modal:** Gỡ chi tiết trang trí/Face ID/Touch ID/Quên mật khẩu thừa; mỗi `<dialog closedby="any">` giữ duy nhất 1 nút đóng `×` (popup thành công giữ nút `✓ Xác nhận`); thay URL icon 404 ở `manifest.json` bằng `./icon.svg`.
