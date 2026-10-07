import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, BackHandler, FlatList, Pressable,
  RefreshControl, StyleSheet, Text, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../config/api';
import { needsReconciliation, reservationLabel } from '../../api/operations';
import { requestStatusLabel, requestView } from '../../api/presentation';
import { loadRequests, workflowError } from '../../api/workflowState';
import { formatTzs } from '../../api/exchanges';
import { collection, query, where, orderBy, onSnapshot, db } from '../../api/screenData';
import { useAuth } from '../../context/AuthContext';
import { fonts } from '../../constants/theme';
import { timeAgo } from '../../utils/time';
import {
  AgentButton, AgentNotice, AgentRow, AgentSheet, useAgentUI,
} from '../../components/agent/AgentUI';
import AgentRequestDetails from '../../components/agent/AgentRequestDetails';
import { networkDisplayName } from '../../components/agent/agentPresentation';

const FILTER_KEYS = ['all', 'unresolved', 'awaiting_review', 'awaiting_source', 'completed', 'rejected'];

function statusIcon(request) {
  if (needsReconciliation(request)) return 'alert-circle-outline';
  if (request.status === 'completed') return 'checkmark-circle-outline';
  if (['rejected', 'cancelled', 'expired'].includes(request.status)) return 'close-circle-outline';
  return 'time-outline';
}

export default function MyRequestsScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors, lang, copy } = useAgentUI();
  const [loadError, setLoadError] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [filterVisible, setFilterVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const generation = useRef(0);
  const currentOwner = useRef(user?.id);
  const dataOwner = useRef(user?.id);
  currentOwner.current = user?.id;
  const ownerChanged = dataOwner.current !== user?.id;
  const visibleRequests = ownerChanged ? [] : requests;
  const visibleError = ownerChanged ? '' : loadError;
  const reading = loading || (Boolean(user?.id) && ownerChanged);

  const filterLabel = key => ({
    all: copy('All', 'Yote'),
    unresolved: copy('Unresolved', 'Yanayohitaji uhakiki'),
    awaiting_review: copy('Awaiting review', 'Yanasubiri ukaguzi'),
    awaiting_source: copy('Reserved', 'Yamehifadhiwa'),
    completed: copy('Completed', 'Yamekamilika'),
    rejected: copy('Rejected', 'Yamekataliwa'),
  }[key]);

  useEffect(() => {
    const owner = user?.id;
    const expected = ++generation.current;
    dataOwner.current = owner;
    setRequests([]);
    setSelectedRequest(null);
    setFilter('all');
    setFilterVisible(false);
    setLoadError('');
    setRefreshing(false);
    setLoading(Boolean(owner));
    if (!owner) return;
    const unsubscribe = onSnapshot(
      query(collection(db, 'requests'), where('agentId', '==', owner), orderBy('createdAt', 'desc')),
      snap => {
        if (generation.current !== expected || currentOwner.current !== owner) return;
        setLoadError('');
        setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      error => {
        if (generation.current !== expected || currentOwner.current !== owner) return;
        setLoading(false);
        setLoadError(workflowError(error));
      },
    );
    return () => { ++generation.current; unsubscribe(); };
  }, [user?.id]);

  // Home opens a known record from the same server-scoped collection.
  useEffect(() => {
    if (ownerChanged) return;
    if (route?.params?.showList) {
      setSelectedRequest(null);
      setFilter('all');
      navigation.setParams({ showList: undefined, requestId: undefined });
      return;
    }
    const id = route?.params?.requestId;
    if (!id || selectedRequest?.id === id) return;
    const request = requests.find(item => item.id === id);
    if (request) setSelectedRequest(request);
  }, [route?.params?.requestId, route?.params?.showList, requests, selectedRequest?.id, navigation, ownerChanged]);

  const closeDetails = useCallback(() => {
    navigation.setParams({ requestId: undefined, showList: undefined });
    setSelectedRequest(null);
  }, [navigation]);

  useFocusEffect(useCallback(() => {
    if (!selectedRequest || ownerChanged) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeDetails();
      return true;
    });
    return () => subscription.remove();
  }, [selectedRequest, closeDetails, ownerChanged]));

  const filtered = visibleRequests
    .filter(request => filter === 'all' || (filter === 'unresolved' ? needsReconciliation(request) : request.status === filter))
    .sort((a, b) => {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      return 0;
    });

  const onRefresh = async () => {
    const owner = user?.id;
    if (!owner || refreshing) return;
    const expected = generation.current;
    setRefreshing(true);
    try {
      const updated = (await loadRequests(api)).map(requestView);
      if (generation.current !== expected || currentOwner.current !== owner) return;
      setRequests(updated);
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

  const handleRetry = request => {
    closeDetails();
    navigation.navigate('NewRequest', {
      prefill: {
        sourceNetwork: request.sourceNetwork,
        destNetwork: request.destNetwork,
        sourcePhone: request.sourcePhone,
        destPhone: request.destPhone,
        amount: request.amount,
      },
    });
  };

  if (selectedRequest && !ownerChanged) {
    return <AgentRequestDetails request={selectedRequest} onClose={closeDetails} onRetry={handleRetry} />;
  }

  return (
    <View style={s.screen}>
      <FlatList
        data={reading ? [] : filtered}
        keyExtractor={request => request.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.text]} tintColor={colors.text} />}
        ListHeaderComponent={(
          <View>
            <View style={s.filterBar}>
              <Text style={[s.caption, { color: colors.secondary }]}>{copy('Transactions', 'Miamala')}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${copy('Filter history', 'Chuja historia')}: ${filterLabel(filter)}`}
                accessibilityState={{ expanded: filterVisible }}
                onPress={() => setFilterVisible(true)}
                style={({ pressed }) => [s.filterButton, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={[s.filterText, { color: colors.text }]}>{filterLabel(filter)}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.text} />
              </Pressable>
            </View>
            {visibleError ? (
              <AgentNotice error>
                <Text accessibilityRole="alert" style={[s.notice, { color: colors.danger }]}>{visibleError} {copy('Existing results may be out of date.', 'Matokeo yaliyopo yanaweza kuwa ya zamani.')}</Text>
                <AgentButton label={copy('Retry loading requests', 'Jaribu kupakia tena')} onPress={onRefresh} disabled={refreshing} busy={refreshing} variant="text" icon="refresh-outline" />
              </AgentNotice>
            ) : null}
          </View>
        )}
        ListEmptyComponent={reading ? (
          <View style={s.empty} accessibilityLiveRegion="polite">
            <ActivityIndicator color={colors.text} />
            <Text style={[s.emptyText, { color: colors.secondary }]}>{copy('Loading history…', 'Inapakia historia…')}</Text>
          </View>
        ) : !visibleError ? (
          <View style={s.empty}>
            <Ionicons name={filter === 'all' ? 'receipt-outline' : 'filter-outline'} size={28} color={colors.secondary} />
            <Text style={[s.emptyTitle, { color: colors.text }]}>{filter === 'all' ? copy('No requests yet', 'Bado hakuna maombi') : copy('No matching requests', 'Hakuna maombi yanayolingana')}</Text>
            <Text style={[s.emptyText, { color: colors.secondary }]}>{filter === 'all' ? copy('Your exchanges will appear here.', 'Maombi yako ya kubadilisha float yataonekana hapa.') : copy('Choose another filter to see more.', 'Chagua kichujio kingine kuona zaidi.')}</Text>
            <AgentButton
              label={filter === 'all' ? copy('New request', 'Ombi jipya') : copy('Show all', 'Onyesha yote')}
              onPress={() => filter === 'all' ? navigation.navigate('NewRequest') : setFilter('all')}
              variant="text"
            />
          </View>
        ) : null}
        renderItem={({ item: request }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`TZS ${formatTzs(request.amount)}, ${networkDisplayName(request.sourceNetwork)} ${copy('to', 'kwenda')} ${networkDisplayName(request.destNetwork)}, ${requestStatusLabel(request.status)}`}
            accessibilityHint={copy('Open transaction details', 'Fungua maelezo ya muamala')}
            onPress={() => setSelectedRequest(request)}
            style={({ pressed }) => [s.transaction, { borderBottomColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
          >
            <View style={s.rowTop}>
              <Text style={[s.amount, { color: colors.text }]}>TZS {formatTzs(request.amount)}</Text>
              <Ionicons name="chevron-forward" size={17} color={colors.secondary} />
            </View>
            <Text style={[s.route, { color: colors.secondary }]}>{networkDisplayName(request.sourceNetwork)} → {networkDisplayName(request.destNetwork)}</Text>
            <View style={s.rowBottom}>
              <View style={s.status}>
                <Ionicons name={statusIcon(request)} size={17} color={colors.text} />
                <Text style={[s.statusText, { color: colors.text }]}>{requestStatusLabel(request.status)}</Text>
              </View>
              <Text style={[s.time, { color: colors.secondary }]}>{timeAgo(request.createdAt, lang)}</Text>
            </View>
            {request.urgent ? <Text style={[s.notice, { color: colors.secondary }]}>{copy('Marked urgent', 'Limewekwa kama la haraka')}</Text> : null}
            {needsReconciliation(request) ? <Text style={[s.notice, { color: colors.text }]}>{copy('Outcome unresolved. Do not send funds or start another payment.', 'Matokeo hayajathibitishwa. Usitume fedha au kuanzisha malipo mengine.')}</Text> : null}
            {request.reservation ? <Text style={[s.notice, { color: colors.secondary }]}>{reservationLabel(request.reservation)}</Text> : null}
          </Pressable>
        )}
      />
      <AgentSheet visible={filterVisible} onClose={() => setFilterVisible(false)} title={copy('Filter history', 'Chuja historia')}>
        {FILTER_KEYS.map(key => (
          <AgentRow
            key={key}
            label={filterLabel(key)}
            icon={filter === key ? 'checkmark' : undefined}
            onPress={() => { setFilter(key); setFilterVisible(false); }}
          />
        ))}
      </AgentSheet>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  filterBar: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  caption: { fontFamily: fonts.body, fontSize: 14, flexShrink: 1 },
  filterButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, paddingLeft: 12, maxWidth: '70%' },
  filterText: { fontFamily: fonts.bodyMed, fontSize: 14, flexShrink: 1 },
  transaction: { paddingVertical: 20, borderBottomWidth: StyleSheet.hairlineWidth, gap: 7 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  amount: { fontFamily: fonts.bodyMed, fontSize: 23, letterSpacing: -0.5, flex: 1, fontVariant: ['tabular-nums'] },
  route: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21 },
  rowBottom: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 12, rowGap: 8, marginTop: 3 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 },
  statusText: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20, flexShrink: 1 },
  time: { fontFamily: fonts.body, fontSize: 12, lineHeight: 20 },
  notice: { fontFamily: fonts.body, fontSize: 12, lineHeight: 19, marginTop: 2 },
  empty: { paddingVertical: 52, alignItems: 'center', gap: 14 },
  emptyTitle: { fontFamily: fonts.bodySemi, fontSize: 20, textAlign: 'center' },
  emptyText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, textAlign: 'center' },
});
