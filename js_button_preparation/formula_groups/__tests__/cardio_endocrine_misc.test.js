import group from '../cardio_endocrine_misc';
import { isChoiceInput, ROUTES } from '../../routes';
import { computeResult, buildCopyText, searchFormulas } from '../../engine';

const byName = (start) => {
  const f = group.find((x) => x.name.startsWith(start));
  if (!f) throw new Error(`нет записи «${start}»`);
  return f;
};
const limitsOf = (f, clean) => (typeof f.limits === 'function' ? f.limits(clean) : f.limits || {});
const close = (a, b) => expect(a).toBeCloseTo(b, 6);
const numericKeys = (r) => Object.keys(r).filter((k) => typeof r[k] === 'number');

const lido = byName('Лидокаин');
const atp = byName('Натрия аденозинтрифосфат');
const asa = byName('Ацетилсалициловая');
const furo = byName('Фуросемид');
const insulin = byName('Инсулин');
const glucagon = byName('Глюкагон');
const ond = byName('Ондансетрон');

describe('контракт записей группы', () => {
  test('семь препаратов в порядке спецификации', () => {
    expect(group.map((f) => f.name)).toEqual([
      'Лидокаин',
      'Натрия аденозинтрифосфат (АТФ)',
      'Ацетилсалициловая кислота — ОКС',
      'Фуросемид',
      'Инсулин короткого действия — ДКА (в/в инфузия)',
      'Глюкагон — тяжёлая гипогликемия',
      'Ондансетрон',
    ]);
  });

  test.each(group.map((f) => [f.name, f]))('%s: поля записи', (_n, f) => {
    expect(f.description.length).toBeGreaterThan(20);
    expect(typeof f.formula).toBe('function');
    expect(Array.isArray(f.warnings)).toBe(true);
    expect(f.warnings.length).toBeGreaterThan(0);
    if (f.inputs.weight) expect(f.inputs.weight).toBe('Вес (кг)');
    if (f.inputs.ageYears) expect(f.inputs.ageYears).toBe('Возраст (лет)');
    expect(typeof f.limits === 'function' || typeof f.limits === 'object').toBe(true);
    // Подпись есть у каждой единицы
    Object.keys(f.units).forEach((k) => expect(f.labels[k]).toBeTruthy());
    // Пустой ввод — расчёт не выполняется
    expect(f.formula({})).toEqual({});
  });

  test('поля-выборы: пути только из routes, значение по умолчанию — из вариантов', () => {
    group.forEach((f) => {
      Object.values(f.inputs)
        .filter(isChoiceInput)
        .forEach((c) => expect(c.choices.some((x) => x.value === c.default)).toBe(true));
    });
    expect(furo.inputs.route.choices.map((c) => c.value)).toEqual(['iv', 'im']);
    expect(glucagon.inputs.route.choices.map((c) => c.value)).toEqual(['im', 'sc']);
    glucagon.inputs.route.choices.forEach((c) => expect(c.label).toBe(ROUTES[c.value]));
    expect(lido.inputs.indication.choices.map((c) => c.value)).toEqual([
      'vt-iv',
      'cpr-iv',
      'cpr-io',
      'local',
    ]);
    expect(ond.inputs.indication.choices.map((c) => c.value)).toEqual([
      'nausea-iv',
      'nausea-im',
      'gastro-po',
    ]);
    [lido, ond].forEach((f) =>
      f.inputs.indication.choices
        .filter((c) => c.value.includes('-'))
        .forEach((c) => expect(c.label.endsWith(`— ${ROUTES[c.value.split('-')[1]]}`)).toBe(true)),
    );
  });

  test('единственный путь указан в подписи или описании', () => {
    expect(atp.labels.result1).toMatch(/в\/в/);
    expect(insulin.labels.result2).toMatch(/в\/в инфузия/);
    expect(asa.labels.result1).toMatch(/внутрь/);
  });

  test('нулевой вес — расчёт не выполняется', () => {
    [lido, furo, insulin, glucagon, ond].forEach((f) =>
      expect(f.formula({ weight: 0, ageYears: 30 })).toEqual({}),
    );
  });

  test('синонимы для поиска', () => {
    const first = (q) => searchFormulas(group, q)[0].formula.name;
    expect(first('аспирин')).toBe(asa.name);
    expect(first('лазикс')).toBe(furo.name);
    expect(first('атф')).toBe(atp.name);
    expect(first('аденозин')).toBe(atp.name);
    expect(first('актрапид')).toBe(insulin.name);
    expect(first('глюкаген')).toBe(glucagon.name);
    expect(first('зофран')).toBe(ond.name);
  });
});

describe('Лидокаин — антиаритмик', () => {
  const run = (weight, ageYears, indication = 'vt-iv') =>
    lido.formula({ indication, weight, ageYears });

  test('ребёнок 20 кг, 5 лет: 1 мг/кг, инфузия 20–30 мкг/кг/мин', () => {
    const r = run(20, 5);
    expect(r.result1).toBe(20);
    close(r.result2, 1);
    expect(r.result3).toMatch(/^в\/в медленно за 2–4 мин/);
    expect(r.result4).toMatch(/24–36 мг\/ч/);
  });

  test('взрослый 70 кг: 1 мг/кг (нижняя граница 1–1,5), предел в час и в сутки в тексте', () => {
    const r = run(70, 40);
    expect(r.result1).toBe(70);
    close(r.result2, 3.5);
    expect(r.result4).toMatch(/1–4 мг\/мин/);
    expect(r.result4).toMatch(/300 мг за 1 ч/);
    expect(r.result5).toMatch(/нижней границе/);
  });

  test('максимум 100 мг на болюс: 120 кг', () => {
    const r = run(120, 40);
    expect(r.result1).toBe(100);
    close(r.result2, 5);
    expect(r.result5).toMatch(/предел 100 мг/);
    expect(limitsOf(lido, { indication: 'vt-iv' }).result1.max).toBe(100);
  });

  test('новорождённый 3,5 кг: 3,5 мг', () => {
    const r = run(3.5, 0);
    close(r.result1, 3.5);
    close(r.result2, 0.175);
  });

  test('СЛР: взрослым 100 мг независимо от веса, путь в тексте введения', () => {
    const r = run(60, 18, 'cpr-iv');
    expect(r.result1).toBe(100);
    expect(r.result3).toMatch(/^в\/в струйно/);
    expect(r.result4).toMatch(/50 мг/);
  });

  test('СЛР у ребёнка в/к: 1 мг/кг', () => {
    const r = run(12, 2, 'cpr-io');
    expect(r.result1).toBe(12);
    expect(r.result3).toMatch(/^в\/к/);
    expect(r.result4).toMatch(/ERC 2021 PLS/);
  });

  test('подросток 17 лет, 110 кг, СЛР: предел 100 мг', () => {
    const r = run(110, 17, 'cpr-io');
    expect(r.result1).toBe(100);
    expect(r.result5).toMatch(/предел 100 мг/);
  });

  test('СЛР у ребёнка: та же инфузия 20–30 мкг/кг/мин, что и при ЖТ с пульсом (n32)', () => {
    const cpr = run(20, 5, 'cpr-iv');
    expect(cpr.result4).toMatch(/20–30 мкг\/кг\/мин = 24–36 мг\/ч/);
    expect(cpr.result4).toMatch(/PALS 2020 допускает до 50/);
    expect(cpr.result4).not.toMatch(/20–50/);
    expect(run(20, 5).result4).toMatch(/PALS 2020 допускает до 50/);
  });

  test('подросток 16 лет, 150 кг, ЖТ: инфузия не выше взрослой 240 мг/ч (n32)', () => {
    const r = run(150, 16);
    expect(r.result4).toMatch(/= 180–240 мг\/ч/);
    expect(r.result4).toMatch(
      /ограничено взрослой скоростью 4 мг\/мин = 240 мг\/ч \(расчёт 270 мг\/ч\)/,
    );
    expect(r.result4).not.toMatch(/270 мг\/ч \(/);
    const huge = run(250, 17, 'cpr-iv');
    expect(huge.result4).toMatch(/= 240 мг\/ч \(/);
    expect(huge.result4).toMatch(/расчёт 450 мг\/ч/);
  });

  test('граница: 133 кг — без пометки, 134 кг — с пометкой об ограничении', () => {
    expect(run(133, 16).result4).not.toMatch(/ограничено/);
    expect(run(134, 16).result4).toMatch(/ограничено взрослой скоростью/);
  });
});

describe('Лидокаин — местная анестезия (максимальная доза)', () => {
  const run = (weight, ageYears) => lido.formula({ indication: 'local', weight, ageYears });

  test('ребёнок 20 кг, 5 лет: 3 мг/кг = 60 мг, 3 мл 2%, 6 мл 1%', () => {
    const r = run(20, 5);
    expect(r.result1).toBeUndefined();
    expect(r.result6).toBe(60);
    close(r.result7, 3);
    close(r.result8, 6);
    expect(r.result10).toMatch(/3 мг\/кг/);
    expect(r.result10).toMatch(/до 6 лет/);
  });

  test('граница 12 лет: 4,5 мг/кг', () => {
    close(run(40, 11.99).result6, 120);
    close(run(40, 12).result6, 180);
  });

  test('взрослый 70 кг: 4,5 мг/кг → предел 300 мг', () => {
    const r = run(70, 40);
    expect(r.result6).toBe(300);
    close(r.result7, 15);
    close(r.result8, 30);
    expect(r.result10).toMatch(/предел 300 мг/);
    expect(limitsOf(lido, { indication: 'local' })).toEqual({});
  });

  test('взрослый 60 кг: 270 мг, без предела', () => {
    const r = run(60, 30);
    expect(r.result6).toBe(270);
    expect(r.result10).not.toMatch(/предел/);
  });
});

describe('Натрия аденозинтрифосфат', () => {
  test('взрослый: 3 → 6 → 12 мг по инструкции, КР 2025 — в примечании', () => {
    const r = atp.formula({ ageYears: 40 });
    expect([r.result1, r.result3, r.result5]).toEqual([3, 6, 12]);
    close(r.result2, 0.3);
    close(r.result4, 0.6);
    close(r.result6, 1.2);
    expect(r.result7).toMatch(/в\/в быстро/);
    expect(r.result8).toMatch(/10–20 мг/);
  });

  test('до 18 лет противопоказан — расчёт не выполняется', () => {
    expect(atp.formula({ ageYears: 17 })).toEqual({});
    expect(atp.formula({ ageYears: 0 })).toEqual({});
    expect(atp.formula({ ageYears: 18 }).result1).toBe(3);
    expect(atp.warnings.join(' ')).toMatch(/до 18 лет/i);
  });

  test('максимальная разовая доза 12 мг', () => {
    expect(atp.limits.result5.max).toBe(12);
  });
});

describe('Ацетилсалициловая кислота — ОКС', () => {
  test('500 мг: ½ таблетки = 250 мг', () => {
    const r = asa.formula({ tablet: '500', ageYears: 55 });
    expect(r.result1).toBe(250);
    expect(r.result2).toBe(0.5);
    expect(r.result3).toMatch(/разжевать/);
  });

  test('100 мг кишечнорастворимая: 2 таблетки = 200 мг; 150 мг — 1 таблетка', () => {
    expect(asa.formula({ tablet: '100', ageYears: 55 })).toMatchObject({
      result1: 200,
      result2: 2,
    });
    const r = asa.formula({ tablet: '150', ageYears: 55 });
    expect(r).toMatchObject({ result1: 150, result2: 1 });
    expect(r.result4).toMatch(/2 таблетки/);
  });

  test('все варианты в диапазоне КР 150–300 мг', () => {
    asa.inputs.tablet.choices.forEach((c) => {
      const mg = asa.formula({ tablet: c.value, ageYears: 60 }).result1;
      expect(mg).toBeGreaterThanOrEqual(150);
      expect(mg).toBeLessThanOrEqual(asa.limits.result1.max);
    });
  });

  test('до 18 лет — расчёт не выполняется', () => {
    expect(asa.formula({ tablet: '500', ageYears: 17 })).toEqual({});
    expect(asa.formula({ tablet: '500', ageYears: 18 }).result1).toBe(250);
  });
});

describe('Фуросемид', () => {
  const run = (weight, ageYears, route = 'iv') => furo.formula({ route, weight, ageYears });

  test('ребёнок 12 кг, 2 года: 1 мг/кг', () => {
    const r = run(12, 2);
    expect(r.result1).toBe(12);
    close(r.result2, 1.2);
    expect(r.result3).toMatch(/не быстрее 4 мг\/мин — не менее 3 мин/);
    expect(r.result4).toMatch(/20 мг в сутки/);
  });

  test('ребёнок 30 кг: предел 20 мг', () => {
    const r = run(30, 9);
    expect(r.result1).toBe(20);
    close(r.result2, 2);
    expect(r.result4).toMatch(/предел 20 мг/);
    expect(limitsOf(furo, { ageYears: 9 }).result1.max).toBe(20);
  });

  test('взрослый: 20 мг (нижняя граница 20–40), не менее 5 мин', () => {
    const r = run(80, 50);
    expect(r.result1).toBe(20);
    close(r.result2, 2);
    expect(r.result3).toMatch(/не менее 5 мин/);
    expect(r.result4).toMatch(/40 мг/);
    expect(limitsOf(furo, { ageYears: 50 }).result1.max).toBe(40);
  });

  test('в/м: та же доза, ограничения пути в тексте', () => {
    const r = run(80, 50, 'im');
    expect(r.result1).toBe(20);
    expect(r.result3).toMatch(/^в\/м — только если/);
    expect(r.result3).toMatch(/отёке лёгких не подходит/);
  });

  test('новорождённый 3 кг: 3 мг и примечание', () => {
    const r = run(3, 0);
    expect(r.result1).toBe(3);
    expect(r.result4).toMatch(/новорождённым/);
  });
});

describe('Инсулин короткого действия — ДКА', () => {
  const run = (weight, ageYears, rate = '0.1') => insulin.formula({ rate, weight, ageYears });

  test('взрослый 70 кг: болюс 7 ЕД, инфузия 7 ЕД/ч = 7 мл/ч', () => {
    const r = run(70, 30);
    close(r.result1, 7);
    close(r.result2, 7);
    close(r.result3, 7);
    expect(r.result4).toMatch(/до 1 мл/);
    expect(r.result5).toMatch(/^Болюс 0,1–0,15/);
  });

  test('взрослый: 0,05 ЕД/кг/ч не применяется', () => {
    const r = run(70, 30, '0.05');
    close(r.result2, 7);
    expect(r.result5).toMatch(/^Скорость 0,05 ЕД\/кг\/ч — только для детей/);
  });

  test('ребёнок 20 кг: без болюса, 0,1 ЕД/кг/ч = 2 ЕД/ч', () => {
    const r = run(20, 5);
    expect(r.result1).toBeUndefined();
    close(r.result2, 2);
    close(r.result3, 2);
    expect(r.result4).toMatch(/через 1 ч после начала регидратации/);
  });

  test('ребёнок 20 кг, 0,05 ЕД/кг/ч = 1 ЕД/ч', () => {
    close(run(20, 5, '0.05').result2, 1);
  });

  test('младенец 6 кг, 0,05: меньше 0,5 мл/ч — подсказка о разведении 0,1 ЕД/мл', () => {
    const r = run(6, 0.5, '0.05');
    close(r.result2, 0.3);
    expect(r.result5).toMatch(/0,1 ЕД\/мл/);
    // Алгоритмы 2023: добавка против сорбции инсулина и в разведении 0,1 ЕД/мл (n31)
    expect(r.result5).toMatch(/5 ЕД \+ 2 мл 20% альбумина или 1 мл крови пациента/);
  });

  test('описание: смесь для насоса с альбумином или кровью, как в Алгоритмах 2023 (n31)', () => {
    expect(insulin.description).toMatch(
      /50 ЕД \(0,5 мл\) \+ 2 мл 20% альбумина \(или 1 мл крови пациента\) \+ NaCl 0,9% до 50 мл = 1 ЕД\/мл/,
    );
  });

  test('граница 18 лет: болюс только взрослым', () => {
    expect(run(60, 17).result1).toBeUndefined();
    close(run(60, 18).result1, 6);
  });

  test('возраст не указан — расчёт не выполняется', () => {
    expect(insulin.formula({ rate: '0.1', weight: 20 })).toEqual({});
  });
});

describe('Глюкагон', () => {
  const run = (weight, route = 'im') => glucagon.formula({ route, weight });

  test('ребёнок 20 кг: 0,5 мг = 0,5 мл', () => {
    const r = run(20);
    expect(r.result1).toBe(0.5);
    expect(r.result2).toBe(0.5);
    expect(r.result3).toMatch(/^в\/м/);
  });

  test('граница 25 кг: 25 кг — 0,5 мг, 25,1 кг — 1 мг', () => {
    expect(run(25).result1).toBe(0.5);
    expect(run(25.1).result1).toBe(1);
  });

  test('взрослый, п/к: 1 мг, на пределе', () => {
    const r = run(70, 'sc');
    expect(r.result1).toBe(1);
    expect(r.result3).toMatch(/^п\/к/);
    expect(glucagon.limits.result1.max).toBe(1);
  });
});

describe('Ондансетрон', () => {
  const run = (weight, ageYears, indication = 'nausea-iv') =>
    ond.formula({ indication, weight, ageYears });

  test('ребёнок 20 кг в/в: 0,1 мг/кг = 2 мг = 1 мл', () => {
    const r = run(20, 5);
    expect(r.result1).toBe(2);
    expect(r.result2).toBe(1);
    expect(r.result3).toMatch(/^в\/в медленно/);
  });

  test('ребёнок 50 кг в/в: предел 4 мг', () => {
    const r = run(50, 14);
    expect(r.result1).toBe(4);
    expect(r.result4).toMatch(/предел 4 мг/);
  });

  test('взрослый: 4 мг в/в и в/м', () => {
    expect(run(70, 40).result1).toBe(4);
    const im = run(70, 40, 'nausea-im');
    expect(im.result1).toBe(4);
    expect(im.result3).toMatch(/^в\/м/);
  });

  test('тошнота и рвота в/в и в/м: пометка, что доза — по инструкции для ПОТР, иначе вне инструкции (n34)', () => {
    [run(20, 5), run(50, 14), run(70, 40), run(70, 40, 'nausea-im')].forEach((r) => {
      expect(r.result4).toMatch(/по инструкции РФ для послеоперационной тошноты и рвоты/);
      expect(r.result4).toMatch(/при другой тошноте — вне инструкции/);
    });
    expect(ond.warnings[0]).toMatch(/ПОТР/);
    expect(ond.warnings[0]).toMatch(/вне инструкции/);
  });

  test('детям в/м — расчёт не выполняется', () => {
    expect(run(20, 5, 'nausea-im')).toEqual({});
  });

  test('граница 1 месяца для в/в', () => {
    expect(run(3.5, 0)).toEqual({});
    expect(run(4, 1 / 12).result1).toBeCloseTo(0.4, 6);
  });

  test('внутрь при гастроэнтерите: весовые ступени 2 / 4 / 8 мг', () => {
    expect(run(7.9, 1, 'gastro-po')).toEqual({});
    expect(run(8, 1, 'gastro-po').result1).toBe(2);
    expect(run(15, 3, 'gastro-po').result1).toBe(2);
    expect(run(15.5, 3, 'gastro-po').result1).toBe(4);
    expect(run(30, 9, 'gastro-po').result1).toBe(4);
    const r = run(31, 10, 'gastro-po');
    expect(r.result1).toBe(8);
    expect(r.result2).toBeUndefined();
    expect(r.result4).toMatch(/вне инструкции/i);
    expect(limitsOf(ond, { indication: 'gastro-po' }).result1.max).toBe(8);
  });

  test('внутрь: младше 6 мес и взрослым — расчёт не выполняется', () => {
    expect(run(8, 0.4, 'gastro-po')).toEqual({});
    expect(run(8, 0.5, 'gastro-po').result1).toBe(2);
    expect(run(70, 18, 'gastro-po')).toEqual({});
  });
});

describe('через движок', () => {
  test('лидокаин, местная анестезия: строки с подписями «Максимальная…»', () => {
    const res = computeResult(
      lido,
      { indication: 'local', weight: '20' },
      { age: { years: '5', months: '' } },
    );
    expect(res.success).toBe(true);
    const names = res.items.map((i) => i.name);
    expect(names).toContain('Максимальная доза (местная анестезия)');
    expect(names).toContain('Максимальный объём 1% (10 мг/мл)');
    expect(res.items.find((i) => i.key === 'result6').text).toBe('60 мг');
    expect(res.choices[0].valueLabel).toBe('Местная анестезия — максимальная доза');
  });

  test('АТФ ребёнку — информационный результат с предупреждениями', () => {
    const res = computeResult(atp, {}, { age: { years: '10', months: '' } });
    expect(res.info).toBe(true);
    expect(res.warnings.length).toBeGreaterThan(0);
  });

  test('глюкагон взрослому: на пределе 1 мг, текст копии с формой выпуска', () => {
    const res = computeResult(
      glucagon,
      { route: 'im', weight: '70' },
      { now: new Date(2026, 0, 1, 9, 5) },
    );
    expect(res.success).toBe(true);
    expect(res.items[0].status).toBe('atmax');
    const copy = buildCopyText(res);
    expect(copy).toMatch(/Форма выпуска: ГлюкаГен/);
    expect(copy).toMatch(/Путь введения: в\/м/);
    expect(copy).toMatch(/Рассчитано: 09:05/);
  });

  test('инсулин: единицы ЕД/ч и мл/ч форматируются', () => {
    const res = computeResult(
      insulin,
      { rate: '0.1', weight: '20' },
      { age: { years: '5', months: '' } },
    );
    expect(res.success).toBe(true);
    expect(res.items.find((i) => i.key === 'result2').text).toBe('2.00 ЕД/ч');
    expect(res.items.find((i) => i.key === 'result3').text).toBe('2.00 мл/ч');
  });

  test.each(group.map((f) => [f.name, f]))(
    '%s: типичный взрослый считается без ошибок',
    (_n, f) => {
      const res = computeResult(f, { weight: '70' }, { age: { years: '40', months: '' } });
      expect(res.error).toBeUndefined();
      expect(res.success).toBe(true);
      res.items.filter((i) => i.unit).forEach((i) => expect(i.status).not.toBe('high'));
    },
  );

  test('числовые результаты конечны и положительны на сетке входов', () => {
    const weights = [3, 8, 15, 25, 40, 70, 150];
    const ages = [0, 0.5, 2, 6, 12, 17, 18, 60];
    group.forEach((f) => {
      const choiceKey = Object.keys(f.inputs).find((k) => isChoiceInput(f.inputs[k]));
      const values = choiceKey ? f.inputs[choiceKey].choices.map((c) => c.value) : [undefined];
      values.forEach((v) =>
        weights.forEach((weight) =>
          ages.forEach((ageYears) => {
            const r = f.formula({ [choiceKey || 'x']: v, weight, ageYears });
            numericKeys(r).forEach((k) => {
              expect(Number.isFinite(r[k])).toBe(true);
              expect(r[k]).toBeGreaterThan(0);
            });
          }),
        ),
      );
    });
  });
});
