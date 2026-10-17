// Button — кнопка на токенах темы.
// variant: 'primary' | 'secondary' | 'ghost' | 'danger'; высота не меньше MIN_TOUCH (48).
import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../AppText';
import { hideFromA11y } from '../a11y';
import { useTheme, useThemedStyles, MIN_TOUCH } from '../../theme/index';

// Цвета фона, текста и рамки для варианта и состояния нажатия
export const buttonColors = (colors, variant, pressed, disabled) => {
  if (disabled) {
    return {
      bg: colors.surfaceAlt,
      fg: colors.textMuted,
      border: colors.border,
    };
  }
  switch (variant) {
    case 'secondary':
      return {
        bg: pressed ? colors.surfaceAlt : colors.primarySoft,
        fg: colors.onPrimarySoft,
        border: colors.primarySoft,
      };
    case 'ghost':
      return {
        // без заливки и рамки (прозрачно)
        bg: pressed ? colors.surfaceAlt : undefined,
        fg: colors.primary,
        border: undefined,
      };
    case 'danger':
      return {
        bg: colors.danger,
        fg: colors.onDanger,
        border: pressed ? colors.text : colors.danger,
      };
    case 'primary':
    default:
      return {
        bg: pressed ? colors.primaryPressed : colors.primary,
        fg: colors.onPrimary,
        border: pressed ? colors.primaryPressed : colors.primary,
      };
  }
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  fullWidth = false,
  selected,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={
        selected === undefined ? { disabled: !!disabled } : { disabled: !!disabled, selected: !!selected }
      }
      testID={testID}
      style={({ pressed }) => {
        const c = buttonColors(colors, variant, pressed, disabled);
        return [
          styles.base,
          fullWidth && styles.fullWidth,
          c.border
            ? { backgroundColor: c.bg, borderColor: c.border }
            : { backgroundColor: c.bg, borderWidth: 0 },
          style,
        ];
      }}
    >
      {({ pressed }) => {
        const { fg } = buttonColors(colors, variant, pressed, disabled);
        return (
          <View style={styles.row}>
            {icon ? (
              <View style={styles.icon} {...hideFromA11y}>
                <Ionicons name={icon} size={20} color={fg} />
              </View>
            ) : null}
            <Text variant="bodyStrong" style={[styles.label, { color: fg }]}>
              {title}
            </Text>
          </View>
        );
      }}
    </Pressable>
  );
}

const makeStyles = ({ spacing, radius }) => ({
  base: {
    minHeight: MIN_TOUCH,
    minWidth: MIN_TOUCH,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  icon: { marginRight: spacing.sm },
  label: { textAlign: 'center' },
});
