// pregnancyCalc.js — срок беременности и ПДР по первому дню последней менструации (ДПМ).
// Чистые функции без React; экран pregnancy.js только вызывает их. Тесты — __tests__/pregnancyCalc.test.js.
//
// Все расчёты — в календарных днях местной даты (год, месяц, число), а не в миллисекундах:
// при переходе на летнее/зимнее время в сутках 23 или 25 часов, а в некоторых поясах
// полночь при переходе вовсе не существует (часы прыгают с 00:00 на 01:00).

export const MS_PER_DAY = 1000 * 60 * 60 * 24;

// ПДР = ДПМ + 280 дней (40 нед) — КР МЗ РФ «Нормальная беременность» 2023 (ID 288),
// раздел определения сроков (правило Негеле в днях).
export const DAYS_TO_DUE = 280;
// 22⁰ нед: с этого срока прерывание — роды (преждевременные), до него — выкидыш.
// КР МЗ РФ «Преждевременные роды» 2024 (ID 331), «Термины и определения»: 22⁰–36⁶ нед.
export const DAYS_22W = 22 * 7;
// 37⁰–41⁶ нед — доношенный срок: КР МЗ РФ «Нормальная беременность» 2023 (ID 288), определение.
export const DAYS_37W = 37 * 7;
// ≥42⁰ нед (294 дня) — переношенная беременность: МКБ-10 O48, определение ВОЗ.
export const DAYS_42W = 42 * 7;
// Больше 45⁰ нед по ДПМ беременность не продолжается — почти наверняка ошибка в дате (год).
// Предел консервативный, введён для защиты от опечаток (логика интерфейса, не норматив).
export const DAYS_MAX = 45 * 7;

// ---------------------- Календарные дни ----------------------

// Местная полночь того же числа. Если полночи в этот день нет (переход на летнее время
// в 00:00), JS даёт 01:00 того же числа — дата не меняется.
export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// Номер календарного дня местной даты — через UTC, где суток всегда 24 часа.
const dayNumber = (d) =>
  Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS_PER_DAY);

// Разница в календарных днях (to − from); время суток не учитывается.
export const daysBetween = (from, to) => dayNumber(to) - dayNumber(from);

// Дата через n календарных дней (местная полночь).
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// Миллисекунды до следующей местной полуночи (+5 с запаса) — для пересчёта срока в новый день.
export const msUntilNextMidnight = (now) => {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
  return Math.max(1000, next.getTime() - now.getTime());
};

// Границы календаря выбора ДПМ: не раньше 45⁰ нед назад и не позже сегодняшнего дня.
export const minLmpDate = (today) => addDays(today, -DAYS_MAX);
export const maxLmpDate = (today) =>
  new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

// ---------------------- Категории срока ----------------------

export const CATEGORIES = Object.freeze({
  early: Object.freeze({
    level: 'info',
    text: 'До 22⁰ нед: прерывание — выкидыш, не роды',
    spoken: 'Меньше 22 недель: прерывание — выкидыш, не роды',
  }),
  preterm: Object.freeze({
    level: 'warning',
    text: '22⁰–36⁶ нед: роды в этом сроке — преждевременные (КР 2024)',
    spoken: 'От 22 недель до 36 недель 6 дней: роды в этом сроке — преждевременные',
  }),
  term: Object.freeze({
    level: 'success',
    text: '37⁰–41⁶ нед: доношенный срок',
    spoken: 'От 37 недель до 41 недели 6 дней: доношенный срок',
  }),
  postterm: Object.freeze({
    level: 'warning',
    text: '≥42⁰ нед: переношенная беременность',
    spoken: '42 недели и больше: переношенная беременность',
  }),
});

export function pregnancyCategory(daysSinceLMP) {
  if (daysSinceLMP < DAYS_22W) return 'early';
  if (daysSinceLMP < DAYS_37W) return 'preterm';
  if (daysSinceLMP < DAYS_42W) return 'term';
  return 'postterm';
}

// Срок и ПДР. lmpDate и todayDate — Date (время суток не важно).
// Срок записывается полными неделями и днями (N нед M дн) — КР МЗ РФ «Нормальная беременность» 2023.
export function calcPregnancy(lmpDate, todayDate) {
  const lmp = startOfDay(lmpDate);
  const daysSinceLMP = daysBetween(lmp, todayDate);
  const weeks = Math.floor(daysSinceLMP / 7);
  const days = daysSinceLMP - weeks * 7;
  const due = addDays(lmp, DAYS_TO_DUE);
  const daysToDue = daysBetween(todayDate, due);
  return {
    daysSinceLMP,
    weeks,
    days,
    currentWeek: weeks + 1,
    due,
    daysToDue,
    category: pregnancyCategory(daysSinceLMP),
    tooLong: daysSinceLMP > DAYS_MAX,
  };
}

// ---------------------- Ввод даты ----------------------

// Маска дд.мм.гггг. Понимает ввод и вставку с разделителями «. , / - пробел» без ведущих нулей
// («3.5.2026» → «03.05.2026») и ISO «гггг-мм-дд». Цифр не больше 8 — лишние отбрасываются.
export function formatInputDate(value) {
  const raw = String(value ?? '');
  const iso = raw.trim().match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
  if (iso) return `${iso[3].padStart(2, '0')}.${iso[2].padStart(2, '0')}.${iso[1]}`;
  const segs = [''];
  for (const ch of raw) {
    const i = segs.length - 1;
    if (ch >= '0' && ch <= '9') {
      const maxLen = i < 2 ? 2 : 4;
      if (segs[i].length < maxLen) segs[i] += ch;
      else if (i < 2) segs.push(ch);
      // год уже 4 цифры — лишние цифры игнорируем
    } else if (/[.,/\-\s]/.test(ch)) {
      if (i < 2 && segs[i].length > 0) {
        segs[i] = segs[i].padStart(2, '0');
        segs.push('');
      }
    }
  }
  return segs.join('.');
}

export const ERRORS = Object.freeze({
  format: 'Проверьте дату в формате дд.мм.гггг.',
  notExists: 'Такой даты нет. Проверьте дату в формате дд.мм.гггг.',
  future: 'Дата не может быть позже сегодняшней.',
  tooOld: 'Срок по этой дате больше 45 недель. Проверьте дату, особенно год.',
});

// «дд.мм.гггг» → { date } или { error } с причиной для пользователя.
export function parseDDMMYYYY(s, todayDate) {
  const m = String(s ?? '').match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return { error: ERRORS.format };
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  const d = new Date(yyyy, mm - 1, dd);
  // new Date молча «переносит» несуществующие даты (31.02 → 03.03, 99.99 → через годы),
  // а годы 0–99 превращает в 1900–1999 — такие даты отклоняем.
  if (
    isNaN(d.getTime()) ||
    d.getFullYear() !== yyyy ||
    d.getMonth() !== mm - 1 ||
    d.getDate() !== dd
  ) {
    return { error: ERRORS.notExists };
  }
  const diff = daysBetween(d, todayDate);
  // Дата последней менструации не может быть в будущем (как и в календаре: maximumDate)
  if (diff < 0) return { error: ERRORS.future };
  if (diff > DAYS_MAX) return { error: ERRORS.tooOld };
  return { date: startOfDay(d) };
}

// ---------------------- Форматирование ----------------------

export const formatShortDate = (d) =>
  `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;

const MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

// «8 октября 2026 г.» — без Intl: на Android с урезанным ICU Intl ru-RU может быть недоступен.
export const formatRussianDate = (d) =>
  `${d.getDate()} ${MONTHS_GENITIVE[d.getMonth()]} ${d.getFullYear()} г.`;

// Для диктора — без сокращения «г.»
export const spokenRussianDate = (d) =>
  `${d.getDate()} ${MONTHS_GENITIVE[d.getMonth()]} ${d.getFullYear()} года`;

export function plural(n, one, few, many) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

export const weeksWord = (n) => plural(n, 'неделя', 'недели', 'недель');
export const daysWord = (n) => plural(n, 'день', 'дня', 'дней');

// «13 нед 2 дн»
export const formatGestation = (weeks, days) => `${weeks} нед ${days} дн`;
// «13 недель 2 дня»
export const spokenGestation = (weeks, days) =>
  `${weeks} ${weeksWord(weeks)} ${days} ${daysWord(days)}`;

// Строка о ПДР относительно сегодняшнего дня: { text, spoken, level } или null.
export function dueDateStatus(daysToDue) {
  if (daysToDue === 0)
    return { text: 'ПДР — сегодня', spoken: 'Предполагаемая дата родов — сегодня', level: 'info' };
  if (daysToDue < 0) {
    const n = -daysToDue;
    return {
      text: `ПДР прошла ${n} дн назад`,
      spoken: `Предполагаемая дата родов прошла ${n} ${daysWord(n)} назад`,
      level: 'warning',
    };
  }
  return {
    text: `До ПДР ${daysToDue} дн`,
    spoken: `До предполагаемой даты родов ${daysToDue} ${daysWord(daysToDue)}`,
    level: null,
  };
}

// Итог для озвучки диктором
export function spokenSummary(result) {
  if (!result) return '';
  const parts = [
    `Срок беременности ${spokenGestation(result.weeks, result.days)}, идёт ${result.currentWeek}-я неделя`,
    CATEGORIES[result.category].spoken,
    `Предполагаемая дата родов ${spokenRussianDate(result.due)}`,
  ];
  if (result.tooLong) parts.unshift('Внимание: срок больше 45 недель, проверьте дату');
  return parts.join('. ');
}
