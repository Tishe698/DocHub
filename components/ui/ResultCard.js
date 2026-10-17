// ResultCard — итог расчёта: заголовок, крупное число с единицей, уровень, подробности.
// Новый результат озвучивается: accessibilityLiveRegion="polite" (Android) и announce()
// (iOS всегда; Android — при первом появлении карточки, когда live region ещё не работает).
// Озвучка отложена на ANNOUNCE_DELAY мс, чтобы при наборе числа не читать каждую цифру.
//
//   <ResultCard title="Доза" value="2,5" unit="мг" level="warning" levelLabel="выше макс.">
//     <Text variant="caption">…</Text>
//   </ResultCard>
import React, { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';
import { Text } from '../AppText';
import { announce, a11yLabel } from '../a11y';
import Badge from './Badge';
import { useThemedStyles } from '../../theme/index';

export const ANNOUNCE_DELAY = 700;

export default function ResultCard({
  title,
  value,
  unit,
  level,
  levelLabel,
  children,
  announceText,
  announceEnabled = true,
  style,
  testID,
}) {
  const styles = useThemedStyles(makeStyles);
  const hasValue = value !== null && value !== undefined && value !== '';
  const spoken =
    announceText !== undefined ? announceText : a11yLabel(title, hasValue ? `${value} ${unit || ''}` : null, levelLabel);

  const announcedOnce = useRef(false);
  useEffect(() => {
    if (!announceEnabled || !spoken) return undefined;
    const shouldAnnounce = Platform.OS === 'ios' || !announcedOnce.current;
    if (!shouldAnnounce) return undefined;
    const t = setTimeout(() => {
      announcedOnce.current = true;
      announce(spoken);
    }, ANNOUNCE_DELAY);
    return () => clearTimeout(t);
  }, [spoken, announceEnabled]);

  return (
    <View style={[styles.card, style]} accessibilityLiveRegion="polite" testID={testID}>
      {title ? (
        <Text variant="bodyStrong" color="textSecondary" style={styles.title}>
          {title}
        </Text>
      ) : null}
      {hasValue ? (
        <View style={styles.valueRow} accessible accessibilityLabel={a11yLabel(value, unit)}>
          <Text variant="number" style={styles.value}>
            {value}
          </Text>
          {unit ? (
            <Text variant="heading" color="textSecondary" style={styles.unit}>
              {unit}
            </Text>
          ) : null}
        </View>
      ) : null}
      {levelLabel ? <Badge level={level || 'neutral'} label={levelLabel} style={styles.badge} /> : null}
      {children ? <View style={styles.details}>{children}</View> : null}
    </View>
  );
}

const makeStyles = ({ colors, spacing, radius, isDark }) => ({
  card: {
    backgroundColor: isDark ? colors.surfaceRaised : colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  title: { marginBottom: spacing.xs },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' },
  value: { marginRight: spacing.sm },
  unit: {},
  badge: { marginTop: spacing.sm },
  details: { marginTop: spacing.sm },
});
