// Shared helpers for canvas simulations: a crisp pixel stage, an animation loop,
// scenery, arrows, labels and Minecraft-style controls.

import { h, fmt } from '../core/util.js';
import { drawTexture } from '../core/sprites.js';

export const FONT = '"Pixelify Sans", "VT323", monospace';

// A canvas with a fixed logical size (w × h) that scales to its container width.
export function makeStage(parent, w, hgt) {
  const canvas = h('canvas', { class: 'stage' });
  const k = Math.min(3, Math.max(2, Math.ceil(window.devicePixelRatio || 1)));
  canvas.width = w * k;
  canvas.height = hgt * k;
  canvas.style.aspectRatio = `${w} / ${hgt}`;
  parent.append(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(k, k);
  ctx.imageSmoothingEnabled = false;
  // Scale canvas text up when the stage is shown small (phones), so labels stay readable.
  ctx.__fs = 1;
  const fit = () => {
    const shown = canvas.getBoundingClientRect().width;
    if (shown > 0) ctx.__fs = Math.min(2, Math.max(1, (w / shown) * 1.15));
  };
  if (window.ResizeObserver) new ResizeObserver(fit).observe(canvas);
  requestAnimationFrame(fit);
  const toLocal = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * w) / r.width, y: ((e.clientY - r.top) * hgt) / r.height };
  };
  return { canvas, ctx, w, h: hgt, toLocal };
}

// requestAnimationFrame loop with dt in seconds; returns a stop function.
export function loop(fn) {
  let last = performance.now();
  let id = 0;
  let running = true;
  const tick = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    fn(dt, now / 1000);
    id = requestAnimationFrame(tick);
  };
  id = requestAnimationFrame(tick);
  return () => {
    running = false;
    cancelAnimationFrame(id);
  };
}

export function sky(ctx, w, hgt) {
  const bands = ['#79a6ff', '#86b0ff', '#93baff', '#a2c4ff', '#b1ceff'];
  const bh = hgt / bands.length;
  bands.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, i * bh, w, bh + 1);
  });
}

export function ground(ctx, y, w, size = 16, hgt = null, top = 'grass') {
  const rows = hgt == null ? 1 : Math.ceil(hgt / size);
  for (let r = 0; r < rows; r++) {
    for (let x = 0; x < w; x += size) {
      drawTexture(ctx, r === 0 ? top : 'dirt', x, y + r * size, size, (x / size + r * 7) % 5);
    }
  }
}

export function text(ctx, str, x, y, { size = 12, color = '#fff', align = 'left', shadow = true, baseline = 'alphabetic', bold = false } = {}) {
  size *= ctx.__fs || 1;
  ctx.save();
  ctx.font = `${bold ? '700 ' : ''}${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (shadow) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillText(str, x + 1, y + 1);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.restore();
}

// Label inside a dark box (for readouts drawn on the canvas).
export function tag(ctx, str, x, y, { size = 11, color = '#fff', bg = 'rgba(20,18,29,0.8)', align = 'center' } = {}) {
  size *= ctx.__fs || 1;
  if (y - size < 2) y = size + 2;
  ctx.save();
  ctx.font = `${size}px ${FONT}`;
  const tw = ctx.measureText(str).width;
  const pad = 3;
  let left = x - tw / 2 - pad;
  if (align === 'left') left = x;
  if (align === 'right') left = x - tw - pad * 2;
  const cw = ctx.canvas.width / ctx.getTransform().a;
  left = Math.max(1, Math.min(left, cw - tw - pad * 2 - 1));
  ctx.fillStyle = bg;
  ctx.fillRect(Math.round(left), Math.round(y - size), Math.round(tw + pad * 2), size + 4);
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, left + pad, y);
  ctx.restore();
}

export function arrow(ctx, x1, y1, x2, y2, color = '#fcee4b', width = 4) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const head = Math.min(10, len * 0.6);
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  const draw = (dx, dy, col) => {
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = width;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(x1 + dx, y1 + dy);
    ctx.lineTo(x2 + dx - Math.cos(ang) * head * 0.8, y2 + dy - Math.sin(ang) * head * 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2 + dx, y2 + dy);
    ctx.lineTo(x2 + dx - Math.cos(ang - 0.5) * head, y2 + dy - Math.sin(ang - 0.5) * head);
    ctx.lineTo(x2 + dx - Math.cos(ang + 0.5) * head, y2 + dy - Math.sin(ang + 0.5) * head);
    ctx.closePath();
    ctx.fill();
  };
  draw(1.5, 1.5, 'rgba(0,0,0,0.45)');
  draw(0, 0, color);
  ctx.restore();
}

// Number line / ruler with tick labels. xOf maps metres to pixels.
export function ruler(ctx, xOf, y, from, to, step = 1, labelEvery = 5, color = '#fff') {
  ctx.save();
  ctx.fillStyle = color;
  for (let m = from; m <= to + 1e-9; m += step) {
    const x = Math.round(xOf(m));
    const major = Math.abs(m % labelEvery) < 1e-9;
    ctx.fillRect(x, y, 1, major ? 6 : 3);
    if (major) text(ctx, fmt(m), x, y + 16, { size: 10, align: 'center' });
  }
  ctx.restore();
}

// ---------- DOM controls ----------
export function slider({ label, min, max, step = 1, value, unit = '', onInput, format }) {
  const out = h('span', { class: 'slider-value' });
  const input = h('input', { type: 'range', min, max, step, value });
  const show = () => {
    const v = Number(input.value);
    out.textContent = format ? format(v) : `${fmt(v)} ${unit}`.trim();
  };
  input.addEventListener('input', () => {
    show();
    onInput?.(Number(input.value));
  });
  show();
  const wrap = h('label', { class: 'slider' }, h('span', { class: 'slider-label' }, label), input, out);
  return {
    el: wrap,
    get value() {
      return Number(input.value);
    },
    set value(v) {
      input.value = v;
      show();
    },
    set disabled(v) {
      input.disabled = v;
    },
  };
}

export function button(label, onClick, cls = '') {
  return h('button', { class: `mc-btn small ${cls}`, type: 'button', onClick }, label);
}

export function controls(...children) {
  return h('div', { class: 'sim-controls' }, ...children);
}

export function readout() {
  const el = h('div', { class: 'readout' });
  return {
    el,
    set(rows) {
      el.innerHTML = rows
        .filter(Boolean)
        .map(([k, v, cls]) => `<div class="ro-row ${cls || ''}"><span>${k}</span><b>${v}</b></div>`)
        .join('');
    },
  };
}

// Goal/task banner used by sims with challenges.
export function taskBanner() {
  const el = h('div', { class: 'task-banner' });
  return {
    el,
    set(html, done = false) {
      el.innerHTML = html;
      el.classList.toggle('done', done);
    },
  };
}
