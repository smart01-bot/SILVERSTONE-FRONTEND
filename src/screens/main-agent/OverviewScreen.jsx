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
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'MA';

  const fmt = (n) => {
    if (n >= 1_000_000) return `TSh ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `TSh ${(n / 1_000).toFixed(0)}k`;
    return `TSh ${n}`;
  };

  useEffect(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTs = Timestamp.fromDate(todayStart);

    // All requests
    const reqUnsub = onSnapshot(
      query(collection(db, 'requests'), orderBy('createdAt', 'desc')),
      snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTotalRequests(docs.length);
        setRecentRequests(docs.slice(0, 5));

        let pending  = 0;
        let urgent   = 0;
        let compToday = 0;
        let volume   = 0;

        docs.forEach(r => {
          if (r.status === 'pending')   pending++;
          if (r.status === 'pending' && r.urgent) urgent++;
          if (
            r.status === 'completed' &&
            r.processedAt?.toDate?.() >= todayStart
          ) compToday++;
          if (r.status === 'completed') {
            volume += Number(r.amount) || 0;
          }
        });

        setPendingRequests(pending);
        setUrgentRequests(urgent);
        setCompletedToday(compToday);
        setTotalVolume(volume);
      }
    );

    // Active agents
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

  const statusColor = (status) => {
    switch (status) {
      case 'completed': return '#16A34A';
      case 'pending':   return '#F59E0B';
      case 'approved':  return '#0891B2';
      case 'rejected':  return '#C8102E';
      default:          return theme.textDim;
    }
  };

  const STATS = [
    {
      label:   'Total Requests',
      value:   totalRequests,
      sub:     `${pendingRequests} pending`,
      subColor: pendingRequests > 0 ? '#C8102E' : '#16A34A',
      icon:    'document-text-outline',
    },
    {
      label:   'Transactions',
      value:   completedToday,
      sub:     'completed',
      subColor: '#16A34A',
      icon:    'swap-horizontal-outline',
    },
    {
      label:   'Active Agents',
      value:   activeAgents,
      sub:     'registered',
      subColor: theme.textDim,
      icon:    'people-outline',
    },
    {
      label:   'Total Volume',
      value:   fmt(totalVolume),
      sub:     'moved',
      subColor: '#16A34A',
      icon:    'cash-outline',
      isText:  true,
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#C8102E"
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <View style={styles.adminRow}>
              <Text style={styles.brandText}>silverstone</Text>
              <Text style={styles.adminTag}> · admin</Text>
            </View>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={18} color="#fff" />
          <View style={styles.notifDot} />
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
        {/* Hero card */}
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

        {/* Stat cards */}
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

        {/* Monthly activity header */}
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

          {/* Simple bar chart placeholder */}
          <View style={[styles.chartPlaceholder, {
            backgroundColor: theme.surfaceAlt,
            borderColor:     theme.border,
          }]}>
            <Text style={[styles.chartText, { color: theme.textDim }]}>
              Requests vs Transactions · {totalRequests}
            </Text>
            <View style={styles.chartBars}>
              {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 1.0].map((h, i) => (
                <View key={i} style={styles.barGroup}>
                  <View style={[styles.bar, {
                    height:          h * 60,
                    backgroundColor: '#C8102E',
                    opacity:         0.8,
                  }]} />
                  <View style={[styles.bar, {
                    height:          h * 0.7 * 60,
                    backgroundColor: '#0891B2',
                    opacity:         0.8,
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
                View queue
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
                      <Text style={[styles.reqRoute, { color: theme.textDim }]}>
                        {req.sourceNetwork} → {req.destNetwork}
                        {req.urgent ? ' · URGENT' : ''}
                      </Text>
                    </View>
                    <View style={styles.reqRight}>
                      <Text style={[styles.reqAmount, { color: theme.primary }]}>
                        {req.amount >= 1000
                          ? `TSh ${(req.amount / 1000).toFixed(0)}k`
                          : `TSh ${req.amount}`}
                      </Text>
                      <Text style={[styles.reqStatus, { color: statusColor(req.status) }]}>
                        {req.status}
                      </Text>
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

  // Header
  header: {
    backgroundColor:       '#C8102E',
    paddingHorizontal:     18,
    paddingTop:            10,
    paddingBottom:         14,
    flexDirection:         'row',
    alignItems:            'center',
    justifyContent:        'space-between',
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
  adminRow: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  brandText: {
    fontSize:   15,
    fontWeight: '700',
    color:      '#fff',
  },
  adminTag: {
    fontSize: 15,
    color:    'rgba(255,255,255,0.75)',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    marginTop:     2,
  },
  liveDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: '#16A34A',
  },
  liveText: {
    fontSize:      11,
    fontWeight:    '700',
    color:         '#16A34A',
    letterSpacing: 0.6,
  },
  iconBtn: {
    width:          34,
    height:         34,
    borderRadius:   10,
    backgroundColor:'rgba(255,255,255,0.15)',
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
  },
  notifDot: {
    position:        'absolute',
    top:             6,
    right:           6,
    width:           7,
    height:          7,
    borderRadius:    4,
    backgroundColor: '#FFFFFF',
    borderWidth:     1.5,
    borderColor:     '#C8102E',
  },

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
  heroSub: {
    fontSize: 13,
    color:    'rgba(255,255,255,0.75)',
  },

  // Stat cards
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
  statValue: {
    fontSize:   22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize:   13,
    fontWeight: '600',
  },
  statSub: {
    fontSize: 12,
  },

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
  chartPlaceholder: {
    borderRadius: 16,
    borderWidth:  1,
    padding:      16,
  },
  chartText: {
    fontSize:     12,
    marginBottom: 12,
  },
  chartBars: {
    flexDirection:  'row',
    alignItems:     'flex-end',
    gap:            8,
    height:         60,
  },
  barGroup: {
    flex:          1,
    flexDirection: 'row',
    alignItems:    'flex-end',
    gap:           2,
  },
  bar: {
    flex:         1,
    borderRadius: 3,
  },
  legendRow: {
    flexDirection: 'row',
    gap:           12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  legendDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
  },
  legendText: { fontSize: 12 },

  // Requests
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
  reqAgent:  { fontSize: 14, fontWeight: '600' },
  reqRoute:  { fontSize: 12, marginTop: 2 },
  reqRight:  { alignItems: 'flex-end' },
  reqAmount: { fontSize: 14, fontWeight: '700' },
  reqStatus: { fontSize: 11, marginTop: 2, fontWeight: '500' },
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