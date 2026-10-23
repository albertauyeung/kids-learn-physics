// River crossing seen from above. The boat points straight across; the current pushes it sideways.
// Actual speed = √(boat² + current²); crossing time = width ÷ boat speed; drift = current × time.
// params: { mode: 'free' | 'rescue', width, boat, current, rounds, seed, tasks?: [{ text, check(p, drift) }] }

import { makeStage, loop, arrow, tag, slider, button, controls, readout, taskBanner } from './stage.js';
import { drawSprite, drawTexture } from '../core/sprites.js';
import { fmt, makeRng, randomSeed } from '../core/util.js';
import { sfx } from '../core/sound.js';

export function rescueRound(rng) {
  // Nice numbers: time = width / boat is a whole number; drift = current × time is a whole number.
  const boat = rng.pick([2, 3, 4, 5]);
  const time = rng.pick([3, 4, 5, 6]);
  const current = rng.pick([1, 2, 3]);
  const width = boat * time;
  const drift = current * time;
  const target = rng.int(drift + 4, 44);
  return { boat, current, width, target, drift };
}

export default function river(el, params = {}, api) {
  const mode = params.mode || 'free';
  const rng = makeRng(params.seed ?? randomSeed());
  const totalRounds = params.rounds || 3;
  const tasks = params.tasks || [];
  let taskIdx = 0;
  let roundNo = 0;
  let p = mode === 'rescue' ? rescueRound(rng) : { width: params.width || 20, boat: params.boat || 4, current: params.current || 3 };
  let launch = 4;
  const XMAX = 48;
  const W = 480, H = 300;
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const ro = readout();
  let t = 0, running = false, landed = null;

  const box = controls();
  el.append(box, controls(button('▶ Launch boat', () => { t = 0; landed = null; running = true; sfx.click(); }, 'green')), ro.el);

  function buildControls() {
    box.innerHTML = '';
    if (mode === 'free') {
      box.append(
        slider({ label: 'River width', min: 8, max: 30, step: 1, value: p.width, unit: 'm', onInput: (v) => { p.width = v; reset(); } }).el,
        slider({ label: 'Boat speed (across)', min: 1, max: 8, step: 1, value: p.boat, unit: 'm/s', onInput: (v) => { p.boat = v; reset(); } }).el,
        slider({ label: 'Current speed', min: 0, max: 6, step: 1, value: p.current, unit: 'm/s', onInput: (v) => { p.current = v; reset(); } }).el,
      );
    } else {
      launch = 4;
      box.append(slider({ label: 'Launch point', min: 0, max: XMAX, step: 1, value: launch, unit: 'm', onInput: (v) => { launch = v; reset(); } }).el);
    }
  }

  function reset() {
    t = 0; running = false; landed = null;
    show();
  }

  const T = () => p.width / p.boat;

  function show() {
    const speed = Math.hypot(p.boat, p.current);
    if (mode === 'free') {
      ro.set([
        ['Actual speed = √(boat² + current²)', `√(${p.boat}² + ${p.current}²) = ${fmt(speed, 2)} m/s`],
        ['Time to cross = width ÷ boat speed', `${p.width} ÷ ${p.boat} = ${fmt(T(), 2)} s`],
        landed && ['Drift downstream = current × time', `${p.current} × ${fmt(T(), 2)} = ${fmt(p.current * T(), 2)} m`, 'winner'],
      ]);
      if (tasks.length && taskIdx < tasks.length) banner.set(`Task ${taskIdx + 1}/${tasks.length}: ${tasks[taskIdx].text} Then launch to check.`);
      else if (!tasks.length) banner.set(landed ? 'Try a faster current or a slower boat — what happens to the drift?' : 'Set the sliders, then press <b>Launch boat</b>.');
    } else {
      ro.set([
        ['River width', `${p.width} m`],
        ['Boat speed (straight across)', `${p.boat} m/s`],
        ['Current', `${p.current} m/s → downstream`],
      ]);
      if (!landed) banner.set(`Rescue ${roundNo + 1}/${totalRounds}: the swimmer is at <b>${p.target} m</b> on the far bank. Pick the launch point so the current carries you right to them!`);
    }
  }

  // Geometry: river runs left→right; boat crosses bottom→top.
  // Free mode widens the view so a big drift never leaves the screen.
  const viewMax = () => (mode === 'free' ? Math.max(XMAX, Math.ceil((8 + p.current * T()) / 8) * 8) : XMAX);
  const sc = () => (W - 40) / viewMax();
  const riverPx = () => Math.min(200, p.width * sc() * 0.9);
  const sy = () => riverPx() / p.width; // vertical px per metre
  const bankBottom = () => (H + riverPx()) / 2;
  const xOf = (m) => 20 + m * sc();

  const banks = { canvas: Object.assign(document.createElement('canvas'), { width: W, height: H }), key: '' };
  let alive = true;
  const stop = loop((dt, now) => {
    if (running) {
      t += dt * Math.max(1, T() / 4);
      if (t >= T()) {
        t = T();
        running = false;
        const x = (mode === 'rescue' ? launch : 4) + p.current * T();
        landed = { x };
        show();
        if (mode === 'free') {
          const drift = p.current * T();
          if (!tasks.length) {
            sfx.correct();
            api.done();
          } else if (taskIdx < tasks.length && tasks[taskIdx].check(p, drift)) {
            sfx.correct();
            taskIdx++;
            if (taskIdx >= tasks.length) {
              banner.set('All river tasks done! 🎉', true);
              api.done();
            } else {
              banner.set(`Yes! Task ${taskIdx}/${tasks.length} done. Next: ${tasks[taskIdx].text}`, true);
            }
          } else if (taskIdx < tasks.length) {
            sfx.wrong();
            banner.set(`Not quite (drift ${fmt(drift, 2)} m, crossing time ${fmt(T(), 2)} s). Task: ${tasks[taskIdx].text}`);
          }
        } else if (Math.abs(x - p.target) <= 0.5) {
          sfx.correct();
          roundNo++;
          if (roundNo >= totalRounds) {
            banner.set('Every swimmer rescued! You are a true River Captain. 🏆', true);
            api.done();
          } else {
            banner.set(`Rescued! You drifted ${fmt(p.current * T())} m. Next rescue...`, true);
            setTimeout(() => {
        if (!alive) return; p = rescueRound(rng); buildControls(); reset(); }, 1500);
          }
        } else {
          sfx.wrong();
          banner.set(`Missed! You landed at ${fmt(x, 2)} m. Work out the drift: time = width ÷ boat speed, drift = current × time.`);
        }
      }
    }
    const { ctx } = st;
    const top = bankBottom() - riverPx();
    // banks: hundreds of tiles, so draw them once per river shape and reuse the image
    const key = `${top.toFixed(1)}|${bankBottom().toFixed(1)}`;
    if (banks.key !== key) {
      const g = banks.canvas.getContext('2d');
      g.clearRect(0, 0, W, H);
      for (let x = 0; x < W; x += 16) {
        for (let y = 0; y < top; y += 16) drawTexture(g, y + 16 >= top ? 'sand' : 'grasstop', x, Math.min(y, top - 16), 16, (x + y) % 5);
        for (let y = bankBottom(); y < H; y += 16) drawTexture(g, y === bankBottom() ? 'sand' : 'grasstop', x, y, 16, (x + y) % 5);
      }
      banks.key = key;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(banks.canvas, 0, 0, W, H);
    // water with moving stripes
    ctx.fillStyle = '#3f76e4';
    ctx.fillRect(0, top, W, riverPx());
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    const off = (now * p.current * sc()) % 40;
    for (let y = top + 6; y < bankBottom() - 4; y += 14) {
      for (let x = -40 + off + ((y * 7) % 40); x < W; x += 40) ctx.fillRect(Math.round(x), Math.round(y), 14, 2);
    }
    // current arrow
    if (p.current > 0) {
      arrow(ctx, 20, top + riverPx() / 2, 20 + p.current * 12, top + riverPx() / 2, '#ffffff', 3);
    }
    // target swimmer
    if (mode === 'rescue') {
      drawSprite(ctx, 'swimmer', xOf(p.target), top + 10, 3, { anchor: 'center' });
      tag(ctx, `HELP! (${p.target} m)`, xOf(p.target), top - 4, { color: '#ff6b6b', size: 10 });
    }
    // boat
    const start = mode === 'rescue' ? launch : 4;
    const bx = start + p.current * t;
    const by = p.boat * t;
    const px = xOf(bx), py = bankBottom() - by * sy();
    // path line: in the boss it would give the answer away, so only show it once the boat moves
    if (mode === 'free' || running || landed) {
    ctx.strokeStyle = 'rgba(252,238,75,0.7)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xOf(start), bankBottom());
    ctx.lineTo(xOf(start + p.current * T()), top);
    ctx.stroke();
    ctx.setLineDash([]);
    }
    drawSprite(ctx, 'boat', px, py, 3, { anchor: 'center' });
    // velocity triangle near boat
    if (mode === 'free' || running) {
      const k = 9;
      arrow(ctx, px, py, px, py - p.boat * k, '#ff9b3d', 3);
      arrow(ctx, px, py - p.boat * k, px + p.current * k, py - p.boat * k, '#ffffff', 3);
      arrow(ctx, px, py, px + p.current * k, py - p.boat * k, '#fcee4b', 4);
    }
    // ruler on far bank
    ctx.fillStyle = '#fff';
    const labelStep = Math.max(8, Math.ceil(viewMax() / 6 / 8) * 8);
    for (let m = 0; m <= viewMax(); m += 4) {
      ctx.fillRect(Math.round(xOf(m)), top - 2, 1, 4);
      if (m % labelStep === 0) tag(ctx, String(m), xOf(m), 12, { size: 9, bg: 'rgba(0,0,0,0.4)' });
    }
    tag(ctx, `t = ${fmt(t, 1)} s`, W - 40, H - 8);
    if (landed) tag(ctx, `landed at ${fmt(landed.x, 2)} m`, xOf(landed.x), top + 26, { color: '#fcee4b' });
  });

  buildControls();
  show();
  return () => {
    alive = false;
    stop();
  };
}
