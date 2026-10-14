import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
function harness(){
 let identity='main-a',cursor=0,effects=[],reads=0,queryCallback,queryError,resolveRead;
 const values=[],deps=[];
 const React={useState(initial){const i=cursor++;if(!(i in values))values[i]=initial;return[values[i],fn=>values[i]=typeof fn==='function'?fn(values[i]):fn];},useRef(initial){const i=cursor++;if(!(i in values))values[i]={current:initial};return values[i];},useEffect(fn,dependencies){const i=cursor++;if(!deps[i]||dependencies.some((v,j)=>v!==deps[i][j])){effects.push(fn);deps[i]=dependencies;}}};
 const snap=id=>({docs:[{id,data:()=>({name:id})}]});
 const data={db:{},collection:()=>{},query:()=>{},where:()=>{},orderBy:()=>{},onSnapshot:(q,ok,error)=>{queryCallback=ok;queryError=error;return()=>{};},getDocs:()=>{reads++;return new Promise(resolve=>resolveRead=resolve);}};
 const code=require('@babel/core').transformSync(fs.readFileSync(new URL('../src/hooks/useMainCollection.js',import.meta.url),'utf8'),{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code;
 const module={exports:{}};vm.runInNewContext(code,{module,exports:module.exports,require:p=>p==='react'?React:p.includes('AuthContext')?{useAuth:()=>({user:{id:identity}})}:p.includes('screenData')?data:{workflowError:e=>e.message}});
 const render=()=>{cursor=0;const result=module.exports.useMainCollection('agents');const pending=effects;effects=[];pending.forEach(fn=>fn());return result;};
 return{render,snap,setOwner:id=>identity=id,loaded:id=>queryCallback(snap(id)),error:msg=>queryError(Error(msg)),resolve:id=>resolveRead(snap(id)),get reads(){return reads;}};
}
test('main-agent refresh reads real data and never shows a previous owner response',async()=>{
 const h=harness();h.render();h.loaded('assigned-agent');assert.equal(h.render().rows[0].id,'assigned-agent');
 const pending=h.render().refresh();assert.equal(h.reads,1);
 h.setOwner('main-b');assert.equal(h.render().rows.length,0);
 h.resolve('main-a-late-agent');await pending;assert.equal(h.render().rows.length,0);
 h.loaded('main-b-agent');assert.equal(h.render().rows[0].id,'main-b-agent');
 h.error('Service unavailable');const state=h.render();assert.equal(state.error,'Service unavailable');assert.equal(state.rows[0].id,'main-b-agent');
});
