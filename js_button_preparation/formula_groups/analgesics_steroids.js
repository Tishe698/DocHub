// Анальгетики-антипиретики и глюкокортикостероиды
// Часть списка препаратов: собирается в ../formulas.js в исходном порядке.
// Пути введения и выбор показания — через ../routes.js (routeInput, choiceInput).
//
// Источники группы (у каждой дозы в коде — короткая ссылка):
//  - КР МЗ РФ «Острая респираторная вирусная инфекция (ОРВИ)» у детей, ID 25 (ред. 25_3), разд. 3:
//    парацетамол до 60 мг/кг/сут, ибупрофен до 30 мг/кг/сут, оба противопоказаны до 3 мес;
//    ректальные формы — только при рвоте или непереносимости приёма внутрь; не чередовать и не
//    комбинировать жаропонижающие, повтор — только после нового подъёма температуры;
//  - инструкции ГРЛС: «Детский Панадол» суспензия 120 мг/5 мл (10–15 мг/кг, ≤ 60 мг/кг/сут,
//    интервал ≥ 4 ч, не более 4 доз); «Парацетамол-Альтфарм» суппозитории 50/100/250/500 мг
//    (10–15 мг/кг, ≤ 60 мг/кг/сут, взрослым до 1 г разово и 4 г/сут); «Парацетамол Каби»
//    р-р для инфузий 10 мг/мл (дозы по массе тела, противопоказан до 1 мес); «Нурофен для детей»
//    суспензия 100 мг/5 мл (таблица доз по массе, ≤ 30 мг/кг/сут, с 3 мес и 5 кг) и суппозитории
//    60 мг (3 мес – 2 года, масса ≥ 6 кг);
//  - КР МЗ РФ «Анафилактический шок», ID 263 (ред. 263_2), рекомендация 24 — системные ГКС после
//    эпинефрина: взрослым #метилпреднизолон 50–100 мг или #гидрокортизон 200 мг в/в (эквивалент:
//    преднизолон 60–120 мг, дексаметазон 8–16 мг); детям в/в или в/м #гидрокортизон 2–4 мг/кг
//    (≤ 100 мг), дексаметазон 0.1–0.4 мг/кг (≤ 10 мг), преднизолон 1.3–2.6 мг/кг (≤ 50 мг);
//  - КР МЗ РФ «Бронхиальная астма», ID 359 (ред. 359_3): преднизолон детям 1–2 мг/кг/сут, до 20 мг
//    до 2 лет, до 30 мг в 2–5 лет, до 40 мг в 6–11 лет, с 12 лет до 50 мг; взрослым 40–50 мг/сут;
//    на догоспитальном этапе детям в/м 1 мг/кг (внутрь 1–2 мг/кг, не более 40 мг);
//  - КР «Острый обструктивный ларингит [круп] и эпиглоттит» (Союз педиатров России, ID 352,
//    актуализация 2024), разд. 3.1.1: #дексаметазон 0.15–0.6 мг/кг в/м (в/в), внутрь — 0.15 мг/кг;
//    при отсутствии дексаметазона — #преднизолон 1–2 мг/кг;
//  - КР МЗ РФ «Первичная надпочечниковая недостаточность», ID 524 (ред. 524_3): криз — дети:
//    гидрокортизон 100 мг/м² болюсно, далее 100–200 мг/м²/сут, до госпитализации 25–50 мг в/м;
//    взрослые: 100 мг в/в болюсно, далее 200 мг/сут.
//
// Политика расчёта: у жаропонижающих — стандартная разовая доза по массе (верхняя граница
// 15 и 10 мг/кг, кратная суточному максимуму КР); у ГКС, где КР дают диапазон, расчёт ведётся по
// нижней границе, а верхняя граница (с объёмом) — в примечании. Пути — только с дозой в КР / ГРЛС.

import { routeInput, choiceInput, ROUTES } from '../routes';

const EPS = 1e-9;
const ADULT_AGE = 18;

// Число для текста примечания: без «хвоста» плавающей точки
const num = (x, digits = 2) => String(Number(x.toFixed(digits)));
const mlText = (x) => num(x, x < 1 ? 2 : 1);
const toNum = (x) => {
  const n = parseFloat(x);
  return Number.isFinite(n) ? n : NaN;
};
const weightOf = (x) => {
  const n = toNum(x);
  return n > 0 ? n : 0;
};
const ageOf = (x) => {
  const n = toNum(x);
  return n >= 0 ? n : NaN;
};
// Возраст в годах; до 1 года движок передаёт дробь (мес / 12). Сравнения — с допуском.
const atLeast = (a, years) => a >= years - EPS;
const isAdult = (a) => atLeast(a, ADULT_AGE);

// Поле выбора «Показание и путь»: подпись «Показание — путь» из ROUTES (как в resuscitation.js).
// Возвращает поле choiceInput и разбор value → { indication, route }.
const indicationRoute = (options, defaultValue) => {
  const byValue = {};
  const choices = options.map((o) => {
    byValue[o.value] = o;
    return { value: o.value, label: `${o.label} — ${ROUTES[o.route]}` };
  });
  const input = choiceInput('Показание и путь', choices, defaultValue);
  const parse = (value) => byValue[value] || byValue[input.default];
  return { input, parse };
};

const routeOf = (input, value) => (input.choices.some((c) => c.value === value) ? value : input.default);

/** ------------------------------ Парацетамол ------------------------------ **/

const PARACETAMOL_ROUTE = routeInput(['po', 'pr', 'iv'], 'po');
const PARA_SUSP_MG_ML = 24; // «Детский Панадол» суспензия 120 мг/5 мл
const PARA_TAB_MG = 500; // таблетки 500 мг
const PARA_IV_MG_ML = 10; // «Парацетамол Каби» р-р для инфузий 10 мг/мл
// «Парацетамол-Альтфарм» суппозитории ректальные: 50, 100, 250, 500 мг
export const PARACETAMOL_SUPP_MG = [500, 250, 100, 50];

// Суточный максимум внутрь / ректально: 60 мг/кг/сут (КР ОРВИ; инструкции «Детский Панадол»,
// «Парацетамол-Альтфарм»), не более 4 г; взрослым с массой ≥ 50 кг — 4 г/сут (инструкция).
const paraDailyMg = (w, a) => (isAdult(a) && w >= 50 ? 4000 : Math.min(60 * w, 4000));

// Свечи на одно введение: самая крупная одна свеча не выше 15 мг/кг (и не выше 1 г); если она даёт
// меньше 10 мг/кг — пара свечей (сумма не выше 15 мг/кг), если так ближе к расчётной дозе.
// Возвращает { mg, parts: [мг, …] } или null, если даже 50 мг больше 15 мг/кг.
export const paracetamolSuppositories = (w) => {
  const target = Math.min(15 * w, 1000);
  const single = PARACETAMOL_SUPP_MG.find((s) => s <= target + EPS);
  if (!single) return null;
  if (single >= 10 * w - EPS) return { mg: single, parts: [single] };
  let best = { mg: single, parts: [single] };
  PARACETAMOL_SUPP_MG.forEach((s1) => {
    PARACETAMOL_SUPP_MG.forEach((s2) => {
      const sum = s1 + s2;
      if (s2 <= s1 && sum <= target + EPS && sum > best.mg) best = { mg: sum, parts: [s1, s2] };
    });
  });
  return best;
};

const suppText = (parts) => {
  const counts = {};
  parts.forEach((p) => {
    counts[p] = (counts[p] || 0) + 1;
  });
  return Object.keys(counts)
    .map(Number)
    .sort((x, y) => y - x)
    .map((p) => `${counts[p]} × ${p} мг`)
    .join(' + ');
};

// В/в — инструкция «Парацетамол Каби», разд. «Способ применения и дозы» (по массе тела):
// ≤ 10 кг — 7.5 мг/кг (≤ 7.5 мл), ≤ 30 мг/кг/сут; > 10–33 кг — 15 мг/кг, ≤ 60 мг/кг/сут и ≤ 2 г;
// > 33–50 кг — 15 мг/кг, ≤ 60 мг/кг/сут и ≤ 3 г; > 50 кг — 1 г, ≤ 4 г/сут (3 г при факторах риска
// гепатотоксичности). Интервал ≥ 4 ч, не более 4 введений; КК ≤ 30 мл/мин — интервал ≥ 6 ч.
export const paracetamolIv = (w) => {
  if (w <= 10) return { mg: 7.5 * w, daily: 30 * w, singleMax: 75, band: '≤ 10 кг: 7.5 мг/кг' };
  if (w <= 33) return { mg: 15 * w, daily: Math.min(60 * w, 2000), singleMax: 495, band: '10–33 кг: 15 мг/кг' };
  if (w <= 50) return { mg: 15 * w, daily: Math.min(60 * w, 3000), singleMax: 750, band: '33–50 кг: 15 мг/кг' };
  return { mg: 1000, daily: 4000, singleMax: 1000, band: '> 50 кг: 1 г' };
};

const paracetamol = {
  name: 'Парацетамол',
  synonyms: ['ацетаминофен', 'панадол', 'калпол', 'эффералган', 'цефекон', 'перфалган', 'инфулган'],
  description:
    'Суспензия для приёма внутрь 120 мг/5 мл (24 мг/мл); таблетки 500 мг; суппозитории ректальные 50, 100, 250, 500 мг; раствор для инфузий 10 мг/мл — флаконы 50 и 100 мл. Объём внутрь — суспензии 24 мг/мл, в/в — раствора 10 мг/мл',
  inputs: { weight: 'Вес (кг)', ageYears: 'Возраст (лет)', route: PARACETAMOL_ROUTE },
  formula: ({ weight, ageYears, route }) => {
    const w = weightOf(weight);
    const a = ageOf(ageYears);
    if (w <= 0 || Number.isNaN(a)) return {};
    const r = routeOf(PARACETAMOL_ROUTE, route);
    const interval = 'Повтор не ранее чем через 4 ч, не более 4 доз за 24 ч; учитывать все препараты с парацетамолом.';

    if (r === 'iv') {
      // Инструкция «Парацетамол Каби»: противопоказан в период новорождённости (до 1 мес);
      // недоношенные — нет данных
      if (a < 1 / 12 - EPS) {
        return { result7: 'В/в: до 1 мес — противопоказан (инструкция «Парацетамол Каби»); у недоношенных данных нет. Расчёт не выполняется.' };
      }
      const d = paracetamolIv(w);
      const ml = d.mg / PARA_IV_MG_ML;
      const how =
        w <= 10
          ? `Набрать ${mlText(ml)} мл шприцем (не более 7.5 мл), развести 0.9% NaCl или 5% глюкозой до 1:10 и ввести в/в за 15 мин; флакон не подвешивать.`
          : `В/в инфузия за 15 мин${w > 33 ? ' (флакон 100 мл)' : ' (флакон 50 мл)'}; объём ${mlText(ml)} мл.`;
      const out = {
        result1: d.mg,
        result4: ml,
        result5: d.daily,
        result6: `${how} Доза по массе (${d.band}). ${interval} КК ≤ 30 мл/мин — интервал не менее 6 ч.`,
      };
      // КР ОРВИ: жаропонижающие противопоказаны до 3 мес; в/в по инструкции — с 1 мес
      if (a < 0.25 - EPS) {
        out.result7 = 'До 3 мес: по КР «ОРВИ» жаропонижающие противопоказаны; по инструкции в/в допустим с 1 мес — только по решению врача.';
      } else if (w > 50) {
        out.result7 = 'Факторы риска гепатотоксичности (болезни печени, алкоголизм, истощение, обезвоживание): не более 3 г/сут.';
      }
      return out;
    }

    // Внутрь и ректально: КР «ОРВИ» — противопоказан до 3 мес (инструкции допускают с 1–2 мес
    // только по назначению врача: при расхождении — консервативный вариант КР)
    if (a < 0.25 - EPS) {
      return {
        result7: 'До 3 мес — противопоказан (КР «ОРВИ»); по инструкциям с 1–2 мес — только по назначению врача. Лихорадка у ребёнка до 3 мес — показание к госпитализации. Расчёт не выполняется.',
      };
    }
    const daily = paraDailyMg(w, a);

    if (r === 'pr') {
      const s = paracetamolSuppositories(w);
      if (!s) {
        return { result7: 'Ректально: даже свеча 50 мг больше 15 мг/кг для этой массы — используйте суспензию внутрь. Расчёт не выполняется.' };
      }
      const perKg = s.mg / w;
      return {
        result1: s.mg,
        result5: daily,
        result6: `Свечи: ${suppText(s.parts)} (${num(perKg, 1)} мг/кг; по инструкции 10–15 мг/кг). Ректально. ${interval}`,
        result7: `Ректально — только при рвоте или непереносимости приёма внутрь: всасывание непостоянное (КР «ОРВИ»).${perKg < 10 - EPS ? ' Ближайшая свеча даёт меньше 10 мг/кг.' : ''}`,
      };
    }

    // Внутрь: таблетки 500 мг — с 12 лет при массе ≥ 40 кг (инструкция таблеток 500 мг);
    // взрослым ≥ 50 кг — 1 г разово (максимум разовой дозы 1 г, суточной 4 г)
    if (w >= 40 && atLeast(a, 12)) {
      const mg = isAdult(a) && w >= 50 ? 1000 : Math.max(500, Math.floor(Math.min(15 * w, 1000) / 250) * 250);
      return {
        result1: mg,
        result3: mg / PARA_TAB_MG,
        result5: daily,
        result6: `Внутрь, запить водой: ${num(mg / PARA_TAB_MG, 1)} таб. по 500 мг. Разово 500–1000 мг. ${interval}`,
        result7: isAdult(a) ? 'Факторы риска гепатотоксичности (болезни печени, алкоголизм, истощение): не более 2–3 г/сут.' : undefined,
      };
    }
    // Суспензия: 15 мг/кг (верхняя граница 10–15 мг/кг инструкции; 4 дозы = 60 мг/кг/сут по КР),
    // не более 1 г на приём
    const mg = Math.min(15 * w, 1000);
    const ml = mg / PARA_SUSP_MG_ML;
    return {
      result1: mg,
      result2: ml,
      result5: daily,
      result6: `Внутрь: ${mlText(ml)} мл суспензии 120 мг/5 мл мерным шприцем (15 мг/кг; допустимо 10–15 мг/кг = ${num(Math.min(10 * w, 1000), 0)}–${num(mg, 0)} мг). ${interval}`,
    };
  },
  units: { result1: 'мг', result2: 'мл', result3: 'таб', result4: 'мл', result5: 'мг' },
  labels: {
    result1: 'Разовая доза',
    result2: 'Объём суспензии 120 мг/5 мл (внутрь)',
    result3: 'Таблеток по 500 мг (внутрь)',
    result4: 'Объём раствора 10 мг/мл (в/в)',
    result5: 'Суточный максимум',
    result6: 'Введение',
    result7: 'Внимание',
  },
  // Максимумы: разово 1 г (все пути), суточно 4 г (инструкции); в/в — максимальная разовая доза
  // весовой группы («Парацетамол Каби»: 7.5 / 49.5 / 75 / 100 мл)
  limits: ({ weight, route } = {}) => {
    const w = weightOf(weight);
    if (route === 'iv' && w > 0) {
      const d = paracetamolIv(w);
      return { result1: { max: d.singleMax }, result4: { max: d.singleMax / PARA_IV_MG_ML }, result5: { max: 4000 } };
    }
    return {
      result1: { max: 1000 },
      result2: { max: 1000 / PARA_SUSP_MG_ML },
      result3: { max: 2 },
      result5: { max: 4000 },
    };
  },
  warnings: [
    'Детям: разово 10–15 мг/кг, не более 60 мг/кг/сут (КР «ОРВИ»); взрослым разово до 1 г, не более 4 г/сут.',
    'Противопоказан до 3 мес внутрь и ректально (КР «ОРВИ»), в/в — до 1 мес (инструкция); тяжёлая печёночная недостаточность.',
    'Не чередовать и не комбинировать с ибупрофеном; повтор — только после нового подъёма температуры, с интервалом не менее 4 ч (КР «ОРВИ»).',
    'В/в: путаница мг и мл опасна — объём дан для раствора 10 мг/мл.',
  ],
};

/** ------------------------------ Ибупрофен ------------------------------ **/

const IBUPROFEN_ROUTE = routeInput(['po', 'pr'], 'po');
const IBU_SUSP_MG_ML = 20; // «Нурофен для детей» суспензия 100 мг/5 мл
const IBU_TAB_MG = 200;
const IBU_SUPP_MG = 60; // «Нурофен для детей» суппозитории 60 мг

// Внутрь — инструкция «Нурофен для детей» суспензия 100 мг/5 мл (разовые дозы по массе тела):
// 5–9 кг — 50 мг; 10–16 кг — 100 мг; 17–20 кг — 150 мг; 21–30 кг — 200 мг; 31–40 кг — 300 мг
// (≈ 6–10 мг/кг); суточно — 3 дозы (6–12 мес — до 4), не более 30 мг/кг/сут (КР «ОРВИ», инструкция).
// С 12 лет при массе > 40 кг — 400 мг (таблетки 200 мг: 200–400 мг, не более 1200 мг/сут).
export const ibuprofenOral = (w, a) => {
  if (atLeast(a, 12) && w > 40) return { mg: 400, daily: 1200 };
  let mg;
  let perDay = 3;
  if (w < 10) {
    mg = 50;
    if (atLeast(a, 0.5)) perDay = 4;
  } else if (w < 17) mg = 100;
  else if (w < 21) mg = 150;
  else if (w < 31) mg = 200;
  else mg = 300;
  return { mg, daily: Math.min(mg * perDay, 30 * w) };
};

const ibuprofen = {
  name: 'Ибупрофен',
  synonyms: ['нурофен', 'ибуфен'],
  description:
    'Суспензия для приёма внутрь 100 мг/5 мл (20 мг/мл); таблетки 200 мг; суппозитории ректальные 60 мг (3 мес – 2 года). Объём — суспензии 100 мг/5 мл',
  inputs: { weight: 'Вес (кг)', ageYears: 'Возраст (лет)', route: IBUPROFEN_ROUTE },
  formula: ({ weight, ageYears, route }) => {
    const w = weightOf(weight);
    const a = ageOf(ageYears);
    if (w <= 0 || Number.isNaN(a)) return {};
    const r = routeOf(IBUPROFEN_ROUTE, route);

    if (r === 'pr') {
      // Инструкция «Нурофен для детей» суппозитории 60 мг: 3 мес – 2 года, масса ≥ 6 кг;
      // 3–9 мес (6–8 кг) — до 3 раз (≤ 180 мг/сут), 9 мес – 2 года (8–12 кг) — до 4 раз (≤ 240 мг/сут);
      // интервал 6–8 ч, не более 30 мг/кг/сут
      if (a < 0.25 - EPS || w < 6) {
        return { result6: 'Свечи 60 мг: противопоказаны до 3 мес и при массе < 6 кг (инструкция). Расчёт не выполняется.' };
      }
      if (atLeast(a, 2)) {
        return { result6: 'Свечи 60 мг — только детям до 2 лет (инструкция). Старше — выберите «внутрь».' };
      }
      const daily = Math.min(a < 0.75 - EPS ? 180 : 240, 30 * w);
      const out = {
        result1: IBU_SUPP_MG,
        result4: daily,
        result5: `1 свеча 60 мг ректально (${num(IBU_SUPP_MG / w, 1)} мг/кг). Повтор через 6–8 ч, не более ${a < 0.75 - EPS ? 3 : 4} раз за 24 ч.`,
        result6: 'Ректально — при рвоте или непереносимости приёма внутрь (КР «ОРВИ»).',
      };
      if (w > 12) out.result6 += ' Масса > 12 кг: по инструкции свечи — для 6–12 кг, доза мала; точнее — суспензия внутрь.';
      return out;
    }

    // Внутрь: противопоказан до 3 мес и при массе < 5 кг (КР «ОРВИ», инструкция «Нурофен для детей»)
    if (a < 0.25 - EPS || w < 5) {
      return { result6: 'Внутрь: противопоказан до 3 мес и при массе < 5 кг (КР «ОРВИ», инструкция). Расчёт не выполняется.' };
    }
    const d = ibuprofenOral(w, a);
    const out = { result1: d.mg, result4: d.daily };
    // Суспензия — детям до 12 лет и всем, кому доза не кратна целой таблетке
    if (d.mg % IBU_TAB_MG !== 0 || a < 12 - EPS) out.result2 = d.mg / IBU_SUSP_MG_ML;
    // Таблетки 200 мг — с 6 лет при массе ≥ 20 кг (инструкция таблеток); не делить
    if (d.mg % IBU_TAB_MG === 0 && atLeast(a, 6) && w >= 20) out.result3 = d.mg / IBU_TAB_MG;
    const how = [];
    if (out.result2) how.push(`${mlText(out.result2)} мл суспензии 100 мг/5 мл мерным шприцем`);
    if (out.result3) how.push(`${out.result3} таб. по 200 мг`);
    out.result5 = `Внутрь после еды: ${how.join(' или ')} (${num(d.mg / w, 1)} мг/кг). Повтор через 6–8 ч; не более 30 мг/кг/сут.`;
    if (a < 0.5 - EPS) out.result6 = '3–6 мес: без врача не более 24 ч (инструкция).';
    return out;
  },
  units: { result1: 'мг', result2: 'мл', result3: 'таб', result4: 'мг' },
  labels: {
    result1: 'Разовая доза',
    result2: 'Объём суспензии 100 мг/5 мл (внутрь)',
    result3: 'Таблеток по 200 мг (внутрь)',
    result4: 'Суточный максимум',
    result5: 'Введение',
    result6: 'Внимание',
  },
  // Разово не более 400 мг, суточно не более 1200 мг (инструкции, безрецептурный режим);
  // свечи — 60 мг разово, до 240 мг/сут
  limits: ({ route } = {}) =>
    route === 'pr'
      ? { result1: { max: IBU_SUPP_MG }, result4: { max: 240 } }
      : { result1: { max: 400 }, result2: { max: 400 / IBU_SUSP_MG_ML }, result3: { max: 2 }, result4: { max: 1200 } },
  warnings: [
    'Детям не более 30 мг/кг/сут; противопоказан до 3 мес и при массе < 5 кг (КР «ОРВИ», инструкция).',
    'Противопоказан: обезвоживание (рвота, диарея — риск ОПП), ЖКК и язва, «аспириновая» астма, тяжёлая почечная или печёночная недостаточность, нарушения свёртывания, беременность > 20 нед.',
    'Ветряная оспа — избегать НПВП: риск тяжёлых бактериальных инфекций кожи (BNFc, международно).',
    'Не чередовать и не комбинировать с парацетамолом (КР «ОРВИ»).',
  ],
};

/** ------------------------------ Преднизолон ------------------------------ **/

const PRED_MG_ML = 30; // раствор для в/в и в/м введения 30 мг/мл, амп. 1 мл
const PRED_TAB_MG = 5;

const PRED = indicationRoute(
  [
    { value: 'anaphylaxis-iv', indication: 'anaphylaxis', route: 'iv', label: 'Анафилаксия' },
    { value: 'anaphylaxis-im', indication: 'anaphylaxis', route: 'im', label: 'Анафилаксия' },
    { value: 'asthma-iv', indication: 'asthma', route: 'iv', label: 'Обострение астмы' },
    { value: 'asthma-im', indication: 'asthma', route: 'im', label: 'Обострение астмы' },
    { value: 'asthma-po', indication: 'asthma', route: 'po', label: 'Обострение астмы' },
    { value: 'croup-po', indication: 'croup', route: 'po', label: 'Круп' },
    { value: 'croup-im', indication: 'croup', route: 'im', label: 'Круп' },
    { value: 'croup-iv', indication: 'croup', route: 'iv', label: 'Круп' },
  ],
  'anaphylaxis-iv'
);

// КР «Бронхиальная астма» (ID 359): предел дозы преднизолона детям по возрасту
export const asthmaPredCapMg = (a) => {
  if (a < 2 - EPS) return 20;
  if (a < 6 - EPS) return 30;
  if (a < 12 - EPS) return 40;
  return 50;
};

// Доза преднизолона: { mg (нижняя граница), up (верхняя граница), cap, source }
export const prednisoloneDose = (w, a, indication, route) => {
  const adult = isAdult(a);
  if (indication === 'anaphylaxis') {
    // КР «Анафилактический шок» (263_2), рек. 24: взрослым преднизолон 60–120 мг; детям
    // 1.3–2.6 мг/кг, максимум 50 мг
    if (adult) return { mg: 60, up: 120, cap: 120, range: 'взрослым 60–120 мг' };
    return { mg: Math.min(1.3 * w, 50), up: Math.min(2.6 * w, 50), cap: 50, range: '1.3–2.6 мг/кг, не более 50 мг' };
  }
  if (indication === 'asthma') {
    // КР «Бронхиальная астма» (359_3): взрослым 40–50 мг/сут; детям 1–2 мг/кг/сут с пределом по
    // возрасту; на догоспитальном этапе детям в/м 1 мг/кг, внутрь 1–2 мг/кг не более 40 мг
    if (adult) return { mg: 40, up: 50, cap: 50, range: 'взрослым 40–50 мг/сут' };
    const cap = route === 'po' ? Math.min(asthmaPredCapMg(a), 40) : asthmaPredCapMg(a);
    return { mg: Math.min(w, cap), up: Math.min(2 * w, cap), cap, range: `1–2 мг/кг, не более ${cap} мг в этом возрасте` };
  }
  // Круп — КР «Круп и эпиглоттит» (2024), 3.1.1: при отсутствии дексаметазона преднизолон 1–2 мг/кг
  // (≈ дексаметазон 0.15–0.6 мг/кг). Предел в КР не указан: принят 50 мг — как детский максимум
  // преднизолона в КР «Анафилактический шок» (консервативно).
  return { mg: Math.min(w, 50), up: Math.min(2 * w, 50), cap: 50, range: '1–2 мг/кг, не более 50 мг' };
};

// Внутрь — таблетки 5 мг: доза округляется до ½ таблетки (2.5 мг), но не выше предела
const roundHalfTab = (mg, tabMg, cap) => Math.min(Math.max(tabMg / 2, Math.round(mg / (tabMg / 2)) * (tabMg / 2)), cap);

const prednisolone = {
  name: 'Преднизолон',
  synonyms: ['медопред', 'преднизолона натрия фосфат'],
  description:
    'Раствор для в/в и в/м введения 30 мг/мл — амп. 1 мл; таблетки 5 мг. Объём — раствора 30 мг/мл',
  inputs: { weight: 'Вес (кг)', ageYears: 'Возраст (лет)', indication: PRED.input },
  formula: ({ weight, ageYears, indication }) => {
    const w = weightOf(weight);
    const a = ageOf(ageYears);
    if (w <= 0 || Number.isNaN(a)) return {};
    const { indication: ind, route } = PRED.parse(indication);
    const d = prednisoloneDose(w, a, ind, route);
    const adult = isAdult(a);

    if (route === 'po') {
      const mg = roundHalfTab(d.mg, PRED_TAB_MG, d.cap);
      const extra =
        ind === 'croup'
          ? 'Внутрь предпочтительно детям старше 3 лет (КР «Круп»).'
          : `Допустимо до ${num(d.up, 1)} мг (${d.range}). Курс у детей 3–5 дней, у взрослых 5–7 дней (КР «БА»).`;
      return {
        result1: mg,
        result3: mg / PRED_TAB_MG,
        result4: `Внутрь утром после еды: ${num(mg / PRED_TAB_MG, 1)} таб. по 5 мг. ${extra}`,
        result5: ind === 'croup' ? 'Препарат выбора при крупе — дексаметазон: после преднизолона чаще возврат симптомов (КР «Круп»).' : undefined,
      };
    }

    const ml = d.mg / PRED_MG_ML;
    const upMl = d.up / PRED_MG_ML;
    const how = route === 'iv' ? 'В/в медленно струйно' : 'В/м глубоко';
    let note = `${how}: ${mlText(ml)} мл раствора 30 мг/мл. Верхняя граница — ${num(d.up, 1)} мг (${mlText(upMl)} мл): ${d.range}.`;
    let warn;
    if (ind === 'anaphylaxis') {
      note += ' Только после эпинефрина и стабилизации АД — ГКС не заменяют эпинефрин (КР «Анафилактический шок»).';
      if (adult && route === 'im') warn = 'Взрослым КР предусматривают в/в введение; в/м — если нет венозного доступа.';
    } else if (ind === 'croup') {
      note += ' Обычно достаточно однократного введения.';
      warn = 'Препарат выбора при крупе — дексаметазон: после преднизолона чаще возврат симптомов (КР «Круп»).';
    } else if (!adult) {
      note += ' Догоспитально детям — 1 мг/кг в/м (КР «БА»).';
    }
    return { result1: d.mg, result2: ml, result4: note, result5: warn };
  },
  units: { result1: 'мг', result2: 'мл', result3: 'таб' },
  labels: {
    result1: 'Разовая доза',
    result2: 'Объём раствора 30 мг/мл',
    result3: 'Таблеток по 5 мг (внутрь)',
    result4: 'Введение',
    result5: 'Внимание',
  },
  limits: ({ weight, ageYears, indication } = {}) => {
    const { indication: ind, route } = PRED.parse(indication);
    const d = prednisoloneDose(weightOf(weight) || 1, ageOf(ageYears) || 0, ind, route);
    return { result1: { max: d.cap }, result2: { max: d.cap / PRED_MG_ML }, result3: { max: d.cap / PRED_TAB_MG } };
  },
  warnings: [
    'Расчёт — по нижней границе диапазона КР; верхняя граница — в примечании.',
    'Анафилаксия: ГКС — после эпинефрина, для профилактики затяжных респираторных проявлений; детям не более 50 мг (КР «Анафилактический шок»).',
    'Астма у детей: до 20 мг до 2 лет, 30 мг в 2–5 лет, 40 мг в 6–11 лет, 50 мг с 12 лет (КР «Бронхиальная астма»).',
    'Гипергликемия, повышение АД; при сахарном диабете — контроль глюкозы.',
  ],
};

/** ------------------------------ Дексаметазон ------------------------------ **/

const DEX_MG_ML = 4; // раствор для в/в и в/м введения 4 мг/мл, амп. 1 и 2 мл
const DEX_TAB_MG = 0.5;
const DEX_CHILD_CAP = 10;

const DEX = indicationRoute(
  [
    { value: 'anaphylaxis-iv', indication: 'anaphylaxis', route: 'iv', label: 'Анафилаксия' },
    { value: 'anaphylaxis-im', indication: 'anaphylaxis', route: 'im', label: 'Анафилаксия' },
    { value: 'croup-po', indication: 'croup', route: 'po', label: 'Круп' },
    { value: 'croup-im', indication: 'croup', route: 'im', label: 'Круп' },
    { value: 'croup-iv', indication: 'croup', route: 'iv', label: 'Круп' },
  ],
  'anaphylaxis-iv'
);

export const dexamethasoneDose = (w, a, indication) => {
  if (indication === 'anaphylaxis') {
    // КР «Анафилактический шок» (263_2), рек. 24: взрослым дексаметазон 8–16 мг; детям в/в или в/м
    // 0.1–0.4 мг/кг, максимум 10 мг
    if (isAdult(a)) return { mg: 8, up: 16, cap: 16, range: 'взрослым 8–16 мг' };
    return { mg: Math.min(0.1 * w, DEX_CHILD_CAP), up: Math.min(0.4 * w, DEX_CHILD_CAP), cap: DEX_CHILD_CAP, range: '0.1–0.4 мг/кг, не более 10 мг' };
  }
  // Круп — КР «Круп и эпиглоттит» (2024), 3.1.1: 0.15–0.6 мг/кг в/м (в/в), внутрь — 0.15 мг/кг.
  // Предел в КР не указан: 10 мг — консервативно (детский максимум дексаметазона в КР
  // «Анафилактический шок»; международные руководства — 10–16 мг).
  return { mg: Math.min(0.15 * w, DEX_CHILD_CAP), up: Math.min(0.6 * w, DEX_CHILD_CAP), cap: DEX_CHILD_CAP, range: '0.15–0.6 мг/кг, не более 10 мг' };
};

const dexamethasone = {
  name: 'Дексаметазон',
  synonyms: ['дексаметазона натрия фосфат', 'дексамед', 'дексона'],
  description:
    'Раствор для в/в и в/м введения 4 мг/мл — амп. 1 мл (4 мг) и 2 мл (8 мг); таблетки 0.5 мг. Объём — раствора 4 мг/мл',
  inputs: { weight: 'Вес (кг)', ageYears: 'Возраст (лет)', indication: DEX.input },
  formula: ({ weight, ageYears, indication }) => {
    const w = weightOf(weight);
    const a = ageOf(ageYears);
    if (w <= 0 || Number.isNaN(a)) return {};
    const { indication: ind, route } = DEX.parse(indication);
    const d = dexamethasoneDose(w, a, ind);

    if (route === 'po') {
      // Внутрь — КР «Круп»: 0.15 мг/кг; таблетки 0.5 мг, доза округляется до ½ таблетки
      const mg = roundHalfTab(d.mg, DEX_TAB_MG, d.cap);
      const dose = 0.15 * w > d.cap ? `достигнут предел ${d.cap} мг` : '0.15 мг/кг';
      const liquid = isAdult(a)
        ? ''
        : ` Маленьким детям — раствор для инъекций 4 мг/мл внутрь: ${mlText(mg / DEX_MG_ML)} мл (вне инструкции).`;
      return {
        result1: mg,
        result3: mg / DEX_TAB_MG,
        result4: `Внутрь однократно: ${num(mg / DEX_TAB_MG, 1)} таб. по 0.5 мг (${dose}).${liquid} Внутрь предпочтительно детям старше 3 лет (КР «Круп»).`,
      };
    }

    const ml = d.mg / DEX_MG_ML;
    const upMl = d.up / DEX_MG_ML;
    const how = route === 'iv' ? 'В/в медленно струйно' : 'В/м';
    let note = `${how}: ${mlText(ml)} мл раствора 4 мг/мл.`;
    let warn;
    if (ind === 'croup') {
      note += ` Тяжёлый круп (стеноз гортани II–III ст.): до ${num(d.up, 2)} мг (${mlText(upMl)} мл) — ${d.range}. Обычно достаточно однократного введения (КР «Круп»).`;
    } else {
      note += ` Верхняя граница — ${num(d.up, 2)} мг (${mlText(upMl)} мл): ${d.range}. Только после эпинефрина и стабилизации АД (КР «Анафилактический шок»).`;
      if (isAdult(a) && route === 'im') warn = 'Взрослым КР предусматривают в/в введение; в/м — если нет венозного доступа.';
    }
    return { result1: d.mg, result2: ml, result4: note, result5: warn };
  },
  units: { result1: 'мг', result2: 'мл', result3: 'таб' },
  labels: {
    result1: 'Разовая доза',
    result2: 'Объём раствора 4 мг/мл',
    result3: 'Таблеток по 0.5 мг (внутрь)',
    result4: 'Введение',
    result5: 'Внимание',
  },
  limits: ({ weight, ageYears, indication } = {}) => {
    const { indication: ind } = DEX.parse(indication);
    const d = dexamethasoneDose(weightOf(weight) || 1, ageOf(ageYears) || 0, ind);
    return { result1: { max: d.cap }, result2: { max: d.cap / DEX_MG_ML }, result3: { max: d.cap / DEX_TAB_MG } };
  },
  warnings: [
    'Расчёт — по нижней границе диапазона КР; верхняя граница — в примечании.',
    'Круп: препарат выбора, однократно; внутрь — 0.15 мг/кг, в/м или в/в — 0.15–0.6 мг/кг (КР «Круп»); предел 10 мг принят консервативно.',
    'Анафилаксия: после эпинефрина; детям 0.1–0.4 мг/кг, не более 10 мг; взрослым 8–16 мг (КР «Анафилактический шок»).',
  ],
};

/** ------------------------------ Гидрокортизон ------------------------------ **/

const HC_MG_ML = 50; // Солу-Кортеф 100 мг, растворённый в 2 мл → 50 мг/мл
const HC_SUSP_MG_ML = 25; // суспензия гидрокортизона ацетата 25 мг/мл — только в/м

const HC = indicationRoute(
  [
    { value: 'crisis-iv', indication: 'crisis', route: 'iv', label: 'Надпочечниковый криз' },
    { value: 'crisis-im', indication: 'crisis', route: 'im', label: 'Надпочечниковый криз' },
    { value: 'anaphylaxis-iv', indication: 'anaphylaxis', route: 'iv', label: 'Анафилаксия' },
    { value: 'anaphylaxis-im', indication: 'anaphylaxis', route: 'im', label: 'Анафилаксия' },
  ],
  'crisis-iv'
);

// Площадь поверхности тела по массе — формула Costeff (Arch Dis Child 1966): (4 × кг + 7) / (кг + 90);
// рост в записи не запрашивается, для детей погрешность в пределах 10%
export const bsaCosteff = (w) => (4 * w + 7) / (w + 90);

export const hydrocortisoneDose = (w, a, indication) => {
  if (indication === 'anaphylaxis') {
    // КР «Анафилактический шок» (263_2), рек. 24: взрослым #гидрокортизон 200 мг в/в;
    // детям в/в или в/м 2–4 мг/кг, максимум 100 мг
    if (isAdult(a)) return { mg: 200, up: 200, cap: 200, range: 'взрослым 200 мг' };
    return { mg: Math.min(2 * w, 100), up: Math.min(4 * w, 100), cap: 100, range: '2–4 мг/кг, не более 100 мг' };
  }
  // Криз — КР «Первичная надпочечниковая недостаточность» (524_3): взрослым 100 мг болюсно;
  // детям 100 мг/м² болюсно (не выше взрослой дозы 100 мг)
  if (isAdult(a)) return { mg: 100, cap: 100, bsa: null };
  const bsa = bsaCosteff(w);
  return { mg: Math.min(100 * bsa, 100), cap: 100, bsa };
};

const hydrocortisone = {
  name: 'Гидрокортизон',
  synonyms: ['солу-кортеф', 'гидрокортизона натрия сукцинат', 'гидрокортизона ацетат'],
  description:
    'Гидрокортизона натрия сукцинат (Солу-Кортеф), лиофилизат 100 мг — после растворения 50 мг/мл (2 мл), в/в и в/м; суспензия гидрокортизона ацетата 25 мг/мл — только в/м. Объём — раствора 50 мг/мл',
  inputs: { weight: 'Вес (кг)', ageYears: 'Возраст (лет)', indication: HC.input },
  formula: ({ weight, ageYears, indication }) => {
    const w = weightOf(weight);
    const a = ageOf(ageYears);
    if (w <= 0 || Number.isNaN(a)) return {};
    const { indication: ind, route } = HC.parse(indication);
    const d = hydrocortisoneDose(w, a, ind);
    const adult = isAdult(a);
    const ml = d.mg / HC_MG_ML;
    const how = route === 'iv' ? 'В/в медленно (не менее 30 с)' : 'В/м глубоко';
    const susp = route === 'im' ? ` Суспензия ацетата 25 мг/мл: ${mlText(d.mg / HC_SUSP_MG_ML)} мл (только в/м, действует медленнее).` : '';
    let note;
    let warn;
    if (ind === 'crisis') {
      if (adult) {
        // КР 524_3 (взрослые): далее 200 мг/сут непрерывно или по 50 мг каждые 6 ч; 0.9% NaCl 1000 мл за 1-й час
        note = `${how}: ${mlText(ml)} мл раствора 50 мг/мл (100 мг). Далее 200 мг/сут в/в непрерывно или по 50 мг каждые 6 ч; 0.9% NaCl 1000 мл за первый час.${susp}`;
      } else {
        // КР 524_3 (дети): далее 100–200 мг/м²/сут; 0.9% NaCl + 5–10% глюкоза 450–500 мл/м² за 1-й час
        const bsa = d.bsa;
        note = `${how}: ${mlText(ml)} мл раствора 50 мг/мл (100 мг/м², ППТ ≈ ${num(bsa, 2)} м² по массе). Далее 100–200 мг/м²/сут = ${num(100 * bsa, 0)}–${num(200 * bsa, 0)} мг/сут в/в; 0.9% NaCl + 5–10% глюкоза ${num(450 * bsa, 0)}–${num(500 * bsa, 0)} мл за первый час.${susp}`;
        if (route === 'im') warn = 'До госпитализации КР допускают 25–50 мг в/м (самостоятельное введение пациентом).';
      }
    } else {
      note = `${how}: ${mlText(ml)} мл раствора 50 мг/мл.${d.up > d.mg ? ` Верхняя граница — ${num(d.up, 1)} мг (${mlText(d.up / HC_MG_ML)} мл): ${d.range}.` : ''} Только после эпинефрина и стабилизации АД (КР «Анафилактический шок»).${susp}`;
      if (adult && route === 'im') warn = 'Взрослым КР предусматривают в/в введение; в/м — если нет венозного доступа.';
    }
    return { result1: d.mg, result2: ml, result3: note, result4: warn };
  },
  units: { result1: 'мг', result2: 'мл' },
  labels: { result1: 'Разовая доза', result2: 'Объём раствора 50 мг/мл', result3: 'Введение', result4: 'Внимание' },
  limits: ({ weight, ageYears, indication } = {}) => {
    const { indication: ind } = HC.parse(indication);
    const d = hydrocortisoneDose(weightOf(weight) || 1, ageOf(ageYears) || 0, ind);
    return { result1: { max: d.cap }, result2: { max: d.cap / HC_MG_ML } };
  },
  warnings: [
    'Надпочечниковый криз: вводить сразу, не дожидаясь анализов; инфузия 0.9% NaCl с глюкозой, контроль глюкозы, натрия, калия (КР «Первичная надпочечниковая недостаточность»).',
    'В/в — только гидрокортизона натрия сукцинат (Солу-Кортеф); суспензию ацетата вводить только в/м.',
    'Анафилаксия: после эпинефрина; детям 2–4 мг/кг, не более 100 мг; взрослым 200 мг в/в (КР «Анафилактический шок»).',
  ],
};

const group = [paracetamol, ibuprofen, prednisolone, dexamethasone, hydrocortisone];

export default group;
