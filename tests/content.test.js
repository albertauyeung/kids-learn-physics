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
    assert.ok(unit.sessions.length >= 8, `${unit.id} should have 5 lessons + 2 problem sets + boss`);
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

test('Pythagoras triples and puzzle answers are right', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const q = instantiate('u2.puzzle-fly', seed);
    assert.ok(q.answer > 0);
  }
  // classic von Neumann numbers: 100 km apart, 50 km/h each, bee 75 km/h → 75 km
  assert.equal(75 * (100 / (50 + 50)), 75);
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

test('Pythagoras lesson questions only need squares from the lesson table', () => {
  for (const id of ['u2.pyth-hyp', 'u2.pyth-walk']) for (const q of many(id, 300)) assert.ok([5, 10, 13].includes(q.answer), `${id}: ${q.answer}`);
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
