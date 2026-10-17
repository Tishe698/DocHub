// НМБД, интубация, гематология и кровотечение
// Часть списка препаратов: собирается в ../formulas.js в исходном порядке.

const group = [
    // --- НМБД И ИНТУБАЦИЯ ---
  
    {
        name: 'Суксаметония хлорид',
        description: 'Раствор 20 мг/мл — 5 мл',
        inputs: { weight: 'Вес (кг)' }, // 2 мг/кг
        formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 2;
          return { result1: mg, result2: mg / 20 };
        },
        units: { result1: 'мг', result2: 'мл' },
        labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Старше 1 года. Учитывать противопоказания (гиперкалиемия, ожоги и т.п.).'],
      },
  
    {
        name: 'Пипекурония бромид',
        description: 'Лиофилизат 4 мг',
        inputs: { weight: 'Вес (кг)', ageMonths: 'Возраст (мес)' }, // 0.04–0.06 мг/кг
        formula: ({ weight, ageMonths = 0 }) => {
          const a = parseFloat(ageMonths) || 0;
          const w = parseFloat(weight) || 0;
          const mgPerKg = a >= 3 ? (a < 12 ? 0.04 : 0.055) : 0.04;
          const mg = w * mgPerKg;
          return { result1: mg };
        },
        units: { result1: 'мг' },
        labels: { result1: 'Доза' },
      warnings: ['Старше 3 мес. В 1–14 лет обычно 0.05–0.06 мг/кг.'],
    },
  
    // --- ГЕМАТОЛОГИЯ И КРОВОТЕЧЕНИЕ ---
  
    {
      name: 'Гепарин натрия',
      description: 'Раствор 5000 ЕД/мл — 1 мл',
      inputs: { weight: 'Вес (кг)' }, // 75 ЕД/кг
      formula: ({ weight }) => {
          const w = parseFloat(weight) || 0;
        const units = w * 75;
        const ml = units / 5000;
        return { result1: units, result2: ml };
      },
      units: { result1: 'ЕД', result2: 'мл' },
        labels: { result1: 'Доза', result2: 'Объём' },
    },
  
    {
      name: 'Этамзилат',
      description: 'Раствор 125 мг/мл — 2 мл',
      inputs: { weight: 'Вес (кг)' }, // 12.5 мг/кг, макс 500 мг
        formula: ({ weight }) => {
          const w = parseFloat(weight) || 0;
        const mg = Math.min(w * 12.5, 500);
        return { result1: mg, result2: mg / 125 };
        },
        units: { result1: 'мг', result2: 'мл' },
        labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Максимальная разовая доза 500 мг.'],
    },
  
    {
      name: 'Транексамовая кислота',
      description: 'Антифибринолитик (IV)',
      inputs: { weight: 'Вес (кг)' }, // болюс 15 мг/кг, затем 2 мг/кг/ч
        formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const bolusMg = Math.min(w * 15, 1000); // макс 1 г
        const infMgPerHr = w * 2;
        return { result1: bolusMg, result2: infMgPerHr };
      },
      units: { result1: 'мг', result2: 'мг/ч' },
      labels: { result1: 'Болюс (за 10 мин)', result2: 'Инфузия (до 8 ч)' },
      warnings: ['Травма/кровопотеря: болюс 15 мг/кг → 2 мг/кг/ч до 8 ч.'],
    },
  
];

export default group;
