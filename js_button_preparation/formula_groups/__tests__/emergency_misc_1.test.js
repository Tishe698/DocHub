import group, {
  magnesiumLimits,
  droperidolLimits,
  chlorpromazineLimits,
} from '../emergency_misc_1';
import { isChoiceInput, ROUTES } from '../../routes';
import { computeResult } from '../../engine';

const byName = (name) => {
  const f = group.find((g) => g.name === name);
  if (!f) throw new Error(`нет записи ${name}`);
  return f;
};
const close = (v, expected) => expect(v).toBeCloseTo(expected, 6);
const limitsOf = (f, clean) => (typeof f.limits === 'function' ? f.limits(clean) : f.limits);

describe('группа «прочее неотложное, часть 1»: структура', () => {
  it('содержит все записи в прежнем порядке', () => {
    expect(group.map((g) => g.name)).toEqual([
      'Кальция глюконат',
      'Магния сульфат',
      'Кетамин',
      'Метамизол натрия',
      'Метоклопрамид',
      'Дроперидол',
      'Хлорпромазин',
      'Галоперидол',
    ]);
  });

  it.each(group.map((g) => [g.name, g]))('%s: поля контракта и пустой ввод', (_, f) => {
    expect(typeof f.description).toBe('string');
    expect(f.description.length).toBeGreaterThan(0);
    expect(typeof f.formula).toBe('function');
    expect(Array.isArray(f.warnings)).toBe(true);
    expect(f.warnings.length).toBeGreaterThan(0);
    if (f.inputs.weight) expect(f.inputs.weight).toBe('Вес (кг)');
    if (f.inputs.ageYears) expect(f.inputs.ageYears).toBe('Возраст (лет)');
    if (f.inputs.ageMonths) expect(f.inputs.ageMonths).toBe('Возраст (мес)');
    // Пустой ввод — {} (движок по нему показывает предупреждения)
    expect(f.formula({})).toEqual({});
    if (f.inputs.weight) expect(f.formula({ weight: 0, ageYears: 30, ageMonths: 0 })).toEqual({});
    Object.keys(f.units).forEach((k) => expect(f.labels[k]).toBeTruthy());
  });

  it('поля-выборы: коды путей из routes.js, по умолчанию — из вариантов', () => {
    group.forEach((f) => {
      Object.values(f.inputs)
        .filter(isChoiceInput)
        .forEach((c) => {
          expect(c.choices.some((x) => x.value === c.default)).toBe(true);
        });
    });
    const routes = {
      Кетамин: [['iv', 'im'], 'iv'],
      'Метамизол натрия': [['im', 'iv'], 'im'],
      Метоклопрамид: [['iv', 'im'], 'iv'],
      Дроперидол: [['iv', 'im'], 'iv'],
      Хлорпромазин: [['im', 'iv'], 'im'],
    };
    Object.entries(routes).forEach(([name, [codes, def]]) => {
      const r = byName(name).inputs.route;
      expect(r.label).toBe('Путь введения');
      expect(r.choices.map((c) => c.value)).toEqual(codes);
      r.choices.forEach((c) => expect(c.label).toBe(ROUTES[c.value]));
      expect(r.default).toBe(def);
    });
    const mg = byName('Магния сульфат').inputs.indication;
    expect(mg.label).toBe('Показание');
    expect(mg.choices.map((c) => c.value)).toEqual(['asthma', 'torsades', 'eclampsia']);
    expect(mg.default).toBe('asthma');
  });

  it('у препаратов с одним путём путь указан в подписи результата', () => {
    expect(byName('Кальция глюконат').labels.result1).toMatch(/в\/в/);
    expect(byName('Магния сульфат').labels.result1).toMatch(/в\/в/);
    expect(byName('Галоперидол').labels.result1).toMatch(/в\/м/);
    expect(byName('Кальция глюконат').inputs.route).toBeUndefined();
    expect(byName('Галоперидол').inputs.route).toBeUndefined();
  });
});

describe('Кальция глюконат', () => {
  const f = byName('Кальция глюконат');

  it('ребёнок 20 кг: 0.5 мл/кг = 10 мл = 1 г, на пределе', () => {
    const r = f.formula({ weight: 20 });
    close(r.result1, 1000);
    close(r.result2, 10);
    expect(r.result3).toMatch(/в\/в медленно/);
    expect(r.result3).not.toMatch(/Достигнут/);
  });

  it('ребёнок 10 кг: 5 мл (500 мг)', () => {
    const r = f.formula({ weight: 10 });
    close(r.result1, 500);
    close(r.result2, 5);
    expect(r.result3).not.toMatch(/30 мл/);
  });

  it('взрослый 70 кг: предел 10 мл и подсказка про 30 мл суммарно', () => {
    const r = f.formula({ weight: 70 });
    close(r.result2, 10);
    expect(r.result3).toMatch(/Достигнут предел/);
    expect(r.result3).toMatch(/30 мл/);
    expect(f.limits.result1.max).toBe(1000);
    expect(f.limits.result2.max).toBe(10);
  });

  it('граница 38 кг — как взрослым', () => {
    expect(f.formula({ weight: 37.9 }).result3).not.toMatch(/30 мл/);
    expect(f.formula({ weight: 38 }).result3).toMatch(/30 мл/);
  });
});

describe('Магния сульфат', () => {
  const f = byName('Магния сульфат');

  it('астма, ребёнок 20 кг: 50 мг/кг = 1 г = 4 мл, за 20 мин', () => {
    const r = f.formula({ weight: 20, indication: 'asthma' });
    close(r.result1, 1000);
    close(r.result2, 4);
    expect(r.result3).toBeUndefined();
    expect(r.result4).toMatch(/за 20 мин/);
  });

  it('по умолчанию — астма', () => {
    expect(f.formula({ weight: 20 })).toEqual(f.formula({ weight: 20, indication: 'asthma' }));
  });

  it('астма, взрослый 70 кг: максимум 2 г (8 мл)', () => {
    const r = f.formula({ weight: 70, indication: 'asthma' });
    close(r.result1, 2000);
    close(r.result2, 8);
    expect(r.result4).toMatch(/Достигнут максимум 2 г/);
  });

  it('граница 40 кг: ровно 2 г без пометки о превышении', () => {
    const r = f.formula({ weight: 40, indication: 'asthma' });
    close(r.result1, 2000);
    expect(r.result4).not.toMatch(/Достигнут/);
  });

  it('torsades: та же доза, скорость по наличию пульса, в/к без пульса', () => {
    const r = f.formula({ weight: 10, indication: 'torsades' });
    close(r.result1, 500);
    close(r.result2, 2);
    expect(r.result4).toMatch(/10–20 мин/);
    expect(r.result4).toMatch(/внутрикостно/);
    const a = f.formula({ weight: 80, indication: 'torsades' });
    close(a.result1, 2000);
  });

  it('эклампсия: фиксированная схема КР 2021 — 4 г (16 мл), далее 1 г/ч = 4 мл/ч', () => {
    const r = f.formula({ weight: 70, indication: 'eclampsia' });
    expect(r.result1).toBe(4000);
    expect(r.result2).toBe(16);
    expect(r.result3).toBe(4);
    expect(f.units.result3).toBe('мл/ч');
    expect(r.result4).toMatch(/за 10 мин/);
    expect(f.formula({ weight: 55, indication: 'eclampsia' })).toEqual(r);
  });

  it('пределы зависят от показания', () => {
    expect(magnesiumLimits({ indication: 'asthma' })).toEqual({
      result1: { max: 2000 },
      result2: { max: 8 },
    });
    expect(magnesiumLimits({ indication: 'torsades' }).result1.max).toBe(2000);
    expect(magnesiumLimits({ indication: 'eclampsia' })).toEqual({});
    expect(magnesiumLimits({}).result1.max).toBe(2000);
  });

  it('движок: эклампсия без бейджа превышения, показание в результате', () => {
    const res = computeResult(f, { weight: '70', indication: 'eclampsia' });
    expect(res.success).toBe(true);
    expect(res.items.every((i) => i.status === 'ok' || i.status === 'info')).toBe(true);
    expect(res.choices[0]).toMatchObject({ label: 'Показание', value: 'eclampsia' });
    const asthma = computeResult(f, { weight: '70', indication: 'asthma' });
    expect(asthma.items.find((i) => i.key === 'result1').status).toBe('atmax');
  });
});

describe('Кетамин', () => {
  const f = byName('Кетамин');

  it('в/в, ребёнок 20 кг: 2 мг/кг = 40 мг, 0.8 мл 5% / 4 мл 1%, верхняя 60 мг', () => {
    const r = f.formula({ weight: 20, route: 'iv' });
    close(r.result1, 40);
    close(r.result2, 0.8);
    close(r.result3, 4);
    close(r.result4, 60);
    expect(r.result5).toMatch(/60 с/);
    expect(r.result5).toMatch(/10 мг\/мл/);
  });

  it('по умолчанию — в/в', () => {
    expect(f.formula({ weight: 20 })).toEqual(f.formula({ weight: 20, route: 'iv' }));
  });

  it('в/в, взрослый 70 кг: 140 мг, верхняя 210 мг', () => {
    const r = f.formula({ weight: 70, route: 'iv' });
    close(r.result1, 140);
    close(r.result2, 2.8);
    close(r.result4, 210);
  });

  it('в/м, ребёнок 10 кг: 4 мг/кг = 40 мг (0.8 мл), верхняя 8 мг/кг, без разведения', () => {
    const r = f.formula({ weight: 10, route: 'im' });
    close(r.result1, 40);
    close(r.result2, 0.8);
    expect(r.result3).toBeUndefined();
    close(r.result4, 80);
    expect(r.result5).toMatch(/В\/м/);
  });

  it('в/м, взрослый 80 кг: 320 мг (6.4 мл)', () => {
    const r = f.formula({ weight: 80, route: 'im' });
    close(r.result1, 320);
    close(r.result2, 6.4);
  });

  it('новорождённый 3 кг в/в: 6 мг, 0.12 мл 5% / 0.6 мл 1%', () => {
    const r = f.formula({ weight: 3, route: 'iv' });
    close(r.result1, 6);
    close(r.result2, 0.12);
    close(r.result3, 0.6);
  });
});

describe('Метамизол натрия', () => {
  const f = byName('Метамизол натрия');

  it('в/м, ребёнок 5 лет 20 кг: 10 мг/кг = 200 мг = 0.4 мл', () => {
    const r = f.formula({ weight: 20, ageYears: 5, ageMonths: 0, route: 'im' });
    close(r.result1, 200);
    close(r.result2, 0.4);
    expect(r.result3).toMatch(/5–10 мг\/кг/);
  });

  it('в/в, ребёнок 5 лет 20 кг: та же доза, скорость не быстрее 1 мл/мин', () => {
    const r = f.formula({ weight: 20, ageYears: 5, ageMonths: 0, route: 'iv' });
    close(r.result1, 200);
    expect(r.result3).toMatch(/1 мл\/мин/);
  });

  it('по умолчанию — в/м', () => {
    const a = { weight: 20, ageYears: 5, ageMonths: 0 };
    expect(f.formula(a)).toEqual(f.formula({ ...a, route: 'im' }));
  });

  it('взрослый 70 кг: 700 мг, примечание «с 15 лет»', () => {
    const r = f.formula({ weight: 70, ageYears: 30, ageMonths: 0, route: 'im' });
    close(r.result1, 700);
    expect(r.result3).toMatch(/С 15 лет/);
  });

  it('120 кг: максимум 1 г (2 мл)', () => {
    const r = f.formula({ weight: 120, ageYears: 40, ageMonths: 0, route: 'iv' });
    close(r.result1, 1000);
    close(r.result2, 2);
    expect(r.result3).toMatch(/Достигнут максимум/);
    expect(f.limits.result1.max).toBe(1000);
  });

  it('границы: до 3 мес и масса < 5 кг — расчёт не выполняется', () => {
    expect(f.formula({ weight: 6, ageYears: 0, ageMonths: 2, route: 'im' })).toEqual({});
    expect(f.formula({ weight: 4.9, ageYears: 0, ageMonths: 6, route: 'im' })).toEqual({});
    const r = f.formula({ weight: 6, ageYears: 0, ageMonths: 3, route: 'im' });
    close(r.result1, 60);
    expect(r.result3).toMatch(/только в\/м/);
  });

  it('3–12 мес: в/в не рассчитывается, с 12 мес — можно', () => {
    expect(f.formula({ weight: 8, ageYears: 0, ageMonths: 11, route: 'iv' })).toEqual({});
    const r = f.formula({ weight: 10, ageYears: 1, ageMonths: 0, route: 'iv' });
    close(r.result1, 100);
  });

  it('движок с возрастом пациента «лет + мес»: 8 мес — в/м считается, в/в — нет', () => {
    const im = computeResult(f, { weight: '8', route: 'im' }, { age: { years: '0', months: '8' } });
    expect(im.success).toBe(true);
    expect(im.items.find((i) => i.key === 'result1').value).toBeCloseTo(80, 6);
    expect(im.choices[0]).toMatchObject({ label: 'Путь введения', valueLabel: 'в/м' });
    const iv = computeResult(f, { weight: '8', route: 'iv' }, { age: { years: '0', months: '8' } });
    expect(iv.info).toBe(true);
  });

  it('месяцы сверх лет больше 11 — ошибка возраста', () => {
    expect(f.formula({ weight: 15, ageYears: 2, ageMonths: 14 }).result1).toMatch(/Месяцы/);
  });
});

describe('Метоклопрамид', () => {
  const f = byName('Метоклопрамид');

  it('в/в, ребёнок 5 лет 20 кг: 0.1 мг/кг = 2 мг = 0.4 мл, суточно ≤10 мг', () => {
    const r = f.formula({ weight: 20, ageYears: 5, route: 'iv' });
    close(r.result1, 2);
    close(r.result2, 0.4);
    close(r.result3, 10);
    expect(r.result4).toMatch(/не менее 3 мин/);
  });

  it('по умолчанию — в/в', () => {
    expect(f.formula({ weight: 20, ageYears: 5 })).toEqual(
      f.formula({ weight: 20, ageYears: 5, route: 'iv' }),
    );
  });

  it('в/м, ребёнок: пометка о различии инструкций', () => {
    const r = f.formula({ weight: 20, ageYears: 5, route: 'im' });
    close(r.result1, 2);
    expect(r.result4).toMatch(/МЭЗ/);
  });

  it('взрослый 70 кг: 10 мг, не более 30 мг/сут', () => {
    const r = f.formula({ weight: 70, ageYears: 30, route: 'im' });
    expect(r.result1).toBe(10);
    expect(r.result2).toBe(2);
    close(r.result3, 30);
    expect(r.result4).toMatch(/до 3 раз в сутки, не более 30 мг\/сут/);
    expect(f.limits.result3).toBeUndefined();
  });

  it('взрослый 50 кг: суточный максимум 0.5 мг/кг = 25 мг, и в тексте тот же предел (n27)', () => {
    const r = f.formula({ weight: 50, ageYears: 40, route: 'iv' });
    close(r.result3, 25);
    expect(r.result4).toMatch(/не более 25 мг\/сут/);
    expect(r.result4).not.toMatch(/не более 30 мг/);
  });

  it('через движок: строка «Суточный максимум» не получает пометку «на пределе» (n28)', () => {
    const res = computeResult(f, { weight: '70', ageYears: '30', route: 'iv' });
    expect(res.success).toBe(true);
    expect(res.items.find((i) => i.key === 'result3').status).not.toBe('atmax');
    // Разовая 10 мг — действительно высшая разовая по «Церукалу»: предел на строке дозы остаётся
    expect(res.items.find((i) => i.key === 'result1').status).toBe('atmax');
  });

  it('подросток 15 лет: 50 кг — по весу 5 мг; более 60 кг — 10 мг', () => {
    close(f.formula({ weight: 50, ageYears: 15, route: 'iv' }).result1, 5);
    close(f.formula({ weight: 60, ageYears: 15, route: 'iv' }).result1, 6);
    expect(f.formula({ weight: 61, ageYears: 15, route: 'iv' }).result1).toBe(10);
  });

  it('границы возраста: до 2 лет — не рассчитывается; 2–3 года — с осторожностью', () => {
    expect(f.formula({ weight: 11, ageYears: 1.9, route: 'iv' })).toEqual({});
    const r = f.formula({ weight: 12, ageYears: 2, route: 'iv' });
    close(r.result1, 1.2);
    expect(r.result4).toMatch(/2–3 года/);
    expect(f.formula({ weight: 14, ageYears: 3, route: 'iv' }).result4).not.toMatch(/2–3 года/);
  });
});

describe('Дроперидол', () => {
  const f = byName('Дроперидол');

  it('в/в, ребёнок 5 лет 20 кг: 0.1 мг/кг = 2 мг = 0.8 мл', () => {
    const r = f.formula({ weight: 20, ageYears: 5, route: 'iv' });
    close(r.result1, 2);
    close(r.result2, 0.8);
    expect(r.result3).toMatch(/В\/в медленно/);
  });

  it('в/м, ребёнок: та же доза, текст введения в/м', () => {
    const r = f.formula({ weight: 20, ageYears: 5, route: 'im' });
    close(r.result1, 2);
    expect(r.result3).toMatch(/В\/м/);
  });

  it('по умолчанию — в/в', () => {
    expect(f.formula({ weight: 20, ageYears: 5 })).toEqual(
      f.formula({ weight: 20, ageYears: 5, route: 'iv' }),
    );
  });

  it('ребёнок 11 лет 60 кг: предел 5 мг', () => {
    const r = f.formula({ weight: 60, ageYears: 11, route: 'iv' });
    close(r.result1, 5);
    close(r.result2, 2);
    expect(r.result3).toMatch(/Достигнут предел 5 мг/);
  });

  it('взрослый: 2.5 мг (1 мл); в/м — упоминание премедикации до 10 мг', () => {
    const iv = f.formula({ weight: 70, ageYears: 40, route: 'iv' });
    expect(iv.result1).toBe(2.5);
    expect(iv.result2).toBe(1);
    expect(iv.result3).toMatch(/45–90 мин/);
    const im = f.formula({ weight: 70, ageYears: 40, route: 'im' });
    expect(im.result1).toBe(2.5);
    expect(im.result3).toMatch(/до 10 мг/);
  });

  it('границы возраста: до 3 лет — нет, 12 лет — как взрослым', () => {
    expect(f.formula({ weight: 14, ageYears: 2.9, route: 'iv' })).toEqual({});
    close(f.formula({ weight: 14, ageYears: 3, route: 'iv' }).result1, 1.4);
    expect(f.formula({ weight: 40, ageYears: 12, route: 'iv' }).result1).toBe(2.5);
  });

  it('пределы зависят от пути', () => {
    expect(droperidolLimits({ route: 'iv' }).result1.max).toBe(5);
    expect(droperidolLimits({ route: 'im' }).result1.max).toBe(10);
    expect(droperidolLimits({}).result1.max).toBe(5);
  });
});

describe('Хлорпромазин', () => {
  const f = byName('Хлорпромазин');

  it('в/м, ребёнок 4 года 16 кг: 0.55 мг/кг = 8.8 мг, суточно ≤40 мг', () => {
    const r = f.formula({ weight: 16, ageYears: 4, route: 'im' });
    close(r.result1, 8.8);
    close(r.result2, 0.352);
    expect(r.result3).toBe(40);
    expect(r.result4).toMatch(/В\/м глубоко/);
  });

  it('по умолчанию — в/м', () => {
    expect(f.formula({ weight: 16, ageYears: 4 })).toEqual(
      f.formula({ weight: 16, ageYears: 4, route: 'im' }),
    );
  });

  it('ребёнок 8 лет 30 кг: суточный предел 75 мг', () => {
    const r = f.formula({ weight: 30, ageYears: 8, route: 'im' });
    close(r.result1, 16.5);
    expect(r.result3).toBe(75);
  });

  it('ребёнок 4 года 90 кг (ошибка ввода): ограничено суточным максимумом 40 мг', () => {
    const r = f.formula({ weight: 90, ageYears: 4, route: 'im' });
    close(r.result1, 40);
    expect(r.result4).toMatch(/Достигнут суточный максимум/);
  });

  it('подросток 14 лет: консервативный предел 75 мг/сут', () => {
    const r = f.formula({ weight: 50, ageYears: 14, route: 'im' });
    close(r.result1, 27.5);
    expect(r.result4).toMatch(/12–18 лет/);
  });

  it('детям в/в и младше 3 лет — расчёт не выполняется', () => {
    expect(f.formula({ weight: 20, ageYears: 6, route: 'iv' })).toEqual({});
    expect(f.formula({ weight: 13, ageYears: 2.9, route: 'im' })).toEqual({});
  });

  it('взрослый в/в: 50 мг, 20 мл разведения, суточная в/в 250 мг', () => {
    const r = f.formula({ weight: 70, ageYears: 30, route: 'iv' });
    expect(r.result1).toBe(50);
    expect(r.result2).toBe(2);
    expect(r.result3).toBe(250);
    expect(r.result4).toMatch(/20 мл/);
  });

  it('взрослый в/м: 50 мг, суточно обычно ≤600 мг, высшая разовая 150 мг', () => {
    const r = f.formula({ weight: 70, ageYears: 30, route: 'im' });
    expect(r.result1).toBe(50);
    expect(r.result3).toBe(600);
    expect(r.result4).toMatch(/150 мг/);
  });

  it('пределы зависят от пути', () => {
    expect(chlorpromazineLimits({ route: 'iv' })).toEqual({
      result1: { max: 100 },
      result2: { max: 4 },
    });
    expect(chlorpromazineLimits({ route: 'im' })).toEqual({
      result1: { max: 150 },
      result2: { max: 6 },
    });
    expect(limitsOf(f, {}).result1.max).toBe(150);
  });
});

describe('Галоперидол', () => {
  const f = byName('Галоперидол');

  it('только возраст, без веса', () => {
    expect(Object.keys(f.inputs)).toEqual(['ageYears']);
  });

  it('взрослый: 5 мг в/м (1 мл), не более 20 мг/сут', () => {
    const r = f.formula({ ageYears: 30 });
    expect(r.result1).toBe(5);
    expect(r.result2).toBe(1);
    expect(r.result3).toBe(20);
    expect(r.result4).toMatch(/каждый час/);
    expect(f.limits).toBeUndefined();
  });

  it('через движок: стандартная доза взрослому без пометки «на пределе» (n28)', () => {
    const res = computeResult(f, { ageYears: '30' });
    expect(res.success).toBe(true);
    res.items.forEach((i) => expect(i.status).not.toBe('atmax'));
  });

  it('старше 65 лет: 2.5 мг, не более 5 мг/сут', () => {
    const r = f.formula({ ageYears: 65 });
    expect(r.result1).toBe(2.5);
    expect(r.result2).toBe(0.5);
    expect(r.result3).toBe(5);
    expect(f.formula({ ageYears: 64 }).result1).toBe(5);
  });

  it('до 18 лет — парентерально противопоказан, расчёт не выполняется (справочно)', () => {
    expect(f.formula({ ageYears: 17.9 })).toEqual({});
    expect(f.formula({ ageYears: 5 })).toEqual({});
    expect(f.formula({ ageYears: 18 }).result1).toBe(5);
    const res = computeResult(f, { ageYears: '10' });
    expect(res.info).toBe(true);
    expect(res.warnings.join(' ')).toMatch(/до 18 лет/);
  });
});

describe('движок: все записи считаются для типичного ребёнка и взрослого', () => {
  const kid = { weight: '20', ageYears: '5', ageMonths: '0' };
  const adult = { weight: '70', ageYears: '30', ageMonths: '0' };
  it.each(group.filter((g) => g.name !== 'Галоперидол').map((g) => [g.name, g]))('%s', (_, f) => {
    [kid, adult].forEach((inp) => {
      const raw = Object.fromEntries(Object.keys(f.inputs).map((k) => [k, inp[k]]));
      const res = computeResult(f, raw);
      expect(res.error).toBeUndefined();
      expect(res.success).toBe(true);
      expect(res.items.some((i) => i.status === 'high' || i.status === 'zero')).toBe(false);
    });
  });
});
