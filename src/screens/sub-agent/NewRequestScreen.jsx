import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Switch, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { submitRequest } from '../../utils/firestore';
import { NETWORKS, NETWORK_COLORS, NETWORK_WALLETS } from '../../constants/networks';

const fmt = (n) => n ? `TZS ${Number(n).toLocaleString()}` : '—';

export default function NewRequestScreen({ navigation }) {
  const { user, profile } = useAuth();
  const { theme, tr } = useTheme();

  const [form, setForm] = useState({
    sourceNetwork: '',
    destNetwork:   '',
    sourcePhone:   '',
    destPhone:     '',
    amount:        '',
    urgent:        false,
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(null); // { requestId, queuePos }

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    if (!form.sourceNetwork) return 'Select source network.';
    if (!form.destNetwork)   return 'Select destination network.';
    if (form.sourceNetwork === form.destNetwork) return 'Source and destination must be different.';
    if (!form.sourcePhone.trim()) return 'Enter source phone.';
    if (!form.destPhone.trim())   return 'Enter destination phone.';
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) return 'Enter a valid amount.';
    return null;
  };

  const submit = async () => {
    setError('');
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      const id = await submitRequest(user.uid, profile.name, {
        sourceNetwork: form.sourceNetwork,
        destNetwork:   form.destNetwork,
        sourcePhone:   form.sourcePhone.trim(),
        destPhone:     form.destPhone.trim(),
        amount:        Number(form.amount),
        urgent:        form.urgent,
      });
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

        <TouchableOpacity onPress={() => { setSubmitted(null); setForm({ sourceNetwork:'', destNetwork:'', sourcePhone:'', destPhone:'', amount:'', urgent:false }); navigation.navigate('Home'); }}
          style={[styles.btn, { backgroundColor: theme.primary }]}>
          <Text style={styles.btnText}>{tr('backHome')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // ── Form ───────────────────────────────────────────────────
  const NetworkPicker = ({ label, selected, onSelect, exclude }) => (
    <View style={{ gap: 8, marginBottom: 4 }}>
      <Text style={[styles.label, { color: theme.textDim }]}>{label}</Text>
      <View style={styles.netGrid}>
        {NETWORKS.map(n => {
          const isDisabled = n === exclude;
          const isSelected = n === selected;
          return (
            <TouchableOpacity key={n} onPress={() => !isDisabled && onSelect(n)}
              style={[
                styles.netBtn,
                { borderColor: isSelected ? NETWORK_COLORS[n] : theme.border,
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
    </View>
  );

  const inp = [styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }];
  const lbl = [styles.label, { color: theme.textDim }];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <Text style={[styles.title, { color: theme.text }]}>{tr('floatRequest')}</Text>
          <Text style={[styles.sub, { color: theme.textDim }]}>{tr('submitRequest')}</Text>

          <NetworkPicker
            label={tr('sourceNetwork')}
            selected={form.sourceNetwork}
            onSelect={set('sourceNetwork')}
            exclude={form.destNetwork}
          />
          <NetworkPicker
            label={tr('destNetwork')}
            selected={form.destNetwork}
            onSelect={set('destNetwork')}
            exclude={form.sourceNetwork}
          />

          <Text style={lbl}>{tr('sourcePhone')}</Text>
          <TextInput style={inp} value={form.sourcePhone} onChangeText={set('sourcePhone')} placeholder="e.g. 0741234567" placeholderTextColor={theme.muted} keyboardType="phone-pad" />

          <Text style={lbl}>{tr('destPhone')}</Text>
          <TextInput style={inp} value={form.destPhone} onChangeText={set('destPhone')} placeholder="e.g. 0651234567" placeholderTextColor={theme.muted} keyboardType="phone-pad" />

          <Text style={lbl}>{tr('amount')}</Text>
          <TextInput style={inp} value={form.amount} onChangeText={set('amount')} placeholder="e.g. 500000" placeholderTextColor={theme.muted} keyboardType="numeric" />

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
  scroll:  { padding: 16, paddingBottom: 100, gap: 10 },
  title:   { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  sub:     { fontSize: 14, marginBottom: 8 },
  label:   { fontSize: 13, fontWeight: '500', marginTop: 4 },
  input:   { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, marginTop: 4 },
  netGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  netBtn:  { width: '47%', borderWidth: 1.5, borderRadius: 12, padding: 10, gap: 3 },
  netDot:  { width: 8, height: 8, borderRadius: 4 },
  netBtnText: { fontSize: 14, fontWeight: '700' },
  netWallet:  { fontSize: 11 },
  urgentRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 14, gap: 12 },
  urgentLabel: { fontSize: 15, fontWeight: '600' },
  urgentDesc:  { fontSize: 12, marginTop: 2 },
  summaryCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 6 },
  summaryTitle:{ fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryLine: { fontSize: 14 },
  summaryAmt:  { fontSize: 22, fontWeight: '800', fontFamily: 'Courier New' },
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