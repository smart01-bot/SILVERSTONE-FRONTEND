import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AuthNavigator      from './AuthNavigator';
import SubAgentNavigator  from './SubAgentNavigator';
import MainAgentNavigator from './MainAgentNavigator';
import * as SecureStore   from 'expo-secure-store';

export default function AppNavigator() {
  const { user, profile, loading } = useAuth();
  const { theme } = useTheme();
  const [pinChecked, setPinChecked] = useState(false);
  const [pinSet, setPinSet]         = useState(false);

  useEffect(() => {
    if (!user) { setPinChecked(false); setPinSet(false); return; }
    (async () => {
      const stored = await SecureStore.getItemAsync(`silverstone_pin_${user.uid}`);
      setPinSet(!!stored);
      setPinChecked(true);
    })();
  }, [user]);

  if (loading || (user && !pinChecked)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const getInitialRoute = () => {
    if (!user || !profile)           return 'auth';
    if (profile.status === 'pending') return 'pending';
    if (!pinSet)                      return 'pinSetup';
    return profile.role === 'main-agent' ? 'mainAgent' : 'subAgent';
  };

  const route = getInitialRoute();

  return (
    <NavigationContainer>
      {route === 'auth'      && <AuthNavigator />}
      {route === 'pending'   && <AuthNavigator initialRouteName="Pending" />}
      {route === 'pinSetup'  && <AuthNavigator initialRouteName="PinSetup" />}
      {route === 'subAgent'  && <SubAgentNavigator />}
      {route === 'mainAgent' && <MainAgentNavigator />}
    </NavigationContainer>
  );
}