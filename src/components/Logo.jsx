import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Logo({ size = 60 }) {
  const radius = size * 0.22;
  const fontSize = size * 0.52;

  return (
    <View style={[styles.outer, { width: size, height: size, borderRadius: radius }]}>
      <View style={[styles.inner, { borderRadius: radius * 0.7 }]}>
        <Text style={[styles.letter, { fontSize }]}>S</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  inner: {
    width: '78%',
    height: '78%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: undefined,
  },
});
