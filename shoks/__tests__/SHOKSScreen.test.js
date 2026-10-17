// Дымовой тест экрана ШОКС: предварительная сумма без класса, итог после всех 10 пунктов.
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import SHOKSScreen from '../shoks';
import { QUESTIONS } from '../shoksScore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const byTestID = (root, id) => root.find((n) => n.props && n.props.testID === id && typeof n.type !== 'string');

describe('SHOKSScreen', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('предварительная сумма, затем класс после всех пунктов; сброс', () => {
    let tree;
    act(() => {
      tree = renderer.create(<SHOKSScreen />);
    });
    expect(byTestID(tree.root, 'shoks-result').props.value).toBeNull();

    act(() => {
      byTestID(tree.root, 'shoks-dyspnea').props.onChange('2');
    });
    let result = byTestID(tree.root, 'shoks-result');
    expect(result.props.value).toBe('2');
    expect(result.props.levelLabel).toBeNull();
    expect(result.props.title).toMatch(/1 из 10/);
    expect(result.props.announceText).toBe('');

    act(() => {
      QUESTIONS.filter((q) => q.key !== 'dyspnea').forEach((q) => {
        byTestID(tree.root, `shoks-${q.key}`).props.onChange('0');
      });
    });
    result = byTestID(tree.root, 'shoks-result');
    expect(result.props.value).toBe('2');
    expect(result.props.levelLabel).toBe('I функциональный класс (≤ 3)');
    expect(result.props.announceText).toBe('ШОКС: 2 балла. I функциональный класс');

    act(() => {
      byTestID(tree.root, 'shoks-reset').props.onPress();
    });
    expect(byTestID(tree.root, 'shoks-result').props.value).toBeNull();
    act(() => tree.unmount());
  });
});
