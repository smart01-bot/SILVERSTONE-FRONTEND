// src/components/DrawerContent.jsx
import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth }  from '../context/AuthContext';
import { spacing, radius, fonts } from '../constants/theme';

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

function SpringItem({ onPress, style, children }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onIn  = () =>
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 80, bounciness: 2 }).start();
  const onOut = () =>
    Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 8 }).start();

  return (
    <TouchableOpacity onPressIn={onIn} onPressOut={onOut} onPress={onPress} activeOpacity={1}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function DrawerContent({ navigation, items }) {
  const { theme, isDark, setTheme, lang, setLang, tr } = useTheme();
  const { profile, logout }          = useAuth();

  const name     = profile?.name  || 'Agent';
  const email    = profile?.email || '';
  const initials = getInitials(name);
  const s        = styles(theme);
  const isSw     = lang === 'sw';

  return (
    <View style={s.container}>

      <View style={s.header}>
        <View style={s.avatarOuter}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={s.avatarRing} />
        </View>
        <Text style={s.name}>{name}</Text>
        {!!email && <Text style={s.email}>{email}</Text>}
      </View>

      <View style={s.divider} />

      <View style={s.nav}>
        {items.map(({ label, icon, onPress }) => (
          <SpringItem
            key={label}
            style={s.item}
            onPress={() => { navigation.closeDrawer(); onPress(navigation); }}
          >
            <View style={s.itemIcon}>
              <Ionicons name={icon} size={22} color={theme.primary} />
            </View>
            <Text style={s.label}>{label}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.muted} />
          </SpringItem>
        ))}
      </View>

      <View style={s.divider} />
      <View style={s.langSection}>
        <View style={s.langHeader}>
          <View style={s.itemIcon}>
            <Ionicons name="language-outline" size={22} color={theme.primary} />
          </View>
          <Text style={s.label}>{tr('language')}</Text>
        </View>
        <View style={s.langPillRow}>
          <TouchableOpacity
            onPress={() => setLang('en')}
            style={[s.langPill, isSw
              ? { backgroundColor: theme.surfaceAlt, borderColor: theme.border }
              : { backgroundColor: theme.primary,    borderColor: theme.primary }
            ]}
            activeOpacity={0.8}
          >
            <Text style={[s.langPillText, { color: isSw ? theme.textDim : '#fff' }]}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLang('sw')}
            style={[s.langPill, isSw
              ? { backgroundColor: theme.primary,    borderColor: theme.primary }
              : { backgroundColor: theme.surfaceAlt, borderColor: theme.border }
            ]}
            activeOpacity={0.8}
          >
            <Text style={[s.langPillText, { color: isSw ? '#fff' : theme.textDim }]}>SW</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.divider} />
      <View style={s.langSection}>
        <View style={s.langHeader}>
          <View style={s.itemIcon}>
            <Ionicons name="contrast-outline" size={22} color={theme.primary} />
          </View>
          <Text style={s.label}>{tr('darkMode')}</Text>
        </View>
        <View style={s.langPillRow}>
          <TouchableOpacity
            onPress={() => setTheme('light')}
            style={[s.langPill, !isDark
              ? { backgroundColor: theme.primary,    borderColor: theme.primary }
              : { backgroundColor: theme.surfaceAlt, borderColor: theme.border }
            ]}
            activeOpacity={0.8}
          >
            <Text style={[s.langPillText, { color: !isDark ? '#fff' : theme.textDim }]}>{tr('light')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTheme('dark')}
            style={[s.langPill, isDark
              ? { backgroundColor: theme.primary,    borderColor: theme.primary }
              : { backgroundColor: theme.surfaceAlt, borderColor: theme.border }
            ]}
            activeOpacity={0.8}
          >
            <Text style={[s.langPillText, { color: isDark ? '#fff' : theme.textDim }]}>{tr('dark')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.divider} />
      <SpringItem style={s.item} onPress={logout}>
        <View style={[s.itemIcon, { backgroundColor: theme.dangerSoft }]}>
          <Ionicons name="log-out-outline" size={22} color={theme.primary} />
        </View>
        <Text style={[s.label, { color: theme.primary }]}>{tr('signOut')}</Text>
      </SpringItem>

    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: theme.surface,
    paddingTop:      Platform.OS === 'ios' ? spacing.xxl + spacing.sm : spacing.xl,
    paddingBottom:   spacing.xl,
  },

  header:      { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  avatarOuter: { position: 'relative', marginBottom: spacing.md - 2, width: 68, height: 68 },
  avatar: {
    width:          64,
    height:         64,
    borderRadius:   32,
    backgroundColor: theme.primary,
    alignItems:     'center',
    justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: theme.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  avatarRing: {
    position:    'absolute',
    top:         -3,
    left:        -3,
    width:       70,
    height:      70,
    borderRadius: 35,
    borderWidth:  2,
    borderColor:  theme.primary + '40',
  },
  avatarText: { color: '#fff', fontSize: 24, fontFamily: fonts.bodyXBold },
  name:       { color: theme.text,    fontSize: 20, fontFamily: fonts.display,   letterSpacing: -0.3 },
  email:      { color: theme.textDim, fontSize: 15, fontFamily: fonts.body,      marginTop: spacing.xs - 1 },

  divider: {
    height:           1,
    backgroundColor:  theme.border,
    marginVertical:   spacing.sm,
    marginHorizontal: spacing.md + 4,
  },

  nav:  { flex: 1, paddingTop: spacing.xs },

  item: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   13,
    paddingHorizontal: spacing.md + 4,
    gap:               spacing.md - 2,
  },
  itemIcon: {
    width:          40,
    height:         40,
    borderRadius:   radius.md,
    backgroundColor: theme.primaryLight,
    alignItems:     'center',
    justifyContent: 'center',
  },
  label: { flex: 1, color: theme.text, fontSize: 17, fontFamily: fonts.bodySemi },

  langSection: {
    paddingHorizontal: spacing.md + 4,
    paddingVertical:   spacing.md - 4,
  },
  langHeader:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 2, marginBottom: spacing.md - 4 },
  langPillRow: { flexDirection: 'row', gap: spacing.sm, marginLeft: 54 },
  langPill: {
    flex:           1,
    paddingVertical: 10,
    borderRadius:   radius.md,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
  },
  langPillText: { fontSize: 15, fontFamily: fonts.bodyBold, letterSpacing: 0.5 },
});
