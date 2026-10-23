// Problem template registry. A template generates a fresh question from a seeded RNG,
// so every practice round and every retry can use new numbers.
//
// Template shape:
//   { id, concepts: [...], tier: 'explorer' | 'scientist' | 'engineer', puzzle?, achievement?,
//     generate(rng) => question }
// Question shapes (also usable inline in content):
//   { type: 'numeric', prompt, answer, unit?, unitChoices?, tolerance?, hints?, solution?, errors?: [{ value, msg }] }
//   { type: 'mcq', prompt, choices: [html], answer: index, explain?, keepOrder? }
//   { type: 'equation', prompt, lhs, tiles: [...], answers: [[...]], explain? }

import { makeRng, randomSeed } from '../core/util.js';

const registry = new Map();

export function registerTemplates(list) {
  for (const t of list) {
    if (registry.has(t.id)) throw new Error(`Duplicate template id: ${t.id}`);
    registry.set(t.id, t);
  }
}

export function hasTemplate(id) {
  return registry.has(id);
}

export function getTemplate(id) {
  const t = registry.get(id);
  if (!t) throw new Error(`Unknown template: ${id}`);
  return t;
}

export function allTemplates() {
  return [...registry.values()];
}

export function instantiate(id, seed = randomSeed()) {
  const t = getTemplate(id);
  const q = t.generate(makeRng(seed));
  return {
    ...q,
    templateId: id,
    concepts: t.concepts || [],
    tier: t.tier || 'explorer',
    puzzle: !!t.puzzle,
    achievement: t.achievement,
    seed,
  };
}

// Retry until a generated value satisfies a condition (for "nice" numbers).
export function until(rng, gen, ok, tries = 200) {
  let v;
  for (let i = 0; i < tries; i++) {
    v = gen(rng);
    if (ok(v)) return v;
  }
  return v;
}
