// src/screens/auth/SplashScreen.jsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, Image, Animated, StyleSheet, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, fonts } from '../../constants/theme';

export default function SplashScreen({ navigation, onDone }) {
  const { theme } = useTheme();

  const dot1        = useRef(new Animated.Value(0.4)).current;
  const dot2        = useRef(new Animated.Value(0.4)).current;
  const dot3        = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.8)).current;
  const taglineY    = useRef(new Animated.Value(16)).current;
  const taglineOp   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(logoScale,   { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
    ]).start();

    // Tagline slides up after logo
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(taglineOp, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(taglineY,  { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      ]).start();
    }, 350);

    // Dots pulse
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
    <LinearGradient
      colors={[theme.gradPrimA, theme.gradPrimB]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Decorative circles */}
      <View style={s.decorTopRight} />
      <View style={s.decorBottomLeft} />

      <View style={s.center}>
        <Animated.View style={{
          opacity:    logoOpacity,
          transform:  [{ scale: logoScale }],
          alignItems: 'center',
        }}>
          <View style={s.logoTile}>
            <Image
              source={require('../../../assets/images/SilverS.png')}
              style={s.logoImage}
              resizeMode="contain"
            />
          </View>

          <Animated.View style={{
            opacity:   taglineOp,
            transform: [{ translateY: taglineY }],
            alignItems: 'center',
          }}>
            <Text style={s.wordmark}>silverstone</Text>
            <Text style={s.tagline}>FLOAT, ON DEMAND</Text>
          </Animated.View>

          <View style={s.dots}>
            <Animated.View style={[s.dot, { opacity: dot1 }]} />
            <Animated.View style={[s.dot, { opacity: dot2 }]} />
            <Animated.View style={[s.dot, { opacity: dot3 }]} />
          </View>
        </Animated.View>
      </View>

      <Text style={s.footer}>v1.0.0 · Silverstone Inc.</Text>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  decorTopRight: {
    position:        'absolute',
    width:           260,
    height:          260,
    borderRadius:    130,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top:             -80,
    right:           -80,
  },
  decorBottomLeft: {
    position:        'absolute',
    width:           180,
    height:          180,
    borderRadius:    90,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom:          -50,
    left:            -50,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoTile: {
    width:           100,
    height:          100,
    borderRadius:    radius.xl + 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         spacing.md,
    marginBottom:    spacing.lg,
  },
  logoImage: { width: '100%', height: '100%' },
  wordmark: {
    fontSize:      38,
    fontFamily:    fonts.display,
    letterSpacing: -0.8,
    color:         '#FFFFFF',
  },
  tagline: {
    fontSize:      15,
    fontFamily:    fonts.bodySemi,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color:         'rgba(255,255,255,0.75)',
    marginTop:     spacing.sm,
  },
  dots: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl + spacing.md },
  dot:  { width: 9, height: 9, borderRadius: 5, backgroundColor: '#FFFFFF' },
  footer: {
    fontSize:      14,
    fontFamily:    fonts.body,
    letterSpacing: 0.4,
    textAlign:     'center',
    color:         'rgba(255,255,255,0.55)',
    paddingBottom: spacing.xl,
  },
});
