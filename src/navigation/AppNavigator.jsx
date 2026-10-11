// src/navigation/AppNavigator.jsx
import React, { useEffect, useState } from 'react';
import { createNavigationContainerRef } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { canOperate } from '../api/presentation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ScreenLoader } from '../components/Loader';
import { AuthFrame, AuthHeading, AuthNotice, AuthButton, useAuthStyle } from '../components/auth/AuthUI';

import AuthNavigator from './AuthNavigator';
import SubAgentNavigator from './SubAgentNavigator';
import MainAgentNavigator from './MainAgentNavigator';

import SplashScreen    from '../screens/auth/SplashScreen';
import PinEntryScreen  from '../screens/auth/PinEntryScreen';
import PinSetupScreen  from '../screens/auth/PinSetupScreen';
import ForgotPinScreen from '../screens/auth/ForgotPinScreen';

// Exported so useNotifications can drive navigation from outside the tree
export const navigationRef = createNavigationContainerRef();

export default function AppNavigator() {
  const { user, profile, authLoading, sessionLocked, unlockSession, checkPinExists, connectionError, retryConnection } = useAuth();
  const { theme, isDark } = useTheme();
  const { copy } = useAuthStyle();

  const [pinExists,   setPinExists]   = useState(false);
  const [checking,    setChecking]    = useState(true);
  const [pinVerified, setPinVerified] = useState(false);
  const [showForgot,  setShowForgot]  = useState(false);
  const [showSplash,  setShowSplash]  = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user || !profile) {
      setPinExists(false);
      setPinVerified(false);
      setChecking(false);
      return;
    }
    setChecking(true);
    checkPinExists().then(exists => {
      setPinExists(exists);
      setChecking(false);
    });
  }, [user?.id, profile?.pinSet, profile?.status]);

  useEffect(() => {
    if (sessionLocked) {
      setPinVerified(false);
      setShowForgot(false);
    }
  }, [sessionLocked]);

  const navTheme = {
    dark: isDark,
    colors: {
      primary:      theme.primary,
      background:   theme.bg,
      card:         theme.surface,
      text:         theme.text,
      border:       theme.border,
      notification: theme.primary,
    },
  };

  // Always show splash first
  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }

  // Loading — auth resolving or profile fetching
  if (authLoading || (user && profile && checking)) {
    return <ScreenLoader />;
  }

  if (connectionError) {
    return <AuthFrame>
      <AuthHeading title={copy('Let’s reconnect.', 'Tuunganishe tena.')} description={copy('We couldn’t restore your account connection.', 'Hatukuweza kurejesha muunganisho wa akaunti yako.')} />
      <AuthNotice error>{connectionError}</AuthNotice>
      <AuthButton label={copy('Try again', 'Jaribu tena')} onPress={retryConnection} />
    </AuthFrame>;
  }

  // No retained account — show email/password. Registration stays available from Login.
  if (!user) {
    return (
      <NavigationContainer ref={navigationRef} theme={navTheme}>
        <AuthNavigator initialRoute="Login" />
      </NavigationContainer>
    );
  }

  // Profile loading
  // Profile still fetching — show blank bg, login overlay already handled the visual
  if (!profile) {
    return <ScreenLoader />;
  }

  // Pending or rejected
  if (!canOperate(profile)) {
    return (
      <NavigationContainer ref={navigationRef} theme={navTheme}>
        <AuthNavigator key={profile.applicationStatus} initialRoute="pending" />
      </NavigationContainer>
    );
  }

  // No PIN yet
  if (profile.status === 'approved' && !pinExists) {
    return (
      <PinSetupScreen
        onComplete={() => {
          setShowForgot(false);
          unlockSession();
          checkPinExists().then(exists => {
            setPinExists(exists);
            setPinVerified(true);
          });
        }}
      />
    );
  }

  // PIN not verified yet
  if (profile.status === 'approved' && pinExists && !pinVerified) {
    if (showForgot) {
      return (
        <ForgotPinScreen
          onBack={() => setShowForgot(false)}
          onComplete={() => {
            setShowForgot(false);
            checkPinExists().then(exists => {
              setPinExists(exists);
              setPinVerified(true);
            });
          }}
        />
      );
    }
    return (
      <PinEntryScreen
        onSuccess={() => { setPinVerified(true); unlockSession(); }}
        onForgotPin={() => setShowForgot(true)}
      />
    );
  }

  // Session locked — nav tree renders behind PIN overlay so ref is always mounted
  if (sessionLocked) {
    return (
      <View style={styles.root}>
        <NavigationContainer ref={navigationRef} theme={navTheme}>
          {profile.role === 'main-agent'
            ? <MainAgentNavigator />
            : <SubAgentNavigator />}
        </NavigationContainer>
        <View style={StyleSheet.absoluteFillObject}>
          {showForgot
            ? <ForgotPinScreen
                onBack={() => setShowForgot(false)}
                onComplete={() => {
                  setShowForgot(false);
                  setPinVerified(false);
                  unlockSession();
                }}
              />
            : <PinEntryScreen
                isSessionUnlock
                onSuccess={() => { setPinVerified(true); unlockSession(); }}
                onForgotPin={() => setShowForgot(true)}
              />
          }
        </View>
      </View>
    );
  }

  // Fully authenticated
  return (
    <View style={styles.root}>
      <NavigationContainer ref={navigationRef} theme={navTheme}>
        {profile.role === 'main-agent'
          ? <MainAgentNavigator />
          : <SubAgentNavigator />}
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});