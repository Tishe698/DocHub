// CalculateTube.js — подбор размера ларингеальной трубки VBM LT / LTS-D.
// Источник таблицы: VBM Medizintechnik, Laryngeal Tube LTS-D, инструкция по применению
// G3082-06/04.2017, с. 11 «Product specifications» (размер, масса/рост, цвет коннектора ISO 15 мм,
// рекомендуемый объём манжеты, максимальное давление в манжете, дренажный канал).
// Клинических рекомендаций МЗ РФ с таблицей размеров ларингеальной трубки нет — применяется
// документация производителя. К ларингеальной маске и i-gel таблица не относится.

// Максимальное давление в манжете — 60 см вод. ст. (VBM LTS-D IFU 2017, с. 11).
// Производитель: после раздувания снизить давление до давления утечки и регулярно контролировать.
export const LT_MAX_CUFF_PRESSURE_CMH2O = 60;

// Строки таблицы VBM LTS-D IFU 2017, с. 11. Цвет — маркировка 15-мм коннектора производителя.
// Объём манжеты — рекомендуемый объём раздувания; дренаж — канал LTS-D для желудочного зонда.
export const LT_SIZES = {
  0: {
    tubeSize: '0',
    tubeColor: 'Прозрачный',
    group: 'масса < 5 кг',
    cuffVolume: '10 мл',
    drainFr: '10 Fr',
  },
  1: {
    tubeSize: '1',
    tubeColor: 'Белый',
    group: 'масса 5–12 кг',
    cuffVolume: '20 мл',
    drainFr: '10 Fr',
  },
  2: {
    tubeSize: '2',
    tubeColor: 'Зелёный',
    group: 'масса 12–25 кг',
    cuffVolume: '35 мл',
    drainFr: '16 Fr',
  },
  2.5: {
    tubeSize: '2.5',
    tubeColor: 'Оранжевый',
    group: 'дети, рост 125–150 см',
    cuffVolume: '40–45 мл',
    drainFr: '16 Fr',
  },
  3: {
    tubeSize: '3',
    tubeColor: 'Жёлтый',
    group: 'рост < 155 см',
    cuffVolume: '50–60 мл',
    drainFr: '18 Fr',
  },
  4: {
    tubeSize: '4',
    tubeColor: 'Красный',
    group: 'рост 155–180 см',
    cuffVolume: '70–80 мл',
    drainFr: '18 Fr',
  },
  5: {
    tubeSize: '5',
    tubeColor: 'Фиолетовый',
    group: 'рост > 180 см',
    cuffVolume: '80–90 мл',
    drainFr: '18 Fr',
  },
};

// Пределы правдоподобия ввода (клиническое суждение, защита от опечаток и роста в метрах).
export const LT_INPUT_LIMITS = {
  weightMin: 0.5,
  weightMax: 250, // кг
  heightMin: 40,
  heightMax: 230, // см
};

// Масса, выше которой у детей размер определяется по росту (VBM: #2 — 12–25 кг, #2.5 — 125–150 см).
const CHILD_WEIGHT_BY_HEIGHT = 25;

const fmt = (n) => String(n).replace('.', ',');

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

// Нужен ли рост для расчёта: взрослым всегда, детям — только при массе > 25 кг.
export const isHeightRequired = (category, weight) =>
  category === 'adult' ||
  (category === 'child' && isNum(weight) && weight > CHILD_WEIGHT_BY_HEIGHT);

// Проверка ввода. Возвращает текст ошибки или null. weight/height — числа или undefined.
export const validateTubeInput = (category, weight, height) => {
  const L = LT_INPUT_LIMITS;
  if (category !== 'child' && category !== 'adult') {
    return 'Выберите категорию пациента: ребёнок или взрослый';
  }
  if (category === 'child') {
    if (!isNum(weight) || weight <= 0) return 'Введите массу ребёнка (кг)';
    if (weight < L.weightMin || weight > L.weightMax) {
      return `Масса вне допустимого диапазона ${fmt(L.weightMin)}–${fmt(L.weightMax)} кг. Проверьте ввод`;
    }
  }
  const heightNeeded = isHeightRequired(category, weight);
  const heightGiven = isNum(height) && height > 0;
  if (heightNeeded && !heightGiven) {
    return category === 'adult'
      ? 'Введите рост пациента (см): у взрослых размер определяется по росту'
      : 'Введите рост (см): при массе > 25 кг размер определяется по росту';
  }
  if (heightGiven) {
    if (height < 3) {
      return `Похоже, рост введён в метрах. Введите в сантиметрах (например, ${Math.round(height * 100)})`;
    }
    if (height < L.heightMin || height > L.heightMax) {
      return `Рост вне допустимого диапазона ${L.heightMin}–${L.heightMax} см. Проверьте ввод`;
    }
  }
  return null;
};

const withRow = (key, basis, extra = {}) => ({
  ...LT_SIZES[key],
  maxCuffPressure: `${LT_MAX_CUFF_PRESSURE_CMH2O} см вод. ст.`,
  basis,
  warning: '',
  options: [],
  ...extra,
});

// Взрослая часть таблицы — только по росту (VBM LTS-D IFU 2017, с. 11:
// #3 — < 155 см, #4 — 155–180 см, #5 — > 180 см).
const byAdultHeight = (height, basisPrefix) => {
  if (height < 155) return withRow('3', `${basisPrefix}рост < 155 см`);
  if (height <= 180) return withRow('4', `${basisPrefix}рост 155–180 см`);
  return withRow('5', `${basisPrefix}рост > 180 см`);
};

/**
 * Подбор размера ларингеальной трубки VBM LT/LTS-D.
 * @param {number|undefined} weight масса, кг (нужна только детям)
 * @param {number|undefined} height рост, см (взрослым — всегда, детям — при массе > 25 кг)
 * @param {'child'|'adult'} category категория пациента
 * @returns {{tubeSize:string, tubeColor:string, group?:string, cuffVolume?:string, drainFr?:string,
 *   maxCuffPressure?:string, basis:string, warning:string, options:string[]}}
 *   tubeSize === '' — размер по таблице не определён, причина в warning.
 */
const calculateTubeLogic = (weight, height, category) => {
  const empty = (warning, options = []) => ({
    tubeSize: '',
    tubeColor: '',
    basis: '',
    warning,
    options,
  });

  const inputError = validateTubeInput(category, weight, height);
  if (inputError) return empty(inputError);

  if (category === 'adult') {
    // Взрослые — только по росту; масса таблицей VBM не используется.
    return byAdultHeight(height, 'взрослый, ');
  }

  // Дети: #0–#2 — по массе (VBM: #0 < 5 кг, #1 5–12 кг, #2 12–25 кг).
  if (weight < 5) return withRow('0', 'ребёнок, масса < 5 кг');
  if (weight < 12) return withRow('1', 'ребёнок, масса 5–12 кг');
  if (weight <= CHILD_WEIGHT_BY_HEIGHT) {
    const row = withRow('2', 'ребёнок, масса 12–25 кг');
    if (isNum(height) && height > 150) {
      row.warning = 'Рост > 150 см при массе ≤ 25 кг — проверьте данные. Размер выбран по массе.';
    }
    return row;
  }

  // Дети > 25 кг — по росту. #2.5 — дети 125–150 см (VBM LTS-D IFU 2017, с. 11).
  if (height >= 125 && height <= 150) return withRow('2.5', 'ребёнок > 25 кг, рост 125–150 см');
  // Выше 150 см — взрослые строки таблицы VBM (#3 < 155 см, #4 155–180, #5 > 180).
  if (height > 150) return byAdultHeight(height, 'ребёнок > 25 кг, по взрослой строке: ');

  // Масса > 25 кг и рост < 125 см — такой строки в таблице VBM нет. Взрослый #3 не выдаём:
  // детский набор VBM включает #0–#2.5, #3 — взрослый ствол 17,6 мм (IFU 2017, с. 11–12).
  return empty(
    'Масса > 25 кг при росте < 125 см — вне таблицы производителя. ' +
      'Рассмотрите размер 2 (зелёный) или 2.5 (оранжевый) с учётом роста; ' +
      'после установки проверьте герметичность и вентиляцию.',
    ['2', '2.5'],
  );
};

export default calculateTubeLogic;
