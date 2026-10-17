import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
  Alert,
  Pressable,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  AppState,
} from "react-native";
import { Text, TextInput } from "../components/AppText";
import { useEvent } from "expo";
import { VideoView, useVideoPlayer } from "expo-video";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// ---------------------- Расчёт срока (чистые функции) ----------------------
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Пороги в днях от первого дня последней менструации (ДПМ).
// ПДР = ДПМ + 280 дней (40 нед) — КР МЗ РФ «Нормальная беременность» 2023 (ID 288), раздел определения сроков.
const DAYS_TO_DUE = 280;
// 22⁰ нед: с этого срока прерывание — роды (преждевременные), до него — выкидыш.
// КР МЗ РФ «Преждевременные роды» 2024 (ID 331), «Термины и определения»: 22⁰–36⁶ нед.
const DAYS_22W = 22 * 7;
// 37⁰–41⁶ нед — доношенный срок: КР МЗ РФ «Нормальная беременность» 2023 (ID 288), определение.
const DAYS_37W = 37 * 7;
// ≥42⁰ нед (294 дня) — переношенная беременность: МКБ-10 O48, определение ВОЗ.
const DAYS_42W = 42 * 7;
// Больше 45⁰ нед по ДПМ беременность не продолжается — почти наверняка ошибка в дате (год).
// Предел консервативный, введён для защиты от опечаток (логика задачи, не норматив).
const DAYS_MAX = 45 * 7;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Считаем в календарных днях, а не в миллисекундах: при переходе на летнее/зимнее
// время в сутках 23 или 25 часов, и расчёт через мс сдвигал результат на день.
const daysBetween = (from, to) => Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY);

const calcPregnancy = (lmpDate, todayDate) => {
  const lmp = startOfDay(lmpDate);
  const daysSinceLMP = daysBetween(lmp, todayDate);
  // Срок записывается полными неделями и днями (N нед M дн, 37⁰–41⁶) —
  // КР МЗ РФ «Нормальная беременность» 2023 (ID 288).
  const weeks = Math.floor(daysSinceLMP / 7);
  const days = daysSinceLMP % 7;
  const due = new Date(lmp.getFullYear(), lmp.getMonth(), lmp.getDate() + DAYS_TO_DUE);
  const daysToDue = daysBetween(todayDate, due);
  let category;
  if (daysSinceLMP < DAYS_22W) category = "early";
  else if (daysSinceLMP < DAYS_37W) category = "preterm";
  else if (daysSinceLMP < DAYS_42W) category = "term";
  else category = "postterm";
  return { daysSinceLMP, weeks, days, due, daysToDue, category, tooLong: daysSinceLMP > DAYS_MAX };
};

// Маска дд.мм.гггг. Понимает ввод и вставку с разделителями «. , / - пробел» без ведущих нулей
// («3.5.2026» → «03.05.2026») и ISO «гггг-мм-дд». Цифр не больше 8 — лишние отбрасываются.
const formatInputDate = (value) => {
  const raw = String(value ?? "");
  const iso = raw.trim().match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
  if (iso) return `${iso[3].padStart(2, "0")}.${iso[2].padStart(2, "0")}.${iso[1]}`;
  const segs = [""];
  for (const ch of raw) {
    const i = segs.length - 1;
    if (ch >= "0" && ch <= "9") {
      const maxLen = i < 2 ? 2 : 4;
      if (segs[i].length < maxLen) segs[i] += ch;
      else if (i < 2) segs.push(ch);
      // год уже 4 цифры — лишние цифры игнорируем
    } else if (/[.,/\-\s]/.test(ch)) {
      if (i < 2 && segs[i].length > 0) {
        segs[i] = segs[i].padStart(2, "0");
        segs.push("");
      }
    }
  }
  return segs.join(".");
};

// Возвращает { date } или { error } с причиной для пользователя.
const parseDDMMYYYY = (s, todayDate) => {
  const m = String(s).match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return { error: "Проверьте дату в формате дд.мм.гггг." };
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  const d = new Date(yyyy, mm - 1, dd);
  // new Date молча «переносит» несуществующие даты (31.02 → 03.03, 99.99 → через годы),
  // а годы 0–99 превращает в 1900–1999 — такие даты отклоняем.
  if (isNaN(d.getTime()) || d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) {
    return { error: "Такой даты нет. Проверьте дату в формате дд.мм.гггг." };
  }
  const diff = daysBetween(d, todayDate);
  // Дата последней менструации не может быть в будущем (как и в календаре: maximumDate)
  if (diff < 0) return { error: "Дата не может быть позже сегодняшней." };
  if (diff > DAYS_MAX) return { error: "Срок по этой дате больше 45 недель. Проверьте дату, особенно год." };
  return { date: d };
};

const formatShortDate = (d) =>
  `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;

const formatRussianDate = (date) => {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return formatShortDate(date);
  }
};

// Строка о сроке относительно порогов (короткая, для экрана СМП).
const CATEGORY_TEXT = {
  early: "До 22⁰ нед: прерывание — выкидыш, не роды",
  preterm: "22⁰–36⁶ нед: роды в этом сроке — преждевременные (КР 2024)",
  term: "37⁰–41⁶ нед: доношенный срок",
  postterm: "≥42⁰ нед: переношенная беременность",
};

const Date_pregnancy = () => {
  const videoRef = useRef(null);

  // Инициализация плеера БЕЗ автозапуска.
  // Хуки вызываются безусловно (правила хуков React): без try/catch и без if.
  const player = useVideoPlayer(require("../g.mp4"), (p) => {
    if (!p) return;
    p.loop = true;
    p.muted = false;
    p.volume = 1.0;
    // p.play(); — убрано: пользователь запускает сам
  });

  // Следим за состоянием воспроизведения (экспортируемое событие expo-video).
  // Третий аргумент useEvent — начальное значение, а не колбэк.
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });

  // ---------------------- Состояния формы ----------------------
  const [lastMenstrualPeriod, setLastMenstrualPeriod] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [manualDateInput, setManualDateInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  // iOS: колесо вызывает onChange на каждое движение, поэтому выбор храним временно
  // и применяем только по кнопке «Готово».
  const [pickerDate, setPickerDate] = useState(() => new Date());
  // «Сегодня» как состояние: срок пересчитывается после полуночи и при возврате в приложение.
  const [today, setToday] = useState(() => startOfDay(new Date()));

  // ---------------------- Анимации ----------------------
  const fadeCards = useRef(new Animated.Value(0)).current;
  const slideVideo = useRef(new Animated.Value(20)).current;
  const slideForm = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeCards, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideVideo, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideForm, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);

  // ---------------------- Актуальная дата ----------------------
  useEffect(() => {
    const refresh = () => {
      const now = startOfDay(new Date());
      setToday((prev) => (sameDay(prev, now) ? prev : now));
    };
    let timer;
    const schedule = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
      timer = setTimeout(() => {
        refresh();
        schedule();
      }, nextMidnight.getTime() - now.getTime());
    };
    schedule();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refresh();
        clearTimeout(timer);
        schedule();
      }
    });
    return () => {
      clearTimeout(timer);
      sub?.remove?.();
    };
  }, []);

  // ---------------------- Вычисления срока ----------------------
  const result = useMemo(
    () => (lastMenstrualPeriod ? calcPregnancy(lastMenstrualPeriod, today) : null),
    [lastMenstrualPeriod, today]
  );

  // Календарь: не раньше 45⁰ нед назад (см. DAYS_MAX) и не позже сегодня.
  const minPickerDate = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate() - DAYS_MAX),
    [today]
  );
  const maxPickerDate = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59),
    [today]
  );

  // ---------------------- Обработчики ----------------------
  const handleManualDateChange = (text) => {
    const f = formatInputDate(text);
    setManualDateInput(f);
    setIsTyping(!!text);
    if (f.length === 10) {
      const parsed = parseDDMMYYYY(f, today);
      if (!parsed.date) {
        Alert.alert("Некорректная дата", parsed.error);
        return;
      }
      setLastMenstrualPeriod(parsed.date);
      Keyboard.dismiss();
    }
  };

  const applyPickedDate = (selectedDate) => {
    if (!selectedDate) return;
    const d = startOfDay(selectedDate);
    setLastMenstrualPeriod(d);
    setManualDateInput(formatShortDate(d));
  };

  const openDatePicker = () => {
    Keyboard.dismiss();
    setPickerDate(lastMenstrualPeriod || new Date());
    setShowDatePicker(true);
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "ios") {
      // На iOS spinner шлёт onChange (type: "set") на каждое движение колеса —
      // только запоминаем, применяем по «Готово».
      if (selectedDate) setPickerDate(selectedDate);
      return;
    }
    setShowDatePicker(false);
    // На Android «Отмена» тоже вызывает onChange (type: "dismissed") с исходной датой
    // (сегодняшней) — её не применяем, иначе запускался расчёт от сегодняшнего дня.
    if (event?.type !== "set") return;
    applyPickedDate(selectedDate);
  };

  const handlePickerDone = () => {
    setShowDatePicker(false);
    applyPickedDate(pickerDate);
  };

  const handlePickerCancel = () => setShowDatePicker(false);

  const handleRecalculate = () => {
    setLastMenstrualPeriod(null);
    setManualDateInput("");
    setIsTyping(false);
    setShowDatePicker(false);
  };

  const titleToday = useMemo(() => formatRussianDate(today), [today]);

  const enterFs = () => videoRef.current?.enterFullscreen();

  // ---------------------- Рендер ----------------------
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBgOverlay} />
          <Text style={styles.headerTitle}>Срок беременности</Text>
          <Text style={styles.headerSubtitle}>{titleToday}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.containerScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* VIDEO CARD */}
          <Animated.View style={[styles.card, { opacity: fadeCards, transform: [{ translateY: slideVideo }] }]}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="video-outline" size={22} color="#FF6B9D" />
              <Text style={styles.cardHeaderText}>
                Информационное видео о поэтапном развитии ребёнка в утробе матери
              </Text>
            </View>

            <View style={styles.videoWrap}>
              {player ? (
                <VideoView
                  ref={videoRef}
                  style={styles.video}
                  player={player}
                  nativeControls
                  allowsFullscreen
                  allowsPictureInPicture
                  contentFit="contain"
                  collapsable={false} // важно для тачей на Android
                />
              ) : (
                <View style={[styles.video, styles.videoFallback]}>
                  <Ionicons name="videocam-off" size={48} color="#64748B" />
                  <Text style={styles.videoFallbackText}>
                    Видео недоступно в Expo Go{"\n"}Работает в собранном приложении
                  </Text>
                </View>
              )}
            </View>

            {/* Кастомные кнопки управления (дублируют нативные) */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10, justifyContent: "center" }}>
              <Pressable
                style={({ pressed }) => [styles.controlBtn, pressed && styles.buttonPressed]}
                onPress={() => {
                  if (!player) {
                    Alert.alert("Видео недоступно", "Плеер работает в собранном приложении (EAS Build).");
                    return;
                  }
                  player.playing ? player.pause() : player.play();
                }}
              >
                <Ionicons name={isPlaying ? "pause" : "play"} size={18} color="#0F172A" />
                <Text style={styles.controlBtnText}>{isPlaying ? "Пауза" : "Пуск"}</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.controlBtn, pressed && styles.buttonPressed]}
                onPress={() => {
                  if (!player) {
                    Alert.alert("Недоступно", "Полноэкранный режим работает в собранном приложении.");
                    return;
                  }
                  enterFs();
                }}
              >
                <Ionicons name="expand" size={18} color="#0F172A" />
                <Text style={styles.controlBtnText}>На весь экран</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* INPUT CARD */}
          <Animated.View style={[styles.card, { opacity: fadeCards, transform: [{ translateY: slideForm }] }]}>
            {!lastMenstrualPeriod ? (
              // Оборачиваем только форму, чтобы тапы снаружи НЕ перехватывали видео
              <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View>
                  <Text style={styles.las_day_menstr}>{"Введите первый день  \nпоследней менструации"}</Text>

                  {/* Поле ввода с кастомным placeholder (оверлей) */}
                  <View style={{ position: "relative", marginTop: 8 }}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#64748B"
                      style={{ position: "absolute", left: 12, top: 14 }}
                    />

                    <TextInput
                      placeholder="" // системный плейсхолдер скрыт — используем оверлей ниже
                      value={manualDateInput}
                      onChangeText={(t) => {
                        handleManualDateChange(t);
                        setIsTyping(!!t);
                      }}
                      keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
                      style={[styles.input, { paddingLeft: 38 }]}
                      onFocus={() => setIsTyping(true)}
                      onBlur={() => setIsTyping(false)}
                      accessibilityLabel="Поле ввода даты в формате дд.мм.гггг"
                      returnKeyType="done"
                    />

                    {!manualDateInput && (
                      <View pointerEvents="none" style={styles.phWrap}>
                        <Text style={styles.phText}>Введите дату в формате дд.мм.гггг</Text>
                      </View>
                    )}
                  </View>

                  {!isTyping && (
                    <Pressable
                      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                      onPress={openDatePicker}
                      android_ripple={{ color: "#e2e8f0" }}
                      accessibilityRole="button"
                      accessibilityLabel="Открыть календарь"
                    >
                      <Ionicons name="calendar" size={18} color="#0F172A" />
                      <Text style={styles.las_day_menstr}>Открыть календарь</Text>
                    </Pressable>
                  )}

                  {showDatePicker && (
                    <View style={{ marginTop: 8 }}>
                      <DateTimePicker
                        value={Platform.OS === "ios" ? pickerDate : lastMenstrualPeriod || new Date()}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={handleDateChange}
                        maximumDate={maxPickerDate}
                        minimumDate={minPickerDate}
                      />
                      {Platform.OS === "ios" && (
                        <View style={styles.pickerActions}>
                          <Pressable
                            style={({ pressed }) => [styles.pickerBtn, pressed && styles.buttonPressed]}
                            onPress={handlePickerCancel}
                            accessibilityRole="button"
                            accessibilityLabel="Отмена"
                          >
                            <Text style={styles.pickerBtnText}>Отмена</Text>
                          </Pressable>
                          <Pressable
                            style={({ pressed }) => [
                              styles.pickerBtn,
                              styles.pickerBtnPrimary,
                              pressed && styles.buttonPressed,
                            ]}
                            onPress={handlePickerDone}
                            accessibilityRole="button"
                            accessibilityLabel="Готово"
                          >
                            <Text style={[styles.pickerBtnText, styles.pickerBtnPrimaryText]}>Готово</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </TouchableWithoutFeedback>
            ) : (
              <View>
                <Text style={styles.resultMeta}>
                  ДПМ (первый день последней менструации): {formatRussianDate(lastMenstrualPeriod)}
                </Text>
                <Text style={styles.resultMeta}>Срок на {formatRussianDate(today)}</Text>

                {result?.tooLong && (
                  <View style={[styles.notice, styles.noticeDanger]}>
                    <Text style={styles.noticeDangerText}>
                      Срок больше 45 недель — почти наверняка ошибка в дате. Проверьте ДПМ, особенно год.
                    </Text>
                  </View>
                )}

                <Text style={styles.result_pregnancy}>
                  Срок беременности: {result?.weeks} нед {result?.days} дн
                </Text>
                <Text style={styles.resultHint}>идёт {result ? result.weeks + 1 : ""}-я неделя</Text>

                {result && (
                  <View
                    style={[
                      styles.notice,
                      result.category === "postterm" || result.category === "preterm"
                        ? styles.noticeWarn
                        : styles.noticeInfo,
                    ]}
                  >
                    <Text style={styles.noticeText}>{CATEGORY_TEXT[result.category]}</Text>
                  </View>
                )}

                {result && (
                  <Text style={styles.result_pregnancy}>
                    Предполагаемая дата родов: {formatRussianDate(result.due)}
                  </Text>
                )}
                {result && result.daysToDue < 0 && (
                  <View style={[styles.notice, styles.noticeWarn]}>
                    <Text style={styles.noticeText}>ПДР прошла {-result.daysToDue} дн назад</Text>
                  </View>
                )}
                {result && result.daysToDue === 0 && (
                  <View style={[styles.notice, styles.noticeInfo]}>
                    <Text style={styles.noticeText}>ПДР — сегодня</Text>
                  </View>
                )}

                {/* КР МЗ РФ «Нормальная беременность» 2023 (ID 288): срок определяют по ДПМ и УЗИ;
                    при расхождении в 11⁰–13⁶ нед достовернее срок по УЗИ (КТР). */}
                <Text style={styles.resultNote}>
                  ПДР = ДПМ + 280 дней. Срок рассчитан по ДПМ при 28-дневном цикле; при другой длине цикла
                  он смещается. Если есть УЗИ в 11⁰–13⁶ нед, срок устанавливают по УЗИ (КТР) — сверяйтесь
                  с обменной картой.
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                  onPress={handleRecalculate}
                  android_ripple={{ color: "#e2e8f0" }}
                  accessibilityRole="button"
                  accessibilityLabel="Повторный расчёт"
                >
                  <Ionicons name="refresh" size={18} color="#0F172A" />
                  <Text style={styles.las_day_menstr_1}>Повторный расчёт</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    paddingTop: 18,
    paddingBottom: 22,
    paddingHorizontal: 16,
    backgroundColor: "#8B5CF6",
    overflow: "hidden",
  },
  headerBgOverlay: { position: "absolute", inset: 0, backgroundColor: "#7C3AED", opacity: 0.18 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSubtitle: { color: "rgba(255,255,255,0.9)", marginTop: 4 },

  containerScroll: { padding: 16 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  cardHeaderText: { flex: 1, color: "#0F172A", fontWeight: "700" },

  videoWrap: { borderRadius: 12, overflow: "hidden" },
  video: { width: "100%", aspectRatio: 16 / 9 },
  videoFallback: {
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  videoFallbackText: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },

  las_day_menstr: { fontSize: 19, marginVertical: 10, fontWeight: "500", textAlign: "center", color: "#0F172A" },
  las_day_menstr_1: { fontSize: 19, marginVertical: 10, fontWeight: "300", textAlign: "center", color: "#0F172A" },
  result_pregnancy: { fontSize: 25, fontWeight: "normal", marginVertical: 14, textAlign: "center", color: "#0F172A" },
  resultMeta: { fontSize: 15, textAlign: "center", color: "#475569", marginTop: 4 },
  resultHint: { fontSize: 16, textAlign: "center", color: "#475569", marginTop: -8, marginBottom: 6 },
  resultNote: { fontSize: 13, lineHeight: 18, color: "#64748B", marginTop: 12, textAlign: "center" },

  notice: { borderRadius: 12, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12, marginTop: 8 },
  noticeInfo: { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" },
  noticeWarn: { backgroundColor: "#FFFBEB", borderColor: "#FCD34D" },
  noticeDanger: { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" },
  noticeText: { fontSize: 15, textAlign: "center", color: "#0F172A" },
  noticeDangerText: { fontSize: 16, fontWeight: "700", textAlign: "center", color: "#B91C1C" },

  pickerActions: { flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 6 },
  pickerBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 18,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  pickerBtnPrimary: { backgroundColor: "#8B5CF6", borderColor: "#8B5CF6" },
  pickerBtnText: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  pickerBtnPrimaryText: { color: "#FFFFFF" },

  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    paddingHorizontal: 12,
    height: 48,
  },

  // Кастомный placeholder как оверлей — стабильно в релизах Android
  phWrap: {
    position: "absolute",
    left: 38,
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  phText: { color: "#94A3B8", fontSize: 16 },

  button: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    paddingHorizontal: 14,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    flexDirection: "row",
    gap: 8,
  },
  buttonPressed: { transform: [{ scale: 0.98 }] },

  controlBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  controlBtnText: { color: "#0F172A", fontWeight: "600" },
});

export default Date_pregnancy;
