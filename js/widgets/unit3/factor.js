// Factor Finder: a car at u m/s accelerates at 2 m/s², so s = ut + t². To find when it has
// gone s metres, factorise t² + ut − s = 0: pick two numbers that multiply to −s and add to u,
// then choose the root that makes sense (time can't be negative). The car then drives it.
// params: { problems: [{ u, s }] } — every problem must have whole-number roots.

import { makeStage, loop, sky, text, tag, slider, button, controls, readout, taskBanner } from '../stage.js';
import { h, fmt } from '../../core/util.js';
import { sfx } from '../../core/sound.js';
import { drawRoad, drawCar } from './common.js';

const sgn = (n) => (n < 0 ? `− ${-n}` : `+ ${n}`);
const par = (n) => (n < 0 ? `(${fmt(n)})` : fmt(n));

export default function factor(el, params = {}, api) {
  const problems = params.problems || [{ u: 4, s: 21 }, { u: 2, s: 15 }, { u: 6, s: 16 }];
  const W = 480, H = 200, ROAD = 150;
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const ro = readout();
  let k = 0, p = 1, q = 1;
  let stage = 'factor'; // 'factor' → 'root' → 'drive' → 'solved'
  let clock = 0, root = 0;
  let alive = true;
  let timer = null;

  const sp = slider({ label: 'First number', min: -12, max: 12, step: 1, value: p, format: (v) => (v < 0 ? `−${-v}` : `+${v}`), onInput: (v) => { p = v; changed(); } });
  const sq = slider({ label: 'Second number', min: -12, max: 12, step: 1, value: q, format: (v) => (v < 0 ? `−${-v}` : `+${v}`), onInput: (v) => { q = v; changed(); } });
  const checkBtn = button('✔ Check my brackets', check, 'green');
  const rootBox = h('div', { class: 'sim-controls' });
  el.append(controls(sp.el, sq.el), controls(checkBtn), rootBox, ro.el);

  const cur = () => problems[k];
  const eqText = () => `t² + ${cur().u === 1 ? '' : cur().u}t − ${cur().s} = 0`;

  function changed() {
    if (stage !== 'factor') return;
    show();
  }

  function show() {
    const { u, s } = cur();
    ro.set([
      ['Brackets', `(t ${sgn(p)})(t ${sgn(q)}) = 0`],
      ['Multiply: first × second', `${par(p)} × ${par(q)} = ${fmt(p * q)}   (need −${s})`],
      ['Add: first + second', `${par(p)} + ${par(q)} = ${fmt(p + q)}   (need +${u})`],
    ]);
  }

  function intro() {
    const { u, s } = cur();
    stage = 'factor';
    sp.disabled = false; sq.disabled = false;
    rootBox.innerHTML = '';
    checkBtn.disabled = false;
    banner.set(`Problem ${k + 1}/${problems.length}: a car at <b>${u} m/s</b> accelerates at <b>2 m/s²</b>. When has it gone <b>${s} m</b>? s = ut + ½at² gives <b>${s} = ${u}t + t²</b>, so <b>${eqText()}</b>. Find two numbers that multiply to −${s} and add to +${u}.`);
    show();
  }

  function check() {
    if (stage !== 'factor') return;
    const { u, s } = cur();
    if (p * q === -s && p + q === u) {
      sfx.correct();
      stage = 'root';
      checkBtn.disabled = true;
      sp.disabled = true; sq.disabled = true; // the brackets are fixed now
      const r1 = -p, r2 = -q;
      banner.set(`Yes! (t ${sgn(p)})(t ${sgn(q)}) = 0, so t = ${fmt(r1)} or t = ${fmt(r2)}. Which one is the answer?`, true);
      rootBox.innerHTML = '';
      for (const r of [r1, r2]) {
        rootBox.append(button(`t = ${fmt(r)} s`, () => pickRoot(r)));
      }
    } else {
      sfx.wrong();
      const bad = [];
      if (p * q !== -s) bad.push(`they multiply to ${fmt(p * q)}, not −${s}`);
      if (p + q !== u) bad.push(`they add to ${fmt(p + q)}, not +${u}`);
      banner.set(`Not yet: ${bad.join(' and ')}. Equation: <b>${eqText()}</b>. Tip: −${s} is negative, so one number is negative and one positive.`);
    }
  }

  function pickRoot(r) {
    if (stage !== 'root') return;
    if (r < 0) {
      sfx.wrong();
      banner.set(`t = ${fmt(r)} s would be ${fmt(-r)} seconds <b>before</b> the car set off — the equation only describes the trip from t = 0. Pick the other one!`);
      return;
    }
    sfx.correct();
    root = r;
    stage = 'drive';
    clock = 0;
    rootBox.innerHTML = '';
    banner.set(`t = ${r} s. Watch the car check it...`, true);
  }

  function finishDrive() {
    const { u, s } = cur();
    stage = 'solved';
    banner.set(`✔ After ${root} s: ${u} × ${root} + ${root}² = ${u * root} + ${root * root} = ${s} m. ${k + 1 < problems.length ? 'Next problem...' : 'All solved — Factor Master! 🎉'}`, true);
    if (k + 1 >= problems.length) {
      api.done();
      return;
    }
    timer = setTimeout(() => {
      if (!alive) return;
      k++;
      p = 1; q = 1; sp.value = 1; sq.value = 1;
      intro();
    }, 2200);
  }

  const stop = loop((dt, now) => {
    if (stage === 'drive') {
      clock = Math.min(root, clock + dt * Math.max(1, root / 3));
      if (clock >= root) finishDrive();
    }
    const { u, s } = cur();
    const { ctx } = st;
    sky(ctx, W, ROAD);
    drawRoad(ctx, W, ROAD, 24, 0);
    const xOf = (m) => 40 + (m / (s * 1.15)) * (W - 70);
    // finish flag at s metres
    ctx.fillStyle = '#fff';
    ctx.fillRect(Math.round(xOf(s)), ROAD - 40, 2, 64);
    ctx.fillStyle = '#e03030';
    ctx.fillRect(Math.round(xOf(s)) + 2, ROAD - 40, 14, 9);
    tag(ctx, `${s} m`, xOf(s), ROAD - 46, { size: 11, color: '#fcee4b' });
    const t = stage === 'drive' || stage === 'solved' ? clock : 0;
    const d = u * t + t * t;
    drawCar(ctx, xOf(d) - 16, ROAD, 2, stage === 'drive' ? Math.sin(now * 30) * 0.5 : 0);
    text(ctx, eqText(), W / 2, 34, { size: 18, align: 'center', bold: true, color: '#fff' });
    text(ctx, `(t ${sgn(p)})(t ${sgn(q)}) = 0`, W / 2, 64, { size: 15, align: 'center', color: '#fcee4b' });
    tag(ctx, `t = ${fmt(t, 1)} s   distance ${fmt(d, 1)} m`, 110, 100, { size: 11 });
  });

  intro();
  return () => {
    alive = false;
    clearTimeout(timer);
    stop();
  };
}
