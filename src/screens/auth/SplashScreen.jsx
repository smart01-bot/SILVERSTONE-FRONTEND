// src/screens/auth/SplashScreen.jsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, Image, Animated, StyleSheet, StatusBar,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function SplashScreen({ navigation }) {
  const { theme } = useTheme();
  const dot1 = useRef(new Animated.Value(0.4)).current;
  const dot2 = useRef(new Animated.Value(0.4)).current;
  const dot3 = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
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

    const pulse = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1, duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.4, duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();

    pulse(dot1, 0);
    pulse(dot2, 200);
    pulse(dot3, 400);

    const timer = setTimeout(() => {
      navigation.replace('RoleSelect');
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#C8102E" />

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
          <Text style={styles.wordmark}>silverstone</Text>

          {/* Tagline */}
          <Text style={styles.tagline}>FLOAT, ON DEMAND</Text>

          {/* Dots */}
          <View style={styles.dots}>
            <Animated.View style={[styles.dot, { opacity: dot1 }]} />
            <Animated.View style={[styles.dot, { opacity: dot2 }]} />
            <Animated.View style={[styles.dot, { opacity: dot3 }]} />
          </View>
        </Animated.View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>v1.0.0 · Silverstone Inc.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: '#C8102E',
    alignItems:      'center',
    justifyContent:  'center',
  },
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  logoTile: {
    width:           96,
    height:          96,
    borderRadius:    22,
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    color:         '#FFFFFF',
    marginTop:     28,
  },
  tagline: {
    fontSize:      13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color:         'rgba(255,255,255,0.75)',
    marginTop:     8,
  },
  dots: {
    flexDirection: 'row',
    gap:           8,
    marginTop:     40,
  },
  dot: {
    width:           9,
    height:          9,
    borderRadius:    5,
    backgroundColor: '#FFFFFF',
  },
  footer: {
    fontSize:      11,
    letterSpacing: 0.4,
    textAlign:     'center',
    color:         'rgba(255,255,255,0.6)',
    paddingBottom: 24,
  },
});