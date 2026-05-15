// src/screens/sub-agent/HomeScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  collection, query, where, orderBy,
  limit, onSnapshot,
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
  const { theme, isDark } = useTheme();

  const [requests,     setRequests]     = useState([]);
  const [refreshing,   setRefreshing]   = useState(false);
  const [totalVolume,  setTotalVolume]  = useState(0);
  const [todayVolume,  setTodayVolume]  = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [showAmount,   setShowAmount]   = useState(true);

  const firstName = profile?.name?.split(' ')[0] ?? 'Agent';
  const initials  = profile?.name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'AG';

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Karibu' : hour < 17 ? 'Karibu' : 'Karibu';

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
    const netRequests = requests.filter(r =>
      r.sourceNetwork === name && r.status === 'completed'
    );
    const volume = netRequests.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    return { name, ...meta, volume, count: netRequests.length };
  }).filter(n => n.volume > 0);

  const maxVolume = Math.max(...networkBreakdown.map(n => n.volume), 1);
  const recentRequests = requests.slice(0, 4);

  const reqId = (id) => `REQ-${id?.slice(-3).toUpperCase() ?? '000'}`;

  const timeAgo = (ts) => {
    if (!ts?.toDate) return '';
    const secs = Math.floor((Date.now() - ts.toDate().getTime()) / 1000);
    if (secs < 60)    return 'Just now';
    if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    if (secs < 172800)return 'Yesterday';
    return ts.toDate().toLocaleDateString('en-TZ', { day: '2-digit', month: 'short' });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      {/* Top header bar */}
      <View style={[styles.topBar, {
        backgroundColor: theme.bg,
        borderBottomColor: theme.border,
      }]}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.openDrawer()}>
          <View style={[styles.menuLine, { backgroundColor: theme.text }]} />
          <View style={[styles.menuLine, { width: 20, backgroundColor: theme.text }]} />
          <View style={[styles.menuLine, { width: 16, backgroundColor: theme.text }]} />
        </TouchableOpacity>

        <Text style={[styles.brandName, { color: theme.primary }]}>
          Silverstone
        </Text>

        <TouchableOpacity style={styles.avatarBtn}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {pendingCount > 0 && (
            <View style={[styles.avatarBadge, { borderColor: theme.bg }]}>
              <Text style={styles.avatarBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
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
        {/* Agent greeting */}
        <View style={styles.greetRow}>
          <View>
            <Text style={[styles.greetSub, { color: theme.textDim }]}>
              {greeting}
            </Text>
            <Text style={[styles.greetName, { color: theme.text }]}>
              {firstName}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.notifBtn, {
              backgroundColor: theme.surfaceAlt,
              borderColor: theme.border,
            }]}
          >
            <Ionicons name="notifications-outline" size={20} color={theme.text} />
            {pendingCount > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>

        {/* Balance card */}
        <View style={styles.balanceCard}>
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
            +{fmt(todayVolume)} today · {profile?.networks?.length || 4} networks
          </Text>
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
        <View style={styles.quickGrid}>
          {[
            { label: 'My Requests', icon: 'list-outline',    screen: 'MyRequests' },
            { label: 'History',     icon: 'time-outline',    screen: 'MyRequests' },
            { label: 'Networks',    icon: 'wifi-outline',    screen: 'Profile'    },
            { label: 'Profile',     icon: 'person-outline',  screen: 'Profile'    },
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
            </TouchableOpacity>
          ))}
        </View>

        {/* Network breakdown with bars */}
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

            <View style={[styles.networkCard, {
              backgroundColor: theme.surfaceAlt,
              borderColor:     theme.border,
            }]}>
              {networkBreakdown.map((net, i) => (
                <View key={net.name} style={[
                  styles.netRow,
                  i < networkBreakdown.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  },
                ]}>
                  <View style={styles.netLeft}>
                    <View style={[styles.netDot, { backgroundColor: net.color }]} />
                    <Text style={[styles.netName, { color: theme.text }]}>
                      {net.name}
                    </Text>
                  </View>
                  <View style={styles.netBarWrap}>
                    <View style={[styles.netBarBg, { backgroundColor: theme.border }]}>
                      <View style={[
                        styles.netBarFill,
                        {
                          backgroundColor: net.color,
                          width: `${(net.volume / maxVolume) * 100}%`,
                        },
                      ]} />
                    </View>
                  </View>
                  <Text style={[styles.netAmount, { color: theme.text }]}>
                    {fmt(net.volume)}
                  </Text>
                </View>
              ))}
            </View>
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
                See all →
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
                    <View style={[
                      styles.reqNetDot,
                      { backgroundColor: NETWORKS[req.sourceNetwork]?.color ?? theme.muted },
                    ]} />
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
                      <View style={[
                        styles.statusPill,
                        { backgroundColor: statusColor(req.status) + '20' },
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: statusColor(req.status) },
                        ]}>
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
  scroll: { paddingBottom: 100 },

  // Top bar
  topBar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 18,
    paddingVertical:   12,
    borderBottomWidth: 1,
  },
  menuBtn: {
    gap:     5,
    padding: 4,
  },
  menuLine: {
    width:        24,
    height:       2,
    borderRadius: 2,
  },
  brandName: {
    fontSize:      20,
    fontWeight:    '800',
    letterSpacing: -0.4,
  },
  avatarBtn:    { position: 'relative' },
  avatarCircle: {
    width:          38,
    height:         38,
    borderRadius:   19,
    alignItems:     'center',
    justifyContent: 'center',
  },
  avatarText: {
    color:      '#fff',
    fontWeight: '700',
    fontSize:   14,
  },
  avatarBadge: {
    position:          'absolute',
    top:               -2,
    right:             -2,
    backgroundColor:   '#C8102E',
    borderRadius:      9999,
    minWidth:          16,
    height:            16,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 3,
    borderWidth:       2,
  },
  avatarBadgeText: {
    color:      '#fff',
    fontSize:   9,
    fontWeight: '800',
  },

  // Greeting
  greetRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingTop:        16,
    paddingBottom:     8,
  },
  greetSub:  { fontSize: 13, marginBottom: 2 },
  greetName: { fontSize: 18, fontWeight: '700' },
  notifBtn: {
    width:          40,
    height:         40,
    borderRadius:   12,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
  },
  notifDot: {
    position:        'absolute',
    top:             8,
    right:           8,
    width:           7,
    height:          7,
    borderRadius:    4,
    backgroundColor: '#C8102E',
  },

  // Balance card
  balanceCard: {
    backgroundColor:  '#C8102E',
    marginHorizontal: 16,
    marginTop:        8,
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
  eyeBtn:     { padding: 4 },
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
    flex:            1,
    height:          36,
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  pillOutlineText: {
    color:      '#fff',
    fontWeight: '700',
    fontSize:   13,
  },

  // Quick actions
  quickGrid: {
    flexDirection:     'row',
    gap:               10,
    paddingHorizontal: 16,
    marginTop:         16,
  },
  quickItem: {
    flex:           1,
    borderRadius:   14,
    borderWidth:    1,
    padding:        12,
    alignItems:     'center',
    gap:            6,
  },
  quickIcon: {
    width:          34,
    height:         34,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // Section
  section: {
    paddingHorizontal: 16,
    marginTop:         20,
  },
  sectionHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   12,
  },
  sectionTitle:  { fontSize: 15, fontWeight: '700' },
  sectionAction: { fontSize: 13, fontWeight: '600' },

  // Networks
  networkCard: {
    borderRadius: 16,
    borderWidth:  1,
    overflow:     'hidden',
  },
  netRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    padding:       12,
  },
  netLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    width:         70,
  },
  netDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
  },
  netName:   { fontSize: 13, fontWeight: '600' },
  netBarWrap:{ flex: 1 },
  netBarBg: {
    height:       6,
    borderRadius: 3,
    overflow:     'hidden',
  },
  netBarFill: {
    height:       6,
    borderRadius: 3,
  },
  netAmount: {
    fontSize:   13,
    fontWeight: '700',
    width:      60,
    textAlign:  'right',
  },

  // Recent requests
  requestsCard: {
    borderRadius: 16,
    borderWidth:  1,
    overflow:     'hidden',
  },
  reqRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    padding:       14,
  },
  reqNetDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
    flexShrink:   0,
    marginTop:    2,
  },
  reqInfo:   { flex: 1 },
  reqRoute:  { fontSize: 14, fontWeight: '600' },
  reqMeta:   { fontSize: 12, marginTop: 2, fontFamily: 'monospace' },
  reqRight:  { alignItems: 'flex-end', gap: 4 },
  reqAmount: { fontSize: 14, fontWeight: '700' },
  statusPill:{
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      6,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  divider:    { height: 1, marginHorizontal: 14 },

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