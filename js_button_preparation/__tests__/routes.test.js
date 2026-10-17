import {
  ROUTES,
  ROUTE_CODES,
  routeInput,
  choiceInput,
  routeLabel,
  isChoiceInput,
  inputLabel,
  choiceLabel,
} from '../routes';

describe('ROUTES', () => {
  it('содержит все пути из спецификации с русскими подписями', () => {
    expect(ROUTES).toEqual({
      iv: 'в/в',
      io: 'в/к (внутрикостно)',
      im: 'в/м',
      sc: 'п/к',
      po: 'внутрь',
      pr: 'ректально',
      in: 'интраназально',
      buccal: 'защёчно',
      sl: 'под язык',
      inh: 'ингаляционно (небулайзер)',
      mdi: 'ингаляционно (ДАИ)',
      et: 'эндотрахеально',
      local: 'местно (инфильтрация, блокада)',
    });
    expect(ROUTE_CODES).toHaveLength(13);
  });

  it('routeLabel возвращает подпись, неизвестный код — как есть', () => {
    expect(routeLabel('io')).toBe('в/к (внутрикостно)');
    expect(routeLabel('xx')).toBe('xx');
    expect(routeLabel(undefined)).toBe('');
  });
});

describe('routeInput', () => {
  it('строит поле выбора в формате движка', () => {
    expect(routeInput(['iv', 'io', 'im'], 'io')).toEqual({
      label: 'Путь введения',
      choices: [
        { value: 'iv', label: 'в/в' },
        { value: 'io', label: 'в/к (внутрикостно)' },
        { value: 'im', label: 'в/м' },
      ],
      default: 'io',
    });
  });

  it('по умолчанию — первый путь; подпись можно переопределить', () => {
    const input = routeInput(['po', 'pr'], undefined, 'Способ');
    expect(input.default).toBe('po');
    expect(input.label).toBe('Способ');
  });

  it('отклоняет неизвестный путь, пустой список и чужое значение по умолчанию', () => {
    expect(() => routeInput(['iv', 'ivv'], 'iv')).toThrow(/неизвестный путь/);
    expect(() => routeInput([], 'iv')).toThrow();
    expect(() => routeInput(['iv', 'im'], 'po')).toThrow(/по умолчанию/);
  });

  it('результат неизменяем', () => {
    const input = routeInput(['iv'], 'iv');
    expect(Object.isFrozen(input)).toBe(true);
    expect(Object.isFrozen(input.choices)).toBe(true);
  });
});

describe('choiceInput', () => {
  const indication = choiceInput(
    'Показание',
    [
      { value: 'cpr', label: 'СЛР' },
      { value: 'anaphylaxis', label: 'Анафилаксия' },
    ],
    'cpr',
  );

  it('строит поле с вариантами', () => {
    expect(indication.label).toBe('Показание');
    expect(indication.choices.map((c) => c.value)).toEqual(['cpr', 'anaphylaxis']);
    expect(indication.default).toBe('cpr');
  });

  it('отклоняет повтор значения и некорректный вариант', () => {
    expect(() =>
      choiceInput('X', [
        { value: 'a', label: 'A' },
        { value: 'a', label: 'B' },
      ]),
    ).toThrow(/повтор/);
    expect(() => choiceInput('X', [{ value: 'a' }])).toThrow();
    expect(() => choiceInput('X', [])).toThrow();
  });

  it('помощники движка различают строковые поля и поля-выбор', () => {
    expect(isChoiceInput(indication)).toBe(true);
    expect(isChoiceInput('Вес (кг)')).toBe(false);
    expect(inputLabel(indication)).toBe('Показание');
    expect(inputLabel('Вес (кг)')).toBe('Вес (кг)');
    expect(choiceLabel(indication, 'anaphylaxis')).toBe('Анафилаксия');
    expect(choiceLabel(indication, 'nope')).toBe('');
  });
});
