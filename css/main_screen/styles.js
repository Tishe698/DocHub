// Modern Main Screen Styles - Complete Redesign 2025
import { StyleSheet, Dimensions } from "react-native";
import { colors, spacing, borderRadius, typography, shadows } from "../../theme";

const { width: screenWidth } = Dimensions.get('window');
// Карточки теперь занимают почти всю ширину экрана с отступами
const cardWidth = screenWidth - (spacing.xl * 2); // Одна колонка, максимальная ширина

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

    // Header section with gradient background
    headerGradient: {
        marginTop: spacing.md,
        marginHorizontal: spacing.lg,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.xl,
        ...shadows.md,
        overflow: 'hidden',
    },

    header: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
    },

    appTitle: {
        ...typography.h1,
        color: colors.light.primary,
        fontWeight: '700',
        marginBottom: spacing.xs,
        textAlign: 'center',
    },

    appTitleGradient: {
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        fontSize: 36,
        fontWeight: '800',
        letterSpacing: 1,
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

    appSubtitleGradient: {
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.5,
    },

    appSubtitle_dark: {
        color: colors.dark.text.secondary,
    },

    // Cards grid
    cardsContainer: {
        flex: 1,
        paddingBottom: spacing.md,
    },

    cardsContainer_dark: {
        backgroundColor: 'transparent',
    },

    // Modern medical card design with gradients
    card: {
        width: cardWidth,
        borderRadius: borderRadius.xl,
        marginBottom: 0, // Убираем вертикальный отступ, используем ItemSeparatorComponent
        marginHorizontal: 0, // Убираем горизонтальный отступ, используем padding FlatList
        minHeight: 180, // Более компактная высота
        maxHeight: 220, // Ограничение максимальной высоты
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: colors.light.surface,
        borderWidth: 1,
        borderColor: colors.light.border,
        ...shadows.lg,
    },

    card_dark: {
        // No border in dark mode
    },

    // Background image for cards with improved styling
    cardBackgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: borderRadius.xl,
        width: '100%',
        height: '100%',
        opacity: 0.85, // Более естественный вид
    },

    // Enhanced overlay for text readability with gradient
    cardOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Более прозрачный
        borderRadius: borderRadius.xl,
    },

    // Gradient overlay for better visual appeal
    cardGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: borderRadius.xl,
        backgroundColor: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
    },

    // Pressed state with modern animation
    cardPressed: {
        transform: [{ scale: 0.96 }],
        ...shadows.sm,
    },

    // Icon container - minimal
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },

    iconContainer_dark: {
        // No background in dark mode
    },

    // Enhanced icon styles for better visibility
    icon: {
        width: 60, // Увеличенный размер
        height: 60,
        borderRadius: borderRadius.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
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
        ...typography.h3, // Более крупный размер
        fontWeight: '700',
        color: colors.light.text.primary,
        textAlign: 'center',
        marginTop: spacing.md,
        marginBottom: spacing.xs,
        lineHeight: 24,
        letterSpacing: 0.5,
    },

    cardTitle_dark: {
        color: colors.dark.text.primary,
    },

    cardDescription: {
        ...typography.body2, // Более читаемый размер
        color: colors.light.text.secondary,
        textAlign: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.md,
        lineHeight: 20,
        letterSpacing: 0.25,
        fontWeight: '500',
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

    // Enhanced status badge with pulse effect
    statusBadgeInner: {
        width: 4,
        height: 4,
        borderRadius: borderRadius.full,
        backgroundColor: 'rgba(255,255,255,0.8)',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -2 }, { translateY: -2 }],
    },

    // Dark mode medical emoji
    medicalEmoji_dark: {
        textShadowColor: colors.dark.shadow,
    },

    // Decorative medical pattern
    decorativePattern: {
        position: 'absolute',
        bottom: spacing.sm,
        right: spacing.sm,
        opacity: 0.1,
    },

    patternIcon: {
        fontSize: 20,
        color: colors.light.surface,
        textShadowColor: colors.light.shadow,
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },

    // Enhanced glass effect for icon containers
    iconContainerGlass: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },

    iconContainerGlass_dark: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
    },

    // Enhanced card title with better contrast on gradients
    cardTitleEnhanced: {
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    cardTitleEnhanced_dark: {
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },

    // Enhanced card description with better readability
    cardDescriptionEnhanced: {
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
        fontWeight: '500',
        letterSpacing: 0.25,
        opacity: 0.9,
    },

    cardDescriptionEnhanced_dark: {
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        opacity: 0.85,
    },

    // Enhanced text styles for images
    cardTitleOnImage: {
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.9)',
        textShadowOffset: { width: 0, height: 3 },
        textShadowRadius: 6,
        fontWeight: '800',
        fontSize: 22, // Увеличенный размер
        letterSpacing: 0.5,
    },

    cardTitleOnImage_dark: {
        textShadowColor: 'rgba(0,0,0,0.9)',
    },

    cardDescriptionOnImage: {
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        fontWeight: '600',
        fontSize: 14, // Более читаемый размер
        opacity: 0.95,
        letterSpacing: 0.25,
    },

    cardDescriptionOnImage_dark: {
        opacity: 0.9,
    },

    // Decorative elements for enhanced visual appeal
    cardDecorativeElement: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        width: 32,
        height: 32,
        borderRadius: borderRadius.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
    },

    decorativeIcon: {
        fontSize: 16,
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },

    // Enhanced card border with gradient effect
    cardBorderGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: borderRadius.xl,
        padding: 1,
        backgroundColor: 'transparent',
    },

    cardInner: {
        flex: 1,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
    },

    // Hover/press effect for better feedback
    cardHoverEffect: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
});

export default buttonStyles;
