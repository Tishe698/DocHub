import {
  WEIGHT_CHILD,
  WEIGHT_MAX,
  WEIGHT_MIN,
  computeDarbinyan,
  darbinyanFor,
  fmt,
} from '../darbinyanCalc';

describe('computeDarbinyan: МОД = масса / 10 + 1', () => {
  test('75 кг → 8,5 л/мин; маска +2–3 → 10,5–11,5', () => {
    expect(computeDarbinyan(75)).toEqual({ mv: 8.5, child: false, maskMin: 10.5, maskMax: 11.5 });
  });

  test('округление до 0,1 л/мин (не вниз до целого)', () => {
    expect(computeDarbinyan(73).mv).toBe(8.3);
    expect(computeDarbinyan(12.34).mv).toBe(2.2);
    expect(computeDarbinyan(12.36).mv).toBe(2.2);
    expect(computeDarbinyan(12.5).mv).toBe(2.3);
    // раньше Math.floor давал 1 л/мин вместо 1,9
    expect(computeDarbinyan(9).mv).toBe(1.9);
  });

  test('дети < 30 кг — с оговоркой, без поправки на утечку', () => {
    const r = computeDarbinyan(20);
    expect(r).toEqual({ mv: 3, child: true, maskMin: null, maskMax: null });
    expect(computeDarbinyan(WEIGHT_CHILD).child).toBe(false);
    expect(computeDarbinyan(29.9).child).toBe(true);
  });

  test('границы применимости 5–250 кг', () => {
    expect(computeDarbinyan(WEIGHT_MIN).mv).toBe(1.5);
    expect(computeDarbinyan(4.9).error).toMatch(/меньше 5 кг/);
    expect(computeDarbinyan(WEIGHT_MAX).mv).toBe(26);
    expect(computeDarbinyan(251).error).toMatch(/250 кг/);
    expect(computeDarbinyan(0).error).toBeDefined();
    expect(computeDarbinyan(undefined).error).toBeDefined();
    expect(computeDarbinyan(NaN).error).toBeDefined();
  });

  test('fmt — десятичная запятая', () => {
    expect(fmt(8.5)).toBe('8,5');
    expect(fmt(8)).toBe('8');
  });
});

describe('darbinyanFor: фактическая или должная масса', () => {
  test('по фактической массе', () => {
    const r = darbinyanFor({ weightKg: 75, basis: 'actual' });
    expect(r.massKg).toBe(75);
    expect(r.mv).toBe(8.5);
  });

  test('нет массы — без ошибки и без результата', () => {
    const r = darbinyanFor({ weightKg: null, basis: 'actual' });
    expect(r.massKg).toBeNull();
    expect(r.mv).toBeUndefined();
    expect(r.error).toBeNull();
  });

  test('должная масса: мужчина 175 см → 70,6 кг → МОД 8,1', () => {
    // 50 + 0,91 × (175 − 152,4) = 70,566
    const r = darbinyanFor({ weightKg: 120, heightCm: 175, sex: 'male', basis: 'pbw' });
    expect(r.massKg).toBe(70.6);
    expect(r.mv).toBe(8.1);
    expect(r.pbw).toEqual({ kg: 70.6, sex: 'male', sexAssumed: false });
  });

  test('должная масса: женщина 175 см → 66,1 кг → МОД 7,6', () => {
    const r = darbinyanFor({ heightCm: 175, sex: 'female', basis: 'pbw' });
    expect(r.massKg).toBe(66.1);
    expect(r.mv).toBe(7.6);
  });

  test('для должной массы нужен пол — без подстановки', () => {
    const r = darbinyanFor({ heightCm: 175, sex: null, basis: 'pbw' });
    expect(r.mv).toBeUndefined();
    expect(r.error).toMatch(/пол/);
  });

  test('для должной массы нужен рост 130–230 см', () => {
    expect(darbinyanFor({ sex: 'male', basis: 'pbw' }).error).toMatch(/рост/);
    expect(darbinyanFor({ heightCm: 120, sex: 'male', basis: 'pbw' }).error).toMatch(/рост/);
  });

  test('pbw считается и в режиме фактической массы (для подсказки)', () => {
    const r = darbinyanFor({ weightKg: 90, heightCm: 180, sex: 'male', basis: 'actual' });
    expect(r.mv).toBe(10);
    expect(r.pbw.kg).toBe(75.1);
  });
});
