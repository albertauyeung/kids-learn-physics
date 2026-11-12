// Shared drawing helpers and a task runner for the Unit 3 simulations.

import { text, tag, ground } from '../stage.js';
import { drawSprite } from '../../core/sprites.js';
import { fmt } from '../../core/util.js';
import { sfx } from '../../core/sound.js';

// A road seen from the side between y and y + h. offset (px) scrolls the centre-line dashes.
export function drawRoad(ctx, W, y, h = 26, offset = 0) {
  ground(ctx, y + h, W, 16, 60, 'dirt');
  ctx.fillStyle = '#4a4a4f';
  ctx.fillRect(0, y, W, h);
  ctx.fillStyle = '#2f2f33';
  ctx.fillRect(0, y + h - 3, W, 3);
  ctx.fillStyle = '#e8e8e8';
  const o = ((offset % 32) + 32) % 32;
  for (let x = -o; x < W; x += 32) ctx.fillRect(Math.round(x), y + h / 2 - 1, 16, 3);
  // grass verge on top
  ctx.fillStyle = '#5b8731';
  ctx.fillRect(0, y - 4, W, 4);
}

export function drawCar(ctx, x, yRoadTop, scale = 3, bob = 0) {
  drawSprite(ctx, 'u3car', x, yRoadTop + 14 + bob, scale);
}

// Distance posts every `step` metres along a road (xOf maps metres → px).
export function distancePosts(ctx, xOf, y, from, to, step, W, labelEvery = step * 5, labelY = y - 22) {
  const first = Math.ceil(from / step) * step;
  for (let m = first; m <= to; m += step) {
    const x = Math.round(xOf(m));
    if (x < -40 || x > W + 40) continue;
    const major = m % labelEvery === 0;
    ctx.fillStyle = major ? '#fff' : '#ccc';
    ctx.fillRect(x, y - (major ? 18 : 10), 2, major ? 18 : 10);
    if (major) tag(ctx, `${fmt(m)} m`, x, labelY, { size: 9 });
  }
}

// Round speedometer: needle from 0 to vmax.
export function speedo(ctx, cx, cy, r, v, vmax) {
  ctx.save();
  ctx.fillStyle = '#1b1527';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 0.8, Math.PI * 2.2);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const ang = (val) => Math.PI * 0.8 + (Math.min(val, vmax) / vmax) * Math.PI * 1.4;
  const step = vmax <= 40 ? 10 : 20;
  for (let k = 0; k <= vmax; k += step / 2) {
    const a = ang(k);
    const major = k % step === 0;
    ctx.strokeStyle = major ? '#fff' : '#888';
    ctx.lineWidth = major ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2));
    ctx.lineTo(cx + Math.cos(a) * (r - (major ? 9 : 5)), cy + Math.sin(a) * (r - (major ? 9 : 5)));
    ctx.stroke();
    if (major) text(ctx, String(k), cx + Math.cos(a) * (r - 18), cy + Math.sin(a) * (r - 18) + 4, { size: 8, align: 'center', shadow: false, color: '#ccc' });
  }
  ctx.strokeStyle = '#ff5a3d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(ang(v)) * (r - 8), cy + Math.sin(ang(v)) * (r - 8));
  ctx.stroke();
  ctx.fillStyle = '#ddd';
  ctx.fillRect(cx - 3, cy - 3, 6, 6);
  ctx.restore();
  tag(ctx, `${fmt(v, 1)} m/s`, cx, cy + r + 16, { size: 12, color: '#fcee4b' });
}

// Traffic light post at x with its stop line on the road.
export function trafficLight(ctx, x, roadY, color) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(Math.round(x) - 1, roadY, 3, 26);
  ctx.fillStyle = '#333';
  ctx.fillRect(Math.round(x) + 6, roadY - 58, 4, 58);
  ctx.fillStyle = '#111';
  ctx.fillRect(Math.round(x) + 1, roadY - 92, 14, 36);
  const lamps = [['red', '#ff3030'], ['amber', '#ffb020'], ['green', '#30e060']];
  lamps.forEach(([name, c], i) => {
    ctx.fillStyle = color === name ? c : '#3a3a3a';
    ctx.fillRect(Math.round(x) + 4, roadY - 89 + i * 11, 8, 8);
  });
}

// Tasks: [{ text, check(p) → bool, test? }]. Call run(p) after each experiment.
// Calls api.tested() when a task marked test (or the first task, if testFirst) is passed,
// and api.done() once every task is done.
export function taskRunner(tasks, banner, api, { intro = '', allDone = 'All tasks done! 🎉', describe } = {}) {
  let idx = 0;
  let finished = false;
  const show = (prefix = '') => {
    if (finished) return;
    banner.set(`${prefix}Task ${idx + 1}/${tasks.length}: ${tasks[idx].text}${intro ? ` ${intro}` : ''}`, false);
  };
  if (tasks.length) show();
  return {
    get index() {
      return idx;
    },
    get finished() {
      return finished;
    },
    current: () => tasks[idx],
    show,
    run(p) {
      if (finished || !tasks.length) return false;
      const task = tasks[idx];
      if (task.check(p)) {
        if (task.test) api.tested?.();
        idx++;
        sfx.correct();
        if (idx >= tasks.length) {
          finished = true;
          banner.set(allDone, true);
          api.done();
        } else {
          banner.set(`Yes! Task ${idx}/${tasks.length} done. Next: ${tasks[idx].text}`, true);
        }
        return true;
      }
      sfx.wrong();
      banner.set(`Not quite${describe ? ` (${describe(p)})` : ''}. Task ${idx + 1}/${tasks.length}: ${task.text}`, false);
      return false;
    },
  };
}
