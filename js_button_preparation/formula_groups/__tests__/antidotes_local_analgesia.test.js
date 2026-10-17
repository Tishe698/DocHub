import group from '../antidotes_local_analgesia';
import { isChoiceInput, ROUTES } from '../../routes';
import { computeResult, buildCopyText, searchFormulas, isReferenceOnly } from '../../engine';

const byName = (start) => {
  const f = group.find((x) => x.name.startsWith(start));
  if (!f) throw new Error(`нет записи «${start}»`);
  return f;
};
const limitsOf = (f, clean) => (typeof f.limits === 'function' ? f.limits(clean) : f.limits || {});
const close = (a, b) => expect(a).toBeCloseTo(b, 6);
const numericKeys = (r) => Object.keys(r).filter((k) => typeof r[k] === 'number');

const ethanol = byName('Этиловый спирт');
const protamine = byName('Протамина сульфат');
const acyzol = byName('Ацизол');
const galantamine = byName('Галантамин');
const carboxim = byName('Карбоксим');
const n2o = byName('Закись азота');
const ketonal = byName('Кетонал');
const procaine = byName('Новокаин');

describe('контракт записей группы', () => {
  test('восемь препаратов в порядке спецификации, название — привычное, затем МНН', () => {
    expect(group.map((f) => f.name)).toEqual([
      'Этиловый спирт (этанол) — отравление метанолом, этиленгликолем',
      'Протамина сульфат',
      'Ацизол (цинка бисвинилимидазола диацетат)',
      'Галантамин — отравление холинолитиками',
      'Карбоксим',
      'Закись азота (динитрогена оксид)',
      'Кетонал (кетопрофен)',
      'Новокаин (прокаин)',
    ]);
  });

  test.each(group.map((f) => [f.name, f]))('%s: поля записи', (_n, f) => {
    expect(f.description.length).toBeGreaterThan(20);
    expect(typeof f.formula).toBe('function');
    expect(Array.isArray(f.warnings)).toBe(true);
    expect(f.warnings.length).toBeGreaterThan(0);
    if (f.inputs.weight) expect(f.inputs.weight).toBe('Вес (кг)');
    if (f.inputs.ageYears) expect(f.inputs.ageYears).toBe('Возраст (лет)');
    if (f !== galantamine) {
      expect(typeof f.limits === 'function' || typeof f.limits === 'object').toBe(true);
      Object.keys(f.units).forEach((k) => expect(f.labels[k]).toBeTruthy());
    }
    // Пустой ввод — расчёт не выполняется
    expect(f.formula({})).toEqual({});
  });

  test('поля-выборы: значение по умолчанию — из вариантов, пути — из routes', () => {
    group.forEach((f) => {
      Object.values(f.inputs)
        .filter(isChoiceInput)
        .forEach((c) => expect(c.choices.some((x) => x.value === c.default)).toBe(true));
    });
    expect(ketonal.inputs.route.choices.map((c) => c.value)).toEqual(['im', 'iv']);
    expect(procaine.inputs.route.choices.map((c) => c.value)).toEqual(['local']);
    [...ketonal.inputs.route.choices, ...procaine.inputs.route.choices].forEach((c) =>
      expect(c.label).toBe(ROUTES[c.value]),
    );
    expect(ethanol.inputs.solution.choices.map((c) => c.value)).toEqual([
      'iv10',
      'iv5',
      'po40',
      'po20',
      'po10',
      'po5',
    ]);
    ethanol.inputs.solution.choices.forEach((c) =>
      expect(c.label.endsWith(`— ${ROUTES[c.value.slice(0, 2)]}`)).toBe(true),
    );
    expect(protamine.inputs.scenario.choices.map((c) => c.value)).toEqual([
      'iv-30',
      'iv-60',
      'iv-2h',
      'sc',
      'infusion',
      'lmwh-8',
      'lmwh-12',
    ]);
    expect(procaine.inputs.solution.choices.map((c) => c.value)).toEqual(['0.25', '0.5', '2']);
  });

  test('укладки СМП упомянуты в описании', () => {
    // Карбоксим и цинка бисвинилимидазола диацетат — в обеих укладках по 1165н (ред. 13.04.2023) и 424н
    [carboxim, acyzol].forEach((f) => {
      expect(f.description).toMatch(/№ 1165н.*№ 424н/);
      expect(f.description).toMatch(/реанимационн/);
      expect(f.description).not.toMatch(/исключён|нет/);
    });
    expect(carboxim.warnings.join(' ')).not.toMatch(/424н/);
    [galantamine, n2o, ketonal, procaine].forEach((f) => {
      expect(f.description).toMatch(/1165н/);
      expect(f.description).toMatch(/424н/);
    });
  });

  test('неизвестное значение выбора — расчёт не выполняется', () => {
    expect(ethanol.formula({ solution: 'x', weight: 70, ageYears: 40 })).toEqual({});
    expect(protamine.formula({ scenario: 'x', heparin: 5000, ageYears: 40 })).toEqual({});
    expect(acyzol.formula({ indication: 'x', ageYears: 40 })).toEqual({});
    expect(carboxim.formula({ severity: 'x', ageYears: 40 })).toEqual({});
    expect(n2o.formula({ indication: 'x' })).toEqual({});
    expect(ketonal.formula({ route: 'sc', ageYears: 40 })).toEqual({});
    expect(procaine.formula({ solution: '1', weight: 70, ageYears: 40 })).toEqual({});
  });

  test('синонимы для поиска', () => {
    const first = (q) => searchFormulas(group, q)[0].formula.name;
    expect(first('этанол')).toBe(ethanol.name);
    expect(first('метанол')).toBe(ethanol.name);
    expect(first('протамин')).toBe(protamine.name);
    expect(first('цинказол')).toBe(acyzol.name);
    expect(first('нивалин')).toBe(galantamine.name);
    expect(first('карбоксим')).toBe(carboxim.name);
    expect(first('динитрогена')).toBe(n2o.name);
    expect(first('кетопрофен')).toBe(ketonal.name);
    expect(first('прокаин')).toBe(procaine.name);
    expect(first('новокаин')).toBe(procaine.name);
  });
});

describe('Этанол — антидот метанола и этиленгликоля', () => {
  const run = (weight, ageYears, solution = 'iv10', dialysis = 'no') =>
    ethanol.formula({ solution, dialysis, weight, ageYears });

  test('взрослый 70 кг, 10% в/в без диализа: 7,5 мл/кг, затем 1–2 мл/кг/ч', () => {
    const r = run(70, 40);
    close(r.result1, 525);
    close(r.result2, 70);
    close(r.result3, 140);
    expect(r.result4).toMatch(/^в\/в/);
    expect(r.result5).toMatch(/1–2 г\/л/);
    expect(r.result5).toMatch(/0,59 г\/кг/);
  });

  test('10% в/в на фоне гемодиализа: 2–3,5 мл/кг/ч', () => {
    const r = run(70, 40, 'iv10', 'yes');
    close(r.result1, 525);
    close(r.result2, 140);
    close(r.result3, 245);
    expect(r.result5).toMatch(/гемодиализа/);
  });

  test('5% в/в: 15 мл/кг, 2–4 и 4–7 мл/кг/ч', () => {
    close(run(80, 40, 'iv5').result1, 1200);
    close(run(80, 40, 'iv5').result3, 320);
    close(run(80, 40, 'iv5', 'yes').result3, 560);
  });

  test('внутрь — одна скорость без диапазона, все концентрации табл. 1', () => {
    const r40 = run(70, 40, 'po40');
    close(r40.result1, 140);
    close(r40.result2, 17.5);
    expect(r40.result3).toBeUndefined();
    expect(r40.result4).toMatch(/^внутрь/);
    close(run(70, 40, 'po40', 'yes').result2, 35);
    close(run(70, 40, 'po20').result1, 280);
    close(run(70, 40, 'po20').result2, 35);
    close(run(70, 40, 'po10').result1, 525);
    close(run(70, 40, 'po10', 'yes').result2, 140);
    close(run(70, 40, 'po5').result1, 1050);
    close(run(70, 40, 'po5').result2, 140);
  });

  test('нагрузочная ≈ 0,6 г/кг этанола во всех вариантах таблицы', () => {
    ethanol.inputs.solution.choices.forEach((c) => {
      const r = run(70, 40, c.value);
      const g = Number(r.result5.match(/≈ ([\d,]+) г\/кг/)[1].replace(',', '.'));
      expect(g).toBeGreaterThanOrEqual(0.55);
      expect(g).toBeLessThanOrEqual(0.65);
    });
  });

  test('границы: 18 лет — считается, 17 лет и дети — нет; нулевой вес — нет', () => {
    expect(run(60, 18).result1).toBeCloseTo(450, 6);
    expect(run(60, 17)).toEqual({});
    expect(run(15, 3)).toEqual({});
    expect(run(3.5, 0)).toEqual({});
    expect(run(0, 40)).toEqual({});
    expect(run(70, undefined)).toEqual({});
  });

  test('предупреждения: не на СМП, детям — токсиколог', () => {
    expect(ethanol.warnings[0]).toMatch(/На СМП этанол не вводить/);
    expect(ethanol.warnings.join(' ')).toMatch(/Детям таблицы доз нет/);
    expect(limitsOf(ethanol, {})).toEqual({});
  });
});

describe('Протамина сульфат', () => {
  const run = (heparin, scenario = 'iv-30', ageYears = 40) =>
    protamine.formula({ scenario, heparin, ageYears });

  test('3000 ЕД болюс до 30 мин: 1 мг на 100 ЕД = 30 мг, 3 мл', () => {
    const r = run(3000);
    close(r.result1, 30);
    close(r.result2, 3);
    expect(r.result3).toMatch(/30–45 мг/);
    expect(r.result4).toMatch(/1 мл \(10 мг\) за 3 мин/);
  });

  test('30–60 мин и ≥ 2 ч: меньше доза', () => {
    close(run(5000, 'iv-60').result1, 25);
    close(run(5000, 'iv-2h').result1, 12.5);
    expect(run(5000, 'iv-2h').result3).toMatch(/12,5–18,8 мг/);
  });

  test('п/к гепарин: 1,2 мг на 100 ЕД', () => {
    close(run(2500, 'sc').result1, 30);
  });

  test('максимум 50 мг за 10 мин: 10 000 ЕД', () => {
    const r = run(10000);
    expect(r.result1).toBe(50);
    close(r.result2, 5);
    expect(r.result5).toMatch(/предел 50 мг за 10 мин/);
    expect(r.result5).toMatch(/150 мг за 1 ч/);
    expect(limitsOf(protamine, {}).result1.max).toBe(50);
  });

  test('ровно на пределе: 5000 ЕД — 50 мг без примечания о пределе', () => {
    const r = run(5000);
    expect(r.result1).toBe(50);
    expect(r.result5).not.toMatch(/предел/);
  });

  test('инфузия гепарина: 25 мг независимо от введённого', () => {
    const r = run(1, 'infusion');
    expect(r.result1).toBe(25);
    close(r.result2, 2.5);
    expect(r.result3).toMatch(/25–30 мг/);
  });

  test('НМГ: 1 мг на 100 МЕ анти-Xa, через 8–12 ч — половина', () => {
    close(run(8000, 'lmwh-8').result1, 50);
    close(run(4000, 'lmwh-8').result1, 40);
    close(run(4000, 'lmwh-12').result1, 20);
    expect(run(4000, 'lmwh-8').result5).toMatch(/60%/);
    expect(run(4000, 'lmwh-8').result5).toMatch(/1 мг эноксапарина = 100 МЕ/);
    expect(run(4000, 'lmwh-8').result5).not.toMatch(/если это мг/);
  });

  test('НМГ введён в мг вместо МЕ: подсказка в примечании и мягкое предупреждение ввода', () => {
    expect(protamine.inputs.heparin).toMatch(/МЕ анти-Xa/);
    expect(run(80, 'lmwh-8').result5).toMatch(/если это мг эноксапарина, введите 8000 МЕ/);
    const res = computeResult(
      protamine,
      { scenario: 'lmwh-8', heparin: '80' },
      { age: { years: '40', months: '' } },
    );
    expect(res.success).toBe(true);
    expect(res.notes.join(' ')).toMatch(/ниже обычного предела 500/);
    const ok = computeResult(
      protamine,
      { scenario: 'lmwh-8', heparin: '8000' },
      { age: { years: '40', months: '' } },
    );
    expect(ok.notes.join(' ')).not.toMatch(/ниже обычного предела/);
  });

  test('дети и нет дозы гепарина — не считается', () => {
    expect(run(1000, 'iv-30', 17)).toEqual({});
    expect(run(1000, 'iv-30', 5)).toEqual({});
    expect(run(0)).toEqual({});
    expect(run(undefined)).toEqual({});
  });
});

describe('Ацизол (цинка бисвинилимидазола диацетат)', () => {
  test('взрослый, лечение: 60 мг = 1 мл в/м, не более 240 мг в сутки', () => {
    const r = acyzol.formula({ indication: 'treat', ageYears: 40 });
    expect(r.result1).toBe(60);
    expect(r.result2).toBe(1);
    expect(r.result3).toBe(240);
    expect(r.result4).toMatch(/сразу после выноса из зоны/);
    expect(limitsOf(acyzol, {}).result3.max).toBe(240);
  });

  test('профилактика: за 20–30 мин до входа', () => {
    expect(acyzol.formula({ indication: 'prevent', ageYears: 30 }).result4).toMatch(/20–30 мин/);
  });

  test('до 18 лет — не считается', () => {
    expect(acyzol.formula({ indication: 'treat', ageYears: 18 }).result1).toBe(60);
    expect(acyzol.formula({ indication: 'treat', ageYears: 17 })).toEqual({});
    expect(acyzol.formula({ indication: 'treat', ageYears: 0 })).toEqual({});
  });

  test('предупреждения: кислород — основное лечение, Цинказол', () => {
    expect(acyzol.warnings[0]).toMatch(/100% кислорода/);
    expect(acyzol.description).toMatch(/Цинказол/);
  });
});

describe('Галантамин — справочная запись', () => {
  test('нет полей и расчёта, предупреждения объясняют почему', () => {
    expect(galantamine.inputs).toEqual({});
    expect(galantamine.formula({ weight: 70, ageYears: 40 })).toEqual({});
    expect(isReferenceOnly(galantamine)).toBe(true);
    expect(galantamine.warnings[0]).toMatch(/Расчёт не выполняется/);
    expect(galantamine.warnings.join(' ')).toMatch(/атропин 0,5–1 мг/);
  });
});

describe('Карбоксим', () => {
  const run = (severity, ageYears = 40) => carboxim.formula({ severity, ageYears });

  test('лёгкая степень: 150 мг (1 мл), суммарно до 2 мл', () => {
    const r = run('mild');
    expect(r.result1).toBe(150);
    expect(r.result2).toBe(1);
    expect(r.result3).toBe(300);
    expect(r.result4).toBe(2);
    expect(r.result5).toMatch(/после введения холинолитика/);
  });

  test('средняя: 2 введения через 2–3 ч', () => {
    const r = run('moderate');
    expect(r.result3).toBe(300);
    expect(r.result5).toMatch(/2–3 ч/);
  });

  test('тяжёлая: до 4 мл = 600 мг, на пределе', () => {
    const r = run('severe');
    expect(r.result3).toBe(600);
    expect(r.result4).toBe(4);
    expect(limitsOf(carboxim, {}).result3.max).toBe(600);
  });

  test('детям — не считается', () => {
    expect(run('mild', 17)).toEqual({});
    expect(run('severe', 2)).toEqual({});
    expect(run('mild', 18).result1).toBe(150);
  });
});

describe('Закись азота', () => {
  test('обезболивание и роды: 40–70%, кислород не менее 30%', () => {
    ['pain', 'labor'].forEach((indication) => {
      const r = n2o.formula({ indication });
      expect(r.result1).toBe(40);
      expect(r.result2).toBe(70);
      expect(r.result3).toBe(30);
      expect(r.result4).toMatch(/кислород 4–5 мин/);
    });
    expect(n2o.formula({ indication: 'labor' }).result4).toMatch(/схватки/);
  });

  test('процедура с отключением сознания: 25–50%', () => {
    const r = n2o.formula({ indication: 'procedure' });
    expect(r.result1).toBe(25);
    expect(r.result2).toBe(50);
  });

  test('пределы: не выше 70%, кислород не менее 30%', () => {
    expect(limitsOf(n2o, {})).toEqual({ result2: { max: 70 }, result3: { min: 30 } });
    expect(n2o.warnings.join(' ')).toMatch(/пневмотораксе/);
  });
});

describe('Кетонал (кетопрофен)', () => {
  test('взрослый в/м: 100 мг = 2 мл, суточная не более 200 мг', () => {
    const r = ketonal.formula({ route: 'im', ageYears: 40 });
    expect(r.result1).toBe(100);
    expect(r.result2).toBe(2);
    expect(r.result3).toBe(200);
    expect(r.result4).toMatch(/^в\/м/);
  });

  test('в/в: инфузия в 100 мл NaCl за 0,5–1 ч, в стационаре', () => {
    const r = ketonal.formula({ route: 'iv', ageYears: 70 });
    expect(r.result1).toBe(100);
    expect(r.result4).toMatch(/100 мл NaCl 0,9% за 0,5–1 ч/);
    expect(r.result4).toMatch(/стационаре/);
  });

  test('максимумы', () => {
    expect(limitsOf(ketonal, {}).result1.max).toBe(200);
    expect(limitsOf(ketonal, {}).result3.max).toBe(200);
  });

  test('до 18 лет — не считается', () => {
    expect(ketonal.formula({ route: 'im', ageYears: 17 })).toEqual({});
    expect(ketonal.formula({ route: 'im', ageYears: 15 })).toEqual({});
    expect(ketonal.formula({ route: 'im', ageYears: 18 }).result1).toBe(100);
  });
});

describe('Новокаин (прокаин) — максимальная доза местно', () => {
  const run = (weight, ageYears, solution = '0.5') =>
    procaine.formula({ route: 'local', solution, weight, ageYears });

  test('взрослый: 0,5% — 750 мг (150 мл), 0,25% — 1250 мг (500 мл), 2% — 500 мг (25 мл)', () => {
    let r = run(70, 40);
    expect(r.result1).toBe(750);
    close(r.result2, 150);
    expect(r.result4).toMatch(/не зависит от массы/);
    r = run(70, 40, '0.25');
    expect(r.result1).toBe(1250);
    close(r.result2, 500);
    r = run(70, 40, '2');
    expect(r.result1).toBe(500);
    close(r.result2, 25);
    expect(r.result3).toMatch(/проводниковая/);
  });

  test('подросток 14 лет, 40 кг: 15 мг/кг = 600 мг', () => {
    const r = run(40, 14);
    expect(r.result1).toBe(600);
    close(r.result2, 120);
    expect(r.result4).toMatch(/15 мг\/кг/);
    expect(r.result4).not.toMatch(/2 г/);
  });

  test('подросток с большой массой: не выше взрослого предела', () => {
    const r = run(90, 15, '2');
    expect(r.result1).toBe(500);
    expect(r.result4).toMatch(/ограничено взрослым пределом 500 мг/);
    expect(run(60, 17).result1).toBe(750);
  });

  test('границы возраста: 12 лет — считается, до 12 — нет', () => {
    expect(run(40, 12).result1).toBe(600);
    expect(run(30, 11)).toEqual({});
    expect(run(3.5, 0)).toEqual({});
    expect(run(70, undefined)).toEqual({});
    expect(run(0, 40)).toEqual({});
  });

  test('пределы: 12–17 лет — взрослый предел раствора; взрослым — нет (результат и есть предел)', () => {
    expect(limitsOf(procaine, { solution: '0.25', ageYears: 14 })).toEqual({
      result1: { max: 1250 },
      result2: { max: 500 },
    });
    expect(limitsOf(procaine, { solution: '2', ageYears: 17 }).result2.max).toBe(25);
    expect(limitsOf(procaine, { solution: 'x', ageYears: 14 })).toEqual({});
    expect(limitsOf(procaine, { solution: '0.5', ageYears: 18 })).toEqual({});
    expect(limitsOf(procaine, { solution: '0.5', ageYears: 40 })).toEqual({});
  });

  test('через движок: взрослому без статуса «на пределе», подростку с большой массой — atmax', () => {
    const adult = computeResult(
      procaine,
      { route: 'local', solution: '0.5', weight: '70' },
      { age: { years: '40', months: '' } },
    );
    expect(adult.success).toBe(true);
    adult.items.filter((i) => i.unit).forEach((i) => expect(i.status).toBe('ok'));
    const teen = computeResult(
      procaine,
      { route: 'local', solution: '2', weight: '90' },
      { age: { years: '15', months: '' } },
    );
    expect(teen.items.find((i) => i.key === 'result1').status).toBe('atmax');
  });
});

describe('через движок', () => {
  test('этанол: мл и мл/ч форматируются, выбор в копии', () => {
    const res = computeResult(
      ethanol,
      { solution: 'iv10', dialysis: 'no', weight: '70' },
      { age: { years: '40', months: '' }, now: new Date(2026, 0, 1, 9, 5) },
    );
    expect(res.success).toBe(true);
    expect(res.items.find((i) => i.key === 'result1').text).toBe('525.0 мл');
    expect(res.items.find((i) => i.key === 'result2').text).toBe('70.0 мл/ч');
    const copy = buildCopyText(res);
    expect(copy).toMatch(/Раствор этанола: 10% — в\/в/);
    expect(copy).toMatch(/Форма выпуска: Лекарственная форма в РФ/);
  });

  test('этанол ребёнку — информационный результат', () => {
    const res = computeResult(ethanol, { weight: '20' }, { age: { years: '5', months: '' } });
    expect(res.info).toBe(true);
  });

  test('протамин: предел 50 мг — статус atmax', () => {
    const res = computeResult(
      protamine,
      { scenario: 'iv-30', heparin: '10000' },
      { age: { years: '40', months: '' } },
    );
    expect(res.success).toBe(true);
    expect(res.items[0].status).toBe('atmax');
  });

  test('протамин: опечатка в дозе гепарина — ошибка ввода', () => {
    const res = computeResult(
      protamine,
      { scenario: 'iv-30', heparin: '500000' },
      { age: { years: '40', months: '' } },
    );
    expect(res.error).toBe(true);
  });

  test('закись азота: проценты в строках результата', () => {
    const res = computeResult(n2o, { indication: 'pain' });
    expect(res.success).toBe(true);
    expect(res.items.find((i) => i.key === 'result2').text).toBe('70 %');
    expect(res.items.find((i) => i.key === 'result2').status).toBe('atmax');
  });

  test('галантамин — справочная запись в движке', () => {
    const res = computeResult(galantamine, {});
    expect(res.info).toBe(true);
    expect(res.warnings.length).toBeGreaterThan(0);
  });

  test.each([ethanol, protamine, acyzol, carboxim, ketonal, procaine].map((f) => [f.name, f]))(
    '%s: типичный взрослый считается без ошибок и не выше пределов',
    (_n, f) => {
      const res = computeResult(
        f,
        { weight: '70', heparin: '3000' },
        { age: { years: '40', months: '' } },
      );
      expect(res.error).toBeUndefined();
      expect(res.success).toBe(true);
      res.items.filter((i) => i.unit).forEach((i) => expect(i.status).not.toBe('high'));
    },
  );

  test('числовые результаты конечны, положительны и не выше пределов на сетке входов', () => {
    const weights = [3, 8, 15, 25, 40, 70, 150, 250];
    const ages = [0, 0.5, 2, 6, 11, 12, 17, 18, 60, 100];
    group.forEach((f) => {
      const choiceKeys = Object.keys(f.inputs).filter((k) => isChoiceInput(f.inputs[k]));
      const combos = choiceKeys.reduce(
        (acc, k) => acc.flatMap((c) => f.inputs[k].choices.map((x) => ({ ...c, [k]: x.value }))),
        [{}],
      );
      combos.forEach((choice) =>
        weights.forEach((weight) =>
          ages.forEach((ageYears) => {
            const clean = { ...choice, weight, ageYears, heparin: weight * 100 };
            const r = f.formula(clean);
            const lim = limitsOf(f, clean);
            numericKeys(r).forEach((k) => {
              expect(Number.isFinite(r[k])).toBe(true);
              expect(r[k]).toBeGreaterThan(0);
              if (lim[k] && Number.isFinite(lim[k].max))
                expect(r[k]).toBeLessThanOrEqual(lim[k].max + 1e-9);
            });
          }),
        ),
      );
    });
  });
});
