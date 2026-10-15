import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  AuthFrame, AuthHeading, AuthLink, AuthNotice, AuthContextPill,
  AuthProgress, PinDots, PinKeypad, useAuthStyle,
} from '../../components/auth/AuthUI';

export default function PinSetupScreen({ onComplete }) {
  const { savePin, profile } = useAuth();
  const { copy } = useAuthStyle();
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [stage, setStage] = useState('create');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef('');
  const saving = useRef(false);
  const firstName = profile?.name?.trim().split(/\s+/)[0] || copy('Agent', 'Wakala');

  function clear() {
    input.current = '';
    setPin('');
  }

  function restart() {
    if (saving.current) return;
    clear();
    setFirstPin('');
    setStage('create');
    setError('');
  }

  async function handleDigit(digit) {
    if (saving.current || input.current.length >= 4) return;
    const next = input.current + digit;
    input.current = next;
    setPin(next);
    setError('');
    if (next.length !== 4) return;

    if (stage === 'create') {
      setFirstPin(next);
      clear();
      setStage('confirm');
      return;
    }

    if (next === firstPin) {
      saving.current = true;
      setBusy(true);
      try {
        await savePin(next);
        onComplete?.();
      } catch {
        clear();
        setError(copy('PIN could not be saved. Please try again.', 'PIN haijahifadhiwa. Jaribu tena.'));
      } finally {
        saving.current = false;
        setBusy(false);
      }
    } else {
      clear();
      setError(copy('PINs do not match. Enter your chosen PIN again, or start over.', 'PIN hazifanani. Weka PIN uliyochagua tena, au anza upya.'));
    }
  }

  const confirming = stage === 'confirm';
  return <AuthFrame footer={copy('Your PIN unlocks Swift Wakala on this device.', 'PIN yako inafungua Swift Wakala kwenye kifaa hiki.')}>
    <AuthContextPill icon="lock-closed-outline">{copy('Secure this device', 'Linda kifaa hiki')}</AuthContextPill>
    <AuthHeading
      eyebrow={copy(`Welcome, ${firstName}`, `Karibu, ${firstName}`)}
      title={confirming ? copy('Confirm your PIN.', 'Thibitisha PIN yako.') : copy('Create your PIN.', 'Unda PIN yako.')}
      description={confirming
        ? copy('Enter the same four digits again.', 'Weka tena namba nne ulizochagua.')
        : copy('Choose four digits for quicker access on this device.', 'Chagua namba nne ili kuingia kwa urahisi kwenye kifaa hiki.')}
    />
    <AuthProgress
      step={confirming ? 2 : 1}
      total={2}
      label={confirming ? copy('Confirm', 'Thibitisha') : copy('Create', 'Unda')}
    />
    <PinDots length={pin.length} />
    <AuthNotice error>{error}</AuthNotice>
    {busy && <AuthNotice>{copy('Saving your PIN…', 'Inahifadhi PIN yako…')}</AuthNotice>}
    {confirming && <AuthLink disabled={busy} onPress={restart}>{copy('Choose a different PIN', 'Chagua PIN nyingine')}</AuthLink>}
    <PinKeypad
      disabled={busy}
      onDigit={handleDigit}
      onDelete={() => {
        if (!saving.current) {
          input.current = input.current.slice(0, -1);
          setPin(input.current);
          setError('');
        }
      }}
    />
  </AuthFrame>;
}
