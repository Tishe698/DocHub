// LaryngealTubeCalculation.js — подбор ларингеальной трубки VBM LT / LTS-D (интерфейс).
// Таблица и пределы — в CalculateTube.js (VBM LTS-D IFU G3082-06/04.2017, с. 11),
// связь с общим пациентом — laryngealFromPatient.js.
import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../../components/AppText';
import Screen from '../../components/Screen';
import { ChoiceChips, NumberField, Note, ResultCard, Section, Card } from '../../components/ui';
import PatientBar from '../../patient/PatientBar';
import { usePatient, usePatientNumber } from '../../patient/PatientContext';
import { useThemedStyles } from '../../theme/index';
import { isHeightRequired, LT_MAX_CUFF_PRESSURE_CMH2O } from './CalculateTube';
import {
  CATEGORY_OPTIONS,
  categoryFromAge,
  computeLaryngeal,
  fmtSize,
  laryngealAnnouncement,
} from './laryngealFromPatient';

const InfoRow = ({ label, value, styles }) => (
  <View style={styles.infoRow} accessible accessibilityLabel={`${label}: ${value}`}>
    <Text variant="body" color="textSecondary" style={styles.infoLabel}>
      {label}
    </Text>
    <Text variant="bodyStrong" style={styles.infoValue}>
      {value}
    </Text>
  </View>
);

// Формулировки — по VBM LTS-D IFU G3082-06/04.2017, с. 9–11.
const INFO = [
  'Таблица производителя VBM для ларингеальной трубки LT / LTS-D (инструкция 2017). К ларингеальной маске и i-gel не применять.',
  'Цвет — маркировка 15-мм коннектора производителя VBM; у других устройств те же цвета означают другие размеры.',
  'Дети: № 0 — масса меньше 5 кг, № 1 — 5–12 кг, № 2 — 12–25 кг; при массе больше 25 кг — по росту (№ 2,5 — 125–150 см).',
  'Взрослые: № 3 — рост меньше 155 см, № 4 — 155–180 см, № 5 — больше 180 см.',
  `Манжету раздуть рекомендуемым объёмом, затем снизить давление до минимального, при котором нет утечки; не выше ${LT_MAX_CUFF_PRESSURE_CMH2O} см вод. ст., контроль манометром. Перераздувание вызывает отёк языка.`,
  'Сверяйте с инструкцией к вашей партии трубок.',
];

const LaryngealTubeCalculation = () => {
  const styles = useThemedStyles(makeStyles);
  const { patient, derived, resetCount } = usePatient();
  const weight = usePatientNumber('weightKg');
  const height = usePatientNumber('heightCm');

  // Ручной выбор категории; при «Новый пациент» (resetCount) сбрасывается.
  const [picked, setPicked] = useState({ category: null, resetCount });
  const manualCategory = picked.resetCount === resetCount ? picked.category : null;
  const ageCategory = categoryFromAge(patient.ageMonths);
  const category = manualCategory || ageCategory;

  // Неверное число в поле — в расчёт не берём (в пациенте остаётся прежнее; аудит DocHub M1-20)
  const weightKg = weight.error ? null : weight.value;
  const heightCm = height.error ? null : height.value;
  const heightNeeded = category ? isHeightRequired(category, weightKg ?? undefined) : false;
  const { prompt, result } = category ? computeLaryngeal(category, weightKg, heightCm) : {};
  const hasSize = !!(result && result.tubeSize);

  return (
    <Screen scroll>
      <PatientBar />

      <Section
        title="Данные пациента"
        description="VBM LT / LTS-D: дети — по массе (при массе больше 25 кг — по росту), взрослые — по росту."
      >
        <ChoiceChips
          label="Категория пациента"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(c) => setPicked({ category: c, resetCount })}
        />
        {!manualCategory && ageCategory ? (
          <Text variant="caption" color="textSecondary" style={styles.caption}>
            Категория выбрана по возрасту пациента — при необходимости измените.
          </Text>
        ) : null}

        {category === 'child' ? (
          <NumberField
            label="Масса ребёнка"
            unit="кг"
            value={weight.text}
            onChangeText={weight.onChangeText}
            error={weight.error}
            placeholder="например, 18"
            badge={derived.weightIsEstimate ? 'оценка' : null}
            badgeLevel="warning"
          />
        ) : null}

        {category ? (
          <NumberField
            label={heightNeeded ? 'Рост' : 'Рост (не обязателен)'}
            unit="см"
            value={height.text}
            onChangeText={height.onChangeText}
            error={height.error}
            placeholder="например, 165"
            hint={
              category === 'child' && !heightNeeded
                ? 'При массе до 25 кг размер выбирается по массе'
                : 'Размер выбирается по росту'
            }
          />
        ) : null}
      </Section>

      <Section title="Результат">
        {!category ? (
          <Note level="info" title="Нет данных для расчёта">
            Выберите категорию пациента: ребёнок или взрослый (или укажите возраст в данных
            пациента).
          </Note>
        ) : null}

        {prompt ? (
          <Note level="info" title="Нужны данные">
            {prompt}
          </Note>
        ) : null}

        {result && hasSize ? (
          <ResultCard
            title="Размер ларингеальной трубки"
            value={`№ ${fmtSize(result.tubeSize)}`}
            level={result.warning ? 'warning' : 'info'}
            levelLabel={`Коннектор: ${result.tubeColor.toLowerCase()}`}
            announceText={laryngealAnnouncement(result)}
          >
            <InfoRow label="Объём манжеты (рекоменд.)" value={result.cuffVolume} styles={styles} />
            <InfoRow
              label="Макс. давление в манжете"
              value={result.maxCuffPressure}
              styles={styles}
            />
            <InfoRow
              label="Желудочный зонд через дренаж (LTS-D)"
              value={`до ${result.drainFr}`}
              styles={styles}
            />
            <InfoRow label="Группа по таблице" value={result.group} styles={styles} />
            <Text variant="caption" color="textSecondary" style={styles.basis}>
              {`Основание: ${result.basis}`}
            </Text>
          </ResultCard>
        ) : null}

        {result && !hasSize ? (
          <ResultCard
            title="Размер не определён"
            level="warning"
            levelLabel="вне таблицы производителя"
            announceText={laryngealAnnouncement(result)}
          >
            <Text variant="body">{result.warning}</Text>
            {result.options && result.options.length ? (
              <Text variant="bodyStrong" style={styles.basis}>
                {`Рассмотрите: ${result.options.map((o) => `№ ${fmtSize(o)}`).join(' или ')}`}
              </Text>
            ) : null}
          </ResultCard>
        ) : null}

        {result && hasSize && result.warning ? (
          <Note level="warning" title="Проверьте">
            {result.warning}
          </Note>
        ) : null}
      </Section>

      <Section title="Важная информация">
        <Card>
          {INFO.map((t, i) => (
            <Text key={i} variant="caption" color="textSecondary" style={styles.para}>
              {`• ${t}`}
            </Text>
          ))}
        </Card>
      </Section>
    </Screen>
  );
};

const makeStyles = ({ spacing }) => ({
  caption: { marginTop: -spacing.sm, marginBottom: spacing.md },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  infoLabel: { flexShrink: 1, marginRight: spacing.sm },
  infoValue: { flexShrink: 1, textAlign: 'right' },
  basis: { marginTop: spacing.sm },
  para: { marginBottom: spacing.xs },
});

export default LaryngealTubeCalculation;
