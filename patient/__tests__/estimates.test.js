import {
  BROSELOW_ZONES,
  estimateWeightApls,
  zoneByHeight,
  zoneByWeight,
  zoneByAge,
  formatAge,
  composeAgeMonths,
  splitAgeMonths,
  ageWeightMismatch,
} from '../estimates';
import { applyPatientPatch, derivePatient, EMPTY_PATIENT } from '../PatientContext';
import broselowColors from '../../theme/broselow';

describe('estimateWeightApls', () => {
  it('0–12 мес: 0,5 × мес + 4', () => {
    expect(estimateWeightApls(0)).toBe(4);
    expect(estimateWeightApls(6)).toBe(7);
    expect(estimateWeightApls(11)).toBe(9.5);
  });

  it('1–5 лет: 2 × лет + 8 (границы 12 мес и 5 лет 11 мес)', () => {
    expect(estimateWeightApls(12)).toBe(10);
    expect(estimateWeightApls(23)).toBe(10); // 1 год 11 мес — полных лет 1
    expect(estimateWeightApls(60)).toBe(18);
    expect(estimateWeightApls(71)).toBe(18);
  });

  it('6–12 лет: 3 × лет + 7 (границы 6 лет и 12 лет 11 мес)', () => {
    expect(estimateWeightApls(72)).toBe(25);
    expect(estimateWeightApls(120)).toBe(37);
    expect(estimateWeightApls(144)).toBe(43);
    expect(estimateWeightApls(155)).toBe(43);
  });

  it('старше 12 лет и некорректный ввод — null', () => {
    expect(estimateWeightApls(156)).toBeNull();
    expect(estimateWeightApls(216)).toBeNull();
    expect(estimateWeightApls(null)).toBeNull();
    expect(estimateWeightApls(-1)).toBeNull();
    expect(estimateWeightApls(NaN)).toBeNull();
  });
});

describe('зоны Broselow-Luten 2017', () => {
  it('девять зон подряд без разрывов по длине; цвета есть в теме', () => {
    expect(BROSELOW_ZONES.map((z) => z.key)).toEqual([
      'grey',
      'pink',
      'red',
      'purple',
      'yellow',
      'white',
      'blue',
      'orange',
      'green',
    ]);
    for (let i = 1; i < BROSELOW_ZONES.length; i++) {
      expect(BROSELOW_ZONES[i].lengthMinCm).toBe(BROSELOW_ZONES[i - 1].lengthMaxCm);
      expect(BROSELOW_ZONES[i].weightMinKg).toBeGreaterThan(BROSELOW_ZONES[i - 1].weightMaxKg);
    }
    for (const z of BROSELOW_ZONES) expect(broselowColors[z.key]).toBeDefined();
  });

  it('масса зоны — середина диапазона', () => {
    const w = Object.fromEntries(BROSELOW_ZONES.map((z) => [z.key, z.weightKg]));
    expect(w).toEqual({
      grey: 4,
      pink: 6.5,
      red: 8.5,
      purple: 10.5,
      yellow: 13,
      white: 16.5,
      blue: 21,
      orange: 26.5,
      green: 33,
    });
  });

  it('zoneByHeight: нижняя граница включительно, верхняя — нет', () => {
    expect(zoneByHeight(46.6).key).toBe('grey');
    expect(zoneByHeight(58.9).key).toBe('grey');
    expect(zoneByHeight(59).key).toBe('pink');
    expect(zoneByHeight(70).key).toBe('red');
    expect(zoneByHeight(74).key).toBe('purple');
    expect(zoneByHeight(90).key).toBe('yellow');
    expect(zoneByHeight(100).key).toBe('white');
    expect(zoneByHeight(115).key).toBe('blue');
    expect(zoneByHeight(125).key).toBe('orange');
    expect(zoneByHeight(143.3).key).toBe('green');
  });

  it('zoneByHeight: вне ленты и пустой ввод — null', () => {
    expect(zoneByHeight(46.5)).toBeNull();
    expect(zoneByHeight(143.4)).toBeNull();
    expect(zoneByHeight(null)).toBeNull();
    expect(zoneByHeight('')).toBeNull();
  });

  it('zoneByWeight: целые диапазоны и дробная масса между ними', () => {
    expect(zoneByWeight(3).key).toBe('grey');
    expect(zoneByWeight(5.5).key).toBe('grey');
    expect(zoneByWeight(6).key).toBe('pink');
    expect(zoneByWeight(9.9).key).toBe('red');
    expect(zoneByWeight(10).key).toBe('purple');
    expect(zoneByWeight(14).key).toBe('yellow');
    expect(zoneByWeight(18).key).toBe('white');
    expect(zoneByWeight(23).key).toBe('blue');
    expect(zoneByWeight(24).key).toBe('orange');
    expect(zoneByWeight(36).key).toBe('green');
    expect(zoneByWeight(36.9).key).toBe('green');
  });

  it('zoneByWeight: вне ленты — null', () => {
    expect(zoneByWeight(2.9)).toBeNull();
    expect(zoneByWeight(37)).toBeNull();
    expect(zoneByWeight(undefined)).toBeNull();
  });
});

describe('formatAge', () => {
  it('форматирует возраст по-русски', () => {
    expect(formatAge(0)).toBe('новорождённый');
    expect(formatAge(1)).toBe('1 мес');
    expect(formatAge(11)).toBe('11 мес');
    expect(formatAge(12)).toBe('1 год');
    expect(formatAge(13)).toBe('1 год 1 мес');
    expect(formatAge(24)).toBe('2 года');
    expect(formatAge(63)).toBe('5 лет 3 мес');
    expect(formatAge(11 * 12)).toBe('11 лет');
    expect(formatAge(21 * 12)).toBe('21 год');
    expect(formatAge(22 * 12 + 6)).toBe('22 года 6 мес');
  });

  it('пустой и некорректный возраст — пустая строка', () => {
    expect(formatAge(null)).toBe('');
    expect(formatAge(undefined)).toBe('');
    expect(formatAge(-3)).toBe('');
  });
});

describe('возраст «лет + мес»', () => {
  it('composeAgeMonths', () => {
    expect(composeAgeMonths(5, 3)).toBe(63);
    expect(composeAgeMonths(5, null)).toBe(60);
    expect(composeAgeMonths(null, 18)).toBe(18);
    expect(composeAgeMonths(1.5, null)).toBe(18);
    expect(composeAgeMonths(0, 0)).toBe(0);
    expect(composeAgeMonths(null, null)).toBeNull();
    expect(composeAgeMonths(-1, 0)).toBeNull();
  });

  it('splitAgeMonths', () => {
    expect(splitAgeMonths(63)).toEqual({ years: 5, months: 3 });
    expect(splitAgeMonths(0)).toEqual({ years: 0, months: 0 });
    expect(splitAgeMonths(null)).toBeNull();
  });
});

describe('ageWeightMismatch', () => {
  it('ожидаемая зона по возрасту', () => {
    expect(zoneByAge(0).key).toBe('grey');
    expect(zoneByAge(12).key).toBe('purple');
    expect(zoneByAge(60).key).toBe('white');
    expect(zoneByAge(13 * 12)).toBeNull();
  });

  it('отклонение до 2 зон — без предупреждения', () => {
    expect(ageWeightMismatch(60, 18).mismatch).toBe(false); // 5 лет, белая
    expect(ageWeightMismatch(60, 26).mismatch).toBe(false); // +2 зоны
    expect(ageWeightMismatch(60, 13).mismatch).toBe(false); // −1 зона
  });

  it('отклонение больше 2 зон — предупреждение с направлением', () => {
    const light = ageWeightMismatch(60, 8); // красная вместо белой: −3
    expect(light.mismatch).toBe(true);
    expect(light.direction).toBe('lighter');
    const heavy = ageWeightMismatch(12, 20); // синяя вместо фиолетовой: +3
    expect(heavy.mismatch).toBe(true);
    expect(heavy.direction).toBe('heavier');
    expect(ageWeightMismatch(0, 40).mismatch).toBe(true); // масса выше ленты
  });

  it('нет данных или возраст вне ленты — null', () => {
    expect(ageWeightMismatch(null, 10)).toBeNull();
    expect(ageWeightMismatch(24, null)).toBeNull();
    expect(ageWeightMismatch(200, 60)).toBeNull();
  });
});

describe('состояние пациента', () => {
  it('ввод массы помечает источник «entered» и сбрасывает зону', () => {
    const fromTape = applyPatientPatch(EMPTY_PATIENT, {
      broselowZone: 'red',
      weightKg: 8.5,
      weightSource: 'broselow',
    });
    expect(fromTape.weightSource).toBe('broselow');
    const typed = applyPatientPatch(fromTape, { weightKg: 9 });
    expect(typed.weightSource).toBe('entered');
    expect(typed.broselowZone).toBeNull();
    const cleared = applyPatientPatch(typed, { weightKg: null });
    expect(cleared.weightSource).toBeNull();
  });

  it('некорректные числа превращаются в null; без изменений — тот же объект', () => {
    const p = applyPatientPatch(EMPTY_PATIENT, { heightCm: -5, ageMonths: NaN });
    expect(p).toBe(EMPTY_PATIENT);
  });

  it('производные значения', () => {
    const p = applyPatientPatch(EMPTY_PATIENT, { ageMonths: 63, heightCm: 110 });
    const d = derivePatient(p);
    expect(d.ageYears).toBe(5.25);
    expect(d.isNeonate).toBe(false);
    expect(d.isChild).toBe(true);
    expect(d.estimatedWeightKg).toBe(18);
    expect(d.zone.key).toBe('blue');
    expect(d.hasData).toBe(true);
    expect(derivePatient(EMPTY_PATIENT).hasData).toBe(false);
    expect(derivePatient(applyPatientPatch(EMPTY_PATIENT, { ageMonths: 216 })).isChild).toBe(false);
  });
});
