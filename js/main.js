// App shell: routing + screens (learn map, quests, shop, profile, session, results).

import * as S from './core/state.js';
import { h, makeRng, randomSeed } from './core/util.js';
import { sfx, setSoundEnabled } from './core/sound.js';
import { spriteImg, blockImg, textureURL } from './core/sprites.js';
import { course, playableUnits, findSession, sessionTemplates } from './content/course.js';
import { runSession } from './engine/runner.js';

const app = document.getElementById('app');
let teardown = null;

// ---------- boot ----------
S.load();
setSoundEnabled(S.state.settings.sound);
applyTextures();
S.onChange(() => renderTopbar());
window.addEventListener('hashchange', route);
route();

function applyTextures() {
  const root = document.documentElement.style;
  root.setProperty('--tex-dirt', `url(${textureURL('darkdirt', 4)})`);
  root.setProperty('--tex-grass', `url(${textureURL('grass', 4)})`);
  root.setProperty('--tex-planks', `url(${textureURL('planks', 4)})`);
  root.setProperty('--tex-stone', `url(${textureURL('stone', 4)})`);
  root.setProperty('--tex-obsidian', `url(${textureURL('obsidian', 4)})`);
}

// ---------- routing ----------
function route() {
  teardown?.();
  teardown = null;
  app.innerHTML = '';
  window.scrollTo({ top: 0 });
  if (!S.state.profile.name) return onboarding();
  const [, page, arg] = (location.hash || '#/learn').split('/');
  if (page === 'session' && arg) return sessionScreen(decodeURIComponent(arg));
  if (page === 'practice') return sessionScreen('practice');
  shell(page || 'learn');
}

function go(path) {
  if (location.hash === path) route();
  else location.hash = path;
}

// ---------- shell: top bar + bottom nav ----------
let topbarEl = null;

function shell(page) {
  topbarEl = h('header', { class: 'topbar' });
  const main = h('main', { class: 'screen' });
  const tabs = [
    ['learn', 'Learn', 'pickaxe'],
    ['quests', 'Quests', 'chest'],
    ['shop', 'Shop', 'emerald'],
    ['profile', 'Profile', 'heroHead'],
  ];
  const nav = h('nav', { class: 'bottom-nav' },
    tabs.map(([id, label, icon]) => {
      const badge = id === 'quests' && S.unclaimedQuests() ? h('span', { class: 'badge' }, String(S.unclaimedQuests())) : '';
      return h('a', { href: `#/${id}`, class: `nav-item ${page === id ? 'on' : ''}` }, spriteImg(icon, { scale: 3, cls: 'nav-icon' }), h('span', {}, label), badge);
    }),
  );
  app.append(topbarEl, main, nav);
  renderTopbar();
  ({ learn: learnScreen, quests: questsScreen, shop: shopScreen, profile: profileScreen }[page] || learnScreen)(main);
}

function renderTopbar() {
  if (!topbarEl || !topbarEl.isConnected) return;
  const st = S.state;
  const lv = S.levelInfo();
  const lit = st.streak.count > 0 && st.streak.lastDate === todayKey();
  topbarEl.innerHTML = '';
  topbarEl.append(
    h('a', { class: 'logo', href: '#/learn' }, 'BLOCK', h('span', {}, 'PHYSICS')),
    h('div', { class: 'stat', title: 'Day streak' }, spriteImg(lit ? 'torch' : st.streak.count ? 'torch' : 'torchOff', { scale: 3, cls: `stat-icon ${lit ? '' : 'dim'}` }), h('b', {}, String(st.streak.count))),
    h('div', { class: 'stat', title: 'Emeralds' }, spriteImg('emerald', { scale: 3, cls: 'stat-icon' }), h('b', {}, String(st.emeralds))),
    h('div', { class: 'lvl', title: `${lv.into}/${lv.need} XP to next level` },
      h('div', { class: 'lvl-num' }, String(lv.level)),
      h('div', { class: 'lvl-bar' }, h('div', { class: 'lvl-fill', style: { width: `${lv.progress * 100}%` } })),
    ),
  );
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---------- onboarding ----------
function onboarding() {
  let goal = 30;
  const name = h('input', { class: 'text-input', maxlength: 20, placeholder: 'Your explorer name', autocomplete: 'off' });
  const goals = [[20, 'Casual'], [30, 'Regular'], [50, 'Serious'], [80, 'Intense']];
  const goalRow = h('div', { class: 'goal-row' });
  goals.forEach(([xp, label]) => {
    const b = h('button', {
      class: `choice ${xp === goal ? 'on' : ''}`, type: 'button',
      onClick: () => { goal = xp; goalRow.querySelectorAll('.choice').forEach((x) => x.classList.toggle('on', x === b)); sfx.select(); },
    }, h('b', {}, label), h('small', {}, `${xp} XP / day`));
    goalRow.append(b);
  });
  const start = h('button', {
    class: 'mc-btn big green', type: 'button',
    onClick: () => {
      const n = name.value.trim();
      if (!n) { name.focus(); name.classList.add('shake'); setTimeout(() => name.classList.remove('shake'), 400); return; }
      S.update((s) => { s.profile.name = n; s.profile.dailyGoal = goal; });
      sfx.complete();
      go('#/learn');
    },
  }, 'Start exploring!');
  app.append(h('div', { class: 'onboard' },
    h('div', { class: 'onboard-hero' }, spriteImg('hero', { scale: 8 }), spriteImg('minecart', { scale: 6 })),
    h('h1', { class: 'title-big' }, 'BLOCK PHYSICS'),
    h('p', { class: 'lead' }, 'Learn how things move — one block at a time.'),
    h('div', { class: 'card' },
      h('label', { class: 'field' }, h('span', {}, 'What should we call you?'), name),
      h('div', { class: 'field' }, h('span', {}, 'Pick a daily goal'), goalRow),
      start,
    ),
  ));
  name.focus();
}

// ---------- learn: the map ----------
function learnScreen(main) {
  const st = S.state;
  for (const n of st.notices.splice(0)) main.append(h('div', { class: 'notice' }, n));
  if (st.notices.length === 0) S.persist();

  const d = S.today();
  const goalPct = Math.min(1, d.xp / st.profile.dailyGoal);
  const units = playableUnits();
  const nextSession = findNext(units);

  main.append(
    h('section', { class: 'card daily' },
      h('div', { class: 'daily-top' },
        h('div', {},
          h('div', { class: 'greet' }, `Hi ${st.profile.name}!`),
          h('div', { class: 'goal-text' }, d.xp >= st.profile.dailyGoal ? 'Daily goal complete! 🎉' : `Daily goal: ${d.xp} / ${st.profile.dailyGoal} XP`),
        ),
        nextSession ? h('button', { class: 'mc-btn green', type: 'button', onClick: () => go(`#/session/${nextSession.id}`) }, d.sessions ? 'Continue ▶' : 'Start ▶') : '',
      ),
      h('div', { class: 'goal-bar' }, h('div', { class: 'goal-fill', style: { width: `${goalPct * 100}%` } })),
      calendarRow(),
      st.mistakes.length
        ? h('button', { class: 'mc-btn small practice-btn', type: 'button', onClick: () => go('#/practice') }, `↻ Practise your mistakes (${uniqueMistakes().length})`)
        : '',
    ),
  );

  const track = course.tracks[0];
  track.units.forEach((unit) => {
    const uIdx = units.indexOf(unit);
    const section = h('section', { class: `unit ${unit.comingSoon ? 'soon' : ''}` });
    section.append(h('div', { class: 'unit-sign' },
      h('div', { class: 'unit-num' }, `UNIT ${unit.number}`),
      h('div', { class: 'unit-title' }, unit.title),
      h('div', { class: 'unit-sub' }, unit.comingSoon ? `Coming soon · ${unit.subtitle}` : unit.subtitle),
      unit.power ? h('div', { class: 'unit-power' }, unit.power) : '',
    ));
    if (!unit.comingSoon) {
      const path = h('div', { class: 'path' });
      unit.sessions.forEach((s, i) => {
        const status = S.sessionStatus(units, uIdx, i);
        const rec = S.sessionRecord(s.id);
        const isNext = nextSession && nextSession.id === s.id;
        const offset = Math.round(Math.sin(i * 1.1) * 70);
        const icon = status === 'locked' ? 'bedrock' : s.icon || 'grass';
        const node = h(status === 'locked' ? 'div' : 'a', {
          class: `node ${status} ${isNext ? 'next' : ''} type-${s.type}`,
          href: status === 'locked' ? null : `#/session/${s.id}`,
          style: { transform: `translateX(${offset}px)` },
          title: s.title,
        },
          h('div', { class: 'node-block' }, blockImg(icon), status === 'locked' ? spriteImg('lock', { scale: 3, cls: 'node-lock' }) : '',
            rec?.completions ? crown(rec) : '',
            S.isCracked(s.id) ? h('div', { class: 'crack', title: 'Needs review!' }) : ''),
          isNext ? h('div', { class: 'node-start' }, 'START') : '',
          h('div', { class: 'node-label' }, s.title),
        );
        path.append(node);
      });
      section.append(path);
    }
    main.append(section);
  });

  main.append(h('p', { class: 'footnote' }, 'More units coming soon: Waves, Light, Electricity & Space tracks will appear here too.'));
}

function crown(rec) {
  const lvl = Math.min(3, rec.completions);
  const tex = ['iron', 'gold', 'diamondore'][lvl - 1];
  return h('div', { class: 'crown', title: `Level ${lvl}${rec.perfect ? ' · perfect run' : ''}` }, blockImg(tex, 'crown-img'), rec.perfect ? h('span', { class: 'crown-star' }, '★') : '');
}

function calendarRow() {
  const names = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return h('div', { class: 'calendar' },
    S.streakCalendar(7).map((d) => {
      const dow = names[new Date(`${d.date}T12:00:00`).getDay()];
      return h('div', { class: `cal-day ${d.active ? 'active' : ''} ${d.frozen ? 'frozen' : ''} ${d.today ? 'today' : ''}` },
        h('small', {}, dow),
        d.active ? spriteImg('torch', { scale: 2, cls: 'cal-icon' }) : d.frozen ? spriteImg('ice', { scale: 2, cls: 'cal-icon' }) : h('span', { class: 'cal-dot' }),
      );
    }),
  );
}

function findNext(units) {
  for (let u = 0; u < units.length; u++) {
    for (let i = 0; i < units[u].sessions.length; i++) {
      if (S.sessionStatus(units, u, i) === 'open') return units[u].sessions[i];
    }
  }
  return null;
}

function uniqueMistakes() {
  return [...new Set(S.state.mistakes.map((m) => m.templateId))];
}

// ---------- session ----------
function sessionScreen(id) {
  let found;
  if (id === 'practice') {
    const ids = uniqueMistakes().slice(-8);
    if (!ids.length) return go('#/learn');
    found = {
      unit: null,
      session: { id: 'practice', type: 'lesson', title: 'Mistake Review', steps: ids.map((t) => ({ type: 'q', t, review: true })) },
    };
  } else {
    found = findSession(id);
  }
  if (!found) return go('#/learn');
  const { unit, session } = found;
  const units = playableUnits();
  if (id !== 'practice') {
    const uIdx = units.indexOf(unit);
    const sIdx = unit.sessions.indexOf(session);
    if (S.sessionStatus(units, uIdx, sIdx) === 'locked') return go('#/learn');
  }
  const review = session.type === 'lesson' && id !== 'practice' ? warmupReview(units, session) : [];
  const destroy = runSession(app, {
    session, unit, review,
    onQuit: () => go('#/learn'),
    onFinish: (result) => {
      const rewards = S.completeSession(session, unit, result);
      resultsScreen(session, result, rewards);
    },
  });
  teardown = destroy;
}

// Up to 2 warm-up questions: mistakes first, then random earlier templates.
function warmupReview(units, current) {
  const done = [];
  for (const u of units) for (const s of u.sessions) if (s.id !== current.id && S.sessionRecord(s.id)?.completions) done.push(...sessionTemplates(s));
  const rng = makeRng(randomSeed());
  const picks = [];
  for (const m of rng.shuffle(uniqueMistakes())) if (picks.length < 1) picks.push(m);
  for (const t of rng.shuffle([...new Set(done)])) if (picks.length < 2 && !picks.includes(t)) picks.push(t);
  return picks;
}

// ---------- results ----------
function resultsScreen(session, result, rewards) {
  teardown?.();
  teardown = null;
  app.innerHTML = '';
  sfx.complete();
  const title = session.type === 'boss' ? 'BOSS DEFEATED!' : session.type === 'problems' ? 'Problem set complete!' : 'Lesson complete!';
  const xpEl = h('b', {}, '+0');
  const tiles = h('div', { class: 'result-tiles' },
    resultTile('Total XP', xpEl, 'xporb', 'xp'),
    resultTile('Accuracy', `${Math.round(result.accuracy * 100)}%`, 'flag', 'acc'),
    resultTile('Emeralds', `+${rewards.emeralds}`, 'emerald', 'em'),
  );
  const extras = h('div', { class: 'result-extras' });
  if (result.perfect) extras.append(h('div', { class: 'pill gold' }, '★ Perfect — no mistakes!'));
  if (result.bestCombo >= 5) extras.append(h('div', { class: 'pill' }, `🔥 Best combo: ${result.bestCombo}`));
  if (rewards.potion) extras.append(h('div', { class: 'pill pink' }, 'XP Potion: double XP!'));
  if (rewards.streakExtended) extras.append(h('div', { class: 'pill fire' }, spriteImg('torch', { scale: 2, cls: 'pill-icon' }), `${S.state.streak.count}-day streak!`));
  if (rewards.goalReached) extras.append(h('div', { class: 'pill green' }, 'Daily goal reached! +5 emeralds'));
  if (rewards.levelUp) extras.append(h('div', { class: 'pill levelup' }, `LEVEL UP! You are now level ${rewards.levelUp}`));
  for (const a of rewards.newAchievements) {
    const def = S.ACHIEVEMENTS[a];
    if (def) extras.append(h('div', { class: 'pill ach-pill' }, spriteImg(def.icon === 'diamond' ? 'diamond' : def.icon, { scale: 2, cls: 'pill-icon' }), `Achievement: ${def.name}`));
  }

  app.append(h('div', { class: 'results' },
    h('div', { class: 'results-art' }, spriteImg('chestOpen', { scale: 8 }), spriteImg('hero', { scale: 6, cls: 'jump' })),
    h('h1', { class: 'title-big' }, title),
    h('div', { class: 'results-sub' }, session.title),
    tiles,
    extras,
    h('button', { class: 'mc-btn big green', type: 'button', onClick: () => go('#/learn') }, 'Continue'),
  ));

  // XP count-up with orb sounds
  let shown = 0;
  const step = Math.max(1, Math.round(rewards.xp / 15));
  const timer = setInterval(() => {
    shown = Math.min(rewards.xp, shown + step);
    xpEl.textContent = `+${shown}`;
    sfx.orb();
    if (shown >= rewards.xp) {
      clearInterval(timer);
      if (rewards.levelUp) setTimeout(() => sfx.levelup(), 200);
    }
  }, 60);
  teardown = () => clearInterval(timer);
}

function resultTile(label, value, icon, cls) {
  return h('div', { class: `result-tile ${cls}` }, h('div', { class: 'rt-label' }, label), h('div', { class: 'rt-value' }, spriteImg(icon, { scale: 3, cls: 'rt-icon' }), value));
}

// ---------- quests ----------
function questsScreen(main) {
  const render = () => {
    main.innerHTML = '';
    main.append(h('h1', { class: 'screen-title' }, 'Daily Quests'), h('p', { class: 'muted' }, 'New quests every day. Complete them to earn emeralds!'));
    for (const q of S.todaysQuests()) {
      main.append(h('div', { class: `card quest ${q.done ? 'done' : ''}` },
        spriteImg(q.claimed ? 'chestOpen' : 'chest', { scale: 4, cls: 'quest-icon' }),
        h('div', { class: 'quest-body' },
          h('div', { class: 'quest-text' }, q.text),
          h('div', { class: 'goal-bar small' }, h('div', { class: 'goal-fill', style: { width: `${(q.progress / q.target) * 100}%` } })),
          h('small', {}, `${q.progress} / ${q.target}`),
        ),
        q.claimed
          ? h('span', { class: 'claimed' }, 'Claimed')
          : h('button', {
              class: `mc-btn small ${q.done ? 'green' : ''}`, type: 'button', disabled: !q.done,
              onClick: () => { const n = S.claimQuest(q.id); if (n) { sfx.coin(); toast(`+${n} emeralds!`); } render(); },
            }, h('span', {}, `+${q.reward} `), spriteImg('emerald', { scale: 2, cls: 'inline-icon' })),
      ));
    }
    const lv = S.levelInfo();
    main.append(h('div', { class: 'card' },
      h('h2', {}, 'Your progress'),
      h('p', {}, `Level ${lv.level} · ${S.state.xp} XP total · ${lv.need - lv.into} XP to level ${lv.level + 1}`),
      h('p', {}, `Best streak: ${S.state.streak.best} days · Streak freezes: ${S.state.streak.freezes}`),
    ));
  };
  render();
}

// ---------- shop ----------
function shopScreen(main) {
  const render = () => {
    main.innerHTML = '';
    main.append(
      h('h1', { class: 'screen-title' }, 'Shop'),
      h('div', { class: 'wallet' }, spriteImg('emerald', { scale: 4 }), h('b', {}, `${S.state.emeralds} emeralds`)),
      h('h2', { class: 'section-title' }, 'Power-ups'),
    );
    for (const [id, item] of Object.entries(S.SHOP_ITEMS)) {
      const owned = id === 'freeze' ? `You have ${S.state.streak.freezes}/2` : S.state.potion ? 'Active for your next session' : '';
      main.append(h('div', { class: 'card shop-item' },
        spriteImg(item.icon, { scale: 5, cls: 'shop-icon' }),
        h('div', { class: 'shop-body' }, h('b', {}, item.name), h('small', {}, item.desc), owned ? h('small', { class: 'owned' }, owned) : ''),
        buyButton(id, item.price, render),
      ));
    }
    main.append(h('h2', { class: 'section-title' }, 'Skins for Pip'));
    const grid = h('div', { class: 'skin-grid' });
    for (const [id, skin] of Object.entries(S.SKINS)) {
      const owned = S.state.skins.owned.includes(id);
      const active = S.state.skins.active === id;
      grid.append(h('div', { class: `card skin ${active ? 'active' : ''}` },
        spriteImg('hero', { scale: 6, skin: skin.colors }),
        h('b', {}, skin.name),
        active ? h('span', { class: 'claimed' }, 'Wearing') : owned
          ? h('button', { class: 'mc-btn small', type: 'button', onClick: () => { S.buy(id); sfx.select(); render(); } }, 'Wear')
          : buyButton(id, skin.price, render),
      ));
    }
    main.append(grid);
  };
  render();
}

function buyButton(id, price, after) {
  return h('button', {
    class: 'mc-btn small green', type: 'button', disabled: S.state.emeralds < price,
    onClick: () => {
      const r = S.buy(id);
      if (r.ok) {
        sfx.coin();
        toast('Purchased!');
        for (const a of r.unlocked || []) toast(`Achievement: ${S.ACHIEVEMENTS[a].name}`);
      } else {
        sfx.wrong();
        toast(r.reason);
      }
      after();
    },
  }, h('span', {}, `${price} `), spriteImg('emerald', { scale: 2, cls: 'inline-icon' }));
}

// ---------- profile ----------
function profileScreen(main) {
  const st = S.state;
  const lv = S.levelInfo();
  const answered = Object.values(st.daily).reduce((a, d) => a + d.answered, 0);
  const correct = Object.values(st.daily).reduce((a, d) => a + d.correct, 0);
  const sessionsDone = Object.values(st.sessions).reduce((a, s) => a + s.completions, 0);

  main.append(
    h('div', { class: 'card profile-head' },
      spriteImg('hero', { scale: 6 }),
      h('div', {},
        h('h1', { class: 'screen-title' }, st.profile.name),
        h('div', {}, `Level ${lv.level} · ${st.xp} XP`),
        h('div', { class: 'muted' }, `Exploring since ${st.profile.createdAt}`),
      ),
    ),
    h('div', { class: 'stat-grid' },
      statBox('Current streak', `${st.streak.count} days`),
      statBox('Best streak', `${st.streak.best} days`),
      statBox('Sessions done', sessionsDone),
      statBox('Accuracy', answered ? `${Math.round((correct / answered) * 100)}%` : '—'),
    ),
  );

  const ach = h('div', { class: 'ach-grid' });
  for (const [id, a] of Object.entries(S.ACHIEVEMENTS)) {
    const got = st.achievements[id];
    ach.append(h('div', { class: `ach ${got ? 'got' : ''}`, title: a.desc },
      spriteImg(a.icon, { scale: 3, cls: 'ach-icon' }), h('b', {}, a.name), h('small', {}, got ? `Unlocked ${got}` : a.desc)));
  }
  main.append(h('h2', { class: 'section-title' }, 'Achievements'), ach);

  // Parent corner: concept mastery + predictions to revisit
  const concepts = Object.entries(st.concepts).sort();
  const conceptNames = {
    'mech.units': 'Units & conversions', 'mech.displacement': 'Distance & displacement', 'mech.speed': 'Speed',
    'mech.average-speed': 'Average speed', 'mech.dt-graph': 'Distance–time graphs', 'mech.velocity': 'Velocity',
    'mech.vector-add': 'Adding velocities', 'mech.relative-motion': 'Relative motion', 'mech.pythagoras': 'Pythagoras',
    'mech.slope': 'Slope = velocity',
  };
  const parent = h('div', { class: 'card parent' }, h('h2', {}, 'Parent corner'));
  if (!concepts.length) parent.append(h('p', { class: 'muted' }, 'Concept accuracy will appear here once questions are answered.'));
  for (const [c, v] of concepts) {
    const pct = v.total ? v.correct / v.total : 0;
    parent.append(h('div', { class: 'mastery' },
      h('span', {}, conceptNames[c] || c),
      h('div', { class: 'goal-bar small' }, h('div', { class: `goal-fill ${pct < 0.6 ? 'low' : ''}`, style: { width: `${pct * 100}%` } })),
      h('small', {}, `${v.correct}/${v.total}`)));
  }
  const missed = Object.values(st.predictions).filter((p) => !p.correct);
  if (missed.length) {
    parent.append(h('h3', {}, 'Predictions that surprised them (great discussion topics!)'));
    parent.append(h('ul', { class: 'missed' }, missed.slice(-6).map((p) => h('li', {}, p.text))));
  }
  parent.append(h('h3', {}, 'Last 14 days'), h('div', { class: 'calendar wide' },
    S.streakCalendar(14).map((d) => h('div', { class: `cal-day ${d.active ? 'active' : ''} ${d.frozen ? 'frozen' : ''}`, title: `${d.date}: ${st.daily[d.date]?.xp || 0} XP` },
      h('small', {}, d.date.slice(8)), h('span', { class: 'cal-xp' }, String(st.daily[d.date]?.xp || 0))))));
  main.append(parent);

  // Settings
  const goalSel = h('select', { class: 'select', onChange: (e) => S.update((s) => (s.profile.dailyGoal = Number(e.target.value))) },
    [20, 30, 50, 80].map((x) => h('option', { value: x, selected: st.profile.dailyGoal === x }, `${x} XP / day`)));
  main.append(h('div', { class: 'card settings' },
    h('h2', {}, 'Settings'),
    toggle('Sound effects', st.settings.sound, (v) => { S.update((s) => (s.settings.sound = v)); setSoundEnabled(v); }),
    toggle('Unlock all sessions (parent mode)', st.settings.unlockAll, (v) => S.update((s) => (s.settings.unlockAll = v))),
    h('label', { class: 'setting' }, h('span', {}, 'Daily goal'), goalSel),
    h('button', {
      class: 'mc-btn small red', type: 'button',
      onClick: () => { if (confirm('Reset ALL progress? This cannot be undone.')) { S.resetAll(); go('#/learn'); } },
    }, 'Reset progress'),
  ));
}

function statBox(label, value) {
  return h('div', { class: 'card stat-box' }, h('small', {}, label), h('b', {}, String(value)));
}

function toggle(label, value, onChange) {
  const input = h('input', { type: 'checkbox', checked: value, onChange: (e) => onChange(e.target.checked) });
  return h('label', { class: 'setting' }, h('span', {}, label), input);
}

// ---------- toast ----------
function toast(text) {
  const el = h('div', { class: 'toast' }, text);
  document.body.append(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2200);
}

