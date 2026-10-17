// Дымовой тест экрана Женевской шкалы: возраст > 65 из пациента с ручным изменением, итог по ЧСС.
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import GenevaScoreScreen from '../tela';
import { PatientProvider } from '../../patient/PatientContext';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const byTestID = (root, id) => root.find((n) => n.props && n.props.testID === id && typeof n.type !== 'string');
const hasTestID = (root, id) => root.findAll((n) => n.props && n.props.testID === id).length > 0;

const render = (initialPatient) => {
  let tree;
  act(() => {
    tree = renderer.create(
      <PatientProvider initialPatient={initialPatient}>
        <GenevaScoreScreen />
      </PatientProvider>
    );
  });
  return tree;
};

describe('GenevaScoreScreen', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('без ЧСС итога нет', () => {
    const tree = render();
    const result = byTestID(tree.root, 'geneva-result');
    expect(result.props.value).toBeNull();
    expect(result.props.announceText).toBe('');
    expect(byTestID(tree.root, 'geneva-age').props.value).toBe(false);
    expect(byTestID(tree.root, 'geneva-age').props.description).toMatch(/не указан/);
    act(() => tree.unmount());
  });

  it('пациент 70 лет — пункт возраста отмечен, можно снять вручную', () => {
    const tree = render({ ageMonths: 840 });
    const age = byTestID(tree.root, 'geneva-age');
    expect(age.props.value).toBe(true);
    expect(age.props.description).toMatch(/подставлено из возраста пациента: 70 лет/);

    act(() => {
      byTestID(tree.root, 'geneva-hr').props.onChange('hr2');
    });
    expect(byTestID(tree.root, 'geneva-result').props.value).toBe('6');
    expect(byTestID(tree.root, 'geneva-result').props.levelLabel).toMatch(/средняя/);

    act(() => {
      byTestID(tree.root, 'geneva-age').props.onValueChange(false);
    });
    expect(byTestID(tree.root, 'geneva-age').props.value).toBe(false);
    expect(byTestID(tree.root, 'geneva-age').props.description).toMatch(/изменено вручную/);
    expect(byTestID(tree.root, 'geneva-result').props.value).toBe('5');
    act(() => tree.unmount());
  });

  it('ребёнок — предупреждение, высокий риск при 11+', () => {
    const tree = render({ ageMonths: 120 });
    expect(hasTestID(tree.root, 'geneva-child')).toBe(true);
    act(() => {
      byTestID(tree.root, 'geneva-hr').props.onChange('hr2');
      byTestID(tree.root, 'geneva-dvt_signs').props.onValueChange(true);
      byTestID(tree.root, 'geneva-surgery').props.onValueChange(true);
    });
    const result = byTestID(tree.root, 'geneva-result');
    expect(result.props.value).toBe('11');
    expect(result.props.level).toBe('danger');
    expect(result.props.announceText).toMatch(/высокая/);
    act(() => {
      byTestID(tree.root, 'geneva-reset').props.onPress();
    });
    expect(byTestID(tree.root, 'geneva-result').props.value).toBeNull();
    act(() => tree.unmount());
  });
});
