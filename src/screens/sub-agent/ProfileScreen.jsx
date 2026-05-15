// src/screens/sub-agent/ProfileScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, ScrollView,
  TextInput, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
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
  const { theme, isDark, setTheme, lang, setLang } = useTheme();

  const [editing,     setEditing]     = useState(null);
  const [editValue,   setEditValue]   = useState('');
  const [saving,      setSaving]      = useState(false);

  const initials = profile?.name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'AG';

  const avatarColor = () => {
    const colors = ['#C8102E', '#0891B2', '#16A34A', '#7C3AED'];
    return colors[(profile?.name?.charCodeAt(0) ?? 0) % colors.length];
  };

  const startEdit = (field, value) => {
    setEditing(field);
    setEditValue(value ?? '');
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'agents', user.uid), {
        [editing]: editValue.trim(),
      });
      setEditing(null);
    } catch (e) {
      Alert.alert('Error', 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
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
          <Text style={[styles.editValue, { color: theme.text }]}>
            {value ?? '—'}
          </Text>
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
          <Ionicons name="pencil-outline" size={16} color={theme.textDim} />
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
        <Ionicons
          name={icon}
          size={18}
          color={danger ? '#C8102E' : theme.primary}
        />
      </View>
      <Text style={[styles.menuLabel, { color: danger ? '#C8102E' : theme.text }]}>
        {label}
      </Text>
      {isSwitch
        ? <Switch value={value} onValueChange={onPress} thumbColor="#fff" trackColor={{ true: theme.primary, false: theme.border }} />
        : <Ionicons name="chevron-forward" size={16} color={theme.muted} />
      }
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#C8102E" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: avatarColor() + '20' }]}>
            <Text style={[styles.avatarText, { color: avatarColor() }]}>
              {initials}
            </Text>
          </View>
          <Text style={[styles.name, { color: theme.text }]}>
            {profile?.name ?? 'Agent'}
          </Text>
          <Text style={[styles.email, { color: theme.textDim }]}>
            {user?.email ?? ''}
          </Text>

          {/* Network chips */}
          {profile?.networks?.length > 0 && (
            <View style={styles.chips}>
              {profile.networks.map(net => (
                <View
                  key={net}
                  style={[styles.chip, {
                    backgroundColor: NETWORK_COLORS[net] + '14',
                    borderColor:     NETWORK_COLORS[net] + '40',
                  }]}
                >
                  <Text style={[styles.chipText, { color: NETWORK_COLORS[net] }]}>
                    {net}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Editable fields */}
        <View style={[styles.section, {
          backgroundColor: theme.surfaceAlt,
          borderColor:     theme.border,
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.textDim }]}>
            PERSONAL INFO
          </Text>
          <EditableRow label="Full Name"   field="name"             value={profile?.name} />
          <EditableRow label="Phone"       field="phone"            value={profile?.phone} />
          <EditableRow label="Location"    field="businessLocation" value={profile?.businessLocation} />
        </View>

        {/* Menu */}
        <View style={[styles.section, {
          backgroundColor: theme.surfaceAlt,
          borderColor:     theme.border,
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.textDim }]}>
            SETTINGS
          </Text>
          <MenuItem
            icon="wifi-outline"
            label="My Networks"
            onPress={() => navigation.navigate('Networks')}
          />
          <MenuItem
            icon="moon-outline"
            label="Dark Mode"
            isSwitch
            value={isDark}
            onPress={(val) => setTheme(val ? 'dark' : 'light')}
          />
          <MenuItem
            icon="lock-closed-outline"
            label="Change PIN"
            onPress={() => {}}
          />
          <MenuItem
            icon="language-outline"
            label={lang === 'sw' ? 'Badilisha: English' : 'Switch to: Kiswahili'}
            isSwitch
            value={lang === 'en'}
            onPress={(val) => setLang(val ? 'en' : 'sw')}
          />
        </View>

        <View style={[styles.section, {
          backgroundColor: theme.surfaceAlt,
          borderColor:     theme.border,
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.textDim }]}>
            SUPPORT
          </Text>
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => {}}
          />
          <MenuItem
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => {}}
          />
        </View>

        <View style={[styles.section, {
          backgroundColor: theme.surfaceAlt,
          borderColor:     theme.border,
        }]}>
          <MenuItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleLogout}
            danger
          />
        </View>

        {/* Version */}
        <Text style={[styles.version, { color: theme.muted }]}>
          Silverstone v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingBottom: 100 },

  header: {
    backgroundColor:       '#C8102E',
    paddingHorizontal:     18,
    paddingTop:            10,
    paddingBottom:         14,
    borderBottomLeftRadius:  24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },

  avatarSection: {
    alignItems:  'center',
    paddingTop:  24,
    paddingBottom: 16,
  },
  avatar: {
    width:          72,
    height:         72,
    borderRadius:   36,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   12,
  },
  avatarText: { fontSize: 26, fontWeight: '800' },
  name:       { fontSize: 18, fontWeight: '800' },
  email:      { fontSize: 13, marginTop: 4 },
  chips: {
    flexDirection: 'row',
    gap:           6,
    marginTop:     12,
    flexWrap:      'wrap',
    justifyContent:'center',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      6,
    borderWidth:       1,
  },
  chipText: { fontSize: 12, fontWeight: '600' },

  section: {
    marginHorizontal: 16,
    marginBottom:     12,
    borderRadius:     16,
    borderWidth:      1,
    overflow:         'hidden',
  },
  sectionTitle: {
    fontSize:          11,
    fontWeight:        '600',
    letterSpacing:     0.8,
    paddingHorizontal: 16,
    paddingTop:        14,
    paddingBottom:     8,
  },

  editRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   12,
    borderBottomWidth: 1,
  },
  editRowLeft: { flex: 1, marginRight: 12 },
  editLabel:   { fontSize: 12 },
  editValue:   { fontSize: 15, fontWeight: '500', marginTop: 2 },
  editInput:   { fontSize: 15, fontWeight: '500', marginTop: 2 },
  saveBtn:     { fontSize: 14, fontWeight: '700' },

  menuItem: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    paddingHorizontal: 16,
    paddingVertical:   14,
    borderBottomWidth: 1,
  },
  menuIcon: {
    width:          36,
    height:         36,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500' },

  version: {
    textAlign:    'center',
    fontSize:     12,
    paddingTop:   8,
    paddingBottom: 16,
  },
});