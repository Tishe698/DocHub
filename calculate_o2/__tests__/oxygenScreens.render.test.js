// Дымовые тесты экранов раздела «Кислород»: рендер с разными данными пациента, ввод, роли
// доступности; проверка, что в файлах зоны нет литералов цвета.
import fs from 'fs';
import path from 'path';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import Calc_max_time_o2 from '../calc_max_time_o2';
import Calc_dorbinyn from '../calc_dorbinyn';
import Calc_aparat_IVL from '../calc_aparat_IVl';
import { PatientProvider } from '../../patient/PatientContext';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
// Иконки грузят шрифт асинхронно (setState вне act) — в дымовом тесте не нужны.
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialCommunityIcons: () => null,
}));

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

const renderWith = (Comp, initialPatient) => {
  let tree;
  act(() => {
    tree = renderer.create(
      <PatientProvider initialPatient={initialPatient}>
        <Comp />
      </PatientProvider>,
    );
  });
  return tree;
};

const type = (tree, testID, text) => {
  const input = tree.root.find(
    (n) => n.props.testID === testID && typeof n.props.onChangeText === 'function',
  );
  act(() => input.props.onChangeText(text));
};

const pressRadio = (tree, label) => {
  const radio = tree.root.find(
    (n) =>
      n.props.accessibilityRole === 'radio' &&
      n.props.accessibilityLabel === label &&
      n.props.onPress,
  );
  act(() => radio.props.onPress());
};

// У каждого нажимаемого элемента есть роль и подпись
const expectPressablesLabelled = (tree) => {
  const pressables = tree.root.findAll(
    (n) =>
      typeof n.type !== 'string' &&
      typeof n.props.onPress === 'function' &&
      n.props.accessibilityRole,
  );
  expect(pressables.length).toBeGreaterThan(0);
  for (const p of pressables) expect(p.props.accessibilityLabel).toBeTruthy();
};

describe('экраны раздела «Кислород»', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  test('баллон: без данных — подсказка; ввод — результат до резерва', () => {
    const tree = renderWith(Calc_max_time_o2);
    expect(textOf(tree)).toMatch(/Заполните все поля/);
    type(tree, 'o2-volume', '10');
    type(tree, 'o2-pressure', '150');
    type(tree, 'o2-flow', '10');
    const t = textOf(tree);
    expect(t).toMatch(/136/);
    expect(t).toMatch(/2 ч 16 мин/);
    expect(t).toMatch(/150 минут/);
    expectPressablesLabelled(tree);
  });

  test('баллон: МПа и ошибка давления', () => {
    const tree = renderWith(Calc_max_time_o2);
    pressRadio(tree, 'мегапаскали');
    type(tree, 'o2-pressure', '150');
    expect(textOf(tree)).toMatch(/30 МПа не бывает/);
    type(tree, 'o2-pressure', '15');
    type(tree, 'o2-volume', '10');
    type(tree, 'o2-flow', '10');
    expect(textOf(tree)).toMatch(/136/);
  });

  test('баллон на резерве', () => {
    const tree = renderWith(Calc_max_time_o2);
    type(tree, 'o2-volume', '10');
    type(tree, 'o2-pressure', '10');
    type(tree, 'o2-flow', '2');
    expect(textOf(tree)).toMatch(/Баллон на резерве/);
  });

  test('Дарбинян: масса пациента подставляется, 75 кг → 8,5 л/мин', () => {
    const tree = renderWith(Calc_dorbinyn, { weightKg: 75 });
    const t = textOf(tree);
    expect(t).toMatch(/8,5/);
    expect(t).toMatch(/10,5–11,5/);
    expect(t).toMatch(/Пациент: 75 кг/);
    expectPressablesLabelled(tree);
  });

  test('Дарбинян: масса < 5 кг — ошибка; по должной массе — нужен пол', () => {
    const tree = renderWith(Calc_dorbinyn, { weightKg: 3 });
    expect(textOf(tree)).toMatch(/не применяется/);
    pressRadio(tree, 'Должная масса по росту и полу');
    type(tree, 'darbinyan-height', '175');
    expect(textOf(tree)).toMatch(/укажите пол/);
    pressRadio(tree, 'Мужской');
    const t = textOf(tree);
    expect(t).toMatch(/Должная масса: 70,6 кг/);
    expect(t).toMatch(/8,1/);
  });

  test('Дарбинян: некорректный рост — ошибка под полем, по старому росту не считает', () => {
    const tree = renderWith(Calc_dorbinyn, { sex: 'male', heightCm: 175 });
    pressRadio(tree, 'Должная масса по росту и полу');
    expect(textOf(tree)).toMatch(/Должная масса: 70,6 кг/);
    type(tree, 'darbinyan-height', '17,5,');
    const t = textOf(tree);
    expect(t).toMatch(/Введите число, например 175/);
    expect(t).not.toMatch(/Должная масса: 70,6 кг/);
    expect(t).not.toMatch(/8,1/);
  });

  test('ИВЛ: ребёнок 5 лет 14 мес — ошибка под полем «мес», ЧДД и масса по возрасту не подставлены', () => {
    const tree = renderWith(Calc_aparat_IVL, { ageMonths: 60 });
    type(tree, 'ivl-age-months', '14');
    const t = textOf(tree);
    expect(t).toMatch(/При указанных годах — месяцев 0–11/);
    expect(t).toMatch(/Возраст: лет 0–17, мес 0–11 — проверьте ввод/);
    expect(t).toMatch(/Масса для расчёта — Основа —/);
    expect(t).not.toMatch(/25 кг/);
    const rr = tree.root.find(
      (n) => n.props.testID === 'ivl-rr' && typeof n.props.onChangeText === 'function',
    );
    expect(rr.props.value).toBe('');
    // «5,,» не разбирается — в контексте остался старый возраст, но расчёт по нему не идёт
    type(tree, 'ivl-age-months', '');
    type(tree, 'ivl-age-years', '5,,');
    const t2 = textOf(tree);
    expect(t2).toMatch(/Введите число лет/);
    expect(t2).not.toMatch(/18 кг/);
  });

  test('ИВЛ: масса по ленте Broselow подписана как оценка, а не фактическая', () => {
    const tree = renderWith(Calc_aparat_IVL, {
      ageMonths: 60,
      weightKg: 19,
      weightSource: 'broselow',
    });
    const t = textOf(tree);
    expect(t).toMatch(/оценка \(лента Broselow\)/);
    expect(t).not.toMatch(/фактическая/);
  });

  test('ИВЛ: взрослый мужчина 180 см — ДО 451 мл', () => {
    const tree = renderWith(Calc_aparat_IVL, { ageMonths: 480, sex: 'male', heightCm: 180 });
    const t = textOf(tree);
    expect(t).toMatch(/451/);
    expect(t).toMatch(/4,51 л\/мин/);
    expectPressablesLabelled(tree);
  });

  test('ИВЛ: ребёнок 5 лет — группа «Ребёнок» по возрасту, ЧДД 20, APLS 18 кг', () => {
    const tree = renderWith(Calc_aparat_IVL, { ageMonths: 60 });
    const t = textOf(tree);
    expect(t).toMatch(/по возрасту \(APLS\)/);
    expect(t).toMatch(/18 кг/);
    expect(t).toMatch(/108/);
    const rr = tree.root.find(
      (n) => n.props.testID === 'ivl-rr' && typeof n.props.onChangeText === 'function',
    );
    expect(rr.props.value).toBe('20');
  });

  test('ИВЛ: подросток 16 лет, 110 кг, 170 см — группа «Ребёнок», ДО на должную массу 66 кг', () => {
    const tree = renderWith(Calc_aparat_IVL, {
      ageMonths: 192,
      sex: 'male',
      heightCm: 170,
      weightKg: 110,
    });
    const t = textOf(tree);
    expect(t).toMatch(/должная \(по росту и полу\)/);
    expect(t).toMatch(/66 кг/);
    expect(t).toMatch(/396 мл/);
    expect(t).not.toMatch(/660/);
    const h = tree.root.find(
      (n) => n.props.testID === 'ivl-height' && typeof n.props.onChangeText === 'function',
    );
    expect(h.props.value).toBe('170');
    expectPressablesLabelled(tree);
  });

  test('ИВЛ: смена сценария подставляет пресеты, ручная правка сохраняется до смены', () => {
    const tree = renderWith(Calc_aparat_IVL, { ageMonths: 480, sex: 'male', heightCm: 180 });
    const rrInput = () =>
      tree.root.find(
        (n) => n.props.testID === 'ivl-rr' && typeof n.props.onChangeText === 'function',
      );
    expect(rrInput().props.value).toBe('10');
    type(tree, 'ivl-rr', '12');
    expect(rrInput().props.value).toBe('12');
    pressRadio(tree, PRESETS_NON_ARREST);
    expect(rrInput().props.value).toBe('14');
  });

  test('ИВЛ: А-ИВЛ 4/40 — FiO₂ и I:E кнопками из паспорта', () => {
    const tree = renderWith(Calc_aparat_IVL, { ageMonths: 480, sex: 'female', heightCm: 165 });
    pressRadio(tree, 'А-ИВЛ ВВЛ 4/40');
    const t = textOf(tree);
    expect(t).toMatch(/50 %/);
    expect(t).toMatch(/1,5:1/);
    expect(t).toMatch(/На аппарате задают МОД/);
  });
});

const PRESETS_NON_ARREST = 'Без остановки / ROSC';

describe('литералы цвета', () => {
  const files = [
    'calc_max_time_o2.js',
    'calc_dorbinyn.js',
    'calc_aparat_IVl.js',
    'style_oxy.js',
    'oxygenCalc.js',
    'ventilatorCalc.js',
    'darbinyanCalc.js',
  ];
  test.each(files)('%s — цвета только из темы', (f) => {
    const src = fs.readFileSync(
      path.join(path.dirname(require.resolve('../style_oxy')), f),
      'utf8',
    );
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(src).not.toMatch(/rgba?\(/);
    expect(src).not.toMatch(/['"](white|black|red|green|blue|gray|grey)['"]/);
    expect(src).not.toMatch(/StatusBar/);
  });
});
