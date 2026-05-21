// src/context/LoaderContext.jsx
// Global overlay loader — blurs whatever screen is behind it and shows
// the spinning Silverstone S in the foreground.
//
// Usage in any screen:
//   const { showLoader, hideLoader } = useLoader();
//   showLoader();   // before async work
//   hideLoader();   // in finally block

import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
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

  const showLoader = useCallback(() => {
    setVisible(true);
    Animated.timing(fadeAnim, {
      toValue:         1,
      duration:        180,
      useNativeDriver: true,
    }).start();
  }, []);

  const hideLoader = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue:         0,
      duration:        220,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }, []);

  const onWebViewLoad = () => {
    webRef.current?.postMessage(isDark ? 'dark' : 'light');
  };

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader }}>
      {children}

      {visible && (
        <Animated.View
          style={[StyleSheet.absoluteFillObject, s.overlay, { opacity: fadeAnim }]}
          pointerEvents="box-none"
        >
          {/* Frosted glass blur over whatever is behind */}
          <BlurView
            intensity={60}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Spinning S dead centre */}
          <View style={s.spinnerWrap}>
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
              onLoad={onWebViewLoad}
            />
          </View>
        </Animated.View>
      )}
    </LoaderContext.Provider>
  );
}

const s = StyleSheet.create({
  overlay: {
    zIndex:   9999,
    elevation: 9999,
  },
  spinnerWrap: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
  },
  webview: {
    width:           220,
    height:          220,
    backgroundColor: 'transparent',
  },
});