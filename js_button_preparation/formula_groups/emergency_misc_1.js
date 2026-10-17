// Прочее неотложное, часть 1
// Часть списка препаратов: собирается в ../formulas.js в исходном порядке.

const group = [
    // --- ПРОЧЕЕ НЕОТЛОЖНОЕ ---
  
    {
      name: 'Кальция глюконат',
      description: '10% раствор (100 мг/мл), медленно IV',
      inputs: { weight: 'Вес (кг)' }, // ≈0.68 мл/кг (0.15 ммоль/кг)
        formula: ({ weight }) => {
          const w = parseFloat(weight) || 0;
        const ml = +(w * 0.68).toFixed(1);
        const mg = ml * 100;
          return { result1: mg, result2: ml };
        },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза (мг)', result2: 'Объём (мл)' },
      warnings: ['Гиперкалиемия/кардиотоксичность: ~0.5–1 мл/кг; вводить под ЭКГ-контролем.'],
    },
  
    {
      name: 'Магния сульфат',
      description: 'Раствор 250 мг/мл — 10 мл (IV)',
      inputs: { weight: 'Вес (кг)' }, // 50 мг/кг
        formula: ({ weight }) => {
          const w = parseFloat(weight) || 0;
        const mg = w * 50;
        const ml = +(mg / 250).toFixed(2);
          return { result1: mg, result2: ml };
        },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Статус астматикус / torsades: 25–50 мг/кг за 15–20 мин.'],
    },
  
    {
      name: 'Кетамин',
      description: 'Раствор 50 мг/мл — 2 мл',
      inputs: { weight: 'Вес (кг)' }, // 1 мг/кг (минимум)
        formula: ({ weight }) => {
          const w = parseFloat(weight) || 0;
        const mg = w * 1;
        return { result1: mg, result2: mg / 50 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза (миним.)', result2: 'Объём' },
      warnings: ['Допустимо 1–2 мг/кг IV; наличие противопоказаний учесть.'],
    },
  
    {
      name: 'Метамизол натрия',
      description: 'Раствор 500 мг/мл — 2 мл',
      inputs: { weight: 'Вес (кг)' }, // 10 мг/кг
        formula: ({ weight }) => {
          const w = parseFloat(weight) || 0;
        const mg = w * 10;
        return { result1: mg, result2: mg / 500 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
    },
  
    {
      name: 'Метоклопрамид',
      description: 'Раствор 5 мг/мл — 2 мл',
      inputs: { weight: 'Вес (кг)' }, // 0.1 мг/кг; лимиты по возрасту
        formula: ({ weight }) => {
          const w = parseFloat(weight) || 0;
          const mg = w * 0.1;
        const ml = mg / 5;
        const maxMl = w < 40 ? 1 : 2; // до 12 лет ~<40 кг — макс 1 мл; ≥12 лет — 2 мл
        return { result1: Math.min(mg, maxMl * 5), result2: Math.min(ml, maxMl) };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза (огр.)', result2: 'Объём (огр.)' },
      warnings: ['Старше 2 лет. Лимит: до 12 лет — 1 мл; ≥12 лет — 2 мл.'],
    },
  
    {
      name: 'Дроперидол',
      description: 'Раствор 2.5 мг/мл — 2 мл',
      inputs: { weight: 'Вес (кг)' }, // 0.1 мг/кг
        formula: ({ weight }) => {
          const w = parseFloat(weight) || 0;
          const mg = w * 0.1;
        return { result1: mg, result2: mg / 2.5 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Старше 3 лет. Мониторинг ЭКГ (QT).'],
    },
  
    {
      name: 'Хлорпромазин',
      description: 'Раствор 25 мг/мл — 1 мл',
      inputs: { weight: 'Вес (кг)' }, // 0.25 мг/кг (минимум)
        formula: ({ weight }) => {
          const w = parseFloat(weight) || 0;
        const mg = w * 0.25;
        return { result1: mg, result2: mg / 25 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза (миним.)', result2: 'Объём' },
      warnings: ['Старше 6 месяцев. Контроль АД/седация.'],
    },
  
    {
      name: 'Галоперидол',
      description: 'Раствор 5 мг/мл — 1 мл',
      inputs: { weight: 'Вес (кг)' }, // 0.025 мг/кг, не превышать 0.075 мг/кг
        formula: ({ weight }) => {
          const w = parseFloat(weight) || 0;
        const mg = Math.min(w * 0.025, w * 0.075);
        return { result1: mg, result2: mg / 5 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза (≤0.075 мг/кг)', result2: 'Объём' },
      warnings: ['Старше 3 лет. Контроль QT/экстрапирамидных реакций.'],
    },
  
];

export default group;
