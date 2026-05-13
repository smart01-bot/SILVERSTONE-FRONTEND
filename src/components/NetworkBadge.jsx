// src/components/NetworkBadge.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NETWORK_CONFIG = {
  Voda: {
    color: '#E40000',
    short: 'VOD',
    label: 'Voda',
  },
  Yas: {
    color: '#0070B8',
    short: 'YAS',
    label: 'Yas',
  },
  Airtel: {
    color: '#FF0000',
    short: 'AIR',
    label: 'Airtel',
  },
  Halotel: {
    color: '#D4A017',
    short: 'HAL',
    label: 'Halotel',
  },
};

export default function NetworkBadge({ network, showLabel = true, size = 'md' }) {
  const config = NETWORK_CONFIG[network] ?? {
    color: '#6B6B70',
    short: '??',
    label: network ?? 'Unknown',
  };

  const isSmall = size === 'sm';

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: config.color + '14',
        borderColor:     config.color + '40',
        paddingHorizontal: isSmall ? 6 : 8,
        paddingVertical:   isSmall ? 3 : 4,
      },
    ]}>
      <View style={[
        styles.dot,
        {
          backgroundColor: config.color,
          width:  isSmall ? 6 : 8,
          height: isSmall ? 6 : 8,
        },
      ]} />
      {showLabel && (
        <Text style={[
          styles.text,
          {
            color:    config.color,
            fontSize: isSmall ? 11 : 12,
          },
        ]}>
          {config.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            5,
    borderRadius:   6,
    borderWidth:    1,
    alignSelf:      'flex-start',
  },
  dot: {
    borderRadius: 9999,
  },
  text: {
    fontWeight: '600',
  },
});