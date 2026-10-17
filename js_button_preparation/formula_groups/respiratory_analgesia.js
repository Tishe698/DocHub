// Респираторная терапия, анальгезия и седация
// Часть списка препаратов: собирается в ../formulas.js в исходном порядке.

const group = [
    // --- РЕСПИРАТОРНАЯ ТЕРАПИЯ ---
  
    {
        name: 'Будесонид (небула)',
        description: 'Суспензия 0.5 мг/мл — 2 мл',
        inputs: {},
      formula: () => ({ result1: 1, result2: 2 }),
        units: { result1: 'мг', result2: 'мл' },
        labels: { result1: 'Доза', result2: 'Объём' },
        warnings: ['Старше 6 месяцев. Допустимо 1–2 мг.'],
      },
  
    {
        name: 'Ипратропия бромид + фенотерол',
        description: 'Ингаляционный раствор — 20 мл',
        inputs: { weight: 'Вес (кг)', ageYears: 'Возраст (лет)' },
        formula: ({ weight, ageYears }) => {
          const w = parseFloat(weight) || 0;
          const age = parseFloat(ageYears) || 0;
        const drops = age < 6 ? Math.min(Math.round(w), 10) : 20; // ~0.1 мл/кг, макс 10 кап
          return { result1: drops };
        },
        units: { result1: 'кап' },
        labels: { result1: 'Капли' },
      warnings: ['До 6 лет — ~1 кап/кг, не более 10; ≥6 лет — до 20 кап.'],
      },
  
    {
        name: 'Сальбутамол',
      description: 'Небула 1 мг/мл — 2.5 мл',
        inputs: {},
        formula: () => ({ result1: 2.5, result2: 2.5 }),
        units: { result1: 'мг', result2: 'мл' },
        labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Старше 2 лет. Разовая доза 2.5 мг (по клинике повтор).'],
      },
  
    // --- АНАЛЬГЕЗИЯ/СЕДАЦИЯ/НВПС ---
  
    {
        name: 'Кеторолак',
        description: 'Раствор 30 мг/мл — 1 мл',
        inputs: {},
        formula: () => ({ result1: 30, result2: 1 }),
        units: { result1: 'мг', result2: 'мл' },
        labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Только с 16 лет: 30 мг в/м или в/в.'],
      },
  
    {
        name: 'Трамадол',
        description: 'Раствор 50 мг/мл — 2 мл',
      inputs: { weight: 'Вес (кг)' }, // 1 мг/кг
        formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 1;
          return { result1: mg, result2: mg / 50 };
        },
        units: { result1: 'мг', result2: 'мл' },
        labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Старше 1 года. 1–2 мг/кг; не более 100 мг каждые 6 ч.'],
    },
  
    {
      name: 'Морфин',
        description: 'Раствор 10 мг/мл — 1 мл',
        inputs: { weight: 'Вес (кг)' }, // 0.1 мг/кг
        formula: ({ weight }) => {
          const w = parseFloat(weight) || 0;
          const mg = w * 0.1;
          return { result1: mg, result2: mg / 10 };
        },
        units: { result1: 'мг', result2: 'мл' },
        labels: { result1: 'Доза', result2: 'Объём' },
      },
  
    {
        name: 'Фентанил',
        description: 'Раствор 50 мкг/мл — 1 мл',
      inputs: { weight: 'Вес (кг)' }, // 1 мкг/кг
        formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mcg = w * 1;
          const ml = mcg / 50;
          return { result1: mcg, result2: ml };
        },
        units: { result1: 'мкг', result2: 'мл' },
        labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Допустимо 1–4 мкг/кг, титровать по эффекту/АД/SpO₂.'],
      },
  
    {
        name: 'Пропофол',
        description: 'Эмульсия 10 мг/мл — 20 мл',
      inputs: { weight: 'Вес (кг)' }, // 2 мг/кг
        formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 2;
          return { result1: mg, result2: mg / 10 };
        },
        units: { result1: 'мг', result2: 'мл' },
        labels: { result1: 'Доза', result2: 'Объём' },
        warnings: ['Старше 1 месяца. Допустимо 2–4 мг/кг.'],
      },
  
    {
        name: 'Тиопентал натрия',
        description: 'Порошок 1000 мг (разведение по протоколу)',
      inputs: { weight: 'Вес (кг)' }, // 1 мг/кг (минимум)
        formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        return { result1: w * 1 };
        },
        units: { result1: 'мг' },
        labels: { result1: 'Доза' },
      },
  
];

export default group;
