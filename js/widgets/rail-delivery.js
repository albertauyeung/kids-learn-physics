// Unit 1 Boss: Railway Delivery. Set the minecart speed for each leg so it reaches every
// station exactly on schedule. Speed = distance ÷ time for each leg.
// params: { rounds: 3, seed }

import { makeStage, loop, sky, ground, text, tag, slider, button, controls, readout, taskBanner } from './stage.js';
import { drawSprite, drawTexture } from '../core/sprites.js';
import { fmt, makeRng, randomSeed } from '../core/util.js';
import { sfx } from '../core/sound.js';

export function makeRound(rng) {
  const legs = [];
  let clock = 0;
  const n = rng.int(2, 3);
  for (let i = 0; i < n; i++) {
    const speed = rng.int(2, 12);
    const time = rng.pick([2, 3, 4, 5, 6]);
    clock += time;
    legs.push({ distance: speed * time, speed, arrive: clock });
  }
  return legs;
}

export default function railDelivery(el, params = {}, api) {
  const rng = makeRng(params.seed ?? randomSeed());
  const totalRounds = params.rounds || 3;
  let roundNo = 0;
  let legs = makeRound(rng);
  let speeds = legs.map(() => 5);

  const W = 480, H = 190;
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const sliderBox = controls();
  const goBtn = button('▶ Send the minecart', () => go(), 'green');
  const legTable = readout();
  el.append(sliderBox, controls(goBtn), legTable.el);

  let t = 0, running = false, result = null;

  function setupRound() {
    sliderBox.innerHTML = '';
    speeds = legs.map(() => 5);
    legs.forEach((leg, i) => {
      const s = slider({
        label: `Leg ${i + 1} speed`, min: 1, max: 15, step: 1, value: 5, unit: 'm/s',
        onInput: (v) => { speeds[i] = v; result = null; t = 0; },
      });
      sliderBox.append(s.el);
    });
    t = 0; result = null; running = false;
    const sched = legs.map((l, i) => `Station ${String.fromCharCode(66 + i)} at <b>${l.arrive} s</b>`).join(', ');
    legTable.set(legs.map((l, i) => [
      `Leg ${i + 1}: ${String.fromCharCode(65 + i)} → ${String.fromCharCode(66 + i)}`,
      `${l.distance} m · arrive at ${l.arrive} s`,
    ]));
    banner.set(`Delivery ${roundNo + 1}/${totalRounds}: leave A at 0 s and arrive at ${sched}. Set each leg's speed!`);
  }

  // Arrival times with the child's chosen speeds
  const plannedArrivals = () => {
    let c = 0;
    return legs.map((l, i) => (c += l.distance / speeds[i]));
  };

  function go() {
    t = 0; running = true; result = null;
    sfx.click();
  }

  function finish() {
    running = false;
    const arr = plannedArrivals();
    const ok = arr.every((a, i) => Math.abs(a - legs[i].arrive) < 1e-6);
    if (ok) {
      sfx.correct();
      roundNo++;
      if (roundNo >= totalRounds) {
        banner.set('All deliveries on time! The village is very happy. 🏆', true);
        api.done();
        result = 'win';
        return;
      }
      banner.set('Delivered right on time! Next delivery...', true);
      setTimeout(() => {
        if (!alive) return; legs = makeRound(rng); setupRound(); }, 1400);
      result = 'ok';
    } else {
      sfx.wrong();
      const msgs = arr.map((a, i) => {
        const diff = a - legs[i].arrive;
        if (Math.abs(diff) < 1e-6) return `${String.fromCharCode(66 + i)}: on time ✅`;
        return `${String.fromCharCode(66 + i)}: ${diff > 0 ? 'late' : 'early'} by ${fmt(Math.abs(diff), 2)} s`;
      });
      banner.set(`${msgs.join(' · ')}. Tip: leg time = arrival time − previous arrival time; speed = distance ÷ time.`);
      result = 'bad';
    }
  }

  let alive = true;
  const stop = loop((dt, now) => {
    const arr = plannedArrivals();
    const total = arr[arr.length - 1];
    if (running) {
      t += dt * Math.max(1, total / 6);
      if (t >= total) {
        t = total;
        finish();
      }
    }
    const { ctx } = st;
    sky(ctx, W, H);
    ground(ctx, 130, W, 20, 60);
    const D = legs.reduce((s, l) => s + l.distance, 0);
    const xOf = (d) => 30 + (d / D) * (W - 60);
    for (let x = 0; x < W; x += 16) drawTexture(ctx, 'rail', x, 116, 16);
    // stations
    let cum = 0;
    const stations = [0, ...legs.map((l) => (cum += l.distance))];
    stations.forEach((d, i) => {
      const x = xOf(d);
      ctx.fillStyle = '#7a5230';
      ctx.fillRect(x - 1, 70, 3, 46);
      ctx.fillStyle = '#a2834f';
      ctx.fillRect(x - 16, 62, 32, 16);
      text(ctx, String.fromCharCode(65 + i), x, 75, { size: 12, align: 'center', bold: true });
      if (i > 0) tag(ctx, `${legs[i - 1].arrive} s`, x, 56, { size: 10, color: '#fcee4b' });
    });
    legs.forEach((l, i) => tag(ctx, `${l.distance} m`, (xOf(stations[i]) + xOf(stations[i + 1])) / 2, 160, { size: 11 }));
    // cart position
    let pos = 0, c = 0;
    for (let i = 0; i < legs.length; i++) {
      const lt = legs[i].distance / speeds[i];
      if (t <= c + lt) { pos = stations[i] + speeds[i] * (t - c); break; }
      c += lt;
      pos = stations[i + 1];
    }
    const bob = running ? Math.sin(now * 25) * 0.8 : 0;
    drawSprite(ctx, 'hero', xOf(pos), 110 + bob, 1.5);
    drawSprite(ctx, 'minecart', xOf(pos), 124 + bob, 3);
    tag(ctx, `clock: ${fmt(t, 1)} s`, W - 50, 18);
    if (result === 'bad') tag(ctx, 'Off schedule!', W / 2, 30, { color: '#ff6b6b' });
  });

  setupRound();
  return () => {
    alive = false;
    stop();
  };
}
