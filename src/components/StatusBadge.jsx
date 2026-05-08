import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const STATUS = {
  pending:   { bg: '#FEF3C720', color: '#F59E0B' },
  approved:  { bg: '#E0F2FE20', color: '#0891B2' },
  completed: { bg: '#DCFCE720', color: '#16A34A' },
  rejected:  { bg: '#FEE2E220', color: '#DC2626' },
};
const STATUS_DARK = {
  pending:   { bg: '#3D2D0060', color: '#F59E0B' },
  approved:  { bg: '#08334460', color: '#06B6D4' },
  completed: { bg: '#052E1660', color: '#22C55E' },
  rejected:  { bg: '#3B0A0A60', color: '#F87171' },
};
const LABELS = {
  pending:   { en: 'Pending',   sw: 'Inasubiri' },
  approved:  { en: 'Approved',  sw: 'Imeidhinishwa' },
  completed: { en: 'Completed', sw: 'Imekamilika' },
  rejected:  { en: 'Rejected',  sw: 'Imekataliwa' },
};

export default function StatusBadge({ status = 'pending' }) {
  const { isDark, lang } = useTheme();
  const map   = isDark ? STATUS_DARK : STATUS;
  const s     = map[status] || map.pending;
  const label = LABELS[status]?.[lang] ?? LABELS[status]?.en ?? status;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <View style={[styles.dot, { backgroundColor: s.color }]} />
      <Text style={[styles.text, { color: s.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  dot:   { width: 6, height: 6, borderRadius: 3 },
  text:  { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
});
