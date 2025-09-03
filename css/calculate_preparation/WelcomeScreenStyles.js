import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.light.background,
    paddingTop: spacing.xl,
  },
  container_dark: {
    backgroundColor: colors.dark.background,
  },
  welcomeText: {
    ...typography.h3,
    textAlign: 'center',
    color: colors.light.text.primary,
    marginBottom: spacing.lg,
  },
  welcomeText_dark: {
    color: colors.dark.text.primary,
  },
  subtitle: {
    ...typography.body1,
    textAlign: 'center',
    color: colors.light.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  subtitle_dark: {
    color: colors.dark.text.secondary,
  },

});

export default styles;