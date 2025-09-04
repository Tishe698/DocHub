const formulas = [
    // --- Адсорбенты / ЖКТ / витамины ---
    {
      name: 'Активированный уголь + алюминия оксид',
      description: 'Порошок 5 г (комб.)',
      inputs: { weight: 'Вес (кг)' }, // диапазон дозы внутрь 300–500 мг/кг, берём нижнюю границу по умолчанию
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 300;
        return { result1: mg, result2: mg / 1000 };
      },
      units: { result1: 'мг', result2: 'г' },
      labels: { result1: 'Доза', result2: 'Доза (граммы)' },
      warnings: ['Диапазон 300–500 мг/кг (0.3–0.5 г/кг).'],
    },
    {
      name: 'Активированный уголь',
      description: 'Таблетки 250 мг',
      inputs: { weight: 'Вес (кг)' }, // 50 мг/кг
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 50;
        return { result1: mg, result2: mg / 250 };
      },
      units: { result1: 'мг', result2: 'таб' },
      labels: { result1: 'Доза', result2: 'Таблетки (≈)' },
    },
  
    // --- Муколитики / антидоты ---
    {
      name: 'Ацетилцистеин',
      description: 'Раствор 100 мг/мл — 3 мл',
      inputs: { weight: 'Вес (кг)' }, // iv нагрузка 150 мг/кг по умолчанию
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 150;
        return { result1: mg, result2: mg / 100 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза (iv нагрузка)', result2: 'Объём' },
      warnings: ['Перорально 70–140 мг/кг; в/в нагрузка 150 мг/кг за 15–30 мин.'],
    },
  
    // --- Витамины ---
    {
      name: 'Аскорбиновая кислота',
      description: 'Раствор 50 мг/мл — 2 мл',
      inputs: { weight: 'Вес (кг)' }, // берём верхнюю границу 7 мг/кг
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 7;
        return { result1: mg, result2: mg / 50 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Максимальная суточная доза 500 мг.'],
    },
  
    // --- Седативные / противосудорожные / нейро ---
    {
      name: 'Диазепам',
      description: 'Раствор 5 мг/мл — 2 мл',
      inputs: { weight: 'Вес (кг)' }, // по умолчанию 0.3 мг/кг iv
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.3;
        return { result1: mg, result2: mg / 5 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: [
        'iv 0.3–0.5 мг/кг; im 0.5 мг/кг.',
        'Макс разовая: ≤5 лет — 5 мг; >5 лет — 10 мг.',
        'iv вводить медленно (≥2 мин); возможен повтор через 5–15 мин.',
      ],
    },
    {
      name: 'Мидазолам',
      description: 'Раствор 5 мг/мл — 1 мл',
      inputs: { weight: 'Вес (кг)' }, // 0.3 мг/кг по умолчанию
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 0.3;
        return { result1: mg, result2: mg / 5 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Диапазон дозы 0.3–0.5 мг/кг.'],
    },
    {
      name: 'Флумазенил',
      description: 'Раствор 0.1 мг/мл — 5 мл',
      inputs: { weight: 'Вес (кг)' }, // 0.01 мг/кг
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 0.01;
        return { result1: mg, result2: mg / 0.1 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Старше 1 года. Антагонист бензодиазепинов.'],
    },
  
    // --- Кардиология / АД / ритмы ---
    {
      name: 'Амиодарон',
      description: 'Раствор 50 мг/мл — 5 мл',
      inputs: { weight: 'Вес (кг)' }, // 5 мг/кг
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 5;
        return { result1: mg, result2: mg / 50 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Разовая доза не более 300 мг.'],
    },
    {
      name: 'Атропин',
      description: 'Раствор 1 мг/мл — 1 мл',
      inputs: { weight: 'Вес (кг)' }, // 0.02 мг/кг по умолчанию
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 0.02;
        return { result1: mg, result2: mg / 1 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Диапазон дозы 0.01–0.02 мг/кг.'],
    },
    {
      name: 'Верапамил',
      description: 'Раствор 2.5 мг/мл — 2 мл',
      inputs: { weight: 'Вес (кг)' }, // 0.1 мг/кг
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 0.1;
        return { result1: mg, result2: mg / 2.5 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Максимум 10 мг.'],
    },
    {
      name: 'Эпинефрин (адреналин)',
      description: 'Раствор 1 мг/мл — 1 мл',
      inputs: { weight: 'Вес (кг)' }, // по умолчанию iv 0.01 мг/кг
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 0.01;
        return { result1: mg, result2: mg / 1 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза (iv)', result2: 'Объём' },
      warnings: ['iv: 0.01 мг/кг (не более 1 мг); эндотрахеально: 0.1 мг/кг.'],
    },
    {
      name: 'Норэпинефрин',
      description: 'Раствор 2 мг/мл — 8 мл',
      inputs: { weight: 'Вес (кг)', rate: 'Скорость (мкг/кг/мин)' }, // укажите rate при расчёте
      formula: ({ weight, rate }) => {
        const w = parseFloat(weight) || 0;
        const r = parseFloat(rate) || 0;
        const mcgPerMin = w * r;
        return { result1: mcgPerMin, result2: mcgPerMin * 60 }; // мкг/мин и мкг/ч
      },
      units: { result1: 'мкг/мин', result2: 'мкг/ч' },
      labels: { result1: 'Скорость', result2: 'Скорость (в час)' },
      warnings: ['Диапазон 0.05–0.5 мкг/кг/мин. Для перевода в мл/ч задайте концентрацию разведения.'],
    },
    {
      name: 'Эналаприлат',
      description: 'Раствор 1.25 мг/мл — 1 мл',
      inputs: {},
      formula: () => ({}),
      warnings: ['Педиатрия: нет данных / старше 18 лет.'],
    },
    {
      name: 'Нитроглицерин',
      description: 'Раствор 1 мг/мл — 10 мл; спрей 0.4 мг',
      inputs: {},
      formula: () => ({}),
      warnings: ['Педиатрия: нет данных / старше 18 лет.'],
    },
    {
      name: 'Нифедипин',
      description: 'Таблетки 10 мг',
      inputs: {},
      formula: () => ({}),
      warnings: ['Педиатрия: нет данных / старше 18 лет.'],
    },
    {
      name: 'Пропранолол',
      description: 'Таблетки 10 мг',
      inputs: {},
      formula: () => ({}),
      warnings: ['Педиатрия: нет данных / старше 18 лет.'],
    },
    {
      name: 'Каптоприл',
      description: 'Таблетки 25 мг',
      inputs: {},
      formula: () => ({}),
      warnings: ['Педиатрия: нет данных / старше 18 лет.'],
    },
    {
      name: 'Моксонидин',
      description: 'Таблетки 0.4 мг',
      inputs: {},
      formula: () => ({}),
      warnings: ['Педиатрия: нет данных / старше 18 лет.'],
    },
    {
      name: 'Клонидин',
      description: 'Раствор 0.1 мг/мл — 1 мл',
      inputs: {},
      formula: () => ({}),
      warnings: ['Педиатрия: нет данных / старше 18 лет.'],
    },
    {
      name: 'Урапидил',
      description: 'Раствор 5 мг/мл — 5 мл',
      inputs: {},
      formula: () => ({}),
      warnings: ['Педиатрия: нет данных / старше 18 лет.'],
    },
  
    // --- Инфузии и объёмы ---
    {
      name: 'ГЭК 6%',
      description: 'Раствор 6% — 250 мл',
      inputs: { weight: 'Вес (кг)' }, // 10 мл/кг по умолчанию
      formula: ({ weight }) => {
        const ml = (parseFloat(weight) || 0) * 10;
        return { result1: ml };
      },
      units: { result1: 'мл' },
      labels: { result1: 'Объём' },
    },
    {
      name: 'Декстран',
      description: 'Инфузионный раствор',
      inputs: { weight: 'Вес (кг)' }, // 10 мл/кг по умолчанию
      formula: ({ weight }) => {
        const ml = (parseFloat(weight) || 0) * 10;
        return { result1: ml };
      },
      units: { result1: 'мл' },
      labels: { result1: 'Объём' },
    },
    {
      name: 'Натрия хлорид 0.9%',
      description: 'Раствор — 250 мл',
      inputs: { weight: 'Вес (кг)' }, // 10 мл/кг по умолчанию
      formula: ({ weight }) => {
        const ml = (parseFloat(weight) || 0) * 10;
        return { result1: ml };
      },
      units: { result1: 'мл' },
      labels: { result1: 'Объём' },
    },
    {
      name: 'Декстроза (глюкоза) 10% / 5% / 400 мг/мл',
      description: '10% — 500 мл; 5% — 250 мл; 400 мг/мл — 10 мл',
      inputs: { weight: 'Вес (кг)' }, // болюс 2 мл/кг по умолчанию
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        return { result1: w * 2, result2: w * 10 }; // болюс 2 мл/кг, инфузия 10 мл/кг
      },
      units: { result1: 'мл', result2: 'мл' },
      labels: { result1: 'Болюс (ориентир)', result2: 'Инфузия (ориентир)' },
      warnings: ['До 1 года/1–6 лет/старше 6 — ориентиры 2 мл/кг болюсно; инфузия 10–20 мл/кг.'],
    },
    {
      name: 'Вода для инъекций',
      description: 'Ампулы 5 мл',
      inputs: { volume: 'Требуемый объём (мл)' },
      formula: ({ volume }) => ({ result1: parseFloat(volume) || 0 }),
      units: { result1: 'мл' },
      labels: { result1: 'Объём' },
      warnings: ['Рекомендованный объём 10–20 мл (по списку).'],
    },
    {
      name: 'Калия хлорид + натрия ацетат + натрия хлорид',
      description: 'Инфузия — 400 мл',
      inputs: { weight: 'Вес (кг)' }, // 15 мл/кг по умолчанию
      formula: ({ weight }) => ({ result1: (parseFloat(weight) || 0) * 15 }),
      units: { result1: 'мл' },
      labels: { result1: 'Объём' },
      warnings: ['Скорость 20–30 кап/мин (уточняйте протокол).'],
    },
    {
      name: 'Калия хлорид + кальция хлорид + натрия хлорид',
      description: 'Инфузия — 500 мл',
      inputs: { weight: 'Вес (кг)' }, // 20 мл/кг по умолчанию
      formula: ({ weight }) => ({ result1: (parseFloat(weight) || 0) * 20 }),
      units: { result1: 'мл' },
      labels: { result1: 'Объём' },
    },
  
    // --- Бронхолитики / респираторные ---
    {
      name: 'Будесонид (небула)',
      description: 'Суспензия 0.5 мг/мл — 2 мл',
      inputs: {},
      formula: () => ({ result1: 1, result2: 1 / 0.5 }), // 1 мг (2 мл)
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
        const drops = age < 6 ? Math.min(Math.round(w), 10) : 20;
        return { result1: drops };
      },
      units: { result1: 'кап' },
      labels: { result1: 'Капли' },
      warnings: ['До 6 лет — 1 капля/кг, не более 10; старше 6 лет — до 20 капель.'],
    },
    {
      name: 'Сальбутамол',
      description: 'Раствор 1 мг/мл — 2.5 мл (небула)',
      inputs: {},
      formula: () => ({ result1: 2.5, result2: 2.5 }),
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Старше 2 лет. Разовая доза 2.5 мг.'],
    },
  
    // --- НПВС / анальгетики / антигистаминные ---
    {
      name: 'Кеторолак',
      description: 'Раствор 30 мг/мл — 1 мл',
      inputs: {},
      formula: () => ({ result1: 30, result2: 1 }),
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Только с 16 лет. 1 мл в/м или в/в.'],
    },
    {
      name: 'Трамадол',
      description: 'Раствор 50 мг/мл — 2 мл',
      inputs: { weight: 'Вес (кг)' }, // 1 мг/кг по умолчанию
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 1;
        return { result1: mg, result2: mg / 50 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Старше 1 года. Допустимо 1–2 мг/кг. Не более 100 мг каждые 6 ч.'],
    },
    {
      name: 'Хлоропирамин',
      description: 'Раствор 20 мг/мл — 1 мл',
      inputs: { ageYears: 'Возраст (лет)' },
      formula: ({ ageYears }) => {
        const a = Math.max(0, parseFloat(ageYears) || 0);
        const ml = Math.min(1, a * 0.1); // 0.1 мл/год, макс 1 мл
        const mg = ml * 20;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Максимально 1 мл. (Супрастин)'],
    },
    {
      name: 'Дифенгидрамин',
      description: 'Раствор 10 мг/мл — 1 мл',
      inputs: { ageMonths: 'Возраст (мес)', ageYears: 'Возраст (лет)' },
      formula: ({ ageMonths = 0, ageYears = 0 }) => {
        const months = parseFloat(ageMonths) || 0;
        const years = parseFloat(ageYears) || 0;
        let ml = 0;
        if (months >= 7 && years < 1) ml = 0.3; // минимальная из 0.3–0.5
        else if (years >= 1 && years <= 3) ml = 0.5; // 0.5–1.0
        else if (years >= 4) return { result1: 10, result2: 1 }; // не более 10 мг
        const mg = ml * 10;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Старше 7 месяцев. У ≥4 лет — не более 10 мг.'],
    },
    {
      name: 'Этилметилгидроксипиридина сукцинат',
      description: 'Раствор 50 мг/мл — 5 мл',
      inputs: {},
      formula: () => ({}),
      warnings: ['Педиатрия: нет данных / старше 18 лет.'],
    },
  
    // --- Антибиотики / коагуляция ---
    {
      name: 'Цефтриаксон',
      description: 'Флакон 1 г',
      inputs: { weight: 'Вес (кг)' }, // 50 мг/кг, максимум 2 г
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 50;
        return { result1: Math.min(mg, 2000) };
      },
      units: { result1: 'мг' },
      labels: { result1: 'Доза' },
      warnings: ['Максимальная доза 2 г. Разведение — по протоколу.'],
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
    {
      name: 'Гепарин натрия',
      description: 'Раствор 5000 ЕД/мл — 1 мл',
      inputs: { weight: 'Вес (кг)' }, // 75 ЕД/кг
      formula: ({ weight }) => {
        const units = (parseFloat(weight) || 0) * 75;
        const ml = units / 5000;
        return { result1: units, result2: ml };
      },
      units: { result1: 'ЕД', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
    },
    {
      name: 'Эноксапарин натрия',
      description: '10000 анти-Xa МЕ/мл',
      inputs: {},
      formula: () => ({}),
      warnings: ['Педиатрия: нет данных / старше 18 лет.'],
    },
    {
      name: 'Этамзилат',
      description: 'Раствор 125 мг/мл — 2 мл',
      inputs: { weight: 'Вес (кг)' }, // 12.5 мг/кг, макс 500 мг
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 12.5;
        const mgCap = Math.min(mg, 500);
        return { result1: mgCap, result2: mgCap / 125 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Максимальная доза 500 мг.'],
    },
  
    // --- Психотропные / противорвотные / спазмолитики ---
    {
      name: 'Галоперидол',
      description: 'Раствор 5 мг/мл — 1 мл',
      inputs: { weight: 'Вес (кг)' }, // 0.025 мг/кг, макс 0.075 мг/кг
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.025;
        const mgMax = w * 0.075;
        return { result1: Math.min(mg, mgMax), result2: mg / 5 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза (≤0.075 мг/кг)', result2: 'Объём' },
      warnings: ['Старше 3 лет.'],
    },
    {
      name: 'Хлорпромазин',
      description: 'Раствор 25 мг/мл — 1 мл',
      inputs: { weight: 'Вес (кг)' }, // 0.25 мг/кг по умолчанию
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 0.25;
        return { result1: mg, result2: mg / 25 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Старше 6 месяцев.'],
    },
    {
      name: 'Дроперидол',
      description: 'Раствор 2.5 мг/мл — 2 мл',
      inputs: { weight: 'Вес (кг)' }, // 0.1 мг/кг
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 0.1;
        return { result1: mg, result2: mg / 2.5 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Старше 3 лет.'],
    },
    {
      name: 'Дротаверин',
      description: 'Раствор 20 мг/мл — 2 мл',
      inputs: { ageYears: 'Возраст (лет)' }, // ориентир по возрасту
      formula: ({ ageYears }) => {
        const a = Math.max(0, parseFloat(ageYears) || 0);
        let ml = 0;
        if (a < 6) ml = a * 0.1; // 0.1–0.2 мл/год — нижняя граница
        else if (a <= 12) ml = 1.5; // 1–2 мл — среднее
        else return {};
        const mg = ml * 20;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['В списке указано 18+; детские схемы есть — ориентируйтесь на локальные протоколы.'],
    },
    {
      name: 'Метоклопрамид',
      description: 'Раствор 5 мг/мл — 2 мл',
      inputs: { weight: 'Вес (кг)' }, // 0.1 мг/кг
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.1;
        const ml = mg / 5;
        const maxMl = w < 40 ? 1 : 2; // до 12 лет ~ <40 кг — макс 1 мл; старше — 2 мл
        return { result1: Math.min(mg, maxMl * 5), result2: Math.min(ml, maxMl) };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза (огр.)', result2: 'Объём (огр.)' },
      warnings: ['Старше 2 лет. До 12 лет — не более 1 мл; с 12 лет — до 2 мл.'],
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
  
    // --- Опиоиды / антидоты ---
    {
      name: 'Морфин',
      description: 'Раствор 10 мг/мл — 1 мл',
      inputs: { weight: 'Вес (кг)' }, // 0.1 мг/кг по умолчанию
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 0.1;
        return { result1: mg, result2: mg / 10 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
    },
    {
      name: 'Налоксон',
      description: 'Раствор 0.4 мг/мл — 1 мл',
      inputs: { weight: 'Вес (кг)' }, // 0.02 мг/кг по умолчанию
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 0.02;
        return { result1: mg, result2: mg / 0.4 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['iv медленно (2–3 мин). Возможен повтор через 2–3 мин.'],
    },
    {
      name: 'Фентанил',
      description: 'Раствор 50 мкг/мл — 1 мл',
      inputs: { weight: 'Вес (кг)' }, // 1 мкг/кг по умолчанию
      formula: ({ weight }) => {
        const mcg = (parseFloat(weight) || 0) * 1;
        const ml = mcg / 50;
        return { result1: mcg, result2: ml };
      },
      units: { result1: 'мкг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Допустимо 1–4 мкг/кг.'],
    },
  
    // --- Миорелаксанты / анестетики ---
    {
      name: 'Пропофол',
      description: 'Эмульсия 10 мг/мл — 20 мл',
      inputs: { weight: 'Вес (кг)' }, // 2 мг/кг по умолчанию
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 2;
        return { result1: mg, result2: mg / 10 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Старше 1 месяца. Допустимо 2–4 мг/кг.'],
    },
    {
      name: 'Тиопентал натрия',
      description: 'Порошок 1000 мг (разведение по протоколу)',
      inputs: { weight: 'Вес (кг)' }, // 1 мг/кг по умолчанию
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 1;
        return { result1: mg };
      },
      units: { result1: 'мг' },
      labels: { result1: 'Доза' },
    },
    {
      name: 'Суксаметония хлорид',
      description: 'Раствор 20 мг/мл — 5 мл',
      inputs: { weight: 'Вес (кг)' }, // 2 мг/кг
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 2;
        return { result1: mg, result2: mg / 20 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Старше 1 года.'],
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
      warnings: ['Старше 3 месяцев. В 1–14 лет 0.05–0.06 мг/кг.'],
    },
  
    // --- Метаболические / прочее ---
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
  
    // --- Противосудорожные ---
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
      warnings: ['Старше 6 мес. 6 мес–10 лет: 15–50 мг/кг; >10 лет: 15 мг/кг.'],
    },
  
    // --- Бета-агонисты / инотропы ---
    {
      name: 'Добутамин',
      description: 'Флакон 250 мг (разведение по протоколу)',
      inputs: { weight: 'Вес (кг)', rate: 'Скорость (мкг/кг/мин)' },
      formula: ({ weight, rate }) => {
        const mcgPerMin = (parseFloat(weight) || 0) * (parseFloat(rate) || 0);
        return { result1: mcgPerMin, result2: mcgPerMin * 60 };
      },
      units: { result1: 'мкг/мин', result2: 'мкг/ч' },
      labels: { result1: 'Скорость', result2: 'Скорость (в час)' },
      warnings: ['2.5–15 мкг/кг/мин. Перевод в мл/ч — по концентрации разведения.'],
    },
    {
      name: 'Допамин',
      description: 'Раствор 40 мг/мл — 5 мл',
      inputs: { weight: 'Вес (кг)', rate: 'Скорость (мкг/кг/мин)' },
      formula: ({ weight, rate }) => {
        const mcgPerMin = (parseFloat(weight) || 0) * (parseFloat(rate) || 0);
        return { result1: mcgPerMin, result2: mcgPerMin * 60 };
      },
      units: { result1: 'мкг/мин', result2: 'мкг/ч' },
      labels: { result1: 'Скорость', result2: 'Скорость (в час)' },
      warnings: ['5–25 мкг/кг/мин. Перевод в мл/ч — по концентрации разведения.'],
    },
  
    // --- Антидоты / прочее ---
    {
      name: 'Димеркаптопропансульфонат натрия (унитиол)',
      description: 'Раствор 50 мг/мл — 5 мл',
      inputs: { weight: 'Вес (кг)' }, // 0.1 мл/кг
      formula: ({ weight }) => {
        const ml = (parseFloat(weight) || 0) * 0.1;
        return { result1: ml * 50, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
    },
    {
      name: 'Натрия тиосульфат',
      description: 'Раствор 300 мг/мл — 10 мл',
      inputs: {},
      formula: () => ({}),
      warnings: ['Старше 18 лет (по списку).'],
    },
    {
      name: 'Натрия гидрокарбонат 5%',
      description: 'Раствор 5% — 200 мл',
      inputs: {},
      formula: () => ({}),
      warnings: ['Не применять (по списку).'],
    },
  
    // --- Дополнительно из вашего списка ---
    {
      name: 'Кальция глюконат',
      description: 'Раствор 100 мг/мл — 10 мл (вводить тёплый 1% медленно)',
      inputs: { weight: 'Вес (кг)', ageYears: 'Возраст (лет)' }, // 0.2 мл/кг; до 14 лет макс 5 мл; с 14 лет — 10 мл
      formula: ({ weight, ageYears }) => {
        const w = parseFloat(weight) || 0;
        const a = parseFloat(ageYears) || 0;
        const ml = w * 0.2;
        const maxMl = a < 14 ? 5 : 10;
        const mlCapped = Math.min(ml, maxMl);
        return { result1: mlCapped * 100, result2: mlCapped }; // мг и мл
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза (мг)', result2: 'Объём (мл)' },
      warnings: ['В/в МЕДЛЕННО! Тёплый 1% р-р. До 14 лет макс 5 мл; с 14 лет — 10 мл.'],
    },
    {
      name: 'Карбоксим',
      description: 'Раствор 150 мг/мл — 1 мл',
      inputs: { ageYears: 'Возраст (лет)' }, // 0.1 мл/год
      formula: ({ ageYears }) => {
        const ml = (parseFloat(ageYears) || 0) * 0.1;
        return { result1: ml * 150, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['При отравлениях ФОС; путь – в/м.'],
    },
    {
      name: 'Кетамин',
      description: 'Раствор 50 мг/мл — 2 мл',
      inputs: { weight: 'Вес (кг)' }, // 1 мг/кг по умолчанию
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 1;
        return { result1: mg, result2: mg / 50 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза (миним.)', result2: 'Объём' },
      warnings: ['Допустимо 1–2 мг/кг. Противопоказания см. протоколы.'],
    },
    {
      name: 'Метамизол натрия + питофенон + фенпивериния бромид',
      description: 'Раствор — 5 мл',
      inputs: { ageYears: 'Возраст (лет)' },
      formula: ({ ageYears }) => {
        const a = parseFloat(ageYears) || 0;
        let ml = 0;
        if (a < 1) ml = 0.1;       // 3–11 мес: 0.1 мл
        else if (a <= 4) ml = 0.2; // 1–4 года: 0.2 мл
        else if (a <= 11) ml = 0.4; // 8–11 лет: 0.4 мл (по списку)
        else if (a <= 14) ml = 0.8; // 12–14 лет: 0.8 мл
        else ml = 1.0;
        return { result2: ml, result3: 'Повторное введение возможно однократно в разовой дозе.' };
      },
      units: { result2: 'мл' },
      labels: { result2: 'Объём' },
      warnings: ['Старше 3 месяцев.'],
    },
    {
      name: 'Метамизол натрия',
      description: 'Раствор 500 мг/мл — 2 мл',
      inputs: { weight: 'Вес (кг)' }, // 10 мг/кг
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 10;
        return { result1: mg, result2: mg / 500 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
    },
    {
      name: 'Парацетамол',
      description: 'Таблетки 500 мг',
      inputs: { weight: 'Вес (кг)' }, // 15 мг/кг
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 15;
        return { result1: mg, result2: mg / 500 };
      },
      units: { result1: 'мг', result2: 'таб' },
      labels: { result1: 'Доза', result2: 'Таблетки (≈)' },
      warnings: ['Старше 1 месяца.'],
    },
    {
      name: 'Ацетилсалициловая кислота',
      description: 'Таблетки 500 мг',
      inputs: { weight: 'Вес (кг)' }, // 20 мг/кг по умолчанию (диапазон 20–30)
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 20;
        return { result1: mg, result2: mg / 500 };
      },
      units: { result1: 'мг', result2: 'таб' },
      labels: { result1: 'Доза (миним.)', result2: 'Таблетки (≈)' },
      warnings: ['Старше 16 лет. Диапазон 20–30 мг/кг.'],
    },
    {
      name: 'Дексаметазон',
      description: 'Раствор 4 мг/мл — 1 мл',
      inputs: { weight: 'Вес (кг)' }, // 0.2 мг/кг по умолчанию (диапазон 0.2–1.2)
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 0.2;
        return { result1: mg, result2: mg / 4 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза (миним.)', result2: 'Объём' },
    },
    {
      name: 'Лидокаин',
      description: 'Раствор 20 мг/мл — 2 мл (парентерально 1% раствор)',
      inputs: { weight: 'Вес (кг)' }, // 1 мг/кг
      formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 1;
        return { result1: mg, result2: mg / 20 };
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
      warnings: ['Парентерально использовать 1% раствор.'],
    },
    {
      name: 'Лидокаин спрей 10%',
      description: 'Аэрозоль 10% — 650 доз/38 мл',
      inputs: {},
      formula: () => ({ result1: 1 }),
      units: { result1: 'доз' },
      labels: { result1: 'Рекомендовано' },
      warnings: ['Местное применение: 1–2 дозы.'],
    },
    {
      name: 'Фенилэфрин',
      description: 'Раствор 10 мг/мл — 1 мл',
      inputs: {},
      formula: () => {
        const ml = 0.1;
        return { result1: ml * 10, result2: ml }; // 1 мг и 0.1 мл
      },
      units: { result1: 'мг', result2: 'мл' },
      labels: { result1: 'Доза', result2: 'Объём' },
    },
  
    // --- Заглушки (только 18+) ---
    { name: 'Эсмолол', description: 'Раствор 10 мг/мл — 10 мл', inputs: {}, formula: () => ({}), warnings: ['Старше 18 лет.'] },
    { name: 'Изосорбида динитрат (раствор)', description: '1 мг/мл — 10 мл', inputs: {}, formula: () => ({}), warnings: ['Старше 18 лет.'] },
    { name: 'Изосорбида динитрат (спрей)', description: '1.25 мг/доза — 15 мл', inputs: {}, formula: () => ({}), warnings: ['Старше 18 лет.'] },
    { name: 'Инозин + никотинамид + рибофлавин + янтарная кислота', description: 'Раствор 100 мг/мл — 10 мл', inputs: {}, formula: () => ({}), warnings: ['Старше 18 лет.'] },
    { name: 'Калия и магния аспарагинат', description: 'Инфузия — 250 мл', inputs: {}, formula: () => ({}), warnings: ['Старше 18 лет.'] },
    { name: 'Окситоцин', description: '5 МЕ/мл — 1 мл', inputs: {}, formula: () => ({}), warnings: ['Старше 18 лет.'] },
    { name: 'Тенектеплаза', description: 'Лиофилизат (по массе)', inputs: {}, formula: () => ({}), warnings: ['Старше 18 лет.'] },
    { name: 'Бромдигидрохлорфенилбензодиазепин (таблетка)', description: '1 мг', inputs: {}, formula: () => ({}), warnings: ['Старше 18 лет.'] },
    { name: 'Бромгидрохлорфенилбензодиазепин (раствор)', description: '1 мг/мл — 1 мл', inputs: {}, formula: () => ({}), warnings: ['Старше 18 лет.'] },
    { name: 'Метопролол', description: 'Раствор 1 мг/мл — 5 мл', inputs: {}, formula: () => ({}), warnings: ['Старше 18 лет.'] },
    { name: 'Клопидогрел', description: 'Таблетки 75 мг', inputs: {}, formula: () => ({}), warnings: ['Старше 18 лет.'] },
    { name: 'Прокаин', description: 'Раствор 5 мг/мл — 5 мл', inputs: { weight: 'Вес (кг)' }, formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 10; return { result1: mg, result2: mg / 5 };
      }, units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза', result2: 'Объём' }, warnings: ['Старше 12 лет. Доза 10–20 мг/кг.'] },
    { name: 'Прокаинамид', description: 'Раствор 100 мг/мл — 5 мл', inputs: { weight: 'Вес (кг)' }, formula: ({ weight }) => {
        const mg = (parseFloat(weight) || 0) * 10; return { result1: mg, result2: mg / 100 };
      }, units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза', result2: 'Объём' } },
  
    {
      name: 'Активированный уголь + алюминия оксид 5 г',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 300.0;
        
        return { result1: mg };
      },
      units: { result1: 'мг' }, labels: { result1: 'Доза (миним.)' }, warnings: ['Диапазон: 300 - 500 мг/кг (0.3 - 0.5 г/кг)', 'ограничений нет']
    },
    {
      name: 'Активированный уголь 250 мг',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 50.0;
        
        return { result1: mg };
      },
      units: { result1: 'мг' }, labels: { result1: 'Доза (миним.)' }, warnings: ['ограничений нет']
    },
    {
      name: 'Аминометилбензойная кислота 10 мг/мл - 5 мл',
      description: '',
      inputs: {}, 
      formula: () => ({ result1: 100, result2: 100/10.0 }),
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза', result2: 'Объём' }, warnings: ['старше 14 лет']
    },
    {
      name: 'Аминофиллин 24 мг/мл - 10 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 4.0;
        const ml = mg / 24.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['Диапазон: 4-5 мг/кг', 'ограничений нет']
    },
    {
      name: 'Амиодарон 50 мг/мл - 5мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 5.0;
        const ml = mg / 50.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['5 мг/кг в/венно (разовая доза не более З00 мг)', 'ограничений нет']
    },
    {
      name: 'Аскорбиновая кислота 50 мг/мл - 2мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 5.0;
        const ml = mg / 50.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['Диапазон: 5-7 мг/кг (максимальная суточная 500 мг)', 'ограничений нет']
    },
    {
      name: 'Атропин 1 мг/мл - 1мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.01;
        const ml = mg / 1.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['Диапазон: 0,01 - 0,02 мг/кг', 'ограничений нет']
    },
    {
      name: 'Ацетилсалициловая кислота 500 мг',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.0;
        
        return { result1: mg };
      },
      units: { result1: 'мг' }, labels: { result1: 'Доза (миним.)' }, warnings: ['Диапазон: 20 - З0 мг/кг', 'старше 16 лет']
    },
    {
      name: 'Ацетилцистеин 100 мг/мл - Змл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 70.0;
        const ml = mg / 100.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['Диапазон: 70 - 140 мг/кг внутрь, 150 мг/кг в/венно за 15 - 30 мин.', 'ограничений нет']
    },
    {
      name: 'Бромдигидрохлорфенилбензодиазепин 1 мг',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Бромгидрохлорфенилбензодиазепин 1 мг/мл - 1мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Будесонид 0,5 мг/мл - 2 мл (небула)',
      description: '',
      inputs: {}, 
      formula: () => ({ result1: 2, result2: 2/0.5 }),
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза', result2: 'Объём' }, warnings: ['старше 6 месяцев']
    },
    {
      name: 'Вальпроевая кислота 100 мг/мл - 5 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 15.0;
        const ml = mg / 100.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['Диапазон: С 6 мес. до 10 лет - 15-50 мг/кг; старше 10 лет - 15 мг/кг', 'старше 6 месяцев']
    },
    {
      name: 'Верапамил 2,5 мг/мл - 2 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.1;
        const ml = mg / 2.5;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['ограничений нет']
    },
    {
      name: 'Вода для инъекций 5 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['ограничений нет']
    },
    {
      name: 'Галантамин 2,5 мг/мл - 1мл',
      description: '',
      inputs: {}, 
      formula: () => ({ result1: 1, result2: 1/2.5 }),
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза', result2: 'Объём' }, warnings: ['старше 1 года']
    },
    {
      name: 'Галоперидол 5 мг/мл - 1мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.025;
        const ml = mg / 5.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['старше 3 лет']
    },
    {
      name: 'Гепарин натрия 5000 МЕ/мл - 1мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['ограничений нет']
    },
    {
      name: 'Эноксапарин натрия 10000 анти-Ха МЕ/мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'ГЭК 6% - 250 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['ограничений нет']
    },
    {
      name: 'Дексаметазон 4 мг/мл - 1мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.2;
        const ml = mg / 4.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['Диапазон: 0,2 - 1,2 мг/кг', 'ограничений нет']
    },
    {
      name: 'Декстроза 10% - 500 мл, Декстроза 5% - 250 мл Декстроза 400 мг/мл - 10 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['ограничений нет']
    },
    {
      name: 'Диазепам 5 мг/ мл - 2 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.3;
        
        return { result1: mg };
      },
      units: { result1: 'мг' }, labels: { result1: 'Доза (миним.)' }, warnings: ['Диапазон: 0,3-0,5 мг/кг - в/венно; 0,5 мг/кг - в/мышечно (максимальная разовая доза: до 5 лет - 5 мг; старше 5 лет - 10 мг), в/венно вводить медленно - не менее 2-х минут, повторное введение через 5 - 15 мин. в разовой дозе', 'ограничений нет']
    },
    {
      name: 'Димеркаптопропансульфонат натрия 50 мг/мл - 5 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['ограничений нет']
    },
    {
      name: 'Дифенгидрамин 10 мг/мл - 1мл',
      description: '',
      inputs: {}, 
      formula: () => ({ result1: 5, result2: 5/10.0 }),
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза', result2: 'Объём' }, warnings: ['старше 7 месяцев']
    },
    {
      name: 'Добутамин 250 мг',
      description: '',
      inputs: { weight: 'Вес (кг)', rate: 'Скорость (мг/кг/мин)' },
      formula: ({ weight, rate }) => {
        const w = parseFloat(weight) || 0;
        const r = parseFloat(rate) || 0;
        const mgPerMin = w * (r || 0.0025);
        
        return { result1: mgPerMin };
      },
      units: { result1: 'мг/мин' }, labels: { result1: 'Доза' }, warnings: ['Диапазон: 2,5 - 15 мкг/кг/мин', 'ограничений нет']
    },
    {
      name: 'Допамин 40 мг/мл - 5 мл',
      description: '',
      inputs: { weight: 'Вес (кг)', rate: 'Скорость (мг/кг/мин)' },
      formula: ({ weight, rate }) => {
        const w = parseFloat(weight) || 0;
        const r = parseFloat(rate) || 0;
        const mgPerMin = w * (r || 0.005);
        const mlPerMin = mgPerMin / 40.0;
        return { result1: mgPerMin, result2: mlPerMin };
      },
      units: { result1: 'мг/мин', result2: 'мл/мин' }, labels: { result1: 'Доза', result2: 'Скорость (объём)' }, warnings: ['Диапазон: 5 - 25 мкг/кг/мин', 'ограничений нет']
    },
    {
      name: 'Дроперидол 2,5 мг/мл - 2 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.1;
        const ml = mg / 2.5;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['старше 3 лет']
    },
    {
      name: 'Дротаверин 20 мг/мл - 2мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Изосорбида динитрат 1 мг/мл - 10 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Изосорбида динитрат спрей 1,25 мг/доза 300 доз - 15 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Инозин + никотинамид + рибофлавин + янтарная кислота 100 мг/мл - 10 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Ипратропия бромид + фенотерол 20 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['ограничений нет']
    },
    {
      name: 'Калия и магния аспарагинат 250 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Калия хлорид + натрия ацетат + натрия хлорид - 400 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['ограничений нет']
    },
    {
      name: 'Калия хлорид + кальция хлорид + натрия хлорид - 500 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['ограничений нет']
    },
    {
      name: 'Кальция глюконат 100 мг/мл - 10мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['ограничений нет']
    },
    {
      name: 'Каптоприл 25 мг',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Карбоксим 150 мг/мл - 1 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['ограничений нет']
    },
    {
      name: 'Кетамин 50 мг/мл - 2 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 1.0;
        const ml = mg / 50.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['Диапазон: 1-2 мг/кг', 'ограничений нет']
    },
    {
      name: 'Кеторолак 30 мг/мл - 1мл',
      description: '',
      inputs: {}, 
      formula: () => ({ result1: 30, result2: 30/30.0 }),
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза', result2: 'Объём' }, warnings: ['старше 16 лет']
    },
    {
      name: 'Клонидин 0,1 мг/мл - 1 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Клопидогрел 75 мг',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Лидокаин 20 мг/мл - 2 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 1.0;
        const ml = mg / 20.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['ограничений нет']
    },
    {
      name: 'Лидокаин спрей 10% - 650 доз/38,0',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['ограничений нет']
    },
    {
      name: 'Магния сульфат 250 мг/мл - 10мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 50.0;
        const ml = mg / 250.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['Диапазон: 50 мг/кг: 13 мл в разведении натрия хлорида 0,9% - 250 мл в/венно капельно 2 кап/кг в мин. - строго 30 мин', 'ограничений нет']
    },
    {
      name: 'Меглюмина натрия сукцинат 1,5% - 500 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 10.0;
        
        return { result1: mg };
      },
      units: { result1: 'мг' }, labels: { result1: 'Доза (миним.)' }, warnings: ['ограничений нет']
    },
    {
      name: 'Метамизол натрия + питофенон + фенпивериния бромид - 5 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 3 месяцев']
    },
    {
      name: 'Метамизол натрия 500 мг/мл - 2 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 10.0;
        const ml = mg / 500.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['ограничений нет']
    },
    {
      name: 'Метоклопрамид 5 мг/мл - 2 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.1;
        const ml = mg / 5.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['Диапазон: 0,1 мг/кг (0,02 мл/кг), максимальная доза 1 мл до 12 лет; с 12 лет - 2 мл', 'старше 2 лет']
    },
    {
      name: 'Метопролол 1 мг/мл - 5 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Мидазолам 5 мг/мл - 1мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.3;
        const ml = mg / 5.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['Диапазон: 0,3 - 0,5 мг/кг', 'ограничений нет']
    },
    {
      name: 'Моксонидин 0,4 мг',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Морфин 10 мг/мл - 1мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.1;
        const ml = mg / 10.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['Диапазон: 0,1 - 0,2 мг/кг', 'ограничений нет']
    },
    {
      name: 'Налоксон 0,4 мг/мл - 1 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.01;
        const ml = mg / 0.4;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['Диапазон: 0,01 - 0,02 мг/кг', 'ограничений нет']
    },
    {
      name: 'Натрия гидрокарбонат 5% - 200 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['Старше 18 лет.']
    },
    {
      name: 'Натрия тиосульфат 300 мг/мл - 10 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Натрия хлорид 0,9% - 250 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['ограничений нет']
    },
    {
      name: 'Нитроглицерин 1 мг/мл - 10 мл, спрей 0,4 мг',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Нифедипин 10 мг',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Норэпинефрин 2 мг/мл - 8 мл',
      description: '',
      inputs: { weight: 'Вес (кг)', rate: 'Скорость (мг/кг/мин)' },
      formula: ({ weight, rate }) => {
        const w = parseFloat(weight) || 0;
        const r = parseFloat(rate) || 0;
        const mgPerMin = w * (r || 5e-05);
        const mlPerMin = mgPerMin / 2.0;
        return { result1: mgPerMin, result2: mlPerMin };
      },
      units: { result1: 'мг/мин', result2: 'мл/мин' }, labels: { result1: 'Доза', result2: 'Скорость (объём)' }, warnings: ['Диапазон: 0,05 - 0,5 мкг/кг/мин', 'ограничений нет']
    },
    {
      name: 'Окситоцин 5 МЕ/мл - 1мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Парацетамол 500 мг',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 15.0;
        
        return { result1: mg };
      },
      units: { result1: 'мг' }, labels: { result1: 'Доза (миним.)' }, warnings: ['старше 1 месяца']
    },
    {
      name: 'Пипекурония бромид 4 мг',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.05;
        
        return { result1: mg };
      },
      units: { result1: 'мг' }, labels: { result1: 'Доза (миним.)' }, warnings: ['Диапазон: С 3-х мес - 0,04 мг/кг, 1-14 лет - 0,05-0,06 мг/кг', 'старше 3 месяцев']
    },
    {
      name: 'Пиридоксин 50 мг/мл - 1мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['ограничений нет']
    },
    {
      name: 'Платифиллин 2 мг/мл - 1мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.035;
        const ml = mg / 2.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['Диапазон: До 1 года - 0,035 мг/кг, 1 - 5 лет - 0, 03мг/кг, 6-10 лет - 0,025 мг/кг, 11 - 14 лет - 0,02 мг/кг', 'ограничений нет']
    },
    {
      name: 'Преднизолон 30 мг/мл - 1мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 3.0;
        const ml = mg / 30.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['Диапазон: 3 - 5 мг/кг', 'ограничений нет']
    },
    {
      name: 'Прокаин 5 мг/мл - 5 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 10.0;
        const ml = mg / 5.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['Диапазон: 10 - 20 мг/кг', 'старше 12 лет']
    },
    {
      name: 'Прокаинамид 100 мг/мл - 5 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 10.0;
        const ml = mg / 100.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['ограничений нет']
    },
    {
      name: 'Пропофол 10 мг/мл - 20 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 2.0;
        const ml = mg / 10.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['Диапазон: 2 - 4 мг/кг', 'старше 1 месяца']
    },
    {
      name: 'Пропранолол 10 мг',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Сальбутамол 1 мг/мл - 2,5 мл',
      description: '',
      inputs: {}, 
      formula: () => ({ result1: 5, result2: 5/1.0 }),
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза', result2: 'Объём' }, warnings: ['старше 2 лет']
    },
    {
      name: 'Стрептомицин 1г',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 20.0;
        
        return { result1: mg };
      },
      units: { result1: 'мг' }, labels: { result1: 'Доза (миним.)' }, warnings: ['ограничений нет']
    },
    {
      name: 'Суксаметония хлорид 20 мг/мл - 5 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 2.0;
        const ml = mg / 20.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['старше 1 года']
    },
    {
      name: 'Сульфацетамид 20% - 1,3 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['ограничений нет']
    },
    {
      name: 'Тиамин 50 мг/мл - 1мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['ограничений нет']
    },
    {
      name: 'Тиопентал натрия 1000 мг',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 1.0;
        
        return { result1: mg };
      },
      units: { result1: 'мг' }, labels: { result1: 'Доза (миним.)' }, warnings: ['Диапазон: 1-2 мг/кг', 'ограничений нет']
    },
    {
      name: 'Трамадол 50 мг/мл - 2 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 1.0;
        const ml = mg / 50.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['Диапазон: 1 - 2 мг/кг', 'старше 1 года']
    },
    {
      name: 'Транексамовая кислота 50 мг/мл - 5 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 10.0;
        const ml = mg / 50.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['старше 2 лет']
    },
    {
      name: 'Трифосаденин 10 мг/мл - 1мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.1;
        const ml = mg / 10.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['Диапазон: 0,1 - 0,2 мг/кг (максимальная доза 1 мл)', 'ограничений нет']
    },
    {
      name: 'Урапидил 5 мг/мл - 5 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Фенилэфрин 10 мг/мл - 1 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['ограничений нет']
    },
    {
      name: 'Фентанил 50 мкг/мл - 1 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['ограничений нет']
    },
    {
      name: 'Фильтрум 400 мг',
      description: '',
      inputs: {}, 
      formula: () => ({ result1: 200 }),
      units: { result1: 'мг' }, labels: { result1: 'Доза' }, warnings: ['ограничений нет']
    },
    {
      name: 'Флумазенил 0,1 мг/мл - 5 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.01;
        const ml = mg / 0.1;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['старше 1 года']
    },
    {
      name: 'Фуросемид 10 мг/мл - 2 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 1.0;
        const ml = mg / 10.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['Диапазон: 1 - 2 мг/кг', 'ограничений нет']
    },
    {
      name: 'Хлорамфеникол 1 г',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 50.0;
        
        return { result1: mg };
      },
      units: { result1: 'мг' }, labels: { result1: 'Доза (миним.)' }, warnings: ['старше 6 месяцев']
    },
    {
      name: 'Хлоргексидин 0,05% - 100 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 7 лет']
    },
    {
      name: 'Хлоропирамин 20 мг/мл - 1 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['ограничений нет']
    },
    {
      name: 'Хлорпромазин 25 мг/мл - 1 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.25;
        const ml = mg / 25.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['Диапазон: 0,25 - 1 мг/кг', 'старше 6 месяцев']
    },
    {
      name: 'Цефтриаксон 1 г/фл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 50.0;
        
        return { result1: mg };
      },
      units: { result1: 'мг' }, labels: { result1: 'Доза (миним.)' }, warnings: ['ограничений нет']
    },
    {
      name: 'Цинка бисвинилимидазоладиацетат 60 мг/мл - 1 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['ограничений нет']
    },
    {
      name: 'Эналаприлат 1,25 мг/мл - 1 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Эпинефрин 1 мг/мл - 1 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 0.01;
        const ml = mg / 1.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['0,01 мг/кг в/венно (но не более 1 мг для разового введения); 0,1 мг/кг эндотрахеально', 'ограничений нет']
    },
    {
      name: 'Эсмолол 10 мг/мл - 10 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Этамзилат 125 мг/мл - 2 мл',
      description: '',
      inputs: { weight: 'Вес (кг)' },
      formula: ({ weight }) => {
        const w = parseFloat(weight) || 0;
        const mg = w * 12.5;
        const ml = mg / 125.0;
        return { result1: mg, result2: ml };
      },
      units: { result1: 'мг', result2: 'мл' }, labels: { result1: 'Доза (миним.)', result2: 'Объём' }, warnings: ['ограничений нет']
    },
    {
      name: 'Этилметилгидроксипиридинасукцинат 50 мг/мл - 5 мл',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    },
    {
      name: 'Терлипрессин',
      description: '',
      inputs: {}, 
      formula: () => ({}),
      units: {}, labels: {}, warnings: ['старше 18 лет']
    }
  ];
  
  export default formulas;
  