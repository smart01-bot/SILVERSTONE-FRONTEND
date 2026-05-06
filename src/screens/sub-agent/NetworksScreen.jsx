import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Switch, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { updateAgentNetworks } from '../../utils/firestore';
import { validatePhone } from '../../utils/validation';
import { NETWORKS, NETWORK_COLORS, NETWORK_WALLETS } from '../../constants/networks';

export default function NetworksScreen({ navigation }) {
  const { user, profile } = useAuth();
  const { theme, tr } = useTheme();
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Local state: { Voda: { active: bool, phone: string }, ... }
  const [nets, setNets] = useState(() => {
    const init = {};
    NETWORKS.forEach(n => {
      init[n] = {
        active: profile?.networks?.includes(n) ?? false,
        phone:  profile?.agentPhoneNumbers?.[n] ?? '',
      };
    });
    return init;
  });

  const setNet = (network, key, value) => {
    setNets(prev => ({ ...prev, [network]: { ...prev[network], [key]: value } }));
    if (key === 'phone' && fieldErrors[network]) {
      setFieldErrors(e => { const n = { ...e }; delete n[network]; return n; });
    }
  };

  const validate = () => {
    const errs = {};
    NETWORKS.forEach(n => {
      if (nets[n].active) {
        const result = validatePhone(nets[n].phone);
        if (!result.valid) errs[n] = result.message;
      }
    });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const activeNetworks = NETWORKS.filter(n => nets[n].active);
      const phoneNumbers   = {};
      NETWORKS.forEach(n => { if (nets[n].phone.trim()) phoneNumbers[n] = nets[n].phone.trim(); });
      await updateAgentNetworks(user.uid, activeNetworks, phoneNumbers);
      Alert.alert('Saved', 'Your network details have been updated.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message ?? 'Could not save networks.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backArrow, { color: theme.primary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>My Networks</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={[styles.subtitle, { color: theme.textDim }]}>
          Activate the networks you operate on and enter your wallet phone numbers.
        </Text>

        {NETWORKS.map(network => {
          const color = NETWORK_COLORS[network];
          const active = nets[network].active;
          return (
            <View key={network} style={[styles.networkCard, {
              backgroundColor: theme.surface,
              borderColor: active ? color + '60' : theme.border,
              borderLeftColor: color,
              borderLeftWidth: 4,
              ...theme.shadow,
            }]}>
              {/* Network header row */}
              <View style={styles.netHeader}>
                <View style={styles.netInfo}>
                  <View style={[styles.netDot, { backgroundColor: color }]} />
                  <View>
                    <Text style={[styles.netName, { color: theme.text }]}>{network}</Text>
                    <Text style={[styles.netWallet, { color: theme.textDim }]}>{NETWORK_WALLETS[network]}</Text>
                  </View>
                </View>
                <Switch
                  value={active}
                  onValueChange={v => setNet(network, 'active', v)}
                  trackColor={{ true: color, false: theme.border }}
                  thumbColor="#fff"
                />
              </View>

              {/* Phone input — shown when active */}
              {active && (
                <View style={styles.phoneWrap}>
                  <Text style={[styles.phoneLabel, { color: theme.textDim }]}>
                    {NETWORK_WALLETS[network]} phone number
                  </Text>
                  <TextInput
                    style={[
                      styles.phoneInput,
                      {
                        backgroundColor: theme.surfaceAlt,
                        borderColor: fieldErrors[network] ? '#DC2626' : theme.border,
                        color: theme.text,
                      },
                    ]}
                    value={nets[network].phone}
                    onChangeText={v => setNet(network, 'phone', v)}
                    placeholder="e.g. 0754123456"
                    placeholderTextColor={theme.muted}
                    keyboardType="phone-pad"
                  />
                  {fieldErrors[network] ? (
                    <Text style={styles.fieldError}>{fieldErrors[network]}</Text>
                  ) : null}
                </View>
              )}
            </View>
          );
        })}

      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TouchableOpacity
          onPress={save}
          disabled={saving}
          style={[styles.saveBtn, { backgroundColor: theme.primary }]}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save Networks</Text>
          }
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, alignItems: 'flex-start' },
  backArrow: { fontSize: 32, fontWeight: '300', lineHeight: 34 },
  title:   { fontSize: 20, fontWeight: '800' },
  scroll:  { padding: 16, gap: 12, paddingBottom: 120 },
  subtitle:{ fontSize: 13, lineHeight: 20, marginBottom: 4 },

  networkCard: {
    borderRadius: 16, borderWidth: 1, padding: 14, gap: 10,
  },
  netHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netInfo:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  netDot:    { width: 12, height: 12, borderRadius: 6 },
  netName:   { fontSize: 16, fontWeight: '700' },
  netWallet: { fontSize: 12, marginTop: 1 },

  phoneWrap:  { gap: 6 },
  phoneLabel: { fontSize: 12, fontWeight: '500' },
  phoneInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  fieldError: { color: '#DC2626', fontSize: 12 },

  footer:  { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  saveBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
