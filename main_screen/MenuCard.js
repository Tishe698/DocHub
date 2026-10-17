// MenuCard — карточка перехода в раздел (главный экран, подменю «Интубация» и «Кислород»).
// Построена на ui/Card: роль button, подпись «Название, пояснение», подсказка «Открыть раздел».
// Значок/картинка и стрелка декоративные и скрыты от диктора; высота не фиксирована —
// текст переносится при масштабе шрифта 1.5.
import React from 'react';
import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/AppText';
import { hideFromA11y } from '../components/a11y';
import { Card } from '../components/ui';
import { useTheme, useThemedStyles, MIN_TOUCH } from '../theme/index';
import { cardA11yLabel } from './menuConfig';

export default function MenuCard({ card, image, onPress, style, testID }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const accent = colors.section[card.section] || colors.primary;

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={cardA11yLabel(card)}
      accessibilityHint="Открыть раздел"
      style={[styles.card, style]}
      testID={testID}
    >
      <View style={styles.row}>
        <View style={styles.lead} {...hideFromA11y}>
          {image ? (
            <Image source={image} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={[styles.iconWrap, { borderColor: accent }]}>
              <Ionicons name={card.icon} size={26} color={accent} />
            </View>
          )}
        </View>
        <View style={styles.text}>
          <Text variant="bodyStrong" style={styles.title}>
            {card.title}
          </Text>
          {card.description ? (
            <Text variant="caption" color="textSecondary">
              {card.description}
            </Text>
          ) : null}
        </View>
        <View style={styles.chevron} {...hideFromA11y}>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </View>
    </Card>
  );
}

const makeStyles = ({ colors, spacing, radius }) => ({
  card: { minHeight: MIN_TOUCH },
  row: { flexDirection: 'row', alignItems: 'center' },
  lead: { marginRight: spacing.md },
  iconWrap: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: 64, height: 64, borderRadius: radius.md },
  text: { flex: 1, flexShrink: 1 },
  title: { marginBottom: spacing.xs },
  chevron: { marginLeft: spacing.sm },
});
