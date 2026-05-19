// src/screens/sub-agent/HomeScreen.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  RefreshControl, Animated,
} from 'react-native';
import { Ionicons }       from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth }        from '../../context/AuthContext';
import { useTheme }       from '../../context/ThemeContext';
import { fonts, spacing, radius } from '../../constants/theme';
import { SkeletonBalance, SkeletonCard, SkeletonNetRow } from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import {
  collection, query, where, orderBy, limit, onSnapshot,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { USE_MOCK } from '../../config/dev';

const NETWORKS = {
  Voda:    { color: '#E40000', short: 'VOD' },
  Yas:     { color: '#0070B8', short: 'YAS' },
  Airtel:  { color: '#FF0000', short: 'AIR' },
  Halotel: { color: '#D4A017', short: 'HAL' },
};

// ─── Mock data (USE_MOCK = true in dev.js) ────────────────────────────────────
const MOCK_REQUESTS = [
  { id: 'r1', sourceNetwork: 'Voda',    destNetwork: 'Airtel',  amount: 150000, status: 'completed', createdAt: { toDate: () => new Date(Date.now() - 3_600_000) } },
  { id: 'r2', sourceNetwork: 'Airtel',  destNetwork: 'Yas',     amount: 75000,  status: 'pending',   createdAt: { toDate: () => new Date(Date.now() - 900_000)   } },
  { id: 'r3', sourceNetwork: 'Yas',     destNetwork: 'Halotel', amount: 300000, status: 'rejected',  createdAt: { toDate: () => new Date(Date.now() - 86_400_000) } },
  { id: 'r4', sourceNetwork: 'Halotel', destNetwork: 'Voda',    amount: 500000, status: 'completed', createdAt: { toDate: () => new Date(Date.now() - 7_200_000)  } },
  { id: 'r5', sourceNetwork: 'Voda',    destNetwork: 'Yas',     amount: 200000, status: 'approved',  createdAt: { toDate: () => new Date(Date.now() - 1_800_000)  } },
];

export default function HomeScreen({ navigation }) {
  const { profile, user } = useAuth();
  const { theme, isDark, tr } = useTheme();

  const [requests,     setRequests]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [totalVolume,  setTotalVolume]  = useState(0);
  const [todayVolume,  setTodayVolume]  = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [showAmount,   setShowAmount]   = useState(true);

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardY       = useRef(new Animated.Value(16)).current;

  const firstName = profile?.name?.split(' ')[0] ?? 'Agent';
  const initials  = profile?.name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'AG';

  useEffect(() => {
    if (!user?.uid) return;

    // ── Mock mode: skip Firestore entirely ───────────────────────────────────
    if (USE_MOCK) {
      const docs = MOCK_REQUESTS;
      setRequests(docs);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      let total = 0, todayV = 0, pending = 0;
      docs.forEach(r => {
        const amt = Number(r.amount) || 0;
        total += amt;
        if (r.status === 'pending') pending++;
        if (r.createdAt?.toDate?.() >= today) todayV += amt;
      });
      setTotalVolume(total);
      setTodayVolume(todayV);
      setPendingCount(pending);
      setLoading(false);
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(cardY,       { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]).start();
      return;
    }

    // ── Live Firestore ────────────────────────────────────────────────────────
    const q = query(
      collection(db, 'requests'),
      where('agentId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRequests(docs);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      let total = 0, todayV = 0, pending = 0;
      docs.forEach(r => {
        const amt = Number(r.amount) || 0;
        total += amt;
        if (r.status === 'pending') pending++;
        if (r.createdAt?.toDate?.() >= today) todayV += amt;
      });
      setTotalVolume(total);
      setTodayVolume(todayV);
      setPendingCount(pending);
      setLoading(false);
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(cardY,       { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]).start();
    }, () => setLoading(false));
    return unsub;
  }, [user?.uid]);

  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); };

  const fmt = (n) => {
    if (n >= 1_000_000) return `TZS ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `TZS ${(n / 1_000).toFixed(0)}k`;
    return `TZS ${n}`;
  };

  const statusColor = (status) => {
    switch (status) {
      case 'completed': return '#16A34A';
      case 'pending':   return '#F59E0B';
      case 'approved':  return '#0891B2';
      case 'rejected':  return theme.danger;
      default:          return theme.textDim;
    }
  };

  const networkBreakdown = Object.entries(NETWORKS).map(([name, meta]) => {
    const net = requests.filter(r => r.sourceNetwork === name && r.status === 'completed');
    const vol = net.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    return { name, ...meta, volume: vol, count: net.length };
  }).filter(n => n.volume > 0);

  const maxVolume      = Math.max(...networkBreakdown.map(n => n.volume), 1);
  const recentRequests = requests.slice(0, 4);
  const reqId          = (id) => `REQ-${id?.slice(-3).toUpperCase() ?? '000'}`;

  const timeAgo = (ts) => {
    if (!ts?.toDate) return '';
    const secs = Math.floor((Date.now() - ts.toDate().getTime()) / 1000);
    if (secs < 60)     return tr('justNow');
    if (secs < 3600)   return `${Math.floor(secs / 60)} ${tr('minAgo')}`;
    if (secs < 86400)  return `${Math.floor(secs / 3600)}h ago`;
    if (secs < 172800) return tr('yesterday');
    return ts.toDate().toLocaleDateString('en-TZ', { day: '2-digit', month: 'short' });
  };

  const QUICK_ACTIONS = [
    { label: tr('myRequests'), icon: 'list-outline',   onPress: () => navigation.navigate('MyRequests') },
    { label: tr('history'),    icon: 'time-outline',   onPress: () => navigation.navigate('MyRequests') },
    { label: 'Networks',       icon: 'wifi-outline',   onPress: () => navigation.navigate('Networks')   },
    { label: tr('profile'),    icon: 'person-outline', onPress: () => navigation.navigate('Profile')    },
  ];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      {/* Top bar */}
      <View style={[s.topBar, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={s.avatarBtn} onPress={() => navigation.openDrawer()}>
          <View style={[s.avatarCircle, { backgroundColor: theme.primary }]}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          {pendingCount > 0 && (
            <View style={[s.avatarBadge, { borderColor: theme.bg }]}>
              <Text style={s.avatarBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={[s.brandName, { color: theme.primary }]}>Silverstone</Text>

        <TouchableOpacity style={[s.notifBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Ionicons name="notifications-outline" size={22} color={theme.text} />
          {pendingCount > 0 && <View style={s.notifDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
        }
      >
        {/* Greeting */}
        <View style={s.greetRow}>
          <Text style={[s.greetSub,  { color: theme.textDim }]}>Karibu</Text>
          <Text style={[s.greetName, { color: theme.text }]}>{firstName}</Text>
        </View>

        {/* Balance card */}
        {loading ? (
          <SkeletonBalance />
        ) : (
          <Animated.View style={{ opacity: cardOpacity, transform: [{ translateY: cardY }] }}>
            <LinearGradient
              colors={[theme.gradPrimA, theme.gradPrimB]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.balanceCard}
            >
              <View style={s.decorCircle}  />
              <View style={s.decorCircle2} />

              <Text style={s.balanceLabel}>{tr('totalVolume').toUpperCase()}</Text>
              <View style={s.balanceRow}>
                <Text style={s.balanceAmount}>
                  {showAmount ? fmt(totalVolume) : 'TZS ••••••'}
                </Text>
                <TouchableOpacity onPress={() => setShowAmount(v => !v)} style={s.eyeBtn}>
                  <Ionicons
                    name={showAmount ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color="rgba(255,255,255,0.8)"
                  />
                </TouchableOpacity>
              </View>
              <Text style={s.balanceSub}>
                +{fmt(todayVolume)} {tr('today')} · {profile?.networks?.length || 4} networks
              </Text>

              <View style={s.pillRow}>
                <TouchableOpacity
                  style={s.pillWhite}
                  onPress={() => navigation.navigate('NewRequest')}
                  activeOpacity={0.85}
                >
                  <Text style={s.pillWhiteText}>{tr('newRequest')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.pillOutline}
                  onPress={() => navigation.navigate('MyRequests')}
                  activeOpacity={0.85}
                >
                  <Text style={s.pillOutlineText}>{tr('myRequests')}</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Quick actions */}
        <View style={s.quickGrid}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.label}
              onPress={action.onPress}
              style={[s.quickItem, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
              activeOpacity={0.75}
            >
              <View style={[s.quickIcon, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name={action.icon} size={24} color={theme.primary} />
              </View>
              <Text style={[s.quickLabel, { color: theme.text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Network breakdown */}
        {loading ? (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: theme.text }]}>Networks</Text>
            </View>
            <View style={[s.networkCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <SkeletonNetRow />
              <SkeletonNetRow />
            </View>
          </View>
        ) : networkBreakdown.length > 0 ? (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: theme.text }]}>Networks</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Networks')}>
                <Text style={[s.sectionAction, { color: theme.primary }]}>Manage</Text>
              </TouchableOpacity>
            </View>
            <View style={[s.networkCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              {networkBreakdown.map((net, i) => (
                <View key={net.name} style={[
                  s.netRow,
                  i < networkBreakdown.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                ]}>
                  <View style={s.netLeft}>
                    <View style={[s.netDot, { backgroundColor: net.color }]} />
                    <Text style={[s.netName, { color: theme.text }]}>{net.name}</Text>
                  </View>
                  <View style={s.netBarWrap}>
                    <View style={[s.netBarBg, { backgroundColor: theme.border }]}>
                      <View style={[s.netBarFill, {
                        backgroundColor: net.color,
                        width: `${(net.volume / maxVolume) * 100}%`,
                      }]} />
                    </View>
                  </View>
                  <Text style={[s.netAmount, { color: theme.text }]}>{fmt(net.volume)}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Recent requests */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: theme.text }]}>{tr('recentRequests')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyRequests')}>
              <Text style={[s.sectionAction, { color: theme.primary }]}>{tr('seeAll')} →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : recentRequests.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title={tr('noRequests')}
              subtitle={tr('noRequestsDesc')}
              actionLabel={tr('newRequest')}
              onAction={() => navigation.navigate('NewRequest')}
            />
          ) : (
            <View style={[s.requestsCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              {recentRequests.map((req, i) => (
                <View key={req.id}>
                  <View style={s.reqRow}>
                    <View style={[s.reqNetDot, { backgroundColor: NETWORKS[req.sourceNetwork]?.color ?? theme.muted }]} />
                    <View style={s.reqInfo}>
                      <Text style={[s.reqRoute, { color: theme.text }]}>
                        {req.sourceNetwork} → {req.destNetwork}
                      </Text>
                      <Text style={[s.reqMeta, { color: theme.textDim }]}>
                        {reqId(req.id)} · {timeAgo(req.createdAt)}
                      </Text>
                    </View>
                    <View style={s.reqRight}>
                      <Text style={[s.reqAmount, { color: theme.primary }]}>
                        {fmt(Number(req.amount) || 0)}
                      </Text>
                      <View style={[s.statusPill, { backgroundColor: statusColor(req.status) + '20' }]}>
                        <Text style={[s.statusText, { color: statusColor(req.status) }]}>
                          {req.status?.charAt(0).toUpperCase() + req.status?.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
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
  scroll: { paddingBottom: 120 },

  topBar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: spacing.md + 2,
    paddingVertical:   spacing.md - 3,
    borderBottomWidth: 1,
  },
  brandName:       { fontSize: 26, fontFamily: fonts.display, letterSpacing: -0.5 },
  avatarBtn:       { position: 'relative' },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:      { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 17 },
  avatarBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: '#C8102E', borderRadius: radius.full,
    minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 2,
  },
  avatarBadgeText: { color: '#fff', fontSize: 13, fontFamily: fonts.bodyXBold },
  notifBtn: {
    width: 44, height: 44, borderRadius: radius.md + 1, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 9, right: 9,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#C8102E',
  },

  greetRow: { paddingHorizontal: spacing.md + 2, paddingTop: spacing.md + 2, paddingBottom: spacing.sm },
  greetSub:  { fontSize: 17, fontFamily: fonts.body, marginBottom: 2 },
  greetName: { fontSize: 28, fontFamily: fonts.display },

  balanceCard: {
    marginHorizontal: spacing.md,
    marginTop:        spacing.sm,
    borderRadius:     radius.xxl - 4,
    padding:          spacing.lg - 2,
    overflow:         'hidden',
  },
  decorCircle: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)', top: -50, right: -50,
  },
  decorCircle2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: 20,
  },
  balanceLabel:  { fontSize: 14, fontFamily: fonts.bodySemi, letterSpacing: 1.4, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase' },
  balanceRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, marginTop: spacing.sm },
  balanceAmount: { fontSize: 36, fontFamily: fonts.display, letterSpacing: -0.8, color: '#fff', flex: 1 },
  eyeBtn:        { padding: spacing.xs },
  balanceSub:    { fontSize: 16, fontFamily: fonts.body, color: 'rgba(255,255,255,0.75)', marginTop: spacing.sm - 2 },
  pillRow:       { flexDirection: 'row', gap: spacing.sm + 2, marginTop: spacing.md + 2 },
  pillWhite: {
    flex: 1, height: 46, borderRadius: radius.md,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  pillWhiteText:  { color: '#C8102E', fontFamily: fonts.bodyBold, fontSize: 16 },
  pillOutline: {
    flex: 1, height: 46, borderRadius: radius.md, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  pillOutlineText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 16 },

  quickGrid: { flexDirection: 'row', gap: spacing.sm + 2, paddingHorizontal: spacing.md, marginTop: spacing.md + 2 },
  quickItem: { flex: 1, borderRadius: radius.lg, borderWidth: 1, padding: spacing.md - 2, alignItems: 'center', gap: spacing.sm },
  quickIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 14, fontFamily: fonts.bodyBold, textAlign: 'center' },

  section:       { paddingHorizontal: spacing.md, marginTop: spacing.lg - 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md - 4 },
  sectionTitle:  { fontSize: 21, fontFamily: fonts.heading },
  sectionAction: { fontSize: 16, fontFamily: fonts.bodySemi },

  networkCard: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  netRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, padding: spacing.md - 2 },
  netLeft:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, width: 80 },
  netDot:      { width: 10, height: 10, borderRadius: 5 },
  netName:     { fontSize: 16, fontFamily: fonts.bodySemi },
  netBarWrap:  { flex: 1 },
  netBarBg:    { height: 7, borderRadius: 4, overflow: 'hidden' },
  netBarFill:  { height: 7, borderRadius: 4 },
  netAmount:   { fontSize: 16, fontFamily: fonts.bodyBold, width: 68, textAlign: 'right' },

  requestsCard: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  reqRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 4, padding: spacing.md },
  reqNetDot:    { width: 10, height: 10, borderRadius: 5, flexShrink: 0, marginTop: 2 },
  reqInfo:      { flex: 1 },
  reqRoute:     { fontSize: 18, fontFamily: fonts.bodyBold },
  reqMeta:      { fontSize: 14, marginTop: 3, fontFamily: 'monospace' },
  reqRight:     { alignItems: 'flex-end', gap: spacing.xs + 1 },
  reqAmount:    { fontSize: 17, fontFamily: fonts.bodyXBold },
  statusPill:   { paddingHorizontal: spacing.sm + 1, paddingVertical: spacing.xs, borderRadius: radius.sm - 2 },
  statusText:   { fontSize: 13, fontFamily: fonts.bodyBold },
  divider:      { height: 1, marginHorizontal: spacing.md },
});