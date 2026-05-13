// src/screens/auth/RejectedScreen.jsx
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function RejectedScreen() {
  const { logout } = useAuth();
  const { theme, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      <View style={styles.inner}>

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
          <Ionicons name="close-circle-outline" size={48} color={theme.primary} />
        </View>

        {/* Heading */}
        <Text style={[styles.heading, { color: theme.text }]}>
          Application Rejected
        </Text>
        <Text style={[styles.desc, { color: theme.textDim }]}>
          Your application was not approved. Please contact support for more information.
        </Text>

        {/* Support info */}
        <View style={[styles.supportCard, {
          backgroundColor: theme.surfaceAlt,
          borderColor:     theme.border,
        }]}>
          <View style={styles.supportRow}>
            <Ionicons name="mail-outline" size={18} color={theme.primary} />
            <Text style={[styles.supportText, { color: theme.text }]}>
              support@silverstone.co.tz
            </Text>
          </View>
          <View style={styles.supportRow}>
            <Ionicons name="call-outline" size={18} color={theme.primary} />
            <Text style={[styles.supportText, { color: theme.text }]}>
              +255 XXX XXX XXX
            </Text>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          onPress={logout}
          style={[styles.btn, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Sign Out</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1 },
  inner: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        24,
    gap:            16,
  },
  logoRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            10,
    marginBottom:   16,
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
  },
  heading: {
    fontSize:      22,
    fontWeight:    '800',
    letterSpacing: -0.4,
    textAlign:     'center',
  },
  desc: {
    fontSize:  14,
    textAlign: 'center',
    lineHeight: 22,
  },
  supportCard: {
    width:        '100%',
    borderRadius: 16,
    borderWidth:  1,
    padding:      16,
    gap:          12,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  supportText: {
    fontSize:   15,
    fontWeight: '500',
  },
  btn: {
    width:          '100%',
    height:         52,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      8,
  },
  btnText: {
    color:      '#fff',
    fontSize:   15,
    fontWeight: '700',
  },
});