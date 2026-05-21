// src/screens/auth/RoleSelectScreen.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, StatusBar, SafeAreaView,
  Image, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }    from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';
import PressableScale  from '../../components/PressableScale';

const ROLES = [
  { id: 'main-agent', title: 'Main Agent', sub: 'Aggregator',           icon: 'shield-checkmark' },
  { id: 'sub-agent',  title: 'Agent',      sub: 'Single-till operator',  icon: 'person' },
];

function RoleCard({ role, selected, onPress, theme, index }) {
  const mountAnim = useRef(new Animated.Value(0)).current;
  const selectAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(mountAnim, {
      toValue: 1, tension: 80, friction: 10,
      delay: index * 80, useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.spring(selectAnim, {
      toValue: selected ? 1 : 0,
      tension: 200, friction: 10, useNativeDriver: false,
    }).start();
  }, [selected]);

  const borderColor = selectAnim.interpolate({
    inputRange: [0, 1], outputRange: [theme.border, theme.primary],
  });
  const bgColor = selectAnim.interpolate({
    inputRange: [0, 1], outputRange: [theme.surface, theme.primaryLight],
  });

  return (
    <Animated.View style={{
      opacity:   mountAnim,
      transform: [{ translateY: mountAnim.interpolate({ inputRange: [0,1], outputRange: [24,0] }) }],
    }}>
      <PressableScale onPress={onPress} scaleDown={0.97}>
        <Animated.View style={[s.card, { borderColor, backgroundColor: bgColor }]}>
          <View style={[s.iconPlate, {
            backgroundColor: selected ? theme.primary : theme.primaryLight,
          }]}>
            <Ionicons
              name={selected ? role.icon : `${role.icon}-outline`}
              size={28}
              color={selected ? '#fff' : theme.primary}
            />
          </View>
          <View style={s.cardText}>
            <Text style={[s.cardTitle, { color: theme.text }]}>{role.title}</Text>
            <Text style={[s.cardSub,   { color: theme.textDim }]}>{role.sub}</Text>
          </View>
          <Animated.View style={{
            opacity:   selectAnim,
            transform: [{ scale: selectAnim }],
          }}>
            <View style={[s.checkCircle, { backgroundColor: theme.primary }]}>
              <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
          </Animated.View>
          {!selected && <Ionicons name="chevron-forward" size={20} color={theme.muted} />}
        </Animated.View>
      </PressableScale>
    </Animated.View>
  );
}

export default function RoleSelectScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [selected, setSelected] = useState(null);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning.' : hour < 17 ? 'Good afternoon.' : 'Good evening.';

  const handleSelect = (roleId) => {
    setSelected(roleId);
    setTimeout(() => navigation.navigate('Login', { selectedRole: roleId }), 180);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      {/* Logo row */}
      <View style={s.logoRow}>
        <View style={s.logoTile}>
          <Image source={require('../../../assets/images/SilverS.png')} style={s.logoImg} resizeMode="contain" />
        </View>
        <Text style={[s.logoText, { color: theme.text }]}>silverstone</Text>
      </View>

      {/* Greeting */}
      <View style={s.greetingWrap}>
        <Text style={[s.greeting, { color: theme.text }]}>{greeting}</Text>
        <Text style={[s.loginAs,  { color: theme.textDim }]}>Log in as</Text>
      </View>

      {/* Role cards */}
      <View style={s.cards}>
        {ROLES.map((role, i) => (
          <RoleCard
            key={role.id}
            role={role}
            index={i}
            selected={selected === role.id}
            onPress={() => handleSelect(role.id)}
            theme={theme}
          />
        ))}
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <Text style={[s.footerText, { color: theme.textDim }]}>
          Don't have an account?{' '}
          <Text
            style={{ color: theme.primary, fontFamily: fonts.bodySemi }}
            onPress={() => navigation.navigate('Step1Phone')}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm + 2, paddingTop: spacing.xl, paddingBottom: spacing.sm,
  },
  logoTile: {
    width: 36, height: 36, borderRadius: radius.sm + 1,
    backgroundColor: '#C8102E', alignItems: 'center', justifyContent: 'center', padding: spacing.sm - 2,
  },
  logoImg:  { width: '100%', height: '100%' },
  logoText: { fontSize: 24, fontFamily: fonts.display, letterSpacing: -0.5 },

  greetingWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  greeting:     { fontSize: 36, fontFamily: fonts.display, letterSpacing: -0.5 },
  loginAs:      { fontSize: 19, fontFamily: fonts.body, marginTop: spacing.xs },

  cards: { paddingHorizontal: spacing.md, gap: spacing.md - 4 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, padding: spacing.md + 2,
    borderRadius: radius.xl, borderWidth: 1.5,
  },
  iconPlate: {
    width: 56, height: 56, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardText:    { flex: 1, gap: spacing.xs - 2 },
  cardTitle:   { fontSize: 21, fontFamily: fonts.heading },
  cardSub:     { fontSize: 17, fontFamily: fonts.body },
  checkCircle: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },

  footer:     { marginTop: 'auto', alignItems: 'center', paddingBottom: spacing.xl },
  footerText: { fontSize: 17, fontFamily: fonts.body },
});
