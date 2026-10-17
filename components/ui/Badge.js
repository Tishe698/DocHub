// Badge — короткая метка уровня. Всегда с текстом: цвет не единственный носитель смысла.
// level: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../AppText';
import { hideFromA11y } from '../a11y';
import { useTheme, useThemedStyles } from '../../theme/index';

export const LEVEL_ICONS = {
  success: 'checkmark-circle',
  warning: 'warning',
  danger: 'alert-circle',
  info: 'information-circle',
  neutral: null,
};

// Цвета уровня: { fg, bg } — текст/иконка и мягкий фон
export const levelColors = (colors, level) => {
  switch (level) {
    case 'success':
    case 'warning':
    case 'danger':
    case 'info':
      return { fg: colors[level], bg: colors[`${level}Soft`] };
    default:
      return { fg: colors.textSecondary, bg: colors.surfaceAlt };
  }
};

export default function Badge({ level = 'neutral', label, children, icon, style, accessibilityLabel }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { fg, bg } = levelColors(colors, level);
  const iconName = icon === undefined ? LEVEL_ICONS[level] : icon;
  const text = label ?? children;

  return (
    <View
      style={[styles.badge, { backgroundColor: bg, borderColor: fg }, style]}
      accessible
      accessibilityLabel={accessibilityLabel || (typeof text === 'string' ? text : undefined)}
    >
      {iconName ? (
        <View style={styles.icon} {...hideFromA11y}>
          <Ionicons name={iconName} size={14} color={fg} />
        </View>
      ) : null}
      <Text variant="caption" style={[styles.text, { color: fg }]}>
        {text}
      </Text>
    </View>
  );
}

const makeStyles = ({ spacing, radius }) => ({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  icon: { marginRight: spacing.xs },
  text: { fontWeight: '600', flexShrink: 1 },
});
