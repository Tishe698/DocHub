// ThemeToggle — быстрая кнопка «светлая / тёмная тема» (луна или солнце) в правом верхнем углу:
// в шапке навигатора на каждом экране и на главном. Одно нажатие — противоположная текущей схеме тема
// (из «Авто» тоже). Режим сохраняется (ThemeProvider); «Авто» выбирается в разделе «Оформление».
// Для диктора — переключатель «Тёмная тема» с состоянием «включено / выключено»: смену состояния диктор
// озвучивает сам (отдельный announce не нужен — фраза звучала бы дважды). aria-checked — для web
// (react-native-web не переводит accessibilityState в aria-checked), на телефоне то же состояние.
import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles, MIN_TOUCH } from '../../theme/index';

export default function ThemeToggle({ style, testID = 'theme-toggle' }) {
  const { isDark, setMode, colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const toggle = () => setMode(isDark ? 'light' : 'dark');

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="switch"
      accessibilityLabel="Тёмная тема"
      accessibilityHint="Переключает светлую и тёмную тему приложения"
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
