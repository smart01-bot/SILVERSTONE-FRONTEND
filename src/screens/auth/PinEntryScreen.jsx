// src/screens/auth/PinEntryScreen.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, Image, Animated, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';
import { checkLockout, recordFailedAttempt, clearLockout } from '../../utils/pinLockout';

// ── Animated PIN dot ──────────────────────────────────────────────────────────
function PinDot({ filled }) {
  const scale   = useRef(new Animated.Value(filled ? 1 : 0)).current;
  const opacity = useRef(new Animated.Value(filled ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,  { toValue: filled ? 1 : 0, tension: 260, friction: 10, useNativeDriver: true }),
      Animated.timing(opacity,{ toValue: filled ? 1 : 0, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [filled]);

  return (
    <View style={s.dotOuter}>
      <Animated.View style={[s.dotFill, { transform: [{ scale }], opacity }]} />
    </View>
  );
}

export default function PinEntryScreen({
  onSuccess,
  onForgotPin,
  isSessionUnlock = false,
}) {
  const { verifyPin, profile, logout } = useAuth();
  const { theme, isDark } = useTheme();

  const [pin,           setPin]           = useState('');
  const [error,         setError]         = useState('');
  const [locked,        setLocked]        = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [bioAvailable,  setBioAvailable]  = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const firstName = profile?.name?.split(' ')[0] ?? 'Agent';
  const timerRef  = useRef(null);

  useEffect(() => {
    checkLockoutStatus();
    checkBiometrics();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const checkLockoutStatus = async () => {
    const result = await checkLockout();
    if (result.locked) { setLocked(true); startCountdown(result.remaining); }
  };

  const startCountdown = (ms) => {
    setLockRemaining(Math.ceil(ms / 1000));
    timerRef.current = setInterval(() => {
      setLockRemaining(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); setLocked(false); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const checkBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled  = await LocalAuthentication.isEnrolledAsync();
    setBioAvailable(hasHardware && isEnrolled);
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleDigit = async (digit) => {
    if (locked || pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError('');

    if (next.length === 4) {
      const correct = await verifyPin(next);
      if (correct) {
        await clearLockout();
        setTimeout(() => onSuccess?.(), 150);
      } else {
        shake();
        const result = await recordFailedAttempt();
        if (result.locked) {
          setLocked(true);
          startCountdown(30 * 60 * 1000);
          setError('Too many attempts. Locked for 30 minutes.');
        } else {
          setError(`Incorrect PIN. ${result.remaining} attempt${result.remaining !== 1 ? 's' : ''} remaining.`);
        }
        setTimeout(() => setPin(''), 400);
      }
    }
  };

  const handleDelete = () => { if (locked) return; setPin(p => p.slice(0, -1)); setError(''); };

  const handleBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to Silverstone',
        fallbackLabel: 'Use PIN',
      });
      if (result.success) { await clearLockout(); onSuccess?.(); }
    } catch (e) { setError('Biometric failed. Use your PIN.'); }
  };

  const handleSwitchAccount = () => {
    Alert.alert('Switch Account', 'You will be signed out. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const sv = secs % 60;
    return `${m}:${sv.toString().padStart(2, '0')}`;
  };

  const KEYS = [
    ['1','2','3'],
    ['4','5','6'],
    ['7','8','9'],
    ['', '0','del'],
  ];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      {/* Logo */}
      <View style={s.logoRow}>
        <View style={s.logoTile}>
          <Image source={require('../../../assets/images/SilverS.png')} style={s.logoImg} resizeMode="contain" />
        </View>
        <Text style={[s.logoText, { color: theme.text }]}>silverstone</Text>
      </View>

      {/* Icon */}
      <View style={s.iconWrap}>
        <LinearGradient
          colors={[theme.gradPrimA, theme.gradPrimB]}
          style={s.iconGradient}
        >
          <Ionicons name="phone-portrait-outline" size={40} color="#fff" />
        </LinearGradient>
      </View>

      <Text style={[s.heading, { color: theme.primary }]}>Enter your PIN</Text>
      <Text style={[s.sub, { color: theme.textDim }]}>
        Welcome back,{' '}
        <Text style={{ color: theme.text, fontFamily: fonts.bodyBold }}>{firstName}</Text>
      </Text>

      {/* Animated PIN dots */}
      <Animated.View style={[s.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
        {[0,1,2,3].map(i => <PinDot key={i} filled={i < pin.length} />)}
      </Animated.View>

      {/* Helper row */}
      <View style={s.helperRow}>
        <TouchableOpacity onPress={onForgotPin} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[s.helper, { color: theme.textDim }]}>Forgot PIN?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSwitchAccount} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[s.helper, { color: theme.textDim }]}>Not {firstName}?</Text>
        </TouchableOpacity>
      </View>

      {locked ? (
        <Text style={s.error}>Locked · try again in {formatTime(lockRemaining)}</Text>
      ) : error ? (
        <Text style={s.error}>{error}</Text>
      ) : (
        <View style={{ height: 22 }} />
      )}

      {bioAvailable && !locked && (
        <View style={s.bioWrap}>
          <TouchableOpacity
            onPress={handleBiometric}
            style={[s.bioTile, { backgroundColor: theme.surfaceAlt }]}
            activeOpacity={0.75}
          >
            <Ionicons name="finger-print-outline" size={32} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[s.bioLabel, { color: theme.textDim }]}>Biometric</Text>
        </View>
      )}

      <View style={{ flex: 1 }} />

      {/* Keypad */}
      <View style={[s.keypad, {
        backgroundColor: theme.surfaceAlt,
        borderTopWidth: isDark ? 1 : 0,
        borderTopColor: theme.border,
      }]}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={s.keyRow}>
            {row.map((key, ki) => {
              if (key === '') return <View key={ki} style={s.keyEmpty} />;
              if (key === 'del') {
                return (
                  <TouchableOpacity key={ki} onPress={handleDelete} style={s.keyGhost} activeOpacity={0.6}>
                    <Ionicons name="backspace-outline" size={26} color={theme.text} />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={ki}
                  onPress={() => handleDigit(key)}
                  disabled={locked}
                  activeOpacity={0.7}
                  style={[s.key, { backgroundColor: theme.surface, opacity: locked ? 0.4 : 1 }]}
                >
                  <Text style={[s.keyText, { color: theme.text }]}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  logoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm + 2, paddingTop: spacing.md - 2,
  },
  logoTile: {
    width: 36, height: 36, borderRadius: radius.sm + 1,
    backgroundColor: '#C8102E', alignItems: 'center', justifyContent: 'center', padding: spacing.sm - 2,
  },
  logoImg:  { width: '100%', height: '100%' },
  logoText: { fontSize: 24, fontFamily: fonts.display, letterSpacing: -0.5 },

  iconWrap:    { alignItems: 'center', marginTop: spacing.lg },
  iconGradient: {
    width: 88, height: 88, borderRadius: radius.lg + 2,
    alignItems: 'center', justifyContent: 'center',
  },

  heading: { fontSize: 22, fontFamily: fonts.heading, letterSpacing: -0.2, textAlign: 'center', marginTop: spacing.md + 2 },
  sub:     { fontSize: 17, fontFamily: fonts.body,    textAlign: 'center', marginTop: spacing.sm - 2 },

  dotsRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: spacing.md, marginTop: spacing.lg,
  },
  dotOuter: {
    width: 52, height: 52, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5, borderColor: '#16A34A40',
  },
  dotFill: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#16A34A',
  },

  helperRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg + spacing.xs, marginTop: spacing.md - 2,
  },
  helper: { fontSize: 16, fontFamily: fonts.bodyMed },

  error: {
    color: '#C8102E', fontSize: 16, fontFamily: fonts.body,
    textAlign: 'center', marginTop: spacing.sm, height: 22,
  },

  bioWrap:  { alignItems: 'center', marginTop: spacing.md },
  bioTile:  {
    width: 72, height: 72, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  bioLabel: { fontSize: 14, fontFamily: fonts.body, marginTop: spacing.sm - 2 },

  keypad: {
    paddingHorizontal: spacing.sm + 2,
    paddingTop:        spacing.md - 4,
    paddingBottom:     spacing.sm - 2,
  },
  keyRow:  { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  key: {
    flex: 1, height: 58, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  keyGhost: { flex: 1, height: 58, alignItems: 'center', justifyContent: 'center' },
  keyEmpty: { flex: 1, height: 58 },
  keyText:  { fontSize: 28, fontFamily: fonts.bodyMed },
});
