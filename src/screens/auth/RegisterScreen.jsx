import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../../components/Logo';
import { validatePhone, validateTIN, validateNIDA } from '../../utils/validation';

const STEPS = 3;

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { theme }    = useTheme();

  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', confirmPwd: '',
    businessName: '', businessLocation: '', regNo: '',
    tin: '', nida: '',
  });

  const set = (k) => (v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (fieldErrors[k]) setFieldErrors(e => { const n = { ...e }; delete n[k]; return n; });
    setError('');
  };

  const validate = () => {
    const errs = {};
    if (step === 1) {
      if (!form.name.trim())        errs.name       = 'Full name is required.';
      const ph = validatePhone(form.phone);
      if (!ph.valid)                errs.phone      = ph.message;
      if (!form.email.trim())       errs.email      = 'Email is required.';
      if (!form.email.includes('@')) errs.email     = 'Enter a valid email address.';
      if (form.password.length < 6) errs.password   = 'Password must be at least 6 characters.';
      if (form.password !== form.confirmPwd) errs.confirmPwd = 'Passwords do not match.';
    }
    if (step === 2) {
      if (!form.businessName.trim())     errs.businessName     = 'Business name is required.';
      if (!form.businessLocation.trim()) errs.businessLocation = 'Business location is required.';
      if (!form.regNo.trim())            errs.regNo            = 'Registration number is required.';
    }
    if (step === 3) {
      const tin  = validateTIN(form.tin);
      const nida = validateNIDA(form.nida);
      if (!tin.valid)  errs.tin  = tin.message;
      if (!nida.valid) errs.nida = nida.message;
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = async () => {
    setError('');
    if (!validate()) return;
    if (step < STEPS) { setStep(s => s + 1); return; }
    setLoading(true);
    try {
      await register({
        name:             form.name.trim(),
        phone:            form.phone.trim(),
        email:            form.email.trim(),
        password:         form.password,
        businessName:     form.businessName.trim(),
        businessLocation: form.businessLocation.trim(),
        regNo:            form.regNo.trim(),
        tin:              form.tin.trim(),
        nida:             form.nida.trim(),
      });
      // AppNavigator detects new user → pending status → routes to PendingScreen
    } catch (e) {
      const msg = e.message?.replace('Firebase: ', '') ?? 'Registration failed.';
      if (msg.includes('email-already-in-use')) {
        setError('An account with this email already exists.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inp = (key) => [
    styles.input,
    { backgroundColor: theme.surfaceAlt, borderColor: fieldErrors[key] ? '#DC2626' : theme.border, color: theme.text },
  ];
  const fe = (k) => fieldErrors[k] ? <Text style={styles.fieldError}>{fieldErrors[k]}</Text> : null;
  const lbl = (txt) => <Text style={[styles.label, { color: theme.textDim }]}>{txt}</Text>;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 80 }]} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandGroup}>
              <Logo size={48} />
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.brand, { color: theme.primary }]}>Silverstone</Text>
                <Text style={[styles.tagline, { color: theme.textDim }]}>Tanzania's First Float Management System</Text>
              </View>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressRow}>
            {[1, 2, 3].map(i => (
              <View key={i} style={[styles.progressBar, { backgroundColor: i <= step ? theme.primary : theme.border }]} />
            ))}
          </View>

          <Text style={[styles.stepLabel, { color: theme.textDim }]}>
            {['Personal Details', 'Business Info', 'Identity Verification'][step - 1]} — Step {step} of {STEPS}
          </Text>

          {/* Step 1 — Personal */}
          {step === 1 && (
            <View style={styles.form}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Create Account</Text>
              {lbl('Full Name')}
              <TextInput style={inp('name')} value={form.name} onChangeText={set('name')}
                placeholder="e.g. Amina Juma" placeholderTextColor={theme.muted} />
              {fe('name')}
              {lbl('Phone Number')}
              <TextInput style={inp('phone')} value={form.phone} onChangeText={set('phone')}
                placeholder="e.g. 0754123456" placeholderTextColor={theme.muted} keyboardType="phone-pad" />
              {fe('phone')}
              {lbl('Email Address')}
              <TextInput style={inp('email')} value={form.email} onChangeText={set('email')}
                placeholder="you@example.com" placeholderTextColor={theme.muted}
                keyboardType="email-address" autoCapitalize="none" />
              {fe('email')}
              {lbl('Password')}
              <TextInput style={inp('password')} value={form.password} onChangeText={set('password')}
                placeholder="At least 6 characters" placeholderTextColor={theme.muted} secureTextEntry />
              {fe('password')}
              {lbl('Confirm Password')}
              <TextInput style={inp('confirmPwd')} value={form.confirmPwd} onChangeText={set('confirmPwd')}
                placeholder="Re-enter password" placeholderTextColor={theme.muted} secureTextEntry />
              {fe('confirmPwd')}
            </View>
          )}

          {/* Step 2 — Business */}
          {step === 2 && (
            <View style={styles.form}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Business Information</Text>
              {lbl('Business Name')}
              <TextInput style={inp('businessName')} value={form.businessName} onChangeText={set('businessName')}
                placeholder="e.g. Karibu Mobile Money" placeholderTextColor={theme.muted} />
              {fe('businessName')}
              {lbl('Business Location')}
              <TextInput style={inp('businessLocation')} value={form.businessLocation} onChangeText={set('businessLocation')}
                placeholder="e.g. Kariakoo, Dar es Salaam" placeholderTextColor={theme.muted} />
              {fe('businessLocation')}
              {lbl('Registration Number')}
              <TextInput style={inp('regNo')} value={form.regNo} onChangeText={set('regNo')}
                placeholder="e.g. 123456789" placeholderTextColor={theme.muted} keyboardType="numeric" />
              {fe('regNo')}
            </View>
          )}

          {/* Step 3 — Identity */}
          {step === 3 && (
            <View style={styles.form}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Identity Verification</Text>
              <View style={[styles.infoBox, { backgroundColor: theme.primaryLight, borderColor: theme.primary + '30' }]}>
                <Text style={[styles.infoText, { color: theme.textDim }]}>
                  Your information will be verified by a Silverstone admin before your account is activated. This typically takes 24–48 hours.
                </Text>
              </View>
              {lbl('TIN Number')}
              <TextInput style={inp('tin')} value={form.tin} onChangeText={set('tin')}
                placeholder="e.g. 100-123-456" placeholderTextColor={theme.muted} />
              {fe('tin')}
              {lbl('NIDA Number')}
              <TextInput style={inp('nida')} value={form.nida} onChangeText={set('nida')}
                placeholder="e.g. 19XXXXXXXXXXXXXXXXXX" placeholderTextColor={theme.muted}
                keyboardType="numeric" />
              {fe('nida')}
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Action buttons */}
          <View style={styles.btnRow}>
            {step > 1 && (
              <TouchableOpacity
                onPress={() => { setStep(s => s - 1); setError(''); setFieldErrors({}); }}
                style={[styles.btnBack, { borderColor: theme.border }]}
              >
                <Text style={{ color: theme.textDim, fontWeight: '600', fontSize: 15 }}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={next}
              disabled={loading}
              style={[styles.btnPrimary, { backgroundColor: theme.primary, flex: step > 1 ? 2 : 1, opacity: loading ? 0.7 : 1 }]}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnPrimaryText}>{step < STEPS ? 'Next' : 'Submit Application'}</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.signInLink}>
            <Text style={{ color: theme.textDim, fontSize: 14 }}>
              Already have an account?{'  '}
              <Text style={{ color: theme.primary, fontWeight: '600' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  scroll:      { padding: 24 },
  header:      { marginBottom: 24 },
  brandGroup:  { flexDirection: 'row', alignItems: 'center' },
  brand:       { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  tagline:     { fontSize: 11, marginTop: 2 },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  stepLabel:   { fontSize: 13, marginBottom: 20 },
  stepTitle:   { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  form:        { gap: 4, marginBottom: 8 },
  label:       { fontSize: 13, fontWeight: '500', marginTop: 10, marginBottom: 4 },
  input:       { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  fieldError:  { color: '#DC2626', fontSize: 12, marginTop: 3 },
  infoBox:     { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 8 },
  infoText:    { fontSize: 13, lineHeight: 20 },
  error:       { color: '#DC2626', fontSize: 13, textAlign: 'center', marginVertical: 8 },
  btnRow:      { flexDirection: 'row', gap: 10, marginTop: 20 },
  btnBack:     { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnPrimary:  { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  signInLink:  { marginTop: 20, alignItems: 'center' },
});
