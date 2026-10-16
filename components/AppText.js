// AppText.js — Text и TextInput с общими настройками масштабирования шрифтов.
// В React 19 Text.defaultProps у функциональных компонентов игнорируется, поэтому
// значения по умолчанию задаются здесь: системное увеличение шрифта работает,
// но не больше fontScaling.maxScale. Пропсы, переданные на экране, имеют приоритет.
import React from 'react';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';
import { fontScaling } from '../theme';

const scalingDefaults = {
  allowFontScaling: true,
  maxFontSizeMultiplier: fontScaling.maxScale,
  minFontSizeMultiplier: fontScaling.minScale,
};

export const Text = (props) => <RNText {...scalingDefaults} {...props} />;

export const TextInput = (props) => <RNTextInput {...scalingDefaults} {...props} />;
