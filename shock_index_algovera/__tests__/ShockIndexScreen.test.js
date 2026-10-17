import React from 'react';
import { act, create } from 'react-test-renderer';
import { PatientProvider } from '../../patient/PatientContext';
import CalcShockIndexScreen from '../shock_algov_app';

// Нативного AsyncStorage в Jest нет — официальный мок пакета (тема хранит режим)
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
// Иконки грузят шрифт асинхронно (лишние предупреждения act) — заменяем заглушкой
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.useFakeTimers();

const render = (patient) => {
  let tree;
  act(() => {
    tree = create(
      <PatientProvider initialPatient={patient}>
        <CalcShockIndexScreen />
      </PatientProvider>
    );
  });
  return tree;
};
const allText = (tree) =>
  tree.root
    .findAll((n) => typeof n.props.children === 'string')
    .map((n) => n.props.children)
    .join(' ');
const input = (tree, id) => tree.root.find((n) => n.props.testID === id && n.props.onChangeText);

describe('экран «Шоковый индекс»', () => {
  it('без ввода — подсказка; после ввода — результат', () => {
    const tree = render();
    expect(allText(tree)).toMatch('Введите пульс и САД');
    act(() => input(tree, 'shock-hr').props.onChangeText('120'));
    act(() => input(tree, 'shock-sbp').props.onChangeText('100'));
    const text = allText(tree);
    expect(text).toMatch('1,20');
    expect(text).toMatch('Взрослая шкала (возраст не указан)');
  });

  it('возраст берётся из общего пациента (SIPA)', () => {
    const tree = render({ ageMonths: 60 });
    expect(input(tree, 'shock-age-years').props.value).toBe('5');
    act(() => input(tree, 'shock-hr').props.onChangeText('130'));
    act(() => input(tree, 'shock-sbp').props.onChangeText('100'));
    expect(allText(tree)).toMatch('SIPA превышен');
  });

  it('у мужчины переключателя беременности нет', () => {
    const tree = render({ sex: 'male' });
    expect(tree.root.findAll((n) => n.props.testID === 'shock-pregnant')).toHaveLength(0);
    expect(tree.root.findAll((n) => n.props.testID === 'shock-trauma').length).toBeGreaterThan(0);
  });

  it('нажимаемые элементы имеют роль и подпись', () => {
    const tree = render();
    const pressables = tree.root.findAll((n) => typeof n.props.onPress === 'function' && n.props.accessibilityRole);
    expect(pressables.length).toBeGreaterThan(0);
    for (const p of pressables) expect(p.props.accessibilityLabel).toBeTruthy();
  });
});
