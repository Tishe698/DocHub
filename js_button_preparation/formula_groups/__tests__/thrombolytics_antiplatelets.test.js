import group from '../thrombolytics_antiplatelets';
import { isChoiceInput } from '../../routes';
import { computeResult, buildCopyText, searchFormulas } from '../../engine';

const byName = (start) => {
  const f = group.find((x) => x.name.startsWith(start));
  if (!f) throw new Error(`нет записи «${start}»`);
  return f;
};
const limitsOf = (f, clean) => (typeof f.limits === 'function' ? f.limits(clean) : f.limits || {});
const close = (a, b) => expect(a).toBeCloseTo(b, 6);

const altStemi = byName('Актилизе (алтеплаза) — ИМпST');
const altStroke = byName('Актилизе (алтеплаза) — ишемический инсульт');
const altPe = byName('Актилизе (алтеплаза) — ТЭЛА');
const tnk = byName('Метализе');
const puro = byName('Пуролаза');
const FORT_INN = 'рекомбинантный белок, содержащий аминокислотную последовательность стафилокиназы';
const fortStemi = byName(`Фортелизин (${FORT_INN}) — ИМпST`);
const fortStroke = byName(`Фортелизин (${FORT_INN}) — ишемический инсульт`);
const tica = byName('Брилинта');

describe('контракт записей группы', () => {
  test('восемь записей в порядке спецификации, название: общеизвестное (мнн)', () => {
    expect(group.map((f) => f.name)).toEqual([
      'Актилизе (алтеплаза) — ИМпST',
      'Актилизе (алтеплаза) — ишемический инсульт',
      'Актилизе (алтеплаза) — ТЭЛА',
      'Метализе (тенектеплаза) — ИМпST',
      'Пуролаза (проурокиназа) — ИМпST',
      `Фортелизин (${FORT_INN}) — ИМпST`,
      `Фортелизин (${FORT_INN}) — ишемический инсульт`,
      'Брилинта (тикагрелор) — ОКС',
    ]);
    group.forEach((f) => expect(f.name).toMatch(/^[А-ЯЁ][а-яё]+ \([а-яё ,]+\)/));
  });

  test.each(group.map((f) => [f.name, f]))('%s: поля записи', (_n, f) => {
    expect(f.description.length).toBeGreaterThan(20);
    // Все пять препаратов — в укладках СМП по обоим приказам
    expect(f.description).toMatch(/1165н/);
    expect(f.description).toMatch(/424н/);
    expect(typeof f.formula).toBe('function');
    expect(Array.isArray(f.warnings)).toBe(true);
    expect(f.warnings.length).toBeGreaterThan(1);
    expect(f.warnings[0]).toMatch(/18 лет/);
    if (f.inputs.weight) expect(f.inputs.weight).toBe('Вес (кг)');
    expect(f.inputs.ageYears).toBe('Возраст (лет)');
    expect(typeof f.limits === 'function' || typeof f.limits === 'object').toBe(true);
    Object.keys(f.units).forEach((k) => expect(f.labels[k]).toBeTruthy());
    // Пустой ввод — расчёт не выполняется
    expect(f.formula({})).toEqual({});
    // Ребёнок или подросток до 18 лет — не считается
    expect(f.formula({ weight: 60, ageYears: 17 })).toEqual({});
    expect(f.formula({ weight: 20, ageYears: 5 })).toEqual({});
  });

  test('поля-выборы: значение по умолчанию — из вариантов', () => {
    group.forEach((f) =>
      Object.values(f.inputs)
        .filter(isChoiceInput)
        .forEach((c) => expect(c.choices.some((x) => x.value === c.default)).toBe(true)),
    );
    expect(altStemi.inputs.scheme.choices.map((c) => c.value)).toEqual(['accel', 'slow']);
    expect(puro.inputs.scheme.choices.map((c) => c.value)).toEqual(['bolusInfusion', 'double']);
    expect(fortStemi.inputs.scheme.choices.map((c) => c.value)).toEqual([
      'single',
      'double',
      'infusion',
    ]);
    expect(tica.inputs.indication.choices.map((c) => c.value)).toEqual([
      'nste',
      'pci',
      'noReperfusion',
      'lysis',
    ]);
  });

  test('единственный путь указан в подписи или описании', () => {
    [altStemi, altStroke, altPe, tnk, puro, fortStemi, fortStroke].forEach((f) =>
      expect(Object.values(f.labels).some((l) => /в\/в/.test(l))).toBe(true),
    );
    expect(tica.labels.result1).toMatch(/внутрь/);
  });

  test('тромболитики: окна времени и противопоказания в предупреждениях', () => {
    [altStemi, tnk, puro, fortStemi].forEach((f) => {
      const w = f.warnings.join(' ');
      expect(w).toMatch(/12 ч/);
      expect(w).toMatch(/120 мин/);
      expect(w).toMatch(/Абсолютные противопоказания/);
      expect(w).toMatch(/Тикагрелор до и во время ТЛТ не назначать/);
    });
    [altStroke, fortStroke].forEach((f) => {
      const w = f.warnings.join(' ');
      expect(w).toMatch(/4,5 ч/);
      expect(w).toMatch(/185\/110/);
      expect(w).toMatch(/NIHSS > 25/);
      expect(w).toMatch(/сахарным диабетом/);
      expect(w).toMatch(/СЛР > 2 мин/);
    });
  });

  test('инсульт: противопоказания по инструкции своего препарата', () => {
    const alt = altStroke.warnings.join(' ');
    // Инструкция «Актилизе»: обширная операция или травма — 3 мес, глюкоза 2,77–22,2
    expect(alt).toMatch(/«Актилизе»/);
    expect(alt).toMatch(/обширная операция или обширная травма за 3 мес/);
    expect(alt).toMatch(/< 2,77 или > 22,2 ммоль\/л/);
    expect(alt).not.toMatch(/14 сут/);
    expect(alt).not.toMatch(/Фортелизин/);
    // Инструкция «Фортелизин»: 14 сут в разделе по инсульту, 4 нед в общих — на экране строгий срок
    const fort = fortStroke.warnings.join(' ');
    expect(fort).toMatch(/«Фортелизин»/);
    expect(fort).toMatch(/обширная травма за 4 нед/);
    expect(fort).toMatch(/14 сут/);
    expect(fort).toMatch(/тяжёлая ЧМТ за 3 мес/);
    expect(fort).toMatch(/< 2,7 или > 22,0 ммоль\/л/);
    expect(fort).not.toMatch(/Актилизе/);
  });

  test('нулевой вес — расчёт не выполняется', () => {
    [altStemi, altStroke, altPe, tnk, puro].forEach((f) =>
      expect(f.formula({ weight: 0, ageYears: 40 })).toEqual({}),
    );
  });

  test('поиск: торговое название, МНН, синонимы', () => {
    const first = (q) => searchFormulas(group, q)[0].formula.name;
    expect(first('алтеплаза')).toBe(altStemi.name);
    expect(first('актилизе инсульт')).toBe(altStroke.name);
    expect(first('тенектеплаза')).toBe(tnk.name);
    expect(first('проурокиназа')).toBe(puro.name);
    expect(first('фортеплазе')).toBe(fortStemi.name);
    expect(first('стафилокиназа')).toBe(fortStemi.name);
    expect(first('рекомбинантный белок стафилокиназы')).toBe(fortStemi.name);
    expect(first('фортелизин инсульт')).toBe(fortStroke.name);
    expect(first('тикагрелор')).toBe(tica.name);
    expect(searchFormulas(group, 'тромболизис').length).toBe(7);
  });
});

describe('Актилизе — ИМпST', () => {
  const run = (weight, scheme = 'accel', ageYears = 55) =>
    altStemi.formula({ weight, ageYears, scheme });

  test('ускоренная схема, 80 кг: 15 + 50 + 35 = 100 мг', () => {
    const r = run(80);
    expect(r.result1).toBe(15);
    expect(r.result2).toBe(15);
    expect(r.result3).toBe(50);
    expect(r.result4).toBe(100); // 50 мг за 30 мин при 1 мг/мл
    expect(r.result5).toBe(35);
    expect(r.result6).toBe(35);
    expect(r.result7).toBe(100);
    expect(limitsOf(altStemi).result7.max).toBe(100);
  });

  test('ускоренная схема, граница 65 кг: фиксированная схема', () => {
    expect(run(65).result7).toBe(100);
    expect(run(65).result8).toMatch(/65 кг и более/);
  });

  test('ускоренная схема, 60 кг: 0,75 и 0,5 мг/кг', () => {
    const r = run(60);
    close(r.result3, 45);
    close(r.result4, 90);
    close(r.result5, 30);
    close(r.result7, 90);
    expect(r.result8).toMatch(/менее 65 кг/);
  });

  test('ускоренная схема, малая масса 40 кг: 15 + 30 + 20', () => {
    const r = run(40);
    close(r.result3, 30);
    close(r.result5, 20);
    close(r.result7, 65);
  });

  test('3-часовая схема, 70 кг: 10 + 50 за 1-й час + 40 за 2 ч', () => {
    const r = run(70, 'slow');
    expect(r.result9).toBe(10);
    expect(r.result10).toBe(50);
    expect(r.result11).toBe(50);
    expect(r.result12).toBe(40);
    expect(r.result13).toBe(20);
    expect(r.result14).toBe(100);
    expect(r.result15).toMatch(/2 ч/);
  });

  test('3-часовая схема, 50 кг: не более 1,5 мг/кг = 75 мг', () => {
    const r = run(50, 'slow');
    expect(r.result14).toBe(75);
    expect(r.result12).toBe(15);
    expect(r.result15).toMatch(/1,5 мг\/кг = 75 мг/);
  });

  test('3-часовая схема, 30 кг: схема обрывается в 1-й час', () => {
    const r = run(30, 'slow');
    expect(r.result14).toBe(45);
    expect(r.result10).toBe(35);
    expect(r.result12).toBeUndefined();
    expect(r.result15).toMatch(/достигнут предел/);
  });

  test('ключи схем не пересекаются', () => {
    const a = Object.keys(run(70));
    const b = Object.keys(run(70, 'slow'));
    expect(a.filter((k) => b.includes(k))).toEqual([]);
  });
});

describe('Актилизе — ишемический инсульт', () => {
  const run = (weight, ageYears = 60) => altStroke.formula({ weight, ageYears });

  test('70 кг: 0,9 мг/кг = 63 мг, болюс 10 %, инфузия за 60 мин', () => {
    const r = run(70);
    close(r.result1, 63);
    close(r.result2, 63);
    close(r.result3, 6.3);
    close(r.result4, 56.7);
    close(r.result5, 56.7);
  });

  test('100 кг ровно на пределе 90 мг', () => {
    const r = run(100);
    close(r.result1, 90);
    expect(r.result6).not.toMatch(/достигнут/);
  });

  test('120 кг: предел 90 мг, примечание', () => {
    const r = run(120);
    expect(r.result1).toBe(90);
    close(r.result3, 9);
    close(r.result4, 81);
    expect(r.result6).toMatch(/достигнут предел 90 мг \(расчёт 108 мг\)/);
    expect(limitsOf(altStroke).result1.max).toBe(90);
  });

  test('старше 80 лет — примечание КР 814', () => {
    expect(run(70, 85).result6).toMatch(/старше 80 лет/);
    expect(run(70, 80).result6).not.toMatch(/старше 80 лет/);
  });

  test('18 лет — считается', () => {
    close(run(60, 18).result1, 54);
  });
});

describe('Актилизе — ТЭЛА', () => {
  const run = (weight) => altPe.formula({ weight, ageYears: 50 });

  test('80 кг: 10 мг болюс + 90 мг за 2 ч (45 мл/ч)', () => {
    const r = run(80);
    expect(r.result1).toBe(10);
    expect(r.result2).toBe(90);
    expect(r.result3).toBe(45);
    expect(r.result4).toBe(100);
  });

  test('50 кг: не более 1,5 мг/кг = 75 мг', () => {
    const r = run(50);
    expect(r.result4).toBe(75);
    expect(r.result2).toBe(65);
    close(r.result3, 32.5);
    expect(r.result5).toMatch(/менее 65 кг/);
  });
});

describe('Метализе — ИМпST', () => {
  const run = (weight, ageYears = 60) => tnk.formula({ weight, ageYears });

  test.each([
    [50, 30],
    [59.9, 30],
    [60, 35],
    [69.9, 35],
    [70, 40],
    [80, 45],
    [89.9, 45],
    [90, 50],
    [150, 50],
  ])('масса %s кг → %s мг', (w, mg) => {
    const r = run(w);
    expect(r.result1).toBe(mg);
    expect(r.result2).toBe(mg * 200);
    close(r.result3, mg / 5);
  });

  test('старше 75 лет (с 75 полных лет) — половина дозы (КР ИМпST 2024, STREAM)', () => {
    const r = run(85, 75);
    expect(r.result1).toBe(22.5);
    close(r.result3, 4.5);
    expect(r.result5).toMatch(/старше 75 лет \(с 75 полных лет\) — половина дозы/);
    expect(r.result5).toMatch(/STREAM/);
    expect(run(90, 80).result1).toBe(25);
    expect(run(85, 74).result1).toBe(45);
    expect(run(85, 74).result5).not.toMatch(/половина/);
  });

  test('предел 50 мг', () => {
    expect(limitsOf(tnk).result1.max).toBe(50);
    expect(run(200).result1).toBe(50);
  });
});

describe('Пуролаза — ИМпST', () => {
  const run = (weight, scheme = 'bolusInfusion') => puro.formula({ weight, ageYears: 60, scheme });

  test('болюс + инфузия, 70 кг: 2 + 4 млн МЕ', () => {
    const r = run(70);
    expect(r.result1).toBe(2);
    expect(r.result2).toBe(20);
    expect(r.result3).toBe(4);
    expect(r.result4).toBe(40);
    expect(r.result5).toBe(100);
    expect(r.result6).toBe(6);
    expect(r.result7).toBe(3);
    expect(r.result8).toMatch(/открыть 3 фл, использовать полностью \(60 мл\)/);
  });

  test('флаконы: открыть целое число, остаток не использовать', () => {
    // 50 кг: 5 млн МЕ → 3 флакона, набрать 50 мл, остаток 1 млн МЕ
    const r = run(50);
    expect(r.result7).toBe(3);
    expect(r.result8).toMatch(
      /открыть 3 фл \(6 млн МЕ\), из них набрать 5 млн МЕ = 50 мл; остаток 1 млн МЕ не использовать/,
    );
    // 33 кг: 3,3 млн МЕ → 2 флакона
    expect(run(33).result7).toBe(2);
    // Двойной болюс: 70 кг — 5 млн МЕ → 3 флакона; 90 кг — 6 млн → 3; 100 кг — 7 млн → 4
    expect(run(70, 'double').result14).toBe(3);
    expect(run(70, 'double').result15).toMatch(/остаток 1 млн МЕ не использовать/);
    expect(run(90, 'double').result14).toBe(3);
    expect(run(100, 'double').result14).toBe(4);
    expect(run(55, 'double').result14).toBe(2);
    expect(puro.labels.result7).toMatch(/Открыть флаконов/);
    expect(puro.labels.result14).toMatch(/Открыть флаконов/);
  });

  test('болюс + инфузия, границы 60 и 85 кг — группа 60–85', () => {
    expect(run(60).result3).toBe(4);
    expect(run(85).result3).toBe(4);
    expect(run(85.5).result3).toBe(6);
    expect(run(100).result6).toBe(8);
  });

  test('болюс + инфузия, 50 кг: 100 000 МЕ/кг − 2 млн', () => {
    const r = run(50);
    close(r.result3, 3);
    close(r.result6, 5);
    expect(limitsOf(puro, { weight: 50 }).result6.max).toBe(5);
  });

  test('болюс + инфузия, масса 20 кг и менее — не считается', () => {
    expect(run(20)).toEqual({});
    expect(run(21).result3).toBeGreaterThan(0);
  });

  test.each([
    [60, undefined, 4],
    [60.5, 1, 5],
    [75, 1, 5],
    [76, 2, 6],
    [90, 2, 6],
    [100, 3, 7],
    [110, 3, 7],
    [120, 4, 8],
  ])('двойной болюс, %s кг: второй %s млн МЕ, всего %s', (w, second, total) => {
    const r = run(w, 'double');
    expect(r.result9).toBe(4);
    expect(r.result10).toBe(40);
    expect(r.result11).toBe(second);
    expect(r.result13).toBe(total);
  });

  test('двойной болюс до 60 кг: второй не вводится, примечание', () => {
    expect(run(55, 'double').result15).toMatch(/второй болюс не вводится/);
    expect(run(55, 'double').result15).toMatch(/не более 100 000 МЕ\/кг\.$/);
  });

  test('двойной болюс при массе менее 40 кг не считается', () => {
    expect(run(39, 'double')).toEqual({});
    expect(run(40, 'double').result13).toBe(4);
  });

  test('предел — 100 000 МЕ/кг, не более 8 млн МЕ', () => {
    expect(limitsOf(puro, { weight: 70 }).result13.max).toBe(7);
    expect(limitsOf(puro, { weight: 150 }).result6.max).toBe(8);
  });
});

describe('Фортелизин', () => {
  test('ИМпST, однократный болюс 15 мг = 3 флакона', () => {
    const r = fortStemi.formula({ ageYears: 60, scheme: 'single' });
    expect(r.result1).toBe(15);
    expect(r.result2).toBe(15);
    expect(r.result8).toBe(15);
    expect(r.result9).toBe(3);
    expect(r.result4).toBeUndefined();
  });

  test('ИМпST, двойной болюс 10 + 5 мг', () => {
    const r = fortStemi.formula({ ageYears: 60, scheme: 'double' });
    expect(r.result1).toBe(10);
    expect(r.result4).toBe(5);
    expect(r.result8).toBe(15);
  });

  test('ИМпST, болюс 10 мг + инфузия 5 мг за 30 мин (100 мл/ч)', () => {
    const r = fortStemi.formula({ ageYears: 60, scheme: 'infusion' });
    expect(r.result1).toBe(10);
    expect(r.result6).toBe(5);
    expect(r.result7).toBe(100);
    expect(r.result8).toBe(15);
    expect(limitsOf(fortStemi).result8.max).toBe(15);
  });

  test('инсульт: 10 мг болюсом = 2 флакона; старше 80 — осторожность', () => {
    const r = fortStroke.formula({ ageYears: 65 });
    expect(r.result1).toBe(10);
    expect(r.result3).toBe(2);
    expect(fortStroke.formula({ ageYears: 85 }).result5).toMatch(/Старше 80 лет/);
  });
});

describe('Брилинта (тикагрелор)', () => {
  const run = (indication, ageYears = 60) => tica.formula({ indication, ageYears });

  test.each(['nste', 'pci', 'noReperfusion'])('%s: нагрузочная 180 мг = 2 таблетки', (ind) => {
    const r = run(ind);
    expect(r.result1).toBe(180);
    expect(r.result2).toBe(2);
    expect(r.result3).toMatch(/90 мг 2 раза в сутки/);
    expect(limitsOf(tica).result1.max).toBe(180);
  });

  test('тромболизис: тикагрелор не назначается, только текст', () => {
    const r = run('lysis');
    expect(r.result1).toBeUndefined();
    expect(r.result5).toBeUndefined();
    expect(r.result4).toMatch(/Не назначать до и во время ТЛТ/);
    // Клопидогрел — формулировка КР ИМпST 2024
    expect(r.result4).toMatch(/старше 75 лет — 75 мг без нагрузочной дозы/);
    expect(r.result4).not.toMatch(/75 лет и старше/);
  });

  test('ОКСбпST: условия КР — не рутинно до КГ и не догоспитально', () => {
    const r = run('nste');
    expect(r.result3).not.toMatch(/независимо от стратегии/);
    expect(r.result5).toMatch(/до результатов КГ не рекомендуется \(ЕОК IIIA\)/);
    expect(r.result5).toMatch(/догоспитальном этапе не имеет доказательств/);
    expect(r.result5).toMatch(/не планируется.*\(ЕОК IIaB\)/);
    expect(r.result5).toMatch(/прасугрел/);
    // Показание по умолчанию — тоже с условиями
    expect(tica.formula({ ageYears: 60 }).result5).toBe(r.result5);
  });

  test.each(['pci', 'noReperfusion'])('%s: догоспитально не обязательно (КР ИМпST 2024)', (ind) => {
    const r = run(ind);
    expect(r.result5).toMatch(/Догоспитально не обязательно/);
    expect(r.result5).toMatch(/несомненном диагнозе и согласовании с ЧКВ-центром/);
    expect(r.result5).toMatch(/ATLANTIC/);
  });

  test('предупреждение для СМП о догоспитальном этапе', () => {
    const w = tica.warnings.join(' ');
    expect(w).toMatch(/до КГ не назначать \(КР 2024, ЕОК IIIA\)/);
    expect(w).toMatch(/согласовании с ЧКВ-центром/);
  });

  test('75 лет и старше — примечание об осторожности', () => {
    expect(run('nste', 75).result4).toMatch(/75 лет и старше/);
    expect(run('nste', 74).result4).not.toMatch(/75 лет/);
  });
});

describe('через движок', () => {
  const age = (years) => ({ age: { years: String(years), months: '' } });

  test('алтеплаза при инсульте 120 кг: значок предела 90 мг, текст копии', () => {
    const res = computeResult(altStroke, { weight: '120' }, age(60));
    expect(res.success).toBe(true);
    expect(res.items.find((i) => i.key === 'result1').status).toBe('atmax');
    const copy = buildCopyText(res);
    expect(copy).toMatch(/1 мг\/мл/);
  });

  test('тикагрелор при тромболизисе — результат-примечание', () => {
    const res = computeResult(tica, { indication: 'lysis' }, age(60));
    expect(res.success).toBe(true);
    expect(res.items).toHaveLength(1);
    expect(res.items[0].status).toBe('info');
  });

  test('ребёнку — информационный результат с предупреждениями', () => {
    const res = computeResult(tnk, { weight: '30' }, age(10));
    expect(res.info).toBe(true);
    expect(res.warnings[0]).toMatch(/18 лет/);
  });

  test.each(group.map((f) => [f.name, f]))('%s: взрослый 70 кг, 40 лет — расчёт', (_n, f) => {
    const res = computeResult(f, { weight: '70' }, age(40));
    expect(res.success).toBe(true);
    res.items
      .filter((i) => i.value !== null)
      .forEach((i) => expect(i.status === 'high' || i.status === 'zero').toBe(false));
  });
});
