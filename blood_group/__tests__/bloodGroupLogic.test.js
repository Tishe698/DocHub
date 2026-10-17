import {
  NEG,
  POS,
  WEAK,
  NOT_SET,
  EMPTY_REACTIONS,
  REACTION_OPTIONS,
  REAGENTS,
  interpretBloodGroup,
  isDoubtful,
  pendingHints,
  reactionWord,
  resultLevel,
  resultSummary,
} from '../bloodGroupLogic';

const run = (r) => interpretBloodGroup({ ...EMPTY_REACTIONS, ...r });

describe('таблица AB0 (приказ №363, табл. 1)', () => {
  it.each([
    [NEG, NEG, NEG, '0 (I)'],
    [POS, NEG, POS, 'A (II)'],
    [NEG, POS, POS, 'B (III)'],
  ])('анти-A %p, анти-B %p, анти-AB %p → %s', (antiA, antiB, antiAB, abo) => {
    const r = run({ antiA, antiB, antiAB });
    expect(r.abo).toBe(abo);
    expect(r.warnings).toEqual([]);
    expect(r.aboReady).toBe(true);
  });

  it('AB (IV) — только при отрицательном контроле с NaCl', () => {
    const pending = run({ antiA: POS, antiB: POS, antiAB: POS });
    expect(pending.abo).toBe('AB (IV)?');
    expect(pending.warnings[0]).toMatch(/выполните контроль/);

    const confirmed = run({ antiA: POS, antiB: POS, antiAB: POS, control: NEG });
    expect(confirmed.abo).toBe('AB (IV)');
    expect(confirmed.warnings).toEqual([]);
  });

  it('без анти-AB группа определяется по анти-A/анти-B; для 0 (I) — подсказка про анти-AB', () => {
    expect(run({ antiA: POS, antiB: NEG }).abo).toBe('A (II)');
    const zero = run({ antiA: NEG, antiB: NEG });
    expect(zero.abo).toBe('0 (I)');
    expect(zero.infos[0]).toMatch(/анти-AB/);
    expect(run({ antiA: NEG, antiB: NEG, antiAB: NEG }).infos).toEqual([]);
  });

  it('только анти-A — группа ещё не определяется', () => {
    const r = run({ antiA: POS });
    expect(r.abo).toBe(NOT_SET);
    expect(r.aboReady).toBe(false);
    expect(r.anyResult).toBe(false);
  });
});

describe('неоднозначные реакции', () => {
  it('агглютинация в контроле — группа и резус не определяются', () => {
    for (const control of [POS, WEAK]) {
      const r = run({ antiA: POS, antiB: POS, antiAB: POS, antiD: POS, control });
      expect(r.abo).toBe('Не определена');
      expect(r.rh).toBe('Не определён');
      expect(r.anyResult).toBe(true);
      expect(r.warnings).toHaveLength(1);
      expect(r.warnings[0]).toMatch(/неспецифическая/);
    }
  });

  it('слабая реакция с анти-A/анти-B/анти-AB — слабый вариант, в лабораторию', () => {
    for (const r of [
      run({ antiA: WEAK, antiB: NEG }),
      run({ antiA: NEG, antiB: WEAK }),
      run({ antiA: NEG, antiB: NEG, antiAB: WEAK }),
    ]) {
      expect(r.abo).toBe('Не определена');
      expect(r.warnings[0]).toMatch(/слабый вариант/);
    }
  });

  it('анти-AB противоречит анти-A/анти-B', () => {
    const onlyAB = run({ antiA: NEG, antiB: NEG, antiAB: POS });
    expect(onlyAB.abo).toBe('Не определена');
    expect(onlyAB.warnings[0]).toMatch(/только с анти-AB/);

    const noAB = run({ antiA: POS, antiB: NEG, antiAB: NEG });
    expect(noAB.abo).toBe('Не определена');
    expect(noAB.warnings[0]).toMatch(/противоречат/);
  });
});

describe('резус (анти-D IgM)', () => {
  it('положительный и отрицательный', () => {
    expect(run({ antiD: POS }).rh).toBe('Rh(+) положительный');
    expect(run({ antiD: NEG }).rh).toBe('Rh(−) отрицательный');
    expect(run({ antiD: NEG }).anyResult).toBe(true);
  });

  it('при неподтверждённом AB (IV) положительный анти-D под вопросом', () => {
    expect(run({ antiA: POS, antiB: POS, antiAB: POS, antiD: POS }).rh).toBe('Rh(+)?');
    expect(run({ antiA: POS, antiB: POS, antiAB: POS, antiD: POS, control: NEG }).rh).toBe(
      'Rh(+) положительный',
    );
  });

  it('слабая реакция — вариант D, до уточнения как резус-отрицательный', () => {
    const r = run({ antiD: WEAK });
    expect(r.rh).toBe('Не определён');
    expect(r.warnings[0]).toMatch(/вариант D/);
    expect(r.warnings[0]).toMatch(/резус-отрицательным/);
  });

  it('не отмечен', () => {
    expect(run({}).rh).toBe(NOT_SET);
  });
});

describe('помощники экрана', () => {
  it('isDoubtful', () => {
    expect(isDoubtful('AB (IV)?')).toBe(true);
    expect(isDoubtful('Rh(+)?')).toBe(true);
    expect(isDoubtful('Не определена')).toBe(true);
    expect(isDoubtful('Не определён')).toBe(true);
    expect(isDoubtful('A (II)')).toBe(false);
    expect(isDoubtful(NOT_SET)).toBe(false);
    expect(isDoubtful(undefined)).toBe(false);
  });

  it('resultLevel: уровень всегда со словом', () => {
    expect(resultLevel(run({}))).toBeNull();
    expect(resultLevel(run({ antiA: POS, antiB: NEG, antiAB: POS, antiD: POS }))).toEqual({
      level: 'info',
      label: 'Первичный результат',
    });
    expect(resultLevel(run({ antiA: POS, antiB: POS })).level).toBe('warning');
    expect(resultLevel(run({ antiD: WEAK })).label).toBe('Требует уточнения');
  });

  it('pendingHints', () => {
    expect(pendingHints(run({}))[0]).toMatch(/анти-A и анти-B .* анти-D/);
    expect(pendingHints(run({ antiD: POS }))).toEqual(['Для группы AB0 отметьте анти-A и анти-B.']);
    expect(pendingHints(run({ antiA: NEG, antiB: NEG }))).toEqual([
      'Для резуса отметьте реакцию с анти-D.',
    ]);
    expect(pendingHints(run({ antiA: NEG, antiB: NEG, antiD: NEG }))).toEqual([]);
  });

  it('resultSummary — текст для диктора без «—» и «?»', () => {
    expect(resultSummary(run({}))).toBe('');
    const s = resultSummary(run({ antiA: POS, antiB: NEG, antiAB: POS, antiD: NEG }));
    expect(s).toBe(
      'Группа AB0: A (II). Резус: Rh(−) отрицательный. Нужно подтверждение в лаборатории.',
    );
    const pending = resultSummary(run({ antiA: POS, antiB: POS, antiD: POS }));
    expect(pending).toMatch(/AB \(IV\), под вопросом/);
    expect(pending).toMatch(/Rh\(\+\), под вопросом/);
    expect(pending).toMatch(/Есть предупреждение/);
    expect(pending).not.toMatch(/\?/);
    expect(resultSummary(run({ antiD: POS }))).toMatch(/Группа AB0: не отмечено/);
  });

  it('reactionWord и варианты ответа', () => {
    expect(reactionWord(NEG)).toBe('агглютинации нет');
    expect(reactionWord(POS)).toBe('агглютинация есть');
    expect(reactionWord(WEAK)).toMatch(/слабая/);
    expect(reactionWord(null)).toBe('не отмечено');
    expect(REACTION_OPTIONS.map((o) => o.value)).toEqual([NEG, WEAK, POS]);
    // у каждого варианта есть слово, а не только знак
    REACTION_OPTIONS.forEach((o) => expect(o.label).toMatch(/[а-я]/));
  });

  it('лунки: все ключи реакций описаны', () => {
    expect(REAGENTS.map((r) => r.key).sort()).toEqual(Object.keys(EMPTY_REACTIONS).sort());
  });
});
