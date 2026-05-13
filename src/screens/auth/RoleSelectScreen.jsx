// src/screens/auth/RoleSelectScreen.jsx
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const ROLES = [
  {
    id:    'main-agent',
    title: 'Main Agent',
    sub:   'Aggregator',
    icon:  'shield-checkmark',
  },
  {
    id:    'sub-agent',
    title: 'Agent',
    sub:   'Single-till operator',
    icon:  'person',
  },
];

export default function RoleSelectScreen({ navigation }) {
  const { theme, isDark } = useTheme();

  const hour     = new Date().getHours();
  const greeting = hour < 12
    ? 'Good morning.'
    : hour < 17
      ? 'Good afternoon.'
      : 'Good evening.';

  const handleSelect = (roleId) => {
    navigation.navigate('Login', { selectedRole: roleId });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

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

      {/* Greeting */}
      <View style={styles.greetingWrap}>
        <Text style={[styles.greeting, { color: theme.text }]}>
          {greeting}
        </Text>
        <Text style={[styles.loginAs, { color: theme.textDim }]}>
          Log in as
        </Text>
      </View>

      {/* Role cards */}
      <View style={styles.cards}>
        {ROLES.map(role => (
          <TouchableOpacity
            key={role.id}
            onPress={() => handleSelect(role.id)}
            activeOpacity={0.75}
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor:     theme.border,
              },
            ]}
          >
            {/* Icon plate */}
            <View style={[
              styles.iconPlate,
              { backgroundColor: theme.primaryLight },
            ]}>
              <Ionicons
                name={`${role.icon}-outline`}
                size={20}
                color={theme.primary}
              />
            </View>

            {/* Text */}
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {role.title}
              </Text>
              <Text style={[styles.cardSub, { color: theme.textDim }]}>
                {role.sub}
              </Text>
            </View>

            {/* Arrow */}
            <View style={[
              styles.arrowCircle,
              { backgroundColor: theme.surfaceAlt },
            ]}>
              <Ionicons
                name="arrow-forward"
                size={12}
                color={theme.text}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { backgroundColor: theme.border }]} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  logoRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            10,
    paddingTop:     14,
    paddingBottom:  8,
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
  logoImg: {
    width:  '100%',
    height: '100%',
  },
  logoText: {
    fontSize:      20,
    fontWeight:    '800',
    letterSpacing: -0.5,
  },
  greetingWrap: {
    paddingHorizontal: 22,
    paddingTop:        40,
    marginBottom:      8,
  },
  greeting: {
    fontSize:      22,
    fontWeight:    '800',
    letterSpacing: -0.6,
  },
  loginAs: {
    fontSize:   14,
    marginTop:  6,
  },
  cards: {
    padding: 18,
    gap:     10,
  },
  card: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            12,
    padding:        14,
    borderRadius:   16,
    borderWidth:    1.5,
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 4 },
    shadowOpacity:  0.04,
    shadowRadius:   14,
    elevation:      2,
  },
  iconPlate: {
    width:          38,
    height:         38,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize:      15,
    fontWeight:    '800',
    letterSpacing: -0.3,
  },
  cardSub: {
    fontSize:   11,
    fontWeight: '500',
    marginTop:  2,
  },
  arrowCircle: {
    width:          24,
    height:         24,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  bottomBar: {
    width:         40,
    height:        4,
    borderRadius:  2,
    alignSelf:     'center',
    marginTop:     'auto',
    marginBottom:  20,
  },
});