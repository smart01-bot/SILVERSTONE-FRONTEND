// src/screens/main-agent/TransfersScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  RefreshControl, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import {
  collection, query, where, orderBy,
  onSnapshot,
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
      snap => {
        setTransfers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );
    return unsub;
  }, []);

  const filterByDate = (items) => {
    const now  = new Date();
    const day  = new Date(); day.setHours(0,0,0,0);
    const week = new Date(); week.setDate(week.getDate() - 7);
    const month= new Date(); month.setDate(1); month.setHours(0,0,0,0);

    return items.filter(t => {
      const d = t.processedAt?.toDate?.() ?? new Date(0);
      if (filter === 'Today')     return d >= day;
      if (filter === 'This Week') return d >= week;
      if (filter === 'This Month')return d >= month;
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
    if (secs < 60)   return 'Just now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400)return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#C8102E" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transfers</Text>
        <Text style={styles.headerSub}>{filtered.length} completed</Text>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: theme.bg }]}>
        <View style={[styles.searchBox, {
          backgroundColor: theme.surfaceAlt,
          borderColor:     theme.border,
        }]}>
          <Ionicons name="search-outline" size={16} color={theme.textDim} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search agent or amount..."
            placeholderTextColor={theme.muted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={theme.textDim} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter pills */}
      <View style={[styles.filters, { backgroundColor: theme.bg }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: filter === f ? theme.primary : theme.surfaceAlt,
                    borderColor:     filter === f ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text style={[
                  styles.pillText,
                  { color: filter === f ? '#fff' : theme.textDim },
                ]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
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
        {/* Total volume card */}
        <View style={[styles.volumeCard, {
          backgroundColor: theme.surfaceAlt,
          borderColor:     theme.border,
        }]}>
          <Text style={[styles.volumeLabel, { color: theme.textDim }]}>
            TOTAL VOLUME
          </Text>
          <Text style={[styles.volumeAmount, { color: theme.text }]}>
            {fmt(totalVolume)}
          </Text>
          <Text style={[styles.volumeSub, { color: theme.textDim }]}>
            {filtered.length} transactions
          </Text>
        </View>

        {/* Transfer list */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="swap-horizontal-outline" size={56} color={theme.muted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No transfers yet
            </Text>
            <Text style={[styles.emptyText, { color: theme.textDim }]}>
              Processed transfers will appear here
            </Text>
          </View>
        ) : (
          <View style={[styles.listCard, {
            backgroundColor: theme.surfaceAlt,
            borderColor:     theme.border,
          }]}>
            {filtered.map((t, i) => (
              <View key={t.id}>
                <View style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text style={[styles.rowId, { color: theme.textDim }]}>
                      #{t.id.slice(-6).toUpperCase()}
                    </Text>
                    <Text style={[styles.rowAgent, { color: theme.text }]}>
                      {t.agentName ?? 'Agent'}
                    </Text>
                    <Text style={[styles.rowRoute, { color: theme.textDim }]}>
                      {t.sourceNetwork} → {t.destNetwork}
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={[styles.rowAmount, { color: theme.primary }]}>
                      {fmt(Number(t.amount) || 0)}
                    </Text>
                    <Text style={[styles.rowTime, { color: theme.textDim }]}>
                      {timeAgo(t.processedAt)}
                    </Text>
                  </View>
                </View>
                {i < filtered.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: 16, paddingBottom: 100 },

  header: {
    backgroundColor:       '#C8102E',
    paddingHorizontal:     18,
    paddingTop:            10,
    paddingBottom:         14,
    borderBottomLeftRadius:  24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  searchWrap: { paddingHorizontal: 16, paddingTop: 12 },
  searchBox: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    height:            44,
    borderRadius:      12,
    borderWidth:       1.5,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 14 },

  filters:   { paddingVertical: 10, paddingHorizontal: 16 },
  filterRow: { flexDirection: 'row', gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical:   7,
    borderRadius:      9999,
    borderWidth:       1,
  },
  pillText: { fontSize: 13, fontWeight: '600' },

  volumeCard: {
    borderRadius:  16,
    borderWidth:   1,
    padding:       16,
    marginBottom:  16,
    alignItems:    'center',
  },
  volumeLabel:  { fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  volumeAmount: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  volumeSub:    { fontSize: 13, marginTop: 4 },

  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap:        12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText:  { fontSize: 14 },

  listCard: {
    borderRadius: 16,
    borderWidth:  1,
    overflow:     'hidden',
  },
  row: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    padding:        14,
  },
  rowLeft:   { gap: 2 },
  rowId:     { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
  rowAgent:  { fontSize: 14, fontWeight: '600' },
  rowRoute:  { fontSize: 12 },
  rowRight:  { alignItems: 'flex-end', gap: 2 },
  rowAmount: { fontSize: 14, fontWeight: '700' },
  rowTime:   { fontSize: 12 },
  divider:   { height: 1, marginHorizontal: 14 },
});