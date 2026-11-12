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
// (heavy, compact pod) so v² = 2gh. With a parachute the pod speeds up at g until it reaches
// its terminal speed (drag = weight), then falls steadily at that speed.
export const POD_WEIGHT = 100;
export const CHUTES = [
  { id: 'none', name: 'No parachute', D: 0 },
  { id: 'tiny', name: 'Tiny', D: 1 },
  { id: 'small', name: 'Small', D: 4 },
  { id: 'big', name: 'Big', D: 25 },
  { id: 'huge', name: 'Huge', D: 100 },
];

export function chuteTerminal(chute) {
  return chute.D ? Math.sqrt(POD_WEIGHT / chute.D) : Infinity;
}

// Landing speed and time for a drop from height h with a parachute.
export function eggOutcome(h, chute, g = G) {
  const vt = chuteTerminal(chute);
  const vFree = Math.sqrt(2 * g * h);
  if (vFree <= vt) return { v: vFree, time: Math.sqrt((2 * h) / g), terminal: false };
  const t1 = vt / g;
  const d1 = (vt * vt) / (2 * g);
  return { v: vt, time: t1 + (h - d1) / vt, terminal: true };
}

// Height fallen and speed after time t (same model as eggOutcome).
export function eggState(t, chute, g = G) {
  const vt = chuteTerminal(chute);
  const t1 = vt / g;
  if (t <= t1) return { y: 0.5 * g * t * t, v: g * t };
  return { y: (vt * vt) / (2 * g) + vt * (t - t1), v: vt };
}

// A round of the Egg Drop Lab. Types:
//  'safe'  — no parachute; the pod survives up to S m/s: find the HIGHEST safe height (h = S² ÷ 2g).
//  'timed' — no parachute; the pod must land exactly T s after release (h = ½gT²).
//  'chute' — fixed height H; choose the parachute so it lands at ≤ S m/s within T s.
export function eggRound(type, rng) {
  if (type === 'safe') {
    const S = rng.pick([10, 20, 30]);
    return { type, S, answerH: (S * S) / (2 * G), chute: 'none' };
  }
  if (type === 'timed') {
    const T = rng.pick([2, 3, 4]);
    return { type, T, answerH: 0.5 * G * T * T, chute: 'none' };
  }
  const H = rng.pick([40, 60, 80]);
  const pick = rng.pick([
    { S: 10, T: H / 10 + 2, answer: 'tiny' },
    { S: 5, T: H / 5 + 2, answer: 'small' },
    { S: 2, T: H / 2 + 4, answer: 'big' },
  ]);
  return { type: 'chute', H, S: pick.S, T: pick.T, answer: pick.answer };
}

// Does a drop pass the round? Returns { ok, why } with a short explanation.
export function judgeEgg(round, h, chuteId) {
  const chute = CHUTES.find((c) => c.id === chuteId) || CHUTES[0];
  const out = eggOutcome(h, chute);
  if (round.type === 'safe') {
    if (out.v > round.S + 1e-9) return { ok: false, out, why: 'smash' };
    if (h < round.answerH - 1e-9) return { ok: false, out, why: 'low' };
    return { ok: true, out };
  }
  if (round.type === 'timed') {
    if (Math.abs(out.time - round.T) < 1e-6) return { ok: true, out };
    return { ok: false, out, why: out.time < round.T ? 'early' : 'late' };
  }
  if (out.v > round.S + 1e-9) return { ok: false, out, why: 'smash' };
  if (out.time > round.T + 1e-9) return { ok: false, out, why: 'late' };
  return { ok: true, out };
}
