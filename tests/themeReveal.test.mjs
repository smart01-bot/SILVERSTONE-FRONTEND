// Real transition coordinator with injected native capture/animation services.
// These checks do not establish native rendering or frame-rate performance.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const code = require('@babel/core').transformSync(fs.readFileSync(new URL('../src/components/agent/ThemeReveal.jsx', import.meta.url), 'utf8'), {
  configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'],
}).code;
function harness({ reducedMotion = false, capture = async () => 'pixels', saveFails = false, web = false } = {}) {
  const values = [], effects = [], cleanups = [], frames = new Map(), timers = new Map(), saved = [], timings = [];
  let cursor = 0, serial = 0, captures = 0;
  const react = {
    createContext: () => ({ Provider: 'Provider' }),
    useContext() {},
    useState(initial) { const i = cursor++; if (!(i in values)) values[i] = initial; return [values[i], value => { values[i] = typeof value === 'function' ? value(values[i]) : value; }]; },
    useRef(initial) { const i = cursor++; if (!(i in values)) values[i] = { current: initial }; return values[i]; },
    useEffect(fn, deps) { const i = cursor++; if (!values[i] || deps.some((d, n) => d !== values[i][n])) { values[i] = deps; effects.push(() => { cleanups[i]?.(); cleanups[i] = fn(); }); } },
    createElement(type, props, ...children) {
      if (type === 'View' && props?.ref) props.ref.current = { measureInWindow: fn => fn(0, 24, 390, 800) };
      return { type, props: props || {}, children };
    },
  };
  const theme = { isDark: false, setTheme: async value => { theme.isDark = value === 'dark'; saved.push(value); if (saveFails) throw Error('Disk unavailable'); } };
  const module = { exports: {} };
  vm.runInNewContext(code, {
    exports: module.exports, module,
    window: { innerWidth: 390, innerHeight: 844 },
    document: {
      createElement: () => ({ remove() {} }), head: { appendChild() {} },
      startViewTransition: fn => ({ ready: Promise.resolve().then(fn), skipTransition() {} }),
      documentElement: { animate: (keyframes, options) => { timings.push({ keyframes, options }); return { finished: Promise.resolve() }; } },
    },
    setTimeout: (fn, delay) => { const id = ++serial; timers.set(id, { fn, delay }); return id; }, clearTimeout: id => timers.delete(id),
    requestAnimationFrame: fn => { const id = ++serial; frames.set(id, fn); return id; }, cancelAnimationFrame: id => frames.delete(id),
    require: name => name === 'react' ? react : name === 'react-native' ? { Image: 'Image', View: 'View', Platform: { OS: web ? 'web' : 'android' }, StyleSheet: { create: x => x, absoluteFill: {} } }
      : name === 'react-native-svg' ? { default: 'Svg', Circle: 'Circle', Defs: 'Defs', Image: 'SvgImage', Mask: 'Mask', Rect: 'Rect' }
      : name === 'react-native-reanimated' ? { __esModule: true, default: { createAnimatedComponent: x => x }, cancelAnimation() {}, Easing: { bezier() {} }, runOnJS: fn => fn,
        useSharedValue: value => react.useRef({ value }).current, useAnimatedProps: fn => fn(), withTiming: (value, options, fn) => { timings.push({ value, options }); fn(true); return value; } }
      : name === 'react-native-view-shot' ? { captureRef: (...args) => { captures++; return capture(...args); } }
      : name.includes('ThemeContext') ? { useTheme: () => theme }
      : name.includes('AgentUI') ? { useAgentUI: () => ({ reducedMotion, colors: { bg: '#fff' }, copy: en => en }) } : {},
  });
  const render = () => { cursor = 0; const tree = module.exports.ThemeReveal({ children: 'app' }); while (effects.length) effects.shift()(); return tree; };
  return { render, saved, timings, get captures() { return captures; },
    flushFrames() { while (frames.size) { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); } },
    expire(delay) { for (const timer of [...timers.values()]) if (timer.delay === delay) timer.fn(); },
    unmount() { cleanups.forEach(fn => fn?.()); },
  };
}
const nodes = tree => !tree || typeof tree !== 'object' ? [] : [tree, ...tree.children.flatMap(nodes)];
const flush = () => new Promise(resolve => setImmediate(resolve));

test('one tap captures once, waits for decode, covers every corner and rejects overlapping taps', async () => {
  const h = harness();
  const action = h.render().props.value.toggle;
  await action({ x: 300, y: 60 });
  assert.deepEqual(h.saved, []);
  await action({ x: 300, y: 60 });
  assert.equal(h.captures, 1);
  const decode = nodes(h.render()).find(node => node.type === 'Image');
  assert.ok(decode);
  decode.props.onLoad(); h.flushFrames();
  assert.deepEqual(h.saved, ['dark']);
  assert.ok(h.timings[0].value > Math.hypot(300, 764));
  assert.equal(nodes(h.render()).some(node => node.type === 'Image'), false);
  h.unmount();
});

test('reduced motion changes immediately without capture', async () => {
  const h = harness({ reducedMotion: true });
  await h.render().props.value.toggle();
  assert.deepEqual(h.saved, ['dark']); assert.equal(h.captures, 0); assert.equal(h.timings.length, 0);
  h.unmount();
});

test('older native client without capture still changes theme and unlocks for the next tap', async () => {
  const h = harness({ capture: () => { throw Error('Module missing'); } });
  await h.render().props.value.toggle(); await h.render().props.value.toggle();
  assert.deepEqual(h.saved, ['dark', 'light']);
  h.unmount();
});

test('a missing image-load event cannot leave the application covered', async () => {
  const h = harness(); await h.render().props.value.toggle(); h.expire(1400);
  assert.deepEqual(h.saved, ['dark']);
  assert.equal(nodes(h.render()).some(node => node.type === 'Image'), false);
  h.unmount();
});

test('capture completing after the frame unmounts cannot change the next screen theme', async () => {
  let resolve;
  const h = harness({ capture: () => new Promise(r => { resolve = r; }) });
  const pending = h.render().props.value.toggle(); h.unmount(); resolve('pixels'); await pending;
  assert.deepEqual(h.saved, []);
});

test('preference write failure keeps the visible change and exposes a save notice', async () => {
  const h = harness({ reducedMotion: true, saveFails: true }); await h.render().props.value.toggle(); await flush();
  assert.deepEqual(h.saved, ['dark']); assert.match(h.render().props.value.error, /could not be saved/);
  h.unmount();
});

test('browser reveal waits for the React commit without waiting for suspended animation frames', async () => {
  const h = harness({ web: true });
  const pending = h.render().props.value.toggle({ x: 286, y: 36 });
  await flush();
  assert.deepEqual(h.saved, ['dark']);
  assert.equal(h.timings.length, 0);
  h.render();
  await pending;
  assert.equal(h.timings[0].options.pseudoElement, '::view-transition-new(root)');
  assert.equal(h.timings[0].keyframes.clipPath[0], 'circle(0px at 286px 36px)');
  assert.equal(h.captures, 0);
  h.unmount();
});
