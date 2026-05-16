// src/screens/main-agent/AgentsScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView,
  StyleSheet, StatusBar, SafeAreaView,
  RefreshControl, TextInput, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';
import { SkeletonBox } from '../../components/SkeletonLoader';
import EmptyState     from '../../components/EmptyState';
import PressableScale from '../../components/PressableScale';
import {
  collection, query, where, onSnapshot,
} from 'firebase/firestore';
import { db } from '../../config/firebase';

function SkeletonAgentCard({ theme }) {
  return (
    <View style={[s.card, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, overflow: 'hidden' }]}>
      <View style={[s.cardTop, { padding: spacing.md - 2 }]}>
        <SkeletonBox width={52} height={52} borderRadius={26} />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <SkeletonBox width={150} height={20} borderRadius={6} />
          <SkeletonBox width={100} height={16} borderRadius={5} />
          <SkeletonBox width={130} height={14} borderRadius={5} />
        </View>
        <SkeletonBox width={52} height={26} borderRadius={6} />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm - 2, paddingHorizontal: spacing.md - 2, paddingBottom: spacing.md - 4 }}>
        <SkeletonBox width={60} height={28} borderRadius={6} />
        <SkeletonBox width={50} height={28} borderRadius={6} />
        <SkeletonBox width={70} height={28} borderRadius={6} />
      </View>
      <View style={{ flexDirection: 'row', padding: spacing.md - 4, gap: spacing.md }}>
        <SkeletonBox width="40%" height={40} borderRadius={radius.sm} />
        <SkeletonBox width="40%" height={40} borderRadius={radius.sm} />
      </View>
    </View>
  );
}

export default function AgentsScreen() {
  const { theme, isDark } = useTheme();

  const [agents,     setAgents]     = useState([]);
  const [search,     setSearch]     = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      query(
        collection(db, 'agents'),
        where('status', '==', 'approved'),
        where('role',   '==', 'sub-agent')
      ),
      snap => {
        setAgents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const filtered = agents.filter(a => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a.name?.toLowerCase().includes(s) ||
      a.phone?.includes(s) ||
      a.businessName?.toLowerCase().includes(s)
    );
  });

  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); };

  const avatarColor = (name) => {
    const colors = ['#C8102E', '#0891B2', '#16A34A', '#7C3AED', '#F59E0B'];
    return colors[(name?.charCodeAt(0) ?? 0) % colors.length];
  };

  const initials = (name) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'AG';

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Gradient header ── */}
      <LinearGradient
        colors={[theme.gradPrimA, theme.gradPrimB]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.header}
      >
        <View style={s.headerDecor} />
        <Text style={s.headerTitle}>Agents</Text>
        <Text style={s.headerSub}>{loading ? '—' : agents.length} active</Text>
      </LinearGradient>

      {/* ── Search ── */}
      <View style={[s.searchWrap, { backgroundColor: theme.bg }]}>
        <View style={[s.searchBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.textDim} />
          <TextInput
            style={[s.searchInput, { color: theme.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search agents..."
            placeholderTextColor={theme.muted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={theme.textDim} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#C8102E']} tintColor="#C8102E" />}
      >
        {loading ? (
          <>
            <SkeletonAgentCard theme={theme} />
            <SkeletonAgentCard theme={theme} />
            <SkeletonAgentCard theme={theme} />
          </>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title={search ? 'No results found' : 'No agents yet'}
            subtitle={search ? `No agents match "${search}"` : 'Approved agents will appear here'}
          />
        ) : (
          filtered.map(agent => (
            <PressableScale
              key={agent.id}
              scaleDown={0.98}
              style={[s.card, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
            >
              <View style={s.cardTop}>
                <View style={[s.avatar, { backgroundColor: avatarColor(agent.name) + '20' }]}>
                  <Text style={[s.avatarText, { color: avatarColor(agent.name) }]}>{initials(agent.name)}</Text>
                </View>
                <View style={s.agentInfo}>
                  <Text style={[s.agentName,  { color: theme.text }]}>{agent.name}</Text>
                  <Text style={[s.agentPhone, { color: theme.textDim }]}>{agent.phone}</Text>
                  <Text style={[s.agentBiz,   { color: theme.textDim }]}>
                    {agent.businessName} · {agent.businessLocation}
                  </Text>
                </View>
                <View style={[s.activeBadge, { backgroundColor: '#16A34A20' }]}>
                  <Text style={s.activeText}>Active</Text>
                </View>
              </View>

              {agent.networks?.length > 0 && (
                <View style={s.networksRow}>
                  {agent.networks.map(net => (
                    <View key={net} style={[s.netChip, { backgroundColor: theme.primaryLight, borderColor: theme.primary + '30' }]}>
                      <Text style={[s.netChipText, { color: theme.primary }]}>{net}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={[s.statsRow, { borderTopColor: theme.border }]}>
                <View style={s.stat}>
                  <Text style={[s.statValue, { color: theme.text }]}>{agent.requestCount ?? 0}</Text>
                  <Text style={[s.statLabel, { color: theme.textDim }]}>Requests</Text>
                </View>
                <View style={[s.statDivider, { backgroundColor: theme.border }]} />
                <View style={s.stat}>
                  <Text style={[s.statValue, { color: theme.text }]}>{agent.businessLocation ?? '—'}</Text>
                  <Text style={[s.statLabel, { color: theme.textDim }]}>Location</Text>
                </View>
              </View>
            </PressableScale>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: 100 },

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

  searchWrap: { paddingHorizontal: spacing.md, paddingTop: spacing.md - 4, paddingBottom: spacing.xs },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    height: 48, borderRadius: radius.md, borderWidth: 1.5, paddingHorizontal: spacing.md - 4,
  },
  searchInput: { flex: 1, fontSize: 18, fontFamily: fonts.body },

  card: {
    borderRadius: radius.lg, borderWidth: 1,
    marginBottom: spacing.md - 4, overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: spacing.md - 4, padding: spacing.md - 2,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText:  { fontSize: 20, fontFamily: fonts.bodyBold },
  agentInfo:   { flex: 1, gap: 2 },
  agentName:   { fontSize: 19, fontFamily: fonts.bodyBold },
  agentPhone:  { fontSize: 17, fontFamily: fonts.body },
  agentBiz:    { fontSize: 15, fontFamily: fonts.body },
  activeBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs - 1, borderRadius: radius.sm - 2 },
  activeText:  { color: '#16A34A', fontSize: 15, fontFamily: fonts.bodyBold },

  networksRow: {
    flexDirection: 'row', gap: spacing.sm - 2,
    paddingHorizontal: spacing.md - 2, paddingBottom: spacing.md - 4, flexWrap: 'wrap',
  },
  netChip:     { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm - 2, borderWidth: 1 },
  netChipText: { fontSize: 14, fontFamily: fonts.bodySemi },

  statsRow:    { flexDirection: 'row', borderTopWidth: 1, padding: spacing.md - 4 },
  stat:        { flex: 1, alignItems: 'center' },
  statValue:   { fontSize: 18, fontFamily: fonts.bodyBold },
  statLabel:   { fontSize: 14, fontFamily: fonts.body, marginTop: 2 },
  statDivider: { width: 1, marginVertical: spacing.xs },
});
