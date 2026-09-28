import test from 'node:test';
import assert from 'node:assert/strict';
import { providerChargeLabel, providerEvidenceLabel } from '../src/api/providerEvidence.js';
import { requestView } from '../src/api/presentation.js';

test('unknown/missing charges never imply free provider service; known amounts remain lossless', () => {
  for (const provider of [undefined,{}, {providerFees:{status:'unknown',amountTzs:'0'}},{providerFees:{status:'known',amountTzs:0}}]) {
    assert.equal(providerChargeLabel(provider),'Provider charges: unknown');
  }
  assert.equal(providerChargeLabel({providerFees:{status:'known',amountTzs:'9007199254740993'}}),'Provider charges: TZS 9,007,199,254,740,993');
});
test('synthetic confirmation, acknowledgement and reversal cannot display actual paid status', () => {
  for(const evidenceStatus of ['acknowledged','confirmed','reversed','failed','unknown']) {
    const providerEvidence=[{source:'synthetic_fixture',scope:'embedded_test',evidenceStatus}];
    const row=requestView({status:'needs_attention',providerEvidence,provider:{providerFees:{status:'unknown',amountTzs:null}}});
    assert.equal(row.status,'needs_attention');
    assert.match(providerEvidenceLabel(row.providerEvidence[0]),/^Synthetic test evidence:/);
    assert.match(providerEvidenceLabel(row.providerEvidence[0]),/no real payment verified$/);
  }
  assert.match(providerEvidenceLabel({source:'unrecognized',evidenceStatus:'confirmed'}),/actual settlement unverified/);
  assert.match(providerEvidenceLabel({source:'synthetic_fixture',scope:'embedded_test',evidenceStatus:'acknowledged'}),/settlement not confirmed/);
});
