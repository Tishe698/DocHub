import group from '../electrolytes_solutions';
import { isChoiceInput, ROUTES } from '../../routes';
import { computeResult, buildCopyText, searchFormulas, isReferenceOnly } from '../../engine';

const byName = (start) => {
  const f = group.find((x) => x.name.startsWith(start));
  if (!f) throw new Error(`нет записи «${start}»`);
  return f;
};
const close = (a, b) => expect(a).toBeCloseTo(b, 6);

const kcl = byName('Калия хлорид');
const cacl = byName('Кальция хлорид');
const rl = byName('Рингер-лактат');
const stf = byName('Стерофундин');
const pan = byName('Панангин');

const K4 = 40 / 74.55; // ммоль/мл 4%
const K75 = 75 / 74.55; // ммоль/мл 7,5%
const CA = 100 / 219.08; // ммоль Ca²⁺ в 1 мл 10% (гексагидрат)

describe('контракт записей группы', () => {
  test('пять препаратов в порядке спецификации, название — общеизвестное, МНН в скобках', () => {
    expect(group.map((f) => f.name)).toEqual([
      'Калия хлорид',
      'Кальция хлорид',
      'Рингер-лактат (натрия лактата раствор сложный)',
      'Стерофундин изотонический (калия хлорид + кальция хлорид + магния хлорид + натрия ацетат + натрия хлорид + яблочная кислота)',
      'Панангин (калия и магния аспарагинат)',
    ]);
  });

  test.each(group.map((f) => [f.name, f]))('%s: поля записи', (_n, f) => {
    expect(f.description.length).toBeGreaterThan(20);
    expect(typeof f.formula).toBe('function');
    expect(Array.isArray(f.warnings)).toBe(true);
    expect(f.warnings.length).toBeGreaterThan(0);
    if (f.inputs.weight) expect(f.inputs.weight).toBe('Вес (кг)');
    if (f.inputs.ageYears) expect(f.inputs.ageYears).toBe('Возраст (лет)');
    expect(typeof f.limits).toBe('object');
    Object.keys(f.units).forEach((k) => expect(f.labels[k]).toBeTruthy());
    Object.keys(f.limits).forEach((k) => expect(f.units[k]).toBeTruthy());
    // Пустой ввод — расчёт не выполняется
    expect(f.formula({})).toEqual({});
    expect(isReferenceOnly(f)).toBe(false);
  });

  test('поля-выборы: значения по умолчанию из вариантов, пути только из routes', () => {
    group.forEach((f) =>
      Object.values(f.inputs)
        .filter(isChoiceInput)
        .forEach((c) => expect(c.choices.some((x) => x.value === c.default)).toBe(true)),
    );
    expect(kcl.inputs.vein.choices.map((c) => c.value)).toEqual(['peripheral', 'central']);
    expect(kcl.inputs.conc.choices.map((c) => c.value)).toEqual(['4', '7.5']);
    expect(cacl.inputs.indication.choices.map((c) => c.value)).toEqual([
      'hyperk',
      'hypoca',
      'ccb',
      'cpr',
    ]);
    expect(rl.inputs.indication.choices.map((c) => c.value)).toEqual([
      'shock-iv',
      'shock-io',
      'daily',
    ]);
    expect(stf.inputs.indication.choices.map((c) => c.value)).toEqual([
      'shock-iv',
      'shock-io',
      'daily',
    ]);
    // Подпись варианта заканчивается путём из ROUTES
    [rl, stf].forEach((f) =>
      f.inputs.indication.choices.forEach((c) => {
        const code = c.value === 'shock-io' ? 'io' : 'iv';
        expect(c.label.endsWith(`— ${ROUTES[code]}`)).toBe(true);
      }),
    );
  });

  test('укладки СМП упомянуты в описании', () => {
    [stf, pan].forEach((f) => expect(f.description).toMatch(/1165н.*424н/));
    [kcl, cacl, rl].forEach((f) => expect(f.description).toMatch(/укладках СМП .* нет/));
  });

  test('поиск по привычным названиям', () => {
    const first = (q) => searchFormulas(group, q)[0].formula.name;
    expect(first('хлористый кальций')).toBe(cacl.name);
    expect(first('kcl')).toBe(kcl.name);
    expect(first('хартмана')).toBe(rl.name);
    expect(first('стерофундин')).toBe(stf.name);
    expect(first('аспаркам')).toBe(pan.name);
    expect(first('панангин')).toBe(pan.name);
  });
});

describe('Калия хлорид', () => {
  test('взрослый 70 кг, периферия, 4%: 10 ммоль/ч (предел), объёмы и сутки', () => {
    const r = kcl.formula({ weight: 70, ageYears: 40, vein: 'peripheral', conc: '4' });
    expect(r.result1).toBe(10);
    close(r.result2, 10 / K4);
    expect(r.result3).toBe(250); // 10 ммоль при 40 ммоль/л
    expect(r.result4).toBeUndefined();
    expect(r.result6).toBe(200);
    close(r.result7, 200 / K4);
    expect(r.result8).toBeUndefined(); // курс 3 ч — только детям
    expect(r.result9).toMatch(/предел 10 ммоль\/ч/);
    expect(r.result9).toMatch(/суточный предел 200 ммоль/);
    expect(r.result9).toMatch(/134 мл/);
  });

  test('взрослый 70 кг, центральная вена, 7,5%: 20 ммоль/ч (предел), монитор ЭКГ', () => {
    const r = kcl.formula({ weight: 70, ageYears: 40, vein: 'central', conc: '7.5' });
    expect(r.result1).toBeUndefined();
    expect(r.result4).toBe(20);
    close(r.result5, 20 / K75);
    close(r.result7, 200 / K75);
    expect(r.result9).toMatch(/монитор ЭКГ/);
  });

  test('ребёнок 10 кг: 0,2 ммоль/кг/ч, курс 3 ч, сутки 3 ммоль/кг', () => {
    const r = kcl.formula({ weight: 10, ageYears: 1, vein: 'peripheral', conc: '4' });
    close(r.result1, 2);
    close(r.result3, 50);
    close(r.result8, 6);
    close(r.result6, 30);
    expect(r.result9).toMatch(/детям — 3 ч/);
    const c = kcl.formula({ weight: 10, ageYears: 1, vein: 'central', conc: '4' });
    close(c.result4, 3); // 0,3 ммоль/кг/ч
    expect(c.result8).toBeUndefined();
  });

  test('границы массы: 50 кг — предел периферии; центральная вена 60 и 80 кг; сутки 60 кг; 0,5 кг', () => {
    expect(kcl.formula({ weight: 50, ageYears: 30 }).result1).toBe(10);
    expect(kcl.formula({ weight: 49, ageYears: 30 }).result9).not.toMatch(/предел 10/);
    close(kcl.formula({ weight: 60, ageYears: 30, vein: 'central' }).result4, 18);
    expect(kcl.formula({ weight: 80, ageYears: 30, vein: 'central' }).result4).toBe(20);
    close(kcl.formula({ weight: 60, ageYears: 30 }).result6, 180);
    expect(kcl.formula({ weight: 0.5, ageYears: 0 }).result1).toBeCloseTo(0.1, 6);
  });

  test('возраст 18 лет — без детского курса; 17 — с курсом', () => {
    expect(kcl.formula({ weight: 60, ageYears: 18 }).result8).toBeUndefined();
    close(kcl.formula({ weight: 60, ageYears: 17 }).result8, 30); // 10 ммоль/ч × 3
  });

  test('движок: на пределе — «= предел», значения по умолчанию выборов', () => {
    const res = computeResult(kcl, { weight: '70' }, { age: { years: '40', months: '' } });
    expect(res.success).toBe(true);
    expect(res.items.find((i) => i.key === 'result1').status).toBe('atmax');
    expect(res.items.find((i) => i.key === 'result6').status).toBe('atmax');
    const copy = buildCopyText(res);
    expect(copy).toMatch(/Вена: Периферическая/);
    expect(copy).toMatch(/Концентрат: 4%/);
  });
});

describe('Кальция хлорид', () => {
  test('взрослый 70 кг, гиперкалиемия: 15 мл (предел), ≈ 6,8 ммоль, не быстрее 10 мин', () => {
    const r = cacl.formula({ weight: 70, ageYears: 40, indication: 'hyperk' });
    expect(r.result1).toBe(15);
    close(r.result2, 15 * CA);
    expect(r.result2).toBeCloseTo(6.85, 2);
    expect(r.result3).toBe(10);
    expect(r.result5).toMatch(/2,45–15 мл/);
    expect(r.result5).toMatch(/предел разовой дозы 15 мл/);
    expect(r.result5).not.toMatch(/Детям/);
  });

  test('ребёнок 10 кг: 0,3 мл/кг = 3 мл, примечание о суточном максимуме 15 мл', () => {
    const r = cacl.formula({ weight: 10, ageYears: 1, indication: 'hypoca' });
    close(r.result1, 3);
    close(r.result3, 2);
    expect(r.result5).toMatch(/7,5–15 мл/);
    expect(r.result5).toMatch(/не более 15 мл в сутки/);
  });

  test('СЛР: быстрый болюс, без времени введения; новорождённый 3,5 кг', () => {
    const r = cacl.formula({ weight: 3.5, ageYears: 0, indication: 'cpr' });
    close(r.result1, 1.05);
    expect(r.result3).toBeUndefined();
    expect(r.result4).toMatch(/быстро болюсом/);
    expect(r.result4).toMatch(/гидрокарбонат/);
  });

  test('БКК: вне инструкции РФ, повтор по решению специалиста', () => {
    const r = cacl.formula({ weight: 80, ageYears: 50, indication: 'ccb' });
    expect(r.result1).toBe(15);
    expect(r.result5).toMatch(/Вне инструкции РФ/);
  });

  test('граница 50 кг — ровно 15 мл, 49 кг — 14,7 мл', () => {
    expect(cacl.formula({ weight: 50, ageYears: 17 }).result1).toBeCloseTo(15, 6);
    expect(cacl.formula({ weight: 49, ageYears: 17 }).result1).toBeCloseTo(14.7, 6);
  });

  test('движок: на пределе — «= предел»', () => {
    const res = computeResult(
      cacl,
      { weight: '90', indication: 'cpr' },
      { age: { years: '60', months: '' } },
    );
    expect(res.success).toBe(true);
    expect(res.items[0].status).toBe('atmax');
  });
});

describe('Рингер-лактат', () => {
  test('болюс: ребёнок 10 кг — 100 мл; взрослый 70 кг — 500 мл (предел)', () => {
    const c = rl.formula({ weight: 10, ageYears: 2, indication: 'shock-iv' });
    expect(c.result1).toBe(100);
    expect(c.result6).toMatch(/40–60 мл\/кг \(400–600 мл\) за 1-й час.*ERC 2025/);
    expect(c.result6).not.toMatch(/Взрослым при сепсисе/);
    const a = rl.formula({ weight: 70, ageYears: 40, indication: 'shock-iv' });
    expect(a.result1).toBe(500);
    expect(a.result6).toMatch(/Ограничено взрослым болюсом 500 мл/);
    expect(a.result6).not.toMatch(/40–60 мл\/кг/);
  });

  test('болюс в/к — шприцем или под давлением', () => {
    const r = rl.formula({ weight: 20, indication: 'shock-io' });
    expect(r.result1).toBe(200);
    expect(r.result6).toMatch(/В\/к: шприцем/);
  });

  test('суточно, ребёнок < 18 лет: 20–30 мл/кг, не более 2,5 л', () => {
    const r = rl.formula({ weight: 20, ageYears: 5, indication: 'daily' });
    expect(r.result2).toBe(400);
    expect(r.result3).toBe(600);
    expect(r.result4).toBeUndefined();
    expect(r.result6).toMatch(/< 18 лет/);
    const big = rl.formula({ weight: 90, ageYears: 17, indication: 'daily' });
    expect(big.result3).toBe(2500);
    expect(big.result6).toMatch(/Ограничено 2,5 л/);
    // Новорождённый: детская ветка, взрослые 1–2,5 л не показываются
    const nb = rl.formula({ weight: 3.5, ageYears: 0, indication: 'daily' });
    close(nb.result2, 70);
    close(nb.result3, 105);
    expect(nb.result5).toBeUndefined();
  });

  test('суточно, от 18 лет: 1 л в среднем, 2,5 л максимум', () => {
    const r = rl.formula({ weight: 70, ageYears: 40, indication: 'daily' });
    expect(r.result4).toBe(1000);
    expect(r.result5).toBe(2500);
    expect(r.result1).toBeUndefined();
    expect(r.result2).toBeUndefined();
    expect(rl.formula({ weight: 60, ageYears: 18, indication: 'daily' }).result4).toBe(1000);
  });

  test('ребёнок 10 кг: взрослая суточная доза не выдаётся при любом выборе', () => {
    const r = rl.formula({ weight: 10, ageYears: 1, indication: 'daily' });
    expect(r.result3).toBe(300);
    expect(r.result4).toBeUndefined();
    expect(r.result5).toBeUndefined();
  });

  test('суточно без возраста — расчёт не выполняется; болюсу возраст не нужен', () => {
    expect(rl.formula({ weight: 20, indication: 'daily' })).toEqual({});
    expect(rl.formula({ weight: 20, indication: 'shock-iv' }).result1).toBe(200);
  });

  test('движок: возраст пациента выбирает ветку', () => {
    const c = computeResult(
      rl,
      { weight: '10', indication: 'daily' },
      { age: { years: '2', months: '' } },
    );
    expect(c.success).toBe(true);
    expect(c.items.map((i) => i.key)).toEqual(expect.arrayContaining(['result2', 'result3']));
    expect(c.items.some((i) => i.key === 'result5')).toBe(false);
  });

  test('без выбора — болюс в/в по умолчанию', () => {
    expect(rl.formula({ weight: 30 }).result1).toBe(300);
  });
});

describe('Стерофундин изотонический', () => {
  test('болюс: 10 мл/кг, не более 500 мл', () => {
    expect(stf.formula({ weight: 10, ageYears: 1, indication: 'shock-iv' }).result1).toBe(100);
    expect(stf.formula({ weight: 70, ageYears: 40, indication: 'shock-io' }).result1).toBe(500);
  });

  test('суточно, дети до 11 лет: 20–100 мл/кг и скорость по возрасту', () => {
    const infant = stf.formula({ weight: 8, ageYears: 0.5, indication: 'daily' });
    expect(infant.result2).toBe(160);
    expect(infant.result3).toBe(800);
    expect(infant.result4).toBe(48); // 6 мл/кг/ч
    expect(infant.result5).toBe(64); // 8 мл/кг/ч
    const toddler = stf.formula({ weight: 11, ageYears: 1, indication: 'daily' });
    expect(toddler.result4).toBe(44);
    expect(toddler.result5).toBe(66);
    const child = stf.formula({ weight: 20, ageYears: 5, indication: 'daily' });
    expect(child.result4).toBe(40);
    expect(child.result5).toBe(80);
    expect(child.result6).toMatch(/2–11 лет/);
    // 2–4 мл/кг/ч × 24 ч = 48–96 мл/кг ≤ 100 мл/кг — без примечания о времени
    expect(child.result6).not.toMatch(/набирается за/);
  });

  test('скорость ограничена по времени: суточный максимум набирается раньше 24 ч', () => {
    // Новорождённый 3,5 кг: 70–350 мл/сут, 21–28 мл/ч → 350 мл за 12,5–16,7 ч
    const nb = stf.formula({ weight: 3.5, ageYears: 0, indication: 'daily' });
    expect(nb.result3).toBe(350);
    close(nb.result4, 21);
    close(nb.result5, 28);
    expect(nb.result6).toMatch(
      /При 21–28 мл\/ч суточный максимум 350 мл набирается за 12,5–16,7 ч/,
    );
    expect(nb.result6).toMatch(/снизить скорость или прекратить/);
    // 1–2 года, 11 кг: только 6 мл/кг/ч (66 мл/ч) превышает 100 мл/кг за сутки
    const t = stf.formula({ weight: 11, ageYears: 1, indication: 'daily' });
    expect(t.result6).toMatch(/При 66 мл\/ч суточный максимум 1100 мл набирается за 16,7 ч/);
    // 40 кг, 10 лет: максимум 3 л, 160 мл/ч → 18,8 ч
    const big = stf.formula({ weight: 40, ageYears: 10, indication: 'daily' });
    expect(big.result6).toMatch(/При 160 мл\/ч суточный максимум 3000 мл набирается за 18,8 ч/);
  });

  test('ребёнок до 11 лет с большой массой: верх ограничен 3 л', () => {
    const r = stf.formula({ weight: 40, ageYears: 10, indication: 'daily' });
    expect(r.result3).toBe(3000);
    expect(r.result6).toMatch(/Ограничено взрослым максимумом 3 л/);
  });

  test('от 11 лет и взрослые: 500 мл–3 л/сут, без детской скорости', () => {
    const r = stf.formula({ weight: 70, ageYears: 40, indication: 'daily' });
    expect(r.result2).toBe(500);
    expect(r.result3).toBe(3000);
    expect(r.result4).toBeUndefined();
    expect(stf.formula({ weight: 35, ageYears: 11, indication: 'daily' }).result2).toBe(500);
  });

  test('суточно без возраста — расчёт не выполняется', () => {
    expect(stf.formula({ weight: 20, indication: 'daily' })).toEqual({});
  });
});

describe('Панангин', () => {
  test('взрослый: 10–20 мл, на пределе 2 ампулы', () => {
    const r = pan.formula({ ageYears: 40 });
    expect(r.result1).toBe(10);
    expect(r.result2).toBe(20);
    close(r.result3, 5.28);
    expect(r.result4).toMatch(/20 кап\/мин/);
    const res = computeResult(pan, {}, { age: { years: '40', months: '' } });
    expect(res.success).toBe(true);
    expect(res.items.find((i) => i.key === 'result2').status).toBe('atmax');
  });

  test('до 18 лет — противопоказан, только примечание', () => {
    const r = pan.formula({ ageYears: 17 });
    expect(Object.keys(r)).toEqual(['result5']);
    expect(r.result5).toMatch(/противопоказан/);
    expect(pan.formula({ ageYears: 0 }).result5).toMatch(/противопоказан/);
    expect(pan.formula({ ageYears: 18 }).result2).toBe(20);
  });
});

describe('типичный взрослый 70 кг / 40 лет: ни одно значение не выше предела', () => {
  test.each(group.map((f) => [f.name, f]))('%s', (_n, f) => {
    const res = computeResult(f, { weight: '70' }, { age: { years: '40', months: '' } });
    expect(res.error).toBeUndefined();
    expect(res.success).toBe(true);
    res.items.filter((i) => i.unit).forEach((i) => expect(i.status).not.toBe('high'));
  });
});
