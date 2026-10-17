// intubationFromPatient.js — связь общего пациента (patient/PatientContext) с расчётом ЭТТ.
// Чистые функции без React: выбор способа расчёта, разбор возраста, текст для диктора.
//
// Порядок:
//   1) рост указан → полный расчёт (calculateIntubationTubeLogic): рост — главный признак,
//      масса и возраст — для сверки (так устроена логика, значения в ней не меняются);
//      в логику идёт только введённая масса (weightSource 'entered'): оценка по ленте или по
//      возрасту (одинаковые 4 кг всем новорождённым по APLS) — не взвешивание, а логика по
//      массе выбирает неонатальную таблицу, обходит требование массы у новорождённого и
//      игнорирует измеренный рост. Оценка показывается в «Не использовано»;
//   2) роста нет, зона выбрана на ленте (BroselowPicker: weightSource 'broselow') →
//      размер прямо по зоне (calculateIntubationTubeByZone), масса середины зоны не используется;
//   3) иначе — полный расчёт по массе / возрасту / полу;
//   4) данных нет — расчёта нет, подсказка.
import {
  calculateIntubationTubeLogic,
  calculateIntubationTubeByZone,
  patientZoneKeyOf,
} from './CalculateIntubationTube';
import {
  zoneByKey as patientZoneByKey,
  zoneByHeight as patientZoneByHeight,
} from '../../patient/estimates';

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
// Масса введена (взвешивание / слова родителей), а не оценена по ленте или по возрасту.
const enteredWeight = (p) =>
  isNum(p.weightKg) && p.weightSource === 'entered' ? p.weightKg : undefined;
const estimateSourceText = (p) =>
  p.weightSource === 'broselow'
    ? 'оценка по ленте Broselow'
    : p.weightSource === 'age'
      ? 'оценка по возрасту'
      : 'оценка';
const fmt = (x) => String(x).replace('.', ',');
export const fmtMm = (x) => Number(x).toFixed(1).replace('.', ',');
export const fmtCm = (x) => fmt(x);

export const METHOD_LABELS = {
  neonate: 'новорождённый, по массе (NRP)',
  broselowHeight: 'по длине тела (лента Broselow)',
  broselowZone: 'по выбранной зоне ленты Broselow',
  broselowWeight: 'по массе (зона Broselow)',
  infantAge: 'младенец, по возрасту (масса по APLS)',
  age: 'по возрасту (PALS / ERC)',
  teen: 'подросток 13–15 лет: по возрасту и росту, не больше взрослых',
  adult: 'взрослые размеры (с 16 лет), по полу',
};

export const ROUTE_OPTIONS = [
  { value: 'oral', label: 'Через рот', accessibilityLabel: 'Интубация через рот' },
  { value: 'nasal', label: 'Назально', accessibilityLabel: 'Назальная интубация' },
  { value: 'both', label: 'Обе', accessibilityLabel: 'Показать глубину для обоих путей' },
];

// Полный возраст в месяцах → { ageYears, ageMonths } для логики (5 лет 3 мес → 5 и 3).
// Новорождённый (0 мес) → 0 и 0. Нет возраста → оба undefined.
export function splitAge(ageMonths) {
  if (!isNum(ageMonths) || ageMonths < 0) return { ageYears: undefined, ageMonths: undefined };
  const total = Math.floor(ageMonths);
  return { ageYears: Math.floor(total / 12), ageMonths: total % 12 };
}

// Какой расчёт применить для данных пациента: 'height' | 'zone' | 'data' | 'empty'.
export function intubationMode(patient) {
  const p = patient || {};
  if (isNum(p.heightCm)) return 'height';
  if (p.broselowZone && p.weightSource === 'broselow') return 'zone';
  if (enteredWeight(p) !== undefined || isNum(p.ageMonths)) return 'data';
  return 'empty';
}

/**
 * Расчёт ЭТТ по данным пациента.
 * @param {object} patient состояние PatientContext
 * @param {{ cuffed?: boolean, route?: 'oral'|'nasal'|'both', greySubzone?: string }} options
 * @returns {{ mode: string, result: object|null, error: string|null, needsGreySubzone: boolean }}
 */
export function computeIntubation(patient, { cuffed = false, route = 'both', greySubzone } = {}) {
  const p = patient || {};
  const mode = intubationMode(p);
  const age = splitAge(p.ageMonths);
  const out = { mode, result: null, error: null, needsGreySubzone: false };
  if (mode === 'empty') return out;

  try {
    if (mode === 'zone') {
      if (p.broselowZone === 'grey' && !greySubzone) out.needsGreySubzone = true;
      out.result = calculateIntubationTubeByZone({
        zoneKey: p.broselowZone,
        greySubzone,
        ageYears: age.ageYears,
        ageMonths: age.ageMonths,
        cuffed,
        route,
      });
      return out;
    }
    const weightKg = enteredWeight(p);
    const estimateDropped = weightKg === undefined && isNum(p.weightKg);
    let res;
    try {
      res = calculateIntubationTubeLogic({
        heightCm: isNum(p.heightCm) ? p.heightCm : undefined,
        weightKg,
        ageYears: age.ageYears,
        ageMonths: age.ageMonths,
        sex: p.sex === 'male' || p.sex === 'female' ? p.sex : undefined,
        cuffed,
        route,
      });
    } catch (e) {
      if (!estimateDropped) throw e;
      throw new Error(
        `${(e && e.message) || 'Ошибка расчёта'} Масса ${fmt(p.weightKg)} кг — ${estimateSourceText(p)}, для подбора трубки не используется: введите измеренную массу.`,
      );
    }
    if (estimateDropped) {
      res.ignored = [
        ...(res.ignored || []),
        `масса ${fmt(p.weightKg)} кг — ${estimateSourceText(p)}, не измерена`,
      ];
    }
    // Зона выбрана на ленте, но рост указан и даёт другую зону: считаем по росту, предупреждаем.
    // Только если расчёт действительно шёл по зоне ленты по росту (есть broselowZoneKey).
    // Совпадение — по любой из двух таблиц длины: ленты 2017 (patient/estimates, по ней подсказка
    // BroselowPicker «совпадает с ростом») и таблицы расчёта ЭТТ (границы на 0,2–0,3 см больше).
    if (
      mode === 'height' &&
      p.broselowZone &&
      p.weightSource === 'broselow' &&
      res.broselowZoneKey
    ) {
      const byCalc = patientZoneKeyOf(res.broselowZoneKey);
      const byTape = patientZoneByHeight(p.heightCm);
      const picked = patientZoneByKey(p.broselowZone);
      const pickedName = picked ? picked.name.toLowerCase() : p.broselowZone;
      if (byCalc !== p.broselowZone && !(byTape && byTape.key === p.broselowZone)) {
        res.warnings = [
          `Выбранная зона ленты (${pickedName}) не совпадает с ростом — расчёт по росту. Проверьте рост или зону.`,
          ...(res.warnings || []),
        ];
      } else if (byCalc !== p.broselowZone) {
        // Рост в полосе 0,2–0,3 см у границы зон: на ленте — выбранная зона, в таблице расчёта — соседняя.
        res.notes = [
          `Рост ${fmt(p.heightCm)} см — на границе зон: на ленте 2017 зона ${pickedName}, в таблице расчёта — ${res.broselowZone}. Расчёт по росту (зона ${res.broselowZone}).`,
          ...(res.notes || []),
        ];
      }
    }
    out.result = res;
  } catch (e) {
    out.error = (e && e.message) || 'Ошибка расчёта';
  }
  return out;
}

// Строка глубины для пути: { oral, nasal } → массив [{ key, label, value }] по выбранному пути.
export function depthRows(result, route) {
  if (!result) return [];
  const rows = [];
  if (route !== 'nasal')
    rows.push({
      key: 'oral',
      label: 'Глубина через рот (у губ / резцов)',
      value: result.depthOralCm,
    });
  if (route !== 'oral')
    rows.push({ key: 'nasal', label: 'Глубина назальная (у ноздри)', value: result.depthNasalCm });
  return rows.filter((r) => isNum(r.value));
}

// Текст для диктора: диаметр, тип, глубина, число предупреждений.
export function intubationAnnouncement(result, route = 'both') {
  if (!result) return '';
  const parts = [`Трубка ${fmtMm(result.tubeIDmm)} миллиметра, ${result.tubeType}`];
  for (const r of depthRows(result, route)) {
    parts.push(
      `${r.key === 'oral' ? 'глубина через рот' : 'назальная глубина'} ${fmtCm(r.value)} сантиметра`,
    );
  }
  const n = (result.warnings || []).length;
  if (n) parts.push(n === 1 ? 'есть предупреждение' : `предупреждений: ${n}`);
  return parts.join(', ');
}
