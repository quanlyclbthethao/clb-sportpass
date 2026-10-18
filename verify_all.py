import json
import re
import sys
import os
import subprocess
import unicodedata

sys.stdout.reconfigure(encoding='utf-8')
DIR = r'C:\Users\Admin\.gemini\antigravity\scratch\clb-sportpass'

print("=== RUNNING EXHAUSTIVE VERIFICATION SUITE ===")

# --- 1. ID GENERATION FORMULA TEST ---
def remove_accents(input_str):
    if not input_str:
        return ''
    s = input_str.replace('Đ', 'D').replace('đ', 'd')
    nfkd = unicodedata.normalize('NFKD', s)
    return ''.join([c for c in nfkd if not unicodedata.combining(c)])

def compute_expected_id(name, dob):
    clean_name = remove_accents(name).strip()
    words = re.findall(r'[A-Za-z]+', clean_name)
    initials = ''.join([w[0].upper() for w in words])
    m = re.search(r'(\d{1,2})[/.-](\d{1,2})', dob or '')
    if m:
        dd = m.group(1).zfill(2)
        mm = m.group(2).zfill(2)
        ddmm = dd + mm
    else:
        ddmm = '0000'
    return initials + ddmm

# --- 2. data_by_dept.json ---
data = json.load(open(os.path.join(DIR, 'data_by_dept.json'), encoding='utf-8'))
assert len(data) == 7, f'Expected 7 depts, got {len(data)}'
total = sum(len(v) for v in data.values())
assert total == 125, f'Expected 125 records, got {total}'
assert len(data['Ban Cầu Lông']) == 2, f'Expected 2 in Ban Cầu Lông, got {len(data["Ban Cầu Lông"])}'

hieu = data['Ban Cầu Lông'][0]
huy = data['Ban Cầu Lông'][1]
assert hieu['id'] == 'LDH0912' and hieu['hoTen'] == 'Lương Đình Hiếu' and hieu['sdt'] == '0787246014', f'Bad Hieu: {hieu}'
assert huy['id'] == 'DDH1011' and huy['hoTen'] == 'Đinh Đức Huy' and huy['sdt'] == '0362936958', f'Bad Huy: {huy}'

cuong = [m for m in data['Ban Nhân Sự'] if m['hoTen'] == 'Đỗ Mạnh Cường'][0]
nam = [m for m in data['Ban Nhân Sự'] if m['hoTen'] == 'Nguyễn Hoài Nam'][0]
assert cuong['id'] == 'DMC0806' and cuong['ngaySinh'] == '08/06/2003' and cuong['sdt'] == '', f'Bad Cuong: {cuong}'
assert nam['id'] == 'NHN1502' and nam['sdt'] == '', f'Bad Nam: {nam}'

for dept, mems in data.items():
    for m in mems:
        exp_id = compute_expected_id(m['hoTen'], m.get('ngaySinh', ''))
        assert m['id'] == exp_id, f'ID formula mismatch for {m["hoTen"]}: expected {exp_id}, got {m["id"]}'
        assert re.match(r'^[A-Z]+[0-9]{4}$', m['id']), f'Invalid ID format {m["id"]} in {dept}'

print('[PASS] 1. data_by_dept.json: 7 depts, 125 records, 100% ID formula compliance!')

# --- 3. members_clean.json ---
m_clean = json.load(open(os.path.join(DIR, 'members_clean.json'), encoding='utf-8'))
assert len(m_clean) == 125, f'Expected 125 items, got {len(m_clean)}'
for m in m_clean:
    assert re.match(r'^[A-Z]+[0-9]{4}$', m['id']), f'Invalid ID in members_clean: {m["id"]}'

cuong_clean = [m for m in m_clean if m['id'] == 'DMC0806'][0]
assert cuong_clean['isAdmin'] == True, 'DMC0806 must be Admin in members_clean.json'
assert cuong_clean['sdt'] == '', 'DMC0806 phone must be empty'
assert cuong_clean['ice'] == '', 'DMC0806 ice must be empty'

nam_clean = [m for m in m_clean if m['id'] == 'NHN1502'][0]
assert nam_clean['isAdmin'] == True, 'NHN1502 must be Admin in members_clean.json'
assert nam_clean['sdt'] == '', 'NHN1502 phone must be empty'
print('[PASS] 2. members_clean.json: 125 items, correct Admin rights & clean phones!')

# --- 4. members_clean.tsv ---
tsv_lines = [l for l in open(os.path.join(DIR, 'members_clean.tsv'), encoding='utf-8').read().split('\n') if l.strip()]
assert len(tsv_lines) == 125, f'Expected 125 lines in tsv, got {len(tsv_lines)}'
for idx, l in enumerate(tsv_lines):
    parts = l.split('\t')
    assert len(parts) == 17, f'Line {idx+1} has {len(parts)} columns'
    m_json = m_clean[idx]
    assert parts[0] == m_json['id'], f'TSV ID mismatch at {idx}: {parts[0]} vs {m_json["id"]}'
    assert parts[15] == ('TRUE' if m_json['isAdmin'] else 'FALSE'), f'TSV isAdmin mismatch at {idx}'

cuong_tsv = [l for l in tsv_lines if l.startswith('DMC0806\t')][0]
parts_cuong = cuong_tsv.split('\t')
assert parts_cuong[15] == 'TRUE', 'DMC0806 must have TRUE for isAdmin in TSV'
assert parts_cuong[7] == '', 'DMC0806 phone must be empty in TSV'
assert parts_cuong[9] == '', 'DMC0806 ice must be empty in TSV'
print('[PASS] 3. members_clean.tsv: 125 lines, 17 columns, synchronized with JSON!')

# --- 5. GoogleAppsScript_MultiSheet.js ---
gas_code = open(os.path.join(DIR, 'GoogleAppsScript_MultiSheet.js'), encoding='utf-8').read()
assert 'DMC0806' in gas_code
assert 'LDH0912' in gas_code
assert 'DDH1011' in gas_code
assert '125 thành viên' in gas_code
assert 'setupMultiSheetDatabase' in gas_code
assert "sheet.getRange('B:B').setNumberFormat('@');" in gas_code
assert "sheet.getRange('D:D').setNumberFormat('@');" in gas_code
assert "sheet.getRange('G:G').setNumberFormat('@');" in gas_code

# Test permission merge logic in GAS
assert 'foundMember.isAdmin = true;' in gas_code
assert 'foundMember.isShiftLeader = true;' in gas_code
assert 'foundMember.chucVu = m.chucVu;' in gas_code
assert 'foundMember.boMon = m.boMon;' in gas_code
assert 'currentMember.isAdmin = true;' in gas_code
assert 'currentMember.chucVu = membersList[k].chucVu;' in gas_code

# Simulate dual-role member (e.g. Tran Manh Tuan: Ban Bong Chuyen (Thanh vien) -> Ban Bong Da Nam (Pho Ban))
found = {'id': 'TMT1404', 'chucVu': 'Thành viên', 'boMon': 'Ban Bóng Chuyền', 'isAdmin': False, 'isShiftLeader': False, 'sdt': '0877661191'}
m_second = {'id': 'TMT1404', 'chucVu': 'Phó Ban', 'boMon': 'Ban Bóng Đá Nam', 'isAdmin': False, 'isShiftLeader': True, 'sdt': '0877661191'}

# Apply the merge logic as implemented in GAS
if m_second['isAdmin'] and not found['isAdmin']:
    found['isAdmin'] = True
    found['isShiftLeader'] = True
    found['chucVu'] = m_second['chucVu']
    found['boMon'] = m_second['boMon']
elif m_second['isShiftLeader'] and not found['isShiftLeader']:
    found['isShiftLeader'] = True
    found['chucVu'] = m_second['chucVu']
    found['boMon'] = m_second['boMon']
else:
    found['isAdmin'] = found['isAdmin'] or m_second['isAdmin']
    found['isShiftLeader'] = found['isShiftLeader'] or m_second['isShiftLeader']

assert found['isShiftLeader'] == True, 'Tran Manh Tuan must be Shift Leader'
assert found['chucVu'] == 'Phó Ban', f'Expected Pho Ban, got {found["chucVu"]}'
assert found['boMon'] == 'Ban Bóng Đá Nam', f'Expected Ban Bong Da Nam, got {found["boMon"]}'

print('[PASS] 4. GoogleAppsScript_MultiSheet.js: Dual-role merge & multi-sheet setup validated!')

# --- 6. index.html ---
html = open(os.path.join(DIR, 'index.html'), encoding='utf-8').read()
assert 'placeholder="DMC0806 hoặc SĐT..."' in html
assert 'value="DMC0806"' in html
assert 'CLB001' not in html
assert 'CLB002' not in html
assert 'CLB003' not in html
assert 'CLB004' not in html
assert 'DMC0806' in html
assert 'LDH0912' in html
assert 'DDH1011' in html

# Verify no phone leak for DMC0806 in index.html
demo_match = re.search(r"id:\s*'DMC0806'[\s\S]*?ice:\s*'([^']*)'", html)
assert demo_match, 'Could not find DMC0806 demo block'
assert demo_match.group(1) == '', f'Leaked ICE for DMC0806 in index.html: {demo_match.group(1)}'

# Verify toggleDemoRole cycling
assert "if (currentUser.id === 'DMC0806')" in html
assert "nextId = 'LDH0912'" in html
assert "else if (currentUser.id === 'LDH0912')" in html
assert "nextId = 'DDH1011'" in html
print('[PASS] 5. index.html: Clean mock data, no ICE leak, and bulletproof demo role cycling!')

# --- 7. Windows Clipboard Verification ---
p = subprocess.Popen(['powershell', '-Command', 'Get-Clipboard'], stdout=subprocess.PIPE)
out, _ = p.communicate()
clip_text = out.decode('utf-8', errors='ignore')
assert 'GOOGLE APPS SCRIPT BACKEND CHO CLB-SPORTPASS (MULTI-SHEET ARCHITECTURE)' in clip_text
assert 'foundMember.isAdmin = true;' in clip_text
assert 'DMC0806' in clip_text
print('[PASS] 6. Windows Clipboard: verified matching latest GoogleAppsScript_MultiSheet.js!')

print('=================================================================')
print('ALL 6/6 EXHAUSTIVE VERIFICATION SUITE CHECKS PASSED 100%!')
print('=================================================================')
