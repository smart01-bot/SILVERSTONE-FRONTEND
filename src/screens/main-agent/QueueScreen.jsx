import { BrandRefreshControl, RefreshIndicator, LoadingIndicator } from '../../components/Loader';
import { useMainCollection } from '../../hooks/useMainCollection';
import { MainHeader, MainEmpty } from '../../components/agent/MainAgentUI';
import { SafeAreaView } from 'react-native-safe-area-context';
import OperationsPanel from '../../components/OperationsPanel';
import { needsReconciliation, requestAge, reservationLabel } from '../../api/operations';
import { loadRequests, workflowError } from '../../api/workflowState';
import RequestDetailModal from '../../components/RequestDetailModal';
import { exchangeAction, formatTzs } from '../../api/exchanges';
import { requestView } from '../../api/presentation';
import { api } from '../../config/api';
// src/screens/main-agent/QueueScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLoader }      from '../../context/LoaderContext';
import { spacing, radius, fonts } from '../../constants/theme';
const EmptyState=({subtitle,...props})=><MainEmpty {...props} description={subtitle}/>;
import PressableScale from '../../components/PressableScale';
import {
  collection, query, orderBy,
  onSnapshot, doc, updateDoc, Timestamp,
} from '../../api/screenData';
import { db } from '../../api/screenData';

const REJECTION_REASONS = [
  'Insufficient float',
  'Invalid phone number',
  'Duplicate request',
  'Other',
];

export default function QueueScreen({ navigation }) {
  const { theme, isDark, tr, lang } = useTheme();
  const { showLoader, hideLoader } = useLoader();

  const {rows:assignedAgents}=useMainCollection('agents');
  const agentNames=Object.fromEntries(assignedAgents.map(a=>[a.id,a.name]));
  const [operationsVisible,setOperationsVisible]=useState(false);
  const requestCollection=useMainCollection('requests','asc');
  const {rows:requests,error:loadError,refreshing,loading}=requestCollection;
  const [selectedRequest,setSelectedRequest]=useState(null);
  const [filter,     setFilter]     = useState('All');


  const FILTERS = ['All', 'Unresolved', 'Urgent', 'Pending', 'Approved'];
  const FILTER_LABELS = {
    All:      lang==='sw'?'Yote':'All',
    Urgent:   tr('markUrgent'),
    Pending:  tr('statusPending'),
    Approved: lang==='sw'?'Inashughulikiwa':'Processing',
    Unresolved:lang==='sw'?'Yanahitaji uhakiki':'Needs attention',
  };

  const filtered = requests.filter(r => {
    if (filter === 'Unresolved') return needsReconciliation(r);
    if (filter === 'All') return needsReconciliation(r) || ['awaiting_review','awaiting_source','source_confirmed','payout_pending'].includes(r.status);
    if (filter === 'Urgent')   return r.status === 'awaiting_review' && r.urgent;
    if (filter === 'Pending')  return r.status === 'awaiting_review';
    if (filter === 'Approved') return ['awaiting_source','source_confirmed','payout_pending'].includes(r.status);
    return true;
  }).map(r=>({...r,agentName:r.agentName||agentNames[r.agentId||r.subAgentId]}));

  const pendingCount  = requests.filter(r => r.status === 'awaiting_review').length;
  const urgentCount   = requests.filter(r => r.status === 'awaiting_review' && r.urgent).length;
  const approvedCount = requests.filter(r => ['awaiting_source','source_confirmed','payout_pending'].includes(r.status)).length;

  // Age is descriptive; escalation deadlines and severity thresholds are not approved.

  const handleApprove = async (req) => {
    showLoader(lang === 'sw' ? 'Inasasisha ombi…' : 'Updating request…');
    try {
      await exchangeAction(req,'accept');await requestCollection.refresh();
    } catch (e) { Alert.alert('Error', workflowError(e)); }
    finally { hideLoader(); }
  };

  const handleReject = (req) => {
    Alert.alert('Reject Request', 'Select a reason:', [
      ...REJECTION_REASONS.map(reason => ({
        text: reason,
        onPress: async () => {
          showLoader(lang === 'sw' ? 'Inasasisha ombi…' : 'Updating request…');
          try {
            await exchangeAction(req,'reject',reason);await requestCollection.refresh();
          } catch (e) { Alert.alert('Error', workflowError(e)); }
          finally { hideLoader(); }
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const onRefresh=requestCollection.refresh;

  const emptyMessages = {
    Unresolved: { title: 'No unresolved outcomes in loaded requests', subtitle: 'This does not verify settlement or provider readiness.' },
    All:      { title: tr('queueClear'),                                subtitle: tr('queueEmptyDesc') },
    Urgent:   { title: `${tr('statusPending')} — ${tr('markUrgent')}`,  subtitle: tr('noPendingDesc') },
    Pending:  { title: tr('statusPending'),                             subtitle: tr('noPendingDesc') },
    Approved: { title: tr('statusApproved'),                            subtitle: tr('queueEmptyDesc') },
  };

  return (
    <SafeAreaView edges={['top','left','right']} style={[s.safe, { backgroundColor: theme.bg }]}>

      {/* ── Gradient header ── */}
      <MainHeader navigation={navigation} title={lang==='sw'?'Foleni':'Queue'} subtitle={loading?(lang==='sw'?'Inapakia maombi…':'Loading requests…'):`${pendingCount} ${lang==='sw'?'yanasubiri ukaguzi':'awaiting review'}`} action={()=>setOperationsVisible(true)} actionLabel={lang==='sw'?'Fungua udhibiti wa shughuli':'Open operational controls'} />

      <OperationsPanel visible={operationsVisible} onClose={()=>setOperationsVisible(false)} />
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
                <Text style={[s.pillText, { color: filter === f ? theme.onPrimary : theme.textDim }]}>
                  {FILTER_LABELS[f] ?? f}
                  {f === 'Urgent'  && urgentCount  > 0 ? ` ${urgentCount}`  : ''}
                  {f === 'Pending' && pendingCount  > 0 ? ` ${pendingCount}` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<BrandRefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.text]} tintColor={theme.text} />}
      >
        <RefreshIndicator refreshing={refreshing} color={theme.text} />
        {loadError ? <View accessibilityLiveRegion="polite" style={{padding: 12}}>
          <Text style={{color: theme.text}}>{loadError} Existing results may be out of date.</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityState={{disabled: refreshing, busy: refreshing}} disabled={refreshing} onPress={onRefresh} style={{minHeight:48, justifyContent:'center'}}><Text style={{color:theme.primary}}>Retry loading requests</Text></TouchableOpacity>
        </View> : null}
        {loading ? (
          <LoadingIndicator label={lang === 'sw' ? 'Inapakia maombi…' : 'Loading requests…'} />
        ) : filtered.length === 0 && !loadError ? (
          <EmptyState
            icon="checkmark-circle-outline"
            title={emptyMessages[filter].title}
            subtitle={emptyMessages[filter].subtitle}
          />
        ) : (
          filtered.map(req => {
            return (
              <PressableScale
                onPress={()=>setSelectedRequest(req)}
                key={req.id}
                scaleDown={0.98}
                style={[s.card, {
                  backgroundColor: theme.surfaceAlt,
                  borderColor:     theme.border,
                  borderLeftColor: needsReconciliation(req)?theme.danger:req.urgent?theme.warning:theme.border,
                }]}
              >
                <View style={s.cardTop}>
                  <View style={s.agentRow}>
                    <View style={[s.avatar, { backgroundColor: theme.primaryLight }]}>
                      <Text style={[s.avatarText, { color: theme.primary }]}>
                        {req.agentName?.charAt(0)?.toUpperCase() ?? 'A'}
                      </Text>
                    </View>
                    <View>
                      <Text style={[s.agentName, { color: theme.text }]}>{req.agentName ?? 'Agent'}</Text>
                      <Text style={[s.agentSub,  { color: theme.textDim }]}>{requestAge(req.createdAt)}</Text>
                    </View>
                  </View>
                  <View style={s.cardTopRight}>
                    {req.urgent && (
                      <View style={s.urgentTag}>
                        <Text style={[s.urgentText,{color:theme.warning}]}>{lang==='sw'?'Haraka':'Urgent'}</Text>
                      </View>
                    )}
                    <View style={[s.waitBadge, { backgroundColor: theme.surfaceAlt }]}>
                      <Text style={[s.waitText, { color: theme.textDim }]}>{needsReconciliation(req) ? (lang==='sw'?'Uhakiki':'Needs attention') : (lang==='sw'?'Wazi':'Open')}</Text>
                    </View>
                  </View>
                </View>

                <View style={s.routeRow}>
                  <Text style={[s.route,  { color: theme.text }]}>{req.sourceNetwork}</Text>
                  <Ionicons name="arrow-forward" size={16} color={theme.textDim} />
                  <Text style={[s.route,  { color: theme.text }]}>{req.destNetwork}</Text>
                  <Text style={[s.amount, { color: theme.primary }]}>TZS {formatTzs(req.amount)}</Text>
                </View>

                <View style={s.phonesRow}>
                  <Text style={[s.phone, { color: theme.textDim }]}>From: {req.sourcePhone}</Text>
                  <Text style={[s.phone, { color: theme.textDim }]}>To: {req.destPhone}</Text>
                </View>

                <Text style={{color:theme.textDim,fontFamily:fonts.body,fontSize:13,lineHeight:20}}>{req.nextAction}</Text>
                {req.reservation && <Text style={{color:theme.textDim,fontFamily:fonts.body,fontSize:12,lineHeight:19}}>{reservationLabel(req.reservation)}</Text>}

                <View style={s.actions}>
                  {req.status === 'awaiting_review' && (
                    <TouchableOpacity onPress={() => handleApprove(req)} style={[s.btnOutline, { borderColor: theme.primary,backgroundColor:theme.primary }]} activeOpacity={0.75}>
                      {<Text style={[s.btnOutlineText, { color: theme.onPrimary }]}>Accept and reserve</Text>
                      }
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleReject(req)} disabled={!['awaiting_review','awaiting_source'].includes(req.status)} style={[s.btnOutline, { borderColor: theme.border }]} activeOpacity={0.75}>
                    {<Text style={[s.btnOutlineText, { color: theme.textDim }]}>Reject</Text>
                    }
                  </TouchableOpacity>
                </View>
              </PressableScale>
            );
          })
        )}
      </ScrollView>
      <RequestDetailModal request={selectedRequest} visible={!!selectedRequest} role="main-agent" onClose={()=>{setSelectedRequest(null);onRefresh();}} />
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
  headerRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 30, fontFamily: fonts.display, color: '#fff' },
  headerSub:   { fontSize: 17, fontFamily: fonts.body, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  iconBtn: {
    width: 42, height: 42, borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  filters:   { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md },
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md - 2, paddingVertical: 12,minHeight:48,justifyContent:'center',
    borderRadius: radius.full, borderWidth: 1,
  },
  pillText: { fontSize: 14, fontFamily: fonts.bodySemi },

  card: {
    borderRadius:20,borderWidth:1,borderLeftWidth:2,
    padding: spacing.md, marginBottom: spacing.md - 4, gap: spacing.md - 4,
  },
  cardTop:      { flexDirection: 'row',flexWrap:'wrap',gap:12, justifyContent: 'space-between', alignItems: 'center' },
  agentRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:   { fontSize: 17, fontFamily: fonts.bodySemi },
  agentName:    { fontSize: 17, fontFamily: fonts.bodySemi },
  agentSub:     { fontSize: 12,lineHeight:19,fontFamily:fonts.body,marginTop:3 },
  cardTopRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm - 2 },
  urgentTag: {
    backgroundColor: '#F59E0B20', paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 1, borderRadius: radius.sm - 2,
  },
  urgentText: { color: '#F59E0B', fontSize: 13, fontFamily: fonts.bodyBold, letterSpacing: 0.6 },
  waitBadge:  { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs - 1, borderRadius: radius.sm - 2 },
  waitText:   { fontSize: 15, fontFamily: fonts.bodyBold },

  routeRow:  { flexDirection: 'row',flexWrap:'wrap',alignItems:'center',gap: spacing.sm },
  route:     { fontSize: 17, fontFamily: fonts.bodySemi },
  amount:    { fontSize: 22, fontFamily: fonts.bodyXBold, marginLeft: 'auto' },
  phonesRow: { gap:6 },
  phone:     { fontSize: 13,lineHeight:20, fontFamily: fonts.body },

  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  btnOutline: {
    flex: 1, minHeight:48,paddingVertical:12,paddingHorizontal:8,borderRadius: radius.md, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  btnOutlineText: { fontSize: 14, fontFamily: fonts.bodySemi },
  btnFilled: {
    flex: 1, minHeight:48,paddingVertical:12,paddingHorizontal:8,borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  btnFilledText: { color: '#fff', fontSize: 17, fontFamily: fonts.bodyBold },
});
