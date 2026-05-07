import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { checkLockout, recordFailedAttempt, clearLockout } from '../../utils/pinLockout';

const PIN_LENGTH = 4;
const DIGITS = [
  ['1','2','3'],
  ['4','5','6'],
  ['7','8','9'],
  ['bio','0','⌫'],
];

export default function PinEntryScreen({ navigation, isSessionUnlock = false }) {
  const { profile, verifyPin, unlockSession, logout, resetPin } = useAuth();
  const { theme } = useTheme();

  const [pin,             setPin]             = useState('');
  const [error,           setError]           = useState('');
  const [attemptsLeft,    setAttemptsLeft]    = useState(null);
  const [lockedUntil,     setLockedUntil]     = useState(null);
  const [countdown,       setCountdown]       = useState('');
  const [bioAvailable,    setBioAvailable]    = useState(false);

  const firstName = profile?.name?.split(' ')[0] ?? 'Agent';

  // ── Biometric availability ────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const hasHW    = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setBioAvailable(hasHW && enrolled);
      } catch {}
    })();
  }, []);

  // ── Check lockout on mount ────────────────────────────────
  useEffect(() => {
    (async () => {
      const status = await checkLockout();
      if (status.locked) setLockedUntil(status.lockUntil);
    })();
  }, []);

  // ── Countdown timer while locked ─────────────────────────
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const remaining = lockedUntil - Date.now();
      if (remaining <= 0) {
        clearLockout();
        setLockedUntil(null);
        setCountdown('');
        setError('');
        return;
      }
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${m}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  // ── PIN submission ────────────────────────────────────────
  const submitPin = useCallback(async (entered) => {
    setError('');
    if (lockedUntil) return;

    const ok = await verifyPin(entered);
    if (ok) {
      await clearLockout();
      unlockSession();
      return;
    }

    Vibration.vibrate(300);
    const result = await recordFailedAttempt();
    if (result.locked) {
      setLockedUntil(result.lockUntil);
      setAttemptsLeft(null);
      setError('Too many attempts. Locked for 30 minutes.');
    } else {
      setAttemptsLeft(result.attemptsRemaining);
      setError(
        result.attemptsRemaining === 1
          ? 'Incorrect PIN. 1 attempt remaining.'
          : `Incorrect PIN. ${result.attemptsRemaining} attempts remaining.`
      );
    }
  }, [lockedUntil, verifyPin, unlockSession]);

  // ── Keypad press ──────────────────────────────────────────
  const press = (val) => {
    if (lockedUntil) return;
    if (val === 'bio') { handleBiometric(); return; }
    if (val === '⌫')  { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + val;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      setTimeout(() => { setPin(''); submitPin(next); }, 100);
    }
  };

  // ── Biometric ─────────────────────────────────────────────
  const handleBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to Silverstone',
        fallbackLabel: 'Use PIN instead',
        cancelLabel:   'Cancel',
      });
      if (result.success) {
        await clearLockout();
        unlockSession();
      } else if (result.error !== 'user_cancel' && result.error !== 'system_cancel') {
        setError('Biometric failed. Use your PIN.');
      }
    } catch {
      setError('Biometric unavailable.');
    }
  };

  // ── Forgot PIN ────────────────────────────────────────────
  const handleForgotPin = () => {
    if (isSessionUnlock) {
      // Inside the lock overlay — navigate within LockStack
      navigation?.navigate('ForgotPin');
    } else {
      // Should not occur in current routing (session overlay handles everything)
      Alert.alert('Reset PIN', 'Sign out to reset your PIN.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]);
    }
  };

  const handleSwitchAccount = () => {
    Alert.alert('Sign Out', 'Sign out of this account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.inner, { paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
          <Text style={[styles.avatarText, { color: theme.primary }]}>
            {firstName[0]?.toUpperCase()}
          </Text>
        </View>

        <Text style={[styles.greeting, { color: theme.text }]}>Welcome back, {firstName}</Text>
        <Text style={[styles.sub, { color: theme.textDim }]}>Enter your 4-digit PIN</Text>

        {/* PIN boxes */}
        <View style={styles.boxes}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.box,
                {
                  backgroundColor: i < pin.length ? theme.primary : theme.surfaceAlt,
                  borderColor:     i < pin.length ? theme.primary : theme.border,
                },
              ]}
            />
          ))}
        </View>

        {/* Error / countdown */}
        {lockedUntil ? (
          <Text style={styles.error}>Locked — try again in {countdown}</Text>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        {/* Keypad */}
        <View style={[styles.pad, lockedUntil ? styles.padDisabled : null]}>
          {DIGITS.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((d, di) => {
                const isBio   = d === 'bio';
                const isEmpty = isBio && !bioAvailable;
                return (
                  <TouchableOpacity
                    key={di}
                    onPress={() => press(d)}
                    activeOpacity={isEmpty ? 1 : 0.7}
                    disabled={!!lockedUntil || isEmpty}
                    style={[
                      styles.key,
                      {
                        backgroundColor: isEmpty ? 'transparent' : theme.surface,
                        borderColor:     isEmpty ? 'transparent' : theme.border,
                      },
                    ]}
                  >
                    <Text style={[
                      styles.keyText,
                      { color: d === '⌫' || isBio ? theme.primary : theme.text },
                    ]}>
                      {isBio ? (bioAvailable ? '⊙' : '') : d}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Links */}
        <TouchableOpacity onPress={handleForgotPin} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.textDim, fontSize: 13 }}>
            Forgot PIN?{'  '}
            <Text style={{ color: theme.primary, fontWeight: '600' }}>Reset PIN</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSwitchAccount} style={{ marginTop: 8 }}>
          <Text style={{ color: theme.textDim, fontSize: 13 }}>
            Not {firstName}?{'  '}
            <Text style={{ color: theme.primary, fontWeight: '600' }}>Switch account</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  inner:   { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20 },
  avatar:  { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '700' },
  greeting:{ fontSize: 22, fontWeight: '700', textAlign: 'center' },
  sub:     { fontSize: 14, textAlign: 'center' },
  boxes:   { flexDirection: 'row', gap: 14, marginVertical: 4 },
  box:     { width: 56, height: 56, borderRadius: 10, borderWidth: 2 },
  error:   { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  pad:     { gap: 12, alignItems: 'center' },
  padDisabled: { opacity: 0.4 },
  row:     { flexDirection: 'row', gap: 12 },
  key:     { width: 80, height: 80, borderRadius: 40, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontSize: 26, fontWeight: '500', fontFamily: 'Courier New' },
});
