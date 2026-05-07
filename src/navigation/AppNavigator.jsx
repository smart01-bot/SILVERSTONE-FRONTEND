import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { useAuth }  from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import AuthNavigator      from './AuthNavigator';
import SubAgentNavigator  from './SubAgentNavigator';
import MainAgentNavigator from './MainAgentNavigator';

import PendingScreen   from '../screens/auth/PendingScreen';
import RejectedScreen  from '../screens/auth/RejectedScreen';
import PinSetupScreen  from '../screens/auth/PinSetupScreen';
import PinEntryScreen  from '../screens/auth/PinEntryScreen';
import ForgotPinScreen from '../screens/auth/ForgotPinScreen';

export const navigationRef = createNavigationContainerRef();

export default function AppNavigator() {
  const { user, profile, authLoading, sessionLocked, checkPinExists } = useAuth();
  const { theme } = useTheme();

  const [pinExists,        setPinExists]        = useState(false);
  const [checking,         setChecking]         = useState(true);
  const [lockOverlayScreen, setLockOverlayScreen] = useState('pin');

  // Check SecureStore whenever user/profile changes
  useEffect(() => {
    if (!user || !profile) {
      setPinExists(false);
      setChecking(false);
      return;
    }
    setChecking(true);
    checkPinExists().then(exists => {
      setPinExists(exists);
      setChecking(false);
    });
  }, [user?.uid, profile?.pinSet, profile?.status]);

  // Reset overlay to PIN screen whenever the lock appears
  useEffect(() => {
    if (sessionLocked) setLockOverlayScreen('pin');
  }, [sessionLocked]);

  // ── Loading ───────────────────────────────────────────────
  if (authLoading || (user && profile && checking)) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // ── Unauthenticated ───────────────────────────────────────
  if (!user) {
    return (
      <NavigationContainer ref={navigationRef}>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  // ── Profile not yet loaded ────────────────────────────────
  if (!profile) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // ── Pending / Rejected (no navigator needed) ──────────────
  if (profile.status === 'pending')  return <PendingScreen />;
  if (profile.status === 'rejected') return <RejectedScreen />;

  // ── Approved: PIN setup (no PIN yet) ─────────────────────
  if (profile.status === 'approved' && !pinExists) {
    return <PinSetupScreen />;
  }

  // ── Approved: dashboard + PIN overlay when locked ─────────
  const showPinOverlay = sessionLocked && profile.status === 'approved' && pinExists;

  return (
    <View style={styles.root}>
      <NavigationContainer ref={navigationRef}>
        {profile.role === 'main-agent'
          ? <MainAgentNavigator />
          : <SubAgentNavigator />}
      </NavigationContainer>

      {showPinOverlay && (
        <View style={StyleSheet.absoluteFillObject}>
          {lockOverlayScreen === 'forgot'
            ? <ForgotPinScreen onBack={() => setLockOverlayScreen('pin')} />
            : <PinEntryScreen
                isSessionUnlock
                onForgotPin={() => setLockOverlayScreen('forgot')}
              />
          }
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
