// src/navigation/AppNavigator.jsx
import React, { useEffect, useRef, useState } from 'react';
import { createNavigationContainerRef } from '@react-navigation/native';
import { Animated, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { canOperate } from '../api/presentation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ScreenLoader } from '../components/Loader';
import { agentColors } from '../components/agent/agentTheme';
import { AgentConfirmDialog } from '../components/agent/AgentConfirmDialog';
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

export default function AppNavigator({ fontsReady = true }) {
  const { user, profile, authLoading, sessionLocked, unlockSession, checkPinExists, connectionError, retryConnection, logoutError, dismissLogoutError } = useAuth();
  const { theme, isDark, themeReady } = useTheme();
  const { copy } = useAuthStyle();

  const [pinExists,   setPinExists]   = useState(false);
  const [checking,    setChecking]    = useState(true);
  const [pinVerified, setPinVerified] = useState(false);
  const [showForgot,  setShowForgot]  = useState(false);
  const [showSplash,  setShowSplash]  = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const contentProgress = useRef(new Animated.Value(0)).current;
  const [checkedKey, setCheckedKey] = useState(null);
  const [pinReadError, setPinReadError] = useState(false);
  const [pinRetry, setPinRetry] = useState(0);
  const pinKey = user && profile ? `${user.id}:${profile.pinSet}:${profile.status}` : null;

  useEffect(() => { setPinVerified(false); setShowForgot(false); }, [user?.id]);

  useEffect(() => {
    let active = true;
    setPinReadError(false);
    if (!user || !profile) {
      setPinExists(false);
      setPinVerified(false);
      setChecking(false);
      setCheckedKey(null);
      return;
    }
    setChecking(true);
    checkPinExists().then(exists => {
      if (!active) return;
      setPinExists(exists);
      setChecking(false);
      setCheckedKey(pinKey);
    }).catch(() => {
      if (active) { setPinReadError(true); setChecking(false); setCheckedKey(pinKey); }
    });
    return () => { active = false; };
  }, [pinKey, pinRetry]);

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

  const pinPending = Boolean(user && profile && (checking || checkedKey !== pinKey));
  const routeReady = Boolean(connectionError) || (!authLoading && !pinPending && (!user || Boolean(profile)));

  function renderRoute() {
    if (connectionError) {
      return <AuthFrame>
        <AuthHeading title={copy('Let’s reconnect.', 'Tuunganishe tena.')} description={copy('We couldn’t restore your account connection.', 'Hatukuweza kurejesha muunganisho wa akaunti yako.')} />
        <AuthNotice error>{connectionError}</AuthNotice>
        <AuthButton label={copy('Try again', 'Jaribu tena')} onPress={retryConnection} />
      </AuthFrame>;
    }

    // Loading — auth resolving or profile fetching
    if (authLoading || pinPending) {
      return <ScreenLoader />;
    }

    if (pinReadError) {
      return <AuthFrame>
        <AuthHeading title={copy('Let’s try again.', 'Tujaribu tena.')} description={copy('We couldn’t read PIN protection on this device.', 'Hatukuweza kusoma ulinzi wa PIN kwenye kifaa hiki.')} />
        <AuthButton label={copy('Try again', 'Jaribu tena')} onPress={() => { setChecking(true); setPinRetry(value => value + 1); }} />
      </AuthFrame>;
    }

    // New or signed-out users choose their role; retained accounts still use PIN.
    if (!user) {
      return (
        <NavigationContainer ref={navigationRef} theme={navTheme}>
          <AuthNavigator initialRoute="RoleSelect" />
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

  return <View style={[styles.root, { backgroundColor: agentColors(isDark).bg }]}>
    <Animated.View style={[styles.root, { opacity: showSplash ? contentProgress : 1,
      transform: [{ translateY: showSplash && !reducedMotion ? contentProgress.interpolate({ inputRange: [0, 1], outputRange: [7, 0] }) : 0 }],
    }]} pointerEvents={showSplash ? 'none' : 'auto'} accessibilityElementsHidden={showSplash}
      importantForAccessibility={showSplash ? 'no-hide-descendants' : 'auto'}>
      {fontsReady && themeReady ? renderRoute() : null}
    </Animated.View>
    {logoutError ? <AgentConfirmDialog visible icon="log-out-outline" hideCancel
      title={copy('Sign out failed', 'Imeshindikana kuondoka')} description={logoutError}
      confirmLabel={copy('Got it', 'Nimeelewa')} onCancel={dismissLogoutError} onConfirm={dismissLogoutError} /> : null}
    {showSplash ? <View style={StyleSheet.absoluteFillObject}>
      <SplashScreen ready={routeReady} resourcesReady={fontsReady && themeReady}
        contentProgress={contentProgress} onMotionPreference={setReducedMotion} onDone={() => setShowSplash(false)} />
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
