// mkb_screen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

// Подключаем офлайн JSON (массив объектов вида { "КОД": "A00", "Наименование КОДА ": "Холера" })
let ICD_DATA;
try {
  ICD_DATA = require('../mkb10/mkb_data.json');
} catch (error) {
  console.warn('Failed to load MKB data:', error);
  ICD_DATA = [];
}

// Источник данных
const SOURCE = Array.isArray(ICD_DATA) ? ICD_DATA : [];

const INITIAL_LOAD_SIZE = 30; // стартовая подгрузка
const PAGE_SIZE = 30;         // размер страницы для докрутки
const DEBOUNCE_MS = 300;

// --- Хелперы нормализации/поиска ---
const normalize = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeCode = (s) =>
  String(s || '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .trim();

// Скоринг релевантности
const scoreItem = (item, qNorm, qCode) => {
  let score = 0;
  // по коду
  if (qCode.length >= 1) {
    if (item.codeNorm.startsWith(qCode)) score += 6;
    else if (item.codeNorm.includes(qCode)) score += 3;
  }
  // по названию
  if (qNorm.length >= 1) {
    if (item.nameNorm.startsWith(qNorm)) score += 5;
    else if (item.words.some((w) => w.startsWith(qNorm))) score += 3;
    else if (item.nameNorm.includes(qNorm)) score += 1;
  }
  return score;
};

// Подсветка (без глобального флага — не «мигает»)
const highlight = (text, term, highlightStyle) => {
  if (!term || term.trim().length < 3) return <Text>{text}</Text>;
  const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${safe})`, 'i');
  const parts = String(text).split(re);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <Text key={i} style={highlightStyle}>{part}</Text>
        ) : (
          <Text key={i}>{part}</Text>
        ),
      )}
    </>
  );
};

export default function ICDSearchScreen() {
  const [query, setQuery] = useState('');
  const [debQuery, setDebQuery] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // «Экранный» буфер без поиска (чтобы не вешать UI)
  const [loadedData, setLoadedData] = useState([]); // массив «сырых» строк
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const listRef = useRef(null);
  const debTimer = useRef(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Индексация ТОЛЬКО загруженного куска (для режима без поиска)
  const indexedDisplay = useMemo(() => {
    return loadedData.map((row, idx) => {
      const code = row['КОД'] ?? row['Код'] ?? row['code'] ?? '';
      const name = row['Наименование КОДА '] ?? row['Наименование'] ?? row['name'] ?? '';
      const nameNorm = normalize(name);
      return {
        id: `${code}-${idx}`,
        code,
        name,
        codeNorm: normalizeCode(code),
        nameNorm,
        words: nameNorm.split(/[\s,.;:()/-]+/).filter(Boolean),
        raw: row,
      };
    }).sort((a, b) => a.codeNorm.localeCompare(b.codeNorm, 'ru'));
  }, [loadedData]);

  // Полный индекс по всей базе — один раз (для поиска)
  const indexedAll = useMemo(() => {
    return SOURCE.map((row, idx) => {
      const code = row['КОД'] ?? row['Код'] ?? row['code'] ?? '';
      const name = row['Наименование КОДА '] ?? row['Наименование'] ?? row['name'] ?? '';
      const nameNorm = normalize(name);
      return {
        id: `${code}-all-${idx}`,
        code,
        name,
        codeNorm: normalizeCode(code),
        nameNorm,
        words: nameNorm.split(/[\s,.;:()/-]+/).filter(Boolean),
        raw: row,
      };
    });
  }, []);

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
        setLoadedData(SOURCE.slice(0, INITIAL_LOAD_SIZE));
        setCurrentPage(1);
      } finally {
        setIsDataLoaded(true);
      }
    };
    init();
  }, []);

  const isSearchMode = debQuery.length >= 3;

  // Поиск по всей базе (только когда isSearchMode)
  const searchResults = useMemo(() => {
    if (!isSearchMode) return [];
    const q = debQuery;
    const qNorm = normalize(q);
    const qCode = normalizeCode(q);

    const scored = [];
    for (const item of indexedAll) {
      const s = scoreItem(item, qNorm, qCode);
      if (s > 0) scored.push([s, item]);
    }
    scored.sort((a, b) => {
      if (b[0] !== a[0]) return b[0] - a[0];
      return a[1].codeNorm.localeCompare(b[1].codeNorm, 'ru');
    });
    return scored.map(x => x[1]);
  }, [isSearchMode, debQuery, indexedAll]);

  // Догрузка следующих страниц (без поиска)
  const loadMoreData = async () => {
    if (isSearchMode) return; // в поиске не пагинируем
    if (isLoadingMore) return;

    const already = loadedData.length;
    if (already >= SOURCE.length) return;

    setIsLoadingMore(true);
    try {
      // имитация лёгкой задержки
      await new Promise(r => setTimeout(r, 80));
      const nextPage = currentPage + 1;
      const start = currentPage * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const chunk = SOURCE.slice(start, end);
      if (chunk.length) {
        setLoadedData(prev => [...prev, ...chunk]);
        setCurrentPage(nextPage);
      }
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

  const data = isSearchMode ? searchResults : indexedDisplay;
  const totalAll = SOURCE.length;
  const totalShown = data.length;
  const totalLoaded = loadedData.length;

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.code}>{highlight(item.code, debQuery, styles.hl)}</Text>
      <Text style={styles.name}>{highlight(item.name, debQuery, styles.hl)}</Text>
    </View>
  );

  const keyExtractor = (item) => item.id;

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
        <Text style={styles.subtitle}>Международная классификация болезней</Text>
      </View>

      <View style={styles.searchBox}>
        <View style={styles.inputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Поиск заболеваний..."
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
        <Text style={styles.helper}>
          {isSearchMode
            ? `Найдено: ${totalShown} записей (всего в базе: ${totalAll}).`
            : `Загружено в список: ${totalLoaded} из ${totalAll}. Прокручивайте для подгрузки.`}
        </Text>
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
        ListFooterComponent={
          !isSearchMode ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Показано {totalShown} из {totalAll}
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
                ? 'Попробуйте другой код или название'
                : 'Введите минимум 3 символа для поиска'
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
  code: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
    letterSpacing: 0.5
  },
  name: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400'
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
