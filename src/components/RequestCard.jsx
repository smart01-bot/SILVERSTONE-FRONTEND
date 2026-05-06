import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import StatusBadge from './StatusBadge';
import { NETWORK_COLORS } from '../constants/networks';
import { typography } from '../constants/theme';
import { timeAgo } from '../utils/time';

const fmt = (n) => `TZS ${Number(n).toLocaleString()}`;

export default function RequestCard({ request, onPress, showAgent = false }) {
  const { theme, lang } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const { sourceNetwork, destNetwork, amount, status, urgent, createdAt, agentName } = request;
  const srcColor = NETWORK_COLORS[sourceNetwork] ?? '#888';
  const dstColor = NETWORK_COLORS[destNetwork]   ?? '#888';

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1.0,  useNativeDriver: true, speed: 50 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={() => onPress?.(request)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderLeftColor: srcColor,
            borderLeftWidth: 4,
            ...theme.shadow,
          },
        ]}
      >
        {urgent && (
          <View style={[styles.urgentTag, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.urgentText}>⚡ URGENT</Text>
          </View>
        )}

        <View style={styles.row}>
          {/* Route */}
          <View style={styles.route}>
            <View style={styles.netItem}>
              <View style={[styles.netDot, { backgroundColor: srcColor }]} />
              <Text style={[styles.netLabel, { color: theme.text }]}>{sourceNetwork}</Text>
            </View>
            <Text style={[styles.arrow, { color: theme.textDim }]}>→</Text>
            <View style={styles.netItem}>
              <View style={[styles.netDot, { backgroundColor: dstColor }]} />
              <Text style={[styles.netLabel, { color: theme.text }]}>{destNetwork}</Text>
            </View>
          </View>

          <StatusBadge status={status} />
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={[styles.amount, { color: theme.primary }]}>{fmt(amount)}</Text>
            {showAgent && agentName && (
              <Text style={[styles.agent, { color: theme.textDim }]}>{agentName}</Text>
            )}
          </View>
          <Text style={[styles.time, { color: theme.textDim }]}>{timeAgo(createdAt, lang)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    overflow: 'hidden',
  },
  urgentTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  route:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  netItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  netDot:  { width: 8, height: 8, borderRadius: 4 },
  netLabel:{ fontSize: 14, fontWeight: '600' },
  arrow:   { fontSize: 16 },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  amount: {
    ...typography.mono,
    fontSize: 17,
    fontWeight: '700',
  },
  agent: { fontSize: 12, marginTop: 2 },
  time:  { fontSize: 12 },
});
