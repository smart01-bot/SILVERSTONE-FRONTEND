import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const code = require('@babel/core').transformSync(fs.readFileSync(new URL('../src/components/SessionTransition.jsx', import.meta.url), 'utf8'), {
  configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'],
}).code;

function harness() {
  const state = [], effects = [], animations = [];
  let cursor = 0, pending = [], dirty = false, reduced = false, dismissals = 0;
  class Value {
    constructor(value) { this.value = value; }
    setValue(value) { this.value = value; }
    stopAnimation() {}
    interpolate() { return this; }
  }
  const react = {
    useRef(value) { const i = cursor++; return state[i] ||= { current: value }; },
    useState(value) { const i = cursor++; if (!(i in state)) state[i] = value; return [state[i], next => { if (next !== state[i]) { state[i] = next; dirty = true; } }]; },
    useLayoutEffect(fn, deps) { const i = cursor++; const old = effects[i]; if (!old || deps.some((v, j) => v !== old.deps[j])) pending.push(() => { old?.cleanup?.(); effects[i] = { deps, cleanup: fn() }; }); },
    createElement(type, props, ...children) { return { type, props, children }; },
  };
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (name === 'react') return react;
    if (name === './Loader') return { useReducedMotion: () => reduced };
    return { Animated: { Value, View: 'Animated.View', timing(value, options) {
      const animation = { value, options, start(callback) { this.callback = callback; }, stop() { this.stopped = true; }, finish() { value.setValue(1); this.callback({ finished: true }); } };
      animations.push(animation); return animation;
    } }, Easing: { bezier: () => 'ease-out' }, Keyboard: { dismiss() { dismissals++; } }, StyleSheet: { create: x => x } };
  } });
  return {
    animations, setReduced: value => { reduced = value; }, get dismissals() { return dismissals; },
    render(props) { let tree; do { dirty = false; cursor = 0; pending = []; tree = module.exports.default(props); pending.forEach(fn => fn()); } while (dirty); return tree; },
    unmount() { effects.forEach(effect => effect?.cleanup?.()); },
  };
}

test('handoff displays only the new screen, then restores interaction after the entrance', () => {
  const h = harness();
  h.render({ stage: 'login', children: 'login' });
  assert.equal(h.animations.length, 0);
  let tree = h.render({ stage: 'pin', children: 'PIN' });
  assert.deepEqual(tree.children, ['PIN']);
  assert.equal(tree.props.pointerEvents, 'none');
  assert.equal(h.animations[0].value.value, 0);
  assert.equal(h.animations[0].options.useNativeDriver, true);
  assert.equal(h.dismissals, 1);
  h.animations[0].finish();
  tree = h.render({ stage: 'pin', children: 'PIN with error' });
  assert.equal(tree.props.pointerEvents, 'auto');
  assert.equal(h.animations.length, 1, 'same-screen changes must not replay the entrance');
});

test('an interrupted unlock removes home immediately and cancels its old animation', () => {
  const h = harness();
  h.render({ stage: 'pin', children: 'PIN' });
  h.render({ stage: 'home', children: 'home' });
  const tree = h.render({ stage: 'pin', children: 'PIN' });
  assert.deepEqual(tree.children, ['PIN']);
  assert.equal(h.animations[0].stopped, true);
  h.animations[0].finish();
  assert.equal(h.render({ stage: 'pin', children: 'PIN' }).props.pointerEvents, 'none');
  h.unmount();
  assert.equal(h.animations[1].stopped, true);
});

test('splash and reduced motion skip movement, including changes during an entrance', () => {
  const h = harness();
  h.render({ stage: 'loading', enabled: false });
  h.render({ stage: 'pin', enabled: false });
  h.render({ stage: 'pin', enabled: true });
  assert.equal(h.animations.length, 0);
  h.render({ stage: 'home' });
  h.setReduced(true);
  const tree = h.render({ stage: 'home' });
  assert.equal(h.animations[0].stopped, true);
  assert.equal(tree.props.style[1].opacity.value, 1);
  assert.equal(tree.props.pointerEvents, 'auto');
  h.render({ stage: 'pin' });
  assert.equal(h.animations.length, 1);
});
