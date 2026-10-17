// blood_group_screen.js
// Первичное определение группы крови AB0 и резус-принадлежности цоликлонами на плоскости.
// Интерфейс; интерпретация реакций и источники — в bloodGroupLogic.js.
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import Screen from '../components/Screen';
import { Text } from '../components/AppText';
import { announce, hideFromA11y } from '../components/a11y';
import { Button, Card, ChoiceChips, Note, ResultCard, Section } from '../components/ui';
import { useThemedStyles } from '../theme/index';
import {
  EMPTY_REACTIONS,
  NOT_SET,
  POS,
  REACTION_OPTIONS,
  REAGENTS,
  WEAK,
  interpretBloodGroup,
  isDoubtful,
  pendingHints,
  reactionWord,
  resultLevel,
  resultSummary,
} from './bloodGroupLogic';

// Совместимость: функция раньше экспортировалась из экрана
export { interpretBloodGroup };

// «Лунка»: пустая / с крупными агглютинатами / со слабой агглютинацией.
// Рисунок декоративный (скрыт от диктора); смысл дублируется словом под лункой.
const Well = ({ reagent, value }) => {
  const styles = useThemedStyles(makeStyles);
  const pos = value === POS;
  const weak = value === WEAK;
  const dots = pos ? [0, 1, 2, 3, 4] : weak ? [0, 1, 2] : [];
  return (
    <View style={styles.wellRow} {...hideFromA11y}>
      <View
        style={[styles.wellCircle, pos && styles.wellCircleActive, weak && styles.wellCircleWeak]}
      >
        <View style={styles.dotsWrap}>
          {dots.map((d) => (
            <View key={d} style={[styles.dot, pos ? styles.dotPos : styles.dotWeak]} />
          ))}
        </View>
      </View>
      <Text variant="caption" color="textSecondary" style={styles.wellLabel}>
        {value === null || value === undefined
          ? `${reagent}: не отмечено`
          : `${reagent}: ${reactionWord(value)}`}
      </Text>
    </View>
  );
};

// Выбор реакции − / ± / + для одной лунки
const ReactionPicker = ({ title, reagent, hint, value, onChange, testID }) => {
  const styles = useThemedStyles(makeStyles);
  const options = useMemo(
    () =>
      REACTION_OPTIONS.map((o) => ({
        value: o.value,
        label: o.label,
        accessibilityLabel: `${reagent}: ${o.a11y}`,
      })),
    [reagent],
  );
  return (
    <Card>
      <ChoiceChips
        label={title}
        options={options}
        value={value}
        onChange={onChange}
        testID={testID}
      />
      {hint ? (
        <Text variant="caption" color="textSecondary" style={styles.hint}>
          {hint}
        </Text>
      ) : null}
      <Well reagent={reagent} value={value} />
    </Card>
  );
};

// Строка результата; неокончательное значение — цветом предупреждения и словом
// («Не определена», «?» → «под вопросом» для диктора)
const ResultRow = ({ label, value }) => {
  const styles = useThemedStyles(makeStyles);
  const doubtful = isDoubtful(value);
  const notSet = value === NOT_SET;
  const spoken = notSet ? 'не отмечено' : value.replace('?', ', под вопросом');
  return (
    <View style={styles.rowLine} accessible accessibilityLabel={`${label}: ${spoken}`}>
      <Text variant="body" color="textSecondary" style={styles.rowLabel}>
        {label}
      </Text>
      <Text
        variant="bodyStrong"
        color={notSet ? 'textMuted' : doubtful ? 'warning' : 'success'}
        style={styles.rowValue}
      >
        {value}
      </Text>
    </View>
  );
};

export default function BloodGroupScreen() {
  const styles = useThemedStyles(makeStyles);
  const [reactions, setReactions] = useState(EMPTY_REACTIONS);

  const result = useMemo(() => interpretBloodGroup(reactions), [reactions]);
  const level = resultLevel(result);
  const hints = pendingHints(result);

  const setReaction = useCallback((key, value) => {
    setReactions((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetAll = useCallback(() => {
    setReactions(EMPTY_REACTIONS);
    announce('Все реакции сброшены');
  }, []);

  const renderPicker = (r) => (
    <ReactionPicker
      key={r.key}
      title={r.title}
      reagent={r.reagent}
      hint={r.hint}
      value={reactions[r.key]}
      onChange={(v) => setReaction(r.key, v)}
      testID={`blood-${r.key}`}
    />
  );

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header">
          Определение группы крови
        </Text>
        <Text variant="body" color="textSecondary" style={styles.subtitle}>
          Первичное определение AB0 и резуса цоликлонами на плоскости
        </Text>
      </View>

      {/* Методика: приказ №363 (2002); инструкции к цоликлонам */}
      <Note level="info" title="Методика">
        <Text variant="body" style={styles.noteText}>
          Капля реагента 0,1 мл + рядом капля крови 0,01–0,03 мл, перемешать, покачивать при 15–25
          °C. Результат учитывать через 3 мин: слабые варианты A и B агглютинируют позже.
        </Text>
        <Text variant="body" style={styles.noteText}>
          − нет агглютинации · ± слабая / сомнительная · + агглютинация
        </Text>
      </Note>

      <Section title="Группа AB0">
        {REAGENTS.filter((r) => r.section === 'abo').map(renderPicker)}
      </Section>

      <Section title="Резус-принадлежность">
        {REAGENTS.filter((r) => r.section === 'rh').map(renderPicker)}
      </Section>

      <ResultCard
        title="Результат"
        level={level ? level.level : undefined}
        levelLabel={level ? level.label : undefined}
        announceText={resultSummary(result)}
        announceEnabled={result.anyResult}
        testID="blood-result"
      >
        <ResultRow label="Группа AB0" value={result.abo} />
        <ResultRow label="Резус (D)" value={result.rh} />
        {hints.map((h) => (
          <Text key={h} variant="caption" color="textSecondary" style={styles.resultText}>
            {h}
          </Text>
        ))}
        {result.warnings.map((w) => (
          <Note key={w} level="warning" style={styles.resultNote}>
            {w}
          </Note>
        ))}
        {result.infos.map((t) => (
          <Note key={t} level="info" style={styles.resultNote}>
            {t}
          </Note>
        ))}
        {result.anyResult ? (
          <Text variant="bodyStrong" style={styles.resultText}>
            Результат первичный: нужно подтверждение в лаборатории.
          </Text>
        ) : null}
      </ResultCard>

      <View style={styles.actions}>
        <Button
          title="Сбросить"
          variant="secondary"
          icon="refresh"
          onPress={resetAll}
          accessibilityLabel="Сбросить все реакции"
          testID="blood-reset"
        />
      </View>

      {/* Приказ МЗ РФ №1134н (2020), п. 6, 11, 19 */}
      <Text variant="caption" color="textSecondary" style={styles.disclaimer}>
        Первичное определение (приказ МЗ РФ №1134н, п. 6). Группу AB0 и резус подтверждает
        лаборатория медицинской организации (п. 11). Перед трансфузией обязательны контрольная
        проверка AB0 и резуса реципиента и донора и проба на совместимость (п. 19). Результат этого
        экрана не основание для выбора компонента крови.
      </Text>
    </Screen>
  );
}

const WELL = 60;
const DOT = 8;

const makeStyles = ({ colors, spacing, radius }) => ({
  header: { marginBottom: spacing.lg },
  subtitle: { marginTop: spacing.xs },
  noteText: { marginTop: spacing.xs },
  hint: { marginTop: 0 },

  wellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
  // Кружок без текста внутри — фиксированный размер допустим
  wellCircle: {
    width: WELL,
    height: WELL,
    borderRadius: WELL / 2,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 3,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  wellCircleActive: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  wellCircleWeak: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
    borderStyle: 'dashed',
  },
  dotsWrap: {
    width: WELL - 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: { margin: 2, borderRadius: DOT / 2 },
  dotPos: { width: DOT + 2, height: DOT + 2, backgroundColor: colors.danger },
  dotWeak: { width: DOT - 3, height: DOT - 3, backgroundColor: colors.warning },
  wellLabel: { flex: 1, minWidth: 120 },

  rowLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  rowLabel: { marginRight: spacing.sm },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  resultText: { marginTop: spacing.sm },
  resultNote: { marginTop: spacing.sm, marginBottom: 0 },

  actions: { alignItems: 'center', marginTop: spacing.sm },
  disclaimer: { marginTop: spacing.xl, textAlign: 'center' },
});
