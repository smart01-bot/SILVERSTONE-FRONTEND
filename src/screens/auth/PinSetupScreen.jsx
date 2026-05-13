// src/screens/auth/PinSetupScreen.jsx
import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, Image, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function PinSetupScreen({ onComplete }) {
  const { savePin, profile } = useAuth();
  const { theme, isDark } = useTheme();

  const [pin,      setPin]      = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [stage,    setStage]    = useState('create'); // 'create' | 'confirm'
  const [error,    setError]    = useState('');

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const firstName = profile?.name?.split(' ')[0] ?? 'Agent';

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
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError('');

    if (next.length === 4) {
      if (stage === 'create') {
        setTimeout(() => {
          setFirstPin(next);
          setPin('');
          setStage('confirm');
        }, 150);
      } else {
        // Confirm stage
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
          setTimeout(() => {
            setPin('');
            setFirstPin('');
            setStage('create');
            setError('');
          }, 800);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(p => p.slice(0, -1));
    setError('');
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

      {/* Icon */}
      <View style={styles.iconWrap}>
        <View style={[styles.iconTile, {
          backgroundColor: theme.primaryLight,
          borderColor:     theme.primary + '33',
        }]}>
          <Ionicons name="lock-closed-outline" size={42} color={theme.primary} />
        </View>
      </View>

      {/* Heading */}
      <Text style={[styles.heading, { color: theme.primary }]}>
        {stage === 'create' ? 'Create your PIN' : 'Confirm your PIN'}
      </Text>
      <Text style={[styles.sub, { color: theme.textDim }]}>
        {stage === 'create'
          ? `Welcome, `
          : 'Enter your PIN again'}
        {stage === 'create' && (
          <Text style={{ color: theme.text, fontWeight: '700' }}>{firstName}</Text>
        )}
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
              {filled && (
                <View style={styles.dotInner} />
              )}
            </View>
          );
        })}
      </Animated.View>

      {/* Error */}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : <View style={{ height: 20 }} />}

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Keypad */}
      <View style={[styles.keypad, { backgroundColor: theme.surfaceAlt }]}>
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
                  activeOpacity={0.7}
                  style={[styles.key, { backgroundColor: theme.surface }]}
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
  error: {
    color:     '#C8102E',
    fontSize:  13,
    textAlign: 'center',
    marginTop: 8,
    height:    20,
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