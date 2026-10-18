// src/screens/sub-agent/NewRequestScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Switch,
  StyleSheet, KeyboardAvoidingView, Keyboard, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { validateAmount } from '../../api/workflowState';
import { normalizePaymentEndpoint } from '../../api/paymentEndpoints';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLoader } from '../../context/LoaderContext';
import { fonts } from '../../constants/theme';
import NetworkLogo from '../../components/agent/NetworkLogo';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import {
  AgentScroll, AgentButton, AgentSheet, AgentNotice, useAgentUI,
} from '../../components/agent/AgentUI';

// A network and an explicitly typed identifier form each immutable payment endpoint.
const NETWORKS = ['Voda', 'Yas', 'Airtel', 'Halotel'];
const NETWORK_NAMES = {
  Voda: 'M-Pesa', Yas: 'Mixx by Yas', Airtel: 'Airtel Money', Halotel: 'HaloPesa',
};

export default function NewRequestScreen({ navigation, route }) {
  const { user, profile } = useAuth();
  const { showLoader, hideLoader } = useLoader();
  const { tr } = useTheme();
  const { colors, copy, headerHeight, isDark, reducedTransparency } = useAgentUI();
  const insets = useSafeAreaInsets();
  const { isOnline, syncing, syncedCount, enqueue, syncQueue, pendingCount, queueError } = useOfflineQueue(user?.id, profile?.name);

  const [loading,setLoading] = useState(false);
  const [submitted,setSubmitted] = useState(false);
  const busy = useRef(false);
  const codes={Voda:'vodacom',Airtel:'airtel',Yas:'yas',Halotel:'halotel'};
  const prefill = route?.params?.prefill;

  const [sourceNetwork, setSourceNetwork] = useState(prefill?.sourceNetwork ?? '');
  const [destNetwork,   setDestNetwork]   = useState(prefill?.destNetwork   ?? '');
  const [sourcePhone,   setSourcePhone]   = useState(prefill?.sourcePhone   ?? '');
  const [destPhone,     setDestPhone]     = useState(prefill?.destPhone     ?? '');
  const [amount,        setAmount]        = useState(prefill?.amount ? String(prefill.amount) : '');
  const [urgent,        setUrgent]        = useState(false);
  const [error,         setError]         = useState('');
  const [notice, setNotice] = useState('');
  const [sourceType, setSourceType] = useState(prefill?.sourceType ?? 'phone');
  const [destType, setDestType] = useState(prefill?.destType ?? 'phone');
  const [review, setReview] = useState(null);
  const [editor, setEditor] = useState(null);
  const [editorError, setEditorError] = useState('');
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  const scrollRef = useRef(null);
  const amountPosition = useRef(0);

  useEffect(()=>setSubmitted(false),[sourceNetwork,destNetwork,sourcePhone,destPhone,sourceType,destType,amount,urgent]);

  const formatAmount = (val) => {
    const digits = val.replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleAmountChange = (val) => setAmount(formatAmount(val));

  const validate = () => {
    if (!sourceNetwork) return tr('sourceNetwork') + ' ' + tr('error');
    if (!destNetwork)   return tr('destNetwork')   + ' ' + tr('error');
    if (!sourcePhone)   return tr('sourcePhone')   + ' ' + tr('error');
    if (!destPhone)     return tr('destPhone')     + ' ' + tr('error');
    if (!amount)        return tr('amount')        + ' ' + tr('error');
    return validateAmount(amount.replace(/,/g, ''));
  };

  const reviewRequest = () => {
    if (busy.current || submitted) return;
    Keyboard.dismiss();
    const problem = validate(); if (problem) { setError(problem); return; }
    try {
      const source = normalizePaymentEndpoint({ networkCode: codes[sourceNetwork], identifierType: sourceType, identifier: sourcePhone });
      const destination = normalizePaymentEndpoint({ networkCode: codes[destNetwork], identifierType: destType, identifier: destPhone });
      if (source.networkCode === destination.networkCode) throw new Error('Choose two different networks.');
      setError('');
      setEditor(null);
      setReview({ source, destination, amountTzs: String(BigInt(amount.replace(/,/g,''))), currency:'TZS', urgent });
    } catch (e) { setError(e.message); }
  };
  const handleSubmit = async () => {
    if(busy.current||submitted||!review)return;
    busy.current=true;setLoading(true);setError('');setNotice('');showLoader(copy('Submitting request…', 'Inatuma ombi…'));
    try {
      await enqueue(review);
      setReview(null);
      setSubmitted(true);
      setNotice('Request saved on this device. No funds moved.');
      if(isOnline){const result=await syncQueue();setNotice(result?.remaining===0?'Request submitted for review. No funds moved.':'Saved request retained. Retry below with the same key.');}
    }catch(e){setError(e.message);}
    finally{busy.current=false;setLoading(false);hideLoader();}
  };

  // A prepared replacement can arrive after the pager has mounted this screen.
  // Consume only explicit prefills; ordinary tab changes keep the current draft.
  useEffect(() => {
    if (!prefill || loading || busy.current) return;
    setSourceNetwork(prefill.sourceNetwork ?? '');
    setDestNetwork(prefill.destNetwork ?? '');
    setSourcePhone(prefill.sourcePhone ?? '');
    setDestPhone(prefill.destPhone ?? '');
    setSourceType(prefill.sourceType ?? 'phone');
    setDestType(prefill.destType ?? 'phone');
    setReview(null);
    setEditor(null);
    setEditorError('');
    setAmount(prefill.amount ? formatAmount(String(prefill.amount)) : '');
    setUrgent(false);
    setError('');
    setNotice('');
    setSubmitted(false);
    navigation.setParams({ prefill: undefined });
  }, [prefill, loading, navigation]);

  const typeLabel = type => type === 'agent' ? copy('Agent', 'Wakala') : type === 'till' ? copy('Till', 'Lipa namba') : copy('Wallet', 'Wallet');
  const endpointLabel = kind => kind === 'source' ? copy('Collect from', 'Kusanya kutoka') : copy('Pay out to', 'Tuma kwenda');
  const openEditor = kind => {
    if (busy.current) return;
    Keyboard.dismiss();
    setReview(null);
    setEditorError('');
    setEditor(kind === 'source'
      ? { kind, network: sourceNetwork, type: sourceType, identifier: sourcePhone }
      : { kind, network: destNetwork, type: destType, identifier: destPhone });
  };
  const closeSheet = () => {
    if (busy.current) return;
    Keyboard.dismiss();
    setEditor(null);
    setEditorError('');
    setReview(null);
  };
  const saveEndpoint = () => {
    if (!editor || busy.current) return;
    try {
      normalizePaymentEndpoint({ networkCode: codes[editor.network], identifierType: editor.type, identifier: editor.identifier });
      const other = editor.kind === 'source' ? destNetwork : sourceNetwork;
      if (editor.network === other) throw new Error(copy('Choose two different networks.', 'Chagua mitandao miwili tofauti.'));
      if (editor.kind === 'source') {
        setSourceNetwork(editor.network); setSourceType(editor.type); setSourcePhone(editor.identifier.trim());
      } else {
        setDestNetwork(editor.network); setDestType(editor.type); setDestPhone(editor.identifier.trim());
      }
      setError(''); setNotice(''); closeSheet();
    } catch (e) { setEditorError(e.message); }
  };
  const changeEditor = patch => { setEditor(value => ({ ...value, ...patch })); setEditorError(''); };
  const editAmount = () => {
    closeSheet();
    scrollRef.current?.scrollTo({ y: Math.max(0, amountPosition.current - 12), animated: false });
  };
  const accountRow = (kind, network, identifier, type) => (
    <TouchableOpacity testID={`request-account-${kind}`} onPress={() => openEditor(kind)} disabled={loading}
      accessibilityRole="button" accessibilityLabel={`${endpointLabel(kind)}: ${NETWORK_NAMES[network] || copy('Choose network', 'Chagua mtandao')}${identifier ? `, ${typeLabel(type)}, ${identifier}` : ''}`}
      activeOpacity={0.65} style={s.accountRow}>
      <NetworkLogo network={network} />
      <View style={s.fieldContent}>
        <Text style={[s.label, { color: colors.secondary }]}>{endpointLabel(kind)}</Text>
        <Text style={[s.accountName, { color: colors.text }]}>{NETWORK_NAMES[network] || copy('Choose network', 'Chagua mtandao')}</Text>
        <Text style={[s.identifier, { color: colors.secondary }]}>{identifier ? `${typeLabel(type)} · ${identifier}` : copy('Add account details', 'Weka taarifa za akaunti')}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.secondary} />
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView style={[s.screen, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + headerHeight : 0}>
      <AgentScroll ref={scrollRef} contentContainerStyle={s.content}>
        <Text style={[s.subtitle, { color: colors.secondary }]}>{copy('Set up your next transfer', 'Andaa uhamisho wako unaofuata')}</Text>
        {!isOnline ? <AgentNotice>{copy('Offline or checking connection. Save on this device; submission retries while this screen is open and connected.', 'Nje ya mtandao au muunganisho unakaguliwa. Hifadhi kwenye kifaa hiki; ombi litajaribiwa kutumwa tena ukurasa huu ukiwa wazi na mtandaoni.')}</AgentNotice> : null}
        {syncedCount > 0 ? <Text accessibilityLiveRegion="polite" style={[s.message, { color: colors.text }]}>{copy(`${syncedCount} request${syncedCount > 1 ? 's' : ''} synced`, `Maombi ${syncedCount} yametumwa`)}</Text> : null}

        <View testID="request-route-panel" style={[s.routePanel, { borderColor: colors.glassBorder, backgroundColor: reducedTransparency ? colors.surface : colors.glass }]}>
          {Platform.OS === 'ios' && !reducedTransparency ? <BlurView intensity={18} tint={isDark ? 'dark' : 'light'} pointerEvents="none" style={StyleSheet.absoluteFill} /> : null}
          {accountRow('source', sourceNetwork, sourcePhone, sourceType)}
          <View accessible={false} style={[s.routeDivider, { backgroundColor: colors.border }]}>
            <View style={[s.direction, { backgroundColor: colors.surface, borderColor: colors.glassBorder }]}>
              <Ionicons name="arrow-down" size={15} color={colors.secondary} />
            </View>
          </View>
          {accountRow('destination', destNetwork, destPhone, destType)}
        </View>

        <View onLayout={event => { amountPosition.current = event.nativeEvent.layout.y; }} style={[s.amountField, { borderBottomColor: colors.border }]}>
          <Text style={[s.label, { color: colors.secondary }]}>{copy('Amount', 'Kiasi')}</Text>
          <View style={s.amountRow}>
            <Text style={[s.currency, { color: colors.secondary }]}>TZS</Text>
            <TextInput testID="request-amount" value={amount} onChangeText={handleAmountChange} placeholder="0"
              placeholderTextColor={colors.muted} keyboardType="numeric" selectionColor={colors.text}
              style={[s.amountInput, { color: colors.text }]} accessibilityLabel={`${copy('Amount', 'Kiasi')}, TZS`}
              underlineColorAndroid="transparent" editable={!loading} />
          </View>
        </View>
        <TouchableOpacity testID="request-more-options" onPress={() => setOptionsExpanded(value => !value)} style={s.optionsToggle}
          activeOpacity={0.65} accessibilityRole="button" accessibilityState={{ expanded: optionsExpanded }}>
          <Text style={[s.optionsLabel, { color: colors.text }]}>{copy('More options', 'Chaguo zaidi')}</Text>
          <Ionicons name={optionsExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.secondary} />
        </TouchableOpacity>
        {!optionsExpanded && urgent ? <Text style={[s.urgentIndicator, { color: colors.secondary }]}>{copy('Urgent flag is on · Queue order unchanged', 'Alama ya dharura imewashwa · Mpangilio wa foleni haujabadilika')}</Text> : null}
        {optionsExpanded ? <View style={s.urgentRow}>
          <View style={s.urgentCopy}>
            <Text style={[s.optionsLabel, { color: colors.text }]}>{tr('markUrgent')}</Text>
            <Text style={[s.smallText, { color: colors.secondary }]}>{copy('Flag for review; queue remains first-in, first-out.', 'Weka alama kwa ukaguzi; ombi la kwanza huanza kushughulikiwa.')}</Text>
          </View>
          <Switch value={urgent} disabled={loading} onValueChange={setUrgent} accessibilityLabel={tr('markUrgent')}
            trackColor={{ false: colors.border, true: colors.text }} thumbColor={colors.bg} ios_backgroundColor={colors.border} />
        </View> : null}
        {pendingCount > 0 ? <TouchableOpacity onPress={syncQueue} accessibilityRole="button"
          accessibilityState={{ disabled: !isOnline || loading || syncing, busy: syncing }} style={s.retry} disabled={!isOnline || loading || syncing}>
          <Text style={[s.retryText, { color: colors.secondary }]}>{copy(`${pendingCount} saved request(s) — Retry submission`, `Maombi ${pendingCount} yaliyohifadhiwa — Jaribu kutuma tena`)}</Text>
        </TouchableOpacity> : null}
        {queueError ? <AgentNotice error>{queueError}</AgentNotice> : null}
        {notice ? <Text accessibilityLiveRegion="polite" style={[s.message, { color: colors.text }]}>{notice}</Text> : null}
      </AgentScroll>

      <View testID="request-footer" style={[s.footer, { backgroundColor: colors.bg }]}>
        {error ? <AgentNotice error style={s.footerError}>{error}</AgentNotice> : null}
        <View style={s.feeRow}>
          <Text style={[s.fee, { color: colors.secondary }]}>{copy('Swift Wakala fee', 'Ada ya Swift Wakala')}</Text>
          <Text style={[s.feeValue, { color: colors.text }]}>TZS 0</Text>
        </View>
        <Text style={[s.executionNotice, { color: colors.secondary }]}>{copy('Requests are saved for approval. Payments are not yet connected.', 'Maombi yanahifadhiwa kwa idhini. Malipo bado hayajaunganishwa.')}</Text>
        <AgentButton testID="request-review" onPress={reviewRequest} disabled={loading || submitted} busy={loading} style={s.reviewButton}
          label={loading ? copy('Saving…', 'Inahifadhi…') : submitted ? copy('Request saved', 'Ombi limehifadhiwa') : copy('Review request', 'Kagua ombi')} />
      </View>

      <AgentSheet visible={!!editor || !!review} onClose={closeSheet}
        title={editor ? endpointLabel(editor.kind) : copy('Review request', 'Kagua ombi')}>
        {editor ? <View>
          <Text style={[s.editorHint, { color: colors.secondary }]}>{editor.kind === 'source'
            ? copy('This account approves your transfer payment.', 'Akaunti hii itaidhinisha malipo ya uhamisho wako.')
            : copy('This account receives the payout from your agency.', 'Akaunti hii itapokea fedha kutoka kwa wakala wako.')}</Text>
          <View style={s.networkGrid}>
            {NETWORKS.map(network => <TouchableOpacity key={network} testID={`request-network-${network}`}
              onPress={() => { if (editor.network !== network) changeEditor({ network, identifier: '' }); }}
              accessibilityRole="radio" accessibilityState={{ selected: editor.network === network }} accessibilityLabel={NETWORK_NAMES[network]}
              style={[s.networkChoice, { borderColor: editor.network === network ? colors.strongBorder : colors.border, backgroundColor: editor.network === network ? colors.selected : 'transparent' }]}>
              <NetworkLogo network={network} size={36} />
              <Text style={[s.networkName, { color: colors.text }]}>{NETWORK_NAMES[network]}</Text>
              {editor.network === network ? <Ionicons name="checkmark" size={15} color={colors.text} /> : null}
            </TouchableOpacity>)}
          </View>
          <View style={[s.typeRow, { backgroundColor: colors.selected }]}>
            {['phone', 'agent', 'till'].map(type => <TouchableOpacity key={type} testID={`request-type-${type}`}
              onPress={() => { if (editor.type !== type) changeEditor({ type, identifier: '' }); }}
              style={[s.typeChoice, { backgroundColor: editor.type === type ? colors.surface : 'transparent' }]}
              accessibilityRole="radio" accessibilityState={{ selected: editor.type === type }} accessibilityLabel={typeLabel(type)}>
              <Text style={[s.typeText, { color: colors.text }]}>{typeLabel(type)}</Text>
            </TouchableOpacity>)}
          </View>
          <Text style={[s.label, { color: colors.secondary }]}>{editor.type === 'phone' ? copy('Mobile number', 'Namba ya simu') : editor.type === 'agent' ? copy('Agent number', 'Namba ya wakala') : copy('Till number', 'Lipa namba')}</Text>
          <TextInput testID="request-account-number" value={editor.identifier} onChangeText={identifier => changeEditor({ identifier })}
            maxLength={editor.type === 'phone' ? 24 : 32} keyboardType={editor.type === 'phone' ? 'phone-pad' : 'default'} autoCapitalize="none" autoCorrect={false}
            placeholder={editor.type === 'phone' ? '07XX XXX XXX' : copy('Enter number', 'Weka namba')}
            placeholderTextColor={colors.muted} selectionColor={colors.text} accessibilityLabel={`${endpointLabel(editor.kind)}: ${editor.type} number`}
            style={[s.numberInput, { color: colors.text, borderColor: editorError ? colors.danger : colors.border }]}
            onSubmitEditing={saveEndpoint} />
          <Text style={[s.editorHint, { color: colors.secondary }]}>{copy('Changing network or account type clears this number.', 'Kubadili mtandao au aina ya akaunti hufuta namba hii.')}</Text>
          {editorError ? <AgentNotice error>{editorError}</AgentNotice> : null}
          <AgentButton testID="request-save-account" label={copy('Use this account', 'Tumia akaunti hii')} onPress={saveEndpoint} />
        </View> : review ? <View style={s.reviewContent}>
          <View style={s.reviewHeading}>
            <View style={s.fieldContent}>
              <Text style={[s.label, { color: colors.secondary }]}>{copy('Amount', 'Kiasi')}</Text>
              <Text testID="request-review-amount" style={[s.reviewAmount, { color: colors.text }]}>TZS {formatAmount(review.amountTzs)}</Text>
            </View>
            <TouchableOpacity testID="request-edit-amount" accessibilityRole="button" accessibilityLabel={copy('Edit amount', 'Badili kiasi')} onPress={editAmount} style={s.editButton}>
              <Ionicons name="create-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          {[[copy('From · approves collection', 'Kutoka · itaidhinisha malipo'), review.source, 'source'],
            [copy('To · receives payout', 'Kwenda · itapokea fedha'), review.destination, 'destination']].map(([label, endpoint, kind]) => {
              const network = Object.keys(codes).find(key => codes[key] === endpoint.networkCode);
              return <View key={kind} style={[s.reviewEndpoint, { borderColor: colors.border }]}>
                <NetworkLogo network={network} size={40} />
                <View style={s.fieldContent}>
                  <Text style={[s.label, { color: colors.secondary }]}>{label}</Text>
                  <Text style={[s.accountName, { color: colors.text }]}>{NETWORK_NAMES[network]}</Text>
                  <Text testID={`request-review-${kind}`} selectable style={[s.reviewNumber, { color: colors.text }]}>{endpoint.identifier}</Text>
                  <Text style={[s.label, { color: colors.secondary }]}>{typeLabel(endpoint.identifierType)}</Text>
                </View>
                <TouchableOpacity testID={`request-edit-${kind}`} accessibilityRole="button" accessibilityLabel={copy(`Edit ${kind} account`, kind === 'source' ? 'Badili akaunti ya kutoa' : 'Badili akaunti ya kupokea')}
                  disabled={loading} onPress={() => openEditor(kind)} style={s.editButton}><Ionicons name="create-outline" size={21} color={colors.text} /></TouchableOpacity>
              </View>;
            })}
          <View style={s.feeRow}><Text style={[s.fee, { color: colors.secondary }]}>{copy('Swift Wakala fee', 'Ada ya Swift Wakala')}</Text><Text style={[s.feeValue, { color: colors.text }]}>TZS 0</Text></View>
          {review.urgent ? <Text style={[s.editorHint, { color: colors.secondary }]}>{copy('Flagged urgent · Queue order unchanged', 'Dharura · Mpangilio wa foleni haujabadilika')}</Text> : null}
          <Text style={[s.reviewNotice, { color: colors.secondary }]}>{copy('Submit for main-agent approval. No funds move at this step.', 'Tuma kwa idhini ya wakala mkuu. Hakuna fedha zitakazohamishwa katika hatua hii.')}</Text>
          {error ? <AgentNotice error>{error}</AgentNotice> : null}
          <AgentButton testID="request-confirm" onPress={handleSubmit} disabled={loading || submitted} busy={loading}
            label={isOnline ? copy('Confirm request', 'Thibitisha ombi') : copy('Save on this device', 'Hifadhi kwenye kifaa hiki')} />
        </View> : null}
      </AgentSheet>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 }, content: { paddingTop: 0, paddingBottom: 12 },
  subtitle: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, marginBottom: 14 },
  routePanel: { borderRadius: 25, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  accountRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, minHeight: 87 },
  fieldContent: { flex: 1, minWidth: 0, paddingRight: 6 },
  label: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  accountName: { fontFamily: fonts.bodySemi, fontSize: 18, lineHeight: 25, marginTop: 2 },
  identifier: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, marginTop: 2 },
  routeDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  direction: { position: 'absolute', left: 12, top: -12, width: 24, height: 24, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  amountField: { marginTop: 20, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  currency: { fontFamily: fonts.bodyMed, fontSize: 19 },
  amountInput: { flex: 1, minWidth: 0, minHeight: 64, paddingVertical: 2, fontFamily: fonts.heading, fontSize: 45, fontVariant: ['tabular-nums'], letterSpacing: -1 },
  optionsToggle: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  optionsLabel: { fontFamily: fonts.bodyMed, fontSize: 15, lineHeight: 22 },
  urgentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }, urgentCopy: { flex: 1, paddingRight: 14 },
  smallText: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, marginTop: 3 },
  urgentIndicator: { fontFamily: fonts.bodyMed, fontSize: 12, lineHeight: 18, marginBottom: 6 },
  retry: { minHeight: 48, justifyContent: 'center', marginBottom: 8 }, retryText: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 21 },
  message: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, marginBottom: 10 },
  footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 }, footerError: { paddingVertical: 4 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  fee: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19 }, feeValue: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 19 },
  executionNotice: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, marginTop: 4, marginBottom: 10 },
  reviewButton: { borderRadius: 24 },
  editorHint: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, marginBottom: 14 },
  networkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  networkChoice: { width: '48%', flexGrow: 1, minHeight: 76, borderWidth: 1, borderRadius: 16, padding: 10, flexDirection: 'row', alignItems: 'center' },
  networkName: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 18 },
  typeRow: { flexDirection: 'row', padding: 4, borderRadius: 16, marginBottom: 18 },
  typeChoice: { flex: 1, minHeight: 44, paddingHorizontal: 8, paddingVertical: 10, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  typeText: { fontFamily: fonts.bodyMed, fontSize: 14, lineHeight: 20 },
  numberInput: { minWidth: 0, width: '100%', minHeight: 56, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 14, fontFamily: fonts.bodySemi, fontSize: 23, marginTop: 6, marginBottom: 10 },
  reviewContent: { paddingBottom: 4 }, reviewHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reviewAmount: { fontFamily: fonts.heading, fontSize: 31, lineHeight: 41 },
  reviewEndpoint: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 12 },
  reviewNumber: { fontFamily: fonts.bodySemi, fontSize: 17, lineHeight: 24, marginVertical: 3 },
  editButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  reviewNotice: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, marginVertical: 14 },
});
