// Note — примечание или предупреждение на мягком фоне уровня с иконкой.
// Иконка скрыта от диктора; уровень дублируется словом в подписи для диктора.
// level: 'info' | 'warning' | 'danger' | 'success'
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../AppText';
import { hideFromA11y } from '../a11y';
import { LEVEL_ICONS, levelColors } from './Badge';
import { useTheme, useThemedStyles } from '../../theme/index';

const LEVEL_WORDS = {
  info: 'Примечание',
  warning: 'Внимание',
  danger: 'Опасно',
  success: 'Норма',
};

export default function Note({ level = 'info', title, children, icon, style, testID }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { fg, bg } = levelColors(colors, level);
  const iconName = icon || LEVEL_ICONS[level] || LEVEL_ICONS.info;

  return (
    <View
      style={[styles.note, { backgroundColor: bg, borderLeftColor: fg }, style]}
      testID={testID}
    >
      <View style={styles.icon} {...hideFromA11y}>
        <Ionicons name={iconName} size={20} color={fg} />
      </View>
      <View style={styles.body}>
        {title ? (
          <Text
            variant="bodyStrong"
            style={{ color: fg }}
            accessibilityLabel={`${LEVEL_WORDS[level] || ''}: ${title}`}
          >
            {title}
          </Text>
        ) : null}
        {typeof children === 'string' || typeof children === 'number' ? (
          <Text variant="body" style={title ? styles.textAfterTitle : null}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

const makeStyles = ({ spacing, radius }) => ({
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    marginBottom: spacing.md,
  },
  icon: { marginRight: spacing.sm, marginTop: 1 },
  body: { flex: 1 },
  textAfterTitle: { marginTop: spacing.xs },
});
