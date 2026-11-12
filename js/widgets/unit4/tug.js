// Tug-of-war: forces along a line. Resultant = (total right) − (total left); + is right.
// params: { left: [{ sprite, name, f }], right: [{ sprite, name, f }], pip, tasks: [{ text, check(res, pip), tested? }] }

import { makeStage, loop, sky, ground, tag, arrow, slider, button, controls, readout, taskBanner } from '../stage.js';
import { drawSprite } from '../../core/sprites.js';
import { sfx } from '../../core/sound.js';
import { taskRunner } from './common.js';

const resText = (res) => (res === 0 ? '0 N — balanced!' : `${Math.abs(res)} N to the ${res > 0 ? 'right' : 'left'}`);

export default function tug(el, params = {}, api) {
  const left = params.left || [{ sprite: 'u4zombie', name: 'Zombie', f: 120 }, { sprite: 'u4zombie', name: 'Zombie', f: 90 }, { sprite: 'u4golem', name: 'Golem', f: 150 }];
  const right = params.right || [{ sprite: 'friend', name: 'Alex', f: 160 }];
  let pip = params.pip ?? 150;
  const W = 480, H = 226, GROUND = 196, ROPE = 168, MID = 240;
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const ro = readout();
  const tasks = taskRunner(params.tasks || [], banner, api, { allDone: 'Tug-of-war mastered! You can find any resultant force. 🎉' });
  const sl = slider({ label: "Pip's pull", min: 0, max: 300, step: 10, value: pip, unit: 'N', onInput: (v) => { pip = v; reset(); } });
  el.append(controls(sl.el), controls(button('▶ Pull!', () => { reset(); running = true; sfx.click(); }, 'green')), ro.el);

  const totL = left.reduce((s, p) => s + p.f, 0);
  const totR = () => right.reduce((s, p) => s + p.f, 0) + pip;
  let t = 0, running = false, shift = 0, vel = 0, result = null;

  function reset() {
    t = 0; running = false; shift = 0; vel = 0; result = null;
    show();
  }

  function show() {
    const rightList = [...right.map((p) => `${p.f}`), `${pip}`].join(' + ');
    ro.set(result ? [
      ['Right team', `${rightList} = ${totR()} N`],
      ['Left team', `${left.map((p) => p.f).join(' + ')} = ${totL} N`],
      ['Resultant (+ right, − left)', `${totR()} − ${totL} = ${resText(result.res)}`, 'winner'],
    ] : [
      ['Right team', `${right.map((p) => `${p.name} ${p.f} N`).join(', ')}, Pip ${pip} N`],
      ['Left team', left.map((p) => `${p.name} ${p.f} N`).join(', ')],
      ['Resultant', 'work it out, then press Pull!'],
    ]);
    if (!result) tasks.showCurrent();
    if (!result && tasks.finished) banner.set('Try any pull you like — can you predict where the rope goes?', true);
  }

  const leftX = left.map((_, i) => 64 + i * 56);
  const rightX = [...right.map((_, i) => 330 + i * 56), 330 + right.length * 56];

  let alive = true;
  const stop = loop((dt, now) => {
    if (!alive) return;
    const res = totR() - totL;
    if (running) {
      t += dt;
      vel += res * 0.35 * dt;
      shift = Math.max(-36, Math.min(36, shift + vel * dt));
      if (t >= 2.2) {
        running = false;
        result = { res };
        show();
        const out = tasks.attempt(res, pip);
        if (out === 'next') banner.set(`Yes! Resultant ${resText(res)}. Next — ${tasks.text()}`, true);
        else if (out === 'miss') {
          sfx.wrong();
          banner.set(`The resultant was ${resText(res)}. ${tasks.text()}`);
        }
      }
    }
    const { ctx } = st;
    sky(ctx, W, H);
    ground(ctx, GROUND, W, 22, H - GROUND);
    // start line
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(MID - 1, GROUND - 4, 3, 10);
    // rope
    const sx = shift;
    ctx.strokeStyle = '#c8a26b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(leftX[0] - 20 + sx, ROPE);
    ctx.lineTo(rightX[rightX.length - 1] + 20 + sx, ROPE);
    ctx.stroke();
    // ribbon on the middle of the rope
    ctx.fillStyle = '#e03030';
    ctx.fillRect(MID - 3 + sx, ROPE - 2, 6, 16);
    // pullers, each with its force arrow and value
    const lean = running ? Math.sin(now * 18) * 1 : 0;
    const drawTeam = (team, xs, dir) => team.forEach((p, i) => {
      const x = xs[i] + sx;
      drawSprite(ctx, p.sprite, x, GROUND + lean, 3, { flip: dir > 0 });
      const len = Math.min(48, 8 + p.f * 0.13);
      arrow(ctx, x, 100, x + dir * len, 100, dir > 0 ? '#ff9b3d' : '#80ff20', 4);
      tag(ctx, `${p.f} N`, x, 126, { size: 11, color: dir > 0 ? '#ffd2a6' : '#c8ff9a' });
    });
    drawTeam(left, leftX, -1);
    drawTeam([...right, { sprite: 'hero', name: 'Pip', f: pip }], rightX, 1);
    tag(ctx, 'Pip', rightX[rightX.length - 1] + sx, 84, { size: 10, color: '#fcee4b' });
    // resultant after the pull
    if (result) {
      if (result.res === 0) tag(ctx, 'Resultant 0 N — balanced!', MID, 40, { size: 13, color: '#fcee4b' });
      else {
        const len = Math.max(20, Math.min(170, Math.abs(result.res) * 0.8));
        arrow(ctx, MID + sx, 54, MID + sx + Math.sign(result.res) * len, 54, '#fcee4b', 7);
        tag(ctx, `Resultant ${resText(result.res)}`, MID + sx + (Math.sign(result.res) * len) / 2, 36, { size: 12, color: '#fcee4b' });
      }
    }
  });

  show();
  return () => {
    alive = false;
    stop();
  };
}
