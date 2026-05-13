// src/screens/sub-agent/NewRequestScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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
  const { theme, isDark }  = useTheme();

  const prefill = route?.params?.prefill;

  const [sourceNetwork, setSourceNetwork] = useState(prefill?.sourceNetwork ?? '');
  const [destNetwork,   setDestNetwork]   = useState(prefill?.destNetwork   ?? '');
  const [sourcePhone,   setSourcePhone]   = useState(prefill?.sourcePhone   ?? '');
  const [destPhone,     setDestPhone]     = useState(prefill?.destPhone     ?? '');
  const [amount,        setAmount]        = useState(prefill?.amount ? String(prefill.amount) : '');
  const [urgent,        setUrgent]        = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [queuePos,      setQueuePos]      = useState(null);

  // Pre-fill source phone from saved network phones
  useEffect(() => {
    if (sourceNetwork && profile?.agentPhoneNumbers?.[sourceNetwork]) {
      setSourcePhone(profile.agentPhoneNumbers[sourceNetwork]);
    }
  }, [sourceNetwork]);

  const formatAmount = (val) => {
    const digits = val.replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleAmountChange = (val) => {
    setAmount(formatAmount(val));
  };

  const addQuick = (n) => {
    const current = Number(amount.replace(/,/g, '')) || 0;
    setAmount(formatAmount(String(current + n)));
  };

  const validate = () => {
    if (!sourceNetwork)  return 'Select source network.';
    if (!destNetwork)    return 'Select destination network.';
    if (sourceNetwork === destNetwork)
      return 'Source and destination must be different.';
    if (!sourcePhone)    return 'Enter source phone number.';
    if (!destPhone)      return 'Enter destination phone number.';
    if (!amount)         return 'Enter an amount.';
    const num = Number(amount.replace(/,/g, ''));
    if (num <= 0)        return 'Enter a valid amount.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);

    try {
      // Get queue position
      const q = query(
        collection(db, 'requests'),
        where('status', '==', 'pending')
      );
      const snap = await getDocs(q);
      const pos  = snap.size + 1;
      setQueuePos(pos);

      await addDoc(collection(db, 'requests'), {
        agentId:       user.uid,
        agentName:     profile?.name ?? 'Agent',
        sourceNetwork,
        destNetwork,
        sourcePhone,
        destPhone,
        amount:        Number(amount.replace(/,/g, '')),
        urgent,
        status:        'pending',
        queuePosition: pos,
        createdAt:     Timestamp.now(),
      });

      navigation.replace('RequestSuccess', {
        queuePosition: pos,
        sourceNetwork,
        destNetwork,
        amount: Number(amount.replace(/,/g, '')),
      });
    } catch (e) {
      setError('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const NetworkPicker = ({ label, selected, onSelect }) => (
    <View style={styles.pickerWrap}>
      <Text style={[styles.label, { color: theme.textDim }]}>{label}</Text>
      <View style={styles.networkGrid}>
        {NETWORKS.map(net => (
          <TouchableOpacity
            key={net}
            onPress={() => onSelect(net)}
            style={[
              styles.netBtn,
              {
                backgroundColor: selected === net
                  ? NETWORK_COLORS[net] + '20'
                  : theme.surfaceAlt,
                borderColor: selected === net
                  ? NETWORK_COLORS[net]
                  : theme.border,
              },
            ]}
            activeOpacity={0.75}
          >
            <View style={[
              styles.netColorDot,
              { backgroundColor: NETWORK_COLORS[net] },
            ]} />
            <Text style={[
              styles.netBtnText,
              {
                color: selected === net
                  ? NETWORK_COLORS[net]
                  : theme.text,
                fontWeight: selected === net ? '700' : '500',
              },
            ]}>
              {net}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#C8102E" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Request</Text>
        <Text style={styles.headerSub}>Submit a float transfer request</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Network pickers */}
          <NetworkPicker
            label="From Network"
            selected={sourceNetwork}
            onSelect={setSourceNetwork}
          />

          {sourceNetwork === destNetwork && destNetwork !== '' && (
            <Text style={styles.sameNetworkError}>
              Source and destination must be different
            </Text>
          )}

          <NetworkPicker
            label="To Network"
            selected={destNetwork}
            onSelect={setDestNetwork}
          />

          {/* Phones */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: theme.textDim }]}>Source Phone</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.surfaceAlt,
                borderColor:     theme.border,
                color:           theme.text,
              }]}
              value={sourcePhone}
              onChangeText={setSourcePhone}
              placeholder="07XX XXX XXX"
              placeholderTextColor={theme.muted}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: theme.textDim }]}>Destination Phone</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.surfaceAlt,
                borderColor:     theme.border,
                color:           theme.text,
              }]}
              value={destPhone}
              onChangeText={setDestPhone}
              placeholder="07XX XXX XXX"
              placeholderTextColor={theme.muted}
              keyboardType="phone-pad"
            />
          </View>

          {/* Amount */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: theme.textDim }]}>Amount (TZS)</Text>
            <View style={[styles.amountInput, {
              backgroundColor: theme.surfaceAlt,
              borderColor:     theme.border,
            }]}>
              <Text style={[styles.currency, { color: theme.textDim }]}>TZS</Text>
              <TextInput
                style={[styles.amountText, { color: theme.text }]}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0"
                placeholderTextColor={theme.muted}
                keyboardType="numeric"
              />
            </View>

            {/* Quick add buttons */}
            <View style={styles.quickRow}>
              {[10000, 50000, 100000, 500000].map(n => (
                <TouchableOpacity
                  key={n}
                  onPress={() => addQuick(n)}
                  style={[styles.quickBtn, {
                    backgroundColor: theme.surfaceAlt,
                    borderColor:     theme.border,
                  }]}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.quickBtnText, { color: theme.primary }]}>
                    +{n >= 1000 ? `${n/1000}k` : n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Urgent toggle */}
          <TouchableOpacity
            onPress={() => setUrgent(v => !v)}
            style={[styles.urgentRow, {
              backgroundColor: urgent ? '#F59E0B14' : theme.surfaceAlt,
              borderColor:     urgent ? '#F59E0B'   : theme.border,
            }]}
            activeOpacity={0.75}
          >
            <View>
              <Text style={[styles.urgentLabel, { color: theme.text }]}>
                Mark as Urgent
              </Text>
              <Text style={[styles.urgentSub, { color: theme.textDim }]}>
                Urgent requests are prioritized in the queue
              </Text>
            </View>
            <View style={[
              styles.toggle,
              { backgroundColor: urgent ? '#F59E0B' : theme.border },
            ]}>
              <View style={[
                styles.toggleKnob,
                { transform: [{ translateX: urgent ? 18 : 2 }] },
              ]} />
            </View>
          </TouchableOpacity>

          {/* Error */}
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          {/* Summary card */}
          {sourceNetwork && destNetwork && sourceNetwork !== destNetwork && amount ? (
            <View style={[styles.summary, {
              backgroundColor: theme.surfaceAlt,
              borderColor:     theme.border,
            }]}>
              <Text style={[styles.summaryTitle, { color: theme.text }]}>
                Summary
              </Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textDim }]}>Route</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>
                  {sourceNetwork} → {destNetwork}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textDim }]}>Amount</Text>
                <Text style={[styles.summaryValue, { color: theme.primary }]}>
                  TZS {amount}
                </Text>
              </View>
              {urgent && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textDim }]}>Priority</Text>
                  <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>URGENT</Text>
                </View>
              )}
            </View>
          ) : null}

          {/* Submit button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitBtn, { backgroundColor: theme.primary }]}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>Submit Request</Text>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: 16, paddingBottom: 100 },

  header: {
    backgroundColor:       '#C8102E',
    paddingHorizontal:     18,
    paddingTop:            10,
    paddingBottom:         14,
    borderBottomLeftRadius:  24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  pickerWrap: { marginTop: 16 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  networkGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
  },
  netBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    paddingHorizontal: 14,
    paddingVertical:   10,
    borderRadius:      12,
    borderWidth:       1.5,
  },
  netColorDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
  },
  netBtnText:       { fontSize: 14 },
  sameNetworkError: { color: '#C8102E', fontSize: 13, marginTop: 4 },

  fieldWrap: { marginTop: 16 },
  input: {
    height:            52,
    borderWidth:       1.5,
    borderRadius:      12,
    paddingHorizontal: 16,
    fontSize:          15,
  },
  amountInput: {
    flexDirection:     'row',
    alignItems:        'center',
    height:            52,
    borderWidth:       1.5,
    borderRadius:      12,
    paddingHorizontal: 16,
  },
  currency:    { fontSize: 15, marginRight: 8 },
  amountText:  { flex: 1, fontSize: 22, fontWeight: '700' },
  quickRow: {
    flexDirection: 'row',
    gap:           8,
    marginTop:     8,
  },
  quickBtn: {
    flex:           1,
    height:         34,
    borderRadius:   8,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  quickBtnText: { fontSize: 12, fontWeight: '700' },

  urgentRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        14,
    borderRadius:   12,
    borderWidth:    1.5,
    marginTop:      16,
  },
  urgentLabel: { fontSize: 14, fontWeight: '600' },
  urgentSub:   { fontSize: 12, marginTop: 2 },
  toggle: {
    width:        40,
    height:       24,
    borderRadius: 12,
    justifyContent:'center',
  },
  toggleKnob: {
    width:           20,
    height:          20,
    borderRadius:    10,
    backgroundColor: '#fff',
  },

  error: {
    color:     '#C8102E',
    fontSize:  13,
    textAlign: 'center',
    marginTop: 12,
  },

  summary: {
    borderRadius: 14,
    borderWidth:  1,
    padding:      14,
    marginTop:    16,
    gap:          8,
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  summaryRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontSize: 13, fontWeight: '600' },

  submitBtn: {
    height:         52,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      20,
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});