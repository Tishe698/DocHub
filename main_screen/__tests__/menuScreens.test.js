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

  it('главный экран: переключатель темы вызывает setMode', () => {
    const { tree } = render(ButtonApp, theme);
    const radios = tree.root.findAll(
      (n) => n.props.accessibilityRole === 'radio' && typeof n.props.onPress === 'function',
    );
    const labels = radios.map((r) => r.props.accessibilityLabel);
    expect(labels).toEqual(expect.arrayContaining(['Тёмная тема', 'Светлая тема']));
    const target = scheme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
    act(() => radios.find((r) => r.props.accessibilityLabel === target).props.onPress());
    expect(theme.setMode).toHaveBeenLastCalledWith(scheme === 'dark' ? 'light' : 'dark');
  });

  it('главный экран: заголовки разделов и полоса пациента', () => {
    const { tree } = render(ButtonApp, theme);
    const headers = tree.root
      .findAll((n) => n.props.accessibilityRole === 'header' && typeof n.type === 'string')
      .map((n) => [].concat(n.props.children).join(''));
    expect(headers).toEqual(
      expect.arrayContaining(['DocHub', 'Препараты', 'Шкалы и индексы', 'Справочники']),
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
