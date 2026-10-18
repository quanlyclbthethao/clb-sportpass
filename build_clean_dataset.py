import sys, zipfile, xml.etree.ElementTree as ET, datetime, json, subprocess
sys.stdout.reconfigure(encoding='utf-8')

def excel_date(val):
    try:
        f = float(val)
        d = datetime.date(1899, 12, 30) + datetime.timedelta(days=int(f))
        return d.strftime('%d/%m/%Y')
    except:
        return str(val) if val else ''

bcn_path = r'C:\Users\Admin\Downloads\DS BCN CLB thể thao.xlsx'
bcn_dict = {}
with zipfile.ZipFile(bcn_path, 'r') as z:
    ss = []
    if 'xl/sharedStrings.xml' in z.namelist():
        tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for elem in tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
            ss.append(elem.text or '')
    for s in z.namelist():
        if s.startswith('xl/worksheets/sheet'):
            tree = ET.fromstring(z.read(s))
            for row in tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
                r = []
                for c in row.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                    t = c.get('t')
                    v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                    val = v.text if v is not None else ''
                    if t == 's' and val.isdigit(): val = ss[int(val)] if int(val) < len(ss) else val
                    r.append(val)
                if len(r) >= 6 and r[0].isdigit():
                    bcn_dict[r[1].strip().lower()] = r[4].strip()

prefix_map = {
    'Ban Chủ Nhiệm': 'BCN',
    'Ban Bóng Chuyền': 'BC',
    'Ban Bóng Đá Nam': 'BDN',
    'Ban Bóng Đá Nữ': 'BDNU',
    'Ban Cầu Lông': 'CL',
    'Ban Truyền Thông': 'TT'
}

sheet_order = ['Ban Chủ Nhiệm', 'Ban Bóng Chuyền', 'Ban Bóng Đá Nam', 'Ban Bóng Đá Nữ', 'Ban Cầu Lông', 'Ban Truyền Thông']
members = []

with zipfile.ZipFile(r'C:\Users\Admin\Desktop\Danh_sách_Thành_viên_Các_ban_CLB_Thể_thao.xlsx', 'r') as z:
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    rel_map = {r.get('Id'): r.get('Target') for r in rels}
    ss = []
    if 'xl/sharedStrings.xml' in z.namelist():
        tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for elem in tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
            ss.append(elem.text or '')

    sheet_by_name = {}
    for s in wb.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet'):
        sheet_by_name[s.get('name')] = s.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')

    for sname in sheet_order:
        if sname not in sheet_by_name: continue
        prefix = prefix_map[sname]
        rid = sheet_by_name[sname]
        target = 'xl/' + rel_map[rid]
        tree = ET.fromstring(z.read(target))
        
        for row in tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            cells = {}
            for c in row.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                col = ''.join(filter(str.isalpha, c.get('r')))
                t = c.get('t')
                v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                val = v.text if v is not None else ''
                if t == 's' and val.isdigit(): val = ss[int(val)] if int(val) < len(ss) else val
                cells[col] = val.strip()
            
            stt = cells.get('A', '')
            hoten = cells.get('B', '')
            if stt and hoten and hoten != 'Họ và Tên':
                try: stt_num = int(float(stt))
                except: stt_num = 0
                
                member_id = f'{prefix}{stt_num:02d}' if stt_num > 0 else f'{prefix}_{hoten}'
                ngay_sinh = excel_date(cells.get('C', ''))
                chuc_vu = cells.get('D', 'Thành viên')
                lop = cells.get('E', '')
                
                sdt = cells.get('F', '').replace(' ', '').replace('.', '').replace('-', '')
                if sdt.startswith('84'): sdt = '0' + sdt[2:]
                elif sdt and not sdt.startswith('0') and len(sdt) in [9, 10]: sdt = '0' + sdt
                
                khoa = bcn_dict.get(hoten.lower(), 'ĐH Tây Bắc')
                
                cv_low = chuc_vu.lower()
                is_admin = False
                is_leader = False
                if any(x in cv_low for x in ['chủ nhiệm', 'phó chủ nhiệm', 'tổng thư ký', 'thủ quỹ']):
                    is_admin = True
                    is_leader = True
                elif any(x in cv_low for x in ['trưởng ban', 'phó ban']):
                    is_leader = True
                
                members.append({
                    'id': member_id,
                    'hoTen': hoten,
                    'lop': lop,
                    'mssv': ngay_sinh if ngay_sinh else member_id,
                    'khoa': khoa,
                    'boMon': sname,
                    'chucVu': chuc_vu,
                    'sdt': sdt,
                    'yTe': 'Bình thường',
                    'ice': sdt,
                    'soCa': 0,
                    'soCaHoanThanh': 0,
                    'status': 'Sẵn sàng',
                    'theTrang': 'Khỏe mạnh (100% Sẵn sàng)',
                    'avatar': '',
                    'isAdmin': is_admin,
                    'isShiftLeader': is_leader
                })

tsv_lines = []
for m in members:
    sdt_val = "'" + m['sdt'] if m['sdt'] else ""
    row = [
        m['id'], m['hoTen'], m['lop'], m['mssv'], m['khoa'], m['boMon'], m['chucVu'],
        sdt_val, m['yTe'], sdt_val, str(m['soCa']), str(m['soCaHoanThanh']), m['status'],
        m['theTrang'], m['avatar'], 'TRUE' if m['isAdmin'] else 'FALSE', 'TRUE' if m['isShiftLeader'] else 'FALSE'
    ]
    tsv_lines.append('\t'.join(row))

tsv_content = '\n'.join(tsv_lines)
with open(r'C:\Users\Admin\.gemini\antigravity\scratch\clb-sportpass\members_clean.tsv', 'w', encoding='utf-8') as f:
    f.write(tsv_content)

# Copy trực tiếp vào Clipboard Windows
p = subprocess.Popen(['clip'], stdin=subprocess.PIPE, shell=True)
p.communicate(input=tsv_content.encode('utf-16le'))

js_code = """
function autoSeedAllMembersAndCleanSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var mSheet = ss.getSheetByName('Members');
  if (!mSheet) { mSheet = ss.insertSheet('Members'); }
  mSheet.clear();
  
  mSheet.appendRow([
    'id', 'hoTen', 'lop', 'mssv', 'khoa', 'boMon', 'chucVu', 
    'sdt', 'yTe', 'ice', 'soCa', 'soCaHoanThanh', 'status', 
    'theTrang', 'avatar', 'isAdmin', 'isShiftLeader'
  ]);
  
  var members = """ + json.dumps(members, ensure_ascii=False) + """;
  
  var rows = [];
  for (var i = 0; i < members.length; i++) {
    var m = members[i];
    rows.push([
      m.id, m.hoTen, m.lop, m.mssv, m.khoa, m.boMon, m.chucVu,
      m.sdt ? ("'" + m.sdt) : "", m.yTe, m.sdt ? ("'" + m.sdt) : "", m.soCa, m.soCaHoanThanh, m.status,
      m.theTrang, m.avatar, m.isAdmin ? 'TRUE' : 'FALSE', m.isShiftLeader ? 'TRUE' : 'FALSE'
    ]);
  }
  
  if (rows.length > 0) {
    mSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    mSheet.getRange('H:H').setNumberFormat('@');
    mSheet.getRange('J:J').setNumberFormat('@');
  }
  
  var required = ['Members', 'Tasks', 'Swaps', 'Posts'];
  for (var k = 0; k < required.length; k++) {
    if (!ss.getSheetByName(required[k])) {
      var newSh = ss.insertSheet(required[k]);
      if (required[k] === 'Tasks') {
        newSh.appendRow(['id', 'title', 'location', 'time', 'quota', 'joinedMembers', 'assignedMembers', 'waitlist', 'leaderId', 'checkedInMembers', 'checkinLogs', 'lockDeadline', 'status', 'departmentQuotas']);
      } else if (required[k] === 'Swaps') {
        newSh.appendRow(['id', 'taskId', 'taskTitle', 'fromMemberId', 'fromMemberName', 'toMemberId', 'createdAt', 'status']);
      } else if (required[k] === 'Posts') {
        newSh.appendRow(['id', 'authorId', 'authorName', 'authorRole', 'authorAvatar', 'content', 'image', 'createdAt', 'likes', 'likedBy', 'comments', 'isAnonymous']);
      }
    }
  }
  
  var allSheets = ss.getSheets();
  for (var j = 0; j < allSheets.length; j++) {
    var name = allSheets[j].getName();
    if (required.indexOf(name) === -1 && allSheets.length > 1) {
      try { ss.deleteSheet(allSheets[j]); } catch(e) {}
    }
  }
  
  Logger.log('Success: ' + rows.length);
}
"""

with open(r'C:\Users\Admin\.gemini\antigravity\scratch\clb-sportpass\auto_seed_code.js', 'w', encoding='utf-8') as f:
    f.write(js_code)

print('Done: Processed', len(members), 'members and copied to Clipboard!')
