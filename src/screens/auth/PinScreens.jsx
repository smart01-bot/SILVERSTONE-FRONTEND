// ─── PIN SCREENS ─────────────────────────────────────────────────────────────
// PendingScreen   — shown while admin approves the account
// PinSetupScreen  — first login after approval: set a 4-digit PIN
// PinLoginScreen  — returning users authenticate via PIN (+ optional biometrics)

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// ─── PIN DOT DISPLAY ─────────────────────────────────────────────────────────
const PinDots = ({ pin, length = 4, theme }) => (
  <View style={{ flexDirection: 'row', gap: 14, justifyContent: 'center', marginVertical: 24 }}>
    {Array.from({ length }).map((_, i) => (
      <View key={i} style={{
        width: 18, height: 18, borderRadius: 9,
        backgroundColor: pin.length > i ? theme.primary : 'transparent',
        borderWidth: 2,
        borderColor: pin.length > i ? theme.primary : theme.border,
      }} />
    ))}
  </View>
);

// ─── NUMPAD ───────────────────────────────────────────────────────────────────
const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

const Numpad = ({ onPress, theme }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 240, alignSelf: 'center' }}>
    {KEYS.map((k, i) => (
      <TouchableOpacity
        key={i}
        onPress={() => k && onPress(k)}
        disabled={!k}
        activeOpacity={k ? 0.6 : 1}
        style={{
          width: '33.33%', paddingVertical: 16,
          alignItems: 'center',
        }}
      >
        <Text style={{
          fontSize: k === '⌫' ? 22 : 26,
          fontWeight: '500',
          color: k ? theme.text : 'transparent',
        }}>{k}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ─── PENDING SCREEN ───────────────────────────────────────────────────────────
export function PendingScreen() {
  const { signOut, profile }   = useAuth();
  const { theme, tr }          = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 36 }}>⏳</Text>
      </View>
      <Text style={{ fontSize: 24, fontWeight: '800', color: theme.text, marginBottom: 10, textAlign: 'center' }}>
        {tr('applicationPending')}
      </Text>
      <Text style={{ fontSize: 14, color: theme.textDim, textAlign: 'center', lineHeight: 22, marginBottom: 8 }}>
        {tr('pendingDesc')}
      </Text>
      {profile?.name && (
        <Text style={{ fontSize: 13, color: theme.textDim, textAlign: 'center', marginBottom: 32 }}>
          Application submitted for{' '}
          <Text style={{ color: theme.primary, fontWeight: '600' }}>{profile.name}</Text>
        </Text>
      )}
      <TouchableOpacity onPress={signOut} style={{ paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1, borderColor: theme.border, borderRadius: 12 }}>
        <Text style={{ color: theme.textDim, fontWeight: '600' }}>Sign Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── PIN SETUP SCREEN ─────────────────────────────────────────────────────────
export function PinSetupScreen() {
  const { savePin }     = useAuth();
  const { theme, tr }   = useTheme();

  const [stage, setStage] = useState('set');    // 'set' | 'confirm'
  const [first, setFirst] = useState('');
  const [pin,   setPin]   = useState('');
  const [error, setError] = useState('');
  const shake = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shake, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleKey = async (k) => {
    if (k === '⌫') {
      setPin(p => p.slice(0, -1));
      setError('');
      return;
    }
    const next = pin + k;
    setPin(next);
    if (next.length < 4) return;

    if (stage === 'set') {
      setFirst(next);
      setPin('');
      setStage('confirm');
    } else {
      if (next !== first) {
        setError(tr('pinMismatch'));
        setPin('');
        triggerShake();
      } else {
        await savePin(next);
        // RootNavigator will redirect automatically
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 34, fontWeight: '800', color: theme.primary, marginBottom: 6 }}>Silverstone</Text>
      <Text style={{ fontSize: 16, color: theme.textDim, marginBottom: 4 }}>
        {stage === 'set' ? tr('setPinTitle') : tr('confirmPinTitle')}
      </Text>
      <Text style={{ fontSize: 13, color: theme.muted, textAlign: 'center', marginBottom: 8 }}>
        {stage === 'set' ? tr('setPinDesc') : tr('confirmPinDesc')}
      </Text>

      <Animated.View style={{ transform: [{ translateX: shake }] }}>
        <PinDots pin={pin} theme={theme} />
      </Animated.View>

      {!!error && <Text style={{ color: theme.red, fontSize: 13, marginBottom: 12 }}>{error}</Text>}

      <Numpad onPress={handleKey} theme={theme} />
    </SafeAreaView>
  );
}

// ─── PIN LOGIN SCREEN ─────────────────────────────────────────────────────────
export function PinLoginScreen({ route, navigation }) {
  const { verifyPin, signOut, profile, biometricsAvailable, authenticateWithBiometrics } = useAuth();
  const { theme, tr }   = useTheme();
  const onPinSuccess    = route?.params?.onPinSuccess;

  const [pin,        setPin]        = useState('');
  const [error,      setError]      = useState('');
  const [bioAvail,   setBioAvail]   = useState(false);
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    biometricsAvailable().then(setBioAvail);
  }, []);

  const triggerShake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shake, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleKey = async (k) => {
    if (k === '⌫') { setPin(p => p.slice(0, -1)); setError(''); return; }
    const next = pin + k;
    setPin(next);
    if (next.length < 4) return;

    const ok = await verifyPin(next);
    if (ok) {
      onPinSuccess?.();
    } else {
      setError('Incorrect PIN. Try again.');
      setPin('');
      triggerShake();
    }
  };

  const handleBio = async () => {
    const ok = await authenticateWithBiometrics();
    if (ok) onPinSuccess?.();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Avatar */}
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: theme.primary }}>
          {profile?.name?.[0]?.toUpperCase() || '?'}
        </Text>
      </View>

      <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 4 }}>
        {tr('welcomeBack')}{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
      </Text>
      <Text style={{ fontSize: 13, color: theme.textDim, marginBottom: 4 }}>
        {tr('enterPin')}
      </Text>

      <Animated.View style={{ transform: [{ translateX: shake }] }}>
        <PinDots pin={pin} theme={theme} />
      </Animated.View>

      {!!error && <Text style={{ color: theme.red, fontSize: 13, marginBottom: 12 }}>{error}</Text>}

      <Numpad onPress={handleKey} theme={theme} />

      {/* Biometrics */}
      {bioAvail && (
        <TouchableOpacity onPress={handleBio} style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 24 }}>🔒</Text>
          <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 14 }}>Use Biometrics</Text>
        </TouchableOpacity>
      )}

      {/* Sign out / switch account */}
      <TouchableOpacity onPress={signOut} style={{ marginTop: 28 }}>
        <Text style={{ color: theme.textDim, fontSize: 13 }}>Not you? Sign out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
