// Дымовой тест экрана NEWS2: экран рисуется, ввод всех параметров даёт итог с риском текстом.
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import NewsScreen from '../NewsScreen';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(() => Promise.resolve(true)) }));
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

describe('NewsScreen', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('рисуется без итога и с ограничениями применения', () => {
    let tree;
    act(() => {
      tree = renderer.create(<NewsScreen />);
    });
    const all = textOf(tree.root);
    expect(all).toMatch(/Ограничения применения/);
    expect(all).toMatch(/от 16 лет/);
    expect(all).toMatch(/беременных/);
    expect(all).toMatch(/Royal College of Physicians/);
    expect(tree.root.findAll((n) => n.props && n.props.testID === 'news-result')).toHaveLength(0);
    act(() => tree.unmount());
  });

  it('после ввода всех параметров показывает сумму и уровень риска', () => {
    let tree;
    act(() => {
      tree = renderer.create(<NewsScreen />);
    });
    const type = (id, text) =>
      act(() => {
        byTestID(tree.root, id).props.onChangeText(text);
      });
    type('news-respRate', '26');
    type('news-spo2', '93');
    type('news-sbp', '95');
    type('news-heartRate', '125');
    type('news-temperature', '39,4');
    act(() => {
      byTestID(tree.root, 'news-oxygen').props.onChange('oxygen');
      byTestID(tree.root, 'news-consciousness').props.onChange('V');
    });
    const result = tree.root.find((n) => n.props && n.props.testID === 'news-result');
    expect(result.props.value).toBe('16');
    expect(result.props.levelLabel).toMatch(/Высокий риск/);
    expect(result.props.announceText).toMatch(/NEWS2: 16 баллов/);
    act(() => tree.unmount());
  });
});
