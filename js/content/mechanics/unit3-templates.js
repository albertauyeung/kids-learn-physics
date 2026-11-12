// Unit 3 — Acceleration & Motion Graphs: problem templates.
import { registerTemplates, until } from '../../engine/templates.js';
import { graphSVG } from '../../engine/graph-svg.js';
import { fmt, fmtSigned } from '../../core/util.js';

export const C = {
  acc: 'mech.acceleration',
  dec: 'mech.deceleration',
  vt: 'mech.vt-graph',
  suvat: 'mech.suvat',
  power: 'mech.suvat-power',
  stop: 'mech.stopping',
  quad: 'mech.quadratics',
};

const ACC = 'm/s²';
const ACC_UNITS = ['m/s', 'm/s²'];
const SIGN_NOTE = '<br><small>Forward is +. Use the ± key if your answer is negative.</small>';

// True when the answer and every mistake value are all different (so each message can show).
export function distinct(...vals) {
  for (let i = 0; i < vals.length; i++) {
    for (let j = i + 1; j < vals.length; j++) if (Math.abs(vals[i] - vals[j]) < 1e-9) return false;
  }
  return true;
}
const isNice = (x) => Math.abs(x * 100 - Math.round(x * 100)) < 1e-9;
const half = (x) => Number.isInteger(x * 2);

// A velocity–time graph (same layout as graphSVG) with an optional shaded area under the line.
// shade: list of polygons [[t, v], ...] in graph units, each with a colour.
export function vtGraph({ points, tMax, yMax, tStep = 1, yStep = 2, labelEvery, shade = [], small = false, w = 300, h = 200 }) {
  const svg = graphSVG({ points, tMax, yMax, tStep, yStep, labelEvery: labelEvery ?? yStep, yLabel: 'velocity (m/s)', small, w, h });
  if (!shade.length) return svg;
  const L = small ? 10 : 38, R = 10, T = 10, B = small ? 10 : 30;
  const gx = (t) => L + (t / tMax) * (w - L - R);
  const gy = (y) => h - B - (y / yMax) * (h - T - B);
  const polys = shade.map(({ pts, color }) => `<polygon points="${pts.map(([t, y]) => `${gx(t).toFixed(1)},${gy(y).toFixed(1)}`).join(' ')}" fill="${color}" stroke="none"/>`).join('');
  // Put the shading under the axes and the line.
  const i = svg.indexOf('<line x1="' + L + '" y1="' + T + '"');
  return i > 0 ? svg.slice(0, i) + polys + svg.slice(i) : svg;
}
const SHADE_A = 'rgba(74,237,217,0.35)'; // rectangles
const SHADE_B = 'rgba(252,238,75,0.35)'; // triangles


const TEMPLATES = [
  // ---------- Lesson 1: what is acceleration? ----------
  {
    id: 'u3.acc-basic', concepts: [C.acc], tier: 'explorer',
    generate(r) {
      const CTX = [
        { who: 'A car', us: [0, 5, 10], as: [1, 2, 3, 4, 5], ts: [2, 3, 4, 5, 6], vmax: 30 },
        { who: 'Pip\'s minecart on a powered rail', us: [0, 2, 4], as: [1, 2], ts: [2, 3, 4, 5], vmax: 12 },
        { who: 'A bus', us: [0, 4, 6], as: [1, 2], ts: [4, 5, 6, 8], vmax: 20 },
        { who: 'A sprinter', us: [0], as: [3, 4, 5], ts: [2], vmax: 10 },
      ];
      const x = until(r, (rr) => {
        const c = rr.pick(CTX);
        const u = rr.pick(c.us), a = rr.pick(c.as), t = rr.pick(c.ts);
        return { c, u, a, t, v: u + a * t };
      }, (x) => x.v <= x.c.vmax && distinct(x.a, x.v - x.u, (x.v - x.u) * x.t, ...(x.u ? [x.v / x.t] : [])));
      const { c, u, a, t, v } = x;
      const errors = [
        { value: v - u, msg: 'That\'s the speed gained altogether. Acceleration is the speed gained EACH SECOND — divide by the time.' },
        { value: (v - u) * t, msg: 'Divide the speed gained by the time — don\'t multiply.' },
      ];
      if (u) errors.push({ value: v / t, msg: `It didn't start from rest! Use the speed it GAINED: ${v} − ${u}.` });
      return {
        type: 'numeric',
        prompt: u === 0
          ? `${c.who} starts from rest and reaches <b>${v} m/s</b> in <b>${t} s</b>. What is its acceleration?`
          : `${c.who} speeds up from <b>${u} m/s</b> to <b>${v} m/s</b> in <b>${t} s</b>. What is its acceleration?`,
        answer: a, unit: ACC, unitChoices: ACC_UNITS,
        hints: ['How much speed does it gain altogether? And how many seconds does that take?', 'a = (v − u) ÷ t: the speed gained each second. Its unit is m/s².'],
        errors,
        solution: `a = (${v} − ${u}) ÷ ${t} = ${v - u} ÷ ${t} = <b>${a} m/s²</b> (it gains ${a} m/s every second)`,
      };
    },
  },
  {
    id: 'u3.acc-final', concepts: [C.acc, C.suvat], tier: 'scientist',
    generate(r) {
      const CTX = [
        { who: 'A car', act: 'driving', us: [2, 4, 5, 6, 8, 10, 12, 15], as: [1, 1.5, 2, 2.5, 3, 4], vmax: 30 },
        { who: 'A minecart', act: 'rolling', us: [1, 2, 3, 4, 5], as: [0.5, 1, 1.5, 2], vmax: 12 },
        { who: 'Pip on a sledge', act: 'sliding', us: [1, 2, 3], as: [0.5, 1, 1.5, 2], vmax: 12 },
      ];
      const x = until(r, (rr) => {
        const c = rr.pick(CTX);
        const u = rr.pick(c.us), a = rr.pick(c.as), t = rr.int(2, 8);
        return { c, u, a, t, v: u + a * t };
      }, (x) => Number.isInteger(x.a * x.t) && x.v <= x.c.vmax && distinct(x.v, x.a * x.t, x.u + x.a, x.u * x.a * x.t));
      const { c, u, a, t, v } = x;
      return {
        type: 'numeric',
        prompt: `${c.who} ${c.act} at <b>${u} m/s</b> speeds up with an acceleration of <b>${fmt(a)} m/s²</b> for <b>${t} s</b>. How fast is it going now?`,
        answer: v, unit: 'm/s', unitChoices: ACC_UNITS,
        hints: ['How much speed does it gain every second? And for how many seconds?', 'speed gained = a × t. Then add it to the starting speed: v = u + at.'],
        errors: [
          { value: a * t, msg: `That's the speed it gained. It was already going at ${u} m/s — add that on.` },
          { value: u + a, msg: 'That\'s after just one second. It keeps gaining speed for every second.' },
          { value: u * a * t, msg: 'Multiply only a × t (the speed gained), then ADD the starting speed.' },
        ],
        solution: `Gained ${fmt(a)} × ${t} = ${a * t} m/s. v = ${u} + ${a * t} = <b>${v} m/s</b>`,
      };
    },
  },
  {
    id: 'u3.acc-time', concepts: [C.acc], tier: 'scientist',
    generate(r) {
      const x = until(r, (rr) => {
        const u = rr.pick([0, 4, 5, 6, 10]), a = rr.pick([1, 2, 2.5, 3, 4, 5]), t = rr.int(2, 10);
        return { u, a, t, v: u + a * t };
      }, (x) => Number.isInteger(x.v) && x.v <= 30 && distinct(x.t, x.v - x.u, (x.v - x.u) * x.a, ...(x.u ? [x.v / x.a] : [])));
      const { u, a, t, v } = x;
      const errors = [
        { value: v - u, msg: 'That\'s the speed it must gain. How many seconds does that take at ' + fmt(a) + ' m/s every second?' },
        { value: (v - u) * a, msg: 'Divide the speed to gain by the acceleration — don\'t multiply.' },
      ];
      if (u) errors.push({ value: v / a, msg: `It starts at ${u} m/s, so it only needs to gain ${v - u} m/s.` });
      return {
        type: 'numeric',
        prompt: u === 0
          ? `A car starts from rest and accelerates at <b>${fmt(a)} m/s²</b>. How long does it take to reach <b>${v} m/s</b>?`
          : `A car going at <b>${u} m/s</b> accelerates at <b>${fmt(a)} m/s²</b>. How long does it take to reach <b>${v} m/s</b>?`,
        answer: t, unit: 's',
        hints: ['How much speed does the car need to gain?', 'Each second it gains a m/s. How many seconds to gain all of it? t = (v − u) ÷ a'],
        errors,
        solution: `It must gain ${v} − ${u} = ${v - u} m/s, at ${fmt(a)} m/s each second: ${v - u} ÷ ${fmt(a)} = <b>${t} s</b>`,
      };
    },
  },
  {
    id: 'u3.acc-table', concepts: [C.acc], tier: 'explorer',
    generate(r) {
      const x = until(r, (rr) => ({ u: rr.pick([0, 2, 3, 5, 6]), a: rr.pick([1.5, 2, 2.5, 3, 4]) }),
        (x) => distinct(x.a, x.u + 4 * x.a, ...(x.u ? [(x.u + 4 * x.a) / 4] : [])));
      const { u, a } = x;
      const speeds = [0, 1, 2, 3, 4].map((k) => u + k * a);
      const table = `<table class="mini-table"><tr><td>time (s)</td>${[0, 1, 2, 3, 4].map((k) => `<td>${k}</td>`).join('')}</tr><tr><td>speed (m/s)</td>${speeds.map((s) => `<td><b>${fmt(s)}</b></td>`).join('')}</tr></table>`;
      const errors = [{ value: speeds[4], msg: 'That\'s the speed at 4 s. Acceleration is how much the speed goes UP each second.' }];
      if (u) errors.push({ value: speeds[4] / 4, msg: `The car didn't start at 0 m/s. Look at how much the speed changes from one second to the next.` });
      return {
        type: 'numeric',
        prompt: `Pip reads the speedometer of his uncle's car every second:${table}What is its acceleration?`,
        answer: a, unit: ACC, unitChoices: ACC_UNITS,
        hints: ['How much does the speed go up from one second to the next?', 'Acceleration = speed gained each second.'],
        errors,
        solution: `Each second the speed goes up by ${fmt(speeds[1])} − ${fmt(speeds[0])} = ${fmt(a)} m/s, so a = <b>${fmt(a)} m/s²</b>`,
      };
    },
  },
  {
    id: 'u3.acc-meaning-mcq', concepts: [C.acc], tier: 'explorer',
    generate(r) {
      const a = r.pick([2, 3, 4, 5]);
      const who = r.pick(['A car', 'A sports car', 'A motorbike']);
      return {
        type: 'mcq',
        prompt: `${who} has an acceleration of <b>${a} m/s²</b>. What does that mean?`,
        choices: [`Its speed goes up by ${a} m/s every second`, `It moves ${a} metres every second`, `Its speed is always ${a} m/s`, `It reaches top speed after ${a} seconds`],
        answer: 0,
        explain: `m/s² means "metres per second, every second": each second the speed grows by another ${a} m/s (0, ${a}, ${2 * a}, ${3 * a} m/s...).`,
      };
    },
  },
  {
    id: 'u3.acc-compare-mcq', concepts: [C.acc], tier: 'scientist',
    generate(r) {
      const WHO = [
        { n: 'bus', as: [1, 2], ts: [5, 8, 10] },
        { n: 'sprinter', as: [3, 4], ts: [2, 3], vmax: 10 },
        { n: 'cyclist', as: [1, 2], ts: [3, 4, 5] },
        { n: 'sports car', as: [4, 5], ts: [4, 5, 6] },
        { n: 'tractor', as: [1], ts: [5, 8] },
      ];
      // trap: the faster finisher has the SMALLER acceleration; same: equal accelerations; plain: faster finisher wins.
      const kind = r.pick(['trap', 'trap', 'same', 'plain']);
      const x = until(r, (rr) => {
        const [A, B] = rr.shuffle(WHO).slice(0, 2);
        const aA = rr.pick(A.as), tA = rr.pick(A.ts), aB = rr.pick(B.as), tB = rr.pick(B.ts);
        return { A, B, aA, tA, aB, tB, vA: aA * tA, vB: aB * tB };
      }, (x) => x.vA <= (x.A.vmax || 30) && x.vB <= (x.B.vmax || 30) && x.vA !== x.vB && x.tA !== x.tB && (
        kind === 'same' ? x.aA === x.aB : kind === 'trap' ? (x.aA - x.aB) * (x.vA - x.vB) < 0 : (x.aA - x.aB) * (x.vA - x.vB) > 0));
      const { A, B, aA, tA, aB, tB, vA, vB } = x;
      const answer = aA === aB ? 2 : aA > aB ? 0 : 1;
      const big = vA > vB ? A.n : B.n;
      return {
        type: 'mcq',
        prompt: `A ${A.n} goes from 0 to <b>${vA} m/s</b> in <b>${tA} s</b>. A ${B.n} goes from 0 to <b>${vB} m/s</b> in <b>${tB} s</b>. Which has the bigger acceleration?`,
        choices: [`The ${A.n}`, `The ${B.n}`, 'They are the same', 'You can\'t tell without the distances'],
        answer,
        explain: `The ${A.n} gains ${vA} ÷ ${tA} = ${aA} m/s each second; the ${B.n} gains ${vB} ÷ ${tB} = ${aB} m/s each second. ${kind === 'trap' ? `The ${big} ends up faster, but a big final speed doesn't mean a big acceleration!` : kind === 'same' ? 'Different final speeds, but the same speed gained each second.' : 'Always divide by the time to compare.'}`,
      };
    },
  },
  {
    id: 'u3.eq-t', concepts: [C.acc], tier: 'scientist',
    generate() {
      return {
        type: 'equation', prompt: 'We know <b>a = (v − u) ÷ t</b>. Rearrange it to find the time <b>t</b>.',
        lhs: 't', tiles: ['(v − u)', '÷', 'a', '×', '(v + u)'], answers: [['(v − u)', '÷', 'a']],
        explain: 'Multiply both sides by t, then divide both sides by a: t = (v − u) ÷ a. (The speed to gain, shared out at a m/s per second.)',
      };
    },
  },

  // ---------- Lesson 2: slowing down ----------
  {
    id: 'u3.dec-signed', concepts: [C.dec], tier: 'scientist',
    generate(r) {
      const CTX = [
        { who: 'A car', bs: [2, 3, 4, 5, 6, 8], umax: 30 },
        { who: 'A minecart', bs: [1, 2], umax: 12 },
        { who: 'A cyclist', bs: [1, 2, 3], umax: 10 },
      ];
      const x = until(r, (rr) => {
        const c = rr.pick(CTX);
        const b = rr.pick(c.bs), t = rr.int(2, 6), v = rr.chance(0.4) ? 0 : rr.int(1, 10);
        return { c, b, t, v, u: v + b * t };
      }, (x) => x.u <= x.c.umax && distinct(-x.b, x.b, -(x.u - x.v), ...(x.v ? [-x.u / x.t] : [])));
      const { c, b, t, v, u } = x;
      const a = -b;
      const errors = [
        { value: b, msg: 'Right size, wrong sign! It is slowing down while moving forward, so the acceleration points backwards: negative.' },
        { value: -(u - v), msg: 'That\'s the change in speed altogether. Divide by the time to get the change each second.' },
      ];
      if (v) errors.push({ value: -u / t, msg: `It doesn't stop completely — it ends at ${v} m/s. Use v − u.` });
      return {
        type: 'numeric', signed: true,
        prompt: `${c.who} moving forward slows down from <b>${u} m/s</b> to ${v ? `<b>${v} m/s</b>` : '<b>a stop</b>'} in <b>${t} s</b>. What is its acceleration?${SIGN_NOTE}`,
        answer: a, unit: ACC,
        hints: ['Is the velocity going up or down? What does that make v − u?', 'a = (v − u) ÷ t. Keep the sign!'],
        errors,
        solution: `a = (${v} − ${u}) ÷ ${t} = ${fmtSigned(v - u)} ÷ ${t} = <b>${fmtSigned(a)} m/s²</b> (a deceleration of ${b} m/s²)`,
      };
    },
  },
  {
    id: 'u3.dec-size', concepts: [C.dec], tier: 'explorer',
    generate(r) {
      const x = until(r, (rr) => {
        const car = rr.chance(0.5);
        const b = car ? rr.pick([2, 4, 5, 6]) : rr.pick([1, 2]), t = rr.int(2, 5), v = rr.chance(0.3) ? 0 : rr.int(2, 8);
        return { car, b, t, v, u: v + b * t };
      }, (x) => x.u <= (x.car ? 30 : 12) && distinct(x.b, x.u - x.v, ...(x.v ? [x.u / x.t] : [])));
      const { car, b, t, v, u } = x;
      const errors = [{ value: u - v, msg: 'That\'s the speed lost altogether. How much does it lose EACH second?' }];
      if (v) errors.push({ value: u / t, msg: `It doesn't stop — it ends at ${v} m/s. Use the speed it actually lost.` });
      return {
        type: 'numeric',
        prompt: `${car ? 'A car brakes' : 'A minecart rolls onto a flat track and slows'} from <b>${u} m/s</b> to ${v ? `<b>${v} m/s</b>` : '<b>a stop</b>'} in <b>${t} s</b>. What is its <b>deceleration</b> — the speed it loses each second? (Give the size, as a positive number.)`,
        answer: b, unit: ACC, unitChoices: ACC_UNITS,
        hints: ['How much speed does it lose altogether?', 'Share that out over the seconds: speed lost ÷ time.'],
        errors,
        solution: `It loses ${u} − ${v} = ${u - v} m/s in ${t} s: ${u - v} ÷ ${t} = <b>${b} m/s²</b> each second. (Its acceleration is −${b} m/s².)`,
      };
    },
  },
  {
    id: 'u3.dec-stop-time', concepts: [C.dec], tier: 'scientist',
    generate(r) {
      const x = until(r, (rr) => ({ b: rr.pick([2, 3, 4, 5, 6, 8]), t: rr.int(2, 8) }), (x) => x.b * x.t <= 30 && x.b * x.t >= 8 && distinct(x.t, x.b * x.t * x.b, x.b * x.t - x.b));
      const { b, t } = x;
      const u = b * t;
      return {
        type: 'numeric',
        prompt: `A car is driving at <b>${u} m/s</b>. The driver brakes, and the car loses <b>${b} m/s every second</b> (a deceleration of ${b} m/s²). How long does it take to stop?`,
        answer: t, unit: 's',
        hints: ['How much speed must the car lose to stop?', 'How many lots of ' + b + ' m/s fit into that? t = speed to lose ÷ deceleration.'],
        errors: [
          { value: u * b, msg: 'Divide the speed by the deceleration — don\'t multiply.' },
          { value: u - b, msg: 'That\'s the speed after one second. Keep going until it reaches 0.' },
        ],
        solution: `${u} ÷ ${b} = <b>${t} s</b> (${Array.from({ length: Math.min(t, 6) + 1 }, (_, k) => u - b * k).join(', ')}${t > 6 ? ', ...' : ''} m/s)`,
      };
    },
  },
  {
    id: 'u3.dec-speed-after', concepts: [C.dec, C.suvat], tier: 'scientist',
    generate(r) {
      const x = until(r, (rr) => ({ u: rr.int(12, 30), b: rr.pick([2, 3, 4, 5, 6]), t: rr.int(2, 5) }),
        (x) => x.u - x.b * x.t >= 2 && distinct(x.u - x.b * x.t, x.u + x.b * x.t, x.b * x.t));
      const { u, b, t } = x;
      const v = u - b * t;
      return {
        type: 'numeric',
        prompt: `A car going at <b>${u} m/s</b> brakes with a deceleration of <b>${b} m/s²</b> for <b>${t} s</b>. How fast is it going now?`,
        answer: v, unit: 'm/s', unitChoices: ACC_UNITS,
        hints: ['How much speed does it lose in that time?', 'Take the speed lost away from the starting speed. (Or: v = u + at with a = −' + b + '.)'],
        errors: [
          { value: u + b * t, msg: 'It is braking, so it LOSES speed — subtract.' },
          { value: b * t, msg: 'That\'s the speed it lost. How fast is it still going?' },
        ],
        solution: `Lost ${b} × ${t} = ${b * t} m/s. v = ${u} − ${b * t} = <b>${v} m/s</b>`,
      };
    },
  },
  {
    id: 'u3.dec-sign-mcq', concepts: [C.dec], tier: 'explorer',
    generate(r) {
      const who = r.pick(['A car moving forward brakes', 'A minecart moving forward rolls onto a flat track and slows down', 'A sledge sliding forward slows down on the grass']);
      return {
        type: 'mcq',
        prompt: `Forward is +. ${who}. What sign is its <b>acceleration</b>?`,
        choices: ['Negative — it points backwards', 'Positive — it is still moving forward', 'Zero — it is still moving', 'It depends how fast it is going'],
        answer: 0,
        explain: 'Its velocity is getting smaller, so v − u is negative and so is the acceleration. The velocity is still + (it moves forward), but the acceleration points backwards.',
      };
    },
  },
  {
    id: 'u3.dec-meaning-mcq', concepts: [C.dec], tier: 'scientist',
    generate(r) {
      const a = r.pick([2, 3, 4, 5]);
      return {
        type: 'mcq',
        prompt: `Forward is +. A car moving forward has an acceleration of <b>−${a} m/s²</b>. What is happening?`,
        choices: [`It is slowing down: it loses ${a} m/s every second`, `It is moving backwards at ${a} m/s`, `It moves ${a} m backwards every second`, `It is speeding up by ${a} m/s every second`],
        answer: 0,
        explain: `A minus sign on a velocity means "moving backwards" — but on an acceleration it means the change points backwards. For a car moving forward that means slowing down by ${a} m/s each second.`,
      };
    },
  },

  // ---------- Lesson 3: velocity–time graphs ----------
  {
    id: 'u3.vt-slope', concepts: [C.vt, C.acc], tier: 'scientist',
    generate(r) {
      const x = until(r, (rr) => ({ u: rr.int(0, 10) * 2, v: rr.int(0, 10) * 2, t: rr.int(2, 8) }), (x) => {
        const a = (x.v - x.u) / x.t;
        return x.u !== x.v && half(a) && Math.abs(a) >= 0.5 && (a < 0 ? -a <= 8 : a <= 5)
          && distinct(a, -a, x.v - x.u, ...(x.u ? [x.v / x.t] : []));
      });
      const { u, v, t } = x;
      const a = (v - u) / t;
      const errors = [
        { value: -a, msg: `Right size, wrong sign — is the line going ${a > 0 ? 'up' : 'down'}?` },
        { value: v - u, msg: 'That\'s the change in velocity (the rise). Divide by the time (the run).' },
      ];
      if (u) errors.push({ value: v / t, msg: 'You used only the end velocity. The line doesn\'t start at 0 — use the CHANGE in velocity.' });
      return {
        type: 'numeric', signed: true,
        prompt: `This velocity–time graph shows a car moving forward. What is its acceleration?${SIGN_NOTE}${vtGraph({ points: [[0, u], [t, v]], tMax: t, yMax: 20 })}`,
        answer: a, unit: ACC,
        hints: ['Is the line going uphill (speeding up) or downhill (slowing down)?', 'acceleration = slope = change in velocity ÷ change in time'],
        errors,
        solution: `(${v} − ${u}) ÷ ${t} = ${fmtSigned(v - u)} ÷ ${t} = <b>${fmtSigned(a)} m/s²</b>`,
      };
    },
  },
  {
    id: 'u3.vt-area-tri', concepts: [C.vt], tier: 'explorer',
    generate(r) {
      const x = until(r, (rr) => ({ v: rr.int(2, 10) * 2, t: rr.int(2, 8), up: rr.chance(0.6) }),
        (x) => (x.up ? x.v / x.t <= 5 : x.v / x.t <= 8) && distinct(x.v * x.t / 2, x.v * x.t, x.v / x.t));
      const { v, t, up } = x;
      const pts = up ? [[0, 0], [t, v]] : [[0, v], [t, 0]];
      return {
        type: 'numeric',
        prompt: `A car ${up ? 'speeds up from rest' : 'brakes to a stop'}. How far does it travel in these <b>${t} s</b>? Use the shaded area.${vtGraph({ points: pts, tMax: t, yMax: 20, shade: [{ pts: [[0, 0], ...pts.filter((p) => p[1] > 0), [t, 0]], color: SHADE_B }] })}`,
        answer: v * t / 2, unit: 'm',
        hints: ['What shape is the shaded area?', 'Area of a triangle = ½ × base × height. The base is a time and the height is a velocity.'],
        errors: [
          { value: v * t, msg: 'That\'s the whole rectangle. The triangle is only half of it.' },
          { value: v / t, msg: 'That\'s the slope (the acceleration). The DISTANCE is the area under the line.' },
        ],
        solution: `½ × ${t} s × ${v} m/s = <b>${v * t / 2} m</b>`,
      };
    },
  },
  {
    id: 'u3.vt-area-trap', concepts: [C.vt], tier: 'scientist',
    generate(r) {
      const x = until(r, (rr) => ({ v: rr.int(2, 10) * 2, t1: rr.int(2, 5), t2: rr.int(2, 6), first: rr.chance(0.5) }), (x) => {
        const area = x.v * x.t1 / 2 + x.v * x.t2;
        return x.t1 + x.t2 <= 10 && x.v / x.t1 <= (x.first ? 5 : 8) && Number.isInteger(area)
          && distinct(area, x.v * (x.t1 + x.t2), x.v * (x.t1 + x.t2) / 2, x.v * x.t2);
      });
      const { v, t1, t2, first } = x;
      const T = t1 + t2;
      // first: speed up then steady; otherwise steady then brake to a stop.
      const pts = first ? [[0, 0], [t1, v], [T, v]] : [[0, v], [t2, v], [T, 0]];
      const shade = first
        ? [{ pts: [[0, 0], [t1, v], [t1, 0]], color: SHADE_B }, { pts: [[t1, 0], [t1, v], [T, v], [T, 0]], color: SHADE_A }]
        : [{ pts: [[0, 0], [0, v], [t2, v], [t2, 0]], color: SHADE_A }, { pts: [[t2, 0], [t2, v], [T, 0]], color: SHADE_B }];
      const area = v * t1 / 2 + v * t2;
      return {
        type: 'numeric',
        prompt: `This velocity–time graph shows a car trip. How far does the car travel altogether?${vtGraph({ points: pts, tMax: T, yMax: 20, shade })}`,
        answer: area, unit: 'm',
        hints: ['Split the area into simple shapes. Which parts are rectangles and which are triangles?', 'Rectangle = base × height. Triangle = ½ × base × height. Then add them.'],
        errors: [
          { value: v * T, msg: 'That treats the whole thing as one rectangle. Part of it is a triangle — only half as much.' },
          { value: v * T / 2, msg: 'That treats the whole thing as one triangle. Split it into a triangle AND a rectangle.' },
          { value: v * t2, msg: 'That\'s only the rectangle. Add the triangle too.' },
        ],
        solution: first
          ? `Triangle ½ × ${t1} × ${v} = ${v * t1 / 2} m, rectangle ${t2} × ${v} = ${v * t2} m. Total <b>${area} m</b>`
          : `Rectangle ${t2} × ${v} = ${v * t2} m, triangle ½ × ${t1} × ${v} = ${v * t1 / 2} m. Total <b>${area} m</b>`,
      };
    },
  },
  {
    id: 'u3.vt-flat-mcq', concepts: [C.vt], tier: 'explorer',
    generate(r) {
      const v = r.pick([4, 6, 8, 10, 12]);
      return {
        type: 'mcq',
        prompt: `This is a <b>velocity–time</b> graph. What is the car doing?${vtGraph({ points: [[0, v], [10, v]], tMax: 10, yMax: 16 })}`,
        choices: [`Moving at a steady ${v} m/s`, 'Standing still', `Speeding up by ${v} m/s every second`, `Travelling ${v} m and then stopping`],
        answer: 0,
        explain: `The velocity stays at ${v} m/s the whole time, so the car moves at a steady speed. (On a DISTANCE–time graph a flat line means stopped — always check the axis labels!)`,
      };
    },
  },
  {
    id: 'u3.vt-shape-mcq', concepts: [C.vt], tier: 'explorer',
    generate(r) {
      const g = (pts) => vtGraph({ points: pts, tMax: 10, yMax: 10, small: true, w: 140, h: 100, tStep: 2, yStep: 2 });
      const k = r.int(0, 3);
      const what = ['speeding up', 'moving at a steady speed', 'slowing down', 'standing still'][k];
      const explain = [
        'The velocity goes up as time goes on: speeding up. The steeper the line, the bigger the acceleration.',
        'The velocity stays the same, but it isn\'t zero: steady speed. (Flat means stopped only on a distance–time graph, or when the line sits on 0.)',
        'The velocity goes down: slowing down. Its slope (the acceleration) is negative.',
        'The velocity is 0 the whole time: standing still.',
      ][k];
      return {
        type: 'mcq', grid: true,
        prompt: `Which <b>velocity–time</b> graph shows a car <b>${what}</b>?`,
        choices: [g([[0, 1], [10, 9]]), g([[0, 6], [10, 6]]), g([[0, 9], [10, 1]]), g([[0, 0], [10, 0]])],
        answer: k,
        explain,
      };
    },
  },
  {
    id: 'u3.vt-meaning-mcq', concepts: [C.vt], tier: 'explorer',
    generate(r) {
      const slope = r.chance(0.5);
      return {
        type: 'mcq',
        prompt: `On a <b>velocity–time</b> graph, what does the <b>${slope ? 'slope (steepness) of the line' : 'area under the line'}</b> tell you?`,
        choices: ['The acceleration', 'The distance travelled', 'The speed at the start', 'The time taken'],
        answer: slope ? 0 : 1,
        explain: slope
          ? 'Slope = change in velocity ÷ change in time = acceleration.'
          : 'Area = velocity × time (like a rectangle\'s height × base) = distance travelled.',
      };
    },
  },

  // ---------- Lesson 4: equations from graphs ----------
  {
    id: 'u3.eq-v', concepts: [C.suvat], tier: 'scientist',
    generate() {
      return {
        type: 'equation', prompt: 'The slope gives <b>a = (v − u) ÷ t</b>. Rearrange it to find the final velocity <b>v</b>.',
        lhs: 'v', tiles: ['u', '+', 'a', '×', 't', '−', '÷'],
        answers: [['u', '+', 'a', '×', 't'], ['u', '+', 't', '×', 'a'], ['a', '×', 't', '+', 'u'], ['t', '×', 'a', '+', 'u']],
        explain: 'Multiply both sides by t: at = v − u. Then add u to both sides: v = u + at. (Start speed + speed gained.)',
      };
    },
  },
  {
    id: 'u3.eq-s', concepts: [C.suvat], tier: 'scientist',
    generate() {
      const f = ['½', '(u + v)', 't'];
      const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map((p) => [f[p[0]], '×', f[p[1]], '×', f[p[2]]]);
      return {
        type: 'equation', prompt: 'The area under a v–t graph that goes from u to v in time t is a trapezium. Build the formula for the distance <b>s</b>.',
        lhs: 's', tiles: ['½', '×', '(u + v)', '×', 't', '(v − u)', '+'], answers: perms,
        explain: 'Average velocity = ½(u + v), and distance = average velocity × time: s = ½(u + v)t.',
      };
    },
  },
  {
    id: 'u3.suvat-avg', concepts: [C.suvat], tier: 'scientist',
    generate(r) {
      const x = until(r, (rr) => {
        const up = rr.chance(0.6);
        const u = rr.int(0, 14), t = rr.int(2, 8), a = up ? rr.pick([1, 2, 3, 4]) : -rr.pick([2, 3, 4, 5, 6]);
        return { up, u, t, v: u + a * t, a };
      }, (x) => x.v >= 0 && x.v <= 30 && x.u !== x.v && Number.isInteger((x.u + x.v) * x.t / 2)
        && distinct((x.u + x.v) * x.t / 2, x.v * x.t, (x.u + x.v) * x.t, x.u * x.t));
      const { up, u, t, v, a } = x;
      const s = (u + v) * t / 2;
      // Minecarts are slower and gentler than cars.
      const name = Math.max(u, v) <= 12 && Math.abs(a) <= 2 ? r.pick(['A car', 'A minecart']) : 'A car';
      return {
        type: 'numeric',
        prompt: `${name} ${up ? 'speeds up' : 'slows down'} steadily from <b>${u} m/s</b> to <b>${v} m/s</b> in <b>${t} s</b>. How far does it travel?`,
        answer: s, unit: 'm',
        hints: ['What is its average speed while the speed changes steadily?', 's = ½(u + v)t: average of the two speeds × time.'],
        errors: [
          { value: v * t, msg: 'That uses only the final speed. Its speed changed — use the average ½(u + v).' },
          { value: (u + v) * t, msg: 'You forgot the ½: the average of two speeds is half their total.' },
          { value: u * t, msg: 'That uses only the starting speed. Use the average ½(u + v).' },
        ],
        solution: `s = ½ × (${u} + ${v}) × ${t} = ${fmt((u + v) / 2)} × ${t} = <b>${s} m</b>`,
      };
    },
  },
  {
    id: 'u3.suvat-avg-t', concepts: [C.suvat], tier: 'engineer',
    generate(r) {
      const x = until(r, (rr) => {
        const u = rr.int(2, 12), a = rr.pick([1, 2, 3, 4]), t = rr.int(2, 8);
        return { u, a, t, v: u + a * t };
      }, (x) => x.v <= 30 && Number.isInteger((x.u + x.v) * x.t / 2)
        && distinct(x.t, (x.u + x.v) * x.t / 2 / x.v, x.t / 2));
      const { u, t, v } = x;
      const s = (u + v) * t / 2;
      return {
        type: 'numeric',
        prompt: `A car speeds up steadily from <b>${u} m/s</b> to <b>${v} m/s</b> and covers <b>${s} m</b> while doing it. How long does it take?`,
        answer: t, unit: 's',
        hints: ['What is the car\'s average speed?', 'time = distance ÷ average speed'],
        errors: [
          { value: s / v, msg: 'That uses the final speed. Use the average speed ½(u + v).' },
          { value: t / 2, msg: 'You divided by u + v instead of by the average ½(u + v).' },
        ],
        solution: `Average speed = ½ × (${u} + ${v}) = ${fmt((u + v) / 2)} m/s. t = ${s} ÷ ${fmt((u + v) / 2)} = <b>${t} s</b>`,
      };
    },
  },
  {
    id: 'u3.suvat-avg-v', concepts: [C.suvat], tier: 'engineer',
    generate(r) {
      const x = until(r, (rr) => {
        const u = rr.int(2, 12), a = rr.pick([1, 2, 3, 4]), t = rr.pick([2, 4, 5, 6, 8]);
        return { u, a, t, v: u + a * t };
      }, (x) => x.v <= 30 && Number.isInteger((x.u + x.v) * x.t / 2)
        && distinct(x.v, (x.u + x.v) / 2, x.u + x.v, x.v - x.u));
      const { u, t, v } = x;
      const s = (u + v) * t / 2;
      return {
        type: 'numeric',
        prompt: `A car joins a motorway at <b>${u} m/s</b> and speeds up steadily. After <b>${t} s</b> it has gone <b>${s} m</b>. How fast is it going at the end?`,
        answer: v, unit: 'm/s', unitChoices: ACC_UNITS,
        hints: ['What was its average speed, distance ÷ time?', 'The average speed is halfway between u and v. What must v be?'],
        errors: [
          { value: (u + v) / 2, msg: 'That\'s the average. v is as far above the average as u is below it.' },
          { value: u + v, msg: 'That\'s u + v. Take away u to find v.' },
          { value: v - u, msg: 'That\'s the speed it gained. Add the starting speed.' },
        ],
        solution: `Average speed = ${s} ÷ ${t} = ${fmt(s / t)} m/s = ½(${u} + v), so ${u} + v = ${u + v} and v = <b>${v} m/s</b>`,
      };
    },
  },
  {
    id: 'u3.avg-vel-mcq', concepts: [C.suvat], tier: 'scientist',
    generate(r) {
      const x = until(r, (rr) => ({ u: rr.int(1, 6) * 2, v: rr.int(4, 10) * 2 }), (x) => x.v > x.u && distinct((x.u + x.v) / 2, x.v, x.u + x.v, x.v - x.u));
      const { u, v } = x;
      return {
        type: 'mcq',
        prompt: `A car speeds up <b>steadily</b> from <b>${u} m/s</b> to <b>${v} m/s</b>. What is its average speed?`,
        choices: [`${(u + v) / 2} m/s`, `${v} m/s`, `${u + v} m/s`, `${v - u} m/s`],
        answer: 0,
        explain: `When the speed changes steadily, the average is exactly halfway: ½(${u} + ${v}) = ${(u + v) / 2} m/s. That's why s = ½(u + v)t.`,
      };
    },
  },

  // ---------- Lesson 5: the power equations ----------
  {
    id: 'u3.suvat-s', concepts: [C.power], tier: 'scientist',
    generate(r) {
      const x = until(r, (rr) => ({ u: rr.int(1, 10), a: rr.pick([1, 2, 3, 4]), t: rr.int(2, 6) }), (x) => {
        const s = x.u * x.t + x.a * x.t * x.t / 2;
        return Number.isInteger(s) && x.u + x.a * x.t <= 30
          && distinct(s, x.u * x.t + x.a * x.t * x.t, x.a * x.t * x.t / 2, x.u * x.t + x.a * x.t / 2);
      });
      const { u, a, t } = x;
      const s = u * t + a * t * t / 2;
      return {
        type: 'numeric',
        prompt: `A car going at <b>${u} m/s</b> accelerates at <b>${a} m/s²</b> for <b>${t} s</b>. How far does it travel in that time?`,
        answer: s, unit: 'm',
        hints: ['Which equation links u, a, t and the distance s?', 's = ut + ½at². Work out each part, then add.'],
        errors: [
          { value: u * t + a * t * t, msg: 'You forgot the ½ in ½at² (the triangle is half a rectangle).' },
          { value: a * t * t / 2, msg: `That's only the extra distance from speeding up. It was already moving at ${u} m/s — add ut.` },
          { value: u * t + a * t / 2, msg: 'Square the time in ½at²: it\'s ½ × a × t × t.' },
        ],
        solution: `s = ${u} × ${t} + ½ × ${a} × ${t}² = ${u * t} + ${a * t * t / 2} = <b>${s} m</b>`,
      };
    },
  },
  {
    id: 'u3.suvat-s-rest', concepts: [C.power], tier: 'explorer',
    generate(r) {
      const x = until(r, (rr) => ({ a: rr.pick([1, 2, 3, 4, 5]), t: rr.int(2, 8) }), (x) => {
        const s = x.a * x.t * x.t / 2;
        return Number.isInteger(s) && x.a * x.t <= 30 && distinct(s, x.a * x.t * x.t, x.a * x.t / 2, x.a * x.t);
      });
      const { a, t } = x;
      const s = a * t * t / 2;
      return {
        type: 'numeric',
        prompt: `A car starts from rest and accelerates at <b>${a} m/s²</b> for <b>${t} s</b>. How far does it go?`,
        answer: s, unit: 'm',
        hints: ['From rest, u = 0. What is left of s = ut + ½at²?', 'Square the time first, then multiply by ½ and by a.'],
        errors: [
          { value: a * t * t, msg: 'You forgot the ½.' },
          { value: a * t / 2, msg: 'Square the time: ½ × a × t × t.' },
          { value: a * t, msg: 'That\'s its final speed (in m/s), not the distance.' },
        ],
        solution: `s = ½ × ${a} × ${t}² = ½ × ${a} × ${t * t} = <b>${s} m</b>`,
      };
    },
  },
  {
    id: 'u3.v2-final', concepts: [C.power], tier: 'engineer',
    generate(r) {
      const OK_V = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 24, 25];
      const x = until(r, (rr) => ({ u: rr.pick([0, 0, 2, 3, 4, 5, 6, 8, 10]), v: rr.pick(OK_V), a: rr.pick([1, 2, 3, 4, 5]) }), (x) => {
        const s = (x.v * x.v - x.u * x.u) / (2 * x.a);
        return x.v > x.u + 1 && Number.isInteger(s) && s >= 6 && s <= 150
          && distinct(x.v, x.v * x.v, ...(x.u ? [Math.sqrt(2 * x.a * s)] : []), x.u + x.a * s);
      });
      const { u, v, a } = x;
      const s = (v * v - u * u) / (2 * a);
      const errors = [{ value: v * v, msg: 'That\'s v². Now take the square root to find v.' }, { value: u + a * s, msg: 'v = u + at needs a TIME. Here you know the distance, so use v² = u² + 2as.' }];
      if (u) errors.push({ value: Math.sqrt(2 * a * s), msg: `Don't forget u²: it was already going at ${u} m/s.` });
      return {
        type: 'numeric',
        prompt: u
          ? `A car going at <b>${u} m/s</b> accelerates at <b>${a} m/s²</b> over a distance of <b>${s} m</b>. How fast is it going at the end?`
          : `A car starts from rest and accelerates at <b>${a} m/s²</b> over a distance of <b>${s} m</b>. How fast is it going at the end?`,
        answer: v, unit: 'm/s', unitChoices: ACC_UNITS,
        hints: ['There is no time in the question. Which equation doesn\'t need one?', 'v² = u² + 2as. Work out v², then find the number that times itself gives it.'],
        errors,
        solution: `v² = ${u}² + 2 × ${a} × ${s} = ${u * u} + ${2 * a * s} = ${v * v}, so v = √${v * v} = <b>${v} m/s</b>`,
      };
    },
  },
  {
    id: 'u3.stop-dist', concepts: [C.stop, C.power], tier: 'scientist',
    generate(r) {
      const x = until(r, (rr) => ({ u: rr.pick([10, 12, 14, 15, 16, 18, 20, 24, 25, 30]), b: rr.pick([4, 5, 6, 7, 8]) }), (x) => {
        const s = x.u * x.u / (2 * x.b);
        return Number.isInteger(s) && distinct(s, x.u * x.u / x.b, x.u / x.b, x.u * x.u);
      });
      const { u, b } = x;
      const s = u * u / (2 * b);
      return {
        type: 'numeric',
        prompt: `A car going at <b>${u} m/s</b> brakes with a deceleration of <b>${b} m/s²</b>. What is its braking distance?`,
        answer: s, unit: 'm',
        hints: ['At the end the car has stopped. What is v? And what is a (careful with the sign)?', 'v² = u² + 2as with v = 0 gives s = u² ÷ (2 × deceleration).'],
        errors: [
          { value: u * u / b, msg: 'You forgot the 2: braking distance = u² ÷ (2 × deceleration).' },
          { value: u / b, msg: 'That\'s the time it takes to stop (in seconds), not the distance.' },
          { value: u * u, msg: 'That\'s u². Now divide by 2 × the deceleration.' },
        ],
        solution: `0 = ${u}² − 2 × ${b} × s, so s = ${u * u} ÷ ${2 * b} = <b>${s} m</b>`,
      };
    },
  },
  {
    id: 'u3.stop-scale', concepts: [C.stop], tier: 'scientist',
    generate(r) {
      const x = until(r, (rr) => {
        const k = rr.pick([2, 2, 3, 0.5]);
        const u = k === 0.5 ? rr.pick([16, 20, 24, 30]) : k === 3 ? rr.pick([5, 6, 8, 10]) : rr.pick([6, 8, 10, 12, 15]);
        const b = rr.pick([4, 5, 8]);
        return { k, u, b, D: u * u / (2 * b) };
      }, (x) => Number.isInteger(x.D) && isNice(x.D * x.k * x.k) && x.u * x.k <= 30 && distinct(x.D * x.k * x.k, x.D * x.k, x.D));
      const { k, u, D } = x;
      const word = { 2: 'twice as fast', 3: 'three times as fast', 0.5: 'half as fast' }[k];
      return {
        type: 'numeric',
        prompt: `At <b>${u} m/s</b> a car's braking distance is <b>${D} m</b>. With the same brakes, what is its braking distance at <b>${fmt(u * k)} m/s</b> (${word})?`,
        answer: D * k * k, unit: 'm',
        hints: ['Braking distance = u² ÷ (2 × deceleration). What happens to u² when u changes?', `The speed is ×${fmt(k)}. So u² is ×${fmt(k)} × ${fmt(k)}.`],
        errors: [
          { value: D * k, msg: `Braking distance depends on speed SQUARED, so it changes by ${fmt(k)} × ${fmt(k)}, not just ×${fmt(k)}.` },
          { value: D, msg: 'A different speed gives a different braking distance — it depends on u².' },
        ],
        solution: `Speed ×${fmt(k)} → distance ×${fmt(k * k)}: ${D} × ${fmt(k * k)} = <b>${fmt(D * k * k)} m</b>`,
      };
    },
  },
  {
    id: 'u3.stop-mcq', concepts: [C.stop], tier: 'explorer',
    generate(r) {
      const triple = r.chance(0.35);
      return {
        type: 'mcq',
        prompt: `A car drives <b>${triple ? 'three times' : 'twice'} as fast</b> as before, with the same brakes. What happens to its braking distance?`,
        choices: triple
          ? ['It is 9 times as long', 'It is 3 times as long', 'It is 6 times as long', 'It stays the same']
          : ['It is 4 times as long', 'It is twice as long', 'It is 8 times as long', 'It stays the same'],
        answer: 0,
        explain: `Braking distance = u² ÷ (2 × deceleration). ${triple ? '3² = 9' : '2² = 4'}: more speed needs a LOT more road to stop — that's why speed limits near schools matter!`,
      };
    },
  },
  {
    id: 'u3.brake-decel', concepts: [C.stop, C.power], tier: 'engineer',
    generate(r) {
      const x = until(r, (rr) => ({ u: rr.pick([10, 12, 14, 15, 16, 18, 20, 24, 30]), b: rr.pick([2, 2.5, 3, 4, 4.5, 5, 6, 7.5, 8]) }), (x) => {
        const s = x.u * x.u / (2 * x.b);
        return Number.isInteger(s) && s >= 10 && s <= 120 && distinct(x.b, x.u * x.u / s, x.u / s);
      });
      const { u, b } = x;
      const s = u * u / (2 * b);
      return {
        type: 'numeric',
        prompt: `A driver going at <b>${u} m/s</b> sees a red light <b>${s} m</b> ahead and brakes straight away. What deceleration does the car need to stop exactly on the line?`,
        answer: b, unit: ACC, unitChoices: ACC_UNITS,
        hints: ['Which equation links u, v, a and s without a time?', 'With v = 0, u² must equal 2 × deceleration × s. Rearrange for the deceleration.'],
        errors: [
          { value: u * u / s, msg: 'You forgot the 2: deceleration = u² ÷ (2s).' },
          { value: u / s, msg: 'Use v² = u² + 2as: square the speed.' },
        ],
        solution: `0 = ${u}² − 2 × a × ${s}, so a = ${u * u} ÷ ${2 * s} = <b>${fmt(b)} m/s²</b>`,
      };
    },
  },
  {
    id: 'u3.power-choose-mcq', concepts: [C.power, C.suvat], tier: 'scientist',
    generate(r) {
      const EQ = ['v = u + at', 's = ½(u + v)t', 's = ut + ½at²', 'v² = u² + 2as'];
      const cases = [
        { know: 'u, a and t', want: 'the final velocity v', k: 0 },
        { know: 'u, v and t', want: 'the distance s', k: 1 },
        { know: 'u, a and t', want: 'the distance s', k: 2 },
        { know: 'u, a and s (but not the time)', want: 'the final velocity v', k: 3 },
      ];
      const c = r.pick(cases);
      return {
        type: 'mcq',
        prompt: `You know <b>${c.know}</b>. You want <b>${c.want}</b>. Which equation gets you there in one step?`,
        choices: EQ, answer: c.k,
        explain: `Pick the equation that contains what you know and what you want, and nothing else unknown: <b>${EQ[c.k]}</b>.`,
      };
    },
  },
  {
    id: 'u3.eq-v2', concepts: [C.power], tier: 'scientist',
    generate() {
      return {
        type: 'equation', prompt: 'Build the power equation that links speeds and distance <b>without a time</b>.',
        lhs: 'v²', tiles: ['u²', '+', '2as', '−', 'at', '½at²'], answers: [['u²', '+', '2as'], ['2as', '+', 'u²']],
        explain: 'v² = u² + 2as. No t in it — perfect for braking distances.',
      };
    },
  },

  // ---------- Maths power-up: quadratics by factorisation ----------
  {
    id: 'u3.quad-solve', concepts: [C.quad], tier: 'scientist',
    generate(r) {
      const x = until(r, (rr) => {
        const root = rr.int(2, 9), q = root + rr.int(1, 8);
        return { root, q, b: q - root, c: root * q };
      }, (x) => x.c <= 120 && distinct(x.root, x.q, x.c / x.b));
      const { root, q, b, c } = x;
      const bt = b === 1 ? 't' : `${b}t`;
      return {
        type: 'numeric',
        prompt: `Solve <b>t² + ${bt} − ${c} = 0</b>. Here t is a time, so it can't be negative.`,
        answer: root, unit: 's',
        hints: [`Which two numbers multiply to make −${c} and add to make +${b}?`, 'Write it as (t + □)(t − □) = 0. A product is zero when one of the brackets is zero.'],
        errors: [
          { value: q, msg: `That's the size of the other answer, t = −${q}. Check the signs in your brackets: the bracket (t + ${q}) gives a negative time.` },
          { value: c / b, msg: 'You can\'t just divide — the t² matters too. Factorise into two brackets.' },
        ],
        solution: `(t + ${q})(t − ${root}) = 0, so t = ${root} or t = −${q}. A time can't be negative: <b>t = ${root} s</b>`,
      };
    },
  },
  {
    id: 'u3.quad-time', concepts: [C.quad, C.power], tier: 'engineer',
    generate(r) {
      const x = until(r, (rr) => ({ u: rr.int(1, 8), root: rr.int(2, 8), cart: rr.chance(0.4) }), (x) => {
        const s = x.u * x.root + x.root * x.root;
        return x.u + 2 * x.root <= (x.cart ? 12 : 24) && distinct(x.root, x.u + x.root, s / x.u);
      });
      const { u, root, cart } = x;
      const s = u * root + root * root;
      return {
        type: 'numeric',
        prompt: `${cart ? 'A minecart on a powered rail' : 'A car'} moving at <b>${u} m/s</b> accelerates at <b>2 m/s²</b>. How long does it take to travel <b>${s} m</b>?`,
        answer: root, unit: 's',
        hints: ['Put the numbers into s = ut + ½at². What is ½ × 2?', `Move everything to one side so it equals 0, then factorise. Which two numbers multiply to −${s} and add to +${u}?`],
        errors: [
          { value: u + root, msg: `That's the size of the negative answer t = −${u + root}, which we throw away. Check the signs in your brackets.` },
          { value: s / u, msg: 'That ignores the acceleration — the car keeps getting faster, so it takes less time.' },
        ],
        solution: `${s} = ${u === 1 ? '' : u}t + t² → t² + ${u === 1 ? '' : u}t − ${s} = 0 → (t + ${u + root})(t − ${root}) = 0. So t = ${root} or −${u + root}; time can't be negative: <b>t = ${root} s</b>`,
      };
    },
  },
  {
    id: 'u3.quad-time4', concepts: [C.quad, C.power], tier: 'engineer',
    generate(r) {
      const x = until(r, (rr) => ({ u: rr.pick([2, 4, 6, 8]), root: rr.int(2, 6) }), (x) => {
        const s = x.u * x.root + 2 * x.root * x.root;
        return x.u + 4 * x.root <= 30 && distinct(x.root, x.u / 2 + x.root, s / x.u);
      });
      const { u, root } = x;
      const s = u * root + 2 * root * root;
      const h = u / 2;
      return {
        type: 'numeric',
        prompt: `A car moving at <b>${u} m/s</b> accelerates at <b>4 m/s²</b>. How long does it take to travel <b>${s} m</b>?`,
        answer: root, unit: 's',
        hints: ['What does s = ut + ½at² become with these numbers — and what number sits in front of t²?', 'Divide every term by 2 so the t² stands alone, then factorise.'],
        errors: [
          { value: h + root, msg: `That's the size of the negative answer t = −${h + root}, which we throw away.` },
          { value: s / u, msg: 'That ignores the acceleration — the car keeps getting faster.' },
        ],
        solution: `${s} = ${u}t + 2t² → ÷ 2: t² + ${h === 1 ? '' : h}t − ${s / 2} = 0 → (t + ${h + root})(t − ${root}) = 0, so <b>t = ${root} s</b>`,
      };
    },
  },
  {
    id: 'u3.quad-root-mcq', concepts: [C.quad], tier: 'explorer',
    generate(r) {
      const root = r.int(2, 8), q = root + r.int(2, 6);
      return {
        type: 'mcq',
        prompt: `Pip solves a motion problem and gets <b>(t + ${q})(t − ${root}) = 0</b>, so t = ${root} or t = −${q}. How long did the trip take?`,
        choices: [`${root} s`, `−${q} s`, `Both: ${root} s and −${q} s`, `${q + root} s`],
        answer: 0,
        explain: `The equation only describes the motion from t = 0 onwards. t = −${q} would be ${q} seconds BEFORE the start, so we throw it away. The answer is ${root} s.`,
      };
    },
  },
  {
    id: 'u3.quad-factor-mcq', concepts: [C.quad], tier: 'scientist',
    generate(r) {
      const x = until(r, (rr) => {
        const root = rr.int(2, 8), q = root + rr.int(1, 6);
        return { root, q };
      }, (x) => x.root * x.q <= 80);
      const { root, q } = x;
      const b = q - root, c = root * q;
      return {
        type: 'mcq',
        prompt: `Which is the right way to factorise <b>t² + ${b === 1 ? '' : b}t − ${c} = 0</b>?`,
        choices: [`(t + ${q})(t − ${root}) = 0`, `(t − ${q})(t + ${root}) = 0`, `(t + ${q})(t + ${root}) = 0`, `(t − ${q})(t − ${root}) = 0`],
        answer: 0,
        explain: `We need two numbers that multiply to −${c} and add to +${b}: +${q} and −${root}. Check: ${q} × (−${root}) = −${c} and ${q} − ${root} = ${b}.`,
      };
    },
  },

  // ---------- Problem Set B: word problems ----------
  {
    id: 'u3.wp-sprinter', concepts: [C.suvat], tier: 'scientist',
    generate(r) {
      const x = until(r, (rr) => ({ v: rr.pick([8, 9, 10]), t: rr.pick([2, 3, 4]) }), (x) => x.v / x.t <= 5 && x.v / x.t >= 2 && distinct(x.v * x.t / 2, x.v * x.t, x.v / x.t));
      const { v, t } = x;
      return {
        type: 'numeric',
        prompt: `A sprinter starts from rest and speeds up steadily, reaching her top speed of <b>${v} m/s</b> after <b>${t} s</b>. How far has she run by then?`,
        answer: v * t / 2, unit: 'm',
        hints: ['Her speed went steadily from 0 to ' + v + ' m/s — what was her average speed?', 'distance = average speed × time = ½(u + v)t'],
        errors: [
          { value: v * t, msg: 'She wasn\'t at top speed the whole time. Use her average speed, ½(0 + ' + v + ').' },
          { value: v / t, msg: 'That\'s her acceleration. The question asks for the distance.' },
        ],
        solution: `s = ½ × (0 + ${v}) × ${t} = <b>${fmt(v * t / 2)} m</b>`,
      };
    },
  },
  {
    id: 'u3.wp-takeoff', concepts: [C.power], tier: 'scientist',
    generate(r) {
      const [v, a] = r.pick([[60, 2], [70, 2.5], [80, 4], [60, 3], [80, 2.5], [50, 2.5], [70, 3.5], [60, 2.5]]);
      const s = v * v / (2 * a);
      return {
        type: 'numeric',
        prompt: `A plane starts from rest at the end of the runway and accelerates at <b>${fmt(a)} m/s²</b>. It needs <b>${v} m/s</b> to take off. How long must the runway be (at least)?`,
        answer: s, unit: 'm',
        hints: ['You know u, v and a, but not the time. Which equation fits?', 'v² = u² + 2as with u = 0. Rearrange for s.'],
        errors: [
          { value: v * v / a, msg: 'You forgot the 2: s = v² ÷ (2a).' },
          { value: v / a, msg: 'That\'s how many seconds it takes. The question asks for a distance.' },
        ],
        solution: `${v}² = 0 + 2 × ${fmt(a)} × s, so s = ${v * v} ÷ ${fmt(2 * a)} = <b>${fmt(s)} m</b>`,
      };
    },
  },
  {
    id: 'u3.wp-train', concepts: [C.power], tier: 'scientist',
    generate(r) {
      const [a, t] = r.pick([[0.5, 20], [0.5, 40], [0.5, 60], [1, 20], [1, 30], [0.5, 30]]);
      const s = a * t * t / 2;
      return {
        type: 'numeric',
        prompt: `A train pulls out of a station and accelerates steadily at <b>${fmt(a)} m/s²</b> for <b>${t} s</b>. How far does it travel in that time?`,
        answer: s, unit: 'm',
        hints: ['It starts from rest, so u = 0. Which equation uses a and t to give s?', 's = ut + ½at². Square the time first.'],
        errors: [
          { value: a * t * t, msg: 'You forgot the ½.' },
          { value: a * t / 2, msg: 'Square the time: ½ × a × t × t.' },
        ],
        solution: `s = ½ × ${fmt(a)} × ${t}² = ½ × ${fmt(a)} × ${t * t} = <b>${fmt(s)} m</b> (by then it is doing ${fmt(a * t)} m/s)`,
      };
    },
  },
  {
    id: 'u3.wp-elytra', concepts: [C.power], tier: 'scientist',
    generate(r) {
      const x = until(r, (rr) => ({ u: rr.pick([8, 10, 12]), a: rr.pick([4, 5, 6]), t: rr.pick([2, 3]) }), (x) => {
        const s = x.u * x.t + x.a * x.t * x.t / 2;
        return Number.isInteger(s) && distinct(s, x.u * x.t, x.u * x.t + x.a * x.t * x.t, x.a * x.t * x.t / 2);
      });
      const { u, a, t } = x;
      const s = u * t + a * t * t / 2;
      return {
        type: 'numeric',
        prompt: `Pip glides with his Elytra at <b>${u} m/s</b>. He fires a firework rocket, which gives him an acceleration of <b>${a} m/s²</b> for <b>${t} s</b>. How far does he fly during the boost?`,
        answer: s, unit: 'm',
        hints: ['Is he speeding up the whole time? Which equation uses u, a and t?', 's = ut + ½at²'],
        errors: [
          { value: u * t, msg: 'That\'s how far he would glide with no boost. Add the extra ½at².' },
          { value: u * t + a * t * t, msg: 'You forgot the ½ in ½at².' },
          { value: a * t * t / 2, msg: `That's only the extra distance from the boost. He was already gliding at ${u} m/s — add ut.` },
        ],
        solution: `s = ${u} × ${t} + ½ × ${a} × ${t}² = ${u * t} + ${a * t * t / 2} = <b>${s} m</b>`,
      };
    },
  },
  {
    id: 'u3.wp-two-stage', concepts: [C.power, C.vt], tier: 'engineer',
    generate(r) {
      const x = until(r, (rr) => ({ a: rr.pick([2, 3, 4, 5]), t1: rr.int(2, 6), T: rr.pick([5, 10, 15, 20]) }), (x) => {
        const v = x.a * x.t1, s1 = v * x.t1 / 2, s = s1 + v * x.T;
        return v >= 10 && v <= 25 && Number.isInteger(s1) && distinct(s, s1, v * x.T, v * (x.t1 + x.T));
      });
      const { a, t1, T } = x;
      const v = a * t1, s1 = v * t1 / 2, s = s1 + v * T;
      return {
        type: 'numeric',
        prompt: `A car starts from rest and accelerates at <b>${a} m/s²</b> for <b>${t1} s</b>. Then it cruises at that speed for another <b>${T} s</b>. How far does it go altogether?`,
        answer: s, unit: 'm',
        hints: ['Split the trip into two parts. How fast is it going when it stops speeding up?', 'Part 1: s = ½at² (a triangle on the v–t graph). Part 2: distance = speed × time (a rectangle). Add them.'],
        errors: [
          { value: s1, msg: 'That\'s only the speeding-up part. Add the cruising part.' },
          { value: v * T, msg: 'That\'s only the cruising part. Add the speeding-up part.' },
          { value: v * (t1 + T), msg: `It wasn't going at ${v} m/s for the first ${t1} s — that part is a triangle, not a rectangle.` },
        ],
        solution: `Top speed ${a} × ${t1} = ${v} m/s. Part 1: ½ × ${a} × ${t1}² = ${s1} m. Part 2: ${v} × ${T} = ${v * T} m. Total <b>${s} m</b>`,
      };
    },
  },
  {
    id: 'u3.wp-stopping', concepts: [C.stop], tier: 'engineer',
    generate(r) {
      const x = until(r, (rr) => ({ u: rr.pick([10, 12, 15, 16, 20, 24, 25, 30]), tr: rr.pick([0.5, 1, 1.5]), b: rr.pick([4, 5, 6, 8]) }), (x) => {
        const think = x.u * x.tr, brake = x.u * x.u / (2 * x.b);
        return Number.isInteger(think) && Number.isInteger(brake) && distinct(think + brake, think, brake, think + 2 * brake);
      });
      const { u, tr, b } = x;
      const think = u * tr, brake = u * u / (2 * b);
      return {
        type: 'numeric',
        prompt: `A driver going at <b>${u} m/s</b> sees a creeper on the road. It takes her <b>${fmt(tr)} s</b> to react (the car keeps going at full speed), then she brakes at <b>${b} m/s²</b>. What is the total stopping distance?`,
        answer: think + brake, unit: 'm',
        hints: ['How far does the car go before she presses the brake? And after?', 'Thinking distance = speed × reaction time. Braking distance = u² ÷ (2 × deceleration). Add them.'],
        errors: [
          { value: brake, msg: 'That\'s just the braking distance. The car also moves while she reacts.' },
          { value: think, msg: 'That\'s just the thinking distance. Add the braking distance.' },
          { value: think + 2 * brake, msg: 'Braking distance = u² ÷ (2 × deceleration) — did you forget the 2?' },
        ],
        solution: `Thinking: ${u} × ${fmt(tr)} = ${think} m. Braking: ${u * u} ÷ ${2 * b} = ${brake} m. Total <b>${think + brake} m</b>`,
      };
    },
  },
  {
    id: 'u3.puzzle-catchup', concepts: [C.quad, C.power], tier: 'engineer', puzzle: true,
    generate(r) {
      // Alex: s = ½ × 2 × t² = t². Pip: s = d + wt. Meet when t² − wt − d = 0 = (t − root)(t + q).
      const x = until(r, (rr) => {
        const root = rr.int(4, 6), q = rr.int(1, root - 1);
        return { root, q, w: root - q, d: root * q };
      }, (x) => x.w >= 2 && x.w <= 6 && distinct(x.root, x.q, x.d / x.w));
      const { root, q, w, d } = x;
      return {
        type: 'numeric',
        prompt: `Pip's minecart rolls along at a steady <b>${w} m/s</b>. When it is <b>${d} m</b> ahead, Alex's minecart starts from rest behind it on a powered rail, accelerating at <b>2 m/s²</b>. How many seconds until Alex catches Pip?`,
        answer: root, unit: 's',
        hints: ['How far is each cart from Alex\'s start after t seconds?', `Alex: ½ × 2 × t² = t². Pip: ${d} + ${w}t. They meet when these are equal.`, `Make it = 0 and factorise: which two numbers multiply to −${d} and add to −${w}?`],
        errors: [
          { value: q, msg: `That's the size of the negative answer t = −${q}. Check the signs in your brackets.` },
          { value: d / w, msg: 'Alex doesn\'t move at a steady speed — he keeps speeding up. Use s = ½at² for Alex.' },
        ],
        solution: `t² = ${d} + ${w}t → t² − ${w}t − ${d} = 0 → (t − ${root})(t + ${q}) = 0, so <b>t = ${root} s</b>. Check: Alex ${root * root} m, Pip ${d} + ${w * root} = ${d + w * root} m ✔`,
      };
    },
  },
  {
    id: 'u3.puzzle-stopping', concepts: [C.quad, C.stop], tier: 'engineer', puzzle: true,
    generate(r) {
      // Stopping distance D = u·tr + u²/(2b) → u² + 2b·tr·u − 2bD = 0 = (u − speed)(u + speed + 2b·tr).
      const x = until(r, (rr) => ({ b: rr.pick([4, 5, 8]), tr: rr.pick([0.5, 1]), u: rr.pick([8, 10, 12, 16, 20, 24]) }), (x) => {
        const D = x.u * x.tr + x.u * x.u / (2 * x.b);
        return Number.isInteger(D) && D <= 100 && Number.isInteger(2 * x.b * x.tr) && distinct(x.u, D / x.tr, Math.sqrt(2 * x.b * D), x.u + 2 * x.b * x.tr);
      });
      const { b, tr, u } = x;
      const D = u * tr + u * u / (2 * b);
      const k = 2 * b * tr;
      return {
        type: 'numeric',
        prompt: `A creeper steps onto the road <b>${D} m</b> ahead of a car. The driver takes <b>${fmt(tr)} s</b> to react, then brakes at <b>${b} m/s²</b>. What is the <b>fastest</b> the car can be going and still stop in time?`,
        answer: u, unit: 'm/s', unitChoices: ACC_UNITS,
        hints: ['If the speed is u, how far does the car go while she reacts, and while she brakes?', `Thinking: ${fmt(tr)}u. Braking: u² ÷ ${2 * b}. Together they make ${D} m.`, `Multiply everything by ${2 * b}, make it = 0 and factorise.`],
        errors: [
          { value: Math.sqrt(2 * b * D), msg: 'That forgets the reaction time — the car travels at full speed while the driver reacts.' },
          { value: D / tr, msg: 'That forgets the braking distance.' },
          { value: u + k, msg: `That's the size of the negative answer. A speed of −${u + k} m/s makes no sense here.` },
        ],
        solution: `${fmt(tr)}u + u² ÷ ${2 * b} = ${D} → u² + ${k}u − ${2 * b * D} = 0 → (u + ${u + k})(u − ${u}) = 0, so <b>u = ${u} m/s</b>. Check: ${u * tr} m + ${u * u / (2 * b)} m = ${D} m ✔`,
      };
    },
  },
];

// An error value with more than 2 decimal places can never be typed on the keypad: drop it.
registerTemplates(TEMPLATES.map((t) => ({
  ...t,
  generate(r) {
    const q = t.generate(r);
    if (q.errors) q.errors = q.errors.filter((e) => isNice(e.value));
    return q;
  },
})));
