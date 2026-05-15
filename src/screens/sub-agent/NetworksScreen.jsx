// src/screens/sub-agent/NetworksScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  ScrollView, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const NETWORKS = [
  { name: 'Voda',    wallet: 'M-Pesa',       color: '#E40000', short: 'VOD' },
  { name: 'Yas',     wallet: 'Mixx',         color: '#0070B8', short: 'YAS' },
  { name: 'Airtel',  wallet: 'Airtel Money', color: '#FF0000', short: 'AIR' },
  { name: 'Halotel', wallet: 'Halopesa',     color: '#D4A017', short: 'HAL' },
];

export default function NetworksScreen({ navigation }) {
  const { user, profile } = useAuth();
  const { theme, isDark, tr } = useTheme();

  const [phones, setPhones] = useState({});
  const [active, setActive] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    if (profile) {
      setPhones(profile.agentPhoneNumbers ?? {});
      setActive(profile.networks ?? []);
    }
  }, [profile]);

  const toggleNetwork = (name) => {
    setActive(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const validatePhone = (phone) => {
    if (!phone) return true;
    return /^(07|06|\+2557|\+2556)\d{8}$/.test(phone.replace(/\s/g, ''));
  };

  const handleSave = async () => {
    for (const net of NETWORKS) {
      if (phones[net.name] && !validatePhone(phones[net.name])) {
        Alert.alert(tr('error'), `${tr('error')} ${net.name}`);
        return;
      }
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'agents', user.uid), {
        agentPhoneNumbers: phones,
        networks:          active,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      Alert.alert(tr('error'), tr('error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#C8102E" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr('volumeByNetwork')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.desc, { color: theme.textDim }]}>
          {tr('sourceNetwork')} — {tr('destNetwork')}
        </Text>

        {NETWORKS.map(net => (
          <View
            key={net.name}
            style={[styles.card, {
              backgroundColor: theme.surfaceAlt,
              borderColor:     active.includes(net.name) ? net.color + '60' : theme.border,
            }]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.netAvatar, { backgroundColor: net.color + '20' }]}>
                <Text style={[styles.netShort, { color: net.color }]}>{net.short}</Text>
              </View>
              <View style={styles.netInfo}>
                <Text style={[styles.netName,   { color: theme.text }]}>{net.name}</Text>
                <Text style={[styles.netWallet, { color: theme.textDim }]}>{net.wallet}</Text>
              </View>
              <Switch
                value={active.includes(net.name)}
                onValueChange={() => toggleNetwork(net.name)}
                thumbColor="#fff"
                trackColor={{ true: net.color, false: theme.border }}
              />
            </View>

            <View style={[styles.phoneWrap, { borderTopColor: theme.border }]}>
              <Text style={[styles.phoneLabel, { color: theme.textDim }]}>{tr('phone')}</Text>
              <TextInput
                style={[styles.phoneInput, {
                  backgroundColor: theme.bg,
                  borderColor: phones[net.name] && !validatePhone(phones[net.name]) ? '#C8102E' : theme.border,
                  color: theme.text,
                }]}
                value={phones[net.name] ?? ''}
                onChangeText={val => setPhones(p => ({ ...p, [net.name]: val }))}
                placeholder="07XX XXX XXX"
                placeholderTextColor={theme.muted}
                keyboardType="phone-pad"
              />
              {phones[net.name] && !validatePhone(phones[net.name]) && (
                <Text style={styles.phoneError}>{tr('error')}</Text>
              )}
            </View>
          </View>
        ))}

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, { backgroundColor: saved ? '#16A34A' : theme.primary }]}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>
                {saved ? tr('save') + ' ✓' : tr('save')}
              </Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: 16, paddingBottom: 110 },

  header: {
    backgroundColor:         '#C8102E',
    paddingHorizontal:       18,
    paddingTop:              12,
    paddingBottom:           18,
    flexDirection:           'row',
    alignItems:              'center',
    justifyContent:          'space-between',
    borderBottomLeftRadius:  26,
    borderBottomRightRadius: 26,
  },
  backBtn:     { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },   // was 18

  desc: { fontSize: 17, lineHeight: 26, marginBottom: 18 },   // was 14

  card: { borderRadius: 18, borderWidth: 1.5, marginBottom: 14, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  netAvatar: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  netShort:  { fontSize: 16, fontWeight: '800' },  // was 13
  netInfo:   { flex: 1 },
  netName:   { fontSize: 19, fontWeight: '700' },  // was 15
  netWallet: { fontSize: 15, marginTop: 2 },        // was 12

  phoneWrap:  { borderTopWidth: 1, padding: 16 },
  phoneLabel: { fontSize: 15, fontWeight: '600', marginBottom: 10 },  // was 12
  phoneInput: {
    height: 54, borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 16, fontSize: 19,             // was 15
  },
  phoneError: { color: '#C8102E', fontSize: 15, marginTop: 5 },  // was 12

  saveBtn: {
    height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 19, fontWeight: '700' },  // was 15
});
