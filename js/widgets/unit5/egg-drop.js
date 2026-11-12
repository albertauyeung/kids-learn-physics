// Boss: Egg Drop Lab. An egg rides in a 10 kg "Egg Lander" pod (weight 100 N), dropped from a tower.
// No parachute: we ignore air for the heavy pod, so v² = 2gh and h = ½gt².
// With a parachute (drag = D × v²) the lab pretends the pod speeds up at full g until drag = weight
// (terminal speed √(100 ÷ D)), then falls steadily: time ≈ height ÷ terminal speed.
// Three randomised rounds (eggRound in physics.js). Each round allows 3 tries; a miss only says the
// direction ("too fast", "too early"…). After 3 misses the worked solution is shown and a new round
// with fresh numbers starts (the round counter does not advance).
// params: { rounds, seed }

import { makeStage, loop, text, tag, slider, button, controls, readout, taskBanner } from '../stage.js';
import { drawSprite, drawTexture } from '../../core/sprites.js';
import { fmt, makeRng, randomSeed } from '../../core/util.js';
import { sfx } from '../../core/sound.js';
import { POD_WEIGHT, D_MAX, MAX_TRIES, eggRound, judgeEgg, eggState, eggSolution } from './physics.js';

export default function eggDrop(el, params = {}, api) {
  const rng = makeRng(params.seed ?? randomSeed());
  const totalRounds = params.rounds || 3;
  const order = rng.shuffle(['safe', 'timed', 'chute']);
  let roundNo = 0; // the round on screen (0-based)
  let wins = 0;
  let tries = 0;
  let pendingNext = false; // a round was just won: wait for the next one
  let nextTimer = 0;
  let round = eggRound(order[0], rng);
  let h = 40, D = 0;
  let finished = false;
  const W = 480, H = 300, GROUND = 272, TOPY = 34, HMAX = 100; // answers are at most 80 m: never a slider end
  const py = (GROUND - TOPY) / HMAX;
  const yOf = (m) => GROUND - m * py;
  const TX = 40, TW = 60, PX = 160; // tower and drop line
  const banner = taskBanner();
  el.append(banner.el);
  const st = makeStage(el, W, H);
  const ro = readout();
  let drop = null; // { t, rate, verdict, landed }
  let alive = true;

  // No changes while the pod is falling or the next round is loading (a change would cancel a drop for free).
  const busy = () => finished || pendingNext || (drop && !drop.landed);
  const hSlider = slider({ label: 'Drop height (window)', min: 5, max: HMAX, step: 5, value: h, unit: 'm', onInput: (v) => { if (busy()) { hSlider.value = h; return; } h = v; drop = null; show(); } });
  const dSlider = slider({
    label: 'Parachute', min: 0, max: D_MAX, step: 1, value: D,
    format: (v) => (v === 0 ? 'none' : `drag = ${v} × v²`), onInput: (v) => { if (busy()) { dSlider.value = D; return; } D = v; drop = null; show(); },
  });
  function lockControls() {
    const b = busy();
    hSlider.disabled = b || round.type === 'chute';
    dSlider.disabled = b || round.type !== 'chute';
    dropBtn.disabled = finished || pendingNext || (drop && !drop.landed);
  }
  let revealed = null; // the worked solution, shown after 3 misses until he asks for a new challenge
  const dropBtn = button('🥚 Drop!', () => {
    if (revealed) {
      revealed = null;
      dropBtn.textContent = '🥚 Drop!';
      round = eggRound(round.type, rng, round);
      setupRound();
      return;
    }
    if (busy()) return;
    const verdict = judgeEgg(round, h, D);
    drop = { t: 0, rate: Math.max(1, verdict.out.time / 5), verdict, landed: false };
    sfx.click();
    lockControls();
    show();
  }, 'green');
  // The short goal sits in the readout, right beside the controls (also on a narrow iPad screen).
  el.append(ro.el, controls(hSlider.el, dSlider.el), controls(dropBtn));

  function setupRound() {
    drop = null;
    tries = 0;
    h = round.type === 'chute' ? round.H : 40;
    D = 0;
    hSlider.value = h;
    dSlider.value = D;
    lockControls();
    show();
  }

  function shortGoal() {
    if (round.type === 'safe') return `No parachute. Land at ${round.S} m/s or less, from the HIGHEST safe window`;
    if (round.type === 'timed') return `No parachute. Land exactly ${round.T} s after letting go`;
    return `From ${round.H} m: land at ${round.S} m/s or less, within ${fmt(round.T)} s`;
  }

  function goalText() {
    const n = `Round ${roundNo + 1}/${totalRounds}:`;
    if (round.type === 'safe') return `${n} No parachute. The pod survives landings up to <b>${round.S} m/s</b>. Drop it from the <b>highest</b> window that is still safe!`;
    if (round.type === 'timed') return `${n} No parachute. The slow-motion camera films exactly <b>${round.T} s</b> after you let go. Choose the window so the pod lands at exactly ${round.T} s!`;
    return `${n} Drop from the <b>${round.H} m</b> window. The egg must land at <b>${round.S} m/s or less</b>, within <b>${fmt(round.T)} s</b>. Choose the parachute's drag number D! (pod weight ${POD_WEIGHT} N)`;
  }

  function show() {
    const res = drop?.landed ? (drop.verdict.ok ? 'SAFE ✔' : { fast: 'too fast — cracked ✘', low: 'safe, but too low ✘', early: 'too early ✘', late: 'too late ✘', slow: 'too slow ✘' }[drop.verdict.why]) : null;
    ro.set([
      ['Goal', shortGoal(), 'winner'],
      ['Try', `${Math.min(tries + 1, MAX_TRIES)} of ${MAX_TRIES}`],
      ['Egg Lander pod', `mass 10 kg, weight ${POD_WEIGHT} N`],
      ['Drop height', `${h} m`],
      ['Parachute', D ? `drag = ${D} × v²` : 'none (ignore air)'],
      res && ['Result', res, drop.verdict.ok ? 'winner' : 'trap'],
      revealed && ['How to work it out', revealed, 'winner'],
    ]);
    if (!drop?.landed && !finished) banner.set(goalText());
  }

  function landed() {
    const { verdict } = drop;
    if (verdict.ok) {
      sfx.correct();
      wins++;
      show();
      const msg = round.type === 'safe'
        ? `Perfect: the highest safe drop (h = v² ÷ 2g = ${round.S * round.S} ÷ 20 = ${round.answerH} m).`
        : round.type === 'timed'
          ? `Right on cue! (h = 5 × ${round.T}² = ${round.answerH} m)`
          : `Safe and on time! (D from ${round.answers[0]} to ${round.answers[round.answers.length - 1]} works.)`;
      if (wins >= totalRounds) {
        finished = true;
        lockControls();
        banner.set(`${msg} Every egg survived — you are an Egg Drop Engineer! 🏆`, true);
        api.done();
      } else {
        pendingNext = true;
        lockControls();
        banner.set(`${msg} Next round…`, true);
        nextTimer = setTimeout(() => {
          if (!alive) return;
          pendingNext = false;
          roundNo = wins; // the label moves on only when the new round starts
          round = eggRound(order[roundNo % order.length], rng);
          setupRound();
        }, 2200);
      }
      return;
    }
    sfx.wrong();
    tries++;
    lockControls();
    show();
    // Direction only — never the exact speed or time of the miss.
    const why = {
      fast: round.type === 'safe' ? 'Too fast — it would crack! Go lower.' : 'Too fast — it would crack! It needs more drag.',
      low: 'Safe — but a higher window is still safe. Go higher!',
      early: 'Too early! It needs to fall for longer.',
      late: 'Too late! It needs a shorter fall.',
      slow: 'Too slow — it took too long! Less drag.',
    }[verdict.why];
    if (tries >= MAX_TRIES) {
      revealed = eggSolution(round);
      banner.set(`${why} That was your 3rd try. Here's how to work it out: ${revealed} Then press <b>New challenge</b> for fresh numbers.`);
      dropBtn.textContent = '▶ New challenge';
      show();
    } else {
      banner.set(`${why} (try ${tries + 1} of ${MAX_TRIES} next) ${goalText()}`);
    }
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
    let y = yOf(h);
    if (drop) y = yOf(Math.max(0, h - eggState(drop.t, D).y));
    const cracked = drop?.landed && !drop.verdict.ok && drop.verdict.why === 'fast';
    if (D && !cracked) { const sc = 1.5 + Math.min(2.5, Math.log10(D + 1) * 1.6); drawSprite(ctx, 'u5chute', PX, Math.max(y - 24, 10 * sc + 2), sc); }
    if (cracked) {
      ctx.fillStyle = '#fcee4b'; ctx.fillRect(PX - 16, GROUND - 4, 32, 4);
      ctx.fillStyle = '#f7efdc'; ctx.fillRect(PX - 22, GROUND - 6, 8, 4); ctx.fillRect(PX + 12, GROUND - 7, 9, 4);
      tag(ctx, 'CRACK!', PX, GROUND - 30, { size: 14, color: '#ff6b6b' });
    } else {
      drawSprite(ctx, 'u5pod', PX, y, 3);
    }
    if (drop?.landed && drop.verdict.ok) tag(ctx, 'SAFE!', PX, GROUND - 40, { size: 14, color: '#80ff20' });
    // info panel: the goal only (no speeds or times — work them out!)
    const ix = 250;
    ctx.fillStyle = 'rgba(20,18,29,0.82)'; ctx.fillRect(ix, 40, 220, 100);
    text(ctx, `ROUND ${Math.min(roundNo + 1, totalRounds)} / ${totalRounds}`, ix + 10, 60, { size: 12, color: '#fcee4b' });
    const goal = round.type === 'safe' ? [`Land at ≤ ${round.S} m/s`, 'from the HIGHEST window']
      : round.type === 'timed' ? [`Land after exactly ${round.T} s`, 'no parachute']
        : [`From ${round.H} m: land ≤ ${round.S} m/s`, `within ${fmt(round.T)} s`];
    text(ctx, goal[0], ix + 10, 84, { size: 12 });
    text(ctx, goal[1], ix + 10, 104, { size: 12 });
    text(ctx, `try ${Math.min(tries + 1, MAX_TRIES)} of ${MAX_TRIES}`, ix + 10, 128, { size: 12, color: '#4aedd9' });
  });

  setupRound();
  return () => {
    alive = false;
    clearTimeout(nextTimer);
    stop();
  };
}
