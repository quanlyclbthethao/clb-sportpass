// SportPass V6.0 — Adaptive Dual-Mode Theme Engine (System / Light / Dark + View Transition)

const THEME_STORAGE_KEY = 'color-scheme';

function getSystemPrefersDark() {
  return Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

function getEffectiveSchemeLabel() {
  return getSystemPrefersDark() ? 'Đang tối' : 'Đang sáng';
}

function syncThemeControlUI() {
  let stored = null;
  try { stored = localStorage.getItem(THEME_STORAGE_KEY); } catch (e) {}
  const activeMode = (stored === 'light' || stored === 'dark') ? stored : 'system';

  const btnSys = document.getElementById('btnThemeSystem');
  const btnLight = document.getElementById('btnThemeLight');
  const btnDark = document.getElementById('btnThemeDark');
  if (btnSys) btnSys.setAttribute('aria-pressed', String(activeMode === 'system'));
  if (btnLight) btnLight.setAttribute('aria-pressed', String(activeMode === 'light'));
  if (btnDark) btnDark.setAttribute('aria-pressed', String(activeMode === 'dark'));

  const sysHint = document.getElementById('themeSystemHint');
  if (sysHint) sysHint.textContent = getEffectiveSchemeLabel();
}

function setColorScheme(mode = 'system', animate = true) {
  const apply = () => {
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (mode === 'light' || mode === 'dark') {
      try { localStorage.setItem(THEME_STORAGE_KEY, mode); } catch (e) {}
      if (meta) meta.setAttribute('content', mode);
    } else {
      try { localStorage.removeItem(THEME_STORAGE_KEY); } catch (e) {}
      if (meta) meta.setAttribute('content', 'light dark');
    }
    syncThemeControlUI();
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

function initThemeController() {
  syncThemeControlUI();
  window.addEventListener('storage', (ev) => {
    if (ev.key === THEME_STORAGE_KEY) {
      const meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) meta.setAttribute('content', ev.newValue === 'light' || ev.newValue === 'dark' ? ev.newValue : 'light dark');
      syncThemeControlUI();
    }
  });
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', syncThemeControlUI);
  }
}
