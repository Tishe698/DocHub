// Screen.js — стандартный контейнер экрана.
// SafeAreaView из react-native-safe-area-context (не из react-native!), фон colors.bg,
// по желанию прокрутка и подъём содержимого над клавиатурой.
//
//   <Screen scroll>…</Screen>             — экран с шапкой навигатора и прокруткой
//   <Screen noHeader>…</Screen>           — экран без шапки: добавляется верхний отступ
//   <Screen edges={['bottom']}>…</Screen> — свои края безопасной зоны
import React, { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/index';

const DEFAULT_EDGES = ['left', 'right', 'bottom'];
const NO_HEADER_EDGES = ['top', 'left', 'right', 'bottom'];

export default function Screen({
  children,
  scroll = false,
  noHeader = false,
  edges,
  padded = true,
  keyboardAvoiding = true,
  style,
  contentContainerStyle,
  scrollRef,
  scrollProps,
  testID,
}) {
  const { colors, spacing } = useTheme();
  const wrapperRef = useRef(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // KeyboardAvoidingView считает перекрытие клавиатурой относительно своего родителя,
  // поэтому на iOS передаём ему фактическую позицию контейнера в окне
  // (высота шапки, статус-бар, модальное окно) — без зависимости от навигатора.
  const onLayout = useCallback(() => {
    if (Platform.OS !== 'ios' || !wrapperRef.current) return;
    wrapperRef.current.measureInWindow((x, y) => {
      if (Number.isFinite(y)) setKeyboardOffset((prev) => (prev === y ? prev : y));
    });
  }, []);

  const padding = padded ? { padding: spacing.lg } : null;

  const body = scroll ? (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={[styles.grow, padding, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      {...scrollProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padding, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView
      edges={edges || (noHeader ? NO_HEADER_EDGES : DEFAULT_EDGES)}
      style={[styles.flex, { backgroundColor: colors.bg }, style]}
      testID={testID}
    >
      <View ref={wrapperRef} style={styles.flex} onLayout={onLayout} collapsable={false}>
        {keyboardAvoiding ? (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? keyboardOffset : 0}
          >
            {body}
          </KeyboardAvoidingView>
        ) : (
          body
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
});
