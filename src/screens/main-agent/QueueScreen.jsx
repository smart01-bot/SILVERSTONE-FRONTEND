import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { listenAllRequests, updateRequestStatus, createTransaction } from '../../utils/firestore';
import RequestCard from '../../components/RequestCard';
import StatusBadge from '../../components/StatusBadge';
import { NETWORK_COLORS, NETWORK_WALLETS } from '../../constants/networks';

const fmt = (n) => `TZS ${Number(n).toLocaleString()}`;

export default function QueueScreen() {
  const { user } = useAuth();
  const { theme, tr } = useTheme();
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [filter, setFilter]     = useState('pending');

  useEffect(() => {
    return listenAllRequests(setRequests);
  }, []);

  const filtered = requests
    .filter(r => filter === 'all' ? true : r.status === filter)
    .sort((a, b) => {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      return 0;
    });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const handleApprove = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await updateRequestStatus(selected.id, 'approved', user.uid);
      setSelected(null);
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const handleProcess = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await createTransaction(selected, user.uid);
      setSelected(null);
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const handleReject = async () => {
    if (!selected) return;
    Alert.alert('Reject Request', 'Are you sure you want to reject this request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await updateRequestStatus(selected.id, 'rejected', user.uid);
            setSelected(null);
          } catch (e) { Alert.alert('Error', e.message); }
          finally { setLoading(false); }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{tr('requestQueue')}</Text>
        {pendingCount > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.sub, { color: theme.textDim }]}>{tr('queueDesc')}</Text>

      {/* Filter */}
      <View style={styles.pills}>
        {['pending','approved','completed','all'].map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[styles.pill, { backgroundColor: filter===f ? theme.primary : theme.surfaceAlt, borderColor: filter===f ? theme.primary : theme.border }]}>
            <Text style={[styles.pillText, { color: filter===f ? '#fff' : theme.textDim }]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <RequestCard request={item} onPress={setSelected} showAgent />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 36 }}>✅</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{tr('queueEmpty')}</Text>
            <Text style={[styles.emptyDesc, { color: theme.textDim }]}>{tr('queueEmptyDesc')}</Text>
          </View>
        }
      />

      {/* Action modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <View style={[styles.modal, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHandle} />

            <Text style={[styles.modalTitle, { color: theme.text }]}>Process Request</Text>
            <StatusBadge status={selected.status} />

            {/* Request details */}
            <View style={[styles.detailCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              {[
                ['Agent',   selected.agentName],
                ['Route',   `${selected.sourceNetwork} → ${selected.destNetwork}`],
                ['Amount',  fmt(selected.amount)],
                ['Source',  `${selected.sourcePhone} (${NETWORK_WALLETS[selected.sourceNetwork]})`],
                ['Dest',    `${selected.destPhone} (${NETWORK_WALLETS[selected.destNetwork]})`],
                ['Priority',selected.urgent ? '⚡ URGENT' : 'Normal'],
              ].map(([label, value]) => (
                <View key={label} style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.textDim }]}>{label}</Text>
                  <Text style={[styles.detailVal, { color: theme.text }]}>{value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actionBtns}>
              {selected.status === 'pending' && (
                <TouchableOpacity onPress={handleApprove} disabled={loading}
                  style={[styles.actionBtn, { backgroundColor: theme.info ?? '#0891B2' }]}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>✓ {tr('approve')}</Text>}
                </TouchableOpacity>
              )}
              {(selected.status === 'pending' || selected.status === 'approved') && (
                <TouchableOpacity onPress={handleProcess} disabled={loading}
                  style={[styles.actionBtn, { backgroundColor: theme.primary }]}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>⇄ {tr('processTransfer')}</Text>}
                </TouchableOpacity>
              )}
              {selected.status === 'pending' && (
                <TouchableOpacity onPress={handleReject} disabled={loading}
                  style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}>
                  <Text style={styles.actionBtnText}>✕ {tr('reject')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setSelected(null)}
                style={[styles.actionBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, borderWidth: 1 }]}>
                <Text style={[styles.actionBtnText, { color: theme.textDim }]}>{tr('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 4 },
  title:  { fontSize: 22, fontWeight: '800' },
  badge:  { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  sub:    { paddingHorizontal: 16, fontSize: 13, marginBottom: 8 },
  pills:  { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  pill:   { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  pillText: { fontSize: 12, fontWeight: '600' },
  list:   { padding: 16, gap: 10, paddingBottom: 100 },
  empty:  { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyDesc:  { fontSize: 14, textAlign: 'center' },
  modal:  { flex: 1, padding: 24, gap: 16, borderRadius: 20 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E5E5', alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  detailCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  detailRow:  { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#00000008' },
  detailLabel:{ fontSize: 13 },
  detailVal:  { fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  actionBtns: { gap: 10 },
  actionBtn:  { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});