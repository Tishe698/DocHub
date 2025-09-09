// Theme configuration for DocHub - September 2025
import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Medical Color Palette - Professional Healthcare Theme
export const colors = {
  // Light theme - Medical white & blue
  light: {
    primary: '#2563EB',          // Medical blue
    primaryVariant: '#1D4ED8',    // Deeper medical blue
    secondary: '#10B981',        // Medical green
    accent: '#06B6D4',           // Medical cyan
    success: '#059669',          // Health green
    danger: '#DC2626',           // Medical red
    warning: '#D97706',          // Caution orange
    info: '#0891B2',             // Info cyan

    background: '#FFFFFF',       // Clean medical white
    surface: '#FFFFFF',          // Pure white surfaces
    surfaceVariant: '#F8FAFC',   // Light gray for cards
    surfaceElevated: '#FFFFFF',  // Elevated surfaces
    cardBackground: '#F8FAFC',   // Light medical card background

    text: {
      primary: '#1E293B',        // Medical dark blue-gray
      secondary: '#64748B',      // Medium medical slate
      tertiary: '#94A3B8',       // Light medical slate
      inverse: '#FFFFFF',        // White text
      onPrimary: '#FFFFFF',      // White on primary
      medical: '#1E40AF',        // Medical blue text
    },

    border: 'rgba(37,99,235,0.1)',  // Light medical blue borders
    divider: 'rgba(37,99,235,0.08)', // Subtle medical dividers
    shadow: 'rgba(37,99,235,0.08)',  // Medical blue shadows
    overlay: 'rgba(15,23,42,0.5)',  // Medical overlay
  },

  // Dark theme - Medical navy & blue
  dark: {
    primary: '#3B82F6',          // Bright medical blue
    primaryVariant: '#2563EB',    // Medium medical blue
    secondary: '#34D399',        // Bright medical green
    accent: '#22D3EE',           // Bright medical cyan
    success: '#10B981',          // Bright health green
    danger: '#EF4444',           // Bright medical red
    warning: '#F59E0B',          // Bright caution orange
    info: '#06B6D4',             // Bright info cyan

    background: '#0F172A',       // Deep medical navy
    surface: 'rgba(30,41,59,0.9)', // Semi-transparent medical slate
    surfaceVariant: 'rgba(30,41,59,0.7)', // More transparent
    surfaceElevated: 'rgba(30,41,59,0.95)', // Elevated medical surfaces
    cardBackground: 'rgba(30,41,59,0.8)', // Medical card background

    text: {
      primary: '#F1F5F9',        // Almost white
      secondary: '#CBD5E1',      // Light medical slate
      tertiary: '#94A3B8',       // Medium medical slate
      inverse: '#0F172A',        // Dark on light
      onPrimary: '#0F172A',      // Dark on primary
      medical: '#60A5FA',        // Light medical blue text
    },

    border: 'rgba(59,130,246,0.2)', // Light medical blue borders
    divider: 'rgba(59,130,246,0.15)', // Medical dividers
    shadow: 'rgba(0,0,0,0.5)',   // Stronger medical shadows
    overlay: 'rgba(15,23,42,0.7)', // Darker medical overlay
  },
};

// Spacing system (8-point grid)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// Typography
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 28,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Animation durations
export const animation = {
  fast: 120,
  normal: 200,
  slow: 300,
};

// Screen dimensions
export const dimensions = {
  screenWidth,
  screenHeight,
  isSmallScreen: screenWidth < 375,
  isLargeScreen: screenWidth > 428,
};

// Font scaling utilities
export const fontScaling = {
  // Глобально отключено по умолчанию
  default: false,

  // Точечное включение
  enabled: true,

  // Максимальный коэффициент масштабирования
  maxScale: 1.2,

  // Минимальный коэффициент масштабирования
  minScale: 0.8,
};

// Common component styles
export const componentStyles = {
  button: {
    minHeight: 44, // Accessibility requirement
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },

  input: {
    minHeight: 48, // Better touch target
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  modal: {
    margin: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
};

export default {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  animation,
  dimensions,
  componentStyles,
};
