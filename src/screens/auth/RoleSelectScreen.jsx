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
                size={26}
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
                size={14}
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
    paddingTop:     20,
    paddingBottom:  8,
  },
  logoTile: {
    width:           36,
    height:          36,
    borderRadius:    10,
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
    fontSize:      22,
    fontWeight:    '800',
    letterSpacing: -0.5,
  },
  greetingWrap: {
    paddingHorizontal: 24,
    paddingTop:        44,
    marginBottom:      8,
  },
  greeting: {
    fontSize:      26,
    fontWeight:    '800',
    letterSpacing: -0.6,
  },
  loginAs: {
    fontSize:  15,
    marginTop: 6,
  },
  cards: {
    padding: 20,
    gap:     14,
  },
  card: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            16,
    padding:        22,
    borderRadius:   20,
    borderWidth:    1.5,
    minHeight:      88,
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 4 },
    shadowOpacity:  0.04,
    shadowRadius:   14,
    elevation:      2,
  },
  iconPlate: {
    width:          52,
    height:         52,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize:      17,
    fontWeight:    '800',
    letterSpacing: -0.3,
  },
  cardSub: {
    fontSize:   13,
    fontWeight: '500',
    marginTop:  4,
  },
  arrowCircle: {
    width:          28,
    height:         28,
    borderRadius:   14,
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