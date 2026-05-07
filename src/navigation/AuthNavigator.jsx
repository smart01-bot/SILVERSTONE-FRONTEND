import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PinLoginScreen      from '../screens/auth/PinLoginScreen';
import CreateAccountScreen from '../screens/auth/CreateAccountScreen';
import PendingScreen       from '../screens/auth/PendingScreen';
import RejectedScreen      from '../screens/auth/RejectedScreen';
import PinSetupScreen      from '../screens/auth/PinSetupScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator({ initialRouteName = 'PinLogin' }) {
  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PinLogin"      component={PinLoginScreen} />
      <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
      <Stack.Screen name="Pending"       component={PendingScreen} />
      <Stack.Screen name="Rejected"      component={RejectedScreen} />
      <Stack.Screen name="PinSetup"      component={PinSetupScreen} />
    </Stack.Navigator>
  );
}
