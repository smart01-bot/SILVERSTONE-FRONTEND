// src/components/DrawerContent.jsx
import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

// Animated spring-press wrapper — adds tactile bounce feedback
function SpringItem({ onPress, style, children }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onIn  = () =>
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 80, bounciness: 2 }).start();
  const onOut = () =>
    Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 8 }).start();

  return (
    <TouchableOpacity
      onPressIn={onIn}
      onPressOut={onOut}
      onPress={onPress}
      activeOpacity={1}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function DrawerContent({ navigation, items }) {
  const { theme, lang, setLang, tr } = useTheme();
  const { profile, logout }          = useAuth();

  const name     = profile?.name  || 'Agent';
  const email    = profile?.email || '';
  const initials = getInitials(name);
  const s        = styles(theme);

  const isSw = lang === 'sw';

  return (
    <View style={s.container}>

      {/* ── Header / avatar ─────────────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.avatarOuter}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          {/* glow ring */}
          <View style={s.avatarRing} />
        </View>
        <Text style={s.name}>{name}</Text>
        {!!email && <Text style={s.email}>{email}</Text>}
      </View>

      <View style={s.divider} />

      {/* ── Nav items ───────────────────────────────────────────────────────── */}
      <View style={s.nav}>
        {items.map(({ label, icon, onPress }) => (
          <SpringItem
            key={label}
            style={s.item}
            onPress={() => {
              navigation.closeDrawer();
              onPress(navigation);
            }}
          >
            <View style={s.itemIcon}>
              <Ionicons name={icon} size={22} color={theme.primary} />
            </View>
            <Text style={s.label}>{label}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.muted} />
          </SpringItem>
        ))}
      </View>

      {/* ── Language toggle ──────────────────────────────────────────────────── */}
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
            style={[
              s.langPill,
              isSw
                ? { backgroundColor: theme.surfaceAlt, borderColor: theme.border }
                : { backgroundColor: theme.primary,    borderColor: theme.primary },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[
              s.langPillText,
              { color: isSw ? theme.textDim : '#fff' },
            ]}>
              EN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setLang('sw')}
            style={[
              s.langPill,
              isSw
                ? { backgroundColor: theme.primary,    borderColor: theme.primary }
                : { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[
              s.langPillText,
              { color: isSw ? '#fff' : theme.textDim },
            ]}>
              SW
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Sign out ─────────────────────────────────────────────────────────── */}
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
    paddingTop:      Platform.OS === 'ios' ? 56 : 40,
    paddingBottom:   32,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingBottom:     24,
  },
  avatarOuter: {
    position:    'relative',
    marginBottom: 14,
    width:        68,
    height:       68,
  },
  avatar: {
    width:          64,
    height:         64,
    borderRadius:   32,
    backgroundColor: theme.primary,
    alignItems:     'center',
    justifyContent: 'center',
    // subtle 3-D shadow
    ...Platform.select({
      ios: {
        shadowColor:   theme.primary,
        shadowOffset:  { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius:  12,
      },
      android: { elevation: 8 },
    }),
  },
  avatarRing: {
    position:        'absolute',
    top:             -3,
    left:            -3,
    width:           70,
    height:          70,
    borderRadius:    35,
    borderWidth:     2,
    borderColor:     theme.primary + '40',
  },
  avatarText: {
    color:      '#fff',
    fontSize:   24,
    fontWeight: '800',
  },
  name: {
    color:      theme.text,
    fontSize:   20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  email: {
    color:     theme.textDim,
    fontSize:  15,
    marginTop: 3,
  },

  divider: {
    height:           1,
    backgroundColor:  theme.border,
    marginVertical:   8,
    marginHorizontal: 20,
  },

  nav: {
    flex:      1,
    paddingTop: 4,
  },

  // Shared item row
  item: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   13,
    paddingHorizontal: 20,
    gap:               14,
  },
  itemIcon: {
    width:          40,
    height:         40,
    borderRadius:   12,
    backgroundColor: theme.primaryLight,
    alignItems:     'center',
    justifyContent: 'center',
  },
  label: {
    flex:       1,
    color:      theme.text,
    fontSize:   17,
    fontWeight: '600',
  },

  // Language section
  langSection: {
    paddingHorizontal: 20,
    paddingVertical:   12,
  },
  langHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            14,
    marginBottom:   12,
  },
  langPillRow: {
    flexDirection:     'row',
    gap:               8,
    marginLeft:        54,      // align under label
  },
  langPill: {
    flex:              1,
    paddingVertical:   10,
    borderRadius:      12,
    borderWidth:       1.5,
    alignItems:        'center',
    justifyContent:    'center',
  },
  langPillText: {
    fontSize:   15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
