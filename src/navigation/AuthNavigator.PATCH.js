/**
 * AuthNavigator.jsx — REGISTRATION STEPS WIRING PATCH
 *
 * Add these imports at the top alongside your existing screen imports:
 */

import Step1Phone  from '../screens/auth/Step1Phone';
import Step2OTP    from '../screens/auth/Step2OTP';
// (Step3–Step6 + new PendingScreen will be added in future sessions)

/**
 * Add these two Stack.Screen entries inside your Stack.Navigator.
 * Place them after RoleSelectScreen and before RegisterScreen (or wherever
 * your current registration screen sits):
 *
 *   <Stack.Screen name="Step1Phone"  component={Step1Phone}  options={{ headerShown: false }} />
 *   <Stack.Screen name="Step2OTP"    component={Step2OTP}    options={{ headerShown: false }} />
 *
 *
 * In RoleSelectScreen.jsx, change the Sub-Agent onPress from:
 *
 *   navigation.navigate('Register')     ← or whatever it currently is
 *
 * To:
 *
 *   navigation.navigate('Step1Phone')
 *
 *
 * That's the only change to AuthNavigator for this session.
 * RegisterScreen and PendingScreen stay untouched and reachable
 * until all 6 steps are built and we do the final cutover.
 */
