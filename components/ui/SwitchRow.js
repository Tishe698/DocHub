// SwitchRow — переключатель «да/нет» во всю строку: нажимается вся строка,
// диктор слышит роль switch, подпись и состояние (включено/выключено).
import React from 'react';
import { Pressable, Switch, View } from 'react-native';
import { Text } from '../AppText';
import { hideFromA11y } from '../a11y';
import { useTheme, useThemedStyles, MIN_TOUCH } from '../../theme/index';

export default function SwitchRow({
  label,
  description,
  value = false,
  onValueChange,
  disabled = false,
  accessibilityHint,
  style,
  testID,
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const toggle = () => {
    if (!disabled && onValueChange) onValueChange(!value);
  };

  return (
    <Pressable
      onPress={toggle}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={description ? `${label}. ${description}` : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ checked: !!value, disabled: !!disabled }}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        pressed && !disabled ? { backgroundColor: colors.surfaceAlt } : null,
        style,
      ]}
    >
      <View style={styles.texts}>
        <Text variant="body" color={disabled ? 'textMuted' : 'text'}>
          {label}
        </Text>
        {description ? (
          <Text variant="caption" color="textSecondary" style={styles.description}>
            {description}
          </Text>
        ) : null}
      </View>
      {/* Сам Switch скрыт от диктора и не перехватывает касание — состояние объявляет строка */}
      <View pointerEvents="none" {...hideFromA11y}>
        <Switch
          value={!!value}
          disabled={disabled}
          trackColor={{ false: colors.borderStrong, true: colors.primary }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.borderStrong}
        />
      </View>
    </Pressable>
  );
}

const makeStyles = ({ spacing, radius }) => ({
  row: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  texts: { flex: 1, marginRight: spacing.md },
  description: { marginTop: 2 },
});
