// palette.js — семантические цвета светлой и тёмной темы.
// Ключи в обеих палитрах одинаковые; экраны берут цвета только отсюда (через useTheme()).
// Контраст по WCAG 2.1 AA проверяет theme/__tests__/contrast.test.js:
// обычный текст — не ниже 4.5:1, крупный текст, иконки и границы полей — не ниже 3:1.
//
// Правила использования:
//  - текст на bg / surface / surfaceAlt / surfaceRaised — text, textSecondary, textMuted;
//  - success / warning / danger / info — текст и иконки на фоне поверхности или своего *Soft;
//  - on* — текст на сплошной заливке того же цвета (кнопка primary, кнопка danger и т. п.);
//  - section.* — акцент раздела (полоска, иконка, рамка); как текст допустим на surface и bg.

const light = {
  // Фон и поверхности
  bg: '#F4F6F9',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2F6',
  surfaceRaised: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.5)',

  // Линии
  border: '#D5DCE4',
  borderStrong: '#748296',
  divider: '#E3E8EE',

  // Текст
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#5B6B80',
  textInverse: '#FFFFFF',

  // Бренд
  primary: '#1D4ED8',
  primaryPressed: '#1E40AF',
  onPrimary: '#FFFFFF',
  primarySoft: '#DBEAFE',
  onPrimarySoft: '#1E3A8A',

  // Состояния
  success: '#166534',
  successSoft: '#DCFCE7',
  onSuccess: '#FFFFFF',
  warning: '#92400E',
  warningSoft: '#FEF3C7',
  onWarning: '#FFFFFF',
  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  onDanger: '#FFFFFF',
  info: '#075985',
  infoSoft: '#E0F2FE',
  onInfo: '#FFFFFF',

  // Поля ввода
  inputBg: '#FFFFFF',
  inputBorder: '#748296',
  inputBorderFocus: '#1D4ED8',
  inputBorderError: '#B91C1C',
  placeholder: '#5B6B80',

  focusRing: '#1D4ED8',
  shadow: '#0F172A',

  // Акценты разделов главного экрана
  section: {
    drugs: '#1D4ED8',
    airway: '#0E7490',
    shock: '#B91C1C',
    pregnancy: '#BE185D',
    oxygen: '#0369A1',
    icd: '#4338CA',
    pediatrics: '#C2410C',
    blood: '#9F1239',
    gcs: '#6D28D9',
    pe: '#0F766E',
    chf: '#A16207',
    norepinephrine: '#7E22CE',
    news: '#047857',
    apgar: '#B45309',
    defib: '#A21CAF',
  },
};

const dark = {
  bg: '#0B1220',
  surface: '#111A2B',
  surfaceAlt: '#172235',
  surfaceRaised: '#1C2940',
  overlay: 'rgba(0, 0, 0, 0.65)',

  border: '#2A3850',
  borderStrong: '#6B7C96',
  divider: '#1F2B40',

  text: '#E6EDF5',
  textSecondary: '#AAB7C9',
  textMuted: '#8D9CB1',
  textInverse: '#0B1220',

  primary: '#60A5FA',
  primaryPressed: '#3B82F6',
  onPrimary: '#0B1220',
  primarySoft: '#1E3A5F',
  onPrimarySoft: '#BFDBFE',

  success: '#4ADE80',
  successSoft: '#123222',
  onSuccess: '#0B1220',
  warning: '#FBBF24',
  warningSoft: '#3A2A0A',
  onWarning: '#0B1220',
  danger: '#F87171',
  dangerSoft: '#3B1518',
  onDanger: '#0B1220',
  info: '#38BDF8',
  infoSoft: '#0C2E44',
  onInfo: '#0B1220',

  inputBg: '#0F1828',
  inputBorder: '#6B7C96',
  inputBorderFocus: '#60A5FA',
  inputBorderError: '#F87171',
  placeholder: '#8D9CB1',

  focusRing: '#93C5FD',
  // В тёмной теме тени не рисуются: поверхность выделяется surfaceRaised и границей
  shadow: 'transparent',

  section: {
    drugs: '#93C5FD',
    airway: '#67E8F9',
    shock: '#FCA5A5',
    pregnancy: '#F9A8D4',
    oxygen: '#7DD3FC',
    icd: '#A5B4FC',
    pediatrics: '#FDBA74',
    blood: '#FDA4AF',
    gcs: '#C4B5FD',
    pe: '#5EEAD4',
    chf: '#FCD34D',
    norepinephrine: '#D8B4FE',
    news: '#6EE7B7',
    apgar: '#FDE68A',
    defib: '#F0ABFC',
  },
};

const palette = { light, dark };

export default palette;
