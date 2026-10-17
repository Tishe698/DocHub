// bloodGroupLogic.js — первичное определение группы крови AB0 и резуса цоликлонами на плоскости
// по классической таблице учёта: на экране выбирают строку, где капли выглядят так же, как на
// планшете, и получают группу и резус. Чистые функции без React
// (тесты: __tests__/bloodGroupLogic.test.js).
//
// Источники:
//  - Приказ МЗ РФ от 20.10.2020 №1134н, п. 6 (первичное определение AB0 и резуса),
//    п. 11 (подтверждение в лаборатории), п. 19 (контрольная проверка перед трансфузией).
//    Действует до 01.01.2027 (п. 2) — после замены приказа (сообщается о №730н от 17.08.2026)
//    ссылки пересмотреть.
//  - Приказ МЗ РФ от 25.11.2002 №363 «Инструкция по применению компонентов крови», табл. 1
//    (оценка реакций с цоликлонами анти-А, анти-В, анти-АВ; учёт через 3 мин; при агглютинации
//    с анти-А и анти-В — контроль с 0,9% NaCl, AB(IV) только при его отрицательном результате),
//    раздел «Определение резус-принадлежности» (цоликлон анти-D супер на плоскости).
//    Методика совпадает с инструкциями производителей цоликлонов.

// Реакция в лунке: «+» — агглютинация, «−» — агглютинации нет
export const POS = '+';
export const NEG = '−';

// Цоликлоны таблицы AB0. tone — цвет подписи, как на флаконах и в учебной таблице
// (анти-А — красный, анти-В — синий); spoken — как подпись читает диктор
// (кириллическая «В» иначе звучит как «вэ», а «АВ» — как одно слово).
export const AB0_REAGENTS = [
  { key: 'antiA', label: 'Анти-А', spoken: 'Анти-А', tone: 'danger' },
  { key: 'antiB', label: 'Анти-В', spoken: 'Анти-Бэ', tone: 'primary' },
  { key: 'antiAB', label: 'Анти-АВ', spoken: 'Анти-А-Бэ', tone: 'success' },
];

export const RH_REAGENTS = [{ key: 'antiD', label: 'Анти-D супер', spoken: 'Анти-Дэ супер' }];

// Таблица учёта AB0 (приказ №363, табл. 1): реакции → «кровь принадлежит к группе»
export const AB0_ROWS = [
  {
    key: 'O',
    label: '0(I)',
    spoken: 'ноль, первая',
    tone: 'text',
    antiA: NEG,
    antiB: NEG,
    antiAB: NEG,
  },
  {
    key: 'A',
    label: 'A(II)',
    spoken: 'А, вторая',
    tone: 'danger',
    antiA: POS,
    antiB: NEG,
    antiAB: POS,
  },
  {
    key: 'B',
    label: 'B(III)',
    spoken: 'Бэ, третья',
    tone: 'primary',
    antiA: NEG,
    antiB: POS,
    antiAB: POS,
  },
  {
    key: 'AB',
    label: 'AB(IV)',
    spoken: 'А-Бэ, четвёртая',
    tone: 'success',
    antiA: POS,
    antiB: POS,
    antiAB: POS,
    // AB(IV) устанавливают только при отсутствии агглютинации в контроле с 0,9% NaCl
    needsControl: true,
  },
];

// Резус-принадлежность: цоликлон анти-D супер на плоскости, учёт через 3 мин
export const RH_ROWS = [
  {
    key: 'pos',
    label: 'Rh(+)',
    text: 'резус-положительная',
    spoken: 'резус-положительная',
    tone: 'text',
    antiD: POS,
  },
  {
    key: 'neg',
    label: 'Rh(−)',
    text: 'резус-отрицательная',
    spoken: 'резус-отрицательная',
    tone: 'text',
    antiD: NEG,
  },
];

// Агглютинация в контроле — неспецифическая (аутоагглютинация, холодовые антитела): тогда
// недостоверны и группа, и резус (приказ №363, 2002)
export const CONTROL_NOTE =
  'AB(IV) ставят, только если в контроле (капля крови + капля 0,9% NaCl) агглютинации нет. ' +
  'Если в контроле есть агглютинация — она неспецифическая: группу и резус не устанавливают, ' +
  'кровь направляют в лабораторию.';

export const LAB_NOTE = 'Результат первичный: нужно подтверждение в лаборатории.';
// То же для диктора: итог озвучивается без карточки, первичность нужно назвать и голосом
const LAB_SPOKEN = 'Результат первичный, нужно подтверждение в лаборатории';

const byKey = (rows, key) => rows.find((r) => r.key === key) || null;

// Слово реакции для диктора
export const reactionWord = (value) => (value === POS ? 'агглютинация' : 'нет агглютинации');

// Подпись строки таблицы для диктора: «Группа А, вторая: Анти-А — агглютинация, …»
export function rowA11yLabel(row, reagents, prefix = '') {
  const cells = reagents.map((r) => `${r.spoken} — ${reactionWord(row[r.key])}`).join(', ');
  return `${prefix ? `${prefix} ` : ''}${row.spoken}: ${cells}`;
}

// Итог по выбранным строкам. null — ничего не выбрано.
//   headline — крупно («A(II) Rh(+)»), text — словами, spokenValue — то же для диктора,
//   spoken — озвучка итога целиком, needsControl — выбрана AB(IV) (нужен контроль с 0,9% NaCl),
//   notes — предупреждения, missing — что ещё выбрать.
export function bloodGroupResult(aboKey, rhKey) {
  const abo = byKey(AB0_ROWS, aboKey);
  const rh = byKey(RH_ROWS, rhKey);
  if (!abo && !rh) return null;

  const headline = [abo && abo.label, rh && rh.label].filter(Boolean).join(' ');
  const textParts = [];
  const spokenParts = [];
  if (abo) {
    textParts.push(`группа ${abo.label}`);
    spokenParts.push(`группа ${abo.spoken}`);
  }
  if (rh) {
    textParts.push(rh.text);
    spokenParts.push(rh.spoken);
  }
  const text = textParts.join(', ');
  const missing = !abo ? 'Выберите строку в таблице группы' : !rh ? 'Выберите резус' : null;
  const needsControl = !!(abo && abo.needsControl);
  const spokenValue = spokenParts.join(', ');

  return {
    abo,
    rh,
    headline,
    text: text.charAt(0).toUpperCase() + text.slice(1),
    spokenValue,
    spoken: [
      `Результат: ${spokenValue}`,
      needsControl ? 'нужен контроль с физраствором' : null,
      missing,
      LAB_SPOKEN,
    ]
      .filter(Boolean)
      .join('. '),
    needsControl,
    notes: needsControl ? [CONTROL_NOTE] : [],
    missing,
  };
}
