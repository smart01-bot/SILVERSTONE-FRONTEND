// src/screens/sub-agent/ProfileScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, ScrollView,
  TextInput, Alert, Switch,
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
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
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
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => startEdit(field, value)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="pencil-outline" size={20} color={theme.textDim} />
        </TouchableOpacity>
      )}
    </View>
  );

  const MenuItem = ({ icon, label, onPress, danger, value, isSwitch }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[s.menuItem, { borderBottomColor: theme.border }]}
      activeOpacity={0.7}
    >
      <View style={[s.menuIcon, { backgroundColor: danger ? '#C8102E14' : theme.primaryLight }]}>
        <Ionicons name={icon} size={22} color={danger ? '#C8102E' : theme.primary} />
      </View>
      <Text style={[s.menuLabel, { color: danger ? '#C8102E' : theme.text }]}>{label}</Text>
      {isSwitch
        ? <Switch value={value} onValueChange={onPress} thumbColor="#fff"
            trackColor={{ true: theme.primary, false: theme.border }} />
        : <Ionicons name="chevron-forward" size={18} color={theme.muted} />
      }
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#C8102E" />

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
          <Text style={[s.sectionTitle, { color: theme.textDim }]}>PERSONAL INFO</Text>
          <EditableRow label="Full Name" field="name"             value={profile?.name} />
          <EditableRow label="Phone"     field="phone"            value={profile?.phone} />
          <EditableRow label="Location"  field="businessLocation" value={profile?.businessLocation} />
        </View>

        <View style={[s.section, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Text style={[s.sectionTitle, { color: theme.textDim }]}>SETTINGS</Text>
          <MenuItem icon="wifi-outline"        label="My Networks" onPress={() => navigation.navigate('Networks')} />
          <MenuItem icon="moon-outline"        label="Dark Mode"   isSwitch value={isDark} onPress={val => setTheme(val ? 'dark' : 'light')} />
          <MenuItem icon="lock-closed-outline" label="Change PIN"  onPress={() => {}} />
          <MenuItem
            icon="language-outline"
            label={lang === 'sw' ? 'Badilisha: English' : 'Switch to: Kiswahili'}
            isSwitch
            value={lang === 'en'}
            onPress={val => setLang(val ? 'en' : 'sw')}
          />
        </View>

        <View style={[s.section, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Text style={[s.sectionTitle, { color: theme.textDim }]}>SUPPORT</Text>
          <MenuItem icon="help-circle-outline"   label="Help & Support"   onPress={() => {}} />
          <MenuItem icon="document-text-outline" label="Terms of Service" onPress={() => {}} />
        </View>

        <View style={[s.section, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <MenuItem icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger />
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

  version: { textAlign: 'center', fontSize: 15, fontFamily: fonts.body, paddingTop: spacing.sm + 2, paddingBottom: spacing.md + 2 },
});
