// broselow.js — физические цвета зон ленты Broselow-Luten.
// Это цвета самой ленты (по ним бригада сверяется с лентой у ребёнка), поэтому
// они одинаковы в светлой и тёмной теме. К каждому цвету — цвет текста
// с контрастом не ниже 4.5:1 и граница (нужна белой и серой зонам на светлом фоне).
// Контраст проверяет theme/__tests__/contrast.test.js.

const broselowColors = {
  grey: { bg: '#9E9E9E', text: '#000000', border: '#757575' },
  pink: { bg: '#F48FB1', text: '#000000', border: '#C2185B' },
  red: { bg: '#C62828', text: '#FFFFFF', border: '#8E0000' },
  purple: { bg: '#6A1B9A', text: '#FFFFFF', border: '#38006B' },
  yellow: { bg: '#FDD835', text: '#000000', border: '#C6A700' },
  white: { bg: '#FFFFFF', text: '#000000', border: '#757575' },
  blue: { bg: '#1565C0', text: '#FFFFFF', border: '#003C8F' },
  orange: { bg: '#F57C00', text: '#000000', border: '#BB4D00' },
  green: { bg: '#2E7D32', text: '#FFFFFF', border: '#005005' },
};

export default broselowColors;
