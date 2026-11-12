// Unit 4 checks: every answer recomputed independently from the numbers in the prompt,
// realistic magnitudes, keypad-friendly answers, sim tasks that need a change, and boss rounds
// that have exactly one right slider setting.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../js/content/course.js';
import unit4 from '../js/content/mechanics/unit4.js';
import { allTemplates, instantiate } from '../js/engine/templates.js';
import { makeRng } from '../js/core/util.js';
import { hockeyRound } from '../js/widgets/unit4/hockey.js';

const SEEDS = 600;
const u4 = () => allTemplates().filter((t) => t.id.startsWith('u4.'));
const stripSvg = (s) => s.replace(/<svg[\s\S]*?<\/svg>/g, '');
// Numbers inside <b>…</b> in reading order (bold words without a number are skipped).
const bold = (q) => [...stripSvg(q.prompt).matchAll(/<b>([^<]*)<\/b>/g)]
  .map((m) => m[1].replace(/−/g, '-').replace(/(\d),(\d{3})/g, '$1$2').match(/-?\d+(?:\.\d+)?/))
  .filter(Boolean).map((m) => Number(m[0]));
const svgForce = (q, label) => Number(q.prompt.match(new RegExp(`>${label}</text><text[^>]*>(\\d+) N<`))[1]);

const CHECK = {
  'u4.resultant-same': (q, n) => n[0] + n[1],
  'u4.resultant-opp': (q, n) => n[0] - n[1],
  'u4.resultant-many': (q, n) => n[0] + n[1] - n[2] - n[3],
  'u4.missing-force': (q, n) => n[0] + n[1] + n[2] - n[3],
  'u4.fbd-resultant': (q) => svgForce(q, 'Pip pushes') - svgForce(q, 'Alex pulls'),
  'u4.n1-steady-force': (q, n) => n[1],
  'u4.n1-space-speed': (q, n) => n[0],
  'u4.fma-a': (q, n) => n[1] / n[0],
  'u4.fma-F': (q, n) => n[0] * n[1],
  'u4.fma-m': (q, n) => n[0] / n[1],
  'u4.fma-resultant': (q, n) => (n[1] - n[2]) / n[0],
  'u4.fma-loaded': (q, n) => n[2] / (n[0] + n[1]),
  'u4.fma-ratio': (q, n) => (n[0] * n[1]) / n[2],
  'u4.fric-resultant': (q, n) => n[0] - n[1],
  'u4.fric-accel': (q, n) => (n[1] - n[2]) / n[0],
  'u4.fric-push': (q, n) => n[0] * n[1] + n[2],
  'u4.fric-decel': (q, n) => n[1] / n[0],
  'u4.fric-stuck': (q, n) => n[1],
  'u4.fric-stop-time': (q, n) => n[1] / (n[2] / n[0]),
  'u4.n3-force': (q, n) => n[2],
  'u4.n3-skaters': (q, n) => n[2] / (/<b>Pip's<\/b>/.test(q.prompt) ? n[0] : n[1]),
  'u4.n1-steady-two': (q, n) => (/How big is it\?/.test(q.prompt) ? n[1] - n[2] : n[1] + n[2]),
  'u4.n3-speed-ratio': (q, n) => (n[0] * n[3]) / n[1],
  'u4.wp-car': (q, n) => (n[1] - n[2]) / n[0],
  'u4.wp-rocket': (q, n) => (n[1] - n[2]) / n[0],
  'u4.wp-sled-dogs': (q, n) => (n[0] * n[1] - n[3]) / n[2],
  'u4.wp-stop-dist': (q, n) => (n[1] * n[1]) / (2 * (n[2] / n[0])),
  'u4.hockey-speed': (q, n) => Math.sqrt(2 * (n[1] / n[0]) * n[2]),
  'u4.puzzle-blocks': (q, n) => (n[1] * n[2]) / (n[0] + n[1]),
  'u4.puzzle-two-pushes': (q, n) => {
    const m = (n[2] - n[0]) / (n[3] - n[1]);
    return n[0] - m * n[1];
  },
};

// Realistic answer ranges (by template).
const RANGE = {
  'u4.fma-a': [0.5, 5], 'u4.fma-resultant': [0.5, 3], 'u4.fma-loaded': [0.5, 2], 'u4.fma-ratio': [0.5, 12],
  'u4.fric-accel': [0.5, 3], 'u4.fric-decel': [0.5, 2.5], 'u4.fric-push': [1, 250], 'u4.fric-stop-time': [0.5, 16],
  'u4.n3-skaters': [0.3, 6], 'u4.n3-speed-ratio': [0.5, 6], 'u4.wp-car': [1, 3], 'u4.wp-rocket': [10, 30],
  'u4.wp-sled-dogs': [0.5, 2], 'u4.wp-stop-dist': [1, 60], 'u4.hockey-speed': [4, 10], 'u4.missing-force': [60, 250],
};

test('every numeric unit 4 answer can be recomputed from the prompt', () => {
  const numeric = u4().filter((t) => instantiate(t.id, 1).type === 'numeric').map((t) => t.id);
  for (const id of numeric) assert.ok(CHECK[id], `${id}: add an independent check`);
  for (const [id, f] of Object.entries(CHECK)) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const q = instantiate(id, seed);
      const want = f(q, bold(q));
      assert.ok(Math.abs(want - q.answer) < 1e-9, `${id} seed ${seed}: prompt gives ${want}, answer is ${q.answer}\n${q.prompt}`);
      if (RANGE[id]) assert.ok(q.answer >= RANGE[id][0] && q.answer <= RANGE[id][1], `${id} seed ${seed}: unrealistic ${q.answer}`);
    }
  }
});

test('unit 4 answers are keypad friendly', () => {
  for (const t of u4()) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const q = instantiate(t.id, seed);
      if (q.type !== 'numeric') continue;
      assert.ok(String(q.answer).length <= 12, `${t.id}: answer too long`);
      if (q.answer < 0) assert.ok(q.signed, `${t.id} seed ${seed}: negative answer needs signed: true`);
      assert.ok(q.hints?.length && /\?/.test(q.hints[0]), `${t.id}: first hint should be a question`);
      for (const s of [q.prompt, q.solution, ...q.hints, ...q.errors.map((e) => e.msg)]) {
        assert.ok(!/undefined|NaN|Infinity|\[object/.test(s), `${t.id} seed ${seed}: bad text ${s}`);
      }
    }
  }
});

test('unit 4 mcqs have unique choices and one right answer', () => {
  for (const t of u4()) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const q = instantiate(t.id, seed);
      if (q.type !== 'mcq') continue;
      assert.equal(new Set(q.choices).size, q.choices.length, `${t.id} seed ${seed}: duplicate choices`);
      assert.ok(q.answer >= 0 && q.answer < q.choices.length, t.id);
      for (const c of [...q.choices, q.prompt, q.explain]) assert.ok(!/undefined|NaN|\[object/.test(c), `${t.id}: bad text`);
    }
  }
});

test('n1-state-mcq: the right choice matches the forces', () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const q = instantiate('u4.n1-state-mcq', seed);
    const [, F, B] = bold(q);
    assert.equal(q.answer, F === B ? 0 : F > B ? 1 : 2, `seed ${seed}`);
  }
});

test('fbd-balanced-mcq: only the first diagram is balanced', () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const q = instantiate('u4.fbd-balanced-mcq', seed);
    const nums = q.choices.map((svg) => [...svg.matchAll(/font-weight="700">([\d.]+)</g)].map((m) => Number(m[1])));
    // order drawn: right, left, up, down
    const balanced = nums.map((n) => n.length === 4 && n[0] === n[1] && n[2] === n[3]);
    assert.deepEqual(balanced, [true, false, false, false], `seed ${seed}: ${JSON.stringify(nums)}`);
  }
});

// ---------- Simulations ----------
const sims = () => unit4.sessions.flatMap((s) => s.steps.filter((x) => x.type === 'sim').map((x) => ({ s, step: x })));
const range = (lo, hi, st) => Array.from({ length: Math.round((hi - lo) / st) + 1 }, (_, i) => lo + i * st);
const SURF = { ice: 10, wood: 40, carpet: 80 };

// Every state each sim can reach on a run, and the state right at the start.
const SPACES = {
  'u4-tug': (p) => {
    const L = p.left.reduce((a, x) => a + x.f, 0), R = p.right.reduce((a, x) => a + x.f, 0);
    const call = (pip) => [R + pip - L, pip];
    return { start: call(p.pip), all: range(0, 300, 10).map(call) };
  },
  'u4-space': (p) => ({ start: [{ v: p.v0, coast: 10, blasts: 0 }], all: range(-8, 8, 1).map((v) => [{ v, coast: 10, blasts: Math.abs(v - p.v0) }]) }),
  'u4-carts': (p) => ({ start: [p.force, p.mass], all: range(0, 200, 10).flatMap((F) => range(10, 60, 10).map((m) => [F, m])) }),
  'u4-friction': (p) => {
    const call = (surface, push) => {
      const moved = push > SURF[surface];
      return [{ surface, push, moved, a: moved ? Math.round(((push - SURF[surface]) / p.mass) * 1000) / 1000 : null }];
    };
    return { start: call(p.surface, p.push), all: Object.keys(SURF).flatMap((s) => range(0, 200, 10).map((P) => call(s, P))) };
  },
  'u4-push-apart': (p) => {
    const call = (mA, mB, F) => [{ mA, mB, F, vA: F / mA, vB: F / mB }];
    return { start: call(p.mA, p.mB, p.F), all: range(30, 45, 5).flatMap((a) => range(60, 90, 10).flatMap((b) => range(20, 300, 20).map((F) => call(a, b, F)))) };
  },
};

test('sim tasks: the first one passes as set up (the prediction test), the others need a change and are reachable', () => {
  for (const { s, step } of sims()) {
    const tasks = step.params.tasks;
    if (!tasks) continue;
    const sp = SPACES[step.widget](step.params);
    assert.ok(sp, `${s.id}: no state space for ${step.widget}`);
    const first = tasks[0].check(...sp.start);
    if (step.widget === 'u4-carts' || tasks[0].tested) assert.ok(first, `${s.id}: first task should pass with the starting settings`);
    tasks.slice(1).forEach((t, i) => {
      assert.ok(!t.check(...sp.start), `${s.id}: task ${i + 2} is already done at the start`);
      assert.ok(sp.all.some((args) => t.check(...args)), `${s.id}: task ${i + 2} can't be reached with the sliders`);
    });
    // a task never passes with the solution of the task before it (each needs new reasoning)
    for (let i = 1; i < tasks.length - 1; i++) {
      const sols = sp.all.filter((args) => tasks[i].check(...args));
      assert.ok(sols.some((args) => !tasks[i + 1].check(...args)), `${s.id}: task ${i + 2} is solved by task ${i + 1}`);
    }
  }
});

test('space skater: the first task needs 4 s with no blasts', () => {
  const step = sims().find((x) => x.step.widget === 'u4-space').step;
  const t1 = step.params.tasks[0];
  assert.ok(!t1.check({ v: 3, coast: 2, blasts: 0 }));
  assert.ok(!t1.check({ v: 3, coast: 5, blasts: 1 }));
  assert.ok(t1.check({ v: 3, coast: 4.1, blasts: 0 }));
});

test('hockey boss: whole-number targets, exactly one slider setting lands in the zone', () => {
  for (let seed = 1; seed <= 400; seed++) {
    const rng = makeRng(seed);
    for (const kind of ['speed', 'hit']) {
      const R = hockeyRound(rng, kind);
      assert.ok(Number.isInteger(R.d) && R.d >= 8 && R.d <= 55, `distance ${R.d}`);
      assert.ok(R.m === 0.2 && R.a >= 0.5 && R.a <= 1, 'realistic puck: 0.2 kg, deceleration 0.5–1 m/s² on ice');
      assert.ok(Math.abs(R.f / R.m - R.a) < 1e-9, 'a = f ÷ m');
      assert.ok(Math.abs(R.v * R.v - 2 * R.a * R.d) < 1e-9, 'v² = 2ad');
      const stopAt = (v) => (v * v) / (2 * R.a);
      const values = kind === 'speed' ? range(1, 12, 1) : range(R.pushStep, 60, R.pushStep);
      const speed = (x) => (kind === 'speed' ? x : (x / R.m) * 0.1);
      const hits = values.filter((x) => Math.abs(stopAt(speed(x)) - R.d) <= 0.6);
      assert.equal(hits.length, 1, `${kind} round ${JSON.stringify(R)}: ${hits}`);
      assert.equal(speed(hits[0]), R.v);
      if (kind === 'hit') assert.equal(hits[0], R.push);
    }
  }
});

test('every error value can be typed (at most 2 decimal places)', () => {
  for (const t of u4()) for (let seed = 1; seed <= SEEDS; seed++) {
    for (const e of instantiate(t.id, seed).errors || []) assert.ok(Math.abs(e.value * 100 - Math.round(e.value * 100)) < 1e-6, `${t.id} seed ${seed}: ${e.value}`);
  }
});

test('no mcq template twice in one session', () => {
  for (const s of unit4.sessions) {
    const mcqs = s.steps.filter((x) => x.type === 'q' && instantiate(x.t, 1).type === 'mcq').map((x) => x.t);
    assert.equal(new Set(mcqs).size, mcqs.length, `${s.id}: ${mcqs}`);
  }
});

test('Pip is a child (30–45 kg) wherever his mass is given', () => {
  for (const t of u4()) for (let seed = 1; seed <= 300; seed++) {
    const q = instantiate(t.id, seed);
    for (const m of stripSvg(q.prompt).matchAll(/Pip \(<b>(\d+) kg<\/b>\)|Pip is <b>(\d+) kg<\/b>/g)) {
      const kg = Number(m[1] || m[2]);
      assert.ok(kg >= 30 && kg <= 45, `${t.id}: Pip ${kg} kg`);
    }
  }
});

test('free-body diagrams: one scale, so a bigger force always has a longer arrow', () => {
  for (const id of ['u4.fbd-resultant', 'u4.fbd-balanced-mcq']) for (let seed = 1; seed <= 300; seed++) {
    const q = instantiate(id, seed);
    for (const svg of [q.prompt, ...(q.choices || [])].flatMap((x) => x.match(/<svg[\s\S]*?<\/svg>/g) || [])) {
      const lines = [...svg.matchAll(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)" stroke="(#[0-9a-f]+)" stroke-width="[45]"\/>/g)]
        .map((m) => Math.hypot(m[3] - m[1], m[4] - m[2]));
      const vals = [...svg.matchAll(/font-weight="700">(?:[A-Za-z ]+ )?(\d+)(?: N)?</g)].map((m) => Number(m[1]));
      assert.equal(lines.length, vals.length, `${id}: arrows vs labels`);
      for (let i = 0; i < vals.length; i++) for (let j = 0; j < vals.length; j++) {
        if (vals[i] > vals[j] && vals[j] >= 30) assert.ok(lines[i] > lines[j], `${id} seed ${seed}: ${vals[i]} N arrow not longer than ${vals[j]} N`);
      }
    }
  }
});

test('unit 4 shape: lessons, problem sets, review and boss', () => {
  const ids = unit4.sessions.map((s) => s.id);
  assert.deepEqual(ids, ['mech.u4.l1', 'mech.u4.l2', 'mech.u4.l3', 'mech.u4.l4', 'mech.u4.l5', 'mech.u4.psA', 'mech.u4.psB', 'mech.u4.review', 'mech.u4.boss']);
  const review = unit4.sessions.find((s) => s.id === 'mech.u4.review');
  const qs = review.steps.filter((x) => x.type === 'q');
  assert.equal(qs.length, 10);
  assert.equal(qs.filter((x) => /^u[12]\./.test(x.t)).length, 2);
  const psB = unit4.sessions.find((s) => s.id === 'mech.u4.psB');
  const puzzles = psB.steps.filter((x) => x.type === 'q' && instantiate(x.t, 1).puzzle).length;
  assert.ok(puzzles >= 1 && puzzles <= 2);
  const used = new Set(u4().flatMap((t) => t.concepts));
  for (const c of used) assert.ok(unit4.conceptNames[c], `missing concept name for ${c}`);
  for (const s of unit4.sessions.filter((x) => x.type === 'lesson')) {
    const n = s.steps.filter((x) => ['q', 'equation', 'mcq', 'numeric'].includes(x.type)).length;
    assert.ok(n >= 6 && n <= 9, `${s.id}: ${n} practice questions`);
  }
});
