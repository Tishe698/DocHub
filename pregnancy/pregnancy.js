import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
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
} from "react-native";
import { useEvent } from "expo";
import { VideoView, useVideoPlayer } from "expo-video";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const Date_pregnancy = () => {
  const videoRef = useRef(null);

  // Инициализация плеера БЕЗ автозапуска
  let player = null;
  try {
    player = useVideoPlayer(require("../g.mp4"), (p) => {
      if (!p) return;
      p.loop = true;
      p.muted = false;
      p.volume = 1.0;
      // p.play(); — убрано: пользователь запускает сам
    });
  } catch {
    player = null; // Expo Go: безопасный фолбэк
  }

  const [isPlaying, setIsPlaying] = useState(false);

  // Следим за состоянием воспроизведения (экспортируемое событие expo-video)
  if (player) {
    useEvent(player, "playingChange", (e) => setIsPlaying(!!e?.isPlaying));
  }

  // ---------------------- Состояния формы ----------------------
  const [lastMenstrualPeriod, setLastMenstrualPeriod] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [manualDateInput, setManualDateInput] = useState("");
  const [week, setWeek] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

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

  // ---------------------- Вычисления срока ----------------------
  useEffect(() => {
    if (!lastMenstrualPeriod) {
      setWeek(null);
      setDueDate(null);
      return;
    }
    const today = new Date();
    const daysSinceLMP = (today.getTime() - lastMenstrualPeriod.getTime()) / (1000 * 60 * 60 * 24);
    const calculatedWeek = Math.floor(daysSinceLMP / 7);
    setWeek(calculatedWeek);
    const due = new Date(lastMenstrualPeriod.getTime() + 40 * 7 * 24 * 60 * 60 * 1000);
    setDueDate(due);
  }, [lastMenstrualPeriod]);

  // ---------------------- Хелперы ----------------------
  const formatRussianDate = (date) => {
    try {
      return new Intl.DateTimeFormat("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    } catch {
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = date.getFullYear();
      return `${dd}.${mm}.${yyyy}`;
    }
  };

  const formatInputDate = (value) => {
    if (value.length <= 10) {
      let f = value.replace(/\D/g, "");
      if (f.length > 2) f = `${f.slice(0, 2)}.${f.slice(2)}`;
      if (f.length > 5) f = `${f.slice(0, 5)}.${f.slice(5)}`;
      return f;
    }
    return value.substring(0, 10);
  };

  const parseDDMMYYYY = (s) => {
    const parts = s.split(".").map((n) => Number(n));
    if (parts.length !== 3) return null;
    const d = new Date(parts[2], parts[1] - 1, parts[0]);
    return isNaN(d.getTime()) ? null : d;
  };

  // ---------------------- Обработчики ----------------------
  const handleManualDateChange = (text) => {
    const f = formatInputDate(text);
    setManualDateInput(f);
    setIsTyping(!!text);
    if (f.length === 10) {
      const selectedDate = parseDDMMYYYY(f);
      if (!selectedDate) {
        Alert.alert("Некорректная дата", "Проверьте формат: дд.мм.гггг");
        return;
      }
      setLastMenstrualPeriod(selectedDate);
      Keyboard.dismiss();
    }
  };

  const handleDateChange = (_, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setLastMenstrualPeriod(selectedDate);
      setManualDateInput(
        `${String(selectedDate.getDate()).padStart(2, "0")}.${String(selectedDate.getMonth() + 1).padStart(2, "0")}.${selectedDate.getFullYear()}`
      );
    }
  };

  const handleRecalculate = () => {
    setLastMenstrualPeriod(null);
    setManualDateInput("");
    setIsTyping(false);
  };

  const titleToday = useMemo(() => {
    const d = new Date();
    return new Intl.DateTimeFormat("ru-RU", { year: "numeric", month: "long", day: "numeric" }).format(d);
  }, []);

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
                      onPress={() => setShowDatePicker(true)}
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
                        value={lastMenstrualPeriod || new Date()}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                      />
                    </View>
                  )}
                </View>
              </TouchableWithoutFeedback>
            ) : (
              <View>
                <Text style={styles.result_pregnancy}>Неделя беременности: {week}</Text>
                {dueDate && (
                  <Text style={styles.result_pregnancy}>
                    Предполагаемая дата родов: {formatRussianDate(dueDate)}
                  </Text>
                )}
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
