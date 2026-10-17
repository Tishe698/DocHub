import group from '../bronchodilators_rsi';
import { isChoiceInput } from '../../routes';
import { computeResult } from '../../engine';

const byName = (name) => {
  const f = group.find((g) => g.name === name);
  if (!f) throw new Error(`нет записи ${name}`);
  return f;
};
const close = (v, expected) => expect(v).toBeCloseTo(expected, 6);
const limitsOf = (f, clean = {}) => (typeof f.limits === 'function' ? f.limits(clean) : f.limits);
const age = (years, months = '') => ({ age: { years: String(years), months: String(months) } });

const AMINO = 'Эуфиллин (аминофиллин)';
const ROC = 'Эсмерон (рокурония бромид)';
const SUG = 'Брайдан (сугаммадекс)';

describe('группа бронхолитиков и БПИ: структура', () => {
  it('содержит записи в порядке; названия — общеизвестное + МНН в скобках', () => {
    expect(group.map((g) => g.name)).toEqual([AMINO, ROC, SUG]);
    group.forEach((g) => expect(g.name).toMatch(/^[А-ЯЁ][а-яё]+ \([а-яё ]+\)$/));
  });

  it('этомидат не добавлен (не зарегистрирован в РФ)', () => {
    expect(group.some((g) => /этомидат/i.test(g.name))).toBe(false);
  });

  it.each(group.map((g) => [g.name, g]))('%s: поля контракта и пустой ввод', (_, f) => {
    expect(typeof f.description).toBe('string');
    expect(f.description).toMatch(/мг\/мл/);
    expect(typeof f.formula).toBe('function');
    expect(Array.isArray(f.warnings)).toBe(true);
    expect(f.warnings.length).toBeGreaterThan(0);
    expect(f.inputs.weight).toBe('Вес (кг)');
    expect(f.inputs.ageYears).toBe('Возраст (лет)');
    expect(f.formula({})).toEqual({});
    expect(f.formula({ weight: 0, ageYears: 5 })).toEqual({});
    expect(f.formula({ weight: 20 })).toEqual({});
    expect(f.formula({ weight: 20, ageYears: -1 })).toEqual({});
    Object.keys(f.units).forEach((k) => expect(f.labels[k]).toBeTruthy());
    const lim = limitsOf(f);
    if (lim !== undefined) expect(typeof lim).toBe('object');
  });

  it('путь введения (только в/в) указан в подписи дозы', () => {
    group.forEach((f) => expect(f.labels.result1).toMatch(/в\/в/));
  });

  it('поля-выборы: значения по умолчанию из вариантов, неизвестное значение — {}', () => {
    group.forEach((f) => {
      Object.values(f.inputs)
        .filter(isChoiceInput)
        .forEach((c) => expect(c.choices.some((x) => x.value === c.default)).toBe(true));
    });
    expect(byName(AMINO).inputs.theophylline.choices.map((c) => c.value)).toEqual(['no', 'yes']);
    expect(byName(AMINO).inputs.theophylline.default).toBe('no');
    expect(byName(ROC).inputs.indication.choices.map((c) => c.value)).toEqual([
      'rsi',
      'intubation',
    ]);
    expect(byName(SUG).inputs.indication.choices.map((c) => c.value)).toEqual([
      'routine',
      'deep',
      'immediate',
    ]);
    expect(byName(AMINO).formula({ weight: 70, ageYears: 40, theophylline: 'x' })).toEqual({});
    expect(byName(ROC).formula({ weight: 70, ageYears: 40, indication: 'x' })).toEqual({});
    expect(byName(SUG).formula({ weight: 70, ageYears: 40, indication: 'x' })).toEqual({});
  });

  it('укладки СМП упомянуты в описании', () => {
    expect(byName(AMINO).description).toMatch(/1165н.*424н/);
    expect(byName(ROC).description).toMatch(/1165н.*424н/);
    expect(byName(SUG).description).toMatch(/не входит/);
  });
});

describe('Эуфиллин (аминофиллин)', () => {
  const f = byName(AMINO);

  it('взрослый: 120 мг (5 мл), суточная 500 мг, путь и разведение в примечании', () => {
    const r = f.formula({ weight: 70, ageYears: 40 });
    expect(r.result1).toBe(120);
    close(r.result2, 5);
    expect(r.result3).toBe(500);
    expect(r.result4).toMatch(/4–6 мин/);
    expect(r.result4).toMatch(/10–20 мл 0,9% натрия хлорида/);
    expect(r.result4).toMatch(/30–50 кап\/мин/);
    expect(r.result4).toMatch(/до 240 мг/);
    // масса взрослого на дозу не влияет (фиксированная доза инструкции)
    expect(f.formula({ weight: 140, ageYears: 40 }).result1).toBe(120);
    expect(f.formula({ weight: 70, ageYears: 18 }).result1).toBe(120);
    expect(limitsOf(f, { weight: 70, ageYears: 40 })).toEqual({
      result1: { max: 250 },
      result2: { max: 250 / 24 },
    });
  });

  it('ребёнок 5 лет 20 кг: 2 мг/кг = 40 мг, суточная 120 мг (4–7 лет)', () => {
    const r = f.formula({ weight: 20, ageYears: 5 });
    expect(r.result1).toBe(40);
    close(r.result2, 40 / 24);
    expect(r.result3).toBe(120);
    expect(r.result4).toMatch(/40–60 мг/);
    expect(r.result4).toMatch(/капельно/);
    expect(r.result4).toMatch(/До 14 лет — с осторожностью/);
    expect(limitsOf(f, { weight: 20, ageYears: 5 }).result1.max).toBe(60);
  });

  it('высшая суточная по возрасту: границы таблицы инструкции', () => {
    const daily = (w, a) => f.formula({ weight: w, ageYears: a }).result3;
    expect(daily(3.5, 0)).toBe(30); // новорождённый
    expect(daily(5, 0.25)).toBe(30); // 3 мес — «до 3 мес»
    expect(daily(6, 4 / 12)).toBe(60); // 4 мес
    expect(daily(9, 11 / 12)).toBe(60);
    expect(daily(10, 1)).toBe(60); // 1–2 года — пропуск в таблице, меньший соседний предел
    expect(daily(12, 2)).toBe(90);
    expect(daily(15, 3)).toBe(90);
    expect(daily(16, 4)).toBe(120);
    expect(daily(25, 7)).toBe(120);
    expect(daily(26, 8)).toBe(250);
    expect(daily(60, 17)).toBe(250);
    expect(daily(60, 18)).toBe(500);
    expect(f.formula({ weight: 10, ageYears: 1 }).result4).toMatch(/1–2 года в таблице/);
  });

  it('новорождённый 3,5 кг: 7 мг (0,29 мл)', () => {
    const r = f.formula({ weight: 3.5, ageYears: 0 });
    close(r.result1, 7);
    close(r.result2, 7 / 24);
  });

  it('предел 240 мг на введение у подростка и предел по суточной у малыша', () => {
    const r = f.formula({ weight: 130, ageYears: 16 });
    expect(r.result1).toBe(240);
    expect(r.result4).toMatch(/ограничена пределом 240 мг \(расчёт 260 мг\)/);
    expect(limitsOf(f, { weight: 130, ageYears: 16 }).result1.max).toBe(240);
    // 1 год, 40 кг (ошибка ввода или ожирение): 80 мг > суточного предела 60 мг
    const s = f.formula({ weight: 40, ageYears: 1 });
    expect(s.result1).toBe(60);
    expect(s.result4).toMatch(/ограничена пределом 60 мг/);
    // подросток 15 лет 100 кг: 200 мг, без ограничения; старше 14 лет — без «с осторожностью»
    const t = f.formula({ weight: 100, ageYears: 15 });
    expect(t.result1).toBe(200);
    expect(t.result4).not.toMatch(/ограничена/);
    expect(t.result4).not.toMatch(/До 14 лет/);
  });

  it('число повторов в сутки — в пределах высшей суточной по возрасту', () => {
    // 17 лет 120 кг: 240 мг при суточном 250 мг — повтор невозможен
    const r17 = f.formula({ weight: 120, ageYears: 17 });
    expect(r17.result1).toBe(240);
    expect(r17.result3).toBe(250);
    expect(r17.result4).toMatch(/Повторное введение в те же сутки не допускается/);
    expect(r17.result4).not.toMatch(/до 3 раз/);
    expect(r17.result4).toMatch(/увеличение до 3 мг\/кг невозможно — доза уже на пределе 240 мг/);
    expect(r17.result4).not.toMatch(/240–240/);
    // 15 лет 100 кг: 200 мг — тоже одно введение (2 × 200 > 250)
    expect(f.formula({ weight: 100, ageYears: 15 }).result4).toMatch(/не допускается/);
    // 5 лет 25 кг: 50 мг, суточная 120 — два введения
    const r5 = f.formula({ weight: 25, ageYears: 5 });
    expect(r5.result4).toMatch(/Не более 2 введений в сутки/);
    // 5 лет 20 кг: 40 мг × 3 = 120 — ровно суточная, до 3 раз
    expect(f.formula({ weight: 20, ageYears: 5 }).result4).toMatch(
      /Повтор до 3 раз в сутки, не более 120 мг/,
    );
    // 8 лет 30 кг: 60 мг, суточная 250 — до 3 раз
    expect(f.formula({ weight: 30, ageYears: 8 }).result4).toMatch(/Повтор до 3 раз/);
    // 1 год 40 кг: доза на суточном пределе 60 мг — одно введение
    expect(f.formula({ weight: 40, ageYears: 1 }).result4).toMatch(/не допускается/);
    // взрослый: 120 мг × 3 = 360 < 500 — до 3 раз
    expect(f.formula({ weight: 120, ageYears: 18 }).result4).toMatch(/Повтор до 3 раз/);
  });

  it('получал теофиллин — расчёт не выполняется, без числовой дозы', () => {
    const r = f.formula({ weight: 70, ageYears: 40, theophylline: 'yes' });
    expect(r.result1).toBeUndefined();
    expect(r.result9).toMatch(/расчёт не выполняется/);
    expect(f.formula({ weight: 20, ageYears: 5, theophylline: 'yes' }).result9).toMatch(/ксантина/);
    expect(f.formula({ weight: 20, ageYears: 5, theophylline: 'no' }).result1).toBe(40);
  });

  it('через движок: доза на пределе — бейдж, выбор показан строкой', () => {
    const r = computeResult(f, { weight: '130', theophylline: 'no' }, age(16));
    expect(r.success).toBe(true);
    expect(r.items.find((i) => i.key === 'result1').status).toBe('atmax');
    expect(r.choices[0]).toMatchObject({ key: 'theophylline', value: 'no' });
    const y = computeResult(f, { weight: '70', theophylline: 'yes' }, age(40));
    expect(y.success).toBe(true);
    expect(y.items).toHaveLength(1);
    expect(y.items[0].name).toBe('Примечание');
  });
});

describe('Эсмерон (рокурония бромид)', () => {
  const f = byName(ROC);

  it('взрослый БПИ: 1,0 мг/кг', () => {
    const r = f.formula({ weight: 70, ageYears: 40 });
    close(r.result1, 70);
    close(r.result2, 7);
    close(r.result3, 10.5);
    expect(r.result4).toMatch(/БПИ: 1,0 мг\/кг/);
    expect(r.result4).toMatch(/Флаконов по 50 мг \(5 мл\): 2/);
  });

  it('взрослый интубация: 0,6 мг/кг', () => {
    const r = f.formula({ weight: 70, ageYears: 40, indication: 'intubation' });
    close(r.result1, 42);
    close(r.result2, 4.2);
    close(r.result3, 10.5);
  });

  it('пожилой (≥ 65 лет): БПИ 0,6 мг/кг, поддерживающая 0,075 мг/кг', () => {
    const r = f.formula({ weight: 70, ageYears: 65 });
    close(r.result1, 42);
    close(r.result3, 5.25);
    expect(r.result4).toMatch(/90 с/);
    close(f.formula({ weight: 70, ageYears: 64 }).result1, 70);
  });

  it('ребёнок: интубация 0,6 мг/кг; БПИ — расчёт не выполняется', () => {
    const r = f.formula({ weight: 20, ageYears: 5, indication: 'intubation' });
    close(r.result1, 12);
    close(r.result2, 1.2);
    close(r.result3, 3);
    expect(r.result4).toMatch(/Дети с 1 мес/);
    const rsi = f.formula({ weight: 20, ageYears: 5, indication: 'rsi' });
    expect(rsi.result1).toBeUndefined();
    expect(rsi.result9).toMatch(/БПИ у детей/);
    expect(f.formula({ weight: 60, ageYears: 17 }).result9).toMatch(/БПИ у детей/);
    close(f.formula({ weight: 60, ageYears: 18 }).result1, 60);
  });

  it('возраст: до 1 мес — не рекомендован; с 1 мес — расчёт', () => {
    const neo = f.formula({ weight: 3.5, ageYears: 0, indication: 'intubation' });
    expect(neo.result1).toBeUndefined();
    expect(neo.result9).toMatch(/до 1 месяца/);
    const m1 = f.formula({ weight: 4.5, ageYears: 1 / 12, indication: 'intubation' });
    close(m1.result1, 2.7);
    close(m1.result2, 0.27);
  });

  it('без верхнего предела (нет в инструкции): крупная масса — линейно', () => {
    close(f.formula({ weight: 150, ageYears: 40 }).result1, 150);
    expect(f.limits).toBeUndefined();
  });

  it('ожирение: доза помечена как посчитанная на введённую массу, правило ИМТ > 30 в примечании', () => {
    const r = f.formula({ weight: 150, ageYears: 40 });
    expect(r.result4).toMatch(/на введённую массу 150 кг/);
    expect(r.result4).toMatch(/ИМТ > 30/);
    expect(r.result4).toMatch(/нормальной для возраста и пола массе/);
    expect(f.labels.result1).toMatch(/по введённой массе/);
    expect(f.labels.result3).toMatch(/по введённой массе/);
    expect(f.formula({ weight: 20, ageYears: 5, indication: 'intubation' }).result4).toMatch(
      /ИМТ > 30/,
    );
  });

  it('через движок: успех и подписи', () => {
    const r = computeResult(f, { weight: '80', indication: 'rsi' }, age(30));
    expect(r.success).toBe(true);
    expect(r.items.find((i) => i.key === 'result1').text).toBe('80 мг');
    const c = computeResult(f, { weight: '20', indication: 'rsi' }, age(5));
    expect(c.success).toBe(true);
    expect(c.items[0].name).toBe('Примечание');
  });
});

describe('Брайдан (сугаммадекс)', () => {
  const f = byName(SUG);

  it('взрослый: 2 / 4 / 16 мг/кг по показанию', () => {
    const r2 = f.formula({ weight: 70, ageYears: 40, indication: 'routine' });
    close(r2.result1, 140);
    close(r2.result2, 1.4);
    expect(r2.result3).toBeUndefined();
    expect(r2.result4).toMatch(/1 × 200 мг/);
    const r4 = f.formula({ weight: 70, ageYears: 40, indication: 'deep' });
    close(r4.result1, 280);
    close(r4.result2, 2.8);
    expect(r4.result4).toMatch(/Флаконы: 2 × 200 мг \(2 мл\)\./);
    const r16 = f.formula({ weight: 70, ageYears: 40, indication: 'immediate' });
    close(r16.result1, 1120);
    close(r16.result2, 11.2);
    expect(r16.result4).toMatch(/2 × 500 мг \(5 мл\) \+ 1 × 200 мг/);
    expect(r16.result4).toMatch(/1,2 мг\/кг/);
  });

  it('по умолчанию — стандартная реверсия 2 мг/кг; по фактической массе без предела', () => {
    close(f.formula({ weight: 150, ageYears: 40 }).result1, 300);
    expect(f.limits).toBeUndefined();
  });

  it('ребёнок 2–17 лет: только 2 мг/кг, разведение до 10 мг/мл', () => {
    const r = f.formula({ weight: 20, ageYears: 5 });
    close(r.result1, 40);
    close(r.result2, 0.4);
    close(r.result3, 4);
    expect(r.result4).toMatch(/0,4 мл препарата \+ 3,6 мл растворителя/);
    ['deep', 'immediate'].forEach((ind) => {
      const x = f.formula({ weight: 20, ageYears: 5, indication: ind });
      expect(x.result1).toBeUndefined();
      expect(x.result9).toMatch(/только стандартную реверсию/);
    });
    close(f.formula({ weight: 12, ageYears: 2 }).result1, 24);
    expect(f.formula({ weight: 60, ageYears: 17, indication: 'deep' }).result9).toMatch(/2–17/);
    close(f.formula({ weight: 60, ageYears: 18, indication: 'deep' }).result1, 240);
  });

  it('противопоказания и осторожность — в предупреждениях (инструкция ГРЛС)', () => {
    const w = f.warnings.join(' ');
    expect(w).toMatch(/КК < 30 мл\/мин/);
    expect(w).toMatch(/печени/);
    expect(w).toMatch(/Беременность и кормление грудью — с осторожностью/);
  });

  it('до 2 лет — противопоказан', () => {
    const r = f.formula({ weight: 11, ageYears: 1 });
    expect(r.result1).toBeUndefined();
    expect(r.result9).toMatch(/до 2 лет противопоказан/);
    expect(f.formula({ weight: 3.5, ageYears: 0 }).result9).toMatch(/противопоказан/);
  });

  it('через движок: разведённый объём не вызывает напоминания о малом объёме', () => {
    const r = computeResult(f, { weight: '4', indication: 'routine' }, age(2));
    expect(r.success).toBe(true);
    expect(r.items.some((i) => i.key === 'engine-small-volume')).toBe(false);
    expect(r.items.find((i) => i.key === 'result3').text).toBe('0.80 мл');
  });
});
