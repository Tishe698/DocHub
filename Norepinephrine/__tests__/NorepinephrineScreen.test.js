import React from 'react';
import { act, create } from 'react-test-renderer';
import { PatientProvider } from '../../patient/PatientContext';
import NorepinephrineScreen from '../NorepinephrineScreen';

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
        <NorepinephrineScreen />
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

describe('экран «Норадреналин»', () => {
  it('без массы — нет расчёта', () => {
    const tree = render();
    expect(input(tree, 'norepi-weight').props.value).toBe('');
    expect(allText(tree)).toMatch('Нет данных для расчёта');
  });

  it('масса из общего пациента → скорость насоса и капельницы', () => {
    const tree = render({ weightKg: 70 });
    expect(input(tree, 'norepi-weight').props.value).toBe('70');
    const text = allText(tree);
    expect(text).toMatch('Шприцевой насос, в/в');
    expect(text).toMatch('10,5');
    expect(text).toMatch('Капельница, в/в (20 кап/мл)');
  });

  it('масса по Broselow помечена как оценка', () => {
    const tree = render({ weightKg: 20, weightSource: 'broselow', broselowZone: 'blue' });
    expect(allText(tree)).toMatch('оценка');
  });

  it('ввод массы на экране меняет пациента и пересчитывает', () => {
    const tree = render();
    act(() => input(tree, 'norepi-weight').props.onChangeText('20'));
    expect(allText(tree)).toMatch('Пациент: 20 кг');
    expect(allText(tree)).toMatch('(дети)');
  });
});
