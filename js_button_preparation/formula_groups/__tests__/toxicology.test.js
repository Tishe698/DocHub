import group, { buccalMidazolamMg } from '../toxicology';
import { isChoiceInput, ROUTES } from '../../routes';
import { computeResult } from '../../engine';

const byName = (name) => {
  const f = group.find((g) => g.name === name);
  if (!f) throw new Error(`нет записи ${name}`);
  return f;
};
const close = (v, expected) => expect(v).toBeCloseTo(expected, 6);

describe('группа токсикологии: структура', () => {
  it('содержит все записи в прежнем порядке', () => {
    expect(group.map((g) => g.name)).toEqual([
      'Активированный уголь',
      'Ацетилцистеин',
      'Диазепам',
      'Мидазолам',
      'Флумазенил',
    ]);
  });

  it.each(group.map((g) => [g.name, g]))('%s: поля контракта и пустой ввод', (_, f) => {
    expect(typeof f.description).toBe('string');
    expect(f.description.length).toBeGreaterThan(0);
    expect(typeof f.formula).toBe('function');
    expect(Array.isArray(f.warnings)).toBe(true);
    expect(f.inputs.weight).toBe('Вес (кг)');
    if (f.inputs.ageYears) expect(f.inputs.ageYears).toBe('Возраст (лет)');
    // Пустой ввод — {} (движок по нему определяет справочные записи)
    expect(f.formula({})).toEqual({});
    expect(f.formula({ weight: 0, ageYears: 5 })).toEqual({});
    // Подписи есть у каждого числового результата
    Object.keys(f.units).forEach((k) => expect(f.labels[k]).toBeTruthy());
  });

  it('поля-выборы корректны: коды путей из routes.js, по умолчанию — из вариантов', () => {
    group.forEach((f) => {
      Object.values(f.inputs)
        .filter(isChoiceInput)
        .forEach((c) => {
          expect(c.choices.some((x) => x.value === c.default)).toBe(true);
        });
    });
    const mid = byName('Мидазолам').inputs.route;
    expect(mid.choices.map((c) => c.value)).toEqual(['im', 'iv', 'buccal', 'in']);
    mid.choices.forEach((c) => expect(c.label).toBe(ROUTES[c.value]));
    expect(mid.default).toBe('im');
    const flu = byName('Флумазенил').inputs.indication;
    expect(flu.choices.map((c) => c.value)).toEqual(['overdose', 'anesthesia']);
    expect(flu.default).toBe('overdose');
  });

  it('у препаратов с одним путём путь указан в подписи результата', () => {
    expect(byName('Активированный уголь').labels.result1).toMatch(/внутрь/);
    expect(byName('Ацетилцистеин').labels.result1).toMatch(/в\/в/);
    expect(byName('Диазепам').labels.result1).toMatch(/в\/в/);
    expect(byName('Флумазенил').labels.result1).toMatch(/в\/в/);
  });
});

describe('Активированный уголь', () => {
  const f = byName('Активированный уголь');

  it('ребёнок 5 лет 20 кг: 0.2 г/кг = 4 г = 16 таб', () => {
    const r = f.formula({ weight: 20, ageYears: 5 });
    close(r.result1, 4);
    close(r.result2, 16);
    expect(r.result3).toMatch(/0\.2 г\/кг/);
    expect(r.result4).toMatch(/10–20 г/);
  });

  it('взрослый: 30 г = 120 таб, на пределе', () => {
    const r = f.formula({ weight: 70, ageYears: 30 });
    expect(r.result1).toBe(30);
    expect(r.result2).toBe(120);
    expect(f.limits.result1.max).toBe(30);
    expect(r.result4).toMatch(/25–100 г/);
  });

  it('до 3 лет таблетки не считаются (только порошок)', () => {
    const r = f.formula({ weight: 12, ageYears: 2 });
    close(r.result1, 2.4);
    expect(r.result2).toBeUndefined();
    expect(f.formula({ weight: 14, ageYears: 3 }).result2).toBeCloseTo(11.2, 6);
  });

  it('новорождённый (возраст 0) считается', () => {
    const r = f.formula({ weight: 3.5, ageYears: 0 });
    close(r.result1, 0.7);
    expect(r.result2).toBeUndefined();
  });

  it('подросток с большой массой ограничен 30 г', () => {
    const r = f.formula({ weight: 160, ageYears: 16 });
    expect(r.result1).toBe(30);
    expect(r.result3).toMatch(/ограничено взрослой дозой 30 г/);
  });

  it('отрицательный возраст — расчёт не выполняется', () => {
    expect(f.formula({ weight: 20, ageYears: -1 })).toEqual({});
  });
});

describe('Ацетилцистеин', () => {
  const f = byName('Ацетилцистеин');

  it('ребёнок 20 кг: 3000 мг = 30 мл, растворитель по мл/кг', () => {
    const r = f.formula({ weight: 20 });
    expect(r.result1).toBe(3000);
    expect(r.result2).toBe(30);
    expect(r.result3).toMatch(/Ампул по 3 мл: 10/);
    expect(r.result3).toMatch(/до 60 мл \(3 мл\/кг\)/);
    expect(r.result4).toMatch(/1000 мг \(10 мл\) до 160 мл/);
    expect(r.result4).toMatch(/2000 мг \(20 мл\) до 320 мл/);
  });

  it('граница 40 кг: взрослые объёмы растворителя', () => {
    expect(f.formula({ weight: 39.9 }).result3).toMatch(/мл\/кг/);
    const r = f.formula({ weight: 40 });
    expect(r.result3).toMatch(/200 мл 5% глюкозы/);
    expect(r.result4).toMatch(/в 500 мл/);
    expect(r.result4).toMatch(/в 1000 мл/);
  });

  it('взрослый 70 кг: 10 500 мг = 105 мл', () => {
    const r = f.formula({ weight: 70 });
    expect(r.result1).toBe(10500);
    expect(r.result2).toBe(105);
    expect(r.result3).toMatch(/Ампул по 3 мл: 35/);
  });

  it('масса > 110 кг: расчёт по 110 кг, на пределе 16 500 мг', () => {
    const r = f.formula({ weight: 140 });
    expect(r.result1).toBe(16500);
    expect(r.result2).toBe(165);
    expect(r.result3).toMatch(/110 кг \(потолок\)/);
    expect(f.limits.result1.max).toBe(16500);
    expect(f.limits.result2.max).toBe(165);
  });

  it('новорождённый 3 кг', () => {
    const r = f.formula({ weight: 3 });
    expect(r.result1).toBe(450);
    expect(r.result2).toBe(4.5);
    expect(r.result3).toMatch(/до 9 мл/);
  });
});

describe('Диазепам (в/в)', () => {
  const f = byName('Диазепам');

  it('ребёнок 5 лет 20 кг: 0.2 мг/кг = 4 мг = 0.8 мл (максимум 10 мг)', () => {
    const r = f.formula({ weight: 20, ageYears: 5 });
    close(r.result1, 4);
    close(r.result2, 0.8);
    expect(r.result3).toMatch(/в\/в не быстрее чем за 5 мин/);
    expect(r.result4).toBeUndefined();
  });

  it('до 5 лет максимум 5 мг', () => {
    const r = f.formula({ weight: 30, ageYears: 4 });
    expect(r.result1).toBe(5);
    expect(r.result2).toBe(1);
    expect(r.result3).toMatch(/максимум 5 мг/);
  });

  it('с 5 лет и взрослым максимум 10 мг (= предел 2 мл)', () => {
    const r = f.formula({ weight: 70, ageYears: 30 });
    expect(r.result1).toBe(10);
    expect(r.result2).toBe(2);
    expect(r.result3).toMatch(/максимум 10 мг/);
    expect(f.limits.result1.max).toBe(10);
    expect(f.limits.result2.max).toBe(2);
    // ровно 50 кг — без пометки о максимуме
    expect(f.formula({ weight: 50, ageYears: 12 }).result3).not.toMatch(/максимум/);
  });

  it('новорождённый (0 мес) и старый ввод дробью 0.08 — противопоказан, без дозы', () => {
    [0, 0.08].forEach((a) => {
      const r = f.formula({ weight: 3.5, ageYears: a });
      expect(r.result1).toBeUndefined();
      expect(r.result4).toMatch(/противопоказан/);
    });
  });

  it('1 полный месяц: доза считается, просим подтвердить > 30 дней', () => {
    const r = f.formula({ weight: 4.5, ageYears: 1 / 12 });
    close(r.result1, 0.9);
    expect(r.result4).toMatch(/больше 30 дней/);
    const r2 = f.formula({ weight: 5, ageYears: 2 / 12 });
    close(r2.result1, 1);
    expect(r2.result4).toBeUndefined();
  });

  it('через движок: возраст «0 лет 1 мес» из пациента даёт дозу, «0 мес» — нет', () => {
    const ok = computeResult(f, { weight: '4.5' }, { age: { years: '0', months: '1' } });
    expect(ok.success).toBe(true);
    const neo = computeResult(f, { weight: '3.5' }, { age: { years: '0', months: '0' } });
    expect(neo.success).toBe(true);
    expect(neo.items.map((i) => i.key)).toEqual(['result4']);
  });
});

describe('Мидазолам', () => {
  const f = byName('Мидазолам');

  it('по умолчанию (путь не передан) — в/м', () => {
    const r = f.formula({ weight: 20, ageYears: 5 });
    expect(r).toEqual(f.formula({ weight: 20, ageYears: 5, route: 'im' }));
    expect(f.formula({ weight: 20, ageYears: 5, route: 'xx' })).toEqual(r);
  });

  describe('в/м', () => {
    it('ребёнок 5 лет 20 кг: 0.2 мг/кг = 4 мг = 0.8 мл', () => {
      const r = f.formula({ weight: 20, ageYears: 5, route: 'im' });
      close(r.result1, 4);
      close(r.result2, 0.8);
      expect(r.result3).toMatch(/^В\/м/);
    });
    it('до 5 лет максимум 5 мг', () => {
      const r = f.formula({ weight: 30, ageYears: 4, route: 'im' });
      expect(r.result1).toBe(5);
      expect(r.result3).toMatch(/максимум 5 мг/);
    });
    it('ребёнок ≥ 5 лет: максимум 10 мг', () => {
      const r = f.formula({ weight: 60, ageYears: 14, route: 'im' });
      expect(r.result1).toBe(10);
      expect(r.result2).toBe(2);
    });
    it('взрослый: 10 мг при массе > 40 кг, 5 мг при ≤ 40 кг', () => {
      expect(f.formula({ weight: 70, ageYears: 30, route: 'im' }).result1).toBe(10);
      expect(f.formula({ weight: 40, ageYears: 30, route: 'im' }).result1).toBe(5);
      expect(f.formula({ weight: 41, ageYears: 18, route: 'im' }).result1).toBe(10);
    });
    it('новорождённый 3 кг: 0.6 мг', () => {
      close(f.formula({ weight: 3, ageYears: 0, route: 'im' }).result1, 0.6);
    });
  });

  describe('в/в', () => {
    it('ребёнок 20 кг: 0.1 мг/кг = 2 мг = 0.4 мл', () => {
      const r = f.formula({ weight: 20, ageYears: 5, route: 'iv' });
      close(r.result1, 2);
      close(r.result2, 0.4);
      expect(r.result3).toMatch(/не быстрее 4 мг\/мин/);
      expect(r.result3).not.toMatch(/Развести/);
    });
    it('малый объём (< 0.2 мл): разведение до 1 мг/мл', () => {
      const r = f.formula({ weight: 5, ageYears: 0.5, route: 'iv' });
      close(r.result1, 0.5);
      close(r.result2, 0.1);
      expect(r.result3).toMatch(/1 мг\/мл\) и ввести 0\.5 мл/);
    });
    it('максимумы: до 5 лет 5 мг, взрослые 10 мг', () => {
      expect(f.formula({ weight: 60, ageYears: 4, route: 'iv' }).result1).toBe(5);
      const r = f.formula({ weight: 120, ageYears: 40, route: 'iv' });
      expect(r.result1).toBe(10);
      expect(r.result3).toMatch(/максимум 10 мг/);
    });
    it('взрослый 70 кг: 7 мг', () => {
      close(f.formula({ weight: 70, ageYears: 30, route: 'iv' }).result1, 7);
    });
  });

  describe('защёчно', () => {
    it('возрастные дозы КР 2022 и их границы', () => {
      expect(buccalMidazolamMg(0)).toBeNull();
      expect(buccalMidazolamMg(2 / 12)).toBeNull();
      expect(buccalMidazolamMg(3 / 12)).toBe(2.5);
      expect(buccalMidazolamMg(11 / 12)).toBe(2.5);
      expect(buccalMidazolamMg(1)).toBe(5);
      expect(buccalMidazolamMg(4.9)).toBe(5);
      expect(buccalMidazolamMg(5)).toBe(7.5);
      expect(buccalMidazolamMg(9)).toBe(7.5);
      expect(buccalMidazolamMg(10)).toBe(10);
      expect(buccalMidazolamMg(40)).toBe(10);
    });
    it('ребёнок 5 лет: 7.5 мг = 1.5 мл, доза не зависит от веса', () => {
      const a = f.formula({ weight: 20, ageYears: 5, route: 'buccal' });
      const b = f.formula({ weight: 30, ageYears: 5, route: 'buccal' });
      expect(a.result1).toBe(7.5);
      expect(a.result2).toBe(1.5);
      expect(b.result1).toBe(7.5);
      expect(a.result3).toMatch(/^Защёчно/);
    });
    it('взрослый: 10 мг', () => {
      expect(f.formula({ weight: 70, ageYears: 30, route: 'buccal' }).result1).toBe(10);
    });
    it('младше 3 мес — расчёт не выполняется', () => {
      const r = f.formula({ weight: 4, ageYears: 1 / 12, route: 'buccal' });
      expect(r.result1).toBeUndefined();
      expect(r.result4).toMatch(/младше 3 мес/);
    });
  });

  describe('интраназально (нет в КР РФ)', () => {
    it('ребёнок 20 кг 5 лет: 0.2 мг/кг = 4 мг = 0.8 мл, по 0.4 мл в ноздрю', () => {
      const r = f.formula({ weight: 20, ageYears: 5, route: 'in' });
      close(r.result1, 4);
      close(r.result2, 0.8);
      expect(r.result3).toMatch(/по 0\.4 мл/);
      expect(r.result4).toMatch(/нет в КР РФ/);
    });
    it('до 5 лет максимум 5 мг, взрослым 10 мг', () => {
      expect(f.formula({ weight: 30, ageYears: 4, route: 'in' }).result1).toBe(5);
      const r = f.formula({ weight: 70, ageYears: 30, route: 'in' });
      expect(r.result1).toBe(10);
      expect(r.result3).toMatch(/по 1 мл/);
    });
  });

  it('пределы: 10 мг и 2 мл', () => {
    expect(f.limits).toEqual({ result1: { max: 10 }, result2: { max: 2 } });
  });

  it('через движок: выбранный путь попадает в выбор результата', () => {
    const r = computeResult(f, { weight: '20', route: 'buccal' }, { age: { years: '5', months: '' } });
    expect(r.success).toBe(true);
    expect(r.choices).toEqual([{ key: 'route', label: 'Путь введения', value: 'buccal', valueLabel: 'защёчно' }]);
    expect(r.items.find((i) => i.key === 'result1').value).toBe(7.5);
  });
});

describe('Флумазенил', () => {
  const f = byName('Флумазенил');

  it('взрослый, отравление (по умолчанию): 0.3 мг = 3 мл, суммарно до 2 мг', () => {
    const r = f.formula({ weight: 70, ageYears: 30 });
    expect(r).toEqual(f.formula({ weight: 70, ageYears: 30, indication: 'overdose' }));
    expect(r.result1).toBe(0.3);
    expect(r.result2).toBe(3);
    expect(r.result3).toMatch(/не более 2 мг/);
    expect(r.result3).toMatch(/0\.1–0\.4 мг\/ч/);
  });

  it('взрослый, устранение седации: 0.2 мг = 2 мл, суммарно до 1 мг', () => {
    const r = f.formula({ weight: 70, ageYears: 18, indication: 'anesthesia' });
    expect(r.result1).toBe(0.2);
    expect(r.result2).toBe(2);
    expect(r.result3).toMatch(/не более 1 мг/);
  });

  it('ребёнок 20 кг: 0.01 мг/кг = 0.2 мг (на максимуме) = 2 мл', () => {
    const r = f.formula({ weight: 20, ageYears: 5, indication: 'anesthesia' });
    close(r.result1, 0.2);
    close(r.result2, 2);
    expect(r.result3).toMatch(/суммарно не более 1 мг/);
    expect(r.result4).toBeUndefined();
  });

  it('ребёнок 10 кг, отравление: 0.1 мг, суммарно 0.5 мг, пометка PALS', () => {
    const r = f.formula({ weight: 10, ageYears: 2, indication: 'overdose' });
    close(r.result1, 0.1);
    close(r.result2, 1);
    expect(r.result3).toMatch(/не более 0\.5 мг/);
    expect(r.result4).toMatch(/PALS/);
  });

  it('ребёнок 40 кг: разовая ограничена 0.2 мг', () => {
    const r = f.formula({ weight: 40, ageYears: 12, indication: 'anesthesia' });
    expect(r.result1).toBe(0.2);
    expect(r.result3).toMatch(/максимум 0\.2 мг/);
  });

  it('до 1 года — с осторожностью; очень малая доза — в мкг текстом', () => {
    const r = f.formula({ weight: 4, ageYears: 0.25, indication: 'anesthesia' });
    close(r.result1, 0.04);
    expect(r.result4).toMatch(/До 1 года/);
    const tiny = f.formula({ weight: 0.5, ageYears: 0, indication: 'anesthesia' });
    expect(tiny.result1).toBeUndefined();
    expect(tiny.result3).toMatch(/5 мкг/);
  });

  it('пределы: 0.3 мг и 3 мл', () => {
    expect(f.limits).toEqual({ result1: { max: 0.3 }, result2: { max: 3 } });
  });
});
