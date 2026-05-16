// src/screens/auth/RoleSelectScreen.jsx
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';

const ROLES = [
  { id: 'main-agent', title: 'Main Agent', sub: 'Aggregator',          icon: 'shield-checkmark' },
  { id: 'sub-agent',  title: 'Agent',      sub: 'Single-till operator', icon: 'person' },
];

export default function RoleSelectScreen({ navigation }) {
  const { theme, isDark } = useTheme();

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning.' : hour < 17 ? 'Good afternoon.' : 'Good evening.';

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      <View style={s.logoRow}>
        <View style={s.logoTile}>
          <Image source={require('../../../assets/images/SilverS.png')} style={s.logoImg} resizeMode="contain" />
        </View>
        <Text style={[s.logoText, { color: theme.text }]}>silverstone</Text>
      </View>

      <View style={s.greetingWrap}>
        <Text style={[s.greeting, { color: theme.text }]}>{greeting}</Text>
        <Text style={[s.loginAs,  { color: theme.textDim }]}>Log in as</Text>
      </View>

      <View style={s.cards}>
        {ROLES.map(role => (
          <TouchableOpacity
            key={role.id}
            onPress={() => navigation.navigate('Login', { selectedRole: role.id })}
            activeOpacity={0.75}
            style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={[s.iconPlate, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name={`${role.icon}-outline`} size={28} color={theme.primary} />
            </View>
            <View style={s.cardText}>
              <Text style={[s.cardTitle, { color: theme.text }]}>{role.title}</Text>
              <Text style={[s.cardSub,   { color: theme.textDim }]}>{role.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.muted} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.footer}>
        <Text style={[s.footerText, { color: theme.textDim }]}>
          Don't have an account?{' '}
          <Text
            style={{ color: theme.primary, fontFamily: fonts.bodySemi }}
            onPress={() => navigation.navigate('Register')}
          >
            Register
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  logoRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing.sm + 2,
    paddingTop:     spacing.xl,
    paddingBottom:  spacing.sm,
  },
  logoTile: {
    width:           36,
    height:          36,
    borderRadius:    radius.sm + 1,
    backgroundColor: '#C8102E',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         spacing.sm - 2,
  },
  logoImg:  { width: '100%', height: '100%' },
  logoText: { fontSize: 24, fontFamily: fonts.display, letterSpacing: -0.5 },

  greetingWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  greeting:     { fontSize: 36, fontFamily: fonts.display, letterSpacing: -0.5 },
  loginAs:      { fontSize: 19, fontFamily: fonts.body, marginTop: spacing.xs },

  cards: { paddingHorizontal: spacing.md, gap: spacing.md - 4 },
  card: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            spacing.md,
    padding:        spacing.md + 2,
    borderRadius:   radius.xl,
    borderWidth:    1,
  },
  iconPlate: {
    width:          56,
    height:         56,
    borderRadius:   radius.lg,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  cardText:  { flex: 1, gap: spacing.xs - 2 },
  cardTitle: { fontSize: 21, fontFamily: fonts.heading },
  cardSub:   { fontSize: 17, fontFamily: fonts.body },

  footer:     { marginTop: 'auto', alignItems: 'center', paddingBottom: spacing.xl },
  footerText: { fontSize: 17, fontFamily: fonts.body },
});
