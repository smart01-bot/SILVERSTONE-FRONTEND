// Exercise the theme owner with native background and storage services injected.
// Native keyboard rendering still needs an Android device check.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { agentColors } from '../src/components/agent/agentTheme.js';
const require = createRequire(import.meta.url);
const code = require('@babel/core').transformSync(fs.readFileSync(new URL('../src/context/ThemeContext.jsx', import.meta.url), 'utf8'), {
  configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'],
}).code;
const tick = () => new Promise(resolve => setImmediate(resolve));
function harness({ saved = null, device = 'light', nativeFails = false } = {}) {
  const state = [], effects = [], painted = [];
  let cursor = 0, pending = [], dirty = false;
  const react = {
    createContext: () => ({ Provider: 'Provider' }), useContext() {},
    useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => { if (value !== state[i]) { state[i] = value; dirty = true; } }]; },
    useEffect(fn, deps) { const i = cursor++; const old = effects[i]; if (!old || deps.some((v, j) => v !== old.deps[j])) pending.push(() => { old?.cleanup?.(); effects[i] = { deps, cleanup: fn() }; }); },
    createElement(type, props) { return { type, props }; },
  };
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (name === 'react') return react;
    if (name === 'react-native') return { useColorScheme: () => device };
    if (name === '@react-native-async-storage/async-storage') return { getItem: async key => key.endsWith('preference') ? saved : 'en', setItem: async () => {}, removeItem: async () => {} };
    if (name === 'expo-system-ui') return { setBackgroundColorAsync: async color => { painted.push(color); if (nativeFails) throw Error('No current activity'); } };
    if (name.endsWith('/theme')) return { LIGHT: {}, DARK: {} };
    if (name.endsWith('/translations')) return { useTr: () => key => key };
    if (name.endsWith('/agentTheme')) return { agentColors };
    throw Error(name);
  } });
  return { painted, setDevice(value) { device = value; }, render() {
    let tree; do { cursor = 0; pending = []; dirty = false; tree = module.exports.ThemeProvider({ children: 'app' }); pending.forEach(fn => fn()); } while (dirty);
    return tree.props.value;
  } };
}

test('native backdrop follows saved and manually selected app themes independently of device theme', async () => {
  const h = harness({ saved: 'dark', device: 'light' });
  h.render(); await tick(); let theme = h.render();
  assert.equal(theme.isDark, true);
  assert.equal(h.painted.at(-1), agentColors(true).bg);
  await theme.setTheme('light'); theme = h.render();
  assert.equal(h.painted.at(-1), agentColors(false).bg);
  h.setDevice('dark'); h.render();
  assert.equal(h.painted.at(-1), agentColors(false).bg, 'manual selection wins');
  await theme.setTheme('auto'); h.render();
  assert.equal(h.painted.at(-1), agentColors(true).bg);
  h.setDevice('light'); h.render();
  assert.equal(h.painted.at(-1), agentColors(false).bg);
});

test('language changes do not repaint the native window and unavailable native calls do not block startup', async () => {
  const h = harness({ nativeFails: true });
  h.render(); await tick(); const theme = h.render();
  assert.equal(theme.themeReady, true);
  const count = h.painted.length;
  await theme.setLang('sw'); h.render(); await tick();
  assert.equal(h.painted.length, count);
});
