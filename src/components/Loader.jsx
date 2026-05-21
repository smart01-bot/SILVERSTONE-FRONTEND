// src/components/Loader.jsx
// Two exports:
//   <ScreenLoader />     — full-screen branded loader (exact HTML animation via WebView)
//   <ButtonDots color /> — inline 3-dot bounce for button loading states

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';
import { SPINNER_HTML } from './spinnerHtml';

// ─── Screen Loader ─────────────────────────────────────────────────────────
// Renders the exact spinning/glowing logo HTML in a transparent WebView.
// Passes 'dark' or 'light' to the HTML via postMessage so the glow colour
// matches the app theme automatically.

export function ScreenLoader() {
  const { theme, isDark } = useTheme();
  const webRef = useRef(null);

  // Once the WebView is ready, tell it which theme we're in
  const onLoad = () => {
    webRef.current?.postMessage(isDark ? 'dark' : 'light');
  };

  return (
    <View style={[s.root, { backgroundColor: theme.bg }]}>
      <WebView
        ref={webRef}
        source={{ html: SPINNER_HTML }}
        style={s.webview}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        backgroundColor="transparent"
        onLoad={onLoad}
      />
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
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webview: {
    width: 220,
    height: 220,
    backgroundColor: 'transparent',
  },

  // ButtonDots
  dotsRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
    height:        20,
  },
  dot: {},
});