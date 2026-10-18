// Exercise the real Profile confirmation handlers and the reusable dialog props.
// Native rendering and device Back button still require a physical-device check.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const babel = require('@babel/core');
const nodes = t => !t || typeof t !== 'object' ? [] : Array.isArray(t)
  ? t.flatMap(nodes) : [t, ...(t.children || []).flatMap(nodes)];
const find = (tree, testID) => nodes(tree).find(node => node.props?.testID === testID);
const compile = path => babel.transformSync(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), {
  configFile: false, babelrc: false,
  plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'],
}).code;
const createElement = (type, props, ...children) => ({ type, props: props || {}, children });
const styles = { hairlineWidth: 1, absoluteFillObject: {}, create: v => v };
const palette = {
  bg: '#000000', surface: '#14171B', text: '#F5F5F5', secondary: '#B8BCC1',
  muted: '#A1A7AF', border: '#303438', selected: '#22272B',
  action: '#F4F5F6', actionText: '#111315', scrim: 'rgba(0,0,0,0.62)',
};
const fonts = { body: 'Inter', bodyMed: 'Inter', bodySemi: 'Inter', heading: 'Manrope' };

function profileHarness(language = 'en', screen = '../src/screens/sub-agent/ProfileScreen.jsx') {
  const state = [];
  let cursor = 0, locks = 0;
  const react = {
    createElement, useEffect() {},
    useState(value) {
      const i = cursor++;
      if (!(i in state)) state[i] = value;
      return [state[i], next => { state[i] = typeof next === 'function' ? next(state[i]) : next; }];
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(compile(screen), {
    module, exports: module.exports,
    require: name => {
      if (name === 'react') return react;
      if (name === 'react-native') return {
        View: 'View', Text: 'Text', TextInput: 'TextInput', TouchableOpacity: 'TouchableOpacity', Pressable: 'Pressable', ScrollView: 'ScrollView',
        StyleSheet: styles, useWindowDimensions: () => ({ height: 800, fontScale: 1 }), Alert: { alert() { throw Error('Sign out must not use a native alert'); } },
      };
      if (name === '@expo/vector-icons') return { Ionicons: 'Ionicons' };
      if (name === 'expo-clipboard') return {};
      if (name.includes('AuthContext')) return { useAuth: () => ({
        user: { id: 'agent1', email: 'agent@example.test' },
        profile: { name: 'Demo Agent', pinSet: true },
        lockSession: () => { locks++; },
      }) };
      if (name.includes('ThemeContext')) return { useTheme: () => ({ userPreference: 'dark', isDark: true, lang: language, tr: key => key }) };
      if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ top: 24, bottom: 24 }) };
      if (name.includes('PressFeedback')) return { default: 'PressFeedback', __esModule: true };
      if (name.includes('SwiftWakalaMark')) return { default: 'SwiftWakalaMark', __esModule: true };
      if (name.includes('MainAgentWorkspaceSheet')) return { default: 'MainAgentWorkspaceSheet', __esModule: true, profileText: value => typeof value === 'string' && value.trim() ? value.trim() : null };
      if (name.includes('constants/theme')) return { fonts };
      if (name.includes('screenData')) return { db: {}, doc: () => {}, updateDoc: async () => {} };
      if (name.includes('AgentConfirmDialog')) return { AgentConfirmDialog: 'AgentConfirmDialog' };
      if (name.includes('AgentUI')) return {
        AgentScroll: 'AgentScroll', AgentButton: 'AgentButton',
        AgentSheet: 'AgentSheet', AgentRow: 'AgentRow',
        useAgentUI: () => ({ colors: palette, lang: language, copy: (en, sw) => language === 'sw' ? sw : en }),
      };
      throw Error('Unexpected import ' + name);
    },
  });
  return {
    render() { cursor = 0; return module.exports.default({ navigation: { navigate() {}, closeDrawer() {} }, items: [{ route: 'Overview', label: 'Overview', icon: 'grid-outline' }] }); },
    get locks() { return locks; },
  };
}

test('profile sign out is cancelable and only confirm locks the retained account', () => {
  const h = profileHarness();
  assert.equal(nodes(h.render()).find(n => n.type === 'AgentConfirmDialog').props.visible, false);
  find(h.render(), 'profile-sign-out').props.onPress();
  let dialog = nodes(h.render()).find(n => n.type === 'AgentConfirmDialog');
  assert.equal(dialog.props.visible, true);
  assert.match(dialog.props.description, /linked to this device/);
  dialog.props.onCancel();
  assert.equal(nodes(h.render()).find(n => n.type === 'AgentConfirmDialog').props.visible, false);
  assert.equal(h.locks, 0);
  find(h.render(), 'profile-sign-out').props.onPress();
  dialog = nodes(h.render()).find(n => n.type === 'AgentConfirmDialog');
  dialog.props.onConfirm();
  assert.equal(h.locks, 1);
  assert.equal(nodes(h.render()).find(n => n.type === 'AgentConfirmDialog').props.visible, false);
});

test('Profile confirmation translates actions and explanation to Kiswahili', () => {
  const h = profileHarness('sw');
  find(h.render(), 'profile-sign-out').props.onPress();
  const dialog = nodes(h.render()).find(n => n.type === 'AgentConfirmDialog');
  assert.equal(dialog.props.cancelLabel, 'Ghairi');
  assert.equal(dialog.props.confirmLabel, 'Ondoka');
  assert.match(dialog.props.description, /skrini ya PIN/);
});

function dialogTree(reducedMotion = false, hideCancel = false) {
  let cancelled = 0, confirmed = 0;
  const module = { exports: {} };
  const react = { createElement };
  vm.runInNewContext(compile('../src/components/agent/AgentConfirmDialog.jsx'), {
    module, exports: module.exports,
    require: name => {
      if (name === 'react') return react;
      if (name === 'react-native') return {
        Pressable: 'Pressable', ScrollView: 'ScrollView', Text: 'Text', View: 'View', StyleSheet: styles,
      };
      if (name === '@expo/vector-icons') return { Ionicons: 'Ionicons' };
      if (name.includes('LoaderContext')) return { LoadingModal: 'Modal' };
      if (name.includes('constants/theme')) return { fonts };
      if (name.includes('ThemeContext')) return { useTheme: () => ({ isDark: true, lang: 'en' }) };
      if (name.includes('agentTheme')) return { agentColors: () => palette };
      if (name.includes('Loader')) return { useReducedMotion: () => reducedMotion };
      throw Error('Unexpected import ' + name);
    },
  });
  const tree = module.exports.AgentConfirmDialog({
    visible: true, hideCancel, icon: 'log-out-outline', title: 'Sign out?',
    description: 'Return to PIN', cancelLabel: 'Cancel', confirmLabel: 'Sign out',
    onCancel: () => { cancelled++; }, onConfirm: () => { confirmed++; },
  });
  return { tree, get cancelled() { return cancelled; }, get confirmed() { return confirmed; } };
}

test('dialog uses theme surfaces, not native Alert, with separate cancel and confirm actions', () => {
  const h = dialogTree();
  assert.equal(h.tree.type, 'Modal');
  assert.equal(h.tree.props.transparent, true);
  assert.equal(h.tree.props.animationType, 'fade');
  assert.equal(h.tree.props.statusBarTranslucent, true);
  assert.equal(find(h.tree, 'agent-confirm-dialog').props.style[1].backgroundColor, palette.surface);
  find(h.tree, 'agent-confirm-backdrop').props.onPress();
  h.tree.props.onRequestClose();
  find(h.tree, 'agent-confirm-cancel').props.onPress();
  assert.equal(h.cancelled, 3);
  assert.equal(h.confirmed, 0);
  find(h.tree, 'agent-confirm-accept').props.onPress();
  assert.equal(h.confirmed, 1);
  assert.equal(dialogTree(true).tree.props.animationType, 'none');
});

test('sign-out error dialog has one dismiss action and supports Android Back', () => {
  const h = dialogTree(false, true);
  assert.equal(find(h.tree, 'agent-confirm-cancel'), undefined);
  h.tree.props.onRequestClose();
  assert.equal(h.cancelled, 1);
  find(h.tree, 'agent-confirm-accept').props.onPress();
  assert.equal(h.confirmed, 1);
});

test('main-agent drawer sign out requires confirmation and retains the account', () => {
  const h = profileHarness('en', '../src/components/DrawerContent.jsx');
  find(h.render(), 'drawer-sign-out').props.onPress();
  let dialog = nodes(h.render()).find(n => n.type === 'AgentConfirmDialog');
  assert.equal(dialog.props.visible, true);
  dialog.props.onCancel();
  assert.equal(h.locks, 0);
  find(h.render(), 'drawer-sign-out').props.onPress();
  dialog = nodes(h.render()).find(n => n.type === 'AgentConfirmDialog');
  dialog.props.onConfirm();
  assert.equal(h.locks, 1);
  assert.equal(nodes(h.render()).find(n => n.type === 'AgentConfirmDialog').props.visible, false);
});
