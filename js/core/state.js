// Game state + gamification rules (XP, levels, streaks, emeralds, quests, achievements).
// Content-agnostic: it only knows about sessions, questions and concepts by id.

import { dateStr, daysBetween, addDays, makeRng } from './util.js';

const KEY = 'klp.save.v1';

function fresh() {
  return {
    version: 1,
    profile: { name: '', dailyGoal: 30, createdAt: dateStr() },
    settings: { sound: true, unlockAll: false },
    xp: 0,
    emeralds: 0,
    potion: 0, // sessions left with double XP
    streak: { count: 0, best: 0, lastDate: null, freezes: 0, frozenDates: [] },
    daily: {}, // date -> counters
    sessions: {}, // sessionId -> { completions, bestAccuracy, perfect, lastDate }
    concepts: {}, // concept -> { correct, total }
    predictions: {}, // stepKey -> { correct, date, text }
    mistakes: [], // [{ templateId, date }]
    achievements: {}, // id -> date
    skins: { owned: ['classic'], active: 'classic' },
    notices: [],
  };
}

export let state = fresh();
const listeners = new Set();

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  for (const fn of listeners) fn(state);
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = Object.assign(fresh(), JSON.parse(raw));
  } catch {
    state = fresh();
  }
  refreshStreak();
  return state;
}

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: progress lives only in memory */
  }
  emit();
}

export function resetAll() {
  state = fresh();
  persist();
}

export function update(fn) {
  fn(state);
  persist();
}

// ---------- Daily counters ----------
export function today() {
  const d = dateStr();
  if (!state.daily[d]) {
    state.daily[d] = {
      xp: 0, correct: 0, answered: 0, bestCombo: 0, perfect: 0,
      sessions: 0, problemSets: 0, noHintCalc: 0, goalBonus: false, claimed: {},
    };
  }
  return state.daily[d];
}

// ---------- Levels ----------
// Level L is reached at 5·L·(L+1) XP: 10, 30, 60, 100, 150, ...
export function xpForLevel(L) {
  return 5 * L * (L + 1);
}

export function levelInfo(xp = state.xp) {
  let L = 0;
  while (xpForLevel(L + 1) <= xp) L++;
  const lo = xpForLevel(L);
  const hi = xpForLevel(L + 1);
  return { level: L, into: xp - lo, need: hi - lo, progress: (xp - lo) / (hi - lo) };
}

// ---------- Streaks ----------
export function refreshStreak() {
  const s = state.streak;
  if (!s.lastDate) return;
  const now = dateStr();
  const gap = daysBetween(s.lastDate, now);
  if (gap <= 1) return;
  const missed = gap - 1;
  if (s.count > 0 && s.freezes >= missed) {
    s.freezes -= missed;
    for (let i = 1; i <= missed; i++) s.frozenDates.push(addDays(s.lastDate, i));
    s.frozenDates = s.frozenDates.slice(-30);
    s.lastDate = addDays(now, -1);
    state.notices.push(`Your Streak Freeze saved your ${s.count}-day streak!`);
  } else if (s.count > 0) {
    state.notices.push(`Your ${s.count}-day streak ended. Start a new one today!`);
    s.count = 0;
  }
  persist();
}

function extendStreak() {
  const s = state.streak;
  const now = dateStr();
  if (s.lastDate === now) return false;
  const gap = s.lastDate ? daysBetween(s.lastDate, now) : null;
  s.count = gap === 1 ? s.count + 1 : 1;
  s.lastDate = now;
  s.best = Math.max(s.best, s.count);
  return true;
}

export function streakCalendar(days = 7) {
  const now = dateStr();
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(now, -i);
    out.push({
      date: d,
      active: (state.daily[d]?.sessions || 0) > 0,
      frozen: state.streak.frozenDates.includes(d),
      today: i === 0,
    });
  }
  return out;
}

// ---------- Answers ----------
export function recordAnswer({ correct, concepts = [], templateId, combo, calc, usedHint, retry = false }) {
  const d = today();
  d.answered++;
  if (correct) d.correct++;
  d.bestCombo = Math.max(d.bestCombo, combo);
  if (correct && calc && !usedHint) d.noHintCalc++;
  for (const c of concepts) {
    const k = (state.concepts[c] ||= { correct: 0, total: 0 });
    k.total++;
    if (correct) k.correct++;
  }
  if (templateId) {
    if (!correct) {
      state.mistakes.push({ templateId, date: dateStr() });
      state.mistakes = state.mistakes.slice(-40);
    } else if (!retry) {
      // Only a later, first-try success clears a mistake from the review list.
      const i = state.mistakes.findIndex((m) => m.templateId === templateId);
      if (i >= 0) state.mistakes.splice(i, 1);
    }
  }
  if (combo >= 10) unlock('combo10');
  persist();
}

export function recordPrediction(key, correct, text) {
  state.predictions[key] = { correct, date: dateStr(), text };
  const good = Object.values(state.predictions).filter((p) => p.correct).length;
  if (good >= 5) unlock('predictor');
  persist();
}

// ---------- Sessions ----------
const BASE_XP = { lesson: 10, problems: 20, boss: 50 };
const PERFECT_XP = { lesson: 5, problems: 10, boss: 20 };

export function completeSession(session, unit, result) {
  const before = levelInfo();
  const d = today();
  let xp = (BASE_XP[session.type] || 10) + result.comboBonus + result.predictBonus;
  if (result.perfect) xp += PERFECT_XP[session.type] || 5;
  const potion = state.potion > 0;
  if (potion) {
    xp *= 2;
    state.potion--;
  }
  let emeralds = 1 + (result.perfect ? 2 : 0) + (session.type === 'boss' ? 5 : 0) + result.puzzleBonus;

  state.xp += xp;
  d.xp += xp;
  d.sessions++;
  if (result.perfect) d.perfect++;
  if (session.type === 'problems') d.problemSets++;

  const rec = (state.sessions[session.id] ||= { completions: 0, bestAccuracy: 0, perfect: false, lastDate: null });
  rec.completions++;
  rec.bestAccuracy = Math.max(rec.bestAccuracy, result.accuracy);
  rec.perfect = rec.perfect || result.perfect;
  rec.lastDate = dateStr();

  const streakExtended = extendStreak();

  let goalReached = false;
  if (!d.goalBonus && d.xp >= state.profile.dailyGoal) {
    d.goalBonus = true;
    goalReached = true;
    emeralds += 5;
  }
  state.emeralds += emeralds;

  const tryUnlock = (id) => unlock(id);
  tryUnlock('first_steps');
  if (result.perfect) tryUnlock('perfect');
  if (state.streak.count >= 3) tryUnlock('streak3');
  if (state.streak.count >= 7) tryUnlock('streak7');
  if (state.streak.count >= 30) tryUnlock('streak30');
  if (session.type === 'boss' && unit) tryUnlock(`unit${unit.number}`);
  if (result.puzzleSolved) tryUnlock('puzzle');
  for (const a of result.achievements || []) tryUnlock(a);
  const after = levelInfo();
  if (after.level >= 5) tryUnlock('level5');

  persist();
  return {
    xp, emeralds, potion, streakExtended, goalReached,
    newAchievements: drainUnlocks(),
    levelUp: after.level > before.level ? after.level : null,
  };
}

export function sessionRecord(id) {
  return state.sessions[id];
}

export function isCracked(id) {
  const r = state.sessions[id];
  return !!(r && r.lastDate && daysBetween(r.lastDate, dateStr()) >= 7);
}

// ---------- Achievements ----------
export const ACHIEVEMENTS = {
  first_steps: { name: 'First Steps', desc: 'Finish your first session', icon: 'hero' },
  perfect: { name: 'Flawless', desc: 'Finish a session with no mistakes', icon: 'diamond' },
  streak3: { name: 'Torch Lit', desc: 'Reach a 3-day streak', icon: 'torch' },
  streak7: { name: 'Week of Fire', desc: 'Reach a 7-day streak', icon: 'torch' },
  streak30: { name: 'Eternal Flame', desc: 'Reach a 30-day streak', icon: 'torch' },
  combo10: { name: 'On Fire', desc: 'Get 10 answers right in a row', icon: 'xporb' },
  predictor: { name: 'Galileo', desc: 'Make 5 correct predictions', icon: 'flag' },
  puzzle: { name: 'Puzzle Master', desc: 'Solve a Puzzle Corner problem', icon: 'chest' },
  vonneumann: { name: 'Von Neumann', desc: 'Solve the fly-and-trains puzzle', icon: 'bee' },
  unit1: { name: 'Motion Master', desc: 'Beat the Unit 1 Boss Mission', icon: 'minecart' },
  unit2: { name: 'River Captain', desc: 'Beat the Unit 2 Boss Mission', icon: 'boat' },
  level5: { name: 'Level 5', desc: 'Reach level 5', icon: 'xporb' },
  shopper: { name: 'New Look', desc: 'Buy a new skin', icon: 'emerald' },
};

let pendingUnlocks = [];

export function unlock(id) {
  if (state.achievements[id] || !ACHIEVEMENTS[id]) return false;
  state.achievements[id] = dateStr();
  pendingUnlocks.push(id);
  return true;
}

function drainUnlocks() {
  const out = pendingUnlocks;
  pendingUnlocks = [];
  return out;
}

export function takeUnlocks() {
  return drainUnlocks();
}

// ---------- Daily quests ----------
const QUESTS = [
  { id: 'xp30', text: 'Earn 30 XP', metric: 'xp', target: 30, reward: 3 },
  { id: 'xp60', text: 'Earn 60 XP', metric: 'xp', target: 60, reward: 6 },
  { id: 'combo5', text: 'Get 5 answers right in a row', metric: 'bestCombo', target: 5, reward: 3 },
  { id: 'combo10', text: 'Get 10 answers right in a row', metric: 'bestCombo', target: 10, reward: 5 },
  { id: 'correct15', text: 'Answer 15 questions correctly', metric: 'correct', target: 15, reward: 4 },
  { id: 'perfect1', text: 'Finish a session with no mistakes', metric: 'perfect', target: 1, reward: 4 },
  { id: 'sessions2', text: 'Complete 2 sessions', metric: 'sessions', target: 2, reward: 3 },
  { id: 'problems1', text: 'Complete a problem set', metric: 'problemSets', target: 1, reward: 4 },
  { id: 'nohint3', text: 'Solve 3 calculations without hints', metric: 'noHintCalc', target: 3, reward: 3 },
];

export function todaysQuests() {
  const d = today();
  const rng = makeRng(`quests-${dateStr()}`);
  const picks = rng.shuffle(QUESTS).slice(0, 3);
  return picks.map((q) => ({
    ...q,
    progress: Math.min(d[q.metric] || 0, q.target),
    done: (d[q.metric] || 0) >= q.target,
    claimed: !!d.claimed[q.id],
  }));
}

export function claimQuest(id) {
  const q = todaysQuests().find((x) => x.id === id);
  if (!q || !q.done || q.claimed) return 0;
  today().claimed[id] = true;
  state.emeralds += q.reward;
  persist();
  return q.reward;
}

export function unclaimedQuests() {
  return todaysQuests().filter((q) => q.done && !q.claimed).length;
}

// ---------- Shop ----------
export const SKINS = {
  classic: { name: 'Classic', price: 0, colors: { T: '#e07b22', U: '#b85f12', P: '#3a4a8a', B: '#3d3d3d' } },
  diamond: { name: 'Diamond Armour', price: 30, colors: { T: '#4aedd9', U: '#28b0a2', P: '#2fc4b4', B: '#1c7d72' } },
  gold: { name: 'Gold Armour', price: 30, colors: { T: '#fcee4b', U: '#d4b81f', P: '#e0c52a', B: '#a58a12' } },
  redstone: { name: 'Redstone Engineer', price: 40, colors: { T: '#db1d1d', U: '#9e1010', P: '#4a4a4a', B: '#222222' } },
  ender: { name: 'Ender Explorer', price: 50, colors: { T: '#8a3bd1', U: '#5a1f94', P: '#22163a', B: '#120c1c' } },
};

export const SHOP_ITEMS = {
  freeze: { name: 'Streak Freeze', desc: 'Protects your streak if you miss a day. Hold up to 2.', price: 10, icon: 'ice' },
  potion: { name: 'XP Potion', desc: 'Double XP for your next session.', price: 15, icon: 'potion' },
};

export function buy(itemId) {
  if (SKINS[itemId]) {
    const skin = SKINS[itemId];
    if (state.skins.owned.includes(itemId)) {
      state.skins.active = itemId;
      persist();
      return { ok: true };
    }
    if (state.emeralds < skin.price) return { ok: false, reason: 'Not enough emeralds' };
    state.emeralds -= skin.price;
    state.skins.owned.push(itemId);
    state.skins.active = itemId;
    unlock('shopper');
    persist();
    return { ok: true, unlocked: takeUnlocks() };
  }
  const item = SHOP_ITEMS[itemId];
  if (!item) return { ok: false, reason: 'Unknown item' };
  if (itemId === 'freeze' && state.streak.freezes >= 2) return { ok: false, reason: 'You already hold 2 freezes' };
  if (itemId === 'potion' && state.potion > 0) return { ok: false, reason: 'Potion already active' };
  if (state.emeralds < item.price) return { ok: false, reason: 'Not enough emeralds' };
  state.emeralds -= item.price;
  if (itemId === 'freeze') state.streak.freezes++;
  if (itemId === 'potion') state.potion = 1;
  persist();
  return { ok: true };
}

export function activeSkinColors() {
  return (SKINS[state.skins.active] || SKINS.classic).colors;
}

// ---------- Unlocking ----------
// Sessions unlock in order; a unit unlocks once the previous unit's last session is done.
export function sessionStatus(units, unitIdx, sessionIdx) {
  const unit = units[unitIdx];
  const session = unit.sessions[sessionIdx];
  const rec = state.sessions[session.id];
  if (rec?.completions) return 'done';
  if (state.settings.unlockAll) return 'open';
  let prev = null;
  if (sessionIdx > 0) prev = unit.sessions[sessionIdx - 1];
  else if (unitIdx > 0) {
    const pu = units[unitIdx - 1];
    prev = pu.sessions[pu.sessions.length - 1];
  }
  if (!prev) return 'open';
  return state.sessions[prev.id]?.completions ? 'open' : 'locked';
}
