import {
  CATEGORIES,
  DAYS_22W,
  DAYS_37W,
  DAYS_42W,
  DAYS_MAX,
  DAYS_TO_DUE,
  ERRORS,
  addDays,
  calcPregnancy,
  daysBetween,
  daysWord,
  dueDateStatus,
  formatGestation,
  formatInputDate,
  formatRussianDate,
  formatShortDate,
  maxLmpDate,
  minLmpDate,
  msUntilNextMidnight,
  parseDDMMYYYY,
  pregnancyCategory,
  sameDay,
  spokenGestation,
  spokenRussianDate,
  spokenSummary,
  startOfDay,
  weeksWord,
} from '../pregnancyCalc';

const d = (y, m, day, h = 0, min = 0) => new Date(y, m - 1, day, h, min);
const ymd = (x) => `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}`;

describe('пороги (КР МЗ РФ)', () => {
  test('значения констант', () => {
    expect(DAYS_TO_DUE).toBe(280);
    expect(DAYS_22W).toBe(154);
    expect(DAYS_37W).toBe(259);
    expect(DAYS_42W).toBe(294);
    expect(DAYS_MAX).toBe(315);
  });
});

describe('календарные дни', () => {
  test('startOfDay и sameDay', () => {
    const x = d(2026, 5, 3, 17, 45);
    expect(startOfDay(x).getHours()).toBe(0);
    expect(ymd(startOfDay(x))).toBe('2026-5-3');
    expect(sameDay(x, d(2026, 5, 3))).toBe(true);
    expect(sameDay(x, d(2026, 5, 4))).toBe(false);
  });

  test('daysBetween не зависит от времени суток', () => {
    expect(daysBetween(d(2026, 1, 1, 23, 59), d(2026, 1, 2, 0, 1))).toBe(1);
    expect(daysBetween(d(2026, 1, 2, 0, 1), d(2026, 1, 1, 23, 59))).toBe(-1);
    expect(daysBetween(d(2026, 1, 1), d(2026, 1, 1, 23))).toBe(0);
  });

  test('daysBetween через границы месяцев, года и 29 февраля', () => {
    expect(daysBetween(d(2025, 12, 31), d(2026, 1, 1))).toBe(1);
    expect(daysBetween(d(2024, 2, 28), d(2024, 3, 1))).toBe(2);
    expect(daysBetween(d(2025, 2, 28), d(2025, 3, 1))).toBe(1);
    expect(daysBetween(d(2026, 1, 1), d(2027, 1, 1))).toBe(365);
    expect(daysBetween(d(2024, 1, 1), d(2025, 1, 1))).toBe(366);
  });

  test('daysBetween через переходы времени (для пояса, в котором идёт тест)', () => {
    // Европа: 29.03.2026 и 25.10.2026; США: 08.03.2026 и 01.11.2026
    expect(daysBetween(d(2026, 3, 1), d(2026, 3, 15))).toBe(14);
    expect(daysBetween(d(2026, 3, 20), d(2026, 4, 3))).toBe(14);
    expect(daysBetween(d(2026, 10, 20), d(2026, 11, 3))).toBe(14);
  });

  test('addDays', () => {
    expect(ymd(addDays(d(2026, 1, 1), 280))).toBe('2026-10-8');
    expect(ymd(addDays(d(2026, 3, 1), -1))).toBe('2026-2-28');
  });

  test('msUntilNextMidnight', () => {
    expect(msUntilNextMidnight(d(2026, 5, 3, 23, 59))).toBe(65 * 1000);
    expect(msUntilNextMidnight(d(2026, 5, 3, 12, 0))).toBe(12 * 3600 * 1000 + 5000);
    // защита от нуля/отрицательных значений
    const justBefore = new Date(2026, 4, 4, 0, 0, 4, 999);
    expect(msUntilNextMidnight(justBefore)).toBeGreaterThanOrEqual(1000);
  });

  test('границы календаря ДПМ', () => {
    const today = d(2026, 10, 17);
    expect(daysBetween(minLmpDate(today), today)).toBe(DAYS_MAX);
    const max = maxLmpDate(today);
    expect(sameDay(max, today)).toBe(true);
    expect(max.getHours()).toBe(23);
  });
});

describe('calcPregnancy — срок и ПДР', () => {
  test('ДПМ + 280 дней', () => {
    const r = calcPregnancy(d(2026, 1, 1), d(2026, 1, 1));
    expect(ymd(r.due)).toBe('2026-10-8');
    expect(r).toMatchObject({
      daysSinceLMP: 0,
      weeks: 0,
      days: 0,
      currentWeek: 1,
      daysToDue: 280,
      category: 'early',
    });
  });

  test('ДПМ 29.02 (високосный год)', () => {
    expect(ymd(calcPregnancy(d(2024, 2, 29), d(2024, 3, 1)).due)).toBe('2024-12-5');
  });

  test('ПДР через Новый год', () => {
    expect(ymd(calcPregnancy(d(2026, 6, 1), d(2026, 7, 1)).due)).toBe('2027-3-8');
  });

  test('время суток у дат не влияет', () => {
    const a = calcPregnancy(d(2026, 3, 1, 23, 30), d(2026, 6, 10, 0, 15));
    const b = calcPregnancy(d(2026, 3, 1), d(2026, 6, 10));
    expect({ ...a, due: ymd(a.due) }).toEqual({ ...b, due: ymd(b.due) });
    expect(a.daysSinceLMP).toBe(101);
    expect(a).toMatchObject({ weeks: 14, days: 3, currentWeek: 15 });
  });

  test.each([
    [0, 0, 0, 'early'],
    [6, 0, 6, 'early'],
    [7, 1, 0, 'early'],
    [153, 21, 6, 'early'],
    [154, 22, 0, 'preterm'],
    [258, 36, 6, 'preterm'],
    [259, 37, 0, 'term'],
    [280, 40, 0, 'term'],
    [293, 41, 6, 'term'],
    [294, 42, 0, 'postterm'],
    [315, 45, 0, 'postterm'],
  ])('%i дн → %i нед %i дн, %s', (k, w, dd, cat) => {
    const lmp = d(2026, 1, 10);
    const r = calcPregnancy(lmp, addDays(lmp, k));
    expect(r).toMatchObject({
      daysSinceLMP: k,
      weeks: w,
      days: dd,
      category: cat,
      daysToDue: 280 - k,
    });
    expect(r.tooLong).toBe(false);
  });

  test('больше 45⁰ нед — tooLong (дата устарела после полуночи)', () => {
    const lmp = d(2026, 1, 10);
    expect(calcPregnancy(lmp, addDays(lmp, 316)).tooLong).toBe(true);
  });

  test('pregnancyCategory: границы', () => {
    expect(pregnancyCategory(DAYS_22W - 1)).toBe('early');
    expect(pregnancyCategory(DAYS_22W)).toBe('preterm');
    expect(pregnancyCategory(DAYS_37W - 1)).toBe('preterm');
    expect(pregnancyCategory(DAYS_37W)).toBe('term');
    expect(pregnancyCategory(DAYS_42W - 1)).toBe('term');
    expect(pregnancyCategory(DAYS_42W)).toBe('postterm');
  });

  test('у каждой категории есть текст, озвучка без надстрочных знаков и уровень', () => {
    Object.values(CATEGORIES).forEach((c) => {
      expect(c.text).toBeTruthy();
      expect(c.spoken).not.toMatch(/[⁰¹²³⁴⁵⁶⁷⁸⁹≥]/);
      expect(['info', 'warning', 'success', 'danger']).toContain(c.level);
    });
    expect(CATEGORIES.preterm.level).toBe('warning');
    expect(CATEGORIES.postterm.level).toBe('warning');
  });
});

describe('formatInputDate — маска дд.мм.гггг', () => {
  test.each([
    ['', ''],
    ['0', '0'],
    ['03', '03'],
    ['030', '03.0'],
    ['0305', '03.05'],
    ['03052026', '03.05.2026'],
    ['030520269', '03.05.2026'],
    ['3.5.2026', '03.05.2026'],
    ['3/5/2026', '03.05.2026'],
    ['3-5-2026', '03.05.2026'],
    ['3 5 2026', '03.05.2026'],
    ['3,5,2026', '03.05.2026'],
    ['2026-05-03', '03.05.2026'],
    ['2026-5-3', '03.05.2026'],
    ['03..05', '03.05'],
    ['ab03', '03'],
  ])('%p → %p', (input, out) => expect(formatInputDate(input)).toBe(out));

  test('null/undefined', () => {
    expect(formatInputDate(null)).toBe('');
    expect(formatInputDate(undefined)).toBe('');
  });
});

describe('parseDDMMYYYY', () => {
  const today = d(2026, 10, 17, 15, 0);

  test('корректная дата', () => {
    const r = parseDDMMYYYY('01.05.2026', today);
    expect(ymd(r.date)).toBe('2026-5-1');
    expect(r.date.getHours()).toBe(0);
  });

  test('сегодняшняя дата допустима', () => {
    expect(ymd(parseDDMMYYYY('17.10.2026', today).date)).toBe('2026-10-17');
  });

  test.each(['', '1.5.2026', '01-05-2026', '01.05.26', 'abc', null])('формат %p', (s) => {
    expect(parseDDMMYYYY(s, today)).toEqual({ error: ERRORS.format });
  });

  test.each([
    '31.02.2026',
    '29.02.2025',
    '30.02.2024',
    '31.04.2026',
    '00.05.2026',
    '01.13.2026',
    '01.00.2026',
    '99.99.2026',
    '01.01.0099',
  ])('несуществующая дата %s', (s) =>
    expect(parseDDMMYYYY(s, today)).toEqual({ error: ERRORS.notExists }),
  );

  test('29.02 високосного года — существует', () => {
    expect(ymd(parseDDMMYYYY('29.02.2024', d(2024, 10, 1)).date)).toBe('2024-2-29');
  });

  test.each(['18.10.2026', '01.01.2027', '17.10.2030'])('будущая дата %s', (s) => {
    expect(parseDDMMYYYY(s, today)).toEqual({ error: ERRORS.future });
  });

  test('ровно 45⁰ нед назад — допустимо, на день раньше — нет', () => {
    const limit = addDays(startOfDay(today), -DAYS_MAX);
    expect(parseDDMMYYYY(formatShortDate(limit), today).date).toBeTruthy();
    expect(parseDDMMYYYY(formatShortDate(addDays(limit, -1)), today)).toEqual({
      error: ERRORS.tooOld,
    });
    expect(parseDDMMYYYY('17.10.2025', today)).toEqual({ error: ERRORS.tooOld });
  });
});

describe('форматирование', () => {
  test('даты', () => {
    expect(formatShortDate(d(2026, 5, 3))).toBe('03.05.2026');
    expect(formatRussianDate(d(2026, 10, 8))).toBe('8 октября 2026 г.');
    expect(formatRussianDate(d(2027, 1, 1))).toBe('1 января 2027 г.');
    expect(spokenRussianDate(d(2026, 3, 29))).toBe('29 марта 2026 года');
  });

  test('склонение недель и дней', () => {
    expect([1, 2, 5, 11, 21, 22, 40].map(weeksWord)).toEqual([
      'неделя',
      'недели',
      'недель',
      'недель',
      'неделя',
      'недели',
      'недель',
    ]);
    expect([0, 1, 2, 5, 6].map(daysWord)).toEqual(['дней', 'день', 'дня', 'дней', 'дней']);
  });

  test('срок', () => {
    expect(formatGestation(13, 2)).toBe('13 нед 2 дн');
    expect(spokenGestation(13, 2)).toBe('13 недель 2 дня');
    expect(spokenGestation(21, 1)).toBe('21 неделя 1 день');
    expect(spokenGestation(0, 0)).toBe('0 недель 0 дней');
  });

  test('dueDateStatus', () => {
    expect(dueDateStatus(0)).toMatchObject({ text: 'ПДР — сегодня', level: 'info' });
    expect(dueDateStatus(-3)).toMatchObject({ text: 'ПДР прошла 3 дн назад', level: 'warning' });
    expect(dueDateStatus(-3).spoken).toMatch(/3 дня назад/);
    expect(dueDateStatus(21)).toMatchObject({ text: 'До ПДР 21 дн', level: null });
    expect(dueDateStatus(21).spoken).toMatch(/21 день$/);
  });

  test('spokenSummary', () => {
    const lmp = d(2026, 1, 1);
    const s = spokenSummary(calcPregnancy(lmp, addDays(lmp, 100)));
    expect(s).toMatch(/^Срок беременности 14 недель 2 дня, идёт 15-я неделя\./);
    expect(s).toMatch(/выкидыш/);
    expect(s).toMatch(/8 октября 2026 года$/);
    expect(spokenSummary(calcPregnancy(lmp, addDays(lmp, 320)))).toMatch(
      /^Внимание: срок больше 45 недель/,
    );
    expect(spokenSummary(null)).toBe('');
  });
});
