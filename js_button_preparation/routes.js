// routes.js — пути введения и поля-выбора для записей калькулятора препаратов.
// Единственный источник кодов и подписей путей: записи не пишут «в/в» строкой.
//
// Поле-выбор в inputs записи:
//   inputs: {
//     weight: 'Вес (кг)',                                  // строковое поле — как раньше
//     route: routeInput(['iv', 'io', 'im'], 'iv'),         // { label, choices, default }
//     indication: choiceInput('Показание', [{ value: 'cpr', label: 'СЛР' }, …], 'cpr'),
//   }
// Движок рисует выбор кнопками (ChoiceChips), в formula приходит строка value ('iv').
// Ошибка в коде пути или значении по умолчанию — исключение при загрузке модуля
// (ловится тестами группы до сборки).

export const ROUTES = Object.freeze({
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

export const ROUTE_CODES = Object.freeze(Object.keys(ROUTES));

export const isRouteCode = (code) => Object.prototype.hasOwnProperty.call(ROUTES, code);

// Подпись пути по коду; неизвестный код возвращается как есть
export const routeLabel = (code) => (isRouteCode(code) ? ROUTES[code] : String(code ?? ''));

// Общее поле выбора одного значения. choices: [{ value, label }], defaultValue — одно из value
// (по умолчанию первое).
export function choiceInput(label, choices, defaultValue) {
  if (!label || typeof label !== 'string') throw new Error('choiceInput: нужна подпись поля');
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new Error(`choiceInput «${label}»: нужен хотя бы один вариант`);
  }
  const seen = new Set();
  const normalized = choices.map((c) => {
    if (!c || typeof c.value !== 'string' || !c.value || typeof c.label !== 'string' || !c.label) {
      throw new Error(
        `choiceInput «${label}»: вариант должен быть { value: string, label: string }`,
      );
    }
    if (seen.has(c.value)) throw new Error(`choiceInput «${label}»: повтор значения «${c.value}»`);
    seen.add(c.value);
    return Object.freeze({ value: c.value, label: c.label });
  });
  const def = defaultValue === undefined ? normalized[0].value : defaultValue;
  if (!seen.has(def)) {
    throw new Error(`choiceInput «${label}»: значение по умолчанию «${def}» не входит в варианты`);
  }
  return Object.freeze({ label, choices: Object.freeze(normalized), default: def });
}

// Поле «Путь введения» из кодов ROUTES. Предлагайте только пути с утверждённой дозой.
export function routeInput(codes, defaultCode, label = 'Путь введения') {
  if (!Array.isArray(codes) || codes.length === 0) {
    throw new Error('routeInput: нужен хотя бы один путь введения');
  }
  for (const code of codes) {
    if (!isRouteCode(code)) {
      throw new Error(
        `routeInput: неизвестный путь «${code}», допустимы: ${ROUTE_CODES.join(', ')}`,
      );
    }
  }
  return choiceInput(
    label,
    codes.map((code) => ({ value: code, label: ROUTES[code] })),
    defaultCode,
  );
}

// Поле inputs — выбор (объект с choices), а не строковая подпись
export const isChoiceInput = (input) =>
  !!input && typeof input === 'object' && Array.isArray(input.choices);

// Подпись поля: строка как есть или label поля-выбора
export const inputLabel = (input) => (isChoiceInput(input) ? input.label : input);

// Подпись выбранного варианта для результата и копируемого текста
export const choiceLabel = (input, value) => {
  if (!isChoiceInput(input)) return value === undefined || value === null ? '' : String(value);
  const found = input.choices.find((c) => c.value === value);
  return found ? found.label : '';
};
