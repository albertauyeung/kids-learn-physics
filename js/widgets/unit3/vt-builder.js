// Velocity–time graph builder. Build a motion from straight pieces, then Drive: the car's
// distance grows exactly as the shaded area under the graph (rectangles + triangles).
// params: { mode: 'multi' | 'single', pieces?: [{ v, dt }] (multi), u, v, t (single),
//           tasks: [{ text, check({ pieces: [{ v0, v1, dt }], total, u, v, t }), test? }] }

import { makeStage, loop, sky, text, tag, slider, button, controls, readout, taskBanner } from '../stage.js';
import { fmt, fmtSigned } from '../../core/util.js';
import { sfx } from '../../core/sound.js';
import { drawRoad, drawCar, taskRunner } from './common.js';

const RECT = 'rgba(74,237,217,0.38)';
const TRI = 'rgba(252,238,75,0.38)';

export default function vtBuilder(el, params = {}, api) {
  const single = params.mode === 'single';
  // Multi: pieces start from rest, each piece starts at the previous end speed.
  const pieces = single
    ? [{ v: params.v ?? 12, dt: params.t ?? 4 }]
    : (params.pieces || [{ v: 10, dt: 4 }, { v: 10, dt: 4 }, { v: 0, dt: 2 }]).map((x) => ({ ...x }));
  let u0 = single ? params.u ?? 4 : 0;
  let sel = 0;
  const W = 480, H = 340, ROAD = 70;
  const TMAX = single ? 10 : 24, VMAX = 20;
  const G = { left: 44, right: W - 14, top: 132, bottom: H - 30 };
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const ro = readout();
  let clock = 0, running = false, driven = null;
  const tasks = taskRunner(params.tasks || [], banner, api, {
    intro: 'Then press <b>Drive</b>.',
    describe: (r) => `the trip was ${fmt(r.total, 2)} m long`,
  });
  if (!(params.tasks || []).length) banner.set('Shape the graph with the sliders, then press <b>Drive</b>.');

  const segs = () => {
    let t = 0, v = u0;
    return pieces.map((pc) => {
      const s = { t0: t, t1: t + pc.dt, v0: v, v1: pc.v, dt: pc.dt };
      t += pc.dt; v = pc.v;
      return s;
    });
  };
  const total = () => segs().reduce((a, s) => a + ((s.v0 + s.v1) / 2) * s.dt, 0);
  const Ttot = () => segs().reduce((a, s) => a + s.dt, 0);
  const vAt = (t) => {
    for (const s of segs()) if (t <= s.t1 + 1e-9) return s.v0 + ((s.v1 - s.v0) * (t - s.t0)) / s.dt;
    return pieces[pieces.length - 1].v;
  };
  const distAt = (t) => {
    let d = 0;
    for (const s of segs()) {
      if (t >= s.t1) d += ((s.v0 + s.v1) / 2) * s.dt;
      else if (t > s.t0) {
        const tau = t - s.t0, a = (s.v1 - s.v0) / s.dt;
        d += s.v0 * tau + 0.5 * a * tau * tau;
      }
    }
    return d;
  };

  const reset = () => {
    clock = 0; running = false; driven = null;
    show();
  };

  // ---------- controls ----------
  const box = controls();
  let sv, sd, su;
  const pieceBtns = [];
  if (single) {
    su = slider({ label: 'Start speed u', min: 0, max: 20, step: 1, value: u0, unit: 'm/s', onInput: (x) => { u0 = x; reset(); } });
    sv = slider({ label: 'End speed v', min: 0, max: 20, step: 1, value: pieces[0].v, unit: 'm/s', onInput: (x) => { pieces[0].v = x; reset(); } });
    sd = slider({ label: 'Time t', min: 1, max: 10, step: 1, value: pieces[0].dt, unit: 's', onInput: (x) => { pieces[0].dt = x; reset(); } });
    box.append(su.el, sv.el, sd.el);
  } else {
    const pick = (i) => {
      sel = i;
      pieceBtns.forEach((b, k) => { b.className = `mc-btn small ${k === i ? 'green' : ''}`; b.setAttribute('aria-pressed', String(k === i)); });
      sv.value = pieces[i].v;
      sd.value = pieces[i].dt;
    };
    sv = slider({ label: 'End speed of this piece', min: 0, max: 20, step: 1, value: pieces[0].v, unit: 'm/s', onInput: (x) => { pieces[sel].v = x; reset(); } });
    sd = slider({ label: 'Time for this piece', min: 1, max: 8, step: 1, value: pieces[0].dt, unit: 's', onInput: (x) => { pieces[sel].dt = x; reset(); } });
    pieces.forEach((_, i) => pieceBtns.push(button(`Piece ${i + 1}`, () => { pick(i); sfx.select(); })));
    box.append(...pieceBtns, sv.el, sd.el);
    pick(0);
  }
  const go = button('▶ Drive', () => {
    clock = 0; driven = null; running = true;
    sfx.click();
    show();
  }, 'green');
  el.append(box, controls(go), ro.el);

  function pieceText(s) {
    const lo = Math.min(s.v0, s.v1), hi = Math.max(s.v0, s.v1);
    const area = ((s.v0 + s.v1) / 2) * s.dt;
    if (lo === hi) return `rectangle ${s.dt} × ${lo} = ${fmt(area, 2)} m`;
    if (lo === 0) return `triangle ½ × ${s.dt} × ${hi} = ${fmt(area, 2)} m`;
    return `rectangle ${s.dt} × ${lo} + triangle ½ × ${s.dt} × ${hi - lo} = ${fmt(area, 2)} m`;
  }

  function show() {
    const ss = segs();
    if (!driven) {
      ro.set([
        ['Graph', single ? `${u0} m/s → ${pieces[0].v} m/s in ${pieces[0].dt} s` : `${fmt(Ttot())} s of driving`],
        ['Distance', running ? `${fmt(distAt(clock), 1)} m so far...` : 'press Drive to measure it'],
      ]);
      return;
    }
    ro.set([
      ...ss.map((s, i) => [single ? 'Slope = acceleration' : `Piece ${i + 1} slope`, `(${s.v1} − ${s.v0}) ÷ ${s.dt} = ${fmtSigned((s.v1 - s.v0) / s.dt, 2)} m/s²`]),
      ...ss.map((s, i) => [single ? 'Area' : `Piece ${i + 1} area`, pieceText(s)]),
      single && ['½(u + v)t', `½ × (${u0} + ${pieces[0].v}) × ${pieces[0].dt} = ${fmt(total(), 2)} m`],
      ['Total area = distance driven', `${fmt(total(), 2)} m ✔`, 'winner'],
    ]);
  }

  const gx = (t) => G.left + (t / TMAX) * (G.right - G.left);
  const gy = (v) => G.bottom - (v / VMAX) * (G.bottom - G.top);

  const stop = loop((dt, now) => {
    if (running) {
      clock = Math.min(Ttot(), clock + dt * Math.max(1, Ttot() / 6));
      if (clock >= Ttot() - 1e-9) {
        running = false;
        const ss = segs();
        driven = { pieces: ss.map((s) => ({ v0: s.v0, v1: s.v1, dt: s.dt })), total: total(), u: u0, v: pieces[pieces.length - 1].v, t: Ttot() };
        show();
        tasks.run(driven);
      } else if (Math.floor(now * 4) !== Math.floor((now - dt) * 4)) show();
    }
    const { ctx } = st;
    // ---- road strip ----
    sky(ctx, W, ROAD);
    drawRoad(ctx, W, ROAD, 24, 0);
    const L = single ? 200 : total() > 290 ? 500 : 300; // fixed, so the road doesn't give the distance away
    const xOf = (m) => 44 + (m / L) * (W - 84);
    ctx.fillStyle = '#ddd';
    const step = L <= 300 ? 25 : 50;
    for (let m = 0; m <= L; m += step) {
      ctx.fillRect(Math.round(xOf(m)), ROAD + 24, 1, 5);
      text(ctx, `${m}`, xOf(m), ROAD + 40, { size: 9, align: 'center' });
    }
    const d = running || driven ? distAt(clock) : 0;
    drawCar(ctx, xOf(d) - 16, ROAD, 2, running ? Math.sin(now * 30) * 0.5 : 0);
    tag(ctx, `distance ${fmt(d, 1)} m`, W - 70, 18, { size: 11 });
    tag(ctx, `t = ${fmt(clock, 1)} s`, 50, 18, { size: 11 });

    // ---- graph ----
    ctx.fillStyle = '#1b1527';
    ctx.fillRect(0, ROAD + 46, W, H - ROAD - 46);
    ctx.fillStyle = '#26203a';
    ctx.fillRect(G.left, G.top, G.right - G.left, G.bottom - G.top);
    ctx.fillStyle = 'rgba(255,255,255,0.09)';
    for (let t = 0; t <= TMAX; t += 1) ctx.fillRect(Math.round(gx(t)), G.top, 1, G.bottom - G.top);
    for (let v = 0; v <= VMAX; v += 2) ctx.fillRect(G.left, Math.round(gy(v)), G.right - G.left, 1);
    // shaded area, split into rectangles and triangles (only up to the clock while driving)
    ctx.save();
    if (running) {
      ctx.beginPath();
      ctx.rect(G.left, G.top, gx(clock) - G.left, G.bottom - G.top);
      ctx.clip();
    }
    for (const s of segs()) {
      const lo = Math.min(s.v0, s.v1);
      ctx.fillStyle = RECT;
      ctx.fillRect(gx(s.t0), gy(lo), gx(s.t1) - gx(s.t0), gy(0) - gy(lo));
      if (s.v0 !== s.v1) {
        ctx.fillStyle = TRI;
        ctx.beginPath();
        ctx.moveTo(gx(s.t0), gy(lo));
        ctx.lineTo(gx(s.t0), gy(s.v0));
        ctx.lineTo(gx(s.t1), gy(s.v1));
        ctx.lineTo(gx(s.t1), gy(lo));
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
    // piece boundaries
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (const s of segs()) ctx.fillRect(Math.round(gx(s.t1)), gy(Math.max(s.v1, 0)), 1, gy(0) - gy(s.v1));
    // axes and labels
    ctx.fillStyle = '#ddd';
    ctx.fillRect(G.left, G.top, 2, G.bottom - G.top);
    ctx.fillRect(G.left, G.bottom, G.right - G.left, 2);
    const tl = single ? 1 : 2;
    for (let t = 0; t <= TMAX; t += tl) text(ctx, String(t), gx(t), G.bottom + 13, { size: 9, align: 'center' });
    for (let v = 0; v <= VMAX; v += 4) text(ctx, String(v), G.left - 5, gy(v) + 4, { size: 9, align: 'right' });
    text(ctx, 'time (s)', G.right, H - 3, { size: 10, align: 'right', color: '#aaa' });
    text(ctx, 'velocity (m/s)', 4, G.top - 4, { size: 10, color: '#aaa' });
    // the line
    const ss = segs();
    ctx.strokeStyle = '#80ff20';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gx(0), gy(u0));
    for (const s of ss) ctx.lineTo(gx(s.t1), gy(s.v1));
    ctx.stroke();
    if (!single) {
      const s = ss[sel];
      ctx.strokeStyle = '#fcee4b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(gx(s.t0), gy(s.v0));
      ctx.lineTo(gx(s.t1), gy(s.v1));
      ctx.stroke();
      ss.forEach((sg, i) => tag(ctx, String(i + 1), (gx(sg.t0) + gx(sg.t1)) / 2, Math.min(gy(sg.v0), gy(sg.v1)) - 6, { size: 10, color: i === sel ? '#fcee4b' : '#ddd' }));
    }
    if (running || driven) {
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(Math.round(gx(clock)), G.top, 2, G.bottom - G.top);
      ctx.fillRect(gx(clock) - 4, gy(vAt(clock)) - 4, 8, 8);
    }
  });

  show();
  return stop;
}
