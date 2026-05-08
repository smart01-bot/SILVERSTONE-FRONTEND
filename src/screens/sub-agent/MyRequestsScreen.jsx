import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { listenRequests } from '../../utils/firestore';
import RequestCard from '../../components/RequestCard';
import RequestDetailModal from '../../components/RequestDetailModal';
import Toast from '../../components/Toast';
import { shareReceipt } from '../../utils/sharing';
import { mediumTap } from '../../utils/haptics';

const FILTERS = ['all', 'pending', 'completed', 'rejected'];

export default function MyRequestsScreen({ navigation }) {
  const { user } = useAuth();
  const { theme, tr } = useTheme();
  const [requests, setRequests]   = useState([]);
  const [filter, setFilter]       = useState('all');
  const [selected, setSelected]   = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg]   = useState('');

  useEffect(() => {
    if (!user) return;
    return listenRequests(user.uid, setRequests);
  }, [user]);

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const handleRetry = (request) => {
    navigation.navigate('NewRequest', { prefill: request });
  };

  const handleShare = async (request) => {
    mediumTap();
    const result = await shareReceipt(request);
    if (result.copied) {
      setToastMsg('Receipt copied — paste in WhatsApp');
      setShowToast(true);
    }
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
          <View>
            <RequestCard request={item} onPress={setSelected} />
            {item.status === 'completed' && (
              <TouchableOpacity
                onPress={() => handleShare(item)}
                style={[styles.shareBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="share-outline" size={15} color={theme.primary} />
                  <Text style={[styles.shareBtnText, { color: theme.primary }]}>Share Receipt</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="mail-open-outline" size={48} color={theme.muted ?? theme.textDim} />
            <Text style={[styles.emptyText, { color: theme.textDim }]}>No {filter === 'all' ? '' : filter} requests</Text>
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

      <Toast
        visible={showToast}
        message={toastMsg}
        type="success"
        onHide={() => setShowToast(false)}
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
  empty:        { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyText:    { fontSize: 15, fontWeight: '600' },
  shareBtn:     { borderWidth: 1, borderRadius: 10, paddingVertical: 9, alignItems: 'center', marginTop: -4, marginBottom: 6 },
  shareBtnText: { fontSize: 13, fontWeight: '700' },
});
