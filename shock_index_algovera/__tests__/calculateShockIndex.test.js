import calculateShockIndex, {
  ageFieldErrors,
  calcSI,
  evaluateShockIndex,
  fmt,
  shockIndexSummary,
} from '../calculateShockIndex';

const TONES = ['success', 'warning', 'danger', 'neutral', 'info'];

describe('calcSI', () => {
  it('SI = пульс / САД, округление до сотых', () => {
    expect(calcSI(60, 120)).toBe(0.5);
    expect(calcSI(100, 110)).toBe(0.91);
    expect(calcSI(90, 100)).toBe(0.9);
  });

  it('отклоняет недопустимый и неправдоподобный ввод', () => {
    expect(() => calcSI(0, 120)).toThrow('Недопустимый пульс');
    expect(() => calcSI(NaN, 120)).toThrow('Недопустимый пульс');
    expect(() => calcSI(80, -1)).toThrow('Недопустимое САД');
    expect(() => calcSI(19, 120)).toThrow('Пульс вне диапазона');
    expect(() => calcSI(301, 120)).toThrow('Пульс вне диапазона');
    expect(() => calcSI(80, 29)).toThrow('САД вне диапазона');
    expect(() => calcSI(80, 301)).toThrow('САД вне диапазона');
    expect(calcSI(20, 300)).toBeCloseTo(0.07);
    expect(calcSI(300, 30)).toBe(10);
  });
});

describe('fmt', () => {
  it('десятичная запятая', () => {
    expect(fmt(1.2)).toBe('1,2');
    expect(fmt(0.9, 2)).toBe('0,90');
    expect(fmt(NaN)).toBe('—');
  });
});

describe('взрослые пороги', () => {
  const cat = (hr, sbp, extra = {}) => calculateShockIndex({ hr, sbp, ageYears: 40, ...extra });

  it('категории по SI', () => {
    expect(cat(55, 120).category).toMatchObject({ level: 0, tone: 'neutral' }); // 0,46
    expect(cat(60, 120).category).toMatchObject({ level: 1, label: 'норма', tone: 'success' }); // 0,5
    expect(cat(84, 120).category).toMatchObject({ level: 2, label: 'пограничный', tone: 'warning' }); // 0,7
    expect(cat(89, 100).category.level).toBe(2); // 0,89
    expect(cat(90, 100).category).toMatchObject({ level: 3, label: 'высокий риск шока', tone: 'danger' }); // 0,9
    expect(cat(129, 100).category.level).toBe(3); // 1,29
    expect(cat(130, 100).category).toMatchObject({ level: 4, tone: 'danger' }); // 1,3
  });

  it('режим adult, с 17 лет — взрослая шкала', () => {
    expect(cat(80, 120).mode).toBe('adult');
    expect(calculateShockIndex({ hr: 80, sbp: 120, ageYears: 17 }).mode).toBe('adult');
    expect(calculateShockIndex({ hr: 80, sbp: 120, ageYears: 17 }).thresholds.hypotensionSBP).toBeNull();
  });

  it('без возраста — взрослая шкала с предупреждением', () => {
    const r = calculateShockIndex({ hr: 80, sbp: 120 });
    expect(r.mode).toBe('adult_noage');
    expect(r.warnings.join(' ')).toMatch('Возраст не указан');
  });

  it('у категорий нет литералов цвета — только уровень темы', () => {
    for (const [hr, sbp] of [[55, 120], [60, 120], [84, 120], [90, 100], [130, 100]]) {
      const c = cat(hr, sbp).category;
      expect(c.color).toBeUndefined();
      expect(TONES).toContain(c.tone);
    }
  });
});

describe('кровопотеря (только взрослые)', () => {
  const loss = (hr, sbp) => calculateShockIndex({ hr, sbp, ageYears: 30 }).bloodLossHint;
  it('по таблице Альговера', () => {
    expect(loss(60, 120)).toBe('признаков нет'); // 0,5
    expect(loss(84, 120)).toMatch('10 %'); // 0,7
    expect(loss(90, 100)).toMatch('20 %'); // 0,9
    expect(loss(129, 100)).toMatch('20 %'); // 1,29
    expect(loss(130, 100)).toMatch('30 %'); // 1,3
    expect(loss(149, 100)).toMatch('30 %'); // 1,49
    expect(loss(150, 100)).toMatch('> 40 %'); // 1,5
  });

  it('у детей и до 1 года не выводится', () => {
    expect(calculateShockIndex({ hr: 160, sbp: 90, ageYears: 5 }).bloodLossHint).toBeNull();
    expect(calculateShockIndex({ hr: 160, sbp: 80, ageYears: 0.5 }).bloodLossHint).toBeNull();
  });
});

describe('SIPA по возрасту', () => {
  const sipa = (ageYears, hr, sbp, trauma = false) => calculateShockIndex({ hr, sbp, ageYears, trauma });

  it('пороги: 1–6 лет 1,2; 7–12 — 1,0; 13–16 — 0,9', () => {
    expect(sipa(1, 100, 100).pediatric.cutoff).toBe(1.2);
    expect(sipa(3, 100, 100).pediatric.cutoff).toBe(1.2);
    expect(sipa(4, 100, 100).pediatric.cutoff).toBe(1.2);
    expect(sipa(6.9, 100, 100).pediatric.cutoff).toBe(1.2);
    expect(sipa(7, 100, 100).pediatric.cutoff).toBe(1.0);
    expect(sipa(12.9, 100, 100).pediatric.cutoff).toBe(1.0);
    expect(sipa(13, 100, 100).pediatric.cutoff).toBe(0.9);
    expect(sipa(16.5, 100, 100).pediatric.cutoff).toBe(0.9);
    expect(sipa(16.5, 100, 100).mode).toBe('sipa');
  });

  it('превышен при SI строго больше порога', () => {
    const at = sipa(5, 120, 100); // 1,2 = порог
    expect(at.category).toMatchObject({ label: 'SIPA не превышен', tone: 'success' });
    const above = sipa(5, 121, 100); // 1,21
    expect(above.category).toMatchObject({ label: 'SIPA превышен', tone: 'danger' });
    expect(sipa(10, 101, 100).category.label).toBe('SIPA превышен');
    expect(sipa(14, 91, 100).category.label).toBe('SIPA превышен');
    expect(sipa(14, 90, 100).category.label).toBe('SIPA не превышен');
  });

  it('1–3 года: пометка о низкой специфичности; без травмы — «ориентир»', () => {
    const r = sipa(2, 120, 100);
    expect(r.notes.join(' ')).toMatch('малоспецифичен');
    expect(r.notes.join(' ')).toMatch('Без травмы');
    expect(sipa(8, 90, 100).notes.join(' ')).not.toMatch('малоспецифичен');
  });

  it('гипотензия по PALS 2020: 70 + 2 × возраст до 10 лет, далее 90', () => {
    expect(sipa(5, 100, 79).flags.hypotension).toBe(true); // порог 80
    expect(sipa(5, 100, 80).flags.hypotension).toBe(false);
    expect(sipa(5, 100, 80).thresholds.hypotensionSBP).toBe(80);
    expect(sipa(10, 100, 89).thresholds.hypotensionSBP).toBe(90);
    expect(sipa(12, 100, 89).flags.hypotension).toBe(true);
    expect(sipa(12, 100, 89).warnings.join(' ')).toMatch('гипотензия для возраста');
  });
});

describe('дети до 1 года', () => {
  it('SI не интерпретируется, флагов нет', () => {
    const r = calculateShockIndex({ hr: 160, sbp: 75, ageYears: 6 / 12, trauma: true });
    expect(r.mode).toBe('infant');
    expect(r.category).toMatchObject({ level: null, tone: 'neutral' });
    expect(r.category.label).toMatch('не интерпретируется');
    expect(r.pediatric).toBeNull();
    expect(r.flags.traumaHighRisk).toBe(false);
    expect(r.traumaLabel).toBeNull();
    expect(r.thresholds.traumaActionSI).toBeNull();
    expect(r.interpretation).toMatch('6 мес');
  });

  it('гипотензия: новорождённый < 60, 1–12 мес < 70', () => {
    expect(calculateShockIndex({ hr: 140, sbp: 59, ageYears: 0 }).flags.hypotension).toBe(true);
    expect(calculateShockIndex({ hr: 140, sbp: 60, ageYears: 0 }).flags.hypotension).toBe(false);
    expect(calculateShockIndex({ hr: 140, sbp: 69, ageYears: 3 / 12 }).flags.hypotension).toBe(true);
    expect(calculateShockIndex({ hr: 140, sbp: 70, ageYears: 3 / 12 }).flags.hypotension).toBe(false);
    expect(calculateShockIndex({ hr: 140, sbp: 70, ageYears: 0 }).interpretation).toMatch('до 1 мес');
  });
});

describe('беременность / послеродовой период', () => {
  const preg = (hr, sbp, extra = {}) => calculateShockIndex({ hr, sbp, ageYears: 28, pregnant: true, ...extra });

  it('пороги КР МЗ РФ 2021 и CRADLE', () => {
    expect(preg(80, 110).category).toMatchObject({ level: 1, tone: 'success' }); // 0,73
    expect(preg(89, 100).category.level).toBe(1); // 0,89
    expect(preg(90, 100).category).toMatchObject({ level: 2, tone: 'warning' }); // 0,9
    expect(preg(100, 100).category).toMatchObject({ level: 3, tone: 'danger' }); // 1,0
    expect(preg(169, 100).category.level).toBe(3); // 1,69
    expect(preg(170, 100).category).toMatchObject({ level: 4, tone: 'danger' }); // 1,7
  });

  it('флаг SI ≥ 1,0 и словесная кровопотеря без % ОЦК', () => {
    expect(preg(99, 100).flags.pregnancyConcern).toBe(false);
    expect(preg(100, 100).flags.pregnancyConcern).toBe(true);
    expect(preg(100, 100).bloodLossHint).toBe('вероятна значимая, оцените объём');
    expect(preg(170, 100).bloodLossHint).toBe('вероятна массивная');
    expect(preg(80, 110).bloodLossHint).toBe('признаков нет');
    expect(preg(95, 100).bloodLossHint).toBe('возможна');
    expect(preg(150, 100).bloodLossHint).not.toMatch('%');
  });

  it('беременность важнее SIPA у подростка; < 10 лет — ошибка ввода', () => {
    expect(calculateShockIndex({ hr: 100, sbp: 100, ageYears: 15, pregnant: true }).mode).toBe('pregnancy');
    expect(() => calculateShockIndex({ hr: 100, sbp: 100, ageYears: 9, pregnant: true })).toThrow('беременность');
  });
});

describe('травма', () => {
  it('взрослые и беременные: SI ≥ 0,9', () => {
    expect(calculateShockIndex({ hr: 89, sbp: 100, ageYears: 30, trauma: true }).flags.traumaHighRisk).toBe(false);
    const r = calculateShockIndex({ hr: 90, sbp: 100, ageYears: 30, trauma: true });
    expect(r.flags.traumaHighRisk).toBe(true);
    expect(r.traumaLabel).toBe('Травма: SI ≥ 0,9');
    expect(r.thresholds.traumaActionSI).toBe(0.9);
    expect(calculateShockIndex({ hr: 90, sbp: 100, ageYears: 30, trauma: true, pregnant: true }).flags.traumaHighRisk).toBe(
      true
    );
  });

  it('дети: SI > порога SIPA', () => {
    const at = calculateShockIndex({ hr: 100, sbp: 100, ageYears: 8, trauma: true });
    expect(at.flags.traumaHighRisk).toBe(false);
    const above = calculateShockIndex({ hr: 101, sbp: 100, ageYears: 8, trauma: true });
    expect(above.flags.traumaHighRisk).toBe(true);
    expect(above.traumaLabel).toBe('Травма: SI > порога SIPA (1,0)');
    expect(above.interpretation).toMatch('тяжёлая травма');
    expect(above.thresholds.traumaActionSI).toBe(1.0);
  });

  it('без отметки травмы флага нет', () => {
    expect(calculateShockIndex({ hr: 150, sbp: 100, ageYears: 30 }).flags.traumaHighRisk).toBe(false);
  });
});

describe('проверка возраста', () => {
  it('вне 0–120 лет — ошибка', () => {
    expect(() => calculateShockIndex({ hr: 80, sbp: 120, ageYears: -1 })).toThrow('Недопустимый возраст');
    expect(() => calculateShockIndex({ hr: 80, sbp: 120, ageYears: 121 })).toThrow('Недопустимый возраст');
  });

  it('ageFieldErrors: месяцев 0–11 при указанных годах', () => {
    expect(ageFieldErrors('', '')).toEqual({ years: null, months: null });
    expect(ageFieldErrors('5', '3')).toEqual({ years: null, months: null });
    expect(ageFieldErrors('', '14')).toEqual({ years: null, months: null });
    expect(ageFieldErrors('5', '12').months).toMatch('0–11');
    expect(ageFieldErrors('abc', '').years).toMatch('Недопустимый');
    expect(ageFieldErrors('', 'x').months).toMatch('Недопустимый');
    expect(ageFieldErrors('-2', '').years).toMatch('Недопустимый');
    expect(ageFieldErrors('130', '').years).toMatch('120');
  });
});

describe('evaluateShockIndex (ввод экрана)', () => {
  it('пустые поля — status empty', () => {
    expect(evaluateShockIndex({ hrText: '', sbpText: '' }).status).toBe('empty');
    expect(evaluateShockIndex({ hrText: '80', sbpText: ' ' }).status).toBe('empty');
  });

  it('ошибки полей', () => {
    const r = evaluateShockIndex({ hrText: 'abc', sbpText: '400' });
    expect(r.status).toBe('error');
    expect(r.fieldErrors.hr).toMatch('числом');
    expect(r.fieldErrors.sbp).toMatch('30–300');
    expect(evaluateShockIndex({ hrText: '-5', sbpText: '120' }).fieldErrors.hr).toMatch('числом');
    expect(evaluateShockIndex({ hrText: '10', sbpText: '120' }).fieldErrors.hr).toMatch('20–300');
  });

  it('ошибка возраста блокирует расчёт', () => {
    const r = evaluateShockIndex({ hrText: '80', sbpText: '120', ageInvalid: true });
    expect(r.status).toBe('error');
    expect(r.result).toBeNull();
  });

  it('возраст из пациента в месяцах; запятая в числе', () => {
    const child = evaluateShockIndex({ hrText: '130', sbpText: '100', ageMonths: 63 });
    expect(child.status).toBe('ok');
    expect(child.result.mode).toBe('sipa');
    expect(child.result.pediatric.cutoff).toBe(1.2);
    const infant = evaluateShockIndex({ hrText: '150', sbpText: '80', ageMonths: 0 });
    expect(infant.result.mode).toBe('infant');
    const adult = evaluateShockIndex({ hrText: '90,6', sbpText: '100', ageMonths: 40 * 12 });
    expect(adult.result.si).toBe(0.91);
    expect(evaluateShockIndex({ hrText: '90', sbpText: '100', ageMonths: null }).result.mode).toBe('adult_noage');
  });

  it('ошибка расчёта превращается в status error', () => {
    const r = evaluateShockIndex({ hrText: '100', sbpText: '100', ageMonths: 60, pregnant: true });
    expect(r.status).toBe('error');
    expect(r.error).toMatch('беременность');
  });
});

describe('shockIndexSummary', () => {
  it('итог одной строкой', () => {
    const r = calculateShockIndex({ hr: 150, sbp: 100, ageYears: 30, trauma: true });
    const s = shockIndexSummary(r);
    expect(s).toMatch('Шоковый индекс 1,50');
    expect(s).toMatch('тяжёлый');
    expect(s).toMatch('Травма');
    expect(s).toMatch('40 %');
    expect(shockIndexSummary(null)).toBe('');
  });
});
