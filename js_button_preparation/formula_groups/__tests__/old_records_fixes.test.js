// Правки старых записей по КР РФ: сепсис (декстраны, объём инфузии у взрослых и детей), дексаметазон при
// крупе у детей до 3 лет, сочетание дигоксина с амиодароном и верапамилом.
import infusion from '../infusion';
import electrolytes from '../electrolytes_solutions';
import analgesicsSteroids from '../analgesics_steroids';
import resuscitation from '../resuscitation';

const byName = (group, start) => {
  const f = group.find((x) => x.name.startsWith(start));
  if (!f) throw new Error(`нет записи «${start}»`);
  return f;
};

describe('сепсис: декстраны и объём кристаллоидов', () => {
  test('Реополиглюкин — при сепсисе не применять (КР «Сепсис у взрослых» 2024)', () => {
    const f = byName(infusion, 'Реополиглюкин');
    expect(f.warnings.join(' ')).toMatch(/При сепсисе не применять.*декстрана и желатина/);
  });

  test('физраствор (возраста нет): обе строки — детям 40–60 мл/кг, взрослым не более 30 мл/кг', () => {
    const f = byName(infusion, 'Физраствор');
    const kid = f.formula({ weight: 20, indication: 'shock-iv' });
    expect(kid.result1).toBe(200);
    expect(kid.result5).toMatch(
      /Детям при гиповолемическом или распределительном.*40–60 мл\/кг \(800–1200 мл\) за 1-й час.*кардиогенном шоке этот объём не применять \(ERC 2025\)/,
    );
    expect(kid.result5).toMatch(/Взрослым при сепсисе — не более 30 мл\/кг \(600 мл\)/);
    const adult = f.formula({ weight: 70, indication: 'shock-iv' });
    expect(adult.result1).toBe(500);
    expect(adult.result5).toMatch(/не более 30 мл\/кг \(2100 мл\) за первые 3 часа/);
  });

  test('раствор Рингера: те же строки об объёме', () => {
    const f = byName(infusion, 'Раствор Рингера');
    const r = f.formula({ weight: 20, indication: 'shock-iv' });
    expect(r.result6).toMatch(/40–60 мл\/кг/);
    expect(r.result6).toMatch(/не более 30 мл\/кг/);
  });

  test('Рингер-лактат: по возрасту, а не по массе — взрослая 45 кг и подросток 55 кг', () => {
    const f = byName(electrolytes, 'Рингер-лактат');
    const text = (r) =>
      Object.values(r)
        .filter((v) => typeof v === 'string')
        .join(' ');
    const thinAdult = text(f.formula({ weight: 45, ageYears: 70, indication: 'shock-iv' }));
    expect(thinAdult).toMatch(/Взрослым при сепсисе — не более 30 мл\/кг \(1350 мл\)/);
    expect(thinAdult).not.toMatch(/40–60 мл\/кг/);
    const teen = text(f.formula({ weight: 55, ageYears: 15, indication: 'shock-iv' }));
    expect(teen).toMatch(/Детям при гиповолемическом/);
    expect(teen).not.toMatch(/Взрослым при сепсисе/);
    expect(text(f.formula({ weight: 70, ageYears: 18, indication: 'shock-iv' }))).toMatch(
      /Взрослым при сепсисе — не более 30 мл\/кг \(2100 мл\)/,
    );
  });
});

describe('дексаметазон при крупе', () => {
  const dex = byName(analgesicsSteroids, 'Дексаметазон');

  test('до 3 лет — примечание «не более 4 мг (1 мл)» по КР 2021', () => {
    const r = dex.formula({ weight: 12, ageYears: 2, indication: 'croup-im' });
    expect(r.result4).toMatch(/до 3 лет в большинстве случаев достаточно не более 4 мг \(1 мл\)/);
  });

  test('до 3 лет, но масса меньше 6,7 кг (4 мг > 0,6 мг/кг) — без примечания', () => {
    expect(dex.formula({ weight: 5, ageYears: 0.5, indication: 'croup-im' }).result4).not.toMatch(
      /не более 4 мг/,
    );
  });

  test('с 3 лет и при анафилаксии — без этого примечания', () => {
    expect(dex.formula({ weight: 15, ageYears: 3, indication: 'croup-im' }).result4).not.toMatch(
      /не более 4 мг/,
    );
    expect(
      dex.formula({ weight: 12, ageYears: 2, indication: 'anaphylaxis-im' }).result4,
    ).not.toMatch(/не более 4 мг/);
  });
});

describe('дигоксин с амиодароном и верапамилом', () => {
  test('Кордарон: рост концентрации дигоксина, снизить дозу; КР «ФП» — нежелательно', () => {
    const w = byName(resuscitation, 'Кордарон').warnings.join(' ');
    expect(w).toMatch(/С дигоксином: растёт его концентрация/);
    expect(w).toMatch(/дозу дигоксина снизить/);
    expect(w).toMatch(/сочетание нежелательно/);
  });

  test('Изоптин: концентрация дигоксина растёт примерно на 50%, снизить дозу', () => {
    const w = byName(resuscitation, 'Изоптин').warnings.join(' ');
    expect(w).toMatch(/примерно на 50%/);
    expect(w).toMatch(/сочетание нежелательно/);
  });
});
