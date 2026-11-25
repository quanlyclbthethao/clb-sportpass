// SportPass V8.5 — Adaptive Dual-Mode Theme Controller

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
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch (e) {}
  return 'light';
}

function syncThemeControlUI(mode) {
  const active = mode || getSavedThemeMode();
  const effective = resolveEffectiveTheme(active);
  document.documentElement.dataset.theme = effective;

  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) meta.setAttribute('content', effective === 'dark' ? 'dark' : 'light');

  const badge = document.getElementById('theme-mode-badge');
  const desc = document.getElementById('theme-mode-desc');
  if (badge) {
    badge.textContent = active === 'dark' ? 'Tối ⌄' : (active === 'system' ? (effective === 'dark' ? 'Tự động (Tối) ⌄' : 'Tự động (Sáng) ⌄') : 'Sáng ⌄');
  }
  if (desc) {
    desc.textContent = active === 'system' ? 'Theo hệ thống tự động' : (active === 'dark' ? 'Đang bật chế độ tối Aquamorphic' : 'Màu sắc hiển thị trên hệ thống');
  }
}

function setColorScheme(mode = 'light', animate = true) {
  const nextMode = (mode === 'dark' || mode === 'system') ? mode : 'light';
  const apply = () => {
    try { localStorage.setItem(THEME_STORAGE_KEY, nextMode); } catch (e) {}
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
  showToast(`Chủ đề giao diện: ${label}`);
}

function initThemeController() {
  syncThemeControlUI(getSavedThemeMode());
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', () => syncThemeControlUI());
  }
}
