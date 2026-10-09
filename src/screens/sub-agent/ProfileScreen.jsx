import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { fonts } from '../../constants/theme';
import { db, doc, updateDoc } from '../../api/screenData';
import {
  AgentScroll, AgentButton, AgentSheet, AgentRow, useAgentUI,
} from '../../components/agent/AgentUI';

const providedText = value => typeof value === 'string' && value.trim() ? value.trim() : null;

export default function ProfileScreen({ navigation }) {
  const { user, profile, lockSession } = useAuth();
  const { userPreference, setTheme, setLang } = useTheme();
  const { colors, lang, copy } = useAgentUI();
  const [sheet, setSheet] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmedName, setConfirmedName] = useState(profile?.name);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setConfirmedName(profile?.name); }, [profile?.name, user?.id]);

  const name = providedText(confirmedName) || copy('Agent', 'Wakala');
  const initials = name.split(/\s+/).map(part => part[0]).join('').toUpperCase().slice(0, 2);
  // These values must come from explicit profile fields, never a generated ID or sample.
  const agency = providedText(profile?.businessName);
  const agentNumber = providedText(profile?.agentNumber);
  const appearance = userPreference === 'dark' ? copy('Dark', 'Giza')
    : userPreference === 'light' ? copy('Light', 'Mwanga') : copy('System', 'Mfumo');

  const closeSheet = () => {
    if (saving) return;
    setSheet(null);
    setEditing(false);
  };

  const saveName = async () => {
    if (!editing || saving) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'agents', user.id), { name: editValue.trim() });
      setConfirmedName(editValue.trim());
      setEditing(false);
    } catch (error) {
      Alert.alert(copy('Error', 'Hitilafu'), copy('Failed to save changes.', 'Imeshindikana kuhifadhi mabadiliko.'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(copy('Sign out', 'Ondoka'), copy('Return to your PIN screen?', 'Rudi kwenye skrini ya PIN?'), [
      { text: copy('Cancel', 'Ghairi'), style: 'cancel' },
      { text: copy('Sign out', 'Ondoka'), style: 'destructive', onPress: lockSession },
    ]);
  };

  const copyAgentNumber = async () => {
    if (!agentNumber) return;
    try {
      await Clipboard.setStringAsync(agentNumber);
      setCopied(true);
    } catch (error) {
      Alert.alert(copy('Unable to copy', 'Imeshindikana kunakili'), copy('Please try again.', 'Tafadhali jaribu tena.'));
    }
  };

  const chooseAppearance = async preference => {
    try {
      await setTheme(preference);
      setSheet(null);
    } catch (error) {
      Alert.alert(copy('Unable to save appearance', 'Imeshindikana kuhifadhi mwonekano'), copy('Please try again.', 'Tafadhali jaribu tena.'));
    }
  };

  const chooseLanguage = async language => {
    try {
      await setLang(language);
      setSheet(null);
    } catch (error) {
      Alert.alert(copy('Unable to save language', 'Imeshindikana kuhifadhi lugha'), copy('Please try again.', 'Tafadhali jaribu tena.'));
    }
  };

  return (
    <>
      <AgentScroll>
        <View style={s.identity}>
          <View style={[s.avatar, { backgroundColor: colors.surface }]}>
            <Text style={[s.initials, { color: colors.text }]}>{initials}</Text>
          </View>
          <View style={s.identityText}>
            <Text style={[s.name, { color: colors.text }]}>{name}</Text>
            <Text style={[s.agency, { color: colors.secondary }]}>
              {agency || copy('Agency not provided', 'Jina la uwakala halijatolewa')}
            </Text>
          </View>
        </View>

        <View style={[s.numberRow, { borderBottomColor: colors.border }]}>
          <Text style={[s.numberLabel, { color: colors.secondary }]}>{copy('Agent number', 'Namba ya wakala')}</Text>
          <Text selectable style={[s.numberValue, { color: agentNumber ? colors.text : colors.secondary }]}>
            {agentNumber || copy('Not assigned', 'Haijatolewa')}
          </Text>
          {agentNumber && (
            <TouchableOpacity
              onPress={copyAgentNumber}
              style={s.copyButton}
              accessibilityRole="button"
              accessibilityLabel={copied ? copy('Agent number copied', 'Namba ya wakala imenakiliwa') : copy('Copy agent number', 'Nakili namba ya wakala')}
            >
              <Ionicons name={copied ? 'checkmark-outline' : 'copy-outline'} size={20} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>

        <AgentRow icon="person-outline" label={copy('Personal details', 'Taarifa binafsi')} onPress={() => setSheet('personal')} />
        <AgentRow icon="swap-horizontal-outline" label={copy('Network accounts', 'Akaunti za mitandao')} onPress={() => navigation.navigate('Networks')} />
        <AgentRow icon="sunny-outline" label={copy('Appearance', 'Mwonekano')} value={appearance} onPress={() => setSheet('appearance')} />
        <AgentRow icon="globe-outline" label={copy('Language', 'Lugha')} value={lang === 'sw' ? 'Kiswahili' : 'English'} onPress={() => setSheet('language')} />

        <TouchableOpacity onPress={handleLogout} style={s.signOut} accessibilityRole="button">
          <Ionicons name="log-out-outline" size={23} color={colors.text} />
          <Text style={[s.rowLabel, { color: colors.text }]}>{copy('Sign out', 'Ondoka')}</Text>
        </TouchableOpacity>
      </AgentScroll>

      <AgentSheet visible={sheet === 'personal'} onClose={closeSheet} title={copy('Personal details', 'Taarifa binafsi')}>
        <View style={[s.detailRow, { borderBottomColor: colors.border }]}>
          <View style={s.detailContent}>
            <Text style={[s.detailLabel, { color: colors.secondary }]}>{copy('Full name', 'Jina kamili')}</Text>
            {editing ? (
              <TextInput
                value={editValue}
                onChangeText={setEditValue}
                autoFocus
                editable={!saving}
                autoCapitalize="words"
                accessibilityLabel={copy('Full name', 'Jina kamili')}
                selectionColor={colors.text}
                style={[s.nameInput, { color: colors.text, borderBottomColor: colors.strongBorder }]}
              />
            ) : <Text style={[s.detailValue, { color: colors.text }]}>{name}</Text>}
          </View>
          {!editing && (
            <TouchableOpacity
              style={s.copyButton}
              accessibilityRole="button"
              accessibilityLabel={copy('Edit full name', 'Badili jina kamili')}
              onPress={() => { setEditValue(confirmedName || ''); setEditing(true); }}
            >
              <Ionicons name="pencil-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
        {editing && (
          <View style={s.editActions}>
            <AgentButton label={copy('Save name', 'Hifadhi jina')} onPress={saveName} busy={saving} disabled={saving} icon="checkmark-outline" />
            <AgentButton label={copy('Cancel', 'Ghairi')} onPress={() => setEditing(false)} disabled={saving} variant="text" icon="close-outline" />
          </View>
        )}
        {[
          [copy('Email', 'Barua pepe'), user?.email],
          [copy('Phone number', 'Namba ya simu'), profile?.phone],
          [copy('Business location', 'Eneo la biashara'), profile?.businessLocation],
        ].map(([label, value]) => (
          <View key={label} style={[s.detailRow, { borderBottomColor: colors.border }]}>
            <View style={s.detailContent}>
              <Text style={[s.detailLabel, { color: colors.secondary }]}>{label}</Text>
              <Text selectable style={[s.detailValue, { color: colors.text }]}>{value || '—'}</Text>
            </View>
            <Ionicons name="lock-closed-outline" size={16} color={colors.muted} accessibilityLabel={copy('Read only', 'Haiwezi kubadilishwa')} />
          </View>
        ))}
        <Text style={[s.note, { color: colors.secondary }]}>
          {copy('Contact details and business location cannot be edited here yet.', 'Taarifa za mawasiliano na eneo la biashara haziwezi kubadilishwa hapa kwa sasa.')}
        </Text>
      </AgentSheet>

      <AgentSheet visible={sheet === 'appearance'} onClose={closeSheet} title={copy('Appearance', 'Mwonekano')}>
        {[
          ['auto', copy('System', 'Mfumo'), 'phone-portrait-outline'],
          ['light', copy('Light', 'Mwanga'), 'sunny-outline'],
          ['dark', copy('Dark', 'Giza'), 'moon-outline'],
        ].map(([value, label, icon]) => (
          <AgentRow key={value} icon={icon} label={label} value={(userPreference || 'auto') === value ? copy('Selected', 'Imechaguliwa') : undefined} onPress={() => chooseAppearance(value)} />
        ))}
        <Text style={[s.note, { color: colors.secondary }]}>{copy('System follows your device appearance.', 'Mfumo hufuata mwonekano wa kifaa chako.')}</Text>
      </AgentSheet>

      <AgentSheet visible={sheet === 'language'} onClose={closeSheet} title={copy('Language', 'Lugha')}>
        <AgentRow label="English" value={lang === 'en' ? copy('Selected', 'Imechaguliwa') : undefined} onPress={() => chooseLanguage('en')} />
        <AgentRow label="Kiswahili" value={lang === 'sw' ? copy('Selected', 'Imechaguliwa') : undefined} onPress={() => chooseLanguage('sw')} />
      </AgentSheet>
    </>
  );
}

const s = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 10, paddingBottom: 20 },
  avatar: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 21, fontFamily: fonts.bodySemi },
  identityText: { flex: 1, gap: 4 },
  name: { fontSize: 19, lineHeight: 26, fontFamily: fonts.bodySemi },
  agency: { fontSize: 14, lineHeight: 21, fontFamily: fonts.body },
  numberRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, minHeight: 58, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  numberLabel: { flexGrow: 1, fontSize: 13, lineHeight: 20, fontFamily: fonts.body },
  numberValue: { flexShrink: 1, fontSize: 13, lineHeight: 20, fontFamily: fonts.body },
  copyButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  signOut: { minHeight: 62, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 10 },
  rowLabel: { fontSize: 15, fontFamily: fonts.body },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 80, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  detailContent: { flex: 1, gap: 5 },
  detailLabel: { fontSize: 13, lineHeight: 19, fontFamily: fonts.body },
  detailValue: { fontSize: 16, lineHeight: 23, fontFamily: fonts.body },
  nameInput: { minHeight: 44, fontSize: 17, fontFamily: fonts.body, paddingVertical: 7, borderBottomWidth: 1 },
  editActions: { gap: 6, marginTop: 16 },
  note: { fontSize: 13, lineHeight: 20, fontFamily: fonts.body, paddingTop: 18 },
});
