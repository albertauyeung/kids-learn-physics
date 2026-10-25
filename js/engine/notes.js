// Cheat-sheet panel ("📖 Notes") shown beside a session: the key equations and reminders of
// the lessons learnt so far. The current lesson comes first; earlier units are folded away.

import { h } from '../core/util.js';

// sections: [{ title, lessons: [{ id, title, notes: { eq: [], tips: [] } }], open }]
export function notesPanel(sections, currentId, { onToggle } = {}) {
  let isOpen = false;
  const closeBtn = h('button', { class: 'icon-btn notes-close', type: 'button', 'aria-label': 'Close notes', onClick: () => toggle(false) }, '✕');
  const body = h('div', { class: 'notes-body' });
  const el = h('aside', { class: 'notes-panel', 'aria-label': 'Cheat sheet', hidden: true },
    h('div', { class: 'notes-head' }, h('h2', {}, '📖 Cheat sheet'), closeBtn),
    body);

  const card = (l) => h('section', { class: `notes-card ${l.id === currentId ? 'current' : ''}` },
    h('h3', {}, l.title, l.id === currentId ? h('span', { class: 'notes-now' }, 'this lesson') : ''),
    h('div', { class: 'notes-eqs' }, l.notes.eq.map((e) => h('div', { class: 'notes-eq', html: e }))),
    l.notes.tips?.length ? h('ul', { class: 'notes-tips' }, l.notes.tips.map((t) => h('li', { html: t }))) : '');

  for (const s of sections) {
    // This lesson first, then the rest of the unit in course order.
    const lessons = [...s.lessons].sort((a, b) => (b.id === currentId) - (a.id === currentId));
    const cards = lessons.map(card);
    body.append(s.open
      ? h('div', { class: 'notes-unit' }, h('h3', { class: 'notes-unit-title' }, s.title), cards)
      : h('details', { class: 'notes-unit' }, h('summary', { class: 'notes-unit-title' }, s.title), cards));
  }
  if (!sections.some((s) => s.lessons.length)) body.append(h('p', { class: 'muted' }, 'Notes appear here as you finish lessons.'));

  function toggle(open = !isOpen) {
    isOpen = open;
    el.hidden = !open;
    onToggle?.(open);
    if (open) body.scrollTop = 0;
  }
  return { el, toggle, get open() { return isOpen; } };
}
