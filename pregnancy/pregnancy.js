import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View, Text, TextInput, TouchableWithoutFeedback, Keyboard,
  KeyboardAvoidingView, Platform, ScrollView, Animated, Easing, Alert, Pressable, StyleSheet
} from "react-native";
import { useEvent } from "expo";
import { VideoView, useVideoPlayer } from "expo-video";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const Date_pregnancy = () => {
  // ВАЖНО: expo-video требует dev build (не Expo Go)
  const videoRef = useRef(null);

  const player = useVideoPlayer(require("../g.mp4"), (p) => {
    p.loop = true;
    p.muted = false;
    p.volume = 1.0;
    // Автостарт — по желанию:
    p.play();
  });

  // Корректный способ получать статус/playing:
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });

  const [lastMenstrualPeriod, setLastMenstrualPeriod] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [manualDateInput, setManualDateInput] = useState("");
  const [week, setWeek] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  // Анимации
  const fadeCards = useRef(new Animated.Value(0)).current;
  const slideVideo = useRef(new Animated.Value(20)).current;
  const slideForm = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeCards, { toValue: 1, duration: 350, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(slideVideo, { toValue: 0, duration: 400, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(slideForm, { toValue: 0, duration: 450, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
  }, []);

  useEffect(() => {
    if (lastMenstrualPeriod) {
      const today = new Date();
      const daysSinceLMP = (today - lastMenstrualPeriod) / (1000 * 60 * 60 * 24);
      const calculatedWeek = Math.floor(daysSinceLMP / 7);
      setWeek(calculatedWeek);
      const due = new Date(lastMenstrualPeriod.getTime() + 40 * 7 * 24 * 60 * 60 * 1000);
      setDueDate(due);
    } else {
      setWeek(null);
      setDueDate(null);
    }
  }, [lastMenstrualPeriod]);

  const formatRussianDate = (date) => {
    try {
      return new Intl.DateTimeFormat("ru-RU", { year: "numeric", month: "long", day: "numeric" }).format(date);
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
    const a = s.split(".").map(Number);
    if (a.length !== 3) return null;
    const d = new Date(a[2], a[1] - 1, a[0]);
    return isNaN(d.getTime()) ? null : d;
  };

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

  const dismissKeyboard = () => Keyboard.dismiss();

  const titleToday = useMemo(() => {
    const d = new Date();
    return new Intl.DateTimeFormat("ru-RU", { year: "numeric", month: "long", day: "numeric" }).format(d);
  }, []);

  // Полноэкранный режим
  const enterFs = () => videoRef.current?.enterFullscreen();

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.root}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBgOverlay} />
            <Text style={styles.headerTitle}>Срок беременности</Text>
            <Text style={styles.headerSubtitle}>{titleToday}</Text>
          </View>

          <ScrollView contentContainerStyle={styles.containerScroll}>
            {/* VIDEO CARD */}
            <Animated.View style={[styles.card, { opacity: fadeCards, transform: [{ translateY: slideVideo }] }]}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="video-outline" size={22} color="#FF6B9D" />
                <Text style={styles.cardHeaderText}>
                  Инфармационное видео о поэтапном развитии ребенка в утробе матери
                </Text>
              </View>

              <View style={styles.videoWrap}>
                <VideoView
                  ref={videoRef}
                  style={styles.video}
                  player={player}
                  nativeControls   // <— просто boolean
                  contentFit="contain"
                  allowsFullscreen
                  allowsPictureInPicture
                  // при желании: onFullscreenEnter / onFullscreenExit
                />
              </View>

              {/* Свои кнопки (дублируют нативные) */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10, justifyContent: "center" }}>
                <Pressable style={({ pressed }) => [styles.controlBtn, pressed && styles.buttonPressed]}
                  onPress={() => (isPlaying ? player.pause() : player.play())}>
                  <Ionicons name={isPlaying ? "pause" : "play"} size={18} color="#0F172A" />
                  <Text style={styles.controlBtnText}>{isPlaying ? "Пауза" : "Пуск"}</Text>
                </Pressable>

                <Pressable style={({ pressed }) => [styles.controlBtn, pressed && styles.buttonPressed]} onPress={enterFs}>
                  <Ionicons name="expand" size={18} color="#0F172A" />
                  <Text style={styles.controlBtnText}>На весь экран</Text>
                </Pressable>

              </View>
            </Animated.View>

            {/* INPUT CARD */}
            <Animated.View style={[styles.card, { opacity: fadeCards, transform: [{ translateY: slideForm }] }]}>
              {!lastMenstrualPeriod ? (
                <View>
                  <Text style={styles.las_day_menstr}>{"Введите первый день  \nпоследней менструации"}</Text>

                  <View style={{ position: "relative", marginTop: 8 }}>
                    <Ionicons name="calendar-outline" size={18} color="#64748B" style={{ position: "absolute", left: 12, top: 14 }} />
                    <TextInput
                      placeholder="Введите дату в формате дд.мм.гггг"
                      value={manualDateInput}
                      onChangeText={(t) => { handleManualDateChange(t); setIsTyping(!!t); }}
                      style={[styles.input, { paddingLeft: 38 }]}
                      keyboardType="numeric"
                      onFocus={() => setIsTyping(true)}
                      onBlur={() => setIsTyping(false)}
                      accessibilityLabel="Поле ввода даты в формате дд.мм.гггг"
                    />
                  </View>

                  {!isTyping && (
                    <Pressable
                      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                      onPress={() => setShowDatePicker(true)}
                      android_ripple={{ color: "#e2e8f0" }}
                      accessibilityRole="button"
                      accessibilityLabel="Открыть каледарь"
                    >
                      <Ionicons name="calendar" size={18} color="#0F172A" />
                      <Text style={styles.las_day_menstr}>Открыть каледарь</Text>
                    </Pressable>
                  )}

                  {showDatePicker && (
                    <View style={{ marginTop: 8 }}>
                      <DateTimePicker
                        testID="dateTimePicker"
                        value={lastMenstrualPeriod || new Date()}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                      />
                    </View>
                  )}
                </View>
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
                    accessibilityLabel="Повторный расчет"
                  >
                    <Ionicons name="refresh" size={18} color="#0F172A" />
                    <Text style={styles.las_day_menstr_1}>Повторный расчет</Text>
                  </Pressable>
                </View>
              )}
            </Animated.View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { paddingTop: 18, paddingBottom: 22, paddingHorizontal: 16, backgroundColor: "#8B5CF6", overflow: "hidden" },
  headerBgOverlay: { position: "absolute", inset: 0, backgroundColor: "#7C3AED", opacity: 0.18 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSubtitle: { color: "rgba(255,255,255,0.9)", marginTop: 4 },
  containerScroll: { padding: 16 },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", padding: 14, marginBottom: 14,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  cardHeaderText: { flex: 1, color: "#0F172A", fontWeight: "700" },
  videoWrap: { borderRadius: 12, overflow: "hidden" },
  video: { width: "100%", aspectRatio: 16 / 9 },
  las_day_menstr: { fontSize: 19, marginVertical: 10, fontWeight: "500", textAlign: "center", color: "#0F172A" },
  las_day_menstr_1: { fontSize: 19, marginVertical: 10, fontWeight: "300", textAlign: "center", color: "#0F172A" },
  result_pregnancy: { fontSize: 25, fontWeight: "normal", marginVertical: 14, textAlign: "center", color: "#0F172A" },
  input: {
    backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    paddingHorizontal: 12, height: 48,
  },
  button: {
    backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 1, borderColor: "#E2E8F0",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
    paddingHorizontal: 14, height: 48, alignItems: "center", justifyContent: "center", marginTop: 18, flexDirection: "row", gap: 8,
  },
  buttonPressed: { transform: [{ scale: 0.98 }] },
  controlBtn: {
    backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0",
    paddingHorizontal: 12, height: 42, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8,
  },
  controlBtnText: { color: "#0F172A", fontWeight: "600" },
});

export default Date_pregnancy;
