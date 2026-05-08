import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const { login, resetPassword } = useAuth();
  const { theme } = useTheme();

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [resetMsg,    setResetMsg]    = useState('');

  const handleLogin = async () => {
    setError(''); setResetMsg('');
    if (!email.trim())    { setError('Email is required.'); return; }
    if (!password.trim()) { setError('Password is required.'); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
      // AppNavigator handles routing via onAuthStateChanged
    } catch (e) {
      const msg = e.message?.replace('Firebase: ', '') ?? 'Sign in failed.';
      if (msg.includes('invalid-credential') || msg.includes('INVALID_LOGIN_CREDENTIALS') || msg.includes('wrong-password')) {
        setError('Incorrect email or password.');
      } else if (msg.includes('user-not-found')) {
        setError('No account found with this email.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(''); setResetMsg('');
    if (!email.trim()) { setError('Enter your email address above first.'); return; }
    try {
      await resetPassword(email.trim());
      setResetMsg('Password reset email sent. Check your inbox.');
    } catch (e) {
      setError(e.message?.replace('Firebase: ', '') ?? 'Could not send reset email.');
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.inner, { paddingBottom: 80 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo + branding */}
          <View style={styles.brand}>
            <Image
              source={require('../../assets/images/SilverS.png')}
              style={{ width: 80, height: 80, resizeMode: 'contain' }}
            />
            <Text style={[styles.appName, { color: theme.primary }]}>Silverstone</Text>
            <Text style={[styles.tagline, { color: theme.textDim }]}>
              Tanzania's First Float Management System
            </Text>
          </View>

          {/* Form */}
          <Text style={[styles.heading, { color: theme.text }]}>Sign In</Text>

          <View style={styles.fields}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
              placeholder="Email address"
              placeholderTextColor={theme.muted}
              value={email}
              onChangeText={v => { setEmail(v); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <View style={styles.pwdWrap}>
              <TextInput
                style={[styles.input, styles.pwdInput, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
                placeholder="Password"
                placeholderTextColor={theme.muted}
                value={password}
                onChangeText={v => { setPassword(v); setError(''); }}
                secureTextEntry={!showPwd}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPwd(v => !v)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textDim} />
              </TouchableOpacity>
            </View>
          </View>

          {error    ? <Text style={styles.error}>{error}</Text>   : null}
          {resetMsg ? <Text style={styles.success}>{resetMsg}</Text> : null}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={[styles.btn, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleForgotPassword} style={styles.linkBtn}>
            <Text style={{ color: theme.textDim, fontSize: 13 }}>
              Forgot password?{'  '}
              <Text style={{ color: theme.primary, fontWeight: '600' }}>Reset it</Text>
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.muted }]}>or</Text>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkBtn}>
            <Text style={{ color: theme.textDim, fontSize: 14 }}>
              Don't have an account?{'  '}
              <Text style={{ color: theme.primary, fontWeight: '600' }}>Register</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  inner:   { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  brand:   { alignItems: 'center', gap: 8, marginBottom: 8 },
  appName: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { fontSize: 13, textAlign: 'center' },
  heading: { fontSize: 22, fontWeight: '700', alignSelf: 'flex-start' },
  fields:  { width: '100%', gap: 12 },
  input:   {
    width: '100%', borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15,
  },
  pwdWrap:  { position: 'relative', width: '100%' },
  pwdInput: { paddingRight: 48 },
  eyeBtn:   { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  error:    { color: '#DC2626', fontSize: 13, textAlign: 'center', alignSelf: 'stretch' },
  success:  { color: '#16A34A', fontSize: 13, textAlign: 'center', alignSelf: 'stretch' },
  btn:      { width: '100%', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  btnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  linkBtn:  { marginTop: 4 },
  divider:  { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 10, marginVertical: 4 },
  line:     { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
});
