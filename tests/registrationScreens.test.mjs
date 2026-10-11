// Execute real registration handlers with isolated native/API services.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import * as onboarding from '../src/api/onboarding.js';
const require = createRequire(import.meta.url);
const flush = () => new Promise(resolve => setImmediate(resolve));
function harness(name, options = {}) {
  const values = [], effects = [], deps = []; let cursor = 0;
  const react = {
    useState(initial) { const i = cursor++; if (!(i in values)) values[i] = typeof initial === 'function' ? initial() : initial; return [values[i], v => { values[i] = typeof v === 'function' ? v(values[i]) : v; }]; },
    useRef(initial) { const i = cursor++; if (!(i in values)) values[i] = { current: initial }; return values[i]; },
    useEffect(fn, next) { const i = cursor++; if (!deps[i] || next.some((v, j) => v !== deps[i][j])) { deps[i] = next; effects.push(fn); } },
    createElement(type, props, ...children) { return { type, props: props || {}, children }; },
  };
  const ui = new Proxy({}, { get: (_, key) => key });
  const calls = [], navCalls = [];
  const navigation = { navigate: (...args) => navCalls.push(args), goBack() {}, getState: () => ({ index: 0, routes: [{ key: 'screen', name, params: options.params }] }), reset(s) { options.params = s.routes[0].params; } };
  const api = { call: async (...args) => { calls.push(args); return options.call ? options.call(...args) : options.application; } };
  const module = { exports: {} };
  const code = require('@babel/core').transformSync(fs.readFileSync(new URL(`../src/screens/auth/${name}.jsx`, import.meta.url), 'utf8'), {
    configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'],
  }).code;
  vm.runInNewContext(code, { module, exports: module.exports, require: p => p === 'react' ? react : p === 'react-native' ? { View: 'View', Image: 'Image' } :
    p.includes('RegistrationUI') ? ui : p.includes('AuthUI') ? { useAuthStyle: () => ({ copy: en => en, colors: {} }) } :
    p.includes('AuthContext') ? { useAuth: () => ({ user: null, refreshProfile: async () => {}, ...options.auth }) } :
    p.includes('config/api') ? { api } : p.endsWith('/onboarding') ? onboarding :
    p.includes('workflowState') ? { workflowError: e => e.message } :
    p.includes('useSavedDocuments') ? { useSavedDocuments: () => ({ documents: options.documents || [], loading: false, error: '', retry() {} }) } :
    p.includes('api/documents') ? { uploadDocument: options.upload || (async () => ({ id: 'new-doc' })) } :
    p === 'expo-document-picker' ? { getDocumentAsync: options.pick || (async () => ({ canceled: true })) } :
    p === '@expo/vector-icons' ? { Ionicons: 'Icon' } : {},
  });
  return { calls, navCalls, render() { cursor = 0; const tree = module.exports.default({ navigation, route: { params: options.params || {} } }); effects.splice(0).forEach(fn => fn()); return tree; } };
}
function nodes(t) { return !t || typeof t !== 'object' ? [] : Array.isArray(t) ? t.flatMap(nodes) : [t, ...nodes(t.props?.footer), ...(t.children || []).flatMap(nodes)]; }
const find = (t, type, label) => nodes(t).find(n => n.type === type && (!label || n.props.label === label));
const content = t => nodes(t).flatMap(n => n.children).filter(v => typeof v === 'string').join(' ');

test('phone step continues only a complete Tanzanian number and OTP never sends fake verification', () => {
  const h = harness('Step1Phone'); let t = h.render();
  find(t, 'GlassField').props.onChangeText('700123456');
  find(h.render(), 'GlassButton').props.onPress();
  assert.equal(h.navCalls[0][1].phone, '+255700123456');
  const otp = harness('Step2OTP', { params: h.navCalls[0][1] });
  assert.match(content(otp.render()), /No code has been sent/);
  find(otp.render(), 'GlassButton').props.onPress();
  assert.equal(otp.calls.length, 0); assert.equal(otp.navCalls[0][0], 'Step3Personal');
});

test('personal validation blocks mismatched passwords; duplicate save and failed request retain input', async () => {
  let calls = 0, reject;
  const h = harness('Step3Personal', { params: { phone: '+255700123456' }, auth: { register: () => { calls++; return new Promise((_, r) => reject = r); } } });
  for (const [label, value] of Object.entries({ 'Full name': 'Juma Example', Email: 'juma@example.test', 'NIDA number': '12345123451234512345', Password: 'password-12345', 'Confirm password': 'different' })) find(h.render(), 'GlassField', label).props.onChangeText(value);
  await find(h.render(), 'GlassButton').props.onPress(); assert.equal(calls, 0);
  find(h.render(), 'GlassField', 'Confirm password').props.onChangeText('password-12345');
  const action = find(h.render(), 'GlassButton').props.onPress; const waiting = action(); await action(); assert.equal(calls, 1);
  reject(Error('Connection unavailable')); await waiting;
  assert.equal(find(h.render(), 'GlassField', 'Full name').props.value, 'Juma Example');
  assert.match(content(h.render()), /Connection unavailable/);
});

test('business draft keeps its exact capacity and uploaded replacement across save failure; no duplicate effect on double tap', async () => {
  let uploadCount = 0, saveCount = 0;
  const params = { expectedVersion: 4, name: 'Juma Example', networks: ['Voda'], floatCapacity: 765432, documentIds: ['old-tin', 'licence'] };
  const h = harness('Step4Business', { params, pick: async () => ({ canceled: false, assets: [{ uri: 'private:tin', name: 'tin.png' }] }),
    upload: async () => { uploadCount++; return { id: 'new-tin' }; },
    call: async (path, request) => {
      if (path.includes('/documents/')) return { id: path.includes('old-tin') ? 'old-tin' : 'licence', kind: path.includes('old-tin') ? 'tin' : 'licence' };
      saveCount++; if (saveCount === 1) throw Error('Draft save failed');
      return { version: 5, data: request.body.data };
    } });
  await find(h.render(), 'PlainRow', 'TIN certificate').props.onPress();
  const action = find(h.render(), 'TextAction', 'Save draft').props.onPress;
  await Promise.all([action(), action()]); assert.equal(saveCount, 1); assert.equal(uploadCount, 1);
  await find(h.render(), 'TextAction', 'Save draft').props.onPress();
  assert.equal(uploadCount, 1);
  const save = h.calls.filter(c => c[0] === '/applications/me/draft').at(-1)[1].body;
  assert.equal(save.expectedVersion, 4); assert.equal(save.data.floatCapacity, '765432');
  assert.deepEqual(Array.from(save.data.documentIds), ['licence', 'new-tin']);
});

test('selfie is required or resumed; failed upload does not advance', async () => {
  const h = harness('Step5Selfie', { params: { expectedVersion: 1 }, pick: async () => ({ canceled: false, assets: [{ uri: 'private:selfie' }] }), upload: async () => { throw Error('Upload failed'); } });
  assert.equal(find(h.render(), 'GlassButton').props.disabled, true);
  await find(h.render(), 'TextAction', 'Choose a selfie photo').props.onPress();
  await find(h.render(), 'GlassButton').props.onPress();
  assert.equal(h.navCalls.length, 0); assert.match(content(h.render()), /Upload failed/);
});

test('review rejects absent phone proof and stale version, submits once after proof, then only refreshes', async () => {
  for (const app of [{ version: 4, phoneVerification: 'unavailable' }, { version: 5, phoneVerification: 'synthetic_fixture' }]) {
    const h = harness('Step6Review', { params: { expectedVersion: 4 }, application: { status: 'draft', ...app } });
    h.render(); await flush(); find(h.render(), 'CheckRow').props.onPress();
    assert.equal(find(h.render(), 'GlassButton').props.disabled, true);
    await find(h.render(), 'GlassButton').props.onPress(); assert.equal(h.calls.length, 1);
  }
  let submissions = 0, resolve;
  const h = harness('Step6Review', { params: { expectedVersion: 4 }, auth: { refreshProfile: async () => { throw Error('Refresh failed'); } }, call: async (path) => {
    if (path.endsWith('/submit')) { submissions++; return new Promise(r => resolve = r); }
    return { status: 'draft', version: 4, phoneVerification: 'synthetic_fixture' };
  } });
  h.render(); await flush(); find(h.render(), 'CheckRow').props.onPress();
  const action = find(h.render(), 'GlassButton').props.onPress; const waiting = action(); await action(); assert.equal(submissions, 1);
  resolve({}); await waiting; assert.equal(find(h.render(), 'GlassButton').props.disabled, true);
  assert.ok(find(h.render(), 'TextAction', 'Refresh account status'));
});

test('submitted view reads the immutable revision and has no submit action', async () => {
  const h = harness('Step6Review', { params: { readOnly: true }, application: { status: 'changes_requested', data: { name: 'New draft' }, revisions: [{ data: { name: 'Submitted name' } }] } });
  h.render(); await flush(); const t = h.render();
  assert.match(content(t), /Submitted name/); assert.doesNotMatch(content(t), /New draft/);
  assert.equal(find(t, 'GlassButton'), undefined);
});

test('suspended and rejected accounts cannot resume drafts; corrections retain reviewer reason and documents', async () => {
  for (const [accountStatus, applicationStatus, title] of [['suspended', 'draft', 'Account suspended'], ['pending', 'rejected', 'Application not approved'], ['pending', 'changes_requested', 'A small update needed']]) {
    const h = harness('PendingScreen', { auth: { profile: { accountStatus, applicationStatus } }, application: { version: 8, data: { documentIds: ['saved'] }, revisions: [{ reason: 'Upload clearer licence', fieldsToCorrect: ['documentIds'] }] } });
    h.render(); await flush(); const t = h.render();
    assert.equal(t.props.title, title);
    const update = find(t, 'GlassButton', 'Update application');
    if (applicationStatus === 'changes_requested') { assert.match(content(t), /Upload clearer licence/); update.props.onPress(); assert.equal(h.navCalls[0][1].expectedVersion, 8); assert.deepEqual(h.navCalls[0][1].documentIds, ['saved']); }
    else { assert.equal(update, undefined); assert.equal(find(t, 'GlassButton', 'Continue application'), undefined); }
  }
});

test('location entry validates optional coordinates and never manufactures a pin', () => {
  const h = harness('Step4aMap');
  find(h.render(), 'GlassField', 'Area and landmark').props.onChangeText('Kigamboni, Dar es Salaam');
  find(h.render(), 'GlassButton').props.onPress();
  assert.equal(h.navCalls[0][1].coordinates, null);
  find(h.render(), 'TextAction').props.onPress();
  find(h.render(), 'GlassField', 'Latitude').props.onChangeText('91');
  find(h.render(), 'GlassField', 'Longitude').props.onChangeText('39');
  find(h.render(), 'GlassButton').props.onPress(); assert.equal(h.navCalls.length, 1);
});

test('resumed selfie preserves evidence and exits read-only review mode when continuing an editable draft', async () => {
  const h = harness('Step5Selfie', { params: { expectedVersion: 4, documentIds: ['selfie'], readOnly: true }, documents: [{ id: 'selfie', kind: 'selfie' }], call: async (_, request) => ({ version: 5, data: request.body.data }) });
  await find(h.render(), 'GlassButton').props.onPress();
  assert.equal(h.navCalls[0][0], 'Step6Review');
  assert.equal(h.navCalls[0][1].readOnly, false);
  assert.equal(h.navCalls[0][1].expectedVersion, 5);
});

test('email confirmation keeps the form and permits verified continuation without navigating early', async () => {
  let attempts=0;
  const h=harness('Step3Personal',{params:{phone:'+255700123456'},auth:{register:async()=>{attempts++;return {requiresEmailConfirmation:true};}}});
  for(const [label,value] of Object.entries({'Full name':'Juma Example',Email:'juma@example.test','NIDA number':'12345123451234512345',Password:'synthetic-password','Confirm password':'synthetic-password'}))find(h.render(),'GlassField',label).props.onChangeText(value);
  await find(h.render(),'GlassButton').props.onPress();
  assert.match(content(h.render()),/Confirm your email/);
  assert.equal(find(h.render(),'GlassField','Email').props.value,'juma@example.test');
  assert.equal(h.navCalls.length,0);assert.equal(h.calls.length,0);
  await find(h.render(),'GlassButton').props.onPress();assert.equal(attempts,2);
});
