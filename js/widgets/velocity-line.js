// Velocity on a number line: + means right, − means left. Speed is the size, velocity has a sign.
// params: { tasks: [{ text, check: (v) => bool }] }

import { makeStage, loop, sky, ground, ruler, arrow, tag, slider, button, controls, readout, taskBanner } from './stage.js';
import { drawSprite } from '../core/sprites.js';
import { fmt, fmtSigned } from '../core/util.js';
import { sfx } from '../core/sound.js';

export default function velocityLine(el, params = {}, api) {
  const tasks = params.tasks || [];
  let taskIdx = 0;
  const W = 480, H = 180, MIN = -25, MAX = 25; // ±6 m/s for 4 s = ±24 m stays on screen
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const xOf = (m) => 20 + ((m - MIN) / (MAX - MIN)) * (W - 40);
  const ro = readout();
  let v = 0, pos = 0, t = 0, running = false;

  const vs = slider({
    label: 'Velocity', min: -6, max: 6, step: 1, value: 0, format: (x) => `${fmtSigned(x)} m/s`,
    onInput: (x) => { v = x; running = false; pos = 0; t = 0; show(); },
  });
  el.append(vs.el, controls(button('▶ Play (4 s)', () => { pos = 0; t = 0; running = true; sfx.click(); }, 'green')), ro.el);

  function show() {
    ro.set([
      ['Velocity', `${fmtSigned(v)} m/s`],
      ['Speed (size only)', `${fmt(Math.abs(v))} m/s`],
      ['Direction', v > 0 ? 'right (+)' : v < 0 ? 'left (−)' : 'not moving'],
      ['Displacement after 4 s', `${fmtSigned(v * 4)} m`],
    ]);
    if (!tasks.length) banner.set('Slide the velocity, then press Play.');
    else if (taskIdx < tasks.length) banner.set(`Task ${taskIdx + 1}/${tasks.length}: ${tasks[taskIdx].text} — then press Play.`);
  }

  function checkTask() {
    if (taskIdx >= tasks.length) return;
    if (tasks[taskIdx].check(v)) {
      sfx.correct();
      taskIdx++;
      if (taskIdx >= tasks.length) {
        banner.set('All tasks complete! 🎉', true);
        api.done();
      } else {
        show();
      }
    } else {
      sfx.wrong();
      banner.set(`Not quite. ${tasks[taskIdx].text}`);
    }
  }

  const stop = loop((dt, now) => {
    if (running) {
      t += dt;
      if (t >= 4) {
        t = 4;
        running = false;
        if (tasks.length) checkTask();
        else api.done();
      }
      pos = v * t;
    }
    const { ctx } = st;
    sky(ctx, W, H);
    ground(ctx, 120, W, 20, 60);
    ruler(ctx, xOf, 130, MIN, MAX, 1, 5);
    drawSprite(ctx, 'flag', xOf(0) + 6, 120, 2);
    const bob = running ? Math.sin(now * 25) * 0.8 : 0;
    drawSprite(ctx, 'minecart', xOf(pos), 120 + bob, 3);
    if (v !== 0) {
      arrow(ctx, xOf(pos), 80, xOf(pos) + v * 12, 80, v > 0 ? '#80ff20' : '#ff6b6b', 5);
      tag(ctx, `${fmtSigned(v)} m/s`, xOf(pos) + v * 6, 70);
    }
  });

  show();
  return stop;
}
