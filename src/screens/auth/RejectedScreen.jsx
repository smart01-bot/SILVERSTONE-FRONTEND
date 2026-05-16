// src/screens/auth/RejectedScreen.jsx
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';

export default function RejectedScreen() {
  const { logout } = useAuth();
  const { theme, isDark } = useTheme();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      <View style={s.inner}>
        <View style={s.logoRow}>
          <View style={s.logoTile}>
            <Image source={require('../../../assets/images/SilverS.png')} style={s.logoImg} resizeMode="contain" />
          </View>
          <Text style={[s.logoText, { color: theme.text }]}>silverstone</Text>
        </View>

        <View style={[s.iconTile, { backgroundColor: theme.dangerSoft }]}>
          <Ionicons name="close-circle-outline" size={52} color={theme.danger} />
        </View>

        <Text style={[s.heading, { color: theme.text }]}>Application Rejected</Text>
        <Text style={[s.desc,    { color: theme.textDim }]}>
          Your application was not approved. Please contact support for more information.
        </Text>

        <View style={[s.supportCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <View style={s.supportRow}>
            <Ionicons name="mail-outline" size={20} color={theme.primary} />
            <Text style={[s.supportText, { color: theme.text }]}>support@silverstone.co.tz</Text>
          </View>
          <View style={s.supportRow}>
            <Ionicons name="call-outline" size={20} color={theme.primary} />
            <Text style={[s.supportText, { color: theme.text }]}>+255 XXX XXX XXX</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={logout}
          style={[s.btn, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
        >
          <Text style={s.btnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1 },
  inner: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        spacing.lg,
    gap:            spacing.md,
  },

  logoRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing.sm + 2,
    marginBottom:   spacing.md,
  },
  logoTile: {
    width: 36, height: 36, borderRadius: radius.sm + 1,
    backgroundColor: '#C8102E', alignItems: 'center', justifyContent: 'center', padding: spacing.sm - 2,
  },
  logoImg:  { width: '100%', height: '100%' },
  logoText: { fontSize: 24, fontFamily: fonts.display, letterSpacing: -0.5 },

  iconTile: {
    width: 96, height: 96, borderRadius: radius.xl + 2,
    alignItems: 'center', justifyContent: 'center',
  },
  heading: { fontSize: 28, fontFamily: fonts.heading, letterSpacing: -0.4, textAlign: 'center' },
  desc:    { fontSize: 17, fontFamily: fonts.body, textAlign: 'center', lineHeight: 26 },

  supportCard: {
    width:        '100%',
    borderRadius: radius.lg,
    borderWidth:  1,
    padding:      spacing.md,
    gap:          spacing.md - 4,
  },
  supportRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  supportText: { fontSize: 17, fontFamily: fonts.bodyMed },

  btn: {
    width:          '100%',
    height:         56,
    borderRadius:   radius.md,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      spacing.sm,
  },
  btnText: { color: '#fff', fontSize: 19, fontFamily: fonts.bodyBold },
});
