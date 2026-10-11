import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, View, Text, Animated, Easing, StyleSheet, StatusBar } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../constants/theme';
import { agentColors } from './agent/agentTheme';
import SilverstoneMark from './SilverstoneMark';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true, updated = false;
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', value => { updated = true; if (active) setReduced(value); });
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active && !updated) setReduced(value); }).catch(() => {});
    return () => { active = false; sub.remove(); };
  }, []);
  return reduced;
}

// Indeterminate motion, never a simulated percentage or a completion claim.
export function LoadingTrack({ color, compact = false }) {
  const reduced = useReducedMotion();
  const travel = useRef(new Animated.Value(0)).current;
  const width = compact ? 28 : 128, segment = compact ? 10 : 36;
  useEffect(() => {
    travel.stopAnimation();
    travel.setValue(reduced ? 0.5 : 0);
    if (reduced) return undefined;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(travel, { toValue: 1, duration: 950, easing: Easing.inOut(Easing.quad), useNativeDriver: true, isInteraction: false }),
      Animated.timing(travel, { toValue: 0, duration: 950, easing: Easing.inOut(Easing.quad), useNativeDriver: true, isInteraction: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduced, travel]);
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width, height: 4, borderRadius: 2, overflow: 'hidden' }}>
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: color, opacity: 0.16 }]} />
    <Animated.View style={{ width: segment, height: 4, borderRadius: 2, backgroundColor: color,
      transform: [{ translateX: travel.interpolate({ inputRange: [0, 1], outputRange: [0, width - segment] }) }] }} />
  </View>;
}

export function LoadingIndicator({ label }) {
  const { isDark, lang } = useTheme();
  const colors = agentColors(isDark);
  const text = label || (lang === 'sw' ? 'Inapakia…' : 'Loading…');
  return <View accessible accessibilityRole="progressbar" accessibilityLabel={text} accessibilityState={{ busy: true }} accessibilityLiveRegion="polite" style={s.indicator}>
    <LoadingTrack color={colors.text} />
    <Text style={[s.label, { color: colors.secondary }]}>{text}</Text>
  </View>;
}

export function ScreenLoader({ label }) {
  const { isDark, lang } = useTheme();
  const colors = agentColors(isDark);
  return <View style={[s.root, { backgroundColor: colors.bg }]}>
    <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
    <SilverstoneMark color={colors.text} size={42} />
    <LoadingIndicator label={label || (lang === 'sw' ? 'Inafungua Silverstone…' : 'Opening Silverstone…')} />
  </View>;
}

// Keep this export for existing button consumers while using the new visual.
export function ButtonDots({ color = '#fff' }) { return <LoadingTrack color={color} compact />; }

const s = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  indicator: { alignItems: 'center', gap: 18, padding: 28 },
  label: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, textAlign: 'center' },
});
