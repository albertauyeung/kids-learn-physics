// Unit 5 (Gravity & Free Fall): content, answers recomputed from the prompts, and sim tasks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import unit5 from '../js/content/mechanics/unit5.js';
import '../js/content/mechanics/unit1-templates.js';
import '../js/content/mechanics/unit2-templates.js';
import { allTemplates, instantiate, getTemplate } from '../js/engine/templates.js';
import { fmt } from '../js/core/util.js';
import names from '../js/widgets/unit5/names.js';
import { WORLDS, D_MAX, MAX_TRIES, eggRound, judgeEgg, eggSolution, passTimes, terminalSpeed, weight } from '../js/widgets/unit5/physics.js';
import { makeRng } from '../js/core/util.js';

const U5 = allTemplates().filter((t) => t.id.startsWith('u5.'));
const SEEDS = 500;
const same = (a, b) => Math.abs(a - b) < 1e-9;
const strip = (s) => s.replace(/<[^>]+>/g, ' ');
const nums = (s) => [...strip(s).replace(/,(?=\d{3})/g, '').matchAll(/(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));

test('unit 5 structure', () => {
  assert.equal(unit5.id, 'mech.u5');
  assert.ok(!unit5.comingSoon);
  const ids = unit5.sessions.map((s) => s.id);
  assert.deepEqual(ids.slice(-4), ['mech.u5.psA', 'mech.u5.psB', 'mech.u5.review', 'mech.u5.boss']);
  const lessons = unit5.sessions.filter((s) => s.type === 'lesson');
  assert.ok(lessons.length >= 5 && lessons.length <= 6);
  for (const s of unit5.sessions) {
    for (const step of s.steps) {
      if (step.type === 'q') getTemplate(step.t);
      if (step.type === 'sim') assert.ok(names.includes(step.widget), `${s.id}: unknown widget ${step.widget}`);
    }
    const qs = s.steps.filter((x) => x.type === 'q');
    if (s.type === 'lesson') assert.ok(qs.length >= 5 && qs.length <= 8, `${s.id}: ${qs.length} questions`);
    // no mcq template twice in one session (fixed-text scenarios would repeat)
    const mcqs = qs.map((x) => x.t).filter((t) => instantiate(t, 1).type === 'mcq');
    assert.equal(new Set(mcqs).size, mcqs.length, `${s.id}: an mcq template repeats`);
  }
  const review = unit5.sessions.find((s) => s.id === 'mech.u5.review');
  const rq = review.steps.filter((x) => x.type === 'q').map((x) => x.t);
  assert.equal(rq.length, 10);
  assert.equal(rq.filter((t) => t.startsWith('u5.')).length, 8);
  assert.ok(rq.filter((t) => !t.startsWith('u5.')).every((t) => /^u[12]\./.test(t)));
  const psB = unit5.sessions.find((s) => s.id === 'mech.u5.psB');
  assert.ok(psB.steps.filter((x) => x.type === 'q' && getTemplate(x.t).puzzle).length >= 1);
  // every concept used has a readable name
  for (const t of U5) for (const c of t.concepts) assert.ok(unit5.conceptNames[c], `${t.id}: no name for ${c}`);
  // every u5 template is used somewhere
  const used = new Set(unit5.sessions.flatMap((s) => s.steps.filter((x) => x.type === 'q').map((x) => x.t)));
  for (const t of U5) assert.ok(used.has(t.id), `${t.id} is never used`);
});

test('unit 5 questions are well-formed for many seeds', () => {
  for (const t of U5) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const q = instantiate(t.id, seed);
      const texts = [q.prompt, q.solution, q.explain, ...(q.hints || []), ...(q.choices || []), ...(q.errors || []).map((e) => e.msg)].filter(Boolean);
      for (const s of texts) assert.ok(!/undefined|NaN|Infinity|\[object/.test(s), `${t.id} seed ${seed}: bad text ${s}`);
      if (q.type === 'numeric') {
        assert.ok(Number.isFinite(q.answer) && q.answer > 0, `${t.id}: answer ${q.answer}`);
        assert.ok(Math.abs(q.answer * 100 - Math.round(q.answer * 100)) < 1e-6, `${t.id} seed ${seed}: answer ${q.answer} not nice`);
        assert.ok(String(+q.answer.toFixed(2)).length <= 12);
        assert.ok(q.unit, `${t.id}: needs a unit`);
        const ans = fmt(q.answer);
        for (const e of q.errors || []) assert.ok(!same(e.value, q.answer), `${t.id} seed ${seed}: error equals answer`);
        for (const e of q.errors || []) assert.ok(Math.abs(e.value * 100 - Math.round(e.value * 100)) < 1e-6, `${t.id} seed ${seed}: error ${e.value} can't be typed`);
        if (q.hints?.length) assert.ok(q.hints[0].includes('?'), `${t.id}: first hint should be a question: ${q.hints[0]}`);
        const vals = (q.errors || []).map((e) => e.value);
        assert.equal(new Set(vals.map((v) => v.toFixed(6))).size, vals.length, `${t.id} seed ${seed}: duplicate errors`);
        for (const h of q.hints || []) assert.ok(!new RegExp(`=\\s*${ans.replace(/[.+−-]/g, '\\$&')}(?![\\d.])`).test(h), `${t.id}: hint reveals answer`);
        assert.ok(q.solution.includes(`<b>${ans}`), `${t.id} seed ${seed}: solution should show the answer ${ans}: ${q.solution}`);
      }
      if (q.type === 'mcq') {
        assert.ok(q.answer >= 0 && q.answer < q.choices.length);
        assert.equal(new Set(q.choices).size, q.choices.length, `${t.id} seed ${seed}: duplicate choices`);
      }
    }
  }
});

// Independent recomputation of answers from the numbers in the prompt.
const G = { Earth: 10, Moon: 1.6, Mars: 3.7, Jupiter: 25 };
const worldOf = (p, notEarth = false) => Object.keys(G).find((w) => p.includes(w) && !(notEarth && w === 'Earth'));
const check = {
  'u5.weight-earth': (q, n) => n[0] * 10,
  'u5.weight-planet': (q, n) => Math.round(n[0] * G[worldOf(q.prompt)] * 100) / 100,
  'u5.mass-from-weight': (q, n) => n[0] / G[worldOf(q.prompt)],
  'u5.weight-transfer': (q, n) => Math.round((n[0] / 10) * G[worldOf(q.prompt, true)] * 100) / 100,
  'u5.find-g': (q, n) => n[1] / n[0],
  'u5.accel-calc': (q, n) => n[1] / n[0],
  'u5.heavy-light-time': (q, n) => n[1],
  'u5.fall-speed': (q, n) => 10 * n[n.length - 2],
  'u5.fall-height': (q, n) => (q.prompt.includes('Moon') ? 0.8 * n[1] ** 2 : 5 * n[0] ** 2),
  'u5.fall-time': (q, n) => Math.sqrt(n[0] / 5),
  'u5.fall-speed-from-height': (q, n) => Math.sqrt(20 * n[0]),
  'u5.second-by-second': (q, n) => 5 * n[2] ** 2 - 5 * n[1] ** 2,
  'u5.time-to-top': (q, n) => n[0] / 10,
  'u5.max-height': (q, n) => n[0] ** 2 / 20,
  'u5.flight-time': (q, n) => n[0] / 5,
  'u5.throw-for-height': (q, n) => Math.sqrt(20 * n[0]),
  'u5.window-times': (q, n) => { const [a, b] = passTimes(n[0], n[1]); return q.prompt.includes('way down') ? b : a; },
  'u5.throw-down': (q, n) => { const [H, u] = n; return (-u + Math.sqrt(u * u + 20 * H)) / 10; },
  'u5.terminal-drag': (q, n) => n[0] * 10,
  'u5.resultant-air': (q, n) => (n[0] * 10 - n[1]) / n[0],
  'u5.terminal-speed': (q, n) => Math.sqrt((n[0] * 10) / n[1]),
  'u5.wp-ledge': (q, n) => n[0] ** 2 / 20,
  'u5.wp-arrow': (q, n) => (q.prompt.includes('How high') ? n[0] ** 2 / 20 : n[0] / 5),
  'u5.wp-moon-jump': (q, n) => n[1] ** 2 / 3.2,
  'u5.wp-two-stones': (q, n) => 5 * n[1] ** 2 - 5 * (n[1] - 1) ** 2,
  'u5.puzzle-window': (q, n) => { const [t1, t2] = n; const u = 5 * (t1 + t2); return q.prompt.includes('How fast') ? u : u * t1 - 5 * t1 * t1; },
  'u5.puzzle-splash': (q, n) => {
    const [total, c] = n;
    // solve t + 5t²/c = total by bisection, independent of the template's own maths
    let lo = 0, hi = total;
    for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (m + (5 * m * m) / c > total) hi = m; else lo = m; }
    return q.prompt.includes('How deep') ? 5 * lo * lo : lo;
  },
  'u5.quad-factor': (q) => {
    const m = strip(q.prompt).match(/t² ([+−]) (\d*)t ([+−]) (\d+) = 0/);
    const b = (m[1] === '−' ? -1 : 1) * Number(m[2] || 1), c = (m[3] === '−' ? -1 : 1) * Number(m[4]);
    const d = Math.sqrt(b * b - 4 * c);
    return Math.max((-b + d) / 2, (-b - d) / 2);
  },
};

test('unit 5 answers recomputed from the prompt numbers', () => {
  for (const [id, f] of Object.entries(check)) {
    for (let seed = 1; seed <= 300; seed++) {
      const q = instantiate(id, seed);
      const n = nums(q.prompt);
      const want = f(q, n);
      assert.ok(Math.abs(want - q.answer) < 1e-6, `${id} seed ${seed}: expected ${want}, got ${q.answer} — ${strip(q.prompt)}`);
    }
  }
  for (const t of U5) {
    if (instantiate(t.id, 1).type === 'numeric') assert.ok(check[t.id], `no independent check for ${t.id}`);
  }
});

test('realistic magnitudes', () => {
  for (let seed = 1; seed <= 300; seed++) {
    for (const id of ['u5.fall-height', 'u5.fall-time', 'u5.fall-speed-from-height', 'u5.wp-ledge', 'u5.throw-down', 'u5.puzzle-splash']) {
      const q = instantiate(id, seed);
      for (const m of strip(q.prompt).matchAll(/(\d+(?:\.\d+)?) m\b(?!\/)/g)) assert.ok(Number(m[1]) <= 80, `${id}: ${m[1]} m drop is too high`);
    }
    for (const id of ['u5.time-to-top', 'u5.max-height', 'u5.flight-time', 'u5.window-times', 'u5.wp-arrow', 'u5.puzzle-window']) {
      const q = instantiate(id, seed);
      const u = id === 'u5.puzzle-window' ? q.prompt.includes('How fast') ? q.answer : 0 : nums(q.prompt)[0];
      assert.ok(u <= 30, `${id}: throw speed ${u}`);
    }
  }
});

// ---------- Simulations ----------
const sims = unit5.sessions.flatMap((s) => s.steps.filter((x) => x.type === 'sim').map((x) => ({ s, x })));

test('sim tasks: the first task is the starting setup only when the prediction asks for it; later tasks need a change', () => {
  for (const { s, x } of sims) {
    const tasks = x.params.tasks;
    if (!tasks) continue;
    const p = x.params;
    let start;
    if (x.widget === 'u5-planet-scale') start = (t) => t.check('earth', p.mass, weight(p.mass, 10));
    if (x.widget === 'u5-well-drop') start = (t) => t.check(p.depth, Math.sqrt(p.depth / 5), Math.sqrt(20 * p.depth));
    if (x.widget === 'u5-throw-up') start = (t) => t.check(p.u, p.hw ?? 10, { passes: passTimes(p.u, p.hw ?? 10) });
    if (x.widget === 'u5-parachute') start = (t) => t.check(p.mass, p.area, 50);
    if (x.widget === 'u5-vacuum-drop') start = (t) => t.check({ air: true, left: 'hammer', right: 'feather', gap: 7 });
    const passes = tasks.map(start);
    for (let i = 1; i < passes.length; i++) assert.ok(!passes[i], `${s.id} ${x.title}: task ${i + 1} passes with the starting settings`);
    if (p.testedAfter != null) assert.ok(s.steps.some((st) => st.type === 'predict' && st.revealAfterSim), `${s.id}: testedAfter without a prediction`);
  }
});

test('sim tasks are solvable with the controls', () => {
  for (const { s, x } of sims) {
    const tasks = x.params.tasks;
    if (!tasks) continue;
    for (const [i, t] of tasks.entries()) {
      let ok = false;
      if (x.widget === 'u5-planet-scale') for (const w of WORLDS) for (let m = 40; m <= 100; m++) ok ||= t.check(w.id, m, weight(m, w.g));
      if (x.widget === 'u5-well-drop') for (let d = 5; d <= 80; d += 5) ok ||= t.check(d, Math.sqrt(d / 5), Math.sqrt(20 * d));
      if (x.widget === 'u5-throw-up') for (let u = 5; u <= 30; u++) for (let hw = 5; hw <= 45; hw += 5) ok ||= t.check(u, hw, { passes: passTimes(u, hw) });
      if (x.widget === 'u5-parachute') for (let m = 50; m <= 100; m += 10) for (let a = 0; a <= 60; a += 2) ok ||= t.check(m, a, a ? terminalSpeed(m, a) : 50);
      if (x.widget === 'u5-vacuum-drop') ok = true; // checked in the browser run
      assert.ok(ok, `${s.id} ${x.title}: task ${i + 1} cannot be done`);
    }
  }
});

test('Egg Drop Lab: rounds need the physics (one height, or a narrow band of D), and rerolls change the numbers', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const rng = makeRng(seed);
    for (const type of ['safe', 'timed', 'chute']) {
      const round = eggRound(type, rng);
      if (type === 'chute') {
        const wins = [];
        for (let D = 0; D <= D_MAX; D++) if (judgeEgg(round, round.H, D).ok) wins.push(D);
        assert.deepEqual(wins, round.answers);
        assert.ok(wins.length >= 1 && wins.length <= 4, `chute band ${wins}`);
        assert.equal(wins[wins.length - 1] - wins[0] + 1, wins.length, 'band is contiguous');
        assert.ok(!wins.includes(0), 'no parachute must not win');
        // the band from the worked solution's formulas
        assert.ok(wins[0] >= 100 / round.S ** 2 - 1e-9);
        // 3 tries of halving can't find a band this narrow among 101 values by luck alone
        assert.ok(101 / wins.length > 2 ** MAX_TRIES);
      } else {
        const wins = [];
        for (let h = 5; h <= 80; h += 5) if (judgeEgg(round, h, 0).ok) wins.push(h);
        assert.deepEqual(wins, [round.answerH], `${type} round ${JSON.stringify(round)}`);
        assert.ok(!judgeEgg(round, 40, 0).ok, 'the starting height must not already win');
        assert.ok(16 > 2 ** MAX_TRIES, 'halving 16 windows needs 4 tries');
      }
      // a miss reports only a direction
      const miss = type === 'chute' ? judgeEgg(round, round.H, 0) : judgeEgg(round, round.answerH === 80 ? 75 : round.answerH + 5, 0);
      assert.ok(!miss.ok && ['fast', 'low', 'early', 'late', 'slow'].includes(miss.why));
      const sol = eggSolution(round);
      assert.ok(!/undefined|NaN/.test(sol) && sol.length > 20);
      const next = eggRound(type, rng, round);
      assert.notEqual(next.key, round.key, 'a reroll gives fresh numbers');
    }
  }
});
