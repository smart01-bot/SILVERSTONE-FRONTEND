// src/screens/sub-agent/HomeScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { formatAmount } from '../../utils/time';

const NETWORKS = {
  Voda:    { color: '#E40000', short: 'VOD' },
  Yas:     { color: '#0070B8', short: 'YAS' },
  Airtel:  { color: '#FF0000', short: 'AIR' },
  Halotel: { color: '#D4A017', short: 'HAL' },
};

export default function HomeScreen({ navigation }) {
  const { profile, user } = useAuth();
  const { theme, isDark } = useTheme();

  const [requests,     setRequests]     = useState([]);
  const [refreshing,   setRefreshing]   = useState(false);
  const [totalVolume,  setTotalVolume]  = useState(0);
  const [todayVolume,  setTodayVolume]  = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [showAmount,   setShowAmount]   = useState(true);

  const firstName = profile?.name?.split(' ')[0] ?? 'Agent';
  const initials  = profile?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'AG';

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Karibu' : hour < 17 ? 'Karibu' : 'Karibu';

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

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let total   = 0;
      let todayV  = 0;
      let pending = 0;

      docs.forEach(r => {
        const amt = Number(r.amount) || 0;
        total += amt;
        if (r.status === 'pending') pending++;
        if (r.createdAt?.toDate?.() >= today) todayV += amt;
      });

      setTotalVolume(total);
      setTodayVolume(todayV);
      setPendingCount(pending);
    });

    return unsub;
  }, [user?.uid]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const activeNetworks = profile?.networks ?? [];

  const networkBreakdown = Object.entries(NETWORKS).map(([name, meta]) => {
    const netRequests = requests.filter(r =>
      r.sourceNetwork === name && r.status === 'completed'
    );
    const volume = netRequests.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    return { name, ...meta, volume, count: netRequests.length };
  }).filter(n => n.volume > 0);

  const recentRequests = requests.slice(0, 4);

  const fmt = (n) => {
    if (n >= 1_000_000) return `TZS ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `TZS ${(n / 1_000).toFixed(0)}k`;
    return `TZS ${n}`;
  };

  const statusColor = (status) => {
    switch (status) {
      case 'completed': return '#16A34A';
      case 'pending':   return '#F59E0B';
      case 'rejected':  return '#C8102E';
      default:          return theme.textDim;
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#C8102E"
      />

      {/* Red header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.karibu}>{greeting}</Text>
            <Text style={styles.agentName}>{profile?.name ?? 'Agent'}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="scan-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="notifications-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
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
        {/* Balance card */}
        <View style={styles.balanceCard}>
          {/* Decorative circle */}
          <View style={styles.decorCircle} />

          <Text style={styles.balanceLabel}>TOTAL VOLUME MOVED</Text>

          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>
              {showAmount ? fmt(totalVolume) : 'TZS ••••••'}
            </Text>
            <TouchableOpacity
              onPress={() => setShowAmount(v => !v)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showAmount ? 'eye-outline' : 'eye-off-outline'}
                size={18}
                color="rgba(255,255,255,0.8)"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.balanceSub}>
            +{fmt(todayVolume)} today · {activeNetworks.length || 4} networks
          </Text>

          {/* Pill buttons */}
          <View style={styles.pillRow}>
            <TouchableOpacity
              style={styles.pillWhite}
              onPress={() => navigation.navigate('NewRequest')}
              activeOpacity={0.85}
            >
              <Text style={styles.pillWhiteText}>New Request</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pillOutline}
              onPress={() => navigation.navigate('MyRequests')}
              activeOpacity={0.85}
            >
              <Text style={styles.pillOutlineText}>My Requests</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <View style={styles.quickGrid}>
            {[
              { label: 'Send',    icon: 'arrow-up-outline',      screen: 'NewRequest' },
              { label: 'Receive', icon: 'arrow-down-outline',    screen: 'MyRequests' },
              { label: 'History', icon: 'time-outline',          screen: 'MyRequests' },
              { label: 'Profile', icon: 'person-outline',        screen: 'Profile'    },
            ].map(action => (
              <TouchableOpacity
                key={action.label}
                onPress={() => navigation.navigate(action.screen)}
                style={[styles.quickItem, {
                  backgroundColor: theme.surfaceAlt,
                  borderColor:     theme.border,
                }]}
                activeOpacity={0.75}
              >
                <View style={[styles.quickIcon, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name={action.icon} size={20} color={theme.primary} />
                </View>
                <Text style={[styles.quickLabel, { color: theme.text }]}>
                  {action.label}
                </Text>
                {action.label === 'Send' && pendingCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pendingCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Networks */}
        {networkBreakdown.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Networks
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                <Text style={[styles.sectionAction, { color: theme.primary }]}>
                  Manage
                </Text>
              </TouchableOpacity>
            </View>

            {networkBreakdown.map(net => (
              <View
                key={net.name}
                style={[styles.netRow, {
                  backgroundColor: theme.surfaceAlt,
                  borderColor:     theme.border,
                }]}
              >
                <View style={[styles.netAvatar, { backgroundColor: net.color + '20' }]}>
                  <Text style={[styles.netShort, { color: net.color }]}>
                    {net.short}
                  </Text>
                </View>
                <View style={styles.netInfo}>
                  <Text style={[styles.netName, { color: theme.text }]}>
                    {net.name}
                  </Text>
                  <Text style={[styles.netSub, { color: theme.textDim }]}>
                    Float · {net.count} transfers
                  </Text>
                </View>
                <Text style={[styles.netAmount, { color: theme.text }]}>
                  {fmt(net.volume)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Recent Requests
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyRequests')}>
              <Text style={[styles.sectionAction, { color: theme.primary }]}>
                See all
              </Text>
            </TouchableOpacity>
          </View>

          {recentRequests.length === 0 ? (
            <View style={[styles.emptyCard, {
              backgroundColor: theme.surfaceAlt,
              borderColor:     theme.border,
            }]}>
              <Ionicons name="document-outline" size={32} color={theme.muted} />
              <Text style={[styles.emptyText, { color: theme.textDim }]}>
                No requests yet
              </Text>
            </View>
          ) : (
            <View style={[styles.requestsCard, {
              backgroundColor: theme.surfaceAlt,
              borderColor:     theme.border,
            }]}>
              {recentRequests.map((req, i) => (
                <View key={req.id}>
                  <View style={styles.reqRow}>
                    <View style={[styles.reqDot, { backgroundColor: statusColor(req.status) }]} />
                    <View style={styles.reqInfo}>
                      <Text style={[styles.reqRoute, { color: theme.text }]}>
                        {req.sourceNetwork} → {req.destNetwork}
                      </Text>
                      <Text style={[styles.reqStatus, { color: theme.textDim }]}>
                        {req.status} · {req.urgent ? 'Urgent' : 'Normal'}
                      </Text>
                    </View>
                    <Text style={[styles.reqAmount, { color: theme.primary }]}>
                      {fmt(Number(req.amount) || 0)}
                    </Text>
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
  scroll: { paddingBottom: 100 },

  // Header
  header: {
    backgroundColor:   '#C8102E',
    paddingHorizontal: 18,
    paddingTop:        10,
    paddingBottom:     14,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    borderBottomLeftRadius:  24,
    borderBottomRightRadius: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  avatar: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarText: {
    color:      '#fff',
    fontWeight: '700',
    fontSize:   14,
  },
  karibu: {
    fontSize: 12,
    color:    'rgba(255,255,255,0.75)',
  },
  agentName: {
    fontSize:   15,
    fontWeight: '700',
    color:      '#fff',
    marginTop:  1,
  },
  headerRight: {
    flexDirection: 'row',
    gap:           10,
  },
  iconBtn: {
    width:          34,
    height:         34,
    borderRadius:   10,
    backgroundColor:'rgba(255,255,255,0.15)',
    alignItems:     'center',
    justifyContent: 'center',
  },

  // Balance card
  balanceCard: {
    backgroundColor: '#C8102E',
    marginHorizontal: 16,
    marginTop:        16,
    borderRadius:     20,
    padding:          20,
    overflow:         'hidden',
  },
  decorCircle: {
    position:        'absolute',
    width:           160,
    height:          160,
    borderRadius:    80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top:             -40,
    right:           -40,
  },
  balanceLabel: {
    fontSize:      11,
    fontWeight:    '600',
    letterSpacing: 1.2,
    color:         'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    marginTop:     6,
  },
  balanceAmount: {
    fontSize:      28,
    fontWeight:    '800',
    letterSpacing: -0.6,
    color:         '#fff',
    flex:          1,
  },
  eyeBtn: { padding: 4 },
  balanceSub: {
    fontSize:  13,
    color:     'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  pillRow: {
    flexDirection: 'row',
    gap:           10,
    marginTop:     16,
  },
  pillWhite: {
    flex:           1,
    height:         36,
    borderRadius:   10,
    backgroundColor:'#fff',
    alignItems:     'center',
    justifyContent: 'center',
  },
  pillWhiteText: {
    color:      '#C8102E',
    fontWeight: '700',
    fontSize:   13,
  },
  pillOutline: {
    flex:           1,
    height:         36,
    borderRadius:   10,
    borderWidth:    1,
    borderColor:    'rgba(255,255,255,0.4)',
    backgroundColor:'rgba(255,255,255,0.1)',
    alignItems:     'center',
    justifyContent: 'center',
  },
  pillOutlineText: {
    color:      '#fff',
    fontWeight: '700',
    fontSize:   13,
  },

  // Quick actions
  section: {
    paddingHorizontal: 16,
    marginTop:         20,
  },
  quickGrid: {
    flexDirection: 'row',
    gap:           10,
  },
  quickItem: {
    flex:           1,
    borderRadius:   14,
    borderWidth:    1,
    padding:        12,
    alignItems:     'center',
    gap:            6,
    position:       'relative',
  },
  quickIcon: {
    width:          34,
    height:         34,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize:   11,
    fontWeight: '600',
  },
  badge: {
    position:        'absolute',
    top:             -4,
    right:           -4,
    backgroundColor: '#C8102E',
    borderRadius:    9999,
    minWidth:        16,
    height:          16,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color:      '#fff',
    fontSize:   9,
    fontWeight: '800',
  },

  // Section headers
  sectionHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   12,
  },
  sectionTitle:  { fontSize: 15, fontWeight: '700' },
  sectionAction: { fontSize: 13, fontWeight: '600' },

  // Networks
  netRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            12,
    padding:        14,
    borderRadius:   14,
    borderWidth:    1,
    marginBottom:   8,
  },
  netAvatar: {
    width:          40,
    height:         40,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
  },
  netShort:  { fontSize: 12, fontWeight: '700' },
  netInfo:   { flex: 1 },
  netName:   { fontSize: 14, fontWeight: '600' },
  netSub:    { fontSize: 12, marginTop: 2 },
  netAmount: { fontSize: 14, fontWeight: '700' },

  // Recent requests
  requestsCard: {
    borderRadius: 16,
    borderWidth:  1,
    overflow:     'hidden',
  },
  reqRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    padding:       14,
  },
  reqDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
    flexShrink:   0,
  },
  reqInfo:   { flex: 1 },
  reqRoute:  { fontSize: 14, fontWeight: '600' },
  reqStatus: { fontSize: 12, marginTop: 2 },
  reqAmount: { fontSize: 14, fontWeight: '700' },
  divider:   { height: 1, marginHorizontal: 14 },

  // Empty
  emptyCard: {
    borderRadius:   16,
    borderWidth:    1,
    padding:        32,
    alignItems:     'center',
    gap:            8,
  },
  emptyText: { fontSize: 14 },
});