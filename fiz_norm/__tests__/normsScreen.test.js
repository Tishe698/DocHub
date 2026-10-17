// Экран норм: автоматический выбор строки по возрасту пациента, ручная смена, доступность.
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PatientProvider, usePatient } from '../../patient/PatientContext';
import PediatricNormsScreen from '../pediatric_norms_screen';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../../components/a11y', () => ({
  ...jest.requireActual('../../components/a11y'),
  announce: jest.fn(),
}));
const { announce } = require('../../components/a11y');

let api;
function Grab() {
  api = usePatient();
  return null;
}

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

function mount(initialPatient) {
  let tree;
  act(() => {
    tree = renderer.create(
      <SafeAreaProvider initialMetrics={metrics}>
        <PatientProvider initialPatient={initialPatient}>
          <Grab />
          <PediatricNormsScreen />
        </PatientProvider>
      </SafeAreaProvider>
    );
  });
  return tree;
}

// Pressable в jest-expo — обёртка, поэтому ищем по имени компонента
const isPressable = (n) => typeof n.type !== 'string' && (n.type.displayName || n.type.name) === 'Pressable';
const radios = (tree) => tree.root.findAll((n) => isPressable(n) && n.props.accessibilityRole === 'radio');
const selectedLabel = (tree) => {
  const sel = radios(tree).filter((n) => n.props.accessibilityState.selected);
  return sel.length ? sel.map((n) => n.props.accessibilityLabel) : [];
};
const texts = (tree) =>
  tree.root
    .findAll((n) => typeof n.type === 'string' && n.type === 'Text')
    .map((n) => [].concat(n.props.children).join(''));

beforeEach(() => announce.mockClear());

test('без возраста строка не выбрана', () => {
  const tree = mount(undefined);
  expect(selectedLabel(tree)).toEqual([]);
  expect(texts(tree).join('|')).toMatch(/Укажите возраст пациента/);
});

test('возраст 5 лет 3 мес → строка «5 лет», по возрасту пациента', () => {
  const tree = mount({ ageMonths: 63 });
  expect(selectedLabel(tree)).toEqual(['5 лет']);
  const all = texts(tree).join('|');
  expect(all).toMatch(/по возрасту пациента/);
  expect(all).toMatch(/САД < 80 мм рт. ст./);
});

test('ручная смена строки, возврат по кнопке и сброс при новом возрасте', () => {
  const tree = mount({ ageMonths: 63 });
  const r8 = radios(tree).find((n) => n.props.accessibilityLabel === '8 лет');
  act(() => r8.props.onPress());
  expect(selectedLabel(tree)).toEqual(['8 лет']);
  expect(texts(tree).join('|')).toMatch(/выбрано вручную/);
  expect(announce).toHaveBeenCalledWith('Показаны нормы: 8 лет');

  const back = tree.root.find(
    (n) => isPressable(n) && /Вернуть строку по возрасту пациента/.test(n.props.accessibilityLabel || '')
  );
  act(() => back.props.onPress());
  expect(selectedLabel(tree)).toEqual(['5 лет']);

  act(() => radios(tree).find((n) => n.props.accessibilityLabel === '1 год').props.onPress());
  expect(selectedLabel(tree)).toEqual(['1 год']);
  act(() => api.setPatient({ ageMonths: 7 }));
  expect(selectedLabel(tree)).toEqual(['6 месяцев']);
});

test('7 лет: строка 6 лет и порог гипотензии для возраста пациента', () => {
  const tree = mount({ ageMonths: 84 });
  expect(selectedLabel(tree)).toEqual(['6 лет']);
  expect(texts(tree).join('|')).toMatch(/Для возраста пациента \(7 лет\): САД < 84/);
});

test('18 лет — таблица не применяется, строка не выбрана', () => {
  const tree = mount({ ageMonths: 216 });
  expect(selectedLabel(tree)).toEqual([]);
  expect(texts(tree).join('|')).toMatch(/не применяется/);
});

test('все нажимаемые элементы с ролью и подписью', () => {
  const tree = mount({ ageMonths: 63 });
  const pressables = tree.root.findAll((n) => isPressable(n));
  expect(pressables.length).toBeGreaterThan(13);
  pressables.forEach((p) => {
    expect(p.props.accessibilityRole).toBeTruthy();
    expect(p.props.accessibilityLabel).toBeTruthy();
    expect(p.props.accessibilityState).toBeTruthy();
  });
});
