/**
 * useStaggeredList
 *
 * Returns a helper that wraps each list item in a staggered spring entrance.
 * Items slide up from +20px and fade in, each 50ms after the previous.
 *
 * Usage:
 *   const { StaggerItem } = useStaggeredList(items.length);
 *
 *   {items.map((item, index) => (
 *     <StaggerItem key={item.id} index={index}>
 *       <RequestCard {...item} />
 *     </StaggerItem>
 *   ))}
 *
 * Optional props on StaggerItem:
 *   delay    — base delay before the stagger chain starts (default 0)
 *   distance — how far items slide from (default 20)
 */

import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

const STAGGER_INTERVAL = 50; // ms between each item

function StaggerItem({ index, delay = 0, distance = 20, children, style }) {
  const translateY = useRef(new Animated.Value(distance)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const totalDelay = delay + index * STAGGER_INTERVAL;

    // Two separate animations — translateY uses native driver, opacity too.
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        delay: totalDelay,
        damping: 18,
        mass: 0.9,
        stiffness: 160,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        delay: totalDelay,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, []); // run once on mount

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

/**
 * @param {number} count — number of items in the list (used for prealloc only; not strictly required)
 */
export function useStaggeredList(count = 0) {
  return { StaggerItem };
}
