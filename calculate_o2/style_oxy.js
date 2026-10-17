// style_oxy.js — стили кислородных экранов на токенах темы (цвета только из theme.colors).
//
//   const styles = useOxyStyles();          — в компоненте (пересоздаётся при смене темы)
//   makeOxyStyles(theme)                    — фабрика для useThemedStyles
// Меню раздела (tabnav_oxy.js) построено на main_screen/MenuCard и эти стили не использует.
import { StyleSheet } from 'react-native';
import { useThemedStyles } from '../theme/index';

export const makeOxyStyles = ({ colors, spacing, radius, typography, isDark }) => ({
  // ----- Общие для экранов расчётов -----
  intro: { marginBottom: spacing.lg },
  // Строка полей: переносится при узком экране и крупном шрифте
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  col: {
    flexGrow: 1,
    flexBasis: 140,
    marginHorizontal: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.md,
  },
  action: { flexGrow: 1, margin: spacing.xs },
  paragraph: { marginTop: spacing.xs },
  formulaLine: {
    ...typography.body,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    marginTop: spacing.xs,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.xs },
  bullet: { marginRight: spacing.sm },
  bulletText: { flex: 1 },

  // Показатели результата (ИВЛ): плитки переносятся, высота по содержимому
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  stat: {
    flexGrow: 1,
    flexBasis: 140,
    margin: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: isDark ? colors.surface : colors.surfaceAlt,
  },
  statBad: {
    borderColor: colors.danger,
    borderWidth: 2,
    backgroundColor: colors.dangerSoft,
  },
  statValue: { fontVariant: ['tabular-nums'], marginTop: 2 },
  statBadge: { marginTop: spacing.xs },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
});

export function useOxyStyles() {
  return useThemedStyles(makeOxyStyles);
}
