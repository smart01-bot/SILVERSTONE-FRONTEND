// src/components/Loader.jsx
// Two exports:
//   <ScreenLoader />     — full-screen branded loader for AppNavigator states
//   <ButtonDots color /> — inline 3-dot animation for button loading states

import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, Easing } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../constants/theme';

// ─── Screen Loader ─────────────────────────────────────────────────────────
// Spins the Silverstone logo mark and pulses its opacity + glow shadow,
// phase-locked on the same 2.4s ease-in-out curve — exactly like the HTML:
//   slow at 0°/360° → dim & faint glow
//   fast at 180°    → bright & full glow
//
// Mixed Animated driver rule respected:
//   rotation  → native driver  (transform only, outer Animated.View)
//   opacity   → JS driver      (inner Animated.View)
//   shadow    → JS driver      (inner Animated.View)

const LOGO = require('../../assets/images/SilverS.png');
const DURATION = 2400; // ms — same for both spin and pulse to phase-lock them
const LOGO_SIZE = 110;

export function ScreenLoader() {
  const { theme, isDark } = useTheme();

  // Native driver — rotation
  const spinAnim  = useRef(new Animated.Value(0)).current;
  // JS driver — opacity + glow
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spin: 0→1 in DURATION ms, ease-in-out, loops continuously
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );

    // Pulse: 0→1→0 over DURATION ms with the same easing curve
    // → glow peaks exactly at the 180° point (max speed) and fades at 0°/360°
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: DURATION / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: DURATION / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );

    spinLoop.start();
    pulseLoop.start();

    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  const rotate = spinAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Opacity: 0.45 dim at rest → 1.0 fully lit at peak
  const opacity = pulseAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0.45, 1],
  });

  // Shadow radius: barely visible → strong bloom glow
  const shadowRadius = pulseAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [2, 22],
  });

  // Shadow opacity: invisible → full
  const shadowOpacity = pulseAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, 0.9],
  });

  // White glow on dark backgrounds, dark glow on light — mirrors HTML behaviour
  const glowColor = isDark ? '#ffffff' : '#000000';

  return (
    <View style={[s.root, { backgroundColor: theme.bg }]}>
      {/* Outer view: rotation only (native driver) */}
      <Animated.View style={{ transform: [{ rotate }] }}>
        {/* Inner view: opacity + shadow glow (JS driver) */}
        <Animated.View
          style={{
            opacity,
            shadowColor:   glowColor,
            shadowOffset:  { width: 0, height: 0 },
            shadowRadius,
            shadowOpacity,
          }}
        >
          <Image
            source={LOGO}
            style={s.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ─── Button Dots ───────────────────────────────────────────────────────────
// Three small circles that bounce up and down in sequence.
// Drop-in replacement for <ActivityIndicator color="…" /> inside buttons.
//
// Props:
//   color — dot color (default '#fff')
//   size  — dot diameter in px (default 6)

export function ButtonDots({ color = '#fff', size = 6 }) {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const handles = dots.map((dot, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: -(size + 2),
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 260,
            useNativeDriver: true,
          }),
        ])
      );
      const t = setTimeout(() => loop.start(), i * 130);
      return { loop, t };
    });

    return () => {
      handles.forEach(({ loop, t }) => {
        clearTimeout(t);
        loop.stop();
      });
    };
  }, []);

  return (
    <View style={s.dotsRow}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            s.dot,
            {
              width:           size,
              height:          size,
              borderRadius:    size / 2,
              backgroundColor: color,
              transform:       [{ translateY: dot }],
            },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // ScreenLoader
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width:  LOGO_SIZE,
    height: LOGO_SIZE,
  },

  // ButtonDots
  dotsRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
    height:        20,
  },
  dot: {
    // size / color applied inline
  },
});
