// src/screens/auth/SplashScreen.jsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, Image, Animated, StyleSheet, StatusBar,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function SplashScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1, duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1, tension: 60, friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Dot pulse loop
    const pulse = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 0.9, duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3, duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();

    pulse(dot1, 0);
    pulse(dot2, 200);
    pulse(dot3, 400);

    // Auto advance after 1800ms
    const timer = setTimeout(() => {
      navigation.replace('RoleSelect');
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      {/* Center content */}
      <View style={styles.center}>
        <Animated.View style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
          alignItems: 'center',
        }}>
          {/* Logo tile */}
          <View style={styles.logoTile}>
            <Image
              source={require('../../../assets/images/SilverS.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Wordmark */}
          <Text style={[styles.wordmark, { color: theme.text }]}>
            silverstone
          </Text>

          {/* Tagline */}
          <Text style={[styles.tagline, { color: theme.textDim }]}>
            FLOAT, ON DEMAND
          </Text>

          {/* Dots */}
          <View style={styles.dots}>
            <Animated.View style={[styles.dot, { opacity: dot1 }]} />
            <Animated.View style={[styles.dot, { opacity: dot2 }]} />
            <Animated.View style={[styles.dot, { opacity: dot3 }]} />
          </View>
        </Animated.View>
      </View>

      {/* Footer */}
      <Text style={[styles.footer, { color: theme.textDim }]}>
        v1.0.0 · Silverstone Inc.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTile: {
    width:           96,
    height:          96,
    borderRadius:    22,
    backgroundColor: '#C8102E',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         16,
  },
  logoImage: {
    width:  '100%',
    height: '100%',
  },
  wordmark: {
    fontSize:      30,
    fontWeight:    '800',
    letterSpacing: -0.8,
    marginTop:     28,
  },
  tagline: {
    fontSize:      13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop:     8,
  },
  dots: {
    flexDirection: 'row',
    gap:           6,
    marginTop:     40,
  },
  dot: {
    width:           7,
    height:          7,
    borderRadius:    4,
    backgroundColor: '#C8102E',
  },
  footer: {
    fontSize:      11,
    letterSpacing: 0.4,
    textAlign:     'center',
    paddingBottom: 24,
  },
});