// src/screens/main-agent/ApprovalsScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  RefreshControl, Alert, ActivityIndicator,
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
  doc, updateDoc, Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';

function SkeletonAgentCard({ theme }) {
  return (
    <View style={[s.card, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      <View style={[s.cardTop, { padding: spacing.md - 2 }]}>
        <SkeletonBox width={52} height={52} borderRadius={26} />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <SkeletonBox width={140} height={20} borderRadius={6} />
          <SkeletonBox width={100} height={16} borderRadius={5} />
        </View>
        <SkeletonBox width={50} height={14} borderRadius={4} />
      </View>
      <View style={[s.details, { borderTopColor: theme.border, gap: spacing.sm - 2 }]}>
        {[0,1,2].map(i => (
          <View key={i} style={s.detailRow}>
            <SkeletonBox width={60}  height={14} borderRadius={4} />
            <SkeletonBox width={100} height={14} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ApprovalsScreen() {
  const { theme, isDark } = useTheme();

  const [agents,     setAgents]     = useState([]);
  const [filter,     setFilter]     = useState('Pending');
  const [refreshing, setRefreshing] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [actionLoad, setActionLoad] = useState(null);

  const FILTERS = ['Pending', 'Approved', 'Rejected'];

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'agents'), where('role', '==', 'sub-agent')),
      snap => {
        setAgents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const filtered     = agents.filter(a => a.status === filter.toLowerCase());
  const pendingCount = agents.filter(a => a.status === 'pending').length;

  const handleApprove = async (agent) => {
    setActionLoad(agent.id + '_approve');
    try {
      await updateDoc(doc(db, 'agents', agent.id), { status: 'approved', approvedAt: Timestamp.now() });
    } catch (e) {
      Alert.alert('Error', 'Failed to approve agent.');
    } finally {
      setActionLoad(null);
    }
  };

  const handleReject = (agent) => {
    Alert.alert('Reject Application', 'Select a reason:', [
      { text: 'Does not meet requirements', onPress: () => doReject(agent, 'Does not meet requirements') },
      { text: 'Invalid documentation',      onPress: () => doReject(agent, 'Invalid documentation') },
      { text: 'Duplicate application',      onPress: () => doReject(agent, 'Duplicate application') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const doReject = async (agent, reason) => {
    setActionLoad(agent.id + '_reject');
    try {
      await updateDoc(doc(db, 'agents', agent.id), {
        status: 'rejected', rejectionReason: reason, rejectedAt: Timestamp.now(),
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to reject agent.');
    } finally {
      setActionLoad(null);
    }
  };

  const daysAgo = (ts) => {
    if (!ts?.toDate) return '';
    const days = Math.floor((Date.now() - ts.toDate().getTime()) / 86400000);
    if (days === 0) return 'TODAY';
    if (days === 1) return 'YESTERDAY';
    return `${days}D AGO`;
  };

  const avatarColor = (name) => {
    const colors = ['#C8102E', '#0891B2', '#16A34A', '#7C3AED', '#F59E0B'];
    return colors[(name?.charCodeAt(0) ?? 0) % colors.length];
  };

  const initials = (name) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'AG';

  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); };

  const emptyMessages = {
    Pending:  { title: 'No pending applications', subtitle: 'New agent applications will appear here' },
    Approved: { title: 'No approved agents yet',  subtitle: 'Approved applications will show here' },
    Rejected: { title: 'No rejected applications',subtitle: 'Rejected applications will show here' },
  };

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
        <Text style={s.headerTitle}>Agent Approvals</Text>
        <Text style={s.headerSub}>Review applications & ID docs</Text>
        {pendingCount > 0 && (
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeText}>{pendingCount} pending</Text>
          </View>
        )}
      </LinearGradient>

      {/* ── Filter pills ── */}
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
                <Text style={[s.pillText, { color: filter === f ? '#fff' : theme.textDim }]}>
                  {f}{f === 'Pending' && pendingCount > 0 ? `  ${pendingCount}` : ''}
                </Text>
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
        {loading ? (
          <>
            <SkeletonAgentCard theme={theme} />
            <SkeletonAgentCard theme={theme} />
            <SkeletonAgentCard theme={theme} />
          </>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="person-outline"
            title={emptyMessages[filter].title}
            subtitle={emptyMessages[filter].subtitle}
          />
        ) : (
          filtered.map(agent => (
            <PressableScale key={agent.id} scaleDown={0.98} style={[s.card, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <View style={s.cardTop}>
                <View style={[s.avatar, { backgroundColor: avatarColor(agent.name) + '20' }]}>
                  <Text style={[s.avatarText, { color: avatarColor(agent.name) }]}>{initials(agent.name)}</Text>
                </View>
                <View style={s.agentInfo}>
                  <Text style={[s.agentName, { color: theme.text }]}>{agent.name}</Text>
                  <Text style={[s.agentSub,  { color: theme.textDim }]}>
                    {agent.businessLocation} · {agent.networks?.length ?? 0} tills
                  </Text>
                  {agent.rejectionReason && (
                    <Text style={s.rejectionReason}>{agent.rejectionReason}</Text>
                  )}
                </View>
                <Text style={[s.daysAgo, { color: theme.textDim }]}>{daysAgo(agent.createdAt)}</Text>
              </View>

              <View style={[s.details, { borderTopColor: theme.border }]}>
                {[
                  { label: 'Phone',    value: agent.phone },
                  { label: 'Business', value: agent.businessName },
                  { label: 'Reg No',   value: agent.regNo },
                  { label: 'TIN',      value: agent.tin },
                  { label: 'NIDA',     value: agent.nida },
                ].map(row => (
                  <View key={row.label} style={s.detailRow}>
                    <Text style={[s.detailLabel, { color: theme.textDim }]}>{row.label}</Text>
                    <Text style={[s.detailValue, { color: theme.text }]}>{row.value ?? '—'}</Text>
                  </View>
                ))}
              </View>

              {agent.status === 'pending' && (
                <View style={s.actions}>
                  <TouchableOpacity style={[s.btnOutline, { borderColor: theme.border }]} activeOpacity={0.75}>
                    <Text style={[s.btnOutlineText, { color: theme.textDim }]}>View docs</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleApprove(agent)}
                    style={[s.btnFilled, { backgroundColor: '#C8102E' }]}
                    activeOpacity={0.85}
                  >
                    {actionLoad === agent.id + '_approve'
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={s.btnFilledText}>Approve</Text>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleReject(agent)}
                    style={[s.btnOutline, { borderColor: '#C8102E' }]}
                    activeOpacity={0.75}
                  >
                    {actionLoad === agent.id + '_reject'
                      ? <ActivityIndicator size="small" color="#C8102E" />
                      : <Text style={[s.btnOutlineText, { color: '#C8102E' }]}>Reject</Text>
                    }
                  </TouchableOpacity>
                </View>
              )}
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
  headerBadge: {
    marginTop:         spacing.sm,
    alignSelf:         'flex-start',
    backgroundColor:   'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md - 2,
    paddingVertical:   spacing.xs,
    borderRadius:      radius.full,
  },
  headerBadgeText: { color: '#fff', fontSize: 15, fontFamily: fonts.bodySemi },

  filters:   { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md },
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md - 2, paddingVertical: spacing.sm + 1,
    borderRadius: radius.full, borderWidth: 1,
  },
  pillText: { fontSize: 17, fontFamily: fonts.bodySemi },

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
  avatarText:      { fontSize: 20, fontFamily: fonts.bodyBold },
  agentInfo:       { flex: 1, gap: 2 },
  agentName:       { fontSize: 19, fontFamily: fonts.bodyBold },
  agentSub:        { fontSize: 15, fontFamily: fonts.body },
  rejectionReason: { fontSize: 15, fontFamily: fonts.body, color: '#C8102E', marginTop: 2 },
  daysAgo:         { fontSize: 13, fontFamily: fonts.bodyBold, letterSpacing: 0.4 },

  details: {
    borderTopWidth: 1, paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.sm + 2, gap: spacing.sm - 2,
  },
  detailRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: 15, fontFamily: fonts.body },
  detailValue: { fontSize: 15, fontFamily: fonts.bodySemi },

  actions: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md - 2, paddingTop: 0 },
  btnOutline: {
    flex: 1, height: 46, borderRadius: radius.md, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  btnOutlineText: { fontSize: 16, fontFamily: fonts.bodySemi },
  btnFilled: {
    flex: 1, height: 46, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnFilledText: { color: '#fff', fontSize: 16, fontFamily: fonts.bodyBold },
});
