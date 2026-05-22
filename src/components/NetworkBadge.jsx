// src/components/NetworkBadge.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NETWORK_COLORS, NETWORK_TEXT_COLORS, NETWORK_SHORT } from '../constants/networks';

export default function NetworkBadge({ network, showLabel = true, size = 'md' }) {
  const color     = NETWORK_COLORS[network]      ?? '#6B6B70';
  const textColor = NETWORK_TEXT_COLORS[network]  ?? '#fff';
  const label     = network ?? 'Unknown';
  const isSmall   = size === 'sm';

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: color + '20',
        borderColor:     color + '50',
        paddingHorizontal: isSmall ? 6 : 8,
        paddingVertical:   isSmall ? 3 : 4,
      },
    ]}>
      <View style={[
        styles.dot,
        {
          backgroundColor: color,
          width:  isSmall ? 6 : 8,
          height: isSmall ? 6 : 8,
        },
      ]} />
      {showLabel && (
        <Text style={[
          styles.text,
          {
            color:    textColor === '#fff' ? color : textColor,
            fontSize: isSmall ? 11 : 12,
          },
        ]}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
    borderRadius:  6,
    borderWidth:   1,
    alignSelf:     'flex-start',
  },
  dot:  { borderRadius: 9999 },
  text: { fontWeight: '600' },
});