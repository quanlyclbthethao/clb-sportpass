/**
 * ==============================================================================
 * BACKEND GOOGLE APPS SCRIPT CHO CLB-SPORTPASS
 * Hệ thống API đồng bộ hai chiều: Đăng nhập, Thành viên, Ca trực, Đổi ca, Diễn đàn
 * ==============================================================================
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const params = e.parameter || {};
  const action = params.action || '';
  
  let responseData = { success: false, message: 'Hành động không hợp lệ' };
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'login') {
      const identifier = (params.identifier || '').trim().toLowerCase();
      
      const sheet = ss.getSheetByName('Members');
      if (!sheet) {
        responseData = { success: false, message: 'Chưa có sheet Members' };
      } else {
        const rows = sheet.getDataRange().getValues();
        const headers = rows[0];
        let foundMember = null;
        
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const m = rowToObject(headers, row);
          const mId = String(m.id || '').trim().toLowerCase();
          const mMssv = String(m.mssv || '').trim().toLowerCase();
          const mSdt = String(m.sdt || '').trim().toLowerCase();
          
          if (mId === identifier || mMssv === identifier || mSdt === identifier) {
            foundMember = m;
            break;
          }
        }
        
        if (foundMember) {
          foundMember.isAdmin = (foundMember.isAdmin === true || String(foundMember.isAdmin).toLowerCase() === 'true');
          foundMember.isShiftLeader = (foundMember.isShiftLeader === true || String(foundMember.isShiftLeader).toLowerCase() === 'true');
          foundMember.soCa = Number(foundMember.soCa) || 0;
          foundMember.soCaHoanThanh = Number(foundMember.soCaHoanThanh) || foundMember.soCa;
          
          responseData = { success: true, member: foundMember };
        } else {
          responseData = { success: false, message: 'Không tìm thấy thành viên với Mã ID/MSSV này' };
        }
      }
    } 
    else if (action === 'syncAll') {
      const memberId = params.memberId || '';
      const membersSheet = ss.getSheetByName('Members');
      const tasksSheet = ss.getSheetByName('Tasks');
      const swapsSheet = ss.getSheetByName('Swaps');
      const postsSheet = ss.getSheetByName('Posts');
      
      let membersList = [];
      let currentMember = null;
      if (membersSheet) {
        const mRows = membersSheet.getDataRange().getValues();
        const mHeaders = mRows[0];
        for (let i = 1; i < mRows.length; i++) {
          const m = rowToObject(mHeaders, mRows[i]);
          m.isAdmin = (m.isAdmin === true || String(m.isAdmin).toLowerCase() === 'true');
          m.isShiftLeader = (m.isShiftLeader === true || String(m.isShiftLeader).toLowerCase() === 'true');
          m.soCa = Number(m.soCa) || 0;
          m.soCaHoanThanh = Number(m.soCaHoanThanh) || m.soCa;
          membersList.push(m);
          if (m.id === memberId) currentMember = m;
        }
      }
      
      let tasksList = [];
      if (tasksSheet) {
        const tRows = tasksSheet.getDataRange().getValues();
        const tHeaders = tRows[0];
        for (let i = 1; i < tRows.length; i++) {
          const t = rowToObject(tHeaders, tRows[i]);
          t.quota = Number(t.quota) || 6;
          t.joinedMembers = parseJsonSafe(t.joinedMembers, []);
          t.assignedMembers = parseJsonSafe(t.assignedMembers, []);
          t.waitlist = parseJsonSafe(t.waitlist, []);
          t.checkedInMembers = parseJsonSafe(t.checkedInMembers, []);
          t.checkinLogs = parseJsonSafe(t.checkinLogs, []);
          t.departmentQuotas = parseJsonSafe(t.departmentQuotas, {});
          tasksList.push(t);
        }
      }
      
      let swapsList = [];
      if (swapsSheet) {
        const sRows = swapsSheet.getDataRange().getValues();
        const sHeaders = sRows[0];
        for (let i = 1; i < sRows.length; i++) {
          swapsList.push(rowToObject(sHeaders, sRows[i]));
        }
      }
      
      let postsList = [];
      if (postsSheet) {
        const pRows = postsSheet.getDataRange().getValues();
        const pHeaders = pRows[0];
        for (let i = 1; i < pRows.length; i++) {
          const p = rowToObject(pHeaders, pRows[i]);
          p.likes = Number(p.likes) || 0;
          p.likedBy = parseJsonSafe(p.likedBy, []);
          p.comments = parseJsonSafe(p.comments, []);
          postsList.push(p);
        }
      }
      
      responseData = {
        success: true,
        member: currentMember || (membersList.length > 0 ? membersList[0] : null),
        membersList: membersList,
        tasks: tasksList,
        swaps: swapsList,
        posts: postsList
      };
    }
    else if (action === 'updateMemberRole') {
      const targetMemberId = (params.memberId || '').trim();
      const isAdmin = (params.isAdmin === 'true' || params.isAdmin === true);
      const isShiftLeader = (params.isShiftLeader === 'true' || params.isShiftLeader === true);
      const adminActorId = params.adminActorId || '';

      // Lưu trữ bền vững vào Sheet AdminRoles
      try {
        let rSheet = ss.getSheetByName('AdminRoles');
        if (!rSheet) {
          rSheet = ss.insertSheet('AdminRoles');
          rSheet.appendRow(['memberId', 'isAdmin', 'isShiftLeader', 'updatedBy', 'updatedAt']);
        }
        const rRows = rSheet.getDataRange().getValues();
        let foundIdx = -1;
        for (let i = 1; i < rRows.length; i++) {
          if (String(rRows[i][0] || '').trim() === targetMemberId) {
            foundIdx = i + 1;
            break;
          }
        }
        const now = new Date().toISOString();
        if (foundIdx !== -1) {
          rSheet.getRange(foundIdx, 2, 1, 4).setValues([[isAdmin, isShiftLeader, adminActorId, now]]);
        } else {
          rSheet.appendRow([targetMemberId, isAdmin, isShiftLeader, adminActorId, now]);
        }
      } catch(e) {}

      responseData = {
        success: true,
        message: 'Đã cập nhật phân quyền thành công cho ' + targetMemberId,
        memberId: targetMemberId,
        isAdmin: isAdmin,
        isShiftLeader: isShiftLeader
      };
    }
  } catch (err) {
    responseData = { success: false, error: err.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

function rowToObject(headers, row) {
  const obj = {};
  for (let j = 0; j < headers.length; j++) {
    obj[headers[j]] = row[j];
  }
  return obj;
}

function parseJsonSafe(str, defaultVal) {
  if (!str) return defaultVal;
  try {
    return JSON.parse(str);
  } catch(e) {
    return defaultVal;
  }
}

/**
 * Hàm khởi tạo tự động các Sheet mẫu và dữ liệu ban đầu
 */
function setupInitialDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet Members
  let mSheet = ss.getSheetByName('Members');
  if (!mSheet) {
    mSheet = ss.insertSheet('Members');
    mSheet.appendRow([
      'id', 'hoTen', 'lop', 'mssv', 'khoa', 'boMon', 'chucVu', 
      'sdt', 'yTe', 'ice', 'soCa', 'soCaHoanThanh', 'status', 
      'theTrang', 'avatar', 'isAdmin', 'isShiftLeader'
    ]);
  }
  
  // Sheet Tasks
  let tSheet = ss.getSheetByName('Tasks');
  if (!tSheet) {
    tSheet = ss.insertSheet('Tasks');
    tSheet.appendRow([
      'id', 'title', 'location', 'time', 'quota', 'joinedMembers', 
      'assignedMembers', 'waitlist', 'leaderId', 'checkedInMembers', 
      'checkinLogs', 'lockDeadline', 'status', 'departmentQuotas'
    ]);
  }
  
  // Sheet Swaps
  let sSheet = ss.getSheetByName('Swaps');
  if (!sSheet) {
    sSheet = ss.insertSheet('Swaps');
    sSheet.appendRow(['id', 'taskId', 'taskTitle', 'fromMemberId', 'fromMemberName', 'toMemberId', 'createdAt', 'status']);
  }
  
  // Sheet Posts
  let pSheet = ss.getSheetByName('Posts');
  if (!pSheet) {
    pSheet = ss.insertSheet('Posts');
    pSheet.appendRow(['id', 'authorId', 'authorName', 'authorRole', 'authorAvatar', 'content', 'image', 'createdAt', 'likes', 'likedBy', 'comments', 'isAnonymous']);
  }
}
