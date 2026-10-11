import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePaymentEndpoint } from '../src/api/paymentEndpoints.js';
test('wallet normalization accepts Tanzanian forms without converting agent identifiers',()=>{
  for(const identifier of ['0743 428 876','255743428876','+255743428876'])
    assert.equal(normalizePaymentEndpoint({networkCode:'vodacom',identifierType:'phone',identifier}).identifier,'+255743428876');
  assert.equal(normalizePaymentEndpoint({networkCode:'yas',identifierType:'agent',identifier:'0012345'}).identifier,'0012345');
  for(const identifier of ['', '123', '+254743428876', '0743428876abc'])
    assert.throws(()=>normalizePaymentEndpoint({networkCode:'vodacom',identifierType:'phone',identifier}));
});
