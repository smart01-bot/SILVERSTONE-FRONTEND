// src/screens/main-agent/OverviewScreen.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  RefreshControl, Animated, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';
import { SkeletonBox, SkeletonCard } from '../../components/SkeletonLoader';
import EmptyState    from '../../components/EmptyState';
import PressableScale from '../../components/PressableScale';
import {
  collection, query, where, orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../config/firebase';

// ─── Animated stat card ───────────────────────────────────────────────────────
function StatCard({ stat, index, theme }) {
  const mountAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(mountAnim, {
      toValue:         1,
      tension:         80,
      friction:        10,
      delay:           index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{
      opacity:   mountAnim,
      transform: [{ scale: mountAnim.interpolate({ inputRange: [0,1], outputRange: [0.92,1] }) }],
      width: '47%',
    }}>
      <View style={[s.statCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <View style={[s.statIcon, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name={stat.icon} size={20} color={theme.primary} />
        </View>
        <Text style={[s.statValue, { color: theme.text }]}>
          {stat.isText ? stat.value : stat.value.toLocaleString()}
        </Text>
        <Text style={[s.statLabel, { color: theme.textDim }]}>{stat.label}</Text>
        <Text style={[s.statSub,   { color: stat.subColor }]}>{stat.sub}</Text>
      </View>
    </Animated.View>
  );
}

export default function OverviewScreen({ navigation }) {
  const { profile } = useAuth();
  const { theme, isDark, tr } = useTheme();
  const STATUS_TOP = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]       = useState(false);
  const [totalRequests,   setTotalRequests]    = useState(0);
  const [pendingRequests, setPendingRequests]  = useState(0);
  const [completedToday,  setCompletedToday]   = useState(0);
  const [activeAgents,    setActiveAgents]     = useState(0);
  const [totalVolume,     setTotalVolume]      = useState(0);
  const [recentRequests,  setRecentRequests]   = useState([]);

  const initials = profile?.name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'MA';

  const fmt = (n) => {
    if (n >= 1_000_000) return `TSh ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `TSh ${(n / 1_000).toFixed(0)}k`;
    return `TSh ${n}`;
  };

  const reqId   = (id) => `REQ-${id?.slice(-3).toUpperCase() ?? '000'}`;
  const timeAgo = (ts) => {
    if (!ts?.toDate) return '';
    const secs = Math.floor((Date.now() - ts.toDate().getTime()) / 1000);
    if (secs < 60)     return tr('justNow');
    if (secs < 3600)   return `${Math.floor(secs / 60)} ${tr('minAgo')}`;
    if (secs < 86400)  return `${Math.floor(secs / 3600)}h ago`;
    if (secs < 172800) return tr('yesterday');
    return ts.toDate().toLocaleDateString('en-TZ', { day: '2-digit', month: 'short' });
  };

  const statusColor = (status) => {
    switch (status) {
      case 'completed': return '#16A34A';
      case 'pending':   return '#F59E0B';
      case 'approved':  return '#0891B2';
      case 'rejected':  return '#C8102E';
      default:          return theme.textDim;
    }
  };

  useEffect(() => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    const reqUnsub = onSnapshot(
      query(collection(db, 'requests'), orderBy('createdAt', 'desc')),
      snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTotalRequests(docs.length);
        setRecentRequests(docs.slice(0, 5));
        let pending = 0, compToday = 0, volume = 0;
        docs.forEach(r => {
          if (r.status === 'pending') pending++;
          if (r.status === 'completed' && r.processedAt?.toDate?.() >= todayStart) compToday++;
          if (r.status === 'completed') volume += Number(r.amount) || 0;
        });
        setPendingRequests(pending);
        setCompletedToday(compToday);
        setTotalVolume(volume);
        setLoading(false);
      },
      (err) => {
        console.warn('OverviewScreen requests snapshot error:', err);
        setLoading(false);
      }
    );

    const agentUnsub = onSnapshot(
      query(
        collection(db, 'agents'),
        where('status', '==', 'approved'),
        where('role',   '==', 'sub-agent')
      ),
      snap => setActiveAgents(snap.size),
      (err) => console.warn('OverviewScreen agents snapshot error:', err)
    );

    return () => { reqUnsub(); agentUnsub(); };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const STATS = [
    {
      label:    tr('totalRequests'),
      value:    totalRequests,
      sub:      `${pendingRequests} ${tr('pending')}`,
      subColor: pendingRequests > 0 ? '#C8102E' : '#16A34A',
      icon:     'document-text-outline',
    },
    {
      label:    tr('totalTx'),
      value:    completedToday,
      sub:      tr('completed'),
      subColor: '#16A34A',
      icon:     'swap-horizontal-outline',
    },
    {
      label:    tr('activeAgents'),
      value:    activeAgents,
      sub:      tr('registered'),
      subColor: theme.textDim,
      icon:     'people-outline',
    },
    {
      label:    tr('totalVolume'),
      value:    fmt(totalVolume),
      sub:      tr('moved'),
      subColor: '#16A34A',
      icon:     'cash-outline',
      isText:   true,
    },
  ];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Top bar */}
      <View style={[s.topBar, { backgroundColor: theme.bg, borderBottomColor: theme.border, paddingTop: STATUS_TOP + spacing.md - 3 }]}>
        <TouchableOpacity
          style={s.menuBtn}
          onPress={() => navigation.openDrawer()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={[s.menuLine, { backgroundColor: theme.text }]} />
          <View style={[s.menuLine, { width: 20, backgroundColor: theme.text }]} />
          <View style={[s.menuLine, { width: 16, backgroundColor: theme.text }]} />
        </TouchableOpacity>

        <View style={s.brandWrap}>
          <Text style={[s.brandName, { color: theme.primary }]}>Silverstone</Text>
          <Text style={[s.brandSub,  { color: theme.textDim }]}>{tr('adminDashboard')}</Text>
        </View>

        <View style={s.topRight}>
          <View style={[s.livePill, { backgroundColor: '#16A34A20' }]}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>LIVE</Text>
          </View>
          <TouchableOpacity style={s.avatarBtn} onPress={() => navigation.openDrawer()}>
            <View style={[s.avatarCircle, { backgroundColor: theme.primary }]}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            {pendingRequests > 0 && (
              <View style={[s.avatarBadge, { borderColor: theme.bg }]}>
                <Text style={s.avatarBadgeText}>{pendingRequests}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#C8102E']} tintColor="#C8102E" />
        }
      >
        {/* ── Hero gradient card ── */}
        <LinearGradient
          colors={[theme.gradPrimA, theme.gradPrimB]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.heroCard}
        >
          <View style={s.decorCircle} />
          <View style={s.decorCircle2} />
          <Text style={s.heroLabel}>{tr('totalVolume').toUpperCase()} · 30D</Text>
          {loading ? (
            <SkeletonBox width={200} height={48} borderRadius={10} style={{ marginTop: 6, opacity: 0.35 }} />
          ) : (
            <Text style={s.heroAmount}>{fmt(totalVolume)}</Text>
          )}
          <View style={s.heroSubRow}>
            <Ionicons name="trending-up-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={s.heroSub}>+{fmt(totalVolume * 0.124)} {tr('vsLastMonth')}</Text>
          </View>
        </LinearGradient>

        {/* ── Stat cards 2×2 ── */}
        <View style={s.statsGrid}>
          {loading
            ? [0,1,2,3].map(i => (
                <View key={i} style={{ width: '47%' }}>
                  <View style={[s.statCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                    <SkeletonBox width={40} height={40} borderRadius={radius.md} />
                    <SkeletonBox width={60} height={28} borderRadius={6} style={{ marginTop: spacing.sm }} />
                    <SkeletonBox width={90} height={16} borderRadius={5} style={{ marginTop: 4 }} />
                    <SkeletonBox width={70} height={14} borderRadius={5} style={{ marginTop: 2 }} />
                  </View>
                </View>
              ))
            : STATS.map((stat, i) => (
                <StatCard key={stat.label} stat={stat} index={i} theme={theme} />
              ))
          }
        </View>

        {/* ── Monthly activity ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: theme.text }]}>{tr('monthlyActivity')}</Text>
            <View style={s.legendRow}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: '#C8102E' }]} />
                <Text style={[s.legendText, { color: theme.textDim }]}>Reqs</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: '#0891B2' }]} />
                <Text style={[s.legendText, { color: theme.textDim }]}>Txns</Text>
              </View>
            </View>
          </View>
          <View style={[s.chartCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Text style={[s.chartLabel, { color: theme.textDim }]}>
              {tr('totalRequests')} vs {tr('totalTx')} · {totalRequests} {tr('totalTx').toLowerCase()}
            </Text>
            <View style={s.chartBars}>
              {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 1.0].map((h, i) => (
                <View key={i} style={s.barGroup}>
                  <View style={[s.bar, { height: h * 140, backgroundColor: '#C8102E', opacity: 0.85 }]} />
                  <View style={[s.bar, { height: h * 0.7 * 140, backgroundColor: '#0891B2', opacity: 0.85 }]} />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Recent requests ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: theme.text }]}>{tr('recentRequests')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Queue')}>
              <Text style={[s.sectionAction, { color: theme.primary }]}>{tr('queue')} →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : recentRequests.length === 0 ? (
            <EmptyState
              icon="checkmark-circle-outline"
              title="Queue is clear"
              subtitle="No pending requests right now"
            />
          ) : (
            <View style={[s.requestsCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              {recentRequests.map((req, i) => (
                <View key={req.id}>
                  <PressableScale
                    onPress={() => navigation.navigate('Queue')}
                    style={s.reqRow}
                  >
                    <View style={[s.reqDot, { backgroundColor: statusColor(req.status) }]} />
                    <View style={s.reqInfo}>
                      <Text style={[s.reqAgent,  { color: theme.text }]}>{req.agentName ?? 'Agent'}</Text>
                      <Text style={[s.reqMeta,   { color: theme.textDim }]}>
                        {reqId(req.id)} · {req.sourceNetwork} → {req.destNetwork}
                        {req.urgent ? ' · URGENT' : ''}
                      </Text>
                      <Text style={[s.reqTime,   { color: theme.textDim }]}>{timeAgo(req.createdAt)}</Text>
                    </View>
                    <View style={s.reqRight}>
                      <Text style={[s.reqAmount, { color: theme.primary }]}>
                        {req.amount >= 1000 ? `TSh ${(req.amount / 1000).toFixed(0)}k` : `TSh ${req.amount}`}
                      </Text>
                      <View style={[s.statusPill, { backgroundColor: statusColor(req.status) + '20' }]}>
                        <Text style={[s.statusText, { color: statusColor(req.status) }]}>
                          {tr('status' + (req.status ? req.status.charAt(0).toUpperCase() + req.status.slice(1) : 'Pending'))}
                        </Text>
                      </View>
                    </View>
                  </PressableScale>
                  {i < recentRequests.length - 1 && (
                    <View style={[s.divider, { backgroundColor: theme.border }]} />
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingBottom: 100 },

  topBar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: spacing.md + 2,
    paddingVertical:   spacing.md - 4,
    borderBottomWidth: 1,
  },
  menuBtn:   { gap: spacing.xs + 1, padding: spacing.xs },
  menuLine:  { width: 24, height: 2, borderRadius: 2 },
  brandWrap: { alignItems: 'center' },
  brandName: { fontSize: 22, fontFamily: fonts.display, letterSpacing: -0.4 },
  brandSub:  { fontSize: 13, fontFamily: fonts.body, marginTop: 1 },
  topRight:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  livePill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical:   spacing.xs,
    borderRadius:      radius.sm - 2,
  },
  liveDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  liveText: { fontSize: 13, fontFamily: fonts.bodyBold, color: '#16A34A', letterSpacing: 0.6 },
  avatarBtn:    { position: 'relative' },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 17 },
  avatarBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: '#C8102E', borderRadius: radius.full,
    minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 2,
  },
  avatarBadgeText: { color: '#fff', fontSize: 13, fontFamily: fonts.bodyXBold },

  heroCard: {
    marginHorizontal: spacing.md,
    marginTop:        spacing.md,
    borderRadius:     radius.xl,
    padding:          spacing.md + 4,
    overflow:         'hidden',
  },
  decorCircle: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)', top: -40, right: -40,
  },
  decorCircle2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: -20,
  },
  heroLabel:  { fontSize: 15, fontFamily: fonts.bodySemi, letterSpacing: 1.2, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase' },
  heroAmount: { fontSize: 44, fontFamily: fonts.display, letterSpacing: -0.8, color: '#fff', marginTop: spacing.sm - 2 },
  heroSubRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  heroSub:    { fontSize: 17, fontFamily: fonts.body, color: 'rgba(255,255,255,0.75)' },

  statsGrid: {
    flexDirection:     'row',
    flexWrap:          'wrap',
    gap:               spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginTop:         spacing.md,
  },
  statCard: {
    borderRadius: radius.lg, borderWidth: 1,
    padding: spacing.md - 2, gap: spacing.xs,
  },
  statIcon: {
    width: 40, height: 40, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm - 2,
  },
  statValue: { fontSize: 30, fontFamily: fonts.display },
  statLabel: { fontSize: 17, fontFamily: fonts.bodySemi },
  statSub:   { fontSize: 15, fontFamily: fonts.body },

  section:       { paddingHorizontal: spacing.md, marginTop: spacing.md + 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md - 4 },
  sectionTitle:  { fontSize: 21, fontFamily: fonts.heading },
  sectionAction: { fontSize: 17, fontFamily: fonts.bodySemi },

  chartCard:  { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md },
  chartLabel: { fontSize: 15, fontFamily: fonts.body, marginBottom: spacing.md - 4 },
  chartBars:  { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, height: 140 },
  barGroup:   { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar:        { flex: 1, borderRadius: radius.sm - 5 },
  legendRow:  { flexDirection: 'row', gap: spacing.md - 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 15, fontFamily: fonts.body },

  requestsCard: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  reqRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm + 2, padding: spacing.md - 2 },
  reqDot:       { width: 10, height: 10, borderRadius: 5, flexShrink: 0, marginTop: 4 },
  reqInfo:      { flex: 1, gap: 2 },
  reqAgent:     { fontSize: 18, fontFamily: fonts.bodyBold },
  reqMeta:      { fontSize: 15, fontFamily: fonts.mono },
  reqTime:      { fontSize: 14, fontFamily: fonts.body },
  reqRight:     { alignItems: 'flex-end', gap: spacing.xs },
  reqAmount:    { fontSize: 18, fontFamily: fonts.bodyBold },
  statusPill:   { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm - 2 },
  statusText:   { fontSize: 14, fontFamily: fonts.bodyBold },
  divider:      { height: 1, marginHorizontal: spacing.md - 2 },
});
