// pediatric_norms_screen.js — возрастные нормы у детей.
// Строка таблицы выбирается по возрасту общего пациента (PatientBar), её можно сменить вручную.
// Данные и правила выбора — fiz_norm/normsData.js (с тестами).
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Screen from '../components/Screen';
import { Text } from '../components/AppText';
import { announce } from '../components/a11y';
import { Button, Card, ChoiceChips, Note, Section } from '../components/ui';
import PatientBar from '../patient/PatientBar';
import { usePatient } from '../patient/PatientContext';
import { formatAge } from '../patient/estimates';
import { useThemedStyles } from '../theme/index';
import {
  NORMS,
  ageBadge,
  ageMatchNote,
  ageSpoken,
  hypotensionSbp,
  normByMonths,
  normForAge,
  normMetrics,
} from './normsData';

const AGE_OPTIONS = NORMS.map((n) => ({
  value: n.months,
  label: n.label,
  accessibilityLabel: ageSpoken(n.months),
}));

function Metric({ label, value, range, spoken }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.metric} accessible accessibilityLabel={spoken}>
      <Text variant="body" color="textSecondary" style={styles.metricLabel}>
        {label}
      </Text>
      <View style={styles.metricRight}>
        <Text variant="bodyStrong" style={styles.metricValue}>
          {value}
        </Text>
        {range ? (
          <Text variant="caption" color="textSecondary" style={styles.metricRange}>
            {range}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function PediatricNormsScreen() {
  const styles = useThemedStyles(makeStyles);
  const { patient, resetCount } = usePatient();
  const ageMonths = patient.ageMonths;
  const autoNorm = normForAge(ageMonths);

  // Ручной выбор действует, пока не изменился возраст пациента и не нажат «Новый пациент»:
  // при новом возрасте строка снова подбирается автоматически.
  const [manual, setManual] = useState(null); // { months, forAge, resetCount }
  const manualActive = manual && manual.forAge === ageMonths && manual.resetCount === resetCount;
  const selectedMonths = manualActive ? manual.months : autoNorm ? autoNorm.months : null;
  const selectedNorm = selectedMonths === null ? null : normByMonths(selectedMonths);
  const isAuto = !!autoNorm && selectedMonths === autoNorm.months;

  const onSelect = (months) => setManual({ months, forAge: ageMonths, resetCount });
  const backToPatient = () => setManual(null);

  // Озвучиваем смену показанной строки (ручной выбор или новый возраст пациента), но не первый показ.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (selectedMonths !== null) announce(`Показаны нормы: ${ageSpoken(selectedMonths)}`);
  }, [selectedMonths]);

  const matchNote = ageMatchNote(ageMonths);
  const patientAgeText = ageMonths === null ? '' : formatAge(ageMonths);
  const patientSbp =
    ageMonths === null || ageMonths >= 216 ? null : hypotensionSbp(Math.floor(ageMonths));
  const rowSbp = selectedNorm ? hypotensionSbp(selectedNorm.months) : null;

  return (
    <Screen scroll>
      <PatientBar />

      <Section
        title="Возраст"
        description={
          autoNorm
            ? `Строка выбрана по возрасту пациента (${patientAgeText}). Можно выбрать другую.`
            : 'Укажите возраст пациента или выберите строку таблицы.'
        }
      >
        <ChoiceChips
          label="Строка таблицы"
          options={AGE_OPTIONS}
          value={selectedMonths}
          onChange={onSelect}
        />
        {autoNorm && !isAuto ? (
          <Button
            title={`По возрасту пациента: ${autoNorm.label}`}
            variant="secondary"
            icon="person-outline"
            onPress={backToPatient}
            accessibilityLabel={`Вернуть строку по возрасту пациента: ${ageSpoken(autoNorm.months)}`}
            style={styles.backBtn}
          />
        ) : null}
        {matchNote ? <Note level="info">{matchNote}</Note> : null}
      </Section>

      {selectedNorm ? (
        <Card>
          <View style={styles.resultHeader}>
            <Text variant="title" accessibilityRole="header" style={styles.resultTitle}>
              {selectedNorm.label}
            </Text>
            <Text variant="caption" color="textSecondary" style={styles.resultSub}>
              {[
                selectedNorm.months === 0 ? ageBadge(0) : null,
                isAuto ? 'по возрасту пациента' : autoNorm ? 'выбрано вручную' : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>

          {normMetrics(selectedNorm).map((m) => (
            <Metric key={m.key} label={m.label} value={m.value} range={m.range} spoken={m.spoken} />
          ))}

          <Note level="danger" title="Гипотензия" style={styles.hypo}>
            <Text
              variant="body"
              accessibilityLabel={`систолическое давление ниже ${rowSbp} миллиметров ртутного столба`}
            >
              {`САД < ${rowSbp} мм рт. ст.`}
            </Text>
            {patientSbp !== null && patientSbp !== rowSbp && isAuto ? (
              <Text
                variant="body"
                style={styles.hypoPatient}
                accessibilityLabel={`Для возраста пациента, ${patientAgeText}: систолическое ниже ${patientSbp}`}
              >
                {`Для возраста пациента (${patientAgeText}): САД < ${patientSbp}`}
              </Text>
            ) : null}
          </Note>

          <Text variant="caption" color="textSecondary" style={styles.disclaimer}>
            Основное значение — среднее для обоих полов (Мазурин А.В., Воронцов И.М.; масса —
            медианы ВОЗ/CDC). В калькуляторах масса по возрасту оценивается по APLS и для 6–12 лет
            может быть выше табличной. «Норма» — границы по PALS (AHA) 2015/2020; где источники
            расходятся, взята более узкая граница. Гипотензия — по PALS (1–10 лет: 70 + 2 × возраст
            в годах). Значения ориентировочные и не заменяют клиническую оценку врача.
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const makeStyles = ({ colors, spacing, radius }) => ({
  backBtn: { alignSelf: 'flex-start', marginBottom: spacing.md },
  resultHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  resultTitle: { marginRight: spacing.sm, flexShrink: 1 },
  resultSub: { flexShrink: 1 },
  metric: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  metricLabel: { flexShrink: 1, marginRight: spacing.md },
  metricRight: { flexShrink: 1, flexGrow: 1, alignItems: 'flex-end' },
  metricValue: { textAlign: 'right' },
  metricRange: { textAlign: 'right', marginTop: 2 },
  hypo: { marginTop: spacing.sm },
  hypoPatient: { marginTop: spacing.xs },
  disclaimer: { fontStyle: 'italic' },
});
