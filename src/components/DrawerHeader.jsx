/**
 * DrawerContent.jsx — GRADIENT HEADER PATCH
 *
 * Replace the existing avatar/header block in your DrawerContent with this.
 * The rest of the drawer (menu items, logout) stays exactly as-is.
 *
 * Before (typical existing pattern):
 *   <View style={styles.header}>
 *     <View style={styles.avatar}>...</View>
 *     <Text ...>{name}</Text>
 *     <Text ...>{phone}</Text>
 *   </View>
 *
 * After: wrap it all in a LinearGradient, add the badge pill.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { spacing, radius, fonts } from '../constants/theme';

/**
 * Drop this component into DrawerContent where the header block currently lives.
 * Pass the same props your drawer already has.
 */
export function DrawerHeader({ name, phone, role }) {
  const { theme } = useTheme();

  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const roleLabel = role === 'main-agent' ? 'Main Agent' : 'Sub-Agent';

  return (
    <LinearGradient
      colors={[theme.gradPrimA, theme.gradPrimB]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      {/* Avatar circle */}
      <View style={styles.avatarRing}>
        <View style={styles.avatarInner}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
      </View>

      {/* Name */}
      <Text style={styles.name} numberOfLines={1}>{name ?? 'Agent'}</Text>

      {/* Phone */}
      <Text style={styles.phone} numberOfLines={1}>{phone ?? ''}</Text>

      {/* Role pill */}
      <View style={styles.rolePill}>
        <Text style={styles.roleText}>{roleLabel}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingTop: spacing.xxl + spacing.sm,   // clears status bar (translucent)
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'flex-start',
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    marginBottom: spacing.sm,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  phone: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: spacing.sm,
  },
  rolePill: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  roleText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});
