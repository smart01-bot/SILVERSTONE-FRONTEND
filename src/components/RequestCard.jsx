import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import StatusBadge from './StatusBadge';
import PressableCard from './PressableCard';
import { NETWORK_COLORS } from '../constants/networks';
import { typography } from '../constants/theme';
import { timeAgo } from '../utils/time';
import { successTap } from '../utils/haptics';
import { copyRequestId } from '../utils/sharing';

const fmt = (n) => `TZS ${Number(n).toLocaleString()}`;

export default function RequestCard({ request, onPress, showAgent = false }) {
  const { theme, lang } = useTheme();
  const copiedTimer = useRef(null);
  const [showCopied, setShowCopied] = useState(false);
  const { sourceNetwork, destNetwork, amount, status, urgent, createdAt, agentName } = request;
  const srcColor = NETWORK_COLORS[sourceNetwork] ?? '#888';
  const dstColor = NETWORK_COLORS[destNetwork]   ?? '#888';

  const handleLongPress = async () => {
    successTap();
    await copyRequestId(request.id);
    setShowCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setShowCopied(false), 1500);
  };

  return (
    <PressableCard
      onPress={() => onPress?.(request)}
      onLongPress={handleLongPress}
      style={[styles.card, {
        backgroundColor: theme.surface,
        borderColor: theme.border,
        borderLeftColor: srcColor,
        borderLeftWidth: 4,
        ...theme.shadow,
      }]}
    >
      {urgent && (
        <View style={styles.urgentTag}>
          <MaterialIcons name="flash-on" size={11} color={theme.amber} />
          <Text style={[styles.urgentText, { color: theme.amber }]}>URGENT</Text>
        </View>
      )}

      <View style={styles.row}>
        <View style={styles.route}>
          <View style={styles.netItem}>
            <View style={[styles.netDot, { backgroundColor: srcColor }]} />
            <Text style={[styles.netLabel, { color: theme.text }]}>{sourceNetwork}</Text>
          </View>
          <Feather name="arrow-right" size={14} color={theme.textDim} />
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

      <View style={styles.idRow}>
        <Text style={[styles.idText, { color: showCopied ? theme.green : theme.muted ?? theme.textDim }]}>
          {showCopied ? 'Copied!' : `#${request.id?.slice(-8).toUpperCase() ?? '--------'}`}
        </Text>
      </View>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10, overflow: 'hidden' },
  urgentTag: {
    position: 'absolute', top: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FEF3C730',
    paddingHorizontal: 8, paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  urgentText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  route:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  netItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  netDot:  { width: 8, height: 8, borderRadius: 4 },
  netLabel:{ fontSize: 14, fontWeight: '600' },
  footer:  { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  amount:  { ...typography.mono, fontSize: 17, fontWeight: '700' },
  agent:   { fontSize: 12, marginTop: 2 },
  time:    { fontSize: 12 },
  idRow:   { alignItems: 'flex-end' },
  idText:  { fontSize: 10, fontFamily: 'Courier New' },
});
