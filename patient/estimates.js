// estimates.js — чистые функции оценки параметров ребёнка (без React).
//
// 1. Масса по возрасту — формулы APLS (Advanced Paediatric Life Support, ALSG; действуют
//    с 5-го издания, 2011; заменили прежнюю «2 × (возраст + 4)»):
//      0–12 мес:  0,5 × возраст (мес) + 4
//      1–5 лет:   2 × возраст (лет) + 8
//      6–12 лет:  3 × возраст (лет) + 7
//    Старше 12 лет формула не применяется (null) — массу нужно взвесить или спросить.
//
// 2. Зоны ленты Broselow-Luten, версия 2017 (Broselow Pediatric Emergency Tape 2017 Edition A,
//    Armstrong Medical / Vyaire). Зоны пересмотрены по данным NHANES.
//    Длина (см) — Oommen JZ et al. «Accuracy of Weight Estimation Using the Broselow Tape
//    in a Peruvian Pediatric Population», Cureus 2021;13(6):e15807, табл. 5 (лента 2017 г.).
//    Масса (кг) — там же и Zhu S et al., Front Pediatr 2022;10:969016 (лента 2017 г.):
//    3–5, 6–7, 8–9, 10–11, 12–14, 15–18, 19–23, 24–29, 30–36 кг. (В табл. 5 у Oommen для
//    синей/оранжевой зон напечатано 19–22 и 24–28 — это опечатка: на ленте и у Zhu 19–23, 24–29.)
//    Сверка: таблица в Wikipedia «Broselow tape» (без ссылки на издание) даёт границы
//    длины на 0,2–0,3 см больше (46,8/59,2/66,9/74,2/83,8/95,4/108,3/121,5/130,7/143,3) —
//    расхождение меньше погрешности измерения, используем опубликованную таблицу Oommen.
//    Ориентировочный возраст (новорождённый, 4 мес, 8 мес, 1, 2, 4, 6, 8, 10 лет) — по той же
//    таблице Wikipedia; первичного источника для возраста по зонам нет, поэтому это только
//    подсказка в интерфейсе и грубая проверка ageWeightMismatch, а не критерий выбора зоны.
//    Границы: нижняя включительно, верхняя — нет; последняя зона — до 143,3 см включительно.

// ----- Масса по возрасту (APLS) -----

const round1 = (x) => Math.round(x * 10) / 10;

export function estimateWeightApls(ageMonths) {
  if (ageMonths === null || ageMonths === undefined) return null;
  const m = Number(ageMonths);
  if (!Number.isFinite(m) || m < 0) return null;
  if (m < 12) return round1(0.5 * m + 4);
  const years = Math.floor(m / 12);
  if (years <= 5) return 2 * years + 8;
  if (years <= 12) return 3 * years + 7;
  return null;
}

// ----- Зоны Broselow-Luten 2017 -----

// key совпадает с ключами theme/broselow.js (цвет ленты)
export const BROSELOW_ZONES = Object.freeze(
  [
    {
      key: 'grey',
      name: 'Серая',
      lengthMinCm: 46.6,
      lengthMaxCm: 59.0,
      weightMinKg: 3,
      weightMaxKg: 5,
      typicalAge: 'новорождённый — 2 мес',
      typicalAgeMonths: 1,
    },
    {
      key: 'pink',
      name: 'Розовая',
      lengthMinCm: 59.0,
      lengthMaxCm: 66.7,
      weightMinKg: 6,
      weightMaxKg: 7,
      typicalAge: '≈ 4 мес',
      typicalAgeMonths: 4,
    },
    {
      key: 'red',
      name: 'Красная',
      lengthMinCm: 66.7,
      lengthMaxCm: 74.0,
      weightMinKg: 8,
      weightMaxKg: 9,
      typicalAge: '≈ 8 мес',
      typicalAgeMonths: 8,
    },
    {
      key: 'purple',
      name: 'Фиолетовая',
      lengthMinCm: 74.0,
      lengthMaxCm: 83.6,
      weightMinKg: 10,
      weightMaxKg: 11,
      typicalAge: '≈ 1 год',
      typicalAgeMonths: 12,
    },
    {
      key: 'yellow',
      name: 'Жёлтая',
      lengthMinCm: 83.6,
      lengthMaxCm: 95.2,
      weightMinKg: 12,
      weightMaxKg: 14,
      typicalAge: '≈ 2 года',
      typicalAgeMonths: 24,
    },
    {
      key: 'white',
      name: 'Белая',
      lengthMinCm: 95.2,
      lengthMaxCm: 108.0,
      weightMinKg: 15,
      weightMaxKg: 18,
      typicalAge: '≈ 4 года',
      typicalAgeMonths: 48,
    },
    {
      key: 'blue',
      name: 'Синяя',
      lengthMinCm: 108.0,
      lengthMaxCm: 121.2,
      weightMinKg: 19,
      weightMaxKg: 23,
      typicalAge: '≈ 6 лет',
      typicalAgeMonths: 72,
    },
    {
      key: 'orange',
      name: 'Оранжевая',
      lengthMinCm: 121.2,
      lengthMaxCm: 130.4,
      weightMinKg: 24,
      weightMaxKg: 29,
      typicalAge: '≈ 8 лет',
      typicalAgeMonths: 96,
    },
    {
      key: 'green',
      name: 'Зелёная',
      lengthMinCm: 130.4,
      lengthMaxCm: 143.3,
      weightMinKg: 30,
      weightMaxKg: 36,
      typicalAge: '≈ 10 лет',
      typicalAgeMonths: 120,
    },
  ].map((z) =>
    Object.freeze({
      ...z,
      // Масса для расчёта доз — середина диапазона зоны
      weightKg: (z.weightMinKg + z.weightMaxKg) / 2,
    }),
  ),
);

export const BROSELOW_VERSION = '2017';
export const BROSELOW_MIN_LENGTH_CM = BROSELOW_ZONES[0].lengthMinCm;
export const BROSELOW_MAX_LENGTH_CM = BROSELOW_ZONES[BROSELOW_ZONES.length - 1].lengthMaxCm;

const toNum = (v) => {
  if (v === null || v === undefined || v === '') return NaN;
  return Number(v);
};

export function zoneByKey(key) {
  return BROSELOW_ZONES.find((z) => z.key === key) || null;
}

export function zoneIndex(key) {
  return BROSELOW_ZONES.findIndex((z) => z.key === key);
}

// Зона по длине (росту) ребёнка, см. Вне ленты — null.
export function zoneByHeight(heightCm) {
  const h = toNum(heightCm);
  if (!Number.isFinite(h)) return null;
  const last = BROSELOW_ZONES.length - 1;
  for (let i = 0; i <= last; i++) {
    const z = BROSELOW_ZONES[i];
    if (h >= z.lengthMinCm && (h < z.lengthMaxCm || (i === last && h <= z.lengthMaxCm))) return z;
  }
  return null;
}

// Зона по массе, кг. Диапазоны на ленте целые (3–5, 6–7, …); дробная масса между ними
// относится к зоне ниже следующей границы: 5,5 кг → серая, 6 кг → розовая. Вне 3–36,9 кг — null.
export function zoneByWeight(weightKg) {
  const w = toNum(weightKg);
  if (!Number.isFinite(w)) return null;
  const last = BROSELOW_ZONES.length - 1;
  for (let i = 0; i <= last; i++) {
    const z = BROSELOW_ZONES[i];
    const upper = i === last ? z.weightMaxKg + 1 : BROSELOW_ZONES[i + 1].weightMinKg;
    if (w >= z.weightMinKg && w < upper) return z;
  }
  return null;
}

// ----- Возраст -----

const plural = (n, one, few, many) => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
};

export const yearsWord = (n) => plural(n, 'год', 'года', 'лет');

// 0 → «новорождённый», 7 → «7 мес», 12 → «1 год», 63 → «5 лет 3 мес»; нет данных → ''
export function formatAge(ageMonths) {
  if (ageMonths === null || ageMonths === undefined || ageMonths === '') return '';
  const total = Math.floor(Number(ageMonths));
  if (!Number.isFinite(total) || total < 0) return '';
  if (total === 0) return 'новорождённый';
  if (total < 12) return `${total} мес`;
  const y = Math.floor(total / 12);
  const m = total % 12;
  const years = `${y} ${yearsWord(y)}`;
  return m ? `${years} ${m} мес` : years;
}

// «лет + мес» → полный возраст в месяцах. Пустые оба поля → null.
// Дробные годы допустимы (1,5 года → 18 мес); результат округляется вниз до целого месяца.
export function composeAgeMonths(years, months) {
  const y = years === null || years === undefined || years === '' ? null : Number(years);
  const m = months === null || months === undefined || months === '' ? null : Number(months);
  if (y === null && m === null) return null;
  if (
    (y !== null && (!Number.isFinite(y) || y < 0)) ||
    (m !== null && (!Number.isFinite(m) || m < 0))
  )
    return null;
  return Math.floor((y || 0) * 12 + (m || 0) + 1e-9);
}

// Полный возраст в месяцах → { years, months } (63 → { years: 5, months: 3 }); null → null
export function splitAgeMonths(ageMonths) {
  if (ageMonths === null || ageMonths === undefined) return null;
  const total = Math.floor(Number(ageMonths));
  if (!Number.isFinite(total) || total < 0) return null;
  return { years: Math.floor(total / 12), months: total % 12 };
}

// ----- Несоответствие возраста и массы -----

// Ожидаемая зона по возрасту — зона с ближайшим ориентировочным возрастом на ленте.
// Старше 12 лет лента не применяется — null.
export function zoneByAge(ageMonths) {
  if (ageMonths === null || ageMonths === undefined) return null;
  const a = Number(ageMonths);
  if (!Number.isFinite(a) || a < 0 || a >= 13 * 12) return null;
  let best = BROSELOW_ZONES[0];
  for (const z of BROSELOW_ZONES) {
    if (Math.abs(z.typicalAgeMonths - a) < Math.abs(best.typicalAgeMonths - a)) best = z;
  }
  return best;
}

// Предупреждение, если масса отличается от типичной для возраста больше чем на 2 зоны ленты.
// Масса меньше нижней границы ленты считается зоной «−1», больше верхней — зоной «10».
// Возвращает null, если данных недостаточно или возраст вне ленты; иначе
// { mismatch, diff, expectedZone, weightZone, direction: 'lighter' | 'heavier' | null }.
export function ageWeightMismatch(ageMonths, weightKg) {
  const expected = zoneByAge(ageMonths);
  const w = toNum(weightKg);
  if (!expected || !Number.isFinite(w) || w <= 0) return null;
  const wz = zoneByWeight(w);
  let wIndex;
  if (wz) wIndex = zoneIndex(wz.key);
  else wIndex = w < BROSELOW_ZONES[0].weightMinKg ? -1 : BROSELOW_ZONES.length;
  const diff = wIndex - zoneIndex(expected.key);
  const mismatch = Math.abs(diff) > 2;
  return {
    mismatch,
    diff,
    expectedZone: expected,
    weightZone: wz,
    direction: mismatch ? (diff < 0 ? 'lighter' : 'heavier') : null,
  };
}
