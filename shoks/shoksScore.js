// shoksScore.js — ШОКС (шкала оценки клинического состояния пациента с ХСН, модификация
// Мареева В.Ю., 2000): пункты, подсчёт и интерпретация (чистые функции).
// Экран — shoks/shoks.js, тесты — shoks/__tests__/shoksScore.test.js.
//
// Формулировки и баллы — КР МЗ РФ «Хроническая сердечная недостаточность» 2024,
// Приложение Г1 (ШОКС, модификация Мареева В.Ю., 2000); Пузин С.Н. и соавт., 2014.
// Клинические значения перенесены без изменений из ветки fix/clinical-audit.

export const QUESTIONS = [
  {
    key: 'dyspnea',
    title: 'Одышка',
    options: [
      { id: '0', label: 'Нет', pts: 0 },
      { id: '1', label: 'При нагрузке', pts: 1 },
      { id: '2', label: 'В покое', pts: 2 },
    ],
  },
  {
    key: 'weight',
    title: 'Изменился ли за последнюю неделю вес',
    // балл только за прибавку веса; снижение (напр., на диуретиках) = 0
    // (КР «ХСН» 2024, Прил. Г1: «0 — нет, 1 — увеличился»)
    options: [
      { id: '0', label: 'Нет или снизился', pts: 0 },
      { id: '1', label: 'Увеличился', pts: 1 },
    ],
  },
  {
    key: 'palp',
    title: 'Жалобы на перебои в работе сердца',
    options: [
      { id: '0', label: 'Нет', pts: 0 },
      { id: '1', label: 'Да', pts: 1 },
    ],
  },
  {
    key: 'position',
    title: 'В каком положении находится в постели',
    options: [
      { id: '0', label: 'Горизонтально', pts: 0 },
      // КР «ХСН» 2024, Прил. Г1: «с приподнятым головным концом (две и более подушки)»,
      // «плюс просыпается от удушья»
      { id: '1', label: 'С приподнятым изголовьем (2 и более подушки)', pts: 1 },
      { id: '2', label: 'То же + просыпается от удушья', pts: 2 },
      { id: '3', label: 'Сидя', pts: 3 },
    ],
  },
  {
    key: 'jvp',
    title: 'Набухшие шейные вены',
    options: [
      { id: '0', label: 'Нет', pts: 0 },
      { id: '1', label: 'В положении лёжа', pts: 1 },
      { id: '2', label: 'Стоя', pts: 2 },
    ],
  },
  {
    key: 'rales',
    title: 'Хрипы в лёгких',
    options: [
      { id: '0', label: 'Нет', pts: 0 },
      { id: '1', label: 'Нижние отделы (до 1/3)', pts: 1 },
      { id: '2', label: 'До лопаток (до 2/3)', pts: 2 },
      { id: '3', label: 'Над всей поверхностью лёгких', pts: 3 },
    ],
  },
  {
    key: 'gallop',
    title: 'Наличие ритма галопа',
    options: [
      { id: '0', label: 'Нет', pts: 0 },
      { id: '1', label: 'Да', pts: 1 },
    ],
  },
  {
    key: 'liver',
    // точка отсчёта в КР не указана (только «до 5 см / >5 см»); пояснение —
    // общепринятая пропедевтика: выступание края печени из-под рёберной дуги
    title: 'Печень (выступание из-под края рёберной дуги)',
    options: [
      { id: '0', label: 'Не увеличена', pts: 0 },
      { id: '1', label: 'Увеличена до 5 см', pts: 1 },
      { id: '2', label: 'Увеличена более 5 см', pts: 2 },
    ],
  },
  {
    key: 'edema',
    title: 'Отёки',
    options: [
      { id: '0', label: 'Нет', pts: 0 },
      { id: '1', label: 'Пастозность', pts: 1 },
      { id: '2', label: 'Отёки', pts: 2 },
      { id: '3', label: 'Анасарка', pts: 3 },
    ],
  },
  {
    key: 'sbp',
    title: 'Систолическое АД',
    options: [
      { id: '0', label: '> 120 мм рт.ст.', pts: 0 },
      { id: '1', label: '100–120 мм рт.ст.', pts: 1 },
      { id: '2', label: '< 100 мм рт.ст.', pts: 2 },
    ],
  },
];

// Максимум шкалы — 20 баллов (сумма максимальных баллов всех 10 пунктов)
export const MAX_SCORE = QUESTIONS.reduce((acc, q) => acc + Math.max(...q.options.map((o) => o.pts)), 0);

// «балл / балла / баллов»
export function ptsWord(n) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return 'баллов';
  if (b === 1) return 'балл';
  if (b >= 2 && b <= 4) return 'балла';
  return 'баллов';
}

// Интерпретация по сумме баллов (функциональный класс ХСН).
// КР «ХСН» 2024, Прил. Г1: 0 — нет признаков; ≤3 — I ФК; 4–6 — II ФК; 7–9 — III ФК; >9 — IV ФК.
// Пузин С.Н. и соавт., 2014: максимум (20 баллов) соответствует терминальной ХСН — это IV ФК.
// badge — уровень бейджа; цвет всегда дублируется текстом класса.
export function interpret(sum) {
  if (sum === 0) return { fc: 0, cls: 'нет признаков СН', band: '0 баллов', badge: 'success' };
  if (sum <= 3) return { fc: 1, cls: 'I функциональный класс', band: '≤ 3', badge: 'success' };
  if (sum <= 6) return { fc: 2, cls: 'II функциональный класс', band: '4–6', badge: 'warning' };
  if (sum <= 9) return { fc: 3, cls: 'III функциональный класс', band: '7–9', badge: 'warning' };
  if (sum >= MAX_SCORE) {
    return { fc: 4, cls: 'IV ФК — терминальная ХСН', band: `${MAX_SCORE} (максимум)`, badge: 'danger' };
  }
  // >9 и <20
  return { fc: 4, cls: 'IV функциональный класс', band: '> 9', badge: 'danger' };
}

export const emptyAnswers = () => Object.fromEntries(QUESTIONS.map((q) => [q.key, null]));

// Подсчёт. answers — { [key пункта]: id варианта | null }. Неизвестный id — пункт не отвечен.
// Итог имеет смысл только после оценки всех 10 пунктов (Пузин С.Н. и соавт., 2014;
// КР «ХСН» 2024, Прил. Г1): до этого — только предварительная сумма без класса.
export function computeShoks(answers = {}) {
  let total = 0;
  const missing = [];
  for (const q of QUESTIONS) {
    const opt = q.options.find((o) => o.id === answers[q.key]);
    if (opt) total += opt.pts;
    else missing.push(q.key);
  }
  const answered = QUESTIONS.length - missing.length;
  const complete = missing.length === 0;
  return {
    total,
    answered,
    count: QUESTIONS.length,
    missing,
    missingTitles: missing.map((k) => QUESTIONS.find((q) => q.key === k).title),
    complete,
    interpretation: complete ? interpret(total) : null,
  };
}

// Строка итога для диктора. Пустая — итога нет.
export function shoksSummary(result) {
  if (!result || !result.complete) return '';
  return `ШОКС: ${result.total} ${ptsWord(result.total)}. ${result.interpretation.cls}`;
}
