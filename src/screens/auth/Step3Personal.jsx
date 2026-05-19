import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, Animated, TouchableOpacity, StatusBar, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import AnimatedInput from '../../components/AnimatedInput';
import { useHaptics } from '../../hooks/useHaptics';

const TOTAL_STEPS = 6;
const STEP = 3;

// ─── NIDA Segmented Display ──────────────────────────────────────────────────
function NidaBoxes({ digits, hasError, isComplete, theme }) {
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Flash on complete — useNativeDriver:false (opacity/color)
  useEffect(() => {
    if (isComplete) {
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 180, useNativeDriver: false }),
        Animated.timing(flashAnim, { toValue: 0, duration: 700, useNativeDriver: false }),
      ]).start();
    }
  }, [isComplete]);

  const flashOpacity = flashAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] });

  const groups = [0, 1, 2, 3].map(g => digits.slice(g * 5, (g + 1) * 5));
  const ns = nidaStyles(theme);

  return (
    <View>
      {/* Green flash overlay */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, {
          borderRadius: 14,
          backgroundColor: '#22C55E',
          opacity: flashOpacity,
          zIndex: 2,
        }]}
      />

      <View style={[ns.groupRow, hasError && ns.groupRowErr, isComplete && ns.groupRowDone]}>
        {groups.map((group, gi) => (
          <React.Fragment key={gi}>
            <View style={ns.group}>
              {[0, 1, 2, 3, 4].map(bi => {
                const char = group[bi] ?? null;
                const filled = char !== null;
                return (
                  <View key={bi} style={[ns.box, filled && ns.boxFilled, isComplete && ns.boxComplete]}>
                    <Text style={[ns.digit, !filled && ns.digitEmpty, isComplete && ns.digitComplete]}>
                      {filled ? char : '·'}
                    </Text>
                  </View>
                );
              })}
            </View>
            {gi < 3 && <View style={ns.sep} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const nidaStyles = (theme) => StyleSheet.create({
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    backgroundColor: theme.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 14,
    gap: 4,
  },
  groupRowErr:  { borderColor: '#E01535' },
  groupRowDone: { borderColor: '#22C55E' },
  group: { flex: 1, flexDirection: 'row', gap: 3 },
  sep:   { width: 1, height: 20, backgroundColor: theme.border, marginHorizontal: 4 },
  box: {
    flex: 1, height: 30,
    borderRadius: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  boxFilled: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  boxComplete: {
    borderColor: '#22C55E50',
    backgroundColor: '#22C55E0D',
  },
  digit: {
    fontFamily: 'RobotoMono_400Regular',
    fontSize: 13,
    color: theme.text,
    lineHeight: 16,
  },
  digitEmpty:    { color: theme.muted, fontSize: 9 },
  digitComplete: { color: '#16A34A' },
});
// ─────────────────────────────────────────────────────────────────────────────

export default function Step3Personal({ navigation, route }) {
  const { theme } = useTheme();
  const insets    = useSafeAreaInsets();
  const haptics   = useHaptics();
  const nidaRef   = useRef(null);

  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [nida, setNida]   = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd,         setShowPwd]         = useState(false);
  const [showCPwd,        setShowCPwd]        = useState(false);

  const [nameErr, setNameErr]   = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [nidaErr, setNidaErr]   = useState('');
  const [pwdErr,  setPwdErr]    = useState('');

  // ── Animated values ────────────────────────────────────────────────────────
  const progressAnim = useRef(new Animated.Value((STEP - 1) / TOTAL_STEPS)).current;
  const f1 = useRef(new Animated.Value(0)).current; // name
  const f2 = useRef(new Animated.Value(0)).current; // email
  const f3 = useRef(new Animated.Value(0)).current; // nida
  const f4 = useRef(new Animated.Value(0)).current; // shield
  const f5 = useRef(new Animated.Value(0)).current; // password
  const f6 = useRef(new Animated.Value(0)).current; // confirm password

  // useNativeDriver: false — width animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: STEP / TOTAL_STEPS, duration: 600, useNativeDriver: false,
    }).start();
  }, []);

  // useNativeDriver: true — translate / opacity
  useEffect(() => {
    Animated.stagger(80, [
      Animated.spring(f1, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
      Animated.spring(f2, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
      Animated.spring(f5, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
      Animated.spring(f6, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
      Animated.spring(f3, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
      Animated.spring(f4, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── NIDA ───────────────────────────────────────────────────────────────────
  const handleNidaChange = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 20);
    setNida(digits);
    if (nidaErr) setNidaErr('');
    if (digits.length === 20) haptics.success();
  };

  const pwdStrength  = password.length === 0 ? -1 : password.length < 6 ? 0 : password.length < 10 ? 1 : 2;
  const pwdColors    = ['#C8102E', '#F59E0B', '#16A34A'];
  const pwdWidths    = ['33%', '66%', '100%'];

  const nidaComplete = nida.length === 20;
  const emailValid   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const nameValid    = name.trim().length >= 3;
  const pwdValid     = password.length >= 6;
  const pwdMatch     = password === confirmPassword;
  const canProceed   = nameValid && emailValid && nidaComplete && pwdValid && pwdMatch;

  const validate = () => {
    let ok = true;
    if (!nameValid)    { setNameErr('Enter your full name (at least 3 characters)'); ok = false; }
    if (!emailValid)   { setEmailErr('Enter a valid email address'); ok = false; }
    if (!pwdValid)     { setPwdErr('Password must be at least 6 characters'); ok = false; }
    else if (!pwdMatch){ setPwdErr('Passwords do not match'); ok = false; }
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
      password,
    });
  };

  // ── Interpolations ─────────────────────────────────────────────────────────
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });

  const slide = (anim) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  });

  const s = styles(theme, insets);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient colors={[theme.gradPrimA, theme.gradPrimB]} style={s.header}>
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

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Full name */}
          <Animated.View style={slide(f1)}>
            <AnimatedInput
              label="Full Name"
              value={name}
              onChangeText={(t) => { setName(t); if (nameErr) setNameErr(''); }}
              placeholder="As on your national ID"
              error={nameErr}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </Animated.View>

          {/* Email */}
          <Animated.View style={[{ marginTop: 16 }, slide(f2)]}>
            <AnimatedInput
              label="Email Address"
              value={email}
              onChangeText={(t) => { setEmail(t); if (emailErr) setEmailErr(''); }}
              placeholder="you@example.com"
              error={emailErr}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
            />
          </Animated.View>

          {/* Password */}
          <Animated.View style={[{ marginTop: 16 }, slide(f5)]}>
            <View style={s.pwdWrap}>
              <AnimatedInput
                label="Create Password"
                value={password}
                onChangeText={(t) => { setPassword(t); if (pwdErr) setPwdErr(''); }}
                placeholder="Min 6 characters"
                secureTextEntry={!showPwd}
                autoCapitalize="none"
                returnKeyType="next"
                inputStyle={{ paddingRight: 44 }}
              />
              <TouchableOpacity
                onPress={() => setShowPwd(v => !v)}
                style={s.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9090A0" />
              </TouchableOpacity>
            </View>
            {password.length > 0 && (
              <View style={s.strengthBar}>
                <View style={[s.strengthFill, { width: pwdWidths[pwdStrength], backgroundColor: pwdColors[pwdStrength] }]} />
              </View>
            )}
          </Animated.View>

          {/* Confirm Password */}
          <Animated.View style={[{ marginTop: 16 }, slide(f6)]}>
            <View style={s.pwdWrap}>
              <AnimatedInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); if (pwdErr) setPwdErr(''); }}
                placeholder="Repeat password"
                secureTextEntry={!showCPwd}
                autoCapitalize="none"
                returnKeyType="done"
                inputStyle={{ paddingRight: 44 }}
              />
              <TouchableOpacity
                onPress={() => setShowCPwd(v => !v)}
                style={s.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name={showCPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9090A0" />
              </TouchableOpacity>
            </View>
            {pwdErr ? <Text style={s.errText}>{pwdErr}</Text> : null}
          </Animated.View>

          {/* NIDA — segmented boxes */}
          <Animated.View style={[{ marginTop: 16 }, slide(f3)]}>
            <View style={s.nidaHeader}>
              <Text style={s.inputLabel}>NIDA Number</Text>
              {nidaComplete
                ? <Text style={s.greenTick}>✓ Complete</Text>
                : <Text style={s.nidaCount}>{nida.length} / 20</Text>
              }
            </View>

            <TouchableOpacity activeOpacity={1} onPress={() => nidaRef.current?.focus()}>
              <NidaBoxes digits={nida} hasError={!!nidaErr} isComplete={nidaComplete} theme={theme} />
            </TouchableOpacity>

            {/* Hidden real input */}
            <TextInput
              ref={nidaRef}
              value={nida}
              onChangeText={handleNidaChange}
              keyboardType="number-pad"
              maxLength={20}
              style={s.hiddenInput}
              caretHidden
            />

            {nidaErr ? <Text style={s.errText}>{nidaErr}</Text> : null}
          </Animated.View>

          {/* Shield callout */}
          <Animated.View style={[s.shield, {
            opacity: f4,
            transform: [{ scale: f4.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
          }]}>
            <Text style={s.shieldIcon}>🛡️</Text>
            <Text style={s.shieldText}>
              Your NIDA number is verified against the national registry. This usually takes about 5 seconds.
            </Text>
          </Animated.View>

          {/* CTA */}
          <TouchableOpacity onPress={handleNext} disabled={!canProceed} activeOpacity={0.85} style={{ marginTop: 32 }}>
            <LinearGradient
              colors={canProceed ? [theme.gradPrimA, theme.gradPrimB] : ['#555', '#444']}
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
    paddingTop: insets.top + 12, paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  navRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn:    { marginRight: 12, padding: 4 },
  backArrow:  { fontSize: 22, color: '#fff' },
  progressTrack: {
    flex: 1, height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  stepCounter: { marginLeft: 12, color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  eyebrow: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.4, marginBottom: 6 },
  title:   { color: '#fff', fontSize: 26, fontFamily: 'Manrope_800ExtraBold', marginBottom: 6 },
  subtitle:{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },

  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  nidaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  inputLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: theme.textDim },
  greenTick:  { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#22C55E' },
  nidaCount:  { fontSize: 12, fontFamily: 'RobotoMono_400Regular', color: theme.muted },

  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  errText:     { marginTop: 6, fontSize: 12, color: theme.primary, fontFamily: 'Inter_400Regular' },

  shield: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: theme.surfaceAlt, borderRadius: 14,
    borderWidth: 1, borderColor: theme.border,
    padding: 16, marginTop: 24, gap: 12,
  },
  shieldIcon: { fontSize: 20, marginTop: 1 },
  shieldText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: theme.textDim, lineHeight: 19 },

  cta: {
    height: 54, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#E01535', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  ctaText:  { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  ctaArrow: { color: '#fff', fontSize: 18 },

  pwdWrap:      { position: 'relative' },
  eyeBtn:       { position: 'absolute', right: 16, bottom: 17 },
  strengthBar:  { height: 3, backgroundColor: '#ECECEE', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2 },
});