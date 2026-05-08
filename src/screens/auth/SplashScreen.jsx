import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

export default function SplashScreen({ onFinish }) {
  const { isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.82)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(onFinish, 2600);
    return () => clearTimeout(timer);
  }, []);

  const gradientColors = isDark
    ? ['#1C0000', '#2C0000']
    : ['#D32F2F', '#B71C1C'];

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        <Image
          source={require('../../assets/images/SilverS.png')}
          style={{ width: 180, height: 180, resizeMode: 'contain' }}
        />
      </Animated.View>
      <Animated.View style={[styles.textWrap, { opacity: textOpacity }]}>
        <Text style={styles.name}>SILVERSTONE INC.</Text>
        <Text style={styles.tagline}>Tanzania's First Float Management System</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
  },
  textWrap: {
    alignItems: 'center',
    marginTop: 32,
    gap: 8,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 3,
  },
  tagline: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    letterSpacing: 0.4,
  },
});
