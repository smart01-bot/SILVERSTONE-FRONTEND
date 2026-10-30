import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import { LIGHT, DARK } from '../constants/theme';
import { useTr } from '../constants/translations';
import { agentColors } from '../components/agent/agentTheme';

export const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const deviceScheme = useColorScheme();
  // null = follow device; 'light' | 'dark' = user override
  const [userPreference, setUserPreference] = useState(null);
  const [lang, setLangState] = useState('sw');
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [savedPref, savedLang] = await Promise.all([
          AsyncStorage.getItem('silverstone_theme_preference'),
          AsyncStorage.getItem('silverstone_lang'),
        ]);
        if (!active) return;
        if (savedPref === 'light' || savedPref === 'dark') {
          setUserPreference(savedPref);
        }
        if (savedLang === 'sw' || savedLang === 'en') setLangState(savedLang);
      } catch {
        // Fall back to the device theme if preferences cannot be read.
      } finally { if (active) setThemeReady(true); }
    })();
    return () => { active = false; };
  }, []);

  const isDark = userPreference
    ? userPreference === 'dark'
    : deviceScheme === 'dark';

  useEffect(() => {
    // Android exposes the Activity's native backdrop during IME resize frames.
    // A React View background alone leaves that area at the default white.
    SystemUI.setBackgroundColorAsync(agentColors(isDark).bg).catch(() => {});
  }, [isDark]);

  // preference: 'light' | 'dark' | 'auto'
  const setTheme = async (preference) => {
    if (preference === 'auto') {
      setUserPreference(null);
      await AsyncStorage.removeItem('silverstone_theme_preference');
    } else {
      setUserPreference(preference);
      await AsyncStorage.setItem('silverstone_theme_preference', preference);
    }
  };

  const setLang = async (l) => {
    setLangState(l);
    await AsyncStorage.setItem('silverstone_lang', l);
  };

  const theme = isDark ? DARK : LIGHT;
  const tr    = useTr(lang);

  return (
    <ThemeContext.Provider value={{
      theme, isDark, setTheme, userPreference, themeReady,
      lang, setLang, tr,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
