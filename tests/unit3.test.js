// Unit 3 checks: every answer recomputed independently from the numbers in the prompt,
// realistic magnitudes, graph points on gridlines, keypad-friendly answers and sim tasks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import unit3 from '../js/content/mechanics/unit3.js';
import { allTemplates, instantiate } from '../js/engine/templates.js';
import { fmt } from '../js/core/util.js';
import { trafficRound } from '../js/widgets/unit3/traffic.js';
import { makeRng } from '../js/core/util.js';

const SEEDS = 600;
const u3 = () => allTemplates().filter((t) => t.id.startsWith('u3.'));
const stripSvg = (s) => s.replace(/<svg[\s\S]*?<\/svg>/g, '');
// Numbers inside <b>…</b> in reading order (a bold "a stop" gives no number).
const bold = (q) => [...stripSvg(q.prompt).matchAll(/<b>([^<]*)<\/b>/g)]
  .map((m) => m[1].replace(/−/g, '-').match(/-?\d+(?:\.\d+)?/))
  .filter(Boolean).map((m) => Number(m[0]));

// Read the plotted points of a vtGraph back into (t, v) using its axis labels.
function graphPoints(q) {
  const svg = q.prompt.match(/<svg[\s\S]*?<\/svg>/)[0];
  const L = 38, R = 10, T = 10, B = 30, w = 300, h = 200;
  const tLabels = [...svg.matchAll(/<text x="[\d.]+" y="184" text-anchor="middle">([\d.]+)<\/text>/g)].map((m) => Number(m[1]));
  const vLabels = [...svg.matchAll(/<text x="33" y="[\d.]+" text-anchor="end">([\d.]+)<\/text>/g)].map((m) => Number(m[1]));
  const tMax = Math.max(...tLabels), yMax = Math.max(...vLabels);
  const d = svg.match(/<path d="([^"]+)"/)[1];
  return [...d.matchAll(/[ML]([\d.]+),([\d.]+)/g)].map((m) => [
    Math.round(((Number(m[1]) - L) / (w - L - R)) * tMax * 100) / 100,
    Math.round(((h - B - Number(m[2])) / (h - T - B)) * yMax * 100) / 100,
  ]);
}
const area = (pts) => pts.slice(1).reduce((s, p, i) => s + ((p[1] + pts[i][1]) / 2) * (p[0] - pts[i][0]), 0);
// Positive root of t² + bt + c = 0.
const posRoot = (b, c) => (-b + Math.sqrt(b * b - 4 * c)) / 2;
const rest = (q) => /from rest/.test(q.prompt);
const stops = (q) => /a stop/.test(q.prompt);

const CHECK = {
  'u3.acc-basic': (q, n) => (rest(q) ? n[0] / n[1] : (n[1] - n[0]) / n[2]),
  'u3.acc-final': (q, n) => n[0] + n[1] * n[2],
  'u3.acc-time': (q, n) => (rest(q) ? n[1] / n[0] : (n[2] - n[0]) / n[1]),
  'u3.acc-table': (q, n) => n[1] - n[0],
  'u3.dec-signed': (q, n) => (stops(q) ? -n[0] / n[1] : (n[1] - n[0]) / n[2]),
  'u3.dec-size': (q, n) => (stops(q) ? n[0] / n[1] : (n[0] - n[1]) / n[2]),
  'u3.dec-stop-time': (q, n) => n[0] / n[1],
  'u3.dec-speed-after': (q, n) => n[0] - n[1] * n[2],
  'u3.vt-slope': (q) => { const p = graphPoints(q); return (p[1][1] - p[0][1]) / (p[1][0] - p[0][0]); },
  'u3.vt-area-tri': (q) => area(graphPoints(q)),
  'u3.vt-area-trap': (q) => area(graphPoints(q)),
  'u3.suvat-avg': (q, n) => ((n[0] + n[1]) / 2) * n[2],
  'u3.suvat-avg-t': (q, n) => (2 * n[2]) / (n[0] + n[1]),
  'u3.suvat-avg-v': (q, n) => (2 * n[2]) / n[1] - n[0],
  'u3.suvat-s': (q, n) => n[0] * n[2] + 0.5 * n[1] * n[2] * n[2],
  'u3.suvat-s-rest': (q, n) => 0.5 * n[0] * n[1] * n[1],
  'u3.v2-final': (q, n) => (rest(q) ? Math.sqrt(2 * n[0] * n[1]) : Math.sqrt(n[0] * n[0] + 2 * n[1] * n[2])),
  'u3.stop-dist': (q, n) => (n[0] * n[0]) / (2 * n[1]),
  'u3.stop-scale': (q, n) => n[1] * (n[2] / n[0]) ** 2,
  'u3.brake-decel': (q, n) => (n[0] * n[0]) / (2 * n[1]),
  'u3.quad-solve': (q) => {
    const m = q.prompt.match(/t² \+ (\d*)t − (\d+) = 0/);
    return posRoot(Number(m[1] || 1), -Number(m[2]));
  },
  'u3.quad-time': (q, n) => { assert.equal(n[1], 2); return posRoot(n[0], -n[2]); },
  'u3.quad-time4': (q, n) => { assert.equal(n[1], 4); return posRoot(n[0] / 2, -n[2] / 2); },
  'u3.wp-sprinter': (q, n) => (n[0] * n[1]) / 2,
  'u3.wp-takeoff': (q, n) => (n[1] * n[1]) / (2 * n[0]),
  'u3.wp-train': (q, n) => 0.5 * n[0] * n[1] * n[1],
  'u3.wp-elytra': (q, n) => n[0] * n[2] + 0.5 * n[1] * n[2] * n[2],
  'u3.wp-two-stage': (q, n) => 0.5 * n[0] * n[1] * n[1] + n[0] * n[1] * n[2],
  'u3.wp-stopping': (q, n) => n[0] * n[1] + (n[0] * n[0]) / (2 * n[2]),
  'u3.puzzle-catchup': (q, n) => { assert.equal(n[2], 2); return posRoot(-n[0], -n[1]); },
  // u·tr + u²/(2b) = D  →  u² + 2b·tr·u − 2bD = 0
  'u3.puzzle-stopping': (q, n) => posRoot(2 * n[2] * n[1], -2 * n[2] * n[0]),
};

test('Unit 3: every numeric answer matches an independent recomputation from the prompt', () => {
  for (const t of u3()) {
    const probe = instantiate(t.id, 1);
    if (probe.type !== 'numeric') continue;
    assert.ok(CHECK[t.id], `no independent check for ${t.id}`);
    for (let seed = 1; seed <= SEEDS; seed++) {
      const q = instantiate(t.id, seed);
      const want = CHECK[t.id](q, bold(q));
      assert.ok(Math.abs(want - q.answer) < 1e-9, `${t.id} seed ${seed}: prompt gives ${want}, answer ${q.answer}\n${stripSvg(q.prompt)}`);
    }
  }
});

test('Unit 3: answers are keypad-friendly and units are right', () => {
  const units = {
    'm/s²': ['u3.acc-basic', 'u3.acc-table', 'u3.dec-signed', 'u3.dec-size', 'u3.vt-slope', 'u3.brake-decel'],
    's': ['u3.acc-time', 'u3.dec-stop-time', 'u3.suvat-avg-t', 'u3.quad-solve', 'u3.quad-time', 'u3.quad-time4', 'u3.puzzle-catchup'],
    'm/s': ['u3.acc-final', 'u3.dec-speed-after', 'u3.suvat-avg-v', 'u3.v2-final', 'u3.puzzle-stopping'],
  };
  for (const t of u3()) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const q = instantiate(t.id, seed);
      for (const s of [q.prompt, q.solution || '', ...(q.hints || []), q.explain || '', ...(q.choices || [])]) {
        assert.ok(!/undefined|NaN|Infinity|\[object/.test(s), `${t.id} seed ${seed}: bad text ${s}`);
      }
      if (q.type !== 'numeric') continue;
      const typed = fmt(q.answer).replace(/,/g, '').replace('−', '-');
      assert.ok(typed.replace('-', '').length <= 12, `${t.id}: answer too long`);
      assert.ok(q.answer >= 0 || q.signed, `${t.id} seed ${seed}: negative answer without the ± key`);
      assert.ok(Math.abs(q.answer * 100 - Math.round(q.answer * 100)) < 1e-9, `${t.id}: answer ${q.answer} not nice`);
      const want = Object.entries(units).find(([, ids]) => ids.includes(t.id))?.[0] ?? 'm';
      assert.equal(q.unit, want, `${t.id}: unit ${q.unit}`);
      if (q.errors) for (const e of q.errors) assert.ok(Number.isFinite(e.value), `${t.id}: error value not finite`);
    }
  }
});

test('Unit 3: signed answers really are negative sometimes, and the sign is not always the same', () => {
  for (const id of ['u3.dec-signed', 'u3.vt-slope']) {
    const qs = Array.from({ length: 400 }, (_, i) => instantiate(id, i + 1));
    assert.ok(qs.every((q) => q.signed), id);
    const neg = qs.filter((q) => q.answer < 0).length;
    if (id === 'u3.dec-signed') assert.equal(neg, 400, id);
    else assert.ok(neg > 80 && neg < 320, `${id}: ${neg}/400 negative`);
  }
});

test('Unit 3: realistic magnitudes', () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const a = instantiate('u3.acc-basic', seed);
    assert.ok(a.answer >= 1 && a.answer <= 5, `acc-basic ${a.answer}`);
    for (const id of ['u3.dec-signed', 'u3.dec-size', 'u3.brake-decel']) {
      const q = instantiate(id, seed);
      assert.ok(Math.abs(q.answer) <= 8 && Math.abs(q.answer) >= 1, `${id}: ${q.answer}`);
    }
    const s = instantiate('u3.vt-slope', seed);
    assert.ok(s.answer >= -8 && s.answer <= 5, `vt-slope ${s.answer}`);
    for (const id of ['u3.acc-final', 'u3.dec-speed-after', 'u3.v2-final', 'u3.suvat-avg-v', 'u3.puzzle-stopping']) {
      const q = instantiate(id, seed);
      assert.ok(q.answer <= 30, `${id}: speed ${q.answer}`);
    }
    // the sprinter tops out at 10 m/s
    const sp = instantiate('u3.wp-sprinter', seed);
    assert.ok(bold(sp)[0] <= 10, 'sprinter too fast');
    // every speed in a prompt (m/s) is at most 30, except planes
    for (const t of u3().filter((x) => x.id !== 'u3.wp-takeoff')) {
      const q = instantiate(t.id, seed);
      for (const m of stripSvg(q.prompt).matchAll(/(\d+(?:\.\d+)?) m\/s(?!²)/g)) assert.ok(Number(m[1]) <= 30, `${t.id}: ${m[0]}`);
      for (const m of stripSvg(q.prompt).matchAll(/(\d+(?:\.\d+)?) m\/s²/g)) assert.ok(Number(m[1]) <= 8, `${t.id}: ${m[0]}`);
    }
  }
});

test('Unit 3: graph points sit on gridlines and the area/slope are readable', () => {
  for (const id of ['u3.vt-slope', 'u3.vt-area-tri', 'u3.vt-area-trap', 'u3.vt-flat-mcq']) {
    for (let seed = 1; seed <= 400; seed++) {
      const q = instantiate(id, seed);
      const gridYs = new Set([...q.prompt.matchAll(/<line x1="[\d.]+" y1="([\d.]+)" x2="[\d.]+" y2="\1" class="g-grid"\/>/g)].map((m) => Number(m[1]).toFixed(1)));
      const gridXs = new Set([...q.prompt.matchAll(/<line x1="([\d.]+)" y1="[\d.]+" x2="\1" y2="[\d.]+" class="g-grid"\/>/g)].map((m) => Number(m[1]).toFixed(1)));
      const pts = [...q.prompt.match(/<path d="([^"]+)"/)[1].matchAll(/[ML]([\d.]+),([\d.]+)/g)];
      for (const [, x, y] of pts) {
        assert.ok(gridXs.has(Number(x).toFixed(1)), `${id}: x=${x} off grid`);
        assert.ok(gridYs.has(Number(y).toFixed(1)), `${id}: y=${y} off grid`);
      }
      // every gridline that a point sits on has a label (no counting needed)
      const labels = new Set([...q.prompt.matchAll(/<text x="33" y="([\d.]+)"/g)].map((m) => (Number(m[1]) - 4).toFixed(1)));
      for (const [, , y] of pts) assert.ok(labels.has(Number(y).toFixed(1)), `${id}: y=${y} has no label`);
    }
  }
});

test('Unit 3: mcq choices are unique with the answer in range', () => {
  for (const t of u3()) {
    for (let seed = 1; seed <= 200; seed++) {
      const q = instantiate(t.id, seed);
      if (q.type !== 'mcq') continue;
      assert.ok(q.answer >= 0 && q.answer < q.choices.length, t.id);
      assert.equal(new Set(q.choices).size, q.choices.length, `${t.id} seed ${seed}`);
    }
  }
});

test('Unit 3: quadratic problems always have whole-number roots, one positive', () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    for (const id of ['u3.quad-solve', 'u3.quad-time', 'u3.quad-time4', 'u3.puzzle-catchup', 'u3.puzzle-stopping']) {
      const q = instantiate(id, seed);
      assert.ok(Number.isInteger(q.answer) && q.answer > 0, `${id}: ${q.answer}`);
      // the solution shows a factorisation whose brackets give the answer
      assert.ok(new RegExp(`[(]${id === 'u3.puzzle-stopping' ? 'u' : 't'} − ${q.answer}[)]`).test(q.solution), `${id}: ${q.solution}`);
    }
  }
});

// ---------- Simulations ----------
const sims = unit3.sessions.flatMap((s) => s.steps.filter((x) => x.type === 'sim').map((x) => ({ s: s.id, ...x })));

function initialResult(step) {
  const p = step.params;
  if (step.widget === 'u3-dashboard') return { u: p.u, a: p.a, t: p.t, v: p.u + p.a * p.t };
  if (step.widget === 'u3-brakes') return { u: p.u, b: p.b, time: p.u / p.b, dist: (p.u * p.u) / (2 * p.b) };
  if (step.widget === 'u3-vt-builder') {
    const pieces = p.mode === 'single' ? [{ v: p.v, dt: p.t }] : p.pieces;
    let v0 = p.mode === 'single' ? p.u : 0;
    const segs = pieces.map((pc) => { const sg = { v0, v1: pc.v, dt: pc.dt }; v0 = pc.v; return sg; });
    const total = segs.reduce((a, s) => a + ((s.v0 + s.v1) / 2) * s.dt, 0);
    return { pieces: segs, total, u: segs[0].v0, v: segs[segs.length - 1].v1, t: segs.reduce((a, s) => a + s.dt, 0) };
  }
  return null;
}

test('Unit 3 sims: only "run it as-is" tasks pass with the starting settings', () => {
  for (const step of sims) {
    if (!step.params?.tasks) continue;
    const r = initialResult(step);
    const passes = step.params.tasks.map((t) => t.check(r));
    const asIs = /as it is|as-is|Watch|Brake from|Start from rest with/i.test(step.html + step.params.tasks[0].text);
    if (asIs) assert.equal(passes[0], true, `${step.s}: first task should pass as-is`);
    else assert.equal(passes[0], false, `${step.s}: first task passes without changes`);
    assert.ok(passes.slice(1).every((x) => !x), `${step.s}: a later task is already done at the start`);
  }
});

test('Unit 3 sims: every task has a reachable solution with the slider steps', () => {
  // Brute-force the slider grids.
  for (const step of sims) {
    if (!step.params?.tasks) continue;
    for (const task of step.params.tasks) {
      let found = false;
      if (step.widget === 'u3-dashboard') {
        for (let u = 0; u <= 20 && !found; u++) for (let a = 0; a <= 5; a += 0.5) for (let t = 1; t <= 10; t++) if (task.check({ u, a, t, v: u + a * t })) found = true;
      } else if (step.widget === 'u3-brakes') {
        for (let u = 5; u <= 30 && !found; u++) for (let b = 1; b <= 8; b += 0.5) if (task.check({ u, b, time: u / b, dist: (u * u) / (2 * b) })) found = true;
      } else if (step.widget === 'u3-vt-builder' && step.params.mode === 'single') {
        for (let u = 0; u <= 20 && !found; u++) for (let v = 0; v <= 20; v++) for (let t = 1; t <= 10; t++) if (task.check({ pieces: [{ v0: u, v1: v, dt: t }], total: ((u + v) / 2) * t, u, v, t })) found = true;
      } else if (step.widget === 'u3-vt-builder') {
        const sp = [0, 2, 4, 5, 6, 8, 10, 12, 15, 20];
        for (const v1 of sp) for (const v2 of sp) for (const v3 of [0, ...sp]) for (let d1 = 1; d1 <= 8; d1++) for (let d2 = 1; d2 <= 8; d2++) for (let d3 = 1; d3 <= 8; d3++) {
          if (found) break;
          const pieces = [{ v0: 0, v1, dt: d1 }, { v0: v1, v1: v2, dt: d2 }, { v0: v2, v1: v3, dt: d3 }];
          const total = pieces.reduce((a, s) => a + ((s.v0 + s.v1) / 2) * s.dt, 0);
          if (task.check({ pieces, total, u: 0, v: v3, t: d1 + d2 + d3 })) found = true;
        }
      }
      assert.ok(found, `${step.s}: no slider setting solves "${task.text}"`);
    }
  }
});

test('Unit 3 boss: traffic rounds use nice numbers within realistic limits', () => {
  for (let seed = 1; seed <= 300; seed++) {
    const rng = makeRng(seed);
    for (const type of ['stop', 'brakepoint', 'go']) {
      const R = trafficRound(rng, type);
      if (type === 'stop') {
        assert.ok(Number.isInteger(R.d) && R.d >= 12 && R.d <= 60 && R.b <= 8 && R.b >= 1, JSON.stringify(R));
        assert.equal((R.u * R.u) / (2 * R.b), R.d);
        assert.ok(Number.isInteger(R.b * 2), 'deceleration must be on the 0.5 slider grid');
      } else if (type === 'brakepoint') {
        assert.ok(Number.isInteger(R.p) && R.p >= 10 && R.D <= 90, JSON.stringify(R));
        assert.equal(R.p + (R.u * R.u) / (2 * R.b), R.D);
      } else {
        assert.ok(Number.isInteger(R.D) && R.D >= 12 && R.a <= 5 && R.a * R.T <= 20 && Number.isInteger(R.a * 2), JSON.stringify(R));
        assert.equal(0.5 * R.a * R.T * R.T, R.D);
      }
    }
  }
});

test('Unit 3 factor finder problems have whole-number roots within the slider range', () => {
  const step = sims.find((x) => x.widget === 'u3-factor');
  for (const { u, s } of step.params.problems) {
    const r = posRoot(u, -s);
    assert.ok(Number.isInteger(r) && r > 0 && u + r <= 12, `${u}, ${s}`);
  }
});

test('Unit 3: structure follows the brief', () => {
  const ids = unit3.sessions.map((s) => s.id);
  assert.deepEqual(ids, ['mech.u3.l1', 'mech.u3.l2', 'mech.u3.l3', 'mech.u3.l4', 'mech.u3.l5', 'mech.u3.lq', 'mech.u3.psA', 'mech.u3.psB', 'mech.u3.review', 'mech.u3.boss']);
  const n = (s) => s.steps.filter((x) => ['q', 'mcq', 'numeric', 'equation'].includes(x.type)).length;
  for (const s of unit3.sessions.filter((x) => x.type === 'lesson')) assert.ok(n(s) >= 6 && n(s) <= 8, `${s.id}: ${n(s)} questions`);
  const get = (id) => unit3.sessions.find((s) => s.id === id);
  assert.ok(n(get('mech.u3.psA')) >= 8 && n(get('mech.u3.psA')) <= 10);
  assert.ok(n(get('mech.u3.psB')) >= 7 && n(get('mech.u3.psB')) <= 9);
  assert.equal(n(get('mech.u3.review')), 10);
  const review = get('mech.u3.review').steps.filter((x) => x.type === 'q').map((x) => x.t);
  assert.equal(review.filter((t) => /^u[12]\./.test(t)).length, 2);
  const puzzles = get('mech.u3.psB').steps.filter((x) => x.type === 'q' && allTemplates().find((t) => t.id === x.t).puzzle);
  assert.ok(puzzles.length >= 1 && puzzles.length <= 2);
  // every concept used has a readable name
  for (const t of u3()) for (const c of t.concepts) assert.ok(unit3.conceptNames[c], `${t.id}: concept ${c} has no name`);
});
