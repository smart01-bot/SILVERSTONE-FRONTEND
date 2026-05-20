// src/screens/sub-agent/HomeScreen.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  RefreshControl, Dimensions,
} from 'react-native';
import { Ionicons }       from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth }        from '../../context/AuthContext';
import { useTheme }       from '../../context/ThemeContext';
import { fonts, spacing, radius } from '../../constants/theme';
import { SkeletonBox, SkeletonCard, SkeletonNetRow } from '../../components/SkeletonLoader';
import {
  collection, query, where, orderBy, limit, onSnapshot,
} from 'firebase/firestore';
import { db } from '../../config/firebase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_H       = 210;
const SLIDE_INTERVAL = 3500;
const TRANSITION_MS  = 640; // must match scrollTo animation duration

const NETWORKS = {
  Voda:    { color: '#E40000', short: 'VOD' },
  Yas:     { color: '#0070B8', short: 'YAS' },
  Airtel:  { color: '#FF0000', short: 'AIR' },
  Halotel: { color: '#D4A017', short: 'HAL' },
};

const FILLER_REQUESTS = [
  { id: 'filler-1', sourceNetwork: 'Voda',    destNetwork: 'Airtel',  amount: 150000, status: 'completed', _filler: true },
  { id: 'filler-2', sourceNetwork: 'Airtel',  destNetwork: 'Halotel', amount: 80000,  status: 'pending',   _filler: true },
  { id: 'filler-3', sourceNetwork: 'Halotel', destNetwork: 'Voda',    amount: 200000, status: 'completed', _filler: true },
];

const FILLER_NETWORKS = [
  { name: 'Voda',    color: '#E40000', volume: 350000 },
  { name: 'Airtel',  color: '#FF0000', volume: 230000 },
  { name: 'Halotel', color: '#D4A017', volume: 120000 },
  { name: 'Yas',     color: '#0070B8', volume:  80000 },
];

// ─── Infinite carousel banner ─────────────────────────────────────────────────
// Renders [S1, S2, S3, S1, S2, S3] — always advances forward.
// When the duplicate set is reached it silently resets to position 0
// after the transition completes, making it imperceptibly infinite.
function BannerCard({
  loading, theme, tr,
  totalVolume, todayVolume, todayCount,
  latestCompleted, fmt, timeAgo, navigation,
}) {
  const scrollRef   = useRef(null);
  const slideIndex  = useRef(0);  // raw index into the 6-slide looped array
  const isResetting = useRef(false);
  const [activeDot, setActiveDot] = useState(0); // 0-2, real slide position

  const REAL_COUNT = 3;

  // Build slide data so looped array can be constructed at render
  const makeSlides = () => [
    { key: 'float'  },
    { key: 'last'   },
    { key: 'today'  },
    { key: 'float2' },
    { key: 'last2'  },
    { key: 'today2' },
  ];

  useEffect(() => {
    if (loading) return;

    const advance = () => {
      if (isResetting.current) return;

      const next = slideIndex.current + 1;
      slideIndex.current = next;
      setActiveDot(next % REAL_COUNT);
      scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });

      // When we land on the duplicate set (index 3), silently reset to 0
      // after the scroll animation completes
      if (next === REAL_COUNT) {
        isResetting.current = true;
        setTimeout(() => {
          slideIndex.current = 0;
          scrollRef.current?.scrollTo({ x: 0, animated: false });
          isResetting.current = false;
        }, TRANSITION_MS + 80);
      }
    };

    const id = setInterval(advance, SLIDE_INTERVAL);
    return () => clearInterval(id);
  }, [loading]);

  const onScroll = (e) => {
    if (isResetting.current) return;
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    slideIndex.current = idx;
    setActiveDot(idx % REAL_COUNT);
  };

  const cardPad = spacing.lg - 2;

  const renderSlide = (key, width) => {
    const baseKey = key.replace('2', '');

    if (baseKey === 'float') return (
      <View key={key} style={[s.slide, { width, padding: cardPad }]}>
        <Text style={s.slideEyebrow}>TOTAL FLOAT MOVED</Text>
        <Text style={s.slideAmount}>{fmt(totalVolume)}</Text>
        <Text style={s.slideSub}>+{fmt(todayVolume)} today · {todayCount} transfers</Text>
        <View style={s.pillRow}>
          <TouchableOpacity style={s.pillWhite} onPress={() => navigation.navigate('NewRequest')} activeOpacity={0.85}>
            <Text style={s.pillWhiteText}>{tr('newRequest')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.pillOutline} onPress={() => navigation.navigate('MyRequests')} activeOpacity={0.85}>
            <Text style={s.pillOutlineText}>{tr('myRequests')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );

    if (baseKey === 'last') return (
      <View key={key} style={[s.slide, { width, padding: cardPad, justifyContent: 'center' }]}>
        <Text style={s.slideEyebrow}>LAST COMPLETED TRANSFER</Text>
        {latestCompleted ? (
          <>
            <View style={s.routeRow}>
              <View style={[s.netBadge, { backgroundColor: NETWORKS[latestCompleted.sourceNetwork]?.color ?? '#fff' }]}>
                <Text style={s.netBadgeText}>{NETWORKS[latestCompleted.sourceNetwork]?.short ?? latestCompleted.sourceNetwork}</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.75)" />
              <View style={[s.netBadge, { backgroundColor: NETWORKS[latestCompleted.destNetwork]?.color ?? '#fff' }]}>
                <Text style={s.netBadgeText}>{NETWORKS[latestCompleted.destNetwork]?.short ?? latestCompleted.destNetwork}</Text>
              </View>
              <Text style={s.routeAmount}>{fmt(Number(latestCompleted.amount) || 0)}</Text>
            </View>
            <Text style={s.slideSub}>{latestCompleted._filler ? 'Sample · ' : ''}{timeAgo(latestCompleted.createdAt)}</Text>
            <View style={s.completedPill}>
              <Ionicons name="checkmark-circle" size={13} color="#16A34A" />
              <Text style={s.completedText}>Completed</Text>
            </View>
          </>
        ) : (
          <Text style={s.slideAmount}>No transfers yet</Text>
        )}
      </View>
    );

    if (baseKey === 'today') return (
      <View key={key} style={[s.slide, { width, padding: cardPad }]}>
        <Text style={s.slideEyebrow}>TODAY'S ACTIVITY</Text>
        <Text style={s.slideAmount}>{fmt(todayVolume)}</Text>
        <Text style={s.slideSub}>{todayCount} transfer{todayCount !== 1 ? 's' : ''} completed today</Text>
        <View style={s.pillRow}>
          <TouchableOpacity style={s.pillWhite} onPress={() => navigation.navigate('MyRequests')} activeOpacity={0.85}>
            <Text style={s.pillWhiteText}>View History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.pillOutline} onPress={() => navigation.navigate('NewRequest')} activeOpacity={0.85}>
            <Text style={s.pillOutlineText}>New Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    );

    return null;
  };

  return (
    <LinearGradient
      colors={[theme.gradPrimA, theme.gradPrimB]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[s.bannerCard, { height: CARD_H }]}
    >
      <View style={s.decorCircle}  pointerEvents="none" />
      <View style={s.decorCircle2} pointerEvents="none" />

      {loading ? (
        <View style={[s.slide, { padding: cardPad }]}>
          <SkeletonBox width={120} height={12} borderRadius={5} style={{ opacity: 0.35 }} />
          <SkeletonBox width={190} height={42} borderRadius={8} style={{ marginTop: 10, opacity: 0.35 }} />
          <SkeletonBox width={150} height={14} borderRadius={5} style={{ marginTop: 10, opacity: 0.35 }} />
          <View style={{ flexDirection: 'row', gap: spacing.sm + 2, marginTop: spacing.md }}>
            <SkeletonBox width="47%" height={42} borderRadius={radius.md} style={{ opacity: 0.25 }} />
            <SkeletonBox width="47%" height={42} borderRadius={radius.md} style={{ opacity: 0.25 }} />
          </View>
        </View>
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={onScroll}
            scrollEnabled={false}
            style={{ flex: 1 }}
          >
            {['float', 'last', 'today', 'float2', 'last2', 'today2'].map(k =>
              renderSlide(k, SCREEN_WIDTH)
            )}
          </ScrollView>

          {/* Dots */}
          <View style={s.dots}>
            {[0, 1, 2].map(i => (
              <View key={i} style={[
                s.dot,
                { backgroundColor: i === activeDot ? '#fff' : 'rgba(255,255,255,0.35)' },
                i === activeDot && s.dotActive,
              ]} />
            ))}
          </View>
        </>
      )}
    </LinearGradient>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { profile, user } = useAuth();
  const { theme, isDark, tr } = useTheme();

  const [requests,     setRequests]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [totalVolume,  setTotalVolume]  = useState(0);
  const [todayVolume,  setTodayVolume]  = useState(0);
  const [todayCount,   setTodayCount]   = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const firstName = profile?.name?.split(' ')[0] ?? 'Agent';
  const initials  = profile?.name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'AG';

  useEffect(() => {
    if (!user?.uid) return;
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
      let total = 0, todayV = 0, tCount = 0, pending = 0;
      docs.forEach(r => {
        const amt = Number(r.amount) || 0;
        total += amt;
        if (r.status === 'pending') pending++;
        if (r.createdAt?.toDate?.() >= today) { todayV += amt; tCount++; }
      });
      setTotalVolume(total);
      setTodayVolume(todayV);
      setTodayCount(tCount);
      setPendingCount(pending);
      setLoading(false);
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

  const timeAgo = (ts) => {
    if (!ts?.toDate) return '2h ago';
    const secs = Math.floor((Date.now() - ts.toDate().getTime()) / 1000);
    if (secs < 60)     return tr('justNow');
    if (secs < 3600)   return `${Math.floor(secs / 60)} ${tr('minAgo')}`;
    if (secs < 86400)  return `${Math.floor(secs / 3600)}h ago`;
    if (secs < 172800) return tr('yesterday');
    return ts.toDate().toLocaleDateString('en-TZ', { day: '2-digit', month: 'short' });
  };

  const hasRealData     = requests.length > 0;
  const displayRequests = hasRealData ? requests.slice(0, 4) : FILLER_REQUESTS;

  const realNetworkBreakdown = Object.entries(NETWORKS).map(([name, meta]) => {
    const net = requests.filter(r => r.sourceNetwork === name && r.status === 'completed');
    const vol = net.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    return { name, ...meta, volume: vol };
  }).filter(n => n.volume > 0);

  const displayNetworks = hasRealData ? realNetworkBreakdown : FILLER_NETWORKS;
  const maxVolume       = Math.max(...displayNetworks.map(n => n.volume), 1);

  const latestCompleted = hasRealData
    ? requests.find(r => r.status === 'completed') ?? null
    : FILLER_REQUESTS.find(r => r.status === 'completed');

  const reqId = (id) => `REQ-${id?.slice(-3).toUpperCase() ?? '000'}`;

  const QUICK_ACTIONS = [
    { label: tr('myRequests'), icon: 'list-outline',   onPress: () => navigation.navigate('MyRequests') },
    { label: tr('history'),    icon: 'time-outline',   onPress: () => navigation.navigate('MyRequests') },
    { label: 'Networks',       icon: 'wifi-outline',   onPress: () => navigation.navigate('Networks')   },
    { label: tr('profile'),    icon: 'person-outline', onPress: () => navigation.navigate('Profile')    },
  ];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

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
        <View style={s.greetRow}>
          <Text style={[s.greetSub,  { color: theme.textDim }]}>Karibu</Text>
          <Text style={[s.greetName, { color: theme.text }]}>{firstName}</Text>
        </View>

        <BannerCard
          loading={loading}
          theme={theme}
          tr={tr}
          totalVolume={totalVolume}
          todayVolume={todayVolume}
          todayCount={todayCount}
          latestCompleted={latestCompleted}
          fmt={fmt}
          timeAgo={timeAgo}
          navigation={navigation}
        />

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

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: theme.text }]}>Networks</Text>
            {!loading && (
              <TouchableOpacity onPress={() => navigation.navigate('Networks')}>
                <Text style={[s.sectionAction, { color: theme.primary }]}>Manage</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={[s.networkCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            {loading ? (
              <><SkeletonNetRow /><SkeletonNetRow /><SkeletonNetRow /><SkeletonNetRow /></>
            ) : (
              displayNetworks.map((net, i) => (
                <View key={net.name} style={[
                  s.netRow,
                  i < displayNetworks.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                ]}>
                  <View style={s.netLeft}>
                    <View style={[s.netDot, { backgroundColor: net.color }]} />
                    <Text style={[s.netName, { color: theme.text }]}>{net.name}</Text>
                  </View>
                  <View style={s.netBarWrap}>
                    <View style={[s.netBarBg, { backgroundColor: theme.border }]}>
                      <View style={[s.netBarFill, { backgroundColor: net.color, width: `${(net.volume / maxVolume) * 100}%` }]} />
                    </View>
                  </View>
                  <Text style={[s.netAmount, { color: theme.text }]}>{fmt(net.volume)}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: theme.text }]}>{tr('recentRequests')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyRequests')}>
              <Text style={[s.sectionAction, { color: theme.primary }]}>{tr('seeAll')} →</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
          ) : (
            <View style={[s.requestsCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              {displayRequests.map((req, i) => (
                <View key={req.id}>
                  <View style={s.reqRow}>
                    <View style={[s.reqNetDot, { backgroundColor: NETWORKS[req.sourceNetwork]?.color ?? theme.muted }]} />
                    <View style={s.reqInfo}>
                      <Text style={[s.reqRoute, { color: theme.text }]}>{req.sourceNetwork} → {req.destNetwork}</Text>
                      <Text style={[s.reqMeta, { color: theme.textDim }]}>{reqId(req.id)} · {timeAgo(req.createdAt)}</Text>
                    </View>
                    <View style={s.reqRight}>
                      <Text style={[s.reqAmount, { color: theme.primary }]}>{fmt(Number(req.amount) || 0)}</Text>
                      <View style={[s.statusPill, { backgroundColor: statusColor(req.status) + '20' }]}>
                        <Text style={[s.statusText, { color: statusColor(req.status) }]}>
                          {req.status?.charAt(0).toUpperCase() + req.status?.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {i < displayRequests.length - 1 && <View style={[s.divider, { backgroundColor: theme.border }]} />}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md + 2, paddingVertical: spacing.md - 3, borderBottomWidth: 1,
  },
  brandName: { fontSize: 26, fontFamily: fonts.display, letterSpacing: -0.5 },
  avatarBtn: { position: 'relative' },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 17 },
  avatarBadge: {
    position: 'absolute', top: -2, right: -2, backgroundColor: '#C8102E',
    borderRadius: radius.full, minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 2,
  },
  avatarBadgeText: { color: '#fff', fontSize: 13, fontFamily: fonts.bodyXBold },
  notifBtn: {
    width: 44, height: 44, borderRadius: radius.md + 1, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  notifDot: { position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: '#C8102E' },

  greetRow:  { paddingHorizontal: spacing.md + 2, paddingTop: spacing.md + 2, paddingBottom: spacing.sm },
  greetSub:  { fontSize: 17, fontFamily: fonts.body, marginBottom: 2 },
  greetName: { fontSize: 28, fontFamily: fonts.display },

  bannerCard: {
    marginHorizontal: spacing.md, marginTop: spacing.sm,
    borderRadius: radius.xxl - 4, overflow: 'hidden',
  },
  decorCircle:  { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.08)', top: -50, right: -50 },
  decorCircle2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: 20 },

  slide:       { flex: 1, justifyContent: 'space-between' },
  slideEyebrow:{ fontSize: 11, fontFamily: fonts.bodySemi, letterSpacing: 1.6, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' },
  slideAmount: { fontSize: 36, fontFamily: fonts.display, letterSpacing: -0.8, color: '#fff', marginTop: spacing.sm },
  slideSub:    { fontSize: 14, fontFamily: fonts.body, color: 'rgba(255,255,255,0.75)', marginTop: spacing.xs },

  pillRow: { flexDirection: 'row', gap: spacing.sm + 2, marginTop: spacing.md },
  pillWhite: { flex: 1, height: 44, borderRadius: radius.md, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  pillWhiteText:   { color: '#C8102E', fontFamily: fonts.bodyBold, fontSize: 15 },
  pillOutline: {
    flex: 1, height: 44, borderRadius: radius.md, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  pillOutlineText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 15 },

  routeRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  netBadge:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.sm, opacity: 0.9 },
  netBadgeText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 0.3 },
  routeAmount:  { marginLeft: spacing.sm, fontSize: 22, fontFamily: fonts.display, color: '#fff' },
  completedPill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm,
    backgroundColor: 'rgba(22,163,74,0.25)', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm,
  },
  completedText: { color: '#16A34A', fontFamily: fonts.bodySemi, fontSize: 13 },

  dots:      { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: spacing.md - 4 },
  dot:       { width: 6, height: 4, borderRadius: 2 },
  dotActive: { width: 18 },

  quickGrid: { flexDirection: 'row', gap: spacing.sm + 2, paddingHorizontal: spacing.md, marginTop: spacing.md + 2 },
  quickItem: { flex: 1, borderRadius: radius.lg, borderWidth: 1, padding: spacing.md - 2, alignItems: 'center', gap: spacing.sm },
  quickIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  quickLabel:{ fontSize: 14, fontFamily: fonts.bodyBold, textAlign: 'center' },

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