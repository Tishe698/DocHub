// Рендер-тест экрана «Дефибриллятор»: ситуация → энергия на выбранном аппарате, ребёнок по массе,
// группа без возраста, ошибка массы, автоматический аппарат, кардиостимуляция, справки «?».
import React from 'react';
import { Modal, TextInput } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import DefibrillatorScreen from '../DefibrillatorScreen';
import { PatientProvider } from '../../patient/PatientContext';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, SafeAreaProvider: View, useSafeAreaInsets: () => ({}) };
});
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const pressable = (root, label) => {
  const found = root.findAll(
    (n) => n.props && n.props.accessibilityLabel === label && typeof n.props.onPress === 'function',
  );
  if (!found.length) throw new Error(`нет кнопки «${label}»`);
  return found[0];
};
const press = (root, label) => act(() => pressable(root, label).props.onPress());

const result = (root) =>
  root.findAll(
    (n) => n.props && n.props.testID === 'defib-result' && typeof n.type !== 'string',
  )[0];

const texts = (root) =>
  root
    .findAll((n) => n.type === 'Text')
    .map((n) => [].concat(n.props.children).join(''))
    .join('\n')
    .replace(/ /g, ' ');

const weightField = (root) =>
  root.findAll((n) => n.type === TextInput && n.props.testID === 'defib-weight')[0];

const checked = (root, label) => pressable(root, label).props.accessibilityState.checked;

const SC = {
  vt: 'Тахикардия: ЖТ с пульсом — нестабильная желудочковая тахикардия',
  af: 'Тахикардия: ФП — нестабильная фибрилляция предсердий',
  brady: 'Брадикардия с пульсом — кардиостимуляция',
  nonshock: 'Остановка: асистолия или ЭАБП — электрическая активность без пульса',
};
const DEV = {
  axion: 'Аксион, ДКИ Н 10 или ДКИ Н 11',
  zollR: 'ZOLL R Series, Золл',
  lifepak: 'LIFEPAK 15, Лайфпак',
  aed: 'ZOLL AED Plus, Золл, автоматический',
};

const render = (initialPatient) => {
  let tree;
  act(() => {
    tree = renderer.create(
      <PatientProvider initialPatient={initialPatient}>
        <DefibrillatorScreen />
      </PatientProvider>,
    );
  });
  return tree;
};

describe('DefibrillatorScreen', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('по умолчанию: ФЖ, LIFEPAK 15, взрослый — 200 Дж без синхронизации, озвучка', () => {
    const tree = render();
    const r = result(tree.root);
    expect(r.props.value).toBe('200');
    expect(r.props.unit).toBe('Дж');
    expect(r.props.title).toBe('Энергия первого разряда');
    expect(r.props.levelLabel).toBe('Дефибрилляция — без синхронизации');
    expect(r.props.valueAccessibilityLabel).toBe('200 джоулей');
    expect(r.props.announceText).toBe(
      'Дефибрилляция без синхронизации. 200 джоулей. Повторные: 300, затем 360 джоулей',
    );
    expect(texts(tree.root)).toContain('Повторные разряды: 300 Дж → 360 Дж');
    expect(texts(tree.root)).toContain('Что делать по шагам');
    expect(texts(tree.root)).toContain('Безопасность');
  });

  test('ФП на ZOLL — синхронизация и максимум 200 Дж, справка о SYNC', () => {
    const tree = render();
    press(tree.root, SC.af);
    press(tree.root, DEV.zollR);
    const r = result(tree.root);
    expect(r.props.value).toBe('200');
    expect(r.props.levelLabel).toBe('Кардиоверсия — включить синхронизацию (SYNC)');
    expect(() => pressable(tree.root, 'Что такое синхронизация')).not.toThrow();
    // Безопасность при кардиоверсии — без строки про компрессии
    expect(texts(tree.root)).not.toMatch(/Пауза в компрессиях/);
  });

  test('ребёнок: без массы просим указать, 18 кг на Аксионе — 75 Дж', () => {
    const tree = render();
    press(tree.root, 'Ребёнок');
    press(tree.root, DEV.axion);
    expect(result(tree.root).props.value).toBeUndefined();
    expect(texts(tree.root)).toContain('Укажите массу ребёнка');
    act(() => weightField(tree.root).props.onChangeText('18'));
    expect(result(tree.root).props.value).toBe('75');
    expect(texts(tree.root)).toMatch(/Детские электроды/);
  });

  test('некорректная масса — ошибка под полем и расчёт не по старому числу', () => {
    const tree = render();
    press(tree.root, 'Ребёнок');
    act(() => weightField(tree.root).props.onChangeText('18'));
    // LIFEPAK, 18 кг: 72 Дж → ступень 70 Дж
    expect(result(tree.root).props.value).toBe('70');
    act(() => weightField(tree.root).props.onChangeText('18,5.'));
    expect(result(tree.root).props.value).toBeUndefined();
    expect(texts(tree.root)).toMatch(/Масса: от 0,3 до 150 кг/);
    act(() => weightField(tree.root).props.onChangeText('500'));
    expect(texts(tree.root)).toMatch(/Масса: от 0,3 до 150 кг/);
  });

  test('масса без возраста меньше 40 кг — по умолчанию «Ребёнок»', () => {
    const tree = render({ weightKg: 12, weightSource: 'entered' });
    expect(checked(tree.root, 'Ребёнок')).toBe(true);
    // LIFEPAK, 12 кг: 48 Дж → ступень 50 Дж
    expect(result(tree.root).props.value).toBe('50');
  });

  // Ревью fix/audit-leftovers: опечатка в массе не должна переключать ребёнка на взрослую энергию
  test.each([
    ['введена', { weightKg: 12, weightSource: 'entered' }],
    ['по ленте Broselow', { weightKg: 12, weightSource: 'broselow', broselowZone: 'red' }],
  ])('масса %s, опечатка «12,5.» — остаётся «Ребёнок», ошибка под полем', (_, patient) => {
    const tree = render(patient);
    act(() => weightField(tree.root).props.onChangeText('12,5.'));
    expect(checked(tree.root, 'Ребёнок')).toBe(true);
    expect(weightField(tree.root)).toBeDefined();
    expect(texts(tree.root)).toMatch(/Масса: от 0,3 до 150 кг/);
    // энергии нет: ни по старым 12 кг, ни взрослой
    const card = result(tree.root);
    expect(card ? card.props.value : undefined).toBeUndefined();
  });

  test('возраст важнее массы; ручная смена группы', () => {
    const tree = render({ weightKg: 30, ageMonths: 30 * 12 });
    expect(checked(tree.root, 'Взрослый')).toBe(true);
    press(tree.root, 'Ребёнок');
    expect(checked(tree.root, 'Ребёнок')).toBe(true);
    // LIFEPAK, 30 кг: 120 Дж → ступень 125 Дж
    expect(result(tree.root).props.value).toBe('125');
  });

  test('автоматический ZOLL AED Plus: энергию выбирает сам, кардиоверсию не умеет', () => {
    const tree = render();
    press(tree.root, DEV.aed);
    expect(result(tree.root).props.levelLabel).toBe('Автоматический режим');
    expect(result(tree.root).props.title).toBe('Энергия');
    expect(texts(tree.root)).toContain('Взрослые электроды: 120 Дж → 150 Дж → 200 Дж');
    press(tree.root, SC.vt);
    expect(result(tree.root).props.levelLabel).toBe('Нужен другой аппарат');
    expect(result(tree.root).props.title).toBe('Кардиоверсия');
    expect(texts(tree.root)).toMatch(/не делает синхронизированную кардиоверсию/);
  });

  test('АНД, ребёнок без массы — подсказка про оба вида электродов', () => {
    const tree = render();
    press(tree.root, DEV.aed);
    press(tree.root, 'Ребёнок');
    expect(texts(tree.root)).toMatch(/До 25 кг \(около 8 лет\) — детские электроды: 50 Дж/);
  });

  test('брадикардия — кардиостимуляция, без блока безопасности разряда', () => {
    const tree = render();
    press(tree.root, SC.brady);
    expect(result(tree.root).props.levelLabel).toBe('Разряд не показан — кардиостимуляция');
    expect(texts(tree.root)).toMatch(/PACER/);
    expect(texts(tree.root)).not.toContain('Безопасность');
  });

  test('асистолия / ЭАБП — разряд не наносить, аппарат не спрашиваем', () => {
    const tree = render();
    press(tree.root, SC.nonshock);
    expect(result(tree.root).props.levelLabel).toBe('Разряд не показан');
    expect(texts(tree.root)).toContain('Разряд не наносить');
    expect(() => pressable(tree.root, DEV.lifepak)).toThrow();
  });

  test('справки «?»: расшифровка ритмов открывается и закрывается', () => {
    const tree = render();
    press(tree.root, 'Расшифровка ритмов и признаки нестабильности');
    expect(tree.root.findAllByType(Modal).some((m) => m.props.visible)).toBe(true);
    expect(texts(tree.root)).toMatch(/ФЖ — фибрилляция желудочков/);
    expect(texts(tree.root)).toMatch(/70 \+ 2 × возраст/);
    press(tree.root, 'Понятно');
    expect(tree.root.findAllByType(Modal).some((m) => m.props.visible)).toBe(false);
  });
});
