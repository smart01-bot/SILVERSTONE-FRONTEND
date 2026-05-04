import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { listenAgents, approveAgent, rejectAgent } from '../../utils/firestore';

export default function ApprovalsScreen() {
  const { theme, tr } = useTheme();
  const [agents, setAgents]     = useState([]);
  const [filter, setFilter]     = useState('pending');
  const [loading, setLoading]   = useState({});

  useEffect(() => {
    return listenAgents(setAgents);
  }, []);

  const filtered = agents.filter(a => a.status === filter);
  const pendingCount = agents.filter(a => a.status === 'pending').length;

  const handleApprove = async (agentId) => {
    setLoading(l => ({ ...l, [agentId]: true }));
    try {
      await approveAgent(agentId);
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(l => ({ ...l, [agentId]: false })); }
  };

  const handleReject = async (agentId) => {
    Alert.alert('Reject Agent', 'Reject this agent application?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive',
        onPress: async () => {
          setLoading(l => ({ ...l, [agentId]: true }));
          try { await rejectAgent(agentId); }
          catch (e) { Alert.alert('Error', e.message); }
          finally { setLoading(l => ({ ...l, [agentId]: false })); }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{tr('agentApprovals')}</Text>
        {pendingCount > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.pills}>
        {['pending','approved','rejected'].map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[styles.pill, { backgroundColor: filter===f ? theme.primary : theme.surfaceAlt, borderColor: filter===f ? theme.primary : theme.border }]}>
            <Text style={[styles.pillText, { color: filter===f ? '#fff' : theme.textDim }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)} {f==='pending' ? `(${pendingCount})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isLoading = loading[item.id];
          return (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, ...theme.shadow }]}>
              <View style={styles.top}>
                <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.avatarText, { color: theme.primary }]}>{item.name?.[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.phone, { color: theme.textDim }]}>{item.phone}</Text>
                </View>
              </View>

              <View style={[styles.details, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                {[
                  ['Business',  item.businessName],
                  ['Location',  item.businessLocation],
                  ['Reg No',    item.regNo],
                  ['TIN',       item.tin],
                  ['NIDA',      item.nida],
                ].map(([label, value]) => (
                  <View key={label} style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textDim }]}>{label}</Text>
                    <Text style={[styles.detailVal, { color: theme.text }]}>{value}</Text>
                  </View>
                ))}
              </View>

              {filter === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleReject(item.id)} disabled={isLoading}
                    style={[styles.actionBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderWidth: 1 }]}>
                    <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 14 }}>✕ Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleApprove(item.id)} disabled={isLoading}
                    style={[styles.actionBtn, { backgroundColor: theme.primary }]}>
                    {isLoading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>✓ Approve</Text>
                    }
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 36 }}>{filter === 'pending' ? '🎉' : '📭'}</Text>
            <Text style={[{ fontSize: 15, fontWeight: '700', color: theme.text }]}>
              No {filter} applications
            </Text>
          </View>
        }
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
  pills:  { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  pill:   { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  pillText: { fontSize: 12, fontWeight: '600' },
  list:   { padding: 16, gap: 14, paddingBottom: 100 },
  card:   { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  top:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700' },
  name:   { fontSize: 15, fontWeight: '700' },
  phone:  { fontSize: 13 },
  details:{ borderTopWidth: 1, borderBottomWidth: 1, overflow: 'hidden' },
  detailRow:  { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 0.5, borderBottomColor: '#00000010' },
  detailLabel:{ fontSize: 12 },
  detailVal:  { fontSize: 12, fontWeight: '600' },
  actions:{ flexDirection: 'row', gap: 10, padding: 12 },
  actionBtn:  { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  empty:  { alignItems: 'center', gap: 12, paddingTop: 60 },
});