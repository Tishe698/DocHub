import { StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
    paddingTop: spacing.xl,
  },
  container_dark: {
    backgroundColor: colors.dark.background,
  },

  // Enhanced Header Styles
  headerContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  welcomeText: {
    ...typography.h1,
    textAlign: 'center',
    color: colors.light.text.primary,
    marginBottom: spacing.md,
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  welcomeText_dark: {
    color: colors.dark.text.primary,
    textShadowColor: 'rgba(255, 255, 255, 0.1)',
  },
  subtitle: {
    ...typography.h5,
    textAlign: 'center',
    color: colors.light.text.secondary,
    marginBottom: spacing.sm,
    lineHeight: 26,
    fontWeight: '500',
  },
  subtitle_dark: {
    color: colors.dark.text.secondary,
  },

  // Stats Section
  statsContainer: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.xs,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.light.border,
    elevation: 8,
  },
  statCard_dark: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    elevation: 8,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statLabel: {
    ...typography.caption,
    color: colors.light.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  statLabel_dark: {
    color: colors.dark.text.secondary,
  },
  statValue: {
    ...typography.h3,
    fontWeight: 'bold',
    color: colors.light.primary,
    textAlign: 'center',
  },
  statValue_dark: {
    color: colors.dark.primary,
  },

  // Main Action Section
  mainActionContainer: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.light.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.xl,
    elevation: 12,
    borderWidth: 2,
    borderColor: colors.light.primary + '40',
  },
  primaryButton_dark: {
    backgroundColor: colors.dark.primary,
    borderColor: colors.dark.primary + '40',
  },
  primaryButtonText: {
    ...typography.h4,
    color: colors.light.surface,
    fontWeight: '700',
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  primaryButtonSubtext: {
    ...typography.body2,
    color: colors.light.surface,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },

  // Quick Actions
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  quickActionButton: {
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.xs,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.light.border,
    elevation: 4,
  },
  quickActionButton_dark: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  quickActionText: {
    ...typography.caption,
    color: colors.light.text.secondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  quickActionText_dark: {
    color: colors.dark.text.secondary,
  },

  // Specialty Actions
  specialtyActionsContainer: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  specialtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  specialtyButton: {
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.xs,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.light.border,
    elevation: 4,
  },
  specialtyButton_dark: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
  },
  specialtyIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  specialtyText: {
    ...typography.caption,
    color: colors.light.text.secondary,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 11,
  },
  specialtyText_dark: {
    color: colors.dark.text.secondary,
  },

});

export default styles;