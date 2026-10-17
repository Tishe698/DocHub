import {
  DEFAULT_RESERVE_ATM,
  LIMITS,
  UNITS,
  computeO2Time,
  formatMinutes,
  pluralMinutes,
  toAtm,
  validateO2Fields,
} from '../oxygenCalc';

const base = {
  volume: 10,
  pressure: 150,
  unit: UNITS.ATM,
  flow: 10,
  reserveAtm: DEFAULT_RESERVE_ATM,
};

describe('computeO2Time — запас с остаточным давлением', () => {
  test('10 л, 150 атм, 10 л/мин, резерв 14 атм → 136 мин; до нуля 150 мин', () => {
    const r = computeO2Time(base);
    expect(r.minutes).toBe(136);
    expect(r.maxMinutes).toBe(150);
    expect(r.empty).toBe(false);
    expect(r.pressureAtm).toBe(150);
    expect(r.reserveAtm).toBe(14);
    expect(r.highFlow).toBe(false);
  });

  test('без резерва (0) время равно теоретическому максимуму', () => {
    const r = computeO2Time({ ...base, reserveAtm: 0 });
    expect(r.minutes).toBe(150);
    expect(r.maxMinutes).toBe(150);
  });

  test('время округляется вниз (в безопасную сторону)', () => {
    // 5 × (100 − 14) / 3 = 143,33 → 143; 5 × 100 / 3 = 166,67 → 166
    const r = computeO2Time({ volume: 5, pressure: 100, unit: UNITS.ATM, flow: 3, reserveAtm: 14 });
    expect(r.minutes).toBe(143);
    expect(r.maxMinutes).toBe(166);
  });

  test('давление не выше резерва — «баллон на резерве», 0 минут', () => {
    const r = computeO2Time({ ...base, pressure: 14 });
    expect(r.empty).toBe(true);
    expect(r.minutes).toBe(0);
    expect(r.maxMinutes).toBe(14);
    const r2 = computeO2Time({ ...base, pressure: 10 });
    expect(r2.empty).toBe(true);
  });

  test('поток выше 25 л/мин — предупреждение', () => {
    expect(computeO2Time({ ...base, flow: 25 }).highFlow).toBe(false);
    expect(computeO2Time({ ...base, flow: 26 }).highFlow).toBe(true);
  });
});

describe('МПа и атм', () => {
  test('1 МПа = 10 атм', () => {
    expect(toAtm(15, UNITS.MPA)).toBe(150);
    expect(toAtm(150, UNITS.ATM)).toBe(150);
  });

  test('15 МПа даёт тот же результат, что 150 атм', () => {
    const atm = computeO2Time(base);
    const mpa = computeO2Time({ ...base, pressure: 15, unit: UNITS.MPA });
    expect(mpa).toEqual(atm);
  });

  test('баллон 2 л, 19,6 МПа, 4 л/мин: 2 × (196 − 14) / 4 = 91 мин', () => {
    const r = computeO2Time({
      volume: 2,
      pressure: 19.6,
      unit: UNITS.MPA,
      flow: 4,
      reserveAtm: 14,
    });
    expect(r.minutes).toBe(91);
    expect(r.maxMinutes).toBe(98);
  });

  test('больше 30 МПа — подсказка про атм', () => {
    const r = computeO2Time({ ...base, pressure: 150, unit: UNITS.MPA });
    expect(r.error).toMatch(/30 МПа/);
    expect(r.error).toMatch(/атм/);
  });

  test('больше 300 атм — ошибка', () => {
    expect(computeO2Time({ ...base, pressure: 301 }).error).toMatch(/300 атм/);
    expect(computeO2Time({ ...base, pressure: 300 }).error).toBeUndefined();
  });
});

describe('пределы ввода', () => {
  test('нулевые и пустые значения — ошибка', () => {
    expect(computeO2Time({ ...base, volume: 0 }).error).toBeDefined();
    expect(computeO2Time({ ...base, pressure: undefined }).error).toBeDefined();
    expect(computeO2Time({ ...base, flow: -1 }).error).toBeDefined();
    expect(computeO2Time({ ...base, reserveAtm: undefined }).error).toMatch(/Резерв/);
    expect(computeO2Time({ ...base, reserveAtm: -1 }).error).toMatch(/Резерв/);
  });

  test('вместимость 0,5–50 л', () => {
    expect(computeO2Time({ ...base, volume: 0.4 }).error).toMatch(/Вместимость/);
    expect(computeO2Time({ ...base, volume: 51 }).error).toMatch(/Вместимость/);
    expect(computeO2Time({ ...base, volume: LIMITS.volumeMin }).error).toBeUndefined();
    expect(computeO2Time({ ...base, volume: LIMITS.volumeMax }).error).toBeUndefined();
  });

  test('поток 0,1–60 л/мин', () => {
    expect(computeO2Time({ ...base, flow: 0.05 }).error).toMatch(/потока/);
    expect(computeO2Time({ ...base, flow: 61 }).error).toMatch(/потока/);
  });

  test('резерв от 300 атм — ошибка', () => {
    expect(computeO2Time({ ...base, reserveAtm: 300 }).error).toMatch(/Резерв/);
  });

  test('validateO2Fields: пустые поля без ошибок, ошибки по каждому полю', () => {
    expect(validateO2Fields({ unit: UNITS.ATM })).toEqual({});
    const e = validateO2Fields({
      volume: 100,
      pressure: 40,
      unit: UNITS.MPA,
      flow: 100,
      reserveAtm: -2,
    });
    expect(Object.keys(e).sort()).toEqual(['flow', 'pressure', 'reserve', 'volume']);
    expect(validateO2Fields(base)).toEqual({});
  });
});

describe('форматирование минут', () => {
  test('склонение', () => {
    expect(pluralMinutes(1)).toBe('минута');
    expect(pluralMinutes(2)).toBe('минуты');
    expect(pluralMinutes(4)).toBe('минуты');
    expect(pluralMinutes(5)).toBe('минут');
    expect(pluralMinutes(11)).toBe('минут');
    expect(pluralMinutes(14)).toBe('минут');
    expect(pluralMinutes(21)).toBe('минута');
    expect(pluralMinutes(22)).toBe('минуты');
    expect(pluralMinutes(111)).toBe('минут');
    expect(pluralMinutes(0)).toBe('минут');
  });

  test('часы с 60 минут', () => {
    expect(formatMinutes(59)).toBe('59 минут');
    expect(formatMinutes(60)).toBe('60 минут (1 ч 0 мин)');
    expect(formatMinutes(750)).toBe('750 минут (12 ч 30 мин)');
  });
});
