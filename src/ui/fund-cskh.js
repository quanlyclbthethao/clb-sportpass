// SportPass V7.0 — NAPAS 247 VietQR Club Fund & Instant CSKH FAQ Assistant

const SPORTPASS_FUND_BANK = {
  bankCode: 'MB',
  bankName: 'MBBank',
  accountNumber: '0913916326',
  accountName: 'CLB THE THAO DHHDUONG'
};

const SPORTPASS_FAQ_KB = [
  {
    id: 'faq-schedule',
    topic: 'Lịch tập',
    keywords: ['lịch tập', 'thời gian', 'khi nào', 'mấy giờ', 'sân'],
    answer: 'CLB Thể Thao ĐH Hải Dương sinh hoạt định kỳ vào Thứ 3, Thứ 5 và Thứ 7 (17:30 – 20:00). Các ban Bóng Chuyền và Cầu Lông tập tại Nhà Thi Đấu Đa Năng; Bóng Đá tập tại Sân Cỏ Nhân Tạo ĐH Hải Dương.'
  },
  {
    id: 'faq-checkin',
    topic: 'Điểm danh QR',
    keywords: ['điểm danh', 'qr', 'quét', 'nhận ca'],
    answer: 'Vào mục Điều Động để nhận ca, sau đó mở "Xuất trình QR nhận ca" tại sảnh sân tập. Trưởng ca hoặc Ban Điều Phối sẽ quét mã động 60 giây để cộng công trực theo thời gian thực.'
  },
  {
    id: 'faq-swap',
    topic: 'Đổi & rút ca',
    keywords: ['đổi ca', 'hoán đổi', 'swap', 'rút ca', 'nghỉ tập'],
    answer: 'Khi trùng lịch thi, chọn "Xin đổi ca" để đề xuất thành viên trực thay hoặc "Xin rút ca" trước 12:00 ngày diễn ra ca để Ban Nhân Sự phê duyệt.'
  },
  {
    id: 'faq-fund',
    topic: 'Quỹ CLB & VietQR',
    keywords: ['quỹ', 'học phí', 'đóng tiền', 'vietqr', 'chuyển khoản'],
    answer: 'Quỹ sinh hoạt CLB chuẩn là 100.000đ/tháng/hội viên (thuê sân bãi, nước uống và cầu/bóng tập). Mở mục "Quỹ CLB VietQR" để sinh mã NAPAS 247 gắn sẵn mã định danh cá nhân.'
  },
  {
    id: 'faq-fitness',
    topic: 'Thể trạng & Xoay tua',
    keywords: ['thể trạng', 'chấn thương', 'xoay tua', 'miễn trực'],
    answer: 'Nếu đang chấn thương hoặc nghỉ ốm, hãy cập nhật trạng thái trong thẻ Thể trạng ngay ở Hồ sơ. Hệ thống Xoay tua thông minh tự động miễn phân công cho đến khi bạn hồi phục.'
  }
];

function stripVietnameseForBankNote(str) {
  return String(str || '')
    .replace(/Đ/g, 'D')
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function buildVietQrClubPayload(purpose = 'QUY CLB', amount = 100000, bankCode = 'MB') {
  const memberId = currentUser ? currentUser.id : 'DMC0806';
  const cleanPurpose = stripVietnameseForBankNote(purpose || 'QUY CLB').replace(/\s+/g, '_');
  const note = `SP ${memberId} ${cleanPurpose}`.slice(0, 25);
  const safeAmt = Math.max(10000, Number(amount) || 100000);
  const bank = (bankCode || SPORTPASS_FUND_BANK.bankCode).toUpperCase();
  const acct = SPORTPASS_FUND_BANK.accountNumber;
  const acctName = SPORTPASS_FUND_BANK.accountName;
  const qrUrl = `https://img.vietqr.io/image/${bank}-${acct}-compact2.png?amount=${safeAmt}&addInfo=${encodeURIComponent(note)}&accountName=${encodeURIComponent(acctName)}`;
  const deepLink = `VIETQR:${bank}:${acct}:${safeAmt}:${note}`;
  return {
    bank,
    accountNumber: acct,
    accountName: acctName,
    amount: safeAmt,
    description: note,
    qrUrl,
    deepLink
  };
}

function setVietQrAmountPreset(amount) {
  safeSetValue('iptVietQrAmount', String(amount));
  updateVietQrFundPreview();
}

function openVietQrFundModal() {
  if (!currentUser) return;
  updateVietQrFundPreview();
  openGenericModal('modalVietQrFund');
}

function closeVietQrFundModal() {
  closeGenericModal('modalVietQrFund');
}

function updateVietQrFundPreview() {
  const purposeEl = document.getElementById('selVietQrPurpose');
  const amountEl = document.getElementById('iptVietQrAmount');
  const bankEl = document.getElementById('selVietQrBank');
  const container = document.getElementById('vietQrFundPreviewBox');

  const payload = buildVietQrClubPayload(
    purposeEl ? purposeEl.value : 'QUY CLB',
    amountEl ? amountEl.value : 100000,
    bankEl ? bankEl.value : 'MB'
  );

  safeSetText('vietQrTransferNoteVal', payload.description);
  safeSetText('vietQrBankAccountVal', `${payload.bank} · ${payload.accountNumber}`);
  safeSetText('vietQrAmountDisplay', new Intl.NumberFormat('vi-VN').format(payload.amount) + ' đ');

  if (!container) return;
  renderQrIntoContainer(container, payload.deepLink, 192);

  if (navigator.onLine) {
    const img = el('img', {
      alt: `Mã VietQR đóng quỹ ${payload.description}`,
      width: '216',
      height: '216',
      decoding: 'async',
      style: { width: '216px', height: '216px', objectFit: 'contain', borderRadius: '10px' }
    });
    img.addEventListener('load', () => {
      if (img.naturalWidth > 0) {
        mount(container, img);
      }
    });
    img.src = payload.qrUrl;
  }
}

async function copyVietQrTransferInfo(mode = 'note') {
  const purposeEl = document.getElementById('selVietQrPurpose');
  const amountEl = document.getElementById('iptVietQrAmount');
  const bankEl = document.getElementById('selVietQrBank');
  const payload = buildVietQrClubPayload(
    purposeEl ? purposeEl.value : 'QUY CLB',
    amountEl ? amountEl.value : 100000,
    bankEl ? bankEl.value : 'MB'
  );
  const value = mode === 'account' ? payload.accountNumber : payload.description;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(value);
    }
  } catch (e) {}
  showAquaIsland(mode === 'account' ? `Đã sao chép STK: ${value}` : `Đã sao chép nội dung: ${value}`, '💳');
}

function renderClubFaqResults(query = '') {
  const box = document.getElementById('faqResultsContainer');
  if (!box) return;
  const q = String(query || '').trim().toLowerCase();

  let matched = SPORTPASS_FAQ_KB;
  if (q) {
    matched = SPORTPASS_FAQ_KB.filter(item =>
      item.topic.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      item.keywords.some(kw => q.includes(kw) || kw.includes(q))
    );
  }

  if (matched.length === 0) {
    mount(box, el('div', { className: 'sp-card', style: { padding: '14px', fontSize: '13px', color: 'var(--sp-text2)' } },
      'Chưa có câu trả lời khớp từ khóa. Hãy chọn chủ đề gợi ý bên trên hoặc liên hệ Trưởng ban Nhân sự qua Danh bạ CLB.'
    ));
    return;
  }

  const cards = matched.map(item =>
    el('article', { className: 'sp-card', style: { padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' } },
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '13.5px', color: 'var(--sp-brand)' } },
        spIconNode('help', 15),
        el('span', {}, item.topic)
      ),
      el('p', { style: { margin: '0', fontSize: '13px', lineHeight: '1.55', color: 'var(--sp-text2)' } }, item.answer)
    )
  );
  mount(box, cards);
}

function searchClubFaq(val) {
  renderClubFaqResults(val || '');
}

function askClubFaqPreset(topicQuery) {
  safeSetValue('iptFaqSearch', topicQuery);
  renderClubFaqResults(topicQuery);
}
