// tokens.js — размеры, отступы, скругления, типографика и масштабирование шрифта.
// Не зависят от светлой/тёмной схемы; цвета — в palette.js.

// Отступы (сетка 4 pt)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Скругления
export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
};

// Минимальная зона касания (Android Material и WCAG 2.5.5 — 48 dp)
export const MIN_TOUCH = 48;

// Типографика. Размеры — базовые; система увеличивает их до fontScaling.maxScale.
// number — крупные результаты расчёта: цифры одинаковой ширины (tabular-nums),
// чтобы значение не «прыгало» при пересчёте.
export const typography = {
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  number: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
};

// Масштабирование шрифта (components/AppText.js).
// maxScale 1.5: при 1.2 людям со слабым зрением не хватает, а выше 1.5 плотные
// клинические таблицы теряют читаемость без отдельной вёрстки.
export const fontScaling = {
  enabled: true,
  maxScale: 1.5,
  // minFontSizeMultiplier — нижний предел для adjustsFontSizeToFit (iOS)
  minScale: 0.8,
};

const tokens = { spacing, radius, typography, fontScaling, MIN_TOUCH };

export default tokens;
