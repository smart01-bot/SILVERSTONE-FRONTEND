// src/screens/main-agent/AgentsScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  RefreshControl, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
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
        where('role', '==', 'sub-agent')
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

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const avatarColor = (name) => {
    const colors = ['#C8102E', '#0891B2', '#16A34A', '#7C3AED', '#F59E0B'];
    const i = (name?.charCodeAt(0) ?? 0) % colors.length;
    return colors[i];
  };

  const initials = (name) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'AG';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#C8102E" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agents</Text>
        <Text style={styles.headerSub}>{agents.length} active</Text>
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
            placeholder="Search agents..."
            placeholderTextColor={theme.muted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={theme.textDim} />
            </TouchableOpacity>
          )}
        </View>
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
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={56} color={theme.muted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No agents yet
            </Text>
            <Text style={[styles.emptyText, { color: theme.textDim }]}>
              Approved agents will appear here
            </Text>
          </View>
        ) : (
          filtered.map(agent => (
            <View
              key={agent.id}
              style={[styles.card, {
                backgroundColor: theme.surfaceAlt,
                borderColor:     theme.border,
              }]}
            >
              {/* Top row */}
              <View style={styles.cardTop}>
                <View style={[
                  styles.avatar,
                  { backgroundColor: avatarColor(agent.name) + '20' },
                ]}>
                  <Text style={[
                    styles.avatarText,
                    { color: avatarColor(agent.name) },
                  ]}>
                    {initials(agent.name)}
                  </Text>
                </View>
                <View style={styles.agentInfo}>
                  <Text style={[styles.agentName, { color: theme.text }]}>
                    {agent.name}
                  </Text>
                  <Text style={[styles.agentPhone, { color: theme.textDim }]}>
                    {agent.phone}
                  </Text>
                  <Text style={[styles.agentBiz, { color: theme.textDim }]}>
                    {agent.businessName} · {agent.businessLocation}
                  </Text>
                </View>
                <View style={[styles.activeBadge, { backgroundColor: '#16A34A20' }]}>
                  <Text style={styles.activeText}>Active</Text>
                </View>
              </View>

              {/* Networks */}
              {agent.networks?.length > 0 && (
                <View style={styles.networksRow}>
                  {agent.networks.map(net => (
                    <View
                      key={net}
                      style={[styles.netChip, {
                        backgroundColor: theme.primaryLight,
                        borderColor:     theme.primary + '30',
                      }]}
                    >
                      <Text style={[styles.netChipText, { color: theme.primary }]}>
                        {net}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Stats row */}
              <View style={[styles.statsRow, { borderTopColor: theme.border }]}>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {agent.requestCount ?? 0}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textDim }]}>
                    Requests
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {agent.businessLocation ?? '—'}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textDim }]}>
                    Location
                  </Text>
                </View>
              </View>
            </View>
          ))
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

  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
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

  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap:        12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText:  { fontSize: 14 },

  card: {
    borderRadius:  16,
    borderWidth:   1,
    marginBottom:  12,
    overflow:      'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           12,
    padding:       14,
  },
  avatar: {
    width:          44,
    height:         44,
    borderRadius:   22,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  agentInfo:  { flex: 1, gap: 2 },
  agentName:  { fontSize: 15, fontWeight: '700' },
  agentPhone: { fontSize: 13 },
  agentBiz:   { fontSize: 12 },
  activeBadge:{
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      6,
  },
  activeText: {
    color:      '#16A34A',
    fontSize:   11,
    fontWeight: '700',
  },
  networksRow: {
    flexDirection:     'row',
    gap:               6,
    paddingHorizontal: 14,
    paddingBottom:     12,
    flexWrap:          'wrap',
  },
  netChip: {
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:      6,
    borderWidth:       1,
  },
  netChipText: { fontSize: 11, fontWeight: '600' },
  statsRow: {
    flexDirection:  'row',
    borderTopWidth: 1,
    padding:        12,
  },
  stat:      { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider:{ width: 1, marginVertical: 4 },
});