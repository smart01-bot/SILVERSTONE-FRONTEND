// src/screens/sub-agent/ProfileScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, ScrollView,
  TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Constants from 'expo-constants';

const NETWORK_COLORS = {
  Voda:    '#E40000',
  Yas:     '#0070B8',
  Airtel:  '#FF0000',
  Halotel: '#D4A017',
};

export default function ProfileScreen({ navigation }) {
  const { user, profile, logout } = useAuth();
  const { theme, isDark, setTheme, lang, setLang, tr } = useTheme();

  const [editing,   setEditing]   = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving,    setSaving]    = useState(false);

  const initials = profile?.name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'AG';

  const avatarColor = () => {
    const colors = ['#C8102E', '#0891B2', '#16A34A', '#7C3AED'];
    return colors[(profile?.name?.charCodeAt(0) ?? 0) % colors.length];
  };

  const startEdit = (field, value) => { setEditing(field); setEditValue(value ?? ''); };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'agents', user.uid), { [editing]: editValue.trim() });
      setEditing(null);
    } catch (e) {
      Alert.alert('Error', 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: tr('cancel'), style: 'cancel' },
      { text: tr('signOut'), style: 'destructive', onPress: logout },
    ]);
  };

  const EditableRow = ({ label, field, value }) => (
    <View style={[s.editRow, { borderBottomColor: theme.border }]}>
      <View style={s.editRowLeft}>
        <Text style={[s.editLabel, { color: theme.textDim }]}>{label}</Text>
        {editing === field ? (
          <TextInput
            style={[s.editInput, { color: theme.text }]}
            value={editValue}
            onChangeText={setEditValue}
            autoFocus
          />
        ) : (
          <Text style={[s.editValue, { color: theme.text }]}>{value ?? '—'}</Text>
        )}
      </View>
      {editing === field ? (
        <TouchableOpacity onPress={saveEdit} disabled={saving}>
          <Text style={[s.saveBtn, { color: theme.primary }]}>
            {saving ? tr('loading') : tr('save')}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => startEdit(field, value)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="pencil-outline" size={20} color={theme.textDim} />
        </TouchableOpacity>
      )}
    </View>
  );

  const MenuItem = ({ icon, label, onPress, danger }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[s.menuItem, { borderBottomColor: theme.border }]}
      activeOpacity={0.7}
    >
      <View style={[s.menuIcon, { backgroundColor: danger ? '#C8102E14' : theme.primaryLight }]}>
        <Ionicons name={icon} size={22} color={danger ? '#C8102E' : theme.primary} />
      </View>
      <Text style={[s.menuLabel, { color: danger ? '#C8102E' : theme.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={theme.muted} />
    </TouchableOpacity>
  );

  const ThemeRow = () => (
    <View style={[s.menuItem, { borderBottomColor: theme.border }]}>
      <View style={[s.menuIcon, { backgroundColor: theme.primaryLight }]}>
        <Ionicons name="contrast-outline" size={22} color={theme.primary} />
      </View>
      <Text style={[s.menuLabel, { color: theme.text }]}>{tr('darkMode')}</Text>
      <View style={s.pillRow}>
        <TouchableOpacity
          onPress={() => setTheme('light')}
          style={[s.pill, !isDark
            ? { backgroundColor: theme.primary, borderColor: theme.primary }
            : { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
          activeOpacity={0.8}
        >
          <Text style={[s.pillText, { color: !isDark ? '#fff' : theme.textDim }]}>
            {tr('light')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTheme('dark')}
          style={[s.pill, isDark
            ? { backgroundColor: theme.primary, borderColor: theme.primary }
            : { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
          activeOpacity={0.8}
        >
          <Text style={[s.pillText, { color: isDark ? '#fff' : theme.textDim }]}>
            {tr('dark')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const LangRow = () => {
    const isSw = lang === 'sw';
    return (
      <View style={[s.menuItem, { borderBottomColor: theme.border }]}>
        <View style={[s.menuIcon, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="language-outline" size={22} color={theme.primary} />
        </View>
        <Text style={[s.menuLabel, { color: theme.text }]}>{tr('language')}</Text>
        <View style={s.pillRow}>
          <TouchableOpacity
            onPress={() => setLang('en')}
            style={[s.pill, !isSw
              ? { backgroundColor: theme.primary, borderColor: theme.primary }
              : { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
            activeOpacity={0.8}
          >
            <Text style={[s.pillText, { color: !isSw ? '#fff' : theme.textDim }]}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLang('sw')}
            style={[s.pill, isSw
              ? { backgroundColor: theme.primary, borderColor: theme.primary }
              : { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
            activeOpacity={0.8}
          >
            <Text style={[s.pillText, { color: isSw ? '#fff' : theme.textDim }]}>SW</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      <View style={s.header}>
        <Text style={s.headerTitle}>{tr('profile')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        <View style={s.avatarSection}>
          <View style={[s.avatar, { backgroundColor: avatarColor() + '20' }]}>
            <Text style={[s.avatarText, { color: avatarColor() }]}>{initials}</Text>
          </View>
          <Text style={[s.name,  { color: theme.text }]}>{profile?.name ?? 'Agent'}</Text>
          <Text style={[s.email, { color: theme.textDim }]}>{user?.email ?? ''}</Text>
          {profile?.networks?.length > 0 && (
            <View style={s.chips}>
              {profile.networks.map(net => (
                <View key={net} style={[s.chip, {
                  backgroundColor: NETWORK_COLORS[net] + '14',
                  borderColor:     NETWORK_COLORS[net] + '40',
                }]}>
                  <Text style={[s.chipText, { color: NETWORK_COLORS[net] }]}>{net}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={[s.section, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Text style={[s.sectionTitle, { color: theme.textDim }]}>{tr('personalInfo').toUpperCase()}</Text>
          <EditableRow label={tr('fullName')} field="name"             value={profile?.name} />
          <EditableRow label={tr('phone')}    field="phone"            value={profile?.phone} />
          <EditableRow label={tr('location')} field="businessLocation" value={profile?.businessLocation} />
        </View>

        <View style={[s.section, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Text style={[s.sectionTitle, { color: theme.textDim }]}>{tr('settingsSection').toUpperCase()}</Text>
          <MenuItem icon="wifi-outline"        label={tr('myNetworks')} onPress={() => navigation.navigate('Networks')} />
          <ThemeRow />
          <MenuItem icon="lock-closed-outline" label={tr('changePin')}  onPress={() => {}} />
          <LangRow />
        </View>

        <View style={[s.section, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Text style={[s.sectionTitle, { color: theme.textDim }]}>{tr('support').toUpperCase()}</Text>
          <MenuItem icon="help-circle-outline"   label={tr('helpSupport')} onPress={() => {}} />
          <MenuItem icon="document-text-outline" label={tr('termsService')} onPress={() => {}} />
        </View>

        <View style={[s.section, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <MenuItem icon="log-out-outline" label={tr('signOut')} onPress={handleLogout} danger />
        </View>

        <Text style={[s.version, { color: theme.muted }]}>
          Silverstone v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingBottom: 110 },

  header: {
    backgroundColor:         '#C8102E',
    paddingHorizontal:       spacing.md + 2,
    paddingTop:              spacing.md - 4,
    paddingBottom:           spacing.md + 2,
    borderBottomLeftRadius:  radius.xxl,
    borderBottomRightRadius: radius.xxl,
  },
  headerTitle: { fontSize: 28, fontFamily: fonts.display, color: '#fff' },

  avatarSection: { alignItems: 'center', paddingTop: spacing.lg + 4, paddingBottom: spacing.md + 2 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md - 2,
  },
  avatarText: { fontSize: 34, fontFamily: fonts.display },
  name:       { fontSize: 24, fontFamily: fonts.heading },
  email:      { fontSize: 17, fontFamily: fonts.body, marginTop: spacing.xs + 1 },
  chips: {
    flexDirection: 'row', gap: spacing.sm - 1, marginTop: spacing.md - 2,
    flexWrap: 'wrap', justifyContent: 'center',
  },
  chip:     { paddingHorizontal: 13, paddingVertical: spacing.xs + 1, borderRadius: radius.sm, borderWidth: 1 },
  chipText: { fontSize: 15, fontFamily: fonts.bodySemi },

  section: {
    marginHorizontal: spacing.md,
    marginBottom:     spacing.md - 2,
    borderRadius:     radius.xl - 2,
    borderWidth:      1,
    overflow:         'hidden',
  },
  sectionTitle: {
    fontSize:          14,
    fontFamily:        fonts.bodyBold,
    letterSpacing:     0.8,
    paddingHorizontal: spacing.md + 2,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.sm + 2,
  },

  editRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: spacing.md + 2,
    paddingVertical:   spacing.md - 2,
    borderBottomWidth: 1,
  },
  editRowLeft: { flex: 1, marginRight: spacing.md - 2 },
  editLabel:   { fontSize: 15, fontFamily: fonts.body },
  editValue:   { fontSize: 19, fontFamily: fonts.bodyMed, marginTop: 3 },
  editInput:   { fontSize: 19, fontFamily: fonts.bodyMed, marginTop: 3 },
  saveBtn:     { fontSize: 17, fontFamily: fonts.bodyBold },

  menuItem: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing.md - 2,
    paddingHorizontal: spacing.md + 2,
    paddingVertical:   spacing.md,
    borderBottomWidth: 1,
  },
  menuIcon: {
    width: 44, height: 44, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 19, fontFamily: fonts.bodyMed },

  pillRow:  { flexDirection: 'row', gap: spacing.xs + 1 },
  pill: {
    paddingHorizontal: spacing.md - 2,
    paddingVertical:   spacing.xs + 2,
    borderRadius:      radius.md - 2,
    borderWidth:       1.5,
    minWidth:          48,
    alignItems:        'center',
  },
  pillText: { fontSize: 14, fontFamily: fonts.bodyBold, letterSpacing: 0.3 },

  version: { textAlign: 'center', fontSize: 15, fontFamily: fonts.body, paddingTop: spacing.sm + 2, paddingBottom: spacing.md + 2 },
});