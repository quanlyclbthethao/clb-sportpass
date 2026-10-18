import sys, json, os, xlsxwriter
sys.stdout.reconfigure(encoding='utf-8')


with open(r'C:\Users\Admin\.gemini\antigravity\scratch\clb-sportpass\data_by_dept.json', 'r', encoding='utf-8') as f:
    data_by_dept = json.load(f)

dest_paths = [
    r'G:\Drive của tôi\CLB_The_Thao_Danh_Sach_Thanh_Vien_Chuan_Hoa.xlsx',
    r'G:\Drive của tôi\AutoBridge\Outbox\CLB_The_Thao_Danh_Sach_Thanh_Vien_Chuan_Hoa.xlsx',
    r'C:\Users\Admin\.gemini\antigravity\scratch\clb-sportpass\CLB_The_Thao_Danh_Sach_Thanh_Vien_Chuan_Hoa.xlsx'
]

def create_workbook(file_path):
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    wb = xlsxwriter.Workbook(file_path)

    # Formats
    header_fmt = wb.add_format({
        'bold': True,
        'font_color': '#FFFFFF',
        'bg_color': '#0F172A',
        'align': 'center',
        'valign': 'vcenter',
        'border': 1,
        'border_color': '#334155'
    })
    
    id_fmt = wb.add_format({
        'bold': True,
        'align': 'center',
        'valign': 'vcenter',
        'num_format': '@',
        'font_color': '#0369A1'
    })
    
    center_fmt = wb.add_format({
        'align': 'center',
        'valign': 'vcenter',
        'num_format': '@'
    })
    
    phone_fmt = wb.add_format({
        'align': 'center',
        'valign': 'vcenter',
        'num_format': '@',
        'font_color': '#047857'
    })
    
    text_fmt = wb.add_format({
        'align': 'left',
        'valign': 'vcenter'
    })
    
    num_fmt = wb.add_format({
        'align': 'center',
        'valign': 'vcenter',
        'num_format': '#,##0'
    })

    headers = ['STT', 'Mã ID', 'Họ và Tên', 'Ngày Sinh', 'Chức Vụ', 'Lớp', 'SĐT', 'Khoa', 'Số Ca Đã Làm']

    dept_order = [
        'Ban Chủ Nhiệm',
        'Ban Nhân Sự',
        'Ban Bóng Chuyền',
        'Ban Bóng Đá Nam',
        'Ban Bóng Đá Nữ',
        'Ban Cầu Lông',
        'Ban Truyền Thông'
    ]

    for dept in dept_order:
        ws = wb.add_worksheet(dept)
        ws.freeze_panes(1, 0)
        ws.set_row(0, 26)

        # Write header
        for col_idx, h in enumerate(headers):
            ws.write(0, col_idx, h, header_fmt)

        members = data_by_dept.get(dept, [])
        for row_idx, m in enumerate(members, start=1):
            ws.set_row(row_idx, 20)
            ws.write(row_idx, 0, m.get('stt', row_idx), num_fmt)
            ws.write(row_idx, 1, m.get('id', ''), id_fmt)
            ws.write(row_idx, 2, m.get('hoTen', ''), text_fmt)
            ws.write(row_idx, 3, m.get('ngaySinh', ''), center_fmt)
            ws.write(row_idx, 4, m.get('chucVu', 'Thành viên'), text_fmt)
            ws.write(row_idx, 5, m.get('lop', ''), center_fmt)
            
            sdt = m.get('sdt', '')
            if sdt and not str(sdt).startswith('0'):
                sdt = '0' + str(sdt)
            ws.write(row_idx, 6, sdt, phone_fmt)
            
            ws.write(row_idx, 7, m.get('khoa', 'Trường Đại học Hải Dương'), text_fmt)
            ws.write(row_idx, 8, 0, num_fmt)

        # Column widths
        ws.set_column(0, 0, 7)   # STT
        ws.set_column(1, 1, 14)  # Mã ID
        ws.set_column(2, 2, 26)  # Họ và Tên
        ws.set_column(3, 3, 14)  # Ngày Sinh
        ws.set_column(4, 4, 25)  # Chức Vụ
        ws.set_column(5, 5, 14)  # Lớp
        ws.set_column(6, 6, 16)  # SĐT
        ws.set_column(7, 7, 18)  # Khoa
        ws.set_column(8, 8, 14)  # Số Ca Đã Làm

    # Sheet Tasks
    ws_tasks = wb.add_worksheet('Tasks')
    ws_tasks.freeze_panes(1, 0)
    ws_tasks.set_row(0, 26)
    task_headers = ['id', 'title', 'location', 'time', 'quota', 'joinedMembers', 'assignedMembers', 'waitlist', 'leaderId', 'checkedInMembers', 'checkinLogs', 'lockDeadline', 'status', 'departmentQuotas']
    t_header_fmt = wb.add_format({'bold': True, 'font_color': '#FFFFFF', 'bg_color': '#047857', 'align': 'center', 'valign': 'vcenter', 'border': 1})
    for c_idx, th in enumerate(task_headers):
        ws_tasks.write(0, c_idx, th, t_header_fmt)
    
    sample_tasks = [
        ['TASK_001', 'Trực sân Bóng Chuyền - Giải Giao Hữu Tân Sinh Viên K16', 'Nhà Thi Đấu Trường Đại học Hải Dương', '07:30 - 11:30 | Thứ Bảy', 6, '[]', '[]', '[]', 'TCT0803', '[]', '[]', '2026-10-18T22:00:00Z', 'Mở Đăng Ký', '{"Ban Bóng Chuyền": 3, "Ban Chủ Nhiệm": 1, "Ban Nhân Sự": 1, "Ban Truyền Thông": 1}'],
        ['TASK_002', 'Điều phối Giải Bóng Đá Nam Vòng Bảng Khoa GDTC', 'Sân Bóng Cỏ Nhân Tạo', '14:00 - 17:30 | Chủ Nhật', 8, '[]', '[]', '[]', 'NQD1509', '[]', '[]', '2026-10-19T10:00:00Z', 'Mở Đăng Ký', '{"Ban Bóng Đá Nam": 5, "Ban Cầu Lông": 1, "Ban Truyền Thông": 2}'],
        ['TASK_003', 'Hỗ trợ Truyền Thông & Livestream Khai Mạc Giải Thể Thao', 'Hội Trường Trung Tâm', '18:30 - 21:30 | Thứ Hai', 4, '[]', '[]', '[]', 'TTTL1805', '[]', '[]', '2026-10-20T12:00:00Z', 'Mở Đăng Ký', '{"Ban Truyền Thông": 3, "Ban Chủ Nhiệm": 1}']
    ]
    for r_idx, t_row in enumerate(sample_tasks, start=1):
        ws_tasks.set_row(r_idx, 20)
        for c_idx, val in enumerate(t_row):
            ws_tasks.write(r_idx, c_idx, val, text_fmt)
    ws_tasks.set_column(0, 0, 14)
    ws_tasks.set_column(1, 1, 40)
    ws_tasks.set_column(2, 2, 26)
    ws_tasks.set_column(3, 3, 25)

    # Sheet Swaps
    ws_swaps = wb.add_worksheet('Swaps')
    ws_swaps.freeze_panes(1, 0)
    ws_swaps.set_row(0, 26)
    swap_headers = ['id', 'taskId', 'taskTitle', 'fromMemberId', 'fromMemberName', 'toMemberId', 'createdAt', 'status']
    s_header_fmt = wb.add_format({'bold': True, 'font_color': '#FFFFFF', 'bg_color': '#B45309', 'align': 'center', 'valign': 'vcenter', 'border': 1})
    for c_idx, sh in enumerate(swap_headers):
        ws_swaps.write(0, c_idx, sh, s_header_fmt)

    # Sheet Posts
    ws_posts = wb.add_worksheet('Posts')
    ws_posts.freeze_panes(1, 0)
    ws_posts.set_row(0, 26)
    post_headers = ['id', 'authorId', 'authorName', 'authorRole', 'authorAvatar', 'content', 'image', 'createdAt', 'likes', 'likedBy', 'comments', 'isAnonymous']
    p_header_fmt = wb.add_format({'bold': True, 'font_color': '#FFFFFF', 'bg_color': '#1D4ED8', 'align': 'center', 'valign': 'vcenter', 'border': 1})
    for c_idx, ph in enumerate(post_headers):
        ws_posts.write(0, c_idx, ph, p_header_fmt)
    ws_posts.write_row(1, 0, ['POST_WELCOME', 'DMC0806', 'Đỗ Mạnh Cường', 'Trưởng Ban Nhân Sự', '', '🎉 Chào mừng toàn thể thành viên đến với SportPass PWA! Hãy kiểm tra ca trực mới và đăng ký nhận ca đúng giờ nhé.', '', '2026-10-14T10:00:00.000Z', 12, '["DMC0806", "LDH0912", "DDH1011"]', '[]', 'FALSE'])

    wb.close()
    print('Created:', file_path)

for path in dest_paths:
    try:
        create_workbook(path)
    except Exception as e:
        print('Error creating', path, e)
