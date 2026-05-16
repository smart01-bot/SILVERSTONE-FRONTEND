/**
 * useHaptics — centralised haptic feedback hook
 *
 * Import once per screen/component, call the named methods:
 *
 *   const haptics = useHaptics();
 *   haptics.light()     ← tab press, list row tap
 *   haptics.medium()    ← form submit, approve/reject confirm
 *   haptics.heavy()     ← destructive action (reject, force cancel)
 *   haptics.success()   ← request submitted, transfer complete
 *   haptics.warning()   ← rejected status, error flash
 *   haptics.error()     ← PIN wrong, validation fail
 *   haptics.pin()       ← each PIN digit tap
 *   haptics.selection() ← network picker, filter pill change
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Guard: simulator / web has no haptics engine — swallow silently
const safe = (fn) => async (...args) => {
  if (Platform.OS === 'web') return;
  try {
    await fn(...args);
  } catch (_) {
    // no haptics on simulator — ignore
  }
};

const H = Haptics.ImpactFeedbackStyle;
const N = Haptics.NotificationFeedbackType;

export function useHaptics() {
  return {
    light:     safe(() => Haptics.impactAsync(H.Light)),
    medium:    safe(() => Haptics.impactAsync(H.Medium)),
    heavy:     safe(() => Haptics.impactAsync(H.Heavy)),
    success:   safe(() => Haptics.notificationAsync(N.Success)),
    warning:   safe(() => Haptics.notificationAsync(N.Warning)),
    error:     safe(() => Haptics.notificationAsync(N.Error)),
    pin:       safe(() => Haptics.impactAsync(H.Light)),       // alias for clarity
    selection: safe(() => Haptics.selectionAsync()),
  };
}
