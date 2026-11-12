// Drop a stone into a well. A strobe marks where the stone is every second, and a table shows
// how far it fell during each second: 5, 15, 25, 35 m (5 × the odd numbers). v = gt, h = ½gt².
// params: { depth, tasks: [{ text, check(depth, time, speed) }], testedAfter?: task index }

import { makeStage, loop, text, tag, slider, button, controls, readout, taskBanner } from '../stage.js';
import { drawSprite, drawTexture } from '../../core/sprites.js';
import { fmt } from '../../core/util.js';
import { sfx } from '../../core/sound.js';
import { G } from './physics.js';

export default function wellDrop(el, params = {}, api) {
  const tasks = params.tasks || [];
  let taskIdx = 0;
  let depth = params.depth || 45;
  const W = 480, H = 320, TOP = 44, MAXD = 80;
  const px = (H - TOP - 14) / MAXD; // pixels per metre
  const WX = 110, WW = 56; // well shaft
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const ro = readout();
  let t = 0, running = false, splash = null;
  let alive = true;

  const depthSlider = slider({ label: 'Well depth (to the water)', min: 5, max: MAXD, step: 5, value: depth, unit: 'm', onInput: (v) => { depth = v; reset(); } });
  const dropBtn = button('▼ Drop the stone', () => { t = 0; splash = null; running = true; sfx.click(); show(); }, 'green');
  el.append(controls(depthSlider.el), controls(dropBtn), ro.el);

  const fallTime = () => Math.sqrt((2 * depth) / G);

  function reset() {
    t = 0; running = false; splash = null;
    show();
  }

  function show() {
    ro.set([
      ['Time t', `${fmt(t, 2)} s`],
      ['Speed v = g × t', `10 × ${fmt(t, 2)} = ${fmt(G * t, 1)} m/s`],
      ['Fallen h = ½ × g × t²', `5 × ${fmt(t, 2)}² = ${fmt(0.5 * G * t * t, 1)} m`],
      splash && ['Splash!', `after ${fmt(splash.time, 2)} s, at ${fmt(splash.speed, 2)} m/s`, 'winner'],
    ]);
    if (tasks.length && taskIdx < tasks.length) { if (!splash) banner.set(`Task ${taskIdx + 1}/${tasks.length}: ${tasks[taskIdx].text}`); }
    else if (!tasks.length) banner.set('Set the depth and drop the stone. Watch the strobe marks every second.');
  }

  function landed() {
    splash = { time: fallTime(), speed: G * fallTime() };
    sfx.boom();
    show();
    if (!tasks.length) { api.done(); return; }
    if (taskIdx >= tasks.length) return;
    if (tasks[taskIdx].check(depth, splash.time, splash.speed)) {
      sfx.correct();
      if (params.testedAfter === taskIdx) api.tested?.();
      taskIdx++;
      if (taskIdx >= tasks.length) {
        banner.set(`Splash after ${fmt(splash.time, 2)} s! All well tasks done! 🎉`, true);
        api.done();
      } else {
        banner.set(`Splash after ${fmt(splash.time, 2)} s at ${fmt(splash.speed, 2)} m/s. Next: ${tasks[taskIdx].text}`, true);
      }
    } else {
      sfx.wrong();
      banner.set(`Splash after ${fmt(splash.time, 2)} s at ${fmt(splash.speed, 2)} m/s. Task: ${tasks[taskIdx].text}`);
    }
  }

  const yOf = (m) => TOP + m * px;

  const stop = loop((dt) => {
    if (running && alive) {
      t += dt;
      if (t >= fallTime()) {
        t = fallTime();
        running = false;
        landed();
      } else {
        show();
      }
    }
    const { ctx } = st;
    // sky and ground
    ctx.fillStyle = '#93baff'; ctx.fillRect(0, 0, W, TOP);
    for (let x = 0; x < W; x += 16) {
      for (let y = TOP; y < H; y += 16) drawTexture(ctx, y === TOP ? 'grass' : y < TOP + 64 ? 'dirt' : 'stone', x, y, 16, (x + y) % 5);
    }
    // the shaft
    const bottom = yOf(depth);
    ctx.fillStyle = '#15121c'; ctx.fillRect(WX, TOP, WW, bottom - TOP);
    ctx.fillStyle = '#3f76e4'; ctx.fillRect(WX, bottom, WW, 10);
    ctx.fillStyle = '#7a7a7a'; ctx.fillRect(WX - 8, TOP - 12, 8, 12); ctx.fillRect(WX + WW, TOP - 12, 8, 12);
    // depth ruler beside the shaft
    for (let m = 0; m <= depth; m += 5) {
      const y = yOf(m);
      ctx.fillStyle = '#fff'; ctx.fillRect(WX - 14, y, m % 20 === 0 ? 10 : 5, 2);
      if (m % 20 === 0) text(ctx, `${m} m`, WX - 18, y + 4, { size: 10, align: 'right' });
    }
    // strobe: where the stone was at each whole second
    const marks = [];
    for (let s = 1; s <= Math.floor(t + 1e-9); s++) marks.push(s);
    for (const s of marks) {
      const y = yOf(0.5 * G * s * s);
      ctx.globalAlpha = 0.45;
      drawSprite(ctx, 'u5stone', WX + WW / 2, y, 3, { anchor: 'center' });
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fcee4b'; ctx.fillRect(WX + WW, y, 14, 2);
      tag(ctx, `${s} s: ${5 * s * s} m`, WX + WW + 18, y + 5, { size: 10, align: 'left', color: '#fcee4b' });
    }
    const y = yOf(Math.min(depth, 0.5 * G * t * t));
    if (!splash) drawSprite(ctx, 'u5stone', WX + WW / 2, y, 3, { anchor: 'center' });
    else {
      ctx.fillStyle = '#cfe6ff';
      for (let i = -2; i <= 2; i++) ctx.fillRect(WX + WW / 2 + i * 8, bottom - 6 - (2 - Math.abs(i)) * 4, 3, 6);
    }
    drawSprite(ctx, 'hero', WX - 40, TOP, 2);
    // table: distance fallen during each second
    const tx = 300, ty = 60;
    ctx.fillStyle = 'rgba(20,18,29,0.85)'; ctx.fillRect(tx, ty, 168, 34 + 22 * 4);
    text(ctx, 'During second…  it fell', tx + 8, ty + 20, { size: 11, color: '#aaa' });
    for (let s = 1; s <= 4; s++) {
      const seen = marks.includes(s);
      text(ctx, `${['1st', '2nd', '3rd', '4th'][s - 1]}`, tx + 12, ty + 22 + 22 * s, { size: 12 });
      text(ctx, seen ? `${5 * (2 * s - 1)} m` : '?', tx + 150, ty + 22 + 22 * s, { size: 12, align: 'right', color: seen ? '#80ff20' : '#666' });
    }
    tag(ctx, `t = ${fmt(t, 2)} s`, 440, 20, { size: 12 });
  });

  show();
  return () => {
    alive = false;
    stop();
  };
}
