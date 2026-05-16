// src/components/SkeletonLoader.jsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// ─── Base shimmer box ─────────────────────────────────────────────────────────
export function SkeletonBox({ width, height, borderRadius = 8, style }) {
  const { theme } = useTheme();
  const shimmer   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 850, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: theme.borderStrong, opacity }, style]}
    />
  );
}

// ─── Request card skeleton ─────────────────────────────────────────────────────
export function SkeletonCard() {
  const { theme } = useTheme();
  return (
    <View style={[s.card, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      <View style={s.row}>
        <SkeletonBox width={10}  height={10} borderRadius={5} />
        <SkeletonBox width={130} height={18} borderRadius={6} />
        <View style={{ flex: 1 }} />
        <SkeletonBox width={80}  height={22} borderRadius={6} />
      </View>
      <View style={s.row}>
        <SkeletonBox width={80} height={28} borderRadius={6} />
        <View style={{ flex: 1 }} />
        <SkeletonBox width={70} height={26} borderRadius={10} />
      </View>
      <SkeletonBox width={90} height={14} borderRadius={5} />
    </View>
  );
}

// ─── Balance card skeleton ────────────────────────────────────────────────────
export function SkeletonBalance() {
  return (
    <View style={s.balCard}>
      <SkeletonBox width={110} height={14} borderRadius={5} style={{ opacity: 0.35 }} />
      <SkeletonBox width={190} height={42} borderRadius={8} style={{ marginTop: 10, opacity: 0.35 }} />
      <SkeletonBox width={150} height={16} borderRadius={5} style={{ marginTop: 8,  opacity: 0.35 }} />
      <View style={s.pillRow}>
        <SkeletonBox width="47%" height={44} borderRadius={12} style={{ opacity: 0.25 }} />
        <SkeletonBox width="47%" height={44} borderRadius={12} style={{ opacity: 0.25 }} />
      </View>
    </View>
  );
}

// ─── Network row skeleton ─────────────────────────────────────────────────────
export function SkeletonNetRow() {
  const { theme } = useTheme();
  return (
    <View style={[s.netRow, { borderBottomColor: theme.border }]}>
      <SkeletonBox width={10}  height={10} borderRadius={5} />
      <SkeletonBox width={60}  height={16} borderRadius={5} />
      <View style={{ flex: 1, marginHorizontal: 10 }}>
        <SkeletonBox width="60%" height={8} borderRadius={4} />
      </View>
      <SkeletonBox width={55}  height={16} borderRadius={5} />
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 18, borderWidth: 1,
    borderLeftWidth: 4, padding: 16,
    marginBottom: 12, gap: 12,
  },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  balCard: { marginHorizontal: 16, marginTop: 8, borderRadius: 22, backgroundColor: '#C8102E', padding: 22, gap: 0 },
  pillRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  netRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1 },
});
