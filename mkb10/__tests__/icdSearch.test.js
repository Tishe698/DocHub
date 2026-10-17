import {
  fold,
  normalize,
  normalizeCode,
  isCodeQuery,
  makeQuery,
  isSearchable,
  loadItems,
  buildIndex,
  search,
  searchWithFallback,
  highlightRanges,
  splitByRanges,
  plural,
  formatDate,
  prepareDataset,
  editionText,
  helperText,
  searchAnnouncement,
  itemBadges,
  itemA11yLabel,
} from '../icdSearch';

const DATA = require('../mkb_data.json');

describe('нормализация', () => {
  it('fold: регистр, ё/е, кириллические двойники, длина сохраняется', () => {
    expect(fold('ЁЛКА')).toBe(fold('елка'));
    expect(fold('гепатит В')).toBe(fold('гепатит b'));
    expect(fold('46,ХХ')).toBe('46,xx');
    const s = 'Острый Инфаркт';
    expect(fold(s)).toHaveLength(s.length);
    expect(fold(null)).toBe('');
  });

  it('normalize: пробелы', () => {
    expect(normalize('  Острый   инфаркт ')).toBe(fold('острый инфаркт'));
  });

  it('normalizeCode: русская раскладка, запятая, точка после 3-го знака', () => {
    expect(normalizeCode('а00')).toBe('A00'); // кириллическая «а» — двойник
    expect(normalizeCode('ш21,0')).toBe('I21.0'); // Ш на месте I в ЙЦУКЕН
    expect(normalizeCode('j189')).toBe('J18.9');
    expect(normalizeCode('I2100')).toBe('I21.00');
    expect(normalizeCode(' i 21 . 0 ')).toBe('I21.0');
    expect(normalizeCode('Е11')).toBe('E11');
    expect(normalizeCode('D63*')).toBe('D63*');
  });

  it('isCodeQuery / isSearchable', () => {
    expect(isCodeQuery('I2')).toBe(true);
    expect(isCodeQuery('I21.0')).toBe(true);
    expect(isCodeQuery('ИНФ')).toBe(false);
    expect(isSearchable(makeQuery('I2'))).toBe(true);
    expect(isSearchable(makeQuery('I'))).toBe(false);
    expect(isSearchable(makeQuery('ин'))).toBe(false);
    expect(isSearchable(makeQuery('инф'))).toBe(true);
  });
});

describe('чтение данных', () => {
  it('старый и новый формат, пустые и повторы отбрасываются', () => {
    const items = loadItems([
      { КОД: 'A00', 'Наименование КОДА ': ' Холера  ' },
      { code: 'A00', name: 'дубль' },
      { code: '', name: 'пусто' },
      null,
      { code: 'A01', name: 'Тиф', ext: 1 },
    ]);
    expect(items).toEqual([
      { code: 'A00', name: 'Холера', note: '', ext: false, src: '' },
      { code: 'A01', name: 'Тиф', note: '', ext: true, src: '' },
    ]);
    expect(loadItems(null)).toEqual([]);
    expect(loadItems({ items: [{ code: 'B00', name: 'X' }] })).toHaveLength(1);
  });

  it('индекс: рубрика, родитель, звёздочка', () => {
    const idx = buildIndex(
      loadItems([
        { code: 'D63*', name: 'Анемия при хронических болезнях' },
        { code: 'D63.0*', name: 'Анемия при новообразованиях' },
      ]),
    );
    expect(idx[0]).toMatchObject({ isRubric: true, star: true, codeNorm: 'D63' });
    expect(idx[1]).toMatchObject({
      isRubric: false,
      parentCode: 'D63',
      parentName: 'Анемия при хронических болезнях',
    });
  });
});

describe('поиск по реальному справочнику', () => {
  const ds = prepareDataset(DATA);
  const find = (raw) => searchWithFallback(ds.index, makeQuery(raw));

  it('справочник подготовлен, коды вне МКБ-10 не в просмотре', () => {
    expect(ds.index.length).toBeGreaterThan(10000);
    expect(ds.browse.every((it) => !it.ext)).toBe(true);
    expect(ds.total).toBe(ds.browse.length);
    expect(ds.meta.edition).toBeTruthy();
  });

  it('точный код — первым; ввод на русской раскладке', () => {
    expect(find('I21.0').results[0].code).toBe('I21.0');
    expect(find('ш21.0').results[0].code).toBe('I21.0');
    expect(find('j189').results[0].code).toBe('J18.9');
  });

  it('префикс кода — вся рубрика в порядке МКБ', () => {
    const codes = find('I21').results.map((r) => r.code);
    expect(codes[0]).toBe('I21');
    expect(codes).toContain('I21.0');
  });

  it('название: слова в любом порядке, ё/е, двойники', () => {
    const r = find('инфаркт миокарда').results.map((x) => x.code);
    expect(r).toContain('I21');
    expect(find('миокарда инфаркт').results.map((x) => x.code)).toContain('I21');
    expect(find('гепатит в').results.map((x) => x.code)).toContain('B16');
    expect(find('ПЕЧЁНОЧНОЙ комы').results.map((x) => x.code)).toContain('B16.9');
  });

  it('коды вне МКБ-10 — только при точном вводе', () => {
    const ext = ds.index.find((it) => it.ext);
    expect(find(ext.code).results[0].code).toBe(ext.code);
    expect(find(ext.code.slice(0, 3)).results.some((it) => it.ext)).toBe(false);
  });

  it('нет подрубрики — показывается рубрика', () => {
    const r = find('V43.5');
    expect(r.fallback).toBe('V43');
    expect(r.results.map((x) => x.code)).toEqual(['V43']);
  });

  it('ничего не найдено', () => {
    expect(find('ъъъъъ').results).toEqual([]);
    expect(search(ds.index, makeQuery('Z99.99')).length).toBe(0);
  });
});

describe('подсветка', () => {
  it('код: точка пропускается', () => {
    expect(highlightRanges('I21.0', makeQuery('I210'), true)).toEqual([[0, 5]]);
    expect(highlightRanges('I21.0', makeQuery('I21'), true)).toEqual([[0, 3]]);
    expect(highlightRanges('I22.0', makeQuery('I21'), true)).toEqual([]);
    expect(highlightRanges('I21.0', makeQuery('инфаркт'), true)).toEqual([]);
  });

  it('название: по той же нормализации', () => {
    const text = 'Острый гепатит B';
    const ranges = highlightRanges(text, makeQuery('гепатит в'), false);
    expect(ranges.map(([s, e]) => text.slice(s, e))).toEqual(['гепатит', 'B']);
    expect(splitByRanges(text, ranges)).toEqual([
      { text: 'Острый ', hl: false },
      { text: 'гепатит', hl: true },
      { text: ' ', hl: false },
      { text: 'B', hl: true },
    ]);
    expect(splitByRanges('abc', [])).toEqual([{ text: 'abc', hl: false }]);
  });
});

describe('тексты', () => {
  it('plural', () => {
    expect(plural(1, ['запись', 'записи', 'записей'])).toBe('запись');
    expect(plural(3, ['запись', 'записи', 'записей'])).toBe('записи');
    expect(plural(11, ['запись', 'записи', 'записей'])).toBe('записей');
    expect(plural(21, ['запись', 'записи', 'записей'])).toBe('запись');
    expect(plural(0, ['запись', 'записи', 'записей'])).toBe('записей');
  });

  it('formatDate и editionText', () => {
    expect(formatDate('2026-10-17')).toBe('17.10.2026');
    expect(formatDate('bad')).toBe('');
    expect(editionText({ edition: 'МКБ-10', updated: '2026-10-17' })).toBe(
      'МКБ-10. Данные от 17.10.2026. Сверка с НСИ МЗ РФ не проводилась.',
    );
    expect(editionText(null)).toBe('Редакция справочника не указана.');
  });

  it('helperText', () => {
    expect(helperText({ q: makeQuery(''), typed: '', found: 0, fallback: '', total: 5 })).toEqual({
      text: 'Всего 5 кодов. Список прокручивается.',
      warn: false,
    });
    expect(
      helperText({ q: makeQuery(''), typed: 'ин', found: 0, fallback: '', total: 5 }).warn,
    ).toBe(true);
    expect(
      helperText({ q: makeQuery('инфаркт'), typed: 'инфаркт', found: 2, fallback: '', total: 21 })
        .text,
    ).toBe('Найдено: 2 записи (в справочнике 21 код).');
    const fb = helperText({
      q: makeQuery('V43.5'),
      typed: 'V43.5',
      found: 1,
      fallback: 'V43',
      total: 9,
    });
    expect(fb).toEqual({
      text: 'Кода V43.5 в справочнике нет — показана рубрика V43.',
      warn: true,
    });
  });

  it('searchAnnouncement', () => {
    expect(searchAnnouncement({ q: makeQuery('ин'), found: 0, fallback: '' })).toBe('');
    expect(searchAnnouncement({ q: makeQuery('инфаркт'), found: 0, fallback: '' })).toBe(
      'Ничего не найдено',
    );
    expect(searchAnnouncement({ q: makeQuery('инфаркт'), found: 5, fallback: '' })).toBe(
      'Найдено 5 записей',
    );
    expect(searchAnnouncement({ q: makeQuery('V43.5'), found: 1, fallback: 'V43' })).toMatch(
      /рубрика V43/,
    );
  });

  it('пометки и подпись для диктора', () => {
    const [star] = buildIndex(loadItems([{ code: 'D63*', name: 'Анемия' }]));
    expect(itemBadges(star).map((b) => b.label)).toEqual(['доп. код *']);
    expect(itemA11yLabel(star)).toMatch(/^Код D63 со звёздочкой\. Анемия\./);
    const [ext] = buildIndex(
      loadItems([{ code: 'I20.00', name: 'X', note: 'Используйте I20.0', ext: 1, src: 'S' }]),
    );
    expect(itemBadges(ext).map((b) => b.label)).toEqual(['нет в МКБ-10', 'обновление']);
    expect(itemA11yLabel(ext)).toBe(
      'Код I20.00. нет в МКБ-10. обновление. X. Используйте I20.0. Источник: S',
    );
  });
});
