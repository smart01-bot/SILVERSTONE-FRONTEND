import test from 'node:test';
import assert from 'node:assert/strict';
import { activityDate, amountRatio, formatActivityAmount, transferActivity, transferTimestamp } from '../src/components/agent/activitySummary.js';
const now = Date.parse('2026-10-15T09:00:00Z');
const completed = (id, amount, processedAt, extra = {}) => ({ id, status: 'completed', amount, processedAt, ...extra });

test('activity counts completed transfers once and excludes pending or unresolved money', () => {
  const row = completed('one', '50000', '2026-10-15T08:00:00Z');
  const result = transferActivity([row, row,
    completed('two', '90000', '2026-10-15T08:00:00Z', { status: 'payout_pending' }),
    completed('three', '80000', '2026-10-15T08:00:00Z', { legs: [{ status: 'unknown' }] }),
  ], { now });
  assert.equal(result.total, 50000n); assert.equal(result.count, 1);
});

test('daily buckets use Tanzania midnight and the chosen inclusive 7/30 day range', () => {
  const rows = [completed('before', '1', '2026-10-08T20:59:59Z'), completed('start', '10', '2026-10-08T21:00:00Z'),
    completed('last-day', '100', '2026-10-14T21:00:00Z'), completed('month', '1000', '2026-09-15T21:00:00Z'),
    completed('future', '10000', '2026-10-15T09:00:01Z')];
  const week = transferActivity(rows, { now });
  assert.equal(week.total, 110n); assert.equal(week.buckets[0].amount, 10n); assert.equal(week.buckets[6].amount, 100n);
  assert.equal(transferActivity(rows, { now, days: 30 }).total, 1111n);
});

test('completion date wins over creation date; request creation is never presented as completion', () => {
  const row = completed('old-request', '200', '2026-10-15T08:00:00Z', { createdAt: '2020-01-01T00:00:00Z' });
  assert.equal(transferActivity([row], { now }).count, 1);
  const missing = completed('missing-date', '200', null, { createdAt: '2026-10-15T08:00:00Z' });
  assert.equal(transferActivity([missing], { now }).count, 0);
  assert.equal(transferActivity([missing], { now }).omitted, 1);
});

test('payout confirmation history supplies a missing or invalid completion timestamp', () => {
  const row = completed('history', '500', 'invalid', { history: [{ event: 'created', createdAt: '2026-10-10T09:00:00Z' }, { event: 'payout_confirmed', createdAt: '2026-10-15T08:00:00Z' }] });
  assert.equal(transferTimestamp(row), Date.parse('2026-10-15T08:00:00Z'));
  assert.equal(transferActivity([row], { now }).total, 500n);
});

test('whole-TZS totals stay exact above Number precision; chart normalization alone is approximate', () => {
  const value = '9223372036854775807';
  const result = transferActivity([completed('a', value, '2026-10-15T08:00:00Z'), completed('b', value, '2026-10-15T08:00:00Z')], { now });
  assert.equal(result.total, 18446744073709551614n);
  assert.equal(formatActivityAmount(result.total), '18,446,744,073,709,551,614');
  assert.equal(amountRatio(result.total, result.total), 1);
  assert.equal(amountRatio(25n, 100n), 0.25); assert.equal(amountRatio(0n, 0n), 0);
});

test('invalid amounts and missing dates are reported rather than coerced into a transfer total', () => {
  const values = [null, '', 'NaN', '-2', '1.2', '0', 9007199254740992];
  const result = transferActivity(values.map((value, i) => completed(String(i), value, '2026-10-15T08:00:00Z')), { now });
  assert.equal(result.count, 0); assert.equal(result.total, 0n); assert.equal(result.omitted, values.length);
});

test('empty history has zeroed daily buckets and date labels match EAT across the year boundary', () => {
  const result = transferActivity([], { now, days: 30 });
  assert.equal(result.buckets.length, 30); assert.equal(result.max, 0n);
  assert.equal(activityDate(Date.parse('2026-12-31T21:00:00Z')), '1 Jan');
  assert.equal(activityDate(Date.parse('2026-10-14T21:00:00Z'), 'sw'), '15 Okt');
});
