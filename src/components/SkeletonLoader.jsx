import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';

function Skeleton({ width, height, borderRadius, style }) {
  const { isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={[
      { width, height, borderRadius, backgroundColor: isDark ? '#222222' : '#EBEBEB', opacity },
      style,
    ]} />
  );
}

export function SkeletonText({ width = '80%', style }) {
  return <Skeleton width={width} height={14} borderRadius={4} style={style} />;
}
export function SkeletonCard({ style }) {
  return <Skeleton width="100%" height={80} borderRadius={16} style={style} />;
}
export function SkeletonCircle({ size = 40, style }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />;
}
export function SkeletonHero({ style }) {
  return <Skeleton width="100%" height={160} borderRadius={20} style={style} />;
}
