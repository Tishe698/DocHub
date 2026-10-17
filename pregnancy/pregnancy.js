// pregnancy.js — срок беременности и ПДР по ДПМ + информационное видео (expo-video).
// Расчёты — pregnancy/pregnancyCalc.js (чистые функции с тестами).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Keyboard, Platform, View } from 'react-native';
import { useEvent } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import { Text } from '../components/AppText';
import { announce, hideFromA11y } from '../components/a11y';
import { Badge, Button, Card, Note, NumberField, ResultCard, Section } from '../components/ui';
import { useTheme, useThemedStyles } from '../theme/index';
import {
  CATEGORIES,
  calcPregnancy,
  dueDateStatus,
  formatGestation,
  formatInputDate,
  formatRussianDate,
  formatShortDate,
  maxLmpDate,
  minLmpDate,
  msUntilNextMidnight,
  parseDDMMYYYY,
  sameDay,
  spokenGestation,
  spokenRussianDate,
  spokenSummary,
  startOfDay,
} from './pregnancyCalc';

const VIDEO_SOURCE = require('../g.mp4');
const VIDEO_TITLE = 'Информационное видео о поэтапном развитии ребёнка в утробе матери';

// «Сегодня» как состояние: срок пересчитывается после полуночи и при возврате в приложение.
function useToday() {
  const [today, setToday] = useState(() => startOfDay(new Date()));
  useEffect(() => {
    const refresh = () => {
      const now = startOfDay(new Date());
      setToday((prev) => (sameDay(prev, now) ? prev : now));
    };
    let timer;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        refresh();
        schedule();
      }, msUntilNextMidnight(new Date()));
    };
    schedule();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refresh();
        schedule();
      }
    });
    return () => {
      clearTimeout(timer);
      sub?.remove?.();
    };
  }, []);
  return today;
}

function VideoCard() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const videoRef = useRef(null);

  // Плеер без автозапуска: пользователь запускает сам. Хуки — безусловно (правила хуков React).
  const player = useVideoPlayer(VIDEO_SOURCE, (p) => {
    p.loop = true;
    p.muted = false;
    p.volume = 1.0;
  });

  // Третий аргумент useEvent — начальное значение.
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { muted } = useEvent(player, 'mutedChange', { muted: player.muted });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const failed = status === 'error';

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
      announce('Видео на паузе');
    } else {
      player.play();
      announce('Видео воспроизводится');
    }
  };

  const toggleMute = () => {
    player.muted = !player.muted;
    announce(player.muted ? 'Звук выключен' : 'Звук включён');
  };

  const enterFullscreen = async () => {
    try {
      await videoRef.current?.enterFullscreen();
    } catch {
      announce('Полноэкранный режим недоступен');
    }
  };

  return (
    <Card>
      <View style={styles.cardHeader}>
        <View {...hideFromA11y} style={styles.headerIcon}>
          <Ionicons name="videocam-outline" size={22} color={colors.section.pregnancy} />
        </View>
        <Text variant="bodyStrong" accessibilityRole="header" style={styles.flexText}>
          {VIDEO_TITLE}
        </Text>
      </View>

      <View style={styles.videoWrap}>
        {failed ? (
          <View style={styles.videoFallback} accessible accessibilityLabel="Видео не удалось загрузить">
            <View {...hideFromA11y}>
              <Ionicons name="videocam-off-outline" size={40} color={colors.textMuted} />
            </View>
            <Text variant="body" color="textSecondary" style={styles.fallbackText}>
              Видео не удалось загрузить. Перезапустите приложение.
            </Text>
          </View>
        ) : (
          <VideoView
            ref={videoRef}
            style={styles.video}
            player={player}
            nativeControls
            fullscreenOptions={{ enable: true }}
            allowsPictureInPicture
            contentFit="contain"
            collapsable={false} // важно для касаний на Android
          />
        )}
      </View>

      {/* Свои кнопки дублируют нативные элементы управления: крупнее и с подписями для диктора */}
      <View style={styles.controls}>
        <Button
          title={isPlaying ? 'Пауза' : 'Пуск'}
          icon={isPlaying ? 'pause' : 'play'}
          variant="secondary"
          onPress={togglePlay}
          disabled={failed}
          accessibilityLabel={isPlaying ? 'Поставить видео на паузу' : 'Воспроизвести видео'}
          style={styles.controlBtn}
        />
        <Button
          title={muted ? 'Звук выкл.' : 'Звук вкл.'}
          icon={muted ? 'volume-mute' : 'volume-high'}
          variant="secondary"
          onPress={toggleMute}
          disabled={failed}
          accessibilityLabel={muted ? 'Включить звук видео' : 'Выключить звук видео'}
          style={styles.controlBtn}
        />
        <Button
          title="На весь экран"
          icon="expand"
          variant="secondary"
          onPress={enterFullscreen}
          disabled={failed}
          accessibilityLabel="Открыть видео на весь экран"
          style={styles.controlBtn}
        />
      </View>
    </Card>
  );
}

const Date_pregnancy = () => {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const today = useToday();

  const [lmp, setLmp] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [inputError, setInputError] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  // iOS: колесо вызывает onChange на каждое движение, поэтому выбор храним временно
  // и применяем только по кнопке «Готово».
  const [pickerDate, setPickerDate] = useState(() => new Date());

  const result = useMemo(() => (lmp ? calcPregnancy(lmp, today) : null), [lmp, today]);
  const minPicker = useMemo(() => minLmpDate(today), [today]);
  const maxPicker = useMemo(() => maxLmpDate(today), [today]);

  const handleManualChange = (text) => {
    const f = formatInputDate(text);
    setManualInput(f);
    if (f.length < 10) {
      setInputError(null);
      return;
    }
    const parsed = parseDDMMYYYY(f, today);
    if (!parsed.date) {
      setInputError(parsed.error);
      announce(parsed.error);
      return;
    }
    setInputError(null);
    setLmp(parsed.date);
    Keyboard.dismiss();
  };

  const applyPickedDate = (selected) => {
    if (!selected) return;
    const d = startOfDay(selected);
    setLmp(d);
    setManualInput(formatShortDate(d));
    setInputError(null);
  };

  const openPicker = () => {
    Keyboard.dismiss();
    setPickerDate(lmp || today);
    setShowPicker(true);
  };

  const handlePickerChange = (event, selected) => {
    if (Platform.OS === 'ios') {
      // iOS spinner шлёт onChange на каждое движение колеса — только запоминаем.
      if (selected) setPickerDate(selected);
      return;
    }
    setShowPicker(false);
    // Android: «Отмена» тоже вызывает onChange (type: "dismissed") с исходной датой — не применяем.
    if (event?.type !== 'set') return;
    applyPickedDate(selected);
  };

  const handlePickerDone = () => {
    setShowPicker(false);
    applyPickedDate(pickerDate);
  };

  const handleRecalculate = () => {
    setLmp(null);
    setManualInput('');
    setInputError(null);
    setShowPicker(false);
    announce('Дата очищена. Введите первый день последней менструации');
  };

  const category = result ? CATEGORIES[result.category] : null;
  const due = result ? dueDateStatus(result.daysToDue) : null;

  return (
    <Screen scroll>
      <Text
        variant="caption"
        color="textSecondary"
        style={styles.today}
        accessibilityLabel={`Сегодня ${spokenRussianDate(today)}`}
      >
        {`Сегодня: ${formatRussianDate(today)}`}
      </Text>

      {!lmp ? (
        <Section title="Первый день последней менструации (ДПМ)">
          <NumberField
            label="Дата"
            value={manualInput}
            onChangeText={handleManualChange}
            placeholder="дд.мм.гггг"
            hint="Только цифры, точки ставятся сами"
            error={inputError}
            returnKeyType="done"
            testID="lmp-input"
          />
          <Button
            title="Выбрать в календаре"
            icon="calendar-outline"
            variant="secondary"
            onPress={openPicker}
            accessibilityHint="Открывает выбор даты первого дня последней менструации"
            fullWidth
          />

          {showPicker ? (
            <View style={styles.picker}>
              <DateTimePicker
                value={Platform.OS === 'ios' ? pickerDate : lmp || today}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handlePickerChange}
                maximumDate={maxPicker}
                minimumDate={minPicker}
                locale="ru-RU"
                themeVariant={isDark ? 'dark' : 'light'}
                textColor={colors.text}
                accentColor={colors.primary}
              />
              {Platform.OS === 'ios' ? (
                <View style={styles.pickerActions}>
                  <Button
                    title="Отмена"
                    variant="ghost"
                    onPress={() => setShowPicker(false)}
                    accessibilityLabel="Отменить выбор даты"
                    style={styles.pickerBtn}
                  />
                  <Button
                    title="Готово"
                    onPress={handlePickerDone}
                    accessibilityLabel="Применить выбранную дату"
                    style={styles.pickerBtn}
                  />
                </View>
              ) : null}
            </View>
          ) : null}
        </Section>
      ) : (
        <Section title="Результат">
          <Text variant="body" color="textSecondary" style={styles.meta}>
            {`ДПМ (первый день последней менструации): ${formatRussianDate(lmp)}`}
          </Text>

          {result.tooLong ? (
            <Note level="danger" title="Срок больше 45 недель">
              Почти наверняка ошибка в дате. Проверьте ДПМ, особенно год.
            </Note>
          ) : null}

          <ResultCard
            title="Срок беременности"
            value={formatGestation(result.weeks, result.days)}
            valueAccessibilityLabel={`Срок ${spokenGestation(result.weeks, result.days)}`}
            announceText={spokenSummary(result)}
          >
            <Badge
              level={category.level}
              label={category.text}
              accessibilityLabel={category.spoken}
              style={styles.badge}
            />
            <Text variant="body" color="textSecondary">{`идёт ${result.currentWeek}-я неделя`}</Text>
            <Text
              variant="bodyStrong"
              style={styles.due}
              accessibilityLabel={`Предполагаемая дата родов: ${spokenRussianDate(result.due)}`}
            >
              {`Предполагаемая дата родов: ${formatRussianDate(result.due)}`}
            </Text>
            {due ? (
              <Text variant="body" color={due.level === 'warning' ? 'warning' : 'textSecondary'} accessibilityLabel={due.spoken}>
                {due.text}
              </Text>
            ) : null}
          </ResultCard>

          {/* КР МЗ РФ «Нормальная беременность» 2023 (ID 288): срок определяют по ДПМ и УЗИ;
              при расхождении в 11⁰–13⁶ нед достовернее срок по УЗИ (КТР). */}
          <Note level="info" title="Как считается">
            ПДР = ДПМ + 280 дней. Срок рассчитан по ДПМ при 28-дневном цикле; при другой длине цикла он
            смещается. Если есть УЗИ в 11⁰–13⁶ нед, срок устанавливают по УЗИ (КТР) — сверяйтесь с обменной
            картой.
          </Note>

          <Button
            title="Повторный расчёт"
            icon="refresh"
            variant="secondary"
            onPress={handleRecalculate}
            accessibilityHint="Очищает дату и возвращает к вводу"
            fullWidth
          />
        </Section>
      )}

      <VideoCard />
    </Screen>
  );
};

const makeStyles = ({ colors, spacing, radius }) => ({
  today: { marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  headerIcon: { marginRight: spacing.sm, marginTop: 1 },
  flexText: { flex: 1 },
  videoWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Размер видео задан пропорцией, а не высотой — к тексту не относится
  video: { width: '100%', aspectRatio: 16 / 9 },
  videoFallback: {
    width: '100%',
    minHeight: 160,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: { textAlign: 'center', marginTop: spacing.sm },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginHorizontal: -spacing.xs,
  },
  controlBtn: { margin: spacing.xs, flexGrow: 1 },
  picker: { marginTop: spacing.md },
  pickerActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: spacing.sm },
  pickerBtn: { marginLeft: spacing.sm, marginTop: spacing.xs },
  meta: { marginBottom: spacing.md },
  due: { marginTop: spacing.sm },
  badge: { marginBottom: spacing.sm },
});

export default Date_pregnancy;
