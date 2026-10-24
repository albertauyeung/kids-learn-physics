// Gamification rules: streaks, freezes, mistakes, levels. (localStorage is absent in Node; state lives in memory.)
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../js/core/state.js';
import { dateStr, addDays } from '../js/core/util.js';

const lesson = { id: 'x.l1', type: 'lesson' };
const result = { accuracy: 1, perfect: true, comboBonus: 0, predictBonus: 0, puzzleBonus: 0, puzzleSolved: false, achievements: [] };
const today = dateStr();

beforeEach(() => S.resetAll());

test('streak grows on consecutive days and only once per day', () => {
  S.state.streak = { count: 4, best: 4, lastDate: addDays(today, -1), freezes: 0, frozenDates: [] };
  S.refreshStreak();
  assert.equal(S.state.streak.count, 4);
  S.completeSession(lesson, null, result);
  S.completeSession(lesson, null, result);
  assert.equal(S.state.streak.count, 5);
  assert.equal(S.state.streak.best, 5);
});

test('a missed day resets the streak without a freeze', () => {
  S.state.streak = { count: 6, best: 6, lastDate: addDays(today, -2), freezes: 0, frozenDates: [] };
  S.refreshStreak();
  assert.equal(S.state.streak.count, 0);
  S.completeSession(lesson, null, result);
  assert.equal(S.state.streak.count, 1);
});

test('a streak freeze covers one missed day', () => {
  S.state.streak = { count: 6, best: 6, lastDate: addDays(today, -2), freezes: 1, frozenDates: [] };
  S.refreshStreak();
  assert.equal(S.state.streak.freezes, 0);
  assert.deepEqual(S.state.streak.frozenDates, [addDays(today, -1)]);
  S.completeSession(lesson, null, result);
  assert.equal(S.state.streak.count, 7);
});

test('two missed days need two freezes', () => {
  S.state.streak = { count: 6, best: 6, lastDate: addDays(today, -3), freezes: 1, frozenDates: [] };
  S.refreshStreak();
  assert.equal(S.state.streak.count, 0);
  assert.equal(S.state.streak.freezes, 1, 'freeze is not wasted when it cannot save the streak');
});

test('mistakes leave review only after first-try successes on two different days', () => {
  S.recordAnswer({ correct: false, templateId: 't1', combo: 0 });
  S.recordAnswer({ correct: true, templateId: 't1', combo: 1, retry: true }); // retry: doesn't count
  assert.equal(S.state.mistakes.length, 1);
  S.recordAnswer({ correct: true, templateId: 't1', combo: 1 }); // day 1
  S.recordAnswer({ correct: true, templateId: 't1', combo: 1 }); // same day again: still 1 day
  assert.equal(S.state.mistakes.length, 1);
  S.state.mistakes[0].right = [addDays(today, -1)]; // pretend day 1 was yesterday
  S.recordAnswer({ correct: true, templateId: 't1', combo: 1 }); // day 2
  assert.equal(S.state.mistakes.length, 0);
});

test('XP, perfect bonus, daily goal and levels', () => {
  const r = S.completeSession({ id: 'x.ps', type: 'problems' }, null, result);
  assert.equal(r.xp, 30); // 20 + 10 perfect
  assert.equal(r.goalReached, true); // default goal 20
  assert.equal(r.emeralds, 2 + 2 + 5);
  assert.equal(S.levelInfo(0).level, 1); // a new player is level 1
  assert.equal(S.levelInfo(30).level, 3);
  assert.equal(S.levelInfo(29).level, 2);
});

test('a tab left open overnight still uses freezes when the next session finishes', () => {
  // No reload, so load()/refreshStreak() never ran since the missed day.
  S.state.streak = { count: 3, best: 3, lastDate: addDays(today, -2), freezes: 2, frozenDates: [] };
  S.completeSession(lesson, null, result);
  assert.equal(S.state.streak.count, 4);
  assert.equal(S.state.streak.freezes, 1);
});

test('a question answered wrong several times has one review entry, and a new mistake restarts the count', () => {
  S.recordAnswer({ correct: false, templateId: 't2', combo: 0 });
  S.recordAnswer({ correct: false, templateId: 't2', combo: 0, retry: true });
  S.recordAnswer({ correct: false, templateId: 't2', combo: 0, retry: true });
  assert.equal(S.state.mistakes.length, 1, 'no duplicates');
  S.recordAnswer({ correct: true, templateId: 't2', combo: 1 });
  assert.equal(S.state.mistakes[0].right.length, 1);
  S.recordAnswer({ correct: false, templateId: 't2', combo: 0 });
  assert.equal(S.state.mistakes[0].right.length, 0, 'a new mistake restarts the count');
});

test('practice runs are not counted as course sessions', () => {
  S.completeSession({ id: 'practice', type: 'lesson' }, null, result);
  assert.equal(S.state.sessions.practice, undefined);
});

test('old saves missing nested fields load with defaults filled in', () => {
  const store = { 'klp.save.v1': JSON.stringify({ profile: { name: 'Old' }, streak: { count: 2, lastDate: today } }) };
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => (store[k] = v), removeItem: (k) => delete store[k] };
  try {
    S.load();
    assert.equal(S.state.profile.name, 'Old');
    assert.equal(S.state.profile.dailyGoal, 20);
    assert.deepEqual(S.state.streak.frozenDates, []);
    assert.equal(S.state.streak.count, 2);
    assert.doesNotThrow(() => S.streakCalendar(7));
  } finally {
    delete globalThis.localStorage;
  }
});

// ---------- Robustness against other tabs and damaged saves ----------
function fakeStorage(initial = {}) {
  const store = { ...initial };
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => (store[k] = String(v)), removeItem: (k) => delete store[k] };
  return store;
}

test('damaged saves (null or wrong-typed fields) fall back to defaults', () => {
  fakeStorage({ 'klp.save.v1': JSON.stringify({ profile: { name: 'T', dailyGoal: 'x' }, daily: null, sessions: null, mistakes: [null, { templateId: 'a' }, 5], skins: { owned: null }, xp: '7' }) });
  try {
    S.load();
    assert.equal(S.state.profile.name, 'T');
    assert.equal(S.state.profile.dailyGoal, 20);
    assert.deepEqual(S.state.daily, {});
    assert.deepEqual(S.state.sessions, {});
    assert.deepEqual(S.state.mistakes.map((m) => m.templateId), ['a']);
    assert.deepEqual(S.state.skins.owned, ['classic']);
    assert.equal(S.state.xp, 0);
    assert.doesNotThrow(() => { S.todaysQuests(); S.streakCalendar(14); S.levelInfo(); });
  } finally {
    delete globalThis.localStorage;
  }
});

test('a stale tab picks up progress saved by another tab instead of overwriting it', () => {
  const store = fakeStorage();
  try {
    S.load();
    S.update((s) => (s.profile.name = 'Tab'));
    // another tab finishes a lesson and saves
    const other = JSON.parse(store['klp.save.v1']);
    other.xp = 10;
    other.sessions['mech.u1.l1'] = { completions: 1, bestAccuracy: 1, perfect: true, lastDate: today };
    store['klp.save.v1'] = JSON.stringify(other);
    // this tab changes a setting: the other tab's lesson must survive
    S.update((s) => (s.settings.sound = false));
    const saved = JSON.parse(store['klp.save.v1']);
    assert.equal(saved.xp, 10);
    assert.ok(saved.sessions['mech.u1.l1']);
    assert.equal(saved.settings.sound, false);
  } finally {
    delete globalThis.localStorage;
  }
});

test('rewards scale with accuracy', () => {
  const full = S.completeSession({ id: 'a', type: 'lesson' }, null, { ...result, accuracy: 1, perfect: false });
  const none = S.completeSession({ id: 'b', type: 'lesson' }, null, { ...result, accuracy: 0, perfect: false });
  assert.equal(full.xp, 10);
  assert.equal(none.xp, 5);
  assert.ok(none.emeralds < full.emeralds);
});
