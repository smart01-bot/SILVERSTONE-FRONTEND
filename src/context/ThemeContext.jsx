import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT, DARK } from '../constants/theme';
import { useTr } from '../constants/translations';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const deviceScheme = useColorScheme();
  // null = follow device; 'light' | 'dark' = user override
  const [userPreference, setUserPreference] = useState(null);
  const [lang, setLangState] = useState('sw');

  useEffect(() => {
    (async () => {
      const [savedPref, savedLang] = await Promise.all([
        AsyncStorage.getItem('silverstone_theme_preference'),
        AsyncStorage.getItem('silverstone_lang'),
      ]);
      if (savedPref === 'light' || savedPref === 'dark') {
        setUserPreference(savedPref);
      }
      if (savedLang === 'sw') setLangState('sw');
    })();
  }, []);

  const isDark = userPreference
    ? userPreference === 'dark'
    : deviceScheme === 'dark';

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
      theme, isDark, setTheme, userPreference,
      lang, setLang, tr,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
