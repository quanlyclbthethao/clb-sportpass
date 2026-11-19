// SportPass V6.0 — Native Top-Layer <dialog> Engine with @starting-style Exit Fallback

let _supportsDisplayTransition;

function canTransitionDisplay() {
  if (_supportsDisplayTransition !== undefined) return _supportsDisplayTransition;
  if (!window.CSS || !CSS.supports || !CSS.supports('transition-behavior', 'allow-discrete') || !document.body) {
    return false;
  }
  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = 'none';
  _supportsDisplayTransition = getComputedStyle(probe).display === 'block';
  probe.remove();
  return _supportsDisplayTransition;
}

function supportsTopLayerExit() {
  return Boolean(window.CSS && CSS.supports && CSS.supports('overlay', 'auto') && canTransitionDisplay());
}

function openGenericModal(id) {
  const dlg = document.getElementById(id);
  if (!dlg) return;
  dlg.removeAttribute('data-closing');
  dlg.classList.add('open');
  if (typeof dlg.showModal === 'function' && !dlg.open) {
    try { dlg.showModal(); } catch (e) {}
  }
  triggerHaptic('light');
}

function closeGenericModal(id) {
  const dlg = document.getElementById(id);
  if (!dlg) return;
  dlg.classList.remove('open');

  if (!dlg.open) return;

  if (supportsTopLayerExit()) {
    try { dlg.close(); } catch (e) {}
    return;
  }

  dlg.setAttribute('data-closing', '');
  const animations = dlg.getAnimations ? dlg.getAnimations({ subtree: true }) : [];
  if (animations.length === 0) {
    dlg.removeAttribute('data-closing');
    try { dlg.close(); } catch (e) {}
    return;
  }

  Promise.race([
    Promise.allSettled(animations.map(a => a.finished)),
    new Promise(r => setTimeout(r, 400))
  ]).then(() => {
    if (!dlg.hasAttribute('data-closing')) return;
    dlg.removeAttribute('data-closing');
    try { dlg.close(); } catch (e) {}
  });
}

function closeAllModals() {
  document.querySelectorAll('dialog.sp-dialog').forEach((dlg) => {
    dlg.classList.remove('open');
    dlg.removeAttribute('data-closing');
    if (dlg.open) {
      try { dlg.close(); } catch (e) {}
    }
  });
  stopQrCameraStream();
}

function initModalLifecycle() {
  const supportsClosedBy = ('closedBy' in HTMLDialogElement.prototype);
  document.querySelectorAll('dialog.sp-dialog').forEach((dlg) => {
    dlg.addEventListener('cancel', (ev) => {
      ev.preventDefault();
      closeGenericModal(dlg.id);
    });

    // Handles both native backdrop click (when clicking outside sheet padding) and synthetic MouseEvent clicks in tests
    dlg.addEventListener('click', (ev) => {
      if (ev.target === dlg) {
        closeGenericModal(dlg.id);
      }
    });

    if (!supportsClosedBy) {
      let pressedOutside = false;
      const sheet = dlg.querySelector('.sp-sheet');
      const isOutside = (e) => {
        if (!sheet) return e.target === dlg;
        const r = sheet.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      dlg.addEventListener('pointerdown', (e) => { pressedOutside = isOutside(e); });
      dlg.addEventListener('pointerup', (e) => {
        if (pressedOutside && isOutside(e)) closeGenericModal(dlg.id);
      });
    }
  });
}

function openConfirmDialog(title, msg, confirmLabelOrFn, maybeFn) {
  safeSetText('confirmDialogTitle', title || 'Xác nhận thao tác');
  safeSetText('confirmDialogMsg', msg || 'Bạn chắc chắn muốn tiếp tục?');
  const btn = document.getElementById('btnConfirmDialogAction');
  if (typeof confirmLabelOrFn === 'function') {
    pendingConfirmCallback = confirmLabelOrFn;
    if (btn) btn.textContent = 'Xác nhận';
  } else {
    pendingConfirmCallback = typeof maybeFn === 'function' ? maybeFn : null;
    if (btn) btn.textContent = confirmLabelOrFn || 'Xác nhận';
  }
  openGenericModal('modalConfirmDialog');
}

function closeConfirmDialog() {
  pendingConfirmCallback = null;
  closeGenericModal('modalConfirmDialog');
}

function executeConfirmedAction() {
  const cb = pendingConfirmCallback;
  closeConfirmDialog();
  if (typeof cb === 'function') cb();
}

function openHeaderMoreModal() {
  syncThemeControlUI();
  openGenericModal('modalHeaderMore');
}

function closeHeaderMoreModal() {
  closeGenericModal('modalHeaderMore');
}
