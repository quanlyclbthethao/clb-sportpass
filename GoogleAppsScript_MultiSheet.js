/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT BACKEND CHO CLB-SPORTPASS (MULTI-SHEET ARCHITECTURE)
 * ==============================================================================
 * Hệ thống sử dụng 7 sheet Ban chuyên môn riêng biệt + 3 sheet nghiệp vụ:
 * 1. Ban Chủ Nhiệm (9 thành viên)
 * 2. Ban Nhân Sự (3 thành viên)
 * 3. Ban Bóng Chuyền (56 thành viên)
 * 4. Ban Bóng Đá Nam (21 thành viên)
 * 5. Ban Bóng Đá Nữ (23 thành viên)
 * 6. Ban Cầu Lông (2 thành viên)
 * 7. Ban Truyền Thông (11 thành viên)
 * + Tasks (Ca trực)
 * + Swaps (Đổi/Rút ca)
 * + Posts (Diễn đàn & Thông báo)
 *
 * CẤU TRÚC 8 CỘT CHUẨN XÁC TRONG TỪNG SHEET BAN:
 * Cột 1 (A): Mã ID           ([Initials][DDMM], ví dụ: DMC0806, LDH0912, DDH1011)
 * Cột 2 (B): Họ và Tên       (Nguyễn Văn A)
 * Cột 3 (C): Lớp             (K13.GDTC, K15A.SPTOAN...)
 * Cột 4 (D): Ban chuyên môn  (Ban Chủ Nhiệm, Ban Nhân Sự, Ban Cầu Lông...)
 * Cột 5 (E): Chức vụ         (Chủ nhiệm, Trưởng ban, Phó ban, Thành viên...)
 * Cột 6 (F): Y tế            (Mặc định 'Bình thường' hoặc tiền sử dị ứng, tim mạch)
 * Cột 7 (G): Số điện thoại   (Bảo toàn số 0 ở đầu bằng Text '0xxxxxxxxx)
 * Cột 8 (H): Liên hệ khẩn cấp(SĐT người thân / ICE, bảo toàn số 0 ở đầu)
 *
 * TÍNH NĂNG ĐẶC BIỆT:
 * - Tương thích 100% với file Google Sheet mới do người dùng tạo.
 * - Người dùng có thể tự copy-paste danh sách từng ban vào từng tab tương ứng.
 * - Hoặc chạy hàm `setupMultiSheetDatabase()` để tự động dọn dẹp, tạo 7 ban và nạp
 *   toàn bộ 125 thành viên chuẩn 100% với 1 click duy nhất!
 * - Tự động bảo toàn quyền cán sự (isAdmin, isShiftLeader) và hợp nhất đa nhiệm
 *   khi thành viên kiêm nhiệm nhiều ban khác nhau.
 * ==============================================================================
 */

var DEPARTMENT_SHEETS = [
  'Ban Chủ Nhiệm',
  'Ban Nhân Sự',
  'Ban Bóng Chuyền',
  'Ban Bóng Đá Nam',
  'Ban Bóng Đá Nữ',
  'Ban Cầu Lông',
  'Ban Truyền Thông'
];

var APP_SHEETS = ['Tasks', 'Swaps', 'Posts'];

var SEED_DATA = {
  "Ban Chủ Nhiệm": [
    {
      "id": "NTD2108",
      "hoTen": "Nguyễn Tiến Duy",
      "lop": "K13A.SPTOAN",
      "boMon": "Ban Chủ Nhiệm",
      "chucVu": "Phó chủ nhiệm",
      "yTe": "Bình thường",
      "sdt": "0399757027",
      "ice": "0399757027"
    },
    {
      "id": "LDH0912",
      "hoTen": "Lương Đình Hiếu",
      "lop": "K13.GDTC",
      "boMon": "Ban Chủ Nhiệm",
      "chucVu": "Trưởng ban cầu lông",
      "yTe": "Bình thường",
      "sdt": "0787246014",
      "ice": "0787246014"
    },
    {
      "id": "NLH1312",
      "hoTen": "Nguyễn Lê Hoàng",
      "lop": "K13-GDTC",
      "boMon": "Ban Chủ Nhiệm",
      "chucVu": "Phó chủ nhiệm",
      "yTe": "Bình thường",
      "sdt": "0827055999",
      "ice": "0827055999"
    },
    {
      "id": "TTTL1805",
      "hoTen": "Tào Thị Tuyết Linh",
      "lop": "K15D.GDTH",
      "boMon": "Ban Chủ Nhiệm",
      "chucVu": "Trưởng ban truyền thông",
      "yTe": "Bình thường",
      "sdt": "0394828197",
      "ice": "0394828197"
    },
    {
      "id": "HDP2106",
      "hoTen": "Hoàng Duy Phong",
      "lop": "K13B.SPTOAN",
      "boMon": "Ban Chủ Nhiệm",
      "chucVu": "Tổng thư ký",
      "yTe": "Bình thường",
      "sdt": "0971466280",
      "ice": "0971466280"
    },
    {
      "id": "TCT0803",
      "hoTen": "Triệu Chiến Thái",
      "lop": "K13.SPLS",
      "boMon": "Ban Chủ Nhiệm",
      "chucVu": "Trưởng ban Bóng Chuyền",
      "yTe": "Bình thường",
      "sdt": "0354269904",
      "ice": "0354269904"
    },
    {
      "id": "TVT3006",
      "hoTen": "Trần Văn Tiệp",
      "lop": "K13-GDTC",
      "boMon": "Ban Chủ Nhiệm",
      "chucVu": "Chủ nhiệm clb",
      "yTe": "Bình thường",
      "sdt": "082214976",
      "ice": "082214976"
    },
    {
      "id": "LNT1805",
      "hoTen": "Lương Nhật Tân",
      "lop": "K13-GDTC",
      "boMon": "Ban Chủ Nhiệm",
      "chucVu": "Thủ quỹ",
      "yTe": "Bình thường",
      "sdt": "0822131805",
      "ice": "0822131805"
    },
    {
      "id": "NQD1509",
      "hoTen": "Ngô Quang Đoàn",
      "lop": "K15C.GDTC",
      "boMon": "Ban Chủ Nhiệm",
      "chucVu": "Trưởng ban bóng đá nam",
      "yTe": "Bình thường",
      "sdt": "0867322795",
      "ice": "0867322795"
    }
  ],
  "Ban Nhân Sự": [
    {
      "id": "DMC0806",
      "hoTen": "Đỗ Mạnh Cường",
      "lop": "K13.GDTC",
      "boMon": "Ban Nhân Sự",
      "chucVu": "Trưởng ban nhân sự",
      "yTe": "Bình thường",
      "sdt": "",
      "ice": ""
    },
    {
      "id": "NHN1502",
      "hoTen": "Nguyễn Hoài Nam",
      "lop": "K13B.SPToan",
      "boMon": "Ban Nhân Sự",
      "chucVu": "Phó ban nhân sự",
      "yTe": "Bình thường",
      "sdt": "",
      "ice": ""
    },
    {
      "id": "NTDL0303",
      "hoTen": "Nguyễn Thị Diệu Linh",
      "lop": "K15A.GDTH",
      "boMon": "Ban Nhân Sự",
      "chucVu": "Phó ban nhân sự",
      "yTe": "Bình thường",
      "sdt": "0967182101",
      "ice": "0967182101"
    }
  ],
  "Ban Bóng Chuyền": [
    {
      "id": "NLA0611",
      "hoTen": "Nguyễn Long An",
      "lop": "K12NNA",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "",
      "ice": ""
    },
    {
      "id": "NDA0407",
      "hoTen": "Nguyễn Đức Anh",
      "lop": "K16-KHTN",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0862020080",
      "ice": "0862020080"
    },
    {
      "id": "TMA1812",
      "hoTen": "Trần Minh Anh",
      "lop": "K15B.GDTH",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0862231812",
      "ice": "0862231812"
    },
    {
      "id": "LTTB2810",
      "hoTen": "Lò Thị Thảo Biên",
      "lop": "K15C.GDTH",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0333014010",
      "ice": "0333014010"
    },
    {
      "id": "VHB0201",
      "hoTen": "Vương Hoàng Bắc",
      "lop": "K16B.GDTC",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành Viên",
      "yTe": "Bình thường",
      "sdt": "0356749335",
      "ice": "0356749335"
    },
    {
      "id": "BTC2907",
      "hoTen": "Bùi Thu Cúc",
      "lop": "K16A.SPDIA",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0362105729",
      "ice": "0362105729"
    },
    {
      "id": "TPD2809",
      "hoTen": "Tòng Phương Duy",
      "lop": "K15C-GDTH",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Phó ban chuyên môn",
      "yTe": "Bình thường",
      "sdt": "0829782899",
      "ice": "0829782899"
    },
    {
      "id": "HDD2302",
      "hoTen": "Hà Đức Dũng",
      "lop": "K16A.GDTC",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0338578667",
      "ice": "0338578667"
    },
    {
      "id": "TTD0302",
      "hoTen": "Trần Tiến Dũng",
      "lop": "K16.GDTC",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0342344521",
      "ice": "0342344521"
    },
    {
      "id": "BTD2411",
      "hoTen": "Bùi Trịnh Dương",
      "lop": "K16. QTDVDL",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0374136827",
      "ice": "0374136827"
    },
    {
      "id": "HCTD1207",
      "hoTen": "Hoàng Châu Thái Dương",
      "lop": "K15C.GDTH",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0366289127",
      "ice": "0366289127"
    },
    {
      "id": "DTBD3008",
      "hoTen": "Đinh Thị Bình Dương",
      "lop": "K48C-GDMN",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0382247405",
      "ice": "0382247405"
    },
    {
      "id": "TTHG1803",
      "hoTen": "Trương Thị Hà Giang",
      "lop": "K16.Sp Toán",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0862394839",
      "ice": "0862394839"
    },
    {
      "id": "PMH2211",
      "hoTen": "Phạm Minh Hiếu",
      "lop": "K16A.GDTC",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0865789135",
      "ice": "0865789135"
    },
    {
      "id": "NTTH0403",
      "hoTen": "Nguyễn Thị Thanh Hoa",
      "lop": "K15B.GDTH",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0353992007",
      "ice": "0353992007"
    },
    {
      "id": "MCH0312",
      "hoTen": "Ma Công Hoàng",
      "lop": "K14.GDTC",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0325481411",
      "ice": "0325481411"
    },
    {
      "id": "LMH0208",
      "hoTen": "Lê Minh Hùng",
      "lop": "K16A.GDTC",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0837430777",
      "ice": "0837430777"
    },
    {
      "id": "PTH2409",
      "hoTen": "Phạm Thị Hạnh",
      "lop": "K16.GDTC",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0392736086",
      "ice": "0392736086"
    },
    {
      "id": "DMH2510",
      "hoTen": "Đinh Minh Hằng",
      "lop": "K16B.VAN",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0985983840",
      "ice": "0985983840"
    },
    {
      "id": "TCK0603",
      "hoTen": "Trần Công Kiên",
      "lop": "K14- GDTC",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0357397824",
      "ice": "0357397824"
    },
    {
      "id": "TTL3108",
      "hoTen": "Trịnh Thị Lan",
      "lop": "K16A.GDTH",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0369375145",
      "ice": "0369375145"
    },
    {
      "id": "HKL2104",
      "hoTen": "Hà Khánh Linh",
      "lop": "K16D.GDTH",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0982471505",
      "ice": "0982471505"
    },
    {
      "id": "VTTL1012",
      "hoTen": "Vũ Thị Thuỳ Linh",
      "lop": "K49.GDMN",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0347515236",
      "ice": "0347515236"
    },
    {
      "id": "DHL3005",
      "hoTen": "Đỗ Hiền Linh",
      "lop": "K13A-SPAnh",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0386159238",
      "ice": "0386159238"
    },
    {
      "id": "GVL1911",
      "hoTen": "Giàng Văn Long",
      "lop": "K16.SP Địa",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0372084594",
      "ice": "0372084594"
    },
    {
      "id": "LTHM0803",
      "hoTen": "Lê Thị Hồng Minh",
      "lop": "K13E.GDTH",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Phó ban truyền thông",
      "yTe": "Bình thường",
      "sdt": "0829488725",
      "ice": "0829488725"
    },
    {
      "id": "LTN1207",
      "hoTen": "Lê Thảo Nhi",
      "lop": "K16.SP Hoá",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0917775464",
      "ice": "0917775464"
    },
    {
      "id": "TTYN2111",
      "hoTen": "Trần Thị Yến Nhi",
      "lop": "K15A. SP Toán",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0988473222",
      "ice": "0988473222"
    },
    {
      "id": "NPN2309",
      "hoTen": "Nguyễn Phương Như",
      "lop": "K16A.GDTC",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0936536859",
      "ice": "0936536859"
    },
    {
      "id": "NTKO1901",
      "hoTen": "Nguyễn Thị Kim Oanh",
      "lop": "k16B. spvăn",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0334337410",
      "ice": "0334337410"
    },
    {
      "id": "HDP2106",
      "hoTen": "Hoàng Duy Phong",
      "lop": "K13B.SPTOAN",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0971466280",
      "ice": "0971466280"
    },
    {
      "id": "LMP0308",
      "hoTen": "Lê Minh Phong",
      "lop": "k15A-SPVL",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0971154906",
      "ice": "0971154906"
    },
    {
      "id": "DTP2203",
      "hoTen": "Đặng Thanh Phong",
      "lop": "K15A.CNTT",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0564067036",
      "ice": "0564067036"
    },
    {
      "id": "DHQP2004",
      "hoTen": "Đặng Hữu Quốc Pháp",
      "lop": "K16A.SPDIA",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0356869620",
      "ice": "0356869620"
    },
    {
      "id": "HTP1608",
      "hoTen": "Hồ Tấn Phát",
      "lop": "K15.SPKHTN",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0369724633",
      "ice": "0369724633"
    },
    {
      "id": "DHP2510",
      "hoTen": "Đinh Hồng Phú",
      "lop": "K16.SP Tin",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0962107151",
      "ice": "0962107151"
    },
    {
      "id": "TCS1206",
      "hoTen": "Trần Cao Sơn",
      "lop": "K16A.GDTC",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0862384582",
      "ice": "0862384582"
    },
    {
      "id": "LTTT0210",
      "hoTen": "Lê Thị Tâm Thanh",
      "lop": "K16A.GDTH",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0334741502",
      "ice": "0334741502"
    },
    {
      "id": "MTT2508",
      "hoTen": "Ma Thị Thuyết",
      "lop": "K15A.GDMN",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0833226289",
      "ice": "0833226289"
    },
    {
      "id": "TCT0308",
      "hoTen": "Triệu Chiến Thái",
      "lop": "K13.SPLSU",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Trưởng ban Bóng chuyền",
      "yTe": "Bình thường",
      "sdt": "0354269904",
      "ice": "0354269904"
    },
    {
      "id": "BAT1003",
      "hoTen": "Bùi Anh Thương",
      "lop": "K15C.GDTH",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0349403164",
      "ice": "0349403164"
    },
    {
      "id": "HTPT1709",
      "hoTen": "Hà Thị Phương Thảo",
      "lop": "K15C.GDTH",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0988852507",
      "ice": "0988852507"
    },
    {
      "id": "KVHT2207",
      "hoTen": "Kiều Vũ Hồng Thảo",
      "lop": "K15A.SP Toán",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0867733592",
      "ice": "0867733592"
    },
    {
      "id": "PMT1908",
      "hoTen": "Phùng Minh Thảo",
      "lop": "K15C.SPVAN",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0386616269",
      "ice": "0386616269"
    },
    {
      "id": "LNT2108",
      "hoTen": "Lò Ngọc Thế",
      "lop": "K15A.KTD",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0914270871",
      "ice": "0914270871"
    },
    {
      "id": "MTT1209",
      "hoTen": "Mai Thị Trang",
      "lop": "K15B.GDTH",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0397056215",
      "ice": "0397056215"
    },
    {
      "id": "STQT2011",
      "hoTen": "Sầm Thị Quỳnh Trang",
      "lop": "K15A. SP DIA LI",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0795110756",
      "ice": "0795110756"
    },
    {
      "id": "HNT1706",
      "hoTen": "Hoàng Ngọc Trâm",
      "lop": "K16A.SPANH",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0962425044",
      "ice": "0962425044"
    },
    {
      "id": "HBT2510",
      "hoTen": "Hờ Bá Trưởng",
      "lop": "K15B-SPTOAN",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0347598476",
      "ice": "0347598476"
    },
    {
      "id": "TMT1404",
      "hoTen": "Trần Mạnh Tuấn",
      "lop": "K15B-GDTC",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0877661191",
      "ice": "0877661191"
    },
    {
      "id": "NNT3009",
      "hoTen": "Nguyễn Như Tài",
      "lop": "K16.GDTC",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0968580853",
      "ice": "0968580853"
    },
    {
      "id": "TVT0912",
      "hoTen": "Trần Văn Tài",
      "lop": "K15D.GDTH",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0965554923",
      "ice": "0965554923"
    },
    {
      "id": "VQT1204",
      "hoTen": "Vì Quang Tạo",
      "lop": "K14 CNTT",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành Viên",
      "yTe": "Bình thường",
      "sdt": "0393224983",
      "ice": "0393224983"
    },
    {
      "id": "NTTV2308",
      "hoTen": "Nguyễn Thị Thảo Vân",
      "lop": "K15B.GDTH",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0856076668",
      "ice": "0856076668"
    },
    {
      "id": "MTD0212",
      "hoTen": "Mai Thế Đăng",
      "lop": "K15A-SPVL",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0399732007",
      "ice": "0399732007"
    },
    {
      "id": "LTD1409",
      "hoTen": "Lường Thành Đạt",
      "lop": "K14.GDMN.VHVL",
      "boMon": "Ban Bóng Chuyền",
      "chucVu": "Thành viên",
      "yTe": "Bình thường",
      "sdt": "0339416044",
      "ice": "0339416044"
    }
  ],
  "Ban Bóng Đá Nam": [
    {
      "id": "NQA1302",
      "hoTen": "Ngô Quốc An",
      "lop": "k15A-GDTC",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0789377952",
      "ice": "0789377952"
    },
    {
      "id": "PTA0808",
      "hoTen": "Phạm Tuấn Anh",
      "lop": "K15A GDTC",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0385202407",
      "ice": "0385202407"
    },
    {
      "id": "DPA1711",
      "hoTen": "Đoàn Phan Anh",
      "lop": "K16A.CĐT",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0835122299",
      "ice": "0835122299"
    },
    {
      "id": "LMC0801",
      "hoTen": "Lê Minh Chiến",
      "lop": "K15A.GDTC",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0963230064",
      "ice": "0963230064"
    },
    {
      "id": "DDC3007",
      "hoTen": "Đặng Duy Cương",
      "lop": "K16A QTKD",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0931762637",
      "ice": "0931762637"
    },
    {
      "id": "TMH0103",
      "hoTen": "Trần Mạnh Hà",
      "lop": "K15A.Kinh tế",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0912491307",
      "ice": "0912491307"
    },
    {
      "id": "DVH1303",
      "hoTen": "Đặng Văn Hùng",
      "lop": "K16B-GDTC",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0364917959",
      "ice": "0364917959"
    },
    {
      "id": "NGH0108",
      "hoTen": "Nguyễn Gia Hưng",
      "lop": "K16A-CDT",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0972789358",
      "ice": "0972789358"
    },
    {
      "id": "LVH1810",
      "hoTen": "Lê Văn Hướng",
      "lop": "K16B-CDT",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0912296068",
      "ice": "0912296068"
    },
    {
      "id": "CSH1102",
      "hoTen": "Cao Sơn Hải",
      "lop": "K15C.GDTC",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0981482364",
      "ice": "0981482364"
    },
    {
      "id": "VNH0902",
      "hoTen": "Vũ Ngọc Hải",
      "lop": "K16A.GDTC",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0982091671",
      "ice": "0982091671"
    },
    {
      "id": "TVL1408",
      "hoTen": "Trần Văn Long",
      "lop": "K15A-GDTC",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0936864936",
      "ice": "0936864936"
    },
    {
      "id": "LHTN2902",
      "hoTen": "Lưu Hữu Thiện Nhân",
      "lop": "k16A.GDTC",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0916173056",
      "ice": "0916173056"
    },
    {
      "id": "VKP0310",
      "hoTen": "Vũ Kim Phúc",
      "lop": "K15A-KTĐ",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0977323116",
      "ice": "0977323116"
    },
    {
      "id": "BVQ3009",
      "hoTen": "Bùi Việt Quang",
      "lop": "K16B-GDTC",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0364036198",
      "ice": "0364036198"
    },
    {
      "id": "VVMQ1809",
      "hoTen": "Vũ Văn Minh Quân",
      "lop": "K15A.GDTC",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0393902677",
      "ice": "0393902677"
    },
    {
      "id": "NQT1112",
      "hoTen": "Nguyễn Quang Thắng",
      "lop": "K16A.GDTC",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0395662248",
      "ice": "0395662248"
    },
    {
      "id": "NAT0408",
      "hoTen": "Nguyễn Anh Tuấn",
      "lop": "K16A.SPDIA",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0329055362",
      "ice": "0329055362"
    },
    {
      "id": "TMT1404",
      "hoTen": "Trần Mạnh Tuấn",
      "lop": "K15B.GDTC",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "Phó Ban",
      "yTe": "Bình thường",
      "sdt": "0877661191",
      "ice": "0877661191"
    },
    {
      "id": "NQD1509",
      "hoTen": "Ngô Quang Đoàn",
      "lop": "K15C.GDTC",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "Trưởng ban bóng đá nam",
      "yTe": "Bình thường",
      "sdt": "0867322795",
      "ice": "0867322795"
    },
    {
      "id": "CMD0402",
      "hoTen": "Chu Minh Đức",
      "lop": "k15A-GDTC",
      "boMon": "Ban Bóng Đá Nam",
      "chucVu": "thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0394594078",
      "ice": "0394594078"
    }
  ],
  "Ban Bóng Đá Nữ": [
    {
      "id": "TPC1107",
      "hoTen": "Trần Phương Cúc",
      "lop": "K15ASPSU",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0868208922",
      "ice": "0868208922"
    },
    {
      "id": "DTH0111",
      "hoTen": "Đồng Thanh Hiền",
      "lop": "K15C SPTOAN",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0398509120",
      "ice": "0398509120"
    },
    {
      "id": "NTNH1912",
      "hoTen": "Nguyễn Thị Ngọc Huyền",
      "lop": "K14B.NNA",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0982636974",
      "ice": "0982636974"
    },
    {
      "id": "NTHH1401",
      "hoTen": "Nguyễn Trần Huyền Hạnh",
      "lop": "K14C.GDTH",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên bóng đá nữ",
      "yTe": "Bình thường",
      "sdt": "0915748614",
      "ice": "0915748614"
    },
    {
      "id": "PTH2409",
      "hoTen": "Phạm Thị Hạnh",
      "lop": "K16A.GDTC",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0392736086",
      "ice": "0392736086"
    },
    {
      "id": "NTLH1203",
      "hoTen": "Nguyễn Thị Lâm Hằng",
      "lop": "K15B.KT",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0373256635",
      "ice": "0373256635"
    },
    {
      "id": "LTKK2504",
      "hoTen": "Lê Thị Kim Khánh",
      "lop": "K16B-GDTC",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0348135923",
      "ice": "0348135923"
    },
    {
      "id": "LTL0902",
      "hoTen": "Lương Thanh Lam",
      "lop": "k16. SP Hoá",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0829262712",
      "ice": "0829262712"
    },
    {
      "id": "NTL0912",
      "hoTen": "Nguyễn Thị Linh",
      "lop": "K16B-NNA",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0335402186",
      "ice": "0335402186"
    },
    {
      "id": "TTTL1805",
      "hoTen": "Tào Thị Tuyết Linh",
      "lop": "K15D.GDTH",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0394828197",
      "ice": "0394828197"
    },
    {
      "id": "NTKL1305",
      "hoTen": "Nguyễn Thị Khánh Ly",
      "lop": "K15G.GDTH",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0336821586",
      "ice": "0336821586"
    },
    {
      "id": "VQM1712",
      "hoTen": "Vũ Quỳnh Mai",
      "lop": "K15A-GDTC",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0865563238",
      "ice": "0865563238"
    },
    {
      "id": "TTTN1610",
      "hoTen": "Trần Thị Tuyết Nhung",
      "lop": "K16D.GDTH",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0962118003",
      "ice": "0962118003"
    },
    {
      "id": "MTMT1305",
      "hoTen": "Ma Thị Mai Thoa",
      "lop": "K16A.SPTOAN",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0962729061",
      "ice": "0962729061"
    },
    {
      "id": "LTT1001",
      "hoTen": "La Thị Thuý",
      "lop": "K15A.SP SU",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0347685459",
      "ice": "0347685459"
    },
    {
      "id": "NTT2407",
      "hoTen": "Nguyễn Thị Thuận",
      "lop": "K14G-GDTH",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0967683506",
      "ice": "0967683506"
    },
    {
      "id": "PAT2011",
      "hoTen": "Phạm Anh Thư",
      "lop": "K16A.GDTC",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0344821428",
      "ice": "0344821428"
    },
    {
      "id": "HTTT2211",
      "hoTen": "Hoàng Thị Thanh Thảo",
      "lop": "K14G-GDTH",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0354100952",
      "ice": "0354100952"
    },
    {
      "id": "NTPT2604",
      "hoTen": "Nguyễn Thị Phương Thảo",
      "lop": "K16A- GDTC",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0385256670",
      "ice": "0385256670"
    },
    {
      "id": "NBT0605",
      "hoTen": "Nguyễn Bảo Trâm",
      "lop": "K16B-GDTC",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0962857725",
      "ice": "0962857725"
    },
    {
      "id": "LTNT2912",
      "hoTen": "Lường Thị Ngọc Tuyến",
      "lop": "K14-GDCT",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0343797536",
      "ice": "0343797536"
    },
    {
      "id": "HHTV0511",
      "hoTen": "Hoàng Hà Thanh Vân",
      "lop": "K15B.GDTC",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0868057090",
      "ice": "0868057090"
    },
    {
      "id": "TTHY0308",
      "hoTen": "Trần Thị Hoa Yên",
      "lop": "K15D.GDTH",
      "boMon": "Ban Bóng Đá Nữ",
      "chucVu": "Thành viên ban bóng đá",
      "yTe": "Bình thường",
      "sdt": "0345826551",
      "ice": "0345826551"
    }
  ],
  "Ban Cầu Lông": [
    {
      "id": "LDH0912",
      "hoTen": "Lương Đình Hiếu",
      "lop": "K13.GDTC",
      "boMon": "Ban Cầu Lông",
      "chucVu": "Trưởng ban cầu lông",
      "yTe": "Bình thường",
      "sdt": "0787246014",
      "ice": "0787246014"
    },
    {
      "id": "DDH1011",
      "hoTen": "Đinh Đức Huy",
      "lop": "K15A.GDTC",
      "boMon": "Ban Cầu Lông",
      "chucVu": "Phó ban cầu lông",
      "yTe": "Bình thường",
      "sdt": "0362936958",
      "ice": "0362936958"
    }
  ],
  "Ban Truyền Thông": [
    {
      "id": "TTNA0809",
      "hoTen": "Trương Thị Ngọc Anh",
      "lop": "K15.SP Vật lí",
      "boMon": "Ban Truyền Thông",
      "chucVu": "Thành viên ban truyền thông",
      "yTe": "Bình thường",
      "sdt": "0944212679",
      "ice": "0944212679"
    },
    {
      "id": "PTND2909",
      "hoTen": "Phạm Thị Ngọc Duyên",
      "lop": "K15E.GDTH",
      "boMon": "Ban Truyền Thông",
      "chucVu": "Thành viên ban truyền thông",
      "yTe": "Bình thường",
      "sdt": "0379230662",
      "ice": "0379230662"
    },
    {
      "id": "DNHH2205",
      "hoTen": "Đỗ Nguyệt Hải Hà",
      "lop": "K15A SP Toán",
      "boMon": "Ban Truyền Thông",
      "chucVu": "Thành viên ban truyền thông",
      "yTe": "Bình thường",
      "sdt": "0335897056",
      "ice": "0335897056"
    },
    {
      "id": "TTTL1805",
      "hoTen": "Tào Thị Tuyết Linh",
      "lop": "K15D.GDTH",
      "boMon": "Ban Truyền Thông",
      "chucVu": "Trưởng ban truyền thông",
      "yTe": "Bình thường",
      "sdt": "0394828197",
      "ice": "0394828197"
    },
    {
      "id": "LKN1707",
      "hoTen": "Lê Kim Ngân",
      "lop": "K15E.GDTH",
      "boMon": "Ban Truyền Thông",
      "chucVu": "Thành viên ban truyền thông",
      "yTe": "Bình thường",
      "sdt": "0376009544",
      "ice": "0376009544"
    },
    {
      "id": "BTP2006",
      "hoTen": "Bùi Thị Phương",
      "lop": "K48C GDMN",
      "boMon": "Ban Truyền Thông",
      "chucVu": "Thành viên ban truyền thông",
      "yTe": "Bình thường",
      "sdt": "0338540588",
      "ice": "0338540588"
    },
    {
      "id": "LTTP1710",
      "hoTen": "Lê Thị Thu Phương",
      "lop": "K15E.GDTH",
      "boMon": "Ban Truyền Thông",
      "chucVu": "Thành viên ban truyền thông",
      "yTe": "Bình thường",
      "sdt": "0362495007",
      "ice": "0362495007"
    },
    {
      "id": "VMQ2311",
      "hoTen": "Vũ Minh Quang",
      "lop": "K15.GDTC",
      "boMon": "Ban Truyền Thông",
      "chucVu": "Phó ban truyền thông",
      "yTe": "Bình thường",
      "sdt": "0866189811",
      "ice": "0866189811"
    },
    {
      "id": "LTTT2112",
      "hoTen": "Lê Thị Thu Thương",
      "lop": "K13G.GDTH",
      "boMon": "Ban Truyền Thông",
      "chucVu": "Thành viên ban truyền thông",
      "yTe": "Bình thường",
      "sdt": "0704128206",
      "ice": "0704128206"
    },
    {
      "id": "NNT2202",
      "hoTen": "Nguyễn Nhật Tân",
      "lop": "K16 SP Vật Lý",
      "boMon": "Ban Truyền Thông",
      "chucVu": "Thành viên ban truyền thông",
      "yTe": "Bình thường",
      "sdt": "0396291862",
      "ice": "0396291862"
    },
    {
      "id": "PTD2507",
      "hoTen": "Phạm Tiến Đạt",
      "lop": "K16.GDTC",
      "boMon": "Ban Truyền Thông",
      "chucVu": "Thành viên ban truyền thông",
      "yTe": "Bình thường",
      "sdt": "0967395691",
      "ice": "0967395691"
    }
  ]
};

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleRequest(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var postData = null;
  if (e && e.postData && e.postData.contents) {
    try {
      postData = JSON.parse(e.postData.contents);
    } catch(err) {}
  }
  
  // Merge params
  if (postData) {
    for (var key in postData) {
      if (params[key] === undefined) params[key] = postData[key];
    }
  }

  var action = params.action || '';
  var responseData = { success: false, message: 'Hành động không hợp lệ: ' + action };

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 0. CHẠY THIẾT LẬP TỰ ĐỘNG TỪ XA
    if (action === 'setup') {
      setupMultiSheetDatabase();
      responseData = { success: true, message: 'Đã hoàn tất dọn dẹp và khởi tạo 7 ban cùng dữ liệu 125 thành viên chuẩn 8 cột!' };
    }
    // 1. ĐĂNG NHẬP (Tìm kiếm thông minh trên tất cả 7 Ban - Hợp nhất quyền kiêm nhiệm)
    else if (action === 'login') {
      var identifier = (params.identifier || '').trim().toLowerCase();
      if (!identifier) {
        responseData = { success: false, message: 'Vui lòng nhập Mã ID, SĐT hoặc Họ và Tên' };
      } else {
        var allMembers = getAllMembersFromDepartments(ss);
        var foundMember = null;
        var cleanIdentNum = identifier.replace(/[^0-9]/g, '');

        for (var i = 0; i < allMembers.length; i++) {
          var m = allMembers[i];
          var mId = String(m.id || '').trim().toLowerCase();
          var mSdt = String(m.sdt || '').replace(/[^0-9]/g, '');
          var mName = String(m.hoTen || '').trim().toLowerCase();
          var mMssv = String(m.mssv || '').trim().toLowerCase();

          // Khớp theo ID, SĐT (từ 9 số trở lên), Họ Tên hoặc Mã dự phòng
          var isMatch = (mId === identifier) ||
                        (cleanIdentNum.length >= 9 && mSdt && mSdt === cleanIdentNum) ||
                        (mName === identifier) ||
                        (mMssv === identifier);

          if (isMatch) {
            if (!foundMember) {
              foundMember = JSON.parse(JSON.stringify(m));
            } else {
              // Hợp nhất quyền hạn cán sự từ các ban kiêm nhiệm
              // Ưu tiên chức vụ và ban có thẩm quyền cao hơn
              if (m.isAdmin && !foundMember.isAdmin) {
                foundMember.isAdmin = true;
                foundMember.isShiftLeader = true;
                foundMember.chucVu = m.chucVu;
                foundMember.boMon = m.boMon;
              } else if (m.isShiftLeader && !foundMember.isShiftLeader) {
                foundMember.isShiftLeader = true;
                foundMember.chucVu = m.chucVu;
                foundMember.boMon = m.boMon;
              } else {
                foundMember.isAdmin = foundMember.isAdmin || m.isAdmin;
                foundMember.isShiftLeader = foundMember.isShiftLeader || m.isShiftLeader;
              }
              // Điền bổ sung SĐT và ICE nếu bản ghi trước đó để trống
              if (!foundMember.sdt && m.sdt) {
                foundMember.sdt = m.sdt;
                foundMember.ice = m.sdt;
              }
              if (!foundMember.ice && m.ice) {
                foundMember.ice = m.ice;
              }
            }
          }
        }

        if (foundMember) {
          responseData = { success: true, member: foundMember };
        } else {
          responseData = { success: false, message: 'Không tìm thấy thành viên: ' + identifier + '. Vui lòng kiểm tra Mã ID (VD: DMC0806, LDH0912, DDH1011...) hoặc SĐT.' };
        }
      }
    }
    // 2. ĐỒNG BỘ TOÀN BỘ DỮ LIỆU APP (syncAll)
    else if (action === 'syncAll') {
      var memberId = (params.memberId || '').trim();
      var membersList = getAllMembersFromDepartments(ss);
      var currentMember = null;
      if (memberId) {
        for (var k = 0; k < membersList.length; k++) {
          if (membersList[k].id === memberId) {
            if (!currentMember) {
              currentMember = JSON.parse(JSON.stringify(membersList[k]));
            } else {
              if (membersList[k].isAdmin && !currentMember.isAdmin) {
                currentMember.isAdmin = true;
                currentMember.isShiftLeader = true;
                currentMember.chucVu = membersList[k].chucVu;
                currentMember.boMon = membersList[k].boMon;
              } else if (membersList[k].isShiftLeader && !currentMember.isShiftLeader) {
                currentMember.isShiftLeader = true;
                currentMember.chucVu = membersList[k].chucVu;
                currentMember.boMon = membersList[k].boMon;
              } else {
                currentMember.isAdmin = currentMember.isAdmin || membersList[k].isAdmin;
                currentMember.isShiftLeader = currentMember.isShiftLeader || membersList[k].isShiftLeader;
              }
              if (!currentMember.sdt && membersList[k].sdt) {
                currentMember.sdt = membersList[k].sdt;
                currentMember.ice = membersList[k].sdt;
              }
              if (!currentMember.ice && membersList[k].ice) {
                currentMember.ice = membersList[k].ice;
              }
            }
          }
        }
      }

      var tasksList = getTasksList(ss);
      var swapsList = getSwapsList(ss);
      var postsList = getPostsList(ss);
      var tombstones = getDeletedTombstones(ss);

      responseData = {
        success: true,
        member: currentMember,
        membersList: membersList,
        tasks: tasksList,
        swaps: swapsList,
        posts: postsList,
        deletedTaskIds: tombstones.taskIds,
        deletedPostIds: tombstones.postIds
      };
    }
    // 3. ĐĂNG KÝ CA TRỰC (claimTask)
    else if (action === 'claimTask') {
      var taskId = params.taskId;
      var memberId = params.memberId;
      var waitlist = params.waitlist === 'true' || params.waitlist === true;
      responseData = handleClaimTask(ss, taskId, memberId, waitlist);
    }
    // 4. XIN RÚT CA (withdrawTask)
    else if (action === 'withdrawTask') {
      var taskId = params.taskId;
      var memberId = params.memberId;
      var reason = params.reason || '';
      responseData = handleWithdrawTask(ss, taskId, memberId, reason);
    }
    // 5. ĐIỂM DANH HIỆN TRƯỜNG BẰNG QR (checkinMember)
    else if (action === 'checkinMember') {
      var taskId = params.taskId;
      var memberId = params.memberId;
      var adminId = params.adminId;
      responseData = handleCheckinMember(ss, taskId, memberId, adminId);
    }
    // 6. TẠO CA TRỰC MỚI (createTask) HOẶC ĐỒNG BỘ CA TRỰC (syncTasks)
    else if (action === 'createTask') {
      var taskObj = params.task ? parseJsonSafe(params.task, null) : params;
      responseData = handleCreateTask(ss, taskObj);
    }
    else if (action === 'syncTasks') {
      if (params.tasks) {
        var tasksArr = parseJsonSafe(params.tasks, []);
        if (Array.isArray(tasksArr)) {
          var syncCount = 0;
          for (var tIdx = 0; tIdx < tasksArr.length; tIdx++) {
            if (tasksArr[tIdx]) {
              handleCreateTask(ss, tasksArr[tIdx]);
              syncCount++;
            }
          }
          responseData = { success: true, message: 'Đã đồng bộ ' + syncCount + ' ca trực thành công!', count: syncCount };
        } else {
          responseData = handleCreateTask(ss, tasksArr);
        }
      } else {
        var singleTask = params.task ? parseJsonSafe(params.task, null) : params;
        responseData = handleCreateTask(ss, singleTask);
      }
    }
    // 7. ĐĂNG BÀI DIỄN ĐÀN (createPost)
    else if (action === 'createPost') {
      var postObj = params.post ? parseJsonSafe(params.post, null) : params;
      responseData = handleCreatePost(ss, postObj);
    }
    // 8. XÓA LỆNH ĐIỀU ĐỘNG (deleteTask)
    else if (action === 'deleteTask') {
      var taskId = params.taskId;
      responseData = handleDeleteTask(ss, taskId);
    }
    // 9. XÓA BÀI VIẾT DIỄN ĐÀN (deletePost)
    else if (action === 'deletePost') {
      var postId = params.postId;
      responseData = handleDeletePost(ss, postId);
    }
    // 10. CẬP NHẬT HỒ SƠ THÀNH VIÊN VÀ ĐỒNG BỘ GOOGLE SHEET (updateProfile)
    else if (action === 'updateProfile') {
      var memberId = params.memberId;
      var lop = params.lop;
      var sdt = params.sdt;
      var ice = params.ice;
      var yTe = params.yTe;
      responseData = handleUpdateProfile(ss, memberId, lop, sdt, ice, yTe);
    }
    // 11. CẬP NHẬT PHÂN QUYỀN ADMIN / TRƯỞNG CA (updateMemberRole)
    else if (action === 'updateMemberRole') {
      var memberId = params.memberId;
      var isAdmin = params.isAdmin === 'true' || params.isAdmin === true;
      var isShiftLeader = params.isShiftLeader === 'true' || params.isShiftLeader === true;
      var adminActorId = params.adminActorId || '';
      responseData = handleUpdateMemberRole(ss, memberId, isAdmin, isShiftLeader, adminActorId);
    }
    // 12. ĐIỀU CHỈNH SỐ CA TRỰC THỦ CÔNG CHO ADMIN (adjustMemberShifts)
    else if (action === 'adjustMemberShifts') {
      var memberId = params.memberId;
      var delta = Number(params.delta) || 0;
      var reason = params.reason || '';
      var adminActorId = params.adminActorId || '';
      responseData = handleAdjustMemberShifts(ss, memberId, delta, reason, adminActorId);
    }

  } catch(error) {
    responseData = { success: false, message: 'Lỗi máy chủ: ' + error.toString() };
  }

  return createJsonResponse(responseData);
}

/**
 * Đọc tất cả thành viên từ 7 Sheet Ban chuyên môn (Khớp 100% cấu trúc 8 cột mới)
 * Cột 1: Mã ID
 * Cột 2: Họ và Tên
 * Cột 3: Lớp
 * Cột 4: Ban chuyên môn
 * Cột 5: Chức vụ
 * Cột 6: Y tế
 * Cột 7: Số điện thoại
 * Cột 8: Liên hệ khẩn cấp
 */
function getAllMembersFromDepartments(ss) {
  var membersMap = {};
  var order = [];

  // Đọc danh sách ca trực để tính số ca hoàn thành thực tế từ Tasks sheet
  var taskSheet = ss.getSheetByName('Tasks');
  var taskCheckins = {};
  if (taskSheet) {
    try {
      var tRows = taskSheet.getDataRange().getValues();
      if (tRows.length > 1) {
        var checkColIdx = tRows[0].indexOf('checkedInMembers');
        if (checkColIdx !== -1) {
          for (var tr = 1; tr < tRows.length; tr++) {
            var cList = parseJsonSafe(tRows[tr][checkColIdx], []);
            for (var ci = 0; ci < cList.length; ci++) {
              var cId = String(cList[ci]).trim();
              taskCheckins[cId] = (taskCheckins[cId] || 0) + 1;
            }
          }
        }
      }
    } catch(tErr) {}
  }

  for (var d = 0; d < DEPARTMENT_SHEETS.length; d++) {
    var deptName = DEPARTMENT_SHEETS[d];
    var sheet = ss.getSheetByName(deptName);
    if (!sheet) continue;

    var rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) continue;

    // Header ở dòng 1: ['Mã ID', 'Họ và Tên', 'Lớp', 'Ban chuyên môn', 'Chức vụ', 'Y tế', 'Số điện thoại', 'Liên hệ khẩn cấp']
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      var id = String(r[0] || '').trim();
      var hoTen = String(r[1] || '').trim();
      if (!hoTen && !id) continue;

      var lop = String(r[2] || '').trim();
      var boMon = String(r[3] || deptName).trim();
      var chucVu = String(r[4] || 'Thành viên').trim();
      var yTe = String(r[5] || 'Bình thường').trim();
      var sdt = cleanPhone(r[6]);
      var ice = cleanPhone(r[7]) || sdt;
      var soCa = (r.length > 8 && !isNaN(Number(r[8]))) ? Number(r[8]) : 0;

      var effectiveId = id || generateMemberIdFromInfo(hoTen, '');
      var cvLower = chucVu.toLowerCase();
      var bmLower = boMon.toLowerCase();

      // Quyền Admin mặc định duy nhất: CHỈ CÓ DUY NHẤT Đỗ Mạnh Cường (DMC0806)
      var isAdmin = (effectiveId === 'DMC0806');

      var isShiftLeader = isAdmin || 
                          cvLower.indexOf('trưởng ban') !== -1 || 
                          cvLower.indexOf('phó ban') !== -1;

      if (!membersMap[effectiveId]) {
        var initialDone = soCa + (taskCheckins[effectiveId] || 0);
        membersMap[effectiveId] = {
          id: effectiveId,
          hoTen: hoTen,
          lop: lop,
          boMon: boMon || deptName,
          chucVu: chucVu,
          yTe: yTe || 'Bình thường',
          sdt: sdt,
          ice: ice,
          mssv: effectiveId,
          donVi: 'Trường Đại học Hải Dương',
          soCa: initialDone,
          soCaHoanThanh: initialDone,
          status: 'Sẵn sàng',
          theTrang: 'Khỏe mạnh (100% Sẵn sàng)',
          avatar: '',
          isAdmin: isAdmin,
          isShiftLeader: isShiftLeader,
          cacBan: [deptName]
        };
        order.push(effectiveId);
      } else {
        var existing = membersMap[effectiveId];
        if (existing.cacBan.indexOf(deptName) === -1) {
          existing.cacBan.push(deptName);
        }
        // Hợp nhất quyền hạn cán sự đa ban: luôn nâng cấp lên quyền cao nhất
        if (isAdmin && !existing.isAdmin) {
          existing.isAdmin = true;
          existing.isShiftLeader = true;
          existing.chucVu = chucVu;
          existing.boMon = boMon || deptName;
        } else if (isShiftLeader && !existing.isShiftLeader) {
          existing.isShiftLeader = true;
          existing.chucVu = chucVu;
          existing.boMon = boMon || deptName;
        } else if (existing.chucVu.toLowerCase() === 'thành viên' && cvLower !== 'thành viên') {
          existing.chucVu = chucVu;
          existing.boMon = boMon || deptName;
        }

        // Cập nhật SĐT và ICE nếu bản ghi trước đó để trống
        if (!existing.sdt && sdt) existing.sdt = sdt;
        if ((!existing.ice || existing.ice === existing.sdt) && ice) existing.ice = ice;
        if ((!existing.yTe || existing.yTe === 'Bình thường') && yTe && yTe !== 'Bình thường') existing.yTe = yTe;
        if (soCa > 0) {
          existing.soCa = (existing.soCa || 0) + soCa;
          existing.soCaHoanThanh = existing.soCa;
        }
      }
    }
  }

  // Hợp nhất quyền hạn quản trị tùy chỉnh từ Sheet AdminRoles (nếu có)
  var adminRolesSheet = ss.getSheetByName('AdminRoles');
  if (adminRolesSheet) {
    try {
      var rRows = adminRolesSheet.getDataRange().getValues();
      for (var ri = 1; ri < rRows.length; ri++) {
        var rId = String(rRows[ri][0] || '').trim();
        var rIsAdmin = rRows[ri][1];
        var rIsLeader = rRows[ri][2];
        if (rId && membersMap[rId]) {
          // Bảo vệ bất biến: DMC0806 luôn luôn là Admin mặc định
          if (rId === 'DMC0806') {
            membersMap[rId].isAdmin = true;
            membersMap[rId].isShiftLeader = true;
          } else {
            membersMap[rId].isAdmin = (rIsAdmin === true || String(rIsAdmin).toLowerCase() === 'true');
            membersMap[rId].isShiftLeader = (rIsLeader === true || String(rIsLeader).toLowerCase() === 'true');
          }
        }
      }
    } catch(rErr) {}
  }

  var mergedList = [];
  for (var k = 0; k < order.length; k++) {
    mergedList.push(membersMap[order[k]]);
  }
  return mergedList;
}

/**
 * Chuẩn hóa số điện thoại, bảo toàn số 0 ở đầu
 */
function cleanPhone(val) {
  if (!val) return '';
  var s = String(val).trim().replace(/['\s\.\-]/g, '');
  if (s.indexOf('84') === 0 && s.length >= 11) {
    s = '0' + s.substring(2);
  } else if (s.indexOf('0') !== 0 && (s.length === 9 || s.length === 10)) {
    s = '0' + s;
  }
  return s;
}

function parseJsonSafe(str, defaultVal) {
  if (!str) return defaultVal;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch(e) {
    return defaultVal;
  }
}

/**
 * Tự động tạo Mã ID chuẩn [Initials][DDMM] từ Họ tên và Ngày sinh nếu cần
 */
function generateMemberIdFromInfo(name, dob) {
  if (!name) return '';
  var s = String(name).trim();
  s = s.replace(/Đ/g, 'D').replace(/đ/g, 'd');
  try {
    s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  } catch(e) {}
  var words = s.split(/\s+/);
  var initials = '';
  for (var i = 0; i < words.length; i++) {
    if (words[i]) initials += words[i].charAt(0).toUpperCase();
  }
  
  var ddmm = '0101';
  if (dob instanceof Date) {
    ddmm = Utilities.formatDate(dob, 'Asia/Ho_Chi_Minh', 'ddMM');
  } else if (dob) {
    var m = String(dob).match(/(\d{1,2})[\/\-](\d{1,2})/);
    if (m) {
      var day = parseInt(m[1], 10);
      var month = parseInt(m[2], 10);
      ddmm = (day < 10 ? '0' + day : day) + '' + (month < 10 ? '0' + month : month);
    }
  }
  return initials + ddmm;
}

/**
 * Lấy danh sách Ca Trực
 */
function getTasksList(ss) {
  var sheet = ss.getSheetByName('Tasks');
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var headers = rows[0];
  var tasks = [];
  for (var i = 1; i < rows.length; i++) {
    var t = rowToObject(headers, rows[i]);
    t.quota = Number(t.quota) || 6;
    t.joinedMembers = parseJsonSafe(t.joinedMembers, []);
    t.assignedMembers = parseJsonSafe(t.assignedMembers, []);
    t.waitlist = parseJsonSafe(t.waitlist, []);
    t.checkedInMembers = parseJsonSafe(t.checkedInMembers, []);
    t.checkinLogs = parseJsonSafe(t.checkinLogs, []);
    t.departmentQuotas = parseJsonSafe(t.departmentQuotas, {});
    tasks.push(t);
  }
  return tasks;
}

/**
 * Lấy danh sách Đổi / Rút Ca
 */
function getSwapsList(ss) {
  var sheet = ss.getSheetByName('Swaps');
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var headers = rows[0];
  var swaps = [];
  for (var i = 1; i < rows.length; i++) {
    swaps.push(rowToObject(headers, rows[i]));
  }
  return swaps;
}

/**
 * Lấy danh sách Bài Viết Diễn Đàn
 */
function getPostsList(ss) {
  var sheet = ss.getSheetByName('Posts');
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var headers = rows[0];
  var posts = [];
  for (var i = 1; i < rows.length; i++) {
    var p = rowToObject(headers, rows[i]);
    p.likes = Number(p.likes) || 0;
    p.likedBy = parseJsonSafe(p.likedBy, []);
    p.comments = parseJsonSafe(p.comments, []);
    p.isAnonymous = (p.isAnonymous === true || String(p.isAnonymous).toLowerCase() === 'true');
    posts.push(p);
  }
  return posts;
}

function rowToObject(headers, row) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) {
    var key = String(headers[i]).trim();
    obj[key] = row[i];
  }
  return obj;
}

/**
 * Xử lý đăng ký ca trực
 */
function handleClaimTask(ss, taskId, memberId, waitlist) {
  var sheet = ss.getSheetByName('Tasks');
  if (!sheet) return { success: false, message: 'Chưa có sheet Tasks' };
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var idCol = headers.indexOf('id');
  var joinedCol = headers.indexOf('joinedMembers');
  var waitlistCol = headers.indexOf('waitlist');
  var quotaCol = headers.indexOf('quota');

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(taskId)) {
      var joined = parseJsonSafe(rows[i][joinedCol], []);
      var wait = parseJsonSafe(rows[i][waitlistCol], []);
      var quota = Number(rows[i][quotaCol]) || 6;

      if (joined.indexOf(memberId) !== -1 || wait.indexOf(memberId) !== -1) {
        return { success: false, message: 'Bạn đã đăng ký trong ca này rồi!' };
      }

      if (waitlist || joined.length >= quota) {
        wait.push(memberId);
        sheet.getRange(i + 1, waitlistCol + 1).setValue(JSON.stringify(wait));
        return { success: true, message: 'Đã vào hàng chờ dự bị!', waitlist: true };
      } else {
        joined.push(memberId);
        sheet.getRange(i + 1, joinedCol + 1).setValue(JSON.stringify(joined));
        return { success: true, message: 'Đăng ký ca trực thành công!', waitlist: false };
      }
    }
  }
  return { success: false, message: 'Không tìm thấy ca trực: ' + taskId };
}

/**
 * Xử lý rút ca trực (Tự động hoàn tác/trừ ca nếu đã được điểm danh trước đó)
 */
function handleWithdrawTask(ss, taskId, memberId, reason) {
  var sheet = ss.getSheetByName('Tasks');
  if (!sheet) return { success: false, message: 'Chưa có sheet Tasks' };
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { success: false, message: 'Không có dữ liệu ca trực' };
  var headers = rows[0];
  var idCol = headers.indexOf('id');
  var joinedCol = headers.indexOf('joinedMembers');
  var assignedCol = headers.indexOf('assignedMembers');
  var waitlistCol = headers.indexOf('waitlist');
  var checkCol = headers.indexOf('checkedInMembers');

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(taskId)) {
      var joined = joinedCol !== -1 ? parseJsonSafe(rows[i][joinedCol], []) : [];
      var assigned = assignedCol !== -1 ? parseJsonSafe(rows[i][assignedCol], []) : [];
      var wait = waitlistCol !== -1 ? parseJsonSafe(rows[i][waitlistCol], []) : [];
      var checked = checkCol !== -1 ? parseJsonSafe(rows[i][checkCol], []) : [];

      var jIdx = joined.indexOf(memberId);
      var aIdx = assigned.indexOf(memberId);
      var wIdx = wait.indexOf(memberId);
      var cIdx = checked.indexOf(memberId);

      if (jIdx === -1 && aIdx === -1 && wIdx === -1 && cIdx === -1) {
        return { success: false, message: 'Bạn chưa tham gia ca trực này' };
      }

      if (jIdx !== -1) joined.splice(jIdx, 1);
      if (aIdx !== -1) assigned.splice(aIdx, 1);
      if (wIdx !== -1) wait.splice(wIdx, 1);

      // Nếu đã được điểm danh trước đó, tự động hoàn tác/trừ lại 1 ca đã tích lũy
      if (cIdx !== -1) {
        checked.splice(cIdx, 1);
        if (checkCol !== -1) {
          sheet.getRange(i + 1, checkCol + 1).setValue(JSON.stringify(checked));
        }
        decrementMemberCompletedShifts(ss, memberId);
      }

      // Nếu có người trong hàng chờ, đôn lên vị trí chính thức
      var quota = Number(rows[i][headers.indexOf('quota')]) || 6;
      if (wait.length > 0 && (joined.length + assigned.length) < quota) {
        var promoted = wait.shift();
        joined.push(promoted);
      }

      if (joinedCol !== -1) sheet.getRange(i + 1, joinedCol + 1).setValue(JSON.stringify(joined));
      if (assignedCol !== -1) sheet.getRange(i + 1, assignedCol + 1).setValue(JSON.stringify(assigned));
      if (waitlistCol !== -1) sheet.getRange(i + 1, waitlistCol + 1).setValue(JSON.stringify(wait));

      // Ghi nhận vào Swaps sheet
      var swapsSheet = ss.getSheetByName('Swaps');
      if (swapsSheet) {
        swapsSheet.appendRow([
          'SWAP_' + Date.now(),
          taskId,
          rows[i][headers.indexOf('title')],
          memberId,
          '',
          '',
          new Date().toISOString(),
          'Đã rút ca' + (cIdx !== -1 ? ' (Sau điểm danh - Đã trừ 1 ca): ' : ': ') + reason
        ]);
      }

      SpreadsheetApp.flush();
      return { success: true, message: 'Đã rút ca trực thành công' + (cIdx !== -1 ? ' (Đã hoàn tác 1 ca hoàn thành)' : '') };
    }
  }
  return { success: false, message: 'Không tìm thấy ca trực: ' + taskId };
}

/**
 * Xử lý điểm danh hiện trường bằng QR
 */
function handleCheckinMember(ss, taskId, memberId, adminId) {
  var sheet = ss.getSheetByName('Tasks');
  if (!sheet) return { success: false, message: 'Chưa có sheet Tasks' };
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var idCol = headers.indexOf('id');
  var checkCol = headers.indexOf('checkedInMembers');
  var logsCol = headers.indexOf('checkinLogs');

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(taskId)) {
      var checked = parseJsonSafe(rows[i][checkCol], []);
      var logs = parseJsonSafe(rows[i][logsCol], []);

      if (checked.indexOf(memberId) === -1) {
        checked.push(memberId);
        logs.push({
          memberId: memberId,
          adminId: adminId,
          time: new Date().toISOString()
        });
        sheet.getRange(i + 1, checkCol + 1).setValue(JSON.stringify(checked));
        sheet.getRange(i + 1, logsCol + 1).setValue(JSON.stringify(logs));
        
        // Tăng số ca đã làm cho thành viên trong Sheet của Ban tương ứng
        incrementMemberCompletedShifts(ss, memberId);

        return { success: true, message: 'Điểm danh thành công cho: ' + memberId };
      } else {
        return { success: true, message: 'Thành viên ' + memberId + ' đã được điểm danh trước đó!' };
      }
    }
  }
  return { success: false, message: 'Không tìm thấy ca trực: ' + taskId };
}

/**
 * Tăng số ca trực hoàn thành trong sheet tương ứng (Cột 1 là Mã ID, Cột 9 là Số Ca)
 */
function incrementMemberCompletedShifts(ss, memberId) {
  for (var d = 0; d < DEPARTMENT_SHEETS.length; d++) {
    var sheet = ss.getSheetByName(DEPARTMENT_SHEETS[d]);
    if (!sheet) continue;
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === memberId) {
        var cur = (rows[i].length >= 9 && !isNaN(Number(rows[i][8]))) ? Number(rows[i][8]) : 0;
        sheet.getRange(i + 1, 9).setValue(cur + 1);
        if (rows[0].length < 9) {
          sheet.getRange(1, 9).setValue('Số ca hoàn thành').setFontWeight('bold');
        }
        return cur + 1;
      }
    }
  }
  return 0;
}

/**
 * Trừ số ca trực hoàn thành khi rút ca sau điểm danh hoặc khi Admin điều chỉnh
 */
function decrementMemberCompletedShifts(ss, memberId) {
  for (var d = 0; d < DEPARTMENT_SHEETS.length; d++) {
    var sheet = ss.getSheetByName(DEPARTMENT_SHEETS[d]);
    if (!sheet) continue;
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === memberId) {
        var cur = (rows[i].length >= 9 && !isNaN(Number(rows[i][8]))) ? Number(rows[i][8]) : 0;
        var nextVal = Math.max(0, cur - 1);
        sheet.getRange(i + 1, 9).setValue(nextVal);
        if (rows[0].length < 9) {
          sheet.getRange(1, 9).setValue('Số ca hoàn thành').setFontWeight('bold');
        }
        return nextVal;
      }
    }
  }
  return 0;
}

/**
 * Admin điều chỉnh số ca trực thủ công (+1 / -1 / tuỳ biến) cho thành viên
 */
function handleAdjustMemberShifts(ss, memberId, delta, reason, adminActorId) {
  if (!memberId) return { success: false, message: 'Thiếu mã thành viên' };
  var found = false;
  var newCount = 0;
  for (var d = 0; d < DEPARTMENT_SHEETS.length; d++) {
    var sheet = ss.getSheetByName(DEPARTMENT_SHEETS[d]);
    if (!sheet) continue;
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === memberId) {
        var cur = (rows[i].length >= 9 && !isNaN(Number(rows[i][8]))) ? Number(rows[i][8]) : 0;
        newCount = Math.max(0, cur + delta);
        sheet.getRange(i + 1, 9).setValue(newCount);
        if (rows[0].length < 9) {
          sheet.getRange(1, 9).setValue('Số ca hoàn thành').setFontWeight('bold');
        }
        found = true;
        break;
      }
    }
    if (found) break;
  }

  // Ghi nhật ký vào Swaps sheet
  var swapsSheet = ss.getSheetByName('Swaps');
  if (swapsSheet) {
    swapsSheet.appendRow([
      'ADJUST_' + Date.now(),
      'SHIFT_ADJUST',
      'Admin điều chỉnh: ' + (delta >= 0 ? '+' + delta : delta) + ' ca',
      memberId,
      adminActorId || 'Admin',
      String(newCount),
      new Date().toISOString(),
      reason || 'Điều chỉnh số ca cống hiến'
    ]);
  }

  if (found) {
    return { success: true, message: 'Đã điều chỉnh thành công! Số ca mới: ' + newCount, memberId: memberId, newShifts: newCount };
  } else {
    return { success: false, message: 'Không tìm thấy thành viên: ' + memberId };
  }
}

/**
 * Xử lý tạo mới hoặc cập nhật ca trực (Lưu vào Google Sheet Tasks)
 */
function handleCreateTask(ss, taskObj) {
  var sheet = ss.getSheetByName('Tasks');
  if (!sheet) {
    sheet = ss.insertSheet('Tasks');
  }

  var taskHeaders = ['id', 'title', 'location', 'time', 'quota', 'joinedMembers', 'assignedMembers', 'waitlist', 'leaderId', 'checkedInMembers', 'checkinLogs', 'lockDeadline', 'status', 'departmentQuotas', 'notes'];
  var rows = sheet.getDataRange().getValues();
  if (rows.length === 0 || rows[0].length === 0 || !rows[0][0]) {
    sheet.appendRow(taskHeaders);
    sheet.getRange(1, 1, 1, taskHeaders.length).setBackground('#3b0764').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    rows = [taskHeaders];
  }

  var id = (taskObj && taskObj.id) ? taskObj.id : ('TASK_' + Date.now());
  var headers = rows[0];
  var idCol = headers.indexOf('id');
  if (idCol === -1) idCol = 0;

  var rowIndex = -1;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]).trim() === String(id).trim()) {
      rowIndex = i + 1;
      break;
    }
  }

  var rowData = [
    id,
    taskObj.title || 'Ca trực mới',
    taskObj.location || 'Sân trường',
    taskObj.time || '',
    Number(taskObj.quota) || 6,
    typeof taskObj.joinedMembers === 'string' ? taskObj.joinedMembers : JSON.stringify(taskObj.joinedMembers || []),
    typeof taskObj.assignedMembers === 'string' ? taskObj.assignedMembers : JSON.stringify(taskObj.assignedMembers || []),
    typeof taskObj.waitlist === 'string' ? taskObj.waitlist : JSON.stringify(taskObj.waitlist || []),
    taskObj.leaderId || '',
    typeof taskObj.checkedInMembers === 'string' ? taskObj.checkedInMembers : JSON.stringify(taskObj.checkedInMembers || []),
    typeof taskObj.checkinLogs === 'string' ? taskObj.checkinLogs : JSON.stringify(taskObj.checkinLogs || []),
    taskObj.lockDeadline || '',
    taskObj.status || 'active',
    typeof taskObj.departmentQuotas === 'string' ? taskObj.departmentQuotas : JSON.stringify(taskObj.departmentQuotas || {}),
    taskObj.notes || ''
  ];

  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    SpreadsheetApp.flush();
    return { success: true, message: 'Cập nhật lệnh điều động thành công!', taskId: id };
  } else {
    sheet.appendRow(rowData);
    SpreadsheetApp.flush();
    return { success: true, message: 'Ban hành lệnh điều động mới thành công!', taskId: id };
  }
}

/**
 * Ghi nhận ID đã xóa vào sheet DeletedTombstones để đồng bộ hai chiều triệt để
 */
function recordDeletedTombstone(ss, id, type) {
  if (!id) return;
  try {
    var sheet = ss.getSheetByName('DeletedTombstones');
    if (!sheet) {
      sheet = ss.insertSheet('DeletedTombstones');
      sheet.appendRow(['ID', 'Type', 'DeletedAt']);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([String(id).trim(), String(type).trim(), new Date().toISOString()]);
    var lastRow = sheet.getLastRow();
    if (lastRow > 501) {
      sheet.deleteRows(2, lastRow - 501);
    }
  } catch (e) {
    Logger.log('Error recording tombstone: ' + e);
  }
}

/**
 * Lấy danh sách ID các ca trực và bài đăng đã bị xóa khỏi hệ thống
 */
function getDeletedTombstones(ss) {
  var result = { taskIds: [], postIds: [] };
  try {
    var sheet = ss.getSheetByName('DeletedTombstones');
    if (!sheet) return result;
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      var id = String(rows[i][0]).trim();
      var type = String(rows[i][1]).trim().toLowerCase();
      if (!id) continue;
      if (type === 'task') {
        if (result.taskIds.indexOf(id) === -1) result.taskIds.push(id);
      } else if (type === 'post') {
        if (result.postIds.indexOf(id) === -1) result.postIds.push(id);
      }
    }
  } catch (e) {
    Logger.log('Error reading tombstones: ' + e);
  }
  return result;
}

/**
 * Xóa vĩnh viễn lệnh điều động khỏi sheet Tasks và ghi nhận tombstone
 */
function handleDeleteTask(ss, taskId) {
  var sheet = ss.getSheetByName('Tasks');
  if (!sheet) return { success: false, message: 'Chưa có sheet Tasks' };
  recordDeletedTombstone(ss, taskId, 'task');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(taskId).trim()) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Đã xóa lệnh điều động thành công', taskId: taskId };
    }
  }
  return { success: true, message: 'Lệnh không tồn tại hoặc đã được xóa trước đó', taskId: taskId };
}

/**
 * Xóa vĩnh viễn bài đăng khỏi sheet Posts và ghi nhận tombstone
 */
function handleDeletePost(ss, postId) {
  var sheet = ss.getSheetByName('Posts');
  if (!sheet) return { success: false, message: 'Chưa có sheet Posts' };
  recordDeletedTombstone(ss, postId, 'post');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(postId).trim()) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Đã xóa bài viết diễn đàn thành công', postId: postId };
    }
  }
  return { success: true, message: 'Bài viết không tồn tại hoặc đã được xóa trước đó', postId: postId };
}

/**
 * Cập nhật thông tin cá nhân của thành viên trực tiếp vào Sheet Ban tương ứng
 */
function handleUpdateProfile(ss, memberId, lop, sdt, ice, yTe) {
  if (!memberId) return { success: false, message: 'Thiếu Mã ID thành viên' };
  var updated = false;

  for (var d = 0; d < DEPARTMENT_SHEETS.length; d++) {
    var deptName = DEPARTMENT_SHEETS[d];
    var sheet = ss.getSheetByName(deptName);
    if (!sheet) continue;
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === String(memberId).trim()) {
        if (lop !== undefined && lop !== null && String(lop).trim() !== '') {
          sheet.getRange(i + 1, 3).setValue(String(lop).trim());
        }
        if (yTe !== undefined && yTe !== null && String(yTe).trim() !== '') {
          sheet.getRange(i + 1, 6).setValue(String(yTe).trim());
        }
        if (sdt !== undefined && sdt !== null && String(sdt).trim() !== '') {
          sheet.getRange(i + 1, 7).setValue(String(sdt).trim());
        }
        if (ice !== undefined && ice !== null && String(ice).trim() !== '') {
          sheet.getRange(i + 1, 8).setValue(String(ice).trim());
        }
        updated = true;
      }
    }
  }

  if (updated) {
    var all = getAllMembersFromDepartments(ss);
    return { success: true, message: 'Đã cập nhật hồ sơ thành công vào Google Sheet', member: all.membersMap[memberId] };
  }
  return { success: false, message: 'Không tìm thấy thành viên: ' + memberId };
}

/**
 * Xử lý cập nhật quyền Admin / Trưởng ca từ xa và lưu vào Sheet AdminRoles
 */
function handleUpdateMemberRole(ss, memberId, isAdmin, isShiftLeader, adminActorId) {
  if (!memberId) {
    return { success: false, message: 'Thiếu Mã ID thành viên cần cấp quyền' };
  }

  var rolesSheet = ss.getSheetByName('AdminRoles');
  if (!rolesSheet) {
    rolesSheet = ss.insertSheet('AdminRoles');
    rolesSheet.appendRow(['memberId', 'isAdmin', 'isShiftLeader', 'updatedBy', 'updatedAt']);
    rolesSheet.getRange(1, 1, 1, 5).setBackground('#4c1d95').setFontColor('#ffffff').setFontWeight('bold');
    rolesSheet.setFrozenRows(1);
  }

  var rRows = rolesSheet.getDataRange().getValues();
  var foundRowIdx = -1;
  for (var i = 1; i < rRows.length; i++) {
    if (String(rRows[i][0] || '').trim() === memberId) {
      foundRowIdx = i + 1;
      break;
    }
  }

  var now = new Date().toISOString();
  if (foundRowIdx !== -1) {
    rolesSheet.getRange(foundRowIdx, 2, 1, 4).setValues([[isAdmin, isShiftLeader, adminActorId, now]]);
  } else {
    rolesSheet.appendRow([memberId, isAdmin, isShiftLeader, adminActorId, now]);
  }

  SpreadsheetApp.flush();
  return {
    success: true,
    message: 'Đã cập nhật phân quyền thành công cho ' + memberId,
    memberId: memberId,
    isAdmin: isAdmin,
    isShiftLeader: isShiftLeader
  };
}

/**
 * Xử lý tạo bài viết diễn đàn mới
 */
function handleCreatePost(ss, postObj) {
  var sheet = ss.getSheetByName('Posts');
  if (!sheet) return { success: false, message: 'Chưa có sheet Posts' };

  var id = postObj.id || ('POST_' + Date.now());
  sheet.appendRow([
    id,
    postObj.authorId || '',
    postObj.authorName || 'Thành viên',
    postObj.authorRole || '',
    postObj.authorAvatar || '',
    postObj.content || '',
    postObj.image || '',
    new Date().toISOString(),
    0,
    '[]',
    '[]',
    postObj.isAnonymous ? 'TRUE' : 'FALSE'
  ]);

  return { success: true, message: 'Đăng bài viết thành công!', postId: id };
}

/**
 * ==============================================================================
 * HÀM KHỞI TẠO VÀ DỌN DẸP TOÀN BỘ CƠ SỞ DỮ LIỆU MULTI-SHEET CHUẨN 8 CỘT
 * Chạy hàm này một lần duy nhất từ menu Trình chỉnh sửa Apps Script
 * ==============================================================================
 */
function setupMultiSheetDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var header = ['Mã ID', 'Họ và Tên', 'Lớp', 'Ban chuyên môn', 'Chức vụ', 'Y tế', 'Số điện thoại', 'Liên hệ khẩn cấp'];
  var totalSeeded = 0;

  // 1. Khởi tạo 7 Sheet Ban chuyên môn chuẩn 8 cột
  for (var d = 0; d < DEPARTMENT_SHEETS.length; d++) {
    var deptName = DEPARTMENT_SHEETS[d];
    var sheet = ss.getSheetByName(deptName);
    if (!sheet) {
      sheet = ss.insertSheet(deptName);
    }
    sheet.clear();

    // Thiết lập Header thẩm mỹ Navy sang trọng
    sheet.appendRow(header);
    var headerRange = sheet.getRange(1, 1, 1, header.length);
    headerRange.setBackground('#0f172a'); // Navy đậm sang trọng
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    headerRange.setFontSize(11);
    sheet.setRowHeight(1, 30);
    sheet.setFrozenRows(1);

    // Lấy dữ liệu thành viên của Ban
    var members = SEED_DATA[deptName] || [];
    if (members.length > 0) {
      var rows = [];
      for (var m = 0; m < members.length; m++) {
        var mem = members[m];
        var sdtStr = mem.sdt ? ("'" + mem.sdt) : "";
        var iceStr = mem.ice ? ("'" + mem.ice) : (mem.sdt ? ("'" + mem.sdt) : "");
        rows.push([
          mem.id,
          mem.hoTen,
          mem.lop,
          deptName,
          mem.chucVu,
          mem.yTe || 'Bình thường',
          sdtStr,
          iceStr
        ]);
      }
      sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);

      // Căn chỉnh giao diện đẹp mắt
      sheet.getRange(2, 1, rows.length, 1).setHorizontalAlignment('center').setFontColor('#0369a1').setFontWeight('bold');
      sheet.getRange(2, 2, rows.length, 1).setHorizontalAlignment('left').setFontWeight('bold');
      sheet.getRange(2, 3, rows.length, 1).setHorizontalAlignment('center');
      sheet.getRange(2, 4, rows.length, 2).setHorizontalAlignment('left');
      sheet.getRange(2, 6, rows.length, 1).setHorizontalAlignment('center');
      sheet.getRange(2, 7, rows.length, 1).setHorizontalAlignment('center').setFontColor('#047857').setFontWeight('bold');
      sheet.getRange(2, 8, rows.length, 1).setHorizontalAlignment('center').setFontColor('#be123c').setFontWeight('bold');

      totalSeeded += rows.length;
    }

    // Định dạng Text @ cho toàn bộ các cột để người dùng thêm dòng sau không bị mất số 0
    sheet.getRange('A:A').setNumberFormat('@');
    sheet.getRange('B:B').setNumberFormat('@');
    sheet.getRange('C:C').setNumberFormat('@');
    sheet.getRange('D:D').setNumberFormat('@');
    sheet.getRange('E:E').setNumberFormat('@');
    sheet.getRange('F:F').setNumberFormat('@');
    sheet.getRange('G:G').setNumberFormat('@');
    sheet.getRange('H:H').setNumberFormat('@');

    // Đặt độ rộng cột tiêu chuẩn cho máy tính và điện thoại
    sheet.setColumnWidth(1, 110); // Mã ID
    sheet.setColumnWidth(2, 190); // Họ và Tên
    sheet.setColumnWidth(3, 130); // Lớp
    sheet.setColumnWidth(4, 160); // Ban chuyên môn
    sheet.setColumnWidth(5, 170); // Chức vụ
    sheet.setColumnWidth(6, 130); // Y tế
    sheet.setColumnWidth(7, 140); // SĐT
    sheet.setColumnWidth(8, 150); // Liên hệ khẩn cấp
  }

  // 2. Khởi tạo 3 Sheet Nghiệp vụ App (Tasks, Swaps, Posts)
  var taskSheet = ss.getSheetByName('Tasks');
  if (!taskSheet) taskSheet = ss.insertSheet('Tasks');
  taskSheet.clear();
  var taskHeaders = ['id', 'title', 'location', 'time', 'quota', 'joinedMembers', 'assignedMembers', 'waitlist', 'leaderId', 'checkedInMembers', 'checkinLogs', 'lockDeadline', 'status', 'departmentQuotas', 'notes'];
  taskSheet.appendRow(taskHeaders);
  taskSheet.getRange(1, 1, 1, taskHeaders.length).setBackground('#3b0764').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  taskSheet.setFrozenRows(1);
  taskSheet.appendRow([
    'TASK_01',
    'Trực bàn giải Cầu lông - Tân Sinh Viên K16',
    'Nhà Thi Đấu ĐH Hải Dương',
    '14:00 - 18:00 Thứ Bảy',
    6,
    JSON.stringify(['DMC0806', 'DDH1011']),
    '[]',
    JSON.stringify(['TCT0803']),
    'LDH0912',
    '[]',
    '[]',
    '2026-10-25T14:00',
    'active',
    JSON.stringify({ 'Ban Cầu Lông': 2, 'Ban Bóng Chuyền': 2, 'Ban Truyền Thông': 2 }),
    'Trang phục CLB chỉnh tề, mang theo bảng điểm và còi'
  ]);
  taskSheet.appendRow([
    'TASK_02',
    'Hậu cần & Điều phối Giải Bóng Đá Nam Vòng Bảng',
    'Sân Bóng Cỏ Nhân Tạo ĐH Hải Dương',
    '08:00 - 11:30 Chủ Nhật',
    4,
    JSON.stringify(['LDH0912']),
    '[]',
    '[]',
    'DMC0806',
    '[]',
    '[]',
    '2026-10-26T08:00',
    'active',
    JSON.stringify({ 'Ban Bóng Đá Nam': 2, 'Ban Truyền Thông': 2 }),
    'Kiểm tra bóng thi đấu và nước uống cho 2 đội trước giờ bóng lăn'
  ]);

  var swapSheet = ss.getSheetByName('Swaps');
  if (!swapSheet) swapSheet = ss.insertSheet('Swaps');
  swapSheet.clear();
  var swapHeaders = ['id', 'taskId', 'taskTitle', 'fromMemberId', 'fromMemberName', 'toMemberId', 'createdAt', 'status'];
  swapSheet.appendRow(swapHeaders);
  swapSheet.getRange(1, 1, 1, swapHeaders.length).setBackground('#78350f').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  swapSheet.setFrozenRows(1);

  var postSheet = ss.getSheetByName('Posts');
  if (!postSheet) postSheet = ss.insertSheet('Posts');
  postSheet.clear();
  var postHeaders = ['id', 'authorId', 'authorName', 'authorRole', 'authorAvatar', 'content', 'image', 'createdAt', 'likes', 'likedBy', 'comments', 'isAnonymous'];
  postSheet.appendRow(postHeaders);
  postSheet.getRange(1, 1, 1, postHeaders.length).setBackground('#064e3b').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  postSheet.setFrozenRows(1);
  postSheet.appendRow([
    'POST_01',
    'DMC0806',
    'Đỗ Mạnh Cường',
    'Trưởng ban nhân sự',
    '',
    'Chào mừng các bạn đến với hệ thống điều phối thẻ số CLB Thể Thao ĐH Hải Dương! Toàn bộ Mã ID đã được đồng bộ chuẩn hóa theo tên và ngày sinh DDMM.',
    '',
    new Date().toISOString(),
    12,
    JSON.stringify(['LDH0912', 'DDH1011', 'TCT0803']),
    JSON.stringify([{ id: 'CMT_01', authorId: 'LDH0912', authorName: 'Lương Đình Hiếu', text: 'Ban Cầu Lông đã sẵn sàng cho giải đấu sắp tới rồi anh Cường ơi!', time: '10:15', replies: [] }]),
    'FALSE'
  ]);

  // 3. Xóa bỏ sheet mặc định 'Trang tính1' hoặc 'Sheet1' nếu còn tồn tại
  var allSheets = ss.getSheets();
  var keepSheets = DEPARTMENT_SHEETS.concat(APP_SHEETS);
  for (var k = 0; k < allSheets.length; k++) {
    var sName = allSheets[k].getName();
    if (keepSheets.indexOf(sName) === -1 && allSheets.length > keepSheets.length) {
      try {
        ss.deleteSheet(allSheets[k]);
      } catch(err) {}
    }
  }

  SpreadsheetApp.flush();
  Logger.log('Đã hoàn tất dọn dẹp và khởi tạo thành công ' + totalSeeded + ' thành viên chuẩn 8 cột vào 7 sheet ban!');
}
