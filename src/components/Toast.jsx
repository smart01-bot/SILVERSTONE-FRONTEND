import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ICON_NAME = { success: 'checkmark-circle', error: 'close-circle', info: 'information-circle' };
const COLORS    = { success: '#16A34A', error: '#DC2626', info: '#6B7280' };

export default function Toast({ visible, message, type = 'info', onHide }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(({ finished }) => { if (finished) onHide?.(); });
  }, [visible]);

  if (!visible) return null;

  const color = COLORS[type] ?? COLORS.info;
  return (
    <Animated.View style={[styles.toast, { backgroundColor: color, opacity }]}>
      <Ionicons name={ICON_NAME[type] ?? 'information-circle'} size={20} color="#fff" />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', bottom: 80, left: 20, right: 20,
    borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    zIndex: 9999, elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6,
  },
  message: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
});
