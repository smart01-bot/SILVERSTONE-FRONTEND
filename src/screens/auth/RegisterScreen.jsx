// src/screens/auth/RegisterScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';

const STEPS       = 3;
const STEP_LABELS = ['Personal', 'Business', 'Identity'];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { theme, isDark } = useTheme();

  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [agreed,  setAgreed]  = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '', password: '', confirmPassword: '',
    businessName: '', businessLocation: '', businessRegNo: '',
    tin: '', nida: '',
  });

  const [showPwd,  setShowPwd]  = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);

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
      if (!form.tin.trim())   return 'TIN is required.';
      if (!form.nida.trim())  return 'NIDA is required.';
      if (!agreed)            return 'You must agree to the Terms of Service.';
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

  const inp = [s.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={s.logoRow}>
            <View style={s.logoTile}>
              <Image source={require('../../../assets/images/SilverS.png')} style={s.logoImg} resizeMode="contain" />
            </View>
            <Text style={[s.logoText, { color: theme.text }]}>silverstone</Text>
          </View>

          {/* Step progress bar */}
          <View style={s.stepBar}>
            {STEP_LABELS.map((label, i) => (
              <View key={label} style={s.stepItem}>
                <View style={[s.stepLine, { backgroundColor: step >= i + 1 ? theme.primary : theme.border }]} />
                <Text style={[s.stepLabel, { color: step === i + 1 ? theme.primary : theme.textDim }]}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {/* Step 1 — Personal */}
          {step === 1 && (
            <View style={s.form}>
              <Text style={[s.stepTitle, { color: theme.text }]}>Personal Details</Text>

              <Text style={[s.label, { color: theme.textDim }]}>Full Name</Text>
              <TextInput style={inp} value={form.name} onChangeText={set('name')} placeholder="e.g. Juma Hassan" placeholderTextColor={theme.muted} />

              <Text style={[s.label, { color: theme.textDim }]}>Phone Number</Text>
              <TextInput style={inp} value={form.phone} onChangeText={set('phone')} placeholder="07XX XXX XXX" placeholderTextColor={theme.muted} keyboardType="phone-pad" />

              <Text style={[s.label, { color: theme.textDim }]}>Password</Text>
              <View>
                <TextInput
                  style={[inp, { paddingRight: 52 }]}
                  value={form.password}
                  onChangeText={set('password')}
                  placeholder="Min 6 characters"
                  placeholderTextColor={theme.muted}
                  secureTextEntry={!showPwd}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={s.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={22} color={theme.textDim} />
                </TouchableOpacity>
              </View>

              {form.password.length > 0 && (
                <View style={s.strengthBar}>
                  <View style={[s.strengthFill, {
                    width: form.password.length < 6 ? '33%' : form.password.length < 8 ? '66%' : '100%',
                    backgroundColor: form.password.length < 6 ? '#C8102E' : form.password.length < 8 ? '#F59E0B' : '#16A34A',
                  }]} />
                </View>
              )}

              <Text style={[s.label, { color: theme.textDim }]}>Confirm Password</Text>
              <View>
                <TextInput
                  style={[inp, { paddingRight: 52 }]}
                  value={form.confirmPassword}
                  onChangeText={set('confirmPassword')}
                  placeholder="Repeat password"
                  placeholderTextColor={theme.muted}
                  secureTextEntry={!showCPwd}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowCPwd(v => !v)} style={s.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showCPwd ? 'eye-off-outline' : 'eye-outline'} size={22} color={theme.textDim} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 2 — Business */}
          {step === 2 && (
            <View style={s.form}>
              <Text style={[s.stepTitle, { color: theme.text }]}>Business Details</Text>

              <Text style={[s.label, { color: theme.textDim }]}>Business Name</Text>
              <TextInput style={inp} value={form.businessName} onChangeText={set('businessName')} placeholder="e.g. Hassan Mobile Money" placeholderTextColor={theme.muted} />

              <Text style={[s.label, { color: theme.textDim }]}>Business Location</Text>
              <TextInput style={inp} value={form.businessLocation} onChangeText={set('businessLocation')} placeholder="e.g. Kariakoo, Dar es Salaam" placeholderTextColor={theme.muted} />

              <Text style={[s.label, { color: theme.textDim }]}>Registration Number</Text>
              <TextInput style={inp} value={form.businessRegNo} onChangeText={set('businessRegNo')} placeholder="e.g. BR-2024-XXXXX" placeholderTextColor={theme.muted} />
            </View>
          )}

          {/* Step 3 — Identity */}
          {step === 3 && (
            <View style={s.form}>
              <Text style={[s.stepTitle, { color: theme.text }]}>Identity Verification</Text>

              <View style={[s.infoBox, { backgroundColor: theme.primaryLight, borderColor: theme.primary + '30' }]}>
                <Text style={[s.infoText, { color: theme.textDim }]}>
                  Your information will be verified by the Silverstone admin before your account is activated. This typically takes 24–48 hours.
                </Text>
              </View>

              <Text style={[s.label, { color: theme.textDim }]}>TIN Number</Text>
              <TextInput style={inp} value={form.tin} onChangeText={set('tin')} placeholder="e.g. 100-XXX-XXX" placeholderTextColor={theme.muted} />

              <Text style={[s.label, { color: theme.textDim }]}>NIDA Number</Text>
              <TextInput style={inp} value={form.nida} onChangeText={set('nida')} placeholder="20-digit ID number" placeholderTextColor={theme.muted} keyboardType="numeric" />

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
  scroll: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.xxl },

  logoRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing.sm + 2,
    marginBottom:   spacing.lg,
    marginTop:      spacing.sm,
  },
  logoTile: {
    width: 36, height: 36, borderRadius: radius.sm + 1,
    backgroundColor: '#C8102E', alignItems: 'center', justifyContent: 'center', padding: spacing.sm - 2,
  },
  logoImg:  { width: '100%', height: '100%' },
  logoText: { fontSize: 24, fontFamily: fonts.display, letterSpacing: -0.5 },

  stepBar:   { flexDirection: 'row', gap: spacing.sm - 2, marginBottom: spacing.lg },
  stepItem:  { flex: 1 },
  stepLine:  { height: 4, borderRadius: 2, marginBottom: spacing.xs },
  stepLabel: { fontSize: 14, fontFamily: fonts.bodySemi },

  stepTitle: { fontSize: 24, fontFamily: fonts.heading, marginBottom: spacing.lg, letterSpacing: -0.3 },
  form:      { gap: spacing.xs },

  label: { fontSize: 16, fontFamily: fonts.bodyMed, marginBottom: spacing.sm - 2, marginTop: spacing.md - 4 },
  input: {
    height:            56,
    borderWidth:       1.5,
    borderRadius:      radius.md,
    paddingHorizontal: spacing.md,
    fontSize:          19,
    fontFamily:        fonts.body,
  },
  eyeBtn: { position: 'absolute', right: 16, top: 17 },

  strengthBar:  { height: 4, backgroundColor: '#ECECEE', borderRadius: 2, marginTop: spacing.sm - 2, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2 },

  infoBox:  { borderRadius: radius.md, padding: spacing.md - 2, borderWidth: 1, marginBottom: spacing.sm, marginTop: spacing.xs },
  infoText: { fontSize: 16, fontFamily: fonts.body, lineHeight: 24 },

  checkRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, marginTop: spacing.md },
  checkbox: {
    width: 24, height: 24, borderRadius: radius.sm - 2, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  checkLabel: { fontSize: 16, fontFamily: fonts.body, flex: 1 },

  error: {
    color:        '#C8102E',
    fontSize:     16,
    fontFamily:   fonts.body,
    textAlign:    'center',
    marginTop:    spacing.md - 4,
    marginBottom: spacing.xs,
  },

  btnRow: { flexDirection: 'row', gap: spacing.sm + 2, marginTop: spacing.lg },
  btnBack: {
    flex: 1, height: 56, borderWidth: 1.5, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnBackText:    { fontSize: 18, fontFamily: fonts.bodySemi },
  btnPrimary: {
    flex: 2, height: 56, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnPrimaryText: { color: '#fff', fontSize: 18, fontFamily: fonts.bodyBold },
  signinWrap:     { alignItems: 'center', marginTop: spacing.lg },
  signinText:     { fontSize: 17, fontFamily: fonts.body },
});
