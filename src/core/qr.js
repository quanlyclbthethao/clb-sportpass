// SportPass V8.6 — 45s Dynamic Shift-Bound QR Pass, Check-in Scanner & Live Verified List

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

function populateQrPassTaskSelector() {
  const sel = document.getElementById('selQrPassTask');
  if (!sel) return;
  const uid = currentUser ? currentUser.id : '';
  const tasks = Array.isArray(currentTasks) ? currentTasks : [];

  const sorted = tasks.slice().sort((a, b) => {
    const aMine = uid && ([...(a.joinedMembers || []), ...(a.assignedMembers || [])].includes(uid));
    const bMine = uid && ([...(b.joinedMembers || []), ...(b.assignedMembers || [])].includes(uid));
    if (aMine !== bMine) return aMine ? -1 : 1;
    return 0;
  });

  const opts = sorted.length > 0
    ? sorted.map(t => el('option', { value: t.id }, `${t.id} — ${t.title}`))
    : [el('option', { value: 'GENERAL' }, 'Điểm danh thành viên CLB')];

  mount(sel, opts);
  if (activeQrTaskId && sorted.some(t => t.id === activeQrTaskId)) {
    sel.value = activeQrTaskId;
  } else if (sel.options.length > 0) {
    activeQrTaskId = sel.options[0].value;
  }
}

function updateQrPassDisplay() {
  const uid = currentUser ? currentUser.id : 'DMC0806';
  const sel = document.getElementById('selQrPassTask');
  const taskId = (sel && sel.value) || activeQrTaskId || (currentTasks && currentTasks[0] ? currentTasks[0].id : 'GENERAL');
  activeQrTaskId = taskId;

  const task = (currentTasks || []).find(t => t && t.id === taskId);
  const isChecked = Boolean(task && Array.isArray(task.checkedInMembers) && task.checkedInMembers.includes(uid));
  const pill = document.getElementById('qr-checkin-status-pill');
  if (pill) {
    pill.textContent = isChecked ? 'Đã điểm danh ✓' : 'Chưa điểm danh';
    pill.className = isChecked ? 'ready-badge-pill' : 'role-pill-badge';
  }

  const slot = Math.floor(Date.now() / 45000);
  const payload = `SPORTPASS:CHECKIN:${taskId}:${uid}:${slot}`;
  const container = document.getElementById('qr-code-box');
  if (container) renderQrIntoContainer(container, payload, 160);
  safeSetText('qr-token-code', `#${uid} · ${taskId}`);
}

function startQrCountdown() {
  qrCountdown = 45;
  safeSetText('qr-timer', qrCountdown + 's');
  populateQrPassTaskSelector();
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

function openQrModal(preferredTaskId = null) {
  if (preferredTaskId && typeof preferredTaskId === 'string') {
    activeQrTaskId = preferredTaskId;
  }
  startQrCountdown();
  openSheetDialog('qr-modal');
}

function closeQrModal() {
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

function renderScannerCheckedInList() {
  const listEl = document.getElementById('scannerCheckedInList');
  if (!listEl) return;
  const selTask = document.getElementById('selScanTaskId')?.value || currentScanTargetTaskId || (currentTasks[0] ? currentTasks[0].id : '');
  const task = (currentTasks || []).find(t => t && t.id === selTask);
  const checked = task && Array.isArray(task.checkedInMembers) ? task.checkedInMembers : [];

  const header = el('div', { className: 'field-head-split', style: { marginTop: '4px' } },
    el('span', { className: 'field-label-mono' }, 'Danh sách đã điểm danh'),
    el('span', { className: 'role-pill-badge' }, `${checked.length} thành viên`)
  );

  if (checked.length === 0) {
    mount(listEl, header, el('div', { className: 'empty-card', style: { padding: '12px' } }, 'Chưa có thành viên nào điểm danh ca này.'));
    return;
  }

  const rows = checked.map((mid) => {
    const member = (membersDirectory || []).find(m => m && m.id === mid);
    return el('div', { className: 'member-pill-row', style: { padding: '8px 10px' } },
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: '0', flex: '1' } },
        el('div', { className: 'avatar-initials-circle solid', style: { width: '30px', height: '30px', fontSize: '10.5px' } }, getSportPassInitials(member ? member.hoTen : mid)),
        el('div', { style: { minWidth: '0', flex: '1' } },
          el('div', { style: { fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }, className: 'truncate' }, member ? member.hoTen : mid),
          el('div', { className: 'font-mono', style: { fontSize: '10.5px', color: 'var(--text-muted)' } }, mid)
        )
      ),
      el('span', { className: 'ready-badge-pill' }, 'Đã vào ca')
    );
  });

  mount(listEl, header, rows);
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
  } else if (trimmed.startsWith('#') && trimmed.includes('-VN')) {
    memberId = trimmed.slice(1).split('-VN')[0].split(' ')[0];
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
        const nextShifts = (Number(m.soCaHoanThanh ?? m.soCa ?? 0)) + 1;
        m.soCaHoanThanh = nextShifts;
        m.soCa = nextShifts;
        saveMemberOverride(cleanMemberId, { soCaHoanThanh: nextShifts, soCa: nextShifts });
      }
    }
    if (currentUser && currentUser.id === cleanMemberId) {
      const nextCur = (Number(currentUser.soCaHoanThanh ?? currentUser.soCa ?? 0)) + 1;
      currentUser.soCaHoanThanh = nextCur;
      currentUser.soCa = nextCur;
      saveMemberOverride(cleanMemberId, { soCaHoanThanh: nextCur, soCa: nextCur });
      persistUserSession(currentUser);
      renderProfileData();
    }

    const payload = { taskId: task.id, memberId: cleanMemberId, scannerId: currentUser ? currentUser.id : 'SYSTEM' };
    dispatchBackendMutation('QR_CHECKIN', payload);

    saveLocalState();
    renderDispatchHub();
    renderScannerCheckedInList();
    renderMembersModalList();
    renderNotificationsModalList();
    safeSetValue('iptManualCheckinId', '');
    triggerHaptic('success');
    showToast(`Điểm danh QR thành công: ${cleanMemberId}`);
  } else {
    showToast(`${cleanMemberId} đã điểm danh ca này trước đó.`);
  }
}
