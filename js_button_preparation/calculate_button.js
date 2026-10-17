// calculate_button.js — экран «Расчёт препаратов»: поиск по списку, ввод данных, результат.
// Только интерфейс: валидация, разбор, форматирование, расчёт и поиск — в ./engine.js.
// Вес, возраст, рост и пол берутся из общего пациента (patient/PatientContext) и пишутся обратно;
// пути введения и показания — поля-выборы из ./routes.js (кнопки ChoiceChips).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, Keyboard, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Screen from '../components/Screen';
import { Text, TextInput } from '../components/AppText';
import { a11yLabel, announce, hideFromA11y } from '../components/a11y';
import { Badge, Button, Card, ChoiceChips, Note, NumberField, ResultCard } from '../components/ui';
import PatientBar from '../patient/PatientBar';
import { usePatient, usePatientAge, usePatientNumber } from '../patient/PatientContext';
import { formatAge } from '../patient/estimates';
import { useTheme, useThemedStyles, MIN_TOUCH } from '../theme/index';
import { inputLabel } from './routes';
import formulas from './formulas';
import {
  asChoiceInput,
  buildCopyText,
  computeResult,
  getInputType,
  highlightParts,
  isAgeKey,
  isReferenceOnly,
  itemLevel,
  itemSpoken,
  labelBase,
  resolveAge,
  resultLevel,
  resultSpoken,
  searchFormulas,
  unitFromLabel,
  validateField,
} from './engine';

const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';

// Пометка к весу в результате и копии: масса оценена, а не взвешена
const weightNoteOf = (patient, derived) =>
  derived.weightIsEstimate
    ? patient.weightSource === 'broselow'
      ? 'оценка по ленте Broselow'
      : 'оценка по возрасту'
    : null;

const weightBadgeOf = (patient, derived) =>
  derived.weightIsEstimate ? (patient.weightSource === 'broselow' ? 'оценка: Broselow' : 'оценка: по возрасту') : null;

/** ------------------------------ Подсветка найденного ------------------------------ **/
function Highlighted({ text, term, variant, color, style }) {
  const styles = useThemedStyles(makeStyles);
  const parts = highlightParts(text, term);
  return (
    <Text variant={variant} color={color} style={style}>
      {parts.map((p, i) =>
        p.hit ? (
          <Text key={i} style={styles.hit}>
            {p.text}
          </Text>
        ) : (
          p.text
        )
      )}
    </Text>
  );
}

/** ------------------------------ Текстовое поле (старые записи) ------------------------------ **/
function TextField({ label, value, onChangeText, error }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.fieldWrap}>
      <Text variant="bodyStrong" style={styles.fieldLabel} {...hideFromA11y}>
        {label}
      </Text>
      <TextInput
        value={value || ''}
        onChangeText={onChangeText}
        placeholder={`Введите: ${String(label).toLowerCase()}`}
        placeholderTextColor={colors.placeholder}
        autoCapitalize="none"
        accessibilityLabel={label}
        accessibilityHint={error}
        style={[styles.textInput, error ? { borderColor: colors.inputBorderError, borderWidth: 2 } : null]}
      />
      {error ? (
        <Text variant="caption" color="danger" style={styles.fieldMsg} {...hideFromA11y}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** ------------------------------ Строка результата ------------------------------ **/
function ResultRow({ item }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const level = itemLevel(item.status);
  // Уровень — рамкой и мягким фоном уровня; текст основным цветом (читаем на *Soft в обеих темах),
  // словами — в бейдже («выше макс.»), так что цвет не единственный носитель смысла
  const alarm = level === 'danger' || level === 'warning';
  const borderColor = alarm ? colors[level] : colors.border;
  const backgroundColor = alarm ? colors[`${level}Soft`] : colors.surfaceAlt;

  if (item.status === 'info') {
    return (
      <View style={[styles.row, { borderColor, backgroundColor }]} accessible accessibilityLabel={a11yLabel(item.name, item.text)}>
        <Text variant="caption" color="textSecondary" style={styles.rowNoteName}>
          {item.name}
        </Text>
        <Text variant="body">{item.text}</Text>
      </View>
    );
  }
  return (
    <View
      style={[styles.row, { borderColor, backgroundColor, borderWidth: alarm ? 2 : 1 }]}
      accessible
      accessibilityLabel={itemSpoken(item)}
    >
      <View style={styles.rowLine}>
        <Text variant="bodyStrong" style={styles.rowName}>
          {item.name}
        </Text>
        <Text variant="heading" style={styles.rowValue}>
          {item.text}
        </Text>
      </View>
      {item.badge ? <Badge level={level || 'neutral'} label={item.badge} style={styles.rowBadge} /> : null}
    </View>
  );
}

/** ============================== Экран ============================== **/
const WelcomeScreen = () => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { patient, setPatient, derived, resetCount } = usePatient();
  const weight = usePatientNumber('weightKg');
  const height = usePatientNumber('heightCm');
  const age = usePatientAge();

  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputs, setInputs] = useState({}); // поля препарата (скорость, мг в растворе, объём…)
  const [choices, setChoices] = useState({}); // выбранные путь введения / показание
  const [results, setResults] = useState(null); // { ...computeResult, sig }
  const scrollRef = useRef(null);
  const resultY = useRef(0);
  // y карточки препарата в содержимом ScrollView: над ней PatientBar и отступ контейнера
  const detailY = useRef(0);
  const scrollToResult = useRef(false);

  // «Новый пациент» в полосе пациента — поля препарата и результат тоже сбрасываются
  const [seenReset, setSeenReset] = useState(resetCount);
  if (seenReset !== resetCount) {
    setSeenReset(resetCount);
    setInputs({});
    setChoices({});
    setResults(null);
  }

  const totalDrugs = formulas.length;
  const totalCalcs = useMemo(() => formulas.filter((f) => !isReferenceOnly(f)).length, []);
  const filtered = useMemo(() => searchFormulas(formulas, searchTerm), [searchTerm]);

  const inputsMap = useMemo(() => (selected && selected.inputs) || {}, [selected]);
  const inputKeys = Object.keys(inputsMap);
  const hasAge = inputKeys.some(isAgeKey);
  const referenceOnly = isReferenceOnly(selected);
  const canCalculate = !!selected && typeof selected.formula === 'function' && !referenceOnly;

  // Сырые значения полей записи: пациент — из общего контекста, остальное — локально
  const rawInputs = {};
  inputKeys.forEach((key) => {
    if (key === 'weight') rawInputs[key] = weight.text;
    else if (key === 'heightCm') rawInputs[key] = height.text;
    else if (key === 'sex') rawInputs[key] = patient.sex;
    else if (asChoiceInput(key, inputsMap[key])) rawInputs[key] = choices[key];
    else if (!isAgeKey(key)) rawInputs[key] = inputs[key];
  });
  const ageTexts = hasAge ? { years: age.years.text, months: age.months.text } : null;
  const weightNote = weightNoteOf(patient, derived);
  // Подпись ввода: результат показывается, только пока ввод не изменился (доза для старого веса
  // не должна остаться на экране и в буфере)
  const sig = selected ? JSON.stringify([selected.name, rawInputs, ageTexts, weightNote]) : '';
  const shownResults = results && results.sig === sig ? results : null;

  const openFormula = (formula) => {
    setSelected(formula);
    setInputs({});
    setChoices({});
    setResults(null);
    if (scrollRef.current) scrollRef.current.scrollTo({ y: 0, animated: false });
  };

  const backToList = useCallback(() => {
    setSelected(null);
    setInputs({});
    setChoices({});
    setResults(null);
    if (scrollRef.current) scrollRef.current.scrollTo({ y: 0, animated: false });
  }, []);

  // Android «Назад» в карточке препарата возвращает к списку, а не закрывает экран
  useEffect(() => {
    if (!selected) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      backToList();
      return true;
    });
    return () => sub.remove();
  }, [selected, backToList]);

  const setInput = (key, text) => setInputs((prev) => ({ ...prev, [key]: text }));
  const setChoice = (key, value) => setChoices((prev) => ({ ...prev, [key]: value }));

  const calculate = () => {
    if (!selected) return;
    Keyboard.dismiss();
    const r = computeResult(selected, rawInputs, { age: ageTexts, weightNote });
    setResults({ ...r, sig });
    scrollToResult.current = true;
    // Успех озвучивает ResultCard; ошибку — здесь
    if (r.error) announce(resultSpoken(r));
  };

  const onDetailLayout = (e) => {
    detailY.current = e.nativeEvent.layout.y;
  };

  // layout.y результата — относительно карточки препарата, а не содержимого ScrollView:
  // прибавляем y карточки (высота PatientBar и отступ), иначе прокрутка недокручивает
  const onResultLayout = (e) => {
    resultY.current = detailY.current + e.nativeEvent.layout.y;
    if (scrollToResult.current && scrollRef.current) {
      scrollToResult.current = false;
      scrollRef.current.scrollTo({ y: Math.max(0, resultY.current - 16), animated: true });
    }
  };

  const copyResults = async () => {
    if (!shownResults || (!shownResults.success && !shownResults.info)) return;
    try {
      await Clipboard.setStringAsync(buildCopyText(shownResults));
      Alert.alert('Скопировано', 'Результаты скопированы в буфер обмена');
    } catch {
      Alert.alert('Ошибка', 'Не удалось скопировать результаты');
    }
  };

  const clearFields = () => {
    setInputs({});
    setChoices({});
    setResults(null);
    announce('Поля препарата очищены');
  };

  /** ------------------------------ Поля ввода ------------------------------ **/
  const renderAge = () => {
    const anyText = !isBlank(age.years.text) || !isBlank(age.months.text);
    const err = anyText ? resolveAge(inputsMap, ageTexts, selected).error : null;
    const monthsErr = err && /мес/.test(err) ? err : null;
    const yearsErr = err && !monthsErr ? err : null;
    const yearsOnly = 'ageYears' in inputsMap && !('ageMonths' in inputsMap);
    return (
      <View key="age" style={styles.block}>
        <View style={styles.ageRow}>
          <NumberField
            label="Возраст, полных лет"
            unit="лет"
            value={age.years.text}
            onChangeText={age.years.onChangeText}
            error={yearsErr}
            style={styles.ageField}
          />
          <NumberField
            label="и месяцев"
            unit="мес"
            value={age.months.text}
            onChangeText={age.months.onChangeText}
            error={monthsErr}
            style={styles.ageField}
          />
        </View>
        {patient.ageMonths !== null && !err ? (
          <Text variant="caption" color="textSecondary" style={styles.caption}>
            {`Возраст: ${formatAge(patient.ageMonths)}`}
          </Text>
        ) : null}
        {yearsOnly ? (
          <Text variant="caption" color="textSecondary" style={styles.caption}>
            В расчёт идут полные годы; до 1 года — по месяцам
          </Text>
        ) : null}
        <Button
          title="Новорождённый (до 1 мес)"
          variant={derived.isNeonate ? 'primary' : 'secondary'}
          selected={!!derived.isNeonate}
          onPress={age.setNeonate}
          style={styles.neonate}
        />
      </View>
    );
  };

  const renderField = (key) => {
    const input = inputsMap[key];
    const label = inputLabel(input) || key;
    const type = getInputType(key, input);

    if (type === 'choice') {
      const choice = asChoiceInput(key, input);
      const isSex = key === 'sex';
      return (
        <ChoiceChips
          key={key}
          label={choice.label}
          options={choice.choices}
          value={isSex ? patient.sex : choices[key] === undefined ? choice.default : choices[key]}
          onChange={(v) => (isSex ? setPatient({ sex: v }) : setChoice(key, v))}
        />
      );
    }

    const raw = rawInputs[key];
    const check = isBlank(raw) ? {} : validateField(key, input, raw, selected);

    if (type === 'text') {
      return <TextField key={key} label={label} value={raw} onChangeText={(t) => setInput(key, t)} error={check.error} />;
    }

    const isWeight = key === 'weight';
    const isHeight = key === 'heightCm';
    const unit = unitFromLabel(label) || (isWeight ? 'кг' : isHeight ? 'см' : undefined);
    const onChangeText = isWeight ? weight.onChangeText : isHeight ? height.onChangeText : (t) => setInput(key, t);
    return (
      <View key={key}>
        <NumberField
          label={labelBase(label) || label}
          unit={unit}
          value={raw}
          onChangeText={onChangeText}
          error={check.error}
          badge={isWeight ? weightBadgeOf(patient, derived) : null}
          badgeLevel="warning"
        />
        {check.warning ? (
          <Note level="warning" style={styles.fieldNote}>
            {check.warning}
          </Note>
        ) : null}
      </View>
    );
  };

  const renderFields = () => {
    let ageDone = false;
    return inputKeys.map((key) => {
      if (isAgeKey(key)) {
        if (ageDone) return null;
        ageDone = true;
        return renderAge();
      }
      return renderField(key);
    });
  };

  /** ------------------------------ Результат ------------------------------ **/
  const renderResults = () => {
    if (!shownResults) return null;
    const r = shownResults;
    if (r.error) {
      return (
        <View onLayout={onResultLayout}>
          <Note level="danger" title={r.type === 'validation' ? 'Проверьте введённые данные' : 'Ошибка расчёта'}>
            {(r.errors || [r.message]).map((m, i) => (
              <Text key={i} variant="body" style={styles.listLine}>
                {m}
              </Text>
            ))}
          </Note>
        </View>
      );
    }
    const { level, label } = resultLevel(r.items);
    return (
      <View onLayout={onResultLayout}>
        <ResultCard
          title={r.info ? 'Расчёт не выполняется' : 'Результат расчёта'}
          level={level}
          levelLabel={label}
          announceText={resultSpoken(r)}
        >
          {r.choices.map((c) => (
            <Text key={c.key} variant="bodyStrong" style={styles.line}>
              {`${c.label}: ${c.valueLabel}`}
            </Text>
          ))}
          {r.inputsText ? (
            <Text variant="body" color="textSecondary" style={styles.line}>
              {`Рассчитано для: ${r.inputsText}`}
            </Text>
          ) : null}
          <Text variant="caption" color="textSecondary" style={styles.line}>
            {`Время расчёта: ${r.timestamp}`}
          </Text>

          {r.notes.map((n, i) => (
            <Note key={`note-${i}`} level="warning" style={styles.resultNote}>
              {n}
            </Note>
          ))}

          {r.info ? (
            <View style={styles.infoBlock}>
              <Text variant="bodyStrong" style={styles.line}>
                {r.message}
              </Text>
              {r.warnings.map((w, i) => (
                <Text key={`iw-${i}`} variant="body" style={styles.listLine}>
                  {`• ${w}`}
                </Text>
              ))}
            </View>
          ) : null}

          {(r.items || []).map((item, i) => (
            <ResultRow key={`${item.key}-${i}`} item={item} />
          ))}

          <View style={styles.actions}>
            <Button
              title="Копировать"
              variant="secondary"
              icon="copy-outline"
              onPress={copyResults}
              accessibilityLabel="Копировать результат"
              style={styles.action}
            />
            <Button
              title="Сбросить"
              variant="ghost"
              icon="close"
              onPress={() => setResults(null)}
              accessibilityLabel="Сбросить результат"
              style={styles.action}
            />
          </View>
        </ResultCard>
      </View>
    );
  };

  /** ------------------------------ Карточка препарата ------------------------------ **/
  const renderDetail = () => {
    const hasLocal = Object.keys(inputs).some((k) => !isBlank(inputs[k])) || Object.keys(choices).length > 0;
    return (
      <View onLayout={onDetailLayout}>
        <Button
          title="К списку препаратов"
          variant="ghost"
          icon="arrow-back"
          onPress={backToList}
          style={styles.back}
        />
        <Text variant="title" accessibilityRole="header" style={styles.title}>
          {selected.name}
        </Text>
        <Text variant="body" color="textSecondary" style={styles.subtitle}>
          {referenceOnly
            ? 'Справочная запись: расчёт не предусмотрен'
            : inputKeys.length
              ? 'Введите необходимые значения'
              : 'Фиксированная доза: нажмите «Рассчитать»'}
        </Text>

        {selected.description ? (
          <Note level="info" title="Форма выпуска">
            {selected.description}
          </Note>
        ) : null}

        {selected.warnings && selected.warnings.length > 0 ? (
          <Note level="warning" title="Внимание">
            {selected.warnings.map((w, i) => (
              <Text key={i} variant="body" style={styles.listLine}>
                {selected.warnings.length > 1 ? `• ${w}` : w}
              </Text>
            ))}
          </Note>
        ) : null}

        {renderFields()}

        {canCalculate ? (
          <View style={styles.calcBlock}>
            <Button title="Рассчитать" icon="calculator-outline" onPress={calculate} fullWidth />
            {hasLocal || shownResults ? (
              <Button
                title="Очистить поля препарата"
                variant="ghost"
                icon="trash-outline"
                onPress={clearFields}
                accessibilityHint="Данные пациента не меняются: их очищает кнопка «Новый пациент»"
                fullWidth
                style={styles.clear}
              />
            ) : null}
          </View>
        ) : null}

        {renderResults()}
      </View>
    );
  };

  /** ------------------------------ Список ------------------------------ **/
  const renderList = () => (
    <View>
      <Text variant="caption" color="textSecondary" style={styles.stats}>
        {`Препаратов в справочнике: ${totalDrugs}, с расчётом дозы: ${totalCalcs}`}
      </Text>

      <View style={styles.searchBox}>
        <View style={styles.searchIcon} {...hideFromA11y}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
        </View>
        <TextInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="МНН или торговое название (анальгин, адреналин…)"
          placeholderTextColor={colors.placeholder}
          accessibilityLabel="Поиск препарата"
          accessibilityHint="Название по МНН или торговое"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {searchTerm.length > 0 ? (
          <Pressable
            onPress={() => setSearchTerm('')}
            accessibilityRole="button"
            accessibilityLabel="Очистить поиск"
            style={({ pressed }) => [styles.clearSearch, pressed ? { backgroundColor: colors.surfaceAlt } : null]}
          >
            <View {...hideFromA11y}>
              <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
            </View>
          </Pressable>
        ) : null}
      </View>

      {searchTerm.trim() !== '' ? (
        <Text variant="caption" color="textSecondary" style={styles.found} accessibilityLiveRegion="polite">
          {`Найдено: ${filtered.length} из ${totalDrugs}`}
        </Text>
      ) : null}

      {filtered.length === 0 && searchTerm.trim() !== '' ? (
        <Note level="info" title="Препараты не найдены">
          Попробуйте другое название — по МНН или торговое
        </Note>
      ) : null}

      {filtered.map(({ formula, synonym }) => {
        const hasWarnings = !!(formula.warnings && formula.warnings.length);
        const reference = isReferenceOnly(formula);
        return (
          <Card
            key={formula.name}
            onPress={() => openFormula(formula)}
            accessibilityLabel={a11yLabel(
              formula.name,
              synonym ? `найдено по названию ${synonym}` : null,
              reference ? 'справочная запись' : null,
              hasWarnings ? 'есть предупреждения' : null
            )}
            accessibilityHint="Открыть расчёт препарата"
            style={styles.card}
          >
            <Highlighted text={formula.name} term={searchTerm} variant="bodyStrong" />
            {formula.description ? (
              <Highlighted
                text={formula.description}
                term={searchTerm}
                variant="caption"
                color="textSecondary"
                style={styles.cardDesc}
              />
            ) : null}
            {synonym ? (
              <Text variant="caption" color="textSecondary" style={[styles.cardDesc, styles.synonym]}>
                {`Найдено по названию: ${synonym}`}
              </Text>
            ) : null}
            {hasWarnings || reference ? (
              <View style={styles.badges}>
                {reference ? <Badge level="neutral" label="Справочно" style={styles.badge} /> : null}
                {hasWarnings ? <Badge level="warning" label="Есть предупреждения" style={styles.badge} /> : null}
              </View>
            ) : null}
          </Card>
        );
      })}

      <Note level="info" title="Расчёт справочный" style={styles.safety}>
        Сверяйте дозу с инструкцией к препарату и клиническими рекомендациями. Решение о назначении принимает врач.
      </Note>
    </View>
  );

  return (
    <Screen scroll scrollRef={scrollRef}>
      <PatientBar />
      {selected ? renderDetail() : renderList()}
    </Screen>
  );
};

export default WelcomeScreen;

const makeStyles = ({ colors, spacing, radius, typography }) => ({
  hit: {
    backgroundColor: colors.primarySoft,
    color: colors.onPrimarySoft,
    fontWeight: '700',
  },
  // список
  stats: { marginBottom: spacing.sm },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    backgroundColor: colors.inputBg,
    paddingLeft: spacing.md,
    marginBottom: spacing.sm,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: {
    ...typography.body,
    flex: 1,
    color: colors.text,
    paddingVertical: spacing.sm,
    minHeight: MIN_TOUCH - 2,
  },
  clearSearch: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  found: { marginBottom: spacing.sm },
  card: { padding: spacing.md },
  cardDesc: { marginTop: spacing.xs },
  synonym: { fontWeight: '600' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs },
  badge: { marginRight: spacing.sm, marginTop: spacing.xs },
  safety: { marginTop: spacing.md },
  // карточка препарата
  back: { alignSelf: 'flex-start', marginBottom: spacing.sm, marginLeft: -spacing.sm },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.md },
  block: { marginBottom: spacing.md },
  ageRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs },
  ageField: { flexGrow: 1, flexBasis: 140, marginHorizontal: spacing.xs, marginBottom: spacing.sm },
  caption: { marginBottom: spacing.xs },
  neonate: { alignSelf: 'flex-start', marginTop: spacing.xs },
  fieldNote: { marginTop: -spacing.xs },
  fieldWrap: { marginBottom: spacing.md },
  fieldLabel: { marginBottom: spacing.xs },
  fieldMsg: { marginTop: spacing.xs },
  textInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: MIN_TOUCH,
  },
  calcBlock: { marginTop: spacing.sm, marginBottom: spacing.lg },
  clear: { marginTop: spacing.sm },
  // результат
  line: { marginBottom: spacing.xs },
  listLine: { marginTop: spacing.xs },
  resultNote: { marginTop: spacing.sm, marginBottom: 0 },
  infoBlock: { marginTop: spacing.sm },
  row: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  rowLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between' },
  rowName: { flexShrink: 1, marginRight: spacing.sm },
  rowValue: { fontVariant: ['tabular-nums'], textAlign: 'right', flexShrink: 1, marginLeft: 'auto' },
  rowNoteName: { marginBottom: spacing.xs },
  rowBadge: { marginTop: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, marginHorizontal: -spacing.xs },
  action: { flexGrow: 1, marginHorizontal: spacing.xs, marginTop: spacing.xs },
});
