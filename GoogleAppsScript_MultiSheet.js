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
 * 6. Ban Cầu Lông (1 thành viên)
 * 7. Ban Truyền Thông (11 thành viên)
 * + Tasks (Ca trực)
 * + Swaps (Đổi/Rút ca)
 * + Posts (Diễn đàn)
 *
 * TÍNH NĂNG ĐẶC BIỆT:
 * - Giữ nguyên các Sheet từng Ban để dễ dàng quản lý, xem danh sách và thống kê.
 * - Thêm thành viên mới: Chỉ cần nhập dòng mới vào Sheet của Ban tương ứng,
 *   ứng dụng di động tự động nhận diện ngay lập tức mà không cần sửa code!
 * - Hàm `setupMultiSheetDatabase()`: Tự động dọn dẹp, tạo chuẩn 7 ban và điền sẵn
 *   toàn bộ 124 thành viên chuẩn 100%, bảo toàn số 0 ở đầu SĐT ('0xxxxxxxxx).
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
      "stt": 1,
      "id": "BCN01",
      "hoTen": "Nguyễn Tiến Duy",
      "ngaySinh": "21/08/2004",
      "chucVu": "Phó chủ nhiệm",
      "lop": "K13A.SPTOAN",
      "sdt": "0399757027",
      "khoa": "Toán và KHTN"
    },
    {
      "stt": 2,
      "id": "BCN02",
      "hoTen": "Lương Đình Hiếu",
      "ngaySinh": "09/12/2004",
      "chucVu": "Trưởng ban cầu lông",
      "lop": "K13.GDTC",
      "sdt": "0787246014",
      "khoa": "N-H-TD"
    },
    {
      "stt": 3,
      "id": "BCN03",
      "hoTen": "Nguyễn Lê Hoàng",
      "ngaySinh": "13/12/2005",
      "chucVu": "Phó chủ nhiệm",
      "lop": "K13-GDTC",
      "sdt": "0827055999",
      "khoa": "N-H-TD"
    },
    {
      "stt": 4,
      "id": "BCN04",
      "hoTen": "Tào Thị Tuyết Linh",
      "ngaySinh": "18/05/2007",
      "chucVu": "Trưởng ban truyền thông",
      "lop": "K15D.GDTH",
      "sdt": "0394828197",
      "khoa": "GDTH"
    },
    {
      "stt": 5,
      "id": "BCN05",
      "hoTen": "Hoàng Duy Phong",
      "ngaySinh": "21/06/2005",
      "chucVu": "Tổng thư ký",
      "lop": "K13B.SPTOAN",
      "sdt": "0971466280",
      "khoa": "Toán & KHTN"
    },
    {
      "stt": 6,
      "id": "BCN06",
      "hoTen": "Triệu Chiến Thái",
      "ngaySinh": "08/03/2004",
      "chucVu": "Trưởng ban Bóng Chuyền",
      "lop": "K13.SPLS",
      "sdt": "0354269904",
      "khoa": "Ngữ Văn-KHXH"
    },
    {
      "stt": 7,
      "id": "BCN07",
      "hoTen": "Trần Văn Tiệp",
      "ngaySinh": "30/06/2002",
      "chucVu": "Chủ nhiệm clb",
      "lop": "K13-GDTC",
      "sdt": "082214976",
      "khoa": "N-H-TD"
    },
    {
      "stt": 8,
      "id": "BCN08",
      "hoTen": "Lương Nhật Tân",
      "ngaySinh": "18/05/2005",
      "chucVu": "Thủ quỹ",
      "lop": "K13-GDTC",
      "sdt": "0822131805",
      "khoa": "N-H-TD"
    },
    {
      "stt": 9,
      "id": "BCN09",
      "hoTen": "Ngô Quang Đoàn",
      "ngaySinh": "15/09/2001",
      "chucVu": "Trưởng ban bóng đá nam",
      "lop": "K15C.GDTC",
      "sdt": "0867322795",
      "khoa": "N-H-TD"
    }
  ],
  "Ban Nhân Sự": [
    {
      "stt": 1,
      "id": "NS01",
      "hoTen": "Đỗ Mạnh Cường",
      "ngaySinh": "10/06/2003",
      "chucVu": "Trưởng ban nhân sự",
      "lop": "K13.GDTC",
      "sdt": "0963230064",
      "khoa": "N-H-TD"
    },
    {
      "stt": 2,
      "id": "NS02",
      "hoTen": "Nguyễn Hoài Nam",
      "ngaySinh": "15/02/2005",
      "chucVu": "Phó ban nhân sự",
      "lop": "K13B.SPToan",
      "sdt": "0385202407",
      "khoa": "Toán & KHTN"
    },
    {
      "stt": 3,
      "id": "NS03",
      "hoTen": "Nguyễn Thị Diệu Linh",
      "ngaySinh": "03/03/2007",
      "chucVu": "Phó ban nhân sự",
      "lop": "K15A.GDTH",
      "sdt": "0967182101",
      "khoa": "GDTH"
    }
  ],
  "Ban Bóng Chuyền": [
    {
      "stt": 1,
      "id": "BC01",
      "hoTen": "Nguyễn Long An",
      "ngaySinh": "06/11/2004",
      "chucVu": "Thành viên",
      "lop": "K12NNA",
      "sdt": "",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 2,
      "id": "BC02",
      "hoTen": "Nguyễn Đức Anh",
      "ngaySinh": "04/07/2008",
      "chucVu": "Thành viên",
      "lop": "K16-KHTN",
      "sdt": "0862020080",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 3,
      "id": "BC03",
      "hoTen": "Trần Minh Anh",
      "ngaySinh": "18/12/2007",
      "chucVu": "Thành viên",
      "lop": "K15B.GDTH",
      "sdt": "0862231812",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 4,
      "id": "BC04",
      "hoTen": "Lò Thị Thảo Biên",
      "ngaySinh": "28/10/2007",
      "chucVu": "Thành viên",
      "lop": "K15C.GDTH",
      "sdt": "0333014010",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 5,
      "id": "BC05",
      "hoTen": "Vương Hoàng Bắc",
      "ngaySinh": "02/01/2008",
      "chucVu": "Thành Viên",
      "lop": "K16B.GDTC",
      "sdt": "0356749335",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 6,
      "id": "BC06",
      "hoTen": "Bùi Thu Cúc",
      "ngaySinh": "29/07/2008",
      "chucVu": "Thành viên",
      "lop": "K16A.SPDIA",
      "sdt": "0362105729",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 7,
      "id": "BC07",
      "hoTen": "Tòng Phương Duy",
      "ngaySinh": "28/09/2006",
      "chucVu": "Phó ban chuyên môn",
      "lop": "K15C-GDTH",
      "sdt": "0829782899",
      "khoa": "GDTH"
    },
    {
      "stt": 8,
      "id": "BC08",
      "hoTen": "Hà Đức Dũng",
      "ngaySinh": "23/02/2008",
      "chucVu": "Thành viên",
      "lop": "K16A.GDTC",
      "sdt": "0338578667",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 9,
      "id": "BC09",
      "hoTen": "Trần Tiến Dũng",
      "ngaySinh": "03/02/2008",
      "chucVu": "Thành viên",
      "lop": "K16.GDTC",
      "sdt": "0342344521",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 10,
      "id": "BC10",
      "hoTen": "Bùi Trịnh Dương",
      "ngaySinh": "24/11/2008",
      "chucVu": "Thành viên",
      "lop": "K16. QTDVDL",
      "sdt": "0374136827",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 11,
      "id": "BC11",
      "hoTen": "Hoàng Châu Thái Dương",
      "ngaySinh": "12/07/2007",
      "chucVu": "Thành viên",
      "lop": "K15C.GDTH",
      "sdt": "0366289127",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 12,
      "id": "BC12",
      "hoTen": "Đinh Thị Bình Dương",
      "ngaySinh": "30/08/2006",
      "chucVu": "Thành viên",
      "lop": "K48C-GDMN",
      "sdt": "0382247405",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 13,
      "id": "BC13",
      "hoTen": "Trương Thị Hà Giang",
      "ngaySinh": "18/03/2008",
      "chucVu": "Thành viên",
      "lop": "K16.Sp Toán",
      "sdt": "0862394839",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 14,
      "id": "BC14",
      "hoTen": "Phạm Minh Hiếu",
      "ngaySinh": "22/11/2008",
      "chucVu": "Thành viên",
      "lop": "K16A.GDTC",
      "sdt": "0865789135",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 15,
      "id": "BC15",
      "hoTen": "Nguyễn Thị Thanh Hoa",
      "ngaySinh": "04/03/2007",
      "chucVu": "Thành viên",
      "lop": "K15B.GDTH",
      "sdt": "0353992007",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 16,
      "id": "BC16",
      "hoTen": "Ma Công Hoàng",
      "ngaySinh": "03/12/2006",
      "chucVu": "Thành viên",
      "lop": "K14.GDTC",
      "sdt": "0325481411",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 17,
      "id": "BC17",
      "hoTen": "Lê Minh Hùng",
      "ngaySinh": "02/08/2002",
      "chucVu": "Thành viên",
      "lop": "K16A.GDTC",
      "sdt": "0837430777",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 18,
      "id": "BC18",
      "hoTen": "Phạm Thị Hạnh",
      "ngaySinh": "24/09/2008",
      "chucVu": "Thành viên",
      "lop": "K16.GDTC",
      "sdt": "0392736086",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 19,
      "id": "BC19",
      "hoTen": "Đinh Minh Hằng",
      "ngaySinh": "25/10/2008",
      "chucVu": "Thành viên",
      "lop": "K16B.VAN",
      "sdt": "0985983840",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 20,
      "id": "BC20",
      "hoTen": "Trần Công Kiên",
      "ngaySinh": "06/03/2006",
      "chucVu": "Thành viên",
      "lop": "K14- GDTC",
      "sdt": "0357397824",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 21,
      "id": "BC21",
      "hoTen": "Trịnh Thị Lan",
      "ngaySinh": "31/08/2008",
      "chucVu": "Thành viên",
      "lop": "K16A.GDTH",
      "sdt": "0369375145",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 22,
      "id": "BC22",
      "hoTen": "Hà Khánh Linh",
      "ngaySinh": "21/04/2008",
      "chucVu": "Thành viên",
      "lop": "K16D.GDTH",
      "sdt": "0982471505",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 23,
      "id": "BC23",
      "hoTen": "Vũ Thị Thuỳ Linh",
      "ngaySinh": "10/12/2008",
      "chucVu": "Thành viên",
      "lop": "K49.GDMN",
      "sdt": "0347515236",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 24,
      "id": "BC24",
      "hoTen": "Đỗ Hiền Linh",
      "ngaySinh": "30/05/2005",
      "chucVu": "Thành viên",
      "lop": "K13A-SPAnh",
      "sdt": "0386159238",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 25,
      "id": "BC25",
      "hoTen": "Giàng Văn Long",
      "ngaySinh": "19/11/2007",
      "chucVu": "Thành viên",
      "lop": "K16.SP Địa",
      "sdt": "0372084594",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 26,
      "id": "BC26",
      "hoTen": "Lê Thị Hồng Minh",
      "ngaySinh": "08/03/2005",
      "chucVu": "Phó ban truyền thông",
      "lop": "K13E.GDTH",
      "sdt": "0829488725",
      "khoa": "GDTH"
    },
    {
      "stt": 27,
      "id": "BC27",
      "hoTen": "Lê Thảo Nhi",
      "ngaySinh": "12/07/2008",
      "chucVu": "Thành viên",
      "lop": "K16.SP Hoá",
      "sdt": "0917775464",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 28,
      "id": "BC28",
      "hoTen": "Trần Thị Yến Nhi",
      "ngaySinh": "21/11/2007",
      "chucVu": "Thành viên",
      "lop": "K15A. SP Toán",
      "sdt": "0988473222",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 29,
      "id": "BC29",
      "hoTen": "Nguyễn Phương Như",
      "ngaySinh": "23/09/2008",
      "chucVu": "Thành viên",
      "lop": "K16A.GDTC",
      "sdt": "0936536859",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 30,
      "id": "BC30",
      "hoTen": "Nguyễn Thị Kim Oanh",
      "ngaySinh": "19/01/2008",
      "chucVu": "Thành viên",
      "lop": "k16B. spvăn",
      "sdt": "0334337410",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 31,
      "id": "BC31",
      "hoTen": "Hoàng Duy Phong",
      "ngaySinh": "21/06/2005",
      "chucVu": "Thành viên",
      "lop": "K13B.SPTOAN",
      "sdt": "0971466280",
      "khoa": "Toán & KHTN"
    },
    {
      "stt": 32,
      "id": "BC32",
      "hoTen": "Lê Minh Phong",
      "ngaySinh": "03/08/2007",
      "chucVu": "Thành viên",
      "lop": "k15A-SPVL",
      "sdt": "0971154906",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 33,
      "id": "BC33",
      "hoTen": "Đặng Thanh Phong",
      "ngaySinh": "22/03/2007",
      "chucVu": "Thành viên",
      "lop": "K15A.CNTT",
      "sdt": "0564067036",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 34,
      "id": "BC34",
      "hoTen": "Đặng Hữu Quốc Pháp",
      "ngaySinh": "20/04/2007",
      "chucVu": "Thành viên",
      "lop": "K16A.SPDIA",
      "sdt": "0356869620",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 35,
      "id": "BC35",
      "hoTen": "Hồ Tấn Phát",
      "ngaySinh": "16/08/2007",
      "chucVu": "Thành viên",
      "lop": "K15.SPKHTN",
      "sdt": "0369724633",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 36,
      "id": "BC36",
      "hoTen": "Đinh Hồng Phú",
      "ngaySinh": "25/10/2008",
      "chucVu": "Thành viên",
      "lop": "K16.SP Tin",
      "sdt": "0962107151",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 37,
      "id": "BC37",
      "hoTen": "Trần Cao Sơn",
      "ngaySinh": "12/06/2008",
      "chucVu": "Thành viên",
      "lop": "K16A.GDTC",
      "sdt": "0862384582",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 38,
      "id": "BC38",
      "hoTen": "Lê Thị Tâm Thanh",
      "ngaySinh": "02/10/2008",
      "chucVu": "Thành viên",
      "lop": "K16A.GDTH",
      "sdt": "0334741502",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 39,
      "id": "BC39",
      "hoTen": "Ma Thị Thuyết",
      "ngaySinh": "25/08/2007",
      "chucVu": "Thành viên",
      "lop": "K15A.GDMN",
      "sdt": "0833226289",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 40,
      "id": "BC40",
      "hoTen": "Triệu Chiến Thái",
      "ngaySinh": "03/08/2004",
      "chucVu": "Trưởng ban Bóng chuyền",
      "lop": "K13.SPLSU",
      "sdt": "0354269904",
      "khoa": "Ngữ Văn-KHXH"
    },
    {
      "stt": 41,
      "id": "BC41",
      "hoTen": "Bùi Anh Thương",
      "ngaySinh": "10/03/2007",
      "chucVu": "Thành viên",
      "lop": "K15C.GDTH",
      "sdt": "0349403164",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 42,
      "id": "BC42",
      "hoTen": "Hà Thị Phương Thảo",
      "ngaySinh": "17/09/2007",
      "chucVu": "Thành viên",
      "lop": "K15C.GDTH",
      "sdt": "0988852507",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 43,
      "id": "BC43",
      "hoTen": "Kiều Vũ Hồng Thảo",
      "ngaySinh": "22/07/2007",
      "chucVu": "Thành viên",
      "lop": "K15A.SP Toán",
      "sdt": "0867733592",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 44,
      "id": "BC44",
      "hoTen": "Phùng Minh Thảo",
      "ngaySinh": "19/08/2007",
      "chucVu": "Thành viên",
      "lop": "K15C.SPVAN",
      "sdt": "0386616269",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 45,
      "id": "BC45",
      "hoTen": "Lò Ngọc Thế",
      "ngaySinh": "21/08/2007",
      "chucVu": "Thành viên",
      "lop": "K15A.KTD",
      "sdt": "0914270871",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 46,
      "id": "BC46",
      "hoTen": "Mai Thị Trang",
      "ngaySinh": "12/09/2007",
      "chucVu": "Thành viên",
      "lop": "K15B.GDTH",
      "sdt": "0397056215",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 47,
      "id": "BC47",
      "hoTen": "Sầm Thị Quỳnh Trang",
      "ngaySinh": "20/11/2007",
      "chucVu": "Thành viên",
      "lop": "K15A. SP DIA LI",
      "sdt": "0795110756",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 48,
      "id": "BC48",
      "hoTen": "Hoàng Ngọc Trâm",
      "ngaySinh": "17/06/2008",
      "chucVu": "Thành viên",
      "lop": "K16A.SPANH",
      "sdt": "0962425044",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 49,
      "id": "BC49",
      "hoTen": "Hờ Bá Trưởng",
      "ngaySinh": "25/10/2007",
      "chucVu": "Thành viên",
      "lop": "K15B-SPTOAN",
      "sdt": "0347598476",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 50,
      "id": "BC50",
      "hoTen": "Trần Mạnh Tuấn",
      "ngaySinh": "14/04/2004",
      "chucVu": "Thành viên",
      "lop": "K15B-GDTC",
      "sdt": "0877661191",
      "khoa": "N-H-TD"
    },
    {
      "stt": 51,
      "id": "BC51",
      "hoTen": "Nguyễn Như Tài",
      "ngaySinh": "30/09/2008",
      "chucVu": "Thành viên",
      "lop": "K16.GDTC",
      "sdt": "0968580853",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 52,
      "id": "BC52",
      "hoTen": "Trần Văn Tài",
      "ngaySinh": "09/12/2007",
      "chucVu": "Thành viên",
      "lop": "K15D.GDTH",
      "sdt": "0965554923",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 53,
      "id": "BC53",
      "hoTen": "Vì Quang Tạo",
      "ngaySinh": "12/04/2005",
      "chucVu": "Thành Viên",
      "lop": "K14 CNTT",
      "sdt": "0393224983",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 54,
      "id": "BC54",
      "hoTen": "Nguyễn Thị Thảo Vân",
      "ngaySinh": "23/08/2007",
      "chucVu": "Thành viên",
      "lop": "K15B.GDTH",
      "sdt": "0856076668",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 55,
      "id": "BC55",
      "hoTen": "Mai Thế Đăng",
      "ngaySinh": "02/12/2007",
      "chucVu": "Thành viên",
      "lop": "K15A-SPVL",
      "sdt": "0399732007",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 56,
      "id": "BC56",
      "hoTen": "Lường Thành Đạt",
      "ngaySinh": "14/09/2003",
      "chucVu": "Thành viên",
      "lop": "K14.GDMN.VHVL",
      "sdt": "0339416044",
      "khoa": "ĐH Tây Bắc"
    }
  ],
  "Ban Bóng Đá Nam": [
    {
      "stt": 1,
      "id": "BDN01",
      "hoTen": "Ngô Quốc An",
      "ngaySinh": "13/02/2007",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "k15A-GDTC",
      "sdt": "0789377952",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 2,
      "id": "BDN02",
      "hoTen": "Phạm Tuấn Anh",
      "ngaySinh": "08/08/2007",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K15A GDTC",
      "sdt": "0385202407",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 3,
      "id": "BDN03",
      "hoTen": "Đoàn Phan Anh",
      "ngaySinh": "17/11/2008",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K16A.CĐT",
      "sdt": "0835122299",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 4,
      "id": "BDN04",
      "hoTen": "Lê Minh Chiến",
      "ngaySinh": "08/01/2007",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K15A.GDTC",
      "sdt": "0963230064",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 5,
      "id": "BDN05",
      "hoTen": "Đặng Duy Cương",
      "ngaySinh": "30/07/2008",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K16A QTKD",
      "sdt": "0931762637",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 6,
      "id": "BDN06",
      "hoTen": "Trần Mạnh Hà",
      "ngaySinh": "01/03/2007",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K15A.Kinh tế",
      "sdt": "0912491307",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 7,
      "id": "BDN07",
      "hoTen": "Đặng Văn Hùng",
      "ngaySinh": "13/03/2008",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K16B-GDTC",
      "sdt": "0364917959",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 8,
      "id": "BDN08",
      "hoTen": "Nguyễn Gia Hưng",
      "ngaySinh": "01/08/2008",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K16A-CDT",
      "sdt": "0972789358",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 9,
      "id": "BDN09",
      "hoTen": "Lê Văn Hướng",
      "ngaySinh": "18/10/2008",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K16B-CDT",
      "sdt": "0912296068",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 10,
      "id": "BDN10",
      "hoTen": "Cao Sơn Hải",
      "ngaySinh": "11/02/2007",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K15C.GDTC",
      "sdt": "0981482364",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 11,
      "id": "BDN11",
      "hoTen": "Vũ Ngọc Hải",
      "ngaySinh": "09/02/2008",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K16A.GDTC",
      "sdt": "0982091671",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 12,
      "id": "BDN12",
      "hoTen": "Trần Văn Long",
      "ngaySinh": "14/08/2007",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K15A-GDTC",
      "sdt": "0936864936",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 13,
      "id": "BDN13",
      "hoTen": "Lưu Hữu Thiện Nhân",
      "ngaySinh": "29/02/2008",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "k16A.GDTC",
      "sdt": "0916173056",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 14,
      "id": "BDN14",
      "hoTen": "Vũ Kim Phúc",
      "ngaySinh": "03/10/2007",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K15A-KTĐ",
      "sdt": "0977323116",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 15,
      "id": "BDN15",
      "hoTen": "Bùi Việt Quang",
      "ngaySinh": "30/09/2007",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K16B-GDTC",
      "sdt": "0364036198",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 16,
      "id": "BDN16",
      "hoTen": "Vũ Văn Minh Quân",
      "ngaySinh": "18/09/2007",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K15A.GDTC",
      "sdt": "0393902677",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 17,
      "id": "BDN17",
      "hoTen": "Nguyễn Quang Thắng",
      "ngaySinh": "11/12/2008",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K16A.GDTC",
      "sdt": "0395662248",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 18,
      "id": "BDN18",
      "hoTen": "Nguyễn Anh Tuấn",
      "ngaySinh": "04/08/2007",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K16A.SPDIA",
      "sdt": "0329055362",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 19,
      "id": "BDN19",
      "hoTen": "Trần Mạnh Tuấn",
      "ngaySinh": "14/04/2004",
      "chucVu": "Phó Ban",
      "lop": "K15B.GDTC",
      "sdt": "0877661191",
      "khoa": "N-H-TD"
    },
    {
      "stt": 20,
      "id": "BDN20",
      "hoTen": "Ngô Quang Đoàn",
      "ngaySinh": "15/09/2001",
      "chucVu": "Trưởng ban bóng đá nam",
      "lop": "K15C.GDTC",
      "sdt": "0867322795",
      "khoa": "N-H-TD"
    },
    {
      "stt": 21,
      "id": "BDN21",
      "hoTen": "Chu Minh Đức",
      "ngaySinh": "04/02/2007",
      "chucVu": "thành viên ban bóng đá",
      "lop": "k15A-GDTC",
      "sdt": "0394594078",
      "khoa": "ĐH Tây Bắc"
    }
  ],
  "Ban Bóng Đá Nữ": [
    {
      "stt": 1,
      "id": "BDNU01",
      "hoTen": "Trần Phương Cúc",
      "ngaySinh": "11/07/2007",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K15ASPSU",
      "sdt": "0868208922",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 2,
      "id": "BDNU02",
      "hoTen": "Đồng Thanh Hiền",
      "ngaySinh": "01/11/2007",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K15C SPTOAN",
      "sdt": "0398509120",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 3,
      "id": "BDNU03",
      "hoTen": "Nguyễn Thị Ngọc Huyền",
      "ngaySinh": "19/12/2006",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K14B.NNA",
      "sdt": "0982636974",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 4,
      "id": "BDNU04",
      "hoTen": "Nguyễn Trần Huyền Hạnh",
      "ngaySinh": "14/01/2006",
      "chucVu": "Thành viên bóng đá nữ",
      "lop": "K14C.GDTH",
      "sdt": "0915748614",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 5,
      "id": "BDNU05",
      "hoTen": "Phạm Thị Hạnh",
      "ngaySinh": "24/09/2008",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K16A.GDTC",
      "sdt": "0392736086",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 6,
      "id": "BDNU06",
      "hoTen": "Nguyễn Thị Lâm Hằng",
      "ngaySinh": "12/03/2007",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K15B.KT",
      "sdt": "0373256635",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 7,
      "id": "BDNU07",
      "hoTen": "Lê Thị Kim Khánh",
      "ngaySinh": "25/04/2008",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K16B-GDTC",
      "sdt": "0348135923",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 8,
      "id": "BDNU08",
      "hoTen": "Lương Thanh Lam",
      "ngaySinh": "09/02/2008",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "k16. SP Hoá",
      "sdt": "0829262712",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 9,
      "id": "BDNU09",
      "hoTen": "Nguyễn Thị Linh",
      "ngaySinh": "09/12/2008",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K16B-NNA",
      "sdt": "0335402186",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 10,
      "id": "BDNU10",
      "hoTen": "Tào Thị Tuyết Linh",
      "ngaySinh": "18/05/2007",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K15D.GDTH",
      "sdt": "0394828197",
      "khoa": "GDTH"
    },
    {
      "stt": 11,
      "id": "BDNU11",
      "hoTen": "Nguyễn Thị Khánh Ly",
      "ngaySinh": "13/05/2007",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K15G.GDTH",
      "sdt": "0336821586",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 12,
      "id": "BDNU12",
      "hoTen": "Vũ Quỳnh Mai",
      "ngaySinh": "17/12/2007",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K15A-GDTC",
      "sdt": "0865563238",
      "khoa": "N-H-TD"
    },
    {
      "stt": 13,
      "id": "BDNU13",
      "hoTen": "Trần Thị Tuyết Nhung",
      "ngaySinh": "16/10/2008",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K16D.GDTH",
      "sdt": "0962118003",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 14,
      "id": "BDNU14",
      "hoTen": "Ma Thị Mai Thoa",
      "ngaySinh": "13/05/2008",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K16A.SPTOAN",
      "sdt": "0962729061",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 15,
      "id": "BDNU15",
      "hoTen": "La Thị Thuý",
      "ngaySinh": "10/01/2007",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K15A.SP SU",
      "sdt": "0347685459",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 16,
      "id": "BDNU16",
      "hoTen": "Nguyễn Thị Thuận",
      "ngaySinh": "24/07/2006",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K14G-GDTH",
      "sdt": "0967683506",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 17,
      "id": "BDNU17",
      "hoTen": "Phạm Anh Thư",
      "ngaySinh": "20/11/2008",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K16A.GDTC",
      "sdt": "0344821428",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 18,
      "id": "BDNU18",
      "hoTen": "Hoàng Thị Thanh Thảo",
      "ngaySinh": "22/11/2006",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K14G-GDTH",
      "sdt": "0354100952",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 19,
      "id": "BDNU19",
      "hoTen": "Nguyễn Thị Phương Thảo",
      "ngaySinh": "26/04/2008",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K16A- GDTC",
      "sdt": "0385256670",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 20,
      "id": "BDNU20",
      "hoTen": "Nguyễn Bảo Trâm",
      "ngaySinh": "06/05/2008",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K16B-GDTC",
      "sdt": "0962857725",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 21,
      "id": "BDNU21",
      "hoTen": "Lường Thị Ngọc Tuyến",
      "ngaySinh": "29/12/2006",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K14-GDCT",
      "sdt": "0343797536",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 22,
      "id": "BDNU22",
      "hoTen": "Hoàng Hà Thanh Vân",
      "ngaySinh": "05/11/2007",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K15B.GDTC",
      "sdt": "0868057090",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 23,
      "id": "BDNU23",
      "hoTen": "Trần Thị Hoa Yên",
      "ngaySinh": "03/08/2004",
      "chucVu": "Thành viên ban bóng đá",
      "lop": "K15D.GDTH",
      "sdt": "0345826551",
      "khoa": "ĐH Tây Bắc"
    }
  ],
  "Ban Cầu Lông": [
    {
      "stt": 1,
      "id": "CL01",
      "hoTen": "Lương Đình Hiếu",
      "ngaySinh": "09/12/2004",
      "chucVu": "Trưởng ban cầu lông",
      "lop": "K13.GDTC",
      "sdt": "0787246014",
      "khoa": "N-H-TD"
    }
  ],
  "Ban Truyền Thông": [
    {
      "stt": 1,
      "id": "TT01",
      "hoTen": "Trương Thị Ngọc Anh",
      "ngaySinh": "08/09/2007",
      "chucVu": "Thành viên ban truyền thông",
      "lop": "K15.SP Vật lí",
      "sdt": "0944212679",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 2,
      "id": "TT02",
      "hoTen": "Phạm Thị Ngọc Duyên",
      "ngaySinh": "29/09/2007",
      "chucVu": "Thành viên ban truyền thông",
      "lop": "K15E.GDTH",
      "sdt": "0379230662",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 3,
      "id": "TT03",
      "hoTen": "Đỗ Nguyệt Hải Hà",
      "ngaySinh": "22/05/2007",
      "chucVu": "Thành viên ban truyền thông",
      "lop": "K15A SP Toán",
      "sdt": "0335897056",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 4,
      "id": "TT04",
      "hoTen": "Tào Thị Tuyết Linh",
      "ngaySinh": "18/05/2007",
      "chucVu": "Trưởng ban truyền thông",
      "lop": "K15D.GDTH",
      "sdt": "0394828197",
      "khoa": "GDTH"
    },
    {
      "stt": 5,
      "id": "TT05",
      "hoTen": "Lê Kim Ngân",
      "ngaySinh": "17/07/2007",
      "chucVu": "Thành viên ban truyền thông",
      "lop": "K15E.GDTH",
      "sdt": "0376009544",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 6,
      "id": "TT06",
      "hoTen": "Bùi Thị Phương",
      "ngaySinh": "20/06/2007",
      "chucVu": "Thành viên ban truyền thông",
      "lop": "K48C GDMN",
      "sdt": "0338540588",
      "khoa": "GDMN"
    },
    {
      "stt": 7,
      "id": "TT07",
      "hoTen": "Lê Thị Thu Phương",
      "ngaySinh": "17/10/2007",
      "chucVu": "Thành viên ban truyền thông",
      "lop": "K15E.GDTH",
      "sdt": "0362495007",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 8,
      "id": "TT08",
      "hoTen": "Vũ Minh Quang",
      "ngaySinh": "23/11/2007",
      "chucVu": "Phó ban truyền thông",
      "lop": "K15.GDTC",
      "sdt": "0866189811",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 9,
      "id": "TT09",
      "hoTen": "Lê Thị Thu Thương",
      "ngaySinh": "21/12/2005",
      "chucVu": "Thành viên ban truyền thông",
      "lop": "K13G.GDTH",
      "sdt": "0704128206",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 10,
      "id": "TT10",
      "hoTen": "Nguyễn Nhật Tân",
      "ngaySinh": "22/02/2008",
      "chucVu": "Thành viên ban truyền thông",
      "lop": "K16 SP Vật Lý",
      "sdt": "0396291862",
      "khoa": "ĐH Tây Bắc"
    },
    {
      "stt": 11,
      "id": "TT11",
      "hoTen": "Phạm Tiến Đạt",
      "ngaySinh": "25/07/2007",
      "chucVu": "Thành viên ban truyền thông",
      "lop": "K16.GDTC",
      "sdt": "0967395691",
      "khoa": "ĐH Tây Bắc"
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
      responseData = { success: true, message: 'Đã hoàn tất dọn dẹp và khởi tạo 7 ban cùng dữ liệu 124 thành viên!' };
    }
    // 1. ĐĂNG NHẬP (Tìm kiếm thông minh trên tất cả 7 Ban)
    else if (action === 'login') {
      var identifier = (params.identifier || '').trim().toLowerCase();
      if (!identifier) {
        responseData = { success: false, message: 'Vui lòng nhập Mã ID, SĐT hoặc Họ và Tên' };
      } else {
        var allMembers = getAllMembersFromDepartments(ss);
        var foundMember = null;
        for (var i = 0; i < allMembers.length; i++) {
          var m = allMembers[i];
          var mId = String(m.id || '').trim().toLowerCase();
          var mSdt = String(m.sdt || '').replace(/[^0-9]/g, '');
          var cleanIdentNum = identifier.replace(/[^0-9]/g, '');
          var mName = String(m.hoTen || '').trim().toLowerCase();
          var mMssv = String(m.mssv || '').trim().toLowerCase();

          if (mId === identifier || 
              (cleanIdentNum && mSdt === cleanIdentNum) ||
              mName === identifier || 
              mMssv === identifier) {
            foundMember = m;
            break;
          }
        }

        if (foundMember) {
          responseData = { success: true, member: foundMember };
        } else {
          responseData = { success: false, message: 'Không tìm thấy thành viên: ' + identifier + '. Vui lòng kiểm tra Mã ID (VD: BC01, BCN01, NS01...) hoặc SĐT.' };
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
            currentMember = membersList[k];
            break;
          }
        }
      }

      var tasksList = getTasksList(ss);
      var swapsList = getSwapsList(ss);
      var postsList = getPostsList(ss);

      responseData = {
        success: true,
        member: currentMember,
        membersList: membersList,
        tasks: tasksList,
        swaps: swapsList,
        posts: postsList
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
    // 6. TẠO CA TRỰC MỚI (createTask)
    else if (action === 'createTask') {
      var taskObj = params.task ? parseJsonSafe(params.task, null) : params;
      responseData = handleCreateTask(ss, taskObj);
    }
    // 7. ĐĂNG BÀI DIỄN ĐÀN (createPost)
    else if (action === 'createPost') {
      var postObj = params.post ? parseJsonSafe(params.post, null) : params;
      responseData = handleCreatePost(ss, postObj);
    }

  } catch(error) {
    responseData = { success: false, message: 'Lỗi máy chủ: ' + error.toString() };
  }

  return createJsonResponse(responseData);
}

/**
 * Đọc tất cả thành viên từ 7 Sheet Ban
 */
function getAllMembersFromDepartments(ss) {
  var allMembers = [];
  
  for (var d = 0; d < DEPARTMENT_SHEETS.length; d++) {
    var deptName = DEPARTMENT_SHEETS[d];
    var sheet = ss.getSheetByName(deptName);
    if (!sheet) continue;

    var rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) continue;

    // Header ở dòng 1: ['STT', 'Mã ID', 'Họ và Tên', 'Ngày Sinh', 'Chức Vụ', 'Lớp', 'SĐT', 'Khoa', 'Số Ca Đã Làm']
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      var stt = r[0];
      var id = String(r[1] || '').trim();
      var hoTen = String(r[2] || '').trim();
      if (!hoTen) continue;

      var ngaySinh = formatDateCell(r[3]);
      var chucVu = String(r[4] || 'Thành viên').trim();
      var lop = String(r[5] || '').trim();
      var sdt = cleanPhone(r[6]);
      var khoa = String(r[7] || 'ĐH Tây Bắc').trim();
      var soCa = Number(r[8]) || 0;

      // Xác định quyền hạn thông minh theo Ban và Chức vụ
      var cvLower = chucVu.toLowerCase();
      var isAdmin = (deptName === 'Ban Chủ Nhiệm') || 
                    cvLower.indexOf('chủ nhiệm') !== -1 || 
                    cvLower.indexOf('phó chủ nhiệm') !== -1 ||
                    cvLower.indexOf('tổng thư ký') !== -1 ||
                    cvLower.indexOf('thủ quỹ') !== -1;

      var isShiftLeader = isAdmin || 
                          cvLower.indexOf('trưởng ban') !== -1 || 
                          cvLower.indexOf('phó ban') !== -1;

      allMembers.push({
        stt: stt,
        id: id || (deptName + '_' + i),
        hoTen: hoTen,
        lop: lop,
        mssv: ngaySinh || id,
        khoa: khoa,
        boMon: deptName,
        chucVu: chucVu,
        sdt: sdt,
        yTe: 'Bình thường',
        ice: sdt,
        soCa: soCa,
        soCaHoanThanh: soCa,
        status: 'Sẵn sàng',
        theTrang: 'Khỏe mạnh (100% Sẵn sàng)',
        avatar: '',
        isAdmin: isAdmin,
        isShiftLeader: isShiftLeader
      });
    }
  }

  return allMembers;
}

/**
 * Xử lý định dạng ngày tháng từ ô bảng tính
 */
function formatDateCell(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
  }
  return String(val).trim();
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

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(taskId)) {
      var joined = parseJsonSafe(rows[i][joinedCol], []);
      var wait = parseJsonSafe(rows[i][waitlistCol], []);

      if (waitlist) {
        if (wait.indexOf(memberId) === -1) wait.push(memberId);
        sheet.getRange(i + 1, waitlistCol + 1).setValue(JSON.stringify(wait));
        return { success: true, message: 'Đã thêm bạn vào hàng đợi dự bị' };
      } else {
        if (joined.indexOf(memberId) === -1) joined.push(memberId);
        // Xóa khỏi waitlist nếu đã được duyệt
        var wIdx = wait.indexOf(memberId);
        if (wIdx !== -1) wait.splice(wIdx, 1);
        sheet.getRange(i + 1, joinedCol + 1).setValue(JSON.stringify(joined));
        sheet.getRange(i + 1, waitlistCol + 1).setValue(JSON.stringify(wait));
        return { success: true, message: 'Đăng ký ca trực thành công!' };
      }
    }
  }
  return { success: false, message: 'Không tìm thấy ca trực: ' + taskId };
}

/**
 * Xử lý rút ca trực
 */
function handleWithdrawTask(ss, taskId, memberId, reason) {
  var sheet = ss.getSheetByName('Tasks');
  if (!sheet) return { success: false, message: 'Chưa có sheet Tasks' };
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var idCol = headers.indexOf('id');
  var joinedCol = headers.indexOf('joinedMembers');
  var titleCol = headers.indexOf('title');

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(taskId)) {
      var joined = parseJsonSafe(rows[i][joinedCol], []);
      var idx = joined.indexOf(memberId);
      if (idx !== -1) {
        joined.splice(idx, 1);
        sheet.getRange(i + 1, joinedCol + 1).setValue(JSON.stringify(joined));
      }
      
      // Ghi log vào Swaps
      var swapsSheet = ss.getSheetByName('Swaps');
      if (swapsSheet) {
        swapsSheet.appendRow([
          'withdraw_' + new Date().getTime(),
          taskId,
          rows[i][titleCol] || 'Ca trực',
          memberId,
          reason || 'Xin rút ca',
          'ADMIN',
          new Date().toISOString(),
          'Đã Rút Ca'
        ]);
      }
      return { success: true, message: 'Đã rút ca trực thành công' };
    }
  }
  return { success: false, message: 'Không tìm thấy ca trực' };
}

/**
 * Xử lý điểm danh bằng QR Code hiện trường
 */
function handleCheckinMember(ss, taskId, memberId, adminId) {
  var sheet = ss.getSheetByName('Tasks');
  if (!sheet) return { success: false, message: 'Chưa có sheet Tasks' };
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var idCol = headers.indexOf('id');
  var checkinCol = headers.indexOf('checkedInMembers');
  var logsCol = headers.indexOf('checkinLogs');

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(taskId)) {
      var checkedIn = parseJsonSafe(rows[i][checkinCol], []);
      var logs = parseJsonSafe(rows[i][logsCol], []);

      if (checkedIn.indexOf(memberId) === -1) {
        checkedIn.push(memberId);
      }
      logs.push({
        memberId: memberId,
        scannedBy: adminId || 'Admin',
        time: new Date().toISOString()
      });

      sheet.getRange(i + 1, checkinCol + 1).setValue(JSON.stringify(checkedIn));
      sheet.getRange(i + 1, logsCol + 1).setValue(JSON.stringify(logs));

      // Tăng số ca cống hiến cho thành viên trong Sheet của họ
      incrementMemberShiftCount(ss, memberId);

      return { success: true, message: 'Điểm danh hiện trường thành công cho thành viên: ' + memberId };
    }
  }
  return { success: false, message: 'Không tìm thấy ca trực' };
}

/**
 * Cộng thêm 1 ca hoàn thành vào Sheet của thành viên
 */
function incrementMemberShiftCount(ss, memberId) {
  for (var d = 0; d < DEPARTMENT_SHEETS.length; d++) {
    var sheet = ss.getSheetByName(DEPARTMENT_SHEETS[d]);
    if (!sheet) continue;
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][1]).trim().toLowerCase() === String(memberId).trim().toLowerCase()) {
        var currentCount = Number(rows[i][8]) || 0;
        sheet.getRange(i + 1, 9).setValue(currentCount + 1);
        return;
      }
    }
  }
}

/**
 * Tạo mới ca trực
 */
function handleCreateTask(ss, task) {
  var sheet = ss.getSheetByName('Tasks');
  if (!sheet) return { success: false, message: 'Chưa có sheet Tasks' };
  var taskId = task.id || ('TASK_' + new Date().getTime());
  sheet.appendRow([
    taskId,
    task.title || 'Ca trực mới',
    task.location || 'Sân thể thao',
    task.time || '07:30 - 11:30',
    Number(task.quota) || 6,
    JSON.stringify(task.joinedMembers || []),
    JSON.stringify(task.assignedMembers || []),
    JSON.stringify(task.waitlist || []),
    task.leaderId || '',
    JSON.stringify(task.checkedInMembers || []),
    JSON.stringify(task.checkinLogs || []),
    task.lockDeadline || '',
    task.status || 'Mở Đăng Ký',
    JSON.stringify(task.departmentQuotas || {})
  ]);
  return { success: true, message: 'Tạo ca trực mới thành công!', taskId: taskId };
}

/**
 * Tạo mới bài viết diễn đàn
 */
function handleCreatePost(ss, post) {
  var sheet = ss.getSheetByName('Posts');
  if (!sheet) return { success: false, message: 'Chưa có sheet Posts' };
  var postId = post.id || ('POST_' + new Date().getTime());
  sheet.appendRow([
    postId,
    post.authorId || '',
    post.authorName || 'Thành viên',
    post.authorRole || 'CLB Thể Thao',
    post.authorAvatar || '',
    post.content || '',
    post.image || '',
    post.createdAt || new Date().toISOString(),
    Number(post.likes) || 0,
    JSON.stringify(post.likedBy || []),
    JSON.stringify(post.comments || []),
    post.isAnonymous ? 'TRUE' : 'FALSE'
  ]);
  return { success: true, message: 'Đăng bài viết thành công!', postId: postId };
}

/**
 * ==============================================================================
 * HÀM THIẾT LẬP VÀ LÀM SẠCH BẢNG TÍNH TỰ ĐỘNG (SETUP & CLEANUP)
 * ==============================================================================
 * Chức năng:
 * 1. Tạo mới / chuẩn hóa đúng 7 Sheet tương ứng 7 Ban chuyên môn.
 * 2. Điền đầy đủ 124 thành viên chuẩn xác 100%, có Mã ID theo từng Ban.
 * 3. Bảo toàn số 0 ở đầu SĐT (đặt định dạng ô Text '@').
 * 4. Tạo các Sheet nghiệp vụ: Tasks, Swaps, Posts.
 * 5. Tự động XÓA tất cả các sheet thừa/rác không liên quan.
 * ==============================================================================
 */
function setupMultiSheetDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var header = ['STT', 'Mã ID', 'Họ và Tên', 'Ngày Sinh', 'Chức Vụ', 'Lớp', 'SĐT', 'Khoa', 'Số Ca Đã Làm'];
  var totalSeeded = 0;

  // 1. Khởi tạo 7 Sheet Ban
  for (var d = 0; d < DEPARTMENT_SHEETS.length; d++) {
    var deptName = DEPARTMENT_SHEETS[d];
    var sheet = ss.getSheetByName(deptName);
    if (!sheet) {
      sheet = ss.insertSheet(deptName);
    }
    sheet.clear();

    // Thiết lập Header thẩm mỹ
    sheet.appendRow(header);
    var headerRange = sheet.getRange(1, 1, 1, header.length);
    headerRange.setBackground('#0f172a'); // Navy đậm sang trọng
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);

    // Lấy dữ liệu thành viên của Ban
    var members = SEED_DATA[deptName] || [];
    if (members.length > 0) {
      var rows = [];
      for (var m = 0; m < members.length; m++) {
        var mem = members[m];
        var sdtStr = mem.sdt ? ("'" + mem.sdt) : "";
        rows.push([
          mem.stt,
          mem.id,
          mem.hoTen,
          mem.ngaySinh,
          mem.chucVu,
          mem.lop,
          sdtStr,
          mem.khoa,
          0
        ]);
      }
      sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);

      // Định dạng Text cho cột Mã ID, Ngày Sinh, SĐT để bảo toàn số 0
      sheet.getRange(2, 2, rows.length, 1).setNumberFormat('@');
      sheet.getRange(2, 4, rows.length, 1).setNumberFormat('@');
      sheet.getRange(2, 7, rows.length, 1).setNumberFormat('@');

      // Căn giữa STT, Mã ID, Ngày Sinh, Lớp, SĐT
      sheet.getRange(2, 1, rows.length, 2).setHorizontalAlignment('center');
      sheet.getRange(2, 4, rows.length, 1).setHorizontalAlignment('center');
      sheet.getRange(2, 6, rows.length, 2).setHorizontalAlignment('center');
      sheet.getRange(2, 9, rows.length, 1).setHorizontalAlignment('center');

      totalSeeded += rows.length;
    }

    // Tự động căn chỉnh độ rộng cột
    for (var c = 1; c <= header.length; c++) {
      try { sheet.autoResizeColumn(c); } catch(e) {}
    }
  }

  // 2. Khởi tạo Sheet Tasks (Ca trực)
  var tasksSheet = ss.getSheetByName('Tasks');
  if (!tasksSheet) {
    tasksSheet = ss.insertSheet('Tasks');
  }
  if (tasksSheet.getLastRow() === 0) {
    tasksSheet.appendRow(['id', 'title', 'location', 'time', 'quota', 'joinedMembers', 'assignedMembers', 'waitlist', 'leaderId', 'checkedInMembers', 'checkinLogs', 'lockDeadline', 'status', 'departmentQuotas']);
    var tHRange = tasksSheet.getRange(1, 1, 1, 14);
    tHRange.setBackground('#047857'); // Emerald xanh
    tHRange.setFontColor('#ffffff');
    tHRange.setFontWeight('bold');
    tasksSheet.setFrozenRows(1);

    // Nạp sẵn 3 ca trực mẫu chuẩn thực tế
    tasksSheet.appendRow([
      'TASK_001',
      'Trực sân Bóng Chuyền - Giải Giao Hữu Tân Sinh Viên K16',
      'Nhà Thi Đấu ĐH Tây Bắc',
      '07:30 - 11:30 | Thứ Bảy',
      6,
      '[]', '[]', '[]', 'BCN01', '[]', '[]', '2026-10-18T22:00:00Z', 'Mở Đăng Ký',
      '{\"Ban Bóng Chuyền\": 3, \"Ban Chủ Nhiệm\": 1, \"Ban Nhân Sự\": 1, \"Ban Truyền Thông\": 1}'
    ]);
    tasksSheet.appendRow([
      'TASK_002',
      'Điều phối Giải Bóng Đá Nam Vòng Bảng Khoa GDTC',
      'Sân Bóng Cỏ Nhân Tạo',
      '14:00 - 17:30 | Chủ Nhật',
      8,
      '[]', '[]', '[]', 'BCN02', '[]', '[]', '2026-10-19T10:00:00Z', 'Mở Đăng Ký',
      '{\"Ban Bóng Đá Nam\": 5, \"Ban Y Tế\": 1, \"Ban Truyền Thông\": 2}'
    ]);
    tasksSheet.appendRow([
      'TASK_003',
      'Hỗ trợ Truyền Thông & Livestream Khai Mạc Giải Thể Thao',
      'Hội Trường Trung Tâm',
      '18:30 - 21:30 | Thứ Hai',
      4,
      '[]', '[]', '[]', 'TT04', '[]', '[]', '2026-10-20T12:00:00Z', 'Mở Đăng Ký',
      '{\"Ban Truyền Thông\": 3, \"Ban Chủ Nhiệm\": 1}'
    ]);
  }

  // 3. Khởi tạo Sheet Swaps (Đổi ca / Rút ca)
  var swapsSheet = ss.getSheetByName('Swaps');
  if (!swapsSheet) {
    swapsSheet = ss.insertSheet('Swaps');
  }
  if (swapsSheet.getLastRow() === 0) {
    swapsSheet.appendRow(['id', 'taskId', 'taskTitle', 'fromMemberId', 'fromMemberName', 'toMemberId', 'createdAt', 'status']);
    var sHRange = swapsSheet.getRange(1, 1, 1, 8);
    sHRange.setBackground('#b45309'); // Amber cam đậm
    sHRange.setFontColor('#ffffff');
    sHRange.setFontWeight('bold');
    swapsSheet.setFrozenRows(1);
  }

  // 4. Khởi tạo Sheet Posts (Diễn đàn & Thông báo)
  var postsSheet = ss.getSheetByName('Posts');
  if (!postsSheet) {
    postsSheet = ss.insertSheet('Posts');
  }
  if (postsSheet.getLastRow() === 0) {
    postsSheet.appendRow(['id', 'authorId', 'authorName', 'authorRole', 'authorAvatar', 'content', 'image', 'createdAt', 'likes', 'likedBy', 'comments', 'isAnonymous']);
    var pHRange = postsSheet.getRange(1, 1, 1, 12);
    pHRange.setBackground('#1d4ed8'); // Cobalt xanh dương
    pHRange.setFontColor('#ffffff');
    pHRange.setFontWeight('bold');
    postsSheet.setFrozenRows(1);

    // Bài viết chào mừng mẫu
    postsSheet.appendRow([
      'POST_WELCOME',
      'BCN01',
      'Ban Chủ Nhiệm CLB Thể Thao',
      'Quản Trị Viên',
      '',
      '🎉 Chào mừng toàn thể thành viên đến với SportPass PWA! Hãy kiểm tra ca trực mới và đăng ký nhận ca đúng giờ nhé.',
      '',
      new Date().toISOString(),
      12,
      '[\"BCN01\", \"BC01\", \"BDN01\"]',
      '[]',
      'FALSE'
    ]);
  }

  // 5. LÀM SẠCH BẢNG TÍNH: Xóa mọi Sheet rác/thừa không thuộc 7 Ban và 3 Tab nghiệp vụ
  var validSheetNames = DEPARTMENT_SHEETS.concat(APP_SHEETS);
  var allSheets = ss.getSheets();
  for (var j = 0; j < allSheets.length; j++) {
    var curName = allSheets[j].getName();
    if (validSheetNames.indexOf(curName) === -1 && allSheets.length > 1) {
      try {
        ss.deleteSheet(allSheets[j]);
      } catch(e) {}
    }
  }

  Logger.log('=== HOÀN TẤT THIẾT LẬP THÀNH CÔNG ===');
  Logger.log('Đã tạo chuẩn ' + DEPARTMENT_SHEETS.length + ' ban chuyên môn và điền ' + totalSeeded + ' thành viên.');
  Logger.log('Đã tạo 3 sheet nghiệp vụ: Tasks, Swaps, Posts.');
  Logger.log('Đã xóa sạch các sheet thừa.');
}
