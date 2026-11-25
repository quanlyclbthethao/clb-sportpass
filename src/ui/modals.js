// SportPass V8.0 — Native Top-Layer Bottom Sheet <dialog closedby="any"> Controller

function openSheetDialog(id) {
  const dlg = document.getElementById(id);
  if (!dlg) return;
  if (typeof dlg.showModal === 'function' && !dlg.open) {
    try { dlg.showModal(); } catch (e) {}
  }
  triggerHaptic('light');
}

function closeSheetDialog(id) {
  const dlg = document.getElementById(id);
  if (!dlg) return;
  if (dlg.open && typeof dlg.close === 'function') {
    try { dlg.close(); } catch (e) {}
  }
  if (id === 'approve-shift-modal') {
    stopQrCameraStream();
  }
}

function closeAllModals() {
  document.querySelectorAll('dialog.sp-sheet-dialog').forEach((dlg) => {
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
    dlg.addEventListener('close', () => {
      if (dlg.id === 'qr-modal') stopQrCountdown();
      if (dlg.id === 'approve-shift-modal') stopQrCameraStream();
    });

    dlg.addEventListener('click', (ev) => {
      if (ev.target === dlg) {
        closeSheetDialog(dlg.id);
      }
    });

    if (!supportsClosedBy) {
      let pressedOutside = false;
      const panel = dlg.querySelector('.sheet-panel');
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
