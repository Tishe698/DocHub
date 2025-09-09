// WelcomeScreen.jsx — адаптировано под большие шрифты/иконки (доступность), без налезаний
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, animation, borderRadius, shadows, typography } from "../theme";
import styles from "../css/calculate_preparation/WelcomeScreenStyles";
import modalStyles from "../css/calculate_preparation/calculates_css";
import formulas from "./formulas";
// ✅ Правильный импорт Clipboard
import * as Clipboard from "expo-clipboard";

const { height: screenHeight } = Dimensions.get("window");

/** ===================== Настройки масштабирования шрифтов ===================== **/
const FONT_LIMIT = {
  h1: 1.25,   // большие заголовки
  h2: 1.2,    // подзаголовки/крупные кнопки
  body: 1.15, // обычный текст
  small: 1.1, // подписи/бейджи
  emoji: 1.0, // декоративные эмодзи не масштабируем
};

/** ============================== Хелперы ============================== **/
// аккуратный парсер числа: поддерживает запятую и точку, но не обе сразу
const parseNum = (v) => {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  if (s.includes(",") && s.includes(".")) return undefined;
  const normalized = s.replace(",", ".");
  if (!/^[+-]?\d*(?:\.\d+)?$/.test(normalized)) return undefined;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
};

/** ============================== BottomSheet ============================== **/
const BottomSheet = ({ visible, onClose, children, isDark, selectedFormula, onBack }) => {
  const translateY = useSharedValue(screenHeight * 0.05);
  const backdropOpacity = useSharedValue(0);

  const showSheet = () => {
    translateY.value = withSpring(screenHeight * 0.05, { damping: 15 });
    backdropOpacity.value = withTiming(1, { duration: 300 });
  };

  const hideSheet = () => {
    translateY.value = withSpring(screenHeight, { damping: 15 });
    backdropOpacity.value = withTiming(0, { duration: 300 });
    setTimeout(() => runOnJS(onClose)(), 300);
  };

  React.useEffect(() => {
    if (visible) showSheet();
    else hideSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 1000,
        },
        backdropStyle,
      ]}
      pointerEvents="auto"
    >
      {/* Шторка с контентом */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: screenHeight * 0.95,
            backgroundColor: '#ffffff', // Белый фон для основного контейнера
            borderTopLeftRadius: borderRadius.xxl,
            borderTopRightRadius: borderRadius.xxl,
            ...shadows.lg,
          },
          sheetStyle,
        ]}
      >
        {/* Кнопка закрытия (угол) */}
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 80,
            height: 60,
            backgroundColor: '#f8fafc', // Светло-серый фон для кнопок
            borderBottomLeftRadius: borderRadius.xl,
            borderWidth: 1,
            borderTopWidth: 0,
            borderRightWidth: 0,
            borderColor: isDark ? colors.dark.border : colors.light.border,
            zIndex: 15,
          }}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            onPress={hideSheet}
            style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 8, paddingRight: 8 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Закрыть окно расчётов"
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: '#64748b', // Темно-серый для хорошей видимости на белом фоне
              }}
              allowFontScaling
              maxFontSizeMultiplier={FONT_LIMIT.h2}
            >
              ✕
            </Text>
          </TouchableOpacity>
        </View>

        {/* Кнопка назад (угол) */}
        {selectedFormula && onBack && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 80,
              height: 60,
              backgroundColor: '#f8fafc', // Светло-серый фон для кнопок
              borderBottomRightRadius: borderRadius.xl,
              borderWidth: 1,
              borderTopWidth: 0,
              borderLeftWidth: 0,
              borderColor: isDark ? colors.dark.border : colors.light.border,
              zIndex: 15,
            }}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              onPress={onBack}
              style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 8, paddingLeft: 8 }}
              activeOpacity={0.7}
              accessibilityLabel="Вернуться к списку препаратов"
              accessibilityRole="button"
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  color: '#64748b', // Темно-серый для хорошей видимости на белом фоне
                }}
                allowFontScaling
                maxFontSizeMultiplier={FONT_LIMIT.h2}
              >
                ←
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Перетягиваемая полоска */}
        <TouchableOpacity
          onPress={hideSheet}
          style={{
            alignSelf: "center",
            width: 40,
            height: 4,
            backgroundColor: '#e5e7eb', // Серый цвет для разделителя
            borderRadius: 2,
            marginTop: spacing.sm,
            marginBottom: spacing.md,
          }}
          accessibilityRole="button"
          accessibilityLabel="Закрыть окно"
        />

        {children}
      </Animated.View>
    </Animated.View>
  );
};

/** ============================== Экран ============================== **/
const WelcomeScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [modalVisible, setModalVisible] = useState(false);
  const [inputs, setInputs] = useState({});
  const [results, setResults] = useState({});
  const [selectedFormula, setSelectedFormula] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const scrollRef = useRef(null);

  const hasFormulaToCalculate = !!selectedFormula?.formula;

  // Динамические цифры
  const totalDrugs = formulas.length;
  const totalCalcs = React.useMemo(
    () => formulas.filter((f) => typeof f.formula === "function").length,
    []
  );

  /** ============================== UI-хелперы ============================== **/
  const showModal = (formula) => {
    setSelectedFormula(formula ?? null);
    setModalVisible(true);
    setInputs({});
    setResults({});
  };

  const hideModal = () => {
    setModalVisible(false);
    setSelectedFormula(null);
    setInputs({});
    setResults({});
    setSearchTerm("");
  };

  const getInputType = (inputName, inputLabel) => {
    const lowerName = (inputName || "").toLowerCase();
    const lowerLabel = (inputLabel || "").toLowerCase();
    if (
      lowerName.includes("route") ||
      lowerName.includes("маршрут") ||
      lowerName.includes("путь") ||
      lowerLabel.includes("route") ||
      lowerLabel.includes("маршрут") ||
      lowerLabel.includes("путь") ||
      lowerLabel.includes("введение") ||
      lowerLabel.includes("метод")
    ) {
      return "text";
    }
    return "numeric";
  };

  const highlightSearchTerm = (text, term) => {
    if (!term.trim()) return <Text allowFontScaling maxFontSizeMultiplier={FONT_LIMIT.body}>{text}</Text>;
    const safe = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${safe})`, "i"); // без 'g'
    const parts = String(text).split(re);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <Text
          key={i}
          style={{
            backgroundColor: '#dbeafe', // Светло-синий фон для выделения
            fontWeight: "600",
            color: '#1e40af', // Темно-синий для выделенного текста
          }}
          allowFontScaling
          maxFontSizeMultiplier={FONT_LIMIT.body}
        >
          {part}
        </Text>
      ) : (
        <Text key={i} allowFontScaling maxFontSizeMultiplier={FONT_LIMIT.body}>
          {part}
        </Text>
      )
    );
  };

  const handleInputChange = (name, value) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  /** ============================== Валидация и расчёты ============================== **/
  const validateInputs = (formula) => {
    const errors = [];
    const clean = {};
    const map = formula.inputs || {};

    Object.keys(map).forEach((key) => {
      const label = map[key] || key;
      const type = getInputType(key, label);
      const raw = inputs[key];

      if (type === "text") {
        if (!raw || String(raw).trim() === "") errors.push(label);
        else clean[key] = String(raw).trim();
        return;
      }

      const n = parseNum(raw);
      if (n === undefined || n <= 0) errors.push(label);
      else clean[key] = n;
    });

    return { ok: errors.length === 0, errors, clean };
  };

  const fmtValue = (v, unit) => {
    if (unit === "таб") {
      const quarters = Math.round(v * 4 + Number.EPSILON) / 4;
      return `${quarters} ${unit}`;
    }
    if (unit === "кап") return `${Math.round(v)} ${unit}`;
    if (unit === "мл") return v < 1 ? `${v.toFixed(2)} ${unit}` : `${v.toFixed(1)} ${unit}`;
    if (unit === "мкг" || unit === "мг" || unit === "ЕД")
      return v < 10 ? `${v.toFixed(2)} ${unit}` : `${v.toFixed(0)} ${unit}`;
    return String(v);
  };

  const copyResults = async () => {
    try {
      if (!results?.success) return;
      const lines = [
        `📝 ${results.formula}`,
        ...results.items.map(
          (i) => `${i.name}: ${i.text}${i.status === "high" ? " (↑)" : i.status === "low" ? " (↓)" : ""}`
        ),
      ];
      await Clipboard.setStringAsync(lines.join("\n")); // ✅ корректный метод
      Alert.alert("Скопировано", "Результаты скопированы в буфер обмена");
    } catch {
      Alert.alert("Ошибка", "Не удалось скопировать результаты");
    }
  };

  const calculateResult = () => {
    if (!selectedFormula) return;

    const { ok, errors, clean } = validateInputs(selectedFormula);
    if (!ok) {
      setResults({
        error: true,
        type: "validation",
        message: `Пожалуйста, заполните корректно: ${errors.join(", ")}`,
      });
      return;
    }

    try {
      const raw = selectedFormula.formula(clean) || {};
      const units = selectedFormula.units || {};
      const labels = selectedFormula.labels || {};
      const limits = selectedFormula.limits || {}; // { result1: {min, max}, ... }

      const items = [];
      const pushItem = (key) => {
        if (!(key in raw)) return;
        const val = raw[key];

        if (typeof val === "number" && Number.isFinite(val)) {
          const unit = units[key];
          const label =
            labels[key] ||
            (unit ? (unit === "мл" ? "Объём" : "Доза") : `Результат ${key.replace("result", "")}`);

          const lim = limits[key] || {};
          let status = "ok";
          if (Number.isFinite(lim.min) && val < lim.min) status = "low";
          if (Number.isFinite(lim.max) && val > lim.max) status = "high";

          items.push({
            name: label,
            unit,
            value: val,
            text: unit ? fmtValue(val, unit) : String(val),
            status, // ok | low | high
          });
        } else if (typeof val === "string" && val.trim()) {
          items.push({
            name: labels[key] || "Примечание",
            unit: "",
            value: null,
            text: val,
            status: "info",
          });
        }
      };

      ["result1", "result2", "result3", "result4"].forEach(pushItem);
      if (!items.length) throw new Error("Формула не вернула результатов");

      setResults({
        success: true,
        items,
        formula: selectedFormula.name,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      setResults({
        error: true,
        type: "calculation",
        message: `Ошибка при выполнении расчёта: ${error.message}. Проверьте введённые данные.`,
      });
    }
  };

  /** ============================== Поиск ============================== **/
  const getFilteredFormulas = () => {
    if (!searchTerm.trim()) return formulas;

    const searchLower = searchTerm.toLowerCase().trim();
    return formulas
      .filter((formula) => {
        const nameLower = formula.name.toLowerCase();
        const descLower = formula.description ? formula.description.toLowerCase() : "";

        if (nameLower.includes(searchLower)) return true;
        if (descLower.includes(searchLower)) return true;

        const searchWords = searchLower.split(/\s+/);
        const nameWords = nameLower.split(/[\s\-]+/);

        for (const searchWord of searchWords) {
          if (searchWord.length < 2) continue;
          for (const nameWord of nameWords) {
            if (nameWord.startsWith(searchWord) || searchWord.startsWith(nameWord)) return true;
          }
        }

        const abbreviations = {
          ан: "анальгин",
          ад: "адреналин",
          ам: "амиодарон",
          ли: "лидокаин",
          па: "парацетамол",
          иб: "ибупрофен",
          ас: "аскорбин",
          ин: "инсулин",
          гл: "глюкоза",
        };
        for (const [abbr, full] of Object.entries(abbreviations)) {
          if (searchLower === abbr && (nameLower.includes(full) || descLower.includes(full))) return true;
        }

        return false;
      })
      .sort((a, b) => {
        const aNameMatch = a.name.toLowerCase().includes(searchLower);
        const bNameMatch = b.name.toLowerCase().includes(searchLower);
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        return a.name.length - b.name.length;
      });
  };

  /** ============================== Рендер ============================== **/
  return (
    <SafeAreaView style={[styles.container, isDark && styles.container_dark]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: spacing.xl * 2,
        }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(animation.normal)}>
          <View style={{ alignItems: "center", marginBottom: spacing.md, paddingHorizontal: spacing.lg }}>
            <Text
              style={[styles.welcomeText, isDark && styles.welcomeText_dark, { fontSize: 24, color: 'rgb(31, 41, 55)' }]}
              allowFontScaling
              maxFontSizeMultiplier={FONT_LIMIT.h1}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              <Text allowFontScaling={false} maxFontSizeMultiplier={FONT_LIMIT.emoji} style={{ color: 'rgb(31, 41, 55)' }}>🏥 </Text>
              Медицинские расчёты
            </Text>

            <Text
              style={[styles.subtitle, isDark && styles.subtitle_dark, { fontSize: 16, marginBottom: spacing.sm, color: 'rgb(31, 41, 55)' }]}
              allowFontScaling
              maxFontSizeMultiplier={FONT_LIMIT.h2}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              <Text allowFontScaling={false} maxFontSizeMultiplier={FONT_LIMIT.emoji} style={{ color: 'rgb(31, 41, 55)' }}>💉 </Text>
              Профессиональный калькулятор дозировок
            </Text>
          </View>

          {/* Stats (резиновая сетка) */}
          <View style={{ marginBottom: spacing.lg, paddingHorizontal: spacing.lg }}>
            <Animated.View entering={FadeInUp.delay(100).duration(animation.normal)}>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  rowGap: spacing.xs,
                  columnGap: spacing.xs,
                  marginBottom: spacing.lg,
                }}
              >
                {/* Карта 1 */}
                <View
                  style={{
                    backgroundColor: 'rgb(59, 130, 246)', // Синий фон для блока Препараты
                    borderRadius: borderRadius.lg,
                    padding: spacing.sm,
                    alignItems: "center",
                    flexBasis: "45%",
                    minWidth: 140,
                    minHeight: 80,
                    ...shadows.sm,
                    borderWidth: 1,
                    borderColor: '#d1d5db', // Серый цвет границ
                  }}
                >
                  <Text allowFontScaling={false} maxFontSizeMultiplier={FONT_LIMIT.emoji} style={{ fontSize: 20, marginBottom: spacing.xs }}>
                    💊
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#ffffff', // Белый текст для видимости на синем фоне
                      textAlign: "center",
                    }}
                    allowFontScaling
                    maxFontSizeMultiplier={FONT_LIMIT.small}
                    numberOfLines={1}
                  >
                    Препараты
                  </Text>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: '#ffffff', // Белый текст для видимости на синем фоне
                    }}
                    allowFontScaling
                    maxFontSizeMultiplier={FONT_LIMIT.h2}
                    numberOfLines={1}
                  >
                    {totalDrugs}
                  </Text>
                </View>

                {/* Карта 2 */}
                <View
                  style={{
                    backgroundColor: 'rgb(59, 130, 246)', // Синий фон для блока Мгновенный результат
                    borderRadius: borderRadius.lg,
                    padding: spacing.sm,
                    alignItems: "center",
                    flexBasis: "45%",
                    minWidth: 140,
                    minHeight: 80,
                    ...shadows.sm,
                    borderWidth: 1,
                    borderColor: '#d1d5db', // Серый цвет границ
                  }}
                >
                  <Text allowFontScaling={false} maxFontSizeMultiplier={FONT_LIMIT.emoji} style={{ fontSize: 20, marginBottom: spacing.xs }}>
                    ⚡
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#ffffff', // Белый текст для видимости на синем фоне
                      textAlign: "center",
                    }}
                    allowFontScaling
                    maxFontSizeMultiplier={FONT_LIMIT.small}
                    numberOfLines={1}
                  >
                    Мгновенный
                  </Text>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: '#ffffff', // Белый текст для видимости на синем фоне
                    }}
                    allowFontScaling
                    maxFontSizeMultiplier={FONT_LIMIT.h2}
                    numberOfLines={1}
                  >
                    Результат
                  </Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Главный CTA */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(animation.normal)}
          style={{
            marginBottom: spacing.xl,
            paddingHorizontal: spacing.lg,
            flexShrink: 0,
          }}
        >
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={{
              backgroundColor: isDark ? colors.dark.primary : colors.light.primary,
              borderRadius: borderRadius.xl,
              padding: spacing.xl,
              alignItems: "center",
              marginBottom: spacing.lg,
              alignSelf: "stretch",
              minHeight: 112,
              flexShrink: 0,
              ...shadows.lg,
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Открыть медицинский калькулятор"
          >
            <Text
              style={{ color: colors.light.surface, fontSize: 20, fontWeight: "700", marginBottom: spacing.sm, textAlign: "center" }}
              allowFontScaling
              maxFontSizeMultiplier={FONT_LIMIT.h2}
              numberOfLines={2}
              {...(Platform.OS === "ios" ? { adjustsFontSizeToFit: true } : {})}
            >
              <Text allowFontScaling={false} maxFontSizeMultiplier={FONT_LIMIT.emoji}>💊 </Text>
              Медицинский калькулятор
            </Text>

            <Text
              style={{ color: colors.light.surface, fontSize: 16, opacity: 0.9, textAlign: "center", lineHeight: 22 }}
              allowFontScaling
              maxFontSizeMultiplier={FONT_LIMIT.body}
              numberOfLines={3}
              {...(Platform.OS === "ios" ? { adjustsFontSizeToFit: true } : {})}
            >
              Расчёт дозировок препаратов и объёмов растворов для точного лечения
            </Text>
          </TouchableOpacity>

          {/* Быстрый доступ */}
          <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: spacing.xl }}>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={{
                backgroundColor: '#f8fafc', // Светло-серый фон для кнопок
                borderRadius: borderRadius.lg,
                padding: spacing.lg,
                alignItems: "center",
                minWidth: 200,
                maxWidth: "90%",
                alignSelf: "center",
                marginHorizontal: spacing.sm,
                borderWidth: 1,
                borderColor: isDark ? colors.dark.border : colors.light.border,
                flexShrink: 0,
              }}
              activeOpacity={0.7}
              accessibilityLabel="Открыть поиск препаратов"
              accessibilityRole="button"
            >
              <Text allowFontScaling={false} maxFontSizeMultiplier={FONT_LIMIT.emoji} style={{ fontSize: 24, marginBottom: spacing.sm }}>
                🔍
              </Text>
              <Text
                style={{
                  ...typography.caption,
                  color: '#1f2937', // Темно-серый для текста кнопки поиска
                  textAlign: "center",
                  fontWeight: "600",
                }}
                allowFontScaling
                maxFontSizeMultiplier={FONT_LIMIT.body}
                numberOfLines={1}
              >
                Поиск
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Safety */}
        <Animated.View
          entering={FadeInUp.delay(600).duration(animation.normal)}
          style={{
            marginBottom: spacing.xl,
            paddingHorizontal: spacing.lg,
            flexShrink: 0,
          }}
        >
          <View
            style={{
              backgroundColor: '#f8fafc', // Светло-серый фон для кнопок
              borderRadius: borderRadius.xl,
              padding: spacing.xl,
              borderWidth: 2,
              borderColor: isDark ? "#6B7280" : "#9CA3AF",
              borderLeftWidth: 6,
            }}
          >
            <View
              style={{
                alignItems: "center",
                marginBottom: spacing.md,
                paddingBottom: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: '#d1d5db', // Серый цвет границы
              }}
            >
              <Text allowFontScaling={false} maxFontSizeMultiplier={FONT_LIMIT.emoji} style={{ fontSize: 32, marginBottom: spacing.sm }}>
                🛡️
              </Text>
              <Text
                style={{
                  ...typography.h5,
                  color: isDark ? "#374151" : "#6B7280",
                  fontWeight: "700",
                  textAlign: "center",
                }}
                allowFontScaling
                maxFontSizeMultiplier={FONT_LIMIT.h2}
                numberOfLines={1}
                {...(Platform.OS === "ios" ? { adjustsFontSizeToFit: true } : {})}
              >
                Безопасность превыше всего
              </Text>
            </View>

            <Text
              style={{
                ...typography.body2,
                color: '#1f2937', // Темно-серый для текста безопасности
                lineHeight: 22,
                textAlign: "center",
                fontWeight: "500",
              }}
              allowFontScaling
              maxFontSizeMultiplier={FONT_LIMIT.body}
            >
              Все расчеты носят рекомендательный характер.{"\n"}Консультируйтесь с лечащим врачом перед{"\n"}применением препаратов.
            </Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: spacing.md,
                paddingTop: spacing.sm,
                borderTopWidth: 1,
                borderTopColor: isDark ? colors.dark.border : colors.light.border,
              }}
            >
              <Text
                style={{ ...typography.caption, color: isDark ? "#10B981" : "#059669", fontWeight: "600" }}
                allowFontScaling
                maxFontSizeMultiplier={FONT_LIMIT.small}
                numberOfLines={1}
              >
                ⚕️ Медицинская ответственность
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* BottomSheet */}
      <BottomSheet
        visible={modalVisible}
        onClose={hideModal}
        isDark={isDark}
        selectedFormula={selectedFormula}
        onBack={() => {
          setSelectedFormula(null);
          setInputs({});
          setResults({});
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1, paddingHorizontal: spacing.lg }}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: spacing.xl * 2, flexGrow: 1, minHeight: screenHeight * 0.85 }}
            scrollEventThrottle={16}
            bounces
            alwaysBounceVertical
            pointerEvents="auto"
            nestedScrollEnabled
          >
            {/* Header внутри модалки */}
            <View style={[modalStyles.modalHeader, { marginTop: spacing.xl }]}>
              {selectedFormula ? (
                <>
                  <Text
                    style={[modalStyles.modalTitle, isDark && modalStyles.modalTitle_dark, { fontSize: 24 }]}
                    numberOfLines={2}
                    allowFontScaling
                    maxFontSizeMultiplier={FONT_LIMIT.h2}
                    {...(Platform.OS === "ios" ? { adjustsFontSizeToFit: true } : {})}
                  >
                    <Text allowFontScaling={false} maxFontSizeMultiplier={FONT_LIMIT.emoji}>💊 </Text>
                    {selectedFormula.name}
                  </Text>
                  <Text
                    style={[modalStyles.modalSubtitle, isDark && modalStyles.modalSubtitle_dark]}
                    allowFontScaling
                    maxFontSizeMultiplier={FONT_LIMIT.body}
                    numberOfLines={2}
                  >
                    🩺 Введите необходимые значения
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={[modalStyles.modalTitle, isDark && modalStyles.modalTitle_dark, { fontSize: 24 }]}
                    numberOfLines={2}
                    allowFontScaling
                    maxFontSizeMultiplier={FONT_LIMIT.h2}
                    {...(Platform.OS === "ios" ? { adjustsFontSizeToFit: true } : {})}
                  >
                    <Text allowFontScaling={false} maxFontSizeMultiplier={FONT_LIMIT.emoji}>💊 </Text>
                    Калькулятор препаратов
                  </Text>
                  <Text
                    style={[modalStyles.modalSubtitle, isDark && modalStyles.modalSubtitle_dark]}
                    allowFontScaling
                    maxFontSizeMultiplier={FONT_LIMIT.body}
                    numberOfLines={2}
                  >
                    🔍 Поиск и расчет дозировок
                  </Text>
                </>
              )}
            </View>

            {/* Поиск */}
            {!selectedFormula && (
              <View style={modalStyles.searchContainer}>
                <TextInput
                  style={[modalStyles.searchInputWithIcon, isDark && modalStyles.searchInputWithIcon_dark]}
                  placeholder="🔍 Поиск препаратов (анальгин, адреналин...)"
                  placeholderTextColor={isDark ? colors.dark.text.tertiary : colors.light.text.tertiary}
                  onChangeText={setSearchTerm}
                  value={searchTerm}
                  accessibilityLabel="Поле поиска формул"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  allowFontScaling
                />
                {searchTerm.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchTerm("")}
                    style={modalStyles.crossIcon}
                    accessibilityLabel="Очистить поиск"
                    accessibilityRole="button"
                  >
                    <Text style={modalStyles.crossImage} allowFontScaling maxFontSizeMultiplier={FONT_LIMIT.h2}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Список формул */}
            {!selectedFormula && (
              <View style={[modalStyles.listContainer, isDark && modalStyles.listContainer_dark]}>
                {getFilteredFormulas().length === 0 && searchTerm.trim() !== "" && (
                  <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: spacing.xl }}>
                    <Text
                      style={{
                        fontSize: 16,
                        color: '#64748b', // Темно-серый для хорошей видимости на белом фоне
                        textAlign: "center",
                      }}
                      allowFontScaling
                      maxFontSizeMultiplier={FONT_LIMIT.body}
                    >
                      🔍 Препараты не найдены{"\n"}Попробуйте другой поисковый запрос
                    </Text>
                  </View>
                )}

                {searchTerm.trim() !== "" && (
                  <Animated.View
                    entering={FadeIn.duration(animation.fast)}
                    style={{
                      padding: spacing.sm,
                      backgroundColor: isDark ? colors.dark.surfaceVariant : colors.light.surfaceVariant,
                      borderRadius: borderRadius.md,
                      marginBottom: spacing.md,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{ color: isDark ? colors.dark.text.secondary : colors.light.text.secondary, fontSize: 14 }}
                      allowFontScaling
                      maxFontSizeMultiplier={FONT_LIMIT.small}
                      numberOfLines={1}
                    >
                      🔍 Найдено: {getFilteredFormulas().length} из {formulas.length}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setSearchTerm("")}
                      style={{
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.xs,
                        backgroundColor: '#f8fafc', // Светло-серый фон для кнопок
                        borderRadius: borderRadius.sm,
                      }}
                    >
                      <Text
                        style={{
                          color: '#1f2937', // Темно-серый для основного текста на белом фоне
                          fontSize: 12,
                          fontWeight: "500",
                        }}
                        allowFontScaling
                        maxFontSizeMultiplier={FONT_LIMIT.small}
                      >
                        ✕ Очистить
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}

                {getFilteredFormulas().length > 0 &&
                  getFilteredFormulas().map((formula, index) => (
                    <Animated.View key={formula.name} entering={FadeInUp.delay(index * 50).duration(animation.fast)}>
                      <TouchableOpacity
                        onPress={() => showModal(formula)}
                        style={[
                          modalStyles.formulaTouchable,
                          isDark && modalStyles.formulaTouchablePressed_dark,
                          {
                            backgroundColor: '#f8fafc', // Светло-серый фон для кнопок
                            borderWidth: 1,
                            borderColor: '#d1d5db', // Серый цвет границ
                            marginBottom: spacing.sm,
                            borderRadius: borderRadius.lg,
                            padding: spacing.md,
                          },
                        ]}
                        accessibilityLabel={`Выбрать препарат ${formula.name}`}
                        accessibilityRole="button"
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <View style={{ flex: 1, paddingRight: spacing.sm }}>
                            <Text
                              style={[modalStyles.formulaName, isDark && modalStyles.formulaName_dark]}
                              allowFontScaling
                              maxFontSizeMultiplier={FONT_LIMIT.h2}
                              numberOfLines={2}
                              {...(Platform.OS === "ios" ? { adjustsFontSizeToFit: true } : {})}
                            >
                              {highlightSearchTerm(formula.name, searchTerm)}
                            </Text>
                            {!!formula.description && (
                              <Text
                                style={[modalStyles.formulaDescription, isDark && modalStyles.formulaDescription_dark]}
                                allowFontScaling
                                maxFontSizeMultiplier={FONT_LIMIT.body}
                                numberOfLines={2}
                              >
                                {highlightSearchTerm(formula.description, searchTerm)}
                              </Text>
                            )}
                          </View>
                          {formula.warnings && formula.warnings.length > 0 && (
                            <Text
                              style={{ fontSize: 16, color: colors.light.warning }}
                              allowFontScaling={false}
                              maxFontSizeMultiplier={FONT_LIMIT.emoji}
                            >
                              ⚠️
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
              </View>
            )}

            {/* Контент формулы */}
            {selectedFormula && (
              <View style={modalStyles.modalInner}>
                <View style={modalStyles.inputContainer}>
                  {/* Предупреждения */}
                  {selectedFormula.warnings && selectedFormula.warnings.length > 0 && (
                    <View style={{ marginBottom: spacing.md }}>
                      {selectedFormula.warnings.map((warning, index) => (
                        <Animated.Text
                          key={`warning-${index}`}
                          entering={FadeInUp.delay(index * 50).duration(animation.fast)}
                          style={[modalStyles.warningText, isDark && { color: colors.dark.danger }]}
                          allowFontScaling
                          maxFontSizeMultiplier={FONT_LIMIT.body}
                        >
                          ⚠️ Внимание: {warning}
                        </Animated.Text>
                      ))}
                    </View>
                  )}

                  {/* Поля ввода */}
                  {Object.keys(selectedFormula.inputs || {}).map((inputName, index) => {
                    const label = selectedFormula.inputs[inputName] || inputName;
                    const type = getInputType(inputName, label);
                    const raw = inputs[inputName];
                    const num = type === "numeric" ? parseNum(raw) : undefined;

                    const hasValue = type === "text" ? !!(raw && String(raw).trim() !== "") : raw !== undefined && String(raw) !== "";
                    const isValid = type === "text" ? hasValue : num !== undefined && num > 0;

                    const labelText = (label || "").toLowerCase();
                    const unitHint =
                      labelText.includes("вес") ? "кг" :
                      labelText.includes("возраст") ? "лет" :
                      labelText.includes("рост") ? "см" : null;

                    return (
                      <Animated.View key={inputName} entering={FadeInUp.delay(index * 100).duration(animation.normal)} style={{ marginBottom: spacing.md }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: '#1f2937', // Темно-серый для основного текста на белом фоне
                            marginBottom: spacing.xs,
                          }}
                          allowFontScaling
                          maxFontSizeMultiplier={FONT_LIMIT.small}
                          numberOfLines={2}
                        >
                          📝 {label}
                        </Text>

                        <View style={{ position: "relative" }}>
                          <TextInput
                            style={{
                              backgroundColor: '#f8fafc', // Светло-серый фон для кнопок
                              borderRadius: borderRadius.lg,
                              padding: spacing.md,
                              paddingRight: spacing.xxxl,
                              fontSize: 16,
                              color: '#1f2937', // Темно-серый для основного текста на белом фоне
                              borderWidth: 2,
                              borderColor: hasValue
                                ? (isValid ? colors.light.success : colors.light.danger)
                                : (isDark ? colors.dark.border : colors.light.border),
                              ...shadows.sm,
                            }}
                            onChangeText={(text) => handleInputChange(inputName, text)}
                            value={raw !== undefined && raw !== null ? String(raw) : ""}
                            keyboardType={type === "numeric" ? "decimal-pad" : "default"}
                            placeholder={`Введите ${label.toLowerCase()}`}
                            placeholderTextColor={isDark ? colors.dark.text.tertiary : colors.light.text.tertiary}
                            accessibilityLabel={`Введите ${label}`}
                            autoCapitalize={type === "text" ? "none" : "sentences"}
                            allowFontScaling
                            maxFontSizeMultiplier={FONT_LIMIT.body}
                          />

                          {/* Подсказка единицы */}
                          {type === "numeric" && unitHint && (
                            <View
                              style={{
                                position: "absolute",
                                right: spacing.md,
                                top: "50%",
                                transform: [{ translateY: -10 }],
                                backgroundColor: isDark ? colors.dark.surfaceVariant : colors.light.surfaceVariant,
                                borderRadius: borderRadius.sm,
                                paddingHorizontal: spacing.xs,
                                paddingVertical: 2,
                              }}
                              pointerEvents="none"
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "600",
                                  color: '#64748b', // Темно-серый для хорошей видимости на белом фоне
                                }}
                                allowFontScaling
                                maxFontSizeMultiplier={FONT_LIMIT.small}
                              >
                                {unitHint}
                              </Text>
                            </View>
                          )}

                          {/* Индикатор валидности */}
                          {hasValue && (
                            <View
                              style={{
                                position: "absolute",
                                right: -8,
                                top: "50%",
                                transform: [{ translateY: -8 }],
                                width: 16,
                                height: 16,
                                borderRadius: 8,
                                backgroundColor: isValid ? colors.light.success : colors.light.danger,
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                              pointerEvents="none"
                            >
                              <Text style={{ fontSize: 10, color: "#FFFFFF", fontWeight: "bold" }} allowFontScaling={false}>
                                {isValid ? "✓" : "!"}
                              </Text>
                            </View>
                          )}
                        </View>
                      </Animated.View>
                    );
                  })}

                  {/* Кнопки действий */}
                  {hasFormulaToCalculate && (
                    <Animated.View entering={FadeInUp.delay(300).duration(animation.normal)} style={{ marginTop: spacing.lg }}>
                      <TouchableOpacity
                        onPress={calculateResult}
                        style={{
                          backgroundColor: isDark ? colors.dark.primary : colors.light.primary,
                          borderRadius: borderRadius.xl,
                          padding: spacing.lg,
                          alignItems: "center",
                          marginBottom: spacing.md,
                          ...shadows.md,
                        }}
                        activeOpacity={0.8}
                        accessibilityLabel="Выполнить расчет"
                        accessibilityRole="button"
                      >
                        <Text
                          style={{ color: colors.light.surface, fontSize: 18, fontWeight: "700", textAlign: "center" }}
                          allowFontScaling
                          maxFontSizeMultiplier={FONT_LIMIT.h2}
                          numberOfLines={1}
                        >
                          🧮 Рассчитать
                        </Text>
                        <Text
                          style={{ color: colors.light.surface, fontSize: 14, opacity: 0.9, marginTop: spacing.xs, textAlign: "center" }}
                          allowFontScaling
                          maxFontSizeMultiplier={FONT_LIMIT.small}
                          numberOfLines={2}
                        >
                          Нажмите для получения результата
                        </Text>
                      </TouchableOpacity>

                      {(Object.keys(inputs).length > 0 || Object.keys(results).length > 0) && (
                        <TouchableOpacity
                          onPress={() => {
                            setInputs({});
                            setResults({});
                          }}
                          style={{
                            backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
                            borderRadius: borderRadius.lg,
                            padding: spacing.md,
                            alignItems: "center",
                            borderWidth: 1,
                            borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.2)",
                          }}
                          activeOpacity={0.7}
                          accessibilityLabel="Очистить все поля и результаты"
                          accessibilityRole="button"
                        >
                          <Text
                            style={{ color: isDark ? "#FCA5A5" : "#DC2626", fontSize: 16, fontWeight: "600", textAlign: "center" }}
                            allowFontScaling
                            maxFontSizeMultiplier={FONT_LIMIT.body}
                            numberOfLines={1}
                          >
                            🗑️ Очистить всё
                          </Text>
                        </TouchableOpacity>
                      )}
                    </Animated.View>
                  )}
                </View>

                {/* Результаты */}
                {Object.keys(results).length > 0 && (
                  <View style={{ marginTop: spacing.lg }}>
                    {/* Ошибки */}
                    {results.error && (
                      <Animated.View
                        entering={FadeInUp.duration(animation.fast)}
                        style={{
                          backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
                          borderRadius: borderRadius.lg,
                          padding: spacing.lg,
                          borderWidth: 1,
                          borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.2)",
                          marginBottom: spacing.md,
                        }}
                      >
                        <Text
                          style={{ fontSize: 16, fontWeight: "600", color: isDark ? "#FCA5A5" : "#DC2626", textAlign: "center", marginBottom: spacing.xs }}
                          allowFontScaling
                          maxFontSizeMultiplier={FONT_LIMIT.h2}
                          numberOfLines={1}
                        >
                          ⚠️ {results.type === "validation" ? "Необходимо заполнить" : "Ошибка расчёта"}
                        </Text>
                        <Text
                          style={{ fontSize: 14, color: isDark ? "#FCA5A5" : "#DC2626", textAlign: "center", lineHeight: 20 }}
                          allowFontScaling
                          maxFontSizeMultiplier={FONT_LIMIT.body}
                        >
                          {results.message}
                        </Text>
                      </Animated.View>
                    )}

                    {/* Успех */}
                    {results.success && (
                      <Animated.View
                        entering={FadeInUp.duration(animation.normal)}
                        style={[modalStyles.resultsContainer, isDark && modalStyles.resultsContainer_dark]}
                      >
                        {/* Header */}
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md }}>
                          <Text
                            style={{ fontSize: 18, fontWeight: "700", color: isDark ? colors.dark.primary : colors.light.primary }}
                            allowFontScaling
                            maxFontSizeMultiplier={FONT_LIMIT.h2}
                            numberOfLines={1}
                          >
                            🧮 Результат расчёта
                          </Text>

                          <View style={{ flexDirection: "row" }}>
                            <TouchableOpacity
                              onPress={copyResults}
                              style={{
                                paddingHorizontal: spacing.sm,
                                paddingVertical: spacing.xs,
                                backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                                borderRadius: borderRadius.md,
                                marginRight: spacing.xs,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: '#64748b', // Темно-серый для хорошей видимости на белом фоне
                                  fontWeight: "500",
                                }}
                                allowFontScaling
                                maxFontSizeMultiplier={FONT_LIMIT.small}
                                numberOfLines={1}
                              >
                                📋 Копировать
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => setResults({})}
                              style={{
                                paddingHorizontal: spacing.sm,
                                paddingVertical: spacing.xs,
                                backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                                borderRadius: borderRadius.md,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: '#64748b', // Темно-серый для хорошей видимости на белом фоне
                                  fontWeight: "500",
                                }}
                                allowFontScaling
                                maxFontSizeMultiplier={FONT_LIMIT.small}
                                numberOfLines={1}
                              >
                                ✕ Сбросить
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Инфо о формуле */}
                        <Text
                          style={{
                            fontSize: 14,
                            color: '#64748b', // Темно-серый для хорошей видимости на белом фоне
                            marginBottom: spacing.md,
                            fontStyle: "italic",
                          }}
                          allowFontScaling
                          maxFontSizeMultiplier={FONT_LIMIT.small}
                          numberOfLines={2}
                        >
                          📝 Препарат: {results.formula}
                        </Text>

                        {/* Строки результатов */}
                        {results.items.map((row, index) => {
                          const border =
                            row.status === "high"
                              ? (isDark ? "#F87171" : "#DC2626")
                              : row.status === "low"
                              ? (isDark ? "#FBBF24" : "#D97706")
                              : (isDark ? colors.dark.border : colors.light.border);

                          const valueColor =
                            row.status === "high"
                              ? (isDark ? "#F87171" : "#DC2626")
                              : row.status === "low"
                              ? (isDark ? "#FBBF24" : "#D97706")
                              : (isDark ? colors.dark.primary : colors.light.primary);

                          const badge = row.status === "high" ? "↑ выше макс." : row.status === "low" ? "↓ ниже мин." : null;

                          return (
                            <Animated.View
                              key={`${row.name}-${index}`}
                              entering={FadeInUp.delay(index * 80).duration(animation.fast)}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                backgroundColor: '#f8fafc', // Светло-серый фон для кнопок
                                borderRadius: borderRadius.lg,
                                padding: spacing.md,
                                marginBottom: spacing.sm,
                                borderWidth: 1,
                                borderColor: border,
                                ...shadows.sm,
                              }}
                            >
                              <View style={{ flex: 1, paddingRight: spacing.sm }}>
                                <Text
                                  style={{ fontSize: 16, fontWeight: "600", color: isDark ? colors.dark.text.primary : colors.light.text.primary }}
                                  allowFontScaling
                                  maxFontSizeMultiplier={FONT_LIMIT.body}
                                  numberOfLines={2}
                                  {...(Platform.OS === "ios" ? { adjustsFontSizeToFit: true } : {})}
                                >
                                  {row.name}
                                </Text>
                                {!!badge && (
                                  <Text
                                    style={{ marginTop: 4, fontSize: 12, fontWeight: "600", color: valueColor }}
                                    allowFontScaling
                                    maxFontSizeMultiplier={FONT_LIMIT.small}
                                    numberOfLines={1}
                                  >
                                    {badge}
                                  </Text>
                                )}
                              </View>
                              <Text
                                style={{ fontSize: 18, fontWeight: "700", color: valueColor, textAlign: "right" }}
                                allowFontScaling
                                maxFontSizeMultiplier={FONT_LIMIT.h2}
                                numberOfLines={1}
                                {...(Platform.OS === "ios" ? { adjustsFontSizeToFit: true } : {})}
                              >
                                {row.text}
                              </Text>
                            </Animated.View>
                          );
                        })}
                      </Animated.View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Отступ */}
            <View style={{ height: spacing.xl }} />

            {/* Футер */}
            <View style={{ height: 200, justifyContent: "center", alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 14,
                  color: '#6b7280', // Серый для мелкого текста на белом фоне
                  textAlign: "center",
                  paddingHorizontal: spacing.lg,
                }}
                allowFontScaling
                maxFontSizeMultiplier={FONT_LIMIT.small}
              >
                📱 Для дополнительной информации обратитесь к лечащему врачу
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </BottomSheet>
    </SafeAreaView>
  );
};

export default WelcomeScreen;
