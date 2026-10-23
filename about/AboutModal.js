// AboutModal — окно «О приложении»: назначение, данные и политика конфиденциальности.
// Открывается с главного экрана и с экрана первого запуска. Закрывается кнопкой «Закрыть»,
// нажатием на затемнение или системной «Назад». Для диктора окно модальное.
import React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../components/AppText';
import { Button } from '../components/ui';
import { useThemedStyles } from '../theme/index';
import { APP_VERSION, NoticePoints, PrivacyText } from './AboutContent';

export default function AboutModal({ visible, onClose, privacyOnly = false, testID }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropPress}
          onPress={onClose}
          accessible={false}
          importantForAccessibility="no"
        />
        <View style={styles.card} accessibilityViewIsModal testID={testID}>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {privacyOnly ? null : (
              <>
                <Text variant="heading" accessibilityRole="header">
                  О приложении
                </Text>
                <Text variant="caption" color="textSecondary">
                  {`DocHub, версия ${APP_VERSION}`}
                </Text>
                <NoticePoints />
              </>
            )}
            <PrivacyText />
          </ScrollView>
          <Button
            title="Закрыть"
            onPress={onClose}
            testID={testID ? `${testID}-close` : undefined}
          />
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = ({ colors, spacing, radius, isDark }) => ({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.overlay,
  },
  backdropPress: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  card: {
    maxHeight: '90%',
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    backgroundColor: isDark ? colors.surfaceRaised : colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  body: { flexGrow: 0, marginBottom: spacing.md },
  bodyContent: { gap: spacing.md, paddingBottom: spacing.xs },
});
