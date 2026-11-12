// Space skater: Newton's 1st law. With the jetpack off there is no force, so Pip's velocity never changes.
// Each blast pushes for 1 s and changes his velocity by exactly 1 m/s.
// params: { v0, tasks: [{ text, check(state), tested? }] }, state = { v, coast, blasts }

import { makeStage, loop, tag, arrow, button, controls, readout, taskBanner } from '../stage.js';
import { drawSprite } from '../../core/sprites.js';
import { fmt, fmtSigned, makeRng } from '../../core/util.js';
import { sfx } from '../../core/sound.js';
import { flame, taskRunner } from './common.js';

export default function space(el, params = {}, api) {
  const v0 = params.v0 ?? 3;
  const W = 480, H = 230, PX = 20, WORLD = W / PX; // 24 m wide, wraps around
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const ro = readout();
  const tasks = taskRunner(params.tasks || [], banner, api, { allDone: 'Newton would be proud: no force, no change in motion! 🎉' });
  const startBtn = button('▶ Start', () => start(), 'green');
  el.append(
    controls(startBtn, button('↺ Reset', () => reset())),
    controls(button('🔥 Blast: push left', () => blast(-1)), button('Blast: push right 🔥', () => blast(1))),
    ro.el,
  );

  const rng = makeRng(42);
  const stars = Array.from({ length: 70 }, () => ({ x: rng.next() * W, y: rng.next() * (H - 30), s: rng.chance(0.2) ? 2 : 1 }));
  let v, x, started, blasting, blasts, coast, trail, trailT, msg;

  function reset() {
    v = v0; x = 4; started = false; blasting = null; queue = []; blasts = 0; coast = 0; trail = []; trailT = 0; msg = '';
    show();
  }
  function start() {
    if (started) return;
    started = true;
    sfx.click();
    show();
  }
  // Taps during a blast are queued (iPad users tap quickly: 3 taps = 3 blasts).
  let queue = [];
  function blast(dir) {
    if (blasting) {
      queue.push(dir);
      blasts++;
      show();
      return;
    }
    if (!started) start();
    fire(dir);
    blasts++;
    if (tasks.idx === 0 && !tasks.finished && (params.tasks || [])[0]?.tested) {
      msg = 'For this test, keep the jetpack OFF! Press Reset, then Start and just watch.';
    }
    show();
  }
  function fire(dir) {
    blasting = { dir, t: 0, from: v };
    coast = 0;
    sfx.boom();
  }

  function show() {
    const force = blasting ? `60 N to the ${blasting.dir > 0 ? 'right' : 'left'} (jetpack on)` : '0 N (jetpack off)';
    ro.set([
      ['Force on Pip', force],
      ['Velocity (+ right, − left)', `${fmtSigned(Math.round(v * 10) / 10)} m/s`, 'winner'],
      ['Floating with no force for', `${fmt(coast, 1)} s`],
      ['Blasts used', `${blasts}${queue.length ? ` (${queue.length} waiting)` : ''}`],
    ]);
    if (msg) banner.set(msg);
    else if (!started) banner.set(tasks.finished ? 'Press Start and play!' : `${tasks.text()}`);
    else tasks.showCurrent();
  }

  let alive = true, roTimer = 0;
  const stop = loop((dt, now) => {
    if (!alive) return;
    if (started) {
      if (blasting) {
        blasting.t += dt;
        if (blasting.t >= 1) {
          v = blasting.from + blasting.dir; // exactly 1 m/s per blast
          blasting = null;
          if (queue.length) fire(queue.shift());
        } else v = blasting.from + blasting.dir * blasting.t;
      } else coast += dt;
      x = (((x + v * dt) % WORLD) + WORLD) % WORLD;
      trailT += dt;
      if (trailT >= 0.5) {
        trailT -= 0.5;
        trail.push(x);
        if (trail.length > 10) trail.shift();
      }
      if (!blasting) {
        const out = tasks.attempt({ v: Math.round(v * 1000) / 1000, coast, blasts });
        if (out === 'next') {
          msg = '';
          banner.set(`Yes! ${tasks.idx === 1 ? 'With no force, his speed stayed exactly the same. ' : ''}Next — ${tasks.text()}`, true);
        }
      }
      roTimer += dt;
      if (roTimer > 0.2) {
        roTimer = 0;
        const keep = banner.el.classList.contains('done') ? banner.el.innerHTML : null;
        show();
        if (keep) banner.set(keep, true);
      }
    }
    const { ctx } = st;
    ctx.fillStyle = '#0b0b1e';
    ctx.fillRect(0, 0, W, H);
    for (const s of stars) {
      ctx.fillStyle = s.s > 1 ? '#ffffff' : '#9aa0c8';
      ctx.fillRect(Math.round(s.x), Math.round(s.y), s.s, s.s);
    }
    // a far-away planet
    ctx.fillStyle = '#6b4aa8';
    ctx.beginPath();
    ctx.arc(420, 40, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a6ad0';
    ctx.fillRect(400, 34, 40, 4);
    // ruler
    ctx.fillStyle = '#556';
    ctx.fillRect(0, H - 28, W, 2);
    for (let m = 0; m <= WORLD; m += 2) {
      ctx.fillStyle = '#889';
      ctx.fillRect(m * PX, H - 28, 1, m % 4 === 0 ? 7 : 4);
      if (m % 4 === 0 && m < WORLD) tag(ctx, `${m} m`, m * PX + 2, H - 6, { size: 9, align: 'left', bg: 'rgba(0,0,0,0)' });
    }
    // trail: where Pip was every half second (equal gaps = steady speed)
    trail.forEach((tx, i) => {
      ctx.fillStyle = `rgba(252,238,75,${0.25 + (0.6 * i) / trail.length})`;
      ctx.fillRect(Math.round(tx * PX) - 2, 170, 5, 5);
    });
    // Pip
    const px = x * PX, py = 150;
    for (const off of [0, -W, W]) {
      const cx = px + off;
      if (cx < -40 || cx > W + 40) continue;
      if (blasting) flame(ctx, cx - blasting.dir * 16, py - 24, -blasting.dir, now);
      drawSprite(ctx, 'u4astro', cx, py, 3);
    }
    if (blasting) {
      arrow(ctx, px, 80, px + blasting.dir * 50, 80, '#ff9b3d', 5);
      tag(ctx, '60 N', px + blasting.dir * 25, 70, { size: 11, color: '#ffd2a6' });
    }
    tag(ctx, `${fmtSigned(Math.round(v * 10) / 10)} m/s`, px, 104, { size: 11, color: '#fcee4b' });
    if (!started) tag(ctx, 'Press Start', W / 2, 30, { size: 13 });
  });

  reset();
  return () => {
    alive = false;
    stop();
  };
}
