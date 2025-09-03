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
  runOnJS
} from 'react-native-reanimated';
import buttonStyles from '../css/main_screen/styles';
import { colors, spacing, animation, typography } from '../theme';

// Modern Card Component
const ModernCard = ({ item, index, onPress, isDark }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
    opacity.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    runOnJS(onPress)(item.screenName);
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 100).duration(400)}
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
        {/* Status Badge */}
        <View style={[buttonStyles.statusBadge, isDark && buttonStyles.statusBadge_dark]} />

        {/* Medical Icon Container */}
        <View style={[buttonStyles.iconContainer, isDark && buttonStyles.iconContainer_dark]}>
          <Animated.Image
            source={item.icon}
            style={buttonStyles.icon}
            entering={FadeIn.delay(300 + index * 100).duration(animation.fast)}
          />
          {/* Medical emoji overlay */}
          <Animated.Text
            style={buttonStyles.medicalEmoji}
            entering={FadeIn.delay(500 + index * 100).duration(animation.fast)}
          >
            {item.medicalIcon}
          </Animated.Text>
        </View>

        {/* Card Content */}
        <View style={buttonStyles.cardContent}>
          <Text style={[buttonStyles.cardTitle, isDark && buttonStyles.cardTitle_dark]}>
            {item.title}
          </Text>
          <Text style={[buttonStyles.cardDescription, isDark && buttonStyles.cardDescription_dark]}>
            {item.description}
          </Text>
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
      screenName: 'WelcomeScreen',
      icon: require('./Icon1.png'),
      title: '💊 Расчет лекарств',
      description: 'Подбор дозировок и объемов препаратов',
      accessibilityLabel: 'Перейти к расчету лекарств',
      medicalIcon: '💊'
    },
    {
      screenName: 'Tabnav',
      icon: require('./Icon2.png'),
      title: '🫁 Трубки',
      description: 'Расчет размера эндотрахеальных трубок',
      accessibilityLabel: 'Перейти к расчету размера трубок',
      medicalIcon: '🫁'
    },
    {
      screenName: 'CalcShockIndexScreen',
      icon: require('./icon3.png'),
      title: '❤️ Шоковый индекс',
      description: 'Расчет индекса Альговера',
      accessibilityLabel: 'Перейти к расчету шокового индекса Альговера',
      medicalIcon: '❤️'
    },
    {
      screenName: 'Date_pregnancy',
      icon: require('./icon4.png'),
      title: '🤰 Беременность',
      description: 'Расчет срока беременности',
      accessibilityLabel: 'Перейти к расчету срока беременности',
      medicalIcon: '🤰'
    },
    {
      screenName: 'Tabnav_oxy',
      icon: require('./Icon7.png'),
      title: '🫁 Кислород',
      description: 'Расчет потребления кислорода',
      accessibilityLabel: 'Перейти к расчету кислорода',
      medicalIcon: '🫁'
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
      {/* Header Section */}
      <Animated.View
        entering={FadeIn.duration(animation.normal)}
        style={buttonStyles.header}
      >
        <Text style={[buttonStyles.appTitle, isDark && buttonStyles.appTitle_dark]}>
          🏥 DocHub
        </Text>
        <Text style={[buttonStyles.appSubtitle, isDark && buttonStyles.appSubtitle_dark]}>
          🩺 Медицинские расчеты и справочники
        </Text>
      </Animated.View>

      {/* Cards Grid */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(animation.normal)}
        style={buttonStyles.cardsContainer}
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
