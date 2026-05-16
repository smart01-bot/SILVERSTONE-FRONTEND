/**
 * Silverstone — Dev / Mock Config
 *
 * Flip USE_MOCK to `false` when you want live Firestore data,
 * or set the right-hand side to `false` permanently for production builds.
 *
 * `__DEV__` is automatically `false` in Expo production builds,
 * so mock data can never leak to prod even if you forget to flip the flag.
 */

export const USE_MOCK = __DEV__ && true;
