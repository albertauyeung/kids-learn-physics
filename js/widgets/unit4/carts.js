// Cart pusher: Newton's 2nd law on a frictionless track. Pip pushes for 2 s; a = F ÷ m.
// params: { force, mass, tasks: [{ text, check(F, m), tested? }] }

import { makeStage, loop, sky, ground, ruler, tag, arrow, slider, button, controls, readout, taskBanner } from '../stage.js';
import { drawSprite, drawTexture } from '../../core/sprites.js';
import { fmt } from '../../core/util.js';
import { sfx } from '../../core/sound.js';
import { taskRunner } from './common.js';

export default function carts(el, params = {}, api) {
  let F = params.force ?? 60, m = params.mass ?? 20;
  const W = 480, H = 210, RAIL = 168, L = 30, PUSH_T = 2;
  const xOf = (metres) => 64 + (metres / L) * (W - 96);
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const ro = readout();
  const tasks = taskRunner(params.tasks || [], banner, api, { allDone: 'F = ma mastered: bigger force → bigger acceleration, bigger mass → smaller! 🎉' });
  const sF = slider({ label: 'Push force', min: 0, max: 200, step: 10, value: F, unit: 'N', onInput: (v) => { F = v; reset(); } });
  const sM = slider({ label: 'Cart mass (each block = 10 kg)', min: 10, max: 60, step: 10, value: m, unit: 'kg', onInput: (v) => { m = v; reset(); } });
  el.append(controls(sF.el, sM.el), controls(button('▶ Push!', () => go(), 'green')), ro.el);

  const log = [];
  let t = 0, running = false, done = null;
  const a = () => F / m;
  const pos = (tt) => (tt <= PUSH_T ? 0.5 * a() * tt * tt : 0.5 * a() * PUSH_T * PUSH_T + a() * PUSH_T * (tt - PUSH_T));

  function reset() {
    t = 0; running = false; done = null;
    show();
  }
  function go() {
    reset();
    running = true;
    sfx.click();
  }

  function show() {
    const rows = [['Push', `${F} N`], ['Mass', `${m} kg`]];
    if (done) {
      rows.push([`Speed after ${fmt(done.tp, 2)} s of pushing`, `${fmt(done.v, 2)} m/s`]);
      rows.push(['Acceleration = speed gained ÷ time', `${fmt(done.v, 2)} ÷ ${fmt(done.tp, 2)} = ${fmt(done.a, 2)} m/s²`, 'winner']);
    } else rows.push(['Acceleration', 'press Push! to measure it']);
    log.forEach((r, i) => rows.push([`Run ${r.n}`, `${r.F} N on ${r.m} kg → ${fmt(r.a, 2)} m/s²`, i === log.length - 1 ? 'winner' : '']));
    ro.set(rows);
    if (!done) {
      tasks.showCurrent();
      if (tasks.finished) banner.set('Free play: try any push and any mass!', true);
    }
  }

  let alive = true, runs = 0;
  const stop = loop((dt) => {
    if (!alive) return;
    if (running) {
      t += dt;
      const end = pos(t) >= L - 2 || t >= PUSH_T + 1.5;
      if (end) {
        running = false;
        const tp = Math.min(t, PUSH_T); // a huge push can reach the end of the track before 2 s
        done = { v: a() * tp, tp, a: a() };
        runs++;
        log.push({ n: runs, F, m, a: a() });
        if (log.length > 3) log.shift();
        show();
        const out = tasks.attempt(F, m);
        if (out === 'next') banner.set(`Yes! ${F} N on ${m} kg gives ${fmt(a(), 2)} m/s². Next — ${tasks.text()}`, true);
        else if (out === 'miss') {
          sfx.wrong();
          banner.set(`${F} N on ${m} kg gives ${fmt(a(), 2)} m/s². ${tasks.text()}`);
        }
      }
    }
    const { ctx } = st;
    sky(ctx, W, H);
    ground(ctx, RAIL + 8, W, 20, H - RAIL);
    for (let x = 0; x < W; x += 16) drawTexture(ctx, 'rail', x, RAIL - 8, 16);
    ruler(ctx, xOf, RAIL + 16, 0, L, 1, 5);
    // end bumper
    drawTexture(ctx, 'stone', xOf(L) + 6, RAIL - 24, 16);
    const x = Math.min(pos(running || done ? t : 0), L - 2);
    const cx = xOf(x);
    // load: one stone block per 10 kg, stacked in the cart
    const blocks = m / 10;
    for (let i = 0; i < blocks; i++) {
      const col = i % 3, row = Math.floor(i / 3);
      drawTexture(ctx, 'stone', cx - 18 + col * 12, RAIL - 38 - row * 12, 12, i);
    }
    drawSprite(ctx, 'minecart', cx, RAIL + 2, 4);
    const pushing = (running && t < PUSH_T) || (!running && !done);
    const pipX = pushing ? cx - 36 : xOf(Math.min(pos(PUSH_T), L - 2)) - 36;
    drawSprite(ctx, 'hero', pipX, RAIL + 2, 2.5, { flip: false });
    if (pushing && F > 0) {
      arrow(ctx, cx - 26, RAIL - 50, cx - 26 + Math.max(16, F * 0.4), RAIL - 50, '#ff9b3d', 5);
      tag(ctx, `${F} N`, cx - 26 + Math.max(16, F * 0.4) / 2, RAIL - 60, { size: 11, color: '#ffd2a6' });
    }
    const vNow = running ? a() * Math.min(t, PUSH_T) : done ? done.v : 0;
    tag(ctx, `${fmt(vNow, 1)} m/s`, cx, 26, { size: 11, color: '#fcee4b' });
    tag(ctx, `t = ${fmt(Math.min(running || done ? t : 0, 9), 1)} s`, W - 40, 20, { size: 11 });
    if (running && t < PUSH_T) tag(ctx, 'pushing...', 60, 20, { size: 11, color: '#ff9b3d' });
    else if (running) tag(ctx, 'gliding (no force)', 70, 20, { size: 11, color: '#4aedd9' });
  });

  show();
  return () => {
    alive = false;
    stop();
  };
}
