// Race lanes: each racer has a speed and a distance to cover. Shows the clock and finish times.
// params: { lanes: [{ racer, name, speed, distance }], editDistance?: { min, max, step },
//           races?: number of races at different distances needed, hideSpeeds?: work speeds out from times }

import { makeStage, loop, sky, ground, text, tag, slider, button, controls, readout, taskBanner } from './stage.js';
import { drawSprite } from '../core/sprites.js';
import { fmt } from '../core/util.js';
import { sfx } from '../core/sound.js';

export default function race(el, params, api) {
  const lanes = params.lanes.map((l) => ({ ...l }));
  const needRaces = params.races || 1;
  const raced = new Set();
  const banner = taskBanner();
  el.append(banner.el);
  banner.set(needRaces > 1 ? `Race at <b>${needRaces} different distances</b>. Then check: does distance ÷ time give each racer's speed?` : 'Press <b>Start race</b>!');
  const W = 480, laneH = 64, top = 26;
  const H = top + lanes.length * laneH + 10;
  const st = makeStage(el, W, H);
  const ro = readout();
  let t = 0, running = false, finished = false;
  const maxDist = () => Math.max(...lanes.map((l) => l.distance));
  const x0 = 40;
  const xOf = (m) => x0 + (m / maxDist()) * (W - x0 - 40);
  // Time warp so every race takes about 4–7 real seconds.
  const warp = () => Math.max(1, Math.max(...lanes.map((l) => l.distance / l.speed)) / 6);

  const startBtn = button('▶ Start race', () => {
    t = 0; running = true; finished = false;
    sfx.click();
  }, 'green');
  const ctrls = [startBtn];
  let distSlider = null;
  if (params.editDistance) {
    distSlider = slider({
      label: 'Race distance', ...params.editDistance, value: lanes[0].distance, unit: 'm',
      onInput: (v) => { lanes.forEach((l) => (l.distance = v)); t = 0; running = false; finished = false; show(); },
    });
  }
  el.append(controls(...ctrls), distSlider ? distSlider.el : '', ro.el);

  function show() {
    ro.set(lanes.map((l) => {
      const ft = l.distance / l.speed;
      const done = t >= ft;
      return [
        params.hideSpeeds && raced.size < needRaces ? `${l.name} (${fmt(l.distance)} m)` : `${l.name} (${fmt(l.speed)} m/s, ${fmt(l.distance)} m)`,
        done ? `${fmt(ft, 2)} s${params.hideSpeeds ? ` → ${fmt(l.distance)} ÷ ${fmt(ft, 2)} = ${fmt(l.distance / ft, 2)} m/s` : ''}` : running ? '...' : '—',
        done && Math.abs(ft - Math.min(...lanes.map((x) => x.distance / x.speed))) < 1e-9 ? 'winner' : '',
      ];
    }));
  }

  const stop = loop((dt, now) => {
    if (running) {
      t += dt * warp();
      const longest = Math.max(...lanes.map((l) => l.distance / l.speed));
      if (t >= longest) {
        t = longest;
        running = false;
        if (!finished) {
          finished = true;
          sfx.complete();
          raced.add(lanes[0].distance);
          const times = lanes.map((l) => l.distance / l.speed);
          const best = Math.min(...times);
          const winners = lanes.filter((l, i) => Math.abs(times[i] - best) < 1e-9).map((l) => l.name);
          const result = `🏆 ${winners.join(' & ')} ${winners.length > 1 ? 'tie' : 'wins'} in ${fmt(best, 2)} s!`;
          if (raced.size >= needRaces) {
            banner.set(needRaces > 1 ? `${result} Look at the table: distance ÷ time gives the same speed in every race.` : result, true);
            api.done();
          } else {
            banner.set(`${result} Now change the distance and race again (${raced.size}/${needRaces}).`);
          }
          show();
        }
      }
      show();
    }
    const { ctx } = st;
    sky(ctx, W, H);
    lanes.forEach((l, i) => {
      const y = top + i * laneH;
      ground(ctx, y + laneH - 12, W, 12, null, 'grasstop');
      // finish line
      const fx = xOf(l.distance);
      for (let k = 0; k < 6; k++) {
        ctx.fillStyle = k % 2 ? '#111' : '#fff';
        ctx.fillRect(fx, y + laneH - 12 + k * 2, 3, 2);
      }
      drawSprite(ctx, 'flag', fx + 6, y + laneH - 12, 2);
      const pos = Math.min(l.distance, l.speed * t);
      const moving = running && pos < l.distance;
      const bob = moving ? Math.sin(now * 18 + i) * 1.2 : 0;
      drawSprite(ctx, l.racer, xOf(pos), y + laneH - 11 + bob, l.racer === 'hero' || l.racer === 'friend' ? 2.5 : l.racer === 'horse' ? 3.5 : 4);
      text(ctx, l.name, 4, y + 14, { size: 11 });
    });
    tag(ctx, `clock: ${fmt(t, 1)} s`, W - 50, 15);
  });

  show();
  return stop;
}
