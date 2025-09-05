// Modern ButtonApp.js - Complete Redesign 2025
import React from 'react';
import { View, Text, SafeAreaView, FlatList, useColorScheme, TouchableOpacity } from 'react-native';
import Animated, {
  FadeInUp,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
  SlideInRight,
  ZoomIn
} from 'react-native-reanimated';
import buttonStyles from '../css/main_screen/styles';
import { colors, spacing, animation, typography, borderRadius } from '../theme';

// Импорт LinearGradient с fallback
let LinearGradient;
try {
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (error) {
  // Fallback для случаев, когда expo-linear-gradient недоступен
  LinearGradient = ({ children, ...props }) => (
    <View {...props}>
      {children}
    </View>
  );
}

// Modern Card Component with Background Images
const ModernCard = ({ item, index, onPress, isDark }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rotateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateY: `${rotateY.value}deg` }
    ],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.94, { damping: 20, stiffness: 300 });
    opacity.value = withTiming(0.95, { duration: 80 });
    rotateY.value = withTiming(2, { duration: 150, easing: Easing.out(Easing.exp) });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 120 });
    rotateY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.exp) });
  };

  const handlePress = () => {
    runOnJS(onPress)(item.screenName);
  };


  return (
    <Animated.View
      entering={SlideInRight.delay(index * 150).duration(600).springify()}
      style={animatedStyle}
    >
      <TouchableOpacity
        style={[buttonStyles.card, isDark && buttonStyles.card_dark]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessibilityLabel={item.accessibilityLabel}
        accessibilityRole="button"
        accessibilityHint={`Открыть раздел ${item.title}`}
      >
        {/* Background Image */}
        <Animated.Image
          source={item.icon}
          style={buttonStyles.cardBackgroundImage}
          entering={FadeIn.delay(index * 100).duration(500)}
          resizeMode="cover"
        />

        {/* Dark Overlay for Text Readability */}
        <View style={buttonStyles.cardOverlay} />

        {/* Card Content with Enhanced Typography */}
        <View style={buttonStyles.cardContent}>
          <Animated.Text
            style={[
              buttonStyles.cardTitle,
              buttonStyles.cardTitleOnImage,
              isDark && buttonStyles.cardTitle_dark,
              isDark && buttonStyles.cardTitleOnImage_dark
            ]}
            entering={FadeInUp.delay(700 + index * 100).duration(400)}
          >
            {item.title}
          </Animated.Text>
          <Animated.Text
            style={[
              buttonStyles.cardDescription,
              buttonStyles.cardDescriptionOnImage,
              isDark && buttonStyles.cardDescription_dark,
              isDark && buttonStyles.cardDescriptionOnImage_dark
            ]}
            entering={FadeInUp.delay(800 + index * 100).duration(400)}
          >
            {item.description}
          </Animated.Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ButtonApp = ({ navigation }) => {
  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';

  const data = [
    {
      screenName: 'Расчет лекарств',
      icon: require('./Icon1.png'),
      title: '💊 Расчет лекарств',
      description: 'Подбор дозировок и объемов препаратов',
      accessibilityLabel: 'Перейти к расчету лекарств'
    },
    {
      screenName: 'Tabnav',
      icon: require('./Icon2.png'),
      title: '🫁 Трубки',
      description: 'Расчет размера эндотрахеальных трубок',
      accessibilityLabel: 'Перейти к расчету размера трубок'
    },
    {
      screenName: 'CalcShockIndexScreen',
      icon: require('./icon3.png'),
      title: '❤️ Шоковый индекс',
      description: 'Расчет индекса Альговера',
      accessibilityLabel: 'Перейти к расчету шокового индекса Альговера'
    },
    {
      screenName: 'Date_pregnancy',
      icon: require('./icon4.png'),
      title: '🤰 Беременность',
      description: 'Расчет срока беременности',
      accessibilityLabel: 'Перейти к расчету срока беременности'
    },
    {
      screenName: 'Tabnav_oxy',
      icon: require('./Icon7.png'),
      title: '🫁 Кислород',
      description: 'Расчет потребления кислорода',
      accessibilityLabel: 'Перейти к расчету кислорода'
    },
    {
      screenName: 'MKBScreen',
      icon: require('./Icon6.png'),
      title: '📋 МКБ-10',
      description: 'Международная классификация болезней',
      accessibilityLabel: 'Перейти к МКБ-10'
    },
    {
      screenName: 'PediatricNormsScreen',
      icon: require('./Icon5.png'),
      title: '👶 Педиатрия',
      description: 'Физиологические нормы для детей',
      accessibilityLabel: 'Перейти к нормам в педиатрии'
    },
    {
      screenName: 'BloodGroupScreen',
      icon: require('../assets/Icon_10.jpeg'),
      title: '🩸 Группа крови',
      description: 'Определение группы крови',
      accessibilityLabel: 'Перейти к определению группы крови'
    },
    {
      screenName: 'GCScreen',
      icon: require('../assets/11.jpeg'),
      title: '🧠 Шкала Глазго',
      description: 'Оценка уровня сознания по шкале комы Глазго',
      accessibilityLabel: 'Перейти к шкале комы Глазго'
    },
    {
      screenName: 'GenevaScoreScreen',
      icon: require('../assets/12.jpeg'),
      title: '🫁 Шкала ТЭЛА',
      description: 'Оценка вероятности тромбоэмболии лёгочной артерии',
      accessibilityLabel: 'Перейти к шкале вероятности ТЭЛА'
    },
    {
      screenName: 'SHOKSScreen',
      icon: require('../assets/13.jpeg'),
      title: '❤️ Шкала ШОКС',
      description: 'Оценка клинической симптоматики при сердечной недостаточности',
      accessibilityLabel: 'Перейти к шкале ШОКС'
    },
    {
      screenName: 'NorepinephrineScreen',
      icon: require('../assets/14.jpeg'),
      title: '💉 Норадреналин',
      description: 'Расчёт скорости инфузии норадреналина',
      accessibilityLabel: 'Перейти к расчёту норадреналина'
    },
  ];

  const handleCardPress = (screenName) => {
    navigation.navigate(screenName);
  };

  const renderCard = ({ item, index }) => (
    <ModernCard
      item={item}
      index={index}
      onPress={handleCardPress}
      isDark={isDark}
    />
  );

  return (
    <SafeAreaView style={[buttonStyles.container, isDark && buttonStyles.container_dark]}>
      {/* Header Section with Gradient Background */}
      <LinearGradient
        colors={isDark
          ? ['#0f172a', '#1e293b', '#334155']
          : ['#f8fafc', '#e2e8f0', '#cbd5e1']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={buttonStyles.headerGradient}
      >
        <Animated.View
          entering={ZoomIn.duration(600).springify()}
          style={buttonStyles.header}
        >
          <Animated.Text
            style={[buttonStyles.appTitle, buttonStyles.appTitleGradient, isDark && buttonStyles.appTitle_dark]}
            entering={FadeInUp.delay(200).duration(500)}
          >
            🏥 DocHub
          </Animated.Text>
          <Animated.Text
            style={[buttonStyles.appSubtitle, buttonStyles.appSubtitleGradient, isDark && buttonStyles.appSubtitle_dark]}
            entering={FadeInUp.delay(400).duration(500)}
          >
            🩺 Медицинские расчеты и справочники
          </Animated.Text>
        </Animated.View>
      </LinearGradient>

      {/* Cards Grid with Enhanced Container */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(animation.normal)}
        style={[buttonStyles.cardsContainer, isDark && buttonStyles.cardsContainer_dark]}
      >
        <FlatList
          data={data}
          renderItem={renderCard}
          keyExtractor={(item, index) => `${item.screenName}-${index}`}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: spacing.xl,
          }}
          columnWrapperStyle={{
            justifyContent: 'space-between',
          }}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

export default ButtonApp;
