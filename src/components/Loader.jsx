// src/components/Loader.jsx
// Two exports:
//   <ScreenLoader />     — cold start fullscreen: spinning S logo, no blur
//   <ButtonDots color /> — inline 3-dot bounce for button loading states
//
// NOTE: This is a temporary pure-RN implementation. The final version
// should use react-native-webview + spinnerHtml.js (exact HTML animation)
// once a custom dev build is set up. See HANDOFF_SESSION4.md.

import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, Easing } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const LOGO     = require('../../assets/images/SilverS.png');
const DURATION = 2400;
const SIZE     = 110;

// ─── Screen Loader ─────────────────────────────────────────────────────────

export function ScreenLoader() {
  const { theme, isDark } = useTheme();
  const spinAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1, duration: DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1, duration: DURATION / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0, duration: DURATION / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    spin.start();
    pulse.start();
    return () => { spin.stop(); pulse.stop(); };
  }, []);

  const rotate  = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  const shadow  = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
  const shadowO = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.9] });

  return (
    <View style={[s.root, { backgroundColor: theme.bg }]}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Animated.View style={{
          opacity,
          shadowColor:   isDark ? '#ffffff' : '#000000',
          shadowOffset:  { width: 0, height: 0 },
          shadowRadius:  shadow,
          shadowOpacity: shadowO,
        }}>
          <Image source={LOGO} style={s.logo} resizeMode="contain" />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ─── Button Dots ───────────────────────────────────────────────────────────

export function ButtonDots({ color = '#fff', size = 6 }) {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const handles = dots.map((dot, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: -(size + 2), duration: 260, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0,           duration: 260, useNativeDriver: true }),
        ])
      );
      const t = setTimeout(() => loop.start(), i * 130);
      return { loop, t };
    });
    return () => handles.forEach(({ loop, t }) => { clearTimeout(t); loop.stop(); });
  }, []);

  return (
    <View style={s.dotsRow}>
      {dots.map((dot, i) => (
        <Animated.View key={i} style={{
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ translateY: dot }],
        }} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo:    { width: SIZE, height: SIZE },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 20 },
});