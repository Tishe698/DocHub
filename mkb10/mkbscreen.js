// mkbscreen.js — офлайн-справочник МКБ-10: просмотр и поиск по коду и названию.
// Логика поиска — в icdSearch.js. Данные (≈1,5 МБ JSON) загружаются лениво: не при старте
// приложения, а при первом открытии экрана, после первого кадра с индикатором загрузки;
// подготовленный индекс кэшируется в памяти до закрытия приложения.
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import { Text, TextInput } from '../components/AppText';
import { announce, hideFromA11y } from '../components/a11y';
import { Badge, Button, Note } from '../components/ui';
import { MIN_TOUCH, useTheme, useThemedStyles } from '../theme/index';
import {
  STAR_NOTE,
  editionText,
  helperText,
  highlightRanges,
  isSearchable,
  itemA11yLabel,
  itemBadges,
  makeQuery,
  prepareDataset,
  searchAnnouncement,
  searchWithFallback,
  splitByRanges,
} from './icdSearch';

const DEBOUNCE_MS = 300;
const SCROLL_TOP_THRESHOLD = 300;

// Кэш подготовленного справочника (модульный: повторное открытие экрана — без загрузки)
let datasetCache = null;

// Синхронная загрузка и индексация. require внутри функции: Metro кладёт JSON в бандл,
// но модуль выполняется (и объект создаётся) только при первом вызове.
function loadDataset() {
  if (datasetCache) return datasetCache;
  const data = require('./mkb_data.json');
  const ds = prepareDataset(data);
  if (!ds.index.length) throw new Error('Справочник пуст');
  datasetCache = ds;
  return ds;
}

// Только для тестов: сбросить кэш
export function __resetIcdCache() {
  datasetCache = null;
}

const Highlighted = ({ text, ranges, style, hlStyle }) => (
  <Text style={style}>
    {splitByRanges(text, ranges).map((p, i) =>
      p.hl ? (
        <Text key={i} style={hlStyle}>
          {p.text}
        </Text>
      ) : (
        p.text
      )
    )}
  </Text>
);

// Строка справочника. Не нажимается; для диктора — одна запись с полной подписью.
const IcdRow = memo(function IcdRow({ item, q, styles }) {
  const codeRanges = q ? highlightRanges(item.code, q, true) : [];
  const nameRanges = q ? highlightRanges(item.name, q, false) : [];
  const badges = itemBadges(item);
  return (
    <View style={[styles.row, item.ext && styles.rowExt]} accessible accessibilityLabel={itemA11yLabel(item)}>
      <View style={styles.codeLine}>
        <Highlighted text={item.code} ranges={codeRanges} style={styles.code} hlStyle={styles.hl} />
        {badges.map((b) => (
          <Badge key={b.key} level={b.level} label={b.label} icon={null} style={styles.badge} />
        ))}
      </View>
      {item.parentName ? (
        <Text variant="caption" color="textSecondary" style={styles.parent}>
          {`${item.parentCode} ${item.parentName}`}
        </Text>
      ) : null}
      <Highlighted text={item.name} ranges={nameRanges} style={styles.name} hlStyle={styles.hl} />
      {item.star ? (
        <Text variant="caption" color="warning" style={styles.note}>
          {STAR_NOTE}
        </Text>
      ) : null}
      {item.note ? (
        <Text
          variant="caption"
          color={item.ext ? 'danger' : 'warning'}
          style={[styles.note, item.ext && styles.noteExt]}
        >
          {item.note}
        </Text>
      ) : null}
      {item.src ? (
        <Text variant="caption" color="textMuted" style={styles.src}>
          Источник: {item.src}
        </Text>
      ) : null}
    </View>
  );
});

const keyExtractor = (item) => item.id;

export default function ICDSearchScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [dataset, setDataset] = useState(() => datasetCache);
  const [loadError, setLoadError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const [query, setQuery] = useState('');
  const [debQuery, setDebQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const wasLoading = useRef(!datasetCache);

  // Ленивая загрузка: сначала рисуется индикатор, затем (следующий кадр + макрозадача)
  // разбирается JSON и строится индекс
  useEffect(() => {
    if (dataset) return undefined;
    let cancelled = false;
    let timer = null;
    const raf = requestAnimationFrame(() => {
      timer = setTimeout(() => {
        if (cancelled) return;
        try {
          const ds = loadDataset();
          if (!cancelled) setDataset(ds);
        } catch (e) {
          console.warn('Не удалось загрузить МКБ-10:', e);
          if (!cancelled) setLoadError('Не удалось загрузить справочник МКБ-10.');
        }
      }, 0);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, [dataset, attempt]);

  useEffect(() => {
    if (dataset && wasLoading.current) {
      wasLoading.current = false;
      announce('Справочник МКБ-10 загружен');
    }
  }, [dataset]);

  // Дебаунс ввода (очистка — сразу)
  useEffect(() => {
    const trimmed = query.trim();
    const t = setTimeout(() => setDebQuery(trimmed), trimmed ? DEBOUNCE_MS : 0);
    return () => clearTimeout(t);
  }, [query]);

  const q = useMemo(() => makeQuery(debQuery), [debQuery]);
  const isSearchMode = isSearchable(q);

  const { results, fallback } = useMemo(
    () =>
      dataset && isSearchMode ? searchWithFallback(dataset.index, q) : { results: [], fallback: '' },
    [dataset, isSearchMode, q]
  );

  const data = !dataset ? [] : isSearchMode ? results : dataset.browse;
  const total = dataset ? dataset.total : 0;
  const helper = helperText({ q, typed: query, found: results.length, fallback, total });

  // Итог поиска озвучивается после паузы ввода
  const spoken = dataset ? searchAnnouncement({ q, found: results.length, fallback }) : '';
  useEffect(() => {
    if (spoken) announce(spoken);
  }, [spoken, q]);

  // Новый запрос — к началу списка
  useEffect(() => {
    if (listRef.current && dataset) {
      try {
        listRef.current.scrollToOffset({ offset: 0, animated: false });
      } catch {
        // список ещё не смонтирован
      }
    }
  }, [q, dataset]);

  const scrollToTop = useCallback(() => {
    if (!listRef.current) return;
    try {
      listRef.current.scrollToOffset({ offset: 0, animated: true });
    } catch {
      // нечего прокручивать
    }
  }, []);

  const handleScroll = useCallback((e) => {
    setShowScrollToTop(e.nativeEvent.contentOffset.y > SCROLL_TOP_THRESHOLD);
  }, []);

  const clearQuery = useCallback(() => {
    setQuery('');
    announce('Поиск очищен');
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const retry = useCallback(() => {
    setLoadError(null);
    setAttempt((n) => n + 1);
  }, []);

  const rowQuery = isSearchMode ? q : null;
  const renderItem = useCallback(
    ({ item }) => <IcdRow item={item} q={rowQuery} styles={styles} />,
    [rowQuery, styles]
  );

  const meta = dataset ? dataset.meta : null;
  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <Text variant="body" color="textSecondary">
          Международная классификация болезней, 10-й пересмотр
        </Text>
        <Text variant="caption" color="textMuted" style={styles.edition}>
          {editionText(meta)}
        </Text>
      </View>
    ),
    [meta, styles]
  );

  const listEmpty = (
    <View style={styles.placeholder}>
      <Text variant="heading" color="textSecondary" style={styles.center}>
        {isSearchMode ? 'Заболевание не найдено' : 'Справочник пуст'}
      </Text>
      {isSearchMode ? (
        <Text variant="body" color="textSecondary" style={[styles.center, styles.placeholderHint]}>
          Проверьте код (например J18.9) или введите другое слово из названия
        </Text>
      ) : null}
    </View>
  );

  if (!dataset) {
    return (
      <Screen>
        {loadError ? (
          <View>
            <Note level="danger" title="Ошибка загрузки">
              {loadError}
            </Note>
            <Button title="Повторить" onPress={retry} accessibilityLabel="Повторить загрузку справочника" />
          </View>
        ) : (
          <View style={styles.loading} accessible accessibilityLiveRegion="polite" accessibilityLabel="Загрузка справочника МКБ-10">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text variant="body" color="textSecondary" style={styles.loadingText}>
              Загрузка справочника МКБ-10…
            </Text>
          </View>
        )}
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={styles.searchBox}>
        <Text variant="title" accessibilityRole="header">
          МКБ-10
        </Text>
        <View style={[styles.inputContainer, focused && styles.inputContainerFocused]}>
          <View style={styles.searchIcon} {...hideFromA11y}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
          </View>
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Код (I21.0) или название"
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            returnKeyType="search"
            accessibilityLabel="Поиск по МКБ-10"
            accessibilityHint="Введите код, например I21.0, или слова из названия"
            testID="icd-search"
          />
          {query.length > 0 ? (
            <Pressable
              onPress={clearQuery}
              accessibilityRole="button"
              accessibilityLabel="Очистить поиск"
              style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
              testID="icd-clear"
            >
              <View {...hideFromA11y}>
                <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
              </View>
            </Pressable>
          ) : null}
        </View>
        <Text
          variant="caption"
          color={helper.warn ? 'warning' : 'textSecondary'}
          style={styles.helper}
          testID="icd-helper"
        >
          {helper.text}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={64}
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        updateCellsBatchingPeriod={50}
        windowSize={11}
        removeClippedSubviews={Platform.OS === 'android'}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        testID="icd-list"
      />

      {showScrollToTop ? (
        <Pressable
          onPress={scrollToTop}
          accessibilityRole="button"
          accessibilityLabel="Прокрутить к началу списка"
          style={({ pressed }) => [styles.scrollToTopButton, pressed && styles.scrollToTopPressed]}
          testID="icd-scroll-top"
        >
          <View {...hideFromA11y}>
            <Ionicons name="arrow-up" size={24} color={colors.primary} />
          </View>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const makeStyles = ({ colors, spacing, radius, typography, isDark }) => ({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: spacing.md, textAlign: 'center' },

  searchBox: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    minHeight: MIN_TOUCH,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
  },
  inputContainerFocused: { borderColor: colors.inputBorderFocus, borderWidth: 2 },
  searchIcon: { paddingLeft: spacing.md },
  input: {
    ...typography.body,
    flex: 1,
    minHeight: MIN_TOUCH,
    color: colors.text,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  clearButtonPressed: { backgroundColor: colors.surfaceAlt },
  helper: { marginTop: spacing.sm },

  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl * 2, flexGrow: 1 },
  listHeader: { marginBottom: spacing.md },
  edition: { marginTop: spacing.xs },

  row: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: isDark ? colors.surfaceRaised : colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowExt: { borderLeftWidth: 4, borderLeftColor: colors.danger },
  codeLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: spacing.xs },
  code: {
    ...typography.bodyStrong,
    color: colors.section.icd,
    letterSpacing: 0.5,
    marginRight: spacing.sm,
  },
  badge: { marginRight: spacing.xs, marginVertical: 2 },
  parent: { marginBottom: spacing.xs },
  name: { ...typography.body, color: colors.text },
  note: { marginTop: spacing.xs },
  noteExt: { fontWeight: '600' },
  src: { marginTop: spacing.xs },
  // Подсветка совпадения — не только цветом, но и начертанием
  hl: {
    backgroundColor: colors.primarySoft,
    color: colors.onPrimarySoft,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  placeholderHint: { marginTop: spacing.sm },
  center: { textAlign: 'center' },

  scrollToTopButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? colors.surfaceRaised : colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    ...(isDark
      ? null
      : {
          shadowColor: colors.shadow,
          shadowOpacity: 0.12,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }),
  },
  scrollToTopPressed: { backgroundColor: colors.surfaceAlt },
});
