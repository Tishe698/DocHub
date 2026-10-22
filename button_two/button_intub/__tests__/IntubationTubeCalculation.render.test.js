// Дымовой тест экрана: рендер с разными данными пациента, без падений, нужные тексты на месте.
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import IntubationTubeCalculation from '../IntubationTubeCalculation';
import { PatientProvider } from '../../../patient/PatientContext';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
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
        <IntubationTubeCalculation />
      </PatientProvider>,
    );
  });
  return tree;
};

describe('IntubationTubeCalculation', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('без данных — подсказка', () => {
    const t = textOf(renderWith(undefined));
    expect(t).toMatch(/Нет данных для расчёта/);
  });

  test('рост 90 см — 4,5 мм', () => {
    const t = textOf(renderWith({ heightCm: 90 }));
    expect(t).toMatch(/4,5/);
    expect(t).toMatch(/по длине тела/);
  });

  // Аудит M1-20: неверно набранное число подсвечивается, расчёт по прежнему значению не идёт.
  const type = (tree, testID, text) => {
    const node = tree.root.find(
      (n) => n.props.testID === testID && typeof n.props.onChangeText === 'function',
    );
    act(() => node.props.onChangeText(text));
  };

  test('рост «9.0.0» — ошибка под полем, по прежним 90 см не считает', () => {
    const tree = renderWith({ heightCm: 90 });
    expect(textOf(tree)).toMatch(/по длине тела/);
    type(tree, 'ett-height', '9.0.0');
    const t = textOf(tree);
    expect(t).toMatch(/Неверное число — проверьте ввод/);
    expect(t).not.toMatch(/по длине тела/);
    expect(t).toMatch(/Нет данных для расчёта/);
  });

  test('возраст «5..» — ошибка под полем, по прежним 5 годам не считает', () => {
    const tree = renderWith({ ageMonths: 60 });
    const before = textOf(tree);
    expect(before).not.toMatch(/Нет данных для расчёта/);
    type(tree, 'ett-age-years', '5..');
    const t = textOf(tree);
    expect(t).toMatch(/Неверное число — проверьте ввод/);
    expect(t).toMatch(/Нет данных для расчёта/);
  });

  test('серая зона по ленте — просьба выбрать подзону', () => {
    const t = textOf(renderWith({ broselowZone: 'grey', weightKg: 4, weightSource: 'broselow' }));
    expect(t).toMatch(/Выберите подзону серой зоны/);
  });

  // n12: подзона серой зоны сбрасывается при смене зоны.
  test('серая → 5 кг → розовая → серая: подзону нужно выбрать заново', () => {
    const tree = renderWith({ ageMonths: 2 });
    const press = (pred) => {
      const node = tree.root.find(
        (n) => typeof n.props.onPress === 'function' && pred(n.props.accessibilityLabel || ''),
      );
      act(() => node.props.onPress());
    };
    press((l) => l.startsWith('Зона Серая'));
    expect(textOf(tree)).toMatch(/Выберите подзону серой зоны/);
    press((l) => l === 'Серая зона, 5 кг');
    expect(textOf(tree)).not.toMatch(/Выберите подзону серой зоны/);
    expect(textOf(tree)).toMatch(/10,5/);
    press((l) => l.startsWith('Зона Розовая'));
    expect(textOf(tree)).not.toMatch(/Подзона серой зоны/);
    press((l) => l.startsWith('Зона Серая'));
    expect(textOf(tree)).toMatch(/Выберите подзону серой зоны/);
  });

  test('взрослый без пола — расчёт невозможен', () => {
    const t = textOf(renderWith({ ageMonths: 360 }));
    expect(t).toMatch(/Расчёт невозможен/);
  });
});
