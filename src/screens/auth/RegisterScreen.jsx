// src/screens/auth/RegisterScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const STEPS = 3;

const STEP_LABELS = ['Personal', 'Business', 'Identity'];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { theme, isDark } = useTheme();

  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [agreed,  setAgreed]  = useState(false);

  const [form, setForm] = useState({
    name:             '',
    phone:            '',
    password:         '',
    confirmPassword:  '',
    businessName:     '',
    businessLocation: '',
    businessRegNo:    '',
    tin:              '',
    nida:             '',
  });

  const [showPwd,  setShowPwd]  = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    if (step === 1) {
      if (!form.name.trim())
        return 'Full name is required.';
      if (form.name.trim().split(' ').length < 2)
        return 'Please enter your full name.';
      if (!form.phone.trim())
        return 'Phone number is required.';
      if (!/^(07|06|\+2557|\+2556)\d{8}$/.test(form.phone.replace(/\s/g, '')))
        return 'Enter a valid Tanzanian phone number.';
      if (form.password.length < 6)
        return 'Password must be at least 6 characters.';
      if (form.password !== form.confirmPassword)
        return 'Passwords do not match.';
    }
    if (step === 2) {
      if (!form.businessName.trim())
        return 'Business name is required.';
      if (!form.businessLocation.trim())
        return 'Business location is required.';
      if (!form.businessRegNo.trim())
        return 'Registration number is required.';
    }
    if (step === 3) {
      if (!form.tin.trim())
        return 'TIN is required.';
      if (!form.nida.trim())
        return 'NIDA is required.';
      if (!agreed)
        return 'You must agree to the Terms of Service.';
    }
    return null;
  };

  const handleNext = async () => {
    setError('');
    const err = validate();
    if (err) { setError(err); return; }

    if (step < STEPS) {
      setStep(s => s + 1);
      return;
    }

    // Submit
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
      // AppNavigator detects pending status and shows PendingScreen
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

  const inp = [styles.input, {
    backgroundColor: theme.surfaceAlt,
    borderColor:     theme.border,
    color:           theme.text,
  }];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo row */}
          <View style={styles.logoRow}>
            <View style={styles.logoTile}>
              <Image
                source={require('../../../assets/images/SilverS.png')}
                style={styles.logoImg}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.logoText, { color: theme.text }]}>
              silverstone
            </Text>
          </View>

          {/* Step bar */}
          <View style={styles.stepBar}>
            {STEP_LABELS.map((label, i) => (
              <View key={label} style={styles.stepItem}>
                <View style={[
                  styles.stepLine,
                  { backgroundColor: step >= i + 1 ? theme.primary : theme.border },
                ]} />
                <Text style={[
                  styles.stepLabel,
                  { color: step === i + 1 ? theme.primary : theme.textDim },
                ]}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {/* Step 1 — Personal */}
          {step === 1 && (
            <View style={styles.form}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>
                Personal Details
              </Text>

              <Text style={[styles.label, { color: theme.textDim }]}>Full Name</Text>
              <TextInput
                style={inp}
                value={form.name}
                onChangeText={set('name')}
                placeholder="e.g. Juma Hassan"
                placeholderTextColor={theme.muted}
              />

              <Text style={[styles.label, { color: theme.textDim }]}>Phone Number</Text>
              <TextInput
                style={inp}
                value={form.phone}
                onChangeText={set('phone')}
                placeholder="07XX XXX XXX"
                placeholderTextColor={theme.muted}
                keyboardType="phone-pad"
              />

              <Text style={[styles.label, { color: theme.textDim }]}>Password</Text>
              <View>
                <TextInput
                  style={[inp, { paddingRight: 48 }]}
                  value={form.password}
                  onChangeText={set('password')}
                  placeholder="Min 6 characters"
                  placeholderTextColor={theme.muted}
                  secureTextEntry={!showPwd}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPwd(v => !v)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.textDim}
                  />
                </TouchableOpacity>
              </View>

              {/* Password strength */}
              {form.password.length > 0 && (
                <View style={styles.strengthBar}>
                  <View style={[
                    styles.strengthFill,
                    {
                      width: form.password.length < 6
                        ? '33%'
                        : form.password.length < 8
                          ? '66%'
                          : '100%',
                      backgroundColor: form.password.length < 6
                        ? '#C8102E'
                        : form.password.length < 8
                          ? '#F59E0B'
                          : '#16A34A',
                    },
                  ]} />
                </View>
              )}

              <Text style={[styles.label, { color: theme.textDim }]}>
                Confirm Password
              </Text>
              <View>
                <TextInput
                  style={[inp, { paddingRight: 48 }]}
                  value={form.confirmPassword}
                  onChangeText={set('confirmPassword')}
                  placeholder="Repeat password"
                  placeholderTextColor={theme.muted}
                  secureTextEntry={!showCPwd}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowCPwd(v => !v)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showCPwd ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.textDim}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 2 — Business */}
          {step === 2 && (
            <View style={styles.form}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>
                Business Details
              </Text>

              <Text style={[styles.label, { color: theme.textDim }]}>Business Name</Text>
              <TextInput
                style={inp}
                value={form.businessName}
                onChangeText={set('businessName')}
                placeholder="e.g. Hassan Mobile Money"
                placeholderTextColor={theme.muted}
              />

              <Text style={[styles.label, { color: theme.textDim }]}>Business Location</Text>
              <TextInput
                style={inp}
                value={form.businessLocation}
                onChangeText={set('businessLocation')}
                placeholder="e.g. Kariakoo, Dar es Salaam"
                placeholderTextColor={theme.muted}
              />

              <Text style={[styles.label, { color: theme.textDim }]}>
                Registration Number
              </Text>
              <TextInput
                style={inp}
                value={form.businessRegNo}
                onChangeText={set('businessRegNo')}
                placeholder="e.g. BR-2024-XXXXX"
                placeholderTextColor={theme.muted}
              />
            </View>
          )}

          {/* Step 3 — Identity */}
          {step === 3 && (
            <View style={styles.form}>
              <Text style={[styles.stepTitle, { color: theme.text }]}>
                Identity Verification
              </Text>

              <View style={[styles.infoBox, {
                backgroundColor: theme.primaryLight,
                borderColor:     theme.primary + '30',
              }]}>
                <Text style={[styles.infoText, { color: theme.textDim }]}>
                  Your information will be verified by the Silverstone admin before your account is activated. This typically takes 24–48 hours.
                </Text>
              </View>

              <Text style={[styles.label, { color: theme.textDim }]}>TIN Number</Text>
              <TextInput
                style={inp}
                value={form.tin}
                onChangeText={set('tin')}
                placeholder="e.g. 100-XXX-XXX"
                placeholderTextColor={theme.muted}
              />

              <Text style={[styles.label, { color: theme.textDim }]}>NIDA Number</Text>
              <TextInput
                style={inp}
                value={form.nida}
                onChangeText={set('nida')}
                placeholder="20-digit ID number"
                placeholderTextColor={theme.muted}
                keyboardType="numeric"
              />

              {/* Terms checkbox */}
              <TouchableOpacity
                onPress={() => setAgreed(v => !v)}
                style={styles.checkRow}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  {
                    backgroundColor: agreed ? theme.primary : 'transparent',
                    borderColor:     agreed ? theme.primary : theme.border,
                  },
                ]}>
                  {agreed && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <Text style={[styles.checkLabel, { color: theme.textDim }]}>
                  I agree to the{' '}
                  <Text style={{ color: theme.primary, fontWeight: '600' }}>
                    Terms of Service
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error */}
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          {/* Buttons */}
          <View style={styles.btnRow}>
            {step > 1 && (
              <TouchableOpacity
                onPress={() => { setStep(s => s - 1); setError(''); }}
                style={[styles.btnBack, { borderColor: theme.border }]}
                activeOpacity={0.75}
              >
                <Text style={[styles.btnBackText, { color: theme.textDim }]}>
                  Back
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleNext}
              disabled={loading}
              style={[styles.btnPrimary, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnPrimaryText}>
                    {step < STEPS ? 'Next' : 'Submit Application'}
                  </Text>
              }
            </TouchableOpacity>
          </View>

          {/* Sign in link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.signinWrap}
          >
            <Text style={[styles.signinText, { color: theme.textDim }]}>
              Already registered?{' '}
              <Text style={{ color: theme.primary, fontWeight: '700' }}>
                Sign in
              </Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 48 },
  logoRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            10,
    marginBottom:   24,
    marginTop:      8,
  },
  logoTile: {
    width:           32,
    height:          32,
    borderRadius:    9,
    backgroundColor: '#C8102E',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         6,
  },
  logoImg:  { width: '100%', height: '100%' },
  logoText: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  stepBar: {
    flexDirection: 'row',
    gap:           6,
    marginBottom:  24,
  },
  stepItem: { flex: 1 },
  stepLine: { height: 4, borderRadius: 2, marginBottom: 4 },
  stepLabel:{ fontSize: 11, fontWeight: '600' },
  stepTitle:{
    fontSize:      18,
    fontWeight:    '700',
    marginBottom:  20,
    letterSpacing: -0.3,
  },
  form:  { gap: 4 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 6, marginTop: 12 },
  input: {
    height:            52,
    borderWidth:       1.5,
    borderRadius:      12,
    paddingHorizontal: 16,
    fontSize:          15,
  },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },
  strengthBar: {
    height:          4,
    backgroundColor: '#ECECEE',
    borderRadius:    2,
    marginTop:       6,
    overflow:        'hidden',
  },
  strengthFill: { height: '100%', borderRadius: 2 },
  infoBox: {
    borderRadius:  12,
    padding:       14,
    borderWidth:   1,
    marginBottom:  8,
    marginTop:     4,
  },
  infoText: { fontSize: 13, lineHeight: 20 },
  checkRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    marginTop:     16,
  },
  checkbox: {
    width:          20,
    height:         20,
    borderRadius:   6,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
  },
  checkLabel: { fontSize: 13, flex: 1 },
  error: {
    color:        '#C8102E',
    fontSize:     13,
    textAlign:    'center',
    marginTop:    12,
    marginBottom: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap:           10,
    marginTop:     20,
  },
  btnBack: {
    flex:           1,
    height:         52,
    borderWidth:    1.5,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
  },
  btnBackText:    { fontSize: 15, fontWeight: '600' },
  btnPrimary: {
    flex:           2,
    height:         52,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  signinWrap:     { alignItems: 'center', marginTop: 20 },
  signinText:     { fontSize: 14 },
});