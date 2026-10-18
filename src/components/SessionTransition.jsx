import React, { useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, StyleSheet } from 'react-native';
import { useReducedMotion } from './Loader';

// Animate the incoming route only. Never retain a signed-out or locked screen,
// duplicate navigation trees, or delay an authentication state change for motion.
export default function SessionTransition({ stage, enabled = true, children }) {
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(1)).current;
  const previousStage = useRef(stage);
  const [entering, setEntering] = useState(false);

  useLayoutEffect(() => {
    const changed = previousStage.current !== stage;
    previousStage.current = stage;
    progress.stopAnimation();
    if (changed) Keyboard.dismiss();
    if (!changed || !enabled || reducedMotion) {
      progress.setValue(1);
      setEntering(false);
      return;
    }

    // Reset before paint, so the new screen cannot flash at full opacity.
    progress.setValue(0);
    setEntering(true);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 280,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
      isInteraction: false,
    });
    let active = true;
    animation.start(({ finished }) => { if (active && finished) setEntering(false); });
    return () => { active = false; animation.stop(); };
  }, [stage, enabled, reducedMotion, progress]);

  return <Animated.View testID="session-transition" pointerEvents={entering ? 'none' : 'auto'}
    style={[styles.fill, {
      opacity: progress,
      transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
    }]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
