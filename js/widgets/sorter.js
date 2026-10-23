// Tap items in order (e.g. shortest → longest). Teaches unit conversion by comparison.
// params: { prompt, items: [{ label, value, note? }], seed }

import { h, makeRng, randomSeed } from '../core/util.js';
import { sfx } from '../core/sound.js';

export default function sorter(el, params, api) {
  const rng = makeRng(params.seed ?? randomSeed());
  const items = rng.shuffle(params.items.map((it, i) => ({ ...it, i })));
  const sortedValues = params.items.map((it) => it.value).sort((a, b) => a - b);
  let chosen = [];
  let solved = false;

  const pool = h('div', { class: 'sorter-pool' });
  const row = h('div', { class: 'sorter-row' });
  const msg = h('div', { class: 'sorter-msg' }, params.prompt || 'Tap the lengths in order, shortest first. Tap a placed one to take it back.');
  const reset = h('button', { class: 'mc-btn small', type: 'button', onClick: () => { if (solved) return; chosen = []; render(); } }, 'Reset');
  el.append(h('div', { class: 'sorter' }, msg, h('div', { class: 'sorter-label' }, 'Your order:'), row, h('div', { class: 'sorter-label' }, 'Items:'), pool, reset));

  function render() {
    pool.innerHTML = '';
    row.innerHTML = '';
    for (const it of items) {
      const used = chosen.includes(it);
      pool.append(
        h('button', {
          class: `sorter-item ${used ? 'used' : ''}`,
          type: 'button',
          disabled: used,
          onClick: () => {
            sfx.select();
            chosen.push(it);
            render();
            if (chosen.length === items.length) check();
          },
        }, it.label),
      );
    }
    chosen.forEach((it, idx) => {
      row.append(h('button', {
        class: 'sorter-slot', type: 'button', title: 'Tap to take back',
        disabled: solved,
        onClick: () => { chosen.splice(idx, 1); sfx.click(); msg.textContent = 'Tap a placed item to take it back.'; render(); },
      }, h('small', {}, `${idx + 1}.`), it.label));
    });
    for (let i = chosen.length; i < items.length; i++) row.append(h('span', { class: 'sorter-slot empty' }, `${i + 1}.`));
  }

  function check() {
    const ok = chosen.every((it, i) => Math.abs(it.value - sortedValues[i]) < 1e-9);
    const slots = row.querySelectorAll('.sorter-slot');
    chosen.forEach((it, i) => slots[i].classList.add(Math.abs(it.value - sortedValues[i]) < 1e-9 ? 'good' : 'bad'));
    if (ok) {
      solved = true;
      reset.disabled = true;
      row.querySelectorAll('button').forEach((b) => (b.disabled = true));
      msg.innerHTML = `<b class="good-text">Perfect order!</b> ${params.success || ''}`;
      sfx.correct();
      api.done();
    } else {
      msg.innerHTML = '<b class="bad-text">Not quite.</b> Convert everything to the same unit, then try again (press Reset).';
      sfx.wrong();
    }
  }

  render();
  return () => {};
}
