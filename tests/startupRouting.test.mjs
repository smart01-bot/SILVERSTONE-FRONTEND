// Exercise the real navigator with injected native services and a small hook host.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const code = require('@babel/core').transformSync(fs.readFileSync(new URL('../src/navigation/AppNavigator.jsx', import.meta.url), 'utf8'), {
  configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'],
}).code;
const nodes = t => !t || typeof t !== 'object' ? [] : Array.isArray(t) ? t.flatMap(nodes) : [t, ...(t.children || []).flatMap(nodes)];
const find = (t, type) => nodes(t).find(n => n.type === type);
const tick = () => new Promise(resolve => setImmediate(resolve));
const approved = { status: 'approved', accountStatus: 'active', applicationStatus: 'approved', role: 'sub-agent', pinSet: true };
function harness(initial = {}) {
  const auth = { user: null, profile: null, authLoading: false, sessionLocked: false, checkPinExists: async () => true, unlockSession() { auth.sessionLocked = false; }, ...initial };
  const theme = { theme: {}, isDark: false, themeReady: true };
  const state = [], effects = [];
  let cursor = 0, dirty = false, pending = [];
  class Value { constructor(value) { this.value = value; } interpolate() { return this; } }
  const react = {
    useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], next => { const value = typeof next === 'function' ? next(state[i]) : next; if (!Object.is(value, state[i])) { state[i] = value; dirty = true; } }]; },
    useRef(initial) { const i = cursor++; if (!(i in state)) state[i] = { current: initial }; return state[i]; },
    useEffect(fn, deps) { const i = cursor++; const old = effects[i]; if (!old || deps.some((v, j) => !Object.is(v, old.deps[j]))) { pending.push(() => { old?.cleanup?.(); effects[i] = { deps, cleanup: fn() }; }); } },
    createElement(type, props, ...children) { return { type, props: props || {}, children }; },
  };
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: path => {
    if (path === 'react') return react;
    if (path === 'react-native') return { Animated: { Value, View: 'Animated.View' }, View: 'View', StyleSheet: { create: x => x, absoluteFillObject: {} } };
    if (path === '@react-navigation/native') return { createNavigationContainerRef: () => ({}), NavigationContainer: 'NavigationContainer' };
    if (path.includes('AuthContext')) return { useAuth: () => auth };
    if (path.includes('ThemeContext')) return { useTheme: () => theme };
    if (path.includes('AuthUI')) return { useAuthStyle: () => ({ copy: en => en }), AuthFrame: 'AuthFrame', AuthHeading: 'AuthHeading', AuthNotice: 'AuthNotice', AuthButton: 'AuthButton' };
    if (path.includes('agentTheme')) return { agentColors: () => ({ bg: '#000' }) };
    if (path.includes('AgentConfirmDialog')) return { AgentConfirmDialog: 'AgentConfirmDialog' };
    if (path.includes('presentation')) return { canOperate: p => p.accountStatus === 'active' && p.applicationStatus === 'approved' };
    if (path.includes('Loader')) return { ScreenLoader: 'ScreenLoader' };
    return path.split('/').at(-1);
  } });
  return { auth, theme, render(props = {}) { let tree, guard = 0; do { dirty = false; cursor = 0; pending = []; tree = module.exports.default(props); pending.forEach(fn => fn()); assert.ok(++guard < 10); } while (dirty); return tree; } };
}

test('startup holds for fonts, theme and account restore, then reveals role selection without replay', () => {
  const h = harness({ authLoading: true }); h.theme.themeReady = false;
  let tree = h.render({ fontsReady: false });
  assert.equal(find(tree, 'SplashScreen').props.resourcesReady, false);
  assert.equal(find(tree, 'SplashScreen').props.ready, false);
  assert.equal(find(tree, 'AuthNavigator'), undefined);
  h.theme.themeReady = true; h.auth.authLoading = false;
  tree = h.render({ fontsReady: true });
  assert.equal(find(tree, 'SplashScreen').props.ready, true);
  assert.equal(find(tree, 'AuthNavigator').props.initialRoute, 'RoleSelect');
  assert.equal(find(tree, 'Animated.View').props.pointerEvents, 'none');
  find(tree, 'SplashScreen').props.onDone(); tree = h.render();
  assert.equal(find(tree, 'SplashScreen'), undefined);
  assert.equal(find(tree, 'Animated.View').props.pointerEvents, 'auto');
});

test('a retained approved account transitions to PIN, never directly to home', async () => {
  const h = harness({ user: { id: 'one' }, profile: approved, sessionLocked: true });
  assert.equal(find(h.render(), 'SplashScreen').props.ready, false);
  await tick(); let tree = h.render();
  assert.ok(find(tree, 'PinEntryScreen'));
  assert.equal(find(tree, 'SubAgentNavigator'), undefined);
  find(tree, 'SplashScreen').props.onDone(); tree = h.render();
  assert.ok(find(tree, 'PinEntryScreen'));
  find(tree, 'PinEntryScreen').props.onSuccess(); tree = h.render();
  assert.ok(find(tree, 'SubAgentNavigator'));
  assert.equal(find(tree, 'SplashScreen'), undefined);
});

test('PIN read failure presents retry and cannot become PIN setup or home', async () => {
  let fail = true;
  const h = harness({ user: { id: 'one' }, profile: approved, checkPinExists: async () => { if (fail) throw Error('storage unavailable'); return true; } });
  h.render(); await tick(); let tree = h.render();
  assert.equal(find(tree, 'SplashScreen').props.ready, true);
  assert.match(find(tree, 'AuthHeading').props.description, /PIN protection/);
  assert.equal(find(tree, 'PinSetupScreen'), undefined); assert.equal(find(tree, 'SubAgentNavigator'), undefined);
  fail = false; find(tree, 'AuthButton').props.onPress(); h.render(); await tick(); tree = h.render();
  assert.ok(find(tree, 'PinEntryScreen'));
});

test('an obsolete PIN lookup cannot select the route for a different account', async () => {
  let first;
  const h = harness({ user: { id: 'one' }, profile: approved, checkPinExists: () => new Promise(resolve => { first = resolve; }) });
  h.render();
  h.auth.user = { id: 'two' }; h.auth.checkPinExists = async () => true;
  h.render(); await tick(); first(false); await tick(); const tree = h.render();
  assert.ok(find(tree, 'PinEntryScreen')); assert.equal(find(tree, 'PinSetupScreen'), undefined);
});

test('PIN setup, pending applications and connection errors keep their own destination', async () => {
  const setup = harness({ user: { id: 'one' }, profile: approved, checkPinExists: async () => false });
  setup.render(); await tick(); assert.ok(find(setup.render(), 'PinSetupScreen'));
  const pending = harness({ user: { id: 'two' }, profile: { ...approved, status: 'pending', applicationStatus: 'pending' } });
  pending.render(); await tick(); assert.equal(find(pending.render(), 'AuthNavigator').props.initialRoute, 'pending');
  const failed = harness({ connectionError: 'Offline' });
  const tree = failed.render(); assert.equal(find(tree, 'SplashScreen').props.ready, true); assert.equal(find(tree, 'AuthNotice').children[0], 'Offline');
});

test('removing a retained account returns to role selection without replaying the splash', async () => {
  const h = harness({ user: { id: 'one' }, profile: approved });
  h.render(); await tick(); let tree = h.render();
  find(tree, 'SplashScreen').props.onDone();
  h.auth.user = null; h.auth.profile = null;
  tree = h.render();
  assert.equal(find(tree, 'AuthNavigator').props.initialRoute, 'RoleSelect');
  assert.equal(find(tree, 'PinEntryScreen'), undefined);
  assert.equal(find(tree, 'SubAgentNavigator'), undefined);
  assert.equal(find(tree, 'MainAgentNavigator'), undefined);
  assert.equal(find(tree, 'SplashScreen'), undefined);
});

test('failed sign out uses a dismissible themed dialog while retaining the reconnect screen', () => {
  const h = harness({ connectionError: 'Offline', logoutError: 'The request timed out.' });
  h.auth.dismissLogoutError = () => { h.auth.logoutError = ''; };
  const tree = h.render();
  const dialog = find(tree, 'AgentConfirmDialog');
  assert.equal(dialog.props.hideCancel, true);
  assert.equal(dialog.props.description, 'The request timed out.');
  assert.ok(find(tree, 'AuthHeading'));
  dialog.props.onConfirm();
  assert.equal(find(h.render(), 'AgentConfirmDialog'), undefined);
  assert.ok(find(h.render(), 'AuthHeading'));
});
