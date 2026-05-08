import * as Haptics from 'expo-haptics';

// Light tap — regular buttons, nav taps
export const lightTap = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
};

// Medium tap — form submits, toggles
export const mediumTap = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {}
};

// Heavy tap — destructive actions
export const heavyTap = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {}
};

// Success — completed transfer, approved, PIN correct
export const successTap = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
};

// Error — wrong PIN, validation error, rejected
export const errorTap = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {}
};

// Warning — urgent request, lockout warning
export const warningTap = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {}
};
