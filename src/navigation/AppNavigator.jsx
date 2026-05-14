// src/navigation/AppNavigator.jsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import AuthNavigator from './AuthNavigator';
import SubAgentNavigator from './SubAgentNavigator';
import MainAgentNavigator from './MainAgentNavigator';

import SplashScreen from '../screens/auth/SplashScreen';
import PinEntryScreen from '../screens/auth/PinEntryScreen';
import PinSetupScreen from '../screens/auth/PinSetupScreen';
import ForgotPinScreen from '../screens/auth/ForgotPinScreen';

export default function AppNavigator() {
  const { user, profile, authLoading, sessionLocked, unlockSession, checkPinExists } = useAuth();
  const { theme, isDark } = useTheme();

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
  }, [user?.uid, profile?.pinSet, profile?.status]);

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

  // Loading
  if (authLoading || (user && profile && checking)) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // No user
  if (!user) {
    return (
      <NavigationContainer theme={navTheme}>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  // Profile loading
  if (!profile) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Pending or rejected
  if (profile.status === 'pending' || profile.status === 'rejected') {
    return (
      <NavigationContainer theme={navTheme}>
        <AuthNavigator initialRoute={profile.status} />
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

  // Session locked
  if (sessionLocked) {
    return (
      <View style={styles.root}>
        <NavigationContainer theme={navTheme}>
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
                  setPinVerified(true);
                }}
              />
            : <PinEntryScreen
                isSessionUnlock
                onSuccess={() => setPinVerified(true)}
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
      <NavigationContainer theme={navTheme}>
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