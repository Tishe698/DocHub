// genevaScore.js — пересмотренная Женевская шкала (Revised Geneva Score, полная версия):
// пункты, подсчёт и интерпретация (чистые функции). Экран — Tela/tela.js, тесты — Tela/__tests__.
//
// Источник — Le Gal G. et al. Ann Intern Med 2006;144:165-171;
// ESC 2019 (Konstantinides S.V. et al., Eur Heart J 2020;41:543-603), табл. 5;
// русские формулировки — РЛС и Видаль (калькуляторы «Пересмотренная Женевская шкала»).
//  +1  Возраст > 65 лет
//  +3  ТГВ/ТЭЛА в анамнезе
//  +2  Операция под общей анестезией или перелом нижней конечности за последний месяц
//  +2  Активная злокачественная опухоль
//  +3  Односторонняя боль в нижней конечности
//  +2  Кровохарканье
//  +3  ЧСС 75–94
//  +5  ЧСС ≥95
//  +4  Болезненность при пальпации по ходу глубоких вен И односторонний отёк
//      нижней конечности (нужны оба признака; Le Gal 2006)
//
// Вероятность ТЭЛА (трёхуровневая схема; распространённость — Le Gal 2006,
// валидационная выборка): 0–3 — низкая (≈8%), 4–10 — средняя (≈28%), ≥11 — высокая (≈74%).
// Двухуровневая схема (ESC 2019, табл. 5): 0–5 — ТЭЛА маловероятна, ≥6 — вероятна.
//
// Применимость (ESC 2019, разд. 4 и 9.2): взрослые со стабильной гемодинамикой
// (выборка Le Gal 2006 — взрослые пациенты отделений неотложной помощи).
// При шоке/гипотензии — алгоритм ТЭЛА высокого риска без шкал.
// У беременных — отдельный алгоритм ESC 2019 (рис. 7).
//
// Клинические значения перенесены без изменений из ветки fix/clinical-audit.
import { formatAge } from '../patient/estimates';

// Порог пункта «возраст > 65 лет» (Le Gal 2006). Возраст пациента хранится в полных месяцах:
// пункт отмечается, если возраст больше 65 лет 0 мес (65 лет 1 мес и старше). Ровно 65 лет 0 мес
// не отмечается. Подставленное значение можно изменить вручную.
export const AGE_THRESHOLD_MONTHS = 65 * 12;
// Взрослые — с 18 лет (выборка Le Gal 2006 — взрослые; у детей шкала не валидирована).
export const ADULT_MONTHS = 18 * 12;

// ESC 2019 табл. 5; формулировки — Le Gal 2006, РЛС
export const BASE_ITEMS = [
  { id: 'age', pts: 1, label: 'Возраст > 65 лет' },
  { id: 'prev_vte', pts: 3, label: 'ТГВ/ТЭЛА в анамнезе' },
  // Le Gal 2006 (табл.), РЛС: «операция под общим наркозом или перелом нижних конечностей ≤1 мес.»
  {
    id: 'surgery',
    pts: 2,
    label: 'Операция под общей анестезией или перелом нижней конечности за последний месяц',
    hint: 'Ушиб, растяжение, травма без перелома не учитываются',
  },
  { id: 'cancer', pts: 2, label: 'Активная злокачественная опухоль' },
  // Le Gal 2006: «unilateral lower limb pain»
  { id: 'unilateral_pain', pts: 3, label: 'Односторонняя боль в нижней конечности' },
  { id: 'hemoptysis', pts: 2, label: 'Кровохарканье' },
  // ЧСС — отдельный выбор (HR_OPTIONS)
  // Le Gal 2006: «pain on lower limb deep venous palpation AND unilateral oedema» — оба признака
  {
    id: 'dvt_signs',
    pts: 4,
    label:
      'Болезненность при пальпации по ходу глубоких вен И односторонний отёк нижней конечности',
    hint: 'Нужны оба признака. Только боль в ноге — отмечайте пункт «Односторонняя боль»',
  },
];

// Le Gal 2006: ЧСС — обязательный пункт; по умолчанию не выбрана (иначе сумма занижается)
export const HR_OPTIONS = [
  { id: 'hr0', label: 'ЧСС < 75', pts: 0 },
  { id: 'hr1', label: 'ЧСС 75–94', pts: 3 },
  { id: 'hr2', label: 'ЧСС ≥ 95', pts: 5 },
];

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

// «балл / балла / баллов»
export function ptsWord(n) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return 'баллов';
  if (b === 1) return 'балл';
  if (b >= 2 && b <= 4) return 'балла';
  return 'баллов';
}

export const emptyFlags = () => Object.fromEntries(BASE_ITEMS.map((i) => [i.id, false]));

// Пункт «возраст > 65 лет» по возрасту пациента: true / false; нет возраста — null.
export function ageFlagFromPatient(ageMonths) {
  if (!isNum(ageMonths) || ageMonths < 0) return null;
  return ageMonths > AGE_THRESHOLD_MONTHS;
}

// Предупреждение о возрасте пациента (null — взрослый или возраст неизвестен).
export function childWarning(ageMonths) {
  if (!isNum(ageMonths) || ageMonths < 0 || ageMonths >= ADULT_MONTHS) return null;
  return `Возраст пациента — ${formatAge(ageMonths)}. У детей Женевская шкала не валидирована: оценивайте вероятность ТЭЛА клинически.`;
}

// Трёхуровневая схема и распространённость ТЭЛА — Le Gal 2006 (валидационная выборка);
// дальнейшая тактика — ESC 2019, алгоритм при стабильной гемодинамике (рис. 5)
export function getRisk(sum) {
  if (sum >= 11) {
    return {
      key: 'high',
      level: 'Высокая',
      badge: 'danger',
      prevalence: '≈74%',
      next: 'КТ-ангиопульмонография. Д-димер для исключения ТЭЛА не использовать.',
    };
  }
  if (sum >= 4) {
    return {
      key: 'intermediate',
      level: 'Средняя',
      badge: 'warning',
      prevalence: '≈28%',
      next: 'Высокочувствительный Д-димер: норма — ТЭЛА исключена, повышен — КТ-ангиопульмонография.',
    };
  }
  return {
    key: 'low',
    level: 'Низкая',
    badge: 'success',
    prevalence: '≈8%',
    next: 'Д-димер: норма — ТЭЛА исключена, повышен — КТ-ангиопульмонография.',
  };
}

// Двухуровневая схема — ESC 2019, табл. 5 (применяют при менее чувствительном Д-димере)
export function getTwoLevel(sum) {
  return sum >= 6
    ? { key: 'likely', text: 'ТЭЛА вероятна (≥6)', next: 'сразу КТ-ангиопульмонография' }
    : { key: 'unlikely', text: 'ТЭЛА маловероятна (0–5)', next: 'Д-димер' };
}

// Подсчёт. flags — { [id пункта]: boolean }, hr — id из HR_OPTIONS или null.
// Без ЧСС итог не выдаётся (EBMcalc: все поля обязательны), но предварительная сумма считается.
export function computeGeneva({ flags = {}, hr = null } = {}) {
  const hrOpt = HR_OPTIONS.find((x) => x.id === hr) || null;
  const base = BASE_ITEMS.reduce((acc, i) => acc + (flags[i.id] ? i.pts : 0), 0);
  const sum = base + (hrOpt ? hrOpt.pts : 0);
  const complete = hrOpt !== null;
  const risk = complete ? getRisk(sum) : null;
  const twoLevel = complete ? getTwoLevel(sum) : null;
  return {
    complete,
    sum,
    hrPts: hrOpt ? hrOpt.pts : null,
    risk,
    twoLevel,
    // ESC 2019: при 6–10 баллах схемы расходятся — с менее чувствительным Д-димером сразу КТ
    discordant: complete && sum >= 6 && sum < 11,
  };
}

// Строка итога для диктора. Пустая — итога нет.
export function genevaSummary(result) {
  if (!result || !result.complete) return '';
  const prevalence = result.risk.prevalence.replace('≈', 'около ').replace('%', ' процентов');
  return `Женевская шкала: ${result.sum} ${ptsWord(result.sum)}. Вероятность ТЭЛА ${result.risk.level.toLowerCase()}, ${prevalence}. ${result.twoLevel.text}`;
}
