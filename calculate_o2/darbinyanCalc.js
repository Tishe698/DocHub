// darbinyanCalc.js — минутный объём дыхания по формуле Дарбиняна (чистые функции, без React).
// Значения перенесены без изменений из ветки fix/clinical-audit (calc_dorbinyn.js).
import { predictedBodyWeight } from './ventilatorCalc';

// Границы применимости, кг.
// Нижняя: при массе < 5 кг формула завышает МОД в 1,5–5 раз (норма новорождённых ≈ 200 мл/кг/мин);
// новорождённых вентилируют по давлению и частоте (ERC 2021, Newborn Life Support), а не по МОД.
// 5–30 кг — дети: показываем результат с оговоркой. Верхняя — проверка правдоподобия ввода.
export const WEIGHT_MIN = 5;
export const WEIGHT_CHILD = 30;
export const WEIGHT_MAX = 250;
// Поправка на утечку при масочной ИВЛ объёмным аппаратом: +2–3 л/мин
// (описание транспортного аппарата А-ИВЛ 2/20 «ТМТ», ambulance-russia.blogspot.com/2013/04/220.html —
// вторичный источник; применяем только у взрослых, для которых он написан).
export const MASK_LEAK_MIN = 2;
export const MASK_LEAK_MAX = 3;

// 8.5 → «8,5»; 8 → «8».
export const fmt = (x) => String(x).replace('.', ',');

const round1 = (x) => Math.round(x * 10) / 10;

// Формула Дарбиняна (Т.М. Дарбинян и соавт., 1976; учебное пособие «Анестезиология и реаниматология», 2016):
// МОД (л/мин) = масса (кг) / 10 + 1. Округляем до 0,1 л/мин, а не вниз до целого:
// Math.floor занижал МОД до 0,9 л/мин (у детей до 47%).
// Возвращает { error } или { mv, child, maskMin, maskMax }.
export function computeDarbinyan(weight) {
  if (!(weight > 0)) {
    return { error: 'Масса тела должна быть числом больше нуля' };
  }
  if (weight > WEIGHT_MAX) {
    return { error: `Масса больше ${WEIGHT_MAX} кг — проверьте ввод. При ожирении считайте по должной массе тела.` };
  }
  if (weight < WEIGHT_MIN) {
    return {
      error: `При массе меньше ${WEIGHT_MIN} кг формула Дарбиняна не применяется: она завышает МОД в 1,5–5 раз. Новорождённых вентилируют по давлению и частоте (ERC, NLS 2021); для детей — ДО 6–8 мл/кг × возрастная ЧДД (экран «Аппаратная ИВЛ»).`,
    };
  }
  const mv = round1(weight / 10 + 1);
  const child = weight < WEIGHT_CHILD;
  return {
    mv,
    child,
    maskMin: child ? null : round1(mv + MASK_LEAK_MIN),
    maskMax: child ? null : round1(mv + MASK_LEAK_MAX),
  };
}

// Расчёт для экрана: по фактической массе (basis 'actual') или по должной массе тела
// по росту и полу (basis 'pbw'; ARDSNet, NEJM 2000; КР ФАР «Диагностика и интенсивная терапия ОРДС», 2020 —
// при ожирении вентиляцию считают на должную массу).
// Вход: { weightKg, heightCm, sex, basis }.
// Выход: { basis, massKg, pbw: { kg, sex, sexAssumed } | null, ...computeDarbinyan(massKg) }
//        или { basis, massKg: null, pbw, error } (нет данных или масса вне пределов).
export function darbinyanFor({ weightKg, heightCm, sex, basis = 'actual' }) {
  const pbwRaw = predictedBodyWeight(sex, heightCm);
  const pbw = pbwRaw ? { ...pbwRaw, kg: round1(pbwRaw.kg) } : null;
  if (basis === 'pbw') {
    if (!pbw) {
      return { basis, massKg: null, pbw, error: 'Для должной массы введите рост (130–230 см) и пол.' };
    }
    // Здесь пол не подставляем: заниженный МОД — тоже риск (гиповентиляция), «консервативной» стороны нет
    if (pbw.sexAssumed) {
      return { basis, massKg: null, pbw: null, error: 'Для должной массы укажите пол пациента.' };
    }
    return { basis, massKg: pbw.kg, pbw, ...computeDarbinyan(pbw.kg) };
  }
  const w = typeof weightKg === 'number' && Number.isFinite(weightKg) ? weightKg : null;
  if (w === null) return { basis, massKg: null, pbw, error: null };
  return { basis, massKg: w, pbw, ...computeDarbinyan(w) };
}
