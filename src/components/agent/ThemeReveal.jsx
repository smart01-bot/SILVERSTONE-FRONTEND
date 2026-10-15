import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Image as SvgImage, Mask, Rect } from 'react-native-svg';
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';
import { useTheme } from '../../context/ThemeContext';
import { useAgentUI } from './AgentUI';

const RevealContext = createContext(null);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
export const useThemeReveal = () => useContext(RevealContext);

// Capture pixels, never mount a second navigation tree or replay screen effects.
// The bitmap lives only in memory for the duration of the transition.
export function ThemeReveal({ children }) {
  const { isDark, setTheme } = useTheme();
  const { reducedMotion, colors, copy } = useAgentUI();
  const frame = useRef(null);
  const locked = useRef(false);
  const alive = useRef(true);
  const pending = useRef(null);
  const watchdog = useRef(null);
  const frames = useRef([]);
  const webCommit = useRef(null);
  const webTransition = useRef(null);
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState('');
  const radius = useSharedValue(0);
  const animatedProps = useAnimatedProps(() => ({ r: radius.value }));

  const finish = () => {
    clearTimeout(watchdog.current);
    frames.current.forEach(cancelAnimationFrame);
    frames.current = [];
    pending.current = null;
    locked.current = false;
    if (alive.current) setSnapshot(null);
  };

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      webCommit.current?.();
      webTransition.current?.skipTransition();
      cancelAnimation(radius);
      finish();
    };
  }, []);

  useEffect(() => {
    // View Transitions suspend rendering, including requestAnimationFrame.
    // Resolve after React commits the new theme, rather than waiting for a frame.
    webCommit.current?.();
    webCommit.current = null;
  }, [isDark]);

  const commit = preference => {
    // Updating context is immediate; persistence must not delay the reveal.
    setTheme(preference).catch(() => {
      if (alive.current) setError(copy('Theme changed, but could not be saved.', 'Mwonekano umebadilika lakini haujahifadhiwa.'));
    });
  };

  const start = () => {
    const next = pending.current;
    if (!next || next.started) return;
    next.started = true;
    // Allow the SVG bitmap to paint before changing the live theme beneath it.
    frames.current.push(requestAnimationFrame(() => {
      frames.current.push(requestAnimationFrame(() => {
        if (!alive.current || pending.current !== next) return;
        commit(next.preference);
        frames.current.push(requestAnimationFrame(() => {
          radius.value = withTiming(next.radius, { duration: 560, easing: Easing.bezier(0.22, 0.61, 0.36, 1) }, finished => {
            if (finished) runOnJS(finish)();
          });
        }));
      }));
    }));
  };

  useEffect(() => {
    if (reducedMotion && pending.current) {
      const preference = pending.current.preference;
      cancelAnimation(radius);
      commit(preference);
      finish();
    }
  }, [reducedMotion]);

  const toggle = async point => {
    if (locked.current) return;
    locked.current = true;
    setError('');
    const preference = isDark ? 'light' : 'dark';
    if (reducedMotion) {
      // Native capture is optional: older development clients still toggle.
      commit(preference);
      finish();
      return;
    }
    if (Platform.OS === 'web') {
      if (typeof document === 'undefined' || !document.startViewTransition) { commit(preference); finish(); return; }
      const style = document.createElement('style');
      style.textContent = '::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}::view-transition-new(root){z-index:1}';
      document.head.appendChild(style);
      let transition;
      let committed = false;
      try {
        transition = document.startViewTransition(() => new Promise(resolve => {
          if (!alive.current) { resolve(); return; }
          committed = true;
          webCommit.current = resolve;
          commit(preference);
        }));
        webTransition.current = transition;
        await transition.ready;
        if (!alive.current) { transition.skipTransition(); return; }
        const x = point?.x ?? window.innerWidth - 80;
        const y = point?.y ?? 40;
        const reach = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        await document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${reach}px at ${x}px ${y}px)`] }, {
          duration: 560, easing: 'cubic-bezier(.22,.61,.36,1)', pseudoElement: '::view-transition-new(root)',
        }).finished;
      } catch { transition?.skipTransition(); if (!committed && alive.current) commit(preference); }
      finally { webCommit.current = null; webTransition.current = null; style.remove(); finish(); }
      return;
    }
    let timeout;
    try {
      const [bounds, bitmap] = await Promise.race([
        Promise.all([
          new Promise(resolve => frame.current?.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }))),
          captureRef(frame, { format: 'png', result: 'base64' }),
        ]),
        new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Capture unavailable')), 350); }),
      ]);
      clearTimeout(timeout);
      if (!alive.current) return;
      if (!bounds.width || !bounds.height) throw new Error('No frame');
      const x = Math.max(0, Math.min(bounds.width, (point?.x ?? bounds.width - 80) - bounds.x));
      const y = Math.max(0, Math.min(bounds.height, (point?.y ?? 40) - bounds.y));
      radius.value = 0;
      pending.current = { preference, radius: Math.hypot(Math.max(x, bounds.width - x), Math.max(y, bounds.height - y)) + 4 };
      setSnapshot({ uri: `data:image/png;base64,${bitmap}`, x, y, width: bounds.width, height: bounds.height });
      // A failed image decode must never leave a frozen screen on top of the app.
      watchdog.current = setTimeout(() => { commit(preference); cancelAnimation(radius); finish(); }, 1400);
    } catch {
      clearTimeout(timeout);
      if (alive.current) { commit(preference); finish(); }
    }
  };

  return <RevealContext.Provider value={{ toggle, error }}>
    <View style={styles.frame}>
      <View ref={frame} collapsable={false} style={[styles.frame, { backgroundColor: colors.bg }]}>{children}</View>
      {snapshot ? <View style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width={snapshot.width} height={snapshot.height}>
          <Defs><Mask id="theme-reveal" x="0" y="0" width={snapshot.width} height={snapshot.height} maskUnits="userSpaceOnUse">
            <Rect width={snapshot.width} height={snapshot.height} fill="white" />
            <AnimatedCircle cx={snapshot.x} cy={snapshot.y} animatedProps={animatedProps} fill="black" />
          </Mask></Defs>
          <SvgImage href={{ uri: snapshot.uri }} width={snapshot.width} height={snapshot.height} mask="url(#theme-reveal)" />
        </Svg>
        <Image source={{ uri: snapshot.uri }} onLoad={start} onError={() => { commit(pending.current?.preference || (isDark ? 'dark' : 'light')); finish(); }}
          style={styles.decode} accessible={false} />
      </View> : null}
    </View>
  </RevealContext.Provider>;
}

const styles = StyleSheet.create({ frame: { flex: 1 }, decode: { position: 'absolute', width: 1, height: 1, opacity: 0 } });
