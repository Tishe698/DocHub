import group from '../resuscitation';
import { isChoiceInput, ROUTES } from '../../routes';
import { computeResult, buildCopyText } from '../../engine';

const byName = (start) => {
  const f = group.find((x) => x.name.startsWith(start));
  if (!f) throw new Error(`нет записи «${start}»`);
  return f;
};
const limitsOf = (f, clean) => (typeof f.limits === 'function' ? f.limits(clean) : f.limits || {});
const close = (a, b) => expect(a).toBeCloseTo(b, 6);

const epi = byName('Эпинефрин (адреналин) — СЛР');
const epiAna = byName('Эпинефрин (адреналин) — анафилаксия');
const atropine = byName('Атропин');
const amio = byName('Амиодарон');
const verapamil = byName('Верапамил');
const norepi = byName('Норэпинефрин');
const dobutamine = byName('Добутамин');
const dopamine = byName('Допамин');

// Пациент по ленте Broselow: известен только вес, возраст пуст (BroselowPicker не задаёт ageMonths)
const NO_AGE = { age: { years: '', months: '' } };

describe('контракт записей группы', () => {
  test('восемь записей: эпинефрин — СЛР и анафилаксия отдельно', () => {
    expect(group).toHaveLength(8);
    expect(group.filter((f) => f.name.startsWith('Эпинефрин')).map((f) => f.name)).toEqual([
      'Эпинефрин (адреналин) — СЛР',
      'Эпинефрин (адреналин) — анафилаксия в/м',
    ]);
  });

  test.each(group.map((f) => [f.name, f]))('%s: поля записи', (_name, f) => {
    expect(typeof f.name).toBe('string');
    expect(f.description.length).toBeGreaterThan(10);
    expect(typeof f.formula).toBe('function');
    expect(f.inputs.weight).toBe('Вес (кг)');
    expect(Array.isArray(f.warnings)).toBe(true);
    expect(f.warnings.length).toBeGreaterThan(0);
    if (f.inputs.ageYears) expect(f.inputs.ageYears).toBe('Возраст (лет)');
  });

  test('расчёты СЛР и брадикардии не запрашивают возраст', () => {
    [epi, atropine, amio].forEach((f) => {
      expect(Object.keys(f.inputs)).not.toContain('ageYears');
      expect(Object.keys(f.inputs)).not.toContain('ageMonths');
    });
  });

  test.each([atropine, amio].map((f) => [f.name, f]))('%s: выбор «Показание и путь» с путями из routes', (_n, f) => {
    const ch = f.inputs.indication;
    expect(isChoiceInput(ch)).toBe(true);
    expect(ch.label).toBe('Показание и путь');
    ch.choices.forEach((c) => {
      const code = c.value.split('-')[1];
      expect(ROUTES[code]).toBeDefined();
      expect(c.label.endsWith(`— ${ROUTES[code]}`)).toBe(true);
    });
  });

  test('эпинефрин СЛР: пути только в/в и в/к, по умолчанию в/в', () => {
    const ch = epi.inputs.route;
    expect(isChoiceInput(ch)).toBe(true);
    expect(ch.choices.map((c) => c.value)).toEqual(['iv', 'io']);
    expect(ch.choices.map((c) => c.label)).toEqual([ROUTES.iv, ROUTES.io]);
    expect(ch.default).toBe('iv');
  });

  test('единственный путь указан в подписи результата', () => {
    expect(epiAna.labels.result1).toMatch(/в\/м/);
    expect(epiAna.labels.result2).toMatch(/в\/м/);
    expect(verapamil.labels.result1).toMatch(/в\/в/);
    [norepi, dobutamine, dopamine].forEach((f) => {
      expect(f.labels.result1).toMatch(/в\/в инфузия/);
      expect(f.labels.result2).toMatch(/в\/в/);
    });
  });

  test('пустой вес — расчёт не выполняется', () => {
    [epi, epiAna, atropine, amio, norepi, dobutamine, dopamine].forEach((f) => expect(f.formula({})).toEqual({}));
  });
});

describe('Эпинефрин — СЛР', () => {
  const run = (weight, route = 'iv') => epi.formula({ route, weight });

  test('ребёнок 20 кг: 10 мкг/кг', () => {
    const r = run(20);
    expect(r.result1).toBe(200);
    close(r.result2, 2);
    close(r.result3, 0.2);
    expect(r.result4).toMatch(/^в\/в струйно/);
    expect(r.result5).toMatch(/= 0,2 мг/);
    expect(r.result5).not.toMatch(/взрослый|новорождённый/);
  });

  test('в/к — та же доза, путь в тексте введения', () => {
    const r = run(20, 'io');
    expect(r.result1).toBe(200);
    expect(r.result4).toMatch(/^в\/к \(внутрикостно\) струйно/);
  });

  test('путь не задан — в/в по умолчанию', () => {
    expect(epi.formula({ weight: 20 }).result4).toMatch(/^в\/в/);
  });

  test('до 10 кг — без неразведённого объёма', () => {
    const r = run(8);
    expect(r.result1).toBe(80);
    expect(r.result3).toBeUndefined();
    expect(r.result5).toMatch(/только разведённый/);
    expect(r.result5).not.toMatch(/новорождённый/);
  });

  test('ровно 10 кг — неразведённый 0,1 мл показан', () => {
    close(run(10).result3, 0.1);
  });

  test('3,5 кг: расчёт по нижней границе и диапазон новорождённого 10–30 мкг/кг', () => {
    const r = run(3.5);
    expect(r.result1).toBe(35);
    close(r.result2, 0.35);
    expect(r.result5).toMatch(/новорождённый.*35–105 мкг.*0,35–1,05 мл/);
  });

  test('граница 5 кг: диапазон новорождённого есть, 5,1 кг — нет', () => {
    expect(run(5).result5).toMatch(/новорождённый/);
    expect(run(5.1).result5).not.toMatch(/новорождённый/);
  });

  test('39 кг — без взрослой подсказки, 40 кг — с подсказкой', () => {
    expect(run(39).result5).not.toMatch(/взрослый/);
    const r = run(40);
    expect(r.result1).toBe(400);
    expect(r.result5).toMatch(/если пациент взрослый — 1 мг/);
  });

  test('взрослый 70 кг: по весу 700 мкг, подсказка про 1 мг и промывание 20 мл', () => {
    const r = run(70);
    expect(r.result1).toBe(700);
    expect(r.result4).toMatch(/взрослым 20 мл/);
    expect(r.result5).toMatch(/независимо от веса/);
  });

  test('120 кг: предел 1 мг, подсказка не нужна', () => {
    const r = run(120);
    expect(r.result1).toBe(1000);
    close(r.result2, 10);
    close(r.result3, 1);
    expect(r.result5).toMatch(/предел 1 мг/);
    expect(r.result5).not.toMatch(/если пациент взрослый/);
  });

  test('ровно 100 кг — 1 мг без пометки о пределе', () => {
    const r = run(100);
    expect(r.result1).toBe(1000);
    expect(r.result5).not.toMatch(/предел/);
  });

  test('limits СЛР', () => {
    expect(limitsOf(epi, { route: 'iv' })).toEqual({ result1: { max: 1000 }, result2: { max: 10 }, result3: { max: 1 } });
  });
});

describe('Эпинефрин — анафилаксия в/м', () => {
  const run = (weight, ageYears) => epiAna.formula({ weight, ageYears });

  test('ребёнок 10 кг, 1 год: 0,01 мг/кг, введение в/м', () => {
    const r = run(10, 1);
    expect(r.result1).toBe(100);
    close(r.result2, 0.1);
    expect(r.result3).toMatch(/^в\/м/);
    expect(r.result4).toMatch(/= 0,1 мг/);
  });

  test('до 6 лет: предел 0,15 мг', () => {
    const r = run(20, 5);
    expect(r.result1).toBe(150);
    close(r.result2, 0.15);
    expect(r.result4).toMatch(/предел 0,15 мг \(до 6 лет\)/);
  });

  test('ровно 6 лет: предел 0,3 мг', () => {
    expect(run(22, 6).result1).toBe(220);
    expect(run(40, 6).result1).toBe(300);
  });

  test('12 лет — ещё 0,3 мг, 13 лет — 0,5 мг', () => {
    expect(run(45, 12).result1).toBe(300);
    expect(run(45, 13).result1).toBe(450);
  });

  test('взрослый 70 кг: 0,5 мг', () => {
    const r = run(70, 30);
    expect(r.result1).toBe(500);
    close(r.result2, 0.5);
    expect(r.result4).toMatch(/старше 12 лет и взрослым/);
  });

  test('новорождённый 3,5 кг: объём меньше 0,1 мл', () => {
    const r = run(3.5, 0);
    expect(r.result1).toBe(35);
    expect(r.result4).toMatch(/меньше 0,1 мл/);
  });

  test('возраст не указан — самый низкий предел 0,15 мг', () => {
    expect(run(30, undefined).result1).toBe(150);
  });

  test('limits по возрасту', () => {
    expect(limitsOf(epiAna, { ageYears: 3 })).toEqual({ result1: { max: 150 }, result2: { max: 0.15 } });
    expect(limitsOf(epiAna, { ageYears: 8 })).toEqual({ result1: { max: 300 }, result2: { max: 0.3 } });
    expect(limitsOf(epiAna, { ageYears: 40 })).toEqual({ result1: { max: 500 }, result2: { max: 0.5 } });
  });
});

describe('Атропин', () => {
  const run = (weight, indication = 'brady-iv') => atropine.formula({ indication, weight });

  test('брадикардия, ребёнок 20 кг: 0,02 мг/кг', () => {
    const r = run(20);
    close(r.result1, 0.4);
    close(r.result2, 0.4);
    expect(r.result3).toMatch(/^в\/в струйно/);
    expect(r.result4).toMatch(/повтор 1 раз/);
    expect(r.result4).not.toMatch(/взрослый/);
  });

  test('брадикардия в/к — та же доза', () => {
    const r = run(20, 'brady-io');
    close(r.result1, 0.4);
    expect(r.result3).toMatch(/^в\/к/);
  });

  test('брадикардия, новорождённый 3 кг: минимум 0,1 мг', () => {
    const r = run(3);
    close(r.result1, 0.1);
    expect(r.result4).toMatch(/минимума 0,1 мг/);
  });

  test('брадикардия, 5 кг — ровно минимум без пометки', () => {
    const r = run(5);
    close(r.result1, 0.1);
    expect(r.result4).not.toMatch(/минимума/);
  });

  test('брадикардия, 25 кг — ровно 0,5 мг без пометки о пределе', () => {
    const r = run(25);
    close(r.result1, 0.5);
    expect(r.result4).not.toMatch(/предел/);
  });

  test('брадикардия, 40 кг: предел 0,5 мг и взрослая схема', () => {
    const r = run(40);
    close(r.result1, 0.5);
    expect(r.result4).toMatch(/предел 0,5 мг/);
    expect(r.result4).toMatch(/если пациент взрослый — 0,5 мг.*до 3 мг/);
  });

  test('брадикардия, взрослый 80 кг: 0,5 мг', () => {
    close(run(80).result1, 0.5);
  });

  test('премедикация в/м, ребёнок 20 кг: 0,01 мг/кг', () => {
    const r = run(20, 'premed-im');
    close(r.result1, 0.2);
    close(r.result2, 0.2);
    expect(r.result3).toMatch(/^в\/м/);
    expect(r.result4).toBeUndefined();
  });

  test('премедикация, новорождённый 3 кг: без минимума, подсказка разведения', () => {
    const r = run(3, 'premed-im');
    close(r.result1, 0.03);
    expect(r.result4).toMatch(/развести/);
  });

  test('премедикация, 40 кг — на пределе 0,4 мг', () => {
    const r = run(40, 'premed-im');
    close(r.result1, 0.4);
    expect(r.result4).toMatch(/предел 0,4 мг.*0,4–0,6 мг/);
  });

  test('премедикация, взрослый 90 кг: 0,4 мг', () => {
    close(run(90, 'premed-im').result1, 0.4);
  });

  test('limits по показанию', () => {
    expect(limitsOf(atropine, { indication: 'brady-iv' }).result1.max).toBe(0.5);
    expect(limitsOf(atropine, { indication: 'premed-im' }).result1.max).toBe(0.4);
  });
});

describe('Амиодарон', () => {
  const run = (weight, indication = 'cpr-iv') => amio.formula({ indication, weight });

  test('СЛР, ребёнок 20 кг: 5 мг/кг', () => {
    const r = run(20);
    expect(r.result1).toBe(100);
    close(r.result2, 2);
    expect(r.result3).toBeUndefined();
    expect(r.result4).toMatch(/^в\/в струйно.*20 мл 5% глюкозы/);
    expect(r.result5).toMatch(/после 5-го разряда.*взрослым 150 мг/);
    expect(r.result5).not.toMatch(/если пациент взрослый/);
  });

  test('СЛР в/к — путь в тексте', () => {
    expect(run(20, 'cpr-io').result4).toMatch(/^в\/к \(внутрикостно\)/);
  });

  test('СЛР, 3 кг (новорождённый): 15 мг', () => {
    expect(run(3).result1).toBe(15);
  });

  test('СЛР, 50 кг: 250 мг по весу и подсказка про взрослые 300 мг', () => {
    const r = run(50);
    expect(r.result1).toBe(250);
    expect(r.result5).toMatch(/если пациент взрослый — 300 мг/);
  });

  test('СЛР, 39 кг — без взрослой подсказки', () => {
    expect(run(39).result5).not.toMatch(/если пациент взрослый/);
  });

  test('СЛР, 70 кг: предел 300 мг', () => {
    const r = run(70);
    expect(r.result1).toBe(300);
    close(r.result2, 6);
    expect(r.result5).toMatch(/предел 300 мг/);
    expect(r.result5).not.toMatch(/если пациент взрослый/);
  });

  test('тахикардия, ребёнок 10 кг: 50 мг, разведение не слабее 0,6 мг/мл', () => {
    const r = run(10, 'tachy-iv');
    expect(r.result1).toBe(50);
    close(r.result2, 1);
    expect(r.result3).toBe(83);
    expect(50 / r.result3).toBeGreaterThanOrEqual(0.6);
    expect(r.result4).toMatch(/капельно.*20–60 мин/);
    expect(r.result5).toBeUndefined();
  });

  test('тахикардия, взрослый 80 кг: 300 мг в 250 мл', () => {
    const r = run(80, 'tachy-iv');
    expect(r.result1).toBe(300);
    expect(r.result3).toBe(250);
    expect(r.result5).toMatch(/предел 300 мг/);
  });

  test('тахикардия, 50 кг: 5 мг/кг = 250 мг (инструкция РФ), без подсказки СЛР', () => {
    const r = run(50, 'tachy-iv');
    expect(r.result1).toBe(250);
    expect(r.result5).toBeUndefined();
  });

  test('новорождённый 3 кг, тахикардия', () => {
    const r = run(3, 'tachy-iv');
    expect(r.result1).toBe(15);
    expect(r.result3).toBe(25);
  });
});

describe('Верапамил', () => {
  const run = (weight, ageYears) => verapamil.formula({ weight, ageYears });

  test('ребёнок 20 кг, 5 лет: 0,1 мг/кг', () => {
    const r = run(20, 5);
    close(r.result1, 2);
    close(r.result2, 0.8);
    expect(r.result3).toBeUndefined();
  });

  test('ребёнок 35 кг, 5 лет: выше справочной возрастной дозы', () => {
    const r = run(35, 5);
    close(r.result1, 3.5);
    expect(r.result3).toMatch(/1–5 лет 2–3 мг/);
  });

  test('ребёнок 60 кг, 15 лет: предел 5 мг', () => {
    const r = run(60, 15);
    close(r.result1, 5);
    close(r.result2, 2);
    expect(r.result3).toMatch(/предел 5 мг/);
  });

  test('ребёнок 40 кг, 12 лет: 4 мг — выше справочной 6–14 лет', () => {
    const r = run(40, 12);
    close(r.result1, 4);
    expect(r.result3).toMatch(/6–14 лет/);
  });

  test('до 1 года — предупреждение', () => {
    const r = run(8, 0.5);
    close(r.result1, 0.8);
    expect(r.result3).toMatch(/До 1 года не рекомендуется/);
  });

  test('взрослый: 5 мг независимо от веса', () => {
    const r = run(90, 18);
    expect(r.result1).toBe(5);
    expect(r.result2).toBe(2);
    expect(r.result3).toMatch(/30 мин/);
  });

  test('limits по возрасту', () => {
    expect(limitsOf(verapamil, { ageYears: 10 }).result1.max).toBe(5);
    expect(limitsOf(verapamil, { ageYears: 40 }).result1.max).toBe(10);
  });
});

describe('Инфузии насосом', () => {
  test('норэпинефрин: 20 кг, 0,1 мкг/кг/мин, 4 мг в 50 мл', () => {
    const r = norepi.formula({ weight: 20, rate: 0.1, drugMg: 4, volume: 50 });
    close(r.result1, 2);
    close(r.result3, 80);
    close(r.result2, 1.5);
    expect(r.result4).toMatch(/По тартрату: 0,2/);
  });

  test('норэпинефрин: взрослый 70 кг, 3 мкг/кг/мин — выше максимума инструкции', () => {
    const r = norepi.formula({ weight: 70, rate: 3, drugMg: 4, volume: 50 });
    expect(r.result4).toMatch(/выше максимума/);
  });

  test('норэпинефрин: 1,5 мкг/кг/мин — проверка ввода', () => {
    expect(norepi.formula({ weight: 70, rate: 1.5, drugMg: 4, volume: 50 }).result4).toMatch(/выше 1 мкг/);
  });

  test('добутамин: 70 кг, 5 мкг/кг/мин, 250 мг в 50 мл', () => {
    const r = dobutamine.formula({ weight: 70, rate: 5, drugMg: 250, volume: 50 });
    close(r.result1, 350);
    close(r.result3, 5000);
    close(r.result2, 4.2);
    expect(r.result4).toBeUndefined();
  });

  test('добутамин: пороги 15 и 40', () => {
    expect(dobutamine.formula({ weight: 20, rate: 20, drugMg: 250, volume: 50 }).result4).toMatch(/обычного/);
    expect(dobutamine.formula({ weight: 20, rate: 45, drugMg: 250, volume: 50 }).result4).toMatch(/максимума/);
  });

  test('допамин: 20 кг, 5 мкг/кг/мин, 200 мг в 50 мл', () => {
    const r = dopamine.formula({ weight: 20, rate: 5, drugMg: 200, volume: 50 });
    close(r.result1, 100);
    close(r.result3, 4000);
    close(r.result2, 1.5);
  });

  test('допамин: пороги 25 и 50', () => {
    expect(dopamine.formula({ weight: 70, rate: 30, drugMg: 200, volume: 50 }).result4).toMatch(/обычного/);
    expect(dopamine.formula({ weight: 70, rate: 50.5, drugMg: 200, volume: 50 }).result4).toMatch(/исключительных/);
  });
});

describe('через движок', () => {
  test.each([
    ['эпинефрин СЛР', epi, 150],
    ['атропин', atropine, 0.3],
    ['амиодарон', amio, 75],
  ])('%s: 15 кг по Broselow без возраста — расчёт выполняется', (_n, f, dose) => {
    const res = computeResult(f, { weight: '15' }, NO_AGE);
    expect(res.success).toBe(true);
    close(res.items.find((i) => i.key === 'result1').value, dose);
  });

  test('без возраста и без options.age — тоже считается', () => {
    expect(computeResult(epi, { weight: '15' }).success).toBe(true);
  });

  test('эпинефрин СЛР: по умолчанию в/в, путь в копии', () => {
    const res = computeResult(epi, { weight: '20' }, NO_AGE);
    expect(res.success).toBe(true);
    expect(res.choices[0]).toMatchObject({ value: 'iv', valueLabel: ROUTES.iv });
    expect(buildCopyText(res)).toMatch(/Путь введения: в\/в/);
  });

  test('эпинефрин СЛР 120 кг — бейдж «= предел»', () => {
    const res = computeResult(epi, { route: 'io', weight: '120' }, NO_AGE);
    expect(res.items.find((i) => i.key === 'result1').status).toBe('atmax');
  });

  test('эпинефрин анафилаксия 5 лет на пределе — бейдж «= предел»', () => {
    const res = computeResult(epiAna, { weight: '25' }, { age: { years: '5', months: '' } });
    expect(res.success).toBe(true);
    expect(res.items.find((i) => i.key === 'result1').status).toBe('atmax');
  });

  test('эпинефрин анафилаксия: возраст обязателен (от него зависит предел)', () => {
    expect(computeResult(epiAna, { weight: '25' }, NO_AGE).error).toBe(true);
  });

  test('атропин премедикация через движок', () => {
    const res = computeResult(atropine, { indication: 'premed-im', weight: '20' }, NO_AGE);
    expect(res.success).toBe(true);
    expect(res.choices[0].valueLabel).toBe('Премедикация — в/м');
  });

  test('амиодарон тахикардия: объём разведения без бейджа предела', () => {
    const res = computeResult(amio, { indication: 'tachy-iv', weight: '80' }, NO_AGE);
    const vol = res.items.find((i) => i.key === 'result3');
    expect(vol.value).toBe(250);
    expect(vol.status).toBe('ok');
  });

  test('неизвестное значение выбора — ошибка ввода', () => {
    expect(computeResult(epi, { route: 'et', weight: '20' }, NO_AGE).error).toBe(true);
    expect(computeResult(atropine, { indication: 'brady-et', weight: '20' }, NO_AGE).error).toBe(true);
  });
});
