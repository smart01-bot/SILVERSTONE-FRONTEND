import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NetworkBadge from '../../components/NetworkBadge';

const EDITABLE_FIELDS = [
  { key: 'name',             label: 'Full Name',          keyboard: 'default' },
  { key: 'phone',            label: 'Phone Number',        keyboard: 'phone-pad' },
  { key: 'businessLocation', label: 'Business Location',   keyboard: 'default' },
];

export default function ProfileScreen({ navigation }) {
  const { profile, logout, user } = useAuth();
  const { theme, setTheme, userPreference, lang, setLang, tr } = useTheme();

  const [editKey, setEditKey]   = useState(null);
  const [editVal, setEditVal]   = useState('');
  const [saving, setSaving]     = useState(false);

  const startEdit = (key) => {
    setEditKey(key);
    setEditVal(profile?.[key] ?? '');
  };

  const cancelEdit = () => { setEditKey(null); setEditVal(''); };

  const saveEdit = async () => {
    if (!editKey || !user?.uid) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'agents', user.uid), { [editKey]: editVal.trim() });
      setEditKey(null);
      setEditVal('');
    } catch (e) {
      Alert.alert('Error', e.message ?? 'Could not save.');
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

  const menuItems = [
    { icon: '📊', title: tr('myRequests'),    sub: 'View request history',     onPress: () => navigation.navigate('MyRequests') },
    { icon: '🔔', title: 'Notifications',     sub: 'Alerts & updates',          onPress: () => {} },
    { icon: '📱', title: 'My Networks',       sub: profile?.networks?.join(' · ') || 'No networks set', onPress: () => navigation.navigate('Networks') },
    { icon: '🔐', title: 'Security',          sub: 'PIN & biometrics',           onPress: () => {} },
    { icon: '❓', title: 'FAQs',              sub: 'Common questions',            onPress: () => {} },
    { icon: '📞', title: 'Contact & Support', sub: 'Get help from our team',      onPress: () => {} },
    { icon: '📄', title: 'Terms of Service',  sub: 'Legal & privacy',             onPress: () => {} },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border, ...theme.shadow }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {profile?.name?.[0] ?? 'A'}
            </Text>
          </View>
          <Text style={[styles.name, { color: theme.text }]}>{profile?.name ?? '—'}</Text>
          <Text style={[styles.phone, { color: theme.textDim }]}>{profile?.phone ?? '—'}</Text>
          <View style={[styles.roleBadge, { backgroundColor: theme.primaryLight }]}>
            <Text style={[styles.roleText, { color: theme.primary }]}>Agent · Active</Text>
          </View>
          {profile?.networks?.length > 0 && (
            <View style={styles.netRow}>
              {profile.networks.map(n => <NetworkBadge key={n} network={n} />)}
            </View>
          )}
        </View>

        {/* Editable info fields */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textDim }]}>ACCOUNT INFO</Text>
          {EDITABLE_FIELDS.map((field, idx) => (
            <React.Fragment key={field.key}>
              {idx > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
              {editKey === field.key ? (
                <View style={styles.editRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: theme.textDim }]}>{field.label}</Text>
                    <TextInput
                      style={[styles.editInput, { color: theme.text, borderColor: theme.primary, backgroundColor: theme.surfaceAlt }]}
                      value={editVal}
                      onChangeText={setEditVal}
                      keyboardType={field.keyboard}
                      autoFocus
                    />
                  </View>
                  <View style={styles.editActions}>
                    <TouchableOpacity onPress={saveEdit} disabled={saving}
                      style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
                      {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={cancelEdit}
                      style={[styles.cancelBtn, { borderColor: theme.border }]}>
                      <Text style={[styles.cancelBtnText, { color: theme.textDim }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.fieldRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: theme.textDim }]}>{field.label}</Text>
                    <Text style={[styles.fieldValue, { color: theme.text }]}>
                      {profile?.[field.key] ?? '—'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => startEdit(field.key)}
                    style={[styles.editBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                    <Text style={{ color: theme.primary, fontSize: 14 }}>✏️</Text>
                  </TouchableOpacity>
                </View>
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Theme + Language */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>🎨 Theme</Text>
            <View style={styles.themeOptions}>
              {['auto', 'light', 'dark'].map((option) => {
                const active = (userPreference ?? 'auto') === option;
                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => setTheme(option)}
                    style={[
                      styles.themeOptionBtn,
                      { backgroundColor: active ? theme.primary : theme.surfaceAlt, borderColor: theme.border },
                    ]}
                  >
                    <Text style={{ color: active ? '#fff' : theme.textDim, fontSize: 12, fontWeight: '600' }}>
                      {option === 'auto' ? '📱 Auto' : option === 'light' ? '☀️ Light' : '🌙 Dark'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>🌍 Language</Text>
            <View style={styles.langRow}>
              {[['en', 'EN'], ['sw', 'SW']].map(([code, label]) => (
                <TouchableOpacity key={code} onPress={() => setLang(code)}
                  style={[styles.langBtn, { backgroundColor: lang === code ? theme.primary : theme.surfaceAlt, borderColor: theme.border }]}>
                  <Text style={{ color: lang === code ? '#fff' : theme.textDim, fontSize: 12, fontWeight: '700' }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {menuItems.map((item, idx) => (
            <React.Fragment key={item.title}>
              <TouchableOpacity onPress={item.onPress} style={styles.menuItem}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[styles.menuSub, { color: theme.textDim }]}>{item.sub}</Text>
                </View>
                <Text style={[styles.chevron, { color: theme.textDim }]}>›</Text>
              </TouchableOpacity>
              {idx < menuItems.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity onPress={handleLogout}
          style={[styles.signOutBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
          <Text style={styles.signOutText}>← {tr('signOut')}</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: theme.muted }]}>Silverstone v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  scroll:     { padding: 16, gap: 12, paddingBottom: 100 },
  profileCard:{ borderRadius: 20, borderWidth: 1, padding: 20, alignItems: 'center', gap: 8 },
  avatar:     { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: '700' },
  name:       { fontSize: 20, fontWeight: '800' },
  phone:      { fontSize: 14 },
  roleBadge:  { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  roleText:   { fontSize: 13, fontWeight: '600' },
  netRow:     { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },

  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, paddingHorizontal: 14, paddingTop: 12 },
  card:         { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  fieldRow:     { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  fieldLabel:   { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  fieldValue:   { fontSize: 15, fontWeight: '600' },
  editBtn:      { borderWidth: 1, borderRadius: 20, width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  editRow:      { padding: 14, gap: 10 },
  editInput:    { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginTop: 4 },
  editActions:  { flexDirection: 'row', gap: 8 },
  saveBtn:      { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, minWidth: 60, alignItems: 'center' },
  saveBtnText:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  cancelBtn:    { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText:{ fontWeight: '600', fontSize: 13 },

  row:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  rowLabel:   { fontSize: 15, fontWeight: '600' },
  themeOptions:   { flexDirection: 'row', gap: 6 },
  themeOptionBtn: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  langRow:    { flexDirection: 'row', gap: 6 },
  langBtn:    { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  divider:    { height: 1 },
  menuItem:   { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  menuIcon:   { fontSize: 22, width: 30 },
  menuTitle:  { fontSize: 15, fontWeight: '600' },
  menuSub:    { fontSize: 12, marginTop: 1 },
  chevron:    { fontSize: 22 },
  signOutBtn: { borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center' },
  signOutText:{ color: '#DC2626', fontWeight: '700', fontSize: 15 },
  version:    { textAlign: 'center', fontSize: 12 },
});
