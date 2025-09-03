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
} from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeInUp,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  withSequence,
  withDelay
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, animation, borderRadius, shadows, typography } from "../theme";
import styles from "../css/calculate_preparation/WelcomeScreenStyles";
import modalStyles from "../css/calculate_preparation/calculates_css";
import formulas from "./formulas";

const { height: screenHeight } = Dimensions.get("window");

const BottomSheet = ({ visible, onClose, children, isDark, selectedFormula, onBack }) => {
  const translateY = useSharedValue(screenHeight);
  const backdropOpacity = useSharedValue(0);

  const showSheet = () => {
    translateY.value = withSpring(0, { damping: 15 });
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
  }, [visible]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      const newTranslateY = context.startY + event.translationY;
      if (newTranslateY >= 0) translateY.value = newTranslateY;
    },
    onEnd: (event) => {
      if (event.translationY > 100 || event.velocityY > 500) runOnJS(hideSheet)();
      else translateY.value = withSpring(0, { damping: 15 });
    },
  });

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
    >
      {/* Шторка с контентом */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View
          style={[
            {
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              top: 0,
              backgroundColor: isDark ? colors.dark.surfaceElevated : colors.light.surface,
              borderTopLeftRadius: borderRadius.xxl,
              borderTopRightRadius: borderRadius.xxl,
              ...shadows.lg,
            },
            sheetStyle,
          ]}
        >
          {/* Полоска для свайпа */}
          <View
            style={{
              alignSelf: "center",
              width: 40,
              height: 4,
              backgroundColor: isDark ? colors.dark.divider : colors.light.divider,
              borderRadius: 2,
              marginTop: spacing.sm,
              marginBottom: spacing.md,
            }}
          />

          {/* Enhanced Close Button */}
          <View style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 80,
            height: 60,
            backgroundColor: isDark ? colors.dark.surface : colors.light.surface,
            borderBottomLeftRadius: borderRadius.xl,
            borderWidth: 1,
            borderTopWidth: 0,
            borderRightWidth: 0,
            borderColor: isDark ? colors.dark.border : colors.light.border,
            zIndex: 15,
          }}>
            <TouchableOpacity
              onPress={hideSheet}
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingTop: 8,
                paddingRight: 8,
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  color: isDark ? colors.dark.text.secondary : colors.light.text.secondary,
                }}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Enhanced Back Button - Same Level as Close Button */}
          {selectedFormula && onBack && (
            <View style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 80,
              height: 60,
              backgroundColor: isDark ? colors.dark.surface : colors.light.surface,
              borderBottomRightRadius: borderRadius.xl,
              borderWidth: 1,
              borderTopWidth: 0,
              borderLeftWidth: 0,
              borderColor: isDark ? colors.dark.border : colors.light.border,
              zIndex: 15,
            }}>
              <TouchableOpacity
                onPress={onBack}
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingTop: 8,
                  paddingLeft: 8,
                }}
                activeOpacity={0.7}
                accessibilityLabel="Вернуться к списку препаратов"
                accessibilityRole="button"
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "600",
                    color: isDark ? colors.dark.text.secondary : colors.light.text.secondary,
                  }}
                >
                  ←
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {children}
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};

const WelcomeScreen = () => {
  const colorScheme = useColorScheme() || "light";
  const isDark = colorScheme === "dark";
  const [modalVisible, setModalVisible] = useState(false);
  const [inputs, setInputs] = useState({});
  const [results, setResults] = useState({});
  const [selectedFormula, setSelectedFormula] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const hasFormulaToCalculate = selectedFormula?.formula !== undefined;

  const showModal = (formula) => {
    setSelectedFormula(formula);
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

  const calculateResult = () => {
    if (!selectedFormula) {
      return;
    }

    // Валидация входных данных
    const inputKeys = Object.keys(selectedFormula.inputs || {});
    const missingInputs = inputKeys.filter(key => {
      const value = inputs[key];
      const isMissing = value === undefined || value === null || value === 0 || isNaN(value);
      return isMissing;
    });

    if (missingInputs.length > 0) {
      setResults({
        error: true,
        message: `Пожалуйста, заполните все поля: ${missingInputs.map(key => selectedFormula.inputs[key]).join(', ')}`,
        type: 'validation'
      });
      return;
    }

    try {
      // Выполнение расчета
      const formulaResults = selectedFormula.formula(inputs);

      // Проверяем, что результаты существуют и являются числами
      if (!formulaResults || typeof formulaResults !== 'object') {
        throw new Error('Формула не вернула корректный результат');
      }

      // Форматирование результатов с единицами измерения
      const formattedResults = {};

      // Проверяем result1
      if (formulaResults.result1 !== undefined && formulaResults.result1 !== null) {
        const result1Value = parseFloat(formulaResults.result1);
        if (!isNaN(result1Value)) {
          formattedResults["💊 Масса препарата"] = `${result1Value.toFixed(2)} мг`;
        } else {
          console.warn('result1 is not a valid number:', formulaResults.result1);
        }
      } else {
        console.warn('result1 is undefined or null');
      }

      // Проверяем result2
      if (formulaResults.result2 !== undefined && formulaResults.result2 !== null) {
        const result2Value = parseFloat(formulaResults.result2);
        if (!isNaN(result2Value)) {
          formattedResults["💉 Объем раствора"] = `${result2Value.toFixed(2)} мл`;
        } else {
          console.warn('result2 is not a valid number:', formulaResults.result2);
        }
      } else {
        console.warn('result2 is undefined or null');
      }

      // Дополнительные результаты если есть
      if (formulaResults.result3 !== undefined && formulaResults.result3 !== null) {
        formattedResults["📊 Дополнительно"] = formulaResults.result3;
      }

      // Проверяем, что есть хотя бы один результат
      if (Object.keys(formattedResults).length === 0) {
        throw new Error('Формула не вернула ни одного валидного результата');
      }

      setResults({
        success: true,
        data: formattedResults,
        timestamp: new Date().toLocaleTimeString(),
        formula: selectedFormula.name
      });

    } catch (error) {
      console.error('Calculation error:', error);
      setResults({
        error: true,
        message: `Ошибка при выполнении расчета: ${error.message}. Проверьте введенные данные.`,
        type: 'calculation'
      });
    }
  };

  const handleInputChange = (name, value) => {
    const numericValue = parseFloat(value) || 0;
    setInputs({ ...inputs, [name]: numericValue });
  };

  // Умный поиск с фильтрацией
  const getFilteredFormulas = () => {
    if (!searchTerm.trim()) return formulas;

    const searchLower = searchTerm.toLowerCase().trim();

    return formulas.filter((formula) => {
      const nameLower = formula.name.toLowerCase();
      const descLower = formula.description ? formula.description.toLowerCase() : '';

      // Точное совпадение в названии
      if (nameLower.includes(searchLower)) return true;

      // Совпадение в описании
      if (descLower.includes(searchLower)) return true;

      // Частичное совпадение по словам
      const searchWords = searchLower.split(/\s+/);
      const nameWords = nameLower.split(/[\s\-]+/);

      for (const searchWord of searchWords) {
        if (searchWord.length < 2) continue;

        for (const nameWord of nameWords) {
          if (nameWord.startsWith(searchWord) || searchWord.startsWith(nameWord)) {
            return true;
          }
        }
      }

      // Поиск по аббревиатурам
      const abbreviations = {
        'ан': 'анальгин',
        'ад': 'адреналин',
        'ам': 'амиодарон',
        'ли': 'лидокаин',
        'па': 'парацетамол',
        'иб': 'ибупрофен',
        'ас': 'аскорбин',
        'ин': 'инсулин',
        'гл': 'глюкоза'
      };

      for (const [abbr, full] of Object.entries(abbreviations)) {
        if (searchLower === abbr && (nameLower.includes(full) || descLower.includes(full))) {
          return true;
        }
      }

      return false;
    }).sort((a, b) => {
      // Сортировка по релевантности
      const aNameMatch = a.name.toLowerCase().includes(searchLower);
      const bNameMatch = b.name.toLowerCase().includes(searchLower);

      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;

      return a.name.length - b.name.length;
    });
  };

  // Функция для выделения найденного текста
  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm.trim()) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      const isMatch = regex.test(part);
      return (
        <Text key={index} style={isMatch ? {
          backgroundColor: isDark ? colors.dark.primary + '40' : colors.light.primary + '40',
          fontWeight: '600',
          color: isDark ? colors.dark.primary : colors.light.primary
        } : {}}>
          {part}
        </Text>
      );
    });
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.container_dark]}>
      {/* Enhanced Header Section with Typography & Shadows */}
      <Animated.View entering={FadeIn.duration(animation.normal)}>
        <View style={{ alignItems: "center", marginBottom: spacing.xl }}>
          <Text style={[styles.welcomeText, isDark && styles.welcomeText_dark]}>
            🏥 Медицинские расчёты
          </Text>
          <Text style={[styles.subtitle, isDark && styles.subtitle_dark]}>
            💉 Профессиональный калькулятор дозировок
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={{ marginBottom: spacing.xl }}>
          <Animated.View entering={FadeInUp.delay(100).duration(animation.normal)}>
            <View style={{
              flexDirection: "row",
              justifyContent: "space-around",
              marginBottom: spacing.lg
            }}>
              <View style={{
                backgroundColor: isDark ? colors.dark.surface : colors.light.surface,
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                alignItems: "center",
                flex: 1,
                marginHorizontal: spacing.xs,
                ...shadows.sm,
                borderWidth: 1,
                borderColor: isDark ? colors.dark.border : colors.light.border,
              }}>
                <Text style={{ fontSize: 24, marginBottom: spacing.xs }}>💊</Text>
                <Text style={{
                  fontSize: typography.caption.fontSize,
                  color: isDark ? colors.dark.text.secondary : colors.light.text.secondary,
                  textAlign: "center"
                }}>
                  Препараты
                </Text>
                <Text style={{
                  fontSize: typography.h4.fontSize,
                  fontWeight: "bold",
                  color: isDark ? colors.dark.text.primary : colors.light.text.primary
                }}>
                  20+
                </Text>
              </View>

              <View style={{
                backgroundColor: isDark ? colors.dark.surface : colors.light.surface,
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                alignItems: "center",
                flex: 1,
                marginHorizontal: spacing.xs,
                ...shadows.sm,
                borderWidth: 1,
                borderColor: isDark ? colors.dark.border : colors.light.border,
              }}>
                <Text style={{ fontSize: 24, marginBottom: spacing.xs }}>🧮</Text>
                <Text style={{
                  fontSize: typography.caption.fontSize,
                  color: isDark ? colors.dark.text.secondary : colors.light.text.secondary,
                  textAlign: "center"
                }}>
                  Расчёты
                </Text>
                <Text style={{
                  fontSize: typography.h4.fontSize,
                  fontWeight: "bold",
                  color: isDark ? colors.dark.text.primary : colors.light.text.primary
                }}>
                  50+
                </Text>
              </View>

              <View style={{
                backgroundColor: isDark ? colors.dark.surface : colors.light.surface,
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                alignItems: "center",
                flex: 1,
                marginHorizontal: spacing.xs,
                ...shadows.sm,
                borderWidth: 1,
                borderColor: isDark ? colors.dark.border : colors.light.border,
              }}>
                <Text style={{ fontSize: 24, marginBottom: spacing.xs }}>⚡</Text>
                <Text style={{
                  fontSize: typography.caption.fontSize,
                  color: isDark ? colors.dark.text.secondary : colors.light.text.secondary,
                  textAlign: "center"
                }}>
                  Мгновенно
                </Text>
                <Text style={{
                  fontSize: typography.caption.fontSize,
                  color: isDark ? colors.dark.text.primary : colors.light.text.primary
                }}>
                  Результат
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Main Action Section */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(animation.normal)}
        style={{ flex: 1, justifyContent: "center" }}
      >
        {/* Enhanced Primary Calculator Button with Gradient & Elevation */}
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={{
            backgroundColor: isDark ? colors.dark.primary : colors.light.primary,
            borderRadius: borderRadius.xl,
            padding: spacing.xl,
            alignItems: "center",
            marginBottom: spacing.lg,
            ...shadows.lg,
          }}
          activeOpacity={0.8}
        >
          <Text
            style={{
              color: colors.light.surface,
              fontSize: 20,
              fontWeight: "700",
              marginBottom: spacing.sm,
            }}
          >
            💊 Медицинский калькулятор
          </Text>
          <Text
            style={{
              color: colors.light.surface,
              fontSize: 16,
              opacity: 0.9,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            Расчёт дозировок препаратов и объёмов растворов для точного лечения
          </Text>
        </TouchableOpacity>

        {/* Interactive Quick Actions with Color-coded Categories */}
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={{
              backgroundColor: isDark ? colors.dark.surface : colors.light.surface,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              alignItems: "center",
              flex: 1,
              marginHorizontal: spacing.sm,
              borderWidth: 1,
              borderColor: isDark ? colors.dark.border : colors.light.border,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 24, marginBottom: spacing.sm }}>🔍</Text>
            <Text style={{
              ...typography.caption,
              color: isDark ? colors.dark.text.primary : colors.light.text.primary,
              textAlign: "center",
              fontWeight: "600"
            }}>
              Поиск
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={{
              backgroundColor: isDark ? colors.dark.surface : colors.light.surface,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              alignItems: "center",
              flex: 1,
              marginHorizontal: spacing.sm,
              borderWidth: 1,
              borderColor: isDark ? colors.dark.border : colors.light.border,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 24, marginBottom: spacing.sm }}>📋</Text>
            <Text style={{
              ...typography.caption,
              color: isDark ? colors.dark.text.primary : colors.light.text.primary,
              textAlign: "center",
              fontWeight: "600"
            }}>
              Все препараты
            </Text>
          </TouchableOpacity>
        </View>

        {/* Enhanced Safety Card with Professional Styling */}
        <Animated.View
          entering={FadeInUp.delay(600).duration(animation.normal)}
          style={{
            marginTop: spacing.xl,
            paddingHorizontal: spacing.lg
          }}
        >
          <View style={{
            backgroundColor: isDark ? colors.dark.surface : colors.light.surface,
            borderRadius: borderRadius.xl,
            padding: spacing.xl,
            borderWidth: 2,
            borderColor: isDark ? "#3B82F6" : "#2563EB",
            borderLeftWidth: 6,
          }}>
            <View style={{
              alignItems: "center",
              marginBottom: spacing.md,
              paddingBottom: spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? colors.dark.border : colors.light.border
            }}>
              <Text style={{
                fontSize: 32,
                marginBottom: spacing.sm
              }}>🛡️</Text>
              <Text style={{
                ...typography.h5,
                color: isDark ? "#3B82F6" : "#2563EB",
                fontWeight: "700",
                textAlign: "center"
              }}>
                Безопасность превыше всего
              </Text>
            </View>

            <Text style={{
              ...typography.body2,
              color: isDark ? colors.dark.text.primary : colors.light.text.primary,
              lineHeight: 22,
              textAlign: "center",
              fontWeight: "500"
            }}>
              Все расчеты носят рекомендательный характер.{'\n'}Консультируйтесь с лечащим врачом перед{'\n'}применением препаратов.
            </Text>

            <View style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: spacing.md,
              paddingTop: spacing.sm,
              borderTopWidth: 1,
              borderTopColor: isDark ? colors.dark.border : colors.light.border
            }}>
              <Text style={{
                ...typography.caption,
                color: isDark ? "#10B981" : "#059669",
                fontWeight: "600"
              }}>
                ⚕️ Медицинская ответственность
              </Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Enhanced Bottom Sheet */}
      <BottomSheet visible={modalVisible} onClose={hideModal} isDark={isDark} selectedFormula={selectedFormula} onBack={() => { setSelectedFormula(null); setInputs({}); setResults({}); }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <ScrollView
            style={{ flex: 1, paddingHorizontal: spacing.lg }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}
            scrollEventThrottle={16}
          >
            {/* Medical Modal Header */}
            <View style={modalStyles.modalHeader}>
              {selectedFormula ? (
                <>
                  <Text style={[modalStyles.modalTitle, isDark && modalStyles.modalTitle_dark]}>
                    💊 {selectedFormula.name}
                  </Text>
                  <Text style={[modalStyles.modalSubtitle, isDark && modalStyles.modalSubtitle_dark]}>
                    🩺 Введите необходимые значения
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[modalStyles.modalTitle, isDark && modalStyles.modalTitle_dark]}>
                    💊 Калькулятор препаратов
                  </Text>
                  <Text style={[modalStyles.modalSubtitle, isDark && modalStyles.modalSubtitle_dark]}>
                    🔍 Поиск и расчет дозировок
                  </Text>
                </>
              )}
            </View>

            {/* Search Input */}
            {!selectedFormula && (
              <View style={modalStyles.searchContainer}>
                <TextInput
                  style={[modalStyles.searchInputWithIcon, isDark && modalStyles.searchInputWithIcon_dark]}
                  placeholder="🔍 Поиск препаратов (анальгин, адреналин...)"
                  placeholderTextColor={isDark ? colors.dark.text.tertiary : colors.light.text.tertiary}
                  onChangeText={(text) => setSearchTerm(text)}
                  value={searchTerm}
                  accessibilityLabel="Поле поиска формул"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {searchTerm.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchTerm('')}
                    style={modalStyles.crossIcon}
                    accessibilityLabel="Очистить поиск"
                    accessibilityRole="button"
                  >
                    <Text style={modalStyles.crossImage}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Formula List */}
            {!selectedFormula && (
              <View style={[modalStyles.listContainer, isDark && modalStyles.listContainer_dark]}>
                {/* Статистика поиска */}
                {searchTerm.trim() !== '' && (
                  <Animated.View
                    entering={FadeIn.duration(animation.fast)}
                    style={{
                      padding: spacing.sm,
                      backgroundColor: isDark ? colors.dark.surfaceVariant : colors.light.surfaceVariant,
                      borderRadius: borderRadius.md,
                      marginBottom: spacing.md,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{
                      color: isDark ? colors.dark.text.secondary : colors.light.text.secondary,
                      fontSize: 14,
                    }}>
                      🔍 Найдено: {getFilteredFormulas().length} из {formulas.length}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setSearchTerm('')}
                      style={{
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.xs,
                        backgroundColor: isDark ? colors.dark.surface : colors.light.surface,
                        borderRadius: borderRadius.sm,
                      }}
                    >
                      <Text style={{
                        color: isDark ? colors.dark.text.primary : colors.light.text.primary,
                        fontSize: 12,
                        fontWeight: '500'
                      }}>
                        ✕ Очистить
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}

                {/* Список формул */}
                {getFilteredFormulas().length > 0 ? (
                  getFilteredFormulas().map((formula, index) => (
                    <Animated.View
                      key={formula.name}
                      entering={FadeInUp.delay(index * 50).duration(animation.fast)}
                    >
                      <TouchableOpacity
                        onPress={() => showModal(formula)}
                        style={[
                          modalStyles.formulaTouchable,
                          isDark && modalStyles.formulaTouchablePressed_dark,
                          {
                            backgroundColor: isDark ? colors.dark.surface : colors.light.surface,
                            borderWidth: 1,
                            borderColor: isDark ? colors.dark.border : colors.light.border,
                            marginBottom: spacing.sm,
                            borderRadius: borderRadius.lg,
                            padding: spacing.md,
                          }
                        ]}
                        accessibilityLabel={`Выбрать препарат ${formula.name}`}
                        accessibilityRole="button"
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flex: 1 }}>
                            <Text style={[modalStyles.formulaName, isDark && modalStyles.formulaName_dark]}>
                              {highlightSearchTerm(formula.name, searchTerm)}
                            </Text>
                            {formula.description && (
                              <Text style={[modalStyles.formulaDescription, isDark && modalStyles.formulaDescription_dark]}>
                                {highlightSearchTerm(formula.description, searchTerm)}
                              </Text>
                            )}
                          </View>
                          {formula.warnings && formula.warnings.length > 0 && (
                            <Text style={{ fontSize: 16, color: colors.light.warning }}>
                              ⚠️
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  ))
                ) : searchTerm.trim() !== '' ? (
                  <Animated.View
                    entering={FadeIn.duration(animation.fast)}
                    style={[modalStyles.warningContainer, isDark && modalStyles.warningContainer_dark]}
                  >
                    <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>
                      🔍
                    </Text>
                    <Text style={[modalStyles.warningText, isDark && modalStyles.warningText_dark]}>
                      "{searchTerm}" не найдено
                    </Text>
                    <Text style={{
                      ...typography.caption,
                      color: isDark ? colors.dark.text.tertiary : colors.light.text.tertiary,
                      marginTop: spacing.sm,
                      textAlign: 'center'
                    }}>
                      Попробуйте ввести часть названия или проверьте орфографию
                    </Text>
                  </Animated.View>
                ) : null}
              </View>
            )}

            {/* Modal Content Area */}
            {selectedFormula && (
              <View style={modalStyles.modalInner}>
                {/* Input Fields */}
                <View style={modalStyles.inputContainer}>
                  {/* Warnings */}
                  {selectedFormula.warnings && selectedFormula.warnings.length > 0 && (
                    <View style={{ marginBottom: spacing.md }}>
                      {selectedFormula.warnings.map((warning, index) => (
                        <Animated.Text
                          key={`warning-${index}`}
                          entering={FadeInUp.delay(index * 50).duration(animation.fast)}
                          style={[modalStyles.warningText, isDark && { color: colors.dark.danger }]}
                        >
                          ⚠️ Внимание: {warning}
                        </Animated.Text>
                      ))}
                    </View>
                  )}

                  {/* Input Fields */}
                  {Object.keys(selectedFormula.inputs || {}).map((inputName, index) => {
                    const hasValue = inputs[inputName] && inputs[inputName] !== 0;
                    const isValid = hasValue && inputs[inputName] > 0;

                    return (
                      <Animated.View
                        key={inputName}
                        entering={FadeInUp.delay(index * 100).duration(animation.normal)}
                        style={{ marginBottom: spacing.md }}
                      >
                        <Text style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: isDark ? colors.dark.text.primary : colors.light.text.primary,
                          marginBottom: spacing.xs,
                        }}>
                          📝 {selectedFormula.inputs[inputName]}
                        </Text>

                        <View style={{
                          position: 'relative',
                        }}>
                          <TextInput
                            style={{
                              backgroundColor: isDark ? colors.dark.surface : colors.light.surface,
                              borderRadius: borderRadius.lg,
                              padding: spacing.md,
                              paddingRight: spacing.xxxl, // Space for unit indicator
                              fontSize: 16,
                              color: isDark ? colors.dark.text.primary : colors.light.text.primary,
                              borderWidth: 2,
                              borderColor: hasValue
                                ? (isValid ? colors.light.success : colors.light.danger)
                                : (isDark ? colors.dark.border : colors.light.border),
                              ...shadows.sm,
                            }}
                            onChangeText={(text) => handleInputChange(inputName, text)}
                            value={inputs[inputName]?.toString() || ''}
                            keyboardType="decimal-pad"
                            placeholder={`Введите ${selectedFormula.inputs[inputName].toLowerCase()}`}
                            placeholderTextColor={isDark ? colors.dark.text.tertiary : colors.light.text.tertiary}
                            accessibilityLabel={`Введите ${selectedFormula.inputs[inputName]}`}
                          />

                          {/* Unit indicator */}
                          <View style={{
                            position: 'absolute',
                            right: spacing.md,
                            top: '50%',
                            transform: [{ translateY: -10 }],
                            backgroundColor: isDark ? colors.dark.surfaceVariant : colors.light.surfaceVariant,
                            borderRadius: borderRadius.sm,
                            paddingHorizontal: spacing.xs,
                            paddingVertical: 2,
                          }}>
                            <Text style={{
                              fontSize: 12,
                              fontWeight: '600',
                              color: isDark ? colors.dark.text.secondary : colors.light.text.secondary,
                            }}>
                              {inputName.toLowerCase().includes('вес') || inputName.toLowerCase().includes('масса') ? 'кг' :
                               inputName.toLowerCase().includes('возраст') ? 'лет' :
                               inputName.toLowerCase().includes('рост') ? 'см' : 'кг.'}
                            </Text>
                          </View>

                          {/* Validation indicator */}
                          {hasValue && (
                            <View style={{
                              position: 'absolute',
                              right: -8,
                              top: '50%',
                              transform: [{ translateY: -8 }],
                              width: 16,
                              height: 16,
                              borderRadius: 8,
                              backgroundColor: isValid ? colors.light.success : colors.light.danger,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}>
                              <Text style={{
                                fontSize: 10,
                                color: '#FFFFFF',
                                fontWeight: 'bold',
                              }}>
                                {isValid ? '✓' : '!'}
                              </Text>
                            </View>
                          )}
                        </View>
                      </Animated.View>
                    );
                  })}

                  {/* Action Buttons */}
                  {hasFormulaToCalculate && (
                    <Animated.View
                      entering={FadeInUp.delay(300).duration(animation.normal)}
                      style={{ marginTop: spacing.lg }}
                    >
                      {/* Calculate Button */}
                      <TouchableOpacity
                        onPress={calculateResult}
                        style={{
                          backgroundColor: isDark ? colors.dark.primary : colors.light.primary,
                          borderRadius: borderRadius.xl,
                          padding: spacing.lg,
                          alignItems: 'center',
                          marginBottom: spacing.md,
                          ...shadows.md,
                        }}
                        activeOpacity={0.8}
                        accessibilityLabel="Выполнить расчет"
                        accessibilityRole="button"
                      >
                        <Text style={{
                          color: colors.light.surface,
                          fontSize: 18,
                          fontWeight: '700',
                          textAlign: 'center',
                        }}>
                          🧮 Рассчитать
                        </Text>
                        <Text style={{
                          color: colors.light.surface,
                          fontSize: 14,
                          opacity: 0.9,
                          marginTop: spacing.xs,
                          textAlign: 'center',
                        }}>
                          Нажмите для получения результата
                        </Text>
                      </TouchableOpacity>

                      {/* Reset Button */}
                      {(Object.keys(inputs).some(key => inputs[key] !== 0) || Object.keys(results).length > 0) && (
                        <TouchableOpacity
                          onPress={() => {
                            setInputs({});
                            setResults({});
                          }}
                          style={{
                            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                            borderRadius: borderRadius.lg,
                            padding: spacing.md,
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                          }}
                          activeOpacity={0.7}
                          accessibilityLabel="Очистить все поля и результаты"
                          accessibilityRole="button"
                        >
                          <Text style={{
                            color: isDark ? '#FCA5A5' : '#DC2626',
                            fontSize: 16,
                            fontWeight: '600',
                            textAlign: 'center',
                          }}>
                            🗑️ Очистить всё
                          </Text>
                        </TouchableOpacity>
                      )}
                    </Animated.View>
                  )}
                </View>

                {/* Results */}
                {Object.keys(results).length > 0 && (
                  <View style={{ marginTop: spacing.lg }}>
                    {/* Error Messages */}
                    {results.error && (
                      <Animated.View
                        entering={FadeInUp.duration(animation.fast)}
                        style={{
                          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                          borderRadius: borderRadius.lg,
                          padding: spacing.lg,
                          borderWidth: 1,
                          borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                          marginBottom: spacing.md,
                        }}
                      >
                        <Text style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: isDark ? '#FCA5A5' : '#DC2626',
                          textAlign: 'center',
                          marginBottom: spacing.xs,
                        }}>
                          ⚠️ {results.type === 'validation' ? 'Необходимо заполнить' : 'Ошибка расчета'}
                        </Text>
                        <Text style={{
                          fontSize: 14,
                          color: isDark ? '#FCA5A5' : '#DC2626',
                          textAlign: 'center',
                          lineHeight: 20,
                        }}>
                          {results.message}
                        </Text>
                      </Animated.View>
                    )}

                    {/* Success Results */}
                    {results.success && (
                      <Animated.View
                        entering={FadeInUp.duration(animation.normal)}
                        style={[modalStyles.resultsContainer, isDark && modalStyles.resultsContainer_dark]}
                      >
                        {/* Header */}
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: spacing.md,
                        }}>
                          <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            color: isDark ? colors.dark.primary : colors.light.primary,
                          }}>
                            🧮 Результат расчета
                          </Text>
                          <TouchableOpacity
                            onPress={() => setResults({})}
                            style={{
                              paddingHorizontal: spacing.sm,
                              paddingVertical: spacing.xs,
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                              borderRadius: borderRadius.md,
                            }}
                          >
                            <Text style={{
                              fontSize: 12,
                              color: isDark ? colors.dark.text.secondary : colors.light.text.secondary,
                              fontWeight: '500',
                            }}>
                              ✕ Сбросить
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* Formula Info */}
                        <Text style={{
                          fontSize: 14,
                          color: isDark ? colors.dark.text.secondary : colors.light.text.secondary,
                          marginBottom: spacing.md,
                          fontStyle: 'italic',
                        }}>
                          📝 Препарат: {results.formula}
                        </Text>

                        {/* Results Data */}
                        {Object.keys(results.data).map((resultName, index) => (
                          <Animated.View
                            key={resultName}
                            entering={FadeInUp.delay(index * 100).duration(animation.fast)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: isDark ? colors.dark.surface : colors.light.surface,
                              borderRadius: borderRadius.lg,
                              padding: spacing.md,
                              marginBottom: spacing.sm,
                              borderWidth: 1,
                              borderColor: isDark ? colors.dark.border : colors.light.border,
                              ...shadows.sm,
                            }}
                          >
                            <Text style={{
                              fontSize: 16,
                              fontWeight: '600',
                              color: isDark ? colors.dark.text.primary : colors.light.text.primary,
                              flex: 1,
                            }}>
                              {resultName}
                            </Text>
                            <Text style={{
                              fontSize: 18,
                              fontWeight: '700',
                              color: isDark ? colors.dark.primary : colors.light.primary,
                              textAlign: 'right',
                            }}>
                              {results.data[resultName]}
                            </Text>
                          </Animated.View>
                        ))}


                      </Animated.View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Bottom spacing */}
            <View style={{ height: spacing.xl }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </BottomSheet>
    </SafeAreaView>
  );
};

export default WelcomeScreen;
