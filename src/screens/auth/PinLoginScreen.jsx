import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import PinPad from '../../components/PinPad';
import Logo from '../../components/Logo';

export default function PinLoginScreen({ navigation }) {
  const { user, profile, verifyPin, logout } = useAuth();
  const { theme, isDark, toggleTheme, lang, setLang, tr } = useTheme();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [emailMode, setEmailMode] = useState(!user);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [bioAvailable, setBioAvailable] = useState(false);
  const { login } = useAuth();

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
        // Biometric passed — treat as PIN success (AppNavigator handles routing)
      } else if (result.error !== 'user_cancel' && result.error !== 'system_cancel') {
        setError('Biometric failed. Use your PIN instead.');
      }
    } catch {
      setError('Biometric unavailable. Use your PIN instead.');
    }
  };

  // If no Firebase user — show email login
  const handleEmailLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // onAuthStateChanged will handle navigation via AppNavigator
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
      return;
    }
    // Pin OK — navigation handled by AppNavigator watching auth state
  };

  // Show avatar greeting if we have a logged-in user waiting for PIN
  const firstName = profile?.name?.split(' ')[0] ?? 'Agent';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.inner}>

        {/* Header */}
        <View style={styles.topRow}>
          <View style={styles.brandGroup}>
            <Logo size={60} />
            <View style={{ marginLeft: 12 }}>
              <Image
                source={require('../../../assets/silverS.png')}
                style={{ width: 60, height: 60, borderRadius: 12, marginBottom: 8 }}
                resizeMode="contain"
              />
              <Text style={[styles.brand, { color: theme.primary }]}>Silverstone</Text>
              <Text style={[styles.tagline, { color: theme.textDim }]}>{tr('tagline')}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
            <Text style={{ fontSize: 18 }}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>

        {user && profile ? (
          // PIN mode
          <>
            <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.avatarText, { color: theme.primary }]}>{firstName[0]}</Text>
            </View>
            <Text style={[styles.greeting, { color: theme.text }]}>Welcome back, {firstName}</Text>
            <Text style={[styles.sub, { color: theme.textDim }]}>{tr('enterPin')}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PinPad length={6} onComplete={handlePin} onBiometric={bioAvailable ? handleBiometric : undefined} />
            <TouchableOpacity onPress={async () => { await logout(); setEmailMode(true); }} style={{ marginTop: 16 }}>
              <Text style={{ color: theme.textDim, fontSize: 14 }}>Not {firstName}?  <Text style={{ color: theme.primary, fontWeight: '600' }}>Switch account</Text></Text>
            </TouchableOpacity>
          </>
        ) : (
          // Email + password mode
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
            <TouchableOpacity onPress={handleEmailLogin} disabled={loading}
              style={[styles.btn, { backgroundColor: theme.primary }]}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{tr('signIn')}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('CreateAccount')} style={{ marginTop: 8 }}>
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
            <TouchableOpacity key={code} onPress={() => setLang(code)}
              style={[styles.langBtn, { backgroundColor: lang === code ? theme.primary : 'transparent', borderColor: theme.border }]}>
              <Text style={{ color: lang === code ? '#fff' : theme.textDim, fontSize: 12, fontWeight: '700' }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  inner:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20 },
  topRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 },
  brandGroup: { flexDirection: 'row', alignItems: 'center' },
  brand:      { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  tagline:    { fontSize: 11, marginTop: 2 },
  themeBtn:{ borderWidth: 1, borderRadius: 20, padding: 8 },
  avatar:  { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '700' },
  greeting:{ fontSize: 22, fontWeight: '700', textAlign: 'center' },
  sub:     { fontSize: 14, textAlign: 'center' },
  error:   { color: '#DC2626', fontSize: 14, textAlign: 'center' },
  inp:     { width: '100%', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  btn:     { width: '100%', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  langRow: { flexDirection: 'row', gap: 6 },
  langBtn: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
});