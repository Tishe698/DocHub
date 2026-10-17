// laryngealFromPatient.js — связь общего пациента с подбором ларингеальной трубки VBM.
// Чистые функции без React. Таблица и пределы — CalculateTube.js (VBM LTS-D IFU 2017, с. 11).
import calculateTubeLogic, { validateTubeInput } from './CalculateTube';

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
export const fmtSize = (s) => String(s).replace('.', ',');

// Возраст, с которого категория по умолчанию — «взрослый»: 18 лет (как derived.isChild
// в PatientContext). Для таблицы VBM это безопасно: у «ребёнка» с массой > 25 кг размер всё
// равно выбирается по росту, а при росте > 150 см — по взрослым строкам.
const ADULT_MONTHS = 216;

export const CATEGORY_OPTIONS = [
  { value: 'child', label: 'Ребёнок', accessibilityLabel: 'Категория: ребёнок' },
  { value: 'adult', label: 'Взрослый', accessibilityLabel: 'Категория: взрослый' },
];

// Категория по возрасту пациента; без возраста — null (выбрать вручную).
export function categoryFromAge(ageMonths) {
  if (!isNum(ageMonths) || ageMonths < 0) return null;
  return ageMonths < ADULT_MONTHS ? 'child' : 'adult';
}

/**
 * Подбор по данным пациента.
 * @returns {{ prompt: string|null, result: object|null }}
 *   prompt — чего не хватает (ввод неполный или вне пределов), result — ответ calculateTubeLogic
 *   (tubeSize === '' — вне таблицы производителя, причина в warning).
 */
export function computeLaryngeal(category, weightKg, heightCm) {
  const w = category === 'child' && isNum(weightKg) ? weightKg : undefined;
  const h = isNum(heightCm) ? heightCm : undefined;
  const prompt = validateTubeInput(category, w, h);
  if (prompt) return { prompt, result: null };
  return { prompt: null, result: calculateTubeLogic(w, h, category) };
}

// Текст для диктора.
export function laryngealAnnouncement(result) {
  if (!result) return '';
  if (!result.tubeSize) return `Размер не определён. ${result.warning}`;
  return [
    `Ларингеальная трубка размер ${fmtSize(result.tubeSize)}`,
    `коннектор ${String(result.tubeColor).toLowerCase()}`,
    `объём манжеты ${result.cuffVolume}`,
    result.warning ? 'есть предупреждение' : null,
  ]
    .filter(Boolean)
    .join(', ');
}
