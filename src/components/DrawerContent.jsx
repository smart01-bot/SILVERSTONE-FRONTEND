// src/components/DrawerContent.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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

export default function DrawerContent({ navigation, items }) {
  const { theme } = useTheme();
  const { profile, logout } = useAuth();

  const name     = profile?.name  || 'Agent';
  const email    = profile?.email || '';
  const initials = getInitials(name);

  const s = styles(theme);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <Text style={s.name}>{name}</Text>
        {!!email && <Text style={s.email}>{email}</Text>}
      </View>

      {/* Divider */}
      <View style={s.divider} />

      {/* Nav Items */}
      <View style={s.nav}>
        {items.map(({ label, icon, onPress }) => (
          <TouchableOpacity
            key={label}
            style={s.item}
            onPress={() => {
              navigation.closeDrawer();
              onPress(navigation);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name={icon} size={20} color={theme.textDim} style={s.icon} />
            <Text style={s.label}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign Out */}
      <View style={s.divider} />
      <TouchableOpacity
        style={s.item}
        onPress={logout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={20} color={theme.primary} style={s.icon} />
        <Text style={[s.label, { color: theme.primary }]}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surface,
    paddingTop: 56,
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  name: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '700',
  },
  email: {
    color: theme.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 8,
    marginHorizontal: 24,
  },
  nav: {
    flex: 1,
    paddingTop: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  icon: {
    marginRight: 16,
  },
  label: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '500',
  },
});