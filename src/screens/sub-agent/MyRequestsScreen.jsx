// src/screens/sub-agent/MyRequestsScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  RefreshControl, Alert,
} from 'react-native';
import { Ionicons }       from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth }        from '../../context/AuthContext';
import { useTheme }       from '../../context/ThemeContext';
import { fonts, spacing, radius } from '../../constants/theme';
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
      case 'rejected':  return theme.danger;
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

  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); };

  const emptyConfig = () => {
    if (filter !== 'all') {
      return { icon: 'funnel-outline', title: `No ${filter} requests`, subtitle: 'Try a different filter above.' };
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
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient
        colors={[theme.gradPrimA, theme.gradPrimB]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.header}
      >
        <View style={s.headerDecor} />
        <Text style={s.headerTitle}>{tr('myRequests')}</Text>
        <Text style={s.headerSub}>{loading ? '…' : `${requests.length} total`}</Text>
      </LinearGradient>

      <View style={[s.filters, { backgroundColor: theme.bg }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.filterRow}>
            {FILTERS.map(f => (
              <PressableScale
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[s.pill, {
                  backgroundColor: filter === f.key ? theme.primary : theme.surfaceAlt,
                  borderColor:     filter === f.key ? theme.primary : theme.border,
                }]}
                scaleDown={0.94}
              >
                <Text style={[s.pillText, { color: filter === f.key ? '#fff' : theme.textDim }]}>
                  {f.label}
                </Text>
              </PressableScale>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
        }
      >
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
              style={[s.card, {
                backgroundColor: theme.surfaceAlt,
                borderColor:     theme.border,
                borderLeftColor: NETWORK_COLORS[req.sourceNetwork] ?? theme.border,
              }]}
              scaleDown={0.98}
            >
              <View style={s.cardTop}>
                <View style={s.routeRow}>
                  <View style={[s.netDot, { backgroundColor: NETWORK_COLORS[req.sourceNetwork] ?? theme.muted }]} />
                  <Text style={[s.network, { color: theme.text }]}>{req.sourceNetwork}</Text>
                  <Ionicons name="arrow-forward" size={14} color={theme.textDim} />
                  <View style={[s.netDot, { backgroundColor: NETWORK_COLORS[req.destNetwork] ?? theme.muted }]} />
                  <Text style={[s.network, { color: theme.text }]}>{req.destNetwork}</Text>
                </View>
                {req.urgent && (
                  <View style={s.urgentTag}>
                    <Text style={s.urgentText}>URGENT</Text>
                  </View>
                )}
              </View>

              <View style={s.midRow}>
                <Text style={[s.amount, { color: theme.primary }]}>
                  {fmt(Number(req.amount) || 0)}
                </Text>
                <View style={[s.statusBadge, { backgroundColor: statusColor(req.status) + '20' }]}>
                  <View style={[s.statusDot, { backgroundColor: statusColor(req.status) }]} />
                  <Text style={[s.statusText, { color: statusColor(req.status) }]}>
                    {req.status}
                  </Text>
                </View>
              </View>

              <Text style={[s.time, { color: theme.textDim }]}>{timeAgo(req.createdAt)}</Text>

              {req.status === 'pending' && (
                <TouchableOpacity
                  onPress={() => handleCancel(req)}
                  style={[s.actionBtn, { borderColor: theme.border }]}
                  activeOpacity={0.75}
                >
                  <Text style={[s.actionText, { color: theme.textDim }]}>{tr('cancel')}</Text>
                </TouchableOpacity>
              )}
              {req.status === 'rejected' && (
                <TouchableOpacity
                  onPress={() => handleRetry(req)}
                  style={[s.actionBtn, { borderColor: theme.primary }]}
                  activeOpacity={0.75}
                >
                  <Text style={[s.actionText, { color: theme.primary }]}>{tr('tryAgain')}</Text>
                </TouchableOpacity>
              )}
            </PressableScale>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: 110 },

  header: {
    paddingHorizontal:       spacing.md + 2,
    paddingTop:              spacing.xxl + spacing.sm,
    paddingBottom:           spacing.lg,
    borderBottomLeftRadius:  radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow:                'hidden',
  },
  headerDecor: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -40,
  },
  headerTitle: { fontSize: 30, fontFamily: fonts.display, color: '#fff' },
  headerSub:   { fontSize: 17, fontFamily: fonts.body, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  filters:   { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md },
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md - 2, paddingVertical: spacing.sm + 1,
    borderRadius: radius.full, borderWidth: 1,
  },
  pillText: { fontSize: 16, fontFamily: fonts.bodySemi },

  card: {
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderLeftWidth: 4,
    padding:         spacing.md,
    marginBottom:    spacing.md - 4,
    gap:             spacing.sm + 2,
  },
  cardTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  routeRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm - 1 },
  netDot:     { width: 10, height: 10, borderRadius: 5 },
  network:    { fontSize: 18, fontFamily: fonts.bodyBold },
  urgentTag:  { backgroundColor: '#F59E0B20', paddingHorizontal: spacing.sm + 1, paddingVertical: spacing.xs, borderRadius: radius.sm - 2 },
  urgentText: { color: '#F59E0B', fontSize: 13, fontFamily: fonts.bodyBold, letterSpacing: 0.6 },

  midRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amount:      { fontSize: 24, fontFamily: fonts.display },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 1, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs + 1, borderRadius: radius.sm - 2 },
  statusDot:   { width: 7, height: 7, borderRadius: 4 },
  statusText:  { fontSize: 15, fontFamily: fonts.bodyBold },
  time:        { fontSize: 15, fontFamily: fonts.body },
  actionBtn:   { height: 44, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs },
  actionText:  { fontSize: 16, fontFamily: fonts.bodyBold },
});
