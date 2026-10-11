import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthFrame, AuthHeading, AuthField, AuthButton, AuthNotice, useAuthStyle } from '../../components/auth/AuthUI';

export default function PasswordRecoveryScreen({ navigation, route }) {
  const { resetPassword } = useAuth();
  const { copy } = useAuthStyle();
  const [email, setEmail] = useState(route?.params?.email || '');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  async function send() {
    if (submitting.current) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError(copy('Enter a valid email address.', 'Weka barua pepe sahihi.')); return; }
    submitting.current = true; setBusy(true); setError('');
    try { await resetPassword(email.trim()); setSent(true); }
    catch (e) { setError(e.message || copy('Unable to send instructions. Try again.', 'Imeshindikana kutuma maelekezo. Jaribu tena.')); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <AuthFrame onBack={() => navigation.goBack()} backDisabled={busy}>
    <AuthHeading eyebrow={copy('Account access', 'Ufikiaji wa akaunti')}
      title={sent ? copy('Check your email.', 'Angalia barua pepe.') : copy('Forgot password?', 'Umesahau nenosiri?')}
      description={sent ? copy('If an account exists for that email, recovery instructions have been sent.', 'Ikiwa akaunti ipo kwa barua pepe hiyo, maelekezo ya kurejesha yametumwa.') :
        copy('Enter the email address you use for Silverstone.', 'Weka barua pepe unayotumia Silverstone.')} />
    {!sent && <AuthField label={copy('Email address', 'Barua pepe')} value={email} onChangeText={setEmail} placeholder="you@example.com"
      autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" editable={!busy} onSubmitEditing={send} />}
    <AuthNotice error>{error}</AuthNotice>
    <AuthButton label={sent ? copy('Back to sign in', 'Rudi kuingia') : busy ? copy('Sending…', 'Inatuma…') : copy('Send recovery instructions', 'Tuma maelekezo')}
      onPress={sent ? () => navigation.goBack() : send} busy={busy} />
  </AuthFrame>;
}
