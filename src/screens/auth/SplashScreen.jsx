// src/screens/auth/SplashScreen.jsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, Image, Animated, StyleSheet, StatusBar,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';

export default function SplashScreen({ navigation, onDone }) {
  const { theme } = useTheme();
  const dot1 = useRef(new Animated.Value(0.4)).current;
  const dot2 = useRef(new Animated.Value(0.4)).current;
  const dot3 = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(logoScale,   { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();

    const pulse = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1,   duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.4, duration: 400, useNativeDriver: true }),
        ])
      ).start();

    pulse(dot1, 0);
    pulse(dot2, 200);
    pulse(dot3, 400);

    const timer = setTimeout(() => {
      onDone ? onDone() : navigation?.replace('RoleSelect');
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#C8102E" />

      <View style={s.center}>
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }], alignItems: 'center' }}>
          <View style={s.logoTile}>
            <Image
              source={require('../../../assets/images/SilverS.png')}
              style={s.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={s.wordmark}>silverstone</Text>
          <Text style={s.tagline}>FLOAT, ON DEMAND</Text>
          <View style={s.dots}>
            <Animated.View style={[s.dot, { opacity: dot1 }]} />
            <Animated.View style={[s.dot, { opacity: dot2 }]} />
            <Animated.View style={[s.dot, { opacity: dot3 }]} />
          </View>
        </Animated.View>
      </View>

      <Text style={s.footer}>v1.0.0 · Silverstone Inc.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: '#C8102E',
    alignItems:      'center',
    justifyContent:  'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoTile: {
    width:           96,
    height:          96,
    borderRadius:    radius.xl + 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         spacing.md,
  },
  logoImage: { width: '100%', height: '100%' },
  wordmark: {
    fontSize:      36,
    fontFamily:    fonts.display,
    letterSpacing: -0.8,
    color:         '#FFFFFF',
    marginTop:     spacing.lg + 4,
  },
  tagline: {
    fontSize:      15,
    fontFamily:    fonts.bodySemi,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color:         'rgba(255,255,255,0.75)',
    marginTop:     spacing.sm,
  },
  dots: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl + spacing.sm },
  dot:  { width: 9, height: 9, borderRadius: 5, backgroundColor: '#FFFFFF' },
  footer: {
    fontSize:      14,
    fontFamily:    fonts.body,
    letterSpacing: 0.4,
    textAlign:     'center',
    color:         'rgba(255,255,255,0.6)',
    paddingBottom: spacing.lg,
  },
});
