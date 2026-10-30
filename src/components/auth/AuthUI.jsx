import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { agentColors } from '../agent/agentTheme';
import { fonts } from '../../constants/theme';
import SwiftWakalaMark from '../SwiftWakalaMark';
import { ButtonDots } from '../Loader';
import PressFeedback from '../PressFeedback';

export function useAuthStyle() {
  const { isDark, lang } = useTheme();
  return { colors: agentColors(isDark), isDark, copy: (en, sw) => lang === 'sw' ? (sw || en) : en };
}

export function AuthFrame({ children, onBack, backDisabled = false, footer }) {
  const { colors, isDark, copy } = useAuthStyle();
  const [headerHeight, setHeaderHeight] = useState(88);
  return <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]}>
    <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
    <KeyboardAvoidingView style={[s.root, { overflow: 'hidden' }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingTop: headerHeight }]}>
        <View style={s.content}>{children}</View>
        {footer ? <Text style={[s.footer, { color: colors.secondary }]}>{footer}</Text> : null}
      </ScrollView>
      <View onLayout={event => setHeaderHeight(event.nativeEvent.layout.height)} style={[s.fixedHeader, { backgroundColor: colors.bg }]}>
        <View style={s.header}>
          <View accessible accessibilityLabel="Swift Wakala by Silverstone" style={s.brand}>
            <SwiftWakalaMark color={colors.text} size={34} />
            <View style={s.brandCopy}>
              <Text style={[s.brandText, { color: colors.text }]}>SWIFT WAKALA</Text>
              <Text style={[s.brandSub, { color: colors.secondary }]}>BY SILVERSTONE</Text>
            </View>
          </View>
          {onBack && <Pressable accessibilityRole="button" accessibilityLabel={copy('Back', 'Rudi')} disabled={backDisabled}
            accessibilityState={{ disabled: backDisabled }} onPress={onBack}
            style={({ pressed }) => [s.back, { borderColor: colors.glassBorder, backgroundColor: colors.glass, opacity: pressed || backDisabled ? 0.5 : 1 }]}>
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </Pressable>}
        </View>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export function AuthContextPill({ icon = 'shield-checkmark-outline', children }) {
  const { colors } = useAuthStyle();
  if (!children) return null;
  return <View style={[s.contextPill, { borderColor: colors.glassBorder, backgroundColor: colors.glass }]}>
    <Ionicons name={icon} size={14} color={colors.text} />
    <Text style={[s.contextPillText, { color: colors.secondary }]}>{children}</Text>
  </View>;
}

export function AuthIdentity({ name, subtitle }) {
  const { colors } = useAuthStyle();
  const initial = String(name || '?').trim().charAt(0).toUpperCase() || '?';
  return <View style={[s.identity, { borderColor: colors.glassBorder, backgroundColor: colors.glass }]}>
    <View style={[s.avatar, { backgroundColor: colors.text }]}>
      <Text style={[s.avatarText, { color: colors.bg }]}>{initial}</Text>
    </View>
    <View style={s.identityCopy}>
      <Text numberOfLines={1} style={[s.identityName, { color: colors.text }]}>{name}</Text>
      {subtitle ? <Text numberOfLines={2} style={[s.identitySub, { color: colors.secondary }]}>{subtitle}</Text> : null}
    </View>
  </View>;
}

export function AuthProgress({ step, total, label }) {
  const { colors, copy } = useAuthStyle();
  const safeTotal = Math.max(1, Number(total) || 1);
  const safeStep = Math.min(safeTotal, Math.max(0, Number(step) || 0));
  return <View accessible accessibilityLabel={copy(`Step ${safeStep} of ${safeTotal}${label ? `, ${label}` : ''}`, `Hatua ${safeStep} kati ya ${safeTotal}${label ? `, ${label}` : ''}`)}
    style={s.progressRow}>
    <Text style={[s.progressText, { color: colors.secondary }]}>{safeStep} / {safeTotal}</Text>
    <View style={[s.progressTrack, { backgroundColor: colors.border }]}>
      <View style={[s.progressFill, { backgroundColor: colors.text, width: `${(safeStep / safeTotal) * 100}%` }]} />
    </View>
    {label ? <Text style={[s.progressLabel, { color: colors.secondary }]}>{label}</Text> : null}
  </View>;
}

export function AuthStatusCard({ icon = 'checkmark', title, children }) {
  const { colors } = useAuthStyle();
  return <View style={[s.statusCard, { borderColor: colors.glassBorder, backgroundColor: colors.glass }]}>
    <View style={[s.statusIcon, { backgroundColor: colors.text }]}>
      <Ionicons name={icon} size={20} color={colors.bg} />
    </View>
    {title ? <Text style={[s.statusTitle, { color: colors.text }]}>{title}</Text> : null}
    {children ? <Text style={[s.statusBody, { color: colors.secondary }]}>{children}</Text> : null}
  </View>;
}

export function AuthHeading({ eyebrow, title, description }) {
  const { colors } = useAuthStyle();
  return <View style={s.heading}>
    {eyebrow ? <Text style={[s.eyebrow, { color: colors.secondary }]}>{eyebrow}</Text> : null}
    <Text accessibilityRole="header" style={[s.title, { color: colors.text }]}>{title}</Text>
    {description ? <Text style={[s.description, { color: colors.secondary }]}>{description}</Text> : null}
  </View>;
}

export function AuthField({ label, password = false, editable = true, ...props }) {
  const { colors, copy } = useAuthStyle();
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return <View style={s.field}>
    <Text style={[s.label, { color: colors.secondary }]}>{label}</Text>
    <View style={[s.fieldRow, {
      borderColor: focused ? colors.text : colors.border,
      backgroundColor: focused ? colors.surface : colors.glass,
    }]}>
      <TextInput underlineColorAndroid="transparent" accessibilityLabel={label} placeholderTextColor={colors.muted} selectionColor={colors.text}
        {...props} editable={editable} secureTextEntry={password && !visible}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={[s.input, { color: colors.text, opacity: editable ? 1 : 0.6 }]} />
      {password && <Pressable accessibilityRole="button" accessibilityLabel={visible ? copy('Hide password', 'Ficha nenosiri') : copy('Show password', 'Onyesha nenosiri')}
        disabled={!editable} onPress={() => setVisible(v => !v)} style={s.eye}>
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.secondary} />
      </Pressable>}
    </View>
  </View>;
}

export function AuthButton({ label, onPress, busy = false, disabled = false }) {
  const { colors } = useAuthStyle();
  const blocked = busy || disabled;
  return <PressFeedback accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ busy, disabled: blocked }}
    disabled={blocked} onPress={onPress}
    style={({ pressed }) => [s.button, { backgroundColor: colors.action, opacity: pressed || (disabled && !busy) ? 0.65 : 1 }]}>
    {busy ? <ButtonDots color={colors.actionText} /> : null}
    <Text style={[s.buttonText, { color: colors.actionText }]}>{label}</Text>
    {!busy ? <Ionicons name="arrow-forward" size={21} color={colors.actionText} /> : null}
  </PressFeedback>;
}

export function AuthLink({ children, onPress, disabled = false }) {
  const { colors } = useAuthStyle();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.link, { opacity: pressed || disabled ? 0.5 : 1 }]}>
    <Text style={[s.linkText, { color: colors.text }]}>{children}</Text>
  </Pressable>;
}

export function AuthNotice({ children, error = false }) {
  const { colors } = useAuthStyle();
  if (!children) return null;
  return <Text accessibilityLiveRegion="polite" accessibilityRole={error ? 'alert' : undefined}
    style={[s.notice, { color: error ? colors.danger : colors.secondary }]}>{children}</Text>;
}

export function PinDots({ length }) {
  const { colors, copy } = useAuthStyle();
  return <View accessible accessibilityLabel={copy(`${length} of 4 PIN digits entered`, `Namba ${length} kati ya 4 zimeingizwa`)} style={s.pinDots}>
    {[0, 1, 2, 3].map(i => <View key={i} style={[s.pinDot, {
      borderColor: i < length ? colors.text : colors.strongBorder,
      backgroundColor: i < length ? colors.text : 'transparent',
      transform: [{ scale: i < length ? 1.08 : 1 }],
    }]} />)}
  </View>;
}

export function PinKeypad({ onDigit, onDelete, disabled = false, biometric }) {
  const { colors, copy } = useAuthStyle();
  return <View style={s.keypad}>
    {['123', '456', '789', 'x0d'].map((row, index) => <View style={s.keyRow} key={index}>
      {row.split('').map(key => key === 'x' && !biometric ? <View key={key} style={s.key} /> :
        <Pressable key={key} accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
          accessibilityLabel={key === 'd' ? copy('Delete last digit', 'Futa namba ya mwisho') : key === 'x' ? copy('Unlock with biometrics', 'Fungua kwa biometriki') : key}
          onPress={() => key === 'd' ? onDelete() : key === 'x' ? biometric() : onDigit(key)}
          style={({ pressed }) => [s.key, {
            backgroundColor: pressed ? colors.selected : colors.glass,
            borderColor: pressed ? colors.strongBorder : colors.glassBorder,
            opacity: disabled ? 0.35 : 1,
          }]}>
          {key === 'd' || key === 'x' ? <Ionicons name={key === 'd' ? 'backspace-outline' : 'finger-print-outline'} size={25} color={colors.text} /> :
            <Text style={[s.digit, { color: colors.text }]}>{key}</Text>}
        </Pressable>)}
    </View>)}
  </View>;
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 20, width: '100%', maxWidth: 488, alignSelf: 'center' },
  fixedHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 },
  header: { width: '100%', maxWidth: 488, alignSelf: 'center', paddingHorizontal: 24, minHeight: 88, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  brandCopy: { flexShrink: 1 },
  brandText: { fontFamily: fonts.bodyXBold, fontSize: 13, letterSpacing: 0.8, flexShrink: 1 },
  brandSub: { fontFamily: fonts.bodyMed, fontSize: 10, lineHeight: 14, letterSpacing: 1.1, marginTop: 3 },
  back: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingTop: 22 },
  contextPill: { alignSelf: 'flex-start', minHeight: 34, borderRadius: 17, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 7, marginBottom: 18 },
  contextPillText: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 18 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderRadius: 20, padding: 14, marginBottom: 22 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 18 },
  identityCopy: { flex: 1, minWidth: 0 },
  identityName: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 22 },
  identitySub: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 22 },
  progressText: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 17 },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressLabel: { fontFamily: fonts.bodyMed, fontSize: 12, lineHeight: 17 },
  statusCard: { borderWidth: 1, borderRadius: 22, padding: 18, marginVertical: 4 },
  statusIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  statusTitle: { fontFamily: fonts.bodySemi, fontSize: 17, lineHeight: 23 },
  statusBody: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, marginTop: 7 },
  heading: { gap: 11, marginBottom: 30 },
  eyebrow: { fontFamily: fonts.bodyMed, fontSize: 14, lineHeight: 21 },
  title: { fontFamily: fonts.display, fontSize: 41, lineHeight: 47, letterSpacing: -1.35 },
  description: { fontFamily: fonts.body, fontSize: 16, lineHeight: 25 },
  field: { marginBottom: 22 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 19 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, minHeight: 60, borderRadius: 20, paddingHorizontal: 16, marginTop: 7 },
  input: { flex: 1, minWidth: 0, fontFamily: fonts.body, fontSize: 17, paddingVertical: 15 },
  eye: { width: 46, minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  button: { minHeight: 58, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 14 },
  buttonText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 17, lineHeight: 25 },
  link: { minHeight: 46, paddingVertical: 13, justifyContent: 'center', alignItems: 'center' },
  linkText: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  notice: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, marginVertical: 7 },
  footer: { fontFamily: fonts.body, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 30 },
  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginVertical: 18 },
  pinDot: { width: 13, height: 13, borderRadius: 7, borderWidth: 1.6 },
  keypad: { marginTop: 'auto', paddingTop: 22, width: '100%', maxWidth: 326, alignSelf: 'center' },
  keyRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  key: { flex: 1, minHeight: 62, borderRadius: 22, borderWidth: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 10 },
  digit: { fontFamily: fonts.bodyMed, fontSize: 28, lineHeight: 38 },
});
