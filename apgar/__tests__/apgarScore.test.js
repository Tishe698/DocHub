import {
  APGAR_SIGNS,
  SIGN_KEYS,
  APGAR_BANDS,
  ALL_MINUTES,
  REPEAT_THRESHOLD,
  apgarTotal,
  completeTotal,
  interpretApgar,
  needsRepeat,
  needsTenMinute,
  resuscitationAfterFive,
  requiredMinutes,
  visibleMinutes,
  emptyAssessment,
  setSign,
  assessmentLine,
  breakdownLine,
  shortRecord,
  pointsWord,
  elapsedMs,
  formatElapsed,
  spokenElapsed,
  nextMark,
  crossedMarks,
  markState,
  summaryText,
} from '../apgarScore';

// Оценка с одинаковым баллом у всех признаков, затем правки
const uniform = (v, overrides = {}) => {
  const a = emptyAssessment();
  for (const k of SIGN_KEYS) a[k] = v;
  return { ...a, ...overrides };
};
// Оценка с заданной суммой 0–10: сначала по 2, остаток — нули/единицы
const withTotal = (total) => {
  const a = emptyAssessment();
  let left = total;
  for (const k of SIGN_KEYS) {
    const v = Math.min(2, left);
    a[k] = v;
    left -= v;
  }
  return a;
};

describe('признаки', () => {
  it('пять признаков, у каждого варианты 0, 1, 2 с подписями', () => {
    expect(SIGN_KEYS).toEqual(['heartRate', 'respiration', 'tone', 'reflex', 'color']);
    for (const s of APGAR_SIGNS) {
      expect(s.options.map((o) => o.score)).toEqual([0, 1, 2]);
      for (const o of s.options) expect(o.label.length).toBeGreaterThan(2);
    }
  });

  it('ЧСС: граница 100 в минуту', () => {
    const hr = APGAR_SIGNS.find((s) => s.key === 'heartRate');
    expect(hr.options[1].label).toMatch(/Менее 100/);
    expect(hr.options[2].label).toMatch(/100 в минуту и более/);
  });
});

describe('apgarTotal / completeTotal', () => {
  it('пустая оценка — неполная, сумма 0', () => {
    expect(apgarTotal(emptyAssessment())).toEqual({
      total: 0,
      filled: 0,
      complete: false,
      missing: SIGN_KEYS,
    });
    expect(completeTotal(emptyAssessment())).toBeNull();
    expect(completeTotal(undefined)).toBeNull();
  });

  it('частичная оценка — сумма отмеченных, полная — null', () => {
    const a = { ...emptyAssessment(), heartRate: 2, respiration: 1 };
    const t = apgarTotal(a);
    expect(t.total).toBe(3);
    expect(t.filled).toBe(2);
    expect(t.complete).toBe(false);
    expect(completeTotal(a)).toBeNull();
  });

  it('полная оценка: 0, 10 и смешанная', () => {
    expect(completeTotal(uniform(0))).toBe(0);
    expect(completeTotal(uniform(2))).toBe(10);
    expect(completeTotal(uniform(1, { heartRate: 2 }))).toBe(6);
  });

  it('недопустимые значения не считаются отмеченными', () => {
    const a = uniform(2, { color: 3 });
    expect(completeTotal(a)).toBeNull();
    expect(apgarTotal(uniform(2, { tone: '2' })).complete).toBe(false);
  });
});

describe('interpretApgar (МКБ-10 P21, МЗ РФ)', () => {
  it('8–10 — удовлетворительное, 4–7 — умеренная, 0–3 — тяжёлая асфиксия', () => {
    for (let t = 0; t <= 10; t += 1) {
      const band = interpretApgar(t);
      if (t >= 8) expect(band.key).toBe('satisfactory');
      else if (t >= 4) expect(band.key).toBe('moderate');
      else expect(band.key).toBe('severe');
    }
    expect(interpretApgar(8).label).toBe('Удовлетворительное состояние');
    expect(interpretApgar(7).label).toBe('Умеренная асфиксия');
    expect(interpretApgar(4).level).toBe('warning');
    expect(interpretApgar(3).label).toBe('Тяжёлая асфиксия');
    expect(interpretApgar(0).level).toBe('danger');
  });

  it('полосы покрывают 0–10 без пересечений', () => {
    const covered = [];
    for (const b of APGAR_BANDS) for (let t = b.min; t <= b.max; t += 1) covered.push(t);
    expect(covered.sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('вне 0–10 и не целое — null', () => {
    expect(interpretApgar(-1)).toBeNull();
    expect(interpretApgar(11)).toBeNull();
    expect(interpretApgar(5.5)).toBeNull();
    expect(interpretApgar(null)).toBeNull();
  });
});

describe('правило повторных оценок', () => {
  it('порог — 7 баллов на 5-й минуте', () => {
    expect(REPEAT_THRESHOLD).toBe(7);
  });

  it('без 5-й минуты или при неполной оценке — только 1 и 5', () => {
    expect(requiredMinutes({})).toEqual([1, 5]);
    expect(requiredMinutes({ 1: withTotal(2) })).toEqual([1, 5]);
    expect(requiredMinutes({ 5: { ...emptyAssessment(), heartRate: 0 } })).toEqual([1, 5]);
  });

  it('на 5-й минуте 7 и выше — повторы не нужны', () => {
    expect(needsRepeat({ 5: withTotal(7) })).toBe(false);
    expect(requiredMinutes({ 1: withTotal(3), 5: withTotal(7) })).toEqual([1, 5]);
  });

  it('на 5-й минуте 6 и ниже — 10, 15, 20-я минуты', () => {
    expect(needsRepeat({ 5: withTotal(6) })).toBe(true);
    expect(requiredMinutes({ 5: withTotal(6) })).toEqual(ALL_MINUTES);
    expect(requiredMinutes({ 5: withTotal(0) })).toEqual([1, 5, 10, 15, 20]);
  });

  it('низкая оценка только на 1-й минуте повторов не требует', () => {
    expect(needsRepeat({ 1: withTotal(2), 5: withTotal(8) })).toBe(false);
  });

  // МЗ РФ 2010, с. 8; МЗ РФ 2020, раздел 1: реанимация > 5 мин — третья оценка на 10-й минуте
  it('реанимация продолжается после 5-й минуты — 10-я минута при любой сумме', () => {
    const resus = (total) => ({ ...withTotal(total), duringResuscitation: true });
    for (const t of [7, 8, 10]) {
      const a = { 1: withTotal(4), 5: resus(t) };
      expect(needsRepeat(a)).toBe(false);
      expect(resuscitationAfterFive(a)).toBe(true);
      expect(needsTenMinute(a)).toBe(true);
      expect(requiredMinutes(a)).toEqual([1, 5, 10]);
      expect(visibleMinutes(a)).toEqual([1, 5, 10]);
    }
    // флаг отмечен до завершения оценки 5-й минуты — 10-я уже нужна
    expect(requiredMinutes({ 5: { ...emptyAssessment(), duringResuscitation: true } })).toEqual([
      1, 5, 10,
    ]);
    // при < 7 — объединение правил: 10, 15, 20
    expect(requiredMinutes({ 5: resus(6) })).toEqual([1, 5, 10, 15, 20]);
  });

  it('флаг реанимации на 1-й минуте или без флага — 10-я минута не нужна', () => {
    expect(
      requiredMinutes({ 1: { ...withTotal(3), duringResuscitation: true }, 5: withTotal(8) }),
    ).toEqual([1, 5]);
    expect(needsTenMinute({ 5: withTotal(7) })).toBe(false);
    expect(resuscitationAfterFive({})).toBe(false);
    expect(resuscitationAfterFive(null)).toBe(false);
  });

  it('видимые минуты: обязательные плюс уже заполненные', () => {
    expect(visibleMinutes({})).toEqual([1, 5]);
    expect(visibleMinutes({ 5: withTotal(8), 10: { ...emptyAssessment(), tone: 1 } })).toEqual([
      1, 5, 10,
    ]);
    expect(visibleMinutes({ 5: withTotal(5) })).toEqual([1, 5, 10, 15, 20]);
  });
});

describe('setSign', () => {
  it('не меняет исходный объект и создаёт оценку минуты', () => {
    const src = {};
    const next = setSign(src, 1, 'heartRate', 2);
    expect(src).toEqual({});
    expect(next[1].heartRate).toBe(2);
    expect(next[1].respiration).toBeNull();
    const again = setSign(next, 1, 'tone', 1);
    expect(next[1].tone).toBeNull();
    expect(again[1]).toMatchObject({ heartRate: 2, tone: 1 });
  });
});

describe('подписи и текст', () => {
  it('склонение «балл»', () => {
    expect(pointsWord(0)).toBe('баллов');
    expect(pointsWord(1)).toBe('балл');
    expect(pointsWord(2)).toBe('балла');
    expect(pointsWord(4)).toBe('балла');
    expect(pointsWord(5)).toBe('баллов');
    expect(pointsWord(10)).toBe('баллов');
  });

  it('строка оценки и разбивка', () => {
    const a = uniform(1, { heartRate: 2 });
    expect(assessmentLine(1, a)).toBe('1-я мин — 6 баллов (умеренная асфиксия)');
    expect(assessmentLine(5, { ...uniform(2), duringResuscitation: true })).toBe(
      '5-я мин — 10 баллов (удовлетворительное состояние, на фоне реанимационных мероприятий)',
    );
    expect(assessmentLine(1, emptyAssessment())).toBeNull();
    expect(breakdownLine(a)).toBe('ЧСС 2, дыхание 1, тонус 1, рефлексы 1, окраска 1');
    expect(breakdownLine({ heartRate: 1 })).toBe(
      'ЧСС 1, дыхание —, тонус —, рефлексы —, окраска —',
    );
  });

  it('короткая запись по полным оценкам', () => {
    expect(shortRecord({})).toBe('');
    expect(shortRecord({ 1: withTotal(6), 5: withTotal(8) })).toBe('6/8');
    expect(
      shortRecord({ 1: withTotal(3), 5: withTotal(5), 10: withTotal(7), 15: emptyAssessment() }),
    ).toBe('3/5/7');
  });

  it('текст для копирования', () => {
    const birthAt = new Date(2026, 0, 1, 14, 5, 0).getTime();
    const txt = summaryText(
      { 1: withTotal(3), 5: withTotal(6), 10: { ...emptyAssessment(), heartRate: 2 } },
      birthAt,
    );
    expect(txt).toContain('Время рождения: 14:05');
    expect(txt).toContain('1-я мин — 3 балла (тяжёлая асфиксия)');
    expect(txt).toContain('5-я мин — 6 баллов (умеренная асфиксия)');
    expect(txt).toContain('10-я мин — оценка не завершена');
    expect(txt).toContain('Итог: 3/6 баллов');
    expect(txt).toContain('повторные оценки на 10-й, 15-й, 20-й минуте');
    expect(summaryText({}, null)).toBe('Оценка по шкале Апгар');
    const resus = summaryText(
      { 1: withTotal(6), 5: { ...withTotal(8), duringResuscitation: true } },
      null,
    );
    expect(resus).toContain(
      '5-я мин — 8 баллов (удовлетворительное состояние, на фоне реанимационных мероприятий)',
    );
    expect(resus).toContain(
      'Реанимационные мероприятия продолжаются после 5-й минуты: оценка на 10-й минуте',
    );
    expect(resus).not.toContain('15-й');
  });
});

describe('секундомер', () => {
  it('прошедшее время и формат', () => {
    expect(elapsedMs(null, 1000)).toBeNull();
    expect(elapsedMs(1000, 500)).toBe(0);
    expect(elapsedMs(0, 205000)).toBe(205000);
    expect(formatElapsed(0)).toBe('00:00');
    expect(formatElapsed(205999)).toBe('03:25');
    expect(formatElapsed(75 * 60000 + 2000)).toBe('75:02');
    expect(formatElapsed(NaN)).toBe('00:00');
  });

  it('озвучиваемое время', () => {
    expect(spokenElapsed(0)).toBe('0 секунд');
    expect(spokenElapsed(1000)).toBe('1 секунда');
    expect(spokenElapsed(60000)).toBe('1 минута');
    expect(spokenElapsed(205000)).toBe('3 минуты 25 секунд');
    expect(spokenElapsed(11 * 60000 + 22000)).toBe('11 минут 22 секунды');
  });

  it('следующая отметка', () => {
    expect(nextMark(0)).toEqual({ minute: 1, remainingMs: 60000 });
    expect(nextMark(60000)).toEqual({ minute: 5, remainingMs: 240000 });
    expect(nextMark(299000, [1, 5])).toEqual({ minute: 5, remainingMs: 1000 });
    expect(nextMark(300000, [1, 5])).toBeNull();
    expect(nextMark(null)).toBeNull();
  });

  it('пройденные отметки между тиками (однократно)', () => {
    expect(crossedMarks(59000, 60000)).toEqual([1]);
    expect(crossedMarks(60000, 61000)).toEqual([]);
    // возврат из фона: пропущенные отметки приходят сразу
    expect(crossedMarks(30000, 650000)).toEqual([1, 5, 10]);
    expect(crossedMarks(null, 0)).toEqual([]);
    expect(crossedMarks(null, 60000, [1, 5])).toEqual([1]);
  });

  it('состояние отметки', () => {
    expect(markState(1, 30000, undefined)).toBe('upcoming');
    expect(markState(1, 60000, emptyAssessment())).toBe('due');
    expect(markState(1, 30000, withTotal(8))).toBe('done');
    expect(markState(5, null, undefined)).toBe('upcoming');
  });
});
