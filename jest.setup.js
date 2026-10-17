// Общая настройка Jest: AsyncStorage в тестах заменяется официальным моком пакета,
// чтобы ThemeProvider и экраны можно было рендерить без нативного модуля.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
