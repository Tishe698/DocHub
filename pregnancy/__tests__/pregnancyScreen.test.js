// Экран срока беременности: ввод даты, ошибки, результат, видео и доступность кнопок.
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  const MockDateTimePicker = (props) => <View testID="date-picker" {...props} />;
  return MockDateTimePicker;
});

// Плеер expo-video: состояние в объекте, события через useEvent
const mockPlayer = { playing: false, muted: false, status: 'readyToPlay', loop: false, volume: 1 };
mockPlayer.play = jest.fn(() => (mockPlayer.playing = true));
mockPlayer.pause = jest.fn(() => (mockPlayer.playing = false));
jest.mock('expo-video', () => {
  const { View } = require('react-native');
  return {
    useVideoPlayer: (source, setup) => {
      mockPlayer.source = source;
      if (setup) setup(mockPlayer);
      return mockPlayer;
    },
    VideoView: () => <View testID="video" />,
  };
});
jest.mock('expo', () => ({ useEvent: (_p, _name, initial) => initial }));
jest.mock('../../components/a11y', () => ({
  ...jest.requireActual('../../components/a11y'),
  announce: jest.fn(),
}));
const { announce } = require('../../components/a11y');
const Date_pregnancy = require('../pregnancy').default;

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

const isPressable = (n) => typeof n.type !== 'string' && (n.type.displayName || n.type.name) === 'Pressable';
const texts = (tree) =>
  tree.root
    .findAll((n) => n.type === 'Text')
    .map((n) => [].concat(n.props.children).join(''))
    .join('|');
const input = (tree) => tree.root.find((n) => n.type === 'TextInput' && n.props.testID === 'lmp-input');
const pressByLabel = (tree, re) => {
  const p = tree.root.find((n) => isPressable(n) && re.test(n.props.accessibilityLabel || ''));
  act(() => p.props.onPress());
};

function mount() {
  let tree;
  act(() => {
    tree = renderer.create(
      <SafeAreaProvider initialMetrics={metrics}>
        <Date_pregnancy />
      </SafeAreaProvider>
    );
  });
  return tree;
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 17, 10, 0));
  announce.mockClear();
  mockPlayer.playing = false;
  mockPlayer.muted = false;
});
afterEach(() => {
  jest.useRealTimers();
});

test('ввод даты цифрами → срок, ПДР и категория', () => {
  const tree = mount();
  expect(texts(tree)).toMatch(/Сегодня: 17 октября 2026 г\./);
  act(() => input(tree).props.onChangeText('01052026'));
  const all = texts(tree);
  // 01.05.2026 → 17.10.2026 = 169 дн = 24 нед 1 дн; ПДР 01.05 + 280 = 05.02.2027
  expect(all).toMatch(/24 нед 1 дн/);
  expect(all).toMatch(/идёт 25-я неделя/);
  expect(all).toMatch(/Предполагаемая дата родов: 5 февраля 2027 г\./);
  expect(all).toMatch(/преждевременные/);
  act(() => jest.advanceTimersByTime(1000));
  expect(announce).toHaveBeenCalledWith(expect.stringMatching(/^Срок беременности 24 недели 1 день/));
  // при переходе свайпом значение читается словами, а не сокращениями «нед/дн»
  const valueRow = tree.root.find((n) => n.type === 'View' && n.props.accessible && /^Срок 24/.test(n.props.accessibilityLabel || ''));
  expect(valueRow.props.accessibilityLabel).toBe('Срок 24 недели 1 день');
});

test.each([
  ['31022026', 'Такой даты нет'],
  ['18102026', 'не может быть позже'],
  ['01012025', 'больше 45 недель'],
])('ошибка для %s видна и озвучена', (digits, msg) => {
  const tree = mount();
  act(() => input(tree).props.onChangeText(digits));
  expect(texts(tree)).toMatch(new RegExp(msg));
  expect(input(tree).props.accessibilityHint).toMatch(new RegExp(msg));
  expect(announce).toHaveBeenCalledWith(expect.stringMatching(new RegExp(msg)));
  expect(texts(tree)).not.toMatch(/Предполагаемая дата родов/);
});

test('повторный расчёт очищает дату', () => {
  const tree = mount();
  act(() => input(tree).props.onChangeText('01052026'));
  pressByLabel(tree, /Повторный расчёт/);
  expect(input(tree).props.value).toBe('');
});

test('календарь: открыть и выбрать дату (Android — событие set)', () => {
  const tree = mount();
  pressByLabel(tree, /Выбрать в календаре/);
  const picker = tree.root.find((n) => n.props.testID === 'date-picker' && typeof n.type !== 'string');
  expect(picker.props.maximumDate.getDate()).toBe(17);
  act(() => picker.props.onChange({ type: 'set' }, new Date(2026, 0, 10, 15, 30)));
  // iOS-ветка запоминает значение до «Готово»; на платформе теста (iOS по умолчанию) — применяем «Готово»
  const done = tree.root.findAll((n) => isPressable(n) && n.props.accessibilityLabel === 'Применить выбранную дату');
  if (done.length) act(() => done[0].props.onPress());
  expect(texts(tree)).toMatch(/ДПМ \(первый день последней менструации\): 10 января 2026 г\./);
  expect(texts(tree)).toMatch(/40 нед 0 дн/);
});

test('видео: g.mp4 через expo-video, кнопки управления с ролью, подписью и состоянием', () => {
  const tree = mount();
  expect(mockPlayer.source).toBeTruthy();
  expect(mockPlayer.loop).toBe(true);
  expect(tree.root.findAll((n) => n.props.testID === 'video' && typeof n.type === 'string')).toHaveLength(1);
  pressByLabel(tree, /Воспроизвести видео/);
  expect(mockPlayer.play).toHaveBeenCalled();
  pressByLabel(tree, /Выключить звук видео/);
  expect(mockPlayer.muted).toBe(true);

  const pressables = tree.root.findAll(isPressable);
  expect(pressables.length).toBeGreaterThanOrEqual(4);
  pressables.forEach((p) => {
    expect(p.props.accessibilityRole).toBe('button');
    expect(p.props.accessibilityLabel).toBeTruthy();
    expect(p.props.accessibilityState).toBeTruthy();
  });
});
