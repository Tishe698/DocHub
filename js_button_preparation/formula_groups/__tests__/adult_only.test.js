import group from '../adult_only';
import { isChoiceInput, ROUTES } from '../../routes';
import { computeResult, isReferenceOnly, buildCopyText } from '../../engine';

const byName = (name) => {
  const f = group.find((g) => g.name === name);
  if (!f) throw new Error(`нет записи ${name}`);
  return f;
};
const close = (v, expected) => expect(v).toBeCloseTo(expected, 6);
const numericKeys = (r) => Object.keys(r).filter((k) => typeof r[k] === 'number');
const limitsOf = (f, clean) => (typeof f.limits === 'function' ? f.limits(clean) : f.limits) || {};

// Варианты всех полей-выборов записи: [{ route: 'iv' }, { route: 'im' }, …] (декартово произведение)
const choiceCombos = (f) => {
  const fields = Object.entries(f.inputs).filter(([, v]) => isChoiceInput(v));
  return fields.reduce(
    (acc, [key, input]) => acc.flatMap((combo) => input.choices.map((c) => ({ ...combo, [key]: c.value }))),
    [{}]
  );
};

const ADULT = { weight: 70, ageYears: 40 };
const CHILD = { weight: 20, ageYears: 5 };

// Записи с расчётом только для взрослых (возраст в полях)
const ADULT_CALC = [
  'Эналаприлат',
  'Нитроглицерин',
  'Нифедипин',
  'Пропранолол',
  'Каптоприл',
  'Моксонидин',
  'Клонидин',
  'Урапидил',
  'Эноксапарин натрия',
  'Терлипрессин',
  'Эсмолол',
  'Метопролол',
  'Клопидогрел',
  'Изосорбида динитрат (раствор/спрей)',
  'Инозин + никотинамид + рибофлавин + янтарная кислота',
  'Натрия тиосульфат 300 мг/мл - 10 мл',
  'Этилметилгидроксипиридина сукцинат',
];
const REFERENCE = ['Хлоргексидин 0.05% - 100 мл', 'Сульфацетамид 20% (капли глазные)'];

describe('группа «взрослые / без педиатрических данных»: структура', () => {
  it('содержит все записи в прежнем порядке', () => {
    expect(group.map((g) => g.name)).toEqual([
      'Эналаприлат',
      'Нитроглицерин',
      'Нифедипин',
      'Пропранолол',
      'Каптоприл',
      'Моксонидин',
      'Клонидин',
      'Урапидил',
      'Эноксапарин натрия',
      'Терлипрессин',
      'Эсмолол',
      'Метопролол',
      'Клопидогрел',
      'Окситоцин',
      'Изосорбида динитрат (раствор/спрей)',
      'Инозин + никотинамид + рибофлавин + янтарная кислота',
      'Хлоргексидин 0.05% - 100 мл',
      'Сульфацетамид 20% (капли глазные)',
      'Натрия тиосульфат 300 мг/мл - 10 мл',
      'Натрия гидрокарбонат 5%',
      'Этилметилгидроксипиридина сукцинат',
    ]);
  });

  it.each(group.map((g) => [g.name, g]))('%s: поля контракта, пустой ввод → {}', (_, f) => {
    expect(typeof f.description).toBe('string');
    expect(f.description.length).toBeGreaterThan(0);
    expect(typeof f.formula).toBe('function');
    expect(Array.isArray(f.warnings)).toBe(true);
    expect(f.warnings.length).toBeGreaterThan(0);
    if (f.inputs.weight) expect(f.inputs.weight).toBe('Вес (кг)');
    if (f.inputs.ageYears) expect(f.inputs.ageYears).toBe('Возраст (лет)');
    expect(f.formula({})).toEqual({});
  });

  it.each(group.map((g) => [g.name, g]))(
    '%s: у каждого результата каждого варианта есть подпись, у числа — единица',
    (_, f) => {
      choiceCombos(f).forEach((combo) => {
        const r = f.formula({ ...ADULT, ...combo });
        Object.keys(r).forEach((k) => {
          expect(k).toMatch(/^result\d+$/);
          expect(f.labels[k]).toBeTruthy();
          if (typeof r[k] === 'number') {
            expect(f.units[k]).toBeTruthy();
            expect(Number.isFinite(r[k])).toBe(true);
            expect(r[k]).toBeGreaterThan(0);
          } else {
            expect(typeof r[k]).toBe('string');
            expect(r[k].trim().length).toBeGreaterThan(0);
          }
        });
        if (!REFERENCE.includes(f.name)) expect(numericKeys(r).length).toBeGreaterThan(0);
      });
    }
  );

  it('поля-выборы: коды путей из routes.js, значение по умолчанию — из вариантов', () => {
    group.forEach((f) => {
      Object.values(f.inputs)
        .filter(isChoiceInput)
        .forEach((c) => {
          expect(c.choices.some((x) => x.value === c.default)).toBe(true);
        });
    });
    const routes = (name) => byName(name).inputs.route;
    expect(routes('Нитроглицерин').choices.map((c) => c.value)).toEqual(['sl', 'iv']);
    expect(routes('Нитроглицерин').default).toBe('sl');
    expect(routes('Изосорбида динитрат (раствор/спрей)').choices.map((c) => c.value)).toEqual(['buccal', 'iv']);
    expect(routes('Этилметилгидроксипиридина сукцинат').choices.map((c) => c.value)).toEqual(['iv', 'im']);
    ['Нитроглицерин', 'Изосорбида динитрат (раствор/спрей)', 'Этилметилгидроксипиридина сукцинат'].forEach((n) =>
      routes(n).choices.forEach((c) => expect(c.label).toBe(ROUTES[c.value]))
    );
  });

  it('у препаратов с одним путём путь указан в подписи первого результата', () => {
    const one = {
      Эналаприлат: /в\/в/,
      Нифедипин: /внутрь/,
      Пропранолол: /внутрь/,
      Каптоприл: /внутрь/,
      Моксонидин: /внутрь/,
      Клонидин: /в\/в/,
      Урапидил: /в\/в/,
      Терлипрессин: /в\/в/,
      Эсмолол: /в\/в/,
      Метопролол: /в\/в/,
      Клопидогрел: /внутрь/,
      'Инозин + никотинамид + рибофлавин + янтарная кислота': /в\/в/,
      'Натрия тиосульфат 300 мг/мл - 10 мл': /в\/в/,
      'Натрия гидрокарбонат 5%': /в\/в/,
    };
    Object.entries(one).forEach(([name, re]) => expect(byName(name).labels.result1).toMatch(re));
  });

  it('у многопутевых записей подпись каждой числовой строки называет путь', () => {
    const re = /в\/в|в\/м|п\/к|под язык|слизистую рта/i;
    ['Нитроглицерин', 'Изосорбида динитрат (раствор/спрей)', 'Этилметилгидроксипиридина сукцинат', 'Окситоцин', 'Эноксапарин натрия'].forEach(
      (name) => {
        const f = byName(name);
        choiceCombos(f).forEach((combo) => {
          const r = f.formula({ ...ADULT, ...combo });
          numericKeys(r).forEach((k) => expect(f.labels[k]).toMatch(re));
        });
      }
    );
  });

  it.each(ADULT_CALC.map((n) => [n]))('%s: детям (5 лет, 17 лет, новорождённый) расчёт не выполняется', (name) => {
    const f = byName(name);
    choiceCombos(f).forEach((combo) => {
      expect(f.formula({ ...CHILD, ...combo })).toEqual({});
      expect(f.formula({ weight: 60, ageYears: 17, ...combo })).toEqual({});
      expect(f.formula({ weight: 3.5, ageYears: 0, ...combo })).toEqual({});
      // Граница: 18 лет — уже взрослый
      expect(Object.keys(f.formula({ weight: 60, ageYears: 18, ...combo })).length).toBeGreaterThan(0);
    });
  });

  it.each(REFERENCE.map((n) => [n]))('%s: справочная запись без полей', (name) => {
    const f = byName(name);
    expect(isReferenceOnly(f)).toBe(true);
    const r = computeResult(f, {});
    expect(r.info).toBe(true);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('записи с расчётом — не справочные', () => {
    [...ADULT_CALC, 'Окситоцин', 'Натрия гидрокарбонат 5%'].forEach((n) => expect(isReferenceOnly(byName(n))).toBe(false));
  });
});

describe('Эналаприлат', () => {
  const f = byName('Эналаприлат');
  it('обычная доза: 1,25 мг = 1 мл', () => {
    const r = f.formula({ ageYears: 40, regimen: 'standard' });
    close(r.result1, 1.25);
    close(r.result2, 1);
    expect(r.result3).toMatch(/каждые 6 ч/);
  });
  it('на диуретиках / КК < 30: 0,625 мг = 0,5 мл', () => {
    const r = f.formula({ ageYears: 80, regimen: 'reduced' });
    close(r.result1, 0.625);
    close(r.result2, 0.5);
  });
  it('неизвестный режим → {}', () => expect(f.formula({ ageYears: 40, regimen: 'x' })).toEqual({}));
});

describe('Нитроглицерин', () => {
  const f = byName('Нитроглицерин');
  it('под язык: 1 доза 0,4 мг, максимум 1,2 мг за 15 мин', () => {
    const r = f.formula({ ageYears: 60, route: 'sl' });
    close(r.result1, 0.4);
    close(r.result2, 1.2);
    expect(r.result3).toMatch(/3 доз/);
    expect(r.result4).toBeUndefined();
  });
  it('в/в: 10 мкг/мин = 0,6 мл/ч неразведённого, 6 мл/ч разведённого 0,1 мг/мл; предел 166 мкг/мин', () => {
    const r = f.formula({ ageYears: 60, route: 'iv' });
    expect(r.result1).toBeUndefined();
    expect(r.result4).toBe(10);
    close(r.result5, 0.6);
    close(r.result6, 6);
    expect(r.result7).toMatch(/не ниже 100/);
    expect(r.result8).toMatch(/166 мкг\/мин/);
  });
  it('подписи в/в и под язык различаются', () => {
    expect(f.labels.result1).toMatch(/под язык/);
    expect(f.labels.result4).toMatch(/в\/в/);
  });
  it('неизвестный путь → {}', () => expect(f.formula({ ageYears: 60, route: 'im' })).toEqual({}));
});

describe('Пероральные антигипертензивные', () => {
  it('нифедипин: 10 мг = 1 таб, максимум 40 мг/сут', () => {
    const r = byName('Нифедипин').formula({ ageYears: 50 });
    expect(r.result1).toBe(10);
    expect(r.result2).toBe(1);
    expect(r.result3).toMatch(/40 мг\/сут/);
  });
  it('пропранолол: АГ 40 мг = 4 таб (макс. 320), аритмии 20 мг = 2 таб (макс. 240)', () => {
    const f = byName('Пропранолол');
    const ag = f.formula({ ageYears: 50, indication: 'hypertension' });
    expect(ag.result1).toBe(40);
    expect(ag.result2).toBe(4);
    expect(ag.result3).toMatch(/320 мг\/сут/);
    const ar = f.formula({ ageYears: 50, indication: 'arrhythmia' });
    expect(ar.result1).toBe(20);
    expect(ar.result2).toBe(2);
    expect(ar.result3).toMatch(/240 мг\/сут/);
    expect(f.formula({ ageYears: 50, indication: 'x' })).toEqual({});
  });
  it('каптоприл: АГ 25 мг = 1 таб, ХСН 6,25 мг = 1/4 таб; максимум 150 мг/сут', () => {
    const f = byName('Каптоприл');
    const ag = f.formula({ ageYears: 50, indication: 'hypertension' });
    expect(ag.result1).toBe(25);
    expect(ag.result2).toBe(1);
    const hf = f.formula({ ageYears: 70, indication: 'heartFailure' });
    close(hf.result1, 6.25);
    close(hf.result2, 0.25);
    expect(hf.result3).toMatch(/150 мг\/сут/);
  });
  it('моксонидин: начальная 0,2 мг, максимальная разовая 0,4 мг', () => {
    const r = byName('Моксонидин').formula({ ageYears: 50 });
    close(r.result1, 0.2);
    close(r.result2, 0.4);
    expect(r.result3).toMatch(/0,6 мг\/сут/);
  });
  it('моксонидин: описание называет таблетку 0,2 мг для начальной дозы (n29)', () => {
    const f = byName('Моксонидин');
    expect(f.description).toMatch(/0\.2 мг/);
    expect(f.description).toMatch(/0\.4 мг/);
    expect(f.labels.result1).toMatch(/1 таб 0,2 мг/);
  });
});

describe('Клонидин и урапидил', () => {
  it('клонидин: 0,05–0,15 мг = 0,5–1,5 мл в/в', () => {
    const r = byName('Клонидин').formula({ ageYears: 50 });
    close(r.result1, 0.05);
    close(r.result2, 0.5);
    close(r.result3, 0.15);
    close(r.result4, 1.5);
    expect(r.result5).toMatch(/медленно/);
  });
  it('урапидил: начальная 10 мг = 2 мл, инфузия 9 мг/ч = 4,5 мл/ч раствора 2 мг/мл', () => {
    const r = byName('Урапидил').formula({ ageYears: 50 });
    expect(r.result1).toBe(10);
    close(r.result2, 2);
    expect(r.result3).toMatch(/10–50 мг/);
    close(r.result4, 4.5);
    expect(r.result5).toMatch(/4 мг\/мл/);
  });
});

describe('Эноксапарин натрия', () => {
  const f = byName('Эноксапарин натрия');
  const status = (r, clean, key) => {
    const lim = limitsOf(f, clean)[key];
    return lim && r[key] >= lim.max - 1e-9 ? 'atmax' : 'ok';
  };

  it('ИМпST + ТЛТ, 60 лет, 70 кг: болюс 30 мг (0,3 мл) + п/к 70 мг (0,7 мл)', () => {
    const clean = { weight: 70, ageYears: 60, indication: 'stemiLysis' };
    const r = f.formula(clean);
    expect(r.result1).toBe(30);
    close(r.result2, 0.3);
    close(r.result3, 70);
    close(r.result4, 0.7);
    expect(r.result6).toBeUndefined();
    expect(status(r, clean, 'result3')).toBe('ok');
  });

  it('ИМпST + ТЛТ, 60 лет, 120 кг: п/к ограничена 100 мг (1 мл), предел', () => {
    const clean = { weight: 120, ageYears: 60, indication: 'stemiLysis' };
    const r = f.formula(clean);
    expect(r.result3).toBe(100);
    close(r.result4, 1);
    expect(r.result6).toMatch(/не более 100 мг/);
    expect(limitsOf(f, clean).result3.max).toBe(100);
    expect(status(r, clean, 'result3')).toBe('atmax');
  });

  it('ИМпST + ТЛТ, граница 74 / 75 лет: с 75 лет без болюса, 0,75 мг/кг', () => {
    const r74 = f.formula({ weight: 80, ageYears: 74, indication: 'stemiLysis' });
    expect(r74.result1).toBe(30);
    close(r74.result3, 80);
    const r75 = f.formula({ weight: 80, ageYears: 75, indication: 'stemiLysis' });
    expect(r75.result1).toBeUndefined();
    expect(r75.result2).toBeUndefined();
    close(r75.result3, 60);
    expect(r75.result5).toMatch(/болюс не вводится/);
  });

  it('ИМпST + ТЛТ, 80 лет, 110 кг: 0,75 мг/кг = 82,5 → предел 75 мг', () => {
    const clean = { weight: 110, ageYears: 80, indication: 'stemiLysis' };
    const r = f.formula(clean);
    expect(r.result3).toBe(75);
    close(r.result4, 0.75);
    expect(r.result6).toMatch(/не более 75 мг/);
    expect(limitsOf(f, clean).result3.max).toBe(75);
  });

  it('ОКС без подъёма ST и ТГВ/ТЭЛА: 1 мг/кг п/к, без верхнего предела', () => {
    const nste = f.formula({ weight: 90, ageYears: 50, indication: 'nste' });
    close(nste.result3, 90);
    close(nste.result4, 0.9);
    expect(nste.result1).toBeUndefined();
    expect(nste.result5).toMatch(/каждые 12 ч/);
    const vte = f.formula({ weight: 130, ageYears: 50, indication: 'vte' });
    close(vte.result3, 130);
    expect(limitsOf(f, { indication: 'vte' })).toEqual({});
  });

  it('профилактика: 40 мг = 0,4 мл при любом весе', () => {
    const r = f.formula({ weight: 55, ageYears: 50, indication: 'prophylaxis' });
    expect(r.result3).toBe(40);
    close(r.result4, 0.4);
  });

  it('вес 0 или неизвестное показание → {}', () => {
    expect(f.formula({ weight: 0, ageYears: 50, indication: 'nste' })).toEqual({});
    expect(f.formula({ weight: 70, ageYears: 50, indication: 'x' })).toEqual({});
  });
});

describe('Терлипрессин, эсмолол, метопролол', () => {
  it('терлипрессин: 1 мг = 10 мл в/в каждые 4–6 ч', () => {
    const r = byName('Терлипрессин').formula({ ageYears: 50 });
    expect(r.result1).toBe(1);
    close(r.result2, 10);
    expect(r.result3).toMatch(/4–6 ч/);
  });

  it('эсмолол, 70 кг: нагрузка 35 мг = 3,5 мл; 50 мкг/кг/мин = 21 мл/ч; максимум 200 = 84 мл/ч', () => {
    const f = byName('Эсмолол');
    const r = f.formula({ weight: 70, ageYears: 50 });
    close(r.result1, 35);
    close(r.result2, 3.5);
    close(r.result3, 21);
    close(r.result4, 84);
    const r50 = f.formula({ weight: 50, ageYears: 18 });
    close(r50.result1, 25);
    close(r50.result3, 15);
    expect(f.formula({ weight: 0, ageYears: 50 })).toEqual({});
  });

  it('метопролол: 5 мг = 5 мл; максимум НЖТ 20 мг, ИМ 15 мг', () => {
    const f = byName('Метопролол');
    const svt = f.formula({ ageYears: 50, indication: 'svt' });
    expect(svt.result1).toBe(5);
    expect(svt.result2).toBe(5);
    expect(svt.result3).toBe(20);
    expect(svt.result4).toMatch(/САД < 110/);
    const mi = f.formula({ ageYears: 50, indication: 'mi' });
    expect(mi.result3).toBe(15);
    expect(mi.result4).toMatch(/интервалом не менее 2 мин/);
    expect(f.formula({ ageYears: 50, indication: 'x' })).toEqual({});
  });
});

describe('Клопидогрел', () => {
  const f = byName('Клопидогрел');
  it('первичное ЧКВ: 600 мг = 8 таб', () => {
    const r = f.formula({ ageYears: 60, indication: 'pci' });
    expect(r.result1).toBe(600);
    expect(r.result2).toBe(8);
  });
  it('тромболизис: до 75 лет 300 мг = 4 таб; с 75 лет 75 мг = 1 таб', () => {
    const r74 = f.formula({ ageYears: 74, indication: 'lysis' });
    expect(r74.result1).toBe(300);
    expect(r74.result2).toBe(4);
    const r75 = f.formula({ ageYears: 75, indication: 'lysis' });
    expect(r75.result1).toBe(75);
    expect(r75.result2).toBe(1);
    expect(r75.result3).toMatch(/без нагрузочной/);
  });
  it('без реперфузии 75 мг; ОКС без подъёма ST 300 мг', () => {
    expect(f.formula({ ageYears: 60, indication: 'noReperfusion' }).result1).toBe(75);
    const nste = f.formula({ ageYears: 60, indication: 'nste' });
    expect(nste.result1).toBe(300);
    expect(nste.result3).toMatch(/600 мг/);
  });
  it('неизвестное показание → {}', () => expect(f.formula({ ageYears: 60, indication: 'x' })).toEqual({}));
});

describe('Окситоцин', () => {
  const f = byName('Окситоцин');
  it('без возраста и веса: доза не зависит от возраста', () => {
    expect(f.inputs.ageYears).toBeUndefined();
    expect(f.inputs.weight).toBeUndefined();
  });
  it('профилактика: 10 МЕ = 2 мл в/м', () => {
    const r = f.formula({ indication: 'prevention' });
    expect(r.result1).toBe(10);
    close(r.result2, 2);
    expect(f.labels.result1).toMatch(/в\/м/);
    expect(r.result4).toBeUndefined();
  });
  it('лечение: 10 МЕ (2 мл) в 500 мл в/в, 125 мл/ч, максимум 60 МЕ/сут', () => {
    const r = f.formula({ indication: 'treatment' });
    expect(r.result1).toBeUndefined();
    expect(r.result4).toBe(10);
    close(r.result5, 2);
    expect(r.result6).toBe(125);
    expect(r.result8).toBe(60);
    expect(f.labels.result4).toMatch(/в\/в/);
  });
  it('у беременной 16 лет доза та же', () => {
    expect(f.formula({ indication: 'prevention', ageYears: 16 }).result1).toBe(10);
  });
});

describe('Изосорбида динитрат', () => {
  const f = byName('Изосорбида динитрат (раствор/спрей)');
  it('спрей: 1 доза 1,25 мг, максимум за приём 3 дозы = 3,75 мг', () => {
    const r = f.formula({ ageYears: 60, route: 'buccal' });
    close(r.result1, 1.25);
    close(r.result2, 3.75);
    expect(r.result3).toMatch(/не вдыхать/);
  });
  it('в/в: 1 мг/ч = 10 мл/ч раствора 0,1 мг/мл', () => {
    const r = f.formula({ ageYears: 60, route: 'iv' });
    expect(r.result4).toBe(1);
    close(r.result5, 10);
    expect(r.result6).toMatch(/500 мл/);
    expect(r.result1).toBeUndefined();
  });
});

describe('Цитофлавин, тиосульфат, мексидол', () => {
  it('цитофлавин взрослому: 10 мл в/в капельно', () => {
    const f = byName('Инозин + никотинамид + рибофлавин + янтарная кислота');
    const r = f.formula({ ageYears: 50 });
    expect(r.result1).toBe(10);
    expect(r.result2).toMatch(/3–4 мл\/мин/);
    // Новорождённому — не рассчитывается, в предупреждениях — режим ОРИТН
    expect(f.formula({ ageYears: 0 })).toEqual({});
    expect(f.warnings[0]).toMatch(/новорождённые/);
  });

  it('тиосульфат: цианиды 15 г = 50 мл; металлы 1,5 г = 5 мл', () => {
    const f = byName('Натрия тиосульфат 300 мг/мл - 10 мл');
    const cy = f.formula({ ageYears: 40, indication: 'cyanide' });
    close(cy.result1, 15);
    expect(cy.result2).toBe(50);
    const me = f.formula({ ageYears: 40, indication: 'metals' });
    close(me.result1, 1.5);
    expect(me.result2).toBe(5);
    expect(me.result3).toMatch(/5–10 мл/);
  });

  it('мексидол: в/в 200 мг = 4 мл, в/м 200 мг = 4 мл, максимум 1200 мг/сут', () => {
    const f = byName('Этилметилгидроксипиридина сукцинат');
    const iv = f.formula({ ageYears: 40, route: 'iv' });
    expect(iv.result1).toBe(200);
    close(iv.result2, 4);
    expect(iv.result7).toBe(1200);
    expect(iv.result4).toBeUndefined();
    const im = f.formula({ ageYears: 40, route: 'im' });
    expect(im.result4).toBe(200);
    close(im.result5, 4);
    expect(im.result6).toMatch(/в\/м/);
    expect(im.result1).toBeUndefined();
  });
});

describe('Натрия гидрокарбонат 5% (без изменений)', () => {
  const f = byName('Натрия гидрокарбонат 5%');
  it('ребёнок 20 кг: 20 ммоль = 33,6 мл', () => {
    const r = f.formula({ weight: 20 });
    close(r.result1, 20);
    close(r.result2, 20 / 0.595);
  });
  it('взрослый 70 кг: предел 50 ммоль', () => {
    const r = f.formula({ weight: 70 });
    expect(r.result1).toBe(50);
    expect(r.result3).toMatch(/максимум/);
  });
  it('граница 50 кг: ровно 50 ммоль без примечания', () => {
    const r = f.formula({ weight: 50 });
    expect(r.result1).toBe(50);
    expect(r.result3).toBeUndefined();
  });
});

describe('движок: расчёт записей группы', () => {
  it('ребёнок: «расчёт не выполняется» и предупреждение про 18 лет', () => {
    const r = computeResult(byName('Метопролол'), { indication: 'svt' }, { age: { years: 10, months: 0 } });
    expect(r.info).toBe(true);
    expect(r.warnings[0]).toMatch(/до 18 лет/);
  });

  it('взрослый: путь по умолчанию подставляется, путь — в выборе и в копии', () => {
    const r = computeResult(byName('Нитроглицерин'), {}, { age: { years: 55, months: 0 } });
    expect(r.success).toBe(true);
    expect(r.choices).toEqual([expect.objectContaining({ key: 'route', value: 'sl', valueLabel: 'под язык' })]);
    expect(r.items[0].name).toMatch(/под язык/);
    expect(buildCopyText(r)).toMatch(/Путь введения: под язык/);
  });

  it('эноксапарин 120 кг: строка п/к дозы — на пределе', () => {
    const r = computeResult(
      byName('Эноксапарин натрия'),
      { weight: '120', indication: 'stemiLysis' },
      { age: { years: 60, months: 0 } }
    );
    expect(r.success).toBe(true);
    const sc = r.items.find((i) => i.key === 'result3');
    expect(sc.status).toBe('atmax');
  });

  it('окситоцин: расчёт без данных пациента', () => {
    const r = computeResult(byName('Окситоцин'), {});
    expect(r.success).toBe(true);
    expect(r.items[0].text).toMatch(/10/);
  });
});
