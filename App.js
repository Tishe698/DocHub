import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput } from 'react-native';
import { fontScaling } from './theme';

// Глобальное отключение масштабирования шрифтов для стабильной верстки
Text.defaultProps = {
  ...Text.defaultProps,
  allowFontScaling: fontScaling.default,
  maxFontSizeMultiplier: fontScaling.maxScale,
  minFontSizeMultiplier: fontScaling.minScale,
};

// Аналогично для TextInput
TextInput.defaultProps = {
  ...TextInput.defaultProps,
  allowFontScaling: fontScaling.default,
  maxFontSizeMultiplier: fontScaling.maxScale,
  minFontSizeMultiplier: fontScaling.minScale,
};
import ButtonApp from './main_screen/button_app';
import WelcomeScreen from './js_button_preparation/calculate_button';
import Tabnav from './button_two/navigate_button/TabnavTube';
import CalcShockIndexScreen from './shock_index_algovera/shock_algov_app';
import Date_pregnancy from './pregnancy/pregnancy';
import Tabnav_oxy from './calculate_o2/tabnav_oxy';
import Calc_max_time_o2 from './calculate_o2/calc_max_time_o2';
import Calc_dorbinyn from './calculate_o2/calc_dorbinyn';
import Calc_aparat_IVL from './calculate_o2/calc_aparat_IVl';
import IntubationTubeCalculation from './button_two/button_intub/IntubationTubeCalculation';
import LaryngealTubeCalculation from './button_two/button_laring/LaryngealTubeCalculation';
import ICDSearchScreen from './mkb10/mkbscreen';
import PediatricNormsScreen from './fiz_norm/pediatric_norms_screen';
import BloodGroupScreen from './blood_group/blood_group_screen';
import GCScreen from './glazgo/glazgo';
import GenevaScoreScreen from './Tela/tela';
import SHOKSScreen from './shoks/shoks';
import NorepinephrineScreen from './Norepinephrine/NorepinephrineScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={ButtonApp}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Расчет лекарств"
          component={WelcomeScreen}
          options={{ title: 'Расчет дозировок препаратов' }}
        />
        <Stack.Screen
          name="Tabnav"
          component={Tabnav}
          options={{ title: 'Расчеты интубации' }}
        />
        <Stack.Screen
          name="CalcShockIndexScreen"
          component={CalcShockIndexScreen}
          options={{ title: 'Шоковый индекс' }}
        />
        <Stack.Screen
          name="Date_pregnancy"
          component={Date_pregnancy}
          options={{ title: 'Калькулятор беременности' }}
        />
        <Stack.Screen
          name="Tabnav_oxy"
          component={Tabnav_oxy}
          options={{ title: 'Кислородные расчеты' }}
        />
        <Stack.Screen
          name="Calc_max_time_o2"
          component={Calc_max_time_o2}
          options={{ title: '⏱️ Время работы кислородного баллона' }}
        />
        <Stack.Screen
          name="Calc_dorbinyn"
          component={Calc_dorbinyn}
          options={{ title: '📊 Минутный объем дыхания' }}
        />
        <Stack.Screen
          name="Calc_aparat_IVL"
          component={Calc_aparat_IVL}
          options={{ title: '🏥 Настройка аппарата ИВЛ' }}
        />
        <Stack.Screen
          name="IntubationTubeCalculation"
          component={IntubationTubeCalculation}
          options={{ title: '🫁 Расчет размера эндотрахеальной трубки' }}
        />
        <Stack.Screen
          name="Button_Tube_Calculation"
          component={LaryngealTubeCalculation}
          options={{ title: '👄 Расчет размера ларингеальной маски' }}
        />
        <Stack.Screen
          name="MKBScreen"
          component={ICDSearchScreen}
          options={{ title: '📋 МКБ-10 — Международная классификация болезней' }}
        />
        <Stack.Screen
          name="PediatricNormsScreen"
          component={PediatricNormsScreen}
          options={{ title: '👶 Физиологические нормы в педиатрии' }}
        />
        <Stack.Screen
          name="BloodGroupScreen"
          component={BloodGroupScreen}
          options={{ title: '🩸 Определение группы крови' }}
        />
        <Stack.Screen
          name="GCScreen"
          component={GCScreen}
          options={{ title: '🧠 Шкала комы Глазго' }}
        />
        <Stack.Screen
          name="GenevaScoreScreen"
          component={GenevaScoreScreen}
          options={{ title: '🫁 Шкала вероятности ТЭЛА' }}
        />
        <Stack.Screen
          name="SHOKSScreen"
          component={SHOKSScreen}
          options={{ title: '❤️ Шкала ШОКС' }}
        />
        <Stack.Screen
          name="NorepinephrineScreen"
          component={NorepinephrineScreen}
          options={{ title: '💉 Норадреналин' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
