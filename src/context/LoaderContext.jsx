import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AccessibilityInfo, BackHandler, Modal, Platform, View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from './ThemeContext';
import { LoadingIndicator } from '../components/Loader';
import { agentColors } from '../components/agent/agentTheme';

const LoaderContext = createContext({ showLoader: () => {}, hideLoader: () => {} });
export const useLoader = () => useContext(LoaderContext);

export function LoaderProvider({ children }) {
  const [reducedTransparency, setReducedTransparency] = useState(true);
  const [state, setState] = useState({ visible: false, label: undefined });
  useEffect(() => {
    let active = true, changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', value => { changed = true; if (active) setReducedTransparency(value); });
    Promise.resolve(AccessibilityInfo.isReduceTransparencyEnabled?.() ?? false)
      .then(value => { if (active && !changed) setReducedTransparency(value); }).catch(() => {});
    return () => { active = false; subscription.remove(); };
  }, []);
  const showLoader = useCallback(label => setState({ visible: true, label: typeof label === 'string' ? label : undefined }), []);
  const hideLoader = useCallback(() => setState({ visible: false, label: undefined }), []);
  return <LoaderContext.Provider value={{ showLoader, hideLoader, blocking: state.visible, label: state.label, reducedTransparency }}>
    <LoaderBoundary>{children}</LoaderBoundary>
  </LoaderContext.Provider>;
}

// Render inside each native modal as well as the app root. This avoids trying to
// present a second native modal above an existing iOS sheet during submission.
export function LoaderBoundary({ children }) {
  const { blocking, label, reducedTransparency = true } = useLoader();
  const { isDark } = useTheme();
  const colors = agentColors(isDark);
  useEffect(() => {
    if (!blocking) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [blocking]);
  const veil = reducedTransparency ? colors.bg : isDark ? 'rgba(0,0,0,0.66)' : 'rgba(238,240,242,0.76)';
  return <View style={s.root}>
    <View style={s.root} pointerEvents={blocking ? 'none' : 'auto'} accessibilityElementsHidden={blocking} importantForAccessibility={blocking ? 'no-hide-descendants' : 'auto'}>{children}</View>
    {blocking && <View testID="global-loader-overlay" accessibilityViewIsModal style={[StyleSheet.absoluteFillObject, s.overlay]}>
      {!reducedTransparency && <BlurView pointerEvents="none" intensity={24} tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined} style={StyleSheet.absoluteFillObject} />}
      <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: veil }]} />
      <LoadingIndicator label={label} labelColor={colors.text} style={s.indicator} />
    </View>}
  </View>;
}

export function LoadingModal({ children, onRequestClose, ...props }) {
  const { blocking } = useLoader();
  return <Modal {...props} onRequestClose={blocking ? () => {} : onRequestClose}>
    <LoaderBoundary>{children}</LoaderBoundary>
  </Modal>;
}

const s = StyleSheet.create({
  root: { flex: 1 }, overlay: { zIndex: 9999, elevation: 9999, alignItems: 'center', justifyContent: 'center', padding: 24 },
  indicator: { transform: [{ translateY: -20 }] },
});
