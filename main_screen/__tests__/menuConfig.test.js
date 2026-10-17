import fs from 'fs';
import path from 'path';
import {
  MENU_SECTIONS,
  TUBE_MENU,
  OXYGEN_MENU,
  THEME_MODE_OPTIONS,
  allMainCards,
  cardA11yLabel,
  gridColumns,
} from '../menuConfig';
import palette from '../../theme/palette';
import { THEME_MODES } from '../../theme/ThemeProvider';
import { stripEmoji } from '../../components/a11y';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Маршруты, зарегистрированные в App.js (имена из массива ROUTES)
function appRoutes() {
  const src = fs.readFileSync(path.join(__dirname, '../../App.js'), 'utf8');
  const block = src.slice(src.indexOf('const ROUTES'), src.indexOf('];', src.indexOf('const ROUTES')));
  return [...block.matchAll(/name:\s*'([^']+)'/g)].map((m) => m[1]);
}

const ionicons = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');

const allCards = [...allMainCards(), ...TUBE_MENU, ...OXYGEN_MENU];

describe('menuConfig', () => {
  const routes = appRoutes();

  it('App.js читается и содержит маршруты', () => {
    expect(routes.length).toBeGreaterThan(10);
  });

  it('у каждой карточки маршрут из App.js', () => {
    for (const card of allCards) {
      expect(routes).toContain(card.route);
    }
  });

  it('разделы главного экрана — в заданном порядке', () => {
    expect(MENU_SECTIONS.map((s) => s.title)).toEqual([
      'Препараты',
      'Дыхательные пути и кислород',
      'Шкалы и индексы',
      'Педиатрия и неонатология',
      'Справочники',
    ]);
  });

  it('главный экран ведёт во все разделы верхнего уровня, включая NEWS2 и Апгар', () => {
    const main = allMainCards().map((c) => c.route);
    const submenuRoutes = [...TUBE_MENU, ...OXYGEN_MENU].map((c) => c.route);
    const topLevel = routes.filter((r) => !submenuRoutes.includes(r));
    expect([...main].sort()).toEqual([...topLevel].sort());
    expect(main).toContain('NewsScreen');
    expect(main).toContain('ApgarScreen');
  });

  it('маршруты на главном экране не повторяются', () => {
    const main = allMainCards().map((c) => c.route);
    expect(new Set(main).size).toBe(main.length);
  });

  it('цвет раздела есть в обеих палитрах', () => {
    for (const card of allCards) {
      expect(palette.light.section[card.section]).toEqual(expect.any(String));
      expect(palette.dark.section[card.section]).toEqual(expect.any(String));
    }
  });

  it('значки существуют в наборе Ionicons', () => {
    for (const card of [...allMainCards(), ...OXYGEN_MENU]) {
      expect(ionicons[card.icon]).toBeDefined();
    }
  });

  it('названия без эмодзи и с пояснением', () => {
    for (const card of allCards) {
      expect(card.title).toBe(stripEmoji(card.title));
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.description.length).toBeGreaterThan(0);
    }
  });

  it('режимы темы совпадают с THEME_MODES', () => {
    expect(THEME_MODE_OPTIONS.map((o) => o.value)).toEqual(THEME_MODES);
    expect(THEME_MODE_OPTIONS.map((o) => o.label)).toEqual(['Авто', 'Светлая', 'Тёмная']);
  });

  it('cardA11yLabel склеивает название и пояснение', () => {
    expect(cardA11yLabel({ title: 'NEWS2', description: 'Оценка' })).toBe('NEWS2, Оценка');
    expect(cardA11yLabel({ title: 'NEWS2' })).toBe('NEWS2');
  });

  it('gridColumns: 2 столбца только на широком экране без крупного шрифта', () => {
    expect(gridColumns(360, 1)).toBe(1);
    expect(gridColumns(599, 1)).toBe(1);
    expect(gridColumns(600, 1)).toBe(2);
    expect(gridColumns(800, 1.29)).toBe(2);
    expect(gridColumns(800, 1.3)).toBe(1);
    expect(gridColumns(800, 1.5)).toBe(1);
    expect(gridColumns(800, undefined)).toBe(2);
    expect(gridColumns(NaN, 1)).toBe(1);
  });
});
