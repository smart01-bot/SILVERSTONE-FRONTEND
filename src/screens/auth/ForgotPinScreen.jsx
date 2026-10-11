import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthFrame, AuthHeading, AuthField, AuthButton, AuthNotice, useAuthStyle } from '../../components/auth/AuthUI';

export default function ForgotPinScreen({ onBack, onComplete }) {
  const { user, resetPin } = useAuth();
  const { copy } = useAuthStyle();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  async function handleVerify() {
    if (submitting.current) return;
    if (!password) { setError(copy('Enter your password.', 'Weka nenosiri lako.')); return; }
    submitting.current = true; setBusy(true); setError('');
    try { await resetPin(password); onComplete?.(); }
    catch (e) { setError(e.message || copy('Unable to verify your password. Try again.', 'Imeshindikana kuthibitisha nenosiri. Jaribu tena.')); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <AuthFrame onBack={onBack} backDisabled={busy} footer={copy('Your new PIN applies to this device.', 'PIN yako mpya itatumika kwenye kifaa hiki.')}>
    <AuthHeading eyebrow={copy('Account access', 'Ufikiaji wa akaunti')} title={copy('Reset your PIN.', 'Weka PIN mpya.')}
      description={copy('Confirm your password, then choose a new PIN.', 'Thibitisha nenosiri lako, kisha chagua PIN mpya.')} />
    <AuthNotice>{user?.email}</AuthNotice>
    <AuthField label={copy('Password', 'Nenosiri')} value={password} onChangeText={setPassword} password
      autoCapitalize="none" autoCorrect={false} autoComplete="current-password" textContentType="password"
      placeholder={copy('Enter your password', 'Weka nenosiri lako')} editable={!busy} returnKeyType="go" onSubmitEditing={handleVerify} />
    <AuthNotice error>{error}</AuthNotice>
    <AuthButton label={busy ? copy('Verifying…', 'Inathibitisha…') : copy('Continue', 'Endelea')} onPress={handleVerify} busy={busy} />
  </AuthFrame>;
}
