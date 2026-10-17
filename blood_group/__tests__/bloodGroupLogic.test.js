// Тесты таблиц учёта и итога (приказ МЗ РФ №363, табл. 1; №1134н, п. 6, 11)
import {
  AB0_REAGENTS,
  AB0_ROWS,
  CONTROL_NOTE,
  NEG,
  POS,
  RH_REAGENTS,
  RH_ROWS,
  bloodGroupResult,
  reactionWord,
  rowA11yLabel,
} from '../bloodGroupLogic';

const pattern = (row, reagents) => reagents.map((r) => row[r.key]).join('');

describe('таблица AB0 (цоликлоны анти-А, анти-В, анти-АВ)', () => {
  it('четыре группы с классическими реакциями', () => {
    const map = Object.fromEntries(AB0_ROWS.map((r) => [r.label, pattern(r, AB0_REAGENTS)]));
    expect(map).toEqual({
      '0(I)': `${NEG}${NEG}${NEG}`,
      'A(II)': `${POS}${NEG}${POS}`,
      'B(III)': `${NEG}${POS}${POS}`,
      'AB(IV)': `${POS}${POS}${POS}`,
    });
  });

  it('анти-АВ «+» ровно тогда, когда «+» с анти-А или анти-В', () => {
    AB0_ROWS.forEach((r) => {
      expect(r.antiAB === POS).toBe(r.antiA === POS || r.antiB === POS);
    });
  });

  it('сочетания реакций в строках не повторяются', () => {
    const patterns = AB0_ROWS.map((r) => pattern(r, AB0_REAGENTS));
    expect(new Set(patterns).size).toBe(patterns.length);
  });

  it('контроль с 0,9% NaCl нужен только для AB(IV)', () => {
    expect(AB0_ROWS.filter((r) => r.needsControl).map((r) => r.key)).toEqual(['AB']);
  });

  it('в таблицах только «+» и «−», без сомнительных реакций', () => {
    AB0_ROWS.forEach((r) => AB0_REAGENTS.forEach((g) => expect([POS, NEG]).toContain(r[g.key])));
    RH_ROWS.forEach((r) => RH_REAGENTS.forEach((g) => expect([POS, NEG]).toContain(r[g.key])));
  });
});

describe('таблица резуса (анти-D супер)', () => {
  it('агглютинация — Rh(+), нет — Rh(−)', () => {
    const pos = RH_ROWS.find((r) => r.antiD === POS);
    const neg = RH_ROWS.find((r) => r.antiD === NEG);
    expect(pos.label).toBe('Rh(+)');
    expect(pos.text).toBe('резус-положительная');
    expect(neg.label).toBe('Rh(−)');
    expect(neg.text).toBe('резус-отрицательная');
  });
});

describe('bloodGroupResult', () => {
  it('ничего не выбрано — null; неизвестный ключ — как не выбран', () => {
    expect(bloodGroupResult(null, null)).toBeNull();
    expect(bloodGroupResult('X', 'Y')).toBeNull();
  });

  it('группа и резус', () => {
    const r = bloodGroupResult('A', 'pos');
    expect(r.headline).toBe('A(II) Rh(+)');
    expect(r.text).toBe('Группа A(II), резус-положительная');
    expect(r.spokenValue).toBe('группа А, вторая, резус-положительная');
    expect(r.spoken).toBe(
      'Результат: группа А, вторая, резус-положительная. Результат первичный, нужно подтверждение в лаборатории',
    );
    expect(r.needsControl).toBe(false);
    expect(r.missing).toBeNull();
    expect(r.notes).toEqual([]);
  });

  it('каждая строка даёт свою группу', () => {
    AB0_ROWS.forEach((row) => {
      const r = bloodGroupResult(row.key, 'neg');
      expect(r.headline).toBe(`${row.label} Rh(−)`);
      expect(r.abo).toBe(row);
    });
  });

  it('только группа — подсказка выбрать резус', () => {
    const r = bloodGroupResult('O', null);
    expect(r.headline).toBe('0(I)');
    expect(r.text).toBe('Группа 0(I)');
    expect(r.missing).toBe('Выберите резус');
    expect(r.spoken).toContain('Выберите резус');
  });

  it('только резус — подсказка выбрать группу', () => {
    const r = bloodGroupResult(null, 'neg');
    expect(r.headline).toBe('Rh(−)');
    expect(r.text).toBe('Резус-отрицательная');
    expect(r.missing).toBe('Выберите строку в таблице группы');
  });

  it('AB(IV) — предупреждение о контроле с 0,9% NaCl, в том числе для диктора', () => {
    const r = bloodGroupResult('AB', 'pos');
    expect(r.notes).toEqual([CONTROL_NOTE]);
    expect(r.needsControl).toBe(true);
    // При агглютинации в контроле недостоверны и группа, и резус
    expect(CONTROL_NOTE).toMatch(/группу и резус не устанавливают/);
    expect(CONTROL_NOTE).toContain('0,9% NaCl');
    expect(r.spoken).toContain('нужен контроль с физраствором');
  });
});

describe('подписи для диктора', () => {
  it('реакция словами', () => {
    expect(reactionWord(POS)).toBe('агглютинация');
    expect(reactionWord(NEG)).toBe('нет агглютинации');
  });

  it('строка таблицы читается целиком, «В» — как «Бэ»', () => {
    const a = AB0_ROWS.find((r) => r.key === 'A');
    expect(rowA11yLabel(a, AB0_REAGENTS, 'Группа')).toBe(
      'Группа А, вторая: Анти-А — агглютинация, Анти-Бэ — нет агглютинации, Анти-А-Бэ — агглютинация',
    );
    expect(rowA11yLabel(RH_ROWS[0], RH_REAGENTS)).toBe(
      'резус-положительная: Анти-Дэ супер — агглютинация',
    );
  });
});
