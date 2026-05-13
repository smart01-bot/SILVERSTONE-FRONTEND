// src/components/StatusBadge.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const STATUS_CONFIG = {
  pending: {
    color: '#F59E0B',
    bg:    '#F59E0B20',
    label: 'Pending',
  },
  approved: {
    color: '#0891B2',
    bg:    '#0891B220',
    label: 'Approved',
  },
  completed: {
    color: '#16A34A',
    bg:    '#16A34A20',
    label: 'Completed',
  },
  rejected: {
    color: '#C8102E',
    bg:    '#C8102E20',
    label: 'Rejected',
  },
  cancelled: {
    color: '#6B6B70',
    bg:    '#6B6B7020',
    label: 'Cancelled',
  },
  suspended: {
    color: '#C8102E',
    bg:    '#C8102E20',
    label: 'Suspended',
  },
};

export default function StatusBadge({ status, size = 'md' }) {
  const { theme } = useTheme();
  const config = STATUS_CONFIG[status] ?? {
    color: theme.textDim,
    bg:    theme.surfaceAlt,
    label: status ?? 'Unknown',
  };

  const isSmall = size === 'sm';

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: config.bg,
        paddingHorizontal: isSmall ? 6 : 8,
        paddingVertical:   isSmall ? 2 : 4,
      },
    ]}>
      <View style={[
        styles.dot,
        {
          backgroundColor: config.color,
          width:  isSmall ? 5 : 6,
          height: isSmall ? 5 : 6,
        },
      ]} />
      <Text style={[
        styles.text,
        {
          color:    config.color,
          fontSize: isSmall ? 11 : 12,
        },
      ]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            4,
    borderRadius:   6,
    alignSelf:      'flex-start',
  },
  dot: {
    borderRadius: 9999,
  },
  text: {
    fontWeight: '600',
  },
});