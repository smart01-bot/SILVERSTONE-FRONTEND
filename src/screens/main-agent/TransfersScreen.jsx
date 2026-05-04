import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { listenTransactions } from '../../utils/firestore';
import { NETWORK_COLORS } from '../../constants/networks';
import StatusBadge from '../../components/StatusBadge';

const fmt = (n) => `TZS ${Number(n).toLocaleString()}`;

export default function TransfersScreen() {
  const { theme, tr } = useTheme();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    return listenTransactions(setTransactions);
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{tr('transfers')}</Text>
        <Text style={[styles.count, { color: theme.textDim }]}>{transactions.length} transactions</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, ...theme.shadow }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.txId, { color: theme.textDim }]}>#{item.id.slice(-8).toUpperCase()}</Text>
              <StatusBadge status="completed" />
            </View>
            <View style={styles.route}>
              <View style={styles.netItem}>
                <View style={[styles.dot, { backgroundColor: NETWORK_COLORS[item.sourceNetwork] ?? '#888' }]} />
                <Text style={[styles.netName, { color: theme.text }]}>{item.sourceNetwork}</Text>
              </View>
              <Text style={[styles.arrow, { color: theme.textDim }]}>→</Text>
              <View style={styles.netItem}>
                <View style={[styles.dot, { backgroundColor: NETWORK_COLORS[item.destNetwork] ?? '#888' }]} />
                <Text style={[styles.netName, { color: theme.text }]}>{item.destNetwork}</Text>
              </View>
            </View>
            <View style={styles.footer}>
              <Text style={[styles.amount, { color: theme.primary }]}>{fmt(item.amount)}</Text>
              <Text style={[styles.agent, { color: theme.textDim }]}>{item.agentName}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 36 }}>📊</Text>
            <Text style={[{ fontSize: 15, fontWeight: '700', color: theme.text }]}>No transactions yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  header: { padding: 16, paddingBottom: 8 },
  title:  { fontSize: 22, fontWeight: '800' },
  count:  { fontSize: 13, marginTop: 2 },
  list:   { padding: 16, gap: 10, paddingBottom: 100 },
  card:   { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txId:   { fontSize: 12, fontFamily: 'Courier New' },
  route:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  netItem:{ flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:    { width: 8, height: 8, borderRadius: 4 },
  netName:{ fontSize: 14, fontWeight: '600' },
  arrow:  { fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  amount: { fontSize: 18, fontWeight: '800', fontFamily: 'Courier New' },
  agent:  { fontSize: 13 },
  empty:  { alignItems: 'center', gap: 12, paddingTop: 60 },
});