// src/screens/auth/PinSetupScreen.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, Image, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';

// ── Animated PIN dot ──────────────────────────────────────────────────────────
function PinDot({ filled }) {
  const scale   = useRef(new Animated.Value(filled ? 1 : 0)).current;
  const opacity = useRef(new Animated.Value(filled ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: filled ? 1 : 0, tension: 260, friction: 10, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: filled ? 1 : 0, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [filled]);

  return (
    <View style={s.dotOuter}>
      <Animated.View style={[s.dotFill, { transform: [{ scale }], opacity }]} />
    </View>
  );
}

export default function PinSetupScreen({ onComplete }) {
  const { savePin, profile } = useAuth();
  const { theme, isDark }    = useTheme();

  const [pin,      setPin]      = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [stage,    setStage]    = useState('create');
  const [error,    setError]    = useState('');

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const firstName = profile?.name?.split(' ')[0] ?? 'Agent';

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
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError('');

    if (next.length === 4) {
      if (stage === 'create') {
        setTimeout(() => { setFirstPin(next); setPin(''); setStage('confirm'); }, 150);
      } else {
        if (next === firstPin) {
          try {
            await savePin(next);
            onComplete?.();
          } catch (e) {
            setError('Failed to save PIN. Try again.');
            setPin('');
          }
        } else {
          shake();
          setError('PINs do not match. Try again.');
          setTimeout(() => { setPin(''); setFirstPin(''); setStage('create'); setError(''); }, 800);
        }
      }
    }
  };

  const handleDelete = () => { setPin(p => p.slice(0, -1)); setError(''); };

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

      {/* Gradient icon */}
      <View style={s.iconWrap}>
        <LinearGradient
          colors={[theme.gradPrimA, theme.gradPrimB]}
          style={s.iconGradient}
        >
          <Ionicons name="lock-closed-outline" size={40} color="#fff" />
        </LinearGradient>
      </View>

      <Text style={[s.heading, { color: theme.primary }]}>
        {stage === 'create' ? 'Create your PIN' : 'Confirm your PIN'}
      </Text>
      <Text style={[s.sub, { color: theme.textDim }]}>
        {stage === 'create' ? 'Welcome, ' : 'Enter your PIN again'}
        {stage === 'create' && (
          <Text style={{ color: theme.text, fontFamily: fonts.bodyBold }}>{firstName}</Text>
        )}
      </Text>

      {/* Stage indicator */}
      <View style={s.stageRow}>
        <View style={[s.stageDot, { backgroundColor: theme.primary }]} />
        <View style={[s.stageLine, { backgroundColor: stage === 'confirm' ? theme.primary : theme.border }]} />
        <View style={[s.stageDot, { backgroundColor: stage === 'confirm' ? theme.primary : theme.border }]} />
      </View>

      {/* Animated PIN dots */}
      <Animated.View style={[s.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
        {[0,1,2,3].map(i => <PinDot key={i} filled={i < pin.length} />)}
      </Animated.View>

      {error ? <Text style={s.error}>{error}</Text> : <View style={{ height: 22 }} />}

      <View style={{ flex: 1 }} />

      {/* Keypad */}
      <View style={[s.keypad, { backgroundColor: theme.surfaceAlt }]}>
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
                  activeOpacity={0.7}
                  style={[s.key, { backgroundColor: theme.surface }]}
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

  iconWrap:     { alignItems: 'center', marginTop: spacing.lg },
  iconGradient: {
    width: 88, height: 88, borderRadius: radius.lg + 2,
    alignItems: 'center', justifyContent: 'center',
  },

  heading: { fontSize: 22, fontFamily: fonts.heading, letterSpacing: -0.2, textAlign: 'center', marginTop: spacing.md + 2 },
  sub:     { fontSize: 17, fontFamily: fonts.body,    textAlign: 'center', marginTop: spacing.sm - 2 },

  stageRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 0, marginTop: spacing.md, paddingHorizontal: spacing.xxl + spacing.xl,
  },
  stageDot:  { width: 10, height: 10, borderRadius: 5 },
  stageLine: { flex: 1, height: 2, marginHorizontal: spacing.xs },

  dotsRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: spacing.md, marginTop: spacing.md,
  },
  dotOuter: {
    width: 52, height: 52, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#16A34A40',
  },
  dotFill: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#16A34A' },

  error: {
    color: '#C8102E', fontSize: 16, fontFamily: fonts.body,
    textAlign: 'center', marginTop: spacing.sm, height: 22,
  },

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
