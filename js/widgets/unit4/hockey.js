// Boss: Ice Hockey Physics. Friction is the only force on the sliding puck: a = friction ÷ mass.
// It stops when (launch speed)² = 2 × a × distance. "Hit" rounds choose the stick's push instead:
// the stick touches the puck for 0.1 s, so launch speed = (push ÷ mass) × 0.1.
// params: { rounds, seed }

import { makeStage, loop, tag, arrow, slider, button, controls, readout, taskBanner } from '../stage.js';
import { drawSprite } from '../../core/sprites.js';
import { fmt, makeRng, randomSeed } from '../../core/util.js';
import { sfx } from '../../core/sound.js';
import { drawFloor } from './common.js';

const SPEEDS = { 0.5: [4, 5, 6, 7], 1: [4, 6, 8], 2: [6, 8, 10] };
const HIT_T = 0.1;
const TOL = 0.6;

// Whole-number targets: distance = v² ÷ (2a). Exported for the tests.
export function hockeyRound(rng, kind) {
  const m = rng.pick([0.2, 0.5]);
  const a = rng.pick([0.5, 1, 2]);
  const v = rng.pick(SPEEDS[a]);
  // The push slider moves in steps that change the launch speed by 1 m/s (like the speed slider).
  const pushStep = Math.round((m / HIT_T) * 100) / 100;
  return { kind, m, a, f: Math.round(m * a * 100) / 100, v, d: (v * v) / (2 * a), push: Math.round((m * v) / HIT_T * 100) / 100, pushStep };
}

export default function hockey(el, params = {}, api) {
  const rng = makeRng(params.seed ?? randomSeed());
  const total = params.rounds || 3;
  const kinds = ['speed', rng.pick(['speed', 'hit']), 'hit', 'speed', 'hit'];
  let roundNo = 0;
  let R = hockeyRound(rng, kinds[0]);
  const W = 480, H = 200, ICE = 110, RINK = 60;
  const xOf = (metres) => 24 + (metres / RINK) * (W - 48);
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const ro = readout();
  const box = controls();
  el.append(box, controls(button('🏒 Shoot!', () => shoot(), 'green')), ro.el);

  let choice = 0, x = 0, v = 0, running = false, swing = 0, stopped = null, finished = false;

  function buildControls() {
    box.innerHTML = '';
    if (R.kind === 'speed') {
      choice = 3;
      box.append(slider({ label: 'Launch speed', min: 1, max: 12, step: 1, value: choice, unit: 'm/s', onInput: (val) => { choice = val; reset(); } }).el);
    } else {
      choice = R.pushStep * 3;
      box.append(slider({ label: 'Stick push (for 0.1 s)', min: R.pushStep, max: 60, step: R.pushStep, value: choice, unit: 'N', onInput: (val) => { choice = val; reset(); } }).el);
    }
  }
  const launchSpeed = () => (R.kind === 'speed' ? choice : (choice / R.m) * HIT_T);

  function reset() {
    x = 0; v = 0; running = false; swing = 0; stopped = null;
    show();
  }
  function shoot() {
    if (finished || running) return;
    reset();
    v = launchSpeed();
    running = true;
    swing = 0.3;
    sfx.click();
  }

  function show() {
    const rows = [['Puck mass', `${fmt(R.m)} kg`], ['Friction on the puck', `${fmt(R.f)} N`]];
    if (R.kind === 'hit') rows.push(['Stick touches the puck for', `${HIT_T} s`]);
    rows.push(['Target zone', `${fmt(R.d)} m from Pip`]);
    if (stopped) {
      rows.push(['Launch speed', `${fmt(stopped.v0, 2)} m/s`]);
      rows.push(['Deceleration = friction ÷ mass', `${fmt(R.f)} ÷ ${fmt(R.m)} = ${fmt(R.a)} m/s²`]);
      rows.push(['Stopped at', `${fmt(stopped.x, 1)} m`, 'winner']);
    }
    ro.set(rows);
    if (!stopped && !finished) {
      banner.set(`Shot ${roundNo + 1}/${total}: make the puck stop in the <b>target zone at ${fmt(R.d)} m</b>. ${R.kind === 'speed' ? 'Choose the <b>launch speed</b>.' : 'Choose the <b>stick\'s push</b>.'}`);
    }
  }

  let alive = true;
  const stop = loop((dt) => {
    if (!alive) return;
    swing = Math.max(0, swing - dt);
    if (running) {
      const speedUp = Math.max(1, v / R.a / 3.5);
      const d = dt * speedUp;
      const nv = Math.max(0, v - R.a * d);
      x += ((v + nv) / 2) * d;
      v = nv;
      if (x >= RINK) {
        x = RINK;
        v = 0;
      }
      if (v <= 0) {
        running = false;
        stopped = { x, v0: launchSpeed() };
        show();
        if (Math.abs(x - R.d) <= TOL) {
          sfx.correct();
          roundNo++;
          if (roundNo >= total) {
            finished = true;
            banner.set('GOAL x3! You used friction like a pro. Ice Hockey Champion! 🏆', true);
            api.done();
          } else {
            banner.set(`In the zone! Stopped at ${fmt(x, 1)} m. Next shot...`, true);
            setTimeout(() => {
              if (!alive) return;
              R = hockeyRound(rng, kinds[roundNo]);
              buildControls();
              reset();
            }, 1600);
          }
        } else {
          sfx.wrong();
          banner.set(x >= RINK
            ? 'Way too hard — it hit the boards! Work out a = friction ÷ mass, then (launch speed)² = 2 × a × distance.'
            : `It stopped at ${fmt(x, 1)} m — the target is ${fmt(R.d)} m. Work out a = friction ÷ mass, then (launch speed)² = 2 × a × distance.${R.kind === 'hit' ? ' Then push = mass × speed ÷ 0.1.' : ''}`);
        }
      }
    }
    const { ctx } = st;
    ctx.fillStyle = '#26203a';
    ctx.fillRect(0, 0, W, H);
    // crowd stand
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = ['#e03030', '#3b6fd8', '#fcee4b', '#80ff20'][i % 4];
      ctx.fillRect(8 + i * 12, 40 + (i % 3) * 3, 6, 6);
    }
    drawFloor(ctx, 'ice', ICE - 50, W, 110, 0);
    // boards
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, ICE - 54, W, 5);
    ctx.fillRect(0, ICE + 58, W, 5);
    ctx.fillRect(xOf(RINK), ICE - 54, 4, 117);
    // target zone
    const z0 = xOf(R.d - 1), z1 = xOf(R.d + 1);
    ctx.fillStyle = 'rgba(224,48,48,0.35)';
    ctx.fillRect(z0, ICE - 49, z1 - z0, 107);
    ctx.fillStyle = '#e03030';
    ctx.fillRect(xOf(R.d) - 1, ICE - 49, 3, 107);
    tag(ctx, `${fmt(R.d)} m`, xOf(R.d), ICE - 36, { size: 11, color: '#ffb0b0' });
    // distance ticks
    for (let mk = 0; mk <= RINK; mk += 10) {
      ctx.fillStyle = '#3b6fd8';
      ctx.fillRect(xOf(mk), ICE + 44, 2, 12);
      tag(ctx, `${mk}`, xOf(mk), H - 6, { size: 10 });
    }
    // Pip and his stick
    const pipX = xOf(0) - 4;
    drawSprite(ctx, 'hero', pipX, ICE + 22, 2.5, { flip: false });
    ctx.save();
    ctx.strokeStyle = '#7a5230';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const ang = swing > 0 ? -0.2 : 0.5;
    ctx.moveTo(pipX + 6, ICE - 4);
    ctx.lineTo(pipX + 6 + Math.cos(ang) * 22, ICE + 18 + Math.sin(ang) * 4);
    ctx.stroke();
    ctx.restore();
    // puck
    const px = xOf(x) + 8;
    drawSprite(ctx, 'u4puck', px, ICE + 20, 2);
    if (running) {
      arrow(ctx, px, ICE + 30, px - 26, ICE + 30, '#ff5050', 4);
      tag(ctx, `friction ${fmt(R.f)} N`, px - 13, ICE + 46, { size: 9, color: '#ffb0b0' });
    }
    tag(ctx, `${fmt(v, 1)} m/s`, px, ICE - 6, { size: 11, color: '#fcee4b' });
    tag(ctx, `Shot ${Math.min(roundNo + 1, total)}/${total}`, W - 50, 20, { size: 11 });
  });

  buildControls();
  show();
  return () => {
    alive = false;
    stop();
  };
}
