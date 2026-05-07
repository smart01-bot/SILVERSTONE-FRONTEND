import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCKOUT_KEY  = 'silverstone_pin_lockout';
const ATTEMPTS_KEY = 'silverstone_pin_attempts';
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 min

export const recordFailedAttempt = async () => {
  const raw      = await AsyncStorage.getItem(ATTEMPTS_KEY);
  const attempts = parseInt(raw ?? '0', 10) + 1;
  await AsyncStorage.setItem(ATTEMPTS_KEY, attempts.toString());
  if (attempts >= MAX_ATTEMPTS) {
    const lockUntil = Date.now() + LOCKOUT_DURATION;
    await AsyncStorage.setItem(LOCKOUT_KEY, lockUntil.toString());
    return { locked: true, lockUntil };
  }
  return { locked: false, attemptsRemaining: MAX_ATTEMPTS - attempts };
};

export const checkLockout = async () => {
  const raw = await AsyncStorage.getItem(LOCKOUT_KEY);
  if (!raw) return { locked: false };
  const lockUntil = parseInt(raw, 10);
  if (Date.now() < lockUntil) return { locked: true, lockUntil };
  await AsyncStorage.multiRemove([LOCKOUT_KEY, ATTEMPTS_KEY]);
  return { locked: false };
};

export const clearLockout = async () => {
  await AsyncStorage.multiRemove([LOCKOUT_KEY, ATTEMPTS_KEY]);
};
