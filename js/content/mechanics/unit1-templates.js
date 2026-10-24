// Unit 1 — Describing Motion: problem templates.
import { registerTemplates, until } from '../../engine/templates.js';
import { graphSVG } from '../../engine/graph-svg.js';
import { fmt, fmtSigned as fmtS } from '../../core/util.js';

const C = {
  units: 'mech.units',
  disp: 'mech.displacement',
  speed: 'mech.speed',
  avg: 'mech.average-speed',
  graph: 'mech.dt-graph',
};

const SPEED_UNITS = ['m', 's', 'm/s'];
const KMH_UNITS = ['km', 'h', 'km/h'];

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a * b) / gcd(a, b);
const nice = (x, dp = 1) => Math.abs(x * 10 ** dp - Math.round(x * 10 ** dp)) < 1e-9;

// Grid spacing chosen so that the end value `max` sits exactly on a gridline.
function yAxis(max) {
  const yStep = max <= 12 ? 1 : max % 5 === 0 ? 5 : 2;
  const labelEvery = yStep === 5 ? 5 : yStep === 1 && max % 2 ? 1 : yStep * 2; // odd small ends get their own label
  return { yStep, labelEvery, yMax: Math.ceil(max / labelEvery) * labelEvery };
}

registerTemplates([
  // ---------- Lesson 1: units ----------
  {
    id: 'u1.km-to-m', concepts: [C.units], tier: 'explorer',
    generate(r) {
      const km = r.pick([1.2, 2.5, 3, 4.75, 0.6, 7.2, 0.35, 12]);
      return {
        type: 'numeric', prompt: `Convert <b>${fmt(km)} km</b> into metres.`, answer: km * 1000, unit: 'm',
        hints: ['Is a metre bigger or smaller than a kilometre? So should the number get bigger or smaller?', '1 km = 1000 m'],
        errors: [{ value: km / 1000, msg: 'Metres are smaller than kilometres, so the number should get bigger, not smaller.' }, { value: km * 100, msg: 'Careful: 1 km is 1000 m, not 100 m.' }],
        solution: `${fmt(km)} km × 1000 = <b>${fmt(km * 1000)} m</b>`,
      };
    },
  },
  {
    id: 'u1.cm-to-m', concepts: [C.units], tier: 'explorer',
    generate(r) {
      const cm = r.pick([150, 250, 75, 320, 5, 1000, 45, 180]);
      return {
        type: 'numeric', prompt: `A block is 100 cm tall. How many <b>metres</b> is <b>${cm} cm</b>?`, answer: cm / 100, unit: 'm',
        hints: ['Is a metre bigger or smaller than a centimetre? So should the number get bigger or smaller?', '1 m = 100 cm'],
        errors: [{ value: cm * 100, msg: 'Metres are bigger than centimetres, so the number should get smaller.' }, { value: cm / 1000, msg: 'Careful: 1 m is 100 cm, not 1000.' }],
        solution: `${cm} cm ÷ 100 = <b>${fmt(cm / 100)} m</b>`,
      };
    },
  },
  {
    id: 'u1.mm-to-cm', concepts: [C.units], tier: 'explorer',
    generate(r) {
      const mm = r.pick([30, 85, 12, 7, 25, 64]);
      return {
        type: 'numeric', prompt: `An emerald is <b>${mm} mm</b> wide. How many <b>centimetres</b> is that?`, answer: mm / 10, unit: 'cm',
        hints: ['How many millimetres fit into one centimetre?', '1 cm = 10 mm, so the number gets smaller.'],
        errors: [{ value: mm * 10, msg: 'Centimetres are bigger than millimetres, so the number should get smaller.' }],
        solution: `${mm} mm ÷ 10 = <b>${fmt(mm / 10)} cm</b>`,
      };
    },
  },
  {
    id: 'u1.min-to-s', concepts: [C.units], tier: 'explorer',
    generate(r) {
      // Real timings from the blocky game: a full day–night cycle is 20 min (10 min day, 1.5 min sunset, 7 min night, 1.5 min sunrise).
      const [what, m] = r.pick([['a full day–night cycle', 20], ['the daytime', 10], ['the night', 7], ['a sunset', 1.5]]);
      return {
        type: 'numeric', prompt: `In the blocky game, <b>${what}</b> lasts <b>${fmt(m)} minutes</b>. How many <b>seconds</b> is that?`,
        answer: m * 60, unit: 's', hints: ['How many seconds are in one minute?'], errors: [{ value: m * 100, msg: 'A minute has 60 seconds, not 100.' }], solution: `${fmt(m)} × 60 = <b>${fmt(m * 60)} s</b>`,
      };
    },
  },
  {
    id: 'u1.s-to-ms', concepts: [C.units], tier: 'explorer',
    generate(r) {
      const s = r.pick([0.2, 0.15, 0.25, 0.3, 1.5, 0.05]);
      return {
        type: 'numeric', prompt: `A sprinter reacts to the starting gun in <b>${fmt(s)} s</b>. How many <b>milliseconds</b> is that?`,
        answer: s * 1000, unit: 'ms', hints: ['A millisecond is a thousandth of a second. Will the number get bigger or smaller?', '1 s = 1000 ms'],
        errors: [{ value: s / 1000, msg: 'Milliseconds are tiny, so there are lots of them — the number should get bigger.' }, { value: s * 100, msg: 'Careful: 1 s is 1000 ms, not 100.' }],
        solution: `${fmt(s)} × 1000 = <b>${fmt(s * 1000)} ms</b>`,
      };
    },
  },
  {
    id: 'u1.h-to-min', concepts: [C.units], tier: 'scientist',
    generate(r) {
      const hr = r.pick([1.5, 2, 0.5, 2.5, 0.25, 0.75]);
      return {
        type: 'numeric', prompt: `A train ride takes <b>${fmt(hr)} hours</b>. How many <b>minutes</b> is that?`, answer: hr * 60, unit: 'min',
        hints: ['How many minutes are in one hour?', 'Multiply the hours by 60.'], errors: [{ value: hr * 100, msg: 'An hour has 60 minutes, not 100 — time doesn\'t work in tens!' }],
        solution: `${fmt(hr)} × 60 = <b>${fmt(hr * 60)} min</b>`,
      };
    },
  },
  {
    id: 'u1.unit-choice', concepts: [C.units], tier: 'explorer',
    generate(r) {
      const s = r.pick([
        { q: 'the distance between two villages', a: 3 },
        { q: 'the length of a pencil', a: 1 },
        { q: 'the thickness of a coin', a: 0 },
        { q: 'the length of a football pitch', a: 2 },
      ]);
      return {
        type: 'mcq', keepOrder: true, prompt: `Which unit is best for measuring <b>${s.q}</b>?`,
        choices: ['mm', 'cm', 'm', 'km'], answer: s.a,
        explain: 'Pick a unit that gives a sensible-sized number — not a tiny decimal or a giant number.',
      };
    },
  },

  // ---------- Lesson 2: distance vs displacement ----------
  {
    id: 'u1.dist-backforth', concepts: [C.disp], tier: 'explorer',
    generate(r) {
      const a = r.int(3, 9);
      const b = until(r, (rr) => rr.int(1, 9), (x) => x !== a);
      return {
        type: 'numeric', prompt: `Pip walks <b>${a} m right</b>, then <b>${b} m left</b>. What <b>distance</b> did he walk in total?`,
        answer: a + b, unit: 'm', hints: ['Does distance care which way you walk?'],
        errors: [{ value: Math.abs(a - b), msg: 'That\'s how far from the start he ended up (his displacement). Distance counts every step.' }],
        solution: `Distance = ${a} + ${b} = <b>${a + b} m</b>`,
      };
    },
  },
  {
    id: 'u1.disp-backforth', concepts: [C.disp], tier: 'scientist',
    generate(r) {
      const a = r.int(3, 9);
      const b = until(r, (rr) => rr.int(1, 12), (x) => x !== a);
      return {
        type: 'numeric', signed: true,
        prompt: `Pip walks <b>${a} m right</b>, then <b>${b} m left</b>. What is his <b>displacement</b> from the start? <br><small>Use + for right and − for left (use the ± button if needed).</small>`,
        answer: a - b, unit: 'm', hints: ['Where does Pip end up compared with where he started?', 'Start at 0. Right is +, left is −.'],
        errors: [{ value: a + b, msg: 'That\'s the distance he walked. Displacement only cares where he ended up.' }, { value: b - a, msg: 'Right size, wrong direction — which side of the start did he finish on?' }],
        solution: `Displacement = +${a} − ${b} = <b>${a - b > 0 ? '+' : ''}${fmt(a - b)} m</b> (${a - b > 0 ? 'right of' : 'left of'} the start)`,
      };
    },
  },
  {
    id: 'u1.lap', concepts: [C.disp], tier: 'explorer',
    generate(r) {
      const L = r.pick([200, 400, 300]);
      return {
        type: 'mcq', prompt: `A runner runs exactly <b>one lap</b> of a ${L} m track and stops where she started. What is her <b>displacement</b>?`,
        choices: ['0 m', `${L} m`, `${L / 2} m`, `${L * 2} m`], answer: 0,
        explain: `She ran a distance of ${L} m, but she ended up exactly where she started, so displacement = 0 m.`,
      };
    },
  },
  {
    id: 'u1.disp-bigger', concepts: [C.disp], tier: 'scientist',
    generate() {
      return {
        type: 'mcq', prompt: 'Can the size of a displacement ever be <b>bigger</b> than the distance travelled?',
        choices: ['No — never', 'Yes, always', 'Only when moving left', 'Only when running fast'], answer: 0,
        explain: 'A straight line is the shortest path between two points, so displacement can be equal to the distance or smaller — never bigger.',
      };
    },
  },

  // ---------- Lesson 3: speed ----------
  {
    id: 'u1.speed-basic', concepts: [C.speed], tier: 'explorer',
    generate(r) {
      const who = r.pick([['a horse', [6, 12]], ['Pip', [2, 6]], ['a minecart', [4, 10]], ['a chicken', [1, 3]]]);
      const s = r.int(...who[1]);
      const t = r.int(2, 10);
      return {
        type: 'numeric', prompt: `${who[0][0].toUpperCase() + who[0].slice(1)} travels <b>${s * t} m</b> in <b>${t} s</b>. What is the speed?`,
        answer: s, unit: 'm/s', unitChoices: SPEED_UNITS,
        hints: ['How many metres does it cover in ONE second?', 'speed = distance ÷ time'], errors: [{ value: s * t * t, msg: 'You multiplied. Speed is distance ÷ time.' }],
        solution: `speed = ${s * t} ÷ ${t} = <b>${s} m/s</b>`,
      };
    },
  },
  {
    id: 'u1.speed-distance', concepts: [C.speed], tier: 'scientist',
    generate(r) {
      const s = r.pick([1.5, 2, 3, 4, 5, 8, 2.5]);
      const t = r.int(2, 12);
      return {
        type: 'numeric', prompt: `A minecart rolls at <b>${fmt(s)} m/s</b> for <b>${t} s</b>. How far does it go?`,
        answer: s * t, unit: 'm', unitChoices: SPEED_UNITS,
        hints: ['It goes this far every second. How far in all those seconds?', 'distance = speed × time'], errors: [{ value: s / t, msg: 'Dividing gives a tiny distance. Distance = speed × time.' }],
        solution: `distance = ${fmt(s)} × ${t} = <b>${fmt(s * t)} m</b>`,
      };
    },
  },
  {
    id: 'u1.speed-time', concepts: [C.speed], tier: 'scientist',
    generate(r) {
      const s = r.pick([8, 10, 12, 15, 16]);
      const t = r.int(2, 12);
      return {
        type: 'numeric', prompt: `A horse gallops <b>${fmt(s * t)} m</b> at <b>${fmt(s)} m/s</b>. How long does it take?`,
        answer: t, unit: 's', unitChoices: SPEED_UNITS,
        hints: ['It covers this many metres every second. How many seconds to cover the whole distance?', 'time = distance ÷ speed'], errors: [{ value: s * t * s, msg: 'You multiplied. Time = distance ÷ speed.' }],
        solution: `time = ${fmt(s * t)} ÷ ${fmt(s)} = <b>${t} s</b>`,
      };
    },
  },
  {
    id: 'u1.speed-kmh', concepts: [C.speed], tier: 'explorer',
    generate(r) {
      const s = r.pick([40, 60, 80, 90, 120]);
      const t = r.pick([0.5, 1.5, 2, 2.5, 3]);
      return {
        type: 'numeric', prompt: `A train travels <b>${fmt(s * t)} km</b> in <b>${fmt(t)} hours</b>. What is its average speed?`,
        answer: s, unit: 'km/h', unitChoices: KMH_UNITS,
        hints: ['How many kilometres does the train cover in ONE hour?', 'speed = distance ÷ time'], errors: [{ value: s * t * t, msg: 'You multiplied. Speed = distance ÷ time.' }],
        solution: `${fmt(s * t)} ÷ ${fmt(t)} = <b>${s} km/h</b>`,
      };
    },
  },
  {
    id: 'u1.speed-unit-mcq', concepts: [C.speed, C.units], tier: 'explorer',
    generate() {
      return {
        type: 'mcq', prompt: 'Which of these is <b>NOT</b> a unit of speed?',
        choices: ['km', 'm/s', 'km/h', 'cm/s'], answer: 0,
        explain: 'Speed units are always "a distance per a time". km is only a distance.',
      };
    },
  },
  {
    id: 'u1.eq-time', concepts: [C.speed], tier: 'scientist',
    generate() {
      return {
        type: 'equation', prompt: 'We know <b>speed = distance ÷ time</b>. Rearrange it to find <b>time</b>.',
        lhs: 'time', tiles: ['distance', 'speed', '÷', '×', 'time'], answers: [['distance', '÷', 'speed']],
        explain: 'Multiply both sides by time, then divide both sides by speed: time = distance ÷ speed.',
      };
    },
  },
  {
    id: 'u1.eq-distance', concepts: [C.speed], tier: 'explorer',
    generate() {
      return {
        type: 'equation', prompt: 'We know <b>speed = distance ÷ time</b>. Rearrange it to find <b>distance</b>.',
        lhs: 'distance', tiles: ['speed', 'time', '×', '÷', 'distance'], answers: [['speed', '×', 'time'], ['time', '×', 'speed']],
        explain: 'Multiply both sides by time: distance = speed × time.',
      };
    },
  },

  // ---------- Lesson 4: average speed & conversions ----------
  {
    id: 'u1.avg-times', concepts: [C.avg], tier: 'scientist',
    generate(r) {
      const v = until(r, (rr) => {
        const s1 = rr.int(4, 15), s2 = rr.int(4, 15), t1 = rr.int(1, 3), t2 = rr.int(1, 3);
        return { s1, s2, t1, t2, d1: s1 * t1, d2: s2 * t2 };
      }, (x) => x.s1 !== x.s2 && x.t1 !== x.t2 && nice((x.d1 + x.d2) / (x.t1 + x.t2)));
      const D = v.d1 + v.d2, T = v.t1 + v.t2;
      return {
        type: 'numeric', prompt: `A cyclist rides <b>${v.d1} km in ${v.t1} h</b>, then <b>${v.d2} km in ${v.t2} h</b>. What is the average speed for the whole trip?`,
        answer: D / T, unit: 'km/h', unitChoices: KMH_UNITS,
        hints: ['What is the total distance? And the total time?', 'average speed = total distance ÷ total time'],
        errors: [{ value: (v.s1 + v.s2) / 2, msg: 'That\'s the average of the two speeds — but the legs took different times. Use total distance ÷ total time.' }],
        solution: `(${v.d1} + ${v.d2}) ÷ (${v.t1} + ${v.t2}) = ${D} ÷ ${T} = <b>${fmt(D / T)} km/h</b>`,
      };
    },
  },
  {
    id: 'u1.avg-speeds', concepts: [C.avg], tier: 'engineer',
    generate(r) {
      const v = until(r, (rr) => {
        const s1 = rr.int(2, 12), s2 = rr.int(2, 12), t1 = rr.pick([0.5, 1, 1.5, 2]), t2 = rr.pick([0.5, 1, 1.5, 2]);
        return { s1, s2, t1, t2, d1: s1 * t1, d2: s2 * t2 };
      }, (x) => x.s1 !== x.s2 && x.t1 !== x.t2 && Number.isInteger(x.d1) && Number.isInteger(x.d2) && nice((x.d1 + x.d2) / (x.t1 + x.t2)));
      const D = v.d1 + v.d2, T = v.t1 + v.t2;
      return {
        type: 'numeric',
        prompt: `Pip travels <b>${v.d1} km at ${v.s1} km/h</b>, then <b>${v.d2} km at ${v.s2} km/h</b>. What is his average speed for the whole trip?`,
        answer: D / T, unit: 'km/h', unitChoices: KMH_UNITS,
        hints: ['Which part of the trip took longer?', 'Find the time for each part: time = distance ÷ speed.', 'Then average speed = total distance ÷ total time.'],
        errors: [{ value: (v.s1 + v.s2) / 2, msg: 'That\'s the average of the two speeds — the trap! Which part took longer?' }],
        solution: `Times: ${fmt(v.t1)} h + ${fmt(v.t2)} h = ${fmt(T)} h. Average = ${D} ÷ ${fmt(T)} = <b>${fmt(D / T)} km/h</b> (not ${fmt((v.s1 + v.s2) / 2)}!)`,
      };
    },
  },
  {
    id: 'u1.kmh-to-ms', concepts: [C.units, C.speed], tier: 'scientist',
    generate(r) {
      const k = r.pick([18, 36, 54, 72, 90, 108, 144]);
      return {
        type: 'numeric', prompt: `Convert <b>${k} km/h</b> into m/s.`, answer: k / 3.6, unit: 'm/s',
        hints: ['For the same speed, is the number in m/s bigger or smaller than in km/h?', '1 km/h = 1000 m ÷ 3600 s, so divide by 3.6.'],
        errors: [{ value: k * 3.6, msg: 'For the same speed, the m/s number is smaller than the km/h number — divide by 3.6.' }],
        solution: `${k} ÷ 3.6 = <b>${fmt(k / 3.6)} m/s</b>`,
      };
    },
  },
  {
    id: 'u1.ms-to-kmh', concepts: [C.units, C.speed], tier: 'scientist',
    generate(r) {
      const m = r.pick([5, 10, 15, 20, 25, 30, 2.5]);
      return {
        type: 'numeric', prompt: `Convert <b>${fmt(m)} m/s</b> into km/h.`, answer: m * 3.6, unit: 'km/h',
        hints: ['For the same speed, is the number in km/h bigger or smaller than in m/s?', 'Multiply by 3.6.'],
        errors: [{ value: m / 3.6, msg: 'The km/h number should be bigger — multiply by 3.6.' }],
        solution: `${fmt(m)} × 3.6 = <b>${fmt(m * 3.6)} km/h</b>`,
      };
    },
  },
  {
    id: 'u1.avg-trap-mcq', concepts: [C.avg], tier: 'scientist',
    generate() {
      return {
        type: 'mcq', prompt: 'When is your average speed exactly halfway between your two speeds?',
        choices: ['When you spend the same amount of <b>time</b> at each speed', 'When you go the same <b>distance</b> at each speed', 'Always', 'Never'],
        answer: 0,
        explain: 'If you spend more time going slowly, the slow speed "counts more". Only equal times make the average sit exactly in the middle.',
      };
    },
  },

  // ---------- Lesson 5: distance–time graphs ----------
  {
    id: 'u1.graph-speed', concepts: [C.graph, C.speed], tier: 'scientist',
    generate(r) {
      const v = until(r, (rr) => {
        const t = rr.pick([4, 5, 8, 10]), s = rr.pick([1, 2, 3]), d0 = rr.pick([0, 0, 2, 4, 5, 6, 10]);
        return { t, s, d0, d: d0 + s * t };
      }, (x) => x.d <= 30 && x.d0 % yAxis(x.d).yStep === 0 && x.d % yAxis(x.d).labelEvery === 0); // the end value gets a label
      const { t, s, d0, d } = v;
      const ax = yAxis(d);
      return {
        type: 'numeric',
        prompt: `This graph shows Pip walking${d0 ? ` (he starts ${d0} m from the gate)` : ''}. What is his speed?${graphSVG({ points: [[0, d0], [t, d]], tMax: t, ...ax })}`,
        answer: s, unit: 'm/s', unitChoices: SPEED_UNITS,
        hints: ['How much did the distance change, and how long did that take?', 'speed = change in distance ÷ change in time'],
        errors: [{ value: d / t, msg: 'You used the end value. He didn\'t start at 0 m — use how much the distance changed.' }],
        solution: `speed = (${d} − ${d0}) ÷ ${t} = <b>${s} m/s</b>`,
      };
    },
  },
  {
    id: 'u1.graph-stop', concepts: [C.graph], tier: 'scientist',
    generate(r) {
      const t1 = r.int(2, 4), stopFor = r.int(2, 4), t3 = t1 + stopFor + r.int(2, 3);
      const d1 = r.int(2, 4) * t1;
      const d3 = d1 + r.int(1, 3) * (t3 - t1 - stopFor);
      const ax = { yStep: 1, labelEvery: 5, yMax: Math.ceil(d3 / 5) * 5 };
      return {
        type: 'numeric',
        prompt: `How many seconds did Pip stand still for?${graphSVG({ points: [[0, 0], [t1, d1], [t1 + stopFor, d1], [t3, d3]], tMax: t3, ...ax })}`,
        answer: stopFor, unit: 's', hints: ['What does a flat line on a distance–time graph mean?'],
        errors: [{ value: t1 + stopFor, msg: 'That\'s the time when he started moving again. How long was the line flat?' }, { value: t1, msg: 'That\'s when he stopped. How long did he stay stopped?' }],
        solution: `The line is flat from ${t1} s to ${t1 + stopFor} s: <b>${stopFor} s</b>`,
      };
    },
  },
  {
    id: 'u1.graph-still-mcq', concepts: [C.graph], tier: 'explorer',
    generate() {
      const g = (pts) => graphSVG({ points: pts, tMax: 10, yMax: 10, small: true, w: 140, h: 100, tStep: 2, yStep: 2 });
      return {
        type: 'mcq', grid: true, prompt: 'Which distance–time graph shows someone <b>standing still</b>?',
        choices: [g([[0, 2], [10, 8]]), g([[0, 5], [10, 5]]), g([[0, 0], [4, 10]]), g([[0, 0], [5, 2], [10, 10]])], answer: 1,
        explain: 'A flat line means the distance is not changing — so they are not moving.',
      };
    },
  },
  {
    id: 'u1.graph-faster-mcq', concepts: [C.graph, C.speed], tier: 'explorer',
    generate(r) {
      const steepFirst = r.chance(0.5);
      const g = (pts, label) => `<div class="graph-pair"><b>${label}</b>${graphSVG({ points: pts, tMax: 10, yMax: 20, small: true, w: 140, h: 100, tStep: 2, yStep: 4 })}</div>`;
      const steep = [[0, 0], [10, 18]], gentle = [[0, 0], [10, 6]];
      return {
        type: 'mcq', prompt: `Two runners, A and B. Who is <b>faster</b>?<div class="graph-row">${g(steepFirst ? steep : gentle, 'A')}${g(steepFirst ? gentle : steep, 'B')}</div>`,
        choices: ['A', 'B', 'They have the same speed'], answer: steepFirst ? 0 : 1, keepOrder: true,
        explain: 'The steeper line covers more distance in the same time — that runner is faster.',
      };
    },
  },

  // ---------- Problem Set B: word problems ----------
  {
    id: 'u1.wp-school', concepts: [C.speed, C.units], tier: 'scientist',
    generate(r) {
      const t = r.int(5, 20), s = r.pick([1, 1.5, 2]);
      const d = s * t * 60;
      return {
        type: 'numeric', prompt: `Pip's house is <b>${fmt(d)} m</b> from the village library. He walks at <b>${fmt(s)} m/s</b>. How many <b>minutes</b> does the walk take?`,
        answer: t, unit: 'min', hints: ['Which formula gives the time? What unit will your answer be in first?', 'time = distance ÷ speed gives seconds — then turn seconds into minutes.'],
        errors: [{ value: d / s, msg: 'That\'s the time in seconds. The question asks for minutes.' }],
        solution: `${fmt(d)} ÷ ${fmt(s)} = ${fmt(d / s)} s = <b>${t} min</b>`,
      };
    },
  },
  {
    id: 'u1.wp-thunder', concepts: [C.speed], tier: 'scientist',
    generate(r) {
      const t = r.pick([2, 3, 4, 5, 6]);
      return {
        type: 'numeric',
        prompt: `Light from lightning reaches you almost instantly, but sound travels at about <b>340 m/s</b>. You hear the thunder <b>${t} s</b> after the flash. How far away was the lightning?`,
        answer: 340 * t, unit: 'm', hints: ['The sound travels for that many seconds. How far does it go each second?', 'distance = speed × time'],
        errors: [{ value: 340 / t, msg: 'Distance = speed × time — multiply.' }],
        solution: `340 × ${t} = <b>${fmt(340 * t)} m</b> — about ${fmt((340 * t) / 1000, 1)} km away.`,
      };
    },
  },
  {
    id: 'u1.wp-avg-trap', concepts: [C.avg], tier: 'engineer',
    generate(r) {
      const [s1, s2] = r.pick([[4, 12], [10, 15], [6, 12], [20, 30], [12, 20], [15, 10]]);
      const d = lcm(s1, s2) * r.int(1, 2);
      const T = d / s1 + d / s2;
      return {
        type: 'numeric',
        prompt: `Pip cycles <b>${d} km</b> to his friend's village at <b>${s1} km/h</b>, then comes back the same way at <b>${s2} km/h</b>. What is his average speed for the whole round trip?`,
        answer: (2 * d) / T, unit: 'km/h', unitChoices: KMH_UNITS,
        hints: ['Which way took longer: there or back?', 'Find the time there and the time back.', 'average speed = total distance ÷ total time'],
        errors: [{ value: (s1 + s2) / 2, msg: 'That\'s the average of the two speeds — the trap! The slower trip takes longer, so it counts more.' }],
        solution: `Times: ${fmt(d / s1)} h + ${fmt(d / s2)} h = ${fmt(T)} h. Average = ${2 * d} ÷ ${fmt(T)} = <b>${fmt((2 * d) / T)} km/h</b>`,
      };
    },
  },
  {
    id: 'u1.wp-cheetah', concepts: [C.speed, C.units], tier: 'scientist',
    generate(r) {
      const s = r.pick([25, 30, 20]);
      return {
        type: 'numeric',
        prompt: `A cheetah can sprint at <b>${s} m/s</b>. A car on the motorway drives at 100 km/h. Convert the cheetah's speed to km/h so you can compare.`,
        answer: s * 3.6, unit: 'km/h', hints: ['For the same speed, is the km/h number bigger or smaller than the m/s number?', 'Multiply by 3.6.'],
        errors: [{ value: s / 3.6, msg: 'The km/h number should be bigger — multiply by 3.6.' }],
        solution: `${s} × 3.6 = <b>${fmt(s * 3.6)} km/h</b> — ${s * 3.6 > 100 ? 'faster than' : 'slower than'} the car!`,
      };
    },
  },
  {
    id: 'u1.wp-bus', concepts: [C.speed, C.units], tier: 'scientist',
    generate(r) {
      const v = until(r, (rr) => ({ s: rr.pick([30, 40, 48, 60]), t: rr.pick([30, 45, 75, 90, 40]) }), (x) => Number.isInteger((x.s * x.t) / 60));
      const d = (v.s * v.t) / 60;
      return {
        type: 'numeric', prompt: `A bus travels <b>${d} km</b> at an average speed of <b>${v.s} km/h</b>. How many <b>minutes</b> does the trip take?`,
        answer: v.t, unit: 'min', hints: ['How long does the trip take in hours? How many minutes is that?', 'time = distance ÷ speed gives hours.'],
        errors: [{ value: d / v.s, msg: 'That\'s the time in hours. The question asks for minutes.' }],
        solution: `time = ${d} ÷ ${v.s} × 60 = <b>${v.t} min</b>`,
      };
    },
  },
  {
    id: 'u1.puzzle-snail', concepts: [C.disp], tier: 'engineer', puzzle: true,
    generate(r) {
      const [H, up, down] = r.pick([[10, 3, 2], [12, 3, 2], [20, 5, 3], [15, 4, 1]]);
      const day = Math.ceil((H - up) / (up - down)) + 1;
      return {
        type: 'numeric',
        prompt: `A snail wants to climb a <b>${H} m</b> wall. Every day it climbs <b>${up} m</b> up, but every night it slides <b>${down} m</b> back down. On which day does it first reach the top?`,
        answer: day, unit: 'days', hints: [`Each full day + night it gains ${up - down} m.`, `Careful: on the last day it reaches the top before sliding back!`],
        errors: [{ value: Math.ceil(H / (up - down)), msg: 'Careful — on the last day it reaches the top before it can slide back.' }],
        solution: `After ${day - 1} days and nights it is at ${(day - 1) * (up - down)} m. On day ${day} it climbs ${up} m to ${(day - 1) * (up - down) + up} m ≥ ${H} m. Answer: <b>day ${day}</b>.`,
      };
    },
  },
  {
    id: 'u1.puzzle-impossible', concepts: [C.avg], tier: 'engineer', puzzle: true,
    generate() {
      return {
        type: 'mcq',
        prompt: 'A minecart travels the <b>first half</b> of a track at <b>30 km/h</b>. How fast must it go on the second half so that its <b>average</b> speed for the whole track is <b>60 km/h</b>?',
        choices: ['90 km/h', '120 km/h', '60 km/h', 'It is impossible!'], answer: 3, keepOrder: true,
        explain: 'Say the track is 60 km. To average 60 km/h it must finish in 1 hour. But the first 30 km at 30 km/h already takes 1 hour — no time is left! The second half would need infinite speed.',
      };
    },
  },

  // ---------- Deeper understanding & stretch (added after the learning review) ----------
  {
    id: 'u1.chain-convert', concepts: [C.units], tier: 'scientist',
    generate(r) {
      const km = r.pick([0.5, 1.2, 2.4, 3, 0.75, 0.04]);
      return {
        type: 'numeric', prompt: `A minecart track is <b>${fmt(km)} km</b> long. How many <b>centimetres</b> is that?`,
        answer: km * 100000, unit: 'cm',
        hints: ['Go one step at a time: km → m, then m → cm.', '1 km = 1000 m and 1 m = 100 cm.'],
        errors: [{ value: km * 1000, msg: 'That\'s in metres — now turn the metres into centimetres.' }, { value: km * 100, msg: 'You only did one step. km → m first, then m → cm.' }],
        solution: `${fmt(km)} km = ${fmt(km * 1000)} m = ${fmt(km * 1000)} × 100 = <b>${fmt(km * 100000)} cm</b>`,
      };
    },
  },
  {
    id: 'u1.estimate-mcq', concepts: [C.units, C.speed], tier: 'explorer',
    generate(r) {
      const q = r.pick([
        { p: 'About how fast does a person <b>walk</b>?', c: ['about 1.5 m/s', 'about 15 m/s', 'about 150 m/s', 'about 0.01 m/s'], e: '1.5 m/s is about 5 km/h — a normal walking pace. 15 m/s would be faster than an Olympic sprinter!' },
        { p: 'About how long does it take to <b>walk 1 km</b>?', c: ['about 12 minutes', 'about 12 seconds', 'about 12 hours', 'about 1 minute'], e: 'At about 1.4 m/s, 1000 m takes about 700 s — roughly 12 minutes.' },
        { p: 'About how fast does a car drive <b>through a town</b>?', c: ['about 50 km/h', 'about 5 km/h', 'about 500 km/h', 'about 5000 km/h'], e: '50 km/h is a common town speed limit. 5 km/h is walking pace; 500 km/h is faster than a Formula 1 car.' },
        { p: 'About how tall is a <b>two-storey house</b>?', c: ['about 8 m', 'about 8 cm', 'about 80 m', 'about 8 km'], e: 'Each storey is about 3–4 m, so two storeys is about 8 m — 8 blocks!' },
      ]);
      return { type: 'mcq', prompt: q.p, choices: q.c, answer: 0, explain: q.e };
    },
  },
  {
    id: 'u1.disp-three', concepts: [C.disp], tier: 'scientist',
    generate(r) {
      const v = until(r, (rr) => ({ a: rr.int(3, 9), b: rr.int(4, 14), c: rr.int(1, 6) }), (x) => x.b > x.a && x.a - x.b + x.c !== 0);
      const disp = v.a - v.b + v.c;
      return {
        type: 'numeric', signed: true,
        prompt: `Pip walks <b>${v.a} m right</b>, then <b>${v.b} m left</b>, then <b>${v.c} m right</b>. What is his <b>displacement</b>?<br><small>Use + for right and − for left.</small>`,
        answer: disp, unit: 'm',
        hints: ['Imagine a number line. Where is Pip after each walk?', 'Start at 0. Right is +, left is −.'],
        errors: [{ value: v.a + v.b + v.c, msg: 'That\'s the distance he walked. Displacement only cares where he ended up.' }, { value: -disp, msg: 'Right size, wrong direction — which side of the start did he finish on?' }],
        solution: `0 → +${v.a} → ${fmtS(v.a - v.b)} → <b>${fmtS(disp)} m</b>. (He walked a distance of ${v.a + v.b + v.c} m.)`,
      };
    },
  },
  {
    id: 'u1.graph-height-mcq', concepts: [C.graph, C.speed], tier: 'scientist',
    generate(r) {
      // The higher line is the SLOWER one: speed is about steepness, not height.
      const highFirst = r.chance(0.5);
      const high = [[0, 14], [10, 18]], steep = [[0, 0], [10, 12]];
      const g = (pts, label) => `<div class="graph-pair"><b>${label}</b>${graphSVG({ points: pts, tMax: 10, yMax: 20, small: true, w: 140, h: 100, tStep: 2, yStep: 4 })}</div>`;
      return {
        type: 'mcq', keepOrder: true,
        prompt: `Two runners — both graphs use the same scales. Who is running <b>faster</b>?<div class="graph-row">${g(highFirst ? high : steep, 'A')}${g(highFirst ? steep : high, 'B')}</div>`,
        choices: ['A', 'B', 'They have the same speed'], answer: highFirst ? 1 : 0,
        explain: 'Speed is how <b>steep</b> the line is, not how high it is. The higher runner started further away but only gained 4 m in 10 s; the other gained 12 m.',
      };
    },
  },
  {
    id: 'u1.graph-story-mcq', concepts: [C.graph], tier: 'explorer',
    generate(r) {
      const g = (pts) => graphSVG({ points: pts, tMax: 10, yMax: 10, small: true, w: 160, h: 110, tStep: 2, yStep: 2 });
      const upThenFlat = r.chance(0.5);
      return {
        type: 'mcq',
        prompt: `This distance–time graph tells the story of Pip's walk. What is he doing?<div class="graph-row">${g(upThenFlat ? [[0, 0], [5, 8], [10, 8]] : [[0, 2], [5, 2], [10, 9]])}</div>`,
        choices: upThenFlat
          ? ['Walking, then standing still', 'Climbing a hill, then walking on flat ground', 'Speeding up, then going at a steady speed', 'Standing still, then walking']
          : ['Standing still, then walking', 'Walking on flat ground, then climbing a hill', 'Walking, then standing still', 'Going downhill, then uphill'],
        answer: 0,
        explain: 'A distance–time graph is not a picture of the path! Going up means moving away; a flat line means standing still.',
      };
    },
  },
  {
    id: 'u1.spot-bug-avg', concepts: [C.avg], tier: 'scientist',
    generate(r) {
      const [s1, s2] = r.pick([[4, 12], [10, 15], [6, 12], [12, 20]]);
      const d = lcm(s1, s2);
      return {
        type: 'mcq',
        prompt: `Sam says: <i>"Pip cycles ${d} km at ${s1} km/h and then ${d} km at ${s2} km/h, so his average speed is (${s1} + ${s2}) ÷ 2 = ${fmt((s1 + s2) / 2)} km/h."</i> What did Sam do wrong?`,
        choices: [
          `He averaged the speeds, but Pip spent longer on the slower part`,
          `He should have added the speeds: ${s1 + s2} km/h`,
          `He should have multiplied: ${s1 * s2} km/h`,
          'Nothing — Sam is right',
        ],
        answer: 0,
        explain: `The times are ${fmt(d / s1)} h and ${fmt(d / s2)} h, so the average is ${2 * d} ÷ ${fmt(d / s1 + d / s2)} = ${fmt((2 * d) / (d / s1 + d / s2))} km/h. The slower part lasts longer, so it pulls the average down.`,
      };
    },
  },
  {
    id: 'u1.avg-inverse', concepts: [C.avg], tier: 'engineer',
    generate(r) {
      // s1 is the slow first part; the second part must be s2 to average A over equal distances.
      // Cycling speeds (km/h); the average over equal distances is the harmonic mean, a whole number for these pairs.
      const [s1, s2] = r.pick([[4, 12], [10, 15], [6, 12], [12, 20], [10, 30]]);
      const A = (2 * s1 * s2) / (s1 + s2);
      const d = until(r, (rr) => lcm(s1, s2) * rr.int(1, 3), (x) => x !== s2);
      return {
        type: 'numeric',
        prompt: `Pip cycles <b>${d} km at ${s1} km/h</b>. How fast must he go for the <b>next ${d} km</b> so that his average speed for the whole ${2 * d} km is <b>${fmt(A)} km/h</b>?`,
        answer: s2, unit: 'km/h',
        hints: ['How long should the whole ride take at the average speed?', 'How much of that time has the first part already used?', 'Speed for the second part = distance ÷ time left.'],
        errors: [{ value: 2 * A - s1, msg: 'That would only work if both parts took the same TIME — but they are the same DISTANCE. Work with the times.' }],
        solution: `Whole ride: ${2 * d} ÷ ${fmt(A)} = ${fmt((2 * d) / A)} h. First part: ${d} ÷ ${s1} = ${fmt(d / s1)} h. Time left: ${fmt((2 * d) / A - d / s1)} h, so speed = ${d} ÷ ${fmt((2 * d) / A - d / s1)} = <b>${s2} km/h</b>`,
      };
    },
  },
]);
