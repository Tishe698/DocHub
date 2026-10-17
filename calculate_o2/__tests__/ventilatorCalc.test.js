import {
  CAPS,
  PRESETS,
  breathTimes,
  childAgeFieldErrors,
  childArrestRr,
  childNonArrestRr,
  computeIvl,
  deviceHint,
  effectiveCaps,
  fio2OptionsFor,
  groupForAge,
  ieOptionsFor,
  massBasisText,
  parseIE,
  pmaxPresetFor,
  predictedBodyWeight,
  ratioText,
  roundT,
  rrPresetFor,
  scenarioMemo,
  toNum,
} from '../ventilatorCalc';

const adult = {
  device: 'medumat2',
  group: 'adult',
  sex: 'male',
  heightCm: 180,
  weightKg: 90,
  ageMonths: 480,
  vtPerKg: '6',
  rr: '10',
  peep: '5',
  pmax: '45',
  fio2: '100',
  o2Mode: 'o2',
  ie: '1:2',
};

describe('должная масса тела (ARDSNet)', () => {
  test('мужчина 180 см → 75,1 кг; женщина 180 см → 70,6 кг', () => {
    expect(predictedBodyWeight('male', 180).kg).toBeCloseTo(75.116, 3);
    expect(predictedBodyWeight('female', 180).kg).toBeCloseTo(70.616, 3);
  });

  test('пол не указан — женская формула (консервативно) с пометкой', () => {
    expect(predictedBodyWeight(null, 180)).toEqual({ kg: predictedBodyWeight('female', 180).kg, sex: 'female', sexAssumed: true });
  });

  test('рост вне 130–230 см или пустой — null; строка разбирается', () => {
    expect(predictedBodyWeight('male', 129)).toBeNull();
    expect(predictedBodyWeight('male', 231)).toBeNull();
    expect(predictedBodyWeight('male', '')).toBeNull();
    expect(predictedBodyWeight('male', null)).toBeNull();
    expect(predictedBodyWeight('male', '152,4').kg).toBeCloseTo(50, 6);
    expect(predictedBodyWeight('male', 130).kg).toBeCloseTo(29.616, 3);
  });
});

describe('ЧДД по возрасту', () => {
  test('СЛР (ERC 2021 PLS): <1 года 25, 1–8 лет 20, 8–12 лет 15, >12 лет 10', () => {
    expect(childArrestRr(0)).toBe(25);
    expect(childArrestRr(11)).toBe(25);
    expect(childArrestRr(12)).toBe(20);
    expect(childArrestRr(96)).toBe(20);
    expect(childArrestRr(97)).toBe(15);
    expect(childArrestRr(144)).toBe(15);
    expect(childArrestRr(145)).toBe(10);
  });

  test('вне остановки — нижняя граница возрастной нормы', () => {
    expect(childNonArrestRr(2)).toBe(40);
    expect(childNonArrestRr(3)).toBe(35);
    expect(childNonArrestRr(6)).toBe(33);
    expect(childNonArrestRr(12)).toBe(30);
    expect(childNonArrestRr(24)).toBe(26);
    expect(childNonArrestRr(60)).toBe(25);
    expect(childNonArrestRr(96)).toBe(22);
    expect(childNonArrestRr(120)).toBe(20);
    expect(childNonArrestRr(144)).toBe(18);
    expect(childNonArrestRr(168)).toBe(16);
  });

  test('rrPresetFor: взрослые из сценария, ребёнок без возраста — null', () => {
    expect(rrPresetFor('arrest', 'adult')).toBe(10);
    expect(rrPresetFor('nonArrest', 'adult')).toBe(14);
    expect(rrPresetFor('arrest', 'child', undefined)).toBeNull();
    expect(rrPresetFor('arrest', 'child', 60)).toBe(20);
    expect(rrPresetFor('nonArrest', 'child', 60)).toBe(25);
  });

  test('groupForAge: до 18 лет — ребёнок', () => {
    expect(groupForAge(215)).toBe('child');
    expect(groupForAge(216)).toBe('adult');
    expect(groupForAge(0)).toBe('child');
    expect(groupForAge(null)).toBeNull();
  });
});

describe('пределы аппаратов', () => {
  test('А-ИВЛ 4/40: детские пределы до 7 лет', () => {
    const c = effectiveCaps('ivl440', 'child', 60);
    expect(c.childLimits).toBe(true);
    expect(c.pmaxMin).toBe(9);
    expect(c.pmaxMax).toBe(36);
    expect(c.veMin).toBe(0.7);
    expect(c.veMax).toBe(10);
    expect(effectiveCaps('ivl440', 'child', 84).childLimits).toBeUndefined();
    expect(effectiveCaps('ivl440', 'adult', 60).childLimits).toBeUndefined();
    expect(effectiveCaps('medumat2', 'child', 60)).toBe(CAPS.medumat2);
  });

  test('Pmax пресет не выходит за пределы аппарата', () => {
    expect(pmaxPresetFor('arrest', 'tube', CAPS.medumat2)).toBe(45);
    expect(pmaxPresetFor('arrest', 'mask', CAPS.medumat2)).toBe(20);
    expect(pmaxPresetFor('arrest', 'tube', effectiveCaps('ivl440', 'child', 60))).toBe(36);
    expect(pmaxPresetFor('nonArrest', 'tube', CAPS.medumatStd)).toBe(30);
    expect(pmaxPresetFor('arrest', 'mask', CAPS.medumatStd)).toBe(20);
    expect(pmaxPresetFor('arrest', 'tube', CAPS.ivl440)).toBe(45);
  });

  test('варианты I:E и FiO₂ по аппарату', () => {
    expect(ieOptionsFor('ivl440')).toEqual(['1:2', '1:1,5', '1:1', '1,5:1', '2:1']);
    expect(ieOptionsFor('medumatStd')).toEqual([]);
    expect(ieOptionsFor('medumat2')).toContain('1:2');
    expect(ieOptionsFor('medumat2')).toContain('1:4');
    expect(fio2OptionsFor('ivl440')).toEqual(['50', '60', '70', '80', '100']);
    expect(fio2OptionsFor('medumat2')).toEqual([]);
    // пресеты сценариев есть среди вариантов
    for (const s of Object.values(PRESETS)) {
      expect(ieOptionsFor('ivl440')).toContain(s.ie);
      expect(ieOptionsFor('medumat2')).toContain(s.ie);
      expect(fio2OptionsFor('ivl440')).toContain(String(s.fio2));
    }
  });

  test('подсказка по аппарату', () => {
    expect(deviceHint('medumat2')).toMatch(/Vt 50–2000 мл/);
    expect(deviceHint('medumatStd')).toMatch(/I:E фиксировано 1:1,67/);
    expect(deviceHint('ivl440')).toMatch(/дети 1–6 лет: Pmax 9–36/);
  });
});

describe('помощники', () => {
  test('parseIE, ratioText, toNum', () => {
    expect(parseIE('1:2')).toEqual([1, 2]);
    expect(parseIE('1/1,5')).toEqual([1, 1.5]);
    expect(parseIE('abc')).toBeNull();
    expect(parseIE('1:0')).toBeNull();
    expect(ratioText([1.5, 1])).toBe('1,5:1');
    expect(toNum('5,5')).toBe(5.5);
    expect(toNum(NaN)).toBeUndefined();
    expect(toNum('x')).toBeUndefined();
  });

  test('время вдоха/выдоха и округление', () => {
    expect(breathTimes(10, [1, 2])).toEqual({ inspT: 2, expT: 4 });
    expect(breathTimes(0, [1, 2])).toBeNull();
    expect(breathTimes(10, null)).toBeNull();
    // 60/40 = 1,5 с; 1:2 → 0,5 и 1,0
    expect(breathTimes(40, [1, 2])).toEqual({ inspT: 0.5, expT: 1 });
    expect(roundT(0.444)).toBe(0.44);
    expect(roundT(1.26)).toBe(1.3);
  });

  test('памятки собраны из пресетов', () => {
    expect(scenarioMemo('arrest').join(' ')).toMatch(/трубка\/НВУ 45, маска 20/);
    expect(scenarioMemo('nonArrest').join(' ')).toMatch(/старт 14/);
  });
});

describe('computeIvl', () => {
  test('взрослый мужчина 180 см, MEDUMAT Standard²: ДО 451 мл, МОД 4,51, вдох 2 с, выдох 4 с', () => {
    const r = computeIvl(adult);
    expect(r.massBasis).toBe('ibw');
    expect(r.mass).toBe(75.1);
    expect(r.vt).toBe(451);
    expect(r.ve).toBe(4.51);
    expect(r.inspT).toBe(2);
    expect(r.expT).toBe(4);
    expect(Object.values(r.tones).every((t) => t === 'default')).toBe(true);
    expect(r.warnings).toEqual([]);
    expect(r.setting).toBeNull();
  });

  test('взрослый без пола — по женской формуле с предупреждением', () => {
    const r = computeIvl({ ...adult, sex: null });
    expect(r.mass).toBe(70.6);
    expect(r.vt).toBe(424);
    expect(r.warnings.join(' ')).toMatch(/Пол не указан/);
  });

  test('взрослый без роста — фактическая масса, подсветка основы', () => {
    const r = computeIvl({ ...adult, heightCm: '' });
    expect(r.massBasis).toBe('actual');
    expect(r.vt).toBe(540);
    expect(r.tones.mass).toBe('bad');
    expect(r.warnings.join(' ')).toMatch(/фактическую массу/);
  });

  test('взрослый, масса < 40 кг — подсказка про группу; масса > 250 — ошибка ввода', () => {
    expect(computeIvl({ ...adult, weightKg: 35 }).warnings.join(' ')).toMatch(/Ребёнок/);
    expect(computeIvl({ ...adult, weightKg: 300 }).warnings.join(' ')).toMatch(/0–250 кг/);
  });

  test('ребёнок 5 лет без массы — APLS 18 кг, ДО 108 мл', () => {
    const r = computeIvl({ ...adult, group: 'child', ageMonths: 60, weightKg: '', rr: '20' });
    expect(r.massBasis).toBe('apls');
    expect(r.mass).toBe(18);
    expect(r.vt).toBe(108);
    expect(r.ve).toBe(2.16);
  });

  test('ребёнок с массой — фактическая масса', () => {
    const r = computeIvl({ ...adult, group: 'child', ageMonths: 60, weightKg: 20, rr: '20' });
    expect(r.massBasis).toBe('actual');
    expect(r.vt).toBe(120);
    expect(r.tones.mass).toBe('default');
  });

  test('ребёнок без возраста — просьба ввести возраст; старше 12 лет без массы — не оценивается', () => {
    expect(computeIvl({ ...adult, group: 'child', ageMonths: null, weightKg: '' }).warnings.join(' ')).toMatch(
      /Введите возраст/
    );
    const r = computeIvl({ ...adult, group: 'child', ageMonths: 168, weightKg: '', heightCm: '' });
    expect(r.vt).toBeNull();
    expect(r.warnings.join(' ')).toMatch(/Старше 12 лет/);
  });

  test('подросток 16 лет, 110 кг, 170 см, муж. — ДО на должную массу, ≤ 8 мл/кг должной', () => {
    const teen = { ...adult, group: 'child', ageMonths: 192, sex: 'male', heightCm: 170, weightKg: 110 };
    const r = computeIvl(teen);
    expect(r.massBasis).toBe('ibw');
    expect(r.mass).toBe(66);
    expect(r.vt).toBe(396);
    expect(r.vt / 66).toBeLessThanOrEqual(8);
    expect(r.tones.mass).toBe('bad');
    expect(r.warnings.join(' ')).toMatch(/больше должной/);
    // 8 мл/кг — не выше 8 мл/кг должной массы
    const r8 = computeIvl({ ...teen, vtPerKg: '8' });
    expect(r8.vt / 66).toBeLessThanOrEqual(8);
  });

  test('подросток без массы, но с ростом — ДО на должную массу', () => {
    const r = computeIvl({ ...adult, group: 'child', ageMonths: 192, sex: 'male', heightCm: 170, weightKg: '' });
    expect(r.massBasis).toBe('ibw');
    expect(r.vt).toBe(396);
    expect(r.warnings.join(' ')).not.toMatch(/Старше 12 лет/);
  });

  test('подросток без роста на фактической массе — подсветка и просьба ввести рост', () => {
    const r = computeIvl({ ...adult, group: 'child', ageMonths: 192, heightCm: '', weightKg: 110 });
    expect(r.massBasis).toBe('actual');
    expect(r.tones.mass).toBe('bad');
    expect(r.warnings.join(' ')).toMatch(/Подросток/);
  });

  test('ребёнок: фактическая масса меньше должной — берётся фактическая; без пола — женская формула', () => {
    const lean = computeIvl({ ...adult, group: 'child', ageMonths: 144, sex: 'male', heightCm: 150, weightKg: 38 });
    expect(lean.massBasis).toBe('actual');
    expect(lean.mass).toBe(38);
    expect(lean.tones.mass).toBe('default');
    const noSex = computeIvl({ ...adult, group: 'child', ageMonths: 192, sex: null, heightCm: 170, weightKg: 110 });
    expect(noSex.massBasis).toBe('ibw');
    expect(noSex.mass).toBe(61.5);
    expect(noSex.warnings.join(' ')).toMatch(/женской формуле/);
  });

  test('ребёнок ниже 130 см — рост не меняет расчёт (фактическая/APLS)', () => {
    const r = computeIvl({ ...adult, group: 'child', ageMonths: 60, heightCm: 110, weightKg: '' });
    expect(r.massBasis).toBe('apls');
    expect(r.mass).toBe(18);
  });

  test('ребёнок 18 лет и старше — подсказка выбрать «Взрослый»', () => {
    expect(computeIvl({ ...adult, group: 'child', ageMonths: 216 }).warnings.join(' ')).toMatch(/Взрослый/);
  });

  test('новорождённый — предупреждение про алгоритм реанимации новорождённых', () => {
    const r = computeIvl({ ...adult, group: 'child', ageMonths: 0, weightKg: 3.5, rr: '25', pmax: '20' });
    expect(r.warnings.join(' ')).toMatch(/Новорождённый/);
  });

  test('ДО вне 4–8 мл/кг и вне возможностей аппарата', () => {
    expect(computeIvl({ ...adult, vtPerKg: '10' }).tones.vt).toBe('bad');
    expect(computeIvl({ ...adult, vtPerKg: '3' }).tones.vt).toBe('bad');
    expect(computeIvl({ ...adult, vtPerKg: '8' }).tones.vt).toBe('default');
    const small = computeIvl({ ...adult, group: 'child', ageMonths: 0, weightKg: 3, vtPerKg: '6', rr: '25', pmax: '20' });
    expect(small.vt).toBe(18);
    expect(small.tones.vt).toBe('bad');
    expect(small.warnings.join(' ')).toMatch(/вне возможностей аппарата \(50–2000 мл\)/);
  });

  test('MEDUMAT Standard: задают МОД и ЧДД, I:E фиксировано 1:1,67, пределы МОД 3–20', () => {
    const r = computeIvl({ ...adult, device: 'medumatStd' });
    expect(r.setting).toBe('На аппарате задают МОД 4,51 л/мин и ЧДД 10/мин (ДО = МОД / ЧДД).');
    // Ttot 6 с; вдох 6 × 1 / 2,67 = 2,25 → 2,2; выдох 3,75 → 3,8
    expect(r.inspT).toBe(2.2);
    expect(r.expT).toBe(3.8);
    expect(r.warnings.join(' ')).toMatch(/внешним клапаном/);
    const high = computeIvl({ ...adult, device: 'medumatStd', rr: '50' });
    expect(high.tones.ve).toBe('bad');
    expect(high.tones.rr).toBe('bad');
  });

  test('Pmax должен быть выше ПДКВ на 10', () => {
    const r = computeIvl({ ...adult, peep: '10', pmax: '19' });
    expect(r.tones.pmax).toBe('bad');
    expect(r.warnings.join(' ')).toMatch(/выше ПДКВ/);
    expect(computeIvl({ ...adult, peep: '10', pmax: '20' }).tones.pmax).toBe('default');
  });

  test('Pmax и ПДКВ вне паспорта MEDUMAT Standard²', () => {
    expect(computeIvl({ ...adult, pmax: '70' }).tones.pmax).toBe('bad');
    expect(computeIvl({ ...adult, peep: '31', pmax: '50' }).tones.peep).toBe('bad');
    expect(computeIvl({ ...adult, peep: '' }).tones.peep).toBe('bad');
  });

  test('I:E: не из списка А-ИВЛ 4/40 и инверсия', () => {
    const r = computeIvl({ ...adult, device: 'ivl440', ie: '1:3', fio2: '100' });
    expect(r.tones.ie).toBe('bad');
    expect(r.warnings.join(' ')).toMatch(/не поддерживает/);
    const inv = computeIvl({ ...adult, ie: '2:1' });
    expect(inv.tones.ie).toBe('default');
    expect(inv.warnings.join(' ')).toMatch(/инверсия/);
    expect(computeIvl({ ...adult, ie: '' }).warnings.join(' ')).toMatch(/I:E не распознано/);
  });

  test('FiO₂ на А-ИВЛ 4/40 — только из паспортного списка', () => {
    expect(computeIvl({ ...adult, device: 'ivl440', fio2: '55' }).tones.fio2).toBe('bad');
    expect(computeIvl({ ...adult, device: 'ivl440', fio2: '60' }).tones.fio2).toBe('default');
    expect(computeIvl({ ...adult, device: 'ivl440', fio2: '60' }).fio2Text).toBe('60 %');
    expect(computeIvl({ ...adult, o2Mode: 'airmix' }).fio2Text).toBe('Air Mix (< 100 %)');
  });

  test('А-ИВЛ 4/40 у ребёнка до 1 года — предупреждение; до 7 лет — детские пределы', () => {
    const baby = computeIvl({ ...adult, device: 'ivl440', group: 'child', ageMonths: 6, weightKg: 7, rr: '33', pmax: '20' });
    expect(baby.warnings.join(' ')).toMatch(/от 1 года/);
    const kid = computeIvl({ ...adult, device: 'ivl440', group: 'child', ageMonths: 60, weightKg: '', rr: '20', pmax: '40' });
    expect(kid.caps.childLimits).toBe(true);
    expect(kid.tones.pmax).toBe('bad');
    expect(kid.warnings.join(' ')).toMatch(/дети до 7 лет/);
  });
});

describe('возраст ребёнка и подпись основы массы (ревью)', () => {
  test('childAgeFieldErrors: лет 0–17, мес 0–11 при указанных годах', () => {
    expect(childAgeFieldErrors('', '')).toEqual({ years: null, months: null });
    expect(childAgeFieldErrors('5', '3')).toEqual({ years: null, months: null });
    expect(childAgeFieldErrors('', '14')).toEqual({ years: null, months: null });
    expect(childAgeFieldErrors('5', '14').months).toMatch('0–11');
    expect(childAgeFieldErrors('5,,', '').years).toMatch('Введите число');
    expect(childAgeFieldErrors('-1', '').years).toMatch('Введите число');
    expect(childAgeFieldErrors('18', '').years).toMatch('Взрослый');
    expect(childAgeFieldErrors('', 'x').months).toMatch('Введите число');
  });

  test('ageInvalid: возраст из контекста не берётся — ни ЧДД-пределов по возрасту, ни APLS', () => {
    const r = computeIvl({ ...adult, group: 'child', ageMonths: 74, ageInvalid: true, weightKg: '', heightCm: '' });
    expect(r.months).toBeUndefined();
    expect(r.mass).toBeNull();
    expect(r.warnings.join(' ')).toMatch(/лет 0–17, мес 0–11 — проверьте ввод/);
  });

  test('масса по Broselow — «оценка», а не «фактическая»', () => {
    const r = computeIvl({ ...adult, group: 'child', ageMonths: 60, weightKg: 19, heightCm: '', weightSource: 'broselow' });
    expect(r.massBasis).toBe('actual');
    expect(r.massBasisText).toBe('оценка (лента Broselow)');
    expect(massBasisText('actual', 'entered')).toBe('фактическая');
    expect(massBasisText('actual', 'age')).toBe('оценка (по возрасту)');
    expect(massBasisText('ibw', 'broselow')).toBe('должная (по росту и полу)');
    expect(massBasisText(null, 'broselow')).toBe('—');
  });
});
