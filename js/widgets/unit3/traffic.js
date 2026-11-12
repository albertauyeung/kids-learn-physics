// Boss: Traffic Light Challenge. Randomised rounds (seeded):
//   stop       — the light turns red d metres ahead of a car at u: choose the deceleration (a = u² ÷ 2d)
//   brakepoint — fixed brakes b: choose where to start braking (line − u² ÷ 2b)
//   go         — from rest, the light D m ahead turns green after T s: choose the acceleration
//                so the car arrives exactly as it turns green (D = ½aT²)
// params: { rounds = 3, seed }

import { makeStage, loop, sky, tag, arrow, ruler, slider, button, controls, readout, taskBanner } from '../stage.js';
import { fmt, makeRng, randomSeed } from '../../core/util.js';
import { sfx } from '../../core/sound.js';
import { drawRoad, drawCar, trafficLight } from './common.js';

const pickUntil = (rng, gen, ok) => {
  let x;
  for (let i = 0; i < 500; i++) {
    x = gen();
    if (ok(x)) return x;
  }
  return x;
};

export function trafficRound(rng, type) {
  if (type === 'stop') {
    return pickUntil(rng, () => {
      const u = rng.pick([10, 12, 14, 15, 16, 18, 20, 24]);
      const b = rng.pick([2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8]);
      return { type, u, b, d: (u * u) / (2 * b) };
    }, (x) => Number.isInteger(x.d) && x.d >= 12 && x.d <= 60);
  }
  if (type === 'brakepoint') {
    return pickUntil(rng, () => {
      const u = rng.pick([10, 12, 16, 20]);
      const b = rng.pick([4, 5, 8]);
      const sb = (u * u) / (2 * b);
      const D = sb + rng.int(10, 40);
      return { type, u, b, sb, D, p: D - sb };
    }, (x) => Number.isInteger(x.sb) && x.D <= 90);
  }
  return pickUntil(rng, () => {
    const T = rng.pick([4, 5, 6]);
    const a = rng.pick([1, 1.5, 2, 2.5, 3, 3.5, 4]);
    return { type: 'go', T, a, D: (a * T * T) / 2 };
  }, (x) => Number.isInteger(x.D) && x.D >= 12 && x.D <= 64 && x.a * x.T <= 20);
}

// The answer the player must find in a round (on the slider's grid).
export const answerOf = (r) => (r.type === 'stop' ? r.b : r.type === 'brakepoint' ? r.p : r.a);
// Slider start values: never a correct answer.
export const START = { stop: 1, brakepoint: 0, go: 0.5 };

// A fresh round of the given type whose answer differs from the previous round's.
export function nextRound(rng, type, prev) {
  let r;
  for (let i = 0; i < 100; i++) {
    r = trafficRound(rng, type);
    if (!prev || answerOf(r) !== answerOf(prev)) break;
  }
  return r;
}

export default function traffic(el, params = {}, api) {
  const rng = makeRng(params.seed ?? randomSeed());
  const totalRounds = params.rounds || 3;
  const order = rng.shuffle(['stop', 'go', 'brakepoint']);
  const W = 480, H = 210, ROAD = 140, X0 = 34;
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const ro = readout();
  const box = controls();
  let roundNo = 0, R = null, val = 0, tries = 0, label = 1, sl = null;
  const MAX_TRIES = 3;
  let clock = 0, running = false, result = null;
  let finished = false;
  // Between rounds (after a win or 3 misses) Go does nothing until the next light appears.
  const waiting = () => !!result && (result.ok || tries >= MAX_TRIES);
  // Lock the controls while the car runs and between rounds, so a run can't be cancelled or counted twice.
  const lock = () => {
    const off = running || waiting();
    goBtn.disabled = off;
    if (sl) sl.disabled = off;
    // After a win or a 3-miss reveal the child reads the banner, then moves on when ready.
    nextBtn.style.display = waiting() && !finished ? '' : 'none'; // .mc-btn sets display, so [hidden] would not hide it
  };
  const nextBtn = button('Next round ▶', () => {
    if (!waiting() || finished) return;
    sfx.click();
    newRound();
  }, 'green');
  nextBtn.style.display = 'none';
  const goBtn = button('▶ Go!', () => {
    if (running || waiting()) return;
    clock = 0; result = null; running = true;
    lock();
    sfx.click();
  }, 'green');
  el.append(controls(goBtn, nextBtn), box, ro.el);

  function newRound() {
    // A fresh round never repeats the answer of the one before (e.g. after a reveal).
    R = nextRound(rng, order[roundNo % order.length], R);
    label = roundNo + 1;
    clock = 0; running = false; result = null; tries = 0;
    box.innerHTML = '';
    let s;
    if (R.type === 'stop') {
      val = START.stop; // never an answer (all answers are 2 m/s² or more)
      s = slider({ label: 'Brakes: deceleration', min: 1, max: 8, step: 0.1, value: val, unit: 'm/s²', onInput: (v) => { if (running || waiting()) return; val = v; clock = 0; result = null; } });
      banner.set(`Round ${roundNo + 1}/${totalRounds}: <b>Red light!</b> You're doing <b>${R.u} m/s</b> and the stop line is <b>${R.d} m</b> ahead. You brake right now — how hard, to stop <b>exactly on the line</b>?`);
      ro.set([['Speed u', `${R.u} m/s`], ['Stop line', `${R.d} m ahead`]]);
    } else if (R.type === 'brakepoint') {
      val = START.brakepoint; // never an answer (you always cruise at least 10 m first)
      s = slider({ label: 'Start braking at', min: 0, max: R.D, step: 1, value: val, unit: 'm', onInput: (v) => { if (running || waiting()) return; val = v; clock = 0; result = null; } });
      banner.set(`Round ${roundNo + 1}/${totalRounds}: The light ahead is <b>red</b>. You're cruising at <b>${R.u} m/s</b> and your brakes give <b>${R.b} m/s²</b>. The stop line is <b>${R.D} m</b> away. Where must you <b>start braking</b> to stop exactly on the line?`);
      ro.set([['Speed u', `${R.u} m/s`], ['Brakes', `${R.b} m/s²`], ['Stop line', `${R.D} m from the start`]]);
    } else {
      val = START.go; // never an answer (answers are 1 to 4 m/s²)
      s = slider({ label: 'Acceleration', min: 0.5, max: 5, step: 0.1, value: val, unit: 'm/s²', onInput: (v) => { if (running || waiting()) return; val = v; clock = 0; result = null; } });
      banner.set(`Round ${roundNo + 1}/${totalRounds}: <b>Green wave!</b> You start from rest. The light <b>${R.D} m</b> ahead turns green in exactly <b>${R.T} s</b>. Choose your acceleration so you reach it <b>exactly as it turns green</b> — not before (you'd have to stop), not after.`);
      ro.set([['Start', 'from rest (u = 0)'], ['Light', `${R.D} m ahead`], ['Turns green after', `${R.T} s`]]);
    }
    box.append(s.el);
    sl = s;
    lock();
  }

  // Position of the car at time t, and when the run ends.
  const endTime = () => {
    if (R.type === 'stop') return R.u / val;
    if (R.type === 'brakepoint') return val / R.u + R.u / R.b;
    return R.T;
  };
  const posAt = (t) => {
    if (R.type === 'stop') return R.u * t - 0.5 * val * t * t;
    if (R.type === 'brakepoint') {
      const t1 = val / R.u;
      if (t <= t1) return R.u * t;
      const tb = t - t1;
      return val + R.u * tb - 0.5 * R.b * tb * tb;
    }
    return 0.5 * val * t * t;
  };
  const speedAt = (t) => {
    if (R.type === 'stop') return Math.max(0, R.u - val * t);
    if (R.type === 'brakepoint') return t <= val / R.u ? R.u : Math.max(0, R.u - R.b * (t - val / R.u));
    return val * t;
  };
  const line = () => (R.type === 'stop' ? R.d : R.D);

  // The worked answer for this round (shown after 3 misses).
  function solution() {
    if (R.type === 'stop') return `deceleration = u² ÷ (2 × distance) = ${R.u}² ÷ (2 × ${R.d}) = ${R.u * R.u} ÷ ${2 * R.d} = <b>${fmt(R.b)} m/s²</b>`;
    if (R.type === 'brakepoint') return `braking distance = ${R.u}² ÷ (2 × ${R.b}) = ${R.u * R.u} ÷ ${2 * R.b} = ${R.sb} m, so brake at ${R.D} − ${R.sb} = <b>${R.p} m</b>`;
    return `D = ½aT², so a = 2D ÷ T² = 2 × ${R.D} ÷ ${R.T}² = ${2 * R.D} ÷ ${R.T * R.T} = <b>${fmt(R.a)} m/s²</b>`;
  }

  function judge() {
    const x = posAt(endTime());
    const L = line();
    // Direction only — never the size of the miss, so the round needs the physics, not trial and error.
    const ok = Math.abs(val - answerOf(R)) <= (R.type === 'brakepoint' ? 0.5 : 0.05);
    let msg;
    if (R.type === 'go') {
      msg = ok ? 'Perfect timing! You reached the light just as it turned green.'
        : val > R.a ? 'Too early — you reached the light while it was still red.'
          : 'Too late — the light turned green before you got there.';
    } else {
      msg = ok ? 'You stopped exactly on the line. Smooth!'
        : x > L ? 'Too far — you ran the red light!'
          : 'Too short — you stopped before the line.';
    }
    result = { ok, x };
    lock();
    if (!ok) {
      sfx.wrong();
      tries++;
      if (tries >= MAX_TRIES) {
        banner.set(`${msg} That was 3 tries. Here's how to work it out: ${solution()}. Press <b>Next round</b> for a new light with new numbers.`);
        lock();
        return;
      }
      const tip = R.type === 'go' ? 'Use s = ½at² with s and t known.' : 'Use braking distance = u² ÷ (2 × deceleration).';
      banner.set(`${msg} ${tip} Try ${tries + 1} of ${MAX_TRIES}.`);
      lock();
      return;
    }
    sfx.correct();
    roundNo++;
    if (roundNo >= totalRounds) {
      finished = true;
      lock();
      banner.set(`${msg} Every light conquered — you are a Traffic Master! 🏆`, true);
      api.done();
      return;
    }
    banner.set(`${msg} Press <b>Next round</b> when you're ready.`, true);
    lock();
  }

  const stop = loop((dt, now) => {
    if (running) {
      const T = endTime();
      clock = Math.min(T, clock + dt * Math.max(1, T / 5));
      if (clock >= T - 1e-9) {
        running = false;
        judge();
      }
    }
    const { ctx } = st;
    const L = line();
    const view = Math.ceil((L * 1.35) / 10) * 10;
    const xOf = (m) => X0 + (m / view) * (W - X0 - 20);
    sky(ctx, W, ROAD);
    drawRoad(ctx, W, ROAD, 26, 0);
    ruler(ctx, xOf, ROAD + 30, 0, view, 5, view > 80 ? 20 : 10);
    // light colour: red, except in the go round once the time is up
    const green = R.type === 'go' && (running || result) && clock >= R.T - 1e-9;
    trafficLight(ctx, xOf(L), ROAD, green ? 'green' : 'red');
    tag(ctx, `${L} m`, xOf(L), ROAD - 98, { size: 10, color: '#fcee4b' });
    if (R.type === 'brakepoint') {
      ctx.fillStyle = '#ff9b3d';
      ctx.fillRect(Math.round(xOf(val)), ROAD - 6, 2, 32);
      tag(ctx, `brake at ${val} m`, xOf(val), ROAD - 10, { size: 9, color: '#ff9b3d' });
    }
    const t = running || result ? clock : 0;
    const x = posAt(t);
    const carFront = Math.min(xOf(x), W - 4);
    drawCar(ctx, carFront - 16, ROAD, 2, running ? Math.sin(now * 30) * 0.5 : 0);
    const v = running || result ? speedAt(t) : R.type === 'go' ? 0 : R.u;
    if (v > 0) arrow(ctx, carFront + 2, ROAD - 26, carFront + 2 + Math.max(16, v * 1.5), ROAD - 26, '#80ff20', 3);
    tag(ctx, `v = ${fmt(v, 1)} m/s`, Math.min(carFront, W - 60), ROAD - 34, { size: 10, color: '#80ff20' });
    tag(ctx, `t = ${fmt(t, 1)} s`, W - 40, 18, { size: 12 });
    if (R.type === 'go') tag(ctx, `green at ${R.T} s`, 60, 18, { size: 11, color: green ? '#30e060' : '#ff6b6b' });
    tag(ctx, `Round ${label}/${totalRounds}`, W / 2, 18, { size: 11 });
  });

  newRound();
  return () => {
    stop();
  };
}
