// src/components/PressableScale.jsx
import React, { useRef } from 'react';
import { Animated, TouchableOpacity } from 'react-native';

/**
 * PressableScale — drop-in replacement for TouchableOpacity.
 * Adds a spring scale-down on press for tactile feedback.
 *
 * Props:
 *   scaleDown  — how far to scale (default 0.96)
 *   tension    — spring tension (default 280)
 *   friction   — spring friction (default 10)
 *   style      — applied to the Animated.View wrapper
 *   All other TouchableOpacity props pass through.
 */
export default function PressableScale({
  children,
  onPress,
  onLongPress,
  style,
  scaleDown = 0.96,
  tension   = 280,
  friction  = 10,
  disabled  = false,
  ...props
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue:         scaleDown,
      useNativeDriver: true,
      tension,
      friction,
    }).start();
  };

  const onOut = () => {
    Animated.spring(scale, {
      toValue:         1,
      useNativeDriver: true,
      tension,
      friction,
    }).start();
  };

  return (
    <TouchableOpacity
      onPressIn={onIn}
      onPressOut={onOut}
      onPress={disabled ? undefined : onPress}
      onLongPress={onLongPress}
      activeOpacity={1}
      disabled={disabled}
      {...props}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}
