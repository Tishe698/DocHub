// Рендер-тест экрана группы крови: строку таблицы выбирают нажатием, выбранная строка
// отмечена для диктора, итог показывает группу и резус, AB(IV) — с предупреждением о контроле.
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import BloodGroupScreen from '../blood_group_screen';
import BloodDrop from '../BloodDrop';
import { AB0_REAGENTS, AB0_ROWS, CONTROL_NOTE, NEG, POS, RH_ROWS } from '../bloodGroupLogic';
import { bloodDropColors } from '../../theme/index';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

// Составной (не host) узел с testID — у него есть onPress / пропсы компонента
const byTestID = (root, id) =>
  root.findAll((n) => n.props && n.props.testID === id && typeof n.type !== 'string')[0];

const press = (tree, id) => {
  act(() => {
    byTestID(tree.root, id).props.onPress();
  });
};

const render = () => {
  let tree;
  act(() => {
    tree = renderer.create(<BloodGroupScreen />);
  });
  return tree;
};

const checked = (tree, id) => byTestID(tree.root, id).props.accessibilityState.checked;

const allText = (tree) =>
  tree.root
    .findAll((n) => typeof n.type === 'string' && n.type === 'Text')
    .map((n) => [].concat(n.props.children).join(''))
    .join('\n');

describe('BloodGroupScreen', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('без выбора итога нет и он не озвучивается', () => {
    const tree = render();
    const result = byTestID(tree.root, 'blood-result');
    expect(result.props.announceEnabled).toBe(false);
    expect(result.props.value).toBeUndefined();
    expect(byTestID(tree.root, 'blood-reset').props.disabled).toBe(true);
    expect(allText(tree)).toContain('Выберите строки в таблицах');
  });

  it('выбор строки A(II) и Rh(+) даёт итог «A(II) Rh(+)»', () => {
    const tree = render();
    press(tree, 'blood-abo-A');
    expect(checked(tree, 'blood-abo-A')).toBe(true);
    expect(checked(tree, 'blood-abo-O')).toBe(false);

    let result = byTestID(tree.root, 'blood-result');
    expect(result.props.value).toBe('A(II)');
    expect(allText(tree)).toContain('Выберите резус');

    press(tree, 'blood-rh-pos');
    result = byTestID(tree.root, 'blood-result');
    expect(result.props.value).toBe('A(II) Rh(+)');
    expect(result.props.valueAccessibilityLabel).toBe('группа А, вторая, резус-положительная');
    expect(allText(tree)).toContain('Группа A(II), резус-положительная');
    expect(result.props.levelLabel).toBeUndefined();
    expect(byTestID(tree.root, 'blood-reset').props.disabled).toBe(false);
    expect(result.props.announceEnabled).toBe(true);
    expect(result.props.announceText).toBe(
      'Результат: группа А, вторая, резус-положительная. Результат первичный, нужно подтверждение в лаборатории',
    );
    expect(allText(tree)).not.toContain('Выберите резус');
    expect(allText(tree)).not.toContain(CONTROL_NOTE);
  });

  it('выбор другой строки заменяет прежний', () => {
    const tree = render();
    press(tree, 'blood-abo-A');
    press(tree, 'blood-abo-O');
    expect(checked(tree, 'blood-abo-A')).toBe(false);
    expect(checked(tree, 'blood-abo-O')).toBe(true);
    press(tree, 'blood-rh-pos');
    press(tree, 'blood-rh-neg');
    expect(byTestID(tree.root, 'blood-result').props.value).toBe('0(I) Rh(−)');
  });

  it('AB(IV) показывает предупреждение о контроле с 0,9% NaCl', () => {
    const tree = render();
    press(tree, 'blood-abo-AB');
    expect(allText(tree)).toContain(CONTROL_NOTE);
    expect(byTestID(tree.root, 'blood-result').props.levelLabel).toBe('Нужен контроль с 0,9% NaCl');
    expect(byTestID(tree.root, 'blood-result').props.announceText).toContain(
      'нужен контроль с физраствором',
    );
  });

  it('строки — переключатели с подписью реакций словами', () => {
    const tree = render();
    const row = byTestID(tree.root, 'blood-abo-B');
    expect(row.props.accessibilityRole).toBe('radio');
    expect(row.props.accessibilityLabel).toBe(
      'Группа Бэ, третья: Анти-А — нет агглютинации, Анти-Бэ — агглютинация, Анти-А-Бэ — агглютинация',
    );
    expect(byTestID(tree.root, 'blood-rh-neg').props.accessibilityLabel).toBe(
      'резус-отрицательная: Анти-Дэ супер — нет агглютинации',
    );
  });

  it('рисунки капель в строке соответствуют реакциям таблицы', () => {
    const tree = render();
    AB0_ROWS.forEach((row) => {
      const drops = byTestID(tree.root, `blood-abo-${row.key}`).findAllByType(BloodDrop);
      expect(drops.map((d) => d.props.value)).toEqual(AB0_REAGENTS.map((r) => row[r.key]));
    });
    RH_ROWS.forEach((row) => {
      const drops = byTestID(tree.root, `blood-rh-${row.key}`).findAllByType(BloodDrop);
      expect(drops.map((d) => d.props.value)).toEqual([row.antiD]);
    });
  });

  it('капля «+» — хлопья на светлом фоне, «−» — ровная красная', () => {
    const view = (value) => {
      let tree;
      act(() => {
        tree = renderer.create(<BloodDrop value={value} />);
      });
      const root = tree.root.findAll((n) => n.type === 'View')[0];
      const bg = StyleSheet.flatten(root.props.style).backgroundColor;
      const flakes = root
        .findAll((n) => n.type === 'View' && n !== root)
        .filter((n) => StyleSheet.flatten(n.props.style).backgroundColor === bloodDropColors.flake);
      return { bg, flakes: flakes.length };
    };
    expect(view(POS)).toEqual({ bg: bloodDropColors.plasma, flakes: 10 });
    expect(view(NEG)).toEqual({ bg: bloodDropColors.blood, flakes: 0 });
  });

  it('«Сбросить» снимает выбор в обеих таблицах', () => {
    const tree = render();
    press(tree, 'blood-abo-B');
    press(tree, 'blood-rh-neg');
    press(tree, 'blood-reset');
    expect(checked(tree, 'blood-abo-B')).toBe(false);
    expect(checked(tree, 'blood-rh-neg')).toBe(false);
    expect(byTestID(tree.root, 'blood-result').props.value).toBeUndefined();
  });

  it('сомнительных реакций («±») на экране нет', () => {
    const tree = render();
    expect(allText(tree)).not.toContain('±');
  });
});
