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
  const [state, setState]  = useState({ checked: false, pinExists: false });
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    if (!user || !profile) {
      setState({ checked: true, pinExists: false });
      return;
    }
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(
          `silverstone_pin_${user.uid}`
        );
        setState({
          checked: true,
          pinExists: !!stored && profile.pinSet === true,
        });
      } catch {
        setState({ checked: true, pinExists: false });
      }
    })();
  }, [user?.uid, profile?.pinSet]);

  const getRoute = () => {
    if (!user || !profile)            return 'auth';
    if (profile.status === 'pending') return 'pending';
    if (!state.checked)               return 'loading';
    if (!state.pinExists)             return 'pinSetup';
    return profile.role === 'main-agent' ? 'mainAgent' : 'subAgent';
  };

  const route    = getRoute();
  const authReady = !loading && route !== 'loading';

  if (!animDone || !authReady) {
    return <SplashScreen onFinish={() => setAnimDone(true)} />;
  }

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
