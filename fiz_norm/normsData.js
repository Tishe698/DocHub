// normsData.js — таблица возрастных норм у детей и чистые помощники к ней.
// Экран (pediatric_norms_screen.js) только показывает эти данные.
//
// ИСТОЧНИКИ (значения перенесены из экрана без изменений — исправлены в ветке fix/clinical-audit):
// Средние значения (weight, height, rr, hr, bp) — российские учебники педиатрии
// (Мазурин А.В., Воронцов И.М. «Пропедевтика детских болезней»), для обоих полов.
// Границы нормы (hrRange, rrRange, bpRange) — PALS (AHA) Provider Manual 2015/2020,
// таблицы «Normal heart rates / respiratory rates / blood pressures by age»,
// ЧСС — в бодрствовании. В РФ таких диапазонов в КР нет; где редакции PALS
// расходятся, взята более узкая граница (консервативно).
// Полосы PALS: новорождённый <28 дн; грудной 1–12 мес; 1–2 года; 3–5 лет;
// 6–11 лет (АД: 6–9 и 10–11 лет); 12–15 лет.
//
// autoFrom / autoTo — полный возраст пациента в месяцах (включительно), для которого строка
// выбирается автоматически. Правило: ближайшая младшая строка той же полосы PALS
// (логика интерфейса, не норматив). Исключение — 1–2 мес: строка новорождённых описывает
// возраст < 28 дней, поэтому берётся «3 мес» (та же полоса PALS «грудной 1–12 мес»).
// Строка «14 лет» покрывает и 15–17 лет (полоса PALS 12–15 лет; старше — ориентировочно).

const rows = [
  // ЧДД новорождённого: верхняя граница 60 — КР МЗ РФ «Транзиторное тахипноэ
  // новорожденного» (2025, «Термины и определения»: тахипноэ — ЧДД > 60 в мин);
  // нижняя 30 — PALS. АД: объединены строки PALS «при рождении, 3 кг» (60–76/31–45)
  // и «4-е сутки» (67–84/35–53).
  { label: 'Новорожденные', months: 0, autoFrom: 0, autoTo: 0, weight: '3,5', height: '50', rr: '40–60', rrRange: '30–60', hr: '130–140', hrRange: '100–205', bp: '70/40', bpRange: '60–84 / 31–53' },
  // Масса 3 мес: было 5 кг. APLS 2011 (0,5×мес+4) = 5,5 кг; Мазурин–Воронцов ≈ 5,8 кг;
  // медианы ВОЗ 2006: дев. 5,8, мал. 6,4 кг.
  // ЧСС до 1 года: PALS 2020 — 100–180 (в редакции 2015 — 100–190), взята более узкая.
  { label: '3 мес', months: 3, autoFrom: 1, autoTo: 5, weight: '5,5–6', height: '60–62', rr: '35–40', rrRange: '30–53', hr: '120–130', hrRange: '100–180', bp: '85/40', bpRange: '72–104 / 37–56' },
  // Масса 6 мес 7 кг = APLS 2011 (0,5×6+4), оставлена без изменений.
  { label: '6 мес', months: 6, autoFrom: 6, autoTo: 11, weight: '7', height: '67', rr: '33–35', rrRange: '30–53', hr: '120–125', hrRange: '100–180', bp: '95/55', bpRange: '72–104 / 37–56' },
  { label: '1 год', months: 12, autoFrom: 12, autoTo: 23, weight: '10', height: '75', rr: '30–32', rrRange: '22–37', hr: '120', hrRange: '98–140', bp: '92/56', bpRange: '86–106 / 42–63' },
  { label: '2 года', months: 24, autoFrom: 24, autoTo: 35, weight: '12', height: '87', rr: '26–30', rrRange: '22–37', hr: '110–115', hrRange: '98–140', bp: '94/56', bpRange: '86–106 / 42–63' },
  // Строка 3 года: масса — APLS 2011 (2×3+8 = 14 кг) и Мазурин–Воронцов;
  // рост — медиана ВОЗ 2006 (дев. 95,1, мал. 96,1 см); ЧСС и ЧДД — между строками
  // 2 и 4 лет (внутри полос PALS); САД — 90+2n (Мазурин–Воронцов) = 96.
  { label: '3 года', months: 36, autoFrom: 36, autoTo: 47, weight: '14', height: '95', rr: '26–28', rrRange: '20–28', hr: '105–110', hrRange: '80–120', bp: '96/56', bpRange: '89–112 / 46–72' },
  { label: '4 года', months: 48, autoFrom: 48, autoTo: 59, weight: '16', height: '101', rr: '26', rrRange: '20–28', hr: '100–105', hrRange: '80–120', bp: '98/56', bpRange: '89–112 / 46–72' },
  { label: '5 лет', months: 60, autoFrom: 60, autoTo: 71, weight: '19', height: '109', rr: '25–26', rrRange: '20–28', hr: '100', hrRange: '80–120', bp: '100/58', bpRange: '89–112 / 46–72' },
  { label: '6 лет', months: 72, autoFrom: 72, autoTo: 95, weight: '20', height: '115', rr: '25', rrRange: '18–25', hr: '90–95', hrRange: '75–118', bp: '100/60', bpRange: '97–115 / 57–76' },
  // ЧСС 8 лет: было 78–80 (ниже, чем в 10 лет). Между 6 лет (90–95) и 10 лет (78–82):
  // Мазурин–Воронцов (5 лет — 100, 10 лет — 80), Fleming 2011 (медиана 6–8 лет 91, 8–12 лет 84).
  { label: '8 лет', months: 96, autoFrom: 96, autoTo: 119, weight: '25', height: '129', rr: '22–24', rrRange: '18–25', hr: '80–85', hrRange: '75–118', bp: '105/70', bpRange: '97–115 / 57–76' },
  { label: '10 лет', months: 120, autoFrom: 120, autoTo: 143, weight: '30', height: '140', rr: '20–22', rrRange: '18–25', hr: '78–82', hrRange: '75–118', bp: '105/70', bpRange: '102–120 / 61–80' },
  // Масса 12 лет: было 33–35 кг. Мазурин–Воронцов 5n−20 = 40 кг;
  // медианы CDC 2000: мал. 40,7, дев. 41,8 кг.
  { label: '12 лет', months: 144, autoFrom: 144, autoTo: 167, weight: '40–42', height: '151', rr: '18–20', rrRange: '12–20', hr: '75–82', hrRange: '60–100', bp: '110/70', bpRange: '110–131 / 64–83' },
  // Масса 14 лет: было «до 45» (подавалось как верхняя граница). Мазурин–Воронцов
  // 5n−20 = 50 кг; медианы CDC 2000: дев. 49,5, мал. 51,2 кг.
  { label: '14 лет', months: 168, autoFrom: 168, autoTo: 215, weight: '50', height: '161', rr: '16–20', rrRange: '12–20', hr: '72–78', hrRange: '60–100', bp: '120/70', bpRange: '110–131 / 64–83' },
];

export const NORMS = Object.freeze(rows.map((r) => Object.freeze({ ...r })));

// 18 лет: таблица детских норм не применяется (как derived.isChild в patient/PatientContext.js)
export const ADULT_MONTHS = 216;
// Строка «14 лет» — полоса PALS 12–15 лет; с 15 лет показываем её ориентировочно
const BEYOND_TABLE_MONTHS = 180;

// Порог гипотензии (САД, мм рт. ст.) — PALS (AHA) 2015/2020:
// 0–28 дней < 60; 1–12 мес < 70; 1–10 лет < 70 + 2 × возраст (годы); старше 10 лет < 90.
export function hypotensionSbp(months) {
  if (months < 1) return 60;
  if (months < 12) return 70;
  if (months <= 120) return 70 + 2 * Math.floor(months / 12);
  return 90;
}

// Склонение: plural(5, 'год', 'года', 'лет') → 'лет'
export function plural(n, form1, form2, form5) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return form5;
  if (b > 1 && b < 5) return form2;
  if (b === 1) return form1;
  return form5;
}

// Подпись возраста строки: «до 28 дней», «3 мес», «1 год», «2 года», «5 лет»
export function ageBadge(months) {
  if (months < 1) return 'до 28 дней';
  if (months < 12) return `${months} мес`;
  const y = Math.floor(months / 12);
  return `${y} ${plural(y, 'год', 'года', 'лет')}`;
}

// Подпись для диктора: «Новорожденные, до 28 дней», «3 месяца», «5 лет»
export function ageSpoken(months) {
  if (months < 1) return 'новорождённые, до 28 дней';
  if (months < 12) return `${months} ${plural(months, 'месяц', 'месяца', 'месяцев')}`;
  return ageBadge(months);
}

export const normByMonths = (months) => NORMS.find((n) => n.months === months) || null;

const isAge = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

// Строка таблицы по полному возрасту пациента в месяцах (patient.ageMonths).
// Нет возраста или 18 лет и старше — null (выбор вручную).
export function normForAge(ageMonths) {
  if (!isAge(ageMonths)) return null;
  const m = Math.floor(ageMonths);
  if (m >= ADULT_MONTHS) return null;
  return NORMS.find((n) => m >= n.autoFrom && m <= n.autoTo) || null;
}

// Пояснение к автоматическому выбору строки (или null, если пояснять нечего).
export function ageMatchNote(ageMonths) {
  if (!isAge(ageMonths)) return null;
  const m = Math.floor(ageMonths);
  if (m >= ADULT_MONTHS) {
    return 'Пациенту 18 лет или больше — таблица детских норм не применяется. Строку можно выбрать вручную.';
  }
  if (m >= BEYOND_TABLE_MONTHS) {
    return 'Таблица заканчивается на 14 годах (полоса PALS 12–15 лет). Для 15–17 лет показана строка «14 лет» — ориентировочно.';
  }
  return null;
}

// «40–60» → «от 40 до 60»; «70/40» → «70 на 40»; «60–84 / 31–53» → «систолическое от 60 до 84, диастолическое от 31 до 53»
export function spokenValue(s) {
  const str = String(s ?? '').trim();
  const bpRange = str.match(/^(\d+)–(\d+)\s*\/\s*(\d+)–(\d+)$/);
  if (bpRange) {
    return `систолическое от ${bpRange[1]} до ${bpRange[2]}, диастолическое от ${bpRange[3]} до ${bpRange[4]}`;
  }
  const bp = str.match(/^(\d+)\/(\d+)$/);
  if (bp) return `${bp[1]} на ${bp[2]}`;
  return str.replace(/([\d,]+)–([\d,]+)/g, 'от $1 до $2');
}

// Значения строки для показа (без разметки): подпись, значение, норма и подпись для диктора.
export function normMetrics(norm) {
  if (!norm) return [];
  return [
    {
      key: 'weight',
      label: 'Масса тела (средняя)',
      value: `${norm.weight} кг`,
      spoken: `Масса тела, средняя: ${spokenValue(norm.weight)} килограмм`,
    },
    {
      key: 'height',
      label: 'Рост (средний)',
      value: `${norm.height} см`,
      spoken: `Рост, средний: ${spokenValue(norm.height)} сантиметров`,
    },
    {
      key: 'rr',
      label: 'ЧДД',
      value: `${norm.rr} в мин`,
      range: `норма ${norm.rrRange}`,
      spoken: `Частота дыхания: ${spokenValue(norm.rr)} в минуту; норма ${spokenValue(norm.rrRange)}`,
    },
    {
      key: 'hr',
      label: 'ЧСС',
      value: `${norm.hr} в мин`,
      range: `норма ${norm.hrRange} (бодрствование)`,
      spoken: `Частота сердечных сокращений: ${spokenValue(norm.hr)} в минуту; норма в бодрствовании ${spokenValue(norm.hrRange)}`,
    },
    {
      key: 'bp',
      label: 'АД',
      value: `${norm.bp} мм рт. ст.`,
      range: `норма ${norm.bpRange}`,
      spoken: `Артериальное давление: ${spokenValue(norm.bp)} миллиметров ртутного столба; норма: ${spokenValue(norm.bpRange)}`,
    },
  ];
}
