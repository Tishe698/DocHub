import {
  CHILD_SCALE_MAX_MONTHS,
  E_OPTIONS,
  M_OPTIONS_ADULT,
  M_OPTIONS_CHILD,
  P_OPTIONS,
  PUPILS_NONE,
  V_OPTIONS_ADULT,
  V_OPTIONS_CHILD,
  ageModeMismatch,
  computeGcs,
  consciousnessLevel,
  gcsSummary,
  modeForAge,
  optionsFor,
  pointsWord,
  severityLevel,
  tbiSeverity,
} from '../gcsScore';

// Подбор E/V/M под нужную сумму (взрослая шкала)
const sel = (e, v, m, extra = {}) => ({ eye: `E${e}`, verbal: `V${v}`, motor: `M${m}`, ...extra });

describe('варианты шкалы', () => {
  it('баллы компонентов: E 1–4, V 1–5, M 1–6 в обеих шкалах', () => {
    const scores = (list) =>
      list
        .filter((o) => !o.nt)
        .map((o) => o.score)
        .sort((a, b) => a - b);
    expect(scores(E_OPTIONS)).toEqual([1, 2, 3, 4]);
    expect(scores(V_OPTIONS_ADULT)).toEqual([1, 2, 3, 4, 5]);
    expect(scores(V_OPTIONS_CHILD)).toEqual([1, 2, 3, 4, 5]);
    expect(scores(M_OPTIONS_ADULT)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(scores(M_OPTIONS_CHILD)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('id вариантов уникальны внутри компонента', () => {
    for (const list of [
      E_OPTIONS,
      V_OPTIONS_ADULT,
      V_OPTIONS_CHILD,
      M_OPTIONS_ADULT,
      M_OPTIONS_CHILD,
      P_OPTIONS,
    ]) {
      const ids = list.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('у детей < 4 лет нет ШКГ-З и варианта «афазия, языковой барьер»', () => {
    const child = optionsFor('child');
    expect(child.P).toEqual([]);
    expect(child.V.map((o) => o.id)).not.toContain('VNT');
    expect(child.V).toBe(V_OPTIONS_CHILD);
    expect(child.M).toBe(M_OPTIONS_CHILD);
    const adult = optionsFor('adult');
    expect(adult.P).toBe(P_OPTIONS);
    expect(adult.V).toBe(V_OPTIONS_ADULT);
  });
});

describe('modeForAge — детская шкала до 4 лет', () => {
  it('граница 48 мес', () => {
    expect(CHILD_SCALE_MAX_MONTHS).toBe(48);
    expect(modeForAge(0)).toBe('child');
    expect(modeForAge(47)).toBe('child');
    expect(modeForAge(48)).toBe('adult');
    expect(modeForAge(600)).toBe('adult');
  });

  it('нет возраста — null', () => {
    expect(modeForAge(null)).toBeNull();
    expect(modeForAge(undefined)).toBeNull();
    expect(modeForAge(NaN)).toBeNull();
    expect(modeForAge(-1)).toBeNull();
  });
});

describe('ageModeMismatch', () => {
  it('совпадение или нет возраста — null', () => {
    expect(ageModeMismatch('child', 30)).toBeNull();
    expect(ageModeMismatch('adult', 48)).toBeNull();
    expect(ageModeMismatch('adult', null)).toBeNull();
  });

  it('взрослая шкала у ребёнка < 4 лет и детская у ребёнка ≥ 4 лет', () => {
    expect(ageModeMismatch('adult', 30)).toMatch(/2 года 6 мес.*занижает/);
    expect(ageModeMismatch('child', 60)).toMatch(/5 лет.*младше 4 лет/);
  });
});

describe('consciousnessLevel — все пороги (КР «ЧМТ у детей», 2025, прил. Г1)', () => {
  it.each([
    [15, 'Ясное сознание (15)'],
    [14, 'Умеренное оглушение (13–14)'],
    [13, 'Умеренное оглушение (13–14)'],
    [12, 'Глубокое оглушение (11–12)'],
    [11, 'Глубокое оглушение (11–12)'],
    [10, 'Сопор (9–10)'],
    [9, 'Сопор (9–10)'],
    [8, 'Умеренная кома (7–8)'],
    [7, 'Умеренная кома (7–8)'],
    [6, 'Глубокая кома (4–6)'],
    [4, 'Глубокая кома (4–6)'],
    [3, 'Терминальная кома (3)'],
  ])('%i → %s', (sum, text) => {
    expect(consciousnessLevel(sum)).toBe(text);
  });
});

describe('tbiSeverity и severityLevel — границы 8/9 и 12/13', () => {
  it.each([
    [15, /лёгкая/, 'success'],
    [14, /лёгкая/, 'info'],
    [13, /лёгкая/, 'info'],
    [12, /среднетяжёлая/, 'warning'],
    [9, /среднетяжёлая/, 'warning'],
    [8, /тяжёлая \(3–8\)/, 'danger'],
    [3, /тяжёлая \(3–8\)/, 'danger'],
  ])('%i', (sum, severity, level) => {
    expect(tbiSeverity(sum)).toMatch(severity);
    expect(severityLevel(sum)).toBe(level);
  });
});

describe('computeGcs', () => {
  it('максимум 15 и минимум 3', () => {
    const max = computeGcs({ mode: 'adult', ...sel(4, 5, 6) });
    expect(max).toMatchObject({ complete: true, scorable: true, sum: 15, notation: 'E4 V5 M6' });
    expect(max.level).toBe('Ясное сознание (15)');
    expect(max.severityLevel).toBe('success');
    const min = computeGcs({ mode: 'adult', ...sel(1, 1, 1) });
    expect(min).toMatchObject({ sum: 3, airwayAlert: true, severityLevel: 'danger' });
  });

  it('неполный ввод: суммы нет, в нотации прочерк, перечислены недостающие', () => {
    const empty = computeGcs();
    expect(empty).toMatchObject({
      complete: false,
      scorable: false,
      sum: null,
      notation: 'E– V– M–',
    });
    expect(empty.missing).toEqual(['E', 'V', 'M']);
    expect(empty.hint).toBe('Оценка неполная: выберите E, V, M');
    expect(empty.level).toBeNull();

    const partial = computeGcs({ eye: 'E3', motor: 'M5' });
    expect(partial).toMatchObject({
      complete: false,
      sum: null,
      notation: 'E3 V– M5',
      missing: ['V'],
    });
    expect(partial.hint).toBe('Оценка неполная: выберите V');
    expect(gcsSummary(partial)).toBe('');
  });

  it('NT: сумма не считается, в нотации C / T / НО (Teasdale 2014)', () => {
    const closed = computeGcs({ eye: 'EC', verbal: 'V5', motor: 'M6' });
    expect(closed).toMatchObject({
      complete: true,
      hasNT: true,
      scorable: false,
      sum: null,
      notation: 'EC V5 M6',
    });
    expect(closed.ntParts).toEqual(['E']);
    expect(closed.hint).toMatch(/Сумма не определяется/);
    expect(closed.level).toBeNull();
    expect(closed.airwayAlert).toBe(false);

    expect(computeGcs({ eye: 'E4', verbal: 'VT', motor: 'M6' }).notation).toBe('E4 VT M6');
    expect(computeGcs({ eye: 'E4', verbal: 'VNT', motor: 'M6' }).notation).toBe('E4 V-НО M6');
    const relaxed = computeGcs({ eye: 'E1', verbal: 'VT', motor: 'MNT' });
    expect(relaxed).toMatchObject({ sum: null, notation: 'E1 VT M-НО' });
    expect(relaxed.ntParts).toEqual(['V', 'M']);
    expect(gcsSummary(relaxed)).toBe('ШКГ: сумма не определяется, E1 VT M-НО');
  });

  it('NT и неполный ввод одновременно — сначала просим заполнить', () => {
    const r = computeGcs({ eye: 'EC', verbal: null, motor: 'M6' });
    expect(r).toMatchObject({ complete: false, hasNT: true, scorable: false });
    expect(r.hint).toMatch(/неполная/);
  });

  it('детская шкала: те же баллы, вариант VNT не принимается', () => {
    const r = computeGcs({ mode: 'child', ...sel(4, 5, 6) });
    expect(r.sum).toBe(15);
    const vnt = computeGcs({ mode: 'child', eye: 'E4', verbal: 'VNT', motor: 'M6' });
    expect(vnt).toMatchObject({ complete: false, missing: ['V'], sum: null });
    const tube = computeGcs({ mode: 'child', eye: 'E4', verbal: 'VT', motor: 'M6' });
    expect(tube).toMatchObject({ complete: true, scorable: false, notation: 'E4 VT M6' });
  });

  it('≤ 8 — предупреждение о защите дыхательных путей (граница 8/9)', () => {
    expect(computeGcs(sel(2, 2, 4)).airwayAlert).toBe(true); // 8
    expect(computeGcs(sel(2, 3, 4)).airwayAlert).toBe(false); // 9
  });

  it('M6 при сумме ≤ 10 — подсказка о местной причине (граница 10/11)', () => {
    expect(computeGcs(sel(1, 1, 6)).commandsWarning).toBe(true); // 8
    expect(computeGcs(sel(2, 2, 6)).commandsWarning).toBe(true); // 10
    expect(computeGcs(sel(2, 3, 6)).commandsWarning).toBe(false); // 11
    expect(computeGcs(sel(2, 2, 5)).commandsWarning).toBe(false); // 9 без M6
    expect(computeGcs({ eye: 'EC', verbal: 'V1', motor: 'M6' }).commandsWarning).toBe(false); // NT
  });

  it('ШКГ-З = ШКГ − зрачки, только у взрослой шкалы и при полной сумме', () => {
    expect(computeGcs(sel(4, 5, 6, { pupils: 'P0' })).gcsPupils).toBe(15);
    expect(computeGcs(sel(4, 5, 6, { pupils: 'P1' })).gcsPupils).toBe(14);
    expect(computeGcs(sel(1, 1, 1, { pupils: 'P2' })).gcsPupils).toBe(1);
    expect(computeGcs(sel(4, 5, 6, { pupils: PUPILS_NONE })).gcsPupils).toBeNull();
    expect(computeGcs(sel(4, 5, 6)).gcsPupils).toBeNull();
    expect(computeGcs({ eye: 'EC', verbal: 'V5', motor: 'M6', pupils: 'P1' }).gcsPupils).toBeNull();
    expect(computeGcs({ mode: 'child', ...sel(4, 5, 6, { pupils: 'P1' }) }).gcsPupils).toBeNull();
  });

  it('все суммы 3–15 достижимы и считаются как E + V + M', () => {
    for (let e = 1; e <= 4; e++) {
      for (let v = 1; v <= 5; v++) {
        for (let m = 1; m <= 6; m++) {
          expect(computeGcs(sel(e, v, m)).sum).toBe(e + v + m);
        }
      }
    }
  });
});

describe('gcsSummary и pointsWord', () => {
  it('итог для диктора', () => {
    expect(gcsSummary(computeGcs(sel(4, 4, 6, { pupils: 'P1' })))).toBe(
      'ШКГ 14 баллов, E4 V4 M6. Умеренное оглушение (13–14). Тяжесть при ЧМТ: лёгкая (13–15). ШКГ-З 13',
    );
    expect(gcsSummary(null)).toBe('');
  });

  it('склонение', () => {
    expect(pointsWord(1)).toBe('балл');
    expect(pointsWord(3)).toBe('балла');
    expect(pointsWord(5)).toBe('баллов');
    expect(pointsWord(11)).toBe('баллов');
    expect(pointsWord(14)).toBe('баллов');
    expect(pointsWord(0)).toBe('баллов');
  });
});
