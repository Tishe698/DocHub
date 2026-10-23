// NoticeGate — экран «Перед началом работы» при первом запуске: назначение приложения,
// ответственность медицинского работника, данные пациента и ссылка на политику конфиденциальности.
// Принятие сохраняется (AsyncStorage) с номером версии текста: при новой версии экран покажется снова.
// Хранилище недоступно или не ответило за 2 с — экран показывается, а принятие действует до перезапуска.
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Screen from '../components/Screen';
import { Text } from '../components/AppText';
import { Button } from '../components/ui';
import { useTheme, useThemedStyles } from '../theme/index';
import AboutModal from './AboutModal';
import { NoticePoints } from './AboutContent';
import { NOTICE_ACCEPT, NOTICE_KEY, NOTICE_TITLE, NOTICE_VERSION } from './aboutText';

// Сколько ждать хранилище: дольше — показываем уведомление, чтобы запуск не зависал на пустом экране
export const STORAGE_TIMEOUT_MS = 2000;

export function NoticeScreen({ onAccept }) {
  const styles = useThemedStyles(makeStyles);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  return (
    <Screen noHeader scroll testID="notice-screen">
      <View style={styles.content}>
        <Text variant="title" accessibilityRole="header">
          {NOTICE_TITLE}
        </Text>
        <NoticePoints />
        <Button
          title="Политика конфиденциальности"
          icon="shield-checkmark-outline"
          variant="ghost"
          onPress={() => setPrivacyOpen(true)}
          accessibilityHint="Открывает текст политики конфиденциальности"
          testID="notice-privacy"
        />
        <Button title={NOTICE_ACCEPT} onPress={onAccept} fullWidth testID="notice-accept" />
      </View>
      <AboutModal
        visible={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        privacyOnly
        testID="notice-privacy-modal"
      />
    </Screen>
  );
}

export default function NoticeGate({ children }) {
  const { colors } = useTheme();
  const [state, setState] = useState('loading');

  useEffect(() => {
    let done = false;
    const finish = (next) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      setState(next);
    };
    const timer = setTimeout(() => finish('needed'), STORAGE_TIMEOUT_MS);
    AsyncStorage.getItem(NOTICE_KEY)
      .then((v) => finish(v === String(NOTICE_VERSION) ? 'accepted' : 'needed'))
      .catch(() => finish('needed'));
    return () => {
      done = true;
      clearTimeout(timer);
    };
  }, []);

  const accept = () => {
    setState('accepted');
    AsyncStorage.setItem(NOTICE_KEY, String(NOTICE_VERSION)).catch(() => {
      // не удалось сохранить — экран покажется при следующем запуске
    });
  };

  // Пока читается хранилище — пустой фон темы (доли секунды, под заставкой)
  if (state === 'loading') return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (state === 'needed') return <NoticeScreen onAccept={accept} />;
  return children;
}

const makeStyles = ({ spacing }) => ({
  content: { gap: spacing.lg, paddingVertical: spacing.lg },
});
