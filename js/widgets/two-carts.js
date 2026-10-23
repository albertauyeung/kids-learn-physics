// Two minecarts on one track. Meet mode: they drive towards each other (closing speed = v1 + v2).
// Chase mode: B starts ahead, A catches up (closing speed = v1 − v2).
// params: { mode: 'meet' | 'chase', distance, gap, flag, v1, v2, length }

import { makeStage, loop, sky, ground, ruler, tag, slider, button, controls, readout, taskBanner } from './stage.js';
import { drawSprite, drawTexture } from '../core/sprites.js';
import { fmt } from '../core/util.js';
import { sfx } from '../core/sound.js';

export default function twoCarts(el, params = {}, api) {
  const mode = params.mode || 'meet';
  const L = params.length || (mode === 'meet' ? params.distance || 60 : 80);
  const startB = mode === 'meet' ? params.distance || 60 : params.gap || 20;
  const flag = params.flag;
  let v1 = params.v1 || 3, v2 = params.v2 || 2;
  const W = 480, H = 170;
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const xOf = (m) => 24 + (m / L) * (W - 48);
  const ro = readout();
  let t = 0, running = false, met = null;

  const s1 = slider({ label: 'Cart A speed', min: 1, max: 10, step: 1, value: v1, unit: 'm/s', onInput: (v) => { v1 = v; reset(); } });
  const s2 = slider({ label: 'Cart B speed', min: 1, max: 10, step: 1, value: v2, unit: 'm/s', onInput: (v) => { v2 = v; reset(); } });
  el.append(controls(s1.el, s2.el), controls(button('▶ Go!', () => { reset(); running = true; sfx.click(); }, 'green')), ro.el);

  const closing = () => (mode === 'meet' ? v1 + v2 : v1 - v2);
  const posA = (tt) => v1 * tt;
  const posB = (tt) => (mode === 'meet' ? startB - v2 * tt : startB + v2 * tt);

  function reset() {
    t = 0; running = false; met = null;
    show();
  }

  function show() {
    const c = closing();
    ro.set([
      ['Gap at the start', `${fmt(startB)} m`],
      ['Closing speed', mode === 'meet' ? `${v1} + ${v2} = ${c} m/s` : `${v1} − ${v2} = ${c} m/s`],
      c > 0 ? ['Time to meet = gap ÷ closing speed', `${fmt(startB)} ÷ ${c} = ${fmt(startB / c, 2)} s`] : ['Time to meet', 'never! (A is not faster)'],
      met && ['They met at', `${fmt(met.x, 2)} m from A's start`, 'winner'],
    ]);
    const goal = flag != null
      ? `Choose speeds so the carts ${mode === 'meet' ? 'meet' : 'catch up'} exactly at the <b>flag (${flag} m)</b>.`
      : `Press Go and watch the carts ${mode === 'meet' ? 'meet' : 'catch up'}.`;
    if (!met) banner.set(goal);
  }

  const stop = loop((dt, now) => {
    if (running) {
      t += dt * 2;
      const c = closing();
      const tMeet = c > 0 ? startB / c : Infinity;
      if (t >= tMeet) {
        t = tMeet;
        running = false;
        met = { x: posA(t), t };
        sfx.boom();
        show();
        if (flag == null) {
          banner.set(`They met after ${fmt(t, 2)} s at ${fmt(met.x, 2)} m.`, true);
          api.done();
        } else if (Math.abs(met.x - flag) < 0.01) {
          banner.set(`Bullseye! They met right at the flag after ${fmt(t, 2)} s. 🎯`, true);
          sfx.correct();
          api.done();
        } else {
          banner.set(`They met at ${fmt(met.x, 2)} m — the flag is at ${flag} m. Think: what fraction of the gap does A cover?`);
        }
      } else if (posA(t) > L || posB(t) > L) {
        running = false;
        banner.set(closing() > 0
          ? 'The track ran out before A caught B! A is faster, but only a little — try a bigger difference in speed.'
          : 'Cart A never caught up! It needs to be faster than cart B.');
      }
    }
    const { ctx } = st;
    sky(ctx, W, H);
    ground(ctx, 120, W, 20, 60);
    for (let x = 0; x < W; x += 16) drawTexture(ctx, 'rail', x, 106, 16);
    ruler(ctx, xOf, 130, 0, L, 5, mode === 'meet' && L <= 60 ? 10 : 20);
    if (flag != null) drawSprite(ctx, 'flag', xOf(flag) + 6, 106, 2);
    const bob = running ? Math.sin(now * 25) * 0.8 : 0;
    drawSprite(ctx, 'hero', xOf(Math.min(L, posA(t))), 100 + bob, 1.5);
    drawSprite(ctx, 'minecart', xOf(Math.min(L, posA(t))), 114 + bob, 3);
    drawSprite(ctx, 'friend', xOf(Math.min(L, posB(t))), 100 + bob, 1.5);
    drawSprite(ctx, 'minecart', xOf(Math.min(L, posB(t))), 114 + bob, 3);
    tag(ctx, 'A', xOf(Math.min(L, posA(t))), 70, { color: '#ff9b3d' });
    tag(ctx, 'B', xOf(Math.min(L, posB(t))), 70, { color: '#80ff20' });
    tag(ctx, `t = ${fmt(t, 1)} s`, W - 40, 18);
  });

  show();
  return stop;
}
