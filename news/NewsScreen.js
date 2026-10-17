// NewsScreen.js — шкала NEWS2 (Royal College of Physicians, 2017), см. ARCH_SPEC §9.
// Расчёт — в news/newsScore.js (чистые функции, тесты в news/__tests__).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Screen from '../components/Screen';
import { Text } from '../components/AppText';
import { announce } from '../components/a11y';
import {
  Badge,
  Button,
  ChoiceChips,
  Note,
  NumberField,
  ResultCard,
  Section,
} from '../components/ui';
import { usePatient } from '../patient/PatientContext';
import { useThemedStyles } from '../theme/index';
import parseNum from '../utils/parseNum';
import {
  ACVPU_OPTIONS,
  PARAM_LABELS,
  ageWarning,
  computeNews2,
  pointsWord,
  summaryText,
} from './newsScore';

const SCALE_OPTIONS = [
  { value: 1, label: 'Шкала 1', accessibilityLabel: 'Шкала 1, стандартная' },
  {
    value: 2,
    label: 'Шкала 2',
    accessibilityLabel:
      'Шкала 2, гиперкапническая дыхательная недостаточность, целевая SpO₂ 88–92 %',
  },
];

const OXYGEN_OPTIONS = [
  { value: 'air', label: 'Воздух' },
  { value: 'oxygen', label: 'Кислород', accessibilityLabel: 'Кислород, любая подача' },
];

const CONSCIOUSNESS_OPTIONS = ACVPU_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
  accessibilityLabel: `${o.label.replace(' — ', ', ')}. ${o.description}`,
}));

// Уровень бейджа по баллам параметра: цвет дублируется текстом «N баллов»
const pointsLevel = (p) =>
  p === 3 ? 'danger' : p === 2 ? 'warning' : p === 1 ? 'info' : 'success';
const pointsText = (p) => (p === null || p === undefined ? null : `${p} ${pointsWord(p)}`);

const EMPTY_FIELDS = { respRate: '', spo2: '', sbp: '', heartRate: '', temperature: '' };

function PointsBadge({ label, points, style }) {
  if (points === null || points === undefined) return null;
  const text = pointsText(points);
  return (
    <Badge
      level={pointsLevel(points)}
      label={text}
      accessibilityLabel={`${label}: ${text}`}
      style={style}
    />
  );
}

export default function NewsScreen() {
  const styles = useThemedStyles(makeStyles);
  const { patient, resetCount } = usePatient();

  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [scale, setScale] = useState(1);
  const [oxygen, setOxygen] = useState(null);
  const [consciousness, setConsciousness] = useState(null);

  const clearAll = useCallback(() => {
    setFields(EMPTY_FIELDS);
    setScale(1);
    setOxygen(null);
    setConsciousness(null);
  }, []);

  // «Новый пациент» в общей полосе пациента — очищаем и эту форму
  const lastReset = useRef(resetCount);
  useEffect(() => {
    if (resetCount !== lastReset.current) {
      lastReset.current = resetCount;
      clearAll();
    }
  }, [resetCount, clearAll]);

  const setField = useCallback((key) => (text) => setFields((f) => ({ ...f, [key]: text })), []);
  const handlers = useMemo(
    () => ({
      respRate: setField('respRate'),
      spo2: setField('spo2'),
      sbp: setField('sbp'),
      heartRate: setField('heartRate'),
      temperature: setField('temperature'),
    }),
    [setField],
  );

  const result = useMemo(() => {
    // Нераспознанный текст («abc») считаем ошибкой ввода, а не пустым полем
    const num = (s) => {
      if (!s || !String(s).trim()) return null;
      const n = parseNum(s);
      return n === undefined ? NaN : n;
    };
    return computeNews2({
      respRate: num(fields.respRate),
      spo2: num(fields.spo2),
      spo2Scale: scale,
      onOxygen: oxygen === 'oxygen' ? true : oxygen === 'air' ? false : null,
      sbp: num(fields.sbp),
      heartRate: num(fields.heartRate),
      consciousness,
      temperature: num(fields.temperature),
    });
  }, [fields, scale, oxygen, consciousness]);

  const { points, errors, risk, complete } = result;
  const summary = summaryText(result);
  const childWarning = ageWarning(patient ? patient.ageMonths : null);
  const touched =
    Object.values(fields).some((v) => v && v.trim()) || oxygen !== null || consciousness !== null;

  const onCopy = async () => {
    if (!summary) return;
    try {
      await Clipboard.setStringAsync(summary);
      announce('Итог NEWS2 скопирован');
    } catch {
      announce('Не удалось скопировать');
    }
  };

  const onClear = () => {
    clearAll();
    announce('Поля NEWS2 очищены');
  };

  const field = (key, unit, extra = {}) => (
    <NumberField
      label={extra.label || PARAM_LABELS[key]}
      unit={unit}
      value={fields[key]}
      onChangeText={handlers[key]}
      error={errors[key]}
      hint={extra.hint}
      badge={pointsText(points[key])}
      badgeLevel={pointsLevel(points[key])}
      testID={`news-${key}`}
    />
  );

  const missingLabels = result.missing.map((k) => PARAM_LABELS[k]);

  return (
    <Screen scroll>
      <Text variant="title" accessibilityRole="header" style={styles.title}>
        NEWS2
      </Text>
      <Text variant="body" color="textSecondary" style={styles.subtitle}>
        Национальная шкала раннего предупреждения 2: оценка тяжести и риска ухудшения состояния по 7
        физиологическим параметрам.
      </Text>

      <Note level="warning" title="Ограничения применения">
        Только для взрослых от 16 лет. Не применяется у беременных (нужна акушерская шкала раннего
        предупреждения) и у детей (педиатрические шкалы). Не заменяет клиническую оценку: тяжёлое
        состояние требует действий при любой сумме баллов.
      </Note>

      {childWarning ? (
        <Note level="danger" title="Возраст пациента">
          {childWarning}
        </Note>
      ) : null}

      <Section title="Дыхание">
        {field('respRate', 'в мин', { label: 'Частота дыхания (ЧДД)' })}

        <ChoiceChips
          label="Шкала SpO₂"
          options={SCALE_OPTIONS}
          value={scale}
          onChange={setScale}
          testID="news-scale"
          style={styles.chipsWithBadge}
        />
        <Text variant="caption" color="textSecondary" style={styles.caption}>
          Шкала 1 — стандартная. Шкала 2 — только при гиперкапнической дыхательной недостаточности с
          целевой SpO₂ 88–92 %.
        </Text>
        {scale === 2 ? (
          <Note level="warning" title="Шкала 2 — только по решению врача">
            Для пациентов с подтверждённой гиперкапнической дыхательной недостаточностью (например,
            ХОБЛ), которым назначена целевая SpO₂ 88–92 %. Решение фиксируется в документации. Во
            всех остальных случаях — шкала 1.
          </Note>
        ) : null}

        {field('spo2', '%', {
          label: scale === 2 ? 'SpO₂ (шкала 2)' : 'SpO₂ (шкала 1)',
          hint: result.pendingReason || undefined,
        })}

        <ChoiceChips
          label="Дыхание воздухом или кислородом"
          options={OXYGEN_OPTIONS}
          value={oxygen}
          onChange={setOxygen}
          testID="news-oxygen"
          style={styles.chipsWithBadge}
        />
        <PointsBadge label="Кислород или воздух" points={points.oxygen} style={styles.badge} />
      </Section>

      <Section title="Кровообращение">
        {field('sbp', 'мм рт. ст.', { label: 'Систолическое АД' })}
        {field('heartRate', 'уд/мин', { label: 'ЧСС (пульс)' })}
      </Section>

      <Section title="Сознание и температура">
        <ChoiceChips
          label="Уровень сознания (ACVPU)"
          options={CONSCIOUSNESS_OPTIONS}
          value={consciousness}
          onChange={setConsciousness}
          testID="news-consciousness"
          style={styles.chipsWithBadge}
        />
        <Text variant="caption" color="textSecondary" style={styles.caption}>
          C — впервые возникшая спутанность, дезориентация или возбуждение (по сравнению с обычным
          состоянием пациента): 3 балла, как V, P и U.
        </Text>
        <PointsBadge label="Сознание" points={points.consciousness} style={styles.badge} />

        {field('temperature', '°C', { label: 'Температура тела' })}
      </Section>

      {complete && risk ? (
        <ResultCard
          title="Сумма NEWS2"
          value={String(result.total)}
          unit={pointsWord(result.total)}
          level={risk.level}
          levelLabel={risk.label}
          announceText={summary}
          testID="news-result"
        >
          <Text variant="bodyStrong" style={styles.resultLine}>
            Наблюдение: {risk.monitoring.toLowerCase()}
          </Text>
          <Text variant="body" style={styles.resultLine}>
            {risk.response}
          </Text>
          {result.anyThree ? (
            <Text variant="body" style={styles.resultLine}>
              3 балла: {result.threeParams.map((k) => PARAM_LABELS[k]).join(', ')}
            </Text>
          ) : null}
          <View style={styles.breakdown}>
            {result.params.map((p) => (
              <Text key={p.key} variant="caption" color="textSecondary" style={styles.breakdownRow}>
                {p.label}: {pointsText(p.points)}
              </Text>
            ))}
          </View>
        </ResultCard>
      ) : (
        <Note
          level="info"
          title="Итог появится после ввода всех параметров"
          testID="news-incomplete"
        >
          {`Заполнено ${result.scoredCount} из 7.${
            missingLabels.length ? ` Осталось: ${missingLabels.join(', ')}.` : ''
          }`}
        </Note>
      )}

      {!complete && result.minRisk && (result.anyThree || result.total >= 5) ? (
        <Note
          level={result.minRisk.level}
          title={`Уже не менее ${result.total} ${pointsWord(result.total)}`}
        >
          {`${result.minRisk.label}${
            result.minRisk.key === 'high' ? '' : ' или выше'
          } — по уже введённым параметрам. Остальные параметры могут только добавить баллы.`}
        </Note>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Скопировать итог"
          icon="copy-outline"
          variant="secondary"
          onPress={onCopy}
          disabled={!summary}
          accessibilityHint="Копирует сумму, уровень риска и частоту наблюдения"
          style={styles.action}
        />
        <Button
          title="Очистить"
          icon="refresh"
          variant="ghost"
          onPress={onClear}
          disabled={!touched}
          accessibilityHint="Очищает все поля шкалы"
          style={styles.action}
        />
      </View>

      <Note level="info" title="На догоспитальном этапе">
        Шкала разработана для стационаров. На вызове используйте её как ориентир тяжести и для
        передачи пациента; тактика и решение о госпитализации — по клинической картине, клиническим
        рекомендациям и стандартам СМП.
      </Note>

      <Text variant="caption" color="textMuted" style={styles.source}>
        Источник: Royal College of Physicians. National Early Warning Score (NEWS) 2, 2017. Русские
        формулировки — по таблице NEWS из методических рекомендаций Минздрава России (COVID-19,
        2021).
      </Text>
    </Screen>
  );
}

const makeStyles = ({ spacing }) => ({
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.lg },
  chipsWithBadge: { marginBottom: spacing.xs },
  badge: { marginBottom: spacing.md },
  caption: { marginBottom: spacing.sm },
  resultLine: { marginBottom: spacing.sm },
  breakdown: { marginTop: spacing.xs },
  breakdownRow: { marginBottom: 2 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.md,
  },
  action: { margin: spacing.xs, flexGrow: 1 },
  source: { marginTop: spacing.sm, marginBottom: spacing.lg },
});
