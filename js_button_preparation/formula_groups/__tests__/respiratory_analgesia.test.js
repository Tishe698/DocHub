import group from '../respiratory_analgesia';
import { isChoiceInput, ROUTES } from '../../routes';
import { computeResult, buildItems } from '../../engine';

const byName = (name) => {
  const f = group.find((g) => g.name === name);
  if (!f) throw new Error(`нет записи ${name}`);
  return f;
};
const close = (v, expected) => expect(v).toBeCloseTo(expected, 6);
const limitsOf = (f, clean) => (typeof f.limits === 'function' ? f.limits(clean) : f.limits || {});
// Статусы строк результата через движок (бейджи «= предел», «выше макс.»)
const statuses = (f, clean) =>
  Object.fromEntries(buildItems(f.formula(clean), f, clean).map((i) => [i.key, i.status]));

describe('группа респираторной терапии и анальгезии: структура', () => {
  it('содержит все записи в прежнем порядке', () => {
    expect(group.map((g) => g.name)).toEqual([
      'Будесонид (небула)',
      'Ипратропия бромид + фенотерол',
      'Сальбутамол',
      'Кеторолак',
      'Трамадол',
      'Морфин',
      'Фентанил',
      'Пропофол',
      'Тиопентал натрия',
    ]);
  });

  it.each(group.map((g) => [g.name, g]))('%s: поля контракта и пустой ввод', (_, f) => {
    expect(typeof f.description).toBe('string');
    expect(f.description.length).toBeGreaterThan(0);
    expect(typeof f.formula).toBe('function');
    expect(Array.isArray(f.warnings)).toBe(true);
    expect(f.warnings.length).toBeGreaterThan(0);
    if (f.inputs.weight) expect(f.inputs.weight).toBe('Вес (кг)');
    expect(f.inputs.ageYears).toBe('Возраст (лет)');
    // Пустой и отрицательный ввод — {} (расчёт не выполняется)
    expect(f.formula({})).toEqual({});
    expect(f.formula({ weight: 20, ageYears: -1 })).toEqual({});
    if (f.inputs.weight) expect(f.formula({ weight: 0, ageYears: 30 })).toEqual({});
    // Подписи есть у каждого результата с единицей
    Object.keys(f.units).forEach((k) => expect(f.labels[k]).toBeTruthy());
    // limits — объект или функция от ввода; пределы числовые
    const lim = limitsOf(f, { weight: 20, ageYears: 5 });
    Object.values(lim).forEach((l) => expect(Number.isFinite(l.max)).toBe(true));
  });

  it('поля-выборы корректны: коды путей из routes.js, по умолчанию — из вариантов', () => {
    group.forEach((f) => {
      Object.values(f.inputs)
        .filter(isChoiceInput)
        .forEach((c) => expect(c.choices.some((x) => x.value === c.default)).toBe(true));
    });
    const routes = {
      Кеторолак: [['im', 'iv'], 'im'],
      Трамадол: [['iv', 'im', 'sc'], 'iv'],
      Морфин: [['iv', 'im', 'sc'], 'iv'],
      Фентанил: [['iv', 'im'], 'iv'],
    };
    Object.entries(routes).forEach(([name, [codes, def]]) => {
      const r = byName(name).inputs.route;
      expect(r.label).toBe('Путь введения');
      expect(r.choices.map((c) => c.value)).toEqual(codes);
      r.choices.forEach((c) => expect(c.label).toBe(ROUTES[c.value]));
      expect(r.default).toBe(def);
    });
    const bud = byName('Будесонид (небула)').inputs.indication;
    expect(bud.choices.map((c) => c.value)).toEqual(['croup', 'asthma']);
    expect(bud.default).toBe('croup');
    const prop = byName('Пропофол').inputs.indication;
    expect(prop.choices.map((c) => c.value)).toEqual(['induction', 'sedation']);
    expect(prop.default).toBe('induction');
  });

  it('у препаратов с одним путём путь указан в подписи результата', () => {
    expect(byName('Будесонид (небула)').labels.result1).toMatch(/ингаляционно, небулайзер/);
    expect(byName('Ипратропия бромид + фенотерол').labels.result1).toMatch(
      /ингаляционно, небулайзер/,
    );
    expect(byName('Сальбутамол').labels.result1).toMatch(/ингаляционно, небулайзер/);
    expect(byName('Пропофол').labels.result1).toMatch(/в\/в/);
    expect(byName('Тиопентал натрия').labels.result1).toMatch(/в\/в/);
    expect(byName('Тиопентал натрия').labels.result3).toMatch(/в\/в/);
  });

  it('через движок: путь и показание попадают в результат и копию', () => {
    const r = computeResult(
      byName('Морфин'),
      { weight: '20', route: 'sc' },
      { age: { years: '5', months: '0' } },
    );
    expect(r.success).toBe(true);
    expect(r.choices).toEqual([
      { key: 'route', label: 'Путь введения', value: 'sc', valueLabel: 'п/к' },
    ]);
    const def = computeResult(
      byName('Кеторолак'),
      { weight: '70' },
      { age: { years: '30', months: '0' } },
    );
    expect(def.choices[0].valueLabel).toBe('в/м');
    const bud = computeResult(
      byName('Будесонид (небула)'),
      {},
      { age: { years: '0', months: '6' } },
    );
    expect(bud.success).toBe(true);
    expect(bud.choices[0].valueLabel).toMatch(/Круп/);
    const young = computeResult(
      byName('Будесонид (небула)'),
      {},
      { age: { years: '0', months: '5' } },
    );
    expect(young.info).toBe(true);
  });
});

describe('Будесонид (небула)', () => {
  const f = byName('Будесонид (небула)');

  it('круп: 2 мг = 4 мл, на пределе', () => {
    const r = f.formula({ ageYears: 3, indication: 'croup' });
    expect(r.result1).toBe(2);
    expect(r.result2).toBe(4);
    expect(r.result3).toMatch(/1 мг \(2 мл\) дважды с интервалом 30 мин/);
    expect(statuses(f, { ageYears: 3, indication: 'croup' }).result1).toBe('atmax');
    // По умолчанию — круп
    expect(f.formula({ ageYears: 3 })).toEqual(r);
  });

  it('граница 6 месяцев: 0.5 года — считается, меньше — противопоказан', () => {
    expect(f.formula({ ageYears: 0.5, indication: 'croup' }).result1).toBe(2);
    expect(f.formula({ ageYears: 5 / 12, indication: 'croup' })).toEqual({});
    expect(f.formula({ ageYears: 0, indication: 'asthma' })).toEqual({});
  });

  it('астма, ребёнок: 0.5 мг = 1 мл, довести NaCl до 2 мл; максимум 1 мг', () => {
    const r = f.formula({ ageYears: 5, indication: 'asthma' });
    expect(r.result1).toBe(0.5);
    expect(r.result2).toBe(1);
    expect(r.result3).toMatch(/до 2 мл/);
    expect(limitsOf(f, { ageYears: 5, indication: 'asthma' }).result1.max).toBe(1);
  });

  it('астма, граница 18 лет и взрослый: 1 мг = 2 мл, максимум 2 мг', () => {
    expect(f.formula({ ageYears: 17, indication: 'asthma' }).result1).toBe(0.5);
    const r = f.formula({ ageYears: 18, indication: 'asthma' });
    expect(r.result1).toBe(1);
    expect(r.result2).toBe(2);
    expect(r.result3).toMatch(/1–2 мг\/сут/);
    expect(limitsOf(f, { ageYears: 40, indication: 'asthma' }).result1.max).toBe(2);
  });
});

describe('Ипратропия бромид + фенотерол (небулайзер)', () => {
  const f = byName('Ипратропия бромид + фенотерол');

  it('ребёнок 2 лет 12 кг: 2 кап/кг, предел 10 кап (0.5 мл)', () => {
    const r = f.formula({ weight: 12, ageYears: 2 });
    expect(r.result1).toBe(10);
    close(r.result2, 0.5);
    expect(r.result3).toMatch(/Достигнут максимум до 6 лет/);
    expect(statuses(f, { weight: 12, ageYears: 2 }).result1).toBe('atmax');
  });

  it('младенец 4 кг: 8 кап = 0.4 мл, без пометки о максимуме', () => {
    const r = f.formula({ weight: 4, ageYears: 0.5 });
    expect(r.result1).toBe(8);
    close(r.result2, 0.4);
    expect(r.result3).not.toMatch(/Достигнут/);
    expect(r.result3).toMatch(/Развести 0.9% NaCl до 3–4 мл/);
  });

  it('граница 6 и 12 лет: 20 кап = 1 мл; возрастные пределы 40 и 80 кап', () => {
    const r6 = f.formula({ weight: 22, ageYears: 6 });
    expect(r6.result1).toBe(20);
    expect(r6.result3).toMatch(/6–12 лет/);
    expect(limitsOf(f, { ageYears: 6 }).result1.max).toBe(40);
    const r12 = f.formula({ weight: 40, ageYears: 12 });
    expect(r12.result1).toBe(20);
    expect(r12.result2).toBe(1);
    expect(r12.result3).toMatch(/Старше 12 лет/);
    expect(limitsOf(f, { ageYears: 30 })).toEqual({ result1: { max: 80 }, result2: { max: 4 } });
  });
});

describe('Сальбутамол (небулайзер)', () => {
  const f = byName('Сальбутамол');

  it('ребёнок 5 лет и взрослый: 2.5 мг = 2.5 мл без разведения, максимум 5 мг', () => {
    [5, 40].forEach((a) => {
      const r = f.formula({ ageYears: a });
      expect(r.result1).toBe(2.5);
      expect(r.result2).toBe(2.5);
      expect(r.result3).toMatch(/без разведения/);
    });
    expect(f.limits.result1.max).toBe(5);
  });

  it('граница 2 года', () => {
    expect(f.formula({ ageYears: 2 }).result1).toBe(2.5);
    expect(f.formula({ ageYears: 1.5 })).toEqual({});
    expect(f.formula({ ageYears: 0 })).toEqual({});
  });
});

describe('Кеторолак', () => {
  const f = byName('Кеторолак');

  it('до 16 лет — противопоказан', () => {
    expect(f.formula({ weight: 50, ageYears: 15, route: 'im' })).toEqual({});
    expect(f.formula({ weight: 20, ageYears: 5, route: 'iv' })).toEqual({});
  });

  it('взрослый 70 кг в/м: 30 мг = 1 мл, ≤90 мг/сут; предел в/м 60 мг', () => {
    const c = { weight: 70, ageYears: 30, route: 'im' };
    const r = f.formula(c);
    expect(r.result1).toBe(30);
    expect(r.result2).toBe(1);
    expect(r.result3).toBe(90);
    expect(r.result4).toMatch(/В\/м медленно, глубоко/);
    expect(limitsOf(f, c)).toEqual({
      result1: { max: 60 },
      result2: { max: 2 },
      result3: { max: 90 },
    });
    expect(statuses(f, c).result1).toBe('ok');
    // По умолчанию — в/м
    expect(f.formula({ weight: 70, ageYears: 30 })).toEqual(r);
  });

  it('взрослый в/в: 30 мг не быстрее 15 с, на пределе в/в 30 мг', () => {
    const c = { weight: 70, ageYears: 16, route: 'iv' };
    const r = f.formula(c);
    expect(r.result1).toBe(30);
    expect(r.result4).toMatch(/не быстрее чем за 15 с/);
    expect(limitsOf(f, c).result1.max).toBe(30);
    expect(statuses(f, c).result1).toBe('atmax');
  });

  it('масса <50 кг: 15 мг, ≤60 мг/сут; пределы в/в 15, в/м 30', () => {
    const r = f.formula({ weight: 49, ageYears: 30, route: 'iv' });
    expect(r.result1).toBe(15);
    close(r.result2, 0.5);
    expect(r.result3).toBe(60);
    expect(r.result4).toMatch(/Масса <50 кг/);
    expect(limitsOf(f, { weight: 49, ageYears: 30, route: 'iv' }).result1.max).toBe(15);
    expect(limitsOf(f, { weight: 49, ageYears: 30, route: 'im' }).result1.max).toBe(30);
    expect(f.formula({ weight: 50, ageYears: 30, route: 'iv' }).result1).toBe(30);
  });

  it('с 65 лет: 15 мг, ≤60 мг/сут', () => {
    const r = f.formula({ weight: 80, ageYears: 65, route: 'im' });
    expect(r.result1).toBe(15);
    expect(r.result3).toBe(60);
    expect(r.result4).toMatch(/Старше 65 лет/);
    expect(f.formula({ weight: 80, ageYears: 64, route: 'im' }).result1).toBe(30);
  });
});

describe('Трамадол', () => {
  const f = byName('Трамадол');

  it('до 1 года — противопоказан', () => {
    expect(f.formula({ weight: 9, ageYears: 0.9, route: 'iv' })).toEqual({});
    expect(f.formula({ weight: 3.5, ageYears: 0, route: 'im' })).toEqual({});
  });

  it('ребёнок 5 лет 20 кг в/в: 20 мг = 0.4 мл, после разведения 4 мл; ≤160 мг/сут', () => {
    const r = f.formula({ weight: 20, ageYears: 5, route: 'iv' });
    expect(r.result1).toBe(20);
    close(r.result2, 0.4);
    close(r.result3, 4);
    expect(r.result4).toBe(160);
    expect(r.result5).toMatch(/В\/в струйно медленно/);
    expect(r.result5).toMatch(/1 мл \+ 9 мл 0.9% NaCl = 5 мг\/мл/);
    expect(f.formula({ weight: 20, ageYears: 5 })).toEqual(r);
  });

  it('ребёнок в/м и п/к: та же доза, без разведения', () => {
    ['im', 'sc'].forEach((route) => {
      const r = f.formula({ weight: 20, ageYears: 5, route });
      expect(r.result1).toBe(20);
      expect(r.result3).toBeUndefined();
      expect(r.result5).not.toMatch(/развести/i);
    });
    expect(f.formula({ weight: 20, ageYears: 5, route: 'im' }).result5).toMatch(/^В\/м/);
    expect(f.formula({ weight: 20, ageYears: 5, route: 'sc' }).result5).toMatch(/^П\/к/);
  });

  it('граница 1 года и предел 100 мг / 400 мг/сут у ребёнка с большой массой', () => {
    expect(f.formula({ weight: 10, ageYears: 1, route: 'iv' }).result1).toBe(10);
    const c = { weight: 110, ageYears: 11, route: 'iv' };
    const r = f.formula(c);
    expect(r.result1).toBe(100);
    expect(r.result4).toBe(400);
    expect(r.result5).toMatch(/Достигнут предел разовой дозы 100 мг/);
    expect(statuses(f, c).result1).toBe('atmax');
    expect(statuses(f, c).result3).toBe('atmax');
  });

  it('с 12 лет и взрослый: 50 мг = 1 мл, ≤400 мг/сут; старше 75 — увеличить интервал', () => {
    const r = f.formula({ weight: 70, ageYears: 12, route: 'im' });
    expect(r.result1).toBe(50);
    expect(r.result2).toBe(1);
    expect(r.result3).toBeUndefined();
    expect(r.result4).toBe(400);
    expect(r.result5).toMatch(/через 30–60 мин ещё 50 мг/);
    expect(f.formula({ weight: 70, ageYears: 80, route: 'iv' }).result5).toMatch(
      /увеличить интервал/,
    );
  });
});

describe('Морфин', () => {
  const f = byName('Морфин');

  it('ребёнок 5 лет 20 кг в/в: 2 мг = 0.2 мл, после разведения 2 мл', () => {
    const r = f.formula({ weight: 20, ageYears: 5, route: 'iv' });
    close(r.result1, 2);
    close(r.result2, 0.2);
    close(r.result3, 2);
    expect(r.result4).toBeUndefined();
    expect(r.result5).toMatch(/В\/в медленно/);
    expect(f.formula({ weight: 20, ageYears: 5 })).toEqual(r);
  });

  it('ребёнок 5 лет 20 кг п/к и в/м: 2 мг = 0.2 мл неразведённого, суточно ≤30 мг (1.5 мг/кг)', () => {
    ['sc', 'im'].forEach((route) => {
      const r = f.formula({ weight: 20, ageYears: 5, route });
      close(r.result1, 2);
      close(r.result2, 0.2);
      expect(r.result3).toBeUndefined();
      expect(r.result4).toBe(30);
      expect(r.result5).toMatch(/неразведённым, так как объём не меньше 0,1 мл/);
      expect(r.result5).not.toMatch(/без разведения/);
    });
  });

  it('п/к и в/м при объёме 10 мг/мл < 0,1 мл: объём после разведения до 1 мг/мл', () => {
    // 6 кг, 5 мес: 0.3 мг = 0.03 мл неразведённого → 0.3 мл раствора 1 мг/мл
    const sc = f.formula({ weight: 6, ageYears: 5 / 12, route: 'sc' });
    close(sc.result1, 0.3);
    close(sc.result2, 0.03);
    close(sc.result3, 0.3);
    expect(sc.result5).toMatch(/меньше 0,1 мл — развести до 1 мг\/мл \(1 мл \+ 9 мл 0.9% NaCl\)/);
    // новорождённый 3.5 кг п/к: 0.175 мг → 0.175 мл после разведения
    const nb = f.formula({ weight: 3.5, ageYears: 0, route: 'sc' });
    close(nb.result3, 0.175);
    // 1 год 8 кг в/м: 0.8 мг → 0.8 мл после разведения; 9 кг п/к — 0.9 мл
    close(f.formula({ weight: 8, ageYears: 1, route: 'im' }).result3, 0.8);
    close(f.formula({ weight: 9, ageYears: 1, route: 'sc' }).result3, 0.9);
    // граница: 10 кг, 1 год — 1 мг = 0.1 мл, можно без разведения
    const edge = f.formula({ weight: 10, ageYears: 1, route: 'sc' });
    close(edge.result2, 0.1);
    expect(edge.result3).toBeUndefined();
    // до 1 года 0.05 мг/кг: до 20 кг объём < 0,1 мл → разведение; 20 кг — 1 мг, без разведения
    expect(f.formula({ weight: 19, ageYears: 0.9, route: 'im' }).result3).toBeDefined();
    expect(f.formula({ weight: 20, ageYears: 0.9, route: 'im' }).result3).toBeUndefined();
  });

  it('через движок: малый объём п/к показывает разведённый объём, а не «без разведения»', () => {
    const r = computeResult(
      byName('Морфин'),
      { weight: '6', route: 'sc' },
      { age: { years: '0', months: '5' } },
    );
    expect(r.success).toBe(true);
    const items = buildItems(f.formula({ weight: 6, ageYears: 5 / 12, route: 'sc' }), f, {
      weight: 6,
      ageYears: 5 / 12,
      route: 'sc',
    });
    const diluted = items.find((i) => i.key === 'result3');
    expect(diluted.name).toMatch(/после разведения 1 мг\/мл/);
    close(diluted.value, 0.3);
    expect(items.some((i) => /без разведения/.test(i.text))).toBe(false);
    expect(JSON.stringify(r)).toMatch(/после разведения 1 мг\/мл/);
    expect(JSON.stringify(r)).not.toMatch(/без разведения/);
  });

  it('до 1 года: 0.05 мг/кг; новорождённый 3.5 кг; до 2 лет суточно ≤15 мг', () => {
    const r = f.formula({ weight: 3.5, ageYears: 0, route: 'iv' });
    close(r.result1, 0.175);
    close(r.result3, 0.175);
    expect(r.result5).toMatch(/До 1 года: 0.05 мг\/кг/);
    const sc = f.formula({ weight: 8, ageYears: 0.5, route: 'sc' });
    close(sc.result1, 0.4);
    expect(sc.result4).toBe(15);
    close(f.formula({ weight: 10, ageYears: 1, route: 'sc' }).result1, 1);
    expect(f.formula({ weight: 12, ageYears: 1.9, route: 'im' }).result4).toBe(15);
    expect(f.formula({ weight: 12, ageYears: 2, route: 'im' }).result4).toBe(18);
  });

  it('взрослый: предел разовой дозы 10 мг, суточно п/к 50 мг', () => {
    const c = { weight: 120, ageYears: 40, route: 'iv' };
    const r = f.formula(c);
    expect(r.result1).toBe(10);
    expect(r.result2).toBe(1);
    expect(r.result3).toBe(10);
    expect(r.result5).toMatch(/Достигнут предел разовой дозы 10 мг/);
    expect(statuses(f, c).result1).toBe('atmax');
    const sc = f.formula({ weight: 70, ageYears: 40, route: 'sc' });
    close(sc.result1, 7);
    expect(sc.result4).toBe(50);
    expect(f.formula({ weight: 70, ageYears: 17, route: 'sc' }).result4).toBe(50);
  });
});

describe('Фентанил', () => {
  const f = byName('Фентанил');

  it('до 1 года — противопоказан', () => {
    expect(f.formula({ weight: 9, ageYears: 0.9, route: 'iv' })).toEqual({});
    expect(f.formula({ weight: 3.5, ageYears: 0, route: 'im' })).toEqual({});
  });

  it('ребёнок 5 лет 20 кг в/в: 20 мкг = 0.4 мл, после разведения 2 мл', () => {
    const r = f.formula({ weight: 20, ageYears: 5, route: 'iv' });
    expect(r.result1).toBe(20);
    close(r.result2, 0.4);
    close(r.result3, 2);
    expect(r.result4).toMatch(/в\/в медленно/);
    expect(f.formula({ weight: 20, ageYears: 5 })).toEqual(r);
  });

  it('ребёнок в/м: 1 мкг/кг без разведения, с пояснением про 2 мкг/кг', () => {
    const r = f.formula({ weight: 10, ageYears: 1, route: 'im' });
    expect(r.result1).toBe(10);
    close(r.result2, 0.2);
    expect(r.result3).toBeUndefined();
    expect(r.result4).toMatch(/детям в инструкции — 2 мкг\/кг в\/м/);
  });

  it('взрослый: предел 100 мкг = 2 мл для обоих путей', () => {
    ['iv', 'im'].forEach((route) => {
      const c = { weight: 120, ageYears: 40, route };
      const r = f.formula(c);
      expect(r.result1).toBe(100);
      expect(r.result2).toBe(2);
      expect(r.result4).toMatch(/Достигнут предел/);
      expect(statuses(f, c).result1).toBe('atmax');
    });
    expect(f.formula({ weight: 70, ageYears: 40, route: 'im' }).result4).not.toMatch(/детям/);
  });
});

describe('Пропофол', () => {
  const f = byName('Пропофол');

  it('новорождённый (младше 1 мес.) — не применяется ни для индукции, ни для седации', () => {
    expect(f.formula({ weight: 3.5, ageYears: 0, indication: 'induction' })).toEqual({});
    expect(f.formula({ weight: 3.5, ageYears: 0.08, indication: 'sedation' })).toEqual({});
  });

  it('индукция: 1 мес. – 18 лет 2.5 мг/кг, с пометками по возрасту', () => {
    const r1 = f.formula({ weight: 4.5, ageYears: 1 / 12, indication: 'induction' });
    close(r1.result1, 11.25);
    expect(r1.result3).toMatch(/Младше 3 лет/);
    const r5 = f.formula({ weight: 20, ageYears: 5 });
    expect(r5.result1).toBe(50);
    expect(r5.result2).toBe(5);
    expect(r5.result3).toMatch(/Младше 8 лет/);
    expect(f.formula({ weight: 40, ageYears: 12 }).result3).toMatch(/Старше 8 лет/);
  });

  it('индукция у взрослых: 2 мг/кг до 55 лет, 1 мг/кг с 55 лет', () => {
    expect(f.formula({ weight: 70, ageYears: 18, indication: 'induction' }).result1).toBe(140);
    expect(f.formula({ weight: 70, ageYears: 54, indication: 'induction' }).result1).toBe(140);
    const old = f.formula({ weight: 70, ageYears: 55, indication: 'induction' });
    expect(old.result1).toBe(70);
    expect(old.result3).toMatch(/Старше 55 лет/);
  });

  it('седация: дети 1 мг/кг не менее чем за 1 мин, взрослые 0.5 мг/кг за 1–5 мин', () => {
    const kid = f.formula({ weight: 20, ageYears: 5, indication: 'sedation' });
    expect(kid.result1).toBe(20);
    expect(kid.result2).toBe(2);
    expect(kid.result3).toMatch(/не менее чем за 1 мин/);
    const adult = f.formula({ weight: 70, ageYears: 18, indication: 'sedation' });
    expect(adult.result1).toBe(35);
    close(adult.result2, 3.5);
    expect(adult.result3).toMatch(/за 1–5 мин/);
    const old = f.formula({ weight: 70, ageYears: 70, indication: 'sedation' });
    expect(old.result1).toBe(35);
    expect(old.result3).toMatch(/без быстрого болюса/);
  });
});

describe('Тиопентал натрия (в/в)', () => {
  const f = byName('Тиопентал натрия');

  it('ребёнок 5 лет 20 кг: 60–100 мг, объём 1% — 6 мл', () => {
    const r = f.formula({ weight: 20, ageYears: 5 });
    expect(r.result1).toBe(60);
    expect(r.result2).toBe(6);
    expect(r.result3).toBe(100);
    expect(r.result4).toMatch(/Раствор 1%/);
    expect(r.result4).toMatch(/не быстрее 1 мл\/мин/);
  });

  it('новорождённый: 3–4 мг/кг', () => {
    const r = f.formula({ weight: 3.5, ageYears: 0 });
    close(r.result1, 10.5);
    close(r.result3, 14);
    expect(r.result4).toMatch(/Новорождённый/);
    expect(f.formula({ weight: 4.5, ageYears: 1 / 12 }).result3).toBeCloseTo(22.5, 6);
  });

  it('взрослый 70 кг: 210–350 мг, объём 2.5% — 8.4 мл', () => {
    const r = f.formula({ weight: 70, ageYears: 18 });
    expect(r.result1).toBe(210);
    close(r.result2, 8.4);
    expect(r.result3).toBe(350);
    expect(r.result4).toMatch(/Раствор 2.5%/);
  });

  it('предел разовой дозы 1 г', () => {
    const c = { weight: 250, ageYears: 40 };
    const r = f.formula(c);
    expect(r.result1).toBe(750);
    expect(r.result3).toBe(1000);
    expect(r.result4).toMatch(/Достигнут предел разовой дозы 1 г/);
    expect(statuses(f, c).result3).toBe('atmax');
  });
});
