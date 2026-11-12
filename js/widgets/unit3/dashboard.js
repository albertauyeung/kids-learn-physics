// Car dashboard: choose a starting speed u, an acceleration a and a time t, then drive.
// The speedometer ticks up by a every second; the log lists the speed at each second.
// params: { u, a, t, tasks: [{ text, check({ u, a, t, v }), test? }] }

import { makeStage, loop, sky, tag, slider, button, controls, readout, taskBanner } from '../stage.js';
import { fmt } from '../../core/util.js';
import { sfx } from '../../core/sound.js';
import { drawRoad, drawCar, distancePosts, speedo, taskRunner } from './common.js';

export default function dashboard(el, params = {}, api) {
  const p = { u: params.u ?? 0, a: params.a ?? 2, t: params.t ?? 5 };
  const W = 480, H = 220, ROAD = 150, CAR_X = 120, PX_PER_M = 3;
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const ro = readout();
  let clock = 0, dist = 0, running = false, log = [], lastRun = null;
  const tasks = taskRunner(params.tasks || [], banner, api, {
    intro: 'Then press <b>Drive</b>.',
    describe: (r) => `you went from ${fmt(r.u)} to ${fmt(r.v)} m/s in ${r.t} s`,
  });
  if (!(params.tasks || []).length) banner.set('Set the sliders, then press <b>Drive</b> and watch the speedometer.');

  const reset = () => {
    clock = 0; dist = 0; running = false; log = []; lastRun = null;
    show();
  };
  const su = slider({ label: 'Start speed u', min: 0, max: 20, step: 1, value: p.u, unit: 'm/s', onInput: (v) => { p.u = v; reset(); } });
  const sa = slider({ label: 'Acceleration a', min: 0, max: 5, step: 0.5, value: p.a, unit: 'm/s²', onInput: (v) => { p.a = v; reset(); } });
  const stt = slider({ label: 'Time t', min: 1, max: 10, step: 1, value: p.t, unit: 's', onInput: (v) => { p.t = v; reset(); } });
  const go = button('▶ Drive', () => {
    clock = 0; dist = 0; log = [p.u]; lastRun = null; running = true;
    sfx.click();
    show();
  }, 'green');
  el.append(controls(su.el, sa.el, stt.el), controls(go), ro.el);

  const speed = () => p.u + p.a * clock;

  function show() {
    ro.set([
      ['Speed at each second', log.length ? `${log.map((v) => fmt(v)).join(' → ')} m/s` : 'press Drive'],
      log.length > 1 && ['Speed gained each second', `+${fmt(p.a)} m/s`],
      lastRun && ['After ' + lastRun.t + ' s', `${fmt(lastRun.v)} m/s`, 'winner'],
    ]);
  }

  const stop = loop((dt, now) => {
    if (running) {
      const step = dt * 1.4;
      const next = Math.min(p.t, clock + step);
      dist += (p.u + p.a * (clock + next) / 2) * (next - clock);
      const before = Math.floor(clock + 1e-9);
      clock = next;
      if (Math.floor(clock + 1e-9) > before) {
        log.push(p.u + p.a * Math.floor(clock + 1e-9));
        sfx.click();
        show();
      }
      if (clock >= p.t - 1e-9) {
        running = false;
        lastRun = { u: p.u, a: p.a, t: p.t, v: p.u + p.a * p.t };
        show();
        tasks.run(lastRun);
      }
    }
    const { ctx } = st;
    sky(ctx, W, ROAD);
    // hills scroll slowly for a feeling of speed
    ctx.fillStyle = '#6aa84f';
    const hOff = (dist * 0.6) % 160;
    for (let x = -hOff - 160; x < W + 160; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, ROAD - 4);
      ctx.quadraticCurveTo(x + 80, ROAD - 60, x + 160, ROAD - 4);
      ctx.fill();
    }
    drawRoad(ctx, W, ROAD, 26, dist * PX_PER_M);
    const xOf = (m) => CAR_X + (m - dist) * PX_PER_M;
    distancePosts(ctx, xOf, ROAD - 4, Math.max(0, dist - 60), dist + 140, 10, W, 50, ROAD + 48);
    const bob = running ? Math.sin(now * 30) * 0.6 : 0;
    drawCar(ctx, CAR_X, ROAD, 3, bob);
    speedo(ctx, 405, 60, 50, speed(), 80);
    tag(ctx, `t = ${fmt(clock, 1)} s`, 8, 20, { size: 12, align: 'left' });
    tag(ctx, `distance ${fmt(dist, 0)} m`, 8, 42, { size: 11, align: 'left' });
  });

  show();
  return stop;
}
