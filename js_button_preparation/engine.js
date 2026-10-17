// engine.js — движок калькулятора препаратов: чистые функции без React.
// Валидация и разбор ввода, поля-выборы (routes.js), возраст «лет + мес» из общего пациента,
// форматирование доз, сборка строк результата, полный расчёт записи, текст для копирования,
// поиск по названиям и синонимам. Экран (calculate_button.js) только вызывает эти функции.
import parseNum from '../utils/parseNum';
import { isChoiceInput, inputLabel, choiceLabel } from './routes';
import { composeAgeMonths, formatAge } from '../patient/estimates';

// Число в тексте подсказок — с запятой: 0.3 → «0,3»
export const ru = (n) => String(n).replace('.', ',');

/** ------------------------------ Поля ввода ------------------------------ **/

// Поля записей, связанные с общим пациентом (docs/ARCHITECTURE.md §5)
export const AGE_KEYS = ['ageYears', 'ageMonths'];
export const isAgeKey = (key) => AGE_KEYS.includes(key);
export const PATIENT_NUMBER_FIELDS = { weight: 'weightKg', heightCm: 'heightCm' };

// Пол: если запись объявила sex строкой-подписью, варианты — эти (значения как в PatientContext)
export const SEX_CHOICES = Object.freeze([
  Object.freeze({ value: 'male', label: 'Мужской' }),
  Object.freeze({ value: 'female', label: 'Женский' }),
]);

// Поле записи как поле-выбор: объект из routes.js или sex со стандартными вариантами
export const asChoiceInput = (key, input) => {
  if (isChoiceInput(input)) return input;
  if (key === 'sex')
    return { label: inputLabel(input) || 'Пол', choices: SEX_CHOICES, default: undefined };
  return null;
};

// Тип поля: 'choice' (кнопки выбора), 'text' (свободный текст — старые записи с путём введения
// строкой), 'numeric' (остальные)
export const getInputType = (key, input) => {
  if (asChoiceInput(key, input)) return 'choice';
  const lowerName = String(key || '').toLowerCase();
  const lowerLabel = String(inputLabel(input) || '').toLowerCase();
  if (
    lowerName.includes('route') ||
    lowerName.includes('маршрут') ||
    lowerName.includes('путь') ||
    lowerLabel.includes('route') ||
    lowerLabel.includes('маршрут') ||
    lowerLabel.includes('путь') ||
    lowerLabel.includes('введение') ||
    lowerLabel.includes('метод')
  ) {
    return 'text';
  }
  return 'numeric';
};

// Единица поля — из последних скобок подписи: «Вес (кг)» → «кг», «Возраст (мес)» → «мес»,
// «Скорость (мкг/кг/мин)» → «мкг/кг/мин». Подстроки («рост» в «скорость») не ищем.
export const unitFromLabel = (label) => {
  const all = String(label || '').match(/\(([^()]+)\)/g);
  if (!all || !all.length) return null;
  return all[all.length - 1].slice(1, -1).trim() || null;
};

// Подпись поля без единицы: «Вес (кг)» → «Вес»
export const labelBase = (label) =>
  String(label || '')
    .replace(/\s*\([^()]*\)\s*$/, '')
    .trim();

// Пределы правдоподобия ввода — защита от опечаток, а не клинические границы.
// Вес 0,3–250 кг: от глубоко недоношенного новорождённого до морбидного ожирения;
// возраст 0–120 лет (0 — новорождённый, допустим). Скорость, масса препарата и объём — заведомо
// недостижимые на практике значения. Рост 20–250 см — та же защита от опечаток (длина тела
// глубоко недоношенного новорождённого от ~25 см). Запись может сузить пределы полем
// inputLimits: { key: { min, max, warnMin, warnMax } }.
export const FIELD_RULES = {
  weight: { min: 0.3, max: 250 },
  ageYears: { min: 0, max: 120, allowZero: true },
  ageMonths: { min: 0, max: 1440, allowZero: true },
  heightCm: { min: 20, max: 250 },
  rate: { max: 50 },
  drugMg: { max: 2000 },
  volume: { max: 5000 },
};
// Те же правила по единице из скобок — для новых полей с другими ключами
const UNIT_RULES = {
  кг: FIELD_RULES.weight,
  лет: FIELD_RULES.ageYears,
  мес: FIELD_RULES.ageMonths,
  'мкг/кг/мин': FIELD_RULES.rate,
  мл: FIELD_RULES.volume,
};

export const getFieldRule = (key, label, formula) => {
  const unit = unitFromLabel(label);
  const base = FIELD_RULES[key] || UNIT_RULES[unit] || {};
  const own = (formula && formula.inputLimits && formula.inputLimits[key]) || {};
  return { ...base, ...own, unit };
};

const isBlank = (raw) => raw === undefined || raw === null || String(raw).trim() === '';

// Значение поля-выбора: пусто → значение по умолчанию; иначе одно из value вариантов
export const choiceValue = (choice, raw) => (isBlank(raw) ? choice.default : String(raw));

// Проверка одного числа по правилу: { value } | { error }, плюс мягкое { warning }
const checkNumber = (label, raw, rule) => {
  const n = parseNum(raw);
  const u = rule.unit ? ` ${rule.unit}` : '';
  if (n === undefined) return { error: `${label}: введите число` };
  if (n < 0) return { error: `${label}: не может быть отрицательным` };
  if (n === 0 && !rule.allowZero) return { error: `${label}: должно быть больше 0` };
  const rangeText =
    Number.isFinite(rule.min) && Number.isFinite(rule.max)
      ? `допустимо ${ru(rule.min)}–${ru(rule.max)}${u}`
      : Number.isFinite(rule.max)
        ? `допустимо не более ${ru(rule.max)}${u}`
        : `допустимо не менее ${ru(rule.min)}${u}`;
  if (Number.isFinite(rule.min) && n < rule.min)
    return { error: `${label}: ${rangeText} — проверьте ввод` };
  if (Number.isFinite(rule.max) && n > rule.max)
    return { error: `${label}: ${rangeText} — проверьте ввод` };
  let warning;
  if (Number.isFinite(rule.warnMax) && n > rule.warnMax)
    warning = `${labelBase(label)} ${ru(n)}${u} — выше обычного предела ${ru(rule.warnMax)}${u}. Проверьте ввод.`;
  else if (Number.isFinite(rule.warnMin) && n < rule.warnMin)
    warning = `${labelBase(label)} ${ru(n)}${u} — ниже обычного предела ${ru(rule.warnMin)}${u}. Проверьте ввод.`;
  return { value: n, warning };
};

// Проверка одного поля записи: { value } или { error }, плюс необязательное { warning }.
// input — строка-подпись или поле-выбор из routes.js.
export const validateField = (key, input, raw, formula) => {
  const choice = asChoiceInput(key, input);
  if (choice) {
    const v = choiceValue(choice, raw);
    if (v === undefined || v === null || v === '')
      return { error: `${choice.label}: выберите вариант` };
    if (!choice.choices.some((c) => c.value === v))
      return { error: `${choice.label}: выберите вариант из списка` };
    return { value: v };
  }
  const label = inputLabel(input) || key;
  if (getInputType(key, input) === 'text') {
    const s = isBlank(raw) ? '' : String(raw).trim();
    return s ? { value: s } : { error: `${label}: заполните поле` };
  }
  return checkNumber(label, raw, getFieldRule(key, label, formula));
};

/** ------------------------------ Возраст ------------------------------ **/

// Возраст из пары полей «лет + мес» (общий пациент) → значения полей записи.
// Смысл полей записей сохранён:
//  - ageYears и ageMonths вместе — «полных лет» + «месяцев сверх лет» (5 лет 3 мес → 5 и 3);
//  - только ageYears — полные годы; до 1 года — дробью по месяцам (6 мес → 0,5), как раньше
//    просила подсказка поля («до 1 года — дробью»): пороги записей «< 1/12», «< 1» работают;
//  - только ageMonths — полный возраст в месяцах (1 год 6 мес → 18).
// age: { years, months } — строки полей. formula — запись: её inputLimits для ageYears/ageMonths
// (min/max — ошибка, warnMin/warnMax — предупреждение) применяются к получившимся значениям полей.
// Возвращает { values, ageMonths, warnings } или { error }.
export const resolveAge = (inputsMap, age, formula) => {
  const map = inputsMap || {};
  const hasY = 'ageYears' in map;
  const hasM = 'ageMonths' in map;
  const yRaw = age && age.years;
  const mRaw = age && age.months;
  if (isBlank(yRaw) && isBlank(mRaw)) return { error: 'Возраст: заполните поле (лет и/или мес)' };
  let y = 0;
  let m = 0;
  if (!isBlank(yRaw)) {
    const r = checkNumber('Возраст, лет', yRaw, { ...FIELD_RULES.ageYears, unit: 'лет' });
    if (r.error) return { error: r.error };
    y = r.value;
  }
  if (!isBlank(mRaw)) {
    const r = checkNumber('Возраст, мес', mRaw, { ...FIELD_RULES.ageMonths, unit: 'мес' });
    if (r.error) return { error: r.error };
    m = r.value;
  }
  // Месяцы сверх полных лет — 0–11; иначе поля противоречат друг другу
  if (y > 0 && m >= 12)
    return { error: 'Возраст: месяцы указываются сверх полных лет — от 0 до 11' };
  const total = composeAgeMonths(y, m);
  if (total === null) return { error: 'Возраст: введите число' };
  if (total > FIELD_RULES.ageMonths.max) {
    return { error: `Возраст: допустимо 0–${FIELD_RULES.ageYears.max} лет — проверьте ввод` };
  }
  const values = {};
  if (hasY && hasM) {
    values.ageYears = Math.floor(total / 12);
    values.ageMonths = total % 12;
  } else if (hasY) {
    values.ageYears = total < 12 ? total / 12 : Math.floor(total / 12);
  } else if (hasM) {
    values.ageMonths = total;
  }
  // Сужение пределов записью (inputLimits) — как для отдельных полей в прежнем режиме
  const warnings = [];
  const limits = (formula && formula.inputLimits) || {};
  for (const key of AGE_KEYS) {
    if (!(key in values) || !limits[key]) continue;
    const label = inputLabel(map[key]) || key;
    const r = checkNumber(label, values[key], getFieldRule(key, label, formula));
    if (r.error) return { error: r.error };
    if (r.warning) warnings.push(r.warning);
  }
  return { values, ageMonths: total, warnings };
};

// Ожидаемая масса по возрасту — APLS 2011 (единая формула для приложения):
// 0–12 мес: 0,5 × мес + 4; 1–5 лет: 2 × лет + 8; 6–12 лет: 3 × лет + 7. Старше 12 лет — не оцениваем.
export const expectedWeightApls = (months) => {
  if (!Number.isFinite(months) || months < 0) return undefined;
  if (months < 12) return 0.5 * months + 4;
  const years = Math.floor(months / 12);
  if (years <= 5) return 2 * years + 8;
  if (years <= 12) return 3 * years + 7;
  return undefined;
};

// Возраст в месяцах из полей формулы (ageYears, ageMonths или оба: «полных лет + месяцев»)
export const ageMonthsFromClean = (clean, inputsMap) => {
  const hasY = 'ageYears' in inputsMap && Number.isFinite(clean.ageYears);
  const hasM = 'ageMonths' in inputsMap && Number.isFinite(clean.ageMonths);
  if (hasY && hasM) return clean.ageYears * 12 + clean.ageMonths;
  if (hasY) return clean.ageYears * 12;
  if (hasM) return clean.ageMonths;
  return undefined;
};

// Мягкая проверка «вес ↔ возраст»: ловит ошибку в разряде (7 → 70 кг), которую диапазон 0,3–250 кг не видит.
// Порог ×2 / ×0,4 от массы по APLS — только предупреждение, расчёт не блокируется.
// Нижний порог — с 1 года: у недоношенных младенцев масса законно бывает вдвое ниже формулы.
export const ageWeightWarning = (clean, inputsMap, ageMonths) => {
  if (!('weight' in inputsMap) || !Number.isFinite(clean.weight)) return null;
  const months = Number.isFinite(ageMonths) ? ageMonths : ageMonthsFromClean(clean, inputsMap);
  const exp = expectedWeightApls(months);
  if (!exp) return null;
  const ratio = clean.weight / exp;
  if (ratio <= 2 && (months < 12 || ratio >= 0.4)) return null;
  const ageText =
    months < 12 ? `${ru(Math.round(months * 10) / 10)} мес` : `${Math.floor(months / 12)} лет`;
  return `Вес ${ru(clean.weight)} кг необычен для возраста ${ageText} (ожидаемо около ${ru(Math.round(exp))} кг по APLS). Проверьте ввод — нет ли ошибки в разряде.`;
};

// Проверка всех полей записи: { ok, errors, clean, notes, choices, ageMonths }.
// options.age — { years, months }: возраст из пары полей пациента (иначе ageYears/ageMonths
// берутся из rawInputs как отдельные числа — прежний режим).
export const validateAll = (formula, rawInputs, options = {}) => {
  const raw = rawInputs || {};
  const errors = [];
  const clean = {};
  const notes = [];
  const choices = [];
  const map = formula.inputs || {};
  const keys = Object.keys(map);
  const agePair = options.age !== undefined && options.age !== null && keys.some(isAgeKey);
  let ageMonths;
  if (agePair) {
    const r = resolveAge(map, options.age, formula);
    if (r.error) errors.push(r.error);
    else {
      Object.assign(clean, r.values);
      ageMonths = r.ageMonths;
      notes.push(...r.warnings);
    }
  }
  keys.forEach((key) => {
    if (agePair && isAgeKey(key)) return;
    const input = map[key];
    const r = validateField(key, input, raw[key], formula);
    if (r.error) errors.push(r.error);
    else {
      clean[key] = r.value;
      if (r.warning) notes.push(r.warning);
      const choice = asChoiceInput(key, input);
      if (choice)
        choices.push({
          key,
          label: choice.label,
          value: r.value,
          valueLabel: choiceLabel(choice, r.value),
        });
    }
  });
  if (!agePair) ageMonths = ageMonthsFromClean(clean, map);
  if (!errors.length) {
    const w = ageWeightWarning(clean, map, ageMonths);
    if (w) notes.push(w);
  }
  return { ok: errors.length === 0, errors, clean, notes, choices, ageMonths };
};

/** ------------------------------ Форматирование ------------------------------ **/

// Формат числа: убрать хвостовые нули дробной части («12.50» → «12.5», «20.0» → «20»)
const trimZeros = (s) => (s.includes('.') ? s.replace(/\.?0+$/, '') : s);
// toFixed, который не превращает ненулевое значение в «0.00»: тогда 2 значащие цифры
const fixedNZ = (v, d) => {
  const s = v.toFixed(d);
  return Number(s) === 0 && v !== 0 ? String(Number(v.toPrecision(2))) : s;
};

export const RATE_UNITS = [
  'мкг/мин',
  'мкг/ч',
  'мг/ч',
  'мл/ч',
  'МЕ/ч',
  'ЕД/ч',
  'мкг/мл',
  'мг/мл',
  'мкг/кг/мин',
  'мг/кг/ч',
];

// Округление на экране (контракт движка):
// мг/мкг/ЕД/МЕ: < 10 — 2 знака; 10–100 — 1 знак (чтобы доза совпадала с объёмом: 12.5 мг ↔ 0.25 мл);
//   ≥ 100 — целые; мг < 0,1 — 3 знака (0.035 мг); мг < 0,01 — в мкг («5 мкг (0.005 мг)»).
// мл: < 0,01 — 2 значащие цифры (0.0025 мл); < 0,1 — 3 знака (0.015 мл); < 1 — 2 знака; иначе 1 знак.
// г и скорости: 2/1/0 знаков, меньше 0,1 — 2 значащие цифры.
// Ненулевое значение никогда не выводится как «0.00».
export const fmtValue = (v, unit) => {
  if (unit === 'таб') {
    const quarters = Math.round(v * 4 + Number.EPSILON) / 4;
    if (quarters === 0 && v > 0) return `${String(Number(v.toPrecision(2)))} ${unit} (меньше 1/4)`;
    return `${quarters} ${unit}`;
  }
  if (unit === 'кап') {
    const r = Math.round(v);
    return r === 0 && v > 0 ? `меньше 1 ${unit}` : `${r} ${unit}`;
  }
  if (unit === 'мл') {
    if (v < 0.01) return `${String(Number(v.toPrecision(2)))} ${unit}`;
    if (v < 0.1) return `${trimZeros(v.toFixed(3))} ${unit}`;
    return v < 1 ? `${v.toFixed(2)} ${unit}` : `${v.toFixed(1)} ${unit}`;
  }
  if (unit === 'мг' && v > 0 && v < 0.01) {
    // Доза меньше 0,01 мг — в мкг, иначе на экране было бы «0.00 мг»
    return `${fmtValue(v * 1000, 'мкг')} (${String(Number(v.toPrecision(2)))} мг)`;
  }
  if (unit === 'мкг' || unit === 'мг' || unit === 'ЕД' || unit === 'МЕ') {
    if (v < 0.1)
      return `${unit === 'мг' ? trimZeros(fixedNZ(v, 3)) : String(Number(v.toPrecision(2)))} ${unit}`;
    if (v < 10) return `${v.toFixed(2)} ${unit}`;
    if (v < 100) return `${trimZeros(v.toFixed(1))} ${unit}`;
    return `${v.toFixed(0)} ${unit}`;
  }
  // Граммы и скорости инфузии: до сотых, на десятках — до десятых, чтобы не терять точность;
  // меньше 0,1 — 2 значащие цифры (0.005 мкг/мин, а не «0.01»)
  if (unit === 'г' || RATE_UNITS.includes(unit)) {
    if (v < 0.1) return `${String(Number(v.toPrecision(2)))} ${unit}`;
    return v < 10
      ? `${v.toFixed(2)} ${unit}`
      : v < 100
        ? `${v.toFixed(1)} ${unit}`
        : `${v.toFixed(0)} ${unit}`;
  }
  // Прочие единицы: убираем «хвост» плавающей точки (0.30000000000000004 → 0.3), единицу не теряем
  const s = String(Number(v.toPrecision(4)));
  return unit ? `${s} ${unit}` : s;
};

// Ключи результатов по порядку номера: result1, result2, …, result10
export const resultKeys = (raw) =>
  Object.keys(raw || {})
    .filter((k) => /^result\d+$/.test(k))
    .sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)));

// Статус значения относительно limits: ok | high (выше макс.) | atmax (= предел) | low (ниже мин.)
export const limitStatus = (val, lim) => {
  if (!lim) return 'ok';
  if (Number.isFinite(lim.max)) {
    const eps = Math.max(1e-9, Math.abs(lim.max) * 1e-6);
    if (val > lim.max + eps) return 'high';
    if (Math.abs(val - lim.max) <= eps) return 'atmax';
  }
  if (Number.isFinite(lim.min)) {
    const eps = Math.max(1e-9, Math.abs(lim.min) * 1e-6);
    if (val < lim.min - eps) return 'low';
  }
  return 'ok';
};

// Сборка строк результата из ответа формулы
export const buildItems = (raw, formula, clean) => {
  const units = formula.units || {};
  const labels = formula.labels || {};
  let limits = {};
  try {
    limits = (typeof formula.limits === 'function' ? formula.limits(clean) : formula.limits) || {};
  } catch {
    limits = {};
  }
  const items = [];
  resultKeys(raw).forEach((key) => {
    const val = raw[key];
    if (typeof val === 'number') {
      const unit = units[key];
      const name =
        labels[key] ||
        (unit ? (unit === 'мл' ? 'Объём' : 'Доза') : `Результат ${key.replace('result', '')}`);
      if (!Number.isFinite(val) || val <= 0) {
        // Нулевая/отрицательная/нечисловая доза — не результат: явно говорим, что не определена
        items.push({
          key,
          name,
          unit,
          value: null,
          text: '—',
          status: 'zero',
          badge: 'не определена для введённых данных',
        });
        return;
      }
      const lim = limits[key] || {};
      const status = limitStatus(val, lim);
      const badge =
        status === 'high'
          ? `↑ выше макс. ${fmtValue(lim.max, unit)}`
          : status === 'atmax'
            ? `= предел ${fmtValue(lim.max, unit)}`
            : status === 'low'
              ? `↓ ниже мин. ${fmtValue(lim.min, unit)}`
              : null;
      items.push({ key, name, unit, value: val, text: fmtValue(val, unit), status, badge });
    } else if (typeof val === 'string' && val.trim()) {
      items.push({
        key,
        name: labels[key] || 'Примечание',
        unit: '',
        value: null,
        text: val.trim(),
        status: 'info',
        badge: null,
      });
    }
  });

  // Объём < 0,1 мл точно не набрать без разведения — напоминаем, если формула сама об этом не сказала
  // (ни в примечании, ни в подписи разведённого объёма). Меньше 0,05 мл не набрать даже шприцем 1 мл:
  // при делении 0,01 мл ошибка 20% и больше — только разведение.
  const smallest = items
    .filter((i) => i.unit === 'мл' && i.value !== null && i.value < 0.1 && !/развед/i.test(i.name))
    .reduce((m, i) => Math.min(m, i.value), Infinity);
  const said = items.some(
    (i) =>
      (i.status === 'info' && /0[,.]1\s*мл|развед|развест/i.test(i.text)) ||
      (i.unit === 'мл' && /развед/i.test(i.name)),
  );
  if (smallest < 0.1 && !said) {
    items.push({
      key: 'engine-small-volume',
      name: 'Малый объём',
      unit: '',
      value: null,
      text:
        smallest < 0.05
          ? 'Объём меньше 0,05 мл точно не набрать: развести (например, 1:10 — 1 мл препарата + 9 мл 0,9% NaCl) и пересчитать объём на разведённый раствор.'
          : 'Объём меньше 0,1 мл: набирать шприцем 1 мл с делением 0,01 мл; точнее — развести и пересчитать объём на разведённый раствор.',
      status: 'info',
      badge: null,
    });
  }
  return items;
};

// Уровень строки для бейджа и рамки: danger (выше макс., не определена), warning (на пределе,
// ниже мин.), info (примечание), null (в пределах)
export const itemLevel = (status) =>
  status === 'high' || status === 'zero'
    ? 'danger'
    : status === 'low' || status === 'atmax'
      ? 'warning'
      : status === 'info'
        ? 'info'
        : null;

// Бейдж для диктора: без стрелок и знака «=»
export const spokenBadge = (badge) =>
  String(badge || '')
    .replace(/^↑\s*/, '')
    .replace(/^↓\s*/, '')
    .replace(/^=\s*предел/, 'на пределе')
    .trim();

// Подпись строки результата для диктора: «Доза, 2.00 мг, выше макс. 1.00 мг»
export const itemSpoken = (item) =>
  [
    item.name,
    item.status === 'zero' ? 'не определена' : item.text,
    item.status === 'zero' ? '' : spokenBadge(item.badge),
  ]
    .filter(Boolean)
    .join(', ');

// Общий уровень результата — по самой тревожной строке; всегда со словом, не только цветом
export const resultLevel = (items) => {
  const list = items || [];
  if (list.some((i) => i.status === 'high'))
    return { level: 'danger', label: 'Есть доза выше максимума — проверьте' };
  if (list.some((i) => i.status === 'zero'))
    return { level: 'danger', label: 'Есть значение, не определённое для этих данных' };
  if (list.some((i) => i.status === 'atmax'))
    return { level: 'warning', label: 'Доза на максимальном пределе' };
  if (list.some((i) => i.status === 'low'))
    return { level: 'warning', label: 'Есть доза ниже минимума' };
  return { level: null, label: null };
};

// Введённые данные одной строкой: «Вес — 20 кг (оценка) · Возраст — 5 лет».
// Поля-выборы сюда не входят: они показаны отдельными строками (choices).
// options.ageMonths — возраст пациента (показывается одной частью «5 лет 3 мес»),
// options.weightNote — пометка к весу («оценка»).
export const inputsSummary = (formula, clean, options = {}) => {
  const map = formula.inputs || {};
  const parts = [];
  let ageShown = false;
  Object.keys(map).forEach((k) => {
    if (asChoiceInput(k, map[k])) return;
    if (isAgeKey(k) && Number.isFinite(options.ageMonths)) {
      if (!ageShown) parts.push(`Возраст — ${formatAge(options.ageMonths)}`);
      ageShown = true;
      return;
    }
    if (clean[k] === undefined) return;
    const label = inputLabel(map[k]) || k;
    const unit = unitFromLabel(label);
    const note = k === 'weight' && options.weightNote ? ` (${options.weightNote})` : '';
    parts.push(`${labelBase(label) || k} — ${ru(clean[k])}${unit ? ` ${unit}` : ''}${note}`);
  });
  return parts.join(' · ');
};

// Время расчёта «ЧЧ:ММ» — без зависимости от локали устройства
export const nowText = (d = new Date()) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

// Полный расчёт записи: результат для экрана (ошибка ввода | «расчёт не выполняется» | успех).
// options: { age: { years, months }, weightNote, now: Date }
export const computeResult = (formula, rawInputs, options = {}) => {
  const { ok, errors, clean, notes, choices, ageMonths } = validateAll(
    formula,
    rawInputs || {},
    options,
  );
  if (!ok) {
    return { error: true, type: 'validation', message: errors.join('\n'), errors };
  }
  try {
    const raw = formula.formula(clean) || {};
    const items = buildItems(raw, formula, clean);
    const base = {
      formula: formula.name,
      description: formula.description || '',
      inputsText: inputsSummary(formula, clean, { ageMonths, weightNote: options.weightNote }),
      choices,
      notes,
      warnings: formula.warnings || [],
      timestamp: nowText(options.now),
    };
    // Формула вернула {} — расчёт для этих данных не предусмотрен: показываем предупреждения записи, а не «ошибку»
    if (!items.length)
      return {
        ...base,
        info: true,
        message: 'Для введённых данных расчёт не выполняется. См. указания ниже.',
      };
    return { ...base, success: true, items };
  } catch (error) {
    return {
      error: true,
      type: 'calculation',
      message: `Ошибка при выполнении расчёта: ${error.message}.`,
    };
  }
};

// Справочная запись: нет полей ввода и формула ничего не возвращает
export const isReferenceOnly = (formula) => {
  if (!formula) return false;
  if (typeof formula.formula !== 'function') return true;
  if (Object.keys(formula.inputs || {}).length > 0) return false;
  try {
    return resultKeys(formula.formula({}) || {}).length === 0;
  } catch {
    return true;
  }
};

// Текст для копирования: препарат, форма выпуска, путь/показание, введённые данные, результат,
// предупреждения, время. Без эмодзи — текст вставляется в карту вызова и мессенджеры.
export const buildCopyText = (results) => {
  const lines = [`Препарат: ${results.formula}`];
  if (results.description) lines.push(`Форма выпуска: ${results.description}`);
  (results.choices || []).forEach((c) => lines.push(`${c.label}: ${c.valueLabel}`));
  if (results.inputsText) lines.push(`Данные: ${results.inputsText}`);
  (results.notes || []).forEach((n) => lines.push(`Внимание: ${n}`));
  if (results.info) lines.push(results.message);
  (results.items || []).forEach((i) =>
    lines.push(`${i.name}: ${i.text}${i.badge ? ` (${i.badge})` : ''}`),
  );
  (results.warnings || []).forEach((w) => lines.push(`Внимание: ${w}`));
  lines.push(
    `Рассчитано: ${results.timestamp}. Расчёт справочный — сверьте с инструкцией к препарату.`,
  );
  return lines.join('\n');
};

// Текст для диктора после расчёта
export const resultSpoken = (results) => {
  if (!results) return '';
  if (results.error)
    return `${results.type === 'validation' ? 'Проверьте введённые данные' : 'Ошибка расчёта'}. ${results.message}`;
  if (results.info) return results.message;
  const choices = (results.choices || []).map((c) => `${c.label} ${c.valueLabel}`);
  const rows = (results.items || []).filter((i) => i.status !== 'info').map(itemSpoken);
  const hasNotes =
    (results.items || []).some((i) => i.status === 'info') || (results.notes || []).length > 0;
  return ['Результат расчёта', ...choices, ...rows, hasNotes ? 'Есть примечания ниже' : '']
    .filter(Boolean)
    .join('. ');
};

/** ------------------------------ Поиск ------------------------------ **/

// Нормализация: нижний регистр, ё → е
export const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .trim();
export const splitWords = (s) =>
  norm(s)
    .split(/[\s\-()/+,;:«»"'—–.]+/)
    .filter(Boolean);

// Торговые и привычные в СМП РФ названия → начало МНН в названии записи.
// Запись может добавить свои синонимы полем synonyms: ['…'].
export const SYNONYMS = [
  ['метамизол', ['анальгин', 'баралгин']],
  ['дифенгидрамин', ['димедрол']],
  ['хлоропирамин', ['супрастин']],
  ['диазепам', ['реланиум', 'релиум', 'сибазон', 'седуксен', 'валиум']],
  ['мидазолам', ['дормикум', 'фулсед']],
  ['флумазенил', ['анексат']],
  ['дротаверин', ['но-шпа', 'ношпа']],
  ['амиодарон', ['кордарон']],
  ['верапамил', ['изоптин', 'финоптин']],
  ['магния сульфат', ['магнезия', 'магний', 'кормагнезин']],
  ['норэпинефрин', ['норадреналин']],
  ['эпинефрин', ['адреналин']],
  ['допамин', ['дофамин']],
  ['добутамин', ['добутрекс']],
  ['метоклопрамид', ['церукал', 'реглан']],
  ['хлорпромазин', ['аминазин']],
  ['кальция глюконат', ['кальций']],
  ['калия хлорид + натрия ацетат', ['ацесоль', 'калий']],
  ['калия хлорид + кальция хлорид', ['рингер', 'раствор рингера', 'калий']],
  ['натрия хлорид 0', ['физраствор', 'физиологический раствор']],
  ['глюкоза', ['декстроза']],
  ['кеторолак', ['кеторол', 'кетанов']],
  ['трамадол', ['трамал']],
  ['пропофол', ['диприван']],
  ['кетамин', ['калипсол']],
  ['суксаметони', ['дитилин', 'листенон']],
  ['пипекурони', ['ардуан']],
  ['транексамов', ['транексам', 'тхк']],
  ['этамзилат', ['дицинон']],
  ['ацетилцистеин', ['ацц', 'флуимуцил']],
  ['активированный уголь', ['уголь', 'карболен']],
  ['сальбутамол', ['вентолин']],
  ['ипратропия бромид + фенотерол', ['беродуал']],
  ['будесонид', ['пульмикорт']],
  ['меглюмина натрия сукцинат', ['реамберин']],
  ['вальпроев', ['депакин', 'конвулекс']],
  ['хлорамфеникол', ['левомицетин']],
  ['цефтриаксон', ['роцефин']],
  ['налоксон', ['наркан']],
  ['эналаприлат', ['энап-р']],
  ['нифедипин', ['коринфар', 'кордафлекс']],
  ['пропранолол', ['анаприлин', 'обзидан']],
  ['каптоприл', ['капотен']],
  ['моксонидин', ['физиотенз']],
  ['клонидин', ['клофелин']],
  ['урапидил', ['эбрантил']],
  ['эноксапарин', ['клексан']],
  ['эсмолол', ['бревиблок']],
  ['метопролол', ['беталок', 'эгилок']],
  ['клопидогрел', ['плавикс']],
  ['изосорбида динитрат', ['изокет']],
  ['инозин + никотинамид', ['цитофлавин']],
  ['сульфацетамид', ['альбуцид']],
  ['этилметилгидроксипиридина', ['мексидол']],
  ['натрия гидрокарбонат', ['сода']],
  ['гэк', ['волювен', 'гидроксиэтилкрахмал']],
  ['фильтрум', ['лигнин']],
  ['пиридоксин', ['витамин в6', 'витамин b6']],
  ['тиамин', ['витамин в1', 'витамин b1']],
];

// МНН ищем по началу слова, а не подстрокой: «эпинефрин» не должен цеплять «норэпинефрин»
export const synonymsOf = (formula) => {
  const name = ` ${splitWords(formula.name).join(' ')}`;
  const own = Array.isArray(formula.synonyms) ? formula.synonyms.map(norm) : [];
  const dict = SYNONYMS.filter(([mnn]) => name.includes(` ${splitWords(mnn).join(' ')}`)).flatMap(
    ([, list]) => list.map(norm),
  );
  return [...new Set([...own, ...dict])];
};

// Служебные токены запроса (дозы, единицы, проценты) в пословном сравнении не участвуют
const SERVICE_TOKENS = new Set([
  'мл',
  'мг',
  'мкг',
  'г',
  'ед',
  'ме',
  'р-р',
  'раствор',
  'амп',
  'ампула',
  '%',
]);
export const queryTokens = (term) => {
  const all = norm(term)
    .split(/[\s,;]+/)
    .filter(Boolean);
  const sig = all.filter((t) => t.length >= 2 && !SERVICE_TOKENS.has(t) && !/^[\d.,]+%?$/.test(t));
  return sig.length ? sig : all;
};

// Совпадение слова запроса со словом названия: начало слова; основа (без 2 последних букв) для падежей
// у слов от 6 букв («магний» → «магния»); слово запроса длиннее слова названия («адреналина»).
const wordHit = (token, words) =>
  words.some(
    (w) =>
      w.startsWith(token) ||
      (token.length >= 6 && w.startsWith(token.slice(0, -2))) ||
      (w.length >= 4 && token.startsWith(w)),
  );

// Ранжирование: точное название → начало названия → начало слова названия → синоним →
// все слова запроса в названии/синонимах → подстрока названия → описание. При равенстве — порядок списка.
export const scoreFormula = (formula, q, tokens) => {
  const name = norm(formula.name);
  const desc = norm(formula.description);
  const syns = synonymsOf(formula);
  const nameWords = splitWords(formula.name);
  const synWords = syns.flatMap(splitWords);
  if (name === q) return { score: 100 };
  if (name.startsWith(q)) return { score: 90 };
  if (nameWords.some((w) => w.startsWith(q))) return { score: 85 };
  const syn = syns.find((s) => s === q || s.startsWith(q));
  if (syn && q.length >= 2) return { score: 80, synonym: syn };
  if (tokens.every((t) => wordHit(t, nameWords) || wordHit(t, synWords))) {
    const viaSyn = !tokens.every((t) => wordHit(t, nameWords));
    return {
      score: 70,
      synonym: viaSyn ? syns.find((s) => tokens.some((t) => wordHit(t, splitWords(s)))) : undefined,
    };
  }
  // Запрос из 1–2 букв — только по началу слов, иначе подстрока «ам»/«мл» находит полсписка
  if (q.length < 3) return { score: 0 };
  if (name.includes(q)) return { score: 60 };
  const descWords = splitWords(formula.description);
  if (
    tokens.every(
      (t) =>
        name.includes(t) || wordHit(t, nameWords) || wordHit(t, synWords) || wordHit(t, descWords),
    )
  )
    return { score: 40 };
  if (desc.includes(q)) return { score: 30 };
  return { score: 0 };
};

// Поиск: [{ formula, synonym }] по убыванию релевантности
export const searchFormulas = (list, term) => {
  const q = norm(term);
  if (!q) return list.map((formula) => ({ formula }));
  const tokens = queryTokens(term);
  return list
    .map((formula, index) => ({ formula, index, ...scoreFormula(formula, q, tokens) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ formula, synonym }) => ({ formula, synonym }));
};

// Слова для подсветки: вся фраза и каждое значимое слово запроса
export const highlightTerms = (term) => {
  const q = norm(term);
  if (!q) return [];
  return [...new Set([q, ...queryTokens(term).filter((t) => t.length >= 2)])].sort(
    (a, b) => b.length - a.length,
  );
};

// Текст, разбитый на части для подсветки: [{ text, hit }]. ё и е считаются одной буквой.
export const highlightParts = (text, term) => {
  const s = String(text ?? '');
  const terms = highlightTerms(term);
  if (!terms.length || !s) return [{ text: s, hit: false }];
  const safe = terms
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/е/g, '[её]'))
    .join('|');
  const re = new RegExp(`(${safe})`, 'i');
  return s
    .split(re)
    .map((part, i) => ({ text: part, hit: i % 2 === 1 }))
    .filter((p) => p.text !== '');
};
