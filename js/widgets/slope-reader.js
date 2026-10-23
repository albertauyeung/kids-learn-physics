// Read velocity from the slope of a position–time graph. Drag the time cursor.
// params: { points: [[t, x], ...], track: [min, max] }

import { makeStage, loop, sky, ground, ruler, text, tag, slider, readout } from './stage.js';
import { drawSprite } from '../core/sprites.js';
import { fmt, fmtSigned } from '../core/util.js';
import { interp } from './motion-mapper.js';

export default function slopeReader(el, params, api) {
  const pts = params.points;
  const T = pts[pts.length - 1][0];
  const [XMIN, XMAX] = params.track || [0, 20];
  const W = 480, H = 330;
  const st = makeStage(el, W, H);
  const ro = readout();
  let cursor = 0;
  const visited = new Set();

  const cs = slider({ label: 'Time', min: 0, max: T, step: 0.1, value: 0, unit: 's', onInput: (v) => { cursor = v; show(); } });
  el.append(cs.el, ro.el);

  const seg = () => {
    for (let i = 1; i < pts.length; i++) if (cursor <= pts[i][0]) return i - 1;
    return pts.length - 2;
  };

  function show() {
    const i = seg();
    const [t0, x0] = pts[i];
    const [t1, x1] = pts[i + 1];
    const v = (x1 - x0) / (t1 - t0);
    visited.add(i);
    ro.set([
      ['Position now', `${fmt(interp(pts, cursor), 2)} m`],
      [`Slope of this piece (${t0}–${t1} s)`, `(${fmt(x1)} − ${fmt(x0)}) ÷ (${t1} − ${t0}) = ${fmtSigned(v)} m/s`, 'winner'],
      ['Meaning', v > 0 ? 'moving right (+)' : v < 0 ? 'moving left (−)' : 'standing still'],
    ]);
    if (visited.size === pts.length - 1) api.done();
  }

  const xOfM = (m) => 30 + ((m - XMIN) / (XMAX - XMIN)) * (W - 60);
  const G = { left: 46, right: W - 16, top: 110, bottom: H - 30 };
  const gx = (t) => G.left + (t / T) * (G.right - G.left);
  const gy = (m) => G.bottom - ((m - XMIN) / (XMAX - XMIN)) * (G.bottom - G.top);

  const stop = loop(() => {
    const { ctx } = st;
    sky(ctx, W, 100);
    ground(ctx, 70, W, 16, 30);
    ruler(ctx, xOfM, 74, XMIN, XMAX, 1, 5);
    const i = seg();
    const v = (pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]);
    drawSprite(ctx, 'hero', xOfM(interp(pts, cursor)), 70, 3, { flip: v < 0 });

    ctx.fillStyle = '#1b1527';
    ctx.fillRect(0, 100, W, H - 100);
    ctx.fillStyle = '#26203a';
    ctx.fillRect(G.left, G.top, G.right - G.left, G.bottom - G.top);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let s = 0; s <= T; s++) ctx.fillRect(Math.round(gx(s)), G.top, 1, G.bottom - G.top);
    for (let m = XMIN; m <= XMAX; m += 2) ctx.fillRect(G.left, Math.round(gy(m)), G.right - G.left, 1);
    ctx.fillStyle = '#ddd';
    ctx.fillRect(G.left, G.top, 2, G.bottom - G.top);
    ctx.fillRect(G.left, G.bottom, G.right - G.left, 2);
    for (let s = 0; s <= T; s += 1) text(ctx, String(s), gx(s), G.bottom + 13, { size: 10, align: 'center' });
    for (let m = XMIN; m <= XMAX; m += 4) text(ctx, String(m), G.left - 6, gy(m) + 4, { size: 10, align: 'right' });
    text(ctx, 'time (s)', G.right, H - 4, { size: 10, align: 'right', color: '#aaa' });
    text(ctx, 'position (m)', 4, G.top - 2, { size: 10, color: '#aaa' });

    // full line, highlighted current segment
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#80ff20';
    ctx.beginPath();
    pts.forEach(([t, x], k) => (k ? ctx.lineTo(gx(t), gy(x)) : ctx.moveTo(gx(t), gy(x))));
    ctx.stroke();
    const [t0, x0] = pts[i];
    const [t1, x1] = pts[i + 1];
    ctx.strokeStyle = '#fcee4b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(gx(t0), gy(x0));
    ctx.lineTo(gx(t1), gy(x1));
    ctx.stroke();
    // rise/run triangle
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ff9b3d';
    ctx.beginPath();
    ctx.moveTo(gx(t0), gy(x0));
    ctx.lineTo(gx(t1), gy(x0));
    ctx.lineTo(gx(t1), gy(x1));
    ctx.stroke();
    ctx.setLineDash([]);
    tag(ctx, `run ${fmt(t1 - t0)} s`, (gx(t0) + gx(t1)) / 2, gy(x0) + (x1 >= x0 ? 16 : -6), { size: 10, color: '#ff9b3d' });
    if (x1 !== x0) tag(ctx, `rise ${fmtSigned(x1 - x0)} m`, gx(t1) + 34, (gy(x0) + gy(x1)) / 2, { size: 10, color: '#ff9b3d' });
    // cursor
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(Math.round(gx(cursor)), G.top, 2, G.bottom - G.top);
    ctx.fillRect(gx(cursor) - 4, gy(interp(pts, cursor)) - 4, 8, 8);
  });

  show();
  return stop;
}
