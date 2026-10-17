// ventilatorCalc.js — стартовые параметры аппаратной ИВЛ для СМП (чистые функции, без React).
// Клинические значения перенесены без изменений из ветки fix/clinical-audit (calc_aparat_IVl.js);
// изменения логики отмечены «ИЗМЕНЕНО» с причиной.
import parseNum from '../utils/parseNum';
import { estimateWeightApls } from '../patient/estimates';

// ----- Общие помощники -----

// Число из числа или строки поля ввода; undefined — значения нет или ввод некорректен
export const toNum = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  return parseNum(v);
};

// Число с десятичной запятой; «—», если значения нет
export const fmt = (x) =>
  x === null || x === undefined || !Number.isFinite(x) ? '—' : String(x).replace('.', ',');

const round1 = (x) => Math.round(x * 10) / 10;

// I:E в виде «1:2» или «1/2» (дробные части — через точку или запятую); null, если ввод некорректен
export const parseIE = (s) => {
  const parts = String(s ?? '').split(/[:/]/).map(parseNum);
  return parts.length === 2 && parts.every((x) => x > 0) ? parts : null;
};

export const ratioText = ([i, e]) => `${fmt(i)}:${fmt(e)}`;

// Время вдоха/выдоха: до 0,5 с — две цифры после запятой, иначе одна (Ttot = 60 / ЧДД)
export const roundT = (t) => (t < 0.5 ? Math.round(t * 100) / 100 : Math.round(t * 10) / 10);

// Время вдоха и выдоха из ЧДД и I:E; null, если данных нет
export function breathTimes(rr, ieParts) {
  if (!(rr > 0) || !ieParts) return null;
  const cycleT = 60 / rr;
  const ti = cycleT * (ieParts[0] / (ieParts[0] + ieParts[1]));
  return { inspT: roundT(ti), expT: roundT(cycleT - ti) };
}

// ----- Должная (предсказанная) масса тела -----

// Взрослые — ARDSNet, NEJM 2000;342:1301: муж 50 + 0,91 × (рост − 152,4); жен 45,5 + 0,91 × (рост − 152,4).
// Рост 130–230 см (пределы правдоподобия из fix/clinical-audit).
export const HEIGHT_MIN = 130;
export const HEIGHT_MAX = 230;

// ИЗМЕНЕНО: раньше пол на экране был выбран всегда («муж.» по умолчанию). Теперь пол берётся из
// общего пациента и может быть не указан — тогда считаем по женской формуле: должная масса
// на 4,5 кг меньше, ДО меньше — консервативный (лёгочно-протективный) вариант; на экране предупреждение.
// Возвращает null (рост вне пределов или не введён) или { kg, sex, sexAssumed }.
export function predictedBodyWeight(sex, heightCm) {
  const h = toNum(heightCm);
  if (h === undefined || h < HEIGHT_MIN || h > HEIGHT_MAX) return null;
  const known = sex === 'male' || sex === 'female';
  const s = known ? sex : 'female';
  return { kg: (s === 'female' ? 45.5 : 50) + 0.91 * (h - 152.4), sex: s, sexAssumed: !known };
}

// ----- ИВЛ -----

// Защитный ДО: 6–8 мл/кг идеальной массы (ERC-ESICM 2021 Post-resuscitation care; ARDSNet, NEJM 2000);
// у детей 5–8 мл/кг (PEMVECC 2017). Вне 4–8 мл/кг — предупреждение.
export const VT_PER_KG_MIN = 4;
export const VT_PER_KG_MAX = 8;
// Pplat ≤ 30 см вод. ст. — защитная цель (ARDSNet, NEJM 2000)
export const PPLAT_MAX = 30;
// Pmax должен быть выше ПДКВ хотя бы на 10 см вод. ст. — иначе аппарат не доставит ДО
export const PMAX_PEEP_MARGIN = 10;
// Масса вне 0–250 кг — ошибка ввода (fix/clinical-audit)
export const WEIGHT_MAX = 250;
// Ребёнок: фактическая масса больше должной более чем на 20 % — избыток массы (ожирение); порог 120 %
// идеальной массы — принятая граница избытка массы (PALICC-2 2023 рекомендует ДО на идеальную массу)
export const CHILD_OVERWEIGHT_RATIO = 1.2;
// 18 лет — граница «ребёнок/взрослый» (как derived.isChild в patient/PatientContext.js)
export const ADULT_AGE_MONTHS = 216;

// ЧДД при СЛР у интубированного ребёнка (вентиляция асинхронно с компрессиями) —
// ERC 2021 Paediatric Life Support (НСР 2021): до 1 года 25, 1–8 лет 20, 8–12 лет 15, старше 12 лет 10/мин.
export const childArrestRr = (months) => {
  if (months < 12) return 25;
  if (months <= 96) return 20;
  if (months <= 144) return 15;
  return 10;
};

// ЧДД ребёнка вне остановки — нижняя граница возрастной нормы (таблица «Физиологические нормы»
// приложения, fiz_norm/pediatric_norms_screen.js); далее титровать по EtCO₂/PaCO₂.
// Отдельной возрастной ЧДД для старта ИВЛ в КР МЗ РФ, ERC 2021 и PEMVECC 2017 нет — взят возрастной минимум.
export const childNonArrestRr = (months) => {
  if (months < 3) return 40;
  if (months < 6) return 35;
  if (months < 12) return 33;
  if (months < 24) return 30;
  if (months < 60) return 26;
  if (months < 96) return 25;
  if (months < 120) return 22;
  if (months < 144) return 20;
  if (months < 168) return 18;
  return 16;
};

// Возможности аппаратов — по паспортам производителей
export const CAPS = Object.freeze({
  // MEDUMAT Standard² (Weinmann), брошюра, Technical data: Vt 50–2000 мл, f 5–50/мин, Pmax 10–65 мбар,
  // PEEP 0–30 мбар, I:E 1:4–4:1, поток до 80 л/мин (паспортного предела МОД нет). FiO₂: 100 % O₂ или Air Mix.
  medumat2: {
    label: 'MEDUMAT Standard²',
    short: 'Standard²',
    vtMin: 50, // мл
    vtMax: 2000, // мл
    rrMin: 5, // /мин
    rrMax: 50, // /мин
    pmaxMin: 10, // см H2O (1 мбар ≈ 1 см H2O)
    pmaxMax: 65,
    peepMin: 0, // см H2O
    peepMax: 30,
    ieMin: 1 / 4, // отношение I/E
    ieMax: 4,
    o2Switch: true,
  },
  // MEDUMAT Standard (Weinmann, прежняя модель), руководство EN, раздел 11: f 8–40/мин, МОД 3–20 л/мин,
  // Pmax 20–60 мбар, I:E фиксировано 1:1,67, ПДКВ — только внешним клапаном. На аппарате задают МОД и f.
  medumatStd: {
    label: 'MEDUMAT Standard',
    short: 'Standard',
    rrMin: 8,
    rrMax: 40,
    veMin: 3, // л/мин
    veMax: 20,
    pmaxMin: 20,
    pmaxMax: 60,
    ieFixed: [1, 1.67],
    peepExternal: true,
    setsMinuteVolume: true,
    o2Switch: true,
  },
  // А-ИВЛ/ВВЛ/ВЧп-4/40 («Медпром», medprom.spb.ru/products/4-40): ИВЛ 10–60/мин (ВЧ 90–360/мин —
  // отдельный режим, I:E 1:1, расчёт по мл/кг к нему не применяется); МОД 1–30 л/мин; ограничение давления
  // 15–50 см вод. ст.; I:E 1:2; 1:1,5; 1:1; 1,5:1; 2:1; FiO₂ 50/60/70/80/100 %; для пациентов от 1 года.
  // У детей 1–6 лет: давление 9–36 см вод. ст., МОД 0,7–10 л/мин. ДО в режиме ИВЛ отдельно не нормирован.
  ivl440: {
    label: 'А-ИВЛ/ВВЛ/ВЧп-4/40',
    short: 'ИВЛ 4/40',
    rrMin: 10,
    rrMax: 60,
    veMin: 1,
    veMax: 30,
    pmaxMin: 15,
    pmaxMax: 50,
    // ПДКВ в паспорте аппарата не нормировано (medprom.spb.ru/products/4-40) — только внешним клапаном.
    peepExternal: true,
    ieList: [
      [1, 2],
      [1, 1.5],
      [1, 1],
      [1.5, 1],
      [2, 1],
    ],
    fio2List: [50, 60, 70, 80, 100],
    minAgeMonths: 12,
    setsMinuteVolume: true,
    // Дети 1–6 лет (до 7 лет — консервативно, более узкие пределы)
    child: { maxAgeMonths: 83, pmaxMin: 9, pmaxMax: 36, veMin: 0.7, veMax: 10 },
  },
});

export const DEVICE_KEYS = Object.keys(CAPS);

// Варианты I:E для выбора кнопками.
// ИЗМЕНЕНО: раньше I:E вводили текстом; кнопки исключают опечатки и доступны диктору.
// MEDUMAT Standard² — типичные значения внутри паспортного диапазона 1:4–4:1;
// А-ИВЛ 4/40 — ровно паспортный список; MEDUMAT Standard — фиксировано (выбора нет).
const MEDUMAT2_IE = [
  [1, 4],
  [1, 3],
  [1, 2],
  [1, 1.5],
  [1, 1],
  [1.5, 1],
  [2, 1],
];
export const ieOptionsFor = (device) => {
  const c = CAPS[device];
  if (!c || c.ieFixed) return [];
  return (c.ieList || MEDUMAT2_IE).map(ratioText);
};

// Варианты FiO₂ для выбора кнопками: MEDUMAT — переключатель 100 % / Air Mix, А-ИВЛ — паспортный список
export const fio2OptionsFor = (device) => {
  const c = CAPS[device];
  if (!c || c.o2Switch) return [];
  return (c.fio2List || [100]).map(String);
};

// Сценарии
export const PRESETS = Object.freeze({
  arrest: {
    title: 'ИВЛ при остановке кровообращения (СЛР)',
    seg: 'Остановка (СЛР)',
    vtPerKg: 6, // мл/кг ИМТ; ERC 2021 ALS/BLS — 6–7 мл/кг (≈500–600 мл у взрослого)
    rrAdult: 10, // /мин; ERC 2021 ALS — 10/мин при протекции дыхательных путей
    peep: 5, // см H2O; ERC/AHA ПДКВ при СЛР не задают, экспертно 0–5 (Orso и соавт., Respir Care 2021)
    pmaxTube: 45, // см H2O; руководство Weinmann MEDUMAT Standard, с. 24: интубация — 45 мбар (компрессии повышают давление)
    pmaxMask: 20, // см H2O; там же: маска — 20 мбар (профилактика раздувания желудка)
    fio2: 100, // % (ERC 2021)
    ie: '1:2',
  },
  nonArrest: {
    title: 'ИВЛ без остановки / после ROSC',
    seg: 'Без остановки / ROSC',
    vtPerKg: 6, // 6–8 мл/кг ИМТ, старт 6 (ERC-ESICM 2021 Post-resuscitation care)
    rrAdult: 14, // 12–16/мин, далее по PaCO₂ 35–45 мм рт. ст. (ERC-ESICM 2021)
    peep: 5, // 5–10 см H2O
    pmaxTube: 30, // предел пикового давления; Pplat ≤ 30 (ARDSNet) — консервативный старт
    pmaxMask: 20, // маска — 20 мбар (руководство Weinmann MEDUMAT Standard, с. 24)
    fio2: 100, // старт 100 %, далее к SpO₂ 94–98 % (ERC-ESICM 2021)
    ie: '1:2',
  },
});

// Памятки по сценариям — собираются из PRESETS, чтобы не расходиться с пресетами
export function scenarioMemo(scenario) {
  if (scenario === 'arrest') {
    const A = PRESETS.arrest;
    return [
      `FiO₂: ${A.fio2} %.`,
      `ДО: ${A.vtPerKg} мл/кг идеальной массы (ERC 2021: 6–7 мл/кг).`,
      `ЧДД: взрослые ${A.rrAdult}/мин; дети: до 1 года 25, 1–8 лет 20, 8–12 лет 15, старше 12 лет 10/мин (ERC 2021).`,
      `Pmax (предел давления аппарата): трубка/НВУ ${A.pmaxTube}, маска ${A.pmaxMask} см вод. ст. (Weinmann) — компрессии повышают давление в контуре.`,
      'ПДКВ: 0–5 см вод. ст. (ERC/AHA ПДКВ при СЛР не задают — экспертное мнение).',
    ];
  }
  const N = PRESETS.nonArrest;
  return [
    `FiO₂: ${N.fio2} % на старте, затем к SpO₂ 94–98 %.`,
    `ДО: 6–8 мл/кг идеальной массы (старт ${N.vtPerKg}).`,
    `ЧДД: взрослые 12–16 (старт ${N.rrAdult}), дети — по возрастной норме; цель PaCO₂ 35–45 мм рт. ст.`,
    `Pplat ≤ ${PPLAT_MAX} см вод. ст. — защитная цель.`,
    `Pmax (предел аппарата): на 5–10 выше пикового давления при заданном ДО; старт ${N.pmaxTube}, маска ${N.pmaxMask} см вод. ст.`,
    `ПДКВ: 5–10 см вод. ст. (старт ${N.peep}).`,
  ];
}

// Подсказка по аппарату — из CAPS
export const deviceHint = (key) => {
  const c = CAPS[key];
  const parts = [];
  if (c.vtMin !== undefined) parts.push(`Vt ${c.vtMin}–${c.vtMax} мл`);
  else parts.push('Vt отдельно не задаётся — выставляют МОД и ЧДД');
  parts.push(
    `ЧДД ${c.rrMin}–${c.rrMax}/мин${key === 'ivl440' ? ' (ВЧ 90–360 — отдельный режим, расчёт по мл/кг не применим)' : ''}`
  );
  if (c.veMin !== undefined) parts.push(`МОД ${fmt(c.veMin)}–${c.veMax} л/мин`);
  parts.push(`Pmax ${c.pmaxMin}–${c.pmaxMax}`);
  parts.push(c.peepExternal ? 'ПДКВ — только внешним клапаном' : `ПДКВ ${c.peepMin}–${c.peepMax}`);
  if (c.ieFixed) parts.push(`I:E фиксировано ${ratioText(c.ieFixed)}`);
  else if (c.ieList) parts.push(`I:E ${c.ieList.map(ratioText).join('; ')}`);
  else parts.push(`I:E 1:${1 / c.ieMin}–${c.ieMax}:1`);
  if (c.fio2List) parts.push(`FiO₂ ${c.fio2List.join('/')} %`);
  if (c.o2Switch) parts.push('FiO₂: 100 % O₂ или Air Mix');
  if (c.child) {
    parts.push(
      `дети 1–6 лет: Pmax ${c.child.pmaxMin}–${c.child.pmaxMax}, МОД ${fmt(c.child.veMin)}–${c.child.veMax} л/мин; от 1 года`
    );
  }
  return `${c.label}: ${parts.join(', ')}.`;
};

// Группа по возрасту пациента: 'child' до 18 лет, 'adult' — с 18; без возраста — null
export const groupForAge = (ageMonths) =>
  typeof ageMonths === 'number' && Number.isFinite(ageMonths) && ageMonths >= 0
    ? ageMonths < ADULT_AGE_MONTHS
      ? 'child'
      : 'adult'
    : null;

// Эффективные пределы аппарата с учётом детских ограничений
export const effectiveCaps = (device, group, months) => {
  const c = CAPS[device];
  if (c.child && group === 'child' && Number.isFinite(months) && months <= c.child.maxAgeMonths) {
    return { ...c, ...c.child, childLimits: true };
  }
  return c;
};

// Пресет давления: маска или трубка/НВУ, не выше возможностей аппарата
export const pmaxPresetFor = (scenario, airway, caps) => {
  const p = PRESETS[scenario];
  const base = airway === 'mask' ? p.pmaxMask : p.pmaxTube;
  return Math.max(caps.pmaxMin, Math.min(base, caps.pmaxMax));
};

// Пресет ЧДД: взрослые — из сценария, дети — по возрасту; null, если возраст ребёнка не введён
export const rrPresetFor = (scenario, group, months) => {
  if (group === 'adult') return PRESETS[scenario].rrAdult;
  if (!Number.isFinite(months)) return null;
  return scenario === 'arrest' ? childArrestRr(months) : childNonArrestRr(months);
};

// Месяцы ребёнка из ageMonths пациента: undefined — возраст не указан
const childMonths = (ageMonths) => {
  const m = toNum(ageMonths);
  return m !== undefined && m >= 0 ? m : undefined;
};

export const MASS_BASIS = Object.freeze({
  ibw: 'должная (по росту и полу)',
  actual: 'фактическая',
  apls: 'по возрасту (APLS)',
});

// ИЗМЕНЕНО (ревью): масса из поля, выбранная по ленте Broselow или по возрасту в карточке пациента,
// — оценка, а не измерение; подпись основы не должна выдавать её за фактическую.
const ESTIMATE_BASIS = Object.freeze({
  broselow: 'оценка (лента Broselow)',
  age: 'оценка (по возрасту)',
});

// Подпись основы расчёта: massBasis из computeIvl и weightSource пациента ('entered'|'broselow'|'age'|null)
export const massBasisText = (massBasis, weightSource) => {
  if (!massBasis) return '—';
  if (massBasis === 'actual' && ESTIMATE_BASIS[weightSource]) return ESTIMATE_BASIS[weightSource];
  return MASS_BASIS[massBasis] || '—';
};

// Проверка полей возраста ребёнка «лет + мес» (строки) — ИЗМЕНЕНО (ревью): вернули прежнюю проверку
// «лет 0–17, мес 0–11», ошибка — под полем. При ошибке экран не берёт возраст (ЧДД и масса по
// возрасту не подставляются), чтобы не считать по неверно склеенному или устаревшему возрасту.
// Возвращает { years, months } — текст ошибки поля или null.
export const CHILD_AGE_MAX_YEARS = ADULT_AGE_MONTHS / 12 - 1;
export function childAgeFieldErrors(yearsText, monthsText) {
  const out = { years: null, months: null };
  const blank = (t) => t === null || t === undefined || String(t).trim() === '';
  const hasY = !blank(yearsText);
  const hasM = !blank(monthsText);
  const y = hasY ? parseNum(yearsText) : null;
  const m = hasM ? parseNum(monthsText) : null;
  if (hasY && (y === undefined || y < 0)) out.years = 'Введите число лет (0–17).';
  else if (hasY && y > CHILD_AGE_MAX_YEARS) out.years = `Ребёнок — 0–${CHILD_AGE_MAX_YEARS} лет; с 18 лет выберите «Взрослый».`;
  if (hasM && (m === undefined || m < 0)) out.months = 'Введите число месяцев.';
  else if (hasY && hasM && m >= 12) out.months = 'При указанных годах — месяцев 0–11.';
  return out;
}

// Основной расчёт.
// Вход: { device, scenario?, group ('adult'|'child'), sex ('male'|'female'|null), heightCm, weightKg,
//         weightSource ('entered'|'broselow'|'age'|null), ageMonths, ageInvalid (ошибка в полях возраста),
//         vtPerKg, rr, peep, pmax, fio2, o2Mode ('o2'|'airmix'), ie ('1:2') }
// (числа или строки полей ввода).
// Выход: { caps, months, mass, massBasis, massBasisText, vt, ve, rrN, inspT, expT, peepN, pmaxN, fio2Text,
//          tones: { vt, ve, rr, peep, pmax, ie, fio2, mass } ('default'|'bad'),
//          setting (что выставить на аппарате, где задают МОД) | null, warnings: string[] }
export function computeIvl(s) {
  const warnings = [];
  // ageInvalid — в полях возраста ошибка: возраст из контекста (возможно, устаревший) не берём
  const months = s.group === 'child' && !s.ageInvalid ? childMonths(s.ageMonths) : undefined;
  const caps = effectiveCaps(s.device, s.group, months);

  // Масса для расчёта ДО
  let mass;
  let massBasis = null; // 'ibw' | 'actual' | 'apls'
  let childOverweight = false; // ребёнок: фактическая масса > должной на 20 %
  let teenActual = false; // подросток ≥ 12 лет на фактической массе без роста
  const wActual = toNum(s.weightKg);
  const wOk = wActual !== undefined && wActual > 0 && wActual <= WEIGHT_MAX;
  if (wActual !== undefined && !wOk) warnings.push(`Масса вне 0–${WEIGHT_MAX} кг — проверьте ввод.`);

  if (s.group === 'adult') {
    const h = toNum(s.heightCm);
    const pbw = predictedBodyWeight(s.sex, h);
    if (pbw) {
      mass = pbw.kg;
      massBasis = 'ibw';
      if (pbw.sexAssumed) {
        warnings.push('Пол не указан — должная масса рассчитана по женской формуле (меньший ДО, консервативно). Укажите пол.');
      }
    } else {
      if (h !== undefined) warnings.push(`Рост вне ${HEIGHT_MIN}–${HEIGHT_MAX} см — идеальная масса не рассчитана.`);
      if (wOk) {
        mass = wActual;
        massBasis = 'actual';
        warnings.push(
          'ДО рассчитан на фактическую массу — при ожирении завышен. Введите рост и пол: расчёт пойдёт по идеальной массе.'
        );
      }
    }
    if (wOk && wActual < 40) warnings.push('Масса < 40 кг — проверьте группу: для детей выберите «Ребёнок».');
  } else {
    if (s.ageInvalid) warnings.push('Возраст: лет 0–17, мес 0–11 — проверьте ввод. ЧДД и масса по возрасту не подставлены.');
    else if (months === undefined) warnings.push('Введите возраст ребёнка — от него зависят ЧДД и пределы аппарата.');
    else if (months >= ADULT_AGE_MONTHS) warnings.push('Возраст 18 лет и старше — выберите «Взрослый».');
    // Базовая масса ребёнка: фактическая, без неё — оценка по возрасту (APLS, до 12 лет)
    let base;
    let baseBasis = null;
    if (wOk) {
      base = wActual;
      baseBasis = 'actual';
    } else {
      const est = months === undefined ? null : estimateWeightApls(months);
      if (est !== null) {
        base = est;
        baseBasis = 'apls';
      }
    }
    // ИЗМЕНЕНО (ревью): у детей ДО тоже считают на должную/идеальную массу — PALICC-2 2023
    // (Pediatr Crit Care Med 2023;24:143) и PEMVECC 2017 (Intensive Care Med 2017;43:1764): ДО ≤ 8 мл/кг
    // идеальной массы. Если введён рост ≥ 130 см, берём должную массу по ARDSNet и, консервативно,
    // меньшую из базовой и должной — ДО никогда не выше, чем на фактическую массу. Без пола — женская
    // формула (меньше). Ниже 130 см должная масса не считается — фактическая/APLS, как раньше.
    const h = toNum(s.heightCm);
    const pbw = predictedBodyWeight(s.sex, h);
    if (h !== undefined && h > HEIGHT_MAX) warnings.push(`Рост вне ${HEIGHT_MIN}–${HEIGHT_MAX} см — должная масса не рассчитана.`);
    if (pbw && (base === undefined || pbw.kg < base)) {
      mass = pbw.kg;
      massBasis = 'ibw';
      if (pbw.sexAssumed) {
        warnings.push('Пол не указан — должная масса рассчитана по женской формуле (меньший ДО, консервативно). Укажите пол.');
      }
      // Фактическая масса больше должной более чем на 20 % — избыток массы, ДО на фактическую был бы завышен
      if (wOk && wActual > pbw.kg * CHILD_OVERWEIGHT_RATIO) {
        childOverweight = true;
        warnings.push(
          `Фактическая масса ${fmt(round1(wActual))} кг больше должной (${fmt(round1(pbw.kg))} кг) более чем на 20 % — ДО рассчитан на должную массу.`
        );
      }
    } else {
      mass = base;
      massBasis = baseBasis;
    }
    if (mass === undefined && months !== undefined && months >= 144) {
      warnings.push('Старше 12 лет масса по возрасту не оценивается — введите рост (≥ 130 см) или массу.');
    }
    // Подросток (≥ 12 лет) на фактической массе без роста — ДО при ожирении завышен: подсветка и просьба
    if (massBasis === 'actual' && !pbw && months !== undefined && months >= 144) {
      teenActual = true;
      warnings.push('Подросток: ДО рассчитан на фактическую массу — при ожирении завышен. Введите рост и пол: расчёт пойдёт по должной массе.');
    }
    if (mass !== undefined) {
      warnings.push(
        'У ребёнка ДО считается на фактическую массу (без неё — по возрасту, APLS); если введён рост от 130 см — на меньшую из неё и должной массы по росту и полу.'
      );
    }
    // Новорождённых вентилируют по давлению и частоте (ERC 2021 Newborn Life Support; КР «Реанимация
    // и стабилизация новорождённых»), а не по мл/кг — расчёт для них только ориентир.
    if (months !== undefined && months < 1) {
      warnings.push(
        'Новорождённый: вентиляция — по давлению и частоте по алгоритму реанимации новорождённых (ERC NLS 2021), расчёт по мл/кг — лишь ориентир.'
      );
    }
  }

  const vtPerKgN = toNum(s.vtPerKg);
  const vt = mass !== undefined && vtPerKgN > 0 ? Math.round(vtPerKgN * mass) : null; // мл
  const rrN = toNum(s.rr);
  const rrOk = rrN !== undefined && rrN > 0;
  const ve = vt !== null && rrOk ? Math.round((vt / 1000) * rrN * 100) / 100 : null; // л/мин

  // Времена вдоха/выдоха из I:E (Ttot = 60 / ЧДД); без молчаливой подстановки 1:2
  const ieParts = caps.ieFixed || parseIE(s.ie);
  const times = breathTimes(rrN, ieParts);
  if (!caps.ieFixed && !ieParts) warnings.push('I:E не распознано — введите в виде 1:2.');

  // Подсветка: выход за возможности аппарата и за клинически безопасные пределы
  const out = (x, lo, hi) =>
    x !== null && x !== undefined && ((lo !== undefined && x < lo) || (hi !== undefined && x > hi));

  let vtTone = 'default';
  if (vt !== null) {
    if (out(vt, caps.vtMin, caps.vtMax)) {
      vtTone = 'bad';
      warnings.push(`ДО ${vt} мл вне возможностей аппарата (${caps.vtMin}–${caps.vtMax} мл).`);
    }
    if (vtPerKgN < VT_PER_KG_MIN || vtPerKgN > VT_PER_KG_MAX) {
      vtTone = 'bad';
      warnings.push(
        `ДО ${fmt(vtPerKgN)} мл/кг вне защитного диапазона ${VT_PER_KG_MIN}–${VT_PER_KG_MAX} мл/кг (рекомендуется 6–8 мл/кг идеальной массы).`
      );
    }
  }

  const veTone = out(ve, caps.veMin, caps.veMax) ? 'bad' : 'default';
  if (veTone === 'bad') {
    warnings.push(`МОД ${fmt(ve)} л/мин вне возможностей аппарата (${fmt(caps.veMin)}–${caps.veMax} л/мин).`);
  }

  const rrTone = !rrOk || out(rrN, caps.rrMin, caps.rrMax) ? 'bad' : 'default';
  if (rrOk && rrTone === 'bad') {
    warnings.push(`ЧДД ${fmt(rrN)}/мин вне возможностей аппарата (${caps.rrMin}–${caps.rrMax}/мин).`);
  }

  const peepN = toNum(s.peep);
  const pmaxN = toNum(s.pmax);
  const peepTone =
    peepN === undefined || peepN < 0 || (!caps.peepExternal && out(peepN, caps.peepMin, caps.peepMax))
      ? 'bad'
      : 'default';
  if (peepN !== undefined && peepTone === 'bad') {
    warnings.push(
      caps.peepExternal
        ? 'ПДКВ не может быть отрицательным.'
        : `ПДКВ ${fmt(peepN)} вне возможностей аппарата (${caps.peepMin}–${caps.peepMax} см вод. ст.).`
    );
  }
  if (caps.peepExternal) warnings.push('ПДКВ на этом аппарате — только внешним клапаном ПДКВ.');

  let pmaxTone = pmaxN === undefined || out(pmaxN, caps.pmaxMin, caps.pmaxMax) ? 'bad' : 'default';
  if (pmaxN !== undefined && pmaxTone === 'bad') {
    warnings.push(
      `Pmax ${fmt(pmaxN)} вне возможностей аппарата (${caps.pmaxMin}–${caps.pmaxMax} см вод. ст.${caps.childLimits ? ', дети до 7 лет' : ''}).`
    );
  }
  if (pmaxN !== undefined && peepN !== undefined && pmaxN < peepN + PMAX_PEEP_MARGIN) {
    pmaxTone = 'bad';
    warnings.push(`Pmax должен быть выше ПДКВ хотя бы на ${PMAX_PEEP_MARGIN} см вод. ст. — иначе ДО не будет доставлен.`);
  }

  // I:E по возможностям аппарата; инверсия — риск ауто-ПДКВ
  let ieTone = 'default';
  if (ieParts && !caps.ieFixed) {
    const r = ieParts[0] / ieParts[1];
    const inList = caps.ieList ? caps.ieList.some(([i, e]) => Math.abs(i / e - r) < 0.01) : true;
    if (!inList || out(r, caps.ieMin, caps.ieMax)) {
      ieTone = 'bad';
      warnings.push(`I:E ${ratioText(ieParts)} аппарат не поддерживает.`);
    }
    if (r > 1) warnings.push('Вдох длиннее выдоха (инверсия I:E) — риск ауто-ПДКВ и падения АД.');
  }

  // FiO₂
  let fio2Text;
  let fio2Tone = 'default';
  if (caps.o2Switch) {
    fio2Text = s.o2Mode === 'airmix' ? 'Air Mix (< 100 %)' : '100 % O₂';
  } else {
    const f = toNum(s.fio2);
    fio2Text = f === undefined ? '—' : `${fmt(f)} %`;
    if (f === undefined || f < 21 || f > 100) {
      fio2Tone = 'bad';
      warnings.push('FiO₂ — от 21 до 100 %.');
    } else if (caps.fio2List && !caps.fio2List.includes(f)) {
      fio2Tone = 'bad';
      warnings.push(`FiO₂ на этом аппарате — только ${caps.fio2List.join(', ')} %.`);
    }
  }

  // Ограничения по возрасту для аппарата
  if (caps.minAgeMonths !== undefined && s.group === 'child') {
    const tooYoung = months !== undefined ? months < caps.minAgeMonths : wOk && wActual < 10;
    if (tooYoung) warnings.push(`${caps.label} предназначен для пациентов от 1 года.`);
  }
  if (caps.childLimits) {
    warnings.push(
      `Ребёнок до 7 лет: детские пределы аппарата (Pmax ${caps.pmaxMin}–${caps.pmaxMax}, МОД ${fmt(caps.veMin)}–${fmt(caps.veMax)} л/мин).`
    );
  }

  // Что выставлять на аппаратах, где задают МОД и ЧДД
  const setting =
    caps.setsMinuteVolume && ve !== null && rrOk
      ? `На аппарате задают МОД ${fmt(ve)} л/мин и ЧДД ${fmt(rrN)}/мин (ДО = МОД / ЧДД).`
      : null;

  return {
    caps,
    months,
    mass: mass === undefined ? null : round1(mass),
    massBasis,
    massBasisText: massBasisText(massBasis, s.weightSource),
    vt,
    ve,
    rrN,
    inspT: times ? times.inspT : null,
    expT: times ? times.expT : null,
    peepN,
    pmaxN,
    fio2Text,
    tones: {
      vt: vtTone,
      ve: veTone,
      rr: rrTone,
      peep: peepTone,
      pmax: pmaxTone,
      ie: ieTone,
      fio2: fio2Tone,
      mass: (massBasis === 'actual' && s.group === 'adult') || childOverweight || teenActual ? 'bad' : 'default',
    },
    setting,
    warnings,
  };
}
