// src/screens/sub-agent/HomeScreen.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  RefreshControl, Animated,
} from 'react-native';
import { Ionicons }        from '@expo/vector-icons';
import { LinearGradient }  from 'expo-linear-gradient';
import { useAuth }         from '../../context/AuthContext';
import { useTheme }        from '../../context/ThemeContext';
import { SkeletonBalance, SkeletonCard, SkeletonNetRow } from '../../components/SkeletonLoader';
import EmptyState          from '../../components/EmptyState';
import {
  collection, query, where, orderBy, limit, onSnapshot,
} from 'firebase/firestore';
import { db } from '../../config/firebase';

const NETWORKS = {
  Voda:    { color: '#E40000', short: 'VOD' },
  Yas:     { color: '#0070B8', short: 'YAS' },
  Airtel:  { color: '#FF0000', short: 'AIR' },
  Halotel: { color: '#D4A017', short: 'HAL' },
};

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

  // Card mount animation
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardY       = useRef(new Animated.Value(16)).current;

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

      // Animate content in once data arrives
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(cardY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]).start();
    });
    return unsub;
  }, [user?.uid]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

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
      case 'rejected':  return '#C8102E';
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
  const reqId = (id) => `REQ-${id?.slice(-3).toUpperCase() ?? '000'}`;

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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.openDrawer()}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {pendingCount > 0 && (
            <View style={[styles.avatarBadge, { borderColor: theme.bg }]}>
              <Text style={styles.avatarBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={[styles.brandName, { color: theme.primary }]}>Silverstone</Text>

        <TouchableOpacity style={[styles.notifBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Ionicons name="notifications-outline" size={22} color={theme.text} />
          {pendingCount > 0 && <View style={styles.notifDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#C8102E']} tintColor="#C8102E" />
        }
      >
        {/* Greeting */}
        <View style={styles.greetRow}>
          <Text style={[styles.greetSub,  { color: theme.textDim }]}>Karibu</Text>
          <Text style={[styles.greetName, { color: theme.text }]}>{firstName}</Text>
        </View>

        {/* Balance card — LinearGradient */}
        {loading ? (
          <SkeletonBalance />
        ) : (
          <Animated.View style={{ opacity: cardOpacity, transform: [{ translateY: cardY }] }}>
            <LinearGradient
              colors={[theme.gradPrimA, theme.gradPrimB]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              {/* Decorative circles */}
              <View style={styles.decorCircle}  />
              <View style={styles.decorCircle2} />

              <Text style={styles.balanceLabel}>{tr('totalVolume').toUpperCase()}</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceAmount}>
                  {showAmount ? fmt(totalVolume) : 'TZS ••••••'}
                </Text>
                <TouchableOpacity onPress={() => setShowAmount(v => !v)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showAmount ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color="rgba(255,255,255,0.8)"
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.balanceSub}>
                +{fmt(todayVolume)} {tr('today')} · {profile?.networks?.length || 4} networks
              </Text>

              <View style={styles.pillRow}>
                <TouchableOpacity
                  style={styles.pillWhite}
                  onPress={() => navigation.navigate('NewRequest')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.pillWhiteText}>{tr('newRequest')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pillOutline}
                  onPress={() => navigation.navigate('MyRequests')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.pillOutlineText}>{tr('myRequests')}</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Quick actions */}
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.label}
              onPress={action.onPress}
              style={[styles.quickItem, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
              activeOpacity={0.75}
            >
              <View style={[styles.quickIcon, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name={action.icon} size={24} color={theme.primary} />
              </View>
              <Text style={[styles.quickLabel, { color: theme.text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Network breakdown */}
        {loading ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Networks</Text>
            </View>
            <View style={[styles.networkCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <SkeletonNetRow />
              <SkeletonNetRow />
            </View>
          </View>
        ) : networkBreakdown.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Networks</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Networks')}>
                <Text style={[styles.sectionAction, { color: theme.primary }]}>Manage</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.networkCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              {networkBreakdown.map((net, i) => (
                <View key={net.name} style={[
                  styles.netRow,
                  i < networkBreakdown.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                ]}>
                  <View style={styles.netLeft}>
                    <View style={[styles.netDot, { backgroundColor: net.color }]} />
                    <Text style={[styles.netName, { color: theme.text }]}>{net.name}</Text>
                  </View>
                  <View style={styles.netBarWrap}>
                    <View style={[styles.netBarBg, { backgroundColor: theme.border }]}>
                      <View style={[styles.netBarFill, {
                        backgroundColor: net.color,
                        width: `${(net.volume / maxVolume) * 100}%`,
                      }]} />
                    </View>
                  </View>
                  <Text style={[styles.netAmount, { color: theme.text }]}>{fmt(net.volume)}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Recent requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{tr('recentRequests')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyRequests')}>
              <Text style={[styles.sectionAction, { color: theme.primary }]}>{tr('seeAll')} →</Text>
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
            <View style={[styles.requestsCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              {recentRequests.map((req, i) => (
                <View key={req.id}>
                  <View style={styles.reqRow}>
                    <View style={[styles.reqNetDot, { backgroundColor: NETWORKS[req.sourceNetwork]?.color ?? theme.muted }]} />
                    <View style={styles.reqInfo}>
                      <Text style={[styles.reqRoute, { color: theme.text }]}>
                        {req.sourceNetwork} → {req.destNetwork}
                      </Text>
                      <Text style={[styles.reqMeta, { color: theme.textDim }]}>
                        {reqId(req.id)} · {timeAgo(req.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.reqRight}>
                      <Text style={[styles.reqAmount, { color: theme.primary }]}>
                        {fmt(Number(req.amount) || 0)}
                      </Text>
                      <View style={[styles.statusPill, { backgroundColor: statusColor(req.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor(req.status) }]}>
                          {req.status?.charAt(0).toUpperCase() + req.status?.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {i < recentRequests.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
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

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingBottom: 120 },

  topBar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 18,
    paddingVertical:   13,
    borderBottomWidth: 1,
  },
  brandName:       { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  avatarBtn:       { position: 'relative' },
  avatarCircle:    { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText:      { color: '#fff', fontWeight: '700', fontSize: 17 },
  avatarBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: '#C8102E', borderRadius: 9999,
    minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 2,
  },
  avatarBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  notifBtn: {
    width: 44, height: 44, borderRadius: 13, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 9, right: 9,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#C8102E',
  },

  greetRow: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8 },
  greetSub:  { fontSize: 17, marginBottom: 2 },
  greetName: { fontSize: 28, fontWeight: '800' },

  // Balance card
  balanceCard: {
    marginHorizontal: 16,
    marginTop:        8,
    borderRadius:     22,
    padding:          22,
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
  balanceLabel:  { fontSize: 14, fontWeight: '600', letterSpacing: 1.4, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase' },
  balanceRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  balanceAmount: { fontSize: 36, fontWeight: '800', letterSpacing: -0.8, color: '#fff', flex: 1 },
  eyeBtn:        { padding: 4 },
  balanceSub:    { fontSize: 16, color: 'rgba(255,255,255,0.75)', marginTop: 6 },
  pillRow:       { flexDirection: 'row', gap: 10, marginTop: 18 },
  pillWhite: {
    flex: 1, height: 44, borderRadius: 12,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  pillWhiteText:  { color: '#C8102E', fontWeight: '700', fontSize: 16 },
  pillOutline: {
    flex: 1, height: 44, borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  pillOutlineText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Quick actions
  quickGrid: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 18 },
  quickItem: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14, alignItems: 'center', gap: 8 },
  quickIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },

  // Sections
  section:       { paddingHorizontal: 16, marginTop: 22 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { fontSize: 19, fontWeight: '800' },
  sectionAction: { fontSize: 16, fontWeight: '600' },

  // Network breakdown
  networkCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  netRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  netLeft:     { flexDirection: 'row', alignItems: 'center', gap: 8, width: 80 },
  netDot:      { width: 10, height: 10, borderRadius: 5 },
  netName:     { fontSize: 16, fontWeight: '600' },
  netBarWrap:  { flex: 1 },
  netBarBg:    { height: 7, borderRadius: 4, overflow: 'hidden' },
  netBarFill:  { height: 7, borderRadius: 4 },
  netAmount:   { fontSize: 16, fontWeight: '700', width: 68, textAlign: 'right' },

  // Recent requests
  requestsCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  reqRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  reqNetDot:    { width: 10, height: 10, borderRadius: 5, flexShrink: 0, marginTop: 2 },
  reqInfo:      { flex: 1 },
  reqRoute:     { fontSize: 18, fontWeight: '700' },
  reqMeta:      { fontSize: 14, marginTop: 3, fontFamily: 'monospace' },
  reqRight:     { alignItems: 'flex-end', gap: 5 },
  reqAmount:    { fontSize: 17, fontWeight: '800' },
  statusPill:   { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7 },
  statusText:   { fontSize: 13, fontWeight: '700' },
  divider:      { height: 1, marginHorizontal: 16 },
});
