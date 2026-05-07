import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { listenRequests } from '../../utils/firestore';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import RequestCard from '../../components/RequestCard';
import RequestDetailModal from '../../components/RequestDetailModal';
import NetworkBadge from '../../components/NetworkBadge';
import { NETWORK_COLORS } from '../../constants/networks';

const W = Dimensions.get('window').width;
const fmt  = (n) => `TZS ${Number(n).toLocaleString()}`;
const fmtK = (n) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}k` : `${n}`;

export default function HomeScreen({ navigation }) {
  const { user, profile } = useAuth();
  const { theme, tr } = useTheme();
  const { isOnline, syncing, syncedCount } = useOfflineQueue(user?.uid, profile?.name);

  const [requests, setRequests]   = useState([]);
  const [hideAmount, setHideAmount] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    if (!user) return;
    return listenRequests(user.uid, setRequests);
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  // Derived stats
  const completed  = requests.filter(r => r.status === 'completed');
  const pending    = requests.filter(r => r.status === 'pending');
  const totalVol   = completed.reduce((s, r) => s + (r.amount || 0), 0);

  // Volume per network
  const netVol = {};
  completed.forEach(r => { netVol[r.sourceNetwork] = (netVol[r.sourceNetwork] || 0) + r.amount; });

  // Chart: last 30 days volume
  const days30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i)); return d;
  });
  const chartData = {
    labels: days30.map((d, i) =>
      (29 - i) % 7 === 0
        ? d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
        : ''
    ),
    datasets: [{
      data: days30.map(d => {
        const dayStr = d.toDateString();
        return completed
          .filter(r => r.createdAt?.toDate?.()?.toDateString() === dayStr)
          .reduce((s, r) => s + r.amount, 0) || 0;
      }),
    }],
  };

  const recentRequests = requests.slice(0, 4);
  const firstName = profile?.name?.split(' ')[0] ?? 'Agent';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>

      {/* Offline banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            {syncing ? '⟳ Syncing offline requests...' : '⚠ You\'re offline — requests will sync when connected'}
          </Text>
        </View>
      )}
      {syncedCount > 0 && (
        <View style={[styles.offlineBanner, { backgroundColor: '#16A34A' }]}>
          <Text style={styles.offlineText}>✓ {syncedCount} request{syncedCount > 1 ? 's' : ''} synced</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />}
      >

        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.greeting, { color: theme.textDim }]}>Good day,</Text>
            <Text style={[styles.name, { color: theme.text }]}>{firstName} 👋</Text>
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
              <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 16 }}>{firstName[0]}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero card */}
        <LinearGradient
          colors={[theme.heroGradStart, theme.heroGradEnd]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.hero, theme.heroShadow]}
        >
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>{tr('totalVolume')}</Text>
            <TouchableOpacity onPress={() => setHideAmount(h => !h)}>
              <Text style={styles.heroEye}>{hideAmount ? '👁' : '🙈'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heroAmount}>
            {hideAmount ? 'TZS ••••••' : fmt(totalVol)}
          </Text>

          <View style={styles.heroTiles}>
            {[
              { label: tr('completed'), value: completed.length, icon: '✅' },
              { label: tr('pending'),   value: pending.length,   icon: '⏳' },
            ].map(({ label, value, icon }) => (
              <View key={label} style={styles.heroTile}>
                <Text style={styles.heroTileIcon}>{icon}</Text>
                <Text style={styles.heroTileVal}>{value}</Text>
                <Text style={styles.heroTileLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Quick actions */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{tr('quickActions')}</Text>
        <View style={styles.actionsGrid}>
          {[
            { label: tr('newRequest'), icon: '➕', screen: 'NewRequest' },
            {
              label: tr('myRequests'), icon: '📋', screen: 'MyRequests',
              badge: pending.length > 0 ? pending.length : null,
            },
            { label: tr('trackStatus'), icon: '🔍', screen: 'MyRequests' },
            { label: tr('profile'),     icon: '👤', screen: 'Profile' },
          ].map(({ label, icon, screen, badge }) => (
            <TouchableOpacity key={label}
              onPress={() => navigation.navigate(screen)}
              style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border, ...theme.shadow }]}>
              <View style={{ position: 'relative' }}>
                <Text style={{ fontSize: 28, marginBottom: 6 }}>{icon}</Text>
                {badge && (
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>{badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.actionLabel, { color: theme.text }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        {chartData.datasets[0].data.some(v => v > 0) && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, ...theme.shadow }]}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 4 }]}>30-Day Volume</Text>
            <Text style={[styles.cardSub, { color: theme.textDim }]}>Daily float requested (TZS)</Text>
            <LineChart
              data={chartData}
              width={W - 48}
              height={160}
              withDots={false}
              withInnerLines={false}
              withOuterLines={false}
              chartConfig={{
                backgroundColor: theme.surface,
                backgroundGradientFrom: theme.surface,
                backgroundGradientTo: theme.surface,
                decimalPlaces: 0,
                color: () => theme.primary,
                labelColor: () => theme.textDim,
                fillShadowGradient: theme.primary,
                fillShadowGradientOpacity: 0.15,
                style: { borderRadius: 16 },
                propsForLabels: { fontSize: 10 },
              }}
              bezier
              style={{ marginLeft: -16, marginTop: 8 }}
              formatYLabel={fmtK}
            />
          </View>
        )}

        {/* Volume by network */}
        {Object.keys(netVol).length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, ...theme.shadow }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{tr('volumeByNetwork')}</Text>
            {Object.entries(netVol).sort((a,b) => b[1]-a[1]).map(([net, vol]) => {
              const pct = totalVol > 0 ? vol / totalVol : 0;
              return (
                <View key={net} style={styles.netRow}>
                  <NetworkBadge network={net} />
                  <View style={[styles.netBarBg, { backgroundColor: theme.border }]}>
                    <View style={[styles.netBar, { width: `${pct*100}%`, backgroundColor: NETWORK_COLORS[net] }]} />
                  </View>
                  <Text style={[styles.netAmt, { color: theme.textDim }]}>{fmtK(vol)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent requests */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{tr('recentRequests')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyRequests')}>
            <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 14 }}>{tr('seeAll')}</Text>
          </TouchableOpacity>
        </View>

        {recentRequests.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={{ fontSize: 36 }}>📭</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{tr('noRequests')}</Text>
            <Text style={[styles.emptyDesc, { color: theme.textDim }]}>{tr('noRequestsDesc')}</Text>
          </View>
        ) : (
          recentRequests.map(r => (
            <RequestCard key={r.id} request={r} onPress={setSelected} />
          ))
        )}

      </ScrollView>

      <RequestDetailModal
        request={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
        role="sub-agent"
        onRetry={(req) => { setSelected(null); navigation.navigate('NewRequest', { prefill: req }); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  offlineBanner: {
    backgroundColor: '#DC2626', paddingVertical: 7,
    paddingHorizontal: 16, alignItems: 'center',
  },
  offlineText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 100, gap: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  greeting: { fontSize: 13 },
  name:   { fontSize: 20, fontWeight: '700', marginTop: 2 },
  topActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: 20, padding: 20, gap: 8 },
  heroTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel:  { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  heroEye:    { fontSize: 18 },
  heroAmount: { color: '#fff', fontSize: 32, fontWeight: '800', fontFamily: 'Courier New', letterSpacing: -0.5 },
  heroTiles:  { flexDirection: 'row', gap: 10, marginTop: 8 },
  heroTile:   { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  heroTileIcon: { fontSize: 20 },
  heroTileVal:  { color: '#fff', fontSize: 22, fontWeight: '800', fontFamily: 'Courier New' },
  heroTileLabel:{ color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: {
    width: '47%', borderRadius: 16, borderWidth: 1,
    padding: 16, alignItems: 'center',
  },
  actionLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  actionBadge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: '#D32F2F', borderRadius: 8,
    paddingHorizontal: 5, minWidth: 16, alignItems: 'center',
  },
  actionBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  cardSub: { fontSize: 12, marginTop: -6 },
  netRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  netBarBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  netBar:   { height: '100%', borderRadius: 3 },
  netAmt:   { fontSize: 12, fontFamily: 'Courier New', minWidth: 44, textAlign: 'right' },
  empty:  { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyDesc:  { fontSize: 14, textAlign: 'center' },
});
