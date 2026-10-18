import json

with open(r'C:\Users\Admin\.gemini\antigravity\scratch\clb-sportpass\members_clean.json', 'r', encoding='utf-8') as f:
    members = json.load(f)

# Tach members thanh cac chunk 30 nguoi de nhe
js_code = f"""/**
 * ==============================================================================
 * BACKEND APPS SCRIPT HOÀN CHỈNH CHO CLB-SPORTPASS
 * ĐÃ TÍCH HỢP SẴN DATA 121 THÀNH VIÊN VÀ HÀM TỰ ĐỘNG NẠP
 * ==============================================================================
 */

function doGet(e) {{
  return handleRequest(e);
}}

function doPost(e) {{
  return handleRequest(e);
}}

function handleRequest(e) {{
  var params = e.parameter || {{}};
  var action = params.action || '';
  var responseData = {{ success: false, message: 'Hành động không hợp lệ' }};
  
  try {{
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. ĐĂNG NHẬP
    if (action === 'login') {{
      var identifier = (params.identifier || '').trim().toLowerCase();
      var sheet = ss.getSheetByName('Members');
      if (!sheet) {{
        responseData = {{ success: false, message: 'Chưa có sheet Members' }};
      }} else {{
        var rows = sheet.getDataRange().getValues();
        var headers = rows[0];
        var foundMember = null;
        for (var i = 1; i < rows.length; i++) {{
          var m = rowToObject(headers, rows[i]);
          var mId = String(m.id || '').trim().toLowerCase();
          var mMssv = String(m.mssv || '').trim().toLowerCase();
          var mSdt = String(m.sdt || '').trim().toLowerCase();
          if (mId === identifier || mMssv === identifier || mSdt === identifier) {{
            foundMember = m;
            break;
          }}
        }}
        if (foundMember) {{
          foundMember.isAdmin = (foundMember.isAdmin === true || String(foundMember.isAdmin).toLowerCase() === 'true');
          foundMember.isShiftLeader = (foundMember.isShiftLeader === true || String(foundMember.isShiftLeader).toLowerCase() === 'true');
          foundMember.soCa = Number(foundMember.soCa) || 0;
          foundMember.soCaHoanThanh = Number(foundMember.soCaHoanThanh) || foundMember.soCa;
          responseData = {{ success: true, member: foundMember }};
        }} else {{
          responseData = {{ success: false, message: 'Không tìm thấy thành viên với Mã ID/MSSV này' }};
        }}
      }}
    }} 
    // 2. ĐỒNG BỘ TẤT CẢ DỮ LIỆU
    else if (action === 'syncAll') {{
      var memberId = params.memberId || '';
      var membersSheet = ss.getSheetByName('Members');
      var tasksSheet = ss.getSheetByName('Tasks');
      var swapsSheet = ss.getSheetByName('Swaps');
      var postsSheet = ss.getSheetByName('Posts');
      
      var membersList = [];
      var currentMember = null;
      if (membersSheet) {{
        var mRows = membersSheet.getDataRange().getValues();
        if (mRows.length > 1) {{
          var mHeaders = mRows[0];
          for (var i = 1; i < mRows.length; i++) {{
            var m = rowToObject(mHeaders, mRows[i]);
            m.isAdmin = (m.isAdmin === true || String(m.isAdmin).toLowerCase() === 'true');
            m.isShiftLeader = (m.isShiftLeader === true || String(m.isShiftLeader).toLowerCase() === 'true');
            m.soCa = Number(m.soCa) || 0;
            m.soCaHoanThanh = Number(m.soCaHoanThanh) || m.soCa;
            membersList.push(m);
            if (m.id === memberId) currentMember = m;
          }}
        }}
      }}
      
      var tasksList = [];
      if (tasksSheet) {{
        var tRows = tasksSheet.getDataRange().getValues();
        if (tRows.length > 1) {{
          var tHeaders = tRows[0];
          for (var i = 1; i < tRows.length; i++) {{
            var t = rowToObject(tHeaders, tRows[i]);
            t.quota = Number(t.quota) || 6;
            t.joinedMembers = parseJsonSafe(t.joinedMembers, []);
            t.assignedMembers = parseJsonSafe(t.assignedMembers, []);
            t.waitlist = parseJsonSafe(t.waitlist, []);
            t.checkedInMembers = parseJsonSafe(t.checkedInMembers, []);
            t.checkinLogs = parseJsonSafe(t.checkinLogs, []);
            t.departmentQuotas = parseJsonSafe(t.departmentQuotas, {{}});
            tasksList.push(t);
          }}
        }}
      }}
      
      var swapsList = [];
      if (swapsSheet) {{
        var sRows = swapsSheet.getDataRange().getValues();
        if (sRows.length > 1) {{
          var sHeaders = sRows[0];
          for (var i = 1; i < sRows.length; i++) {{
            swapsList.push(rowToObject(sHeaders, sRows[i]));
          }}
        }}
      }}
      
      var postsList = [];
      if (postsSheet) {{
        var pRows = postsSheet.getDataRange().getValues();
        if (pRows.length > 1) {{
          var pHeaders = pRows[0];
          for (var i = 1; i < pRows.length; i++) {{
            var p = rowToObject(pHeaders, pRows[i]);
            p.likes = Number(p.likes) || 0;
            p.likedBy = parseJsonSafe(p.likedBy, []);
            p.comments = parseJsonSafe(p.comments, []);
            postsList.push(p);
          }}
        }}
      }}
      
      responseData = {{
        success: true,
        member: currentMember || (membersList.length > 0 ? membersList[0] : null),
        membersList: membersList,
        tasks: tasksList,
        swaps: swapsList,
        posts: postsList
      }};
    }}
  }} catch (err) {{
    responseData = {{ success: false, error: err.toString() }};
  }}
  
  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}}

function rowToObject(headers, row) {{
  var obj = {{}};
  for (var j = 0; j < headers.length; j++) {{
    obj[headers[j]] = row[j];
  }}
  return obj;
}}

function parseJsonSafe(str, defaultVal) {{
  if (!str) return defaultVal;
  try {{ return JSON.parse(str); }} catch(e) {{ return defaultVal; }}
}}

/**
 * ==============================================================================
 * BẤM NÚT CHẠY (RUN) HÀM NÀY ĐỂ TỰ ĐỘNG ĐIỀN 121 THÀNH VIÊN VÀO SHEET MEMBERS
 * VÀ TỰ ĐỘNG XÓA SẠCH CÁC SHEET THỪA!
 * ==============================================================================
 */
function autoSeedAllMembersAndCleanSheets() {{
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Tạo hoặc làm sạch sheet Members
  var mSheet = ss.getSheetByName('Members');
  if (!mSheet) {{
    mSheet = ss.insertSheet('Members');
  }}
  mSheet.clear();
  
  // Ghi Headers
  mSheet.appendRow([
    'id', 'hoTen', 'lop', 'mssv', 'khoa', 'boMon', 'chucVu', 
    'sdt', 'yTe', 'ice', 'soCa', 'soCaHoanThanh', 'status', 
    'theTrang', 'avatar', 'isAdmin', 'isShiftLeader'
  ]);
  
  // Đặt định dạng text cho cột SĐT, MSSV, ID để không bị mất số 0
  mSheet.getRange('A:A').setNumberFormat('@');
  mSheet.getRange('D:D').setNumberFormat('@');
  mSheet.getRange('H:H').setNumberFormat('@');
  mSheet.getRange('J:J').setNumberFormat('@');
  
  // Danh sách 121 thành viên đầy đủ
  var members = {json.dumps(members, ensure_ascii=False)};
  
  var rows = [];
  for (var i = 0; i < members.length; i++) {{
    var m = members[i];
    rows.push([
      m.id,
      m.hoTen,
      m.lop,
      m.mssv,
      m.khoa,
      m.boMon,
      m.chucVu,
      m.sdt ? ("'" + m.sdt) : "",
      m.yTe,
      m.ice ? ("'" + m.ice) : "",
      m.soCa,
      m.soCaHoanThanh,
      m.status,
      m.theTrang,
      m.avatar,
      m.isAdmin ? 'TRUE' : 'FALSE',
      m.isShiftLeader ? 'TRUE' : 'FALSE'
    ]);
  }}
  
  if (rows.length > 0) {{
    mSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }}
  
  // 2. Khởi tạo 3 sheet nghiệp vụ nếu chưa có
  var required = ['Members', 'Tasks', 'Swaps', 'Posts'];
  for (var k = 0; k < required.length; k++) {{
    if (!ss.getSheetByName(required[k])) {{
      var newSh = ss.insertSheet(required[k]);
      if (required[k] === 'Tasks') {{
        newSh.appendRow(['id', 'title', 'location', 'time', 'quota', 'joinedMembers', 'assignedMembers', 'waitlist', 'leaderId', 'checkedInMembers', 'checkinLogs', 'lockDeadline', 'status', 'departmentQuotas']);
      }} else if (required[k] === 'Swaps') {{
        newSh.appendRow(['id', 'taskId', 'taskTitle', 'fromMemberId', 'fromMemberName', 'toMemberId', 'createdAt', 'status']);
      }} else if (required[k] === 'Posts') {{
        newSh.appendRow(['id', 'authorId', 'authorName', 'authorRole', 'authorAvatar', 'content', 'image', 'createdAt', 'likes', 'likedBy', 'comments', 'isAnonymous']);
      }}
    }}
  }}
  
  // 3. Xóa các sheet thừa (như Sheet1, Trang tính 1,...)
  var allSheets = ss.getSheets();
  for (var j = 0; j < allSheets.length; j++) {{
    var name = allSheets[j].getName();
    if (required.indexOf(name) === -1 && allSheets.length > 1) {{
      try {{ ss.deleteSheet(allSheets[j]); }} catch(e) {{}}
    }}
  }}
  
  SpreadsheetApp.flush();
  Logger.log('ĐÃ ĐIỀN THÀNH CÔNG ' + rows.length + ' THÀNH VIÊN VÀO SHEET MEMBERS!');
}}
"""

with open(r'C:\Users\Admin\.gemini\antigravity\scratch\clb-sportpass\GoogleAppsScript_Master.js', 'w', encoding='utf-8') as f:
    f.write(js_code)

print('Master script created successfully')
