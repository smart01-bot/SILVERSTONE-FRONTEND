import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../constants/theme';

const STATUS = {
  pending:   { bg: '#FEF3C7', color: '#F59E0B' },
  approved:  { bg: '#E0F2FE', color: '#0891B2' },
  completed: { bg: '#DCFCE7', color: '#16A34A' },
  rejected:  { bg: '#FEE2E2', color: '#DC2626' },
};
const STATUS_DARK = {
  pending:   { bg: '#3D2D00', color: '#F59E0B' },
  approved:  { bg: '#083344', color: '#06B6D4' },
  completed: { bg: '#052E16', color: '#22C55E' },
  rejected:  { bg: '#3B0A0A', color: '#F87171' },
};

const LABELS = {
  pending:   { en: 'Pending',   sw: 'Inasubiri' },
  approved:  { en: 'Approved',  sw: 'Imeidhinishwa' },
  completed: { en: 'Completed', sw: 'Imekamilika' },
  rejected:  { en: 'Rejected',  sw: 'Imekataliwa' },
};

export default function StatusBadge({ status = 'pending' }) {
  const { isDark, lang } = useTheme();
  const map  = isDark ? STATUS_DARK : STATUS;
  const s    = map[status] || map.pending;
  const label = LABELS[status]?.[lang] ?? LABELS[status]?.en ?? status;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  text: {
    ...typography.label,
    fontFamily: 'Courier New',
    fontWeight: '700',
  },
});