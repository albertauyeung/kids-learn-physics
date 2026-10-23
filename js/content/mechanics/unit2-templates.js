// Unit 2 — Velocity & Relative Motion: problem templates.
import { registerTemplates, until } from '../../engine/templates.js';
import { graphSVG, triangleSVG } from '../../engine/graph-svg.js';
import { fmt, fmtSigned } from '../../core/util.js';

const C = {
  vel: 'mech.velocity',
  add: 'mech.vector-add',
  rel: 'mech.relative-motion',
  pyth: 'mech.pythagoras',
  slope: 'mech.slope',
};

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a * b) / gcd(a, b);

const SIGN_NOTE = '<br><small>Use + for right and − for left.</small>';
// Easy triples have hypotenuses whose squares (25, 100, 169) appear in the lesson's table of squares.
const EASY_TRIPLES = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13]];
const TRIPLES = [...EASY_TRIPLES, [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25]];

registerTemplates([
  // ---------- Lesson 1: speed vs velocity ----------
  {
    id: 'u2.vel-avg', concepts: [C.vel], tier: 'scientist',
    generate(r) {
      // The longer leg may come first or second, and either direction may come first,
      // so the sign of the answer can't be guessed from the wording.
      const t = r.int(2, 5), net = t * r.int(1, 3), short = r.int(1, 6);
      const [a, b] = r.chance(0.5) ? [net + short, short] : [short, net + short];
      const s1 = r.chance(0.5) ? 1 : -1; // +1: first leg goes right
      const [d1, d2] = s1 > 0 ? ['right', 'left'] : ['left', 'right'];
      const disp = s1 * (a - b);
      const v = disp / t;
      return {
        type: 'numeric', signed: true,
        prompt: `Pip walks <b>${a} m ${d1}</b>, then <b>${b} m ${d2}</b>. The whole walk takes <b>${t} s</b>. What is his <b>average velocity</b>?${SIGN_NOTE}`,
        answer: v, unit: 'm/s',
        hints: ['average velocity = displacement ÷ time', `Displacement = ${s1 > 0 ? '+' : '−'}${a} ${s1 > 0 ? '−' : '+'} ${b} = ${fmtSigned(disp)} m`],
        solution: `Displacement = ${fmtSigned(disp)} m. Velocity = ${fmtSigned(disp)} ÷ ${t} = <b>${fmtSigned(v)} m/s</b>`,
      };
    },
  },
  {
    id: 'u2.speed-avg', concepts: [C.vel], tier: 'scientist',
    generate(r) {
      const t = r.int(2, 5), k = r.int(2, 4), total = t * k;
      const b = r.int(1, Math.floor((total - 1) / 2)), a = total - b;
      return {
        type: 'numeric',
        prompt: `Pip walks <b>${a} m right</b>, then <b>${b} m left</b>, taking <b>${t} s</b> altogether. What is his <b>average speed</b>?`,
        answer: total / t, unit: 'm/s',
        hints: ['average speed = total DISTANCE ÷ time (direction does not matter)', `Distance = ${a} + ${b}`],
        solution: `Distance = ${total} m. Speed = ${total} ÷ ${t} = <b>${fmt(total / t)} m/s</b>`,
      };
    },
  },
  {
    id: 'u2.vel-sign-mcq', concepts: [C.vel], tier: 'explorer',
    generate(r) {
      const v = r.pick([-5, -3, -2, 4, 6, 3]);
      const s = Math.abs(v);
      return {
        type: 'mcq', prompt: `A minecart has a velocity of <b>${fmtSigned(v)} m/s</b> (+ means right). What is it doing?`,
        choices: [`Moving right at ${s} m/s`, `Moving left at ${s} m/s`, 'Slowing down', 'Standing still'],
        answer: v > 0 ? 0 : 1, keepOrder: true,
        explain: `The number (${s}) is the speed. The sign tells the direction: ${v > 0 ? '+ is right' : '− is left'}.`,
      };
    },
  },

  // ---------- Lesson 2: adding velocities ----------
  {
    id: 'u2.add-same', concepts: [C.add], tier: 'explorer',
    generate(r) {
      const w = r.pick([0.5, 1, 1.5, 2]), k = r.pick([1, 1.5, 2, 2.5]);
      return {
        type: 'numeric',
        prompt: `Pip walks at <b>${fmt(k)} m/s</b> along a moving walkway that goes <b>${fmt(w)} m/s</b> in the <b>same direction</b>. How fast does he move compared with the ground?`,
        answer: w + k, unit: 'm/s', hints: ['Same direction: the arrows point the same way — add them.'],
        solution: `${fmt(w)} + ${fmt(k)} = <b>${fmt(w + k)} m/s</b>`,
      };
    },
  },
  {
    id: 'u2.add-opposite', concepts: [C.add], tier: 'scientist',
    generate(r) {
      const v = until(r, (rr) => ({ w: rr.pick([1, 1.5, 2, 3]), k: rr.pick([1, 2, 2.5, 3, 4]) }), (x) => x.w !== x.k);
      return {
        type: 'numeric', signed: true,
        prompt: `A walkway moves <b>right at ${fmt(v.w)} m/s</b>. Pip walks <b>left at ${fmt(v.k)} m/s</b> on it. What is Pip's velocity relative to the ground?${SIGN_NOTE}`,
        answer: v.w - v.k, unit: 'm/s', hints: ['Right is +, left is −.', `Ground velocity = (+${fmt(v.w)}) + (−${fmt(v.k)})`],
        solution: `+${fmt(v.w)} − ${fmt(v.k)} = <b>${fmtSigned(v.w - v.k)} m/s</b> (${v.w > v.k ? 'he still drifts right' : 'he moves left'})`,
      };
    },
  },
  {
    id: 'u2.boat-line', concepts: [C.add], tier: 'scientist',
    generate(r) {
      const b = r.pick([4, 5, 6, 8]), c = r.pick([1, 2, 3]);
      const down = r.chance(0.5);
      return {
        type: 'numeric',
        prompt: `A boat can go <b>${b} m/s</b> in still water. The river flows at <b>${c} m/s</b>. How fast does the boat move past the bank when it goes <b>${down ? 'downstream (with the current)' : 'upstream (against the current)'}</b>?`,
        answer: down ? b + c : b - c, unit: 'm/s', hints: [down ? 'With the current: add.' : 'Against the current: subtract.'],
        solution: `${b} ${down ? '+' : '−'} ${c} = <b>${down ? b + c : b - c} m/s</b>`,
      };
    },
  },

  // ---------- Lesson 3: relative motion ----------
  {
    id: 'u2.rel-meet', concepts: [C.rel], tier: 'scientist',
    generate(r) {
      const v1 = r.int(2, 8), v2 = r.int(1, 7), t = r.int(2, 10);
      const gap = (v1 + v2) * t;
      return {
        type: 'numeric',
        prompt: `Two minecarts are <b>${gap} m</b> apart and roll <b>towards each other</b> at <b>${v1} m/s</b> and <b>${v2} m/s</b>. How long until they meet?`,
        answer: t, unit: 's', hints: ['Closing speed = add the speeds (they move towards each other).', `time = gap ÷ closing speed = ${gap} ÷ ${v1 + v2}`],
        solution: `Closing speed ${v1} + ${v2} = ${v1 + v2} m/s. Time = ${gap} ÷ ${v1 + v2} = <b>${t} s</b>`,
      };
    },
  },
  {
    id: 'u2.rel-meetpos', concepts: [C.rel], tier: 'scientist',
    generate(r) {
      const v1 = r.int(2, 8), v2 = r.int(1, 7), t = r.int(2, 8);
      const gap = (v1 + v2) * t;
      return {
        type: 'numeric',
        prompt: `Cart A and cart B start <b>${gap} m</b> apart and roll towards each other. A goes <b>${v1} m/s</b>, B goes <b>${v2} m/s</b>. <b>How far from A's start</b> do they meet?`,
        answer: v1 * t, unit: 'm', hints: ['First find when they meet: gap ÷ (v₁ + v₂).', 'Then: how far does A travel in that time?'],
        solution: `They meet after ${gap} ÷ ${v1 + v2} = ${t} s. A travels ${v1} × ${t} = <b>${v1 * t} m</b>`,
      };
    },
  },
  {
    id: 'u2.rel-chase', concepts: [C.rel], tier: 'scientist',
    generate(r) {
      const v2 = r.int(1, 6), diff = r.int(1, 4), v1 = v2 + diff, t = r.int(3, 10);
      const gap = diff * t;
      return {
        type: 'numeric',
        prompt: `Cart B starts <b>${gap} m ahead</b> and rolls at <b>${v2} m/s</b>. Cart A chases it at <b>${v1} m/s</b> in the same direction. How long until A catches B?`,
        answer: t, unit: 's', hints: ['Same direction: closing speed = faster − slower.', `${gap} ÷ (${v1} − ${v2})`],
        solution: `Closing speed ${v1} − ${v2} = ${diff} m/s. Time = ${gap} ÷ ${diff} = <b>${t} s</b>`,
      };
    },
  },
  {
    id: 'u2.rel-same-mcq', concepts: [C.rel], tier: 'explorer',
    generate(r) {
      const v = r.pick([4, 6, 8]);
      return {
        type: 'mcq',
        prompt: `You sit in a minecart rolling at <b>${v} m/s</b>. Your friend's cart rolls right beside yours at <b>${v} m/s</b>, the same way. To you, how does your friend seem to move?`,
        choices: ['Standing still', `Moving at ${v} m/s`, `Moving at ${2 * v} m/s`, 'Going backwards'], answer: 0, keepOrder: true,
        explain: `Relative velocity = ${v} − ${v} = 0. That's why passengers on a train can play cards!`,
      };
    },
  },

  // ---------- Lesson 4: Pythagoras & river crossing ----------
  {
    id: 'u2.pyth-hyp', concepts: [C.pyth], tier: 'scientist',
    generate(r) {
      const [a, b, c] = r.pick(EASY_TRIPLES);
      return {
        type: 'numeric',
        prompt: `Find the longest side (the hypotenuse) of this right-angled triangle.${triangleSVG({ a, b, aLabel: `${a} m`, bLabel: `${b} m`, cLabel: '?' })}`,
        answer: c, unit: 'm', hints: ['a² + b² = c²', `${a}² + ${b}² = ${a * a} + ${b * b}`, 'c is the number that, times itself, gives that total (its square root √)'],
        solution: `${a}² + ${b}² = ${a * a + b * b}, and √${c * c} = <b>${c} m</b>`,
      };
    },
  },
  {
    id: 'u2.pyth-leg', concepts: [C.pyth], tier: 'engineer',
    generate(r) {
      const [a, b, c] = r.pick(TRIPLES);
      return {
        type: 'numeric',
        prompt: `A right-angled triangle has a hypotenuse of <b>${c} m</b> and one short side of <b>${b} m</b>. How long is the other short side?`,
        answer: a, unit: 'm', hints: ['a² + b² = c², so a² = c² − b²', `a² = ${c * c} − ${b * b} = ${a * a}`],
        solution: `a² = ${c * c} − ${b * b} = ${a * a}, so a = <b>${a} m</b>`,
      };
    },
  },
  {
    id: 'u2.pyth-walk', concepts: [C.pyth, C.vel], tier: 'scientist',
    generate(r) {
      const [a, b, c] = r.pick(EASY_TRIPLES);
      return {
        type: 'numeric',
        prompt: `Pip walks <b>${a} blocks east</b>, then <b>${b} blocks north</b>. How far is he from his start in a straight line (the size of his displacement)? (1 block = 1 m)`,
        answer: c, unit: 'm', hints: ['East and north make a right angle → Pythagoras!', `√(${a}² + ${b}²)`],
        solution: `√(${a * a} + ${b * b}) = √${c * c} = <b>${c} m</b> (he walked a distance of ${a + b} m)`,
      };
    },
  },
  {
    id: 'u2.river-speed', concepts: [C.pyth, C.add], tier: 'scientist',
    generate(r) {
      const [b, c, s] = r.pick([[4, 3, 5], [3, 4, 5], [8, 6, 10], [6, 8, 10], [12, 5, 13], [5, 12, 13]]);
      return {
        type: 'numeric',
        prompt: `A boat points straight across a river at <b>${b} m/s</b>. The current pushes it sideways at <b>${c} m/s</b>. What is the boat's actual speed?`,
        answer: s, unit: 'm/s', hints: ['The two velocities are at right angles.', `speed = √(${b}² + ${c}²)`],
        solution: `√(${b * b} + ${c * c}) = √${s * s} = <b>${s} m/s</b>`,
      };
    },
  },
  {
    id: 'u2.river-time', concepts: [C.add], tier: 'scientist',
    generate(r) {
      const b = r.pick([2, 3, 4, 5]), t = r.int(3, 10), c = r.pick([1, 2, 3]);
      return {
        type: 'numeric',
        prompt: `A river is <b>${b * t} m</b> wide. A boat points straight across at <b>${b} m/s</b> while the current flows at <b>${c} m/s</b>. How long does it take to cross?`,
        answer: t, unit: 's', hints: ['Only the "across" speed gets you to the other side. The current just pushes you sideways.', `${b * t} ÷ ${b}`],
        solution: `time = width ÷ across-speed = ${b * t} ÷ ${b} = <b>${t} s</b> (the current doesn't change this!)`,
      };
    },
  },
  {
    id: 'u2.river-drift', concepts: [C.add], tier: 'scientist',
    generate(r) {
      const b = r.pick([2, 3, 4, 5]), t = r.int(3, 8), c = r.pick([1, 2, 3]);
      return {
        type: 'numeric',
        prompt: `A boat crosses a <b>${b * t} m</b> wide river, pointing straight across at <b>${b} m/s</b>. The current flows at <b>${c} m/s</b>. How far <b>downstream</b> does the boat land?`,
        answer: c * t, unit: 'm', hints: ['First: time to cross = width ÷ boat speed.', 'Then: drift = current × time.'],
        solution: `time = ${b * t} ÷ ${b} = ${t} s; drift = ${c} × ${t} = <b>${c * t} m</b>`,
      };
    },
  },

  // ---------- Lesson 5: slope = velocity ----------
  {
    id: 'u2.slope-read', concepts: [C.slope, C.vel], tier: 'scientist',
    generate(r) {
      const v = r.pick([-3, -2, -1, 1, 2, 3]), t = r.pick([2, 3, 4, 5]);
      const p0 = v < 0 ? -v * t + r.int(0, 4) : r.int(0, 4);
      const p1 = p0 + v * t;
      return {
        type: 'numeric', signed: true,
        prompt: `This position–time graph shows a minecart. What is its velocity?${SIGN_NOTE}${graphSVG({ points: [[0, p0], [t, p1]], tMax: t, yMax: 20, yStep: 1, labelEvery: 2, yLabel: 'position (m)' })}`,
        answer: v, unit: 'm/s', hints: ['velocity = change in position ÷ change in time', `(${p1} − ${p0}) ÷ ${t}`],
        solution: `(${p1} − ${p0}) ÷ ${t} = ${fmtSigned(p1 - p0)} ÷ ${t} = <b>${fmtSigned(v)} m/s</b>`,
      };
    },
  },
  {
    id: 'u2.slope-segment', concepts: [C.slope, C.vel], tier: 'engineer',
    generate(r) {
      const v = until(r, (rr) => {
        const t1 = rr.int(2, 3), x1 = rr.int(3, 6) * 2, t2 = t1 + rr.int(1, 2), t3 = t2 + rr.int(2, 4);
        const vv = rr.pick([-4, -3, -2, -1, 1, 2]);
        return { t1, x1, t2, t3, vv, x3: x1 + vv * (t3 - t2) };
      }, (x) => x.x3 >= 0 && x.x3 <= 20);
      return {
        type: 'numeric', signed: true,
        prompt: `What is Pip's velocity between <b>${v.t2} s</b> and <b>${v.t3} s</b>?${SIGN_NOTE}${graphSVG({ points: [[0, 0], [v.t1, v.x1], [v.t2, v.x1], [v.t3, v.x3]], tMax: v.t3, yMax: 20, yStep: 1, labelEvery: 2, yLabel: 'position (m)' })}`,
        answer: v.vv, unit: 'm/s', hints: ['Look only at the last piece of the line.', `(${v.x3} − ${v.x1}) ÷ (${v.t3} − ${v.t2})`],
        solution: `(${v.x3} − ${v.x1}) ÷ (${v.t3} − ${v.t2}) = <b>${fmtSigned(v.vv)} m/s</b>`,
      };
    },
  },
  {
    id: 'u2.slope-left-mcq', concepts: [C.slope], tier: 'explorer',
    generate() {
      const g = (pts) => graphSVG({ points: pts, tMax: 10, yMax: 10, small: true, w: 140, h: 100, tStep: 2, yStep: 2 });
      return {
        type: 'mcq', grid: true, prompt: 'Which position–time graph shows something moving <b>left</b> (negative velocity)?',
        choices: [g([[0, 2], [10, 8]]), g([[0, 5], [10, 5]]), g([[0, 9], [10, 1]]), g([[0, 0], [4, 10]])], answer: 2,
        explain: 'A line going downhill means the position is getting smaller — moving in the − direction.',
      };
    },
  },

  // ---------- Problem Set B: word problems ----------
  {
    id: 'u2.wp-cars', concepts: [C.rel], tier: 'scientist',
    generate(r) {
      const v1 = r.pick([10, 15, 20, 25]), v2 = r.pick([5, 10, 15]), t = r.pick([4, 5, 6, 8, 10]);
      const gap = (v1 + v2) * t;
      return {
        type: 'numeric',
        prompt: `Two cars are <b>${gap} m</b> apart and drive towards each other at <b>${v1} m/s</b> and <b>${v2} m/s</b>. After how many seconds do they meet?`,
        answer: t, unit: 's', hints: ['Closing speed = sum of speeds'], solution: `${gap} ÷ (${v1} + ${v2}) = <b>${t} s</b>`,
      };
    },
  },
  {
    id: 'u2.wp-escalator', concepts: [C.add], tier: 'engineer',
    generate(r) {
      const [t1, t2] = r.pick([[60, 30], [30, 20], [12, 6], [20, 30], [40, 60], [90, 45], [60, 40]]);
      const t = (t1 * t2) / (t1 + t2);
      const L = lcm(t1, t2);
      return {
        type: 'numeric',
        prompt: `Pip can walk up a <b>stopped</b> escalator in <b>${t1} s</b>. If he just stands on the <b>moving</b> escalator, it carries him up in <b>${t2} s</b>. How long does it take if he <b>walks up the moving escalator</b>?`,
        answer: t, unit: 's',
        hints: [`Each second, walking covers 1/${t1} of the escalator, and the escalator covers 1/${t2}.`, `Together: 1/${t1} + 1/${t2} of the escalator per second.`, 'Time = 1 ÷ (that fraction)'],
        solution: `Use a common denominator of ${L}: ${L / t1}/${L} + ${L / t2}/${L} = ${L / t1 + L / t2}/${L} = 1/${fmt(t)} of the escalator per second, so it takes <b>${fmt(t)} s</b>`,
      };
    },
  },
  {
    id: 'u2.wp-plane', concepts: [C.add], tier: 'scientist',
    generate(r) {
      const air = r.pick([200, 250, 300, 400]), wind = r.pick([20, 40, 50]), head = r.chance(0.5), t = r.pick([2, 3, 4]);
      const g = head ? air - wind : air + wind;
      return {
        type: 'numeric',
        prompt: `A plane flies at <b>${air} km/h</b> through the air. There is a <b>${head ? 'headwind' : 'tailwind'}</b> of <b>${wind} km/h</b>. How long does it take to fly <b>${g * t} km</b>?`,
        answer: t, unit: 'h',
        hints: [head ? 'A headwind blows against you: subtract.' : 'A tailwind pushes you along: add.', `Ground speed = ${air} ${head ? '−' : '+'} ${wind} = ${g} km/h`],
        solution: `Ground speed ${g} km/h; time = ${g * t} ÷ ${g} = <b>${t} h</b>`,
      };
    },
  },
  {
    id: 'u2.puzzle-fly', concepts: [C.rel], tier: 'engineer', puzzle: true, achievement: 'vonneumann',
    generate(r) {
      const t = r.pick([1, 2, 0.5, 1.5]), v = r.pick([20, 30, 40, 50]), f = r.pick([60, 75, 80, 90, 100]);
      const D = 2 * v * t;
      return {
        type: 'numeric',
        prompt: `Two trains are <b>${D} km</b> apart, heading towards each other at <b>${v} km/h each</b>. A bee starts on one train and flies at <b>${f} km/h</b> to the other train, turns around instantly, flies back, and keeps zig-zagging until the trains meet. <b>How far does the bee fly in total?</b>`,
        answer: f * t, unit: 'km',
        hints: ['Don\'t try to add up all the zig-zags! Ask a simpler question first...', 'How long until the trains meet?', 'The bee flies the whole time at the same speed.'],
        solution: `Trains meet after ${D} ÷ (${v} + ${v}) = ${fmt(t)} h. The bee flies ${f} × ${fmt(t)} = <b>${fmt(f * t)} km</b>. (A famous puzzle the mathematician John von Neumann solved instantly!)`,
      };
    },
  },
  {
    id: 'u2.puzzle-current', concepts: [C.add], tier: 'engineer', puzzle: true,
    generate(r) {
      const v = until(r, (rr) => {
        const b = rr.int(6, 12), c = rr.int(1, 4), td = rr.pick([1, 2, 3]);
        const d = (b + c) * td;
        return { b, c, td, d, tu: d / (b - c) };
      }, (x) => Number.isInteger(x.tu));
      return {
        type: 'numeric',
        prompt: `A boat goes <b>${v.d} km downstream in ${v.td} h</b>, then comes back <b>upstream in ${v.tu} h</b>. What is the speed of the <b>river current</b>?`,
        answer: v.c, unit: 'km/h',
        hints: [`Downstream speed = ${v.d} ÷ ${v.td} = boat + current`, `Upstream speed = ${v.d} ÷ ${v.tu} = boat − current`, 'Subtract the two equations, then halve.'],
        solution: `boat + current = ${v.b + v.c}; boat − current = ${v.b - v.c}. Subtract: 2 × current = ${2 * v.c}, so current = <b>${v.c} km/h</b> (and boat = ${v.b} km/h).`,
      };
    },
  },
]);
