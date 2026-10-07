// src/components/Loader.jsx
// Shared loading components:
//   <ScreenLoader />     — neutral fullscreen loading state
//   <LoadingIndicator /> — shared dots and localized loading label
//   <ButtonDots color /> — inline dots, with a still reduced-motion fallback

import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, View, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../constants/theme';
import { agentColors } from './agent/agentTheme';

// ─── Screen Loader ─────────────────────────────────────────────────────────

export function ScreenLoader() {
  const { isDark } = useTheme();
  const colors = agentColors(isDark);

  return (
    <View style={[s.root, { backgroundColor: colors.bg }]}>
      <LoadingIndicator />
    </View>
  );
}

export function LoadingIndicator() {
  const { isDark, lang } = useTheme();
  const colors = agentColors(isDark);
  const label = lang === 'sw' ? 'Inapakia…' : 'Loading…';
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label}
      accessibilityState={{ busy: true }} accessibilityLiveRegion="polite" style={s.indicator}>
      <ButtonDots color={colors.text} size={7} />
      <Text style={[s.label, { color: colors.secondary }]}>{label}</Text>
    </View>
  );
}

// ─── Button Dots ───────────────────────────────────────────────────────────

export function ButtonDots({ color = '#fff', size = 6 }) {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.55))).current;
  // Start still until the OS preference is known, avoiding an initial flash
  // of animation for people who have requested reduced motion.
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    let active = true;
    let updated = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', value => {
      updated = true;
      if (active) setReducedMotion(value);
    });
    AccessibilityInfo.isReduceMotionEnabled()
      .then(value => { if (active && !updated) setReducedMotion(value); })
      .catch(() => {});
    return () => { active = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    dots.forEach(dot => dot.setValue(reducedMotion ? 0.7 : 0.35));
    if (reducedMotion) return undefined;
    const loops = dots.map((dot, index) => Animated.loop(Animated.sequence([
      Animated.delay(index * 160),
      Animated.timing(dot, { toValue: 1, duration: 240, useNativeDriver: true, isInteraction: false }),
      Animated.timing(dot, { toValue: 0.35, duration: 360, useNativeDriver: true, isInteraction: false }),
      Animated.delay((2 - index) * 160 + 180),
    ])));
    loops.forEach(loop => loop.start());
    return () => loops.forEach(loop => loop.stop());
  }, [dots, reducedMotion]);

  return (
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.dotsRow}>
      {dots.map((dot, i) => (
        <Animated.View key={i} style={{
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: color,
          opacity: dot,
        }} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  indicator: { alignItems: 'center', gap: 12, padding: 24 },
  label: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 20 },
});
