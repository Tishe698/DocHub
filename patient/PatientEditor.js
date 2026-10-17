// PatientEditor.js — модальное окно данных пациента: вес, возраст (лет + мес,
// «новорождённый»), пол, рост, лента Broselow. Изменения сразу попадают в контекст.
//
//   <PatientEditor visible={open} onClose={() => setOpen(false)} />
import React from 'react';
import { Modal, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Screen from '../components/Screen';
import { Text } from '../components/AppText';
import { announce } from '../components/a11y';
import { Button, ChoiceChips, NumberField, Note, Section } from '../components/ui';
import BroselowPicker from './BroselowPicker';
import { usePatient, usePatientAge, usePatientNumber } from './PatientContext';
import { ageWeightMismatch, formatAge } from './estimates';
import { useThemedStyles } from '../theme/index';

const SEX_OPTIONS = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
];

const fmt = (n) => String(n).replace('.', ',');

export default function PatientEditor({ visible, onClose }) {
  return (
    <Modal
      visible={!!visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
      onRequestClose={onClose}
    >
      {/* Модальное окно — отдельное нативное окно: свой провайдер safe area */}
      <SafeAreaProvider>
        <EditorBody onClose={onClose} />
      </SafeAreaProvider>
    </Modal>
  );
}

function EditorBody({ onClose }) {
  const styles = useThemedStyles(makeStyles);
  const { patient, setPatient, resetPatient, derived } = usePatient();
  const weight = usePatientNumber('weightKg');
  const height = usePatientNumber('heightCm');
  const age = usePatientAge();

  const mismatch = ageWeightMismatch(patient.ageMonths, patient.weightKg);
  const weightBadge =
    patient.weightSource === 'broselow' ? 'оценка: Broselow' : patient.weightSource === 'age' ? 'оценка: по возрасту' : null;

  const applyAgeEstimate = () => {
    setPatient({ weightKg: derived.estimatedWeightKg, weightSource: 'age', broselowZone: null });
    announce(`Масса ${fmt(derived.estimatedWeightKg)} килограмма, оценка по возрасту`);
  };

  const onReset = () => {
    resetPatient();
    announce('Данные пациента очищены');
  };

  return (
    <Screen scroll noHeader>
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header" style={styles.headerTitle}>
          Пациент
        </Text>
        <Button title="Готово" variant="ghost" onPress={onClose} accessibilityHint="Закрыть окно" />
      </View>

      <Section title="Масса и возраст">
        <NumberField
          label="Вес"
          unit="кг"
          value={weight.text}
          onChangeText={weight.onChangeText}
          badge={weightBadge}
          badgeLevel="warning"
        />
        {derived.estimatedWeightKg !== null && patient.weightSource !== 'age' ? (
          <Button
            title={`Оценка по возрасту (APLS): ${fmt(derived.estimatedWeightKg)} кг`}
            variant="secondary"
            onPress={applyAgeEstimate}
            accessibilityHint="Подставить массу, рассчитанную по возрасту"
            style={styles.gap}
          />
        ) : null}

        <View style={styles.ageRow}>
          <NumberField
            label="Возраст"
            unit="лет"
            value={age.years.text}
            onChangeText={age.years.onChangeText}
            style={styles.ageField}
          />
          <NumberField
            label="Месяцы"
            unit="мес"
            value={age.months.text}
            onChangeText={age.months.onChangeText}
            style={styles.ageField}
          />
        </View>
        {patient.ageMonths !== null ? (
          <Text variant="caption" color="textSecondary" style={styles.gap}>
            {`Возраст: ${formatAge(patient.ageMonths)}`}
          </Text>
        ) : null}
        <Button
          title="Новорождённый (до 1 мес)"
          variant={derived.isNeonate ? 'primary' : 'secondary'}
          onPress={age.setNeonate}
          selected={!!derived.isNeonate}
          style={styles.gap}
        />

        {mismatch && mismatch.mismatch ? (
          <Note level="warning" title="Масса не соответствует возрасту">
            {`Для возраста ${formatAge(patient.ageMonths)} ожидается зона «${mismatch.expectedZone.name}» ` +
              `(${mismatch.expectedZone.weightMinKg}–${mismatch.expectedZone.weightMaxKg} кг). ` +
              'Проверьте вес и возраст.'}
          </Note>
        ) : null}
      </Section>

      <Section title="Пол и рост">
        <ChoiceChips
          label="Пол"
          options={SEX_OPTIONS}
          value={patient.sex}
          onChange={(sex) => setPatient({ sex })}
        />
        <NumberField label="Рост (длина тела)" unit="см" value={height.text} onChangeText={height.onChangeText} />
      </Section>

      <Section>
        <BroselowPicker />
      </Section>

      <Button title="Новый пациент" variant="danger" icon="trash-outline" onPress={onReset} fullWidth />
      <Button title="Готово" onPress={onClose} fullWidth style={styles.gapTop} />
    </Screen>
  );
}

const makeStyles = ({ spacing }) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerTitle: { flex: 1 },
  ageRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs },
  ageField: { flexGrow: 1, flexBasis: 140, marginHorizontal: spacing.xs },
  gap: { marginBottom: spacing.md },
  gapTop: { marginTop: spacing.md },
});
