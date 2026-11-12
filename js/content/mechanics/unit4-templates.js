// Unit 4 — Forces & Newton's Laws: problem templates.
// Weight (W = mg) comes in Unit 5, so here gravity's pull is always given in newtons.
import { registerTemplates, until } from '../../engine/templates.js';
import { fmt, fmtSigned } from '../../core/util.js';

const C = {
  force: 'mech.force',
  n1: 'mech.newton1',
  n2: 'mech.newton2',
  fric: 'mech.friction',
  n3: 'mech.newton3',
};

const SIGN_NOTE = '<br><small>Use + for right and − for left.</small>';
const nice = (x) => Number.isFinite(x) && Math.abs(x * 100 - Math.round(x * 100)) < 1e-6;
// Every value differs from every other one (answer and mistakes must never collide).
const distinct = (...vals) => vals.every((a, i) => vals.every((b, j) => i === j || Math.abs(a - b) > 1e-6 * Math.max(1, Math.abs(a))));
const dirWord = (x) => (x > 0 ? 'right' : 'left');

// ---------- Free-body diagram (SVG string) ----------
// right/left: arrays of { value, label }; up/down: { value, label } or null.
// ONE scale for every arrow, so a longer arrow always means a bigger force (as taught in Lesson 1).
// scaleMax: the force drawn at full length — pass the same value to every diagram of one question so they compare fairly.
export function fbdSVG({ right = [], left = [], up = null, down = null }, { small = false, scaleMax } = {}) {
  const box = small ? 34 : 54;
  const maxLen = small ? 44 : 96, minLen = small ? 8 : 10;
  const fs = small ? 15 : 15;
  const all = [...right, ...left, up, down].filter(Boolean).map((f) => f.value);
  // room for a label beyond an arrow tip (small diagrams: just the number, so measure the longest one)
  const digits = Math.max(1, ...[...right, ...left].map((f) => fmt(f.value).length));
  const lab = small ? 8 + digits * fs * 0.62 : 100;
  const w = 2 * (box / 2 + maxLen + lab), h = 2 * (box / 2 + maxLen + (small ? 6 : 10));
  const cx = w / 2, cy = h / 2;
  const k = maxLen / Math.max(1, scaleMax ?? 0, ...all);
  const len = (v) => Math.max(minLen, v * k);
  const arrow = (x1, y1, x2, y2, col) => {
    const ang = Math.atan2(y2 - y1, x2 - x1), hd = Math.min(small ? 8 : 11, Math.abs(x2 - x1) + Math.abs(y2 - y1));
    const bx = x2 - Math.cos(ang) * hd * 0.8, by = y2 - Math.sin(ang) * hd * 0.8;
    const p = (a) => `${(x2 - Math.cos(a) * hd).toFixed(1)},${(y2 - Math.sin(a) * hd).toFixed(1)}`;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${col}" stroke-width="${small ? 4 : 5}"/>`
      + `<polygon points="${x2.toFixed(1)},${y2.toFixed(1)} ${p(ang - 0.5)} ${p(ang + 0.5)}" fill="${col}"/>`;
  };
  const txt = (x, y, anchor, fill, str) => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" fill="${fill}" font-size="${fs}" font-weight="700">${str}</text>`;
  // Horizontal labels sit just beyond the arrow tip (name on top, size below), so short arrows stay readable.
  const hLabel = (f, xTip, y, dir, fill) => {
    const x = xTip + dir * 5, anchor = dir > 0 ? 'start' : 'end';
    if (small || !f.label) return txt(x, y + fs / 3, anchor, fill, small ? fmt(f.value) : `${fmt(f.value)} N`);
    return txt(x, y - 3, anchor, fill, f.label) + txt(x, y + fs, anchor, fill, `${fmt(f.value)} N`);
  };
  const offs = (n) => (n <= 1 ? [0] : [-box / 3, box / 3]);
  let out = '';
  right.forEach((f, i) => {
    const y = cy + offs(right.length)[i];
    const x1 = cx + box / 2, x2 = x1 + len(f.value);
    out += arrow(x1, y, x2, y, '#ff9b3d') + hLabel(f, x2, y, 1, '#ffd2a6');
  });
  left.forEach((f, i) => {
    const y = cy + offs(left.length)[i];
    const x1 = cx - box / 2, x2 = x1 - len(f.value);
    out += arrow(x1, y, x2, y, '#80ff20') + hLabel(f, x2, y, -1, '#c8ff9a');
  });
  const vLabel = (f) => (small ? fmt(f.value) : `${f.label ? `${f.label} ` : ''}${fmt(f.value)} N`);
  if (up) {
    const y1 = cy - box / 2, y2 = y1 - len(up.value);
    out += arrow(cx, y1, cx, y2, '#4aedd9') + txt(cx + 8, (y1 + y2) / 2 + 5, 'start', '#b5fff5', vLabel(up));
  }
  if (down) {
    const y1 = cy + box / 2, y2 = y1 + len(down.value);
    out += arrow(cx, y1, cx, y2, '#ffffff') + txt(cx + 8, (y1 + y2) / 2 + 5, 'start', '#ffffff', vLabel(down));
  }
  const crate = `<rect x="${cx - box / 2}" y="${cy - box / 2}" width="${box}" height="${box}" fill="#a8702f" stroke="#4a2c12" stroke-width="4"/>`
    + `<line x1="${cx - box / 2}" y1="${cy - box / 2}" x2="${cx + box / 2}" y2="${cy + box / 2}" stroke="#4a2c12" stroke-width="3"/>`
    + `<line x1="${cx + box / 2}" y1="${cy - box / 2}" x2="${cx - box / 2}" y2="${cy + box / 2}" stroke="#4a2c12" stroke-width="3"/>`;
  const style = small ? ' style="max-width:190px;margin:0 auto;border-width:2px"' : '';
  return `<svg class="graph"${style} viewBox="0 0 ${w} ${h}" role="img" aria-label="free-body diagram"><rect width="${w}" height="${h}" class="g-bg"/>${crate}${out}</svg>`;
}

// Every mistake value must be typeable on the keypad (at most 2 decimal places), so drop any that aren't.
const typeable = (list) => list.map((t) => ({
  ...t,
  generate(r) {
    const q = t.generate(r);
    return q.errors ? { ...q, errors: q.errors.filter((e) => nice(e.value)) } : q;
  },
}));

registerTemplates(typeable([
  // ---------- Lesson 1: forces and the resultant force ----------
  {
    id: 'u4.estimate-mcq', concepts: [C.force], tier: 'explorer',
    generate(r) {
      const s = r.pick([
        { what: 'a strong push from a 10-year-old (like you!)', choices: ['1 N', '100 N', '10,000 N', '1,000,000 N'], answer: 1, explain: 'A strong push from a kid is roughly 100–200 N. 1 N is about the force needed to hold up an apple.' },
        { what: 'the force needed to hold up an apple', choices: ['1 N', '100 N', '1,000 N', '10,000 N'], answer: 0, explain: 'Gravity pulls an apple down with only about 1 N — a newton is quite a small force!' },
        { what: "a car's engine force when the car speeds up", choices: ['3 N', '30 N', '3,000 N', '3,000,000 N'], answer: 2, explain: 'Speeding up a car that weighs more than a tonne takes a few thousand newtons.' },
        { what: 'the engines of a giant space rocket at lift-off', choices: ['300 N', '30,000 N', '300,000 N', '30,000,000 N'], answer: 3, explain: 'The Saturn V moon rocket pushed with about 35 million newtons!' },
      ]);
      return {
        type: 'mcq', keepOrder: true,
        prompt: `Forces are measured in <b>newtons (N)</b>. Roughly how big is ${s.what}?`,
        choices: s.choices, answer: s.answer, explain: s.explain,
      };
    },
  },
  {
    id: 'u4.resultant-same', concepts: [C.force], tier: 'explorer',
    generate(r) {
      const [n1, n2] = r.pick([['Pip', 'Alex'], ['Steve', 'Pip'], ['Alex', 'Steve']]);
      const A = r.int(6, 15) * 10;
      const B = r.pick([5, 6, 7, 8, 9, 10, 11, 12, 13, 14].filter((x) => x * 10 !== A)) * 10;
      return {
        type: 'numeric',
        prompt: `${n1} and ${n2} push a stuck minecart <b>in the same direction</b>: ${n1} with <b>${A} N</b> and ${n2} with <b>${B} N</b>. What is the <b>resultant</b> (total) force on the minecart?`,
        answer: A + B, unit: 'N',
        hints: ['Do the two force arrows point the same way or opposite ways?', 'Arrows pointing the same way add up, tip-to-tail.'],
        errors: [{ value: Math.abs(A - B), msg: 'They push the same way, so the forces add up — they don\'t cancel.' }],
        solution: `Same direction, so add: ${A} + ${B} = <b>${A + B} N</b>`,
      };
    },
  },
  {
    id: 'u4.resultant-opp', concepts: [C.force], tier: 'scientist',
    generate(r) {
      const R = r.int(20, 60) * 10;
      const L = r.pick([20, 25, 30, 35, 40, 45, 50, 55, 60].filter((x) => x * 10 !== R)) * 10;
      const res = R - L;
      return {
        type: 'numeric', signed: true,
        prompt: `Tug-of-war! Team Pip pulls the rope <b>right with ${R} N</b>. Team Zombie pulls it <b>left with ${L} N</b>. What is the resultant force on the rope?${SIGN_NOTE}`,
        answer: res, unit: 'N',
        hints: ['Which team pulls harder? That tells you the direction.', 'Opposite directions: right is +, left is −. Add them with their signs.'],
        errors: [
          { value: R + L, msg: 'The teams pull in opposite directions, so the forces partly cancel — subtract.' },
          { value: -res, msg: 'Right size, wrong direction — which team pulls harder?' },
        ],
        solution: `(+${R}) + (−${L}) = <b>${fmtSigned(res)} N</b>: ${Math.abs(res)} N to the ${dirWord(res)}, so the rope moves ${dirWord(res)}.`,
      };
    },
  },
  {
    id: 'u4.resultant-many', concepts: [C.force], tier: 'scientist',
    generate(r) {
      const v = until(r, (rr) => ({ a: rr.int(5, 15) * 10, b: rr.int(2, 8) * 10, c: rr.int(4, 14) * 10, d: rr.int(1, 6) * 10 }), (x) => x.a + x.b !== x.c + x.d);
      const res = v.a + v.b - v.c - v.d;
      return {
        type: 'numeric', signed: true,
        prompt: `A minecart is stuck in a tunnel. Four forces act on it along the track:<br>→ Steve pushes <b>right</b> with <b>${v.a} N</b><br>→ Alex pulls <b>right</b> with <b>${v.b} N</b><br>← Pip pushes <b>left</b> with <b>${v.c} N</b><br>← the wind pushes <b>left</b> with <b>${v.d} N</b><br>What is the resultant force?${SIGN_NOTE}`,
        answer: res, unit: 'N',
        hints: ['How much force points right altogether? And left?', 'Resultant = (total right) − (total left). The sign shows the direction.'],
        errors: [
          { value: v.a + v.b + v.c + v.d, msg: 'Two forces point left, so they count as negative — don\'t add everything.' },
          { value: -res, msg: 'Right size, wrong direction — which side has more force?' },
        ],
        solution: `Right: ${v.a} + ${v.b} = ${v.a + v.b} N. Left: ${v.c} + ${v.d} = ${v.c + v.d} N. Resultant = ${v.a + v.b} − ${v.c + v.d} = <b>${fmtSigned(res)} N</b> (${Math.abs(res)} N to the ${dirWord(res)})`,
      };
    },
  },
  {
    id: 'u4.missing-force', concepts: [C.force], tier: 'scientist',
    generate(r) {
      const v = until(r, (rr) => ({ x: rr.int(8, 15) * 10, y: rr.int(8, 15) * 10, z: rr.int(8, 15) * 10, s: rr.int(10, 18) * 10 }), (q) => {
        const p = q.x + q.y + q.z - q.s;
        return p >= 60 && p <= 250 && p !== q.s;
      });
      const left = v.x + v.y + v.z;
      const pip = left - v.s;
      return {
        type: 'numeric',
        prompt: `In a tug-of-war, the rope <b>isn't moving</b> — the forces are balanced. Three zombies pull <b>left</b> with <b>${v.x} N</b>, <b>${v.y} N</b> and <b>${v.z} N</b>. On the right, Alex pulls with <b>${v.s} N</b> and Pip pulls too. How hard is <b>Pip</b> pulling?`,
        answer: pip, unit: 'N',
        hints: ['Balanced means the resultant force is 0. What must the right team\'s total be?', 'Pip + Alex = the whole left team.'],
        errors: [
          { value: left, msg: 'That\'s the whole left team. Alex is helping Pip, so Pip needs less than that.' },
          { value: left + v.s, msg: 'Alex pulls on Pip\'s side, so take Alex\'s pull away, don\'t add it.' },
        ],
        solution: `Left team: ${v.x} + ${v.y} + ${v.z} = ${left} N. Balanced, so the right team also makes ${left} N: Pip = ${left} − ${v.s} = <b>${pip} N</b>`,
      };
    },
  },
  {
    id: 'u4.fbd-resultant', concepts: [C.force], tier: 'scientist',
    generate(r) {
      const G = r.int(15, 30) * 10;
      const R = r.int(6, 20) * 10;
      const L = r.pick([3, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 18].filter((x) => x * 10 !== R)) * 10;
      const res = R - L;
      const svg = fbdSVG({ right: [{ value: R, label: 'Pip pushes' }], left: [{ value: L, label: 'Alex pulls' }], up: { value: G, label: 'floor' }, down: { value: G, label: 'gravity' } });
      return {
        type: 'numeric', signed: true,
        prompt: `This <b>free-body diagram</b> shows every force on a crate. What is the resultant force on it?${SIGN_NOTE}${svg}`,
        answer: res, unit: 'N',
        hints: ['Look at the up and down arrows first. Do they cancel?', 'Then compare the right and left arrows: resultant = right − left.'],
        errors: [
          { value: R + L, msg: 'Those two arrows point opposite ways, so they partly cancel — subtract.' },
          { value: -res, msg: 'Right size, wrong direction — which arrow is bigger?' },
        ],
        solution: `Up ${G} N and down ${G} N cancel. Along the floor: ${R} − ${L} = <b>${fmtSigned(res)} N</b> (${Math.abs(res)} N to the ${dirWord(res)}).`,
      };
    },
  },
  {
    id: 'u4.fbd-balanced-mcq', concepts: [C.force, C.n1], tier: 'explorer',
    generate(r) {
      const a = r.int(3, 8) * 10, b = r.int(3, 8) * 10;
      const other = (x) => r.pick([x - 20, x + 20, x + 30, x - 10].filter((y) => y > 0));
      const sets = [
        [{ right: [{ value: a }], left: [{ value: a }], up: { value: b }, down: { value: b } }],
        [{ right: [{ value: a }], left: [{ value: other(a) }], up: { value: b }, down: { value: b } }],
        [{ right: [{ value: a }], left: [{ value: a }], up: { value: other(b) }, down: { value: b } }],
        [{ right: [{ value: a + 10 }], left: [], up: { value: b }, down: { value: b } }],
      ];
      const scaleMax = Math.max(...sets.flatMap(([f]) => [...f.right, ...f.left, f.up, f.down].filter(Boolean).map((x) => x.value)));
      const choices = sets.map(([f]) => fbdSVG(f, { small: true, scaleMax }));
      return {
        type: 'mcq', grid: true,
        prompt: 'Which crate has <b>balanced</b> forces (resultant force = 0)? All forces are in newtons.',
        choices, answer: 0,
        explain: 'Balanced means every arrow is cancelled by an equal arrow pointing the opposite way: left = right <b>and</b> up = down.',
      };
    },
  },

  // ---------- Lesson 2: Newton's 1st law ----------
  {
    id: 'u4.n1-glide-mcq', concepts: [C.n1], tier: 'explorer',
    generate(r) {
      const s = r.pick([
        { who: 'A hockey puck', how: 'slides across perfectly smooth, frictionless ice', v: `${r.pick([3, 4, 5, 6])} m/s` },
        { who: 'A space probe', how: 'drifts through deep space, far from any planet, with its engines off', v: `${r.pick([12, 15, 17])} km/s` },
        { who: 'Pip in his space suit', how: 'glides through deep space with his jetpack turned off', v: `${r.pick([2, 3, 4])} m/s` },
      ]);
      return {
        type: 'mcq',
        prompt: `${s.who} ${s.how} at <b>${s.v}</b>. No force pushes or pulls it along its path. What happens next?`,
        choices: [`It keeps going at ${s.v} in a straight line`, 'It slowly slows down and stops', 'It speeds up', 'It stops straight away'],
        answer: 0,
        explain: 'No resultant force means no change in motion — Newton\'s 1st law. On Earth things only slow down because friction and air push against them.',
      };
    },
  },
  {
    id: 'u4.balanced-which-mcq', concepts: [C.n1], tier: 'explorer',
    generate(r) {
      const right = r.pick([
        'A car cruising at a steady 20 m/s on a straight, flat road',
        'A skydiver falling at a steady speed with an open parachute',
        'A minecart rolling at a steady 4 m/s along a straight track',
        'A book lying still on a table',
      ]);
      const wrong = r.shuffle([
        'A car speeding up as the traffic lights turn green',
        'A football slowing down as it rolls across grass',
        'A rocket blasting off its launch pad',
        'A bike braking at a junction',
        'A sled speeding up as the dogs start to pull',
      ]).slice(0, 3);
      return {
        type: 'mcq',
        prompt: 'Which one has <b>balanced forces</b> acting on it?',
        choices: [right, ...wrong], answer: 0,
        explain: 'Balanced forces mean <b>no change</b> in motion: standing still <b>or</b> moving at a steady speed in a straight line. All the others are speeding up or slowing down, so their forces are unbalanced.',
      };
    },
  },
  {
    id: 'u4.n1-state-mcq', concepts: [C.n1, C.force], tier: 'scientist',
    generate(r) {
      const s = r.pick([
        { what: 'A dog sled glides across the snow at', v: 3, fwd: 'The dogs pull it forwards with', back: 'friction pulls back with', lo: 20, hi: 50 },
        { what: 'A car drives along a straight road at', v: 20, fwd: 'The engine\'s driving force is', back: 'air resistance and friction add up to', lo: 40, hi: 90 },
        { what: 'A motorboat moves across a lake at', v: 5, fwd: 'The motor pushes it forwards with', back: 'the water drags it back with', lo: 10, hi: 40 },
      ]);
      const B = r.int(s.lo, s.hi) * 10;
      const kind = r.pick(['same', 'same', 'more', 'less']);
      const F = kind === 'same' ? B : kind === 'more' ? B + r.int(2, 5) * 10 : B - r.int(2, 5) * 10;
      const answer = { same: 0, more: 1, less: 2 }[kind];
      const explain = {
        same: `${F} N forwards and ${B} N backwards are <b>balanced</b> (resultant 0), so its motion doesn't change: it keeps going at a steady ${s.v} m/s. Nothing needs to "keep it going"!`,
        more: `Resultant = ${F} − ${B} = ${F - B} N <b>forwards</b>, so it speeds up.`,
        less: `Resultant = ${B} − ${F} = ${B - F} N <b>backwards</b>, so it slows down. It doesn't stop at once — the backward force takes a while to remove its speed.`,
      }[kind];
      return {
        type: 'mcq', keepOrder: true,
        prompt: `${s.what} <b>${s.v} m/s</b>. ${s.fwd} <b>${F} N</b>, and ${s.back} <b>${B} N</b>. What happens to its motion?`,
        choices: [`It keeps moving at a steady ${s.v} m/s`, 'It speeds up', 'It slows down', 'It stops straight away'],
        answer, explain,
      };
    },
  },
  {
    id: 'u4.n1-steady-force', concepts: [C.n1], tier: 'scientist',
    generate(r) {
      const s = r.pick([
        { text: (D) => `A car cruises at a steady <b>25 m/s</b> along a straight, flat road. Its engine's driving force is <b>${D} N</b>. How big is the total backward force (air resistance + friction)?`, D: r.int(8, 18) * 50, v: 25 },
        { text: (D) => `Pip cycles at a steady <b>6 m/s</b> along a flat, straight path, pushing his bike forwards with <b>${D} N</b>. How big is the total backward force on him and his bike (mostly air resistance)?`, D: r.int(3, 8) * 5, v: 6 },
        { text: (D) => `A boat moves at a steady <b>8 m/s</b> in a straight line. Its motor pushes it forwards with <b>${D} N</b>. How big is the water's backward drag force?`, D: r.int(4, 12) * 50, v: 8 },
      ]);
      return {
        type: 'numeric',
        prompt: s.text(s.D),
        answer: s.D, unit: 'N',
        hints: ['Is it speeding up, slowing down, or neither?', 'Steady speed in a straight line means the forces are balanced.'],
        errors: [
          { value: 0, msg: 'Moving at a steady speed doesn\'t mean there are no forces — it means the forces are balanced.' },
          { value: s.v, msg: 'That\'s the speed. The question asks for a force, in newtons.' },
        ],
        solution: `Steady speed in a straight line → balanced forces, so the backward force equals the forward force: <b>${s.D} N</b>.`,
      };
    },
  },
  {
    id: 'u4.n1-steady-two', concepts: [C.n1, C.force], tier: 'scientist',
    generate(r) {
      const v = until(r, (rr) => rr.pick([
        { who: 'car', speed: 25, A: rr.int(10, 14) * 50, F: rr.int(4, 8) * 50, find: rr.pick(['friction', 'engine']) },
        { who: 'bike', speed: 6, A: rr.int(3, 6) * 5, F: rr.int(1, 3) * 5, find: rr.pick(['friction', 'engine']) },
        { who: 'boat', speed: 8, A: rr.int(6, 12) * 50, F: rr.int(1, 4) * 50, find: rr.pick(['friction', 'engine']) },
      ]), (x) => x.A !== x.F);
      const D = v.A + v.F;
      const thing = {
        car: { fwd: 'Its engine\'s driving force', q: 'the engine\'s driving force', back1: 'air resistance', back2: 'rolling friction from the tyres', start: `A car cruises at a steady <b>${v.speed} m/s</b> along a straight, flat road.` },
        bike: { fwd: 'Pip\'s pedalling force', q: 'Pip\'s pedalling force', back1: 'air resistance', back2: 'friction in the wheels', start: `Pip cycles at a steady <b>${v.speed} m/s</b> along a straight, flat path.` },
        boat: { fwd: 'The motor\'s push', q: 'the motor\'s push', back1: 'water drag', back2: 'air resistance on the sail', start: `A boat moves in a straight line at a steady <b>${v.speed} m/s</b>.` },
      }[v.who];
      const findFric = v.find === 'friction';
      const prompt = findFric
        ? `${thing.start} ${thing.fwd} is <b>${D} N</b> and ${thing.back1} pushes back with <b>${v.A} N</b>. The only other backward force is ${thing.back2}. How big is it?`
        : `${thing.start} Two forces push back on it: ${thing.back1}, <b>${v.A} N</b>, and ${thing.back2}, <b>${v.F} N</b>. How big is ${thing.q}?`;
      const answer = findFric ? v.F : D;
      const errors = findFric
        ? [{ value: D, msg: 'Steady speed means balanced — but the forward force is shared by TWO backward forces.' }, { value: D + v.A, msg: 'Air resistance points backwards too, so the friction is what is LEFT of the forward force.' }, { value: 0, msg: 'Steady speed doesn\'t mean no forces — it means the forces are balanced.' }]
        : [{ value: v.A, msg: 'There are TWO backward forces. The forward force must balance both.' }, { value: Math.abs(v.A - v.F), msg: 'Both backward forces point the same way, so they add up.' }, { value: 0, msg: 'Steady speed doesn\'t mean no forces — it means the forces are balanced.' }];
      return {
        type: 'numeric', prompt, answer, unit: 'N',
        hints: ['Is it speeding up, slowing down, or neither? What does that tell you about the forces?', 'Balanced: total forwards = total backwards.'],
        errors: errors.filter((e) => Math.abs(e.value - answer) > 1e-9),
        solution: findFric
          ? `Steady speed → balanced: ${D} = ${v.A} + friction, so friction = ${D} − ${v.A} = <b>${v.F} N</b>`
          : `Steady speed → balanced: forward force = ${v.A} + ${v.F} = <b>${D} N</b>`,
      };
    },
  },
  {
    id: 'u4.inertia-mcq', concepts: [C.n1], tier: 'explorer',
    generate(r) {
      const s = r.pick([
        { q: 'You are standing in a bus when it <b>brakes suddenly</b>. Why do you lurch forwards?', right: 'Your body keeps moving forwards (inertia) while the bus slows down', wrong: ['A forward force pushes you towards the front', 'The bus pushes you forwards', 'Gravity pulls you forwards'] },
        { q: 'Pip\'s minecart crashes into a block and stops. Pip <b>flies forwards</b> out of it. Why?', right: 'Pip keeps moving (inertia): the block stopped the cart, not Pip', wrong: ['The block pushed Pip forwards', 'The cart threw him forwards with a big force', 'Gravity pulled him forwards'] },
        { q: 'A magician whips a tablecloth away <b>very fast</b> and the plates stay on the table. Why?', right: 'The plates have inertia: the quick tug is too short to get them moving', wrong: ['Gravity glues the plates to the cloth', 'The table pulls the plates down harder', 'The air holds the plates in place'] },
        { q: 'Why must you <b>wear a seatbelt</b> in a car?', right: 'If the car stops suddenly, your body keeps moving — the belt gives the force that stops you', wrong: ['It stops the car from moving', 'It makes the car brake faster', 'It pushes you forwards in a crash'] },
      ]);
      return {
        type: 'mcq', prompt: s.q, choices: [s.right, ...s.wrong], answer: 0,
        explain: '<b>Inertia</b>: everything keeps doing what it is doing — staying still, or moving at a steady speed — until a force changes it.',
      };
    },
  },
  {
    id: 'u4.n1-space-speed', concepts: [C.n1], tier: 'explorer',
    generate(r) {
      const S = r.pick([11, 15, 17, 20]), yrs = r.pick([5, 10, 20]);
      return {
        type: 'numeric',
        prompt: `A space probe glides through deep space at <b>${S} km/s</b> with its engines switched off. It is so far from any star or planet that no forces act on it. How fast will it be going in <b>${yrs} years</b>' time?`,
        answer: S, unit: 'km/s',
        hints: ['Is anything pushing or pulling on the probe?', 'Newton\'s 1st law: what happens to motion when there is no force?'],
        errors: [
          { value: 0, msg: 'Nothing pushes back on it, so nothing slows it down. Things only "run out of speed" when a force (like friction) acts.' },
          { value: S * yrs, msg: 'Speed doesn\'t pile up over time — with no force, it doesn\'t change at all.' },
        ],
        solution: `No force → no change in motion. It is still going at <b>${S} km/s</b>. (The real Voyager 1 probe has been coasting through space at about 17 km/s since 1980!)`,
      };
    },
  },

  // ---------- Lesson 3: Newton's 2nd law, F = ma ----------
  {
    id: 'u4.fma-a', concepts: [C.n2], tier: 'explorer',
    generate(r) {
      const s = r.pick([
        { who: (m) => `A <b>${fmt(m)} kg</b> car`, m: r.int(10, 20) * 100, a: r.pick([1.5, 2, 2.5, 3, 4]) },
        { who: (m) => `A <b>${m} kg</b> minecart (with Pip inside)`, m: r.pick([60, 70, 80, 100]), a: r.pick([0.5, 1.5, 2]) },
        { who: (m) => `A <b>${m} kg</b> sled`, m: r.pick([40, 60, 80, 100]), a: r.pick([0.5, 1.5, 2]) },
      ]);
      const F = s.m * s.a;
      return {
        type: 'numeric',
        prompt: `${s.who(s.m)} has a resultant force of <b>${fmt(F)} N</b> on it. What is its acceleration?`,
        answer: s.a, unit: 'm/s²',
        hints: ['Newton\'s 2nd law links force, mass and acceleration. Which one are you finding?', 'a = F ÷ m'],
        errors: [
          { value: F * s.m, msg: 'Multiplying gives a gigantic number! To find a, divide the force by the mass.' },
          { value: s.m / F, msg: 'Upside down! a = F ÷ m — force divided by mass.' },
        ],
        solution: `a = F ÷ m = ${fmt(F)} ÷ ${fmt(s.m)} = <b>${fmt(s.a)} m/s²</b>`,
      };
    },
  },
  {
    id: 'u4.fma-F', concepts: [C.n2], tier: 'explorer',
    generate(r) {
      const s = until(r, (rr) => rr.pick([
        { who: 'skater', text: (m, a) => `A <b>${m} kg</b> ice skater speeds up at <b>${fmt(a)} m/s²</b>.`, m: rr.int(6, 12) * 5, a: rr.pick([1.5, 2, 3]) },
        { who: 'horse', text: (m, a) => `A <b>${m} kg</b> horse speeds up at <b>${fmt(a)} m/s²</b>.`, m: rr.int(8, 12) * 50, a: rr.pick([2, 3, 4]) },
        { who: 'cart', text: (m, a) => `Steve pushes a <b>${m} kg</b> minecart so that it speeds up at <b>${fmt(a)} m/s²</b> (no friction).`, m: rr.int(4, 10) * 10, a: rr.pick([1.5, 2]) },
      ]), (x) => nice(x.m * x.a) && distinct(x.m * x.a, x.m / x.a, x.m + x.a));
      const F = s.m * s.a;
      return {
        type: 'numeric',
        prompt: `${s.text(s.m, s.a)} What resultant force is acting on it?`,
        answer: F, unit: 'N',
        hints: ['Which law links force, mass and acceleration?', 'F = m × a'],
        errors: [
          { value: s.m / s.a, msg: 'Force = mass × acceleration — multiply, don\'t divide.' },
          { value: s.m + s.a, msg: 'Force = mass × acceleration — multiply, don\'t add.' },
        ],
        solution: `F = m × a = ${s.m} × ${fmt(s.a)} = <b>${fmt(F)} N</b>`,
      };
    },
  },
  {
    id: 'u4.fma-m', concepts: [C.n2], tier: 'scientist',
    generate(r) {
      const s = r.pick([
        { what: 'a shopping trolley', m: r.int(2, 6) * 5, a: r.pick([1.5, 2, 3]) },
        { what: 'a motorbike (with its rider)', m: r.int(4, 6) * 50, a: r.pick([2, 3, 4, 5]) },
        { what: 'a sled (with Pip on it)', m: r.int(5, 9) * 10, a: r.pick([0.5, 1.5, 2]) },
      ]);
      const F = s.m * s.a;
      return {
        type: 'numeric',
        prompt: `A resultant force of <b>${fmt(F)} N</b> makes ${s.what} accelerate at <b>${fmt(s.a)} m/s²</b>. What is its mass?`,
        answer: s.m, unit: 'kg',
        hints: ['Start from F = m × a. Which letter do you need on its own?', 'm = F ÷ a'],
        errors: [
          { value: F * s.a, msg: 'To get m on its own from F = m × a, divide F by a.' },
          { value: s.a / F, msg: 'Upside down! m = F ÷ a.' },
        ],
        solution: `m = F ÷ a = ${fmt(F)} ÷ ${fmt(s.a)} = <b>${fmt(s.m)} kg</b>`,
      };
    },
  },
  {
    id: 'u4.fma-resultant', concepts: [C.n2, C.force], tier: 'scientist',
    generate(r) {
      const { s, a } = until(r, (rr) => ({
        s: rr.pick([
          { text: (m, P, B) => `Steve pushes a <b>${m} kg</b> minecart forwards with <b>${P} N</b>, but a strong wind pushes back on it with <b>${B} N</b>.`, m: rr.pick([20, 40, 50]), B: rr.int(2, 6) * 10, aMax: 2 },
          { text: (m, P, B) => `A <b>${m} kg</b> motorboat's engine pushes it forwards with <b>${P} N</b>, while the water drags it back with <b>${B} N</b>.`, m: rr.pick([200, 400, 500]), B: rr.int(2, 8) * 50, aMax: 3 },
          { text: (m, P, B) => `Pip pulls a <b>${m} kg</b> sled forwards with <b>${P} N</b>. Alex grabs the back and pulls it backwards with <b>${B} N</b>.`, m: rr.pick([10, 20, 25, 40]), B: rr.int(3, 6) * 10, aMax: 3 },
        ]),
        a: rr.pick([0.5, 1, 1.5, 2, 3]),
      }), (x) => x.a <= x.s.aMax && nice((x.s.B + x.s.m * x.a) / x.s.m) && nice((2 * x.s.B + x.s.m * x.a) / x.s.m));
      const P = s.B + s.m * a;
      return {
        type: 'numeric',
        prompt: `${s.text(s.m, P, s.B)} What is its acceleration?`,
        answer: a, unit: 'm/s²',
        hints: ['First: what is the resultant force?', 'Then use a = F ÷ m with the resultant force.'],
        errors: [
          { value: P / s.m, msg: 'Newton\'s 2nd law uses the RESULTANT force — take the backward force away first.' },
          { value: (P + s.B) / s.m, msg: 'The forces point opposite ways, so subtract them.' },
        ],
        solution: `Resultant = ${P} − ${s.B} = ${P - s.B} N. a = ${P - s.B} ÷ ${s.m} = <b>${fmt(a)} m/s²</b>`,
      };
    },
  },
  {
    id: 'u4.fma-change-mcq', concepts: [C.n2], tier: 'scientist',
    generate(r) {
      const a = r.pick([4, 8, 12]);
      const c = r.pick([
        { txt: 'the mass is <b>doubled</b> (same push)', k: 0.5, why: 'Twice the mass with the same force → half the acceleration.' },
        { txt: 'the push is <b>doubled</b> (same mass)', k: 2, why: 'Twice the force on the same mass → twice the acceleration.' },
        { txt: 'the mass is <b>halved</b> (same push)', k: 2, why: 'Half the mass with the same force → twice the acceleration.' },
        { txt: 'the push is <b>halved</b> (same mass)', k: 0.5, why: 'Half the force on the same mass → half the acceleration.' },
        { txt: '<b>both</b> the push and the mass are doubled', k: 1, why: 'Twice the force shared by twice the mass → the same acceleration.' },
      ]);
      const vals = c.k === 1 ? [a, 2 * a, a / 2, 4 * a] : c.k === 2 ? [2 * a, a / 2, a, 4 * a] : [a / 2, 2 * a, a, a / 4];
      return {
        type: 'mcq',
        prompt: `A push gives a cart an acceleration of <b>${a} m/s²</b>. What will its acceleration be if ${c.txt}?`,
        choices: vals.map((v) => `${fmt(v)} m/s²`), answer: 0,
        explain: `a = F ÷ m. ${c.why}`,
      };
    },
  },
  {
    id: 'u4.fma-loaded', concepts: [C.n2], tier: 'scientist',
    generate(r) {
      const v = until(r, (rr) => ({ mc: rr.pick([20, 25, 40, 50]), mp: 40, a: rr.pick([0.5, 1, 1.5, 2]) }), (x) => x.mc !== x.mp && Number.isInteger((x.mc + x.mp) * x.a) && nice(((x.mc + x.mp) * x.a) / x.mc) && nice(((x.mc + x.mp) * x.a) / x.mp));
      const M = v.mc + v.mp, F = M * v.a;
      return {
        type: 'numeric',
        prompt: `Pip (<b>${v.mp} kg</b>) sits in a minecart (<b>${v.mc} kg</b>). Steve pushes them along a smooth track with a resultant force of <b>${F} N</b>. What is their acceleration?`,
        answer: v.a, unit: 'm/s²',
        hints: ['Pip and the cart speed up together. What mass is being pushed?', 'Add the masses, then use a = F ÷ m.'],
        errors: [
          { value: F / v.mc, msg: 'Pip moves too! Use the total mass of Pip and the cart.' },
          { value: F / v.mp, msg: 'The cart moves too! Use the total mass of Pip and the cart.' },
        ],
        solution: `Total mass = ${v.mp} + ${v.mc} = ${M} kg. a = ${F} ÷ ${M} = <b>${fmt(v.a)} m/s²</b>`,
      };
    },
  },
  {
    id: 'u4.fma-ratio', concepts: [C.n2], tier: 'engineer',
    generate(r) {
      const v = until(r, (rr) => ({ m1: rr.pick([10, 20, 30, 40, 60]), a1: rr.pick([2, 3, 4, 6]), m2: rr.pick([10, 15, 20, 30, 40, 60, 80]) }), (x) => {
        const F = x.m1 * x.a1, a2 = F / x.m2;
        return x.m1 !== x.m2 && nice(a2) && a2 <= 12 && a2 >= 0.5 && distinct(a2, x.a1, (x.a1 * x.m2) / x.m1, F);
      });
      const F = v.m1 * v.a1, a2 = F / v.m2;
      return {
        type: 'numeric',
        prompt: `A push gives a <b>${v.m1} kg</b> cart an acceleration of <b>${v.a1} m/s²</b>. Exactly the same push is then used on a <b>${v.m2} kg</b> cart. What is its acceleration? (No friction.)`,
        answer: a2, unit: 'm/s²',
        hints: ['How big is the push? Use the first cart.', 'Same push, new mass: a = F ÷ m.'],
        errors: [
          { value: v.a1, msg: 'Same push but a different mass, so the acceleration changes.' },
          { value: (v.a1 * v.m2) / v.m1, msg: 'Backwards! A heavier cart gets a SMALLER acceleration from the same push.' },
          { value: F, msg: 'That\'s the push in newtons. Now divide by the second cart\'s mass.' },
        ],
        solution: `Push: F = ${v.m1} × ${v.a1} = ${F} N. New cart: a = ${F} ÷ ${v.m2} = <b>${fmt(a2)} m/s²</b>`,
      };
    },
  },

  // ---------- Lesson 4: friction ----------
  {
    id: 'u4.fric-dir-mcq', concepts: [C.fric], tier: 'explorer',
    generate(r) {
      const dir = r.pick(['right', 'left']), opp = dir === 'right' ? 'left' : 'right';
      const what = r.pick([`A sled slides to the <b>${dir}</b> across the snow.`, `Pip pushes a crate to the <b>${dir}</b> across the floor.`, `A hockey puck slides to the <b>${dir}</b> across the ice.`]);
      return {
        type: 'mcq',
        prompt: `${what} Which way does <b>friction</b> push on it?`,
        choices: [`To the ${opp} — against the motion`, `To the ${dir} — with the motion`, 'Straight up', 'Nowhere — there is no friction while it moves'],
        answer: 0,
        explain: `Friction always acts <b>against</b> the sliding motion. It's moving ${dir}, so friction pushes ${opp}.`,
      };
    },
  },
  {
    id: 'u4.fric-concept-mcq', concepts: [C.fric], tier: 'explorer',
    generate(r) {
      const s = r.pick([
        { q: 'Why is it so hard to stop when you run onto ice?', right: 'Ice gives very little friction, so hardly any force slows you down', wrong: ['Ice pushes you forwards', 'Your inertia is bigger on ice', 'Ice is slippery because it is cold, not because of forces'] },
        { q: 'How do a bike\'s brakes slow it down?', right: 'Brake pads rub on the wheel, and friction pushes against the motion', wrong: ['They make the bike lighter', 'They switch off the bike\'s inertia', 'They push the road backwards'] },
        { q: 'Why do football boots have studs?', right: 'More grip (friction), so your feet don\'t slip when you push off', wrong: ['To make you heavier', 'To make friction smaller so you run faster', 'To stop air resistance'] },
        { q: 'A ball rolling across grass slows down and stops. Why?', right: 'Friction and air resistance push against its motion', wrong: ['Its force runs out', 'Things always stop by themselves', 'Gravity pulls it backwards along the grass'] },
      ]);
      return {
        type: 'mcq', prompt: s.q, choices: [s.right, ...s.wrong], answer: 0,
        explain: 'Friction is a force between surfaces that acts <b>against</b> sliding. Rough surfaces give lots of grip; smooth ones like ice give very little.',
      };
    },
  },
  {
    id: 'u4.fric-resultant', concepts: [C.fric, C.force], tier: 'explorer',
    generate(r) {
      const P = r.int(6, 20) * 10;
      const f = r.int(2, P / 10 - 2) * 10;
      const where = r.pick(['across a wooden floor', 'across a carpet', 'over the grass', 'along a stone path']);
      return {
        type: 'numeric',
        prompt: `Pip pushes a crate ${where} with a force of <b>${P} N</b>. Friction pushes back on the crate with <b>${f} N</b>. What is the resultant force on the crate?`,
        answer: P - f, unit: 'N',
        hints: ['Which way does friction push compared with Pip?', 'Opposite directions: resultant = push − friction.'],
        errors: [
          { value: P + f, msg: 'Friction pushes against Pip, so it takes force away — subtract.' },
          { value: P, msg: 'Friction pushes back, so the resultant is less than Pip\'s push.' },
        ],
        solution: `Resultant = ${P} − ${f} = <b>${P - f} N</b> forwards`,
      };
    },
  },
  {
    id: 'u4.fric-accel', concepts: [C.fric, C.n2], tier: 'scientist',
    generate(r) {
      const v = until(r, (rr) => {
        const s = rr.pick([['ice', [5, 10]], ['a wooden floor', [30, 40, 50]], ['carpet', [60, 80, 100]]]);
        return { surf: s[0], f: rr.pick(s[1]), m: rr.pick([10, 20, 25, 40, 50]), a: rr.pick([0.5, 1, 1.5, 2, 3]) };
      }, (x) => Number.isInteger(x.f + x.m * x.a) && x.f + x.m * x.a <= 250 && nice((x.f + x.m * x.a) / x.m) && nice((2 * x.f + x.m * x.a) / x.m));
      const P = v.f + v.m * v.a;
      return {
        type: 'numeric',
        prompt: `Pip pushes a <b>${v.m} kg</b> crate across ${v.surf} with <b>${P} N</b>. Friction is <b>${v.f} N</b>. What is the crate's acceleration?`,
        answer: v.a, unit: 'm/s²',
        hints: ['Friction pushes against Pip. What is the resultant force?', 'a = resultant force ÷ mass'],
        errors: [
          { value: P / v.m, msg: 'You forgot friction! Use the resultant force: push − friction.' },
          { value: (P + v.f) / v.m, msg: 'Friction pushes against Pip — subtract it, don\'t add it.' },
        ],
        solution: `Resultant = ${P} − ${v.f} = ${P - v.f} N. a = ${P - v.f} ÷ ${v.m} = <b>${fmt(v.a)} m/s²</b>`,
      };
    },
  },
  {
    id: 'u4.fric-push', concepts: [C.fric, C.n2], tier: 'engineer',
    generate(r) {
      const v = until(r, (rr) => {
        const s = rr.pick([
          { what: 'trolley', m: rr.pick([2, 4, 5]), f: rr.int(2, 8) },
          { what: 'crate', m: rr.pick([10, 20, 25]), f: rr.int(2, 6) * 10 },
          { what: 'wheelbarrow', m: rr.pick([30, 40]), f: rr.int(2, 5) * 10 },
        ]);
        return { ...s, a: rr.pick([0.5, 1, 1.5, 2, 3]) };
      }, (x) => Number.isInteger(x.m * x.a) && x.m * x.a !== x.f);
      const ma = v.m * v.a, P = ma + v.f;
      return {
        type: 'numeric',
        prompt: `A <b>${v.m} kg</b> ${v.what} speeds up at <b>${fmt(v.a)} m/s²</b> while you push it. Friction on it is <b>${v.f} N</b>. How hard are you pushing?`,
        answer: P, unit: 'N',
        hints: ['What resultant force does it need for that acceleration?', 'Your push has to give that resultant AND beat friction.'],
        errors: [
          { value: ma, msg: 'That\'s the resultant force. Your push must also beat friction.' },
          ...(ma - v.f > 0 ? [{ value: ma - v.f, msg: 'Friction works against you, so you must push MORE, not less.' }] : []),
        ],
        solution: `Resultant needed: F = ${v.m} × ${fmt(v.a)} = ${fmt(ma)} N. Push = ${fmt(ma)} + ${v.f} (friction) = <b>${fmt(P)} N</b>`,
      };
    },
  },
  {
    id: 'u4.fric-decel', concepts: [C.fric, C.n2], tier: 'scientist',
    generate(r) {
      const m = r.pick([20, 30, 40, 50, 60, 80]), a = r.pick([0.5, 1.5, 2, 2.5]);
      const f = m * a;
      const s = r.pick([
        `A <b>${m} kg</b> sled (with its rider) slides across flat snow. The only force along the snow is friction: <b>${fmt(f)} N</b> backwards.`,
        `Pip gives a <b>${m} kg</b> crate a shove and lets go. As it slides across the floor, friction pushes back on it with <b>${fmt(f)} N</b>.`,
      ]);
      return {
        type: 'numeric',
        prompt: `${s} What is its deceleration (how fast it loses speed)?`,
        answer: a, unit: 'm/s²',
        hints: ['Once nobody pushes, what is the resultant force?', 'a = F ÷ m'],
        errors: [
          { value: f * m, msg: 'Divide the force by the mass: a = F ÷ m.' },
          { value: m / f, msg: 'Upside down! a = F ÷ m.' },
        ],
        solution: `Friction is the only force: a = ${fmt(f)} ÷ ${m} = <b>${fmt(a)} m/s²</b> (it loses ${fmt(a)} m/s of speed every second).`,
      };
    },
  },
  {
    id: 'u4.fric-stuck', concepts: [C.fric, C.n1], tier: 'scientist',
    generate(r) {
      const v = until(r, (rr) => {
        const max = rr.int(5, 15) * 20;
        return { max, P: rr.int(4, max / 10 - 2) * 10 };
      }, (x) => x.P * 2 !== x.max);
      return {
        type: 'numeric',
        prompt: `A heavy chest sits on a carpet. Friction can push back on it with <b>up to ${v.max} N</b>. Pip pushes the chest with <b>${v.P} N</b> — and it <b>doesn't move</b>. How big is the friction force on the chest right now?`,
        answer: v.P, unit: 'N',
        hints: ['The chest stays still. What does that tell you about the forces on it?', 'Balanced: friction pushes back exactly as hard as needed.'],
        errors: [
          { value: v.max, msg: 'That\'s the MOST friction can give. Friction only pushes back as hard as it needs to.' },
          { value: 0, msg: 'If there were no friction, Pip\'s push would make the chest move!' },
          { value: v.max - v.P, msg: 'Friction isn\'t "what\'s left over". The chest is still, so friction exactly balances the push.' },
        ],
        solution: `The chest stays still, so the forces are balanced: friction = Pip's push = <b>${v.P} N</b>. (Push harder than ${v.max} N and it would start to slide.)`,
      };
    },
  },
  {
    id: 'u4.fric-stop-time', concepts: [C.fric, C.n2], tier: 'scientist',
    generate(r) {
      const v = until(r, (rr) => ({ m: rr.pick([20, 30, 40, 50]), a: rr.pick([0.5, 1, 2, 2.5]), u: rr.int(2, 8) }), (x) => {
        const t = x.u / x.a;
        return nice(t) && t <= 16 && distinct(t, x.a, x.u * x.a, x.m * x.a);
      });
      const f = v.m * v.a, t = v.u / v.a;
      return {
        type: 'numeric',
        prompt: `A <b>${v.m} kg</b> sled slides across the snow at <b>${v.u} m/s</b>. The only force along the snow is friction, <b>${fmt(f)} N</b> backwards. How long does it take to stop?`,
        answer: t, unit: 's',
        hints: ['How much speed does it lose every second? (a = F ÷ m)', `How many seconds to lose all ${v.u} m/s at that rate?`],
        errors: [
          { value: v.a, msg: 'That\'s the deceleration. Now: how long to lose all its speed?' },
          { value: v.u * v.a, msg: 'Divide the speed by the deceleration: time = speed ÷ deceleration.' },
        ],
        solution: `a = ${fmt(f)} ÷ ${v.m} = ${fmt(v.a)} m/s². Time = ${v.u} ÷ ${fmt(v.a)} = <b>${fmt(t)} s</b>`,
      };
    },
  },

  // ---------- Lesson 5: Newton's 3rd law ----------
  {
    id: 'u4.n3-pair-mcq', concepts: [C.n3], tier: 'explorer',
    generate(r) {
      const F = r.int(4, 12) * 10;
      const s = r.pick([
        { act: 'A rocket engine pushes hot gas <b>downwards</b>.', right: 'The gas pushes the rocket upwards', wrong: ['Gravity pulls the rocket downwards', 'The ground pushes the gas upwards', 'The air pushes the rocket downwards'] },
        { act: 'A swimmer\'s hands push the water <b>backwards</b>.', right: 'The water pushes the swimmer forwards', wrong: ['The water pushes the swimmer backwards', 'The swimmer\'s legs push the water down', 'Gravity pulls the swimmer down'] },
        { act: 'When you walk, your foot pushes the ground <b>backwards</b>.', right: 'The ground pushes your foot forwards', wrong: ['The ground pushes your foot backwards', 'Your other foot pushes the ground forwards', 'Your leg muscles pull you forwards'] },
        { act: `On a skateboard, Pip pushes a wall <b>to the right</b> with ${F} N.`, right: `The wall pushes Pip to the left with ${F} N`, wrong: [`The wall pushes Pip to the left with less than ${F} N`, 'The wall doesn\'t push — walls can\'t push', `The wall pushes Pip to the right with ${F} N`] },
      ]);
      return {
        type: 'mcq',
        prompt: `Action: ${s.act} What is the <b>reaction</b> force?`,
        choices: [s.right, ...s.wrong], answer: 0,
        explain: 'If A pushes B, then B pushes A back: the <b>same size</b>, the <b>opposite direction</b>, on the <b>other</b> object.',
      };
    },
  },
  {
    id: 'u4.n3-cancel-mcq', concepts: [C.n3], tier: 'scientist',
    generate(r) {
      const s = r.pick([
        'A horse pulls a cart. The cart pulls back on the horse just as hard.',
        'Pip pulls a sled with a rope. The sled pulls back on Pip just as hard.',
        'A tugboat pulls a ship. The ship pulls back on the tugboat just as hard.',
      ]);
      return {
        type: 'mcq',
        prompt: `${s} So why don't the two forces cancel out?`,
        choices: [
          'They act on different objects, so they can\'t cancel each other',
          'The puller pulls a little harder than the other pulls back',
          'They do cancel — it only moves because of inertia',
          'The pull back only starts once things are moving',
        ],
        answer: 0,
        explain: 'Forces only cancel when they act on the <b>same</b> object. An action–reaction pair acts on <b>two different</b> objects. (What decides whether the horse moves is the forces on the horse — like the ground pushing its hooves forwards.)',
      };
    },
  },
  {
    id: 'u4.n3-vs-balanced-mcq', concepts: [C.n3, C.n1], tier: 'scientist',
    generate(r) {
      const s = r.pick([
        { obj: 'A book rests on a table', down: 'Gravity pulls the book down', up: 'the table pushes it up', F: r.pick([5, 8, 10]), pair: 'the Earth pulls the book down ↔ the book pulls the Earth up' },
        { obj: 'A lamp hangs still from a cord', down: 'Gravity pulls the lamp down', up: 'the cord pulls it up', F: r.pick([10, 20, 30]), pair: 'the cord pulls the lamp up ↔ the lamp pulls the cord down' },
        { obj: 'Pip stands still on the floor', down: 'Gravity pulls Pip down', up: 'the floor pushes him up', F: 400, pair: 'the floor pushes Pip up ↔ Pip pushes the floor down' },
        { obj: 'A crate sits on a shelf', down: 'Gravity pulls the crate down', up: 'the shelf pushes it up', F: r.pick([50, 80, 120]), pair: 'the shelf pushes the crate up ↔ the crate pushes the shelf down' },
      ]);
      return {
        type: 'mcq',
        prompt: `${s.obj}. ${s.down} with <b>${s.F} N</b>, and ${s.up} with <b>${s.F} N</b>. Are these two forces a Newton's 3rd-law pair?`,
        choices: [
          'No — both act on the same object, so they are balanced forces, not a pair',
          'Yes — they are equal and opposite',
          'Yes — they cancel each other out',
          'No — a 3rd-law pair must point the same way',
        ],
        answer: 0,
        explain: `A 3rd-law pair acts on <b>two different</b> objects. Both of these act on the same thing, so they are simply <b>balanced</b> (Newton's 1st law). A real pair: ${s.pair}.`,
      };
    },
  },
  {
    id: 'u4.n3-force', concepts: [C.n3], tier: 'explorer',
    generate(r) {
      const m1 = 40, m2 = r.pick([60, 70, 80, 90]); // Pip is always 40 kg; his dad varies
      const F = r.int(3, 10) * 20;
      return {
        type: 'numeric',
        prompt: `Pip (<b>${m1} kg</b>) and his dad (<b>${m2} kg</b>) stand facing each other on ice skates. Pip pushes his dad with <b>${F} N</b>. How big is the force that pushes back on <b>Pip</b>?`,
        answer: F, unit: 'N',
        hints: ['Pip pushes his dad. What does his dad\'s body do to Pip at the same moment?', 'Newton\'s 3rd law: forces come in pairs.'],
        errors: [
          { value: (F * m1) / m2, msg: 'The masses don\'t change the force pair: the push back is just as big.' },
          { value: (F * m2) / m1, msg: 'The masses don\'t change the force pair: the push back is just as big.' },
          { value: 0, msg: 'His dad doesn\'t have to push on purpose — every push comes with a push back!' },
        ],
        solution: `Action–reaction pairs are equal and opposite: Pip is pushed back with <b>${F} N</b>. (Because Pip is lighter, the same force gives him a bigger acceleration.)`,
      };
    },
  },
  {
    id: 'u4.n3-which-mcq', concepts: [C.n3, C.n2], tier: 'scientist',
    generate(r) {
      const m1 = 40, m2 = r.pick([70, 80, 90]);
      return {
        type: 'mcq',
        prompt: `Pip (<b>${m1} kg</b>) and Steve (<b>${m2} kg</b>) stand still on ice skates, then push each other apart. Which is true?`,
        choices: [
          'They feel the same force, but Pip speeds up more',
          'Steve pushes harder, so Pip moves off faster',
          'Pip pushes harder because he is lighter',
          'They feel the same force, so they move off at the same speed',
        ],
        answer: 0,
        explain: `Newton's 3rd law: the forces are equal and opposite. Newton's 2nd law: a = F ÷ m, so the lighter skater (Pip, ${m1} kg) gets the bigger acceleration.`,
      };
    },
  },
  {
    id: 'u4.n3-skaters', concepts: [C.n3, C.n2], tier: 'scientist',
    generate(r) {
      const v = until(r, (rr) => ({ m1: 40, m2: rr.pick([60, 64, 80, 90]), F: rr.int(3, 12) * 20, light: rr.chance(0.5) }), (x) => {
        const a = x.F / (x.light ? x.m1 : x.m2), b = x.F / (x.light ? x.m2 : x.m1);
        return nice(a) && nice(b) && a <= 6 && distinct(a, b, x.F / (x.m1 + x.m2), x.F);
      });
      const mAsk = v.light ? v.m1 : v.m2, mOther = v.light ? v.m2 : v.m1;
      const who = v.light ? 'Pip' : 'Steve';
      const a = v.F / mAsk;
      return {
        type: 'numeric',
        prompt: `Two ice skaters stand still, then push each other apart. Pip is <b>${v.m1} kg</b> and Steve is <b>${v.m2} kg</b>. Pip pushes Steve with <b>${v.F} N</b>. What is <b>${who}'s</b> acceleration while they push?`,
        answer: a, unit: 'm/s²',
        hints: [`How big is the force on ${who}? (Newton's 3rd law)`, `Then a = F ÷ m, using ${who}'s mass.`],
        errors: [
          { value: v.F / mOther, msg: `That's the other skater's acceleration. Use ${who}'s mass.` },
          { value: v.F / (v.m1 + v.m2), msg: 'They aren\'t moving together — each skater gets the force on their own.' },
        ],
        solution: `The force on ${who} is also ${v.F} N (Newton's 3rd law). a = ${v.F} ÷ ${mAsk} = <b>${fmt(a)} m/s²</b>`,
      };
    },
  },
  {
    id: 'u4.n3-speed-ratio', concepts: [C.n3, C.n2], tier: 'engineer',
    generate(r) {
      const v = until(r, (rr) => ({ m1: 40, m2: rr.pick([60, 64, 80]), v1: rr.pick([1, 1.5, 2, 2.5, 3, 4]), t: rr.pick([0.5, 1]) }), (x) => {
        const v2 = (x.m1 * x.v1) / x.m2, F = (x.m1 * x.v1) / x.t;
        return x.m1 !== x.m2 && nice(v2) && nice((x.v1 * x.m2) / x.m1) && v2 <= 6 && v2 >= 0.5 && F <= 300 && distinct(v2, x.v1, (x.v1 * x.m2) / x.m1, F);
      });
      const a1 = v.v1 / v.t, F = v.m1 * a1, a2 = F / v.m2, v2 = a2 * v.t;
      return {
        type: 'numeric',
        prompt: `On ice, Pip (<b>${v.m1} kg</b>) and Alex (<b>${v.m2} kg</b>) start still and push each other apart. The push lasts <b>${fmt(v.t)} s</b>. Afterwards Pip glides away at <b>${fmt(v.v1)} m/s</b>. How fast does <b>Alex</b> glide away?`,
        answer: v2, unit: 'm/s',
        hints: ['What was Pip\'s acceleration during the push? (a = change in velocity ÷ time)', 'How big was the push on Pip — and so on Alex?', 'Now Alex\'s acceleration, then his speed after the push.'],
        errors: [
          { value: v.v1, msg: 'Same force, but different masses — they don\'t get the same speed.' },
          { value: (v.v1 * v.m2) / v.m1, msg: 'Backwards! The lighter skater gets the bigger speed.' },
          { value: F, msg: 'That\'s the push in newtons. Now find Alex\'s acceleration and speed.' },
        ],
        solution: `Pip: a = ${fmt(v.v1)} ÷ ${fmt(v.t)} = ${fmt(a1)} m/s², so the push is ${v.m1} × ${fmt(a1)} = ${fmt(F)} N. Alex feels ${fmt(F)} N too: a = ${fmt(F)} ÷ ${v.m2} = ${fmt(a2)} m/s², speed = ${fmt(a2)} × ${fmt(v.t)} = <b>${fmt(v2)} m/s</b>`,
      };
    },
  },

  // ---------- Problem Set B: word problems ----------
  {
    id: 'u4.wp-car', concepts: [C.n2, C.force], tier: 'scientist',
    generate(r) {
      const { m, a, R } = until(r, (rr) => ({ m: rr.int(10, 20) * 100, a: rr.pick([1, 1.5, 2, 2.5, 3]), R: rr.int(3, 9) * 100 }), (x) => nice(x.R / x.m));
      const D = m * a + R;
      return {
        type: 'numeric',
        prompt: `A <b>${fmt(m)} kg</b> car pulls away from traffic lights. Its engine gives a driving force of <b>${fmt(D)} N</b>, and air resistance plus friction push back with <b>${R} N</b>. What is its acceleration?`,
        answer: a, unit: 'm/s²',
        hints: ['What is the resultant force on the car?', 'a = resultant force ÷ mass'],
        errors: [
          { value: D / m, msg: 'Use the resultant force — take away the backward forces first.' },
          { value: (D + R) / m, msg: 'The backward forces push against the engine, so subtract them.' },
        ],
        solution: `Resultant = ${fmt(D)} − ${R} = ${fmt(m * a)} N. a = ${fmt(m * a)} ÷ ${fmt(m)} = <b>${fmt(a)} m/s²</b>`,
      };
    },
  },
  {
    id: 'u4.wp-rocket', concepts: [C.n2, C.force], tier: 'scientist',
    generate(r) {
      const m = r.pick([0.5, 1, 2]), W = 10 * m, a = r.pick([10, 15, 20, 25, 30]);
      const T = W + m * a;
      return {
        type: 'numeric',
        prompt: `A model rocket of mass <b>${fmt(m)} kg</b> launches straight up. Its engine pushes it up with <b>${fmt(T)} N</b>, and gravity pulls it down with <b>${fmt(W)} N</b>. What is its acceleration as it lifts off?`,
        answer: a, unit: 'm/s²',
        hints: ['Two forces, opposite directions. What is the resultant?', 'a = resultant force ÷ mass'],
        errors: [
          { value: T / m, msg: 'Gravity pulls the other way — use the resultant force (thrust − gravity).' },
          { value: (T + W) / m, msg: 'Gravity pulls DOWN while the engine pushes UP — subtract.' },
        ],
        solution: `Resultant = ${fmt(T)} − ${fmt(W)} = ${fmt(T - W)} N upwards. a = ${fmt(T - W)} ÷ ${fmt(m)} = <b>${a} m/s²</b>`,
      };
    },
  },
  {
    id: 'u4.wp-sled-dogs', concepts: [C.n2, C.fric], tier: 'scientist',
    generate(r) {
      const v = until(r, (rr) => ({ n: rr.int(4, 8), p: rr.pick([50, 60, 70, 80]), m: rr.pick([100, 120, 150, 200, 250]), a: rr.pick([0.5, 1, 1.5, 2]) }), (x) => {
        const f = x.n * x.p - x.m * x.a;
        return f >= 50 && f <= 300 && f % 10 === 0 && nice((x.n * x.p) / x.m) && distinct(x.a, (x.n * x.p) / x.m, x.m * x.a);
      });
      const total = v.n * v.p, f = total - v.m * v.a;
      return {
        type: 'numeric',
        prompt: `A team of <b>${v.n} huskies</b> pulls a sled. Each dog pulls with <b>${v.p} N</b>. The sled and its rider have a mass of <b>${v.m} kg</b>, and friction on the snow is <b>${f} N</b>. What is the sled's acceleration?`,
        answer: v.a, unit: 'm/s²',
        hints: ['How hard do all the dogs pull together?', 'Resultant = total pull − friction. Then a = F ÷ m.'],
        errors: [
          { value: total / v.m, msg: 'Don\'t forget friction: use the resultant force.' },
          { value: total - f, msg: 'That\'s the resultant force. Now divide by the mass.' },
        ],
        solution: `Dogs: ${v.n} × ${v.p} = ${total} N. Resultant = ${total} − ${f} = ${total - f} N. a = ${total - f} ÷ ${v.m} = <b>${fmt(v.a)} m/s²</b>`,
      };
    },
  },
  {
    id: 'u4.wp-stop-dist', concepts: [C.fric, C.n2], tier: 'engineer',
    generate(r) {
      const v = until(r, (rr) => rr.pick([
        { what: 'curling stone', where: 'along the ice', m: 20, f: rr.pick([2, 4, 5]), u: rr.pick([2, 3]) },
        { what: 'sled (with its rider)', where: 'across flat snow', m: rr.pick([40, 50]), f: rr.pick([20, 40, 50, 100]), u: rr.pick([4, 5, 6, 8]) },
        { what: 'crate', where: 'across a wooden floor', m: 20, f: rr.pick([40, 80]), u: rr.pick([2, 4]) },
      ]), (x) => {
        const a = x.f / x.m, s = (x.u * x.u) / (2 * a);
        return nice(a) && nice(s) && s <= 60 && distinct(s, (x.u * x.u) / a, x.u / a, (x.u * x.u) / (2 * x.f));
      });
      const a = v.f / v.m, s = (v.u * v.u) / (2 * a);
      return {
        type: 'numeric',
        prompt: `A <b>${v.m} kg</b> ${v.what} slides ${v.where} at <b>${v.u} m/s</b>. Friction pushes back on it with <b>${v.f} N</b> (nothing else pushes along the ground). How far does it slide before it stops?`,
        answer: s, unit: 'm',
        hints: ['What deceleration does friction give it? (a = F ÷ m)', 'It ends at rest. Which Unit 3 equation links speeds, acceleration and distance — without time?'],
        errors: [
          { value: (v.u * v.u) / a, msg: 'Close! v² = u² + 2as has a 2 in it: s = u² ÷ (2a).' },
          { value: v.u / a, msg: 'That\'s how long it slides (in seconds). The question asks how far.' },
          { value: (v.u * v.u) / (2 * v.f), msg: 'Use the deceleration (friction ÷ mass), not the force itself.' },
        ],
        solution: `a = ${v.f} ÷ ${v.m} = ${fmt(a)} m/s². It stops, so 0 = ${v.u}² − 2 × ${fmt(a)} × s → s = ${v.u * v.u} ÷ ${fmt(2 * a)} = <b>${fmt(s)} m</b>`,
      };
    },
  },
  {
    id: 'u4.hockey-speed', concepts: [C.fric, C.n2], tier: 'engineer',
    generate(r) {
      const m = 0.2;
      const [a, v] = r.pick([[0.5, 4], [0.5, 5], [0.5, 6], [0.5, 7], [1, 4], [1, 6], [1, 8], [1, 10]]);
      const f = m * a, d = (v * v) / (2 * a);
      return {
        type: 'numeric',
        prompt: `An ice-hockey puck has a mass of <b>${fmt(m)} kg</b>. Friction on it is <b>${fmt(f)} N</b>. Pip wants it to slide exactly <b>${fmt(d)} m</b> and stop. How fast must he send it off?`,
        answer: v, unit: 'm/s',
        hints: ['What deceleration does friction give the puck?', 'It stops, so (launch speed)² = 2 × deceleration × distance — Unit 3\'s braking distance u² ÷ (2 × deceleration), turned round. Then take the square root.'],
        errors: [
          { value: v * v, msg: 'That\'s the speed SQUARED — take the square root.' },
        ],
        solution: `Deceleration = ${fmt(f)} ÷ ${fmt(m)} = ${fmt(a)} m/s². Speed² = 2 × ${fmt(a)} × ${fmt(d)} = ${v * v}, so speed = √${v * v} = <b>${v} m/s</b>`,
      };
    },
  },
  {
    id: 'u4.puzzle-blocks', concepts: [C.n2, C.n3], tier: 'engineer', puzzle: true,
    generate(r) {
      const v = until(r, (rr) => ({ m1: rr.int(2, 12), m2: rr.int(2, 12), a: rr.int(1, 4) }), (x) => {
        const F = (x.m1 + x.m2) * x.a;
        return x.m1 !== x.m2 && F <= 120 && F >= 20 && distinct(x.m2 * x.a, F, x.m1 * x.a, F / 2, x.a);
      });
      const F = (v.m1 + v.m2) * v.a;
      return {
        type: 'numeric',
        prompt: `On frictionless ice, two crates touch: a <b>${v.m1} kg</b> crate at the back and a <b>${v.m2} kg</b> crate in front. Pip pushes the <b>back</b> crate forwards with <b>${F} N</b>, and both crates slide off together. How hard does the back crate push on the <b>front</b> crate?`,
        answer: v.m2 * v.a, unit: 'N',
        hints: ['They move together. What is their acceleration?', 'What resultant force does the front crate need for that acceleration? Only the back crate pushes it.'],
        errors: [
          { value: F, msg: 'Not all of Pip\'s push reaches the front crate — some is used to speed up the back crate.' },
          { value: v.m1 * v.a, msg: 'That\'s the force speeding up the back crate. What does the front crate need?' },
          { value: F / 2, msg: 'The crates have different masses, so they don\'t share the push equally.' },
        ],
        solution: `Together: a = ${F} ÷ (${v.m1} + ${v.m2}) = ${v.a} m/s². The front crate needs F = ${v.m2} × ${v.a} = <b>${v.m2 * v.a} N</b>. (The rest, ${v.m1 * v.a} N, speeds up the back crate — and by Newton's 3rd law the front crate pushes back on it with ${v.m2 * v.a} N.)`,
      };
    },
  },
  {
    id: 'u4.puzzle-two-pushes', concepts: [C.fric, C.n2], tier: 'engineer', puzzle: true,
    generate(r) {
      const v = until(r, (rr) => {
        const m = rr.pick([5, 10, 20, 25]), f = rr.int(2, 10) * 10, a1 = rr.int(1, 3), a2 = a1 + rr.int(2, 3);
        return { m, f, a1, a2, P1: f + m * a1, P2: f + m * a2 };
      }, (x) => x.P2 <= 250 && distinct(x.f, x.m, x.P2 - x.P1));
      return {
        type: 'numeric',
        prompt: `Pip pushes a crate across the floor. With a <b>${v.P1} N</b> push it accelerates at <b>${v.a1} m/s²</b>. With a <b>${v.P2} N</b> push it accelerates at <b>${v.a2} m/s²</b>. Friction is the same both times. How big is the <b>friction</b> force?`,
        answer: v.f, unit: 'N',
        hints: ['Compare the two pushes. How much extra push gave how much extra acceleration?', 'The extra push all goes into extra acceleration — that tells you the mass.', 'Then: push − friction = m × a.'],
        errors: [
          { value: v.m, msg: 'That\'s the crate\'s mass in kg! Now use push − friction = m × a.' },
          { value: v.P2 - v.P1, msg: 'That\'s the extra push. Use it to find the mass first.' },
        ],
        solution: `Extra ${v.P2 - v.P1} N gives an extra ${v.a2 - v.a1} m/s², so m = ${v.P2 - v.P1} ÷ ${v.a2 - v.a1} = ${v.m} kg. Then ${v.P1} − friction = ${v.m} × ${v.a1} = ${v.m * v.a1}, so friction = <b>${v.f} N</b>`,
      };
    },
  },
]));
