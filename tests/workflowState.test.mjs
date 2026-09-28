import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAmount,loadRequests,nextActionLabel,legLabel,workflowError} from '../src/api/workflowState.js';

test('whole-TZS validation stays exact beyond Number precision and at BIGINT boundary',()=>{
 for(const amount of ['1','9007199254740993','9223372036854775807']) assert.equal(validateAmount(amount),null);
 for(const amount of ['0','-1','1.1','1e4','9223372036854775808','NaN','']) assert.equal(typeof validateAmount(amount),'string');
});
test('refresh reads every page and never returns partial data after an interrupted page',async()=>{
 const paths=[];
 assert.deepEqual(await loadRequests({envelope:async path=>{paths.push(path);return paths.length===1?{data:[{id:'a'}],page:{nextCursor:'2'}}:{data:[{id:'b'}],page:{nextCursor:null}};}}),[{id:'a'},{id:'b'}]);
 assert.deepEqual(paths,['/requests','/requests?cursor=2']);
 await assert.rejects(loadRequests({envelope:async path=>{if(path.includes('?'))throw Error('offline');return {data:[{id:'a'}],page:{nextCursor:'2'}};}}),/offline/);
 await assert.rejects(loadRequests({envelope:async()=>({data:[],page:{nextCursor:'2'}})}),/finish refreshing/);
});
test('unknown outcomes and synthetic confirmation never imply funds can move',()=>{
 assert.match(nextActionLabel({status:'awaiting_source',legs:[{status:'unknown'}],providerEvidence:[{evidenceStatus:'confirmed'}]}),/Reservation retained/);
 assert.match(nextActionLabel({status:'awaiting_review'}),/does not make a payment/);
 assert.match(nextActionLabel({status:'awaiting_source'}),/Do not send funds/);
 assert.match(legLabel({type:'destination_out',status:'submitted'}),/confirmation pending/);
 assert.match(legLabel({type:'origin_in',status:'unknown'}),/reconciliation required/);
 assert.match(workflowError({code:'APPLICATION_CHANGED',status:409}),/input is still here/);
});
