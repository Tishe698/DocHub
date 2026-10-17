// Экран калькулятора: поля пациента, поля-выборы, результат и копия.
// Список препаратов подменён контролируемым, чтобы тест не зависел от правок групп.
import React from 'react';
import { ScrollView, TextInput } from 'react-native';
import { act, create } from 'react-test-renderer';
import * as Clipboard from 'expo-clipboard';
import WelcomeScreen from '../calculate_button';
import { PatientProvider, usePatient } from '../../patient/PatientContext';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
// Иконки грузят шрифт асинхронно — в тесте не нужны
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(() => Promise.resolve(true)) }));

jest.mock('../formulas', () => {
  const { routeInput, choiceInput } = jest.requireActual('../routes');
  return {
    __esModule: true,
    default: [
      {
        name: 'Тестовый препарат',
        description: 'Раствор 1 мг/мл',
        inputs: {
          weight: 'Вес (кг)',
          ageYears: 'Возраст (лет)',
          route: routeInput(['iv', 'im'], 'iv'),
          indication: choiceInput('Показание', [
            { value: 'cpr', label: 'СЛР' },
            { value: 'anaphylaxis', label: 'Анафилаксия' },
          ]),
        },
        units: { result1: 'мг' },
        labels: { result1: 'Доза' },
        limits: { result1: { max: 0.5 } },
        warnings: ['Тестовое предупреждение'],
        formula: ({ weight, route, indication }) => ({
          result1: weight * (route === 'iv' ? 0.01 : 0.02) * (indication === 'cpr' ? 1 : 2),
        }),
      },
      { name: 'Справочная запись', description: 'Только текст', inputs: {}, formula: () => ({}) },
    ],
  };
});

jest.useFakeTimers();

let patientApi;
function PatientSpy() {
  patientApi = usePatient();
  return null;
}

const textOf = (node) =>
  node
    .findAll((n) => typeof n.type === 'string' && n.type === 'Text')
    .map((n) =>
      []
        .concat(n.props.children)
        .filter((c) => typeof c === 'string')
        .join(''),
    )
    .join('\n');

// Pressable в тестовом окружении — обёртка, поэтому ищем по имени компонента
const isPressable = (n) =>
  typeof n.type !== 'string' && (n.type.displayName || n.type.name) === 'Pressable';
const pressable = (root, label) => {
  const found = root.findAll((n) => isPressable(n) && n.props.accessibilityLabel === label);
  if (!found.length) throw new Error(`нет кнопки «${label}»`);
  return found[0];
};
const press = (root, label) =>
  act(() => {
    pressable(root, label).props.onPress();
  });
const input = (root, label) => {
  const found = root.findAll((n) => n.type === TextInput && n.props.accessibilityLabel === label);
  if (!found.length) throw new Error(`нет поля «${label}»`);
  return found[0];
};

const renderScreen = (initialPatient) => {
  let tree;
  act(() => {
    tree = create(
      <PatientProvider initialPatient={initialPatient}>
        <PatientSpy />
        <WelcomeScreen />
      </PatientProvider>,
    );
  });
  return tree;
};

describe('экран калькулятора препаратов', () => {
  it('список, поиск и переход в карточку', () => {
    const tree = renderScreen();
    const root = tree.root;
    expect(textOf(root)).toContain('Препаратов в справочнике: 2, с расчётом дозы: 1');
    act(() => input(root, 'Поиск препарата').props.onChangeText('справ'));
    expect(textOf(root)).toContain('Найдено: 1 из 2');
    expect(textOf(root)).not.toContain('Тестовый препарат');
    expect(() => pressable(root, 'Тестовый препарат, есть предупреждения')).toThrow();
    act(() => input(root, 'Поиск препарата').props.onChangeText(''));
    press(root, 'Тестовый препарат, есть предупреждения');
    expect(textOf(root)).toContain('Тестовое предупреждение');
    expect(textOf(root)).toContain('Путь введения');
  });

  it('вес и возраст из пациента, выбор пути и показания, результат и копия', async () => {
    const tree = renderScreen({ weightKg: 20, weightSource: 'broselow', ageMonths: 63 });
    const root = tree.root;
    press(root, 'Тестовый препарат, есть предупреждения');

    // поля показывают пациента, масса помечена как оценка
    expect(input(root, 'Вес, кг, оценка: Broselow').props.value).toBe('20');
    expect(input(root, 'Возраст, полных лет, лет').props.value).toBe('5');
    expect(input(root, 'и месяцев, мес').props.value).toBe('3');

    press(root, 'в/м');
    press(root, 'Анафилаксия');
    press(root, 'Рассчитать');
    let text = textOf(root);
    expect(text).toContain('Результат расчёта');
    expect(text).toContain('Путь введения: в/м');
    expect(text).toContain('Показание: Анафилаксия');
    expect(text).toContain(
      'Рассчитано для: Вес — 20 кг (оценка по ленте Broselow) · Возраст — 5 лет 3 мес',
    );
    expect(text).toContain('0.80 мг');
    expect(text).toContain('↑ выше макс. 0.50 мг');

    await act(async () => {
      pressable(root, 'Копировать результат').props.onPress();
    });
    const copied = Clipboard.setStringAsync.mock.calls[0][0];
    expect(copied).toContain('Путь введения: в/м');
    expect(copied).toContain('Показание: Анафилаксия');
    expect(copied).toContain('Доза: 0.80 мг (↑ выше макс. 0.50 мг)');

    // правка веса в калькуляторе меняет пациента и прячет устаревший результат
    act(() => input(root, 'Вес, кг, оценка: Broselow').props.onChangeText('10'));
    expect(patientApi.patient.weightKg).toBe(10);
    expect(patientApi.patient.weightSource).toBe('entered');
    text = textOf(root);
    expect(text).not.toContain('Результат расчёта');

    // ошибка ввода
    act(() => input(root, 'Вес, кг').props.onChangeText('abc'));
    press(root, 'Рассчитать');
    expect(textOf(root)).toContain('Проверьте введённые данные');
    expect(textOf(root)).toContain('Вес (кг): введите число');
  });

  it('«Новый пациент» очищает поля и результат; возраст пустой — ошибка', () => {
    const tree = renderScreen({ weightKg: 20, ageMonths: 60 });
    const root = tree.root;
    press(root, 'Тестовый препарат, есть предупреждения');
    press(root, 'Рассчитать');
    expect(textOf(root)).toContain('Результат расчёта');
    act(() => patientApi.resetPatient());
    expect(textOf(root)).not.toContain('Результат расчёта');
    expect(input(root, 'Вес, кг').props.value).toBe('');
    press(root, 'Рассчитать');
    expect(textOf(root)).toContain('Возраст: заполните поле (лет и/или мес)');
  });

  it('прокрутка к результату учитывает положение карточки под PatientBar', () => {
    const tree = renderScreen({ weightKg: 20, ageMonths: 60 });
    const root = tree.root;
    press(root, 'Тестовый препарат, есть предупреждения');
    const scroll = root.findByType(ScrollView);
    const scrollTo = jest.fn();
    scroll.instance.scrollTo = scrollTo;
    // корневой View карточки — прямой потомок содержимого ScrollView после PatientBar
    const detail = root.findAll(
      (n) => n.type === 'View' && n.props.onLayout && n.props.onLayout.name === 'onDetailLayout',
    )[0];
    act(() =>
      detail.props.onLayout({ nativeEvent: { layout: { x: 0, y: 180, width: 300, height: 900 } } }),
    );
    press(root, 'Рассчитать');
    const resultBox = root.findAll(
      (n) => n.type === 'View' && n.props.onLayout && n.props.onLayout.name === 'onResultLayout',
    )[0];
    act(() =>
      resultBox.props.onLayout({
        nativeEvent: { layout: { x: 0, y: 600, width: 300, height: 200 } },
      }),
    );
    expect(scrollTo).toHaveBeenCalledWith({ y: 180 + 600 - 16, animated: true });
  });

  it('справочная запись — без кнопки «Рассчитать», возврат к списку', () => {
    const tree = renderScreen();
    const root = tree.root;
    press(root, 'Справочная запись, справочная запись');
    expect(textOf(root)).toContain('Справочная запись: расчёт не предусмотрен');
    expect(() => pressable(root, 'Рассчитать')).toThrow();
    press(root, 'К списку препаратов');
    expect(textOf(root)).toContain('Препаратов в справочнике');
  });
});
