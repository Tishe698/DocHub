// HelpButton — маленькая кнопка «?» рядом с заголовком: открывает короткую справку в окне
// поверх экрана. Закрывается кнопкой «Понятно», нажатием на затемнение или системной «Назад».
//
//   <HelpButton title="Лента Broselow" accessibilityLabel="Что такое лента Broselow">
//     <Text variant="body">…</Text>
//   </HelpButton>
//
// Зона касания — не меньше MIN_TOUCH (сама иконка мелкая). Для диктора окно модальное:
// фокус не уходит на экран под ним.
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../AppText';
import Button from './Button';
import { useTheme, useThemedStyles, MIN_TOUCH } from '../../theme/index';

export default function HelpButton({ title, accessibilityLabel, children, style, testID }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || `Справка: ${title}`}
        accessibilityHint="Открывает краткое пояснение"
        hitSlop={8}
        testID={testID}
        style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
      >
        <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent
      >
        <View style={styles.backdrop}>
          {/* Нажатие на затемнение закрывает окно; для диктора — отдельная кнопка «Понятно» */}
          <Pressable
            style={styles.backdropPress}
            onPress={close}
            accessible={false}
            importantForAccessibility="no"
            testID={testID ? `${testID}-backdrop` : undefined}
          />
          <View style={styles.card} accessibilityViewIsModal>
            <Text variant="heading" accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
              {children}
            </ScrollView>
            <Button
              title="Понятно"
              onPress={close}
              testID={testID ? `${testID}-close` : undefined}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const makeStyles = ({ colors, spacing, radius, isDark }) => ({
  button: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MIN_TOUCH / 2,
  },
  pressed: { backgroundColor: colors.surfaceAlt },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.overlay,
  },
  backdropPress: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  card: {
    maxHeight: '85%',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    backgroundColor: isDark ? colors.surfaceRaised : colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  title: { marginBottom: spacing.sm },
  body: { flexGrow: 0, marginBottom: spacing.md },
  bodyContent: { paddingBottom: spacing.xs },
});
