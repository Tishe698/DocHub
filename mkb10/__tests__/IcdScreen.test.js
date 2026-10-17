// Дымовой тест экрана МКБ-10: сначала индикатор загрузки, данные — после первого кадра;
// поиск с дебаунсом. Справочник подменён маленьким набором.
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { FlatList } from 'react-native';
import ICDSearchScreen, { __resetIcdCache } from '../mkbscreen';

jest.mock('../mkb_data.json', () => ({
  meta: { edition: 'Тестовая редакция', updated: '2026-10-17' },
  items: [
    { code: 'I21', name: 'Острый инфаркт миокарда' },
    { code: 'I21.0', name: 'Острый трансмуральный инфаркт передней стенки миокарда' },
    { code: 'J18.9', name: 'Пневмония неуточненная' },
    {
      code: 'I20.00',
      name: 'Нестабильная стенокардия с гипертензией',
      note: 'Используйте I20.0',
      ext: 1,
    },
  ],
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const byTestID = (root, id) =>
  root.find((n) => n.props && n.props.testID === id && typeof n.type !== 'string');
const textOf = (node) =>
  node
    .findAll((n) => typeof n.children !== 'undefined')
    .flatMap((n) => n.children)
    .filter((c) => typeof c === 'string')
    .join(' ');

describe('ICDSearchScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    __resetIcdCache();
  });
  afterEach(() => jest.useRealTimers());

  it('лениво загружает справочник и ищет', () => {
    let tree;
    act(() => {
      tree = renderer.create(<ICDSearchScreen />);
    });
    expect(textOf(tree.root)).toMatch(/Загрузка справочника/);
    expect(tree.root.findAllByType(FlatList)).toHaveLength(0);

    act(() => {
      jest.runOnlyPendingTimers(); // кадр
    });
    act(() => {
      jest.runOnlyPendingTimers(); // загрузка
    });
    const list = tree.root.findByType(FlatList);
    // в просмотре — без кодов вне МКБ-10
    expect(list.props.data.map((x) => x.code)).toEqual(['I21', 'I21.0', 'J18.9']);
    expect(textOf(tree.root)).toMatch(/Тестовая редакция\. Данные от 17\.10\.2026/);

    act(() => {
      byTestID(tree.root, 'icd-search').props.onChangeText('ш21.0');
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(tree.root.findByType(FlatList).props.data.map((x) => x.code)).toEqual(['I21.0']);
    expect(textOf(byTestID(tree.root, 'icd-helper'))).toMatch(/Найдено: 1 запись/);

    act(() => {
      byTestID(tree.root, 'icd-clear').props.onPress();
    });
    act(() => {
      jest.advanceTimersByTime(10);
    });
    expect(tree.root.findByType(FlatList).props.data).toHaveLength(3);
    act(() => tree.unmount());
  });

  it('повторное открытие — без индикатора (кэш)', () => {
    let tree;
    act(() => {
      tree = renderer.create(<ICDSearchScreen />);
    });
    act(() => jest.runOnlyPendingTimers());
    act(() => jest.runOnlyPendingTimers());
    act(() => tree.unmount());

    act(() => {
      tree = renderer.create(<ICDSearchScreen />);
    });
    expect(tree.root.findAllByType(FlatList)).toHaveLength(1);
    act(() => tree.unmount());
  });
});
