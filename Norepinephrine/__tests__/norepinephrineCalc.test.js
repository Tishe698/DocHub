import {
  AMPOULE_ML,
  BASE_MG_PER_ML,
  DROP_FACTORS,
  NOREPI_LIMITS,
  TARTRATE_PER_BASE,
  calcNorepinephrine,
  echo,
  fmt,
  norepinephrineSummary,
} from '../norepinephrineCalc';

// Стандартное разведение по инструкции РФ: 2 мг / 50 мл и 20 мг + 480 мл = 40 мкг/мл основания
const STD = { drugMg: '2', syrVol: '50', bagMg: '20', bagDiluent: '480', dropFactor: 20 };
const calc = (over) => calcNorepinephrine({ weight: '70', dose: '0.1', ...STD, ...over });
const levels = (items) => items.map((w) => w.level);
const texts = (items) => items.map((w) => w.text).join(' ');

describe('константы препарата', () => {
  it('1 мл концентрата = 1 мг основания = 2 мг тартрата, ампула 4 мл', () => {
    expect(BASE_MG_PER_ML).toBe(1);
    expect(TARTRATE_PER_BASE).toBe(2);
    expect(AMPOULE_ML).toBe(4);
    expect(DROP_FACTORS).toEqual([20, 60]);
  });

  it('пределы после аудита не изменились', () => {
    expect(NOREPI_LIMITS).toMatchObject({
      weightMinKg: 0.4,
      weightMaxKg: 250,
      doseLowWarn: 0.01,
      doseSoftWarn: 1,
      doseMaxAdult: 2.5,
      doseMaxChild: 2,
      childWeightKg: 40,
      pumpMinMlh: 0.1,
      pumpLowMlh: 1,
      pumpHighMlh: 30,
      gttLow: 5,
      gttHigh: 60,
    });
  });
});

describe('доза', () => {
  it('70 кг × 0,1 мкг/кг/мин основания', () => {
    const r = calc();
    expect(r.ok).toBe(true);
    expect(r.dose.mcgMin).toBeCloseTo(7);
    expect(r.dose.mgH).toBeCloseTo(0.42);
    expect(r.dose.doseTartrate).toBeCloseTo(0.2);
    expect(r.dose.isChild).toBe(false);
    expect(r.dose.doseMax).toBe(2.5);
    expect(r.dose.warnings).toEqual([]);
  });

  it('взрослый: выше 2,5 — ограничение и ошибка', () => {
    const r = calc({ dose: '3' });
    expect(r.dose.Dcalc).toBe(2.5);
    expect(r.dose.capped).toBe(true);
    expect(r.dose.mcgMin).toBeCloseTo(175);
    expect(levels(r.dose.warnings)).toEqual(['error']);
    expect(texts(r.dose.warnings)).toMatch('2,5');
  });

  it('ребёнок по массе < 40 кг: предел 2 (PALS 2020)', () => {
    const r = calc({ weight: '20', dose: '2.5' });
    expect(r.dose.isChild).toBe(true);
    expect(r.dose.Dcalc).toBe(2);
    expect(texts(r.dose.warnings)).toMatch('масса < 40 кг');
    expect(calc({ weight: '39.9', dose: '2' }).dose.capped).toBe(false);
    expect(calc({ weight: '40', dose: '2.2' }).dose.capped).toBe(false); // взрослый предел 2,5
  });

  it('ребёнок по возрасту < 18 лет: детский предел и при массе ≥ 40 кг', () => {
    const r = calc({ weight: '70', dose: '2.2', ageMonths: 16 * 12 });
    expect(r.dose.isChild).toBe(true);
    expect(r.dose.Dcalc).toBe(2);
    expect(texts(r.dose.warnings)).toMatch('возраст < 18 лет');
    expect(calc({ weight: '70', dose: '2.2', ageMonths: 18 * 12 }).dose.isChild).toBe(false);
    expect(calc({ weight: '70', dose: '2.2', ageMonths: null }).dose.isChild).toBe(false);
  });

  it('мягкие предупреждения: > 1 и < 0,01', () => {
    expect(levels(calc({ dose: '1.5' }).dose.warnings)).toEqual(['warn']);
    expect(levels(calc({ dose: '1' }).dose.warnings)).toEqual([]);
    expect(texts(calc({ dose: '0.005' }).dose.warnings)).toMatch('Очень малая доза');
    expect(calc({ dose: '0.01' }).dose.warnings).toEqual([]);
  });
});

describe('шприцевой насос', () => {
  it('2 мг / 50 мл = 40 мкг/мл → 10,5 мл/ч при 70 кг и 0,1', () => {
    const s = calc().syringe;
    expect(s.ok).toBe(true);
    expect(s.conc).toBeCloseTo(40);
    expect(s.mlph).toBeCloseTo(10.5);
    expect(s.concMl).toBe(2);
    expect(s.diluentMl).toBe(48);
    expect(s.ampoules).toBeCloseTo(0.5);
    expect(s.tartrateMg).toBe(4);
    expect(s.hoursPerSyringe).toBeCloseTo(50 / 10.5);
    expect(s.warnings).toEqual([]);
  });

  it('ребёнок 20 кг, 0,1 мкг/кг/мин: 3 мл/ч', () => {
    expect(calc({ weight: '20' }).syringe.mlph).toBeCloseTo(3);
  });

  it('концентрата больше объёма — ошибка, без скорости', () => {
    const s = calc({ drugMg: '60', syrVol: '50' }).syringe;
    expect(s.ok).toBe(false);
    expect(s.mlph).toBeUndefined();
    expect(levels(s.warnings)).toEqual(['error']);
  });

  it('неразведённый концентрат — предупреждение', () => {
    const s = calc({ drugMg: '4', syrVol: '4' }).syringe;
    expect(s.ok).toBe(true);
    expect(texts(s.warnings)).toMatch('не разведён');
  });

  it('скорость ниже шага насоса, < 1 мл/ч и > 30 мл/ч', () => {
    const tiny = calc({ weight: '3', dose: '0.01' }).syringe; // 0,045 мл/ч
    expect(tiny.mlph).toBeCloseTo(0.045);
    expect(levels(tiny.warnings)).toEqual(['error']);
    const low = calc({ weight: '3', dose: '0.1' }).syringe; // 0,45 мл/ч
    expect(levels(low.warnings)).toEqual(['warn']);
    expect(texts(low.warnings)).toMatch('меньше 1 мл/ч');
    const high = calc({ weight: '100', dose: '1' }).syringe; // 150 мл/ч
    expect(high.mlph).toBeCloseTo(150);
    expect(texts(high.warnings)).toMatch('выше 30 мл/ч');
  });

  it('без мг или объёма шприц не считается', () => {
    expect(calc({ drugMg: '' }).syringe).toBeNull();
    expect(calc({ syrVol: '0' }).syringe).toBeNull();
  });
});

describe('капельница (пакет)', () => {
  it('20 мг + 480 мл = 500 мл, 40 мкг/мл; 10,5 мл/ч; 20 кап/мл → 3,5 кап/мин (неточно)', () => {
    const b = calc().bag;
    expect(b.ok).toBe(true);
    expect(b.total).toBe(500);
    expect(b.conc).toBeCloseTo(40);
    expect(b.mlph).toBeCloseTo(10.5);
    expect(b.gttExact).toBeCloseTo(3.5);
    expect(b.gtt).toBe(4);
    expect(b.F).toBe(20);
    expect(b.ampoules).toBe(5);
    expect(levels(b.warnings)).toEqual(['warn']);
    expect(texts(b.warnings)).toMatch('неточна');
  });

  it('60 кап/мл (микрокапельная): 10,5 кап/мин без предупреждения', () => {
    const b = calc({ dropFactor: 60 }).bag;
    expect(b.F).toBe(60);
    expect(b.gttExact).toBeCloseTo(10.5);
    expect(b.warnings).toEqual([]);
  });

  it('неизвестная система считается как 20 кап/мл', () => {
    expect(calc({ dropFactor: 15 }).bag.F).toBe(20);
    expect(calc({ dropFactor: '60' }).bag.F).toBe(60);
  });

  it('меньше 1 кап/мин и больше 60 кап/мин', () => {
    expect(texts(calc({ weight: '3', dose: '0.05' }).bag.warnings)).toMatch('Меньше 1');
    const many = calc({ weight: '100', dose: '1', dropFactor: 60 }).bag; // 150 кап/мин
    expect(many.gtt).toBe(150);
    expect(texts(many.warnings)).toMatch('много жидкости');
  });

  it('без мг или растворителя пакет не считается', () => {
    expect(calc({ bagMg: '' }).bag).toBeNull();
    expect(calc({ bagDiluent: '' }).bag).toBeNull();
  });
});

describe('проверки ввода', () => {
  it('масса обязательна и в диапазоне 0,4–250 кг', () => {
    const empty = calc({ weight: '' });
    expect(empty.ok).toBe(false);
    expect(empty.fieldErrors.weight).toMatch('Введите массу');
    expect(calc({ weight: '0.3' }).fieldErrors.weight).toMatch('0,4–250');
    expect(calc({ weight: '251' }).fieldErrors.weight).toMatch('251 кг');
    expect(calc({ weight: 'abc' }).ok).toBe(false);
    expect(calc({ weight: '-5' }).ok).toBe(false);
    expect(calc({ weight: '0.4' }).ok).toBe(true);
    expect(calc({ weight: '250' }).ok).toBe(true);
  });

  it('доза обязательна и > 0', () => {
    expect(calc({ dose: '' }).fieldErrors.dose).toMatch('Введите дозу');
    expect(calc({ dose: '0' }).ok).toBe(false);
    const both = calc({ weight: '', dose: '' });
    expect(both.errors).toHaveLength(2);
  });

  it('запятая, точка и числа', () => {
    expect(calc({ weight: '70,5' }).dose.mcgMin).toBeCloseTo(7.05);
    expect(calc({ weight: 70, dose: 0.1 }).syringe.mlph).toBeCloseTo(10.5);
    expect(calc({ weight: NaN }).ok).toBe(false);
    expect(calc({ dose: '1e-1' }).ok).toBe(false);
    expect(calc({ dose: '0x1' }).ok).toBe(false);
  });

  it('без аргументов не падает', () => {
    expect(calcNorepinephrine().ok).toBe(false);
  });
});

describe('форматирование и озвучка', () => {
  it('fmt: запятая, значащие цифры у малых значений', () => {
    expect(fmt(10.5)).toBe('10,5');
    expect(fmt(0.045)).toBe('0,045');
    expect(fmt(99.95)).toBe('100');
    expect(fmt(4.7619, 1)).toBe('4,8');
    expect(fmt(0)).toBe('0');
    expect(fmt(NaN)).toBe('—');
    expect(echo(1.5)).toBe('1,5');
  });

  it('итог для диктора', () => {
    const s = norepinephrineSummary(calc());
    expect(s).toBe(
      'Доза 7 микрограмм в минуту, шприцевой насос 10,5 миллилитра в час, капельница 10,5 миллилитра в час, 4 капли в минуту'
    );
    expect(norepinephrineSummary(calc({ weight: '20' }))).toMatch('шприцевой насос 3 миллилитра в час');
    expect(norepinephrineSummary(calc({ weight: '100', dose: '1', dropFactor: 60 }))).toMatch('150 капель в минуту');
    expect(norepinephrineSummary(calc({ weight: '3', dose: '0.05' }))).toMatch('меньше 1 капли в минуту');
    expect(norepinephrineSummary(calc({ dose: '3' }))).toMatch('ограничена максимумом 2,5');
    expect(norepinephrineSummary(calc({ weight: '' }))).toBe('');
  });
});
