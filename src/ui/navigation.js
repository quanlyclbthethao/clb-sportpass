// SportPass V6.0 — Directional View Transitions, Spring Dock, Touch Swipe & 3D Tilt

let isActionDebouncing = false;

function runWithDebounce(actionFn, delay = 220) {
  if (isActionDebouncing) return;
  isActionDebouncing = true;
  try {
    if (typeof actionFn === 'function') actionFn();
  } finally {
    setTimeout(() => { isActionDebouncing = false; }, delay);
  }
}

function switchDockTab(tabIdx, triggerEvent = null) {
  const normalized = Math.max(0, Math.min(2, Number(tabIdx) || 0));
  const prevIdx = Number(currentActiveTabIdx) || 0;
  const direction = normalized >= prevIdx ? 'forward' : 'backward';

  const applyDOM = () => {
    currentActiveTabIdx = normalized;
    window.currentActiveTabIdx = normalized;

    const panels = ['tabContentProfile', 'tabContentTasks', 'tabContentForum'];
    panels.forEach((pId, idx) => {
      const el = document.getElementById(pId);
      if (!el) return;
      if (idx === normalized) {
        el.classList.remove('hidden');
        el.style.display = 'flex';
      } else {
        el.classList.add('hidden');
        el.style.display = 'none';
      }
    });

    for (let i = 0; i < 3; i++) {
      const btn = document.getElementById('btnDock' + i);
      if (btn) {
        btn.classList.toggle('active', i === normalized);
        btn.setAttribute('aria-selected', String(i === normalized));
      }
    }

    const indicator = document.getElementById('dockActiveIndicator');
    if (indicator) {
      indicator.style.transform = `translateX(${normalized * 100}%)`;
    }

    if (normalized === 1) renderTasksList();
    else if (normalized === 2) renderForumFeed();
  };

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canVT = Boolean(document.startViewTransition && triggerEvent && triggerEvent.isTrusted && !reduceMotion && normalized !== prevIdx);

  if (canVT) {
    try {
      document.startViewTransition({ update: applyDOM, types: [direction] });
    } catch (e) {
      applyDOM();
    }
  } else {
    applyDOM();
  }

  // Exact real-time reconciliation invariants
  if (normalized === 1 && currentUser && navigator.onLine) {
    syncRealtimeData();
  }
  restartAdaptivePolling();
}

function switchTab(tabIdx, ev = null) {
  switchDockTab(tabIdx, ev);
}

function goToTab(tabIdx, ev = null) {
  switchDockTab(tabIdx, ev);
}

function initTouchSwipeNavigation() {
  const stage = document.getElementById('tabStage');
  if (!stage) return;
  let startX = 0;
  let startY = 0;
  let tracking = false;

  stage.addEventListener('touchstart', (ev) => {
    if (!ev.touches || ev.touches.length !== 1) return;
    if (ev.target && ev.target.closest && ev.target.closest('.filter-rail, input, textarea, select')) return;
    startX = ev.touches[0].clientX;
    startY = ev.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  stage.addEventListener('touchend', (ev) => {
    if (!tracking || !ev.changedTouches || ev.changedTouches.length !== 1) return;
    tracking = false;
    const dx = ev.changedTouches[0].clientX - startX;
    const dy = ev.changedTouches[0].clientY - startY;
    if (Math.abs(dx) < 58 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    if (dx < 0 && currentActiveTabIdx < 2) {
      switchDockTab(currentActiveTabIdx + 1);
    } else if (dx > 0 && currentActiveTabIdx > 0) {
      switchDockTab(currentActiveTabIdx - 1);
    }
  }, { passive: true });
}

function init3DTilt() {
  if (window.matchMedia && (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(hover: none)').matches)) {
    return;
  }
  document.querySelectorAll('.tilt-card').forEach((card) => {
    card.addEventListener('pointermove', (ev) => {
      const rect = card.getBoundingClientRect();
      const x = (ev.clientX - rect.left) / rect.width;
      const y = (ev.clientY - rect.top) / rect.height;
      card.style.setProperty('--mouse-x', `${Math.round(x * 100)}%`);
      card.style.setProperty('--mouse-y', `${Math.round(y * 100)}%`);
      const rotX = (0.5 - y) * 7;
      const rotY = (x - 0.5) * 9;
      card.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });
  });
}

function initAquamorphicWaterRipple() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.addEventListener('pointerdown', (ev) => {
    const btn = ev.target && ev.target.closest ? ev.target.closest('.spring-touch') : null;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height, 44);
    const wave = document.createElement('span');
    wave.className = 'ripple-wave';
    wave.style.width = `${size}px`;
    wave.style.height = `${size}px`;
    wave.style.left = `${(ev.clientX - rect.left) - size / 2}px`;
    wave.style.top = `${(ev.clientY - rect.top) - size / 2}px`;
    btn.appendChild(wave);
    setTimeout(() => wave.remove(), 550);
  }, { passive: true });
}

function applyStaggerFallback(container) {
  if (!container || (window.CSS && CSS.supports && CSS.supports('animation-delay: calc(sibling-index() * 0.1s)'))) {
    return;
  }
  Array.from(container.children).forEach((el, idx) => {
    el.style.setProperty('--sibling-index', String(idx + 1));
  });
}
