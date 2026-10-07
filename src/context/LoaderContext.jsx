// src/context/LoaderContext.jsx
// Global overlay loader — neutral dots over a matte, theme-aware scrim.
//
// Usage in any screen:
//   const { showLoader, hideLoader } = useLoader();
//   showLoader();   // before async work
//   hideLoader();   // in finally {}

import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from './ThemeContext';
import { LoadingIndicator } from '../components/Loader';

const LoaderContext = createContext({ showLoader: () => {}, hideLoader: () => {} });
export const useLoader = () => useContext(LoaderContext);

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
          <View accessibilityViewIsModal style={[s.center, {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.94)' : 'rgba(196, 199, 203, 0.96)',
          }]}>
            <LoadingIndicator />
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
