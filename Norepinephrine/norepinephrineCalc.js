// norepinephrineCalc.js — чистый расчёт инфузии норадреналина (норэпинефрина), без React.
// Доза и миллиграммы — по основанию (общее решение приложения); тартрат показывается справочно.
// Экран (NorepinephrineScreen.js) только вызывает calcNorepinephrine и показывает результат.
import parseNum from '../utils/parseNum';

// Число для экрана: десятичная запятая; малые значения — 2 значащие цифры (а не «0,00»),
// число знаков выбирается по уже округлённому значению (99,95 → «100», а не «100,0»).
export const fmt = (v, d = 2) => {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '0';
  const abs = Math.abs(v);
  let s;
  if (abs < 0.1) s = String(Number(v.toPrecision(2)));
  else {
    const digits = abs >= 100 ? 0 : abs >= 10 ? Math.min(1, d) : d;
    s = v.toFixed(digits);
    if (digits > 0 && Math.abs(Number(s)) >= 100) s = v.toFixed(0);
    else if (digits > 1 && Math.abs(Number(s)) >= 10) s = v.toFixed(1);
  }
  return s.replace('.', ',');
};

// Эхо введённого числа без лишних нулей (1,5, а не «1,50»)
export const echo = (v) => String(Number(v.toFixed(3))).replace('.', ',');

// --- константы препарата ---
// Инструкция РФ «Норэпинефрин» (МЭЗ, ГРЛС): 1 мл концентрата = 2 мг норэпинефрина битартрата
// = 1 мг основания; ампула 4 мл. Общее решение приложения: доза и мг — по основанию.
export const BASE_MG_PER_ML = 1; // мг основания в 1 мл концентрата
export const AMPOULE_ML = 4; // мл в ампуле (= 4 мг основания, 8 мг тартрата)
export const TARTRATE_PER_BASE = 2; // 2 мг тартрата = 1 мг основания

// Пределы (значения после аудита fix/clinical-audit — не менять без источника)
export const NOREPI_LIMITS = Object.freeze({
  // Диапазон массы для отсечения опечаток (аудит DocHub: ≈0,4–250 кг)
  weightMinKg: 0.4,
  weightMaxKg: 250,
  // Ниже — вероятная опечатка (неонатальные протоколы начинают с 0,01 мкг/кг/мин)
  doseLowWarn: 0.01,
  // PALS 2020: детям до 2; взрослым обычно 0,05–0,5 — выше 1 проверяем ввод
  doseSoftWarn: 1,
  // Инструкция «Норадреналин Агетан» (ГРЛС): максимум до 3–5 мкг/кг/мин тартрата = 1,5–2,5 основания
  doseMaxAdult: 2.5,
  // AHA PALS 2020: детям 0,1–2 мкг/кг/мин (масса < 40 кг считаем детской)
  doseMaxChild: 2,
  childWeightKg: 40,
  // Ребёнок — до 18 лет (216 мес; 323-ФЗ, ст. 54 — несовершеннолетние; так же derived.isChild
  // общего пациента). При известном возрасте < 18 лет применяется детский предел PALS 2020
  // (консервативнее: 2 < 2,5), даже если масса ≥ 40 кг.
  childAgeMonths: 216,
  // Шаг стандартного шприцевого насоса 0,1 мл/ч
  pumpMinMlh: 0.1,
  pumpLowMlh: 1,
  pumpHighMlh: 30,
  // Самотёк неточен при редких каплях; очень частые — проверить разведение
  gttLow: 5,
  gttHigh: 60,
});

// Капельные системы: 20 кап/мл — стандартная (ISO 8536-4 / ГОСТ ISO 8536-4: 20 капель = 1 мл),
// 60 кап/мл — микрокапельная (документация производителей)
export const DROP_FACTORS = [20, 60];

const toNum = (v) => (typeof v === 'number' ? (Number.isFinite(v) ? v : undefined) : parseNum(v));

/**
 * Расчёт инфузии.
 * @param {object} p
 * @param {number|string} p.weight — масса, кг
 * @param {number|string} p.dose — доза, мкг/кг/мин основания
 * @param {number|string} [p.drugMg] — мг основания в шприце
 * @param {number|string} [p.syrVol] — итоговый объём раствора в шприце, мл
 * @param {number|string} [p.bagMg] — мг основания в пакете
 * @param {number|string} [p.bagDiluent] — мл растворителя в пакете (концентрат добавляется сверху)
 * @param {number} [p.dropFactor] — 20 или 60 кап/мл
 * @param {number|null} [p.ageMonths] — возраст пациента в месяцах (для детского предела дозы)
 * @returns {{ ok: boolean, errors: string[], fieldErrors: { weight, dose }, dose?, syringe?, bag? }}
 */
export function calcNorepinephrine({
  weight,
  dose,
  drugMg,
  syrVol,
  bagMg,
  bagDiluent,
  dropFactor,
  ageMonths = null,
} = {}) {
  const L = NOREPI_LIMITS;
  const W = toNum(weight);
  const D = toNum(dose); // мкг/кг/мин основания
  const M = toNum(drugMg); // мг основания в шприце
  const V = toNum(syrVol); // мл — итоговый объём раствора в шприце
  const BM = toNum(bagMg); // мг основания в пакете
  const BV = toNum(bagDiluent); // мл растворителя в пакете
  const F = Number(dropFactor) === 60 ? 60 : 20;

  const fieldErrors = { weight: null, dose: null };
  if (!(W > 0)) fieldErrors.weight = 'Введите массу тела (кг).';
  else if (W < L.weightMinKg || W > L.weightMaxKg) {
    fieldErrors.weight = `Масса ${echo(W)} кг вне диапазона 0,4–250 кг — проверьте ввод.`;
  }
  if (!(D > 0)) fieldErrors.dose = 'Введите дозу (мкг/кг/мин основания).';
  const errors = [fieldErrors.weight, fieldErrors.dose].filter(Boolean);
  if (errors.length) return { ok: false, errors, fieldErrors };

  // Доза: ограничение установленным максимумом
  const childByAge =
    typeof ageMonths === 'number' && Number.isFinite(ageMonths) && ageMonths < L.childAgeMonths;
  const isChild = W < L.childWeightKg || childByAge;
  const doseMax = isChild ? L.doseMaxChild : L.doseMaxAdult;
  const Dcalc = Math.min(D, doseMax);
  const doseWarnings = [];
  if (D > doseMax) {
    doseWarnings.push({
      level: 'error',
      text: isChild
        ? `Доза ${echo(D)} выше предела для детей (2 мкг/кг/мин основания, PALS 2020; ${childByAge ? 'возраст < 18 лет' : 'масса < 40 кг'}). Расчёт выполнен для 2. Проверьте ввод.`
        : `Доза ${echo(D)} выше максимума инструкции РФ (2,5 мкг/кг/мин основания = 5 тартрата). Расчёт выполнен для 2,5. Проверьте ввод.`,
    });
  } else if (D > L.doseSoftWarn) {
    doseWarnings.push({
      level: 'warn',
      text: `Доза ${echo(D)} выше 1 мкг/кг/мин основания (обычно взрослым 0,05–0,5) — проверьте ввод.`,
    });
  } else if (D < L.doseLowWarn) {
    doseWarnings.push({
      level: 'warn',
      text: 'Очень малая доза (< 0,01 мкг/кг/мин) — проверьте ввод.',
    });
  }

  const mcgMin = Dcalc * W; // мкг/мин основания
  const mgH = (mcgMin * 60) / 1000; // мг/ч основания
  const doseInfo = {
    D,
    Dcalc,
    doseMax,
    isChild,
    capped: D > doseMax,
    mcgMin,
    mgH,
    doseTartrate: Dcalc * TARTRATE_PER_BASE,
    warnings: doseWarnings,
  };

  // --- ШПРИЦ-ПОМПА: M мг основания, итоговый объём V мл ---
  let syringe = null;
  if (M > 0 && V > 0) {
    const concMl = M / BASE_MG_PER_ML; // мл концентрата
    const w = [];
    let ok = true;
    if (concMl > V) {
      ok = false;
      w.push({
        level: 'error',
        text: `${echo(M)} мг основания — это ${echo(concMl)} мл концентрата, больше итогового объёма ${echo(V)} мл. Проверьте мг и объём.`,
      });
    }
    if (ok) {
      const conc = (M * 1000) / V; // мкг/мл основания
      const mlph = (mcgMin * 60) / conc; // мл/ч
      // Инструкция РФ «Норэпинефрин»: концентрат вводят только после разведения в 5% декстрозе
      if (concMl === V)
        w.push({
          level: 'warn',
          text: 'Концентрат не разведён — вводят только после разведения (инструкция РФ).',
        });
      if (!Number.isFinite(mlph)) ok = false;
      else if (mlph < L.pumpMinMlh) {
        w.push({
          level: 'error',
          text: `Скорость ${fmt(mlph)} мл/ч ниже шага насоса (0,1 мл/ч) — разведите слабее (меньше мг или больше объём).`,
        });
      } else if (mlph < L.pumpLowMlh) {
        w.push({
          level: 'warn',
          text: `Скорость ${fmt(mlph)} мл/ч — меньше 1 мл/ч, точность насоса ниже. Лучше развести слабее.`,
        });
      } else if (mlph > L.pumpHighMlh) {
        w.push({
          level: 'warn',
          text: `Скорость ${fmt(mlph)} мл/ч — выше 30 мл/ч, шприца хватит на ${fmt(V / mlph, 1)} ч. Проверьте массу, дозу и мг; при верных данных можно развести концентрированнее.`,
        });
      }
      syringe = {
        ok,
        conc,
        mlph,
        concMl,
        diluentMl: V - concMl,
        ampoules: concMl / AMPOULE_ML,
        tartrateMg: M * TARTRATE_PER_BASE,
        hoursPerSyringe: V / mlph,
        warnings: w,
      };
    } else {
      syringe = { ok: false, warnings: w };
    }
  }

  // --- КАПЕЛЬНИЦА: BM мг основания + BV мл растворителя (объём концентрата учитывается) ---
  let bag = null;
  if (BM > 0 && BV > 0) {
    const concMl = BM / BASE_MG_PER_ML;
    const total = BV + concMl;
    const conc = (BM * 1000) / total; // мкг/мл основания
    const mlph = (mcgMin * 60) / conc; // мл/ч
    const gttExact = (mlph / 60) * F; // кап/мин
    const gtt = Math.round(gttExact);
    const w = [];
    if (gttExact < L.gttLow) {
      w.push({
        level: 'warn',
        text: `${gttExact < 1 ? 'Меньше 1' : gtt} кап/мин — капельница неточна. Используйте шприцевой насос или разведите слабее.`,
      });
    } else if (gttExact > L.gttHigh) {
      w.push({
        level: 'warn',
        text: `${gtt} кап/мин (${fmt(mlph)} мл/ч) — много жидкости. Проверьте ввод или разведите концентрированнее.`,
      });
    }
    bag = {
      ok: Number.isFinite(mlph),
      conc,
      mlph,
      total,
      concMl,
      gttExact,
      gtt,
      F,
      ampoules: concMl / AMPOULE_ML,
      warnings: w,
    };
  }

  return { ok: true, errors: [], fieldErrors, dose: doseInfo, syringe, bag };
}

// Число для диктора: без хвостовых нулей после запятой («7,00» → «7», «10,50» → «10,5»)
const say = (v) => {
  const t = fmt(v);
  return t.includes(',') ? t.replace(/0+$/, '').replace(/,$/, '') : t;
};

// Склонение: целые — 1 / 2–4 / 5+ (капля, капли, капель); дробные — родительный ед. ч. («10,5 миллилитра»)
const plural = (text, [one, few, many]) => {
  if (text.includes(',') || text.includes('.')) return few;
  const n = Math.abs(parseInt(text, 10)) % 100;
  const d = n % 10;
  if (n >= 11 && n <= 14) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
};
const MCG = ['микрограмм', 'микрограмма', 'микрограмм'];
const ML = ['миллилитр', 'миллилитра', 'миллилитров'];
const DROPS = ['капля', 'капли', 'капель'];
const withUnit = (text, forms) => `${text} ${plural(text, forms)}`;

// Короткий итог для озвучки (ResultCard): доза, скорость насоса и/или капельницы.
export function norepinephrineSummary(r) {
  if (!r || !r.ok) return '';
  const parts = [`Доза ${withUnit(say(r.dose.mcgMin), MCG)} в минуту`];
  if (r.dose.capped) parts.push(`ограничена максимумом ${echo(r.dose.doseMax)}`);
  if (r.syringe && r.syringe.ok)
    parts.push(`шприцевой насос ${withUnit(say(r.syringe.mlph), ML)} в час`);
  if (r.bag && r.bag.ok) {
    const drops = r.bag.gttExact < 1 ? 'меньше 1 капли' : withUnit(String(r.bag.gtt), DROPS);
    parts.push(`капельница ${withUnit(say(r.bag.mlph), ML)} в час, ${drops} в минуту`);
  }
  return parts.join(', ');
}
