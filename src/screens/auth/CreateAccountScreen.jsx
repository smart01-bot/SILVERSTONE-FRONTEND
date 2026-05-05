import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { typography } from '../../constants/theme';
import Logo from '../../components/Logo';
import { validatePhone, validateTIN, validateNIDA } from '../../utils/validation';

const STEPS = 3;

export default function CreateAccountScreen({ navigation }) {
  const { register } = useAuth();
  const { theme, isDark, toggleTheme, lang, setLang, tr } = useTheme();

  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', confirmPwd: '',
    businessName: '', businessLocation: '', regNo: '',
    tin: '', nida: '',
  });

  const set = (k) => (v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (fieldErrors[k]) setFieldErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const validate = () => {
    const errs = {};
    if (step === 1) {
      if (!form.name.trim())        errs.name = 'Full name is required.';
      const ph = validatePhone(form.phone);
      if (!ph.valid)                errs.phone = ph.message;
      if (!form.email.trim())       errs.email = 'Email is required.';
      if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
      if (form.password !== form.confirmPwd) errs.confirmPwd = 'Passwords do not match.';
    }
    if (step === 2) {
      if (!form.businessName.trim())     errs.businessName = 'Business name is required.';
      if (!form.businessLocation.trim()) errs.businessLocation = 'Business location is required.';
      if (!form.regNo.trim())            errs.regNo = 'Registration number is required.';
    }
    if (step === 3) {
      const tin = validateTIN(form.tin);
      if (!tin.valid)  errs.tin = tin.message;
      const nida = validateNIDA(form.nida);
      if (!nida.valid) errs.nida = nida.message;
    }
    setFieldErrors(errs);
    return Object.keys(errs).length > 0 ? Object.values(errs)[0] : null;
  };

  const next = async () => {
    setError('');
    const err = validate();
    if (err) return;
    if (step < STEPS) { setStep(s => s + 1); setFieldErrors({}); return; }
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
    } catch (e) {
      setError(e.message?.replace('Firebase: ', '') ?? tr('error'));
    } finally {
      setLoading(false);
    }
  };

  const inp = (key) => [
    styles.input,
    {
      backgroundColor: theme.surfaceAlt,
      borderColor: fieldErrors[key] ? '#DC2626' : theme.border,
      color: theme.text,
    },
  ];
  const lbl = [styles.label, { color: theme.textDim }];
  const fe = (k) => fieldErrors[k] ? <Text style={styles.fieldError}>{fieldErrors[k]}</Text> : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandGroup}>
              <Logo size={60} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.brand, { color: theme.primary }]}>Silverstone</Text>
                <Text style={[styles.tagline, { color: theme.textDim }]}>{tr('tagline')}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
              <Text style={{ color: theme.textDim, fontSize: 18 }}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>

          {/* Step indicator */}
          <View style={styles.stepRow}>
            {[1,2,3].map(i => (
              <View key={i} style={[styles.stepDot, { backgroundColor: i <= step ? theme.primary : theme.border }]} />
            ))}
          </View>
          <Text style={[styles.stepLabel, { color: theme.textDim }]}>
            {tr(['step1Title','step2Title','step3Title'][step-1])} ({step}/{STEPS})
          </Text>

          {/* Step 1 — Personal */}
          {step === 1 && (
            <View style={styles.form}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>{tr('createAccount')}</Text>
              <Text style={lbl}>{tr('fullName')}</Text>
              <TextInput style={inp('name')} value={form.name} onChangeText={set('name')}
                placeholder="e.g. Amina Juma" placeholderTextColor={theme.muted} />
              {fe('name')}
              <Text style={lbl}>{tr('phone')}</Text>
              <TextInput style={inp('phone')} value={form.phone} onChangeText={set('phone')}
                placeholder="e.g. 0754123456" placeholderTextColor={theme.muted} keyboardType="phone-pad" />
              {fe('phone')}
              <Text style={lbl}>{tr('email')}</Text>
              <TextInput style={inp('email')} value={form.email} onChangeText={set('email')}
                placeholder="you@example.com" placeholderTextColor={theme.muted}
                keyboardType="email-address" autoCapitalize="none" />
              {fe('email')}
              <Text style={lbl}>{tr('password')}</Text>
              <TextInput style={inp('password')} value={form.password} onChangeText={set('password')}
                placeholder="••••••••" placeholderTextColor={theme.muted} secureTextEntry />
              {fe('password')}
              <Text style={lbl}>{tr('confirmPwd')}</Text>
              <TextInput style={inp('confirmPwd')} value={form.confirmPwd} onChangeText={set('confirmPwd')}
                placeholder="••••••••" placeholderTextColor={theme.muted} secureTextEntry />
              {fe('confirmPwd')}
            </View>
          )}

          {/* Step 2 — Business */}
          {step === 2 && (
            <View style={styles.form}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>{tr('step2Title')}</Text>
              <Text style={lbl}>{tr('businessName')}</Text>
              <TextInput style={inp('businessName')} value={form.businessName} onChangeText={set('businessName')}
                placeholder="e.g. Karibu Mobile Money" placeholderTextColor={theme.muted} />
              {fe('businessName')}
              <Text style={lbl}>{tr('businessLoc')}</Text>
              <TextInput style={inp('businessLocation')} value={form.businessLocation} onChangeText={set('businessLocation')}
                placeholder="e.g. Kariakoo, Dar es Salaam" placeholderTextColor={theme.muted} />
              {fe('businessLocation')}
              <Text style={lbl}>{tr('regNo')}</Text>
              <TextInput style={inp('regNo')} value={form.regNo} onChangeText={set('regNo')}
                placeholder="e.g. 123456789" placeholderTextColor={theme.muted} keyboardType="numeric" />
              {fe('regNo')}
            </View>
          )}

          {/* Step 3 — Identity */}
          {step === 3 && (
            <View style={styles.form}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>{tr('step3Title')}</Text>
              <View style={[styles.infoBox, { backgroundColor: theme.primaryLight, borderColor: theme.primary + '30' }]}>
                <Text style={[styles.infoText, { color: theme.textDim }]}>
                  Your information will be verified by the Silverstone admin before activation. This typically takes 24–48 hours.
                </Text>
              </View>
              <Text style={lbl}>{tr('tin')}</Text>
              <TextInput style={inp('tin')} value={form.tin} onChangeText={set('tin')}
                placeholder="e.g. 100-123-456" placeholderTextColor={theme.muted} />
              {fe('tin')}
              <Text style={lbl}>{tr('nida')}</Text>
              <TextInput style={inp('nida')} value={form.nida} onChangeText={set('nida')}
                placeholder="e.g. 19XXXXXXXXXXXXXXXXXX" placeholderTextColor={theme.muted}
                keyboardType="numeric" />
              {fe('nida')}
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Buttons */}
          <View style={styles.btnRow}>
            {step > 1 && (
              <TouchableOpacity
                onPress={() => { setStep(s => s - 1); setError(''); setFieldErrors({}); }}
                style={[styles.btnBack, { borderColor: theme.border }]}>
                <Text style={{ color: theme.textDim, fontWeight: '600', fontSize: 15 }}>{tr('back')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={next} disabled={loading}
              style={[styles.btnPrimary, { backgroundColor: theme.primary, flex: step > 1 ? 2 : 1 }]}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnPrimaryText}>{step < STEPS ? tr('next') : tr('submit')}</Text>
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('PinLogin')} style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: theme.textDim, fontSize: 14 }}>
              {tr('alreadyHave')}{' '}
              <Text style={{ color: theme.primary, fontWeight: '600' }}>{tr('signIn')}</Text>
            </Text>
          </TouchableOpacity>

          {/* Lang toggle */}
          <View style={styles.langRow}>
            {[['en', 'EN'], ['sw', 'SW']].map(([code, label]) => (
              <TouchableOpacity key={code} onPress={() => setLang(code)}
                style={[styles.langBtn, { backgroundColor: lang === code ? theme.primary : 'transparent', borderColor: theme.border }]}>
                <Text style={{ color: lang === code ? '#fff' : theme.textDim, fontSize: 12, fontWeight: '700' }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  scroll:     { padding: 24, paddingBottom: 48 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  brandGroup: { flexDirection: 'row', alignItems: 'center' },
  brand:      { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  tagline:    { fontSize: 12, marginTop: 2 },
  themeBtn:   { borderWidth: 1, borderRadius: 20, padding: 8 },
  stepRow:    { flexDirection: 'row', gap: 6, marginBottom: 8 },
  stepDot:    { flex: 1, height: 4, borderRadius: 2 },
  stepLabel:  { fontSize: 13, marginBottom: 20 },
  stepTitle:  { ...typography.h2, marginBottom: 20 },
  form:       { gap: 4, marginBottom: 8 },
  label:      { fontSize: 13, fontWeight: '500', marginBottom: 4, marginTop: 10 },
  input:      {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15,
  },
  fieldError: { color: '#DC2626', fontSize: 12, marginTop: 3 },
  infoBox:    { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 8 },
  infoText:   { fontSize: 13, lineHeight: 20 },
  error:      { color: '#DC2626', fontSize: 13, textAlign: 'center', marginVertical: 8 },
  btnRow:     { flexDirection: 'row', gap: 10, marginTop: 20 },
  btnBack:    {
    flex: 1, borderWidth: 1.5, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
  },
  btnPrimary: {
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  langRow:    { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 24 },
  langBtn:    { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
});
