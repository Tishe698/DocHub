// Дымовой тест экрана: рендер с разными данными пациента, без падений, нужные тексты на месте.
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import LaryngealTubeCalculation from '../LaryngealTubeCalculation';
import { PatientProvider } from '../../../patient/PatientContext';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
// Иконки грузят шрифт асинхронно (setState вне act) — в дымовом тесте не нужны.
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const textOf = (tree) => {
  const out = [];
  const walk = (n) => {
    if (n === null || n === undefined) return;
    if (typeof n === 'string') return out.push(n);
    if (Array.isArray(n)) return n.forEach(walk);
    walk(n.children);
  };
  walk(tree.toJSON());
  return out.join(' ');
};

const renderWith = (initialPatient) => {
  let tree;
  act(() => {
    tree = renderer.create(
      <PatientProvider initialPatient={initialPatient}>
        <LaryngealTubeCalculation />
      </PatientProvider>
    );
  });
  return tree;
};

describe('LaryngealTubeCalculation', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('без возраста — нужно выбрать категорию', () => {
    expect(textOf(renderWith(undefined))).toMatch(/Выберите категорию пациента/);
  });

  test('ребёнок 5 лет, 18 кг — № 2', () => {
    const t = textOf(renderWith({ ageMonths: 60, weightKg: 18 }));
    expect(t).toMatch(/№ 2/);
    expect(t).toMatch(/выбрана по возрасту/);
  });

  test('взрослый 175 см — № 4', () => {
    expect(textOf(renderWith({ ageMonths: 360, heightCm: 175 }))).toMatch(/№ 4/);
  });

  test('вне таблицы — варианты', () => {
    expect(textOf(renderWith({ ageMonths: 96, weightKg: 30, heightCm: 120 }))).toMatch(/Рассмотрите: № 2 или № 2,5/);
  });
});
