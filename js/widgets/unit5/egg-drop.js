// Boss: Egg Drop Lab. An egg rides in a 10 kg "Egg Lander" pod (weight 100 N), dropped from a tower.
// No parachute: we ignore air for the heavy pod, so v² = 2gh and h = ½gt².
// With a parachute (drag = D × v²) it speeds up until drag = weight (terminal speed √(100 ÷ D)),
// then falls steadily: time ≈ height ÷ terminal speed.
// Three randomised rounds (see eggRound in physics.js): highest safe height, exact landing time, pick the parachute.
// params: { rounds, seed }

import { makeStage, loop, text, tag, slider, button, controls, readout, taskBanner } from '../stage.js';
import { drawSprite, drawTexture } from '../../core/sprites.js';
import { fmt, makeRng, randomSeed } from '../../core/util.js';
import { sfx } from '../../core/sound.js';
import { CHUTES, POD_WEIGHT, eggRound, judgeEgg, eggState, chuteTerminal } from './physics.js';

export default function eggDrop(el, params = {}, api) {
  const rng = makeRng(params.seed ?? randomSeed());
  const totalRounds = params.rounds || 3;
  const order = rng.shuffle(['safe', 'timed', 'chute']);
  let roundNo = 0;
  let round = eggRound(order[0], rng);
  let h = 40, chuteId = 'none';
  const W = 480, H = 320, GROUND = 290, TOPY = 26, HMAX = 80;
  const py = (GROUND - TOPY) / HMAX;
  const yOf = (m) => GROUND - m * py;
  const TX = 40, TW = 60, PX = 160; // tower and drop line
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const ro = readout();
  let drop = null; // { t, rate, verdict }
  let alive = true;

  const hSlider = slider({ label: 'Drop height (window)', min: 5, max: HMAX, step: 5, value: h, unit: 'm', onInput: (v) => { h = v; drop = null; show(); } });
  const chuteBtns = CHUTES.map((c) => button(c.D ? `${c.name}: drag = ${c.D} × v²` : 'No parachute', () => { chuteId = c.id; drop = null; sfx.select(); show(); }));
  const dropBtn = button('🥚 Drop!', () => {
    if (drop && !drop.landed) return;
    const verdict = judgeEgg(round, h, chuteId);
    drop = { t: 0, rate: Math.max(1, verdict.out.time / 5), verdict, landed: false };
    sfx.click();
    show();
  }, 'green');
  el.append(controls(hSlider.el), controls(...chuteBtns), controls(dropBtn), ro.el);

  function setupRound() {
    drop = null;
    if (round.type === 'chute') { h = round.H; chuteId = 'none'; } else { chuteId = 'none'; h = 40; }
    hSlider.value = h;
    hSlider.disabled = round.type === 'chute';
    chuteBtns.forEach((b, i) => { b.disabled = round.type !== 'chute' && CHUTES[i].id !== 'none'; });
    show();
  }

  function goalText() {
    const n = `Round ${roundNo + 1}/${totalRounds}:`;
    if (round.type === 'safe') return `${n} No parachute. The pod survives landings up to <b>${round.S} m/s</b>. Drop it from the <b>highest</b> window that is still safe!`;
    if (round.type === 'timed') return `${n} No parachute. The slow-motion camera films exactly <b>${round.T} s</b> after you let go. Choose the window so the pod lands at exactly ${round.T} s!`;
    return `${n} Drop from the <b>${round.H} m</b> window. The egg must land at <b>${round.S} m/s or less</b>, within <b>${fmt(round.T)} s</b>. Choose the parachute! (pod weight ${POD_WEIGHT} N)`;
  }

  function show() {
    const chute = CHUTES.find((c) => c.id === chuteId);
    chuteBtns.forEach((b, i) => b.classList.toggle('green', CHUTES[i].id === chuteId));
    const out = drop?.landed ? drop.verdict.out : null;
    ro.set([
      ['Egg Lander pod', `mass 10 kg, weight ${POD_WEIGHT} N`],
      ['Drop height', `${h} m`],
      ['Parachute', chute.D ? `${chute.name}: drag = ${chute.D} × v²` : 'none (ignore air)'],
      out && ['Landed at', `${fmt(out.v, 2)} m/s after ${fmt(out.time, 2)} s`, drop.verdict.ok ? 'winner' : 'trap'],
    ]);
    if (!drop?.landed) banner.set(goalText());
  }

  function landed() {
    const { verdict } = drop;
    const { out } = verdict;
    show();
    if (verdict.ok) {
      sfx.correct();
      roundNo++;
      const msg = round.type === 'safe'
        ? `Perfect: ${fmt(out.v, 2)} m/s from ${h} m — the highest safe drop (h = v² ÷ 2g = ${round.S * round.S} ÷ 20).`
        : round.type === 'timed'
          ? `Right on cue at ${fmt(out.time, 2)} s! (h = 5 × ${round.T}² = ${h} m)`
          : `Safe at ${fmt(out.v, 2)} m/s in ${fmt(out.time, 2)} s. (Terminal speed √(${POD_WEIGHT} ÷ ${CHUTES.find((c) => c.id === chuteId).D}) = ${fmt(chuteTerminal(CHUTES.find((c) => c.id === chuteId)), 2)} m/s)`;
      if (roundNo >= totalRounds) {
        banner.set(`${msg} Every egg survived — you are an Egg Drop Engineer! 🏆`, true);
        api.done();
      } else {
        banner.set(`${msg} Next round…`, true);
        setTimeout(() => {
          if (!alive) return;
          round = eggRound(order[roundNo % order.length], rng);
          setupRound();
        }, 2200);
      }
      return;
    }
    sfx.wrong();
    const why = {
      smash: `SPLAT! It hit the ground at ${fmt(out.v, 2)} m/s — faster than ${round.S} m/s.${round.type === 'safe' ? ' Use v² = 2gh to find the highest safe height.' : ' Find each parachute\'s terminal speed: drag = weight.'}`,
      low: `Safe (${fmt(out.v, 2)} m/s), but you can go higher! Which height gives exactly ${round.S} m/s? (v² = 2gh)`,
      early: `It landed after ${fmt(out.time, 2)} s — too soon. You need ${round.T} s: h = ½gt².`,
      late: round.type === 'timed'
        ? `It landed after ${fmt(out.time, 2)} s — too late. You need ${round.T} s: h = ½gt².`
        : `Safe at ${fmt(out.v, 2)} m/s, but it took ${fmt(out.time, 2)} s — longer than ${fmt(round.T)} s. Time ≈ height ÷ terminal speed.`,
    }[verdict.why];
    banner.set(why);
  }

  const stop = loop((dt) => {
    if (drop && !drop.landed && alive) {
      drop.t += dt * drop.rate;
      if (drop.t >= drop.verdict.out.time) {
        drop.t = drop.verdict.out.time;
        drop.landed = true;
        landed();
      }
    }
    const { ctx } = st;
    ['#79a6ff', '#86b0ff', '#93baff', '#a2c4ff', '#b1ceff'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, (i * GROUND) / 5, W, GROUND / 5 + 1); });
    for (let x = 0; x < W; x += 16) { drawTexture(ctx, 'grass', x, GROUND, 16, x % 5); drawTexture(ctx, 'dirt', x, GROUND + 16, 16, (x + 2) % 5); }
    // tower with a window every 5 m
    for (let y = yOf(HMAX) - 6; y < GROUND; y += 16) for (let x = TX; x < TX + TW; x += 16) drawTexture(ctx, 'stone', x, y, 16, (x + y) % 5);
    for (let m = 5; m <= HMAX; m += 5) {
      const y = yOf(m);
      ctx.fillStyle = m === h ? '#fcee4b' : '#2a2438';
      ctx.fillRect(TX + TW - 14, y - 5, 12, 8);
      if (m % 10 === 0) text(ctx, `${m} m`, TX - 4, y + 4, { size: 10, align: 'right' });
    }
    // ledge at the chosen height
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(TX + TW, yOf(h), PX - TX - TW + 14, 4);
    drawSprite(ctx, 'hero', TX + TW + 12, yOf(h), 1.5);
    // foam landing pad
    ctx.fillStyle = '#ffcf3a'; ctx.fillRect(PX - 26, GROUND - 6, 52, 6);
    // the pod
    const chute = CHUTES.find((c) => c.id === chuteId);
    let y = yOf(h), v = 0;
    if (drop) {
      const s = eggState(drop.t, chute);
      y = yOf(Math.max(0, h - s.y));
      v = s.v;
    }
    const broken = drop?.landed && !drop.verdict.ok && drop.verdict.why === 'smash';
    if (chute.D && (!drop || !drop.landed || drop.verdict.ok)) drawSprite(ctx, 'u5chute', PX, y - 24, 1.5 + Math.min(2.5, Math.log10(chute.D + 1)));
    if (broken) {
      ctx.fillStyle = '#fcee4b'; ctx.fillRect(PX - 16, GROUND - 4, 32, 4);
      ctx.fillStyle = '#f7efdc'; ctx.fillRect(PX - 22, GROUND - 6, 8, 4); ctx.fillRect(PX + 12, GROUND - 7, 9, 4);
      tag(ctx, 'SPLAT!', PX, GROUND - 30, { size: 14, color: '#ff6b6b' });
    } else {
      drawSprite(ctx, 'u5pod', PX, y + (drop ? 0 : 0), 3);
    }
    if (drop?.landed && drop.verdict.ok) tag(ctx, 'SAFE!', PX, GROUND - 40, { size: 14, color: '#80ff20' });
    // info panel
    const ix = 250;
    ctx.fillStyle = 'rgba(20,18,29,0.82)'; ctx.fillRect(ix, 40, 220, 118);
    text(ctx, `ROUND ${Math.min(roundNo + 1, totalRounds)} / ${totalRounds}`, ix + 10, 60, { size: 12, color: '#fcee4b' });
    const goal = round.type === 'safe' ? [`Land at ≤ ${round.S} m/s`, 'from the HIGHEST window']
      : round.type === 'timed' ? [`Land after exactly ${round.T} s`, 'no parachute']
        : [`From ${round.H} m: land ≤ ${round.S} m/s`, `within ${fmt(round.T)} s`];
    text(ctx, goal[0], ix + 10, 84, { size: 12 });
    text(ctx, goal[1], ix + 10, 104, { size: 12 });
    text(ctx, `speed ${fmt(v, 1)} m/s`, ix + 10, 128, { size: 12, color: '#4aedd9' });
    text(ctx, `time ${fmt(drop ? drop.t : 0, 2)} s`, ix + 10, 148, { size: 12, color: '#4aedd9' });
  });

  setupRound();
  return () => {
    alive = false;
    stop();
  };
}
