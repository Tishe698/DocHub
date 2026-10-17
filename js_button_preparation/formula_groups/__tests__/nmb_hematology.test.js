import group from '../nmb_hematology';
import { isChoiceInput, ROUTES } from '../../routes';
import { computeResult } from '../../engine';

const byName = (name) => {
  const f = group.find((g) => g.name === name);
  if (!f) throw new Error(`нет записи ${name}`);
  return f;
};
const close = (v, expected) => expect(v).toBeCloseTo(expected, 6);
const limitsOf = (f, clean = {}) => (typeof f.limits === 'function' ? f.limits(clean) : f.limits);

describe('группа НМБД и гематологии: структура', () => {
  it('содержит все записи в прежнем порядке (дубли гепарина и этамзилата объединены)', () => {
    expect(group.map((g) => g.name)).toEqual([
      'Листенон (суксаметония хлорид)',
      'Ардуан (пипекурония бромид)',
      'Гепарин натрия',
      'Дицинон (этамзилат)',
      'Транексам (транексамовая кислота)',
    ]);
  });

  it.each(group.map((g) => [g.name, g]))('%s: поля контракта и пустой ввод', (_, f) => {
    expect(typeof f.description).toBe('string');
    expect(f.description).toMatch(/мг\/мл|МЕ\/мл/);
    expect(typeof f.formula).toBe('function');
    expect(Array.isArray(f.warnings)).toBe(true);
    expect(f.warnings.length).toBeGreaterThan(0);
    expect(f.inputs.weight).toBe('Вес (кг)');
    if (f.inputs.ageYears) expect(f.inputs.ageYears).toBe('Возраст (лет)');
    if (f.inputs.ageMonths) expect(f.inputs.ageMonths).toBe('Возраст (мес)');
    // Пустой ввод — {} (движок покажет указания записи)
    expect(f.formula({})).toEqual({});
    expect(f.formula({ weight: 0, ageYears: 5, ageMonths: 60 })).toEqual({});
    Object.keys(f.units).forEach((k) => expect(f.labels[k]).toBeTruthy());
    const lim = limitsOf(f);
    if (lim !== undefined) expect(typeof lim).toBe('object');
  });

  it('поля-выборы корректны: коды путей из routes.js, по умолчанию — из вариантов', () => {
    group.forEach((f) => {
      Object.values(f.inputs)
        .filter(isChoiceInput)
        .forEach((c) => expect(c.choices.some((x) => x.value === c.default)).toBe(true));
    });
    const sux = byName('Листенон (суксаметония хлорид)').inputs.route;
    expect(sux.choices.map((c) => c.value)).toEqual(['iv', 'im']);
    sux.choices.forEach((c) => expect(c.label).toBe(ROUTES[c.value]));
    expect(sux.default).toBe('iv');
    const hep = byName('Гепарин натрия').inputs.indication;
    expect(hep.choices.map((c) => c.value)).toEqual(['peds', 'stemi_tlt', 'nste', 'pe']);
    expect(hep.default).toBe('peds');
    const txa = byName('Транексам (транексамовая кислота)').inputs;
    expect(txa.indication.choices.map((c) => c.value)).toEqual(['trauma', 'pph']);
    expect(txa.concentration.choices.map((c) => c.value)).toEqual(['50', '100']);
    expect(txa.concentration.default).toBe('50');
  });

  it('у препаратов с одним путём путь указан в подписи результата', () => {
    expect(byName('Ардуан (пипекурония бромид)').labels.result1).toMatch(/в\/в/);
    expect(byName('Гепарин натрия').labels.result1).toMatch(/в\/в/);
    expect(byName('Гепарин натрия').labels.result3).toMatch(/в\/в/);
    expect(byName('Дицинон (этамзилат)').labels.result1).toMatch(/в\/в или в\/м/);
    expect(byName('Транексам (транексамовая кислота)').labels.result1).toMatch(/в\/в/);
  });

  it('неизвестное значение выбора — расчёт не выполняется', () => {
    expect(
      byName('Листенон (суксаметония хлорид)').formula({ weight: 20, ageYears: 5, route: 'po' }),
    ).toEqual({});
    expect(byName('Гепарин натрия').formula({ weight: 20, ageYears: 5, indication: 'x' })).toEqual(
      {},
    );
    expect(
      byName('Транексам (транексамовая кислота)').formula({ weight: 20, concentration: '25' }),
    ).toEqual({});
  });
});

describe('Листенон (суксаметония хлорид)', () => {
  const f = byName('Листенон (суксаметония хлорид)');

  it('в/в, ребёнок 5 лет 20 кг: 1 мг/кг = 20 мг = 1 мл', () => {
    const r = f.formula({ weight: 20, ageYears: 5, route: 'iv' });
    close(r.result1, 20);
    close(r.result2, 1);
    expect(r.result3).toMatch(/В\/в однократно/);
    expect(r.result3).toMatch(/1–12 лет/);
  });

  it('по умолчанию — в/в', () => {
    expect(f.formula({ weight: 20, ageYears: 5 })).toEqual(
      f.formula({ weight: 20, ageYears: 5, route: 'iv' }),
    );
  });

  it('в/в, границы возраста: до 1 года 2 мг/кг, 1 год — 1 мг/кг, 12 лет — 1,5 мг/кг', () => {
    close(f.formula({ weight: 3.5, ageYears: 0, route: 'iv' }).result1, 7); // новорождённый
    close(f.formula({ weight: 8, ageYears: 11 / 12, route: 'iv' }).result1, 16);
    close(f.formula({ weight: 10, ageYears: 1, route: 'iv' }).result1, 10);
    close(f.formula({ weight: 35, ageYears: 11, route: 'iv' }).result1, 35);
    close(f.formula({ weight: 40, ageYears: 12, route: 'iv' }).result1, 60);
  });

  it('в/в, взрослый 70 кг: 105 мг; 120 кг — ограничение 150 мг', () => {
    const r = f.formula({ weight: 70, ageYears: 30, route: 'iv' });
    close(r.result1, 105);
    close(r.result2, 5.25);
    const big = f.formula({ weight: 120, ageYears: 30, route: 'iv' });
    expect(big.result1).toBe(150);
    expect(big.result2).toBe(7.5);
    expect(big.result3).toMatch(/ограничена максимумом 150 мг \(расчёт 180 мг\)/);
    expect(f.limits.result1.max).toBe(150);
    expect(f.limits.result2.max).toBe(7.5);
  });

  it('в/м, ребёнок 20 кг: 3 мг/кг = 60 мг = 3 мл, диапазон до 80 мг', () => {
    const r = f.formula({ weight: 20, ageYears: 5, route: 'im' });
    close(r.result1, 60);
    close(r.result2, 3);
    expect(r.result3).toMatch(/В\/м/);
    expect(r.result3).toMatch(/60–80 мг \(3–4 мл\)/);
  });

  it('в/м, новорождённый 3 кг: 9 мг (возрастных отличий в/м нет)', () => {
    close(f.formula({ weight: 3, ageYears: 0, route: 'im' }).result1, 9);
  });

  it('в/м, взрослый 70 кг: верх диапазона упирается в 150 мг; 60 кг и больше — ограничение', () => {
    const r = f.formula({ weight: 45, ageYears: 30, route: 'im' });
    close(r.result1, 135);
    expect(r.result3).toMatch(/135–150 мг/);
    const big = f.formula({ weight: 70, ageYears: 30, route: 'im' });
    expect(big.result1).toBe(150);
    expect(big.result3).toMatch(/ограничена максимумом 150 мг \(расчёт 210 мг\)/);
    expect(big.result3).toMatch(/150 мг \(7\.5 мл\)/);
  });

  it('через движок: путь показан строкой выбора, доза на пределе — бейдж', () => {
    const r = computeResult(f, { weight: '70', route: 'im' }, { age: { years: '30', months: '' } });
    expect(r.success).toBe(true);
    expect(r.choices).toEqual([
      { key: 'route', label: 'Путь введения', value: 'im', valueLabel: 'в/м' },
    ]);
    expect(r.items.find((i) => i.key === 'result1').status).toBe('atmax');
  });
});

describe('Ардуан (пипекурония бромид)', () => {
  const f = byName('Ардуан (пипекурония бромид)');

  it('до 3 мес — противопоказан, без числовой дозы', () => {
    const r = f.formula({ weight: 5, ageMonths: 2 });
    expect(r.result1).toBeUndefined();
    expect(r.result9).toMatch(/Противопоказан детям до 3 месяцев/);
    expect(f.formula({ weight: 3.5, ageMonths: 0 }).result9).toMatch(/Противопоказан/);
  });

  it('3–12 мес: 0,04 мг/кг', () => {
    const r = f.formula({ weight: 6, ageMonths: 3 });
    close(r.result1, 0.24);
    close(r.result2, 0.12);
    expect(r.result3).toMatch(/^В\/в\. 3–12 мес/);
    expect(r.result3).toMatch(/Флаконов по 4 мг: 1/);
    close(f.formula({ weight: 9, ageMonths: 11 }).result1, 0.36);
  });

  it('1–14 лет: 0,055 мг/кг (12 и 168 мес — границы)', () => {
    close(f.formula({ weight: 10, ageMonths: 12 }).result1, 0.55);
    const r = f.formula({ weight: 20, ageMonths: 60 });
    close(r.result1, 1.1);
    close(r.result2, 0.55);
    close(f.formula({ weight: 50, ageMonths: 168 }).result1, 2.75);
  });

  it('старше 14 лет и взрослые: 0,07 мг/кг, флаконы по 4 мг', () => {
    const r = f.formula({ weight: 70, ageMonths: 360 });
    close(r.result1, 4.9);
    close(r.result2, 2.45);
    expect(r.result3).toMatch(/Флаконов по 4 мг: 2/);
    close(f.formula({ weight: 55, ageMonths: 169 }).result1, 3.85);
  });
});

describe('Гепарин натрия', () => {
  const f = byName('Гепарин натрия');
  const peds = (weight, ageYears) => f.formula({ weight, ageYears, indication: 'peds' });

  it('дети, 5 лет 20 кг: 75 МЕ/кг = 1500 МЕ = 0,3 мл, инфузия 18 МЕ/кг/ч', () => {
    const r = peds(20, 5);
    expect(r.result1).toBe(1500);
    close(r.result2, 0.3);
    expect(r.result3).toBe(360);
    expect(r.result4).toMatch(/Целевое АЧТВ 60–85 с/);
    expect(r.result4).not.toMatch(/развести/);
  });

  it('по умолчанию — детская схема', () => {
    expect(f.formula({ weight: 20, ageYears: 5 })).toEqual(peds(20, 5));
  });

  it('дети до 1 года: инфузия 25 МЕ/кг/ч; малый объём — разведение до 500 МЕ/мл', () => {
    const r = peds(4, 0.5);
    expect(r.result1).toBe(300);
    close(r.result2, 0.06);
    expect(r.result3).toBe(100);
    expect(r.result4).toMatch(/развести 1 мл до 10 мл 0,9% NaCl \(500 МЕ\/мл\) и ввести 0\.6 мл/);
    expect(peds(10, 1).result3).toBe(180);
  });

  it('дети: болюс ограничен 5000 МЕ (подросток 17 лет 80 кг)', () => {
    const r = peds(80, 17);
    expect(r.result1).toBe(5000);
    expect(r.result2).toBe(1);
    expect(r.result4).toMatch(/Болюс ограничен 5000 МЕ \(расчёт 6000 МЕ\)/);
    expect(limitsOf(f, { indication: 'peds' })).toEqual({
      result1: { max: 5000 },
      result2: { max: 1 },
    });
  });

  it('детская схема для 18 лет и старше и взрослые схемы до 18 лет — без числовой дозы', () => {
    expect(peds(70, 18)).toEqual({ result9: expect.stringMatching(/выберите взрослое показание/) });
    ['stemi_tlt', 'nste', 'pe'].forEach((indication) => {
      expect(f.formula({ weight: 60, ageYears: 17, indication })).toEqual({
        result9: expect.stringMatching(/выберите показание «Дети/),
      });
    });
  });

  it('ИМпST + ТЛТ: 60 МЕ/кг (макс. 4000), 12 МЕ/кг/ч (макс. 1000) — значения fix/clinical-audit', () => {
    const r = f.formula({ weight: 60, ageYears: 50, indication: 'stemi_tlt' });
    expect(r.result1).toBe(3600);
    close(r.result2, 0.72);
    expect(r.result3).toBe(720);
    expect(r.result4).toMatch(/24–48 ч/);
    const big = f.formula({ weight: 100, ageYears: 50, indication: 'stemi_tlt' });
    expect(big.result1).toBe(4000);
    close(big.result2, 0.8);
    expect(big.result3).toBe(1000);
    expect(big.result4).toMatch(/Болюс ограничен 4000 МЕ \(расчёт 6000 МЕ\)/);
    expect(big.result4).toMatch(/Инфузия ограничена 1000 МЕ\/ч \(расчёт 1200 МЕ\/ч\)/);
    expect(limitsOf(f, { indication: 'stemi_tlt' })).toEqual({
      result1: { max: 4000 },
      result2: { max: 0.8 },
      result3: { max: 1000 },
    });
  });

  it('ОКСбпST: 60 МЕ/кг (макс. 5000), 12 МЕ/кг/ч (макс. 1000)', () => {
    const r = f.formula({ weight: 70, ageYears: 60, indication: 'nste' });
    expect(r.result1).toBe(4200);
    expect(r.result3).toBe(840);
    const big = f.formula({ weight: 90, ageYears: 60, indication: 'nste' });
    expect(big.result1).toBe(5000);
    expect(big.result2).toBe(1);
    expect(big.result3).toBe(1000);
    expect(limitsOf(f, { indication: 'nste' })).toEqual({
      result1: { max: 5000 },
      result2: { max: 1 },
      result3: { max: 1000 },
    });
  });

  it('ТЭЛА: 80 МЕ/кг (макс. 5000), 18 МЕ/кг/ч, не более 2000 МЕ/ч (инструкция ГРЛС, n26)', () => {
    const r = f.formula({ weight: 60, ageYears: 40, indication: 'pe' });
    expect(r.result1).toBe(4800);
    expect(r.result3).toBe(1080);
    expect(r.result4).not.toMatch(/Инфузия ограничена/);
    expect(r.result4).toMatch(/1000–2000 МЕ\/ч/);
    const big = f.formula({ weight: 100, ageYears: 40, indication: 'pe' });
    expect(big.result1).toBe(5000);
    expect(big.result3).toBe(1800);
    expect(big.result4).toMatch(/Болюс ограничен 5000 МЕ \(расчёт 8000 МЕ\)/);
    expect(big.result4).not.toMatch(/Инфузия ограничена/);
    const huge = f.formula({ weight: 120, ageYears: 40, indication: 'pe' });
    expect(huge.result3).toBe(2000);
    expect(huge.result4).toMatch(/Инфузия ограничена 2000 МЕ\/ч \(расчёт 2160 МЕ\/ч\)/);
    expect(f.formula({ weight: 150, ageYears: 40, indication: 'pe' }).result3).toBe(2000);
    expect(limitsOf(f, { indication: 'pe' })).toEqual({
      result1: { max: 5000 },
      result2: { max: 1 },
      result3: { max: 2000 },
    });
  });

  it('через движок: показание в строке выбора, пределы по показанию', () => {
    const r = computeResult(
      f,
      { weight: '100', indication: 'stemi_tlt' },
      { age: { years: '50', months: '' } },
    );
    expect(r.success).toBe(true);
    expect(r.choices[0]).toEqual({
      key: 'indication',
      label: 'Показание',
      value: 'stemi_tlt',
      valueLabel: 'Взрослые: ИМпST + тромболизис',
    });
    expect(r.items.find((i) => i.key === 'result1').status).toBe('atmax');
    expect(r.items.find((i) => i.key === 'result3').status).toBe('atmax');
    const mismatch = computeResult(
      f,
      { weight: '20', indication: 'pe' },
      { age: { years: '5', months: '' } },
    );
    expect(mismatch.success).toBe(true);
    expect(mismatch.items.map((i) => i.key)).toEqual(['result9']);
  });
});

describe('Дицинон (этамзилат)', () => {
  const f = byName('Дицинон (этамзилат)');

  it('новорождённый 3,5 кг (возраст 0): 10 мг/кг = 35 мг = 0,28 мл, каждые 6 ч', () => {
    const r = f.formula({ weight: 3.5, ageYears: 0 });
    close(r.result1, 35);
    close(r.result2, 0.28);
    expect(r.result3).toBeUndefined();
    expect(r.result9).toMatch(/каждые 6 ч в течение 4 дней/);
  });

  it('новорождённый с весом больше 6 кг — проверка ввода, без дозы', () => {
    expect(f.formula({ weight: 7, ageYears: 0 })).toEqual({
      result9: expect.stringMatching(/нетипичен/),
    });
    close(f.formula({ weight: 6, ageYears: 0 }).result1, 60);
  });

  it('граница 28 дней: 1 мес — уже детская схема', () => {
    const r = f.formula({ weight: 4.5, ageYears: 1 / 12 });
    close(r.result1, 22.5);
    close(r.result3, 67.5);
  });

  it('ребёнок 5 лет 20 кг: разово 5 мг/кг = 100 мг = 0,8 мл, сутки до 300 мг', () => {
    const r = f.formula({ weight: 20, ageYears: 5 });
    close(r.result1, 100);
    close(r.result2, 0.8);
    close(r.result3, 300);
    expect(r.result4).toMatch(/3–4 введения/);
  });

  it('подросток 17 лет 110 кг: разовая ограничена 500 мг', () => {
    const r = f.formula({ weight: 110, ageYears: 17 });
    expect(r.result1).toBe(500);
    expect(r.result2).toBe(4);
    expect(r.result4).toMatch(/ограничена 500 мг \(расчёт 550 мг\)/);
    expect(f.limits).toEqual({ result1: { max: 500 }, result2: { max: 4 } });
  });

  it('взрослый: 500 мг = 4 мл разово, схема в примечании без подписи', () => {
    const r = f.formula({ weight: 70, ageYears: 18 });
    expect(r.result1).toBe(500);
    expect(r.result2).toBe(4);
    expect(r.result3).toBeUndefined();
    expect(r.result9).toMatch(/250–500 мг/);
  });

  it('через движок: возраст 0 мес — схема новорождённых', () => {
    const r = computeResult(f, { weight: '3' }, { age: { years: '0', months: '0' } });
    expect(r.success).toBe(true);
    expect(r.items.find((i) => i.key === 'result1').value).toBeCloseTo(30, 6);
  });
});

describe('Транексам (транексамовая кислота)', () => {
  const f = byName('Транексам (транексамовая кислота)');

  it('травма, ребёнок 20 кг, 50 мг/мл: болюс 300 мг = 6 мл за 10 мин, инфузия 40 мг/ч', () => {
    const r = f.formula({ weight: 20, indication: 'trauma', concentration: '50' });
    close(r.result1, 300);
    close(r.result2, 6);
    close(r.result3, 40);
    expect(r.result4).toMatch(/не менее 10 мин/);
    expect(r.result4).toMatch(/Инфузия в\/в 0\.8 мл\/ч \(50 мг\/мл\)/);
    expect(r.result4).toMatch(/всего 320 мг/);
  });

  it('по умолчанию — травма и 50 мг/мл', () => {
    expect(f.formula({ weight: 20 })).toEqual(
      f.formula({ weight: 20, indication: 'trauma', concentration: '50' }),
    );
  });

  it('травма, 100 мг/мл: объём вдвое меньше, скорость по мг та же', () => {
    const r = f.formula({ weight: 20, indication: 'trauma', concentration: '100' });
    close(r.result1, 300);
    close(r.result2, 3);
    expect(r.result4).toMatch(/0\.4 мл\/ч \(100 мг\/мл\)/);
    expect(limitsOf(f, { concentration: '100' }).result2.max).toBe(10);
    expect(limitsOf(f, { concentration: '50' }).result2.max).toBe(20);
  });

  it('травма, взрослый 80 кг: болюс 1 г за 20 мин, инфузия 125 мг/ч (1 г за 8 ч)', () => {
    const r = f.formula({ weight: 80, indication: 'trauma', concentration: '50' });
    expect(r.result1).toBe(1000);
    expect(r.result2).toBe(20);
    expect(r.result3).toBe(125);
    expect(r.result4).toMatch(/Болюс ограничен 1 г \(расчёт 1200 мг\)/);
    expect(r.result4).toMatch(/Инфузия ограничена 125 мг\/ч/);
    expect(r.result4).toMatch(/не менее 20 мин/);
    expect(r.result4).toMatch(/всего 1000 мг/);
  });

  it('граница массы: 66 кг — 990 мг без ограничения, 67 кг — ограничение 1 г', () => {
    const r = f.formula({ weight: 66, indication: 'trauma' });
    close(r.result1, 990);
    expect(r.result4).not.toMatch(/Болюс ограничен/);
    const r2 = f.formula({ weight: 67, indication: 'trauma' });
    expect(r2.result1).toBe(1000);
    expect(r2.result4).toMatch(/Болюс ограничен 1 г \(расчёт 1005 мг\)/);
  });

  it('послеродовое кровотечение, 60 кг: 15 мг/кг = 900 мг, без инфузии', () => {
    const r = f.formula({ weight: 60, indication: 'pph', concentration: '50' });
    close(r.result1, 900);
    close(r.result2, 18);
    expect(r.result3).toBeUndefined();
    expect(r.result4).toMatch(/до 4 г/);
    expect(r.result4).toMatch(/через 8 ч/);
    expect(r.result4).toMatch(/не менее 18 мин/);
  });

  it('послеродовое кровотечение, 90 кг, 100 мг/мл: потолок 1 г = 10 мл', () => {
    const r = f.formula({ weight: 90, indication: 'pph', concentration: '100' });
    expect(r.result1).toBe(1000);
    expect(r.result2).toBe(10);
    expect(r.result4).toMatch(/Болюс ограничен 1 г \(расчёт 1350 мг\)/);
  });

  it('через движок: выборы показаны, объём на пределе для 100 мг/мл', () => {
    const r = computeResult(f, { weight: '90', indication: 'pph', concentration: '100' });
    expect(r.success).toBe(true);
    expect(r.choices.map((c) => c.valueLabel)).toEqual(['Послеродовое кровотечение', '100 мг/мл']);
    expect(r.items.find((i) => i.key === 'result2').status).toBe('atmax');
  });
});
