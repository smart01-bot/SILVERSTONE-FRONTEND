import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NETWORK_COLORS, NETWORK_WALLETS } from '../constants/networks';
import { useTheme } from '../context/ThemeContext';

export default function NetworkBadge({ network, showWallet = false }) {
  const { theme } = useTheme();
  const color = NETWORK_COLORS[network] ?? '#888';
  return (
    <View style={[styles.badge, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.name, { color: theme.textMid }]}>{network}</Text>
      {showWallet && (
        <Text style={[styles.wallet, { color: theme.textDim }]}>· {NETWORK_WALLETS[network]}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
  },
  wallet: {
    fontSize: 11,
  },
});