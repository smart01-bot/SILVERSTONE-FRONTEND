import { validateAmount } from '../../api/workflowState';
import { api } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNetworkAccounts } from '../../api/exchanges';
// src/screens/sub-agent/NewRequestScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  ScrollView, KeyboardAvoidingView, Platform,

} from 'react-native';
import { Ionicons }       from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth }        from '../../context/AuthContext';
import { useTheme }       from '../../context/ThemeContext';
import { useLoader }      from '../../context/LoaderContext';
import { fonts, spacing, radius } from '../../constants/theme';
import AnimatedInput  from '../../components/AnimatedInput';
import PressableScale from '../../components/PressableScale';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';

const NETWORKS = ['Voda', 'Yas', 'Airtel', 'Halotel'];
const NETWORK_COLORS = {
  Voda:    '#E40000',
  Yas:     '#0070B8',
  Airtel:  '#FF0000',
  Halotel: '#D4A017',
};

export default function NewRequestScreen({ navigation, route }) {
  const { user, profile } = useAuth();
  const { showLoader, hideLoader } = useLoader();
  const { theme, tr }     = useTheme();
  const { isOnline, syncing, syncedCount, enqueue, syncQueue, pendingCount, queueError } = useOfflineQueue(user?.id, profile?.name);

  const [accounts,setAccounts] = useState([]);
  const [loading,setLoading] = useState(false);
  const [submitted,setSubmitted] = useState(false);
  const busy = useRef(false);
  const codes={Voda:'vodacom',Airtel:'airtel',Yas:'yas',Halotel:'halotel'};
  const selectedAccount=label=>{const matches=accounts.filter(a=>a.networkCode===codes[label]&&a.verificationStatus==='synthetic_fixture');return matches.length===1?matches[0]:null;};
  useEffect(()=>{let cancelled=false;setAccounts([]);const owner=user?.id;if(!owner)return;
    (async()=>{const key='silverstone_accounts_v1_'+owner;
      try {const cached=await AsyncStorage.getItem(key);if(cached&&!cancelled)setAccounts(JSON.parse(cached));
       if(isOnline){const rows=await getNetworkAccounts();if(api.currentOwner()===owner){await AsyncStorage.setItem(key,JSON.stringify(rows));if(!cancelled)setAccounts(rows);}}
      }catch(e){if(!cancelled)setError(e.message);}
    })();return()=>{cancelled=true;};},[user?.id,isOnline]);
  const prefill = route?.params?.prefill;

  const [sourceNetwork, setSourceNetwork] = useState(prefill?.sourceNetwork ?? '');
  const [destNetwork,   setDestNetwork]   = useState(prefill?.destNetwork   ?? '');
  const [sourcePhone,   setSourcePhone]   = useState(prefill?.sourcePhone   ?? '');
  const [destPhone,     setDestPhone]     = useState(prefill?.destPhone     ?? '');
  const [amount,        setAmount]        = useState(prefill?.amount ? String(prefill.amount) : '');
  const [urgent,        setUrgent]        = useState(false);
  const [error,         setError]         = useState('');
  const [notice, setNotice] = useState('');

  useEffect(()=>{setSourcePhone(selectedAccount(sourceNetwork)?.identifier||'');setDestPhone(selectedAccount(destNetwork)?.identifier||'');setSubmitted(false);},[sourceNetwork,destNetwork,accounts]);
  useEffect(()=>setSubmitted(false),[amount,urgent]);

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

  const handleSubmit = async () => {
    if(busy.current||submitted)return;
    const problem=validate();if(problem){setError(problem);return;}
    const source=selectedAccount(sourceNetwork),destination=selectedAccount(destNetwork);
    if(!source||!destination){setError('Verified test accounts are required. Connect to load your accounts.');return;}
    if(source.networkCode===destination.networkCode){setError('Choose two different networks.');return;}
    busy.current=true;setLoading(true);setError('');setNotice('');showLoader();
    try {
      await enqueue({sourceAccountId:source.id,destinationAccountId:destination.id,amountTzs:amount.replace(/,/g,''),currency:'TZS',urgent});
      setSubmitted(true);
      setNotice('Request saved on this device. No funds moved.');
      if(isOnline){const result=await syncQueue();setNotice(result?.remaining===0?'Request submitted for review. No funds moved.':'Saved request retained. Retry below with the same key.');}
    }catch(e){setError(e.message);}
    finally{busy.current=false;setLoading(false);hideLoader();}
  };

  const NetworkPicker = ({ label, selected, onSelect }) => (
    <View style={s.pickerWrap}>
      <Text style={[s.label, { color: theme.textDim }]}>{label}</Text>
      <View style={s.networkGrid}>
        {NETWORKS.map(net => (
          <PressableScale
            key={net}
            onPress={() => onSelect(net)}
            style={[
              s.netBtn,
              {
                backgroundColor: selected === net ? NETWORK_COLORS[net] + '20' : theme.surfaceAlt,
                borderColor:     selected === net ? NETWORK_COLORS[net]         : theme.border,
              },
            ]}
            accessibilityRole="radio"
            accessibilityLabel={`${label}: ${net}`}
            accessibilityState={{selected: selected === net}}
            scaleDown={0.94}
          >
            <View style={[s.netColorDot, { backgroundColor: NETWORK_COLORS[net] }]} />
            <Text style={[
              s.netBtnText,
              {
                color:      selected === net ? NETWORK_COLORS[net] : theme.text,
                fontFamily: selected === net ? fonts.bodyBold : fonts.bodyMed,
              },
            ]}>
              {net}
            </Text>
          </PressableScale>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient
        colors={[theme.gradPrimA, theme.gradPrimB]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.header}
      >
        <View style={s.headerDecor} />
        <Text style={s.headerTitle}>{tr('floatRequest')}</Text>
        <Text style={s.headerSub}>{tr('submitRequest')}</Text>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Offline banner */}
          {!isOnline && (
            <View style={[s.offlineBanner, { backgroundColor: '#F59E0B18', borderColor: '#F59E0B' }]}>
              <Ionicons name="cloud-offline-outline" size={16} color="#F59E0B" />
              <Text style={[s.offlineBannerText, { color: '#F59E0B' }]}>
                Offline or checking connection. Save on this device; submission retries while this screen is open and connected.
              </Text>
            </View>
          )}

          {/* Sync success toast — auto-clears after 4s via hook */}
          {syncedCount > 0 && (
            <View style={[s.syncToast, { backgroundColor: theme.primary }]}>
              <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
              <Text style={s.syncToastText}>
                {syncedCount} request{syncedCount > 1 ? 's' : ''} synced
              </Text>
            </View>
          )}

          <NetworkPicker label={tr('sourceNetwork')} selected={sourceNetwork} onSelect={setSourceNetwork} />
          <NetworkPicker label={tr('destNetwork')}   selected={destNetwork}   onSelect={setDestNetwork}   />

          <AnimatedInput
            label="Source account identifier" editable={false}
            value={sourcePhone}
            onChangeText={setSourcePhone}
            placeholder="Select a verified test network account"
            keyboardType="phone-pad"
          />

          <AnimatedInput
            label="Destination account identifier" editable={false}
            value={destPhone}
            onChangeText={setDestPhone}
            placeholder="Select a verified test network account"
            keyboardType="phone-pad"
          />

          <AnimatedInput
            label={tr('amount')}
            value={amount}
            onChangeText={handleAmountChange}
            placeholder="0"
            keyboardType="numeric"
            prefix="TZS"
            height={60}
            inputStyle={{ fontSize: 28, fontFamily: fonts.bodyBold }}
          />

          <View style={s.quickRow}>
            {[10000, 50000, 100000, 500000].map(n => (
              <TouchableOpacity
                key={n}
                onPress={() => addQuick(n)}
                style={[s.quickBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                activeOpacity={0.75}
              >
                <Text style={[s.quickBtnText, { color: theme.primary }]}>
                  +{n >= 1000 ? `${n / 1000}k` : n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            accessibilityRole="switch"
            accessibilityState={{checked:urgent}}
            accessibilityLabel={tr("markUrgent")}
            onPress={() => setUrgent(v => !v)}
            style={[s.urgentRow, {
              backgroundColor: urgent ? '#F59E0B14' : theme.surfaceAlt,
              borderColor:     urgent ? '#F59E0B'   : theme.border,
            }]}
            activeOpacity={0.8}
          >
            <View style={{flex:1,marginRight:12}}>
              <Text style={[s.urgentLabel, { color: theme.text }]}>{tr('markUrgent')}</Text>
              <Text style={[s.urgentSub,   { color: theme.textDim }]}>{"Flag for review; queue remains first-in, first-out."}</Text>
            </View>
            <View style={[s.toggle, { backgroundColor: urgent ? '#F59E0B' : theme.border }]}>
              <View style={[s.toggleKnob, { transform: [{ translateX: urgent ? 18 : 2 }] }]} />
            </View>
          </TouchableOpacity>

          <Text style={[s.label,{color:theme.textDim}]}>Silverstone fee: TZS 0. Provider charges unknown. Provider execution disabled; do not send funds. Accounts shown are synthetic test fixtures, not real verification.</Text>
          {pendingCount>0&&<TouchableOpacity onPress={syncQueue} accessibilityRole="button" accessibilityState={{disabled:!isOnline||loading||syncing,busy:syncing}} style={{minHeight:48,justifyContent:"center"}} disabled={!isOnline||loading||syncing}><Text style={{color:theme.primary}}>{pendingCount} saved request(s) — Retry submission</Text></TouchableOpacity>}
          {queueError?<Text style={{color:theme.danger}}>{queueError}</Text>:null}
          {notice ? <Text accessibilityLiveRegion="polite" style={[s.error,{color:theme.text}]}>{notice}</Text> : null}
          {error ? <Text accessibilityRole="alert" style={[s.error, { color: theme.danger }]}>{error}</Text> : null}

          {sourceNetwork && destNetwork && amount ? (
            <View style={[s.summary, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Text style={[s.summaryTitle, { color: theme.text }]}>{tr('summary')}</Text>
              <View style={s.summaryRow}>
                <Text style={[s.summaryLabel, { color: theme.textDim }]}>{tr('route')}</Text>
                <Text style={[s.summaryValue, { color: theme.text }]}>{sourceNetwork} → {destNetwork}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={[s.summaryLabel, { color: theme.textDim }]}>{tr('amount')}</Text>
                <Text style={[s.summaryValue, { color: theme.primary }]}>TZS {amount}</Text>
              </View>
              {urgent && (
                <View style={s.summaryRow}>
                  <Text style={[s.summaryLabel, { color: theme.textDim }]}>Priority</Text>
                  <Text style={[s.summaryValue, { color: '#F59E0B' }]}>URGENT</Text>
                </View>
              )}
            </View>
          ) : null}

          <PressableScale
            onPress={handleSubmit}
            disabled={loading || submitted}
            style={[s.submitBtn, { backgroundColor: loading ? theme.primaryDark : theme.primary }]}
            scaleDown={0.97}
          >
            {<Text style={s.submitText}>{loading ? 'Saving…' : submitted ? 'Request saved' : isOnline ? tr('submitRequest') : 'Save on this device'}</Text>}
          </PressableScale>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: 110 },

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

  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.sm + 2, borderRadius: radius.md, borderWidth: 1,
    marginTop: spacing.md,
  },
  offlineBannerText: { flex: 1, fontSize: 14, fontFamily: fonts.body, lineHeight: 20 },

  syncToast: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.sm + 2, borderRadius: radius.md, marginTop: spacing.md,
  },
  syncToastText: { color: '#fff', fontFamily: fonts.bodySemi, fontSize: 15 },

  pickerWrap:  { marginTop: spacing.md + 2 },
  label:       { fontSize: 16, fontFamily: fonts.bodySemi, marginBottom: spacing.sm + 2, letterSpacing: 0.1 },
  networkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  netBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm - 1,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md - 4,
    borderRadius: radius.md + 1, borderWidth: 1.5,
  },
  netColorDot: { width: 10, height: 10, borderRadius: 5 },
  netBtnText:  { fontSize: 17 },

  quickRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm + 2 },
  quickBtn: {
    flex: 1, minHeight: 48, borderRadius: radius.sm + 2, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  quickBtnText: { fontSize: 15, fontFamily: fonts.bodyBold },

  urgentRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, borderRadius: radius.lg - 2, borderWidth: 1.5, marginTop: spacing.md + 2,
  },
  urgentLabel: { fontSize: 18, fontFamily: fonts.bodySemi },
  urgentSub:   { fontSize: 15, fontFamily: fonts.body, marginTop: 3 },
  toggle:      { width: 44, height: 26, borderRadius: 13, justifyContent: 'center' },
  toggleKnob:  { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },

  error: { fontSize: 16, fontFamily: fonts.body, textAlign: 'center', marginTop: spacing.md - 2 },

  summary: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, marginTop: spacing.md + 2, gap: spacing.sm + 2 },
  summaryTitle: { fontSize: 18, fontFamily: fonts.bodyBold, marginBottom: spacing.xs },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 16, fontFamily: fonts.body },
  summaryValue: { fontSize: 16, fontFamily: fonts.bodySemi },

  submitBtn: {
    minHeight: 58, paddingVertical: 12, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg - 2,
  },
  submitText: { color: '#fff', fontSize: 19, fontFamily: fonts.bodyBold },
});