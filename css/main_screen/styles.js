// Modern Main Screen Styles - Complete Redesign 2025
import { StyleSheet, Dimensions } from "react-native";
import { colors, spacing, borderRadius, typography, shadows } from "../../theme";

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - spacing.xl * 2 - spacing.md) / 2; // 2 columns

const buttonStyles = StyleSheet.create({
    // Main container
    container: {
        flex: 1,
        backgroundColor: colors.light.background,
        paddingTop: spacing.xl,
        paddingHorizontal: spacing.lg,
    },

    container_dark: {
        backgroundColor: colors.dark.background,
    },

    // Header section
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.md,
    },

    appTitle: {
        ...typography.h1,
        color: colors.light.primary,
        fontWeight: '700',
        marginBottom: spacing.xs,
        textAlign: 'center',
    },

    appTitle_dark: {
        color: colors.dark.primary,
    },

    appSubtitle: {
        ...typography.body1,
        color: colors.light.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
    },

    appSubtitle_dark: {
        color: colors.dark.text.secondary,
    },

    // Cards grid
    cardsContainer: {
        flex: 1,
    },

    // Modern medical card design
    card: {
        width: cardWidth,
        backgroundColor: colors.light.cardBackground,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        marginHorizontal: spacing.xs,
        ...shadows.md,
        borderWidth: 2,
        borderColor: colors.light.primary + '20', // 20% opacity medical blue
        minHeight: 180,
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
    },

    card_dark: {
        backgroundColor: colors.dark.cardBackground,
        borderColor: colors.dark.primary + '30', // 30% opacity medical blue
    },

    // Pressed state with modern animation
    cardPressed: {
        transform: [{ scale: 0.96 }],
        ...shadows.sm,
    },

    // Icon container with gradient background
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.light.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
        ...shadows.sm,
    },

    iconContainer_dark: {
        backgroundColor: colors.dark.primary,
    },

    // Icon styles
    icon: {
        width: 40,
        height: 40,
        tintColor: colors.light.surface,
    },

    // Medical emoji overlay
    medicalEmoji: {
        position: 'absolute',
        top: -5,
        right: -5,
        fontSize: 24,
        textShadowColor: colors.light.shadow,
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },

    // Card content
    cardContent: {
        alignItems: 'center',
        flex: 1,
    },

    cardTitle: {
        ...typography.body1,
        fontWeight: '600',
        color: colors.light.text.primary,
        textAlign: 'center',
        marginTop: spacing.sm,
        lineHeight: 20,
    },

    cardTitle_dark: {
        color: colors.dark.text.primary,
    },

    cardDescription: {
        ...typography.caption,
        color: colors.light.text.secondary,
        textAlign: 'center',
        marginTop: spacing.xs,
        lineHeight: 16,
    },

    cardDescription_dark: {
        color: colors.dark.text.secondary,
    },

    // Status indicators
    statusBadge: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        width: 8,
        height: 8,
        borderRadius: borderRadius.full,
        backgroundColor: colors.light.success,
    },

    statusBadge_dark: {
        backgroundColor: colors.dark.success,
    },

    // Loading state
    skeletonCard: {
        width: cardWidth,
        height: 160,
        backgroundColor: colors.light.surfaceVariant,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.md,
        marginHorizontal: spacing.xs,
    },

    skeletonCard_dark: {
        backgroundColor: colors.dark.surfaceVariant,
    },

    // Empty state
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },

    emptyStateTitle: {
        ...typography.h3,
        color: colors.light.text.primary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },

    emptyStateTitle_dark: {
        color: colors.dark.text.primary,
    },

    emptyStateDescription: {
        ...typography.body2,
        color: colors.light.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
    },

    emptyStateDescription_dark: {
        color: colors.dark.text.secondary,
    },

    // Accessibility improvements
    cardTouchable: {
        borderRadius: borderRadius.xl,
    },

    // Focus states for better accessibility
    cardFocused: {
        borderColor: colors.light.primary,
        borderWidth: 2,
    },

    cardFocused_dark: {
        borderColor: colors.dark.primary,
    },
});

export default buttonStyles;
