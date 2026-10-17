import {
  MAX_SCORE,
  QUESTIONS,
  computeShoks,
  emptyAnswers,
  interpret,
  ptsWord,
  shoksSummary,
} from '../shoksScore';

// Ответы, у которых каждый пункт получает заданный балл (или максимум пункта, если он меньше)
const answersWith = (pick) =>
  Object.fromEntries(
    QUESTIONS.map((q) => {
      const opt = pick(q);
      return [q.key, opt ? opt.id : null];
    }),
  );
const allZero = () => answersWith((q) => q.options.find((o) => o.pts === 0));
const allMax = () => answersWith((q) => q.options.reduce((a, b) => (b.pts > a.pts ? b : a)));

describe('пункты ШОКС (КР «ХСН» 2024, прил. Г1)', () => {
  it('10 пунктов, максимум 20 баллов', () => {
    expect(QUESTIONS).toHaveLength(10);
    expect(MAX_SCORE).toBe(20);
  });

  it('максимальные баллы пунктов', () => {
    const max = Object.fromEntries(
      QUESTIONS.map((q) => [q.key, Math.max(...q.options.map((o) => o.pts))]),
    );
    expect(max).toEqual({
      dyspnea: 2,
      weight: 1,
      palp: 1,
      position: 3,
      jvp: 2,
      rales: 3,
      gallop: 1,
      liver: 2,
      edema: 3,
      sbp: 2,
    });
  });

  it('снижение веса — 0 баллов', () => {
    const w = QUESTIONS.find((q) => q.key === 'weight');
    expect(w.options.find((o) => /снизился/.test(o.label)).pts).toBe(0);
  });
});

describe('interpret — все пороги', () => {
  it.each([
    [0, 0, 'нет признаков СН', 'success'],
    [1, 1, 'I функциональный класс', 'success'],
    [3, 1, 'I функциональный класс', 'success'],
    [4, 2, 'II функциональный класс', 'warning'],
    [6, 2, 'II функциональный класс', 'warning'],
    [7, 3, 'III функциональный класс', 'warning'],
    [9, 3, 'III функциональный класс', 'warning'],
    [10, 4, 'IV функциональный класс', 'danger'],
    [19, 4, 'IV функциональный класс', 'danger'],
    [20, 4, 'IV ФК — терминальная ХСН', 'danger'],
  ])('%i → ФК %i', (sum, fc, cls, badge) => {
    expect(interpret(sum)).toMatchObject({ fc, cls, badge });
  });

  it('у максимума — пометка «максимум»', () => {
    expect(interpret(20).band).toBe('20 (максимум)');
  });
});

describe('computeShoks', () => {
  it('пустой ввод — нет итога', () => {
    const r = computeShoks(emptyAnswers());
    expect(r).toMatchObject({
      total: 0,
      answered: 0,
      count: 10,
      complete: false,
      interpretation: null,
    });
    expect(r.missing).toHaveLength(10);
    expect(shoksSummary(r)).toBe('');
    expect(computeShoks()).toMatchObject({ answered: 0, complete: false });
  });

  it('неполный ввод — предварительная сумма без класса и список пропусков', () => {
    const r = computeShoks({ ...emptyAnswers(), dyspnea: '2', edema: '3' });
    expect(r).toMatchObject({ total: 5, answered: 2, complete: false, interpretation: null });
    expect(r.missing).not.toContain('dyspnea');
    expect(r.missingTitles).toContain('Хрипы в лёгких');
    expect(r.missingTitles).toHaveLength(8);
  });

  it('неизвестный id — пункт не отвечен', () => {
    const r = computeShoks({ ...allZero(), sbp: '9' });
    expect(r.complete).toBe(false);
    expect(r.missing).toEqual(['sbp']);
  });

  it('все «нет» — 0, нет признаков СН', () => {
    const r = computeShoks(allZero());
    expect(r).toMatchObject({ total: 0, answered: 10, complete: true });
    expect(r.interpretation.fc).toBe(0);
    expect(shoksSummary(r)).toBe('ШОКС: 0 баллов. нет признаков СН');
  });

  it('все максимальные — 20, терминальная ХСН', () => {
    const r = computeShoks(allMax());
    expect(r.total).toBe(20);
    expect(r.interpretation.cls).toBe('IV ФК — терминальная ХСН');
  });

  it('типичный случай: 7 баллов — III ФК', () => {
    const r = computeShoks({
      ...allZero(),
      dyspnea: '1',
      position: '2',
      rales: '1',
      edema: '2',
      sbp: '1',
    });
    expect(r.total).toBe(7);
    expect(r.interpretation.fc).toBe(3);
    expect(shoksSummary(r)).toBe('ШОКС: 7 баллов. III функциональный класс');
  });
});

describe('ptsWord', () => {
  it('склонение', () => {
    expect(ptsWord(1)).toBe('балл');
    expect(ptsWord(4)).toBe('балла');
    expect(ptsWord(7)).toBe('баллов');
    expect(ptsWord(20)).toBe('баллов');
  });
});
