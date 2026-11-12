// Throw a ball straight up (no air). It slows by 10 m/s every second, stops at the top after u ÷ g
// and comes back down with the same speed (symmetry). A height–time graph is drawn as it flies.
// Window mode adds a window at a chosen height: the ball passes it twice — the two roots of
// h = ut − 5t².
// params: { mode: 'basic' | 'window', u, hw, tasks: [{ text, check(u, hw, result) }], testedAfter?: task index }

import { makeStage, loop, text, tag, slider, button, controls, readout, taskBanner } from '../stage.js';
import { drawSprite, drawTexture } from '../../core/sprites.js';
import { fmt } from '../../core/util.js';
import { sfx } from '../../core/sound.js';
import { G, passTimes } from './physics.js';

export default function throwUp(el, params = {}, api) {
  const mode = params.mode || 'basic';
  const tasks = params.tasks || [];
  let taskIdx = 0;
  let u = params.u || 20;
  let hw = params.hw || 10; // window height
  const W = 480, H = 320, GROUND = 296, TOPY = 34, HMAX = 45, TMAX = 6;
  const LAUNCH = GROUND - 24; // heights are measured from the top of the dispenser
  const py = (LAUNCH - TOPY) / HMAX;
  const yOf = (h) => LAUNCH - h * py;
  const GX0 = 238, GX1 = 466;
  const gx = (t) => GX0 + (t / TMAX) * (GX1 - GX0);
  const BX = 110; // ball column
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const ro = readout();
  let t = 0, running = false, result = null;
  let alive = true;

  const uSlider = slider({ label: 'Launch speed (up)', min: 5, max: 30, step: 1, value: u, unit: 'm/s', onInput: (v) => { u = v; reset(); } });
  const wSlider = mode === 'window' ? slider({ label: 'Window height', min: 5, max: 45, step: 5, value: hw, unit: 'm', onInput: (v) => { hw = v; reset(); } }) : null;
  const throwBtn = button('▲ Fire!', () => { t = 0; result = null; running = true; sfx.click(); show(); }, 'green');
  el.append(controls(uSlider.el, wSlider ? wSlider.el : ''), controls(throwBtn), ro.el);

  const flight = () => (2 * u) / G;
  const heightAt = (tt) => u * tt - 0.5 * G * tt * tt;

  function reset() {
    t = 0; running = false; result = null;
    show();
  }

  function passText(times) {
    if (!times.length) return 'never gets that high';
    if (times.length === 1) return `just touches it at ${fmt(times[0], 2)} s (at the top)`;
    return `${fmt(times[0], 2)} s (going up) and ${fmt(times[1], 2)} s (coming down)`;
  }

  function show() {
    const v = u - G * t;
    const now = running || result
      ? `${fmt(Math.abs(v), 1)} m/s ${Math.abs(v) < 0.05 ? '(stopped at the top)' : v > 0 ? 'up' : 'down'}`
      : '—';
    const rows = [
      ['Launch speed u', `${u} m/s up`],
      ['Speed now', now],
    ];
    // Window mode hides the top height: it would give away the "just touch the window" task.
    if (mode !== 'window') {
      rows.push(
        result ? ['Time to top = u ÷ g', `${u} ÷ 10 = ${fmt(u / G, 2)} s`] : ['Time to top', 'fire to find out'],
        result ? ['Max height = u² ÷ 2g', `${u * u} ÷ 20 = ${fmt((u * u) / (2 * G), 2)} m`] : ['Max height', 'fire to find out'],
      );
    }
    if (mode === 'window') rows.push(['Window', `${hw} m up`], result && ['Passes the window at', passText(result.passes), 'winner']);
    else rows.push(result && ['Back at the start', `after ${fmt(flight(), 2)} s, moving down at ${u} m/s`, 'winner']);
    ro.set(rows);
    if (tasks.length && taskIdx < tasks.length) { if (!result) banner.set(`Task ${taskIdx + 1}/${tasks.length}: ${tasks[taskIdx].text}`); }
    else if (!tasks.length) banner.set('Choose a launch speed and press <b>Fire!</b>');
  }

  function caught() {
    result = { top: (u * u) / (2 * G), flight: flight(), passes: passTimes(u, hw) };
    show();
    if (!tasks.length) { api.done(); return; }
    if (taskIdx >= tasks.length) return;
    if (tasks[taskIdx].check(u, hw, result)) {
      sfx.correct();
      if (params.testedAfter === taskIdx) api.tested?.();
      taskIdx++;
      if (taskIdx >= tasks.length) {
        banner.set('All throwing tasks done! 🎉', true);
        api.done();
      } else {
        banner.set(`Yes! Next: ${tasks[taskIdx].text}`, true);
      }
    } else {
      sfx.wrong();
      const what = mode === 'window' ? `It passed the window: ${passText(result.passes)}.` : `Top ${fmt(result.top, 2)} m, in the air ${fmt(result.flight, 2)} s.`;
      banner.set(`${what} Task: ${tasks[taskIdx].text}`);
    }
  }

  const stop = loop((dt) => {
    if (running && alive) {
      t += dt * 1.5;
      if (t >= flight()) {
        t = flight();
        running = false;
        sfx.click();
        caught();
      } else show();
    }
    const { ctx } = st;
    // sky + ground
    ['#79a6ff', '#86b0ff', '#93baff', '#a2c4ff', '#b1ceff'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, (i * GROUND) / 5, W, GROUND / 5 + 1); });
    for (let x = 0; x < W; x += 16) { drawTexture(ctx, 'grass', x, GROUND, 16, x % 5); drawTexture(ctx, 'dirt', x, GROUND + 16, 16, (x + 1) % 5); }
    // height ruler
    for (let h = 0; h <= HMAX; h += 5) {
      const y = yOf(h);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(40, y, h % 10 === 0 ? 10 : 5, 2);
      if (h % 10 === 0) text(ctx, `${h} m`, 37, y + 4, { size: 10, align: 'right' });
    }
    // window (on a tower beside the ball's path)
    if (mode === 'window') {
      const y = yOf(hw);
      ctx.fillStyle = '#9a9a9a'; ctx.fillRect(BX + 24, yOf(HMAX), 40, GROUND - yOf(HMAX));
      ctx.fillStyle = '#4ad0ff'; ctx.fillRect(BX + 30, y - 10, 28, 20);
      ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 3; ctx.strokeRect(BX + 30, y - 10, 28, 20);
      ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(74,208,255,0.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(BX - 20, y); ctx.lineTo(GX1, y); ctx.stroke(); ctx.setLineDash([]);
    }
    // graph
    ctx.fillStyle = 'rgba(20,18,29,0.75)'; ctx.fillRect(GX0 - 6, TOPY - 10, GX1 - GX0 + 12, GROUND - TOPY + 14);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let s = 0; s <= TMAX; s++) ctx.fillRect(gx(s), TOPY, 1, GROUND - TOPY);
    for (let h = 0; h <= HMAX; h += 5) ctx.fillRect(GX0, yOf(h), GX1 - GX0, 1);
    for (let s = 0; s <= TMAX; s++) text(ctx, `${s}`, gx(s), GROUND - 4, { size: 9, align: 'center', color: '#ccc' });
    text(ctx, 'height–time graph', GX0 + 2, TOPY + 4, { size: 10, color: '#ccc' });
    text(ctx, 'time (s)', GX1 - 2, GROUND - 14, { size: 9, align: 'right', color: '#ccc' });
    if (running || result) {
      ctx.strokeStyle = '#80ff20'; ctx.lineWidth = 3; ctx.beginPath();
      for (let k = 0; k <= 60; k++) {
        const tt = (t * k) / 60;
        const X = gx(tt), Y = yOf(Math.max(0, heightAt(tt)));
        if (k) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
      }
      ctx.stroke();
      // strobe: where the ball was at each whole second, with its speed
      for (let s = 1; s <= Math.floor(t + 1e-9); s++) {
        const hs = heightAt(s);
        if (hs < 0) continue;
        const vs = u - G * s;
        ctx.globalAlpha = 0.45;
        drawSprite(ctx, 'u5ball', BX, yOf(hs), 2, { anchor: 'center' });
        ctx.globalAlpha = 1;
        tag(ctx, `${s} s: ${Math.abs(vs) < 1e-9 ? '0' : `${fmt(Math.abs(vs))}${vs > 0 ? '↑' : '↓'}`}`, BX - 34, yOf(hs) + 4, { size: 9, color: '#fcee4b' });
        ctx.fillStyle = '#fcee4b'; ctx.fillRect(gx(s) - 2, yOf(hs) - 2, 5, 5);
      }
      if (mode === 'window' && result) {
        for (const [i, tp] of result.passes.entries()) {
          ctx.fillStyle = '#4ad0ff'; ctx.fillRect(gx(tp) - 4, yOf(hw) - 4, 8, 8);
          tag(ctx, `${fmt(tp, 2)} s`, gx(tp), yOf(hw) - 10 - (i % 2) * 14, { size: 10, color: '#4ad0ff' });
        }
      }
    }
    // the dispenser block the ball is fired from
    ctx.fillStyle = '#7f7f7f'; ctx.fillRect(BX - 12, GROUND - 24, 24, 24);
    ctx.fillStyle = '#5a5a5a'; ctx.fillRect(BX - 12, GROUND - 24, 24, 3); ctx.fillRect(BX - 12, GROUND - 3, 24, 3);
    ctx.fillStyle = '#222'; ctx.fillRect(BX - 5, GROUND - 22, 10, 6);
    drawSprite(ctx, 'hero', BX - 34, GROUND, 2);
    const hb = running || result ? Math.max(0, heightAt(t)) : 0;
    drawSprite(ctx, 'u5ball', BX, yOf(hb) - 6, 2, { anchor: 'center' });
    tag(ctx, `t = ${fmt(t, 2)} s`, 180, 20, { size: 11 });
  });

  show();
  return () => {
    alive = false;
    stop();
  };
}
