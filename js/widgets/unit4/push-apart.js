// Skater push-off: Newton's 3rd law. Equal and opposite forces on DIFFERENT skaters;
// the push lasts 1 s, so each glides away at v = (F ÷ m) × 1 s.
// params: { mA, mB, F, tasks: [{ text, check(state), tested? }] }, state = { mA, mB, F, vA, vB }

import { makeStage, loop, sky, tag, arrow, slider, button, controls, readout, taskBanner } from '../stage.js';
import { drawSprite } from '../../core/sprites.js';
import { fmt } from '../../core/util.js';
import { sfx } from '../../core/sound.js';
import { drawFloor, taskRunner } from './common.js';

export default function pushApart(el, params = {}, api) {
  let mA = params.mA ?? 40, mB = params.mB ?? 80, F = params.F ?? 120;
  const W = 480, H = 220, FLOOR = 170, MID = 240, PX = 9, PUSH_T = 1, EDGE = 22;
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const ro = readout();
  const tasks = taskRunner(params.tasks || [], banner, api, { allDone: 'Action and reaction mastered! Same force, but a = F ÷ m. 🎉' });
  const sA = slider({ label: "Pip's mass", min: 20, max: 90, step: 10, value: mA, unit: 'kg', onInput: (v) => { mA = v; reset(); } });
  const sB = slider({ label: "Steve's mass", min: 20, max: 90, step: 10, value: mB, unit: 'kg', onInput: (v) => { mB = v; reset(); } });
  const sF = slider({ label: 'Push (lasts 1 s)', min: 20, max: 300, step: 20, value: F, unit: 'N', onInput: (v) => { F = v; reset(); } });
  el.append(controls(sA.el, sB.el, sF.el), controls(button('▶ Push apart!', () => go(), 'green')), ro.el);

  let t = 0, running = false, result = null;
  const aA = () => F / mA, aB = () => F / mB;
  const disp = (a, tt) => (tt <= PUSH_T ? 0.5 * a * tt * tt : 0.5 * a * PUSH_T * PUSH_T + a * PUSH_T * (tt - PUSH_T));

  function reset() {
    t = 0; running = false; result = null;
    show();
  }
  function go() {
    reset();
    running = true;
    sfx.click();
  }

  function show() {
    if (result) {
      ro.set([
        ['Force on Pip (from Steve)', `${F} N ←`],
        ['Force on Steve (from Pip)', `${F} N →`],
        ['Pip: a = F ÷ m', `${F} ÷ ${mA} = ${fmt(aA(), 2)} m/s² → glides at ${fmt(aA() * PUSH_T, 2)} m/s`, 'winner'],
        ['Steve: a = F ÷ m', `${F} ÷ ${mB} = ${fmt(aB(), 2)} m/s² → glides at ${fmt(aB() * PUSH_T, 2)} m/s`, 'winner'],
      ]);
    } else {
      ro.set([['Pip', `${mA} kg`], ['Steve', `${mB} kg`], ['Push', `${F} N for 1 s`], ['Speeds', 'press Push apart! to find out']]);
      tasks.showCurrent();
      if (tasks.finished) banner.set('Free play: try a really light skater against a heavy one!', true);
    }
  }

  let alive = true;
  const stop = loop((dt) => {
    if (!alive) return;
    if (running) {
      t += dt;
      const far = Math.max(disp(aA(), t), disp(aB(), t));
      if (t >= PUSH_T && (far >= EDGE || t >= 4)) {
        running = false;
        result = { vA: aA() * PUSH_T, vB: aB() * PUSH_T };
        show();
        const out = tasks.attempt({ mA, mB, F, vA: aA() * PUSH_T, vB: aB() * PUSH_T });
        const what = `Pip ${fmt(aA(), 2)} m/s, Steve ${fmt(aB(), 2)} m/s.`;
        if (out === 'next') banner.set(`Yes! Same ${F} N force on each — speeds: ${what} Next — ${tasks.text()}`, true);
        else if (out === 'miss') {
          sfx.wrong();
          banner.set(`Speeds: ${what} ${tasks.text()}`);
        }
      }
    }
    const tt = running || result ? t : 0;
    const xA = MID - 20 - Math.min(EDGE, disp(aA(), tt)) * PX;
    const xB = MID + 22 + Math.min(EDGE, disp(aB(), tt)) * PX;
    const { ctx } = st;
    sky(ctx, W, H);
    drawFloor(ctx, 'ice', FLOOR, W, H - FLOOR, 0);
    ctx.fillStyle = '#e03030';
    ctx.fillRect(MID - 1, FLOOR, 3, H - FLOOR);
    const scale = (mm) => 1.6 + mm / 45;
    drawSprite(ctx, 'hero', xA, FLOOR + 2, scale(mA));
    drawSprite(ctx, 'friend', xB, FLOOR + 2, scale(mB));
    tag(ctx, `Pip ${mA} kg`, xA + 10, H - 12, { size: 10, color: '#fcee4b', align: 'right' });
    tag(ctx, `Steve ${mB} kg`, xB - 10, H - 12, { size: 10, color: '#80ff20', align: 'left' });
    const pushing = running && t < PUSH_T;
    if (pushing || (!running && !result)) {
      // the action–reaction pair: equal arrows, each drawn on the skater it acts on
      const len = Math.max(16, F * 0.25);
      const eA = xA - 4 * scale(mA), eB = xB + 4 * scale(mB);
      arrow(ctx, eA, FLOOR - 40, eA - len, FLOOR - 40, '#ff9b3d', 5);
      arrow(ctx, eB, FLOOR - 40, eB + len, FLOOR - 40, '#ff9b3d', 5);
      tag(ctx, `${F} N on Pip`, eA - len / 2 - 6, 44, { size: 10, color: '#ffd2a6' });
      tag(ctx, `${F} N on Steve`, eB + len / 2 + 6, 44, { size: 10, color: '#ffd2a6' });
    } else {
      tag(ctx, `${fmt(aA() * PUSH_T, 2)} m/s`, xA, 30, { size: 11, color: '#fcee4b' });
      tag(ctx, `${fmt(aB() * PUSH_T, 2)} m/s`, xB, 30, { size: 11, color: '#80ff20' });
    }
  });

  show();
  return () => {
    alive = false;
    stop();
  };
}
