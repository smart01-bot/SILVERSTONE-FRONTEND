import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { listenAllRequests } from '../../utils/firestore';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import RequestCard from '../../components/RequestCard';
import RequestDetailModal from '../../components/RequestDetailModal';

const FILTERS = ['pending', 'approved', 'completed', 'all'];

const EMPTY_ICONS = { pending: '✅', approved: '⇄', completed: '📦', all: '📭' };
const EMPTY_MSGS  = {
  pending:   'No pending requests',
  approved:  'No approved requests',
  completed: 'No completed requests',
  all:       'No requests yet',
};

export default function QueueScreen() {
  const { theme, tr } = useTheme();
  const { isOnline } = useOfflineQueue();
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]     = useState('pending');

  useEffect(() => {
    return listenAllRequests(setRequests);
  }, []);

  const filtered = requests
    .filter(r => filter === 'all' ? true : r.status === filter)
    .sort((a, b) => {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      const ta = a.createdAt?.toMillis?.() ?? 0;
      const tb = b.createdAt?.toMillis?.() ?? 0;
      return tb - ta;
    });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>⚠ You're offline — live queue updates paused</Text>
        </View>
      )}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{tr('requestQueue')}</Text>
        {pendingCount > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.sub, { color: theme.textDim }]}>
        Urgent requests are sorted first
      </Text>

      {/* Filter */}
      <View style={styles.pills}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[styles.pill, {
              backgroundColor: filter === f ? theme.primary : theme.surfaceAlt,
              borderColor: filter === f ? theme.primary : theme.border,
            }]}>
            <Text style={[styles.pillText, { color: filter === f ? '#fff' : theme.textDim }]}>
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
            <Text style={{ fontSize: 40 }}>{EMPTY_ICONS[filter]}</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{EMPTY_MSGS[filter]}</Text>
            <Text style={[styles.emptyDesc, { color: theme.textDim }]}>
              {filter === 'pending' ? 'All caught up — nothing waiting.' : ''}
            </Text>
          </View>
        }
      />

      <RequestDetailModal
        request={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
        role="main-agent"
      />
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
  offlineBanner: { backgroundColor: '#DC2626', paddingVertical: 7, paddingHorizontal: 16, alignItems: 'center' },
  offlineText:   { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty:  { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyDesc:  { fontSize: 14, textAlign: 'center' },
});
