// SportPass V8.6 — Adaptive 3-State Theme Controller (Light / Dark / System)

const THEME_STORAGE_KEY = 'sportpass-theme-mode';

function resolveEffectiveTheme(mode) {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  const prefersDark = Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  return prefersDark ? 'dark' : 'light';
}

function getSavedThemeMode() {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch (e) {}
  return 'system';
}

function syncThemeControlUI(mode) {
  const active = mode || getSavedThemeMode();
  const effective = resolveEffectiveTheme(active);
  document.documentElement.dataset.theme = effective;

  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) {
    meta.setAttribute('content', (active === 'light' || active === 'dark') ? active : 'light dark');
  }

  const bLight = document.getElementById('theme-btn-light');
  const bDark = document.getElementById('theme-btn-dark');
  const bSys = document.getElementById('theme-btn-system');
  if (bLight) {
    bLight.classList.toggle('active', active === 'light');
    bLight.setAttribute('aria-pressed', String(active === 'light'));
  }
  if (bDark) {
    bDark.classList.toggle('active', active === 'dark');
    bDark.setAttribute('aria-pressed', String(active === 'dark'));
  }
  if (bSys) {
    bSys.classList.toggle('active', active === 'system');
    bSys.setAttribute('aria-pressed', String(active === 'system'));
  }

  const desc = document.getElementById('theme-mode-desc');
  if (desc) {
    if (active === 'system') {
      desc.textContent = `Theo hệ thống (${effective === 'dark' ? 'đang tối' : 'đang sáng'})`;
    } else if (active === 'dark') {
      desc.textContent = 'Đang bật chế độ tối Aquamorphic';
    } else {
      desc.textContent = 'Đang bật chế độ sáng Frosted Sky';
    }
  }
}

function setColorScheme(mode = 'system', animate = true) {
  const nextMode = (mode === 'dark' || mode === 'light') ? mode : 'system';
  const apply = () => {
    try {
      if (nextMode === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, nextMode);
    } catch (e) {}
    syncThemeControlUI(nextMode);
  };

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (animate && document.startViewTransition && !reduce) {
    try {
      document.startViewTransition({ update: apply, types: ['theme'] });
      return;
    } catch (e) {}
  }
  apply();
}

function cycleThemeMode() {
  const cur = getSavedThemeMode();
  const order = ['light', 'dark', 'system'];
  const next = order[(order.indexOf(cur) + 1) % order.length];
  setColorScheme(next, true);
  const label = next === 'dark' ? 'Tối' : (next === 'system' ? 'Tự động theo hệ thống' : 'Sáng Frosted Sky');
  showToast(`Giao diện: ${label}`);
}

function initThemeController() {
  syncThemeControlUI(getSavedThemeMode());
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', () => syncThemeControlUI());
  }
  window.addEventListener('storage', (ev) => {
    if (ev.key === THEME_STORAGE_KEY) syncThemeControlUI();
  });
}
