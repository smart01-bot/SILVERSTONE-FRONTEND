// src/navigation/AppNavigator.jsx
import SplashScreen from '../screens/auth/SplashScreen';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
//import { useTheme } from '../context/ThemeContext';
// Navigators
import AuthNavigator from './AuthNavigator';
import SubAgentNavigator from './SubAgentNavigator';
import MainAgentNavigator from './MainAgentNavigator';

// Screens rendered outside NavigationContainer
import PinEntryScreen from '../screens/auth/PinEntryScreen';
import PinSetupScreen from '../screens/auth/PinSetupScreen';
import ForgotPinScreen from '../screens/auth/ForgotPinScreen';

export default function AppNavigator() {
  const { user, profile, authLoading, sessionLocked, checkPinExists } = useAuth();
  const { theme } = useTheme();

  const [pinExists,    setPinExists]    = useState(false);
  const [checking,     setChecking]     = useState(true);
  const [pinVerified,  setPinVerified]  = useState(false);
  const [showForgot,   setShowForgot]   = useState(false);
  const [showSplash,   setShowSplash]   = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  // Re-check PIN in SecureStore whenever user or pinSet changes
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

  // Reset PIN verified when session locks
  useEffect(() => {
    if (sessionLocked) {
      setPinVerified(false);
      setShowForgot(false);
    }
  }, [sessionLocked]);

  // ── Loading spinner ───────────────────────────────────────
  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }
  if (authLoading || (user && profile && checking)) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // ── No user → show auth flow ──────────────────────────────
  if (!user) {
    return (
      <NavigationContainer
      theme={{
        dark:   isDark,
        colors: {
          primary:    theme.primary,
          background: theme.bg,
          card:       theme.surface,
          text:       theme.text,
          border:     theme.border,
          notification: theme.primary,
        },
      }}>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  // ── User exists but profile not loaded yet ────────────────
  if (!profile) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // ── Pending / Rejected → auth navigator handles these ─────
  if (profile.status === 'pending' || profile.status === 'rejected') {
    return (
      <NavigationContainer>
        <AuthNavigator initialRoute={profile.status} />
      </NavigationContainer>
    );
  }

  // ── Approved but no PIN set yet ───────────────────────────
  if (profile.status === 'approved' && !pinExists) {
    return (
      <PinSetupScreen
        onComplete={() => {
          checkPinExists().then(exists => {
            setPinExists(exists);
            setPinVerified(true);
          });
        }}
      />
    );
  }

  // ── Approved + PIN exists but not verified yet ────────────
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
        onSuccess={() => setPinVerified(true)}
        onForgotPin={() => setShowForgot(true)}
      />
    );
  }

  // ── Session locked overlay ────────────────────────────────
  if (sessionLocked) {
    return (
      <View style={styles.root}>
        <NavigationContainer>
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

  // ── Fully authenticated → correct dashboard ───────────────
  return (
    <View style={styles.root}>
      <NavigationContainer>
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