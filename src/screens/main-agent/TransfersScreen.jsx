import { useMainCollection } from '../../hooks/useMainCollection';
import { formatTzs } from '../../api/exchanges';
import RequestDetailModal from '../../components/RequestDetailModal';
import { MainError } from '../../components/agent/MainAgentUI';
import { MainHeader, MainEmpty } from '../../components/agent/MainAgentUI';
import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/main-agent/TransfersScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
  RefreshControl, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';
import { SkeletonBox } from '../../components/SkeletonLoader';
const EmptyState=({subtitle,...props})=><MainEmpty {...props} description={subtitle}/>;
import PressableScale from '../../components/PressableScale';
import {
  collection, query, where, orderBy, onSnapshot,
} from '../../api/screenData';
import { db } from '../../api/screenData';

function SkeletonTransferRow({ theme, last }) {
  return (
    <View>
      <View style={s.row}>
        <View style={s.rowLeft}>
          <SkeletonBox width={70}  height={14} borderRadius={4} />
          <SkeletonBox width={130} height={18} borderRadius={6} style={{ marginTop: 3 }} />
          <SkeletonBox width={100} height={14} borderRadius={5} style={{ marginTop: 3 }} />
        </View>
        <View style={[s.rowRight, { alignItems: 'flex-end', gap: spacing.xs }]}>
          <SkeletonBox width={80} height={18} borderRadius={6} />
          <SkeletonBox width={55} height={14} borderRadius={4} />
        </View>
      </View>
      {!last && <View style={[s.divider, { backgroundColor: theme.border }]} />}
    </View>
  );
}

export default function TransfersScreen({ navigation }) {
  const { theme, isDark, tr, lang } = useTheme();

  const collectionState=useMainCollection('requests');
  const assignedAgents=useMainCollection('agents');
  const names=Object.fromEntries(assignedAgents.rows.map(a=>[a.id,a.name]));
  const transfers=collectionState.rows.filter(r=>r.status==='completed').map(r=>({...r,agentName:r.agentName||names[r.agentId||r.subAgentId]}));
  const {loading,refreshing,error:loadError}=collectionState;
  const [filter,setFilter]=useState('All'),[search,setSearch]=useState(''),[selected,setSelected]=useState(null);
  const FILTERS=['All','Today','This Week','This Month'];
  const completedAt=t=>t.processedAt||t.history?.find(e=>e.event==='payout_confirmed')?.createdAt;
  const filterByDate = (items) => {
    const day   = new Date(); day.setHours(0, 0, 0, 0);
    const week  = new Date(); week.setDate(week.getDate() - 7);
    const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
    return items.filter(t => {
      const d = completedAt(t) ? new Date(completedAt(t)) : new Date(0);
      if (filter === 'Today')      return d >= day;
      if (filter === 'This Week')  return d >= week;
      if (filter === 'This Month') return d >= month;
      return true;
    });
  };

  const filtered = filterByDate(transfers).filter(t => {
    if (!search) return true;
    const sv = search.toLowerCase();
    return (
      t.agentName?.toLowerCase().includes(sv) ||
      String(t.amount).includes(sv) ||
      t.sourceNetwork?.toLowerCase().includes(sv) ||
      t.destNetwork?.toLowerCase().includes(sv)
    );
  });

  const totalVolume=filtered.reduce((sum,t)=>sum+BigInt(t.amount||0),0n);
  const fmt=n=>`TZS ${formatTzs(n)}`;
  const timeAgo=ts=>ts?new Date(ts).toLocaleDateString(lang==='sw'?'sw-TZ':'en-TZ',{day:'numeric',month:'short'}):'';
  const onRefresh=collectionState.refresh;
  return (
    <SafeAreaView edges={['top','left','right']} style={[s.safe, { backgroundColor: theme.bg }]}>

      {/* ── Gradient header ── */}
      <MainHeader navigation={navigation} title={tr('transfers')} subtitle={lang==='sw'?'Historia ya miamala iliyokamilika':'Confirmed exchange history'} />

      {/* ── Search ── */}
      <View style={[s.searchWrap, { backgroundColor: theme.bg }]}>
        <View style={[s.searchBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.textDim} />
          <TextInput
            style={[s.searchInput, { color: theme.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder={lang==='sw'?'Tafuta wakala au kiasi':'Search agent or amount'} accessibilityLabel={lang==='sw'?'Tafuta miamala':'Search transfers'}
            placeholderTextColor={theme.muted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={theme.textDim} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Date filter pills ── */}
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
                <Text style={[s.pillText, { color: filter === f ? theme.onPrimary : theme.textDim }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.text]} tintColor={theme.text} />}
      >
        <MainError message={loadError} onRetry={onRefresh} busy={refreshing}/>
        {/* Volume of loaded, completed exchanges */}
        <View style={[s.volumeCard,{borderColor:theme.border}]}>
          <Text style={[s.volumeLabel,  { color: theme.textDim }]}>{lang==='sw'?'Kiasi kilichokamilika':'Completed volume'}</Text>
          {loading
            ? <SkeletonBox width={160} height={36} borderRadius={8} style={{ marginTop: spacing.xs }} />
            : <Text style={[s.volumeAmount, { color: theme.text }]}>{fmt(totalVolume)}</Text>
          }
          <Text style={[s.volumeSub, { color: theme.textDim }]}>{loading ? '—' : filtered.length} transactions</Text>
        </View>

        {/* ── Transfer list ── */}
        {loading ? (
          <View style={[s.listCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            {[0,1,2,3,4].map((i, _, arr) => (
              <SkeletonTransferRow key={i} theme={theme} last={i === arr.length - 1} />
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="swap-horizontal-outline"
            title="No transfers yet"
            subtitle={search ? `No transfers match "${search}"` : 'Processed transfers will appear here'}
          />
        ) : (
          <View style={[s.listCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            {filtered.map((t, i) => (
              <View key={t.id}>
                <PressableScale onPress={()=>setSelected(t)} accessibilityLabel={`TZS ${formatTzs(t.amount)}, ${t.agentName||'Agent'}`} style={s.row} scaleDown={0.98}>
                  <View style={s.rowLeft}>
                    <Text style={[s.rowId,    { color: theme.textDim }]}>#{t.id.slice(-6).toUpperCase()}</Text>
                    <Text style={[s.rowAgent, { color: theme.text }]}>{t.agentName ?? 'Agent'}</Text>
                    <Text style={[s.rowRoute, { color: theme.textDim }]}>{t.sourceNetwork} → {t.destNetwork}</Text>
                  </View>
                  <View style={s.rowRight}>
                    <Text style={[s.rowAmount, { color: theme.primary }]}>{fmt(t.amount)}</Text>
                    <Text style={[s.rowTime,   { color: theme.textDim }]}>{timeAgo(completedAt(t))}</Text>
                  </View>
                </PressableScale>
                {i < filtered.length - 1 && (
                  <View style={[s.divider, { backgroundColor: theme.border }]} />
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <RequestDetailModal request={selected} visible={!!selected} role="main-agent" onClose={()=>setSelected(null)}/>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingHorizontal:24,paddingTop:8,paddingBottom:24 },

  header: {
    paddingHorizontal:       spacing.md + 2,
    paddingTop:              spacing.xxl + spacing.sm,
    paddingBottom:           spacing.lg,
    borderBottomLeftRadius:  radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow:                'hidden',
  },
  headerDecor: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -60, right: -40,
  },
  headerTitle: { fontSize: 30, fontFamily: fonts.display, color: '#fff' },
  headerSub:   { fontSize: 17, fontFamily: fonts.body, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  searchWrap: { paddingHorizontal: 24, paddingTop: spacing.md - 4 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    minHeight: 52, borderRadius: radius.md, borderWidth: 1.5, paddingHorizontal: spacing.md - 4,
  },
  searchInput: { flex: 1,minWidth:0,paddingVertical:12,fontSize: 16, fontFamily: fonts.body },

  filters:   { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md },
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md - 2, paddingVertical: 12,minHeight:48,justifyContent:'center',
    borderRadius: radius.full, borderWidth: 1,
  },
  pillText: { fontSize: 14, fontFamily: fonts.bodySemi },

  volumeCard: {
    borderBottomWidth:1,
    padding:       spacing.md,
    marginBottom:  spacing.md,
    alignItems:    'flex-start',
  },
  volumeLabel:  { fontSize: 14, fontFamily: fonts.bodySemi, letterSpacing: 1 },
  volumeAmount: { fontSize: 36, fontFamily: fonts.display, marginTop: spacing.xs },
  volumeSub:    { fontSize: 17, fontFamily: fonts.body, marginTop: spacing.xs },

  listCard: { overflow:'hidden' },
  row: {
    flexWrap:'wrap',gap:12,flexDirection: 'row', justifyContent: 'space-between',
    padding: spacing.md - 2,
  },
  rowLeft:   { flex:1,minWidth:140,gap:5 },
  rowId:     { fontSize: 14, fontFamily: fonts.bodySemi, letterSpacing: 0.4 },
  rowAgent:  { fontSize: 18, fontFamily: fonts.bodyBold },
  rowRoute:  { fontSize: 15, fontFamily: fonts.body },
  rowRight:  { alignItems: 'flex-end', gap: 2 },
  rowAmount: { fontSize: 18, fontFamily: fonts.bodyBold },
  rowTime:   { fontSize: 15, fontFamily: fonts.body },
  divider:   { height: 1, marginHorizontal: spacing.md - 2 },
});
