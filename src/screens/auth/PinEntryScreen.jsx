// src/screens/auth/PinEntryScreen.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, Image, Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { checkLockout, recordFailedAttempt, clearLockout } from '../../utils/pinLockout';

export default function PinEntryScreen({
  onSuccess,
  onForgotPin,
  isSessionUnlock = false,
}) {
  const { verifyPin, profile, logout } = useAuth();
  const { theme, isDark } = useTheme();

  const [pin,          setPin]          = useState('');
  const [error,        setError]        = useState('');
  const [locked,       setLocked]       = useState(false);
  const [lockRemaining,setLockRemaining]= useState(0);
  const [bioAvailable, setBioAvailable] = useState(false);

  const shakeAnim  = useRef(new Animated.Value(0)).current;
  const firstName  = profile?.name?.split(' ')[0] ?? 'Agent';
  const timerRef   = useRef(null);

  useEffect(() => {
    checkLockoutStatus();
    checkBiometrics();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const checkLockoutStatus = async () => {
    const result = await checkLockout();
    if (result.locked) {
      setLocked(true);
      startCountdown(result.remaining);
    }
  };

  const startCountdown = (ms) => {
    setLockRemaining(Math.ceil(ms / 1000));
    timerRef.current = setInterval(() => {
      setLockRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setLocked(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const checkBiometrics = async () => {
    const hasHardware  = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled   = await LocalAuthentication.isEnrolledAsync();
    setBioAvailable(hasHardware && isEnrolled);
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
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

  const handleDelete = () => {
    if (locked) return;
    setPin(p => p.slice(0, -1));
    setError('');
  };

  const handleBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to Silverstone',
        fallbackLabel: 'Use PIN',
      });
      if (result.success) {
        await clearLockout();
        onSuccess?.();
      }
    } catch (e) {
      setError('Biometric failed. Use your PIN.');
    }
  };

  const handleSwitchAccount = () => {
    Alert.alert(
      'Switch Account',
      'You will be signed out. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const KEYS = [
    ['1','2','3'],
    ['4','5','6'],
    ['7','8','9'],
    ['',  '0','del'],
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      {/* Logo row */}
      <View style={styles.logoRow}>
        <View style={styles.logoTile}>
          <Image
            source={require('../../../assets/images/SilverS.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.logoText, { color: theme.text }]}>
          silverstone
        </Text>
      </View>

      {/* Lock icon */}
      <View style={styles.iconWrap}>
        <View style={[styles.iconTile, {
          backgroundColor: theme.primaryLight,
          borderColor:     theme.primary + '33',
        }]}>
          <Ionicons
            name="phone-portrait-outline"
            size={42}
            color={theme.primary}
          />
        </View>
      </View>

      {/* Heading */}
      <Text style={[styles.heading, { color: theme.primary }]}>
        Enter your PIN
      </Text>
      <Text style={[styles.sub, { color: theme.textDim }]}>
        Welcome back,{' '}
        <Text style={{ color: theme.text, fontWeight: '700' }}>
          {firstName}
        </Text>
      </Text>

      {/* PIN dots */}
      <Animated.View style={[
        styles.dotsRow,
        { transform: [{ translateX: shakeAnim }] },
      ]}>
        {[0,1,2,3].map(i => {
          const filled = i < pin.length;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: filled ? '#16A34A14' : theme.surfaceAlt,
                  borderWidth:     filled ? 1.5 : 0,
                  borderColor:     filled ? '#16A34A' : 'transparent',
                },
              ]}
            >
              {filled && <View style={styles.dotInner} />}
            </View>
          );
        })}
      </Animated.View>

      {/* Helper row */}
      <View style={styles.helperRow}>
        <TouchableOpacity onPress={onForgotPin}>
          <Text style={[styles.helper, { color: theme.textDim }]}>
            Forgot PIN?
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSwitchAccount}>
          <Text style={[styles.helper, { color: theme.textDim }]}>
            Not {firstName}?
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error / lockout */}
      {locked ? (
        <Text style={styles.error}>
          Locked · try again in {formatTime(lockRemaining)}
        </Text>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <View style={{ height: 20 }} />
      )}

      {/* Biometric */}
      {bioAvailable && !locked && (
        <View style={styles.bioWrap}>
          <TouchableOpacity
            onPress={handleBiometric}
            style={[styles.bioTile, { backgroundColor: theme.surfaceAlt }]}
            activeOpacity={0.75}
          >
            <Ionicons name="finger-print" size={40} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.bioLabel, { color: theme.textDim }]}>
            Tap to login with biometrics
          </Text>
        </View>
      )}

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Keypad */}
      <View style={[styles.keypad, {
        backgroundColor: theme.surfaceAlt,
        borderTopWidth:  isDark ? 1 : 0,
        borderTopColor:  theme.border,
      }]}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((key, ki) => {
              if (key === '') {
                return <View key={ki} style={styles.keyEmpty} />;
              }
              if (key === 'del') {
                return (
                  <TouchableOpacity
                    key={ki}
                    onPress={handleDelete}
                    style={styles.keyGhost}
                    activeOpacity={0.6}
                  >
                    <Ionicons
                      name="backspace-outline"
                      size={24}
                      color={theme.text}
                    />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={ki}
                  onPress={() => handleDigit(key)}
                  disabled={locked}
                  activeOpacity={0.7}
                  style={[styles.key, {
                    backgroundColor: theme.surface,
                    opacity: locked ? 0.4 : 1,
                  }]}
                >
                  <Text style={[styles.keyText, { color: theme.text }]}>
                    {key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  logoRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            10,
    paddingTop:     14,
  },
  logoTile: {
    width:           32,
    height:          32,
    borderRadius:    9,
    backgroundColor: '#C8102E',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         6,
  },
  logoImg:  { width: '100%', height: '100%' },
  logoText: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  iconWrap: { alignItems: 'center', marginTop: 24 },
  iconTile: {
    width:          84,
    height:         84,
    borderRadius:   18,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize:      18,
    fontWeight:    '700',
    letterSpacing: -0.2,
    textAlign:     'center',
    marginTop:     18,
  },
  sub: {
    fontSize:  14,
    textAlign: 'center',
    marginTop: 6,
  },
  dotsRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    gap:            14,
    marginTop:      22,
  },
  dot: {
    width:          48,
    height:         48,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
  },
  dotInner: {
    width:           12,
    height:          12,
    borderRadius:    6,
    backgroundColor: '#16A34A',
  },
  helperRow: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    paddingHorizontal: 28,
    marginTop:         14,
  },
  helper: {
    fontSize:   13,
    fontWeight: '500',
  },
  error: {
    color:     '#C8102E',
    fontSize:  13,
    textAlign: 'center',
    marginTop: 8,
    height:    20,
  },
  bioWrap: {
    alignItems: 'center',
    marginTop:  16,
  },
  bioTile: {
    width:          68,
    height:         68,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
  },
  bioLabel: {
    fontSize:  12,
    marginTop: 6,
  },
  keypad: {
    paddingHorizontal: 10,
    paddingTop:        12,
    paddingBottom:     6,
  },
  keyRow: {
    flexDirection: 'row',
    gap:           8,
    marginBottom:  8,
  },
  key: {
    flex:           1,
    height:         54,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 1 },
    shadowOpacity:  0.04,
    shadowRadius:   2,
    elevation:      1,
  },
  keyGhost: {
    flex:           1,
    height:         54,
    alignItems:     'center',
    justifyContent: 'center',
  },
  keyEmpty: { flex: 1, height: 54 },
  keyText: {
    fontSize:   26,
    fontWeight: '500',
  },
});