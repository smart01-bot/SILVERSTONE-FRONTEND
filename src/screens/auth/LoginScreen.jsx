// src/screens/auth/LoginScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons }       from '@expo/vector-icons';
import { useAuth }        from '../../context/AuthContext';
import { useTheme }       from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';
import AnimatedInput      from '../../components/AnimatedInput';

export default function LoginScreen({ navigation, route }) {
  const { login } = useAuth();
  const { theme, isDark } = useTheme();

  const [email,   setEmail]   = useState('');
  const [password,setPassword]= useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

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
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Gradient logo header ── */}
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
            <Text style={s.headerHeading}>Welcome back.</Text>
            <Text style={s.headerSub}>Sign in to continue</Text>
          </LinearGradient>

          {/* ── Form ── */}
          <View style={s.form}>
            <AnimatedInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={s.passwordWrap}>
              <AnimatedInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPwd}
                autoCapitalize="none"
                inputStyle={{ paddingRight: 44 }}
              />
              <TouchableOpacity
                onPress={() => setShowPwd(v => !v)}
                style={s.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={22} color={theme.textDim} />
              </TouchableOpacity>
            </View>

            {error ? <Text style={s.error}>{error}</Text> : null}

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={[s.btn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>Sign In</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {}} style={s.forgotWrap}>
              <Text style={[s.forgot, { color: theme.primary }]}>Forgot password?</Text>
            </TouchableOpacity>

            <View style={s.dividerRow}>
              <View style={[s.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[s.dividerText, { color: theme.textDim }]}>or</Text>
              <View style={[s.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Step1Phone')} style={s.registerWrap}>
              <Text style={[s.registerText, { color: theme.textDim }]}>
                Don't have an account?{' '}
                <Text style={{ color: theme.primary, fontFamily: fonts.bodyBold }}>Register</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },

  headerBand: {
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.xl,
    paddingBottom:     spacing.xl + spacing.md,
    borderBottomLeftRadius:  radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  headerDecor: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -60,
  },
  logoRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginBottom: spacing.lg,
  },
  logoTile: {
    width: 32, height: 32, borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', padding: 5,
  },
  logoImg:        { width: '100%', height: '100%' },
  logoText:       { fontSize: 22, fontFamily: fonts.display, color: '#fff', letterSpacing: -0.4 },
  headerHeading:  { fontSize: 34, fontFamily: fonts.display, color: '#fff', letterSpacing: -0.6 },
  headerSub:      { fontSize: 18, fontFamily: fonts.body, color: 'rgba(255,255,255,0.75)', marginTop: spacing.xs },

  form: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },

  passwordWrap: { position: 'relative' },
  eyeBtn:       { position: 'absolute', right: spacing.md, bottom: 17 },

  error: {
    color: '#C8102E', fontSize: 16, fontFamily: fonts.body,
    marginTop: spacing.md - 4, textAlign: 'center',
  },

  btn: {
    height: 56, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.lg,
  },
  btnText:      { color: '#fff', fontSize: 19, fontFamily: fonts.bodyBold },
  forgotWrap:   { alignItems: 'center', marginTop: spacing.md },
  forgot:       { fontSize: 16, fontFamily: fonts.bodyMed },
  dividerRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 4, marginTop: spacing.lg, marginBottom: spacing.lg },
  dividerLine:  { flex: 1, height: 1 },
  dividerText:  { fontSize: 16, fontFamily: fonts.body },
  registerWrap: { alignItems: 'center' },
  registerText: { fontSize: 17, fontFamily: fonts.body },
});