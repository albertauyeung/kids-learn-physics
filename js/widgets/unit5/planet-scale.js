// "Weigh yourself on other worlds": Pip stands on bathroom scales on Earth, the Moon, Mars or Jupiter.
// Mass (kg) stays the same everywhere; weight W = m × g (N) changes with the world.
// params: { mass, tasks: [{ text, check(worldId, mass, weight) }], testedAfter?: task index whose success reveals a prediction }

import { makeStage, loop, text, tag, slider, button, controls, readout, taskBanner } from '../stage.js';
import { drawSprite, drawTexture } from '../../core/sprites.js';
import { fmt } from '../../core/util.js';
import { sfx } from '../../core/sound.js';
import { WORLDS, weight } from './physics.js';

const LOOK = {
  earth: { sky: ['#79a6ff', '#93baff', '#b1ceff'], ground: (ctx, y, W) => { for (let x = 0; x < W; x += 20) { drawTexture(ctx, 'grass', x, y, 20, x % 5); drawTexture(ctx, 'dirt', x, y + 20, 20, (x + 3) % 5); drawTexture(ctx, 'dirt', x, y + 40, 20, (x + 1) % 5); } } },
  moon: { sky: ['#06060f', '#0b0b1c', '#141428'], ground: (ctx, y, W) => { for (let x = 0; x < W; x += 20) { drawTexture(ctx, 'stone', x, y, 20, x % 5); drawTexture(ctx, 'stone', x, y + 20, 20, (x + 2) % 5); drawTexture(ctx, 'stone', x, y + 40, 20, (x + 4) % 5); } } },
  mars: { sky: ['#c9875f', '#d89a70', '#e6b48c'], ground: (ctx, y, W) => { ctx.fillStyle = '#b5532d'; ctx.fillRect(0, y, W, 60); ctx.fillStyle = '#9a4423'; for (let x = 0; x < W; x += 20) ctx.fillRect(x + (x % 7), y + 6 + (x % 13), 6, 4); } },
  jupiter: { sky: ['#c99a6a', '#e0c49c', '#b97a4a'], ground: (ctx, y, W) => { ctx.fillStyle = '#b97a4a'; ctx.fillRect(0, y, W, 60); ctx.fillStyle = 'rgba(255,240,220,0.3)'; ctx.fillRect(0, y + 30, W, 10); ctx.fillStyle = '#6b6b78'; ctx.fillRect(40, y, W - 80, 12); ctx.fillStyle = '#4a4a55'; ctx.fillRect(40, y + 12, W - 80, 6); } },
};

export default function planetScale(el, params = {}, api) {
  const tasks = params.tasks || [];
  let taskIdx = 0;
  let world = WORLDS[0];
  let mass = params.mass || 40;
  let shown = 0; // the number on the scale (animates up to the weight)
  let weighed = false;
  const W = 480, H = 260, GROUND = 200;
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const ro = readout();

  const worldBtns = WORLDS.map((w) => {
    const b = button(`${w.name} (g = ${fmt(w.g)})`, () => { world = w; reset(); sfx.select(); });
    return b;
  });
  const massSlider = slider({ label: 'Mass on the scale (Pip 40 kg + his backpack)', min: 40, max: 100, step: 1, value: mass, unit: 'kg', onInput: (v) => { mass = v; reset(); } });
  const weighBtn = button('⚖ Weigh', weigh, 'green');
  el.append(controls(...worldBtns), controls(massSlider.el), controls(weighBtn), ro.el);

  function reset() {
    weighed = false;
    shown = 0;
    show();
  }

  function show() {
    worldBtns.forEach((b, i) => b.classList.toggle('green', WORLDS[i] === world));
    ro.set([
      ['World', `${world.name}: g = ${fmt(world.g)} N/kg`],
      ['Mass (the same everywhere)', `${mass} kg`],
      weighed ? ['Weight W = m × g', `${mass} × ${fmt(world.g)} = ${fmt(weight(mass, world.g))} N`, 'winner'] : ['Weight W = m × g', 'press Weigh'],
    ]);
    if (tasks.length && taskIdx < tasks.length) banner.set(`Task ${taskIdx + 1}/${tasks.length}: ${tasks[taskIdx].text}`);
    else if (!tasks.length) banner.set('Pick a world and a mass, then press <b>Weigh</b>.');
  }

  let lastPass = ''; // settings of the last weigh that completed a task
  function weigh() {
    const key = `${world.id}|${mass}`;
    // A double tap (same settings as the task just completed) must not judge the next task.
    if (key === lastPass && weighed) return;
    weighed = true;
    shown = 0;
    sfx.click();
    show();
    const Wt = weight(mass, world.g);
    if (!tasks.length) { api.done(); return; }
    if (taskIdx >= tasks.length) return;
    if (tasks[taskIdx].check(world.id, mass, Wt)) {
      lastPass = key;
      sfx.correct();
      if (params.testedAfter === taskIdx) api.tested?.();
      taskIdx++;
      if (taskIdx >= tasks.length) {
        banner.set(`All weighing tasks done! Mass never changed — only the weight did. 🎉`, true);
        api.done();
      } else {
        banner.set(`Yes! ${mass} kg on ${world.name} weighs ${fmt(Wt)} N. Next: ${tasks[taskIdx].text}`, true);
      }
    } else {
      sfx.wrong();
      banner.set(`The scale reads ${fmt(Wt)} N (${mass} kg × ${fmt(world.g)} N/kg). Task: ${tasks[taskIdx].text}`);
    }
  }

  const stop = loop((dt) => {
    const target = weighed ? weight(mass, world.g) : 0;
    shown = shown < target ? Math.min(target, shown + Math.max(target, 50) * dt * 3) : target;
    const { ctx } = st;
    const look = LOOK[world.id];
    look.sky.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, (i * GROUND) / 3, W, GROUND / 3 + 1); });
    if (world.id === 'moon') {
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 40; i++) ctx.fillRect((i * 97) % W, (i * 53) % (GROUND - 20), 2, 2);
      // the Earth in the Moon's sky
      ctx.fillStyle = '#3f76e4'; ctx.beginPath(); ctx.arc(400, 50, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5b8731'; ctx.fillRect(392, 40, 10, 8); ctx.fillRect(404, 52, 8, 6);
    }
    if (world.id === 'jupiter') {
      for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? 'rgba(160,90,50,0.35)' : 'rgba(255,240,220,0.25)'; ctx.fillRect(0, 20 + i * 30, W, 14); }
      ctx.fillStyle = 'rgba(190,70,40,0.6)'; ctx.beginPath(); ctx.ellipse(380, 70, 34, 16, 0, 0, Math.PI * 2); ctx.fill();
    }
    look.ground(ctx, GROUND, W);
    // the scale
    const sx = 170;
    ctx.fillStyle = '#e8e8e8'; ctx.fillRect(sx - 44, GROUND - 14, 88, 14);
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(sx - 44, GROUND - 2, 88, 2);
    ctx.fillStyle = '#1b1527'; ctx.fillRect(sx - 26, GROUND - 12, 52, 10);
    // Pip (squashes a little more on big-g worlds)
    const squash = world.g > 10 ? 2 : 0;
    drawSprite(ctx, 'hero', sx, GROUND - 14 + squash, 4);
    if (world.id !== 'earth') {
      ctx.fillStyle = 'rgba(200,230,255,0.35)'; ctx.fillRect(sx - 18, GROUND - 14 - 64 - 4, 36, 34);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(sx - 18, GROUND - 14 - 64 - 4, 36, 34);
    }
    // big display beside the scale
    ctx.fillStyle = '#1b1527'; ctx.fillRect(250, 70, 200, 86);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeRect(250, 70, 200, 86);
    text(ctx, 'SCALE READS', 350, 92, { size: 12, align: 'center', color: '#aaa' });
    text(ctx, weighed ? `${fmt(Math.round(shown * 100) / 100)} N` : '— N', 350, 130, { size: 26, align: 'center', color: '#80ff20', bold: true });
    text(ctx, `mass ${mass} kg`, 350, 150, { size: 11, align: 'center', color: '#fff' });
    tag(ctx, `${world.name}: g = ${fmt(world.g)} N/kg`, 90, 22, { size: 12 });
    if (world.id === 'jupiter') tag(ctx, 'No solid ground: a floating platform in the clouds!', W / 2, H - 8, { size: 10 });
    // weight arrow
    if (weighed) {
      const len = Math.min(70, 10 + Math.sqrt(shown) * 1.6);
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(sx + 26, GROUND - 60, 4, len - 8);
      ctx.beginPath(); ctx.moveTo(sx + 21, GROUND - 60 + len - 8); ctx.lineTo(sx + 35, GROUND - 60 + len - 8); ctx.lineTo(sx + 28, GROUND - 60 + len); ctx.fill();
      tag(ctx, 'W', sx + 44, GROUND - 40, { size: 11, color: '#ff6b6b' });
    }
  });

  show();
  return stop;
}
