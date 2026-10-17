// Кнопка «?» у ленты Broselow: открывает краткую справку и закрывает её
import React from 'react';
import { Modal } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import BroselowPicker, { BROSELOW_HELP } from '../BroselowPicker';
import { PatientProvider } from '../PatientContext';
import { BROSELOW_MAX_LENGTH_CM, BROSELOW_MIN_LENGTH_CM } from '../estimates';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

// Нажимаемый узел с testID (у обёрток BroselowHelp и HelpButton тот же testID, но нет onPress)
const byTestID = (root, id) =>
  root.findAll((n) => n.props && n.props.testID === id && typeof n.props.onPress === 'function')[0];

const texts = (root) =>
  root
    .findAll((n) => n.type === 'Text')
    .map((n) => [].concat(n.props.children).join(''))
    .join('\n');

const render = () => {
  let tree;
  act(() => {
    tree = renderer.create(
      <PatientProvider>
        <BroselowPicker />
      </PatientProvider>,
    );
  });
  return tree;
};

describe('справка о ленте Broselow', () => {
  test('кнопка «?» с подписью для диктора', () => {
    const tree = render();
    const button = byTestID(tree.root, 'broselow-help');
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Что такое лента Broselow');
    expect(tree.root.findByType(Modal).props.visible).toBe(false);
  });

  test('открывается по нажатию, показывает текст и закрывается «Понятно»', () => {
    const tree = render();
    act(() => byTestID(tree.root, 'broselow-help').props.onPress());
    expect(tree.root.findByType(Modal).props.visible).toBe(true);
    const shown = texts(tree.root);
    BROSELOW_HELP.forEach((p) => expect(shown).toContain(p));
    act(() => byTestID(tree.root, 'broselow-help-close').props.onPress());
    expect(tree.root.findByType(Modal).props.visible).toBe(false);
  });

  test('закрывается нажатием на затемнение и системной «Назад»', () => {
    const tree = render();
    act(() => byTestID(tree.root, 'broselow-help').props.onPress());
    act(() => byTestID(tree.root, 'broselow-help-backdrop').props.onPress());
    expect(tree.root.findByType(Modal).props.visible).toBe(false);
    act(() => byTestID(tree.root, 'broselow-help').props.onPress());
    act(() => tree.root.findByType(Modal).props.onRequestClose());
    expect(tree.root.findByType(Modal).props.visible).toBe(false);
  });

  test('текст: границы роста из таблицы зон, зачем лента, что делать без ленты', () => {
    const all = BROSELOW_HELP.join(' ');
    expect(all).toContain(String(BROSELOW_MIN_LENGTH_CM).replace('.', ','));
    expect(all).toContain(String(BROSELOW_MAX_LENGTH_CM).replace('.', ','));
    expect(all).toMatch(/дозы считаются на килограмм/);
    expect(all).toMatch(/Ленты нет — введите рост/);
  });
});
