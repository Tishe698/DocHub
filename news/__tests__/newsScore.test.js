import {
  scoreRespRate,
  scoreSpo2Scale1,
  scoreSpo2Scale2,
  scoreSpo2,
  scoreOxygen,
  scoreSbp,
  scoreHeartRate,
  scoreConsciousness,
  scoreTemperature,
  validateParam,
  riskFor,
  RISK,
  pointsWord,
  computeNews2,
  ageWarning,
  summaryText,
  PARAM_ORDER,
  ACVPU_OPTIONS,
} from '../newsScore';

// Таблица: [значение, ожидаемый балл] — границы по RCP NEWS2 2017, Chart 1
const table = (fn, rows) => rows.forEach(([v, p]) => expect([v, fn(v)]).toEqual([v, p]));

describe('ЧДД', () => {
  it('границы ≤8 / 9–11 / 12–20 / 21–24 / ≥25', () => {
    table(scoreRespRate, [
      [0, 3],
      [8, 3],
      [9, 1],
      [11, 1],
      [12, 0],
      [20, 0],
      [21, 2],
      [24, 2],
      [25, 3],
      [60, 3],
    ]);
  });
  it('дробный ввод округляется до целого', () => {
    expect(scoreRespRate(8.4)).toBe(3);
    expect(scoreRespRate(8.5)).toBe(1);
    expect(scoreRespRate(20.4)).toBe(0);
    expect(scoreRespRate(20.5)).toBe(2);
  });
  it('нет значения — null', () => {
    expect(scoreRespRate(null)).toBeNull();
    expect(scoreRespRate(undefined)).toBeNull();
    expect(scoreRespRate(NaN)).toBeNull();
  });
});

describe('SpO₂ шкала 1', () => {
  it('границы ≤91 / 92–93 / 94–95 / ≥96', () => {
    table(scoreSpo2Scale1, [
      [70, 3],
      [91, 3],
      [92, 2],
      [93, 2],
      [94, 1],
      [95, 1],
      [96, 0],
      [100, 0],
    ]);
  });
  it('кислород не влияет на балл SpO₂ шкалы 1', () => {
    expect(scoreSpo2(98, 1, true)).toBe(0);
    expect(scoreSpo2(98, 1, false)).toBe(0);
    expect(scoreSpo2(93, 1, null)).toBe(2);
  });
});

describe('SpO₂ шкала 2', () => {
  it('нижние границы ≤83 / 84–85 / 86–87 / 88–92 — независимо от кислорода', () => {
    [true, false, null].forEach((o2) => {
      expect(scoreSpo2Scale2(83, o2)).toBe(3);
      expect(scoreSpo2Scale2(84, o2)).toBe(2);
      expect(scoreSpo2Scale2(85, o2)).toBe(2);
      expect(scoreSpo2Scale2(86, o2)).toBe(1);
      expect(scoreSpo2Scale2(87, o2)).toBe(1);
      expect(scoreSpo2Scale2(88, o2)).toBe(0);
      expect(scoreSpo2Scale2(92, o2)).toBe(0);
    });
  });
  it('≥93 на воздухе — 0 баллов', () => {
    [93, 94, 95, 96, 97, 100].forEach((v) => expect(scoreSpo2Scale2(v, false)).toBe(0));
  });
  it('на кислороде 93–94 → 1, 95–96 → 2, ≥97 → 3', () => {
    table((v) => scoreSpo2Scale2(v, true), [
      [93, 1],
      [94, 1],
      [95, 2],
      [96, 2],
      [97, 3],
      [100, 3],
    ]);
  });
  it('≥93 без отметки о кислороде — балл не определён', () => {
    expect(scoreSpo2Scale2(93, null)).toBeNull();
    expect(scoreSpo2Scale2(99, undefined)).toBeNull();
  });
  it('выбор шкалы через scoreSpo2', () => {
    expect(scoreSpo2(97, 2, true)).toBe(3);
    expect(scoreSpo2(97, 1, true)).toBe(0);
  });
});

describe('Кислород / воздух', () => {
  it('кислород → 2, воздух → 0, не указано → null', () => {
    expect(scoreOxygen(true)).toBe(2);
    expect(scoreOxygen(false)).toBe(0);
    expect(scoreOxygen(null)).toBeNull();
  });
});

describe('Систолическое АД', () => {
  it('границы ≤90 / 91–100 / 101–110 / 111–219 / ≥220', () => {
    table(scoreSbp, [
      [50, 3],
      [90, 3],
      [91, 2],
      [100, 2],
      [101, 1],
      [110, 1],
      [111, 0],
      [219, 0],
      [220, 3],
      [260, 3],
    ]);
  });
});

describe('ЧСС', () => {
  it('границы ≤40 / 41–50 / 51–90 / 91–110 / 111–130 / ≥131', () => {
    table(scoreHeartRate, [
      [30, 3],
      [40, 3],
      [41, 1],
      [50, 1],
      [51, 0],
      [90, 0],
      [91, 1],
      [110, 1],
      [111, 2],
      [130, 2],
      [131, 3],
      [180, 3],
    ]);
  });
});

describe('Сознание ACVPU', () => {
  it('A → 0; C, V, P, U → 3', () => {
    expect(scoreConsciousness('A')).toBe(0);
    ['C', 'V', 'P', 'U'].forEach((l) => expect(scoreConsciousness(l)).toBe(3));
  });
  it('неизвестное значение — null', () => {
    expect(scoreConsciousness(null)).toBeNull();
    expect(scoreConsciousness('X')).toBeNull();
  });
  it('варианты выбора — все пять уровней', () => {
    expect(ACVPU_OPTIONS.map((o) => o.value)).toEqual(['A', 'C', 'V', 'P', 'U']);
  });
});

describe('Температура', () => {
  it('границы ≤35,0 / 35,1–36,0 / 36,1–38,0 / 38,1–39,0 / ≥39,1', () => {
    table(scoreTemperature, [
      [33, 3],
      [35.0, 3],
      [35.1, 1],
      [36.0, 1],
      [36.1, 0],
      [36.6, 0],
      [38.0, 0],
      [38.1, 1],
      [39.0, 1],
      [39.1, 2],
      [41, 2],
    ]);
  });
  it('округление до 0,1 °C', () => {
    expect(scoreTemperature(35.04)).toBe(3);
    expect(scoreTemperature(35.05)).toBe(1);
    expect(scoreTemperature(38.04)).toBe(0);
    expect(scoreTemperature(38.05)).toBe(1);
  });
});

describe('Проверка ввода', () => {
  it('пустое значение — без ошибки', () => {
    expect(validateParam('respRate', null)).toBeNull();
    expect(validateParam('respRate', undefined)).toBeNull();
  });
  it('нечисло и вне допустимого диапазона — ошибка', () => {
    expect(validateParam('heartRate', NaN)).toMatch(/число/);
    expect(validateParam('spo2', 101)).toMatch(/0–100/);
    expect(validateParam('temperature', 24.9)).toMatch(/25–45/);
    expect(validateParam('temperature', 45.1)).toMatch(/25–45/);
    expect(validateParam('sbp', 301)).toMatch(/0–300/);
    expect(validateParam('respRate', -1)).toMatch(/0–100/);
  });
  it('граничные допустимые значения — без ошибки', () => {
    expect(validateParam('spo2', 100)).toBeNull();
    expect(validateParam('temperature', 25)).toBeNull();
    expect(validateParam('temperature', 45)).toBeNull();
  });
});

describe('Уровень риска', () => {
  it('0 — низкий, рутинное наблюдение каждые 12 ч', () => {
    expect(riskFor(0, false)).toBe(RISK.none);
    expect(RISK.none.monitoring).toMatch(/12 ч/);
  });
  it('1–4 — низкий, каждые 4–6 ч', () => {
    [1, 4].forEach((t) => expect(riskFor(t, false)).toBe(RISK.low));
    expect(RISK.low.monitoring).toMatch(/4–6 ч/);
  });
  it('0–4 с параметром = 3 — низко-средний, каждый час', () => {
    [3, 4].forEach((t) => expect(riskFor(t, true)).toBe(RISK.lowMedium));
    expect(RISK.lowMedium.monitoring).toMatch(/1 раза в час/);
  });
  it('5–6 — средний (порог срочной реакции)', () => {
    [5, 6].forEach((t) => {
      expect(riskFor(t, false)).toBe(RISK.medium);
      expect(riskFor(t, true)).toBe(RISK.medium);
    });
    expect(RISK.medium.label).toMatch(/срочной/);
  });
  it('≥ 7 — высокий (порог экстренной реакции), постоянный мониторинг', () => {
    [7, 12, 20].forEach((t) => expect(riskFor(t, true)).toBe(RISK.high));
    expect(RISK.high.label).toMatch(/экстренной/);
    expect(RISK.high.monitoring).toMatch(/Постоянный/);
  });
  it('у каждого уровня есть текст, а не только цвет', () => {
    Object.values(RISK).forEach((r) => {
      expect(r.label).toMatch(/риск/i);
      expect(r.response.length).toBeGreaterThan(10);
      expect(['success', 'info', 'warning', 'danger']).toContain(r.level);
    });
  });
  it('без суммы — null', () => {
    expect(riskFor(null, false)).toBeNull();
  });
});

describe('pointsWord', () => {
  it('склонение', () => {
    expect(pointsWord(0)).toBe('баллов');
    expect(pointsWord(1)).toBe('балл');
    expect(pointsWord(2)).toBe('балла');
    expect(pointsWord(4)).toBe('балла');
    expect(pointsWord(5)).toBe('баллов');
    expect(pointsWord(11)).toBe('баллов');
    expect(pointsWord(12)).toBe('баллов');
    expect(pointsWord(14)).toBe('баллов');
    expect(pointsWord(20)).toBe('баллов');
    expect(pointsWord(21)).toBe('балл');
  });
});

const NORMAL = {
  respRate: 16,
  spo2: 98,
  spo2Scale: 1,
  onOxygen: false,
  sbp: 120,
  heartRate: 75,
  consciousness: 'A',
  temperature: 36.6,
};

describe('computeNews2', () => {
  it('норма — 0 баллов, низкий риск, все параметры оценены', () => {
    const r = computeNews2(NORMAL);
    expect(r.complete).toBe(true);
    expect(r.total).toBe(0);
    expect(r.anyThree).toBe(false);
    expect(r.risk).toBe(RISK.none);
    expect(r.params.map((p) => p.key)).toEqual(PARAM_ORDER);
    expect(r.missing).toEqual([]);
  });

  it('кислород добавляет 2 балла', () => {
    const r = computeNews2({ ...NORMAL, onOxygen: true });
    expect(r.points.oxygen).toBe(2);
    expect(r.total).toBe(2);
    expect(r.risk).toBe(RISK.low);
  });

  it('единственный параметр = 3 при сумме ≤ 4 — низко-средний', () => {
    const r = computeNews2({ ...NORMAL, consciousness: 'C' });
    expect(r.total).toBe(3);
    expect(r.anyThree).toBe(true);
    expect(r.threeParams).toEqual(['consciousness']);
    expect(r.risk).toBe(RISK.lowMedium);
  });

  it('сумма 5 — средний', () => {
    // ЧДД 22 → 2, ЧСС 115 → 2, Т 38,5 → 1
    const r = computeNews2({ ...NORMAL, respRate: 22, heartRate: 115, temperature: 38.5 });
    expect(r.total).toBe(5);
    expect(r.risk).toBe(RISK.medium);
  });

  it('сумма ≥ 7 — высокий (типичный сепсис)', () => {
    // ЧДД 26 → 3, SpO₂ 93 → 2, кислород → 2, САД 95 → 2, ЧСС 125 → 2, V → 3, Т 39,4 → 2
    const r = computeNews2({
      respRate: 26,
      spo2: 93,
      spo2Scale: 1,
      onOxygen: true,
      sbp: 95,
      heartRate: 125,
      consciousness: 'V',
      temperature: 39.4,
    });
    expect(r.total).toBe(16);
    expect(r.risk).toBe(RISK.high);
    expect(r.threeParams).toEqual(['respRate', 'consciousness']);
  });

  it('максимальная сумма — 20', () => {
    const r = computeNews2({
      respRate: 6,
      spo2: 80,
      spo2Scale: 1,
      onOxygen: true,
      sbp: 70,
      heartRate: 150,
      consciousness: 'U',
      temperature: 34,
    });
    expect(r.total).toBe(3 + 3 + 2 + 3 + 3 + 3 + 3);
    expect(r.total).toBe(20);
  });

  it('шкала 2: SpO₂ 90 % на кислороде — 0 баллов за SpO₂, 2 за кислород', () => {
    const r = computeNews2({ ...NORMAL, spo2: 90, spo2Scale: 2, onOxygen: true });
    expect(r.scale).toBe(2);
    expect(r.points.spo2).toBe(0);
    expect(r.points.oxygen).toBe(2);
    expect(r.total).toBe(2);
  });

  it('шкала 1 для того же пациента даёт 3 балла за SpO₂', () => {
    const r = computeNews2({ ...NORMAL, spo2: 90, spo2Scale: 1, onOxygen: true });
    expect(r.points.spo2).toBe(3);
    expect(r.total).toBe(5);
  });

  it('шкала 2: SpO₂ 98 % на кислороде — 3 балла (гипероксия опасна)', () => {
    const r = computeNews2({ ...NORMAL, spo2: 98, spo2Scale: 2, onOxygen: true });
    expect(r.points.spo2).toBe(3);
    expect(r.total).toBe(5);
    expect(r.risk).toBe(RISK.medium);
  });

  it('шкала по умолчанию — 1', () => {
    const r = computeNews2({ ...NORMAL, spo2Scale: undefined, spo2: 92 });
    expect(r.scale).toBe(1);
    expect(r.points.spo2).toBe(2);
  });

  it('неполный ввод: complete=false, risk=null, сумма — нижняя граница', () => {
    const r = computeNews2({ respRate: 30, heartRate: 140, consciousness: 'P' });
    expect(r.complete).toBe(false);
    expect(r.risk).toBeNull();
    expect(r.total).toBe(9);
    expect(r.minRisk).toBe(RISK.high);
    expect(r.scoredCount).toBe(3);
    expect(r.missing).toEqual(['spo2', 'oxygen', 'sbp', 'temperature']);
  });

  it('пустой ввод — нет баллов и нет риска', () => {
    const r = computeNews2({});
    expect(r.scoredCount).toBe(0);
    expect(r.total).toBe(0);
    expect(r.minRisk).toBeNull();
    expect(r.risk).toBeNull();
    expect(computeNews2().complete).toBe(false);
  });

  it('шкала 2 без отметки о кислороде при SpO₂ ≥ 93 — подсказка и неполная оценка', () => {
    const r = computeNews2({ ...NORMAL, spo2: 95, spo2Scale: 2, onOxygen: null });
    expect(r.points.spo2).toBeNull();
    expect(r.pendingReason).toMatch(/кислород/);
    expect(r.complete).toBe(false);
  });

  it('ошибка ввода: параметр не оценивается, итог не считается', () => {
    const r = computeNews2({ ...NORMAL, temperature: 366 });
    expect(r.errors.temperature).toBeTruthy();
    expect(r.points.temperature).toBeNull();
    expect(r.params.find((p) => p.key === 'temperature').error).toBeTruthy();
    expect(r.complete).toBe(false);
    expect(r.risk).toBeNull();
  });

  it('некорректный onOxygen трактуется как «не указано»', () => {
    const r = computeNews2({ ...NORMAL, onOxygen: 'yes' });
    expect(r.points.oxygen).toBeNull();
    expect(r.complete).toBe(false);
  });
});

describe('ageWarning', () => {
  it('до 16 лет — предупреждение', () => {
    expect(ageWarning(0)).toMatch(/16 лет/);
    expect(ageWarning(191)).toMatch(/PEWS/);
  });
  it('с 16 лет или возраст не указан — без предупреждения', () => {
    expect(ageWarning(192)).toBeNull();
    expect(ageWarning(600)).toBeNull();
    expect(ageWarning(null)).toBeNull();
  });
});

describe('summaryText', () => {
  it('полный итог', () => {
    const r = computeNews2({ ...NORMAL, consciousness: 'C' });
    const s = summaryText(r);
    expect(s).toMatch(/^NEWS2: 3 балла, Низко-средний риск/);
    expect(s).toMatch(/3 балла: Сознание \(ACVPU\)/);
    expect(s).toMatch(/не реже 1 раза в час/);
  });
  it('неполный итог — пустая строка', () => {
    expect(summaryText(computeNews2({ respRate: 20 }))).toBe('');
    expect(summaryText(null)).toBe('');
  });
});
