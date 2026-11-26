// SportPass V8.5 — Canonical UHD Configuration, Avatar Data URI & Dispatch Seed Datasets

const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwyVjhtQAk_6zr0crOKjJOje40z8Pcnl1dTdmDbW0E9DH5DD12jW3dtoq8zLSSth9Qw/exec';

const ALL_DEPARTMENTS = [
  'Ban Chủ Nhiệm',
  'Ban Nhân Sự',
  'Ban Bóng Chuyền',
  'Ban Bóng Đá Nam',
  'Ban Bóng Đá Nữ',
  'Ban Cầu Lông',
  'Ban Truyền Thông'
];

const STANDARD_ROLES = [
  'Chủ nhiệm',
  'Phó chủ nhiệm',
  'Trưởng ban',
  'Phó ban',
  'Thư ký',
  'Thủ quỹ',
  'Thành viên'
];

const DEFAULT_VARSITY_AVATAR = 'data:image/jpeg;base64,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';

const DEFAULT_TASKS = [
  {
    id: 'TASK_01',
    title: 'Trực bàn giải Cầu lông - Tân Sinh Viên K16',
    location: 'Nhà Thi Đấu ĐH Hải Dương',
    time: '14:00 - 18:00 Thứ Bảy',
    date: '18/03/2025',
    quota: 6,
    category: 'shift',
    joinedMembers: [],
    assignedMembers: [],
    waitlist: [],
    leaderId: 'DMC0806',
    checkedInMembers: [],
    checkinLogs: [],
    lockDeadline: '2026-10-25T14:00',
    status: 'active',
    departmentQuotas: {
      'Ban Cầu Lông': 2,
      'Ban Bóng Chuyền': 2,
      'Ban Truyền Thông': 2
    },
    notes: 'Trang phục CLB chỉnh tề, mang theo bảng điểm và còi'
  },
  {
    id: 'TASK_02',
    title: 'Hậu cần & Điều phối Giải Bóng Đá Nam Vòng Bảng',
    location: 'Sân Vận Động Trung Tâm',
    time: '08:00 - 11:30 Chủ Nhật',
    date: '19/03/2025',
    quota: 4,
    category: 'shift',
    joinedMembers: [],
    assignedMembers: [],
    waitlist: [],
    leaderId: 'NQD1509',
    checkedInMembers: [],
    checkinLogs: [],
    lockDeadline: '2026-10-26T08:00',
    status: 'active',
    departmentQuotas: {
      'Ban Bóng Đá Nam': 2,
      'Ban Truyền Thông': 2
    },
    notes: 'Kiểm tra bóng thi đấu và nước uống cho 2 đội trước giờ bóng lăn'
  }
];

const DEFAULT_SWAPS_SEED = [
  {
    id: 'SWAP_SEED_01',
    taskId: 'TASK_01',
    fromId: 'TTTL1805',
    fromName: 'Tào Thị Tuyết Linh',
    fromClass: 'K15D.GDTH',
    toId: 'DMC0806',
    toName: 'Đỗ Mạnh Cường',
    currentShift: 'Nhà Thi Đấu ĐH Hải Dương (14:00 - 18:00)',
    reason: 'Trùng lịch thi vấn đáp môn Chuyên ngành.',
    type: 'swap',
    status: 'pending'
  },
  {
    id: 'SWAP_SEED_02',
    taskId: 'TASK_02',
    fromId: 'NTDL0303',
    fromName: 'Nguyễn Thị Diệu Linh',
    fromClass: 'K15A.GDTH',
    toId: 'CA_TOI',
    toName: 'Ca Tối (18:00 - 21:30)',
    currentShift: 'Sân Vận Động Trung Tâm (08:00 - 11:30)',
    reason: 'Hỗ trợ lịch tập huấn đội tuyển đột xuất.',
    type: 'transfer',
    status: 'pending'
  }
];

const DEFAULT_LEAVES_SEED = [
  {
    id: 'LEAVE_SEED_01',
    taskId: 'TASK_02',
    memberId: 'DDH1011',
    memberName: 'Đinh Đức Huy',
    memberRole: 'Trưởng ca sân B',
    timeLabel: 'Khu vực khán đài B · 15:10',
    reason: 'Lượng cổ động viên tăng đột biến tại cửa soát vé, đề nghị điều phối thêm 02 nhân sự hỗ trợ.',
    urgent: true,
    status: 'pending'
  }
];
