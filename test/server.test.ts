import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { summary } from '../src/server.js';

test('basic stats on [1..10]', () => {
  const r = summary([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(r.count, 10);
  assert.equal(r.sum, 55);
  assert.equal(r.mean, 5.5);
  assert.equal(r.median, 5.5);
  assert.equal(r.min, 1);
  assert.equal(r.max, 10);
});

test('odd-length median picks middle', () => {
  const r = summary([3, 1, 4, 1, 5, 9, 2, 6, 5]);
  assert.equal(r.median, 4);
});

test('single-element edge case', () => {
  const r = summary([42]);
  assert.equal(r.mean, 42);
  assert.equal(r.median, 42);
  assert.equal(r.stddev, 0);
});

test('sample stddev is correct', () => {
  // Known: stddev([2, 4, 4, 4, 5, 5, 7, 9]) = 2.138... (sample), 2 (population)
  const r = summary([2, 4, 4, 4, 5, 5, 7, 9]);
  assert.ok(Math.abs(r.stddev - 2.1380899352993947) < 1e-9);
});

test('percentiles default include p50, p95, p99', () => {
  const r = summary([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.ok('p50' in r.percentiles);
  assert.ok('p95' in r.percentiles);
  assert.ok('p99' in r.percentiles);
});

test('custom percentiles', () => {
  const r = summary([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [10, 50, 90]);
  assert.deepEqual(Object.keys(r.percentiles), ['p10', 'p50', 'p90']);
});

test('rejects empty array', () => {
  assert.throws(() => summary([]));
});

test('rejects non-number values', () => {
  assert.throws(() => summary([1, 2, NaN, 4]));
  assert.throws(() => summary([1, 2, Infinity, 4]));
});

test('rejects out-of-range percentile', () => {
  assert.throws(() => summary([1, 2, 3], [-5]));
  assert.throws(() => summary([1, 2, 3], [200]));
});
