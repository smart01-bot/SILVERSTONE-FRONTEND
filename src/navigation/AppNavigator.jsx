import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AuthNavigator      from './AuthNavigator';
import SubAgentNavigator  from './SubAgentNavigator';
import MainAgentNavigator from './MainAgentNavigator';
import PinEntryScreen     from '../screens/auth/PinEntryScreen';
import ForgotPinScreen    from '../screens/auth/ForgotPinScreen';

export const navigationRef = createNavigationContainerRef();

// Isolated stack used only when the session is locked (background timeout or cold start)
const LockStack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, profile, authLoading, sessionLocked, checkPinExists } = useAuth();
  const { theme } = useTheme();
  const [pinExists,  setPinExists]  = useState(false);
  const [pinChecked, setPinChecked] = useState(false);

  // Re-check SecureStore whenever uid or pinSet flag changes
  useEffect(() => {
    if (!user || !profile) {
      setPinExists(false);
      setPinChecked(false);
      return;
    }
    (async () => {
      const exists = await checkPinExists();
      setPinExists(exists);
      setPinChecked(true);
    })();
  }, [user?.uid, profile?.pinSet]);

  // ── Loading ───────────────────────────────────────────────
  if (authLoading || (user && profile && !pinChecked)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // ── Session locked — full-screen PIN overlay ──────────────
  // Covers both cold-start (pinSet on device) and >5-min background timeout
  if (sessionLocked && user && profile) {
    return (
      <NavigationContainer independent>
        <LockStack.Navigator screenOptions={{ headerShown: false }}>
          <LockStack.Screen
            name="PinEntry"
            children={(props) => <PinEntryScreen {...props} isSessionUnlock />}
          />
          <LockStack.Screen name="ForgotPin" component={ForgotPinScreen} />
        </LockStack.Navigator>
      </NavigationContainer>
    );
  }

  // ── Normal routing ────────────────────────────────────────
  const getScreen = () => {
    if (!user || !profile)            return 'auth';
    if (profile.status === 'pending') return 'pending';
    if (profile.status === 'rejected')return 'rejected';
    if (!pinExists)                   return 'pinSetup';
    return profile.role === 'main-agent' ? 'mainAgent' : 'subAgent';
  };

  const screen = getScreen();

  return (
    <NavigationContainer ref={navigationRef}>
      {screen === 'auth'      && <AuthNavigator />}
      {screen === 'pending'   && <AuthNavigator initialRouteName="Pending" />}
      {screen === 'rejected'  && <AuthNavigator initialRouteName="Rejected" />}
      {screen === 'pinSetup'  && <AuthNavigator initialRouteName="PinSetup" />}
      {screen === 'subAgent'  && <SubAgentNavigator />}
      {screen === 'mainAgent' && <MainAgentNavigator />}
    </NavigationContainer>
  );
}
