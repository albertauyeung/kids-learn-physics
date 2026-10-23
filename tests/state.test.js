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
  assert.equal(r.goalReached, true); // default goal 30
  assert.equal(r.emeralds, 1 + 2 + 5);
  assert.equal(S.levelInfo(30).level, 2);
  assert.equal(S.levelInfo(29).level, 1);
});
