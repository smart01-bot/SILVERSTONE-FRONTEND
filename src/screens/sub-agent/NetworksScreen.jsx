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
import { spacing, radius, fonts } from '../../constants/theme';
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
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{tr('volumeByNetwork')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={[s.desc, { color: theme.textDim }]}>
          {tr('sourceNetwork')} — {tr('destNetwork')}
        </Text>

        {NETWORKS.map(net => (
          <View
            key={net.name}
            style={[s.card, {
              backgroundColor: theme.surfaceAlt,
              borderColor:     active.includes(net.name) ? net.color + '60' : theme.border,
            }]}
          >
            <View style={s.cardHeader}>
              <View style={[s.netAvatar, { backgroundColor: net.color + '20' }]}>
                <Text style={[s.netShort, { color: net.color }]}>{net.short}</Text>
              </View>
              <View style={s.netInfo}>
                <Text style={[s.netName,   { color: theme.text }]}>{net.name}</Text>
                <Text style={[s.netWallet, { color: theme.textDim }]}>{net.wallet}</Text>
              </View>
              <Switch
                value={active.includes(net.name)}
                onValueChange={() => toggleNetwork(net.name)}
                thumbColor="#fff"
                trackColor={{ true: net.color, false: theme.border }}
              />
            </View>

            <View style={[s.phoneWrap, { borderTopColor: theme.border }]}>
              <Text style={[s.phoneLabel, { color: theme.textDim }]}>{tr('phone')}</Text>
              <TextInput
                style={[s.phoneInput, {
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
                <Text style={s.phoneError}>{tr('error')}</Text>
              )}
            </View>
          </View>
        ))}

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[s.saveBtn, { backgroundColor: saved ? '#16A34A' : theme.primary }]}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.saveBtnText}>{saved ? tr('save') + ' ✓' : tr('save')}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: 110 },

  header: {
    backgroundColor:         '#C8102E',
    paddingHorizontal:       spacing.md + 2,
    paddingTop:              spacing.md - 4,
    paddingBottom:           spacing.md + 2,
    flexDirection:           'row',
    alignItems:              'center',
    justifyContent:          'space-between',
    borderBottomLeftRadius:  radius.xxl,
    borderBottomRightRadius: radius.xxl,
  },
  backBtn:     { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 26, fontFamily: fonts.display, color: '#fff' },

  desc: { fontSize: 17, fontFamily: fonts.body, lineHeight: 26, marginBottom: spacing.md + 2 },

  card: { borderRadius: radius.xl - 2, borderWidth: 1.5, marginBottom: spacing.md - 2, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 2, padding: spacing.md },
  netAvatar: {
    width:          52,
    height:         52,
    borderRadius:   radius.md + 2,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  netShort:  { fontSize: 17, fontFamily: fonts.bodyXBold },
  netInfo:   { flex: 1 },
  netName:   { fontSize: 19, fontFamily: fonts.bodyBold },
  netWallet: { fontSize: 15, fontFamily: fonts.body, marginTop: 2 },

  phoneWrap:  { borderTopWidth: 1, padding: spacing.md },
  phoneLabel: { fontSize: 15, fontFamily: fonts.bodySemi, marginBottom: spacing.sm + 2 },
  phoneInput: {
    height:            54,
    borderWidth:       1.5,
    borderRadius:      radius.md,
    paddingHorizontal: spacing.md,
    fontSize:          19,
    fontFamily:        fonts.body,
  },
  phoneError: { color: '#C8102E', fontSize: 15, fontFamily: fonts.body, marginTop: spacing.xs + 1 },

  saveBtn: {
    height:         58,
    borderRadius:   radius.lg,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      spacing.sm,
  },
  saveBtnText: { color: '#fff', fontSize: 19, fontFamily: fonts.bodyBold },
});
