import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCKOUT_KEY  = 'sstone_lockout_until';
const ATTEMPTS_KEY = 'sstone_pin_attempts';
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS   = 30 * 60 * 1000;

export async function checkLockout() {
  const until = await AsyncStorage.getItem(LOCKOUT_KEY);
  if (!until) return { locked: false, remaining: 0 };
  const ms = parseInt(until) - Date.now();
  if (ms > 0) return { locked: true, remaining: ms };
  await AsyncStorage.multiRemove([LOCKOUT_KEY, ATTEMPTS_KEY]);
  return { locked: false, remaining: 0 };
}

export async function recordFailedAttempt() {
  const val      = await AsyncStorage.getItem(ATTEMPTS_KEY);
  const attempts = (parseInt(val) || 0) + 1;
  await AsyncStorage.setItem(ATTEMPTS_KEY, String(attempts));
  if (attempts >= MAX_ATTEMPTS) {
    const until = Date.now() + LOCKOUT_MS;
    await AsyncStorage.setItem(LOCKOUT_KEY, String(until));
    await AsyncStorage.setItem(ATTEMPTS_KEY, '0');
    return { locked: true, lockUntil: until, attempts };
  }
  return { locked: false, remaining: MAX_ATTEMPTS - attempts, attempts };
}

export async function clearLockout() {
  await AsyncStorage.multiRemove([LOCKOUT_KEY, ATTEMPTS_KEY]);
}
