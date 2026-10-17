// ReactionTable.js — таблица учёта реакции с цоликлонами, в которой строку выбирают нажатием:
// слева капли с «+» / «−» для каждого цоликлона, справа группа (или резус). Используется
// дважды — для AB0 (Анти-А, Анти-В, Анти-АВ) и для резуса (Анти-D супер).
// Выбранная строка подсвечивается фоном, рамкой и словом «выбрано»; для диктора строки —
// переключатели (radio) с состоянием «выбрано» и подписью из реакций словами.
import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/AppText';
import { hideFromA11y } from '../components/a11y';
import { useTheme, useThemedStyles, MIN_TOUCH } from '../theme/index';
import BloodDrop from './BloodDrop';
import { rowA11yLabel } from './bloodGroupLogic';

const DROP = 32;

export default function ReactionTable({
  reagents,
  rows,
  selectedKey,
  onSelect,
  resultHeader,
  a11yPrefix,
  renderResult,
  resultFlex = 1.3,
  testID,
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.table} accessibilityRole="radiogroup" testID={testID}>
      <View style={[styles.row, styles.head]} {...hideFromA11y}>
        {reagents.map((r) => (
          <Text
            key={r.key}
            variant="caption"
            color={r.tone || 'text'}
            maxFontSizeMultiplier={1.3}
            style={[styles.cell, styles.headText, styles.headReagent]}
          >
            {r.label}
          </Text>
        ))}
        <Text
          variant="caption"
          color="textSecondary"
          style={[styles.result, { flex: resultFlex }, styles.headText]}
        >
          {resultHeader}
        </Text>
      </View>

      {rows.map((row) => {
        const selected = row.key === selectedKey;
        return (
          <Pressable
            key={row.key}
            onPress={() => onSelect(row.key)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, selected }}
            accessibilityLabel={rowA11yLabel(row, reagents, a11yPrefix)}
            testID={testID ? `${testID}-${row.key}` : undefined}
            style={({ pressed }) => [
              styles.row,
              styles.bodyRow,
              pressed && !selected && { backgroundColor: colors.surfaceAlt },
              selected && styles.rowSelected,
            ]}
          >
            {reagents.map((r) => (
              <View key={r.key} style={[styles.cell, styles.dropCell]}>
                <BloodDrop value={row[r.key]} size={DROP} />
                <Text variant="heading" color="textSecondary" style={styles.sign}>
                  {row[r.key]}
                </Text>
              </View>
            ))}
            <View style={[styles.result, { flex: resultFlex }]}>
              {renderResult(row, selected)}
              {/* Место под отметку есть всегда (у невыбранной строки — прозрачной и скрытой
                  от диктора): высота строки не меняется при выборе */}
              <View
                style={[styles.selectedRow, !selected && styles.hidden]}
                {...(selected ? null : hideFromA11y)}
              >
                <View {...hideFromA11y}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.onPrimarySoft} />
                </View>
                <Text variant="caption" color="onPrimarySoft" style={styles.selectedText}>
                  выбрано
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = ({ colors, spacing, radius }) => ({
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  head: {
    alignItems: 'flex-end',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headText: { textAlign: 'center' },
  // Мелкий жирный шрифт: на ширине 320 pt подписи соседних столбцов не слипаются
  headReagent: { fontWeight: '700' },
  cell: { flex: 1 },
  dropCell: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  sign: { marginLeft: spacing.xs, minWidth: 12, textAlign: 'center' },
  result: { paddingLeft: spacing.sm, alignItems: 'center' },
  bodyRow: {
    minHeight: MIN_TOUCH + spacing.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: 'transparent', // невидимая рамка: строки не прыгают при выборе
  },
  rowSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  selectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  selectedText: { flexShrink: 1, marginLeft: spacing.xs, fontWeight: '600' },
  hidden: { opacity: 0 },
});
