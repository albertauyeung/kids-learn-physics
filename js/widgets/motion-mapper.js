// Motion Mapper: move Pip along a track while a position–time graph is drawn live.
// params: { duration: 10, track: [0, 20], target?: [[t, x], ...], tolerance?: 1.5, label?: 'distance' | 'position' }

import { makeStage, loop, sky, ground, ruler, text, tag, slider, button, controls, taskBanner } from './stage.js';
import { drawSprite } from '../core/sprites.js';
import { fmt, clamp } from '../core/util.js';
import { sfx } from '../core/sound.js';

export function interp(points, t) {
  if (t <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [t0, x0] = points[i - 1];
    const [t1, x1] = points[i];
    if (t <= t1) return x0 + ((x1 - x0) * (t - t0)) / (t1 - t0 || 1);
  }
  return points[points.length - 1][1];
}

export default function motionMapper(el, params = {}, api) {
  const T = params.duration || 10;
  const [XMIN, XMAX] = params.track || [0, 20];
  const target = params.target;
  const tol = params.tolerance ?? 1.5;
  const yLabel = params.label || 'position';
  const W = 480, H = 330;
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);

  // Track strip (top) and graph (bottom) geometry
  const trackY = 70;
  const xOfM = (m) => 30 + ((m - XMIN) / (XMAX - XMIN)) * (W - 60);
  const G = { left: 46, right: W - 16, top: 110, bottom: H - 30 };
  const gx = (t) => G.left + (t / T) * (G.right - G.left);
  const gy = (m) => G.bottom - ((m - XMIN) / (XMAX - XMIN)) * (G.bottom - G.top);

  let pos = target ? target[0][1] : XMIN;
  let t = 0, recording = false, samples = [], dragging = false, finished = false;

  const posSlider = slider({
    label: 'Move Pip', min: XMIN, max: XMAX, step: 0.1, value: pos, unit: 'm',
    onInput: (v) => { pos = v; },
  });
  const startBtn = button('● Record', () => start(), 'green');
  el.append(controls(startBtn), posSlider.el);

  function start() {
    t = 0;
    samples = [[0, pos]];
    recording = true;
    finished = false;
    sfx.click();
    banner.set(target ? 'Recording... follow the dashed line!' : 'Recording... move Pip with the slider or drag on the track.');
  }

  function finish() {
    recording = false;
    sfx.complete();
    if (!target) {
      banner.set('Done! Notice: steeper line = faster. Flat line = standing still. Record again to experiment.', true);
      api.done();
      return;
    }
    let err = 0;
    for (const [ts, xs] of samples) err += Math.abs(xs - interp(target, ts));
    err /= samples.length;
    const score = Math.round(clamp(100 - err * 12, 0, 100));
    if (err <= tol) {
      banner.set(`Match score: <b>${score}%</b> — great match! ✅`, true);
      sfx.correct();
      api.done();
    } else {
      banner.set(`Match score: <b>${score}%</b>. Try again — move faster where the line is steep, stop where it's flat.`);
    }
  }

  const onDown = (e) => {
    const p = st.toLocal(e);
    if (p.y < 100) {
      dragging = true;
      st.canvas.setPointerCapture(e.pointerId);
      onMove(e);
    }
  };
  const onMove = (e) => {
    if (!dragging) return;
    const p = st.toLocal(e);
    pos = clamp(XMIN + ((p.x - 30) / (W - 60)) * (XMAX - XMIN), XMIN, XMAX);
    posSlider.value = pos;
  };
  const onUp = () => (dragging = false);
  st.canvas.addEventListener('pointerdown', onDown);
  st.canvas.addEventListener('pointermove', onMove);
  st.canvas.addEventListener('pointerup', onUp);
  st.canvas.style.touchAction = 'none';

  banner.set(target
    ? 'Press <b>Record</b>, then move Pip so the graph matches the dashed line.'
    : 'Press <b>Record</b>, then move Pip with the slider (or drag him on the track).');

  let shown = pos, facing = 1;
  const stop = loop((dt, now) => {
    if (recording) {
      t += dt;
      samples.push([Math.min(t, T), pos]);
      if (t >= T) finish();
    }
    if (Math.abs(pos - shown) > 0.01) facing = pos > shown ? 1 : -1;
    shown += (pos - shown) * Math.min(1, dt * 15);

    const { ctx } = st;
    sky(ctx, W, 100);
    ground(ctx, trackY, W, 16, 30);
    ruler(ctx, xOfM, trackY + 4, XMIN, XMAX, 1, 5);
    const moving = Math.abs(pos - shown) > 0.05;
    drawSprite(ctx, 'hero', xOfM(shown), trackY + (moving ? Math.sin(now * 20) : 0), 3, { flip: facing < 0 });
    if (recording) tag(ctx, `t = ${fmt(t, 1)} s`, W - 50, 16, { color: '#ff6b6b' });

    // graph panel
    ctx.fillStyle = '#1b1527';
    ctx.fillRect(0, 100, W, H - 100);
    ctx.fillStyle = '#26203a';
    ctx.fillRect(G.left, G.top, G.right - G.left, G.bottom - G.top);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let s = 0; s <= T; s++) ctx.fillRect(Math.round(gx(s)), G.top, 1, G.bottom - G.top);
    const mstep = (XMAX - XMIN) > 20 ? 5 : 2;
    for (let m = XMIN; m <= XMAX; m += mstep) ctx.fillRect(G.left, Math.round(gy(m)), G.right - G.left, 1);
    ctx.fillStyle = '#ddd';
    ctx.fillRect(G.left, G.top, 2, G.bottom - G.top);
    ctx.fillRect(G.left, G.bottom, G.right - G.left, 2);
    for (let s = 0; s <= T; s += 2) text(ctx, String(s), gx(s), G.bottom + 13, { size: 10, align: 'center' });
    for (let m = XMIN; m <= XMAX; m += mstep * (mstep === 2 ? 2 : 1)) text(ctx, String(m), G.left - 6, gy(m) + 4, { size: 10, align: 'right' });
    text(ctx, 'time (s)', G.right, H - 4, { size: 10, align: 'right', color: '#aaa' });
    text(ctx, `${yLabel} (m)`, 4, G.top - 2, { size: 10, color: '#aaa' });

    if (target) {
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = '#fcee4b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      target.forEach(([tt, xx], i) => (i ? ctx.lineTo(gx(tt), gy(xx)) : ctx.moveTo(gx(tt), gy(xx))));
      ctx.stroke();
      ctx.restore();
    }
    if (samples.length > 1) {
      ctx.strokeStyle = '#80ff20';
      ctx.lineWidth = 3;
      ctx.beginPath();
      samples.forEach(([tt, xx], i) => (i ? ctx.lineTo(gx(tt), gy(xx)) : ctx.moveTo(gx(tt), gy(xx))));
      ctx.stroke();
    }
    // live dot
    const dotT = recording ? t : samples.length ? samples[samples.length - 1][0] : 0;
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(gx(dotT) - 3, gy(pos) - 3, 6, 6);
  });

  return () => {
    stop();
  };
}
