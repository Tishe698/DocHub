import {
  ADULT_MONTHS,
  AGE_THRESHOLD_MONTHS,
  BASE_ITEMS,
  HR_OPTIONS,
  ageFlagFromPatient,
  childWarning,
  computeGeneva,
  emptyFlags,
  genevaSummary,
  getRisk,
  getTwoLevel,
  ptsWord,
} from '../genevaScore';

const allFlags = () => Object.fromEntries(BASE_ITEMS.map((i) => [i.id, true]));

describe('пункты шкалы (Le Gal 2006; ESC 2019, табл. 5)', () => {
  it('баллы пунктов', () => {
    const pts = Object.fromEntries(BASE_ITEMS.map((i) => [i.id, i.pts]));
    expect(pts).toEqual({
      age: 1,
      prev_vte: 3,
      surgery: 2,
      cancer: 2,
      unilateral_pain: 3,
      hemoptysis: 2,
      dvt_signs: 4,
    });
    expect(HR_OPTIONS.map((o) => [o.id, o.pts])).toEqual([
      ['hr0', 0],
      ['hr1', 3],
      ['hr2', 5],
    ]);
  });

  it('emptyFlags — все пункты выключены', () => {
    expect(Object.values(emptyFlags()).every((v) => v === false)).toBe(true);
    expect(Object.keys(emptyFlags())).toHaveLength(BASE_ITEMS.length);
  });
});

describe('computeGeneva', () => {
  it('без ЧСС итога нет, но предварительная сумма считается', () => {
    const r = computeGeneva({ flags: { prev_vte: true, hemoptysis: true } });
    expect(r).toMatchObject({ complete: false, sum: 5, risk: null, twoLevel: null, hrPts: null, discordant: false });
    expect(genevaSummary(r)).toBe('');
    expect(computeGeneva()).toMatchObject({ complete: false, sum: 0 });
  });

  it('неизвестный id ЧСС — как не выбрана', () => {
    expect(computeGeneva({ hr: 'hr9' }).complete).toBe(false);
  });

  it('только ЧСС < 75 — 0 баллов, низкая вероятность', () => {
    const r = computeGeneva({ flags: emptyFlags(), hr: 'hr0' });
    expect(r).toMatchObject({ complete: true, sum: 0, hrPts: 0 });
    expect(r.risk.key).toBe('low');
    expect(r.twoLevel.key).toBe('unlikely');
  });

  it('максимум 22 балла', () => {
    const r = computeGeneva({ flags: allFlags(), hr: 'hr2' });
    expect(r.sum).toBe(22);
    expect(r.risk.key).toBe('high');
  });

  it('ЧСС 75–94 (+3) и ≥ 95 (+5)', () => {
    expect(computeGeneva({ hr: 'hr1' }).sum).toBe(3);
    expect(computeGeneva({ hr: 'hr2' }).sum).toBe(5);
    expect(computeGeneva({ flags: { age: true }, hr: 'hr2' }).sum).toBe(6);
  });

  it('6–10 баллов — схемы расходятся (discordant), 5 и 11 — нет', () => {
    expect(computeGeneva({ flags: { age: true }, hr: 'hr2' }).discordant).toBe(true); // 6
    expect(computeGeneva({ flags: { dvt_signs: true, age: true }, hr: 'hr2' }).discordant).toBe(true); // 10
    expect(computeGeneva({ hr: 'hr2' }).discordant).toBe(false); // 5
    expect(computeGeneva({ flags: { dvt_signs: true, surgery: true }, hr: 'hr2' }).discordant).toBe(false); // 11
  });
});

describe('getRisk — все пороги трёхуровневой схемы (Le Gal 2006)', () => {
  it.each([
    [0, 'low', 'success', '≈8%'],
    [3, 'low', 'success', '≈8%'],
    [4, 'intermediate', 'warning', '≈28%'],
    [10, 'intermediate', 'warning', '≈28%'],
    [11, 'high', 'danger', '≈74%'],
    [22, 'high', 'danger', '≈74%'],
  ])('%i → %s', (sum, key, badge, prevalence) => {
    const r = getRisk(sum);
    expect(r.key).toBe(key);
    expect(r.badge).toBe(badge);
    expect(r.prevalence).toBe(prevalence);
    expect(r.level).toBeTruthy();
    expect(r.next).toBeTruthy();
  });

  it('при высокой вероятности Д-димер не используется', () => {
    expect(getRisk(11).next).toMatch(/Д-димер для исключения ТЭЛА не использовать/);
  });
});

describe('getTwoLevel — ESC 2019, граница 5/6', () => {
  it.each([
    [0, 'unlikely'],
    [5, 'unlikely'],
    [6, 'likely'],
    [22, 'likely'],
  ])('%i → %s', (sum, key) => {
    expect(getTwoLevel(sum).key).toBe(key);
  });
});

describe('возраст из пациента', () => {
  it('пункт «> 65 лет»: 65 лет 0 мес — нет, 65 лет 1 мес — да', () => {
    expect(AGE_THRESHOLD_MONTHS).toBe(780);
    expect(ageFlagFromPatient(780)).toBe(false);
    expect(ageFlagFromPatient(781)).toBe(true);
    expect(ageFlagFromPatient(840)).toBe(true);
    expect(ageFlagFromPatient(0)).toBe(false);
  });

  it('нет возраста — null', () => {
    expect(ageFlagFromPatient(null)).toBeNull();
    expect(ageFlagFromPatient(undefined)).toBeNull();
    expect(ageFlagFromPatient(NaN)).toBeNull();
  });

  it('предупреждение для детей (< 18 лет)', () => {
    expect(ADULT_MONTHS).toBe(216);
    expect(childWarning(215)).toMatch(/17 лет 11 мес.*не валидирована/);
    expect(childWarning(0)).toMatch(/новорождённый/);
    expect(childWarning(216)).toBeNull();
    expect(childWarning(null)).toBeNull();
  });
});

describe('genevaSummary и ptsWord', () => {
  it('итог для диктора — без значков ≈ и %', () => {
    expect(genevaSummary(computeGeneva({ flags: { prev_vte: true }, hr: 'hr1' }))).toBe(
      'Женевская шкала: 6 баллов. Вероятность ТЭЛА средняя, около 28 процентов. ТЭЛА вероятна (≥6)'
    );
  });

  it('склонение', () => {
    expect(ptsWord(1)).toBe('балл');
    expect(ptsWord(2)).toBe('балла');
    expect(ptsWord(5)).toBe('баллов');
    expect(ptsWord(12)).toBe('баллов');
    expect(ptsWord(21)).toBe('балл');
    expect(ptsWord(22)).toBe('балла');
  });
});
