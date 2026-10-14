import { useReducedMotion } from './Loader';
// src/components/PressableScale.jsx
import React, { useEffect,useRef } from 'react';
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
  const reduced=useReducedMotion();
  useEffect(()=>{if(reduced||disabled){scale.stopAnimation();scale.setValue(1);}return()=>scale.stopAnimation();},[reduced,disabled,scale]);

  const onIn = () => {
    if (disabled || reduced) return;
    Animated.spring(scale, {
      toValue:         scaleDown,
      useNativeDriver: true,
      tension,
      friction,
    }).start();
  };

  const onOut = () => {
    if(reduced||disabled)return;
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
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      {...props}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}
