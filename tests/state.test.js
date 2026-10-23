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
  assert.equal(S.state.freezes, undefined);
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

test('mistakes stay until answered right on a first try', () => {
  S.recordAnswer({ correct: false, templateId: 't1', combo: 0 });
  S.recordAnswer({ correct: true, templateId: 't1', combo: 1, retry: true });
  assert.equal(S.state.mistakes.length, 1);
  S.recordAnswer({ correct: true, templateId: 't1', combo: 1 });
  assert.equal(S.state.mistakes.length, 0);
});

test('XP, perfect bonus, daily goal and levels', () => {
  const r = S.completeSession({ id: 'x.ps', type: 'problems' }, null, result);
  assert.equal(r.xp, 30); // 20 + 10 perfect
  assert.equal(r.goalReached, true); // default goal 20
  assert.equal(r.emeralds, 1 + 2 + 5);
  assert.equal(S.levelInfo(30).level, 2);
  assert.equal(S.levelInfo(29).level, 1);
});

test('a tab left open overnight still uses freezes when the next session finishes', () => {
  // No reload, so load()/refreshStreak() never ran since the missed day.
  S.state.streak = { count: 3, best: 3, lastDate: addDays(today, -2), freezes: 2, frozenDates: [] };
  S.completeSession(lesson, null, result);
  assert.equal(S.state.streak.count, 4);
  assert.equal(S.state.streak.freezes, 1);
});

test('a question answered wrong several times leaves review after one first-try success', () => {
  S.recordAnswer({ correct: false, templateId: 't2', combo: 0 });
  S.recordAnswer({ correct: false, templateId: 't2', combo: 0, retry: true });
  S.recordAnswer({ correct: false, templateId: 't2', combo: 0, retry: true });
  assert.equal(S.state.mistakes.length, 1, 'no duplicates');
  S.recordAnswer({ correct: true, templateId: 't2', combo: 1 });
  assert.equal(S.state.mistakes.length, 0);
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
