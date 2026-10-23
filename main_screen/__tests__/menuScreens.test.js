// Дымовые тесты экранов меню: рендер в светлой и тёмной теме, переходы, роли и подписи.
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ButtonApp from '../button_app';
import Tabnav from '../../button_two/navigate_button/TabnavTube';
import Tabnav_oxy from '../../calculate_o2/tabnav_oxy';
import { ThemeContext, buildTheme } from '../../theme/ThemeProvider';
import { allMainCards, TUBE_MENU, OXYGEN_MENU } from '../menuConfig';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Значки — простой хост-элемент: настоящий Icon асинхронно грузит шрифт и шумит в консоли
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function render(Component, theme) {
  const navigation = { navigate: jest.fn() };
  let tree;
  act(() => {
    tree = TestRenderer.create(
      <SafeAreaProvider initialMetrics={metrics}>
        <ThemeContext.Provider value={theme}>
          <Component navigation={navigation} />
        </ThemeContext.Provider>
      </SafeAreaProvider>,
    );
  });
  return { tree, navigation };
}

// Нажимаемый узел карточки (Pressable внутри ui/Card) — с ролью button и onPress
const byTestID = (tree, id) =>
  tree.root.find(
    (n) =>
      n.props.testID === id &&
      typeof n.type !== 'string' &&
      n.props.accessibilityRole === 'button' &&
      typeof n.props.onPress === 'function',
  );

describe.each(['light', 'dark'])('экраны меню, тема %s', (scheme) => {
  const theme = buildTheme(scheme, scheme, jest.fn());

  it('главный экран: каждая карточка открывает свой маршрут', () => {
    const { tree, navigation } = render(ButtonApp, theme);
    for (const card of allMainCards()) {
      const node = byTestID(tree, `home-card-${card.route}`);
      expect(node.props.accessibilityLabel).toBe(`${card.title}, ${card.description}`);
      act(() => node.props.onPress());
      expect(navigation.navigate).toHaveBeenLastCalledWith(card.route);
    }
    expect(navigation.navigate).toHaveBeenCalledTimes(allMainCards().length);
  });

  it('главный экран: быстрый переключатель темы вверху (луна / солнце)', () => {
    const { tree } = render(ButtonApp, theme);
    const sw = tree.root.find(
      (n) =>
        n.props.testID === 'home-theme-toggle' &&
        n.props.accessibilityRole === 'switch' &&
        typeof n.props.onPress === 'function',
    );
    expect(sw.props.accessibilityLabel).toBe('Тёмная тема');
    expect(sw.props.accessibilityState).toEqual({ checked: scheme === 'dark' });
    act(() => sw.props.onPress());
    expect(theme.setMode).toHaveBeenLastCalledWith(scheme === 'dark' ? 'light' : 'dark');
    // Долгое нажатие — тема как в телефоне
    act(() => sw.props.onLongPress());
    expect(theme.setMode).toHaveBeenLastCalledWith('system');
  });

  it('главный экран: отдельного раздела «Оформление» нет — тема только кнопкой вверху', () => {
    const { tree } = render(ButtonApp, theme);
    const headers = tree.root
      .findAll((n) => n.props.accessibilityRole === 'header' && typeof n.type === 'string')
      .map((n) => [].concat(n.props.children).join(''));
    expect(headers).not.toContain('Оформление');
    const radios = tree.root.findAll(
      (n) => n.props.accessibilityRole === 'radio' && n.props.accessibilityLabel === 'Тёмная тема',
    );
    expect(radios).toHaveLength(0);
  });

  it('главный экран: «О приложении и конфиденциальность» открывает окно с политикой', () => {
    const { tree } = render(ButtonApp, theme);
    const btn = tree.root.findAll(
      (n) => n.props.testID === 'home-about' && typeof n.props.onPress === 'function',
    )[0];
    act(() => btn.props.onPress());
    const shown = tree.root
      .findAll((n) => n.props.accessibilityRole === 'header' && typeof n.type === 'string')
      .map((n) => [].concat(n.props.children).join(''));
    expect(shown).toEqual(expect.arrayContaining(['О приложении', 'Политика конфиденциальности']));
  });

  it('главный экран: заголовки разделов и полоса пациента', () => {
    const { tree } = render(ButtonApp, theme);
    const headers = tree.root
      .findAll((n) => n.props.accessibilityRole === 'header' && typeof n.type === 'string')
      .map((n) => [].concat(n.props.children).join(''));
    expect(headers).toEqual(
      expect.arrayContaining(['MedRush', 'Препараты', 'Шкалы и индексы', 'Справочники']),
    );
    const texts = tree.root.findAll(
      (n) => typeof n.type === 'string' && n.props.children === 'Пациент не указан',
    );
    expect(texts.length).toBeGreaterThan(0);
  });

  it('интубация: переходы к трубкам', () => {
    const { tree, navigation } = render(Tabnav, theme);
    for (const card of TUBE_MENU) {
      act(() => byTestID(tree, `tube-card-${card.route}`).props.onPress());
      expect(navigation.navigate).toHaveBeenLastCalledWith(card.route);
    }
  });

  it('кислород: переходы к расчётам', () => {
    const { tree, navigation } = render(Tabnav_oxy, theme);
    for (const card of OXYGEN_MENU) {
      const node = byTestID(tree, `oxy-card-${card.route}`);
      expect(node.props.accessibilityRole).toBe('button');
      act(() => node.props.onPress());
      expect(navigation.navigate).toHaveBeenLastCalledWith(card.route);
    }
  });
});
