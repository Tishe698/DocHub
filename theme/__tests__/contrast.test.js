// Контраст палитры по формуле WCAG 2.1 (относительная яркость sRGB).
// https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
import palette from '../palette';
import broselowColors from '../broselow';

const channel = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`Ожидался цвет #RRGGBB, получено ${hex}`);
  const n = parseInt(m[1], 16);
  const r = channel((n >> 16) & 255);
  const g = channel((n >> 8) & 255);
  const b = channel(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const TEXT = 4.5; // обычный текст
const LARGE = 3; // крупный текст, иконки, границы полей

const SURFACES = ['bg', 'surface', 'surfaceAlt', 'surfaceRaised'];
const STATES = ['success', 'warning', 'danger', 'info'];

// [передний план, фон, минимум]
const pairs = [
  ...SURFACES.flatMap((s) => [
    ['text', s, TEXT],
    ['textSecondary', s, TEXT],
    ['textMuted', s, TEXT],
  ]),
  ['textInverse', 'text', TEXT],
  ['onPrimary', 'primary', TEXT],
  ['onPrimary', 'primaryPressed', TEXT],
  ['onPrimarySoft', 'primarySoft', TEXT],
  ['primary', 'surface', TEXT],
  ['primary', 'bg', TEXT],
  ...STATES.flatMap((st) => [
    [st, `${st}Soft`, TEXT],
    ['text', `${st}Soft`, TEXT],
    [st, 'surface', TEXT],
    [st, 'bg', TEXT],
    [`on${st[0].toUpperCase()}${st.slice(1)}`, st, TEXT],
  ]),
  ['text', 'inputBg', TEXT],
  ['placeholder', 'inputBg', TEXT],
  ['inputBorder', 'inputBg', LARGE],
  ['inputBorderFocus', 'inputBg', LARGE],
  ['inputBorderError', 'inputBg', LARGE],
  ['borderStrong', 'surface', LARGE],
  ['focusRing', 'surface', LARGE],
  ['focusRing', 'bg', LARGE],
];

describe.each(['light', 'dark'])('палитра %s', (name) => {
  const colors = palette[name];

  it.each(pairs)('%s на %s ≥ %d:1', (fg, bg, min) => {
    expect(colors[fg]).toBeDefined();
    expect(colors[bg]).toBeDefined();
    expect(contrast(colors[fg], colors[bg])).toBeGreaterThanOrEqual(min);
  });

  it.each(Object.keys(palette.light.section))('акцент раздела %s читаем на surface и bg', (key) => {
    expect(contrast(colors.section[key], colors.surface)).toBeGreaterThanOrEqual(TEXT);
    expect(contrast(colors.section[key], colors.bg)).toBeGreaterThanOrEqual(TEXT);
  });
});

describe('структура палитр', () => {
  it('у светлой и тёмной темы одинаковые ключи', () => {
    expect(Object.keys(palette.dark).sort()).toEqual(Object.keys(palette.light).sort());
    expect(Object.keys(palette.dark.section).sort()).toEqual(
      Object.keys(palette.light.section).sort()
    );
  });

  it('есть все разделы главного экрана', () => {
    const required = [
      'drugs',
      'airway',
      'shock',
      'pregnancy',
      'oxygen',
      'icd',
      'pediatrics',
      'blood',
      'gcs',
      'pe',
      'chf',
      'norepinephrine',
      'news',
      'apgar',
    ];
    for (const name of ['light', 'dark']) {
      for (const key of required) expect(palette[name].section[key]).toBeDefined();
    }
  });
});

describe('лента Broselow', () => {
  it.each(Object.keys(broselowColors))('текст на зоне %s ≥ 4.5:1', (key) => {
    const z = broselowColors[key];
    expect(contrast(z.text, z.bg)).toBeGreaterThanOrEqual(TEXT);
  });

  it('белая зона отличима от белой поверхности по границе', () => {
    expect(contrast(broselowColors.white.border, palette.light.surface)).toBeGreaterThanOrEqual(
      LARGE
    );
  });
});
