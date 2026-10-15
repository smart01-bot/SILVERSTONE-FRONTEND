import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  AuthFrame, AuthHeading, AuthField, AuthButton, AuthNotice,
  AuthContextPill, AuthStatusCard, useAuthStyle,
} from '../../components/auth/AuthUI';

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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(copy('Enter a valid email address.', 'Weka barua pepe sahihi.'));
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError('');
    try { await resetPassword(email.trim()); setSent(true); }
    catch (e) { setError(e.message || copy('Unable to send instructions. Try again.', 'Imeshindikana kutuma maelekezo. Jaribu tena.')); }
    finally { submitting.current = false; setBusy(false); }
  }

  return <AuthFrame onBack={() => navigation.goBack()} backDisabled={busy} footer="Swift Wakala · by Silverstone">
    <AuthContextPill icon="mail-outline">{copy('Account recovery', 'Kurejesha akaunti')}</AuthContextPill>
    <AuthHeading
      title={sent ? copy('Check your email.', 'Angalia barua pepe.') : copy('Forgot password?', 'Umesahau nenosiri?')}
      description={sent
        ? copy('If an account exists for that email, recovery instructions have been sent.', 'Ikiwa akaunti ipo kwa barua pepe hiyo, maelekezo ya kurejesha yametumwa.')
        : copy('Enter the email address you use for Swift Wakala.', 'Weka barua pepe unayotumia Swift Wakala.')}
    />
    {!sent && <AuthField label={copy('Email address', 'Barua pepe')} value={email} onChangeText={setEmail} placeholder="you@example.com"
      autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" editable={!busy} onSubmitEditing={send} />}
    {sent && <AuthStatusCard title={copy('Instructions requested', 'Maelekezo yameombwa')}>
      {copy('For privacy, Swift Wakala will not confirm whether that email is registered.', 'Kwa faragha, Swift Wakala haitathibitisha kama barua pepe hiyo imesajiliwa.')}
    </AuthStatusCard>}
    <AuthNotice error>{error}</AuthNotice>
    <AuthButton
      label={sent ? copy('Back to sign in', 'Rudi kuingia') : busy ? copy('Sending…', 'Inatuma…') : copy('Send recovery instructions', 'Tuma maelekezo')}
      onPress={sent ? () => navigation.goBack() : send}
      busy={busy}
    />
  </AuthFrame>;
}
