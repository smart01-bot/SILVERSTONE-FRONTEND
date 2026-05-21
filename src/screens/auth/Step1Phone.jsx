/**
 * Step1Phone.jsx
 * Sub-agent registration · Step 1 of 6 — Phone number
 *
 * Navigation: receives `navigation` prop from AuthNavigator
 * On success:  navigation.navigate('Step2OTP', { phone })
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';
import PressableScale from '../../components/PressableScale';
import { useHaptics } from '../../hooks/useHaptics';

const TOTAL_STEPS = 6;
const STEP = 1;

// ─── Phone formatter ──────────────────────────────────────────────────────────
function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function rawDigits(formatted) {
  return formatted.replace(/\D/g, '');
}

export default function Step1Phone({ navigation }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const [phone, setPhone] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Animated border on focus
  const borderAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.border, theme.primary],
  });

  const isValid = rawDigits(phone).length === 9;

  function handlePhoneChange(text) {
    const formatted = formatPhone(text);
    setPhone(formatted);
  }

  function handleNext() {
    if (!isValid) return;
    haptics.success();
    navigation.navigate('Step2OTP', { phone: `+255${rawDigits(phone)}` });
  }

  const s = makeStyles(theme, insets);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Gradient header ── */}
      <LinearGradient
        colors={[theme.gradPrimA, theme.gradPrimB]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.header}
      >
        {/* Back + progress row */}
        <View style={s.navRow}>
          <TouchableOpacity
            onPress={() => { haptics.light(); navigation.goBack(); }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Progress bar */}
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${(STEP / TOTAL_STEPS) * 100}%` }]} />
          </View>

          {/* Counter */}
          <Text style={s.counter}>{STEP}/{TOTAL_STEPS}</Text>
        </View>

        {/* Eyebrow */}
        <Text style={s.eyebrow}>SIGN UP · SUB-AGENT</Text>

        {/* Title */}
        <Text style={s.title}>What's your phone{'\n'}number?</Text>

        {/* Subtitle */}
        <Text style={s.subtitle}>
          We'll text a 6-digit code to verify it's really yours.
        </Text>
      </LinearGradient>

      {/* ── Body ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={s.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Field label */}
          <Text style={s.fieldLabel}>MOBILE NUMBER</Text>

          {/* Phone input row */}
          <Animated.View style={[s.inputRow, { borderColor }]}>
            {/* +255 prefix */}
            <View style={s.prefix}>
              <Text style={s.prefixText}>+255</Text>
            </View>
            <View style={s.divider} />
            <TextInput
              style={s.phoneInput}
              value={phone}
              onChangeText={handlePhoneChange}
              onFocus={() => { setIsFocused(true); haptics.light(); }}
              onBlur={() => setIsFocused(false)}
              placeholder="754 218 904"
              placeholderTextColor={theme.muted}
              keyboardType="number-pad"
              maxLength={11} // 9 digits + 2 spaces
              returnKeyType="done"
              onSubmitEditing={handleNext}
            />
            {/* Valid tick */}
            {isValid && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#22C55E"
                style={{ marginRight: spacing.md }}
              />
            )}
          </Animated.View>

          {/* Trust callout */}
          <View style={s.callout}>
            <Ionicons name="shield-checkmark" size={15} color={theme.primary} style={{ marginTop: 1 }} />
            <Text style={s.calloutText}>
              Use the number registered to your national ID. This is how main-agents and admins reach you.
            </Text>
          </View>
        </ScrollView>

        {/* ── CTA ── */}
        <View style={[s.ctaWrapper, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <PressableScale scaleDown={0.97} onPress={handleNext} disabled={!isValid}>
            <LinearGradient
              colors={isValid ? [theme.gradPrimA, theme.gradPrimB] : ['#555', '#444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.ctaButton}
            >
              <Text style={s.ctaText}>Send code</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: spacing.sm }} />
            </LinearGradient>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
function makeStyles(theme, insets) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    // Header
    header: {
      paddingTop: insets.top + spacing.md,
      paddingBottom: spacing.xl,
      paddingHorizontal: spacing.lg,
      borderBottomLeftRadius: radius.xxl,
      borderBottomRightRadius: radius.xxl,
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    progressTrack: {
      flex: 1,
      height: 3,
      backgroundColor: 'rgba(255,255,255,0.25)',
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#fff',
      borderRadius: radius.full,
    },
    counter: {
      fontFamily: fonts.bodySemi,
      fontSize: 12,
      color: 'rgba(255,255,255,0.85)',
      minWidth: 28,
      textAlign: 'right',
    },
    eyebrow: {
      fontFamily: fonts.bodySemi,
      fontSize: 11,
      color: 'rgba(255,255,255,0.75)',
      letterSpacing: 1.4,
      marginBottom: spacing.sm,
    },
    title: {
      fontFamily: fonts.display,
      fontSize: 28,
      color: '#fff',
      lineHeight: 34,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: 'rgba(255,255,255,0.78)',
      lineHeight: 20,
    },

    // Body
    body: {
      padding: spacing.lg,
      paddingTop: spacing.xl,
    },
    fieldLabel: {
      fontFamily: fonts.bodySemi,
      fontSize: 11,
      color: theme.textDim,
      letterSpacing: 1.2,
      marginBottom: spacing.sm,
    },

    // Phone input
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderRadius: radius.md,
      backgroundColor: theme.surfaceAlt,
      height: 54,
      overflow: 'hidden',
    },
    prefix: {
      paddingHorizontal: spacing.md,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    prefixText: {
      fontFamily: fonts.bodyBold,
      fontSize: 15,
      color: theme.text,
    },
    divider: {
      width: 1,
      height: 28,
      backgroundColor: theme.border,
    },
    phoneInput: {
      flex: 1,
      fontFamily: fonts.bodyBold,
      fontSize: 17,
      color: theme.text,
      paddingHorizontal: spacing.md,
      height: '100%',
    },

    // Callout
    callout: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
      backgroundColor: theme.primaryLight,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'flex-start',
    },
    calloutText: {
      flex: 1,
      fontFamily: fonts.body,
      fontSize: 12,
      color: theme.textDim,
      lineHeight: 18,
    },

    // CTA
    ctaWrapper: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      backgroundColor: theme.bg,
    },
    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 54,
      borderRadius: radius.lg,
    },
    ctaText: {
      fontFamily: fonts.bodyBold,
      fontSize: 16,
      color: '#fff',
    },
  });
}
