// shock_algov_app.js — экран «Шоковый индекс» (Альговер / SIPA).
// Расчёт и интерпретация — в calculateShockIndex.js (чистые функции с тестами);
// возраст берётся из общего пациента (PatientContext), правка поля меняет пациента.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Screen from '../components/Screen';
import { Text } from '../components/AppText';
import { announce, hideFromA11y } from '../components/a11y';
import { Badge, Button, Note, NumberField, ResultCard, Section, SwitchRow } from '../components/ui';
import PatientBar from '../patient/PatientBar';
import { usePatient, usePatientAge } from '../patient/PatientContext';
import { useThemedStyles } from '../theme/index';
import { ageFieldErrors, evaluateShockIndex, fmt, shockIndexSummary } from './calculateShockIndex';

const MODE_TITLES = {
  adult: 'Взрослая шкала',
  adult_noage: 'Взрослая шкала (возраст не указан)',
  sipa: 'Дети 1–16 лет: SIPA',
  infant: 'Ребёнок до 1 года',
  pregnancy: 'Беременность / после родов',
};

export default function CalcShockIndexScreen() {
  const styles = useThemedStyles(makeStyles);
  const { patient, resetCount } = usePatient();
  const age = usePatientAge();

  const [hr, setHr] = useState('');
  const [sbp, setSbp] = useState('');
  const [pregnant, setPregnant] = useState(false);
  const [trauma, setTrauma] = useState(false);

  // «Новый пациент» в PatientBar очищает и показатели этого экрана
  const lastReset = useRef(resetCount);
  useEffect(() => {
    if (lastReset.current === resetCount) return;
    lastReset.current = resetCount;
    setHr('');
    setSbp('');
    setPregnant(false);
    setTrauma(false);
  }, [resetCount]);

  const isMale = patient.sex === 'male';
  const ageErrors = ageFieldErrors(age.years.text, age.months.text);
  const ageInvalid = !!(ageErrors.years || ageErrors.months);

  const evaluation = useMemo(
    () =>
      evaluateShockIndex({
        hrText: hr,
        sbpText: sbp,
        ageMonths: patient.ageMonths,
        ageInvalid,
        pregnant: pregnant && !isMale,
        trauma,
      }),
    [hr, sbp, patient.ageMonths, ageInvalid, pregnant, isMale, trauma],
  );
  const res = evaluation.result;

  const clearVitals = () => {
    setHr('');
    setSbp('');
    setPregnant(false);
    setTrauma(false);
    announce('Показатели очищены');
  };

  return (
    <Screen scroll>
      <PatientBar />

      <Text variant="body" color="textSecondary" style={styles.intro}>
        Индекс Альговера: SI = пульс / САД. Взрослые, дети (SIPA), беременность, травма.
      </Text>

      <Section title="Показатели">
        <View style={styles.row}>
          <NumberField
            label="Пульс"
            unit="уд/мин"
            value={hr}
            onChangeText={setHr}
            error={evaluation.fieldErrors.hr}
            style={styles.cell}
            testID="shock-hr"
          />
          <NumberField
            label="САД"
            unit="мм рт. ст."
            value={sbp}
            onChangeText={setSbp}
            error={evaluation.fieldErrors.sbp}
            hint="Систолическое давление"
            style={styles.cell}
            testID="shock-sbp"
          />
        </View>
      </Section>

      <Section
        title="Возраст"
        description="Общий для всех калькуляторов. Для ребёнка обязателен (до 1 года — в месяцах). Пусто — взрослая шкала."
      >
        <View style={styles.row}>
          <NumberField
            label="Лет"
            unit="лет"
            value={age.years.text}
            onChangeText={age.years.onChangeText}
            error={ageErrors.years}
            style={styles.cell}
            testID="shock-age-years"
          />
          <NumberField
            label="Месяцев"
            unit="мес"
            value={age.months.text}
            onChangeText={age.months.onChangeText}
            error={ageErrors.months}
            style={styles.cell}
            testID="shock-age-months"
          />
        </View>
      </Section>

      <Section title="Условия">
        {isMale ? null : (
          <SwitchRow
            label="Беременность / после родов"
            description="Отдельные пороги КР МЗ РФ «Послеродовое кровотечение»"
            value={pregnant}
            onValueChange={setPregnant}
            testID="shock-pregnant"
          />
        )}
        <SwitchRow
          label="Травма"
          description="Порог раннего вмешательства и трансфузии"
          value={trauma}
          onValueChange={setTrauma}
          testID="shock-trauma"
        />
      </Section>

      <Section title="Результат">
        {evaluation.status === 'empty' ? (
          <Note level="info">Введите пульс и САД — индекс рассчитается сразу.</Note>
        ) : null}
        {evaluation.status === 'error' ? (
          <Note level="danger" title="Проверьте ввод">
            {evaluation.error}
          </Note>
        ) : null}
        {res ? <ShockResult res={res} styles={styles} /> : null}
      </Section>

      <Button
        title="Очистить показатели"
        variant="secondary"
        icon="refresh"
        onPress={clearVitals}
        accessibilityHint="Очистить пульс, давление и переключатели; данные пациента не меняются"
        fullWidth
      />
    </Screen>
  );
}

function ShockResult({ res, styles }) {
  const bloodLossTitle =
    res.mode === 'pregnancy' ? 'Кровопотеря' : 'Кровопотеря (ориентировочно, взрослые)';
  return (
    <>
      <ResultCard
        title="Шоковый индекс"
        value={fmt(res.si, 2)}
        level={res.category.tone}
        levelLabel={res.category.label}
        announceText={shockIndexSummary(res)}
        testID="shock-result"
      >
        <Text variant="caption" color="textSecondary">
          {MODE_TITLES[res.mode]}
        </Text>
        <Text variant="body" style={styles.paragraph}>
          {res.interpretation}
        </Text>
        {res.pediatric ? (
          <Text variant="body" style={styles.paragraph}>
            {`Порог SIPA для возраста: превышен при SI > ${fmt(res.pediatric.cutoff)}`}
          </Text>
        ) : null}
        {res.bloodLossHint ? (
          <View style={styles.kv}>
            <Text variant="bodyStrong">{`${bloodLossTitle}: `}</Text>
            <Text variant="body" style={styles.kvValue}>
              {res.bloodLossHint}
            </Text>
          </View>
        ) : null}
        <View style={styles.badges}>
          {res.flags.hypotension ? (
            <Badge level="danger" label="Гипотензия для возраста" style={styles.badge} />
          ) : null}
          {res.flags.pregnancyConcern ? (
            <Badge level="danger" label="Беременность: SI ≥ 1,0" style={styles.badge} />
          ) : null}
          {res.flags.traumaHighRisk ? (
            <Badge level="warning" label={res.traumaLabel} style={styles.badge} />
          ) : null}
        </View>
      </ResultCard>

      {res.warnings.map((w) => (
        <Note key={w} level="danger">
          {w}
        </Note>
      ))}

      <View style={styles.notes}>
        {res.notes.map((n) => (
          <View key={n} style={styles.noteRow}>
            <Text variant="body" color="textSecondary" style={styles.bullet} {...hideFromA11y}>
              •
            </Text>
            <Text variant="caption" color="textSecondary" style={styles.noteText}>
              {n}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}

const makeStyles = ({ colors, spacing }) => ({
  intro: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs },
  cell: { flexGrow: 1, flexBasis: 150, marginHorizontal: spacing.xs },
  paragraph: { marginTop: spacing.sm },
  kv: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  kvValue: { flexShrink: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs },
  badge: { marginRight: spacing.sm, marginTop: spacing.sm },
  notes: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xs },
  bullet: { marginRight: spacing.sm },
  noteText: { flex: 1 },
});
