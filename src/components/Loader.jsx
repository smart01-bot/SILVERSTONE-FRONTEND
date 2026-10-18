import React, { useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, View, Text, Animated, Easing, RefreshControl, StyleSheet, StatusBar } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../constants/theme';
import { agentColors } from './agent/agentTheme';
import { SWIFT_WINGS } from './SwiftWakalaMark';

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

// One silhouette and 1200ms loop for pages, buttons, refreshes and the global overlay.
// A stationary mark is retained when motion is reduced or the containing route is hidden.
export function WingLoader({ color, size = 66, active = true, label, style }) {
  const { isDark } = useTheme();
  const reduced = useReducedMotion();
  const navigation = useContext(NavigationContext);
  const [focused, setFocused] = useState(() => navigation?.isFocused?.() ?? true);
  const [foreground, setForeground] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const separation = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => setForeground(state === 'active'));
    const focus = navigation?.addListener('focus', () => setFocused(true));
    const blur = navigation?.addListener('blur', () => setFocused(false));
    setFocused(navigation?.isFocused?.() ?? true);
    return () => { sub.remove(); focus?.(); blur?.(); };
  }, [navigation]);
  useEffect(() => {
    separation.setValue(0); pulse.setValue(0);
    if (reduced || !active || !foreground || !focused) return undefined;
    const ease = Easing.bezier(.45, 0, .55, 1);
    const move = (value, toValue, duration) => Animated.timing(value, { toValue, duration, easing: ease, useNativeDriver: true, isInteraction: false });
    const loops = [
      Animated.loop(Animated.sequence([move(separation, 1, 360), move(separation, 0, 540), Animated.delay(300)])),
      Animated.loop(Animated.sequence([move(pulse, 1, 480), move(pulse, 0, 420), Animated.delay(300)])),
    ];
    loops.forEach(loop => loop.start());
    return () => { loops.forEach(loop => loop.stop()); separation.stopAnimation(); pulse.stopAnimation(); };
  }, [active, reduced, foreground, focused, separation, pulse]);
  const ratio = size / 124;
  const ink = color || agentColors(isDark).text;
  return <View testID="wing-loader" accessible={Boolean(label)} accessibilityRole={label ? 'progressbar' : undefined}
    accessibilityLabel={label} accessibilityState={label ? { busy: true } : undefined}
    accessibilityElementsHidden={!label} importantForAccessibility={label ? 'auto' : 'no-hide-descendants'}
    style={[{ width: size, height: Math.round(size * 56 / 66), flexShrink: 0 }, style]}>
    <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [
      { translateX: pulse.interpolate({ inputRange: [0, 1], outputRange: [0, 1.5 * ratio] }) },
      { translateY: pulse.interpolate({ inputRange: [0, 1], outputRange: [0, -1.5 * ratio] }) },
      { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] }) },
    ] }]}>
      {SWIFT_WINGS.map((path, index) => <Animated.View key={index} style={[StyleSheet.absoluteFillObject, { transform: [
        { translateX: separation.interpolate({ inputRange: [0, 1], outputRange: [0, (index ? -3 : 3) * ratio] }) },
        { translateY: separation.interpolate({ inputRange: [0, 1], outputRange: [0, (index ? 2.5 : -2.5) * ratio] }) },
      ] }]}><Svg width="100%" height="100%" viewBox="-12 -12 124 104" accessible={false}><Path d={path} fill={ink} /></Svg></Animated.View>)}
    </Animated.View>
  </View>;
}

export function LoadingIndicator({ label, color, labelColor, size = 66, style }) {
  const { isDark, lang } = useTheme();
  const colors = agentColors(isDark);
  const text = label || (lang === 'sw' ? 'Inapakia…' : 'Loading…');
  return <View testID="loading-indicator" accessible accessibilityRole="progressbar" accessibilityLabel={text} accessibilityState={{ busy: true }} accessibilityLiveRegion="polite" style={[s.indicator, style]}>
    <WingLoader color={color || colors.text} size={size} />
    <Text style={[s.label, { color: labelColor || colors.secondary }]}>{text}</Text>
  </View>;
}

export function ScreenLoader({ label }) {
  const { isDark } = useTheme();
  const colors = agentColors(isDark);
  return <View style={[s.root, { backgroundColor: colors.bg }]}>
    <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
    <LoadingIndicator label={label} />
  </View>;
}

// Keep compatibility with existing auth/registration button consumers.
export function ButtonDots({ color = '#fff' }) { return <WingLoader color={color} size={29} />; }
export function LoadingTrack({ color, compact = false }) { return <WingLoader color={color} size={compact ? 29 : 66} />; }

// Preserve native pull gestures while rendering the brand in the scroll content.
// Pair with RefreshIndicator so a hidden platform spinner never hides the busy state.
export function BrandRefreshControl(props) {
  return <RefreshControl {...props} colors={['transparent']} tintColor="transparent" progressBackgroundColor="transparent" title={undefined} />;
}
export function RefreshIndicator({ refreshing, label, color }) {
  const { isDark, lang } = useTheme();
  if (!refreshing) return null;
  const text = label || (lang === 'sw' ? 'Inasasisha…' : 'Refreshing…');
  const ink = color || agentColors(isDark).text;
  return <View accessible accessibilityRole="progressbar" accessibilityLabel={text} accessibilityState={{ busy: true }} accessibilityLiveRegion="polite" style={s.refresh}>
    <WingLoader color={ink} size={29} /><Text style={[s.label, { color: ink }]}>{text}</Text>
  </View>;
}
const s = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  indicator: { alignItems: 'center', gap: 18, paddingVertical: 24, paddingHorizontal: 16 },
  label: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  refresh: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 8 },
});
