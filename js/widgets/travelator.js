// Moving walkway: ground velocity = walkway velocity + Pip's walking velocity (tip-to-tail arrows).
// params: { tasks: [{ text, check: (walkway, walk) => bool }] }

import { makeStage, loop, sky, ground, arrow, tag, slider, controls, readout, taskBanner } from './stage.js';
import { drawSprite } from '../core/sprites.js';
import { fmtSigned } from '../core/util.js';
import { sfx } from '../core/sound.js';

export default function travelator(el, params = {}, api) {
  const tasks = params.tasks || [];
  let taskIdx = 0, holdTime = 0;
  const W = 480, H = 250;
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const ro = readout();
  let ww = 1, wk = 1.5, x = W / 2, belt = 0;

  const s1 = slider({ label: 'Walkway velocity', min: -3, max: 3, step: 0.5, value: ww, format: (v) => `${fmtSigned(v)} m/s`, onInput: (v) => { ww = v; show(); } });
  const s2 = slider({ label: 'Pip walks (on the belt)', min: -4, max: 4, step: 0.5, value: wk, format: (v) => `${fmtSigned(v)} m/s`, onInput: (v) => { wk = v; show(); } });
  el.append(controls(s1.el, s2.el), ro.el);

  function show() {
    ro.set([
      ['Walkway', `${fmtSigned(ww)} m/s`],
      ['Pip (relative to walkway)', `${fmtSigned(wk)} m/s`],
      ['Pip compared with the ground', `${fmtSigned(ww)} + (${fmtSigned(wk)}) = ${fmtSigned(ww + wk)} m/s`, 'winner'],
    ]);
    if (tasks.length && taskIdx < tasks.length) banner.set(`Task ${taskIdx + 1}/${tasks.length}: ${tasks[taskIdx].text}`);
    else if (!tasks.length) banner.set('Play with both sliders. Watch the yellow arrow: it is the two arrows added tip-to-tail.');
    holdTime = 0;
  }

  const PX = 14; // pixels per metre
  const stop = loop((dt, now) => {
    const g = ww + wk;
    x += g * PX * dt;
    if (x > W + 20) x = -20;
    if (x < -20) x = W + 20;
    belt = (belt + ww * PX * dt) % 16;

    if (tasks.length && taskIdx < tasks.length && tasks[taskIdx].check(ww, wk)) {
      holdTime += dt;
      if (holdTime > 0.8) {
        sfx.correct();
        taskIdx++;
        if (taskIdx >= tasks.length) {
          banner.set('All tasks complete! 🎉', true);
          api.done();
        } else show();
      }
    }

    const { ctx } = st;
    sky(ctx, W, H);
    ground(ctx, 190, W, 20, 60);
    // walkway belt
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, 180, W, 12);
    ctx.fillStyle = '#6b6b6b';
    for (let bx = -16 + belt; bx < W + 16; bx += 16) ctx.fillRect(Math.round(bx), 182, 8, 8);
    // Pip
    const bob = Math.abs(wk) > 0 ? Math.sin(now * 14) * 1.2 : 0;
    drawSprite(ctx, 'hero', x, 180 + bob, 3, { flip: wk < 0 || (wk === 0 && ww < 0) });
    // tip-to-tail arrows
    const S = 32;
    const ax = W / 2 - ((ww + wk) * S) / 2;
    const rows = [40, 82, 124];
    arrow(ctx, ax, rows[0], ax + ww * S, rows[0], '#4aedd9', 5);
    tag(ctx, `walkway ${fmtSigned(ww)}`, ax + (ww * S) / 2, rows[0] - 10, { color: '#4aedd9', size: 10 });
    arrow(ctx, ax + ww * S, rows[1], ax + (ww + wk) * S, rows[1], '#ff9b3d', 5);
    tag(ctx, `walking ${fmtSigned(wk)}`, ax + ww * S + (wk * S) / 2, rows[1] - 10, { color: '#ff9b3d', size: 10 });
    arrow(ctx, ax, rows[2], ax + g * S, rows[2], '#fcee4b', 6);
    tag(ctx, `ground ${fmtSigned(g)} m/s`, ax + (g * S) / 2, rows[2] - 10, { color: '#fcee4b', size: 11 });
  });

  show();
  return stop;
}
