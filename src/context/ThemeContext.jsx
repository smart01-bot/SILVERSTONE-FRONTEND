import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT, DARK } from '../constants/theme';
import { useTr } from '../constants/translations';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    (async () => {
      const [savedTheme, savedLang] = await Promise.all([
        AsyncStorage.getItem('silverstone_theme'),
        AsyncStorage.getItem('silverstone_lang'),
      ]);
      if (savedTheme === 'dark') setIsDark(true);
      if (savedLang === 'sw')    setLangState('sw');
    })();
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('silverstone_theme', next ? 'dark' : 'light');
  };

  const setLang = async (l) => {
    setLangState(l);
    await AsyncStorage.setItem('silverstone_lang', l);
  };

  const theme = isDark ? DARK : LIGHT;
  const tr    = useTr(lang);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, lang, setLang, tr }}>
      {children}
    </ThemeContext.Provider>
  );
}