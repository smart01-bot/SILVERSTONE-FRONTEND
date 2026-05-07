import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CreateAccountScreen from '../screens/auth/CreateAccountScreen';
import PendingScreen       from '../screens/auth/PendingScreen';
import PinSetupScreen      from '../screens/auth/PinSetupScreen';
import PinLoginScreen      from '../screens/auth/PinLoginScreen';
import ForgotPinScreen     from '../screens/auth/ForgotPinScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator({ initialRouteName = 'PinLogin' }) {
  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PinLogin"      component={PinLoginScreen} />
      <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
      <Stack.Screen name="Pending"       component={PendingScreen} />
      <Stack.Screen name="PinSetup"      component={PinSetupScreen} />
      <Stack.Screen name="ForgotPin"     component={ForgotPinScreen} />
    </Stack.Navigator>
  );
}
