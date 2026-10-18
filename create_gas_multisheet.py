import json, sys

with open(r'C:\Users\Admin\.gemini\antigravity\scratch\clb-sportpass\data_by_dept.json', 'r', encoding='utf-8') as f:
    data_by_dept = json.load(f)

fmt_str = "'@'"
seed_json_str = json.dumps(data_by_dept, ensure_ascii=False, indent=2)

js_content = f"""/**
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
 * + Posts (Diễn đàn)
 *
 * TÍNH NĂNG ĐẶC BIỆT:
 * - Giữ nguyên các Sheet từng Ban để dễ dàng quản lý, xem danh sách và thống kê.
 * - Thêm thành viên mới: Chỉ cần nhập dòng mới vào Sheet của Ban tương ứng,
 *   ứng dụng di động tự động nhận diện ngay lập tức mà không cần sửa code!
 * - Hệ thống Mã ID chuẩn hóa: Chữ cái đầu viết hoa + Ngày tháng sinh DDMM (VD: DMC0806, LDH0912, DDH1011).
 * - Tự động hợp nhất quyền cán sự / quản trị viên khi thành viên kiêm nhiệm nhiều ban khác nhau.
 * - Hàm `setupMultiSheetDatabase()`: Tự động dọn dẹp, tạo chuẩn 7 ban và điền sẵn
 *   toàn bộ 125 thành viên chuẩn 100%, bảo toàn số 0 ở đầu SĐT ('0xxxxxxxxx).
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
      responseData = {{ success: true, message: 'Đã hoàn tất dọn dẹp và khởi tạo 7 ban cùng dữ liệu 125 thành viên!' }};
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

          // Khớp theo ID, SĐT (từ 9 số trở lên), Họ Tên hoặc Ngày sinh/MSSV
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
              // Điền bổ sung SĐT nếu bản ghi trước đó để trống
              if (!foundMember.sdt && m.sdt) {{
                foundMember.sdt = m.sdt;
                foundMember.ice = m.sdt;
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

  }} catch(error) {{
    responseData = {{ success: false, message: 'Lỗi máy chủ: ' + error.toString() }};
  }}

  return createJsonResponse(responseData);
}}

/**
 * Đọc tất cả thành viên từ 7 Sheet Ban
 */
function getAllMembersFromDepartments(ss) {{
  var allMembers = [];
  
  for (var d = 0; d < DEPARTMENT_SHEETS.length; d++) {{
    var deptName = DEPARTMENT_SHEETS[d];
    var sheet = ss.getSheetByName(deptName);
    if (!sheet) continue;

    var rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) continue;

    // Header ở dòng 1: ['STT', 'Mã ID', 'Họ và Tên', 'Ngày Sinh', 'Chức Vụ', 'Lớp', 'SĐT', 'Khoa', 'Số Ca Đã Làm']
    for (var i = 1; i < rows.length; i++) {{
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
                    (deptName === 'Ban Nhân Sự' && (cvLower.indexOf('trưởng ban') !== -1 || cvLower.indexOf('phó ban') !== -1)) ||
                    cvLower.indexOf('chủ nhiệm') !== -1 || 
                    cvLower.indexOf('phó chủ nhiệm') !== -1 ||
                    cvLower.indexOf('tổng thư ký') !== -1 ||
                    cvLower.indexOf('thủ quỹ') !== -1 ||
                    id === 'DMC0806';

      var isShiftLeader = isAdmin || 
                          cvLower.indexOf('trưởng ban') !== -1 || 
                          cvLower.indexOf('phó ban') !== -1;

      allMembers.push({{
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
      }});
    }}
  }}

  return allMembers;
}}

/**
 * Xử lý định dạng ngày tháng từ ô bảng tính
 */
function formatDateCell(val) {{
  if (!val) return '';
  if (val instanceof Date) {{
    return Utilities.formatDate(val, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
  }}
  return String(val).trim();
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
 * Lấy danh sách Ca Trực
 */

/**
 * Tự động tạo Mã ID chuẩn [Initials][DDMM] từ Họ tên và Ngày sinh
 */
function generateMemberIdFromInfo(name, dob) {{
  if (!name) return '';
  var s = String(name).trim();
  s = s.replace(/Đ/g, 'D').replace(/đ/g, 'd');
  try {{
    s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  }} catch(e) {{}}
  var words = s.split(/\s+/);
  var initials = '';
  for (var i = 0; i < words.length; i++) {{
    if (words[i]) initials += words[i].charAt(0).toUpperCase();
  }}
  
  var ddmm = '0101';
  if (dob instanceof Date) {{
    ddmm = Utilities.formatDate(dob, 'Asia/Ho_Chi_Minh', 'ddMM');
  }} else if (typeof dob === 'number' && dob > 20000 && dob < 60000) {{
    var d = new Date((dob - (25567 + 2)) * 86400 * 1000);
    ddmm = Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', 'ddMM');
  }} else if (dob) {{
    var m = String(dob).match(/(\d{{1,2}})[\/\-](\d{{1,2}})/);
    if (m) {{
      var day = parseInt(m[1], 10);
      var month = parseInt(m[2], 10);
      ddmm = (day < 10 ? '0' + day : day) + '' + (month < 10 ? '0' + month : month);
    }}
  }}
  return initials + ddmm;
}}

function getTasksList(ss) {{{{
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

  for (var i = 1; i < rows.length; i++) {{
    if (String(rows[i][idCol]) === String(taskId)) {{
      var joined = parseJsonSafe(rows[i][joinedCol], []);
      var wait = parseJsonSafe(rows[i][waitlistCol], []);

      if (waitlist) {{
        if (wait.indexOf(memberId) === -1) wait.push(memberId);
        sheet.getRange(i + 1, waitlistCol + 1).setValue(JSON.stringify(wait));
        return {{ success: true, message: 'Đã thêm bạn vào hàng đợi dự bị' }};
      }} else {{
        if (joined.indexOf(memberId) === -1) joined.push(memberId);
        // Xóa khỏi waitlist nếu đã được duyệt
        var wIdx = wait.indexOf(memberId);
        if (wIdx !== -1) wait.splice(wIdx, 1);
        sheet.getRange(i + 1, joinedCol + 1).setValue(JSON.stringify(joined));
        sheet.getRange(i + 1, waitlistCol + 1).setValue(JSON.stringify(wait));
        return {{ success: true, message: 'Đăng ký ca trực thành công!' }};
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
      var jIdx = joined.indexOf(memberId);
      if (jIdx !== -1) {{
        joined.splice(jIdx, 1);
        sheet.getRange(i + 1, joinedCol + 1).setValue(JSON.stringify(joined));
      }}

      // Đẩy người đầu tiên trong waitlist lên thay thế
      var wait = parseJsonSafe(rows[i][waitlistCol], []);
      if (wait.length > 0) {{
        var promoted = wait.shift();
        joined.push(promoted);
        sheet.getRange(i + 1, joinedCol + 1).setValue(JSON.stringify(joined));
        sheet.getRange(i + 1, waitlistCol + 1).setValue(JSON.stringify(wait));
      }}

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
 * Tăng số ca trực hoàn thành trong sheet tương ứng
 */
function incrementMemberCompletedShifts(ss, memberId) {{
  for (var d = 0; d < DEPARTMENT_SHEETS.length; d++) {{
    var sheet = ss.getSheetByName(DEPARTMENT_SHEETS[d]);
    if (!sheet) continue;
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {{
      if (String(rows[i][1]).trim() === memberId) {{
        var cur = Number(rows[i][8]) || 0;
        sheet.getRange(i + 1, 9).setValue(cur + 1);
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
    JSON.stringify(taskObj.departmentQuotas || {{}})
  ]);

  return {{ success: true, message: 'Tạo ca trực mới thành công!', taskId: id }};
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
 * HÀM KHỞI TẠO VÀ DỌN DẸP TOÀN BỘ CƠ SỞ DỮ LIỆU MULTI-SHEET
 * Chạy hàm này một lần duy nhất từ menu Trình chỉnh sửa Apps Script
 * ==============================================================================
 */
function setupMultiSheetDatabase() {{
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var header = ['STT', 'Mã ID', 'Họ và Tên', 'Ngày Sinh', 'Chức Vụ', 'Lớp', 'SĐT', 'Khoa', 'Số Ca Đã Làm'];
  var totalSeeded = 0;

  // 1. Khởi tạo 7 Sheet Ban
  for (var d = 0; d < DEPARTMENT_SHEETS.length; d++) {{
    var deptName = DEPARTMENT_SHEETS[d];
    var sheet = ss.getSheetByName(deptName);
    if (!sheet) {{{{
      sheet = ss.insertSheet(deptName);
    }}}}
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
    if (deptName === 'Ban Cầu Lông' && customBadmintonMembers && customBadmintonMembers.length > 0) {{
      members = customBadmintonMembers;
    }}
    if (members.length > 0) {{{{
      var rows = [];
      for (var m = 0; m < members.length; m++) {{{{
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
      }}}}
      sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);

      // Căn giữa STT, Mã ID, Ngày Sinh, Lớp, SĐT
      sheet.getRange(2, 1, rows.length, 2).setHorizontalAlignment('center');
      sheet.getRange(2, 4, rows.length, 1).setHorizontalAlignment('center');
      sheet.getRange(2, 6, rows.length, 2).setHorizontalAlignment('center');
      sheet.getRange(2, 9, rows.length, 1).setHorizontalAlignment('center');

      totalSeeded += rows.length;
    }}}}

    // Định dạng Text @ cho toàn bộ các cột nhạy cảm để người dùng thêm dòng sau không bị mất số 0
    sheet.getRange('B:B').setNumberFormat('@');
    sheet.getRange('D:D').setNumberFormat('@');
    sheet.getRange('G:G').setNumberFormat('@');

    // Tự động căn chỉnh độ rộng cột
    for (var c = 1; c <= header.length; c++) {{
      try {{ sheet.autoResizeColumn(c); }} catch(e) {{}}
    }}
  }}

  // 2. Khởi tạo Sheet Tasks (Ca trực)
  var tasksSheet = ss.getSheetByName('Tasks');
  if (!tasksSheet) {{
    tasksSheet = ss.insertSheet('Tasks');
  }}
  if (tasksSheet.getLastRow() === 0) {{
    tasksSheet.appendRow(['id', 'title', 'location', 'time', 'quota', 'joinedMembers', 'assignedMembers', 'waitlist', 'leaderId', 'checkedInMembers', 'checkinLogs', 'lockDeadline', 'status', 'departmentQuotas']);
    var tHRange = tasksSheet.getRange(1, 1, 1, 14);
    tHRange.setBackground('#047857'); // Emerald xanh
    tHRange.setFontColor('#ffffff');
    tHRange.setFontWeight('bold');
    tasksSheet.setFrozenRows(1);

    // Nạp sẵn 3 ca trực mẫu chuẩn thực tế với Mã ID mới
    tasksSheet.appendRow([
      'TASK_001',
      'Trực sân Bóng Chuyền - Giải Giao Hữu Tân Sinh Viên K16',
      'Nhà Thi Đấu ĐH Tây Bắc',
      '07:30 - 11:30 | Thứ Bảy',
      6,
      '[]', '[]', '[]', 'TCT0803', '[]', '[]', '2026-10-18T22:00:00Z', 'Mở Đăng Ký',
      '{{\\"Ban Bóng Chuyền\\": 3, \\"Ban Chủ Nhiệm\\": 1, \\"Ban Nhân Sự\\": 1, \\"Ban Truyền Thông\\": 1}}'
    ]);
    tasksSheet.appendRow([
      'TASK_002',
      'Điều phối Giải Bóng Đá Nam Vòng Bảng Khoa GDTC',
      'Sân Bóng Cỏ Nhân Tạo',
      '14:00 - 17:30 | Chủ Nhật',
      8,
      '[]', '[]', '[]', 'NQD1509', '[]', '[]', '2026-10-19T10:00:00Z', 'Mở Đăng Ký',
      '{{\\"Ban Bóng Đá Nam\\": 5, \\"Ban Cầu Lông\\": 1, \\"Ban Truyền Thông\\": 2}}'
    ]);
    tasksSheet.appendRow([
      'TASK_003',
      'Hỗ trợ Truyền Thông & Livestream Khai Mạc Giải Thể Thao',
      'Hội Trường Trung Tâm',
      '18:30 - 21:30 | Thứ Hai',
      4,
      '[]', '[]', '[]', 'TTTL1805', '[]', '[]', '2026-10-20T12:00:00Z', 'Mở Đăng Ký',
      '{{\\"Ban Truyền Thông\\": 3, \\"Ban Chủ Nhiệm\\": 1}}'
    ]);
  }}

  // 3. Khởi tạo Sheet Swaps (Đổi ca / Rút ca)
  var swapsSheet = ss.getSheetByName('Swaps');
  if (!swapsSheet) {{
    swapsSheet = ss.insertSheet('Swaps');
  }}
  if (swapsSheet.getLastRow() === 0) {{
    swapsSheet.appendRow(['id', 'taskId', 'taskTitle', 'fromMemberId', 'fromMemberName', 'toMemberId', 'createdAt', 'status']);
    var sHRange = swapsSheet.getRange(1, 1, 1, 8);
    sHRange.setBackground('#b45309'); // Amber cam đậm
    sHRange.setFontColor('#ffffff');
    sHRange.setFontWeight('bold');
    swapsSheet.setFrozenRows(1);
  }}

  // 4. Khởi tạo Sheet Posts (Diễn đàn & Thông báo)
  var postsSheet = ss.getSheetByName('Posts');
  if (!postsSheet) {{
    postsSheet = ss.insertSheet('Posts');
  }}
  if (postsSheet.getLastRow() === 0) {{
    postsSheet.appendRow(['id', 'authorId', 'authorName', 'authorRole', 'authorAvatar', 'content', 'image', 'createdAt', 'likes', 'likedBy', 'comments', 'isAnonymous']);
    var pHRange = postsSheet.getRange(1, 1, 1, 12);
    pHRange.setBackground('#1d4ed8'); // Cobalt xanh dương
    pHRange.setFontColor('#ffffff');
    pHRange.setFontWeight('bold');
    postsSheet.setFrozenRows(1);

    // Bài viết chào mừng mẫu với Mã ID mới
    postsSheet.appendRow([
      'POST_WELCOME',
      'TVT3006',
      'Ban Chủ Nhiệm CLB Thể Thao',
      'Quản Trị Viên',
      '',
      '🎉 Chào mừng toàn thể thành viên đến với SportPass PWA! Hãy kiểm tra ca trực mới và đăng ký nhận ca đúng giờ nhé.',
      '',
      new Date().toISOString(),
      12,
      '[\\"TVT3006\\", \\"LDH0912\\", \\"DMC0806\\"]',
      '[]',
      'FALSE'
    ]);
  }}

  // 5. LÀM SẠCH BẢNG TÍNH: Xóa mọi Sheet rác/thừa không thuộc 7 Ban và 3 Tab nghiệp vụ
  var validSheetNames = DEPARTMENT_SHEETS.concat(APP_SHEETS);
  var allSheets = ss.getSheets();
  for (var j = 0; j < allSheets.length; j++) {{
    var curName = allSheets[j].getName();
    if (validSheetNames.indexOf(curName) === -1 && allSheets.length > 1) {{
      try {{
        ss.deleteSheet(allSheets[j]);
      }} catch(e) {{}}
    }}
  }}

  Logger.log('=== HOÀN TẤT THIẾT LẬP THÀNH CÔNG ===');
  Logger.log('Đã tạo chuẩn ' + DEPARTMENT_SHEETS.length + ' ban chuyên môn và điền ' + totalSeeded + ' thành viên.');
  Logger.log('Đã tạo 3 sheet nghiệp vụ: Tasks, Swaps, Posts.');
  Logger.log('Đã xóa sạch các sheet thừa.');
}}
"""

with open(r'C:\Users\Admin\.gemini\antigravity\scratch\clb-sportpass\GoogleAppsScript_MultiSheet.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print('Generated GoogleAppsScript_MultiSheet.js successfully!')
