// Question renderers. Each returns { evaluate() → { correct, html }, lock(), usedHint }.
// ctx.setReady(bool) enables the CHECK button.

import { h, fmt, parseNumber, closeEnough, makeRng, typedUnit, sameUnit } from '../core/util.js';
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
  // The answer is shown in a display, not a text field, and typed on an on-screen number pad,
  // so the iPad keyboard never pops up and covers the screen. A physical keyboard still works.
  let value = '';
  let locked = false;
  const display = h('div', { class: 'num-input num-display', role: 'textbox', 'aria-label': 'Your answer', 'aria-live': 'polite' });
  const unitBox = h('div', { class: 'unit-box' });
  const hintBox = h('div', { class: 'hint-box' });
  const ready = () => ctx.setReady(parseNumber(value) != null && !!unit);
  const MAX_LEN = 12;

  function render() {
    display.textContent = value ? value.replace(/^-/, '−') : '';
    display.classList.toggle('empty', !value);
    ready();
  }
  function press(key) {
    if (locked) return;
    if (key === 'back') value = value.slice(0, -1);
    else if (key === 'clear') value = '';
    else if (key === 'sign') value = value.startsWith('-') ? value.slice(1) : `-${value}`;
    else if (key === '.') {
      if (!value.replace('-', '').includes('.') && value.replace('-', '').length < MAX_LEN) value += value.replace('-', '') === '' ? '0.' : '.';
    } else if (/^\d$/.test(key) && value.replace('-', '').length < MAX_LEN) {
      value = value.replace(/^(-?)0$/, '$1') + key; // no leading zeros like "07"
    }
    sfx.click();
    render();
  }

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

  // Number pad: digits, decimal point, ± (only when the answer can be negative), delete and clear.
  const key = (label, k, cls = '', aria) => h('button', {
    class: `kp-key ${cls}`, type: 'button', 'aria-label': aria || label, 'data-key': k,
    onClick: () => press(k),
    // Keep focus off the pad so a later Enter checks the answer instead of re-pressing the key.
    onMousedown: (e) => e.preventDefault(),
  }, label);
  const pad = h('div', { class: 'keypad', role: 'group', 'aria-label': 'Number pad' },
    ...['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((d) => key(d, d)),
    q.signed ? key('±', 'sign', 'kp-fn', 'Change sign (plus or minus)') : key('.', '.', 'kp-fn', 'Decimal point'),
    key('0', '0'),
    q.signed ? key('.', '.', 'kp-fn', 'Decimal point') : key('⌫', 'back', 'kp-fn', 'Delete'),
    ...(q.signed ? [key('⌫ Delete', 'back', 'kp-fn kp-wide', 'Delete'), key('Clear', 'clear', 'kp-fn kp-clear', 'Clear')] : [key('Clear', 'clear', 'kp-fn kp-clear kp-full', 'Clear')]),
  );

  // Physical keyboards (laptops): digits, ".", "-", Backspace, Delete/Escape to clear. Enter is handled by the runner.
  const onKey = (e) => {
    if (locked || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('.modal-back')) return;
    const k = e.key;
    if (/^\d$/.test(k) || k === '.' || k === ',') press(k === ',' ? '.' : k);
    else if ((k === '-' || k === '−') && q.signed) press('sign');
    else if (k === 'Backspace') press('back');
    else if (k === 'Delete' || k === 'Escape') press('clear');
    else return;
    e.preventDefault();
  };
  window.addEventListener('keydown', onKey);

  const main = h('div', { class: 'q-main' },
    header(q),
    h('div', { class: 'q-prompt', html: q.prompt }),
    h('div', { class: 'num-row' }, display, unitBox),
    h('div', { class: 'unit-note' }, q.unitChoices ? 'Pick the unit too! ' : '', h('span', { class: 'enter-note' }, 'Type with the keypad or your keyboard, then press Enter ↵.')),
    hintBtn ? h('div', { class: 'hint-row' }, hintBtn) : '',
    hintBox,
  );
  el.append(h('div', { class: 'q-with-pad' }, main, pad));
  render();

  return {
    get usedHint() {
      return usedHint;
    },
    calc: true,
    lock() {
      locked = true;
      window.removeEventListener('keydown', onKey);
      display.classList.add('locked');
      pad.querySelectorAll('button').forEach((b) => (b.disabled = true));
      unitBox.querySelectorAll('button').forEach((b) => (b.disabled = true));
      if (hintBtn) hintBtn.disabled = true;
    },
    destroy() {
      window.removeEventListener('keydown', onKey);
    },
    evaluate() {
      const v = parseNumber(value);
      const numOk = v != null && closeEnough(v, q.answer, q.tolerance);
      const typed = typedUnit(value);
      const typedOk = !typed || !q.unit || sameUnit(typed, q.unit);
      const unitOk = (!q.unitChoices || unit === q.unit) && typedOk;
      const correct = numOk && unitOk;
      const ans = `<b>${fmt(q.answer)}${q.unit ? ' ' + q.unit : ''}</b>`;
      // A predictable wrong answer gets a message about that specific mistake.
      const known = !correct && v != null && (q.errors || []).find((e) =>
        Number.isFinite(e.value) && !closeEnough(e.value, q.answer, q.tolerance) && closeEnough(v, e.value, q.tolerance));
      let html;
      if (correct) html = q.solution ? `<div class="sol">${q.solution}</div>` : '';
      else if (numOk && !typedOk) html = `You wrote <b>${typed}</b>, but this answer is in <b>${q.unit}</b>.${q.solution ? `<div class="sol">${q.solution}</div>` : ''}`;
      else if (numOk && !unitOk) html = `The number is right, but the unit should be <b>${q.unit}</b>.${q.solution ? `<div class="sol">${q.solution}</div>` : ''}`;
      else html = `${known ? `<div class="mistake">${known.msg}</div>` : ''}Correct answer: ${ans}${q.solution ? `<div class="sol">${q.solution}</div>` : ''}`;
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
      class: 'choice', type: 'button', html: q.choices[ci], 'aria-pressed': 'false',
      onClick: () => {
        picked = ci;
        list.querySelectorAll('.choice').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
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
    lockNeutral() {
      list.querySelectorAll('.choice').forEach((b) => (b.disabled = true));
    },
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
