// Экран «Перед началом работы»: показ при первом запуске, принятие сохраняется с версией текста,
// политика конфиденциальности открывается из экрана; PRIVACY.md совпадает с текстом в приложении.
import fs from 'fs';
import path from 'path';
import React from 'react';
import { Text as RNText } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NoticeGate from '../NoticeGate';
import {
  CONTACT_EMAIL,
  NOTICE_KEY,
  NOTICE_POINTS,
  NOTICE_VERSION,
  PRIVACY_SECTIONS,
  PRIVACY_UPDATED,
} from '../aboutText';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, SafeAreaProvider: View, useSafeAreaInsets: () => ({}) };
});
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const App = () => <RNText testID="app-content">Главный экран</RNText>;

const render = async () => {
  let tree;
  await act(async () => {
    tree = renderer.create(
      <NoticeGate>
        <App />
      </NoticeGate>,
    );
  });
  return tree;
};
const byTestId = (tree, id) =>
  tree.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
const hasApp = (tree) => tree.root.findAll((n) => n.props.testID === 'app-content').length > 0;
const texts = (tree) =>
  tree.root
    .findAll((n) => n.type === 'Text')
    .map((n) => [].concat(n.props.children).join(''))
    .join('\n');

describe('NoticeGate', () => {
  beforeEach(() => AsyncStorage.clear());

  test('первый запуск — экран уведомления, после «Понятно» — приложение и запись версии', async () => {
    const tree = await render();
    expect(hasApp(tree)).toBe(false);
    const t = texts(tree);
    NOTICE_POINTS.forEach(([title]) => expect(t).toMatch(title));
    await act(async () => byTestId(tree, 'notice-accept').props.onPress());
    expect(hasApp(tree)).toBe(true);
    expect(await AsyncStorage.getItem(NOTICE_KEY)).toBe(String(NOTICE_VERSION));
  });

  test('уже принято этой версией — сразу приложение', async () => {
    await AsyncStorage.setItem(NOTICE_KEY, String(NOTICE_VERSION));
    const tree = await render();
    expect(hasApp(tree)).toBe(true);
  });

  test('принята старая версия текста — экран показывается снова', async () => {
    await AsyncStorage.setItem(NOTICE_KEY, String(NOTICE_VERSION - 1));
    const tree = await render();
    expect(hasApp(tree)).toBe(false);
  });

  test('хранилище недоступно — экран показывается, «Понятно» пускает в приложение', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('нет доступа'));
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('нет доступа'));
    const tree = await render();
    expect(hasApp(tree)).toBe(false);
    await act(async () => byTestId(tree, 'notice-accept').props.onPress());
    expect(hasApp(tree)).toBe(true);
  });

  test('кнопка «Политика конфиденциальности» открывает её текст', async () => {
    const tree = await render();
    await act(async () => byTestId(tree, 'notice-privacy').props.onPress());
    const modal = tree.root.findAll(
      (n) => n.props.testID === 'notice-privacy-modal' && typeof n.type === 'string',
    );
    expect(modal.length).toBeGreaterThan(0);
    expect(texts(tree)).toMatch('Какие данные обрабатываются');
    expect(texts(tree)).toMatch(CONTACT_EMAIL);
  });
});

describe('PRIVACY.md', () => {
  const md = fs.readFileSync(path.join(__dirname, '../../PRIVACY.md'), 'utf8');

  test('совпадает с текстом в приложении дословно', () => {
    PRIVACY_SECTIONS.forEach(([title, paragraphs]) => {
      expect(md).toContain(`## ${title}`);
      paragraphs.forEach((p) => expect(md).toContain(p));
    });
    expect(md).toContain(PRIVACY_UPDATED);
    expect(md).toContain(CONTACT_EMAIL);
  });
});
