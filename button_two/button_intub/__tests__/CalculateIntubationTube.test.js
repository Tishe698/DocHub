import {
  calculateIntubationTubeLogic,
  calculateIntubationTubeByZone,
  patientZoneKeyOf,
  PATIENT_ZONE_KEYS,
  GREY_SUBZONES,
} from '../CalculateIntubationTube';
import { BROSELOW_ZONES as PATIENT_ZONES } from '../../../patient/estimates';

const calc = (p) => calculateIntubationTubeLogic(p);
const has = (list, re) => (list || []).some((s) => re.test(s));

describe('ЭТТ: зона Broselow по росту', () => {
  test.each([
    // [рост, зона, без манжеты, с манжетой, через рот, назально]
    [50, 'grey3', 3.5, 3.5, 8.5, 9.5],
    [53, 'grey4', 3.5, 3.0, 9.0, 10.0],
    [57, 'grey5', 3.5, 3.0, 10.5, 11.5],
    [62, 'pink', 3.5, 3.0, 10.5, 11.5],
    [70, 'red', 3.5, 3.0, 10.5, 11.5],
    [80, 'purple', 4.0, 3.5, 12.5, 15.5],
    [90, 'yellow', 4.5, 4.0, 13, 16],
    [100, 'white', 5.0, 4.5, 14, 17],
    [115, 'blue', 5.5, 5.0, 15, 18],
    [125, 'orange', 6.0, 5.5, 16, 19],
    [140, 'green', 6.5, 6.0, 17, 20],
  ])('рост %p см → %s', (h, key, idU, idC, oral, nasal) => {
    const u = calc({ heightCm: h });
    expect(u.method).toBe('broselowHeight');
    expect(u.broselowZoneKey).toBe(key);
    expect(u.tubeIDmm).toBe(idU);
    expect(u.cuffedUsed).toBe(false);
    expect(u.depthOralCm).toBe(oral);
    expect(u.depthNasalCm).toBe(nasal);
    const c = calc({ heightCm: h, cuffed: true });
    expect(c.tubeIDmm).toBe(idC);
    // глубина от манжеты не зависит
    expect(c.depthOralCm).toBe(oral);
  });

  test('серая 3 кг: трубка с манжетой не применяется — размер без манжеты и предупреждение', () => {
    const r = calc({ heightCm: 50, cuffed: true });
    expect(r.cuffedUsed).toBe(false);
    expect(r.tubeType).toBe('без манжеты');
    expect(has(r.warnings, /с манжетой при массе ≤3,5 кг не применяются/)).toBe(true);
  });

  test('оранжевая/зелёная с манжетой: выбран меньший размер, больший — в альтернативах', () => {
    const r = calc({ heightCm: 140, cuffed: true });
    expect(r.tubeIDmm).toBe(6.0);
    expect(r.alternativesMm).toEqual([5.5, 6.5]);
    expect(has(r.notes, /указано 6,5 мм с манжетой; выбран меньший/)).toBe(true);
  });

  test('границы ленты: нижняя включительно, верхняя зелёной зоны включительно', () => {
    expect(calc({ heightCm: 46.8 }).broselowZoneKey).toBe('grey3');
    expect(calc({ heightCm: 74.1 }).broselowZoneKey).toBe('red');
    expect(calc({ heightCm: 74.2 }).broselowZoneKey).toBe('purple');
    expect(calc({ heightCm: 143.3 }).broselowZoneKey).toBe('green');
    // выше ленты без возраста — ветка подростка, нужен пол
    expect(() => calc({ heightCm: 143.4 })).toThrow(/Выберите пол/);
    // ниже ленты без массы — расчёта нет
    expect(() => calc({ heightCm: 46.7 })).toThrow(/меньше 46,8 см/);
  });

  test('путь: рекомендуемая глубина для выбранного пути', () => {
    expect(calc({ heightCm: 90, route: 'oral' }).recommendedDepthCm).toBe(13);
    expect(calc({ heightCm: 90, route: 'nasal' }).recommendedDepthCm).toBe(16);
    expect(calc({ heightCm: 90 }).recommendedDepthCm).toBeUndefined();
  });

  test('альтернативы ±0,5 мм, не меньше 2,5 мм', () => {
    expect(calc({ heightCm: 90 }).alternativesMm).toEqual([4.0, 5.0]);
    expect(calc({ weightKg: 0.8, ageMonths: 0 }).alternativesMm).toEqual([3.0]);
  });
});

describe('ЭТТ: зона Broselow по массе (возраст неизвестен)', () => {
  test.each([
    [5, 'grey5', 3.5],
    [6, 'pink', 3.5],
    [7.5, 'pink', 3.5], // промежуток между зонами → меньшая зона
    [10, 'purple', 4.0],
    [11.5, 'purple', 4.0],
    [13, 'yellow', 4.5],
    [17, 'white', 5.0],
    [20, 'blue', 5.5],
    [26, 'orange', 6.0],
    [36.9, 'green', 6.5],
  ])('масса %p кг → %s', (w, key, idU) => {
    const r = calc({ weightKg: w });
    expect(r.method).toBe('broselowWeight');
    expect(r.broselowZoneKey).toBe(key);
    expect(r.tubeIDmm).toBe(idU);
    expect(has(r.notes, /по массе менее точен/)).toBe(true);
  });

  test('масса ≥37 кг без роста и возраста — вне ленты', () => {
    expect(() => calc({ weightKg: 37 })).toThrow(/больше 36 кг/);
  });

  test('масса ≤4,2 кг без возраста — как новорождённый', () => {
    const r = calc({ weightKg: 3 });
    expect(r.method).toBe('neonate');
    expect(r.tubeIDmm).toBe(3.5);
    expect(r.depthOralCm).toBe(8.5);
    expect(r.notes[0]).toMatch(/как для новорождённого/);
  });
});

describe('ЭТТ: новорождённые', () => {
  const neo = (w, extra = {}) => calc({ weightKg: w, ageYears: 0, ageMonths: 0, ...extra });

  test.each([
    // [масса, диаметр, глубина через рот]
    [0.6, 2.5, 5.5],
    [0.8, 2.5, 6.0],
    [1.0, 3.0, 6.5],
    [1.2, 3.0, 7.0],
    [1.5, 3.0, 7.5],
    [2.0, 3.5, 8.0],
    [2.8, 3.5, 8.5],
    [3.5, 3.5, 9.0],
    [4.2, 3.5, 9.0],
  ])('масса %p кг → %p мм, %p см', (w, id, oral) => {
    const r = neo(w);
    expect(r.method).toBe('neonate');
    expect(r.tubeIDmm).toBe(id);
    expect(r.depthOralCm).toBe(oral);
    expect(r.depthNasalCm).toBe(oral + 1);
  });

  test('с манжетой: только при массе >3,5 кг (3,0 мм)', () => {
    const big = neo(4.0, { cuffed: true });
    expect(big.tubeIDmm).toBe(3.0);
    expect(big.cuffedUsed).toBe(true);
    const small = neo(3.0, { cuffed: true });
    expect(small.tubeIDmm).toBe(3.5);
    expect(small.cuffedUsed).toBe(false);
    expect(has(small.warnings, /с манжетой при массе ≤3,5 кг не применяются/)).toBe(true);
  });

  test('экстремально низкая масса — предупреждения о рентген-контроле', () => {
    expect(has(neo(0.6).warnings, /<750 г/)).toBe(true);
    expect(has(neo(0.4).warnings, /<0,5 кг/)).toBe(true);
  });

  test('без массы и роста — расчёта нет', () => {
    expect(() => calc({ ageYears: 0, ageMonths: 0 })).toThrow(/Для новорождённого укажите массу/);
  });

  test('новорождённый >4,2 кг — зона по массе', () => {
    const r = neo(5);
    expect(r.method).toBe('broselowWeight');
    expect(r.broselowZoneKey).toBe('grey5');
    expect(r.depthOralCm).toBe(10.5);
  });

  test('старый вызов числом — масса новорождённого', () => {
    expect(calculateIntubationTubeLogic(3).method).toBe('neonate');
  });
});

describe('ЭТТ: младенцы 1–12 мес', () => {
  test('без массы — масса по APLS (0,5 × мес + 4)', () => {
    const r = calc({ ageMonths: 6 });
    expect(r.method).toBe('infantAge');
    expect(r.broselowZoneKey).toBe('pink');
    expect(r.notes[0]).toMatch(/≈ 7 кг/);
  });

  test('масса на 2 зоны больше ожидаемой — зона по возрасту с предупреждением', () => {
    const r = calc({ ageMonths: 6, weightKg: 15 });
    expect(r.method).toBe('infantAge');
    expect(r.broselowZoneKey).toBe('pink');
    expect(r.tubeIDmm).toBe(3.5);
    expect(has(r.warnings, /слишком велика для возраста/)).toBe(true);
  });

  test('масса на 2 зоны меньше ожидаемой — по массе с предупреждением', () => {
    const r = calc({ ageMonths: 10, weightKg: 5.5 });
    expect(r.method).toBe('broselowWeight');
    expect(r.broselowZoneKey).toBe('grey5');
    expect(has(r.warnings, /меньше ожидаемой/)).toBe(true);
  });
});

describe('ЭТТ: дети 1–12 лет по возрасту', () => {
  test.each([
    // [возраст, без манжеты, с манжетой, через рот, назально]
    [1.5, 4.0, 3.5, 13, 16],
    [2, 4.5, 4.0, 13, 16],
    [5, 5.5, 5.0, 14.5, 17.5],
    [8, 6.0, 5.5, 16, 19],
    [12, 7.0, 6.5, 18, 21],
  ])('%p лет', (a, idU, idC, oral, nasal) => {
    const u = calc({ ageYears: a });
    expect(u.method).toBe('age');
    expect(u.tubeIDmm).toBe(idU);
    expect(u.depthOralCm).toBe(oral);
    expect(u.depthNasalCm).toBe(nasal);
    expect(calc({ ageYears: a, cuffed: true }).tubeIDmm).toBe(idC);
  });

  test('годы и месяцы складываются', () => {
    expect(calc({ ageYears: 1, ageMonths: 6 }).depthOralCm).toBe(13);
  });

  test('масса при известном возрасте не используется', () => {
    const r = calc({ ageYears: 5, weightKg: 40 });
    expect(r.tubeIDmm).toBe(5.5);
    expect(has(r.ignored, /масса/)).toBe(true);
  });
});

describe('ЭТТ: несоответствие роста, массы и возраста', () => {
  test('масса из другой зоны (на 2+ зоны) — предупреждение, расчёт по росту', () => {
    const r = calc({ heightCm: 90, weightKg: 30 });
    expect(r.broselowZoneKey).toBe('yellow');
    expect(r.tubeIDmm).toBe(4.5);
    expect(has(r.warnings, /соответствует другой зоне/)).toBe(true);
  });

  test('соседняя зона по массе — без предупреждения', () => {
    expect(calc({ heightCm: 90, weightKg: 15 }).warnings).toEqual([]);
  });

  test('масса больше зелёной зоны при росте в пределах ленты', () => {
    expect(has(calc({ heightCm: 90, weightKg: 50 }).warnings, /больше зелёной зоны/)).toBe(true);
  });

  test('возраст расходится с ростом больше чем на 0,5 мм', () => {
    const r = calc({ heightCm: 90, ageYears: 8 });
    expect(r.tubeIDmm).toBe(4.5);
    expect(has(r.warnings, /расхождение с ростом/)).toBe(true);
  });

  test('масса ≤4,2 кг и рост на 2+ зоны больше — расчёт не выдаётся', () => {
    expect(() => calc({ weightKg: 4, heightCm: 100 })).toThrow(/не соответствует массе/);
  });

  test('масса ≤4,2 кг и рост на 1 зону больше — по массе с предупреждением', () => {
    const r = calc({ weightKg: 4, heightCm: 62 });
    expect(r.method).toBe('neonate');
    expect(has(r.warnings, /больше ожидаемого для массы/)).toBe(true);
  });
});

describe('ЭТТ: подростки 13–15 лет', () => {
  test('девушка 14 лет, 160 см: диаметр не больше взрослого, глубина по росту', () => {
    const r = calc({ ageYears: 14, heightCm: 160, sex: 'female' });
    expect(r.method).toBe('teen');
    expect(r.tubeIDmm).toBe(7.0);
    expect(r.depthOralCm).toBe(20.5);
    expect(r.depthNasalCm).toBe(23.5);
    expect(has(r.notes, /ограничен взрослым размером/)).toBe(true);
    expect(r.alternativesMm).toEqual([6.5, 7.5]);
  });

  test('юноша 14 лет без манжеты 7,5 мм, с манжетой 7,0 мм', () => {
    expect(calc({ ageYears: 14, sex: 'male' }).tubeIDmm).toBe(7.5);
    expect(calc({ ageYears: 14, sex: 'male', cuffed: true }).tubeIDmm).toBe(7.0);
  });

  test('юноша 15 лет, 180 см: глубина не глубже взрослой', () => {
    const r = calc({ ageYears: 15, heightCm: 180, sex: 'male' });
    expect(r.depthOralCm).toBe(23);
    expect(r.depthNasalCm).toBe(26);
  });

  test('рост >143,3 см без возраста — как для 13 лет', () => {
    const r = calc({ heightCm: 150, sex: 'female' });
    expect(r.method).toBe('teen');
    expect(r.tubeIDmm).toBe(7.0);
    expect(r.depthOralCm).toBe(19.5);
    expect(has(r.warnings, /Возраст не указан/)).toBe(true);
  });

  test('без пола — расчёта нет', () => {
    expect(() => calc({ ageYears: 14 })).toThrow(/Выберите пол/);
  });
});

describe('ЭТТ: взрослые по полу', () => {
  test.each([
    ['female', 30, 7.0, 21, 26],
    ['male', 30, 8.0, 23, 28],
    ['male', 16, 8.0, 23, 28],
  ])('%s, %p лет', (sex, a, id, oral, nasal) => {
    const r = calc({ ageYears: a, sex });
    expect(r.method).toBe('adult');
    expect(r.tubeIDmm).toBe(id);
    expect(r.depthOralCm).toBe(oral);
    expect(r.depthNasalCm).toBe(nasal);
    expect(r.cuffedUsed).toBe(true);
    expect(has(r.notes, /размер дан для трубки с манжетой/)).toBe(true);
  });

  test('без пола — расчёта нет', () => {
    expect(() => calc({ ageYears: 30 })).toThrow(/Выберите пол/);
  });
});

describe('ЭТТ: проверка ввода', () => {
  test.each([
    [{ weightKg: 300 }, /похоже, введены граммы/],
    [{ weightKg: 0.2 }, /меньше 0,3 кг/],
    [{ heightCm: 20 }, /Рост должен быть от 30 до 230/],
    [{ ageYears: 1, ageMonths: 12 }, /месяцы — от 0 до 11/],
    [{ ageYears: 0, ageMonths: 6, weightKg: 25 }, /больше 20 кг у ребёнка до года/],
    [{ ageYears: 0, ageMonths: 6, heightCm: 110 }, /больше 100 см у ребёнка до года/],
    [{}, /Укажите рост/],
  ])('%p', (p, re) => {
    expect(() => calc(p)).toThrow(re);
  });
});

describe('ЭТТ: прямой расчёт по зоне ленты (BroselowPicker)', () => {
  test('ключи зон совпадают с patient/estimates', () => {
    expect(PATIENT_ZONE_KEYS).toEqual(PATIENT_ZONES.map((z) => z.key));
  });

  test('зона даёт тот же размер, что рост внутри зоны', () => {
    const mid = {
      pink: 62,
      red: 70,
      purple: 80,
      yellow: 90,
      white: 100,
      blue: 115,
      orange: 125,
      green: 140,
    };
    for (const [key, h] of Object.entries(mid)) {
      for (const cuffed of [false, true]) {
        const z = calculateIntubationTubeByZone({ zoneKey: key, cuffed });
        const byH = calc({ heightCm: h, cuffed });
        expect(z.method).toBe('broselowZone');
        expect(z.tubeIDmm).toBe(byH.tubeIDmm);
        expect(z.depthOralCm).toBe(byH.depthOralCm);
        expect(z.depthNasalCm).toBe(byH.depthNasalCm);
        expect(z.cuffedUsed).toBe(byH.cuffedUsed);
      }
    }
  });

  test('серая зона без подзоны — расчёт не выдаётся', () => {
    expect(() => calculateIntubationTubeByZone({ zoneKey: 'grey' })).toThrow(/выберите подзону/);
  });

  test('серая зона: подзоны 3 / 4 / 5 кг', () => {
    expect(GREY_SUBZONES.map((s) => s.value)).toEqual(['grey3', 'grey4', 'grey5']);
    const g3 = calculateIntubationTubeByZone({
      zoneKey: 'grey',
      greySubzone: 'grey3',
      cuffed: true,
    });
    expect(g3.tubeIDmm).toBe(3.5);
    expect(g3.cuffedUsed).toBe(false);
    expect(g3.depthOralCm).toBe(8.5);
    const g4 = calculateIntubationTubeByZone({
      zoneKey: 'grey',
      greySubzone: 'grey4',
      cuffed: true,
    });
    expect(g4.tubeIDmm).toBe(3.0);
    expect(g4.depthOralCm).toBe(9.0);
    expect(
      calculateIntubationTubeByZone({ zoneKey: 'grey', greySubzone: 'grey5' }).depthOralCm,
    ).toBe(10.5);
  });

  test('сверка с возрастом: расхождение больше 0,5 мм — предупреждение', () => {
    const r = calculateIntubationTubeByZone({ zoneKey: 'purple', ageYears: 8, ageMonths: 0 });
    expect(r.tubeIDmm).toBe(4.0);
    expect(has(r.warnings, /расхождение с зоной ленты/)).toBe(true);
    expect(
      calculateIntubationTubeByZone({ zoneKey: 'yellow', ageYears: 2, ageMonths: 0 }).warnings,
    ).toEqual([]);
  });

  test('возраст ≥13 лет при выбранной зоне — предупреждение', () => {
    const r = calculateIntubationTubeByZone({ zoneKey: 'green', ageYears: 14, ageMonths: 0 });
    expect(has(r.warnings, /≥13 лет/)).toBe(true);
  });

  test('масса середины зоны не участвует', () => {
    const r = calculateIntubationTubeByZone({ zoneKey: 'white' });
    expect(has(r.ignored, /масса/)).toBe(true);
  });

  test('неизвестная зона — ошибка', () => {
    expect(() => calculateIntubationTubeByZone({ zoneKey: 'black' })).toThrow(/Выберите зону/);
    expect(() => calculateIntubationTubeByZone({})).toThrow(/Выберите зону/);
  });

  // n9: сверка выбранной зоны с возрастом до 1 года (как ветка 5 и ошибка «рост >100 см до года»).
  test('до 1 года: зоны синяя/оранжевая/зелёная — отказ', () => {
    for (const zoneKey of ['blue', 'orange', 'green']) {
      for (const ageMonths of [0, 6, 11]) {
        expect(() => calculateIntubationTubeByZone({ zoneKey, ageYears: 0, ageMonths })).toThrow(
          /не бывает у ребёнка до года/,
        );
      }
    }
  });

  test('новорождённый: зона на 2 и больше выше серой — отказ, розовая — предупреждение', () => {
    for (const zoneKey of ['red', 'purple', 'yellow', 'white']) {
      expect(() => calculateIntubationTubeByZone({ zoneKey, ageYears: 0, ageMonths: 0 })).toThrow(
        /не соответствует возрасту новорождённого/,
      );
    }
    const pink = calculateIntubationTubeByZone({ zoneKey: 'pink', ageYears: 0, ageMonths: 0 });
    expect(pink.tubeIDmm).toBe(3.5);
    expect(has(pink.warnings, /ожидается серая зона/)).toBe(true);
    const grey = calculateIntubationTubeByZone({
      zoneKey: 'grey',
      greySubzone: 'grey3',
      ageYears: 0,
      ageMonths: 0,
    });
    expect(grey.warnings).toEqual([]);
    expect(grey.depthOralCm).toBe(8.5);
  });

  test('6 мес: белая и фиолетовая зоны — предупреждение и размер по возрасту (розовая)', () => {
    for (const zoneKey of ['white', 'yellow', 'purple']) {
      const r = calculateIntubationTubeByZone({ zoneKey, ageYears: 0, ageMonths: 6 });
      expect(r.method).toBe('infantAge');
      expect(r.broselowZoneKey).toBe('pink');
      expect(r.tubeIDmm).toBe(3.5);
      expect(r.depthOralCm).toBe(10.5);
      expect(has(r.warnings, /слишком велика для возраста 6 мес/)).toBe(true);
      expect(has(r.ignored, /не соответствует возрасту/)).toBe(true);
      // Совпадает с основным расчётом для массы, слишком большой для возраста.
      const byW = calc({ ageYears: 0, ageMonths: 6, weightKg: 16.5 });
      expect(r.tubeIDmm).toBe(byW.tubeIDmm);
      expect(r.depthOralCm).toBe(byW.depthOralCm);
    }
    const cuffed = calculateIntubationTubeByZone({
      zoneKey: 'purple',
      ageYears: 0,
      ageMonths: 6,
      cuffed: true,
    });
    expect(cuffed.tubeIDmm).toBe(3.0);
  });

  test('до 1 года: зона в пределах ±1 от ожидаемой — без предупреждений', () => {
    const r = calculateIntubationTubeByZone({ zoneKey: 'red', ageYears: 0, ageMonths: 6 });
    expect(r.method).toBe('broselowZone');
    expect(r.warnings).toEqual([]);
    expect(has(r.used, /возраст 6 мес/)).toBe(true);
    expect(
      calculateIntubationTubeByZone({ zoneKey: 'purple', ageYears: 0, ageMonths: 10 }).warnings,
    ).toEqual([]);
  });

  test('11 мес и серая зона — предупреждение, расчёт по выбранной зоне', () => {
    const r = calculateIntubationTubeByZone({
      zoneKey: 'grey',
      greySubzone: 'grey5',
      ageYears: 0,
      ageMonths: 11,
    });
    expect(r.method).toBe('broselowZone');
    expect(r.depthOralCm).toBe(10.5);
    expect(has(r.warnings, /меньше ожидаемой для возраста 11 мес/)).toBe(true);
  });

  test('patientZoneKeyOf', () => {
    expect(patientZoneKeyOf('grey4')).toBe('grey');
    expect(patientZoneKeyOf('blue')).toBe('blue');
    expect(patientZoneKeyOf(undefined)).toBeNull();
  });
});
