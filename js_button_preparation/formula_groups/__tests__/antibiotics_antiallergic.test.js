import group, { ageInMonths, ceftriaxoneAdministration } from '../antibiotics_antiallergic';
import { isChoiceInput, ROUTES } from '../../routes';
import { computeResult, limitStatus } from '../../engine';

const byName = (name) => {
  const f = group.find((g) => g.name === name);
  if (!f) throw new Error(`нет записи ${name}`);
  return f;
};
const close = (v, expected) => expect(v).toBeCloseTo(expected, 6);
// Статус значения относительно limits записи (как в движке)
const status = (f, key, val) => limitStatus(val, f.limits[key]);

describe('группа антибиотиков и противоаллергических: структура', () => {
  it('содержит все записи в прежнем порядке', () => {
    expect(group.map((g) => g.name)).toEqual([
      'Цефтриаксон',
      'Хлорамфеникол',
      'Стрептомицин',
      'Хлоропирамин',
      'Дифенгидрамин',
    ]);
  });

  it.each(group.map((g) => [g.name, g]))('%s: поля контракта', (_, f) => {
    expect(typeof f.description).toBe('string');
    expect(f.description.length).toBeGreaterThan(0);
    expect(typeof f.formula).toBe('function');
    expect(Array.isArray(f.warnings)).toBe(true);
    expect(f.warnings.length).toBeGreaterThan(0);
    if (f.inputs.weight) {
      expect(f.inputs.weight).toBe('Вес (кг)');
      // Пустой ввод и нулевой вес — {} (расчёт не выполняется)
      expect(f.formula({})).toEqual({});
      expect(f.formula({ weight: 0, ageYears: 5, ageMonths: 0 })).toEqual({});
    }
    if (f.inputs.ageYears) expect(f.inputs.ageYears).toBe('Возраст (лет)');
    if (f.inputs.ageMonths) expect(f.inputs.ageMonths).toBe('Возраст (мес)');
    // Подписи есть у каждого числового результата; limits — только по существующим ключам
    Object.keys(f.units).forEach((k) => expect(f.labels[k]).toBeTruthy());
    Object.keys(f.limits).forEach((k) => expect(f.units[k]).toBeTruthy());
  });

  it('поля-выборы: коды путей из routes.js, значение по умолчанию — из вариантов', () => {
    group.forEach((f) => {
      Object.values(f.inputs)
        .filter(isChoiceInput)
        .forEach((c) => expect(c.choices.some((x) => x.value === c.default)).toBe(true));
      if (f.inputs.route) f.inputs.route.choices.forEach((c) => expect(c.label).toBe(ROUTES[c.value]));
    });
    const cef = byName('Цефтриаксон').inputs;
    expect(cef.route.choices.map((c) => c.value)).toEqual(['iv', 'im', 'io']);
    expect(cef.route.default).toBe('iv');
    expect(cef.indication.choices.map((c) => c.value)).toEqual(['general', 'meningitis']);
    expect(cef.indication.default).toBe('general');
    expect(byName('Хлорамфеникол').inputs.route.choices.map((c) => c.value)).toEqual(['iv', 'im']);
    expect(byName('Хлоропирамин').inputs.route.choices.map((c) => c.value)).toEqual(['im', 'iv']);
    expect(byName('Хлоропирамин').inputs.route.default).toBe('im');
    expect(byName('Дифенгидрамин').inputs.route.choices.map((c) => c.value)).toEqual(['im', 'iv']);
  });

  it('у препарата с одним путём путь указан в подписи результата', () => {
    const s = byName('Стрептомицин');
    expect(s.inputs.route).toBeUndefined();
    expect(s.labels.result1).toMatch(/в\/м/);
    expect(s.labels.result2).toMatch(/в\/м/);
  });

  it('ageInMonths: годы + месяцы сверх лет, противоречивый ввод — ошибка', () => {
    expect(ageInMonths(3, 6)).toEqual({ months: 42 });
    expect(ageInMonths(0, 18)).toEqual({ months: 18 });
    expect(ageInMonths(undefined, undefined)).toEqual({ months: 0 });
    expect(ageInMonths(2, 12).error).toMatch(/от 0 до 11/);
  });
});

describe('Цефтриаксон', () => {
  const f = byName('Цефтриаксон');
  const run = (inp) => f.formula({ ageMonths: 0, ...inp });

  it('ребёнок 5 лет 20 кг, общие инфекции, в/в: 50 мг/кг = 1000 мг, капельно 30 мин', () => {
    const r = run({ weight: 20, ageYears: 5 });
    expect(r.result1).toBe(1000);
    expect(r.result2).toBeUndefined();
    expect(r.result3).toBeUndefined();
    expect(r.result4).toMatch(/Капельно не менее 30 мин/);
    expect(r.result4).toMatch(/без кальция/);
    expect(r.result5).toBeUndefined();
  });

  it('взрослый 70 кг, общие инфекции, в/в: предел 2 г, можно струйно 2–4 мин', () => {
    const r = run({ weight: 70, ageYears: 30, route: 'iv' });
    expect(r.result1).toBe(2000);
    expect(status(f, 'result1', r.result1)).toBe('atmax');
    expect(r.result4).toMatch(/Струйно медленно, 2–4 мин/);
    expect(r.result5).toMatch(/предел 2 г/);
  });

  it('граница массы 40 кг: 2000 мг ровно, без отметки о пределе', () => {
    const r = run({ weight: 40, ageYears: 12 });
    expect(r.result1).toBe(2000);
    expect(r.result5).toBeUndefined();
  });

  it('менингит, ребёнок 5 лет 20 кг: 100 мг/кг = 2000 мг', () => {
    const r = run({ weight: 20, ageYears: 5, indication: 'meningitis' });
    expect(r.result1).toBeUndefined();
    expect(r.result2).toBeUndefined();
    expect(r.result3).toBe(2000);
    expect(r.result4).toMatch(/Капельно/);
  });

  it('менингит, взрослый 70 кг: предел 4 г', () => {
    const r = run({ weight: 70, ageYears: 30, indication: 'meningitis' });
    expect(r.result3).toBe(4000);
    expect(status(f, 'result3', r.result3)).toBe('atmax');
    expect(r.result5).toMatch(/предел 4 г/);
  });

  it('менингит, граница массы 40 кг: 4000 мг без отметки о пределе', () => {
    const r = run({ weight: 40, ageYears: 12, indication: 'meningitis' });
    expect(r.result3).toBe(4000);
    expect(r.result5).toBeUndefined();
  });

  it('новорождённый 3,5 кг, общие инфекции: 50 мг/кг, ограничение 14 дней и противопоказания', () => {
    const r = run({ weight: 3.5, ageYears: 0, ageMonths: 0 });
    close(r.result1, 175);
    expect(r.result5).toMatch(/до 14 дней — не более 50 мг\/кг\/сут/);
    expect(r.result5).toMatch(/41 нед/);
  });

  it('новорождённый 3,5 кг, менингит: строка до 14 дней 50 мг/кг и с 15 дней 100 мг/кг', () => {
    const r = run({ weight: 3.5, ageYears: 0, ageMonths: 0, indication: 'meningitis' });
    close(r.result2, 175);
    close(r.result3, 350);
    expect(r.result5).toMatch(/первые 14 дней/);
  });

  it('1 месяц — уже не новорождённый: только 100 мг/кг', () => {
    const r = run({ weight: 4.5, ageYears: 0, ageMonths: 1, indication: 'meningitis' });
    expect(r.result2).toBeUndefined();
    close(r.result3, 450);
    expect(r.result5).toBeUndefined();
  });

  it('в/м, ребёнок 5 лет: вода для инъекций, не более 1 г в одну мышцу', () => {
    const r = run({ weight: 20, ageYears: 5, route: 'im' });
    expect(r.result1).toBe(1000);
    expect(r.result4).toMatch(/воды для инъекций/);
    expect(r.result4).toMatch(/до 15 лет лидокаин/);
    expect(r.result4).toMatch(/Не более 1 г в одну мышцу\./);
  });

  it('в/м, менингит 20 кг: 2 г — две инъекции в разные мышцы, при шоке в/м нельзя', () => {
    const r = run({ weight: 20, ageYears: 5, route: 'im', indication: 'meningitis' });
    expect(r.result3).toBe(2000);
    expect(r.result4).toMatch(/на 2 инъекции/);
    expect(r.result4).toMatch(/септическом шоке в\/м не вводить/);
  });

  it('в/м, граница 15 лет: лидокаин допустим, в/в раствор с лидокаином нельзя', () => {
    const r14 = run({ weight: 50, ageYears: 14, ageMonths: 11, route: 'im' });
    expect(r14.result4).toMatch(/до 15 лет/);
    const r15 = run({ weight: 50, ageYears: 15, route: 'im' });
    expect(r15.result4).toMatch(/1% лидокаина/);
    expect(r15.result4).toMatch(/в\/в не вводить/);
  });

  it('в/к: доза как в/в, пометка о невозможности в/в доступа', () => {
    const iv = run({ weight: 20, ageYears: 5, indication: 'meningitis', route: 'iv' });
    const io = run({ weight: 20, ageYears: 5, indication: 'meningitis', route: 'io' });
    expect(io.result3).toBe(iv.result3);
    expect(io.result4).toMatch(/^В\/к — доза и раствор как для в\/в/);
  });

  it('ceftriaxoneAdministration: 50 мг/кг — граница капельного введения', () => {
    expect(ceftriaxoneAdministration('iv', 1000, 20, 60, 'general')).toMatch(/Капельно/);
    expect(ceftriaxoneAdministration('iv', 990, 20, 60, 'general')).toMatch(/Струйно/);
  });

  it('противоречивый возраст — примечание вместо дозы', () => {
    const r = f.formula({ weight: 20, ageYears: 5, ageMonths: 14 });
    expect(r.result1).toBeUndefined();
    expect(r.result5).toMatch(/от 0 до 11/);
  });

  it('через движок: показание и путь в результате', () => {
    const res = computeResult(
      f,
      { weight: '20', indication: 'meningitis', route: 'im' },
      { age: { years: '5', months: '0' } }
    );
    expect(res.success).toBe(true);
    expect(res.choices.map((c) => c.valueLabel)).toEqual(['Менингит / ГМИ', 'в/м']);
    expect(res.items.find((i) => i.key === 'result3').text).toBe('2000 мг');
  });

  it('через движок: по умолчанию общие инфекции в/в', () => {
    const res = computeResult(f, { weight: '20' }, { age: { years: '5', months: '' } });
    expect(res.success).toBe(true);
    expect(res.choices.map((c) => c.value)).toEqual(['general', 'iv']);
  });
});

describe('Хлорамфеникол', () => {
  const f = byName('Хлорамфеникол');

  it('ребёнок 5 лет 20 кг, в/в: 500 мг каждые 12 ч, 1000 мг/сут', () => {
    const r = f.formula({ weight: 20, ageYears: 5, route: 'iv' });
    expect(r.result1).toBe(500);
    expect(r.result2).toBe(1000);
    expect(r.result3).toMatch(/^В\/в струйно медленно/);
    expect(r.result4).toMatch(/75–100 мг\/кг\/сут/);
  });

  it('в/м: та же доза, растворитель для в/м', () => {
    const iv = f.formula({ weight: 20, ageYears: 5, route: 'iv' });
    const im = f.formula({ weight: 20, ageYears: 5, route: 'im' });
    expect(im.result1).toBe(iv.result1);
    expect(im.result3).toMatch(/^В\/м: 1 г в 2–3 мл/);
  });

  it('взрослый 70 кг: предел разовой 1 г, суточная 2 г', () => {
    const r = f.formula({ weight: 70, ageYears: 30 });
    expect(r.result1).toBe(1000);
    expect(r.result2).toBe(2000);
    expect(status(f, 'result1', r.result1)).toBe('atmax');
    expect(r.result4).toMatch(/предел разовой дозы 1 г/);
  });

  it('граница массы 40 кг: 1000 мг без отметки о пределе', () => {
    const r = f.formula({ weight: 40, ageYears: 12 });
    expect(r.result1).toBe(1000);
    expect(r.result4).not.toMatch(/предел/);
  });

  it('граница возраста 3 года: до 3 лет противопоказан', () => {
    const young = f.formula({ weight: 14, ageYears: 2.9 });
    expect(young.result1).toBeUndefined();
    expect(young.result4).toMatch(/до 3 лет противопоказан/);
    expect(f.formula({ weight: 14, ageYears: 3 }).result1).toBe(350);
  });
});

describe('Стрептомицин', () => {
  const f = byName('Стрептомицин');
  const run = (inp) => f.formula({ ageMonths: 0, ...inp });

  it('ребёнок 5 лет 20 кг: 20 мг/кг = 400 → предел 350 мг/сут, разовая ≤ 175 мг', () => {
    const r = run({ weight: 20, ageYears: 5 });
    expect(r.result1).toBe(350);
    expect(r.result2).toBe(175);
    expect(r.result3).toMatch(/Только в\/м/);
    expect(r.result4).toMatch(/предел суточной дозы 350 мг/);
    expect(r.result4).toMatch(/не менее чем на 2 введения/);
  });

  it('возрастные ступени до 2 лет', () => {
    const m2 = run({ weight: 5, ageYears: 0, ageMonths: 2 });
    expect(m2.result1).toBe(50); // 10 мг/кг
    expect(m2.result2).toBeUndefined();
    expect(m2.result4).toMatch(/До 1 года/);
    expect(run({ weight: 6, ageYears: 0, ageMonths: 3 }).result1).toBe(90); // 15 мг/кг
    expect(run({ weight: 8, ageYears: 0, ageMonths: 6 }).result1).toBe(160); // 20 мг/кг
    const y1 = run({ weight: 11, ageYears: 1, ageMonths: 11 });
    expect(y1.result1).toBe(220);
    expect(y1.result4).not.toMatch(/До 1 года/);
  });

  it('возрастные максимумы 2–14 лет', () => {
    expect(run({ weight: 12, ageYears: 2 }).result2).toBe(150);
    expect(run({ weight: 30, ageYears: 4 }).result1).toBe(300);
    expect(run({ weight: 25, ageYears: 7 }).result2).toBe(200);
    expect(run({ weight: 30, ageYears: 9 }).result1).toBe(400);
    const y10 = run({ weight: 30, ageYears: 10 });
    expect(y10.result1).toBe(500);
    expect(y10.result2).toBe(250);
  });

  it('подросток 15 лет 40 кг: 800 мг/сут, разовая ≤ 500 мг', () => {
    const r = run({ weight: 40, ageYears: 15 });
    expect(r.result1).toBe(800);
    expect(r.result2).toBe(500);
  });

  it('взрослый 70 кг: 1000 мг/сут; < 50 кг или старше 60 лет — 750 мг', () => {
    const r = run({ weight: 70, ageYears: 30 });
    expect(r.result1).toBe(1000);
    expect(r.result2).toBe(1000);
    expect(r.result4).toMatch(/до 2 г\/сут/);
    expect(run({ weight: 45, ageYears: 30 }).result1).toBe(750);
    expect(run({ weight: 70, ageYears: 61 }).result1).toBe(750);
    expect(run({ weight: 70, ageYears: 60 }).result1).toBe(1000);
  });

  it('противоречивый возраст — примечание', () => {
    expect(f.formula({ weight: 20, ageYears: 5, ageMonths: 12 }).result4).toMatch(/от 0 до 11/);
  });
});

describe('Хлоропирамин', () => {
  const f = byName('Хлоропирамин');
  const run = (inp) => f.formula({ ageMonths: 0, ...inp });

  it('ребёнок 5 лет 20 кг, в/м: 10 мг = 0,5 мл', () => {
    const r = run({ weight: 20, ageYears: 5, route: 'im' });
    expect(r.result1).toBe(10);
    expect(r.result2).toBe(0.5);
    expect(r.result3).toBe('В/м.');
    expect(r.result4).toBeUndefined();
  });

  it('в/в: та же доза, только в тяжёлых случаях медленно', () => {
    const r = run({ weight: 20, ageYears: 5, route: 'iv' });
    expect(r.result1).toBe(10);
    expect(r.result3).toMatch(/только в острых тяжёлых случаях/);
  });

  it('взрослый 70 кг: 20 мг = 1 мл', () => {
    const r = run({ weight: 70, ageYears: 30 });
    expect(r.result1).toBe(20);
    expect(r.result2).toBe(1);
    expect(r.result4).toMatch(/1–2 мл в сутки/);
  });

  it('границы возраста: новорождённый противопоказан, 1 мес — 0,25 мл, 6 лет — диапазон', () => {
    const n = run({ weight: 3.5, ageYears: 0, ageMonths: 0 });
    expect(n.result1).toBeUndefined();
    expect(n.result4).toMatch(/противопоказан/);
    const m1 = run({ weight: 4.5, ageYears: 0, ageMonths: 1 });
    expect(m1.result1).toBe(5);
    expect(m1.result2).toBe(0.25);
    expect(run({ weight: 10, ageYears: 1 }).result1).toBe(10);
    expect(run({ weight: 20, ageYears: 6 }).result4).toMatch(/6–14 лет/);
    expect(run({ weight: 45, ageYears: 14 }).result1).toBe(20);
  });

  it('предел 2 мг/кг при малой массе', () => {
    const r = run({ weight: 2, ageYears: 0, ageMonths: 2 });
    close(r.result1, 4);
    close(r.result2, 0.2);
    expect(r.result4).toMatch(/2 мг\/кг/);
  });
});

describe('Дифенгидрамин', () => {
  const f = byName('Дифенгидрамин');
  const run = (inp) => f.formula({ ageMonths: 0, ...inp });

  it('без веса: в записи нет поля веса', () => {
    expect(f.inputs.weight).toBeUndefined();
  });

  it('ребёнок 5 лет, в/м: 10 мг = 1 мл, суточный максимум 60 мг', () => {
    const r = run({ ageYears: 5, route: 'im' });
    expect(r.result1).toBe(10);
    expect(r.result2).toBe(1);
    expect(r.result3).toBe(60);
    expect(r.result4).toMatch(/Глубоко в\/м/);
    expect(r.result5).toMatch(/4–6 лет/);
  });

  it('в/в: та же доза, предупреждение о снижении АД', () => {
    const r = run({ ageYears: 5, route: 'iv' });
    expect(r.result1).toBe(10);
    expect(r.result4).toMatch(/В\/в медленно/);
  });

  it('взрослый: 10 мг, не более 200 мг/сут', () => {
    const r = run({ ageYears: 30 });
    expect(r.result1).toBe(10);
    expect(r.result3).toBe(200);
    expect(r.result5).toMatch(/не более 200 мг\/сут/);
    expect(r.result5).not.toMatch(/6–8 ч/);
  });

  it('границы возраста', () => {
    expect(run({ ageYears: 0, ageMonths: 6 }).result5).toMatch(/до 7 месяцев противопоказан/);
    expect(run({ ageYears: 0, ageMonths: 6 }).result1).toBeUndefined();
    const m7 = run({ ageYears: 0, ageMonths: 7 });
    close(m7.result1, 3);
    expect(m7.result3).toBe(20);
    expect(run({ ageYears: 1 }).result3).toBe(40);
    expect(run({ ageYears: 3, ageMonths: 11 }).result3).toBe(40);
    expect(run({ ageYears: 4 }).result3).toBe(60);
    expect(run({ ageYears: 7 }).result1).toBe(15);
    expect(run({ ageYears: 14, ageMonths: 11 }).result3).toBe(120);
    expect(run({ ageYears: 15 }).result3).toBe(200);
  });

  it('через движок: путь в результате', () => {
    const res = computeResult(f, { route: 'iv' }, { age: { years: '5', months: '' } });
    expect(res.success).toBe(true);
    expect(res.choices[0].valueLabel).toBe('в/в');
  });
});
