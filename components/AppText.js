// AppText.js — Text и TextInput с общими настройками масштабирования шрифтов.
// В React 19 Text.defaultProps у функциональных компонентов игнорируется, поэтому
// значения по умолчанию задаются здесь: системное увеличение шрифта работает,
// но не больше fontScaling.maxScale (1.5, см. theme/tokens.js). Пропсы, переданные
// на экране, имеют приоритет.
//
// Новый код задаёт начертание и цвет токенами темы:
//   <Text variant="heading">…</Text>               — typography.heading, цвет colors.text
//   <Text variant="caption" color="textSecondary">  — цвет из colors.<ключ>
// Без variant и color стиль не добавляется (старые экраны выглядят как раньше).
import React from 'react';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';
import { fontScaling, typography } from '../theme/tokens';
import { useTheme } from '../theme/index';

const scalingDefaults = {
  allowFontScaling: true,
  maxFontSizeMultiplier: fontScaling.maxScale,
  minFontSizeMultiplier: fontScaling.minScale,
};

export const Text = ({ variant, color, style, ...props }) => {
  const { colors } = useTheme();
  if (!variant && !color) return <RNText {...scalingDefaults} style={style} {...props} />;
  const base = [
    variant ? typography[variant] : null,
    { color: (color && colors[color]) || colors.text },
    style,
  ];
  return <RNText {...scalingDefaults} style={base} {...props} />;
};

export const TextInput = (props) => <RNTextInput {...scalingDefaults} {...props} />;
