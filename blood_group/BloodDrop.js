// BloodDrop.js — рисунок капли «реагент + кровь» на планшете средствами View, без картинок.
//   «−» нет агглютинации — капля ровная, равномерно красная;
//   «+» агглютинация — бледная просветлевшая жидкость с красными хлопьями.
// Рисунок декоративный (скрыт от диктора): реакция дублируется знаком рядом и словом в подписи
// строки таблицы.
import React from 'react';
import { View } from 'react-native';
import { hideFromA11y } from '../components/a11y';
import { bloodDropColors as DROP, useThemedStyles } from '../theme/index';
import { POS } from './bloodGroupLogic';

// Физические цвета капли (одинаковы в обеих темах) — theme/bloodDrop.js

// Детерминированные позиции хлопьев: [x, y, диаметр] в долях диаметра капли,
// все внутри круга (центр 0,5; 0,5).
const FLAKES = [
  [0.3, 0.28, 0.16],
  [0.58, 0.22, 0.12],
  [0.72, 0.45, 0.17],
  [0.4, 0.5, 0.2],
  [0.22, 0.6, 0.11],
  [0.56, 0.7, 0.15],
  [0.75, 0.68, 0.09],
  [0.36, 0.79, 0.08],
  [0.47, 0.33, 0.07],
  [0.62, 0.54, 0.07],
];

const dotStyle = (size, x, y, d, color) => {
  const px = Math.max(2, Math.round(d * size));
  return {
    position: 'absolute',
    left: x * size - px / 2,
    top: y * size - px / 2,
    width: px,
    height: px,
    borderRadius: px / 2,
    backgroundColor: color,
  };
};

export default function BloodDrop({ value, size = 40, style, testID }) {
  const styles = useThemedStyles(makeStyles);
  const pos = value === POS;
  const circle = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View
      {...hideFromA11y}
      testID={testID}
      style={[styles.drop, circle, { backgroundColor: pos ? DROP.plasma : DROP.blood }, style]}
    >
      {pos
        ? FLAKES.map(([x, y, d]) => (
            <View key={`f${x}-${y}`} style={dotStyle(size, x, y, d, DROP.flake)} />
          ))
        : null}
      <View style={dotStyle(size, 0.32, 0.26, 0.16, DROP.shine)} />
    </View>
  );
}

const makeStyles = ({ colors }) => ({
  // Круг без текста внутри — фиксированный размер допустим
  drop: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
});
