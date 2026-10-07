import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { fonts } from '../../constants/theme';
import { formatTzs } from '../../api/exchanges';
import { requestStatusLabel } from '../../api/presentation';
import { workflowError } from '../../api/workflowState';
import {
  collection, query, where, orderBy, limit, onSnapshot, getDocs, db,
} from '../../api/screenData';
import {
  useAgentUI, AgentScroll, AgentButton, AgentNotice,
} from '../../components/agent/AgentUI';

// Keep the established server-scoped subscription and its local owner filter.
const requestsFor = owner => query(
  collection(db, 'requests'),
  where('agentId', '==', owner),
  orderBy('createdAt', 'desc'),
  limit(10000),
);
const networkNames = { Voda: 'M-Pesa', Yas: 'Mixx by Yas', Airtel: 'Airtel Money', Halotel: 'HaloPesa' };

export default function HomeScreen({ navigation }) {
  const { profile, user } = useAuth();
  const { colors, copy } = useAgentUI();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const generation = useRef(0);
  const currentOwner = useRef(user?.id);
  const dataOwner = useRef(user?.id);
  currentOwner.current = user?.id;

  useEffect(() => {
    const owner = user?.id;
    const expected = ++generation.current;
    dataOwner.current = owner;
    setRequests([]);
    setLoadError('');
    setRefreshing(false);
    setLoading(Boolean(owner));
    if (!owner) return;
    const unsubscribe = onSnapshot(requestsFor(owner), snap => {
      if (generation.current !== expected || currentOwner.current !== owner) return;
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadError('');
      setLoading(false);
    }, error => {
      if (generation.current !== expected || currentOwner.current !== owner) return;
      setLoadError(workflowError(error));
      setLoading(false);
    });
    return () => {
      ++generation.current;
      unsubscribe();
    };
  }, [user?.id]);

  // Read the same query on refresh; never submit or retry a financial command.
  const onRefresh = async () => {
    const owner = user?.id;
    if (!owner || refreshing) return;
    const expected = generation.current;
    setRefreshing(true);
    try {
      const snap = await getDocs(requestsFor(owner));
      if (generation.current !== expected || currentOwner.current !== owner) return;
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadError('');
    } catch (error) {
      if (generation.current === expected && currentOwner.current === owner) setLoadError(workflowError(error));
    } finally {
      if (generation.current === expected && currentOwner.current === owner) {
        setRefreshing(false);
        setLoading(false);
      }
    }
  };

  const firstName = profile?.name?.trim().split(/\s+/)[0] || copy('Agent', 'Wakala');
  // Hide the previous owner's render before the subscription effect clears it.
  const ownerChanged = dataOwner.current !== user?.id;
  const latest = ownerChanged ? null : requests[0];
  const visibleError = ownerChanged ? '' : loadError;
  const reading = loading || (Boolean(user?.id) && ownerChanged);
  const statuses = {
    awaiting_review: copy('Awaiting main-agent review', 'Inasubiri ukaguzi wa wakala mkuu'),
    awaiting_source: copy('Reserved · provider disabled', 'Imehifadhiwa · mtoa huduma hajawashwa'),
    needs_attention: copy('Reconciliation needed', 'Uhakiki wa muamala unahitajika'),
    completed: copy('Completed', 'Imekamilika'),
    rejected: copy('Rejected', 'Imekataliwa'),
    cancelled: copy('Cancelled', 'Imefutwa'),
    expired: copy('Expired', 'Muda umeisha'),
  };
  const status = latest && (statuses[latest.status] || requestStatusLabel(latest.status));
  const statusIcon = latest?.status === 'completed' ? 'checkmark-circle-outline'
    : latest?.status === 'needs_attention' ? 'alert-circle-outline'
      : ['rejected', 'cancelled', 'expired'].includes(latest?.status) ? 'close-circle-outline' : 'time-outline';
  const unresolved = latest?.status === 'needs_attention' || latest?.legs?.some(leg => leg.status === 'unknown');

  return (
    <AgentScroll contentContainerStyle={styles.content} refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.text]} tintColor={colors.text} />
    }>
      <View style={styles.introduction}>
        <Text style={[styles.greeting, { color: colors.secondary }]}>{copy('Hello', 'Habari')}, {firstName}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{copy('Exchange float', 'Badilisha float')}</Text>
        <Text style={[styles.subtitle, { color: colors.secondary }]}>{copy('Through your main-agent', 'Kupitia wakala wako mkuu')}</Text>
        <AgentButton label={copy('New request', 'Ombi jipya')} onPress={() => navigation.navigate('NewRequest')} />
      </View>

      <View style={styles.latestSection}>
        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{copy('Latest request', 'Ombi la karibuni')}</Text>
          <AgentButton label={copy('View all', 'Ona yote')} variant="text" icon={null} onPress={() => navigation.navigate('MyRequests', { showList: true })} />
        </View>
        {visibleError ? <AgentNotice error>
          {visibleError}{latest ? ` ${copy('The last loaded request may be out of date.', 'Ombi lililopakiwa linaweza kuwa limebadilika.')}` : ''}
        </AgentNotice> : null}
        {reading ? <Text accessibilityLiveRegion="polite" style={[styles.stateText, { color: colors.secondary }]}>
          {copy('Loading your requests…', 'Inapakia maombi yako…')}
        </Text> : latest ? (
          <TouchableOpacity accessibilityRole="button"
            accessibilityLabel={`${copy('View latest request', 'Ona ombi la karibuni')}: TZS ${formatTzs(latest.amount)}, ${status}`}
            activeOpacity={0.8} onPress={() => navigation.navigate('MyRequests', { requestId: latest.id })}
            style={[styles.preview, { backgroundColor: colors.surface }]}>
            <View style={styles.previewHeading}>
              <Text style={[styles.amount, { color: colors.text }]}>TZS {formatTzs(latest.amount)}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
            </View>
            <Text style={[styles.route, { color: colors.secondary }]}>
              {networkNames[latest.sourceNetwork] || latest.sourceNetwork} → {networkNames[latest.destNetwork] || latest.destNetwork}
            </Text>
            <View style={styles.statusLine}>
              <Ionicons name={statusIcon} size={17} color={colors.secondary} />
              <Text style={[styles.status, { color: colors.secondary }]}>{status}</Text>
            </View>
            {unresolved ? <Text style={[styles.warning, { color: colors.text }]}>
              {copy('Outcome unresolved. Do not send funds or start another payment.', 'Matokeo hayajathibitishwa. Usitume fedha wala kuanzisha malipo mengine.')}
            </Text> : null}
          </TouchableOpacity>
        ) : !visibleError ? <Text style={[styles.stateText, { color: colors.secondary }]}>
          {copy('No requests yet. Start with a new request above.', 'Bado hakuna maombi. Anza na ombi jipya hapo juu.')}
        </Text> : null}
        {visibleError ? <AgentButton label={copy('Retry loading requests', 'Jaribu kupakia maombi tena')}
          onPress={onRefresh} disabled={refreshing} busy={refreshing} variant="text" icon="refresh-outline" /> : null}
      </View>
    </AgentScroll>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16 },
  introduction: { gap: 8 },
  greeting: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  title: { fontFamily: fonts.heading, fontSize: 29, lineHeight: 36, letterSpacing: -0.5 },
  subtitle: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, marginBottom: 10 },
  latestSection: { marginTop: 26 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 },
  sectionTitle: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 24 },
  preview: { borderRadius: 18, padding: 18 },
  previewHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  amount: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 21, lineHeight: 29 },
  route: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, marginTop: 4 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7 },
  status: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 22 },
  warning: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, marginTop: 10 },
  stateText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, paddingVertical: 18 },
});
