// App.js
import 'react-native-gesture-handler';
import React from 'react';
import { View, useColorScheme } from 'react-native';
import SilverstoneMark from './src/components/SilverstoneMark';
import { LoadingTrack } from './src/components/Loader';
import { agentColors } from './src/components/agent/agentTheme';
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

export default function App() {
  const startupColors = agentColors(useColorScheme() === 'dark');
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

  if (!fontsLoaded && !fontError) {
    return <View accessible accessibilityRole="progressbar" accessibilityLabel="Opening Silverstone" accessibilityState={{ busy: true }}
      style={{ flex: 1, backgroundColor: startupColors.bg, alignItems: 'center', justifyContent: 'center', gap: 32 }}>
      <SilverstoneMark color={startupColors.text} size={64} />
      <LoadingTrack color={startupColors.text} />
    </View>;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <LoaderProvider>
            <AppNavigator />
          </LoaderProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}