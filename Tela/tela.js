// tela.js — экран «Вероятность ТЭЛА»: пересмотренная Женевская шкала (Le Gal, 2006).
// Пункты, подсчёт и интерпретация — в Tela/genevaScore.js (чистые функции, тесты в __tests__).
// Пункт «возраст > 65 лет» подставляется из общего пациента, но его можно изменить.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Screen from '../components/Screen';
import { Text } from '../components/AppText';
import { announce } from '../components/a11y';
import { Button, Card, ChoiceChips, Note, ResultCard, Section, SwitchRow } from '../components/ui';
import PatientBar from '../patient/PatientBar';
import { usePatient } from '../patient/PatientContext';
import { formatAge } from '../patient/estimates';
import { useThemedStyles } from '../theme/index';
import {
  BASE_ITEMS,
  HR_OPTIONS,
  ageFlagFromPatient,
  childWarning,
  computeGeneva,
  emptyFlags,
  genevaSummary,
  ptsWord,
} from './genevaScore';

const HR_CHOICES = HR_OPTIONS.map((o) => ({
  value: o.id,
  label: `${o.label} (+${o.pts})`,
  accessibilityLabel: `${o.label}, ${o.pts} ${ptsWord(o.pts)}`,
}));

const ptsText = (pts) => `+${pts} ${ptsWord(pts)}`;

// Пояснение к пункту «возраст > 65 лет»: откуда взято значение
function ageDescription(ageMonths, fromPatient, override) {
  if (fromPatient === null) return `${ptsText(1)} · возраст пациента не указан — отметьте вручную`;
  const age = formatAge(ageMonths);
  if (override === null || override === fromPatient) {
    return `${ptsText(1)} · подставлено из возраста пациента: ${age}`;
  }
  return `${ptsText(1)} · изменено вручную; по возрасту пациента (${age}) — ${fromPatient ? 'да' : 'нет'}`;
}

export default function GenevaScoreScreen() {
  const styles = useThemedStyles(makeStyles);
  const { patient, resetCount } = usePatient();
  const ageFromPatient = ageFlagFromPatient(patient.ageMonths);

  const [flags, setFlags] = useState(emptyFlags);
  // null — пункт «возраст > 65» берётся из пациента; true/false — изменён вручную
  const [ageOverride, setAgeOverride] = useState(null);
  // null — ЧСС ещё не выбрана: итог не показываем (EBMcalc: все поля обязательны)
  const [hr, setHr] = useState(null);

  const ageFlag = ageOverride !== null ? ageOverride : ageFromPatient === true;

  const clearAll = useCallback(() => {
    setFlags(emptyFlags());
    setAgeOverride(null);
    setHr(null);
  }, []);

  // Возраст пациента изменился — снова подставляем пункт из пациента
  const lastAge = useRef(patient.ageMonths);
  useEffect(() => {
    if (patient.ageMonths === lastAge.current) return;
    lastAge.current = patient.ageMonths;
    setAgeOverride(null);
  }, [patient.ageMonths]);

  // «Новый пациент» — очищаем форму
  const lastReset = useRef(resetCount);
  useEffect(() => {
    if (resetCount === lastReset.current) return;
    lastReset.current = resetCount;
    clearAll();
  }, [resetCount, clearAll]);

  const effectiveFlags = useMemo(() => ({ ...flags, age: ageFlag }), [flags, ageFlag]);
  const result = useMemo(() => computeGeneva({ flags: effectiveFlags, hr }), [effectiveFlags, hr]);
  const { complete, sum, risk, twoLevel, discordant } = result;
  const ageWarning = childWarning(patient.ageMonths);

  const toggle = (id) => (value) => {
    if (id === 'age') setAgeOverride(value);
    else setFlags((prev) => ({ ...prev, [id]: value }));
  };

  const onReset = () => {
    clearAll();
    announce('Женевская шкала сброшена');
  };

  return (
    <Screen scroll>
      <PatientBar />

      <Text variant="title" accessibilityRole="header" style={styles.title}>
        Шкала вероятности ТЭЛА
      </Text>
      <Text variant="body" color="textSecondary" style={styles.subtitle}>
        Пересмотренная Женевская шкала (Revised Geneva Score) — полная версия (Le Gal, 2006)
      </Text>

      {/* Применимость — ESC 2019, разд. 4 и 9.2; Le Gal 2006 (выборка — взрослые) */}
      <Note level="warning" title="Применимость">
        {'Для взрослых со стабильной гемодинамикой при подозрении на ТЭЛА. При шоке или гипотензии ' +
          '(САД < 90 мм рт. ст.) шкалу не используют: тактика ТЭЛА высокого риска — срочная ЭхоКГ ' +
          'или КТ-ангиопульмонография. У детей не валидирована. У беременных — отдельный алгоритм ESC 2019.'}
      </Note>
      {ageWarning ? (
        <Note level="danger" title="Возраст пациента" testID="geneva-child">
          {ageWarning}
        </Note>
      ) : null}

      <Section title="Частота сердечных сокращений" description={complete ? null : 'Обязательный пункт — выберите'}>
        <ChoiceChips label="ЧСС" options={HR_CHOICES} value={hr} onChange={setHr} testID="geneva-hr" />
      </Section>

      <Section title="Клинические признаки">
        <Card padded={false} style={styles.list}>
          {BASE_ITEMS.map((item, idx) => (
            <View key={item.id} style={idx > 0 ? styles.divider : null}>
              <SwitchRow
                label={item.label}
                description={
                  item.id === 'age'
                    ? ageDescription(patient.ageMonths, ageFromPatient, ageOverride)
                    : item.hint
                      ? `${ptsText(item.pts)} · ${item.hint}`
                      : ptsText(item.pts)
                }
                value={!!effectiveFlags[item.id]}
                onValueChange={toggle(item.id)}
                testID={`geneva-${item.id}`}
                style={styles.row}
              />
            </View>
          ))}
        </Card>
      </Section>

      <ResultCard
        title="Сумма баллов"
        value={complete ? String(sum) : null}
        unit={complete ? ptsWord(sum) : null}
        level={risk ? risk.badge : null}
        levelLabel={risk ? `Вероятность ТЭЛА: ${risk.level.toLowerCase()} (${risk.prevalence})` : null}
        announceText={genevaSummary(result)}
        testID="geneva-result"
      >
        {risk ? (
          <>
            <Text variant="body">{`Двухуровневая схема: ${twoLevel.text}.`}</Text>
            <Text variant="body" style={styles.line}>
              {`Дальше (ESC 2019): ${risk.next}`}
            </Text>
            {discordant ? (
              <Text variant="body" style={styles.line}>
                {`Если доступен только менее чувствительный Д-димер — по двухуровневой схеме: ${twoLevel.next}.`}
              </Text>
            ) : null}
          </>
        ) : (
          <Text variant="body" color="textSecondary">
            {`Укажите ЧСС, чтобы получить итог. Без ЧСС: ${sum} ${ptsWord(sum)}.`}
          </Text>
        )}
      </ResultCard>

      <Button title="Сбросить" variant="secondary" icon="refresh" onPress={onReset} testID="geneva-reset" />
    </Screen>
  );
}

const makeStyles = ({ colors, spacing }) => ({
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.lg },
  list: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  row: { paddingVertical: spacing.md },
  divider: { borderTopWidth: 1, borderTopColor: colors.divider },
  line: { marginTop: spacing.sm },
});
