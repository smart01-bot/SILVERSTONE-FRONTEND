// src/screens/main-agent/QueueScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';
import { SkeletonBox } from '../../components/SkeletonLoader';
import EmptyState     from '../../components/EmptyState';
import PressableScale from '../../components/PressableScale';
import {
  collection, query, orderBy,
  onSnapshot, doc, updateDoc, Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';

const REJECTION_REASONS = [
  'Insufficient float',
  'Invalid phone number',
  'Duplicate request',
  'Other',
];

function SkeletonQueueCard({ theme }) {
  return (
    <View style={[s.card, {
      backgroundColor: theme.surfaceAlt,
      borderColor: theme.border, borderLeftColor: theme.border,
    }]}>
      <View style={s.cardTop}>
        <View style={s.agentRow}>
          <SkeletonBox width={44} height={44} borderRadius={22} />
          <View style={{ gap: spacing.xs - 2 }}>
            <SkeletonBox width={120} height={18} borderRadius={6} />
            <SkeletonBox width={80}  height={14} borderRadius={5} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm - 2 }}>
          <SkeletonBox width={60} height={26} borderRadius={6} />
          <SkeletonBox width={44} height={26} borderRadius={6} />
        </View>
      </View>
      <View style={s.routeRow}>
        <SkeletonBox width={80}  height={20} borderRadius={6} />
        <SkeletonBox width={16}  height={16} borderRadius={4} />
        <SkeletonBox width={80}  height={20} borderRadius={6} />
        <SkeletonBox width={100} height={22} borderRadius={6} style={{ marginLeft: 'auto' }} />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <SkeletonBox width={110} height={16} borderRadius={5} />
        <SkeletonBox width={90}  height={16} borderRadius={5} />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <SkeletonBox width="30%" height={46} borderRadius={radius.md} />
        <SkeletonBox width="40%" height={46} borderRadius={radius.md} />
        <SkeletonBox width="24%" height={46} borderRadius={radius.md} />
      </View>
    </View>
  );
}

export default function QueueScreen() {
  const { theme, isDark, tr } = useTheme();

  const [requests,   setRequests]   = useState([]);
  const [filter,     setFilter]     = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [actionLoad, setActionLoad] = useState(null);

  const FILTERS = ['All', 'Urgent', 'Pending', 'Approved'];
  const FILTER_LABELS = {
    All:      tr('queue'),
    Urgent:   tr('markUrgent').split(' ')[1] ?? 'Urgent',
    Pending:  tr('statusPending'),
    Approved: tr('statusApproved'),
  };

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'requests'), orderBy('createdAt', 'desc')),
      snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => {
          if (a.urgent && !b.urgent) return -1;
          if (!a.urgent && b.urgent) return 1;
          return 0;
        });
        setRequests(docs);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const filtered = requests.filter(r => {
    if (filter === 'All')      return r.status === 'pending' || r.status === 'approved';
    if (filter === 'Urgent')   return r.status === 'pending' && r.urgent;
    if (filter === 'Pending')  return r.status === 'pending';
    if (filter === 'Approved') return r.status === 'approved';
    return true;
  });

  const pendingCount  = requests.filter(r => r.status === 'pending').length;
  const urgentCount   = requests.filter(r => r.status === 'pending' && r.urgent).length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;

  const waitMins  = (ts) => { if (!ts?.toDate) return 0; return Math.floor((Date.now() - ts.toDate().getTime()) / 60000); };
  const waitColor = (m)  => { if (m < 5) return '#16A34A'; if (m < 15) return '#F59E0B'; return '#C8102E'; };

  const handleApprove = async (req) => {
    setActionLoad(req.id + '_approve');
    try {
      await updateDoc(doc(db, 'requests', req.id), { status: 'approved', approvedAt: Timestamp.now() });
    } catch (e) { Alert.alert('Error', 'Failed to approve request.'); }
    finally { setActionLoad(null); }
  };

  const handleProcess = async (req) => {
    Alert.alert(
      'Process Transfer',
      `Confirm transfer of TZS ${Number(req.amount).toLocaleString()} from ${req.sourceNetwork} to ${req.destNetwork}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm', style: 'destructive',
          onPress: async () => {
            setActionLoad(req.id + '_process');
            try {
              await updateDoc(doc(db, 'requests', req.id), { status: 'completed', processedAt: Timestamp.now() });
            } catch (e) { Alert.alert('Error', 'Failed to process transfer.'); }
            finally { setActionLoad(null); }
          },
        },
      ]
    );
  };

  const handleReject = (req) => {
    Alert.alert('Reject Request', 'Select a reason:', [
      ...REJECTION_REASONS.map(reason => ({
        text: reason,
        onPress: async () => {
          setActionLoad(req.id + '_reject');
          try {
            await updateDoc(doc(db, 'requests', req.id), {
              status: 'rejected', rejectionReason: reason, rejectedAt: Timestamp.now(),
            });
          } catch (e) { Alert.alert('Error', 'Failed to reject request.'); }
          finally { setActionLoad(null); }
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); };

  const emptyMessages = {
    All:      { title: tr('queueClear'),                                subtitle: tr('queueEmptyDesc') },
    Urgent:   { title: `${tr('statusPending')} — ${tr('markUrgent')}`,  subtitle: tr('noPendingDesc') },
    Pending:  { title: tr('statusPending'),                             subtitle: tr('noPendingDesc') },
    Approved: { title: tr('statusApproved'),                            subtitle: tr('queueEmptyDesc') },
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Gradient header ── */}
      <LinearGradient
        colors={[theme.gradPrimA, theme.gradPrimB]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.header}
      >
        <View style={s.headerDecor} />
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>Queue</Text>
            <Text style={s.headerSub}>
              {pendingCount} pending · {urgentCount} urgent · {approvedCount} approved
            </Text>
          </View>
          <View style={s.iconBtn}>
            <Ionicons name="options-outline" size={22} color="#fff" />
          </View>
        </View>
      </LinearGradient>

      {/* ── Filter pills ── */}
      <View style={[s.filters, { backgroundColor: theme.bg }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.filterRow}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[s.pill, {
                  backgroundColor: filter === f ? theme.primary : theme.surfaceAlt,
                  borderColor:     filter === f ? theme.primary : theme.border,
                }]}
                activeOpacity={0.75}
              >
                <Text style={[s.pillText, { color: filter === f ? '#fff' : theme.textDim }]}>
                  {FILTER_LABELS[f] ?? f}
                  {f === 'Urgent'  && urgentCount  > 0 ? ` ${urgentCount}`  : ''}
                  {f === 'Pending' && pendingCount  > 0 ? ` ${pendingCount}` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#C8102E']} tintColor="#C8102E" />}
      >
        {loading ? (
          <>
            <SkeletonQueueCard theme={theme} />
            <SkeletonQueueCard theme={theme} />
            <SkeletonQueueCard theme={theme} />
          </>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="checkmark-circle-outline"
            title={emptyMessages[filter].title}
            subtitle={emptyMessages[filter].subtitle}
          />
        ) : (
          filtered.map(req => {
            const mins = waitMins(req.createdAt);
            return (
              <PressableScale
                key={req.id}
                scaleDown={0.98}
                style={[s.card, {
                  backgroundColor: theme.surfaceAlt,
                  borderColor:     theme.border,
                  borderLeftColor: req.urgent ? '#F59E0B' : theme.border,
                }]}
              >
                <View style={s.cardTop}>
                  <View style={s.agentRow}>
                    <View style={[s.avatar, { backgroundColor: theme.primaryLight }]}>
                      <Text style={[s.avatarText, { color: theme.primary }]}>
                        {req.agentName?.charAt(0)?.toUpperCase() ?? 'A'}
                      </Text>
                    </View>
                    <View>
                      <Text style={[s.agentName, { color: theme.text }]}>{req.agentName ?? 'Agent'}</Text>
                      <Text style={[s.agentSub,  { color: theme.textDim }]}>Waiting {mins} min</Text>
                    </View>
                  </View>
                  <View style={s.cardTopRight}>
                    {req.urgent && (
                      <View style={s.urgentTag}>
                        <Text style={s.urgentText}>URGENT</Text>
                      </View>
                    )}
                    <View style={[s.waitBadge, { backgroundColor: waitColor(mins) + '20' }]}>
                      <Text style={[s.waitText, { color: waitColor(mins) }]}>{mins}m</Text>
                    </View>
                  </View>
                </View>

                <View style={s.routeRow}>
                  <Text style={[s.route,  { color: theme.text }]}>{req.sourceNetwork}</Text>
                  <Ionicons name="arrow-forward" size={16} color={theme.textDim} />
                  <Text style={[s.route,  { color: theme.text }]}>{req.destNetwork}</Text>
                  <Text style={[s.amount, { color: theme.primary }]}>TZS {Number(req.amount).toLocaleString()}</Text>
                </View>

                <View style={s.phonesRow}>
                  <Text style={[s.phone, { color: theme.textDim }]}>From: {req.sourcePhone}</Text>
                  <Text style={[s.phone, { color: theme.textDim }]}>To: {req.destPhone}</Text>
                </View>

                <View style={s.actions}>
                  {req.status === 'pending' && (
                    <TouchableOpacity onPress={() => handleApprove(req)} style={[s.btnOutline, { borderColor: '#0891B2' }]} activeOpacity={0.75}>
                      {actionLoad === req.id + '_approve'
                        ? <ActivityIndicator size="small" color="#0891B2" />
                        : <Text style={[s.btnOutlineText, { color: '#0891B2' }]}>Approve</Text>
                      }
                    </TouchableOpacity>
                  )}
                  {(req.status === 'pending' || req.status === 'approved') && (
                    <TouchableOpacity onPress={() => handleProcess(req)} style={[s.btnFilled, { backgroundColor: '#C8102E' }]} activeOpacity={0.85}>
                      {actionLoad === req.id + '_process'
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={s.btnFilledText}>Process</Text>
                      }
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleReject(req)} style={[s.btnOutline, { borderColor: theme.border }]} activeOpacity={0.75}>
                    {actionLoad === req.id + '_reject'
                      ? <ActivityIndicator size="small" color={theme.textDim} />
                      : <Text style={[s.btnOutlineText, { color: theme.textDim }]}>Reject</Text>
                    }
                  </TouchableOpacity>
                </View>
              </PressableScale>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: 100 },

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
  headerRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 30, fontFamily: fonts.display, color: '#fff' },
  headerSub:   { fontSize: 17, fontFamily: fonts.body, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  iconBtn: {
    width: 42, height: 42, borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  filters:   { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md },
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md - 2, paddingVertical: spacing.sm + 1,
    borderRadius: radius.full, borderWidth: 1,
  },
  pillText: { fontSize: 17, fontFamily: fonts.bodySemi },

  card: {
    borderRadius: radius.lg, borderWidth: 1, borderLeftWidth: 4,
    padding: spacing.md, marginBottom: spacing.md - 4, gap: spacing.md - 4,
  },
  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  agentRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:   { fontSize: 20, fontFamily: fonts.bodyBold },
  agentName:    { fontSize: 20, fontFamily: fonts.bodyBold },
  agentSub:     { fontSize: 17, fontFamily: fonts.body, marginTop: 1 },
  cardTopRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm - 2 },
  urgentTag: {
    backgroundColor: '#F59E0B20', paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 1, borderRadius: radius.sm - 2,
  },
  urgentText: { color: '#F59E0B', fontSize: 13, fontFamily: fonts.bodyBold, letterSpacing: 0.6 },
  waitBadge:  { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs - 1, borderRadius: radius.sm - 2 },
  waitText:   { fontSize: 15, fontFamily: fonts.bodyBold },

  routeRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  route:     { fontSize: 20, fontFamily: fonts.bodyBold },
  amount:    { fontSize: 22, fontFamily: fonts.bodyXBold, marginLeft: 'auto' },
  phonesRow: { flexDirection: 'row', gap: spacing.md },
  phone:     { fontSize: 17, fontFamily: fonts.body },

  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  btnOutline: {
    flex: 1, height: 46, borderRadius: radius.md, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  btnOutlineText: { fontSize: 17, fontFamily: fonts.bodySemi },
  btnFilled: {
    flex: 1, height: 46, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnFilledText: { color: '#fff', fontSize: 17, fontFamily: fonts.bodyBold },
});
