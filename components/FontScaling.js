import React from 'react';
import { Text, TextInput } from 'react-native';
import { fontScaling } from '../theme';

/**
 * Кастомный компонент Text с управлением масштабированием
 * По умолчанию масштабирование отключено для стабильной верстки
 */
export const ScaledText = ({
  children,
  allowFontScaling = fontScaling.default,
  maxFontSizeMultiplier = fontScaling.maxScale,
  minFontSizeMultiplier = fontScaling.minScale,
  style,
  ...props
}) => {
  return (
    <Text
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      minFontSizeMultiplier={minFontSizeMultiplier}
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
};

/**
 * Компонент Text с включенным масштабированием для специальных случаев
 */
export const AdaptiveText = ({
  children,
  allowFontScaling = fontScaling.enabled,
  maxFontSizeMultiplier = fontScaling.maxScale,
  minFontSizeMultiplier = fontScaling.minScale,
  style,
  ...props
}) => {
  return (
    <Text
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      minFontSizeMultiplier={minFontSizeMultiplier}
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
};

/**
 * Кастомный TextInput с управлением масштабированием
 */
export const ScaledTextInput = ({
  allowFontScaling = fontScaling.default,
  maxFontSizeMultiplier = fontScaling.maxScale,
  minFontSizeMultiplier = fontScaling.minScale,
  style,
  ...props
}) => {
  return (
    <TextInput
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      minFontSizeMultiplier={minFontSizeMultiplier}
      style={style}
      {...props}
    />
  );
};

/**
 * Хук для создания стиля с управлением масштабированием
 */
export const useFontScaling = (allowScaling = fontScaling.default) => {
  return {
    allowFontScaling: allowScaling,
    maxFontSizeMultiplier: fontScaling.maxScale,
    minFontSizeMultiplier: fontScaling.minScale,
  };
};

/**
 * Хук для создания адаптивного стиля с включенным масштабированием
 */
export const useAdaptiveFontScaling = () => {
  return {
    allowFontScaling: fontScaling.enabled,
    maxFontSizeMultiplier: fontScaling.maxScale,
    minFontSizeMultiplier: fontScaling.minScale,
  };
};

export default {
  ScaledText,
  AdaptiveText,
  ScaledTextInput,
  useFontScaling,
  useAdaptiveFontScaling,
};
