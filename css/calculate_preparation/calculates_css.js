// Modern ModalStyles.js - Complete Redesign 2025
import { StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  // Main container - centered and properly positioned
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.light.overlay,
    padding: spacing.xl,
  },

  modalContainer_dark: {
    backgroundColor: colors.dark.overlay,
  },

  // Modal content - modern card design
  modalContent: {
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.xxl,
    width: Math.min(screenWidth - spacing.xl * 2, 420),
    maxHeight: screenHeight * 0.8,
    padding: spacing.xl,
    ...shadows.lg,
    borderWidth: 0, // Remove borders for cleaner look
  },

  modalContent_dark: {
    backgroundColor: colors.dark.surfaceElevated,
  },

  // Search container
  searchContainer: {
    marginBottom: spacing.lg,
  },

  searchInputWithIcon: {
    backgroundColor: colors.light.surfaceVariant,
    borderRadius: borderRadius.xl,
    height: 56, // Larger touch target
    paddingHorizontal: spacing.lg,
    paddingRight: spacing.xxxl, // Space for icon
    fontSize: 16,
    color: colors.light.text.primary,
    borderWidth: 1,
    borderColor: colors.light.border,
  },

  searchInputWithIcon_dark: {
    backgroundColor: colors.dark.surfaceVariant,
    color: colors.dark.text.primary,
    borderColor: colors.dark.border,
  },

  // Icon positioning
  crossIcon: {
    position: 'absolute',
    right: spacing.lg,
    top: '50%',
    transform: [{ translateY: -12 }],
  },

  crossIcon2: {
    position: 'absolute',
    left: spacing.lg,
    top: '50%',
    transform: [{ translateY: -12 }],
  },

  crossImage: {
    width: 20,
    height: 20,
    tintColor: colors.light.text.tertiary,
  },

  // Formula list container
  listContainer: {
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.light.divider,
  },

  listContainer_dark: {
    backgroundColor: colors.dark.surfaceVariant,
    borderColor: colors.dark.divider,
  },

  formulaTouchable: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },

  formulaTouchablePressed: {
    backgroundColor: colors.light.surfaceVariant,
  },

  formulaTouchablePressed_dark: {
    backgroundColor: colors.dark.surfaceVariant,
  },

  formulaName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.light.text.primary,
    marginBottom: spacing.xs,
  },

  formulaName_dark: {
    color: colors.dark.text.primary,
  },

  formulaDescription: {
    ...typography.caption,
    color: colors.light.text.secondary,
    lineHeight: 18,
  },

  formulaDescription_dark: {
    color: colors.dark.text.secondary,
  },

  // Modal inner content
  modalInner: {
    flex: 1,
  },

  modalHeader: {
    marginBottom: spacing.lg,
  },

  modalTitle: {
    ...typography.h2,
    color: colors.light.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },

  modalTitle_dark: {
    color: colors.dark.text.primary,
  },

  modalSubtitle: {
    ...typography.body2,
    color: colors.light.text.secondary,
    textAlign: 'center',
  },

  modalSubtitle_dark: {
    color: colors.dark.text.secondary,
  },

  // Input fields
  inputContainer: {
    marginBottom: spacing.lg,
  },

  inputField: {
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.lg,
    height: 56,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    fontSize: 16,
    color: colors.light.text.primary,
    borderWidth: 1,
    borderColor: colors.light.border,
    ...typography.body1,
  },

  inputField_dark: {
    backgroundColor: colors.dark.surface,
    color: colors.dark.text.primary,
    borderColor: colors.dark.border,
  },

  inputFieldFocused: {
    borderColor: colors.light.primary,
    borderWidth: 2,
  },

  inputFieldFocused_dark: {
    borderColor: colors.dark.primary,
  },

  // Buttons
  calculateButton: {
    backgroundColor: colors.light.primary,
    borderRadius: borderRadius.lg,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.md,
  },

  calculateButton_dark: {
    backgroundColor: colors.dark.primary,
  },

  calculateButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },

  calculateButtonText: {
    ...typography.button,
    color: colors.light.text.onPrimary,
    fontWeight: '600',
  },

  calculateButtonText_dark: {
    color: colors.dark.text.onPrimary,
  },

  // Results
  resultsContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.light.divider,
  },

  resultsContainer_dark: {
    borderTopColor: colors.dark.divider,
  },

  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.light.surfaceVariant,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },

  resultItem_dark: {
    backgroundColor: colors.dark.surfaceVariant,
  },

  resultLabel: {
    ...typography.body2,
    color: colors.light.text.secondary,
    flex: 1,
  },

  resultLabel_dark: {
    color: colors.dark.text.secondary,
  },

  resultValue: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.light.text.primary,
    textAlign: 'right',
  },

  resultValue_dark: {
    color: colors.dark.text.primary,
  },

  // Warnings and errors
  warningContainer: {
    backgroundColor: colors.light.warning + '15', // 15% opacity
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.light.warning + '30', // 30% opacity
  },

  warningContainer_dark: {
    backgroundColor: colors.dark.warning + '20',
    borderColor: colors.dark.warning + '40',
  },

  warningText: {
    ...typography.caption,
    color: colors.light.warning,
    textAlign: 'center',
  },

  warningText_dark: {
    color: colors.dark.warning,
  },

  // Close button
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.light.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeButton_dark: {
    backgroundColor: colors.dark.surfaceVariant,
  },

  closeButtonIcon: {
    width: 20,
    height: 20,
    tintColor: colors.light.text.secondary,
  },
});

export default styles;
