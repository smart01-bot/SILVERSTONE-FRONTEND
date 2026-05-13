// src/screens/auth/PendingScreen.jsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, Image, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

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
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const firstName = profile?.name?.split(' ')[0] ?? 'Agent';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>

        {/* Logo row */}
        <View style={styles.logoRow}>
          <View style={styles.logoTile}>
            <Image
              source={require('../../../assets/images/SilverS.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.logoText, { color: theme.text }]}>
            silverstone
          </Text>
        </View>

        {/* Icon */}
        <View style={[styles.iconTile, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="time-outline" size={48} color={theme.primary} />
        </View>

        {/* Heading */}
        <Text style={[styles.heading, { color: theme.text }]}>
          Application Under Review
        </Text>
        <Text style={[styles.name, { color: theme.primary }]}>
          {firstName}
        </Text>
        <Text style={[styles.desc, { color: theme.textDim }]}>
          Your application is being reviewed. This typically takes 24–48 hours.
        </Text>

        {/* Step tracker */}
        <View style={[styles.tracker, {
          backgroundColor: theme.surfaceAlt,
          borderColor:     theme.border,
        }]}>
          {STEPS.map((step, i) => (
            <View key={step.label} style={styles.stepRow}>
              {/* Icon */}
              <View style={[
                styles.stepIcon,
                {
                  backgroundColor: step.done
                    ? '#16A34A14'
                    : step.active
                      ? theme.primaryLight
                      : theme.surfaceAlt,
                  borderColor: step.done
                    ? '#16A34A'
                    : step.active
                      ? theme.primary
                      : theme.border,
                  borderWidth: 1.5,
                },
              ]}>
                {step.done ? (
                  <Ionicons name="checkmark" size={14} color="#16A34A" />
                ) : step.active ? (
                  <Ionicons name="radio-button-on" size={14} color={theme.primary} />
                ) : (
                  <Ionicons name="radio-button-off" size={14} color={theme.muted} />
                )}
              </View>

              {/* Label */}
              <Text style={[
                styles.stepLabel,
                {
                  color: step.done
                    ? '#16A34A'
                    : step.active
                      ? theme.primary
                      : theme.textDim,
                  fontWeight: step.active ? '600' : '400',
                },
              ]}>
                {step.label}
              </Text>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <View style={[
                  styles.connector,
                  { backgroundColor: step.done ? '#16A34A' : theme.border },
                ]} />
              )}
            </View>
          ))}
        </View>

        <Text style={[styles.eta, { color: theme.textDim }]}>
          Estimated time: 24–48 hours
        </Text>

        {/* Sign out */}
        <TouchableOpacity
          onPress={logout}
          style={styles.signOutWrap}
          activeOpacity={0.75}
        >
          <Text style={[styles.signOut, { color: theme.primary }]}>
            Sign Out
          </Text>
        </TouchableOpacity>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1 },
  inner: {
    flex:           1,
    alignItems:     'center',
    padding:        24,
    paddingTop:     16,
  },
  logoRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            10,
    marginBottom:   32,
  },
  logoTile: {
    width:           32,
    height:          32,
    borderRadius:    9,
    backgroundColor: '#C8102E',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         6,
  },
  logoImg:  { width: '100%', height: '100%' },
  logoText: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  iconTile: {
    width:          88,
    height:         88,
    borderRadius:   22,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   20,
  },
  heading: {
    fontSize:      20,
    fontWeight:    '800',
    letterSpacing: -0.4,
    textAlign:     'center',
  },
  name: {
    fontSize:   17,
    fontWeight: '700',
    marginTop:  4,
  },
  desc: {
    fontSize:   14,
    textAlign:  'center',
    lineHeight: 22,
    marginTop:  10,
    marginBottom: 24,
  },
  tracker: {
    width:        '100%',
    borderRadius: 16,
    borderWidth:  1,
    padding:      16,
    gap:          0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    position:      'relative',
    paddingBottom: 16,
  },
  stepIcon: {
    width:          28,
    height:         28,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  stepLabel: {
    fontSize: 14,
    flex:     1,
  },
  connector: {
    position: 'absolute',
    left:     13,
    top:      28,
    width:    2,
    height:   16,
  },
  eta: {
    fontSize:  13,
    marginTop: 16,
  },
  signOutWrap: {
    marginTop: 'auto',
    padding:   16,
  },
  signOut: {
    fontSize:   15,
    fontWeight: '600',
  },
});