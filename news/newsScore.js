// newsScore.js — шкала NEWS2 (National Early Warning Score 2). Чистые функции, без React.
//
// Источник всех порогов, уровней риска, частоты наблюдения и реакции:
//   Royal College of Physicians. National Early Warning Score (NEWS) 2: Standardising the
//   assessment of acute-illness severity in the NHS. Updated report of a working party.
//   London: RCP, 2017 (Chart 1 — таблица баллов, Chart 3/4 — пороги и реакция).
// Русские формулировки — по таблице NEWS в методических рекомендациях МЗ РФ
//   («Организация оказания медицинской помощи беременным, роженицам, родильницам и
//   новорождённым при новой коронавирусной инфекции COVID-19», версия 5, 28.12.2021, разд. 3.2):
//   «Порог срочной реакции», «Порог экстренной реакции», «Изменение уровня сознания» и т. п.
//
// Ввод: числа (или null/undefined, если параметр не введён).
//   ЧДД, SpO₂, САД, ЧСС округляются до целого, температура — до 0,1 °C: таблица RCP задана
//   целыми значениями (температура — с шагом 0,1), так дробный ввод не попадает «между» строками.

// Целевые диапазоны проверки ввода — только защита от опечаток (не клинические пороги).
export const LIMITS = {
  respRate: { min: 0, max: 100, unit: 'в мин' },
  spo2: { min: 0, max: 100, unit: '%' },
  sbp: { min: 0, max: 300, unit: 'мм рт. ст.' },
  heartRate: { min: 0, max: 300, unit: 'уд/мин' },
  temperature: { min: 25, max: 45, unit: '°C' },
};

// Сознание по ACVPU (RCP 2017: A — 0 баллов; новая спутанность C, V, P, U — 3 балла)
export const ACVPU_OPTIONS = [
  { value: 'A', label: 'A — ясное', description: 'В сознании, ориентирован' },
  {
    value: 'C',
    label: 'C — спутанность',
    description: 'Впервые возникшие спутанность, дезориентация или возбуждение',
  },
  { value: 'V', label: 'V — на голос', description: 'Реагирует только на обращение' },
  { value: 'P', label: 'P — на боль', description: 'Реагирует только на боль' },
  { value: 'U', label: 'U — нет реакции', description: 'Не реагирует ни на голос, ни на боль' },
];

const ACVPU_VALUES = ACVPU_OPTIONS.map((o) => o.value);

export const PARAM_LABELS = {
  respRate: 'Частота дыхания',
  spo2: 'SpO₂',
  oxygen: 'Кислород или воздух',
  sbp: 'Систолическое АД',
  heartRate: 'ЧСС',
  consciousness: 'Сознание (ACVPU)',
  temperature: 'Температура',
};

export const PARAM_ORDER = [
  'respRate',
  'spo2',
  'oxygen',
  'sbp',
  'heartRate',
  'consciousness',
  'temperature',
];

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const roundInt = (v) => Math.round(v);
// Округление до 0,1 без ошибок двоичной арифметики (36,05 × 10 = 360,49999…)
const round01 = (v) => Math.round(Number((v * 10).toFixed(6))) / 10;

// --- Баллы по параметрам (RCP 2017, Chart 1) -----------------------------------------

// ЧДД, в мин: ≤8 → 3; 9–11 → 1; 12–20 → 0; 21–24 → 2; ≥25 → 3
export function scoreRespRate(rr) {
  if (!isNum(rr)) return null;
  const v = roundInt(rr);
  if (v <= 8) return 3;
  if (v <= 11) return 1;
  if (v <= 20) return 0;
  if (v <= 24) return 2;
  return 3;
}

// SpO₂ шкала 1, %: ≤91 → 3; 92–93 → 2; 94–95 → 1; ≥96 → 0 (кислород на балл SpO₂ не влияет)
export function scoreSpo2Scale1(spo2) {
  if (!isNum(spo2)) return null;
  const v = roundInt(spo2);
  if (v <= 91) return 3;
  if (v <= 93) return 2;
  if (v <= 95) return 1;
  return 0;
}

// SpO₂ шкала 2 (гиперкапническая ДН, целевая SpO₂ 88–92 %), %:
//   ≤83 → 3; 84–85 → 2; 86–87 → 1; 88–92 → 0; ≥93 на воздухе → 0;
//   на кислороде: 93–94 → 1; 95–96 → 2; ≥97 → 3.
// onOxygen: true | false | null. При SpO₂ ≥ 93 и неизвестном кислороде балл не определён (null).
export function scoreSpo2Scale2(spo2, onOxygen) {
  if (!isNum(spo2)) return null;
  const v = roundInt(spo2);
  if (v <= 83) return 3;
  if (v <= 85) return 2;
  if (v <= 87) return 1;
  if (v <= 92) return 0;
  if (onOxygen === false) return 0;
  if (onOxygen !== true) return null;
  if (v <= 94) return 1;
  if (v <= 96) return 2;
  return 3;
}

export function scoreSpo2(spo2, scale, onOxygen) {
  return scale === 2 ? scoreSpo2Scale2(spo2, onOxygen) : scoreSpo2Scale1(spo2);
}

// Кислород: дыхание воздухом → 0; любая подача кислорода → 2
export function scoreOxygen(onOxygen) {
  if (onOxygen === true) return 2;
  if (onOxygen === false) return 0;
  return null;
}

// САД, мм рт. ст.: ≤90 → 3; 91–100 → 2; 101–110 → 1; 111–219 → 0; ≥220 → 3
export function scoreSbp(sbp) {
  if (!isNum(sbp)) return null;
  const v = roundInt(sbp);
  if (v <= 90) return 3;
  if (v <= 100) return 2;
  if (v <= 110) return 1;
  if (v <= 219) return 0;
  return 3;
}

// ЧСС (пульс), уд/мин: ≤40 → 3; 41–50 → 1; 51–90 → 0; 91–110 → 1; 111–130 → 2; ≥131 → 3
export function scoreHeartRate(hr) {
  if (!isNum(hr)) return null;
  const v = roundInt(hr);
  if (v <= 40) return 3;
  if (v <= 50) return 1;
  if (v <= 90) return 0;
  if (v <= 110) return 1;
  if (v <= 130) return 2;
  return 3;
}

// Сознание ACVPU: A → 0; C (новая спутанность), V, P, U → 3
export function scoreConsciousness(level) {
  if (!ACVPU_VALUES.includes(level)) return null;
  return level === 'A' ? 0 : 3;
}

// Температура, °C: ≤35,0 → 3; 35,1–36,0 → 1; 36,1–38,0 → 0; 38,1–39,0 → 1; ≥39,1 → 2
export function scoreTemperature(t) {
  if (!isNum(t)) return null;
  const v = round01(t);
  if (v <= 35.0) return 3;
  if (v <= 36.0) return 1;
  if (v <= 38.0) return 0;
  if (v <= 39.0) return 1;
  return 2;
}

// --- Проверка ввода ------------------------------------------------------------------

const fmt = (n) => String(n).replace('.', ',');

// Ошибка ввода для числового параметра или null
export function validateParam(key, value) {
  if (value === null || value === undefined || value === '') return null;
  if (!isNum(value)) return 'Введите число';
  const lim = LIMITS[key];
  if (!lim) return null;
  if (value < lim.min || value > lim.max) {
    return `Проверьте значение: допустимо ${fmt(lim.min)}–${fmt(lim.max)} ${lim.unit}`;
  }
  return null;
}

// --- Уровни риска и реакция (RCP 2017, Chart 3/4; формулировки МР МЗ РФ) --------------

export const RISK = {
  none: {
    key: 'none',
    label: 'Низкий риск',
    level: 'success',
    monitoring: 'Не реже 1 раза в 12 ч',
    response: 'Продолжить рутинную оценку по шкале NEWS2.',
  },
  low: {
    key: 'low',
    label: 'Низкий риск',
    level: 'info',
    monitoring: 'Не реже 1 раза в 4–6 ч',
    response:
      'Информировать медицинскую сестру, наблюдающую пациента: она оценивает состояние и решает, нужно ли учащать наблюдение или усиливать лечение.',
  },
  lowMedium: {
    key: 'lowMedium',
    label: 'Низко-средний риск (3 балла по одному параметру)',
    level: 'warning',
    monitoring: 'Не реже 1 раза в час',
    response:
      'Срочная оценка у постели: медсестра уведомляет врача, который оценит пациента и решит, нужно ли усиление лечения.',
  },
  medium: {
    key: 'medium',
    label: 'Средний риск — порог срочной реакции',
    level: 'warning',
    monitoring: 'Не реже 1 раза в час',
    response:
      'Немедленно уведомить лечащего врача. Срочная оценка врачом, владеющим помощью при острых состояниях; лечение в условиях, где возможен мониторинг.',
  },
  high: {
    key: 'high',
    label: 'Высокий риск — порог экстренной реакции',
    level: 'danger',
    monitoring: 'Постоянный мониторинг жизненно важных функций',
    response:
      'Экстренная оценка командой, компетентной в интенсивной терапии (включая обеспечение проходимости дыхательных путей); рассмотреть перевод в ОРИТ.',
  },
};

// Риск по сумме и флагу «любой параметр = 3»: ≥7 высокий; 5–6 средний;
// 0–4 с параметром 3 — низко-средний; 1–4 низкий; 0 — низкий (рутинное наблюдение).
export function riskFor(total, anyThree) {
  if (!isNum(total)) return null;
  if (total >= 7) return RISK.high;
  if (total >= 5) return RISK.medium;
  if (anyThree) return RISK.lowMedium;
  if (total >= 1) return RISK.low;
  return RISK.none;
}

// Склонение: 1 балл, 2 балла, 5 баллов, 11 баллов, 21 балл
export function pointsWord(n) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a >= 11 && a <= 14) return 'баллов';
  if (b === 1) return 'балл';
  if (b >= 2 && b <= 4) return 'балла';
  return 'баллов';
}

// --- Итог ------------------------------------------------------------------------------

// input: { respRate, spo2, spo2Scale (1|2, по умолчанию 1), onOxygen (true|false|null),
//          sbp, heartRate, consciousness ('A'|'C'|'V'|'P'|'U'|null), temperature }
// Возвращает:
//   params — [{ key, label, points (null — не введено/не определено), error }] в порядке шкалы;
//   errors — { key: текст }; complete — все 7 параметров оценены и без ошибок;
//   total — сумма введённых баллов (при неполном вводе — нижняя граница итога);
//   anyThree, threeParams — параметры с 3 баллами;
//   risk — уровень по полной сумме (null, если ввод неполный);
//   minRisk — уровень, ниже которого итог уже не опустится (по введённым параметрам);
//   pendingReason — подсказка, если SpO₂ по шкале 2 нельзя оценить без отметки о кислороде.
export function computeNews2(input = {}) {
  const scale = input.spo2Scale === 2 ? 2 : 1;
  const onOxygen = input.onOxygen === true ? true : input.onOxygen === false ? false : null;

  const errors = {};
  ['respRate', 'spo2', 'sbp', 'heartRate', 'temperature'].forEach((k) => {
    const e = validateParam(k, input[k]);
    if (e) errors[k] = e;
  });
  const val = (k) => (errors[k] ? null : input[k]);

  const points = {
    respRate: scoreRespRate(val('respRate')),
    spo2: scoreSpo2(val('spo2'), scale, onOxygen),
    oxygen: scoreOxygen(onOxygen),
    sbp: scoreSbp(val('sbp')),
    heartRate: scoreHeartRate(val('heartRate')),
    consciousness: scoreConsciousness(input.consciousness),
    temperature: scoreTemperature(val('temperature')),
  };

  const params = PARAM_ORDER.map((key) => ({
    key,
    label: PARAM_LABELS[key],
    points: points[key],
    error: errors[key] || null,
  }));

  const scored = params.filter((p) => p.points !== null);
  const total = scored.reduce((s, p) => s + p.points, 0);
  const threeParams = scored.filter((p) => p.points === 3).map((p) => p.key);
  const anyThree = threeParams.length > 0;
  const complete = scored.length === PARAM_ORDER.length && Object.keys(errors).length === 0;

  const pendingReason =
    scale === 2 && isNum(val('spo2')) && points.spo2 === null
      ? 'Для шкалы 2 при SpO₂ ≥ 93 % укажите, дышит ли пациент кислородом'
      : null;

  return {
    params,
    points,
    errors,
    scale,
    complete,
    scoredCount: scored.length,
    missing: params.filter((p) => p.points === null).map((p) => p.key),
    total,
    anyThree,
    threeParams,
    risk: complete ? riskFor(total, anyThree) : null,
    minRisk: scored.length > 0 ? riskFor(total, anyThree) : null,
    pendingReason,
  };
}

// --- Применимость -----------------------------------------------------------------------

// RCP 2017: NEWS2 не валидирована у детей (< 16 лет) и беременных.
export const MIN_AGE_YEARS = 16;

// ageMonths — полный возраст в месяцах из контекста пациента (или null).
// Возвращает null, если возраст не известен или ≥ 16 лет; иначе текст предупреждения.
export function ageWarning(ageMonths) {
  if (!isNum(ageMonths)) return null;
  if (ageMonths >= MIN_AGE_YEARS * 12) return null;
  return 'Пациенту меньше 16 лет: NEWS2 у детей не применяется — используйте педиатрическую шкалу раннего предупреждения (PEWS) и возрастные нормы.';
}

// Текст для озвучивания и копирования итога
export function summaryText(result) {
  if (!result || !result.complete || !result.risk) return '';
  const { total, risk, threeParams } = result;
  const parts = [`NEWS2: ${total} ${pointsWord(total)}, ${risk.label}.`];
  if (threeParams.length) {
    parts.push(`3 балла: ${threeParams.map((k) => PARAM_LABELS[k]).join(', ')}.`);
  }
  parts.push(`Наблюдение: ${risk.monitoring.toLowerCase()}.`);
  return parts.join(' ');
}
