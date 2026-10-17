// ChoiceChips — выбор одного значения кнопками (путь введения, показание, пол и т. п.).
// Контейнер — radiogroup с подписью; каждый вариант — radio с состоянием selected/checked.
// Выбранный вариант отмечен не только цветом, но и галочкой.
//
//   <ChoiceChips label="Путь введения" options={[{ value: 'iv', label: 'в/в' }]}
//                value={route} onChange={setRoute} />
import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../AppText';
import { hideFromA11y } from '../a11y';
import { useTheme, useThemedStyles, MIN_TOUCH } from '../../theme/index';

export default function ChoiceChips({
  label,
  options = [],
  value,
  onChange,
  disabled = false,
  hint,
  style,
  testID,
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.wrap, style]} testID={testID}>
      {label ? (
        // Подпись читается диктором как обычный текст (iOS не озвучивает подпись radiogroup)
        <Text variant="bodyStrong" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.row}>
        {options.map((opt) => {
          const selected = opt.value === value;
          const isDisabled = disabled || !!opt.disabled;
          return (
            <Pressable
              key={String(opt.value)}
              onPress={() => {
                if (!isDisabled && !selected && onChange) onChange(opt.value);
              }}
              disabled={isDisabled}
              accessibilityRole="radio"
              accessibilityLabel={opt.accessibilityLabel || opt.label}
              accessibilityHint={hint}
              accessibilityState={{ selected, checked: selected, disabled: isDisabled }}
              style={({ pressed }) => [
                styles.chip,
                selected ? styles.chipSelected : null,
                pressed && !selected ? { backgroundColor: colors.surfaceAlt } : null,
                isDisabled ? styles.chipDisabled : null,
              ]}
            >
              {selected ? (
                <View style={styles.check} {...hideFromA11y}>
                  <Ionicons name="checkmark" size={18} color={colors.onPrimary} />
                </View>
              ) : null}
              <Text
                variant={selected ? 'bodyStrong' : 'body'}
                // flexShrink: длинная подпись переносится, а не вылезает за чип рядом с галочкой
                style={{
                  flexShrink: 1,
                  color: selected ? colors.onPrimary : isDisabled ? colors.textMuted : colors.text,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = ({ colors, spacing, radius }) => ({
  wrap: { marginBottom: spacing.md },
  label: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs },
  chip: {
    minHeight: MIN_TOUCH,
    minWidth: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    margin: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipDisabled: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
  check: { marginRight: spacing.xs },
});
