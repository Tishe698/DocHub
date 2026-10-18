// ThemeToggle — кнопка темы (луна или солнце) в правом верхнем углу: в шапке навигатора на каждом экране
// и на главном. Единственное место выбора темы. Нажатие — противоположная текущей схеме тема (из «Авто»
// тоже); долгое нажатие — «Авто» (как в настройках телефона). Режим сохраняется (ThemeProvider);
// пока тему не трогали, действует «Авто».
// Для диктора — переключатель «Тёмная тема» с состоянием «включено / выключено»: смену состояния диктор
// озвучивает сам (отдельный announce не нужен — фраза звучала бы дважды). aria-checked — для web
// (react-native-web не переводит accessibilityState в aria-checked), на телефоне то же состояние.
import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { announce } from '../a11y';
import { useTheme, useThemedStyles, MIN_TOUCH } from '../../theme/index';

export default function ThemeToggle({ style, testID = 'theme-toggle' }) {
  const { isDark, setMode, colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const toggle = () => setMode(isDark ? 'light' : 'dark');
  // Долгое нажатие (и действие диктора «Как в телефоне») — тема снова следует настройке телефона.
  // Состояние переключателя может не измениться, поэтому — короткое объявление
  const followSystem = () => {
    setMode('system');
    announce('Тема как в телефоне');
  };

  return (
    <Pressable
      onPress={toggle}
      onLongPress={followSystem}
      accessibilityRole="switch"
      accessibilityLabel="Тёмная тема"
      accessibilityHint="Переключает светлую и тёмную тему. Долгое нажатие — как в телефоне"
      accessibilityActions={[{ name: 'followSystem', label: 'Как в телефоне' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'followSystem') followSystem();
      }}
      accessibilityState={{ checked: isDark }}
      aria-checked={isDark}
      hitSlop={4}
      testID={testID}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={24} color={colors.primary} />
    </Pressable>
  );
}

const makeStyles = ({ colors }) => ({
  button: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MIN_TOUCH / 2,
  },
  pressed: { backgroundColor: colors.surfaceAlt },
});
