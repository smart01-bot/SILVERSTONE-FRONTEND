// AuthNavigator.jsx — FULL REPLACEMENT (apply over existing file)
// Adds Steps 1–6, new PendingScreen, Step4aMap sub-screen

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen       from '../screens/auth/SplashScreen';
import RoleSelectScreen   from '../screens/auth/RoleSelectScreen';
import LoginScreen        from '../screens/auth/LoginScreen';
import ForgotPinScreen    from '../screens/auth/ForgotPinScreen';
import PinEntryScreen     from '../screens/auth/PinEntryScreen';
import PinSetupScreen     from '../screens/auth/PinSetupScreen';
import RejectedScreen     from '../screens/auth/RejectedScreen';

// Registration wizard
import Step1Phone         from '../screens/auth/Step1Phone';
import Step2OTP           from '../screens/auth/Step2OTP';
import Step3Personal      from '../screens/auth/Step3Personal';
import Step4Business      from '../screens/auth/Step4Business';
import Step4aMap          from '../screens/auth/Step4aMap';
import Step5Selfie        from '../screens/auth/Step5Selfie';
import Step6Review        from '../screens/auth/Step6Review';
import PendingScreen      from '../screens/auth/PendingScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash"         component={SplashScreen} />
      <Stack.Screen name="RoleSelect"     component={RoleSelectScreen} />
      <Stack.Screen name="Login"          component={LoginScreen} />
      <Stack.Screen name="ForgotPin"      component={ForgotPinScreen} />
      <Stack.Screen name="PinEntry"       component={PinEntryScreen} />
      <Stack.Screen name="PinSetup"       component={PinSetupScreen} />
      <Stack.Screen name="Rejected"       component={RejectedScreen} />

      {/* Registration wizard */}
      <Stack.Screen name="Step1Phone"     component={Step1Phone} />
      <Stack.Screen name="Step2OTP"       component={Step2OTP} />
      <Stack.Screen name="Step3Personal"  component={Step3Personal} />
      <Stack.Screen name="Step4Business"  component={Step4Business} />
      <Stack.Screen name="Step4aMap"      component={Step4aMap} />
      <Stack.Screen name="Step5Selfie"    component={Step5Selfie} />
      <Stack.Screen name="Step6Review"    component={Step6Review} />
      <Stack.Screen name="PendingScreen"  component={PendingScreen} />
    </Stack.Navigator>
  );
}
