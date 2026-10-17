// IntubationTubeCalculation.js — подбор эндотрахеальной трубки (интерфейс).
// Расчёт — CalculateIntubationTube.js (клинические значения и источники там),
// связь с общим пациентом — intubationFromPatient.js.
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '../../components/AppText';
import Screen from '../../components/Screen';
import { a11yLabel } from '../../components/a11y';
import { Button, ChoiceChips, NumberField, Note, ResultCard, Section, SwitchRow, Card } from '../../components/ui';
import PatientBar from '../../patient/PatientBar';
import BroselowPicker from '../../patient/BroselowPicker';
import { usePatient, usePatientAge, usePatientNumber } from '../../patient/PatientContext';
import { zoneByKey as patientZoneByKey } from '../../patient/estimates';
import { useThemedStyles } from '../../theme/index';
import { GREY_SUBZONES } from './CalculateIntubationTube';
import {
  METHOD_LABELS,
  ROUTE_OPTIONS,
  computeIntubation,
  depthRows,
  fmtCm,
  fmtMm,
  intubationAnnouncement,
} from './intubationFromPatient';

const SEX_OPTIONS = [
  { value: 'female', label: 'Женский', accessibilityLabel: 'Пол женский' },
  { value: 'male', label: 'Мужской', accessibilityLabel: 'Пол мужской' },
];

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

// Локальные настройки экрана (манжета, путь, подзона серой зоны) сбрасываются при «Новый пациент»:
// храним вместе с resetCount и считаем устаревшими, если счётчик изменился.
const LOCAL_DEFAULTS = { cuffed: false, route: 'both', greySubzone: null };

const IntubationTubeCalculation = () => {
  const styles = useThemedStyles(makeStyles);
  const { patient, setPatient, derived, resetCount } = usePatient();
  const height = usePatientNumber('heightCm');
  const weight = usePatientNumber('weightKg');
  const age = usePatientAge();

  const [local, setLocal] = useState({ ...LOCAL_DEFAULTS, resetCount });
  const opts = local.resetCount === resetCount ? local : { ...LOCAL_DEFAULTS, resetCount };
  const update = (patch) => setLocal({ ...opts, ...patch, resetCount });
  // Подзона серой зоны действует только пока выбрана серая зона (по ленте): при смене зоны
  // или вводе массы она сбрасывается и при повторном выборе серой зоны выбирается заново.
  const greyPicked = patient.broselowZone === 'grey' && patient.weightSource === 'broselow';
  useEffect(() => {
    if (!greyPicked && local.greySubzone) setLocal((l) => ({ ...l, greySubzone: null }));
  }, [greyPicked, local.greySubzone]);
  const greySubzone = greyPicked ? opts.greySubzone : null;

  const { mode, result, error, needsGreySubzone } = computeIntubation(patient, {
    cuffed: opts.cuffed,
    route: opts.route,
    greySubzone: greySubzone || undefined,
  });

  const pickedZone = patient.weightSource === 'broselow' ? patientZoneByKey(patient.broselowZone) : null;
  const isNeonate = patient.ageMonths === 0;
  const depths = depthRows(result, opts.route);

  return (
    <Screen scroll>
      <PatientBar />

      <Section
        title="Данные пациента"
        description="Общие для всех калькуляторов. Главный признак — рост (длина тела) по ленте Broselow 46,8–143,3 см; без роста — зона ленты, возраст или масса."
      >
        <NumberField
          label="Рост (длина тела)"
          unit="см"
          value={height.text}
          onChangeText={height.onChangeText}
          placeholder="например, 92"
          hint="Приоритетно для детей: лента Broselow 46,8–143,3 см"
        />
        <View style={styles.ageRow}>
          <NumberField
            label="Возраст"
            unit="лет"
            value={age.years.text}
            onChangeText={age.years.onChangeText}
            placeholder="0"
            style={styles.ageField}
          />
          <NumberField
            label="Месяцы"
            unit="мес"
            value={age.months.text}
            onChangeText={age.months.onChangeText}
            placeholder="0"
            style={styles.ageField}
          />
        </View>
        <Button
          title="Новорождённый (до 1 мес)"
          variant="secondary"
          icon={isNeonate ? 'checkmark-circle' : 'happy-outline'}
          onPress={age.setNeonate}
          selected={isNeonate}
          accessibilityHint="Ставит возраст 0 лет 0 месяцев"
          style={styles.neonateButton}
        />
        <NumberField
          label="Масса"
          unit="кг"
          value={weight.text}
          onChangeText={weight.onChangeText}
          placeholder="например, 3,2"
          badge={derived.weightIsEstimate ? 'оценка' : null}
          badgeLevel="warning"
          hint="Новорождённым — обязательно; детям с известным ростом или возрастом — для сверки"
        />
        <ChoiceChips
          label="Пол"
          options={SEX_OPTIONS}
          value={patient.sex}
          onChange={(sex) => setPatient({ sex })}
          hint="Нужен с 13 лет и при росте больше 143 см"
        />
      </Section>

      <Section
        title="Зона ленты Broselow"
        description={
          mode === 'height'
            ? 'Рост указан — трубка подбирается по росту; выбор зоны нужен, только если рост не измерен.'
            : 'Если рост не измерен: приложите ленту и выберите зону — размер трубки берётся прямо по зоне.'
        }
      >
        <BroselowPicker />
        {greyPicked ? (
          <ChoiceChips
            label="Подзона серой зоны (масса на ленте)"
            options={GREY_SUBZONES.map((s) => ({ ...s, accessibilityLabel: `Серая зона, ${s.label}` }))}
            value={greySubzone}
            onChange={(v) => update({ greySubzone: v })}
            hint="От подзоны зависят глубина и возможность трубки с манжетой"
          />
        ) : null}
      </Section>

      <Section title="Трубка">
        <SwitchRow
          label="Трубка с манжетой"
          description={opts.cuffed ? 'Размер для трубки с манжетой' : 'Размер для трубки без манжеты'}
          value={opts.cuffed}
          onValueChange={(v) => update({ cuffed: v })}
        />
        <ChoiceChips
          label="Путь интубации"
          options={ROUTE_OPTIONS}
          value={opts.route}
          onChange={(v) => update({ route: v })}
          style={styles.routeChips}
        />
      </Section>

      <Section title="Результат">
        {mode === 'empty' ? (
          <Note level="info" title="Нет данных для расчёта">
            Укажите рост (длину тела), выберите зону ленты Broselow, либо укажите возраст или массу.
          </Note>
        ) : null}

        {needsGreySubzone ? (
          <Note level="info" title="Выберите подзону серой зоны">
            Серая зона ленты разделена на 3, 4 и 5 кг. Диаметр во всех подзонах — 3,5 мм без манжеты;
            глубина (8,5 / 9 / 10,5 см) и возможность трубки с манжетой зависят от подзоны.
          </Note>
        ) : null}

        {error && !needsGreySubzone ? (
          <Note level="warning" title="Расчёт невозможен">
            {`${error}\n\nПорядок: новорождённый с массой → по массе; рост 46,8–143,3 см или зона ленты → Broselow; 1–12 лет → по возрасту; до 1 года → по массе или возрасту; 13–15 лет и рост больше 143 см без возраста → по возрасту и росту, не больше взрослых (нужен пол); с 16 лет → взрослые размеры по полу.`}
          </Note>
        ) : null}

        {result ? (
          <>
            <ResultCard
              title="Внутренний диаметр трубки"
              value={fmtMm(result.tubeIDmm)}
              unit="мм"
              level={result.warnings && result.warnings.length ? 'warning' : 'info'}
              levelLabel={result.tubeType}
              announceText={intubationAnnouncement(result, opts.route)}
            >
              {depths.map((d) => (
                <InfoRow key={d.key} label={d.label} value={`${fmtCm(d.value)} см`} styles={styles} />
              ))}
              <InfoRow
                label="Альтернативы"
                value={`${result.alternativesMm.map(fmtMm).join(' / ')} мм`}
                styles={styles}
              />
              <InfoRow label="Метод" value={METHOD_LABELS[result.method] || result.method} styles={styles} />
              {result.method === 'broselowZone' && pickedZone ? (
                <InfoRow
                  label="Зона ленты"
                  value={a11yLabel(
                    pickedZone.name,
                    greySubzone ? GREY_SUBZONES.find((s) => s.value === greySubzone)?.label : null,
                    `${fmtCm(pickedZone.lengthMinCm)}–${fmtCm(pickedZone.lengthMaxCm)} см`
                  )}
                  styles={styles}
                />
              ) : result.broselowZone ? (
                <InfoRow label="Зона Broselow" value={`${result.broselowZone}, ${result.zoneRange}`} styles={styles} />
              ) : null}
              {result.approxWeightKg ? (
                <InfoRow label="Масса зоны" value={`${result.approxWeightKg} кг`} styles={styles} />
              ) : null}
            </ResultCard>

            {result.warnings && result.warnings.length ? (
              <Note level="warning" title="Проверьте">
                {result.warnings.map((w) => `• ${w}`).join('\n')}
              </Note>
            ) : null}

            <Card>
              {result.used && result.used.length ? (
                <Text variant="caption" color="textSecondary" style={styles.para}>
                  {`Учтено: ${result.used.join(', ')}`}
                </Text>
              ) : null}
              {result.ignored && result.ignored.length ? (
                <Text variant="caption" color="textSecondary" style={styles.para}>
                  {`Не использовано: ${result.ignored.join('; ')}`}
                </Text>
              ) : null}
              {(result.notes || []).map((n, i) => (
                <Text key={i} variant="caption" style={styles.para}>
                  {`• ${n}`}
                </Text>
              ))}
            </Card>
          </>
        ) : null}
      </Section>
    </Screen>
  );
};

const makeStyles = ({ spacing }) => ({
  ageRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs },
  ageField: { flexGrow: 1, flexBasis: 140, marginHorizontal: spacing.xs },
  neonateButton: { alignSelf: 'flex-start', marginBottom: spacing.md },
  routeChips: { marginTop: spacing.sm },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  infoLabel: { flexShrink: 1, marginRight: spacing.sm },
  infoValue: { flexShrink: 1, textAlign: 'right' },
  para: { marginBottom: spacing.xs },
});

export default IntubationTubeCalculation;
