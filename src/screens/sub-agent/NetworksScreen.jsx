import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useLoader } from '../../context/LoaderContext';
import { fonts } from '../../constants/theme';
import { AgentScroll, AgentButton, useAgentUI } from '../../components/agent/AgentUI';

const NETWORKS = [
  { name: 'Voda', wallet: 'M-Pesa' },
  { name: 'Yas', wallet: 'Mixx' },
  { name: 'Airtel', wallet: 'Airtel Money' },
  { name: 'Halotel', wallet: 'Halopesa' },
];
const CODES = { Voda: 'vodacom', Airtel: 'airtel', Yas: 'yas', Halotel: 'halotel' };

export default function NetworksScreen({ navigation }) {
  const { user } = useAuth();
  const { colors, copy } = useAgentUI();
  const { showLoader, hideLoader } = useLoader();
  const [accounts, setAccounts] = useState([]);
  const [types, setTypes] = useState({});
  const [busy, setBusy] = useState(false);
  const [phones, setPhones] = useState({});
  const [active, setActive] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.call('/me/accounts').then(setAccounts).catch(error => Alert.alert('Accounts unavailable', error.message));
  }, [user?.id]);

  const toggleNetwork = name => {
    setActive(previous => previous.includes(name) ? previous.filter(item => item !== name) : [...previous, name]);
  };

  const validatePhone = value => !value || /^[A-Za-z0-9+_-]{1,64}$/.test(value);

  const handleSave = async () => {
    if (busy) return;
    setBusy(true);
    showLoader();
    try {
      for (const net of NETWORKS.filter(item => active.includes(item.name) && phones[item.name])) {
        const body = {
          networkCode: CODES[net.name],
          identifierType: types[net.name] || 'phone',
          identifier: phones[net.name].trim(),
        };
        if (!accounts.some(account => account.networkCode === body.networkCode && account.identifierType === body.identifierType && account.identifier === body.identifier)) {
          await api.call('/me/accounts', { method: 'POST', body, expectedOwner: user.id });
        }
      }
      setAccounts(await api.call('/me/accounts'));
      setSaved(true);
      Alert.alert('Accounts saved', 'New accounts are unverified. Verification and provider execution remain unavailable.');
    } catch (error) {
      Alert.alert('Unable to save', error.message);
      setAccounts(await api.call('/me/accounts').catch(() => accounts));
    } finally {
      setBusy(false);
      hideLoader();
    }
  };

  const identifierLabel = type => ({
    phone: copy('Phone', 'Simu'), agent: copy('Agent', 'Wakala'), till: copy('Till', 'Lipa'), account: copy('Account', 'Akaunti'),
  }[type] || type);

  const verificationLabel = status => ({
    unverified: copy('Unverified', 'Haijathibitishwa'),
    verified: copy('Verified', 'Imethibitishwa'),
    pending: copy('Pending verification', 'Inasubiri uthibitisho'),
    rejected: copy('Verification rejected', 'Uthibitisho umekataliwa'),
  }[status] || status);

  return (
    <AgentScroll keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.back} accessibilityRole="button" accessibilityLabel={copy('Back to Profile', 'Rudi kwenye Wasifu')}>
        <Ionicons name="arrow-back" size={20} color={colors.text} />
        <Text style={[s.backLabel, { color: colors.text }]}>{copy('Profile', 'Wasifu')}</Text>
      </TouchableOpacity>
      <Text style={[s.title, { color: colors.text }]}>{copy('Network accounts', 'Akaunti za mitandao')}</Text>
      <Text style={[s.description, { color: colors.secondary }]}>
        {copy('Saved network accounts. Adding an identifier does not verify it or activate payments.', 'Akaunti za mitandao zilizohifadhiwa. Kuongeza kitambulisho hakukithibitishi wala kuwezesha malipo.')}
      </Text>

      {NETWORKS.map(net => {
        const expanded = active.includes(net.name);
        const networkAccounts = accounts.filter(account => account.networkCode === CODES[net.name]);
        const invalid = !!phones[net.name] && !validatePhone(phones[net.name]);
        return (
          <View key={net.name} style={[s.network, { borderBottomColor: colors.border }]}>
            <View style={s.networkHeading}>
              <View style={s.networkName}>
                <Text style={[s.wallet, { color: colors.text }]}>{net.wallet}</Text>
                <Text style={[s.provider, { color: colors.secondary }]}>{net.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleNetwork(net.name)}
                style={s.addButton}
                disabled={busy}
                accessibilityRole="button"
                accessibilityState={{ expanded, disabled: busy }}
                accessibilityLabel={expanded ? copy(`Close ${net.wallet} account form`, `Funga fomu ya akaunti ya ${net.wallet}`) : copy(`Add ${net.wallet} account`, `Ongeza akaunti ya ${net.wallet}`)}
              >
                <Ionicons name={expanded ? 'close-outline' : 'add-outline'} size={20} color={colors.text} />
                <Text style={[s.addLabel, { color: colors.text }]}>{expanded ? copy('Close', 'Funga') : copy('Add', 'Ongeza')}</Text>
              </TouchableOpacity>
            </View>

            {networkAccounts.length ? networkAccounts.map(account => (
              <View key={account.id} style={s.accountRow}>
                <Text selectable style={[s.identifier, { color: colors.text }]}>{account.identifier}</Text>
                <Text style={[s.accountMeta, { color: colors.secondary }]}>
                  {identifierLabel(account.identifierType)} · {verificationLabel(account.verificationStatus)}
                </Text>
              </View>
            )) : <Text style={[s.empty, { color: colors.secondary }]}>{copy('No saved accounts', 'Hakuna akaunti zilizohifadhiwa')}</Text>}

            {expanded && (
              <View style={s.form}>
                <Text style={[s.fieldLabel, { color: colors.secondary }]}>{copy('Add identifier', 'Ongeza kitambulisho')}</Text>
                <View style={s.types}>
                  {['phone', 'agent', 'till', 'account'].map(type => {
                    const selected = (types[net.name] || 'phone') === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => { setTypes(value => ({ ...value, [net.name]: type })); setSaved(false); }}
                        disabled={busy}
                        style={[s.type, { borderBottomColor: selected ? colors.text : 'transparent' }]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected, disabled: busy }}
                      >
                        <Text style={[s.typeText, { color: selected ? colors.text : colors.secondary }]}>{identifierLabel(type)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TextInput
                  style={[s.input, { color: colors.text, borderBottomColor: invalid ? colors.danger : colors.strongBorder }]}
                  value={phones[net.name] || ''}
                  onChangeText={value => { setPhones(previous => ({ ...previous, [net.name]: value })); setSaved(false); }}
                  placeholder={copy('Phone: +255… or typed account ID', 'Simu: +255… au kitambulisho cha akaunti')}
                  placeholderTextColor={colors.muted}
                  selectionColor={colors.text}
                  keyboardType="default"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!busy}
                  accessibilityLabel={`${net.wallet} ${identifierLabel(types[net.name] || 'phone')}`}
                />
                {invalid && (
                  <Text style={[s.error, { color: colors.danger }]}>
                    {copy('Use 1–64 letters, numbers, +, _ or -.', 'Tumia herufi, tarakimu, +, _ au -; urefu wa alama 1–64.')}
                  </Text>
                )}
              </View>
            )}
          </View>
        );
      })}

      <View style={s.save}>
        <AgentButton label={saved ? copy('Accounts saved', 'Akaunti zimehifadhiwa') : copy('Save accounts', 'Hifadhi akaunti')} onPress={handleSave} disabled={busy} busy={busy} icon={saved ? 'checkmark-outline' : 'arrow-forward'} />
      </View>
      <Text style={[s.note, { color: colors.secondary }]}>
        {copy('New accounts are unverified. Verification and provider execution remain unavailable.', 'Akaunti mpya hazijathibitishwa. Uthibitisho na utekelezaji wa malipo kwa watoa huduma bado havipatikani.')}
      </Text>
    </AgentScroll>
  );
}

const s = StyleSheet.create({
  back: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 8, paddingRight: 16 },
  backLabel: { fontSize: 14, fontFamily: fonts.body },
  title: { fontSize: 25, lineHeight: 33, fontFamily: fonts.heading, marginTop: 10 },
  description: { fontSize: 14, lineHeight: 22, fontFamily: fonts.body, marginTop: 10, marginBottom: 12 },
  network: { paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth },
  networkHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  networkName: { flex: 1, gap: 2 },
  wallet: { fontSize: 17, lineHeight: 24, fontFamily: fonts.bodySemi },
  provider: { fontSize: 13, lineHeight: 19, fontFamily: fonts.body },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, minWidth: 64, minHeight: 44 },
  addLabel: { fontSize: 13, fontFamily: fonts.bodySemi },
  accountRow: { marginTop: 12, gap: 3 },
  identifier: { fontSize: 15, lineHeight: 22, fontFamily: fonts.body },
  accountMeta: { fontSize: 12, lineHeight: 18, fontFamily: fonts.body },
  empty: { fontSize: 13, lineHeight: 20, fontFamily: fonts.body, marginTop: 10 },
  form: { paddingTop: 22 },
  fieldLabel: { fontSize: 13, fontFamily: fonts.body },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 2, marginBottom: 9 },
  type: { minHeight: 44, paddingHorizontal: 2, justifyContent: 'center', borderBottomWidth: 1.5 },
  typeText: { fontSize: 13, fontFamily: fonts.bodySemi },
  input: { minHeight: 54, paddingVertical: 12, fontSize: 15, fontFamily: fonts.body, borderBottomWidth: 1 },
  error: { marginTop: 8, fontSize: 12, lineHeight: 18, fontFamily: fonts.body },
  save: { marginTop: 28 },
  note: { marginTop: 15, fontSize: 12, lineHeight: 19, fontFamily: fonts.body },
});
