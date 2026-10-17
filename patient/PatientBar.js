// PatientBar.js — полоса пациента над содержимым экрана:
// «Пациент: 20 кг · 5 лет · муж.» (или «Пациент не указан»), «Изменить», «Новый пациент».
// «Изменить» открывает PatientEditor.
//
//   <Screen scroll><PatientBar />…</Screen>
import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../components/AppText';
import { announce, hideFromA11y } from '../components/a11y';
import { Button } from '../components/ui';
import PatientEditor from './PatientEditor';
import { usePatient } from './PatientContext';
import { formatAge } from './estimates';
import { useTheme, useThemedStyles } from '../theme/index';

const SEX_SHORT = { male: 'муж.', female: 'жен.' };
const SEX_FULL = { male: 'мужской пол', female: 'женский пол' };
const fmt = (n) => String(n).replace('.', ',');

// Текст сводки (экспортируется для тестов и для скопированного текста расчёта)
export function patientSummary(patient, derived) {
  const parts = [];
  if (patient.weightKg !== null) parts.push(`${fmt(patient.weightKg)} кг${derived.weightIsEstimate ? ' (оценка)' : ''}`);
  if (patient.ageMonths !== null) parts.push(formatAge(patient.ageMonths));
  if (patient.sex) parts.push(SEX_SHORT[patient.sex]);
  if (patient.heightCm !== null) parts.push(`${fmt(patient.heightCm)} см`);
  return parts.length ? `Пациент: ${parts.join(' · ')}` : 'Пациент не указан';
}

export default function PatientBar({ style }) {
  const { broselow } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { patient, derived, resetPatient } = usePatient();
  const [open, setOpen] = useState(false);

  const summary = patientSummary(patient, derived);
  const spoken = summary
    .replace(' кг', ' килограмм')
    .replace(' см', ' сантиметров')
    .replace(/муж\.|жен\./, SEX_FULL[patient.sex] || '')
    .replace(/ · /g, ', ');
  const zone = derived.zone;

  const onReset = () => {
    resetPatient();
    announce('Данные пациента очищены');
  };

  return (
    <View style={[styles.bar, style]}>
      <View style={styles.info} accessible accessibilityLabel={spoken + (zone ? `, зона Broselow ${zone.name}` : '')}>
        <Text variant="bodyStrong" style={styles.summary}>
          {summary}
        </Text>
        {zone ? (
          <View style={styles.zoneRow}>
            <View
              style={[styles.swatch, { backgroundColor: broselow[zone.key].bg, borderColor: broselow[zone.key].border }]}
              {...hideFromA11y}
            />
            <Text variant="caption" color="textSecondary">{`Зона Broselow: ${zone.name}`}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.actions}>
        <Button
          title={derived.hasData ? 'Изменить' : 'Указать'}
          variant="secondary"
          icon="create-outline"
          onPress={() => setOpen(true)}
          accessibilityLabel={derived.hasData ? 'Изменить данные пациента' : 'Указать данные пациента'}
          style={styles.action}
        />
        {derived.hasData ? (
          <Button
            title="Новый пациент"
            variant="ghost"
            icon="refresh"
            onPress={onReset}
            accessibilityHint="Очистить вес, возраст, пол и рост"
            style={styles.action}
          />
        ) : null}
      </View>
      <PatientEditor visible={open} onClose={() => setOpen(false)} />
    </View>
  );
}

const makeStyles = ({ colors, spacing, radius }) => ({
  bar: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  info: { marginBottom: spacing.sm },
  summary: { flexShrink: 1 },
  zoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  swatch: { width: 16, height: 16, borderRadius: 4, borderWidth: 1, marginRight: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs },
  action: { marginHorizontal: spacing.xs, marginTop: spacing.xs, flexGrow: 1 },
});
