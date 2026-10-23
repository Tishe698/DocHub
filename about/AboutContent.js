// AboutContent — текст «О приложении» (назначение, ответственность, данные) и политика
// конфиденциальности. Общий для экрана при первом запуске и окна «О приложении».
import React from 'react';
import { View } from 'react-native';
import { Text } from '../components/AppText';
import { useThemedStyles } from '../theme/index';
import appConfig from '../app.json';
import { NOTICE_POINTS, PRIVACY_SECTIONS, PRIVACY_TITLE, PRIVACY_URL } from './aboutText';

export const APP_VERSION = appConfig.expo.version;

export function NoticePoints() {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.list}>
      {NOTICE_POINTS.map(([title, text]) => (
        <View key={title} style={styles.item}>
          <Text variant="bodyStrong" accessibilityRole="header">
            {title}
          </Text>
          <Text variant="body" color="textSecondary">
            {text}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function PrivacyText() {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.list}>
      <Text variant="heading" accessibilityRole="header">
        {PRIVACY_TITLE}
      </Text>
      {PRIVACY_SECTIONS.map(([title, paragraphs]) => (
        <View key={title} style={styles.item}>
          <Text variant="bodyStrong" accessibilityRole="header">
            {title}
          </Text>
          {paragraphs.map((p) => (
            <Text key={p} variant="body" color="textSecondary">
              {p}
            </Text>
          ))}
        </View>
      ))}
      <Text variant="caption" color="textSecondary" selectable>
        {`Текст политики в интернете: ${PRIVACY_URL}`}
      </Text>
    </View>
  );
}

const makeStyles = ({ spacing }) => ({
  list: { gap: spacing.md },
  item: { gap: spacing.xs },
});
