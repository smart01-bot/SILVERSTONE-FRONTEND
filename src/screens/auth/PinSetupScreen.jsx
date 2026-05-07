import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Vibration, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const PIN_LENGTH = 4;
const DIGITS = [
  ['1','2','3'],
  ['4','5','6'],
  ['7','8','9'],
  [null,'0','⌫'],
];

export default function PinSetupScreen() {
  const { savePin, profile, unlockSession } = useAuth();
  const { theme } = useTheme();

  const [stage,    setStage]    = useState('create'); // 'create' | 'confirm'
  const [firstPin, setFirstPin] = useState('');
  const [pin,      setPin]      = useState('');
  const [error,    setError]    = useState('');

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Vibration.vibrate(400);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const submitPin = useCallback(async (entered) => {
    if (stage === 'create') {
      setFirstPin(entered);
      setStage('confirm');
      return;
    }
    // Confirm stage
    if (entered !== firstPin) {
      setError("PINs don't match. Try again.");
      shake();
      setStage('create');
      setFirstPin('');
      return;
    }
    try {
      await savePin(entered);
      unlockSession(); // pinSet=true → sessionLocked=false → dashboard
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }, [stage, firstPin, savePin, unlockSession]);

  const press = (val) => {
    if (val === null) return;
    if (val === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + val;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      setTimeout(() => { setPin(''); submitPin(next); }, 100);
    }
  };

  // Reset error when user starts entering
  const handlePress = (val) => {
    if (error) setError('');
    press(val);
  };

  const firstName = profile?.name?.split(' ')[0] ?? 'Agent';

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.inner}>

        {/* Logo text */}
        <Text style={[styles.brand, { color: theme.primary }]}>Silverstone</Text>

        <Text style={[styles.heading, { color: theme.primary }]}>
          {stage === 'create' ? 'Create Your PIN' : 'Confirm Your PIN'}
        </Text>
        <Text style={[styles.sub, { color: theme.textDim }]}>
          {stage === 'create'
            ? 'Choose a 4-digit code you will remember'
            : `Hi ${firstName}, re-enter your PIN to confirm`}
        </Text>

        {/* PIN boxes */}
        <Animated.View style={[styles.boxes, { transform: [{ translateX: shakeAnim }] }]}>
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
        </Animated.View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Keypad */}
        <View style={styles.pad}>
          {DIGITS.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((d, di) => {
                const isEmpty = d === null;
                return (
                  <TouchableOpacity
                    key={di}
                    onPress={() => !isEmpty && handlePress(d)}
                    activeOpacity={isEmpty ? 1 : 0.7}
                    style={[
                      styles.key,
                      {
                        backgroundColor: isEmpty ? 'transparent' : theme.surface,
                        borderColor:     isEmpty ? 'transparent' : theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.keyText, { color: d === '⌫' ? theme.primary : theme.text }]}>
                      {isEmpty ? '' : d}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  inner:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20 },
  brand:   { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  heading: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  sub:     { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  boxes:   { flexDirection: 'row', gap: 14 },
  box:     { width: 56, height: 56, borderRadius: 10, borderWidth: 2 },
  error:   { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  pad:     { gap: 12, alignItems: 'center' },
  row:     { flexDirection: 'row', gap: 12 },
  key:     { width: 80, height: 80, borderRadius: 40, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontSize: 26, fontWeight: '500', fontFamily: 'Courier New' },
});
