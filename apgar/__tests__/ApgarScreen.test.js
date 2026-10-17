// Дымовой тест экрана: отрисовка, роли и подписи, ввод оценки, правило повторов, секундомер.
import React from 'react';
import { AccessibilityInfo, Alert, Platform } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import * as Clipboard from 'expo-clipboard';
import ApgarScreen from '../ApgarScreen';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(() => Promise.resolve(true)) }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

const radios = (root, label) =>
  root.findAll((n) => n.props.accessibilityRole === 'radio' && n.props.accessibilityLabel === label && n.props.onPress);

const allText = (root) =>
  root
    .findAll((n) => typeof n.props.children === 'string' || Array.isArray(n.props.children))
    .map((n) => [].concat(n.props.children).filter((c) => typeof c === 'string' || typeof c === 'number').join(''))
    .join('\n');

// Выбрать вариант признака по номеру (0–5) среди групп «0/1/2»
const pickSign = (root, signIndex, score) => {
  const groups = root.findAll(
    (n) => n.props.testID === ['heartRate', 'respiration', 'tone', 'reflex', 'color'].map((k) => `apgar-sign-${k}`)[signIndex]
  );
  const group = groups[0];
  const opts = group.findAll((n) => n.props.accessibilityRole === 'radio' && n.props.onPress);
  act(() => opts[score].props.onPress());
};

describe('ApgarScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('показывает предупреждение и группы выбора с ролями radio', () => {
    let tree;
    act(() => {
      tree = TestRenderer.create(<ApgarScreen />);
    });
    const root = tree.root;
    expect(allText(root)).toContain('Оценка по Апгар не используется для решения о начале реанимации');
    const groups = root.findAll((n) => n.props.accessibilityRole === 'radiogroup' && typeof n.type === 'string');
    // минута оценки + пять признаков
    expect(groups.length).toBe(6);
    expect(radios(root, 'Отсутствует, 0 баллов').length).toBe(2); // ЧСС и дыхание
    expect(radios(root, '1-я минута, не оценено').length).toBe(1);
    // у всех нажимаемых элементов есть подпись
    const pressables = root.findAll((n) => typeof n.type !== 'string' && n.props.onPress && n.props.accessibilityRole);
    for (const p of pressables) expect(p.props.accessibilityLabel).toBeTruthy();
    act(() => tree.unmount());
  });

  it('оценка 5-й минуты < 7 открывает 10, 15, 20-ю минуты', () => {
    let tree;
    act(() => {
      tree = TestRenderer.create(<ApgarScreen />);
    });
    const root = tree.root;
    act(() => radios(root, '5-я минута, не оценено')[0].props.onPress());
    // 2 + 1 + 1 + 1 + 1 = 6
    pickSign(root, 0, 2);
    for (let i = 1; i < 5; i += 1) pickSign(root, i, 1);
    const text = allText(root);
    expect(text).toContain('Умеренная асфиксия');
    expect(text).toContain('5-я мин — 6 баллов (умеренная асфиксия)');
    expect(radios(root, '10-я минута, не оценено').length).toBe(1);
    expect(radios(root, '20-я минута, не оценено').length).toBe(1);
    act(() => {
      jest.advanceTimersByTime(800);
    });
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      expect.stringContaining('Апгар на 5-й минуте: 6 баллов, Умеренная асфиксия')
    );
    act(() => tree.unmount());
  });

  it('реанимация после 5-й минуты при 8 баллах открывает 10-ю минуту', () => {
    let tree;
    act(() => {
      tree = TestRenderer.create(<ApgarScreen />);
    });
    const root = tree.root;
    act(() => radios(root, '5-я минута, не оценено')[0].props.onPress());
    // 2 + 2 + 2 + 1 + 1 = 8
    for (let i = 0; i < 3; i += 1) pickSign(root, i, 2);
    pickSign(root, 3, 1);
    pickSign(root, 4, 1);
    expect(allText(root)).toContain('дополнительные оценки не обязательны');
    expect(radios(root, '10-я минута, не оценено').length).toBe(0);
    const sw = root.find((n) => n.props.testID === 'apgar-resuscitation' && n.props.onPress);
    expect(sw.props.accessibilityRole).toBe('switch');
    act(() => sw.props.onPress());
    const text = allText(root);
    expect(text).toContain('Реанимационные мероприятия продолжаются после 5-й минуты: оцените на 10-й минуте.');
    expect(text).not.toContain('дополнительные оценки не обязательны');
    expect(text).toContain('Проведите третью оценку по Апгар на 10-й минуте после рождения.');
    expect(radios(root, '10-я минута, не оценено').length).toBe(1);
    expect(radios(root, '15-я минута, не оценено').length).toBe(0);
    act(() => tree.unmount());
  });

  it('секундомер: запуск, отметка 1-й минуты и подсказка диктору', () => {
    let tree;
    act(() => {
      tree = TestRenderer.create(<ApgarScreen />);
    });
    const root = tree.root;
    const start = root.find((n) => n.props.testID === 'apgar-start' && n.props.onPress);
    act(() => start.props.onPress());
    act(() => {
      jest.advanceTimersByTime(61000);
    });
    const timer = root.find((n) => n.props.accessibilityRole === 'timer' && typeof n.type === 'string');
    expect(timer.props.accessibilityLabel).toMatch(/От рождения прошло 1 минута 1 секунда/);
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      'Прошла 1-я минута — оцените по шкале Апгар'
    );
    expect(allText(root)).toContain('пора оценить');
    // «−1 мин» — рождение на минуту раньше: прошедшее время увеличивается
    const earlier = root.find(
      (n) => n.props.accessibilityLabel === 'Сдвинуть время рождения на 1 минуту раньше' && n.props.onPress
    );
    act(() => earlier.props.onPress());
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    const timer2 = root.find((n) => n.props.accessibilityRole === 'timer' && typeof n.type === 'string');
    expect(timer2.props.accessibilityLabel).toMatch(/От рождения прошло 2 минуты 2 секунды/);
    act(() => tree.unmount());
  });
  it('на фоне ИВЛ подсказывает оценивать только собственные дыхательные усилия', () => {
    let tree;
    act(() => {
      tree = TestRenderer.create(<ApgarScreen />);
    });
    const root = tree.root;
    expect(allText(root)).not.toContain('Оценивайте только собственные дыхательные усилия ребёнка');
    const sw = root.find((n) => n.props.testID === 'apgar-resuscitation' && n.props.onPress);
    act(() => sw.props.onPress());
    expect(allText(root)).toContain('Оценивайте только собственные дыхательные усилия ребёнка');
    act(() => tree.unmount());
  });

  describe('web: Alert.alert не работает — подтверждение через window.confirm', () => {
    const originalOS = Platform.OS;
    const hadWindow = typeof global.window !== 'undefined';
    const originalWindow = global.window;
    beforeEach(() => {
      Platform.OS = 'web';
      if (!hadWindow) global.window = {};
      global.window.confirm = jest.fn(() => true);
      global.window.alert = jest.fn();
    });
    afterEach(() => {
      Platform.OS = originalOS;
      if (hadWindow) {
        delete global.window.confirm;
        delete global.window.alert;
      } else {
        global.window = originalWindow;
      }
    });

    it('«Очистить эту оценку» и «Новая оценка» срабатывают после confirm; отказ — ничего не меняет', () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      let tree;
      act(() => {
        tree = TestRenderer.create(<ApgarScreen />);
      });
      const root = tree.root;
      pickSign(root, 0, 2);
      expect(allText(root)).toContain('Отмечено 1 из 5');
      const clearBtn = () =>
        root.find((n) => n.props.accessibilityLabel === 'Очистить оценку: 1-я минута' && n.props.onPress);
      global.window.confirm.mockReturnValueOnce(false);
      act(() => clearBtn().props.onPress());
      expect(allText(root)).toContain('Отмечено 1 из 5');
      act(() => clearBtn().props.onPress());
      expect(global.window.confirm).toHaveBeenLastCalledWith('Очистить оценку: 1-я минута?');
      expect(allText(root)).toContain('Отмечено 0 из 5');
      expect(alertSpy).not.toHaveBeenCalled();
      act(() => tree.unmount());
    });

    it('после копирования — сообщение на экране и диктору', async () => {
      let tree;
      act(() => {
        tree = TestRenderer.create(<ApgarScreen />);
      });
      const root = tree.root;
      for (let i = 0; i < 5; i += 1) pickSign(root, i, 2);
      const copyBtn = root.find((n) => n.props.accessibilityLabel === 'Скопировать оценку по Апгар' && n.props.onPress);
      await act(async () => {
        await copyBtn.props.onPress();
      });
      expect(Clipboard.setStringAsync).toHaveBeenCalled();
      expect(global.window.alert).toHaveBeenCalledWith('Скопировано\nОценка по Апгар скопирована в буфер обмена.');
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Скопировано. Оценка по Апгар скопирована в буфер обмена.'
      );
      act(() => tree.unmount());
    });
  });
});
