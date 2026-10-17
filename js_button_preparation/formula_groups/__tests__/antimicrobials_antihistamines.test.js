import group from '../antimicrobials_antihistamines';
import { isChoiceInput, ROUTES } from '../../routes';
import { computeResult, searchFormulas } from '../../engine';

const byName = (start) => {
  const f = group.find((x) => x.name.startsWith(start));
  if (!f) throw new Error(`нет записи «${start}»`);
  return f;
};
const close = (a, b) => expect(a).toBeCloseTo(b, 6);
const limitsOf = (f, clean) => (typeof f.limits === 'function' ? f.limits(clean) : f.limits || {});

const tavegil = byName('Тавегил');
const cefotaxime = byName('Цефотаксим');
const penicillin = byName('Бензилпенициллин');

describe('контракт записей группы', () => {
  test('три препарата, название — привычное, затем МНН', () => {
    expect(group.map((f) => f.name)).toEqual([
      'Тавегил (клемастин)',
      'Цефотаксим',
      'Бензилпенициллин',
    ]);
  });

  test.each(group.map((f) => [f.name, f]))('%s: поля записи', (_n, f) => {
    expect(f.description.length).toBeGreaterThan(20);
    expect(typeof f.formula).toBe('function');
    expect(f.warnings.length).toBeGreaterThan(0);
    expect(f.inputs.weight).toBe('Вес (кг)');
    expect(f.inputs.ageYears).toBe('Возраст (лет)');
    expect(f.inputs.ageMonths).toBe('Возраст (мес)');
    Object.keys(f.units).forEach((k) => expect(f.labels[k]).toBeTruthy());
    expect(f.formula({})).toEqual({});
  });

  test('поля-выборы: значение по умолчанию из вариантов, пути — из routes', () => {
    group.forEach((f) =>
      Object.values(f.inputs)
        .filter(isChoiceInput)
        .forEach((c) => expect(c.choices.some((x) => x.value === c.default)).toBe(true)),
    );
    expect(tavegil.inputs.route.choices.map((c) => c.value)).toEqual(['im', 'iv']);
    expect(cefotaxime.inputs.route.choices.map((c) => c.value)).toEqual(['iv', 'im', 'io']);
    expect(penicillin.inputs.route.choices.map((c) => c.value)).toEqual(['iv', 'im']);
    expect(penicillin.inputs.route.default).toBe('iv');
    tavegil.inputs.route.choices.forEach((c) => expect(c.label).toBe(ROUTES[c.value]));
  });

  test('неизвестный путь или показание — расчёт не выполняется', () => {
    const p = { weight: 20, ageYears: 6, ageMonths: 0 };
    expect(tavegil.formula({ ...p, route: 'sc' })).toEqual({});
    expect(cefotaxime.formula({ ...p, route: 'po' })).toEqual({});
    expect(cefotaxime.formula({ ...p, indication: 'x' })).toEqual({});
    expect(penicillin.formula({ ...p, route: 'io' })).toEqual({});
    expect(penicillin.formula({ ...p, indication: 'x' })).toEqual({});
  });

  test('синонимы для поиска', () => {
    const first = (q) => searchFormulas(group, q)[0].formula.name;
    expect(first('клемастин')).toBe(tavegil.name);
    expect(first('тавегил')).toBe(tavegil.name);
    expect(first('клафоран')).toBe(cefotaxime.name);
    expect(first('пенициллин')).toBe(penicillin.name);
  });
});

describe('Тавегил (клемастин)', () => {
  const run = (weight, ageYears, ageMonths = 0, route = 'im') =>
    tavegil.formula({ weight, ageYears, ageMonths, route });

  test('взрослый: 2 мг = 2 мл, в/м и в/в', () => {
    const r = run(70, 40);
    close(r.result1, 2);
    close(r.result2, 2);
    expect(r.result4).toBeUndefined();
    const iv = run(70, 40, 0, 'iv');
    close(iv.result1, 2);
    expect(iv.result3).toMatch(/2–3 мин/);
  });

  test('ребёнок 20 кг: 0,025 мг/кг/сут в 2 введения = 0,25 мг на введение', () => {
    const r = run(20, 6);
    close(r.result1, 0.25);
    close(r.result2, 0.25);
    expect(r.result4).toMatch(/0,5 мг\/сут/);
  });

  test('ребёнку в/в — не считается, подсказка выбрать в/м', () => {
    const r = run(20, 6, 0, 'iv');
    expect(r.result1).toBeUndefined();
    expect(r.result4).toMatch(/только в\/м/);
  });

  test('границы возраста: до 1 года — нет, с 1 года — да; 17 лет — ребёнок, 18 — взрослый', () => {
    expect(run(9, 0, 11)).toEqual({});
    close(run(10, 1).result1, 0.125);
    close(run(60, 17).result1, 0.75);
    close(run(60, 18).result1, 2);
  });

  test('детская доза не выше взрослой 2 мг', () => {
    const r = run(200, 17);
    close(r.result1, 2);
    expect(r.result4).toMatch(/взрослая доза/);
    expect(limitsOf(tavegil).result1.max).toBe(2);
  });
});

describe('Цефотаксим', () => {
  const run = (weight, ageYears, ageMonths = 0, indication = 'general', route = 'iv') =>
    cefotaxime.formula({ weight, ageYears, ageMonths, indication, route });

  test('ребёнок 20 кг, пневмония: 50 мг/кг = 1 г, 4 мл, каждые 8 ч (150 мг/кг/сут)', () => {
    const r = run(20, 6);
    close(r.result1, 1000);
    close(r.result2, 4);
    close(r.result3, 3000);
    expect(r.result4).toMatch(/^Каждые 8 ч \(150 мг\/кг\/сут\); допустимо каждые 12 ч/);
    expect(r.result4).toMatch(/3–5 мин/);
    expect(r.result5).toBeUndefined();
  });

  test('ребёнок 20 кг, менингит/ГМИ: 50 мг/кг каждые 6 ч = 200 мг/кг/сут', () => {
    const r = run(20, 6, 0, 'severe');
    close(r.result1, 1000);
    close(r.result3, 4000);
    expect(r.result4).toMatch(/^Каждые 6 ч \(200 мг\/кг\/сут\)/);
  });

  test('ребёнок до 50 кг: разовая не выше 2 г, примечание с фактическими мг/кг/сут', () => {
    const g = run(45, 11);
    close(g.result1, 2000);
    close(g.result3, 6000);
    expect(g.result5).toMatch(/предел разовой дозы 2 г: 133 мг\/кг\/сут при 3 введениях/);
    const s = run(48, 11, 0, 'severe');
    close(s.result1, 2000);
    close(s.result3, 8000);
    // 30 кг — без предела: 150 мг/кг/сут, как в КР
    close(run(30, 9).result1, 1500);
  });

  test('с 12 лет и 50 кг — взрослые дозы 1 г и 2 г; разница на пороге — как в КР 714_2', () => {
    close(run(70, 40).result1, 1000);
    close(run(70, 40).result3, 3000);
    expect(run(70, 40).result4).toMatch(/при более тяжёлом течении — 2 г/);
    close(run(70, 40, 0, 'severe').result1, 2000);
    close(run(70, 40, 0, 'severe').result3, 8000);
    close(run(49.9, 13).result1, 2000);
    close(run(50, 13).result1, 1000);
    close(run(50, 11, 11).result1, 2000);
    close(run(50, 12).result1, 1000);
  });

  test('новорождённый 3,5 кг: 25 мг/кг каждые 12 ч; тяжёлые — 50 мг/кг каждые 8 ч', () => {
    const g = run(3.5, 0, 0);
    close(g.result1, 87.5);
    close(g.result2, 0.35);
    expect(g.result3).toBeUndefined();
    expect(g.result4).toMatch(/^Каждые 12 ч \(50 мг\/кг\/сут\)/);
    expect(g.result5).toMatch(/совместим с кальцием/);
    const s = run(3.5, 0, 0, 'severe');
    close(s.result1, 175);
    expect(s.result4).toMatch(/^Каждые 8 ч \(150 мг\/кг\/сут; КР — 150–200/);
    expect(s.result5).toMatch(/Недоношенным в первую неделю жизни — каждые 12 ч/);
    // 1 месяц — уже детский режим
    close(run(4.5, 0, 1).result1, 225);
    expect(run(4.5, 0, 1).result4).toMatch(/^Каждые 8 ч/);
  });

  test('новорождённый: ошибка ввода массы не даёт дозу выше взрослой', () => {
    close(run(100, 0, 0, 'severe').result1, 2000);
  });

  test('в/м: растворитель, запрет в/м при шоке, больше 5 мл — в две мышцы', () => {
    expect(run(20, 6, 0, 'general', 'im').result4).toMatch(/В\/м глубоко/);
    expect(run(20, 6, 0, 'general', 'im').result4).not.toMatch(/две инъекции/);
    expect(run(20, 6, 0, 'severe', 'im').result4).toMatch(
      /При шоке в\/м не вводить — только в\/в или внутрикостно/,
    );
    expect(run(70, 40, 0, 'severe', 'im').result4).toMatch(/8 мл — больше 5 мл/);
    expect(run(20, 6, 0, 'severe', 'io').result4).toMatch(/^Каждые 6 ч.*В\/к \(внутрикостно\)/);
  });

  test('ошибка возраста — сообщение', () => {
    expect(run(20, 6, 14).result5).toMatch(/Месяцы указываются сверх полных лет/);
  });

  test('ГМИ на догоспитальном этапе — в предупреждениях', () => {
    expect(cefotaxime.warnings[0]).toMatch(/геморрагической сыпи/);
  });
});

describe('Бензилпенициллин', () => {
  const run = (weight, ageYears, ageMonths = 0, indication = 'severe', route = 'im') =>
    penicillin.formula({ weight, ageYears, ageMonths, indication, route });

  test('ГМИ/менингит, 20 кг: 50 тыс. ЕД/кг каждые 4 ч = 1000 тыс. ЕД, 2 мл в/м', () => {
    const r = run(20, 6);
    close(r.result1, 1000);
    close(r.result2, 2);
    close(r.result3, 6000);
    expect(r.result4).toMatch(/^Каждые 4 ч/);
    expect(r.result4).toMatch(/Флаконов по 1 млн ЕД на введение: 1\./);
  });

  test('взрослый 90 кг: разовая не выше 4 млн ЕД', () => {
    const r = run(90, 40);
    close(r.result1, 4000);
    close(r.result3, 24000);
    expect(r.result5).toMatch(/4 млн ЕД/);
  });

  test('в/в: 200 тыс. ЕД/мл и оговорка о кратности по инструкции', () => {
    const r = run(20, 6, 0, 'severe', 'iv');
    close(r.result2, 5);
    expect(r.result5).toMatch(/1–2 раза в сутки/);
  });

  test('средняя тяжесть: до 1 года 100, старше — 50 тыс. ЕД/кг/сут в 4 введения', () => {
    close(run(8, 0, 6, 'general').result1, 200);
    close(run(20, 6, 0, 'general').result1, 250);
    close(run(20, 6, 0, 'general').result3, 1000);
    close(run(70, 40, 0, 'general').result1, 1000);
  });

  test('в/м: растворитель с учётом объёма порошка, запрет в/м при шоке, больше 5 мл — две мышцы', () => {
    const r = run(20, 6);
    expect(r.result4).toMatch(/1,6 мл .*около 2 мл \(500 тыс\. ЕД\/мл\)/);
    expect(r.result5).toMatch(/При шоке в\/м не вводить/);
    expect(r.result4).not.toMatch(/две инъекции/);
    expect(run(90, 40).result4).toMatch(/8 мл — больше 5 мл/);
    expect(run(20, 6, 0, 'severe', 'iv').result4).toMatch(/4,6 мл .*около 5 мл/);
    expect(run(20, 6, 0, 'general').result5).toBeUndefined();
  });

  test('новорождённым — не считается, ссылка на цефотаксим; с 1 месяца — считается', () => {
    const r = run(3.5, 0, 0);
    expect(r.result1).toBeUndefined();
    expect(r.result5).toMatch(/цефотаксим/);
    close(run(4.5, 0, 1).result1, 225);
  });

  test('порог 12 лет / 50 кг при средней тяжести: 1 млн ЕД взрослым, по массе — детям', () => {
    close(run(49.9, 13, 0, 'general').result1, 623.75);
    close(run(50, 13, 0, 'general').result1, 1000);
  });

  test('единица — тысячи ЕД, в выводе движка «тыс. ЕД»', () => {
    const r = computeResult(
      penicillin,
      { weight: '20', indication: 'severe', route: 'im' },
      { age: { years: '6', months: '0' } },
    );
    expect(r.success).toBe(true);
    expect(r.items[0].text).toBe('1000 тыс. ЕД');
  });
});
