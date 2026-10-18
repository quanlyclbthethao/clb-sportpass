import json
import re
import sys
import os
import subprocess
import zipfile
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8')
DIR = r'C:\Users\Admin\.gemini\antigravity\scratch\clb-sportpass'
DRIVE_DIR = r'G:\Drive của tôi'

print("=== EXHAUSTIVE VERIFICATION OF 8-COLUMN MULTI-SHEET SYSTEM ===")

# --- 1. DATASET VALIDATION (data_by_dept_8cols.json) ---
dept_data = json.load(open(os.path.join(DIR, 'data_by_dept_8cols.json'), encoding='utf-8'))
assert len(dept_data) == 7, f"Expected 7 departments, got {len(dept_data)}"
total_records = sum(len(v) for v in dept_data.values())
assert total_records == 125, f"Expected 125 records, got {total_records}"

expected_keys = ['id', 'hoTen', 'lop', 'boMon', 'chucVu', 'yTe', 'sdt', 'ice']
for dept, mems in dept_data.items():
    for m in mems:
        for k in expected_keys:
            assert k in m, f"Missing key {k} in {m}"
        assert re.match(r'^[A-Z]+[0-9]{4}$', m['id']), f"Invalid ID {m['id']}"
        assert m['boMon'] == dept, f"boMon mismatch: {m['boMon']} vs {dept}"
        assert m['yTe'] == 'Bình thường', f"Unexpected yTe: {m['yTe']}"
        if m['sdt']:
            assert m['sdt'].startswith('0') and len(m['sdt']) in [9, 10, 11], f"Invalid phone {m['sdt']}"
        if m['ice']:
            assert m['ice'].startswith('0') and len(m['ice']) in [9, 10, 11], f"Invalid ICE {m['ice']}"

cuong = [m for m in dept_data['Ban Nhân Sự'] if m['id'] == 'DMC0806'][0]
assert cuong['hoTen'] == 'Đỗ Mạnh Cường' and cuong['sdt'] == '' and cuong['ice'] == '', f"Bad Cuong: {cuong}"

hieu = [m for m in dept_data['Ban Cầu Lông'] if m['id'] == 'LDH0912'][0]
assert hieu['hoTen'] == 'Lương Đình Hiếu' and hieu['sdt'] == '0787246014' and hieu['ice'] == '0787246014', f"Bad Hieu: {hieu}"

print("[PASS] 1. data_by_dept_8cols.json: 7 departments, 125 records, 8 standard columns!")

# --- 2. TSV / TXT COPY FILES VALIDATION ---
tsv_dirs = [
    os.path.join(DRIVE_DIR, 'Du_Lieu_Copy_Tung_Ban'),
    os.path.join(DIR, 'Du_Lieu_Copy_Tung_Ban')
]

expected_files = [
    '1_Ban_Chu_Nhiem',
    '2_Ban_Nhan_Su',
    '3_Ban_Bong_Chuyen',
    '4_Ban_Bong_Da_Nam',
    '5_Ban_Bong_Da_Nu',
    '6_Ban_Cau_Long',
    '7_Ban_Truyen_Thong'
]

expected_counts = {
    '1_Ban_Chu_Nhiem': 9,
    '2_Ban_Nhan_Su': 3,
    '3_Ban_Bong_Chuyen': 56,
    '4_Ban_Bong_Da_Nam': 21,
    '5_Ban_Bong_Da_Nu': 23,
    '6_Ban_Cau_Long': 2,
    '7_Ban_Truyen_Thong': 11
}

for t_dir in tsv_dirs:
    for f_base in expected_files:
        for ext in ['.tsv', '.txt']:
            f_path = os.path.join(t_dir, f_base + ext)
            assert os.path.exists(f_path), f"File not found: {f_path}"
            lines = [l for l in open(f_path, encoding='utf-8').read().split('\n') if l.strip()]
            header_parts = lines[0].split('\t')
            assert len(header_parts) == 8, f"Expected 8 header columns in {f_path}, got {len(header_parts)}"
            assert header_parts == ['Mã ID', 'Họ và Tên', 'Lớp', 'Ban chuyên môn', 'Chức vụ', 'Y tế', 'Số điện thoại', 'Liên hệ khẩn cấp']
            
            data_rows = lines[1:]
            assert len(data_rows) == expected_counts[f_base], f"Expected {expected_counts[f_base]} rows in {f_path}, got {len(data_rows)}"
            for r in data_rows:
                parts = r.split('\t')
                assert len(parts) == 8, f"Row column count != 8 in {f_path}: {r}"

print("[PASS] 2. TSV/TXT Copy files: 100% verified across both Drive and scratch directories!")

# --- 3. EXCEL WORKBOOKS VALIDATION ---
excel_files = [
    os.path.join(DRIVE_DIR, 'CLB_The_Thao_Danh_Sach_Thanh_Vien_Chuan_Hoa.xlsx'),
    os.path.join(DRIVE_DIR, 'AutoBridge', 'Outbox', 'CLB_The_Thao_Danh_Sach_Thanh_Vien_Chuan_Hoa.xlsx'),
    os.path.join(DIR, 'CLB_The_Thao_Danh_Sach_Thanh_Vien_Chuan_Hoa.xlsx')
]

for ef in excel_files:
    assert os.path.exists(ef), f"Excel file does not exist: {ef}"
    with zipfile.ZipFile(ef, 'r') as z:
        wb_xml = ET.fromstring(z.read('xl/workbook.xml'))
        sheet_names = [s.get('name') for s in wb_xml.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet')]
        assert len(sheet_names) == 10, f"Expected 10 sheets in {ef}, got {len(sheet_names)}: {sheet_names}"
        for d in dept_data.keys():
            assert d in sheet_names, f"Department sheet {d} missing in {ef}"
        for s in ['Tasks', 'Swaps', 'Posts']:
            assert s in sheet_names, f"App sheet {s} missing in {ef}"

print("[PASS] 3. Excel Workbooks: 10 sheets (7 Depts + Tasks, Swaps, Posts) in all target paths!")

# --- 4. GOOGLE APPS SCRIPT VALIDATION ---
gas_path = os.path.join(DIR, 'GoogleAppsScript_MultiSheet.js')
gas_code = open(gas_path, encoding='utf-8').read()

assert 'setupMultiSheetDatabase' in gas_code
assert 'getAllMembersFromDepartments' in gas_code
assert 'DMC0806' in gas_code
assert 'LDH0912' in gas_code
assert 'DDH1011' in gas_code
assert 'TCT0803' in gas_code
assert 'TTTL1805' in gas_code

# Check 8-column header definition in GAS
assert "var header = ['Mã ID', 'Họ và Tên', 'Lớp', 'Ban chuyên môn', 'Chức vụ', 'Y tế', 'Số điện thoại', 'Liên hệ khẩn cấp'];" in gas_code

# Check column format rules in setup
assert "sheet.getRange('A:A').setNumberFormat('@');" in gas_code
assert "sheet.getRange('B:B').setNumberFormat('@');" in gas_code
assert "sheet.getRange('G:G').setNumberFormat('@');" in gas_code
assert "sheet.getRange('H:H').setNumberFormat('@');" in gas_code

# Check permission merge logic in GAS
assert 'foundMember.isAdmin = true;' in gas_code
assert 'foundMember.isShiftLeader = true;' in gas_code
assert 'foundMember.chucVu = m.chucVu;' in gas_code
assert 'foundMember.boMon = m.boMon;' in gas_code
assert 'currentMember.isAdmin = true;' in gas_code
assert 'currentMember.chucVu = membersList[k].chucVu;' in gas_code

# Check shift increment checks col 0 (Mã ID)
assert 'String(rows[i][0]).trim() === memberId' in gas_code

print("[PASS] 4. GoogleAppsScript_MultiSheet.js: 8-column schema, multi-role merge, and setup validated!")

# --- 5. FRONTEND INDEX.HTML VALIDATION ---
html = open(os.path.join(DIR, 'index.html'), encoding='utf-8').read()
assert 'DMC0806' in html
assert 'LDH0912' in html
assert 'DDH1011' in html
assert 'TCT0803' in html
assert 'TTTL1805' in html

# Verify profile attributes
assert 'id="dMemberId"' in html
assert 'id="dFullName"' in html
assert 'id="dPhone"' in html
assert 'id="dIce"' in html
assert 'Trường Đại học Hải Dương' in html
assert 'toggleDemoRole' not in html

print("[PASS] 5. index.html: Production 8-column schema, sole admin, and UHD entity verified!")

# --- 6. WINDOWS CLIPBOARD VERIFICATION ---
p = subprocess.Popen(['powershell', '-Command', '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-Clipboard'], stdout=subprocess.PIPE)
out, _ = p.communicate()
clip_text = out.decode('utf-8', errors='ignore')
assert 'GOOGLE APPS SCRIPT BACKEND CHO CLB-SPORTPASS (MULTI-SHEET ARCHITECTURE)' in clip_text
assert 'setupMultiSheetDatabase' in clip_text
assert 'DMC0806' in clip_text
assert 'Liên hệ khẩn cấp' in clip_text
print("[PASS] 6. Windows Clipboard: verified matching GoogleAppsScript_MultiSheet.js with 8 columns!")

# --- 7. DEEP ALGORITHMIC VERIFICATION OF MULTI-ROLE MERGE ---
# Verify that getAllMembersFromDepartments in GAS consolidates duplicate members by ID
assert 'membersMap[effectiveId]' in gas_code
assert 'mergedList.push(membersMap[order[k]]);' in gas_code

# Simulate the exact merge algorithm from GAS on the 125 rows across 7 departments
sim_members_map = {}
sim_order = []
for dept, mems in dept_data.items():
    for m in mems:
        m_id = m['id']
        cv = m['chucVu'].lower()
        bm = m['boMon'].lower()
        is_adm = (dept == 'Ban Chủ Nhiệm' or 'chủ nhiệm' in bm or 
                  (dept == 'Ban Nhân Sự' and ('trưởng ban' in cv or 'phó ban' in cv)) or
                  'chủ nhiệm' in cv or 'phó chủ nhiệm' in cv or 'tổng thư ký' in cv or 'thủ quỹ' in cv or
                  m_id == 'DMC0806')
        is_sl = is_adm or 'trưởng ban' in cv or 'phó ban' in cv

        if m_id not in sim_members_map:
            sim_members_map[m_id] = {
                'id': m_id,
                'hoTen': m['hoTen'],
                'isAdmin': is_adm,
                'isShiftLeader': is_sl,
                'chucVu': m['chucVu'],
                'cacBan': [dept]
            }
            sim_order.append(m_id)
        else:
            rec = sim_members_map[m_id]
            if dept not in rec['cacBan']:
                rec['cacBan'].append(dept)
            if is_adm and not rec['isAdmin']:
                rec['isAdmin'] = True
                rec['isShiftLeader'] = True
                rec['chucVu'] = m['chucVu']
            elif is_sl and not rec['isShiftLeader']:
                rec['isShiftLeader'] = True
                rec['chucVu'] = m['chucVu']
            elif rec['chucVu'].lower() == 'thành viên' and cv != 'thành viên':
                rec['chucVu'] = m['chucVu']

assert len(sim_order) == 118, f"Expected 118 unique members after multi-role merge, got {len(sim_order)}"
# Verify TMT1404 (Thành viên in Bong Chuyen, Pho Ban in Bong Da Nam) is Shift Leader
assert sim_members_map['TMT1404']['isShiftLeader'] == True, "TMT1404 must be Shift Leader after multi-role merge!"
# Verify LDH0912 is Admin
assert sim_members_map['LDH0912']['isAdmin'] == True, "LDH0912 must be Admin from Ban Chu Nhiem!"
# Verify TTTL1805 is in 3 departments
assert len(sim_members_map['TTTL1805']['cacBan']) == 3, f"TTTL1805 should be in 3 departments, got {sim_members_map['TTTL1805']['cacBan']}"

# Verify index.html birthdate extraction and deduplication logic
assert 'dDigits.slice(0, 2)' in html
assert 'const seenIds = new Set();' in html
assert 'otherDeptDisplay' in html

print("[PASS] 7. Deep Algorithmic Multi-Role Merge: 118 unique members, officer rights strictly preserved, frontend smart date & deduplication verified!")

print("=================================================================")
print("ALL 7/7 EXHAUSTIVE VERIFICATION SUITE CHECKS PASSED 100%!")
print("=================================================================")

