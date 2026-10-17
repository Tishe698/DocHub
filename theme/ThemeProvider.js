// ThemeProvider.js — текущая тема приложения.
// Режим: 'system' (следовать настройке телефона), 'light' или 'dark'.
// Режим хранится в AsyncStorage (ключ dochub.themeMode); любые ошибки чтения/записи
// перехватываются — тогда работает 'system'. Фактическая схема при 'system' — useColorScheme().
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import palette from './palette';
import broselowColors from './broselow';
import { spacing, radius, typography, fontScaling, MIN_TOUCH } from './tokens';

export const THEME_MODE_KEY = 'dochub.themeMode';
export const THEME_MODES = ['system', 'light', 'dark'];

const isMode = (v) => THEME_MODES.includes(v);

// Собирает объект темы. Экспортируется для тестов и для значения контекста по умолчанию.
export function buildTheme(scheme, mode = 'system', setMode = () => {}) {
  const isDark = scheme === 'dark';
  return {
    scheme: isDark ? 'dark' : 'light',
    mode,
    setMode,
    isDark,
    colors: isDark ? palette.dark : palette.light,
    spacing,
    radius,
    typography,
    fontScaling,
    minTouch: MIN_TOUCH,
    broselow: broselowColors,
  };
}

// Значение по умолчанию — светлая тема: компонент вне провайдера (тест, превью) не падает.
export const ThemeContext = createContext(buildTheme('light'));

export default function ThemeProvider({ children, initialMode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState(isMode(initialMode) ? initialMode : 'system');

  // Загрузка сохранённого режима
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_MODE_KEY);
        if (!cancelled && isMode(saved)) setModeState(saved);
      } catch {
        // хранилище недоступно — остаёмся на 'system'
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback((next) => {
    if (!isMode(next)) return;
    setModeState(next);
    AsyncStorage.setItem(THEME_MODE_KEY, next).catch(() => {
      // не удалось сохранить — режим действует до перезапуска
    });
  }, []);

  const scheme = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const theme = useMemo(() => buildTheme(scheme, mode, setMode), [scheme, mode, setMode]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
