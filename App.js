import React, { useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
// Масштабирование шрифтов задаётся в components/AppText.js: экраны импортируют
// Text и TextInput оттуда (Text.defaultProps в React 19 не работает).
import { ThemeProvider, useTheme, makeNavigationTheme } from './theme/index';
import { PatientProvider } from './patient/PatientContext';
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
import NewsScreen from './news/NewsScreen';
import ApgarScreen from './apgar/ApgarScreen';

const Stack = createNativeStackNavigator();

// Имена маршрутов не менять: на них ссылаются экраны (navigation.navigate).
// Заголовки — короткие и без эмодзи: длинные обрезаются в нативной шапке.
const ROUTES = [
  { name: 'Расчет лекарств', component: WelcomeScreen, title: 'Расчёт препаратов' },
  { name: 'Tabnav', component: Tabnav, title: 'Интубация' },
  { name: 'CalcShockIndexScreen', component: CalcShockIndexScreen, title: 'Шоковый индекс' },
  { name: 'Date_pregnancy', component: Date_pregnancy, title: 'Срок беременности' },
  { name: 'Tabnav_oxy', component: Tabnav_oxy, title: 'Кислород' },
  { name: 'Calc_max_time_o2', component: Calc_max_time_o2, title: 'Время работы баллона' },
  { name: 'Calc_dorbinyn', component: Calc_dorbinyn, title: 'Минутный объём дыхания' },
  { name: 'Calc_aparat_IVL', component: Calc_aparat_IVL, title: 'Настройка ИВЛ' },
  { name: 'IntubationTubeCalculation', component: IntubationTubeCalculation, title: 'Эндотрахеальная трубка' },
  { name: 'Button_Tube_Calculation', component: LaryngealTubeCalculation, title: 'Ларингеальная трубка' },
  { name: 'MKBScreen', component: ICDSearchScreen, title: 'МКБ-10' },
  { name: 'PediatricNormsScreen', component: PediatricNormsScreen, title: 'Нормы в педиатрии' },
  { name: 'BloodGroupScreen', component: BloodGroupScreen, title: 'Группа крови' },
  { name: 'GCScreen', component: GCScreen, title: 'Шкала Глазго' },
  { name: 'GenevaScoreScreen', component: GenevaScoreScreen, title: 'Вероятность ТЭЛА' },
  { name: 'SHOKSScreen', component: SHOKSScreen, title: 'Шкала ШОКС' },
  { name: 'NorepinephrineScreen', component: NorepinephrineScreen, title: 'Норадреналин' },
  { name: 'NewsScreen', component: NewsScreen, title: 'NEWS2' },
  { name: 'ApgarScreen', component: ApgarScreen, title: 'Шкала Апгар' },
];

function AppNavigator() {
  const theme = useTheme();
  const { colors, isDark } = theme;
  const navigationTheme = useMemo(() => makeNavigationTheme(theme), [theme]);
  const screenOptions = useMemo(
    () => ({
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.primary,
      headerTitleStyle: { color: colors.text },
      headerBackButtonDisplayMode: 'minimal',
      contentStyle: { backgroundColor: colors.bg },
    }),
    [colors]
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      {/* Единственный StatusBar приложения: экраны свой не рисуют */}
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
        <Stack.Screen name="Home" component={ButtonApp} options={{ headerShown: false }} />
        {ROUTES.map(({ name, component, title }) => (
          <Stack.Screen key={name} name={name} component={component} options={{ title }} />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PatientProvider>
          <AppNavigator />
        </PatientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
