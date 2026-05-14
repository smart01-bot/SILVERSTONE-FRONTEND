// src/screens/main-agent/OverviewScreen.jsx
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
  onSnapshot, Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function OverviewScreen({ navigation }) {
  const { profile } = useAuth();
  const { theme, isDark } = useTheme();

  const [refreshing,      setRefreshing]      = useState(false);
  const [totalRequests,   setTotalRequests]   = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [urgentRequests,  setUrgentRequests]  = useState(0);
  const [completedToday,  setCompletedToday]  = useState(0);
  const [activeAgents,    setActiveAgents]    = useState(0);
  const [totalVolume,     setTotalVolume]     = useState(0);
  const [recentRequests,  setRecentRequests]  = useState([]);

  const initials = profile?.name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'MA';

  const fmt = (n) => {
    if (n >= 1_000_000) return `TSh ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `TSh ${(n / 1_000).toFixed(0)}k`;
    return `TSh ${n}`;
  };

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
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const reqUnsub = onSnapshot(
      query(collection(db, 'requests'), orderBy('createdAt', 'desc')),
      snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTotalRequests(docs.length);
        setRecentRequests(docs.slice(0, 5));
        let pending = 0, urgent = 0, compToday = 0, volume = 0;
        docs.forEach(r => {
          if (r.status === 'pending') pending++;
          if (r.status === 'pending' && r.urgent) urgent++;
          if (r.status === 'completed' && r.processedAt?.toDate?.() >= todayStart) compToday++;
          if (r.status === 'completed') volume += Number(r.amount) || 0;
        });
        setPendingRequests(pending);
        setUrgentRequests(urgent);
        setCompletedToday(compToday);
        setTotalVolume(volume);
      }
    );

    const agentUnsub = onSnapshot(
      query(
        collection(db, 'agents'),
        where('status', '==', 'approved'),
        where('role', '==', 'sub-agent')
      ),
      snap => setActiveAgents(snap.size)
    );

    return () => { reqUnsub(); agentUnsub(); };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const STATS = [
    {
      label:    'Total Requests',
      value:    totalRequests,
      sub:      `${pendingRequests} pending`,
      subColor: pendingRequests > 0 ? '#C8102E' : '#16A34A',
      icon:     'document-text-outline',
    },
    {
      label:    'Transactions',
      value:    completedToday,
      sub:      'completed',
      subColor: '#16A34A',
      icon:     'swap-horizontal-outline',
    },
    {
      label:    'Active Agents',
      value:    activeAgents,
      sub:      'registered',
      subColor: theme.textDim,
      icon:     'people-outline',
    },
    {
      label:    'Total Volume',
      value:    fmt(totalVolume),
      sub:      'moved',
      subColor: '#16A34A',
      icon:     'cash-outline',
      isText:   true,
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      {/* Top header bar — matches agent design */}
      <View style={[styles.topBar, {
        backgroundColor:   theme.bg,
        borderBottomColor: theme.border,
      }]}>
        <TouchableOpacity style={styles.menuBtn}>
          <View style={[styles.menuLine, { backgroundColor: theme.text }]} />
          <View style={[styles.menuLine, { width: 20, backgroundColor: theme.text }]} />
          <View style={[styles.menuLine, { width: 16, backgroundColor: theme.text }]} />
        </TouchableOpacity>

        <View style={styles.brandWrap}>
          <Text style={[styles.brandName, { color: theme.primary }]}>
            Silverstone
          </Text>
          <Text style={[styles.brandTag, { color: theme.textDim }]}>
            · admin
          </Text>
        </View>

        <View style={styles.topRight}>
          <View style={[styles.livePill, { backgroundColor: '#16A34A20' }]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn}>
            <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            {pendingRequests > 0 && (
              <View style={[styles.avatarBadge, { borderColor: theme.bg }]}>
                <Text style={styles.avatarBadgeText}>{pendingRequests}</Text>
              </View>
            )}
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
        {/* Hero volume card */}
        <View style={styles.heroCard}>
          <View style={styles.decorCircle} />
          <Text style={styles.heroLabel}>TOTAL VOLUME MOVED · 30D</Text>
          <Text style={styles.heroAmount}>{fmt(totalVolume)}</Text>
          <View style={styles.heroSubRow}>
            <Ionicons
              name="trending-up-outline"
              size={14}
              color="rgba(255,255,255,0.8)"
            />
            <Text style={styles.heroSub}>
              +{fmt(totalVolume * 0.124)} vs last month
            </Text>
          </View>
        </View>

        {/* Stat cards 2x2 grid */}
        <View style={styles.statsGrid}>
          {STATS.map(stat => (
            <View
              key={stat.label}
              style={[styles.statCard, {
                backgroundColor: theme.surfaceAlt,
                borderColor:     theme.border,
              }]}
            >
              <View style={[styles.statIcon, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name={stat.icon} size={18} color={theme.primary} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {stat.isText ? stat.value : stat.value.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textDim }]}>
                {stat.label}
              </Text>
              <Text style={[styles.statSub, { color: stat.subColor }]}>
                {stat.sub}
              </Text>
            </View>
          ))}
        </View>

        {/* Monthly activity chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Monthly Activity
            </Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#C8102E' }]} />
                <Text style={[styles.legendText, { color: theme.textDim }]}>Reqs</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#0891B2' }]} />
                <Text style={[styles.legendText, { color: theme.textDim }]}>Txns</Text>
              </View>
            </View>
          </View>

          <View style={[styles.chartCard, {
            backgroundColor: theme.surfaceAlt,
            borderColor:     theme.border,
          }]}>
            <Text style={[styles.chartLabel, { color: theme.textDim }]}>
              Requests vs Transactions · {totalRequests} total
            </Text>
            <View style={styles.chartBars}>
              {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 1.0].map((h, i) => (
                <View key={i} style={styles.barGroup}>
                  <View style={[styles.bar, {
                    height:          h * 60,
                    backgroundColor: '#C8102E',
                    opacity:         0.85,
                  }]} />
                  <View style={[styles.bar, {
                    height:          h * 0.7 * 60,
                    backgroundColor: '#0891B2',
                    opacity:         0.85,
                  }]} />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Recent requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Recent Requests
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Queue')}>
              <Text style={[styles.sectionAction, { color: theme.primary }]}>
                View queue →
              </Text>
            </TouchableOpacity>
          </View>

          {recentRequests.length === 0 ? (
            <View style={[styles.emptyCard, {
              backgroundColor: theme.surfaceAlt,
              borderColor:     theme.border,
            }]}>
              <Ionicons name="checkmark-circle-outline" size={32} color={theme.muted} />
              <Text style={[styles.emptyText, { color: theme.textDim }]}>
                Queue is clear
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
                      styles.reqDot,
                      { backgroundColor: statusColor(req.status) },
                    ]} />
                    <View style={styles.reqInfo}>
                      <Text style={[styles.reqAgent, { color: theme.text }]}>
                        {req.agentName ?? 'Agent'}
                      </Text>
                      <Text style={[styles.reqMeta, { color: theme.textDim }]}>
                        {reqId(req.id)} · {req.sourceNetwork} → {req.destNetwork}
                        {req.urgent ? ' · URGENT' : ''}
                      </Text>
                      <Text style={[styles.reqTime, { color: theme.textDim }]}>
                        {timeAgo(req.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.reqRight}>
                      <Text style={[styles.reqAmount, { color: theme.primary }]}>
                        {req.amount >= 1000
                          ? `TSh ${(req.amount / 1000).toFixed(0)}k`
                          : `TSh ${req.amount}`}
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
  menuBtn: { gap: 5, padding: 4 },
  menuLine: {
    width:        24,
    height:       2,
    borderRadius: 2,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  brandName: {
    fontSize:      20,
    fontWeight:    '800',
    letterSpacing: -0.4,
  },
  brandTag: {
    fontSize:   15,
    fontWeight: '400',
    marginLeft: 2,
  },
  topRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  livePill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:      6,
  },
  liveDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: '#16A34A',
  },
  liveText: {
    fontSize:      10,
    fontWeight:    '700',
    color:         '#16A34A',
    letterSpacing: 0.6,
  },
  avatarBtn:    { position: 'relative' },
  avatarCircle: {
    width:          38,
    height:         38,
    borderRadius:   19,
    alignItems:     'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
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
  avatarBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // Hero card
  heroCard: {
    backgroundColor:  '#C8102E',
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
  heroLabel: {
    fontSize:      11,
    fontWeight:    '600',
    letterSpacing: 1.2,
    color:         'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
  },
  heroAmount: {
    fontSize:      32,
    fontWeight:    '800',
    letterSpacing: -0.8,
    color:         '#fff',
    marginTop:     6,
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    marginTop:     4,
  },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },

  // Stats grid
  statsGrid: {
    flexDirection:     'row',
    flexWrap:          'wrap',
    gap:               10,
    paddingHorizontal: 16,
    marginTop:         16,
  },
  statCard: {
    width:        '47%',
    borderRadius: 16,
    borderWidth:  1,
    padding:      14,
    gap:          4,
  },
  statIcon: {
    width:          36,
    height:         36,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   6,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 13, fontWeight: '600' },
  statSub:   { fontSize: 12 },

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

  // Chart
  chartCard: {
    borderRadius: 16,
    borderWidth:  1,
    padding:      16,
  },
  chartLabel: { fontSize: 12, marginBottom: 12 },
  chartBars: {
    flexDirection: 'row',
    alignItems:    'flex-end',
    gap:           8,
    height:        60,
  },
  barGroup: {
    flex:          1,
    flexDirection: 'row',
    alignItems:    'flex-end',
    gap:           2,
  },
  bar:          { flex: 1, borderRadius: 3 },
  legendRow:    { flexDirection: 'row', gap: 12 },
  legendItem:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:    { width: 8, height: 8, borderRadius: 4 },
  legendText:   { fontSize: 12 },

  // Requests
  requestsCard: {
    borderRadius: 16,
    borderWidth:  1,
    overflow:     'hidden',
  },
  reqRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           10,
    padding:       14,
  },
  reqDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
    flexShrink:   0,
    marginTop:    4,
  },
  reqInfo:   { flex: 1, gap: 2 },
  reqAgent:  { fontSize: 14, fontWeight: '600' },
  reqMeta:   { fontSize: 12, fontFamily: 'monospace' },
  reqTime:   { fontSize: 11 },
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