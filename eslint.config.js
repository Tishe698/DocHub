// ESLint (flat config): правила Expo, включая правила хуков React
// (react-hooks/rules-of-hooks — ошибка, exhaustive-deps — предупреждение).
// Форматирование — забота Prettier, поэтому его конфликтующие правила выключены.
// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'coverage/*'],
  },
  {
    files: ['**/*.test.js', '**/__tests__/**/*.js', 'jest.setup.js'],
    languageOptions: { globals: { ...globals.jest, ...globals.node } },
  },
]);
