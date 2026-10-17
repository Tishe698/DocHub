// Прочее неотложное, часть 2; противосудорожные, неврология, прочее
// Часть списка препаратов: собирается в ../formulas.js в исходном порядке.

const group = [
    {
      name: 'Дротаверин',
      description: 'Раствор 20 мг/мл — 2 мл',
      inputs: { ageYears: 'Возраст (лет)' }, // ориентиры по возрасту
      formula: ({ ageYears }) => {
        const a = Math.max(0, parseFloat(ageYears) || 0);
        let ml = 0;
        if (a < 6) ml = a * 0.1;       // 0.1–0.2 мл/год — нижняя граница
        else if (a <= 12) ml = 1.5;    // 1–2 мл — среднее
        else return {};
        const mg = ml * 20;
          return { result1: mg, result2: ml };
        },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['В списке 18+; детские схемы различаются — ориентируйтесь на локальные протоколы.'],
    },
  
    {
      name: 'Платифиллин',
      description: 'Раствор 2 мг/мл — 1 мл',
      inputs: { weight: 'Вес (кг)', ageYears: 'Возраст (лет)' },
      formula: ({ weight, ageYears }) => {
          const w = parseFloat(weight) || 0;
        const a = parseFloat(ageYears) || 0;
        let mgPerKg = 0;
        if (a < 1) mgPerKg = 0.035;
        else if (a <= 5) mgPerKg = 0.03;
        else if (a <= 10) mgPerKg = 0.025;
        else if (a <= 14) mgPerKg = 0.02;
        else return {};
        const mg = w * mgPerKg;
        return { result1: mg, result2: mg / 2 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
    },
  
    {
      name: 'Налоксон',
      description: 'Раствор 0.4 мг/мл — 1 мл',
      inputs: { weight: 'Вес (кг)' }, // 0.1 мг/кг, макс 2 мг
        formula: ({ weight }) => {
          const w = parseFloat(weight) || 0;
        const mg = Math.min(w * 0.1, 2);
        const ml = +(mg / 0.4).toFixed(2);
          return { result1: mg, result2: ml };
        },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['При риске абстиненции можно титровать 0.02 мг/кг. Повторять по клинике.'],
    },
  
    // --- ПРОТИВОСУДОРОЖНЫЕ/НЕВРОЛОГИЯ ---
  
    {
      name: 'Вальпроевая кислота',
      description: 'Раствор 100 мг/мл — 5 мл',
      inputs: { weight: 'Вес (кг)', ageYears: 'Возраст (лет)' },
      formula: ({ weight, ageYears }) => {
          const w = parseFloat(weight) || 0;
        const a = parseFloat(ageYears) || 0;
        const mgPerKg = a < 10 ? 50 : 15;
        const mg = w * mgPerKg;
        return { result1: mg, result2: mg / 100 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Старше 6 мес. 6 мес–10 лет: 15–50 мг/кг; >10 лет: ~15 мг/кг.'],
    },
  
    {
      name: 'Пиридоксин',
      description: 'Раствор 50 мг/мл — 1 мл',
      inputs: { ageYears: 'Возраст (лет)' }, // 0.1 мл/год
      formula: ({ ageYears }) => {
        const ml = 0.1 * (parseFloat(ageYears) || 0);
        return { result1: ml * 50, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
    },
  
    {
      name: 'Тиамин',
      description: 'Раствор 50 мг/мл — 1 мл',
      inputs: { ageYears: 'Возраст (лет)' }, // 0.1 мл/год
      formula: ({ ageYears }) => {
        const ml = 0.1 * (parseFloat(ageYears) || 0);
        return { result1: ml * 50, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
    },
  
    {
      name: 'Фильтрум',
      description: 'Таблетки 400 мг',
      inputs: { ageYears: 'Возраст (лет)' },
      formula: ({ ageYears }) => {
        const age = parseFloat(ageYears) || 0;
        let mg = 400;
        if (age < 1) mg = 200;
        else if (age <= 3) mg = 300;
        else if (age <= 7) mg = 400;
        else if (age <= 12) mg = 600;
        else mg = 800;
        return { result1: mg, result2: mg / 400 };
      },
      units: { result1: 'мг', result2: 'таб' },
      labels: { result1: 'Доза', result2: 'Таблетки (≈)' },
    },
  
    // --- ПРОЧЕЕ ---
  
    {
      name: 'Меглюмина натрия сукцинат',
      description: 'Раствор 1.5% — 500 мл',
      inputs: { weight: 'Вес (кг)' }, // 10 мг/кг
      formula: ({ weight }) => ({ result1: (parseFloat(weight) || 0) * 10 }),
      units: { result1: 'мг' },
      labels: { result1: 'Доза' },
    },
  
    {
      name: 'Парафин жидкий',
      description: 'Перорально',
      inputs: { weight: 'Вес (кг)' }, // 1 мл/кг
      formula: ({ weight }) => ({ result1: (parseFloat(weight) || 0) * 1 }),
      units: { result1: 'мл' },
      labels: { result1: 'Доза' },
    },
  
    {
      name: 'Димеркаптопропансульфонат натрия (унитиол)',
      description: 'Раствор 50 мг/мл — 5 мл',
      inputs: { weight: 'Вес (кг)' }, // 0.1 мл/кг IM/IV
        formula: ({ weight }) => {
          const w = parseFloat(weight) || 0;
        const ml = w * 0.1;
        const mg = ml * 50;
          return { result1: mg, result2: ml };
        },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
    },
  
];

export default group;
