import React, { createContext, forwardRef, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo, ActivityIndicator, Animated, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { fonts } from '../../constants/theme';
import { agentColors } from './agentTheme';

const AgentUIContext = createContext(null);

export function AgentUIProvider({ children }) {
  const { isDark, lang } = useTheme();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [reducedTransparency, setReducedTransparency] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(118);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => active && setReducedMotion(value));
    AccessibilityInfo.isReduceTransparencyEnabled?.().then(value => active && setReducedTransparency(value));
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    const transparency = Platform.OS === 'ios'
      ? AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReducedTransparency) : null;
    return () => { active = false; motion.remove(); transparency?.remove(); };
  }, []);
  const value = useMemo(() => ({
    colors: agentColors(isDark), isDark, lang,
    copy: (en, sw) => lang === 'sw' && sw ? sw : en,
    reducedMotion, reducedTransparency, headerHeight, setHeaderHeight,
  }), [isDark, lang, reducedMotion, reducedTransparency, headerHeight]);
  return <AgentUIContext.Provider value={value}>{children}</AgentUIContext.Provider>;
}

export function useAgentUI() {
  const value = useContext(AgentUIContext);
  if (!value) throw new Error('Agent UI must be rendered inside AgentUIProvider.');
  return value;
}

export const AgentScroll = forwardRef(function AgentScroll({ children, style, contentContainerStyle, ...props }, ref) {
  const { colors } = useAgentUI();
  return <ScrollView ref={ref} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
    keyboardDismissMode="on-drag" style={[styles.flex, { backgroundColor: colors.bg }, style]}
    contentContainerStyle={[styles.scroll, contentContainerStyle]} {...props}>{children}</ScrollView>;
});

export function AgentButton({ label, onPress, disabled = false, busy = false, icon = 'arrow-forward', variant = 'primary', style, ...props }) {
  const { colors, reducedMotion } = useAgentUI();
  const scale = useRef(new Animated.Value(1)).current;
  const blocked = disabled || busy;
  const primary = variant === 'primary';
  const ink = primary ? colors.actionText : colors.text;
  const animate = value => {
    if (reducedMotion || blocked) return;
    Animated.timing(scale, { toValue: value, duration: 100, useNativeDriver: true }).start();
  };
  return <Animated.View style={{ transform: [{ scale }] }}>
    <Pressable accessibilityRole="button" accessibilityLabel={label}
      accessibilityState={{ disabled: blocked, busy }} disabled={blocked} onPress={onPress}
      onPressIn={() => animate(0.985)} onPressOut={() => animate(1)}
      style={[styles.button, { backgroundColor: primary ? colors.action : 'transparent', opacity: blocked ? 0.58 : 1 }, style]} {...props}>
      <Text style={[styles.buttonText, { color: ink }]}>{label}</Text>
      {busy ? <ActivityIndicator color={ink} size="small" /> : icon ? <Ionicons name={icon} size={20} color={ink} /> : null}
    </Pressable>
  </Animated.View>;
}

export function AgentRow({ label, value, icon, onPress, disabled = false, children, style, ...props }) {
  const { colors } = useAgentUI();
  return <Pressable onPress={onPress} disabled={disabled || !onPress}
    accessibilityRole={onPress ? 'button' : undefined}
    accessibilityState={onPress ? { disabled } : undefined}
    style={({ pressed }) => [styles.row, { borderBottomColor: colors.border, opacity: pressed ? 0.65 : 1 }, style]} {...props}>
    {icon ? <Ionicons name={icon} size={21} color={colors.text} /> : null}
    <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
    {value ? <Text style={[styles.rowValue, { color: colors.secondary }]}>{value}</Text> : null}
    {children}
    {onPress ? <Ionicons name="chevron-forward" size={17} color={colors.secondary} /> : null}
  </Pressable>;
}

export function AgentNotice({ children, error = false, style }) {
  const { colors } = useAgentUI();
  const parts = React.Children.toArray(children);
  const textOnly = parts.every(child => typeof child === 'string' || typeof child === 'number');
  const textStyle = [styles.noticeText, { color: error ? colors.danger : colors.secondary }];
  return <View accessibilityLiveRegion="polite" style={[styles.notice, style]}>
    <Ionicons name={error ? 'alert-circle-outline' : 'information-circle-outline'} size={18} color={error ? colors.danger : colors.secondary} />
    {textOnly ? <Text accessibilityRole={error ? 'alert' : undefined} style={textStyle}>{parts.join('')}</Text>
      : <View style={styles.flex}>{parts.map((child, index) => typeof child === 'string' || typeof child === 'number'
        ? <Text key={index} style={textStyle}>{child}</Text> : child)}</View>}
  </View>;
}

export function AgentSheet({ visible, onClose, title, children }) {
  const { colors, copy, reducedMotion } = useAgentUI();
  const insets = useSafeAreaInsets();
  return <Modal transparent visible={visible} animationType={reducedMotion ? 'none' : 'slide'}
    onRequestClose={onClose} statusBarTranslucent>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.modal, { backgroundColor: colors.scrim }]}>
      <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={onClose} />
      <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: colors.bg, paddingBottom: Math.max(insets.bottom, 16), marginTop: insets.top + 32 }]}>
        <View style={styles.sheetHeader}>
          <Text accessibilityRole="header" style={[styles.sheetTitle, { color: colors.text }]}>{title}</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={copy('Close', 'Funga')}
            style={styles.close}><Ionicons name="close-outline" size={25} color={colors.text} /></Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, flexGrow: 1 },
  button: { minHeight: 54, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  buttonText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 23 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLabel: { flex: 1, fontFamily: fonts.bodyMed, fontSize: 15, lineHeight: 22 },
  rowValue: { flexShrink: 1, maxWidth: '42%', fontFamily: fonts.body, fontSize: 14, lineHeight: 21, textAlign: 'right' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 12 },
  noticeText: { flex: 1, fontFamily: fonts.body, fontSize: 13, lineHeight: 20 },
  modal: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '88%', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 12 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sheetTitle: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 21, lineHeight: 28 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sheetContent: { paddingBottom: 20 },
});
