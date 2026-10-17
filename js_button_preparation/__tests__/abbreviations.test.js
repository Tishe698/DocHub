import formulas from '../formulas';
import { ageWeightWarning } from '../engine';
import {
  ABBREVIATIONS,
  NOT_ABBREVIATIONS,
  abbreviationTokens,
  findAbbreviations,
  formulaTexts,
} from '../abbreviations';

// Все тексты, которые пользователь может увидеть: статичные поля записи и результаты расчёта
// на сетке масс и возрастов (младенцы, дети, подростки, взрослые, пожилые) для всех вариантов
// полей-выборов: часть предупреждений появляется только у отдельных возрастов и масс.
const WEIGHTS = [3, 10, 20, 50, 70, 120];
const AGES = [
  [0, 1],
  [0, 6],
  [1, 0],
  [6, 0],
  [15, 0],
  [18, 0],
  [40, 0],
  [70, 0],
  [85, 0],
];
const PATIENTS = WEIGHTS.flatMap((weight) =>
  AGES.map(([ageYears, ageMonths]) => ({ weight, ageYears, ageMonths })),
);
const EXTRA = { rate: 0.1, volume: 50, drugMg: 4, heparin: 5000 };

const choiceCombos = (formula) => {
  let combos = [{}];
  Object.entries(formula.inputs || {}).forEach(([key, input]) => {
    if (!input || typeof input !== 'object' || !Array.isArray(input.choices)) return;
    combos = combos
      .flatMap((c) => input.choices.map((ch) => ({ ...c, [key]: ch.value })))
      .slice(0, 60);
  });
  return combos;
};

const visibleTexts = (formula) => {
  const texts = formulaTexts(formula);
  PATIENTS.forEach((p) =>
    choiceCombos(formula).forEach((c) => {
      let r = {};
      try {
        r = formula.formula({ ...EXTRA, ...p, ...c }) || {};
      } catch {
        r = {};
      }
      Object.values(r).forEach((v) => typeof v === 'string' && texts.push(v));
    }),
  );
  return texts;
};

describe('сокращения в текстах препаратов', () => {
  it('у каждого сокращения есть расшифровка (или оно явно не требует её)', () => {
    const missing = {};
    formulas.forEach((f) => {
      abbreviationTokens(visibleTexts(f)).forEach((t) => {
        if (!ABBREVIATIONS[t] && !NOT_ABBREVIATIONS.has(t))
          (missing[t] = missing[t] || []).push(f.name);
      });
    });
    expect(missing).toEqual({});
  });

  it('findAbbreviations возвращает расшифровки в порядке появления, без повторов', () => {
    expect(
      findAbbreviations(['ИМпST: ТЛТ, затем ЧКВ; ТЛТ повторно не проводить', 'NaCl 0,9%']),
    ).toEqual([
      { abbr: 'ИМпST', full: ABBREVIATIONS.ИМпST },
      { abbr: 'ТЛТ', full: ABBREVIATIONS.ТЛТ },
      { abbr: 'ЧКВ', full: ABBREVIATIONS.ЧКВ },
    ]);
  });

  it('предупреждение «вес ↔ возраст» без нерасшифрованных сокращений', () => {
    const text = ageWeightWarning({ weight: 70 }, { weight: 'Вес (кг)', ageYears: 'Возраст' }, 60);
    expect(text).toMatch(/по возрастной формуле/);
    const tokens = abbreviationTokens([text]);
    expect(tokens.filter((t) => !ABBREVIATIONS[t] && !NOT_ABBREVIATIONS.has(t))).toEqual([]);
  });

  it('единицы и пути введения не считаются сокращениями', () => {
    expect(abbreviationTokens(['10 мг/кг в/в, 2 мл/ч, в/м, п/к'])).toEqual([]);
  });
});
