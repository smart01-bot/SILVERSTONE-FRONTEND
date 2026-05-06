import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { listenRequests } from '../../utils/firestore';
import RequestCard from '../../components/RequestCard';
import RequestDetailModal from '../../components/RequestDetailModal';

const FILTERS = ['all', 'pending', 'completed', 'rejected'];

export default function MyRequestsScreen({ navigation }) {
  const { user } = useAuth();
  const { theme, tr } = useTheme();
  const [requests, setRequests]   = useState([]);
  const [filter, setFilter]       = useState('all');
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    if (!user) return;
    return listenRequests(user.uid, setRequests);
  }, [user]);

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const handleRetry = (request) => {
    navigation.navigate('NewRequest', { prefill: request });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{tr('myRequests')}</Text>
        <Text style={[styles.count, { color: theme.textDim }]}>{filtered.length} requests</Text>
      </View>

      {/* Filter pills */}
      <View style={styles.pills}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[styles.pill, {
              backgroundColor: filter === f ? theme.primary : theme.surfaceAlt,
              borderColor: filter === f ? theme.primary : theme.border,
            }]}>
            <Text style={[styles.pillText, { color: filter === f ? '#fff' : theme.textDim }]}>
              {f === 'all' ? 'All' : tr('status' + f.charAt(0).toUpperCase() + f.slice(1))}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <RequestCard request={item} onPress={setSelected} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 36 }}>📭</Text>
            <Text style={[styles.emptyText, { color: theme.textDim }]}>
              No {filter === 'all' ? '' : filter} requests
            </Text>
          </View>
        }
      />

      <RequestDetailModal
        request={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
        role="sub-agent"
        onRetry={handleRetry}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1 },
  header:   { padding: 16, paddingBottom: 8 },
  title:    { fontSize: 22, fontWeight: '800' },
  count:    { fontSize: 13, marginTop: 2 },
  pills:    { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  pill:     { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  pillText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  list:     { padding: 16, gap: 10, paddingBottom: 100 },
  empty:    { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyText:{ fontSize: 15, fontWeight: '600' },
});
