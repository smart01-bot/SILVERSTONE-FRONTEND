// src/screens/auth/RegisterScreen.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Image, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons }       from '@expo/vector-icons';
import { useAuth }        from '../../context/AuthContext';
import { useTheme }       from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';
import AnimatedInput      from '../../components/AnimatedInput';

const STEPS       = 3;
const STEP_LABELS = ['Personal', 'Business', 'Identity'];

// ── Animated step indicator ───────────────────────────────────────────────────
function StepBar({ step, theme }) {
  const progress = useRef(new Animated.Value((step - 1) / (STEPS - 1))).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: (step - 1) / (STEPS - 1),
      tension: 120, friction: 12, useNativeDriver: false,
    }).start();
  }, [step]);

  return (
    <View style={sb.container}>
      <View style={[sb.track, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
        <Animated.View style={[sb.fill, {
          width: progress.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] }),
          backgroundColor: '#fff',
        }]} />
      </View>
      <View style={sb.labels}>
        {STEP_LABELS.map((label, i) => (
          <Text key={label} style={[
            sb.label,
            { color: step >= i + 1 ? '#fff' : 'rgba(255,255,255,0.5)' },
          ]}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const sb = StyleSheet.create({
  container: { marginTop: spacing.md },
  track:     { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill:      { height: '100%', borderRadius: 2 },
  labels:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  label:     { fontSize: 14, fontFamily: fonts.bodySemi },
});

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { theme, isDark } = useTheme();

  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [agreed,  setAgreed]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '', password: '', confirmPassword: '',
    businessName: '', businessLocation: '', businessRegNo: '',
    tin: '', nida: '',
  });

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    if (step === 1) {
      if (!form.name.trim()) return 'Full name is required.';
      if (form.name.trim().split(' ').length < 2) return 'Please enter your full name.';
      if (!form.phone.trim()) return 'Phone number is required.';
      if (!/^(07|06|\+2557|\+2556)\d{8}$/.test(form.phone.replace(/\s/g, '')))
        return 'Enter a valid Tanzanian phone number.';
      if (form.password.length < 6) return 'Password must be at least 6 characters.';
      if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    }
    if (step === 2) {
      if (!form.businessName.trim())     return 'Business name is required.';
      if (!form.businessLocation.trim()) return 'Business location is required.';
      if (!form.businessRegNo.trim())    return 'Registration number is required.';
    }
    if (step === 3) {
      if (!form.tin.trim())  return 'TIN is required.';
      if (!form.nida.trim()) return 'NIDA is required.';
      if (!agreed)           return 'You must agree to the Terms of Service.';
    }
    return null;
  };

  const handleNext = async () => {
    setError('');
    const err = validate();
    if (err) { setError(err); return; }
    if (step < STEPS) { setStep(s => s + 1); return; }

    setLoading(true);
    try {
      const email = `${form.phone.replace(/\s/g, '')}@silverstone.tz`;
      await register({
        name:             form.name.trim(),
        phone:            form.phone.trim(),
        email,
        password:         form.password,
        businessName:     form.businessName.trim(),
        businessLocation: form.businessLocation.trim(),
        regNo:            form.businessRegNo.trim(),
        tin:              form.tin.trim(),
        nida:             form.nida.trim(),
      });
    } catch (e) {
      setError(
        e.message
          ?.replace('Firebase: ', '')
          ?.replace('(auth/email-already-in-use).', 'Phone number already registered.')
          ?? 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const pwdStrength = form.password.length < 6 ? 0 : form.password.length < 8 ? 1 : 2;
  const pwdColors   = ['#C8102E', '#F59E0B', '#16A34A'];
  const pwdWidths   = ['33%', '66%', '100%'];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Gradient header with step bar ── */}
          <LinearGradient
            colors={[theme.gradPrimA, theme.gradPrimB]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.headerBand}
          >
            <View style={s.headerDecor} />
            <View style={s.logoRow}>
              <View style={s.logoTile}>
                <Image source={require('../../../assets/images/SilverS.png')} style={s.logoImg} resizeMode="contain" />
              </View>
              <Text style={s.logoText}>silverstone</Text>
            </View>
            <Text style={s.headerHeading}>Create Account</Text>
            <StepBar step={step} theme={theme} />
          </LinearGradient>

          {/* ── Step 1 — Personal ── */}
          {step === 1 && (
            <View style={s.form}>
              <Text style={[s.stepTitle, { color: theme.text }]}>Personal Details</Text>

              <AnimatedInput label="Full Name"     value={form.name}     onChangeText={set('name')}     placeholder="e.g. Juma Hassan" />
              <AnimatedInput label="Phone Number"  value={form.phone}    onChangeText={set('phone')}    placeholder="07XX XXX XXX"    keyboardType="phone-pad" />

              <View style={s.pwdWrap}>
                <AnimatedInput
                  label="Password"
                  value={form.password}
                  onChangeText={set('password')}
                  placeholder="Min 6 characters"
                  secureTextEntry={!showPwd}
                  autoCapitalize="none"
                  inputStyle={{ paddingRight: 44 }}
                />
                <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={s.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={22} color={theme.textDim} />
                </TouchableOpacity>
              </View>

              {form.password.length > 0 && (
                <View style={s.strengthBar}>
                  <View style={[s.strengthFill, { width: pwdWidths[pwdStrength], backgroundColor: pwdColors[pwdStrength] }]} />
                </View>
              )}

              <View style={s.pwdWrap}>
                <AnimatedInput
                  label="Confirm Password"
                  value={form.confirmPassword}
                  onChangeText={set('confirmPassword')}
                  placeholder="Repeat password"
                  secureTextEntry={!showCPwd}
                  autoCapitalize="none"
                  inputStyle={{ paddingRight: 44 }}
                />
                <TouchableOpacity onPress={() => setShowCPwd(v => !v)} style={s.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showCPwd ? 'eye-off-outline' : 'eye-outline'} size={22} color={theme.textDim} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Step 2 — Business ── */}
          {step === 2 && (
            <View style={s.form}>
              <Text style={[s.stepTitle, { color: theme.text }]}>Business Details</Text>
              <AnimatedInput label="Business Name"      value={form.businessName}     onChangeText={set('businessName')}     placeholder="e.g. Hassan Mobile Money" />
              <AnimatedInput label="Business Location"  value={form.businessLocation}  onChangeText={set('businessLocation')}  placeholder="e.g. Kariakoo, Dar es Salaam" />
              <AnimatedInput label="Registration Number" value={form.businessRegNo}    onChangeText={set('businessRegNo')}    placeholder="e.g. BR-2024-XXXXX" />
            </View>
          )}

          {/* ── Step 3 — Identity ── */}
          {step === 3 && (
            <View style={s.form}>
              <Text style={[s.stepTitle, { color: theme.text }]}>Identity Verification</Text>

              <View style={[s.infoBox, { backgroundColor: theme.primaryLight, borderColor: theme.primary + '30' }]}>
                <Text style={[s.infoText, { color: theme.textDim }]}>
                  Your information will be verified by the Silverstone admin. This typically takes 24–48 hours.
                </Text>
              </View>

              <AnimatedInput label="TIN Number"  value={form.tin}  onChangeText={set('tin')}  placeholder="e.g. 100-XXX-XXX" />
              <AnimatedInput label="NIDA Number" value={form.nida} onChangeText={set('nida')} placeholder="20-digit ID number" keyboardType="numeric" />

              <TouchableOpacity onPress={() => setAgreed(v => !v)} style={s.checkRow} activeOpacity={0.7}>
                <View style={[s.checkbox, {
                  backgroundColor: agreed ? theme.primary : 'transparent',
                  borderColor:     agreed ? theme.primary : theme.border,
                }]}>
                  {agreed && <Ionicons name="checkmark" size={15} color="#fff" />}
                </View>
                <Text style={[s.checkLabel, { color: theme.textDim }]}>
                  I agree to the{' '}
                  <Text style={{ color: theme.primary, fontFamily: fonts.bodySemi }}>Terms of Service</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {error ? <Text style={s.error}>{error}</Text> : null}

          <View style={s.btnRow}>
            {step > 1 && (
              <TouchableOpacity
                onPress={() => { setStep(ss => ss - 1); setError(''); }}
                style={[s.btnBack, { borderColor: theme.border }]}
                activeOpacity={0.75}
              >
                <Text style={[s.btnBackText, { color: theme.textDim }]}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleNext}
              disabled={loading}
              style={[s.btnPrimary, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnPrimaryText}>{step < STEPS ? 'Next' : 'Submit Application'}</Text>
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.signinWrap}>
            <Text style={[s.signinText, { color: theme.textDim }]}>
              Already registered?{' '}
              <Text style={{ color: theme.primary, fontFamily: fonts.bodyBold }}>Sign in</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },

  headerBand: {
    paddingHorizontal:       spacing.lg,
    paddingTop:              spacing.xl,
    paddingBottom:           spacing.xl,
    borderBottomLeftRadius:  radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow:                'hidden',
    marginBottom:            spacing.sm,
  },
  headerDecor: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -60,
  },
  logoRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginBottom: spacing.md,
  },
  logoTile: {
    width: 32, height: 32, borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', padding: 5,
  },
  logoImg:       { width: '100%', height: '100%' },
  logoText:      { fontSize: 22, fontFamily: fonts.display, color: '#fff', letterSpacing: -0.4 },
  headerHeading: { fontSize: 30, fontFamily: fonts.display, color: '#fff', letterSpacing: -0.5 },

  form:      { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  stepTitle: { fontSize: 24, fontFamily: fonts.heading, marginBottom: spacing.xs, letterSpacing: -0.3 },

  pwdWrap: { position: 'relative' },
  eyeBtn:  { position: 'absolute', right: spacing.md, bottom: 17 },

  strengthBar:  { height: 4, backgroundColor: '#ECECEE', borderRadius: 2, marginTop: spacing.sm - 2, marginHorizontal: 0, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2 },

  infoBox:  { borderRadius: radius.md, padding: spacing.md - 2, borderWidth: 1, marginBottom: spacing.sm, marginTop: spacing.xs },
  infoText: { fontSize: 16, fontFamily: fonts.body, lineHeight: 24 },

  checkRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, marginTop: spacing.md },
  checkbox:   { width: 24, height: 24, borderRadius: radius.sm - 2, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checkLabel: { fontSize: 16, fontFamily: fonts.body, flex: 1 },

  error: {
    color: '#C8102E', fontSize: 16, fontFamily: fonts.body,
    textAlign: 'center', marginTop: spacing.md - 4, paddingHorizontal: spacing.lg,
  },

  btnRow:         { flexDirection: 'row', gap: spacing.sm + 2, marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  btnBack:        { flex: 1, height: 56, borderWidth: 1.5, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  btnBackText:    { fontSize: 18, fontFamily: fonts.bodySemi },
  btnPrimary:     { flex: 2, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 18, fontFamily: fonts.bodyBold },
  signinWrap:     { alignItems: 'center', marginTop: spacing.lg },
  signinText:     { fontSize: 17, fontFamily: fonts.body },
});
