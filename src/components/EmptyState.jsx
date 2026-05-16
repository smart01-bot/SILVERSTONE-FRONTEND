// src/components/EmptyState.jsx
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function EmptyState({
  icon     = 'document-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
}) {
  const { theme } = useTheme();
  const fadeY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(fadeY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[s.wrap, { opacity, transform: [{ translateY: fadeY }] }]}>
      <View style={[s.iconCircle, { backgroundColor: theme.primaryLight }]}>
        <Ionicons name={icon} size={38} color={theme.primary} />
      </View>
      <Text style={[s.title, { color: theme.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[s.sub, { color: theme.textDim }]}>{subtitle}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          style={[s.btn, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
        >
          <Text style={s.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignItems:      'center',
    paddingTop:      60,
    paddingBottom:   40,
    paddingHorizontal: 32,
    gap:             14,
  },
  iconCircle: {
    width:          80,
    height:         80,
    borderRadius:   40,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   4,
  },
  title: {
    fontSize:      22,
    fontWeight:    '800',
    textAlign:     'center',
    letterSpacing: -0.3,
  },
  sub: {
    fontSize:   17,
    textAlign:  'center',
    lineHeight: 26,
  },
  btn: {
    paddingHorizontal: 28,
    paddingVertical:   14,
    borderRadius:      14,
    marginTop:         6,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 17 },
});
