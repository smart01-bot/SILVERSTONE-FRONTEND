// src/screens/main-agent/ApprovalsScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function ApprovalsScreen() {
  const { theme, isDark } = useTheme();

  const [agents,     setAgents]     = useState([]);
  const [filter,     setFilter]     = useState('Pending');
  const [refreshing, setRefreshing] = useState(false);
  const [loading,    setLoading]    = useState(null);

  const FILTERS = ['Pending', 'Approved', 'Rejected'];

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'agents'), where('role', '==', 'sub-agent')),
      snap => setAgents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  const filtered = agents.filter(a => {
    if (filter === 'Pending')  return a.status === 'pending';
    if (filter === 'Approved') return a.status === 'approved';
    if (filter === 'Rejected') return a.status === 'rejected';
    return true;
  });

  const pendingCount = agents.filter(a => a.status === 'pending').length;

  const handleApprove = async (agent) => {
    setLoading(agent.id + '_approve');
    try {
      await updateDoc(doc(db, 'agents', agent.id), {
        status:     'approved',
        approvedAt: Timestamp.now(),
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to approve agent.');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = (agent) => {
    Alert.alert(
      'Reject Application',
      'Select a reason:',
      [
        { text: 'Does not meet requirements', onPress: () => doReject(agent, 'Does not meet requirements') },
        { text: 'Invalid documentation',       onPress: () => doReject(agent, 'Invalid documentation') },
        { text: 'Duplicate application',       onPress: () => doReject(agent, 'Duplicate application') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const doReject = async (agent, reason) => {
    setLoading(agent.id + '_reject');
    try {
      await updateDoc(doc(db, 'agents', agent.id), {
        status:          'rejected',
        rejectionReason: reason,
        rejectedAt:      Timestamp.now(),
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to reject agent.');
    } finally {
      setLoading(null);
    }
  };

  const daysAgo = (ts) => {
    if (!ts?.toDate) return '';
    const days = Math.floor((Date.now() - ts.toDate().getTime()) / 86400000);
    if (days === 0) return 'TODAY';
    if (days === 1) return 'YESTERDAY';
    return `${days}D AGO`;
  };

  const avatarColor = (name) => {
    const colors = ['#C8102E', '#0891B2', '#16A34A', '#7C3AED', '#F59E0B'];
    return colors[(name?.charCodeAt(0) ?? 0) % colors.length];
  };

  const initials = (name) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'AG';

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#C8102E" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agent Approvals</Text>
        <Text style={styles.headerSub}>Review applications & ID docs</Text>
      </View>

      {/* Filter pills */}
      <View style={[styles.filters, { backgroundColor: theme.bg }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: filter === f ? theme.primary : theme.surfaceAlt,
                    borderColor:     filter === f ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text style={[
                  styles.pillText,
                  { color: filter === f ? '#fff' : theme.textDim },
                ]}>
                  {f}
                  {f === 'Pending' && pendingCount > 0
                    ? `  ${pendingCount}`
                    : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#C8102E']}
            tintColor="#C8102E"
          />
        }
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={56} color={theme.muted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No {filter.toLowerCase()} applications
            </Text>
          </View>
        ) : (
          filtered.map(agent => (
            <View
              key={agent.id}
              style={[styles.card, {
                backgroundColor: theme.surfaceAlt,
                borderColor:     theme.border,
              }]}
            >
              {/* Top row */}
              <View style={styles.cardTop}>
                <View style={[
                  styles.avatar,
                  { backgroundColor: avatarColor(agent.name) + '20' },
                ]}>
                  <Text style={[
                    styles.avatarText,
                    { color: avatarColor(agent.name) },
                  ]}>
                    {initials(agent.name)}
                  </Text>
                </View>
                <View style={styles.agentInfo}>
                  <Text style={[styles.agentName, { color: theme.text }]}>
                    {agent.name}
                  </Text>
                  <Text style={[styles.agentSub, { color: theme.textDim }]}>
                    {agent.businessLocation} · {agent.networks?.length ?? 0} tills
                  </Text>
                  {agent.rejectionReason && (
                    <Text style={styles.rejectionReason}>
                      {agent.rejectionReason}
                    </Text>
                  )}
                </View>
                <Text style={[styles.daysAgo, { color: theme.textDim }]}>
                  {daysAgo(agent.createdAt)}
                </Text>
              </View>

              {/* Details */}
              <View style={[styles.details, { borderTopColor: theme.border }]}>
                {[
                  { label: 'Phone',    value: agent.phone },
                  { label: 'Business', value: agent.businessName },
                  { label: 'Reg No',   value: agent.regNo },
                  { label: 'TIN',      value: agent.tin },
                  { label: 'NIDA',     value: agent.nida },
                ].map(row => (
                  <View key={row.label} style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textDim }]}>
                      {row.label}
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {row.value ?? '—'}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Actions — only for pending */}
              {agent.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.btnOutline, { borderColor: theme.border }]}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.btnOutlineText, { color: theme.textDim }]}>
                      View docs
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleApprove(agent)}
                    style={[styles.btnFilled, { backgroundColor: '#C8102E' }]}
                    activeOpacity={0.85}
                  >
                    {loading === agent.id + '_approve'
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.btnFilledText}>Approve</Text>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleReject(agent)}
                    style={[styles.btnOutline, { borderColor: '#C8102E' }]}
                    activeOpacity={0.75}
                  >
                    {loading === agent.id + '_reject'
                      ? <ActivityIndicator size="small" color="#C8102E" />
                      : <Text style={[styles.btnOutlineText, { color: '#C8102E' }]}>
                          Reject
                        </Text>
                    }
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: 16, paddingBottom: 100 },

  header: {
    backgroundColor:       '#C8102E',
    paddingHorizontal:     18,
    paddingTop:            10,
    paddingBottom:         14,
    borderBottomLeftRadius:  24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  filters:   { paddingVertical: 10, paddingHorizontal: 16 },
  filterRow: { flexDirection: 'row', gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical:   7,
    borderRadius:      9999,
    borderWidth:       1,
  },
  pillText: { fontSize: 13, fontWeight: '600' },

  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap:        12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' },

  card: {
    borderRadius: 16,
    borderWidth:  1,
    marginBottom: 12,
    overflow:     'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           12,
    padding:       14,
  },
  avatar: {
    width:          44,
    height:         44,
    borderRadius:   22,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  avatarText:       { fontSize: 16, fontWeight: '700' },
  agentInfo:        { flex: 1, gap: 2 },
  agentName:        { fontSize: 15, fontWeight: '700' },
  agentSub:         { fontSize: 12 },
  rejectionReason:  { fontSize: 12, color: '#C8102E', marginTop: 2 },
  daysAgo:          { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },

  details: {
    borderTopWidth:    1,
    paddingHorizontal: 14,
    paddingVertical:   10,
    gap:               6,
  },
  detailRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  detailLabel: { fontSize: 12 },
  detailValue: { fontSize: 12, fontWeight: '600' },

  actions: {
    flexDirection:     'row',
    gap:               8,
    padding:           14,
    paddingTop:        0,
  },
  btnOutline: {
    flex:           1,
    height:         38,
    borderRadius:   10,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
  },
  btnOutlineText: { fontSize: 13, fontWeight: '600' },
  btnFilled: {
    flex:           1,
    height:         38,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
  },
  btnFilledText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});