// Real component handlers, injected native services; does not claim device rendering.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
function harness(name, auth = {}, lock = {}) {
  const values = [], effects = []; let cursor = 0, started = false, alert;
  const react = {
    useState(initial) { const i = cursor++; if (!(i in values)) values[i] = initial; return [values[i], v => { values[i] = typeof v === 'function' ? v(values[i]) : v; }]; },
    useRef(initial) { const i = cursor++; if (!(i in values)) values[i] = { current: initial }; return values[i]; },
    useEffect(fn) { if (!started) effects.push(fn); },
    createElement(type, props, ...children) { return { type, props: props || {}, children }; },
  };
  const ui = new Proxy({ useAuthStyle: () => ({ copy: en => en }) }, { get: (o, k) => o[k] || k });
  const module = { exports: {} };
  const code = require('@babel/core').transformSync(fs.readFileSync(new URL(`../src/screens/auth/${name}.jsx`, import.meta.url), 'utf8'), {
    configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'],
  }).code;
  vm.runInNewContext(code, { module, exports: module.exports, setInterval: () => 1, clearInterval() {},
    require: p => p === 'react' ? react : p === 'react-native' ? { View: 'View', AppState: { addEventListener: () => ({ remove() {} }) }, Alert: { alert: (...a) => { alert = a; } } } :
      p.includes('AgentConfirmDialog') ? { AgentConfirmDialog: 'AgentConfirmDialog' } :
      p.includes('AuthUI') ? ui : p.includes('AuthContext') ? { useAuth: () => ({ profile: { name: 'Raymond Duma' }, ...auth }) } :
      p.includes('pinLockout') ? { checkLockout: async () => ({ locked: false }), clearLockout: async () => {}, recordFailedAttempt: async () => ({ locked: false, remaining: 2 }), ...lock } :
      p === 'expo-local-authentication' ? { hasHardwareAsync: async () => false, isEnrolledAsync: async () => false } : {},
  });
  return { render(props = {}) { cursor = 0; const tree = module.exports.default(props); if (!started) { started = true; effects.forEach(fn => fn()); } return tree; }, get alert() { return alert; } };
}
function nodes(t) { return !t || typeof t !== 'object' ? [] : Array.isArray(t) ? t.flatMap(nodes) : [t, ...t.children.flatMap(nodes)]; }
const find = (t, type) => nodes(t).find(n => n.type === type);
const flush = () => new Promise(resolve => setImmediate(resolve));

test('login preserves inputs on server error and blocks duplicate pending submissions', async () => {
  let calls = 0, reject;
  const h = harness('LoginScreen', { login: () => { calls++; return new Promise((_, r) => { reject = r; }); } });
  let tree = h.render(); const fields = nodes(tree).filter(n => n.type === 'AuthField');
  fields[0].props.onChangeText('agent@example.test'); fields[1].props.onChangeText('test-password');
  const action = find(h.render(), 'AuthButton').props.onPress;
  const pending = action(); await action(); assert.equal(calls, 1);
  assert.equal(find(h.render(), 'AuthButton').props.busy, true);
  reject(Error('Network unavailable')); await pending;
  tree = h.render(); assert.equal(find(tree, 'AuthField').props.value, 'agent@example.test');
  assert.equal(find(tree, 'AuthNotice').children[0], 'Network unavailable');
});

test('PIN setup saves only matching confirmation; failed persistence never unlocks', async () => {
  let saves = 0, completed = 0, fail = true;
  const h = harness('PinSetupScreen', { savePin: async p => { saves++; assert.equal(p, '1234'); if (fail) throw Error('storage'); } });
  const props = { onComplete: () => completed++ };
  async function enter(value) { for (const digit of value) await find(h.render(props), 'PinKeypad').props.onDigit(digit); }
  await enter('1234'); assert.match(find(h.render(props), 'AuthHeading').props.title, /Confirm/);
  await enter('9999'); assert.equal(saves, 0); assert.equal(completed, 0);
  await enter('1234'); assert.equal(saves, 1); assert.equal(completed, 0);
  fail = false; await enter('1234'); assert.equal(completed, 1);
});

test('PIN entry respects lockout, records failure and leaves true logout behind confirmation', async () => {
  let locked = false, failed = 0, completed = 0, logouts = 0;
  const h = harness('PinEntryScreen', { verifyPin: async p => p === '1234', logout: () => logouts++ }, {
    checkLockout: async () => ({ locked, remaining: 60000 }),
    recordFailedAttempt: async () => { failed++; return { locked: false, remaining: 2 }; },
  });
  const props = { onSuccess: () => completed++ };
  h.render(props); await flush();
  async function enter(value) { for (const digit of value) await find(h.render(props), 'PinKeypad').props.onDigit(digit); }
  await enter('9999'); assert.equal(failed, 1); assert.equal(completed, 0);
  locked = true; await enter('1234'); assert.equal(completed, 0); assert.equal(find(h.render(props), 'PinKeypad').props.disabled, true);
  nodes(h.render(props)).find(n => n.type === 'AuthLink' && n.children[0] === 'Not Raymond?').props.onPress();
  assert.equal(logouts, 0);
  let dialog = find(h.render(props), 'AgentConfirmDialog');
  assert.equal(dialog.props.visible, true);
  dialog.props.onCancel();
  assert.equal(find(h.render(props), 'AgentConfirmDialog').props.visible, false);
  assert.equal(logouts, 0);
  nodes(h.render(props)).find(n => n.type === 'AuthLink' && n.children[0] === 'Not Raymond?').props.onPress();
  dialog = find(h.render(props), 'AgentConfirmDialog');
  dialog.props.onConfirm();
  assert.equal(logouts, 1);
  assert.equal(find(h.render(props), 'AgentConfirmDialog').props.visible, false);
  assert.equal(h.alert, undefined);
});

test('password recovery shows confirmation only after API success and never discloses account existence', async () => {
  let fail = true;
  const h = harness('PasswordRecoveryScreen', { resetPassword: async () => { if (fail) throw Error('Service unavailable'); } });
  const props = { navigation: { goBack() {} }, route: { params: { email: 'agent@example.test' } } };
  await find(h.render(props), 'AuthButton').props.onPress();
  assert.ok(find(h.render(props), 'AuthField'));
  fail = false; await find(h.render(props), 'AuthButton').props.onPress();
  assert.equal(find(h.render(props), 'AuthField'), undefined);
  assert.match(find(h.render(props), 'AuthHeading').props.description, /If an account exists/);
});
