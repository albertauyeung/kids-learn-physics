// Ice vs carpet: friction. Pip pushes a crate for 2 s, then lets go.
// If push ≤ maximum friction, friction balances the push and nothing moves.
// Otherwise a = (push − friction) ÷ m while pushing, then friction alone slows it: deceleration = friction ÷ m.
// params: { mass, surface, push, tasks: [{ text, check(state), tested? }] }, state = { surface, push, a, moved }

import { makeStage, loop, sky, tag, arrow, slider, button, controls, readout, taskBanner } from '../stage.js';
import { drawSprite } from '../../core/sprites.js';
import { fmt } from '../../core/util.js';
import { sfx } from '../../core/sound.js';
import { drawCrate, drawFloor, taskRunner } from './common.js';

const SURFACES = {
  ice: { name: 'Ice', f: 10 },
  wood: { name: 'Wood', f: 40 },
  carpet: { name: 'Carpet', f: 80 },
};

export default function friction(el, params = {}, api) {
  const m = params.mass ?? 20, PUSH_T = 2;
  let surface = params.surface || 'carpet', P = params.push ?? 60;
  const W = 480, H = 200, FLOOR = 150, PX = 22; // pixels per metre
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const ro = readout();
  const tasks = taskRunner(params.tasks || [], banner, api, { allDone: 'Friction expert! Notice how far it slides on ice once Pip lets go. 🎉' });
  const surfBtns = {};
  for (const k of Object.keys(SURFACES)) {
    surfBtns[k] = button(`${SURFACES[k].name} (${SURFACES[k].f} N)`, () => { surface = k; reset(); });
  }
  const sP = slider({ label: "Pip's push", min: 0, max: 200, step: 10, value: P, unit: 'N', onInput: (v) => { P = v; reset(); } });
  el.append(controls(...Object.values(surfBtns)), controls(sP.el), controls(button('▶ Push for 2 s, then let go', () => go(), 'green')), ro.el);

  const f = () => SURFACES[surface].f;
  const moves = () => P > f();
  const aPush = () => (moves() ? (P - f()) / m : 0);
  const dec = () => f() / m;
  let t = 0, running = false, result = null, x = 0, v = 0, cam = 0, letGo = null;

  function reset() {
    t = 0; running = false; result = null; x = 0; v = 0; cam = 0; letGo = null;
    for (const [k, b] of Object.entries(surfBtns)) b.classList.toggle('green', k === surface);
    show();
  }
  function go() {
    reset();
    running = true;
    sfx.click();
  }

  function show() {
    const rows = [['Surface', `${SURFACES[surface].name}: friction up to ${f()} N`], ['Crate mass', `${m} kg`], ['Push', `${P} N`]];
    if (result && !result.moved) {
      rows.push(['Friction right now', `${P} N (as big as the push)`]);
      rows.push(['Resultant', `${P} − ${P} = 0 N → it doesn't move!`, 'winner']);
    } else if (result) {
      rows.push(['While pushing', `(${P} − ${f()}) ÷ ${m} = ${fmt(result.a, 2)} m/s²`, 'winner']);
      rows.push(['After letting go', `friction slows it: ${f()} ÷ ${m} = ${fmt(dec(), 2)} m/s²`]);
      rows.push(['Total slide', `${fmt(result.dist, 1)} m`]);
    } else rows.push(['Acceleration', 'work it out, then test it!']);
    ro.set(rows);
    if (!result) {
      tasks.showCurrent();
      if (tasks.finished) banner.set('Free play: compare the surfaces!', true);
    }
  }

  function finish() {
    running = false;
    result = { moved: moves(), a: aPush(), dist: x };
    show();
    const out = tasks.attempt({ surface, push: P, a: moves() ? Math.round(aPush() * 1000) / 1000 : null, moved: moves() });
    const what = moves() ? `It sped up at ${fmt(aPush(), 2)} m/s² while Pip pushed.` : `It didn't move: friction pushed back with ${P} N.`;
    if (out === 'next') banner.set(`Yes! ${what} Next — ${tasks.text()}`, true);
    else if (out === 'miss') {
      sfx.wrong();
      banner.set(`${what} ${tasks.text()}`);
    }
  }

  let alive = true;
  const stop = loop((dt, now) => {
    if (!alive) return;
    if (running) {
      if (!moves()) {
        t += dt;
        if (t >= PUSH_T) finish();
      } else if (t < PUSH_T) {
        const step = Math.min(dt, PUSH_T - t);
        t += step;
        v = aPush() * t;
        x = 0.5 * aPush() * t * t;
        if (t >= PUSH_T) letGo = x;
      } else {
        // sliding: speed things up for long ice slides so they finish in a few seconds
        const speedUp = Math.max(1, v / dec() / 3);
        const d = dt * speedUp;
        const nv = Math.max(0, v - dec() * d);
        x += ((v + nv) / 2) * d;
        v = nv;
        t += d;
        if (v <= 0) finish();
      }
    }
    // camera follows the crate once it gets near the right side
    cam = Math.max(0, x * PX - (W * 0.55));
    const { ctx } = st;
    sky(ctx, W, H);
    drawFloor(ctx, surface, FLOOR, W, H - FLOOR, cam);
    // distance markers every 5 m (10 m when the slide is long)
    const every = x > 60 ? 10 : 5;
    const first = Math.floor(cam / PX / every) * every;
    for (let mk = first; mk * PX - cam < W + 20; mk += every) {
      const sx = 40 + mk * PX - cam;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(sx), FLOOR, 2, 8);
      tag(ctx, `${mk} m`, sx, H - 8, { size: 10 });
    }
    const crateX = 40 + x * PX - cam;
    const size = 40;
    // Pip: pushes, then stays where he let go
    const pipX = (letGo == null ? crateX : 40 + letGo * PX - cam) - 14;
    drawSprite(ctx, 'hero', pipX, FLOOR + 2, 3);
    drawCrate(ctx, crateX, FLOOR + 1, size);
    const pushing = running && t < PUSH_T;
    const shake = pushing && !moves() ? Math.sin(now * 60) * 0.8 : 0;
    if ((pushing || !running) && P > 0 && letGo == null) {
      arrow(ctx, crateX - 4, FLOOR - 50 + shake, crateX - 4 + Math.max(14, P * 0.35), FLOOR - 50 + shake, '#ff9b3d', 5);
      tag(ctx, `push ${P} N`, crateX + Math.max(14, P * 0.35) / 2, FLOOR - 60, { size: 11, color: '#ffd2a6' });
    }
    // friction arrow at the bottom of the crate, against the (attempted) motion
    const fNow = running ? (moves() ? f() : P) : result && !result.moved ? P : 0;
    if (fNow > 0) {
      arrow(ctx, crateX + size / 2, FLOOR - 6, crateX + size / 2 - Math.max(14, fNow * 0.35), FLOOR - 6, '#ff5050', 5);
      tag(ctx, `friction ${fNow} N`, crateX + size / 2 - Math.max(14, fNow * 0.35) / 2, FLOOR + 22, { size: 10, color: '#ffb0b0' });
    }
    tag(ctx, `${fmt(v, 1)} m/s`, crateX + size / 2, 24, { size: 11, color: '#fcee4b' });
    // the value the tasks ask about, on the canvas so it is always on screen
    if (result) tag(ctx, result.moved ? `while pushing: a = ${fmt(result.a, 2)} m/s²` : `friction = ${P} N, a = 0`, W / 2, 50, { size: 13, color: '#fcee4b' });
    if (running) tag(ctx, pushing ? 'pushing...' : 'sliding — only friction acts', 90, 20, { size: 11, color: pushing ? '#ff9b3d' : '#4aedd9' });
  });

  reset();
  return () => {
    alive = false;
    stop();
  };
}
