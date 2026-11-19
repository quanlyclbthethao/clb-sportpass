// SportPass V6.0 — Canonical Application Configuration & Seed Datasets

const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbzOzxjkLP684tGXQn7HFptjiYyMoyEFMkTackb8K56f1gJvqMlvV5mFc0JBTm9gbO7U/exec';

const ALL_DEPARTMENTS = [
  'Ban Chủ Nhiệm',
  'Ban Nhân Sự',
  'Ban Bóng Chuyền',
  'Ban Bóng Đá Nam',
  'Ban Bóng Đá Nữ',
  'Ban Cầu Lông',
  'Ban Truyền Thông'
];

const DEFAULT_TASKS = [
  {
    id: 'TASK_01',
    title: 'Trực bàn giải Cầu lông - Tân Sinh Viên K16',
    location: 'Nhà Thi Đấu ĐH Hải Dương',
    time: '14:00 - 18:00 Thứ Bảy',
    quota: 6,
    joinedMembers: [],
    assignedMembers: [],
    waitlist: [],
    leaderId: '',
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
    location: 'Sân Bóng Cỏ Nhân Tạo ĐH Hải Dương',
    time: '08:00 - 11:30 Chủ Nhật',
    quota: 4,
    joinedMembers: [],
    assignedMembers: [],
    waitlist: [],
    leaderId: '',
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

const DEFAULT_COMMUNITY_POSTS = [
  {
    id: 'post_welcome_01',
    authorId: 'DMC0806',
    authorName: 'Đỗ Mạnh Cường',
    authorAvatar: '',
    content: 'Chào mừng toàn thể thành viên đến với hệ sinh thái SportPass CLB Thể Thao ĐH Hải Dương! Lịch tập huấn và ca trực học kỳ mới đã được đồng bộ trong mục Điều Động. Hãy kiểm tra thông tin và xuất trình thẻ số đúng giờ nhé!',
    createdAt: 'Hôm nay, 08:30',
    isAnonymous: false,
    reactions: { like: 16, love: 9, care: 4, haha: 0, wow: 2, sad: 0, angry: 0, userReactions: {} },
    comments: [
      {
        id: 'cmt_01',
        authorId: 'NTD2108',
        authorName: 'Nguyễn Tiến Duy',
        content: 'Ban Chủ Nhiệm đã chốt danh sách trọng tài bàn cho tuần thi đấu giao hữu.',
        createdAt: '08:45',
        replies: []
      }
    ],
    mediaList: []
  },
  {
    id: 'post_welcome_02',
    authorId: 'LDH0912',
    authorName: 'Lương Đình Hiếu',
    authorAvatar: '',
    content: 'Tổng kết buổi tập thể lực và giao hữu Cầu lông - Bóng chuyền sáng nay tại Nhà thi đấu ĐH Hải Dương. Cảm ơn Ban Y tế và Hậu cần đã túc trực hỗ trợ chu đáo.',
    createdAt: 'Hôm qua, 17:15',
    isAnonymous: false,
    reactions: { like: 24, love: 18, care: 6, haha: 1, wow: 3, sad: 0, angry: 0, userReactions: {} },
    comments: [],
    mediaList: []
  }
];

const THE_TRANG_OPTIONS = [
  { label: 'Khỏe mạnh (100% Sẵn sàng)', short: 'Khỏe mạnh (100%)', tone: 'success', exempt: false },
  { label: 'Hồi phục nhẹ (Hỗ trợ bàn)', short: 'Hồi phục nhẹ', tone: 'warning', exempt: false },
  { label: 'Chấn thương nhẹ (Tạm miễn trực)', short: 'Miễn trực (Y tế)', tone: 'danger', exempt: true },
  { label: 'Nghỉ ốm / Y tế', short: 'Nghỉ ốm (Miễn trực)', tone: 'danger', exempt: true }
];
