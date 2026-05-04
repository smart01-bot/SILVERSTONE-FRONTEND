import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function PendingScreen({ navigation }) {
  const { logout, profile } = useAuth();
  const { theme, tr } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.inner}>
        <View style={[styles.icon, { backgroundColor: theme.primaryLight }]}>
          <Text style={{ fontSize: 48 }}>⏳</Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{tr('applicationSent')}</Text>
        <Text style={[styles.name, { color: theme.primary }]}>
          {profile?.name ?? 'Agent'}
        </Text>
        <Text style={[styles.desc, { color: theme.textDim }]}>{tr('pendingDesc')}</Text>

        <View style={[styles.note, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Text style={[styles.noteText, { color: theme.textDim }]}>💡 {tr('pendingNote')}</Text>
        </View>

        <TouchableOpacity
          onPress={async () => { await logout(); navigation.replace('PinLogin'); }}
          style={[styles.btn, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.btnText}>{tr('goToLogin')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1 },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  icon:  { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  name:  { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  desc:  { fontSize: 15, textAlign: 'center', lineHeight: 24 },
  note:  { borderRadius: 12, padding: 14, borderWidth: 1, width: '100%' },
  noteText: { fontSize: 13, lineHeight: 20 },
  btn:   { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});