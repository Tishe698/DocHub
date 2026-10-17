import {
  computeIntubation,
  depthRows,
  intubationAnnouncement,
  intubationMode,
  splitAge,
} from '../intubationFromPatient';
import { EMPTY_PATIENT, applyPatientPatch } from '../../../patient/PatientContext';

const P = (patch) => applyPatientPatch(EMPTY_PATIENT, patch);

describe('splitAge', () => {
  test('полный возраст в месяцах → годы и месяцы', () => {
    expect(splitAge(63)).toEqual({ ageYears: 5, ageMonths: 3 });
    expect(splitAge(0)).toEqual({ ageYears: 0, ageMonths: 0 });
    expect(splitAge(11)).toEqual({ ageYears: 0, ageMonths: 11 });
    expect(splitAge(null)).toEqual({ ageYears: undefined, ageMonths: undefined });
  });
});

describe('intubationMode', () => {
  test('рост важнее зоны, зона важнее массы', () => {
    expect(intubationMode(EMPTY_PATIENT)).toBe('empty');
    expect(intubationMode(P({ heightCm: 90 }))).toBe('height');
    expect(
      intubationMode(P({ broselowZone: 'white', weightKg: 16.5, weightSource: 'broselow' })),
    ).toBe('zone');
    expect(
      intubationMode(
        P({ broselowZone: 'white', weightKg: 16.5, weightSource: 'broselow', heightCm: 100 }),
      ),
    ).toBe('height');
    expect(intubationMode(P({ weightKg: 12 }))).toBe('data');
    expect(intubationMode(P({ ageMonths: 60 }))).toBe('data');
  });
});

describe('computeIntubation', () => {
  test('нет данных — нет результата и ошибки', () => {
    expect(computeIntubation(EMPTY_PATIENT)).toEqual({
      mode: 'empty',
      result: null,
      error: null,
      needsGreySubzone: false,
    });
  });

  test('возраст пациента 5 лет 0 мес → расчёт по возрасту', () => {
    const { result } = computeIntubation(P({ ageMonths: 60 }));
    expect(result.method).toBe('age');
    expect(result.tubeIDmm).toBe(5.5);
  });

  test('новорождённый (ageMonths 0) с массой', () => {
    const { result } = computeIntubation(P({ ageMonths: 0, weightKg: 1.5 }));
    expect(result.method).toBe('neonate');
    expect(result.tubeIDmm).toBe(3.0);
  });

  test('зона по ленте: размер по зоне, масса середины зоны не используется', () => {
    const { mode, result } = computeIntubation(
      P({ broselowZone: 'blue', weightKg: 21, weightSource: 'broselow', ageMonths: 72 }),
      { cuffed: true },
    );
    expect(mode).toBe('zone');
    expect(result.method).toBe('broselowZone');
    expect(result.tubeIDmm).toBe(5.0);
  });

  test('серая зона без подзоны — нужна подзона', () => {
    const out = computeIntubation(
      P({ broselowZone: 'grey', weightKg: 4, weightSource: 'broselow' }),
    );
    expect(out.needsGreySubzone).toBe(true);
    expect(out.result).toBeNull();
    const ok = computeIntubation(
      P({ broselowZone: 'grey', weightKg: 4, weightSource: 'broselow' }),
      {
        greySubzone: 'grey5',
      },
    );
    expect(ok.result.depthOralCm).toBe(10.5);
  });

  test('рост и выбранная зона расходятся — расчёт по росту с предупреждением', () => {
    const { result } = computeIntubation(
      P({ broselowZone: 'green', weightKg: 33, weightSource: 'broselow', heightCm: 90 }),
    );
    expect(result.method).toBe('broselowHeight');
    expect(result.tubeIDmm).toBe(4.5);
    expect(result.warnings[0]).toMatch(/зона ленты \(зелёная\) не совпадает с ростом/);
  });

  test('рост и выбранная зона совпадают — без предупреждения о зоне', () => {
    const { result } = computeIntubation(
      P({ broselowZone: 'yellow', weightKg: 13, weightSource: 'broselow', heightCm: 90 }),
    );
    expect(result.warnings.some((w) => /не совпадает с ростом/.test(w))).toBe(false);
  });

  // n10: оценочная масса (по возрасту или по ленте) в логику не идёт.
  test('новорождённый с массой-оценкой по возрасту — нужна измеренная масса', () => {
    const out = computeIntubation(P({ ageMonths: 0, weightKg: 4, weightSource: 'age' }), {
      cuffed: true,
    });
    expect(out.result).toBeNull();
    expect(out.error).toMatch(/Для новорождённого укажите массу/);
    expect(out.error).toMatch(/оценка по возрасту, для подбора трубки не используется/);
    // Введённая масса — расчёт по неонатальной таблице.
    expect(computeIntubation(P({ ageMonths: 0, weightKg: 1 })).result.depthOralCm).toBe(6.5);
  });

  test('младенец с массой-оценкой — расчёт по возрасту, оценка в «Не использовано»', () => {
    const { result } = computeIntubation(P({ ageMonths: 6, weightKg: 7, weightSource: 'age' }));
    expect(result.method).toBe('infantAge');
    expect(result.ignored.some((s) => /масса 7 кг — оценка по возрасту, не измерена/.test(s))).toBe(
      true,
    );
  });

  test('только оценочная масса без возраста и роста — нет данных', () => {
    expect(intubationMode(P({ weightKg: 16.5, weightSource: 'broselow' }))).toBe('empty');
  });

  test.each([
    [50, 8.5],
    [57, 10.5],
  ])(
    'серая зона и рост %p см (новорождённый) — расчёт по росту, %p см, без ложного предупреждения',
    (h, oral) => {
      for (const ageMonths of [0, null]) {
        const { result } = computeIntubation(
          P({
            broselowZone: 'grey',
            weightKg: 4,
            weightSource: 'broselow',
            heightCm: h,
            ageMonths,
          }),
        );
        expect(result.method).toBe('broselowHeight');
        expect(result.depthOralCm).toBe(oral);
        expect(result.warnings.some((w) => /не совпадает с ростом/.test(w))).toBe(false);
        expect(result.ignored.some((s) => /оценка по ленте Broselow/.test(s))).toBe(true);
      }
    },
  );

  // n11: совпадение зоны с ростом — и по таблице ленты 2017 (как подсказка BroselowPicker).
  test.each([
    [74.05, 'purple', 'red'],
    [59.1, 'pink', 'grey5'],
  ])(
    'рост %p см и зона %s на границе — без предупреждения, примечание о границе',
    (h, zone, calcKey) => {
      const { result } = computeIntubation(
        P({ broselowZone: zone, weightKg: 10.5, weightSource: 'broselow', heightCm: h }),
      );
      expect(result.broselowZoneKey).toBe(calcKey);
      expect(result.warnings.some((w) => /не совпадает с ростом/.test(w))).toBe(false);
      expect(result.notes[0]).toMatch(/на границе зон/);
    },
  );

  test('подросток: пол из пациента', () => {
    const { result } = computeIntubation(P({ ageMonths: 14 * 12, sex: 'female', heightCm: 160 }));
    expect(result.method).toBe('teen');
    expect(result.tubeIDmm).toBe(7.0);
  });

  test('ошибка логики → текст ошибки', () => {
    const out = computeIntubation(P({ ageMonths: 30 * 12 }));
    expect(out.result).toBeNull();
    expect(out.error).toMatch(/Выберите пол/);
  });
});

describe('depthRows и озвучка', () => {
  const { result } = computeIntubation(P({ heightCm: 90 }));

  test('строки глубины по пути', () => {
    expect(depthRows(result, 'both').map((r) => r.key)).toEqual(['oral', 'nasal']);
    expect(depthRows(result, 'oral').map((r) => r.key)).toEqual(['oral']);
    expect(depthRows(result, 'nasal').map((r) => r.key)).toEqual(['nasal']);
    expect(depthRows(null, 'both')).toEqual([]);
  });

  test('текст для диктора', () => {
    expect(intubationAnnouncement(result, 'oral')).toBe(
      'Трубка 4,5 миллиметра, без манжеты, глубина через рот 13 сантиметра',
    );
    const warned = computeIntubation(P({ heightCm: 90, weightKg: 30 })).result;
    expect(intubationAnnouncement(warned, 'nasal')).toMatch(
      /назальная глубина 16 сантиметра, есть предупреждение$/,
    );
    expect(intubationAnnouncement(null)).toBe('');
  });
});
