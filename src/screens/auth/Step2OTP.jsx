/**
 * Step2OTP.jsx
 * Sub-agent registration · Step 2 of 6 — Verify OTP
 *
 * Navigation params: { phone } — full number string e.g. "+255754218904"
 * On success:        navigation.navigate('Step3Personal', { phone })
 *
 * Additions over v1:
 *   1. "Wrong number?" link in subtitle → goBack()
 *   2. Progress dots below OTP boxes mirroring fill state
 *   3. Digit preview strip above boxes (filled white · remaining dim dots)
 *   4. SMS preview card showing what to look for in inbox
 *   5. Security note above CTA: never share this code
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
  TextInput,
  Animated,
} from 'react-native';
// Note: Animated kept for shakeAnim on the otpRow — that stays native-only (translateX).
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';
import PressableScale from '../../components/PressableScale';
import { useHaptics } from '../../hooks/useHaptics';

const TOTAL_STEPS = 6;
const STEP = 2;
const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;

function maskPhone(phone) {
  if (!phone || phone.length < 6) return phone;
  return `${phone.slice(0, 5)} ••• ${phone.slice(-3)}`;
}

export default function Step2OTP({ navigation, route }) {
  const { phone } = route.params ?? {};
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [resendSeconds, setResendSeconds] = useState(RESEND_SECONDS);
  const [shakeAnim] = useState(new Animated.Value(0));

  const inputRefs = useRef([]);

  // ─── Countdown ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => {
      setResendSeconds((s) => {
        if (s <= 1) { clearInterval(timer); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const isValid = otp.every((d) => d !== '');

  // ─── Shake ──────────────────────────────────────────────────────────────────
  function shake() {
    haptics.error();
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  }

  // ─── Digit input ────────────────────────────────────────────────────────────
  function handleDigit(text, index) {
    const digit = text.replace(/\D/g, '').slice(-1);
    haptics.pin();
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    if (digit && index === OTP_LENGTH - 1 && next.every((d) => d !== '')) handleVerify(next);
  }

  // ─── Backspace ──────────────────────────────────────────────────────────────
  function handleKeyPress(e, index) {
    if (e.nativeEvent.key === 'Backspace') {
      haptics.light();
      const next = [...otp];
      if (next[index] !== '') {
        next[index] = '';
        setOtp(next);
      } else if (index > 0) {
        next[index - 1] = '';
        setOtp(next);
        inputRefs.current[index - 1]?.focus();
      }
    }
  }

  // ─── Paste ──────────────────────────────────────────────────────────────────
  async function handlePaste(index) {
    try {
      const text = await Clipboard.getStringAsync();
      const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
      if (digits.length > 0) {
        haptics.selection();
        const next = [...otp];
        digits.split('').forEach((d, i) => { if (i < OTP_LENGTH) next[i] = d; });
        setOtp(next);
        const focusIdx = Math.min(digits.length, OTP_LENGTH - 1);
        inputRefs.current[focusIdx]?.focus();
        if (digits.length === OTP_LENGTH) handleVerify(next);
      }
    } catch (_) {}
  }

  // ─── Verify ─────────────────────────────────────────────────────────────────
  function handleVerify(otpArr = otp) {
    if (!otpArr.every((d) => d !== '')) return;
    haptics.success();
    navigation.navigate('Step3Personal', { phone });
  }

  // ─── Resend ─────────────────────────────────────────────────────────────────
  function handleResend() {
    if (resendSeconds > 0) return;
    haptics.medium();
    setOtp(Array(OTP_LENGTH).fill(''));
    setResendSeconds(RESEND_SECONDS);
    inputRefs.current[0]?.focus();
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
        <View style={s.navRow}>
          <TouchableOpacity
            onPress={() => { haptics.light(); navigation.goBack(); }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${(STEP / TOTAL_STEPS) * 100}%` }]} />
          </View>
          <Text style={s.counter}>{STEP}/{TOTAL_STEPS}</Text>
        </View>

        <Text style={s.eyebrow}>SIGN UP · SUB-AGENT</Text>
        <Text style={s.title}>Enter the 6-digit{'\n'}code</Text>

        {/* 1. Subtitle + "Wrong number?" link */}
        <View style={s.subtitleRow}>
          <Text style={s.subtitle}>Sent to {maskPhone(phone)}. </Text>
          <TouchableOpacity
            onPress={() => { haptics.light(); navigation.goBack(); }}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text style={s.wrongNumber}>Wrong number?</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── Body ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* 4. SMS preview card */}
          <View style={s.smsCard}>
            <View style={s.smsHeader}>
              <View style={s.smsSenderDot} />
              <Text style={s.smsSender}>SILVRSTN</Text>
              <Text style={s.smsTime}>Just now</Text>
            </View>
            <Text style={s.smsBody}>
              Your Silverstone verification code is:{' '}
              <Text style={s.smsCode}>██████</Text>
              {'\n'}
              <Text style={s.smsExpiry}>Expires in 10 minutes. Do not share.</Text>
            </Text>
          </View>

          {/* 3. Digit preview strip */}
          <View style={s.previewStrip}>
            {Array(OTP_LENGTH).fill('').map((_, i) => (
              <View key={i} style={s.previewCell}>
                {otp[i] ? (
                  <Text style={s.previewDigit}>{otp[i]}</Text>
                ) : (
                  <View style={s.previewDot} />
                )}
              </View>
            ))}
          </View>

          {/* OTP boxes */}
          <Animated.View style={[s.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
            {otp.map((digit, i) => (
              <OtpBox
                key={i}
                value={digit}
                ref={(ref) => (inputRefs.current[i] = ref)}
                onChangeText={(text) => handleDigit(text, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                onFocus={() => haptics.light()}
                onLongPress={() => handlePaste(i)}
                theme={theme}
                filled={digit !== ''}
              />
            ))}
          </Animated.View>

          {/* 2. Progress dots */}
          <View style={s.dotsRow}>
            {otp.map((digit, i) => (
              <View
                key={i}
                style={[
                  s.dot,
                  digit !== '' && { backgroundColor: theme.primary, transform: [{ scale: 1.25 }] },
                ]}
              />
            ))}
          </View>

          {/* Resend row */}
          <View style={s.resendRow}>
            <TouchableOpacity onPress={handleResend} disabled={resendSeconds > 0}>
              <Text style={[s.resendText, resendSeconds > 0 && s.resendDisabled]}>
                {resendSeconds > 0
                  ? `Resend in 0:${String(resendSeconds).padStart(2, '0')}`
                  : 'Resend code'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => haptics.light()}>
              <Text style={s.callMeText}>Call me instead</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* 5. Security note + CTA */}
        <View style={[s.ctaWrapper, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={s.securityNote}>
            <Ionicons name="lock-closed" size={11} color={theme.textDim} />
            <Text style={s.securityText}>
              Never share this code with anyone, including Silverstone staff.
            </Text>
          </View>
          <PressableScale scaleDown={0.97} onPress={() => handleVerify()} disabled={!isValid}>
            <LinearGradient
              colors={isValid ? [theme.gradPrimA, theme.gradPrimB] : ['#555', '#444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.ctaButton}
            >
              <Text style={s.ctaText}>Verify</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: spacing.sm }} />
            </LinearGradient>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── OTP Box — no Animated API, plain useState for focus/fill state ───────────
const OtpBox = React.forwardRef(function OtpBox(
  { value, onChangeText, onKeyPress, onFocus, onLongPress, theme, filled },
  ref
) {
  const [isFocused, setIsFocused] = useState(false);
  const s = otpStyles(theme);

  const borderColor = isFocused ? theme.primary : filled ? theme.primary : theme.border;
  const borderWidth = isFocused || filled ? 2 : 1.5;

  return (
    <View style={[s.box, { borderColor, borderWidth }, filled && s.boxFilled]}>
      <TextInput
        ref={ref}
        style={s.digit}
        value={value}
        onChangeText={onChangeText}
        onKeyPress={onKeyPress}
        onFocus={() => { setIsFocused(true); onFocus?.(); }}
        onBlur={() => setIsFocused(false)}
        onLongPress={onLongPress}
        keyboardType="number-pad"
        maxLength={1}
        textAlign="center"
        selectTextOnFocus
        caretHidden
      />
    </View>
  );
});

// ─── OTP Box styles (created once per theme reference, not per render) ────────
const otpStylesCache = new WeakMap();
function otpStyles(theme) {
  if (otpStylesCache.has(theme)) return otpStylesCache.get(theme);
  const s = StyleSheet.create({
    box: {
      width: 46,
      height: 56,
      borderRadius: radius.md,
      backgroundColor: theme.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    boxFilled: {
      backgroundColor: theme.primaryLight,
    },
    digit: {
      fontFamily: fonts.display,
      fontSize: 24,
      color: theme.text,
      width: '100%',
      height: '100%',
      textAlignVertical: 'center',
    },
  });
  otpStylesCache.set(theme, s);
  return s;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
function makeStyles(theme, insets) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },

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
      flex: 1, height: 3,
      backgroundColor: 'rgba(255,255,255,0.25)',
      borderRadius: radius.full, overflow: 'hidden',
    },
    progressFill: {
      height: '100%', backgroundColor: '#fff', borderRadius: radius.full,
    },
    counter: {
      fontFamily: fonts.bodySemi, fontSize: 12,
      color: 'rgba(255,255,255,0.85)', minWidth: 28, textAlign: 'right',
    },
    eyebrow: {
      fontFamily: fonts.bodySemi, fontSize: 11,
      color: 'rgba(255,255,255,0.75)', letterSpacing: 1.4, marginBottom: spacing.sm,
    },
    title: {
      fontFamily: fonts.display, fontSize: 28,
      color: '#fff', lineHeight: 34, marginBottom: spacing.sm,
    },

    // 1. Subtitle + wrong number
    subtitleRow: {
      flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    },
    subtitle: {
      fontFamily: fonts.body, fontSize: 14,
      color: 'rgba(255,255,255,0.75)',
    },
    wrongNumber: {
      fontFamily: fonts.bodySemi, fontSize: 14,
      color: '#fff', textDecorationLine: 'underline',
      textDecorationColor: 'rgba(255,255,255,0.55)',
    },

    body: {
      padding: spacing.lg,
      paddingTop: spacing.lg,
      gap: spacing.md,
    },

    // 4. SMS card
    smsCard: {
      backgroundColor: theme.surfaceAlt,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: spacing.md,
    },
    smsHeader: {
      flexDirection: 'row', alignItems: 'center',
      gap: spacing.xs, marginBottom: spacing.xs,
    },
    smsSenderDot: {
      width: 7, height: 7, borderRadius: 99, backgroundColor: '#22C55E',
    },
    smsSender: {
      fontFamily: fonts.bodyXBold, fontSize: 12,
      color: theme.text, flex: 1, letterSpacing: 0.6,
    },
    smsTime: {
      fontFamily: fonts.body, fontSize: 11, color: theme.textDim,
    },
    smsBody: {
      fontFamily: fonts.body, fontSize: 13,
      color: theme.textDim, lineHeight: 20,
    },
    smsCode: {
      fontFamily: fonts.bodyBold, fontSize: 14,
      color: theme.text, letterSpacing: 3,
    },
    smsExpiry: {
      fontFamily: fonts.body, fontSize: 11, color: theme.muted,
    },

    // 3. Digit preview strip
    previewStrip: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingHorizontal: spacing.xs,
    },
    previewCell: {
      flex: 1, alignItems: 'center', justifyContent: 'center', height: 20,
    },
    previewDigit: {
      fontFamily: fonts.bodyXBold, fontSize: 13, color: theme.text, letterSpacing: 1,
    },
    previewDot: {
      width: 5, height: 5, borderRadius: 99, backgroundColor: theme.muted,
    },

    // OTP
    otpRow: {
      flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs,
    },

    // 2. Progress dots
    dotsRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingHorizontal: spacing.sm, marginTop: -spacing.xs,
    },
    dot: {
      width: 5, height: 5, borderRadius: 99, backgroundColor: theme.border,
    },

    resendRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    resendText: {
      fontFamily: fonts.bodyMed, fontSize: 13, color: theme.primary,
    },
    resendDisabled: { color: theme.textDim },
    callMeText: {
      fontFamily: fonts.bodyMed, fontSize: 13, color: theme.primary,
    },

    ctaWrapper: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      backgroundColor: theme.bg,
      gap: spacing.sm,
    },

    // 5. Security note
    securityNote: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: spacing.xs,
    },
    securityText: {
      fontFamily: fonts.body, fontSize: 11,
      color: theme.textDim, textAlign: 'center',
    },

    ctaButton: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', height: 54, borderRadius: radius.lg,
    },
    ctaText: {
      fontFamily: fonts.bodyBold, fontSize: 16, color: '#fff',
    },
  });
}