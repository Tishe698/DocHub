// devices.js — дефибрилляторы, которые используются на скорой в Москве и в стационарах РФ, и их ступени
// энергии в ручном режиме. По ступеням расчётная энергия округляется до той, что есть на аппарате.
//
// Где подтверждено использование (закупки и новости 2019–2026):
//  - ССиНМП им. А. С. Пучкова (Москва): LIFEPAK 15 (электроды 2021–2022, аккумуляторы 2023–2025),
//    ZOLL M и R Series (электроды stat-padz, 2023), ZOLL AED Plus и AED Pro (2019–2023),
//    Аксион ДКИ-Н-10 (2021–2023) — по лотам rostender.info; модель московской закупки 2023 года
//    (1200 дефибрилляторов-мониторов с капнометрией, mos.ru 28.11.2023) в открытых источниках не названа;
//  - стационары: corpuls3 (НМИЦ им. Пирогова, ГБУЗ Москвы), Philips HeartStart MRx и Efficia DFM100
//    (сервисные тендеры Москвы 2023–2026), Mindray BeneHeart D3/D6 (Реутовская КБ, 2026; описание
//    типа СИ 79223-20), Аксион ДКИ-Н-11 (регионы РФ, 2026), Nihon Kohden TEC (тендеры РФ, 2026).
//
// Поля: steps — ступени ручного режима, Дж (null — не опубликованы: показываем расчётную энергию);
// childSteps — ступени с детскими электродами, если отличаются; waveform — 'biphasic' | 'monophasic';
// adultDefibFirst / adultEscalation — протокол производителя для дефибрилляции взрослых; aedOnly —
// только АНД (энергию выбирает аппарат: aedAdult / aedChild); sync — есть синхронизированная
// кардиоверсия; pacing — наружная кардиостимуляция: true, 'option' (опция), false, undefined (неизвестно);
// paddles — утюжки вместо клеящихся электродов; spoken — название для диктора;
// note — особенность аппарата для любого режима, defibNote — только для дефибрилляции.

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

export const DEVICES = [
  {
    key: 'axion10',
    label: 'Аксион ДКИ-Н-10 / ДКИ-Н-11',
    short: 'Аксион',
    spoken: 'ДКИ Н 10 или ДКИ Н 11',
    waveform: 'biphasic',
    // РЭ ДКИ-Н-10 и ДКИ-Н-11 (defibrillation.ru): 5, 10, 25, 50, 75, 100, 150, 200, 250, 300, 360 Дж
    steps: [5, 10, 25, 50, 75, 100, 150, 200, 250, 300, 360],
    // ДКИ-Н-11: с детскими электродами энергия выше 150 Дж блокируется
    childSteps: [5, 10, 25, 50, 75, 100, 150],
    sync: true,
    // РЭ ДКИ-Н-11: ЭКС — опция; ДКИ-Н-10: утюжки, синхронизация — по ЭКГ от кабеля отведений (п. 5.2)
    pacing: 'option',
    paddles: true,
    note: 'Аксион: утюжки — гель, прижать с усилием около 10 кг; детские утюжки вставлены во взрослые. Для 250 Дж и выше кнопку выбора удерживать 2–3 с. Синхронизация работает по ЭКГ от кабеля отведений монитора.',
    defibNote:
      'Аксион: стартовая энергия по умолчанию 100 Дж — для дефибрилляции взрослого поставьте не меньше 150.',
  },
  {
    key: 'lifepak15',
    label: 'LIFEPAK 15',
    short: 'LIFEPAK 15',
    spoken: 'Лайфпак',
    waveform: 'biphasic',
    // Stryker LIFEPAK 15 data sheet: 2–10 (каждый), 15, 20, 30, 50, 70, 100, 125, 150, 175, 200,
    // 225, 250, 275, 300, 325, 360 Дж
    steps: [
      ...range(2, 10),
      15,
      20,
      30,
      50,
      70,
      100,
      125,
      150,
      175,
      200,
      225,
      250,
      275,
      300,
      325,
      360,
    ],
    // Протокол производителя взрослым 200–300–360 Дж (АНД: 150–360 Дж, не ниже предыдущего)
    adultDefibFirst: 200,
    adultEscalation: [200, 300, 360],
    sync: true,
    pacing: true,
    defibNote: 'LIFEPAK 15: протокол производителя взрослым 200 → 300 → 360 Дж.',
  },
  {
    key: 'zollR',
    label: 'ZOLL R Series',
    short: 'ZOLL R Series',
    spoken: 'Золл',
    waveform: 'biphasic',
    // ZOLL R Series, руководство Rev. E (9650-0912-29), прил. «Спецификации»: взрослые 1–10, 15, 20, 30,
    // 50, 75, 100, 120, 150, 200 Дж; с педиатрическими электродами 1–10, 15, 20, 30, 50, 70, 85, 100,
    // 120, 150, 200 Дж
    steps: [...range(1, 10), 15, 20, 30, 50, 75, 100, 120, 150, 200],
    childSteps: [...range(1, 10), 15, 20, 30, 50, 70, 85, 100, 120, 150, 200],
    sync: true,
    pacing: true,
    note: 'ZOLL R Series: ступени 70 и 85 Дж — только с детскими электродами OneStep Pediatric; без них — ступени для взрослых.',
    defibNote:
      'ZOLL: протокол производителя взрослым 120 → 150 → 200 Дж (максимум 200); ERC 2025 советует первый разряд не меньше 150 Дж.',
  },
  {
    key: 'philips',
    label: 'Philips HeartStart MRx / Efficia DFM100',
    short: 'Philips',
    spoken: 'Филипс HeartStart MRx или Efficia',
    waveform: 'biphasic',
    // Philips MRx IFU (2020) и Efficia DFM100 spec sheet: 1–10, 15, 20, 30, 50, 70, 100, 120, 150, 170,
    // 200 Дж; рекомендуемая энергия взрослым — 150 Дж
    steps: [...range(1, 10), 15, 20, 30, 50, 70, 100, 120, 150, 170, 200],
    adultDefibFirst: 150,
    sync: true,
    // MRx IFU: стимуляция — опция; DFM100 spec sheet: ЭКС
    pacing: 'option',
    defibNote: 'Philips: рекомендуемая энергия взрослым 150 Дж, максимум 200 Дж.',
  },
  {
    key: 'mindray',
    label: 'Mindray BeneHeart D3 / D6',
    short: 'Mindray',
    spoken: 'Майндрей BeneHeart D3 или D6',
    waveform: 'biphasic',
    // Mindray BeneHeart D3/D6 Specifications: 1–10, 15, 20, 30, 50, 70, 100, 150, 170, 200, 300, 360 Дж
    steps: [...range(1, 10), 15, 20, 30, 50, 70, 100, 150, 170, 200, 300, 360],
    sync: true,
    pacing: true,
  },
  {
    key: 'nihon',
    label: 'Nihon Kohden TEC',
    short: 'Nihon Kohden',
    spoken: 'Нихон Коден',
    waveform: 'biphasic',
    // Nihon Kohden TEC-5600 FT: 2, 3, 5, 7, 10, 15, 20, 30, 50, 70, 100, 150, 200, 270 Дж
    steps: [2, 3, 5, 7, 10, 15, 20, 30, 50, 70, 100, 150, 200, 270],
    sync: true,
    note: 'Nihon Kohden: максимум 270 Дж; ступени сверены по TEC-5600 — у других моделей серии могут отличаться.',
  },
  {
    key: 'corpuls',
    label: 'corpuls3',
    short: 'corpuls3',
    spoken: 'Корпулс',
    waveform: 'biphasic',
    // Брошюра corpuls3: 2–200 Дж, протокол настраивается; ступени не опубликованы
    steps: null,
    max: 200,
    sync: true,
    pacing: true,
    note: 'corpuls3: максимум 200 Дж, ступени в открытых документах не опубликованы — выберите ближайшую.',
  },
  {
    key: 'zollAed',
    label: 'ZOLL AED Plus (АНД)',
    short: 'ZOLL AED Plus',
    spoken: 'Золл, автоматический',
    waveform: 'biphasic',
    steps: null,
    aedOnly: true,
    // Руководство администратора ZOLL AED Plus (9650-0301-29): взрослые 120–150–200 Дж,
    // детские электроды Pedi-padz — 50–70–85 Дж
    aedAdult: [120, 150, 200],
    aedChild: [50, 70, 85],
    sync: false,
    pacing: false,
    note: 'ZOLL AED Plus — автоматический: энергию выбирает сам. Детские электроды Pedi-padz — до 8 лет или 25 кг.',
  },
  {
    key: 'otherBi',
    label: 'Другой бифазный',
    short: 'Другой бифазный',
    spoken: 'аппарат не из списка',
    waveform: 'biphasic',
    steps: null,
    sync: true,
    // ERC 2025 ALS: рекомендации производителя неизвестны — взрослому максимальная энергия
    unknown: true,
    note: 'Модель не в списке: показана расчётная энергия — выберите ближайшую ступень и сверьтесь с инструкцией аппарата.',
  },
  {
    key: 'mono',
    label: 'Монофазный (старый аппарат)',
    short: 'Монофазный',
    spoken: 'старый аппарат',
    waveform: 'monophasic',
    steps: null,
    max: 360,
    sync: true,
    defibNote: 'Монофазный импульс: взрослым при ФЖ — всегда 360 Дж.',
  },
];

export const deviceByKey = (key) => DEVICES.find((d) => d.key === key) || null;

// Максимум аппарата: по ступеням или из поля max (если ступени не опубликованы)
export const deviceMax = (device) =>
  device && Array.isArray(device.steps) && device.steps.length
    ? Math.max(...device.steps)
    : (device && device.max) || null;
