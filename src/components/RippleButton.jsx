/**
 * RippleButton
 *
 * Gives native Android ripple feedback while keeping Opacity fallback on iOS.
 * Drop-in replacement for TouchableOpacity on pressable rows/cards/buttons.
 *
 * Usage:
 *   <RippleButton onPress={fn} style={styles.card}>
 *     <Text>...</Text>
 *   </RippleButton>
 *
 * Props:
 *   onPress       — required
 *   style         — outer container style
 *   rippleColor   — defaults to theme.primary at 20% opacity
 *   borderless    — false by default; true for round icon buttons
 *   disabled
 *   children
 */

import React from 'react';
import {
  Platform,
  TouchableNativeFeedback,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function RippleButton({
  onPress,
  onLongPress,
  style,
  rippleColor,
  borderless = false,
  disabled = false,
  children,
}) {
  const { theme } = useTheme();
  const color = rippleColor ?? theme.primary + '33'; // 20% alpha

  if (Platform.OS === 'android') {
    return (
      <TouchableNativeFeedback
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        background={TouchableNativeFeedback.Ripple(color, borderless)}
        useForeground={TouchableNativeFeedback.canUseNativeForeground()}
      >
        {/* TNF requires a single non-Text child with overflow hidden */}
        <View style={[styles.wrapper, style]}>{children}</View>
      </TouchableNativeFeedback>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={style}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden', // clips the ripple to the card boundary
  },
});
