import { api } from '../../config/api';
// src/screens/sub-agent/NetworksScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, SafeAreaView,
  ScrollView, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLoader }      from '../../context/LoaderContext';
import { spacing, radius, fonts } from '../../constants/theme';
import { doc, updateDoc } from '../../api/screenData';
import { db } from '../../api/screenData';

const NETWORKS = [
  { name: 'Voda',    wallet: 'M-Pesa',       color: '#E40000', short: 'VOD' },
  { name: 'Yas',     wallet: 'Mixx',         color: '#0070B8', short: 'YAS' },
  { name: 'Airtel',  wallet: 'Airtel Money', color: '#FF0000', short: 'AIR' },
  { name: 'Halotel', wallet: 'Halopesa',     color: '#D4A017', short: 'HAL' },
];

export default function NetworksScreen({ navigation }) {
  const { user, profile } = useAuth();
  const { theme, isDark, tr } = useTheme();
  const { showLoader, hideLoader } = useLoader();

  const codes={Voda:'vodacom',Airtel:'airtel',Yas:'yas',Halotel:'halotel'};
  const [accounts,setAccounts]=useState([]);
  const [types,setTypes]=useState({});
  const [busy,setBusy]=useState(false);
  const [phones, setPhones] = useState({});
  const [active, setActive] = useState([]);
    const [saved,  setSaved]  = useState(false);

  useEffect(()=>{api.call('/me/accounts').then(setAccounts).catch(e=>Alert.alert('Accounts unavailable',e.message));},[user?.id]);

  const toggleNetwork = (name) => {
    setActive(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const validatePhone = value => !value || /^[A-Za-z0-9+_-]{1,64}$/.test(value);
  const handleSave=async()=>{
    if(busy)return;setBusy(true);showLoader();
    try {
      for(const net of NETWORKS.filter(n=>active.includes(n.name)&&phones[n.name])) {
        const body={networkCode:codes[net.name],identifierType:types[net.name]||'phone',identifier:phones[net.name].trim()};
        if(!accounts.some(a=>a.networkCode===body.networkCode&&a.identifierType===body.identifierType&&a.identifier===body.identifier)) await api.call('/me/accounts',{method:'POST',body,expectedOwner:user.id});
      }
      setAccounts(await api.call('/me/accounts'));setSaved(true);
      Alert.alert('Accounts saved','New accounts are unverified. Verification and provider execution remain unavailable.');
    }catch(e){Alert.alert('Unable to save',e.message);setAccounts(await api.call('/me/accounts').catch(()=>accounts));}
    finally{setBusy(false);hideLoader();}
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
          Saved network accounts. Adding an identifier does not verify it or activate payments.
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
              {accounts.filter(a=>a.networkCode===codes[net.name]).map(a=><Text key={a.id} style={{color:theme.textDim}}>{a.identifierType}: {a.identifier} · {a.verificationStatus}</Text>)}
              <Text style={[s.phoneLabel, { color: theme.textDim }]}>Add identifier</Text>
              <View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>{['phone','agent','till','account'].map(type=><TouchableOpacity key={type} onPress={()=>setTypes(v=>({...v,[net.name]:type}))}><Text style={{color:(types[net.name]||'phone')===type?theme.primary:theme.textDim}}>{type}</Text></TouchableOpacity>)}</View>
              <TextInput
                style={[s.phoneInput, {
                  backgroundColor: theme.bg,
                  borderColor: phones[net.name] && !validatePhone(phones[net.name]) ? '#C8102E' : theme.border,
                  color: theme.text,
                }]}
                value={phones[net.name] ?? ''}
                onChangeText={val => setPhones(p => ({ ...p, [net.name]: val }))}
                placeholder="Phone: +255… or typed account ID"
                placeholderTextColor={theme.muted}
                keyboardType="default"
              />
              {phones[net.name] && !validatePhone(phones[net.name]) && (
                <Text style={s.phoneError}>{tr('error')}</Text>
              )}
            </View>
          </View>
        ))}

        <TouchableOpacity
          onPress={handleSave}
          disabled={busy}
          
          style={[s.saveBtn, { backgroundColor: saved ? '#16A34A' : theme.primary }]}
          activeOpacity={0.85}
        >
          <Text style={s.saveBtnText}>{saved ? tr('save') + ' ✓' : tr('save')}</Text>
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