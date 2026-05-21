// src/context/LoaderContext.jsx
// Global overlay loader — blurs the screen behind it and shows the spinning S.
//
// NOTE: WebView version (exact HTML animation) is ready in spinnerHtml.js
// but requires a custom dev build. This version uses expo-blur + pure RN
// Animated as a drop-in until the build is set up. See HANDOFF_SESSION4.md.
//
// Usage in any screen:
//   const { showLoader, hideLoader } = useLoader();
//   showLoader();   // before async work
//   hideLoader();   // in finally {}

import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from './ThemeContext';

const LoaderContext = createContext({ showLoader: () => {}, hideLoader: () => {} });
export const useLoader = () => useContext(LoaderContext);

const LOGO     = require('../../assets/images/SilverS.png');
const DURATION = 2400;
const SIZE     = 110;

function SpinningS({ isDark }) {
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
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Animated.View style={{
        opacity,
        shadowColor:   isDark ? '#ffffff' : '#000000',
        shadowOffset:  { width: 0, height: 0 },
        shadowRadius:  shadow,
        shadowOpacity: shadowO,
      }}>
        <Image source={LOGO} style={{ width: SIZE, height: SIZE }} resizeMode="contain" />
      </Animated.View>
    </Animated.View>
  );
}

export function LoaderProvider({ children }) {
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showLoader = useCallback(() => {
    setVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 180, useNativeDriver: true,
    }).start();
  }, []);

  const hideLoader = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0, duration: 220, useNativeDriver: true,
    }).start(() => setVisible(false));
  }, []);

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader }}>
      {children}

      {visible && (
        <Animated.View
          style={[StyleSheet.absoluteFillObject, s.overlay, { opacity: fadeAnim }]}
          pointerEvents="box-none"
        >
          <BlurView
            intensity={60}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={s.center}>
            <SpinningS isDark={isDark} />
          </View>
        </Animated.View>
      )}
    </LoaderContext.Provider>
  );
}

const s = StyleSheet.create({
  overlay: { zIndex: 9999, elevation: 9999 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
});