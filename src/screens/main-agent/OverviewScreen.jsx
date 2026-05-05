import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { listenDashboardStats } from '../../utils/firestore';
import { NETWORK_COLORS } from '../../constants/networks';

const W = Dimensions.get('window').width;
const fmt  = (n) => `TZS ${Number(n).toLocaleString()}`;
const fmtK = (n) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}k` : `${n}`;

const getMonthBuckets = () => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: d.toLocaleDateString('en', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() };
  });
};

export default function OverviewScreen() {
  const { user } = useAuth();
  const { theme, tr } = useTheme();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    return listenDashboardStats(setStats);
  }, []);

  const statCards = [
    { label: tr('totalRequests'), value: stats?.totalRequests ?? 0,  icon: '📋', delta: `${stats?.pendingCount ?? 0} pending` },
    { label: tr('totalTx'),       value: stats?.totalTx ?? 0,        icon: '⇄',  delta: 'completed' },
    { label: tr('activeAgents'),  value: stats?.activeAgents ?? 0,   icon: '👥', delta: `${stats?.pendingAgents ?? 0} awaiting` },
    { label: 'Total Volume',      value: fmtK(stats?.totalVolume ?? 0), icon: '💰', delta: 'moved' },
  ];

  // Chart data: last 6 months — computed from real Firestore data
  const monthBuckets = getMonthBuckets();

  const inMonth = (ts, year, month) => {
    const d = ts?.toDate?.();
    return d && d.getFullYear() === year && d.getMonth() === month;
  };

  const monthlyRequests = monthBuckets.map(({ year, month }) =>
    (stats?.requests ?? []).filter(r => inMonth(r.createdAt, year, month)).length
  );
  const monthlyTx = monthBuckets.map(({ year, month }) =>
    (stats?.transactions ?? []).filter(t => inMonth(t.createdAt, year, month)).length
  );

  const txChart = {
    labels: monthBuckets.map(b => b.label),
    datasets: [
      { data: monthlyRequests.map(v => v || 0), color: () => theme.primary },
      { data: monthlyTx.map(v => v || 0),       color: () => theme.teal ?? '#0891B2' },
    ],
    legend: ['Requests', 'Transactions'],
  };

  // Network breakdown from real transactions
  const netData = (stats?.transactions ?? []).reduce((acc, t) => {
    if (t.sourceNetwork) acc[t.sourceNetwork] = (acc[t.sourceNetwork] || 0) + (t.amount || 0);
    return acc;
  }, {});
  const netEntries = Object.entries(netData).sort((a,b) => b[1]-a[1]);

  const chartConfig = {
    backgroundColor: theme.surface,
    backgroundGradientFrom: theme.surface,
    backgroundGradientTo: theme.surface,
    color: () => theme.primary,
    labelColor: () => theme.textDim,
    fillShadowGradientOpacity: 0.15,
    style: { borderRadius: 16 },
    propsForLabels: { fontSize: 10 },
    decimalPlaces: 0,
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={[styles.title, { color: theme.text }]}>{tr('platformStats')}</Text>
        <Text style={[styles.sub, { color: theme.textDim }]}>Real-time metrics</Text>

        {/* Stat cards */}
        <View style={styles.statsGrid}>
          {statCards.map(({ label, value, icon, delta }) => (
            <View key={label} style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border, ...theme.shadow }]}>
              <Text style={styles.statIcon}>{icon}</Text>
              <Text style={[styles.statVal, { color: theme.text }]}>{value}</Text>
              <Text style={[styles.statLabel, { color: theme.textDim }]}>{label}</Text>
              <Text style={[styles.statDelta, { color: theme.primary }]}>{delta}</Text>
            </View>
          ))}
        </View>

        {/* Activity chart */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Monthly Activity</Text>
          <Text style={[styles.cardSub, { color: theme.textDim }]}>Requests vs Transactions (6 months)</Text>
          <LineChart
            data={txChart}
            width={W - 48}
            height={180}
            withDots
            withInnerLines={false}
            chartConfig={chartConfig}
            bezier
            style={{ marginLeft: -16, marginTop: 8 }}
            formatYLabel={fmtK}
          />
        </View>

        {/* Network breakdown */}
        {netEntries.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Volume by Network</Text>
            {netEntries.map(([net, vol]) => {
              const total = netEntries.reduce((s,[,v])=>s+v,0);
              const pct   = total > 0 ? vol / total : 0;
              return (
                <View key={net} style={styles.netRow}>
                  <View style={[styles.netDot, { backgroundColor: NETWORK_COLORS[net] ?? '#888' }]} />
                  <Text style={[styles.netName, { color: theme.text }]}>{net}</Text>
                  <View style={[styles.barBg, { backgroundColor: theme.border }]}>
                    <View style={[styles.bar, { width: `${pct*100}%`, backgroundColor: NETWORK_COLORS[net] ?? theme.primary }]} />
                  </View>
                  <Text style={[styles.netVol, { color: theme.textDim }]}>{fmtK(vol)}</Text>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  scroll:    { padding: 16, paddingBottom: 100, gap: 16 },
  title:     { fontSize: 22, fontWeight: '800' },
  sub:       { fontSize: 13, marginTop: -10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard:  { width: '47%', borderRadius: 16, borderWidth: 1, padding: 14, gap: 4 },
  statIcon:  { fontSize: 24 },
  statVal:   { fontSize: 22, fontWeight: '800', fontFamily: 'Courier New' },
  statLabel: { fontSize: 12 },
  statDelta: { fontSize: 12, fontWeight: '600' },
  card:      { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardSub:   { fontSize: 12, marginTop: -6 },
  netRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  netDot:    { width: 8, height: 8, borderRadius: 4 },
  netName:   { fontSize: 13, fontWeight: '600', width: 64 },
  barBg:     { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  bar:       { height: '100%', borderRadius: 3 },
  netVol:    { fontSize: 12, fontFamily: 'Courier New', width: 44, textAlign: 'right' },
});