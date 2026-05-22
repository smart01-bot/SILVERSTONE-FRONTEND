// src/context/LoaderContext.jsx
// Global overlay loader — blurs the screen behind it and shows the spinning S.
//
// Usage in any screen:
//   const { showLoader, hideLoader } = useLoader();
//   showLoader();   // before async work
//   hideLoader();   // in finally {}

import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { WebView } from 'react-native-webview';
import { useTheme } from './ThemeContext';
import { SPINNER_HTML } from '../components/spinnerHtml';

const LoaderContext = createContext({ showLoader: () => {}, hideLoader: () => {} });
export const useLoader = () => useContext(LoaderContext);

export function LoaderProvider({ children }) {
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const webRef   = useRef(null);

  const onLoad = () => webRef.current?.postMessage(isDark ? 'dark' : 'light');

  // Re-send theme if user switches dark/light while overlay is mounted
  useEffect(() => {
    webRef.current?.postMessage(isDark ? 'dark' : 'light');
  }, [isDark]);

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
        </Animated.View>
      )}
    </LoaderContext.Provider>
  );
}

const s = StyleSheet.create({
  overlay: { zIndex: 9999, elevation: 9999 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  webview: { width: 220, height: 220, backgroundColor: 'transparent' },
});