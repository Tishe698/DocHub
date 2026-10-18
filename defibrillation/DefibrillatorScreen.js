// DefibrillatorScreen.js — раздел «Дефибриллятор»: что на мониторе → нужен ли разряд и какой
// (дефибрилляция или синхронизированная кардиоверсия) → энергия на ступени выбранного аппарата →
// электроды, действия по шагам, безопасность. Расчёт — defibLogic.js, аппараты — devices.js.
// Масса и возраст — из общего пациента.
import React, { useState } from 'react';
import { View } from 'react-native';
import Screen from '../components/Screen';
import { Text } from '../components/AppText';
import { hideFromA11y } from '../components/a11y';
import {
  Card,
  ChoiceChips,
  HelpButton,
  Note,
  NumberField,
  ResultCard,
  Section,
} from '../components/ui';
import PatientBar from '../patient/PatientBar';
import { usePatient, usePatientNumber } from '../patient/PatientContext';
import parseNum from '../utils/parseNum';
import { useThemedStyles } from '../theme/index';
import { DEVICES, deviceByKey } from './devices';
import {
  CHILD_WEIGHT_MAX,
  CHILD_WEIGHT_MIN,
  SCENARIOS,
  SPECIAL,
  joules,
  safetyFor,
  scenarioByKey,
  shockPlan,
  stepsFor,
} from './defibLogic';

const ADULT_AGE_MONTHS = 18 * 12;
// Без возраста: масса меньше 40 кг — скорее ребёнок (не дать взрослую энергию младенцу)
const CHILD_WEIGHT_GUESS_KG = 40;

const SCENARIO_OPTIONS = SCENARIOS.map((s) => ({
  value: s.key,
  label: s.label,
  accessibilityLabel: s.spoken,
}));
// Озвучиваемая подпись начинается с видимой (голосовое управление), дальше — как произносить
const DEVICE_OPTIONS = DEVICES.map((d) => ({
  value: d.key,
  label: d.short,
  accessibilityLabel: d.spoken ? `${d.short}, ${d.spoken}` : d.short,
}));
const GROUP_OPTIONS = [
  { value: 'adult', label: 'Взрослый' },
  { value: 'child', label: 'Ребёнок' },
];

// Уровень и подпись итога: смысл всегда словами, не только цветом
const MODE_BADGE = {
  defib: { level: 'danger', label: 'Дефибрилляция — без синхронизации' },
  sync: { level: 'warning', label: 'Кардиоверсия — включить синхронизацию (SYNC)' },
  none: { level: 'neutral', label: 'Разряд не показан' },
  pace: { level: 'neutral', label: 'Разряд не показан — кардиостимуляция' },
  aed: { level: 'info', label: 'Автоматический режим' },
  nosync: { level: 'danger', label: 'Нужен другой аппарат' },
};

const LEGEND = [
  'ФЖ — фибрилляция желудочков; ЖТ — желудочковая тахикардия; ФП — фибрилляция предсердий; ТП — трепетание предсердий; НЖТ — наджелудочковая тахикардия; ЭАБП — электрическая активность без пульса.',
  'Нестабильная тахикардия — есть хотя бы один признак: шок (систолическое давление ниже 90 и плохая перфузия), обморок, ишемия миокарда (боль в груди, изменения ЭКГ), острая сердечная недостаточность (отёк лёгких).',
  'У детей нестабильность — декомпенсация кровообращения: гипотензия по возрасту (систолическое ниже 70 + 2 × возраст в годах), нарушение сознания, признаки шока.',
  'Стабильная тахикардия — разряд не экстренный: узкие регулярные QRS — вагусные пробы и аденозин; ФП — контроль ритма или частоты по протоколу; стабильная мономорфная ЖТ — плановая кардиоверсия под седацией или антиаритмик (КР «Желудочковые нарушения ритма» 2025).',
];

const DEVICE_HELP = [
  'Модель написана на передней панели аппарата.',
  'На скорой в Москве по закупкам станции им. Пучкова встречаются LIFEPAK 15, ZOLL (R Series, AED Plus), Аксион ДКИ-Н-10; в больницах — Philips, Mindray, corpuls3.',
  'Модели нет в списке — выберите «Другой бифазный»: покажем расчётную энергию, на аппарате выберите ближайшую ступень.',
  'Почти все современные аппараты бифазные. Монофазный — старый аппарат: при ФЖ у взрослого всегда 360 Дж.',
];

const SYNC_HELP = [
  'В режиме синхронизации (SYNC) аппарат наносит разряд точно на зубец R. Разряд в «уязвимую» фазу (на зубец T) может вызвать фибрилляцию желудочков.',
  'Синхронизация нужна только при тахикардии с пульсом. При ФЖ её не включают: зубцов R нет, и разряд не произойдёт.',
  'Кнопку разряда нажать и держать, пока аппарат не разрядится на ближайшем комплексе QRS.',
];

function Bullets({ items, styles, numbered = false }) {
  return items.map((t, i) => (
    <View key={t} style={styles.bulletRow}>
      <Text variant="body" color="textSecondary" style={styles.bullet} {...hideFromA11y}>
        {numbered ? `${i + 1}.` : '•'}
      </Text>
      <Text variant="body" style={styles.bulletText}>
        {t}
      </Text>
    </View>
  ));
}

function HelpTexts({ items, styles }) {
  return items.map((t) => (
    <Text key={t} variant="body" style={styles.helpText}>
      {t}
    </Text>
  ));
}

export default function DefibrillatorScreen() {
  const styles = useThemedStyles(makeStyles);
  const { patient, derived, resetCount } = usePatient();
  const weight = usePatientNumber('weightKg');

  const [scenario, setScenario] = useState('vf');
  const [deviceKey, setDeviceKey] = useState('lifepak15');

  // Взрослый или ребёнок — по возрасту пациента (до 18 лет — ребёнок; без возраста: масса по Broselow —
  // ребёнок); можно переключить вручную до следующей смены возраста или «Новый пациент»
  const autoGroup =
    typeof patient.ageMonths === 'number'
      ? patient.ageMonths < ADULT_AGE_MONTHS
        ? 'child'
        : 'adult'
      : patient.weightSource === 'broselow' ||
          (patient.weightKg > 0 && patient.weightKg < CHILD_WEIGHT_GUESS_KG)
        ? 'child'
        : 'adult';
  const groupKey = `${patient.ageMonths}|${resetCount}`;
  const [groupEdit, setGroupEdit] = useState(null);
  const group = groupEdit && groupEdit.key === groupKey ? groupEdit.value : autoGroup;

  const device = deviceByKey(deviceKey);
  const sc = scenarioByKey(scenario);
  // Масса — из текста поля: некорректный ввод не попадает в контекст, но и не должен считаться старым числом
  const weightNum = parseNum(weight.text);
  const weightBlank = !String(weight.text ?? '').trim();
  const weightError =
    group === 'child' &&
    !weightBlank &&
    (weightNum === undefined || weightNum < CHILD_WEIGHT_MIN || weightNum > CHILD_WEIGHT_MAX)
      ? `Масса: от ${String(CHILD_WEIGHT_MIN).replace('.', ',')} до ${CHILD_WEIGHT_MAX} кг`
      : null;
  const plan = shockPlan({
    scenario,
    device,
    group,
    weightKg: weightError ? NaN : weightNum,
  });
  const badge = plan ? MODE_BADGE[plan.mode] : null;
  const steps = stepsFor(scenario, {
    aed: !!(device && device.aedOnly),
    child: group === 'child',
    smallChild: !!(plan && plan.smallChild),
    paddles: !!(device && device.paddles),
  });
  const resultTitle =
    plan && (plan.mode === 'defib' || plan.mode === 'sync')
      ? 'Энергия первого разряда'
      : plan && plan.mode === 'aed'
        ? 'Энергия'
        : plan && plan.mode === 'nosync'
          ? 'Кардиоверсия'
          : 'Разряд';

  return (
    <Screen scroll>
      <PatientBar />
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header">
          Дефибриллятор
        </Text>
        <Text variant="body" color="textSecondary" style={styles.subtitle}>
          Когда наносить разряд, какую энергию выбрать и как провести безопасно
        </Text>
      </View>

      <Section
        title="1. Что на мониторе?"
        description="Кардиоверсия — только при нестабильной тахикардии с пульсом (признаки — кнопка «?»)"
        right={
          <HelpButton
            title="Ритмы и нестабильность"
            accessibilityLabel="Расшифровка ритмов и признаки нестабильности"
            testID="defib-help-rhythm"
          >
            <HelpTexts items={LEGEND} styles={styles} />
          </HelpButton>
        }
      >
        <ChoiceChips
          label="Ритм и пульс"
          options={SCENARIO_OPTIONS}
          value={scenario}
          onChange={setScenario}
          testID="defib-scenario"
        />
      </Section>

      {sc && sc.mode !== 'none' ? (
        <>
          <Section title="2. Пациент">
            <ChoiceChips
              label="Возрастная группа"
              options={GROUP_OPTIONS}
              value={group}
              onChange={(value) => setGroupEdit({ key: groupKey, value })}
              testID="defib-group"
            />
            {group === 'child' ? (
              <NumberField
                label="Масса ребёнка"
                unit="кг"
                value={weight.text}
                onChangeText={weight.onChangeText}
                badge={derived.weightIsEstimate ? 'оценка' : null}
                error={weightError}
                hint="Энергия у детей считается на килограмм; массу можно оценить по ленте Broselow"
                testID="defib-weight"
              />
            ) : null}
          </Section>

          <Section
            title="3. Аппарат"
            right={
              <HelpButton
                title="Какой у меня аппарат"
                accessibilityLabel="Как узнать модель аппарата"
                testID="defib-help-device"
              >
                <HelpTexts items={DEVICE_HELP} styles={styles} />
              </HelpButton>
            }
          >
            <ChoiceChips
              label="Модель"
              options={DEVICE_OPTIONS}
              value={deviceKey}
              onChange={setDeviceKey}
              testID="defib-device"
            />
          </Section>
        </>
      ) : null}

      {plan ? (
        <ResultCard
          title={resultTitle}
          value={plan.first ? String(plan.first) : undefined}
          unit={plan.first ? 'Дж' : undefined}
          valueAccessibilityLabel={plan.first ? `${plan.first} ${joules(plan.first)}` : undefined}
          level={badge ? badge.level : undefined}
          levelLabel={badge ? badge.label : undefined}
          announceText={plan.spoken}
          testID="defib-result"
        >
          {!plan.first ? (
            <Text variant="heading" style={styles.resultLine} testID="defib-first-text">
              {plan.firstText}
            </Text>
          ) : null}
          {plan.nextText ? (
            <Text variant="bodyStrong" style={styles.resultLine} testID="defib-next">
              {plan.nextText}
            </Text>
          ) : null}
          {plan.calcText ? (
            <Text variant="caption" color="textSecondary" style={styles.resultLine}>
              {plan.calcText}
            </Text>
          ) : null}
          {plan.mode === 'sync' ? (
            <View style={styles.syncRow}>
              {/* Подпись видна глазами; диктор читает её у кнопки «?» — без повтора */}
              <Text
                variant="caption"
                color="textSecondary"
                style={styles.syncText}
                {...hideFromA11y}
              >
                Что такое синхронизация
              </Text>
              <HelpButton
                title="Синхронизация (SYNC)"
                accessibilityLabel="Что такое синхронизация"
                testID="defib-help-sync"
              >
                <HelpTexts items={SYNC_HELP} styles={styles} />
              </HelpButton>
            </View>
          ) : null}
          {plan.notes.map((n) => (
            <Note key={n} level="info" style={styles.note}>
              {n}
            </Note>
          ))}
        </ResultCard>
      ) : null}

      {plan && plan.pads ? (
        <Card style={styles.card}>
          <Text variant="heading" accessibilityRole="header" style={styles.cardTitle}>
            Электроды
          </Text>
          <Text variant="body">{plan.pads}</Text>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <Text variant="heading" accessibilityRole="header" style={styles.cardTitle}>
          Что делать по шагам
        </Text>
        <Bullets items={steps} styles={styles} numbered />
      </Card>

      {plan && ['defib', 'sync', 'aed'].includes(plan.mode) ? (
        <>
          <Card style={styles.card}>
            <Text variant="heading" accessibilityRole="header" style={styles.cardTitle}>
              Безопасность
            </Text>
            <Bullets items={safetyFor(plan ? plan.mode : 'defib')} styles={styles} />
          </Card>
          <Card style={styles.card}>
            <Text variant="heading" accessibilityRole="header" style={styles.cardTitle}>
              Особые случаи
            </Text>
            <Bullets items={SPECIAL} styles={styles} />
          </Card>
        </>
      ) : null}

      <Text variant="caption" color="textSecondary" style={styles.disclaimer}>
        Источники: КР МЗ РФ «Остановка сердца (взрослые)» 2025, «Фибрилляция и трепетание
        предсердий» 2025, «Наджелудочковые тахикардии» 2025, «Суправентрикулярные тахикардии у
        детей» 2025; рекомендации ERC 2025 (взрослые, дети, особые ситуации); руководства
        производителей аппаратов. Энергию и режимы сверяйте с инструкцией своего аппарата.
      </Text>
    </Screen>
  );
}

const makeStyles = ({ spacing }) => ({
  header: { marginBottom: spacing.lg },
  subtitle: { marginTop: spacing.xs },
  resultLine: { marginTop: spacing.xs },
  syncRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  syncText: { flexShrink: 1 },
  note: { marginTop: spacing.sm, marginBottom: 0 },
  card: { marginBottom: spacing.md },
  cardTitle: { marginBottom: spacing.sm },
  bulletRow: { flexDirection: 'row', marginTop: spacing.xs },
  bullet: { width: 24 },
  bulletText: { flex: 1 },
  helpText: { marginBottom: spacing.sm },
  disclaimer: { marginTop: spacing.lg, textAlign: 'center' },
});
