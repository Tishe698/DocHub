import group from '../neuro_cardio_volume';
import { isChoiceInput } from '../../routes';
import { computeResult, searchFormulas } from '../../engine';

const byName = (start) => {
  const f = group.find((x) => x.name.startsWith(start));
  if (!f) throw new Error(`нет записи «${start}»`);
  return f;
};
const close = (a, b) => expect(a).toBeCloseTo(b, 6);
const limitsOf = (f, clean) => (typeof f.limits === 'function' ? f.limits(clean) : f.limits || {});

const keppra = byName('Кеппра');
const phenazepam = byName('Феназепам');
const mannitol = byName('Маннитол');
const digoxin = byName('Дигоксин');
const gelofusine = byName('Гелофузин');

describe('контракт записей группы', () => {
  test('пять препаратов, название — привычное, затем МНН', () => {
    expect(group.map((f) => f.name)).toEqual([
      'Кеппра (леветирацетам)',
      'Феназепам (бромдигидрохлорфенилбензодиазепин)',
      'Маннитол',
      'Дигоксин',
      'Гелофузин (желатин сукцинилированный)',
    ]);
  });

  test.each(group.map((f) => [f.name, f]))('%s: поля записи', (_n, f) => {
    expect(f.description.length).toBeGreaterThan(20);
    expect(f.warnings.length).toBeGreaterThan(0);
    if (f.inputs.weight) expect(f.inputs.weight).toBe('Вес (кг)');
    if (f.inputs.ageYears) expect(f.inputs.ageYears).toBe('Возраст (лет)');
    Object.keys(f.units).forEach((k) => expect(f.labels[k]).toBeTruthy());
    expect(typeof f.limits === 'function' || typeof f.limits === 'object').toBe(true);
    expect(f.formula({})).toEqual({});
    Object.values(f.inputs)
      .filter(isChoiceInput)
      .forEach((c) => expect(c.choices.some((x) => x.value === c.default)).toBe(true));
  });

  test('неизвестный путь или выбор — расчёт не выполняется', () => {
    expect(keppra.formula({ weight: 20, ageYears: 6, route: 'im' })).toEqual({});
    expect(phenazepam.formula({ ageYears: 40, route: 'po' })).toEqual({});
    expect(phenazepam.formula({ ageYears: 40, indication: 'x' })).toEqual({});
    expect(mannitol.formula({ weight: 70, route: 'im' })).toEqual({});
    expect(digoxin.formula({ ageYears: 60, risk: 'x' })).toEqual({});
    expect(gelofusine.formula({ weight: 70, ageYears: 40, route: 'im' })).toEqual({});
  });

  test('синонимы для поиска', () => {
    const first = (q) => searchFormulas(group, q)[0].formula.name;
    expect(first('леветирацетам')).toBe(keppra.name);
    expect(first('маннит')).toBe(mannitol.name);
    expect(first('гликозид')).toBe(digoxin.name);
    expect(first('желатин')).toBe(gelofusine.name);
    expect(first('абстинентный')).toBe(phenazepam.name);
  });
});

describe('Кеппра (леветирацетам)', () => {
  const run = (weight, ageYears) => keppra.formula({ weight, ageYears, route: 'iv' });

  test('ребёнок 20 кг: 40 мг/кг = 800 мг, 8 мл; верхняя граница 60 мг/кг = 1200 мг', () => {
    const r = run(20, 6);
    close(r.result1, 800);
    close(r.result2, 8);
    close(r.result3, 1200);
    expect(r.result4).toMatch(/не менее чем в 100 мл/);
    expect(r.result4).toMatch(/Флаконов по 500 мг: 2\./);
  });

  test('пределы: дети 4000 мг, взрослые 4500 мг', () => {
    close(run(80, 16).result3, 4000);
    close(run(80, 18).result3, 4500);
    close(run(120, 40).result1, 4500);
    expect(run(120, 40).result5).toMatch(/предел 4500 мг/);
    expect(limitsOf(keppra, { ageYears: 10 }).result1.max).toBe(4000);
    expect(limitsOf(keppra, { ageYears: 30 }).result1.max).toBe(4500);
  });

  test('до 4 лет — не считается (инструкция РФ)', () => {
    expect(run(15, 3)).toEqual({});
    close(run(16, 4).result1, 640);
  });

  test('возраст с экрана: 3 года 11 мес — полные 3 года, расчёта нет; 4 года — есть', () => {
    const calc = (years, months) =>
      computeResult(keppra, { weight: '16', route: 'iv' }, { age: { years, months } });
    expect(calc('3', '11').info).toBe(true);
    expect(calc('0', '8').info).toBe(true);
    expect(calc('4', '0').success).toBe(true);
  });
});

describe('Феназепам', () => {
  const run = (ageYears, indication = 'agitation', route = 'im') =>
    phenazepam.formula({ ageYears, indication, route });

  test('взрослый: начальная 0,5 мг = 0,5 мл, не более 10 мг/сут', () => {
    const r = run(40);
    close(r.result1, 0.5);
    close(r.result2, 0.5);
    close(r.result3, 10);
    expect(r.result5).toMatch(/3–5 мг/);
  });

  test('показания: абстиненция — 1 раз в сутки по КР; серийные припадки — 1–3 мг/сут', () => {
    expect(run(40, 'withdrawal').result5).toMatch(/1 раз в сутки/);
    expect(run(40, 'seizures').result5).toMatch(/1–3 мг/);
    expect(run(40, 'agitation', 'iv').result4).toMatch(/медленно/);
  });

  test('до 18 лет — не считается; пожилым — оговорка', () => {
    expect(run(17)).toEqual({});
    expect(run(70).result5).toMatch(/пожилым/);
  });

  test('предупреждения: не путать с диазепамом, статус — не показание, вся беременность', () => {
    const w = phenazepam.warnings.join(' ');
    expect(w).toMatch(/беременность \(особенно I триместр/);
    expect(w).toMatch(/в 10 раз меньше/);
    expect(w).toMatch(/Эпилептический статус — не показание/);
  });
});

describe('Маннитол', () => {
  const run = (weight) => mannitol.formula({ weight, route: 'iv' });

  test('70 кг: 0,25 г/кг = 17,5 г = 116,7 мл 15%; верхняя граница 70 г', () => {
    const r = run(70);
    close(r.result1, 17.5);
    close(r.result2, 116.66666666666667);
    close(r.result3, 70);
    expect(r.result4).toMatch(/37 °C/);
  });

  test('ребёнок 20 кг: 5 г = 33,3 мл', () => {
    close(run(20).result1, 5);
    close(run(20).result2, 33.333333333333336);
  });

  test('верхняя граница не выше 140 г в сутки', () => {
    const r = run(160);
    close(r.result3, 140);
    expect(r.result5).toMatch(/предел 140 г/);
  });

  test('доза в граммах — формат движка', () => {
    const r = computeResult(mannitol, { weight: '70', route: 'iv' });
    expect(r.success).toBe(true);
    expect(r.items[0].text).toBe('17.5 г');
  });
});

describe('Дигоксин', () => {
  const run = (ageYears, risk = 'standard') => digoxin.formula({ ageYears, risk, route: 'iv' });

  test('взрослый: 250 мкг = 1 мл, не более 1000 мкг/сут', () => {
    const r = run(55);
    close(r.result1, 250);
    close(r.result2, 1);
    close(r.result3, 1000);
    expect(r.result4).toMatch(/10–20 мин.*не менее чем в 4 раза/);
  });

  test('сниженная доза 125 мкг: почки/калий или возраст от 70 лет (69 — ещё обычная)', () => {
    close(run(55, 'reduced').result1, 125);
    close(run(55, 'reduced').result2, 0.5);
    close(run(55, 'reduced').result3, 500);
    expect(run(55, 'reduced').result5).toMatch(/скорректировать калий/);
    const old = run(70);
    close(old.result1, 125);
    close(old.result3, 500);
    expect(old.result5).toMatch(/70 лет и старше/);
    close(run(69).result1, 250);
  });

  test('вывод движка в мкг: «125 мкг», а не округлённые миллиграммы', () => {
    const r = computeResult(
      digoxin,
      { risk: 'reduced', route: 'iv' },
      { age: { years: '60', months: '' } },
    );
    expect(r.success).toBe(true);
    expect(r.items[0].text).toBe('125 мкг');
    expect(r.items[1].text).toBe('0.50 мл');
  });

  test('детям — не считается; статус препарата — в описании', () => {
    expect(run(10)).toEqual({});
    expect(digoxin.description).toMatch(/недействующие/);
    expect(digoxin.warnings.join(' ')).toMatch(/верапамилом и амиодароном/);
  });
});

describe('Гелофузин', () => {
  const run = (weight, ageYears = 40) => gelofusine.formula({ weight, ageYears, route: 'iv' });

  test('взрослый 70 кг: болюс 500 мл, не более 1000 мл', () => {
    const r = run(70);
    close(r.result1, 500);
    close(r.result2, 1000);
    expect(r.result3).toMatch(/первые 20–30 мл медленно/);
  });

  test('малая масса: предел 30 мл/кг', () => {
    const r = run(30, 18);
    close(r.result2, 900);
    close(r.result1, 500);
    expect(r.result4).toMatch(/не более 900 мл/);
    close(run(15, 18).result1, 450);
  });

  test('детям — не считается (17 лет — нет, 18 — да); сепсис — в предупреждениях', () => {
    expect(run(20, 6)).toEqual({});
    expect(run(60, 17)).toEqual({});
    close(run(60, 18).result1, 500);
    expect(gelofusine.warnings.join(' ')).toMatch(/При сепсисе желатина избегать/);
  });
});
