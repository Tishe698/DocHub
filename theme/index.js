// theme/index.js — публичный API темы.
// ВАЖНО: пока в корне лежит старый theme.js, импорт '../theme' разрешается в него
// (файл важнее каталога). Новый код импортирует явно: '../theme/index'.
import { useContext, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import ThemeProvider, { ThemeContext, THEME_MODES, THEME_MODE_KEY, buildTheme } from './ThemeProvider';
import palette from './palette';
import broselowColors from './broselow';
import { spacing, radius, typography, fontScaling, MIN_TOUCH } from './tokens';

// Текущая тема: { scheme, mode, setMode, colors, spacing, radius, typography, isDark, ... }
export function useTheme() {
  return useContext(ThemeContext);
}

// Стили, зависящие от темы. factory(theme) → объект стилей; результат StyleSheet.create
// мемоизирован и пересоздаётся только при смене темы (или factory).
// factory объявляйте вне компонента, чтобы ссылка была стабильной.
export function useThemedStyles(factory) {
  const theme = useTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [factory, theme]);
}

// Тема для NavigationContainer (шапка, фон экранов, переходы)
export function makeNavigationTheme(theme) {
  const base = theme.isDark ? DarkTheme : DefaultTheme;
  const { colors } = theme;
  return {
    ...base,
    dark: theme.isDark,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.bg,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };
}

export {
  ThemeProvider,
  ThemeContext,
  THEME_MODES,
  THEME_MODE_KEY,
  buildTheme,
  palette,
  broselowColors,
  spacing,
  radius,
  typography,
  fontScaling,
  MIN_TOUCH,
};
