// SportPass V8.5 — 60fps Animated Top-Layer <dialog closedby="any"> & Success Celebration Controller

let celebrationTimer = null;

function openSheetDialog(id) {
  const dlg = document.getElementById(id);
  if (!dlg) return;
  dlg.removeAttribute('data-closing');
  if (typeof dlg.showModal === 'function' && !dlg.open) {
    try { dlg.showModal(); } catch (e) {}
  }
  triggerHaptic('light');
}

function closeSheetDialog(id) {
  const dlg = document.getElementById(id);
  if (!dlg || !dlg.open) return;

  if (id === 'approve-shift-modal') stopQrCameraStream();
  if (id === 'qr-modal') stopQrCountdown();
  if (id === 'success-celebration-modal' && celebrationTimer) {
    clearInterval(celebrationTimer);
    celebrationTimer = null;
  }

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    dlg.removeAttribute('data-closing');
    try { dlg.close(); } catch (e) {}
    return;
  }

  dlg.setAttribute('data-closing', '');
  setTimeout(() => {
    dlg.removeAttribute('data-closing');
    if (dlg.open) {
      try { dlg.close(); } catch (e) {}
    }
  }, 215);
}

function openSuccessCelebration({ kicker, title, descNodes }) {
  const dlg = document.getElementById('success-celebration-modal');
  if (!dlg) return;
  if (celebrationTimer) {
    clearInterval(celebrationTimer);
    celebrationTimer = null;
  }

  safeSetText('celebration-kicker', kicker || '• SPORTPASS PRO CLOUD');
  safeSetText('celebration-title', title || 'Thao tác thành công!');

  const descEl = document.getElementById('celebration-desc');
  if (descEl) {
    if (Array.isArray(descNodes)) {
      mount(descEl, descNodes);
    } else {
      descEl.textContent = String(descNodes || 'Thông tin đã được lưu và đồng bộ vào hệ thống SportPass.');
    }
  }

  let secs = 3;
  safeSetText('celebration-countdown', `Tự động đóng sau ${secs}s`);
  openSheetDialog('success-celebration-modal');
  triggerHaptic('success');

  celebrationTimer = setInterval(() => {
    secs--;
    if (secs <= 0) {
      clearInterval(celebrationTimer);
      celebrationTimer = null;
      closeSheetDialog('success-celebration-modal');
    } else {
      safeSetText('celebration-countdown', `Tự động đóng sau ${secs}s`);
    }
  }, 1000);
}

function closeAllModals() {
  if (celebrationTimer) {
    clearInterval(celebrationTimer);
    celebrationTimer = null;
  }
  document.querySelectorAll('dialog.sp-sheet-dialog').forEach((dlg) => {
    dlg.removeAttribute('data-closing');
    if (dlg.open && typeof dlg.close === 'function') {
      try { dlg.close(); } catch (e) {}
    }
  });
  stopQrCountdown();
  stopQrCameraStream();
}

function initModalLifecycle() {
  const supportsClosedBy = ('closedBy' in HTMLDialogElement.prototype);
  document.querySelectorAll('dialog.sp-sheet-dialog').forEach((dlg) => {
    dlg.addEventListener('cancel', (ev) => {
      ev.preventDefault();
      closeSheetDialog(dlg.id);
    });

    dlg.addEventListener('click', (ev) => {
      if (ev.target === dlg) {
        closeSheetDialog(dlg.id);
      }
    });

    if (!supportsClosedBy) {
      let pressedOutside = false;
      const panel = dlg.querySelector('.sheet-panel, .celebration-panel');
      const isOutside = (e) => {
        if (!panel) return e.target === dlg;
        const r = panel.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      dlg.addEventListener('pointerdown', (e) => { pressedOutside = isOutside(e); });
      dlg.addEventListener('pointerup', (e) => {
        if (pressedOutside && isOutside(e)) closeSheetDialog(dlg.id);
      });
    }
  });
}
