import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import ButtonApp from './main_screen/button_app';
import WelcomeScreen from './js_button_preparation/calculate_button';
import Tabnav from './button_two/navigate_button/TabnavTube';
import CalcShockIndexScreen from './shock_index_algovera/shock_algov_app';
import Date_pregnancy from './pregnancy/pregnancy';
import Tabnav_oxy from './calculate_o2/tabnav_oxy';
import IntubationTubeCalculation from './button_two/button_intub/IntubationTubeCalculation';
import LaryngealTubeCalculation from './button_two/button_laring/LaryngealTubeCalculation';

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
        <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
        <Stack.Screen name="Tabnav" component={Tabnav} />
        <Stack.Screen name="CalcShockIndexScreen" component={CalcShockIndexScreen} />
        <Stack.Screen name="Date_pregnancy" component={Date_pregnancy} />
        <Stack.Screen name="Tabnav_oxy" component={Tabnav_oxy} />
        <Stack.Screen
          name="IntubationTubeCalculation"
          component={IntubationTubeCalculation}
          options={{ title: 'Эндотрахеальная трубка' }}
        />
        <Stack.Screen
          name="Button_Tube_Calculation"
          component={LaryngealTubeCalculation}
          options={{ title: 'Ларингеальная трубка' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
