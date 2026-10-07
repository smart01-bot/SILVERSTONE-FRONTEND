import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { api } from '../../config/api';
import { requestStatusLabel, requestView } from '../../api/presentation';
import { exchangeAction, formatTzs } from '../../api/exchanges';
import { needsReconciliation, recordedTime, reservationLabel } from '../../api/operations';
import { legLabel, nextActionLabel, workflowError } from '../../api/workflowState';
import { providerChargeLabel, providerEvidenceLabel } from '../../api/providerEvidence';
import { fonts } from '../../constants/theme';
import { useLoader } from '../../context/LoaderContext';
import { timeAgo } from '../../utils/time';
import { AgentButton, AgentNotice, AgentScroll, useAgentUI } from './AgentUI';
import { maskedIdentifier, networkDisplayName, submittedTimeEat } from './agentPresentation';

// Sub-agent detail presentation only. The shared main-agent modal is unchanged.
export default function AgentRequestDetails({ request: initialRequest, onClose, onRetry }) {
  const { colors, lang, copy } = useAgentUI();
  const { showLoader, hideLoader } = useLoader();
  const [request, setRequest] = useState(initialRequest);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const inFlight = useRef(false);
  const requestRevision = useRef(0);

  useEffect(() => {
    requestRevision.current += 1;
    inFlight.current = false;
    setRequest(initialRequest);
    setError('');
    setExpanded(false);
    setLoading(false);
    return () => { requestRevision.current += 1; };
  }, [initialRequest]);

  const refresh = async () => {
    if (inFlight.current || !request) return;
    const revision = requestRevision.current;
    inFlight.current = true;
    setLoading(true);
    try {
      const updated = requestView(await api.call(`/requests/${request.id}`));
      if (requestRevision.current === revision) {
        setRequest(updated);
        setError('');
      }
    } catch (cause) {
      if (requestRevision.current === revision) setError(workflowError(cause));
    } finally {
      if (requestRevision.current === revision) {
        inFlight.current = false;
        setLoading(false);
      }
    }
  };

  const copyId = async () => {
    try {
      await Clipboard.setStringAsync(request.id);
      Alert.alert(copy('Copied', 'Imenakiliwa'), copy('Request ID copied to clipboard', 'Namba ya ombi imenakiliwa'));
    } catch (_) {
      Alert.alert(copy('Unable to copy', 'Imeshindikana kunakili'), copy('Please try again.', 'Tafadhali jaribu tena.'));
    }
  };

  const handleCancel = () => {
    if (inFlight.current || request.status !== 'awaiting_review') return;
    const revision = requestRevision.current;
    Alert.alert(
      copy('Cancel request', 'Futa ombi'),
      copy('Cancel this pending request?', 'Una uhakika unataka kufuta ombi hili linalosubiri?'),
      [
        { text: copy('Keep it', 'Liache'), style: 'cancel' },
        {
          text: copy('Cancel request', 'Futa ombi'),
          style: 'destructive',
          onPress: async () => {
            if (inFlight.current || requestRevision.current !== revision) return;
            inFlight.current = true;
            setLoading(true);
            showLoader();
            try {
              await exchangeAction(request, 'cancel');
              if (requestRevision.current === revision) onClose();
            } catch (cause) {
              if (requestRevision.current === revision) setError(workflowError(cause));
            } finally {
              if (requestRevision.current === revision) {
                inFlight.current = false;
                setLoading(false);
              }
              hideLoader();
            }
          },
        },
      ],
    );
  };

  if (!request) return null;

  const unresolved = needsReconciliation(request);
  const statusIcon = unresolved ? 'alert-circle-outline'
    : request.status === 'completed' ? 'checkmark-circle-outline'
      : ['rejected', 'cancelled', 'expired'].includes(request.status) ? 'close-circle-outline' : 'time-outline';

  const DetailRow = ({ label, value, onPress, icon }) => {
    const content = (
      <>
        <Text style={[s.detailLabel, { color: colors.secondary }]}>{label}</Text>
        <Text style={[s.detailValue, { color: colors.text }]} selectable={!onPress}>{value}</Text>
        {icon ? <Ionicons name={icon} size={17} color={colors.text} /> : null}
      </>
    );
    return onPress ? (
      <Pressable accessibilityRole="button" accessibilityLabel={copy('Copy request reference', 'Nakili namba ya ombi')} onPress={onPress} style={({ pressed }) => [s.detailRow, { opacity: pressed ? 0.6 : 1 }]}>{content}</Pressable>
    ) : <View style={s.detailRow}>{content}</View>;
  };

  return (
    <AgentScroll refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} colors={[colors.text]} tintColor={colors.text} />}>
      <View style={s.toolbar}>
        <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [s.back, { opacity: pressed ? 0.6 : 1 }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={[s.backText, { color: colors.text }]}>{copy('All transactions', 'Miamala yote')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy('Refresh request details', 'Sasisha maelezo ya ombi')}
          accessibilityState={{ disabled: loading, busy: loading }}
          disabled={loading}
          onPress={refresh}
          style={({ pressed }) => [s.refresh, { opacity: loading || pressed ? 0.45 : 1 }]}
        ><Ionicons name="refresh-outline" size={23} color={colors.text} /></Pressable>
      </View>

      <Text style={[s.amount, { color: colors.text }]}>TZS {formatTzs(request.amount)}</Text>
      <View style={s.status}>
        <Ionicons name={statusIcon} size={23} color={colors.text} />
        <Text style={[s.statusText, { color: colors.text }]}>{requestStatusLabel(request.status)}</Text>
      </View>
      {request.urgent ? <Text style={[s.caption, { color: colors.secondary }]}>{copy('Marked urgent', 'Limewekwa kama la haraka')}</Text> : null}
      <Text style={[s.description, { color: colors.secondary }]}>{nextActionLabel(request)}</Text>
      {unresolved && request.status !== 'needs_attention' && !request.legs?.some(leg => leg.status === 'unknown') ? (
        <AgentNotice>{copy('Outcome unresolved. Do not send funds or start another payment.', 'Matokeo hayajathibitishwa. Usitume fedha au kuanzisha malipo mengine.')}</AgentNotice>
      ) : null}
      <Text style={[s.providerNotice, { color: colors.secondary }]}>{copy('Provider unavailable. Do not send funds.', 'Mtoa huduma hayupo. Usitume fedha.')}</Text>
      {error ? <AgentNotice error>{error}</AgentNotice> : null}

      <View style={[s.details, { borderColor: colors.border }]}>
        <DetailRow label={copy('From', 'Kutoka')} value={`${networkDisplayName(request.sourceNetwork)}\n${maskedIdentifier(request.sourcePhone)}`} />
        <DetailRow label={copy('To', 'Kwenda')} value={`${networkDisplayName(request.destNetwork)}\n${maskedIdentifier(request.destPhone)}`} />
        <DetailRow label={copy('Submitted', 'Limetumwa')} value={submittedTimeEat(request.createdAt, lang)} />
        <DetailRow label={copy('Request ID', 'Namba ya ombi')} value={`#${request.id?.slice(-8).toUpperCase()}`} onPress={copyId} icon="copy-outline" />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(value => !value)}
        style={({ pressed }) => [s.disclosure, { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={[s.disclosureText, { color: colors.text }]}>{copy('More details', 'Maelezo zaidi')}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text} />
      </Pressable>

      {expanded ? (
        <View style={s.moreDetails}>
          <Text selectable style={[s.evidence, { color: colors.secondary }]}>{copy('Full reference', 'Namba kamili')}: {request.id}</Text>
          <Text selectable style={[s.evidence, { color: colors.secondary }]}>{copy('Source account', 'Akaunti ya chanzo')}: {networkDisplayName(request.sourceNetwork)} · {request.sourcePhone}</Text>
          <Text selectable style={[s.evidence, { color: colors.secondary }]}>{copy('Destination account', 'Akaunti ya kupokea')}: {networkDisplayName(request.destNetwork)} · {request.destPhone}</Text>
          <Text style={[s.evidence, { color: colors.secondary }]}>{copy('Submitted (UTC)', 'Limetumwa (UTC)')}: {recordedTime(request.createdAt)}</Text>
          {request.processedAt ? <Text style={[s.evidence, { color: colors.secondary }]}>{copy('Processed', 'Limeshughulikiwa')}: {timeAgo(request.processedAt, lang)}</Text> : null}
          <Text style={[s.evidence, { color: colors.secondary }]}>Silverstone fee: TZS 0 · {providerChargeLabel(request.provider)}</Text>
          {request.reservation ? <Text style={[s.evidence, { color: colors.secondary }]}>{reservationLabel(request.reservation)}</Text> : null}
          {request.providerEvidence?.map((evidence, index) => <Text key={evidence.id || `evidence-${index}`} style={[s.evidence, { color: colors.secondary }]}>{providerEvidenceLabel(evidence)}</Text>)}
          {request.legs?.map((leg, index) => <Text key={leg.id || `leg-${index}`} style={[s.evidence, { color: colors.secondary }]}>{legLabel(leg)}</Text>)}
          {request.history?.map((event, index) => <Text key={event.id || `event-${index}`} style={[s.evidence, { color: colors.secondary }]}>{recordedTime(event.createdAt)} · {event.event}: {event.reason}</Text>)}
        </View>
      ) : null}

      <View style={s.actions}>
        {request.status === 'awaiting_review' ? <AgentButton label={copy('Cancel request', 'Futa ombi')} onPress={handleCancel} disabled={loading} busy={loading} variant="text" icon="close-outline" /> : null}
        {request.status === 'rejected' ? <AgentButton label={copy('Prepare a new request', 'Andaa ombi jipya')} onPress={() => onRetry?.(request)} disabled={loading} /> : null}
        {request.status === 'completed' ? (
          <>
            <AgentButton label={copy('Download receipt', 'Pakua risiti')} disabled icon="download-outline" />
            <Text style={[s.receiptNote, { color: colors.secondary }]}>{copy('Receipt downloads will be available in a later update.', 'Upakuaji wa risiti utapatikana katika sasisho lijalo.')}</Text>
          </>
        ) : null}
      </View>
    </AgentScroll>
  );
}

const s = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: -8, marginBottom: 18 },
  back: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  backText: { fontFamily: fonts.body, fontSize: 14, flexShrink: 1 },
  refresh: { minHeight: 48, minWidth: 48, alignItems: 'flex-end', justifyContent: 'center' },
  amount: { fontFamily: fonts.bodyMed, fontSize: 31, letterSpacing: -0.9, fontVariant: ['tabular-nums'], marginBottom: 14 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusText: { fontFamily: fonts.bodyMed, fontSize: 16, lineHeight: 24, flex: 1 },
  description: { fontFamily: fonts.body, fontSize: 13, lineHeight: 21, marginTop: 12 },
  providerNotice: { fontFamily: fonts.body, fontSize: 12, lineHeight: 20, marginTop: 8, marginBottom: 18 },
  caption: { fontFamily: fonts.body, fontSize: 12, marginTop: 12 },
  details: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 8 },
  detailRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  detailLabel: { width: '32%', fontFamily: fonts.body, fontSize: 13, lineHeight: 20 },
  detailValue: { flex: 1, fontFamily: fonts.bodyMed, fontSize: 13, lineHeight: 21, textAlign: 'right', fontVariant: ['tabular-nums'] },
  disclosure: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  disclosureText: { fontFamily: fonts.body, fontSize: 14 },
  moreDetails: { paddingVertical: 20, gap: 14 },
  evidence: { fontFamily: fonts.body, fontSize: 12, lineHeight: 21 },
  actions: { marginTop: 16, gap: 10 },
  receiptNote: { fontFamily: fonts.body, fontSize: 12, lineHeight: 19, textAlign: 'center' },
});
