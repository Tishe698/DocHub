import group from '../antiarrhythmics_vasopressors';
import { isChoiceInput, ROUTES } from '../../routes';
import { computeResult, buildCopyText, searchFormulas } from '../../engine';

const byName = (start) => {
  const f = group.find((x) => x.name.startsWith(start));
  if (!f) throw new Error(`нет записи «${start}»`);
  return f;
};
const limitsOf = (f, clean) => (typeof f.limits === 'function' ? f.limits(clean) : f.limits || {});
const close = (a, b) => expect(a).toBeCloseTo(b, 6);
const numericKeys = (r) => Object.keys(r).filter((k) => typeof r[k] === 'number');

const proc = byName('Новокаинамид');
const propaf = byName('Пропанорм');
const phe = byName('Мезатон');

describe('контракт записей группы', () => {
  test('три препарата: общеизвестное название, затем МНН в скобках', () => {
    expect(group.map((f) => f.name)).toEqual([
      'Новокаинамид (прокаинамид)',
      'Пропанорм (пропафенон)',
      'Мезатон (фенилэфрин)',
    ]);
  });

  test.each(group.map((f) => [f.name, f]))('%s: поля записи', (_n, f) => {
    expect(f.description.length).toBeGreaterThan(20);
    // Все три — в укладках СМП по № 1165н и № 424н
    expect(f.description).toMatch(/1165н/);
    expect(f.description).toMatch(/424н/);
    expect(typeof f.formula).toBe('function');
    expect(Array.isArray(f.warnings)).toBe(true);
    expect(f.warnings.length).toBeGreaterThan(0);
    // Противопоказание до 18 лет — в предупреждениях
    expect(f.warnings[0]).toMatch(/До 18 лет противопоказан/);
    if (f.inputs.weight) expect(f.inputs.weight).toBe('Вес (кг)');
    if (f.inputs.ageYears) expect(f.inputs.ageYears).toBe('Возраст (лет)');
    expect(typeof f.limits === 'function' || typeof f.limits === 'object').toBe(true);
    // Подпись есть у каждой единицы
    Object.keys(f.units).forEach((k) => expect(f.labels[k]).toBeTruthy());
    // Пустой ввод — расчёт не выполняется
    expect(f.formula({})).toEqual({});
  });

  test('поля-выборы: пути только из routes, значение по умолчанию — из вариантов', () => {
    group.forEach((f) => {
      Object.values(f.inputs)
        .filter(isChoiceInput)
        .forEach((c) => {
          expect(c.choices.some((x) => x.value === c.default)).toBe(true);
          c.choices.forEach((x) => expect(x.label).toBe(ROUTES[x.value]));
        });
    });
    expect(propaf.inputs.route.choices.map((c) => c.value)).toEqual(['iv', 'po']);
    expect(phe.inputs.route.choices.map((c) => c.value)).toEqual(['iv', 'im', 'sc']);
    expect(proc.inputs.route).toBeUndefined();
  });

  test('единственный путь указан в подписи', () => {
    expect(proc.labels.result1).toMatch(/в\/в/);
    expect(proc.labels.result4).toMatch(/в\/в/);
  });

  test('дети и подростки до 18 лет — расчёт не выполняется', () => {
    [0, 5, 17.9].forEach((ageYears) => {
      expect(proc.formula({ weight: 40, ageYears })).toEqual({});
      expect(propaf.formula({ route: 'iv', weight: 40, ageYears })).toEqual({});
      expect(propaf.formula({ route: 'po', weight: 40, ageYears })).toEqual({});
      ['iv', 'im', 'sc'].forEach((route) => expect(phe.formula({ route, ageYears })).toEqual({}));
    });
  });

  test('возраст не указан — расчёт не выполняется', () => {
    expect(proc.formula({ weight: 70 })).toEqual({});
    expect(propaf.formula({ route: 'iv', weight: 70 })).toEqual({});
    expect(phe.formula({ route: 'iv' })).toEqual({});
  });

  test('нулевой вес — расчёт не выполняется', () => {
    expect(proc.formula({ weight: 0, ageYears: 40 })).toEqual({});
    expect(propaf.formula({ route: 'iv', weight: 0, ageYears: 40 })).toEqual({});
    expect(propaf.formula({ route: 'po', weight: 0, ageYears: 40 })).toEqual({});
  });

  test('синонимы для поиска', () => {
    const first = (q) => searchFormulas(group, q)[0].formula.name;
    expect(first('новокаинамид')).toBe(proc.name);
    expect(first('прокаинамид')).toBe(proc.name);
    expect(first('пропафенон')).toBe(propaf.name);
    expect(first('пропанорм')).toBe(propaf.name);
    expect(first('мезатон')).toBe(phe.name);
    expect(first('фенилэфрин')).toBe(phe.name);
    expect(first('стелфрин')).toBe(phe.name);
  });
});

describe('Новокаинамид (прокаинамид) — в/в насыщение', () => {
  const run = (weight, ageYears = 40) => proc.formula({ weight, ageYears });

  test('взрослый 70 кг: 100 мг каждые 5 мин, струйно до 500 мг, нагрузочная не более 1000 мг', () => {
    const r = run(70);
    expect(r.result1).toBe(100);
    close(r.result2, 1);
    expect(r.result3).toBe(500);
    expect(r.result4).toBe(1000);
    close(r.result5, 10);
    close(r.result6, 60); // 20 мг/мин при 20 мг/мл = 1 мл/мин
    expect(r.result7).toMatch(/не быстрее 50 мг\/мин/);
    expect(r.result7).toMatch(/10 мл \(1000 мг\) \+ 40 мл 0,9% NaCl = 20 мг\/мл/);
    expect(r.result7).toMatch(/АД, ЧСС и ЭКГ/);
    expect(r.result8).toMatch(/QRS > 25%/);
    expect(r.result8).toMatch(/QT > 500 мс/);
    expect(r.result9).toMatch(/1000 мг/);
  });

  test('предел по массе 17 мг/кг: 50 кг — 850 мг вместо 1000', () => {
    const r = run(50);
    close(r.result4, 850);
    close(r.result5, 8.5);
    expect(r.result3).toBe(500);
    expect(r.result9).toMatch(/предел по массе 17 мг\/кг = 850 мг/);
    expect(r.result7).toMatch(/не более 850 мг/);
  });

  test('граница 1000 мг: ровно 1000/17 кг и выше — предел 1000 мг', () => {
    const w = 1000 / 17;
    close(run(w).result4, 1000);
    expect(run(59).result4).toBe(1000);
    expect(run(250).result4).toBe(1000);
    expect(run(250).result9).toMatch(/^Максимальная нагрузочная доза 1000 мг/);
  });

  test('малая масса взрослого 25 кг: струйная сумма тоже ограничена 17 мг/кг', () => {
    const r = run(25);
    close(r.result4, 425);
    close(r.result3, 425);
    expect(r.result7).toMatch(/суммарной 425 мг/);
  });

  test('ровно 18 лет — расчёт выполняется', () => {
    expect(run(70, 18).result4).toBe(1000);
  });

  test('limits: струйно 500 мг, нагрузочная 1000 мг (10 мл)', () => {
    const lim = limitsOf(proc, {});
    expect(lim.result3.max).toBe(500);
    expect(lim.result4.max).toBe(1000);
    expect(lim.result5.max).toBe(10);
    const lim70 = limitsOf(proc, { weight: 70 });
    expect(lim70.result3.max).toBe(500);
    expect(lim70.result4.max).toBe(1000);
    expect(lim70.result5.max).toBe(10);
  });

  test('limits: предел по массе 17 мг/кг — 50 кг: 850 мг (8,5 мл); 25 кг: струйно тоже 425 мг', () => {
    const lim50 = limitsOf(proc, { weight: 50 });
    expect(lim50.result3.max).toBe(500);
    close(lim50.result4.max, 850);
    close(lim50.result5.max, 8.5);
    const lim25 = limitsOf(proc, { weight: 25 });
    close(lim25.result3.max, 425);
    close(lim25.result4.max, 425);
  });

  test('движок: 50 кг — нагрузочная 850 мг и объём 8,5 мл отмечены как предел', () => {
    const res = computeResult(proc, { weight: '50', ageYears: '40' });
    expect(res.success).toBe(true);
    const max = res.items.find((i) => i.key === 'result4');
    expect(max.text).toBe('850 мг');
    expect(max.status).toBe('atmax');
    expect(res.items.find((i) => i.key === 'result5').status).toBe('atmax');
    expect(res.items.find((i) => i.key === 'result3').status).toBe('atmax');
  });

  test('движок: предел отмечен, копия содержит форму выпуска и предупреждения', () => {
    const res = computeResult(proc, { weight: '80', ageYears: '50' });
    expect(res.success).toBe(true);
    const max = res.items.find((i) => i.key === 'result4');
    expect(max.text).toBe('1000 мг');
    expect(max.status).toBe('atmax');
    const copy = buildCopyText(res);
    expect(copy).toMatch(/Форма выпуска: Раствор 100 мг\/мл/);
    expect(copy).toMatch(/До 18 лет противопоказан/);
  });

  test('движок: ребёнок — информационный ответ с предупреждениями', () => {
    const res = computeResult(proc, { weight: '20', ageYears: '6' });
    expect(res.info).toBe(true);
    expect(res.warnings[0]).toMatch(/PALS 2020/);
  });
});

describe('Пропанорм (пропафенон)', () => {
  const iv = (weight, ageYears = 40) => propaf.formula({ route: 'iv', weight, ageYears });
  const po = (weight, ageYears = 40) => propaf.formula({ route: 'po', weight, ageYears });

  test('в/в, взрослый 70 кг: 1,5 мг/кг = 105 мг (30 мл), верхняя граница 2 мг/кг = 140 мг', () => {
    const r = iv(70);
    close(r.result1, 105);
    close(r.result2, 30);
    close(r.result3, 140);
    close(r.result4, 40);
    expect(r.result5).toMatch(/за 10 мин/);
    expect(r.result5).toMatch(/≈ 10,5 мг\/мин/);
    expect(r.result5).toMatch(/только 5% глюкозой/);
    expect(r.result6).toMatch(/90–120 мин/);
    expect(r.result6).toMatch(/560 мг в сутки/);
    expect(r.result7).toMatch(/3 амп\. на 105 мг/);
    expect(numericKeys(r).some((k) => Number(k.slice(6)) > 10)).toBe(false);
  });

  test('в/в, большая масса 250 кг: 375 мг и 500 мг — ниже суточного предела 560 мг', () => {
    const r = iv(250);
    close(r.result1, 375);
    close(r.result3, 500);
    expect(r.result7).not.toMatch(/предел 560/);
  });

  test('в/в, limits — суточный предел 560 мг', () => {
    const lim = limitsOf(propaf, { route: 'iv' });
    expect(lim.result1.max).toBe(560);
    expect(lim.result3.max).toBe(560);
  });

  test('внутрь, 70 кг и 40 лет: 600 мг — 4 таб. по 150 мг или 2 по 300 мг', () => {
    const r = po(70);
    expect(r.result11).toBe(600);
    close(r.result12, 4);
    close(r.result13, 2);
    expect(r.result14).toMatch(/однократно/);
    expect(r.result15).toMatch(/600 мг/);
    expect(numericKeys(r).every((k) => Number(k.slice(6)) > 10)).toBe(true);
  });

  test('внутрь, масса < 70 кг: 450 мг — 3 таб. по 150 мг, 300-мг таблетку не предлагает', () => {
    const r = po(69.9);
    expect(r.result11).toBe(450);
    close(r.result12, 3);
    expect(r.result13).toBeUndefined();
    expect(r.result15).toMatch(/450 мг/);
  });

  test('внутрь, возраст > 70 лет при массе 80 кг: 450 мг; ровно 70 лет — 600 мг', () => {
    expect(po(80, 71).result11).toBe(450);
    expect(po(80, 70).result11).toBe(600);
  });

  test('внутрь, limits — 600 мг', () => {
    expect(limitsOf(propaf, { route: 'po' }).result11.max).toBe(600);
  });

  test('движок: таблетки выводятся в штуках', () => {
    const res = computeResult(propaf, { route: 'po', weight: '75', ageYears: '45' });
    expect(res.success).toBe(true);
    expect(res.items.find((i) => i.key === 'result12').text).toBe('4 таб');
    expect(res.items.find((i) => i.key === 'result11').status).toBe('atmax');
  });
});

describe('Мезатон (фенилэфрин) — гипотензия', () => {
  const run = (route, ageYears = 40) => phe.formula({ route, ageYears });

  test('в/в: разово 1–5 мг (0,1–0,5 мл 1%), инфузия 180 → 30–60 мкг/мин', () => {
    const r = run('iv');
    expect(r.result1).toBe(1);
    close(r.result2, 0.1);
    expect(r.result3).toBe(5);
    close(r.result4, 0.5);
    expect(r.result5).toMatch(/в 20 мл/);
    expect(r.result5).toMatch(/не раньше чем через 15 мин/);
    // 10 мг / 250 мл = 40 мкг/мл: 180 мкг/мин = 270 мл/ч; 30–60 мкг/мин = 45–90 мл/ч
    close(r.result6, 270);
    close(r.result7, 45);
    close(r.result8, 90);
    expect(r.result9).toMatch(/≈ 90 кап\/мин/);
    expect(r.result9).toMatch(/≈ 15–30 кап\/мин/);
    expect(r.result10).toMatch(/25 мг в\/в в сутки/);
  });

  test('в/м и п/к: разово 3–10 мг (0,3–1 мл 1%), не более 50 мг в сутки', () => {
    ['im', 'sc'].forEach((route) => {
      const r = run(route);
      expect(r.result11).toBe(3);
      close(r.result12, 0.3);
      expect(r.result13).toBe(10);
      close(r.result14, 1);
      expect(r.result15).toMatch(new RegExp(`^${ROUTES[route]}`));
      expect(r.result15).toMatch(/50 мг в сутки/);
      expect(numericKeys(r).every((k) => Number(k.slice(6)) > 10)).toBe(true);
    });
  });

  test('limits: высшая разовая в/в 5 мг, в/м и п/к 10 мг', () => {
    expect(limitsOf(phe, { route: 'iv' }).result3.max).toBe(5);
    expect(limitsOf(phe, { route: 'iv' }).result4.max).toBe(0.5);
    expect(limitsOf(phe, { route: 'im' }).result13.max).toBe(10);
    expect(limitsOf(phe, { route: 'sc' }).result14.max).toBe(1);
  });

  test('движок: в/в — высшая разовая отмечена как предел, вес не нужен', () => {
    const res = computeResult(phe, { route: 'iv', ageYears: '60' });
    expect(res.success).toBe(true);
    expect(res.items.find((i) => i.key === 'result3').status).toBe('atmax');
    expect(res.items.find((i) => i.key === 'result6').text).toBe('270 мл/ч');
  });

  test('движок: подросток 16 лет — информационный ответ', () => {
    const res = computeResult(phe, { route: 'im', ageYears: '16' });
    expect(res.info).toBe(true);
  });
});
