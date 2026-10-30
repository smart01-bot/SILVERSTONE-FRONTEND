import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccessibilityInfo, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { fonts } from '../../constants/theme';
import SilverstoneMark from '../SilverstoneMark';
import { ButtonDots } from '../Loader';
import { useAuthStyle } from './AuthUI';

const Transparency = createContext(true);

// Android keeps an inexpensive tinted-glass fallback; no experimental blur or new native dependency.
export function Glass({ children, style, focused = false }) {
  const { colors, isDark } = useAuthStyle();
  const reduced = useContext(Transparency);
  return <View style={[styles.glass, { backgroundColor: reduced ? colors.surface : colors.glass,
    borderColor: focused ? colors.text : colors.glassBorder }, style]}>
    {!reduced && Platform.OS === 'ios' && <BlurView pointerEvents="none" intensity={18} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />}
    {!reduced && <View pointerEvents="none" style={[styles.rim, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)' }]} />}
    {children}
  </View>;
}

export function RegistrationFrame({ title, description, step, onBack, busy = false, children, footer }) {
  const { colors, isDark, copy } = useAuthStyle();
  const { lang, setLang } = useTheme();
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceTransparencyEnabled?.().then(value => { if (live) setReduced(value); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduced);
    return () => { live = false; sub?.remove(); };
  }, []);
  const [headerHeight, setHeaderHeight] = useState(74);
  return <Transparency.Provider value={reduced}><SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
    <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
    <KeyboardAvoidingView style={[styles.root, { overflow: 'hidden' }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.page, { paddingTop: headerHeight }]}>
        {step && <View accessible accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 6, now: step }} accessibilityLabel={copy(`Registration step ${step} of 6`, `Hatua ya usajili ${step} kati ya 6`)} style={styles.progress}>
          <View style={styles.segments}>{[1, 2, 3, 4, 5, 6].map(n => <View key={n} style={[styles.segment, { backgroundColor: n <= step ? colors.text : colors.border }]} />)}</View>
          <Text style={[styles.small, { color: colors.secondary }]}>{step}/6</Text>
        </View>}
        <View style={styles.heading}><Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{title}</Text>
          {description ? <Text style={[styles.body, { color: colors.secondary }]}>{description}</Text> : null}
        </View>
        <View style={styles.content}>{children}</View>
        {footer && <View style={styles.footer}>{footer}</View>}
      </ScrollView>
      <View onLayout={event => setHeaderHeight(event.nativeEvent.layout.height)} style={[styles.fixedHeader, { backgroundColor: colors.bg }]}>
        <View style={styles.header}>
          {onBack && <Pressable accessibilityRole="button" accessibilityLabel={copy('Back', 'Rudi')} accessibilityState={{ disabled: busy }} disabled={busy} onPress={onBack} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>}
          <View accessible accessibilityLabel="Silverstone" style={styles.brand}><SilverstoneMark size={23} color={colors.text} /><Text style={[styles.wordmark, { color: colors.text }]}>SILVERSTONE</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={copy('Switch to Swahili', 'Badili kwenda Kiingereza')} onPress={() => setLang(lang === 'sw' ? 'en' : 'sw')} style={styles.language}>
            <Text style={[styles.small, { color: colors.text }]}>{lang === 'sw' ? 'EN' : 'SW'}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView></Transparency.Provider>;
}

export function RegistrationText({ children, error = false, style }) {
  const { colors } = useAuthStyle();
  if (!children) return null;
  return <Text accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion={error ? 'polite' : undefined} style={[styles.body, { color: error ? colors.danger : colors.secondary }, style]}>{children}</Text>;
}

export function GlassField({ label, password, error, hint, prefix, editable = true, style, ...props }) {
  const { colors, copy } = useAuthStyle();
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return <View style={[styles.field, style]}>
    <Text style={[styles.label, { color: colors.secondary }]}>{label}</Text>
    <Glass focused={focused} style={[styles.inputRow, error && { borderColor: colors.danger }]}>
      {prefix && <Text style={[styles.prefix, { color: colors.text, borderRightColor: colors.border }]}>{prefix}</Text>}
      <TextInput {...props} accessibilityLabel={label} accessibilityHint={error || hint} underlineColorAndroid="transparent" placeholderTextColor={colors.muted}
        editable={editable} secureTextEntry={!!password && !visible} selectionColor={colors.text}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={[styles.input, { color: colors.text }]} />
      {password && <Pressable accessibilityRole="button" accessibilityLabel={visible ? copy('Hide password', 'Ficha nenosiri') : copy('Show password', 'Onyesha nenosiri')}
        disabled={!editable} onPress={() => setVisible(v => !v)} style={styles.iconButton}><Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={21} color={colors.secondary} /></Pressable>}
    </Glass>
    {(error || hint) && <RegistrationText error={!!error} style={styles.hint}>{error || hint}</RegistrationText>}
  </View>;
}

export function GlassButton({ label, onPress, busy = false, disabled = false }) {
  const { colors } = useAuthStyle();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ busy, disabled: busy || disabled }} aria-disabled={busy || disabled} aria-busy={busy} disabled={busy || disabled} onPress={onPress}
    style={({ pressed }) => ({ opacity: pressed || (disabled && !busy) ? 0.5 : 1 })}>
    <Glass style={styles.button}>{busy ? <ButtonDots color={colors.text} /> : null}<Text style={[styles.buttonText, { color: colors.text }]}>{label}</Text>
      {!busy ? <Ionicons name="arrow-forward" size={21} color={colors.text} /> : null}
    </Glass>
  </Pressable>;
}

export function TextAction({ label, onPress, disabled = false }) {
  const { colors } = useAuthStyle();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.textAction, { opacity: pressed || disabled ? 0.5 : 1 }]}>
    <Text style={[styles.actionText, { color: colors.text }]}>{label}</Text>
  </Pressable>;
}

export function PlainRow({ label, detail, onPress, disabled = false, icon = 'chevron-forward', selected }) {
  const { colors } = useAuthStyle();
  const body = <><View style={styles.rowText}><Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    {detail ? <RegistrationText style={styles.hint}>{detail}</RegistrationText> : null}</View>
    {onPress && <Ionicons name={selected ? 'checkmark-outline' : icon} size={21} color={colors.secondary} />}</>;
  return onPress ? <Pressable accessibilityRole="button" accessibilityState={{ disabled, ...(selected === undefined ? {} : { selected }) }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.row, { borderBottomColor: colors.border, opacity: pressed || disabled ? 0.5 : 1 }]}>{body}</Pressable>
    : <View style={[styles.row, { borderBottomColor: colors.border }]}>{body}</View>;
}

export function Section({ title, action, children }) {
  const { colors, copy } = useAuthStyle();
  return <View style={styles.section}><View style={styles.sectionHeader}><Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
    {action && <TextAction label={copy('Edit', 'Hariri')} onPress={action} />}</View>{children}</View>;
}

export function CheckRow({ label, checked, onPress, disabled = false }) {
  const { colors } = useAuthStyle();
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked, disabled }} aria-checked={checked} aria-disabled={disabled} disabled={disabled} onPress={onPress} style={styles.checkRow}>
    <Ionicons name={checked ? 'checkbox-outline' : 'square-outline'} size={25} color={colors.text} /><Text style={[styles.body, { color: colors.text, flex: 1 }]}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, page: { flexGrow: 1, width: '100%', maxWidth: 488, alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 20 },
  fixedHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 },
  header: { width: '100%', maxWidth: 488, alignSelf: 'center', paddingHorizontal: 24, minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }, wordmark: { fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 0.7, flexShrink: 1 },
  iconButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }, language: { minWidth: 48, minHeight: 48, justifyContent: 'center', alignItems: 'flex-end' },
  progress: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 28 }, segments: { flexDirection: 'row', flex: 1, gap: 5 }, segment: { height: 3, borderRadius: 2, flex: 1 },
  small: { fontFamily: fonts.bodyMed, fontSize: 13, lineHeight: 19 }, heading: { gap: 10, marginTop: 12, marginBottom: 24 },
  title: { fontFamily: fonts.display, fontSize: 33, lineHeight: 41, letterSpacing: -0.9 }, body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  content: { paddingBottom: 8 }, footer: { marginTop: 'auto', paddingTop: 24, gap: 8 },
  glass: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' }, rim: { position: 'absolute', left: 12, right: 12, top: 0, height: 1 },
  field: { marginBottom: 16 }, label: { fontFamily: fonts.bodyMed, fontSize: 15, lineHeight: 22 }, inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, minHeight: 54 },
  input: { flex: 1, minWidth: 0, fontFamily: fonts.body, fontSize: 17, paddingHorizontal: 14, paddingVertical: 15 }, prefix: { fontFamily: fonts.bodyMed, fontSize: 17, paddingHorizontal: 14, borderRightWidth: 1 },
  hint: { fontSize: 14, lineHeight: 21, marginTop: 5 }, button: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 15, gap: 12 },
  buttonText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 17, lineHeight: 25 }, textAction: { minHeight: 48, paddingVertical: 13, paddingHorizontal: 6, justifyContent: 'center' },
  actionText: { fontFamily: fonts.bodyMed, fontSize: 15, lineHeight: 23, textAlign: 'center', textDecorationLine: 'underline' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 58, paddingVertical: 14, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth }, rowText: { flex: 1, minWidth: 0 },
  section: { marginBottom: 24 }, sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 },
  sectionTitle: { fontFamily: fonts.bodySemi, fontSize: 17, lineHeight: 25, flex: 1 }, checkRow: { minHeight: 48, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
});
