// src/screens/sub-agent/NewRequestScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Switch,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { validateAmount } from '../../api/workflowState';
import { normalizePaymentEndpoint } from '../../api/paymentEndpoints';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLoader } from '../../context/LoaderContext';
import { fonts } from '../../constants/theme';
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
  const { colors, copy, headerHeight } = useAgentUI();
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
  const [sourceType, setSourceType] = useState('phone');
  const [destType, setDestType] = useState('phone');
  const [review, setReview] = useState(null);

  useEffect(()=>setSubmitted(false),[sourceNetwork,destNetwork,sourcePhone,destPhone,sourceType,destType,amount,urgent]);

  const formatAmount = (val) => {
    const digits = val.replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleAmountChange = (val) => setAmount(formatAmount(val));

  const addQuick = (n) => {
    const current = BigInt(amount.replace(/,/g, '') || '0');
    setAmount(formatAmount(String(current + BigInt(n))));
  };

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
    const problem = validate(); if (problem) { setError(problem); return; }
    try {
      const source = normalizePaymentEndpoint({ networkCode: codes[sourceNetwork], identifierType: sourceType, identifier: sourcePhone });
      const destination = normalizePaymentEndpoint({ networkCode: codes[destNetwork], identifierType: destType, identifier: destPhone });
      if (source.networkCode === destination.networkCode) throw new Error('Choose two different networks.');
      setError('');
      setReview({ source, destination, amountTzs: String(BigInt(amount.replace(/,/g,''))), currency:'TZS', urgent });
    } catch (e) { setError(e.message); }
  };
  const handleSubmit = async () => {
    if(busy.current||submitted||!review)return;
    busy.current=true;setLoading(true);setError('');setNotice('');showLoader();
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
    setAmount(prefill.amount ? formatAmount(String(prefill.amount)) : '');
    setUrgent(false);
    setError('');
    setNotice('');
    setSubmitted(false);
    navigation.setParams({ prefill: undefined });
  }, [prefill, loading, navigation]);

  const [picker, setPicker] = useState(null);
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  const pickerSelection = picker === 'source' ? sourceNetwork : destNetwork;

  const accountField = (kind, label, network, identifier) => {
    const type = kind === 'source' ? sourceType : destType;
    const setType = kind === 'source' ? setSourceType : setDestType;
    const setNumber = kind === 'source' ? setSourcePhone : setDestPhone;
    return (
      <View style={[s.endpoint, { borderBottomColor: colors.secondary }]}>
        <TouchableOpacity onPress={() => setPicker(kind)} style={s.accountField} accessibilityRole="button"
          accessibilityLabel={`${label}: ${NETWORK_NAMES[network] || copy('Choose network','Chagua mtandao')}`}>
          <View style={s.fieldContent}>
            <Text style={[s.label, { color: colors.secondary }]}>{label}</Text>
            <Text style={[s.accountName, { color: colors.text }]}>{NETWORK_NAMES[network] || copy('Choose network','Chagua mtandao')}</Text>
          </View>
          <Ionicons name="chevron-down" size={19} color={colors.text} />
        </TouchableOpacity>
        <View style={s.typeRow}>
          {[['phone',copy('Wallet','Wallet')],['agent',copy('Agent','Wakala')],['till',copy('Till','Lipa namba')]].map(([value,title]) => (
            <TouchableOpacity key={value} onPress={() => setType(value)} style={s.typeChoice} accessibilityRole="radio"
              accessibilityState={{selected:type===value}} accessibilityLabel={`${label}: ${title}`}>
              <Text style={[s.typeText,{color:type===value?colors.text:colors.secondary,textDecorationLine:type===value?'underline':'none'}]}>{title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput value={identifier} onChangeText={setNumber} maxLength={type==='phone'?24:32}
          keyboardType={type==='phone'?'phone-pad':'default'} autoCapitalize="none" autoCorrect={false}
          placeholder={type==='phone'?'07XX XXX XXX':copy('Enter agent / till number','Weka namba ya wakala / lipa')}
          placeholderTextColor={colors.secondary} selectionColor={colors.text}
          style={[s.numberInput,{color:colors.text}]} accessibilityLabel={`${label}: ${type} number`} />
        <Text style={[s.endpointHint,{color:colors.secondary}]}>{kind==='source'
          ? copy('Approves the payment to Silverstone','Itaidhinisha malipo kwenda Silverstone')
          : copy('Receives the payout from your agency','Itapokea fedha kutoka kwa wakala wako')}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[s.screen, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + headerHeight : 0}
    >
      <AgentScroll keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
        {!isOnline && (
          <AgentNotice>
            {copy(
              'Offline or checking connection. Save on this device; submission retries while this screen is open and connected.',
              'Nje ya mtandao au muunganisho unakaguliwa. Hifadhi kwenye kifaa hiki; ombi litajaribiwa kutumwa tena ukurasa huu ukiwa wazi na mtandaoni.',
            )}
          </AgentNotice>
        )}
        {syncedCount > 0 && (
          <Text accessibilityLiveRegion="polite" style={[s.message, { color: colors.text }]}>
            {copy(`${syncedCount} request${syncedCount > 1 ? 's' : ''} synced`, `Maombi ${syncedCount} yametumwa`)}
          </Text>
        )}

        {accountField('source', copy('From', 'Kutoka'), sourceNetwork, sourcePhone)}
        {accountField('destination', copy('To', 'Kwenda'), destNetwork, destPhone)}

        <View style={[s.amountField, { borderBottomColor: colors.border }]}>
          <Text style={[s.label, { color: colors.secondary }]}>{tr('amount')}</Text>
          <View style={s.amountRow}>
            <Text style={[s.currency, { color: colors.text }]}>TZS</Text>
            <TextInput
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              selectionColor={colors.text}
              style={[s.amountInput, { color: colors.text }]}
              accessibilityLabel={`${tr('amount')}, TZS`}
              underlineColorAndroid="transparent"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setOptionsExpanded(value => !value)}
          style={s.optionsToggle}
          activeOpacity={0.65}
          accessibilityRole="button"
          accessibilityState={{ expanded: optionsExpanded }}
        >
          <Text style={[s.optionsLabel, { color: colors.text }]}>{copy('More options', 'Chaguo zaidi')}</Text>
          <Ionicons name={optionsExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text} />
        </TouchableOpacity>
        {!optionsExpanded && urgent && (
          <Text style={[s.urgentIndicator, { color: colors.text }]}>
            {copy('Urgent flag is on · Queue order unchanged', 'Alama ya dharura imewashwa · Mpangilio wa foleni haujabadilika')}
          </Text>
        )}
        {optionsExpanded && (
          <View style={s.optionsContent}>
            <Text style={[s.label, { color: colors.secondary }]}>{copy('Add to amount', 'Ongeza kiasi')}</Text>
            <View style={s.quickRow}>
              {[10000, 50000, 100000, 500000].map(n => (
                <TouchableOpacity
                  key={n}
                  onPress={() => addQuick(n)}
                  style={[s.quickButton, { borderColor: colors.border }]}
                  activeOpacity={0.65}
                  accessibilityRole="button"
                  accessibilityLabel={copy(`Add ${n.toLocaleString('en-US')} Tanzanian shillings`, `Ongeza shilingi za Tanzania ${n.toLocaleString('en-US')}`)}
                >
                  <Text style={[s.quickText, { color: colors.text }]}>+{n / 1000}k</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.urgentRow}>
              <View style={s.urgentCopy}>
                <Text style={[s.optionsLabel, { color: colors.text }]}>{tr('markUrgent')}</Text>
                <Text style={[s.smallText, { color: colors.secondary }]}>
                  {copy('Flag for review; queue remains first-in, first-out.', 'Weka alama kwa ukaguzi; ombi la kwanza huanza kushughulikiwa.')}
                </Text>
              </View>
              <Switch
                value={urgent}
                onValueChange={() => setUrgent(value => !value)}
                accessibilityLabel={tr('markUrgent')}
                trackColor={{ false: colors.border, true: colors.text }}
                thumbColor={colors.bg}
                ios_backgroundColor={colors.border}
              />
            </View>
          </View>
        )}

        <Text style={[s.fee, { color: colors.secondary }]}>
          {copy('Silverstone fee: TZS 0', 'Ada ya Silverstone: TZS 0')}
        </Text>
        <Text style={[s.executionNotice, { color: colors.secondary }]}>
          {copy('Payment connection pending. Requests can be saved for review.', 'Muunganisho wa malipo unasubiriwa. Maombi yanaweza kuhifadhiwa kwa ukaguzi.')}
        </Text>

        {pendingCount > 0 && (
          <TouchableOpacity
            onPress={syncQueue}
            accessibilityRole="button"
            accessibilityState={{ disabled: !isOnline || loading || syncing, busy: syncing }}
            style={s.retry}
            disabled={!isOnline || loading || syncing}
          >
            <Text style={[s.retryText, { color: !isOnline || loading || syncing ? colors.secondary : colors.text }]}>
              {copy(`${pendingCount} saved request(s) — Retry submission`, `Maombi ${pendingCount} yaliyohifadhiwa — Jaribu kutuma tena`)}
            </Text>
          </TouchableOpacity>
        )}
        {queueError ? <AgentNotice error>{queueError}</AgentNotice> : null}
        {notice ? <Text accessibilityLiveRegion="polite" style={[s.message, { color: colors.text }]}>{notice}</Text> : null}
        {error ? <AgentNotice error>{error}</AgentNotice> : null}

        <AgentButton
          onPress={reviewRequest}
          disabled={loading || submitted}
          busy={loading}
          label={loading
            ? copy('Saving…', 'Inahifadhi…')
            : submitted
              ? copy('Request saved', 'Ombi limehifadhiwa')
              : copy('Review request', 'Kagua ombi')}
        />
      </AgentScroll>

      <AgentSheet
        visible={picker !== null}
        onClose={() => setPicker(null)}
        title={picker === 'source' ? tr('sourceNetwork') : tr('destNetwork')}
      >
        {NETWORKS.map(network => {
          const selected = pickerSelection === network;
          return (
            <TouchableOpacity
              key={network}
              onPress={() => {
                if (picker === 'source') setSourceNetwork(network);
                else setDestNetwork(network);
                setPicker(null);
              }}
              style={[s.networkChoice, { borderBottomColor: colors.border }]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={NETWORK_NAMES[network]}
              activeOpacity={0.65}
            >
              <View style={s.fieldContent}>
                <Text style={[s.accountName, { color: colors.text }]}>{NETWORK_NAMES[network]}</Text>
              </View>
              {selected && <Ionicons name="checkmark" size={22} color={colors.text} />}
            </TouchableOpacity>
          );
        })}
      </AgentSheet>
      <AgentSheet visible={!!review} onClose={() => { if (!loading) setReview(null); }} title={copy('Review request','Kagua ombi')}>
        {review && <View style={s.reviewContent}>
          <Text style={[s.reviewAmount,{color:colors.text}]}>TZS {formatAmount(review.amountTzs)}</Text>
          {[[copy('From · approves collection','Kutoka · itaidhinisha malipo'),review.source],
            [copy('To · receives payout','Kwenda · itapokea fedha'),review.destination]].map(([label,endpoint]) => (
            <View key={label} style={s.reviewEndpoint}>
              <Text style={[s.label,{color:colors.secondary}]}>{label}</Text>
              <Text style={[s.accountName,{color:colors.text}]}>{NETWORK_NAMES[Object.keys(codes).find(key=>codes[key]===endpoint.networkCode)]}</Text>
              <Text selectable style={[s.reviewNumber,{color:colors.text}]}>{endpoint.identifier}</Text>
              <Text style={[s.label,{color:colors.secondary}]}>{endpoint.identifierType==='phone'?copy('Mobile wallet','Wallet ya simu'):endpoint.identifierType==='agent'?copy('Agent number','Namba ya wakala'):copy('Till number','Lipa namba')}</Text>
            </View>
          ))}
          <Text style={[s.executionNotice,{color:colors.secondary}]}>{copy('Submit for main-agent approval. No funds move at this step.','Tuma kwa idhini ya wakala mkuu. Hakuna fedha zitakazohamishwa katika hatua hii.')}</Text>
          <AgentButton onPress={handleSubmit} disabled={loading || submitted} busy={loading}
            label={isOnline?copy('Confirm request','Thibitisha ombi'):copy('Save on this device','Hifadhi kwenye kifaa hiki')} />
        </View>}
      </AgentSheet>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingTop: 0 },
  fieldContent: { flex: 1, paddingRight: 16 },
  endpoint: { paddingBottom:18, borderBottomWidth:1 },
  accountField: { minHeight:72,paddingTop:16,paddingBottom:8,flexDirection:'row',alignItems:'center' },
  typeRow: { flexDirection:'row',gap:20 },
  typeChoice: { minHeight:44,justifyContent:'center' },
  typeText: { fontFamily:fonts.bodyMed,fontSize:14 },
  numberInput: { minWidth:0,width:'100%',minHeight:50,paddingVertical:8,fontFamily:fonts.bodySemi,fontSize:23 },
  endpointHint: { fontFamily:fonts.body,fontSize:12,lineHeight:18 },
  reviewContent: { paddingVertical:10 },
  reviewAmount: { fontFamily:fonts.bodySemi,fontSize:30,marginBottom:24 },
  reviewEndpoint: { marginBottom:24 },
  reviewNumber: { fontFamily:fonts.bodySemi,fontSize:24,marginVertical:5 },
  label: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  accountName: { fontFamily: fonts.bodySemi, fontSize: 18, lineHeight: 25, marginTop: 2 },
  identifier: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, marginTop: 3 },
  amountField: { paddingTop: 19, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  currency: { fontFamily: fonts.bodyMed, fontSize: 18 },
  amountInput: { flex: 1, minWidth:0, minHeight: 50, paddingVertical: 4, fontFamily: fonts.bodySemi, fontSize: 32 },
  optionsToggle: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  optionsLabel: { fontFamily: fonts.bodyMed, fontSize: 15, lineHeight: 22 },
  optionsContent: { paddingBottom: 12 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9, marginBottom: 12 },
  quickButton: { flexGrow: 1, minWidth: 60, minHeight: 46, paddingHorizontal: 10, paddingVertical: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  quickText: { fontFamily: fonts.bodyMed, fontSize: 14 },
  urgentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  urgentCopy: { flex: 1, paddingRight: 14 },
  smallText: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, marginTop: 3 },
  urgentIndicator: { fontFamily: fonts.bodyMed, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  fee: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20, marginBottom: 7 },
  executionNotice: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, marginBottom: 17 },
  retry: { minHeight: 48, justifyContent: 'center', marginBottom: 8 },
  retryText: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 21 },
  message: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, marginBottom: 16 },
  networkChoice: { minHeight: 79, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
});
