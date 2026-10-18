// Кнопка темы: одно нажатие — противоположная текущей схеме тема, режим сохраняется;
// для диктора — переключатель «Тёмная тема» с состоянием.
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ThemeProvider, { THEME_MODE_KEY } from '../../../theme/ThemeProvider';
import { useTheme } from '../../../theme/index';
import ThemeToggle from '../ThemeToggle';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

let theme;
function Spy() {
  theme = useTheme();
  return null;
}

const render = (initialMode) => {
  let tree;
  act(() => {
    tree = renderer.create(
      <ThemeProvider initialMode={initialMode}>
        <Spy />
        <ThemeToggle />
      </ThemeProvider>,
    );
  });
  return tree;
};

const toggle = (tree) =>
  tree.root.findAll(
    (n) => n.props && n.props.testID === 'theme-toggle' && typeof n.props.onPress === 'function',
  )[0];

describe('ThemeToggle', () => {
  beforeEach(() => AsyncStorage.clear());

  test('светлая → тёмная → светлая, режим сохраняется', async () => {
    const tree = render('light');
    expect(theme.isDark).toBe(false);
    expect(toggle(tree).props.accessibilityRole).toBe('switch');
    expect(toggle(tree).props.accessibilityLabel).toBe('Тёмная тема');
    expect(toggle(tree).props.accessibilityState).toEqual({ checked: false });
    await act(async () => toggle(tree).props.onPress());
    expect(theme.mode).toBe('dark');
    expect(theme.isDark).toBe(true);
    expect(toggle(tree).props.accessibilityState).toEqual({ checked: true });
    expect(await AsyncStorage.getItem(THEME_MODE_KEY)).toBe('dark');
    await act(async () => toggle(tree).props.onPress());
    expect(theme.mode).toBe('light');
  });

  test('из «Авто» — противоположная текущей схеме тема', async () => {
    // В тестовом окружении системная схема светлая — «Авто» показывает светлую тему
    const tree = render('system');
    expect(theme.isDark).toBe(false);
    await act(async () => toggle(tree).props.onPress());
    expect(theme.mode).toBe('dark');
  });

  test('из «Авто» при тёмной системной теме — светлая', async () => {
    const rn = require('react-native');
    const spy = jest.spyOn(rn, 'useColorScheme').mockReturnValue('dark');
    const tree = render('system');
    expect(theme.isDark).toBe(true);
    expect(toggle(tree).props.accessibilityState).toEqual({ checked: true });
    expect(toggle(tree).props['aria-checked']).toBe(true);
    await act(async () => toggle(tree).props.onPress());
    expect(theme.mode).toBe('light');
    spy.mockRestore();
  });

  test('долгое нажатие и действие диктора «Как в телефоне» — снова «Авто»', async () => {
    const tree = render('dark');
    expect(theme.mode).toBe('dark');
    await act(async () => toggle(tree).props.onLongPress());
    expect(theme.mode).toBe('system');
    await act(async () => toggle(tree).props.onPress());
    expect(theme.mode).toBe('dark');
    expect(toggle(tree).props.accessibilityActions).toEqual([
      { name: 'followSystem', label: 'Как в телефоне' },
    ]);
    await act(async () =>
      toggle(tree).props.onAccessibilityAction({ nativeEvent: { actionName: 'followSystem' } }),
    );
    expect(theme.mode).toBe('system');
    expect(await AsyncStorage.getItem(THEME_MODE_KEY)).toBe('system');
  });

  test('значок: луна в светлой теме, солнце в тёмной', async () => {
    const tree = render('light');
    expect(tree.root.findByType('Ionicons').props.name).toBe('moon-outline');
    await act(async () => toggle(tree).props.onPress());
    expect(tree.root.findByType('Ionicons').props.name).toBe('sunny-outline');
  });
});
