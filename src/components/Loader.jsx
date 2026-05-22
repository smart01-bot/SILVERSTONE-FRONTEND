// src/components/Loader.jsx
// Two exports:
//   <ScreenLoader />     — cold start fullscreen: spinning S logo, no blur
//   <ButtonDots color /> — inline 3-dot bounce for button loading states

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';
import { SPINNER_HTML } from './spinnerHtml';

// ─── Screen Loader ─────────────────────────────────────────────────────────

export function ScreenLoader() {
  const { theme, isDark } = useTheme();
  const webRef = useRef(null);

  const onLoad = () => webRef.current?.postMessage(isDark ? 'dark' : 'light');

  // Re-send theme if user switches dark/light while loader is mounted
  useEffect(() => {
    webRef.current?.postMessage(isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <View style={[s.root, { backgroundColor: theme.bg }]}>
      <WebView
        ref={webRef}
        source={{ html: SPINNER_HTML }}
        style={s.webview}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        backgroundColor="transparent"
        androidLayerType="hardware"
        onLoad={onLoad}
      />
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
  webview: { width: 220, height: 220, backgroundColor: 'transparent' },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 20 },
});