// SportPass V6.0 — Dynamic QR Pass Generator & Field Check-in Scanner

let qrScannerStream = null;
let qrScanAnimFrame = null;
let currentCameraFacing = 'environment';
let isTorchOn = false;
let currentScanTargetTaskId = null;
let activeFieldQrTaskId = null;
let qrCountdownTimer = null;
let qrCountdownSeconds = 60;

function generateOfflineSvgQr(data) {
  const str = String(data || 'SPORTPASS');
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const size = 21;
  const cells = [];
  const isFinder = (r, c) =>
    (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let on = false;
      if (isFinder(r, c)) {
        const lr = r >= size - 7 ? r - (size - 7) : r;
        const lc = c >= size - 7 ? c - (size - 7) : c;
        on = lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
      } else {
        const bit = ((hash ^ (r * 31 + c * 17)) >>> ((r + c) % 16)) & 1;
        on = bit === 1;
      }
      if (on) {
        cells.push(`<rect x="${c * 6}" y="${r * 6}" width="6" height="6" fill="#022340"/>`);
      }
    }
  }
  return `<svg width="156" height="156" viewBox="0 0 ${size * 6} ${size * 6}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mã QR SportPass"><rect width="${size * 6}" height="${size * 6}" fill="#ffffff"/>${cells.join('')}</svg>`;
}

function renderQrIntoContainer(container, payloadText, pixelSize = 156) {
  if (!container) return;
  container.innerHTML = '';
  if (typeof window.QRCode === 'function') {
    try {
      new window.QRCode(container, {
        text: payloadText,
        width: pixelSize,
        height: pixelSize,
        colorDark: '#022340',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel ? window.QRCode.CorrectLevel.M : 0
      });
      return;
    } catch (e) {}
  }
  container.innerHTML = generateOfflineSvgQr(payloadText);
}

function generateDynamicQrPass() {
  if (!currentUser) return;
  const token = `PASS-${currentUser.id}-${Math.floor(Date.now() / 60000)}`;
  const vipQrBox = document.getElementById('vipCardQrContainer');
  if (vipQrBox) renderQrIntoContainer(vipQrBox, token, 152);
  safeSetText('vipCardPassToken', token);
}

function refreshDynamicQrPass() {
  generateDynamicQrPass();
  showAquaIsland('Đã làm mới mã thẻ SportPass 60s.', '🔄');
}

function openFieldCheckinQrModal(taskId = null) {
  if (!currentUser) return;
  activeFieldQrTaskId = taskId || (currentTasks[0] ? currentTasks[0].id : 'GENERAL');
  const sel = document.getElementById('selFieldQrShift');
  if (sel) {
    sel.innerHTML = (currentTasks || []).map(t =>
      `<option value="${escapeHtml(t.id)}">${escapeHtml(t.id)} — ${escapeHtml(t.title)}</option>`
    ).join('');
    if (activeFieldQrTaskId) sel.value = activeFieldQrTaskId;
  }
  generateFieldCheckinQr(activeFieldQrTaskId);
  startFieldQrCountdownTimer();
  openGenericModal('modalFieldCheckinQr');
}

function closeFieldCheckinQrModal() {
  if (qrCountdownTimer) {
    clearInterval(qrCountdownTimer);
    qrCountdownTimer = null;
  }
  closeGenericModal('modalFieldCheckinQr');
}

function onFieldQrShiftChange(newTaskId) {
  activeFieldQrTaskId = newTaskId;
  generateFieldCheckinQr(newTaskId);
}

function generateFieldCheckinQr(taskId = null) {
  if (!currentUser) return;
  const tid = taskId || activeFieldQrTaskId || 'GENERAL';
  const payload = `SPORTPASS:CHECKIN:${tid}:${currentUser.id}:${Math.floor(Date.now() / 1000)}`;
  const container = document.getElementById('fieldCheckinQrBox');
  if (container) renderQrIntoContainer(container, payload, 180);
  safeSetText('fieldCheckinQrCodeLabel', `CHK-${currentUser.id}-${tid}`);
  qrCountdownSeconds = 60;
  safeSetText('fieldQrCountdown', '60s');
}

function refreshFieldCheckinQr() {
  generateFieldCheckinQr(activeFieldQrTaskId);
  showAquaIsland('Đã tạo mã QR nhận ca mới.', '🔄');
}

function startFieldQrCountdownTimer() {
  if (qrCountdownTimer) clearInterval(qrCountdownTimer);
  qrCountdownSeconds = 60;
  qrCountdownTimer = setInterval(() => {
    qrCountdownSeconds--;
    if (qrCountdownSeconds <= 0) {
      generateFieldCheckinQr(activeFieldQrTaskId);
    } else {
      safeSetText('fieldQrCountdown', `${qrCountdownSeconds}s`);
    }
  }, 1000);
}

function openQrScannerModal(targetTaskId = null) {
  if (!isAuthorizedScanner()) {
    showAquaIsland('Chỉ Ban Chủ Nhiệm, Trưởng/Phó ban mới được quyền quét điểm danh.', '🔒');
    return;
  }
  currentScanTargetTaskId = targetTaskId || (currentTasks[0] ? currentTasks[0].id : null);
  safeSetText('qrScannerTargetLabel', currentScanTargetTaskId ? `Ca mục tiêu: ${currentScanTargetTaskId}` : 'Quét tự động theo mã QR');
  openGenericModal('modalQrScanner');
  startQrScanner(currentScanTargetTaskId);
}

function closeQrScannerModal() {
  stopQrCameraStream();
  closeGenericModal('modalQrScanner');
}

function stopQrCameraStream() {
  if (qrScanAnimFrame) {
    cancelAnimationFrame(qrScanAnimFrame);
    qrScanAnimFrame = null;
  }
  if (qrScannerStream) {
    try {
      qrScannerStream.getTracks().forEach(t => t.stop());
    } catch (e) {}
    qrScannerStream = null;
  }
}

async function startQrScanner(targetTaskId = null) {
  if (targetTaskId) currentScanTargetTaskId = targetTaskId;
  stopQrCameraStream();
  const video = document.getElementById('qrScannerVideo');
  const statusEl = document.getElementById('qrScannerStatus');
  if (!video) return;

  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');
  video.muted = true;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if (statusEl) statusEl.textContent = 'Trình duyệt chưa hỗ trợ camera trực tiếp. Hãy chọn ảnh QR từ thư viện.';
    return;
  }

  try {
    qrScannerStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentCameraFacing, width: { ideal: 720 }, height: { ideal: 720 } },
      audio: false
    });
    video.srcObject = qrScannerStream;

    const onLoaded = () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.play().catch(() => {});
      if (statusEl) statusEl.textContent = 'Đưa mã QR vào khung ngắm để điểm danh tự động...';
      tickQrScan();
    };
    video.addEventListener('loadedmetadata', onLoaded);
  } catch (err) {
    if (statusEl) statusEl.textContent = 'Không mở được camera. Hãy cấp quyền hoặc tải ảnh QR bên dưới.';
  }
}

function tickQrScan() {
  const video = document.getElementById('qrScannerVideo');
  if (!video || !qrScannerStream) return;
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    qrScanAnimFrame = requestAnimationFrame(tickQrScan);
    return;
  }

  try {
    const canvas = document.getElementById('qrScannerCanvas') || document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (typeof window.jsQR === 'function') {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = window.jsQR(imgData.data, imgData.width, imgData.height);
      if (code && code.data) {
        handleScanQrPayload(code.data);
        return;
      }
    }
  } catch (e) {}

  qrScanAnimFrame = requestAnimationFrame(tickQrScan);
}

function handleQrFileSelected(event) {
  const file = event && event.target && event.target.files ? event.target.files[0] : null;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      if (typeof window.jsQR === 'function') {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = window.jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data) {
          handleScanQrPayload(code.data);
          return;
        }
      }
      showAquaIsland('Không đọc được mã QR từ ảnh đã chọn.', '⚠️');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function toggleCameraFacing() {
  currentCameraFacing = currentCameraFacing === 'environment' ? 'user' : 'environment';
  startQrScanner(currentScanTargetTaskId);
}

function toggleTorchFlash() {
  if (!qrScannerStream) return;
  const track = qrScannerStream.getVideoTracks()[0];
  if (!track || !track.applyConstraints) return;
  isTorchOn = !isTorchOn;
  track.applyConstraints({ advanced: [{ torch: isTorchOn }] }).catch(() => {});
}

function handleScanQrPayload(rawCode) {
  if (!rawCode) return;
  const trimmed = String(rawCode).trim();
  let taskId = currentScanTargetTaskId || (currentTasks[0] ? currentTasks[0].id : '');
  let memberId = '';

  if (trimmed.startsWith('SPORTPASS:CHECKIN:')) {
    const parts = trimmed.split(':');
    taskId = parts[2] || taskId;
    memberId = parts[3] || '';
  } else if (trimmed.startsWith('SPORTPASS:MEMBER:')) {
    memberId = trimmed.split(':')[2] || '';
  } else if (trimmed.startsWith('CHK-')) {
    const parts = trimmed.split('-');
    memberId = parts[1] || '';
    taskId = parts[2] || taskId;
  } else if (trimmed.startsWith('PASS-')) {
    memberId = trimmed.split('-')[1] || '';
  } else if (trimmed.startsWith('{')) {
    try {
      let parsedPayload = null;
      parsedPayload = JSON.parse(rawCode);
      memberId = parsedPayload.memberId || parsedPayload.id || '';
      taskId = parsedPayload.taskId || taskId;
    } catch (e) {}
  } else {
    memberId = trimmed;
  }

  if (!memberId) {
    showAquaIsland('Mã QR không chứa mã hội viên hợp lệ.', '⚠️');
    return;
  }
  performFieldCheckin(taskId, memberId);
}

function performFieldCheckin(taskId, rawMemberId) {
  handleQrCheckinAction(taskId, rawMemberId);
}

function handleQrCheckinAction(taskId, memberId) {
  const cleanMemberId = String(memberId || '').trim().toUpperCase();
  const task = (currentTasks || []).find(t => t.id === taskId) || currentTasks[0];
  if (!task) return;

  task.checkedInMembers = Array.isArray(task.checkedInMembers) ? task.checkedInMembers : [];
  if (!task.checkedInMembers.includes(cleanMemberId)) {
    task.checkedInMembers.push(cleanMemberId);
    task.joinedMembers = Array.isArray(task.joinedMembers) ? task.joinedMembers : [];
    if (!task.joinedMembers.includes(cleanMemberId)) task.joinedMembers.push(cleanMemberId);

    for (const m of (membersDirectory || [])) {
      if (m.id === cleanMemberId) {
        m.soCaHoanThanh = (Number(m.soCaHoanThanh) || 0) + 1;
        m.soCa = m.soCaHoanThanh;
      }
    }
    if (currentUser && currentUser.id === cleanMemberId) {
      currentUser.soCaHoanThanh = (Number(currentUser.soCaHoanThanh) || 0) + 1;
      currentUser.soCa = currentUser.soCaHoanThanh;
      renderProfileData();
    }

    const payload = { taskId: task.id, memberId: cleanMemberId, scannerId: currentUser ? currentUser.id : 'SYSTEM' };
    if (navigator.onLine) {
      fetch(`${GAS_API_URL}?action=checkinMember&taskId=${encodeURIComponent(task.id)}&memberId=${encodeURIComponent(cleanMemberId)}&adminId=${encodeURIComponent(payload.scannerId)}`)
        .catch(() => enqueueOfflineMutation('QR_CHECKIN', payload));
    } else {
      enqueueOfflineMutation('QR_CHECKIN', payload);
    }

    saveLocalState();
    renderTasksList();
    showAquaIsland(`Điểm danh QR thành công: ${cleanMemberId}`, '✅');
  } else {
    showAquaIsland(`${cleanMemberId} đã điểm danh ở ca này trước đó.`, 'ℹ️');
  }
  closeQrScannerModal();
}
