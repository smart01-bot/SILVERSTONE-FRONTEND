import test from 'node:test';
import assert from 'node:assert/strict';
import { needsReconciliation, reservationLabel, recordedTime, requestAge } from '../src/api/operations.js';
test('uncertainty remains visible independently of request projection or synthetic confirmation', () => {
  assert.equal(needsReconciliation({status:'needs_attention'}), true);
  assert.equal(needsReconciliation({status:'awaiting_source',legs:[{status:'unknown'}]}), true);
  assert.equal(needsReconciliation({status:'completed',providerEvidence:[{evidenceStatus:'confirmed',reconciliationRequired:true}]}), true);
  assert.equal(needsReconciliation({status:'awaiting_source',reservation:{status:'held'}}), false);
});
test('held amount preserves integer precision; age has no implicit SLA or invented timestamp', () => {
  assert.match(reservationLabel({status:'held',amountTzs:'9223372036854775807'}), /9,223,372,036,854,775,807/);
  assert.match(reservationLabel({status:'held'}), /Amount unavailable/);
  assert.equal(requestAge('2026-09-28T08:00:00Z', Date.parse('2026-09-28T09:00:00Z')), '60 min since request');
  assert.equal(requestAge('bad'), 'Age unavailable');
  assert.equal(requestAge('2026-09-28T08:00:00Z', 0), 'Age unavailable');
  assert.equal(recordedTime(null), 'Time unavailable');
  assert.equal(recordedTime('2026-09-28T11:00:00+03:00'), '2026-09-28T08:00:00.000Z');
});
