import {
  ru,
  getInputType,
  unitFromLabel,
  labelBase,
  getFieldRule,
  validateField,
  resolveAge,
  validateAll,
  ageWeightWarning,
  expectedWeightApls,
  fmtValue,
  resultKeys,
  limitStatus,
  buildItems,
  itemLevel,
  itemSpoken,
  spokenBadge,
  resultLevel,
  inputsSummary,
  nowText,
  computeResult,
  isReferenceOnly,
  buildCopyText,
  resultSpoken,
  searchFormulas,
  highlightTerms,
  highlightParts,
  synonymsOf,
  asChoiceInput,
  choiceValue,
} from '../engine';
import { routeInput, choiceInput } from '../routes';
import formulas from '../formulas';

const NOON = new Date(2026, 0, 1, 9, 5);

describe('поля ввода', () => {
  it('ru ставит запятую', () => {
    expect(ru(0.3)).toBe('0,3');
    expect(ru(20)).toBe('20');
  });

  it('единица и подпись из скобок', () => {
    expect(unitFromLabel('Вес (кг)')).toBe('кг');
    expect(unitFromLabel('Скорость по основанию (мкг/кг/мин)')).toBe('мкг/кг/мин');
    expect(unitFromLabel('Возраст: полных лет (лет)')).toBe('лет');
    expect(unitFromLabel('Без единицы')).toBeNull();
    expect(labelBase('Вес (кг)')).toBe('Вес');
  });

  it('тип поля: выбор, текст, число', () => {
    expect(getInputType('route', routeInput(['iv', 'im'], 'iv'))).toBe('choice');
    expect(getInputType('sex', 'Пол')).toBe('choice');
    expect(getInputType('route', 'Путь введения')).toBe('text');
    expect(getInputType('weight', 'Вес (кг)')).toBe('numeric');
    // «рост» внутри «скорость» не делает поле текстовым
    expect(getInputType('rate', 'Скорость (мкг/кг/мин)')).toBe('numeric');
  });

  it('правило поля: по ключу, по единице и своё из inputLimits', () => {
    expect(getFieldRule('weight', 'Вес (кг)')).toMatchObject({ min: 0.3, max: 250, unit: 'кг' });
    expect(getFieldRule('mass', 'Масса (кг)')).toMatchObject({ min: 0.3, max: 250 });
    expect(
      getFieldRule('weight', 'Вес (кг)', { inputLimits: { weight: { max: 40, warnMax: 30 } } }),
    ).toMatchObject({
      min: 0.3,
      max: 40,
      warnMax: 30,
    });
  });

  it('проверка числа: пусто, мусор, ноль, отрицательное, диапазон, мягкое предупреждение', () => {
    expect(validateField('weight', 'Вес (кг)', '', {})).toEqual({
      error: 'Вес (кг): введите число',
    });
    expect(validateField('weight', 'Вес (кг)', 'abc', {}).error).toMatch(/введите число/);
    expect(validateField('weight', 'Вес (кг)', '-5', {}).error).toMatch(/отрицательным/);
    expect(validateField('weight', 'Вес (кг)', '0', {}).error).toMatch(/больше 0/);
    expect(validateField('weight', 'Вес (кг)', '0,2', {}).error).toBe(
      'Вес (кг): допустимо 0,3–250 кг — проверьте ввод',
    );
    expect(validateField('weight', 'Вес (кг)', '300', {}).error).toMatch(/0,3–250 кг/);
    expect(validateField('weight', 'Вес (кг)', '20,5', {})).toEqual({
      value: 20.5,
      warning: undefined,
    });
    expect(validateField('ageYears', 'Возраст (лет)', '0', {})).toEqual({
      value: 0,
      warning: undefined,
    });
    expect(validateField('rate', 'Скорость (мкг/кг/мин)', '60', {}).error).toMatch(/не более 50/);
    const w = validateField('weight', 'Вес (кг)', '35', {
      inputLimits: { weight: { warnMax: 30 } },
    });
    expect(w.value).toBe(35);
    expect(w.warning).toBe('Вес 35 кг — выше обычного предела 30 кг. Проверьте ввод.');
  });

  it('текстовое поле старого формата', () => {
    expect(validateField('route', 'Путь введения', ' в/м ', {})).toEqual({ value: 'в/м' });
    expect(validateField('route', 'Путь введения', '', {}).error).toMatch(/заполните/);
  });

  it('поле-выбор: значение по умолчанию, допустимое значение, чужое значение', () => {
    const route = routeInput(['iv', 'io', 'im'], 'io');
    expect(choiceValue(route, undefined)).toBe('io');
    expect(validateField('route', route, undefined, {})).toEqual({ value: 'io' });
    expect(validateField('route', route, 'im', {})).toEqual({ value: 'im' });
    expect(validateField('route', route, 'po', {}).error).toBe(
      'Путь введения: выберите вариант из списка',
    );
  });

  it('пол без вариантов в записи — стандартные варианты, без значения — ошибка', () => {
    const sex = asChoiceInput('sex', 'Пол');
    expect(sex.choices.map((c) => c.value)).toEqual(['male', 'female']);
    expect(validateField('sex', 'Пол', null, {}).error).toBe('Пол: выберите вариант');
    expect(validateField('sex', 'Пол', 'female', {})).toEqual({ value: 'female' });
  });
});

describe('возраст из пары полей пациента', () => {
  const both = { ageYears: 'лет', ageMonths: 'мес' };
  const yearsOnly = { ageYears: 'Возраст (лет)' };
  const monthsOnly = { ageMonths: 'Возраст (мес)' };

  it('оба поля записи — полных лет и месяцев сверх лет', () => {
    expect(resolveAge(both, { years: '5', months: '3' })).toEqual({
      values: { ageYears: 5, ageMonths: 3 },
      ageMonths: 63,
      warnings: [],
    });
    // «18 мес» при пустых годах — 1 год 6 мес
    expect(resolveAge(both, { years: '', months: '18' })).toEqual({
      values: { ageYears: 1, ageMonths: 6 },
      ageMonths: 18,
      warnings: [],
    });
  });

  it('только годы — полные годы, до 1 года дробью по месяцам', () => {
    expect(resolveAge(yearsOnly, { years: '12', months: '6' }).values).toEqual({ ageYears: 12 });
    expect(resolveAge(yearsOnly, { years: '0', months: '6' }).values).toEqual({ ageYears: 0.5 });
    expect(resolveAge(yearsOnly, { years: '0', months: '0' }).values).toEqual({ ageYears: 0 });
    // 1 мес — не новорождённый для порога записи «age < 1/12»
    expect(resolveAge(yearsOnly, { years: '0', months: '1' }).values.ageYears < 1 / 12).toBe(false);
  });

  it('только месяцы — полный возраст в месяцах', () => {
    expect(resolveAge(monthsOnly, { years: '1', months: '6' }).values).toEqual({ ageMonths: 18 });
  });

  it('ошибки ввода возраста', () => {
    expect(resolveAge(both, { years: '', months: '' }).error).toMatch(/заполните/);
    expect(resolveAge(both, { years: 'x', months: '' }).error).toMatch(/лет: введите число/);
    expect(resolveAge(both, { years: '3', months: '14' }).error).toMatch(/от 0 до 11/);
    expect(resolveAge(both, { years: '130', months: '' }).error).toMatch(/0–120 лет/);
    expect(resolveAge(both, { years: '-1', months: '' }).error).toMatch(/отрицательным/);
  });

  it('validateAll берёт возраст из пары полей и не проверяет поля записи по отдельности', () => {
    const f = { inputs: { weight: 'Вес (кг)', ...yearsOnly } };
    const r = validateAll(f, { weight: '20' }, { age: { years: '5', months: '3' } });
    expect(r.ok).toBe(true);
    expect(r.clean).toEqual({ weight: 20, ageYears: 5 });
    expect(r.ageMonths).toBe(63);
    const bad = validateAll(f, { weight: '20' }, { age: { years: '', months: '' } });
    expect(bad.ok).toBe(false);
    expect(bad.errors).toEqual(['Возраст: заполните поле (лет и/или мес)']);
  });

  it('inputLimits записи для ageYears/ageMonths действуют и при возрасте из пациента', () => {
    const f = {
      inputs: { weight: 'Вес (кг)', ageYears: 'Возраст (лет)' },
      inputLimits: { ageYears: { max: 17, warnMax: 15 } },
    };
    const over = validateAll(f, { weight: '20' }, { age: { years: '30', months: '' } });
    expect(over.ok).toBe(false);
    expect(over.errors).toEqual(['Возраст (лет): допустимо 0–17 лет — проверьте ввод']);
    const warn = validateAll(f, { weight: '50' }, { age: { years: '16', months: '' } });
    expect(warn.ok).toBe(true);
    expect(warn.notes).toContain('Возраст 16 лет — выше обычного предела 15 лет. Проверьте ввод.');
    const ok = validateAll(f, { weight: '20' }, { age: { years: '5', months: '' } });
    expect(ok.ok).toBe(true);
    expect(ok.notes).toEqual([]);
    // ageMonths: предел записи по полному возрасту в месяцах
    const fm = {
      inputs: { ageMonths: 'Возраст (мес)' },
      inputLimits: { ageMonths: { max: 24, warnMin: 1 } },
    };
    expect(resolveAge(fm.inputs, { years: '3', months: '' }, fm).error).toMatch(
      /Возраст \(мес\): допустимо 0–24 мес/,
    );
    expect(resolveAge(fm.inputs, { years: '', months: '0' }, fm).warnings[0]).toMatch(
      /ниже обычного предела 1 мес/,
    );
    // без формулы — только общие пределы
    expect(resolveAge(fm.inputs, { years: '3', months: '' }).values).toEqual({ ageMonths: 36 });
  });

  it('без пары полей — прежний режим: возраст из rawInputs', () => {
    const r = validateAll(
      { inputs: { weight: 'Вес (кг)', ageYears: 'Возраст (лет)' } },
      { weight: '20', ageYears: '5' },
    );
    expect(r.clean).toEqual({ weight: 20, ageYears: 5 });
    expect(r.ageMonths).toBe(60);
  });
});

describe('вес ↔ возраст', () => {
  it('APLS', () => {
    expect(expectedWeightApls(6)).toBe(7);
    expect(expectedWeightApls(60)).toBe(18);
    expect(expectedWeightApls(96)).toBe(31);
    expect(expectedWeightApls(13 * 12)).toBeUndefined();
  });

  it('ошибка в разряде — предупреждение, норма — нет', () => {
    const map = { weight: 'Вес (кг)', ageYears: 'Возраст (лет)' };
    expect(ageWeightWarning({ weight: 18 }, map, 60)).toBeNull();
    expect(ageWeightWarning({ weight: 70 }, map, 60)).toMatch(
      /необычен для возраста 5 лет.*около 18 кг/,
    );
    expect(ageWeightWarning({ weight: 5 }, map, 60)).toMatch(/необычен/);
    // до 1 года нижний порог не применяется (недоношенные)
    expect(ageWeightWarning({ weight: 2 }, map, 3)).toBeNull();
  });
});

describe('форматирование', () => {
  it.each([
    [0.0025, 'мл', '0.0025 мл'],
    [0.015, 'мл', '0.015 мл'],
    [0.25, 'мл', '0.25 мл'],
    [2.345, 'мл', '2.3 мл'],
    [0.005, 'мг', '5.00 мкг (0.005 мг)'],
    [0.035, 'мг', '0.035 мг'],
    [2.5, 'мг', '2.50 мг'],
    [12.5, 'мг', '12.5 мг'],
    [150, 'мг', '150 мг'],
    [0.05, 'мкг', '0.05 мкг'],
    [0.005, 'мкг/мин', '0.005 мкг/мин'],
    [12.345, 'мл/ч', '12.3 мл/ч'],
    [1.5, 'г', '1.50 г'],
    [0.6, 'таб', '0.5 таб'],
    [0.1, 'таб', '0.1 таб (меньше 1/4)'],
    [0.4, 'кап', 'меньше 1 кап'],
    [3.6, 'кап', '4 кап'],
    [0.30000000000000004, 'мл/кг', '0.3 мл/кг'],
    [7, undefined, '7'],
  ])('fmtValue(%p, %p) → %p', (v, unit, out) => {
    expect(fmtValue(v, unit)).toBe(out);
  });

  it('ключи результатов по номеру', () => {
    expect(resultKeys({ result10: 1, result2: 2, result1: 3, other: 4 })).toEqual([
      'result1',
      'result2',
      'result10',
    ]);
  });

  it('статус относительно пределов', () => {
    expect(limitStatus(5, { max: 4 })).toBe('high');
    expect(limitStatus(4, { max: 4 })).toBe('atmax');
    expect(limitStatus(1, { min: 2 })).toBe('low');
    expect(limitStatus(3, { min: 2, max: 4 })).toBe('ok');
    expect(limitStatus(3, undefined)).toBe('ok');
  });
});

describe('строки результата', () => {
  const formula = {
    units: { result1: 'мг', result2: 'мл', result3: 'мг' },
    labels: { result1: 'Доза' },
    limits: { result1: { max: 1 } },
  };

  it('пределы, нулевая доза, примечание', () => {
    const items = buildItems(
      { result1: 2, result2: 0.5, result3: 0, result4: ' текст ' },
      formula,
      {},
    );
    expect(items[0]).toMatchObject({
      name: 'Доза',
      text: '2.00 мг',
      status: 'high',
      badge: '↑ выше макс. 1.00 мг',
    });
    expect(items[1]).toMatchObject({ name: 'Объём', text: '0.50 мл', status: 'ok', badge: null });
    expect(items[2]).toMatchObject({ status: 'zero', text: '—', value: null });
    expect(items[3]).toMatchObject({ name: 'Примечание', text: 'текст', status: 'info' });
  });

  it('пределы-функция; ошибка в функции не роняет расчёт', () => {
    const f1 = { units: { result1: 'мг' }, limits: (c) => ({ result1: { max: c.weight } }) };
    expect(buildItems({ result1: 10 }, f1, { weight: 10 })[0].status).toBe('atmax');
    const f2 = {
      units: { result1: 'мг' },
      limits: () => {
        throw new Error('x');
      },
    };
    expect(buildItems({ result1: 10 }, f2, {})[0].status).toBe('ok');
  });

  it('малый объём — напоминание о разведении, если формула сама не сказала', () => {
    const f = { units: { result1: 'мл' } };
    expect(buildItems({ result1: 0.03 }, f, {}).pop().text).toMatch(/меньше 0,05 мл/);
    expect(buildItems({ result1: 0.07 }, f, {}).pop().text).toMatch(/меньше 0,1 мл/);
    expect(buildItems({ result1: 0.07, result2: 'Развести 1:10' }, f, {})).toHaveLength(2);
  });

  it('уровни и озвучка', () => {
    expect(itemLevel('high')).toBe('danger');
    expect(itemLevel('zero')).toBe('danger');
    expect(itemLevel('atmax')).toBe('warning');
    expect(itemLevel('low')).toBe('warning');
    expect(itemLevel('info')).toBe('info');
    expect(itemLevel('ok')).toBeNull();
    expect(spokenBadge('↑ выше макс. 1.00 мг')).toBe('выше макс. 1.00 мг');
    expect(spokenBadge('= предел 1.00 мг')).toBe('на пределе 1.00 мг');
    expect(
      itemSpoken({ name: 'Доза', text: '2.00 мг', badge: '↑ выше макс. 1.00 мг', status: 'high' }),
    ).toBe('Доза, 2.00 мг, выше макс. 1.00 мг');
    expect(itemSpoken({ name: 'Доза', text: '—', badge: 'не определена', status: 'zero' })).toBe(
      'Доза, не определена',
    );
    expect(resultLevel([{ status: 'ok' }, { status: 'high' }]).level).toBe('danger');
    expect(resultLevel([{ status: 'atmax' }]).label).toMatch(/пределе/);
    expect(resultLevel([{ status: 'ok' }])).toEqual({ level: null, label: null });
  });
});

describe('computeResult', () => {
  const drug = {
    name: 'Тест',
    description: '1 мг/мл',
    inputs: {
      weight: 'Вес (кг)',
      ageYears: 'Возраст (лет)',
      route: routeInput(['iv', 'im'], 'iv'),
      indication: choiceInput('Показание', [
        { value: 'cpr', label: 'СЛР' },
        { value: 'anaphylaxis', label: 'Анафилаксия' },
      ]),
    },
    units: { result1: 'мг', result2: 'мл' },
    limits: { result1: { max: 1 } },
    warnings: ['Предупреждение записи'],
    formula: ({ weight, ageYears, route, indication }) => {
      if (ageYears < 1) return {};
      const perKg = route === 'iv' ? 0.01 : 0.02;
      const mg = Math.min(weight * perKg, indication === 'cpr' ? 1 : 0.5);
      return { result1: mg, result2: mg };
    },
  };

  it('в formula приходят строки выбора; путь и показание — в результате и в копии', () => {
    const r = computeResult(
      drug,
      { weight: '20', route: 'im', indication: 'anaphylaxis' },
      {
        age: { years: '5', months: '3' },
        weightNote: 'оценка',
        now: NOON,
      },
    );
    expect(r.success).toBe(true);
    expect(r.items[0]).toMatchObject({ text: '0.40 мг', status: 'ok' });
    expect(r.choices).toEqual([
      { key: 'route', label: 'Путь введения', value: 'im', valueLabel: 'в/м' },
      { key: 'indication', label: 'Показание', value: 'anaphylaxis', valueLabel: 'Анафилаксия' },
    ]);
    expect(r.inputsText).toBe('Вес — 20 кг (оценка) · Возраст — 5 лет 3 мес');
    expect(r.timestamp).toBe('09:05');
    const copy = buildCopyText(r);
    expect(copy).toContain('Путь введения: в/м');
    expect(copy).toContain('Показание: Анафилаксия');
    expect(copy).toContain('Данные: Вес — 20 кг (оценка) · Возраст — 5 лет 3 мес');
    expect(copy).toContain('Доза: 0.40 мг');
    expect(copy).toContain('Внимание: Предупреждение записи');
    expect(copy).toContain('Рассчитано: 09:05.');
    expect(resultSpoken(r)).toBe(
      'Результат расчёта. Путь введения в/м. Показание Анафилаксия. Доза, 0.40 мг. Объём, 0.40 мл',
    );
  });

  it('значения выбора по умолчанию', () => {
    const r = computeResult(drug, { weight: '200' }, { age: { years: '30', months: '' } });
    expect(r.choices.map((c) => c.value)).toEqual(['iv', 'cpr']);
    // доза ограничена формулой до 1 мг = предел
    expect(r.items[0]).toMatchObject({ status: 'atmax', badge: '= предел 1.00 мг' });
    expect(resultLevel(r.items).level).toBe('warning');
  });

  it('ошибка ввода — список ошибок', () => {
    const r = computeResult(drug, { weight: '', route: 'po' }, { age: { years: '', months: '' } });
    expect(r).toMatchObject({ error: true, type: 'validation' });
    expect(r.errors).toEqual([
      'Возраст: заполните поле (лет и/или мес)',
      'Вес (кг): введите число',
      'Путь введения: выберите вариант из списка',
    ]);
    expect(resultSpoken(r)).toMatch(/^Проверьте введённые данные\./);
  });

  it('формула вернула {} — «расчёт не выполняется» с предупреждениями записи', () => {
    const r = computeResult(drug, { weight: '7' }, { age: { years: '0', months: '6' } });
    expect(r.info).toBe(true);
    expect(r.message).toMatch(/не выполняется/);
    expect(buildCopyText(r)).toContain('Для введённых данных расчёт не выполняется');
  });

  it('исключение в формуле — ошибка расчёта', () => {
    const r = computeResult(
      {
        name: 'x',
        inputs: {},
        formula: () => {
          throw new Error('boom');
        },
      },
      {},
    );
    expect(r).toEqual({
      error: true,
      type: 'calculation',
      message: 'Ошибка при выполнении расчёта: boom.',
    });
  });

  it('предупреждение «вес не по возрасту» попадает в notes', () => {
    const r = computeResult(drug, { weight: '70' }, { age: { years: '5', months: '' } });
    expect(r.notes[0]).toMatch(/необычен/);
  });

  it('nowText', () => {
    expect(nowText(new Date(2026, 0, 1, 23, 59))).toBe('23:59');
  });

  it('inputsSummary без пары возраста — прежний вид', () => {
    expect(
      inputsSummary(
        { inputs: { weight: 'Вес (кг)', ageYears: 'Возраст (лет)' } },
        { weight: 20.5, ageYears: 5 },
      ),
    ).toBe('Вес — 20,5 кг · Возраст — 5 лет');
  });
});

describe('справочные записи', () => {
  it('нет полей и пустой ответ — справочная', () => {
    expect(isReferenceOnly({ inputs: {}, formula: () => ({}) })).toBe(true);
    expect(isReferenceOnly({ inputs: {}, formula: () => ({ result1: 1 }) })).toBe(false);
    expect(isReferenceOnly({ inputs: { weight: 'Вес (кг)' }, formula: () => ({}) })).toBe(false);
    expect(isReferenceOnly({ inputs: {} })).toBe(true);
    expect(isReferenceOnly(null)).toBe(false);
  });
});

describe('поиск', () => {
  const list = [
    { name: 'Норэпинефрин', description: 'Раствор 2 мг/мл' },
    { name: 'Эпинефрин (адреналин) 0.1%', description: 'Раствор 1 мг/мл' },
    { name: 'Магния сульфат 25%', description: 'Раствор 250 мг/мл' },
    { name: 'Метамизол натрия', description: 'Анальгетик' },
    { name: 'Диазепам', description: 'Раствор 5 мг/мл', synonyms: ['Сибазон-собственный'] },
  ];
  const names = (term) => searchFormulas(list, term).map((r) => r.formula.name);

  it('пустой запрос — весь список по порядку', () => {
    expect(names('')).toEqual(list.map((f) => f.name));
  });

  it('эпинефрин не цепляет норэпинефрин первым; синоним норадреналин', () => {
    expect(names('эпинефрин')[0]).toBe('Эпинефрин (адреналин) 0.1%');
    const r = searchFormulas(list, 'норадреналин');
    expect(r[0]).toEqual({ formula: list[0], synonym: 'норадреналин' });
  });

  it('торговое название и падеж', () => {
    expect(searchFormulas(list, 'анальгин')[0]).toMatchObject({
      formula: list[3],
      synonym: 'анальгин',
    });
    expect(names('магнезия')[0]).toBe('Магния сульфат 25%');
    expect(names('магний')[0]).toBe('Магния сульфат 25%');
    expect(names('ё')).toEqual([]);
  });

  it('свои синонимы записи', () => {
    expect(synonymsOf(list[4])).toEqual(
      expect.arrayContaining(['сибазон-собственный', 'реланиум']),
    );
  });

  it('короткий запрос — только по началу слов', () => {
    expect(names('ам')).toEqual([]);
    expect(names('ма')).toEqual(['Магния сульфат 25%']);
  });

  it('подсветка', () => {
    expect(highlightTerms('Магния сульфат')).toEqual(['магния сульфат', 'сульфат', 'магния']);
    expect(highlightParts('Магния сульфат 25%', 'сульф')).toEqual([
      { text: 'Магния ', hit: false },
      { text: 'сульф', hit: true },
      { text: 'ат 25%', hit: false },
    ]);
    expect(highlightParts('Текст', '')).toEqual([{ text: 'Текст', hit: false }]);
    expect(highlightParts('Ёлка', 'елка')).toEqual([{ text: 'Ёлка', hit: true }]);
  });

  it('поиск по реальному списку находит адреналин', () => {
    const r = searchFormulas(formulas, 'адреналин');
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].formula.name.toLowerCase()).toMatch(/эпинефрин|адреналин/);
  });
});

describe('реальные записи считаются через движок', () => {
  const callable = formulas.filter((f) => !isReferenceOnly(f));

  it('каждая запись с расчётом считается без исключений для типичного ребёнка 20 кг, 5 лет', () => {
    expect(callable.length).toBeGreaterThan(30);
    callable.forEach((f) => {
      const raw = {};
      Object.keys(f.inputs || {}).forEach((k) => {
        if (k === 'weight') raw[k] = '20';
        if (k === 'rate') raw[k] = '0.1';
        if (k === 'drugMg') raw[k] = '4';
        if (k === 'volume') raw[k] = '50';
        if (k === 'heightCm') raw[k] = '110';
        if (k === 'sex') raw[k] = 'male';
      });
      const r = computeResult(f, raw, { age: { years: '5', months: '0' } });
      // ошибка ввода возможна только для полей, которых тест не знает; исключение в формуле — нет
      if (r.type === 'calculation') throw new Error(`${f.name}: ${r.message}`);
      if (!r.error) expect(r.success || r.info).toBe(true);
    });
  });
});
