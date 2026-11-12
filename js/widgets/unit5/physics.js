// Unit 5 — pure physics helpers shared by the Unit 5 simulations (no DOM, so tests can import them).
// g = 10 N/kg on Earth ("really about 9.8; we use 10 to keep numbers friendly").

export const G = 10;

export const WORLDS = [
  { id: 'earth', name: 'Earth', g: 10 },
  { id: 'moon', name: 'Moon', g: 1.6 },
  { id: 'mars', name: 'Mars', g: 3.7 },
  { id: 'jupiter', name: 'Jupiter', g: 25 },
];

// Round to 2 decimal places without float noise (1.6 × 37 → 59.2).
export const r2 = (x) => Math.round(x * 100) / 100;

export const weight = (m, g = G) => r2(m * g);

// Thrown straight up at u (no air): times when the ball is at height h. [] if it never gets that high.
export function passTimes(u, h, g = G) {
  const disc = u * u - 2 * g * h;
  if (disc < -1e-9) return [];
  if (Math.abs(disc) < 1e-9) return [u / g];
  const s = Math.sqrt(disc);
  return [(u - s) / g, (u + s) / g];
}

// ---------- Falling with air resistance: drag = D × v² (newtons) ----------
export const terminalSpeed = (m, D, g = G) => Math.sqrt((m * g) / D);

// One small step of a fall with drag. Returns the new speed.
export function stepWithDrag(v, m, D, dt, g = G) {
  const a = g - (D * v * v) / m;
  return Math.max(0, v + a * dt);
}

// ---------- Egg Drop Lab (boss) ----------
// The egg rides in a 10 kg "Egg Lander" pod: weight 100 N. With no parachute we ignore air
// (heavy, compact pod) so v² = 2gh. With a parachute (drag = D × v²) we keep the maths simple and
// pretend the pod speeds up at the full g until it reaches its terminal speed √(100 ÷ D), then falls
// steadily at that speed. D = 0 means no parachute.
export const POD_WEIGHT = 100;
export const D_MAX = 20;
export const MAX_TRIES = 3;

export const chuteTerminal = (D) => (D ? Math.sqrt(POD_WEIGHT / D) : Infinity);

// Landing speed and time for a drop from height h with drag number D.
export function eggOutcome(h, D, g = G) {
  const vt = chuteTerminal(D);
  const vFree = Math.sqrt(2 * g * h);
  if (vFree <= vt) return { v: vFree, time: Math.sqrt((2 * h) / g), terminal: false };
  const t1 = vt / g;
  const d1 = (vt * vt) / (2 * g);
  return { v: vt, time: t1 + (h - d1) / vt, terminal: true };
}

// Height fallen and speed after time t (same model as eggOutcome).
export function eggState(t, D, g = G) {
  const vt = chuteTerminal(D);
  const t1 = vt / g;
  if (t <= t1) return { y: 0.5 * g * t * t, v: g * t };
  return { y: (vt * vt) / (2 * g) + vt * (t - t1), v: vt };
}

// A round of the Egg Drop Lab. Types:
//  'safe'  — no parachute; the pod survives up to S m/s: find the HIGHEST safe window (h = S² ÷ 2g).
//  'timed' — no parachute; the pod must land exactly T s after release (h = ½gT²).
//  'chute' — fixed height H; choose the drag number D so it lands at ≤ S m/s AND within T s.
//            Too little drag → too fast; too much → too slow. Only a few D values work.
// `prev` (optional) is the round being replaced: the new one has different numbers.
export function eggRound(type, rng, prev) {
  for (let i = 0; i < 50; i++) {
    const r = makeRound(type, rng);
    if (!prev || prev.type !== type || r.key !== prev.key) return r;
  }
  return makeRound(type, rng);
}

function makeRound(type, rng) {
  if (type === 'safe') {
    const S = rng.pick([20, 30, 40]); // answers 20, 45, 80 m: never an end of the 5–100 m slider
    return { type, S, answerH: (S * S) / (2 * G), key: `s${S}` };
  }
  if (type === 'timed') {
    const T = rng.pick([2, 3, 4]);
    return { type, T, answerH: 0.5 * G * T * T, key: `t${T}` };
  }
  const H = rng.pick([40, 60, 80]);
  const S = rng.pick([4, 5, 10]);
  return chuteRound(H, S);
}

// Safe speed S needs D ≥ 100 ÷ S² (lowest whole D: lo). The time limit T is chosen so that exactly
// D = lo and lo + 1 work, both in the exact model and with the rule of thumb "time ≈ H ÷ speed"
// (which gives D ≤ 100 × T² ÷ H²), so the maths he does matches the lab.
export function chuteRound(H, S) {
  const lo = Math.ceil(100 / (S * S) - 1e-9);
  const tOf = (D) => eggOutcome(H, D).time;
  for (let T = Math.ceil(tOf(lo + 1) * 10) / 10; T < tOf(lo + 2); T = Math.round((T + 0.1) * 10) / 10) {
    const round = { type: 'chute', H, S, T, key: `c${H}-${S}` };
    const answers = [];
    for (let D = 0; D <= D_MAX; D++) if (judgeEgg(round, H, D).ok) answers.push(D);
    const thumb = Math.floor((100 * T * T) / (H * H) + 1e-9);
    if (answers.join() === `${lo},${lo + 1}` && thumb === lo + 1) return { ...round, answers };
  }
  throw new Error(`no chute round for H=${H}, S=${S}`);
}

// Does a drop pass the round? { ok, out, why } — why is a direction: 'fast', 'low', 'early', 'late', 'slow'.
export function judgeEgg(round, h, D) {
  const out = eggOutcome(h, D);
  if (round.type === 'safe') {
    if (out.v > round.S + 1e-9) return { ok: false, out, why: 'fast' };
    if (h < round.answerH - 1e-9) return { ok: false, out, why: 'low' };
    return { ok: true, out };
  }
  if (round.type === 'timed') {
    if (Math.abs(out.time - round.T) < 1e-6) return { ok: true, out };
    return { ok: false, out, why: out.time < round.T ? 'early' : 'late' };
  }
  if (out.v > round.S + 1e-9) return { ok: false, out, why: 'fast' };
  if (out.time > round.T + 1e-9) return { ok: false, out, why: 'slow' };
  return { ok: true, out };
}

// The worked solution shown after 3 misses.
export function eggSolution(round) {
  if (round.type === 'safe') return `Highest safe height: v² = 2gh, so h = v² ÷ 20 = ${round.S * round.S} ÷ 20 = <b>${round.answerH} m</b>.`;
  if (round.type === 'timed') return `h = ½gt² = 5 × ${round.T}² = <b>${round.answerH} m</b>.`;
  const lo = round.answers[0], hi = round.answers[round.answers.length - 1];
  return `Slow enough: terminal speed ≤ ${round.S} m/s, so D × ${round.S}² ≥ 100 → D ≥ ${100 / (round.S * round.S)}. `
    + `Quick enough: time ≈ ${round.H} ÷ speed ≤ ${round.T} s, so speed ≥ ${round.H} ÷ ${round.T} ≈ ${Math.round((round.H / round.T) * 100) / 100} m/s, and D × speed² = 100 gives D ≤ about ${Math.round((100 * round.T * round.T) / (round.H * round.H) * 100) / 100}. `
    + `Any D from <b>${lo} to ${hi}</b> works.`;
}

// Wrap a readout or task banner so it only rewrites its HTML when the content changes
// (sims call show() every frame while running).
export function onlyChanges(widget) {
  let last = null;
  return {
    el: widget.el,
    set(...args) {
      const key = JSON.stringify(args);
      if (key === last) return;
      last = key;
      widget.set(...args);
    },
  };
}
