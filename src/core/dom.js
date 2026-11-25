// SportPass V8.6 — Zero-innerHTML Declarative DOM Builder, Smooth rAF 3D Parallax & Water Ripple Engine

const SVG_NS = 'http://www.w3.org/2000/svg';

const SP_ICON_PATHS = {
  zap: [['polygon', { points: '13 2 3 14 12 14 11 22 21 10 12 10 13 2' }]],
  check: [
    ['path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }],
    ['polyline', { points: '22 4 12 14.01 9 11.01' }]
  ],
  alert: [
    ['path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z' }],
    ['line', { x1: '12', y1: '9', x2: '12', y2: '13' }],
    ['line', { x1: '12', y1: '17', x2: '12.01', y2: '17' }]
  ],
  refresh: [
    ['path', { d: 'M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' }],
    ['path', { d: 'M3 3v5h5' }],
    ['path', { d: 'M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16' }],
    ['path', { d: 'M16 16h5v5' }]
  ],
  trash: [
    ['polyline', { points: '3 6 5 6 21 6' }],
    ['path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }]
  ],
  'map-pin': [
    ['path', { d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' }],
    ['circle', { cx: '12', cy: '10', r: '3' }]
  ],
  clock: [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['polyline', { points: '12 6 12 12 16 14' }]
  ],
  eye: [
    ['path', { d: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z' }],
    ['circle', { cx: '12', cy: '12', r: '3' }]
  ],
  'eye-off': [
    ['path', { d: 'M9.88 9.88a3 3 0 1 0 4.24 4.24' }],
    ['path', { d: 'M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68' }],
    ['path', { d: 'M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61' }],
    ['line', { x1: '2', x2: '22', y1: '2', y2: '22' }]
  ]
};

function appendChildren(parent, children) {
  for (const ch of children) {
    if (ch === null || ch === undefined || ch === false) continue;
    if (Array.isArray(ch)) {
      appendChildren(parent, ch);
    } else if (typeof ch === 'object' && ch.nodeType) {
      parent.appendChild(ch);
    } else {
      parent.appendChild(document.createTextNode(String(ch)));
    }
  }
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  if (attrs && typeof attrs === 'object') {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'className') {
        node.className = v;
      } else if (k === 'style' && typeof v === 'object') {
        for (const [sk, sv] of Object.entries(v)) {
          if (sk.startsWith('--')) node.style.setProperty(sk, String(sv));
          else node.style[sk] = sv;
        }
      } else if (k === 'dataset' && typeof v === 'object') {
        for (const [dk, dv] of Object.entries(v)) {
          node.dataset[dk] = String(dv);
        }
      } else if (k.startsWith('on') && typeof v === 'function') {
        node.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (v === true && (k === 'disabled' || k === 'checked' || k === 'readOnly' || k === 'selected')) {
        node[k] = true;
      } else if (k === 'value') {
        node.value = String(v);
      } else {
        node.setAttribute(k, String(v));
      }
    }
  }
  appendChildren(node, children);
  return node;
}

function svgEl(tag, attrs = {}, ...children) {
  const node = document.createElementNS(SVG_NS, tag);
  if (attrs && typeof attrs === 'object') {
    for (const [k, v] of Object.entries(attrs)) {
      if (v !== null && v !== undefined && v !== false) {
        node.setAttribute(k, String(v));
      }
    }
  }
  appendChildren(node, children);
  return node;
}

function spIconNode(name, size = 16) {
  const s = String(Number(size) || 16);
  const spec = SP_ICON_PATHS[name] || SP_ICON_PATHS.zap;
  const shapes = spec.map(([t, a]) => svgEl(t, a));
  return svgEl('svg', {
    width: s,
    height: s,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.8',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true'
  }, shapes);
}

function mount(container, ...nodes) {
  if (!container) return;
  const flat = [];
  const collect = (arr) => {
    for (const item of arr) {
      if (item === null || item === undefined || item === false) continue;
      if (Array.isArray(item)) collect(item);
      else if (typeof item === 'object' && item.nodeType) flat.push(item);
      else flat.push(document.createTextNode(String(item)));
    }
  };
  collect(nodes);
  container.replaceChildren(...flat);
}

let waterRippleBound = false;

function handleDelegatedWaterRipple(e) {
  const target = e.target && e.target.closest ? e.target.closest('.water-ripple-target') : null;
  if (!target || target.disabled) return;
  const rect = target.getBoundingClientRect();
  let clientX = e.clientX;
  let clientY = e.clientY;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if (clientX === undefined) {
    clientX = rect.left + rect.width / 2;
    clientY = rect.top + rect.height / 2;
  }

  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const size = Math.max(rect.width, rect.height) * 1.2;

  const ripple = document.createElement('span');
  ripple.className = 'water-ripple';

  if (target.classList.contains('btn-sheet-danger')) {
    ripple.classList.add('ripple-danger');
  } else if (
    target.classList.contains('btn-aqua-primary') ||
    target.classList.contains('btn-sheet-primary') ||
    target.classList.contains('btn-card-approve')
  ) {
    ripple.classList.add('ripple-dark');
  } else {
    ripple.classList.add('ripple-light');
  }

  ripple.style.width = size + 'px';
  ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  target.appendChild(ripple);

  setTimeout(() => {
    if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
  }, 630);
}

function bindWaterRipples() {
  if (waterRippleBound) return;
  waterRippleBound = true;
  document.addEventListener('pointerdown', handleDelegatedWaterRipple);
}

function initHeroCardParallax() {
  const cardWrap = document.getElementById('hero-card-wrap');
  const card = document.getElementById('hero-interactive-card');
  if (!cardWrap || !card) return;

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  let rafId = 0;
  let pendingX = 0;
  let pendingY = 0;

  function applyFrame() {
    rafId = 0;
    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = pendingX - rect.left;
    const y = pendingY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((centerY - y) / centerY) * 6;
    const rotateY = ((x - centerX) / centerX) * 6;
    card.style.transition = 'transform 60ms linear';
    card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;
    card.style.setProperty('--specular-x', `${((x / rect.width) * 100).toFixed(1)}%`);
    card.style.setProperty('--specular-y', `${((y / rect.height) * 100).toFixed(1)}%`);
  }

  function scheduleMove(e) {
    if (e.target && e.target.closest && e.target.closest('button, a')) return;
    if (e.touches && e.touches.length > 0) {
      pendingX = e.touches[0].clientX;
      pendingY = e.touches[0].clientY;
    } else {
      pendingX = e.clientX;
      pendingY = e.clientY;
    }
    if (!rafId) rafId = requestAnimationFrame(applyFrame);
  }

  function resetCard() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    card.style.transition = 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)';
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  }

  cardWrap.addEventListener('mousemove', scheduleMove);
  cardWrap.addEventListener('mouseleave', resetCard);
  cardWrap.addEventListener('touchmove', scheduleMove, { passive: true });
  cardWrap.addEventListener('touchend', resetCard);
}
