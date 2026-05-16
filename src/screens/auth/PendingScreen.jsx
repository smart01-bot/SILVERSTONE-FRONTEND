// src/screens/auth/PendingScreen.jsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, Image, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';

const STEPS = [
  { label: 'Application Received',  done: true  },
  { label: 'Identity Verification', done: false, active: true },
  { label: 'Admin Review',          done: false },
  { label: 'Account Activated',     done: false },
];

export default function PendingScreen() {
  const { logout, profile } = useAuth();
  const { theme, isDark }   = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const firstName = profile?.name?.split(' ')[0] ?? 'Agent';

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      <Animated.View style={[s.inner, { opacity: fadeAnim }]}>
        <View style={s.logoRow}>
          <View style={s.logoTile}>
            <Image source={require('../../../assets/images/SilverS.png')} style={s.logoImg} resizeMode="contain" />
          </View>
          <Text style={[s.logoText, { color: theme.text }]}>silverstone</Text>
        </View>

        <View style={[s.iconTile, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="time-outline" size={52} color={theme.primary} />
        </View>

        <Text style={[s.heading, { color: theme.text }]}>Application Under Review</Text>
        <Text style={[s.name,    { color: theme.primary }]}>{firstName}</Text>
        <Text style={[s.desc,    { color: theme.textDim }]}>
          Your application is being reviewed. This typically takes 24–48 hours.
        </Text>

        <View style={[s.tracker, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          {STEPS.map((step, i) => (
            <View key={step.label} style={s.stepRow}>
              <View style={[
                s.stepIcon,
                {
                  backgroundColor: step.done ? '#16A34A14' : step.active ? theme.primaryLight : theme.surfaceAlt,
                  borderColor:     step.done ? '#16A34A'   : step.active ? theme.primary      : theme.border,
                  borderWidth: 1.5,
                },
              ]}>
                {step.done   ? <Ionicons name="checkmark"        size={14} color="#16A34A" /> :
                 step.active ? <Ionicons name="radio-button-on"  size={14} color={theme.primary} /> :
                               <Ionicons name="radio-button-off" size={14} color={theme.muted} />}
              </View>
              <Text style={[
                s.stepLabel,
                {
                  color:      step.done ? '#16A34A' : step.active ? theme.primary : theme.textDim,
                  fontFamily: step.active ? fonts.bodySemi : fonts.body,
                },
              ]}>
                {step.label}
              </Text>
              {i < STEPS.length - 1 && (
                <View style={[s.connector, { backgroundColor: step.done ? '#16A34A' : theme.border }]} />
              )}
            </View>
          ))}
        </View>

        <Text style={[s.eta, { color: theme.textDim }]}>Estimated time: 24–48 hours</Text>

        <TouchableOpacity onPress={logout} style={s.signOutWrap} activeOpacity={0.75}>
          <Text style={[s.signOut, { color: theme.primary }]}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1 },
  inner: { flex: 1, alignItems: 'center', padding: spacing.lg, paddingTop: spacing.md },

  logoRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing.sm + 2,
    marginBottom:   spacing.xl,
  },
  logoTile: {
    width: 36, height: 36, borderRadius: radius.sm + 1,
    backgroundColor: '#C8102E', alignItems: 'center', justifyContent: 'center', padding: spacing.sm - 2,
  },
  logoImg:  { width: '100%', height: '100%' },
  logoText: { fontSize: 24, fontFamily: fonts.display, letterSpacing: -0.5 },

  iconTile: {
    width: 96, height: 96, borderRadius: radius.xl + 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  heading: { fontSize: 24, fontFamily: fonts.heading, letterSpacing: -0.4, textAlign: 'center' },
  name:    { fontSize: 20, fontFamily: fonts.bodyBold, marginTop: spacing.xs },
  desc:    { fontSize: 17, fontFamily: fonts.body, textAlign: 'center', lineHeight: 26, marginTop: spacing.sm + 2, marginBottom: spacing.lg },

  tracker: {
    width:        '100%',
    borderRadius: radius.lg,
    borderWidth:  1,
    padding:      spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.md - 4,
    position:      'relative',
    paddingBottom: spacing.md,
  },
  stepIcon: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepLabel: { fontSize: 17, flex: 1 },
  connector: {
    position: 'absolute',
    left:     14,
    top:      30,
    width:    2,
    height:   spacing.md,
  },

  eta:         { fontSize: 16, fontFamily: fonts.body, marginTop: spacing.md },
  signOutWrap: { marginTop: 'auto', padding: spacing.md },
  signOut:     { fontSize: 18, fontFamily: fonts.bodySemi },
});
