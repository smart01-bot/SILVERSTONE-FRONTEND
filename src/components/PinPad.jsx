import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { lightTap } from '../utils/haptics';

const DIGITS = [
  ['1','2','3'],
  ['4','5','6'],
  ['7','8','9'],
  ['','0','⌫'],
];

export default function PinPad({ length = 6, onComplete, onError, onBiometric }) {
  const { theme } = useTheme();
  const [pin, setPin] = useState('');

  const press = (val) => {
    if (val === '') return;
    if (val === '⌫') {
      lightTap();
      setPin(p => p.slice(0, -1));
      return;
    }
    lightTap();
    if (pin.length >= length) return;
    const next = pin + val;
    setPin(next);
    if (next.length === length) {
      setTimeout(() => {
        onComplete?.(next);
        setPin('');
      }, 120);
    }
  };

  const dots = Array.from({ length });

  return (
    <View style={styles.wrap}>
      {/* Dots */}
      <View style={styles.dots}>
        {dots.map((_, i) => (
          <View key={i} style={[
            styles.dot,
            {
              backgroundColor: i < pin.length ? theme.primary : 'transparent',
              borderColor: i < pin.length ? theme.primary : theme.border,
            }
          ]} />
        ))}
      </View>

      {/* Keypad */}
      <View style={styles.pad}>
        {DIGITS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((d, di) => {
              // Bottom-left empty slot → biometric button when available
              if (d === '' && onBiometric) {
                return (
                  <TouchableOpacity
                    key={di}
                    onPress={onBiometric}
                    activeOpacity={0.7}
                    style={[styles.key, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  >
                    <Text style={[styles.keyText, { color: theme.primary }]}>⊙</Text>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={di}
                  onPress={() => press(d)}
                  activeOpacity={0.7}
                  style={[
                    styles.key,
                    {
                      backgroundColor: d === '' ? 'transparent' : theme.surface,
                      borderColor: d === '' ? 'transparent' : theme.border,
                    }
                  ]}
                >
                  <Text style={[styles.keyText, { color: d === '⌫' ? theme.primary : theme.text }]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 32 },
  dots: { flexDirection: 'row', gap: 14 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  pad: { gap: 12, alignItems: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 26,
    fontWeight: '500',
    fontFamily: 'Courier New',
  },
});