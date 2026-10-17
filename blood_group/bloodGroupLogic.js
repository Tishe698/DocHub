// bloodGroupLogic.js — интерпретация первичного определения группы крови AB0 и резуса
// цоликлонами на плоскости. Чистые функции без React (тесты: __tests__/bloodGroupLogic.test.js).
// Логика и формулировки перенесены из blood_group_screen.js без изменения клинических правил
// (ветка fix/clinical-audit).
//
// Источники:
//  - Приказ МЗ РФ от 20.10.2020 №1134н, п. 6 (первичное определение AB0 и резуса),
//    п. 11 (подтверждение в лаборатории), п. 19 (контрольная проверка перед трансфузией),
//    приложение (совместимость при вариантах D). Действует до 01.01.2027 (п. 2) —
//    после замены приказа (сообщается о №730н от 17.08.2026) ссылки пересмотреть.
//  - Приказ МЗ РФ от 25.11.2002 №363 «Инструкция по применению компонентов крови»,
//    разд. «Определение группы крови AB0» и «Определение резус-принадлежности»
//    (учёт через 3 мин; при агглютинации со всеми реагентами — контроль с 0,9% NaCl,
//    AB(IV) только при его отрицательном результате). Методика совпадает с инструкциями
//    производителей цоликлонов анти-A, анти-B, анти-AB, анти-D.

// Значения реакции: null — не отмечено, 0 — нет агглютинации,
// 1 — агглютинация, 2 — слабая / сомнительная.
export const NEG = 0;
export const POS = 1;
export const WEAK = 2;

// Варианты ответа для каждой лунки (символ + слово: смысл не передаётся только знаком)
export const REACTION_OPTIONS = [
  { value: NEG, symbol: '−', label: '− нет', a11y: 'агглютинации нет' },
  { value: WEAK, symbol: '±', label: '± слабая', a11y: 'слабая или сомнительная агглютинация' },
  { value: POS, symbol: '+', label: '+ есть', a11y: 'агглютинация есть' },
];

// Подпись реакции словами: для лунки и для диктора
export function reactionWord(value) {
  const opt = REACTION_OPTIONS.find((o) => o.value === value);
  return opt ? opt.a11y : 'не отмечено';
}

// Лунки на экране: порядок, подписи и подсказки
export const REAGENTS = [
  {
    key: 'antiA',
    section: 'abo',
    title: 'Анти-A',
    reagent: 'Анти-A',
    hint: 'Агглютинация → есть антиген A',
  },
  {
    key: 'antiB',
    section: 'abo',
    title: 'Анти-B',
    reagent: 'Анти-B',
    hint: 'Агглютинация → есть антиген B',
  },
  {
    key: 'antiAB',
    section: 'abo',
    title: 'Анти-AB',
    reagent: 'Анти-AB',
    hint: 'Входит в стандартный набор: «+» при A, B, AB; «−» при 0 (I). Выявляет слабые A и B.',
  },
  {
    key: 'control',
    section: 'abo',
    title: 'Контроль: эритроциты + 0,9% NaCl',
    reagent: 'Контроль NaCl',
    hint: 'Обязателен при агглютинации с анти-A и анти-B. Агглютинации быть не должно.',
  },
  {
    key: 'antiD',
    section: 'rh',
    title: 'Анти-D (IgM)',
    reagent: 'Анти-D',
    hint: 'Агглютинация → резус-положительный; нет → резус-отрицательный',
  },
];

export const EMPTY_REACTIONS = { antiA: null, antiB: null, antiAB: null, control: null, antiD: null };

export const NOT_SET = '—';
const UNDET_ABO = 'Не определена';
const UNDET_RH = 'Не определён';
const LAB = 'Направьте образец в лабораторию.';

// Интерпретация реакций. Возвращает группу AB0, резус и предупреждения.
// Таблица AB0 (анти-A / анти-B / анти-AB): 0(I) − − −; A(II) + − +; B(III) − + +;
// AB(IV) + + + — приказ МЗ РФ №363 (2002), табл. 1; инструкции к цоликлонам.
export function interpretBloodGroup({ antiA, antiB, antiAB = null, antiD = null, control = null }) {
  const warnings = [];
  const infos = [];

  const aSet = antiA !== null && antiA !== undefined;
  const bSet = antiB !== null && antiB !== undefined;
  const aboReady = aSet && bSet;

  // Агглютинация в контроле (эритроциты + 0,9% NaCl) — неспецифическая
  // (аутоагглютинация, холодовые антитела, полиагглютинация): любые положительные
  // реакции недостоверны (приказ №363, 2002).
  const controlPos = control === POS || control === WEAK;

  let abo = NOT_SET;
  let aboPending = false; // AB(IV) до выполнения контроля

  if (controlPos) {
    abo = UNDET_ABO;
    warnings.push(
      'Агглютинация в контроле с 0,9% NaCl — неспецифическая (аутоагглютинация, холодовые антитела). ' +
        'Группа и резус не определяются. ' +
        LAB
    );
  } else if (aboReady) {
    if (antiA === WEAK || antiB === WEAK || antiAB === WEAK) {
      // Слабые варианты A/B агглютинируют позже и слабее (инструкции к цоликлонам)
      abo = UNDET_ABO;
      warnings.push('Слабая или сомнительная реакция: возможен слабый вариант антигена A или B. ' + LAB);
    } else {
      const aPos = antiA === POS;
      const bPos = antiB === POS;
      let base;
      if (!aPos && !bPos) base = '0 (I)';
      else if (aPos && !bPos) base = 'A (II)';
      else if (!aPos && bPos) base = 'B (III)';
      else base = 'AB (IV)';

      // Согласованность с анти-AB: должен быть «+» при A или B и «−» при 0(I)
      const abExpected = aPos || bPos ? POS : NEG;
      if (antiAB !== null && antiAB !== undefined && antiAB !== abExpected) {
        abo = UNDET_ABO;
        warnings.push(
          antiAB === POS
            ? 'Агглютинация только с анти-AB: возможен слабый вариант A или B. ' + LAB
            : 'Нет агглютинации с анти-AB при агглютинации с анти-A/анти-B — реакции противоречат друг другу. ' +
                LAB
        );
      } else if (base === 'AB (IV)' && control !== NEG) {
        // AB(IV) устанавливают только при отсутствии агглютинации в контроле
        // с 0,9% NaCl (приказ №363, 2002)
        abo = 'AB (IV)?';
        aboPending = true;
        warnings.push(
          'Агглютинация с анти-A и анти-B: выполните контроль — капля эритроцитов + капля 0,9% NaCl. ' +
            'AB (IV) — только если в контроле агглютинации нет.'
        );
      } else {
        abo = base;
        if (base === '0 (I)' && (antiAB === null || antiAB === undefined)) {
          // Анти-AB входит в стандартный набор и выявляет слабые A/B
          infos.push('Для 0 (I) подтвердите цоликлоном анти-AB: агглютинации быть не должно.');
        }
      }
    }
  }

  // Резус-принадлежность: анти-D (IgM) на плоскости, учёт через 3 мин
  // (приказ №363, 2002; 1134н п. 6, 11)
  let rh = NOT_SET;
  if (controlPos) {
    rh = UNDET_RH;
  } else if (antiD === POS) {
    // При неисключённой неспецифической агглютинации (все реакции «+», контроль
    // не выполнен) положительный анти-D тоже может быть ложным
    rh = aboPending ? 'Rh(+)?' : 'Rh(+) положительный';
  } else if (antiD === NEG) {
    rh = 'Rh(−) отрицательный';
  } else if (antiD === WEAK) {
    rh = UNDET_RH;
    // Вариант D уточняют в лаборатории анти-D IgG (1134н п. 11). До уточнения —
    // как резус-отрицательный: D-отрицательные компоненты совместимы и при слабом,
    // и при парциальном D (1134н, приложение) — наиболее безопасный вариант.
    warnings.push(
      'Слабая или сомнительная реакция с анти-D: возможен вариант D. ' +
        LAB +
        ' До уточнения считать резус-отрицательным (безопасно при любом варианте D).'
    );
  }

  const anyResult = aboReady || (antiD !== null && antiD !== undefined) || controlPos;

  return {
    abo,
    rh,
    aboReady,
    anyResult,
    warnings,
    infos,
  };
}

// Неокончательный результат: «?» (ждёт контроля) или «Не определена/Не определён»
export function isDoubtful(value) {
  const s = String(value || '');
  return s.includes('?') || s.startsWith('Не ');
}

// Итоговый уровень для карточки результата: цвет всегда дублируется словом (levelLabel)
export function resultLevel(result) {
  if (!result || !result.anyResult) return null;
  if (result.warnings.length || isDoubtful(result.abo) || isDoubtful(result.rh)) {
    return { level: 'warning', label: 'Требует уточнения' };
  }
  return { level: 'info', label: 'Первичный результат' };
}

// Подсказки «что ещё отметить» под результатом
export function pendingHints(result) {
  if (!result.anyResult) {
    return ['Отметьте реакции с анти-A и анти-B для группы и с анти-D для резуса.'];
  }
  const out = [];
  if (result.abo === NOT_SET) out.push('Для группы AB0 отметьте анти-A и анти-B.');
  if (result.rh === NOT_SET) out.push('Для резуса отметьте реакцию с анти-D.');
  return out;
}

// Текст для озвучки результата (без «—» и символов, которые диктор читает плохо)
export function resultSummary(result) {
  if (!result || !result.anyResult) return '';
  const spoken = (v) => (v === NOT_SET ? 'не отмечено' : v.replace('?', ', под вопросом'));
  const parts = [`Группа AB0: ${spoken(result.abo)}`, `Резус: ${spoken(result.rh)}`];
  if (result.warnings.length) {
    parts.push(
      result.warnings.length === 1 ? 'Есть предупреждение' : `Предупреждений: ${result.warnings.length}`
    );
  }
  parts.push('Нужно подтверждение в лаборатории');
  return `${parts.join('. ')}.`;
}
