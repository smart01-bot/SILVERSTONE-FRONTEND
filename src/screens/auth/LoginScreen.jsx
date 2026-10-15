import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { AuthFrame, AuthHeading, AuthField, AuthButton, AuthLink, AuthNotice, useAuthStyle } from '../../components/auth/AuthUI';

export default function LoginScreen({ navigation, route }) {
  const { login } = useAuth();
  const { copy } = useAuthStyle();
  // Selection supplies context only; the authenticated profile determines access.
  const mainAgent = route?.params?.selectedRole === 'main-agent';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  async function handleLogin() {
    if (submitting.current) return;
    if (!email.trim() || !password) { setError(copy('Enter your email and password.', 'Weka barua pepe na nenosiri lako.')); return; }
    submitting.current = true;
    setBusy(true); setError('');
    try { await login(email.trim(), password); }
    catch (e) { setError(e.message || copy('Unable to sign in. Please try again.', 'Imeshindikana kuingia. Jaribu tena.')); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <AuthFrame onBack={() => navigation.goBack()} backDisabled={busy} footer="Swift Wakala · by Silverstone">
    <AuthHeading eyebrow={mainAgent ? copy('Main Agent sign in', 'Ingia kama Wakala Mkuu') : copy('Agent sign in', 'Ingia kama Wakala')} title={copy('Welcome back.', 'Karibu tena.')}
      description={copy('Sign in to continue.', 'Ingia ili kuendelea.')} />
    <AuthField label={copy('Email address', 'Barua pepe')} value={email} onChangeText={setEmail} placeholder="you@example.com"
      keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="username" editable={!busy} />
    <AuthField label={copy('Password', 'Nenosiri')} value={password} onChangeText={setPassword} password
      placeholder={copy('Enter your password', 'Weka nenosiri lako')} autoCapitalize="none" autoCorrect={false}
      autoComplete="current-password" textContentType="password" returnKeyType="go" onSubmitEditing={handleLogin} editable={!busy} />
    <AuthNotice error>{error}</AuthNotice>
    <AuthButton label={busy ? copy('Signing in…', 'Inaingia…') : copy('Sign in', 'Ingia')} onPress={handleLogin} busy={busy} />
    <AuthLink disabled={busy} onPress={() => navigation.navigate('PasswordRecovery', { email: email.trim() })}>{copy('Forgot password?', 'Umesahau nenosiri?')}</AuthLink>
    <View style={{ flex: 1, minHeight: 32 }} />
    {!mainAgent && <AuthLink disabled={busy} onPress={() => navigation.navigate('Step1Phone')}>{copy('New to Swift Wakala? Register', 'Mgeni Swift Wakala? Jisajili')}</AuthLink>}
  </AuthFrame>;
}
