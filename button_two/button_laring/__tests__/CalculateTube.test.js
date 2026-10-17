import calculateTubeLogic, {
  LT_SIZES,
  LT_MAX_CUFF_PRESSURE_CMH2O,
  isHeightRequired,
  validateTubeInput,
} from '../CalculateTube';
import { categoryFromAge, computeLaryngeal, laryngealAnnouncement } from '../laryngealFromPatient';

describe('VBM LTS-D: таблица производителя', () => {
  test('строки таблицы (IFU 2017, с. 11)', () => {
    expect(Object.keys(LT_SIZES).sort((a, b) => Number(a) - Number(b))).toEqual(['0', '1', '2', '2.5', '3', '4', '5']);
    expect(LT_SIZES['0']).toMatchObject({ tubeColor: 'Прозрачный', cuffVolume: '10 мл', drainFr: '10 Fr' });
    expect(LT_SIZES['1']).toMatchObject({ tubeColor: 'Белый', cuffVolume: '20 мл', drainFr: '10 Fr' });
    expect(LT_SIZES['2']).toMatchObject({ tubeColor: 'Зелёный', cuffVolume: '35 мл', drainFr: '16 Fr' });
    expect(LT_SIZES['2.5']).toMatchObject({ tubeColor: 'Оранжевый', cuffVolume: '40–45 мл', drainFr: '16 Fr' });
    expect(LT_SIZES['3']).toMatchObject({ tubeColor: 'Жёлтый', cuffVolume: '50–60 мл', drainFr: '18 Fr' });
    expect(LT_SIZES['4']).toMatchObject({ tubeColor: 'Красный', cuffVolume: '70–80 мл', drainFr: '18 Fr' });
    expect(LT_SIZES['5']).toMatchObject({ tubeColor: 'Фиолетовый', cuffVolume: '80–90 мл', drainFr: '18 Fr' });
    expect(LT_MAX_CUFF_PRESSURE_CMH2O).toBe(60);
  });
});

describe('VBM: дети', () => {
  test.each([
    [0.5, undefined, '0'],
    [4.9, undefined, '0'],
    [5, undefined, '1'],
    [11.9, undefined, '1'],
    [12, undefined, '2'],
    [25, undefined, '2'],
    [25.1, 125, '2.5'],
    [30, 140, '2.5'],
    [40, 150, '2.5'],
    [40, 151, '3'],
    [45, 160, '4'],
    [80, 185, '5'],
  ])('масса %p кг, рост %p см → №%s', (w, h, size) => {
    const r = calculateTubeLogic(w, h, 'child');
    expect(r.tubeSize).toBe(size);
    expect(r.maxCuffPressure).toBe('60 см вод. ст.');
    expect(r.warning).toBe('');
  });

  test('масса > 25 кг и рост < 125 см — вне таблицы, варианты 2 и 2.5', () => {
    const r = calculateTubeLogic(30, 120, 'child');
    expect(r.tubeSize).toBe('');
    expect(r.options).toEqual(['2', '2.5']);
    expect(r.warning).toMatch(/вне таблицы производителя/);
  });

  test('рост > 150 см при массе ≤ 25 кг — размер по массе с предупреждением', () => {
    const r = calculateTubeLogic(20, 160, 'child');
    expect(r.tubeSize).toBe('2');
    expect(r.warning).toMatch(/проверьте данные/);
  });

  test('рост нужен только при массе > 25 кг', () => {
    expect(isHeightRequired('child', 25)).toBe(false);
    expect(isHeightRequired('child', 25.1)).toBe(true);
    expect(isHeightRequired('child', undefined)).toBe(false);
    expect(validateTubeInput('child', 30, undefined)).toMatch(/при массе > 25 кг/);
  });
});

describe('VBM: взрослые — только по росту', () => {
  test.each([
    [150, '3'],
    [154, '3'],
    [155, '4'],
    [180, '4'],
    [181, '5'],
  ])('рост %p см → №%s', (h, size) => {
    expect(calculateTubeLogic(undefined, h, 'adult').tubeSize).toBe(size);
  });

  test('масса у взрослых не влияет', () => {
    expect(calculateTubeLogic(150, 170, 'adult').tubeSize).toBe('4');
    expect(calculateTubeLogic(40, 170, 'adult').tubeSize).toBe('4');
  });

  test('без роста — ошибка ввода', () => {
    expect(isHeightRequired('adult', undefined)).toBe(true);
    const r = calculateTubeLogic(undefined, undefined, 'adult');
    expect(r.tubeSize).toBe('');
    expect(r.warning).toMatch(/Введите рост/);
  });
});

describe('VBM: проверка ввода', () => {
  test.each([
    [null, 10, undefined, /Выберите категорию/],
    ['child', undefined, undefined, /Введите массу/],
    ['child', 0.3, undefined, /Масса вне допустимого диапазона/],
    ['child', 260, 170, /Масса вне допустимого диапазона/],
    ['adult', undefined, 1.7, /в метрах.*170/],
    ['adult', undefined, 300, /Рост вне допустимого диапазона/],
    ['adult', undefined, 30, /Рост вне допустимого диапазона/],
  ])('%p, %p кг, %p см', (cat, w, h, re) => {
    expect(validateTubeInput(cat, w, h)).toMatch(re);
  });

  test('корректный ввод — null', () => {
    expect(validateTubeInput('child', 10, undefined)).toBeNull();
    expect(validateTubeInput('adult', undefined, 170)).toBeNull();
  });
});

describe('laryngealFromPatient', () => {
  test('категория по возрасту', () => {
    expect(categoryFromAge(null)).toBeNull();
    expect(categoryFromAge(0)).toBe('child');
    expect(categoryFromAge(215)).toBe('child');
    expect(categoryFromAge(216)).toBe('adult');
  });

  test('ребёнок: масса пациента, рост не обязателен', () => {
    expect(computeLaryngeal('child', 18, null)).toMatchObject({ prompt: null, result: { tubeSize: '2' } });
  });

  test('взрослый: масса пациента игнорируется', () => {
    expect(computeLaryngeal('adult', 70, 175).result.tubeSize).toBe('4');
    expect(computeLaryngeal('adult', 70, null).prompt).toMatch(/Введите рост/);
  });

  test('неполный ввод — подсказка без результата', () => {
    expect(computeLaryngeal('child', null, null)).toEqual({ prompt: 'Введите массу ребёнка (кг)', result: null });
  });

  test('озвучка', () => {
    expect(laryngealAnnouncement(computeLaryngeal('child', 30, 140).result)).toBe(
      'Ларингеальная трубка размер 2,5, коннектор оранжевый, объём манжеты 40–45 мл'
    );
    expect(laryngealAnnouncement(computeLaryngeal('child', 30, 120).result)).toMatch(/^Размер не определён/);
    expect(laryngealAnnouncement(computeLaryngeal('child', 20, 160).result)).toMatch(/есть предупреждение$/);
    expect(laryngealAnnouncement(null)).toBe('');
  });
});
