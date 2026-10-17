import group, {
  PARACETAMOL_SUPP_MG,
  paracetamolSuppositories,
  paracetamolIv,
  ibuprofenOral,
  asthmaPredCapMg,
  prednisoloneDose,
  dexamethasoneDose,
  bsaCosteff,
  hydrocortisoneDose,
} from '../analgesics_steroids';
import { isChoiceInput, ROUTES } from '../../routes';
import { computeResult, buildCopyText, synonymsOf, searchFormulas } from '../../engine';

const byName = (name) => {
  const f = group.find((g) => g.name === name);
  if (!f) throw new Error(`нет записи ${name}`);
  return f;
};
const close = (v, expected) => expect(v).toBeCloseTo(expected, 6);
const limitsOf = (f, clean) => (typeof f.limits === 'function' ? f.limits(clean) : f.limits || {});
// Значения (не undefined) результата формулы
const defined = (r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined));
const months = (m) => m / 12;

const para = byName('Парацетамол');
const ibu = byName('Ибупрофен');
const pred = byName('Преднизолон');
const dex = byName('Дексаметазон');
const hc = byName('Гидрокортизон');

describe('группа анальгетиков и ГКС: контракт', () => {
  it('пять записей в заданном порядке', () => {
    expect(group.map((g) => g.name)).toEqual(['Парацетамол', 'Ибупрофен', 'Преднизолон', 'Дексаметазон', 'Гидрокортизон']);
  });

  it.each(group.map((g) => [g.name, g]))('%s: поля контракта и пустой ввод', (_, f) => {
    expect(f.description.length).toBeGreaterThan(20);
    expect(typeof f.formula).toBe('function');
    expect(f.inputs.weight).toBe('Вес (кг)');
    expect(f.inputs.ageYears).toBe('Возраст (лет)');
    expect(Array.isArray(f.warnings)).toBe(true);
    expect(f.warnings.length).toBeGreaterThan(0);
    expect(f.formula({})).toEqual({});
    expect(f.formula({ weight: 0, ageYears: 5 })).toEqual({});
    expect(f.formula({ weight: 20 })).toEqual({});
    Object.keys(f.units).forEach((k) => expect(f.labels[k]).toBeTruthy());
    expect(Array.isArray(f.synonyms)).toBe(true);
  });

  it('пути — коды из routes.js, только утверждённые', () => {
    expect(para.inputs.route.choices.map((c) => c.value)).toEqual(['po', 'pr', 'iv']);
    expect(para.inputs.route.default).toBe('po');
    expect(ibu.inputs.route.choices.map((c) => c.value)).toEqual(['po', 'pr']);
    [para, ibu].forEach((f) => f.inputs.route.choices.forEach((c) => expect(c.label).toBe(ROUTES[c.value])));
  });

  it.each([
    [pred, ['anaphylaxis-iv', 'anaphylaxis-im', 'asthma-iv', 'asthma-im', 'asthma-po', 'croup-po', 'croup-im', 'croup-iv']],
    [dex, ['anaphylaxis-iv', 'anaphylaxis-im', 'croup-po', 'croup-im', 'croup-iv']],
    [hc, ['crisis-iv', 'crisis-im', 'anaphylaxis-iv', 'anaphylaxis-im']],
  ])('%#: «Показание и путь» с подписью пути из routes', (f, values) => {
    const ch = f.inputs.indication;
    expect(isChoiceInput(ch)).toBe(true);
    expect(ch.label).toBe('Показание и путь');
    expect(ch.choices.map((c) => c.value)).toEqual(values);
    expect(values).toContain(ch.default);
    ch.choices.forEach((c) => {
      const code = c.value.split('-')[1];
      expect(ROUTES[code]).toBeDefined();
      expect(c.label.endsWith(`— ${ROUTES[code]}`)).toBe(true);
    });
  });

  it('поиск по торговым названиям', () => {
    expect(synonymsOf(para)).toContain('панадол');
    expect(searchFormulas(group, 'нурофен')[0].formula.name).toBe('Ибупрофен');
    expect(searchFormulas(group, 'солу-кортеф')[0].formula.name).toBe('Гидрокортизон');
  });
});

describe('Парацетамол — внутрь', () => {
  it('ребёнок 5 лет 20 кг: 15 мг/кг = 300 мг = 12.5 мл суспензии, ≤ 1200 мг/сут', () => {
    const r = para.formula({ weight: 20, ageYears: 5, route: 'po' });
    close(r.result1, 300);
    close(r.result2, 12.5);
    close(r.result5, 1200);
    expect(r.result3).toBeUndefined();
    expect(r.result6).toMatch(/200–300 мг/);
  });

  it('3 мес (граница): считается; 2 мес — противопоказан, расчёта нет', () => {
    const r = para.formula({ weight: 6, ageYears: months(3), route: 'po' });
    close(r.result1, 90);
    close(r.result2, 3.75);
    const young = para.formula({ weight: 5, ageYears: months(2), route: 'po' });
    expect(young.result1).toBeUndefined();
    expect(young.result7).toMatch(/До 3 мес — противопоказан/);
    expect(para.formula({ weight: 3.5, ageYears: 0, route: 'po' }).result1).toBeUndefined();
  });

  it('взрослый 70 кг: 1 г = 2 таб. 500 мг, суточно 4 г — на пределе', () => {
    const clean = { weight: 70, ageYears: 30, route: 'po' };
    const r = para.formula(clean);
    expect(r.result1).toBe(1000);
    expect(r.result3).toBe(2);
    expect(r.result5).toBe(4000);
    expect(r.result2).toBeUndefined();
    expect(limitsOf(para, clean).result1.max).toBe(1000);
    const res = computeResult(para, clean);
    expect(res.items.find((i) => i.key === 'result1').status).toBe('atmax');
  });

  it('подросток 14 лет 45 кг: таблетки, доза кратна ½ таб. и не выше 15 мг/кг', () => {
    const r = para.formula({ weight: 45, ageYears: 14, route: 'po' });
    expect(r.result1).toBe(500);
    expect(r.result3).toBe(1);
    close(r.result5, 2700);
  });

  it('ребёнок 11 лет 80 кг: на суспензии доза ограничена 1 г', () => {
    const r = para.formula({ weight: 80, ageYears: 11, route: 'po' });
    expect(r.result1).toBe(1000);
    close(r.result2, 1000 / 24);
    expect(r.result5).toBe(4000);
  });

  it('путь по умолчанию — внутрь', () => {
    expect(para.formula({ weight: 20, ageYears: 5 }).result2).toBeCloseTo(12.5, 6);
  });
});

describe('Парацетамол — ректально', () => {
  it('подбор свечей: одна, если ≥ 10 мг/кг; иначе пара не выше 15 мг/кг', () => {
    expect(PARACETAMOL_SUPP_MG).toEqual([500, 250, 100, 50]);
    expect(paracetamolSuppositories(20)).toEqual({ mg: 250, parts: [250] });
    expect(paracetamolSuppositories(12)).toEqual({ mg: 150, parts: [100, 50] });
    expect(paracetamolSuppositories(70)).toEqual({ mg: 1000, parts: [500, 500] });
    expect(paracetamolSuppositories(6)).toEqual({ mg: 50, parts: [50] });
    expect(paracetamolSuppositories(3)).toBeNull();
  });

  it('ребёнок 5 лет 20 кг: свеча 250 мг (12.5 мг/кг)', () => {
    const r = para.formula({ weight: 20, ageYears: 5, route: 'pr' });
    expect(r.result1).toBe(250);
    expect(r.result6).toMatch(/1 × 250 мг \(12\.5 мг\/кг/);
    expect(r.result7).toMatch(/рвоте/);
    expect(r.result2).toBeUndefined();
  });

  it('взрослый 70 кг: 2 свечи по 500 мг', () => {
    const r = para.formula({ weight: 70, ageYears: 40, route: 'pr' });
    expect(r.result1).toBe(1000);
    expect(r.result6).toMatch(/2 × 500 мг/);
  });

  it('6 кг: 50 мг — ниже 10 мг/кг отмечено; до 3 мес — расчёта нет', () => {
    expect(para.formula({ weight: 6, ageYears: months(4), route: 'pr' }).result7).toMatch(/меньше 10 мг\/кг/);
    expect(para.formula({ weight: 5, ageYears: months(2), route: 'pr' }).result1).toBeUndefined();
    expect(para.formula({ weight: 3, ageYears: months(3), route: 'pr' }).result7).toMatch(/суспензию/);
  });
});

describe('Парацетамол — в/в', () => {
  it('весовые группы инструкции', () => {
    expect(paracetamolIv(8)).toMatchObject({ mg: 60, daily: 240, singleMax: 75 });
    expect(paracetamolIv(10)).toMatchObject({ mg: 75, daily: 300 });
    expect(paracetamolIv(20)).toMatchObject({ mg: 300, daily: 1200, singleMax: 495 });
    expect(paracetamolIv(33)).toMatchObject({ mg: 495, daily: 1980 });
    expect(paracetamolIv(40)).toMatchObject({ mg: 600, daily: 2400, singleMax: 750 });
    expect(paracetamolIv(50)).toMatchObject({ mg: 750, daily: 3000 });
    expect(paracetamolIv(51)).toMatchObject({ mg: 1000, daily: 4000 });
  });

  it('ребёнок 20 кг: 300 мг = 30 мл раствора 10 мг/мл', () => {
    const r = para.formula({ weight: 20, ageYears: 5, route: 'iv' });
    close(r.result1, 300);
    close(r.result4, 30);
    close(r.result5, 1200);
    expect(r.result6).toMatch(/флакон 50 мл/);
  });

  it('грудной 8 кг: 7.5 мг/кг, развести, ≤ 7.5 мл', () => {
    const r = para.formula({ weight: 8, ageYears: months(6), route: 'iv' });
    close(r.result1, 60);
    close(r.result4, 6);
    expect(r.result6).toMatch(/1:10/);
    expect(limitsOf(para, { weight: 8, route: 'iv' }).result4.max).toBe(7.5);
  });

  it('взрослый 80 кг: 1 г (100 мл), суточно 4 г, предупреждение о гепатотоксичности', () => {
    const r = para.formula({ weight: 80, ageYears: 40, route: 'iv' });
    expect(r.result1).toBe(1000);
    expect(r.result4).toBe(100);
    expect(r.result7).toMatch(/3 г\/сут/);
  });

  it('новорождённый — противопоказан; 1–3 мес — считается с пометкой', () => {
    const neo = para.formula({ weight: 3.5, ageYears: 0, route: 'iv' });
    expect(neo.result1).toBeUndefined();
    expect(neo.result7).toMatch(/до 1 мес/);
    const inf = para.formula({ weight: 4.5, ageYears: months(1), route: 'iv' });
    close(inf.result1, 33.75);
    expect(inf.result7).toMatch(/КР «ОРВИ»/);
  });

  it('копия: путь и форма выпуска в тексте', () => {
    const res = computeResult(para, { weight: 20, ageYears: 5, route: 'iv' });
    expect(res.success).toBe(true);
    const text = buildCopyText(res);
    expect(text).toMatch(/Путь введения: в\/в/);
    expect(text).toMatch(/10 мг\/мл/);
  });
});

describe('Ибупрофен — внутрь', () => {
  it('таблица доз по массе', () => {
    expect(ibuprofenOral(5, 0.25)).toEqual({ mg: 50, daily: 150 });
    expect(ibuprofenOral(8, 0.75)).toEqual({ mg: 50, daily: 200 });
    expect(ibuprofenOral(12, 2)).toEqual({ mg: 100, daily: 300 });
    expect(ibuprofenOral(18, 5)).toEqual({ mg: 150, daily: 450 });
    expect(ibuprofenOral(25, 8)).toEqual({ mg: 200, daily: 600 });
    expect(ibuprofenOral(35, 11)).toEqual({ mg: 300, daily: 900 });
    expect(ibuprofenOral(50, 11)).toEqual({ mg: 300, daily: 900 });
    expect(ibuprofenOral(50, 12)).toEqual({ mg: 400, daily: 1200 });
  });

  it('разовая доза не выше 10 мг/кг на границах массы', () => {
    [5, 9.9, 10, 16.9, 17, 20.9, 21, 30.9, 31, 40].forEach((w) => {
      expect(ibuprofenOral(w, 5).mg / w).toBeLessThanOrEqual(10 + 1e-9);
      expect(ibuprofenOral(w, 5).daily / w).toBeLessThanOrEqual(30 + 1e-9);
    });
  });

  it('ребёнок 5 лет 20 кг: 150 мг = 7.5 мл суспензии', () => {
    const r = ibu.formula({ weight: 20, ageYears: 5, route: 'po' });
    expect(r.result1).toBe(150);
    close(r.result2, 7.5);
    expect(r.result3).toBeUndefined();
    expect(r.result4).toBe(450);
  });

  it('ребёнок 8 лет 25 кг: суспензия 10 мл или 1 таб. 200 мг', () => {
    const r = ibu.formula({ weight: 25, ageYears: 8, route: 'po' });
    close(r.result2, 10);
    expect(r.result3).toBe(1);
    expect(r.result5).toMatch(/или 1 таб/);
  });

  it('взрослый 70 кг: 400 мг = 2 таб., суточно 1200 мг — на пределе', () => {
    const clean = { weight: 70, ageYears: 30, route: 'po' };
    const r = ibu.formula(clean);
    expect(defined(r)).toMatchObject({ result1: 400, result3: 2, result4: 1200 });
    expect(r.result2).toBeUndefined();
    const res = computeResult(ibu, clean);
    expect(res.items.find((i) => i.key === 'result4').status).toBe('atmax');
  });

  it('до 3 мес или масса < 5 кг — противопоказан', () => {
    expect(ibu.formula({ weight: 5, ageYears: months(2), route: 'po' }).result1).toBeUndefined();
    expect(ibu.formula({ weight: 4.8, ageYears: months(4), route: 'po' }).result6).toMatch(/противопоказан/);
    expect(ibu.formula({ weight: 6, ageYears: months(4), route: 'po' }).result6).toMatch(/24 ч/);
  });
});

describe('Ибупрофен — ректально', () => {
  it('8 мес 7 кг: 60 мг, до 3 раз (180 мг/сут)', () => {
    const r = ibu.formula({ weight: 7, ageYears: months(8), route: 'pr' });
    expect(r.result1).toBe(60);
    expect(r.result4).toBe(180);
    expect(r.result5).toMatch(/не более 3 раз/);
  });

  it('1 год 10 кг: до 4 раз (240 мг/сут) — на пределе суточной', () => {
    const clean = { weight: 10, ageYears: 1, route: 'pr' };
    const r = ibu.formula(clean);
    expect(r.result4).toBe(240);
    expect(limitsOf(ibu, clean)).toEqual({ result1: { max: 60 }, result4: { max: 240 } });
  });

  it('масса > 12 кг до 2 лет — с пометкой; с 2 лет и до 3 мес / < 6 кг — нет расчёта', () => {
    expect(ibu.formula({ weight: 13, ageYears: 1, route: 'pr' }).result6).toMatch(/12 кг/);
    expect(ibu.formula({ weight: 12, ageYears: 2, route: 'pr' }).result1).toBeUndefined();
    expect(ibu.formula({ weight: 12, ageYears: 2, route: 'pr' }).result6).toMatch(/до 2 лет/);
    expect(ibu.formula({ weight: 5.5, ageYears: months(5), route: 'pr' }).result1).toBeUndefined();
    expect(ibu.formula({ weight: 7, ageYears: months(2), route: 'pr' }).result1).toBeUndefined();
  });

  it('взрослый: свечи не применяются', () => {
    expect(ibu.formula({ weight: 70, ageYears: 30, route: 'pr' }).result1).toBeUndefined();
  });
});

describe('Преднизолон', () => {
  it('пределы при астме по возрасту (КР БА)', () => {
    expect(asthmaPredCapMg(1)).toBe(20);
    expect(asthmaPredCapMg(2)).toBe(30);
    expect(asthmaPredCapMg(5)).toBe(30);
    expect(asthmaPredCapMg(6)).toBe(40);
    expect(asthmaPredCapMg(11)).toBe(40);
    expect(asthmaPredCapMg(12)).toBe(50);
  });

  it('анафилаксия, ребёнок 20 кг в/в: 1.3 мг/кг = 26 мг, верхняя граница 50 мг', () => {
    const r = pred.formula({ weight: 20, ageYears: 5, indication: 'anaphylaxis-iv' });
    close(r.result1, 26);
    close(r.result2, 26 / 30);
    expect(r.result4).toMatch(/В\/в/);
    expect(r.result4).toMatch(/50 мг/);
    expect(r.result4).toMatch(/эпинефрин/);
  });

  it('анафилаксия, ребёнок 50 кг: максимум 50 мг', () => {
    const clean = { weight: 50, ageYears: 15, indication: 'anaphylaxis-im' };
    const r = pred.formula(clean);
    expect(r.result1).toBe(50);
    expect(limitsOf(pred, clean).result1.max).toBe(50);
    expect(computeResult(pred, clean).items[0].status).toBe('atmax');
  });

  it('анафилаксия, взрослый: 60 мг (2 мл), до 120 мг; в/м — с пометкой', () => {
    const r = pred.formula({ weight: 70, ageYears: 40, indication: 'anaphylaxis-iv' });
    expect(r.result1).toBe(60);
    close(r.result2, 2);
    expect(r.result4).toMatch(/120 мг/);
    expect(r.result5).toBeUndefined();
    expect(pred.formula({ weight: 70, ageYears: 40, indication: 'anaphylaxis-im' }).result5).toMatch(/в\/в/);
  });

  it('астма в/м, ребёнок 3 года 14 кг: 1 мг/кг = 14 мг, верхняя граница 28 мг', () => {
    const r = pred.formula({ weight: 14, ageYears: 3, indication: 'asthma-im' });
    close(r.result1, 14);
    expect(r.result4).toMatch(/28 мг/);
  });

  it('астма, ребёнок 1 год 30 кг (несоответствие массы): предел 20 мг', () => {
    const clean = { weight: 30, ageYears: 1, indication: 'asthma-iv' };
    expect(pred.formula(clean).result1).toBe(20);
    expect(limitsOf(pred, clean).result1.max).toBe(20);
  });

  it('астма внутрь: таблетки 5 мг с округлением до ½, дети не более 40 мг', () => {
    const r = pred.formula({ weight: 13, ageYears: 2, indication: 'asthma-po' });
    expect(r.result1).toBe(12.5);
    expect(r.result3).toBe(2.5);
    expect(r.result2).toBeUndefined();
    const teen = pred.formula({ weight: 60, ageYears: 14, indication: 'asthma-po' });
    expect(teen.result1).toBe(40);
    expect(teen.result3).toBe(8);
  });

  it('астма, взрослый: 40 мг (до 50 мг)', () => {
    const r = pred.formula({ weight: 80, ageYears: 30, indication: 'asthma-po' });
    expect(r.result1).toBe(40);
    expect(r.result4).toMatch(/50 мг/);
    close(pred.formula({ weight: 80, ageYears: 30, indication: 'asthma-iv' }).result2, 40 / 30);
  });

  it('круп: 1 мг/кг, до 2 мг/кг, с пометкой о дексаметазоне', () => {
    const r = pred.formula({ weight: 15, ageYears: 3, indication: 'croup-im' });
    close(r.result1, 15);
    expect(r.result4).toMatch(/30 мг/);
    expect(r.result5).toMatch(/дексаметазон/);
    const po = pred.formula({ weight: 15, ageYears: 4, indication: 'croup-po' });
    expect(po.result1).toBe(15);
    expect(po.result3).toBe(3);
    expect(prednisoloneDose(40, 10, 'croup', 'iv')).toMatchObject({ mg: 40, up: 50, cap: 50 });
  });

  it('новорождённый 3.5 кг: доза по массе', () => {
    close(pred.formula({ weight: 3.5, ageYears: 0, indication: 'anaphylaxis-iv' }).result1, 4.55);
  });

  it('неизвестное значение выбора — по умолчанию (анафилаксия в/в)', () => {
    close(pred.formula({ weight: 20, ageYears: 5, indication: 'xxx' }).result1, 26);
  });
});

describe('Дексаметазон', () => {
  it('круп внутрь, ребёнок 15 кг: 0.15 мг/кг = 2.25 → 2.25 мг (4.5 таб. 0.5 мг)', () => {
    const r = dex.formula({ weight: 15, ageYears: 3, indication: 'croup-po' });
    expect(r.result1).toBe(2.25);
    expect(r.result3).toBe(4.5);
    expect(r.result4).toMatch(/0\.56 мл/);
  });

  it('круп в/м, ребёнок 12 кг: 1.8 мг = 0.45 мл, тяжёлый — до 7.2 мг', () => {
    const r = dex.formula({ weight: 12, ageYears: 2, indication: 'croup-im' });
    close(r.result1, 1.8);
    close(r.result2, 0.45);
    expect(r.result4).toMatch(/7\.2 мг/);
  });

  it('круп: предел 10 мг (и для верхней границы)', () => {
    const d = dexamethasoneDose(80, 16, 'croup');
    expect(d).toMatchObject({ mg: 10, up: 10, cap: 10 });
    const clean = { weight: 80, ageYears: 16, indication: 'croup-iv' };
    expect(dex.formula(clean).result1).toBe(10);
    expect(limitsOf(dex, clean)).toEqual({ result1: { max: 10 }, result2: { max: 2.5 }, result3: { max: 20 } });
    const po = dex.formula({ weight: 70, ageYears: 30, indication: 'croup-po' });
    expect(po.result1).toBe(10);
    expect(po.result3).toBe(20);
    expect(po.result4).toMatch(/предел 10 мг/);
    expect(po.result4).not.toMatch(/Маленьким детям/);
  });

  it('анафилаксия, ребёнок 20 кг: 0.1 мг/кг = 2 мг, до 8 мг', () => {
    const r = dex.formula({ weight: 20, ageYears: 5, indication: 'anaphylaxis-iv' });
    close(r.result1, 2);
    close(r.result2, 0.5);
    expect(r.result4).toMatch(/8 мг/);
  });

  it('анафилаксия, взрослый: 8 мг = 2 мл, до 16 мг; в/м — с пометкой', () => {
    const r = dex.formula({ weight: 70, ageYears: 30, indication: 'anaphylaxis-iv' });
    expect(r.result1).toBe(8);
    expect(r.result2).toBe(2);
    expect(r.result4).toMatch(/16 мг/);
    expect(dex.formula({ weight: 70, ageYears: 30, indication: 'anaphylaxis-im' }).result5).toMatch(/в\/в/);
    expect(limitsOf(dex, { weight: 70, ageYears: 30, indication: 'anaphylaxis-iv' }).result1.max).toBe(16);
  });

  it('новорождённый 3 кг: малый объём — движок напоминает о разведении', () => {
    const res = computeResult(dex, { weight: 3, ageYears: 0, indication: 'anaphylaxis-iv' });
    expect(res.success).toBe(true);
    expect(res.items.some((i) => i.key === 'engine-small-volume')).toBe(true);
  });
});

describe('Гидрокортизон', () => {
  it('ППТ по Costeff', () => {
    close(bsaCosteff(20), 87 / 110);
    close(bsaCosteff(3.5), 21 / 93.5);
  });

  it('криз, ребёнок 20 кг в/в: 100 мг/м² ≈ 79 мг', () => {
    const r = hc.formula({ weight: 20, ageYears: 5, indication: 'crisis-iv' });
    close(r.result1, (100 * 87) / 110);
    close(r.result2, (100 * 87) / 110 / 50);
    expect(r.result3).toMatch(/100–200 мг\/м²\/сут = 79–158 мг\/сут/);
    expect(r.result4).toBeUndefined();
  });

  it('криз в/м у ребёнка — суспензия и доза до госпитализации', () => {
    const r = hc.formula({ weight: 10, ageYears: 1, indication: 'crisis-im' });
    close(r.result1, 4700 / 100);
    expect(r.result3).toMatch(/25 мг\/мл/);
    expect(r.result4).toMatch(/25–50 мг/);
  });

  it('криз: предел 100 мг; взрослый 100 мг = 2 мл', () => {
    expect(hydrocortisoneDose(200, 17, 'crisis').mg).toBeLessThanOrEqual(100);
    const clean = { weight: 70, ageYears: 40, indication: 'crisis-iv' };
    const r = hc.formula(clean);
    expect(r.result1).toBe(100);
    expect(r.result2).toBe(2);
    expect(r.result3).toMatch(/200 мг\/сут/);
    expect(limitsOf(hc, clean).result1.max).toBe(100);
  });

  it('криз, новорождённый 3.5 кг: ≈ 22 мг', () => {
    close(hc.formula({ weight: 3.5, ageYears: 0, indication: 'crisis-iv' }).result1, 2100 / 93.5);
  });

  it('анафилаксия, ребёнок 20 кг: 2 мг/кг = 40 мг, до 80 мг; 40 кг — предел 100 мг', () => {
    const r = hc.formula({ weight: 20, ageYears: 5, indication: 'anaphylaxis-im' });
    expect(r.result1).toBe(40);
    expect(r.result3).toMatch(/80 мг/);
    expect(hydrocortisoneDose(60, 15, 'anaphylaxis')).toMatchObject({ mg: 100, up: 100, cap: 100 });
  });

  it('анафилаксия, взрослый: 200 мг в/в; в/м — с пометкой', () => {
    const r = hc.formula({ weight: 70, ageYears: 30, indication: 'anaphylaxis-iv' });
    expect(r.result1).toBe(200);
    expect(r.result2).toBe(4);
    expect(r.result4).toBeUndefined();
    expect(hc.formula({ weight: 70, ageYears: 30, indication: 'anaphylaxis-im' }).result4).toMatch(/в\/в/);
    expect(limitsOf(hc, { weight: 70, ageYears: 30, indication: 'anaphylaxis-iv' }).result1.max).toBe(200);
  });

  it('копия: показание и путь в тексте', () => {
    const res = computeResult(hc, { weight: 20, ageYears: 5, indication: 'crisis-im' });
    expect(buildCopyText(res)).toMatch(/Показание и путь: Надпочечниковый криз — в\/м/);
  });
});

describe('все записи: сводный прогон через движок', () => {
  const cases = [];
  group.forEach((f) => {
    const choiceKey = Object.keys(f.inputs).find((k) => isChoiceInput(f.inputs[k]));
    f.inputs[choiceKey].choices.forEach((c) => {
      [
        [3.5, 0],
        [8, months(8)],
        [20, 5],
        [45, 14],
        [70, 30],
        [250, 80],
      ].forEach(([weight, ageYears]) => cases.push([f.name, c.value, weight, ageYears, f, choiceKey]));
    });
  });

  it.each(cases)('%s %s %p кг %p лет: без ошибки, числа конечны', (_n, value, weight, ageYears, f, key) => {
    const res = computeResult(f, { weight, ageYears, [key]: value });
    expect(res.error).toBeUndefined();
    (res.items || []).forEach((i) => {
      if (i.value !== null) expect(Number.isFinite(i.value)).toBe(true);
      expect(i.status).not.toBe('zero');
      expect(i.status).not.toBe('high');
    });
  });
});
