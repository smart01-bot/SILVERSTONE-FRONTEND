// Exercise real request-screen handlers with isolated native and queue services.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { normalizePaymentEndpoint } from '../src/api/paymentEndpoints.js';
import { validateAmount } from '../src/api/workflowState.js';
const require = createRequire(import.meta.url);
const code = require('@babel/core').transformSync(fs.readFileSync(new URL('../src/screens/sub-agent/NewRequestScreen.jsx', import.meta.url), 'utf8'), {
  configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'],
}).code;
function harness(options = {}) {
  const values = [], deps = []; let cursor = 0, effects = [], dirty = false;
  const react = {
    useState(initial) { const i = cursor++; if (!(i in values)) values[i] = initial; return [values[i], value => { const next = typeof value === 'function' ? value(values[i]) : value; if (!Object.is(values[i], next)) { values[i] = next; dirty = true; } }]; },
    useRef(value) { const i = cursor++; if (!(i in values)) values[i] = { current: value }; return values[i]; },
    useEffect(fn, next) { const i = cursor++; if (!deps[i] || next.some((v, n) => v !== deps[i][n])) { deps[i] = next; effects.push(fn); } },
    createElement(type, props, ...children) { return { type, props: props || {}, children }; },
  };
  const native = { StyleSheet: { create: x => x, hairlineWidth: 1 }, Platform: { OS: 'android' }, Keyboard: { dismiss() {} } };
  for (const name of ['View', 'Text', 'TextInput', 'TouchableOpacity', 'Switch', 'KeyboardAvoidingView']) native[name] = name;
  const queue = { isOnline: options.online ?? true, enqueue: options.enqueue || (async () => {}), syncQueue: async () => ({ remaining: 0 }), pendingCount: 0 };
  const ui = { useAgentUI: () => ({ colors: {}, copy: en => en, headerHeight: 118, reducedTransparency: false }) };
  for (const name of ['AgentScroll', 'AgentButton', 'AgentSheet', 'AgentNotice']) ui[name] = name;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: p => {
    if (p === 'react') return react;
    if (p === 'react-native') return native;
    if (p === '@expo/vector-icons') return { Ionicons: 'Ionicons' };
    if (p === 'expo-blur') return { BlurView: 'BlurView' };
    if (p === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ top: 0 }) };
    if (p.endsWith('/workflowState')) return { validateAmount };
    if (p.endsWith('/paymentEndpoints')) return { normalizePaymentEndpoint };
    if (p.endsWith('/AuthContext')) return { useAuth: () => ({ user: { id: 'agent' }, profile: { name: 'Demo' } }) };
    if (p.endsWith('/ThemeContext')) return { useTheme: () => ({ tr: key => key }) };
    if (p.endsWith('/LoaderContext')) return { useLoader: () => ({ showLoader() {}, hideLoader() {} }) };
    if (p.endsWith('/theme')) return { fonts: {} };
    if (p.endsWith('/NetworkLogo')) return { default: 'NetworkLogo', __esModule: true };
    if (p.endsWith('/useOfflineQueue')) return { useOfflineQueue: () => queue };
    if (p.endsWith('/AgentUI')) return ui;
    throw Error(p);
  } });
  const route = { params: { prefill: { sourceNetwork: 'Voda', destNetwork: 'Yas', sourcePhone: '0712345678', destPhone: '0787654321', amount: '50000', ...options.prefill } } };
  const navigation = { setParams: next => { Object.assign(route.params, next); dirty = true; } };
  function render() { let tree; do { dirty = false; cursor = 0; effects = []; tree = module.exports.default({ navigation, route }); effects.forEach(f => f()); } while (dirty); return tree; }
  const all = tree => tree && typeof tree === 'object' ? [tree, ...tree.children.flat(Infinity).flatMap(all)] : [];
  const node = id => all(render()).find(n => n.props.testID === id);
  const sheet = () => all(render()).find(n => n.type === 'AgentSheet');
  return { render, node, sheet, press: id => node(id).props.onPress(), fill: (id, value) => node(id).props.onChangeText(value) };
}

test('cancelled account edits preserve both the committed endpoint and amount', () => {
  const h = harness(); h.press('request-account-source'); h.press('request-network-Airtel'); h.fill('request-account-number', '0698765432');
  h.sheet().props.onClose(); h.press('request-review');
  assert.equal(h.node('request-review-source').children[0], '+255712345678');
  assert.equal(h.node('request-review-amount').children.join(''), 'TZS 50,000');
});

test('changing provider or identifier type clears stale input, and same-network/invalid accounts cannot commit', () => {
  const h = harness(); h.press('request-account-source'); h.press('request-network-Airtel');
  assert.equal(h.node('request-account-number').props.value, '');
  h.fill('request-account-number', 'bad'); h.press('request-save-account'); assert.equal(h.sheet().props.visible, true);
  h.press('request-network-Yas'); h.fill('request-account-number', '0698765432'); h.press('request-save-account'); assert.equal(h.sheet().props.visible, true);
  h.press('request-network-Airtel'); h.fill('request-account-number', '0698765432'); h.press('request-type-agent');
  assert.equal(h.node('request-account-number').props.value, '');
  h.fill('request-account-number', 'AGENT_123'); h.press('request-save-account'); assert.equal(h.sheet().props.visible, false);
  h.press('request-review'); assert.equal(h.node('request-review-source').children[0], 'AGENT_123');
});

test('review editing invalidates the old receipt, preserving exact amounts and explicit endpoint types', async () => {
  let payload; const h = harness({ enqueue: async p => { payload = p; } });
  h.press('request-review'); h.press('request-edit-destination'); h.press('request-type-till'); h.fill('request-account-number', 'SHOP_123'); h.press('request-save-account');
  assert.equal(h.node('request-confirm'), undefined);
  h.fill('request-amount', '9007199254740993'); h.press('request-review'); await h.press('request-confirm');
  assert.equal(payload.amountTzs, '9007199254740993'); assert.equal(payload.destination.identifierType, 'till'); assert.equal(payload.destination.identifier, 'SHOP_123');
  assert.equal(payload.source.identifier, '+255712345678');
});

test('failed confirmation retains review and inputs; concurrent confirmation enqueues only once', async () => {
  let reject, calls = 0;
  const h = harness({ online: false, enqueue: () => { calls++; return new Promise((_, no) => { reject = no; }); } });
  h.press('request-review'); assert.equal(h.node('request-confirm').props.label, 'Save on this device');
  const submit = h.node('request-confirm').props.onPress; const waiting = submit(); await submit(); assert.equal(calls, 1);
  h.sheet().props.onClose(); assert.equal(h.sheet().props.visible, true);
  reject(Error('Save failed')); await waiting;
  assert.equal(h.sheet().props.visible, true); assert.equal(h.node('request-review-amount').children.join(''), 'TZS 50,000');
  assert.equal(h.node('request-confirm').props.disabled, false);
});
