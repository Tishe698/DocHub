import group from '../nebulized_pediatrics';
import { isReferenceOnly, searchFormulas } from '../../engine';

const byName = (start) => {
  const f = group.find((x) => x.name.startsWith(start));
  if (!f) throw new Error(`нет записи «${start}»`);
  return f;
};
const close = (a, b) => expect(a).toBeCloseTo(b, 6);

const epi = byName('Адреналин (эпинефрин) — круп');
const saline = byName('Гипертонический раствор');

describe('контракт записей группы', () => {
  test('две записи, название — привычное, затем МНН и показание', () => {
    expect(group.map((f) => f.name)).toEqual([
      'Адреналин (эпинефрин) — круп',
      'Гипертонический раствор (натрия хлорид 3%) — бронхиолит',
    ]);
  });

  test('поля записи с расчётом: подписи полей, labels для units, limits', () => {
    expect(epi.description.length).toBeGreaterThan(20);
    expect(epi.inputs.weight).toBe('Вес (кг)');
    expect(epi.inputs.ageYears).toBe('Возраст (лет)');
    Object.keys(epi.units).forEach((k) => expect(epi.labels[k]).toBeTruthy());
    expect(epi.limits.result1.max).toBe(5);
    expect(saline.warnings.length).toBeGreaterThan(0);
    expect(saline.inputs).toEqual({});
  });

  test('пустой ввод — расчёт не выполняется; NaCl 3% — справочная запись', () => {
    expect(epi.formula({})).toEqual({});
    expect(isReferenceOnly(epi)).toBe(false);
    expect(isReferenceOnly(saline)).toBe(true);
    expect(saline.description).toMatch(/Справка/);
    expect(saline.warnings[0]).toMatch(/не рекомендуются/);
  });

  test('путь — только ингаляция через небулайзер', () => {
    expect(epi.inputs.route.choices.map((c) => c.value)).toEqual(['inh']);
    expect(epi.formula({ weight: 10, ageYears: 2, route: 'iv' })).toEqual({});
  });

  test('синонимы для поиска', () => {
    const first = (q) => searchFormulas(group, q)[0].formula.name;
    expect(first('круп')).toBe(epi.name);
    expect(first('бронхиолит')).toBe(saline.name);
  });
});

describe('Адреналин при крупе', () => {
  const run = (weight, ageYears = 2) => epi.formula({ weight, ageYears, route: 'inh' });

  test('0,5 мл/кг: 6 кг → 3 мл = 3 мг, с пометкой о дозе КР', () => {
    const r = run(6, 0.5);
    close(r.result1, 3);
    close(r.result2, 3);
    expect(r.result4).toMatch(/КР дают 5 мл/);
    expect(r.result4).toMatch(/3 ампулы/);
  });

  test('с 10 кг — 5 мл, как в КР, без пометки', () => {
    const r = run(12);
    close(r.result1, 5);
    expect(r.result4).not.toMatch(/КР дают/);
    expect(r.result4).toMatch(/5 ампул по 1 мл/);
    close(run(30, 10).result1, 5);
  });

  test('дробный объём округляет ампулы вверх', () => {
    expect(run(5.5).result4).toMatch(/2,75 мл.*3 ампулы/);
    expect(run(2).result4).toMatch(/1 ампула/);
  });

  test('взрослым и без возраста — не считается', () => {
    expect(run(70, 18)).toEqual({});
    expect(epi.formula({ weight: 10, route: 'inh' })).toEqual({});
  });

  test('введение: небулайзер, наблюдение, предупреждения о вне инструкции и эпиглоттите', () => {
    expect(run(10).result3).toMatch(/небулайзер.*не менее 3 ч/);
    const w = epi.warnings.join(' ');
    expect(w).toMatch(/вне инструкции/);
    expect(w).toMatch(/эпиглоттит/);
    expect(w).toMatch(/дексаметазоном или будесонидом/);
  });
});
