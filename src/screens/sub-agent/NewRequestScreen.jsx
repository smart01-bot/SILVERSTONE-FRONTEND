// src/screens/sub-agent/NewRequestScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons }       from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth }        from '../../context/AuthContext';
import { useTheme }       from '../../context/ThemeContext';
import { fonts, spacing, radius } from '../../constants/theme';
import AnimatedInput  from '../../components/AnimatedInput';
import PressableScale from '../../components/PressableScale';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

const NETWORKS = ['Voda', 'Yas', 'Airtel', 'Halotel'];
const NETWORK_COLORS = {
  Voda:    '#E40000',
  Yas:     '#0070B8',
  Airtel:  '#FF0000',
  Halotel: '#D4A017',
};

export default function NewRequestScreen({ navigation, route }) {
  const { user, profile } = useAuth();
  const { theme, tr }     = useTheme();

  const prefill = route?.params?.prefill;

  const [sourceNetwork, setSourceNetwork] = useState(prefill?.sourceNetwork ?? '');
  const [destNetwork,   setDestNetwork]   = useState(prefill?.destNetwork   ?? '');
  const [sourcePhone,   setSourcePhone]   = useState(prefill?.sourcePhone   ?? '');
  const [destPhone,     setDestPhone]     = useState(prefill?.destPhone     ?? '');
  const [amount,        setAmount]        = useState(prefill?.amount ? String(prefill.amount) : '');
  const [urgent,        setUrgent]        = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');

  useEffect(() => {
    if (sourceNetwork && profile?.agentPhoneNumbers?.[sourceNetwork]) {
      setSourcePhone(profile.agentPhoneNumbers[sourceNetwork]);
    }
  }, [sourceNetwork]);

  const formatAmount = (val) => {
    const digits = val.replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleAmountChange = (val) => setAmount(formatAmount(val));

  const addQuick = (n) => {
    const current = Number(amount.replace(/,/g, '')) || 0;
    setAmount(formatAmount(String(current + n)));
  };

  const validate = () => {
    if (!sourceNetwork) return tr('sourceNetwork') + ' ' + tr('error');
    if (!destNetwork)   return tr('destNetwork')   + ' ' + tr('error');
    if (!sourcePhone)   return tr('sourcePhone')   + ' ' + tr('error');
    if (!destPhone)     return tr('destPhone')     + ' ' + tr('error');
    if (!amount)        return tr('amount')        + ' ' + tr('error');
    if (Number(amount.replace(/,/g, '')) <= 0) return tr('error');
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      const q    = query(collection(db, 'requests'), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      const pos  = snap.size + 1;
      await addDoc(collection(db, 'requests'), {
        agentId:       user.uid,
        agentName:     profile?.name ?? 'Agent',
        sourceNetwork, destNetwork, sourcePhone, destPhone,
        amount:        Number(amount.replace(/,/g, '')),
        urgent,
        status:        'pending',
        queuePosition: pos,
        createdAt:     Timestamp.now(),
      });
      navigation.replace('RequestSuccess', {
        queuePosition: pos,
        sourceNetwork, destNetwork,
        amount: Number(amount.replace(/,/g, '')),
      });
    } catch (e) {
      setError(tr('error'));
    } finally {
      setLoading(false);
    }
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
          <NetworkPicker label={tr('sourceNetwork')} selected={sourceNetwork} onSelect={setSourceNetwork} />
          <NetworkPicker label={tr('destNetwork')}   selected={destNetwork}   onSelect={setDestNetwork}   />

          <AnimatedInput
            label={tr('sourcePhone')}
            value={sourcePhone}
            onChangeText={setSourcePhone}
            placeholder="07XX XXX XXX"
            keyboardType="phone-pad"
          />

          <AnimatedInput
            label={tr('destPhone')}
            value={destPhone}
            onChangeText={setDestPhone}
            placeholder="07XX XXX XXX"
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
            onPress={() => setUrgent(v => !v)}
            style={[s.urgentRow, {
              backgroundColor: urgent ? '#F59E0B14' : theme.surfaceAlt,
              borderColor:     urgent ? '#F59E0B'   : theme.border,
            }]}
            activeOpacity={0.8}
          >
            <View>
              <Text style={[s.urgentLabel, { color: theme.text }]}>{tr('markUrgent')}</Text>
              <Text style={[s.urgentSub,   { color: theme.textDim }]}>{tr('urgentDesc')}</Text>
            </View>
            <View style={[s.toggle, { backgroundColor: urgent ? '#F59E0B' : theme.border }]}>
              <View style={[s.toggleKnob, { transform: [{ translateX: urgent ? 18 : 2 }] }]} />
            </View>
          </TouchableOpacity>

          {error ? <Text style={[s.error, { color: theme.danger }]}>{error}</Text> : null}

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
            disabled={loading}
            style={[s.submitBtn, { backgroundColor: loading ? theme.primaryDark : theme.primary }]}
            scaleDown={0.97}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.submitText}>{tr('submitRequest')}</Text>
            }
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
    flex: 1, height: 42, borderRadius: radius.sm + 2, borderWidth: 1,
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
    height: 58, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg - 2,
  },
  submitText: { color: '#fff', fontSize: 19, fontFamily: fonts.bodyBold },
});
