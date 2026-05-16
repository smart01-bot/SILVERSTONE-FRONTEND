// src/screens/auth/LoginScreen.jsx
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

export default function LoginScreen({ navigation, route }) {
  const { login } = useAuth();
  const { theme, isDark } = useTheme();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(
        e.message
          ?.replace('Firebase: ', '')
          ?.replace('(auth/invalid-credential).', 'Incorrect email or password.')
          ?.replace('(auth/user-not-found).', 'No account found with that email.')
          ?.replace('(auth/wrong-password).', 'Incorrect password.')
          ?? 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

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

          <View style={s.headingWrap}>
            <Text style={[s.heading, { color: theme.text }]}>Welcome back.</Text>
            <Text style={[s.sub,     { color: theme.textDim }]}>Sign in to continue</Text>
          </View>

          <View style={s.fieldWrap}>
            <Text style={[s.label, { color: theme.textDim }]}>Email</Text>
            <TextInput
              style={[s.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={theme.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={s.fieldWrap}>
            <Text style={[s.label, { color: theme.textDim }]}>Password</Text>
            <View>
              <TextInput
                style={[s.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text, paddingRight: 52 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={theme.muted}
                secureTextEntry={!showPwd}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPwd(v => !v)}
                style={s.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={22} color={theme.textDim} />
              </TouchableOpacity>
            </View>
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={[s.btn, { backgroundColor: theme.primary }]}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {}} style={s.forgotWrap}>
            <Text style={[s.forgot, { color: theme.primary }]}>Forgot password?</Text>
          </TouchableOpacity>

          <View style={s.dividerRow}>
            <View style={[s.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[s.dividerText, { color: theme.textDim }]}>or</Text>
            <View style={[s.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={s.registerWrap}>
            <Text style={[s.registerText, { color: theme.textDim }]}>
              Don't have an account?{' '}
              <Text style={{ color: theme.primary, fontFamily: fonts.bodyBold }}>Register</Text>
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
    marginBottom:   spacing.xl + spacing.sm,
    marginTop:      spacing.md,
  },
  logoTile: {
    width:           36,
    height:          36,
    borderRadius:    radius.sm + 1,
    backgroundColor: '#C8102E',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         spacing.sm - 2,
  },
  logoImg:  { width: '100%', height: '100%' },
  logoText: { fontSize: 24, fontFamily: fonts.display, letterSpacing: -0.5 },

  headingWrap: { marginBottom: spacing.xl },
  heading:     { fontSize: 34, fontFamily: fonts.display, letterSpacing: -0.6 },
  sub:         { fontSize: 18, fontFamily: fonts.body, marginTop: spacing.sm - 2 },

  fieldWrap:   { marginBottom: spacing.md },
  label:       { fontSize: 16, fontFamily: fonts.bodyMed, marginBottom: spacing.sm - 2 },
  input: {
    height:            56,
    borderWidth:       1.5,
    borderRadius:      radius.md,
    paddingHorizontal: spacing.md,
    fontSize:          19,
    fontFamily:        fonts.body,
  },
  eyeBtn: { position: 'absolute', right: 16, top: 17 },

  error: {
    color:        '#C8102E',
    fontSize:     16,
    fontFamily:   fonts.body,
    marginBottom: spacing.md - 4,
    textAlign:    'center',
  },

  btn: {
    height:         56,
    borderRadius:   radius.md,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      spacing.sm,
  },
  btnText: { color: '#fff', fontSize: 19, fontFamily: fonts.bodyBold },

  forgotWrap:    { alignItems: 'center', marginTop: spacing.md },
  forgot:        { fontSize: 16, fontFamily: fonts.bodyMed },
  dividerRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 4, marginTop: spacing.lg, marginBottom: spacing.lg },
  dividerLine:   { flex: 1, height: 1 },
  dividerText:   { fontSize: 16, fontFamily: fonts.body },
  registerWrap:  { alignItems: 'center' },
  registerText:  { fontSize: 17, fontFamily: fonts.body },
});
