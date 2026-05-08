import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { listenRequests } from '../../utils/firestore';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import RequestCard from '../../components/RequestCard';
import RequestDetailModal from '../../components/RequestDetailModal';
import NetworkBadge from '../../components/NetworkBadge';
import Avatar from '../../components/Avatar';
import { NETWORK_COLORS } from '../../constants/networks';

const W = Dimensions.get('window').width;
const fmt  = (n) => `TZS ${Number(n).toLocaleString()}`;
const fmtK = (n) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}k` : `${n}`;

export default function HomeScreen({ navigation }) {
  const { user, profile } = useAuth();
  const { theme, tr, isDark, toggleTheme } = useTheme();
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

  const quickActions = [
    { label: tr('newRequest'), iconName: 'add-circle-outline', screen: 'NewRequest' },
    { label: tr('myRequests'), iconName: 'time-outline',       screen: 'MyRequests' },
    { label: tr('trackStatus'),iconName: 'search-outline',     screen: 'MyRequests' },
    { label: tr('profile'),    iconName: 'person-outline',     screen: 'Profile' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>

      {/* Offline banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name={syncing ? 'refresh-outline' : 'warning-outline'} size={14} color="#fff" />
          <Text style={styles.offlineText}>
            {syncing ? 'Syncing offline requests...' : 'You\'re offline — requests will sync when connected'}
          </Text>
        </View>
      )}
      {syncedCount > 0 && (
        <View style={[styles.offlineBanner, { backgroundColor: '#16A34A' }]}>
          <Ionicons name="checkmark-circle-outline" size={14} color="#fff" />
          <Text style={styles.offlineText}>{syncedCount} request{syncedCount > 1 ? 's' : ''} synced</Text>
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
            <Text style={[styles.name, { color: theme.text }]}>{firstName}</Text>
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity onPress={toggleTheme} style={[styles.iconBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={16} color={theme.textDim} />
            </TouchableOpacity>
            <Avatar name={firstName} size={40} />
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
              <Ionicons name={hideAmount ? 'eye-outline' : 'eye-off-outline'} size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroAmount}>
            {hideAmount ? 'TZS ••••••' : fmt(totalVol)}
          </Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStatCol}>
              <Text style={styles.heroStatVal}>{completed.length}</Text>
              <Text style={styles.heroStatLabel}>{tr('completed')}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatCol}>
              <Text style={styles.heroStatVal}>{pending.length}</Text>
              <Text style={styles.heroStatLabel}>{tr('pending')}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick actions */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{tr('quickActions')}</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map(({ label, iconName, screen }) => (
            <TouchableOpacity key={label}
              onPress={() => navigation.navigate(screen)}
              style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border, ...theme.shadow }]}>
              <Ionicons name={iconName} size={28} color={theme.primary} style={{ marginBottom: 6 }} />
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
            <Ionicons name="document-outline" size={48} color={theme.muted ?? theme.textDim} />
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
    paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  offlineText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 100, gap: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  greeting: { fontSize: 13 },
  name:   { fontSize: 20, fontWeight: '700', marginTop: 2 },
  topActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconBtn: { borderWidth: 1, borderRadius: 20, padding: 8 },
  hero: {
    borderRadius: 20, padding: 20, gap: 8,
    shadowColor: '#FFA500', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  heroTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel:  { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  heroAmount: { color: '#fff', fontSize: 32, fontWeight: '800', fontFamily: 'Courier New', letterSpacing: -0.5 },
  heroStats:      { flexDirection: 'row', marginTop: 8 },
  heroStatCol:    { flex: 1, alignItems: 'center', gap: 4 },
  heroStatVal:    { color: '#fff', fontSize: 24, fontWeight: '800', fontFamily: 'Courier New' },
  heroStatLabel:  { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  heroStatDivider:{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
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
