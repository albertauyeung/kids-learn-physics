// Checks every problem template and every session in the course.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { course, playableUnits } from '../js/content/course.js';
import { allTemplates, instantiate, getTemplate } from '../js/engine/templates.js';
import { WIDGET_NAMES } from './widget-names.js';

const SEEDS = 300;

test('every template generates valid questions', () => {
  const templates = allTemplates();
  assert.ok(templates.length > 40, `expected many templates, got ${templates.length}`);
  for (const t of templates) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const q = instantiate(t.id, seed);
      assert.ok(['numeric', 'mcq', 'equation'].includes(q.type), `${t.id}: bad type ${q.type}`);
      assert.ok(typeof q.prompt === 'string' && q.prompt.length > 10, `${t.id}: missing prompt`);
      assert.ok(!/undefined|NaN|Infinity/.test(q.prompt), `${t.id} seed ${seed}: bad prompt text: ${q.prompt}`);
      if (q.type === 'numeric') {
        assert.ok(Number.isFinite(q.answer), `${t.id} seed ${seed}: answer not finite`);
        // answers should be "nice": at most 2 decimal places
        assert.ok(Math.abs(q.answer * 100 - Math.round(q.answer * 100)) < 1e-6, `${t.id} seed ${seed}: answer ${q.answer} is not nice`);
        if (q.unitChoices) assert.ok(q.unitChoices.includes(q.unit), `${t.id}: unit ${q.unit} not among choices`);
        if (q.solution) assert.ok(!/undefined|NaN/.test(q.solution), `${t.id} seed ${seed}: bad solution`);
      }
      if (q.type === 'mcq') {
        assert.ok(q.answer >= 0 && q.answer < q.choices.length, `${t.id}: answer index out of range`);
        assert.equal(new Set(q.choices).size, q.choices.length, `${t.id} seed ${seed}: duplicate choices`);
      }
      if (q.type === 'equation') {
        for (const a of q.answers) for (const tile of a) assert.ok(q.tiles.includes(tile), `${t.id}: tile ${tile} missing`);
      }
    }
  }
});

test('every session step is well-formed', () => {
  const ids = new Set();
  for (const unit of playableUnits()) {
    const types = unit.sessions.map((x) => x.type);
    assert.ok(types.filter((t) => t === 'lesson').length >= 5, `${unit.id} needs at least 5 lessons`);
    assert.equal(types.filter((t) => t === 'boss').length, 1, `${unit.id} needs one boss`);
    assert.equal(types[types.length - 1], 'boss', `${unit.id} should end with its boss`);
    assert.equal(unit.sessions.filter((x) => x.id.endsWith('.review')).length, 1, `${unit.id} needs one Unit Review`);
    for (const s of unit.sessions) {
      assert.ok(!ids.has(s.id), `duplicate session id ${s.id}`);
      ids.add(s.id);
      assert.ok(['lesson', 'problems', 'boss'].includes(s.type), `${s.id}: bad type`);
      const questions = s.steps.filter((x) => ['q', 'mcq', 'numeric', 'equation'].includes(x.type));
      assert.ok(questions.length >= 3, `${s.id}: needs at least 3 questions`);
      for (const step of s.steps) {
        if (step.type === 'q') getTemplate(step.t);
        if (step.type === 'sim') assert.ok(WIDGET_NAMES.includes(step.widget), `${s.id}: unknown widget ${step.widget}`);
        if (step.type === 'predict' || step.type === 'mcq') assert.ok(step.answer >= 0 && step.answer < step.choices.length, `${s.id}: bad answer index`);
      }
    }
  }
  assert.equal(course.tracks[0].units.length, 10, 'mechanics track plans 10 units');
});

test('Pythagoras and puzzle answers are mathematically right', () => {
  const nums = (q) => [...q.prompt.replace(/<svg[\s\S]*?<\/svg>/g, (svg) => svg.replace(/<text[^>]*>([^<]*)<\/text>/g, ' $1 ')).matchAll(/(\d+(?:\.\d+)?)\s*m(?:\/s)?\b/g)].map((m) => Number(m[1]));
  for (let seed = 1; seed <= 300; seed++) {
    // hypotenuse questions: the two given sides and the answer form a right-angled triangle
    for (const id of ['u2.pyth-hyp', 'u2.pyth-walk', 'u2.river-speed']) {
      const q = instantiate(id, seed);
      const [a, b] = id === 'u2.pyth-walk' ? [...q.prompt.matchAll(/(\d+) blocks/g)].map((m) => Number(m[1])) : nums(q);
      assert.equal(a * a + b * b, q.answer * q.answer, `${id} seed ${seed}: ${a}, ${b} → ${q.answer}`);
    }
    const leg = instantiate('u2.pyth-leg', seed);
    const [c, b] = nums(leg);
    assert.equal(leg.answer * leg.answer + b * b, c * c, `pyth-leg seed ${seed}`);
    // the bee flies for exactly as long as the trains take to meet
    const fly = instantiate('u2.puzzle-fly', seed);
    const [D, v, f] = [...fly.prompt.matchAll(/(\d+(?:\.\d+)?) km(?:\/h)?/g)].map((m) => Number(m[1]));
    assert.ok(Math.abs(fly.answer - (f * D) / (2 * v)) < 1e-9, `puzzle-fly seed ${seed}`);
  }
});

// Regression checks from the content review.
const many = (id, n = 1500) => Array.from({ length: n }, (_, i) => instantiate(id, i + 1));

test('average-speed trap: the "(not X!)" text never contradicts the answer', () => {
  for (const q of many('u1.avg-speeds')) {
    const m = q.solution.match(/<b>([\d.]+) km\/h<\/b> \(not ([\d.]+)!\)/);
    assert.ok(m && m[1] !== m[2], q.solution);
  }
});

test('every plotted graph point sits on a gridline (readable without guessing)', () => {
  for (const id of ['u1.graph-speed', 'u1.graph-stop', 'u2.slope-read', 'u2.slope-segment']) {
    for (const q of many(id, 800)) {
      const gridYs = new Set([...q.prompt.matchAll(/<line x1="[\d.]+" y1="([\d.]+)" x2="[\d.]+" y2="\1" class="g-grid"\/>/g)].map((m) => Number(m[1]).toFixed(1)));
      const gridXs = new Set([...q.prompt.matchAll(/<line x1="([\d.]+)" y1="[\d.]+" x2="\1" y2="[\d.]+" class="g-grid"\/>/g)].map((m) => Number(m[1]).toFixed(1)));
      const pts = [...q.prompt.match(/<path d="([^"]+)"/)[1].matchAll(/[ML]([\d.]+),([\d.]+)/g)];
      assert.ok(gridYs.size > 2 && pts.length >= 2, id);
      for (const [, x, y] of pts) {
        assert.ok(gridXs.has(Number(x).toFixed(1)), `${id}: x=${x} off grid`);
        assert.ok(gridYs.has(Number(y).toFixed(1)), `${id}: y=${y} off grid in ${q.solution}`);
      }
    }
  }
});

test('average velocity answers are not predictable from the first direction', () => {
  let sameSign = 0;
  const qs = many('u2.vel-avg', 1000);
  for (const q of qs) {
    const firstRight = /m right<\/b>, then/.test(q.prompt);
    if ((q.answer > 0) === firstRight) sameSign++;
  }
  assert.ok(sameSign > 300 && sameSign < 700, `sign matches first direction in ${sameSign}/1000`);
});

test('Pythagoras questions only need squares from the lesson table', () => {
  const table = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 20, 24, 25]); // js/content/mechanics/unit2.js
  for (const id of ['u2.pyth-hyp', 'u2.pyth-walk', 'u2.pyth-leg', 'u2.river-speed']) {
    for (let seed = 1; seed <= 300; seed++) {
      const q = instantiate(id, seed);
      assert.ok(table.has(q.answer), `${id}: √ of ${q.answer * q.answer} is not in the table`);
    }
  }
});

test('every "in a row" quest is reachable within a single session', async () => {
  const { QUESTS } = await import('../js/core/state.js');
  let maxQ = 0;
  for (const unit of playableUnits()) for (const s of unit.sessions) {
    const n = s.steps.filter((x) => ['q', 'mcq', 'numeric', 'equation'].includes(x.type)).length;
    maxQ = Math.max(maxQ, n);
  }
  for (const q of QUESTS.filter((x) => x.metric === 'bestCombo')) assert.ok(q.target <= maxQ, `${q.id} needs ${q.target} in a row; longest session has ${maxQ}`);
});

test('index.html preloads every JavaScript module', async () => {
  const { readFileSync, readdirSync, statSync } = await import('node:fs');
  const { join } = await import('node:path');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
  const root = new URL('..', import.meta.url).pathname;
  for (const f of walk(join(root, 'js')).filter((x) => x.endsWith('.js'))) {
    const rel = f.slice(root.length);
    assert.ok(html.includes(`<link rel="modulepreload" href="${rel}">`), `missing modulepreload for ${rel}`);
  }
});

// ---------- Learning-design rules (from the learning review) ----------
import { fmt } from '../js/core/util.js';

test('hints never give away the final answer', () => {
  for (const t of allTemplates()) {
    for (let seed = 1; seed <= 200; seed++) {
      const q = instantiate(t.id, seed);
      if (q.type !== 'numeric' || !q.hints) continue;
      const ans = fmt(q.answer);
      for (const hint of q.hints) {
        assert.ok(!new RegExp(`=\\s*${ans.replace(/[.+−-]/g, '\\$&')}(?![\\d.])`).test(hint), `${t.id} seed ${seed}: hint reveals the answer: ${hint}`);
      }
    }
  }
});

test('mistake-specific feedback is well-formed', () => {
  let withErrors = 0;
  for (const t of allTemplates()) {
    for (let seed = 1; seed <= 100; seed++) {
      const q = instantiate(t.id, seed);
      if (!q.errors) continue;
      withErrors++;
      for (const e of q.errors) {
        assert.equal(typeof e.msg, 'string', t.id);
        assert.ok(e.msg.length > 10, t.id);
        assert.ok(typeof e.value === 'number', `${t.id}: error value must be a number`);
      }
    }
  }
  assert.ok(withErrors > 3000, 'most numeric templates should anticipate common mistakes');
});

// A wrong method must not land on the right answer (it would score), and two mistakes
// must not share a value (only the first message could ever be shown).
test('common mistakes never give the right answer or collide', () => {
  // Reading the end value of a graph that starts at 0 is a correct method, not a mistake.
  const startsAtZeroOk = new Set(['u1.graph-speed', 'u2.slope-read']);
  const same = (a, b) => Math.abs(a - b) < 1e-9;
  for (const t of allTemplates()) {
    for (let seed = 1; seed <= 500; seed++) {
      const q = instantiate(t.id, seed);
      const errs = (q.errors || []).filter((e) => !(startsAtZeroOk.has(t.id) && same(e.value, q.answer)));
      for (const e of errs) assert.ok(!same(e.value, q.answer), `${t.id} seed ${seed}: "${e.msg}" equals the answer ${q.answer}`);
      for (let i = 0; i < errs.length; i++) {
        for (let j = i + 1; j < errs.length; j++) assert.ok(!same(errs[i].value, errs[j].value), `${t.id} seed ${seed}: two mistakes share the value ${errs[i].value}`);
      }
    }
  }
});

test('predictions revealed after an experiment are followed by one', () => {
  for (const unit of playableUnits()) for (const s of unit.sessions) {
    s.steps.forEach((step, i) => {
      if (step.type !== 'predict' || !step.revealAfterSim) return;
      const nextSim = s.steps.slice(i + 1).find((x) => x.type === 'sim');
      const nextQ = s.steps.slice(i + 1).findIndex((x) => ['q', 'mcq', 'numeric', 'equation'].includes(x.type));
      const simIdx = s.steps.slice(i + 1).indexOf(nextSim);
      assert.ok(nextSim && nextSim.goal && (nextQ === -1 || simIdx < nextQ), `${s.id}: reveal-after-sim prediction needs a goal sim before the questions`);
    });
  }
});

test('every lesson includes at least one concept question (not just calculations)', () => {
  for (const unit of playableUnits()) for (const s of unit.sessions.filter((x) => x.type === 'lesson')) {
    const kinds = s.steps.filter((x) => x.type === 'q').map((x) => instantiate(x.t, 1).type);
    const concept = kinds.filter((k) => k !== 'numeric').length + s.steps.filter((x) => x.type === 'equation').length;
    if (s.id === 'mech.u2.lp') continue; // the maths power-up lesson is calculation practice by design
    assert.ok(concept >= 1, `${s.id} has no concept questions`);
  }
});

test('River Lab: only the first task (launch as-is) passes with the starting settings', () => {
  for (const unit of playableUnits()) for (const s of unit.sessions) for (const step of s.steps) {
    if (step.widget !== 'river' || !step.params.tasks) continue;
    const p = { width: step.params.width, boat: step.params.boat, current: step.params.current };
    const drift = (p.current * p.width) / p.boat;
    const passes = step.params.tasks.map((t) => t.check(p, drift));
    assert.equal(passes[0], true, `${s.id}: the first task should match the starting settings the intro asks for`);
    assert.ok(passes.slice(1).every((x) => !x), `${s.id}: later tasks must not be done before the child changes anything`);
  }
});

test('every lesson has cheat-sheet notes (📖 Notes)', () => {
  for (const u of playableUnits()) {
    for (const s of u.sessions.filter((x) => x.type === 'lesson')) {
      assert.ok(s.notes && Array.isArray(s.notes.eq) && s.notes.eq.length, `${s.id}: missing notes.eq`);
      for (const t of [...s.notes.eq, ...(s.notes.tips || [])]) assert.ok(typeof t === 'string' && t.length > 3 && !/undefined|NaN/.test(t), `${s.id}: bad note "${t}"`);
    }
  }
});
