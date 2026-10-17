import group from '../emergency_misc_2';
import { isChoiceInput, ROUTES } from '../../routes';
import { computeResult } from '../../engine';

const byName = (name) => {
  const f = group.find((g) => g.name === name);
  if (!f) throw new Error(`нет записи ${name}`);
  return f;
};
const close = (v, expected) => expect(v).toBeCloseTo(expected, 6);
const limitsOf = (f, clean) => (typeof f.limits === 'function' ? f.limits(clean) : f.limits);

describe('группа «прочее неотложное, часть 2»: структура', () => {
  it('содержит все записи в прежнем порядке', () => {
    expect(group.map((g) => g.name)).toEqual([
      'Но-шпа (дротаверин)',
      'Платифиллин',
      'Налоксон',
      'Конвулекс (вальпроевая кислота)',
      'Витамин B6 (пиридоксин)',
      'Витамин B1 (тиамин)',
      'Фильтрум',
      'Реамберин (меглюмина натрия сукцинат)',
      'Вазелиновое масло (парафин жидкий)',
      'Унитиол (димеркаптопропансульфонат натрия)',
    ]);
  });

  it.each(group.map((g) => [g.name, g]))('%s: поля контракта', (_, f) => {
    expect(typeof f.description).toBe('string');
    expect(f.description.length).toBeGreaterThan(0);
    expect(typeof f.formula).toBe('function');
    expect(Array.isArray(f.warnings) || f.warnings === undefined).toBe(true);
    if (f.inputs.weight) expect(f.inputs.weight).toBe('Вес (кг)');
    if (f.inputs.ageYears) expect(f.inputs.ageYears).toBe('Возраст (лет)');
    // Пустой ввод — {} (расчёт не выполняется)
    expect(f.formula({})).toEqual({});
    if (f.inputs.weight) expect(f.formula({ weight: 0, ageYears: 5 })).toEqual({});
    if (f.inputs.ageYears) expect(f.formula({ weight: 20, ageYears: -1 })).toEqual({});
    // Подписи есть у каждого числового результата
    Object.keys(f.units).forEach((k) => expect(f.labels[k]).toBeTruthy());
  });

  it('поля-выборы корректны: коды путей из routes.js, по умолчанию — из вариантов', () => {
    group.forEach((f) => {
      Object.values(f.inputs)
        .filter(isChoiceInput)
        .forEach((c) => expect(c.choices.some((x) => x.value === c.default)).toBe(true));
    });
    const dro = byName('Но-шпа (дротаверин)').inputs.route;
    expect(dro.choices.map((c) => c.value)).toEqual(['im', 'iv', 'sc']);
    dro.choices.forEach((c) => expect(c.label).toBe(ROUTES[c.value]));
    expect(dro.default).toBe('im');
    const nal = byName('Налоксон').inputs.route;
    expect(nal.choices.map((c) => c.value)).toEqual(['iv', 'im', 'sc']);
    expect(nal.default).toBe('iv');
    const pyr = byName('Витамин B6 (пиридоксин)').inputs.indication;
    expect(pyr.choices.map((c) => c.value)).toEqual(['isoniazid', 'pds']);
    expect(pyr.default).toBe('isoniazid');
    const uni = byName('Унитиол (димеркаптопропансульфонат натрия)').inputs.indication;
    expect(uni.choices.map((c) => c.value)).toEqual(['metals', 'glycosides']);
    expect(uni.default).toBe('metals');
  });

  it('у препаратов с одним путём путь указан в подписи результата', () => {
    expect(byName('Платифиллин').labels.result1).toMatch(/п\/к/);
    expect(byName('Конвулекс (вальпроевая кислота)').labels.result1).toMatch(/в\/в/);
    expect(byName('Витамин B6 (пиридоксин)').labels.result1).toMatch(/в\/в/);
    expect(byName('Витамин B1 (тиамин)').labels.result1).toMatch(/в\/м/);
    expect(byName('Фильтрум').labels.result1).toMatch(/внутрь/);
    expect(byName('Реамберин (меглюмина натрия сукцинат)').labels.result1).toMatch(/в\/в капельно/);
    expect(byName('Реамберин (меглюмина натрия сукцинат)').labels.result3).toMatch(/в\/в капельно/);
    expect(byName('Унитиол (димеркаптопропансульфонат натрия)').labels.result1).toMatch(
      /в\/м или п\/к/,
    );
  });
});

describe('Но-шпа (дротаверин)', () => {
  const f = byName('Но-шпа (дротаверин)');

  it('до 1 года — расчёт не выполняется', () => {
    expect(f.formula({ ageYears: 0 })).toEqual({});
    expect(f.formula({ ageYears: 0.9, route: 'iv' })).toEqual({});
  });

  it('1–5 лет: 10 мг = 0.5 мл; граница 6 лет — 20 мг', () => {
    const r = f.formula({ ageYears: 1 });
    expect(r.result1).toBe(10);
    expect(r.result2).toBe(0.5);
    expect(f.formula({ ageYears: 5.9 }).result1).toBe(10);
    expect(f.formula({ ageYears: 6 }).result1).toBe(20);
    expect(f.formula({ ageYears: 6 }).result2).toBe(1);
    expect(f.formula({ ageYears: 17 }).result1).toBe(20);
  });

  it('взрослый: 40 мг = 2 мл, предел 80 мг / 4 мл', () => {
    const r = f.formula({ ageYears: 18 });
    expect(r.result1).toBe(40);
    expect(r.result2).toBe(2);
    expect(f.limits.result1.max).toBe(80);
    expect(f.limits.result2.max).toBe(4);
  });

  it('путь меняет технику введения, но не дозу', () => {
    const im = f.formula({ ageYears: 5, route: 'im' });
    const iv = f.formula({ ageYears: 5, route: 'iv' });
    const sc = f.formula({ ageYears: 5, route: 'sc' });
    expect(iv.result1).toBe(im.result1);
    expect(sc.result1).toBe(im.result1);
    expect(im.result3).toMatch(/^В\/м, без разведения/);
    expect(sc.result3).toMatch(/^П\/к, без разведения/);
    expect(iv.result3).toMatch(/В\/в медленно: развести в 10–20 мл 0\.9% NaCl/);
    expect(iv.result3).toMatch(/лёжа/);
    // Без выбора — путь по умолчанию (в/м)
    expect(f.formula({ ageYears: 30 }).result3).toMatch(/^В\/м/);
  });
});

describe('Платифиллин (п/к)', () => {
  const f = byName('Платифиллин');

  it('новорождённый 3.5 кг: 0.035 мг/кг', () => {
    const r = f.formula({ weight: 3.5, ageYears: 0 });
    close(r.result1, 0.1225);
    close(r.result2, 0.06125);
    expect(r.result3).toMatch(/0\.035 мг\/кг/);
  });

  it('возрастные группы: 1–5 лет 0.03, 6–10 лет 0.025, 11–14 лет 0.02 мг/кг', () => {
    close(f.formula({ weight: 20, ageYears: 5 }).result1, 0.6);
    close(f.formula({ weight: 20, ageYears: 5 }).result2, 0.3);
    close(f.formula({ weight: 20, ageYears: 1 }).result1, 0.6);
    close(f.formula({ weight: 25, ageYears: 6 }).result1, 0.625);
    close(f.formula({ weight: 30, ageYears: 10 }).result1, 0.75);
    close(f.formula({ weight: 40, ageYears: 11 }).result1, 0.8);
    close(f.formula({ weight: 50, ageYears: 14 }).result1, 1);
  });

  it('с 15 лет — взрослая доза 2 мг = 1 мл', () => {
    const r = f.formula({ weight: 60, ageYears: 15 });
    expect(r.result1).toBe(2);
    expect(r.result2).toBe(1);
    expect(r.result3).toMatch(/разовая 10 мг, суточная 30 мг/);
  });

  it('детская доза ограничена 10 мг', () => {
    const r = f.formula({ weight: 600, ageYears: 14 });
    expect(r.result1).toBe(10);
    expect(r.result2).toBe(5);
    expect(r.result3).toMatch(/высшая разовая доза 10 мг/);
    expect(f.limits.result1.max).toBe(10);
  });
});

describe('Налоксон', () => {
  const f = byName('Налоксон');

  it('ребёнок 20 кг: 0.2 мг = 0.5 мл, повтор до 2 мг', () => {
    const r = f.formula({ weight: 20, ageYears: 5, route: 'iv' });
    close(r.result1, 0.2);
    close(r.result2, 0.5);
    expect(r.result3).toBe(2);
    expect(r.result4).toMatch(/^В\/в: эффект в первые 1–2 мин/);
    expect(r.result4).toMatch(/Суммарно не более 10 мг\/сут/);
  });

  it('взрослый: 0.4 мг = 1 мл, повтор до 2 мг', () => {
    const r = f.formula({ weight: 70, ageYears: 18 });
    expect(r.result1).toBe(0.4);
    expect(r.result2).toBe(1);
    expect(r.result3).toBe(2);
  });

  it('новорождённый 3 кг: 0.03 мг, подсказка по разведению', () => {
    const r = f.formula({ weight: 3, ageYears: 0 });
    close(r.result1, 0.03);
    close(r.result2, 0.075);
    close(r.result3, 0.3);
    expect(r.result4).toMatch(/развести до 10 мл/);
    expect(r.result4).toMatch(/ввести 0\.75 мл/);
  });

  it('масса < 1 кг: начальная доза только в примечании (мкг)', () => {
    const r = f.formula({ weight: 0.8, ageYears: 0 });
    expect(r.result1).toBeUndefined();
    close(r.result2, 0.02);
    expect(r.result4).toMatch(/Начальная 8 мкг/);
  });

  it('подросток с большой массой: повтор ограничен 2 мг (PALS)', () => {
    const r = f.formula({ weight: 60, ageYears: 15 });
    close(r.result1, 0.6);
    expect(r.result3).toBe(2);
    expect(r.result4).toMatch(/предел 2 мг разово/);
    const big = f.formula({ weight: 250, ageYears: 17 });
    expect(big.result1).toBe(2);
    expect(f.limits.result1.max).toBe(2);
    expect(f.limits.result3.max).toBe(2);
  });

  it('в/м и п/к: та же доза, другой текст введения', () => {
    const iv = f.formula({ weight: 20, ageYears: 5, route: 'iv' });
    const im = f.formula({ weight: 20, ageYears: 5, route: 'im' });
    const sc = f.formula({ weight: 70, ageYears: 30, route: 'sc' });
    expect(im.result1).toBe(iv.result1);
    expect(im.result4).toMatch(/^В\/м — при невозможности в\/в/);
    expect(sc.result4).toMatch(/^П\/к — при невозможности в\/в/);
    expect(sc.result1).toBe(0.4);
  });
});

describe('Вальпроевая кислота (в/в)', () => {
  const f = byName('Конвулекс (вальпроевая кислота)');

  it('ребёнок 20 кг: 15 мг/кг = 300 мг = 3 мл, инфузия 20 мг/ч', () => {
    const r = f.formula({ weight: 20, ageYears: 5 });
    expect(r.result1).toBe(300);
    expect(r.result2).toBe(3);
    expect(r.result3).toBe(20);
    expect(r.result4).toMatch(/0\.2 мл\/ч/);
    expect(r.result4).not.toMatch(/До 3 лет/);
  });

  it('до 3 лет — предупреждение о гепатотоксичности', () => {
    expect(f.formula({ weight: 12, ageYears: 2 }).result4).toMatch(/До 3 лет/);
    expect(f.formula({ weight: 3.5, ageYears: 0 }).result1).toBeCloseTo(52.5, 6);
  });

  it('взрослый 70 кг: 20 мг/кг = 1400 мг', () => {
    const r = f.formula({ weight: 70, ageYears: 18 });
    expect(r.result1).toBe(1400);
    expect(r.result2).toBe(14);
    expect(f.formula({ weight: 70, ageYears: 17 }).result1).toBe(1050);
  });

  it('предел 2500 мг', () => {
    const r = f.formula({ weight: 150, ageYears: 40 });
    expect(r.result1).toBe(2500);
    expect(r.result2).toBe(25);
    expect(r.result4).toMatch(/Достигнут предел 2500 мг/);
    expect(f.limits.result1.max).toBe(2500);
  });
});

describe('Витамин B6 (пиридоксин)', () => {
  const f = byName('Витамин B6 (пиридоксин)');

  it('изониазид, ребёнок 20 кг: 70 мг/кг = 1400 мг = 28 мл', () => {
    const r = f.formula({ weight: 20, ageYears: 5, indication: 'isoniazid' });
    expect(r.result1).toBe(1400);
    expect(r.result2).toBe(28);
    expect(r.result3).toMatch(/1 г пиридоксина на 1 г изониазида/);
    expect(r.result3).not.toMatch(/Достигнут/);
  });

  it('изониазид, взрослый 80 кг: предел 5 г = 100 мл', () => {
    const r = f.formula({ weight: 80, ageYears: 30 });
    expect(r.result1).toBe(5000);
    expect(r.result2).toBe(100);
    expect(r.result3).toMatch(/Достигнут предел 5 г/);
    expect(limitsOf(f, { indication: 'isoniazid' }).result1.max).toBe(5000);
    expect(limitsOf(f, {}).result1.max).toBe(5000);
  });

  it('изониазид, новорождённый: считается по массе', () => {
    expect(f.formula({ weight: 3, ageYears: 0 }).result1).toBe(210);
  });

  it('пиридоксинзависимые судороги: новорождённый 100 мг = 2 мл', () => {
    const r = f.formula({ weight: 3.5, ageYears: 0, indication: 'pds' });
    expect(r.result1).toBe(100);
    expect(r.result2).toBe(2);
    expect(r.result3).toMatch(/новорождённому/);
  });

  it('пиридоксинзависимые судороги: младенец 6 мес 7 кг — 30 мг/кг = 210 мг', () => {
    const r = f.formula({ weight: 7, ageYears: 0.5, indication: 'pds' });
    expect(r.result1).toBe(210);
    close(r.result2, 4.2);
    expect(r.result3).not.toMatch(/достигнут/);
  });

  it('пиридоксинзависимые судороги: предел 300 мг', () => {
    const r = f.formula({ weight: 11, ageYears: 11 / 12, indication: 'pds' });
    expect(r.result1).toBe(300);
    expect(r.result2).toBe(6);
    expect(r.result3).toMatch(/достигнут предел 300 мг/);
    expect(limitsOf(f, { indication: 'pds' }).result1.max).toBe(300);
    expect(limitsOf(f, { indication: 'pds' }).result2.max).toBe(6);
  });

  it('пиридоксинзависимые судороги с 1 года — не рассчитывается', () => {
    expect(f.formula({ weight: 10, ageYears: 1, indication: 'pds' })).toEqual({});
    expect(f.formula({ weight: 70, ageYears: 30, indication: 'pds' })).toEqual({});
  });
});

describe('Тиамин (в/м)', () => {
  const f = byName('Витамин B1 (тиамин)');

  it('ребёнок: 12.5 мг = 0.5 мл 2.5%, без объёма 5%', () => {
    const r = f.formula({ ageYears: 5 });
    expect(r.result1).toBe(12.5);
    expect(r.result2).toBe(0.5);
    expect(r.result3).toBeUndefined();
    expect(r.result4).toMatch(/5% раствор детям не применять/);
    expect(f.formula({ ageYears: 0 }).result1).toBe(12.5);
    expect(f.formula({ ageYears: 17 }).result2).toBe(0.5);
  });

  it('взрослый: 50 мг = 1 мл 5%', () => {
    const r = f.formula({ ageYears: 18 });
    expect(r.result1).toBe(50);
    expect(r.result2).toBeUndefined();
    expect(r.result3).toBe(1);
    expect(r.result4).toMatch(/не более 0\.5 мл 5%/);
  });
});

describe('Фильтрум (внутрь)', () => {
  const f = byName('Фильтрум');

  it.each([
    [0, 0.5],
    [1, 0.5],
    [3, 0.5],
    [4, 1],
    [7, 1],
    [8, 1.5],
    [12, 1.5],
    [13, 2],
    [40, 2],
  ])('возраст %s лет — %s таб', (age, tabs) => {
    const r = f.formula({ ageYears: age });
    expect(r.result2).toBe(tabs);
    expect(r.result1).toBe(tabs * 400);
    expect(r.result3).toMatch(/внутрь за 1 ч до еды/);
  });
});

describe('Меглюмина натрия сукцинат (в/в капельно)', () => {
  const f = byName('Реамберин (меглюмина натрия сукцинат)');

  it('до 1 года противопоказан', () => {
    expect(f.formula({ weight: 8, ageYears: 0.9 })).toEqual({});
    expect(f.formula({ weight: 3.5, ageYears: 0 })).toEqual({});
  });

  it('ребёнок 20 кг: 120–200 мл/сут, 3–4 мл/мин', () => {
    const r = f.formula({ weight: 20, ageYears: 5 });
    expect(r.result1).toBe(120);
    expect(r.result2).toBe(200);
    expect(r.result3).toBeUndefined();
    expect(r.result4).toMatch(/1\.8–3 г сукцината/);
    expect(r.result4).toMatch(/3–4 мл\/мин/);
    expect(f.formula({ weight: 10, ageYears: 1 }).result1).toBe(60);
  });

  it('взрослый 70 кг: 700 мл/сут', () => {
    const r = f.formula({ weight: 70, ageYears: 18 });
    expect(r.result3).toBe(700);
    expect(r.result1).toBeUndefined();
    expect(r.result4).toMatch(/1–4\.5 мл\/мин/);
  });
});

describe('Парафин жидкий (справочная запись)', () => {
  const f = byName('Вазелиновое масло (парафин жидкий)');

  it('расчёт не выполняется, есть указания', () => {
    expect(f.inputs).toEqual({});
    expect(f.formula({})).toEqual({});
    expect(f.warnings.length).toBeGreaterThan(0);
    const res = computeResult(f, {});
    expect(res.info).toBe(true);
    expect(res.warnings).toBe(f.warnings);
  });
});

describe('Унитиол (в/м или п/к)', () => {
  const f = byName('Унитиол (димеркаптопропансульфонат натрия)');

  it('взрослый 70 кг: 350 мг = 7 мл', () => {
    const r = f.formula({ weight: 70, ageYears: 30 });
    close(r.result1, 350);
    close(r.result2, 7);
    expect(r.result3).toMatch(/^В\/м или п\/к/);
    expect(r.result3).toMatch(/Мышьяк, ртуть/);
    expect(r.result3).toMatch(/250–500 мг/);
  });

  it('предел 500 мг = 10 мл с 100 кг', () => {
    const r = f.formula({ weight: 120, ageYears: 30 });
    expect(r.result1).toBe(500);
    expect(r.result2).toBe(10);
    close(f.formula({ weight: 100, ageYears: 30 }).result1, 500);
    expect(f.limits.result1.max).toBe(500);
    expect(f.limits.result2.max).toBe(10);
  });

  it('до 18 лет — пометка о противопоказании', () => {
    const r = f.formula({ weight: 20, ageYears: 5 });
    close(r.result1, 100);
    close(r.result2, 2);
    expect(r.result3).toMatch(/До 18 лет противопоказан/);
    expect(f.formula({ weight: 60, ageYears: 18 }).result3).not.toMatch(/противопоказан/);
  });

  it('показание меняет кратность, но не дозу', () => {
    const m = f.formula({ weight: 70, ageYears: 30, indication: 'metals' });
    const g = f.formula({ weight: 70, ageYears: 30, indication: 'glycosides' });
    expect(g.result1).toBe(m.result1);
    expect(g.result3).toMatch(/Сердечные гликозиды: первые 2 сут/);
    expect(g.result3).not.toMatch(/ртуть/);
  });
});

describe('через движок: выбор показан в результате', () => {
  it('налоксон в/м — путь в choices', () => {
    const f = byName('Налоксон');
    const res = computeResult(f, { weight: '20', ageYears: '5', route: 'im' });
    expect(res.success).toBe(true);
    expect(res.choices).toEqual([
      { key: 'route', label: 'Путь введения', value: 'im', valueLabel: 'в/м' },
    ]);
  });

  it('пиридоксин: лимит зависит от показания', () => {
    const f = byName('Витамин B6 (пиридоксин)');
    const res = computeResult(f, { weight: '12', ageYears: '0.9', indication: 'pds' });
    expect(res.success).toBe(true);
    expect(res.items.find((i) => i.key === 'result1').status).toBe('atmax');
    const res2 = computeResult(f, { weight: '12', ageYears: '5' });
    expect(res2.items.find((i) => i.key === 'result1').status).toBe('ok');
  });
});
