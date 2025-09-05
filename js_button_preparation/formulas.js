// formulas.js — обновлено для СМП (педиатрия/подростки), 2025

const formulas = [
    // --- ТОКСИКОЛОГИЯ И ПРОТИВОСУДОРОЖНЫЕ ---
  
    {
      name: 'Активированный уголь',
      description: 'Порошок/суспензия (разовая доза)',
      inputs: { weight: 'Вес (кг)' }, // 1 г/кг, практич. максимум 50 г у детей
        formula: ({ weight }) => {
          const w = parseFloat(weight) || 0;
        const g = Math.min(w * 1, 50);
        const mg = g * 1000;
        return { result1: mg, result2: g };
        },
        units: { result1: 'мг', result2: 'г' },
      labels: { result1: 'Доза (мг)', result2: 'Доза (г)' },
      warnings: ['Обычно 1 г/кг однократно; оценить риск аспирации и показания.'],
      },
  
    {
        name: 'Ацетилцистеин',
      description: 'Раствор 100 мг/мл — 3 мл (в/в нагрузка при отравлении парацетамолом)',
      inputs: { weight: 'Вес (кг)' }, // нагрузка 150 мг/кг
        formula: ({ weight }) => {
          const w = parseFloat(weight) || 0;
          const mg = w * 150;
          return { result1: mg, result2: mg / 100 };
        },
        units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза (нагрузка)', result2: 'Объём' },
      warnings: ['Дальнейшие этапы инфузии — по локальному протоколу.'],
      },
  
    {
        name: 'Диазепам',
      description: 'Раствор 5 мг/мл — 2 мл (IV при судорогах)',
      inputs: { weight: 'Вес (кг)' }, // 0.2 мг/кг, макс 10 мг
        formula: ({ weight }) => {
          const w = parseFloat(weight) || 0;
        const mg = Math.min(w * 0.2, 10);
        const ml = mg / 5;
        return { result1: mg, result2: ml };
        },
        units: { result1: 'мг', result2: 'мл' },
        labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['IV 0.2 мг/кг, макс 10 мг; вводить медленно, возможен повтор через 5–10 мин.'],
      },
  
    {
        name: 'Мидазолам',
      description: 'Раствор 5 мг/мл — 1 мл (IV при судорогах)',
      inputs: { weight: 'Вес (кг)' }, // IV 0.1 мг/кг
        formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.1;
        const ml = mg / 5;
        return { result1: mg, result2: ml };
        },
        units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза (IV)', result2: 'Объём' },
      warnings: ['Судороги: IV 0.1 мг/кг; IN 0.2 мг/кг; титровать по эффекту.'],
      },
  
    {
        name: 'Флумазенил',
        description: 'Раствор 0.1 мг/мл — 5 мл',
        inputs: { weight: 'Вес (кг)' }, // 0.01 мг/кг
        formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.01;
          return { result1: mg, result2: mg / 0.1 };
        },
        units: { result1: 'мг', result2: 'мл' },
        labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Старше 1 года. Антагонист бензодиазепинов; риск судорог при ТЦА.'],
    },
  
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
  
    // --- ВЗРОСЛЫЕ/БЕЗ ПЕДИАТРИЧЕСКИХ ДАННЫХ (оставлено для полноты списка) ---
  
    { name: 'Эналаприлат', description: 'Раствор 1.25 мг/мл — 1 мл', inputs: {}, formula: () => ({}), warnings: ['Педиатрия: нет данных / 18+'] },
    { name: 'Нитроглицерин', description: 'Раствор 1 мг/мл — 10 мл; спрей 0.4 мг', inputs: {}, formula: () => ({}), warnings: ['Педиатрия: нет данных / 18+'] },
    { name: 'Нифедипин', description: 'Таблетки 10 мг', inputs: {}, formula: () => ({}), warnings: ['Педиатрия: нет данных / 18+'] },
    { name: 'Пропранолол', description: 'Таблетки 10 мг', inputs: {}, formula: () => ({}), warnings: ['Педиатрия: нет данных / 18+'] },
    { name: 'Каптоприл', description: 'Таблетки 25 мг', inputs: {}, formula: () => ({}), warnings: ['Педиатрия: нет данных / 18+'] },
    { name: 'Моксонидин', description: 'Таблетки 0.4 мг', inputs: {}, formula: () => ({}), warnings: ['Педиатрия: нет данных / 18+'] },
    { name: 'Клонидин', description: 'Раствор 0.1 мг/мл — 1 мл', inputs: {}, formula: () => ({}), warnings: ['Педиатрия: нет данных / 18+'] },
    { name: 'Урапидил', description: 'Раствор 5 мг/мл — 5 мл', inputs: {}, formula: () => ({}), warnings: ['Педиатрия: нет данных / 18+'] },
    { name: 'Эноксапарин натрия', description: '10000 анти-Xa МЕ/мл', inputs: {}, formula: () => ({}), warnings: ['Педиатрия: нет данных / 18+'] },
    { name: 'Терлипрессин', description: 'Вазоактивный препарат', inputs: {}, formula: () => ({}), warnings: ['Педиатрия: нет данных / 18+'] },
    { name: 'Эсмолол', description: 'Раствор 10 мг/мл — 10 мл', inputs: {}, formula: () => ({}), warnings: ['Педиатрия: нет данных / 18+'] },
    { name: 'Метопролол', description: 'Раствор 1 мг/мл — 5 мл', inputs: {}, formula: () => ({}), warnings: ['Педиатрия: нет данных / 18+'] },
    { name: 'Клопидогрел', description: 'Таблетки 75 мг', inputs: {}, formula: () => ({}), warnings: ['Педиатрия: нет данных / 18+'] },
    { name: 'Окситоцин', description: '5 МЕ/мл — 1 мл', inputs: {}, formula: () => ({}), warnings: ['Акушерство; педиатрия — нет данных / 18+'] },
    { name: 'Изосорбида динитрат (раствор/спрей)', description: '1 мг/мл — 10 мл / 1.25 мг/доза', inputs: {}, formula: () => ({}), warnings: ['Педиатрия: нет данных / 18+'] },
    { name: 'Инозин + никотинамид + рибофлавин + янтарная кислота', description: 'Раствор 100 мг/мл — 10 мл', inputs: {}, formula: () => ({}), warnings: ['Педиатрия: нет данных / 18+'] },
    { name: 'Хлоргексидин 0.05% - 100 мл', description: 'Антисептик', inputs: {}, formula: () => ({}), warnings: ['Наружно; возрастные ограничения см. инструкцию'] },
    { name: 'Сульфацетамид 20% - 1.3 мл', description: 'Капли глазные', inputs: {}, formula: () => ({}), warnings: ['Возрастные ограничения см. инструкцию'] },
    { name: 'Натрия тиосульфат 300 мг/мл - 10 мл', description: 'Антидот (цианиды и др.)', inputs: {}, formula: () => ({}), warnings: ['Педиатрия — по спец. протоколам / 18+'] },
    { name: 'Натрия гидрокарбонат 5%', description: 'Раствор 5% — 200 мл', inputs: {}, formula: () => ({}), warnings: ['Не применять (по локальному списку)'] },
    { name: 'Этилметилгидроксипиридина сукцинат', description: 'Раствор 50 мг/мл — 5 мл', inputs: {}, formula: () => ({}), warnings: ['Педиатрия: нет данных / 18+'] },
  ];
    
    export default formulas;
    