import { DEVICES, deviceByKey, deviceMax } from '../devices';
import {
  SCENARIOS,
  SPECIAL,
  adultFirstEnergy,
  joules,
  pickStep,
  safetyFor,
  shockPlan,
  stepsFor,
} from '../defibLogic';

// Тексты сравниваем с обычными пробелами (в приложении между числом и «Дж» — неразрывный)
const spaces = (s) => (typeof s === 'string' ? s.replace(/ /g, ' ') : s);
const plan = (scenario, deviceKey, group = 'adult', weightKg) => {
  const p = shockPlan({ scenario, device: deviceByKey(deviceKey), group, weightKg });
  if (!p) return p;
  return {
    ...p,
    firstText: spaces(p.firstText),
    nextText: spaces(p.nextText),
    calcText: spaces(p.calcText),
    notes: p.notes.map(spaces),
  };
};
const perKg = (p, w) => p.first / w;

describe('аппараты', () => {
  test('у каждого — ключ, подписи, импульс; ступени по возрастанию и без повторов', () => {
    const keys = new Set();
    DEVICES.forEach((d) => {
      expect(keys.has(d.key)).toBe(false);
      keys.add(d.key);
      expect(d.label).toBeTruthy();
      expect(d.short).toBeTruthy();
      expect(d.spoken).toBeTruthy();
      expect(['biphasic', 'monophasic']).toContain(d.waveform);
      [d.steps, d.childSteps].filter(Array.isArray).forEach((steps) => {
        expect([...steps].sort((a, b) => a - b)).toEqual(steps);
        expect(new Set(steps).size).toBe(steps.length);
        steps.forEach((x) => expect(x).toBeGreaterThan(0));
      });
      if (d.aedOnly) {
        expect(d.aedAdult.length).toBeGreaterThan(0);
        expect(d.aedChild.length).toBeGreaterThan(0);
        expect(d.sync).toBe(false);
      }
    });
  });

  test('максимум аппарата: по ступеням или из поля max', () => {
    expect(deviceMax(deviceByKey('lifepak15'))).toBe(360);
    expect(deviceMax(deviceByKey('zollR'))).toBe(200);
    expect(deviceMax(deviceByKey('philips'))).toBe(200);
    expect(deviceMax(deviceByKey('nihon'))).toBe(270);
    expect(deviceMax(deviceByKey('corpuls'))).toBe(200);
    expect(deviceMax(deviceByKey('otherBi'))).toBeNull();
  });
});

describe('pickStep', () => {
  const steps = [5, 10, 25, 50, 75, 100, 150];
  test('вверх, вниз, ближайшая (при равенстве — меньшая или большая)', () => {
    expect(pickStep(steps, 72, 'up')).toBe(75);
    expect(pickStep(steps, 72, 'down')).toBe(50);
    expect(pickStep(steps, 18, 'near')).toBe(25);
    expect(pickStep([10, 20], 15, 'near')).toBe(10);
    expect(pickStep([10, 20], 15, 'near', null, 'up')).toBe(20);
    expect(pickStep(steps, 500, 'up')).toBe(150);
    expect(pickStep(steps, 1, 'down')).toBe(5);
  });
  test('максимум учитывается и при известных ступенях; неотсортированные ступени', () => {
    expect(pickStep([100, 200, 300, 360], 250, 'up', 200)).toBe(200);
    expect(pickStep([150, 5, 50], 40, 'near')).toBe(50);
  });
  test('нет цели или ступеней — без падений', () => {
    expect(pickStep(steps, 0)).toBeNull();
    expect(pickStep(steps, NaN)).toBeNull();
    expect(pickStep(steps, -5)).toBeNull();
    expect(pickStep([], 72.4, 'up', 200)).toBe(73);
    expect(pickStep(null, 300, 'up', 200)).toBe(200);
    expect(pickStep(null, 7.6, 'near')).toBe(8);
  });
});

describe('взрослые: дефибрилляция ФЖ / ЖТ без пульса', () => {
  test('LIFEPAK 15 — протокол производителя 200 → 300 → 360 Дж, текст для диктора', () => {
    const p = plan('vf', 'lifepak15');
    expect(p.mode).toBe('defib');
    expect(p.first).toBe(200);
    expect(p.nextText).toBe('Повторные разряды: 300 Дж → 360 Дж');
    expect(p.pads).toMatch(/под правой ключицей/);
    expect(p.pads).toMatch(/кнутри от левой лопатки/);
    expect(p.spoken).toBe(
      'Дефибрилляция без синхронизации. 200 джоулей. Повторные: 300, затем 360 джоулей',
    );
  });

  test('между числом и «Дж» — неразрывный пробел', () => {
    const raw = shockPlan({ scenario: 'vf', device: deviceByKey('lifepak15'), group: 'adult' });
    expect(raw.nextText).toContain('300 Дж');
  });

  test('ZOLL — не меньше 150 Дж (ERC 2025), затем 200; заметки про протокол и детские ступени', () => {
    const p = plan('vf', 'zollR');
    expect(p.first).toBe(150);
    expect(p.nextText).toBe('Повторные разряды: 200 Дж');
    expect(p.notes.join(' ')).toMatch(/120 → 150 → 200/);
    expect(p.notes.join(' ')).toMatch(/OneStep/);
  });

  test('Аксион — 150 Дж (а не заводские 100), затем 200 и 360', () => {
    const p = plan('vf', 'axion10');
    expect(p.first).toBe(150);
    expect(p.nextText).toBe('Повторные разряды: 200 Дж → 360 Дж');
    expect(p.notes.join(' ')).toMatch(/по умолчанию 100 Дж/);
  });

  test('Philips — 150 → 200; Mindray — 150 → 200 → 360; Nihon Kohden — 150 → 200 → 270', () => {
    expect(plan('vf', 'philips').nextText).toBe('Повторные разряды: 200 Дж');
    expect(plan('vf', 'mindray').nextText).toBe('Повторные разряды: 200 Дж → 360 Дж');
    expect(plan('vf', 'nihon').nextText).toBe('Повторные разряды: 200 Дж → 270 Дж');
  });

  test('corpuls3 — 150 и 200; другой бифазный (протокол неизвестен) — максимум аппарата (ERC)', () => {
    expect(plan('vf', 'corpuls').first).toBe(150);
    expect(plan('vf', 'corpuls').nextText).toBe('Повторные разряды: 200 Дж');
    const other = plan('vf', 'otherBi');
    expect(other.first).toBeNull();
    expect(other.firstText).toBe('Максимум аппарата');
    expect(other.nextText).toBe('Повторные разряды: та же максимальная энергия');
  });

  test('монофазный — всегда 360 Дж', () => {
    const p = plan('vf', 'mono');
    expect(p.first).toBe(360);
    expect(p.nextText).toBe('Повторные разряды: та же энергия');
  });
});

describe('взрослые: синхронизированная кардиоверсия', () => {
  test('ФП — максимум аппарата', () => {
    expect(plan('af', 'lifepak15').first).toBe(360);
    expect(plan('af', 'zollR').first).toBe(200);
    expect(plan('af', 'lifepak15').nextText).toMatch(/та же максимальная/);
    const unknown = plan('af', 'otherBi');
    expect(unknown.first).toBeNull();
    expect(unknown.firstText).toBe('Максимум аппарата (не меньше 200 Дж)');
  });

  test('ЖТ с пульсом — 120–150 Дж и ступенчатое повышение', () => {
    expect(plan('vt', 'zollR').first).toBe(120);
    expect(plan('vt', 'zollR').nextText).toBe('Если не помогло: 200 Дж');
    expect(plan('vt', 'axion10').first).toBe(150);
    expect(plan('vt', 'axion10').nextText).toBe('Если не помогло: 250 Дж → 360 Дж');
    expect(plan('vt', 'lifepak15').first).toBe(125);
    expect(plan('vt', 'lifepak15').nextText).toBe('Если не помогло: 175 Дж → 250 Дж');
  });

  test('ТП / НЖТ — 70–100 Дж; протокол дефибрилляции LIFEPAK к кардиоверсии не применяется', () => {
    expect(plan('svt', 'axion10').first).toBe(75);
    expect(plan('svt', 'philips').first).toBe(70);
    expect(plan('svt', 'zollR').first).toBe(75);
    const lp = plan('svt', 'lifepak15');
    expect(lp.first).toBe(70);
    expect(lp.nextText).toBe('Если не помогло: 100 Дж → 150 Дж');
    expect(lp.notes.join(' ')).not.toMatch(/протокол производителя/);
    // Заметка Аксиона «поставьте не меньше 150» — только для дефибрилляции
    expect(plan('svt', 'axion10').notes.join(' ')).not.toMatch(/не меньше 150/);
  });

  test('монофазный: ФП 200 → 300 → 360, ЖТ 100 → 200 → 300, с оговоркой', () => {
    expect(plan('af', 'mono').first).toBe(200);
    expect(plan('af', 'mono').nextText).toBe('Если не помогло: 300 Дж → 360 Дж');
    expect(plan('vt', 'mono').first).toBe(100);
    expect(plan('vt', 'mono').nextText).toBe('Если не помогло: 200 Дж → 300 Дж');
    expect(plan('svt', 'mono').notes.join(' ')).toMatch(/AHA 2010/);
  });

  test('первая энергия кардиоверсии не выходит за границы диапазона', () => {
    DEVICES.filter((d) => !d.aedOnly && d.waveform === 'biphasic').forEach((d) => {
      const vt = adultFirstEnergy('vt', d);
      const svt = adultFirstEnergy('svt', d);
      expect(vt).toBeGreaterThanOrEqual(100);
      expect(vt).toBeLessThanOrEqual(150);
      expect(svt).toBeGreaterThanOrEqual(50);
      expect(svt).toBeLessThanOrEqual(100);
    });
  });
});

describe('дети: дефибрилляция', () => {
  test('без массы или с массой вне пределов — просим указать', () => {
    expect(plan('vf', 'lifepak15', 'child', '').needWeight).toBe(true);
    expect(plan('vf', 'lifepak15', 'child', 200).needWeight).toBe(true);
    expect(plan('vf', 'lifepak15', 'child', 0.1).needWeight).toBe(true);
    expect(plan('vf', 'lifepak15', 'child', NaN).first).toBeNull();
  });

  test('ступень, ближайшая к 4 Дж/кг: 18 кг на Аксионе → 75 Дж, детские электроды', () => {
    const p = plan('vf', 'axion10', 'child', 18);
    expect(p.first).toBe(75);
    expect(p.calcText).toBe('4 Дж/кг × 18 кг = 72 Дж → на аппарате 75 Дж (4,2 Дж/кг)');
    expect(p.pads).toMatch(/Детские электроды.*Переднезаднее/);
    expect(p.nextText).toBe('Повторные разряды: та же энергия');
  });

  test('малыши не получают больше 8 Дж/кг из-за крупных ступеней', () => {
    // Аксион 3 кг: 12 Дж → 10 Дж (а не 25)
    expect(plan('vf', 'axion10', 'child', 3).first).toBe(10);
    // Аксион 6,3 кг: 25,2 Дж → 25 Дж (а не 50)
    expect(plan('vf', 'axion10', 'child', 6.3).first).toBe(25);
    // LIFEPAK 2,6 кг: 10,4 Дж → 10 Дж; 8 кг: 32 → 30 Дж
    expect(plan('vf', 'lifepak15', 'child', 2.6).first).toBe(10);
    expect(plan('vf', 'lifepak15', 'child', 8).first).toBe(30);
    // Mindray 26 кг (взрослые ступени): 104 → 100 Дж
    expect(plan('vf', 'mindray', 'child', 26).first).toBe(100);
    // На всех ручных аппаратах от 1 до 37 кг — от 2 до 8 Дж/кг
    DEVICES.filter((d) => !d.aedOnly).forEach((d) => {
      for (let w = 1; w <= 37; w += 0.5) {
        const p = plan('vf', d.key, 'child', w);
        expect(perKg(p, w)).toBeLessThanOrEqual(8);
        expect(perKg(p, w)).toBeGreaterThanOrEqual(2);
      }
    });
  });

  test('ступень дальше от 4 Дж/кг — предупреждение; меньше 8 Дж/кг невозможно — отдельное', () => {
    // Аксион 9 кг: 36 Дж → 25 Дж (2,8 Дж/кг)
    const p = plan('vf', 'axion10', 'child', 9);
    expect(p.first).toBe(25);
    expect(p.notes.join(' ')).toMatch(/Ближайшая ступень аппарата — 2,8 Дж\/кг/);
    const tiny = plan('vf', 'axion10', 'child', 0.5);
    expect(tiny.first).toBe(5);
    expect(tiny.notes.join(' ')).toMatch(/больше 8 Дж\/кг/);
  });

  test('подросток: 4 Дж/кг не меньше взрослой дозы — взрослая энергия и взрослая эскалация', () => {
    const p = plan('vf', 'axion10', 'child', 45);
    expect(p.first).toBe(150);
    expect(p.nextText).toBe('Повторные разряды: 200 Дж → 360 Дж');
    expect(p.calcText).toMatch(/не меньше взрослой дозы/);
    expect(p.pads).toMatch(/Взрослые электроды/);
    expect(plan('vf', 'zollR', 'child', 70).nextText).toBe('Повторные разряды: 200 Дж');
  });

  test('детские ступени ZOLL с педиатрическими электродами: 10 кг → 50 Дж, 21 кг → 85 Дж', () => {
    expect(plan('vf', 'zollR', 'child', 10).first).toBe(50);
    expect(plan('vf', 'zollR', 'child', 21).first).toBe(85);
  });
});

describe('дети: кардиоверсия', () => {
  test('1 Дж/кг, затем 2 Дж/кг (ступень вверх, не выше 4 Дж/кг)', () => {
    const p = plan('svt', 'axion10', 'child', 18);
    expect(p.first).toBe(25);
    expect(p.nextText).toBe('Если не помогло: 50 Дж');
    expect(p.mode).toBe('sync');
    expect(p.calcText).toMatch(/^1 Дж\/кг × 18 кг = 18 Дж → на аппарате 25 Дж/);
    const lp = plan('vt', 'lifepak15', 'child', 20);
    expect(lp.first).toBe(20);
    expect(lp.nextText).toBe('Если не помогло: 50 Дж');
    const baby = plan('svt', 'axion10', 'child', 4);
    expect(baby.first).toBe(5);
    expect(baby.nextText).toBe('Если не помогло: 10 Дж');
  });

  test('ни первая, ни вторая попытка не выше 4 Дж/кг, где у аппарата есть ступень', () => {
    DEVICES.filter((d) => !d.aedOnly).forEach((d) => {
      ['vt', 'svt', 'af'].forEach((sc) => {
        for (let w = 2; w <= 60; w += 1) {
          const p = plan(sc, d.key, 'child', w);
          const min = d.steps ? Math.min(...d.steps) : 1;
          if (min <= 4 * w) expect(perKg(p, w)).toBeLessThanOrEqual(4);
          const second = (p.nextText || '').match(/(\d+) Дж$/);
          if (second) expect(Number(second[1]) / w).toBeLessThanOrEqual(4);
        }
      });
    });
  });

  test('наименьшая ступень больше 4 Дж/кг — предупреждение', () => {
    const p = plan('svt', 'axion10', 'child', 1);
    expect(p.first).toBe(5);
    expect(p.notes.join(' ')).toMatch(/больше 4 Дж\/кг/);
  });
});

describe('АНД, кардиостимуляция, не шоковые ритмы', () => {
  test('ZOLL AED Plus: энергию выбирает сам; дети до 25 кг — детские электроды 50 → 70 → 85', () => {
    const a = plan('vf', 'zollAed');
    expect(a.mode).toBe('aed');
    expect(a.nextText).toBe('Взрослые электроды: 120 Дж → 150 Дж → 200 Дж');
    const c = plan('vf', 'zollAed', 'child', 15);
    expect(c.nextText).toBe('Детские электроды: 50 Дж → 70 Дж → 85 Дж');
    expect(c.notes.join(' ')).toMatch(/Если детских электродов/);
  });

  test('АНД, ребёнок без массы — оба варианта электродов, не взрослые по умолчанию', () => {
    const p = plan('vf', 'zollAed', 'child', '');
    expect(p.nextText).toMatch(/^До 25 кг \(около 8 лет\) — детские электроды: 50 Дж/);
    expect(p.pads).toMatch(/^Масса не указана/);
  });

  test('АНД не делает кардиоверсию и кардиостимуляцию', () => {
    expect(plan('af', 'zollAed').mode).toBe('nosync');
    expect(plan('brady', 'zollAed').firstText).toMatch(/не умеет кардиостимуляцию/);
  });

  test('брадикардия: кардиостимуляция, переднезадне; опция и неизвестно — оговорки', () => {
    const p = plan('brady', 'lifepak15');
    expect(p.mode).toBe('pace');
    expect(p.first).toBeNull();
    expect(p.pads).toMatch(/переднезаднее/);
    expect(plan('brady', 'axion10').notes.join(' ')).toMatch(/опция/);
    expect(plan('brady', 'nihon').notes.join(' ')).toMatch(/проверьте по инструкции/);
    expect(plan('brady', 'lifepak15', 'child', 10).notes.join(' ')).toMatch(/АВ-блокаде/);
  });

  test('асистолия / ЭАБП — разряд не показан', () => {
    const p = plan('nonshock', 'lifepak15');
    expect(p.mode).toBe('none');
    expect(p.first).toBeNull();
    expect(stepsFor('nonshock')[0]).toMatch(/Разряд не наносить/);
  });

  test('неизвестный сценарий или аппарат — null', () => {
    expect(shockPlan({ scenario: 'x', device: deviceByKey('mono') })).toBeNull();
    expect(shockPlan({ scenario: 'vf', device: null })).toBeNull();
  });
});

describe('тексты', () => {
  test('сценарии: режимы; озвучиваемая подпись начинается с видимой', () => {
    expect(SCENARIOS.map((s) => s.mode)).toEqual(['defib', 'sync', 'sync', 'sync', 'pace', 'none']);
    SCENARIOS.forEach((s) => expect(s.spoken.startsWith(s.label)).toBe(true));
  });

  test('склонение «джоуль»', () => {
    expect(joules(1)).toBe('джоуль');
    expect(joules(2)).toBe('джоуля');
    expect(joules(5)).toBe('джоулей');
    expect(joules(11)).toBe('джоулей');
    expect(joules(21)).toBe('джоуль');
    expect(joules(22)).toBe('джоуля');
    expect(joules(360)).toBe('джоулей');
  });

  test('шаги ФЖ: взрослые и дети, утюжки, проверка пульса, смена вектора', () => {
    const adult = stepsFor('vf').join(' ');
    expect(adult).toMatch(/Всем отойти/);
    expect(adult).toMatch(/адреналин затем каждые 3–5 минут/);
    expect(adult).toMatch(/организованный ритм — проверить пульс/);
    expect(adult).toMatch(/смена вектора/);
    expect(adult).toMatch(/на трубке или надгортанном устройстве не отсоединять/);
    const kid = stepsFor('vf', { child: true, smallChild: true }).join(' ');
    expect(kid).toMatch(/не более 150 мг/);
    expect(kid).toMatch(/каждые 4 минуты/);
    expect(kid).not.toMatch(/смена вектора/);
    expect(stepsFor('vf', { paddles: true }).join(' ')).toMatch(/Утюжки: нанести гель/);
    expect(stepsFor('vf', { aed: true }).join(' ')).toMatch(/АНД/);
  });

  test('шаги кардиоверсии: SYNC, сбой синхронизации, дети, утюжки, torsades', () => {
    const sync = stepsFor('af').join(' ');
    expect(sync).toMatch(/снова включить SYNC/);
    expect(sync).toMatch(/Синхронизация не срабатывает.*несинхронизированный разряд/);
    expect(stepsFor('af', { child: true }).join(' ')).toMatch(/70 \+ 2 × возраст/);
    expect(stepsFor('svt', { paddles: true }).join(' ')).toMatch(/кабель ЭКГ-отведений/);
    expect(stepsFor('vt').join(' ')).toMatch(/torsades de pointes/);
    expect(stepsFor('af', { aed: true })[0]).toMatch(/не делает синхронизированную/);
  });

  test('асистолия: взрослым 30:2, детям 15:2 и частота вдохов по возрасту', () => {
    expect(stepsFor('nonshock').join(' ')).toMatch(/30:2/);
    expect(stepsFor('nonshock', { child: true }).join(' ')).toMatch(/15:2.*до 1 года 25/);
  });

  test('брадикардия: атропин, стимуляция, захват, дети', () => {
    const b = stepsFor('brady').join(' ');
    expect(b).toMatch(/Атропин/);
    expect(b).toMatch(/PACER/);
    expect(b).toMatch(/электрический захват/);
    expect(b).toMatch(/бедренной артерии/);
  });

  test('безопасность: компрессии — только при остановке; особые случаи', () => {
    expect(safetyFor('defib').join(' ')).toMatch(/5 секунд/);
    expect(safetyFor('sync').join(' ')).not.toMatch(/компресс/);
    expect(safetyFor('sync').join(' ')).toMatch(/1 метр/);
    expect(SPECIAL.join(' ')).toMatch(/8 см/);
    expect(SPECIAL.join(' ')).toMatch(/30 °C/);
    expect(SPECIAL.join(' ')).toMatch(/КТГ/);
    expect(SPECIAL.join(' ')).toMatch(/не рекомендуется/);
  });
});
