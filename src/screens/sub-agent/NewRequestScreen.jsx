import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Switch, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { submitRequest } from '../../utils/firestore';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import { NETWORKS, NETWORK_COLORS, NETWORK_WALLETS } from '../../constants/networks';
import { validatePhone, validateAmount } from '../../utils/validation';

const fmt = (n) => n ? `TZS ${Number(n).toLocaleString()}` : '—';

export default function NewRequestScreen({ navigation, route }) {
  const { user, profile } = useAuth();
  const { theme, tr } = useTheme();
  const { isOnline, enqueue } = useOfflineQueue(user?.uid, profile?.name);

  const prefill = route?.params?.prefill;
  const [form, setForm] = useState({
    ...( prefill ? {
      sourceNetwork: prefill.sourceNetwork ?? '',
      destNetwork:   prefill.destNetwork   ?? '',
      sourcePhone:   prefill.sourcePhone   ?? '',
      destPhone:     prefill.destPhone     ?? '',
      amount:        prefill.amount ? String(prefill.amount) : '',
      urgent:        prefill.urgent ?? false,
    } : {
      sourceNetwork: '',
      destNetwork:   '',
      sourcePhone:   '',
      destPhone:     '',
      amount:        '',
      urgent:        false,
    }),
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const set = (k) => (v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (fieldErrors[k]) setFieldErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const validate = () => {
    const errs = {};
    if (!form.sourceNetwork) errs.sourceNetwork = 'Select source network.';
    if (!form.destNetwork)   errs.destNetwork = 'Select destination network.';
    if (form.sourceNetwork && form.destNetwork && form.sourceNetwork === form.destNetwork)
      errs.destNetwork = 'Destination must differ from source.';
    const sp = validatePhone(form.sourcePhone);
    if (!sp.valid) errs.sourcePhone = sp.message;
    const dp = validatePhone(form.destPhone);
    if (!dp.valid) errs.destPhone = dp.message;
    const amt = validateAmount(form.amount);
    if (!amt.valid) errs.amount = amt.message;
    setFieldErrors(errs);
    return Object.keys(errs).length > 0 ? Object.values(errs)[0] : null;
  };

  const submit = async () => {
    setError('');
    const err = validate();
    if (err) return;
    setLoading(true);
    const requestData = {
      sourceNetwork: form.sourceNetwork,
      destNetwork:   form.destNetwork,
      sourcePhone:   form.sourcePhone.trim(),
      destPhone:     form.destPhone.trim(),
      amount:        Number(form.amount),
      urgent:        form.urgent,
    };
    try {
      if (!isOnline) {
        await enqueue(requestData);
        setSubmitted({ requestId: 'OFFLINE-' + Date.now().toString(36).toUpperCase(), queuePos: 'queued offline' });
        return;
      }
      const id = await submitRequest(user.uid, profile.name, requestData);
      setSubmitted({ requestId: id, queuePos: '~' + (Math.floor(Math.random() * 5) + 1) });
    } catch (e) {
      setError(e.message ?? tr('error'));
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────
  if (submitted) return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.successWrap}>
        <View style={[styles.successIcon, { backgroundColor: '#DCFCE7' }]}>
          <Text style={{ fontSize: 48 }}>✅</Text>
        </View>
        <Text style={[styles.successTitle, { color: theme.text }]}>{tr('requestSent')}</Text>
        <Text style={[styles.successDesc, { color: theme.textDim }]}>{tr('requestSentDesc')}</Text>

        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {[
            [tr('requestId'),  submitted.requestId.slice(-8).toUpperCase()],
            [tr('queuePos'),   submitted.queuePos],
            ['Status',         'Pending'],
          ].map(([label, val]) => (
            <View key={label} style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textDim }]}>{label}</Text>
              <Text style={[styles.infoVal,   { color: theme.text }]}>{val}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => {
            setSubmitted(null);
            setForm({ sourceNetwork:'', destNetwork:'', sourcePhone:'', destPhone:'', amount:'', urgent:false });
            setFieldErrors({});
            navigation.navigate('Home');
          }}
          style={[styles.btn, { backgroundColor: theme.primary }]}>
          <Text style={styles.btnText}>{tr('backHome')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // ── Form ───────────────────────────────────────────────────
  const NetworkPicker = ({ label, selected, onSelect, exclude, errorKey }) => (
    <View style={{ gap: 8, marginBottom: 4 }}>
      <Text style={[styles.label, { color: theme.textDim }]}>{label}</Text>
      <View style={styles.netGrid}>
        {NETWORKS.map(n => {
          const isDisabled = n === exclude;
          const isSelected = n === selected;
          return (
            <TouchableOpacity key={n}
              onPress={() => { if (!isDisabled) { onSelect(n); if (fieldErrors[errorKey]) setFieldErrors(e => { const x = { ...e }; delete x[errorKey]; return x; }); } }}
              style={[
                styles.netBtn,
                { borderColor: isSelected ? NETWORK_COLORS[n] : (fieldErrors[errorKey] ? '#DC262630' : theme.border),
                  backgroundColor: isSelected ? NETWORK_COLORS[n] + '18' : theme.surfaceAlt,
                  opacity: isDisabled ? 0.35 : 1,
                }
              ]}>
              <View style={[styles.netDot, { backgroundColor: NETWORK_COLORS[n] }]} />
              <Text style={[styles.netBtnText, { color: isSelected ? NETWORK_COLORS[n] : theme.text }]}>{n}</Text>
              <Text style={[styles.netWallet, { color: theme.textDim }]}>{NETWORK_WALLETS[n]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {fieldErrors[errorKey] ? <Text style={styles.fieldError}>{fieldErrors[errorKey]}</Text> : null}
    </View>
  );

  const fe = (k) => fieldErrors[k] ? <Text style={styles.fieldError}>{fieldErrors[k]}</Text> : null;

  const inp = (key) => [
    styles.input,
    {
      backgroundColor: theme.surfaceAlt,
      borderColor: fieldErrors[key] ? '#DC2626' : theme.border,
      color: theme.text,
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>⚠ You're offline — request will be saved and sent when connected</Text>
        </View>
      )}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <Text style={[styles.title, { color: theme.text }]}>{tr('floatRequest')}</Text>
          <Text style={[styles.sub, { color: theme.textDim }]}>{tr('submitRequest')}</Text>

          <NetworkPicker
            label={tr('sourceNetwork')}
            selected={form.sourceNetwork}
            onSelect={set('sourceNetwork')}
            exclude={form.destNetwork}
            errorKey="sourceNetwork"
          />
          <NetworkPicker
            label={tr('destNetwork')}
            selected={form.destNetwork}
            onSelect={set('destNetwork')}
            exclude={form.sourceNetwork}
            errorKey="destNetwork"
          />

          <Text style={[styles.label, { color: theme.textDim }]}>{tr('sourcePhone')}</Text>
          <TextInput style={inp('sourcePhone')} value={form.sourcePhone} onChangeText={set('sourcePhone')}
            placeholder="e.g. 0741234567" placeholderTextColor={theme.muted} keyboardType="phone-pad" />
          {fe('sourcePhone')}

          <Text style={[styles.label, { color: theme.textDim }]}>{tr('destPhone')}</Text>
          <TextInput style={inp('destPhone')} value={form.destPhone} onChangeText={set('destPhone')}
            placeholder="e.g. 0651234567" placeholderTextColor={theme.muted} keyboardType="phone-pad" />
          {fe('destPhone')}

          <Text style={[styles.label, { color: theme.textDim }]}>{tr('amount')}</Text>
          <TextInput style={inp('amount')} value={form.amount} onChangeText={set('amount')}
            placeholder="e.g. 50000 (min 1,000)" placeholderTextColor={theme.muted} keyboardType="numeric" />
          {fe('amount')}

          {/* Urgent toggle */}
          <View style={[styles.urgentRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.urgentLabel, { color: theme.text }]}>⚡ {tr('markUrgent')}</Text>
              <Text style={[styles.urgentDesc, { color: theme.textDim }]}>{tr('urgentDesc')}</Text>
            </View>
            <Switch
              value={form.urgent}
              onValueChange={set('urgent')}
              trackColor={{ true: theme.primary, false: theme.border }}
              thumbColor="#fff"
            />
          </View>

          {/* Summary */}
          {(form.sourceNetwork && form.destNetwork && form.amount) && (
            <View style={[styles.summaryCard, { backgroundColor: theme.primaryLight, borderColor: theme.primary + '30' }]}>
              <Text style={[styles.summaryTitle, { color: theme.primary }]}>{tr('summary')}</Text>
              <Text style={[styles.summaryLine, { color: theme.textMid }]}>
                {form.sourceNetwork} ({NETWORK_WALLETS[form.sourceNetwork]}) → {form.destNetwork} ({NETWORK_WALLETS[form.destNetwork]})
              </Text>
              <Text style={[styles.summaryAmt, { color: theme.text }]}>{fmt(form.amount)}</Text>
              {form.urgent && <Text style={{ color: '#F59E0B', fontWeight: '600', fontSize: 13 }}>⚡ URGENT</Text>}
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity onPress={submit} disabled={loading}
            style={[styles.btn, { backgroundColor: theme.primary, marginTop: 8 }]}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>{tr('submitRequest')} →</Text>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  scroll:  { padding: 16, paddingBottom: 100, gap: 6 },
  title:   { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  sub:     { fontSize: 14, marginBottom: 8 },
  label:   { fontSize: 13, fontWeight: '500', marginTop: 4 },
  input:   { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, marginTop: 4 },
  fieldError: { color: '#DC2626', fontSize: 12, marginTop: 3 },
  netGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  netBtn:  { width: '47%', borderWidth: 1.5, borderRadius: 12, padding: 10, gap: 3 },
  netDot:  { width: 8, height: 8, borderRadius: 4 },
  netBtnText: { fontSize: 14, fontWeight: '700' },
  netWallet:  { fontSize: 11 },
  urgentRow:  { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 14, gap: 12, marginTop: 4 },
  urgentLabel:{ fontSize: 15, fontWeight: '600' },
  urgentDesc: { fontSize: 12, marginTop: 2 },
  summaryCard:  { borderWidth: 1, borderRadius: 14, padding: 14, gap: 6, marginTop: 4 },
  summaryTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryLine:  { fontSize: 14 },
  summaryAmt:   { fontSize: 22, fontWeight: '800', fontFamily: 'Courier New' },
  offlineBanner: { backgroundColor: '#DC2626', paddingVertical: 7, paddingHorizontal: 16, alignItems: 'center' },
  offlineText:   { color: '#fff', fontSize: 12, fontWeight: '600' },
  error:   { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  btn:     { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  // Success
  successWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  successIcon:  { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  successDesc:  { fontSize: 15, textAlign: 'center', lineHeight: 24 },
  infoCard:     { width: '100%', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  infoRow:      { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#00000010' },
  infoLabel:    { fontSize: 13 },
  infoVal:      { fontSize: 13, fontWeight: '700', fontFamily: 'Courier New' },
});
