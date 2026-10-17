// Антибиотики и противоаллергические
// Часть списка препаратов: собирается в ../formulas.js в исходном порядке.

const group = [
    // --- АНТИБИОТИКИ ---
  
    {
      name: 'Цефтриаксон',
      description: 'Флакон 1 г',
      inputs: { weight: 'Вес (кг)' }, // 50 мг/кг, макс 2 г
        formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = Math.min(w * 50, 2000);
        return { result1: mg };
      },
      units: { result1: 'мг' },
      labels: { result1: 'Доза' },
      warnings: ['Макс 2 г/сут однократно (по показаниям). Разведение — по протоколу.'],
    },
  
    {
      name: 'Хлорамфеникол',
      description: 'Флакон 1 г',
      inputs: { weight: 'Вес (кг)' }, // 50 мг/кг
      formula: ({ weight }) => ({ result1: (parseFloat(weight) || 0) * 50 }),
      units: { result1: 'мг' },
      labels: { result1: 'Доза' },
      warnings: ['Старше 6 месяцев.'],
    },
  
    {
      name: 'Стрептомицин',
      description: 'Флакон 1 г',
      inputs: { weight: 'Вес (кг)' }, // 20 мг/кг
      formula: ({ weight }) => ({ result1: (parseFloat(weight) || 0) * 20 }),
      units: { result1: 'мг' },
      labels: { result1: 'Доза' },
    },
  
    // --- ПРОТИВОАЛЛЕРГИЧЕСКИЕ ---
  
    {
      name: 'Хлоропирамин',
      description: 'Раствор 20 мг/мл — 1 мл',
      inputs: { ageYears: 'Возраст (лет)' }, // 0.1 мл/год, макс 1 мл
      formula: ({ ageYears }) => {
        const a = Math.max(0, parseFloat(ageYears) || 0);
        const ml = Math.min(1, a * 0.1);
        const mg = ml * 20;
        return { result1: mg, result2: ml };
        },
        units: { result1: 'мг', result2: 'мл' },
        labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Макс 1 мл разово (Супрастин).'],
      },
  
    {
      name: 'Дифенгидрамин',
        description: 'Раствор 10 мг/мл — 1 мл',
      inputs: { ageMonths: 'Возраст (мес)', ageYears: 'Возраст (лет)' },
      formula: ({ ageMonths = 0, ageYears = 0 }) => {
        const months = parseFloat(ageMonths) || 0;
        const years = parseFloat(ageYears) || 0;
        let ml = 0;
        if (months >= 7 && years < 1) ml = 0.3;        // 0.3–0.5 мл
        else if (years >= 1 && years <= 3) ml = 0.5;   // 0.5–1.0 мл
        else if (years >= 4) return { result1: 10, result2: 1 }; // не более 10 мг
        const mg = ml * 10;
        return { result1: mg, result2: ml };
        },
        units: { result1: 'мг', result2: 'мл' },
        labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Старше 7 месяцев. У ≥4 лет — не более 10 мг.'],
    },
  
];

export default group;
