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
    <View style={[styles.editRow, { borderBottomColor: theme.border }]}>
      <View style={styles.editRowLeft}>
        <Text style={[styles.editLabel, { color: theme.textDim }]}>{label}</Text>
        {editing === field ? (
          <TextInput
            style={[styles.editInput, { color: theme.text }]}
            value={editValue}
            onChangeText={setEditValue}
            autoFocus
          />
        ) : (
          <Text style={[styles.editValue, { color: theme.text }]}>{value ?? '—'}</Text>
        )}
      </View>
      {editing === field ? (
        <TouchableOpacity onPress={saveEdit} disabled={saving}>
          <Text style={[styles.saveBtn, { color: theme.primary }]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => startEdit(field, value)}>
          <Ionicons name="pencil-outline" size={20} color={theme.textDim} />
        </TouchableOpacity>
      )}
    </View>
  );

  const MenuItem = ({ icon, label, onPress, danger, value, isSwitch }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.menuItem, { borderBottomColor: theme.border }]}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? '#C8102E14' : theme.primaryLight }]}>
        <Ionicons name={icon} size={22} color={danger ? '#C8102E' : theme.primary} />
      </View>
      <Text style={[styles.menuLabel, { color: danger ? '#C8102E' : theme.text }]}>
        {label}
      </Text>
      {isSwitch
        ? <Switch value={value} onValueChange={onPress} thumbColor="#fff"
            trackColor={{ true: theme.primary, false: theme.border }} />
        : <Ionicons name="chevron-forward" size={18} color={theme.muted} />
      }
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#C8102E" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{tr('profile')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: avatarColor() + '20' }]}>
            <Text style={[styles.avatarText, { color: avatarColor() }]}>{initials}</Text>
          </View>
          <Text style={[styles.name,  { color: theme.text }]}>{profile?.name ?? 'Agent'}</Text>
          <Text style={[styles.email, { color: theme.textDim }]}>{user?.email ?? ''}</Text>
          {profile?.networks?.length > 0 && (
            <View style={styles.chips}>
              {profile.networks.map(net => (
                <View key={net} style={[styles.chip, {
                  backgroundColor: NETWORK_COLORS[net] + '14',
                  borderColor:     NETWORK_COLORS[net] + '40',
                }]}>
                  <Text style={[styles.chipText, { color: NETWORK_COLORS[net] }]}>{net}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Personal info */}
        <View style={[styles.section, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textDim }]}>PERSONAL INFO</Text>
          <EditableRow label="Full Name" field="name"             value={profile?.name} />
          <EditableRow label="Phone"     field="phone"            value={profile?.phone} />
          <EditableRow label="Location"  field="businessLocation" value={profile?.businessLocation} />
        </View>

        {/* Settings */}
        <View style={[styles.section, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textDim }]}>SETTINGS</Text>
          <MenuItem icon="wifi-outline"        label="My Networks"  onPress={() => navigation.navigate('Networks')} />
          <MenuItem icon="moon-outline"        label="Dark Mode"    isSwitch value={isDark} onPress={val => setTheme(val ? 'dark' : 'light')} />
          <MenuItem icon="lock-closed-outline" label="Change PIN"   onPress={() => {}} />
          <MenuItem
            icon="language-outline"
            label={lang === 'sw' ? 'Badilisha: English' : 'Switch to: Kiswahili'}
            isSwitch
            value={lang === 'en'}
            onPress={val => setLang(val ? 'en' : 'sw')}
          />
        </View>

        {/* Support */}
        <View style={[styles.section, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textDim }]}>SUPPORT</Text>
          <MenuItem icon="help-circle-outline"    label="Help & Support"   onPress={() => {}} />
          <MenuItem icon="document-text-outline"  label="Terms of Service" onPress={() => {}} />
        </View>

        <View style={[styles.section, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <MenuItem icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger />
        </View>

        <Text style={[styles.version, { color: theme.muted }]}>
          Silverstone v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingBottom: 110 },

  header: {
    backgroundColor:         '#C8102E',
    paddingHorizontal:       18,
    paddingTop:              12,
    paddingBottom:           18,
    borderBottomLeftRadius:  26,
    borderBottomRightRadius: 26,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },   // was 20

  avatarSection: { alignItems: 'center', paddingTop: 28, paddingBottom: 18 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  avatarText: { fontSize: 34, fontWeight: '800' },   // was 26
  name:       { fontSize: 24, fontWeight: '800' },   // was 18
  email:      { fontSize: 17, marginTop: 5 },         // was 13
  chips: {
    flexDirection: 'row', gap: 7, marginTop: 14,
    flexWrap: 'wrap', justifyContent: 'center',
  },
  chip: { paddingHorizontal: 13, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 15, fontWeight: '600' },   // was 12

  section: {
    marginHorizontal: 16, marginBottom: 14,
    borderRadius: 18, borderWidth: 1, overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14, fontWeight: '700', letterSpacing: 0.8,   // was 11
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10,
  },

  editRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1,
  },
  editRowLeft: { flex: 1, marginRight: 14 },
  editLabel:   { fontSize: 15 },           // was 12
  editValue:   { fontSize: 19, fontWeight: '500', marginTop: 3 },  // was 15
  editInput:   { fontSize: 19, fontWeight: '500', marginTop: 3 },  // was 15
  saveBtn:     { fontSize: 17, fontWeight: '700' },  // was 14

  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1,
  },
  menuIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 19, fontWeight: '500' },   // was 15

  version: { textAlign: 'center', fontSize: 15, paddingTop: 10, paddingBottom: 18 }, // was 12
});
