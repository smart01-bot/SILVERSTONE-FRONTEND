import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import PinPad from '../../components/PinPad';
import Logo from '../../components/Logo';

export default function PinLoginScreen({ navigation }) {
  const { user, profile, verifyPin, logout, login, markSessionUnlocked } = useAuth();
  const { theme, lang, setLang, tr } = useTheme();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [bioAvailable, setBioAvailable] = useState(false);

  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled  = await LocalAuthentication.isEnrolledAsync();
      setBioAvailable(hasHardware && isEnrolled);
    })();
  }, []);

  const handleBiometric = async () => {
    setError('');
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to Silverstone',
        fallbackLabel: 'Use PIN instead',
        cancelLabel:   'Cancel',
      });
      if (result.success) {
        markSessionUnlocked(); // biometric = session unlocked
      } else if (result.error !== 'user_cancel' && result.error !== 'system_cancel') {
        setError('Biometric failed. Use your PIN instead.');
      }
    } catch {
      setError('Biometric unavailable. Use your PIN instead.');
    }
  };

  const handleEmailLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // AppNavigator handles routing via onAuthStateChanged
    } catch (e) {
      setError(e.message?.replace('Firebase: ', '') ?? tr('error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePin = async (pin) => {
    setError('');
    const ok = await verifyPin(pin);
    if (!ok) {
      setError('Incorrect PIN. Try again.');
    }
    // Correct PIN — AppNavigator re-routes automatically
  };

  const handleForgotPin = () => {
    navigation.navigate('ForgotPin');
  };

  const firstName = profile?.name?.split(' ')[0] ?? 'Agent';

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.safe, { backgroundColor: theme.bg }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.inner, { paddingBottom: 60 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.topRow}>
            <View style={styles.brandGroup}>
              <Logo size={60} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.brand, { color: theme.primary }]}>Silverstone</Text>
                <Text style={[styles.tagline, { color: theme.textDim }]}>{tr('tagline')}</Text>
              </View>
            </View>
          </View>

          {user && profile ? (
            // PIN mode — returning user
            <>
              <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
                <Text style={[styles.avatarText, { color: theme.primary }]}>{firstName[0]}</Text>
              </View>
              <Text style={[styles.greeting, { color: theme.text }]}>Welcome back, {firstName}</Text>
              <Text style={[styles.sub, { color: theme.textDim }]}>{tr('enterPin')}</Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PinPad
                length={6}
                onComplete={handlePin}
                onBiometric={bioAvailable ? handleBiometric : undefined}
              />
              <TouchableOpacity
                onPress={async () => { await logout(); }}
                style={{ marginTop: 16 }}
              >
                <Text style={{ color: theme.textDim, fontSize: 14 }}>
                  Not {firstName}?{'  '}
                  <Text style={{ color: theme.primary, fontWeight: '600' }}>Switch account</Text>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleForgotPin} style={{ marginTop: 4 }}>
                <Text style={{ color: theme.textDim, fontSize: 13 }}>
                  Forgot PIN?{' '}
                  <Text style={{ color: theme.primary }}>Reset PIN</Text>
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            // Email + password mode — new / logged-out user
            <>
              <Text style={[styles.greeting, { color: theme.text }]}>{tr('signIn')}</Text>
              <View style={{ width: '100%', gap: 10 }}>
                <TextInput
                  style={[styles.inp, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
                  placeholder={tr('email')}
                  placeholderTextColor={theme.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={[styles.inp, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
                  placeholder={tr('password')}
                  placeholderTextColor={theme.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <TouchableOpacity
                onPress={handleEmailLogin}
                disabled={loading}
                style={[styles.btn, { backgroundColor: theme.primary }]}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>{tr('signIn')}</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('CreateAccount')}
                style={{ marginTop: 8 }}
              >
                <Text style={{ color: theme.textDim, fontSize: 14 }}>
                  {tr('noAccount')}{' '}
                  <Text style={{ color: theme.primary, fontWeight: '600' }}>{tr('createAccount')}</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Lang toggle */}
          <View style={styles.langRow}>
            {[['en', 'EN'], ['sw', 'SW']].map(([code, label]) => (
              <TouchableOpacity
                key={code}
                onPress={() => setLang(code)}
                style={[
                  styles.langBtn,
                  { backgroundColor: lang === code ? theme.primary : 'transparent', borderColor: theme.border },
                ]}
              >
                <Text style={{ color: lang === code ? '#fff' : theme.textDim, fontSize: 12, fontWeight: '700' }}>
                  {label}
                </Text>
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
  inner:      { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20 },
  topRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 },
  brandGroup: { flexDirection: 'row', alignItems: 'center' },
  brand:      { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  tagline:    { fontSize: 11, marginTop: 2 },
  avatar:     { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '700' },
  greeting:   { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  sub:        { fontSize: 14, textAlign: 'center' },
  error:      { color: '#DC2626', fontSize: 14, textAlign: 'center' },
  inp:        { width: '100%', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  btn:        { width: '100%', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnText:    { color: '#fff', fontWeight: '700', fontSize: 15 },
  langRow:    { flexDirection: 'row', gap: 6 },
  langBtn:    { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
});
