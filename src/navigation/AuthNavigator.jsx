// src/navigation/AuthNavigator.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen    from '../screens/auth/SplashScreen';
import RoleSelectScreen from '../screens/auth/RoleSelectScreen';
import LoginScreen     from '../screens/auth/LoginScreen';
import RegisterScreen  from '../screens/auth/RegisterScreen';
import PendingScreen   from '../screens/auth/PendingScreen';
import RejectedScreen  from '../screens/auth/RejectedScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator({ initialRoute }) {
  const initial = initialRoute === 'pending'
    ? 'Pending'
    : initialRoute === 'rejected'
      ? 'Rejected'
      : 'Splash';

  return (
    <Stack.Navigator
      initialRouteName={initial}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 250,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Splash"      component={SplashScreen} />
      <Stack.Screen name="RoleSelect"  component={RoleSelectScreen} />
      <Stack.Screen name="Login"       component={LoginScreen} />
      <Stack.Screen name="Register"    component={RegisterScreen} />
      <Stack.Screen name="Pending"     component={PendingScreen} />
      <Stack.Screen name="Rejected"    component={RejectedScreen} />
    </Stack.Navigator>
  );
}