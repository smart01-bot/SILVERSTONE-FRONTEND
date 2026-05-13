// src/screens/sub-agent/MyRequestsScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  collection, query, where, orderBy,
  onSnapshot, doc, updateDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';

const NETWORK_COLORS = {
  Voda:    '#E40000',
  Yas:     '#0070B8',
  Airtel:  '#FF0000',
  Halotel: '#D4A017',
};

export default function MyRequestsScreen({ navigation }) {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();

  const [requests,   setRequests]   = useState([]);
  const [filter,     setFilter]     = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const FILTERS = ['All', 'Pending', 'Approved', 'Completed', 'Rejected'];

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(
      query(
        collection(db, 'requests'),
        where('agentId', '==', user.uid),
        orderBy('createdAt', 'desc')
      ),
      snap => setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [user?.uid]);

  const filtered = requests.filter(r => {
    if (filter === 'All')       return true;
    if (filter === 'Pending')   return r.status === 'pending';
    if (filter === 'Approved')  return r.status === 'approved';
    if (filter === 'Completed') return r.status === 'completed';
    if (filter === 'Rejected')  return r.status === 'rejected';
    return true;
  }).sort((a, b) => {
    if (a.urgent && !b.urgent) return -1;
    if (!a.urgent && b.urgent) return 1;
    return 0;
  });

  const handleCancel = (req) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'requests', req.id), {
                status: 'cancelled',
              });
            } catch (e) {
              Alert.alert('Error', 'Failed to cancel request.');
            }
          },
        },
      ]
    );
  };

  const handleRetry = (req) => {
    navigation.navigate('NewRequest', {
      prefill: {
        sourceNetwork: req.sourceNetwork,
        destNetwork:   req.destNetwork,
        sourcePhone:   req.sourcePhone,
        destPhone:     req.destPhone,
        amount:        req.amount,
      },
    });
  };

  const statusColor = (status) => {
    switch (status) {
      case 'completed': return '#16A34A';
      case 'pending':   return '#F59E0B';
      case 'approved':  return '#0891B2';
      case 'rejected':  return '#C8102E';
      case 'cancelled': return theme.textDim;
      default:          return theme.textDim;
    }
  };

  const timeAgo = (ts) => {
    if (!ts?.toDate) return '';
    const secs = Math.floor((Date.now() - ts.toDate().getTime()) / 1000);
    if (secs < 60)    return 'Just now';
    if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    if (secs < 172800)return 'Yesterday';
    return `${Math.floor(secs / 86400)}d ago`;
  };

  const fmt = (n) => {
    if (n >= 1_000_000) return `TZS ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `TZS ${(n / 1_000).toFixed(0)}k`;
    return `TZS ${n}`;
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#C8102E" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Requests</Text>
        <Text style={styles.headerSub}>{requests.length} total</Text>
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
                activeOpacity={0.75}
              >
                <Text style={[
                  styles.pillText,
                  { color: filter === f ? '#fff' : theme.textDim },
                ]}>
                  {f}
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
            <Ionicons name="document-outline" size={56} color={theme.muted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No {filter === 'All' ? '' : filter.toLowerCase()} requests
            </Text>
            <Text style={[styles.emptyText, { color: theme.textDim }]}>
              {filter === 'All'
                ? 'Submit your first float request'
                : `No ${filter.toLowerCase()} requests found`}
            </Text>
            {filter === 'All' && (
              <TouchableOpacity
                onPress={() => navigation.navigate('NewRequest')}
                style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.emptyBtnText}>New Request</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map(req => (
            <View
              key={req.id}
              style={[styles.card, {
                backgroundColor: theme.surfaceAlt,
                borderColor:     theme.border,
                borderLeftColor: NETWORK_COLORS[req.sourceNetwork] ?? theme.border,
              }]}
            >
              {/* Top row */}
              <View style={styles.cardTop}>
                <View style={styles.routeRow}>
                  <View style={[
                    styles.netDot,
                    { backgroundColor: NETWORK_COLORS[req.sourceNetwork] ?? theme.muted },
                  ]} />
                  <Text style={[styles.network, { color: theme.text }]}>
                    {req.sourceNetwork}
                  </Text>
                  <Ionicons name="arrow-forward" size={12} color={theme.textDim} />
                  <View style={[
                    styles.netDot,
                    { backgroundColor: NETWORK_COLORS[req.destNetwork] ?? theme.muted },
                  ]} />
                  <Text style={[styles.network, { color: theme.text }]}>
                    {req.destNetwork}
                  </Text>
                </View>
                {req.urgent && (
                  <View style={styles.urgentTag}>
                    <Text style={styles.urgentText}>URGENT</Text>
                  </View>
                )}
              </View>

              {/* Amount + status */}
              <View style={styles.midRow}>
                <Text style={[styles.amount, { color: theme.primary }]}>
                  {fmt(Number(req.amount) || 0)}
                </Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: statusColor(req.status) + '20' },
                ]}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: statusColor(req.status) },
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: statusColor(req.status) },
                  ]}>
                    {req.status}
                  </Text>
                </View>
              </View>

              {/* Time */}
              <Text style={[styles.time, { color: theme.textDim }]}>
                {timeAgo(req.createdAt)}
              </Text>

              {/* Actions */}
              {req.status === 'pending' && (
                <TouchableOpacity
                  onPress={() => handleCancel(req)}
                  style={[styles.actionBtn, { borderColor: theme.border }]}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.actionText, { color: theme.textDim }]}>
                    Cancel Request
                  </Text>
                </TouchableOpacity>
              )}
              {req.status === 'rejected' && (
                <TouchableOpacity
                  onPress={() => handleRetry(req)}
                  style={[styles.actionBtn, { borderColor: theme.primary }]}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.actionText, { color: theme.primary }]}>
                    Retry Request
                  </Text>
                </TouchableOpacity>
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
  emptyText:  { fontSize: 14 },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical:   12,
    borderRadius:      12,
    marginTop:         4,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  card: {
    borderRadius:    16,
    borderWidth:     1,
    borderLeftWidth: 4,
    padding:         14,
    marginBottom:    10,
    gap:             8,
  },
  cardTop: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  netDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
  },
  network: { fontSize: 14, fontWeight: '600' },
  urgentTag: {
    backgroundColor:   '#F59E0B20',
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      6,
  },
  urgentText: {
    color:         '#F59E0B',
    fontSize:      10,
    fontWeight:    '700',
    letterSpacing: 0.6,
  },
  midRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  amount: { fontSize: 18, fontWeight: '800' },
  statusBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:      6,
  },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  time:       { fontSize: 12 },
  actionBtn: {
    height:         36,
    borderRadius:   10,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      4,
  },
  actionText: { fontSize: 13, fontWeight: '600' },
});