import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { agentColors } from '../agent/agentTheme';
import { fonts } from '../../constants/theme';
import SilverstoneMark from '../SilverstoneMark';
import { ButtonDots } from '../Loader';

export function useAuthStyle() {
  const { isDark, lang } = useTheme();
  return { colors: agentColors(isDark), isDark, copy: (en, sw) => lang === 'sw' ? (sw || en) : en };
}

export function AuthFrame({ children, onBack, backDisabled = false, footer }) {
  const { colors, isDark, copy } = useAuthStyle();
  return <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]}>
    <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <View accessible accessibilityLabel="Silverstone" style={s.brand}>
            <SilverstoneMark color={colors.text} />
            <Text style={[s.brandText, { color: colors.text }]}>SILVERSTONE</Text>
          </View>
          {onBack && <Pressable accessibilityRole="button" accessibilityLabel={copy('Back', 'Rudi')} disabled={backDisabled}
            accessibilityState={{ disabled: backDisabled }} onPress={onBack}
            style={({ pressed }) => [s.back, { borderColor: colors.glassBorder, backgroundColor: colors.glass, opacity: pressed || backDisabled ? 0.5 : 1 }]}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>}
        </View>
        <View style={s.content}>{children}</View>
        {footer ? <Text style={[s.footer, { color: colors.secondary }]}>{footer}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
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
    <View style={[s.fieldRow, { borderBottomColor: focused ? colors.text : colors.strongBorder }]}>
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
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ busy, disabled: blocked }}
    disabled={blocked} onPress={onPress} style={({ pressed }) => [s.button, { backgroundColor: colors.action, opacity: pressed || blocked ? 0.65 : 1 }]}>
    <Text style={[s.buttonText, { color: colors.actionText }]}>{label}</Text>
    {busy ? <ButtonDots color={colors.actionText} /> : <Ionicons name="arrow-forward" size={22} color={colors.actionText} />}
  </Pressable>;
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
    {[0, 1, 2, 3].map(i => <View key={i} style={[s.pinCell, { borderColor: colors.strongBorder, backgroundColor: i < length ? colors.surface : 'transparent' }]}>
      {i < length && <View style={[s.dot, { backgroundColor: colors.text }]} />}
    </View>)}
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
          style={({ pressed }) => [s.key, { backgroundColor: pressed ? colors.selected : 'transparent', opacity: disabled ? 0.35 : 1 }]}>
          {key === 'd' || key === 'x' ? <Ionicons name={key === 'd' ? 'backspace-outline' : 'finger-print-outline'} size={26} color={colors.text} /> :
            <Text style={[s.digit, { color: colors.text }]}>{key}</Text>}
        </Pressable>)}
    </View>)}
  </View>;
}

const s = StyleSheet.create({
  root: { flex: 1 }, scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 20, width: '100%', maxWidth: 488, alignSelf: 'center' },
  header: { minHeight: 88, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9, flexShrink: 1 },
  brandText: { fontFamily: fonts.bodySemi, fontSize: 13, letterSpacing: 0.2, flexShrink: 1 },
  back: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingTop: 28 }, heading: { gap: 12, marginBottom: 32 },
  eyebrow: { fontFamily: fonts.bodyMed, fontSize: 14, lineHeight: 21 },
  title: { fontFamily: fonts.display, fontSize: 34, lineHeight: 42, letterSpacing: -1 },
  description: { fontFamily: fonts.body, fontSize: 16, lineHeight: 25 },
  field: { marginBottom: 24 }, label: { fontFamily: fonts.bodyMed, fontSize: 14, lineHeight: 21 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, minHeight: 58 },
  input: { flex: 1, minWidth: 0, fontFamily: fonts.body, fontSize: 17, paddingVertical: 16 }, eye: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  button: { minHeight: 58, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16 },
  buttonText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 17, lineHeight: 25 },
  link: { minHeight: 48, paddingVertical: 14, justifyContent: 'center', alignItems: 'center' },
  linkText: { fontFamily: fonts.bodyMed, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  notice: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, marginVertical: 8 },
  footer: { fontFamily: fonts.body, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 32 },
  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginVertical: 12 },
  pinCell: { width: 48, height: 54, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  keypad: { marginTop: 'auto', paddingTop: 24, width: '100%', maxWidth: 340, alignSelf: 'center' },
  keyRow: { flexDirection: 'row', gap: 12 }, key: { flex: 1, minHeight: 62, borderRadius: 18, justifyContent: 'center', alignItems: 'center', paddingVertical: 10 },
  digit: { fontFamily: fonts.bodyMed, fontSize: 28, lineHeight: 38 },
});
