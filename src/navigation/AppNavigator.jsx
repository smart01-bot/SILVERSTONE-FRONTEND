import React, { useEffect, useState } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator      from './AuthNavigator';
import SubAgentNavigator  from './SubAgentNavigator';
import MainAgentNavigator from './MainAgentNavigator';
import SplashScreen       from '../screens/auth/SplashScreen';
import * as SecureStore   from 'expo-secure-store';

export const navigationRef = createNavigationContainerRef();

export default function AppNavigator() {
  const { user, profile, loading } = useAuth();
  const [pinChecked, setPinChecked] = useState(false);
  const [pinSet, setPinSet]         = useState(false);
  const [animDone, setAnimDone]     = useState(false);

  useEffect(() => {
    if (!user) { setPinChecked(false); setPinSet(false); return; }
    (async () => {
      const stored = await SecureStore.getItemAsync(`silverstone_pin_${user.uid}`);
      setPinSet(!!stored);
      setPinChecked(true);
    })();
  }, [user]);

  const authReady = !loading && !(user && !pinChecked);

  if (!animDone || !authReady) {
    return (
      <SplashScreen
        onFinish={() => setAnimDone(true)}
      />
    );
  }

  const getInitialRoute = () => {
    if (!user || !profile)           return 'auth';
    if (profile.status === 'pending') return 'pending';
    if (!profile.pinSet || !pinSet)   return 'pinSetup';
    return profile.role === 'main-agent' ? 'mainAgent' : 'subAgent';
  };

  const route = getInitialRoute();

  return (
    <NavigationContainer ref={navigationRef}>
      {route === 'auth'      && <AuthNavigator />}
      {route === 'pending'   && <AuthNavigator initialRouteName="Pending" />}
      {route === 'pinSetup'  && <AuthNavigator initialRouteName="PinSetup" />}
      {route === 'subAgent'  && <SubAgentNavigator />}
      {route === 'mainAgent' && <MainAgentNavigator />}
    </NavigationContainer>
  );
}