// apgarScore.js — шкала Апгар: признаки, сумма, интерпретация, правило повторных оценок,
// секундомер от рождения. Чистые функции без React (тесты — apgar/__tests__/apgarScore.test.js).
//
// Источники:
//  [МЗ РФ 2010] Методическое письмо Минздравсоцразвития России от 21.04.2010 № 15-4/10/2-3204
//    «Первичная и реанимационная помощь новорождённым детям», с. 8: оценка через 1 и 5 минут после
//    рождения; «в случае продолжения реанимационных мероприятий более 5 минут жизни должна быть
//    проведена третья оценка по Апгар через 10 минут после рождения»; оценку по Апгар не используют
//    для решения о начале реанимации.
//  [МЗ РФ 2020] Методическое письмо Минздрава России «Реанимация и стабилизация состояния
//    новорождённых детей в родильном зале» (04.03.2020), раздел 1: то же правило — 1-я и 5-я минута,
//    при продолжении реанимационных мероприятий более 5 минут — третья оценка на 10-й минуте.
//    Правила «при < 7 на 5-й минуте — до 20-й» в этом письме нет.
//  [МКБ-10 P21] P21.0 тяжёлая асфиксия — 0–3 балла на 1-й минуте; P21.1 средняя и умеренная —
//    4–7 баллов на 1-й минуте.
//  [AAP/ACOG 2015] AAP Committee on Fetus and Newborn, ACOG Committee on Obstetric Practice.
//    The Apgar Score. Pediatrics 2015;136(4):819 (ACOG Committee Opinion № 644): критерии 0/1/2,
//    «When the 5-minute Apgar score is less than 7, additional scores should be assigned every
//    5 minutes for up to 20 minutes» (источник правила 10/15/20 при < 7); оценку не используют для начала реанимации; у недоношенных
//    тонус, рефлексы и окраска зависят от гестационного возраста; низкая оценка — не диагноз.

// Минуты оценки: обязательные — 1 и 5 [МЗ РФ 2010, 2020; AAP/ACOG 2015];
// дополнительные — 10 [МЗ РФ 2010, 2020: реанимация > 5 мин], 10, 15, 20 [AAP/ACOG 2015: < 7 на 5-й].
// На экране — объединение обоих правил как самый консервативный вариант.
export const BASE_MINUTES = [1, 5];
export const EXTRA_MINUTES = [10, 15, 20];
export const ALL_MINUTES = [...BASE_MINUTES, ...EXTRA_MINUTES];

// Порог повторных оценок: сумма на 5-й минуте < 7 [AAP/ACOG 2015]
export const REPEAT_THRESHOLD = 7;

// Пять признаков по 0–2 балла. Порядок — как в отечественных источниках.
// Формулировки критериев — по таблице AAP/ACOG 2015 и МЗ РФ 2020.
export const APGAR_SIGNS = [
  {
    key: 'heartRate',
    label: 'ЧСС',
    fullLabel: 'Частота сердечных сокращений',
    options: [
      { score: 0, label: 'Отсутствует' },
      { score: 1, label: 'Менее 100 в минуту' }, // < 100 уд/мин [AAP/ACOG 2015]
      { score: 2, label: '100 в минуту и более' }, // ≥ 100 уд/мин [AAP/ACOG 2015]
    ],
  },
  {
    key: 'respiration',
    label: 'Дыхание',
    fullLabel: 'Дыхание',
    options: [
      { score: 0, label: 'Отсутствует' },
      { score: 1, label: 'Слабое, нерегулярное' },
      { score: 2, label: 'Хорошее, громкий крик' },
    ],
  },
  {
    key: 'tone',
    label: 'Мышечный тонус',
    fullLabel: 'Мышечный тонус',
    options: [
      { score: 0, label: 'Вялый, атония' },
      { score: 1, label: 'Некоторое сгибание конечностей' },
      { score: 2, label: 'Активные движения' },
    ],
  },
  {
    key: 'reflex',
    label: 'Рефлекторная возбудимость',
    fullLabel: 'Рефлекторная возбудимость (реакция на катетер в носу или раздражение подошвы)',
    options: [
      { score: 0, label: 'Нет реакции' },
      { score: 1, label: 'Гримаса' },
      { score: 2, label: 'Крик, кашель или чихание' },
    ],
  },
  {
    key: 'color',
    label: 'Окраска кожи',
    fullLabel: 'Окраска кожи',
    options: [
      { score: 0, label: 'Общий цианоз или бледность' },
      { score: 1, label: 'Тело розовое, конечности синюшные' },
      { score: 2, label: 'Всё тело розовое' },
    ],
  },
];

export const SIGN_KEYS = APGAR_SIGNS.map((s) => s.key);

// Интерпретация суммы по отечественной классификации [МКБ-10 P21; МЗ РФ 2020].
// Классификация асфиксии по МКБ-10 опирается на оценку на 1-й минуте; для более поздних оценок
// те же диапазоны показывают тяжесть состояния и ответ на помощь.
export const APGAR_BANDS = [
  { key: 'satisfactory', min: 8, max: 10, label: 'Удовлетворительное состояние', level: 'success' },
  { key: 'moderate', min: 4, max: 7, label: 'Умеренная асфиксия', level: 'warning' }, // P21.1
  { key: 'severe', min: 0, max: 3, label: 'Тяжёлая асфиксия', level: 'danger' }, // P21.0
];

const isScore = (v) => v === 0 || v === 1 || v === 2;

// «0 баллов», «1 балл», «2 балла», «5 баллов»
export function pointsWord(n) {
  const abs = Math.abs(Math.trunc(n));
  const mod100 = abs % 100;
  const mod10 = abs % 10;
  if (mod100 >= 11 && mod100 <= 14) return 'баллов';
  if (mod10 === 1) return 'балл';
  if (mod10 >= 2 && mod10 <= 4) return 'балла';
  return 'баллов';
}

export const formatPoints = (n) => `${n} ${pointsWord(n)}`;

// «1-я минута» / «на 1-й минуте»
export const minuteLabel = (minute) => `${minute}-я минута`;
export const minuteLabelOn = (minute) => `на ${minute}-й минуте`;
export const minuteShort = (minute) => `${minute}-я мин`;

// Сумма баллов одной оценки: { total, filled, complete, missing: [ключи] }.
// total — сумма только отмеченных признаков (для подсказки «пока N»).
export function apgarTotal(assessment) {
  const a = assessment || {};
  let total = 0;
  const missing = [];
  for (const key of SIGN_KEYS) {
    if (isScore(a[key])) total += a[key];
    else missing.push(key);
  }
  const filled = SIGN_KEYS.length - missing.length;
  return { total, filled, complete: missing.length === 0, missing };
}

// Полная сумма или null, если отмечены не все пять признаков
export function completeTotal(assessment) {
  const t = apgarTotal(assessment);
  return t.complete ? t.total : null;
}

// Интерпретация суммы 0–10 → полоса APGAR_BANDS или null для недопустимого значения
export function interpretApgar(total) {
  if (!Number.isInteger(total) || total < 0 || total > 10) return null;
  return APGAR_BANDS.find((b) => total >= b.min && total <= b.max) || null;
}

// Есть ли в оценке хоть один отмеченный признак
export function hasAnyScore(assessment) {
  return apgarTotal(assessment).filled > 0;
}

// Нужны ли повторы каждые 5 минут до 20-й: полная сумма на 5-й минуте < 7 [AAP/ACOG 2015]
export function needsRepeat(assessments) {
  const five = completeTotal((assessments || {})[5]);
  return five !== null && five < REPEAT_THRESHOLD;
}

// Реанимационные мероприятия продолжаются после 5-й минуты: на оценке 5-й минуты отмечено
// «на фоне реанимационных мероприятий». Сумма не важна, оценка может быть ещё неполной
// [МЗ РФ 2010, с. 8; МЗ РФ 2020, раздел 1].
export function resuscitationAfterFive(assessments) {
  const five = (assessments || {})[5];
  return !!(five && five.duringResuscitation === true);
}

// Нужна ли оценка на 10-й минуте: реанимация > 5 мин [МЗ РФ 2010, 2020] или < 7 на 5-й [AAP/ACOG 2015]
export function needsTenMinute(assessments) {
  return needsRepeat(assessments) || resuscitationAfterFive(assessments);
}

// Обязательные минуты оценки: 1 и 5; при < 7 на 5-й — ещё 10, 15, 20 (до 20-й включительно,
// независимо от промежуточных результатов, без раннего прекращения) [AAP/ACOG 2015];
// при реанимации, продолжающейся после 5-й минуты, — как минимум 10-я [МЗ РФ 2010, 2020].
export function requiredMinutes(assessments) {
  if (needsRepeat(assessments)) return [...ALL_MINUTES];
  if (resuscitationAfterFive(assessments)) return [...BASE_MINUTES, 10];
  return [...BASE_MINUTES];
}

// Минуты, которые показывать: обязательные плюс те, где уже есть данные
export function visibleMinutes(assessments) {
  const req = requiredMinutes(assessments);
  const a = assessments || {};
  return ALL_MINUTES.filter((m) => req.includes(m) || hasAnyScore(a[m]));
}

// Пустая оценка одной минуты
export function emptyAssessment() {
  const a = { duringResuscitation: false };
  for (const key of SIGN_KEYS) a[key] = null;
  return a;
}

// Новая оценка с изменённым признаком (неизменяемо)
export function setSign(assessments, minute, key, value) {
  const prev = (assessments || {})[minute] || emptyAssessment();
  return { ...(assessments || {}), [minute]: { ...prev, [key]: value } };
}

// Строка одной оценки: «1-я мин — 6 баллов (умеренная асфиксия)»; null — если неполная
export function assessmentLine(minute, assessment) {
  const total = completeTotal(assessment);
  if (total === null) return null;
  const band = interpretApgar(total);
  const parts = [band ? band.label.toLowerCase() : null];
  if (assessment && assessment.duringResuscitation)
    parts.push('на фоне реанимационных мероприятий');
  const detail = parts.filter(Boolean).join(', ');
  return `${minuteShort(minute)} — ${formatPoints(total)}${detail ? ` (${detail})` : ''}`;
}

// Разбивка по признакам: «ЧСС 2, дыхание 1, тонус 1, рефлексы 1, окраска 1»
const SHORT_SIGN = {
  heartRate: 'ЧСС',
  respiration: 'дыхание',
  tone: 'тонус',
  reflex: 'рефлексы',
  color: 'окраска',
};

export function breakdownLine(assessment) {
  const a = assessment || {};
  return SIGN_KEYS.map((k) => `${SHORT_SIGN[k]} ${isScore(a[k]) ? a[k] : '—'}`).join(', ');
}

// Короткая запись «6/8» или «3/5/6/7/8» по полным оценкам в порядке минут
export function shortRecord(assessments) {
  const a = assessments || {};
  const totals = ALL_MINUTES.map((m) => completeTotal(a[m])).filter((t) => t !== null);
  return totals.length ? totals.join('/') : '';
}

// ---------- Секундомер от рождения ----------

// Прошедшее время в мс (не меньше 0); null — секундомер не запущен
export function elapsedMs(birthAt, now) {
  if (!Number.isFinite(birthAt) || !Number.isFinite(now)) return null;
  return Math.max(0, now - birthAt);
}

const pad2 = (n) => String(n).padStart(2, '0');

// «03:25», «75:02» (минуты не ограничиваются часом — считаем минуты жизни)
export function formatElapsed(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  return `${pad2(Math.floor(totalSec / 60))}:${pad2(totalSec % 60)}`;
}

// Для диктора: «3 минуты 25 секунд»
function plural(n, one, few, many) {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export function spokenElapsed(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '0 секунд';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const parts = [];
  if (m > 0) parts.push(`${m} ${plural(m, 'минута', 'минуты', 'минут')}`);
  if (s > 0 || m === 0) parts.push(`${s} ${plural(s, 'секунда', 'секунды', 'секунд')}`);
  return parts.join(' ');
}

// Время суток рождения «14:05» (локальное)
export function formatClock(timestamp) {
  if (!Number.isFinite(timestamp)) return '';
  const d = new Date(timestamp);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

// Ближайшая ещё не наступившая отметка из списка минут: { minute, remainingMs } или null
export function nextMark(ms, minutes = ALL_MINUTES) {
  if (!Number.isFinite(ms)) return null;
  const sorted = [...minutes].sort((a, b) => a - b);
  for (const m of sorted) {
    const at = m * 60000;
    if (at > ms) return { minute: m, remainingMs: at - ms };
  }
  return null;
}

// Отметки, пройденные между двумя моментами (prevMs, ms] — для однократного оповещения
export function crossedMarks(prevMs, ms, minutes = ALL_MINUTES) {
  if (!Number.isFinite(ms)) return [];
  const from = Number.isFinite(prevMs) ? prevMs : -1;
  return [...minutes].sort((a, b) => a - b).filter((m) => m * 60000 > from && m * 60000 <= ms);
}

// Состояние отметки для подписи: 'done' (оценено), 'due' (время пришло, не оценено),
// 'upcoming' (ещё не наступила)
export function markState(minute, ms, assessment) {
  if (completeTotal(assessment) !== null) return 'done';
  if (Number.isFinite(ms) && ms >= minute * 60000) return 'due';
  return 'upcoming';
}

// Текст для копирования в документацию
export function summaryText(assessments, birthAt) {
  const a = assessments || {};
  const lines = ['Оценка по шкале Апгар'];
  if (Number.isFinite(birthAt)) lines.push(`Время рождения: ${formatClock(birthAt)}`);
  const minutes = visibleMinutes(a);
  for (const m of minutes) {
    const line = assessmentLine(m, a[m]);
    if (line) lines.push(`${line}: ${breakdownLine(a[m])}`);
    else if (hasAnyScore(a[m])) lines.push(`${minuteShort(m)} — оценка не завершена`);
  }
  const record = shortRecord(a);
  if (record) lines.push(`Итог: ${record} баллов`);
  if (needsRepeat(a))
    lines.push('На 5-й минуте < 7 баллов: повторные оценки на 10-й, 15-й, 20-й минуте');
  else if (resuscitationAfterFive(a))
    lines.push('Реанимационные мероприятия продолжаются после 5-й минуты: оценка на 10-й минуте');
  return lines.join('\n');
}
