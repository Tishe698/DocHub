// glazgo.js — экран «Шкала комы Глазго» (взрослая и педиатрическая до 4 лет).
// Варианты, подсчёт и интерпретация — в glazgo/gcsScore.js (чистые функции, тесты в __tests__).
// Источники клинических значений — в комментариях gcsScore.js.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Screen from '../components/Screen';
import { Text } from '../components/AppText';
import { announce } from '../components/a11y';
import { Button, Card, ChoiceChips, Note, ResultCard } from '../components/ui';
import PatientBar from '../patient/PatientBar';
import { usePatient } from '../patient/PatientContext';
import { useThemedStyles } from '../theme/index';
import {
  COMPONENT_TITLES,
  MODES,
  PUPILS_NONE,
  ageModeMismatch,
  computeGcs,
  gcsSummary,
  modeForAge,
  optionsFor,
  pointsWord,
} from './gcsScore';

const EMPTY_SEL = { eye: null, verbal: null, motor: null, pupils: PUPILS_NONE };

// Вариант шкалы → вариант ChoiceChips: балл виден в подписи, диктор слышит «…, 4 балла».
const toChoice = (opt) => {
  if (opt.nt) {
    return {
      value: opt.id,
      label: `НО — ${opt.label}`,
      accessibilityLabel: `${opt.label}, не оценивается`,
    };
  }
  if (opt.score === null) return { value: opt.id, label: opt.label };
  return {
    value: opt.id,
    label: `${opt.score} — ${opt.label}`,
    accessibilityLabel: `${opt.label}, ${opt.score} ${pointsWord(opt.score)}`,
  };
};

export default function GCScreen() {
  const styles = useThemedStyles(makeStyles);
  const { patient, resetCount } = usePatient();
  const ageMode = modeForAge(patient.ageMonths);

  const [mode, setMode] = useState(() => ageMode || 'adult');
  const [sel, setSel] = useState(EMPTY_SEL);

  // Формулировки V и M у шкал различаются — при смене шкалы выбор V, M и зрачков не переносим.
  const switchMode = useCallback((next) => {
    setMode(next);
    setSel((s) => ({ ...s, verbal: null, motor: null, pupils: PUPILS_NONE }));
  }, []);

  // Возраст пациента изменился (в полосе пациента или на другом экране) — подставляем шкалу.
  const lastAgeMode = useRef(ageMode);
  useEffect(() => {
    if (ageMode === lastAgeMode.current) return;
    lastAgeMode.current = ageMode;
    if (ageMode && ageMode !== mode) switchMode(ageMode);
  }, [ageMode, mode, switchMode]);

  // «Новый пациент» — очищаем оценку
  const lastReset = useRef(resetCount);
  useEffect(() => {
    if (resetCount === lastReset.current) return;
    lastReset.current = resetCount;
    setSel(EMPTY_SEL);
  }, [resetCount]);

  const opts = useMemo(() => optionsFor(mode), [mode]);
  const choices = useMemo(
    () => ({
      E: opts.E.map(toChoice),
      V: opts.V.map(toChoice),
      M: opts.M.map(toChoice),
      P: opts.P.map(toChoice),
    }),
    [opts],
  );

  const result = useMemo(() => computeGcs({ mode, ...sel }), [mode, sel]);
  const mismatch = ageModeMismatch(mode, patient.ageMonths);
  const isChild = mode === 'child';

  const pick = (key) => (value) => setSel((s) => ({ ...s, [key]: value }));

  const onModeChange = (next) => {
    const hadAnswers = sel.verbal !== null || sel.motor !== null;
    switchMode(next);
    if (hadAnswers) announce('Шкала изменена, речевая и двигательная реакции сброшены');
  };

  const onReset = () => {
    setSel(EMPTY_SEL);
    announce('Оценка по шкале Глазго сброшена');
  };

  const levelLabel = result.scorable
    ? result.commandsWarning
      ? `По сумме: ${result.level}`
      : result.level
    : null;

  return (
    <Screen scroll>
      <PatientBar />

      <Text variant="title" accessibilityRole="header" style={styles.title}>
        Шкала комы Глазго
      </Text>
      <Text variant="body" color="textSecondary" style={styles.subtitle}>
        Выберите по одному пункту в каждой категории. Балл указан в начале варианта.
      </Text>

      <ChoiceChips
        label="Шкала по возрасту"
        options={MODES}
        value={mode}
        onChange={onModeChange}
        testID="gcs-mode"
      />
      <Text variant="caption" color="textSecondary" style={styles.caption}>
        {isChild
          ? 'Педиатрическая ШКГ — для детей младше 4 лет (КР «ЧМТ у детей», 2025, прил. Г2).'
          : 'Взрослая ШКГ — для взрослых и детей от 4 лет. У детей младше 4 лет она занижает оценку.'}
        {ageMode && ageMode === mode ? ' Шкала выбрана по возрасту пациента.' : ''}
      </Text>
      {mismatch ? (
        <Note level="warning" title="Шкала не соответствует возрасту" testID="gcs-mismatch">
          {mismatch}
        </Note>
      ) : null}

      <Card style={styles.group}>
        <ChoiceChips
          label={COMPONENT_TITLES.E}
          options={choices.E}
          value={sel.eye}
          onChange={pick('eye')}
          style={styles.chips}
          testID="gcs-eye"
        />
      </Card>
      <Card style={styles.group}>
        <ChoiceChips
          label={COMPONENT_TITLES.V}
          options={choices.V}
          value={sel.verbal}
          onChange={pick('verbal')}
          style={styles.chips}
          testID="gcs-verbal"
        />
      </Card>
      <Card style={styles.group}>
        <ChoiceChips
          label={COMPONENT_TITLES.M}
          options={choices.M}
          value={sel.motor}
          onChange={pick('motor')}
          style={styles.chips}
          testID="gcs-motor"
        />
      </Card>

      {!isChild ? (
        <Card style={styles.group}>
          <ChoiceChips
            label="Реакция зрачков на свет (необязательно)"
            options={choices.P}
            value={sel.pupils}
            onChange={pick('pupils')}
            style={styles.chips}
            testID="gcs-pupils"
          />
          <Text variant="caption" color="textSecondary" style={styles.line}>
            Для ШКГ-З (GCS-Pupils) при ЧМТ у взрослых: из суммы вычитаются баллы зрачков (Brennan,
            2018).
          </Text>
        </Card>
      ) : null}

      <ResultCard
        title="Итог ШКГ"
        value={result.scorable ? String(result.sum) : null}
        unit={result.scorable ? pointsWord(result.sum) : null}
        level={result.severityLevel}
        levelLabel={levelLabel}
        announceText={gcsSummary(result)}
        testID="gcs-result"
      >
        <Text variant="heading" accessibilityLabel={`Компоненты: ${result.notation}`}>
          {result.scorable ? `${result.notation} = ${result.sum}` : result.notation}
        </Text>
        {result.gcsPupils !== null ? (
          <Text variant="body" style={styles.line}>
            {`ШКГ-З (с зрачками): ${result.gcsPupils}`}
          </Text>
        ) : null}
        {result.scorable ? (
          <>
            <Text variant="bodyStrong" style={styles.line}>
              {result.severity}
            </Text>
            {result.airwayAlert ? (
              <Note level="danger" title="8 баллов и меньше" style={styles.noteInCard}>
                Оцените необходимость защиты дыхательных путей (интубация).
              </Note>
            ) : null}
            {result.commandsWarning ? (
              <Note level="warning" title="Выполняет команды (M6)" style={styles.noteInCard}>
                Это не сопор и не кома. Низкая сумма за счёт E или V: проверьте, не мешают ли оценке
                отёк век, интубация или афазия (отметьте «НО»).
              </Note>
            ) : null}
            <Text variant="caption" color="textSecondary" style={styles.line}>
              Соответствие баллов уровню сознания условное (КР «ЧМТ у детей», 2025, прил. Г1); в
              других источниках границы отличаются на 1 балл. В карту записывайте компоненты.
            </Text>
          </>
        ) : (
          <Text variant="body" color="textSecondary" style={styles.line}>
            {result.hint}
          </Text>
        )}
      </ResultCard>

      <Button
        title="Сбросить"
        variant="secondary"
        icon="refresh"
        onPress={onReset}
        testID="gcs-reset"
      />
    </Screen>
  );
}

const makeStyles = ({ spacing }) => ({
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.lg },
  caption: { marginTop: -spacing.xs, marginBottom: spacing.lg },
  line: { marginTop: spacing.sm },
  group: { paddingBottom: spacing.sm },
  chips: { marginBottom: 0 },
  noteInCard: { marginTop: spacing.sm, marginBottom: 0 },
});
