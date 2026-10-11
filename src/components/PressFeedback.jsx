import React, { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { useReducedMotion } from './Loader';

// Feedback only: invokes the supplied action once, without changing navigation or business state.
export default function PressFeedback({ children, disabled, style, containerStyle, onPressIn, onPressOut, ...props }) {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => { if (reduced || disabled) { scale.stopAnimation(); scale.setValue(1); } return () => scale.stopAnimation(); }, [reduced, disabled, scale]);
  const move = value => {
    if (reduced || disabled) return;
    scale.stopAnimation();
    Animated.spring(scale, { toValue:value, stiffness:420, damping:30, mass:0.7, useNativeDriver:true }).start();
  };
  return <Animated.View style={[containerStyle, { transform:[{scale}] }]}>
    <Pressable {...props} disabled={disabled} style={style}
      onPressIn={event => { move(0.975); onPressIn?.(event); }}
      onPressOut={event => { move(1); onPressOut?.(event); }}>{children}</Pressable>
  </Animated.View>;
}
