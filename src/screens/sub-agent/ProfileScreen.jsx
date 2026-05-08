import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NetworkBadge from '../../components/NetworkBadge';
import Avatar from '../../components/Avatar';

export default function ProfileScreen({ navigation }) {
  const { profile, logout } = useAuth();
  const { theme, isDark, setThemeMode, themeMode, lang, setLang, tr } = useTheme();

  const menuItems = [
    { iconName: 'time-outline',         title: tr('myRequests'),      sub: 'View request history',      onPress: () => navigation.navigate('MyRequests') },
    { iconName: 'notifications-outline',title: 'Notifications',       sub: 'Alerts & updates',          onPress: () => {} },
    { iconName: 'phone-portrait-outline',title: 'My Networks',        sub: profile?.networks?.join(' · ') || 'No networks set', onPress: () => {} },
    { iconName: 'lock-closed-outline',  title: 'Security',            sub: 'PIN & biometrics',          onPress: () => {} },
    { iconName: 'help-circle-outline',  title: 'FAQs',                sub: 'Common questions',          onPress: () => {} },
    { iconName: 'call-outline',         title: 'Contact & Support',   sub: 'Get help from our team',    onPress: () => {} },
    { iconName: 'document-outline',     title: 'Terms of Service',    sub: 'Legal & privacy',           onPress: () => {} },
  ];

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border, ...theme.shadow }]}>
          <Avatar name={profile?.name ?? 'A'} size={72} />
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

        {/* Theme + Language */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Theme</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([mode, label]) => (
                <TouchableOpacity key={mode}
                  onPress={() => { if (typeof setThemeMode === 'function') setThemeMode(mode); }}
                  style={[styles.langBtn, {
                    backgroundColor: (themeMode === mode || (!themeMode && mode === 'auto')) ? theme.primary : theme.surfaceAlt,
                    borderColor: theme.border,
                  }]}>
                  <Text style={{
                    color: (themeMode === mode || (!themeMode && mode === 'auto')) ? '#fff' : theme.textDim,
                    fontSize: 12, fontWeight: '700',
                  }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Language</Text>
            <View style={styles.langRow}>
              {[['en','EN'],['sw','SW']].map(([code, label]) => (
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
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.iconName} size={20} color={theme.textDim} />
                </View>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="log-out-outline" size={18} color="#DC2626" />
            <Text style={styles.signOutText}>{tr('signOut')}</Text>
          </View>
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
  name:       { fontSize: 20, fontWeight: '800' },
  phone:      { fontSize: 14 },
  roleBadge:  { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  roleText:   { fontSize: 13, fontWeight: '600' },
  netRow:     { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  card:       { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  rowLabel:   { fontSize: 15, fontWeight: '600' },
  langRow:    { flexDirection: 'row', gap: 6 },
  langBtn:    { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  divider:    { height: 1 },
  menuItem:   { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  menuIconWrap: { width: 28, alignItems: 'center' },
  menuTitle:  { fontSize: 15, fontWeight: '600' },
  menuSub:    { fontSize: 12, marginTop: 1 },
  chevron:    { fontSize: 22 },
  signOutBtn: { borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center' },
  signOutText:{ color: '#DC2626', fontWeight: '700', fontSize: 15 },
  version:    { textAlign: 'center', fontSize: 12 },
});
