// Unit 5 — Gravity & Free Fall: problem templates.
// g = 10 N/kg = 10 m/s² on Earth. Moon 1.6, Mars 3.7, Jupiter 25.
// Sizes (magnitudes) with the words "up"/"down"; quadratics are solved by factorisation with integer roots.
import { registerTemplates, until } from '../../engine/templates.js';
import { fmt } from '../../core/util.js';

const C = {
  weight: 'mech.weight',
  same: 'mech.equal-fall',
  fall: 'mech.free-fall',
  up: 'mech.vertical-throw',
  quad: 'mech.quadratics',
  air: 'mech.air-resistance',
};

const r2 = (x) => Math.round(x * 100) / 100;
const same = (a, b) => Math.abs(a - b) < 1e-9;
// Keep only mistakes that differ from the answer and from each other (the first message wins).
function errs(answer, list) {
  const out = [];
  for (const e of list) {
    if (!Number.isFinite(e.value) || same(e.value, answer) || out.some((o) => same(o.value, e.value))) continue;
    out.push(e);
  }
  return out;
}

const OTHER_WORLDS = [
  { name: 'the Moon', short: 'Moon', g: 1.6, smaller: true },
  { name: 'Mars', short: 'Mars', g: 3.7, smaller: true },
  { name: 'Jupiter', short: 'Jupiter', g: 25, smaller: false },
];
const ALL_WORLDS = [{ name: 'Earth', short: 'Earth', g: 10, smaller: false }, ...OTHER_WORLDS];
const gNote = (w) => `(g on ${w.name} = ${fmt(w.g)} N/kg)`;
const MASS_UNITS = ['kg', 'N'];

// "t² − 3t + 2 = 0" from the coefficients of t² + bt + c = 0
function quadText(b, c, v = 't') {
  const term = (k, s) => (k === 0 ? '' : ` ${k < 0 ? '−' : '+'} ${Math.abs(k) === 1 && s ? '' : Math.abs(k)}${s}`);
  return `${v}²${term(b, v)}${term(c, '')} = 0`;
}
// "(t − 1)(t − 2)" from the two roots
const bracket = (root, v = 't') => `(${v} ${root < 0 ? '+' : '−'} ${Math.abs(root)})`;

// Thrown-up window crossings with whole-second times: u = 5(t1 + t2) ≤ 30, h = 5·t1·t2.
const WINDOW_PAIRS = [[1, 2], [1, 3], [1, 4], [2, 3], [1, 5], [2, 4]];

registerTemplates([
  // ---------- Lesson 1: mass vs weight ----------
  {
    id: 'u5.weight-earth', concepts: [C.weight], tier: 'explorer',
    generate(r) {
      const thing = r.pick([['a pig', 20, 60], ['Pip', 30, 45], ['a sack of potatoes', 5, 25], ['a big dog', 15, 40], ['a sheep', 30, 70]]);
      const m = r.int(thing[1], thing[2]);
      return {
        type: 'numeric', unitChoices: MASS_UNITS,
        prompt: `${thing[0][0].toUpperCase()}${thing[0].slice(1)} has a mass of <b>${m} kg</b>. What is its <b>weight</b> on Earth? (g = 10 N/kg)`,
        answer: m * 10, unit: 'N',
        hints: ['Weight is a force — gravity\'s pull. How many newtons does Earth pull on each kilogram?', 'W = m × g'],
        errors: errs(m * 10, [
          { value: m, msg: 'That\'s the mass in kilograms. Weight is a force in newtons: W = m × g.' },
          { value: m / 10, msg: 'Multiply, don\'t divide: every kilogram is pulled with 10 N.' },
        ]),
        solution: `W = m × g = ${m} × 10 = <b>${m * 10} N</b>`,
      };
    },
  },
  {
    id: 'u5.weight-planet', concepts: [C.weight], tier: 'explorer',
    generate(r) {
      const w = r.pick(OTHER_WORLDS);
      const who = r.pick([['Pip', 30, 45], ['an astronaut in her space suit', 100, 140], ['a robot rover', 20, 90], ['a crate of supplies', 10, 60]]);
      const m = r.int(who[1], who[2]);
      const W = r2(m * w.g);
      return {
        type: 'numeric', unitChoices: MASS_UNITS,
        prompt: `On <b>${w.name}</b>, what is the weight of ${who[0]} with a mass of <b>${m} kg</b>? ${gNote(w)}`,
        answer: W, unit: 'N',
        hints: [`Does the mass change on ${w.name}? What does change?`, `W = m × g, using ${w.name}'s g.`],
        errors: errs(W, [
          { value: m * 10, msg: `That's the weight on Earth. On ${w.name}, g is ${fmt(w.g)} N/kg.` },
          { value: m, msg: 'That\'s the mass (kg). Weight is the pull of gravity, in newtons.' },
        ]),
        solution: `W = m × g = ${m} × ${fmt(w.g)} = <b>${fmt(W)} N</b>`,
      };
    },
  },
  {
    id: 'u5.mass-from-weight', concepts: [C.weight], tier: 'scientist',
    generate(r) {
      const w = r.pick(ALL_WORLDS);
      const m = r.int(3, 90);
      const W = r2(m * w.g);
      const thing = r.pick(['a rover', 'a robot', 'a supply crate', 'a rock sample']);
      return {
        type: 'numeric', unitChoices: MASS_UNITS,
        prompt: `On ${w.name}, ${thing} weighs <b>${fmt(W)} N</b>. What is its <b>mass</b>? ${gNote(w)}`,
        answer: m, unit: 'kg',
        hints: ['Which is the force and which is the amount of stuff?', 'W = m × g, so m = W ÷ g.'],
        errors: errs(m, [
          { value: W * w.g, msg: 'Divide, don\'t multiply: m = W ÷ g.' },
          { value: W, msg: 'That\'s the weight in newtons. Mass is in kilograms: m = W ÷ g.' },
          ...(w.g !== 10 ? [{ value: W / 10, msg: `That uses Earth's g. On ${w.name}, g = ${fmt(w.g)} N/kg.` }] : []),
        ]),
        solution: `m = W ÷ g = ${fmt(W)} ÷ ${fmt(w.g)} = <b>${m} kg</b>`,
      };
    },
  },
  {
    id: 'u5.weight-transfer', concepts: [C.weight], tier: 'engineer',
    generate(r) {
      const w = r.pick(OTHER_WORLDS);
      const thing = r.pick([['Pip\'s backpack', 2, 9], ['a robot dog', 10, 30], ['a space probe', 40, 90], ['a Minecraft-style crafting table', 15, 30]]);
      const m = r.int(thing[1], thing[2]);
      const W1 = m * 10, W2 = r2(m * w.g);
      return {
        type: 'numeric', unitChoices: MASS_UNITS,
        prompt: `On Earth, ${thing[0]} weighs <b>${W1} N</b>. How much does it weigh on <b>${w.name}</b>? ${gNote(w)}`,
        answer: W2, unit: 'N',
        hints: ['What stays the same when you travel to another world?', 'Find the mass first (m = W ÷ 10), then use W = m × g there.'],
        errors: errs(W2, [
          { value: W1 * w.g, msg: 'The 10 N/kg of Earth is already inside that weight. Find the mass first: m = W ÷ 10.' },
          { value: m, msg: 'That\'s the mass. Now multiply by the new g.' },
          { value: W1, msg: 'Weight changes from world to world — only the mass stays the same.' },
        ]),
        solution: `Mass = ${W1} ÷ 10 = ${m} kg (the same everywhere). On ${w.name}: W = ${m} × ${fmt(w.g)} = <b>${fmt(W2)} N</b>`,
      };
    },
  },
  {
    id: 'u5.find-g', concepts: [C.weight], tier: 'scientist',
    generate(r) {
      const w = r.pick(ALL_WORLDS);
      const m = r.pick([2, 4, 5, 10, 20, 25, 40, 50]);
      const W = r2(m * w.g);
      return {
        type: 'numeric',
        prompt: `A space explorer hangs a <b>${m} kg</b> test block on a force meter. On a mystery world it reads <b>${fmt(W)} N</b>. What is g there?`,
        answer: w.g, unit: 'N/kg',
        hints: ['g tells you how many newtons of pull there are on each kilogram.', 'g = W ÷ m'],
        errors: errs(w.g, [
          { value: m / W, msg: 'Upside down! g = weight ÷ mass (newtons per kilogram).' },
          { value: W * m, msg: 'Divide: g = W ÷ m.' },
        ]),
        solution: `g = W ÷ m = ${fmt(W)} ÷ ${m} = <b>${fmt(w.g)} N/kg</b> — that's ${w.name}!`,
      };
    },
  },
  {
    id: 'u5.mass-weight-mcq', concepts: [C.weight], tier: 'explorer',
    generate(r) {
      const w = r.pick(OTHER_WORLDS);
      const dir = w.smaller ? 'smaller' : 'bigger';
      return {
        type: 'mcq',
        prompt: `Pip flies from Earth to <b>${w.name}</b> (g = ${fmt(w.g)} N/kg). What happens to his <b>mass</b> and his <b>weight</b>?`,
        choices: [`Mass stays the same; weight gets ${dir}`, 'Both stay the same', `Mass gets ${dir}; weight stays the same`, `Both get ${dir}`],
        answer: 0,
        explain: `Mass is the amount of stuff in Pip — it doesn't change when he travels. Weight is gravity's pull, W = m × g, and g on ${w.name} is ${w.smaller ? 'smaller' : 'bigger'} than on Earth.`,
      };
    },
  },
  {
    id: 'u5.units-mcq', concepts: [C.weight], tier: 'explorer',
    generate(r) {
      const m = r.int(20, 80);
      const askWeight = r.chance(0.5);
      const choices = [`${m * 10} N`, `${m} kg`, `${m} m/s`, `${m} s`];
      return {
        type: 'mcq',
        prompt: `Which of these could be a <b>${askWeight ? 'weight' : 'mass'}</b>?`,
        choices,
        answer: askWeight ? 0 : 1,
        explain: 'Mass (amount of stuff) is measured in <b>kilograms (kg)</b>. Weight is a force, so it is measured in <b>newtons (N)</b>.',
      };
    },
  },

  // ---------- Lesson 2: everything falls the same ----------
  {
    id: 'u5.fall-same-mcq', concepts: [C.same], tier: 'explorer',
    generate(r) {
      const [heavy, light] = r.pick([
        ['a 5 kg bowling ball', 'a 1 kg football'],
        ['an iron anvil', 'a small pebble'],
        ['a hammer', 'a feather'],
        ['a big rock', 'a tiny rock'],
      ]);
      const where = r.pick(['In a vacuum chamber (all the air pumped out)', 'On the Moon (there is no air)']);
      return {
        type: 'mcq',
        prompt: `${where}, you drop <b>${heavy}</b> and <b>${light}</b> from the same height at the same moment. Which lands first?`,
        choices: ['They land together', `${heavy[0].toUpperCase()}${heavy.slice(1)}`, `${light[0].toUpperCase()}${light.slice(1)}`],
        answer: 0, keepOrder: true,
        explain: 'With no air, everything falls with the same acceleration, g. Double the mass gives double the weight, but also double the mass to speed up — so a = W ÷ m stays the same.',
      };
    },
  },
  {
    id: 'u5.why-same-mcq', concepts: [C.same], tier: 'scientist',
    generate(r) {
      const m = r.pick([1, 2, 3, 5]), k = r.pick([2, 3, 4]);
      return {
        type: 'mcq',
        prompt: `Ball B has <b>${k} times</b> the mass of ball A (${m} kg and ${m * k} kg), so gravity pulls B ${k} times as hard. Why doesn't B fall faster (with no air)?`,
        choices: [
          `B also has ${k} times as much mass to speed up, so a = W ÷ m is the same`,
          'Gravity only pulls on the lighter ball',
          'Heavier things feel less gravity',
          `It does: B falls ${k} times faster`,
        ],
        answer: 0,
        explain: `A: a = ${m * 10} N ÷ ${m} kg = 10 m/s². B: a = ${m * k * 10} N ÷ ${m * k} kg = 10 m/s². Same acceleration!`,
      };
    },
  },
  {
    id: 'u5.accel-calc', concepts: [C.same, C.weight], tier: 'scientist',
    generate(r) {
      const w = r.pick(ALL_WORLDS);
      const m = r.int(2, 12);
      const W = r2(m * w.g);
      return {
        type: 'numeric',
        prompt: `On ${w.name}, a <b>${m} kg</b> rock weighs <b>${fmt(W)} N</b>. You drop it (no air). What is its acceleration?`,
        answer: w.g, unit: 'm/s²',
        hints: ['Which force makes the rock speed up, and how much mass does it have to move?', 'Newton\'s 2nd law: a = F ÷ m, and here the force is the weight.'],
        errors: errs(w.g, [
          { value: W, msg: 'That\'s the weight (a force, in N). Acceleration = force ÷ mass.' },
          { value: W * m, msg: 'Divide the force by the mass: a = W ÷ m.' },
          ...(w.g !== 10 ? [{ value: 10, msg: `That's Earth's g. This rock is on ${w.name}.` }] : []),
        ]),
        solution: `a = W ÷ m = ${fmt(W)} ÷ ${m} = <b>${fmt(w.g)} m/s²</b> — exactly g on ${w.name}, whatever the mass.`,
      };
    },
  },
  {
    id: 'u5.heavy-light-time', concepts: [C.same], tier: 'scientist',
    generate(r) {
      const t = r.pick([1, 1.5, 2, 3]);
      const h = 5 * t * t;
      const m1 = r.pick([1, 2]), k = r.pick([5, 10, 20]);
      return {
        type: 'numeric',
        prompt: `In a tall vacuum tube (no air), a <b>${m1} kg</b> ball takes <b>${fmt(t)} s</b> to fall ${fmt(h)} m. How long does a <b>${m1 * k} kg</b> ball take to fall the same ${fmt(h)} m?`,
        answer: t, unit: 's',
        hints: ['With no air, does a heavier ball have a bigger acceleration?'],
        errors: errs(t, [
          { value: t / k, msg: `It's ${k} times heavier, but it does NOT fall ${k} times faster: a = W ÷ m is the same for both.` },
          { value: t * k, msg: 'Heavier things don\'t fall slower either — with no air, everything falls together.' },
        ]),
        solution: `Same acceleration (g), same height → same time: <b>${fmt(t)} s</b>`,
      };
    },
  },
  {
    id: 'u5.feather-air-mcq', concepts: [C.same, C.air], tier: 'explorer',
    generate(r) {
      const heavy = r.pick(['a hammer', 'a stone', 'an apple']);
      return {
        type: 'mcq',
        prompt: `On Earth, a feather falls much more slowly than ${heavy}. Why?`,
        choices: [
          'Air pushes up on it (air resistance), and that push is big compared with its tiny weight',
          'Gravity doesn\'t pull on feathers',
          'Lighter things always fall slower, even with no air',
          'The feather has no mass',
        ],
        answer: 0,
        explain: 'Take the air away (vacuum chamber, or the Moon) and the feather falls just as fast. The difference on Earth is air resistance.',
      };
    },
  },

  // ---------- Lesson 3: falling equations ----------
  {
    id: 'u5.fall-speed', concepts: [C.fall], tier: 'explorer',
    generate(r) {
      const t = r.pick([0.5, 1, 1.5, 2.5, 3, 4]);
      const who = r.pick(['A stone is dropped down a well', 'A creeper falls off a cliff', 'Pip drops a pumpkin from a tower', 'An apple falls from a tall tree']);
      return {
        type: 'numeric',
        prompt: `${who}. How fast is it falling after <b>${fmt(t)} s</b>? (g = 10 m/s², no air)`,
        answer: 10 * t, unit: 'm/s',
        hints: ['How much faster does a falling thing get every second?', 'v = g × t (it starts from rest)'],
        errors: errs(10 * t, [
          { value: 5 * t * t, msg: 'That\'s how far it has fallen (h = ½gt²). Speed is v = gt.' },
          { value: t / 10, msg: 'Multiply: it gains 10 m/s every second.' },
        ]),
        solution: `v = g × t = 10 × ${fmt(t)} = <b>${fmt(10 * t)} m/s</b>`,
      };
    },
  },
  {
    id: 'u5.fall-height', concepts: [C.fall], tier: 'scientist',
    generate(r) {
      // Never t = 2 (or 1): then speed and distance (or ½gt and ½gt²) have the same number.
      if (r.chance(0.7)) {
        const t = r.pick([1.5, 2.5, 3, 4]);
        const h = 5 * t * t;
        const what = r.pick(['A stone dropped down a well hits the water', 'A dropped pumpkin hits the ground', 'A stone dropped off a bridge hits the river']);
        return {
          type: 'numeric',
          prompt: `${what} after <b>${fmt(t)} s</b>. How far did it fall? (g = 10 m/s²)`,
          answer: h, unit: 'm',
          hints: ['It starts from rest and speeds up, so does it fall the same distance every second?', 'h = ½ × g × t²'],
          errors: errs(h, [
            { value: 10 * t * t, msg: 'Don\'t forget the ½: h = ½gt².' },
            { value: 10 * t, msg: 'That\'s its speed at the end (v = gt). The distance is h = ½gt².' },
            { value: 5 * t, msg: 'Square the time first: t² = ' + fmt(t * t) + '.' },
          ]),
          solution: `h = ½ × 10 × ${fmt(t)}² = 5 × ${fmt(t * t)} = <b>${fmt(h)} m</b>`,
        };
      }
      const t = r.pick([3, 4, 5]);
      const h = r2(0.8 * t * t);
      return {
        type: 'numeric',
        prompt: `On the Moon (g = 1.6 m/s²) an astronaut drops a rock into a crater. It hits the bottom after <b>${t} s</b>. How deep is the crater?`,
        answer: h, unit: 'm',
        hints: ['Which g should you use on the Moon?', 'h = ½ × g × t²'],
        errors: errs(h, [
          { value: r2(1.6 * t * t), msg: 'Don\'t forget the ½: h = ½gt².' },
          { value: 5 * t * t, msg: 'That uses Earth\'s g. On the Moon g = 1.6 m/s².' },
          { value: r2(1.6 * t), msg: 'That\'s its speed at the end (v = gt). The distance is h = ½gt².' },
        ]),
        solution: `h = ½ × 1.6 × ${t}² = 0.8 × ${t * t} = <b>${fmt(h)} m</b>`,
      };
    },
  },
  {
    id: 'u5.fall-time', concepts: [C.fall], tier: 'scientist',
    generate(r) {
      const [h, t, what] = r.pick([[1.25, 0.5, 'An apple falls 1.25 m from a branch'], [11.25, 1.5, 'Pip jumps off an 11.25 m diving tower'], [45, 3, 'A stone is dropped down a 45 m well'], [80, 4, 'A pumpkin is dropped from an 80 m cliff'], [31.25, 2.5, 'A ball is dropped from a 31.25 m tower']]);
      return {
        type: 'numeric',
        prompt: `${what}. How long does it take to fall? (g = 10 m/s², no air)`,
        answer: t, unit: 's',
        hints: ['Which equation links distance fallen and time?', 'h = 5t², so t² = h ÷ 5. Then take the square root.'],
        errors: errs(t, [
          { value: h / 10, msg: 'Dividing by g isn\'t enough: h = 5t², so find t² first and then take the square root.' },
          { value: h / 5, msg: 'That\'s t². Now take the square root.' },
        ]),
        solution: `t² = ${fmt(h)} ÷ 5 = ${fmt(t * t)}, so t = <b>${fmt(t)} s</b>`,
      };
    },
  },
  {
    id: 'u5.fall-speed-from-height', concepts: [C.fall], tier: 'engineer',
    generate(r) {
      const [h, v] = r.pick([[1.25, 5], [11.25, 15], [31.25, 25], [45, 30], [80, 40]]);
      const what = r.pick(['A stone falls', 'A melon falls', 'A pumpkin falls']);
      return {
        type: 'numeric',
        prompt: `${what} <b>${fmt(h)} m</b> from rest. How fast is it going when it reaches the bottom? (g = 10 m/s², no air)`,
        answer: v, unit: 'm/s',
        hints: ['You know the distance but not the time. Which equation from Unit 3 has no time in it?', 'v² = u² + 2as with u = 0 and a = g: v² = 2gh. Or: find the time first, then v = gt.'],
        errors: errs(v, [
          { value: 20 * h, msg: 'That\'s v². Take the square root to get v.' },
          { value: v / 10, msg: 'That\'s the time it takes to fall. Now find the speed: v = gt.' },
        ]),
        solution: `v² = 2 × 10 × ${fmt(h)} = ${fmt(20 * h)}, so v = √${fmt(20 * h)} = <b>${v} m/s</b>`,
      };
    },
  },
  {
    id: 'u5.second-by-second', concepts: [C.fall], tier: 'scientist',
    generate(r) {
      const n = r.pick([2, 3, 4]);
      const ord = ['', '1st', '2nd', '3rd', '4th'][n];
      const ans = 5 * (2 * n - 1);
      return {
        type: 'numeric',
        prompt: `A stone is dropped down a very deep well. How far does it fall <b>during the ${ord} second</b> (from ${n - 1} s to ${n} s)? (g = 10 m/s²)`,
        answer: ans, unit: 'm',
        hints: [`How far has it fallen after ${n} s? And after ${n - 1} s?`, 'Subtract: h = 5t² at both times.'],
        errors: errs(ans, [
          { value: 5 * n * n, msg: `That's the total distance after ${n} s. Take away what it fell in the first ${n - 1} s.` },
          { value: 10 * n, msg: `That's its speed at ${n} s (v = gt), not a distance.` },
        ]),
        solution: `After ${n} s: 5 × ${n * n} = ${5 * n * n} m. After ${n - 1} s: 5 × ${(n - 1) ** 2} = ${5 * (n - 1) ** 2} m. During the ${ord} second: <b>${ans} m</b> (the pattern 5, 15, 25, 35…)`,
      };
    },
  },
  {
    id: 'u5.odd-pattern-mcq', concepts: [C.fall], tier: 'explorer',
    generate(r) {
      const n = r.pick([4, 5]);
      const shown = Array.from({ length: n - 1 }, (_, i) => 5 * (2 * i + 1));
      const ans = 5 * (2 * n - 1);
      const choices = [`${ans} m`, `${ans - 5} m`, `${ans + 10} m`, `${5 * n * n} m`];
      return {
        type: 'mcq',
        prompt: `A dropped stone falls <b>${shown.join(' m, ')} m</b> in its first ${n - 1} seconds, one second at a time. How far does it fall in the <b>next</b> second?`,
        choices, answer: 0,
        explain: `The distances go up by 10 m each second (because the speed goes up by 10 m/s each second): 5, 15, 25, 35, 45… — 5 × the odd numbers. So the next one is ${ans} m.`,
      };
    },
  },
  {
    id: 'u5.fall-ratio-mcq', concepts: [C.fall], tier: 'scientist',
    generate(r) {
      const k = r.pick([2, 3, 4]);
      const cands = [k, 2 * k, k * k * k, k + 1, k * k + 1].filter((x, i, a) => x !== k * k && a.indexOf(x) === i).slice(0, 3);
      return {
        type: 'mcq',
        prompt: `Stone A falls for <b>1 s</b>. Stone B falls for <b>${k} s</b>. How many times as far as A does B fall? (no air)`,
        choices: [`${k * k} times`, ...cands.map((x) => `${x} times`)],
        answer: 0,
        explain: `h = 5t², so the distance goes with t². A: 5 × 1 = 5 m. B: 5 × ${k * k} = ${5 * k * k} m — that's ${k * k} times as far.`,
      };
    },
  },

  // ---------- Lesson 4: up and down ----------
  {
    id: 'u5.time-to-top', concepts: [C.up], tier: 'explorer',
    generate(r) {
      const u = r.pick([5, 10, 15, 20, 25, 30]);
      return {
        type: 'numeric',
        prompt: `Pip throws a ball straight up at <b>${u} m/s</b>. How long does it take to reach the top? (g = 10 m/s²)`,
        answer: u / 10, unit: 's',
        hints: ['What is the ball\'s speed at the very top?', 'It loses 10 m/s every second. Time to top = u ÷ g.'],
        errors: errs(u / 10, [
          { value: u * 10, msg: 'Divide: it loses 10 m/s every second, so time = u ÷ g.' },
          { value: u / 5, msg: 'That\'s the time to go up AND come back down. The top is halfway.' },
        ]),
        solution: `Time to top = u ÷ g = ${u} ÷ 10 = <b>${fmt(u / 10)} s</b>`,
      };
    },
  },
  {
    id: 'u5.max-height', concepts: [C.up], tier: 'scientist',
    generate(r) {
      const u = r.pick([10, 15, 25, 30]);
      const h = (u * u) / 20;
      return {
        type: 'numeric',
        prompt: `A ball is thrown straight up at <b>${u} m/s</b>. How high does it go? (g = 10 m/s², no air)`,
        answer: h, unit: 'm',
        hints: ['At the top the speed is 0. How long does it take to get there, and what is its average speed on the way up?', 'Max height h = u² ÷ 2g'],
        errors: errs(h, [
          { value: (u * u) / 10, msg: 'Don\'t forget the 2: h = u² ÷ 2g = u² ÷ 20.' },
          { value: u * u, msg: 'Divide by 2g: h = u² ÷ 20.' },
          { value: u / 10, msg: 'That\'s the time to reach the top, not the height.' },
        ]),
        solution: `h = u² ÷ 2g = ${u * u} ÷ 20 = <b>${fmt(h)} m</b>`,
      };
    },
  },
  {
    id: 'u5.flight-time', concepts: [C.up], tier: 'scientist',
    generate(r) {
      const u = r.pick([5, 10, 15, 20, 25, 30]);
      const what = r.pick(['Pip throws a ball straight up', 'A fountain shoots a drop of water straight up', 'A skeleton fires an arrow straight up']);
      return {
        type: 'numeric',
        prompt: `${what} at <b>${u} m/s</b>. How long until it comes back down to where it started? (g = 10 m/s², no air)`,
        answer: u / 5, unit: 's',
        hints: ['How long does the way up take? Is the way down shorter, longer or the same?', 'Time up = u ÷ g, and the way down takes just as long (symmetry).'],
        errors: errs(u / 5, [
          { value: u / 10, msg: 'That\'s only the way up. Coming back down takes the same time again.' },
          { value: u * 2, msg: 'Time to top = u ÷ g. Then double it.' },
        ]),
        solution: `Up: ${u} ÷ 10 = ${fmt(u / 10)} s. Down: the same. Total = <b>${fmt(u / 5)} s</b>`,
      };
    },
  },
  {
    id: 'u5.speed-back-mcq', concepts: [C.up], tier: 'explorer',
    generate(r) {
      const u = r.pick([8, 12, 15, 20, 25]);
      return {
        type: 'mcq',
        prompt: `You throw a ball straight up at <b>${u} m/s</b> and catch it at the same height. How fast is it moving when you catch it? (no air)`,
        choices: [`${u} m/s`, '0 m/s', `${2 * u} m/s`, `${fmt(u / 2)} m/s`],
        answer: 0,
        explain: `Symmetry! It loses 10 m/s every second on the way up and gains 10 m/s every second on the way down, for the same time. So it comes back at ${u} m/s (now moving down).`,
      };
    },
  },
  {
    id: 'u5.after-t-mcq', concepts: [C.up], tier: 'scientist',
    generate(r) {
      const { u, t } = until(r, (rr) => ({ u: rr.pick([10, 15, 20, 25, 30]), t: rr.int(1, 5) }), (x) => x.t < (2 * x.u) / 10 && x.t !== x.u / 10);
      const v = u - 10 * t;
      const dir = v > 0 ? 'up' : 'down';
      const other = v > 0 ? 'down' : 'up';
      return {
        type: 'mcq',
        prompt: `A ball is thrown straight up at <b>${u} m/s</b>. What is it doing <b>${t} s</b> later? (g = 10 m/s²)`,
        choices: [`Moving ${dir} at ${Math.abs(v)} m/s`, `Moving ${other} at ${Math.abs(v)} m/s`, `Moving up at ${u + 10 * t} m/s`, 'Stopped at the top'],
        answer: 0,
        explain: `It loses 10 m/s every second: ${u} − 10 × ${t} = ${v}. ${v > 0 ? `Still going up at ${v} m/s.` : `It reached the top at ${u / 10} s and is now falling at ${-v} m/s.`}`,
      };
    },
  },
  {
    id: 'u5.top-mcq', concepts: [C.up], tier: 'scientist',
    generate(r) {
      const u = r.pick([10, 15, 20]);
      return {
        type: 'mcq',
        prompt: `A ball thrown straight up at ${u} m/s reaches the very top of its flight. At that moment, which is true?`,
        choices: [
          'Its speed is 0, but gravity still pulls it: it is still accelerating down at 10 m/s²',
          'Its speed is 0 and its acceleration is 0',
          `It is moving at its throw speed, ${u} m/s`,
          'Gravity switches off for a moment',
        ],
        answer: 0,
        explain: 'Gravity never switches off. The ball stops for an instant, but its speed keeps changing by 10 m/s every second — that\'s why it starts falling straight away.',
      };
    },
  },
  {
    id: 'u5.throw-for-height', concepts: [C.up], tier: 'engineer',
    generate(r) {
      const [h, u] = r.pick([[5, 10], [11.25, 15], [31.25, 25], [45, 30]]);
      const what = r.pick(['throw a ball up to a ledge', 'throw a ball straight up to a window', 'throw a key up to a friend on a balcony']);
      return {
        type: 'numeric',
        prompt: `Pip wants to ${what} <b>${fmt(h)} m</b> above his hand, so that it just stops there. How fast must he throw it? (g = 10 m/s²)`,
        answer: u, unit: 'm/s',
        hints: ['Turn the motion around: falling from the top, how fast would it be going when it got back down?', 'h = u² ÷ 2g, so u² = 2gh = 20 × h.'],
        errors: errs(u, [
          { value: 20 * h, msg: 'That\'s u². Take the square root.' },
          { value: h, msg: 'That\'s the height. Work out the speed: u² = 20 × h.' },
        ]),
        solution: `u² = 20 × ${fmt(h)} = ${fmt(20 * h)}, so u = <b>${u} m/s</b>`,
      };
    },
  },

  // ---------- Maths power-up: quadratics in real life ----------
  {
    id: 'u5.quad-factor', concepts: [C.quad], tier: 'scientist',
    generate(r) {
      if (r.chance(0.5)) {
        const { a, b } = until(r, (rr) => ({ a: rr.int(1, 5), b: rr.int(2, 6) }), (x) => x.a < x.b);
        return {
          type: 'numeric',
          prompt: `t is a time in seconds. Solve by factorising: <b>${quadText(-(a + b), a * b)}</b><br>There are two answers. Type the <b>later</b> (larger) one.`,
          answer: b, unit: 's',
          hints: [`Find two numbers that multiply to ${a * b} and add up to ${a + b}.`, `Then (t − ?)(t − ?) = 0, so one of the brackets must be zero.`],
          errors: errs(b, [
            { value: a, msg: 'That\'s a solution too — but it\'s the earlier (smaller) one.' },
            { value: a + b, msg: 'The two answers ADD UP to that. Find two numbers that multiply AND add correctly.' },
            { value: a * b, msg: 'The two answers MULTIPLY to that. Factorise to find them.' },
          ]),
          solution: `${bracket(a)}${bracket(b)} = 0, so t = ${a} or t = <b>${b}</b>`,
        };
      }
      const { p, q } = until(r, (rr) => ({ p: rr.int(2, 9), q: rr.int(1, 5) }), (x) => x.p !== x.q);
      // (t + p)(t − q) = t² + (p − q)t − pq
      return {
        type: 'numeric',
        prompt: `t is a time in seconds. Solve by factorising: <b>${quadText(p - q, -p * q)}</b><br>Which answer is the real time?`,
        answer: q, unit: 's',
        hints: [`Find two numbers that multiply to −${p * q} and add up to ${p - q < 0 ? '−' : ''}${Math.abs(p - q)}.`, 'One answer will be negative. Can a time after the start be negative?'],
        errors: errs(q, [
          { value: p, msg: `t = −${p} is the other solution — but a negative time is before the start, so we reject it.` },
          { value: p * q, msg: 'Factorise into two brackets first.' },
        ]),
        solution: `(t + ${p})(t − ${q}) = 0, so t = −${p} (rejected: negative time) or t = <b>${q} s</b>`,
      };
    },
  },
  {
    id: 'u5.window-times', concepts: [C.quad, C.up], tier: 'engineer',
    generate(r) {
      const [t1, t2] = r.pick(WINDOW_PAIRS);
      const u = 5 * (t1 + t2), h = 5 * t1 * t2;
      const down = r.chance(0.5);
      const ans = down ? t2 : t1;
      return {
        type: 'numeric',
        prompt: `A ball is thrown straight up at <b>${u} m/s</b>. A window is <b>${h} m</b> above the thrower's hand. When does the ball pass the window <b>on the way ${down ? 'down' : 'up'}</b>? (height = ${u}t − 5t²)`,
        answer: ans, unit: 's',
        hints: [`Put the height in: ${h} = ${u}t − 5t². Move everything to one side.`, 'Divide by 5 and factorise. Which answer is going up and which is coming down?'],
        errors: errs(ans, [
          { value: down ? t1 : t2, msg: `That's when it passes on the way ${down ? 'up' : 'down'}. The ${down ? 'later' : 'earlier'} time is the one you want.` },
          { value: h / u, msg: 'That ignores gravity slowing the ball. Solve the quadratic.' },
        ]),
        solution: `5t² − ${u}t + ${h} = 0 → ${quadText(-(t1 + t2), t1 * t2)} → ${bracket(t1)}${bracket(t2)} = 0. Up at ${t1} s, down at ${t2} s. Answer: <b>${ans} s</b>`,
      };
    },
  },
  {
    id: 'u5.quad-up-mcq', concepts: [C.quad, C.up], tier: 'explorer',
    generate(r) {
      const [t1, t2] = r.pick(WINDOW_PAIRS);
      const u = 5 * (t1 + t2), h = 5 * t1 * t2;
      return {
        type: 'mcq',
        prompt: `A ball is thrown up at ${u} m/s. Solving <b>${h} = ${u}t − 5t²</b> gives <b>t = ${t1} s</b> and <b>t = ${t2} s</b>. What do the two answers mean?`,
        choices: [
          `The ball is ${h} m high twice: at ${t1} s going up and at ${t2} s coming down`,
          'One of the answers must be a mistake',
          `The ball stays at ${h} m from ${t1} s to ${t2} s`,
          'The ball was thrown twice',
        ],
        answer: 0,
        explain: `Both answers are real moments. The top is halfway between them, at ${fmt((t1 + t2) / 2)} s (= ${u} ÷ 10).`,
      };
    },
  },
  {
    id: 'u5.sign-root-mcq', concepts: [C.quad], tier: 'scientist',
    generate(r) {
      const q = r.int(1, 4), p = r.int(q + 1, 8);
      return {
        type: 'mcq',
        prompt: `Pip throws a stone <b>down</b> from a tower. For its time t (seconds after the throw), he gets <b>(t + ${p})(t − ${q}) = 0</b>. When does the stone land?`,
        choices: [`t = ${q} s`, `t = −${p} s`, `Both −${p} s and ${q} s`, `t = ${p} s`],
        answer: 0,
        explain: `The maths gives t = −${p} or t = ${q}. The stone was thrown at t = 0, so a negative time (before the throw) can't be the landing. Reject it: <b>${q} s</b>.`,
      };
    },
  },
  {
    id: 'u5.throw-down', concepts: [C.quad, C.fall], tier: 'engineer',
    generate(r) {
      const { u, q } = until(r, (rr) => ({ u: rr.pick([5, 10, 15]), q: rr.int(1, 3) }), (x) => x.u * x.q + 5 * x.q * x.q <= 80);
      const H = u * q + 5 * q * q, k = u / 5, neg = q + k;
      return {
        type: 'numeric',
        prompt: `From the top of a <b>${H} m</b> tower, Pip throws a stone straight <b>down</b> at <b>${u} m/s</b>. How long until it hits the ground? (distance down = ${u}t + 5t²)`,
        answer: q, unit: 's',
        hints: [`Set ${H} = ${u}t + 5t² and move everything to one side.`, 'Divide by 5, then factorise. Can the time be negative?'],
        errors: errs(q, [
          { value: H / u, msg: 'That ignores gravity speeding the stone up. Solve the quadratic.' },
          { value: neg, msg: `t = −${neg} is the root we reject — a negative time is before the throw.` },
          { value: Math.sqrt(H / 5), msg: 'That is the time if it were just dropped. It was thrown down, so it lands sooner.' },
        ]),
        solution: `5t² + ${u}t − ${H} = 0 → ${quadText(k, -H / 5)} → (t + ${neg})(t − ${q}) = 0. t = −${neg} is before the throw, so t = <b>${q} s</b>`,
      };
    },
  },

  // ---------- Lesson 5: air resistance ----------
  {
    id: 'u5.terminal-drag', concepts: [C.air], tier: 'explorer',
    generate(r) {
      const m = r.pick([50, 55, 60, 65, 70, 75, 80, 85, 90]);
      return {
        type: 'numeric', unitChoices: MASS_UNITS,
        prompt: `A skydiver with a mass of <b>${m} kg</b> (with her kit) is falling at her terminal velocity. How big is the air resistance (drag) on her?`,
        answer: m * 10, unit: 'N',
        hints: ['At terminal velocity she isn\'t speeding up. What does that tell you about the forces?', 'drag = weight = m × g'],
        errors: errs(m * 10, [
          { value: m, msg: 'That\'s her mass. Drag is a force, in newtons: it equals her weight.' },
          { value: 0, msg: 'There IS drag — it balances her weight exactly, so the resultant force is zero.' },
        ]),
        solution: `Steady speed → forces balance: drag = weight = ${m} × 10 = <b>${m * 10} N</b>`,
      };
    },
  },
  {
    id: 'u5.resultant-air', concepts: [C.air], tier: 'scientist',
    generate(r) {
      const m = r.pick([50, 60, 70, 80, 90, 100]);
      const a = r.pick([1, 2, 2.5, 4, 6, 8]); // never 5: then drag ÷ mass would equal the answer
      const W = m * 10, D = W - m * a;
      return {
        type: 'numeric',
        prompt: `A skydiver of mass <b>${m} kg</b> is speeding up. Right now the drag on her is <b>${D} N</b>. What is her acceleration at this moment? (g = 10 N/kg)`,
        answer: a, unit: 'm/s²',
        hints: ['What is her weight? Which way does the drag push?', 'Resultant force = weight − drag, then a = F ÷ m.'],
        errors: errs(a, [
          { value: 10, msg: 'That ignores the drag. The resultant force is weight − drag.' },
          { value: W - D, msg: 'That\'s the resultant force in newtons. Divide by her mass to get the acceleration.' },
          { value: D / m, msg: 'Use the RESULTANT force: weight − drag.' },
        ]),
        solution: `Weight = ${W} N. Resultant = ${W} − ${D} = ${W - D} N. a = ${W - D} ÷ ${m} = <b>${fmt(a)} m/s²</b>`,
      };
    },
  },
  {
    id: 'u5.terminal-mcq', concepts: [C.air], tier: 'explorer',
    generate(r) {
      const who = r.pick(['A skydiver', 'A falling raindrop', 'A sycamore seed']);
      return {
        type: 'mcq',
        prompt: `${who} is falling at a steady top speed — its <b>terminal velocity</b>. Which is true?`,
        choices: ['Drag equals the weight, so the resultant force is zero', 'There is no drag any more', 'Drag is bigger than the weight', 'The weight has become zero'],
        answer: 0,
        explain: 'Steady speed means no acceleration, so the resultant force is zero: drag (up) = weight (down). Gravity is still pulling as hard as ever!',
      };
    },
  },
  {
    id: 'u5.parachute-mcq', concepts: [C.air], tier: 'scientist',
    generate(r) {
      const v = r.pick([45, 50, 55]);
      return {
        type: 'mcq',
        prompt: `A skydiver is falling at ${v} m/s when her parachute opens. Just after it opens, what happens?`,
        choices: [
          'Drag is now bigger than her weight, so she slows down until drag = weight again, at a lower speed',
          'She shoots back up into the sky',
          'Drag becomes zero',
          `She keeps falling at ${v} m/s`,
        ],
        answer: 0,
        explain: 'The big canopy makes a huge drag at that speed. The resultant force points UP, so she slows down (she does not go up!). Slower → less drag, until drag = weight at about 5 m/s.',
      };
    },
  },
  {
    id: 'u5.bigger-chute-mcq', concepts: [C.air], tier: 'scientist',
    generate(r) {
      const m = r.pick([60, 70, 80]);
      return {
        type: 'mcq',
        prompt: `Two skydivers, both ${m} kg, open parachutes. Ana's parachute is <b>twice as big</b> as Ben's. Who falls with the lower terminal speed?`,
        choices: [
          'Ana — her big parachute makes drag equal her weight at a lower speed',
          'Ben — smaller parachutes are slower',
          'Same speed — they have the same weight',
          'Ana — because her weight is smaller',
        ],
        answer: 0,
        explain: `Terminal speed is reached when drag = weight (${m * 10} N for both). A bigger parachute gets that much drag at a lower speed.`,
      };
    },
  },
  {
    id: 'u5.terminal-speed', concepts: [C.air], tier: 'engineer',
    generate(r) {
      const { m, v } = until(r, (rr) => ({ m: rr.pick([50, 60, 70, 80, 90, 100]), v: rr.pick([4, 5, 5, 10]) }), (x) => Number.isInteger((x.m * 10) / (x.v * x.v)));
      const W = m * 10, D = W / (v * v);
      return {
        type: 'numeric',
        prompt: `Pip and his gear have a mass of <b>${m} kg</b>. For his parachute, <b>drag = ${D} × speed²</b> (in newtons). What is his terminal speed?`,
        answer: v, unit: 'm/s',
        hints: ['At terminal speed, how does the drag compare with his weight?', `Set ${D} × v² equal to his weight, find v², then take the square root.`],
        errors: errs(v, [
          { value: W / D, msg: 'That\'s v². Take the square root.' },
          { value: W, msg: 'That\'s his weight in newtons. Set drag = weight and solve for the speed.' },
          { value: m / D, msg: 'Use his weight (m × g), not his mass, for the force.' },
        ]),
        solution: `Weight = ${W} N. ${D} × v² = ${W} → v² = ${W / D} → v = <b>${v} m/s</b>`,
      };
    },
  },

  // ---------- Word problems ----------
  {
    id: 'u5.wp-ledge', concepts: [C.fall], tier: 'scientist',
    generate(r) {
      const v = r.pick([5, 10, 30, 40]);
      const h = (v * v) / 20;
      const who = r.pick(['A creeper slips off a ledge', 'A melon falls off a cliff', 'Pip\'s pickaxe slips out of his hand on a tall tower']);
      return {
        type: 'numeric',
        prompt: `${who} and hits the ground at <b>${v} m/s</b>. How high was it? (g = 10 m/s², ignore air)`,
        answer: h, unit: 'm',
        hints: ['How long did it fall to reach that speed?', 'Time = v ÷ g; then h = ½gt². Or use v² = 2gh.'],
        errors: errs(h, [
          { value: (v * v) / 10, msg: 'Don\'t forget the 2: v² = 2gh, so h = v² ÷ 20.' },
          { value: v / 10, msg: 'That\'s how long it fell. Now find the height: h = 5t².' },
          { value: v, msg: 'That\'s the speed. Use h = v² ÷ 2g.' },
        ]),
        solution: `Time = ${v} ÷ 10 = ${fmt(v / 10)} s, h = 5 × ${fmt((v / 10) ** 2)} = <b>${fmt(h)} m</b> (or h = v² ÷ 2g = ${v * v} ÷ 20)`,
      };
    },
  },
  {
    id: 'u5.wp-arrow', concepts: [C.up], tier: 'scientist',
    generate(r) {
      const u = r.pick([20, 25, 30]);
      const askH = r.chance(0.5);
      if (askH) {
        const h = (u * u) / 20;
        return {
          type: 'numeric',
          prompt: `Pip fires an arrow straight up at <b>${u} m/s</b> to hit a target balloon right at the top of its flight. How high is the balloon? (g = 10 m/s², ignore air)`,
          answer: h, unit: 'm',
          hints: ['What is the arrow\'s speed at the top?', 'Max height h = u² ÷ 2g.'],
          errors: errs(h, [
            { value: (u * u) / 10, msg: 'Don\'t forget the 2: h = u² ÷ 2g.' },
            { value: u / 10, msg: 'That\'s the time to reach the top. Now find the height: h = u² ÷ 2g.' },
          ]),
          solution: `h = ${u}² ÷ 20 = ${u * u} ÷ 20 = <b>${fmt(h)} m</b>`,
        };
      }
      return {
        type: 'numeric',
        prompt: `Pip fires an arrow straight up at <b>${u} m/s</b>. How long until it lands back at his feet? (g = 10 m/s², ignore air)`,
        answer: u / 5, unit: 's',
        hints: ['How long until it stops at the top?', 'The way down takes the same time as the way up.'],
        errors: errs(u / 5, [{ value: u / 10, msg: 'That\'s only the way up. Double it for up and down.' }]),
        solution: `Up: ${u} ÷ 10 = ${u / 10} s; down: the same. Total <b>${u / 5} s</b>`,
      };
    },
  },
  {
    id: 'u5.wp-moon-jump', concepts: [C.up, C.weight], tier: 'engineer',
    generate(r) {
      const [u, what, it] = r.pick([[2, 'jumps straight up at 2 m/s', 'she'], [4, 'throws a ball straight up at 4 m/s', 'the ball'], [8, 'throws a rock straight up at 8 m/s', 'the rock']]);
      const h = r2((u * u) / 3.2);
      return {
        type: 'numeric',
        prompt: `On the Moon (g = 1.6 m/s²), an astronaut ${what}. How high does ${it} go?`,
        answer: h, unit: 'm',
        hints: ['Which g do you use on the Moon?', 'h = u² ÷ 2g'],
        errors: errs(h, [
          { value: (u * u) / 20, msg: 'That\'s on Earth (g = 10). On the Moon, g = 1.6 m/s², so it goes much higher.' },
          { value: r2((u * u) / 1.6), msg: 'Don\'t forget the 2: h = u² ÷ (2 × 1.6).' },
        ]),
        solution: `h = u² ÷ 2g = ${u * u} ÷ 3.2 = <b>${fmt(h)} m</b> — on Earth it would be only ${fmt((u * u) / 20)} m!`,
      };
    },
  },
  {
    id: 'u5.wp-two-stones', concepts: [C.fall], tier: 'engineer',
    generate(r) {
      const T = r.pick([2, 3, 4]);
      const gap = 5 * T * T - 5 * (T - 1) * (T - 1);
      return {
        type: 'numeric',
        prompt: `Pip drops stone A down a very deep mine shaft. Exactly <b>1 s later</b> he drops stone B from the same spot. How far apart are the stones <b>${T} s after A was dropped</b>?`,
        answer: gap, unit: 'm',
        hints: ['How long has each stone been falling?', 'Use h = 5t² for each stone, then subtract.'],
        errors: errs(gap, [
          { value: 5, msg: 'The gap doesn\'t stay at 5 m: A is always moving faster than B, so the gap keeps growing.' },
          { value: 5 * T * T, msg: 'That\'s how far A has fallen. Take away how far B has fallen.' },
        ]),
        solution: `A: ${T} s → 5 × ${T * T} = ${5 * T * T} m. B: ${T - 1} s → 5 × ${(T - 1) ** 2} = ${5 * (T - 1) ** 2} m. Gap = <b>${gap} m</b>`,
      };
    },
  },
  {
    id: 'u5.puzzle-splash', concepts: [C.quad, C.fall], tier: 'engineer', puzzle: true,
    generate(r) {
      // fall time T and sound time 5T² ÷ c add up to a "nice" total; × (c ÷ 5) gives t² + kt − k·total = 0.
      const [c, T] = r.pick([[300, 3], [320, 4]]);
      const depth = 5 * T * T, total = T + depth / c, k = c / 5;
      const askDepth = r.chance(0.6);
      const ans = askDepth ? depth : T;
      return {
        type: 'numeric',
        prompt: `Pip drops a stone into a deep, dark well and hears the <b>splash ${fmt(total)} s</b> after letting go. Use <b>${c} m/s</b> for the speed of sound (really about 340 m/s — this number keeps the maths friendly). ${askDepth ? 'How deep is the well (to the water)?' : 'How long was the stone falling?'}`,
        answer: ans, unit: askDepth ? 'm' : 's',
        hints: [
          'Two parts: the stone falls for t seconds, then the sound travels back up. Do the two times add to the total?',
          `Depth = 5t², and the sound takes depth ÷ ${c} seconds. So t + 5t² ÷ ${c} = ${fmt(total)}.`,
          `Multiply everything by ${k}: you get a quadratic in t. Factorise it — and reject the negative answer.`,
        ],
        errors: errs(ans, askDepth ? [
          { value: r2(5 * total * total), msg: 'That forgets the time the sound took to come back up.' },
          { value: T, msg: 'That\'s the fall time. Now find the depth: 5t².' },
        ] : [
          { value: total, msg: 'Part of that time is the sound coming back up.' },
          { value: k + T, msg: 'That\'s the root we reject (it is negative).' },
        ]),
        solution: `t + 5t² ÷ ${c} = ${fmt(total)} → × ${k}: t² + ${k}t − ${fmt(k * total)} = 0 → (t + ${k + T})(t − ${T}) = 0 → t = ${T} s (−${k + T} is impossible). Depth = 5 × ${T * T} = ${depth} m. Answer: <b>${ans} ${askDepth ? 'm' : 's'}</b>`,
      };
    },
  },
  {
    id: 'u5.puzzle-window', concepts: [C.quad, C.up], tier: 'engineer', puzzle: true,
    generate(r) {
      const [t1, t2] = r.pick(WINDOW_PAIRS);
      const u = 5 * (t1 + t2), h = 5 * t1 * t2;
      const askU = r.chance(0.5);
      return {
        type: 'numeric',
        prompt: `A ball is thrown straight up. It flies past a window ledge on the way up at <b>${t1} s</b>, and past it again on the way down at <b>${t2} s</b>. ${askU ? 'How fast was it thrown?' : 'How high is the ledge above the thrower\'s hand?'} (g = 10 m/s², no air)`,
        answer: askU ? u : h, unit: askU ? 'm/s' : 'm',
        hints: askU
          ? ['Symmetry: when does the ball reach the top?', 'At the top it has stopped. It lost 10 m/s every second to get there — so how fast did it start?']
          : ['First find the throw speed: the top is exactly halfway between the two times.', 'Then height = ut − 5t² at either time (both must give the same answer!).'],
        errors: errs(askU ? u : h, askU ? [
          { value: 10 * t2, msg: `The top isn't at ${t2} s — it is halfway between ${t1} s and ${t2} s.` },
          { value: 10 * t1, msg: `At ${t1} s the ball is still going up. The top is halfway between the two times.` },
        ] : [
          { value: 5 * t1 * t1, msg: 'That\'s how far a DROPPED ball falls. Use height = ut − 5t².' },
          { value: u * t1, msg: 'That ignores gravity. Height = ut − 5t².' },
        ]),
        solution: `Top at (${t1} + ${t2}) ÷ 2 = ${fmt((t1 + t2) / 2)} s, so u = 10 × ${fmt((t1 + t2) / 2)} = ${u} m/s. Height = ${u} × ${t1} − 5 × ${t1 * t1} = ${h} m. (Check: ${bracket(t1)}${bracket(t2)} = 0 is ${quadText(-(t1 + t2), t1 * t2)}.) Answer: <b>${askU ? u : h} ${askU ? 'm/s' : 'm'}</b>`,
      };
    },
  },
]);
