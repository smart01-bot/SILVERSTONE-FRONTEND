// src/screens/main-agent/TransfersScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  RefreshControl, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';
import {
  collection, query, where, orderBy, onSnapshot,
} from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function TransfersScreen() {
  const { theme, isDark } = useTheme();

  const [transfers,  setTransfers]  = useState([]);
  const [filter,     setFilter]     = useState('All');
  const [search,     setSearch]     = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const FILTERS = ['All', 'Today', 'This Week', 'This Month'];

  useEffect(() => {
    const unsub = onSnapshot(
      query(
        collection(db, 'requests'),
        where('status', '==', 'completed'),
        orderBy('processedAt', 'desc')
      ),
      snap => setTransfers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  const filterByDate = (items) => {
    const day   = new Date(); day.setHours(0, 0, 0, 0);
    const week  = new Date(); week.setDate(week.getDate() - 7);
    const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
    return items.filter(t => {
      const d = t.processedAt?.toDate?.() ?? new Date(0);
      if (filter === 'Today')      return d >= day;
      if (filter === 'This Week')  return d >= week;
      if (filter === 'This Month') return d >= month;
      return true;
    });
  };

  const filtered = filterByDate(transfers).filter(t => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      t.agentName?.toLowerCase().includes(s) ||
      String(t.amount).includes(s) ||
      t.sourceNetwork?.toLowerCase().includes(s) ||
      t.destNetwork?.toLowerCase().includes(s)
    );
  });

  const totalVolume = filtered.reduce((s, t) => s + (Number(t.amount) || 0), 0);

  const fmt = (n) => {
    if (n >= 1_000_000) return `TZS ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `TZS ${(n / 1_000).toFixed(0)}k`;
    return `TZS ${n}`;
  };

  const timeAgo = (ts) => {
    if (!ts?.toDate) return '';
    const secs = Math.floor((Date.now() - ts.toDate().getTime()) / 1000);
    if (secs < 60)    return 'Just now';
    if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  };

  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#C8102E" />

      <View style={s.header}>
        <Text style={s.headerTitle}>Transfers</Text>
        <Text style={s.headerSub}>{filtered.length} completed</Text>
      </View>

      <View style={[s.searchWrap, { backgroundColor: theme.bg }]}>
        <View style={[s.searchBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.textDim} />
          <TextInput
            style={[s.searchInput, { color: theme.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search agent or amount..."
            placeholderTextColor={theme.muted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={theme.textDim} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[s.filters, { backgroundColor: theme.bg }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.filterRow}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[s.pill, {
                  backgroundColor: filter === f ? theme.primary : theme.surfaceAlt,
                  borderColor:     filter === f ? theme.primary : theme.border,
                }]}
                activeOpacity={0.75}
              >
                <Text style={[s.pillText, { color: filter === f ? '#fff' : theme.textDim }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#C8102E']} tintColor="#C8102E" />}
      >
        <View style={[s.volumeCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Text style={[s.volumeLabel,  { color: theme.textDim }]}>TOTAL VOLUME</Text>
          <Text style={[s.volumeAmount, { color: theme.text }]}>{fmt(totalVolume)}</Text>
          <Text style={[s.volumeSub,    { color: theme.textDim }]}>{filtered.length} transactions</Text>
        </View>

        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="swap-horizontal-outline" size={64} color={theme.muted} />
            <Text style={[s.emptyTitle, { color: theme.text }]}>No transfers yet</Text>
            <Text style={[s.emptyText,  { color: theme.textDim }]}>Processed transfers will appear here</Text>
          </View>
        ) : (
          <View style={[s.listCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            {filtered.map((t, i) => (
              <View key={t.id}>
                <View style={s.row}>
                  <View style={s.rowLeft}>
                    <Text style={[s.rowId,    { color: theme.textDim }]}>#{t.id.slice(-6).toUpperCase()}</Text>
                    <Text style={[s.rowAgent, { color: theme.text }]}>{t.agentName ?? 'Agent'}</Text>
                    <Text style={[s.rowRoute, { color: theme.textDim }]}>{t.sourceNetwork} → {t.destNetwork}</Text>
                  </View>
                  <View style={s.rowRight}>
                    <Text style={[s.rowAmount, { color: theme.primary }]}>{fmt(Number(t.amount) || 0)}</Text>
                    <Text style={[s.rowTime,   { color: theme.textDim }]}>{timeAgo(t.processedAt)}</Text>
                  </View>
                </View>
                {i < filtered.length - 1 && (
                  <View style={[s.divider, { backgroundColor: theme.border }]} />
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: 100 },

  header: {
    backgroundColor:         '#C8102E',
    paddingHorizontal:       spacing.md + 2,
    paddingTop:              spacing.sm + 2,
    paddingBottom:           spacing.md - 2,
    borderBottomLeftRadius:  radius.xxl,
    borderBottomRightRadius: radius.xxl,
  },
  headerTitle: { fontSize: 28, fontFamily: fonts.display, color: '#fff' },
  headerSub:   { fontSize: 17, fontFamily: fonts.body,    color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  searchWrap: { paddingHorizontal: spacing.md, paddingTop: spacing.md - 4 },
  searchBox: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.sm,
    height:            48,
    borderRadius:      radius.md,
    borderWidth:       1.5,
    paddingHorizontal: spacing.md - 4,
  },
  searchInput: { flex: 1, fontSize: 18, fontFamily: fonts.body },

  filters:   { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md },
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md - 2,
    paddingVertical:   spacing.sm + 1,
    borderRadius:      radius.full,
    borderWidth:       1,
  },
  pillText: { fontSize: 17, fontFamily: fonts.bodySemi },

  volumeCard: {
    borderRadius:  radius.lg,
    borderWidth:   1,
    padding:       spacing.md,
    marginBottom:  spacing.md,
    alignItems:    'center',
  },
  volumeLabel:  { fontSize: 14, fontFamily: fonts.bodySemi, letterSpacing: 1 },
  volumeAmount: { fontSize: 36, fontFamily: fonts.display,  marginTop: spacing.xs },
  volumeSub:    { fontSize: 17, fontFamily: fonts.body,     marginTop: spacing.xs },

  empty:      { alignItems: 'center', paddingTop: spacing.xxl + spacing.lg, gap: spacing.md - 4 },
  emptyTitle: { fontSize: 22, fontFamily: fonts.heading },
  emptyText:  { fontSize: 17, fontFamily: fonts.body },

  listCard: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    padding:        spacing.md - 2,
  },
  rowLeft:   { gap: 2 },
  rowId:     { fontSize: 14, fontFamily: fonts.bodySemi, letterSpacing: 0.4 },
  rowAgent:  { fontSize: 18, fontFamily: fonts.bodyBold },
  rowRoute:  { fontSize: 15, fontFamily: fonts.body },
  rowRight:  { alignItems: 'flex-end', gap: 2 },
  rowAmount: { fontSize: 18, fontFamily: fonts.bodyBold },
  rowTime:   { fontSize: 15, fontFamily: fonts.body },
  divider:   { height: 1, marginHorizontal: spacing.md - 2 },
});
