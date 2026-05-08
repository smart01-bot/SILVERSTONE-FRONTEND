import React, { useRef } from 'react';
import { Animated, TouchableWithoutFeedback } from 'react-native';
import { lightTap } from '../utils/haptics';

export default function PressableCard({ children, onPress, onLongPress, style }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start();

  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 3 }).start();

  return (
    <TouchableWithoutFeedback
      onPress={() => { lightTap(); onPress?.(); }}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}
