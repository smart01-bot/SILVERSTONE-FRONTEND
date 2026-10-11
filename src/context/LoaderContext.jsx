import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from './ThemeContext';
import { LoadingIndicator } from '../components/Loader';
import { agentColors } from '../components/agent/agentTheme';

const LoaderContext = createContext({ showLoader: () => {}, hideLoader: () => {} });
export const useLoader = () => useContext(LoaderContext);

export function LoaderProvider({ children }) {
  const { isDark } = useTheme();
  const colors = agentColors(isDark);
  const [state, setState] = useState({ visible: false, label: undefined });
  const showLoader = useCallback(label => setState({ visible: true, label: typeof label === 'string' ? label : undefined }), []);
  const hideLoader = useCallback(() => setState({ visible: false, label: undefined }), []);
  return <LoaderContext.Provider value={{ showLoader, hideLoader }}>
    <View style={s.root} accessibilityElementsHidden={state.visible} importantForAccessibility={state.visible ? 'no-hide-descendants' : 'auto'}>{children}</View>
    {state.visible && <View accessibilityViewIsModal style={[StyleSheet.absoluteFillObject, s.overlay, { backgroundColor: colors.scrim }]}>
      <View style={[s.panel, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
        <LoadingIndicator label={state.label} />
      </View>
    </View>}
  </LoaderContext.Provider>;
}
const s = StyleSheet.create({
  root: { flex: 1 }, overlay: { zIndex: 9999, elevation: 9999, alignItems: 'center', justifyContent: 'center', padding: 32 },
  panel: { width: '100%', maxWidth: 320, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 12 },
});
