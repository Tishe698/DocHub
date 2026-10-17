// Инфузионная терапия
// Часть списка препаратов: собирается в ../formulas.js в исходном порядке.

const group = [
    // --- ИНФУЗИОННАЯ ТЕРАПИЯ ---
  
    {
        name: 'ГЭК 6%',
        description: 'Раствор 6% — 250 мл',
      inputs: { weight: 'Вес (кг)' }, // 10 мл/кг
      formula: ({ weight }) => ({ result1: (parseFloat(weight) || 0) * 10 }),
        units: { result1: 'мл' },
        labels: { result1: 'Объём' },
      },
  
    {
        name: 'Декстран',
        description: 'Инфузионный раствор',
      inputs: { weight: 'Вес (кг)' }, // 10 мл/кг
      formula: ({ weight }) => ({ result1: (parseFloat(weight) || 0) * 10 }),
        units: { result1: 'мл' },
        labels: { result1: 'Объём' },
      },
  
    {
        name: 'Натрия хлорид 0.9%',
        description: 'Раствор — 250 мл',
      inputs: { weight: 'Вес (кг)' }, // 10 мл/кг
      formula: ({ weight }) => ({ result1: (parseFloat(weight) || 0) * 10 }),
        units: { result1: 'мл' },
        labels: { result1: 'Объём' },
      },
  
    {
        name: 'Декстроза (глюкоза) 10% / 5% / 400 мг/мл',
        description: '10% — 500 мл; 5% — 250 мл; 400 мг/мл — 10 мл',
      inputs: { weight: 'Вес (кг)' }, // болюс 2 мл/кг; инфузия 10 мл/кг
        formula: ({ weight }) => {
          const w = parseFloat(weight) || 0;
        return { result1: w * 2, result2: w * 10 };
        },
        units: { result1: 'мл', result2: 'мл' },
        labels: { result1: 'Болюс (ориентир)', result2: 'Инфузия (ориентир)' },
      warnings: ['Ориентиры: болюс 2 мл/кг; инфузия 10–20 мл/кг — по клинике.'],
      },
  
    {
        name: 'Вода для инъекций',
        description: 'Ампулы 5 мл',
        inputs: { volume: 'Требуемый объём (мл)' },
        formula: ({ volume }) => ({ result1: parseFloat(volume) || 0 }),
        units: { result1: 'мл' },
        labels: { result1: 'Объём' },
      },
  
    // электролитные смеси как «объём по весу»
    {
        name: 'Калия хлорид + натрия ацетат + натрия хлорид',
        description: 'Инфузия — 400 мл',
      inputs: { weight: 'Вес (кг)' }, // 15 мл/кг
        formula: ({ weight }) => ({ result1: (parseFloat(weight) || 0) * 15 }),
        units: { result1: 'мл' },
        labels: { result1: 'Объём' },
        warnings: ['Скорость 20–30 кап/мин (уточняйте протокол).'],
      },
  
    {
        name: 'Калия хлорид + кальция хлорид + натрия хлорид',
        description: 'Инфузия — 500 мл',
      inputs: { weight: 'Вес (кг)' }, // 20 мл/кг
        formula: ({ weight }) => ({ result1: (parseFloat(weight) || 0) * 20 }),
        units: { result1: 'мл' },
        labels: { result1: 'Объём' },
      },
  
];

export default group;
