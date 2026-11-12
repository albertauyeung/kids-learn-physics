// Vacuum chamber: drop two objects side by side from 5 m, with the air in or pumped out.
// With air, drag (growing with speed) holds light, spread-out things back; with no air everything
// falls with a = W ÷ m = g. Slow motion until the first object lands, then fast-forward.
// params: { tasks: [{ text, check({ air, left, right, times }) }], testedAfter?: task index }

import { makeStage, loop, text, tag, button, controls, readout, taskBanner } from '../stage.js';
import { drawSprite } from '../../core/sprites.js';
import { fmt } from '../../core/util.js';
import { sfx } from '../../core/sound.js';
import { G } from './physics.js';

// vt = speed at which air resistance would balance the weight (terminal speed in air)
export const OBJECTS = [
  { id: 'hammer', name: 'Hammer', m: 1.3, vt: 45, sprite: 'u5hammer', scale: 2.5 },
  { id: 'feather', name: 'Feather', m: 0.03, vt: 0.6, sprite: 'u5feather', scale: 3 },
  { id: 'anvil', name: 'Anvil', m: 50, vt: 150, sprite: 'u5anvil', scale: 2.5 },
  { id: 'paper', name: 'Paper sheet', m: 0.005, vt: 1.5, sprite: 'u5paper', scale: 3 },
  { id: 'stone', name: 'Stone', m: 0.2, vt: 25, sprite: 'u5stone', scale: 3 },
];
const HEIGHT = 5;

export default function vacuumDrop(el, params = {}, api) {
  const tasks = params.tasks || [];
  let taskIdx = 0;
  let air = true;
  let li = 0, ri = 1; // hammer and feather
  const W = 480, H = 300, TOP = 50, FLOOR = 270;
  const pxPerM = (FLOOR - TOP) / HEIGHT;
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const ro = readout();
  let run = null; // { t, objs: [{ y, v, landed }] }
  let alive = true;

  const airBtn = button('', () => { air = !air; run = null; sfx.select(); show(); });
  const leftBtn = button('', () => { li = (li + 1) % OBJECTS.length; run = null; sfx.select(); show(); });
  const rightBtn = button('', () => { ri = (ri + 1) % OBJECTS.length; run = null; sfx.select(); show(); });
  const dropBtn = button('▼ Drop both', () => {
    run = { t: 0, objs: [0, 1].map(() => ({ y: 0, v: 0, landed: null })) };
    sfx.click();
    show();
  }, 'green');
  el.append(controls(leftBtn, rightBtn), controls(airBtn, dropBtn), ro.el);

  const pair = () => [OBJECTS[li], OBJECTS[ri]];

  function show() {
    airBtn.textContent = air ? '💨 Air: ON (tap to pump it out)' : '🫙 Air: OFF (vacuum)';
    leftBtn.textContent = `Left: ${OBJECTS[li].name} ⟳`;
    rightBtn.textContent = `Right: ${OBJECTS[ri].name} ⟳`;
    const rows = pair().map((o, i) => {
      const Wt = o.m * G;
      const t = run?.objs[i].landed;
      return [`${o.name}: ${fmt(o.m)} kg, weight ${fmt(Wt, 2)} N`, t != null ? `landed after ${fmt(t, 2)} s` : (air ? 'air pushes back' : `a = W ÷ m = ${fmt(Wt, 2)} ÷ ${fmt(o.m)} = 10 m/s²`)];
    });
    ro.set([['Chamber', air ? 'full of air' : 'vacuum — no air at all'], ...rows]);
    if (tasks.length && taskIdx < tasks.length) banner.set(`Task ${taskIdx + 1}/${tasks.length}: ${tasks[taskIdx].text}`);
    else if (!tasks.length) banner.set('Choose two objects, switch the air on or off, and drop them.');
  }

  function finished() {
    const times = run.objs.map((o) => o.landed);
    show();
    const gap = Math.abs(times[0] - times[1]);
    if (!tasks.length) { api.done(); return; }
    if (taskIdx >= tasks.length) return;
    const state = { air, left: OBJECTS[li].id, right: OBJECTS[ri].id, times, gap };
    if (tasks[taskIdx].check(state)) {
      sfx.correct();
      if (params.testedAfter === taskIdx) api.tested?.();
      taskIdx++;
      const note = gap < 0.005 ? 'They landed together!' : `They landed ${fmt(gap, 2)} s apart.`;
      if (taskIdx >= tasks.length) {
        banner.set(`${note} All chamber tasks done! 🎉`, true);
        api.done();
      } else {
        banner.set(`${note} Next: ${tasks[taskIdx].text}`, true);
      }
    } else {
      sfx.wrong();
      banner.set(`${gap < 0.005 ? 'They landed together.' : `They landed ${fmt(gap, 2)} s apart.`} Task: ${tasks[taskIdx].text}`);
    }
  }

  const stop = loop((dt) => {
    if (run && alive && !run.done) {
      const anyLanded = run.objs.some((o) => o.landed != null);
      const rate = anyLanded ? 4 : 0.5; // slow motion, then fast-forward the slow faller
      const steps = 20;
      const h = (dt * rate) / steps;
      for (let s = 0; s < steps; s++) {
        run.t += h;
        pair().forEach((o, i) => {
          const b = run.objs[i];
          if (b.landed != null) return;
          const a = air ? G * (1 - (b.v * b.v) / (o.vt * o.vt)) : G;
          b.v += a * h;
          b.y += b.v * h;
          if (b.y >= HEIGHT) { b.y = HEIGHT; b.landed = run.t; sfx.click(); }
        });
      }
      if (run.objs.every((o) => o.landed != null) && !run.done) {
        run.done = true;
        finished();
      }
    }
    const { ctx } = st;
    ctx.fillStyle = '#2a2438';
    ctx.fillRect(0, 0, W, H);
    // the chamber
    ctx.fillStyle = air ? 'rgba(170,210,255,0.35)' : 'rgba(20,20,30,0.6)';
    ctx.fillRect(60, TOP - 20, 300, FLOOR - TOP + 20);
    if (air) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let i = 0; i < 30; i++) ctx.fillRect(70 + ((i * 89) % 280), TOP + ((i * 37 + Math.floor(performance.now() / 60)) % (FLOOR - TOP)), 2, 2);
    }
    ctx.strokeStyle = '#cfe6ff'; ctx.lineWidth = 4; ctx.strokeRect(60, TOP - 20, 300, FLOOR - TOP + 20);
    ctx.fillStyle = '#555'; ctx.fillRect(50, FLOOR, 320, 12);
    // pump
    ctx.fillStyle = '#777'; ctx.fillRect(360, FLOOR - 40, 50, 40);
    ctx.fillStyle = air ? '#ff6b6b' : '#80ff20'; ctx.fillRect(368, FLOOR - 32, 12, 12);
    text(ctx, 'pump', 385, FLOOR + 12, { size: 10, align: 'center' });
    // height ruler
    for (let m = 0; m <= HEIGHT; m++) {
      const y = TOP + m * pxPerM;
      ctx.fillStyle = '#fff'; ctx.fillRect(40, y, 10, 2);
      text(ctx, `${m} m`, 36, y + 4, { size: 10, align: 'right' });
    }
    tag(ctx, air ? 'AIR' : 'VACUUM', 410, 120, { size: 12, color: air ? '#cfe6ff' : '#80ff20' }); // beside the chamber, clear of the object names
    pair().forEach((o, i) => {
      const x = i === 0 ? 150 : 270;
      const b = run?.objs[i];
      const y = TOP + (b ? b.y : 0) * pxPerM;
      drawSprite(ctx, o.sprite, x, y, o.scale, { anchor: 'center' });
      tag(ctx, o.name, x, TOP - 26 < 14 ? 14 : TOP - 26, { size: 10 });
      if (b?.landed != null) tag(ctx, `${fmt(b.landed, 2)} s`, x, FLOOR - 24, { size: 11, color: '#fcee4b' });
    });
    if (run) tag(ctx, `t = ${fmt(run.t, 2)} s`, 440, 22, { size: 11 });
    if (run && !run.objs.some((o) => o.landed != null)) tag(ctx, 'slow motion', 440, 44, { size: 10 });
  });

  show();
  return () => {
    alive = false;
    stop();
  };
}
