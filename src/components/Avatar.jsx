import React from 'react';
import { View, Text } from 'react-native';

const COLORS = ['#D32F2F', '#1565C0', '#2E7D32', '#6A1B9A', '#E65100', '#00695C'];

export default function Avatar({ name, size = 40, style }) {
  const initial = name?.charAt(0)?.toUpperCase() ?? '?';
  const idx = (name?.charCodeAt(0) ?? 0) % COLORS.length;
  const bg  = COLORS[idx];

  return (
    <View style={[{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: bg + '26',
      borderWidth: 1.5, borderColor: bg + '66',
      alignItems: 'center', justifyContent: 'center',
    }, style]}>
      <Text style={{ color: bg, fontSize: size * 0.4, fontWeight: '700' }}>
        {initial}
      </Text>
    </View>
  );
}
