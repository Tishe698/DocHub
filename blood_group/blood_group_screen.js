// blood_group_screen.js
// Первичное определение группы крови AB0 и резус-принадлежности цоликлонами на плоскости.
// Две таблицы учёта с рисунками капель: нажмите строку, где капли выглядят так же, как на
// планшете, — внизу появятся группа и резус. Данные таблиц и источники — в bloodGroupLogic.js.
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import Screen from '../components/Screen';
import { Text } from '../components/AppText';
import { announce, hideFromA11y } from '../components/a11y';
import { Button, Note, ResultCard, Section } from '../components/ui';
import { useThemedStyles } from '../theme/index';
import BloodDrop from './BloodDrop';
import ReactionTable from './ReactionTable';
import {
  AB0_REAGENTS,
  AB0_ROWS,
  LAB_NOTE,
  NEG,
  POS,
  RH_REAGENTS,
  RH_ROWS,
  bloodGroupResult,
} from './bloodGroupLogic';

// Как выглядит реакция: рисунок + слово
const Legend = () => {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.legend}>
      <View style={styles.legendRow}>
        <BloodDrop value={NEG} size={22} />
        <Text variant="caption" color="textSecondary" style={styles.legendText}>
          «−» ровная красная капля — агглютинации нет
        </Text>
      </View>
      <View style={styles.legendRow}>
        <BloodDrop value={POS} size={22} />
        <Text variant="caption" color="textSecondary" style={styles.legendText}>
          «+» красные хлопья на светлом фоне — агглютинация
        </Text>
      </View>
    </View>
  );
};

// В выбранной строке подпись цветом onPrimarySoft: цвет группы на подсвеченном фоне
// в тёмной теме не даёт контраста 4,5:1
const renderGroup = (row, selected) => (
  <Text variant="heading" color={selected ? 'onPrimarySoft' : row.tone}>
    {row.label}
    {/* U+2060 — «*» не отрывается от AB(IV) при переносе */}
    {row.needsControl ? '\u2060*' : ''}
  </Text>
);

const renderRh = (row, selected) => (
  <>
    <Text variant="heading" color={selected ? 'onPrimarySoft' : row.tone}>
      {row.label}
    </Text>
    <Text variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
      {row.text}
    </Text>
  </>
);

export default function BloodGroupScreen() {
  const styles = useThemedStyles(makeStyles);
  const [aboKey, setAboKey] = useState(null);
  const [rhKey, setRhKey] = useState(null);
  const result = bloodGroupResult(aboKey, rhKey);

  const reset = useCallback(() => {
    setAboKey(null);
    setRhKey(null);
    announce('Выбор сброшен');
  }, []);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header">
          Определение группы крови
        </Text>
        <Text variant="body" color="textSecondary" style={styles.subtitle}>
          Первичное определение цоликлонами на плоскости — группа AB0 и резус
        </Text>
      </View>

      {/* Методика: приказ №363 (2002); инструкции к цоликлонам */}
      <Note level="info" title="Как определить">
        <Text variant="body" style={styles.noteText}>
          Капля цоликлона 0,1 мл + рядом капля крови 0,01–0,03 мл, перемешать, покачивать при
          комнатной температуре (15–25 °C). Смотреть через 3 минуты. Затем нажмите строку таблицы,
          где капли выглядят так же.
        </Text>
      </Note>

      <Section title="1. Группа крови">
        <ReactionTable
          reagents={AB0_REAGENTS}
          rows={AB0_ROWS}
          selectedKey={aboKey}
          onSelect={setAboKey}
          resultHeader="Группа"
          a11yPrefix="Группа"
          renderResult={renderGroup}
          resultFlex={1.5}
          testID="blood-abo"
        />
        <Text variant="caption" color="textSecondary" style={styles.footnote}>
          * AB(IV) — только если в контроле (капля крови + капля 0,9% NaCl) агглютинации нет.
        </Text>
        <Legend />
      </Section>

      <Section title="2. Резус-фактор">
        <ReactionTable
          reagents={RH_REAGENTS}
          rows={RH_ROWS}
          selectedKey={rhKey}
          onSelect={setRhKey}
          resultHeader="Резус"
          renderResult={renderRh}
          resultFlex={1.6}
          testID="blood-rh"
        />
      </Section>

      <ResultCard
        title="Результат"
        value={result ? result.headline : undefined}
        valueAccessibilityLabel={result ? result.spokenValue : undefined}
        level={result && result.needsControl ? 'warning' : undefined}
        levelLabel={result && result.needsControl ? 'Нужен контроль с 0,9% NaCl' : undefined}
        announceText={result ? result.spoken : ''}
        announceEnabled={!!result}
        testID="blood-result"
      >
        {result ? (
          <>
            {/* Значение итога диктор уже прочитал (valueAccessibilityLabel) — без повтора */}
            <Text variant="bodyStrong" testID="blood-result-text" {...hideFromA11y}>
              {result.text}
            </Text>
            {result.missing ? (
              <Text variant="caption" color="textSecondary" style={styles.resultText}>
                {result.missing}.
              </Text>
            ) : null}
            {result.notes.map((n) => (
              <Note key={n} level="warning" style={styles.resultNote}>
                {n}
              </Note>
            ))}
            <Text variant="caption" color="textSecondary" style={styles.resultText}>
              {LAB_NOTE}
            </Text>
          </>
        ) : (
          <Text variant="body" color="textSecondary">
            Выберите строки в таблицах — здесь появятся группа и резус.
          </Text>
        )}
      </ResultCard>

      {/* Кнопка всегда в дереве (без выбора — недоступна): фокус диктора не теряется при сбросе */}
      <View style={styles.actions}>
        <Button
          title="Сбросить"
          variant="secondary"
          icon="refresh"
          onPress={reset}
          disabled={!result}
          accessibilityLabel="Сбросить выбор"
          testID="blood-reset"
        />
      </View>

      {/* Приказ МЗ РФ №1134н (2020), п. 6, 11, 19 */}
      <Text variant="caption" color="textSecondary" style={styles.disclaimer}>
        Первичное определение (приказ МЗ РФ №1134н, п. 6). Если реакция неясная или ни одна строка
        не подходит — группу и резус не устанавливают, кровь направляют в лабораторию. Группу и
        резус подтверждает лаборатория (п. 11). Перед трансфузией обязательны контрольная проверка
        группы и резуса реципиента и донора и проба на совместимость (п. 19).
      </Text>
    </Screen>
  );
}

const makeStyles = ({ spacing }) => ({
  header: { marginBottom: spacing.lg },
  subtitle: { marginTop: spacing.xs },
  noteText: { marginTop: spacing.xs },
  footnote: { marginTop: spacing.sm },

  legend: { marginTop: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  legendText: { flex: 1, marginLeft: spacing.sm },

  resultText: { marginTop: spacing.sm },
  resultNote: { marginTop: spacing.sm, marginBottom: 0 },

  actions: { alignItems: 'center', marginTop: spacing.sm },
  disclaimer: { marginTop: spacing.xl, textAlign: 'center' },
});
