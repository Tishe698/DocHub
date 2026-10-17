// CalculateIntubationTube.js
// Подбор эндотрахеальной трубки (ЭТТ) для СМП.
// Порядок выбора метода:
//   новорождённый (<1 мес) с известной массой → неонатальная таблица по массе;
//   рост в пределах ленты Broselow (46,8–143,3 см) → зона Broselow по длине;
//   ребёнок 1–12 лет → формулы по возрасту (PALS/ERC/APLS);
//   младенец 1–12 мес → зона Broselow по массе (масса известна или оценена по возрасту, APLS;
//     масса на 2 зоны выше ожидаемой для возраста — зона по возрасту с предупреждением);
//   возраст неизвестен → зона Broselow по массе (≤36 кг);
//   подросток 13–15 лет / рост >143,3 см без возраста → по возрасту и росту, не больше взрослых размеров;
//   с 16 лет → размеры для взрослых по полу.
// Переключатель «с манжетой» учитывается во всех ветках.
// Клиническая справка: положение трубки подтверждается клинически
// (капнография EtCO2, аускультация, экскурсия грудной клетки, при возможности — рентген).

const roundToHalf = (x) => Math.round(x * 2) / 2;
const fmt = (x) => String(x).replace('.', ',');
const fmtMm = (x) => x.toFixed(1).replace('.', ',');

// Названия зон Broselow на экране.
// Границы длины тела и массы — лента Broselow-Luten (Wikipedia «Broselow tape», таблица зон).
// Размеры ЭТТ без/с манжетой — County of San Diego EMS P-117a (2009), карта по цветам Broselow:
// серая/розовая и красная 3,5/3,0; фиолетовая 4,0/3,5; жёлтая 4,5/4,0; белая 5,0/4,5;
// синяя 5,5/5,0; оранжевая 6,0/5,5; зелёная 6,5/6,0.
// На самой ленте для оранжевой/зелёной зоны указано 6,0/6,5 мм с манжетой (NC DEPS);
// источники расходятся — выбран меньший (более безопасный) размер, он совпадает с PALS
// (возраст/4 + 3,5 для 8 и 10 лет). Это написано в примечании на экране.
// Глубина (оральная, у губ):
//   серая 3 и 4 кг — неонатальная таблица по массе (Kempley 2008 / NRP: 2,5–3,1 кг → 8,5; 3,2–4,2 кг → 9,0);
//   серая 5 кг, розовая, красная (младенцы) — 3 × ID без манжеты = 10,5 см (PALS; для 5 кг совпадает
//   с Lau 2006: масса/2 + 8); назальная — оральная + 1 см (Lau 2006: масса/2 + 9 против масса/2 + 8).
//   С фиолетовой зоны — APLS по типичному возрасту зоны (Wikipedia «Broselow tape»: фиолетовая 1 год,
//   жёлтая 2, белая 4, синяя 6, оранжевая 8, зелёная 10 лет): через рот возраст/2 + 12,
//   назально возраст/2 + 15. Это совпадает с расчётом по возрасту и на 0,5–2,5 см мельче 3 × ID
//   (меньше риск интубации бронха); 3 × ID показан для сверки.
// Глубина не зависит от манжеты: она определяется ребёнком, а не выбором трубки.
const BROSELOW_ZONES = [
  { key: 'grey3',  name: 'серая (3 кг)', minCm: 46.8,  maxCm: 51.9,  w: '3',     idU: 3.5, idC: null, oral: 8.5,  nasal: 9.5 },
  { key: 'grey4',  name: 'серая (4 кг)', minCm: 51.9,  maxCm: 55.0,  w: '4',     idU: 3.5, idC: 3.0,  oral: 9.0,  nasal: 10.0 },
  { key: 'grey5',  name: 'серая (5 кг)', minCm: 55.0,  maxCm: 59.2,  w: '5',     idU: 3.5, idC: 3.0,  oral: 10.5, nasal: 11.5 },
  { key: 'pink',   name: 'розовая',      minCm: 59.2,  maxCm: 66.9,  w: '6–7',   idU: 3.5, idC: 3.0,  oral: 10.5, nasal: 11.5 },
  { key: 'red',    name: 'красная',      minCm: 66.9,  maxCm: 74.2,  w: '8–9',   idU: 3.5, idC: 3.0,  oral: 10.5, nasal: 11.5 },
  { key: 'purple', name: 'фиолетовая',   minCm: 74.2,  maxCm: 83.8,  w: '10–11', idU: 4.0, idC: 3.5,  age: 1 },
  { key: 'yellow', name: 'жёлтая',       minCm: 83.8,  maxCm: 95.4,  w: '12–14', idU: 4.5, idC: 4.0,  age: 2 },
  { key: 'white',  name: 'белая',        minCm: 95.4,  maxCm: 108.3, w: '15–18', idU: 5.0, idC: 4.5,  age: 4 },
  { key: 'blue',   name: 'синяя',        minCm: 108.3, maxCm: 121.5, w: '19–23', idU: 5.5, idC: 5.0,  age: 6 },
  { key: 'orange', name: 'оранжевая',    minCm: 121.5, maxCm: 130.7, w: '24–29', idU: 6.0, idC: 5.5,  age: 8 },
  { key: 'green',  name: 'зелёная',      minCm: 130.7, maxCm: 143.3, w: '30–36', idU: 6.5, idC: 6.0,  age: 10 },
].map((z) => (z.age === undefined ? z : { ...z, oral: z.age / 2 + 12, nasal: z.age / 2 + 15 }));
const TAPE_MIN_CM = 46.8;
const TAPE_MAX_CM = 143.3;

// Поиск зоны по массе. Промежутки между зонами ленты (например, 7,5 или 11,5 кг)
// отнесены к меньшей зоне — меньшая трубка безопаснее (консервативный выбор).
// Масса <4,3 кг сюда не попадает: для неё — неонатальная таблица.
const WEIGHT_ZONE_UPPER = [
  { key: 'grey5', maxKg: 6 },
  { key: 'pink', maxKg: 8 },
  { key: 'red', maxKg: 10 },
  { key: 'purple', maxKg: 12 },
  { key: 'yellow', maxKg: 15 },
  { key: 'white', maxKg: 19 },
  { key: 'blue', maxKg: 24 },
  { key: 'orange', maxKg: 30 },
  { key: 'green', maxKg: 37 },
];
const WEIGHT_TAPE_MAX_KG = 37; // зелёная зона 30–36 кг

const zoneByKey = (key) => BROSELOW_ZONES.find((z) => z.key === key);
const zoneByHeight = (h) =>
  BROSELOW_ZONES.find((z, i) => h >= z.minCm && (h < z.maxCm || (i === BROSELOW_ZONES.length - 1 && h <= z.maxCm)));
const zoneByWeight = (w) => {
  const row = WEIGHT_ZONE_UPPER.find((r) => w < r.maxKg);
  return row ? zoneByKey(row.key) : null;
};
// Индекс «основной» зоны (три серые подзоны считаются одной) — для сверки роста и массы.
const zoneRank = (z) => (z.key.startsWith('grey') ? 0 : BROSELOW_ZONES.indexOf(z) - 2);

// Неонатальная таблица.
// Диаметр: NRP (AAP/AHA): <1 кг — 2,5; 1–2 кг — 3,0; >2 кг — 3,5 мм (без манжеты).
// Глубина (оральная, у губы): Kempley 2008 / NRP — по массе:
// 0,5–0,6 кг 5,5; 0,7–0,8 — 6,0; 0,9–1,0 — 6,5; 1,1–1,4 — 7,0; 1,5–1,8 — 7,5;
// 1,9–2,4 — 8,0; 2,5–3,1 — 8,5; 3,2–4,2 — 9,0 см (таблица 1, PMC8145890).
// Промежутки между строками отнесены к меньшей глубине (консервативно).
// Таблица заменяет правило «6 + масса» (Tochen 1979), которое переоценивает глубину при массе <750 г.
const NEONATAL_DEPTH = [
  { maxKg: 0.7, oral: 5.5 },
  { maxKg: 0.9, oral: 6.0 },
  { maxKg: 1.1, oral: 6.5 },
  { maxKg: 1.5, oral: 7.0 },
  { maxKg: 1.9, oral: 7.5 },
  { maxKg: 2.5, oral: 8.0 },
  { maxKg: 3.2, oral: 8.5 },
  { maxKg: 4.3, oral: 9.0 },
];
const NEONATAL_MAX_KG = 4.2; // верхняя строка таблицы Kempley

// Трубка с манжетой у младенцев: 3,0 мм при массе >3,5 кг (MSD Manual, Pediatric ETT size).
const CUFFED_MIN_KG = 3.5;

const CONFIRM_NOTE =
  'Подтвердите положение: капнография (EtCO2), аускультация с обеих сторон, экскурсия грудной клетки; при возможности — рентген.';
const CUFF_TYPE_NOTE =
  'Размер с манжетой — для тонкостенных трубок с манжетой низкого давления; для обычной манжеточной трубки берите меньшую альтернативу (на 0,5 мм меньше) (MSD Manual).';

const alternatives = (id) => [roundToHalf(id - 0.5), roundToHalf(id + 0.5)].filter((x) => x >= 2.5);

const tubeTypeLabel = (cuffedUsed) => (cuffedUsed ? 'с манжетой' : 'без манжеты');

function buildResult({ method, tubeID, cuffedUsed, oral, nasal, route, extra = {} }) {
  return {
    method,
    tubeIDmm: tubeID,
    cuffedUsed,
    tubeType: tubeTypeLabel(cuffedUsed),
    alternativesMm: alternatives(tubeID),
    depthOralCm: oral,
    depthNasalCm: nasal,
    recommendedDepthCm: route === 'oral' ? oral : (route === 'nasal' ? nasal : undefined),
    ...extra,
  };
}

/**
 * Новорождённые: неонатальная таблица по массе (≤4,2 кг).
 */
function calculateForNeonate({ weightKg, cuffed = false, route = 'both' }) {
  if (typeof weightKg !== 'number' || !isFinite(weightKg) || weightKg <= 0) {
    throw new Error('Для новорождённого укажите массу (кг) или рост (см).');
  }
  let tubeID;
  if (weightKg < 1) tubeID = 2.5;
  else if (weightKg < 2) tubeID = 3.0;
  else tubeID = 3.5;

  const notes = [];
  const warnings = [];
  let cuffedUsed = false;
  if (cuffed) {
    if (weightKg > CUFFED_MIN_KG && tubeID === 3.5) {
      tubeID = 3.0; // MSD Manual: 3,0 мм с манжетой при массе >3,5 кг
      cuffedUsed = true;
      notes.push(CUFF_TYPE_NOTE);
    } else {
      warnings.push('Трубки с манжетой при массе ≤3,5 кг не применяются — показан размер без манжеты.');
    }
  }

  const row = NEONATAL_DEPTH.find((r) => weightKg < r.maxKg) || NEONATAL_DEPTH[NEONATAL_DEPTH.length - 1];
  const oral = row.oral;
  // Назальная у новорождённых и младенцев на 1 см глубже оральной (Lau 2006: масса/2 + 9 против масса/2 + 8).
  const nasal = roundToHalf(oral + 1);

  if (weightKg < 0.5) {
    warnings.push('Масса <0,5 кг ниже неонатальной таблицы: показана глубина для 0,5–0,6 кг, обязателен рентген-контроль.');
  } else if (weightKg < 0.75) {
    // Peterson 2006 (J Perinatol): у детей <750 г формулы по массе дают избыточную глубину.
    warnings.push('Масса <750 г: глубина может быть избыточной — обязателен рентген-контроль.');
  }

  notes.push('Глубина — по неонатальной таблице по массе (NRP / Kempley 2008).', CONFIRM_NOTE);

  return buildResult({
    method: 'neonate',
    tubeID,
    cuffedUsed,
    oral,
    nasal,
    route,
    extra: { inputs: { weightKg, route }, warnings, notes },
  });
}

/**
 * Зона Broselow (по росту или по массе).
 */
function calculateByZone(zone, { cuffed, route, method }) {
  const notes = [];
  const warnings = [];
  let tubeID = zone.idU;
  let cuffedUsed = false;
  if (cuffed) {
    if (zone.idC != null) {
      tubeID = zone.idC;
      cuffedUsed = true;
      notes.push(CUFF_TYPE_NOTE);
      if (zone.key === 'orange' || zone.key === 'green') {
        notes.push(
          `На ленте Broselow для этой зоны указано ${fmtMm(zone.idU)} мм с манжетой; выбран меньший размер (PALS: возраст/4 + 3,5), ${fmtMm(zone.idU)} мм — в альтернативах.`
        );
      }
    } else {
      warnings.push('Трубки с манжетой при массе ≤3,5 кг не применяются — показан размер без манжеты.');
    }
  }
  const oral = zone.oral;
  const nasal = zone.nasal;
  if (zone.key === 'grey3' || zone.key === 'grey4') {
    notes.push('Глубина — по неонатальной таблице по массе (NRP / Kempley 2008); назальная на 1 см глубже.');
  } else if (zone.age === undefined) {
    notes.push('Глубина через рот = 3 × ID без манжеты (PALS); назальная на 1 см глубже (Lau 2006).');
  } else {
    notes.push(
      `Глубина по APLS для типичного возраста зоны (${zone.age} ${zone.age === 1 ? 'год' : (zone.age < 5 ? 'года' : 'лет')}): через рот возраст/2 + 12, назально возраст/2 + 15.`,
      `Сверка: 3 × ID = ${fmt(roundToHalf(3 * zone.idU))} см (PALS).`
    );
  }
  if (method === 'broselowWeight') {
    notes.push('Расчёт по массе менее точен, чем по длине тела: при возможности измерьте рост (длину) ребёнка.');
  }
  notes.push(CONFIRM_NOTE);

  return buildResult({
    method,
    tubeID,
    cuffedUsed,
    oral,
    nasal,
    route,
    extra: {
      broselowZone: zone.name,
      broselowZoneKey: zone.key,
      zoneRange: `${fmt(zone.minCm)}–${fmt(zone.maxCm)} см`,
      approxWeightKg: zone.w,
      warnings,
      notes,
    },
  });
}

/**
 * Дети 1–12 лет: формулы по возрасту.
 * Без манжеты: возраст/4 + 4; с манжетой: возраст/4 + 3,5 (PALS 2020, ERC 2021) — для 2–12 лет.
 * 1–2 года: ERC 2021 (таблица ЭТТ) даёт диапазоны 4,0–4,5 без манжеты и 3,5–4,0 с манжетой,
 * AHA 2020 — 3,5 мм с манжетой; выбран нижний (более безопасный) размер: 4,0 / 3,5,
 * он совпадает с фиолетовой зоной Broselow (≈1 год). Большая альтернатива показана.
 * Глубина: оральная возраст/2 + 12, назальная возраст/2 + 15 (APLS; назальная — также Lau 2006).
 * Формулы не применяются после 12 лет (PALS: 2–10 лет) — для ≥13 лет ветка взрослых.
 */
function calculateByAge({ ageYears, cuffed = false, route = 'both' }) {
  if (typeof ageYears !== 'number' || !isFinite(ageYears) || ageYears < 1 || ageYears >= 13) {
    throw new Error('Расчёт по возрасту — для детей от 1 до 12 лет.');
  }
  let idU;
  let idC;
  let formulaNote;
  if (ageYears < 2) {
    idU = 4.0;
    idC = 3.5;
    formulaNote = '1–2 года: 4,0 мм без манжеты / 3,5 мм с манжетой (ERC 2021, AHA 2020); при необходимости — на 0,5 мм больше.';
  } else {
    idU = roundToHalf(ageYears / 4 + 4.0);
    idC = roundToHalf(ageYears / 4 + 3.5);
    formulaNote = 'Формула: без манжеты возраст/4 + 4 мм; с манжетой возраст/4 + 3,5 мм (PALS, ERC).';
  }
  const tubeID = cuffed ? idC : idU;
  const oral = roundToHalf(ageYears / 2 + 12);
  const nasal = roundToHalf(ageYears / 2 + 15);
  const control = roundToHalf(3 * idU);

  const notes = [formulaNote];
  if (cuffed) notes.push(CUFF_TYPE_NOTE);
  notes.push(
    'Глубина: через рот возраст/2 + 12 см, назальная возраст/2 + 15 см (APLS).',
    `Сверка: 3 × ID = ${fmt(control)} см (PALS).`,
    CONFIRM_NOTE
  );

  return buildResult({
    method: 'age',
    tubeID,
    cuffedUsed: !!cuffed,
    oral,
    nasal,
    route,
    extra: { inputs: { ageYears, cuffed, route }, warnings: [], notes },
  });
}

/**
 * Взрослые (с 16 лет): по полу. Подростки 13–15 лет — calculateTeen.
 * Диаметр: женщины 7,0 мм, мужчины 8,0 мм (нижняя граница принятых диапазонов 7,0–7,5 и 8,0–8,5;
 * консервативный выбор; альтернативы ±0,5 мм).
 * Глубина у резцов: 21 см у женщин, 23 см у мужчин (общепринятая практика; PMC5103140 —
 * контрольный метод фиксации 21/23 см).
 * Назальная (у ноздри): ≈26 см у женщин, ≈28 см у мужчин (средние измеренные 26,6 и 28,9 см,
 * «Estimation of optimal nasotracheal tube depth in adult patients», 2017; округлено вниз).
 */
const ADULT = {
  female: { id: 7.0, oral: 21, nasal: 26 },
  male: { id: 8.0, oral: 23, nasal: 28 },
};

function calculateAdult({ sex, cuffed = false, route = 'both', reason }) {
  if (sex !== 'female' && sex !== 'male') {
    throw new Error(`${reason} Выберите пол — размер трубки у взрослых зависит от пола.`);
  }
  const female = sex === 'female';
  const { id: tubeID, oral, nasal } = ADULT[sex];
  const warnings = [];
  const notes = [reason];
  if (!cuffed) {
    notes.push('У взрослых применяют трубки с манжетой — размер дан для трубки с манжетой.');
  }
  notes.push(
    'Невысоким пациентам чаще подходит меньшая альтернатива.',
    `Глубина у резцов ≈ ${oral} см (${female ? 'женщины' : 'мужчины'}).`,
    CONFIRM_NOTE
  );
  return buildResult({
    method: 'adult',
    tubeID,
    cuffedUsed: true,
    oral,
    nasal,
    route,
    extra: { inputs: { sex, route }, warnings, notes },
  });
}

// Глубина у губ по росту для детей и подростков (оральная, см) — Ebenebe C.U. et al.,
// Emerg Med J 2023;40(8):583–587 (PMC10423483), таблица по росту (рентген-контроль, 0–17,9 лет;
// по росту различий между полами нет). Строки 143–146 → 19,0 … 178–181 → 23,0 см.
// Промежутки между строками отнесены к меньшей глубине (консервативно).
// Значения таблицы не глубже формулы Morgan & Steward (рост/10 + 5, Can Anaesth Soc J 1982).
const HEIGHT_DEPTH_TEEN = [
  { maxCm: 147, oral: 19.0 },
  { maxCm: 152, oral: 19.5 },
  { maxCm: 156, oral: 20.0 },
  { maxCm: 161, oral: 20.5 },
  { maxCm: 165, oral: 21.0 },
  { maxCm: 169, oral: 21.5 },
  { maxCm: 174, oral: 22.0 },
  { maxCm: 178, oral: 22.5 },
  { maxCm: 182, oral: 23.0 },
];
const TEEN_MAX_AGE = 16; // ветка подростков: 13–15 лет включительно
const TEEN_DEFAULT_AGE = 13; // без возраста при росте >143,3 см — как для 13 лет (наименьший размер ветки)

/**
 * Подростки 13–15 лет и рост >143,3 см без возраста.
 * Диаметр — по возрасту (PALS 2020 / ERC 2021: без манжеты возраст/4 + 4, с манжетой возраст/4 + 3,5),
 * но не больше взрослого размера для пола (Ж 7,0 / М 8,0 мм) — Math.min.
 * Без возраста диаметр считается как для 13 лет (консервативно: наименьший размер ветки).
 * Глубина: при известном росте — таблица Ebenebe 2023, иначе APLS возраст/2 + 12;
 * в обоих случаях не глубже взрослой глубины для пола (21 / 23 см) — Math.min.
 * Назальная = оральная + 3 см (разница формул APLS возраст/2 + 15 и возраст/2 + 12),
 * не глубже взрослой назальной (26 / 28 см).
 * Прежде подросткам давались взрослые 8,0 мм / 23 см — на 1–1,5 мм и 2,5–4,5 см больше.
 */
function calculateTeen({ ageYears, heightCm, sex, cuffed = false, route = 'both', reason }) {
  if (sex !== 'female' && sex !== 'male') {
    throw new Error(`${reason} Выберите пол — предельный размер трубки у подростков зависит от пола.`);
  }
  const adult = ADULT[sex];
  const female = sex === 'female';
  const ageKnown = isNum(ageYears);
  const a = ageKnown ? ageYears : TEEN_DEFAULT_AGE;

  const warnings = [];
  const notes = [reason];
  const limitNotes = [];

  const idRaw = roundToHalf(a / 4 + (cuffed ? 3.5 : 4.0));
  const tubeID = Math.min(idRaw, adult.id);
  if (idRaw > adult.id) {
    limitNotes.push(`Диаметр ограничен взрослым размером: ${fmtMm(adult.id)} мм (${female ? 'женщины' : 'мужчины'}).`);
  }

  let oralRaw;
  let depthSource;
  const hRow = isNum(heightCm) ? HEIGHT_DEPTH_TEEN.find((r) => heightCm < r.maxCm) : undefined;
  if (isNum(heightCm) && heightCm > TAPE_MAX_CM) {
    oralRaw = hRow ? hRow.oral : adult.oral;
    depthSource = `по росту ${fmt(heightCm)} см (Ebenebe 2023)`;
  } else {
    oralRaw = roundToHalf(a / 2 + 12);
    depthSource = 'по возрасту: возраст/2 + 12 (APLS)';
  }
  const oral = Math.min(oralRaw, adult.oral);
  const nasal = Math.min(roundToHalf(oral + 3), adult.nasal);
  if (oralRaw > adult.oral) {
    limitNotes.push(`Глубина ограничена взрослой: ${adult.oral} см у резцов.`);
  }

  warnings.push(
    `Подросток: взрослые размеры (${fmtMm(adult.id)} мм / ${adult.oral} см) могут быть велики — показаны ${fmtMm(tubeID)} мм и ${fmt(oral)} см у губ. Глубже — риск интубации бронха.`
  );
  if (!ageKnown) {
    warnings.push('Возраст не указан: диаметр — как для 13 лет. Укажите возраст: ребёнку до 12 лет — расчёт по возрасту, с 16 лет — взрослые размеры.');
  }

  notes.push(
    `Диаметр: ${cuffed ? 'с манжетой возраст/4 + 3,5' : 'без манжеты возраст/4 + 4'} мм (PALS, ERC), не больше взрослого размера.`
  );
  if (cuffed) notes.push(CUFF_TYPE_NOTE);
  else notes.push('Подросткам обычно применяют трубку с манжетой.');
  notes.push(`Глубина ${depthSource}, не глубже взрослой; назальная = оральная + 3 см (APLS).`);
  if (ageKnown && isNum(heightCm) && heightCm > TAPE_MAX_CM) {
    notes.push(`Сверка по возрасту (APLS возраст/2 + 12): ${fmt(roundToHalf(a / 2 + 12))} см.`);
  }
  notes.push(...limitNotes, CONFIRM_NOTE);

  // Альтернативы: ±0,5 мм и взрослый размер для пола.
  const alts = [...new Set([...alternatives(tubeID), adult.id])].filter((x) => x !== tubeID).sort((p, q) => p - q);

  return buildResult({
    method: 'teen',
    tubeID,
    cuffedUsed: !!cuffed,
    oral,
    nasal,
    route,
    extra: {
      alternativesMm: alts,
      limits: { maxTubeIDmm: adult.id, maxDepthOralCm: adult.oral, maxDepthNasalCm: adult.nasal },
      warnings,
      notes,
    },
  });
}

// Оценка массы младенца по возрасту — APLS 2011: 0–12 мес (0,5 × мес) + 4.
const aplsInfantWeight = (months) => 0.5 * months + 4;

const isNum = (x) => typeof x === 'number' && isFinite(x);

function validate({ heightCm, ageYears, ageMonths, weightKg }) {
  if (heightCm !== undefined && (!isNum(heightCm) || heightCm < 30 || heightCm > 230)) {
    throw new Error('Рост должен быть от 30 до 230 см.');
  }
  if (weightKg !== undefined) {
    if (!isNum(weightKg) || weightKg <= 0) throw new Error('Масса должна быть больше 0 кг.');
    if (weightKg > 250) throw new Error('Масса больше 250 кг — похоже, введены граммы. Введите массу в килограммах.');
    if (weightKg < 0.3) throw new Error('Масса меньше 0,3 кг — проверьте ввод (масса в килограммах).');
  }
  if (ageYears !== undefined && (!isNum(ageYears) || ageYears < 0 || ageYears > 120)) {
    throw new Error('Возраст (годы) должен быть от 0 до 120.');
  }
  if (ageMonths !== undefined) {
    if (!isNum(ageMonths) || ageMonths < 0) throw new Error('Месяцы не могут быть отрицательными.');
    if (isNum(ageYears) && ageYears >= 1 && ageMonths > 11) {
      throw new Error('При указанных годах месяцы — от 0 до 11.');
    }
    if (ageMonths > 36) throw new Error('Месяцы — не больше 36; старший возраст укажите в годах.');
  }
}

/**
 * Основной расчёт.
 * @param {object|number} params — число трактуется как масса новорождённого (обратная совместимость)
 * @param {number} [params.heightCm] рост (длина тела), см
 * @param {number} [params.ageYears] годы
 * @param {number} [params.ageMonths] месяцы (складываются с годами)
 * @param {number} [params.weightKg] масса, кг
 * @param {"female"|"male"} [params.sex] пол (нужен с 13 лет и при росте >143,3 см)
 * @param {boolean} [params.cuffed=false]
 * @param {"oral"|"nasal"|"both"} [params.route="both"]
 */
export const calculateIntubationTubeLogic = (params) => {
  if (typeof params === 'number') {
    return calculateIntubationTubeLogic({ weightKg: params, ageMonths: 0 });
  }

  const {
    heightCm,
    ageYears: _ageYears,
    ageMonths,
    weightKg,
    sex,
    cuffed = false,
    route = 'both',
  } = params || {};

  const h = isNum(heightCm) ? heightCm : undefined;
  const w = isNum(weightKg) ? weightKg : undefined;
  const y = isNum(_ageYears) ? _ageYears : undefined;
  const m = isNum(ageMonths) ? ageMonths : undefined;
  validate({ heightCm: h, ageYears: y, ageMonths: m, weightKg: w });

  // Возраст = годы + месяцы/12, если заполнено хотя бы одно поле.
  const age = y === undefined && m === undefined ? undefined : (y || 0) + (m || 0) / 12;

  if (age !== undefined && age < 1 && w !== undefined && w > 20) {
    throw new Error('Масса больше 20 кг у ребёнка до года — проверьте ввод (масса в килограммах).');
  }
  if (age !== undefined && age < 1 && h !== undefined && h > 100) {
    throw new Error('Рост больше 100 см у ребёнка до года — проверьте ввод.');
  }

  const used = [];
  const ignored = [];
  const extraWarnings = [];
  const fmtAge = (a) => {
    if (a < 1) return `${fmt(Math.round(a * 12 * 10) / 10)} мес`;
    return `${fmt(Math.round(a * 10) / 10)} г.`;
  };
  const hInTape = h !== undefined && h >= TAPE_MIN_CM && h <= TAPE_MAX_CM;
  const isNeonate = age !== undefined && age < 1 / 12;
  const isInfant = age !== undefined && age >= 1 / 12 && age < 1;
  const isChild = age !== undefined && age >= 1 && age < 13;
  const isTeenAdult = age !== undefined && age >= 13;
  const isTeen = isTeenAdult && age < TEEN_MAX_AGE;

  let res;

  const finish = (r) => {
    r.used = used;
    r.ignored = ignored;
    r.warnings = [...extraWarnings, ...(r.warnings || [])];
    r.inputs = { heightCm: h, ageYears: age, weightKg: w, sex, cuffed, route };
    return r;
  };

  // 1) Новорождённый (<1 мес) или масса ≤4,2 кг без возраста → неонатальная таблица по массе.
  if (w !== undefined && w <= NEONATAL_MAX_KG && (isNeonate || age === undefined || (isInfant && !hInTape))) {
    // Сверка роста с массой ≤4,2 кг: такой массе соответствует серая зона ленты Broselow
    // (3–5 кг ≈ 46,8–59,2 см, Wikipedia «Broselow tape»). Рост выше серой зоны — ошибка ввода
    // (например, 100 или 170 см при 4 кг). Как в шаге 2: расхождение на 2 зоны и больше
    // (≥66,9 см) — расчёт не выдаётся (ни 3,5 мм / 9 см, ни размер по росту не безопасны
    // без проверки); на 1 зону (розовая, 59,2–66,9 см) — предупреждение, расчёт по массе.
    if (h !== undefined && h >= BROSELOW_ZONES[3].minCm) {
      const hz = zoneByHeight(h);
      if (!hz || zoneRank(hz) >= 2) {
        throw new Error(
          `Рост ${fmt(h)} см не соответствует массе ${fmt(w)} кг (при массе ≤4,2 кг рост обычно до ≈59 см). Проверьте рост и массу; если рост не измерен — оставьте поле пустым.`
        );
      }
      extraWarnings.push(
        `Рост ${fmt(h)} см больше ожидаемого для массы ${fmt(w)} кг (серая зона — до 59,2 см). Проверьте ввод; расчёт по массе.`
      );
    }
    used.push(`масса ${fmt(w)} кг`);
    if (age !== undefined) used.push(`возраст ${fmtAge(age)}`);
    if (h !== undefined) ignored.push('рост (при известной массе новорождённого считается по массе)');
    res = calculateForNeonate({ weightKg: w, cuffed, route });
    if (age === undefined) res.notes.unshift('Масса ≤4,2 кг: расчёт как для новорождённого.');
    return finish(res);
  }

  // 2) Рост в пределах ленты Broselow.
  if (hInTape) {
    const zone = zoneByHeight(h);
    used.push(`рост ${fmt(h)} см`);
    res = calculateByZone(zone, { cuffed, route, method: 'broselowHeight' });
    if (w !== undefined) {
      const wz = w <= NEONATAL_MAX_KG ? zoneByKey('grey4') : zoneByWeight(w);
      if (!wz) {
        extraWarnings.push(`Масса ${fmt(w)} кг больше зелёной зоны (36 кг) — проверьте рост и массу.`);
      } else if (Math.abs(zoneRank(wz) - zoneRank(zone)) >= 2) {
        extraWarnings.push(`Масса ${fmt(w)} кг соответствует другой зоне (${wz.name}). Трубку выбирают по длине тела; проверьте ввод.`);
      }
      ignored.push('масса (размер трубки выбирается по длине тела)');
    }
    if (age !== undefined) {
      if (isChild) {
        const byAge = calculateByAge({ ageYears: age, cuffed, route });
        if (Math.abs(byAge.tubeIDmm - res.tubeIDmm) > 0.5) {
          extraWarnings.push(`По возрасту (${fmtAge(age)}) — ${fmtMm(byAge.tubeIDmm)} мм: расхождение с ростом больше 0,5 мм, проверьте ввод.`);
        }
      }
      if (isTeenAdult) extraWarnings.push('Возраст ≥13 лет при росте в пределах ленты: размер по длине тела.');
      ignored.push('возраст (размер выбирается по длине тела)');
    }
    if (sex) ignored.push('пол');
    return finish(res);
  }

  if (h !== undefined && h < TAPE_MIN_CM) {
    extraWarnings.push(`Рост ${fmt(h)} см меньше начала ленты Broselow (46,8 см) — рост не использован.`);
    ignored.push('рост');
  }

  // 3) Дети 1–12 лет — по возрасту (масса не используется).
  if (isChild) {
    used.push(`возраст ${fmtAge(age)}`);
    if (h !== undefined && h > TAPE_MAX_CM) {
      extraWarnings.push(`Рост ${fmt(h)} см выше ленты Broselow (143,3 см) — расчёт по возрасту.`);
      ignored.push('рост');
    }
    if (w !== undefined) ignored.push('масса (при известном возрасте ≥1 года не используется)');
    if (sex) ignored.push('пол');
    res = calculateByAge({ ageYears: age, cuffed, route });
    return finish(res);
  }

  // 4) Подростки 13–15 лет, или рост >143,3 см без возраста → по возрасту/росту,
  //    не больше взрослых размеров для пола (см. calculateTeen).
  if (isTeen || (age === undefined && h !== undefined && h > TAPE_MAX_CM)) {
    const reason = isTeen
      ? 'Возраст 13–15 лет: диаметр по возрасту, глубина по росту (или возрасту), не больше взрослых.'
      : 'Рост выше ленты Broselow (143,3 см), возраст не указан: расчёт как для подростка.';
    if (age !== undefined) used.push(`возраст ${fmtAge(age)}`);
    if (h !== undefined && h > TAPE_MAX_CM) used.push(`рост ${fmt(h)} см`);
    if (sex) used.push(sex === 'female' ? 'пол: женский' : 'пол: мужской');
    if (w !== undefined) ignored.push('масса');
    res = calculateTeen({ ageYears: age, heightCm: h, sex, cuffed, route, reason });
    return finish(res);
  }

  // 4б) С 16 лет → взрослые размеры по полу.
  if (isTeenAdult) {
    const reason = 'Возраст ≥16 лет: размеры как у взрослых.';
    used.push(`возраст ${fmtAge(age)}`);
    if (sex) used.push(sex === 'female' ? 'пол: женский' : 'пол: мужской');
    if (h !== undefined && h > TAPE_MAX_CM) ignored.push('рост (у взрослых — стандартные размеры по полу)');
    if (w !== undefined) ignored.push('масса');
    res = calculateAdult({ sex, cuffed, route, reason });
    return finish(res);
  }

  // 5) Младенцы 1–12 мес и новорождённые с массой >4,2 кг → зона Broselow по массе
  //    (масса известна или оценена по возрасту, APLS 2011).
  if (isNeonate || isInfant) {
    used.push(`возраст ${fmtAge(age)}`);
    if (sex) ignored.push('пол');
    const months = age * 12;
    const estW = Math.round(aplsInfantWeight(months) * 10) / 10;
    if (w !== undefined) {
      // Сверка массы с возрастом (APLS 2011: 0,5 × мес + 4), как сверка роста с массой в шаге 2.
      // Масса на 2 зоны и больше выше ожидаемой (например, 15 кг в 6 мес; ВОЗ, масса к возрасту:
      // +3 SD в 6 мес ≈ 11 кг) — ошибка ввода: берётся зона по возрасту (меньшая трубка, глубина
      // младенца 10,5 см), а не 4,5–5,5 мм и 13–15 см по типичному возрасту зоны 2–6 лет.
      // ERC 2021: до 1 года — 3,5–4,0 мм без манжеты / 3,0–3,5 мм с манжетой.
      // Масса ниже ожидаемой — расчёт по массе (меньшая трубка), с предупреждением.
      const wz = zoneByWeight(w);
      const ez = zoneByWeight(estW);
      const diff = zoneRank(wz) - zoneRank(ez);
      if (diff >= 2) {
        extraWarnings.push(
          `Масса ${fmt(w)} кг слишком велика для возраста ${fmtAge(age)} (ожидаемо ≈ ${fmt(estW)} кг по APLS) — проверьте ввод. Показан размер по возрасту (зона ${ez.name}), он меньше.`
        );
        ignored.push('масса (не соответствует возрасту)');
        res = calculateByZone(ez, { cuffed, route, method: 'infantAge' });
        res.notes.unshift(`Масса оценена по возрасту (APLS: 0,5 × мес + 4) ≈ ${fmt(estW)} кг.`);
        return finish(res);
      }
      if (diff <= -2) {
        extraWarnings.push(
          `Масса ${fmt(w)} кг меньше ожидаемой для возраста ${fmtAge(age)} (≈ ${fmt(estW)} кг по APLS) — проверьте ввод. Расчёт по массе (меньшая трубка); при возможности измерьте рост.`
        );
      }
      used.push(`масса ${fmt(w)} кг`);
      res = calculateByZone(wz, { cuffed, route, method: 'broselowWeight' });
      return finish(res);
    }
    if (isNeonate) {
      throw new Error('Для новорождённого укажите массу (кг) или рост (см).');
    }
    res = calculateByZone(zoneByWeight(estW), { cuffed, route, method: 'infantAge' });
    res.notes.unshift(`Масса оценена по возрасту (APLS: 0,5 × мес + 4) ≈ ${fmt(estW)} кг.`);
    return finish(res);
  }

  // 6) Возраст неизвестен, есть масса → зона Broselow по массе.
  if (w !== undefined) {
    if (sex) ignored.push('пол');
    if (w >= WEIGHT_TAPE_MAX_KG) {
      throw new Error('Масса больше 36 кг — вне ленты Broselow. Укажите рост или возраст (для подростка/взрослого — и пол).');
    }
    used.push(`масса ${fmt(w)} кг`);
    res = calculateByZone(zoneByWeight(w), { cuffed, route, method: 'broselowWeight' });
    return finish(res);
  }

  if (h !== undefined) {
    throw new Error('Рост меньше 46,8 см (начало ленты Broselow): укажите массу новорождённого.');
  }
  throw new Error('Укажите рост (длину тела), массу или возраст.');
};

// ----- Прямой расчёт по зоне, выбранной на ленте (patient/BroselowPicker) -----
//
// Ключи зон пациента (patient/estimates.js, лента 2017): grey, pink, red, … green.
// Цвет зоны на ленте определяется длиной ребёнка, поэтому расчёт — тот же, что по росту
// внутри этой зоны (calculateByZone, значения таблицы BROSELOW_ZONES выше не меняются);
// масса середины зоны, которую пишет BroselowPicker, для выбора трубки не используется.
// Серая зона на ленте одна (3–5 кг), а в таблице ЭТТ — три подзоны 3, 4 и 5 кг с разной
// глубиной (8,5 / 9,0 / 10,5 см) и допустимостью трубки с манжетой (только >3,5 кг, MSD Manual).
// Поэтому подзону серой зоны выбирают явно; без неё расчёт не выдаётся (консервативно):
// подставлять «середину» значило бы выдать глубину и манжету, верные только для 4 кг.
export const PATIENT_ZONE_KEYS = ['grey', 'pink', 'red', 'purple', 'yellow', 'white', 'blue', 'orange', 'green'];
export const GREY_SUBZONES = [
  { value: 'grey3', label: '3 кг' },
  { value: 'grey4', label: '4 кг' },
  { value: 'grey5', label: '5 кг' },
];

// Ключ зоны таблицы ЭТТ → ключ зоны пациента (grey3/grey4/grey5 → grey).
export const patientZoneKeyOf = (tubeZoneKey) =>
  typeof tubeZoneKey === 'string' && tubeZoneKey.startsWith('grey') ? 'grey' : tubeZoneKey || null;

/**
 * Расчёт по зоне ленты Broselow, выбранной вручную.
 * @param {object} params
 * @param {string} params.zoneKey ключ зоны пациента ('grey' … 'green') или подзоны ('grey3' | 'grey4' | 'grey5')
 * @param {string} [params.greySubzone] подзона серой зоны: 'grey3' | 'grey4' | 'grey5'
 * @param {number} [params.ageYears] годы (для сверки с расчётом по возрасту; до 1 года — сверка зоны с возрастом)
 * @param {number} [params.ageMonths] месяцы
 * @param {boolean} [params.cuffed=false]
 * @param {"oral"|"nasal"|"both"} [params.route="both"]
 */
export const calculateIntubationTubeByZone = (params) => {
  const { zoneKey, greySubzone, ageYears, ageMonths, cuffed = false, route = 'both' } = params || {};
  let key = zoneKey;
  if (key === 'grey') {
    if (!GREY_SUBZONES.some((s) => s.value === greySubzone)) {
      throw new Error(
        'Серая зона разделена на 3, 4 и 5 кг: выберите подзону — от неё зависят глубина и возможность трубки с манжетой.'
      );
    }
    key = greySubzone;
  }
  const zone = zoneByKey(key);
  if (!zone) throw new Error('Выберите зону ленты Broselow.');

  const y = isNum(ageYears) ? ageYears : undefined;
  const m = isNum(ageMonths) ? ageMonths : undefined;
  validate({ ageYears: y, ageMonths: m });
  const age = y === undefined && m === undefined ? undefined : (y || 0) + (m || 0) / 12;

  // Сверка зоны с возрастом до 1 года — как в основном расчёте (ветки 1, 5 и проверка роста >100 см):
  // ожидаемая зона = зона по массе, оценённой по возрасту (APLS 2011: 0,5 × мес + 4).
  // Зону выбирают одним касанием в сетке плиток, промах на соседнюю строку вероятен; без сверки
  // новорождённому с зелёной зоной выдавалось 6,5 мм / 17 см без предупреждения.
  // ERC 2021: до 1 года — 3,5–4,0 мм без манжеты / 3,0–3,5 мм с манжетой; NRP / Kempley 2008:
  // новорождённый 2,5–4,2 кг — 8,5–9 см у губ.
  //  - зона, вся длина которой больше 100 см (синяя, оранжевая, зелёная), — отказ, как
  //    «Рост больше 100 см у ребёнка до года»;
  //  - новорождённый (<1 мес) и зона на 2 и больше выше серой — отказ: зона по возрасту — серая,
  //    но подзону (3 / 4 / 5 кг: глубина 8,5 / 9 / 10,5 см) по возрасту не определить;
  //    на 1 зону выше (розовая) — предупреждение;
  //  - младенец 1–12 мес, зона на 2 и больше выше ожидаемой — предупреждение и расчёт по зоне
  //    возраста (меньшая трубка), как ветка 5 при массе, слишком большой для возраста;
  //    на 2 и больше ниже — предупреждение, расчёт по выбранной зоне (меньшая трубка).
  let calcZone = zone;
  let method = 'broselowZone';
  let ageZoneNote = null;
  const extraWarnings = [];
  const ignored = ['масса (размер трубки выбирается по зоне ленты, т. е. по длине тела)'];
  const used = [`зона ленты Broselow: ${zone.name}`];
  if (age !== undefined && age < 1) {
    const months = Math.round(age * 12 * 10) / 10;
    const ageText = age < 1 / 12 ? 'новорождённого' : `${fmt(months)} мес`;
    const estW = Math.round(aplsInfantWeight(months) * 10) / 10;
    const ez = zoneByWeight(estW);
    const diff = zoneRank(zone) - zoneRank(ez);
    if (zone.minCm > 100) {
      throw new Error(
        `Зона ленты «${zone.name}» (${fmt(zone.minCm)}–${fmt(zone.maxCm)} см) не бывает у ребёнка до года — проверьте зону и возраст.`
      );
    }
    if (age < 1 / 12) {
      if (diff >= 2) {
        throw new Error(
          `Зона ленты «${zone.name}» не соответствует возрасту новорождённого (ожидается серая зона). Проверьте зону и возраст; если ребёнок в серой зоне — выберите её и подзону, либо укажите массу или рост.`
        );
      }
      if (diff === 1) {
        extraWarnings.push(
          `Для новорождённого ожидается серая зона ленты, выбрана «${zone.name}» — проверьте зону.`
        );
      }
    } else if (diff >= 2) {
      extraWarnings.push(
        `Зона ленты «${zone.name}» слишком велика для возраста ${ageText} (ожидаемо ≈ ${fmt(estW)} кг по APLS, зона ${ez.name}) — проверьте зону и возраст. Показан размер по возрасту (зона ${ez.name}), он меньше.`
      );
      ignored.push('выбранная зона ленты (не соответствует возрасту)');
      calcZone = ez;
      method = 'infantAge';
      ageZoneNote = `Масса оценена по возрасту (APLS: 0,5 × мес + 4) ≈ ${fmt(estW)} кг.`;
    } else if (diff <= -2) {
      extraWarnings.push(
        `Зона ленты «${zone.name}» меньше ожидаемой для возраста ${ageText} (зона ${ez.name} по APLS) — проверьте зону и возраст. Расчёт по выбранной зоне (меньшая трубка).`
      );
    }
  }

  const res = calculateByZone(calcZone, { cuffed, route, method });
  if (ageZoneNote) res.notes.unshift(ageZoneNote);
  if (age !== undefined) {
    if (age < 1) used.push(age < 1 / 12 ? 'возраст: новорождённый' : `возраст ${fmt(Math.round(age * 12 * 10) / 10)} мес`);
    if (age >= 1 && age < 13) {
      const byAge = calculateByAge({ ageYears: age, cuffed, route });
      if (Math.abs(byAge.tubeIDmm - res.tubeIDmm) > 0.5) {
        extraWarnings.push(
          `По возрасту — ${fmtMm(byAge.tubeIDmm)} мм: расхождение с зоной ленты больше 0,5 мм, проверьте зону и возраст.`
        );
      }
    }
    // Как в расчёте по росту: лента рассчитана на детей до ≈12 лет (до 36 кг).
    if (age >= 13) extraWarnings.push('Возраст ≥13 лет при выбранной зоне ленты: размер по длине тела.');
    // До 1 года возраст участвует в сверке зоны (см. выше) и указан в «Учтено».
    if (age >= 1) ignored.push('возраст (размер выбирается по зоне ленты)');
  }
  res.used = used;
  res.ignored = ignored;
  res.warnings = [...extraWarnings, ...(res.warnings || [])];
  res.inputs = { zoneKey: key, ageYears: age, cuffed, route };
  return res;
};

export default calculateIntubationTubeLogic;
