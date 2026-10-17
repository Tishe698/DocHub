// gcsScore.js — шкала комы Глазго: варианты ответов, подсчёт и интерпретация (чистые функции).
// Экран glazgo/glazgo.js только вызывает эти функции; тесты — glazgo/__tests__/gcsScore.test.js.
//
// Источники:
// - КР МЗ РФ «Черепно-мозговая травма у детей», 2025 (ID 493_3): прил. Г1 (ШКГ),
//   прил. Г2 (педиатрическая ШКГ, дети младше 4 лет), ключ интерпретации суммы,
//   тяжесть ЧМТ 13–15 / 9–12 / 3–8.
// - Teasdale G. et al., Lancet Neurol 2014: компоненты записываются отдельно (E·V·M),
//   при неоцениваемом компоненте (NT) сумма не указывается.
// - Modified GCS for Infants and Children (MSD Manual; James 1986) — формулировки
//   двигательного ответа для доречевых детей.
// - Brennan P.M. et al., J Neurosurg 2018;128:1612 — ШКГ-З (GCS-Pupils).
//
// Клинические значения перенесены без изменений из ветки fix/clinical-audit.
import { formatAge } from '../patient/estimates';

// Педиатрическая ШКГ — у детей младше 4 лет (КР «ЧМТ у детей», 2025, прил. Г2).
export const CHILD_SCALE_MAX_MONTHS = 48;

// Режим шкалы. Взрослая ШКГ — у взрослых и детей от 4 лет; педиатрическая — младше 4 лет.
export const MODES = [
  { value: 'adult', label: 'Взрослые и дети ≥ 4 лет', accessibilityLabel: 'Взрослые и дети от 4 лет' },
  { value: 'child', label: 'Дети < 4 лет', accessibilityLabel: 'Дети младше 4 лет' },
];

// Варианты «не оценивается» (NT): компонент нельзя оценить из-за местной причины.
// Обозначения C (глаза закрыты) и T (интубация) — Teasdale 2014; сумма при NT не считается.
const E_NT = { id: 'EC', nt: true, code: 'EC', label: 'Не оценить: глаза закрыты (отёк, повязка) — C' };
const V_NT_TUBE = { id: 'VT', nt: true, code: 'VT', label: 'Не оценить: интубация, трахеостома — T' };
const V_NT_OTHER = { id: 'VNT', nt: true, code: 'V-НО', label: 'Не оценить: афазия, глухота, языковой барьер' };
const M_NT = { id: 'MNT', nt: true, code: 'M-НО', label: 'Не оценить: миорелаксанты, травма спинного мозга' };

// Открывание глаз — одинаково для обеих шкал (КР «ЧМТ у детей», 2025, прил. Г1/Г2).
export const E_OPTIONS = [
  { id: 'E4', score: 4, label: 'Произвольное' },
  // В КР и в версии 2014 — «на звук» (обращение), не «на речевую команду».
  { id: 'E3', score: 3, label: 'На звук (обращение, голос)' },
  { id: 'E2', score: 2, label: 'На болевое раздражение' },
  { id: 'E1', score: 1, label: 'Отсутствует' },
  E_NT,
];

// Речевой ответ, взрослая ШКГ — КР «ЧМТ у детей», 2025, прил. Г1.
export const V_OPTIONS_ADULT = [
  { id: 'V5', score: 5, label: 'Ориентирован, осмысленный ответ' },
  { id: 'V4', score: 4, label: 'Речевая спутанность' },
  { id: 'V3', score: 3, label: 'Отдельные слова/спонтанно' },
  { id: 'V2', score: 2, label: 'Нечленораздельные звуки' },
  { id: 'V1', score: 1, label: 'Отсутствует' },
  V_NT_TUBE,
  V_NT_OTHER,
];

// Речевой ответ у детей младше 4 лет — КР «ЧМТ у детей», 2025, прил. Г2.
export const V_OPTIONS_CHILD = [
  { id: 'V5', score: 5, label: 'Улыбается, реагирует на звук, следит за предметами, контактен' },
  { id: 'V4', score: 4, label: 'Плачет, но успокаивается; контакт неполный' },
  { id: 'V3', score: 3, label: 'Успокаивается ненадолго, стонет' },
  { id: 'V2', score: 2, label: 'Не успокаивается, беспокоен' },
  { id: 'V1', score: 1, label: 'Отсутствует' },
  V_NT_TUBE,
];

// Двигательный ответ, взрослая ШКГ — КР «ЧМТ у детей», 2025, прил. Г1.
export const M_OPTIONS_ADULT = [
  { id: 'M6', score: 6, label: 'Выполняет команды' },
  { id: 'M5', score: 5, label: 'Локализует боль' },
  { id: 'M4', score: 4, label: 'Отдёргивание на боль' },
  { id: 'M3', score: 3, label: 'Патол. сгибание (декортикация)' },
  { id: 'M2', score: 2, label: 'Патол. разгибание (децеребрация)' },
  { id: 'M1', score: 1, label: 'Нет ответа' },
  M_NT,
];

// Двигательный ответ у детей младше 4 лет: КР «ЧМТ у детей», 2025, прил. Г2
// (6 — выполнение инструкций, 5 — локализация боли); для доречевых детей эквиваленты
// 6 и 5 — по Modified GCS for Infants (MSD Manual; James 1986).
export const M_OPTIONS_CHILD = [
  { id: 'M6', score: 6, label: 'Выполняет инструкции; младенец — спонтанные целенаправленные движения' },
  { id: 'M5', score: 5, label: 'Локализует боль; младенец — отдёргивает при прикосновении' },
  { id: 'M4', score: 4, label: 'Отдёргивание на боль' },
  { id: 'M3', score: 3, label: 'Патол. сгибание (декортикация)' },
  { id: 'M2', score: 2, label: 'Патол. разгибание (децеребрация)' },
  { id: 'M1', score: 1, label: 'Нет ответа' },
  M_NT,
];

// Реакция зрачков на свет для ШКГ-З (Brennan 2018): баллы вычитаются из ШКГ.
// «Не оценивались» — значение по умолчанию: ШКГ-З не считается.
export const PUPILS_NONE = 'none';
export const P_OPTIONS = [
  { id: PUPILS_NONE, score: null, label: 'Не оценивались' },
  { id: 'P0', score: 0, label: 'Оба зрачка реагируют' },
  { id: 'P1', score: 1, label: 'Один зрачок не реагирует' },
  { id: 'P2', score: 2, label: 'Оба зрачка не реагируют' },
];

export const COMPONENT_TITLES = {
  E: 'Открывание глаз (E)',
  V: 'Речевая реакция (V)',
  M: 'Двигательная реакция (M)',
};

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

// «балл / балла / баллов»
export function pointsWord(n) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return 'баллов';
  if (b === 1) return 'балл';
  if (b >= 2 && b <= 4) return 'балла';
  return 'баллов';
}

// Режим по возрасту пациента (полных месяцев): < 48 мес — детская шкала; нет возраста — null.
export function modeForAge(ageMonths) {
  if (!isNum(ageMonths) || ageMonths < 0) return null;
  return ageMonths < CHILD_SCALE_MAX_MONTHS ? 'child' : 'adult';
}

// Варианты ответов для режима. ШКГ-З выведена на взрослых с ЧМТ — у детей < 4 лет её нет.
export function optionsFor(mode) {
  const child = mode === 'child';
  return {
    E: E_OPTIONS,
    V: child ? V_OPTIONS_CHILD : V_OPTIONS_ADULT,
    M: child ? M_OPTIONS_CHILD : M_OPTIONS_ADULT,
    P: child ? [] : P_OPTIONS,
  };
}

const findOpt = (list, id) => (id ? list.find((o) => o.id === id) || null : null);

// Уровень сознания по сумме — КР «ЧМТ у детей», 2025, прил. Г1/Г2 (ключ один для обеих шкал).
// Соответствие условное: в других российских источниках границы сдвинуты на 1 балл.
export function consciousnessLevel(sum) {
  if (sum === 15) return 'Ясное сознание (15)';
  if (sum >= 13) return 'Умеренное оглушение (13–14)';
  if (sum >= 11) return 'Глубокое оглушение (11–12)';
  if (sum >= 9) return 'Сопор (9–10)';
  if (sum >= 7) return 'Умеренная кома (7–8)';
  if (sum >= 4) return 'Глубокая кома (4–6)';
  return 'Терминальная кома (3)';
}

// Тяжесть ЧМТ по сумме — КР «ЧМТ у детей», 2025: 13–15 лёгкая, 9–12 среднетяжёлая, 3–8 тяжёлая.
export function tbiSeverity(sum) {
  if (sum >= 13) return 'Тяжесть при ЧМТ: лёгкая (13–15)';
  if (sum >= 9) return 'Тяжесть при ЧМТ: среднетяжёлая (9–12)';
  return 'Тяжесть при ЧМТ: тяжёлая (3–8)';
}

// Уровень бейджа (цвет дублируется текстом уровня): 15 — норма, 13–14 — инфо,
// 9–12 — внимание, ≤ 8 — опасно (совпадает с тяжестью ЧМТ).
export function severityLevel(sum) {
  if (sum === 15) return 'success';
  if (sum >= 13) return 'info';
  if (sum >= 9) return 'warning';
  return 'danger';
}

// Подсчёт. sel — id выбранных вариантов { eye, verbal, motor, pupils } (null — не выбрано).
// Id, которого нет в вариантах текущего режима, считается невыбранным.
// Сумма считается только когда оценены все три компонента и ни один не отмечен как
// «не оценивается» (Teasdale 2014).
export function computeGcs({ mode = 'adult', eye = null, verbal = null, motor = null, pupils = null } = {}) {
  const opts = optionsFor(mode);
  const parts = [
    { key: 'E', opt: findOpt(opts.E, eye) },
    { key: 'V', opt: findOpt(opts.V, verbal) },
    { key: 'M', opt: findOpt(opts.M, motor) },
  ];
  const notation = parts
    .map(({ key, opt }) => (!opt ? `${key}–` : opt.nt ? opt.code : `${key}${opt.score}`))
    .join(' ');
  const missing = parts.filter(({ opt }) => !opt).map(({ key }) => key);
  const complete = missing.length === 0;
  const ntParts = parts.filter(({ opt }) => opt && opt.nt).map(({ key }) => key);
  const hasNT = ntParts.length > 0;
  const scorable = complete && !hasNT;
  const sum = scorable ? parts.reduce((acc, { opt }) => acc + opt.score, 0) : null;
  const motorOpt = parts[2].opt;

  // ШКГ-З = ШКГ − баллы зрачков, диапазон 1–15 (Brennan 2018). Только при полной сумме.
  const pupilsOpt = findOpt(opts.P, pupils);
  const gcsPupils = sum === null || !pupilsOpt || !isNum(pupilsOpt.score) ? null : sum - pupilsOpt.score;

  let hint = null;
  if (!complete) hint = `Оценка неполная: выберите ${missing.join(', ')}`;
  else if (hasNT) hint = 'Сумма не определяется: компонент не оценивается. Запишите компоненты';

  return {
    mode,
    complete,
    hasNT,
    ntParts,
    scorable,
    sum,
    notation,
    missing,
    hint,
    level: scorable ? consciousnessLevel(sum) : null,
    severity: scorable ? tbiSeverity(sum) : null,
    severityLevel: scorable ? severityLevel(sum) : null,
    // ≤ 8 баллов — оценить необходимость защиты дыхательных путей
    airwayAlert: scorable && sum <= 8,
    // Пациент с M6 выполняет команды и по определению не в сопоре и не в коме
    // (glasgowcomascale.org: «8 может быть и E2V2M4, и E1V1M6»). Глубокое оглушение (11–12)
    // выполнение простых команд допускает, поэтому предупреждаем только при сумме ≤ 10
    // (E + V ≤ 4) — повод проверить, не мешает ли оценке местная причина.
    commandsWarning: !!motorOpt && motorOpt.id === 'M6' && sum !== null && sum <= 10,
    gcsPupils,
  };
}

// Расхождение выбранной шкалы с возрастом пациента (null — нет возраста или совпадает).
export function ageModeMismatch(mode, ageMonths) {
  const expected = modeForAge(ageMonths);
  if (!expected || expected === mode) return null;
  const age = formatAge(ageMonths);
  if (mode === 'child') {
    return `Возраст пациента — ${age}. Педиатрическая ШКГ применяется у детей младше 4 лет; с 4 лет — взрослая шкала.`;
  }
  return `Возраст пациента — ${age}. У детей младше 4 лет взрослая ШКГ занижает оценку: выберите шкалу «Дети < 4 лет».`;
}

// Строка итога для диктора и копирования. Пустая строка — нечего озвучивать.
export function gcsSummary(result) {
  if (!result || !result.complete) return '';
  if (!result.scorable) return `ШКГ: сумма не определяется, ${result.notation}`;
  const parts = [
    `ШКГ ${result.sum} ${pointsWord(result.sum)}, ${result.notation}`,
    result.level,
    result.severity,
  ];
  if (result.gcsPupils !== null) parts.push(`ШКГ-З ${result.gcsPupils}`);
  return parts.join('. ');
}
