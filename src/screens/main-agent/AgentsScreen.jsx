import { BrandRefreshControl, RefreshIndicator, LoadingIndicator } from '../../components/Loader';
import { useMainCollection } from '../../hooks/useMainCollection';
import { MainError } from '../../components/agent/MainAgentUI';
import { MainHeader, MainEmpty } from '../../components/agent/MainAgentUI';
import { SafeAreaView } from 'react-native-safe-area-context';
// src/screens/main-agent/AgentsScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView,
  StyleSheet, StatusBar,
  TextInput, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';
const EmptyState=({subtitle,...props})=><MainEmpty {...props} description={subtitle}/>;
import PressableScale from '../../components/PressableScale';
import {
  collection, query, where, onSnapshot,
} from '../../api/screenData';
import { db } from '../../api/screenData';

export default function AgentsScreen({ navigation }) {
  const { theme, isDark, tr, lang } = useTheme();

  const collectionState=useMainCollection('agents');
  const {rows:agents,loading,refreshing,error:loadError}=collectionState;
  const [search,setSearch]=useState('');
  const filtered = agents.filter(a => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a.name?.toLowerCase().includes(s) ||
      a.phone?.includes(s) ||
      a.businessName?.toLowerCase().includes(s)
    );
  });

  const onRefresh=collectionState.refresh;

  const avatarColor = (name) => {
    return theme.primary;
  };

  const initials = (name) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'AG';

  return (
    <SafeAreaView edges={['top','left','right']} style={[s.safe, { backgroundColor: theme.bg }]}>

      {/* ── Gradient header ── */}
      <MainHeader navigation={navigation} title={tr('agents')} subtitle={loading?'…':`${agents.length} ${lang==='sw'?'wakala walioidhinishwa':'approved agents'}`} />

      {/* ── Search ── */}
      <View style={[s.searchWrap, { backgroundColor: theme.bg }]}>
        <View style={[s.searchBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.textDim} />
          <TextInput
            style={[s.searchInput, { color: theme.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder={tr('searchAgents')}
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
        refreshControl={<BrandRefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.text]} tintColor={theme.text} />}
      >
        <RefreshIndicator refreshing={refreshing} color={theme.text} />
        <MainError message={loadError} onRetry={onRefresh} busy={refreshing}/>
        {loading ? (
          <LoadingIndicator label={lang === 'sw' ? 'Inapakia mawakala…' : 'Loading agents…'} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title={search ? tr('noResults') : tr('noAgents')}
            subtitle={search ? `No agents match "${search}"` : tr('noAgentsDesc')}
          />
        ) : (
          filtered.map(agent => (
            <View
              key={agent.id}
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
                    {[agent.businessName,agent.businessLocation].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <View style={[s.activeBadge, { backgroundColor: '#16A34A20' }]}>
                  <Text style={[s.activeText,{color:theme.success}]}>{tr('active')}</Text>
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

            </View>
          ))
        )}
      </ScrollView>
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

  searchWrap: { paddingHorizontal: 24, paddingTop: spacing.md - 4, paddingBottom: spacing.xs },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    minHeight: 52, borderRadius: radius.md, borderWidth: 1.5, paddingHorizontal: spacing.md - 4,
  },
  searchInput: { flex: 1,minWidth:0,paddingVertical:12,fontSize: 16, fontFamily: fonts.body },

  card: {
    borderRadius:20,borderWidth:1,
    marginBottom: spacing.md - 4, overflow: 'hidden',
  },
  cardTop: {
    flexWrap:'wrap',flexDirection: 'row', alignItems: 'flex-start',
    gap: spacing.md - 4, padding: spacing.md - 2,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText:  { fontSize: 20, fontFamily: fonts.bodyBold },
  agentInfo:   { flex: 1, gap: 2 },
  agentName:   { fontSize: 19, fontFamily: fonts.bodyBold },
  agentPhone:  { fontSize: 14,lineHeight:22, fontFamily: fonts.body },
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
