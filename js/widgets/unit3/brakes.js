// Braking test track: a car at speed u brakes with deceleration b until it stops.
// Shows the backwards acceleration arrow, the speed each second, the time to stop and the
// braking distance; earlier stops stay marked so distances can be compared (speed ×2 → ×4).
// params: { u, b, tasks: [{ text, check({ u, b, time, dist }), test? }] }

import { makeStage, loop, sky, tag, arrow, ruler, slider, button, controls, readout, taskBanner } from '../stage.js';
import { fmt } from '../../core/util.js';
import { sfx } from '../../core/sound.js';
import { drawRoad, drawCar, taskRunner } from './common.js';

export default function brakes(el, params = {}, api) {
  const p = { u: params.u ?? 20, b: params.b ?? 4 };
  const W = 480, H = 200, ROAD = 120, X0 = 40;
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const ro = readout();
  let clock = 0, running = false, done = null, log = [];
  let view = 60; // metres shown across the track
  const marks = []; // earlier stops: { x, label }
  const tasks = taskRunner(params.tasks || [], banner, api, {
    intro: 'Then press <b>Brake!</b>',
    describe: (r) => `from ${fmt(r.u)} m/s it stopped in ${fmt(r.time, 2)} s and ${fmt(r.dist, 2)} m`,
  });
  if (!(params.tasks || []).length) banner.set('Choose a speed and the brakes, then press <b>Brake!</b>');

  const T = () => p.u / p.b;
  const S = () => (p.u * p.u) / (2 * p.b);
  const vNow = () => Math.max(0, p.u - p.b * clock);
  const xNow = () => p.u * clock - 0.5 * p.b * clock * clock;

  const reset = () => {
    clock = 0; running = false; done = null; log = [];
    show();
  };
  const su = slider({ label: 'Speed u', min: 5, max: 30, step: 1, value: p.u, unit: 'm/s', onInput: (v) => { p.u = v; reset(); } });
  const sb = slider({ label: 'Brakes: deceleration', min: 1, max: 8, step: 0.5, value: p.b, unit: 'm/s²', onInput: (v) => { p.b = v; reset(); } });
  const go = button('▶ Brake!', () => {
    clock = 0; done = null; log = [p.u]; running = true;
    // A planning task keeps the track fixed around its flag, so the zoom doesn't give the distance away.
    const target = tasks.current()?.target;
    const far = tasks.planning && target ? target * 1.3 : S();
    view = Math.max(60, Math.ceil((Math.max(far, ...marks.map((m) => m.x)) * 1.15) / 10) * 10);
    hidden = false;
    sfx.click();
    show();
  }, 'green');
  el.append(controls(su.el, sb.el), controls(go), ro.el);

  let hidden = false; // the exact result of a missed planning task stays secret
  function show() {
    ro.set([
      ['Acceleration (forward is +)', `a = −${fmt(p.b)} m/s²: it loses ${fmt(p.b)} m/s every second`],
      log.length && !hidden && !(tasks.planning && running) && ['Speed at each second', `${log.map((v) => fmt(v, 2)).join(' → ')} m/s`],
      done && ['Time to stop', hidden ? '?' : `${fmt(done.time, 2)} s`, 'winner'],
      done && ['Braking distance', hidden ? '? (work it out!)' : `${fmt(done.dist, 2)} m`, 'winner'],
    ]);
  }

  const stop = loop((dt, now) => {
    if (running) {
      const rate = Math.max(1, T() / 5);
      const before = Math.floor(clock + 1e-9);
      clock = Math.min(T(), clock + dt * rate);
      if (Math.floor(clock + 1e-9) > before && clock < T() - 1e-9) {
        for (let k = before + 1; k <= Math.floor(clock + 1e-9); k++) log.push(p.u - p.b * k);
        sfx.click();
        show();
      }
      if (clock >= T() - 1e-9) {
        running = false;
        log.push(0);
        done = { u: p.u, b: p.b, time: T(), dist: S() };
        const planning = tasks.planning;
        const ok = tasks.run(done);
        hidden = planning && !ok;
        marks.push({ x: S(), label: hidden ? `${fmt(p.u)} m/s, ${fmt(p.b)} m/s²` : `${fmt(p.u)} m/s → ${fmt(S(), 2)} m` });
        if (marks.length > 3) marks.shift();
        show();
      }
    }
    const { ctx } = st;
    const xOf = (m) => X0 + (m / view) * (W - X0 - 30);
    sky(ctx, W, ROAD);
    drawRoad(ctx, W, ROAD, 26, 0);
    ruler(ctx, xOf, ROAD + 30, 0, view, view > 100 ? 10 : 5, view > 200 ? 50 : view > 100 ? 20 : 10);
    // start line where the brakes go on
    ctx.fillStyle = '#fcee4b';
    ctx.fillRect(Math.round(xOf(0)) - 1, ROAD, 3, 26);
    tag(ctx, 'brakes on', xOf(0), ROAD - 46, { size: 10, color: '#fcee4b' });
    // the flag of a planning task
    const flagAt = tasks.planning ? tasks.current()?.target : null;
    if (flagAt) {
      const fx = xOf(flagAt);
      ctx.fillStyle = '#fff';
      ctx.fillRect(Math.round(fx), ROAD - 30, 2, 56);
      ctx.fillStyle = '#e03030';
      ctx.fillRect(Math.round(fx) + 2, ROAD - 30, 12, 8);
      tag(ctx, `flag ${flagAt} m`, fx, ROAD - 36, { size: 10, color: '#fcee4b' });
    }
    // earlier stops
    marks.forEach((m, i) => {
      const x = xOf(m.x);
      ctx.fillStyle = i === marks.length - 1 && done ? '#80ff20' : 'rgba(255,255,255,0.7)';
      ctx.fillRect(Math.round(x), ROAD - 8, 2, 34);
      tag(ctx, m.label, x, ROAD - 12 - (marks.length - 1 - i) * 16 - 34, { size: 9, color: i === marks.length - 1 && done ? '#80ff20' : '#ddd' });
    });
    const x = running || done ? xNow() : 0;
    // skid marks
    if (x > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(xOf(0), ROAD + 20, xOf(x) - xOf(0), 3);
    }
    const carX = Math.min(xOf(x), W - 4) - 18;
    drawCar(ctx, carX, ROAD, 2.5, running ? Math.sin(now * 30) * 0.5 : 0);
    if (running || !done) {
      // velocity arrow (forward) and acceleration arrow (backwards)
      const v = vNow();
      if (v > 0) arrow(ctx, carX + 22, ROAD - 26, carX + 22 + Math.max(8, v * 2.2), ROAD - 26, '#80ff20', 3);
      arrow(ctx, carX - 20, ROAD - 12, carX - 20 - p.b * 5, ROAD - 12, '#ff6b6b', 3);
      if (!tasks.planning || !running) tag(ctx, `v = ${fmt(v, 1)} m/s`, carX + 30, ROAD - 34, { size: 10, color: '#80ff20', align: 'left' });
      tag(ctx, `a = −${fmt(p.b)}`, carX - 22, ROAD - 18, { size: 10, color: '#ff6b6b', align: 'right' });
    }
    if (!hidden && !(tasks.planning && running)) tag(ctx, `t = ${fmt(clock, 1)} s`, W - 40, 18, { size: 12 });
  });

  show();
  return stop;
}
