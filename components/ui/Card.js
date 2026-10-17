// Card — поверхность-карточка. В светлой теме — с мягкой тенью, в тёмной — с границей
// и surfaceRaised (тени не используются). С onPress становится кнопкой.
// accent — цвет полоски слева (например, theme.colors.section.drugs).
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme, useThemedStyles } from '../../theme/index';

export default function Card({
  children,
  onPress,
  accent,
  padded = true,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
  style,
  testID,
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const base = [
    styles.card,
    padded && styles.padded,
    accent ? { borderLeftWidth: 4, borderLeftColor: accent } : null,
  ];

  if (!onPress) {
    return (
      <View style={[...base, style]} testID={testID}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      testID={testID}
      style={({ pressed }) => [
        ...base,
        pressed ? { backgroundColor: colors.surfaceAlt } : null,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const makeStyles = ({ colors, spacing, radius, isDark }) => ({
  card: {
    backgroundColor: isDark ? colors.surfaceRaised : colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...(isDark
      ? null
      : {
          shadowColor: colors.shadow,
          shadowOpacity: 0.08,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }),
  },
  padded: { padding: spacing.lg },
});
