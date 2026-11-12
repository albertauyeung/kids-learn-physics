// Shared drawing helpers and a tiny task runner for the Unit 4 force simulations.

import { drawTexture } from '../../core/sprites.js';
import { sfx } from '../../core/sound.js';

// Wooden crate (size × size), bottom-left at (x, y - size).
export function drawCrate(ctx, x, y, size) {
  const n = Math.max(1, Math.round(size / 16));
  const s = size / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) drawTexture(ctx, 'planks', x + i * s, y - size + j * s, s, i + j * 3);
  ctx.save();
  ctx.strokeStyle = '#4a2c12';
  ctx.lineWidth = 3;
  ctx.strokeRect(Math.round(x) + 1.5, Math.round(y - size) + 1.5, size - 3, size - 3);
  ctx.beginPath();
  ctx.moveTo(x + 3, y - size + 3);
  ctx.lineTo(x + size - 3, y - 3);
  ctx.moveTo(x + size - 3, y - size + 3);
  ctx.lineTo(x + 3, y - 3);
  ctx.stroke();
  ctx.restore();
}

// Floor strips for the friction sims. offsetPx scrolls the pattern with the camera.
export function drawFloor(ctx, kind, y, w, hgt, offsetPx = 0) {
  ctx.save();
  if (kind === 'ice') {
    ctx.fillStyle = '#bfe3ff';
    ctx.fillRect(0, y, w, hgt);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let x = -(((offsetPx % 64) + 64) % 64); x < w + 64; x += 64) {
      ctx.fillRect(Math.round(x), y + 5, 26, 2);
      ctx.fillRect(Math.round(x + 34), y + 15, 18, 2);
    }
    ctx.fillStyle = '#8fc6f0';
    ctx.fillRect(0, y, w, 3);
  } else if (kind === 'wood') {
    for (let x = -(((offsetPx % 16) + 16) % 16); x < w; x += 16) {
      for (let yy = y; yy < y + hgt; yy += 16) drawTexture(ctx, 'planks', x, yy, 16, Math.abs(Math.round((x + offsetPx) / 16)) % 5);
    }
  } else {
    // carpet: deep red with a woven pattern
    ctx.fillStyle = '#9c2f3a';
    ctx.fillRect(0, y, w, hgt);
    ctx.fillStyle = '#7d2230';
    for (let x = -(((offsetPx % 8) + 8) % 8); x < w; x += 8) {
      for (let yy = y + 2; yy < y + hgt; yy += 8) ctx.fillRect(Math.round(x), yy, 4, 4);
    }
    ctx.fillStyle = '#c4505c';
    ctx.fillRect(0, y, w, 3);
  }
  ctx.restore();
}

// Jetpack / rocket flame pointing in direction dir (−1 = flame to the left).
export function flame(ctx, x, y, dir, now) {
  const len = 16 + Math.sin(now * 40) * 4;
  ctx.save();
  ctx.fillStyle = '#ff8a00';
  ctx.beginPath();
  ctx.moveTo(x, y - 6);
  ctx.lineTo(x + dir * len, y);
  ctx.lineTo(x, y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffe066';
  ctx.beginPath();
  ctx.moveTo(x, y - 3);
  ctx.lineTo(x + dir * len * 0.6, y);
  ctx.lineTo(x, y + 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Sequential tasks: { text, check(...), tested? }. Calls api.tested() for a prediction test
// and api.done() once, after the last task.
export function taskRunner(tasks, banner, api, { allDone = 'All tasks complete! 🎉' } = {}) {
  let idx = 0;
  let finished = !tasks.length;
  const current = () => tasks[idx];
  return {
    get idx() {
      return idx;
    },
    get finished() {
      return finished;
    },
    text() {
      return finished ? '' : `Task ${idx + 1}/${tasks.length}: ${tasks[idx].text}`;
    },
    showCurrent() {
      if (!finished) banner.set(this.text());
    },
    // Try the current task with these arguments. Returns 'done' | 'next' | 'miss' | 'none'.
    attempt(...args) {
      if (finished) return 'none';
      const t = current();
      if (!t.check(...args)) return 'miss';
      if (t.tested) api.tested?.();
      sfx.correct();
      idx++;
      if (idx >= tasks.length) {
        finished = true;
        banner.set(allDone, true);
        api.done();
        return 'done';
      }
      return 'next';
    },
  };
}
