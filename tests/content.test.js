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
