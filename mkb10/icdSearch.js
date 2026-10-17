// icdSearch.js — поиск по справочнику МКБ-10: нормализация, индекс, скоринг, подсветка.
// Чистые функции без React (тесты: __tests__/icdSearch.test.js). Перенесено из mkbscreen.js
// без изменения правил поиска.
//
// Формат данных: { meta: {...}, items: [{ code, name, note?, ext?, src? }] };
// старый формат (массив { "КОД", "Наименование КОДА " }) тоже поддерживается.

// Кириллические буквы-двойники латинских (ввод кода на русской раскладке): «А00» -> A00.
const CYR_TO_LAT_UPPER = {
  А: 'A',
  В: 'B',
  С: 'C',
  Е: 'E',
  Н: 'H',
  К: 'K',
  М: 'M',
  О: 'O',
  Р: 'P',
  Т: 'T',
  Х: 'X',
  У: 'Y',
};
// Остальные буквы — по клавишам раскладки ЙЦУКЕН -> QWERTY (Ш21.0 -> I21.0); только для первой буквы кода.
const RU_LAYOUT_TO_LAT = {
  Й: 'Q',
  Ц: 'W',
  Г: 'U',
  Ш: 'I',
  Щ: 'O',
  З: 'P',
  Ф: 'A',
  Ы: 'S',
  П: 'G',
  Л: 'K',
  Д: 'L',
  Я: 'Z',
  Ч: 'X',
  И: 'B',
  Ь: 'M',
};
// Для поиска по названию двойники сводятся к одному алфавиту с обеих сторон
// («гепатит в» = «гепатит B», «46,ХХ» = «46,XX»). Замена 1:1, позиции символов сохраняются.
const FOLD_LOWER = {
  а: 'a',
  в: 'b',
  е: 'e',
  ё: 'e',
  к: 'k',
  м: 'm',
  н: 'h',
  о: 'o',
  р: 'p',
  с: 'c',
  т: 't',
  у: 'y',
  х: 'x',
};

const foldChar = (ch) => {
  const lo = ch.toLowerCase();
  if (lo.length !== 1) return ch; // редкие символы с многосимвольным регистром — без изменений
  return FOLD_LOWER[lo] || lo;
};

// Регистр, ё -> е, кириллические двойники -> латиница; длина строки сохраняется (1:1)
export const fold = (s) => Array.from(String(s || ''), foldChar).join('');

// Нормализация текста запроса/названия: регистр, ё, пробелы, двойники
export const normalize = (s) =>
  fold(
    String(s || '')
      .replace(/\s+/g, ' ')
      .trim(),
  );

// Разделители слов: пробелы, знаки препинания, скобки любых видов, кавычки, дефис, слэш
export const WORD_SPLIT = /[\s,.;:!?()[\]{}«»"'/\\\-–—+]+/;
export const splitWords = (s) => s.split(WORD_SPLIT).filter(Boolean);

// Нормализация кода: регистр, пробелы, запятая -> точка, кириллица -> латиница, точка после 3-го знака.
export const normalizeCode = (s) => {
  let c = String(s || '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/,/g, '.');
  if (/^[А-ЯЁ]\d/.test(c)) {
    const first = c[0];
    c = (CYR_TO_LAT_UPPER[first] || RU_LAYOUT_TO_LAT[first] || first) + c.slice(1);
  }
  c = c.replace(/[АВСЕНКМОРТХУ]/g, (ch) => CYR_TO_LAT_UPPER[ch]);
  // «J189» -> «J18.9», «I2100» -> «I21.00»
  const m = c.match(/^([A-Z]\d\d)(\d{1,2})(\*?)$/);
  if (m) c = `${m[1]}.${m[2]}${m[3]}`;
  return c;
};

// Запрос похож на код: буква + цифра (2 знака уже достаточно: «I2», «J1»)
export const isCodeQuery = (qCode) => /^[A-Z]\d[\d.*]*$/.test(qCode);

// Разговорные синонимы официальных терминов (используются только для поиска)
const SYNONYMS = {
  зно: ['злокачественн'],
  рак: ['злокачественн'],
};

export const buildTokens = (raw) => {
  const plain = String(raw || '')
    .toLowerCase()
    .replace(/ё/g, 'е');
  return splitWords(plain).map((t) => [fold(t), ...(SYNONYMS[t] || []).map(fold)]);
};

const codeKey = (code) => String(code).replace('*', '');

// Чтение и проверка данных: пустые и повторные коды отбрасываются
export const loadItems = (data) => {
  const rows = Array.isArray(data) ? data : Array.isArray(data && data.items) ? data.items : [];
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const code = String(row.code ?? row['КОД'] ?? row['Код'] ?? '').trim();
    const name = String(row.name ?? row['Наименование КОДА '] ?? row['Наименование'] ?? '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!code || !name || seen.has(code)) continue;
    seen.add(code);
    out.push({ code, name, note: row.note || '', ext: !!row.ext, src: row.src || '' });
  }
  return out;
};

export const buildIndex = (items) => {
  const rubricName = new Map();
  for (const it of items)
    if (/^[A-Z]\d\d\*?$/.test(it.code)) rubricName.set(codeKey(it.code), it.name);
  return items.map((it, idx) => {
    const key = codeKey(it.code);
    const isRubric = !key.includes('.');
    const parentName = isRubric ? '' : rubricName.get(key.slice(0, 3)) || '';
    const nameNorm = normalize(it.name);
    const parentNorm = normalize(parentName);
    // слова также без круглых скобок: «(остео)артроз» находится как «остеоартроз», «CR(E)ST» — как «CREST»
    const words = splitWords(nameNorm);
    for (const w of splitWords(nameNorm.replace(/[()]/g, '')))
      if (!words.includes(w)) words.push(w);
    return {
      ...it,
      id: `${it.code}-${idx}`,
      order: idx,
      isRubric,
      star: it.code.endsWith('*'),
      parentCode: isRubric ? '' : key.slice(0, 3),
      parentName,
      codeNorm: key,
      codeCompact: key.replace('.', ''),
      nameNorm,
      words,
      parentWords: splitWords(parentNorm),
    };
  });
};

// Оценка совпадения одного токена со словами названия
const tokenScore = (alts, item) => {
  let best = 0;
  for (const t of alts) {
    if (!t) continue;
    if (t.length === 1) {
      // одна буква («гепатит в») — только целое слово
      if (item.words.includes(t)) best = Math.max(best, 3);
      continue;
    }
    for (const w of item.words) {
      if (w === t) {
        best = Math.max(best, 3);
        break;
      }
      if (w.startsWith(t)) best = Math.max(best, 2);
    }
    // грубое отсечение окончания: «этанолом» находит «этанола»
    if (best < 1 && t.length >= 5) {
      const stem = t.slice(0, -2);
      if (item.words.some((w) => w.startsWith(stem))) best = 1;
    }
    if (best < 1 && t.length >= 3 && item.nameNorm.includes(t)) best = 1;
    if (best < 0.5 && item.parentWords.some((w) => w.startsWith(t))) best = 0.5;
  }
  return best;
};

const phraseAtWord = (text, phrase) => {
  let from = 0;
  while (phrase) {
    const pos = text.indexOf(phrase, from);
    if (pos < 0) return false;
    if (pos === 0 || WORD_SPLIT.test(text[pos - 1])) return true;
    from = pos + 1;
  }
  return false;
};

// Скоринг: по коду — только при запросе-коде; по названию — все слова запроса в любом порядке
export const scoreItem = (item, q) => {
  if (q.isCode) {
    const qc = q.code.replace('*', '');
    const qcc = qc.replace('.', '');
    if (item.codeNorm === qc) return 100;
    if (item.ext) return 0; // коды вне МКБ-10 — только при точном вводе
    if (item.codeNorm.startsWith(qc) || (qcc.length >= 3 && item.codeCompact.startsWith(qcc))) {
      return 50 - Math.min(item.codeNorm.length, 10);
    }
    return 0;
  }
  if (item.ext || q.tokens.length === 0) return 0;
  let sum = 0;
  for (const alts of q.tokens) {
    const s = tokenScore(alts, item);
    if (s === 0) return 0; // каждое слово запроса должно найтись
    sum += s;
  }
  // фраза из нескольких слов в том же порядке, с начала слова
  if (q.tokens.length > 1 && phraseAtWord(item.nameNorm, q.phrase)) sum += 3;
  if (item.isRubric) sum += 0.5;
  return sum;
};

export const makeQuery = (raw) => {
  const trimmed = String(raw || '').trim();
  const code = normalizeCode(trimmed);
  const isCode = isCodeQuery(code);
  return {
    raw: trimmed,
    code,
    isCode,
    tokens: isCode ? [] : buildTokens(trimmed),
    phrase: normalize(trimmed),
  };
};

// Поиск включается с 3 символов, а для кода (буква + цифра) — с 2
export const isSearchable = (q) => q.raw.length >= 3 || (q.isCode && q.code.length >= 2);

export const search = (index, q) => {
  const scored = [];
  for (const item of index) {
    const s = scoreItem(item, q);
    if (s > 0) scored.push([s, item]);
  }
  scored.sort((a, b) => {
    if (b[0] !== a[0]) return b[0] - a[0];
    if (a[1].isRubric !== b[1].isRubric) return a[1].isRubric ? -1 : 1;
    if (a[1].isRubric && !q.isCode && a[1].name.length !== b[1].name.length)
      return a[1].name.length - b[1].name.length;
    return a[1].order - b[1].order; // порядок МКБ-10
  });
  return scored.map((x) => x[1]);
};

// Если кода нет в справочнике (например, подрубрики V43.5), показываем ближайшую рубрику
export const searchWithFallback = (index, q) => {
  const results = search(index, q);
  if (results.length || !q.isCode) return { results, fallback: '' };
  let c = q.code.replace('*', '');
  while (c.length > 3) {
    c = c.slice(0, -1).replace(/\.$/, '');
    const r = search(index, { ...q, code: c });
    const exact = r.filter((it) => it.codeNorm === c);
    if (exact.length) return { results: exact, fallback: c };
  }
  return { results, fallback: '' };
};

// Диапазоны подсветки в исходном тексте по той же нормализации, что и поиск
export const highlightRanges = (text, q, isCodeField) => {
  const src = String(text || '');
  if (!q || !isSearchable(q)) return [];
  const folded = fold(src); // 1:1 по символам
  if (isCodeField) {
    if (!q.isCode) return [];
    const qc = q.code.replace('*', '');
    const want = fold(qc).replace('.', '');
    // идём по коду, пропуская точку, пока совпадает без учёта точки
    let i = 0;
    let j = 0;
    while (i < folded.length && j < want.length) {
      if (folded[i] === '.') {
        i++;
        continue;
      }
      if (folded[i] !== want[j]) return [];
      i++;
      j++;
    }
    return j === want.length && j > 0 ? [[0, i]] : [];
  }
  if (q.isCode) return [];
  const ranges = [];
  const isSep = (ch) => WORD_SPLIT.test(ch);
  for (const alts of q.tokens) {
    for (const t of alts) {
      if (!t) continue;
      let from = 0;
      while (from <= folded.length) {
        const pos = folded.indexOf(t, from);
        if (pos < 0) break;
        const atWord = pos === 0 || isSep(src[pos - 1]);
        const end = pos + t.length;
        const wholeWord = atWord && (end === src.length || isSep(src[end]));
        if (t.length === 1 ? wholeWord : atWord || t.length >= 3) ranges.push([pos, end]);
        from = pos + t.length;
      }
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([r[0], r[1]]);
  }
  return merged;
};

// Разбиение текста на части для подсветки: [{ text, hl }]
export const splitByRanges = (text, ranges) => {
  const src = String(text || '');
  if (!ranges || !ranges.length) return [{ text: src, hl: false }];
  const parts = [];
  let pos = 0;
  for (const [s, e] of ranges) {
    if (s > pos) parts.push({ text: src.slice(pos, s), hl: false });
    parts.push({ text: src.slice(s, e), hl: true });
    pos = e;
  }
  if (pos < src.length) parts.push({ text: src.slice(pos), hl: false });
  return parts;
};

// Склонение: 1 запись, 2 записи, 5 записей
export const plural = (n, [one, few, many]) => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
};

// «2026-10-17» -> «17.10.2026»
export const formatDate = (iso) => {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
};

// Подготовка справочника: чтение, индекс по всей базе и список для просмотра
// (коды вне МКБ-10 — ext — в режиме просмотра не показываются)
export const prepareDataset = (data) => {
  const meta = (data && !Array.isArray(data) && data.meta) || {};
  const index = buildIndex(loadItems(data));
  const browse = index.filter((it) => !it.ext);
  return { meta, index, browse, total: browse.length };
};

// Строка о редакции справочника под заголовком
export const editionText = (meta) => {
  if (!meta || !meta.edition) return 'Редакция справочника не указана.';
  const updated = formatDate(meta.updated);
  return `${meta.edition}${updated ? `. Данные от ${updated}` : ''}. Сверка с НСИ МЗ РФ не проводилась.`;
};

// Подсказка под полем поиска. Возвращает { text, warn }.
export const helperText = ({ q, typed, found, fallback, total }) => {
  const searchMode = isSearchable(q);
  if (searchMode && fallback) {
    return { text: `Кода ${q.code} в справочнике нет — показана рубрика ${fallback}.`, warn: true };
  }
  if (searchMode) {
    return {
      text: `Найдено: ${found} ${plural(found, ['запись', 'записи', 'записей'])} (в справочнике ${total} ${plural(total, ['код', 'кода', 'кодов'])}).`,
      warn: false,
    };
  }
  const typedQ = makeQuery(typed);
  if (typedQ.raw.length > 0 && !isSearchable(typedQ)) {
    return {
      text: 'Введите минимум 3 символа названия или код (буква и цифра, например I2).',
      warn: true,
    };
  }
  return {
    text: `Всего ${total} ${plural(total, ['код', 'кода', 'кодов'])}. Список прокручивается.`,
    warn: false,
  };
};

// Короткая озвучка итога поиска
export const searchAnnouncement = ({ q, found, fallback }) => {
  if (!isSearchable(q)) return '';
  if (fallback) return `Кода ${q.code} нет, показана рубрика ${fallback}`;
  if (!found) return 'Ничего не найдено';
  return `Найдено ${found} ${plural(found, ['запись', 'записи', 'записей'])}`;
};

// Пометки записи: текст всегда рядом с цветом
export const itemBadges = (item) => {
  const out = [];
  if (item.star) out.push({ key: 'star', level: 'warning', label: 'доп. код *' });
  if (item.ext) out.push({ key: 'ext', level: 'danger', label: 'нет в МКБ-10' });
  if (item.src) out.push({ key: 'src', level: 'info', label: 'обновление' });
  return out;
};

export const STAR_NOTE =
  'Код со «*» — проявление болезни: основным диагнозом не ставится, указывается вместе с кодом причины.';

// Подпись строки для диктора: код, пометки, название, рубрика, примечания
export const itemA11yLabel = (item) => {
  const parts = [`Код ${item.code.replace('*', ' со звёздочкой')}`];
  for (const b of itemBadges(item)) if (b.key !== 'star') parts.push(b.label);
  parts.push(item.name);
  if (item.parentName) parts.push(`рубрика ${item.parentCode} ${item.parentName}`);
  if (item.star) parts.push(STAR_NOTE);
  if (item.note) parts.push(item.note);
  if (item.src) parts.push(`Источник: ${item.src}`);
  return parts.join('. ');
};
