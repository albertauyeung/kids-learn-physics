import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNumber, closeEnough, daysBetween, addDays, fmt } from '../js/core/util.js';

test('parseNumber understands what kids type', () => {
  assert.equal(parseNumber('120'), 120);
  assert.equal(parseNumber(' 1,200 '), 1200);
  assert.equal(parseNumber('-4'), -4);
  assert.equal(parseNumber('−4'), -4);
  assert.equal(parseNumber('3/4'), 0.75);
  assert.equal(parseNumber('1 1/2'), 1.5);
  assert.equal(parseNumber('.5'), 0.5);
  assert.equal(parseNumber('+2'), 2);
  assert.equal(parseNumber('abc'), null);
  assert.equal(parseNumber(''), null);
  assert.equal(parseNumber('1/0'), null);
});

test('closeEnough tolerance', () => {
  assert.ok(closeEnough(3.33, 10 / 3, 0.01));
  assert.ok(closeEnough(20, 20));
  assert.ok(!closeEnough(21, 20));
});

test('dates', () => {
  assert.equal(daysBetween('2026-02-28', '2026-03-01'), 1);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('fmt removes float noise', () => {
  assert.equal(fmt(0.1 + 0.2), '0.3');
  assert.equal(fmt(350.00000000000006), '350');
  assert.equal(fmt(-2), '−2');
});

test('parseNumber ignores a typed unit', () => {
  assert.equal(parseNumber('350 m'), 350);
  assert.equal(parseNumber('12km/h'), 12);
  assert.equal(parseNumber('-3 m/s'), -3);
  assert.equal(parseNumber('day 8'), null);
  assert.equal(parseNumber('m'), null);
});
