// SportPass V8.0 — 45s Dynamic QR Credential Pass & Camera/Image Check-in Scanner

let qrCountdown = 45;
let qrTimerInterval = null;
let qrScannerStream = null;
let qrScanAnimFrame = null;
let currentCameraFacing = 'environment';
let isTorchOn = false;
let currentScanTargetTaskId = null;

function generateOfflineSvgQrNode(data) {
  const str = String(data || 'SPORTPASS');
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const size = 21;
  const dim = String(size * 6);
  const svg = svgEl('svg', {
    width: '160',
    height: '160',
    viewBox: `0 0 ${dim} ${dim}`,
    role: 'img',
    'aria-label': 'Mã QR định danh Varsity Pass'
  });
  svg.appendChild(svgEl('rect', { width: dim, height: dim, fill: '#ffffff' }));

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
        svg.appendChild(svgEl('rect', {
          x: String(c * 6),
          y: String(r * 6),
          width: '6',
          height: '6',
          fill: '#0f172a'
        }));
      }
    }
  }
  return svg;
}

function renderQrIntoContainer(container, payloadText, pixelSize = 160) {
  if (!container) return;
  container.replaceChildren();
  if (typeof window.QRCode === 'function') {
    try {
      new window.QRCode(container, {
        text: payloadText,
        width: pixelSize,
        height: pixelSize,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel ? window.QRCode.CorrectLevel.M : 0
      });
      container.querySelectorAll('img').forEach((img) => {
        if (!img.getAttribute('alt')) img.setAttribute('alt', 'Mã QR định danh');
      });
      return;
    } catch (e) {}
  }
  container.replaceChildren(generateOfflineSvgQrNode(payloadText));
}

function updateQrPassDisplay() {
  const uid = currentUser ? currentUser.id : 'DMC0806';
  const taskId = (currentTasks && currentTasks[0]) ? currentTasks[0].id : 'GENERAL';
  const slot = Math.floor(Date.now() / 45000);
  const payload = `SPORTPASS:CHECKIN:${taskId}:${uid}:${slot}`;
  const container = document.getElementById('qr-code-box');
  if (container) renderQrIntoContainer(container, payload, 160);
  safeSetText('qr-token-code', `#${uid}-VN`);
}

function startQrCountdown() {
  qrCountdown = 45;
  safeSetText('qr-timer', qrCountdown + 's');
  updateQrPassDisplay();
  if (qrTimerInterval) clearInterval(qrTimerInterval);
  qrTimerInterval = setInterval(() => {
    qrCountdown--;
    if (qrCountdown <= 0) {
      qrCountdown = 45;
      updateQrPassDisplay();
    }
    safeSetText('qr-timer', qrCountdown + 's');
  }, 1000);
}

function stopQrCountdown() {
  if (qrTimerInterval) {
    clearInterval(qrTimerInterval);
    qrTimerInterval = null;
  }
}

function openQrModal() {
  startQrCountdown();
  openSheetDialog('qr-modal');
}

function closeQrModal() {
  stopQrCountdown();
  closeSheetDialog('qr-modal');
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
    if (statusEl) statusEl.textContent = 'Trình duyệt chưa hỗ trợ camera trực tiếp. Chọn ảnh QR hoặc nhập Mã ID.';
    return;
  }

  try {
    qrScannerStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentCameraFacing, width: { ideal: 640 }, height: { ideal: 640 } },
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
    if (statusEl) statusEl.textContent = 'Không mở được camera. Hãy chọn ảnh QR hoặc nhập Mã ID bên dưới.';
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
      showToast('Không đọc được mã QR từ ảnh đã chọn.');
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
  const selTask = document.getElementById('selScanTaskId')?.value || '';
  let taskId = selTask || currentScanTargetTaskId || (currentTasks[0] ? currentTasks[0].id : '');
  let memberId = '';

  if (trimmed.startsWith('SPORTPASS:CHECKIN:')) {
    const parts = trimmed.split(':');
    taskId = parts[2] || taskId;
    memberId = parts[3] || '';
  } else if (trimmed.startsWith('#') && trimmed.endsWith('-VN')) {
    memberId = trimmed.slice(1, -3);
  } else if (trimmed.startsWith('PASS-')) {
    memberId = trimmed.split('-')[1] || '';
  } else if (trimmed.startsWith('{')) {
    try {
      const parsedPayload = JSON.parse(rawCode);
      memberId = parsedPayload.memberId || parsedPayload.id || '';
      taskId = parsedPayload.taskId || taskId;
    } catch (e) {}
  } else {
    memberId = trimmed;
  }

  if (!memberId) {
    showToast('Mã QR không chứa mã hội viên hợp lệ.');
    return;
  }
  handleQrCheckinAction(taskId, memberId);
}

function handleQrCheckinAction(taskId, memberId) {
  if (!isAuthorizedScanner()) {
    showToast('Chỉ Ban Chủ Nhiệm hoặc Trưởng/Phó ban mới được quét điểm danh.');
    return;
  }
  const cleanMemberId = String(memberId || '').trim().toUpperCase();
  const task = (currentTasks || []).find(t => t.id === taskId) || currentTasks[0];
  if (!task) {
    showToast('Chưa có ca trực để điểm danh.');
    return;
  }

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
      persistUserSession(currentUser);
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
    renderDispatchHub();
    showToast(`Điểm danh QR thành công: ${cleanMemberId}`);
  } else {
    showToast(`${cleanMemberId} đã điểm danh ca này trước đó.`);
  }
}
