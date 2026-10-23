// Question renderers. Each returns { evaluate() → { correct, html }, lock(), usedHint }.
// ctx.setReady(bool) enables the CHECK button.

import { h, fmt, parseNumber, closeEnough, makeRng } from '../core/util.js';
import { sfx } from '../core/sound.js';

export function renderQuestion(el, q, ctx) {
  switch (q.type) {
    case 'numeric': return numeric(el, q, ctx);
    case 'mcq': return mcq(el, q, ctx);
    case 'equation': return equation(el, q, ctx);
    default: throw new Error(`Unknown question type ${q.type}`);
  }
}

function header(q) {
  const tierName = { explorer: 'Explorer', scientist: 'Scientist', engineer: 'Engineer' }[q.tier];
  return h('div', { class: 'q-head' },
    q.puzzle ? h('span', { class: 'tier puzzle' }, '⭐ Puzzle Corner') : tierName ? h('span', { class: `tier ${q.tier}` }, tierName) : '',
    q.review ? h('span', { class: 'tier review' }, '↻ Review') : '',
  );
}

// ---------- Numeric answer with optional unit picker ----------
function numeric(el, q, ctx) {
  let unit = q.unitChoices ? null : q.unit;
  let hintIdx = 0;
  let usedHint = false;
  const input = h('input', {
    class: 'num-input', type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: 'your answer',
    'aria-label': 'Your answer',
  });
  const unitBox = h('div', { class: 'unit-box' });
  const hintBox = h('div', { class: 'hint-box' });
  const ready = () => ctx.setReady(parseNumber(input.value) != null && !!unit);

  if (q.unitChoices) {
    for (const u of q.unitChoices) {
      const b = h('button', {
        class: 'unit-chip', type: 'button',
        onClick: () => {
          unit = u;
          unitBox.querySelectorAll('.unit-chip').forEach((x) => x.classList.toggle('on', x === b));
          sfx.select();
          ready();
        },
      }, u);
      unitBox.append(b);
    }
  } else if (q.unit) {
    unitBox.append(h('span', { class: 'unit-fixed' }, q.unit));
  }

  const hintBtn = q.hints?.length
    ? h('button', {
        class: 'mc-btn small hint-btn', type: 'button',
        onClick: () => {
          if (hintIdx >= q.hints.length) return;
          usedHint = true;
          hintBox.append(h('div', { class: 'hint', html: `💡 ${q.hints[hintIdx++]}` }));
          if (hintIdx >= q.hints.length) hintBtn.disabled = true;
          sfx.click();
        },
      }, 'Hint')
    : null;

  input.addEventListener('input', ready);

  // iPad number keyboards can lack a minus key, so signed answers get a ± button.
  const signBtn = q.signed
    ? h('button', {
        class: 'mc-btn small sign-btn', type: 'button', 'aria-label': 'Change sign',
        onClick: () => {
          const v = input.value.trim().replace(/^[−–]/, '-');
          input.value = v.startsWith('-') ? v.slice(1) : `-${v.replace(/^\+/, '')}`;
          sfx.click();
          ready();
        },
      }, '±')
    : null;

  el.append(
    header(q),
    h('div', { class: 'q-prompt', html: q.prompt }),
    h('div', { class: 'num-row' }, signBtn, input, unitBox),
    q.unitChoices ? h('div', { class: 'unit-note' }, 'Pick the unit too!') : '',
    hintBtn ? h('div', { class: 'hint-row' }, hintBtn) : '',
    hintBox,
  );
  setTimeout(() => input.focus({ preventScroll: true }), 50);

  return {
    get usedHint() {
      return usedHint;
    },
    calc: true,
    lock() {
      input.disabled = true;
      unitBox.querySelectorAll('button').forEach((b) => (b.disabled = true));
      if (hintBtn) hintBtn.disabled = true;
      if (signBtn) signBtn.disabled = true;
    },
    evaluate() {
      const v = parseNumber(input.value);
      const numOk = v != null && closeEnough(v, q.answer, q.tolerance);
      const unitOk = !q.unitChoices || unit === q.unit;
      const correct = numOk && unitOk;
      const ans = `<b>${fmt(q.answer)}${q.unit ? ' ' + q.unit : ''}</b>`;
      let html;
      if (correct) html = q.solution ? `<div class="sol">${q.solution}</div>` : '';
      else if (numOk && !unitOk) html = `The number is right, but the unit should be <b>${q.unit}</b>.${q.solution ? `<div class="sol">${q.solution}</div>` : ''}`;
      else html = `Correct answer: ${ans}${q.solution ? `<div class="sol">${q.solution}</div>` : ''}`;
      return { correct, html };
    },
  };
}

// ---------- Multiple choice ----------
function mcq(el, q, ctx) {
  const rng = makeRng(q.seed ?? 1);
  const order = q.keepOrder ? q.choices.map((_, i) => i) : rng.shuffle(q.choices.map((_, i) => i));
  let picked = null;
  const list = h('div', { class: `choices ${q.grid ? 'grid' : ''}` });
  order.forEach((ci) => {
    const b = h('button', {
      class: 'choice', type: 'button', html: q.choices[ci],
      onClick: () => {
        picked = ci;
        list.querySelectorAll('.choice').forEach((x) => x.classList.toggle('on', x === b));
        sfx.select();
        ctx.setReady(true);
      },
    });
    b.dataset.ci = ci;
    list.append(b);
  });
  el.append(header(q), h('div', { class: 'q-prompt', html: q.prompt }), list);
  return {
    usedHint: false,
    lock() {
      list.querySelectorAll('.choice').forEach((b) => {
        b.disabled = true;
        const ci = Number(b.dataset.ci);
        if (ci === q.answer) b.classList.add('right');
        else if (ci === picked) b.classList.add('wrong');
      });
    },
    evaluate() {
      const correct = picked === q.answer;
      const html = (correct ? '' : `Correct answer: <b>${q.choices[q.answer]}</b>`) + (q.explain ? `<div class="sol">${q.explain}</div>` : '');
      return { correct, html, picked };
    },
  };
}

// ---------- Equation builder: tap tiles to build the right-hand side ----------
function equation(el, q, ctx) {
  const rng = makeRng(q.seed ?? 2);
  const tiles = rng.shuffle(q.tiles.map((t, i) => ({ t, i })));
  let built = [];
  const slot = h('div', { class: 'eq-slot' });
  const bank = h('div', { class: 'eq-bank' });

  function render() {
    slot.innerHTML = '';
    slot.append(h('span', { class: 'eq-lhs' }, `${q.lhs} =`));
    if (!built.length) slot.append(h('span', { class: 'eq-placeholder' }, 'tap tiles below'));
    built.forEach((tile, k) => {
      slot.append(h('button', {
        class: 'eq-tile placed', type: 'button',
        onClick: () => { built.splice(k, 1); sfx.click(); render(); },
      }, tile.t));
    });
    bank.innerHTML = '';
    for (const tile of tiles) {
      const used = built.includes(tile);
      bank.append(h('button', {
        class: `eq-tile ${used ? 'used' : ''}`, type: 'button', disabled: used,
        onClick: () => { built.push(tile); sfx.select(); render(); },
      }, tile.t));
    }
    ctx.setReady(built.length > 0);
  }

  el.append(header(q), h('div', { class: 'q-prompt', html: q.prompt }), slot, bank);
  render();
  return {
    usedHint: false,
    lock() {
      el.querySelectorAll('.eq-tile').forEach((b) => (b.disabled = true));
    },
    evaluate() {
      const mine = built.map((x) => x.t).join(' ');
      const correct = q.answers.some((a) => a.join(' ') === mine);
      const html = (correct ? '' : `One correct answer: <b>${q.lhs} = ${q.answers[0].join(' ')}</b>`) + (q.explain ? `<div class="sol">${q.explain}</div>` : '');
      return { correct, html };
    },
  };
}
