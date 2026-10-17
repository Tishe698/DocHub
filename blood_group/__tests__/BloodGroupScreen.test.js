// Дымовой тест экрана группы крови: рисуется, выбор реакций даёт итог с озвучкой.
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import BloodGroupScreen from '../blood_group_screen';
import { NEG, POS } from '../bloodGroupLogic';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const byTestID = (root, id) => root.find((n) => n.props && n.props.testID === id && typeof n.type !== 'string');

describe('BloodGroupScreen', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('без реакций итог не озвучивается; после выбора — группа и резус', () => {
    let tree;
    act(() => {
      tree = renderer.create(<BloodGroupScreen />);
    });
    let result = byTestID(tree.root, 'blood-result');
    expect(result.props.announceEnabled).toBe(false);
    expect(result.props.levelLabel).toBeUndefined();

    act(() => {
      byTestID(tree.root, 'blood-antiA').props.onChange(POS);
      byTestID(tree.root, 'blood-antiB').props.onChange(NEG);
      byTestID(tree.root, 'blood-antiAB').props.onChange(POS);
      byTestID(tree.root, 'blood-antiD').props.onChange(POS);
    });
    result = byTestID(tree.root, 'blood-result');
    expect(result.props.announceEnabled).toBe(true);
    expect(result.props.announceText).toMatch(/A \(II\)/);
    expect(result.props.announceText).toMatch(/Rh\(\+\) положительный/);
    expect(result.props.levelLabel).toBe('Первичный результат');

    act(() => {
      byTestID(tree.root, 'blood-reset').props.onPress();
    });
    result = byTestID(tree.root, 'blood-result');
    expect(result.props.announceEnabled).toBe(false);
    act(() => tree.unmount());
  });

  it('у каждого варианта реакции подпись с названием реагента', () => {
    let tree;
    act(() => {
      tree = renderer.create(<BloodGroupScreen />);
    });
    const radios = tree.root.findAll(
      (n) => typeof n.type !== 'string' && n.props && n.props.accessibilityRole === 'radio'
    );
    expect(radios.length).toBeGreaterThanOrEqual(15);
    const labels = radios.map((r) => r.props.accessibilityLabel);
    expect(labels).toContain('Анти-A: агглютинация есть');
    expect(labels).toContain('Контроль NaCl: агглютинации нет');
    act(() => tree.unmount());
  });
});
