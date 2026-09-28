/**
 * Step2OTP.jsx
 * Sub-agent registration · Step 2 of 6 — OTP preview
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

import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
// Note: Animated kept for shakeAnim on the otpRow — that stays native-only (translateX).
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { spacing, radius, fonts } from "../../constants/theme";
import PressableScale from "../../components/PressableScale";
import { useHaptics } from "../../hooks/useHaptics";

const TOTAL_STEPS = 6;
const STEP = 2;
const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;

function maskPhone(phone) {
  if (!phone || phone.length < 6) return phone;
  return `${phone.slice(0, 5)} ••• ${phone.slice(-3)}`;
}

export default function Step2OTP({ navigation, route }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const s = makeStyles(theme, insets);
  return (
    <View style={s.root}>
      <LinearGradient
        colors={[theme.gradPrimA, theme.gradPrimB]}
        style={s.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: "white", paddingVertical: 12 }}>
            ← Back · 2/6
          </Text>
        </TouchableOpacity>
        <Text style={s.title}>Phone verification</Text>
        <Text style={s.subtitle}>{route.params?.phone}</Text>
      </LinearGradient>
      <View style={{ padding: 24, gap: 20 }}>
        <Text style={{ color: theme.text, fontSize: 16 }}>
          SMS verification is not available yet. No code has been sent.
        </Text>
        <Text style={{ color: theme.textDim }}>
          You can save your application details. Submission will require phone
          verification.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Step3Personal", route.params)}
          style={{
            padding: 16,
            backgroundColor: theme.primary,
            borderRadius: 14,
          }}
        >
          <Text style={{ color: "white", textAlign: "center" }}>
            Continue with draft →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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