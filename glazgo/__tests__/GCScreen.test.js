// Дымовой тест экрана ШКГ: выбор шкалы по возрасту пациента, подсчёт, NT, сброс.
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import GCScreen from '../glazgo';
import { PatientProvider } from '../../patient/PatientContext';

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

const render = (initialPatient) => {
  let tree;
  act(() => {
    tree = renderer.create(
      <PatientProvider initialPatient={initialPatient}>
        <GCScreen />
      </PatientProvider>,
    );
  });
  return tree;
};

const choose = (tree, id, value) =>
  act(() => {
    byTestID(tree.root, id).props.onChange(value);
  });

describe('GCScreen', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('без пациента — взрослая шкала, итога нет', () => {
    const tree = render();
    expect(byTestID(tree.root, 'gcs-mode').props.value).toBe('adult');
    const result = byTestID(tree.root, 'gcs-result');
    expect(result.props.value).toBeNull();
    expect(result.props.announceText).toBe('');
    act(() => tree.unmount());
  });

  it('ребёнок 2 лет — детская шкала, без ШКГ-З', () => {
    const tree = render({ ageMonths: 24 });
    expect(byTestID(tree.root, 'gcs-mode').props.value).toBe('child');
    expect(tree.root.findAll((n) => n.props && n.props.testID === 'gcs-pupils')).toHaveLength(0);
    act(() => tree.unmount());
  });

  it('полный ввод даёт сумму, уровень и ШКГ-З; ручная смена шкалы предупреждает о возрасте', () => {
    const tree = render({ ageMonths: 600 });
    choose(tree, 'gcs-eye', 'E3');
    choose(tree, 'gcs-verbal', 'V4');
    choose(tree, 'gcs-motor', 'M6');
    choose(tree, 'gcs-pupils', 'P1');
    const result = byTestID(tree.root, 'gcs-result');
    expect(result.props.value).toBe('13');
    expect(result.props.levelLabel).toBe('Умеренное оглушение (13–14)');
    expect(result.props.level).toBe('info');
    expect(result.props.announceText).toMatch(/ШКГ 13 баллов, E3 V4 M6.*ШКГ-З 12/);

    choose(tree, 'gcs-mode', 'child');
    expect(byTestID(tree.root, 'gcs-result').props.value).toBeNull(); // V и M сброшены
    expect(byTestID(tree.root, 'gcs-mismatch')).toBeTruthy();
    act(() => tree.unmount());
  });

  it('NT — суммы нет, сброс очищает выбор', () => {
    const tree = render();
    choose(tree, 'gcs-eye', 'EC');
    choose(tree, 'gcs-verbal', 'V5');
    choose(tree, 'gcs-motor', 'M6');
    expect(byTestID(tree.root, 'gcs-result').props.value).toBeNull();
    expect(byTestID(tree.root, 'gcs-result').props.announceText).toMatch(/сумма не определяется/);
    act(() => {
      byTestID(tree.root, 'gcs-reset').props.onPress();
    });
    expect(byTestID(tree.root, 'gcs-eye').props.value).toBeNull();
    act(() => tree.unmount());
  });
});
