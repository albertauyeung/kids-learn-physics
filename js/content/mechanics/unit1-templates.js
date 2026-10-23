// Unit 1 — Describing Motion: problem templates.
import { registerTemplates, until } from '../../engine/templates.js';
import { graphSVG } from '../../engine/graph-svg.js';
import { fmt } from '../../core/util.js';

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

function yAxis(max) {
  const yStep = max <= 12 ? 2 : max <= 30 ? 5 : 10;
  const labelEvery = yStep * 2;
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
        hints: ['1 km = 1000 m', `Multiply by 1000: ${fmt(km)} × 1000`],
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
        hints: ['1 m = 100 cm', `Divide by 100: ${cm} ÷ 100`],
        solution: `${cm} cm ÷ 100 = <b>${fmt(cm / 100)} m</b>`,
      };
    },
  },
  {
    id: 'u1.mm-to-cm', concepts: [C.units], tier: 'explorer',
    generate(r) {
      const mm = r.pick([30, 85, 120, 7, 250, 64]);
      return {
        type: 'numeric', prompt: `An emerald is <b>${mm} mm</b> wide. How many <b>centimetres</b> is that?`, answer: mm / 10, unit: 'cm',
        hints: ['1 cm = 10 mm', `Divide by 10`],
        solution: `${mm} mm ÷ 10 = <b>${fmt(mm / 10)} cm</b>`,
      };
    },
  },
  {
    id: 'u1.min-to-s', concepts: [C.units], tier: 'explorer',
    generate(r) {
      const m = r.int(2, 12);
      return {
        type: 'numeric', prompt: `A day–night cycle in a blocky game lasts about 20 minutes. How many <b>seconds</b> are in <b>${m} minutes</b>?`,
        answer: m * 60, unit: 's', hints: ['1 minute = 60 seconds'], solution: `${m} × 60 = <b>${m * 60} s</b>`,
      };
    },
  },
  {
    id: 'u1.h-to-min', concepts: [C.units], tier: 'scientist',
    generate(r) {
      const hr = r.pick([1.5, 2, 0.5, 2.5, 0.25, 0.75]);
      return {
        type: 'numeric', prompt: `A train ride takes <b>${fmt(hr)} hours</b>. How many <b>minutes</b> is that?`, answer: hr * 60, unit: 'min',
        hints: ['1 hour = 60 minutes', `${fmt(hr)} × 60`], solution: `${fmt(hr)} × 60 = <b>${fmt(hr * 60)} min</b>`,
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
        { q: 'the height of a door', a: 2 },
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
        answer: a + b, unit: 'm', hints: ['Distance counts every step, whichever way you go.'],
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
        type: 'numeric',
        prompt: `Pip walks <b>${a} m right</b>, then <b>${b} m left</b>. What is his <b>displacement</b> from the start? <br><small>Use + for right and − for left (type a minus sign if needed).</small>`,
        answer: a - b, unit: 'm', hints: ['Right is +, left is −.', `Displacement = +${a} − ${b}`],
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
        type: 'numeric', prompt: `${who[0][0].toUpperCase() + who[0].slice(1)} travels <b>${s * t} m</b> in <b>${t} s</b>. What is its speed?`,
        answer: s, unit: 'm/s', unitChoices: SPEED_UNITS,
        hints: ['speed = distance ÷ time', `${s * t} ÷ ${t}`], solution: `speed = ${s * t} ÷ ${t} = <b>${s} m/s</b>`,
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
        hints: ['distance = speed × time', `${fmt(s)} × ${t}`], solution: `distance = ${fmt(s)} × ${t} = <b>${fmt(s * t)} m</b>`,
      };
    },
  },
  {
    id: 'u1.speed-time', concepts: [C.speed], tier: 'scientist',
    generate(r) {
      const s = r.pick([2, 4, 5, 8, 10, 1.5]);
      const t = r.int(2, 12);
      return {
        type: 'numeric', prompt: `A horse gallops <b>${fmt(s * t)} m</b> at <b>${fmt(s)} m/s</b>. How long does it take?`,
        answer: t, unit: 's', unitChoices: SPEED_UNITS,
        hints: ['time = distance ÷ speed', `${fmt(s * t)} ÷ ${fmt(s)}`], solution: `time = ${fmt(s * t)} ÷ ${fmt(s)} = <b>${t} s</b>`,
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
        hints: ['speed = distance ÷ time', `${fmt(s * t)} ÷ ${fmt(t)}`], solution: `${fmt(s * t)} ÷ ${fmt(t)} = <b>${s} km/h</b>`,
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
      }, (x) => x.s1 !== x.s2 && nice((x.d1 + x.d2) / (x.t1 + x.t2)));
      const D = v.d1 + v.d2, T = v.t1 + v.t2;
      return {
        type: 'numeric', prompt: `A cyclist rides <b>${v.d1} km in ${v.t1} h</b>, then <b>${v.d2} km in ${v.t2} h</b>. What is the average speed for the whole trip?`,
        answer: D / T, unit: 'km/h', unitChoices: KMH_UNITS,
        hints: ['Average speed = total distance ÷ total time', `Total distance = ${v.d1} + ${v.d2}; total time = ${v.t1} + ${v.t2}`],
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
      }, (x) => x.s1 !== x.s2 && Number.isInteger(x.d1) && Number.isInteger(x.d2) && nice((x.d1 + x.d2) / (x.t1 + x.t2)));
      const D = v.d1 + v.d2, T = v.t1 + v.t2;
      return {
        type: 'numeric',
        prompt: `Pip walks <b>${v.d1} km at ${v.s1} km/h</b>, then <b>${v.d2} km at ${v.s2} km/h</b>. What is his average speed for the whole walk?`,
        answer: D / T, unit: 'km/h', unitChoices: KMH_UNITS,
        hints: ['First find the time for each part: time = distance ÷ speed.', `Times: ${v.d1} ÷ ${v.s1} and ${v.d2} ÷ ${v.s2}`, 'Then: total distance ÷ total time'],
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
        hints: ['1 km/h = 1000 m ÷ 3600 s', 'So divide km/h by 3.6 to get m/s'],
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
        hints: ['To go from m/s to km/h, multiply by 3.6'],
        solution: `${fmt(m)} × 3.6 = <b>${fmt(m * 3.6)} km/h</b>`,
      };
    },
  },
  {
    id: 'u1.avg-trap-mcq', concepts: [C.avg], tier: 'engineer',
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
      const t = r.pick([4, 5, 8, 10]);
      const s = r.pick([1, 2, 3]);
      const d = s * t;
      const ax = yAxis(d);
      return {
        type: 'numeric',
        prompt: `This graph shows Pip walking. What is his speed?${graphSVG({ points: [[0, 0], [t, d]], tMax: t, ...ax })}`,
        answer: s, unit: 'm/s', unitChoices: SPEED_UNITS,
        hints: ['Read the distance at the end and the time at the end.', `speed = ${d} m ÷ ${t} s`],
        solution: `speed = ${d} ÷ ${t} = <b>${s} m/s</b>`,
      };
    },
  },
  {
    id: 'u1.graph-stop', concepts: [C.graph], tier: 'scientist',
    generate(r) {
      const t1 = r.int(2, 4), stopFor = r.int(2, 4), t3 = t1 + stopFor + r.int(2, 3);
      const d1 = r.int(2, 4) * t1;
      const d3 = d1 + r.int(1, 3) * (t3 - t1 - stopFor);
      const ax = yAxis(d3);
      return {
        type: 'numeric',
        prompt: `How many seconds did Pip stand still for?${graphSVG({ points: [[0, 0], [t1, d1], [t1 + stopFor, d1], [t3, d3]], tMax: t3, ...ax })}`,
        answer: stopFor, unit: 's', hints: ['Standing still = a flat line (distance not changing).'],
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
        answer: t, unit: 'min', hints: ['time = distance ÷ speed gives seconds', `${fmt(d)} ÷ ${fmt(s)} = ${fmt(d / s)} s`, 'Divide by 60 to get minutes'],
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
        answer: 340 * t, unit: 'm', hints: ['distance = speed × time', `340 × ${t}`],
        solution: `340 × ${t} = <b>${fmt(340 * t)} m</b> — about ${fmt((340 * t) / 1000, 1)} km away.`,
      };
    },
  },
  {
    id: 'u1.wp-avg-trap', concepts: [C.avg], tier: 'engineer',
    generate(r) {
      const [s1, s2] = r.pick([[6, 2], [3, 6], [4, 12], [10, 15], [6, 12], [20, 30], [12, 4]]);
      const d = lcm(s1, s2) * r.int(1, 2);
      const T = d / s1 + d / s2;
      return {
        type: 'numeric',
        prompt: `Pip cycles <b>${d} km</b> to his friend's village at <b>${s1} km/h</b>, then comes back the same way at <b>${s2} km/h</b>. What is his average speed for the whole round trip?`,
        answer: (2 * d) / T, unit: 'km/h', unitChoices: KMH_UNITS,
        hints: ['Careful — it is NOT just the average of the two speeds!', `Time there = ${d} ÷ ${s1}; time back = ${d} ÷ ${s2}`, 'Average = total distance ÷ total time'],
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
        prompt: `A cheetah can sprint at <b>${s} m/s</b>. A car on the highway drives at 100 km/h. Convert the cheetah's speed to km/h so you can compare.`,
        answer: s * 3.6, unit: 'km/h', hints: ['m/s → km/h: multiply by 3.6'],
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
        answer: v.t, unit: 'min', hints: ['time = distance ÷ speed (in hours)', 'Then × 60 for minutes'],
        solution: `${d} ÷ ${v.s} = ${fmt(d / v.s)} h = <b>${v.t} min</b>`,
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
        answer: day, unit: 'day', hints: [`Each full day + night it gains ${up - down} m.`, `Careful: on the last day it reaches the top before sliding back!`],
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
]);
