// Реанимационные и кардиология
// Часть списка препаратов: собирается в ../formulas.js в исходном порядке.

const group = [
    // --- РЕАНИМАЦИОННЫЕ И КАРДИОЛОГИЯ ---
  
    {
      name: 'Эпинефрин (адреналин)',
      description: 'СЛР: IV/IO 0.1 мг/мл (1:10 000)',
      inputs: { weight: 'Вес (кг)' }, // 0.01 мг/кг (0.1 мл/кг), макс 1 мг
        formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = Math.min(w * 0.01, 1);
        const ml = mg / 0.1; // 0.1 мг/мл
        return { result1: mg, result2: ml };
        },
        units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза (IV/IO)', result2: 'Объём' },
      warnings: [
        'СЛР: каждые 3–5 мин.',
        'Анафилаксия IM: 0.01 мг/кг раствора 1 мг/мл (макс 0.5 мг у подростков).',
      ],
      },
  
    {
        name: 'Атропин',
      description: 'Раствор 1 мг/мл — 1 мл (брадикардия)',
      inputs: { weight: 'Вес (кг)' }, // 0.02 мг/кг, минимум 0.1 мг, макс 0.5 мг у ребёнка
        formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mgRaw = w * 0.02;
        const mg = Math.min(Math.max(mgRaw, 0.1), 0.5);
        const ml = mg / 1;
        return { result1: mg, result2: ml };
        },
        units: { result1: 'мг', result2: 'мл' },
        labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Минимум 0.1 мг; при ваготонии/AV-блоке; оценить показания.'],
    },
  
    {
      name: 'Амиодарон',
      description: 'Раствор 50 мг/мл — 5 мл',
      inputs: { weight: 'Вес (кг)' }, // 5 мг/кг
        formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 5;
        const ml = mg / 50;
        return { result1: mg, result2: ml };
        },
        units: { result1: 'мг', result2: 'мл' },
        labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Разовая обычно ≤300 мг; суммарно до 15 мг/кг/сут.'],
    },
  
    {
      name: 'Верапамил',
      description: 'Раствор 2.5 мг/мл — 2 мл',
      inputs: { weight: 'Вес (кг)' }, // 0.1–0.2 мг/кг, здесь 0.1 мг/кг
        formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = Math.min(w * 0.1, 10);
        return { result1: mg, result2: mg / 2.5 };
        },
        units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Избегать при WPW/VT/гипотонии; у младенцев противопоказан.'],
      },
  
    {
        name: 'Норэпинефрин',
      description: 'Титрация по мкг/кг/мин (конц. готовят по протоколу)',
      inputs: { weight: 'Вес (кг)', rate: 'Скорость (мкг/кг/мин)' },
        formula: ({ weight, rate }) => {
          const w = parseFloat(weight) || 0;
          const r = parseFloat(rate) || 0;
          const mcgPerMin = w * r;
        const mcgPerHr = mcgPerMin * 60;
        return { result1: mcgPerMin, result2: mcgPerHr };
        },
        units: { result1: 'мкг/мин', result2: 'мкг/ч' },
        labels: { result1: 'Скорость', result2: 'Скорость (в час)' },
      warnings: ['Обычно 0.05–0.5 мкг/кг/мин. Перевод в мл/ч — по концентрации разведения.'],
    },
  
    {
      name: 'Добутамин',
      description: 'Флакон 250 мг (разведение по протоколу)',
      inputs: { weight: 'Вес (кг)', rate: 'Скорость (мкг/кг/мин)' },
      formula: ({ weight, rate }) => {
        const w = parseFloat(weight) || 0;
        const r = parseFloat(rate) || 0;
        const mcgPerMin = w * r;
        return { result1: mcgPerMin, result2: mcgPerMin * 60 };
      },
      units: { result1: 'мкг/мин', result2: 'мкг/ч' },
      labels: { result1: 'Скорость', result2: 'Скорость (в час)' },
      warnings: ['Обычно 2.5–15 мкг/кг/мин. Перевод в мл/ч — по концентрации разведения.'],
    },
  
    {
      name: 'Допамин',
      description: 'Раствор 40 мг/мл — 5 мл (после разведения — по протоколу)',
      inputs: { weight: 'Вес (кг)', rate: 'Скорость (мкг/кг/мин)' },
      formula: ({ weight, rate }) => {
        const w = parseFloat(weight) || 0;
        const r = parseFloat(rate) || 0;
        const mcgPerMin = w * r;
        return { result1: mcgPerMin, result2: mcgPerMin * 60 };
      },
      units: { result1: 'мкг/мин', result2: 'мкг/ч' },
      labels: { result1: 'Скорость', result2: 'Скорость (в час)' },
      warnings: ['Обычно 5–25 мкг/кг/мин. Перевод в мл/ч — по концентрации разведения.'],
    },
  
];

export default group;
