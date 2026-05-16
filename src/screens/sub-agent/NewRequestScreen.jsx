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
import AnimatedInput      from '../../components/AnimatedInput';
import PressableScale     from '../../components/PressableScale';
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
      const q   = query(collection(db, 'requests'), where('status', '==', 'pending'));
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
    <View style={styles.pickerWrap}>
      <Text style={[styles.label, { color: theme.textDim }]}>{label}</Text>
      <View style={styles.networkGrid}>
        {NETWORKS.map(net => (
          <PressableScale
            key={net}
            onPress={() => onSelect(net)}
            style={[
              styles.netBtn,
              {
                backgroundColor: selected === net ? NETWORK_COLORS[net] + '20' : theme.surfaceAlt,
                borderColor:     selected === net ? NETWORK_COLORS[net]         : theme.border,
              },
            ]}
            scaleDown={0.94}
          >
            <View style={[styles.netColorDot, { backgroundColor: NETWORK_COLORS[net] }]} />
            <Text style={[
              styles.netBtnText,
              {
                color:      selected === net ? NETWORK_COLORS[net] : theme.text,
                fontWeight: selected === net ? '700' : '500',
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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#C8102E" />

      <LinearGradient
        colors={[theme.gradPrimA, theme.gradPrimB]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>{tr('floatRequest')}</Text>
        <Text style={styles.headerSub}>{tr('submitRequest')}</Text>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <NetworkPicker label={tr('sourceNetwork')} selected={sourceNetwork} onSelect={setSourceNetwork} />
          <NetworkPicker label={tr('destNetwork')}   selected={destNetwork}   onSelect={setDestNetwork}   />

          {/* Source phone */}
          <AnimatedInput
            label={tr('sourcePhone')}
            value={sourcePhone}
            onChangeText={setSourcePhone}
            placeholder="07XX XXX XXX"
            keyboardType="phone-pad"
          />

          {/* Destination phone */}
          <AnimatedInput
            label={tr('destPhone')}
            value={destPhone}
            onChangeText={setDestPhone}
            placeholder="07XX XXX XXX"
            keyboardType="phone-pad"
          />

          {/* Amount */}
          <AnimatedInput
            label={tr('amount')}
            value={amount}
            onChangeText={handleAmountChange}
            placeholder="0"
            keyboardType="numeric"
            prefix="TZS"
            height={60}
            inputStyle={{ fontSize: 28, fontWeight: '700' }}
          />
          <View style={styles.quickRow}>
            {[10000, 50000, 100000, 500000].map(n => (
              <TouchableOpacity
                key={n}
                onPress={() => addQuick(n)}
                style={[styles.quickBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                activeOpacity={0.75}
              >
                <Text style={[styles.quickBtnText, { color: theme.primary }]}>
                  +{n >= 1000 ? `${n / 1000}k` : n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Urgent toggle */}
          <TouchableOpacity
            onPress={() => setUrgent(v => !v)}
            style={[styles.urgentRow, {
              backgroundColor: urgent ? '#F59E0B14' : theme.surfaceAlt,
              borderColor:     urgent ? '#F59E0B'   : theme.border,
            }]}
            activeOpacity={0.8}
          >
            <View>
              <Text style={[styles.urgentLabel, { color: theme.text }]}>{tr('markUrgent')}</Text>
              <Text style={[styles.urgentSub,   { color: theme.textDim }]}>{tr('urgentDesc')}</Text>
            </View>
            <View style={[styles.toggle, { backgroundColor: urgent ? '#F59E0B' : theme.border }]}>
              <View style={[styles.toggleKnob, { transform: [{ translateX: urgent ? 18 : 2 }] }]} />
            </View>
          </TouchableOpacity>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Summary */}
          {sourceNetwork && destNetwork && amount ? (
            <View style={[styles.summary, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Text style={[styles.summaryTitle, { color: theme.text }]}>{tr('summary')}</Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textDim }]}>{tr('route')}</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>{sourceNetwork} → {destNetwork}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textDim }]}>{tr('amount')}</Text>
                <Text style={[styles.summaryValue, { color: theme.primary }]}>TZS {amount}</Text>
              </View>
              {urgent && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textDim }]}>Priority</Text>
                  <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>URGENT</Text>
                </View>
              )}
            </View>
          ) : null}

          {/* Submit */}
          <PressableScale
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitBtn, { backgroundColor: loading ? theme.primaryDark : theme.primary }]}
            scaleDown={0.97}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>{tr('submitRequest')}</Text>
            }
          </PressableScale>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: 16, paddingBottom: 110 },

  header: {
    paddingHorizontal:       18,
    paddingTop:              12,
    paddingBottom:           22,
    borderBottomLeftRadius:  26,
    borderBottomRightRadius: 26,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 16, color: 'rgba(255,255,255,0.75)', marginTop: 3 },

  pickerWrap:  { marginTop: 18 },
  label:       { fontSize: 15, fontWeight: '600', marginBottom: 10, letterSpacing: 0.1 },
  networkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  netBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 13, borderWidth: 1.5,
  },
  netColorDot: { width: 10, height: 10, borderRadius: 5 },
  netBtnText:  { fontSize: 17 },

  quickRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  quickBtn: {
    flex: 1, height: 40, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  quickBtnText: { fontSize: 15, fontWeight: '700' },

  urgentRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 14, borderWidth: 1.5, marginTop: 18,
  },
  urgentLabel: { fontSize: 18, fontWeight: '600' },
  urgentSub:   { fontSize: 15, marginTop: 3 },
  toggle:      { width: 44, height: 26, borderRadius: 13, justifyContent: 'center' },
  toggleKnob:  { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },

  error: { color: '#C8102E', fontSize: 16, textAlign: 'center', marginTop: 14 },

  summary: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 18, gap: 10 },
  summaryTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 16 },
  summaryValue: { fontSize: 16, fontWeight: '600' },

  submitBtn: {
    height: 58, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 22,
  },
  submitText: { color: '#fff', fontSize: 19, fontWeight: '700' },
});
