import test from 'node:test';
import assert from 'node:assert/strict';
import {applicationFields,wizardParams,saveDraft,syncWizard} from '../src/api/onboarding.js';
test('draft mapping never persists credentials or client verification/roles',()=>{
 const data=applicationFields({name:'Test',password:'secret',role:'main-agent',phoneVerified:true,selfieVerified:true,networks:['Voda','Airtel'],floatCapacity:500000});
 assert.deepEqual(data,{name:'Test',networks:['vodacom','airtel'],floatCapacity:'500000'});
});
test('resume preserves evidence and canonical values through a correction',async()=>{
 const saved={version:7,data:{name:'Test',networks:['vodacom'],floatCapacity:'500000',documentIds:['id']},phone:'+255700000000',email:'test@example.test'};
 const p=wizardParams(saved);let body;
 await saveDraft({call:async(path,options)=>{body=options.body;return saved;}},p);
 assert.equal(body.expectedVersion,7);assert.deepEqual(body.data,saved.data);assert.deepEqual(p.networks,['Voda']);
 await assert.rejects(saveDraft({},{}),/Reload/);
});
test('saving updates back-stack versions without remounting screens or dropping map state',()=>{
 let reset;const initial={index:1,routes:[{key:'personal',name:'Step3Personal',params:{expectedVersion:1}},{key:'business',name:'Step4Business',params:{location:'Dar'}}]};
 syncWizard({getState:()=>initial,reset:s=>reset=s},{version:2,data:{name:'Test'},phone:'phone',email:'email'});
 assert.equal(reset.routes[0].key,'personal');assert.equal(reset.routes[0].params.expectedVersion,2);assert.equal(reset.routes[1].params.location,'Dar');
});
