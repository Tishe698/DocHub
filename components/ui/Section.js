// Section — смысловой блок экрана с заголовком (accessibilityRole="header":
// диктор позволяет прыгать по заголовкам).
import React from 'react';
import { View } from 'react-native';
import { Text } from '../AppText';
import { useThemedStyles } from '../../theme/index';

export default function Section({ title, description, right, children, style, testID }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.section, style]} testID={testID}>
      {title || right ? (
        <View style={styles.header}>
          {title ? (
            <Text variant="heading" accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
          ) : null}
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      ) : null}
      {description ? (
        <Text variant="caption" color="textSecondary" style={styles.description}>
          {description}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const makeStyles = ({ spacing }) => ({
  section: { marginBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  title: { flex: 1, minWidth: '50%' },
  right: { marginLeft: spacing.sm },
  description: { marginBottom: spacing.sm },
});
