// Two-leg journey: average speed = total distance ÷ total time (not the average of the speeds!).
// params: { d1, s1, d2, s2, unitD: 'km', unitT: 'h', vehicle }

import { makeStage, loop, sky, ground, tag, slider, button, controls, readout } from './stage.js';
import { drawSprite } from '../core/sprites.js';
import { fmt } from '../core/util.js';
import { sfx } from '../core/sound.js';

export default function journey(el, params, api) {
  const p = { d1: 3, s1: 6, d2: 3, s2: 2, ...params };
  const uD = p.unitD || 'km', uT = p.unitT || 'h', uS = `${uD}/${uT}`;
  const W = 480, H = 150;
  const st = makeStage(el, W, H);
  const ro = readout();
  let t = 0, running = false, ran = false;

  const mk = (key, label, min, max, unit) => slider({
    label, min, max, step: 1, value: p[key], unit,
    onInput: (v) => { p[key] = v; t = 0; running = false; show(); },
  });
  el.append(
    controls(mk('d1', 'Leg 1 distance', 1, 12, uD), mk('s1', 'Leg 1 speed', 1, 12, uS)),
    controls(mk('d2', 'Leg 2 distance', 1, 12, uD), mk('s2', 'Leg 2 speed', 1, 12, uS)),
    controls(button('▶ Go!', () => { t = 0; running = true; sfx.click(); }, 'green')),
    ro.el,
  );

  const t1 = () => p.d1 / p.s1;
  const t2 = () => p.d2 / p.s2;

  function show() {
    const T = t1() + t2();
    const D = p.d1 + p.d2;
    const done = t >= T - 1e-9;
    ro.set([
      ['Leg 1 time', `${fmt(p.d1)} ÷ ${fmt(p.s1)} = ${fmt(t1(), 3)} ${uT}`],
      ['Leg 2 time', `${fmt(p.d2)} ÷ ${fmt(p.s2)} = ${fmt(t2(), 3)} ${uT}`],
      ['Total', `${fmt(D)} ${uD} in ${fmt(T, 3)} ${uT}`],
      done && ['Average speed = total distance ÷ total time', `${fmt(D / T, 3)} ${uS}`, 'winner'],
      done && ['Average of the two speeds (the trap!)', `${fmt((p.s1 + p.s2) / 2, 3)} ${uS}`, 'trap'],
    ]);
  }

  const stop = loop((dt, now) => {
    const T = t1() + t2();
    if (running) {
      t += dt * (T / 5);
      if (t >= T) {
        t = T;
        running = false;
        if (!ran) {
          ran = true;
          api.done();
        }
        sfx.complete();
      }
      show();
    }
    const { ctx } = st;
    sky(ctx, W, H);
    ground(ctx, 110, W, 20, 40);
    const D = p.d1 + p.d2;
    const xOf = (d) => 30 + (d / D) * (W - 60);
    // leg markers
    ctx.fillStyle = '#e03030';
    ctx.fillRect(xOf(0), 100, 3, 10);
    ctx.fillStyle = '#fcee4b';
    ctx.fillRect(xOf(p.d1), 96, 3, 14);
    ctx.fillStyle = '#e03030';
    ctx.fillRect(xOf(D), 100, 3, 10);
    tag(ctx, `Leg 1: ${p.d1} ${uD} @ ${p.s1} ${uS}`, (xOf(0) + xOf(p.d1)) / 2, 135, { size: 10 });
    tag(ctx, `Leg 2: ${p.d2} ${uD} @ ${p.s2} ${uS}`, (xOf(p.d1) + xOf(D)) / 2, 135, { size: 10 });
    const pos = t <= t1() ? p.s1 * t : p.d1 + p.s2 * (t - t1());
    const bob = running ? Math.sin(now * 16) * 1.2 : 0;
    drawSprite(ctx, p.vehicle || 'hero', xOf(Math.min(pos, D)), 111 + bob, p.vehicle ? 3 : 3);
    tag(ctx, `time: ${fmt(t, 2)} ${uT}`, W - 60, 18);
  });

  show();
  return stop;
}
