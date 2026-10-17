// ButtonApp.jsx — Главная страница DocHub (Expo, Android, 2025)
import React from "react";
import {
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  useWindowDimensions,
  PixelRatio,
  Platform,
  StatusBar,
} from "react-native";
import { Text } from "../components/AppText";

// ====== ДАННЫЕ КАРТОЧЕК (иконки остаются из твоего проекта) ======
const CARDS = [
  {
    screenName: "Расчет лекарств",
    icon: require("./Icon1.png"),
    title: "💊 Расчёт лекарств",
    description: "Дозировки и объёмы",
    a11y: "Перейти к расчёту лекарств",
  },
  {
    screenName: "Tabnav",
    icon: require("./Icon2.png"),
    title: "🫁 Трубки",
    description: "Размер и глубина ЭТТ",
    a11y: "Перейти к разделу трубок",
  },
  {
    screenName: "CalcShockIndexScreen",
    icon: require("./icon3.png"),
    title: "❤️ Шоковый индекс",
    description: "Индекс Альговера",
    a11y: "Перейти к шоковому индексу",
  },
  {
    screenName: "Date_pregnancy",
    icon: require("./icon4.png"),
    title: "🤰 Беременность",
    description: "Расчёт срока",
    a11y: "Перейти к расчёту срока беременности",
  },
  {
    screenName: "Tabnav_oxy",
    icon: require("./Icon7.png"),
    title: "🫁 Кислород",
    description: "Потребление O₂",
    a11y: "Перейти к кислородным расчётам",
  },
  {
    screenName: "MKBScreen",
    icon: require("./Icon6.png"),
    title: "📋 МКБ-10",
    description: "Справочник диагнозов",
    a11y: "Перейти к МКБ-10",
  },
  {
    screenName: "PediatricNormsScreen",
    icon: require("./Icon5.png"),
    title: "👶 Педиатрия",
    description: "Физиологические нормы",
    a11y: "Перейти к нормам в педиатрии",
  },
  {
    screenName: "BloodGroupScreen",
    icon: require("../assets/Icon_10.jpeg"),
    title: "🩸 Группа крови",
    description: "Определение группы",
    a11y: "Перейти к определению группы крови",
  },
  {
    screenName: "GCScreen",
    icon: require("../assets/11.jpeg"),
    title: "🧠 Шкала Глазго",
    description: "Оценка сознания",
    a11y: "Перейти к шкале Глазго",
  },
  {
    screenName: "GenevaScoreScreen",
    icon: require("../assets/12.jpeg"),
    title: "🫁 Шкала ТЭЛА",
    description: "Вероятность ТЭЛА",
    a11y: "Перейти к шкале ТЭЛА",
  },
  {
    screenName: "SHOKSScreen",
    icon: require("../assets/13.jpeg"),
    title: "❤️ ШОКС",
    description: "Симптоматика СН",
    a11y: "Перейти к шкале ШОКС",
  },
  {
    screenName: "NorepinephrineScreen",
    icon: require("../assets/14.jpeg"),
    title: "💉 Норадреналин",
    description: "Скорость инфузии",
    a11y: "Перейти к расчёту норадреналина",
  },
];

// ====== ЦВЕТА/КОНСТАНТЫ ======
const COLORS = {
  pageBg: "#EDF2F7",            // светлый фон страницы
  heroBg: "#0F172A",            // тёмная карточка шапки
  heroText: "#E2E8F0",
  textPrimary: "#0B1220",
  textSecondary: "#475569",
  chipBg: "#111827",
  chipText: "#E5E7EB",
  cardOverlay: "rgba(0,0,0,0.32)",
  white: "#FFFFFF",
  brand: "#2563EB",
};

const GUTTER = 12; // расстояние между карточками по горизонтали
const RADIUS = 18;

// ====== КАРТОЧКА ======
const GridCard = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => onPress(item.screenName)}
      accessibilityRole="button"
      accessibilityLabel={item.a11y}
    >
      <ImageBackground source={item.icon} style={styles.cardBg} imageStyle={styles.cardBgImage}>
        <View style={styles.overlay} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.cardDesc} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

// ====== ГЛАВНАЯ ======
const ButtonApp = ({ navigation }) => {
  const { width } = useWindowDimensions();

  // Один столбец на узких экранах (или при крупном масштабе интерфейса)
  const fontScale = PixelRatio.getFontScale?.() || 1;
  const oneColumn = width <= 450 || fontScale >= 1.3;
  const numColumns = oneColumn ? 1 : 2;

  const onPress = (screen) => navigation.navigate(screen);

  const Header = React.useMemo(
    () => (
      <View style={styles.headerWrap}>
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.brandChip}>
              <Text style={styles.brandDot}>✚</Text>
              <Text style={styles.brandChipText}>DocHub</Text>
            </View>
          </View>

          <Text style={styles.heroTitle} numberOfLines={2}>
            Медицинские расчёты
          </Text>
          <Text style={styles.heroSubtitle} numberOfLines={2}>
            Современные инструменты для врача и фельдшера
          </Text>
        </View>
      </View>
    ),
    []
  );

  return (
    <>
      {/* Скрываем системный статус-бар */}
      <StatusBar
        hidden={true}
        translucent={true}
        backgroundColor="transparent"
        barStyle="light-content"
        animated={true}
      />

      <SafeAreaView style={styles.safe}>
        <FlatList
          data={CARDS}
          renderItem={({ item }) => <GridCard item={item} onPress={onPress} />}
          keyExtractor={(_, i) => `card-${i}`}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={Header}
          numColumns={numColumns}
          key={numColumns} // пересоздать layout при смене столбцов
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={!oneColumn ? styles.columnWrapper : undefined}
          initialNumToRender={6}
          windowSize={8}
        />
      </SafeAreaView>
    </>
  );
};

export default ButtonApp;

// ====== СТИЛИ ======
const elevation = (e = 2) =>
  Platform.select({
    android: { elevation: e },
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: e * 2,
      shadowOffset: { width: 0, height: e },
    },
    default: {},
  });

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.pageBg,
    // Добавляем отступ сверху для компенсации скрытого статус-бара
    paddingTop: Platform.OS === 'android' ? 32 : 0, // 32dp на Android для лучшего отступа
  },

  listContent: {
    paddingTop: 16, // Увеличиваем отступ сверху
    paddingBottom: 24,
    paddingHorizontal: 16,
  },

  // ===== Header / hero =====
  headerWrap: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  hero: {
    backgroundColor: COLORS.heroBg,
    borderRadius: 22,
    padding: 18,
    ...elevation(4),
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 8,
  },
  brandChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: COLORS.chipBg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  brandDot: { color: "#A78BFA", marginRight: 6, fontSize: 14 },
  brandChipText: { color: COLORS.chipText, fontWeight: "700", fontSize: 13 },

  heroTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 6,
  },
  heroSubtitle: {
    color: COLORS.heroText,
    fontSize: 14,
    marginTop: 6,
  },

  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
  },
  statBox: {
    flexGrow: 1,
    minWidth: 96,
    maxWidth: "33.33%",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginRight: 10,
    marginTop: 10,
  },
  statEmoji: { fontSize: 16, marginBottom: 6, color: COLORS.white },
  statLabel: { color: "#BBD0FF", fontSize: 12, fontWeight: "600" },
  statValue: { color: COLORS.white, fontSize: 14, fontWeight: "800" },

  // ===== Grid =====
  columnWrapper: {
    // компенсируем внутренние маргины карточек
    marginHorizontal: -GUTTER / 2,
    paddingHorizontal: 16,
  },

  card: {
    flex: 1,
    height: 170,
    borderRadius: RADIUS,
    overflow: "hidden",
    backgroundColor: COLORS.white,
    marginHorizontal: GUTTER / 2, // расстояние между карточками по горизонтали
    marginBottom: 16,             // расстояние между рядами
    ...elevation(3),
  },
  cardBg: { flex: 1 },
  cardBgImage: { resizeMode: "cover" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.cardOverlay,
  },
  cardContent: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  cardDesc: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "600",
  },

  // ===== Footer =====
  footer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 12,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...elevation(2),
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },
});
