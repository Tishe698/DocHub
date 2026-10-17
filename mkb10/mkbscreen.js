// mkb_screen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput } from '../components/AppText';

// Офлайн-справочник: { meta: {...}, items: [{ code, name, note?, ext?, src? }] }.
// Старый формат (массив { "КОД", "Наименование КОДА " }) тоже поддерживается.
let ICD_DATA;
try {
  ICD_DATA = require('../mkb10/mkb_data.json');
} catch (error) {
  console.warn('Failed to load MKB data:', error);
  ICD_DATA = [];
}

const INITIAL_LOAD_SIZE = 30; // стартовая подгрузка
const PAGE_SIZE = 30;         // размер страницы для докрутки
const DEBOUNCE_MS = 300;

// --- BEGIN SEARCH CORE (чистые функции, без React) ---

// Кириллические буквы-двойники латинских (ввод кода на русской раскладке): «А00» -> A00.
const CYR_TO_LAT_UPPER = {
  А: 'A', В: 'B', С: 'C', Е: 'E', Н: 'H', К: 'K', М: 'M', О: 'O', Р: 'P', Т: 'T', Х: 'X', У: 'Y',
};
// Остальные буквы — по клавишам раскладки ЙЦУКЕН -> QWERTY (Ш21.0 -> I21.0); только для первой буквы кода.
const RU_LAYOUT_TO_LAT = {
  Й: 'Q', Ц: 'W', Г: 'U', Ш: 'I', Щ: 'O', З: 'P', Ф: 'A', Ы: 'S', П: 'G', Л: 'K', Д: 'L', Я: 'Z', Ч: 'X', И: 'B', Ь: 'M',
};
// Для поиска по названию двойники сводятся к одному алфавиту с обеих сторон
// («гепатит в» = «гепатит B», «46,ХХ» = «46,XX»). Замена 1:1, позиции символов сохраняются.
const FOLD_LOWER = {
  а: 'a', в: 'b', е: 'e', ё: 'e', к: 'k', м: 'm', н: 'h', о: 'o', р: 'p', с: 'c', т: 't', у: 'y', х: 'x',
};

const foldChar = (ch) => {
  const lo = ch.toLowerCase();
  if (lo.length !== 1) return ch; // редкие символы с многосимвольным регистром — без изменений
  return FOLD_LOWER[lo] || lo;
};
const fold = (s) => Array.from(String(s || ''), foldChar).join('');

// Нормализация текста запроса/названия: регистр, ё, пробелы, двойники
const normalize = (s) => fold(String(s || '').replace(/\s+/g, ' ').trim());

// Разделители слов: пробелы, знаки препинания, скобки любых видов, кавычки, дефис, слэш
const WORD_SPLIT = /[\s,.;:!?()[\]{}«»"'\/\\\-–—+]+/;
const splitWords = (s) => s.split(WORD_SPLIT).filter(Boolean);

// Нормализация кода: регистр, пробелы, запятая -> точка, кириллица -> латиница, точка после 3-го знака.
const normalizeCode = (s) => {
  let c = String(s || '').toUpperCase().replace(/\s+/g, '').replace(/,/g, '.');
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
const isCodeQuery = (qCode) => /^[A-Z]\d[\d.*]*$/.test(qCode);

// Разговорные синонимы официальных терминов (используются только для поиска)
const SYNONYMS = {
  зно: ['злокачественн'],
  рак: ['злокачественн'],
};

const buildTokens = (raw) => {
  const plain = String(raw || '').toLowerCase().replace(/ё/g, 'е');
  return splitWords(plain).map((t) => [fold(t), ...(SYNONYMS[t] || []).map(fold)]);
};

const codeKey = (code) => String(code).replace('*', '');

// Чтение и проверка данных: пустые и повторные коды отбрасываются
const loadItems = (data) => {
  const rows = Array.isArray(data) ? data : Array.isArray(data && data.items) ? data.items : [];
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const code = String(row.code ?? row['КОД'] ?? row['Код'] ?? '').trim();
    const name = String(row.name ?? row['Наименование КОДА '] ?? row['Наименование'] ?? '').replace(/\s+/g, ' ').trim();
    if (!code || !name || seen.has(code)) continue;
    seen.add(code);
    out.push({ code, name, note: row.note || '', ext: !!row.ext, src: row.src || '' });
  }
  return out;
};

const buildIndex = (items) => {
  const rubricName = new Map();
  for (const it of items) if (/^[A-Z]\d\d\*?$/.test(it.code)) rubricName.set(codeKey(it.code), it.name);
  return items.map((it, idx) => {
    const key = codeKey(it.code);
    const isRubric = !key.includes('.');
    const parentName = isRubric ? '' : (rubricName.get(key.slice(0, 3)) || '');
    const nameNorm = normalize(it.name);
    const parentNorm = normalize(parentName);
    // слова также без круглых скобок: «(остео)артроз» находится как «остеоартроз», «CR(E)ST» — как «CREST»
    const words = splitWords(nameNorm);
    for (const w of splitWords(nameNorm.replace(/[()]/g, ''))) if (!words.includes(w)) words.push(w);
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
    if (t.length === 1) { // одна буква («гепатит в») — только целое слово
      if (item.words.includes(t)) best = Math.max(best, 3);
      continue;
    }
    for (const w of item.words) {
      if (w === t) { best = Math.max(best, 3); break; }
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

// Скоринг: по коду — только при запросе-коде; по названию — все слова запроса в любом порядке
const scoreItem = (item, q) => {
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

const makeQuery = (raw) => {
  const trimmed = String(raw || '').trim();
  const code = normalizeCode(trimmed);
  const isCode = isCodeQuery(code);
  return { raw: trimmed, code, isCode, tokens: isCode ? [] : buildTokens(trimmed), phrase: normalize(trimmed) };
};

// Поиск включается с 3 символов, а для кода (буква + цифра) — с 2
const isSearchable = (q) => q.raw.length >= 3 || (q.isCode && q.code.length >= 2);

const search = (index, q) => {
  const scored = [];
  for (const item of index) {
    const s = scoreItem(item, q);
    if (s > 0) scored.push([s, item]);
  }
  scored.sort((a, b) => {
    if (b[0] !== a[0]) return b[0] - a[0];
    if (a[1].isRubric !== b[1].isRubric) return a[1].isRubric ? -1 : 1;
    if (a[1].isRubric && !q.isCode && a[1].name.length !== b[1].name.length) return a[1].name.length - b[1].name.length;
    return a[1].order - b[1].order; // порядок МКБ-10
  });
  return scored.map((x) => x[1]);
};

// Если кода нет в справочнике (например, подрубрики V43.5), показываем ближайшую рубрику
const searchWithFallback = (index, q) => {
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
const highlightRanges = (text, q, isCodeField) => {
  const src = String(text || '');
  if (!q || !isSearchable(q)) return [];
  const folded = fold(src); // 1:1 по символам
  if (isCodeField) {
    if (!q.isCode) return [];
    const qc = q.code.replace('*', '');
    const want = fold(qc).replace('.', '');
    // идём по коду, пропуская точку, пока совпадает без учёта точки
    let i = 0, j = 0;
    while (i < folded.length && j < want.length) {
      if (folded[i] === '.') { i++; continue; }
      if (folded[i] !== want[j]) return [];
      i++; j++;
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
        if (t.length === 1 ? wholeWord : (atWord || t.length >= 3)) ranges.push([pos, end]);
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

// Склонение: 1 запись, 2 записи, 5 записей
const plural = (n, [one, few, many]) => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
};

// --- END SEARCH CORE ---

const META = (ICD_DATA && !Array.isArray(ICD_DATA) && ICD_DATA.meta) || {};
const ALL_ITEMS = loadItems(ICD_DATA);
// В режиме просмотра коды вне МКБ-10 (ext) не показываются
const BROWSE_ITEMS = ALL_ITEMS.filter((it) => !it.ext);
const TOTAL_CODES = BROWSE_ITEMS.length;

const formatDate = (iso) => {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
};

const renderHighlighted = (text, ranges, highlightStyle) => {
  if (!ranges.length) return text;
  const parts = [];
  let pos = 0;
  ranges.forEach(([s, e], i) => {
    if (s > pos) parts.push(<Text key={`t${i}`}>{text.slice(pos, s)}</Text>);
    parts.push(<Text key={`h${i}`} style={highlightStyle}>{text.slice(s, e)}</Text>);
    pos = e;
  });
  if (pos < text.length) parts.push(<Text key="tail">{text.slice(pos)}</Text>);
  return parts;
};

export default function ICDSearchScreen() {
  const [query, setQuery] = useState('');
  const [debQuery, setDebQuery] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // «Экранный» буфер без поиска (чтобы не вешать UI)
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const listRef = useRef(null);
  const debTimer = useRef(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Полный индекс по всей базе — один раз
  const indexedAll = useMemo(() => buildIndex(ALL_ITEMS), []);
  const browseIndex = useMemo(() => indexedAll.filter((it) => !it.ext), [indexedAll]);

  // Дебаунс ввода
  useEffect(() => {
    if (debTimer.current) clearTimeout(debTimer.current);
    const trimmed = query.trim();
    debTimer.current = setTimeout(() => setDebQuery(trimmed), trimmed ? DEBOUNCE_MS : 0);
    return () => clearTimeout(debTimer.current);
  }, [query]);

  // Начальная подгрузка 30 записей
  useEffect(() => {
    const init = async () => {
      try {
        // микропаузa — даём UI смонтироваться
        await new Promise(r => setTimeout(r, 50));
        setLoadedCount(Math.min(INITIAL_LOAD_SIZE, BROWSE_ITEMS.length));
      } finally {
        setIsDataLoaded(true);
      }
    };
    init();
  }, []);

  const q = useMemo(() => makeQuery(debQuery), [debQuery]);
  const isSearchMode = isSearchable(q);
  const typedLength = query.trim().length;
  const isTooShort = typedLength > 0 && !isSearchable(makeQuery(query));

  // Поиск по всей базе (только когда isSearchMode)
  const { results: searchResults, fallback } = useMemo(
    () => (isSearchMode ? searchWithFallback(indexedAll, q) : { results: [], fallback: '' }),
    [isSearchMode, q, indexedAll],
  );

  // Режим просмотра: данные уже упорядочены по МКБ-10, пересортировка не нужна
  const browseData = useMemo(() => browseIndex.slice(0, loadedCount), [browseIndex, loadedCount]);

  // Догрузка следующих страниц (без поиска)
  const loadMoreData = async () => {
    if (isSearchMode) return; // в поиске не пагинируем
    if (isLoadingMore) return;
    if (loadedCount >= BROWSE_ITEMS.length) return;

    setIsLoadingMore(true);
    try {
      // имитация лёгкой задержки
      await new Promise(r => setTimeout(r, 80));
      setLoadedCount(prev => Math.min(prev + PAGE_SIZE, BROWSE_ITEMS.length));
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Прокрутка к началу
  const scrollToTop = () => {
    if (!listRef.current) return;
    try {
      listRef.current.scrollToOffset({ offset: 0, animated: true });
    } catch {}
  };

  const handleScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    setShowScrollToTop(y > 300);
  };

  const data = isSearchMode ? searchResults : browseData;
  const totalShown = data.length;

  const renderItem = ({ item }) => {
    const codeRanges = isSearchMode ? highlightRanges(item.code, q, true) : [];
    const nameRanges = isSearchMode ? highlightRanges(item.name, q, false) : [];
    return (
      <View style={[styles.row, item.ext && styles.rowExt]}>
        <View style={styles.codeLine}>
          <Text style={styles.code}>{renderHighlighted(item.code, codeRanges, styles.hl)}</Text>
          {item.star && <Text style={[styles.badge, styles.badgeStar]}>доп. код *</Text>}
          {item.ext && <Text style={[styles.badge, styles.badgeExt]}>нет в МКБ-10</Text>}
          {!!item.src && <Text style={[styles.badge, styles.badgeNew]}>обновление</Text>}
        </View>
        {!!item.parentName && (
          <Text style={styles.parent} numberOfLines={2}>{`${item.parentCode} ${item.parentName}`}</Text>
        )}
        <Text style={styles.name}>{renderHighlighted(item.name, nameRanges, styles.hl)}</Text>
        {item.star && (
          <Text style={styles.note}>Код со «*» — проявление болезни: основным диагнозом не ставится, указывается вместе с кодом причины.</Text>
        )}
        {!!item.note && <Text style={[styles.note, item.ext && styles.noteExt]}>{item.note}</Text>}
        {!!item.src && <Text style={styles.src}>Источник: {item.src}</Text>}
      </View>
    );
  };

  const keyExtractor = (item) => item.id;

  const helperText = isSearchMode && fallback
    ? `Кода ${q.code} в справочнике нет — показана рубрика ${fallback}.`
    : isSearchMode
    ? `Найдено: ${totalShown} ${plural(totalShown, ['запись', 'записи', 'записей'])} (в справочнике ${TOTAL_CODES} ${plural(TOTAL_CODES, ['код', 'кода', 'кодов'])}).`
    : isTooShort
      ? 'Введите минимум 3 символа названия или код (буква и цифра, например I2).'
      : `Показано ${loadedCount} из ${TOTAL_CODES}. Прокручивайте для подгрузки.`;

  const updated = formatDate(META.updated);

  // Экран загрузки первых 30
  if (!isDataLoaded) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Загрузка медицинской базы данных…</Text>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.title}>📋 МКБ-10</Text>
        <Text style={styles.subtitle}>Международная классификация болезней, 10-й пересмотр</Text>
        <Text style={styles.edition}>
          {META.edition
            ? `${META.edition}${updated ? `. Данные от ${updated}` : ''}. Сверка с НСИ МЗ РФ не проводилась.`
            : 'Редакция справочника не указана.'}
        </Text>
      </View>

      <View style={styles.searchBox}>
        <View style={styles.inputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Код (I21.0) или название"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={() => setQuery('')}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.helper, (isTooShort || !!fallback) && styles.helperWarn]}>{helperText}</Text>
      </View>

      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.5}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        initialNumToRender={INITIAL_LOAD_SIZE}
        windowSize={10}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          !isSearchMode ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Показано {totalShown} из {TOTAL_CODES}
                {isLoadingMore && ' (загрузка...)'}
              </Text>
              {isLoadingMore && <ActivityIndicator size="small" color="#3b82f6" />}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              {isSearchMode ? '🤔 Заболевание не найдено' : '📋 Начните поиск заболеваний'}
            </Text>
            <Text style={[styles.placeholderText, { fontSize: 14, marginTop: 8, opacity: 0.7 }]}>
              {isSearchMode
                ? 'Проверьте код (например J18.9) или введите другое слово из названия'
                : 'Введите минимум 3 символа названия или код'
              }
            </Text>
          </View>
        }
      />

      {showScrollToTop && (
        <TouchableOpacity style={styles.scrollToTopButton} onPress={scrollToTop} activeOpacity={0.8}>
          <Text style={styles.scrollToTopText}>↑</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 20
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center'
  },
  title: {
    color: '#1e293b',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center'
  },
  subtitle: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500'
  },
  edition: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 6,
    textAlign: 'center'
  },
  searchBox: {
    paddingHorizontal: 20,
    marginBottom: 16
  },
  inputContainer: {
    position: 'relative',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  input: {
    backgroundColor: '#ffffff',
    color: '#1e293b',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 50,
    fontSize: 16,
    fontWeight: '500',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  inputFocused: {
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  clearButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600'
  },
  helper: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500'
  },
  helperWarn: {
    color: '#b45309'
  },
  loadingText: {
    color: '#64748b',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500'
  },

  row: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  rowExt: {
    backgroundColor: '#fef2f2',
    borderBottomColor: '#fecaca'
  },
  codeLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 2
  },
  code: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
    marginRight: 8
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 6
  },
  badgeStar: {
    backgroundColor: '#fef3c7',
    color: '#92400e'
  },
  badgeExt: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c'
  },
  badgeNew: {
    backgroundColor: '#e0f2fe',
    color: '#075985'
  },
  parent: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2
  },
  name: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400'
  },
  note: {
    color: '#92400e',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4
  },
  noteExt: {
    color: '#b91c1c',
    fontWeight: '600'
  },
  src: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2
  },

  hl: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    fontWeight: '700',
    paddingHorizontal: 2,
    borderRadius: 4
  },

  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40
  },
  placeholderText: {
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500'
  },

  footer: {
    paddingVertical: 16,
    alignItems: 'center',
    paddingHorizontal: 20
  },
  footerText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center'
  },

  scrollToTopButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#e2e8f0'
  },
  scrollToTopText: {
    color: '#374151',
    fontSize: 20,
    fontWeight: '700'
  },

  // Дополнительные стили для медицинской тематики
  medicalIcon: {
    fontSize: 20,
    color: '#059669',
    marginRight: 8
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
    color: '#9ca3af',
    fontSize: 18
  },
});
