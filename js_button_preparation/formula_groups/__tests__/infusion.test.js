import group from '../infusion';
import { isChoiceInput, ROUTES } from '../../routes';
import { computeResult } from '../../engine';

const byName = (start) => {
  const found = group.filter((f) => f.name.startsWith(start));
  if (found.length !== 1)
    throw new Error(`Ожидалась одна запись «${start}», найдено ${found.length}`);
  return found[0];
};

const GEK = byName('ГЭК 6%');
const DEXTRAN = byName('Декстран 40');
const NACL = byName('Физраствор (натрия хлорид 0,9%)');
const GLU10 = byName('Глюкоза 10%');
const GLU40 = byName('Глюкоза 40%');
const WATER = byName('Вода для инъекций');
const ACESOL = byName('Калия хлорид + натрия ацетат');
const RINGER = byName('Калия хлорид + кальция хлорид');

const numericKeys = (out) => Object.keys(out).filter((k) => typeof out[k] === 'number');

describe('группа «Инфузионная терапия»: структура записей', () => {
  it('содержит 8 записей в прежнем порядке', () => {
    expect(group.map((f) => f.name)).toEqual([
      'ГЭК 6% (гидроксиэтилкрахмал 130/0,4–0,42)',
      'Реополиглюкин (декстран 40) 10%',
      'Физраствор (натрия хлорид 0,9%)',
      'Глюкоза 10% — гипогликемия',
      'Глюкоза 40% — гипогликемия у взрослых',
      'Вода для инъекций',
      'Ацесоль (калия хлорид + натрия ацетат + натрия хлорид)',
      'Раствор Рингера (калия хлорид + кальция хлорид + натрия хлорид)',
    ]);
  });

  it.each(group.map((f) => [f.name, f]))('%s: поля контракта на месте', (_name, f) => {
    expect(typeof f.name).toBe('string');
    expect(typeof f.description).toBe('string');
    expect(f.description.length).toBeGreaterThan(5);
    expect(typeof f.formula).toBe('function');
    expect(Array.isArray(f.warnings)).toBe(true);
    expect(f.warnings.length).toBeGreaterThan(0);
    // У каждого числового результата есть единица и подпись
    Object.keys(f.units || {}).forEach((k) => expect(f.labels[k]).toBeTruthy());
    Object.keys(f.limits || {}).forEach((k) => expect(f.units[k]).toBeTruthy());
  });

  it.each(group.map((f) => [f.name, f]))(
    '%s: пустой или нулевой вес — расчёт не выполняется',
    (_name, f) => {
      if (!Object.keys(f.inputs).length) return;
      expect(f.formula({})).toEqual({});
      expect(f.formula({ weight: 0, volume: 0 })).toEqual({});
    },
  );

  it('отдельное поле пути — только у глюкозы 10% (в/в и в/к); у кристаллоидов путь — в варианте показания', () => {
    group.forEach((f) => {
      const route = f.inputs.route;
      if (!route) return;
      expect(isChoiceInput(route)).toBe(true);
      expect(route.default).toBe('iv');
      expect(route.choices.map((c) => c.value)).toEqual(['iv', 'io']);
    });
    expect(GLU10.inputs.route).toBeTruthy();
    [NACL, RINGER, GEK, DEXTRAN, ACESOL, GLU40, WATER].forEach((f) =>
      expect(f.inputs.route).toBeUndefined(),
    );
  });

  it('записи с одним путём называют его в описании или подписи результата', () => {
    [GEK, DEXTRAN, ACESOL].forEach((f) => {
      expect(f.description).toMatch(/в\/в/);
      Object.values(f.labels).forEach((l) => expect(l).toMatch(/в\/в|сут/i));
    });
    expect(GLU40.description).toMatch(/в\/в/);
  });
});

describe('ГЭК 6%', () => {
  it('взрослый 70 кг: суточный предел 30 мл/кг = 2100 мл, путь в/в', () => {
    const out = GEK.formula({ weight: 70, ageYears: 40 });
    expect(out.result1).toBe(2100);
    expect(GEK.labels.result1).toMatch(/в\/в/);
    expect(out.result3).toMatch(/предел за сутки/);
  });

  it('ребёнок 5 лет: противопоказан, числа нет', () => {
    const out = GEK.formula({ weight: 20, ageYears: 5 });
    expect(numericKeys(out)).toEqual([]);
    expect(out.result3).toMatch(/до 18 лет/);
  });

  it('граница 18 лет: 17 — противопоказан, 18 — расчёт', () => {
    expect(GEK.formula({ weight: 60, ageYears: 17 }).result1).toBeUndefined();
    expect(GEK.formula({ weight: 60, ageYears: 18 }).result1).toBe(1800);
  });

  it('возраст не указан (0, новорождённый) — противопоказан', () => {
    expect(GEK.formula({ weight: 3.5, ageYears: 0 }).result1).toBeUndefined();
  });
});

describe('Декстран 40 (Реополиглюкин)', () => {
  it('по умолчанию — шок', () => {
    expect(DEXTRAN.inputs.indication.default).toBe('shock');
    expect(DEXTRAN.inputs.indication.choices.map((c) => c.value)).toEqual(['shock', 'detox']);
  });

  it('шок, ребёнок 20 кг: 200 мл разово, 300 мл/сут, за 30–60 мин', () => {
    const out = DEXTRAN.formula({ weight: 20, indication: 'shock' });
    expect(out.result1).toBe(200);
    expect(out.result2).toBeUndefined();
    expect(out.result3).toBe(300);
    expect(out.result4).toMatch(/30–60 мин/);
    expect(out.result4).toMatch(/200–400 мл\/ч/);
    expect(out.result4).not.toMatch(/Ограничено/);
  });

  it('шок, взрослый 70 кг: 700 мл разово, сутки ограничены 1000 мл', () => {
    const out = DEXTRAN.formula({ weight: 70, indication: 'shock' });
    expect(out.result1).toBe(700);
    expect(out.result3).toBe(1000);
    expect(out.result4).toMatch(/Ограничено пределом взрослых 1000 мл/);
  });

  it('шок, 120 кг: разовая и суточная — на пределе 1000 мл', () => {
    const out = DEXTRAN.formula({ weight: 120 });
    expect(out.result1).toBe(1000);
    expect(out.result3).toBe(1000);
  });

  it('граница массы: 66,6 кг — ещё без ограничения суток, 67 кг — с ограничением', () => {
    expect(DEXTRAN.formula({ weight: 66.6 }).result3).toBeCloseTo(999, 5);
    expect(DEXTRAN.formula({ weight: 67 }).result3).toBe(1000);
  });

  it('дезинтоксикация, 20 кг: до 200 мл за 60–90 мин, от 100 мл', () => {
    const out = DEXTRAN.formula({ weight: 20, indication: 'detox' });
    expect(out.result1).toBeUndefined();
    expect(out.result2).toBe(200);
    expect(out.result3).toBe(300);
    expect(out.result4).toMatch(/60–90 мин/);
    expect(out.result4).toMatch(/от 100 мл/);
  });

  it('дезинтоксикация, 150 кг: на пределе 1000 мл', () => {
    const out = DEXTRAN.formula({ weight: 150, indication: 'detox' });
    expect(out.result2).toBe(1000);
    expect(out.result3).toBe(1000);
    expect(out.result4).toMatch(/от 750 мл/);
  });
});

describe('Натрия хлорид 0,9%', () => {
  it('выбор показания и пути, по умолчанию шок в/в; в/к — только у шока (n22)', () => {
    expect(NACL.inputs.indication.label).toBe('Показание и путь');
    expect(NACL.inputs.indication.choices.map((c) => c.value)).toEqual([
      'shock-iv',
      'shock-io',
      'dka_child',
      'dka_adult',
    ]);
    expect(NACL.inputs.indication.choices.map((c) => c.label)).toEqual([
      `Шок / гиповолемия — ${ROUTES.iv}`,
      `Шок / гиповолемия — ${ROUTES.io}`,
      `ДКА у детей — ${ROUTES.iv}`,
      `ДКА у взрослых — ${ROUTES.iv}`,
    ]);
    expect(NACL.inputs.indication.default).toBe('shock-iv');
  });

  it('шок в/в, ребёнок 20 кг: болюс 200 мл струйно', () => {
    const out = NACL.formula({ weight: 20, indication: 'shock-iv' });
    expect(out.result1).toBe(200);
    expect(out.result5).toMatch(/В\/в струйно/);
    expect(out.result5).not.toMatch(/Ограничено/);
  });

  it('шок в/к, ребёнок 20 кг: тот же объём, текст введения шприцем/под давлением', () => {
    const out = NACL.formula({ weight: 20, indication: 'shock-io' });
    expect(out.result1).toBe(200);
    expect(out.result5).toMatch(/В\/к: шприцем/);
  });

  it('шок, взрослый 70 кг: ограничено 500 мл', () => {
    const out = NACL.formula({ weight: 70, indication: 'shock-iv' });
    expect(out.result1).toBe(500);
    expect(out.result5).toMatch(/Ограничено взрослым болюсом 500 мл \(расчёт 700 мл\)/);
  });

  it('шок, граница 50 кг: ровно 500 мл без пометки об ограничении', () => {
    const out = NACL.formula({ weight: 50 });
    expect(out.result1).toBe(500);
    expect(out.result5).not.toMatch(/Ограничено/);
  });

  it('шок, новорождённый 3,5 кг: 35 мл', () => {
    expect(NACL.formula({ weight: 3.5 }).result1).toBe(35);
  });

  it('ДКА у детей, 20 кг: 200–400 мл за 30–60 мин', () => {
    const out = NACL.formula({ weight: 20, indication: 'dka_child' });
    expect(out.result1).toBeUndefined();
    expect(out.result2).toBe(200);
    expect(out.result3).toBe(400);
    expect(out.result5).toMatch(/30–60 мин/);
  });

  it('ДКА у детей, подросток 60 кг: верхний объём ограничен 1000 мл', () => {
    const out = NACL.formula({ weight: 60, indication: 'dka_child' });
    expect(out.result2).toBe(600);
    expect(out.result3).toBe(1000);
    expect(out.result5).toMatch(/Ограничено взрослым объёмом 1-го часа 1000 мл \(расчёт 1200 мл\)/);
  });

  it('ДКА у детей, 120 кг: оба объёма на пределе 1000 мл', () => {
    const out = NACL.formula({ weight: 120, indication: 'dka_child' });
    expect(out.result2).toBe(1000);
    expect(out.result3).toBe(1000);
  });

  it('ДКА у взрослых: 1000 мл за 1-й час, схема следующих часов', () => {
    const out = NACL.formula({ weight: 70, indication: 'dka_adult' });
    expect(out.result4).toBe(1000);
    expect(out.result5).toMatch(/2-й и 3-й час/);
  });

  it.each(['dka_child', 'dka_adult'])(
    'ДКА (%s): только в/в, лишний route не меняет расчёт',
    (indication) => {
      const out = NACL.formula({ weight: 20, indication, route: 'io' });
      expect(numericKeys(out).length).toBeGreaterThan(0);
      expect(out.result5).not.toMatch(/В\/к/);
    },
  );
});

describe('Глюкоза 10%', () => {
  it('ребёнок 20 кг в/в: 4 г = 40 мл 10%, разведение из 40%', () => {
    const out = GLU10.formula({ weight: 20, route: 'iv' });
    expect(out.result1).toBeCloseTo(4, 10);
    expect(out.result2).toBeCloseTo(40, 10);
    expect(out.result3).toMatch(/В\/в/);
    expect(out.result3).toMatch(/10 мл 40% \+ 30 мл воды для инъекций = 40 мл 10%/);
  });

  it('ребёнок 20 кг в/к: та же доза, текст для в/к', () => {
    const out = GLU10.formula({ weight: 20, route: 'io' });
    expect(out.result1).toBeCloseTo(4, 10);
    expect(out.result3).toMatch(/В\/к шприцем/);
  });

  it('новорождённый 3 кг: 0,6 г = 6 мл', () => {
    const out = GLU10.formula({ weight: 3 });
    expect(out.result1).toBeCloseTo(0.6, 10);
    expect(out.result2).toBeCloseTo(6, 10);
  });

  it('граница 100 кг: ровно 20 г без пометки, 101 кг — ограничено', () => {
    const at = GLU10.formula({ weight: 100 });
    expect(at.result1).toBeCloseTo(20, 10);
    expect(at.result3).not.toMatch(/Ограничено/);
    const over = GLU10.formula({ weight: 101 });
    expect(over.result1).toBe(20);
    expect(over.result2).toBe(200);
    expect(over.result3).toMatch(/Ограничено разовой дозой 20 г/);
  });

  it('взрослый 70 кг: 14 г = 140 мл, в пределе', () => {
    const out = GLU10.formula({ weight: 70 });
    expect(out.result1).toBeCloseTo(14, 10);
    expect(out.result2).toBeCloseTo(140, 10);
  });
});

describe('Глюкоза 40% — справочная запись', () => {
  it('без полей и расчёта, указания в warnings', () => {
    expect(GLU40.inputs).toEqual({});
    expect(GLU40.formula()).toEqual({});
    expect(GLU40.warnings.join(' ')).toMatch(/1,5 мл\/мин/);
    expect(GLU40.warnings.join(' ')).toMatch(/250 мл\/сут/);
  });

  it('движок показывает справку, а не ошибку', () => {
    const r = computeResult(GLU40, {});
    expect(r.info).toBe(true);
    expect(r.warnings.length).toBe(3);
  });
});

describe('Вода для инъекций', () => {
  it('12 мл: 6 ампул по 2, 3 по 5, 2 по 10', () => {
    expect(WATER.formula({ volume: 12 })).toEqual({ result1: 6, result2: 3, result3: 2 });
  });

  it('ровно 10 мл: 5 / 2 / 1 — без лишней ампулы из-за погрешности', () => {
    expect(WATER.formula({ volume: 10 })).toEqual({ result1: 5, result2: 2, result3: 1 });
  });

  it('малый объём 0,5 мл — по одной ампуле', () => {
    expect(WATER.formula({ volume: 0.5 })).toEqual({ result1: 1, result2: 1, result3: 1 });
  });
});

describe('Ацесоль', () => {
  it('взрослый 70 кг: 4900–7000 мл за 1-й час в/в', () => {
    const out = ACESOL.formula({ weight: 70, ageYears: 30 });
    expect(out.result1).toBeCloseTo(4900, 6);
    expect(out.result2).toBeCloseTo(7000, 6);
    expect(out.result3).toMatch(/В\/в/);
  });

  it('ребёнок и граница 17/18 лет', () => {
    expect(numericKeys(ACESOL.formula({ weight: 20, ageYears: 5 }))).toEqual([]);
    expect(ACESOL.formula({ weight: 60, ageYears: 17 }).result3).toMatch(/Детских доз/);
    expect(ACESOL.formula({ weight: 60, ageYears: 18 }).result1).toBeCloseTo(4200, 6);
  });
});

describe('Раствор Рингера', () => {
  it('выбор показания и пути; в/к — только у шока (n22)', () => {
    expect(RINGER.inputs.indication.choices.map((c) => c.value)).toEqual([
      'shock-iv',
      'shock-io',
      'daily_child',
      'daily_adult',
    ]);
    expect(
      RINGER.inputs.indication.choices
        .filter((c) => c.label.includes(ROUTES.io))
        .map((c) => c.value),
    ).toEqual(['shock-io']);
    expect(RINGER.inputs.indication.default).toBe('shock-iv');
  });

  it('шок в/в, 20 кг: болюс 200 мл и детский ориентир 400–600 мл', () => {
    const out = RINGER.formula({ weight: 20, indication: 'shock-iv' });
    expect(out.result1).toBe(200);
    expect(out.result6).toMatch(/В\/в струйно/);
    expect(out.result6).toMatch(/400–600 мл/);
  });

  it('шок в/к, 20 кг: тот же объём, текст для в/к', () => {
    const out = RINGER.formula({ weight: 20, indication: 'shock-io' });
    expect(out.result1).toBe(200);
    expect(out.result6).toMatch(/В\/к: шприцем/);
  });

  it('шок, 70 кг: ограничено 500 мл, детский ориентир без мл', () => {
    const out = RINGER.formula({ weight: 70 });
    expect(out.result1).toBe(500);
    expect(out.result6).toMatch(/Ограничено взрослым болюсом 500 мл/);
    expect(out.result6).not.toMatch(/1400/);
  });

  it('суточно детям, 20 кг: 100–200 мл, 30–60 кап/мин', () => {
    const out = RINGER.formula({ weight: 20, indication: 'daily_child' });
    expect(out.result2).toBe(100);
    expect(out.result3).toBe(200);
    expect(out.result4).toBeUndefined();
    expect(out.result6).toMatch(/30–60 кап\/мин/);
  });

  it('суточно взрослым, 50 кг: 250 / 1000 / 2500 мл без ограничения', () => {
    const out = RINGER.formula({ weight: 50, indication: 'daily_adult' });
    expect(out.result2).toBe(250);
    expect(out.result4).toBe(1000);
    expect(out.result5).toBe(2500);
    expect(out.result6).not.toMatch(/ограничен 3 л/);
  });

  it('суточно взрослым, 70 кг: максимум ограничен 3 л/сут', () => {
    const out = RINGER.formula({ weight: 70, indication: 'daily_adult' });
    expect(out.result4).toBe(1400);
    expect(out.result5).toBe(3000);
    expect(out.result6).toMatch(/ограничен 3 л\/сут \(расчёт 50 мл\/кг — 3500 мл\)/);
  });

  it('граница 60 кг: ровно 3000 мл', () => {
    expect(RINGER.formula({ weight: 60, indication: 'daily_adult' }).result5).toBe(3000);
  });

  it('прежнее значение «shock» без пути — шок в/в', () => {
    expect(RINGER.formula({ weight: 20, indication: 'shock' }).result6).toMatch(/В\/в струйно/);
    expect(NACL.formula({ weight: 20, indication: 'shock' }).result5).toMatch(/В\/в струйно/);
  });
});

describe('через движок: выбор показан, пределы срабатывают', () => {
  it('NaCl: путь и показание попадают в результат, болюс 500 мл — на пределе', () => {
    const r = computeResult(NACL, { weight: '70', indication: 'shock-io' });
    expect(r.success).toBe(true);
    expect(r.choices.map((c) => `${c.label}: ${c.valueLabel}`)).toEqual([
      'Показание и путь: Шок / гиповолемия — в/к (внутрикостно)',
    ]);
    const bolus = r.items.find((i) => i.key === 'result1');
    expect(bolus.status).toBe('atmax');
  });

  it('NaCl: пустые поля выбора берут значения по умолчанию', () => {
    const r = computeResult(NACL, { weight: '20' });
    expect(r.success).toBe(true);
    expect(r.items.find((i) => i.key === 'result1').value).toBe(200);
  });

  it('Реополиглюкин: 120 кг — разовая и суточная на пределе', () => {
    const r = computeResult(DEXTRAN, { weight: '120' });
    expect(r.items.find((i) => i.key === 'result1').status).toBe('atmax');
    expect(r.items.find((i) => i.key === 'result3').status).toBe('atmax');
  });

  it('Рингер: суточная инфузия взрослым — объёмы считаются, путь в/в в подписи выбора', () => {
    const r = computeResult(RINGER, { weight: '20', indication: 'daily_adult' });
    expect(r.success).toBe(true);
    expect(r.choices.map((c) => c.valueLabel)).toEqual(['Дегидратация: суточно, взрослые — в/в']);
    expect(r.items.find((i) => i.key === 'result2').value).toBe(100);
  });

  it('Глюкоза 10%: 120 кг — доза на пределе 20 г', () => {
    const r = computeResult(GLU10, { weight: '120', route: 'iv' });
    expect(r.items.find((i) => i.key === 'result1').status).toBe('atmax');
    expect(r.items.find((i) => i.key === 'result2').status).toBe('atmax');
  });
});
