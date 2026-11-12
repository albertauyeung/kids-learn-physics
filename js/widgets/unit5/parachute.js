// Parachute designer: a skydiver falls; drag grows with speed (drag = D × speed²) until it equals the
// weight — terminal velocity. With no parachute D is tiny (top speed ≈ 50 m/s for 80 kg); for our
// parachutes D equals the canopy area in m² (drag in newtons = area × speed²).
// params: { mass, area, tasks: [{ text, check(mass, area, vTerminal) }], testedAfter?: task index }

import { makeStage, loop, text, tag, arrow, slider, button, controls, readout, taskBanner } from '../stage.js';
import { drawSprite } from '../../core/sprites.js';
import { fmt } from '../../core/util.js';
import { sfx } from '../../core/sound.js';
import { G, stepWithDrag, terminalSpeed } from './physics.js';

export const BODY_D = 0.32; // no parachute: an 80 kg skydiver tops out at 50 m/s
const RUN_TIME = 16; // seconds of fall shown

export default function parachute(el, params = {}, api) {
  const tasks = params.tasks || [];
  let taskIdx = 0;
  let mass = params.mass || 80;
  let area = params.area ?? 0;
  const W = 480, H = 300;
  const GX0 = 250, GX1 = 466, GY0 = 40, GY1 = 270, VMAX = 60;
  const gx = (t) => GX0 + (t / RUN_TIME) * (GX1 - GX0);
  const gy = (v) => GY1 - (v / VMAX) * (GY1 - GY0);
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const ro = readout();
  let t = 0, v = 0, running = false, done = false, trace = [];
  let scroll = 0;
  let alive = true;

  const D = () => (area > 0 ? area : BODY_D);
  const weightN = () => mass * G;
  const vt = () => terminalSpeed(mass, D());

  const mSlider = slider({ label: 'Skydiver + kit mass', min: 50, max: 100, step: 10, value: mass, unit: 'kg', onInput: (x) => { mass = x; reset(); } });
  const aSlider = slider({
    label: 'Parachute size', min: 0, max: 60, step: 2, value: area,
    format: (x) => (x === 0 ? 'none' : `${x} m²`), onInput: (x) => { area = x; reset(); },
  });
  const jumpBtn = button('🪂 Jump!', () => { reset(); running = true; sfx.click(); }, 'green');
  el.append(controls(mSlider.el, aSlider.el), controls(jumpBtn), ro.el);

  function reset() {
    t = 0; v = 0; running = false; done = false; trace = [];
    show();
  }

  function show() {
    const drag = D() * v * v;
    ro.set([
      ['Drag rule', area > 0 ? `drag = ${area} × speed²` : 'no parachute: drag is small'],
      ['Weight = m × g', `${mass} × 10 = ${weightN()} N`],
      ['Speed now', `${fmt(v, 1)} m/s`],
      ['Drag now', `${fmt(drag, 0)} N`],
      ['Resultant = weight − drag', `${fmt(Math.max(0, weightN() - drag), 0)} N down`],
      done && ['Terminal speed (drag = weight)', `${fmt(vt(), 2)} m/s`, 'winner'],
    ]);
    if (tasks.length && taskIdx < tasks.length) { if (!done) banner.set(`Task ${taskIdx + 1}/${tasks.length}: ${tasks[taskIdx].text}`); }
    else if (!tasks.length) banner.set('Choose a mass and a parachute, then <b>Jump!</b>');
  }

  function finished() {
    done = true;
    show();
    if (!tasks.length) { api.done(); return; }
    if (taskIdx >= tasks.length) return;
    if (tasks[taskIdx].check(mass, area, vt())) {
      sfx.correct();
      if (params.testedAfter === taskIdx) api.tested?.();
      taskIdx++;
      if (taskIdx >= tasks.length) {
        banner.set(`Terminal speed ${fmt(vt(), 2)} m/s. All parachute tasks done! 🎉`, true);
        api.done();
      } else {
        banner.set(`Terminal speed ${fmt(vt(), 2)} m/s. Next: ${tasks[taskIdx].text}`, true);
      }
    } else {
      sfx.wrong();
      banner.set(`Terminal speed ${fmt(vt(), 2)} m/s. Task: ${tasks[taskIdx].text}`);
    }
  }

  const stop = loop((dt) => {
    if (running && alive) {
      const steps = 20, h = (dt * 2) / steps; // 2× speed: 16 s of fall in 8 s
      for (let s = 0; s < steps && t < RUN_TIME; s++) {
        v = stepWithDrag(v, mass, D(), h);
        t += h;
        if (s % 5 === 0) trace.push([t, v]);
      }
      scroll += v * dt * 6;
      if (t >= RUN_TIME) {
        running = false;
        finished();
      } else show();
    }
    const { ctx } = st;
    ['#5b8de8', '#6b9af0', '#7ba7f5', '#8bb4fa', '#9bc1ff'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, (i * H) / 5, W, H / 5 + 1); });
    // clouds stream upwards past the diver: faster fall, faster clouds
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 6; i++) {
      const y = ((i * 97 - scroll) % (H + 60) + H + 60) % (H + 60) - 30;
      const x = 20 + ((i * 71) % 180);
      ctx.fillRect(x, y, 46, 12); ctx.fillRect(x + 10, y - 8, 26, 8);
    }
    // the skydiver
    const cx = 100, cy = 170;
    if (area > 0) {
      const sc = 2 + Math.min(3, area / 15);
      drawSprite(ctx, 'u5chute', cx, cy - 22, sc);
    }
    drawSprite(ctx, 'u5diver', cx, cy + 10, 3);
    // force arrows: weight down, drag up (same scale)
    const k = 70 / 1000;
    arrow(ctx, cx + 40, cy, cx + 40, cy + weightN() * k, '#ff6b6b', 4);
    tag(ctx, `weight ${weightN()} N`, cx + 46, cy + weightN() * k + 4, { size: 10, align: 'left', color: '#ff6b6b' });
    const drag = Math.min(weightN() * 1.5, D() * v * v);
    if (drag > 5) {
      arrow(ctx, cx - 40, cy, cx - 40, cy - drag * k, '#4aedd9', 4);
      tag(ctx, `drag ${fmt(drag, 0)} N`, cx - 46, cy - drag * k - 2, { size: 10, align: 'right', color: '#4aedd9' });
    }
    // speed–time graph
    ctx.fillStyle = 'rgba(20,18,29,0.8)'; ctx.fillRect(GX0 - 30, GY0 - 18, GX1 - GX0 + 40, GY1 - GY0 + 40);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let s = 0; s <= RUN_TIME; s += 4) ctx.fillRect(gx(s), GY0, 1, GY1 - GY0);
    for (let x = 0; x <= VMAX; x += 10) ctx.fillRect(GX0, gy(x), GX1 - GX0, 1);
    for (let x = 0; x <= VMAX; x += 20) text(ctx, `${x}`, GX0 - 6, gy(x) + 4, { size: 9, align: 'right', color: '#ccc' });
    for (let s = 0; s <= RUN_TIME; s += 4) text(ctx, `${s}`, gx(s), GY1 + 14, { size: 9, align: 'center', color: '#ccc' });
    text(ctx, 'speed (m/s)', GX0 + 4, GY0 - 4, { size: 10, color: '#ccc' });
    text(ctx, 'time (s)', GX1, GY1 - 6, { size: 9, align: 'right', color: '#ccc' });
    if (done) {
      ctx.setLineDash([5, 4]); ctx.strokeStyle = '#fcee4b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(GX0, gy(Math.min(VMAX, vt()))); ctx.lineTo(GX1, gy(Math.min(VMAX, vt()))); ctx.stroke(); ctx.setLineDash([]);
    }
    if (trace.length > 1) {
      ctx.strokeStyle = '#80ff20'; ctx.lineWidth = 3; ctx.beginPath();
      trace.forEach(([tt, vv], i) => (i ? ctx.lineTo(gx(tt), gy(vv)) : ctx.moveTo(gx(tt), gy(vv))));
      ctx.stroke();
    }
    tag(ctx, `t = ${fmt(t, 1)} s   v = ${fmt(v, 1)} m/s`, 120, 20, { size: 11 });
  });

  show();
  return () => {
    alive = false;
    stop();
  };
}
