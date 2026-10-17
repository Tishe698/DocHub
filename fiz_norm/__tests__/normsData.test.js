import {
  ADULT_MONTHS,
  NORMS,
  ageBadge,
  ageMatchNote,
  ageSpoken,
  hypotensionSbp,
  normByMonths,
  normForAge,
  normMetrics,
  plural,
  spokenValue,
} from '../normsData';

const RANGE = /^\d+–\d+$/;
const VALUE = /^\d+(–\d+)?$/;
const BP = /^(\d+)\/(\d+)$/;
const BP_RANGE = /^(\d+)–(\d+) \/ (\d+)–(\d+)$/;
const range = (s) => s.split('–').map(Number);

// Эталон таблицы (перенесена без изменений из экрана, значения ветки fix/clinical-audit)
const EXPECTED = [
  [
    'Новорожденные',
    0,
    '3,5',
    '50',
    '40–60',
    '30–60',
    '130–140',
    '100–205',
    '70/40',
    '60–84 / 31–53',
  ],
  ['3 мес', 3, '5,5–6', '60–62', '35–40', '30–53', '120–130', '100–180', '85/40', '72–104 / 37–56'],
  ['6 мес', 6, '7', '67', '33–35', '30–53', '120–125', '100–180', '95/55', '72–104 / 37–56'],
  ['1 год', 12, '10', '75', '30–32', '22–37', '120', '98–140', '92/56', '86–106 / 42–63'],
  ['2 года', 24, '12', '87', '26–30', '22–37', '110–115', '98–140', '94/56', '86–106 / 42–63'],
  ['3 года', 36, '14', '95', '26–28', '20–28', '105–110', '80–120', '96/56', '89–112 / 46–72'],
  ['4 года', 48, '16', '101', '26', '20–28', '100–105', '80–120', '98/56', '89–112 / 46–72'],
  ['5 лет', 60, '19', '109', '25–26', '20–28', '100', '80–120', '100/58', '89–112 / 46–72'],
  ['6 лет', 72, '20', '115', '25', '18–25', '90–95', '75–118', '100/60', '97–115 / 57–76'],
  ['8 лет', 96, '25', '129', '22–24', '18–25', '80–85', '75–118', '105/70', '97–115 / 57–76'],
  ['10 лет', 120, '30', '140', '20–22', '18–25', '78–82', '75–118', '105/70', '102–120 / 61–80'],
  ['12 лет', 144, '40–42', '151', '18–20', '12–20', '75–82', '60–100', '110/70', '110–131 / 64–83'],
  ['14 лет', 168, '50', '161', '16–20', '12–20', '72–78', '60–100', '120/70', '110–131 / 64–83'],
];

describe('NORMS — таблица', () => {
  test('все строки совпадают с эталоном', () => {
    expect(NORMS).toHaveLength(EXPECTED.length);
    NORMS.forEach((n, i) => {
      const [label, months, weight, height, rr, rrRange, hr, hrRange, bp, bpRange] = EXPECTED[i];
      expect(n).toMatchObject({
        label,
        months,
        weight,
        height,
        rr,
        rrRange,
        hr,
        hrRange,
        bp,
        bpRange,
      });
    });
  });

  test('таблица заморожена', () => {
    expect(Object.isFrozen(NORMS)).toBe(true);
    NORMS.forEach((n) => expect(Object.isFrozen(n)).toBe(true));
  });

  test('возраст строк растёт и не повторяется', () => {
    for (let i = 1; i < NORMS.length; i++)
      expect(NORMS[i].months).toBeGreaterThan(NORMS[i - 1].months);
  });

  test.each(NORMS.map((n) => [n.label, n]))('%s: формат значений', (_, n) => {
    expect(n.rr).toMatch(VALUE);
    expect(n.hr).toMatch(VALUE);
    expect(n.rrRange).toMatch(RANGE);
    expect(n.hrRange).toMatch(RANGE);
    expect(n.bp).toMatch(BP);
    expect(n.bpRange).toMatch(BP_RANGE);
    expect(n.weight).toMatch(/^\d+(,\d+)?(–\d+)?$/);
    expect(n.height).toMatch(/^\d+(–\d+)?$/);
  });

  test.each(NORMS.map((n) => [n.label, n]))(
    '%s: средние значения внутри границ нормы PALS',
    (_, n) => {
      const [rrLo, rrHi] = range(n.rrRange);
      range(n.rr).forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(rrLo);
        expect(v).toBeLessThanOrEqual(rrHi);
      });
      const [hrLo, hrHi] = range(n.hrRange);
      range(n.hr).forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(hrLo);
        expect(v).toBeLessThanOrEqual(hrHi);
      });
      const [, sys, dia] = n.bp.match(BP).map(Number);
      const [, sLo, sHi, dLo, dHi] = n.bpRange.match(BP_RANGE).map(Number);
      expect(sys).toBeGreaterThanOrEqual(sLo);
      expect(sys).toBeLessThanOrEqual(sHi);
      expect(dia).toBeGreaterThanOrEqual(dLo);
      expect(dia).toBeLessThanOrEqual(dHi);
    },
  );

  test.each(NORMS.map((n) => [n.label, n]))(
    '%s: порог гипотензии не выше нижней границы САД',
    (_, n) => {
      const [, sLo] = n.bpRange.match(BP_RANGE).map(Number);
      expect(hypotensionSbp(n.months)).toBeLessThanOrEqual(sLo);
    },
  );
});

describe('подписи возраста', () => {
  test('подпись строки (кроме новорождённых) совпадает с ageBadge', () => {
    NORMS.filter((n) => n.months > 0).forEach((n) => expect(n.label).toBe(ageBadge(n.months)));
  });

  test.each([
    [0, 'до 28 дней'],
    [3, '3 мес'],
    [6, '6 мес'],
    [12, '1 год'],
    [24, '2 года'],
    [36, '3 года'],
    [48, '4 года'],
    [60, '5 лет'],
    [72, '6 лет'],
    [96, '8 лет'],
    [120, '10 лет'],
    [144, '12 лет'],
    [168, '14 лет'],
    [252, '21 год'],
  ])('ageBadge(%i) = %s', (m, s) => expect(ageBadge(m)).toBe(s));

  test.each([
    [0, 'новорождённые, до 28 дней'],
    [1, '1 месяц'],
    [3, '3 месяца'],
    [6, '6 месяцев'],
    [12, '1 год'],
    [60, '5 лет'],
  ])('ageSpoken(%i) = %s', (m, s) => expect(ageSpoken(m)).toBe(s));

  test('склонение', () => {
    expect(plural(1, 'год', 'года', 'лет')).toBe('год');
    expect(plural(3, 'год', 'года', 'лет')).toBe('года');
    expect(plural(11, 'год', 'года', 'лет')).toBe('лет');
    expect(plural(14, 'год', 'года', 'лет')).toBe('лет');
    expect(plural(22, 'год', 'года', 'лет')).toBe('года');
  });
});

describe('hypotensionSbp — PALS', () => {
  test.each([
    [0, 60],
    [1, 70],
    [11, 70],
    [12, 72],
    [23, 72],
    [60, 80],
    [84, 84],
    [120, 90],
    [121, 90],
    [200, 90],
  ])('%i мес → САД < %i', (m, sbp) => expect(hypotensionSbp(m)).toBe(sbp));
});

describe('normForAge — автоматический выбор строки', () => {
  test('диапазоны строк непрерывно покрывают 0–215 мес без пересечений', () => {
    expect(NORMS[0].autoFrom).toBe(0);
    for (let i = 1; i < NORMS.length; i++) expect(NORMS[i].autoFrom).toBe(NORMS[i - 1].autoTo + 1);
    expect(NORMS[NORMS.length - 1].autoTo).toBe(ADULT_MONTHS - 1);
    NORMS.forEach((n) => expect(n.months).toBeGreaterThanOrEqual(n.autoFrom));
  });

  test('каждый месяц 0–215 даёт ровно одну строку, не старше пациента (кроме 1–2 мес)', () => {
    for (let m = 0; m < ADULT_MONTHS; m++) {
      const n = normForAge(m);
      expect(n).not.toBeNull();
      if (m >= 3) expect(n.months).toBeLessThanOrEqual(m);
    }
  });

  test.each([
    [0, 'Новорожденные'],
    [1, '3 мес'],
    [2, '3 мес'],
    [3, '3 мес'],
    [5, '3 мес'],
    [6, '6 мес'],
    [11, '6 мес'],
    [12, '1 год'],
    [18, '1 год'],
    [24, '2 года'],
    [35, '2 года'],
    [36, '3 года'],
    [63, '5 лет'],
    [84, '6 лет'],
    [95, '6 лет'],
    [96, '8 лет'],
    [119, '8 лет'],
    [120, '10 лет'],
    [144, '12 лет'],
    [168, '14 лет'],
    [215, '14 лет'],
  ])('%i мес → %s', (m, label) => expect(normForAge(m).label).toBe(label));

  test('дробный возраст округляется вниз', () => {
    expect(normForAge(11.9).label).toBe('6 мес');
  });

  test.each([[null], [undefined], [-1], [NaN], ['12'], [216], [300]])('%p → null', (v) => {
    expect(normForAge(v)).toBeNull();
  });

  test('normByMonths', () => {
    expect(normByMonths(60).label).toBe('5 лет');
    expect(normByMonths(7)).toBeNull();
  });
});

describe('ageMatchNote', () => {
  test('без пояснений до 15 лет', () => {
    expect(ageMatchNote(null)).toBeNull();
    expect(ageMatchNote(0)).toBeNull();
    expect(ageMatchNote(179)).toBeNull();
  });
  test('15–17 лет — строка 14 лет ориентировочно', () => {
    expect(ageMatchNote(180)).toMatch(/14 лет/);
    expect(ageMatchNote(215)).toMatch(/ориентировочно/);
  });
  test('18 лет и старше — таблица не применяется', () => {
    expect(ageMatchNote(216)).toMatch(/не применяется/);
  });
});

describe('подписи для диктора', () => {
  test('spokenValue', () => {
    expect(spokenValue('40–60')).toBe('от 40 до 60');
    expect(spokenValue('120')).toBe('120');
    expect(spokenValue('5,5–6')).toBe('от 5,5 до 6');
    expect(spokenValue('70/40')).toBe('70 на 40');
    expect(spokenValue('60–84 / 31–53')).toBe(
      'систолическое от 60 до 84, диастолическое от 31 до 53',
    );
  });

  test('normMetrics: пять показателей с видимым текстом и подписью для диктора без тире', () => {
    NORMS.forEach((n) => {
      const ms = normMetrics(n);
      expect(ms.map((m) => m.key)).toEqual(['weight', 'height', 'rr', 'hr', 'bp']);
      ms.forEach((m) => {
        expect(m.label).toBeTruthy();
        expect(m.value).toBeTruthy();
        expect(m.spoken).not.toMatch(/–/);
      });
    });
    expect(normMetrics(null)).toEqual([]);
  });

  test('normMetrics: значения строки 5 лет', () => {
    const ms = normMetrics(normByMonths(60));
    expect(ms[0].value).toBe('19 кг');
    expect(ms[2]).toMatchObject({ value: '25–26 в мин', range: 'норма 20–28' });
    expect(ms[3].range).toBe('норма 80–120 (бодрствование)');
    expect(ms[4]).toMatchObject({ value: '100/58 мм рт. ст.', range: 'норма 89–112 / 46–72' });
  });
});
