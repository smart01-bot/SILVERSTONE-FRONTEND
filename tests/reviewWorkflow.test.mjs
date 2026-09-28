// Executes the real screen's handlers with injected React state/API. This is not a native renderer.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import * as workflow from '../src/api/workflowState.js';
const require=createRequire(import.meta.url);
function screen(api) {
 const values=[];let cursor=0;
 const react={useState(initial){const i=cursor++;if(!(i in values))values[i]=initial;return [values[i],v=>{values[i]=typeof v==='function'?v(values[i]):v;}];},useEffect(){},createElement(type,props,...children){return {type,props:props||{},children};}};
 const native=new Proxy({StyleSheet:{create:x=>x},Platform:{OS:'android'}},{get:(o,k)=>o[k]||k});
 const code=require('@babel/core').transformSync(fs.readFileSync(new URL('../src/screens/main-agent/ApprovalsScreen.jsx',import.meta.url),'utf8'),{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-react-jsx','@babel/plugin-transform-modules-commonjs']}).code;
 const module={exports:{}};
 vm.runInNewContext(code,{exports:module.exports,module,require:p=>p==='react'?react:p==='react-native'?native:p.includes('workflowState')?workflow:p.includes('config/api')?{api}:p.includes('ThemeContext')?{useTheme:()=>({theme:{}})}:p==='expo-linear-gradient'?{LinearGradient:'LinearGradient'}:{spacing:{md:16},radius:{},fonts:{}}});
 return ()=>{cursor=0;return module.exports.default();};
}
function nodes(tree){if(!tree||typeof tree!=='object')return [];if(Array.isArray(tree))return tree.flatMap(nodes);return [tree,...tree.children.flatMap(nodes)];}
function text(tree){if(typeof tree==='string'||typeof tree==='number')return String(tree);if(!tree)return '';if(Array.isArray(tree))return tree.map(text).join('');return tree.children.map(text).join('');}
function button(tree,label){return nodes(tree).find(n=>n.type==='TouchableOpacity'&&text(n).includes(label));}
test('conflicting review retains reason/fields, reloads explicitly and disables an already reviewed revision',async()=>{
 let decided=false; const detail={agentId:'applicant',status:'submitted',version:1,revisions:[{id:'r1',data:{name:'Test'}}]};
 const render=screen({call:async(path,opts)=>{
  if(path.endsWith('/decisions')){decided=true;throw Object.assign(Error('changed'),{status:409,code:'APPLICATION_CHANGED'});}
  if(path==='/review/applications')return [{id:'applicant',name:'Test'}];
  return decided?{...detail,status:'approved',revisions:[{...detail.revisions[0],decision:'approved',reason:'Already reviewed'}]}:detail;
 }});
 // Initial list load (effects deliberately absent in this state-only harness).
 await button(render(),'Refresh applications').props.onPress();
 await button(render(),'Open application').props.onPress();
 nodes(render()).find(n=>n.type==='TextInput').props.onChangeText('Please correct TIN');
 nodes(render()).find(n=>n.props.accessibilityRole==='checkbox').props.onPress();
 await button(render(),'Request corrections').props.onPress();
 let tree=render();
 assert.equal(nodes(tree).find(n=>n.type==='TextInput').props.value,'Please correct TIN');
 assert.equal(nodes(tree).find(n=>n.props.accessibilityRole==='checkbox').props.accessibilityState.checked,true);
 assert.equal(button(tree,'Approve application').props.disabled,true);
 await button(tree,'Reload application').props.onPress();
 tree=render();assert.equal(nodes(tree).find(n=>n.type==='TextInput').props.value,'Please correct TIN');
 assert.equal(button(tree,'Approve application').props.disabled,true);
 assert.match(text(tree),/Already reviewed/);
});
