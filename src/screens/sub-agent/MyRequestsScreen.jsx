// src/screens/sub-agent/MyRequestsScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  RefreshControl, Alert,
} from 'react-native';
import { Ionicons }    from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth }     from '../../context/AuthContext';
import { useTheme }    from '../../context/ThemeContext';
import { SkeletonCard } from '../../components/SkeletonLoader';
import EmptyState       from '../../components/EmptyState';
import PressableScale   from '../../components/PressableScale';
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
  const { user }              = useAuth();
  const { theme, isDark, tr } = useTheme();

  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const FILTERS = [
    { key: 'all',       label: 'All'                 },
    { key: 'pending',   label: tr('statusPending')   },
    { key: 'approved',  label: tr('statusApproved')  },
    { key: 'completed', label: tr('statusCompleted') },
    { key: 'rejected',  label: tr('statusRejected')  },
  ];

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(
      query(
        collection(db, 'requests'),
        where('agentId', '==', user.uid),
        orderBy('createdAt', 'desc')
      ),
      snap => {
        setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );
    return unsub;
  }, [user?.uid]);

  const filtered = requests
    .filter(r => filter === 'all' || r.status === filter)
    .sort((a, b) => {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      return 0;
    });

  const handleCancel = (req) => {
    Alert.alert(tr('cancel'), 'Je, una uhakika unataka kufuta ombi hili?', [
      { text: tr('cancel'), style: 'cancel' },
      {
        text: tr('confirm'), style: 'destructive',
        onPress: async () => {
          try { await updateDoc(doc(db, 'requests', req.id), { status: 'cancelled' }); }
          catch (e) { Alert.alert(tr('error'), tr('error')); }
        },
      },
    ]);
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
    if (secs < 60)     return tr('justNow');
    if (secs < 3600)   return `${Math.floor(secs / 60)} ${tr('minAgo')}`;
    if (secs < 86400)  return `${Math.floor(secs / 3600)}h ago`;
    if (secs < 172800) return tr('yesterday');
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

  // Empty state config per filter
  const emptyConfig = () => {
    if (filter !== 'all') {
      return {
        icon:     'funnel-outline',
        title:    `No ${filter} requests`,
        subtitle: 'Try a different filter above.',
      };
    }
    return {
      icon:        'receipt-outline',
      title:       tr('noRequests'),
      subtitle:    tr('noRequestsDesc'),
      actionLabel: tr('newRequest'),
      onAction:    () => navigation.navigate('NewRequest'),
    };
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#C8102E" />

      <LinearGradient
        colors={[theme.gradPrimA, theme.gradPrimB]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>{tr('myRequests')}</Text>
        <Text style={styles.headerSub}>{loading ? '…' : `${requests.length} total`}</Text>
      </LinearGradient>

      {/* Filter pills */}
      <View style={[styles.filters, { backgroundColor: theme.bg }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {FILTERS.map(f => (
              <PressableScale
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: filter === f.key ? theme.primary : theme.surfaceAlt,
                    borderColor:     filter === f.key ? theme.primary : theme.border,
                  },
                ]}
                scaleDown={0.94}
              >
                <Text style={[styles.pillText, { color: filter === f.key ? '#fff' : theme.textDim }]}>
                  {f.label}
                </Text>
              </PressableScale>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#C8102E']} tintColor="#C8102E" />
        }
      >
        {/* Loading skeletons */}
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filtered.length === 0 ? (
          <EmptyState {...emptyConfig()} />
        ) : (
          filtered.map(req => (
            <PressableScale
              key={req.id}
              style={[styles.card, {
                backgroundColor: theme.surfaceAlt,
                borderColor:     theme.border,
                borderLeftColor: NETWORK_COLORS[req.sourceNetwork] ?? theme.border,
              }]}
              scaleDown={0.98}
            >
              {/* Top row */}
              <View style={styles.cardTop}>
                <View style={styles.routeRow}>
                  <View style={[styles.netDot, { backgroundColor: NETWORK_COLORS[req.sourceNetwork] ?? theme.muted }]} />
                  <Text style={[styles.network, { color: theme.text }]}>{req.sourceNetwork}</Text>
                  <Ionicons name="arrow-forward" size={14} color={theme.textDim} />
                  <View style={[styles.netDot, { backgroundColor: NETWORK_COLORS[req.destNetwork] ?? theme.muted }]} />
                  <Text style={[styles.network, { color: theme.text }]}>{req.destNetwork}</Text>
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
                <View style={[styles.statusBadge, { backgroundColor: statusColor(req.status) + '20' }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor(req.status) }]} />
                  <Text style={[styles.statusText, { color: statusColor(req.status) }]}>
                    {req.status}
                  </Text>
                </View>
              </View>

              <Text style={[styles.time, { color: theme.textDim }]}>{timeAgo(req.createdAt)}</Text>

              {/* Actions */}
              {req.status === 'pending' && (
                <TouchableOpacity
                  onPress={() => handleCancel(req)}
                  style={[styles.actionBtn, { borderColor: theme.border }]}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.actionText, { color: theme.textDim }]}>{tr('cancel')}</Text>
                </TouchableOpacity>
              )}
              {req.status === 'rejected' && (
                <TouchableOpacity
                  onPress={() => handleRetry(req)}
                  style={[styles.actionBtn, { borderColor: theme.primary }]}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.actionText, { color: theme.primary }]}>{tr('tryAgain')}</Text>
                </TouchableOpacity>
              )}
            </PressableScale>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: 16, paddingBottom: 110 },

  header: {
    paddingHorizontal:       18,
    paddingTop:              12,
    paddingBottom:           22,
    borderBottomLeftRadius:  26,
    borderBottomRightRadius: 26,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 16, color: 'rgba(255,255,255,0.75)', marginTop: 3 },

  filters:   { paddingVertical: 12, paddingHorizontal: 16 },
  filterRow: { flexDirection: 'row', gap: 8 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 9999, borderWidth: 1,
  },
  pillText: { fontSize: 16, fontWeight: '600' },

  card: {
    borderRadius: 18, borderWidth: 1,
    borderLeftWidth: 4, padding: 16,
    marginBottom: 12, gap: 10,
  },
  cardTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  routeRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  netDot:     { width: 10, height: 10, borderRadius: 5 },
  network:    { fontSize: 18, fontWeight: '700' },
  urgentTag:  { backgroundColor: '#F59E0B20', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7 },
  urgentText: { color: '#F59E0B', fontSize: 13, fontWeight: '700', letterSpacing: 0.6 },

  midRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amount:      { fontSize: 24, fontWeight: '800' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7 },
  statusDot:   { width: 7, height: 7, borderRadius: 4 },
  statusText:  { fontSize: 15, fontWeight: '700' },
  time:        { fontSize: 15 },
  actionBtn:   { height: 42, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  actionText:  { fontSize: 16, fontWeight: '700' },
});
