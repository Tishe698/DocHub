// NorepinephrineScreen.js — расчёт инфузии норадреналина (шприцевой насос и капельница).
// Расчёт — в norepinephrineCalc.js (чистые функции с тестами). Масса — из общего пациента:
// правка поля меняет пациента (видно в PatientBar), выбор зоны Broselow подставляет массу сюда.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Screen from '../components/Screen';
import { Text } from '../components/AppText';
import { a11yLabel, announce } from '../components/a11y';
import {
  Button,
  Card,
  ChoiceChips,
  Note,
  NumberField,
  ResultCard,
  Section,
} from '../components/ui';
import PatientBar from '../patient/PatientBar';
import { usePatient, usePatientNumber } from '../patient/PatientContext';
import { useThemedStyles } from '../theme/index';
import {
  DROP_FACTORS,
  calcNorepinephrine,
  echo,
  fmt,
  norepinephrineSummary,
} from './norepinephrineCalc';

// Значения по умолчанию при открытии экрана и для «Новый пациент».
// Доза 0,1 мкг/кг/мин основания = 0,2 тартрата (старт по инструкции РФ 0,1–0,3 тартрата).
// Инструкция РФ «Норэпинефрин»: 2 мл концентрата (2 мг основания) + 48 мл 5% декстрозы = 40 мкг/мл;
// 20 мл концентрата (20 мг основания) + 480 мл 5% декстрозы = 40 мкг/мл основания.
const DEFAULTS = {
  dose: '0.1',
  drugMg: '2',
  syrVol: '50',
  bagMg: '20',
  bagDil: '480',
  dropFactor: 20,
};
const EMPTY = { dose: '', drugMg: '', syrVol: '', bagMg: '', bagDil: '', dropFactor: 20 };

const BAG_VOLUMES = [200, 250, 400, 480, 500].map((v) => ({
  value: String(v),
  label: `${v} мл`,
  accessibilityLabel: `${v} миллилитров`,
}));
const DROP_OPTIONS = DROP_FACTORS.map((f) => ({
  value: f,
  label: `${f} кап/мл`,
  accessibilityLabel:
    f === 60 ? '60 капель в миллилитре, микрокапельная' : `${f} капель в миллилитре`,
}));

const isBlank = (t) => String(t ?? '').trim() === '';
const toNotes = (items) =>
  (items || []).map((it) => ({
    level: it.level === 'error' ? 'danger' : it.level === 'warn' ? 'warning' : 'info',
    text: it.text,
  }));

export default function NorepinephrineScreen() {
  const styles = useThemedStyles(makeStyles);
  const { patient, derived, resetCount } = usePatient();
  // Масса не подставляется заранее: забытый ввод у ребёнка не должен давать «взрослую» скорость
  const weight = usePatientNumber('weightKg');
  const [f, setF] = useState(DEFAULTS);
  const set = (key) => (value) => setF((prev) => ({ ...prev, [key]: value }));

  // «Новый пациент» возвращает поля экрана к значениям по умолчанию
  const lastReset = useRef(resetCount);
  useEffect(() => {
    if (lastReset.current === resetCount) return;
    lastReset.current = resetCount;
    setF(DEFAULTS);
  }, [resetCount]);

  const r = useMemo(
    () =>
      calcNorepinephrine({
        weight: weight.text,
        dose: f.dose,
        drugMg: f.drugMg,
        syrVol: f.syrVol,
        bagMg: f.bagMg,
        bagDiluent: f.bagDil,
        dropFactor: f.dropFactor,
        ageMonths: patient.ageMonths,
      }),
    [weight.text, f, patient.ageMonths],
  );

  const clearFields = () => {
    setF(EMPTY);
    announce('Доза и разведение очищены');
  };

  const weightError = !isBlank(weight.text) ? r.fieldErrors.weight : null;
  const doseError = !isBlank(f.dose) ? r.fieldErrors.dose : null;
  const s = r.ok ? r.syringe : null;
  const b = r.ok ? r.bag : null;
  const spoken = norepinephrineSummary(r);
  const syringeShown = !!(s && s.ok);

  return (
    <Screen scroll>
      <PatientBar />

      <Text variant="body" color="textSecondary" style={styles.intro}>
        Норадреналина тартрат 2 мг/мл = 1 мг/мл основания (ампула 4 мл = 4 мг основания). Доза и мг
        — по основанию.
      </Text>

      <Section title="Пациент и доза">
        <NumberField
          label="Масса тела"
          unit="кг"
          value={weight.text}
          onChangeText={weight.onChangeText}
          error={weightError}
          badge={derived.weightIsEstimate ? 'оценка' : null}
          badgeLevel="warning"
          hint={
            derived.weightIsEstimate
              ? 'Масса оценена (лента Broselow или возраст) — уточните при возможности.'
              : null
          }
          testID="norepi-weight"
        />
        <NumberField
          label="Доза (по основанию)"
          unit="мкг/кг/мин"
          value={f.dose}
          onChangeText={set('dose')}
          error={doseError}
          hint="Инструкции РФ дают дозу по тартрату: старт 0,1–0,3 тартрата = 0,05–0,15 основания."
          testID="norepi-dose"
        />
      </Section>

      <Section title="Шприцевой насос">
        <NumberField
          label="Норадреналин в шприце, мг основания"
          unit="мг"
          value={f.drugMg}
          onChangeText={set('drugMg')}
          hint="1 мг основания = 1 мл концентрата (2 мг тартрата)."
          testID="norepi-syringe-mg"
        />
        <NumberField
          label="Итоговый объём раствора в шприце"
          unit="мл"
          value={f.syrVol}
          onChangeText={set('syrVol')}
          hint="Концентрат + растворитель (5% глюкоза)."
          testID="norepi-syringe-ml"
        />
      </Section>

      <Section title="Капельница (пакет)">
        <NumberField
          label="Норадреналин в пакете, мг основания"
          unit="мг"
          value={f.bagMg}
          onChangeText={set('bagMg')}
          testID="norepi-bag-mg"
        />
        <NumberField
          label="Растворитель в пакете"
          unit="мл"
          value={f.bagDil}
          onChangeText={set('bagDil')}
          hint="5% глюкоза или 0,9% NaCl. Объём концентрата добавляется к растворителю."
          testID="norepi-bag-ml"
        />
        <ChoiceChips
          label="Объём растворителя"
          options={BAG_VOLUMES}
          value={String(f.bagDil).trim()}
          onChange={set('bagDil')}
        />
        <ChoiceChips
          label="Капельная система"
          options={DROP_OPTIONS}
          value={f.dropFactor}
          onChange={set('dropFactor')}
        />
      </Section>

      <Section title="Результаты">
        {!r.ok ? (
          <Note level={weightError || doseError ? 'danger' : 'info'} title="Нет данных для расчёта">
            {r.errors.join(' ')}
          </Note>
        ) : (
          <>
            <Card>
              <Text variant="bodyStrong" style={styles.cardTitle} accessibilityRole="header">
                Доза
              </Text>
              <Row
                label="Доза в минуту (основание)"
                value={`${fmt(r.dose.mcgMin)} мкг/мин`}
                styles={styles}
              />
              <Row
                label="Доза в час (основание)"
                value={`${fmt(r.dose.mgH)} мг/ч`}
                styles={styles}
              />
              <Row
                label="То же по тартрату"
                value={`${fmt(r.dose.doseTartrate)} мкг/кг/мин`}
                styles={styles}
              />
              <Row
                label="Предел дозы"
                value={`${echo(r.dose.doseMax)} мкг/кг/мин (${r.dose.isChild ? 'дети' : 'взрослые'})`}
                styles={styles}
                last
              />
            </Card>
            <Warnings items={r.dose.warnings} />

            {!s ? (
              <Note level="info" title="Шприцевой насос">
                Введите мг и объём шприца.
              </Note>
            ) : (
              <>
                {s.ok ? (
                  <ResultCard
                    title="Шприцевой насос, в/в"
                    value={fmt(s.mlph)}
                    unit="мл/ч"
                    announceText={spoken}
                    testID="norepi-syringe-result"
                  >
                    <Row
                      label="Концентрация (основание)"
                      value={`${fmt(s.conc)} мкг/мл`}
                      styles={styles}
                    />
                    <Row
                      label="Приготовление"
                      value={`${fmt(s.concMl)} мл конц. (${fmt(s.ampoules)} амп. по 4 мл) + ${fmt(s.diluentMl)} мл`}
                      styles={styles}
                    />
                    <Row
                      label="Шприца хватит на"
                      value={`${fmt(s.hoursPerSyringe, 1)} ч`}
                      styles={styles}
                      last
                    />
                  </ResultCard>
                ) : null}
                <Warnings items={s.warnings} />
              </>
            )}

            {!b ? (
              <Note level="info" title="Капельница">
                Введите мг и объём растворителя.
              </Note>
            ) : (
              <>
                <ResultCard
                  title={`Капельница, в/в (${b.F} кап/мл)`}
                  value={b.gttExact < 1 ? '< 1' : String(b.gtt)}
                  unit="кап/мин"
                  announceText={spoken}
                  announceEnabled={!syringeShown}
                  testID="norepi-bag-result"
                >
                  <Row label="Скорость" value={`${fmt(b.mlph)} мл/ч`} styles={styles} />
                  <Row
                    label="Концентрация (основание)"
                    value={`${fmt(b.conc)} мкг/мл`}
                    styles={styles}
                  />
                  <Row
                    label="Общий объём"
                    value={`${fmt(b.total, 1)} мл (${fmt(b.concMl)} мл конц., ${fmt(b.ampoules)} амп. по 4 мл)`}
                    styles={styles}
                    last
                  />
                </ResultCard>
                <Warnings items={b.warnings} />
              </>
            )}
          </>
        )}

        {/* Инструкция РФ «Норэпинефрин» (МЭЗ): титрование шагом 0,05–0,1 мкг/кг/мин тартрата, центральный венозный доступ */}
        <Text variant="caption" color="textSecondary" style={styles.footnote}>
          Формула: мл/ч = доза (мкг/кг/мин) × масса × 60 / концентрация (мкг/мл), всё по основанию.
          {'\n'}
          Титровать по АД шагом 0,05–0,1 мкг/кг/мин тартрата (0,025–0,05 основания). Предпочтительно
          шприцевой насос и центральная вена (инструкция РФ).{'\n'}
          Пример по инструкции: 2 мл концентрата + 48 мл 5% глюкозы = 40 мкг/мл основания.
        </Text>
      </Section>

      <Button
        title="Очистить дозу и разведение"
        variant="secondary"
        icon="refresh"
        onPress={clearFields}
        accessibilityHint="Масса пациента не меняется; её сбрасывает кнопка «Новый пациент»"
        fullWidth
      />
    </Screen>
  );
}

function Row({ label, value, styles, last }) {
  return (
    <View
      style={[styles.row, last ? null : styles.rowDivider]}
      accessible
      accessibilityLabel={a11yLabel(label, value)}
    >
      <Text variant="body" color="textSecondary" style={styles.rowLabel}>
        {label}
      </Text>
      <Text variant="bodyStrong" style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

function Warnings({ items }) {
  const notes = toNotes(items);
  if (!notes.length) return null;
  return notes.map((n) => (
    <Note key={n.text} level={n.level}>
      {n.text}
    </Note>
  ));
}

const makeStyles = ({ colors, spacing }) => ({
  intro: { marginBottom: spacing.lg },
  cardTitle: { marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowLabel: { flexGrow: 1, flexShrink: 1, flexBasis: 160, marginRight: spacing.md },
  rowValue: { flexShrink: 1, textAlign: 'right', marginLeft: 'auto' },
  footnote: { marginTop: spacing.sm },
});
