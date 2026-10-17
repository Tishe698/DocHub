// calculateShockIndex.js
// Shock Index (Allgöwer) for EMS use: SI = HR / SBP
// Режимы: взрослые; дети 1–16 лет (SIPA); дети < 1 года (SI не интерпретируется);
// беременность / послеродовой период (КР МЗ РФ «Послеродовое кровотечение», 2021).
// NOTE: Clinical decision support only — always correlate clinically.
import parseNum from '../utils/parseNum';

// Правдоподобные диапазоны ввода (общая практика медицинских калькуляторов, аудит M5-11).
const HR_RANGE = [20, 300];
const SBP_RANGE = [30, 300];
const AGE_MAX_YEARS = 120;

// Число с десятичной запятой: 1.2 → «1,2», 0.9 → «0,9»; digits — знаков после запятой.
export function fmt(n, digits = 1) {
  if (typeof n !== 'number' || !isFinite(n)) return '—';
  return n.toFixed(digits).replace('.', ',');
}

// Склонение «год / года / лет» (нормы русского языка).
function yearsWord(n) {
  const a = Math.abs(Math.floor(n)) % 100;
  const b = a % 10;
  if (a >= 11 && a <= 14) return 'лет';
  if (b === 1) return 'год';
  if (b >= 2 && b <= 4) return 'года';
  return 'лет';
}

// Возраст для текста: «8 мес», «1 год», «16 лет».
function ageText(ageYears) {
  if (ageYears < 1) {
    const m = Math.floor(ageYears * 12 + 1e-9);
    return m < 1 ? 'до 1 мес' : `${m} мес`;
  }
  const y = Math.floor(ageYears + 1e-9);
  return `${y} ${yearsWord(y)}`;
}

export function calcSI(hr, sbp) {
    if (typeof hr !== 'number' || !isFinite(hr) || hr <= 0) throw new Error('Недопустимый пульс.');
    if (typeof sbp !== 'number' || !isFinite(sbp) || sbp <= 0) throw new Error('Недопустимое САД.');
    // Проверка правдоподобия (аудит M5-11): опечатки не должны давать «громкий» результат.
    if (hr < HR_RANGE[0] || hr > HR_RANGE[1]) throw new Error(`Пульс вне диапазона ${HR_RANGE[0]}–${HR_RANGE[1]} уд/мин — проверьте ввод.`);
    if (sbp < SBP_RANGE[0] || sbp > SBP_RANGE[1]) throw new Error(`САД вне диапазона ${SBP_RANGE[0]}–${SBP_RANGE[1]} мм рт. ст. — проверьте ввод.`);
    const si = hr / sbp;
    // Округление до сотых до сравнения оставлено намеренно: классификация совпадает
    // с числом на экране (SI = 0,90 → «≤ 0,9»), сдвиг ≤ 0,005 меньше погрешности измерения.
    return Math.round(si * 100) / 100;
  }

  /**
   * Get classic adult categorization
   * Returns {label, tone, level} where level 0..4.
   * tone — уровень для Badge/Note темы ('success' | 'warning' | 'danger' | 'neutral'),
   * цвет берётся из темы на экране (литералов цвета в модуле нет).
   */
  function adultCategory(si) {
    if (si < 0.5) return { label: 'ниже нормы (перепроверьте данные)', tone: 'neutral', level: 0 };
    if (si < 0.7) return { label: 'норма', tone: 'success', level: 1 };
    if (si < 0.9) return { label: 'пограничный', tone: 'warning', level: 2 };
    if (si < 1.3) return { label: 'высокий риск шока', tone: 'danger', level: 3 };
    return { label: 'тяжёлый, вероятен шок', tone: 'danger', level: 4 };
  }

  /**
   * Беременность / послеродовой период.
   * КР МЗ РФ «Послеродовое кровотечение» 2021 (ID 119), разд. 2.5.1: норма ШИ после родов 0,7–0,9;
   * ШИ > 1,0 используется для оценки кровопотери и прогноза трансфузии.
   * 1,0 включено в «значимую» консервативно (прежнее поведение флага SI ≥ 1,0).
   * 0,9 — начало настороженности (верхняя граница нормы КР 2021; CRADLE, Nathan H.L. et al., BJOG 2015;122:268).
   * ≥ 1,7 — экстренная ситуация (Nathan H.L. et al., BJOG 2015;122:268–275).
   */
  function pregnancyCategory(si) {
    if (si < 0.5) return { label: 'ниже нормы (перепроверьте данные)', tone: 'neutral', level: 0 };
    if (si < 0.9) return { label: 'норма для беременной / родильницы', tone: 'success', level: 1 };
    if (si < 1.0) return { label: 'настороженность: верхняя граница нормы', tone: 'warning', level: 2 };
    if (si < 1.7) return { label: 'вероятна значимая кровопотеря', tone: 'danger', level: 3 };
    return { label: 'экстренно: высокий риск неблагоприятного исхода', tone: 'danger', level: 4 };
  }

  /**
   * Pediatric SIPA cutoff by age (полных лет).
   * Пороги SIPA по Nordin A. et al., J Pediatr Surg 2017 (расширение Acker S.N. et al., J Pediatr Surg 2015;50:331):
   * 1–3: > 1,2; 4–6: > 1,2 (у Acker > 1,22 — берём более осторожный 1,2); 7–12: > 1,0; 13–16: > 0,9.
   * Возраст считается в полных годах (16,5 года → 16 лет → 0,9). С 17 лет — взрослая шкала
   * (она строже: 0,7–0,89 «пограничный», 0,9 уже «высокий риск»).
   * < 1 года → SIPA не применяется (Marlor 2024, J Trauma Acute Care Surg 97:386 — нужны отдельные пороги).
   */
  function sipaCutoff(ageYears) {
    if (typeof ageYears !== 'number' || !isFinite(ageYears) || ageYears < 1) return null;
    const y = Math.floor(ageYears + 1e-9);
    if (y < 4) return 1.2;
    if (y < 7) return 1.2;
    if (y < 13) return 1.0;
    if (y <= 16) return 0.9;
    return null;
  }

  /**
   * Порог гипотензии по возрасту (САД, мм рт. ст.) — AHA PALS 2020:
   * доношенные новорождённые 0–28 дней < 60; 1–12 мес < 70; 1–10 лет < 70 + 2 × возраст (лет); > 10 лет < 90.
   */
  function pediatricHypotensionSBP(ageYears) {
    if (ageYears < 1 / 12) return 60;
    if (ageYears < 1) return 70;
    const y = Math.floor(ageYears + 1e-9);
    if (y <= 10) return 70 + 2 * y;
    return 90;
  }

  /**
   * Main calculator
   * @param {object} params
   * @param {number} params.sbp - systolic blood pressure (mmHg)
   * @param {number} params.hr - heart rate (bpm)
   * @param {number} [params.ageYears] - возраст в годах (дробный: 6 мес = 0,5)
   * @param {boolean} [params.pregnant=false] - беременность или послеродовой период
   * @param {boolean} [params.trauma=false]
   */
  const calculateShockIndex = (params) => {
    const { sbp, hr, ageYears, pregnant = false, trauma = false } = params || {};
    const si = calcSI(hr, sbp);

    const hasAge = ageYears !== undefined && ageYears !== null;
    if (hasAge && (typeof ageYears !== 'number' || !isFinite(ageYears) || ageYears < 0 || ageYears > AGE_MAX_YEARS)) {
      throw new Error(`Недопустимый возраст (0–${AGE_MAX_YEARS} лет).`);
    }
    if (pregnant && hasAge && ageYears < 10) {
      throw new Error('Отмечена беременность при возрасте < 10 лет — проверьте ввод.');
    }

    const infant = hasAge && ageYears < 1;
    const cutoff = pregnant ? null : sipaCutoff(ageYears);
    let mode;
    if (pregnant) mode = 'pregnancy';
    else if (infant) mode = 'infant';
    else if (cutoff) mode = 'sipa';
    else mode = hasAge ? 'adult' : 'adult_noage';

    let category, interpretation, sipaState = null;
    const notes = ['Шоковый индекс Альговера: SI = пульс / САД (мм рт. ст.).'];
    const warnings = [];

    // Гипотензия по возрастным порогам PALS 2020 (дети < 17 лет) — независимо от SI.
    let hypotensionSBP = null;
    if (hasAge && ageYears < 17) {
      hypotensionSBP = pediatricHypotensionSBP(ageYears);
    }
    const hypotension = hypotensionSBP !== null && sbp < hypotensionSBP;

    if (mode === 'infant') {
      // Аудит M5-1 / M14-10 / M15-4: у детей < 1 года ни SIPA, ни взрослые пороги не применимы —
      // нормальный SI младенца ≈ 1,0–2,6 (по возрастным нормам ЧСС/САД PALS 2020). Категорию и кровопотерю не выводим.
      category = { label: 'не интерпретируется у детей до 1 года', tone: 'neutral', level: null };
      interpretation = `Возраст ${ageText(ageYears)}: SI и SIPA у детей до 1 года не валидированы. ` +
        'Оценивайте ЧСС и САД по возрастным нормам (раздел «Физиологические нормы в педиатрии») и клинику: ' +
        'перфузия, время наполнения капилляров, сознание, диурез.';
      notes.push('Гипотензия (PALS 2020): САД < 60 у новорождённых 0–28 дней, < 70 мм рт. ст. в 1–12 мес.');
    } else if (mode === 'sipa') {
      // SIPA превышен при SI > порога (Acker 2015; Nordin 2017).
      const ok = si <= cutoff;
      sipaState = { cutoff };
      category = ok
        ? { label: 'SIPA не превышен', tone: 'success', level: 1 }
        : { label: 'SIPA превышен', tone: 'danger', level: 3 };
      interpretation = ok
        ? `Возраст ${ageText(ageYears)}: порог SIPA ${fmt(cutoff)}; SI ≤ ${fmt(cutoff)} — ниже порога.`
        : `Возраст ${ageText(ageYears)}: SI > ${fmt(cutoff)} — подозрение на гиповолемию/шок` +
          (trauma ? '; при травме — вероятна тяжёлая травма (трансфузия, ОРИТ).' : '.');
      notes.push('SIPA (Acker 2015; Nordin 2017) валидирован у детей 1–16 лет с тупой травмой как порог триажа, а не как норма.');
      if (Math.floor(ageYears + 1e-9) < 4) {
        // Аудит M15-6: низкая специфичность SIPA в 1–3 года (≈0,35; Cuenca 2020, PMC7331217).
        notes.push('1–3 года: SIPA малоспецифичен — у здоровых детей часто выше порога; подтверждайте клинически.');
      }
      if (!trauma) {
        notes.push('Без травмы SIPA — только ориентир (валидирован при травме).');
      }
    } else if (mode === 'pregnancy') {
      // Аудит M5-4: отдельная шкала для беременных / родильниц (КР МЗ РФ «Послеродовое кровотечение», 2021).
      category = pregnancyCategory(si);
      if (si >= 1.7) {
        interpretation = 'SI ≥ 1,7 — экстренно: массивное кровотечение вероятно, требуется срочное вмешательство и подготовка трансфузии.';
      } else if (si >= 1.0) {
        interpretation = 'SI ≥ 1,0 — вероятна значимая кровопотеря: оцените объём кровопотери, готовьте трансфузию (КР 2021: ШИ > 1,0).';
      } else if (si >= 0.9) {
        interpretation = 'SI 0,9–0,99 — верхняя граница нормы: повторите измерение, оцените кровопотерю.';
      } else {
        interpretation = 'Норма ШИ после родов 0,7–0,9 (КР МЗ РФ «Послеродовое кровотечение», 2021).';
      }
      notes.push('Беременность/роды: норма ШИ 0,7–0,9 (КР 2021, послеродовой период); до родов данные ограничены.');
    } else {
      // Adult (возраст ≥ 17 лет или не указан)
      category = adultCategory(si);
      interpretation = 'Нормальные значения у взрослых: ~0,5–0,7; рост индекса указывает на ухудшение гемодинамики.';
      if (mode === 'adult_noage') {
        warnings.push('Возраст не указан — применена взрослая шкала. Для ребёнка укажите возраст.');
      }
    }

    // Pregnancy flag (КР 2021: ШИ > 1,0; 1,0 включено консервативно)
    const pregnancyFlag = pregnant && si >= 1.0;

    // Trauma flag. Аудит M5-3 / M15-5: у детей — порог SIPA (SI > порога), у взрослых и беременных — SI ≥ 0,9
    // (Mutschler M. et al., Crit Care 2013;17:R172). У детей < 1 года флаг не вычисляется.
    let traumaFlag = false;
    let traumaLabel = null;
    if (trauma) {
      if (mode === 'sipa') {
        traumaFlag = si > cutoff;
        traumaLabel = `Травма: SI > порога SIPA (${fmt(cutoff)})`;
      } else if (mode !== 'infant') {
        traumaFlag = si >= 0.9;
        traumaLabel = 'Травма: SI ≥ 0,9';
      }
    }
    if (trauma && mode !== 'infant') {
      notes.push(mode === 'sipa'
        ? 'Травма у ребёнка: SI выше порога SIPA — предиктор тяжёлой травмы и потребности в трансфузии.'
        : 'Травма: SI ≥ 0,9 ассоциирован с необходимостью раннего вмешательства и трансфузии.');
    }

    // Ориентировочная кровопотеря — только для взрослых, по таблице проекта image2.png
    // (Allgöwer; Шок I ст. ≈10 %, II ст. 0,9–1,2 ≈20 %, III ст. 1,3–1,4 ≈30 %, IV ст. ≥ 1,5 > 40 % ОЦК).
    // Нижняя граница 0,7 оставлена согласованной со взрослой категорией «норма» 0,5–0,7.
    // Дети: связь SIPA с % ОЦК не устанавливалась (Acker 2015; Nordin 2017) — не выводим (аудит M5-2, M15-5).
    // Беременность: словесная оценка по КР 2021 без % ОЦК.
    let bloodLoss = null;
    if (mode === 'adult' || mode === 'adult_noage') {
      if (si < 0.7) bloodLoss = 'признаков нет';
      else if (si < 0.9) bloodLoss = '≈10 % ОЦК (минимальная)';
      else if (si < 1.3) bloodLoss = '≈20 % ОЦК';
      else if (si < 1.5) bloodLoss = '≈30 % ОЦК';
      else bloodLoss = '> 40 % ОЦК (массивная)';
      notes.push('Кровопотеря по SI — ориентировочно и только у взрослых (таблица Альговера: 0,9–1,2 ≈20 %, 1,3–1,4 ≈30 %, ≥ 1,5 > 40 % ОЦК).');
    } else if (mode === 'pregnancy') {
      if (si < 0.9) bloodLoss = 'признаков нет';
      else if (si < 1.0) bloodLoss = 'возможна';
      else if (si < 1.7) bloodLoss = 'вероятна значимая, оцените объём';
      else bloodLoss = 'вероятна массивная';
    }

    if (hypotension) {
      warnings.push(`САД ${Math.round(sbp)} < ${hypotensionSBP} мм рт. ст. — гипотензия для возраста (PALS 2020): декомпенсированный шок.`);
    }

    return {
      si,
      mode,
      category,
      interpretation,
      pediatric: sipaState,
      flags: {
        pregnancyConcern: pregnancyFlag,
        traumaHighRisk: trauma && traumaFlag,
        hypotension,
      },
      traumaLabel,
      bloodLossHint: bloodLoss,
      thresholds: {
        adult: { normalLow: 0.5, normalHigh: 0.7, elevated: 0.9, severe: 1.3 },
        sipa: sipaState ? sipaState.cutoff : null,
        pregnancy: { normalHigh: 0.9, significant: 1.0, emergency: 1.7 },
        pregnancyActionSI: 1.0,
        traumaActionSI: mode === 'sipa' ? cutoff : (mode === 'infant' ? null : 0.9),
        hypotensionSBP,
      },
      warnings,
      notes,
    };
  };

  export default calculateShockIndex;

// ----- Разбор ввода экрана (чистые функции, без React) -----

const isBlank = (t) => t === null || t === undefined || String(t).trim() === '';

/**
 * Проверка полей возраста «лет + мес» (строки). Месяцев 0–11, если указаны годы
 * (аудит M5-11: «6 мес» не должно читаться как 6 лет и наоборот).
 * @returns {{ years: string|null, months: string|null }} — текст ошибки поля или null
 */
export function ageFieldErrors(yearsText, monthsText) {
  const out = { years: null, months: null };
  const hasY = !isBlank(yearsText);
  const hasM = !isBlank(monthsText);
  const y = hasY ? parseNum(yearsText) : null;
  const m = hasM ? parseNum(monthsText) : null;
  if (hasY && (y === undefined || y < 0)) out.years = 'Недопустимый возраст (лет).';
  else if (hasY && y > AGE_MAX_YEARS) out.years = `Возраст больше ${AGE_MAX_YEARS} лет — проверьте ввод.`;
  if (hasM && (m === undefined || m < 0)) out.months = 'Недопустимый возраст (мес).';
  else if (hasY && hasM && m >= 12) out.months = 'Месяцев должно быть 0–11, если указаны годы.';
  return out;
}

/**
 * Состояние расчёта для экрана: из строк полей ЧСС/САД и возраста пациента (мес).
 * @param {object} p
 * @param {string} p.hrText — пульс (строка поля)
 * @param {string} p.sbpText — САД (строка поля)
 * @param {number|null} [p.ageMonths] — полный возраст в месяцах (общий пациент), null — не указан
 * @param {boolean} [p.ageInvalid] — поле возраста содержит ошибку (расчёт не выполняется)
 * @param {boolean} [p.pregnant]
 * @param {boolean} [p.trauma]
 * @returns {{ status: 'empty'|'error'|'ok', fieldErrors: {hr, sbp}, error: string|null, result: object|null }}
 */
export function evaluateShockIndex({ hrText, sbpText, ageMonths = null, ageInvalid = false, pregnant = false, trauma = false } = {}) {
  const fieldErrors = { hr: null, sbp: null };
  const hrBlank = isBlank(hrText);
  const sbpBlank = isBlank(sbpText);
  const hr = hrBlank ? undefined : parseNum(hrText);
  const sbp = sbpBlank ? undefined : parseNum(sbpText);
  if (!hrBlank && (hr === undefined || hr <= 0)) fieldErrors.hr = 'Введите пульс числом.';
  else if (hr !== undefined && (hr < HR_RANGE[0] || hr > HR_RANGE[1])) {
    fieldErrors.hr = `Вне диапазона ${HR_RANGE[0]}–${HR_RANGE[1]} уд/мин — проверьте ввод.`;
  }
  if (!sbpBlank && (sbp === undefined || sbp <= 0)) fieldErrors.sbp = 'Введите САД числом.';
  else if (sbp !== undefined && (sbp < SBP_RANGE[0] || sbp > SBP_RANGE[1])) {
    fieldErrors.sbp = `Вне диапазона ${SBP_RANGE[0]}–${SBP_RANGE[1]} мм рт. ст. — проверьте ввод.`;
  }
  if (fieldErrors.hr || fieldErrors.sbp) {
    return { status: 'error', fieldErrors, error: fieldErrors.hr || fieldErrors.sbp, result: null };
  }
  if (hrBlank || sbpBlank) return { status: 'empty', fieldErrors, error: null, result: null };
  if (ageInvalid) {
    return { status: 'error', fieldErrors, error: 'Исправьте возраст — от него зависят пороги.', result: null };
  }
  const hasAge = typeof ageMonths === 'number' && Number.isFinite(ageMonths);
  try {
    const result = calculateShockIndex({
      hr,
      sbp,
      ageYears: hasAge ? ageMonths / 12 : undefined,
      pregnant: !!pregnant,
      trauma: !!trauma,
    });
    return { status: 'ok', fieldErrors, error: null, result };
  } catch (e) {
    return { status: 'error', fieldErrors, error: (e && e.message) || 'Ошибка расчёта', result: null };
  }
}

/** Итог одной строкой — для озвучки и копирования. */
export function shockIndexSummary(result) {
  if (!result) return '';
  const parts = [`Шоковый индекс ${fmt(result.si, 2)}`, result.category.label];
  if (result.flags.hypotension) parts.push('гипотензия для возраста');
  if (result.flags.traumaHighRisk && result.traumaLabel) parts.push(result.traumaLabel);
  if (result.flags.pregnancyConcern) parts.push('беременность: индекс 1,0 и выше');
  if (result.bloodLossHint) parts.push(`кровопотеря: ${result.bloodLossHint}`);
  return parts.join(', ');
}
