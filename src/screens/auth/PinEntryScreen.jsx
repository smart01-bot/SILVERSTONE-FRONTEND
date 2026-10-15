import React, { useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../../context/AuthContext';
import { checkLockout, recordFailedAttempt, clearLockout } from '../../utils/pinLockout';
import {
  AuthFrame, AuthHeading, AuthLink, AuthNotice, AuthIdentity,
  PinDots, PinKeypad, useAuthStyle,
} from '../../components/auth/AuthUI';

export default function PinEntryScreen({ onSuccess, onForgotPin }) {
  const { verifyPin, profile, logout } = useAuth();
  const { copy } = useAuthStyle();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [lockUntil, setLockUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [bioAvailable, setBioAvailable] = useState(false);
  const input = useRef('');
  const verifying = useRef(false);
  const firstName = profile?.name?.trim().split(/\s+/)[0] || copy('Agent', 'Wakala');
  const remaining = Math.max(0, Math.ceil((lockUntil - now) / 1000));
  const locked = remaining > 0;

  useEffect(() => {
    let active = true;
    async function inspect() {
      if (active) setChecking(true);
      try {
        const result = await checkLockout();
        if (active) {
          setLockUntil(result.locked ? Date.now() + result.remaining : 0);
          setNow(Date.now());
          setChecking(false);
        }
      } catch {
        if (active) setError(copy('Unable to read PIN protection. Close and reopen the app.', 'Imeshindikana kusoma ulinzi wa PIN. Funga na ufungue programu tena.'));
      }
    }
    inspect();
    Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()])
      .then(([hardware, enrolled]) => { if (active) setBioAvailable(hardware && enrolled); })
      .catch(() => {});
    const foreground = AppState.addEventListener('change', state => { if (state === 'active') inspect(); });
    const timer = setInterval(() => { if (active) setNow(Date.now()); }, 1000);
    return () => { active = false; clearInterval(timer); foreground.remove(); };
  }, []);

  function clear() {
    input.current = '';
    setPin('');
  }

  async function handleDigit(digit) {
    if (checking || locked || verifying.current || input.current.length >= 4) return;
    const next = input.current + digit;
    input.current = next;
    setPin(next);
    setError('');
    if (next.length !== 4) return;
    verifying.current = true;
    setBusy(true);
    try {
      const guard = await checkLockout();
      if (guard.locked) {
        setLockUntil(Date.now() + guard.remaining);
        setNow(Date.now());
        return;
      }
      if (await verifyPin(next)) {
        await clearLockout();
        onSuccess?.();
      } else {
        const result = await recordFailedAttempt();
        if (result.locked) {
          setLockUntil(result.lockUntil);
          setNow(Date.now());
        }
        setError(result.locked
          ? copy('Too many attempts. Try again when the timer ends.', 'Majaribio mengi mno. Jaribu tena muda ukiisha.')
          : copy(`Incorrect PIN. ${result.remaining} attempts remaining.`, `PIN si sahihi. Majaribio ${result.remaining} yamebaki.`));
      }
    } catch {
      setError(copy('Unable to unlock. Please try again.', 'Imeshindikana kufungua. Jaribu tena.'));
    } finally {
      clear();
      verifying.current = false;
      setBusy(false);
    }
  }

  async function handleBiometric() {
    if (checking || locked || verifying.current) return;
    verifying.current = true;
    setBusy(true);
    setError('');
    try {
      const guard = await checkLockout();
      if (guard.locked) {
        setLockUntil(Date.now() + guard.remaining);
        setNow(Date.now());
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: copy('Unlock Swift Wakala', 'Fungua Swift Wakala'),
        fallbackLabel: copy('Use PIN', 'Tumia PIN'),
      });
      if (result.success) {
        await clearLockout();
        onSuccess?.();
      }
    } catch {
      setError(copy('Biometrics unavailable. Use your PIN.', 'Biometriki haipatikani. Tumia PIN yako.'));
    } finally {
      verifying.current = false;
      setBusy(false);
    }
  }

  function handleSwitchAccount() {
    Alert.alert(
      copy('Switch account?', 'Badili akaunti?'),
      copy('This signs out your retained account.', 'Hii itaondoa akaunti yako iliyohifadhiwa.'),
      [
        { text: copy('Cancel', 'Ghairi'), style: 'cancel' },
        { text: copy('Sign out', 'Ondoka'), style: 'destructive', onPress: logout },
      ],
    );
  }

  return <AuthFrame footer="Swift Wakala · by Silverstone">
    <AuthIdentity name={firstName} subtitle={copy('Retained account · this device', 'Akaunti iliyohifadhiwa · kifaa hiki')} />
    <AuthHeading
      title={copy('Enter your PIN.', 'Weka PIN yako.')}
      description={copy('Pick up where you left off.', 'Endelea ulipoishia.')}
    />
    <PinDots length={pin.length} />
    <AuthNotice error>{error}</AuthNotice>
    {locked && <AuthNotice>{copy('Try again in', 'Jaribu tena baada ya')} {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</AuthNotice>}
    {busy && <AuthNotice>{copy('Unlocking…', 'Inafungua…')}</AuthNotice>}
    <AuthLink disabled={busy} onPress={onForgotPin}>{copy('Forgot PIN?', 'Umesahau PIN?')}</AuthLink>
    <PinKeypad
      disabled={checking || locked || busy}
      onDigit={handleDigit}
      onDelete={() => {
        if (!verifying.current) {
          input.current = input.current.slice(0, -1);
          setPin(input.current);
          setError('');
        }
      }}
      biometric={bioAvailable ? handleBiometric : undefined}
    />
    <AuthLink disabled={busy} onPress={handleSwitchAccount}>{copy(`Not ${firstName}?`, `Si ${firstName}?`)}</AuthLink>
  </AuthFrame>;
}
