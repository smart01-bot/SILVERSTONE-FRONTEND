import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function RejectedScreen() {
  const { logout } = useAuth();
  const { theme }  = useTheme();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.inner}>

        <View style={[styles.icon, { backgroundColor: '#FEE2E2' }]}>
          <Ionicons name="close-circle" size={48} color="#DC2626" />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Application Rejected</Text>
        <Text style={[styles.body, { color: theme.textDim }]}>
          Unfortunately your agent application was not approved. This may be due to incomplete
          documentation or eligibility requirements not being met.
        </Text>
        <Text style={[styles.body, { color: theme.textDim }]}>
          If you believe this is a mistake, please contact our support team.
        </Text>

        <TouchableOpacity
          onPress={() => Linking.openURL('mailto:support@silverstone.co.tz')}
          style={[styles.btn, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.btnText}>Contact Support</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={logout} style={{ marginTop: 8 }}>
          <Text style={{ color: theme.textDim, fontSize: 14 }}>
            Sign out{'  '}
            <Text style={{ color: theme.primary, fontWeight: '600' }}>→</Text>
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1 },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 },
  icon:  { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  body:  { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  btn:   { width: '100%', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
