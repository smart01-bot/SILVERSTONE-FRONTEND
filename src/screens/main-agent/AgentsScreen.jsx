// src/screens/main-agent/AgentsScreen.jsx
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
  collection, query, where, onSnapshot,
} from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function AgentsScreen() {
  const { theme, isDark } = useTheme();

  const [agents,     setAgents]     = useState([]);
  const [search,     setSearch]     = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      query(
        collection(db, 'agents'),
        where('status', '==', 'approved'),
        where('role',   '==', 'sub-agent')
      ),
      snap => setAgents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
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
      <StatusBar barStyle="light-content" backgroundColor="#C8102E" />

      <View style={s.header}>
        <Text style={s.headerTitle}>Agents</Text>
        <Text style={s.headerSub}>{agents.length} active</Text>
      </View>

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
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="people-outline" size={64} color={theme.muted} />
            <Text style={[s.emptyTitle, { color: theme.text }]}>No agents yet</Text>
            <Text style={[s.emptyText,  { color: theme.textDim }]}>Approved agents will appear here</Text>
          </View>
        ) : (
          filtered.map(agent => (
            <View key={agent.id} style={[s.card, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
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
            </View>
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
    backgroundColor:         '#C8102E',
    paddingHorizontal:       spacing.md + 2,
    paddingTop:              spacing.sm + 2,
    paddingBottom:           spacing.md - 2,
    borderBottomLeftRadius:  radius.xxl,
    borderBottomRightRadius: radius.xxl,
  },
  headerTitle: { fontSize: 28, fontFamily: fonts.display, color: '#fff' },
  headerSub:   { fontSize: 17, fontFamily: fonts.body,    color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  searchWrap: { paddingHorizontal: spacing.md, paddingTop: spacing.md - 4, paddingBottom: spacing.xs },
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

  empty:      { alignItems: 'center', paddingTop: spacing.xxl + spacing.lg, gap: spacing.md - 4 },
  emptyTitle: { fontSize: 22, fontFamily: fonts.heading },
  emptyText:  { fontSize: 17, fontFamily: fonts.body },

  card: {
    borderRadius: radius.lg,
    borderWidth:  1,
    marginBottom: spacing.md - 4,
    overflow:     'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           spacing.md - 4,
    padding:       spacing.md - 2,
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
  activeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical:   spacing.xs - 1,
    borderRadius:      radius.sm - 2,
  },
  activeText:  { color: '#16A34A', fontSize: 15, fontFamily: fonts.bodyBold },
  networksRow: {
    flexDirection:     'row',
    gap:               spacing.sm - 2,
    paddingHorizontal: spacing.md - 2,
    paddingBottom:     spacing.md - 4,
    flexWrap:          'wrap',
  },
  netChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical:   spacing.xs,
    borderRadius:      radius.sm - 2,
    borderWidth:       1,
  },
  netChipText: { fontSize: 14, fontFamily: fonts.bodySemi },
  statsRow:    { flexDirection: 'row', borderTopWidth: 1, padding: spacing.md - 4 },
  stat:        { flex: 1, alignItems: 'center' },
  statValue:   { fontSize: 18, fontFamily: fonts.bodyBold },
  statLabel:   { fontSize: 14, fontFamily: fonts.body, marginTop: 2 },
  statDivider: { width: 1, marginVertical: spacing.xs },
});
