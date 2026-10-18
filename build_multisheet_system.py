import sys
import os
import json
import xlsxwriter
import subprocess

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = r'C:\Users\Admin\.gemini\antigravity\scratch\clb-sportpass'
DRIVE_DIR = r'G:\Drive của tôi'
AUTOBRIDGE_OUTBOX = os.path.join(DRIVE_DIR, 'AutoBridge', 'Outbox')
AUTOBRIDGE_REPORTS = os.path.join(DRIVE_DIR, 'AutoBridge', 'Reports')
DRIVE_COPY_DIR = os.path.join(DRIVE_DIR, 'Du_Lieu_Copy_Tung_Ban')
LOCAL_COPY_DIR = os.path.join(ROOT_DIR, 'Du_Lieu_Copy_Tung_Ban')

os.makedirs(AUTOBRIDGE_OUTBOX, exist_ok=True)
os.makedirs(AUTOBRIDGE_REPORTS, exist_ok=True)
os.makedirs(DRIVE_COPY_DIR, exist_ok=True)
os.makedirs(LOCAL_COPY_DIR, exist_ok=True)

# 1. LOAD AND PREPARE 8-COLUMN DATASET
with open(os.path.join(ROOT_DIR, 'data_by_dept.json'), 'r', encoding='utf-8') as f:
    raw_dept_data = json.load(f)

dept_order = [
    'Ban Chủ Nhiệm',
    'Ban Nhân Sự',
    'Ban Bóng Chuyền',
    'Ban Bóng Đá Nam',
    'Ban Bóng Đá Nữ',
    'Ban Cầu Lông',
    'Ban Truyền Thông'
]

clean_dept_data = {}
all_clean_members = []

for dept in dept_order:
    mems = raw_dept_data.get(dept, [])
    dept_mems = []
    for m in mems:
        sdt = m.get('sdt', '')
        if sdt and not str(sdt).startswith('0'):
            sdt = '0' + str(sdt)
        sdt = str(sdt).strip()
        
        ice = m.get('ice', sdt)
        if ice and not str(ice).startswith('0'):
            ice = '0' + str(ice)
        ice = str(ice).strip()

        mem_obj = {
            'id': m['id'].strip(),
            'hoTen': m['hoTen'].strip(),
            'lop': m.get('lop', '').strip(),
            'boMon': dept,
            'chucVu': m.get('chucVu', 'Thành viên').strip(),
            'yTe': m.get('yTe', 'Bình thường').strip(),
            'sdt': sdt,
            'ice': ice
        }
        dept_mems.append(mem_obj)
        all_clean_members.append(mem_obj)
    clean_dept_data[dept] = dept_mems

with open(os.path.join(ROOT_DIR, 'data_by_dept_8cols.json'), 'w', encoding='utf-8') as f:
    json.dump(clean_dept_data, f, ensure_ascii=False, indent=2)

print(f"[OK] Processed {len(all_clean_members)} total member records across 7 departments.")

# 2. GENERATE INDIVIDUAL TSV & TXT FILES FOR EASY COPY-PASTE INTO GOOGLE SHEETS
tsv_summary_lines = [
    "================================================================================",
    "HƯỚNG DẪN COPY - PASTE VÀO FILE GOOGLE SHEET MỚI (CHUẨN 8 CỘT)",
    "================================================================================",
    "Cấu trúc 8 cột chuẩn xác trong mỗi trang tính (Sheet):",
    "Cột A: Mã ID | Cột B: Họ và Tên | Cột C: Lớp | Cột D: Ban chuyên môn",
    "Cột E: Chức vụ | Cột F: Y tế | Cột G: Số điện thoại | Cột H: Liên hệ khẩn cấp",
    "",
    "CÁCH SỬ DỤNG SIÊU TIỆN LỢI:",
    "1. Tạo 7 trang tính (Sheet) với đúng tên từng Ban bên dưới.",
    "2. Mở file .txt hoặc .tsv của ban tương ứng (bằng Notepad hoặc Google Drive).",
    "3. Bấm Ctrl+A rồi Ctrl+C để copy toàn bộ nội dung.",
    "4. Chọn ô A1 trong Google Sheet của ban đó rồi bấm Ctrl+V.",
    "-> Dữ liệu sẽ tự động tách thành 8 cột hoàn hảo, bảo toàn số 0 ở đầu SĐT!",
    "--------------------------------------------------------------------------------",
    ""
]

file_prefixes = [
    ('1_Ban_Chu_Nhiem', 'Ban Chủ Nhiệm'),
    ('2_Ban_Nhan_Su', 'Ban Nhân Sự'),
    ('3_Ban_Bong_Chuyen', 'Ban Bóng Chuyền'),
    ('4_Ban_Bong_Da_Nam', 'Ban Bóng Đá Nam'),
    ('5_Ban_Bong_Da_Nu', 'Ban Bóng Đá Nữ'),
    ('6_Ban_Cau_Long', 'Ban Cầu Lông'),
    ('7_Ban_Truyen_Thong', 'Ban Truyền Thông')
]

headers_8cols = ['Mã ID', 'Họ và Tên', 'Lớp', 'Ban chuyên môn', 'Chức vụ', 'Y tế', 'Số điện thoại', 'Liên hệ khẩn cấp']

for prefix, dept in file_prefixes:
    mems = clean_dept_data[dept]
    lines = ['\t'.join(headers_8cols)]
    for m in mems:
        # Prepend single quote for TSV to ensure Google Sheet preserves phone as text if pasted
        sdt_txt = ("'" + m['sdt']) if m['sdt'] else ""
        ice_txt = ("'" + m['ice']) if m['ice'] else ""
        row = [
            m['id'],
            m['hoTen'],
            m['lop'],
            m['boMon'],
            m['chucVu'],
            m['yTe'],
            sdt_txt,
            ice_txt
        ]
        lines.append('\t'.join(row))
    
    content = '\n'.join(lines)
    tsv_summary_lines.append(f"- Sheet '{dept}': {len(mems)} thành viên -> file `{prefix}.txt`")

    # Write both .tsv and .txt to both Drive and local
    for folder in [DRIVE_COPY_DIR, LOCAL_COPY_DIR]:
        with open(os.path.join(folder, f"{prefix}.tsv"), 'w', encoding='utf-8') as f:
            f.write(content)
        with open(os.path.join(folder, f"{prefix}.txt"), 'w', encoding='utf-8') as f:
            f.write(content)

summary_text = '\n'.join(tsv_summary_lines)
for folder in [DRIVE_COPY_DIR, LOCAL_COPY_DIR]:
    with open(os.path.join(folder, "HUONG_DAN_COPY_PASTE_VAO_SHEET_MOI.txt"), 'w', encoding='utf-8') as f:
        f.write(summary_text)

print(f"[OK] Generated TSV and TXT copy files in:\n     {DRIVE_COPY_DIR}\n     {LOCAL_COPY_DIR}")

# 3. GENERATE STANDARDIZED EXCEL WORKBOOKS (8 COLUMNS + 3 APP TABS)
excel_targets = [
    os.path.join(DRIVE_DIR, 'CLB_The_Thao_Danh_Sach_Thanh_Vien_Chuan_Hoa.xlsx'),
    os.path.join(AUTOBRIDGE_OUTBOX, 'CLB_The_Thao_Danh_Sach_Thanh_Vien_Chuan_Hoa.xlsx'),
    os.path.join(ROOT_DIR, 'CLB_The_Thao_Danh_Sach_Thanh_Vien_Chuan_Hoa.xlsx')
]

for wb_path in excel_targets:
    wb = xlsxwriter.Workbook(wb_path)

    # Styling formats
    header_navy = wb.add_format({
        'bold': True,
        'font_color': '#FFFFFF',
        'bg_color': '#0F172A',
        'align': 'center',
        'valign': 'vcenter',
        'border': 1,
        'border_color': '#334155',
        'font_size': 11
    })

    header_tasks = wb.add_format({
        'bold': True,
        'font_color': '#FFFFFF',
        'bg_color': '#3B0764',
        'align': 'center',
        'valign': 'vcenter',
        'border': 1,
        'border_color': '#581C87',
        'font_size': 11
    })

    header_swaps = wb.add_format({
        'bold': True,
        'font_color': '#FFFFFF',
        'bg_color': '#78350F',
        'align': 'center',
        'valign': 'vcenter',
        'border': 1,
        'border_color': '#92400E',
        'font_size': 11
    })

    header_posts = wb.add_format({
        'bold': True,
        'font_color': '#FFFFFF',
        'bg_color': '#064E3B',
        'align': 'center',
        'valign': 'vcenter',
        'border': 1,
        'border_color': '#065F46',
        'font_size': 11
    })

    id_fmt = wb.add_format({
        'bold': True,
        'align': 'center',
        'valign': 'vcenter',
        'num_format': '@',
        'font_color': '#0369A1',
        'border': 1,
        'border_color': '#E2E8F0'
    })

    name_fmt = wb.add_format({
        'bold': True,
        'align': 'left',
        'valign': 'vcenter',
        'num_format': '@',
        'border': 1,
        'border_color': '#E2E8F0'
    })

    center_fmt = wb.add_format({
        'align': 'center',
        'valign': 'vcenter',
        'num_format': '@',
        'border': 1,
        'border_color': '#E2E8F0'
    })

    left_fmt = wb.add_format({
        'align': 'left',
        'valign': 'vcenter',
        'num_format': '@',
        'border': 1,
        'border_color': '#E2E8F0'
    })

    phone_fmt = wb.add_format({
        'align': 'center',
        'valign': 'vcenter',
        'num_format': '@',
        'font_color': '#047857',
        'bold': True,
        'border': 1,
        'border_color': '#E2E8F0'
    })

    ice_fmt = wb.add_format({
        'align': 'center',
        'valign': 'vcenter',
        'num_format': '@',
        'font_color': '#BE123C',
        'bold': True,
        'border': 1,
        'border_color': '#E2E8F0'
    })

    # 1. Write 7 Department Sheets
    for dept in dept_order:
        ws = wb.add_worksheet(dept)
        ws.freeze_panes(1, 0)
        ws.set_row(0, 28)

        for col_idx, h in enumerate(headers_8cols):
            ws.write(0, col_idx, h, header_navy)

        mems = clean_dept_data[dept]
        for row_idx, m in enumerate(mems, start=1):
            ws.set_row(row_idx, 22)
            ws.write(row_idx, 0, m['id'], id_fmt)
            ws.write(row_idx, 1, m['hoTen'], name_fmt)
            ws.write(row_idx, 2, m['lop'], center_fmt)
            ws.write(row_idx, 3, m['boMon'], left_fmt)
            ws.write(row_idx, 4, m['chucVu'], left_fmt)
            ws.write(row_idx, 5, m['yTe'], center_fmt)
            ws.write(row_idx, 6, m['sdt'], phone_fmt)
            ws.write(row_idx, 7, m['ice'], ice_fmt)

        # Set optimal column widths
        ws.set_column(0, 0, 14)  # Mã ID
        ws.set_column(1, 1, 24)  # Họ và Tên
        ws.set_column(2, 2, 16)  # Lớp
        ws.set_column(3, 3, 20)  # Ban chuyên môn
        ws.set_column(4, 4, 22)  # Chức vụ
        ws.set_column(5, 5, 16)  # Y tế
        ws.set_column(6, 6, 17)  # Số điện thoại
        ws.set_column(7, 7, 18)  # Liên hệ khẩn cấp

    # 2. Write Tasks Sheet
    ws_tasks = wb.add_worksheet('Tasks')
    ws_tasks.freeze_panes(1, 0)
    ws_tasks.set_row(0, 28)
    task_headers = ['id', 'title', 'location', 'time', 'quota', 'joinedMembers', 'assignedMembers', 'waitlist', 'leaderId', 'checkedInMembers', 'checkinLogs', 'lockDeadline', 'status', 'departmentQuotas', 'notes']
    for col_idx, h in enumerate(task_headers):
        ws_tasks.write(0, col_idx, h, header_tasks)

    sample_tasks = [
        [
            'TASK_01',
            'Trực bàn giải Cầu lông - Tân Sinh Viên K16',
            'Nhà Thi Đấu ĐH Hải Dương',
            '14:00 - 18:00 Thứ Bảy',
            6,
            '["DMC0806", "DDH1011"]',
            '[]',
            '["TCT0803"]',
            'LDH0912',
            '[]',
            '[]',
            '2026-10-25T14:00',
            'active',
            '{"Ban Cầu Lông": 2, "Ban Bóng Chuyền": 2, "Ban Truyền Thông": 2}',
            'Trang phục thể thao CLB, mang theo còi và bảng chấm điểm'
        ],
        [
            'TASK_02',
            'Hậu cần & Điều phối Giải Bóng Đá Nam Vòng Bảng',
            'Sân Bóng Cỏ Nhân Tạo ĐH Hải Dương',
            '08:00 - 11:30 Chủ Nhật',
            4,
            '["LDH0912"]',
            '[]',
            '[]',
            'DMC0806',
            '[]',
            '[]',
            '2026-10-26T08:00',
            'active',
            '{"Ban Bóng Đá Nam": 2, "Ban Truyền Thông": 2}',
            'Có mặt trước 15 phút tại sân cỏ nhân tạo'
        ]
    ]
    for r_idx, t_row in enumerate(sample_tasks, start=1):
        ws_tasks.set_row(r_idx, 22)
        for c_idx, val in enumerate(t_row):
            ws_tasks.write(r_idx, c_idx, val, center_fmt if c_idx in [0, 4, 8, 11, 12] else left_fmt)

    ws_tasks.set_column(0, 0, 14)
    ws_tasks.set_column(1, 1, 35)
    ws_tasks.set_column(2, 2, 28)
    ws_tasks.set_column(3, 3, 24)
    ws_tasks.set_column(4, 4, 10)
    ws_tasks.set_column(5, 7, 24)
    ws_tasks.set_column(8, 8, 14)
    ws_tasks.set_column(9, 13, 24)

    # 3. Write Swaps Sheet
    ws_swaps = wb.add_worksheet('Swaps')
    ws_swaps.freeze_panes(1, 0)
    ws_swaps.set_row(0, 28)
    swap_headers = ['id', 'taskId', 'taskTitle', 'fromMemberId', 'fromMemberName', 'toMemberId', 'createdAt', 'status']
    for col_idx, h in enumerate(swap_headers):
        ws_swaps.write(0, col_idx, h, header_swaps)
    
    sample_swaps = [
        ['SWAP_01', 'TASK_01', 'Trực bàn giải Cầu lông - Tân Sinh Viên K16', 'DDH1011', 'Đinh Đức Huy', 'TCT0803', '2026-10-18T08:30:00Z', 'Chấp thuận']
    ]
    for r_idx, s_row in enumerate(sample_swaps, start=1):
        ws_swaps.set_row(r_idx, 22)
        for c_idx, val in enumerate(s_row):
            ws_swaps.write(r_idx, c_idx, val, center_fmt if c_idx in [0, 1, 3, 5, 6, 7] else left_fmt)

    ws_swaps.set_column(0, 0, 14)
    ws_swaps.set_column(1, 1, 14)
    ws_swaps.set_column(2, 2, 35)
    ws_swaps.set_column(3, 3, 15)
    ws_swaps.set_column(4, 4, 20)
    ws_swaps.set_column(5, 5, 15)
    ws_swaps.set_column(6, 6, 22)
    ws_swaps.set_column(7, 7, 16)

    # 4. Write Posts Sheet
    ws_posts = wb.add_worksheet('Posts')
    ws_posts.freeze_panes(1, 0)
    ws_posts.set_row(0, 28)
    post_headers = ['id', 'authorId', 'authorName', 'authorRole', 'authorAvatar', 'content', 'image', 'createdAt', 'likes', 'likedBy', 'comments', 'isAnonymous']
    for col_idx, h in enumerate(post_headers):
        ws_posts.write(0, col_idx, h, header_posts)

    sample_posts = [
        [
            'POST_01',
            'DMC0806',
            'Đỗ Mạnh Cường',
            'Trưởng ban nhân sự',
            '',
            'Chào mừng các bạn đến với hệ thống điều phối thẻ số CLB Thể Thao ĐH Hải Dương! Toàn bộ Mã ID đã được đồng bộ chuẩn hóa theo tên và ngày sinh DDMM.',
            '',
            '2026-10-18T08:00:00Z',
            12,
            '["LDH0912", "DDH1011", "TCT0803"]',
            '[{"id":"CMT_01","authorId":"LDH0912","authorName":"Lương Đình Hiếu","text":"Ban Cầu Lông đã sẵn sàng cho giải đấu sắp tới rồi anh Cường ơi!","time":"10:15","replies":[]}]',
            'FALSE'
        ]
    ]
    for r_idx, p_row in enumerate(sample_posts, start=1):
        ws_posts.set_row(r_idx, 22)
        for c_idx, val in enumerate(p_row):
            ws_posts.write(r_idx, c_idx, val, center_fmt if c_idx in [0, 1, 7, 8, 11] else left_fmt)

    ws_posts.set_column(0, 0, 14)
    ws_posts.set_column(1, 1, 14)
    ws_posts.set_column(2, 2, 20)
    ws_posts.set_column(3, 3, 20)
    ws_posts.set_column(4, 4, 15)
    ws_posts.set_column(5, 5, 50)
    ws_posts.set_column(6, 6, 15)
    ws_posts.set_column(7, 7, 22)
    ws_posts.set_column(8, 8, 10)
    ws_posts.set_column(9, 11, 25)

    wb.close()
    print(f"[OK] Generated Excel Workbook: {wb_path}")

# 4. GENERATE GOOGLE APPS SCRIPT BACKEND (GoogleAppsScript_MultiSheet.js)
seed_json_str = json.dumps(clean_dept_data, ensure_ascii=False, indent=2)

gas_script_code = f"""/**
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

var SEED_DATA = {seed_json_str};

function doGet(e) {{
  return handleRequest(e);
}}

function doPost(e) {{
  return handleRequest(e);
}}

function createJsonResponse(data) {{
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}}

function handleRequest(e) {{
  var params = (e && e.parameter) ? e.parameter : {{}};
  var postData = null;
  if (e && e.postData && e.postData.contents) {{
    try {{
      postData = JSON.parse(e.postData.contents);
    }} catch(err) {{}}
  }}
  
  // Merge params
  if (postData) {{
    for (var key in postData) {{
      if (params[key] === undefined) params[key] = postData[key];
    }}
  }}

  var action = params.action || '';
  var responseData = {{ success: false, message: 'Hành động không hợp lệ: ' + action }};

  try {{
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 0. CHẠY THIẾT LẬP TỰ ĐỘNG TỪ XA
    if (action === 'setup') {{
      setupMultiSheetDatabase();
      responseData = {{ success: true, message: 'Đã hoàn tất dọn dẹp và khởi tạo 7 ban cùng dữ liệu 125 thành viên chuẩn 8 cột!' }};
    }}
    // 1. ĐĂNG NHẬP (Tìm kiếm thông minh trên tất cả 7 Ban - Hợp nhất quyền kiêm nhiệm)
    else if (action === 'login') {{
      var identifier = (params.identifier || '').trim().toLowerCase();
      if (!identifier) {{
        responseData = {{ success: false, message: 'Vui lòng nhập Mã ID, SĐT hoặc Họ và Tên' }};
      }} else {{
        var allMembers = getAllMembersFromDepartments(ss);
        var foundMember = null;
        var cleanIdentNum = identifier.replace(/[^0-9]/g, '');

        for (var i = 0; i < allMembers.length; i++) {{
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

          if (isMatch) {{
            if (!foundMember) {{
              foundMember = JSON.parse(JSON.stringify(m));
            }} else {{
              // Hợp nhất quyền hạn cán sự từ các ban kiêm nhiệm
              // Ưu tiên chức vụ và ban có thẩm quyền cao hơn
              if (m.isAdmin && !foundMember.isAdmin) {{
                foundMember.isAdmin = true;
                foundMember.isShiftLeader = true;
                foundMember.chucVu = m.chucVu;
                foundMember.boMon = m.boMon;
              }} else if (m.isShiftLeader && !foundMember.isShiftLeader) {{
                foundMember.isShiftLeader = true;
                foundMember.chucVu = m.chucVu;
                foundMember.boMon = m.boMon;
              }} else {{
                foundMember.isAdmin = foundMember.isAdmin || m.isAdmin;
                foundMember.isShiftLeader = foundMember.isShiftLeader || m.isShiftLeader;
              }}
              // Điền bổ sung SĐT và ICE nếu bản ghi trước đó để trống
              if (!foundMember.sdt && m.sdt) {{
                foundMember.sdt = m.sdt;
                foundMember.ice = m.sdt;
              }}
              if (!foundMember.ice && m.ice) {{
                foundMember.ice = m.ice;
              }}
            }}
          }}
        }}

        if (foundMember) {{
          responseData = {{ success: true, member: foundMember }};
        }} else {{
          responseData = {{ success: false, message: 'Không tìm thấy thành viên: ' + identifier + '. Vui lòng kiểm tra Mã ID (VD: DMC0806, LDH0912, DDH1011...) hoặc SĐT.' }};
        }}
      }}
    }}
    // 2. ĐỒNG BỘ TOÀN BỘ DỮ LIỆU APP (syncAll)
    else if (action === 'syncAll') {{
      var memberId = (params.memberId || '').trim();
      var membersList = getAllMembersFromDepartments(ss);
      var currentMember = null;
      if (memberId) {{
        for (var k = 0; k < membersList.length; k++) {{
          if (membersList[k].id === memberId) {{
            if (!currentMember) {{
              currentMember = JSON.parse(JSON.stringify(membersList[k]));
            }} else {{
              if (membersList[k].isAdmin && !currentMember.isAdmin) {{
                currentMember.isAdmin = true;
                currentMember.isShiftLeader = true;
                currentMember.chucVu = membersList[k].chucVu;
                currentMember.boMon = membersList[k].boMon;
              }} else if (membersList[k].isShiftLeader && !currentMember.isShiftLeader) {{
                currentMember.isShiftLeader = true;
                currentMember.chucVu = membersList[k].chucVu;
                currentMember.boMon = membersList[k].boMon;
              }} else {{
                currentMember.isAdmin = currentMember.isAdmin || membersList[k].isAdmin;
                currentMember.isShiftLeader = currentMember.isShiftLeader || membersList[k].isShiftLeader;
              }}
              if (!currentMember.sdt && membersList[k].sdt) {{
                currentMember.sdt = membersList[k].sdt;
                currentMember.ice = membersList[k].sdt;
              }}
              if (!currentMember.ice && membersList[k].ice) {{
                currentMember.ice = membersList[k].ice;
              }}
            }}
          }}
        }}
      }}

      var tasksList = getTasksList(ss);
      var swapsList = getSwapsList(ss);
      var postsList = getPostsList(ss);

      responseData = {{
        success: true,
        member: currentMember,
        membersList: membersList,
        tasks: tasksList,
        swaps: swapsList,
        posts: postsList
      }};
    }}
    // 3. ĐĂNG KÝ CA TRỰC (claimTask)
    else if (action === 'claimTask') {{
      var taskId = params.taskId;
      var memberId = params.memberId;
      var waitlist = params.waitlist === 'true' || params.waitlist === true;
      responseData = handleClaimTask(ss, taskId, memberId, waitlist);
    }}
    // 4. XIN RÚT CA (withdrawTask)
    else if (action === 'withdrawTask') {{
      var taskId = params.taskId;
      var memberId = params.memberId;
      var reason = params.reason || '';
      responseData = handleWithdrawTask(ss, taskId, memberId, reason);
    }}
    // 5. ĐIỂM DANH HIỆN TRƯỜNG BẰNG QR (checkinMember)
    else if (action === 'checkinMember') {{
      var taskId = params.taskId;
      var memberId = params.memberId;
      var adminId = params.adminId;
      responseData = handleCheckinMember(ss, taskId, memberId, adminId);
    }}
    // 6. TẠO CA TRỰC MỚI (createTask)
    else if (action === 'createTask') {{
      var taskObj = params.task ? parseJsonSafe(params.task, null) : params;
      responseData = handleCreateTask(ss, taskObj);
    }}
    // 7. ĐĂNG BÀI DIỄN ĐÀN (createPost)
    else if (action === 'createPost') {{
      var postObj = params.post ? parseJsonSafe(params.post, null) : params;
      responseData = handleCreatePost(ss, postObj);
    }}
    // 8. XÓA LỆNH ĐIỀU ĐỘNG (deleteTask)
    else if (action === 'deleteTask') {{
      var taskId = params.taskId;
      responseData = handleDeleteTask(ss, taskId);
    }}
    // 9. XÓA BÀI VIẾT DIỄN ĐÀN (deletePost)
    else if (action === 'deletePost') {{
      var postId = params.postId;
      responseData = handleDeletePost(ss, postId);
    }}
    // 10. CẬP NHẬT HỒ SƠ THÀNH VIÊN VÀ ĐỒNG BỘ GOOGLE SHEET (updateProfile)
    else if (action === 'updateProfile') {{
      var memberId = params.memberId;
      var lop = params.lop;
      var sdt = params.sdt;
      var ice = params.ice;
      var yTe = params.yTe;
      responseData = handleUpdateProfile(ss, memberId, lop, sdt, ice, yTe);
    }}
    // 11. CẬP NHẬT PHÂN QUYỀN ADMIN / TRƯỞNG CA (updateMemberRole)
    else if (action === 'updateMemberRole') {{
      var memberId = params.memberId;
      var isAdmin = params.isAdmin === 'true' || params.isAdmin === true;
      var isShiftLeader = params.isShiftLeader === 'true' || params.isShiftLeader === true;
      var adminActorId = params.adminActorId || '';
      responseData = handleUpdateMemberRole(ss, memberId, isAdmin, isShiftLeader, adminActorId);
    }}

  }} catch(error) {{
    responseData = {{ success: false, message: 'Lỗi máy chủ: ' + error.toString() }};
  }}

  return createJsonResponse(responseData);
}}

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
function getAllMembersFromDepartments(ss) {{
  var membersMap = {{}};
  var order = [];

  // Đọc danh sách ca trực để tính số ca hoàn thành thực tế từ Tasks sheet
  var taskSheet = ss.getSheetByName('Tasks');
  var taskCheckins = {{}};
  if (taskSheet) {{
    try {{
      var tRows = taskSheet.getDataRange().getValues();
      if (tRows.length > 1) {{
        var checkColIdx = tRows[0].indexOf('checkedInMembers');
        if (checkColIdx !== -1) {{
          for (var tr = 1; tr < tRows.length; tr++) {{
            var cList = parseJsonSafe(tRows[tr][checkColIdx], []);
            for (var ci = 0; ci < cList.length; ci++) {{
              var cId = String(cList[ci]).trim();
              taskCheckins[cId] = (taskCheckins[cId] || 0) + 1;
            }}
          }}
        }}
      }}
    }} catch(tErr) {{}}
  }}

  for (var d = 0; d < DEPARTMENT_SHEETS.length; d++) {{
    var deptName = DEPARTMENT_SHEETS[d];
    var sheet = ss.getSheetByName(deptName);
    if (!sheet) continue;

    var rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) continue;

    // Header ở dòng 1: ['Mã ID', 'Họ và Tên', 'Lớp', 'Ban chuyên môn', 'Chức vụ', 'Y tế', 'Số điện thoại', 'Liên hệ khẩn cấp']
    for (var i = 1; i < rows.length; i++) {{
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

      if (!membersMap[effectiveId]) {{
        var initialDone = soCa + (taskCheckins[effectiveId] || 0);
        membersMap[effectiveId] = {{
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
        }};
        order.push(effectiveId);
      }} else {{
        var existing = membersMap[effectiveId];
        if (existing.cacBan.indexOf(deptName) === -1) {{
          existing.cacBan.push(deptName);
        }}
        // Hợp nhất quyền hạn cán sự đa ban: luôn nâng cấp lên quyền cao nhất
        if (isAdmin && !existing.isAdmin) {{
          existing.isAdmin = true;
          existing.isShiftLeader = true;
          existing.chucVu = chucVu;
          existing.boMon = boMon || deptName;
        }} else if (isShiftLeader && !existing.isShiftLeader) {{
          existing.isShiftLeader = true;
          existing.chucVu = chucVu;
          existing.boMon = boMon || deptName;
        }} else if (existing.chucVu.toLowerCase() === 'thành viên' && cvLower !== 'thành viên') {{
          existing.chucVu = chucVu;
          existing.boMon = boMon || deptName;
        }}

        // Cập nhật SĐT và ICE nếu bản ghi trước đó để trống
        if (!existing.sdt && sdt) existing.sdt = sdt;
        if ((!existing.ice || existing.ice === existing.sdt) && ice) existing.ice = ice;
        if ((!existing.yTe || existing.yTe === 'Bình thường') && yTe && yTe !== 'Bình thường') existing.yTe = yTe;
        if (soCa > 0) {{
          existing.soCa = (existing.soCa || 0) + soCa;
          existing.soCaHoanThanh = existing.soCa;
        }}
      }}
    }}
  }}

  // Hợp nhất quyền hạn quản trị tùy chỉnh từ Sheet AdminRoles (nếu có)
  var adminRolesSheet = ss.getSheetByName('AdminRoles');
  if (adminRolesSheet) {{
    try {{
      var rRows = adminRolesSheet.getDataRange().getValues();
      for (var ri = 1; ri < rRows.length; ri++) {{
        var rId = String(rRows[ri][0] || '').trim();
        var rIsAdmin = rRows[ri][1];
        var rIsLeader = rRows[ri][2];
        if (rId && membersMap[rId]) {{
          // Bảo vệ bất biến: DMC0806 luôn luôn là Admin mặc định
          if (rId === 'DMC0806') {{
            membersMap[rId].isAdmin = true;
            membersMap[rId].isShiftLeader = true;
          }} else {{
            membersMap[rId].isAdmin = (rIsAdmin === true || String(rIsAdmin).toLowerCase() === 'true');
            membersMap[rId].isShiftLeader = (rIsLeader === true || String(rIsLeader).toLowerCase() === 'true');
          }}
        }}
      }}
    }} catch(rErr) {{}}
  }}

  var mergedList = [];
  for (var k = 0; k < order.length; k++) {{
    mergedList.push(membersMap[order[k]]);
  }}
  return mergedList;
}}

/**
 * Chuẩn hóa số điện thoại, bảo toàn số 0 ở đầu
 */
function cleanPhone(val) {{
  if (!val) return '';
  var s = String(val).trim().replace(/['\\s\\.\\-]/g, '');
  if (s.indexOf('84') === 0 && s.length >= 11) {{
    s = '0' + s.substring(2);
  }} else if (s.indexOf('0') !== 0 && (s.length === 9 || s.length === 10)) {{
    s = '0' + s;
  }}
  return s;
}}

function parseJsonSafe(str, defaultVal) {{
  if (!str) return defaultVal;
  if (typeof str === 'object') return str;
  try {{
    return JSON.parse(str);
  }} catch(e) {{
    return defaultVal;
  }}
}}

/**
 * Tự động tạo Mã ID chuẩn [Initials][DDMM] từ Họ tên và Ngày sinh nếu cần
 */
function generateMemberIdFromInfo(name, dob) {{
  if (!name) return '';
  var s = String(name).trim();
  s = s.replace(/Đ/g, 'D').replace(/đ/g, 'd');
  try {{
    s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  }} catch(e) {{}}
  var words = s.split(/\\s+/);
  var initials = '';
  for (var i = 0; i < words.length; i++) {{
    if (words[i]) initials += words[i].charAt(0).toUpperCase();
  }}
  
  var ddmm = '0101';
  if (dob instanceof Date) {{
    ddmm = Utilities.formatDate(dob, 'Asia/Ho_Chi_Minh', 'ddMM');
  }} else if (dob) {{
    var m = String(dob).match(/(\\d{{1,2}})[\\/\\-](\\d{{1,2}})/);
    if (m) {{
      var day = parseInt(m[1], 10);
      var month = parseInt(m[2], 10);
      ddmm = (day < 10 ? '0' + day : day) + '' + (month < 10 ? '0' + month : month);
    }}
  }}
  return initials + ddmm;
}}

/**
 * Lấy danh sách Ca Trực
 */
function getTasksList(ss) {{
  var sheet = ss.getSheetByName('Tasks');
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var headers = rows[0];
  var tasks = [];
  for (var i = 1; i < rows.length; i++) {{
    var t = rowToObject(headers, rows[i]);
    t.quota = Number(t.quota) || 6;
    t.joinedMembers = parseJsonSafe(t.joinedMembers, []);
    t.assignedMembers = parseJsonSafe(t.assignedMembers, []);
    t.waitlist = parseJsonSafe(t.waitlist, []);
    t.checkedInMembers = parseJsonSafe(t.checkedInMembers, []);
    t.checkinLogs = parseJsonSafe(t.checkinLogs, []);
    t.departmentQuotas = parseJsonSafe(t.departmentQuotas, {{}});
    tasks.push(t);
  }}
  return tasks;
}}

/**
 * Lấy danh sách Đổi / Rút Ca
 */
function getSwapsList(ss) {{
  var sheet = ss.getSheetByName('Swaps');
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var headers = rows[0];
  var swaps = [];
  for (var i = 1; i < rows.length; i++) {{
    swaps.push(rowToObject(headers, rows[i]));
  }}
  return swaps;
}}

/**
 * Lấy danh sách Bài Viết Diễn Đàn
 */
function getPostsList(ss) {{
  var sheet = ss.getSheetByName('Posts');
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var headers = rows[0];
  var posts = [];
  for (var i = 1; i < rows.length; i++) {{
    var p = rowToObject(headers, rows[i]);
    p.likes = Number(p.likes) || 0;
    p.likedBy = parseJsonSafe(p.likedBy, []);
    p.comments = parseJsonSafe(p.comments, []);
    p.isAnonymous = (p.isAnonymous === true || String(p.isAnonymous).toLowerCase() === 'true');
    posts.push(p);
  }}
  return posts;
}}

function rowToObject(headers, row) {{
  var obj = {{}};
  for (var i = 0; i < headers.length; i++) {{
    var key = String(headers[i]).trim();
    obj[key] = row[i];
  }}
  return obj;
}}

/**
 * Xử lý đăng ký ca trực
 */
function handleClaimTask(ss, taskId, memberId, waitlist) {{
  var sheet = ss.getSheetByName('Tasks');
  if (!sheet) return {{ success: false, message: 'Chưa có sheet Tasks' }};
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var idCol = headers.indexOf('id');
  var joinedCol = headers.indexOf('joinedMembers');
  var waitlistCol = headers.indexOf('waitlist');
  var quotaCol = headers.indexOf('quota');

  for (var i = 1; i < rows.length; i++) {{
    if (String(rows[i][idCol]) === String(taskId)) {{
      var joined = parseJsonSafe(rows[i][joinedCol], []);
      var wait = parseJsonSafe(rows[i][waitlistCol], []);
      var quota = Number(rows[i][quotaCol]) || 6;

      if (joined.indexOf(memberId) !== -1 || wait.indexOf(memberId) !== -1) {{
        return {{ success: false, message: 'Bạn đã đăng ký trong ca này rồi!' }};
      }}

      if (waitlist || joined.length >= quota) {{
        wait.push(memberId);
        sheet.getRange(i + 1, waitlistCol + 1).setValue(JSON.stringify(wait));
        return {{ success: true, message: 'Đã vào hàng chờ dự bị!', waitlist: true }};
      }} else {{
        joined.push(memberId);
        sheet.getRange(i + 1, joinedCol + 1).setValue(JSON.stringify(joined));
        return {{ success: true, message: 'Đăng ký ca trực thành công!', waitlist: false }};
      }}
    }}
  }}
  return {{ success: false, message: 'Không tìm thấy ca trực: ' + taskId }};
}}

/**
 * Xử lý rút ca trực
 */
function handleWithdrawTask(ss, taskId, memberId, reason) {{
  var sheet = ss.getSheetByName('Tasks');
  if (!sheet) return {{ success: false, message: 'Chưa có sheet Tasks' }};
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var idCol = headers.indexOf('id');
  var joinedCol = headers.indexOf('joinedMembers');
  var waitlistCol = headers.indexOf('waitlist');

  for (var i = 1; i < rows.length; i++) {{
    if (String(rows[i][idCol]) === String(taskId)) {{
      var joined = parseJsonSafe(rows[i][joinedCol], []);
      var wait = parseJsonSafe(rows[i][waitlistCol], []);

      var jIdx = joined.indexOf(memberId);
      var wIdx = wait.indexOf(memberId);

      if (jIdx === -1 && wIdx === -1) {{
        return {{ success: false, message: 'Bạn chưa tham gia ca trực này' }};
      }}

      if (jIdx !== -1) joined.splice(jIdx, 1);
      if (wIdx !== -1) wait.splice(wIdx, 1);

      // Nếu có người trong hàng chờ, đôn lên vị trí chính thức
      if (wait.length > 0 && joined.length < (Number(rows[i][headers.indexOf('quota')]) || 6)) {{
        var promoted = wait.shift();
        joined.push(promoted);
      }}

      sheet.getRange(i + 1, joinedCol + 1).setValue(JSON.stringify(joined));
      sheet.getRange(i + 1, waitlistCol + 1).setValue(JSON.stringify(wait));

      // Ghi nhận vào Swaps sheet
      var swapsSheet = ss.getSheetByName('Swaps');
      if (swapsSheet) {{
        swapsSheet.appendRow([
          'SWAP_' + Date.now(),
          taskId,
          rows[i][headers.indexOf('title')],
          memberId,
          '',
          '',
          new Date().toISOString(),
          'Đã rút ca: ' + reason
        ]);
      }}

      return {{ success: true, message: 'Đã rút ca trực thành công' }};
    }}
  }}
  return {{ success: false, message: 'Không tìm thấy ca trực: ' + taskId }};
}}

/**
 * Xử lý điểm danh hiện trường bằng QR
 */
function handleCheckinMember(ss, taskId, memberId, adminId) {{
  var sheet = ss.getSheetByName('Tasks');
  if (!sheet) return {{ success: false, message: 'Chưa có sheet Tasks' }};
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var idCol = headers.indexOf('id');
  var checkCol = headers.indexOf('checkedInMembers');
  var logsCol = headers.indexOf('checkinLogs');

  for (var i = 1; i < rows.length; i++) {{
    if (String(rows[i][idCol]) === String(taskId)) {{
      var checked = parseJsonSafe(rows[i][checkCol], []);
      var logs = parseJsonSafe(rows[i][logsCol], []);

      if (checked.indexOf(memberId) === -1) {{
        checked.push(memberId);
        logs.push({{
          memberId: memberId,
          adminId: adminId,
          time: new Date().toISOString()
        }});
        sheet.getRange(i + 1, checkCol + 1).setValue(JSON.stringify(checked));
        sheet.getRange(i + 1, logsCol + 1).setValue(JSON.stringify(logs));
        
        // Tăng số ca đã làm cho thành viên trong Sheet của Ban tương ứng
        incrementMemberCompletedShifts(ss, memberId);

        return {{ success: true, message: 'Điểm danh thành công cho: ' + memberId }};
      }} else {{
        return {{ success: true, message: 'Thành viên ' + memberId + ' đã được điểm danh trước đó!' }};
      }}
    }}
  }}
  return {{ success: false, message: 'Không tìm thấy ca trực: ' + taskId }};
}}

/**
 * Tăng số ca trực hoàn thành trong sheet tương ứng (Cột 1 là Mã ID)
 */
function incrementMemberCompletedShifts(ss, memberId) {{
  for (var d = 0; d < DEPARTMENT_SHEETS.length; d++) {{
    var sheet = ss.getSheetByName(DEPARTMENT_SHEETS[d]);
    if (!sheet) continue;
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {{
      if (String(rows[i][0]).trim() === memberId) {{
        // Nếu có cột 9 (Số Ca Đã Làm) thì tăng lên 1, nếu chưa có thì có thể ghi vào cột 9
        var cur = (rows[i].length >= 9 && !isNaN(Number(rows[i][8]))) ? Number(rows[i][8]) : 0;
        sheet.getRange(i + 1, 9).setValue(cur + 1);
        if (rows[0].length < 9) {{
          sheet.getRange(1, 9).setValue('Số ca hoàn thành').setFontWeight('bold');
        }}
        return;
      }}
    }}
  }}
}}

/**
 * Xử lý tạo ca trực mới
 */
function handleCreateTask(ss, taskObj) {{
  var sheet = ss.getSheetByName('Tasks');
  if (!sheet) return {{ success: false, message: 'Chưa có sheet Tasks' }};

  var id = taskObj.id || ('TASK_' + Date.now());
  sheet.appendRow([
    id,
    taskObj.title || 'Ca trực mới',
    taskObj.location || 'Sân trường',
    taskObj.time || '',
    Number(taskObj.quota) || 6,
    JSON.stringify(taskObj.joinedMembers || []),
    JSON.stringify(taskObj.assignedMembers || []),
    JSON.stringify(taskObj.waitlist || []),
    taskObj.leaderId || '',
    JSON.stringify(taskObj.checkedInMembers || []),
    JSON.stringify(taskObj.checkinLogs || []),
    taskObj.lockDeadline || '',
    taskObj.status || 'Mở Đăng Ký',
    JSON.stringify(taskObj.departmentQuotas || {{}}),
    taskObj.notes || ''
  ]);

  return {{ success: true, message: 'Tạo ca trực mới thành công!', taskId: id }};
}}

/**
 * Xóa vĩnh viễn lệnh điều động khỏi sheet Tasks
 */
function handleDeleteTask(ss, taskId) {{
  var sheet = ss.getSheetByName('Tasks');
  if (!sheet) return {{ success: false, message: 'Chưa có sheet Tasks' }};
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {{
    if (String(rows[i][0]).trim() === String(taskId).trim()) {{
      sheet.deleteRow(i + 1);
      return {{ success: true, message: 'Đã xóa lệnh điều động thành công', taskId: taskId }};
    }}
  }}
  return {{ success: true, message: 'Lệnh không tồn tại hoặc đã được xóa trước đó', taskId: taskId }};
}}

/**
 * Xóa vĩnh viễn bài đăng khỏi sheet Posts
 */
function handleDeletePost(ss, postId) {{
  var sheet = ss.getSheetByName('Posts');
  if (!sheet) return {{ success: false, message: 'Chưa có sheet Posts' }};
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {{
    if (String(rows[i][0]).trim() === String(postId).trim()) {{
      sheet.deleteRow(i + 1);
      return {{ success: true, message: 'Đã xóa bài viết diễn đàn thành công', postId: postId }};
    }}
  }}
  return {{ success: true, message: 'Bài viết không tồn tại hoặc đã được xóa trước đó', postId: postId }};
}}

/**
 * Cập nhật thông tin cá nhân của thành viên trực tiếp vào Sheet Ban tương ứng
 */
function handleUpdateProfile(ss, memberId, lop, sdt, ice, yTe) {{
  if (!memberId) return {{ success: false, message: 'Thiếu Mã ID thành viên' }};
  var updated = false;

  for (var d = 0; d < DEPARTMENT_SHEETS.length; d++) {{
    var deptName = DEPARTMENT_SHEETS[d];
    var sheet = ss.getSheetByName(deptName);
    if (!sheet) continue;
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {{
      if (String(rows[i][0]).trim() === String(memberId).trim()) {{
        if (lop !== undefined && lop !== null && String(lop).trim() !== '') {{
          sheet.getRange(i + 1, 3).setValue(String(lop).trim());
        }}
        if (yTe !== undefined && yTe !== null && String(yTe).trim() !== '') {{
          sheet.getRange(i + 1, 6).setValue(String(yTe).trim());
        }}
        if (sdt !== undefined && sdt !== null && String(sdt).trim() !== '') {{
          sheet.getRange(i + 1, 7).setValue(String(sdt).trim());
        }}
        if (ice !== undefined && ice !== null && String(ice).trim() !== '') {{
          sheet.getRange(i + 1, 8).setValue(String(ice).trim());
        }}
        updated = true;
      }}
    }}
  }}

  if (updated) {{
    var all = getAllMembersFromDepartments(ss);
    return {{ success: true, message: 'Đã cập nhật hồ sơ thành công vào Google Sheet', member: all.membersMap[memberId] }};
  }}
  return {{ success: false, message: 'Không tìm thấy thành viên: ' + memberId }};
}}

/**
 * Xử lý cập nhật quyền Admin / Trưởng ca từ xa và lưu vào Sheet AdminRoles
 */
function handleUpdateMemberRole(ss, memberId, isAdmin, isShiftLeader, adminActorId) {{
  if (!memberId) {{
    return {{ success: false, message: 'Thiếu Mã ID thành viên cần cấp quyền' }};
  }}

  var rolesSheet = ss.getSheetByName('AdminRoles');
  if (!rolesSheet) {{
    rolesSheet = ss.insertSheet('AdminRoles');
    rolesSheet.appendRow(['memberId', 'isAdmin', 'isShiftLeader', 'updatedBy', 'updatedAt']);
    rolesSheet.getRange(1, 1, 1, 5).setBackground('#4c1d95').setFontColor('#ffffff').setFontWeight('bold');
    rolesSheet.setFrozenRows(1);
  }}

  var rRows = rolesSheet.getDataRange().getValues();
  var foundRowIdx = -1;
  for (var i = 1; i < rRows.length; i++) {{
    if (String(rRows[i][0] || '').trim() === memberId) {{
      foundRowIdx = i + 1;
      break;
    }}
  }}

  var now = new Date().toISOString();
  if (foundRowIdx !== -1) {{
    rolesSheet.getRange(foundRowIdx, 2, 1, 4).setValues([[isAdmin, isShiftLeader, adminActorId, now]]);
  }} else {{
    rolesSheet.appendRow([memberId, isAdmin, isShiftLeader, adminActorId, now]);
  }}

  SpreadsheetApp.flush();
  return {{
    success: true,
    message: 'Đã cập nhật phân quyền thành công cho ' + memberId,
    memberId: memberId,
    isAdmin: isAdmin,
    isShiftLeader: isShiftLeader
  }};
}}

/**
 * Xử lý tạo bài viết diễn đàn mới
 */
function handleCreatePost(ss, postObj) {{
  var sheet = ss.getSheetByName('Posts');
  if (!sheet) return {{ success: false, message: 'Chưa có sheet Posts' }};

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

  return {{ success: true, message: 'Đăng bài viết thành công!', postId: id }};
}}

/**
 * ==============================================================================
 * HÀM KHỞI TẠO VÀ DỌN DẸP TOÀN BỘ CƠ SỞ DỮ LIỆU MULTI-SHEET CHUẨN 8 CỘT
 * Chạy hàm này một lần duy nhất từ menu Trình chỉnh sửa Apps Script
 * ==============================================================================
 */
function setupMultiSheetDatabase() {{
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var header = ['Mã ID', 'Họ và Tên', 'Lớp', 'Ban chuyên môn', 'Chức vụ', 'Y tế', 'Số điện thoại', 'Liên hệ khẩn cấp'];
  var totalSeeded = 0;

  // 1. Khởi tạo 7 Sheet Ban chuyên môn chuẩn 8 cột
  for (var d = 0; d < DEPARTMENT_SHEETS.length; d++) {{
    var deptName = DEPARTMENT_SHEETS[d];
    var sheet = ss.getSheetByName(deptName);
    if (!sheet) {{
      sheet = ss.insertSheet(deptName);
    }}
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
    if (members.length > 0) {{
      var rows = [];
      for (var m = 0; m < members.length; m++) {{
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
      }}
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
    }}

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
  }}

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
    JSON.stringify({{ 'Ban Cầu Lông': 2, 'Ban Bóng Chuyền': 2, 'Ban Truyền Thông': 2 }}),
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
    JSON.stringify({{ 'Ban Bóng Đá Nam': 2, 'Ban Truyền Thông': 2 }}),
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
    JSON.stringify([{{ id: 'CMT_01', authorId: 'LDH0912', authorName: 'Lương Đình Hiếu', text: 'Ban Cầu Lông đã sẵn sàng cho giải đấu sắp tới rồi anh Cường ơi!', time: '10:15', replies: [] }}]),
    'FALSE'
  ]);

  // 3. Xóa bỏ sheet mặc định 'Trang tính1' hoặc 'Sheet1' nếu còn tồn tại
  var allSheets = ss.getSheets();
  var keepSheets = DEPARTMENT_SHEETS.concat(APP_SHEETS);
  for (var k = 0; k < allSheets.length; k++) {{
    var sName = allSheets[k].getName();
    if (keepSheets.indexOf(sName) === -1 && allSheets.length > keepSheets.length) {{
      try {{
        ss.deleteSheet(allSheets[k]);
      }} catch(err) {{}}
    }}
  }}

  SpreadsheetApp.flush();
  Logger.log('Đã hoàn tất dọn dẹp và khởi tạo thành công ' + totalSeeded + ' thành viên chuẩn 8 cột vào 7 sheet ban!');
}}
"""

gas_file_path = os.path.join(ROOT_DIR, 'GoogleAppsScript_MultiSheet.js')
with open(gas_file_path, 'w', encoding='utf-8') as f:
    f.write(gas_script_code)

print(f"[OK] Generated GoogleAppsScript_MultiSheet.js ({len(gas_script_code)} bytes)")

# 5. COPY SCRIPT TO WINDOWS CLIPBOARD VIA CLIP.EXE
try:
    p = subprocess.Popen(['clip'], stdin=subprocess.PIPE, shell=True)
    p.communicate(input=gas_script_code.encode('utf-16le'))
    print("[OK] Successfully copied GoogleAppsScript_MultiSheet.js to Windows Clipboard!")
except Exception as e:
    print(f"[WARN] Failed to copy to clipboard: {e}")

print("================================================================================")
print("ALL MULTI-SHEET EXCEL, TSV/TXT AND APPS SCRIPT ASSETS GENERATED SUCCESSFULLY!")
print("================================================================================")
