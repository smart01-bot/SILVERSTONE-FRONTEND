import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, Animated, TouchableOpacity, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import AnimatedInput from '../../components/AnimatedInput';
import { useHaptics } from '../../hooks/useHaptics';

const TOTAL_STEPS = 6;
const STEP = 3;

export default function Step3Personal({ navigation, route }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [nida, setNida]   = useState('');

  const [nameErr, setNameErr]   = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [nidaErr, setNidaErr]   = useState('');

  // Animation refs
  const progressAnim = useRef(new Animated.Value((STEP - 1) / TOTAL_STEPS)).current;
  const shieldAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: STEP / TOTAL_STEPS,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    Animated.spring(shieldAnim, {
      toValue: 1,
      delay: 300,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  // NIDA formatter — spaces every 4 digits for display
  const handleNidaChange = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 20);
    setNida(digits);
    if (nidaErr) setNidaErr('');
  };

  const nidaDisplay = nida.replace(/(.{4})/g, '$1 ').trim();
  const nidaComplete = nida.length === 20;

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const nameValid  = name.trim().length >= 3;
  const canProceed = nameValid && emailValid && nidaComplete;

  const validate = () => {
    let ok = true;
    if (!nameValid)  { setNameErr('Enter your full name (at least 3 characters)'); ok = false; }
    if (!emailValid) { setEmailErr('Enter a valid email address'); ok = false; }
    if (!nidaComplete) { setNidaErr('NIDA number must be exactly 20 digits'); ok = false; }
    return ok;
  };

  const handleNext = () => {
    if (!validate()) { haptics.error(); return; }
    haptics.medium();
    setTimeout(() => haptics.success(), 120);
    navigation.navigate('Step4Business', {
      ...route.params,
      name: name.trim(),
      email: email.trim(),
      nida,
    });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const s = styles(theme, insets);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header gradient */}
      <LinearGradient
        colors={[theme.gradPrimA, theme.gradPrimB]}
        style={s.header}
      >
        <View style={s.navRow}>
          <TouchableOpacity onPress={() => { haptics.light(); navigation.goBack(); }} style={s.backBtn}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={s.progressTrack}>
            <Animated.View style={[s.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={s.stepCounter}>{STEP}/{TOTAL_STEPS}</Text>
        </View>

        <Text style={s.eyebrow}>SIGN UP · SUB-AGENT</Text>
        <Text style={s.title}>Personal Details</Text>
        <Text style={s.subtitle}>We need to verify your identity against national records.</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Full name */}
          <AnimatedInput
            label="Full Name"
            value={name}
            onChangeText={(t) => { setName(t); if (nameErr) setNameErr(''); }}
            placeholder="As on your national ID"
            error={nameErr}
            autoCapitalize="words"
            returnKeyType="next"
          />

          {/* Email */}
          <View style={{ marginTop: 16 }}>
            <AnimatedInput
              label="Email Address"
              value={email}
              onChangeText={(t) => { setEmail(t); if (emailErr) setEmailErr(''); }}
              placeholder="you@example.com"
              error={emailErr}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          {/* NIDA */}
          <View style={{ marginTop: 16 }}>
            <View style={s.nidaRow}>
              <Text style={s.inputLabel}>NIDA Number</Text>
              {nidaComplete && <Text style={s.greenTick}>✓</Text>}
            </View>
            <AnimatedInput
              label=""
              value={nidaDisplay}
              onChangeText={handleNidaChange}
              placeholder="XXXX XXXX XXXX XXXX XXXX"
              error={nidaErr}
              keyboardType="number-pad"
              maxLength={24}
              mono
              containerStyle={nidaComplete ? s.nidaInputDone : null}
            />
          </View>

          {/* Shield callout */}
          <Animated.View style={[s.shield, {
            opacity: shieldAnim,
            transform: [{ scale: shieldAnim }],
          }]}>
            <Text style={s.shieldIcon}>🛡️</Text>
            <Text style={s.shieldText}>
              Your NIDA number is verified against the national registry. This usually takes about 5 seconds.
            </Text>
          </Animated.View>

          {/* CTA */}
          <TouchableOpacity
            onPress={handleNext}
            disabled={!canProceed}
            activeOpacity={0.85}
            style={{ marginTop: 32 }}
          >
            <LinearGradient
              colors={canProceed
                ? [theme.gradPrimA, theme.gradPrimB]
                : ['#555', '#444']}
              style={s.cta}
            >
              <Text style={s.ctaText}>Continue</Text>
              <Text style={s.ctaArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = (theme, insets) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },

  header: {
    paddingTop: insets.top + 12,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: { marginRight: 12, padding: 4 },
  backArrow: { fontSize: 22, color: '#fff' },

  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  stepCounter: {
    marginLeft: 12,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },

  eyebrow: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontFamily: 'Manrope_800ExtraBold',
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  inputLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: theme.textDim,
    marginBottom: 6,
  },

  nidaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  greenTick: {
    color: '#22C55E',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },

  // nidaInputDone: passed as containerStyle to AnimatedInput when complete
  // If AnimatedInput doesn't support containerStyle, this is a no-op (safe)
  nidaInputDone: {
    borderColor: '#22C55E',
  },

  errText: {
    marginTop: 4,
    fontSize: 12,
    color: theme.primary,
    fontFamily: 'Inter_400Regular',
  },

  shield: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  shieldIcon: { fontSize: 20, marginTop: 1 },
  shieldText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: theme.textDim,
    lineHeight: 19,
  },

  cta: {
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: theme.gradPrimA,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  ctaArrow: {
    color: '#fff',
    fontSize: 18,
  },
});
