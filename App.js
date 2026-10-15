// App.js
import 'react-native-gesture-handler';
import React from 'react';
import * as NativeSplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { LoaderProvider } from './src/context/LoaderContext';
import AppNavigator from './src/navigation/AppNavigator';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import {
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  RobotoMono_400Regular,
} from '@expo-google-fonts/roboto-mono';

// Keep the native background until the themed animation and fonts are ready.
NativeSplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    RobotoMono_400Regular,
  });

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <LoaderProvider>
            <AppNavigator fontsReady={fontsLoaded || Boolean(fontError)} />
          </LoaderProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
